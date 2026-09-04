import path from "node:path"
import { describe, expect, it } from "vitest"
import { publicAssetPresent } from "../../helpers/publicAssets"
import {
    activities,
    home,
    memories,
    reunion,
    rsvp,
    weekend,
    type SiteImage,
} from "../../../src/View/Reunion/content"
import { countdownLabel, daysUntil, rsvpNudge } from "../../../src/View/Reunion/countdown"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

/** Every image slot the site can render, labeled for failure messages. */
function allImages(): { label: string; image: SiteImage }[] {
    return [
        { label: "reunion.heroImage", image: reunion.heroImage },
        ...activities.items.map((item, index) => ({
            label: `activities.items[${index}].image`,
            image: item.image,
        })),
        ...memories.photos.map((entry, index) => ({
            label: `memories.photos[${index}].image`,
            image: entry.image,
        })),
    ]
}

describe("reunion content", () => {
    it("ships the identity a gathering can't render without", () => {
        expect(reunion.title).not.toBe("")
        expect(reunion.familyName).not.toBe("")
        expect(reunion.venueShort).not.toBe("")
        expect(reunion.organizers).not.toBe("")
        expect(reunion.email).toContain("@")
        // The clock engine parses these dates — a malformed one would make
        // the hero badge and the head-count nudge silently wrong.
        expect(reunion.startDateIso).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(rsvp.replyByIso).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        // The head count closes before the weekend starts.
        expect(new Date(rsvp.replyByIso).getTime()).toBeLessThan(new Date(reunion.startDateIso).getTime())
        expect(home.welcomeBody).not.toBe("")
    })

    it("meets the content contract's minimums", () => {
        // packs/reunion/catalog.json contentContract — the module satisfies
        // the contract; the contract never drifts ahead of it.
        expect(weekend.days.length).toBeGreaterThanOrEqual(2)
        expect(activities.items.length).toBeGreaterThanOrEqual(3)
        expect(memories.photos.length).toBeGreaterThanOrEqual(3)
        expect(rsvp.faqs.length).toBeGreaterThanOrEqual(2)
        expect(memories.shareNote).not.toBe("")
    })

    it("keeps the weekend well-formed: every day carries its date label", () => {
        for (const day of weekend.days) {
            expect(day.label, `${day.title} label`).toMatch(/August \d{1,2}/)
            expect(day.title, "day title").not.toBe("")
            expect(day.description, `${day.title} description`).not.toBe("")
        }
    })

    it("captions the memory wall in years: every snapshot says when", () => {
        // The wall's captions are the family's timeline; a caption without
        // a year is a photo nobody can place.
        for (const entry of memories.photos) {
            expect(entry.caption).toMatch(/\b(19|20)\d{2}\b/)
        }
    })

    it("keeps the head count able to deliver: email plus the two required selects", () => {
        // The managed-forms detail form submits on the email field; without
        // one the head-count form would render but never send.
        const email = rsvp.fields.find((field) => field.type === "email")
        expect(email, "the head-count form needs an email field").toBeDefined()
        expect(email?.required).toBe(true)
        const attending = rsvp.fields.find((field) => field.name === "attending")
        expect(attending?.type).toBe("select")
        expect(attending?.required).toBe(true)
        expect(attending?.options?.length).toBeGreaterThanOrEqual(2)
        const headcount = rsvp.fields.find((field) => field.name === "headcount")
        expect(headcount?.type).toBe("select")
        expect(headcount?.required).toBe(true)
    })

    it("speaks the countdown in the family's own voice, pinned at fixed instants", () => {
        // The clock engine's rules (the vows engine's sibling, this pack's
        // voice): computed per render, flipping at midnights.
        expect(daysUntil(reunion.startDateIso, new Date(2026, 7, 27, 10, 30))).toBe(351)
        expect(countdownLabel(reunion.startDateIso, new Date(2026, 7, 27, 10, 30))).toBe(
            "351 days till the lake",
        )
        expect(countdownLabel(reunion.startDateIso, new Date(2027, 7, 12, 22, 0))).toBe("Tomorrow!")
        expect(countdownLabel(reunion.startDateIso, new Date(2027, 7, 13, 10, 30))).toBe(
            "It's reunion weekend",
        )
        // The site outlives the weekend as the album, not a negative count.
        expect(countdownLabel(reunion.startDateIso, new Date(2027, 7, 20, 10, 30))).toBe("Until next summer")
        expect(rsvpNudge(rsvp.replyByIso, rsvp.replyByLabel, new Date(2026, 7, 27, 10, 30))).toBe(
            "Tell us by July 1, 2027 — 308 days off — so we rent enough tables.",
        )
        expect(rsvpNudge(rsvp.replyByIso, rsvp.replyByLabel, new Date(2027, 6, 10, 10, 30))).toBe(
            "The head-count date (July 1, 2027) has passed — reply anyway; we'll squeeze you in, we always do.",
        )
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
})
