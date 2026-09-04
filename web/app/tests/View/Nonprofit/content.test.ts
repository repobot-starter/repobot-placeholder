import path from "node:path"
import { describe, expect, it } from "vitest"
import { publicAssetPresent } from "../../helpers/publicAssets"
import {
    events,
    home,
    impact,
    impactStats,
    programs,
    stats,
    volunteer,
    type NonprofitImage,
} from "../../../src/View/Nonprofit/content"
import { splitEvents } from "../../../src/View/Landing/events"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

/** Every image slot the site can render, labeled for failure messages. */
function allImages(): { label: string; image: NonprofitImage }[] {
    return [
        { label: "home.hero", image: home.hero },
        { label: "home.restored.image", image: home.restored.image },
        { label: "impact.letter.portrait", image: impact.letter.portrait },
        ...programs.map((program) => ({ label: `programs[${program.slug}]`, image: program.image })),
        ...events.flatMap((event) =>
            event.image !== undefined ? [{ label: `events[${event.slug}]`, image: event.image }] : [],
        ),
    ]
}

describe("nonprofit content", () => {
    it("gives every image intrinsic dimensions, alt text, and a srcSet", () => {
        for (const { label, image } of allImages()) {
            expect(image.alt, `${label} needs alt text`).not.toBe("")
            expect(image.width, `${label} needs a width`).toBeGreaterThan(0)
            expect(image.height, `${label} needs a height`).toBeGreaterThan(0)
            expect(image.srcSet.length, `${label} needs srcSet entries`).toBeGreaterThan(0)
            // The default src must be one of the srcSet variants, so the
            // browser never fetches a size the responsive verb didn't emit.
            expect(
                image.srcSet.map((entry) => entry.src),
                `${label} src must be a srcSet variant`,
            ).toContain(image.src)
        }
    })

    it("points every srcSet variant at a file that exists in public/", () => {
        for (const { label, image } of allImages()) {
            for (const entry of image.srcSet) {
                const file = path.join(PUBLIC_DIR, entry.src)
                expect(publicAssetPresent(file), `${label}: missing ${entry.src}`).toBe(true)
            }
        }
    })

    it("keeps the numbers typographic and earned", () => {
        // Stats are display strings on purpose ("92%", "$0.86") — never
        // empty, and the long ledger carries its supporting sentences.
        expect(stats.length).toBeGreaterThanOrEqual(3)
        for (const stat of stats) {
            expect(stat.value).not.toBe("")
            expect(stat.label).not.toBe("")
        }
        expect(impactStats.length).toBeGreaterThanOrEqual(3)
        for (const stat of impactStats) {
            expect(stat.value).not.toBe("")
            expect(stat.description, `${stat.label} needs its sentence`).not.toBe("")
        }
    })

    it("gives every program its outcomes", () => {
        expect(programs.length).toBeGreaterThanOrEqual(3)
        for (const program of programs) {
            expect(program.eyebrow).not.toBe("")
            expect(program.bullets.length, `${program.slug} needs outcome bullets`).toBeGreaterThan(0)
        }
    })

    it("keeps event slugs unique and every date parseable", () => {
        const slugs = events.map((event) => event.slug)
        expect(new Set(slugs).size).toBe(slugs.length)
        for (const event of events) {
            expect(event.slug).toMatch(/^[a-z0-9-]+$/)
            expect(Number.isNaN(new Date(event.start).getTime()), `${event.slug} start`).toBe(false)
            if (event.end !== undefined) {
                expect(Number.isNaN(new Date(event.end).getTime()), `${event.slug} end`).toBe(false)
                expect(
                    new Date(event.end).getTime(),
                    `${event.slug} must end after it starts`,
                ).toBeGreaterThan(new Date(event.start).getTime())
            }
        }
    })

    it("splits the demo calendar cleanly at any moment", () => {
        for (const now of [
            new Date("2026-01-01T00:00"),
            new Date("2026-09-01T12:00"),
            new Date("2027-06-01T00:00"),
        ]) {
            const split = splitEvents(events, now)
            expect(split.upcoming.length + split.past.length).toBe(events.length)
        }
    })

    it("keeps the volunteer form deliverable", () => {
        // Exactly one email field, so the managed-forms owner can reply.
        expect(volunteer.fields.filter((field) => field.type === "email")).toHaveLength(1)
        expect(volunteer.fields.some((field) => field.required === true)).toBe(true)
    })

    it("gives the impact page at least two witnesses", () => {
        expect(impact.voices.length).toBeGreaterThanOrEqual(2)
        for (const voice of impact.voices) {
            expect(voice.quote).not.toBe("")
            expect(voice.author).not.toBe("")
        }
    })
})
