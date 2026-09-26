import type { LandingConfig, MarketingShellConfig } from "@ui"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import { projectCategories } from "../Landing/projectsDocument"
import {
    about,
    caseStudies,
    contact,
    faq,
    fees,
    home,
    landingCopy,
    metrics,
    pieces,
    process,
    services,
    studio,
    testimonials,
    type SiteImage,
} from "./content"
import { codePortfolio, type StudioProject } from "./inventory"
import { interiorsShell } from "./interiorsShell"

/**
 * The interiors pack's pages as landing-kernel configs (docs/landing.md).
 * `content.ts` stays the single owner-editable source; these builders only
 * map it into sections.
 *
 * Every builder takes `basePath`: "" when the pack owns the site (links
 * are /portfolio, /offerings, /about, /contact) and "/interiors" on the
 * preview route — same pages, both wirings.
 *
 * Every section carries a stable `id`: InteriorsPage pipes these configs
 * through the landing document's per-page merge (`useSitePageConfig`), so
 * the platform's structural editor can reorder / delete / add sections on
 * these pages and the ids are what the document's skeleton binds to. The
 * pack's catalog maps the routes (`landing.routes` in catalog.json).
 *
 * Portfolio-bearing builders take the RESOLVED portfolio: the page
 * resolves the business-content contract's projects domain over
 * `content.ts` once (`useInteriorsPortfolio` in InteriorsPage) and the
 * builders render whatever cards they are handed — an owner's Manage edit
 * and the code default walk the same path. They default to the code
 * portfolio, so callers without a resolved document (pinned tests, the
 * preview route) keep the plain basePath signature. The portfolio grid's
 * filter chips are DERIVED from the resolved entries' categories
 * (`projectCategories`) — the taxonomy is data, and an owner minting a
 * new category in Manage grows the chips without a code change.
 *
 * The home composition is content too (`home.layout`, see content.ts):
 * `gallery` is the photo-led stack, `catalog` the numbered catalog run.
 * A seed that sets `home.monograph` (read structurally, so every seed
 * keeps compiling) gets the monograph instead: the built work as plates.
 * Content-only sections (the fee board on /offerings) render when their
 * content has entries, so a seed that leaves them empty keeps its pages.
 */

const imageMedia = (image: SiteImage) => ({
    kind: "image" as const,
    src: image.src,
    alt: image.alt,
    width: image.width,
    height: image.height,
    srcSet: image.srcSet,
})

/** A project as a home-rail cover tile: the room leads, the facts follow. */
const featuredItem = (project: StudioProject, basePath: string) => ({
    title: project.title,
    description: project.description,
    eyebrow: [project.location, project.year].filter((part) => part !== undefined).join(" · "),
    ...(project.scope !== undefined ? { meta: project.scope } : {}),
    media: imageMedia(project.image),
    url: `${basePath}/portfolio`,
})

/** A project as a grid card: the category tag feeds the filter chips. */
const portfolioItem = (project: StudioProject) => ({
    title: project.title,
    description: project.description,
    eyebrow: [project.location, project.year].filter((part) => part !== undefined).join(" · "),
    ...(project.scope !== undefined ? { meta: project.scope } : {}),
    tags: [project.category],
    media: imageMedia(project.image),
})

// The shared chrome lives in interiorsShell.ts (manifest pages wear it
// too); this alias keeps the page builders reading naturally.
function shell(
    basePath: string,
    currentPath: "" | "/portfolio" | "/offerings" | "/about" | "/contact",
): MarketingShellConfig {
    return interiorsShell(basePath, currentPath)
}

/**
 * The monograph home's own content (`home.monograph`): the hero
 * photograph's caption, the one project told as a feature with its own
 * photographs and drawing, the index's heading, and the closing line
 * (`portfolioClosing`, when set, closes the portfolio page too).
 */
