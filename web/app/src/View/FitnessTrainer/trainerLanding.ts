import type { LandingConfig, MarketingShellConfig } from "@ui"
import { withDerivedSessionIds, type ScheduleSession } from "../Landing/contentDocument"
import { scheduleBadge, weekColumns } from "../Landing/schedule"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import {
    bio,
    consult,
    faq,
    gallery,
    home,
    process,
    programs,
    scheduleNote,
    stats,
    testimonials,
    trainer,
    trainingWeek,
    type TrainerImage,
} from "./content"
import { trainerShell } from "./trainerShell"

/**
 * The trainer pack's pages as landing-kernel configs (docs/landing.md).
 * `content.ts` stays the single owner-editable source and `schedule.ts`
 * keeps owning the live timetable logic — the builders take `now` where a
 * page shows the training week, so the day rows' today mark, the now/next
 * chips, and the hero badge stay current on every render (the menu pack's
 * open-badge discipline, applied to one coach's book — the badge noun is
 * "session", a trainer's unit).
 *
 * The monolith register is true black and white: monumental type with the
 * closing word stroke-only (the outline treatment rides the default
 * `last-word` accent), hairline rules, no color anywhere — the single
 * continuous photo shoot carries all the atmosphere.
 *
 * Every builder takes `basePath`: "" when the pack owns the site (links
 * are /programs, /apply) and "/trainer" on the preview route — same pages,
 * both wirings. Section `id`s are stable: TrainerPage pipes these configs
 * through the landing document's per-page merge (`useSitePageConfig`), and
 * the catalog's seeded skeletons bind to the ids.
 */

const imageMedia = (image: TrainerImage) => ({
    kind: "image" as const,
    src: image.src,
    alt: image.alt,
    width: image.width,
    height: image.height,
    srcSet: image.srcSet,
})

function shell(basePath: string, currentPath: string): MarketingShellConfig {
    return trainerShell(basePath, currentPath)
}

/** The live badge at `now`, in the trainer's own noun. */
function badge(now: Date, schedule: ScheduleSession[]): string {
    return scheduleBadge(schedule, now.getDay(), now.getHours() * 60 + now.getMinutes(), "session")
}

/** The training-week section: one coach's book reads as rows, not a wall grid. */
function weekSection(basePath: string, now: Date, schedule: ScheduleSession[]) {
    const day = now.getDay()
    const minute = now.getHours() * 60 + now.getMinutes()
    return {
        id: "week",
        type: "schedule" as const,
        variant: "day-rows" as const,
        content: {
            kicker: "The training week",
            title: "Where the hours go",
            badge: scheduleBadge(schedule, day, minute, "session"),
            days: weekColumns(schedule, day, minute),
            note: scheduleNote,
            cta: { label: "Book a free consult", href: `${basePath}/apply` },
        },
    }
}

/**
 * Schedule-bearing builders default to the code week lifted into contract
 * shape — the same fallback the content document's resolver uses — so
 * callers without a resolved document (pinned tests, the preview route)
 * keep the plain (basePath, now) signature. TrainerPage passes the
 * resolved schedule from useScheduleSessions.
 */
const codeWeek = (): ScheduleSession[] => withDerivedSessionIds(trainingWeek)

