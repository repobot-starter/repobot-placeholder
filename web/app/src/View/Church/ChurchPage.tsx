import React from "react"
import { activePack } from "../../Config/activePack"
import { routes } from "../../Config/Router"
import { PageMeta } from "../../Seo/PageMeta"
import { useSitePageConfig } from "../Landing/landingDocument"
import { LandingRenderer } from "../Landing/LandingRenderer"
import { useChurchCalendar } from "./calendar"
import { eventsLanding, homeLanding, ministriesLanding, sermonsLanding, visitLanding } from "./churchLanding"
import { church, eventsPage, home, ministriesPage, sermonsPage, visit } from "./content"

export type ChurchPageKind = "home" | "visit" | "ministries" | "sermons" | "events"

/**
 * The church pack's site: five kernel-composed pages from one `content.ts`
 * in the hymnal register. When the pack is active it owns /, /visit,
 * /ministries, /sermons, and /events; on the preview route the same pages
 * nest under /church/*.
 *
 * The configs are rebuilt per render with the current time (the menu
 * pack's discipline), so the "Next service" hero badge and the events
 * pages' upcoming/past split stay computed, never curated: a passed date
 * can't show as upcoming, and the badge always names the real next
 * gathering.
 *
 * Each page's config resolves through the landing document's per-page
 * merge (`useSitePageConfig`), keyed by the page kind — the same contract
 * as manifest marketing pages, so the platform's structural editor can
 * reorder, delete, and add sections with a live repaint. The pack's
 * catalog publishes the route map (`landing.routes`).
 */
export default function ChurchPage({ page = "home" }: { page?: ChurchPageKind }): React.ReactElement {
    const basePath = activePack.key === "church" ? "" : routes.church.path
    const now = new Date()
    // The calendar the pages render: the business-content contract
    // (repobot.content.json — the Manage UI's write surface) over the code
    // default, photographs joined back by slug, live-repainting on dev
    // document edits like the landing merge.
    const calendarEvents = useChurchCalendar()

    const config =
        page === "visit"
            ? visitLanding(basePath, now)
            : page === "ministries"
              ? ministriesLanding(basePath)
              : page === "sermons"
                ? sermonsLanding(basePath)
                : page === "events"
                  ? eventsLanding(basePath, now, calendarEvents)
                  : homeLanding(basePath, now, calendarEvents)
    // The merge only speaks for the ACTIVE pack: on the /church preview
    // route under another pack, the document's page ids belong to that
    // pack and must not bind here (the empty page id opts out).
    const docPageId = activePack.key === "church" ? page : ""
    const resolved = useSitePageConfig(docPageId, config)

    if (page === "visit") {
        return (
            <>
                <PageMeta title={`Visit — ${church.name}`} siteName={church.name} description={visit.body} />
                {/* Visit plans post formKey "plan-visit" through the managed
                    forms pipeline: the office gets an email and a dashboard
                    entry with zero setup. The storage key scopes the sandbox
                    fallback (and the "sent" state) to this pack. */}
                <LandingRenderer
                    config={resolved}
                    leadFormKey="plan-visit"
                    leadStorageKey="church-plan-visit"
                />
            </>
        )
    }
    if (page === "ministries") {
        return (
            <>
                <PageMeta
                    title={`Ministries — ${church.name}`}
                    siteName={church.name}
                    description={ministriesPage.body}
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "sermons") {
        return (
            <>
                <PageMeta
                    title={`Sermons — ${church.name}`}
                    siteName={church.name}
                    description={sermonsPage.body}
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "events") {
        return (
            <>
                <PageMeta
                    title={`Events — ${church.name}`}
                    siteName={church.name}
                    description={eventsPage.body}
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    return (
        <>
            <PageMeta title={church.name} siteName={church.name} description={home.subheadline} />
            <LandingRenderer config={resolved} />
        </>
    )
}
