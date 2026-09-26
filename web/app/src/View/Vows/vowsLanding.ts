import type { LandingConfig, LandingSection, MarketingShellConfig } from "@ui"
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
 *
 * The builders decide by content, so each seed reproduces its own
 * skeleton: `home.layout` picks the composition (`classic`: the masthead,
 * the welcome note, the weekend, the venues, the engagement gallery, a
 * filmstrip on the story page, the party ahead of the registry; `zine`:
 * the invitation cover beside the photo wall, the story rail, the weekend,
 * hotels, registry and questions, the snapshots taped up with captions,
 * the registry leading the party page; `story`: the names over one
 * full-bleed photograph, the story as stacked photo chapters, the weekend
 * in three lines, and a one-line close with the RSVP link; `stack`: the
 * names over one full-bleed photograph, then the caption-band stack —
 * every frame one size, the story and the weekend on the bands — and the
 * same close; `letter`: no photographs on the home page at all — the
 * names set enormous, then the weekend, where to stay and the couple's
 * note as a ruled typographic column, and the close), and the booth
 * strips render only once filled. Chapter and venue photographs are
 * optional: a slot left empty renders its copy alone.
 */

/** The zine composition — see `home.layout`. */
const zine = home.layout === "zine"

const imageMedia = (image: SiteImage) => ({
    kind: "image" as const,
    src: image.src,
    alt: image.alt,
    width: image.width,
    height: image.height,
    srcSet: image.srcSet,
})

/** A slot's photograph as section media, or nothing when the slot is empty. */
const mediaOf = (image: SiteImage | undefined) => (image !== undefined ? { media: imageMedia(image) } : {})

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

/** The photo wall as hero snapshots: strips keep their frames, snapshots their print. */
const wallPiece = (piece: (typeof home.wall)[number]) => ({
    ...(piece.frames !== undefined ? { frames: piece.frames.map(imageMedia) } : {}),
    ...(piece.image !== undefined ? { media: imageMedia(piece.image) } : {}),
    ...(piece.sticker !== undefined ? { sticker: piece.sticker } : {}),
})

/** A snapshot as a gallery item, its caption only when it has one. */
const snapshotItem = (snapshot: (typeof story.gallery)[number]) => ({
    media: imageMedia(snapshot.image),
    ...(snapshot.caption !== "" ? { caption: snapshot.caption } : {}),
})

/** Every booth strip, uncut, as one gallery run: each strip's label and caption ride its first frame. */
const stripItems = () =>
    story.strips.flatMap((strip) =>
        strip.frames.map((frame, index) => ({
            media: imageMedia(frame),
            ...(index === 0 ? { note: strip.label, caption: strip.caption } : {}),
        })),
    )

/** A hotel as a card: the pitch, the distance, the block code. */
const hotelCard = (hotel: (typeof travel.hotels)[number]) => ({
    title: hotel.name,
    body: [hotel.description, hotel.distance, hotel.blockNote]
        .filter((line): line is string => line !== undefined)
        .join(" · "),
    cta: { label: "Book a room", href: hotel.url },
})

const registryCard = (link: (typeof registry.links)[number]) => ({
    title: link.name,
    body: link.description,
    cta: { label: "Open the registry", href: link.url },
})

/** The booth strips as one uncut run, once there are any. */
function stripsGallery(id: string): LandingSection[] {
    if (story.strips.length === 0) return []
    return [
        {
            id,
            type: "gallery",
            variant: "photo-strip",
            content: {
                kicker: "Photo booth",
                title: story.stripsTitle,
                items: stripItems(),
                lightbox: true,
            },
        },
    ]
}

/** The questions, kicker and title the couple's. */
const faqContent = (items: typeof rsvp.faqs) => ({
    kicker: landingCopy.faqKicker,
    title: landingCopy.faqTitle,
    items,
})

function classicHome(basePath: string, now: Date): LandingSection[] {
    return [
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
                secondaryCta: { label: home.detailsLink, href: `${basePath}/schedule` },
                ...mediaOf(home.heroImage),
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
                    ...mediaOf(venue.image),
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
                items: story.gallery.map(snapshotItem),
                lightbox: true,
            },
        },
    ]
}

