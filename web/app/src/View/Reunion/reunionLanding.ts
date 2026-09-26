import type { LandingConfig, LandingSection, MarketingShellConfig } from "@ui"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import {
    activities,
    branches,
    gettingThere,
    home,
    landingCopy,
    lodging,
    memories,
    packing,
    reunion,
    rsvp,
    weekend,
    type SiteImage,
} from "./content"
import { countdownLabel, rsvpNudge } from "./countdown"
import { reunionShell } from "./reunionShell"

/**
 * The reunion pack's pages as landing-kernel configs (docs/landing.md).
 * `content.ts` stays the single owner-editable source; these builders only
 * map it into sections.
 *
 * Every builder takes `basePath`: "" when the pack owns the site (links
 * are /memories, /rsvp) and "/reunion" on the preview route — same pages,
 * both wirings. The home and rsvp builders also take `now`: their configs
 * are rebuilt per render so the hero countdown and the head-count nudge
 * stay computed from the clock (the clock engine, `countdown.ts` — the
 * estate listings engine's idiom).
 *
 * Every section carries a stable `id`: ReunionPage pipes these configs
 * through the landing document's per-page merge (`useSitePageConfig`), so
 * the platform's structural editor can reorder / delete / add sections on
 * these pages and the ids are what the document's skeleton binds to. The
 * pack's catalog maps the routes (`landing.routes` in catalog.json).
 *
 * The builders decide by content, so each seed reproduces its own
 * skeleton: `home.layout` picks the home composition (`lawn`: the masthead
 * over the long table, the note, the weekend as numbered cards, the
 * activities; `poster`: the split rodeo bill, the day-stamped strip of
 * stops, the note — and the ticket banner and accented page headlines on
 * every page), and the content-driven sections (the full schedule,
 * lodging, the branches, getting there, the pack list) render only once
 * filled.
 *
 * The home page's section types are all distinct on purpose: a section's
 * type is its anchor id, so nav links can land on `#schedule` and
 * `#content-split`.
 */

const imageMedia = (image: SiteImage) => ({
    kind: "image" as const,
    src: image.src,
    alt: image.alt,
    width: image.width,
    height: image.height,
    srcSet: image.srcSet,
})

// The shared chrome lives in reunionShell.ts (manifest pages wear it too);
// this alias keeps the page builders reading naturally.
function shell(basePath: string, currentPath: "" | "/memories" | "/rsvp"): MarketingShellConfig {
    return reunionShell(basePath, currentPath)
}

/** The poster layout: the rodeo bill, its ticket banners, its accented headlines. */
const poster = home.layout === "poster"

/** A "/#section" path lands on the home page's section, under the preview prefix too. */
function sitePath(basePath: string, path: string): string {
    if (path.startsWith("/#")) {
        return `${basePath === "" ? "/" : basePath}${path.slice(1)}`
    }
    return `${basePath}${path}`
}

/** The closing ask every page ends on: the head count (on an admission ticket, on the poster). */
const rsvpBanner = (basePath: string, body?: string): LandingSection => ({
    id: "rsvp-banner",
    type: "cta-banner" as const,
    ...(poster ? { variant: "ticket" as const } : {}),
    content: {
        title: landingCopy.finalCtaTitle,
        ...(body !== undefined ? { body } : {}),
        cta: { label: landingCopy.rsvpCtaLabel, href: `${basePath}/rsvp` },
    },
})

