import type { LandingConfig, MarketingShowcaseItem } from "@ui"
import { formatEventDay, formatEventMoment, splitEvents, type EventSplit } from "../Landing/events"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import { communityShell } from "./communityShell"
import {
    about,
    assoc,
    board,
    events,
    eventsPage,
    home,
    joinCta,
    membership,
    programs,
    stats,
    type CommunityEvent,
    type CommunityImage,
} from "./content"

/**
 * The community pack's pages as landing-kernel configs (docs/landing.md)
 * in the atelier register: gallery-white walls, uppercase tracked type,
 * hairline rules, zero radius, and a near-ink accent — the neighborhood
 * newsletter set by a careful printer. Photography carries all the
 * warmth; the chrome stays paper. `content.ts` stays the single
 * owner-editable source; these builders only map it into sections.
 *
 * The calendar is computed per render from the passed `now` (pure logic
 * in ../Landing/events.ts): dated entries split into upcoming vs. past,
 * the soonest wearing the "Next up" badge, and the home hero naming the
 * next date on the calendar. A stale listing can't happen.
 *
 * Every builder takes `basePath`: "" when the pack owns the site and
 * "/community" on the preview route — same pages, both wirings. Every
 * section carries a stable `id`: CommunityPage pipes these configs
 * through the landing document's per-page merge (`useSitePageConfig`),
 * so the platform's structural editor can reorder / delete / add
 * sections. The pack's catalog maps the routes (`landing.routes`).
 */

const imageMedia = (image: CommunityImage) => ({
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
function eventItem(event: CommunityEvent, nextUpSlug: string | undefined): MarketingShowcaseItem {
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
 * (`useCommunityCalendar` in CommunityPage) and the builders split
 * whatever entries they are handed — an owner's Manage edit and the code
 * default walk the same path. They default to the code events, so callers
 * without a resolved document (pinned tests, the preview route) keep the
 * plain (basePath, now) signature.
 */
function calendar(now: Date, entries: CommunityEvent[]): EventSplit<CommunityEvent> {
    return splitEvents(entries, now)
}

/** The computed hero badge: the next date on the calendar, when there is one. */
function nextEventBadge(now: Date, entries: CommunityEvent[]): string | undefined {
    const next = calendar(now, entries).nextUp
    return next !== undefined ? `Next up — ${next.title} · ${formatEventDay(next.start)}` : undefined
}

export function homeLanding(
    basePath: string,
    now: Date,
    calendarEvents: CommunityEvent[] = events,
): LandingConfig {
    const badge = nextEventBadge(now, calendarEvents)
    const split = calendar(now, calendarEvents)
    return {
        style: { preset: PACK_REGISTERS.community },
        shell: communityShell(basePath, ""),
        sections: [
            {
                id: "hero",
                type: "hero",
                // The block party under the nameplate; the badge names the
                // next calendar date, computed from the events file.
                variant: "masthead-overlay",
                content: {
                    ...(badge !== undefined ? { badge } : {}),
                    headline: home.headline,
                    accent: "none",
                    subheadline: home.subheadline,
                    primaryCta: { label: "Become a member", href: `${basePath}/join` },
                    secondaryCta: { label: "See the calendar", href: `${basePath}/events` },
                    media: imageMedia(home.hero),
                },
            },
            {
                id: "ledger",
                type: "stats",
                // The nameplate's dateline: four figures in a hairline row.
                variant: "row",
                content: {
                    kicker: "The commons",
                    stats,
                },
            },
            {
                id: "programs",
                type: "showcase",
                variant: "card-grid",
                content: {
                    kicker: "What we run",
                    title: "The commons, in four standing programs",
                    items: programs.map((program) => ({
                        title: program.title,
                        description: program.description,
                        eyebrow: program.eyebrow,
                        media: imageMedia(program.image),
                        url: `${basePath}/about`,
                    })),
                },
            },
            {
                id: "calendar",
                type: "showcase",
                variant: "card-grid",
                content: {
                    kicker: "Upcoming",
                    title: "Next on the calendar",
                    // Text-only and quiet — the newsletter's listings
                    // column. The full calendar lives on /events.
                    items: split.upcoming.slice(0, 3).map((event) => ({
                        title: event.title,
                        description: event.description,
                        eyebrow: formatEventMoment(event.start),
                        meta: event.location,
                        url: `${basePath}/events`,
                    })),
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
                id: "join-banner",
                type: "cta-banner",
                variant: "card",
                content: {
                    title: joinCta.title,
                    body: joinCta.body,
                    cta: { label: joinCta.cta, href: `${basePath}/join` },
                },
            },
        ],
    }
}

export function eventsLanding(
    basePath: string,
    now: Date,
    calendarEvents: CommunityEvent[] = events,
): LandingConfig {
    const split = calendar(now, calendarEvents)
    return {
        style: { preset: PACK_REGISTERS.community },
        shell: communityShell(basePath, "/events"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    ...(split.nextUp !== undefined
                        ? { badge: `Next up — ${formatEventDay(split.nextUp.start)}` }
                        : {}),
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
                    title: "On the calendar",
                    items: split.upcoming.map((event) => eventItem(event, split.nextUp?.slug)),
                },
            },
            {
                id: "past",
                type: "showcase",
                variant: "card-grid",
                content: {
                    kicker: "The scrapbook",
                    title: "What the neighborhood already did",
                    // Text-only and quiet: the archive reads like minutes.
                    items: split.past.map((event) => ({
                        title: event.title,
                        description: event.description,
                        eyebrow: formatEventDay(event.start),
                        meta: event.location,
                    })),
                },
            },
            {
                id: "join-banner",
                type: "cta-banner",
                variant: "card",
                content: {
                    title: joinCta.title,
                    body: joinCta.body,
                    cta: { label: joinCta.cta, href: `${basePath}/join` },
                },
            },
        ],
    }
}

export function joinLanding(
    basePath: string,
    now: Date,
    calendarEvents: CommunityEvent[] = events,
): LandingConfig {
    const split = calendar(now, calendarEvents)
    return {
        style: { preset: PACK_REGISTERS.community },
        shell: communityShell(basePath, "/join"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    ...(split.nextUp !== undefined
                        ? { badge: `Next chance to show up — ${formatEventDay(split.nextUp.start)}` }
                        : {}),
                    headline: membership.headline,
                    accent: "none",
                    subheadline: membership.body,
                },
            },
            {
                id: "dues",
                type: "pricing",
                // Annual dues as a flat rate card row: period "/yr" and
                // monthly === yearlyPerMonth so no billing toggle renders.
                variant: "tiers",
                content: {
                    kicker: "Dues",
                    title: "Three ways in",
                    period: "/yr",
                    tiers: membership.tiers.map((tier, index) => ({
                        name: tier.name,
                        monthly: tier.price,
                        yearlyPerMonth: tier.price,
                        description: tier.description,
                        features: tier.features,
                        ...(index === 0 ? { highlighted: true, badge: "Most of the commons" } : {}),
                    })),
                },
            },
            {
                id: "how",
                type: "steps",
                variant: "timeline",
                content: {
                    kicker: "How it works",
                    title: "Form, card, show up",
                    steps: membership.steps,
                },
            },
            {
                id: "signup",
                type: "lead-form",
                variant: "detail-form",
                content: {
                    kicker: "Join",
                    title: "Put your household on the roll",
                    body: "The form reaches the membership chair — a neighbor, not a mailing list. Dues are collected with your welcome packet, cash or check like it's 1974.",
                    cta: "Send it in",
                    confirmation: membership.confirmation,
                    fields: membership.fields,
                    channels: [
                        { label: "Email", value: assoc.email },
                        { label: "In person", value: assoc.meetingLine },
                    ],
                },
            },
        ],
    }
}

