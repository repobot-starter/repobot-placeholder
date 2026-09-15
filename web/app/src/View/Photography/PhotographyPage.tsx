import React from "react"
import { useSearchParams } from "react-router-dom"
import { activePack } from "../../Config/activePack"
import { routes } from "../../Config/Router"
import { PageMeta } from "../../Seo/PageMeta"
import { useSitePageConfig } from "../Landing/landingDocument"
import { LandingRenderer } from "../Landing/LandingRenderer"
import { useAppointmentsContent } from "../Landing/practiceDocument"
import { BookingWidget } from "./BookingWidget"
import { albums, booking, codeAppointments, galleries, home, inquire, photographer } from "./content"
import {
    aboutLanding,
    bookLanding,
    galleriesLanding,
    homeLanding,
    inquireLanding,
    workLanding,
} from "./photographyLanding"

export type PhotographyPageKind = "home" | "work" | "galleries" | "about" | "book" | "inquire"

/**
 * The photography pack's site (docs/landing.md, "The photography-grade
 * set"): six kernel-composed pages from one `content.ts`. When the pack
 * is active it owns /, /work, /galleries, /about, /book, and /inquire; on
 * the preview route the same pages nest under /photography/*. Album
 * detail rides `?album=` on the work page (the BlogBot `?post=` pattern)
 * so a new album is a content edit, never a route edit.
 *
 * Each page's config resolves through the landing document's per-page
 * merge (`useSitePageConfig`), keyed by the page kind — the same contract
 * as manifest marketing pages, so the platform's structural editor can
 * reorder, delete, and add sections on these pages with a live repaint.
 * The pack's catalog publishes the route map (`landing.routes`). Album
 * interiors merge under `album-<slug>` so photograph drops persist without
 * colliding with the work index's skeleton.
 */
export default function PhotographyPage({
    page = "home",
}: {
    page?: PhotographyPageKind
}): React.ReactElement {
    const [searchParams] = useSearchParams()
    const basePath = activePack.key === "photography" ? "" : routes.photography.path
    // The appointments domain resolves through the business-content
    // contract (Manage's write surface) over the code fallback, exactly
    // like the care pack — an owner's calendar edit repaints /book live.
    const appointments = useAppointmentsContent(codeAppointments, "photography")

    const albumSlug = page === "work" ? searchParams.get("album") : null
    const album = albumSlug !== null ? albums.find((entry) => entry.slug === albumSlug) : undefined

    const config =
        page === "work"
            ? workLanding(basePath, album)
            : page === "galleries"
              ? galleriesLanding(basePath)
              : page === "about"
                ? aboutLanding(basePath)
                : page === "book"
                  ? bookLanding(basePath)
                  : page === "inquire"
                    ? inquireLanding(basePath)
                    : homeLanding(basePath)
    // Album interiors are their own documented page (`album-<slug>`), not the
    // work index — same route, different composition. Binding them lets the
    // preview editor persist photograph drops on the gallery itself. The
    // merge only speaks for the ACTIVE pack: on the /photography preview
    // route under another pack, the document's page ids belong to that pack
    // and must not bind here (the empty page id opts out).
    const docPageId =
        activePack.key !== "photography"
            ? ""
            : page === "work" && album !== undefined
              ? `album-${album.slug}`
              : page
    const resolved = useSitePageConfig(docPageId, config)

    if (page === "work") {
        return (
            <>
                <PageMeta
                    title={
                        album !== undefined
                            ? `${album.title} — ${photographer.name}`
                            : `Work — ${photographer.name}`
                    }
                    siteName={photographer.name}
                    description={
                        album?.description ??
                        `Collections by ${photographer.name} — ${photographer.tagline.toLowerCase()}.`
                    }
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "about") {
        return (
            <>
                <PageMeta
                    title={`About — ${photographer.name}`}
                    siteName={photographer.name}
                    description={`About ${photographer.name} — ${photographer.tagline.toLowerCase()}, ${photographer.location}.`}
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "galleries") {
        return (
            <>
                <PageMeta
                    title={`Client galleries — ${photographer.name}`}
                    siteName={photographer.name}
                    description={galleries.intro}
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "book") {
        return (
            <>
                <PageMeta
                    title={`Book a session — ${photographer.name}`}
                    siteName={photographer.name}
                    description={booking.intro}
                />
                {/* The session widget hangs under the hero: real slot
                    availability from the booking domain on a deploy,
                    sandbox simulation in the workspace (BookingClient in
                    @base/core), the care pack's exact door discipline. */}
                <LandingRenderer
                    config={resolved}
                    sectionTrailers={{
                        hero: (
                            <BookingWidget
                                appointments={appointments}
                                sessionImages={booking.sessionImages}
                                inquireHref={`${basePath}/inquire`}
                            />
                        ),
                    }}
                />
            </>
        )
    }
    if (page === "inquire") {
        return (
            <>
                <PageMeta
                    title={`Inquire — ${photographer.name}`}
                    siteName={photographer.name}
                    description={inquire.body}
                />
                {/* Inquiries post formKey "inquiry" through the managed forms
                    pipeline: the photographer gets an email and a dashboard
                    entry with zero setup. The storage key scopes the sandbox
                    fallback (and the "sent" state) to this pack. */}
                <LandingRenderer
                    config={resolved}
                    leadFormKey="inquiry"
                    leadStorageKey="photography-inquiry"
                />
            </>
        )
    }
    return (
        <>
            <PageMeta title={photographer.name} siteName={photographer.name} description={home.subheadline} />
            <LandingRenderer config={resolved} />
        </>
    )
}
