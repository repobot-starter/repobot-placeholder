import path from "node:path"
import { describe, expect, it } from "vitest"
import servicesEmergencyCatalog from "../../../../../packs/services-emergency/catalog.json"
import {
    APPOINTMENT_MAX_DURATION,
    APPOINTMENT_MIN_DURATION,
    generateAppointmentSlots,
    MAX_APPOINTMENT_SLOTS,
    parseAppointmentsContent,
    PRACTICE_ID_PATTERN,
} from "../../../src/View/Landing/practiceDocument"
import { composedContentSeed } from "../../helpers/composedSeed"
import { publicAssetPresent } from "../../helpers/publicAssets"
import {
    about,
    booking,
    business,
    codeAppointments,
    faq,
    heroThread,
    home,
    jobReports,
    metrics,
    request,
    serviceArea,
    services,
    steps,
    testimonials,
    type SiteImage,
} from "../../../src/View/ServicesEmergency/content"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

/** Every image slot the site can render, labeled for failure messages. */
function allImages(): { label: string; image: SiteImage }[] {
    return [
        ...(home.heroImage ? [{ label: "home.heroImage", image: home.heroImage }] : []),
        { label: "about.photo", image: about.photo },
        ...services.map((service) => ({ label: `service ${service.slug}`, image: service.image })),
        ...jobReports.items.flatMap((report) => [
            { label: `report ${report.jobNumber} before`, image: report.before },
            { label: `report ${report.jobNumber} after`, image: report.after },
        ]),
        ...heroThread.messages.flatMap((message, index) =>
            message.photo ? [{ label: `heroThread message ${index} photo`, image: message.photo }] : [],
        ),
    ]
}

describe("services-emergency content", () => {
    it("ships the business identity a dispatch site can't render without", () => {
        expect(business.name).not.toBe("")
        expect(business.phone).not.toBe("")
        // Click-to-call is the pack's point: the href must be a tel: link
        // for the number the site displays.
        expect(business.phoneHref).toMatch(/^tel:\+?[0-9]+$/)
        expect(business.license).not.toBe("")
        expect(business.dispatchBadge).not.toBe("")
        expect(serviceArea.length).toBeGreaterThan(0)
    })

    it("meets the content contract's minimums", () => {
        // packs/services-emergency/catalog.json contentContract — the module
        // satisfies the contract; the contract never drifts ahead of it.
        expect(services.length).toBeGreaterThanOrEqual(3)
        expect(metrics.length).toBeGreaterThanOrEqual(2)
        expect(steps.items.length).toBeGreaterThanOrEqual(3)
        expect(testimonials.length).toBeGreaterThanOrEqual(2)
        expect(faq.length).toBeGreaterThanOrEqual(3)
        expect(about.paragraphs.length).toBeGreaterThanOrEqual(2)
        expect(about.credentials.length).toBeGreaterThanOrEqual(1)
        expect(request.headline).not.toBe("")
        expect(request.body).not.toBe("")
    })

    it("keeps service slugs unique and URL-safe", () => {
        const slugs = services.map((service) => service.slug)
        expect(new Set(slugs).size).toBe(slugs.length)
        for (const slug of slugs) {
            expect(slug).toMatch(/^[a-z0-9-]+$/)
        }
    })

    it("ships every service with a description and a flat price note", () => {
        for (const service of services) {
            expect(service.title, `${service.slug} title`).not.toBe("")
            expect(service.description, `${service.slug} description`).not.toBe("")
            // The shape's credibility rests on printed prices: every card
            // says something honest about cost, even when it's "no
            // after-hours upcharge".
            expect(service.priceNote, `${service.slug} price note`).not.toBe("")
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

describe("services-emergency booking content", () => {
    it("meets the content contract's minimums", () => {
        // packs/services-emergency/catalog.json contentContract — the
        // module satisfies the contract; the contract never drifts ahead
        // of it.
        expect(codeAppointments.types.length).toBeGreaterThanOrEqual(2)
        expect(codeAppointments.providers.length).toBeGreaterThanOrEqual(1)
        expect(booking.headline).not.toBe("")
        expect(booking.intro).not.toBe("")
        expect(booking.statusLabels.new).not.toBe("")
        expect(booking.statusLabels.returning).not.toBe("")
    })

    it("keeps the emergency line first: the booking copy routes emergencies to the phone", () => {
        // The dispatch trade's calendar only carries what can WAIT — the
        // widget's intro must keep saying so, or a burst pipe books a
        // Thursday slot instead of dialing the 24/7 line.
        expect(booking.intro.toLowerCase()).toContain("call")
    })

    it("parses contract-clean: the code fallback IS a valid appointments document", () => {
        // The export is contract-shaped on purpose — an owner's Manage
        // edit and this file walk the same rendering path, so the code
        // content must survive its own domain parser without a single
        // visit type (or the whole appointments domain) dropping.
        const parsed = parseAppointmentsContent({ appointments: codeAppointments })
        expect(parsed).toEqual(codeAppointments)
    })

    it("mirrors the catalog's content seed entry for entry", () => {
        // The seed compose stamps into repobot.content.json must be a
        // structural twin of the module: a freshly composed template books
        // identically from the document or the code fallback, and Manage
        // opens on exactly the visits the site already offers.
        //
        // The twin is the seed of the pack THIS tree was composed for: a
        // remix of this pack replaces the module with its own contentSeed
        // and reseeds `appointments` in its catalog, so comparing the base
        // catalog here would fail every remix tree by construction.
        const seed = composedContentSeed("services-emergency", servicesEmergencyCatalog.content)
        expect(seed.appointments).toEqual(codeAppointments)
    })

    it("keeps every availability window inside a day", () => {
        for (const provider of codeAppointments.providers) {
            for (const window of provider.windows) {
                const label = `${provider.providerId} day ${window.day}`
                expect(window.day, label).toBeGreaterThanOrEqual(0)
                expect(window.day, label).toBeLessThanOrEqual(6)
                expect(window.start, label).toBeGreaterThanOrEqual(0)
                expect(window.end, label).toBeLessThanOrEqual(24 * 60)
                expect(window.end, label).toBeGreaterThan(window.start)
            }
        }
    })

    it("keeps ids on the contract grammar and durations bookable", () => {
        for (const type of codeAppointments.types) {
            expect(type.typeId).toMatch(PRACTICE_ID_PATTERN)
            expect(type.name).not.toBe("")
            expect(type.description).not.toBe("")
            expect(type.durationMinutes).toBeGreaterThanOrEqual(APPOINTMENT_MIN_DURATION)
            expect(type.durationMinutes).toBeLessThanOrEqual(APPOINTMENT_MAX_DURATION)
            expect(Number.isInteger(type.durationMinutes)).toBe(true)
        }
        for (const provider of codeAppointments.providers) {
            expect(provider.providerId).toMatch(PRACTICE_ID_PATTERN)
            expect(provider.name).not.toBe("")
        }
        // The projection must produce a real week's worth of slots without
        // hitting the deterministic-truncation ceiling — a truncated week
        // would silently drop late-week availability.
        const slots = generateAppointmentSlots(codeAppointments)
        expect(slots.length).toBeGreaterThan(0)
        expect(slots.length).toBeLessThan(MAX_APPOINTMENT_SLOTS)
    })

    it("keeps user-facing booking copy free of platform naming", () => {
        const copy = JSON.stringify({ booking, codeAppointments })
        expect(copy).not.toMatch(/repobot/i)
        expect(copy).not.toMatch(/\bbot\b/i)
    })
})
