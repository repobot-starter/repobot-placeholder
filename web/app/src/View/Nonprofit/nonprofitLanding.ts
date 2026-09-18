import type { LandingConfig, MarketingShowcaseItem } from "@ui"
import { formatEventDay, formatEventMoment, splitEvents, type EventSplit } from "../Landing/events"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import { nonprofitShell } from "./nonprofitShell"
import {
    donate,
    events,
    home,
    impact,
    impactStats,
    org,
    programs,
    programsPage,
    stats,
    volunteer,
    type NonprofitEvent,
    type NonprofitImage,
} from "./content"

/**
 * The nonprofit pack's pages as landing-kernel configs (docs/landing.md)
 * in the monolith register: true black, monumental numbers typography,
 * photography as the only color on the page, and a hard white Donate
 * plate as the entire accent budget — the serious annual-report read.
 * `content.ts` stays the single owner-editable source; these builders
 * only map it into sections.
 *
 * The volunteer calendar is computed per render from the passed `now`
 * (pure logic in ../Landing/events.ts): dated entries split into upcoming
 * vs. past, the soonest wearing the "Next up" badge, and the home hero
 * naming the next volunteer day. A stale listing can't happen.
 *
 * Every builder takes `basePath`: "" when the pack owns the site and
 * "/nonprofit" on the preview route — same pages, both wirings. Every
 * section carries a stable `id`: NonprofitPage pipes these configs
 * through the landing document's per-page merge (`useSitePageConfig`),
 * so the platform's structural editor can reorder / delete / add
 * sections. The pack's catalog maps the routes (`landing.routes`).
 */

const imageMedia = (image: NonprofitImage) => ({
    kind: "image" as const,
    src: image.src,
    alt: image.alt,
    width: image.width,
    height: image.height,
    srcSet: image.srcSet,
})

/** An event as a showcase card: the when-line as the small-caps eyebrow,
 * the short location beside the title, the soonest upcoming one wearing
 * the "Next up" badge. */
function eventItem(event: NonprofitEvent, nextUpSlug: string | undefined): MarketingShowcaseItem {
    return {
        title: event.title,
        description: event.description,
        eyebrow: formatEventMoment(event.start),
        meta: event.location,
        ...(event.image !== undefined ? { media: imageMedia(event.image) } : {}),
        ...(event.slug === nextUpSlug ? { badge: { label: "Next up" } } : {}),
    }
}

/**
 * Calendar-bearing builders take the RESOLVED events: the page resolves
 * the business-content contract over `content.ts` once
 * (`useNonprofitCalendar` in NonprofitPage) and the builders split
 * whatever entries they are handed — an owner's Manage edit and the code
 * default walk the same path. They default to the code events, so callers
 * without a resolved document (pinned tests, the preview route) keep the
 * plain (basePath, now) signature.
 */
function calendar(now: Date, entries: NonprofitEvent[]): EventSplit<NonprofitEvent> {
    return splitEvents(entries, now)
}

/** The computed hero badge: the next volunteer day, when there is one. */
function nextDayBadge(now: Date, entries: NonprofitEvent[]): string | undefined {
    const next = calendar(now, entries).nextUp
    return next !== undefined ? `Next volunteer day — ${formatEventDay(next.start)}` : undefined
}

export function homeLanding(
    basePath: string,
    now: Date,
    calendarEvents: NonprofitEvent[] = events,
): LandingConfig {
    const badge = nextDayBadge(now, calendarEvents)
    return {
        style: { preset: PACK_REGISTERS.nonprofit },
        shell: nonprofitShell(basePath, ""),
        sections: [
            {
                id: "hero",
                type: "hero",
                // The fieldwork photograph under the masthead; the badge
                // is computed from the events file at render time.
                variant: "masthead-overlay",
                content: {
                    ...(badge !== undefined ? { badge } : {}),
                    headline: home.headline,
                    accent: "none",
                    subheadline: home.subheadline,
                    primaryCta: { label: "Volunteer", href: `${basePath}/volunteer` },
                    secondaryCta: { label: "See the numbers", href: `${basePath}/impact` },
                    media: imageMedia(home.hero),
                },
            },
            {
                id: "numbers",
                type: "stats",
                // The annual-report spine: four numbers at display scale.
                variant: "row",
                content: {
                    kicker: "The record",
                    stats,
                },
            },
            {
                id: "programs",
                type: "showcase",
                variant: "card-grid",
                content: {
                    kicker: "Programs",
                    title: "Four programs, one watershed",
                    items: programs.map((program) => ({
                        title: program.title,
                        description: program.description,
                        eyebrow: program.eyebrow,
                        media: imageMedia(program.image),
                        url: `${basePath}/programs`,
                    })),
                },
            },
            {
                id: "restored",
                type: "content-split",
                variant: "media-right",
                content: {
                    kicker: home.restored.kicker,
                    headline: home.restored.headline,
                    body: home.restored.body,
                    media: imageMedia(home.restored.image),
                    cta: { label: "Read the impact report", href: `${basePath}/impact` },
                },
            },
            {
                id: "voice",
                type: "testimonials",
                // One neighbor's verdict at display scale — no card chrome.
                variant: "single-featured",
                content: {
                    quotes: [home.featuredQuote],
                },
            },
            {
                id: "donate-banner",
                type: "cta-banner",
                // The one full-bleed plate on the page: the ask, inverted.
                variant: "full-bleed",
                content: {
                    title: donate.headline,
                    body: donate.body,
                    cta: { label: donate.cta, href: org.donateUrl },
                },
            },
        ],
    }
}

