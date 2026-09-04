import path from "node:path"
import { describe, expect, it } from "vitest"
import { publicAssetPresent } from "../../helpers/publicAssets"
import {
    bio,
    consult,
    faq,
    gallery,
    home,
    process,
    programs,
    stats,
    testimonials,
    trainer,
    trainingWeek,
    type TrainerImage,
} from "../../../src/View/FitnessTrainer/content"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

/** Every image slot the site can render, labeled for failure messages. */
function allImages(): { label: string; image: TrainerImage }[] {
    return [
        { label: "home.hero", image: home.hero },
        { label: "bio.portrait", image: bio.portrait },
        ...gallery.map((image, index) => ({ label: `gallery[${index}]`, image })),
    ]
}

describe("fitness-trainer content", () => {
    it("ships the identity a personal-brand site can't render without", () => {
        expect(trainer.name).not.toBe("")
        expect(trainer.brand).not.toBe("")
        expect(trainer.tagline).not.toBe("")
        expect(trainer.city).not.toBe("")
        expect(trainer.address).not.toBe("")
        expect(trainer.phone).not.toBe("")
        expect(trainer.email).toMatch(/@/)
    })

    it("meets the content contract's minimums", () => {
        // packs/fitness-trainer/catalog.json contentContract — the module
        // satisfies the contract; the contract never drifts ahead of it.
        expect(trainingWeek.length).toBeGreaterThanOrEqual(6)
        expect(bio.paragraphs.length).toBeGreaterThanOrEqual(2)
        expect(bio.credentials.length).toBeGreaterThanOrEqual(2)
        expect(stats.length).toBeGreaterThanOrEqual(3)
        expect(programs.length).toBeGreaterThanOrEqual(2)
        expect(process.length).toBeGreaterThanOrEqual(3)
        expect(faq.length).toBeGreaterThanOrEqual(3)
        expect(testimonials.length).toBeGreaterThanOrEqual(1)
        expect(gallery.length).toBeGreaterThanOrEqual(3)
        expect(consult.headline).not.toBe("")
        expect(consult.body).not.toBe("")
    })

    it("programs recovery: at least one weekday stays dark", () => {
        // One coach's book is finite — a seven-day schedule would read as
        // fiction. The pack's own copy promises closed days; hold it to that.
        const days = new Set(trainingWeek.map((session) => session.day))
        expect(days.size).toBeLessThan(7)
    })

    it("keeps every week entry inside a day and inside the week", () => {
        for (const session of trainingWeek) {
            const label = `${session.title} (day ${session.day}, ${session.start})`
            expect(session.day, `${label}: weekday index`).toBeGreaterThanOrEqual(0)
            expect(session.day, `${label}: weekday index`).toBeLessThanOrEqual(6)
            expect(Number.isInteger(session.start), `${label}: integer minutes`).toBe(true)
            expect(Number.isInteger(session.end), `${label}: integer minutes`).toBe(true)
            expect(session.start, `${label}: starts inside the day`).toBeGreaterThanOrEqual(0)
            expect(session.end, `${label}: ends inside the day`).toBeLessThanOrEqual(24 * 60)
            expect(session.end, `${label}: ends after it starts`).toBeGreaterThan(session.start)
            expect(session.title, `${label}: title`).not.toBe("")
            expect(session.instructor, `${label}: capacity note`).not.toBe("")
        }
    })

    it("never overlaps two blocks — there is only one coach", () => {
        for (const a of trainingWeek) {
            for (const b of trainingWeek) {
                if (a === b || a.day !== b.day) {
                    continue
                }
                const overlaps = a.start < b.end && b.start < a.end
                expect(overlaps, `day ${a.day}: ${a.title} overlaps ${b.title}`).toBe(false)
            }
        }
    })

    it("keeps program pricing honest: yearly never exceeds monthly", () => {
        for (const tier of programs) {
            expect(tier.name).not.toBe("")
            expect(tier.monthly).toBeGreaterThan(0)
            expect(tier.yearlyPerMonth).toBeGreaterThan(0)
            expect(tier.yearlyPerMonth, `${tier.name}: yearly is the discount`).toBeLessThanOrEqual(
                tier.monthly,
            )
            expect(tier.features.length, `${tier.name}: features`).toBeGreaterThanOrEqual(3)
        }
        expect(programs.filter((tier) => tier.highlighted === true)).toHaveLength(1)
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
            trainer,
            home,
            bio,
            consult,
            faq,
            programs,
            process,
            stats,
            testimonials,
        })
        expect(copy).not.toMatch(/repobot/i)
        expect(copy).not.toMatch(/\bbot\b/i)
    })
})
