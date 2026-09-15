import {
    buildMarketingContractCss,
    marketingPresetDefinitions,
    marketingPresetModeClasses,
    marketingPresetNames,
    resolvePresetOverlay,
    type RepobotThemeConfig,
} from "@base/design-system"
import { describe, expect, it } from "vitest"

/**
 * The Feel unification's kernel promise: every marketing preset ships an
 * authored light AND dark appearance, and the customer overlay resolves
 * against the RESOLVED mode — never the preset's native lean. This is what
 * makes the platform's Appearance toggle a real control on public pages.
 */

/** Rough relative luminance, good enough to order a page bg against its text. */
function luminance(hex: string): number {
    const value = hex.replace("#", "")
    const r = parseInt(value.slice(0, 2), 16)
    const g = parseInt(value.slice(2, 4), 16)
    const b = parseInt(value.slice(4, 6), 16)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

describe("marketing preset mode variants", () => {
    it("every preset authors both appearances with a genuinely dark/light ground", () => {
        for (const name of marketingPresetNames) {
            const definition = marketingPresetDefinitions[name]
            const { light, dark } = definition.modes
            // Dark ground below mid-gray, light ground above: an "inverted"
            // variant that isn't actually the other appearance fails here.
            expect(luminance(dark.palette.pageBg), `${name} dark pageBg`).toBeLessThan(90)
            expect(luminance(light.palette.pageBg), `${name} light pageBg`).toBeGreaterThan(165)
            // Text must read against its own ground.
            expect(
                luminance(dark.palette.text) - luminance(dark.palette.pageBg),
                `${name} dark text contrast`,
            ).toBeGreaterThan(100)
            expect(
                luminance(light.palette.pageBg) - luminance(light.palette.text),
                `${name} light text contrast`,
            ).toBeGreaterThan(100)
        }
    })

    it("bakes one theme class per appearance, all distinct", () => {
        const all = marketingPresetNames.flatMap((name) => [
            marketingPresetModeClasses[name].light,
            marketingPresetModeClasses[name].dark,
        ])
        // Two appearances per registered preset — derived, not a literal,
        // so adding a register can't stale this count.
        expect(all).toHaveLength(marketingPresetNames.length * 2)
        expect(new Set(all).size).toBe(marketingPresetNames.length * 2)
    })

    it("resolves the brand accent by the RESOLVED mode, not the preset's lean", () => {
        const brand = { accent: "#112233", accentDark: "#aabbcc" }
        // dark-dev leans dark; in LIGHT mode it must still take the light accent.
        const darkNative = marketingPresetDefinitions["dark-dev"]
        expect(resolvePresetOverlay(darkNative, "light", brand, null).accent).toBe("#112233")
        expect(resolvePresetOverlay(darkNative, "dark", brand, null).accent).toBe("#aabbcc")
        // editorial leans light; in DARK mode it must take the dark accent.
        const lightNative = marketingPresetDefinitions.editorial
        expect(resolvePresetOverlay(lightNative, "dark", brand, null).accent).toBe("#aabbcc")
        expect(resolvePresetOverlay(lightNative, "light", brand, null).accent).toBe("#112233")
    })

    it("draws wash and CTA shadow from the mode's own variant", () => {
        const definition = marketingPresetDefinitions["soft-saas"]
        const light = resolvePresetOverlay(definition, "light", null, null)
        const dark = resolvePresetOverlay(definition, "dark", null, null)
        expect(light.backgroundPage).toBe(definition.modes.light.backgroundPage(light.accent))
        expect(dark.backgroundPage).toBe(definition.modes.dark.backgroundPage(dark.accent))
        expect(light.shadowCta).not.toBe(dark.shadowCta)
    })

    it("hot-update CSS covers both appearances of every preset", () => {
        const contract: RepobotThemeConfig = { brand: { primary: "#2266aa" } }
        const css = buildMarketingContractCss(contract)
        for (const name of marketingPresetNames) {
            for (const mode of ["light", "dark"] as const) {
                const themeClass = marketingPresetModeClasses[name][mode].split(" ")[0]
                expect(css, `${name} ${mode} class in hot CSS`).toContain(`.${themeClass}`)
            }
        }
    })
})
