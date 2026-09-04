import type { LandingConfig, MarketingShellConfig } from "@ui"
import { statusLabel } from "../Landing/hours"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import {
    about,
    book,
    business,
    faq,
    gallery,
    home,
    hoursNote,
    included,
    landingCopy,
    metrics,
    planComparison,
    plans,
    serviceArea,
    testimonials,
    weeklyHours,
    type Plan,
    type SiteImage,
} from "./content"
import { servicesRecurringShell } from "./servicesRecurringShell"

/**
 * The recurring-services pack's pages as landing-kernel configs — the
 * `services` category's recurring/booking shape (docs/landing.md).
 * `content.ts` stays the single owner-editable source; these builders
 * only map it into sections.
 *
 * The shape's convictions, in section order: plans and their prices sit
 * ON THE HOME PAGE (a subscription sells its rhythm up front, not behind
 * a link), the plans page compares what's included line by line, and the
 * booking form asks for a frequency, not a project.
 *
 * Every builder takes `basePath`: "" when the pack owns the site (links
 * are /plans, /about, /book) and "/cleaning" on the preview route — same
 * pages, both wirings. The home builder also takes `now`: the config is
 * rebuilt per render so the hero's live "Open now" badge stays current
 * (the shared hours engine, View/Landing/hours.ts).
 *
 * Every section carries a stable `id`: ServicesRecurringPage pipes these
 * configs through the landing document's per-page merge
 * (`useSitePageConfig`), so the platform's structural editor can reorder /
 * delete / add sections on these pages. The pack's catalog maps the
 * routes (`landing.routes` in catalog.json).
 */

const imageMedia = (image: SiteImage) => ({
    kind: "image" as const,
    src: image.src,
    alt: image.alt,
    width: image.width,
    height: image.height,
    srcSet: image.srcSet,
})

/** A plan as a pricing tier: per-visit prices, no monthly/yearly toggle. */
const planTier = (plan: Plan) => ({
    name: plan.name,
    monthly: plan.perVisit,
    yearlyPerMonth: plan.perVisit,
    description: plan.description,
    features: plan.features,
    ...(plan.highlighted !== undefined ? { highlighted: plan.highlighted } : {}),
    ...(plan.badge !== undefined ? { badge: plan.badge } : {}),
})

// The shared chrome lives in servicesRecurringShell.ts (manifest pages
// wear it too); this alias keeps the page builders reading naturally.
function shell(basePath: string, currentPath: "" | "/plans" | "/about" | "/book"): MarketingShellConfig {
    return servicesRecurringShell(basePath, currentPath)
}

export function homeLanding(basePath: string, now: Date): LandingConfig {
    const day = now.getDay()
    const minute = now.getHours() * 60 + now.getMinutes()
    return {
        style: { preset: PACK_REGISTERS["services-recurring"] },
        shell: shell(basePath, ""),
        sections: [
            {
                id: "hero",
                type: "hero",
                // The home beside the promise, with the live office badge —
                // must match the catalog's landing seed byte for byte.
                variant: "split-media",
                content: {
                    badge: statusLabel(weeklyHours, day, minute),
                    headline: home.headline,
                    subheadline: home.subheadline,
                    primaryCta: { label: landingCopy.bookCtaLabel, href: `${basePath}/book` },
                    secondaryCta: { label: `Call ${business.phone}`, href: business.phoneHref },
                    media: imageMedia(home.heroImage),
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
                id: "included",
                type: "feature-grid",
                variant: "icon-list",
                content: {
                    kicker: "Every visit",
                    title: "The checklist that never gets skipped",
                    features: included,
                },
            },
            {
                id: "plans",
                type: "pricing",
                // The shape's signature: the rhythm and its price on the
                // home page — a subscription sells up front.
                variant: "tiers",
                content: {
                    kicker: "Plans",
                    title: "Pick a rhythm",
                    period: "/visit",
                    tiers: plans.map(planTier),
                },
            },
            {
                id: "standard",
                type: "gallery",
                variant: "uniform",
                content: {
                    kicker: "The standard",
                    title: "What done looks like",
                    items: gallery.map((entry) => ({
                        media: imageMedia(entry.image),
                        caption: entry.caption,
                    })),
                    lightbox: true,
                },
            },
            {
                id: "kind-words",
                type: "testimonials",
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
                id: "book-banner",
                type: "cta-banner",
                content: {
                    title: "Your team has an opening this week.",
                    body: `Flat quote the same day, first clean this week where the schedule allows. ${hoursNote}.`,
                    cta: { label: landingCopy.bookCtaLabel, href: `${basePath}/book` },
                },
            },
        ],
    }
}

export function plansLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS["services-recurring"] },
        shell: shell(basePath, "/plans"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: "One checklist. Three rhythms.",
                    subheadline:
                        "Every plan runs the same checklist — the difference is how often, and what the deep clean adds. Prices cover a typical three-bed, two-bath home; larger homes get a flat adjustment quoted before we book.",
                },
            },
            {
                id: "plans",
                type: "pricing",
                variant: "tiers",
                content: {
                    kicker: "Plans",
                    title: "Pick a rhythm",
                    period: "/visit",
                    tiers: plans.map(planTier),
                },
            },
            {
                id: "compare",
                type: "comparison",
                // The recurring shape's proof: what's included, line by
                // line — the checklist is the product.
                variant: "table",
                content: {
                    kicker: "Line by line",
                    title: "What's included, exactly",
                    columns: planComparison.columns,
                    rows: planComparison.rows,
                },
            },
            {
                id: "faq",
                type: "faq",
                content: {
                    kicker: "Fair questions",
                    title: "What people ask before booking",
                    items: faq,
                },
            },
            {
                id: "book-banner",
                type: "cta-banner",
                content: {
                    title: landingCopy.fitNudgeTitle,
                    body: `Most weekly clients started with one deep clean. Call ${business.phone} for an instant quote.`,
                    cta: { label: landingCopy.bookCtaLabel, href: `${basePath}/book` },
                },
            },
        ],
    }
}

export function aboutLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS["services-recurring"] },
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
                        "The same two-person team every visit",
                        "48-hour re-clean guarantee, in writing",
                    ],
                    media: imageMedia(about.photo),
                    cta: { label: landingCopy.bookCtaLabel, href: `${basePath}/book` },
                },
            },
            {
                id: "credentials",
                type: "social-proof",
                variant: "text-logos",
                content: {
                    label: landingCopy.credentialsLabel,
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
                id: "book-banner",
                type: "cta-banner",
                content: {
                    title: "Meet your team this week.",
                    cta: { label: landingCopy.bookCtaLabel, href: `${basePath}/book` },
                },
            },
        ],
    }
}

export function bookLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS["services-recurring"] },
        shell: shell(basePath, "/book"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: book.headline,
                    subheadline: book.body,
                },
            },
            {
                id: "book-form",
                type: "lead-form",
                variant: "detail-form",
                content: {
                    kicker: "Booking request",
                    title: "Your home, your rhythm",
                    cta: "Request my quote",
                    confirmation: book.confirmation,
                    fields: book.fields,
                    // Direct channels trail the form. The phone is a tel:
                    // link — an instant quote is one call — while the email
                    // stays deliberately plain text (selectable for
                    // whatever mail client the visitor uses). The form
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
