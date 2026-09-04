import type { LandingConfig, MarketingMedia, MarketingShellConfig } from "@ui"
import { formatMinute, statusLabel, type DayHours } from "../Landing/hours"
import type { PracticeContent, PracticeProvider } from "../Landing/practiceDocument"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import { careShell } from "./careShell"
import { booking, codePractice, home, practice, providerPhotos, story, type CareImage } from "./content"

/**
 * The primary-care pack's pages as landing-kernel configs
 * (docs/landing.md). The business facts — providers, services,
 * insurance, hours, reviews, new-patient info — arrive as a RESOLVED
 * `PracticeContent` (the business-content contract over `content.ts`,
 * resolved once in CarePage via `usePracticeContent`): an owner's Manage
 * edit and the code default walk the same path. Page copy that isn't a
 * business fact (headlines, the story, the booking intro) stays in
 * `content.ts` alone.
 *
 * The luxe-light register worn in the practice's own calm teal: hairline
 * rules, white cards on a near-white ground, one confident accent. No
 * accent word in headlines — a clinic's type doesn't shout.
 *
 * Every builder takes `basePath`: "" when the pack owns the site (links
 * are /providers, /book) and "/care" on the preview route — same pages,
 * both wirings. Section `id`s are stable: CarePage pipes these configs
 * through the landing document's per-page merge (`useSitePageConfig`),
 * and the catalog's seeded skeletons bind to the ids.
 */

const imageMedia = (image: CareImage): MarketingMedia => ({
    kind: "image",
    src: image.src,
    alt: image.alt,
    width: image.width,
    height: image.height,
    srcSet: image.srcSet,
})

/**
 * A provider's portrait: the contract's photo ref when the owner set one
 * (a served public path), else the pack's own portrait by provider id —
 * facts from the document, art from code.
 */
function providerMedia(provider: PracticeProvider): MarketingMedia | undefined {
    if (provider.photo !== undefined) {
        return { kind: "image", src: provider.photo, alt: provider.name }
    }
    const code = providerPhotos[provider.providerId]
    return code === undefined ? undefined : imageMedia(code)
}

function shell(basePath: string, currentPath: string): MarketingShellConfig {
    return careShell(basePath, currentPath)
}

/** The resolved practice's primary location (the pack ships exactly one). */
function mainLocation(content: PracticeContent): PracticeContent["locations"][number] | undefined {
    return content.locations[0]
}

/** Contract hours → the hours engine's day/intervals shape. */
export function toDayHours(content: PracticeContent): DayHours[] {
    const location = mainLocation(content)
    if (location === undefined) return []
    const byDay = new Map<number, [number, number][]>()
    for (const entry of location.hours) {
        const intervals = byDay.get(entry.day) ?? []
        intervals.push([entry.open, entry.close])
        byDay.set(entry.day, intervals)
    }
    return [...byDay.entries()].map(([day, intervals]) => ({
        day,
        intervals: intervals.sort((a, b) => a[0] - b[0]),
    }))
}

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

/**
 * Human hours lines from the contract's entries, consecutive same-hours
 * days grouped: "Monday – Friday · 8 AM – 5 PM", "Saturday · 9 AM – 1 PM".
 */
export function hoursLines(content: PracticeContent): string[] {
    const location = mainLocation(content)
    if (location === undefined) return []
    const sorted = [...location.hours].sort((a, b) => a.day - b.day)
    const lines: string[] = []
    let runStart = 0
    for (let i = 0; i <= sorted.length; i++) {
        const prev = sorted[i - 1]
        const current = sorted[i]
        const extends_ =
            i > runStart &&
            current !== undefined &&
            prev !== undefined &&
            current.day === prev.day + 1 &&
            current.open === prev.open &&
            current.close === prev.close
        if (i === 0 || extends_) continue
        const first = sorted[runStart]
        const last = sorted[i - 1]
        const days =
            first.day === last.day
                ? DAY_LABELS[first.day]
                : `${DAY_LABELS[first.day]} – ${DAY_LABELS[last.day]}`
        lines.push(`${days} · ${formatMinute(first.open)} – ${formatMinute(first.close)}`)
        runStart = i
    }
    return lines
}

