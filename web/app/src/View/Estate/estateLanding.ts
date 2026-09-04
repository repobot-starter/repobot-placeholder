import type { LandingConfig, MarketingShellConfig } from "@ui"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import {
    about,
    agency,
    contact,
    home,
    landingCopy,
    metrics,
    neighborhoods,
    testimonials,
    type SiteImage,
} from "./content"
import { codeInventory, type InventoryListing } from "./inventory"
import { listingBadge, marketLine, marketPulseLabel, specsLine } from "./listings"
import { estateShell } from "./estateShell"

/**
 * The estate pack's pages as landing-kernel configs (docs/landing.md).
 * `content.ts` stays the single owner-editable source; these builders only
 * map it into sections.
 *
 * Every builder takes `basePath`: "" when the pack owns the site (links
 * are /listings, /about, /contact, …) and "/estate" on the preview route —
 * same pages, both wirings. The home and listings builders also take
 * `now`: their configs are rebuilt per render so the status badges ("New
 * this week", "Sale pending", "Sold"), the days-on-market lines, and the
 * hero's market pulse stay computed from the clock (the listings engine,
 * `listings.ts` — the hours engine's idiom).
 *
 * Every section carries a stable `id`: EstatePage pipes these configs
 * through the landing document's per-page merge (`useSitePageConfig`), so
 * the platform's structural editor can reorder / delete / add sections on
 * these pages and the ids are what the document's skeleton binds to. The
 * pack's catalog maps the routes (`landing.routes` in catalog.json).
 *
 * Listing-bearing builders take the RESOLVED inventory: the page resolves
 * the business-content contract over `content.ts` once (`useEstateInventory`
 * in EstatePage) and the builders render whatever cards they are handed —
 * an owner's Manage edit and the code default walk the same path. They
 * default to the code inventory lifted into contract shape, so callers
 * without a resolved document (pinned tests, the preview route) keep the
 * plain (basePath, now) signature.
 */

const imageMedia = (image: SiteImage) => ({
    kind: "image" as const,
    src: image.src,
    alt: image.alt,
    width: image.width,
    height: image.height,
    srcSet: image.srcSet,
})

/** A listing as a home-rail cover tile: the status pill over the photograph,
 * the neighborhood and live days-on-market line as the eyebrow. */
const featuredItem = (listing: InventoryListing, basePath: string, now: Date) => ({
    title: listing.title,
    description: listing.description,
    eyebrow: `${listing.neighborhood} · ${marketLine(listing, now)}`,
    meta: listing.price,
    media: imageMedia(listing.image),
    badge: listingBadge(listing, now),
    url: `${basePath}/listings`,
})

/** A listing as a grid card: specs up top, price beside the address, the
 * neighborhood tag feeding the filter chips, the computed status pill. */
const listingItem = (listing: InventoryListing, now: Date) => ({
    title: listing.title,
    description: listing.description,
    eyebrow: specsLine(listing),
    meta: listing.price,
    tags: [listing.neighborhood],
    media: imageMedia(listing.image),
    badge: listingBadge(listing, now),
})

// The shared chrome lives in estateShell.ts (manifest pages wear it too);
// this alias keeps the page builders reading naturally.
function shell(
    basePath: string,
    currentPath: "" | "/listings" | "/neighborhoods" | "/about" | "/contact",
): MarketingShellConfig {
    return estateShell(basePath, currentPath)
}

/** The closing ask every page ends on. */
const contactBanner = (basePath: string, body?: string) => ({
    id: "contact-banner",
    type: "cta-banner" as const,
    content: {
        title: landingCopy.finalCtaTitle,
        ...(body !== undefined ? { body } : {}),
        cta: { label: landingCopy.contactCtaLabel, href: `${basePath}/contact` },
    },
})

export function homeLanding(
    basePath: string,
    now: Date,
    inventory: InventoryListing[] = codeInventory(),
): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.estate },
        shell: shell(basePath, ""),
        sections: [
            {
                id: "hero",
                type: "hero",
                // The street IS the pitch: masthead type over the pack's
                // signature photograph, with the live market pulse as the
                // badge — must match the catalog's landing seed byte for
                // byte.
                variant: "masthead-overlay",
                content: {
                    badge: marketPulseLabel(inventory, now),
                    headline: home.headline,
                    subheadline: home.subheadline,
                    primaryCta: { label: "See the listings", href: `${basePath}/listings` },
                    secondaryCta: { label: `Call ${agency.phone}`, href: agency.phoneHref },
                    media: imageMedia(home.heroImage),
                },
            },
            {
                id: "featured-listings",
                type: "showcase",
                // The pack's signature: cover tiles wearing computed status
                // pills, on the browsable rail.
                variant: "media-rail",
                content: {
                    kicker: "Featured",
                    title: landingCopy.featuredHeading,
                    // The rail carries the contract's featured flags — the
                    // code path derives them from home.featuredListings, so
                    // both sides agree on which cards lead.
                    items: inventory
                        .filter((listing) => listing.featured === true)
                        .map((listing) => featuredItem(listing, basePath, now)),
                },
            },
            {
                id: "proof",
                type: "social-proof",
                variant: "metrics-row",
                content: {
                    label: agency.license,
                    metrics,
                },
            },
            {
                id: "neighborhoods",
                type: "showcase",
                // The album-index tiles, borrowed from photography: each
                // neighborhood as a cover photograph with its one-line
                // pitch beneath.
                variant: "collections",
                content: {
                    kicker: "Neighborhoods",
                    title: landingCopy.neighborhoodsHeading,
                    items: neighborhoods.map((hood) => ({
                        title: hood.name,
                        description: hood.tagline,
                        media: imageMedia(hood.image),
                        url: `${basePath}/neighborhoods`,
                    })),
                },
            },
            {
                id: "kind-words",
                type: "testimonials",
                // One voice, the whole room — the strongest story leads.
                variant: "single-featured",
                content: {
                    kicker: "From my clients",
                    quotes: testimonials.map((entry) => ({
                        quote: entry.quote,
                        author: entry.name,
                        title: entry.detail,
                    })),
                },
            },
            contactBanner(
                basePath,
                "Buying, selling, or just curious what your house is worth — one conversation, no obligation.",
            ),
        ],
    }
}

