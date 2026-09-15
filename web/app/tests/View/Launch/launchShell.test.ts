import { describe, expect, it, vi } from "vitest"

vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: {
            pages: [
                { path: "/", title: "Home" },
                { path: "/test", title: "Test" },
                { path: "/story", title: "Story" },
            ],
        },
    },
}))

const { launchShell } = await import("../../../src/View/Launch/launchShell")

describe("launchShell", () => {
    it("home nav: story anchors plus manifest extras, and the shell owns the chrome", () => {
        const shell = launchShell("", "")
        const labels = shell.nav?.content.links?.map((link) => link.label)
        // The one-page story's anchors first, then platform-added pages —
        // "adding a page rewires every nav". "/" never duplicates (the logo
        // is the home link).
        expect(labels).toEqual(["Features", "Reviews", "Pricing", "FAQ", "Test", "Story"])
        expect(shell.nav?.content.links?.[0]?.anchor).toBe("feature-grid")
        expect(shell.nav?.content.links?.[4]?.href).toBe("/test")
        expect(shell.footer?.variant).toBe("simple")
    })

    it("a manifest page drops itself from the links and anchors become home-rooted", () => {
        const shell = launchShell("", "/test")
        const labels = shell.nav?.content.links?.map((link) => link.label)
        expect(labels).toEqual(["Features", "Reviews", "Pricing", "FAQ", "Story"])
        // Off the home page a bare "#anchor" scrolls nowhere; the link must
        // navigate home and land on the section.
        expect(shell.nav?.content.links?.[0]?.href).toBe("/#feature-grid")
        expect(shell.nav?.content.cta?.href).toBe("/#lead-form")
    })

    it("the preview route gets no manifest extras (those paths only exist when the pack owns the site)", () => {
        const shell = launchShell("/launch", "")
        const labels = shell.nav?.content.links?.map((link) => link.label)
        expect(labels).toEqual(["Features", "Reviews", "Pricing", "FAQ"])
    })
})
