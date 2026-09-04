import type { LandingConfig, MarketingShellConfig } from "@ui"
import { withDerivedSessionIds, type ScheduleSession } from "../Landing/contentDocument"
import { scheduleBadge, weekColumns } from "../Landing/schedule"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import {
    classPacks,
    coaches,
    faq,
    gallery,
    gym,
    home,
    memberships,
    scheduleNote,
    stats,
    story,
    testimonials,
    trial,
    weeklySchedule,
    type GymImage,
} from "./content"
import { fitnessShell } from "./fitnessShell"

/**
 * The strength-club pack's pages as landing-kernel configs
 * (docs/landing.md). `content.ts` stays the single owner-editable source
 * and `schedule.ts` keeps owning the live timetable logic — the builders
 * take `now` where a page shows the schedule, so the grid's today column,
 * the now/next chips, and the hero badge stay current on every render
 * (the menu pack's open-badge discipline, applied to a timetable).
 *
 * The chalk register is strictly monochrome: structure comes from
 * hairlines and stenciled type, and the black-and-white photography is
 * the only tonal drama. No accent word, no washes — `accent: "none"`
 * everywhere a headline renders.
 *
 * Every builder takes `basePath`: "" when the pack owns the site (links
 * are /schedule, /trial) and "/fitness" on the preview route — same pages,
 * both wirings. Section `id`s are stable: FitnessPage pipes these configs
 * through the landing document's per-page merge (`useSitePageConfig`), and
 * the catalog's seeded skeletons bind to the ids.
 *
 * Schedule-bearing builders take the RESOLVED week (`schedule`): the page
 * resolves the business-content contract over `content.ts` once
 * (`useScheduleSessions` in FitnessPage) and the builders render whatever
 * week they are handed — an owner's contract edit and the code default walk
 * the same path.
 */

const imageMedia = (image: GymImage) => ({
    kind: "image" as const,
    src: image.src,
    alt: image.alt,
    width: image.width,
    height: image.height,
    srcSet: image.srcSet,
})

function shell(basePath: string, currentPath: string): MarketingShellConfig {
    return fitnessShell(basePath, currentPath)
}

/** The schedule section, shared by home (teaser placement) and /schedule. */
function scheduleSection(basePath: string, now: Date, kicker: string, schedule: ScheduleSession[]) {
    const day = now.getDay()
    const minute = now.getHours() * 60 + now.getMinutes()
    return {
        id: "schedule",
        type: "schedule" as const,
        variant: "week-grid" as const,
        content: {
            kicker,
            title: "The week at a glance",
            badge: scheduleBadge(schedule, day, minute),
            days: weekColumns(schedule, day, minute),
            note: scheduleNote,
            cta: { label: "Start your free week", href: `${basePath}/trial` },
        },
    }
}

/**
 * Schedule-bearing builders default to the code week lifted into contract
 * shape — the same fallback the content document's resolver uses — so
 * callers without a resolved document (pinned tests, the preview route)
 * keep the plain (basePath, now) signature. FitnessPage passes the
 * resolved schedule from useScheduleSessions.
 */
const codeWeek = (): ScheduleSession[] => withDerivedSessionIds(weeklySchedule)

export function homeLanding(
    basePath: string,
    now: Date,
    schedule: ScheduleSession[] = codeWeek(),
): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.fitness },
        shell: shell(basePath, ""),
        sections: [
            {
                id: "hero",
                type: "hero",
                // The photograph is the hero; stenciled type over it. Must
                // match the catalog's landing seed byte for byte.
                variant: "full-bleed-media",
                content: {
                    badge: scheduleBadge(schedule, now.getDay(), now.getHours() * 60 + now.getMinutes()),
                    headline: home.headline,
                    accent: "none",
                    subheadline: home.subheadline,
                    primaryCta: { label: "Start your free week", href: `${basePath}/trial` },
                    secondaryCta: { label: "See the schedule", href: `${basePath}/schedule` },
                    media: imageMedia(home.hero),
                },
            },
            {
                id: "proof",
                type: "stats",
                variant: "row",
                content: { stats },
            },
            scheduleSection(basePath, now, "This week", schedule),
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
                variant: "single-featured",
                content: {
                    kicker: "From the floor",
                    quotes: testimonials.map((entry) => ({
                        quote: entry.quote,
                        author: entry.name,
                        title: entry.detail,
                    })),
                },
            },
            {
                id: "trial-banner",
                type: "cta-banner",
                variant: "full-bleed",
                content: {
                    title: "The first week is free.",
                    cta: { label: "Claim it", href: `${basePath}/trial` },
                },
            },
        ],
    }
}