export function listingsLanding(
    basePath: string,
    now: Date,
    inventory: InventoryListing[] = codeInventory(),
): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.estate },
        shell: shell(basePath, "/listings"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: "Every listing, with its status.",
                    subheadline:
                        "What's new, what's pending, and what just closed — the pills keep themselves current. Filter by neighborhood below.",
                },
            },
            {
                id: "listings",
                type: "showcase",
                // The inventory grid: neighborhood chips derived from the
                // tags, computed status pills on every photograph.
                variant: "filterable-grid",
                content: {
                    kicker: "The inventory",
                    allLabel: "All neighborhoods",
                    items: inventory.map((listing) => listingItem(listing, now)),
                },
            },
            {
                id: "track-record",
                type: "social-proof",
                variant: "metrics-row",
                content: {
                    label: agency.license,
                    metrics,
                },
            },
            contactBanner(
                basePath,
                "Want a showing, or first word when something like this hits the market? Say so.",
            ),
        ],
    }
}

export function neighborhoodsLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.estate },
        shell: shell(basePath, "/neighborhoods"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: "Buy the street, not just the house.",
                    subheadline:
                        "Fourteen years on the same square mile — here's how its neighborhoods actually differ, block by block.",
                },
            },
            {
                id: "neighborhoods",
                type: "highlights",
                variant: "alternating",
                content: {
                    kicker: "The streets I work",
                    highlights: neighborhoods.map((hood) => ({
                        media: imageMedia(hood.image),
                        headline: hood.name,
                        body: hood.description,
                        cta: { label: "See what's listed", href: `${basePath}/listings` },
                    })),
                },
            },
            contactBanner(basePath, "Not sure which neighborhood fits? That's the first conversation."),
        ],
    }
}

export function aboutLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.estate },
        shell: shell(basePath, "/about"),
        sections: [
            {
                id: "story",
                type: "content-split",
                variant: "media-left",
                content: {
                    kicker: "The agent",
                    headline: about.headline,
                    body: about.paragraphs.join(" "),
                    bullets: [
                        agency.license,
                        "One agent, first showing to closing — no hand-offs",
                        "214 East Side sales since 2012, at 99% of asking",
                    ],
                    media: imageMedia(about.photo),
                    cta: { label: landingCopy.contactCtaLabel, href: `${basePath}/contact` },
                },
            },
            {
                id: "credentials",
                type: "social-proof",
                variant: "text-logos",
                content: {
                    label: "Credentials",
                    items: about.credentials,
                },
            },
            {
                id: "kind-words",
                type: "testimonials",
                variant: "quote-grid",
                content: {
                    kicker: "From my clients",
                    title: "The reviews that matter",
                    quotes: testimonials.map((entry) => ({
                        quote: entry.quote,
                        author: entry.name,
                        title: entry.detail,
                    })),
                },
            },
            contactBanner(basePath),
        ],
    }
}

export function contactLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.estate },
        shell: shell(basePath, "/contact"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: contact.headline,
                    subheadline: contact.body,
                },
            },
            {
                id: "contact-form",
                type: "lead-form",
                variant: "detail-form",
                content: {
                    kicker: "Contact",
                    title: "The details",
                    cta: "Send the note",
                    confirmation: contact.confirmation,
                    fields: contact.fields,
                    // Direct channels trail the form. The phone is a tel:
                    // link — a listing question is a phone call — while the
                    // email stays deliberately plain text (the photography
                    // pack's reasoning: selectable for whatever mail client
                    // the visitor uses). The form itself delivers through
                    // the platform's managed forms pipeline.
                    channels: [
                        { label: "Phone", value: agency.phone, href: agency.phoneHref },
                        { label: "Email", value: agency.email },
                        {
                            label: "Office",
                            value: agency.address,
                            href: `https://maps.google.com/?q=${encodeURIComponent(agency.address)}`,
                        },
                    ],
                },
            },
        ],
    }
}