export function homeLanding(
    basePath: string,
    now: Date,
    schedule: ScheduleSession[] = codeWeek(),
): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS["fitness-trainer"] },
        shell: shell(basePath, ""),
        sections: [
            {
                id: "hero",
                type: "hero",
                // The photograph is the hero; the register's outline accent
                // strokes the closing word. Must match the catalog's landing
                // seed byte for byte.
                variant: "full-bleed-media",
                content: {
                    badge: badge(now, schedule),
                    headline: home.headline,
                    subheadline: home.subheadline,
                    primaryCta: { label: "Book a free consult", href: `${basePath}/apply` },
                    secondaryCta: { label: "See the programs", href: `${basePath}/programs` },
                    media: imageMedia(home.hero),
                },
            },
            {
                id: "proof",
                type: "stats",
                variant: "row",
                content: { stats },
            },
            {
                id: "coach",
                type: "content-split",
                variant: "media-left",
                content: {
                    kicker: bio.kicker,
                    headline: bio.headline,
                    body: bio.paragraphs.join(" "),
                    bullets: bio.credentials,
                    media: imageMedia(bio.portrait),
                    cta: { label: "Read the programs", href: `${basePath}/programs` },
                },
            },
            weekSection(basePath, now, schedule),
            {
                id: "kind-words",
                type: "testimonials",
                variant: "single-featured",
                content: {
                    kicker: "From clients",
                    quotes: testimonials.map((entry) => ({
                        quote: entry.quote,
                        author: entry.name,
                        title: entry.detail,
                    })),
                },
            },
            {
                id: "consult-banner",
                type: "cta-banner",
                variant: "full-bleed",
                content: {
                    title: "The consult is free.",
                    cta: { label: "Book it", href: `${basePath}/apply` },
                },
            },
        ],
    }
}

export function programsLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS["fitness-trainer"] },
        shell: shell(basePath, "/programs"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: "Three programs.",
                    subheadline:
                        "Small group, 1:1, or online — the same method at three levels of attention. Eighteen client slots, total, so every rep gets watched.",
                },
            },
            {
                id: "pricing",
                type: "pricing",
                variant: "tiers",
                content: {
                    kicker: "Programs",
                    tiers: programs,
                },
            },
            {
                id: "process",
                type: "steps",
                variant: "timeline",
                content: {
                    kicker: "How it starts",
                    title: "Apply to train",
                    steps: process,
                },
            },
            {
                id: "faq",
                type: "faq",
                variant: "accordion",
                content: {
                    kicker: "Straight answers",
                    items: faq,
                },
            },
            {
                id: "consult-banner",
                type: "cta-banner",
                variant: "full-bleed",
                content: {
                    title: "Start with the free consult.",
                    cta: { label: "Book it", href: `${basePath}/apply` },
                },
            },
        ],
    }
}

export function resultsLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS["fitness-trainer"] },
        shell: shell(basePath, "/results"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: "The work.",
                    subheadline:
                        "No before-and-after photos and no transformation countdowns — sessions, numbers, and clients who are still here years later.",
                },
            },
            {
                id: "proof",
                type: "stats",
                variant: "row",
                content: { stats },
            },
            {
                id: "floor",
                type: "gallery",
                variant: "filmstrip",
                content: {
                    items: gallery.map((image) => ({ media: imageMedia(image) })),
                    fullBleed: true,
                    lightbox: true,
                },
            },
            {
                id: "kind-words",
                type: "testimonials",
                variant: "quote-grid",
                content: {
                    kicker: "In their words",
                    quotes: testimonials.map((entry) => ({
                        quote: entry.quote,
                        author: entry.name,
                        title: entry.detail,
                    })),
                },
            },
            {
                id: "consult-banner",
                type: "cta-banner",
                variant: "full-bleed",
                content: {
                    title: "Your first number is a consult.",
                    cta: { label: "Book it free", href: `${basePath}/apply` },
                },
            },
        ],
    }
}

export function applyLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS["fitness-trainer"] },
        shell: shell(basePath, "/apply"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: consult.headline,
                    subheadline: consult.body,
                },
            },
            {
                id: "apply-form",
                type: "lead-form",
                variant: "detail-form",
                content: {
                    kicker: "The application",
                    title: "Tell me where you're starting from",
                    cta: "Send the application",
                    confirmation: consult.confirmation,
                    fields: consult.fields,
                    channels: [
                        { label: "Studio", value: trainer.address },
                        {
                            label: "Phone",
                            value: trainer.phone,
                            href: `tel:${trainer.phone.replace(/[^0-9+]/g, "")}`,
                        },
                        { label: "Email", value: trainer.email },
                        {
                            label: "Instagram",
                            // Handle only, no href: the shipped profile is
                            // fictional, and a dead external link is worse
                            // than none. Add `href: trainer.instagram` back
                            // once content.ts points at a real profile.
                            value: `@${trainer.instagram.split("/").pop() ?? ""}`,
                        },
                    ],
                },
            },
        ],
    }
}
