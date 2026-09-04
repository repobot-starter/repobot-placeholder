import type { LandingConfig, MarketingShellConfig } from "@ui"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import { activities, home, landingCopy, memories, reunion, rsvp, weekend, type SiteImage } from "./content"
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

/** The closing ask every page ends on: the head count. */
const rsvpBanner = (basePath: string, body?: string) => ({
    id: "rsvp-banner",
    type: "cta-banner" as const,
    content: {
        title: landingCopy.finalCtaTitle,
        ...(body !== undefined ? { body } : {}),
        cta: { label: landingCopy.rsvpCtaLabel, href: `${basePath}/rsvp` },
    },
})

export function homeLanding(basePath: string, now: Date): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.reunion },
        shell: shell(basePath, ""),
        sections: [
            {
                id: "hero",
                type: "hero",
                // The table IS the pitch: masthead type over the long-table
                // photograph, with the live countdown as the badge — must
                // match the catalog's landing seed byte for byte.
                variant: "masthead-overlay",
                content: {
                    badge: countdownLabel(reunion.startDateIso, now),
                    headline: reunion.title,
                    subheadline: `${reunion.subtitle} ${reunion.datesLabel} · ${reunion.venueShort}.`,
                    primaryCta: { label: landingCopy.rsvpCtaLabel, href: `${basePath}/rsvp` },
                    secondaryCta: { label: "See the memory wall", href: `${basePath}/memories` },
                    media: imageMedia(reunion.heroImage),
                },
            },
            {
                id: "welcome",
                type: "rich-prose",
                // The organizers' note, in the family voice — the party
                // flyer's opening paragraph.
                variant: "narrow",
                content: {
                    kicker: `A note from ${reunion.organizers}`,
                    title: home.welcomeTitle,
                    paragraphs: [home.welcomeBody],
                },
            },
            {
                id: "weekend",
                type: "steps",
                // Numbered cards, like games laid out on the lawn — the
                // picnic register's lean.
                variant: "numbered-cards",
                content: {
                    kicker: "The weekend",
                    title: weekend.headline,
                    steps: weekend.days.map((day) => ({
                        title: `${day.label} — ${day.title}`,
                        description: day.description,
                    })),
                },
            },
            {
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
            },
            {
                id: "memories",
                type: "gallery",
                // The scrapbook: tilted like snapshots passed around the
                // table (the picnic register's tilt treatment at work).
                variant: "scrapbook",
                content: {
                    kicker: "Forty years deep",
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
                    title: "The shoebox rule",
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
                    // The nudge recomputes per render: a live number rents
                    // tables better than a printed deadline.
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
                    cta: "Send the count",
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
                    title: "Yes, dogs are invited",
                    items: rsvp.faqs,
                },
            },
        ],
    }
}
