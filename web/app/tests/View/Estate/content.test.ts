import path from "node:path"
import { describe, expect, it } from "vitest"
import { publicAssetPresent } from "../../helpers/publicAssets"
import {
    about,
    agency,
    contact,
    home,
    listings,
    metrics,
    neighborhoods,
    testimonials,
    type SiteImage,
} from "../../../src/View/Estate/content"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

/** Every image slot the site can render, labeled for failure messages. */
function allImages(): { label: string; image: SiteImage }[] {
    return [
        { label: "home.heroImage", image: home.heroImage },
        { label: "about.photo", image: about.photo },
        ...listings.map((listing) => ({ label: `listing ${listing.slug}`, image: listing.image })),
        ...neighborhoods.map((hood) => ({ label: `neighborhood ${hood.slug}`, image: hood.image })),
    ]
}

describe("estate content", () => {
    it("ships the identity an agent site can't render without", () => {
        expect(agency.name).not.toBe("")
        expect(agency.agent).not.toBe("")
        expect(agency.phone).not.toBe("")
        // Click-to-call is the pack's point: the href must be a tel: link
        // for the number the site displays.
        expect(agency.phoneHref).toMatch(/^tel:\+?[0-9]+$/)
        // The license and fair-housing line renders wherever trust is
        // being earned — the footer, the metrics strip, the about bullets.
        expect(agency.license).not.toBe("")
    })

    it("meets the content contract's minimums", () => {
        // packs/estate/catalog.json contentContract — the module satisfies
        // the contract; the contract never drifts ahead of it.
        expect(listings.length).toBeGreaterThanOrEqual(4)
        expect(neighborhoods.length).toBeGreaterThanOrEqual(2)
        expect(metrics.length).toBeGreaterThanOrEqual(2)
        expect(testimonials.length).toBeGreaterThanOrEqual(2)
        expect(about.paragraphs.length).toBeGreaterThanOrEqual(2)
        expect(about.credentials.length).toBeGreaterThanOrEqual(1)
        expect(contact.headline).not.toBe("")
        expect(contact.body).not.toBe("")
    })

    it("keeps listing and neighborhood slugs unique and URL-safe", () => {
        const listingSlugs = listings.map((listing) => listing.slug)
        expect(new Set(listingSlugs).size).toBe(listingSlugs.length)
        const hoodSlugs = neighborhoods.map((hood) => hood.slug)
        expect(new Set(hoodSlugs).size).toBe(hoodSlugs.length)
        for (const slug of [...listingSlugs, ...hoodSlugs]) {
            expect(slug).toMatch(/^[a-z0-9-]+$/)
        }
    })

    it("keeps every listing's facts well-formed for the computed badges", () => {
        for (const listing of listings) {
            expect(listing.title, `${listing.slug} title`).not.toBe("")
            expect(listing.neighborhood, `${listing.slug} neighborhood`).not.toBe("")
            expect(listing.price, `${listing.slug} price`).toMatch(/^\$/)
            expect(listing.beds, `${listing.slug} beds`).toBeGreaterThan(0)
            expect(listing.baths, `${listing.slug} baths`).toBeGreaterThan(0)
            expect(listing.sqft, `${listing.slug} sqft`).toBeGreaterThan(0)
            // The engine parses these dates — a malformed one would make
            // every badge on the card silently wrong.
            expect(listing.listedAt, `${listing.slug} listedAt`).toMatch(/^\d{4}-\d{2}-\d{2}$/)
            if (listing.status === "sold") {
                expect(listing.soldAt, `${listing.slug} sold listings carry soldAt`).toMatch(
                    /^\d{4}-\d{2}-\d{2}$/,
                )
                expect(
                    new Date(listing.soldAt as string).getTime(),
                    `${listing.slug} sells after it lists`,
                ).toBeGreaterThan(new Date(listing.listedAt).getTime())
            }
        }
    })

    it("ships the inventory in every state the badges can render", () => {
        // The demo is the pack's showroom: a visitor should see the live,
        // pending, and sold pills side by side without editing anything.
        const statuses = new Set(listings.map((listing) => listing.status))
        expect(statuses).toContain("available")
        expect(statuses).toContain("pending")
        expect(statuses).toContain("sold")
    })

    it("gives every neighborhood its pitch", () => {
        for (const hood of neighborhoods) {
            expect(hood.name, `${hood.slug} name`).not.toBe("")
            expect(hood.tagline, `${hood.slug} tagline`).not.toBe("")
            expect(hood.description, `${hood.slug} description`).not.toBe("")
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

    it("keeps the home rail drawn from real, still-available listings", () => {
        expect(home.featuredListings.length).toBeGreaterThan(0)
        for (const featured of home.featuredListings) {
            expect(listings).toContain(featured)
            // A sold house leading the home page reads as a stale site.
            expect(featured.status, `${featured.slug} should still be available`).toBe("available")
        }
    })
})
