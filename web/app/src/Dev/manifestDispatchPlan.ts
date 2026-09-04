/**
 * The dev server's decision for one changed root manifest (vite.config.ts,
 * watchRootManifests): how the change reaches connected clients. Pure and
 * separately importable so the branch choice — which is preview-reliability
 * critical — is unit-testable without booting a Vite server.
 *
 * The high-stakes branch is a RENDERED visual document (repobot.landing.json
 * / repobot.content.json) that is NOT in the server's module graph: no client
 * has ever imported its renderer, so nothing on any screen depends on it.
 * The old behavior full-reloaded every client anyway, which the platform
 * preview turns into a multi-second buffered swap under a translucent
 * "Updating preview…" overlay — on every remix press of a dashboard template
 * (app dashboards never import the landing renderer). The truthful dispatch
 * is no reload at all, plus the visual-doc-changed broadcast so the
 * always-loaded fallback (themeHotUpdate.ts) acks the platform's repaint
 * gate vacuously — the same contract the in-graph branch already honors for
 * clients that merely didn't load the renderer.
 */
export interface ManifestDispatchPlan {
    /** Reload the manifest's importer modules through Vite's HMR graph. */
    propagate: boolean
    /** Broadcast repobot:visual-doc-changed so unclaimed docs ack vacuously. */
    broadcastVisualDocChange: boolean
    /** Fall back to a whole-page reload of every connected client. */
    fullReload: boolean
}

export function manifestDispatchPlan(input: {
    /** The manifest is one of the hot-applying rendered visual documents. */
    isRenderedDoc: boolean
    /** Vite's module graph contains the manifest (some client imported it). */
    inModuleGraph: boolean
}): ManifestDispatchPlan {
    if (input.inModuleGraph) {
        return {
            propagate: true,
            broadcastVisualDocChange: input.isRenderedDoc,
            fullReload: false,
        }
    }
    if (input.isRenderedDoc) {
        // Nobody rendering it => nothing to repaint => never a reload. The
        // renderer, whenever it IS first imported, reads the current file.
        return { propagate: false, broadcastVisualDocChange: true, fullReload: false }
    }
    // Structural manifests (repobot.project.json, packs/active.json, ...)
    // served before any import still need the old full-reload behavior.
    return { propagate: false, broadcastVisualDocChange: false, fullReload: true }
}
