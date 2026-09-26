import type { LandingConfig, MarketingShellConfig } from "@ui"
import { statusLabel } from "../Landing/hours"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import {
    about,
    addOns,
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
    roomReady,
    season,
    serviceArea,
    specimens,
    testimonials,
    thread,
    turnover,
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
 * The home page's middle is content-driven: each optional section renders
 * only when its content is filled — `thread` (the day as a text thread
 * with the house manager), `season` (the year's calendar, the current
 * window marked), `metrics` (proof strip), `included`
 * (the every-visit checklist), `specimens` (the portrait board of what the
 * trade deals with), `turnover` (the hour-by-hour rail), `roomReady` (the
 * door-hanger checklist), `gallery` (the standard). A seed picks its story
 * by what it fills; the order never changes. Two frames are content-picked
 * too: `home.layout` sets the hero variant, and plans that all carry a
 * `stub` print as season tickets.
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
    ...(plan.pricePrefix !== undefined ? { pricePrefix: plan.pricePrefix } : {}),
    ...(plan.highlighted !== undefined ? { highlighted: plan.highlighted } : {}),
    ...(plan.badge !== undefined ? { badge: plan.badge } : {}),
    ...(plan.stub !== undefined ? { stub: plan.stub } : {}),
    ...(plan.period !== undefined ? { period: plan.period } : {}),
})

const HERO_VARIANT = {
    split: "split-media",
    "full-bleed": "full-bleed-media",
    masthead: "masthead-overlay",
} as const

type Section = LandingConfig["sections"][number]

/** The section when its content is filled, nothing otherwise. */
const when = (filled: boolean, section: Section): Section[] => (filled ? [section] : [])

