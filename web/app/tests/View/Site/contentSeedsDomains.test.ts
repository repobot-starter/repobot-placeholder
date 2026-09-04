import { describe, expect, it } from "vitest"
import bandCatalog from "../../../../../packs/band/catalog.json"
import churchCatalog from "../../../../../packs/church/catalog.json"
import communityCatalog from "../../../../../packs/community/catalog.json"
import djCatalog from "../../../../../packs/dj/catalog.json"
import estateCatalog from "../../../../../packs/estate/catalog.json"
import nonprofitCatalog from "../../../../../packs/nonprofit/catalog.json"
import { parseContentEvents } from "../../../src/View/Landing/eventsDocument"
import type { DatedEvent } from "../../../src/View/Landing/events"
import galaCatalog from "../../../../../packs/gala/catalog.json"
import menuCatalog from "../../../../../packs/menu/catalog.json"
import reunionCatalog from "../../../../../packs/reunion/catalog.json"
import vowsCatalog from "../../../../../packs/vows/catalog.json"
import {
    parseContentShows,
    withDerivedShowSlugs,
    type ContentShow,
} from "../../../src/View/Landing/datesDocument"
import { parseContentHours } from "../../../src/View/Landing/hoursDocument"
import { parseContentListings, type ContentListing } from "../../../src/View/Landing/listingsDocument"
import { parseContentMenu } from "../../../src/View/Landing/menuDocument"
import { menu as menuCard, weeklyHours as menuWeeklyHours } from "../../../src/View/Menu/content"
import { withEventImages as withChurchImages } from "../../../src/View/Church/calendar"
import { events as churchEvents } from "../../../src/View/Church/content"
import { withEventImages as withCommunityImages } from "../../../src/View/Community/calendar"
import { events as communityEvents } from "../../../src/View/Community/content"
import { home as estateHome, listings as estateListings } from "../../../src/View/Estate/content"
import { codeInventory, withListingImages } from "../../../src/View/Estate/inventory"
import { withEventImages as withNonprofitImages } from "../../../src/View/Nonprofit/calendar"
import { events as nonprofitEvents } from "../../../src/View/Nonprofit/content"
import { shows as bandShows } from "../../../src/View/Band/content"
import { sets as djSets } from "../../../src/View/Dj/content"
import type { ShowDate } from "../../../src/View/Music/schedule"

/**
 * The content-seed fidelity contract for the Phase-3 breadth domains —
 * the sibling of contentSeeds.test.ts (the schedule family's suite): each
 * catalog's `content` map (the seed compose stamps into
 * repobot.content.json) must be a structural twin of the pack's own
 * content.ts facts, so a freshly composed template renders identically
 * whether the page reads the document or falls back to code, and the
 * platform's Manage UI opens on exactly the facts the site already shows.
 */

describe("estate content seed (listings domain)", () => {
    function seedListings(): ContentListing[] {
        const content = (estateCatalog as { content?: unknown }).content
        const parsed = parseContentListings(content)
        expect(parsed, "the catalog's content.listings seed must parse contract-clean").toBeDefined()
        return parsed as ContentListing[]
    }

    it("mirrors the pack's content.ts inventory entry for entry", () => {
        // The facts without the photographs: imagery stays code-owned and
        // joins back by slug; the featured flag is the seed's only addition.
        const seeded = seedListings()
        expect(seeded.map(({ featured: _f, ...listing }) => listing)).toEqual(
            estateListings.map(({ image: _image, ...listing }) => listing),
        )
    })

    it("parses without dropping a single entry", () => {
        const raw = (estateCatalog as unknown as { content: { listings: { entries: unknown[] } } }).content
            .listings.entries
        expect(seedListings()).toHaveLength(raw.length)
    })

    it("flags exactly the home rail's curation as featured", () => {
        const featured = seedListings()
            .filter((listing) => listing.featured === true)
            .map((listing) => listing.slug)
        expect(featured).toEqual(estateHome.featuredListings.map((listing) => listing.slug))
    })

    it("joins back to the code inventory photograph for photograph", () => {
        // Twinhood end to end: the seed, run through the photo join, IS the
        // code-fallback inventory — a freshly composed template renders the
        // identical cards whether the page reads the document or the code.
        expect(withListingImages(seedListings())).toEqual(codeInventory())
    })
})

/**
 * The events-domain packs: each catalog seeds `content.events.entries` as
 * the pack's content.ts calendar minus the photographs (imagery stays
 * code-owned, joined back by slug in the pack's calendar.ts).
 */
