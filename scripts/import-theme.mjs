// Imports a reference app's design tokens into a repobot.theme.json theme
// fragment (Plan 2 A1). Lovable/shadcn apps carry their whole visual identity
// in ~25 CSS custom properties in one stylesheet; this reads them and maps
// them onto the theme contract (web/design-system/src/theme/themeConfig.ts),
// so a rebuild of the app starts already-branded.
//
// Value shapes handled (shadcn conventions past and present):
// - HSL triplets:  --primary: 174 42% 34%;           (used via hsl(var(--primary)))
// - literals:      --primary: #d95d43; / rgb(...); / hsl(...);
// - oklch:         --primary: oklch(0.685 0.153 21.5);  (Tailwind v4-era shadcn)
// Anything else (var() aliases, gradients, ...) warns and is skipped, and
// source vars with no contract field are reported as dropped so the gaps stay
// visible. Dark values come from the stylesheet's `.dark { }` block (shadcn
// convention) or from a second file via --dark.
//
// The emitted JSON is validated against the contract's own rules (mirrored
// from themeConfig.ts — keep in sync): brand hexes, palette hex/rgb(a),
// radius preset keys. The importer never emits a value the contract would
// warnInvalid-drop.
//
// Usage:
//   node scripts/import-theme.mjs <styles.css> [--write] [--dark auto|none|<file>] [repoRoot]
//
// Default mode prints the theme fragment and a mapping report; --write merges
// the fragment into <repoRoot>/repobot.theme.json (non-theme fields
// preserved) and prints a diff summary.

import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

/* ----------------------------------------------------------------- */
/* CSS custom-property extraction                                      */
/* ----------------------------------------------------------------- */

/** Bodies of every block whose opener matches `selectorPattern` (which must
 * end at the opening "{"), brace-matched so nested constructs (calc(), media
 * queries) can't truncate a block early. */
function extractBlockBodies(css, selectorPattern) {
    const bodies = []
    const pattern = new RegExp(selectorPattern.source, "g")
    while (true) {
        const match = pattern.exec(css)
        if (match === null) return bodies
        const bodyStart = pattern.lastIndex
        let depth = 1
        let cursor = bodyStart
        while (cursor < css.length && depth > 0) {
            if (css[cursor] === "{") depth++
            else if (css[cursor] === "}") depth--
            cursor++
        }
        if (depth !== 0) return bodies
        bodies.push(css.slice(bodyStart, cursor - 1))
        pattern.lastIndex = cursor
    }
}

/** `--name: value;` declarations from a block body (comments already stripped). */
function parseCustomProperties(blockBody) {
    const vars = new Map()
    for (const declaration of blockBody.split(";")) {
        const match = declaration.match(/^\s*(--[\w-]+)\s*:\s*([\s\S]*?)\s*$/)
        if (match) vars.set(match[1], match[2])
    }
    return vars
}

function mergeInto(target, source) {
    for (const [key, value] of source) target.set(key, value)
}

/**
 * The theme-bearing custom property sets in a shadcn-style stylesheet:
 * `light` from :root, `dark` from .dark, and `theme` from @theme blocks
 * (Tailwind v4 files declare --font-sans there, not in :root).
 */
export function parseThemeCss(css) {
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "")
    const lightVars = new Map()
    for (const body of extractBlockBodies(stripped, /:root\s*\{/))
        mergeInto(lightVars, parseCustomProperties(body))
    const darkVars = new Map()
    // `.dark\s*\{` can't match `.darkness` or the `@custom-variant dark
    // (&:is(.dark *));` declaration — neither continues with a block.
    for (const body of extractBlockBodies(stripped, /\.dark\s*\{/))
        mergeInto(darkVars, parseCustomProperties(body))
    const themeVars = new Map()
    for (const body of extractBlockBodies(stripped, /@theme(?:\s+\w+)?\s*\{/)) {
        mergeInto(themeVars, parseCustomProperties(body))
    }
    return { lightVars, darkVars, themeVars }
}

/* ----------------------------------------------------------------- */
/* Color conversion (everything funnels to sRGB hex / rgba)            */
/* ----------------------------------------------------------------- */

function clamp01(value) {
    return Math.min(1, Math.max(0, value))
}

function linearToSrgb(channel) {
    const clamped = clamp01(channel)
    return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055
}

/** oklch(L C H) → gamma-encoded sRGB channels 0..255 (Björn Ottosson's matrices). */
function oklchToRgb255(L, C, H) {
    const hueRadians = (H * Math.PI) / 180
    const a = C * Math.cos(hueRadians)
    const b = C * Math.sin(hueRadians)
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b
    const s_ = L - 0.0894841775 * a - 1.291485548 * b
    const l = l_ ** 3
    const m = m_ ** 3
    const s = s_ ** 3
    return [
        linearToSrgb(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s) * 255,
        linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s) * 255,
        linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s) * 255,
    ]
}

