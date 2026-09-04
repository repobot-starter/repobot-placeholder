import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

/**
 * The deploy-time site-config overlay (runtimeSiteDocuments.ts): the
 * platform keys the web-bundle cache on the tree WITHOUT the visual
 * documents and republishes a design save by injecting the current
 * documents into every built page as an inline JSON script tag. The
 * kernel must resolve that tag over the baked imports at module init —
 * theme, landing, and content alike — and must degrade to the baked
 * documents on any junk, because a bad overlay must never crash a
 * deployed site.
 *
 * Modules under test resolve the overlay AT IMPORT, so every scenario
 * resets the module registry and injects its tag before importing.
 */

const TAG_ID = "repobot-site-config"

function injectOverlay(payload: string): void {
    const tag = document.createElement("script")
    tag.type = "application/json"
    tag.id = TAG_ID
    tag.textContent = payload
    document.head.appendChild(tag)
}

function removeOverlay(): void {
    document.getElementById(TAG_ID)?.remove()
    // The style tag a previous scenario's boot re-assert injected: without
    // this, the "no overlay" cases would see a stale tag from a sibling.
    document.getElementById("repobot-theme-contract-hot")?.remove()
}

beforeEach(() => {
    vi.resetModules()
    removeOverlay()
})

afterEach(() => {
    removeOverlay()
    vi.restoreAllMocks()
})

describe("runtimeSiteDocument", () => {
    // A raised timeout, for this first test only: whichever test in this
    // file runs first pays the COLD import of @base/design-system — the
    // whole barrel, 166 modules including 73 vanilla-extract *.css.ts
    // compiles (the graph is the same size it was before the content-domain
    // resolvers landed; measured across commits, nothing here got heavier).
    // That transform costs ~1.5-2s on an idle workstation and crosses 5s
    // under load — on shared CI runners (2-core, two vitest forks competing,
    // "import 108s" across a run) it does so regularly whenever no earlier
    // test file has warmed the transform cache (the pinned theme-agnostic
    // rerun and freshly-composed trees, mostly). Later tests re-evaluate
    // from the warm cache in ~20ms and keep the default timeout.
    it("reads the named document from the injected tag", { timeout: 30_000 }, async () => {
        injectOverlay(
            JSON.stringify({
                "repobot.theme.json": { color: "#0E7490" },
                "repobot.landing.json": { sections: [] },
            }),
        )
        const { runtimeSiteDocument, hasRuntimeSiteDocument } = await import("@base/design-system")
        expect(runtimeSiteDocument("repobot.theme.json")).toEqual({ color: "#0E7490" })
        expect(hasRuntimeSiteDocument("repobot.landing.json")).toBe(true)
        // A document the overlay doesn't speak for stays with the build.
        expect(runtimeSiteDocument("repobot.content.json")).toBeUndefined()
        expect(hasRuntimeSiteDocument("repobot.content.json")).toBe(false)
    })

    it("is absent without the tag (dev, tests, kernels without the injector)", async () => {
        const { runtimeSiteDocument } = await import("@base/design-system")
        expect(runtimeSiteDocument("repobot.theme.json")).toBeUndefined()
    })

    it("degrades to the baked documents on a corrupt payload", async () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
        injectOverlay("{ this is not json")
        const { runtimeSiteDocument } = await import("@base/design-system")
        expect(runtimeSiteDocument("repobot.theme.json")).toBeUndefined()
        expect(warn).toHaveBeenCalled()
    })

    it("refuses a payload that is not an object", async () => {
        injectOverlay(JSON.stringify(["repobot.theme.json"]))
        const { runtimeSiteDocument } = await import("@base/design-system")
        expect(runtimeSiteDocument("repobot.theme.json")).toBeUndefined()
    })
})

describe("theme overlay at module init", () => {
    it("resolves the injected contract and re-asserts it over the static CSS", async () => {
        injectOverlay(JSON.stringify({ "repobot.theme.json": { color: "#0E7490", radius: "sharp" } }))
        const designSystem = await import("@base/design-system")
        expect(designSystem.rawThemeContract).toEqual({ color: "#0E7490", radius: "sharp" })
        expect(designSystem.configuredRadiusPreset).toBe("sharp")
        // The static vanilla-extract CSS baked the committed contract; the
        // overlay's custom properties must be injected over it at boot
        // (themeHotUpdate.ts — the production twin of the dev re-assert).
        const style = document.getElementById("repobot-theme-contract-hot")
        expect(style).not.toBeNull()
        expect(style?.textContent ?? "").toContain("--")
    })

    it("gates an overlay contract stamped for a foreign pack, like the baked import", async () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
        injectOverlay(
            JSON.stringify({
                "repobot.theme.json": { color: "#0E7490", pack: "not-the-active-pack" },
            }),
        )
        const designSystem = await import("@base/design-system")
        expect(designSystem.rawThemeContract).toEqual({})
        expect(warn).toHaveBeenCalled()
    })

    it("keeps the baked contract when no overlay ships", async () => {
        const [designSystem, committed] = await Promise.all([
            import("@base/design-system"),
            import("../../../../repobot.theme.json"),
        ])
        expect(designSystem.rawThemeContract).toEqual(designSystem.gateThemeDocument(committed.default))
        // (The injected style tag is no signal here: vitest runs the module
        // with import.meta.hot live, so the DEV re-assert injects it with or
        // without an overlay.)
    })
})

describe("landing and content overlays at module init", () => {
    it("the content module adopts the injected document", async () => {
        injectOverlay(
            JSON.stringify({
                "repobot.content.json": { schedule: { sessions: [] } },
            }),
        )
        const { getContentDocument } = await import("../../src/View/Landing/contentDocument")
        expect(getContentDocument()).toEqual({ schedule: { sessions: [] } })
    })

    it("the content module keeps the baked document without an overlay", async () => {
        const [{ getContentDocument }, committed] = await Promise.all([
            import("../../src/View/Landing/contentDocument"),
            import("../../../../repobot.content.json"),
        ])
        expect(getContentDocument()).toEqual(committed.default)
    })

    it("the landing module resolves the injected document over a page's code config", async () => {
        const { marketingPresetNames } = await import("@base/design-system")
        const [codePreset, overlayPreset] = marketingPresetNames
        injectOverlay(
            JSON.stringify({
                "repobot.landing.json": { style: { preset: overlayPreset } },
            }),
        )
        const { resolveLandingConfig, landingDocumentSurface } =
            await import("../../src/View/Landing/landingDocument")
        const config = { style: { preset: codePreset }, sections: [] }
        // resolveLandingConfig reads the module's live document — the
        // overlay, adopted at import — when asked for the active surface.
        const resolved = resolveLandingConfig(config as never, landingDocumentSurface())
        expect(resolved.style.preset).toBe(overlayPreset)
    })
})
