import { render } from "@testing-library/react"
import React from "react"
import { describe, expect, it } from "vitest"
import {
    configuredRadiusExplicit,
    configuredRadiusPreset,
    MarketingPage,
    marketingPresetModeClasses,
    marketingRadiusControlFloor,
    marketingRadiusFloor,
    marketingRadiusScale,
    UiThemeProvider,
} from "@base/design-system"

/**
 * The Feel bridge at the component seam: MarketingPage follows the resolved
 * UI mode when picking a preset's appearance class (appearance always wins
 * over the preset's native lean), and it plants the radius/density scale
 * vars the preset classes calc() against.
 */

function pageRootOf(container: HTMLElement): HTMLElement {
    // UiThemeProvider renders its own themed wrapper; the marketing page
    // root is that wrapper's first child.
    const root = container.firstElementChild?.firstElementChild
    if (!(root instanceof HTMLElement)) throw new Error("marketing page root not rendered")
    return root
}

describe("MarketingPage feel bridge", () => {
    it("follows the resolved mode, not the preset's native lean", () => {
        // dark-dev is dark-native: under a light app mode it must wear its
        // authored light variant.
        const { container } = render(
            <UiThemeProvider defaultMode="light">
                <MarketingPage preset="dark-dev">content</MarketingPage>
            </UiThemeProvider>,
        )
        const root = pageRootOf(container)
        expect(root.className).toContain(marketingPresetModeClasses["dark-dev"].light.split(" ")[0])

        const dark = render(
            <UiThemeProvider defaultMode="dark">
                <MarketingPage preset="editorial">content</MarketingPage>
            </UiThemeProvider>,
        )
        const darkRoot = pageRootOf(dark.container)
        expect(darkRoot.className).toContain(marketingPresetModeClasses.editorial.dark.split(" ")[0])
    })

    it("plants the radius and density scale vars for the preset calc()s", () => {
        const { container } = render(
            <UiThemeProvider defaultMode="light">
                <MarketingPage preset="soft-saas">content</MarketingPage>
            </UiThemeProvider>,
        )
        const root = pageRootOf(container)
        expect(root.style.getPropertyValue("--marketing-radius-scale")).not.toBe("")
        expect(root.style.getPropertyValue("--marketing-space-scale")).not.toBe("")
        // The floors ride along so explicit Soft/Round visibly round even
        // square-authored presets (atelier, photography) — the preset
        // classes max() against them; controls carry their own floor so
        // Round can take them to pills without capsule cards.
        expect(root.style.getPropertyValue("--marketing-radius-floor")).not.toBe("")
        expect(root.style.getPropertyValue("--marketing-radius-control-floor")).not.toBe("")
    })

    it("bridges the committed contract's radius: identity while none is chosen, the preset's table values once one is", () => {
        // The kernel ships repobot.theme.json without a radius, but projects
        // commit their own contract — so the expectation reads the COMMITTED
        // contract instead of hardcoding the kernel default (theme-agnostic
        // gate). No radius chosen: the bridge sits at identity (scale 1,
        // floors 0) and a square-authored preset stays square. An explicit
        // choice plants exactly the shared bridge tables' values.
        const radius = configuredRadiusExplicit ? configuredRadiusPreset : undefined
        const { container } = render(
            <UiThemeProvider defaultMode="light">
                <MarketingPage preset="atelier">content</MarketingPage>
            </UiThemeProvider>,
        )
        const root = pageRootOf(container)
        expect(root.style.getPropertyValue("--marketing-radius-scale")).toBe(
            radius ? marketingRadiusScale[radius] : "1",
        )
        expect(root.style.getPropertyValue("--marketing-radius-floor")).toBe(
            radius ? marketingRadiusFloor[radius] : "0px",
        )
        expect(root.style.getPropertyValue("--marketing-radius-control-floor")).toBe(
            radius ? marketingRadiusControlFloor[radius] : "0px",
        )
    })

    it("keeps explicit page overrides winning over the bridge vars", () => {
        const { container } = render(
            <UiThemeProvider defaultMode="light">
                <MarketingPage preset="soft-saas" overrides={{ "--marketing-radius-scale": "0" }}>
                    content
                </MarketingPage>
            </UiThemeProvider>,
        )
        const root = pageRootOf(container)
        expect(root.style.getPropertyValue("--marketing-radius-scale")).toBe("0")
    })
})
