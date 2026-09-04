import React from "react"
import { useSearchParams } from "react-router-dom"
import { activePack } from "../../Config/activePack"
import { routes } from "../../Config/Router"
import { PageMeta } from "../../Seo/PageMeta"
import { useSitePageConfig } from "../Landing/landingDocument"
import { LandingRenderer } from "../Landing/LandingRenderer"
import { albums, book, home, photographer } from "./content"
import { aboutLanding, bookLanding, homeLanding, workLanding } from "./musicLanding"

export type PhotographyMusicPageKind = "home" | "work" | "about" | "book"

/**
 * The music-photography pack's site (docs/landing.md, "The photography-
 * grade set"): four kernel-composed pages from one `content.ts`. When the
 * pack is active it owns /, /work, /about, and /book; on the preview route
 * the same pages nest under /photography-music/*. Album detail rides
 * `?album=` on the work page (the photography pack's pattern) so a new
 * album is a content edit, never a route edit.
 *
 * Each page's config resolves through the landing document's per-page
 * merge (`useSitePageConfig`), keyed by the page kind — the same contract
 * as manifest marketing pages, so the platform's structural editor can
 * reorder, delete, and add sections on these pages with a live repaint.
 * The pack's catalog publishes the route map (`landing.routes`). Album
 * interiors merge under `album-<slug>` so photograph drops persist without
 * colliding with the work index's skeleton.
 */
export default function PhotographyMusicPage({
    page = "home",
}: {
    page?: PhotographyMusicPageKind
}): React.ReactElement {
    const [searchParams] = useSearchParams()
    const basePath = activePack.key === "photography-music" ? "" : routes.photographyMusic.path

    const albumSlug = page === "work" ? searchParams.get("album") : null
    const album = albumSlug !== null ? albums.find((entry) => entry.slug === albumSlug) : undefined

    const config =
        page === "work"
            ? workLanding(basePath, album)
            : page === "about"
              ? aboutLanding(basePath)
              : page === "book"
                ? bookLanding(basePath)
                : homeLanding(basePath)
    // Album interiors are their own documented page (`album-<slug>`), not
    // the work index — same route, different composition. Binding them lets
    // the preview editor persist photograph drops on the gallery itself.
    // The merge only speaks for the ACTIVE pack: on the /photography-music
    // preview route under another pack, the document's page ids belong to
    // that pack and must not bind here (the empty page id opts out).
    const docPageId =
        activePack.key !== "photography-music"
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
                        `The archive of ${photographer.name} — ${photographer.tagline.toLowerCase()}.`
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
    if (page === "book") {
        return (
            <>
                <PageMeta
                    title={`Book — ${photographer.name}`}
                    siteName={photographer.name}
                    description={book.body}
                />
                {/* Bookings post formKey "booking" through the managed forms
                    pipeline: the photographer gets an email and a dashboard
                    entry with zero setup. The storage key scopes the sandbox
                    fallback (and the "sent" state) to this pack. */}
                <LandingRenderer
                    config={resolved}
                    leadFormKey="booking"
                    leadStorageKey="photography-music-booking"
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