export interface InteriorsMonograph {
    heroCaption: string
    feature: {
        kicker: string
        headline: string
        /** Paragraphs split on blank lines; the last reads as the coda. */
        body: string
        pullQuote?: string
        spread: SiteImage
        figures: { image: SiteImage; title?: string; caption?: string }[]
        plate?: { image: SiteImage; caption?: string }
    }
    indexKicker: string
    indexTitle: string
    closing: string
    closingCta: string
    portfolioClosing?: string
}

function homeMonograph(): InteriorsMonograph | undefined {
    return "monograph" in home ? (home.monograph as InteriorsMonograph | undefined) : undefined
}

/** A featured project as a plate: the title, then where, when, and what. */
const plateItem = (project: StudioProject) => ({
    media: imageMedia(project.image),
    caption: project.title,
    detail: [project.location, project.year, project.scope ?? project.category]
        .filter((part) => part !== undefined)
        .join(" · "),
})

/** A project as a row of the index of works. */
const indexItem = (project: StudioProject, basePath: string) => ({
    title: project.title,
    description: project.scope ?? project.category,
    ...(project.location !== undefined ? { eyebrow: project.location } : {}),
    ...(project.year !== undefined ? { meta: String(project.year) } : {}),
    url: `${basePath}/portfolio`,
})

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

const quotes = () =>
    testimonials.map((entry) => ({
        quote: entry.quote,
        author: entry.name,
        title: entry.detail,
    }))

/** The direct channels: a tel: link, the email plain, the studio on a map. */
const channels = () => [
    { label: "Phone", value: studio.phone, href: studio.phoneHref },
    { label: "Email", value: studio.email },
    {
        label: "Studio",
        value: studio.address,
        href: `https://maps.google.com/?q=${encodeURIComponent(studio.address)}`,
    },
]

/** The process timeline — /offerings, and the catalog home. */
const processSection = () => ({
    id: "process",
    type: "steps" as const,
    variant: "timeline" as const,
    content: {
        kicker: process.kicker,
        title: process.title,
        steps: process.steps,
    },
})

const faqSection = () => ({
    id: "faq",
    type: "faq" as const,
    variant: "accordion" as const,
    content: {
        kicker: landingCopy.faqHeading.kicker,
        title: landingCopy.faqHeading.title,
        items: faq,
    },
})

/** The fee board: flat design fees and hourly sourcing as a price list. */
const feesSection = () => ({
    id: "fees",
    type: "pricing" as const,
    variant: "price-list" as const,
    content: {
        kicker: fees.kicker,
        title: fees.title,
        period: "",
        intro: fees.intro,
        groups: fees.groups,
        footnote: fees.footnote,
    },
})

/**
 * The `gallery` home: the masthead hero over the studio's signature room,
 * the featured-work rail, the service tiles, the numbers, one voice, and
 * the closing banner.
 */
function galleryHome(basePath: string, portfolio: StudioProject[]): LandingConfig["sections"] {
    return [
        {
            id: "hero",
            type: "hero",
            // The room IS the pitch: masthead type over the studio's
            // signature photograph — must match the catalog's landing
            // seed byte for byte.
            variant: "masthead-overlay",
            content: {
                badge: studio.location,
                headline: home.headline,
                subheadline: home.subheadline,
                primaryCta: { label: landingCopy.heroCtaLabel, href: `${basePath}/portfolio` },
                secondaryCta: { label: landingCopy.contactCtaLabel, href: `${basePath}/contact` },
                media: imageMedia(home.heroImage),
            },
        },
        {
            id: "featured-work",
            type: "showcase",
            // The pack's signature: the browsable rail of finished
            // rooms, carrying the contract's featured flags.
            variant: "media-rail",
            content: {
                kicker: landingCopy.kickers.featured,
                title: landingCopy.featuredHeading,
                items: portfolio
                    .filter((project) => project.featured === true)
                    .map((project) => featuredItem(project, basePath)),
            },
        },
        {
            id: "services",
            type: "showcase",
            // The album-index tiles: each way of working as a cover
            // photograph with its one-line pitch and honest number.
            variant: "collections",
            content: {
                kicker: landingCopy.kickers.services,
                title: landingCopy.servicesHeading,
                items: services.map((service) => ({
                    title: service.title,
                    description: service.investment,
                    media: imageMedia(service.image),
                    url: `${basePath}/offerings`,
                })),
            },
        },
        {
            id: "proof",
            type: "social-proof",
            variant: "metrics-row",
            content: {
                label: studio.credentialLine,
                metrics,
            },
        },
        {
            id: "kind-words",
            type: "testimonials",
            // One voice, the whole room — the strongest story leads.
            variant: "single-featured",
            content: {
                kicker: landingCopy.kickers.testimonials,
                quotes: quotes(),
            },
        },
        contactBanner(basePath, landingCopy.homeBannerBody),
    ]
}

