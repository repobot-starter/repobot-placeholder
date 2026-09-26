import path from "node:path"
import { describe, expect, it } from "vitest"
import servicesRecurringCatalog from "../../../../../packs/services-recurring/catalog.json"
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
    book,
    booking,
    business,
    codeAppointments,
    faq,
    gallery,
    home,
    included,
    metrics,
    planComparison,
    plans,
    roomReady,
    serviceArea,
    testimonials,
    turnover,
    weeklyHours,
    type SiteImage,
} from "../../../src/View/ServicesRecurring/content"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

/** Every image slot the site can render, labeled for failure messages. */
function allImages(): { label: string; image: SiteImage }[] {
    return [
        { label: "home.heroImage", image: home.heroImage },
        { label: "about.photo", image: about.photo },
        ...gallery.map((entry, index) => ({ label: `gallery ${index}`, image: entry.image })),
        ...turnover.steps.flatMap((step, index) =>
            step.image !== undefined ? [{ label: `turnover step ${index}`, image: step.image }] : [],
        ),
        ...(roomReady.photo ? [{ label: "roomReady.photo", image: roomReady.photo }] : []),
    ]
}

describe("services-recurring content", () => {
    it("ships the business identity a home-services site can't render without", () => {
        expect(business.name).not.toBe("")
        expect(business.phone).not.toBe("")
        expect(business.phoneHref).toMatch(/^tel:\+?[0-9]+$/)
        expect(business.license).not.toBe("")
        expect(serviceArea.length).toBeGreaterThan(0)
    })

    it("meets the content contract's minimums", () => {
        // packs/services-recurring/catalog.json contentContract — the module
        // satisfies the contract; the contract never drifts ahead of it.
        expect(plans.length).toBeGreaterThanOrEqual(2)
        expect(testimonials.length).toBeGreaterThanOrEqual(2)
        expect(faq.length).toBeGreaterThanOrEqual(3)
        expect(about.paragraphs.length).toBeGreaterThanOrEqual(2)
        expect(about.credentials.length).toBeGreaterThanOrEqual(1)
        expect(book.headline).not.toBe("")
        expect(book.body).not.toBe("")
    })

    it("tells one home story in full: the turnover day, or the classic subscription trio", () => {
        // The contract's middle is either/or (every one of these slots is
        // min 0 because the builders drop an empty section) — but a seed
        // must fill one story completely, or the home page reads hollow.
        const turnoverStory = turnover.steps.length > 0 || roomReady.items.length > 0
        if (turnoverStory) {
            expect(turnover.title, "turnover title").not.toBe("")
            expect(turnover.steps.length, "turnover steps").toBeGreaterThanOrEqual(3)
            expect(roomReady.title, "roomReady title").not.toBe("")
            expect(roomReady.cardTitle, "roomReady card title").not.toBe("")
            expect(roomReady.items.length, "roomReady items").toBeGreaterThanOrEqual(3)
            for (const step of turnover.steps) {
                expect(step.time, `${step.title} time`).not.toBe("")
                expect(step.image, `${step.title} photo`).toBeDefined()
            }
        } else {
            expect(included.length).toBeGreaterThanOrEqual(4)
            expect(gallery.length).toBeGreaterThanOrEqual(2)
            expect(metrics.length).toBeGreaterThanOrEqual(2)
        }
    })

    it("keeps plan slugs unique and every plan honestly priced", () => {
        const slugs = plans.map((plan) => plan.slug)
        expect(new Set(slugs).size).toBe(slugs.length)
        for (const plan of plans) {
            expect(plan.slug).toMatch(/^[a-z0-9-]+$/)
            expect(plan.name, `${plan.slug} name`).not.toBe("")
            expect(plan.perVisit, `${plan.slug} per-visit price`).toBeGreaterThan(0)
            expect(plan.features.length, `${plan.slug} features`).toBeGreaterThan(0)
        }
        // Exactly one plan wears the recommendation treatment.
        expect(plans.filter((plan) => plan.highlighted).length).toBe(1)
    })

    it("keeps the comparison table squared to its plans", () => {
        // One label column plus one column per plan, and every row carries
        // exactly one value per plan — a ragged table renders as a lie.
        expect(planComparison.columns.length).toBe(plans.length + 1)
        expect(planComparison.columns[0]).toBe("")
        for (const row of planComparison.rows) {
            expect(row.label, "comparison row label").not.toBe("")
            expect(row.values.length, `row "${row.label}" needs one value per plan`).toBe(plans.length)
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

    it("keeps the weekly hours well-formed for the live badge", () => {
        expect(weeklyHours.length).toBeGreaterThan(0)
        for (const day of weeklyHours) {
            expect(day.day).toBeGreaterThanOrEqual(0)
            expect(day.day).toBeLessThanOrEqual(6)
            for (const [open, close] of day.intervals) {
                expect(open, `day ${day.day} opens in range`).toBeGreaterThanOrEqual(0)
                expect(close, `day ${day.day} closes in range`).toBeLessThanOrEqual(1440)
                expect(open, `day ${day.day} opens before it closes`).toBeLessThan(close)
            }
        }
    })
})

describe("services-recurring booking content", () => {
    it("meets the content contract's minimums", () => {
        // packs/services-recurring/catalog.json contentContract — the
        // module satisfies the contract; the contract never drifts ahead
        // of it.
        expect(codeAppointments.types.length).toBeGreaterThanOrEqual(2)
        expect(codeAppointments.providers.length).toBeGreaterThanOrEqual(1)
        expect(booking.headline).not.toBe("")
        expect(booking.intro).not.toBe("")
        expect(booking.statusLabels.new).not.toBe("")
        expect(booking.statusLabels.returning).not.toBe("")
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
        const seed = composedContentSeed("services-recurring", servicesRecurringCatalog.content)
        expect(seed.appointments).toEqual(codeAppointments)
    })

    it("keeps every availability window inside a day and inside business hours", () => {
        for (const provider of codeAppointments.providers) {
            for (const window of provider.windows) {
                const label = `${provider.providerId} day ${window.day}`
                expect(window.day, label).toBeGreaterThanOrEqual(0)
                expect(window.day, label).toBeLessThanOrEqual(6)
                expect(window.start, label).toBeGreaterThanOrEqual(0)
                expect(window.end, label).toBeLessThanOrEqual(24 * 60)
                expect(window.end, label).toBeGreaterThan(window.start)
                // Every bookable window sits inside a posted business day —
                // the live "Open now" badge and the calendar never disagree.
                const hours = weeklyHours.find((day) => day.day === window.day)
                expect(hours, `${label} must land on a posted business day`).toBeDefined()
                const inside = hours!.intervals.some(
                    ([open, close]) => window.start >= open && window.end <= close,
                )
                expect(inside, `${label} must sit inside posted hours`).toBe(true)
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
