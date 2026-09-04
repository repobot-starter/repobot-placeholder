import activePackJson from "../../../../packs/active.json"
import themeJson from "../../../../repobot.theme.json"
import { runtimeSiteDocument } from "./runtimeSiteDocuments"

/**
 * Resolves the root `repobot.theme.json` contract into the concrete value
 * sets `tokens.css.ts` feeds to vanilla-extract's `createTheme`.
 *
 * The contract is deliberately tiny (brand color, radius, density, font,
 * mode) so editing it is trivially safe for agents and users; everything
 * else derives here. The optional `palette` block widens that vocabulary to
 * the full surface identity — page background, surfaces, borders, text,
 * status colors, focus ring, and the shadow ramp (free-form strings, so
 * bevel/hard-stroke identities stay expressible) — and `motion` picks the
 * transition clock. Invalid values fall back to kernel defaults with a
 * build-time warning instead of failing the build.
 *
 * Backward compatibility: with no `palette`/`motion` the resolved token
 * values are byte-identical to the pre-palette kernel (pinned by
 * web/app/tests/Theme/themePalette.test.ts).
 */

export type ThemeRadiusPreset = "sharp" | "soft" | "round"
export type ThemeDensityPreset = "compact" | "comfortable" | "spacious"
export type ThemeConfiguredMode = "light" | "dark" | "system"
/** Transition clock: `smooth` is the kernel default, `snappy` tightens it,
 * `instant` zeroes durations (retro/terminal identities). */
export type ThemeMotionPreset = "smooth" | "snappy" | "instant"

/* App-chrome presets (the `ui` block): how tables, forms, errors, and
 * loaders present across the app. Components read the resolved `uiConfig`
 * as their default and accept per-instance prop overrides — change the
 * contract to restyle the whole app, never fork the components. */
export type UiTableStyle = "minimalist" | "standard" | "detailed"
export type UiTablePagination = "loadMore" | "pages"
export type UiFormPresentation = "modal" | "inline" | "page"
export type UiFormWidth = "skinny" | "normal" | "wide"
export type UiErrorPresentation = "modal" | "corner"
export type UiLoaderStyle = "gate" | "progressive"
/* Modal chrome: how the generic Dialog's "modal" presentation floats —
 * the classic centered card, a right-edge sheet, or a fullscreen takeover.
 * The "page" form presentation is its own treatment and ignores this. */
export type UiModalChrome = "centered" | "sheet" | "takeover"
/* Auth-surface layout: the centered card on the themed backdrop, the
 * split brand-panel (AuthShell), or the bare full-bleed minimal card. */
export type UiAuthLayout = "centered" | "split" | "bare"
/* EmptyState voice: the standard read, an illustrated framed hero, the
 * quiet text-only whisper, or the CTA-led action-forward read. */
export type UiEmptyVoice = "standard" | "illustrated" | "quiet" | "actionForward"
/* Toast host: where transient notifications stack, and how each card
 * dresses (tone edge bar, solid inverse card, or soft tone-tinted fill). */
export type UiToastPosition = "bottomRight" | "topRight" | "bottomCenter"
export type UiToastStyle = "edge" | "solid" | "soft"

export interface RepobotUiConfig {
    table?: {
        /** Visual weight: hairline minimalist, standard, or dense detailed. */
        style?: UiTableStyle
        /** "loadMore" appends via a button; "pages" gives prev/next + page size. */
        pagination?: UiTablePagination
    } | null
    forms?: {
        /** CRUD forms in a centered dialog, an in-flow card on the page, or a routed full page with a close X. */
        presentation?: UiFormPresentation
        width?: UiFormWidth
    } | null
    errors?: {
        /** Global errors as a centered stacking modal, or a bottom-right stack. */
        presentation?: UiErrorPresentation
    } | null
    loaders?: {
        /** "gate" swaps the whole page for a spinner until ready; "progressive" shows per-region skeletons. */
        style?: UiLoaderStyle
    } | null
    modals?: {
        /** How Dialog's "modal" presentation floats: centered card, right sheet, or fullscreen takeover. */
        chrome?: UiModalChrome
    } | null
    auth?: {
        /** Sign-in surface layout: centered card, split brand panel, or bare full-bleed minimal. */
        layout?: UiAuthLayout
    } | null
    empty?: {
        /** EmptyState voice: standard, illustrated hero, quiet text, or action-forward CTA. */
        voice?: UiEmptyVoice
    } | null
    toasts?: {
        /** Where the toast stack lives on screen. */
        position?: UiToastPosition
        /** Card dressing: tone edge bar, solid inverse, or soft tone tint. */
        style?: UiToastStyle
    } | null
}

/* Marketing-site navigation. The variant names mirror
 * `MarketingShellNavVariant` (web/design-system/src/marketing/MarketingShell.tsx)
 * — the two lists are kept in lockstep by the shell reading its default from
 * the resolved `navigationConfig`. */
export const MARKETING_NAV_VARIANTS = [
    "inline",
    "centered",
    "burger-overlay",
    "full-width",
    "split",
    "pill-links",
    "logo-only",
] as const
export type ThemeNavigationVariant = (typeof MARKETING_NAV_VARIANTS)[number]

/* Dashboard app shell. The variant names mirror `AppShellLayout`
 * (web/design-system/src/components/AppShell.tsx) — kept in lockstep by the
 * shell reading its default from the resolved `shellConfig`. Append-only
 * public vocabulary shared with the setup flow, like the marketing nav
 * variants (docs/shell.md "Shell variants"). */
export const APP_SHELL_VARIANTS = [
    "sidebar",
    "top-nav",
    "minimal",
    "sidebar-inset",
    "sidebar-topbar",
    "sidebar-only",
    "logo-rail",
] as const
export type ThemeShellVariant = (typeof APP_SHELL_VARIANTS)[number]

/* How the shell relates to page content: `full` fills the viewport with the
 * standard gutter, `centered` constrains pages to a readable column,
 * `flush` hands the page the raw region (dense tools, canvases). */
export const APP_SHELL_CONTENT_MODES = ["full", "centered", "flush"] as const
export type ThemeShellContentMode = (typeof APP_SHELL_CONTENT_MODES)[number]

/**
 * The optional `palette.nav` sub-block: the shell sidebar/top-nav identity,
 * in the kernel's navigation token names (which mirror the shadcn
 * `--sidebar-*`/`--nav-*` family). Every entry is a light value with an
 * optional `<name>Dark` override, derived per the palette's dark rules.
 *
 * When `bg` is set, any foreground left unset derives from the bg's
 * luminance (the same `contrastText` rule the accent's on-color uses):
 * `text` is the readable on-color, `muted`/`hover`/`border` are blends
 * between the two. The active item always derives from the brand accent —
 * there is no `active` field on purpose.
 */
export interface RepobotPaletteNavConfig {
    /** Sidebar rail background (defaults to `surface`). */
    bg?: string
    bgDark?: string
    /** Strong nav foreground (hover/active item text; defaults from bg luminance). */
    text?: string
    textDark?: string
    /** Resting nav item text (defaults to a 40% blend of text toward bg). */
    muted?: string
    mutedDark?: string
    /** Hover/accent wash behind nav items (defaults to an 8% blend of bg toward text). */
    hover?: string
    hoverDark?: string
    /** The rail's own border/separator color (defaults to `border`). */
    border?: string
    borderDark?: string
    /** Focus ring inside the nav (defaults to the accent). */
    ring?: string
    ringDark?: string
}

/**
 * The optional `palette` block: the full surface identity of the app, in the
 * kernel's own token names (which mirror the platform dashboard's
 * vocabulary — appBg is `background`, muted text is `textSecondary`). Every
 * entry is a light value with an optional `<name>Dark` override; when the
 * override is absent the dark value derives (hexes blend toward the kernel
 * dark counterpart, shadows inherit the light string — they carry their own
 * color). The accent trio stays with `brand.primary`/`primaryDark`.
 *
 * Colors accept hex or rgb()/rgba(); shadows are free-form strings,
 * shape-validated (never enumerated) so hard inset-stroke bevels and other
 * art-directed elevations remain expressible. `charts` is an array of 5–6
 * colors (a 5-color palette cycles into the 6th slot).
 */