function zineHome(basePath: string, now: Date): LandingSection[] {
    return [
        {
            id: "hero",
            type: "hero",
            // The zine's cover: marker lines beside the photo wall of
            // booth strips and flash snapshots, the live countdown as a
            // taped tag, the particulars typed on the strip under it —
            // must match the catalog's landing seed byte for byte.
            variant: "invitation",
            content: {
                badge: countdownLabel(couple.weddingDateIso, now),
                headline: home.headline,
                subheadline: home.subheadline,
                credit: home.details.join(" · "),
                primaryCta: { label: landingCopy.rsvpCtaLabel, href: `${basePath}/rsvp` },
                secondaryCta: { label: home.detailsLink, href: `${basePath}/schedule` },
                ...mediaOf(home.heroImage),
                snapshots: home.wall.map(wallPiece),
            },
        },
        {
            id: "story",
            type: "steps",
            // The story as a rail of snapshots, one year per stop.
            variant: "horizontal-rail",
            content: {
                kicker: "Our story",
                title: landingCopy.storyHeading,
                steps: story.chapters.map((chapter) => ({
                    label: chapter.year,
                    title: chapter.title,
                    description: chapter.body,
                    ...mediaOf(chapter.image),
                })),
            },
        },
        ...stripsGallery("gallery"),
        {
            id: "weekend",
            type: "steps",
            variant: "timeline",
            content: {
                kicker: couple.weddingDateLabel,
                title: landingCopy.scheduleHeading,
                steps: schedule.days.map(dayStep),
            },
        },
        {
            id: "hotels",
            type: "card-grid",
            variant: "3up",
            content: {
                kicker: "Travel",
                title: landingCopy.hotelsHeading,
                cards: travel.hotels.map(hotelCard),
            },
        },
        {
            id: "registry",
            type: "card-grid",
            variant: "2up",
            content: {
                kicker: "Registry",
                title: registry.headline,
                cards: registry.links.map(registryCard),
            },
        },
        { id: "faq", type: "faq", variant: "accordion", content: faqContent(rsvp.faqs.slice(0, 3)) },
    ]
}

/** The names over one full-bleed photograph, the countdown as the badge. */
function namesOverPhoto(now: Date): LandingSection {
    return {
        id: "hero",
        type: "hero",
        variant: "full-bleed-media",
        content: {
            badge: countdownLabel(couple.weddingDateIso, now),
            headline: home.headline,
            // The names are one line in one ink, never an accent word.
            accent: "none",
            subheadline: home.subheadline,
            ...mediaOf(home.heroImage),
        },
    }
}

/** The weekend as a few plain lines ("Friday — Welcome dinner at the lodge"). */
const weekendLines = (id: string, title?: string): LandingSection => ({
    id,
    type: "rich-prose",
    variant: "narrow",
    content: { ...(title !== undefined ? { title } : {}), paragraphs: home.weekend },
})

function storyHome(now: Date): LandingSection[] {
    return [
        namesOverPhoto(now),
        {
            id: "story",
            type: "highlights",
            // The story in chapters: each photograph above its short
            // paragraph, one narrow column down the page.
            variant: "stacked",
            content: {
                highlights: story.chapters.map((chapter) => ({
                    ...mediaOf(chapter.image),
                    headline: chapter.title,
                    body: chapter.body,
                })),
            },
        },
        weekendLines("weekend"),
    ]
}

function stackHome(now: Date): LandingSection[] {
    return [
        namesOverPhoto(now),
        {
            id: "stack",
            type: "gallery",
            // Every frame one size, the story and the weekend carried on
            // the caption bands between them.
            variant: "sequence",
            content: {
                items: home.stack.map((frame) => ({
                    media: imageMedia(frame.image),
                    caption: frame.caption,
                })),
                fullBleed: true,
                lightbox: true,
                captionStack: "band-center",
            },
        },
    ]
}

function letterHome(now: Date): LandingSection[] {
    return [
        {
            id: "hero",
            type: "hero",
            // No photograph: the names are the page.
            variant: "statement",
            content: {
                badge: countdownLabel(couple.weddingDateIso, now),
                headline: home.headline,
                accent: "none",
                subheadline: home.subheadline,
            },
        },
        weekendLines("weekend", landingCopy.scheduleHeading),
        {
            id: "stay",
            type: "rich-prose",
            variant: "narrow",
            content: {
                title: landingCopy.hotelsHeading,
                paragraphs: travel.hotels.map((hotel) => hotel.name),
            },
        },
        {
            id: "note",
            type: "rich-prose",
            variant: "narrow",
            content: { title: home.welcomeTitle, paragraphs: [home.welcomeBody] },
        },
    ]
}

