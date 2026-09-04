import {
    buildPackOverlayCss,
    packBrandVarNames,
    packFontVarName,
    resolvePackBrand,
    resolvePackFont,
    type RepobotThemeConfig,
} from "@base/design-system"
import { describe, expect, it } from "vitest"

/**
 * The pack-overlay custom properties: what makes a live repobot.theme.json
 * edit re-ink game and feature-app packs in the workspace preview. Pack
 * styles read `var(--pack-*, <art fallback>)`; the build bakes the
 * properties only when the overlay resolves non-null (tokens.css.ts), and
 * themeHotUpdate.ts re-declares them on live edits. These tests pin the
 * deployed-parity contract: a composed site paints exactly what the old
 * baked `packBrand?.accent ?? fallback` constants painted, live or built.
 */

const branded: RepobotThemeConfig = { brand: { primary: "#7c3aed" } }

describe("pack overlay custom properties", () => {
    it("names a custom property for every overlay field", () => {
        const overlay = resolvePackBrand(branded)
        expect(overlay).not.toBeNull()
        expect(Object.keys(packBrandVarNames).sort()).toEqual(Object.keys(overlay!).sort())
    })

    it("re-declares the exact resolved overlay on a live brand edit", () => {
        const overlay = resolvePackBrand(branded)!
        const css = buildPackOverlayCss(branded)
        for (const key of Object.keys(packBrandVarNames) as (keyof typeof packBrandVarNames)[]) {
            // The hot value IS the value a production rebuild would bake —
            // the preview and the deploy can never disagree.
            expect(css).toContain(`${packBrandVarNames[key]}: ${overlay[key]};`)
        }
    })

    it("un-declares every property when the contract sets no brand or font", () => {
        // The kernel-default document resolves a null overlay: the build
        // bakes NO --pack-* declarations (tokens.css.ts guards on null), so
        // every `var(--pack-*, <art fallback>)` paints the pack's own baked
        // palette — a composed repo without theme customization is visually
        // identical to the pre-variable output.
        const kernelDefault: RepobotThemeConfig = {}
        expect(resolvePackBrand(kernelDefault)).toBeNull()
        expect(resolvePackFont(kernelDefault)).toBeNull()
        // Live edits can't remove static declarations, so the hot path
        // re-declares `initial` instead: a CSS-wide keyword makes a custom
        // property guaranteed-invalid and var() takes its fallback — the
        // same paint as the undeclared build-time state.
        const css = buildPackOverlayCss(kernelDefault)
        for (const property of Object.values(packBrandVarNames)) {
            expect(css).toContain(`${property}: initial;`)
        }
        expect(css).toContain(`${packFontVarName}: initial;`)
    })

    it("re-declares the resolved font stack on a live typeface edit", () => {
        const typed: RepobotThemeConfig = { fontFamily: '"Space Grotesk", sans-serif' }
        const stack = resolvePackFont(typed)
        expect(stack).not.toBeNull()
        expect(buildPackOverlayCss(typed)).toContain(`${packFontVarName}: ${stack};`)
    })

    it("doubles :root so the injected declarations outweigh the static bake", () => {
        expect(buildPackOverlayCss(branded)).toMatch(/^:root:root \{/)
    })
})
