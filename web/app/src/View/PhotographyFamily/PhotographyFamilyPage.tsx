import React from "react"
import { useSearchParams } from "react-router-dom"
import { activePack } from "../../Config/activePack"
import { routes } from "../../Config/Router"
import { PageMeta } from "../../Seo/PageMeta"
import { useSitePageConfig } from "../Landing/landingDocument"
import { LandingRenderer } from "../Landing/LandingRenderer"
import { useAppointmentsContent } from "../Landing/practiceDocument"
import {
    albums,
    book,
    codeAppointments,
    galleries,
    home,
    inquire,
    investment,
    landingCopy,
    photographer,
} from "./content"
import {
    aboutLanding,
    bookLanding,
    galleriesLanding,
    homeLanding,
    inquireLanding,
    investmentLanding,
    workLanding,
} from "./familyLanding"
import { SessionBookingWidget } from "./SessionBookingWidget"

export type PhotographyFamilyPageKind =
    "home" | "work" | "galleries" | "about" | "investment" | "book" | "inquire"

/**
 * The family-photography pack's site (docs/landing.md, "The
 * photography-grade set"): seven kernel-composed pages from one
 * `content.ts`. When the pack is active it owns /, /work, /galleries,
 * /investment, /about, /book, and /inquire; on the preview route the same
 * pages nest under /photography-family/*. Album detail rides `?album=` on
 * the work page (the BlogBot `?post=` pattern) so a new album is a
 * content edit, never a route edit. /galleries is the client-facing
 * proofing story, linking into the /proof room itself.
 *
 * /book carries booking mode 2's visitor surface: the SessionBookingWidget
 * mounts as the hero's section trailer, projecting the studio's session
 * types x weekly windows into capacity-1 slots — live availability from
 * the /__booking door on a deploy, sandbox simulation in the workspace.
 * The session offering resolves through the content contract
 * (`useAppointmentsContent` — repobot.content.json, the Manage UI's write
 * surface, over the code defaults), live-repainting on document edits.
 *
 * Each page's config resolves through the landing document's per-page
 * merge (`useSitePageConfig`), keyed by the page kind — the same contract
 * as manifest marketing pages, so the platform's structural editor can
 * reorder, delete, and add sections on these pages with a live repaint.
 * The pack's catalog publishes the route map (`landing.routes`). Album
 * interiors merge under `album-<slug>` so photograph drops persist without
 * colliding with the work index's skeleton.
 */
export default function PhotographyFamilyPage({
    page = "home",
}: {
    page?: PhotographyFamilyPageKind
}): React.ReactElement {
    const [searchParams] = useSearchParams()
    const basePath = activePack.key === "photography-family" ? "" : routes.photographyFamily.path
    const appointments = useAppointmentsContent(codeAppointments, "photography-family")

    const albumSlug = page === "work" ? searchParams.get("album") : null
    const album = albumSlug !== null ? albums.find((entry) => entry.slug === albumSlug) : undefined

    const config =
        page === "work"
            ? workLanding(basePath, album)
            : page === "galleries"
              ? galleriesLanding(basePath)
              : page === "about"
                ? aboutLanding(basePath)
                : page === "investment"
                  ? investmentLanding(basePath)
                  : page === "book"
                    ? bookLanding(basePath)
                    : page === "inquire"
                      ? inquireLanding(basePath)
                      : homeLanding(basePath)
    // Album interiors are their own documented page (`album-<slug>`), not the
    // work index — same route, different composition. Binding them lets the
    // preview editor persist photograph drops on the gallery itself. The
    // merge only speaks for the ACTIVE pack: on the /photography-family
    // preview route under another pack, the document's page ids belong to
    // that pack and must not bind here (the empty page id opts out).
    const docPageId =
        activePack.key !== "photography-family"
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
    if (page === "galleries") {
        return (
            <>
                <PageMeta
                    title={`Galleries — ${photographer.name}`}
                    siteName={photographer.name}
                    description={galleries.intro}
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
    if (page === "investment") {
        return (
            <>
                <PageMeta
                    title={`Investment — ${photographer.name}`}
                    siteName={photographer.name}
                    description={investment.body}
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "book") {
        return (
            <>
                <PageMeta
                    title={`${landingCopy.bookPageTitle} — ${photographer.name}`}
                    siteName={photographer.name}
                    description={book.intro}
                />
                {/* The booking widget hangs under the hero: real slot
                    availability from the /__booking door on a deploy,
                    sandbox simulation in the workspace (BookingClient in
                    @base/core), holding the same provider-overlap rule. */}
                <LandingRenderer
                    config={resolved}
                    sectionTrailers={{
                        hero: (
                            <SessionBookingWidget
                                appointments={appointments}
                                headline="Pick a time"
                                formNote={book.formNote}
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
                    leadStorageKey="photography-family-inquiry"
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
