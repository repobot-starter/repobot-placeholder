import type { LandingConfig, MarketingShellConfig } from "@ui"
import { statusLabel } from "../Landing/hours"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import {
    about,
    business,
    faq,
    home,
    hoursNote,
    landingCopy,
    metrics,
    process,
    projects,
    quote,
    serviceArea,
    services,
    testimonials,
    weeklyHours,
    type Project,
    type SiteImage,
} from "./content"
import { servicesShell } from "./servicesShell"

/**
 * The services pack's pages as landing-kernel configs (docs/landing.md,
 * "Trades / contractor" blueprint). `content.ts` stays the single
 * owner-editable source; these builders only map it into sections.
 *
 * Every builder takes `basePath`: "" when the pack owns the site (links
 * are /projects, /services, /quote, …) and "/services" on the preview
 * route — same pages, both wirings. The home builder also takes `now`:
 * the config is rebuilt per render so the hero's live "Open now" badge
 * stays current (the menu pack's idiom, on the shared hours engine).
 *
 * Every section carries a stable `id`: ServicesPage pipes these configs
 * through the landing document's per-page merge (`useSitePageConfig`), so
 * the platform's structural editor can reorder / delete / add sections on
 * these pages and the ids are what the document's skeleton binds to. The
 * pack's catalog maps the routes (`landing.routes` in catalog.json).
 */

const imageMedia = (image: SiteImage) => ({
    kind: "image" as const,
    src: image.src,
    alt: image.alt,
    width: image.width,
    height: image.height,
    srcSet: image.srcSet,
})

/** A project as a comparison-gallery item: drag the divider, see the work. */
const comparisonItem = (project: Project) => ({
    media: imageMedia(project.after),
    beforeMedia: imageMedia(project.before),
    caption: `${project.title}, ${project.location} — ${project.scope}`,
})

// The shared chrome lives in servicesShell.ts (manifest pages wear it
// too); this alias keeps the page builders reading naturally.
function shell(
    basePath: string,
    currentPath: "" | "/projects" | "/services" | "/about" | "/quote",
): MarketingShellConfig {
    return servicesShell(basePath, currentPath)
}

export function homeLanding(basePath: string, now: Date): LandingConfig {
    const day = now.getDay()
    const minute = now.getHours() * 60 + now.getMinutes()
    return {
        style: { preset: PACK_REGISTERS.services },
        shell: shell(basePath, ""),
        sections: [
            {
                id: "hero",
                type: "hero",
                // The work beside the words, with the two asks a trades site
                // lives on: the quote and the call — must match the
                // catalog's landing seed byte for byte.
                variant: "split-media",
                content: {
                    badge: statusLabel(weeklyHours, day, minute),
                    headline: home.headline,
                    subheadline: home.subheadline,
                    primaryCta: { label: "Get a free quote", href: `${basePath}/quote` },
                    secondaryCta: { label: `Call ${business.phone}`, href: business.phoneHref },
                    media: imageMedia(home.heroImage),
                },
            },
            {
                id: "services",
                type: "card-grid",
                variant: "3up",
                content: {
                    kicker: "What we do",
                    title: landingCopy.servicesHeading,
                    cards: services.map((service) => ({
                        media: imageMedia(service.image),
                        title: service.title,
                        body: service.description,
                    })),
                },
            },
            {
                id: "transformations",
                type: "gallery",
                // The pack's signature: drag the divider across the same
                // room, before and after the crew.
                variant: "before-after",
                content: {
                    kicker: "Before & after",
                    title: "Drag to see the difference",
                    items: home.featuredProjects.map(comparisonItem),
                    // Corner expand on each frame: the pair full screen as
                    // adjacent after/before slides. The drag stays the drag.
                    lightbox: true,
                },
            },
            {
                id: "proof",
                type: "social-proof",
                variant: "metrics-row",
                content: {
                    label: business.license,
                    metrics,
                },
            },
            {
                id: "kind-words",
                type: "testimonials",
                // One voice, the whole room — the strongest quote leads.
                variant: "single-featured",
                content: {
                    kicker: "From our clients",
                    quotes: testimonials.map((entry) => ({
                        quote: entry.quote,
                        author: entry.name,
                        title: entry.detail,
                    })),
                },
            },
            {
                id: "service-area",
                type: "social-proof",
                variant: "text-logos",
                content: {
                    label: "Proudly serving",
                    items: serviceArea,
                },
            },
            {
                id: "quote-banner",
                type: "cta-banner",
                content: {
                    title: "Tell us what you're planning.",
                    body: `Free walkthroughs and written quotes across Central Oregon. ${hoursNote}.`,
                    cta: { label: "Get a free quote", href: `${basePath}/quote` },
                },
            },
        ],
    }
}

