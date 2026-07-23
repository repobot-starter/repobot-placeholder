import themeJson from "../../../../repobot.theme.json"

/**
 * Resolves the root `repobot.theme.json` contract into the concrete value
 * sets `tokens.css.ts` feeds to vanilla-extract's `createTheme`.
 *
 * The contract is deliberately tiny (brand color, radius, density, font,
 * mode) so editing it is trivially safe for agents and users; everything
 * else derives here. Invalid values fall back to kernel defaults with a
 * build-time warning instead of failing the build.
 */

export type ThemeRadiusPreset = "sharp" | "soft" | "round"
export type ThemeDensityPreset = "compact" | "comfortable" | "spacious"
export type ThemeConfiguredMode = "light" | "dark" | "system"

export interface RepobotThemeConfig {
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
    mode?: ThemeConfiguredMode
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
    border: string
    textPrimary: string
    textSecondary: string
    accent: string
    accentHover: string
    accentText: string
    danger: string
    dangerSurface: string
    success: string
    successSurface: string
    overlay: string
    skeleton: string
}

const KERNEL_LIGHT: ThemeColorSet = {
    background: "#f6f7f9",
    surface: "#ffffff",
    surfaceHover: "#eef2f8",
    border: "#dce1ea",
    textPrimary: "#12161f",
    textSecondary: "#576074",
    accent: "#1f6feb",
    accentHover: "#1a5fd0",
    accentText: "#ffffff",
    danger: "#b91c1c",
    dangerSurface: "rgba(239, 68, 68, 0.12)",
    success: "#166534",
    successSurface: "rgba(34, 197, 94, 0.16)",
    overlay: "rgba(15, 18, 24, 0.4)",
    skeleton: "#e5e9f0",
}

