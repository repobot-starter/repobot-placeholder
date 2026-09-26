import React from "react"
import { activePack } from "../../Config/activePack"
import { routes } from "../../Config/Router"
import { PageMeta } from "../../Seo/PageMeta"
import { useSitePageConfig } from "../Landing/landingDocument"
import { LandingRenderer } from "../Landing/LandingRenderer"
import { useCommunityCalendar } from "./calendar"
import { about, assoc, eventsPage, home, membership } from "./content"
import { aboutLanding, eventsLanding, homeLanding, joinLanding } from "./communityLanding"

export type CommunityPageKind = "home" | "events" | "join" | "about"

/**
 * The community pack's site: four kernel-composed pages from one
 * `content.ts` in the atelier register. When the pack is active it owns
 * /, /events, /join, and /about; on the preview route the same pages
 * nest under /community/*.
 *
 * The configs are rebuilt per render with the current time (the menu
 * pack's discipline): the calendar splits into upcoming/past and the
 * home hero names the next date — computed, never curated, so a passed
 * event can't show as upcoming.
 *
 * Each page's config resolves through the landing document's per-page
 * merge (`useSitePageConfig`), keyed by the page kind — the same contract
 * as manifest marketing pages, so the platform's structural editor can
 * reorder, delete, and add sections with a live repaint. The pack's
 * catalog publishes the route map (`landing.routes`).
 */
export default function CommunityPage({ page = "home" }: { page?: CommunityPageKind }): React.ReactElement {
    const basePath = activePack.key === "community" ? "" : routes.community.path
    const now = new Date()
    // The calendar the pages render: the business-content contract
    // (repobot.content.json — the Manage UI's write surface) over the code
    // default, photographs joined back by slug, live-repainting on dev
    // document edits like the landing merge.
    const calendarEvents = useCommunityCalendar()

    const config =
        page === "events"
            ? eventsLanding(basePath, now, calendarEvents)
            : page === "join"
              ? joinLanding(basePath, now, calendarEvents)
              : page === "about"
                ? aboutLanding(basePath)
                : homeLanding(basePath, now, calendarEvents)
    // The merge only speaks for the ACTIVE pack: on the /community preview
    // route under another pack, the document's page ids belong to that
    // pack and must not bind here (the empty page id opts out).
    const docPageId = activePack.key === "community" ? page : ""
    const resolved = useSitePageConfig(docPageId, config)

    if (page === "events") {
        return (
            <>
                <PageMeta
                    title={`Events — ${assoc.name}`}
                    siteName={assoc.name}
                    description={eventsPage.body}
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "join") {
        return (
            <>
                <PageMeta
                    title={`Join — ${assoc.name}`}
                    siteName={assoc.name}
                    description={membership.body}
                />
                {/* Membership signups post formKey "join" through the
                    managed forms pipeline: the board gets an email and a
                    dashboard entry with zero setup. The storage key scopes
                    the sandbox fallback (and the "sent" state) to this pack. */}
                <LandingRenderer config={resolved} leadFormKey="join" leadStorageKey="community-join" />
            </>
        )
    }
    if (page === "about") {
        return (
            <>
                <PageMeta title={`About — ${assoc.name}`} siteName={assoc.name} description={about.body} />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    return (
        <>
            <PageMeta title={assoc.fullName} siteName={assoc.name} description={home.subheadline} />
            <LandingRenderer config={resolved} />
        </>
    )
}