/** h in degrees, s/l in 0..1 → gamma-encoded sRGB channels 0..255. */
function hslToRgb255(h, s, l) {
    const hueSegment = ((((h % 360) + 360) % 360) / 60) % 6
    const chroma = (1 - Math.abs(2 * l - 1)) * s
    const x = chroma * (1 - Math.abs((hueSegment % 2) - 1))
    const m = l - chroma / 2
    const [r, g, b] =
        hueSegment < 1
            ? [chroma, x, 0]
            : hueSegment < 2
              ? [x, chroma, 0]
              : hueSegment < 3
                ? [0, chroma, x]
                : hueSegment < 4
                  ? [0, x, chroma]
                  : hueSegment < 5
                    ? [x, 0, chroma]
                    : [chroma, 0, x]
    return [(r + m) * 255, (g + m) * 255, (b + m) * 255]
}

function parseAlpha(token) {
    if (token === undefined || token === "") return 1
    if (token.endsWith("%")) return parseFloat(token.slice(0, -1)) / 100
    return parseFloat(token)
}

/** Function arguments in either comma (`r, g, b`) or space (`r g b / a`) syntax. */
function splitColorArgs(inner) {
    if (inner.includes(",")) return inner.split(",").map((part) => part.trim())
    const [channels, alpha] = inner.split("/").map((part) => part.trim())
    const parts = channels.split(/\s+/)
    if (alpha !== undefined) parts.push(alpha)
    return parts
}

function parseRgbChannel(token) {
    if (token.endsWith("%")) return (parseFloat(token.slice(0, -1)) / 100) * 255
    return parseFloat(token)
}

function parsePercent(token) {
    return token.endsWith("%") ? parseFloat(token.slice(0, -1)) / 100 : Number.NaN
}

function parseHue(token) {
    return parseFloat(token.replace(/deg$/, ""))
}

/**
 * Parses one custom-property color value into { rgb: [r, g, b] (0..255),
 * alpha (0..1) }. Handles hex, rgb()/rgba(), hsl()/hsla(), oklch(), and the
 * bare shadcn HSL triplet (`174 42% 34%`). Returns null for anything else
 * (var() aliases, gradients, named colors) — the caller warns and skips.
 */
