import { createTheme, createThemeContract, globalStyle } from "@vanilla-extract/css"
import {
    packBrand,
    packBrandVarNames,
    packFont,
    packFontVarName,
    resolvedDarkCharts,
    resolvedDarkColors,
    resolvedDarkNavigation,
    resolvedDarkShadows,
    resolvedDarkTreatment,
    resolvedDisplayFont,
    resolvedLightCharts,
    resolvedLightColors,
    resolvedLightNavigation,
    resolvedLightShadows,
    resolvedLightTreatment,
    resolvedScales,
} from "./themeConfig"

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
        ring: null,
        border: null,
        textPrimary: null,
        textSecondary: null,
        muted: null,
        input: null,
        accent: null,
        accentHover: null,
        accentText: null,
        danger: null,
        dangerSurface: null,
        success: null,
        successSurface: null,
        warning: null,
        warningSurface: null,
        info: null,
        infoSurface: null,
        overlay: null,
        skeleton: null,
    },
    navigation: {
        sidebarBg: null,
        itemText: null,
        itemHoverBg: null,
        itemHoverText: null,
        itemActiveBg: null,
        itemActiveText: null,
        border: null,
        ring: null,
    },
    chart: {
        1: null,
        2: null,
        3: null,
        4: null,
        5: null,
        6: null,
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
        /** Headline moments (auth panel, empty states); Manrope by default. */
        display: null,
    },
    motion: {
        durationFast: null,
        durationBase: null,
        easing: null,
        easingEmphasis: null,
    },
    shadow: {
        sm: null,
        md: null,
        lg: null,
        xl: null,
    },
    /**
     * Surface treatments from the theme character (`repobot.theme.json` →
     * `character`): page/panel washes as backgroundImage values, the raised-
     * card elevation recipe, and the focus-visible box-shadow.
     */
    treatment: {
        pageWash: null,
        panelWash: null,
        cardShadow: null,
        focusRing: null,
    },
})

const fontFamilies = { ...resolvedScales.fontFamily, display: resolvedDisplayFont }

export const lightTheme = createTheme(vars, {
    ...resolvedScales,
    fontFamily: fontFamilies,
    color: resolvedLightColors,
    navigation: resolvedLightNavigation,
    chart: resolvedLightCharts,
    shadow: resolvedLightShadows,
    treatment: resolvedLightTreatment,
})

export const darkTheme = createTheme(vars, {
    ...resolvedScales,
    fontFamily: fontFamilies,
    color: resolvedDarkColors,
    navigation: resolvedDarkNavigation,
    chart: resolvedDarkCharts,
    shadow: resolvedDarkShadows,
    treatment: resolvedDarkTreatment,
})

/*
 * The pack-overlay custom properties (`--pack-accent` family, `--pack-font`),
 * baked at build time. Declared only when repobot.theme.json actually sets a
 * brand/font: an unset overlay leaves the properties undefined, so every
 * `var(--pack-*, <art fallback>)` in a pack's styles resolves to the pack's
 * own baked palette — deployed output paints exactly what the old baked
 * `packBrand?.accent ?? fallback` constants painted. Live edits re-declare
 * these over :root from themeHotUpdate.ts.
 */
const packOverlayVars: Record<string, string> = {}
if (packBrand !== null) {
    for (const key of Object.keys(packBrandVarNames) as (keyof typeof packBrandVarNames)[]) {
        packOverlayVars[packBrandVarNames[key]] = packBrand[key]
    }
}
if (packFont !== null) {
    packOverlayVars[packFontVarName] = packFont
}
if (Object.keys(packOverlayVars).length > 0) {
    globalStyle(":root", { vars: packOverlayVars })
}
