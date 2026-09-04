import type { LandingConfig, MarketingShellConfig } from "@ui"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import {
    couple,
    home,
    landingCopy,
    party,
    registry,
    rsvp,
    schedule,
    story,
    travel,
    type SiteImage,
} from "./content"
import { countdownLabel, rsvpNudge } from "./countdown"
import { vowsShell } from "./vowsShell"

/**
 * The vows pack's pages as landing-kernel configs (docs/landing.md).
 * `content.ts` stays the single owner-editable source; these builders only
 * map it into sections.
 *
 * Every builder takes `basePath`: "" when the pack owns the site (links
 * are /story, /schedule, /rsvp, …) and "/vows" on the preview route —
 * same pages, both wirings. The home and rsvp builders also take `now`:
 * their configs are rebuilt per render so the hero countdown and the
 * reply-by nudge stay computed from the clock (the clock engine,
 * `countdown.ts` — the estate listings engine's idiom).
 *
 * Every section carries a stable `id`: VowsPage pipes these configs
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

// The shared chrome lives in vowsShell.ts (manifest pages wear it too);
// this alias keeps the page builders reading naturally.
function shell(
    basePath: string,
    currentPath: "" | "/story" | "/schedule" | "/travel" | "/party" | "/rsvp",
): MarketingShellConfig {
    return vowsShell(basePath, currentPath)
}

/** The closing ask every page ends on: the reply card. */
const rsvpBanner = (basePath: string, body?: string) => ({
    id: "rsvp-banner",
    type: "cta-banner" as const,
    content: {
        title: landingCopy.finalCtaTitle,
        ...(body !== undefined ? { body } : {}),
        cta: { label: landingCopy.rsvpCtaLabel, href: `${basePath}/rsvp` },
    },
})

/** A weekend day as one timeline step — the home page's at-a-glance read. */
const dayStep = (day: (typeof schedule.days)[number]) => ({
    title: day.label,
    description: day.events.map((event) => `${event.time} — ${event.title.split(" at ")[0]}`).join(" · "),
})

export function homeLanding(basePath: string, now: Date): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.vows },
        shell: shell(basePath, ""),
        sections: [
            {
                id: "hero",
                type: "hero",
                // The day IS the pitch: masthead type over the engagement
                // photograph, with the live countdown as the badge — must
                // match the catalog's landing seed byte for byte.
                variant: "masthead-overlay",
                content: {
                    badge: countdownLabel(couple.weddingDateIso, now),
                    headline: home.headline,
                    subheadline: home.subheadline,
                    primaryCta: { label: landingCopy.rsvpCtaLabel, href: `${basePath}/rsvp` },
                    secondaryCta: { label: "See the weekend", href: `${basePath}/schedule` },
                    media: imageMedia(home.heroImage),
                },
            },
            {
                id: "welcome",
                type: "rich-prose",
                // The couple's note, set narrow like the inside of the
                // invitation — the stationery register's opening move.
                variant: "narrow",
                content: {
                    kicker: couple.hashtag,
                    title: home.welcomeTitle,
                    paragraphs: [home.welcomeBody],
                },
            },
            {
                id: "weekend",
                type: "steps",
                variant: "timeline",
                content: {
                    kicker: "The weekend",
                    title: landingCopy.scheduleHeading,
                    steps: schedule.days.map(dayStep),
                },
            },
            {
                id: "venues",
                type: "showcase",
                variant: "collections",
                content: {
                    kicker: "The place",
                    title: landingCopy.venuesHeading,
                    items: schedule.venues.map((venue) => ({
                        title: venue.name,
                        description: venue.role,
                        media: imageMedia(venue.image),
                        url: `${basePath}/schedule`,
                    })),
                },
            },
            {
                id: "gallery",
                type: "gallery",
                variant: "masonry",
                content: {
                    kicker: "The two of us",
                    title: story.galleryTitle,
                    items: story.gallery.map((image) => ({ media: imageMedia(image) })),
                    lightbox: true,
                },
            },
            rsvpBanner(basePath, rsvpNudge(rsvp.replyByIso, rsvp.replyByLabel, now)),
        ],
    }
}

export function storyLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.vows },
        shell: shell(basePath, "/story"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: story.headline,
                    subheadline: story.intro,
                },
            },
            {
                id: "chapters",
                type: "highlights",
                variant: "alternating",
                content: {
                    kicker: "Our story",
                    highlights: story.chapters.map((chapter) => ({
                        media: imageMedia(chapter.image),
                        headline: chapter.title,
                        body: chapter.body,
                    })),
                },
            },
            {
                id: "gallery",
                type: "gallery",
                variant: "sequence",
                content: {
                    kicker: "The two of us",
                    title: story.galleryTitle,
                    items: story.gallery.map((image) => ({ media: imageMedia(image) })),
                    lightbox: true,
                },
            },
            rsvpBanner(basePath),
        ],
    }
}