export interface RepobotPaletteConfig {
    /** Page background behind every surface. */
    background?: string
    backgroundDark?: string
    /** Card/panel surface. */
    surface?: string
    surfaceDark?: string
    /** Hover wash on surfaces; `ring` defaults to this when unset. */
    surfaceHover?: string
    surfaceHoverDark?: string
    border?: string
    borderDark?: string
    textPrimary?: string
    textPrimaryDark?: string
    /** Muted/secondary text. */
    textSecondary?: string
    textSecondaryDark?: string
    /** Muted *surface* (subtle fills like the neutral badge); defaults to `surfaceHover`. */
    muted?: string
    mutedDark?: string
    /** Form-control border (Input/TextArea/Select); defaults to `border`. */
    input?: string
    inputDark?: string
    /** Focus-ring wash on inputs (the `0 0 0 3px` halo). */
    ring?: string
    ringDark?: string
    danger?: string
    dangerDark?: string
    dangerSurface?: string
    dangerSurfaceDark?: string
    success?: string
    successDark?: string
    successSurface?: string
    successSurfaceDark?: string
    warning?: string
    warningDark?: string
    warningSurface?: string
    warningSurfaceDark?: string
    info?: string
    infoDark?: string
    infoSurface?: string
    infoSurfaceDark?: string
    /** Text on the solid accent (primary Button); defaults to the contrast derivation. */
    accentText?: string
    accentTextDark?: string
    /** Modal/drawer backdrop. */
    overlay?: string
    overlayDark?: string
    skeleton?: string
    skeletonDark?: string
    /** Shell sidebar/top-nav identity (see RepobotPaletteNavConfig). */
    nav?: RepobotPaletteNavConfig | null
    /** Chart series colors, 5–6 entries; defaults to the accent-derived ramp. */
    charts?: string[]
    chartsDark?: string[]
    /** Elevation ramp — CSS box-shadow strings, e.g. "0 8px 24px rgba(15, 18, 24, 0.12)" or "none". */
    shadowSm?: string
    shadowSmDark?: string
    shadowMd?: string
    shadowMdDark?: string
    shadowLg?: string
    shadowLgDark?: string
    shadowXl?: string
    shadowXlDark?: string
}

export interface RepobotThemeConfig {
    /**
     * The pack this document styles — the key `packs/active.json` carried
     * when the document was written (every writer stamps it: the platform's
     * compose/remix engines, panel theme edits, template-flip seeding, and
     * the kernel's own pack switch). Templates are FULLY isolated
     * style-wise: a document stamped for another pack is treated as absent
     * (the default theme, with a console warning), so one pack's look can
     * never bleed into another across a template flip. Unstamped documents
     * (legacy projects, the pristine kernel default) resolve normally.
     */
    pack?: string
    brand?: {
        /** Accent color for the light theme (hex). Dark derives unless primaryDark is set. */
        primary?: string
        /** Accent color for the dark theme (hex). */
        primaryDark?: string
    } | null
    radius?: ThemeRadiusPreset
    density?: ThemeDensityPreset
    /** A preset key ("system" | "serif" | "rounded" | "mono") or a raw CSS font-family stack. */
    fontFamily?: string
    /** Display stack for headline moments; a preset key or raw stack. Defaults to Manrope. */
    displayFontFamily?: string
    /** Surface-treatment character: "plain" | "soft" | "aurora" | "luxe". See ThemeCharacterPreset. */
    character?: string
    mode?: ThemeConfiguredMode
    motion?: ThemeMotionPreset
    palette?: RepobotPaletteConfig | null
    navigation?: {
        /** Default marketing-site nav treatment (`MarketingShell`); an explicit `shell.nav.variant` wins. */
        variant?: ThemeNavigationVariant
    } | null
    shell?: {
        /** Default dashboard shell treatment (`AppShell`); an explicit `layout` prop or manifest `dashboard.shell.variant` wins. */
        variant?: ThemeShellVariant
        /** How pages relate to the shell: gutter (`full`), readable column (`centered`), or raw region (`flush`). */
        content?: ThemeShellContentMode
    } | null
    ui?: RepobotUiConfig | null
}

/* ----------------------------------------------------------------- */
/* Color math                                                          */
/* ----------------------------------------------------------------- */

const HEX_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

function isHexColor(value: unknown): value is string {
    return typeof value === "string" && HEX_PATTERN.test(value)
}

function hexToRgb(hex: string): [number, number, number] {
    const normalized = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex
    return [
        parseInt(normalized.slice(1, 3), 16),
        parseInt(normalized.slice(3, 5), 16),
        parseInt(normalized.slice(5, 7), 16),
    ]
}

function rgbToHex(rgb: [number, number, number]): string {
    return `#${rgb
        .map((channel) =>
            Math.round(Math.min(255, Math.max(0, channel)))
                .toString(16)
                .padStart(2, "0"),
        )
        .join("")}`
}

/** Blend `color` toward `target` by `amount` (0..1). */
export function mixHex(color: string, target: string, amount: number): string {
    const from = hexToRgb(color)
    const to = hexToRgb(target)
    return rgbToHex([
        from[0] + (to[0] - from[0]) * amount,
        from[1] + (to[1] - from[1]) * amount,
        from[2] + (to[2] - from[2]) * amount,
    ])
}