export function projectsLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.services },
        shell: shell(basePath, "/projects"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: "The proof is in the after.",
                    subheadline:
                        "Every project below shows the same room from the same angle, before and after the crew. Drag the divider — we didn't stage the befores.",
                },
            },
            {
                id: "transformations",
                type: "gallery",
                variant: "before-after",
                content: {
                    kicker: "Recent projects",
                    items: projects.map(comparisonItem),
                    lightbox: true,
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
                id: "quote-banner",
                type: "cta-banner",
                content: {
                    title: "Your place could be the next after.",
                    cta: { label: "Get a free quote", href: `${basePath}/quote` },
                },
            },
        ],
    }
}

export function servicesPageLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.services },
        shell: shell(basePath, "/services"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: "What we do, and what it costs.",
                    subheadline:
                        "Honest starting prices below — every job gets a written, itemized quote after a free walkthrough, and the quote is the price.",
                },
            },
            {
                id: "services",
                type: "showcase",
                variant: "card-grid",
                content: {
                    kicker: "Services",
                    items: services.map((service) => ({
                        title: service.title,
                        description: service.description,
                        eyebrow: service.eyebrow,
                        meta: service.priceNote,
                        media: imageMedia(service.image),
                        url: `${basePath}/quote`,
                    })),
                },
            },
            {
                id: "faq",
                type: "faq",
                content: {
                    kicker: "Fair questions",
                    title: "What people ask before hiring us",
                    items: faq,
                },
            },
            {
                id: "quote-banner",
                type: "cta-banner",
                content: {
                    title: "Not sure which service fits? Ask.",
                    body: `Call ${business.phone} or send the details — we'll tell you straight if a job isn't worth doing.`,
                    cta: { label: "Get a free quote", href: `${basePath}/quote` },
                },
            },
        ],
    }
}

export function aboutLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.services },
        shell: shell(basePath, "/about"),
        sections: [
            {
                id: "story",
                type: "content-split",
                variant: "media-left",
                content: {
                    kicker: "The company",
                    headline: about.headline,
                    body: about.paragraphs.join(" "),
                    bullets: [
                        business.license,
                        "Fixed written quotes — the quote is the price",
                        "One crew and one project lead, start to finish",
                    ],
                    media: imageMedia(about.photo),
                    cta: { label: "Get a free quote", href: `${basePath}/quote` },
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
                    kicker: "From our clients",
                    title: "The reviews we're proudest of",
                    quotes: testimonials.map((entry) => ({
                        quote: entry.quote,
                        author: entry.name,
                        title: entry.detail,
                    })),
                },
            },
            {
                id: "quote-banner",
                type: "cta-banner",
                content: {
                    title: "Let's walk through it together.",
                    cta: { label: "Get a free quote", href: `${basePath}/quote` },
                },
            },
        ],
    }
}

export function quoteLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.services },
        shell: shell(basePath, "/quote"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: quote.headline,
                    subheadline: quote.body,
                },
            },
            {
                id: "quote-form",
                type: "lead-form",
                variant: "detail-form",
                content: {
                    kicker: "Quote request",
                    title: "The details",
                    cta: "Request a quote",
                    confirmation: quote.confirmation,
                    fields: quote.fields,
                    // Direct channels trail the form. The phone is a tel:
                    // link — click-to-call is how trades customers actually
                    // reach out — while the email stays deliberately plain
                    // text (the photography pack's reasoning: selectable
                    // for whatever mail client the visitor uses). The form
                    // itself delivers through the platform's managed forms
                    // pipeline.
                    channels: [
                        { label: "Phone", value: business.phone, href: business.phoneHref },
                        { label: "Email", value: business.email },
                        {
                            label: "Office",
                            value: business.address,
                            href: `https://maps.google.com/?q=${encodeURIComponent(business.address)}`,
                        },
                        { label: "Hours", value: hoursNote },
                    ],
                },
            },
        ],
    }
}
