import { describe, expect, it } from "vitest"
import { manifestDispatchPlan } from "../../src/Dev/manifestDispatchPlan"

/**
 * The dev server's dispatch decision for changed root manifests. The branch
 * under guard: a rendered visual document (repobot.landing.json /
 * repobot.content.json) that no client ever imported. The old dispatch
 * full-reloaded every client for it — the platform preview escalates that
 * into a multi-second buffered swap behind a translucent "Updating preview…"
 * overlay on EVERY remix press of a dashboard template (dashboards never
 * import the landing renderer). The truthful dispatch is no reload plus the
 * visual-doc-changed broadcast, so themeHotUpdate.ts acks the platform's
 * repaint gate vacuously (see visualDocAckFallback.test.ts for the ack side).
 */
describe("manifestDispatchPlan", () => {
    it("hot-propagates and broadcasts a rendered doc some client imported", () => {
        expect(manifestDispatchPlan({ isRenderedDoc: true, inModuleGraph: true })).toEqual({
            propagate: true,
            broadcastVisualDocChange: true,
            fullReload: false,
        })
    })

    it("never reloads for a rendered doc nobody imported — broadcasts for the vacuous ack instead", () => {
        expect(manifestDispatchPlan({ isRenderedDoc: true, inModuleGraph: false })).toEqual({
            propagate: false,
            broadcastVisualDocChange: true,
            fullReload: false,
        })
    })

    it("propagates structural manifests through the graph without the visual-doc broadcast", () => {
        expect(manifestDispatchPlan({ isRenderedDoc: false, inModuleGraph: true })).toEqual({
            propagate: true,
            broadcastVisualDocChange: false,
            fullReload: false,
        })
    })

    it("keeps the full-reload fallback for structural manifests served pre-import", () => {
        expect(manifestDispatchPlan({ isRenderedDoc: false, inModuleGraph: false })).toEqual({
            propagate: false,
            broadcastVisualDocChange: false,
            fullReload: true,
        })
    })
})
