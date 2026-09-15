import type { LandingConfig, MarketingShellConfig } from "@ui"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import { projectCategories } from "../Landing/projectsDocument"
import {
    about,
    contact,
    faq,
    home,
    landingCopy,
    metrics,
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

export function homeLanding(basePath: string, portfolio: StudioProject[] = codePortfolio()): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.interiors },
        shell: shell(basePath, ""),
        sections: [
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
                    primaryCta: { label: "See the work", href: `${basePath}/portfolio` },
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
                    kicker: "The portfolio",
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
                    kicker: "Services",
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
                    kicker: "From the clients",
                    quotes: testimonials.map((entry) => ({
                        quote: entry.quote,
                        author: entry.name,
                        title: entry.detail,
                    })),
                },
            },
            contactBanner(
                basePath,
                "A whole home, one hard-working kitchen, or a styling week — the first conversation is free either way.",
            ),
        ],
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
                    headline: "The work, room by room.",
                    subheadline:
                        "Whole homes, kitchens and baths, commercial rooms, and styling weeks — filter by the kind of project you're planning.",
                },
            },
            {
                id: "portfolio",
                type: "showcase",
                // The portfolio grid: filter chips DERIVED from the resolved
                // entries' categories — the projects domain's taxonomy axis.
                variant: "filterable-grid",
                content: {
                    kicker: "The portfolio",
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
                    headline: "Three ways to work together.",
                    subheadline:
                        "Full-service design for the whole arc, kitchen and bath design for the rooms that repay it most, and furnishing weeks for houses that are finished but don't feel it — with honest numbers up front.",
                },
            },
            {
                id: "offerings",
                type: "highlights",
                // Each engagement as a photographed spread: the room it
                // produced, what it includes, and its honest number.
                variant: "alternating",
                content: {
                    kicker: "Services",
                    highlights: services.map((service) => ({
                        media: imageMedia(service.image),
                        headline: `${service.title} — ${service.investment.toLowerCase()}`,
                        body: service.description,
                        cta: { label: landingCopy.contactCtaLabel, href: `${basePath}/contact` },
                    })),
                },
            },
            {
                id: "process",
                type: "steps",
                variant: "timeline",
                content: {
                    kicker: process.kicker,
                    title: process.title,
                    steps: process.steps,
                },
            },
            {
                id: "faq",
                type: "faq",
                variant: "accordion",
                content: {
                    kicker: "Fair questions",
                    title: "Asked before every project",
                    items: faq,
                },
            },
            contactBanner(basePath, "Book a free discovery call — twenty minutes, real numbers, no pitch."),
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
                    kicker: "The studio",
                    headline: about.headline,
                    body: about.paragraphs.join(" "),
                    bullets: [
                        studio.credentialLine,
                        "Elin leads every project — three or four at a time, on purpose",
                        "Fourteen years, one standard: rooms that survive the family in them",
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
                    kicker: "From the clients",
                    title: "What working together is like",
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
                    subheadline: contact.body,
                },
            },
            {
                id: "contact-form",
                type: "lead-form",
                variant: "detail-form",
                content: {
                    kicker: "Or write first",
                    title: "The project inquiry",
                    cta: "Send the inquiry",
                    confirmation: contact.confirmation,
                    fields: contact.fields,
                    // Direct channels trail the form. The phone is a tel:
                    // link — a timeline question is a phone call — while
                    // the email stays deliberately plain text (the
                    // photography pack's reasoning: selectable for whatever
                    // mail client the visitor uses). The form itself
                    // delivers through the platform's managed forms
                    // pipeline.
                    channels: [
                        { label: "Phone", value: studio.phone, href: studio.phoneHref },
                        { label: "Email", value: studio.email },
                        {
                            label: "Studio",
                            value: studio.address,
                            href: `https://maps.google.com/?q=${encodeURIComponent(studio.address)}`,
                        },
                    ],
                },
            },
        ],
    }
}
