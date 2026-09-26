import path from "node:path"
import { describe, expect, it } from "vitest"
import { publicAssetPresent } from "../../helpers/publicAssets"
import {
    activities,
    branches,
    gettingThere,
    home,
    landingCopy,
    lodging,
    memories,
    packing,
    reunion,
    rsvp,
    weekend,
    type SiteImage,
} from "../../../src/View/Reunion/content"
import { countdownLabel, daysUntil, rsvpNudge } from "../../../src/View/Reunion/countdown"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

/**
 * This suite runs against whatever weekend `content.ts` carries: the base
 * lake weekend in the kernel checkout, a remix's gathering in a composed
 * derived template (compose copies the remix's contentSeed over
 * content.ts). Date-shaped expectations are DERIVED from the module's own
 * dates and words, and the sections a seed may leave empty are checked
 * entry by entry, so the suite stays green for every seed.
 */

/** Every image slot the site can render, labeled for failure messages. */
function allImages(): { label: string; image: SiteImage }[] {
    return [
        { label: "reunion.heroImage", image: reunion.heroImage },
        ...(lodging.image !== null ? [{ label: "lodging.image", image: lodging.image }] : []),
        ...(packing.image !== null ? [{ label: "packing.image", image: packing.image }] : []),
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

/** `days` calendar days from the weekend's first day, at a given local time. */
function dayFromStart(days: number, hour: number, minute = 0): Date {
    const [year, month, day] = reunion.startDateIso.split("-").map(Number)
    return new Date(year, month - 1, day + days, hour, minute)
}

/** A copy template with its tokens filled, the way the clock engine fills it. */
function filled(template: string, days: number, label = ""): string {
    return template.replaceAll("{days}", String(days)).replaceAll("{label}", label)
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
            expect(day.label, `${day.title} label`).toMatch(/\d{1,2}/)
            expect(day.title, "day title").not.toBe("")
            expect(day.description, `${day.title} description`).not.toBe("")
            for (const item of day.items) {
                expect(item.time, `${day.label} item time`).not.toBe("")
                expect(item.title, `${day.label} item title`).not.toBe("")
            }
        }
        // The poster's strip stamps every stop with its day, or none of them.
        const stamped = activities.items.filter((item) => item.when !== "").length
        expect([0, activities.items.length]).toContain(stamped)
        if (home.layout === "poster") expect(stamped).toBe(activities.items.length)
    })

    it("fills a content-driven section whole, or leaves it empty", () => {
        // Each renders only once filled; a filled one must be a whole section.
        if (lodging.rooms.length > 0) {
            expect(lodging.headline).not.toBe("")
            expect(lodging.image, "the lodging photograph").not.toBeNull()
            for (const room of lodging.rooms) expect(room.where, room.branch).not.toBe("")
        }
        if (packing.items.length > 0) {
            expect(packing.headline).not.toBe("")
            expect(packing.image, "the pack list's photograph").not.toBeNull()
        }
        for (const branch of branches.items) {
            expect(branch.count, `${branch.name} count`).toMatch(/^\d+$/)
        }
        for (const step of gettingThere.steps) expect(step.body, step.title).not.toBe("")
        if (branches.items.length > 0) expect(branches.headline).not.toBe("")
        if (gettingThere.steps.length > 0) expect(gettingThere.headline).not.toBe("")
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
        // voice): computed per render, flipping at midnights, in the words
        // landingCopy gives it — the live count is the only number.
        const copy = landingCopy.countdown
        expect(copy.daysOut).toContain("{days}")
        const farOut = dayFromStart(-90, 10, 30)
        expect(daysUntil(reunion.startDateIso, farOut)).toBe(90)
        expect(countdownLabel(reunion.startDateIso, farOut)).toBe(filled(copy.daysOut, 90))
        expect(countdownLabel(reunion.startDateIso, dayFromStart(-1, 22))).toBe(filled(copy.tomorrow, 1))
        expect(countdownLabel(reunion.startDateIso, dayFromStart(0, 10, 30))).toBe(filled(copy.dayOf, 0))
        // The site outlives the weekend as the album, not a negative count.
        expect(countdownLabel(reunion.startDateIso, dayFromStart(7, 10, 30))).toBe(filled(copy.after, -7))
        const nudge = landingCopy.nudge
        expect(nudge.daysOut).toContain("{label}")
        const replyDays = daysUntil(rsvp.replyByIso, farOut)
        expect(replyDays).toBeGreaterThan(1)
        expect(rsvpNudge(rsvp.replyByIso, rsvp.replyByLabel, farOut)).toBe(
            filled(nudge.daysOut, replyDays, rsvp.replyByLabel),
        )
        expect(rsvpNudge(rsvp.replyByIso, rsvp.replyByLabel, dayFromStart(1, 10, 30))).toBe(
            filled(nudge.after, daysUntil(rsvp.replyByIso, dayFromStart(1, 10, 30)), rsvp.replyByLabel),
        )
        expect(rsvpNudge(rsvp.replyByIso, rsvp.replyByLabel, dayFromStart(1, 10, 30))).toContain(
            rsvp.replyByLabel,
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
