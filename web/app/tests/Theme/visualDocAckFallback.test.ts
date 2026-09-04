import { registerVisualDocRenderer, visualDocAckFallbackNeeded } from "@base/design-system"
import { describe, expect, it } from "vitest"

/**
 * The vacuous-ack fallback for hot-applying visual documents. The platform
 * holds every preview write to an OBSERVED repaint: each written document
 * must post "visual-applied" from inside the preview, or the repaint
 * watchdog escalates to a multi-second buffered swap. Vite's module update
 * only reaches clients whose graph loaded the document's renderer
 * (landingDocument.ts / contentDocument.ts) — on any other route the write
 * changes nothing visible and nothing acks, which is exactly the
 * "re-ink applied instantly but the loader lingers" wedge on app remixes.
 * themeHotUpdate.ts (loaded everywhere) hears the dev server's
 * visual-doc-changed broadcast and acks vacuously exactly when no loaded
 * module has claimed the document's rendering.
 */
describe("visual-doc ack fallback", () => {
    it("wants the fallback for a document no loaded module renders", () => {
        expect(visualDocAckFallbackNeeded("repobot.landing.json")).toBe(true)
        expect(visualDocAckFallbackNeeded("repobot.content.json")).toBe(true)
    })

    it("stands down once the renderer claims its document — and only that one", () => {
        registerVisualDocRenderer("repobot.landing.json")
        expect(visualDocAckFallbackNeeded("repobot.landing.json")).toBe(false)
        // The claim is per-document: the content doc's ack is still unowned.
        expect(visualDocAckFallbackNeeded("repobot.content.json")).toBe(true)
        registerVisualDocRenderer("repobot.content.json")
        expect(visualDocAckFallbackNeeded("repobot.content.json")).toBe(false)
    })
})
