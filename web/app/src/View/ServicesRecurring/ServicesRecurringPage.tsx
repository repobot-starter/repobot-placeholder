import React from "react"
import { activePack } from "../../Config/activePack"
import { routes } from "../../Config/Router"
import { PageMeta } from "../../Seo/PageMeta"
import { useSitePageConfig } from "../Landing/landingDocument"
import { LandingRenderer } from "../Landing/LandingRenderer"
import { book, business, home } from "./content"
import { aboutLanding, bookLanding, homeLanding, plansLanding } from "./servicesRecurringLanding"

export type ServicesRecurringPageKind = "home" | "plans" | "about" | "book"

/**
 * The recurring-services pack's site (docs/landing.md, the services
 * category's recurring/booking shape): four kernel-composed pages from one
 * `content.ts`. When the pack is active it owns /, /plans, /about, and
 * /book; on the preview route the same pages nest under /cleaning/*.
 *
 * The home config is rebuilt per render so the hero's live "Open now"
 * badge stays current (the shared hours engine, View/Landing/hours.ts).
 *
 * Each page's config resolves through the landing document's per-page
 * merge (`useSitePageConfig`), keyed by the page kind — the same contract
 * as manifest marketing pages, so the platform's structural editor can
 * reorder, delete, and add sections on these pages with a live repaint.
 * The pack's catalog publishes the route map (`landing.routes`).
 */
export default function ServicesRecurringPage({
    page = "home",
}: {
    page?: ServicesRecurringPageKind
}): React.ReactElement {
    const basePath = activePack.key === "services-recurring" ? "" : routes.cleaning.path

    const config =
        page === "plans"
            ? plansLanding(basePath)
            : page === "about"
              ? aboutLanding(basePath)
              : page === "book"
                ? bookLanding(basePath)
                : homeLanding(basePath, new Date())
    // The merge only speaks for the ACTIVE pack: on the /cleaning preview
    // route under another pack, the document's page ids belong to that
    // pack and must not bind here (the empty page id opts out).
    const docPageId = activePack.key === "services-recurring" ? page : ""
    const resolved = useSitePageConfig(docPageId, config)

    if (page === "plans") {
        return (
            <>
                <PageMeta
                    title={`Plans & pricing — ${business.name}`}
                    siteName={business.name}
                    description={`Plans and per-visit pricing from ${business.name} — ${business.tagline.toLowerCase()}, ${business.location}.`}
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "about") {
        return (
            <>
                <PageMeta
                    title={`About — ${business.name}`}
                    siteName={business.name}
                    description={`About ${business.name} — ${business.tagline.toLowerCase()}, ${business.location}. ${business.license}.`}
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "book") {
        return (
            <>
                <PageMeta
                    title={`Book — ${business.name}`}
                    siteName={business.name}
                    description={book.body}
                />
                {/* Booking requests post formKey "booking-request" through
                    the managed forms pipeline: the owner gets an email and a
                    dashboard entry with zero setup. The storage key scopes
                    the sandbox fallback (and the "sent" state) to this
                    pack. */}
                <LandingRenderer
                    config={resolved}
                    leadFormKey="booking-request"
                    leadStorageKey="services-recurring-book"
                />
            </>
        )
    }
    return (
        <>
            <PageMeta title={business.name} siteName={business.name} description={home.subheadline} />
            <LandingRenderer config={resolved} />
        </>
    )
}
