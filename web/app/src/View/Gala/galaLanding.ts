import type { LandingConfig, MarketingShellConfig } from "@ui"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import {
    after,
    details,
    event,
    landingCopy,
    program,
    rsvp,
    toastImage,
    venue,
    type SiteImage,
} from "./content"
import { countdownLabel, rsvpNudge } from "./countdown"
import { galaShell } from "./galaShell"

/**
 * The gala pack's pages as landing-kernel configs (docs/landing.md).
 * `content.ts` stays the single owner-editable source; these builders only
 * map it into sections.
 *
 * Every builder takes `basePath`: "" when the pack owns the site and
 * "/gala" on the preview route — same pages, both wirings. Both builders
 * also take `now`: the configs are rebuilt per render so the hero
 * countdown and the reply-by nudge stay computed from the clock (the
 * clock engine, `countdown.ts` — the estate listings engine's idiom).
 *
 * Every section carries a stable `id`: GalaPage pipes these configs
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

// The shared chrome lives in galaShell.ts (manifest pages wear it too);
// this alias keeps the page builders reading naturally.
function shell(basePath: string, currentPath: "" | "/rsvp"): MarketingShellConfig {
    return galaShell(basePath, currentPath)
}

export function homeLanding(basePath: string, now: Date): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.gala },
        shell: shell(basePath, ""),
        sections: [
            {
                id: "hero",
                type: "hero",
                // The room IS the invitation: masthead type over the
                // ballroom photograph, with the live countdown as the
                // badge — must match the catalog's landing seed byte for
                // byte.
                variant: "masthead-overlay",
                content: {
                    badge: countdownLabel(event.dateIso, now),
                    headline: event.title,
                    subheadline: event.subtitle,
                    primaryCta: { label: landingCopy.rsvpCtaLabel, href: `${basePath}/rsvp` },
                    media: imageMedia(event.heroImage),
                },
            },
            {
                id: "invitation",
                type: "rich-prose",
                // The card itself, set narrow: who, when, where — the
                // engraved lines a guest photographs for their calendar.
                variant: "narrow",
                content: {
                    kicker: `${event.host} request the pleasure of your company`,
                    title: `${event.dateLabel} · ${event.timeLabel}`,
                    paragraphs: [`${venue.name}, ${venue.role.toLowerCase()} — ${venue.address}.`],
                },
            },
            {
                id: "program",
                type: "steps",
                variant: "timeline",
                content: {
                    kicker: "The program",
                    title: program.headline,
                    steps: program.items.map((item) => ({
                        title: `${item.time} — ${item.title}`,
                        description: item.description,
                    })),
                },
            },
            {
                id: "toast",
                type: "gallery",
                // One tall detail photograph as a full-width beat between
                // the program and the fine print — the champagne tower,
                // mid-pour.
                variant: "sequence",
                content: {
                    items: [{ media: imageMedia(toastImage) }],
                },
            },
            {
                id: "details",
                type: "feature-grid",
                variant: "icon-list",
                content: {
                    kicker: "Details",
                    title: details.headline,
                    features: details.items.map((item) => ({
                        title: item.title,
                        description: item.body,
                    })),
                },
            },
            {
                id: "venue",
                type: "highlights",
                variant: "alternating",
                content: {
                    kicker: "The room",
                    highlights: [
                        {
                            media: imageMedia(venue.image),
                            headline: venue.name,
                            body: `${venue.description}`,
                            cta: { label: "Get directions", href: venue.mapUrl },
                        },
                        {
                            media: imageMedia(after.image),
                            headline: after.title,
                            body: after.body,
                        },
                    ],
                },
            },
            {
                id: "rsvp-banner",
                type: "cta-banner",
                // The ticket variant: the ask reads as the stub a guest
                // hands the door.
                variant: "ticket",
                content: {
                    title: landingCopy.finalCtaTitle,
                    body: rsvpNudge(rsvp.replyByIso, rsvp.replyByLabel, now),
                    cta: { label: landingCopy.rsvpCtaLabel, href: `${basePath}/rsvp` },
                },
            },
        ],
    }
}

export function rsvpLanding(basePath: string, now: Date): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.gala },
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
                    cta: "Send the reply",
                    confirmation: rsvp.confirmation,
                    fields: rsvp.fields,
                    // Questions trail the form; the email stays plain text
                    // (selectable for whatever mail client the guest uses).
                    channels: [{ label: "Questions", value: event.email }],
                },
            },
            {
                id: "faq",
                type: "faq",
                variant: "accordion",
                content: {
                    kicker: "Asked and answered",
                    title: "Before you ask",
                    items: rsvp.faqs,
                },
            },
        ],
    }
}
