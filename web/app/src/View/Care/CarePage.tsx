import React from "react"
import { activePack } from "../../Config/activePack"
import { routes } from "../../Config/Router"
import { PageMeta } from "../../Seo/PageMeta"
import { AppointmentWidget } from "../Landing/AppointmentWidget"
import { useSitePageConfig } from "../Landing/landingDocument"
import { LandingRenderer } from "../Landing/LandingRenderer"
import { useAppointmentsContent, usePracticeContent } from "../Landing/practiceDocument"
import {
    bookLanding,
    homeLanding,
    newPatientsLanding,
    providersLanding,
    servicesLanding,
} from "./careLanding"
import { booking, codeAppointments, codePractice, home, practice } from "./content"

export type CarePageKind = "home" | "providers" | "services" | "new-patients" | "book"

/**
 * The primary-care pack's site (docs/landing.md): five kernel-composed
 * pages from one `content.ts`. When the pack is active it owns /,
 * /providers, /services, /new-patients, and /book; on the preview route
 * the same pages nest under /care/*.
 *
 * The business facts resolve through the content contract
 * (`usePracticeContent` / `useAppointmentsContent` — repobot.content.json,
 * the Manage UI's write surface, over the code defaults), live-repainting
 * on dev document edits like the landing merge. Configs rebuild per render
 * with the current time so the hero's live open badge stays current.
 *
 * /book carries booking mode 2's visitor surface: the AppointmentWidget
 * mounts as the hero's section trailer, projecting the contract's visit
 * types x provider windows into capacity-1 slots — live seats on a
 * deploy, sandbox simulation in the workspace. The form it renders is
 * clinically empty by design (name, contact, visit type, new/returning);
 * see the widget's own tests, which enumerate its every field.
 *
 * Each page's config resolves through the landing document's per-page
 * merge (`useSitePageConfig`), keyed by the page kind — the same contract
 * as manifest marketing pages, so the platform's structural editor can
 * reorder, delete, and add sections with a live repaint. The pack's
 * catalog publishes the route map (`landing.routes`).
 */
export default function CarePage({ page = "home" }: { page?: CarePageKind }): React.ReactElement {
    const basePath = activePack.key === "care" ? "" : routes.care.path
    const now = new Date()
    const practiceContent = usePracticeContent(codePractice, "care")
    const appointments = useAppointmentsContent(codeAppointments, "care")

    const config =
        page === "providers"
            ? providersLanding(basePath, practiceContent)
            : page === "services"
              ? servicesLanding(basePath, practiceContent)
              : page === "new-patients"
                ? newPatientsLanding(basePath, practiceContent)
                : page === "book"
                  ? bookLanding(basePath, practiceContent)
                  : homeLanding(basePath, now, practiceContent)
    // The merge only speaks for the ACTIVE pack: on the /care preview
    // route under another pack, the document's page ids belong to that
    // pack and must not bind here (the empty page id opts out).
    const resolved = useSitePageConfig(activePack.key === "care" ? page : "", config)

    if (page === "providers") {
        return (
            <>
                <PageMeta
                    title={`Providers — ${practice.name}`}
                    siteName={practice.name}
                    description={`The providers at ${practice.name}, ${practice.city}.`}
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "services") {
        return (
            <>
                <PageMeta
                    title={`Services — ${practice.name}`}
                    siteName={practice.name}
                    description={`Primary-care services at ${practice.name} — physicals, same-day sick visits, chronic condition care, and more.`}
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "new-patients") {
        return (
            <>
                <PageMeta
                    title={`New patients — ${practice.name}`}
                    siteName={practice.name}
                    description={`Everything to know before your first visit to ${practice.name}.`}
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "book") {
        return (
            <>
                <PageMeta
                    title={`Book an appointment — ${practice.name}`}
                    siteName={practice.name}
                    description={booking.intro}
                />
                {/* The appointment widget hangs under the hero: real slot
                    availability from the booking domain on a deploy,
                    sandbox simulation in the workspace (BookingClient in
                    @base/core), holding the same provider-overlap rule. */}
                <LandingRenderer
                    config={resolved}
                    sectionTrailers={{
                        hero: (
                            <AppointmentWidget
                                appointments={appointments}
                                headline="Pick a time"
                                intro={booking.privacyNote}
                            />
                        ),
                    }}
                />
            </>
        )
    }
    return (
        <>
            <PageMeta title={practice.name} siteName={practice.name} description={home.subheadline} />
            <LandingRenderer config={resolved} />
        </>
    )
}
