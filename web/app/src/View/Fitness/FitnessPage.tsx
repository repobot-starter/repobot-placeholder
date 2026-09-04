import React from "react"
import { activePack } from "../../Config/activePack"
import { routes } from "../../Config/Router"
import { PageMeta } from "../../Seo/PageMeta"
import { BookingWidget } from "../Landing/BookingWidget"
import { useScheduleSessions } from "../Landing/contentDocument"
import { useSitePageConfig } from "../Landing/landingDocument"
import { LandingRenderer } from "../Landing/LandingRenderer"
import { gym, home, trial, weeklySchedule } from "./content"
import { coachesLanding, homeLanding, pricingLanding, scheduleLanding, trialLanding } from "./fitnessLanding"

export type FitnessPageKind = "home" | "schedule" | "coaches" | "pricing" | "trial"

/**
 * The strength-club pack's site (docs/landing.md): five kernel-composed
 * pages from one `content.ts`. When the pack is active it owns /,
 * /schedule, /coaches, /pricing, and /trial; on the preview route the same
 * pages nest under /fitness/*.
 *
 * Configs are rebuilt per render with the current time, so the schedule
 * grid's today column and the live "Next class / In session" badge stay
 * current — the menu pack's open-badge discipline (hours.ts), applied to
 * a timetable (schedule.ts).
 *
 * Each page's config resolves through the landing document's per-page
 * merge (`useSitePageConfig`), keyed by the page kind — the same contract
 * as manifest marketing pages, so the platform's structural editor can
 * reorder, delete, and add sections with a live repaint. The pack's
 * catalog publishes the route map (`landing.routes`).
 */
export default function FitnessPage({ page = "home" }: { page?: FitnessPageKind }): React.ReactElement {
    const basePath = activePack.key === "fitness" ? "" : routes.fitness.path
    const now = new Date()
    // The week the pages render: the business-content contract
    // (repobot.content.json — the Manage UI's write surface) over the code
    // default, live-repainting on dev document edits like the landing merge.
    const schedule = useScheduleSessions(weeklySchedule, "fitness")

    const config =
        page === "schedule"
            ? scheduleLanding(basePath, now, schedule)
            : page === "coaches"
              ? coachesLanding(basePath)
              : page === "pricing"
                ? pricingLanding(basePath)
                : page === "trial"
                  ? trialLanding(basePath)
                  : homeLanding(basePath, now, schedule)
    // The merge only speaks for the ACTIVE pack: on the /fitness preview
    // route under another pack, the document's page ids belong to that
    // pack and must not bind here (the empty page id opts out).
    const resolved = useSitePageConfig(activePack.key === "fitness" ? page : "", config)

    if (page === "schedule") {
        return (
            <>
                <PageMeta
                    title={`Schedule — ${gym.name}`}
                    siteName={gym.name}
                    description={`The weekly class schedule at ${gym.name} — ${gym.tagline.toLowerCase()} in ${gym.city}.`}
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
    if (page === "coaches") {
        return (
            <>
                <PageMeta
                    title={`Coaches — ${gym.name}`}
                    siteName={gym.name}
                    description={`The coaching staff at ${gym.name}, ${gym.city}.`}
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "pricing") {
        return (
            <>
                <PageMeta
                    title={`Pricing — ${gym.name}`}
                    siteName={gym.name}
                    description={`Memberships, class packs, and drop-in rates at ${gym.name}.`}
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "trial") {
        return (
            <>
                <PageMeta title={`Free week — ${gym.name}`} siteName={gym.name} description={trial.body} />
                {/* Trial requests post formKey "free-trial" through the
                    managed forms pipeline: the owner gets an email and a
                    dashboard entry with zero setup. The storage key scopes
                    the sandbox fallback (and the "sent" state) to this
                    pack. */}
                <LandingRenderer config={resolved} leadFormKey="free-trial" leadStorageKey="fitness-trial" />
            </>
        )
    }
    return (
        <>
            <PageMeta title={gym.name} siteName={gym.name} description={home.subheadline} />
            <LandingRenderer config={resolved} />
        </>
    )
}