export function scheduleLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.vows },
        shell: shell(basePath, "/schedule"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: schedule.headline,
                    subheadline: schedule.intro,
                },
            },
            // One timeline per day, each under its own date heading — the
            // ids are stable so the structural editor can trim a day.
            ...schedule.days.map((day, index) => ({
                id: `day-${index + 1}`,
                type: "steps" as const,
                variant: "timeline" as const,
                content: {
                    kicker: day.label,
                    steps: day.events.map((event) => ({
                        title: `${event.time} — ${event.title}`,
                        description: event.description,
                    })),
                },
            })),
            {
                id: "venues",
                type: "highlights",
                variant: "alternating",
                content: {
                    kicker: "The place",
                    title: landingCopy.venuesHeading,
                    highlights: schedule.venues.map((venue) => ({
                        media: imageMedia(venue.image),
                        headline: venue.name,
                        body: `${venue.role} · ${venue.address}. ${venue.description}`,
                        cta: { label: "Get directions", href: venue.mapUrl },
                    })),
                },
            },
            rsvpBanner(basePath),
        ],
    }
}

export function travelLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.vows },
        shell: shell(basePath, "/travel"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: travel.headline,
                    subheadline: travel.intro,
                },
            },
            {
                id: "getting-there",
                type: "rich-prose",
                variant: "narrow",
                content: {
                    kicker: "Getting there",
                    title: "Trains are the pretty way up.",
                    paragraphs: travel.gettingThere,
                },
            },
            {
                id: "hotels",
                type: "card-grid",
                variant: "3up",
                content: {
                    kicker: "Room blocks",
                    title: "Where to stay",
                    cards: travel.hotels.map((hotel) => ({
                        title: hotel.name,
                        body: [hotel.description, hotel.distance, hotel.blockNote]
                            .filter((line): line is string => line !== undefined)
                            .join(" · "),
                        cta: { label: "Book a room", href: hotel.url },
                    })),
                },
            },
            {
                id: "things-to-do",
                type: "feature-grid",
                variant: "icon-list",
                content: {
                    kicker: "Make a weekend of it",
                    title: "While you're here",
                    features: travel.thingsToDo.map((thing) => ({
                        title: thing.title,
                        description: thing.body,
                    })),
                },
            },
            rsvpBanner(basePath),
        ],
    }
}

export function partyLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.vows },
        shell: shell(basePath, "/party"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: party.headline,
                    subheadline: party.intro,
                },
            },
            {
                id: "party",
                type: "team",
                // The list variant reads as the invitation's inner leaf:
                // names, roles, and one good line each — no headshot grid
                // to source before the site can ship.
                variant: "list",
                content: {
                    kicker: "The wedding party",
                    members: party.members.map((member) => ({
                        name: member.name,
                        role: member.role,
                        bio: member.bio,
                    })),
                },
            },
            {
                id: "registry",
                type: "card-grid",
                variant: "2up",
                content: {
                    kicker: "Registry",
                    title: registry.headline,
                    cards: registry.links.map((link) => ({
                        title: link.name,
                        body: link.description,
                        cta: { label: "Open the registry", href: link.url },
                    })),
                },
            },
            rsvpBanner(basePath, registry.intro),
        ],
    }
}

export function rsvpLanding(basePath: string, now: Date): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.vows },
        shell: shell(basePath, "/rsvp"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: rsvp.headline,
                    // The nudge recomputes per render: a live number
                    // converts better than a printed deadline.
                    subheadline: rsvpNudge(rsvp.replyByIso, rsvp.replyByLabel, now),
                },
            },
            {
                id: "rsvp-form",
                type: "lead-form",
                variant: "detail-form",
                content: {
                    kicker: "RSVP",
                    title: "The reply card",
                    body: rsvp.body,
                    cta: "Send our reply",
                    confirmation: rsvp.confirmation,
                    fields: rsvp.fields,
                    // Questions trail the form; the email stays plain text
                    // (the photography pack's reasoning: selectable for
                    // whatever mail client the guest uses).
                    channels: [{ label: "Questions", value: couple.email }],
                },
            },
            {
                id: "faq",
                type: "faq",
                variant: "accordion",
                content: {
                    kicker: "Good questions",
                    title: "Asked and answered",
                    items: rsvp.faqs,
                },
            },
        ],
    }
}
