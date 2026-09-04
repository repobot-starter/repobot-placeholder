import React from "react"
import { activePack } from "../../Config/activePack"
import { routes } from "../../Config/Router"
import { PageMeta } from "../../Seo/PageMeta"
import { useSitePageConfig } from "../Landing/landingDocument"
import { LandingRenderer } from "../Landing/LandingRenderer"
import { couple, home, rsvp, story, travel } from "./content"
import {
    homeLanding,
    partyLanding,
    rsvpLanding,
    scheduleLanding,
    storyLanding,
    travelLanding,
} from "./vowsLanding"

export type VowsPageKind = "home" | "story" | "schedule" | "travel" | "party" | "rsvp"

/**
 * The vows pack's site: six kernel-composed pages from one `content.ts`.
 * When the pack is active it owns /, /story, /schedule, /travel, /party,
 * and /rsvp; on the preview route the same pages nest under /vows/*.
 *
 * The home and rsvp configs are rebuilt per render so the hero countdown
 * ("289 days to go") and the reply-by nudge stay current (the clock
 * engine, countdown.ts — the estate listings engine's idiom).
 *
 * Each page's config resolves through the landing document's per-page
 * merge (`useSitePageConfig`), keyed by the page kind — the same contract
 * as manifest marketing pages, so the platform's structural editor can
 * reorder, delete, and add sections on these pages with a live repaint.
 * The pack's catalog publishes the route map (`landing.routes`).
 */
export default function VowsPage({ page = "home" }: { page?: VowsPageKind }): React.ReactElement {
    const basePath = activePack.key === "vows" ? "" : routes.vows.path

    const config =
        page === "story"
            ? storyLanding(basePath)
            : page === "schedule"
              ? scheduleLanding(basePath)
              : page === "travel"
                ? travelLanding(basePath)
                : page === "party"
                  ? partyLanding(basePath)
                  : page === "rsvp"
                    ? rsvpLanding(basePath, new Date())
                    : homeLanding(basePath, new Date())
    // The merge only speaks for the ACTIVE pack: on the /vows preview
    // route under another pack, the document's page ids belong to that
    // pack and must not bind here (the empty page id opts out).
    const docPageId = activePack.key === "vows" ? page : ""
    const resolved = useSitePageConfig(docPageId, config)

    if (page === "story") {
        return (
            <>
                <PageMeta
                    title={`Our story — ${couple.names}`}
                    siteName={couple.names}
                    description={story.intro}
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "schedule") {
        return (
            <>
                <PageMeta
                    title={`Schedule — ${couple.names}`}
                    siteName={couple.names}
                    description={`The wedding weekend of ${couple.partnerA} and ${couple.partnerB} — ${couple.weddingDateLabel}, ${couple.venueShort}.`}
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "travel") {
        return (
            <>
                <PageMeta
                    title={`Travel — ${couple.names}`}
                    siteName={couple.names}
                    description={travel.intro}
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "party") {
        return (
            <>
                <PageMeta
                    title={`Wedding party — ${couple.names}`}
                    siteName={couple.names}
                    description={`The people standing up with ${couple.partnerA} and ${couple.partnerB}.`}
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "rsvp") {
        return (
            <>
                <PageMeta title={`RSVP — ${couple.names}`} siteName={couple.names} description={rsvp.body} />
                {/* Replies post formKey "vows-rsvp" through the managed
                    forms pipeline: the couple gets an email and a dashboard
                    entry with zero setup. The storage key scopes the
                    sandbox fallback (and the "sent" state) to this pack. */}
                <LandingRenderer config={resolved} leadFormKey="vows-rsvp" leadStorageKey="vows-rsvp" />
            </>
        )
    }
    return (
        <>
            <PageMeta title={couple.names} siteName={couple.names} description={home.subheadline} />
            <LandingRenderer config={resolved} />
        </>
    )
}