export function parseColor(rawValue) {
    const value = rawValue.trim().toLowerCase()

    const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/)
    if (hex) {
        const digits =
            hex[1].length === 3
                ? hex[1]
                      .split("")
                      .map((d) => d + d)
                      .join("")
                : hex[1]
        return {
            rgb: [
                parseInt(digits.slice(0, 2), 16),
                parseInt(digits.slice(2, 4), 16),
                parseInt(digits.slice(4, 6), 16),
            ],
            alpha: 1,
        }
    }

    const rgb = value.match(/^rgba?\(([\s\S]*)\)$/)
    if (rgb) {
        const parts = splitColorArgs(rgb[1])
        if (parts.length < 3 || parts.length > 4) return null
        const channels = parts.slice(0, 3).map(parseRgbChannel)
        if (channels.some((channel) => Number.isNaN(channel))) return null
        return { rgb: channels, alpha: parseAlpha(parts[3]) }
    }

    const hsl = value.match(/^hsla?\(([\s\S]*)\)$/)
    if (hsl) {
        const parts = splitColorArgs(hsl[1])
        if (parts.length < 3 || parts.length > 4) return null
        const s = parsePercent(parts[1])
        const l = parsePercent(parts[2])
        if (Number.isNaN(s) || Number.isNaN(l)) return null
        return { rgb: hslToRgb255(parseHue(parts[0]), s, l), alpha: parseAlpha(parts[3]) }
    }

    const oklch = value.match(/^oklch\(([\s\S]*)\)$/)
    if (oklch) {
        const parts = splitColorArgs(oklch[1])
        if (parts.length < 3 || parts.length > 4) return null
        let L = parseFloat(parts[0])
        if (parts[0].endsWith("%")) L = parseFloat(parts[0]) / 100
        let C = parseFloat(parts[1])
        if (parts[1].endsWith("%")) C = (parseFloat(parts[1]) / 100) * 0.4
        const H = parseHue(parts[2])
        if ([L, C, H].some((component) => Number.isNaN(component))) return null
        return { rgb: oklchToRgb255(L, C, H), alpha: parseAlpha(parts[3]) }
    }

    // The bare shadcn HSL triplet: `--primary: 174 42% 34%;` (consumed as
    // hsl(var(--primary))). Commas optional, alpha via `/` optional.
    const triplet = splitColorArgs(value)
    if (triplet.length === 3 || triplet.length === 4) {
        const s = parsePercent(triplet[1])
        const l = parsePercent(triplet[2])
        const h = parseHue(triplet[0])
        if (!Number.isNaN(h) && !Number.isNaN(s) && !Number.isNaN(l)) {
            return { rgb: hslToRgb255(h, s, l), alpha: parseAlpha(triplet[3]) }
        }
    }

    return null
}

/** Contract-shaped color string: hex when opaque, normalized rgba() otherwise. */
export function formatColor({ rgb, alpha }) {
    const [r, g, b] = rgb.map((channel) => Math.round(clamp01(channel / 255) * 255))
    if (alpha >= 0.9995) {
        return `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`
    }
    // String() keeps the contract's `0?\.\d+` alpha shape (0.1, 0.28, ...).
    return `rgba(${r}, ${g}, ${b}, ${Math.round(alpha * 1000) / 1000})`
}

/* ----------------------------------------------------------------- */
/* Contract rules mirrored from themeConfig.ts (keep in sync)          */
/* ----------------------------------------------------------------- */

const HEX_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/
const RGBA_PATTERN = /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)$/

/** Radius presets' md values in px (themeConfig RADIUS_PRESETS); shadcn's
 * --radius is the component base radius, so it maps to the nearest md. */
const RADIUS_PRESET_MD = { sharp: 4, soft: 10, round: 16 }

/**
 * The emitted fragment must pass the contract's own warnInvalid rules; this
 * replicates them (themeConfig.ts is TypeScript behind a build, so the tool
 * mirrors rather than imports). Returns a list of problems — empty means the
 * contract would accept every value.
 */
export function validateThemeFragment(theme) {
    const problems = []
    for (const key of ["primary", "primaryDark"]) {
        const value = theme.brand?.[key]
        if (value !== undefined && !HEX_PATTERN.test(value)) {
            problems.push(`brand.${key} must be a hex color, got ${JSON.stringify(value)}`)
        }
    }
    for (const [key, value] of Object.entries(theme.palette ?? {})) {
        if (key === "nav") {
            for (const [navKey, navValue] of Object.entries(value ?? {})) {
                if (!NAV_KEY_ORDER.includes(navKey)) {
                    problems.push(`palette.nav.${navKey} is not a contract nav field`)
                } else if (!HEX_PATTERN.test(navValue) && !RGBA_PATTERN.test(navValue)) {
                    problems.push(
                        `palette.nav.${navKey} must be hex or rgb()/rgba(), got ${JSON.stringify(navValue)}`,
                    )
                }
            }
            continue
        }
        if (key === "charts" || key === "chartsDark") {
            if (!Array.isArray(value) || value.length < 5 || !value.every(isContractColor)) {
                problems.push(`palette.${key} must be an array of at least 5 hex/rgb(a) colors`)
            }
            continue
        }
        if (!HEX_PATTERN.test(value) && !RGBA_PATTERN.test(value)) {
            problems.push(`palette.${key} must be hex or rgb()/rgba(), got ${JSON.stringify(value)}`)
        }
    }
    if (theme.radius !== undefined && !(theme.radius in RADIUS_PRESET_MD)) {
        problems.push(
            `radius must be one of ${Object.keys(RADIUS_PRESET_MD).join("/")}, got ${JSON.stringify(theme.radius)}`,
        )
    }
    if (
        theme.fontFamily !== undefined &&
        (typeof theme.fontFamily !== "string" || theme.fontFamily.trim() === "")
    ) {
        problems.push(`fontFamily must be a non-empty string, got ${JSON.stringify(theme.fontFamily)}`)
    }
    return problems
}

