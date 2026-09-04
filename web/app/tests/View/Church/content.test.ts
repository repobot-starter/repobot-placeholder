import path from "node:path"
import { describe, expect, it } from "vitest"
import { publicAssetPresent } from "../../helpers/publicAssets"
import {
    events,
    home,
    ministries,
    sermons,
    serviceSchedule,
    serviceTimes,
    visit,
    type ChurchImage,
} from "../../../src/View/Church/content"
import { splitEvents } from "../../../src/View/Landing/events"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

/** Every image slot the site can render, labeled for failure messages. */
function allImages(): { label: string; image: ChurchImage }[] {
    return [
        { label: "home.hero", image: home.hero },
        { label: "home.welcome.portrait", image: home.welcome.portrait },
        { label: "visit.photo", image: visit.photo },
        ...ministries.map((ministry) => ({ label: `ministries[${ministry.slug}]`, image: ministry.image })),
        ...events.flatMap((event) =>
            event.image !== undefined ? [{ label: `events[${event.slug}]`, image: event.image }] : [],
        ),
    ]
}

describe("church content", () => {
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

    it("keeps weekly service times on the clock", () => {
        // The next-service badge computes from these; garbage in, badge out.
        expect(serviceTimes.length).toBeGreaterThan(0)
        for (const moment of serviceTimes) {
            expect(moment.day).toBeGreaterThanOrEqual(0)
            expect(moment.day).toBeLessThanOrEqual(6)
            expect(moment.minute).toBeGreaterThanOrEqual(0)
            expect(moment.minute).toBeLessThan(24 * 60)
            expect(moment.label).not.toBe("")
        }
        // The human-readable program must exist alongside the machine times.
        expect(serviceSchedule.length).toBeGreaterThan(0)
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
        // The mechanic is computed, so the content just has to be valid:
        // every event lands in exactly one bucket whenever "now" falls.
        for (const now of [
            new Date("2026-01-01T00:00"),
            new Date("2026-09-01T12:00"),
            new Date("2027-06-01T00:00"),
        ]) {
            const split = splitEvents(events, now)
            expect(split.upcoming.length + split.past.length).toBe(events.length)
        }
    })

    it("keeps the sermon archive most-recent-first with real dates", () => {
        for (const sermon of sermons) {
            expect(Number.isNaN(new Date(sermon.date).getTime()), sermon.title).toBe(false)
            expect(sermon.passage).not.toBe("")
            expect(sermon.series).not.toBe("")
        }
        const times = sermons.map((sermon) => new Date(sermon.date).getTime())
        expect([...times].sort((a, b) => b - a)).toEqual(times)
    })

    it("keeps the plan-a-visit form deliverable", () => {
        // Exactly one email field, so the managed-forms owner can reply.
        expect(visit.fields.filter((field) => field.type === "email")).toHaveLength(1)
        expect(visit.fields.some((field) => field.required === true)).toBe(true)
    })
})
