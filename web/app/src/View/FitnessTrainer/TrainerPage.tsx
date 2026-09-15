import React from "react"
import { activePack } from "../../Config/activePack"
import { routes } from "../../Config/Router"
import { PageMeta } from "../../Seo/PageMeta"
import { BookingWidget } from "../Landing/BookingWidget"
import { useScheduleSessions } from "../Landing/contentDocument"
import { useSitePageConfig } from "../Landing/landingDocument"
import { LandingRenderer } from "../Landing/LandingRenderer"
import { consult, home, trainer, trainingWeek } from "./content"
import { applyLanding, homeLanding, programsLanding, resultsLanding } from "./trainerLanding"

export type TrainerPageKind = "home" | "programs" | "results" | "apply"

/**
 * The trainer pack's site (docs/landing.md): four kernel-composed pages
 * from one `content.ts`. When the pack is active it owns /, /programs,
 * /results, and /apply; on the preview route the same pages nest under
 * /trainer/*.
 *
 * Configs are rebuilt per render with the current time, so the training
 * week's today row and the live "Next session / In session" badge stay
 * current — the menu pack's open-badge discipline (hours.ts), applied to
 * one coach's book (schedule.ts).
 *
 * Each page's config resolves through the landing document's per-page
 * merge (`useSitePageConfig`), keyed by the page kind — the same contract
 * as manifest marketing pages, so the platform's structural editor can
 * reorder, delete, and add sections with a live repaint. The pack's
 * catalog publishes the route map (`landing.routes`).
 */
export default function TrainerPage({ page = "home" }: { page?: TrainerPageKind }): React.ReactElement {
    const basePath = activePack.key === "fitness-trainer" ? "" : routes.trainer.path
    const now = new Date()
    // The week the home page renders: the business-content contract
    // (repobot.content.json — the Manage UI's write surface) over the code
    // default, live-repainting on dev document edits like the landing merge.
    const schedule = useScheduleSessions(trainingWeek, "fitness-trainer")

    const config =
        page === "programs"
            ? programsLanding(basePath)
            : page === "results"
              ? resultsLanding(basePath)
              : page === "apply"
                ? applyLanding(basePath)
                : homeLanding(basePath, now, schedule)
    // The merge only speaks for the ACTIVE pack: on the /trainer preview
    // route under another pack, the document's page ids belong to that
    // pack and must not bind here (the empty page id opts out).
    const resolved = useSitePageConfig(activePack.key === "fitness-trainer" ? page : "", config)

    if (page === "programs") {
        return (
            <>
                <PageMeta
                    title={`Programs — ${trainer.brand}`}
                    siteName={trainer.brand}
                    description={`Small group, 1:1, and online strength coaching with ${trainer.name}, ${trainer.city}.`}
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "results") {
        return (
            <>
                <PageMeta
                    title={`Results — ${trainer.brand}`}
                    siteName={trainer.brand}
                    description={`Client results and the training floor at ${trainer.brand}, ${trainer.city}.`}
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "apply") {
        return (
            <>
                <PageMeta
                    title={`Free consult — ${trainer.brand}`}
                    siteName={trainer.brand}
                    description={consult.body}
                />
                {/* Applications post formKey "free-consult" through the
                    managed forms pipeline: the owner gets an email and a
                    dashboard entry with zero setup. The storage key scopes
                    the sandbox fallback (and the "sent" state) to this
                    pack. */}
                <LandingRenderer
                    config={resolved}
                    leadFormKey="free-consult"
                    leadStorageKey="fitness-trainer-consult"
                />
            </>
        )
    }
    return (
        <>
            <PageMeta title={trainer.brand} siteName={trainer.brand} description={home.subheadline} />
            {/* This pack's schedule grid lives on the home page, so the
                booking widget (live seats for the contract's bookable
                sessions; sandbox simulation off-deploy) hangs here. */}
            <LandingRenderer
                config={resolved}
                sectionTrailers={{ schedule: <BookingWidget sessions={schedule} noun="session" /> }}
            />
        </>
    )
}