function isContractColor(value) {
    return HEX_PATTERN.test(value) || RGBA_PATTERN.test(value)
}

/* ----------------------------------------------------------------- */
/* The shadcn → contract mapping                                       */
/* ----------------------------------------------------------------- */

/* Ordered so the palette object below assembles in the contract's canonical
 * key order. `fallbackFor`: only map when that var was absent (popover is
 * card's twin). `skipIfEquals`: shadcn's --accent is a hover wash; when it's
 * just the primary restated, emitting it as surfaceHover would paint hover
 * states in full-strength brand color. `deriveNote` marks vars the contract
 * DERIVES rather than stores (the nav active item comes from the brand
 * accent): equal to its source it's reported as skipped, otherwise dropped
 * with the reason visible. */
const COLOR_MAPPINGS = [
    { source: "--primary", light: "brand.primary", dark: "brand.primaryDark", hexOnly: true },
    { source: "--background", light: "palette.background", dark: "palette.backgroundDark" },
    { source: "--card", light: "palette.surface", dark: "palette.surfaceDark" },
    { source: "--popover", light: "palette.surface", dark: "palette.surfaceDark", fallbackFor: "--card" },
    {
        source: "--accent",
        light: "palette.surfaceHover",
        dark: "palette.surfaceHoverDark",
        skipIfEquals: "--primary",
    },
    { source: "--border", light: "palette.border", dark: "palette.borderDark" },
    { source: "--foreground", light: "palette.textPrimary", dark: "palette.textPrimaryDark" },
    { source: "--muted-foreground", light: "palette.textSecondary", dark: "palette.textSecondaryDark" },
    { source: "--muted", light: "palette.muted", dark: "palette.mutedDark" },
    { source: "--input", light: "palette.input", dark: "palette.inputDark" },
    { source: "--ring", light: "palette.ring", dark: "palette.ringDark" },
    { source: "--destructive", light: "palette.danger", dark: "palette.dangerDark" },
    { source: "--success", light: "palette.success", dark: "palette.successDark" },
    { source: "--warning", light: "palette.warning", dark: "palette.warningDark" },
    { source: "--info", light: "palette.info", dark: "palette.infoDark" },
    { source: "--primary-foreground", light: "palette.accentText", dark: "palette.accentTextDark" },
    { source: "--sidebar", light: "palette.nav.bg", dark: "palette.nav.bgDark" },
    { source: "--nav", light: "palette.nav.bg", dark: "palette.nav.bgDark", fallbackFor: "--sidebar" },
    { source: "--sidebar-foreground", light: "palette.nav.text", dark: "palette.nav.textDark" },
    {
        source: "--nav-foreground",
        light: "palette.nav.text",
        dark: "palette.nav.textDark",
        fallbackFor: "--sidebar-foreground",
    },
    {
        source: "--sidebar-accent-foreground",
        light: "palette.nav.text",
        dark: "palette.nav.textDark",
        fallbackFor: "--sidebar-foreground",
    },
    { source: "--nav-muted", light: "palette.nav.muted", dark: "palette.nav.mutedDark" },
    { source: "--sidebar-accent", light: "palette.nav.hover", dark: "palette.nav.hoverDark" },
    { source: "--sidebar-border", light: "palette.nav.border", dark: "palette.nav.borderDark" },
    { source: "--sidebar-ring", light: "palette.nav.ring", dark: "palette.nav.ringDark" },
    {
        source: "--sidebar-primary",
        skipIfEquals: "--primary",
        deriveNote: "nav active items derive from the brand accent",
    },
    {
        source: "--sidebar-primary-foreground",
        skipIfEquals: "--primary-foreground",
        deriveNote: "on-accent text imports as palette.accentText",
    },
]

