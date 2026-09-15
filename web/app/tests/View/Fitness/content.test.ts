import path from "node:path"
import { describe, expect, it } from "vitest"
import { publicAssetPresent } from "../../helpers/publicAssets"
import {
    classPacks,
    coaches,
    faq,
    gallery,
    gym,
    home,
    memberships,
    stats,
    story,
    testimonials,
    trial,
    weeklySchedule,
    type GymImage,
} from "../../../src/View/Fitness/content"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

/** Every image slot the site can render, labeled for failure messages. */
function allImages(): { label: string; image: GymImage }[] {
    return [
        { label: "home.hero", image: home.hero },
        { label: "story.image", image: story.image },
        ...coaches.map((coach) => ({ label: `coach ${coach.name}`, image: coach.photo })),
        ...gallery.map((image, index) => ({ label: `gallery[${index}]`, image })),
    ]
}

describe("fitness content", () => {
    it("ships the identity a studio site can't render without", () => {
        expect(gym.name).not.toBe("")
        expect(gym.tagline).not.toBe("")
        expect(gym.city).not.toBe("")
        expect(gym.address).not.toBe("")
        expect(gym.phone).not.toBe("")
        expect(gym.email).toMatch(/@/)
    })

    it("meets the content contract's minimums", () => {
        // packs/fitness/catalog.json contentContract — the module satisfies
        // the contract; the contract never drifts ahead of it.
        expect(weeklySchedule.length).toBeGreaterThanOrEqual(8)
        expect(coaches.length).toBeGreaterThanOrEqual(3)
        expect(stats.length).toBeGreaterThanOrEqual(3)
        expect(memberships.length).toBeGreaterThanOrEqual(2)
        expect(classPacks.length).toBeGreaterThanOrEqual(2)
        expect(faq.length).toBeGreaterThanOrEqual(3)
        expect(testimonials.length).toBeGreaterThanOrEqual(1)
        expect(gallery.length).toBeGreaterThanOrEqual(3)
        expect(story.paragraphs.length).toBeGreaterThanOrEqual(2)
        expect(trial.headline).not.toBe("")
        expect(trial.body).not.toBe("")
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
            // The engine treats sessions as same-day intervals; an inverted
            // or empty one would render as a class that never happens.
            expect(session.end, `${label}: ends after it starts`).toBeGreaterThan(session.start)
            expect(session.title, `${label}: title`).not.toBe("")
            expect(session.instructor, `${label}: instructor`).not.toBe("")
        }
    })

    it("never double-books the floor's coaches within a day", () => {
        // Same-day sessions led by the same coach must not overlap — the
        // grid would render an impossibility.
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

    it("names only rostered coaches in the schedule", () => {
        const roster = new Set(coaches.map((coach) => coach.name))
        // Group entries ("All coaches", "Staffed floor") are house labels,
        // not individuals — everything else must be someone on the wall.
        const houseLabels = new Set(["All coaches", "Staffed floor"])
        for (const session of weeklySchedule) {
            if (houseLabels.has(session.instructor)) {
                continue
            }
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
        // Exactly one tier wears the highlight — two badges cancel out.
        expect(memberships.filter((tier) => tier.highlighted === true)).toHaveLength(1)
    })

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

    it("keeps user-facing copy free of platform naming", () => {
        const copy = JSON.stringify({
            gym,
            home,
            story,
            trial,
            faq,
            memberships,
            classPacks,
            testimonials,
            coaches,
        })
        expect(copy).not.toMatch(/repobot/i)
        expect(copy).not.toMatch(/\bbot\b/i)
    })
})
