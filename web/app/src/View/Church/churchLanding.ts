import type { LandingConfig, MarketingShowcaseItem } from "@ui"
import {
    formatEventDay,
    formatEventMoment,
    nextMomentLabel,
    splitEvents,
    type EventSplit,
} from "../Landing/events"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import { churchShell } from "./churchShell"
import {
    church,
    events,
    eventsPage,
    give,
    home,
    ministries,
    ministriesPage,
    serviceSchedule,
    sermons,
    sermonsPage,
    serviceTimes,
    visit,
    type ChurchEvent,
    type ChurchImage,
} from "./content"

/**
 * The church pack's pages as landing-kernel configs (docs/landing.md) in
 * the hymnal register: the midnight service — warm near-black ground,
 * monumental uppercase type, hairline rules, one candle-amber accent held
 * to the CTAs. `content.ts` stays the single owner-editable source; these
 * builders only map it into sections.
 *
 * Two things are computed per render from the passed `now` (pure logic in
 * ../Landing/events.ts — the menu pack's open-badge discipline):
 * - the hero badge: "Next service — Sunday 9 AM" from `serviceTimes`
 * - the events pages: dated entries split into upcoming vs. past, the
 *   soonest wearing the "Next up" badge — a stale listing can't happen.
 *
 * Every builder takes `basePath`: "" when the pack owns the site and
 * "/church" on the preview route — same pages, both wirings. Every
 * section carries a stable `id`: ChurchPage pipes these configs through
 * the landing document's per-page merge (`useSitePageConfig`), so the
 * platform's structural editor can reorder / delete / add sections. The
 * pack's catalog maps the routes (`landing.routes`).
 */

const imageMedia = (image: ChurchImage) => ({
    kind: "image" as const,
    src: image.src,
    alt: image.alt,
    width: image.width,
    height: image.height,
    srcSet: image.srcSet,
})

/** "Aug 23, 2026" — the archive's printed date line. Parses the date's
 * components directly: a bare "YYYY-MM-DD" through `new Date` would read
 * as UTC midnight and print a day early west of Greenwich. */
function sermonDate(iso: string): string {
    const [year, month, day] = iso.split("-").map(Number)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return `${months[month - 1]} ${day}, ${year}`
}

/** The computed hero badge, e.g. "Next service — Sunday 9 AM". */
function nextServiceBadge(now: Date): string | undefined {
    return nextMomentLabel(serviceTimes, now.getDay(), now.getHours() * 60 + now.getMinutes(), "service")
}

/** An event as a showcase card: the when-line as the small-caps eyebrow
 * (the printed-program read), the short location beside the title, the
 * soonest upcoming one wearing the "Next up" badge. */
function eventItem(event: ChurchEvent, nextUpSlug: string | undefined): MarketingShowcaseItem {
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
 * the business-content contract over `content.ts` once (`useChurchCalendar`
 * in ChurchPage) and the builders split whatever entries they are handed —
 * an owner's Manage edit and the code default walk the same path. They
 * default to the code events, so callers without a resolved document
 * (pinned tests, the preview route) keep the plain (basePath, now)
 * signature.
 */
function calendar(now: Date, entries: ChurchEvent[]): EventSplit<ChurchEvent> {
    return splitEvents(entries, now)
}

export function homeLanding(
    basePath: string,
    now: Date,
    calendarEvents: ChurchEvent[] = events,
): LandingConfig {
    const split = calendar(now, calendarEvents)
    return {
        style: { preset: PACK_REGISTERS.church },
        shell: churchShell(basePath, ""),
        sections: [
            {
                id: "hero",
                type: "hero",
                // The congregation photograph under masthead type; the
                // badge is computed from serviceTimes at render time.
                variant: "masthead-overlay",
                content: {
                    ...(nextServiceBadge(now) !== undefined ? { badge: nextServiceBadge(now) } : {}),
                    headline: home.headline,
                    accent: "none",
                    subheadline: home.subheadline,
                    primaryCta: { label: "Plan a visit", href: `${basePath}/visit` },
                    secondaryCta: { label: "What's on", href: `${basePath}/events` },
                    media: imageMedia(home.hero),
                },
            },
            {
                id: "services",
                type: "highlights",
                // The week's setlist: service times at display scale
                // between hairline rules — type does the art direction.
                variant: "setlist",
                content: {
                    kicker: "The setlist",
                    highlights: serviceSchedule.map((entry) => ({
                        headline: entry.headline,
                        body: entry.body,
                    })),
                },
            },
            {
                id: "welcome",
                type: "content-split",
                variant: "media-right",
                content: {
                    kicker: home.welcome.kicker,
                    headline: home.welcome.headline,
                    body: home.welcome.body,
                    media: imageMedia(home.welcome.portrait),
                    cta: { label: "Plan a visit", href: `${basePath}/visit` },
                },
            },
            {
                id: "ministries",
                type: "showcase",
                variant: "collections",
                content: {
                    kicker: "Ministries",
                    title: "Life together, all week",
                    items: ministries.slice(0, 3).map((ministry) => ({
                        title: ministry.title,
                        description: ministry.description,
                        eyebrow: ministry.eyebrow,
                        media: imageMedia(ministry.image),
                        url: `${basePath}/ministries`,
                    })),
                },
            },
            {
                id: "upcoming",
                type: "showcase",
                variant: "card-grid",
                content: {
                    kicker: "Upcoming",
                    title: "On the calendar",
                    items: split.upcoming.slice(0, 3).map((event) => eventItem(event, split.nextUp?.slug)),
                },
            },
            {
                id: "give-banner",
                type: "cta-banner",
                // The one loud ask: an edge-to-edge amber-tinted band, not
                // another card in the column.
                variant: "full-bleed",
                content: {
                    title: give.headline,
                    body: give.body,
                    cta: { label: give.cta, href: church.giveUrl },
                },
            },
        ],
    }
}

export function visitLanding(basePath: string, now: Date): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.church },
        shell: churchShell(basePath, "/visit"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    ...(nextServiceBadge(now) !== undefined ? { badge: nextServiceBadge(now) } : {}),
                    headline: visit.headline,
                    accent: "none",
                    subheadline: visit.body,
                },
            },
            {
                id: "expectations",
                type: "steps",
                variant: "timeline",
                content: {
                    kicker: "What to expect",
                    title: "A Sunday, start to finish",
                    steps: visit.expectations,
                },
            },
            {
                id: "sundays",
                type: "content-split",
                variant: "media-left",
                content: {
                    kicker: "The details",
                    headline: "Sundays at Bellwood",
                    body: "Everything a first visit actually needs to know, on one card:",
                    bullets: [
                        "Sundays 9 & 11 AM — two identical services",
                        "Wednesdays 7 PM — midweek prayer in the side chapel",
                        "Kids' check-in opens twenty minutes before each service",
                        "Gravel lot off Bellwood Avenue, plus street parking",
                    ],
                    media: imageMedia(visit.photo),
                },
            },
            {
                id: "plan-visit",
                type: "lead-form",
                variant: "detail-form",
                content: {
                    kicker: "Plan a visit",
                    title: "Tell us you're coming",
                    body: "Or don't — walking in cold works too. This just lets us have things ready.",
                    cta: "Send it",
                    confirmation: visit.confirmation,
                    fields: visit.fields,
                    channels: [
                        {
                            label: "Address",
                            value: church.address,
                            href: `https://maps.google.com/?q=${encodeURIComponent(church.mapsQuery)}`,
                        },
                        {
                            label: "Phone",
                            value: church.phone,
                            href: `tel:${church.phone.replace(/[^0-9+]/g, "")}`,
                        },
                        { label: "Email", value: church.email },
                    ],
                },
            },
        ],
    }
}

