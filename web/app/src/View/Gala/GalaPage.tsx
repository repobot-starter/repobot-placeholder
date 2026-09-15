import React from "react"
import { activePack } from "../../Config/activePack"
import { routes } from "../../Config/Router"
import { PageMeta } from "../../Seo/PageMeta"
import { useSitePageConfig } from "../Landing/landingDocument"
import { LandingRenderer } from "../Landing/LandingRenderer"
import { event, rsvp } from "./content"
import { homeLanding, rsvpLanding } from "./galaLanding"

export type GalaPageKind = "home" | "rsvp"

/**
 * The gala pack's site: one dramatic evening scroll plus the reply card,
 * from one `content.ts`. When the pack is active it owns / and /rsvp; on
 * the preview route the same pages nest under /gala/*.
 *
 * Both configs are rebuilt per render so the hero countdown ("126 days to
 * go") and the reply-by nudge stay current (the clock engine,
 * countdown.ts — the estate listings engine's idiom).
 *
 * Each page's config resolves through the landing document's per-page
 * merge (`useSitePageConfig`), keyed by the page kind — the same contract
 * as manifest marketing pages, so the platform's structural editor can
 * reorder, delete, and add sections on these pages with a live repaint.
 * The pack's catalog publishes the route map (`landing.routes`).
 */
export default function GalaPage({ page = "home" }: { page?: GalaPageKind }): React.ReactElement {
    const basePath = activePack.key === "gala" ? "" : routes.gala.path

    const config = page === "rsvp" ? rsvpLanding(basePath, new Date()) : homeLanding(basePath, new Date())
    // The merge only speaks for the ACTIVE pack: on the /gala preview
    // route under another pack, the document's page ids belong to that
    // pack and must not bind here (the empty page id opts out).
    const docPageId = activePack.key === "gala" ? page : ""
    const resolved = useSitePageConfig(docPageId, config)

    if (page === "rsvp") {
        return (
            <>
                <PageMeta title={`RSVP — ${event.title}`} siteName={event.title} description={rsvp.body} />
                {/* Replies post formKey "gala-rsvp" through the managed
                    forms pipeline: the host gets an email and a dashboard
                    entry with zero setup. The storage key scopes the
                    sandbox fallback (and the "sent" state) to this pack. */}
                <LandingRenderer config={resolved} leadFormKey="gala-rsvp" leadStorageKey="gala-rsvp" />
            </>
        )
    }
    return (
        <>
            <PageMeta title={event.title} siteName={event.title} description={event.subtitle} />
            <LandingRenderer config={resolved} />
        </>
    )
}