/**
 * The `catalog` home: the split cover (the headline beside the room, its
 * full stop the accent), the services as a numbered strip, the featured
 * houses as before-and-after case files with their case notes, the
 * catalog of pieces, the process, the fee board, one voice, the fair
 * questions, and the consultation form as the close.
 */
function catalogHome(basePath: string, portfolio: StudioProject[]): LandingConfig["sections"] {
    const featured = portfolio.filter((project) => project.featured === true)
    const befores = new Map(caseStudies.befores.map((entry) => [entry.slug, entry.image]))
    return [
        {
            id: "hero",
            type: "hero",
            variant: "split-media",
            content: {
                accent: landingCopy.heroAccent,
                headline: home.headline,
                subheadline: home.subheadline,
                primaryCta: { label: landingCopy.heroCtaLabel, href: `${basePath}/portfolio` },
                secondaryCta: { label: landingCopy.contactCtaLabel, href: `${basePath}/contact` },
                media: imageMedia(home.heroImage),
            },
        },
        {
            id: "services",
            type: "card-grid",
            // The catalog strip: each way of working as a numbered entry
            // with its one-line promise.
            variant: "3up",
            content: {
                cards: services.map((service) => ({
                    title: service.title,
                    body: service.tagline ?? service.investment,
                    cta: { label: service.investment, href: `${basePath}/offerings` },
                })),
            },
        },
        {
            id: "case-files",
            type: "gallery",
            // The featured houses as transformation pairs: the same frame
            // before and after, joined by slug.
            variant: "before-after",
            content: {
                kicker: caseStudies.kicker,
                title: caseStudies.title,
                items: featured.flatMap((project) => {
                    const before = befores.get(project.slug)
                    return before === undefined
                        ? []
                        : [
                              {
                                  media: imageMedia(project.image),
                                  beforeMedia: imageMedia(before),
                                  caption: `${project.title} — ${project.scope ?? project.category}`,
                              },
                          ]
                }),
            },
        },
        {
            id: "featured-work",
            type: "showcase",
            // The case notes under the pairs: the featured flags pick the
            // houses; the photographs are already above.
            variant: "card-grid",
            content: {
                kicker: landingCopy.kickers.featured,
                title: landingCopy.featuredHeading,
                items: featured.map((project) => {
                    const { media: _media, ...item } = featuredItem(project, basePath)
                    return item
                }),
            },
        },
        {
            id: "pieces",
            type: "showcase",
            // The catalog of pieces: numbered plates, materials and price.
            variant: "specimens",
            content: {
                kicker: pieces.kicker,
                title: pieces.title,
                items: pieces.items.map((piece) => ({
                    eyebrow: piece.number,
                    title: piece.name,
                    meta: piece.meta,
                    description: piece.description,
                    media: imageMedia(piece.image),
                })),
            },
        },
        processSection(),
        feesSection(),
        {
            id: "kind-words",
            type: "testimonials",
            variant: "single-featured",
            content: {
                kicker: landingCopy.kickers.testimonials,
                quotes: quotes(),
            },
        },
        faqSection(),
        {
            id: "consultation",
            type: "lead-form",
            variant: "detail-form",
            content: {
                kicker: contact.consultation.kicker,
                title: contact.consultation.title,
                body: contact.consultation.body,
                cta: contact.consultation.cta,
                confirmation: contact.confirmation,
                fields: contact.fields,
                channels: channels(),
            },
        },
    ]
}

