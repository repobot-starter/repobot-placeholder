import React from "react"
import { useSearchParams } from "react-router-dom"
import { activePack } from "../../Config/activePack"
import { routes } from "../../Config/Router"
import { PageMeta } from "../../Seo/PageMeta"
import { useSitePageConfig } from "../Landing/landingDocument"
import { LandingRenderer } from "../Landing/LandingRenderer"
import { about, home, inquire, photographer, pricesPage, rolls } from "./content"
import { aboutLanding, homeLanding, inquireLanding, pricesLanding, weddingsLanding } from "./editionLanding"

export type WeddingEditionPageKind = "home" | "weddings" | "prices" | "about" | "inquire"

/**
 * The Late Edition's site (docs/landing.md, "The newsroom set"): five
 * kernel-composed pages from one `content.ts`. When the pack is active it
 * owns /, /weddings, /prices, /about, and /inquire; on the preview route
 * the same pages nest under /wedding-edition/*. One roll's contact sheet
 * rides `?roll=` on the weddings page (the BlogBot `?post=` pattern), so
 * a new wedding is a content edit, never a route edit. The rate card's
 * proofing note links into the /proof room itself (the platform proofing
 * doors).
 *
 * Each page's config resolves through the landing document's per-page
 * merge (`useSitePageConfig`), keyed by the page kind — the same contract
 * as manifest marketing pages, so the platform's structural editor can
 * reorder, delete, and add sections with a live repaint. The pack's
 * catalog publishes the route map (`landing.routes`). Roll interiors merge
 * under `roll-<slug>` so photograph drops persist without colliding with
 * the index's skeleton.
 */
export default function WeddingEditionPage({
    page = "home",
}: {
    page?: WeddingEditionPageKind
}): React.ReactElement {
    const [searchParams] = useSearchParams()
    const basePath = activePack.key === "wedding-edition" ? "" : routes.weddingEdition.path

    const rollSlug = page === "weddings" ? searchParams.get("roll") : null
    const roll = rollSlug !== null ? rolls.find((entry) => entry.slug === rollSlug) : undefined

    const config =
        page === "weddings"
            ? weddingsLanding(basePath, roll)
            : page === "prices"
              ? pricesLanding(basePath)
              : page === "about"
                ? aboutLanding(basePath)
                : page === "inquire"
                  ? inquireLanding(basePath)
                  : homeLanding(basePath)
    // The merge only speaks for the ACTIVE pack: on the /wedding-edition
    // preview route under another pack, the document's page ids belong to
    // that pack and must not bind here (the empty page id opts out).
    const docPageId =
        activePack.key !== "wedding-edition"
            ? ""
            : page === "weddings" && roll !== undefined
              ? `roll-${roll.slug}`
              : page
    const resolved = useSitePageConfig(docPageId, config)
    const siteName = photographer.paper

    if (page === "weddings") {
        return (
            <>
                <PageMeta
                    title={
                        roll !== undefined
                            ? `Roll ${roll.number}: ${roll.title} — ${siteName}`
                            : `Weddings — ${siteName}`
                    }
                    siteName={siteName}
                    description={
                        roll?.description ??
                        `Contact sheets from ${photographer.name}'s weddings — ${photographer.tagline.toLowerCase()}, ${photographer.location}.`
                    }
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "prices") {
        return (
            <>
                <PageMeta title={`Prices — ${siteName}`} siteName={siteName} description={pricesPage.body} />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "about") {
        return (
            <>
                <PageMeta title={`About — ${siteName}`} siteName={siteName} description={about.deck} />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "inquire") {
        return (
            <>
                <PageMeta title={`Inquire — ${siteName}`} siteName={siteName} description={inquire.body} />
                {/* Inquiries post formKey "inquiry" through the managed forms
                    pipeline: the photographer gets an email and a dashboard
                    entry with zero setup. The storage key scopes the sandbox
                    fallback (and the "sent" state) to this pack. */}
                <LandingRenderer
                    config={resolved}
                    leadFormKey="inquiry"
                    leadStorageKey="wedding-edition-inquiry"
                />
            </>
        )
    }
    return (
        <>
            <PageMeta
                title={`${siteName} — ${photographer.tagline}`}
                siteName={siteName}
                description={home.deck}
            />
            <LandingRenderer config={resolved} />
        </>
    )
}