/** The story, stack, and letter homes' close: one line, the nudge, the RSVP link. */
const closingLine = (basePath: string, now: Date): LandingSection => ({
    id: "closing",
    type: "cta-banner",
    variant: "colophon",
    content: {
        title: home.closing,
        body: rsvpNudge(rsvp.replyByIso, rsvp.replyByLabel, now),
        cta: { label: landingCopy.rsvpCtaLabel, href: `${basePath}/rsvp` },
        ...(home.layout === "letter" ? { align: "start" as const } : {}),
    },
})

export function homeLanding(basePath: string, now: Date): LandingConfig {
    if (home.layout === "story" || home.layout === "stack" || home.layout === "letter") {
        const sections =
            home.layout === "story"
                ? storyHome(now)
                : home.layout === "stack"
                  ? stackHome(now)
                  : letterHome(now)
        return {
            style: { preset: PACK_REGISTERS.vows },
            shell: shell(basePath, ""),
            sections: [...sections, closingLine(basePath, now)],
        }
    }
    return {
        style: { preset: PACK_REGISTERS.vows },
        shell: shell(basePath, ""),
        sections: [
            ...(zine ? zineHome(basePath, now) : classicHome(basePath, now)),
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
                        ...mediaOf(chapter.image),
                        headline: chapter.year !== "" ? `${chapter.year} — ${chapter.title}` : chapter.title,
                        body: chapter.body,
                    })),
                },
            },
            {
                id: "gallery",
                type: "gallery",
                // The zine tapes the disposable roll up crooked with its
                // captions; the other sites run the engagement session
                // as a filmstrip.
                variant: zine ? "scrapbook" : "sequence",
                content: {
                    kicker: zine ? "Flash on" : "The two of us",
                    title: story.galleryTitle,
                    items: story.gallery.map(snapshotItem),
                    lightbox: true,
                },
            },
            ...stripsGallery("strips"),
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
                        ...mediaOf(venue.image),
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
                    title: landingCopy.gettingThereTitle,
                    paragraphs: travel.gettingThere,
                },
            },
            {
                id: "hotels",
                type: "card-grid",
                variant: "3up",
                content: {
                    kicker: "Room blocks",
                    title: landingCopy.hotelsHeading,
                    cards: travel.hotels.map(hotelCard),
                },
            },
            {
                id: "things-to-do",
                type: "feature-grid",
                variant: "icon-list",
                content: {
                    kicker: "Make a weekend of it",
                    title: landingCopy.thingsToDoTitle,
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
    const registryCards: LandingSection = {
        id: "registry",
        type: "card-grid",
        variant: "2up",
        content: {
            kicker: "Registry",
            title: zine ? "If you insist" : registry.headline,
            cards: registry.links.map(registryCard),
        },
    }
    const crew: LandingSection = {
        id: "party",
        type: "team",
        // The list variant reads as the invitation's inner leaf (the
        // zine's credits page): names, roles, and one good line each — no
        // headshot grid to source before the site can ship.
        variant: "list",
        content: {
            kicker: zine ? "Wedding party" : "The wedding party",
            ...(zine ? { title: party.headline } : {}),
            members: party.members.map((member) => ({
                name: member.name,
                role: member.role,
                bio: member.bio,
            })),
        },
    }
    // The zine leads with the registry (its nav calls the page Registry);
    // the classic site with the people standing up.
    const lead = zine ? registry : party
    const close = zine ? party : registry
    return {
        style: { preset: PACK_REGISTERS.vows },
        shell: shell(basePath, "/party"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: lead.headline,
                    subheadline: lead.intro,
                },
            },
            ...(zine ? [registryCards, crew] : [crew, registryCards]),
            rsvpBanner(basePath, close.intro),
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
                    title: landingCopy.rsvpFormTitle,
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
                content: faqContent(rsvp.faqs),
            },
        ],
    }
}