/**
 * The `monograph` home: the hero photograph as the first plate with the
 * practice's line and its caption, the featured work as numbered plates
 * at one size, one project told as a feature, the index of every work,
 * one voice, the credentials, and the closing line.
 */
function monographHome(
    basePath: string,
    portfolio: StudioProject[],
    monograph: InteriorsMonograph,
): LandingConfig["sections"] {
    const { feature } = monograph
    return [
        {
            id: "hero",
            type: "hero",
            variant: "full-bleed-media",
            content: {
                badge: studio.location,
                headline: home.headline,
                accent: landingCopy.heroAccent,
                subheadline: home.subheadline,
                mediaCaption: monograph.heroCaption,
                primaryCta: { label: landingCopy.heroCtaLabel, href: `${basePath}/portfolio` },
                secondaryCta: { label: landingCopy.contactCtaLabel, href: `${basePath}/contact` },
                media: imageMedia(home.heroImage),
            },
        },
        {
            id: "plates",
            type: "gallery",
            variant: "sequence",
            content: {
                captionStack: "band-start",
                items: portfolio.filter((project) => project.featured === true).map(plateItem),
            },
        },
        {
            id: "feature",
            type: "content-split",
            variant: "feature",
            content: {
                kicker: feature.kicker,
                headline: feature.headline,
                body: feature.body,
                media: imageMedia(feature.spread),
                ...(feature.pullQuote !== undefined ? { pullQuote: feature.pullQuote } : {}),
                figures: feature.figures.map((figure) => ({
                    media: imageMedia(figure.image),
                    ...(figure.title !== undefined ? { title: figure.title } : {}),
                    ...(figure.caption !== undefined ? { caption: figure.caption } : {}),
                })),
                ...(feature.plate !== undefined
                    ? {
                          plate: {
                              media: imageMedia(feature.plate.image),
                              ...(feature.plate.caption !== undefined
                                  ? { caption: feature.plate.caption }
                                  : {}),
                          },
                      }
                    : {}),
            },
        },
        {
            id: "featured-work",
            type: "showcase",
            // The index of works: every project, one ruled row each.
            variant: "card-grid",
            content: {
                kicker: monograph.indexKicker,
                title: monograph.indexTitle,
                items: portfolio.map((project) => indexItem(project, basePath)),
            },
        },
        {
            id: "kind-words",
            type: "testimonials",
            variant: "single-featured",
            content: {
                kicker: landingCopy.kickers.testimonials,
                quotes: quotes(),
            },
        },
        {
            id: "credentials",
            type: "social-proof",
            variant: "text-logos",
            content: {
                label: landingCopy.kickers.credentials,
                items: about.credentials,
            },
        },
        {
            id: "contact-banner",
            type: "cta-banner",
            variant: "colophon",
            content: {
                title: monograph.closing,
                cta: { label: monograph.closingCta, href: `${basePath}/contact` },
            },
        },
    ]
}

export function homeLanding(basePath: string, portfolio: StudioProject[] = codePortfolio()): LandingConfig {
    const monograph = homeMonograph()
    return {
        style: { preset: PACK_REGISTERS.interiors },
        shell: shell(basePath, ""),
        sections:
            monograph !== undefined
                ? monographHome(basePath, portfolio, monograph)
                : home.layout === "catalog"
                  ? catalogHome(basePath, portfolio)
                  : galleryHome(basePath, portfolio),
    }
}

