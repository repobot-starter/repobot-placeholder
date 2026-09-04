import React from "react"
import { activePack } from "../../Config/activePack"
import { routes } from "../../Config/Router"
import { PageMeta } from "../../Seo/PageMeta"
import { useSitePageConfig } from "../Landing/landingDocument"
import { LandingRenderer } from "../Landing/LandingRenderer"
import { business, home, request } from "./content"
import { aboutLanding, homeLanding, requestLanding, servicesPageLanding } from "./servicesEmergencyLanding"

export type ServicesEmergencyPageKind = "home" | "services" | "about" | "request"

/**
 * The emergency-services pack's site (docs/landing.md, the services
 * category's dispatch shape): four kernel-composed pages from one
 * `content.ts`. When the pack is active it owns /, /services, /about, and
 * /request; on the preview route the same pages nest under /emergency/*.
 *
 * Each page's config resolves through the landing document's per-page
 * merge (`useSitePageConfig`), keyed by the page kind — the same contract
 * as manifest marketing pages, so the platform's structural editor can
 * reorder, delete, and add sections on these pages with a live repaint.
 * The pack's catalog publishes the route map (`landing.routes`).
 */
export default function ServicesEmergencyPage({
    page = "home",
}: {
    page?: ServicesEmergencyPageKind
}): React.ReactElement {
    const basePath = activePack.key === "services-emergency" ? "" : routes.emergency.path

    const config =
        page === "services"
            ? servicesPageLanding(basePath)
            : page === "about"
              ? aboutLanding(basePath)
              : page === "request"
                ? requestLanding(basePath)
                : homeLanding(basePath)
    // The merge only speaks for the ACTIVE pack: on the /emergency preview
    // route under another pack, the document's page ids belong to that
    // pack and must not bind here (the empty page id opts out).
    const docPageId = activePack.key === "services-emergency" ? page : ""
    const resolved = useSitePageConfig(docPageId, config)

    if (page === "services") {
        return (
            <>
                <PageMeta
                    title={`Services & prices — ${business.name}`}
                    siteName={business.name}
                    description={`Flat-priced services from ${business.name} — ${business.tagline.toLowerCase()}, ${business.location}.`}
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
    if (page === "request") {
        return (
            <>
                <PageMeta
                    title={`Request service — ${business.name}`}
                    siteName={business.name}
                    description={request.body}
                />
                {/* Service requests post formKey "service-request" through
                    the managed forms pipeline: the owner gets an email and a
                    dashboard entry with zero setup. The storage key scopes
                    the sandbox fallback (and the "sent" state) to this
                    pack. */}
                <LandingRenderer
                    config={resolved}
                    leadFormKey="service-request"
                    leadStorageKey="services-emergency-request"
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
