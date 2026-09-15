import {
    applyDurableThemeDocument,
    getThemeContractOverride,
    themeContractOverrideSource,
    type RepobotThemeConfig,
} from "@base/design-system"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { handleOptimisticVisualDocsMessage } from "../../src/Dev/previewBridge"
import { applyDurableLandingDocument, getLandingDocument } from "../../src/View/Landing/landingDocument"

const durableTheme: RepobotThemeConfig = { mode: "light", brand: { primary: "#224466" } }
const optimisticTheme: RepobotThemeConfig = { mode: "dark", brand: { primary: "#bb5500" } }
const realTheme: RepobotThemeConfig = { mode: "light", brand: { primary: "#337799" } }

const durableLanding = { style: { preset: "editorial" }, sections: [] }
const optimisticLanding = { style: { preset: "soft-saas" }, sections: [] }
const realLanding = { style: { preset: "warm-boutique" }, sections: [] }

describe("optimistic visual-doc preview bridge", () => {
    beforeEach(() => {
        applyDurableThemeDocument(durableTheme)
        applyDurableLandingDocument(durableLanding)
    })

    it("applies optimistic writes for theme and landing", () => {
        handleOptimisticVisualDocsMessage({
            channel: "repobot-preview",
            type: "optimistic-visual-docs",
            action: "write",
            files: [
                { path: "repobot.theme.json", contents: JSON.stringify(optimisticTheme) },
                { path: "repobot.landing.json", contents: JSON.stringify(optimisticLanding) },
            ],
        })

        expect(getThemeContractOverride()).toEqual(optimisticTheme)
        expect(themeContractOverrideSource()).toBe("optimistic")
        expect(getLandingDocument()).toEqual(optimisticLanding)
    })

    it("repaints color tokens on optimistic writes without HMR (baked bundles)", () => {
        // The regression that shipped as "remix changes layout but colors
        // never move" (2026-09-11): the store-driven CSS re-injection was
        // gated on import.meta.hot, so baked previews applied structural
        // presets through React while every injected token (palette, the
        // --pack-accent family) silently no-oped. This environment has no
        // import.meta.hot — exactly a baked bundle — so the injected style
        // tag must carry the optimistic brand accent.
        handleOptimisticVisualDocsMessage({
            channel: "repobot-preview",
            type: "optimistic-visual-docs",
            action: "write",
            files: [{ path: "repobot.theme.json", contents: JSON.stringify(optimisticTheme) }],
        })

        const tag = document.getElementById("repobot-theme-contract-hot")
        expect(tag).not.toBeNull()
        expect(tag!.textContent).toContain("--pack-accent")
        expect(tag!.textContent?.toLowerCase()).toContain("#bb5500")
    })

    it("ignores malformed JSON while still applying valid siblings", () => {
        handleOptimisticVisualDocsMessage({
            channel: "repobot-preview",
            type: "optimistic-visual-docs",
            action: "write",
            files: [
                { path: "repobot.theme.json", contents: "{not-json" },
                { path: "repobot.landing.json", contents: JSON.stringify(optimisticLanding) },
            ],
        })

        expect(getThemeContractOverride()).toEqual(durableTheme)
        expect(getLandingDocument()).toEqual(optimisticLanding)
    })

    it("lets the real durable write override optimistic state", () => {
        handleOptimisticVisualDocsMessage({
            channel: "repobot-preview",
            type: "optimistic-visual-docs",
            action: "write",
            files: [
                { path: "repobot.theme.json", contents: JSON.stringify(optimisticTheme) },
                { path: "repobot.landing.json", contents: JSON.stringify(optimisticLanding) },
            ],
        })

        applyDurableThemeDocument(realTheme)
        applyDurableLandingDocument(realLanding)

        expect(getThemeContractOverride()).toEqual(realTheme)
        expect(themeContractOverrideSource()).toBe("durable")
        expect(getLandingDocument()).toEqual(realLanding)
    })

    it("discards optimistic state back to the latest durable documents", () => {
        handleOptimisticVisualDocsMessage({
            channel: "repobot-preview",
            type: "optimistic-visual-docs",
            action: "write",
            files: [
                { path: "repobot.theme.json", contents: JSON.stringify(optimisticTheme) },
                { path: "repobot.landing.json", contents: JSON.stringify(optimisticLanding) },
            ],
        })

        handleOptimisticVisualDocsMessage({
            channel: "repobot-preview",
            type: "optimistic-visual-docs",
            action: "discard",
            paths: ["repobot.theme.json", "repobot.landing.json"],
        })

        expect(getThemeContractOverride()).toEqual(durableTheme)
        expect(themeContractOverrideSource()).toBe("optimistic")
        expect(getLandingDocument()).toEqual(durableLanding)
    })

    it("never emits visual-applied acks for optimistic writes/discards", () => {
        const postMessage = vi.spyOn(window.parent, "postMessage")

        handleOptimisticVisualDocsMessage({
            channel: "repobot-preview",
            type: "optimistic-visual-docs",
            action: "write",
            files: [
                { path: "repobot.theme.json", contents: JSON.stringify(optimisticTheme) },
                { path: "repobot.landing.json", contents: JSON.stringify(optimisticLanding) },
            ],
        })
        handleOptimisticVisualDocsMessage({
            channel: "repobot-preview",
            type: "optimistic-visual-docs",
            action: "discard",
            paths: ["repobot.theme.json", "repobot.landing.json"],
        })

        expect(postMessage).not.toHaveBeenCalled()
    })
})
