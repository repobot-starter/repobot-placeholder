import React from "react"
import { useSearchParams } from "react-router-dom"
import { activePack } from "../../Config/activePack"
import { routes } from "../../Config/Router"
import { PageMeta } from "../../Seo/PageMeta"
import { useSitePageConfig } from "../Landing/landingDocument"
import { LandingRenderer } from "../Landing/LandingRenderer"
import { albums, home, inquire, photographer } from "./content"
import { aboutLanding, homeLanding, inquireLanding, packagesLanding, weddingsLanding } from "./weddingLanding"

export type WeddingPageKind = "home" | "weddings" | "packages" | "about" | "inquire"

/**
 * The wedding pack's site (docs/landing.md, "The photography-grade set"):
 * five kernel-composed pages from one `content.ts`. When the pack is
 * active it owns /, /weddings, /packages, /about, and /inquire; on the
 * preview route the same pages nest under /wedding/*. Wedding detail rides
 * `?wedding=` on the weddings page (the BlogBot `?post=` pattern) so a new
 * wedding is a content edit, never a route edit.
 *
 * Each page's config resolves through the landing document's per-page
 * merge (`useSitePageConfig`), keyed by the page kind — the same contract
 * as manifest marketing pages, so the platform's structural editor can
 * reorder, delete, and add sections on these pages with a live repaint.
 * The pack's catalog publishes the route map (`landing.routes`). Wedding
 * interiors merge under `wedding-<slug>` so photograph drops persist
 * without colliding with the index's skeleton.
 */
export default function WeddingPage({ page = "home" }: { page?: WeddingPageKind }): React.ReactElement {
    const [searchParams] = useSearchParams()
    const basePath = activePack.key === "wedding" ? "" : routes.wedding.path

    const weddingSlug = page === "weddings" ? searchParams.get("wedding") : null
    const album = weddingSlug !== null ? albums.find((entry) => entry.slug === weddingSlug) : undefined

    const config =
        page === "weddings"
            ? weddingsLanding(basePath, album)
            : page === "packages"
              ? packagesLanding(basePath)
              : page === "about"
                ? aboutLanding(basePath)
                : page === "inquire"
                  ? inquireLanding(basePath)
                  : homeLanding(basePath)
    // Wedding interiors are their own documented page (`wedding-<slug>`),
    // not the index — same route, different composition. Binding them lets
    // the preview editor persist photograph drops on the gallery itself.
    // The merge only speaks for the ACTIVE pack: on the /wedding preview
    // route under another pack, the document's page ids belong to that pack
    // and must not bind here (the empty page id opts out).
    const docPageId =
        activePack.key !== "wedding"
            ? ""
            : page === "weddings" && album !== undefined
              ? `wedding-${album.slug}`
              : page
    const resolved = useSitePageConfig(docPageId, config)

    if (page === "weddings") {
        return (
            <>
                <PageMeta
                    title={
                        album !== undefined
                            ? `${album.title} — ${photographer.name}`
                            : `Weddings — ${photographer.name}`
                    }
                    siteName={photographer.name}
                    description={
                        album?.description ??
                        `Weddings by ${photographer.name} — ${photographer.tagline.toLowerCase()}.`
                    }
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "packages") {
        return (
            <>
                <PageMeta
                    title={`Packages — ${photographer.name}`}
                    siteName={photographer.name}
                    description={`Wedding and elopement packages from ${photographer.name}, ${photographer.location}.`}
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
                <LandingRenderer config={resolved} leadFormKey="inquiry" leadStorageKey="wedding-inquiry" />
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
