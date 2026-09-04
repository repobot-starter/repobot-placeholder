import React from "react"
import { activePack } from "../../Config/activePack"
import { routes } from "../../Config/Router"
import { PageMeta } from "../../Seo/PageMeta"
import { useSitePageConfig } from "../Landing/landingDocument"
import { LandingRenderer } from "../Landing/LandingRenderer"
import { agency, contact, home } from "./content"
import {
    aboutLanding,
    contactLanding,
    homeLanding,
    listingsLanding,
    neighborhoodsLanding,
} from "./estateLanding"
import { useEstateInventory } from "./inventory"

export type EstatePageKind = "home" | "listings" | "neighborhoods" | "about" | "contact"

/**
 * The estate pack's site: five kernel-composed pages from one
 * `content.ts`. When the pack is active it owns /, /listings,
 * /neighborhoods, /about, and /contact; on the preview route the same
 * pages nest under /estate/*.
 *
 * The home and listings configs are rebuilt per render so the computed
 * listing badges ("New this week", "Sale pending", "Sold"), the
 * days-on-market lines, and the hero's market pulse stay current (the
 * listings engine, listings.ts — the hours engine's idiom).
 *
 * Each page's config resolves through the landing document's per-page
 * merge (`useSitePageConfig`), keyed by the page kind — the same contract
 * as manifest marketing pages, so the platform's structural editor can
 * reorder, delete, and add sections on these pages with a live repaint.
 * The pack's catalog publishes the route map (`landing.routes`).
 */
export default function EstatePage({ page = "home" }: { page?: EstatePageKind }): React.ReactElement {
    const basePath = activePack.key === "estate" ? "" : routes.estate.path
    // The inventory the pages render: the business-content contract
    // (repobot.content.json — the Manage UI's write surface) over the code
    // default, photographs joined back by slug, live-repainting on dev
    // document edits like the landing merge.
    const inventory = useEstateInventory()

    const config =
        page === "listings"
            ? listingsLanding(basePath, new Date(), inventory)
            : page === "neighborhoods"
              ? neighborhoodsLanding(basePath)
              : page === "about"
                ? aboutLanding(basePath)
                : page === "contact"
                  ? contactLanding(basePath)
                  : homeLanding(basePath, new Date(), inventory)
    // The merge only speaks for the ACTIVE pack: on the /estate preview
    // route under another pack, the document's page ids belong to that
    // pack and must not bind here (the empty page id opts out).
    const docPageId = activePack.key === "estate" ? page : ""
    const resolved = useSitePageConfig(docPageId, config)

    if (page === "listings") {
        return (
            <>
                <PageMeta
                    title={`Listings — ${agency.name}`}
                    siteName={agency.name}
                    description={`Current listings from ${agency.name} — ${agency.tagline.toLowerCase()}, ${agency.location}.`}
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "neighborhoods") {
        return (
            <>
                <PageMeta
                    title={`Neighborhoods — ${agency.name}`}
                    siteName={agency.name}
                    description={`The neighborhoods ${agency.agent} works — ${agency.tagline.toLowerCase()}, ${agency.location}.`}
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "about") {
        return (
            <>
                <PageMeta
                    title={`About — ${agency.name}`}
                    siteName={agency.name}
                    description={`About ${agency.agent} — ${agency.tagline.toLowerCase()}, ${agency.location}. ${agency.license}.`}
                />
                <LandingRenderer config={resolved} />
            </>
        )
    }
    if (page === "contact") {
        return (
            <>
                <PageMeta
                    title={`Contact — ${agency.name}`}
                    siteName={agency.name}
                    description={contact.body}
                />
                {/* Inquiries post formKey "estate-inquiry" through the
                    managed forms pipeline: the owner gets an email and a
                    dashboard entry with zero setup. The storage key scopes
                    the sandbox fallback (and the "sent" state) to this
                    pack. */}
                <LandingRenderer
                    config={resolved}
                    leadFormKey="estate-inquiry"
                    leadStorageKey="estate-contact"
                />
            </>
        )
    }
    return (
        <>
            <PageMeta title={agency.name} siteName={agency.name} description={home.subheadline} />
            <LandingRenderer config={resolved} />
        </>
    )
}
