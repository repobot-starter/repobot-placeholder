import type { LandingConfig, LandingSection, MarketingShellConfig } from "@ui"
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
 *
 * A seed that sets `home.stack` gets the plates home instead (see
 * `EstateStack`); the other pages are the same either way.
 */

/**
 * The plates home: the hero photograph with the line, the market pulse, and
 * both asks at its foot, then the featured listings edge to edge at the
 * hero's size — each captioned inside its photograph with the address over
 * its particulars and computed status (gallery `sequence`, `captionStack`
 * `overlay-start`, item `detail`) — the metrics, the agent, the
 * neighborhoods, the clients' words, and the closing line over the contact
 * link (cta-banner `colophon`). "" for `closing` falls back to the final
 * ask's title; "" for `agentCta` drops the story's link.
 */
export interface EstateStack {
    closing: string
    closingBody: string
    agentCta: string
}

/** The seed's plates home, when it sets one. Seeds infer `home`, so it's read structurally. */
function homeStack(): EstateStack | undefined {
    return "stack" in home ? (home.stack as EstateStack | undefined) : undefined
}

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
const contactBanner = (basePath: string, body?: string): LandingSection => ({
    id: "contact-banner",
    type: "cta-banner" as const,
    content: {
        title: landingCopy.finalCtaTitle,
        ...(body !== undefined ? { body } : {}),
        cta: { label: landingCopy.contactCtaLabel, href: `${basePath}/contact` },
    },
})

/** A featured listing as a plate: the address over its place, price, and computed status. */
const plateItem = (listing: InventoryListing, now: Date) => ({
    media: imageMedia(listing.image),
    caption: listing.title,
    detail: `${listing.neighborhood} · ${listing.price} · ${listingBadge(listing, now).label}`,
})

function stackHome(
    basePath: string,
    now: Date,
    inventory: InventoryListing[],
    stack: EstateStack,
): LandingSection[] {
    const featured = inventory.filter((listing) => listing.featured === true)
    const sections: (LandingSection | false)[] = [
        {
            id: "hero",
            type: "hero",
            variant: "full-bleed-media",
            content: {
                badge: marketPulseLabel(inventory, now),
                headline: home.headline,
                accent: "none",
                subheadline: home.subheadline,
                primaryCta: { label: landingCopy.home.heroCta, href: `${basePath}/listings` },
                secondaryCta: { label: `Call ${agency.phone}`, href: agency.phoneHref },
                media: imageMedia(home.heroImage),
            },
        },
        featured.length > 0 && {
            id: "featured-listings",
            type: "gallery",
            variant: "sequence",
            content: {
                items: featured.map((listing) => plateItem(listing, now)),
                captionStack: "overlay-start",
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
            id: "agent",
            type: "content-split",
            variant: "media-left",
            content: {
                kicker: landingCopy.aboutPage.kicker,
                headline: about.headline,
                body: about.paragraphs[0],
                media: imageMedia(about.photo),
                ...(stack.agentCta !== ""
                    ? { cta: { label: stack.agentCta, href: `${basePath}/about` } }
                    : {}),
            },
        },
        {
            id: "neighborhoods",
            type: "showcase",
            variant: "collections",
            content: {
                kicker: landingCopy.home.neighborhoodsKicker,
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
            variant: "single-featured",
            content: {
                kicker: landingCopy.home.testimonialsKicker,
                quotes: testimonials.map((entry) => ({
                    quote: entry.quote,
                    author: entry.name,
                    title: entry.detail,
                })),
            },
        },
        {
            id: "contact-banner",
            type: "cta-banner",
            variant: "colophon",
            content: {
                title: stack.closing !== "" ? stack.closing : landingCopy.finalCtaTitle,
                ...(stack.closingBody !== "" ? { body: stack.closingBody } : {}),
                cta: { label: landingCopy.contactCtaLabel, href: `${basePath}/contact` },
            },
        },
    ]
    return sections.filter((section): section is LandingSection => section !== false)
}

export function homeLanding(
    basePath: string,
    now: Date,
    inventory: InventoryListing[] = codeInventory(),
): LandingConfig {
    const stack = homeStack()
    if (stack !== undefined) {
        return {
            style: { preset: PACK_REGISTERS.estate },
            shell: shell(basePath, ""),
            sections: stackHome(basePath, now, inventory, stack),
        }
    }
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
                    primaryCta: { label: landingCopy.home.heroCta, href: `${basePath}/listings` },
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
                    kicker: landingCopy.home.featuredKicker,
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
                    kicker: landingCopy.home.neighborhoodsKicker,
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
                    kicker: landingCopy.home.testimonialsKicker,
                    quotes: testimonials.map((entry) => ({
                        quote: entry.quote,
                        author: entry.name,
                        title: entry.detail,
                    })),
                },
            },
            contactBanner(basePath, landingCopy.home.bannerBody),
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
                    headline: landingCopy.listingsPage.headline,
                    subheadline: landingCopy.listingsPage.subheadline,
                },
            },
            {
                id: "listings",
                type: "showcase",
                // The inventory grid: neighborhood chips derived from the
                // tags, computed status pills on every photograph.
                variant: "filterable-grid",
                content: {
                    kicker: landingCopy.listingsPage.kicker,
                    allLabel: landingCopy.listingsPage.allLabel,
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
            contactBanner(basePath, landingCopy.listingsPage.bannerBody),
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
                    headline: landingCopy.neighborhoodsPage.headline,
                    subheadline: landingCopy.neighborhoodsPage.subheadline,
                },
            },
            {
                id: "neighborhoods",
                type: "highlights",
                variant: "alternating",
                content: {
                    kicker: landingCopy.neighborhoodsPage.kicker,
                    highlights: neighborhoods.map((hood) => ({
                        media: imageMedia(hood.image),
                        headline: hood.name,
                        body: hood.description,
                        cta: {
                            label: landingCopy.neighborhoodsPage.listingsCta,
                            href: `${basePath}/listings`,
                        },
                    })),
                },
            },
            contactBanner(basePath, landingCopy.neighborhoodsPage.bannerBody),
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
                    kicker: landingCopy.aboutPage.kicker,
                    headline: about.headline,
                    body: about.paragraphs.join(" "),
                    bullets: [agency.license, ...landingCopy.aboutPage.bullets],
                    media: imageMedia(about.photo),
                    cta: { label: landingCopy.contactCtaLabel, href: `${basePath}/contact` },
                },
            },
            {
                id: "credentials",
                type: "social-proof",
                variant: "text-logos",
                content: {
                    label: landingCopy.aboutPage.credentialsLabel,
                    items: about.credentials,
                },
            },
            {
                id: "kind-words",
                type: "testimonials",
                variant: "quote-grid",
                content: {
                    kicker: landingCopy.home.testimonialsKicker,
                    title: landingCopy.aboutPage.testimonialsTitle,
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
                    kicker: landingCopy.contactPage.kicker,
                    title: landingCopy.contactPage.title,
                    cta: landingCopy.contactPage.submitLabel,
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