const PALETTE_KEY_ORDER = [
    "background",
    "backgroundDark",
    "surface",
    "surfaceDark",
    "surfaceHover",
    "surfaceHoverDark",
    "border",
    "borderDark",
    "textPrimary",
    "textPrimaryDark",
    "textSecondary",
    "textSecondaryDark",
    "muted",
    "mutedDark",
    "input",
    "inputDark",
    "ring",
    "ringDark",
    "danger",
    "dangerDark",
    "success",
    "successDark",
    "warning",
    "warningDark",
    "info",
    "infoDark",
    "accentText",
    "accentTextDark",
]

const NAV_KEY_ORDER = [
    "bg",
    "bgDark",
    "text",
    "textDark",
    "muted",
    "mutedDark",
    "hover",
    "hoverDark",
    "border",
    "borderDark",
    "ring",
    "ringDark",
]

const FONT_PRESET_MATCHERS = [
    ["inter", "inter"],
    ["manrope", "manrope"],
    ["source-serif", "source serif"],
    ["space-grotesk", "space grotesk"],
    ["plex-mono", "ibm plex mono"],
]

const FONT_STACK_MATCHERS = [
    [
        "mono",
        ["ui-monospace", "sfmono-regular", "menlo", "monaco", "consolas", "liberation mono", "monospace"],
    ],
    ["serif", ["ui-serif", "georgia", "cambria", "times new roman", "times", "serif"]],
    ["rounded", ["ui-rounded", "sf pro rounded"]],
    [
        "system",
        [
            "ui-sans-serif",
            "system-ui",
            "-apple-system",
            "segoe ui",
            "roboto",
            "helvetica neue",
            "helvetica",
            "arial",
            "sans-serif",
        ],
    ],
]

