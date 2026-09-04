import type { LandingConfig } from "@ui"
import { withDerivedSessionIds, type ScheduleSession } from "../Landing/contentDocument"
import { scheduleBadge, weekColumns } from "../Landing/schedule"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import {
    faq,
    founder,
    gallery,
    home,
    intro,
    memberships,
    practice,
    scheduleNote,
    singleVisits,
    studio,
    teachers,
    testimonials,
    weeklySchedule,
    type StudioImage,
} from "./content"
import { yogaShell } from "./yogaShell"

/**
 * The yoga & pilates pack's pages as landing-kernel configs
 * (docs/landing.md). `content.ts` stays the single owner-editable source
 * and `schedule.ts` keeps owning the live timetable logic — builders take
 * `now` where a page shows the schedule, so the grid's today column, the
 * now/next chips, and the hero badge stay current on every render.
 *
 * The atelier register is gallery-quiet: paper-white ground, hairline
 * rules, tracked uppercase display, near-ink accent. The warmth all comes
 * from the photography — bone, sand, and linen in golden light — so the
 * chrome never competes with the room. No accent word anywhere
 * (`accent: "none"`): the monochrome registers read cleaner bare.
 *
 * Every builder takes `basePath`: "" when the pack owns the site and
 * "/yoga" on the preview route. Section `id`s are stable: YogaPage pipes
 * these configs through the landing document's per-page merge
 * (`useSitePageConfig`), and the catalog's seeded skeletons bind to them.
 */

const imageMedia = (image: StudioImage) => ({
    kind: "image" as const,
    src: image.src,
    alt: image.alt,
    width: image.width,
    height: image.height,
    srcSet: image.srcSet,
})

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
            title: "The week's practice",
            badge: scheduleBadge(schedule, day, minute),
            days: weekColumns(schedule, day, minute),
            note: scheduleNote,
            cta: { label: "Begin with two weeks", href: `${basePath}/begin` },
        },
    }
}

/**
 * Schedule-bearing builders default to the code week lifted into contract
 * shape — the same fallback the content document's resolver uses — so
 * callers without a resolved document (pinned tests, the preview route)
 * keep the plain (basePath, now) signature. YogaPage passes the resolved
 * schedule from useScheduleSessions.
 */
const codeWeek = (): ScheduleSession[] => withDerivedSessionIds(weeklySchedule)

export function homeLanding(
    basePath: string,
    now: Date,
    schedule: ScheduleSession[] = codeWeek(),
): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS["fitness-yoga"] },
        shell: yogaShell(basePath, ""),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "full-bleed-media",
                content: {
                    badge: scheduleBadge(schedule, now.getDay(), now.getHours() * 60 + now.getMinutes()),
                    headline: home.headline,
                    accent: "none",
                    subheadline: home.subheadline,
                    primaryCta: { label: "Begin with two weeks — $39", href: `${basePath}/begin` },
                    secondaryCta: { label: "See the schedule", href: `${basePath}/schedule` },
                    media: imageMedia(home.hero),
                },
            },
            {
                id: "practice",
                type: "content-split",
                variant: "media-left",
                content: {
                    kicker: practice.kicker,
                    headline: practice.headline,
                    body: practice.body,
                    media: imageMedia(practice.image),
                },
            },
            scheduleSection(basePath, now, "This week", schedule),
            {
                id: "rooms",
                type: "gallery",
                variant: "sequence",
                content: {
                    items: gallery.map((image) => ({ media: imageMedia(image) })),
                    lightbox: true,
                },
            },
            {
                id: "kind-words",
                type: "testimonials",
                variant: "single-featured",
                content: {
                    kicker: "From the mats",
                    quotes: testimonials.map((entry) => ({
                        quote: entry.quote,
                        author: entry.name,
                        title: entry.detail,
                    })),
                },
            },
            {
                id: "begin-banner",
                type: "cta-banner",
                variant: "card",
                content: {
                    title: "Begin with two quiet weeks.",
                    body: "Unlimited mat classes for fourteen days — thirty-nine dollars, no strings tied to it.",
                    cta: { label: "Begin", href: `${basePath}/begin` },
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
        style: { preset: PACK_REGISTERS["fitness-yoga"] },
        shell: yogaShell(basePath, "/schedule"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: "The schedule.",
                    accent: "none",
                    subheadline:
                        "Practice every day of the week, sunrise to candlelight. Today is marked; the badge is live.",
                },
            },
            scheduleSection(basePath, now, "Schedule", schedule),
        ],
    }
}

export function teachersLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS["fitness-yoga"] },
        shell: yogaShell(basePath, "/teachers"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: "The teachers.",
                    accent: "none",
                    subheadline:
                        "Four of them, each keeping a different corner of the practice — and all of them ending class with the same ten quiet minutes.",
                },
            },
            {
                id: "teachers",
                type: "team",
                variant: "portraits",
                content: {
                    members: teachers.map((teacher) => ({
                        name: teacher.name,
                        role: teacher.role,
                        bio: teacher.bio,
                        media: imageMedia(teacher.photo),
                    })),
                },
            },
            {
                id: "founder",
                type: "content-split",
                variant: "media-right",
                content: {
                    kicker: founder.kicker,
                    headline: founder.headline,
                    body: founder.paragraphs.join(" "),
                    media: imageMedia(founder.image),
                    cta: { label: "Practice with them", href: `${basePath}/begin` },
                },
            },
        ],
    }
}

export function pricingLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS["fitness-yoga"] },
        shell: yogaShell(basePath, "/pricing"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: "Honest prices.",
                    accent: "none",
                    subheadline:
                        "Three memberships and a two-week introduction. Everything month to month; the yearly rate saves you about ten percent.",
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
                id: "visits",
                type: "card-grid",
                variant: "3up",
                content: {
                    kicker: "Just visiting",
                    title: "Drop-ins and the introduction",
                    cards: singleVisits.map((visit) => ({
                        title: `${visit.name} — ${visit.price}`,
                        body: visit.detail,
                    })),
                },
            },
            {
                id: "faq",
                type: "faq",
                variant: "accordion",
                content: {
                    kicker: "Good questions",
                    items: faq,
                },
            },
            {
                id: "begin-banner",
                type: "cta-banner",
                variant: "card",
                content: {
                    title: "Start with the introduction.",
                    body: "Two weeks of unlimited mat classes, thirty-nine dollars.",
                    cta: { label: "Begin", href: `${basePath}/begin` },
                },
            },
        ],
    }
}

export function beginLanding(basePath: string): LandingConfig {
    return {
        style: { preset: PACK_REGISTERS["fitness-yoga"] },
        shell: yogaShell(basePath, "/begin"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    headline: intro.headline,
                    accent: "none",
                    subheadline: intro.body,
                },
            },
            {
                id: "begin-form",
                type: "lead-form",
                variant: "detail-form",
                content: {
                    kicker: "The introduction",
                    title: "Tell us a little about your practice",
                    cta: "Begin the two weeks",
                    confirmation: intro.confirmation,
                    fields: intro.fields,
                    channels: [
                        { label: "Studio", value: studio.address },
                        {
                            label: "Phone",
                            value: studio.phone,
                            href: `tel:${studio.phone.replace(/[^0-9+]/g, "")}`,
                        },
                        { label: "Email", value: studio.email },
                        {
                            label: "Instagram",
                            // Handle only, no href: the shipped profile is
                            // fictional, and a dead external link is worse
                            // than none. Add `href: studio.instagram` back
                            // once content.ts points at a real profile.
                            value: `@${studio.instagram.split("/").pop() ?? ""}`,
                        },
                    ],
                },
            },
        ],
    }
}
