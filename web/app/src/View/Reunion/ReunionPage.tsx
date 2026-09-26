import React from "react"
import { activePack } from "../../Config/activePack"
import { routes } from "../../Config/Router"
import { PageMeta } from "../../Seo/PageMeta"
import { useSitePageConfig } from "../Landing/landingDocument"
import { LandingRenderer } from "../Landing/LandingRenderer"
import { memories, reunion, rsvp } from "./content"
import { homeLanding, memoriesLanding, rsvpLanding } from "./reunionLanding"

export type ReunionPageKind = "home" | "memories" | "rsvp"

/**
 * The reunion pack's site: the weekend page, the memory wall, and the
 * head-count form, all from one `content.ts`. When the pack is active it
 * owns /, /memories, and /rsvp; on the preview route the same pages nest
 * under /reunion/*.
 *
 * The home and rsvp configs are rebuilt per render so the hero countdown
 * ("351 days till the lake") and the head-count nudge stay current (the
 * clock engine, countdown.ts — the estate listings engine's idiom).
 *
 * Each page's config resolves through the landing document's per-page
 * merge (`useSitePageConfig`), keyed by the page kind — the same contract
 * as manifest marketing pages, so the platform's structural editor can
 * reorder, delete, and add sections on these pages with a live repaint.
 * The pack's catalog publishes the route map (`landing.routes`).
 */
export default function ReunionPage({ page = "home" }: { page?: ReunionPageKind }): React.ReactElement {
    const basePath = activePack.key === "reunion" ? "" : routes.reunion.path

    const config =
        page === "rsvp"
            ? rsvpLanding(basePath, new Date())
            : page === "memories"
              ? memoriesLanding(basePath)
              : homeLanding(basePath, new Date())
    // The merge only speaks for the ACTIVE pack: on the /reunion preview
    // route under another pack, the document's page ids belong to that
    // pack and must not bind here (the empty page id opts out).
    const docPageId = activePack.key === "reunion" ? page : ""
    const resolved = useSitePageConfig(docPageId, config)

    if (page === "rsvp") {
        return (
            <>
                <PageMeta
                    title={`RSVP — ${reunion.title}`}
                    siteName={reunion.title}
                    description={rsvp.body}
                />
                {/* Replies post formKey "reunion-rsvp" through the managed
                    forms pipeline: the organizers get an email and a
                    dashboard entry with zero setup. The storage key scopes
                    the sandbox fallback (and "sent") to this pack. */}
                <LandingRenderer config={resolved} leadFormKey="reunion-rsvp" leadStorageKey="reunion-rsvp" />
            </>
        )
    }
    if (page === "memories") {
        return (
            <>
                <PageMeta
                    title={`Memory wall — ${reunion.title}`}
                    siteName={reunion.title}
                    description={memories.intro}
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    return (
        <>
            <PageMeta title={reunion.title} siteName={reunion.title} description={reunion.subtitle} />
            <LandingRenderer config={resolved} />
        </>
    )
}
