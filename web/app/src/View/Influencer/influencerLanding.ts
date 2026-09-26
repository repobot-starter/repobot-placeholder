import type { LandingConfig, LandingSection, MarketingAccentPlacement, MarketingShellConfig } from "@ui"
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
 *
 * A seed that sets `home.edition` (see `InfluencerEdition`) gets its own
 * home: the hero's frame, a photo story after it, and its own section
 * variants and page copy. Unset, every page is the base's.
 */

/** One photograph of the home's story and the line under or inside it. */
export interface InfluencerStoryFrame {
    image: SiteImage
    caption: string
    /** `contact-sheet` only: the grease-pencil mark — `circle` a keeper, `cross` a reject. */
    mark?: "circle" | "cross"
    /** `contact-sheet` only: the handwritten note under the frame. */
    note?: string
}

/**
 * The home's photo story, right after the hero. `sequence` is the diary:
 * every frame edge to edge at the hero's size with its caption written
 * into the foot of the photograph (`captionStack` `overlay-start`), so
 * shoot every frame at the hero's shape. `contact-sheet` is the roll: the
 * frames as a 35mm contact sheet with the film stock on the edge.
 */
export interface InfluencerStory {
    variant: "sequence" | "contact-sheet"
    kicker: string
    title: string
    frames: InfluencerStoryFrame[]
    /** `contact-sheet` only: the stock printed along the film edge ("" keeps the kernel's). */
    edgeCode: string
    /** `contact-sheet` only: the first frame's number on the roll. */
    firstFrame: number
}

/** The strings the base pages hard-set that a seed's creator retrades ("" or [] keeps the base's). */
export interface InfluencerEditionCopy {
    looksCta: string
    featuredKicker: string
    platformsKicker: string
    platformsTitle: string
    hubKicker: string
    kindWordsKicker: string
    kindWordsTitle: string
    homeBannerBody: string
    looksBannerBody: string
    linksBannerBody: string
    aboutKicker: string
    aboutBullets: string[]
}

/**
 * A seed's own home edition: the hero's frame (`full-bleed-media` opens a
 * framestack register's stack; `masthead-overlay` is the base's cover),
 * its accent placement and a `credit` line ("" for none), the story after
 * it (null for none), how the featured looks show (`media-rail` covers or
 * numbered `specimens` plates), how the brand voices read, and the closing
 * banner every page ends on (`card` is the base's).
 */
export interface InfluencerEdition {
    hero: "masthead-overlay" | "full-bleed-media"
    accent: MarketingAccentPlacement
    credit: string
    story: InfluencerStory | null
    looks: "media-rail" | "specimens"
    kindWords: "single-featured" | "quote-grid"
    banner: "card" | "colophon" | "full-bleed"
    copy: InfluencerEditionCopy
}

/** The seed's edition, when it sets one. Seeds infer `home`, so it's read structurally. */
function homeEdition(): InfluencerEdition | undefined {
    return "edition" in home ? (home.edition as InfluencerEdition | undefined) : undefined
}

/** The edition's string when it sets one, the base page's otherwise. */
function editionCopy(key: Exclude<keyof InfluencerEditionCopy, "aboutBullets">, base: string): string {
    const value = homeEdition()?.copy[key]
    return value !== undefined && value !== "" ? value : base
}

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

/** The closing ask every page ends on; an edition picks its band. */
const contactBanner = (basePath: string, body?: string) => {
    const banner = homeEdition()?.banner ?? "card"
    return {
        id: "contact-banner",
        type: "cta-banner" as const,
        ...(banner !== "card" ? { variant: banner } : {}),
        content: {
            title: landingCopy.finalCtaTitle,
            ...(body !== undefined ? { body } : {}),
            cta: { label: landingCopy.contactCtaLabel, href: `${basePath}/contact` },
        },
    }
}

/** A featured look as a numbered plate: the index, the outfit, its shelf after a slash. */
const specimenItem = (look: CreatorLook, index: number, basePath: string) => ({
    title: look.title,
    description: look.description ?? "",
    eyebrow: String(index + 1).padStart(2, "0"),
    meta: look.category,
    media: imageMedia(look.image),
    url: `${basePath}/looks`,
})

function storySection(story: InfluencerStory): LandingSection {
    const items = story.frames.map((frame) => ({
        media: imageMedia(frame.image),
        ...(frame.caption !== "" ? { caption: frame.caption } : {}),
        ...(story.variant === "contact-sheet" && frame.mark !== undefined ? { mark: frame.mark } : {}),
        ...(story.variant === "contact-sheet" && frame.note !== undefined ? { note: frame.note } : {}),
    }))
    const heading = {
        ...(story.kicker !== "" ? { kicker: story.kicker } : {}),
        ...(story.title !== "" ? { title: story.title } : {}),
    }
    if (story.variant === "sequence") {
        return {
            id: "story",
            type: "gallery",
            variant: "sequence",
            content: { ...heading, items, captionStack: "overlay-start" },
        }
    }
    return {
        id: "story",
        type: "gallery",
        variant: "contact-sheet",
        content: {
            ...heading,
            items,
            ...(story.edgeCode !== "" ? { edgeCode: story.edgeCode } : {}),
            firstFrame: story.firstFrame,
            lightbox: true,
        },
    }
}