function homeHero(basePath: string, now: Date): LandingSection {
    const secondaryCta = {
        label: landingCopy.heroSecondaryCta.label,
        href: sitePath(basePath, landingCopy.heroSecondaryCta.path),
    }
    if (poster) {
        return {
            id: "hero",
            type: "hero",
            // The rodeo bill: the family on horseback edge to edge, the
            // wood-type shout beside it with its last line in the accent,
            // the ribbon, and the dates on a seal — must match the
            // catalog's landing seed byte for byte.
            variant: "split-media",
            content: {
                badge: countdownLabel(reunion.startDateIso, now),
                headline: reunion.title,
                accent: "last-line",
                subheadline: reunion.subtitle,
                primaryCta: { label: landingCopy.rsvpCtaLabel, href: `${basePath}/rsvp` },
                secondaryCta,
                credit: reunion.ribbon,
                seal: reunion.seal,
                media: imageMedia(reunion.heroImage),
            },
        }
    }
    return {
        id: "hero",
        type: "hero",
        // The table IS the pitch: masthead type over the long-table
        // photograph, with the live countdown as the badge — must match
        // the catalog's landing seed byte for byte.
        variant: "masthead-overlay",
        content: {
            badge: countdownLabel(reunion.startDateIso, now),
            headline: reunion.title,
            subheadline: `${reunion.subtitle} ${reunion.datesLabel} · ${reunion.venueShort}.`,
            primaryCta: { label: landingCopy.rsvpCtaLabel, href: `${basePath}/rsvp` },
            secondaryCta,
            media: imageMedia(reunion.heroImage),
        },
    }
}

/** The organizers' note, in the family voice — the party flyer's opening paragraph. */
const welcome: LandingSection = {
    id: "welcome",
    type: "rich-prose",
    variant: "narrow",
    content: {
        kicker: `A note from ${reunion.organizers}`,
        title: home.welcomeTitle,
        paragraphs: [home.welcomeBody],
    },
}

/** The poster's bottom strip: the activities as stops, each a photograph stamped with its day. */
const stops: LandingSection = {
    id: "weekend",
    type: "steps",
    variant: "horizontal-rail",
    content: {
        kicker: `${reunion.datesLabel} · ${reunion.venueShort}`,
        title: activities.headline,
        steps: activities.items.map((item) => ({
            label: item.when,
            title: item.title,
            description: item.body,
            media: imageMedia(item.image),
        })),
    },
}

/** The weekend at a glance: numbered cards, like games laid out on the lawn. */
const weekendCards: LandingSection = {
    id: "weekend",
    type: "steps",
    variant: "numbered-cards",
    content: {
        kicker: "The weekend",
        title: weekend.headline,
        steps: weekend.days.map((day) => ({
            title: `${day.label} — ${day.title}`,
            description: day.description,
        })),
    },
}

const activityCards: LandingSection = {
    id: "activities",
    type: "card-grid",
    variant: "3up",
    content: {
        kicker: "The program, such as it is",
        title: activities.headline,
        cards: activities.items.map((item) => ({
            media: imageMedia(item.image),
            title: item.title,
            body: item.body,
        })),
    },
}

/** The full schedule, once any day carries its program. */
function scheduleSections(): LandingSection[] {
    const sections: LandingSection[] = []
    if (weekend.days.some((day) => day.items.length > 0)) {
        sections.push({
            id: "schedule",
            type: "schedule",
            // The full program, one row per day.
            variant: "day-rows",
            content: {
                kicker: "The schedule",
                title: weekend.headline,
                intro: weekend.intro,
                days: weekend.days.map((day) => ({
                    label: day.label,
                    sessions: day.items.map((item) => ({
                        time: item.time,
                        title: item.title,
                        ...(item.detail !== undefined ? { detail: item.detail } : {}),
                    })),
                })),
            },
        })
    }
    return sections
}

