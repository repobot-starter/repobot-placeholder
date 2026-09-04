import type { LandingConfig, MarketingShellConfig } from "@ui"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import {
    about,
    business,
    dispatchBadge,
    faq,
    home,
    hoursNote,
    landingCopy,
    metrics,
    request,
    serviceArea,
    services,
    steps,
    testimonials,
    type SiteImage,
} from "./content"
import { servicesEmergencyShell } from "./servicesEmergencyShell"

/**
 * The emergency-services pack's pages as landing-kernel configs — the
 * `services` category's dispatch shape (docs/landing.md). `content.ts`
 * stays the single owner-editable source; these builders only map it into
 * sections.
 *
 * The shape's convictions, in section order: the hero leads with the call
 * (primary CTA is tel:, the badge is the 24/7 promise — an always-on line
 * has no open/closed state to compute), the metrics strip proves response
 * time before anything else asks for trust, and pricing is flat and
 * printed on the services page. No portfolio: nobody browses a gallery
 * while their basement floods.
 *
 * Every builder takes `basePath`: "" when the pack owns the site (links
 * are /services, /about, /request) and "/emergency" on the preview route —
 * same pages, both wirings.
 *
 * Every section carries a stable `id`: ServicesEmergencyPage pipes these
 * configs through the landing document's per-page merge
 * (`useSitePageConfig`), so the platform's structural editor can reorder /
 * delete / add sections on these pages. The pack's catalog maps the routes
 * (`landing.routes` in catalog.json).
 */

const imageMedia = (image: SiteImage) => ({
    kind: "image" as const,
    src: image.src,
    alt: image.alt,
    width: image.width,
    height: image.height,
    srcSet: image.srcSet,
})

// The shared chrome lives in servicesEmergencyShell.ts (manifest pages
// wear it too); this alias keeps the page builders reading naturally.
function shell(
    basePath: string,
    currentPath: "" | "/services" | "/about" | "/request",
): MarketingShellConfig {
    return servicesEmergencyShell(basePath, currentPath)
}

export function homeLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS["services-emergency"] },
        shell: shell(basePath, ""),
        sections: [
            {
                id: "hero",
                type: "hero",
                // The call beside the proof: on a dispatch site the phone
                // IS the product, so it takes the primary slot — must match
                // the catalog's landing seed byte for byte.
                variant: "split-media",
                content: {
                    badge: dispatchBadge,
                    headline: home.headline,
                    subheadline: home.subheadline,
                    primaryCta: { label: `Call ${business.phone}`, href: business.phoneHref },
                    secondaryCta: { label: "Request service", href: `${basePath}/request` },
                    media: imageMedia(home.heroImage),
                },
            },
            {
                id: "dispatch-proof",
                type: "social-proof",
                // The shape's signature: response time as the headline
                // number, before anything else asks for trust.
                variant: "metrics-row",
                content: {
                    label: business.license,
                    metrics,
                },
            },
            {
                id: "services",
                type: "card-grid",
                variant: "3up",
                content: {
                    kicker: "What we fix",
                    title: landingCopy.servicesHeading,
                    cards: services.map((service) => ({
                        media: imageMedia(service.image),
                        title: service.title,
                        body: service.description,
                    })),
                },
            },
            {
                id: "when-you-call",
                type: "steps",
                variant: "numbered-cards",
                content: {
                    kicker: steps.kicker,
                    title: steps.title,
                    steps: steps.items,
                },
            },
            {
                id: "kind-words",
                type: "testimonials",
                variant: "single-featured",
                content: {
                    kicker: "From our customers",
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
                    label: "Trucks reach",
                    items: serviceArea,
                },
            },
            {
                id: "call-banner",
                type: "cta-banner",
                content: {
                    title: landingCopy.finalCtaTitle,
                    body: `The line is answered by a person, 24 hours a day. ${hoursNote}.`,
                    cta: { label: `Call ${business.phone}`, href: business.phoneHref },
                },
            },
        ],
    }
}

export function servicesPageLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS["services-emergency"] },
        shell: shell(basePath, "/services"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: "Flat prices, quoted first.",
                    subheadline:
                        "Every job is diagnosed, then quoted flat — parts, labor, cleanup — before the work starts. The quote is the invoice, and after-hours costs the same as daytime.",
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
                        url: `${basePath}/request`,
                    })),
                },
            },
            {
                id: "faq",
                type: "faq",
                content: {
                    kicker: "Fair questions",
                    title: "What people ask before they call",
                    items: faq,
                },
            },
            {
                id: "call-banner",
                type: "cta-banner",
                content: {
                    title: "Not sure what it needs? Describe the symptom.",
                    body: `Call ${business.phone} and the dispatcher will tell you straight — including when it's something you can fix yourself.`,
                    cta: { label: `Call ${business.phone}`, href: business.phoneHref },
                },
            },
        ],
    }
}

export function aboutLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS["services-emergency"] },
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
                        "Flat prices quoted before the work — no hourly meter",
                        "A name, a photo, and a live ETA texted before the truck rolls",
                    ],
                    media: imageMedia(about.photo),
                    cta: { label: "Request service", href: `${basePath}/request` },
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
                    kicker: "From our customers",
                    title: "The calls we're proudest of",
                    quotes: testimonials.map((entry) => ({
                        quote: entry.quote,
                        author: entry.name,
                        title: entry.detail,
                    })),
                },
            },
            {
                id: "call-banner",
                type: "cta-banner",
                content: {
                    title: "Put the number on the fridge.",
                    cta: { label: `Call ${business.phone}`, href: business.phoneHref },
                },
            },
        ],
    }
}

export function requestLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS["services-emergency"] },
        shell: shell(basePath, "/request"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: request.headline,
                    subheadline: request.body,
                },
            },
            {
                id: "request-form",
                type: "lead-form",
                variant: "detail-form",
                content: {
                    kicker: "Service request",
                    title: "The details",
                    cta: "Request service",
                    confirmation: request.confirmation,
                    fields: request.fields,
                    // Direct channels trail the form. The emergency line
                    // leads as a tel: link — on a dispatch site the call is
                    // the primary channel even on the form page — while the
                    // email stays deliberately plain text (selectable for
                    // whatever mail client the visitor uses). The form
                    // itself delivers through the platform's managed forms
                    // pipeline.
                    channels: [
                        { label: "Emergency line", value: business.phone, href: business.phoneHref },
                        { label: "Email", value: business.email },
                        {
                            label: "Shop",
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