export function scheduleLanding(
    basePath: string,
    now: Date,
    schedule: ScheduleSession[] = codeWeek(),
): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.fitness },
        shell: shell(basePath, "/schedule"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: "The week.",
                    accent: "none",
                    subheadline:
                        "Every class, every coach, five in the morning to seven at night. Today is marked; the badge is live.",
                },
            },
            scheduleSection(basePath, now, "Schedule", schedule),
        ],
    }
}

export function coachesLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.fitness },
        shell: shell(basePath, "/coaches"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: "The coaches.",
                    accent: "none",
                    subheadline:
                        "Four of them, all on the floor, none of them selling supplements. Between them: three decades of platforms, fields, and fixed deadlifts.",
                },
            },
            {
                id: "coaches",
                type: "team",
                variant: "portraits",
                content: {
                    members: coaches.map((coach) => ({
                        name: coach.name,
                        role: coach.role,
                        bio: coach.bio,
                        media: imageMedia(coach.photo),
                    })),
                },
            },
            {
                id: "story",
                type: "content-split",
                variant: "media-right",
                content: {
                    kicker: story.kicker,
                    headline: story.headline,
                    body: story.paragraphs.join(" "),
                    media: imageMedia(story.image),
                    cta: { label: "Train with them", href: `${basePath}/trial` },
                },
            },
        ],
    }
}

export function pricingLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.fitness },
        shell: shell(basePath, "/pricing"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: "Simple prices.",
                    accent: "none",
                    subheadline:
                        "Three memberships, month to month, no initiation fee. Yearly saves you about a month and a half.",
                },
            },
            {
                id: "pricing",
                type: "pricing",
                variant: "tiers",
                content: {
                    kicker: "Memberships",
                    tiers: memberships,
                },
            },
            {
                id: "packs",
                type: "card-grid",
                variant: "3up",
                content: {
                    kicker: "Not ready to commit",
                    title: "Packs and drop-ins",
                    cards: classPacks.map((pack) => ({
                        title: `${pack.name} — ${pack.price}`,
                        body: pack.detail,
                    })),
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
                id: "trial-banner",
                type: "cta-banner",
                variant: "full-bleed",
                content: {
                    title: "Try the whole club first.",
                    cta: { label: "Start your free week", href: `${basePath}/trial` },
                },
            },
        ],
    }
}

export function trialLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS.fitness },
        shell: shell(basePath, "/trial"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: trial.headline,
                    accent: "none",
                    subheadline: trial.body,
                },
            },
            {
                id: "trial-form",
                type: "lead-form",
                variant: "detail-form",
                content: {
                    kicker: "The free week",
                    title: "Tell us where you're starting from",
                    cta: "Claim the week",
                    confirmation: trial.confirmation,
                    fields: trial.fields,
                    channels: [
                        { label: "Address", value: gym.address },
                        {
                            label: "Phone",
                            value: gym.phone,
                            href: `tel:${gym.phone.replace(/[^0-9+]/g, "")}`,
                        },
                        { label: "Email", value: gym.email },
                        {
                            label: "Instagram",
                            // Handle only, no href: the shipped profile is
                            // fictional, and a dead external link is worse
                            // than none. Add `href: gym.instagram` back once
                            // content.ts points at a real profile.
                            value: `@${gym.instagram.split("/").pop() ?? ""}`,
                        },
                    ],
                },
            },
        ],
    }
}