/** WCAG relative luminance (0 = black, 1 = white). */
export function relativeLuminance(hex: string): number {
    const [r, g, b] = hexToRgb(hex).map((channel) => {
        const scaled = channel / 255
        return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Readable text color for content rendered on `background`. */
export function contrastText(background: string): string {
    return relativeLuminance(background) > 0.45 ? "#071223" : "#ffffff"
}

const RGBA_PATTERN = /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)$/

/** Palette color values: a hex (like `brand.primary`) or an rgb()/rgba() functional. */
export function isCssColor(value: unknown): value is string {
    if (isHexColor(value)) return true
    return typeof value === "string" && RGBA_PATTERN.test(value.trim())
}

/* Shadow strings stay free-form — hard inset strokes are exactly how bevel
 * identities (a Windows-95-style mode) express themselves with zero component
 * forks — so validation checks the SHAPE of a box-shadow list rather than
 * enumerating presets: optional `inset`, x/y lengths (px or bare 0), optional
 * blur/spread, optional color. Layers split on top-level commas only, since
 * rgba()/color-mix() colors carry commas of their own. */
const SHADOW_LENGTH = "-?(?:\\d+(?:\\.\\d+)?px|0)"
const SHADOW_LAYER_PATTERN = new RegExp(
    `^(?:inset\\s+)?${SHADOW_LENGTH}\\s+${SHADOW_LENGTH}(?:\\s+${SHADOW_LENGTH}){0,2}(?:\\s+\\S[^;{}]*)?$`,
)

function splitShadowLayers(value: string): string[] {
    const layers: string[] = []
    let depth = 0
    let start = 0
    for (let index = 0; index < value.length; index++) {
        const char = value[index]
        if (char === "(") depth++
        else if (char === ")") depth = Math.max(0, depth - 1)
        else if (char === "," && depth === 0) {
            layers.push(value.slice(start, index))
            start = index + 1
        }
    }
    layers.push(value.slice(start))
    return layers
}

/** Shape-validates a CSS box-shadow value: "none" or a comma-separated layer list. */
export function isShadowValue(value: unknown): value is string {
    if (typeof value !== "string") return false
    const trimmed = value.trim()
    if (trimmed === "none") return true
    if (trimmed === "" || /[;{}]/.test(trimmed)) return false
    const opens = (trimmed.match(/\(/g) ?? []).length
    const closes = (trimmed.match(/\)/g) ?? []).length
    if (opens !== closes) return false
    return splitShadowLayers(trimmed).every((layer) => SHADOW_LAYER_PATTERN.test(layer.trim()))
}

/* ----------------------------------------------------------------- */
/* Presets                                                             */
/* ----------------------------------------------------------------- */

const RADIUS_PRESETS: Record<ThemeRadiusPreset, { sm: string; md: string; lg: string; pill: string }> = {
    sharp: { sm: "2px", md: "4px", lg: "6px", pill: "999px" },
    soft: { sm: "6px", md: "10px", lg: "14px", pill: "999px" },
    round: { sm: "10px", md: "16px", lg: "22px", pill: "999px" },
}

const DENSITY_PRESETS: Record<
    ThemeDensityPreset,
    { xxs: string; xs: string; sm: string; md: string; lg: string; xl: string; xxl: string }
> = {
    compact: { xxs: "2px", xs: "3px", sm: "6px", md: "10px", lg: "14px", xl: "20px", xxl: "32px" },
    comfortable: { xxs: "2px", xs: "4px", sm: "8px", md: "12px", lg: "16px", xl: "24px", xxl: "40px" },
    spacious: { xxs: "3px", xs: "6px", sm: "10px", md: "16px", lg: "22px", xl: "32px", xxl: "52px" },
}

const SYSTEM_BODY_STACK =
    "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
const MONO_STACK = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace"

const FONT_PRESETS: Record<string, string> = {
    system: SYSTEM_BODY_STACK,
    serif: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
    rounded: `ui-rounded, 'SF Pro Rounded', ${SYSTEM_BODY_STACK}`,
    mono: MONO_STACK,
    // Self-hosted web fonts: @font-face lives in web/app/src/fonts.css with
    // the woff2 files in web/app/public/fonts; native bundles matching TTFs.
    inter: `'Inter', ${SYSTEM_BODY_STACK}`,
    manrope: `'Manrope', ${SYSTEM_BODY_STACK}`,
    "source-serif": "'Source Serif 4', ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
    "space-grotesk": `'Space Grotesk', ${SYSTEM_BODY_STACK}`,
    "plex-mono": `'IBM Plex Mono', ${MONO_STACK}`,
}

/* ----------------------------------------------------------------- */
/* Kernel default palettes (pre-contract values, kept verbatim)        */
/* ----------------------------------------------------------------- */

export interface ThemeColorSet {
    background: string
    surface: string
    surfaceHover: string
    /** Focus-ring wash on inputs; defaults to surfaceHover (its pre-palette behavior). */
    ring: string
    border: string
    textPrimary: string
    textSecondary: string
    /** Muted surface (subtle fills); defaults to surfaceHover. */
    muted: string
    /** Form-control border; defaults to border. */
    input: string
    accent: string
    accentHover: string
    accentText: string
    danger: string
    dangerSurface: string
    success: string
    successSurface: string
    warning: string
    warningSurface: string
    info: string
    infoSurface: string
    overlay: string
    skeleton: string
}

const KERNEL_LIGHT: ThemeColorSet = {
    background: "#f6f7f9",
    surface: "#ffffff",
    surfaceHover: "#eef2f8",
    ring: "#eef2f8",
    border: "#dce1ea",
    textPrimary: "#12161f",
    textSecondary: "#576074",
    muted: "#eef2f8",
    input: "#dce1ea",
    accent: "#1f6feb",
    accentHover: "#1a5fd0",
    accentText: "#ffffff",
    danger: "#b91c1c",
    dangerSurface: "rgba(239, 68, 68, 0.12)",
    success: "#166534",
    successSurface: "rgba(34, 197, 94, 0.16)",
    warning: "#b45309",
    warningSurface: "rgba(245, 158, 11, 0.14)",
    info: "#0369a1",
    infoSurface: "rgba(14, 165, 233, 0.14)",
    overlay: "rgba(15, 18, 24, 0.4)",
    skeleton: "#e5e9f0",
}

const KERNEL_DARK: ThemeColorSet = {
    background: "#17191d",
    surface: "#1e2126",
    surfaceHover: "#262a31",
    ring: "#262a31",
    border: "#2a2f37",
    textPrimary: "#f3f4f6",
    textSecondary: "#b6bcc8",
    muted: "#262a31",
    input: "#2a2f37",
    accent: "#90caf9",
    accentHover: "#a8d5fb",
    accentText: "#071223",
    danger: "#fca5a5",
    dangerSurface: "rgba(239, 68, 68, 0.2)",
    success: "#86efac",
    successSurface: "rgba(34, 197, 94, 0.2)",
    warning: "#fcd34d",
    warningSurface: "rgba(245, 158, 11, 0.2)",
    info: "#7dd3fc",
    infoSurface: "rgba(14, 165, 233, 0.2)",
    overlay: "rgba(0, 0, 0, 0.55)",
    skeleton: "#262a31",
}

/** The elevation ramp. `sm`–`lg` are the pre-contract literals (kept
 * verbatim from tokens.css.ts); `xl` extends the progression for the
 * palette vocabulary — no pre-palette component consumed it. */
export interface ThemeShadowSet {
    sm: string
    md: string
    lg: string
    xl: string
}

const KERNEL_LIGHT_SHADOWS: ThemeShadowSet = {
    sm: "0 2px 8px rgba(15, 18, 24, 0.08)",
    md: "0 8px 24px rgba(15, 18, 24, 0.12)",
    lg: "0 20px 48px rgba(15, 18, 24, 0.18)",
    xl: "0 28px 64px rgba(15, 18, 24, 0.22)",
}

const KERNEL_DARK_SHADOWS: ThemeShadowSet = {
    sm: "0 2px 8px rgba(0, 0, 0, 0.24)",
    md: "0 8px 24px rgba(0, 0, 0, 0.3)",
    lg: "0 20px 48px rgba(0, 0, 0, 0.4)",
    xl: "0 28px 64px rgba(0, 0, 0, 0.48)",
}

/** The transition clock: micro-interactions ride `durationFast`, structural
 * moves (shell collapse, drawers, group expand) ride `durationBase`. */
export interface ThemeMotionSet {
    durationFast: string
    durationBase: string
    easing: string
    easingEmphasis: string
}

const MOTION_PRESETS: Record<ThemeMotionPreset, ThemeMotionSet> = {
    smooth: {
        durationFast: "120ms",
        durationBase: "180ms",
        easing: "ease",
        easingEmphasis: "cubic-bezier(0.2, 0, 0, 1)",
    },
    snappy: {
        durationFast: "80ms",
        durationBase: "140ms",
        easing: "ease-out",
        easingEmphasis: "cubic-bezier(0.2, 0, 0, 1)",
    },
    instant: {
        durationFast: "0ms",
        durationBase: "0ms",
        easing: "linear",
        easingEmphasis: "linear",
    },
}

const KERNEL_DEFAULT_PRIMARY = KERNEL_LIGHT.accent
const KERNEL_DEFAULT_PRIMARY_DARK = KERNEL_DARK.accent

/* ----------------------------------------------------------------- */
/* Resolution                                                          */
/* ----------------------------------------------------------------- */

function warnInvalid(field: string, value: unknown): void {
    // eslint-disable-next-line no-console
    console.warn(
        `[design-system] repobot.theme.json: invalid ${field} ${JSON.stringify(value)}; using default.`,
    )
}

/**
 * The pack-stamp gate (pure form; the module entry below binds the active
 * pack). A document stamped for a FOREIGN pack resolves as if it were
 * absent — the default theme — with a console warning, because templates
 * are fully isolated style-wise: after a template flip, the previous
 * pack's look (its brand, palette, mode) must never wear the new pack.
 * An unstamped document (legacy projects, the pristine kernel default)
 * and a malformed stamp (non-string) resolve normally, as does any
 * document when the active pack is unknown.
 */
export function gateThemeDocumentForPack(
    document: unknown,
    activePackKey: string | undefined,
): RepobotThemeConfig {
    if (typeof document !== "object" || document === null || Array.isArray(document)) {
        return (document ?? {}) as RepobotThemeConfig
    }
    if (themeDocumentForeignForPack(document, activePackKey)) {
        const stamp = (document as { pack?: unknown }).pack
        // eslint-disable-next-line no-console
        console.warn(
            `[design-system] repobot.theme.json is stamped for pack "${String(stamp)}" but ` +
                `"${String(activePackKey)}" is active; using the default theme.`,
        )
        return {}
    }
    return document as RepobotThemeConfig
}

/**
 * Whether the gate above would refuse this document: stamped for a pack
 * other than the active one. Exposed separately (quiet — no warning)
 * because a refused document must not be ACKED as applied either: the
 * live-edit handler (themeHotUpdate.ts) uses this to withhold the
 * visual-applied ack, so the platform's repaint watchdog sees the truth
 * — the look on screen is the gated default, not the write.
 */
export function themeDocumentForeignForPack(document: unknown, activePackKey: string | undefined): boolean {
    if (typeof document !== "object" || document === null || Array.isArray(document)) {
        return false
    }
    const stamp = (document as { pack?: unknown }).pack
    return (
        typeof stamp === "string" &&
        stamp.length > 0 &&
        typeof activePackKey === "string" &&
        activePackKey.length > 0 &&
        stamp !== activePackKey
    )
}

const activePackKey: string | undefined =
    typeof (activePackJson as { key?: unknown }).key === "string"
        ? (activePackJson as { key: string }).key
        : undefined

/** `gateThemeDocumentForPack` bound to this checkout's active pack — the
 * gate every live contract (dev HMR, themeHotUpdate.ts) must pass through,
 * exactly like the build-time import below. */
export function gateThemeDocument(document: unknown): RepobotThemeConfig {
    return gateThemeDocumentForPack(document, activePackKey)
}

/** `themeDocumentForeignForPack` bound to this checkout's active pack. */
export function themeDocumentForeign(document: unknown): boolean {
    return themeDocumentForeignForPack(document, activePackKey)
}

// The deployed overlay outranks the build-time import: the platform's
// web-bundle cache keys on the tree WITHOUT the visual documents and
// republishes a design save by re-stamping the inline overlay over the
// cached bundle (runtimeSiteDocuments.ts). Everything below — the
// structural presets, the mode, the app tokens — resolves from this one
// constant at module init, so a bundle built from an older contract wears
// the deployed one everywhere. Absent the overlay (dev, tests, the
// vanilla-extract build pass, kernels served without the injector) this
// is exactly the import, as before. The static vanilla-extract CSS still
// bakes the built contract; themeHotUpdate.ts re-asserts the overlay's
// custom properties over it at startup.
const rawConfig = gateThemeDocument(runtimeSiteDocument("repobot.theme.json") ?? themeJson)

/** The raw contract as resolved at boot (deployed overlay, else the
 * build-time import). themeHotUpdate.ts re-asserts this resolution over
 * the static vanilla-extract CSS on startup whenever the two can diverge:
 * in dev (the root manifests live outside chokidar, so the compiled
 * .css.ts values can lag a live edit until the next server start) and in
 * production when the overlay is present. */
export const rawThemeContract: RepobotThemeConfig = rawConfig

export function resolveRadiusPreset(config: RepobotThemeConfig): ThemeRadiusPreset {
    const value = config.radius
    if (value === undefined) return "soft"
    if (value in RADIUS_PRESETS) return value
    warnInvalid("radius", value)
    return "soft"
}

/**
 * Whether the contract names a radius at all. The marketing Feel bridge
 * needs the distinction resolveRadiusPreset collapses: an unset radius
 * means "the preset's authored art direction", not "soft" — a square-
 * authored look must stay square until the user actually chooses.
 */
export function radiusPresetIsExplicit(config: RepobotThemeConfig): boolean {
    return config.radius !== undefined && config.radius in RADIUS_PRESETS
}

export function resolveDensityPreset(config: RepobotThemeConfig): ThemeDensityPreset {
    const value = config.density
    if (value === undefined) return "comfortable"
    if (value in DENSITY_PRESETS) return value
    warnInvalid("density", value)
    return "comfortable"
}

function resolveMotionPreset(config: RepobotThemeConfig): ThemeMotionPreset {
    const value = config.motion
    if (value === undefined) return "smooth"
    if (value in MOTION_PRESETS) return value
    warnInvalid("motion", value)
    return "smooth"
}

function resolveBodyFont(config: RepobotThemeConfig): string {
    const value = config.fontFamily
    if (value === undefined) return SYSTEM_BODY_STACK
    if (typeof value !== "string" || value.trim() === "") {
        warnInvalid("fontFamily", value)
        return SYSTEM_BODY_STACK
    }
    return FONT_PRESETS[value] ?? value
}

function resolveBrandPrimary(config: RepobotThemeConfig): string {
    const value = config.brand?.primary
    if (value === undefined || value === null) return KERNEL_DEFAULT_PRIMARY
    if (isHexColor(value)) return value
    warnInvalid("brand.primary", value)
    return KERNEL_DEFAULT_PRIMARY
}

function resolveBrandPrimaryDark(config: RepobotThemeConfig, lightPrimary: string): string {
    const value = config.brand?.primaryDark
    if (isHexColor(value)) return value
    if (value !== undefined && value !== null) warnInvalid("brand.primaryDark", value)
    // Derive a dark-surface-friendly tint when only the light accent is branded.
    return lightPrimary === KERNEL_DEFAULT_PRIMARY
        ? KERNEL_DEFAULT_PRIMARY_DARK
        : mixHex(lightPrimary, "#ffffff", 0.4)
}

export function resolveConfiguredMode(config: RepobotThemeConfig): ThemeConfiguredMode {
    const value = config.mode
    if (value === undefined) return "light"
    if (value === "light" || value === "dark" || value === "system") return value
    warnInvalid("mode", value)
    return "light"
}

/* ----------------------------------------------------------------- */
/* Palette block resolution                                            */
/* ----------------------------------------------------------------- */

/* Palette color keys: ThemeColorSet minus the accent's derivable hover
 * (accentHover stays with brand.primary/primaryDark) and minus `ring`,
 * `muted`, and `input`, which resolve after the main loop (they default to
 * surfaceHover/surfaceHover/border respectively, their pre-palette sources).
 * `accentText` IS a plain key: an explicit value overrides the contrast
 * derivation, and its dark default blends toward the kernel dark counterpart
 * like every other hex. */
const PALETTE_COLOR_KEYS = [
    "background",
    "surface",
    "surfaceHover",
    "border",
    "textPrimary",
    "textSecondary",
    "danger",
    "dangerSurface",
    "success",
    "successSurface",
    "warning",
    "warningSurface",
    "info",
    "infoSurface",
    "accentText",
    "overlay",
    "skeleton",
] as const satisfies readonly (keyof ThemeColorSet)[]

const PALETTE_SHADOW_ENTRIES = [
    ["shadowSm", "sm"],
    ["shadowMd", "md"],
    ["shadowLg", "lg"],
    ["shadowXl", "xl"],
] as const satisfies readonly [keyof RepobotPaletteConfig, keyof ThemeShadowSet][]

/* Dark derivation for a light-only palette value: blend this far toward the
 * kernel dark counterpart, so the dark theme keeps its luminance structure
 * and picks up ~12% of the brand's hue. Shadows instead inherit the light
 * string whole — a shadow carries its own color, so identity elevations
 * (hard inset bevels, offset stickers) read the same in both modes. */
const PALETTE_DARK_BLEND = 0.88

/** Per-mode nav overrides after validation + dark derivation. */
export interface ThemeNavOverrides {
    bg?: string
    text?: string
    muted?: string
    hover?: string
    border?: string
    ring?: string
}

interface ResolvedPalette {
    lightColors: Partial<ThemeColorSet>
    darkColors: Partial<ThemeColorSet>
    customLightShadows: Partial<ThemeShadowSet>
    customDarkShadows: Partial<ThemeShadowSet>
    lightNav: ThemeNavOverrides
    darkNav: ThemeNavOverrides
    /** Validated chart palettes (5–6 colors), null when absent/invalid. */
    charts: string[] | null
    chartsDark: string[] | null
    /** The accepted entries (invalid values warned + dropped), null when absent. */
    accepted: RepobotPaletteConfig | null
}

/* The nav override fields and their kernel dark counterparts — the values
 * the dark navigation set derives from KERNEL_DARK when no nav block is
 * involved (ring's counterpart is the dark accent: the nav ring is the
 * shell's focus color, which tracks the accent). */
const NAV_FIELDS = ["bg", "text", "muted", "hover", "border", "ring"] as const
const NAV_DARK_COUNTERPARTS: Record<(typeof NAV_FIELDS)[number], string> = {
    bg: KERNEL_DARK.surface,
    text: KERNEL_DARK.textPrimary,
    muted: KERNEL_DARK.textSecondary,
    hover: KERNEL_DARK.surfaceHover,
    border: KERNEL_DARK.border,
    ring: KERNEL_DARK.accent,
}

/** Chart palettes are 5–6 contract colors; a 5-color palette cycles into
 * the 6th token slot (what a cycling chart does with 5 colors). */
const CHART_SLOT_COUNT = 6

function resolveChartArray(field: string, value: unknown): string[] | null {
    if (value === undefined || value === null) return null
    if (!Array.isArray(value) || value.length < 5 || !value.every(isCssColor)) {
        warnInvalid(field, value)
        return null
    }
    if (value.length > CHART_SLOT_COUNT) {
        // eslint-disable-next-line no-console
        console.warn(
            `[design-system] repobot.theme.json: ${field} has ${value.length} entries; ` +
                `the chart token ramp keeps the first ${CHART_SLOT_COUNT}.`,
        )
    }
    return value.slice(0, CHART_SLOT_COUNT)
}

function resolvePalette(palette: RepobotPaletteConfig | null | undefined): ResolvedPalette {
    const resolved: ResolvedPalette = {
        lightColors: {},
        darkColors: {},
        customLightShadows: {},
        customDarkShadows: {},
        lightNav: {},
        darkNav: {},
        charts: null,
        chartsDark: null,
        accepted: null,
    }
    if (palette === undefined || palette === null || typeof palette !== "object") return resolved

    // Unknown keys are almost always a misplaced accent (which lives in
    // brand.primary) — say so instead of silently dropping them.
    const KNOWN_PALETTE_KEYS = new Set<string>([
        ...PALETTE_COLOR_KEYS,
        ...PALETTE_COLOR_KEYS.map((key) => `${key}Dark`),
        ...PALETTE_SHADOW_ENTRIES.flatMap(([paletteKey]) => [paletteKey, `${paletteKey}Dark`]),
        "ring",
        "ringDark",
        "muted",
        "mutedDark",
        "input",
        "inputDark",
        "nav",
        "charts",
        "chartsDark",
    ])
    for (const key of Object.keys(palette)) {
        if (!KNOWN_PALETTE_KEYS.has(key)) {
            // eslint-disable-next-line no-console
            console.warn(
                `[design-system] repobot.theme.json: unknown palette.${key}; ignoring ` +
                    `(the accent is brand.primary/primaryDark, not a palette token).`,
            )
        }
    }

    const accepted: RepobotPaletteConfig = {}
    const accept = <K extends keyof RepobotPaletteConfig>(key: K, value: RepobotPaletteConfig[K]): void => {
        accepted[key] = value
    }

    for (const key of PALETTE_COLOR_KEYS) {
        const darkKey = `${key}Dark` as keyof RepobotPaletteConfig
        const lightValue = palette[key]
        const darkValue = palette[darkKey]
        if (lightValue !== undefined && lightValue !== null) {
            if (isCssColor(lightValue)) {
                resolved.lightColors[key] = lightValue
                accept(key, lightValue)
            } else {
                warnInvalid(`palette.${key}`, lightValue)
            }
        }
        if (darkValue !== undefined && darkValue !== null) {
            if (isCssColor(darkValue)) {
                resolved.darkColors[key] = darkValue
                accept(darkKey, darkValue)
            } else {
                warnInvalid(`palette.${darkKey}`, darkValue)
            }
        } else if (isCssColor(lightValue)) {
            // rgba overlays can't blend toward a hex — the kernel dark value stands.
            resolved.darkColors[key] = isHexColor(lightValue)
                ? mixHex(lightValue, KERNEL_DARK[key], PALETTE_DARK_BLEND)
                : KERNEL_DARK[key]
        }
    }

    // ring/muted/input: explicit value, else each follows the resolved token
    // it fed pre-palette (surfaceHover / surfaceHover / border), else the
    // dark derivation of the light value.
    const FOLLOW_DEFAULTS = {
        ring: "surfaceHover",
        muted: "surfaceHover",
        input: "border",
    } as const
    for (const key of ["ring", "muted", "input"] as const) {
        const darkKey = `${key}Dark` as const
        const followKey = FOLLOW_DEFAULTS[key]
        const lightValue = palette[key]
        const darkValue = palette[darkKey]
        const lightValid = isCssColor(lightValue)
        if (lightValue !== undefined && lightValue !== null) {
            if (lightValid) {
                resolved.lightColors[key] = lightValue
                accept(key, lightValue)
            } else {
                warnInvalid(`palette.${key}`, lightValue)
            }
        } else if (resolved.lightColors[followKey] !== undefined) {
            resolved.lightColors[key] = resolved.lightColors[followKey]
        }
        if (darkValue !== undefined && darkValue !== null) {
            if (isCssColor(darkValue)) {
                resolved.darkColors[key] = darkValue
                accept(darkKey, darkValue)
            } else {
                warnInvalid(`palette.${darkKey}`, darkValue)
            }
        } else if (isCssColor(lightValue)) {
            resolved.darkColors[key] = isHexColor(lightValue)
                ? mixHex(lightValue, KERNEL_DARK[key], PALETTE_DARK_BLEND)
                : KERNEL_DARK[key]
        } else if (resolved.darkColors[followKey] !== undefined) {
            resolved.darkColors[key] = resolved.darkColors[followKey]
        }
    }

    // The nav sub-block: per-field validation, then the palette's dark rule
    // field-by-field (hexes blend toward the nav field's kernel dark
    // counterpart; rgba values leave the dark side to derive).
    const nav = palette.nav
    if (nav !== undefined && nav !== null) {
        if (typeof nav !== "object") {
            warnInvalid("palette.nav", nav)
        } else {
            const acceptedNav: RepobotPaletteNavConfig = {}
            for (const field of NAV_FIELDS) {
                const darkField = `${field}Dark` as const
                const lightValue = nav[field]
                const darkValue = nav[darkField]
                if (lightValue !== undefined && lightValue !== null) {
                    if (isCssColor(lightValue)) {
                        resolved.lightNav[field] = lightValue
                        acceptedNav[field] = lightValue
                    } else {
                        warnInvalid(`palette.nav.${field}`, lightValue)
                    }
                }
                if (darkValue !== undefined && darkValue !== null) {
                    if (isCssColor(darkValue)) {
                        resolved.darkNav[field] = darkValue
                        acceptedNav[darkField] = darkValue
                    } else {
                        warnInvalid(`palette.nav.${darkField}`, darkValue)
                    }
                } else if (isHexColor(lightValue)) {
                    resolved.darkNav[field] = mixHex(
                        lightValue,
                        NAV_DARK_COUNTERPARTS[field],
                        PALETTE_DARK_BLEND,
                    )
                }
            }
            const KNOWN_NAV_KEYS = new Set<string>([
                ...NAV_FIELDS,
                ...NAV_FIELDS.map((field) => `${field}Dark`),
            ])
            for (const key of Object.keys(nav)) {
                if (!KNOWN_NAV_KEYS.has(key)) {
                    warnInvalid(`palette.nav.${key}`, (nav as Record<string, unknown>)[key])
                }
            }
            if (Object.keys(acceptedNav).length > 0) accept("nav", acceptedNav)
        }
    }

    const charts = resolveChartArray("palette.charts", palette.charts)
    if (charts !== null) accept("charts", charts)
    const chartsDark = resolveChartArray("palette.chartsDark", palette.chartsDark)
    if (chartsDark !== null) accept("chartsDark", chartsDark)
    resolved.charts = charts
    resolved.chartsDark = chartsDark

    for (const [paletteKey, shadowKey] of PALETTE_SHADOW_ENTRIES) {
        const darkKey = `${paletteKey}Dark` as keyof RepobotPaletteConfig
        const lightValue = palette[paletteKey]
        const darkValue = palette[darkKey]
        if (lightValue !== undefined && lightValue !== null) {
            if (isShadowValue(lightValue)) {
                resolved.customLightShadows[shadowKey] = lightValue
                accept(paletteKey, lightValue)
            } else {
                warnInvalid(`palette.${paletteKey}`, lightValue)
            }
        }
        if (darkValue !== undefined && darkValue !== null) {
            if (isShadowValue(darkValue)) {
                resolved.customDarkShadows[shadowKey] = darkValue
                accept(darkKey, darkValue)
            } else {
                warnInvalid(`palette.${darkKey}`, darkValue)
            }
        }
    }

    resolved.accepted = Object.keys(accepted).length > 0 ? accepted : null
    return resolved
}

function applyPaletteColors(base: ThemeColorSet, overrides: Partial<ThemeColorSet>): ThemeColorSet {
    // Reference-preserving when the palette is absent: the pre-palette sets
    // (and every consumer's rendering of them) carry through untouched.
    return Object.keys(overrides).length === 0 ? base : { ...base, ...overrides }
}

/* ----------------------------------------------------------------- */
/* The pure resolver (testable; module exports alias into it)          */
/* ----------------------------------------------------------------- */

export interface ResolvedThemeTokens {
    brandPrimary: string
    brandPrimaryDark: string
    brandIsKernelDefault: boolean
    radiusPreset: ThemeRadiusPreset
    densityPreset: ThemeDensityPreset
    bodyFont: string
    motionPreset: ThemeMotionPreset
    /** Space/radius/font/motion value sets shared by both theme classes. */
    scales: {
        space: (typeof DENSITY_PRESETS)[ThemeDensityPreset]
        radius: (typeof RADIUS_PRESETS)[ThemeRadiusPreset]
        fontSize: { xs: string; sm: string; md: string; lg: string; xl: string }
        fontFamily: { body: string; mono: string }
        motion: ThemeMotionSet
    }
    lightColors: ThemeColorSet
    darkColors: ThemeColorSet
    lightNavigation: ThemeNavigationSet
    darkNavigation: ThemeNavigationSet
    lightCharts: ThemeChartSet
    darkCharts: ThemeChartSet
    lightShadows: ThemeShadowSet
    darkShadows: ThemeShadowSet
    palette: RepobotPaletteConfig | null
}

/** Resolves a contract into the concrete token sets — pure, so tests can
 * feed synthetic contracts (the byte-identical-defaults regression pins
 * `resolveThemeTokens({})`). */
export function resolveThemeTokens(config: RepobotThemeConfig): ResolvedThemeTokens {
    const radiusPreset = resolveRadiusPreset(config)
    const densityPreset = resolveDensityPreset(config)
    const motionPreset = resolveMotionPreset(config)
    const bodyFont = resolveBodyFont(config)
    const brandPrimary = resolveBrandPrimary(config)
    const brandPrimaryDark = resolveBrandPrimaryDark(config, brandPrimary)
    const brandIsKernelDefault =
        brandPrimary === KERNEL_DEFAULT_PRIMARY && brandPrimaryDark === KERNEL_DEFAULT_PRIMARY_DARK

    const lightBase: ThemeColorSet = brandIsKernelDefault
        ? KERNEL_LIGHT
        : {
              ...KERNEL_LIGHT,
              accent: brandPrimary,
              accentHover: mixHex(brandPrimary, "#000000", 0.14),
              accentText: contrastText(brandPrimary),
          }
    const darkBase: ThemeColorSet = brandIsKernelDefault
        ? KERNEL_DARK
        : {
              ...KERNEL_DARK,
              accent: brandPrimaryDark,
              accentHover: mixHex(brandPrimaryDark, "#ffffff", 0.12),
              accentText: contrastText(brandPrimaryDark),
          }

    const palette = resolvePalette(config.palette)
    const lightColors = applyPaletteColors(lightBase, palette.lightColors)
    const darkColors = applyPaletteColors(darkBase, palette.darkColors)

    return {
        brandPrimary,
        brandPrimaryDark,
        brandIsKernelDefault,
        radiusPreset,
        densityPreset,
        bodyFont,
        motionPreset,
        scales: {
            space: DENSITY_PRESETS[densityPreset],
            radius: RADIUS_PRESETS[radiusPreset],
            fontSize: {
                xs: "12px",
                sm: "13px",
                md: "14px",
                lg: "16px",
                xl: "20px",
            },
            fontFamily: {
                body: bodyFont,
                mono: MONO_STACK,
            },
            motion: MOTION_PRESETS[motionPreset],
        },
        lightColors,
        darkColors,
        lightNavigation: deriveNavigationSet(lightColors, false, palette.lightNav),
        darkNavigation: deriveNavigationSet(darkColors, true, palette.darkNav),
        lightCharts: resolveChartSet(palette.charts, lightColors),
        darkCharts: resolveDarkChartSet(palette.charts, palette.chartsDark, darkColors),
        lightShadows: { ...KERNEL_LIGHT_SHADOWS, ...palette.customLightShadows },
        darkShadows: {
            ...KERNEL_DARK_SHADOWS,
            ...palette.customLightShadows,
            ...palette.customDarkShadows,
        },
        palette: palette.accepted,
    }
}

const resolvedTokens = resolveThemeTokens(rawConfig)

const brandPrimary = resolvedTokens.brandPrimary
const brandPrimaryDark = resolvedTokens.brandPrimaryDark

/** Space/radius/font/motion value sets shared by both theme classes. */
export const resolvedScales = resolvedTokens.scales

/** Light-theme color set with the brand accent and palette block applied. */
export const resolvedLightColors: ThemeColorSet = resolvedTokens.lightColors

/** Dark-theme color set with the brand accent and palette block applied. */
export const resolvedDarkColors: ThemeColorSet = resolvedTokens.darkColors

/** Light/dark elevation ramps with the palette block applied. */
export const resolvedLightShadows: ThemeShadowSet = resolvedTokens.lightShadows
export const resolvedDarkShadows: ThemeShadowSet = resolvedTokens.darkShadows

/** Default UI mode from the contract ("system" resolves at runtime). */
export const configuredDefaultMode: ThemeConfiguredMode = resolveConfiguredMode(rawConfig)

/** The contract's Feel presets by name — the marketing bridge (MarketingPage)
 * maps these onto its own token scales, so radius/density reach public pages
 * as scale factors instead of app `vars`. */
export const configuredRadiusPreset: ThemeRadiusPreset = resolveRadiusPreset(rawConfig)
export const configuredRadiusExplicit: boolean = radiusPresetIsExplicit(rawConfig)
export const configuredDensityPreset: ThemeDensityPreset = resolveDensityPreset(rawConfig)

/* ----------------------------------------------------------------- */
/* Navigation tokens                                                   */
/* ----------------------------------------------------------------- */

export interface ThemeNavigationSet {
    sidebarBg: string
    itemText: string
    itemHoverBg: string
    itemHoverText: string
    itemActiveBg: string
    itemActiveText: string
    /** The rail's own border/separator color (defaults to `border`). */
    border: string
    /** Focus ring inside the nav (defaults to the accent). */
    ring: string
}

/** Shell navigation colors derived from the resolved color set — palette
 * overrides reach the sidebar automatically through `surface`/`surfaceHover`,
 * and an explicit `palette.nav` block art-directs the rail directly. With no
 * nav block this is byte-identical to the pre-nav derivation; with `nav.bg`
 * set, any foreground left unset derives from the bg's luminance (the same
 * `contrastText` rule the accent's on-color uses), and the active item keeps
 * deriving from the brand accent — now washed over the nav bg. */
function deriveNavigationSet(
    colors: ThemeColorSet,
    isDark: boolean,
    nav: ThemeNavOverrides,
): ThemeNavigationSet {
    const bg = nav.bg ?? colors.surface
    const customBg = nav.bg !== undefined && isHexColor(bg)
    const strong = nav.text ?? (customBg ? contrastText(bg) : colors.textPrimary)
    const blendable = customBg && isHexColor(strong)
    return {
        sidebarBg: bg,
        itemText: nav.muted ?? (blendable ? mixHex(strong, bg, 0.4) : colors.textSecondary),
        itemHoverBg: nav.hover ?? (blendable ? mixHex(bg, strong, 0.08) : colors.surfaceHover),
        itemHoverText: strong,
        itemActiveBg: mixHex(colors.accent, isHexColor(bg) ? bg : colors.surface, isDark ? 0.82 : 0.88),
        itemActiveText:
            isDark || (customBg && relativeLuminance(bg) <= 0.45)
                ? mixHex(colors.accent, "#ffffff", 0.25)
                : colors.accent,
        border: nav.border ?? (blendable ? mixHex(bg, strong, 0.16) : colors.border),
        ring: nav.ring ?? colors.accent,
    }
}

export const resolvedLightNavigation: ThemeNavigationSet = resolvedTokens.lightNavigation
export const resolvedDarkNavigation: ThemeNavigationSet = resolvedTokens.darkNavigation

/* ----------------------------------------------------------------- */
/* Chart tokens                                                       */
/* ----------------------------------------------------------------- */

/** The chart series ramp: six slots (series beyond the ramp cycle). */
export interface ThemeChartSet {
    1: string
    2: string
    3: string
    4: string
    5: string
    6: string
}

/* The default ramp is the accent-derived monochromatic progression the
 * chart components have always built — the same mixes, precomputed into the
 * theme classes so `palette.charts` can override them. `mixOrFirst` mirrors
 * the components' old runtime behavior when a palette color can't blend
 * (an rgba background): the unmixed source stands. */
function mixOrFirst(from: string, to: string, amount: number): string {
    return isHexColor(from) && isHexColor(to) ? mixHex(from, to, amount) : from
}

function deriveChartRamp(colors: ThemeColorSet): ThemeChartSet {
    return {
        1: colors.accent,
        2: mixOrFirst(colors.accent, colors.background, 0.35),
        3: mixOrFirst(colors.accent, colors.textPrimary, 0.45),
        4: mixOrFirst(colors.accent, colors.background, 0.6),
        5: colors.textSecondary,
        6: mixOrFirst(colors.textSecondary, colors.background, 0.4),
    }
}

function assembleChartSet(colors: string[]): ThemeChartSet {
    return {
        1: colors[0],
        2: colors[1],
        3: colors[2],
        4: colors[3],
        5: colors[4],
        // A 5-color palette cycles into the 6th slot.
        6: colors[5] ?? colors[0],
    }
}

function resolveChartSet(charts: string[] | null, colors: ThemeColorSet): ThemeChartSet {
    return charts === null ? deriveChartRamp(colors) : assembleChartSet(charts)
}

/* Dark charts: an explicit chartsDark wins; otherwise each light chart color
 * blends toward the dark theme's own ramp slot (the palette's 88% rule, with
 * the per-mode ramp as the kernel dark counterpart). */
function resolveDarkChartSet(
    charts: string[] | null,
    chartsDark: string[] | null,
    darkColors: ThemeColorSet,
): ThemeChartSet {
    if (chartsDark !== null) return assembleChartSet(chartsDark)
    if (charts === null) return deriveChartRamp(darkColors)
    const darkRamp = deriveChartRamp(darkColors)
    const slots = [darkRamp[1], darkRamp[2], darkRamp[3], darkRamp[4], darkRamp[5], darkRamp[6]]
    const derived = charts.map((color, index) =>
        isHexColor(color) ? mixHex(color, slots[index], PALETTE_DARK_BLEND) : slots[index],
    )
    return assembleChartSet(derived)
}

export const resolvedLightCharts: ThemeChartSet = resolvedTokens.lightCharts
export const resolvedDarkCharts: ThemeChartSet = resolvedTokens.darkCharts

/**
 * Brand overlay for pack-scoped palettes. `null` until the customer actually
 * sets a brand in repobot.theme.json, so art-directed packs keep their own
 * accent by default but re-brand the moment the project does:
 *
 *     const accent = packBrand?.accent ?? "#d95d43" // pack's art palette
 *
 * Resolution order: repobot.theme.json > pack palette > kernel defaults.
 */
export interface PackBrandOverlay {
    /** Brand accent for light surfaces. */
    accent: string
    accentHover: string
    /** Readable text color on the accent. */
    accentText: string
    /** Brand accent tuned for dark surfaces. */
    accentDark: string
    /** Soft wash of the accent for tinted backgrounds. */
    accentSoft: string
}

/** Pure form of `packBrand` — themeHotUpdate.ts re-resolves live edits. */
export function resolvePackBrand(config: RepobotThemeConfig): PackBrandOverlay | null {
    const tokens = resolveThemeTokens(config)
    if (tokens.brandIsKernelDefault) return null
    return {
        accent: tokens.brandPrimary,
        accentHover: mixHex(tokens.brandPrimary, "#000000", 0.14),
        accentText: contrastText(tokens.brandPrimary),
        accentDark: tokens.brandPrimaryDark,
        accentSoft: mixHex(tokens.brandPrimary, "#ffffff", 0.86),
    }
}

export const packBrand: PackBrandOverlay | null = resolvePackBrand(rawConfig)

/**
 * Body font overlay for pack-scoped styles: the resolved stack when the
 * customer set `fontFamily`, otherwise `null` (pack keeps its own type).
 * The pure form is `resolvePackFont` — themeHotUpdate.ts re-resolves live
 * edits through it.
 */
export function resolvePackFont(config: RepobotThemeConfig): string | null {
    return config.fontFamily === undefined || config.fontFamily === "system" ? null : resolveBodyFont(config)
}

export const packFont: string | null = resolvePackFont(rawConfig)

/**
 * The pack overlay as CSS custom properties. Pack view styles consume these
 * with their art palette as the fallback — `var(--pack-accent, "#d95d43")` —
 * instead of baking the resolved constant, so a live repobot.theme.json
 * edit re-inks the view with no .css.ts recompile (themeHotUpdate.ts
 * re-declares them; tokens.css.ts bakes the build-time resolution, only
 * when the overlay is actually set, so composed/deployed output paints
 * exactly what the baked constants painted).
 */
export const packBrandVarNames: Record<keyof PackBrandOverlay, string> = {
    accent: "--pack-accent",
    accentHover: "--pack-accent-hover",
    accentText: "--pack-accent-text",
    accentDark: "--pack-accent-dark",
    accentSoft: "--pack-accent-soft",
}

export const packFontVarName = "--pack-font"

/* ----------------------------------------------------------------- */
/* App-chrome (`ui` block) resolution                                  */
/* ----------------------------------------------------------------- */

function resolveUiChoice<T extends string>(
    field: string,
    value: unknown,
    allowed: readonly T[],
    fallback: T,
): T {
    if (value === undefined || value === null) return fallback
    if (typeof value === "string" && (allowed as readonly string[]).includes(value)) return value as T
    warnInvalid(field, value)
    return fallback
}

/** Pure form of `navigationConfig` — themeHotUpdate.ts re-resolves live edits. */
export function resolveNavigationConfig(config: RepobotThemeConfig): {
    variant: ThemeNavigationVariant
    /**
     * Whether the contract explicitly declares a valid `navigation.variant`.
     * Consumers with their own stylistic defaults (a blueprint's preset nav
     * lean, a page's pinned variant) must yield to an explicit declaration —
     * the design panel writes one when the user picks a nav style, and a pin
     * that shadows it makes that control a silent no-op. The template ships
     * without a navigation block so this stays false until someone chooses.
     */
    declared: boolean
} {
    return {
        variant: resolveUiChoice(
            "navigation.variant",
            config.navigation?.variant,
            MARKETING_NAV_VARIANTS,
            "full-width",
        ),
        declared: MARKETING_NAV_VARIANTS.includes(config.navigation?.variant as ThemeNavigationVariant),
    }
}

/**
 * The project's default marketing-site navigation treatment. `MarketingShell`
 * reads this when a page's `shell.nav.variant` is absent, so one theme edit
 * restyles the nav across every marketing page. Building agents SHOULD vary
 * this between projects (docs/landing.md "Page chrome").
 */
export const navigationConfig = resolveNavigationConfig(rawConfig)

/** Pure form of `shellConfig` — themeHotUpdate.ts re-resolves live edits. */
export function resolveShellConfig(config: RepobotThemeConfig): {
    variant: ThemeShellVariant
    content: ThemeShellContentMode
} {
    return {
        variant: resolveUiChoice("shell.variant", config.shell?.variant, APP_SHELL_VARIANTS, "sidebar"),
        content: resolveUiChoice("shell.content", config.shell?.content, APP_SHELL_CONTENT_MODES, "full"),
    }
}

/**
 * The project's default dashboard shell treatment and content relationship.
 * `AppShell` reads this when its `layout`/`contentMode` props are absent, so
 * one theme edit restyles the signed-in chrome; an explicit manifest
 * `dashboard.shell.variant` or a pinned `shellLayout` in the binder wins.
 * Building agents SHOULD vary this between projects (docs/shell.md).
 */
export const shellConfig = resolveShellConfig(rawConfig)

/** Pure form of `uiConfig` — themeHotUpdate.ts re-resolves live edits. */
export function resolveUiConfig(config: RepobotThemeConfig): ResolvedUiConfig {
    const rawUi = config.ui ?? {}
    return {
        table: {
            style: resolveUiChoice(
                "ui.table.style",
                rawUi.table?.style,
                ["minimalist", "standard", "detailed"] as const,
                "standard",
            ),
            pagination: resolveUiChoice(
                "ui.table.pagination",
                rawUi.table?.pagination,
                ["loadMore", "pages"] as const,
                "loadMore",
            ),
        },
        forms: {
            presentation: resolveUiChoice(
                "ui.forms.presentation",
                rawUi.forms?.presentation,
                ["modal", "inline", "page"] as const,
                "modal",
            ),
            width: resolveUiChoice(
                "ui.forms.width",
                rawUi.forms?.width,
                ["skinny", "normal", "wide"] as const,
                "normal",
            ),
        },
        errors: {
            presentation: resolveUiChoice(
                "ui.errors.presentation",
                rawUi.errors?.presentation,
                ["modal", "corner"] as const,
                "modal",
            ),
        },
        loaders: {
            style: resolveUiChoice(
                "ui.loaders.style",
                rawUi.loaders?.style,
                ["gate", "progressive"] as const,
                "gate",
            ),
        },
        modals: {
            chrome: resolveUiChoice(
                "ui.modals.chrome",
                rawUi.modals?.chrome,
                ["centered", "sheet", "takeover"] as const,
                "centered",
            ),
        },
        auth: {
            layout: resolveUiChoice(
                "ui.auth.layout",
                rawUi.auth?.layout,
                ["centered", "split", "bare"] as const,
                "centered",
            ),
            // Like navigation's `declared`: the login page keeps its own
            // per-register lean (split vs centered) until the contract
            // actually names a layout — the resolved fallback must not
            // shadow that art direction.
            declared: (["centered", "split", "bare"] as readonly string[]).includes(
                rawUi.auth?.layout as string,
            ),
        },
        empty: {
            voice: resolveUiChoice(
                "ui.empty.voice",
                rawUi.empty?.voice,
                ["standard", "illustrated", "quiet", "actionForward"] as const,
                "standard",
            ),
        },
        toasts: {
            position: resolveUiChoice(
                "ui.toasts.position",
                rawUi.toasts?.position,
                ["bottomRight", "topRight", "bottomCenter"] as const,
                "bottomRight",
            ),
            style: resolveUiChoice(
                "ui.toasts.style",
                rawUi.toasts?.style,
                ["edge", "solid", "soft"] as const,
                "edge",
            ),
        },
    }
}

export interface ResolvedUiConfig {
    table: { style: UiTableStyle; pagination: UiTablePagination }
    forms: { presentation: UiFormPresentation; width: UiFormWidth }
    errors: { presentation: UiErrorPresentation }
    loaders: { style: UiLoaderStyle }
    modals: { chrome: UiModalChrome }
    auth: {
        layout: UiAuthLayout
        /** Whether the contract explicitly declares a valid `ui.auth.layout`. */
        declared: boolean
    }
    empty: { voice: UiEmptyVoice }
    toasts: { position: UiToastPosition; style: UiToastStyle }
}

/**
 * The resolved app-chrome presets. Components take these as their default
 * behavior (overridable per instance by props); the wizard writes the `ui`
 * block during setup so the chosen presentation applies app-wide.
 */
export const uiConfig: ResolvedUiConfig = resolveUiConfig(rawConfig)

/* ----------------------------------------------------------------- */
/* Character (surface treatments)                                      */
/* ----------------------------------------------------------------- */

/**
 * The app's visual character: an art-direction layer over the flat token
 * palette, the signed-in sibling of the marketing presets. Where the color
 * blocks answer "which hues", the character answers "how surfaces behave" —
 * page washes, brand-panel artwork, elevation recipes, focus treatment.
 *
 * - `plain` — no washes, the pre-character kernel look. The default.
 * - `soft` — gentle accent blooms on the page and panels, soft two-layer
 *   elevation. Pairs with `soft-saas` / `warm-boutique` marketing sites.
 * - `aurora` — iridescent accent-violet-cyan blooms, glassier elevation,
 *   glow focus rings. Pairs with `dark-dev` / `aurora-dark`.
 * - `luxe` — clean ground with one iridescent band grazing panel tops,
 *   crisp two-layer elevation, precise focus rings. Pairs with
 *   `luxe-light` / `editorial`.
 *
 * Setup SHOULD pick the character alongside the marketing preset so the
 * public site and the signed-in app read as one product.
 */
export type ThemeCharacterPreset = "plain" | "soft" | "aurora" | "luxe"

export const themeCharacterPresets: readonly ThemeCharacterPreset[] = ["plain", "soft", "aurora", "luxe"]

/** Resolved per theme class; components consume these via `vars.treatment`. */
export interface ThemeTreatmentSet {
    /** backgroundImage layered over `color.background` (shell grounds). */
    pageWash: string
    /** backgroundImage for brand panels (auth aside, empty-state heroes). */
    panelWash: string
    /** Elevation recipe for floating surfaces (dialogs, the auth card). */
    cardShadow: string
    /** box-shadow recipe for :focus-visible on controls. */
    focusRing: string
}

/** Pure, like resolveThemeTokens — treatments derive from resolved colors. */
export function resolveTreatments(
    character: ThemeCharacterPreset,
    colors: ThemeColorSet,
    shadows: ThemeShadowSet,
    dark: boolean,
): ThemeTreatmentSet {
    const accent = colors.accent
    const bloom = (geometry: string, color: string, fade: number): string =>
        `radial-gradient(${geometry}, ${color}, transparent ${fade}%)`
    const mix = (percent: number): string => `color-mix(in srgb, ${accent} ${percent}%, transparent)`
    switch (character) {
        case "soft":
            return {
                pageWash:
                    `${bloom("900px 420px at 50% -180px", mix(dark ? 14 : 10), 62)}, ` +
                    bloom("700px 380px at 100% 110%", mix(dark ? 8 : 5), 60),
                panelWash:
                    `${bloom("110% 90% at 12% 4%", mix(dark ? 30 : 20), 62)}, ` +
                    `${bloom("90% 80% at 105% 40%", dark ? "rgba(56, 189, 248, 0.14)" : "rgba(56, 189, 248, 0.12)", 60)}, ` +
                    bloom("100% 90% at 55% 112%", mix(dark ? 16 : 10), 64),
                cardShadow: dark
                    ? "0 1px 2px rgba(0, 0, 0, 0.3), 0 16px 44px rgba(0, 0, 0, 0.34)"
                    : "0 1px 2px rgba(24, 36, 72, 0.05), 0 16px 44px rgba(24, 36, 72, 0.12)",
                focusRing: `0 0 0 3px ${mix(28)}`,
            }
        case "aurora":
            return {
                pageWash:
                    `${bloom("900px 460px at 78% -200px", mix(dark ? 18 : 10), 62)}, ` +
                    `${bloom("800px 420px at -8% 30%", dark ? "rgba(139, 92, 246, 0.12)" : "rgba(139, 92, 246, 0.08)", 58)}`,
                panelWash:
                    `${bloom("100% 85% at 8% 0%", mix(dark ? 36 : 24), 64)}, ` +
                    `${bloom("90% 80% at 60% 30%", dark ? "rgba(56, 189, 248, 0.2)" : "rgba(56, 189, 248, 0.14)", 62)}, ` +
                    `${bloom("95% 85% at 100% 110%", dark ? "rgba(244, 114, 182, 0.18)" : "rgba(244, 114, 182, 0.12)", 60)}`,
                cardShadow: dark
                    ? "inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 20px 48px rgba(0, 0, 0, 0.5)"
                    : "0 1px 2px rgba(24, 36, 72, 0.06), 0 18px 50px rgba(24, 36, 72, 0.14)",
                focusRing: `0 0 0 3px ${mix(32)}, 0 0 18px ${mix(22)}`,
            }
        case "luxe":
            return {
                pageWash: "none",
                panelWash:
                    `${bloom("70% 45% at 12% -8%", mix(dark ? 26 : 18), 60)}, ` +
                    `${bloom("60% 40% at 45% -14%", dark ? "rgba(139, 92, 246, 0.16)" : "rgba(139, 92, 246, 0.13)", 58)}, ` +
                    `${bloom("55% 38% at 78% -18%", dark ? "rgba(244, 114, 182, 0.13)" : "rgba(244, 114, 182, 0.11)", 56)}`,
                cardShadow: dark
                    ? "0 2px 5px rgba(0, 0, 0, 0.35), 0 24px 60px rgba(0, 0, 0, 0.4)"
                    : "0 2px 5px rgba(50, 50, 93, 0.08), 0 24px 60px rgba(50, 50, 93, 0.1)",
                focusRing: `0 0 0 2px ${mix(45)}`,
            }
        default:
            return {
                pageWash: "none",
                // The pre-character AuthShell wash, kept as the plain default
                // so existing projects render unchanged.
                panelWash:
                    `${bloom("900px 480px at -10% -20%", mix(16), 62)}, ` +
                    bloom("700px 420px at 110% 115%", mix(10), 60),
                cardShadow: shadows.lg,
                focusRing: `0 0 0 3px ${colors.ring}`,
            }
    }
}

/** Pure form of `characterConfig` — themeHotUpdate.ts re-resolves live edits. */
export function resolveCharacterConfig(config: RepobotThemeConfig): ThemeCharacterPreset {
    return resolveUiChoice("character", config.character, themeCharacterPresets, "plain")
}

export const characterConfig: ThemeCharacterPreset = resolveCharacterConfig(rawConfig)

export const resolvedLightTreatment: ThemeTreatmentSet = resolveTreatments(
    characterConfig,
    resolvedTokens.lightColors,
    resolvedTokens.lightShadows,
    false,
)

export const resolvedDarkTreatment: ThemeTreatmentSet = resolveTreatments(
    characterConfig,
    resolvedTokens.darkColors,
    resolvedTokens.darkShadows,
    true,
)

/**
 * Display stack for headline moments (auth panel, empty states). Manrope by
 * default — the kernel's strongest face, self-hosted in every app — unless
 * the contract pins `displayFontFamily` (a preset key or raw stack). A
 * serif or mono `fontFamily` body choice carries through to display so
 * deliberate identities aren't overridden.
 */
export const resolvedDisplayFont: string = resolveDisplayFont(rawConfig, resolvedTokens.bodyFont)

/** Pure form of `resolvedDisplayFont` — themeHotUpdate.ts re-resolves live edits. */
export function resolveDisplayFont(config: RepobotThemeConfig, bodyFont: string): string {
    if (typeof config.displayFontFamily === "string" && config.displayFontFamily.length > 0) {
        return FONT_PRESETS[config.displayFontFamily] ?? config.displayFontFamily
    }
    const body = config.fontFamily
    if (body === "serif" || body === "mono" || body === "source-serif" || body === "plex-mono") {
        return bodyFont
    }
    return FONT_PRESETS["manrope"]!
}

/* Dev HMR note: editing repobot.theme.json in a running dev server repaints
 * the page instead of reloading it. The live contract does NOT flow through
 * this module — the JSON cannot ride Vite's module HMR (the vanilla-extract
 * compilation registers it as a dependency of every compiled .css.ts module,
 * and import-analysis skips .json modules, so no accept boundary can cover
 * it) — the dev server ships the parsed contract over a custom HMR event
 * instead (web/app/vite.config.ts → themeHotUpdate.ts). The exports above
 * are build-time constants and stay frozen on purpose; the LIVE values flow
 * through themeContractStore → themeHotUpdate.ts (CSS custom properties +
 * useThemeContract()). */

/** The sanitized contract, exported for the theme gallery and tooling. */
export const themeConfig = {
    brand: { primary: brandPrimary, primaryDark: brandPrimaryDark },
    radius: resolvedTokens.radiusPreset,
    density: resolvedTokens.densityPreset,
    fontFamily: rawConfig.fontFamily ?? "system",
    mode: configuredDefaultMode,
    motion: resolvedTokens.motionPreset,
    character: characterConfig,
    /** The accepted palette entries, or null when the contract sets none. */
    palette: resolvedTokens.palette,
    navigation: navigationConfig,
    shell: shellConfig,
    ui: uiConfig,
}
