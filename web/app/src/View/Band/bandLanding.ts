import type { LandingConfig } from "@ui"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import { formatShowDate, splitShows, type ShowDate } from "../Music/schedule"
import { band, heroImages, home, mailingList, records, shows } from "./content"
import { bandShell } from "./bandShell"

/**
 * The band pack's home page as a landing-kernel config (docs/landing.md).
 * `content.ts` stays the single owner-editable source; this builder maps
 * it into sections and computes the tour-date mechanics per render (the
 * menu pack's live-badge pattern): the hero badge reads "Tonight — City"
 * on show days and "On tour" while dates remain, and the banner names the
 * next confirmed show — all from plain ISO dates in the content file.
 *
 * Bespoke surfaces (the audio players, the tour table, the press kit)
 * live on their own pages; home is pure kernel vocabulary so the
 * platform's structural editor owns it end to end. Section ids match the
 * catalog's landing seed.
 *
 * The builder takes the RESOLVED tour: the page resolves the
 * business-content contract over `content.ts` once (`useContentShows` in
 * BandPage) and the builder splits whatever dates it is handed — an
 * owner's Manage edit and the code default walk the same path. It
 * defaults to the code shows, so callers without a resolved document
 * (pinned tests, the preview route) keep the plain (basePath, now)
 * signature.
 */
export function homeLanding(basePath: string, now: Date, tour: readonly ShowDate[] = shows): LandingConfig {
    const schedule = splitShows(tour, now)
    const next = schedule.next
    const nextDate = next !== null ? formatShowDate(next.date) : null
    return {
        style: { preset: PACK_REGISTERS.band },
        shell: bandShell(basePath, ""),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    badge: schedule.badge ?? band.location,
                    headline: band.name,
                    accent: "none",
                    subheadline: home.subheadline,
                    primaryCta: { label: "Tour dates", href: `${basePath}/tour` },
                    secondaryCta: { label: "Listen", href: `${basePath}/music` },
                },
            },
            {
                id: "marquee-frame",
                type: "gallery",
                variant: "sequence",
                content: {
                    items: [{ media: { kind: "image" as const, ...heroImages.marquee } }],
                    fullBleed: true,
                },
            },
            {
                id: "records",
                type: "showcase",
                variant: "collections",
                content: {
                    kicker: "The records",
                    items: records.map((record) => ({
                        title: record.title,
                        description: record.notes,
                        eyebrow: `${record.format} · ${record.year}`,
                        meta: record.label,
                        media: { kind: "image" as const, ...record.cover },
                        url: `${basePath}/music`,
                    })),
                },
            },
            {
                id: "intro",
                type: "content-split",
                variant: "media-right",
                content: {
                    kicker: home.intro.kicker,
                    headline: home.intro.title,
                    body: home.intro.paragraphs.join(" "),
                    media: { kind: "image" as const, ...heroImages.portrait },
                    cta: { label: "The press kit", href: `${basePath}/press` },
                },
            },
            {
                id: "next-show",
                type: "cta-banner",
                variant: "full-bleed",
                content: {
                    title:
                        next !== null && nextDate !== null
                            ? `Next: ${nextDate.month} ${nextDate.day} — ${next.city}${next.region !== undefined ? `, ${next.region}` : ""} at ${next.venue}`
                            : "New dates soon. Get on the list.",
                    cta:
                        next !== null
                            ? { label: "All dates", href: `${basePath}/tour` }
                            : { label: "Mailing list", anchor: "lead-form" },
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
