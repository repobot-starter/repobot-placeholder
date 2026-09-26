import path from "node:path"
import { describe, expect, it } from "vitest"
import { publicAssetPresent } from "../../helpers/publicAssets"
import {
    after,
    decades,
    details,
    dressCode,
    entertainment,
    event,
    home,
    program,
    rsvp,
    songs,
    stay,
    toastImage,
    venue,
    type SiteImage,
} from "../../../src/View/Gala/content"
import { countdownLabel, daysUntil, rsvpNudge } from "../../../src/View/Gala/countdown"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

/**
 * This suite runs against whatever evening `content.ts` carries: the base
 * black-tie night in the kernel checkout, a remix's party in a composed
 * derived template (compose copies the remix's contentSeed over
 * content.ts). Date-shaped expectations are DERIVED from the module's own
 * dates, and the sections a seed may leave empty are checked entry by
 * entry, so the suite stays green for every seed.
 */

/** Every image slot the site can render, labeled for failure messages. */
function allImages(): { label: string; image: SiteImage }[] {
    return [
        { label: "event.heroImage", image: event.heroImage },
        { label: "venue.image", image: venue.image },
        ...(stay.image !== null ? [{ label: "stay.image", image: stay.image }] : []),
        ...(after.image !== null ? [{ label: "after.image", image: after.image }] : []),
        ...(toastImage !== null ? [{ label: "toastImage", image: toastImage }] : []),
        ...entertainment.items.map((item) => ({ label: `entertainment ${item.title}`, image: item.image })),
        ...decades.photos.map((entry, index) => ({ label: `decades[${index}]`, image: entry.image })),
        ...home.stack.map((frame, index) => ({ label: `home.stack[${index}]`, image: frame.image })),
    ]
}

/** `days` calendar days from the event date, at a given local time. */
function dayFromEvent(days: number, hour: number, minute = 0): Date {
    const [year, month, day] = event.dateIso.split("-").map(Number)
    return new Date(year, month - 1, day + days, hour, minute)
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
    })

    it("gives every titled companion card beside the venue a body and a photograph", () => {
        // The after-party and the hotel block render beside the venue only
        // once titled; a titled card must be a whole card.
        for (const card of [after, stay]) {
            if (card.title === "") continue
            expect(card.body, `${card.title} body`).not.toBe("")
            expect(card.image, `${card.title} photograph`).not.toBeNull()
        }
        if (stay.title !== "") expect(stay.url).toMatch(/^https:\/\//)
        // The invitation hero sets the guest of honor's name in script.
        if (event.name !== "") expect(event.headline).not.toBe("")
    })

    it("keeps the program well-formed: every item has a clock time", () => {
        for (const item of program.items) {
            expect(item.time, `${item.title} time`).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/)
            expect(item.title, "program title").not.toBe("")
            expect(item.description, `${item.title} description`).not.toBe("")
        }
    })

    it("prints every dress-code chip as a real color and every decade with its caption", () => {
        for (const swatch of dressCode.swatches) {
            expect(swatch.color, `${swatch.name} color`).toMatch(/^#[0-9a-f]{6}$/i)
            expect(swatch.note, `${swatch.name} note`).not.toBe("")
        }
        for (const entry of decades.photos) {
            expect(entry.caption, `${entry.image.src} caption`).not.toBe("")
        }
        for (const request of songs.requests) {
            expect(request.song, "song").not.toBe("")
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
        const fiftyOut = dayFromEvent(-50, 10, 30)
        expect(daysUntil(event.dateIso, fiftyOut)).toBe(50)
        expect(countdownLabel(event.dateIso, fiftyOut)).toBe("50 days to go")
        expect(countdownLabel(event.dateIso, dayFromEvent(-1, 22))).toBe("Tomorrow night")
        expect(countdownLabel(event.dateIso, dayFromEvent(0, 10, 30))).toBe("Tonight's the night")
        // The site outlives its night as the keepsake, not a negative count.
        expect(countdownLabel(event.dateIso, dayFromEvent(2, 10, 30))).toBe("What an evening")
        const replyDays = daysUntil(rsvp.replyByIso, fiftyOut)
        expect(replyDays).toBeGreaterThan(1)
        expect(rsvpNudge(rsvp.replyByIso, rsvp.replyByLabel, fiftyOut)).toBe(
            `Kindly reply by ${rsvp.replyByLabel} — ${replyDays} days away.`,
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
