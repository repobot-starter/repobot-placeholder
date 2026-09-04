import type { LandingConfig } from "@ui"
import { PACK_REGISTERS } from "../Site/packRegisters.gen"
import { education, landingCopy, links, person, projects, roles, skillGroups } from "./content"
import { experienceLabel, rangeWithDuration, sortRolesByDate, totalExperienceMonths } from "./dates"
import { resumeShell } from "./resumeShell"

/**
 * The résumé pack's one-pager as a landing-kernel config (docs/landing.md).
 * `content.ts` stays the single owner-editable source; this file only maps
 * it into sections — and runs the date math (dates.ts) so every duration on
 * the page is computed from the role dates at render time: the hero's
 * total years, each role's "2019 – Present · 6 yrs", and the
 * most-recent-first ordering. The owner edits dates, never math.
 *
 * The `editorial` register typesets the document: paper ground, serif
 * display, hairline rules — a résumé IS a typeset document, so typography
 * does all the art direction. Deliberately zero images.
 *
 * Every section carries a stable `id`: ResumePage pipes the config through
 * the landing document's per-page merge (`useSitePageConfig`), and the ids
 * are what the catalog's landing seed binds to.
 *
 * The builder takes `basePath` ("" when the pack owns the site, "/resume"
 * on the preview route) and `now` (the page re-renders fresh math on every
 * mount; tests pass a fixed date).
 */
export function resumeLanding(basePath: string, now: Date): LandingConfig {
    const ordered = sortRolesByDate(roles, now)
    const experience = experienceLabel(totalExperienceMonths(roles, now))
    return {
        style: { preset: PACK_REGISTERS.resume },
        // The shared chrome lives in resumeShell.ts (manifest pages wear it too).
        shell: resumeShell(basePath, "/"),
        sections: [
            {
                id: "hero",
                type: "hero",
                variant: "statement",
                content: {
                    badge: person.availability === "" ? undefined : person.availability,
                    headline: `${person.name}.`,
                    subheadline: `${person.title} · ${person.location} · ${experience} of experience`,
                    primaryCta: { label: landingCopy.printCta, anchor: "print" },
                    secondaryCta: { label: landingCopy.contactCta, href: `mailto:${person.email}` },
                },
            },
            {
                id: "summary",
                type: "rich-prose",
                variant: "narrow",
                content: {
                    kicker: landingCopy.summary.kicker,
                    paragraphs: person.summary,
                },
            },
            {
                id: "experience",
                type: "highlights",
                variant: "setlist",
                content: {
                    kicker: landingCopy.experience.kicker,
                    title: landingCopy.experience.title,
                    highlights: ordered.map((role) => ({
                        headline: `${role.title} — ${role.company}`,
                        body: `${rangeWithDuration(role, now)}. ${role.summary}`,
                    })),
                },
            },
            {
                id: "stats",
                type: "stats",
                variant: "row",
                content: {
                    stats: [
                        { value: experience, label: landingCopy.stats.experienceLabel },
                        { value: `${roles.length}`, label: landingCopy.stats.rolesLabel },
                        { value: `${projects.length}`, label: landingCopy.stats.projectsLabel },
                    ],
                },
            },
            {
                id: "skills",
                type: "card-grid",
                variant: "4up",
                content: {
                    kicker: landingCopy.skills.kicker,
                    title: landingCopy.skills.title,
                    cards: skillGroups.map((group) => ({
                        title: group.title,
                        body: group.skills.join(" · "),
                    })),
                },
            },
            {
                id: "projects",
                type: "showcase",
                variant: "card-grid",
                content: {
                    kicker: landingCopy.projects.kicker,
                    title: landingCopy.projects.title,
                    items: projects.map((project) => ({
                        title: project.title,
                        description: project.description,
                        eyebrow:
                            project.meta !== undefined ? `${project.year} · ${project.meta}` : project.year,
                        url: project.url,
                    })),
                },
            },
            {
                id: "education",
                type: "card-grid",
                variant: "2up",
                content: {
                    kicker: landingCopy.education.kicker,
                    title: landingCopy.education.title,
                    cards: education.map((entry) => ({
                        title: entry.credential,
                        body: `${entry.school} · ${entry.years}`,
                    })),
                },
            },
            {
                id: "links",
                type: "lead-form",
                variant: "contact-block",
                content: {
                    kicker: landingCopy.links.kicker,
                    title: landingCopy.links.title,
                    body: landingCopy.links.body,
                    channels: links.map((link) => ({
                        label: link.label,
                        value: link.value,
                        href: link.url,
                    })),
                },
            },
        ],
    }
}
