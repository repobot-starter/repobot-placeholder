import path from "node:path"
import { describe, expect, it } from "vitest"
import { publicAssetPresent } from "../../helpers/publicAssets"
import {
    after,
    details,
    event,
    program,
    rsvp,
    toastImage,
    venue,
    type SiteImage,
} from "../../../src/View/Gala/content"
import { countdownLabel, daysUntil, rsvpNudge } from "../../../src/View/Gala/countdown"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

/** Every image slot the site can render, labeled for failure messages. */
function allImages(): { label: string; image: SiteImage }[] {
    return [
        { label: "event.heroImage", image: event.heroImage },
        { label: "venue.image", image: venue.image },
        { label: "after.image", image: after.image },
        { label: "toastImage", image: toastImage },
    ]
}

describe("gala content", () => {
    it("ships the identity an evening can't render without", () => {
        expect(event.title).not.toBe("")
        expect(event.host).not.toBe("")
        expect(event.venueShort).not.toBe("")
        expect(event.email).toContain("@")
        // The clock engine parses these dates — a malformed one would make
        // the hero badge and the reply nudge silently wrong.
        expect(event.dateIso).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(rsvp.replyByIso).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        // Guests reply before the evening, not after it.
        expect(new Date(rsvp.replyByIso).getTime()).toBeLessThan(new Date(event.dateIso).getTime())
    })

    it("meets the content contract's minimums", () => {
        // packs/gala/catalog.json contentContract — the module satisfies
        // the contract; the contract never drifts ahead of it.
        expect(program.items.length).toBeGreaterThanOrEqual(3)
        expect(details.items.length).toBeGreaterThanOrEqual(2)
        expect(rsvp.faqs.length).toBeGreaterThanOrEqual(2)
        expect(venue.description).not.toBe("")
        expect(after.body).not.toBe("")
    })

    it("keeps the program well-formed: every item has a clock time", () => {
        for (const item of program.items) {
            expect(item.time, `${item.title} time`).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/)
            expect(item.title, "program title").not.toBe("")
            expect(item.description, `${item.title} description`).not.toBe("")
        }
    })

    it("gives the venue a directions link for its printed address", () => {
        expect(venue.address).not.toBe("")
        expect(venue.mapUrl).toMatch(/^https:\/\/maps\.google\.com/)
    })

    it("keeps the reply card able to deliver: email field plus the two required selects", () => {
        // The managed-forms detail form submits on the email field; without
        // one the reply card would render but never send.
        const email = rsvp.fields.find((field) => field.type === "email")
        expect(email, "the reply card needs an email field").toBeDefined()
        expect(email?.required).toBe(true)
        const attending = rsvp.fields.find((field) => field.name === "attending")
        expect(attending?.type).toBe("select")
        expect(attending?.required).toBe(true)
        expect(attending?.options?.length).toBeGreaterThanOrEqual(2)
        const guests = rsvp.fields.find((field) => field.name === "guests")
        expect(guests?.type).toBe("select")
        expect(guests?.required).toBe(true)
    })

    it("speaks the countdown in the evening's own voice, pinned at fixed instants", () => {
        // The clock engine's rules (the vows engine's sibling, this
        // pack's voice): computed per render, flipping at midnights.
        expect(daysUntil(event.dateIso, new Date(2026, 7, 27, 10, 30))).toBe(126)
        expect(countdownLabel(event.dateIso, new Date(2026, 7, 27, 10, 30))).toBe("126 days to go")
        expect(countdownLabel(event.dateIso, new Date(2026, 11, 30, 22, 0))).toBe("Tomorrow night")
        expect(countdownLabel(event.dateIso, new Date(2026, 11, 31, 10, 30))).toBe("Tonight's the night")
        // The site outlives its night as the keepsake, not a negative count.
        expect(countdownLabel(event.dateIso, new Date(2027, 0, 2, 10, 30))).toBe("What an evening")
        expect(rsvpNudge(rsvp.replyByIso, rsvp.replyByLabel, new Date(2026, 7, 27, 10, 30))).toBe(
            "Kindly reply by December 1, 2026 — 96 days away.",
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
