import type { LandingConfig, MarketingShellConfig } from "@ui"
import type { ContentLink } from "../Landing/linksDocument"
import { lookCategories } from "../Landing/looksDocument"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import {
    about,
    collaborations,
    contact,
    creator,
    home,
    landingCopy,
    linksPage,
    looksPage,
    metrics,
    platforms,
    testimonials,
    type SiteImage,
} from "./content"
import { codeLinkHub, codeLooks, type CreatorLook } from "./inventory"
import { influencerShell } from "./influencerShell"

/**
 * The influencer pack's pages as landing-kernel configs (docs/landing.md).
 * `content.ts` stays the single owner-editable source; these builders only
 * map it into sections.
 *
 * Every builder takes `basePath`: "" when the pack owns the site (links
 * are /looks, /links, /about, /contact) and "/influencer" on the preview
 * route — same pages, both wirings.
 *
 * Every section carries a stable `id`: InfluencerPage pipes these configs
 * through the landing document's per-page merge (`useSitePageConfig`), so
 * the platform's structural editor can reorder / delete / add sections on
 * these pages and the ids are what the document's skeleton binds to. The
 * pack's catalog maps the routes (`landing.routes` in catalog.json).
 *
 * Contract-bearing builders take the RESOLVED data: the page resolves the
 * business-content contract's links and looks domains over `content.ts`
 * once (`useInfluencerLinks` / `useInfluencerLooks` in InfluencerPage) and
 * the builders render whatever entries they are handed — an owner's
 * Manage edit and the code default walk the same path. They default to
 * the code content, so callers without a resolved document (pinned tests,
 * the preview route) keep the plain basePath signature.
 *
 * - The LINK HUB renders in entry order (ORDER IS THE CONTENT — the
 *   owner's arrangement is the hub), with group chips DERIVED from the
 *   entries' categories.
 * - The LOOKS grid's filter chips are DERIVED from the resolved entries'
 *   categories (`lookCategories`), and the "Shop the looks" strip
 *   flattens every look's product links into one linkable row — both are
 *   data, so an owner minting a category or a product link in Manage
 *   grows the page without a code change.
 */

const imageMedia = (image: SiteImage) => ({
    kind: "image" as const,
    src: image.src,
    alt: image.alt,
    width: image.width,
    height: image.height,
    srcSet: image.srcSet,
})

/** A look as a home-rail cover tile: the outfit leads, the shelf follows. */
const featuredItem = (look: CreatorLook, basePath: string) => ({
    title: look.title,
    description: look.description ?? "",
    eyebrow: look.category,
    ...(look.productLinks !== undefined && look.productLinks.length > 0
        ? { meta: `${look.productLinks.length} pieces linked` }
        : {}),
    media: imageMedia(look.image),
    url: `${basePath}/looks`,
})

/** A look as a grid card: the category tag feeds the filter chips. */
const lookItem = (look: CreatorLook) => ({
    title: look.title,
    description: look.description ?? "",
    eyebrow: look.category,
    ...(look.productLinks !== undefined && look.productLinks.length > 0
        ? { meta: `${look.productLinks.length} pieces linked` }
        : {}),
    tags: [look.category],
    media: imageMedia(look.image),
})

/** A hub link as a grid card: title links out, badge pills, category chips. */
const linkItem = (link: ContentLink) => ({
    title: link.title,
    description: link.description ?? "",
    url: link.url,
    ...(link.badge !== undefined ? { badge: { label: link.badge, tone: "accent" as const } } : {}),
    ...(link.category !== undefined ? { tags: [link.category] } : {}),
})

// The shared chrome lives in influencerShell.ts (manifest pages wear it
// too); this alias keeps the page builders reading naturally.
function shell(
    basePath: string,
    currentPath: "" | "/looks" | "/links" | "/about" | "/contact",
): MarketingShellConfig {
    return influencerShell(basePath, currentPath)
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
    looks: CreatorLook[] = codeLooks(),
    links: ContentLink[] = codeLinkHub(),
): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.influencer },
        shell: shell(basePath, ""),
        sections: [
            {
                id: "hero",
                type: "hero",
                // The creator IS the pitch: masthead type over the signature
                // street photograph — must match the catalog's landing seed
                // byte for byte.
                variant: "masthead-overlay",
                content: {
                    badge: creator.location,
                    headline: home.headline,
                    subheadline: home.subheadline,
                    primaryCta: { label: "See the looks", href: `${basePath}/looks` },
                    secondaryCta: { label: landingCopy.contactCtaLabel, href: `${basePath}/contact` },
                    media: imageMedia(home.heroImage),
                },
            },
            {
                id: "featured-looks",
                type: "showcase",
                // The pack's signature: the browsable rail of recent
                // outfits, carrying the contract's featured flags.
                variant: "media-rail",
                content: {
                    kicker: "The looks",
                    title: landingCopy.featuredHeading,
                    items: looks
                        .filter((look) => look.featured === true)
                        .map((look) => featuredItem(look, basePath)),
                },
            },
            {
                id: "platforms",
                type: "showcase",
                // Where the audience lives: each platform as a linkable
                // tile with its follower count as the trailing meta.
                variant: "collections",
                content: {
                    kicker: "Find me on",
                    title: "Five platforms, one closet",
                    items: platforms.map((platform) => ({
                        title: platform.name,
                        description: platform.handle,
                        meta: platform.followers,
                        url: platform.url,
                    })),
                },
            },
            {
                id: "right-now",
                type: "showcase",
                // The hub teaser: the top of the link hub in entry order —
                // the current drop leads, the full hub is one click away.
                variant: "card-grid",
                content: {
                    kicker: "The link hub",
                    title: landingCopy.linksHeading,
                    items: links.slice(0, 3).map(linkItem),
                },
            },
            {
                id: "proof",
                type: "social-proof",
                variant: "metrics-row",
                content: {
                    label: creator.credentialLine,
                    metrics,
                },
            },
            {
                id: "kind-words",
                type: "testimonials",
                // One brand voice, the whole story — the strongest leads.
                variant: "single-featured",
                content: {
                    kicker: "From the brand teams",
                    quotes: testimonials.map((entry) => ({
                        quote: entry.quote,
                        author: entry.name,
                        title: entry.detail,
                    })),
                },
            },
            contactBanner(
                basePath,
                "Sponsored posts, video, UGC, or an event — the first conversation is a two-line email either way.",
            ),
        ],
    }
}