const pricingSection = (): Section => ({
    id: "plans",
    type: "pricing",
    // The shape's signature: the rhythm and its price on the home page — a
    // subscription sells up front. Stubs on every plan print them as tickets.
    variant: plans.length > 0 && plans.every((plan) => plan.stub !== undefined) ? "tickets" : "tiers",
    content: {
        kicker: landingCopy.pricesKicker,
        title: landingCopy.pricesTitle,
        period: landingCopy.pricePeriod,
        tiers: plans.map(planTier),
    },
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
                // The home beside the promise (or under it, full-bleed), with
                // the live office badge — must match the catalog's landing
                // seed byte for byte.
                variant: HERO_VARIANT[home.layout],
                content: {
                    badge: home.badge !== "" ? home.badge : statusLabel(weeklyHours, day, minute),
                    headline: home.headline,
                    ...(home.layout !== "split" && home.credit !== "" ? { credit: home.credit } : {}),
                    subheadline: home.subheadline,
                    primaryCta: { label: landingCopy.bookCtaLabel, href: `${basePath}/book` },
                    secondaryCta:
                        home.pricesCta !== ""
                            ? { label: home.pricesCta, href: `${basePath}/plans` }
                            : { label: `Call ${business.phone}`, href: business.phoneHref },
                    media: imageMedia(home.heroImage),
                },
            },
            ...when(thread.messages.length > 0, {
                id: "thread",
                type: "steps",
                // A day with the house manager as the text thread itself:
                // each bubble beside the plain line that explains it.
                variant: "message-thread",
                content: {
                    ...(thread.kicker !== "" ? { kicker: thread.kicker } : {}),
                    ...(thread.title !== "" ? { title: thread.title } : {}),
                    ...(thread.intro !== "" ? { intro: thread.intro } : {}),
                    thread: {
                        name: thread.name,
                        ...(thread.detail !== "" ? { detail: thread.detail } : {}),
                    },
                    steps: thread.messages.map((message) => ({
                        title: message.text,
                        description: message.note,
                        side: message.side,
                        ...(message.time !== "" ? { time: message.time } : {}),
                        ...(message.photo !== undefined ? { media: imageMedia(message.photo) } : {}),
                        ...(message.chip !== undefined ? { chip: message.chip } : {}),
                    })),
                },
            }),
            ...when(season.windows.length > 0, {
                id: "season",
                type: "schedule",
                // The year of service as a wall calendar: one column per
                // window, the one we're in marked from the clock.
                variant: "week-grid",
                content: {
                    ...(season.kicker !== "" ? { kicker: season.kicker } : {}),
                    ...(season.title !== "" ? { title: season.title } : {}),
                    ...(season.intro !== "" ? { intro: season.intro } : {}),
                    days: season.windows.map((window) => ({
                        label: window.label,
                        ...(window.months.includes(now.getMonth() + 1) ? { today: true } : {}),
                        sessions: [{ time: "", title: window.title, detail: window.detail }],
                    })),
                    ...(season.note !== "" ? { note: season.note } : {}),
                },
            }),
            ...when(metrics.length > 0, {
                id: "proof",
                type: "social-proof",
                variant: "metrics-row",
                content: {
                    label: business.license,
                    metrics,
                },
            }),
            ...when(included.length > 0, {
                id: "included",
                type: "feature-grid",
                variant: "icon-list",
                content: {
                    kicker: "Every visit",
                    title: "The checklist that never gets skipped",
                    features: included,
                },
            }),
            ...when(specimens.items.length > 0, {
                id: "specimens",
                type: "showcase",
                // The field guide: a portrait plate per creature (or weed),
                // numbered like a specimen drawer.
                variant: "specimens",
                content: {
                    kicker: specimens.kicker,
                    title: specimens.title,
                    items: specimens.items.map((item, index) => ({
                        eyebrow: `No. ${String(index + 1).padStart(2, "0")}`,
                        title: item.name,
                        meta: item.meta,
                        description: item.description,
                        media: imageMedia(item.image),
                    })),
                },
            }),
            pricingSection(),
            ...when(turnover.steps.length > 0, {
                id: "turnover",
                type: "steps",
                // Turnover day as a rail: clock times on the line, a proof
                // photo per step.
                variant: "horizontal-rail",
                content: {
                    kicker: turnover.kicker,
                    title: turnover.title,
                    steps: turnover.steps.map((step) => ({
                        title: step.title,
                        description: step.description,
                        label: step.time,
                        ...(step.image !== undefined ? { media: imageMedia(step.image) } : {}),
                    })),
                },
            }),
            ...when(roomReady.items.length > 0, {
                id: "checklist",
                type: "feature-grid",
                // The door hanger: what gets ticked before the lockbox
                // closes, beside a photo of the crew at work.
                variant: "checklist",
                content: {
                    kicker: roomReady.kicker,
                    title: roomReady.title,
                    cardTitle: roomReady.cardTitle,
                    body: roomReady.body,
                    ...(roomReady.photo ? { media: imageMedia(roomReady.photo) } : {}),
                    features: roomReady.items.map((item) => ({
                        title: item.label,
                        description: item.note,
                        ...(item.checked !== undefined ? { checked: item.checked } : {}),
                    })),
                },
            }),
            ...when(gallery.length > 0, {
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
            }),
            {
                id: "kind-words",
                type: "testimonials",
                variant: "single-featured",
                content: {
                    kicker: landingCopy.reviewsKicker,
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
                    title: landingCopy.homeBannerTitle,
                    body: `${landingCopy.homeBannerBody} ${hoursNote}.`,
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
                    headline: landingCopy.plansHeadline,
                    subheadline: landingCopy.plansSubheadline,
                },
            },
            pricingSection(),
            ...when(addOns.length > 0, {
                id: "add-ons",
                type: "feature-grid",
                variant: "cards-3up",
                content: {
                    kicker: landingCopy.addOnsKicker,
                    title: landingCopy.addOnsTitle,
                    features: addOns,
                },
            }),
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
                    body: landingCopy.fitNudgeBody,
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
                    bullets: landingCopy.aboutBullets,
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
                    kicker: landingCopy.reviewsKicker,
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
                    title: landingCopy.aboutBannerTitle,
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
                    title: landingCopy.bookFormTitle,
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