export function ministriesLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.church },
        shell: churchShell(basePath, "/ministries"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: ministriesPage.headline,
                    accent: "none",
                    subheadline: ministriesPage.body,
                },
            },
            {
                id: "ministries",
                type: "showcase",
                variant: "card-grid",
                content: {
                    items: ministries.map((ministry) => ({
                        title: ministry.title,
                        description: ministry.description,
                        eyebrow: ministry.eyebrow,
                        media: imageMedia(ministry.image),
                    })),
                },
            },
            {
                id: "visit-banner",
                type: "cta-banner",
                variant: "card",
                content: {
                    title: "The front door is still Sunday.",
                    body: "Every ministry is easier to join once you've been in the room — come this week and we'll point you to the right person.",
                    cta: { label: "Plan a visit", href: `${basePath}/visit` },
                },
            },
        ],
    }
}

export function sermonsLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.church },
        shell: churchShell(basePath, "/sermons"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: sermonsPage.headline,
                    accent: "none",
                    subheadline: sermonsPage.body,
                },
            },
            {
                id: "archive",
                type: "showcase",
                // The archive as a printed index: passage in the eyebrow,
                // date in the meta slot, series as the filter chips.
                variant: "filterable-grid",
                content: {
                    allLabel: "All series",
                    items: sermons.map((sermon) => ({
                        title: sermon.title,
                        description: sermon.summary,
                        eyebrow: sermon.passage,
                        meta: sermonDate(sermon.date),
                        tags: [sermon.series, sermon.speaker],
                    })),
                },
            },
            {
                id: "visit-banner",
                type: "cta-banner",
                variant: "card",
                content: {
                    title: "The archive grows every Sunday.",
                    body: "Hear the next one in the room it was written for.",
                    cta: { label: "Plan a visit", href: `${basePath}/visit` },
                },
            },
        ],
    }
}

export function eventsLanding(
    basePath: string,
    now: Date,
    calendarEvents: ChurchEvent[] = events,
): LandingConfig {
    const split = calendar(now, calendarEvents)
    return {
        style: { preset: PACK_REGISTERS.church },
        shell: churchShell(basePath, "/events"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    ...(split.nextUp !== undefined ? { badge: `Next up — ${split.nextUp.title}` } : {}),
                    headline: eventsPage.headline,
                    accent: "none",
                    subheadline: eventsPage.body,
                },
            },
            {
                id: "upcoming",
                type: "showcase",
                variant: "card-grid",
                content: {
                    kicker: "Upcoming",
                    title: "What's ahead",
                    items: split.upcoming.map((event) => eventItem(event, split.nextUp?.slug)),
                },
            },
            {
                id: "past",
                type: "showcase",
                variant: "card-grid",
                content: {
                    kicker: "Past",
                    title: "What the year has held",
                    // The archive stays text-only and quiet: date lines and
                    // descriptions, no covers, most recent first.
                    items: split.past.map((event) => ({
                        title: event.title,
                        description: event.description,
                        eyebrow: formatEventDay(event.start),
                        meta: event.location,
                    })),
                },
            },
            {
                id: "give-banner",
                type: "cta-banner",
                // Same loud ask as home: the full-bleed amber band.
                variant: "full-bleed",
                content: {
                    title: give.headline,
                    body: give.body,
                    cta: { label: give.cta, href: church.giveUrl },
                },
            },
        ],
    }
}
