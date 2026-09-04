import React from "react"
import { activePack } from "../../Config/activePack"
import { routes } from "../../Config/Router"
import { PageMeta } from "../../Seo/PageMeta"
import { useSitePageConfig } from "../Landing/landingDocument"
import { LandingRenderer } from "../Landing/LandingRenderer"
import { useNonprofitCalendar } from "./calendar"
import { org, home, impact, programsPage, volunteer } from "./content"
import { homeLanding, impactLanding, programsLanding, volunteerLanding } from "./nonprofitLanding"

export type NonprofitPageKind = "home" | "programs" | "impact" | "volunteer"

/**
 * The nonprofit pack's site: four kernel-composed pages from one
 * `content.ts` in the monolith register. When the pack is active it owns
 * /, /programs, /impact, and /volunteer; on the preview route the same
 * pages nest under /nonprofit/*.
 *
 * The configs are rebuilt per render with the current time (the menu
 * pack's discipline): the volunteer calendar splits into upcoming/past
 * and the home hero names the next volunteer day — computed, never
 * curated, so a passed date can't show as upcoming.
 *
 * Each page's config resolves through the landing document's per-page
 * merge (`useSitePageConfig`), keyed by the page kind — the same contract
 * as manifest marketing pages, so the platform's structural editor can
 * reorder, delete, and add sections with a live repaint. The pack's
 * catalog publishes the route map (`landing.routes`).
 */
export default function NonprofitPage({ page = "home" }: { page?: NonprofitPageKind }): React.ReactElement {
    const basePath = activePack.key === "nonprofit" ? "" : routes.nonprofit.path
    const now = new Date()
    // The calendar the pages render: the business-content contract
    // (repobot.content.json — the Manage UI's write surface) over the code
    // default, photographs joined back by slug, live-repainting on dev
    // document edits like the landing merge.
    const calendarEvents = useNonprofitCalendar()

    const config =
        page === "programs"
            ? programsLanding(basePath)
            : page === "impact"
              ? impactLanding(basePath)
              : page === "volunteer"
                ? volunteerLanding(basePath, now, calendarEvents)
                : homeLanding(basePath, now, calendarEvents)
    // The merge only speaks for the ACTIVE pack: on the /nonprofit preview
    // route under another pack, the document's page ids belong to that
    // pack and must not bind here (the empty page id opts out).
    const docPageId = activePack.key === "nonprofit" ? page : ""
    const resolved = useSitePageConfig(docPageId, config)

    if (page === "programs") {
        return (
            <>
                <PageMeta
                    title={`Programs — ${org.name}`}
                    siteName={org.name}
                    description={programsPage.body}
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "impact") {
        return (
            <>
                <PageMeta title={`Impact — ${org.name}`} siteName={org.name} description={impact.body} />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "volunteer") {
        return (
            <>
                <PageMeta
                    title={`Volunteer — ${org.name}`}
                    siteName={org.name}
                    description={volunteer.body}
                />
                {/* Volunteer signups post formKey "volunteer" through the
                    managed forms pipeline: the org gets an email and a
                    dashboard entry with zero setup. The storage key scopes
                    the sandbox fallback (and the "sent" state) to this pack. */}
                <LandingRenderer
                    config={resolved}
                    leadFormKey="volunteer"
                    leadStorageKey="nonprofit-volunteer"
                />
            </>
        )
    }
    return (
        <>
            <PageMeta title={org.name} siteName={org.name} description={home.subheadline} />
            <LandingRenderer config={resolved} />
        </>
    )
}