const eventSeededPacks: {
    key: string
    catalog: unknown
    events: (DatedEvent & { image?: unknown })[]
    join: (resolved: DatedEvent[]) => unknown[]
}[] = [
    { key: "church", catalog: churchCatalog, events: churchEvents, join: withChurchImages },
    { key: "community", catalog: communityCatalog, events: communityEvents, join: withCommunityImages },
    { key: "nonprofit", catalog: nonprofitCatalog, events: nonprofitEvents, join: withNonprofitImages },
]

describe.each(eventSeededPacks)("$key content seed (events domain)", ({ catalog, events, join }) => {
    function seedEvents(): DatedEvent[] {
        const content = (catalog as { content?: unknown }).content
        const parsed = parseContentEvents(content)
        expect(parsed, "the catalog's content.events seed must parse contract-clean").toBeDefined()
        return parsed as DatedEvent[]
    }

    it("mirrors the pack's content.ts calendar entry for entry", () => {
        expect(seedEvents()).toEqual(events.map(({ image: _image, ...event }) => event))
    })

    it("parses without dropping a single entry", () => {
        const raw = (catalog as { content: { events: { entries: unknown[] } } }).content.events.entries
        expect(seedEvents()).toHaveLength(raw.length)
    })

    it("joins back to the code calendar photograph for photograph", () => {
        // Twinhood end to end: the seed, run through the image join, IS
        // the code-fallback calendar.
        expect(join(seedEvents())).toEqual(events)
    })
})

/**
 * The menu pack seeds two domains: hours.week (the open/closed badge's
 * input; an absent day is closed) and menu.sections (the card, prices in
 * cents). No joins — the seed must BE the content.ts facts.
 */
describe("menu content seed (hours + menu domains)", () => {
    const content = (menuCatalog as { content?: unknown }).content

    it("mirrors content.ts weeklyHours day for day", () => {
        const parsed = parseContentHours(content)
        expect(parsed, "the catalog's content.hours seed must parse contract-clean").toBeDefined()
        expect(parsed).toEqual(menuWeeklyHours)
    })

    it("mirrors content.ts menu section for section, dish for dish", () => {
        const parsed = parseContentMenu(content)
        expect(parsed, "the catalog's content.menu seed must parse contract-clean").toBeDefined()
        expect(parsed).toEqual(menuCard)
    })
})

/**
 * The invitation family (vows, gala, reunion) seeds the guestlist domain
 * EMPTY — the roster is the owner's from day one, never demo data. No
 * pack page renders it; the seed's whole job is the deploy manifest's
 * contentDomains entry, which gates the platform's Manage roster panel
 * next to the RSVP inbox it pairs with.
 */
describe.each([
    { key: "vows", catalog: vowsCatalog },
    { key: "gala", catalog: galaCatalog },
    { key: "reunion", catalog: reunionCatalog },
])("$key content seed (guestlist domain)", ({ catalog }) => {
    it("seeds an explicitly empty roster", () => {
        const content = (catalog as { content?: { guestlist?: unknown } }).content
        expect(content?.guestlist).toEqual({ entries: [] })
    })
})

/**
 * The music family (band, dj) seeds the dates domain: the pack's
 * content.ts tour lifted into contract shape, slugs minted by the
 * platform's date-city rule — so the seed IS what the fallback path
 * derives, and slugs stay stable when the Manage editor first saves.
 */
describe.each([
    { key: "band", catalog: bandCatalog as unknown, tour: bandShows as readonly ShowDate[] },
    { key: "dj", catalog: djCatalog as unknown, tour: djSets as readonly ShowDate[] },
])("$key content seed (dates domain)", ({ catalog, tour }) => {
    function seedShows(): ContentShow[] {
        const content = (catalog as { content?: unknown }).content
        const parsed = parseContentShows(content)
        expect(parsed, "the catalog's content.dates seed must parse contract-clean").toBeDefined()
        return parsed as ContentShow[]
    }

    it("mirrors the pack's content.ts tour show for show, slugs platform-minted", () => {
        // Twinhood end to end: the seed IS the code tour lifted through the
        // fallback derivation — a freshly composed template renders the
        // identical table whether the page reads the document or the code.
        expect(seedShows()).toEqual(withDerivedShowSlugs(tour))
    })

    it("parses without dropping a single show", () => {
        const raw = (catalog as { content: { dates: { entries: unknown[] } } }).content.dates.entries
        expect(seedShows()).toHaveLength(raw.length)
    })
})
