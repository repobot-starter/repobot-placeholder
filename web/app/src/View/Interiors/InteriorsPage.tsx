import React from "react"
import { activePack } from "../../Config/activePack"
import { routes } from "../../Config/Router"
import { PageMeta } from "../../Seo/PageMeta"
import { AppointmentWidget } from "../Landing/AppointmentWidget"
import { useSitePageConfig } from "../Landing/landingDocument"
import { LandingRenderer } from "../Landing/LandingRenderer"
import { useAppointmentsContent } from "../Landing/practiceDocument"
import { projectCategories } from "../Landing/projectsDocument"
import { booking, codeAppointments, contact, home, services, studio } from "./content"
import {
    aboutLanding,
    contactLanding,
    homeLanding,
    portfolioLanding,
    servicesLanding,
} from "./interiorsLanding"
import { useInteriorsPortfolio } from "./inventory"

export type InteriorsPageKind = "home" | "portfolio" | "offerings" | "about" | "contact"

/**
 * The interiors pack's site: five kernel-composed pages from one
 * `content.ts`. When the pack is active it owns /, /portfolio,
 * /offerings, /about, and /contact; on the preview route the same pages
 * nest under /interiors/*.
 *
 * The portfolio resolves through the business-content contract's projects
 * domain (`useInteriorsPortfolio` — repobot.content.json, the Manage UI's
 * write surface, over the code default), photographs joined back by slug,
 * live-repainting on dev document edits like the landing merge. The
 * portfolio grid's filter chips are derived from the resolved entries'
 * categories — the projects domain's taxonomy axis, data not code.
 *
 * /contact carries both asks: booking mode 2's visitor surface (the
 * AppointmentWidget as the hero's section trailer — discovery calls and
 * design consultations as real capacity-1 slots) above the managed
 * project-inquiry form. A visitor ready to talk books; a visitor still
 * forming the idea writes.
 *
 * Each page's config resolves through the landing document's per-page
 * merge (`useSitePageConfig`), keyed by the page kind — the same contract
 * as manifest marketing pages, so the platform's structural editor can
 * reorder, delete, and add sections with a live repaint. The pack's
 * catalog publishes the route map (`landing.routes`).
 */
export default function InteriorsPage({ page = "home" }: { page?: InteriorsPageKind }): React.ReactElement {
    const basePath = activePack.key === "interiors" ? "" : routes.interiors.path
    // The portfolio the pages render: the business-content contract's
    // projects domain over the code default, photographs joined by slug.
    const portfolio = useInteriorsPortfolio()
    const appointments = useAppointmentsContent(codeAppointments, "interiors")

    const config =
        page === "portfolio"
            ? portfolioLanding(basePath, portfolio)
            : page === "offerings"
              ? servicesLanding(basePath)
              : page === "about"
                ? aboutLanding(basePath)
                : page === "contact"
                  ? contactLanding(basePath)
                  : homeLanding(basePath, portfolio)
    // The merge only speaks for the ACTIVE pack: on the /interiors preview
    // route under another pack, the document's page ids belong to that
    // pack and must not bind here (the empty page id opts out).
    const docPageId = activePack.key === "interiors" ? page : ""
    const resolved = useSitePageConfig(docPageId, config)

    if (page === "portfolio") {
        return (
            <>
                <PageMeta
                    title={`Portfolio — ${studio.name}`}
                    siteName={studio.name}
                    description={`The portfolio of ${studio.name}, ${studio.location} — ${projectCategories(
                        portfolio,
                    )
                        .map((category) => category.toLowerCase())
                        .join(", ")}.`}
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "offerings") {
        return (
            <>
                <PageMeta
                    title={`Services — ${studio.name}`}
                    siteName={studio.name}
                    description={`How ${studio.name} works: ${services
                        .map((service) => service.title.toLowerCase())
                        .join(", ")} — with honest numbers up front.`}
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "about") {
        return (
            <>
                <PageMeta
                    title={`About — ${studio.name}`}
                    siteName={studio.name}
                    description={`About ${studio.principal} and the studio — ${studio.tagline.toLowerCase()}, ${studio.location}.`}
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "contact") {
        return (
            <>
                <PageMeta
                    title={`Start a project — ${studio.name}`}
                    siteName={studio.name}
                    description={contact.body}
                />
                {/* Inquiries post formKey "interiors-inquiry" through the
                    managed forms pipeline: the owner gets an email and a
                    dashboard entry with zero setup. The storage key scopes
                    the sandbox fallback (and the "sent" state) to this
                    pack. The appointment widget hangs under the hero: real
                    slot availability from the booking domain on a deploy,
                    sandbox simulation in the workspace. */}
                <LandingRenderer
                    config={resolved}
                    leadFormKey="interiors-inquiry"
                    leadStorageKey="interiors-contact"
                    sectionTrailers={{
                        hero: (
                            <AppointmentWidget
                                appointments={appointments}
                                headline={booking.headline}
                                intro={booking.intro}
                                statusLabels={booking.statusLabels}
                            />
                        ),
                    }}
                />
            </>
        )
    }
    // The catalog home closes on the consultation form: the same managed
    // "interiors-inquiry" pipeline as /contact, its own sandbox key.
    return (
        <>
            <PageMeta title={studio.name} siteName={studio.name} description={home.subheadline} />
            <LandingRenderer
                config={resolved}
                leadFormKey="interiors-inquiry"
                leadStorageKey="interiors-consultation"
            />
        </>
    )
}