const KERNEL_DARK: ThemeColorSet = {
    background: "#17191d",
    surface: "#1e2126",
    surfaceHover: "#262a31",
    border: "#2a2f37",
    textPrimary: "#f3f4f6",
    textSecondary: "#b6bcc8",
    accent: "#90caf9",
    accentHover: "#a8d5fb",
    accentText: "#071223",
    danger: "#fca5a5",
    dangerSurface: "rgba(239, 68, 68, 0.2)",
    success: "#86efac",
    successSurface: "rgba(34, 197, 94, 0.2)",
    overlay: "rgba(0, 0, 0, 0.55)",
    skeleton: "#262a31",
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

const rawConfig = themeJson as RepobotThemeConfig

function resolveRadiusPreset(): ThemeRadiusPreset {
    const value = rawConfig.radius
    if (value === undefined) return "soft"
    if (value in RADIUS_PRESETS) return value
    warnInvalid("radius", value)
    return "soft"
}

function resolveDensityPreset(): ThemeDensityPreset {
    const value = rawConfig.density
    if (value === undefined) return "comfortable"
    if (value in DENSITY_PRESETS) return value
    warnInvalid("density", value)
    return "comfortable"
}

function resolveBodyFont(): string {
    const value = rawConfig.fontFamily
    if (value === undefined) return SYSTEM_BODY_STACK
    if (typeof value !== "string" || value.trim() === "") {
        warnInvalid("fontFamily", value)
        return SYSTEM_BODY_STACK
    }
    return FONT_PRESETS[value] ?? value
}

function resolveBrandPrimary(): string {
    const value = rawConfig.brand?.primary
    if (value === undefined || value === null) return KERNEL_DEFAULT_PRIMARY
    if (isHexColor(value)) return value
    warnInvalid("brand.primary", value)
    return KERNEL_DEFAULT_PRIMARY
}

function resolveBrandPrimaryDark(lightPrimary: string): string {
    const value = rawConfig.brand?.primaryDark
    if (isHexColor(value)) return value
    if (value !== undefined && value !== null) warnInvalid("brand.primaryDark", value)
    // Derive a dark-surface-friendly tint when only the light accent is branded.
    return lightPrimary === KERNEL_DEFAULT_PRIMARY
        ? KERNEL_DEFAULT_PRIMARY_DARK
        : mixHex(lightPrimary, "#ffffff", 0.4)
}

function resolveConfiguredMode(): ThemeConfiguredMode {
    const value = rawConfig.mode
    if (value === undefined) return "light"
    if (value === "light" || value === "dark" || value === "system") return value
    warnInvalid("mode", value)
    return "light"
}

const brandPrimary = resolveBrandPrimary()
const brandPrimaryDark = resolveBrandPrimaryDark(brandPrimary)
const brandIsKernelDefault =
    brandPrimary === KERNEL_DEFAULT_PRIMARY && brandPrimaryDark === KERNEL_DEFAULT_PRIMARY_DARK

/** Space/radius/font value sets shared by both theme classes. */
export const resolvedScales = {
    space: DENSITY_PRESETS[resolveDensityPreset()],
    radius: RADIUS_PRESETS[resolveRadiusPreset()],
    fontSize: {
        xs: "12px",
        sm: "13px",
        md: "14px",
        lg: "16px",
        xl: "20px",
    },
    fontFamily: {
        body: resolveBodyFont(),
        mono: MONO_STACK,
    },
}

/** Light-theme color set with the brand accent applied. */
export const resolvedLightColors: ThemeColorSet = brandIsKernelDefault
    ? KERNEL_LIGHT
    : {
          ...KERNEL_LIGHT,
          accent: brandPrimary,
          accentHover: mixHex(brandPrimary, "#000000", 0.14),
          accentText: contrastText(brandPrimary),
      }

/** Dark-theme color set with the brand accent applied. */
export const resolvedDarkColors: ThemeColorSet = brandIsKernelDefault
    ? KERNEL_DARK
    : {
          ...KERNEL_DARK,
          accent: brandPrimaryDark,
          accentHover: mixHex(brandPrimaryDark, "#ffffff", 0.12),
          accentText: contrastText(brandPrimaryDark),
      }

/** Default UI mode from the contract ("system" resolves at runtime). */
export const configuredDefaultMode: ThemeConfiguredMode = resolveConfiguredMode()

/**
 * Brand overlay for pack-scoped palettes. `null` until the customer actually
 * sets a brand in repobot.theme.json, so art-directed packs keep their own
 * accent by default but re-brand the moment the project does:
 *
 *     const accent = packBrand?.accent ?? "#d95d43" // pack's art palette
 *
 * Resolution order: repobot.theme.json > pack palette > kernel defaults.
 */
export const packBrand: {
    /** Brand accent for light surfaces. */
    accent: string
    accentHover: string
    /** Readable text color on the accent. */
    accentText: string
    /** Brand accent tuned for dark surfaces. */
    accentDark: string
    /** Soft wash of the accent for tinted backgrounds. */
    accentSoft: string
} | null = brandIsKernelDefault
    ? null
    : {
          accent: brandPrimary,
          accentHover: mixHex(brandPrimary, "#000000", 0.14),
          accentText: contrastText(brandPrimary),
          accentDark: brandPrimaryDark,
          accentSoft: mixHex(brandPrimary, "#ffffff", 0.86),
      }

/**
 * Body font overlay for pack-scoped styles: the resolved stack when the
 * customer set `fontFamily`, otherwise `null` (pack keeps its own type).
 */
export const packFont: string | null =
    rawConfig.fontFamily === undefined || rawConfig.fontFamily === "system" ? null : resolveBodyFont()

/** The sanitized contract, exported for the theme gallery and tooling. */
export const themeConfig = {
    brand: { primary: brandPrimary, primaryDark: brandPrimaryDark },
    radius: resolveRadiusPreset(),
    density: resolveDensityPreset(),
    fontFamily: rawConfig.fontFamily ?? "system",
    mode: configuredDefaultMode,
}