export function looksLanding(basePath: string, looks: CreatorLook[] = codeLooks()): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.influencer },
        shell: shell(basePath, "/looks"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: looksPage.headline,
                    subheadline: looksPage.subheadline,
                },
            },
            {
                id: "looks",
                type: "showcase",
                // The looks grid: filter chips DERIVED from the resolved
                // entries' categories — the looks domain's taxonomy axis.
                variant: "filterable-grid",
                content: {
                    kicker: "The looks",
                    allLabel: landingCopy.allLooksLabel,
                    items: looks.map(lookItem),
                },
            },
            {
                id: "shop-the-looks",
                type: "showcase",
                // Every product link from the grid above, flattened into
                // one linkable row — the looks domain's productLinks are
                // data, so a piece added in Manage lands here on its own.
                variant: "collections",
                content: {
                    kicker: "Shop",
                    title: looksPage.shopHeading,
                    items: looks.flatMap((look) =>
                        (look.productLinks ?? []).map((piece) => ({
                            title: piece.label,
                            description: `From "${look.title}"`,
                            eyebrow: look.category,
                            url: piece.url,
                        })),
                    ),
                },
            },
            contactBanner(
                basePath,
                `${lookCategories(looks).length} shelves in the closet — and the next campaign could dress one of them.`,
            ),
        ],
    }
}

export function linksLanding(basePath: string, links: ContentLink[] = codeLinkHub()): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.influencer },
        shell: shell(basePath, "/links"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: linksPage.headline,
                    subheadline: linksPage.subheadline,
                },
            },
            {
                id: "link-hub",
                type: "showcase",
                // The hub itself: entry order preserved (ORDER IS THE
                // CONTENT), group chips DERIVED from the entries'
                // categories, badges as accent pills, every title a link.
                variant: "filterable-grid",
                content: {
                    kicker: "The hub",
                    allLabel: landingCopy.allLinksLabel,
                    items: links.map(linkItem),
                },
            },
            contactBanner(
                basePath,
                "Brand teams: the partnership inbox is one click away — rate card on request.",
            ),
        ],
    }
}

export function aboutLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.influencer },
        shell: shell(basePath, "/about"),
        sections: [
            {
                id: "story",
                type: "content-split",
                variant: "media-left",
                content: {
                    kicker: "The creator",
                    headline: about.headline,
                    body: about.paragraphs.join(" "),
                    bullets: [
                        creator.credentialLine,
                        "Every piece linked exactly once, with the price in frame",
                        "Gifted items get the same review money would — a third never run",
                    ],
                    media: imageMedia(about.photo),
                    cta: { label: landingCopy.contactCtaLabel, href: `${basePath}/contact` },
                },
            },
            {
                id: "collaborations",
                type: "social-proof",
                variant: "text-logos",
                content: {
                    label: "Collaborations",
                    items: collaborations,
                },
            },
            {
                id: "kind-words",
                type: "testimonials",
                variant: "quote-grid",
                content: {
                    kicker: "From the brand teams",
                    title: "What a campaign together is like",
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
        style: { preset: PACK_REGISTERS.influencer },
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
                    kicker: "Or write directly",
                    title: "The campaign inquiry",
                    cta: "Send the inquiry",
                    confirmation: contact.confirmation,
                    fields: contact.fields,
                    // The direct channel trails the form. The email stays
                    // deliberately plain text (the photography pack's
                    // reasoning: selectable for whatever mail client the
                    // brand team uses). The form itself delivers through
                    // the platform's managed forms pipeline.
                    channels: [
                        { label: "Email", value: creator.email },
                        { label: "Based in", value: creator.location },
                    ],
                },
            },
        ],
    }
}
