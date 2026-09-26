import React from "react"
import { activePack } from "../../Config/activePack"
import { routes } from "../../Config/Router"
import { PageMeta } from "../../Seo/PageMeta"
import { AppointmentWidget } from "../Landing/AppointmentWidget"
import { useSitePageConfig } from "../Landing/landingDocument"
import { LandingRenderer } from "../Landing/LandingRenderer"
import { useAppointmentsContent } from "../Landing/practiceDocument"
import { booking, business, codeAppointments, home, landingCopy, quote } from "./content"
import {
    aboutLanding,
    homeLanding,
    projectsLanding,
    quoteLanding,
    servicesPageLanding,
} from "./servicesLanding"

export type ServicesPageKind = "home" | "projects" | "services" | "about" | "quote"

/**
 * The services pack's site (docs/landing.md, "Custom builder / fine
 * trades" blueprint): five kernel-composed pages from one `content.ts`. When the
 * pack is active it owns /, /projects, /services, /about, and /quote; on
 * the preview route the same pages nest under /services/* (the services
 * list previews at /services/services — the pack key and the page share
 * a name, and the preview prefix wins).
 *
 * The home config is rebuilt per render so a storefront hero's live
 * "Open now" badge stays current (the shared hours engine, View/Landing/hours.ts).
 *
 * Each page's config resolves through the landing document's per-page
 * merge (`useSitePageConfig`), keyed by the page kind — the same contract
 * as manifest marketing pages, so the platform's structural editor can
 * reorder, delete, and add sections on these pages with a live repaint.
 * The pack's catalog publishes the route map (`landing.routes`).
 */
export default function ServicesPage({ page = "home" }: { page?: ServicesPageKind }): React.ReactElement {
    const basePath = activePack.key === "services" ? "" : routes.services.path
    const appointments = useAppointmentsContent(codeAppointments, "services")

    const config =
        page === "projects"
            ? projectsLanding(basePath)
            : page === "services"
              ? servicesPageLanding(basePath)
              : page === "about"
                ? aboutLanding(basePath)
                : page === "quote"
                  ? quoteLanding(basePath)
                  : homeLanding(basePath, new Date())
    // The merge only speaks for the ACTIVE pack: on the /services preview
    // route under another pack, the document's page ids belong to that
    // pack and must not bind here (the empty page id opts out).
    const docPageId = activePack.key === "services" ? page : ""
    const resolved = useSitePageConfig(docPageId, config)

    if (page === "projects") {
        return (
            <>
                <PageMeta
                    title={`${landingCopy.nav.projects} — ${business.name}`}
                    siteName={business.name}
                    description={`Before-and-after projects by ${business.name} — ${business.tagline.toLowerCase()}, ${business.location}.`}
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "services") {
        return (
            <>
                <PageMeta
                    title={`${landingCopy.nav.services} — ${business.name}`}
                    siteName={business.name}
                    description={`Services and starting prices from ${business.name} — ${business.tagline.toLowerCase()}, ${business.location}.`}
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "about") {
        return (
            <>
                <PageMeta
                    title={`${landingCopy.nav.about} — ${business.name}`}
                    siteName={business.name}
                    description={`About ${business.name} — ${business.tagline.toLowerCase()}, ${business.location}. ${business.license}.`}
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "quote") {
        return (
            <>
                <PageMeta
                    title={`${landingCopy.nav.cta} — ${business.name}`}
                    siteName={business.name}
                    description={quote.body}
                />
                {/* Quote requests post formKey "quote-request" through the
                    managed forms pipeline: the owner gets an email and a
                    dashboard entry with zero setup. The storage key scopes
                    the sandbox fallback (and the "sent" state) to this
                    pack. The slot picker hangs under the hero — booking
                    mode 2 on the managed booking kernel, the same widget
                    the care pack mounts (content.ts's visit types,
                    capacity-1): real seats on a deploy, sandbox
                    simulation in the workspace. */}
                <LandingRenderer
                    config={resolved}
                    leadFormKey="quote-request"
                    leadStorageKey="services-quote"
                    sectionTrailers={{
                        hero: (
                            <AppointmentWidget
                                appointments={appointments}
                                headline={booking.headline}
                                intro={booking.intro}
                                statusLabels={booking.statusLabels}
                                privacyNote={booking.privacyNote}
                            />
                        ),
                    }}
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
