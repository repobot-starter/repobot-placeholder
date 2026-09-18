import React from "react"
import { activePack } from "../../Config/activePack"
import { routes } from "../../Config/Router"
import { PageMeta } from "../../Seo/PageMeta"
import { BookingWidget } from "../Landing/BookingWidget"
import { useScheduleSessions } from "../Landing/contentDocument"
import { useSitePageConfig } from "../Landing/landingDocument"
import { LandingRenderer } from "../Landing/LandingRenderer"
import { home, intro, studio, weeklySchedule } from "./content"
import { beginLanding, homeLanding, pricingLanding, scheduleLanding, teachersLanding } from "./yogaLanding"

export type YogaPageKind = "home" | "schedule" | "teachers" | "pricing" | "begin"

/**
 * The yoga & pilates pack's site (docs/landing.md): five kernel-composed
 * pages from one `content.ts`. When the pack is active it owns /,
 * /schedule, /teachers, /pricing, and /begin; on the preview route the
 * same pages nest under /yoga/*.
 *
 * Configs are rebuilt per render with the current time, so the schedule
 * grid's today column and the live "Next class / In session" badge stay
 * current — the schedule engine (web/app/src/View/Landing/schedule.ts)
 * owns that logic.
 *
 * Each page's config resolves through the landing document's per-page
 * merge (`useSitePageConfig`), keyed by the page kind — the same contract
 * as manifest marketing pages, so the platform's structural editor can
 * reorder, delete, and add sections with a live repaint. The pack's
 * catalog publishes the route map (`landing.routes`).
 */
export default function YogaPage({ page = "home" }: { page?: YogaPageKind }): React.ReactElement {
    const basePath = activePack.key === "fitness-yoga" ? "" : routes.yoga.path
    const now = new Date()
    // The week the pages render: the business-content contract
    // (repobot.content.json — the Manage UI's write surface) over the code
    // default, live-repainting on dev document edits like the landing merge.
    const schedule = useScheduleSessions(weeklySchedule, "fitness-yoga")

    const config =
        page === "schedule"
            ? scheduleLanding(basePath, now, schedule)
            : page === "teachers"
              ? teachersLanding(basePath)
              : page === "pricing"
                ? pricingLanding(basePath)
                : page === "begin"
                  ? beginLanding(basePath)
                  : homeLanding(basePath, now, schedule)
    // The merge only speaks for the ACTIVE pack: on the /yoga preview
    // route under another pack, the document's page ids belong to that
    // pack and must not bind here (the empty page id opts out).
    const resolved = useSitePageConfig(activePack.key === "fitness-yoga" ? page : "", config)

    if (page === "schedule") {
        return (
            <>
                <PageMeta
                    title={`Schedule — ${studio.name}`}
                    siteName={studio.name}
                    description={`The weekly class schedule at ${studio.name} — ${studio.tagline.toLowerCase()} in ${studio.city}.`}
                />
                {/* The booking widget hangs under the schedule grid: live
                    seats for the contract's bookable classes, sandbox
                    simulation off-deploy (BookingClient in @base/core). */}
                <LandingRenderer
                    config={resolved}
                    sectionTrailers={{ schedule: <BookingWidget sessions={schedule} /> }}
                />
            </>
        )
    }
    if (page === "teachers") {
        return (
            <>
                <PageMeta
                    title={`Teachers — ${studio.name}`}
                    siteName={studio.name}
                    description={`The teachers at ${studio.name}, ${studio.city}.`}
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "pricing") {
        return (
            <>
                <PageMeta
                    title={`Pricing — ${studio.name}`}
                    siteName={studio.name}
                    description={`Memberships, drop-ins, and the two-week introduction at ${studio.name}.`}
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "begin") {
        return (
            <>
                <PageMeta title={`Begin — ${studio.name}`} siteName={studio.name} description={intro.body} />
                {/* Introduction requests post formKey "intro-offer" through
                    the managed forms pipeline: the owner gets an email and
                    a dashboard entry with zero setup. The storage key
                    scopes the sandbox fallback to this pack. */}
                <LandingRenderer config={resolved} leadFormKey="intro-offer" leadStorageKey="yoga-begin" />
            </>
        )
    }
    return (
        <>
            <PageMeta title={studio.name} siteName={studio.name} description={home.subheadline} />
            <LandingRenderer config={resolved} />
        </>
    )
}