export function programsLanding(basePath: string): LandingConfig {
    // One content-split per program, sides alternating — the annual
    // report's program spreads, each photograph given a full page edge.
    const programSections = programs.map((program, index) => ({
        id: `program-${program.slug}`,
        type: "content-split" as const,
        variant: (index % 2 === 0 ? "media-right" : "media-left") as "media-right" | "media-left",
        content: {
            kicker: program.eyebrow,
            headline: program.title,
            body: program.description,
            bullets: program.bullets,
            media: imageMedia(program.image),
        },
    }))
    return {
        style: { preset: PACK_REGISTERS.nonprofit },
        shell: nonprofitShell(basePath, "/programs"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: programsPage.headline,
                    accent: "none",
                    subheadline: programsPage.body,
                },
            },
            ...programSections,
            {
                id: "volunteer-banner",
                type: "cta-banner",
                variant: "card",
                content: {
                    title: "Every program runs on crews.",
                    body: "Pick a Saturday — the mud does the onboarding.",
                    cta: { label: "Volunteer", href: `${basePath}/volunteer` },
                },
            },
        ],
    }
}

export function impactLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.nonprofit },
        shell: nonprofitShell(basePath, "/impact"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: impact.headline,
                    accent: "none",
                    subheadline: impact.body,
                },
            },
            {
                id: "ledger",
                type: "stats",
                // The full ledger: each number gets a surface and its
                // supporting sentence — annual-report page two.
                variant: "cards",
                content: {
                    kicker: "Audited, published, delisted",
                    title: "The year in water",
                    stats: impactStats,
                },
            },
            {
                id: "letter",
                type: "content-split",
                variant: "media-left",
                content: {
                    kicker: impact.letter.kicker,
                    headline: impact.letter.headline,
                    body: impact.letter.body,
                    media: imageMedia(impact.letter.portrait),
                    cta: { label: "Volunteer", href: `${basePath}/volunteer` },
                },
            },
            {
                id: "voices",
                type: "testimonials",
                variant: "quote-grid",
                content: {
                    kicker: "Witnesses",
                    title: "People who watch the water",
                    quotes: impact.voices,
                },
            },
            {
                id: "donate-banner",
                type: "cta-banner",
                variant: "full-bleed",
                content: {
                    title: donate.headline,
                    body: donate.body,
                    cta: { label: donate.cta, href: org.donateUrl },
                },
            },
        ],
    }
}

export function volunteerLanding(
    basePath: string,
    now: Date,
    calendarEvents: NonprofitEvent[] = events,
): LandingConfig {
    const split = calendar(now, calendarEvents)
    return {
        style: { preset: PACK_REGISTERS.nonprofit },
        shell: nonprofitShell(basePath, "/volunteer"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    ...(split.nextUp !== undefined ? { badge: `Next up — ${split.nextUp.title}` } : {}),
                    headline: volunteer.headline,
                    accent: "none",
                    subheadline: volunteer.body,
                },
            },
            {
                id: "upcoming",
                type: "showcase",
                variant: "card-grid",
                content: {
                    kicker: "Upcoming",
                    title: "Days on the calendar",
                    items: split.upcoming.map((event) => eventItem(event, split.nextUp?.slug)),
                },
            },
            {
                id: "how",
                type: "steps",
                variant: "timeline",
                content: {
                    kicker: "How it works",
                    title: "Three hours, no prerequisites",
                    steps: volunteer.steps,
                },
            },
            {
                id: "signup",
                type: "lead-form",
                variant: "detail-form",
                content: {
                    kicker: "Volunteer",
                    title: "Join a crew",
                    body: "One form, one human reply — we never sell or share the list.",
                    cta: "Sign me up",
                    confirmation: volunteer.confirmation,
                    fields: volunteer.fields,
                    channels: [
                        { label: "Email", value: org.email },
                        { label: "Field lab", value: "Georgetown, Seattle" },
                    ],
                },
            },
            {
                id: "past",
                type: "showcase",
                variant: "card-grid",
                content: {
                    kicker: "The field record",
                    title: "What crews already did this year",
                    // Text-only and quiet: the archive reads like minutes.
                    items: split.past.map((event) => ({
                        title: event.title,
                        description: event.description,
                        eyebrow: formatEventDay(event.start),
                        meta: event.location,
                    })),
                },
            },
        ],
    }
}