export function portfolioLanding(
    basePath: string,
    portfolio: StudioProject[] = codePortfolio(),
): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.interiors },
        shell: shell(basePath, "/portfolio"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: landingCopy.portfolioHero.headline,
                    accent: landingCopy.heroAccent,
                    subheadline: landingCopy.portfolioHero.subheadline,
                },
            },
            {
                id: "portfolio",
                type: "showcase",
                // The portfolio grid: filter chips DERIVED from the resolved
                // entries' categories — the projects domain's taxonomy axis.
                variant: "filterable-grid",
                content: {
                    kicker: landingCopy.kickers.portfolio,
                    allLabel: landingCopy.allWorkLabel,
                    items: portfolio.map(portfolioItem),
                },
            },
            {
                id: "track-record",
                type: "social-proof",
                variant: "metrics-row",
                content: {
                    label: studio.credentialLine,
                    metrics,
                },
            },
            contactBanner(
                basePath,
                homeMonograph()?.portfolioClosing ??
                    `${projectCategories(portfolio).length} kinds of work in the portfolio — and the next one could be your ${
                        portfolio.length > 0 ? "rooms" : "project"
                    }.`,
            ),
        ],
    }
}

export function servicesLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.interiors },
        shell: shell(basePath, "/offerings"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: landingCopy.offeringsHero.headline,
                    accent: landingCopy.heroAccent,
                    subheadline: landingCopy.offeringsHero.subheadline,
                },
            },
            {
                id: "offerings",
                type: "highlights",
                // Each engagement as a photographed spread: the room it
                // produced, what it includes, and its honest number.
                variant: "alternating",
                content: {
                    kicker: landingCopy.kickers.offerings,
                    highlights: services.map((service) => ({
                        media: imageMedia(service.image),
                        headline: `${service.title} — ${service.investment.toLowerCase()}`,
                        body: service.description,
                        cta: { label: landingCopy.contactCtaLabel, href: `${basePath}/contact` },
                    })),
                },
            },
            ...(fees.groups.length > 0 ? [feesSection()] : []),
            processSection(),
            faqSection(),
            contactBanner(basePath, landingCopy.offeringsBannerBody),
        ],
    }
}

export function aboutLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.interiors },
        shell: shell(basePath, "/about"),
        sections: [
            {
                id: "story",
                type: "content-split",
                variant: "media-left",
                content: {
                    kicker: landingCopy.kickers.about,
                    headline: about.headline,
                    body: about.paragraphs.join(" "),
                    bullets: about.bullets,
                    media: imageMedia(about.photo),
                    cta: { label: landingCopy.contactCtaLabel, href: `${basePath}/contact` },
                },
            },
            {
                id: "credentials",
                type: "social-proof",
                variant: "text-logos",
                content: {
                    label: landingCopy.kickers.credentials,
                    items: about.credentials,
                },
            },
            {
                id: "kind-words",
                type: "testimonials",
                variant: "quote-grid",
                content: {
                    kicker: landingCopy.kickers.testimonials,
                    title: landingCopy.testimonialsTitle,
                    quotes: quotes(),
                },
            },
            contactBanner(basePath),
        ],
    }
}

export function contactLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.interiors },
        shell: shell(basePath, "/contact"),
        sections: [
            {
                id: "hero",
                // The booking widget mounts as this section's trailer
                // (InteriorsPage): discovery calls and consultations as
                // real capacity-1 slots from the appointments contract.
                type: "hero",
                variant: "statement",
                content: {
                    headline: contact.headline,
                    accent: landingCopy.heroAccent,
                    subheadline: contact.body,
                },
            },
            {
                id: "contact-form",
                type: "lead-form",
                variant: "detail-form",
                content: {
                    kicker: landingCopy.inquiry.kicker,
                    title: landingCopy.inquiry.title,
                    cta: landingCopy.inquiry.cta,
                    confirmation: contact.confirmation,
                    fields: contact.fields,
                    // Direct channels trail the form. The phone is a tel:
                    // link — a timeline question is a phone call — while
                    // the email stays deliberately plain text (the
                    // photography pack's reasoning: selectable for whatever
                    // mail client the visitor uses). The form itself
                    // delivers through the platform's managed forms
                    // pipeline.
                    channels: channels(),
                },
            },
        ],
    }
}