/** Map link from the practice's map-ready address (content.ts, not contract). */
function directionsHref(): string {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(practice.mapsQuery)}`
}

/** The insurance strip, shared by home, services, and new-patients. */
function insuranceSection(content: PracticeContent) {
    return {
        id: "insurance",
        type: "logos" as const,
        variant: "strip" as const,
        content: {
            kicker: "In network with most plans",
            logos: content.insurance.map((name) => ({ name })),
        },
    }
}

/** The visit panel: address, phone, grouped hours, a map link. */
function visitSection(content: PracticeContent, media: CareImage) {
    const location = mainLocation(content)
    return {
        id: "visit",
        type: "content-split" as const,
        variant: "media-left" as const,
        content: {
            kicker: "Visit us",
            headline: "On Alder Street, in the heart of downtown.",
            body:
                location === undefined
                    ? practice.address
                    : `${location.address}${location.phone !== undefined ? ` · ${location.phone}` : ""}`,
            bullets: hoursLines(content),
            cta: { label: "Get directions", href: directionsHref() },
            media: imageMedia(media),
        },
    }
}

/** The closing ask, worn by most pages. */
function bookBanner(basePath: string, title: string) {
    return {
        id: "book-banner",
        type: "cta-banner" as const,
        variant: "card" as const,
        content: {
            title,
            cta: { label: "Book an appointment", href: `${basePath}/book` },
        },
    }
}

export function homeLanding(
    basePath: string,
    now: Date,
    content: PracticeContent = codePractice,
): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.care },
        shell: shell(basePath, ""),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "split-media",
                content: {
                    // Live from the clock and the contract's hours — the
                    // menu pack's open-badge discipline.
                    badge: statusLabel(
                        toDayHours(content),
                        now.getDay(),
                        now.getHours() * 60 + now.getMinutes(),
                    ),
                    headline: home.headline,
                    accent: "none",
                    subheadline: home.subheadline,
                    primaryCta: { label: "Book an appointment", href: `${basePath}/book` },
                    secondaryCta: { label: "Meet the providers", href: `${basePath}/providers` },
                    media: imageMedia(home.hero),
                },
            },
            insuranceSection(content),
            {
                id: "services",
                type: "card-grid",
                variant: "3up",
                content: {
                    kicker: "What we treat",
                    title: "Care for the whole family",
                    cards: content.services.slice(0, 6).map((service) => ({
                        title: service.name,
                        body: service.description,
                    })),
                },
            },
            {
                id: "providers",
                type: "team",
                variant: "portraits",
                content: {
                    kicker: "Your providers",
                    title: "The people behind the door",
                    members: content.providers.map((provider) => ({
                        name: provider.name,
                        role: [provider.credentials, provider.role]
                            .filter((part) => part !== undefined && part !== "")
                            .join(" · "),
                        media: providerMedia(provider),
                    })),
                },
            },
            {
                id: "kind-words",
                type: "testimonials",
                variant: "quote-grid",
                content: {
                    kicker: "From our patients",
                    quotes: content.reviews.map((review) => ({
                        quote: review.quote,
                        author: review.name,
                        title: review.detail,
                    })),
                },
            },
            visitSection(content, story.image),
            bookBanner(basePath, "Ready when you are."),
        ],
    }
}

export function providersLanding(basePath: string, content: PracticeContent = codePractice): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.care },
        shell: shell(basePath, "/providers"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: "The providers.",
                    accent: "none",
                    subheadline:
                        "Four clinicians who share one chart and one standard: you see someone who knows you, and the visit takes the time it takes.",
                },
            },
            {
                id: "providers",
                type: "team",
                variant: "portraits",
                content: {
                    members: content.providers.map((provider) => ({
                        name: provider.name,
                        role: [provider.credentials, provider.role]
                            .filter((part) => part !== undefined && part !== "")
                            .join(" · "),
                        bio: provider.bio,
                        media: providerMedia(provider),
                    })),
                },
            },
            {
                id: "story",
                type: "content-split",
                variant: "media-right",
                content: {
                    kicker: story.kicker,
                    headline: story.headline,
                    body: story.paragraphs.join(" "),
                    media: imageMedia(story.image),
                    cta: { label: "Book with any of us", href: `${basePath}/book` },
                },
            },
        ],
    }
}

export function servicesLanding(basePath: string, content: PracticeContent = codePractice): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.care },
        shell: shell(basePath, "/what-we-treat"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: "What we treat.",
                    accent: "none",
                    subheadline:
                        "Everyday medicine for every age — and when something needs a specialist, we make the referral and stay in the loop.",
                },
            },
            {
                id: "services",
                type: "card-grid",
                variant: "4up",
                content: {
                    cards: content.services.map((service) => ({
                        title: service.name,
                        body: service.description,
                    })),
                },
            },
            insuranceSection(content),
            bookBanner(basePath, "Same-day slots most mornings."),
        ],
    }
}

export function newPatientsLanding(basePath: string, content: PracticeContent = codePractice): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.care },
        shell: shell(basePath, "/new-patients"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: "Your first visit, without the maze.",
                    accent: "none",
                    subheadline:
                        "Everything you need before you walk in — what to bring, how long it takes, and how your records follow you here.",
                },
            },
            {
                id: "first-visit",
                type: "steps",
                variant: "timeline",
                content: {
                    kicker: "New patients",
                    steps: content.newPatient.map((item) => ({
                        title: item.title,
                        description: item.body,
                    })),
                },
            },
            insuranceSection(content),
            visitSection(content, home.hero),
            bookBanner(basePath, "New-patient visits are 45 minutes, on purpose."),
        ],
    }
}

export function bookLanding(basePath: string, content: PracticeContent = codePractice): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.care },
        shell: shell(basePath, "/book"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: booking.headline,
                    accent: "none",
                    subheadline: booking.intro,
                },
            },
            // The AppointmentWidget mounts as this page's hero trailer
            // (CarePage `sectionTrailers`), so the times sit right here.
            {
                id: "how",
                type: "steps",
                variant: "numbered-cards",
                content: {
                    kicker: "How it works",
                    steps: [
                        {
                            title: "Pick a visit type",
                            description:
                                "New patient, follow-up, or annual physical — the length is built in.",
                        },
                        {
                            title: "Choose a provider and time",
                            description:
                                "Real openings from each provider's actual week, up to four weeks out.",
                        },
                        {
                            title: "Confirm by email",
                            description:
                                "Your confirmation carries a one-click cancel link. No portal, no password.",
                        },
                    ],
                },
            },
            {
                id: "privacy",
                type: "content-split",
                variant: "media-right",
                content: {
                    kicker: "What booking asks",
                    headline: "Your details, not your diagnosis.",
                    body: booking.privacyNote,
                    bullets: [
                        "Your name and contact details",
                        "The visit type and a time",
                        "Whether you're new or returning — that's all",
                    ],
                },
            },
            visitSection(content, story.image),
        ],
    }
}
