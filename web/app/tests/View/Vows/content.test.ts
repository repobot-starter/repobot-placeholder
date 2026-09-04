import path from "node:path"
import { describe, expect, it } from "vitest"
import { publicAssetPresent } from "../../helpers/publicAssets"
import {
    couple,
    home,
    party,
    registry,
    rsvp,
    schedule,
    story,
    travel,
    type SiteImage,
} from "../../../src/View/Vows/content"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

/** Every image slot the site can render, labeled for failure messages. */
function allImages(): { label: string; image: SiteImage }[] {
    return [
        { label: "home.heroImage", image: home.heroImage },
        ...story.chapters.map((chapter) => ({ label: `chapter ${chapter.title}`, image: chapter.image })),
        ...story.gallery.map((image, index) => ({ label: `gallery[${index}]`, image })),
        ...schedule.venues.map((venue) => ({ label: `venue ${venue.name}`, image: venue.image })),
    ]
}

describe("vows content", () => {
    it("ships the identity a wedding site can't render without", () => {
        expect(couple.names).not.toBe("")
        expect(couple.partnerA).not.toBe("")
        expect(couple.partnerB).not.toBe("")
        expect(couple.venueShort).not.toBe("")
        expect(couple.email).toContain("@")
        // The clock engine parses these dates — a malformed one would make
        // the hero badge and the reply nudge silently wrong.
        expect(couple.weddingDateIso).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(rsvp.replyByIso).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        // Guests reply before the wedding, not after it.
        expect(new Date(rsvp.replyByIso).getTime()).toBeLessThan(new Date(couple.weddingDateIso).getTime())
    })

    it("meets the content contract's minimums", () => {
        // packs/vows/catalog.json contentContract — the module satisfies
        // the contract; the contract never drifts ahead of it.
        expect(story.chapters.length).toBeGreaterThanOrEqual(2)
        expect(story.gallery.length).toBeGreaterThanOrEqual(3)
        expect(schedule.days.length).toBeGreaterThanOrEqual(1)
        expect(schedule.venues.length).toBeGreaterThanOrEqual(1)
        expect(travel.gettingThere.length).toBeGreaterThanOrEqual(1)
        expect(travel.hotels.length).toBeGreaterThanOrEqual(2)
        expect(party.members.length).toBeGreaterThanOrEqual(2)
        expect(registry.links.length).toBeGreaterThanOrEqual(1)
        expect(rsvp.faqs.length).toBeGreaterThanOrEqual(2)
    })

    it("keeps the weekend well-formed: every day has events, every event a clock time", () => {
        for (const day of schedule.days) {
            expect(day.label, "day label").not.toBe("")
            expect(day.events.length, `${day.label} has events`).toBeGreaterThan(0)
            for (const event of day.events) {
                expect(event.time, `${event.title} time`).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/)
                expect(event.title, `${day.label} event title`).not.toBe("")
                expect(event.description, `${event.title} description`).not.toBe("")
            }
        }
    })

    it("gives every venue a directions link for its printed address", () => {
        for (const venue of schedule.venues) {
            expect(venue.name, "venue name").not.toBe("")
            expect(venue.address, `${venue.name} address`).not.toBe("")
            expect(venue.mapUrl, `${venue.name} directions`).toMatch(/^https:\/\//)
        }
    })

    it("keeps every hotel bookable and every registry link external", () => {
        for (const hotel of travel.hotels) {
            expect(hotel.name, "hotel name").not.toBe("")
            expect(hotel.distance, `${hotel.name} distance`).not.toBe("")
            expect(hotel.url, `${hotel.name} link`).toMatch(/^https:\/\//)
        }
        for (const link of registry.links) {
            expect(link.url, `${link.name} link`).toMatch(/^https:\/\//)
        }
    })

    it("keeps the reply card able to deliver: email field plus the two required selects", () => {
        // The managed-forms detail form submits on the email field; without
        // one the reply card would render but never send.
        const email = rsvp.fields.find((field) => field.type === "email")
        expect(email, "the reply card needs an email field").toBeDefined()
        expect(email?.required).toBe(true)
        // The two answers the couple actually plans around.
        const attending = rsvp.fields.find((field) => field.name === "attending")
        expect(attending?.type).toBe("select")
        expect(attending?.required).toBe(true)
        expect(attending?.options?.length).toBeGreaterThanOrEqual(2)
        const guests = rsvp.fields.find((field) => field.name === "guests")
        expect(guests?.type).toBe("select")
        expect(guests?.required).toBe(true)
    })

    it("gives every party member their line", () => {
        for (const member of party.members) {
            expect(member.name, "member name").not.toBe("")
            expect(member.role, `${member.name} role`).not.toBe("")
            expect(member.bio, `${member.name} bio`).not.toBe("")
        }
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