export function homeLanding(
    basePath: string,
    looks: CreatorLook[] = codeLooks(),
    links: ContentLink[] = codeLinkHub(),
): LandingConfig {
    const edition = homeEdition()
    const featured = looks.filter((look) => look.featured === true)
    const sections: LandingSection[] = [
        {
            id: "hero",
            type: "hero",
            // The creator IS the pitch: masthead type over the signature
            // street photograph — must match the catalog's landing seed
            // byte for byte.
            variant: edition?.hero ?? "masthead-overlay",
            content: {
                badge: creator.location,
                headline: home.headline,
                ...(edition !== undefined ? { accent: edition.accent } : {}),
                ...(edition !== undefined && edition.credit !== "" ? { credit: edition.credit } : {}),
                subheadline: home.subheadline,
                primaryCta: { label: editionCopy("looksCta", "See the looks"), href: `${basePath}/looks` },
                secondaryCta: { label: landingCopy.contactCtaLabel, href: `${basePath}/contact` },
                media: imageMedia(home.heroImage),
            },
        },
        ...(edition?.story != null && edition.story.frames.length > 0 ? [storySection(edition.story)] : []),
        edition?.looks === "specimens"
            ? {
                  id: "featured-looks",
                  type: "showcase",
                  // The featured looks as numbered plates.
                  variant: "specimens",
                  content: {
                      kicker: editionCopy("featuredKicker", "The looks"),
                      title: landingCopy.featuredHeading,
                      items: featured.map((look, index) => specimenItem(look, index, basePath)),
                  },
              }
            : {
                  id: "featured-looks",
                  type: "showcase",
                  // The pack's signature: the browsable rail of recent
                  // outfits, carrying the contract's featured flags.
                  variant: "media-rail",
                  content: {
                      kicker: editionCopy("featuredKicker", "The looks"),
                      title: landingCopy.featuredHeading,
                      items: featured.map((look) => featuredItem(look, basePath)),
                  },
              },
        {
            id: "platforms",
            type: "showcase",
            // Where the audience lives: each platform as a linkable
            // tile with its follower count as the trailing meta.
            variant: "collections",
            content: {
                kicker: editionCopy("platformsKicker", "Find me on"),
                title: editionCopy("platformsTitle", "Five platforms, one closet"),
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
                kicker: editionCopy("hubKicker", "The link hub"),
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
            variant: edition?.kindWords ?? "single-featured",
            content: {
                kicker: editionCopy("kindWordsKicker", "From the brand teams"),
                ...(edition?.kindWords === "quote-grid"
                    ? { title: editionCopy("kindWordsTitle", "What a campaign together is like") }
                    : {}),
                quotes: testimonials.map((entry) => ({
                    quote: entry.quote,
                    author: entry.name,
                    title: entry.detail,
                })),
            },
        },
        contactBanner(
            basePath,
            editionCopy(
                "homeBannerBody",
                "Sponsored posts, video, UGC, or an event — the first conversation is a two-line email either way.",
            ),
        ),
    ]
    return {
        style: { preset: PACK_REGISTERS.influencer },
        shell: shell(basePath, ""),
        sections,
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
                    kicker: editionCopy("featuredKicker", "The looks"),
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
                editionCopy(
                    "looksBannerBody",
                    `${lookCategories(looks).length} shelves in the closet — and the next campaign could dress one of them.`,
                ),
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
                editionCopy(
                    "linksBannerBody",
                    "Brand teams: the partnership inbox is one click away — rate card on request.",
                ),
            ),
        ],
    }
}

export function aboutLanding(basePath: string): LandingConfig {
    const bullets = homeEdition()?.copy.aboutBullets ?? []
    return {
        style: { preset: PACK_REGISTERS.influencer },
        shell: shell(basePath, "/about"),
        sections: [
            {
                id: "story",
                type: "content-split",
                variant: "media-left",
                content: {
                    kicker: editionCopy("aboutKicker", "The creator"),
                    headline: about.headline,
                    body: about.paragraphs.join(" "),
                    bullets: [
                        creator.credentialLine,
                        ...(bullets.length > 0
                            ? bullets
                            : [
                                  "Every piece linked exactly once, with the price in frame",
                                  "Gifted items get the same review money would — a third never run",
                              ]),
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
                    kicker: editionCopy("kindWordsKicker", "From the brand teams"),
                    title: editionCopy("kindWordsTitle", "What a campaign together is like"),
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
