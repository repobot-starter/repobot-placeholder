import React from "react"
import { activePack } from "../../Config/activePack"
import { routes } from "../../Config/Router"
import { PageMeta } from "../../Seo/PageMeta"
import { useSitePageConfig } from "../Landing/landingDocument"
import { LandingRenderer } from "../Landing/LandingRenderer"
import { contact, creator, home, linksPage, looksPage } from "./content"
import { aboutLanding, contactLanding, homeLanding, linksLanding, looksLanding } from "./influencerLanding"
import { useInfluencerLinks, useInfluencerLooks } from "./inventory"

export type InfluencerPageKind = "home" | "looks" | "links" | "about" | "contact"

/**
 * The influencer pack's site: five kernel-composed pages from one
 * `content.ts`. When the pack is active it owns /, /looks, /links,
 * /about, and /contact; on the preview route the same pages nest under
 * /influencer/*.
 *
 * The looks and the link hub resolve through the business-content
 * contract's two creator domains (`useInfluencerLooks` /
 * `useInfluencerLinks` — repobot.content.json, the Manage surface's
 * write target, over the code defaults), the looks' photographs joined
 * back by slug, live-repainting on dev document edits like the landing
 * merge. The looks grid's filter chips and the hub's group chips are
 * derived from the resolved entries — both taxonomies are data, not code
 * — and the hub renders in entry order: the owner's arrangement IS the
 * hub.
 *
 * /contact carries the partnership ask: the campaign inquiry form
 * delivering through the platform's managed forms pipeline, with the
 * business email as copyable plain text beside it.
 *
 * Each page's config resolves through the landing document's per-page
 * merge (`useSitePageConfig`), keyed by the page kind — the same contract
 * as manifest marketing pages, so the platform's structural editor can
 * reorder, delete, and add sections with a live repaint. The pack's
 * catalog publishes the route map (`landing.routes`).
 */
export default function InfluencerPage({ page = "home" }: { page?: InfluencerPageKind }): React.ReactElement {
    const basePath = activePack.key === "influencer" ? "" : routes.influencer.path
    // The contract-resolved content the pages render: the business-content
    // document's looks and links over the code defaults.
    const looks = useInfluencerLooks()
    const links = useInfluencerLinks()

    const config =
        page === "looks"
            ? looksLanding(basePath, looks)
            : page === "links"
              ? linksLanding(basePath, links)
              : page === "about"
                ? aboutLanding(basePath)
                : page === "contact"
                  ? contactLanding(basePath)
                  : homeLanding(basePath, looks, links)
    // The merge only speaks for the ACTIVE pack: on the /influencer preview
    // route under another pack, the document's page ids belong to that
    // pack and must not bind here (the empty page id opts out).
    const docPageId = activePack.key === "influencer" ? page : ""
    const resolved = useSitePageConfig(docPageId, config)

    if (page === "looks") {
        return (
            <>
                <PageMeta
                    title={`Looks — ${creator.name}`}
                    siteName={creator.name}
                    description={looksPage.subheadline}
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "links") {
        return (
            <>
                <PageMeta
                    title={`Links — ${creator.name}`}
                    siteName={creator.name}
                    description={linksPage.subheadline}
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "about") {
        return (
            <>
                <PageMeta
                    title={`About — ${creator.name}`}
                    siteName={creator.name}
                    description={`About ${creator.name} — ${creator.tagline.toLowerCase()}, ${creator.location}.`}
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "contact") {
        return (
            <>
                <PageMeta
                    title={`Work with me — ${creator.name}`}
                    siteName={creator.name}
                    description={contact.body}
                />
                {/* Campaign inquiries post formKey "influencer-collab"
                    through the managed forms pipeline: the creator gets an
                    email and a dashboard entry with zero setup. The storage
                    key scopes the sandbox fallback (and the "sent" state)
                    to this pack. */}
                <LandingRenderer
                    config={resolved}
                    leadFormKey="influencer-collab"
                    leadStorageKey="influencer-contact"
                />
            </>
        )
    }
    return (
        <>
            <PageMeta title={creator.name} siteName={creator.name} description={home.subheadline} />
            <LandingRenderer config={resolved} />
        </>
    )
}
