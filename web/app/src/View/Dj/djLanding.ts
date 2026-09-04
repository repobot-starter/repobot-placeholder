import type { LandingConfig } from "@ui"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import { formatShowDate, splitShows, type ShowDate } from "../Music/schedule"
import { artist, booking, heroImages, home, mailingList, mixes, sets } from "./content"
import { djShell } from "./djShell"

/**
 * The dj pack's kernel pages (home and the booking form) as landing
 * configs. `content.ts` stays the single owner-editable source; these
 * builders map it into sections and compute the set-date mechanics per
 * render — the hero badge reads "Tonight — City" on show days and the
 * banner names the next confirmed set.
 *
 * The register is mono-utility worn ACHROMATIC: the style overrides pin
 * the accent to the register's own text/page inks, so the whole surface
 * is paper-on-ink in dark and ink-on-paper in light — the brutalist
 * grid-and-mono energy, no candy hue anywhere. The overrides ride the
 * catalog's landing seed too, so composed documents keep the discipline.
 */

/** Accent = ink: the achromatic override, shared by every dj surface. */
export const DJ_STYLE_OVERRIDES: Record<string, string> = {
    "--marketing-color-accent": "var(--marketing-color-text)",
    "--marketing-color-accentSoft": "color-mix(in srgb, var(--marketing-color-text) 14%, transparent)",
    "--marketing-color-onAccent": "var(--marketing-color-pageBg)",
}

/**
 * The builder takes the RESOLVED dates: the page resolves the
 * business-content contract over `content.ts` once (`useContentShows` in
 * DjPage) and the builder splits whatever sets it is handed — an owner's
 * Manage edit and the code default walk the same path. It defaults to the
 * code sets, so callers without a resolved document (pinned tests, the
 * preview route) keep the plain (basePath, now) signature.
 */
export function homeLanding(basePath: string, now: Date, tour: readonly ShowDate[] = sets): LandingConfig {
    const schedule = splitShows(tour, now)
    const next = schedule.next
    const nextDate = next !== null ? formatShowDate(next.date) : null
    return {
        style: { preset: PACK_REGISTERS.dj, overrides: DJ_STYLE_OVERRIDES },
        shell: djShell(basePath, ""),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    badge:
                        schedule.badge === "On tour"
                            ? nextDate !== null && next !== null
                                ? `Next set — ${next.city}, ${nextDate.month} ${nextDate.day}`
                                : "On the road"
                            : (schedule.badge ?? artist.location),
                    headline: artist.alias,
                    accent: "none",
                    subheadline: home.subheadline,
                    primaryCta: { label: "Dates", href: `${basePath}/dates` },
                    secondaryCta: { label: "Mixes", href: `${basePath}/mixes` },
                },
            },
            {
                id: "booth-frame",
                type: "gallery",
                variant: "sequence",
                content: {
                    items: [{ media: { kind: "image" as const, ...heroImages.booth } }],
                    fullBleed: true,
                },
            },
            {
                id: "mixes",
                type: "showcase",
                variant: "collections",
                content: {
                    kicker: artist.series,
                    items: mixes.map((mix) => ({
                        title: mix.title,
                        description: mix.notes,
                        eyebrow: `${artist.series.split(" ")[0]} ${mix.index}`,
                        meta: `${mix.bpm} BPM · ${mix.style}`,
                        media: { kind: "image" as const, ...mix.cover },
                        url: `${basePath}/mixes`,
                    })),
                },
            },
            {
                id: "profile",
                type: "content-split",
                variant: "media-left",
                content: {
                    kicker: home.about.kicker,
                    headline: home.about.title,
                    body: home.about.paragraphs.join(" "),
                    media: { kind: "image" as const, ...heroImages.portrait },
                    cta: { label: "Booking", href: `${basePath}/book` },
                },
            },
            {
                id: "next-set",
                type: "cta-banner",
                variant: "full-bleed",
                content: {
                    title:
                        next !== null && nextDate !== null
                            ? `Next: ${nextDate.month} ${nextDate.day} — ${next.venue}, ${next.city}`
                            : "Booking now for next season.",
                    cta:
                        next !== null
                            ? { label: "All dates", href: `${basePath}/dates` }
                            : { label: "Book", href: `${basePath}/book` },
                },
            },
            {
                id: "mailing-list",
                type: "lead-form",
                variant: "inline-email",
                content: {
                    kicker: mailingList.kicker,
                    title: mailingList.title,
                    body: mailingList.body,
                    cta: mailingList.cta,
                    confirmation: mailingList.confirmation,
                },
            },
        ],
    }
}

/** The booking page: a detail form whose fields carry the tech-rider ask. */
export function bookLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.dj, overrides: DJ_STYLE_OVERRIDES },
        shell: djShell(basePath, "/book"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: booking.headline,
                    accent: "none",
                    subheadline: booking.body,
                },
            },
            {
                id: "booking-form",
                type: "lead-form",
                variant: "detail-form",
                content: {
                    kicker: "Booking",
                    title: "The essentials",
                    cta: "Send inquiry",
                    confirmation: booking.confirmation,
                    fields: booking.fields,
                    channels: [
                        { label: "Booking", value: artist.email },
                        { label: "Base", value: artist.location },
                    ],
                },
            },
        ],
    }
}
