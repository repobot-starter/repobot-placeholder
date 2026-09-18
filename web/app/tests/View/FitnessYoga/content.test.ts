import path from "node:path"
import { describe, expect, it } from "vitest"
import { publicAssetPresent } from "../../helpers/publicAssets"
import {
    faq,
    founder,
    gallery,
    home,
    intro,
    memberships,
    practice,
    singleVisits,
    studio,
    teachers,
    testimonials,
    weeklySchedule,
    type StudioImage,
} from "../../../src/View/FitnessYoga/content"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

/** Every image slot the site can render, labeled for failure messages. */
function allImages(): { label: string; image: StudioImage }[] {
    return [
        { label: "home.hero", image: home.hero },
        { label: "practice.image", image: practice.image },
        { label: "founder.image", image: founder.image },
        ...teachers.map((teacher) => ({ label: `teacher ${teacher.name}`, image: teacher.photo })),
        ...gallery.map((image, index) => ({ label: `gallery[${index}]`, image })),
    ]
}

describe("fitness-yoga content", () => {
    it("ships the identity a studio site can't render without", () => {
        expect(studio.name).not.toBe("")
        expect(studio.tagline).not.toBe("")
        expect(studio.city).not.toBe("")
        expect(studio.address).not.toBe("")
        expect(studio.phone).not.toBe("")
        expect(studio.email).toMatch(/@/)
    })

    it("meets the content contract's minimums", () => {
        // packs/fitness-yoga/catalog.json contentContract — the module
        // satisfies the contract; the contract never drifts ahead of it.
        expect(weeklySchedule.length).toBeGreaterThanOrEqual(8)
        expect(teachers.length).toBeGreaterThanOrEqual(3)
        expect(memberships.length).toBeGreaterThanOrEqual(2)
        expect(singleVisits.length).toBeGreaterThanOrEqual(2)
        expect(faq.length).toBeGreaterThanOrEqual(3)
        expect(testimonials.length).toBeGreaterThanOrEqual(1)
        expect(gallery.length).toBeGreaterThanOrEqual(3)
        expect(founder.paragraphs.length).toBeGreaterThanOrEqual(2)
        expect(intro.headline).not.toBe("")
        expect(intro.body).not.toBe("")
    })

    it("holds practice every day of the week", () => {
        // The daily schedule is this studio's promise (and what sets its
        // seven-column grid apart from the strength club's six).
        const days = new Set(weeklySchedule.map((session) => session.day))
        expect([...days].sort()).toEqual([0, 1, 2, 3, 4, 5, 6])
    })

    it("keeps every schedule entry inside a day and inside the week", () => {
        for (const session of weeklySchedule) {
            const label = `${session.title} (day ${session.day}, ${session.start})`
            expect(session.day, `${label}: weekday index`).toBeGreaterThanOrEqual(0)
            expect(session.day, `${label}: weekday index`).toBeLessThanOrEqual(6)
            expect(Number.isInteger(session.start), `${label}: integer minutes`).toBe(true)
            expect(Number.isInteger(session.end), `${label}: integer minutes`).toBe(true)
            expect(session.start, `${label}: starts inside the day`).toBeGreaterThanOrEqual(0)
            expect(session.end, `${label}: ends inside the day`).toBeLessThanOrEqual(24 * 60)
            expect(session.end, `${label}: ends after it starts`).toBeGreaterThan(session.start)
            expect(session.title, `${label}: title`).not.toBe("")
            expect(session.instructor, `${label}: instructor`).not.toBe("")
        }
    })

    it("never double-books a teacher within a day", () => {
        for (const a of weeklySchedule) {
            for (const b of weeklySchedule) {
                if (a === b || a.day !== b.day || a.instructor !== b.instructor) {
                    continue
                }
                const overlaps = a.start < b.end && b.start < a.end
                expect(
                    overlaps,
                    `${a.instructor} is double-booked on day ${a.day}: ${a.title} and ${b.title}`,
                ).toBe(false)
            }
        }
    })

    it("names only rostered teachers in the schedule", () => {
        const roster = new Set(teachers.map((teacher) => teacher.name))
        for (const session of weeklySchedule) {
            expect(roster.has(session.instructor), `${session.instructor} leads ${session.title}`).toBe(true)
        }
    })

    it("keeps membership pricing honest: yearly never exceeds monthly", () => {
        for (const tier of memberships) {
            expect(tier.name).not.toBe("")
            expect(tier.monthly).toBeGreaterThan(0)
            expect(tier.yearlyPerMonth).toBeGreaterThan(0)
            expect(tier.yearlyPerMonth, `${tier.name}: yearly is the discount`).toBeLessThanOrEqual(
                tier.monthly,
            )
            expect(tier.features.length, `${tier.name}: features`).toBeGreaterThanOrEqual(3)
        }
        expect(memberships.filter((tier) => tier.highlighted === true)).toHaveLength(1)
    })

    it("gives every image intrinsic dimensions, alt text, and a srcSet", () => {
        for (const { label, image } of allImages()) {
            expect(image.alt, `${label} needs alt text`).not.toBe("")
            expect(image.width, `${label} needs a width`).toBeGreaterThan(0)
            expect(image.height, `${label} needs a height`).toBeGreaterThan(0)
            expect(image.srcSet.length, `${label} needs srcSet entries`).toBeGreaterThan(0)
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

    it("keeps user-facing copy free of platform naming", () => {
        const copy = JSON.stringify({
            studio,
            home,
            practice,
            founder,
            intro,
            faq,
            memberships,
            singleVisits,
            testimonials,
            teachers,
        })
        expect(copy).not.toMatch(/repobot/i)
        expect(copy).not.toMatch(/\bbot\b/i)
    })
})