export function aboutLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.community },
        shell: communityShell(basePath, "/about"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: about.headline,
                    accent: "none",
                    subheadline: about.body,
                },
            },
            {
                id: "history",
                type: "content-split",
                variant: "media-right",
                content: {
                    kicker: about.history.kicker,
                    headline: about.history.headline,
                    body: about.history.body,
                    media: imageMedia(about.history.image),
                },
            },
            {
                id: "meetings",
                type: "content-split",
                variant: "media-left",
                content: {
                    kicker: about.meetings.kicker,
                    headline: about.meetings.headline,
                    body: about.meetings.body,
                    media: imageMedia(about.meetings.image),
                    cta: { label: "See the calendar", href: `${basePath}/events` },
                },
            },
            {
                id: "board",
                type: "team",
                // The board as a narrow ledger of rows — names, roles, and
                // a line each, with seeded marks instead of headshots (a
                // volunteer board photographs like a potluck, not a firm).
                variant: "list",
                content: {
                    kicker: "The board",
                    title: "Six neighbors, elected every November",
                    members: board.map((member) => ({
                        name: member.name,
                        role: member.role,
                        bio: member.bio,
                        media: { kind: "glyph" as const, seed: member.name },
                    })),
                },
            },
            {
                id: "join-banner",
                type: "cta-banner",
                variant: "card",
                content: {
                    title: joinCta.title,
                    body: joinCta.body,
                    cta: { label: joinCta.cta, href: `${basePath}/join` },
                },
            },
        ],
    }
}