/** Where everyone sleeps, the branches, the way there, and the pack list — each only once filled. */
function practicalSections(): LandingSection[] {
    const sections: LandingSection[] = []
    if (lodging.rooms.length > 0 && lodging.image !== null) {
        sections.push({
            id: "lodging",
            type: "content-split",
            variant: "media-right",
            content: {
                kicker: "Lodging",
                headline: lodging.headline,
                body: lodging.body,
                bullets: lodging.rooms.map((room) => `${room.branch} — ${room.where}`),
                media: imageMedia(lodging.image),
            },
        })
    }
    if (branches.items.length > 0) {
        sections.push({
            id: "branches",
            type: "stats",
            // The family tree as a head count, branch by branch.
            variant: "cards",
            content: {
                kicker: "The family branches",
                title: branches.headline,
                stats: branches.items.map((branch) => ({
                    value: branch.count,
                    label: branch.name,
                    description: branch.home,
                })),
            },
        })
    }
    if (gettingThere.steps.length > 0) {
        sections.push({
            id: "getting-there",
            type: "card-grid",
            variant: "3up",
            content: {
                kicker: "Getting there",
                title: gettingThere.headline,
                cards: gettingThere.steps.map((step) => ({ title: step.title, body: step.body })),
            },
        })
    }
    if (packing.items.length > 0 && packing.image !== null) {
        sections.push({
            id: "pack",
            type: "feature-grid",
            // The pack list tacked up beside the cookout.
            variant: "checklist",
            content: {
                kicker: "What to pack",
                title: packing.headline,
                cardTitle: packing.cardTitle,
                body: packing.body,
                media: imageMedia(packing.image),
                features: packing.items.map((item) => ({ title: item.title, description: item.note })),
            },
        })
    }
    return sections
}

export function homeLanding(basePath: string, now: Date): LandingConfig {
    const opening = poster
        ? [homeHero(basePath, now), stops, welcome, ...scheduleSections()]
        : [homeHero(basePath, now), welcome, weekendCards, ...scheduleSections(), activityCards]
    return {
        style: { preset: PACK_REGISTERS.reunion },
        shell: shell(basePath, ""),
        sections: [
            ...opening,
            ...practicalSections(),
            {
                id: "memories",
                type: "gallery",
                // The scrapbook: tilted like snapshots passed around the
                // table.
                variant: "scrapbook",
                content: {
                    kicker: landingCopy.memoriesKicker,
                    title: landingCopy.memoriesTeaserTitle,
                    items: memories.photos.map((entry) => ({
                        media: imageMedia(entry.image),
                        caption: entry.caption,
                    })),
                    lightbox: true,
                },
            },
            rsvpBanner(basePath, rsvpNudge(rsvp.replyByIso, rsvp.replyByLabel, now)),
        ],
    }
}

export function memoriesLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.reunion },
        shell: shell(basePath, "/memories"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: memories.headline,
                    ...(poster ? { accent: "last-word" as const } : {}),
                    subheadline: memories.intro,
                },
            },
            {
                id: "wall",
                type: "gallery",
                variant: "scrapbook",
                content: {
                    kicker: "The wall",
                    items: memories.photos.map((entry) => ({
                        media: imageMedia(entry.image),
                        caption: entry.caption,
                    })),
                    lightbox: true,
                    fullBleed: true,
                },
            },
            {
                id: "share",
                type: "rich-prose",
                variant: "narrow",
                content: {
                    kicker: "Add yours",
                    title: landingCopy.shareTitle,
                    paragraphs: [memories.shareNote],
                },
            },
            rsvpBanner(basePath),
        ],
    }
}

export function rsvpLanding(basePath: string, now: Date): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.reunion },
        shell: shell(basePath, "/rsvp"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: rsvp.headline,
                    ...(poster ? { accent: "last-word" as const } : {}),
                    // The nudge recomputes per render: a live number fills
                    // the table better than a printed deadline.
                    subheadline: rsvpNudge(rsvp.replyByIso, rsvp.replyByLabel, now),
                },
            },
            {
                id: "rsvp-form",
                type: "lead-form",
                variant: "detail-form",
                content: {
                    kicker: "Head count",
                    title: "One reply per household",
                    body: rsvp.body,
                    cta: landingCopy.rsvpFormCta,
                    confirmation: rsvp.confirmation,
                    fields: rsvp.fields,
                    // Questions trail the form; the email stays plain text
                    // (selectable for whatever mail client the cousin uses).
                    channels: [{ label: "Questions", value: reunion.email }],
                },
            },
            {
                id: "faq",
                type: "faq",
                variant: "accordion",
                content: {
                    kicker: "The usual questions",
                    title: landingCopy.faqTitle,
                    items: rsvp.faqs,
                },
            },
        ],
    }
}
