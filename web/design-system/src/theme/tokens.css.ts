import { createTheme, createThemeContract } from "@vanilla-extract/css"
import { resolvedDarkColors, resolvedLightColors, resolvedScales } from "./themeConfig"

/**
 * Semantic theme contract. Every component style imports `vars` and never
 * hardcodes colors, so the light/dark theme classes swap the whole palette.
 *
 * Values are resolved from the root `repobot.theme.json` contract by
 * `themeConfig.ts` — edit that file (not this one) to re-brand a project.
 */
export const vars = createThemeContract({
    color: {
        background: null,
        surface: null,
        surfaceHover: null,
        border: null,
        textPrimary: null,
        textSecondary: null,
        accent: null,
        accentHover: null,
        accentText: null,
        danger: null,
        dangerSurface: null,
        success: null,
        successSurface: null,
        overlay: null,
        skeleton: null,
    },
    space: {
        xxs: null,
        xs: null,
        sm: null,
        md: null,
        lg: null,
        xl: null,
        xxl: null,
    },
    radius: {
        sm: null,
        md: null,
        lg: null,
        pill: null,
    },
    fontSize: {
        xs: null,
        sm: null,
        md: null,
        lg: null,
        xl: null,
    },
    fontFamily: {
        body: null,
        mono: null,
    },
    shadow: {
        sm: null,
        md: null,
        lg: null,
    },
})

export const lightTheme = createTheme(vars, {
    ...resolvedScales,
    color: resolvedLightColors,
    shadow: {
        sm: "0 2px 8px rgba(15, 18, 24, 0.08)",
        md: "0 8px 24px rgba(15, 18, 24, 0.12)",
        lg: "0 20px 48px rgba(15, 18, 24, 0.18)",
    },
})

export const darkTheme = createTheme(vars, {
    ...resolvedScales,
    color: resolvedDarkColors,
    shadow: {
        sm: "0 2px 8px rgba(0, 0, 0, 0.24)",
        md: "0 8px 24px rgba(0, 0, 0, 0.3)",
        lg: "0 20px 48px rgba(0, 0, 0, 0.4)",
    },
})
