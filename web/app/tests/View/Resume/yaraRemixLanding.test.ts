import type { LandingConfig } from "@ui"
import { describe, expect, it, vi } from "vitest"
import yaraCatalog from "../../../../../packs/resume-yara/catalog.json"

// The builder runs on the resume-yara seed here, in every tree: compose
// copies it over content.ts, so this is the remix's composed site.
vi.mock("../../../src/View/Resume/content", () => import("../../../src/View/Resume/yaraRemix.content"))
vi.mock("../../../src/Config/projectManifest", () => ({
    projectManifest: {
        marketing: { preset: "plain", pages: [] },
        dashboard: { destinations: [] },
    },
    marketingHomePage: () => undefined,
}))
import { person, projects, roles } from "../../../src/View/Resume/content"
import {
    experienceLabel,
    rangeWithDuration,
    sortRolesByDate,
    totalExperienceMonths,
} from "../../../src/View/Resume/dates"
import { resumeLanding } from "../../../src/View/Resume/resumeLanding"
import { applySitePageDocument } from "../../../src/View/Landing/landingDocument"

/**
 * The resume-yara remix's pinned skeleton (packs/resume-yara/catalog.json
 * `landing.pages`) against the base builder running on the remix's seed:
 * a photographed seed turns the résumé photographic — the full-bleed
 * hero, the kitchens on a photographic timeline, the work as stories —
 * with every number still computed from the role dates.
 */

const document = { ...yaraCatalog.landing, routes: { "/": "home" } }
const NOW = new Date(2026, 8, 15) // Sep 2026

function inDocumentRegister(config: LandingConfig): LandingConfig {
    return { ...config, style: { ...config.style, preset: document.style.preset as never } }
}

const config = resumeLanding("", NOW)
const section = (id: string) => config.sections.find((entry) => entry.id === id)

describe("resume-yara pinned layout", () => {
    it("reproduces the pinned page from the seed exactly", () => {
        expect(applySitePageDocument(config, "home", document)).toEqual(inDocumentRegister(config))
    })

    it("pins the builder's photographic sections verbatim", () => {
        expect(document.pages.home.sections).toEqual(
            config.sections.map((entry) => ({
                id: entry.id,
                type: entry.type,
                ...(entry.variant !== undefined ? { variant: entry.variant } : {}),
            })),
        )
    })
})

describe("resume-yara photographic résumé", () => {
    it("makes the portrait the full-bleed hero, the computed line intact", () => {
        const hero = section("hero")
        expect(hero?.variant).toBe("full-bleed-media")
        const content = hero?.content as { media?: { src: string }; subheadline?: string; headline: string }
        expect(content.media?.src).toBe(person.portrait.src)
        expect(content.headline).toBe(`${person.name}.`)
        expect(content.subheadline).toContain(
            `${experienceLabel(totalExperienceMonths(roles, NOW))} of experience`,
        )
    })

    it("hangs every kitchen on the timeline, most recent first, with its photograph and computed dates", () => {
        const experience = section("experience")
        expect(experience?.type).toBe("steps")
        expect(experience?.variant).toBe("timeline")
        const content = experience?.content as {
            steps: { title: string; description: string; label?: string; media?: { src: string } }[]
        }
        const ordered = sortRolesByDate(roles, NOW)
        expect(content.steps).toHaveLength(roles.length)
        content.steps.forEach((step, index) => {
            const role = ordered[index]
            expect(step.title).toBe(`${role.title} — ${role.company}`)
            expect(step.description.startsWith(`${rangeWithDuration(role, NOW)}. `)).toBe(true)
            expect(step.label).toBe(role.start.slice(0, 4))
            expect(step.media?.src).toBe(role.image?.src)
        })
        expect(content.steps[0].description).toMatch(/^\d{4} – Present · /)
    })

    it("sets the work as photographed stories", () => {
        const work = section("projects")
        expect(work?.variant).toBe("stories")
        const content = work?.content as { items: { media?: { src: string } }[] }
        expect(content.items.map((item) => item.media?.src)).toEqual(
            projects.map((project) => project.image?.src),
        )
    })

    it("shoots every photograph at one shape, 4:3", () => {
        for (const image of [
            person.portrait,
            ...roles.map((role) => role.image),
            ...projects.map((p) => p.image),
        ]) {
            expect(image, "every role and project is photographed").toBeDefined()
            expect(image!.width / image!.height).toBeCloseTo(4 / 3, 5)
        }
    })
})