function formatPx(value) {
    return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function importRadius(vars, report, warnings) {
    const raw = vars.get("--radius")
    if (raw === undefined) {
        report.push("--radius not found — radius untouched")
        return {}
    }
    const match = raw.trim().match(/^([\d.]+)(px|rem|em)$/)
    if (!match) {
        warnings.push(`--radius: unrecognized length ${JSON.stringify(raw)} — radius untouched`)
        return {}
    }
    const px = parseFloat(match[1]) * (match[2] === "px" ? 1 : 16)
    const distances = Object.entries(RADIUS_PRESET_MD)
        .map(([preset, md]) => ({ preset, md, delta: Math.abs(px - md) }))
        .sort((a, b) => a.delta - b.delta)
    const math = distances.map((d) => `${d.preset} md ${d.md}px Δ${formatPx(d.delta)}`).join(", ")
    report.push(
        `--radius ${raw} = ${formatPx(px)}px → radius = "${distances[0].preset}" (nearest preset: ${math})`,
    )
    return { radius: distances[0].preset }
}

function importFont(lightVars, themeVars, report, warnings) {
    const raw = lightVars.get("--font-sans") ?? themeVars.get("--font-sans")
    if (raw === undefined) {
        report.push("no --font-sans found — fontFamily untouched")
        return {}
    }
    const source = lightVars.has("--font-sans") ? ":root" : "@theme"
    const firstFamily = raw
        .split(",")[0]
        .trim()
        .replace(/^['"]+|['"]+$/g, "")
        .toLowerCase()
    for (const [preset, token] of FONT_PRESET_MATCHERS) {
        if (firstFamily === token || firstFamily.startsWith(`${token} `)) {
            report.push(`--font-sans (${source}) ${raw} → fontFamily = "${preset}" (contract preset)`)
            return { fontFamily: preset }
        }
    }
    for (const [preset, families] of FONT_STACK_MATCHERS) {
        if (families.includes(firstFamily)) {
            report.push(`--font-sans (${source}) ${raw} → fontFamily = "${preset}" (contract preset)`)
            return { fontFamily: preset }
        }
    }
    warnings.push(
        `--font-sans: no close contract font preset for "${firstFamily}" — emitting the raw stack ` +
            `(web-only; native falls back to the system font)`,
    )
    report.push(`--font-sans (${source}) ${raw} → fontFamily = raw stack (no close preset — see warning)`)
    return { fontFamily: raw.trim() }
}

function mapColorSide(vars, sideLabel, fieldKey, values, consumed, report, warnings) {
    for (const mapping of COLOR_MAPPINGS) {
        const raw = vars.get(mapping.source)
        if (raw === undefined) continue
        consumed.add(mapping.source)
        const field = mapping[fieldKey]
        if (mapping.fallbackFor !== undefined && vars.has(mapping.fallbackFor)) {
            report.push(
                `[${sideLabel}] ${mapping.source} ${raw} → skipped (${mapping.fallbackFor} already sets ${field})`,
            )
            continue
        }
        // Vars the contract derives rather than stores: skipped when they
        // restate their source, dropped (with the reason) when they diverge.
        if (mapping.deriveNote !== undefined) {
            const otherRaw = vars.get(mapping.skipIfEquals)
            const other = otherRaw === undefined ? null : parseColor(otherRaw)
            const self = parseColor(raw)
            if (self !== null && other !== null && formatColor(self) === formatColor(other)) {
                report.push(
                    `[${sideLabel}] ${mapping.source} ${raw} → equals ${mapping.skipIfEquals}; ` +
                        `${mapping.deriveNote} — skipped`,
                )
            } else {
                report.push(`[${sideLabel}] ${mapping.source} ${raw} → ${mapping.deriveNote} — dropped`)
            }
            continue
        }
        const color = parseColor(raw)
        if (color === null) {
            warnings.push(
                `[${sideLabel}] ${mapping.source}: unrecognized color ${JSON.stringify(raw)} — skipped`,
            )
            report.push(`[${sideLabel}] ${mapping.source} ${raw} → unrecognized value — skipped (warning)`)
            continue
        }
        const formatted = formatColor(color)
        if (mapping.hexOnly && !formatted.startsWith("#")) {
            warnings.push(
                `[${sideLabel}] ${mapping.source}: ${field} must be a hex but ${JSON.stringify(raw)} ` +
                    `carries alpha — skipped`,
            )
            report.push(
                `[${sideLabel}] ${mapping.source} ${raw} → alpha not allowed on ${field} — skipped (warning)`,
            )
            continue
        }
        if (mapping.skipIfEquals !== undefined) {
            const otherRaw = vars.get(mapping.skipIfEquals)
            const other = otherRaw === undefined ? null : parseColor(otherRaw)
            if (other !== null && formatColor(other) === formatted) {
                report.push(
                    `[${sideLabel}] ${mapping.source} ${raw} → equals ${mapping.skipIfEquals}; ` +
                        `${field} left to the kernel default — skipped`,
                )
                continue
            }
        }
        values[field] = formatted
        report.push(`[${sideLabel}] ${mapping.source} ${raw} → ${field} = ${formatted}`)
    }
}

/* The --chart-1..N family maps onto palette.charts / palette.chartsDark.
 * The contract needs at least 5 series colors and keeps the first 6, so a
 * shorter family warns and leaves the accent-derived ramp untouched. */
function importChartSide(vars, sideLabel, fieldKey, values, consumed, report, warnings) {
    const colors = []
    for (let index = 1; ; index++) {
        const source = `--chart-${index}`
        const raw = vars.get(source)
        if (raw === undefined) break
        consumed.add(source)
        const color = parseColor(raw)
        if (color === null) {
            warnings.push(
                `[${sideLabel}] ${source}: unrecognized color ${JSON.stringify(raw)} — charts untouched`,
            )
            report.push(`[${sideLabel}] ${source} ${raw} → unrecognized value — charts untouched (warning)`)
            return
        }
        colors.push(formatColor(color))
    }
    if (colors.length === 0) return
    if (colors.length < 5) {
        warnings.push(
            `[${sideLabel}] only ${colors.length} --chart-N vars — palette.charts needs at least 5; charts untouched`,
        )
        report.push(
            `[${sideLabel}] --chart-1..${colors.length} → fewer than 5 chart colors — charts untouched (warning)`,
        )
        return
    }
    if (colors.length > 6) {
        warnings.push(`[${sideLabel}] ${colors.length} --chart-N vars — the contract keeps the first 6`)
    }
    values[fieldKey] = colors.slice(0, 6)
    report.push(`[${sideLabel}] --chart-1..${colors.length} → ${fieldKey} = [${values[fieldKey].join(", ")}]`)
}

/**
 * Maps parsed custom-property sets onto the theme contract. Returns
 * { theme, report, warnings }: the theme fragment (only fields the source
 * could express), one report line per source var (mapped, skipped, or
 * "no contract field — dropped"), and the warnings.
 */
export function importTheme({ lightVars, darkVars, themeVars }) {
    const values = {}
    const consumedLight = new Set()
    const consumedDark = new Set()
    const report = []
    const warnings = []

    mapColorSide(lightVars, "light", "light", values, consumedLight, report, warnings)
    mapColorSide(darkVars, "dark", "dark", values, consumedDark, report, warnings)
    importChartSide(lightVars, "light", "palette.charts", values, consumedLight, report, warnings)
    importChartSide(darkVars, "dark", "palette.chartsDark", values, consumedDark, report, warnings)

    Object.assign(values, importRadius(lightVars, report, warnings))
    Object.assign(values, importFont(lightVars, themeVars, report, warnings))
    consumedLight.add("--radius")
    if (lightVars.has("--font-sans")) consumedLight.add("--font-sans")
    if (themeVars.size > 0) {
        report.push(`(@theme declared ${themeVars.size} Tailwind alias vars — not theme tokens, ignored)`)
    }

    for (const [name, raw] of lightVars) {
        if (!consumedLight.has(name)) report.push(`[light] ${name} ${raw} → no contract field — dropped`)
    }
    for (const [name, raw] of darkVars) {
        if (!consumedDark.has(name)) report.push(`[dark] ${name} ${raw} → no contract field — dropped`)
    }
    report.push("not derivable from CSS (left untouched): density, mode, motion, navigation, shell, ui")

    const theme = {}
    const brand = {}
    if (values["brand.primary"] !== undefined) brand.primary = values["brand.primary"]
    if (values["brand.primaryDark"] !== undefined) brand.primaryDark = values["brand.primaryDark"]
    if (Object.keys(brand).length > 0) theme.brand = brand
    if (values.radius !== undefined) theme.radius = values.radius
    if (values.fontFamily !== undefined) theme.fontFamily = values.fontFamily
    const palette = {}
    for (const key of PALETTE_KEY_ORDER) {
        if (values[`palette.${key}`] !== undefined) palette[key] = values[`palette.${key}`]
    }
    const nav = {}
    for (const key of NAV_KEY_ORDER) {
        if (values[`palette.nav.${key}`] !== undefined) nav[key] = values[`palette.nav.${key}`]
    }
    if (Object.keys(nav).length > 0) palette.nav = nav
    if (values["palette.charts"] !== undefined) palette.charts = values["palette.charts"]
    if (values["palette.chartsDark"] !== undefined) palette.chartsDark = values["palette.chartsDark"]
    if (Object.keys(palette).length > 0) theme.palette = palette
    return { theme, report, warnings }
}

/* ----------------------------------------------------------------- */
/* --write merge                                                       */
/* ----------------------------------------------------------------- */

/**
 * Merges a fragment into an existing repobot.theme.json, preserving every
 * non-theme field ($comment, density, mode, navigation, shell, ui, ...) and
 * any palette keys the import didn't produce (hand-tuned shadows survive a
 * re-import). Returns { merged, diff } with one diff line per changed leaf.
 */
export function mergeThemeFragment(existing, fragment) {
    const merged = { ...existing }
    const diff = []
    const replaceScalar = (key) => {
        if (fragment[key] === undefined) return
        if (existing[key] === fragment[key]) {
            diff.push(`${key}: unchanged (${fragment[key]})`)
        } else {
            diff.push(
                `${key}: ${existing[key] === undefined ? "added" : JSON.stringify(existing[key])} → ${JSON.stringify(fragment[key])}`,
            )
        }
        merged[key] = fragment[key]
    }
    const mergeGroup = (key) => {
        if (fragment[key] === undefined) return
        const group = { ...(existing[key] ?? {}) }
        for (const [field, value] of Object.entries(fragment[key])) {
            if (group[field] === value) {
                diff.push(`${key}.${field}: unchanged (${JSON.stringify(value)})`)
            } else {
                diff.push(
                    `${key}.${field}: ${group[field] === undefined ? "added" : JSON.stringify(group[field])} → ${JSON.stringify(value)}`,
                )
            }
            group[field] = value
        }
        merged[key] = group
    }
    mergeGroup("brand")
    replaceScalar("radius")
    replaceScalar("fontFamily")
    mergeGroup("palette")
    return { merged, diff }
}

/* ----------------------------------------------------------------- */
/* CLI                                                                 */
/* ----------------------------------------------------------------- */

const USAGE =
    "Usage: node scripts/import-theme.mjs <styles.css> [--write] [--dark auto|none|<file>] [repoRoot]"

function parseArgs(argv) {
    const positional = []
    let write = false
    let dark = "auto"
    for (let index = 0; index < argv.length; index++) {
        const arg = argv[index]
        if (arg === "--write") {
            write = true
        } else if (arg === "--dark") {
            dark = argv[index + 1] !== undefined && !argv[index + 1].startsWith("--") ? argv[++index] : "auto"
        } else if (arg.startsWith("--")) {
            throw new Error(`unknown flag ${arg}`)
        } else {
            positional.push(arg)
        }
    }
    if (positional.length < 1 || positional.length > 2) throw new Error("expected <styles.css> [repoRoot]")
    return { stylesPath: positional[0], repoRoot: positional[1], write, dark }
}

function main() {
    let args
    try {
        args = parseArgs(process.argv.slice(2))
    } catch (error) {
        console.error(`[import-theme] ${error.message}\n${USAGE}`)
        process.exit(1)
    }
    const repoRoot = args.repoRoot ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

    let css
    try {
        css = readFileSync(args.stylesPath, "utf8")
    } catch {
        console.error(`[import-theme] cannot read ${args.stylesPath}`)
        process.exit(1)
    }
    const { lightVars, darkVars: fileDarkVars, themeVars } = parseThemeCss(css)
    if (lightVars.size === 0) {
        console.error(`[import-theme] no :root custom properties found in ${args.stylesPath}`)
        process.exit(1)
    }

    let darkVars = fileDarkVars
    if (args.dark === "none") {
        darkVars = new Map()
    } else if (args.dark !== "auto") {
        let darkCss
        try {
            darkCss = readFileSync(args.dark, "utf8")
        } catch {
            console.error(`[import-theme] cannot read --dark file ${args.dark}`)
            process.exit(1)
        }
        const parsed = parseThemeCss(darkCss)
        // A dark-only file may carry its values in :root or in a .dark block.
        darkVars = parsed.darkVars.size > 0 ? parsed.darkVars : parsed.lightVars
    }

    const { theme, report, warnings } = importTheme({ lightVars, darkVars, themeVars })

    // Defense in depth: never emit a value the contract would reject. The
    // converters produce contract-shaped values by construction, so a problem
    // here is a bug — say so loudly rather than writing it into the theme.
    for (const problem of validateThemeFragment(theme)) {
        console.warn(`[import-theme] BUG: emitted value failed contract validation: ${problem}`)
    }

    console.log(
        `[import-theme] ${args.stylesPath}: ${lightVars.size} :root vars, ` +
            `${darkVars.size} dark vars (${args.dark === "auto" ? ".dark block" : args.dark})\n`,
    )
    console.log("Mapping report:")
    for (const line of report) console.log(`  ${line}`)
    for (const warning of warnings) console.warn(`[import-theme] warn: ${warning}`)
    console.log("\nrepobot.theme.json fragment:")
    console.log(JSON.stringify(theme, null, 4))

    if (!args.write) {
        console.log("\n(dry run — pass --write to merge this into repobot.theme.json)")
        return
    }

    const themePath = path.join(repoRoot, "repobot.theme.json")
    let existing = {}
    try {
        existing = JSON.parse(readFileSync(themePath, "utf8"))
    } catch {
        console.warn(`[import-theme] no readable ${themePath} — creating it`)
    }
    const { merged, diff } = mergeThemeFragment(existing, theme)
    writeFileSync(themePath, `${JSON.stringify(merged, null, 4)}\n`)
    console.log(`\n[import-theme] wrote ${themePath} — diff summary:`)
    for (const line of diff) console.log(`  ${line}`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main()
}
