import path from "node:path"
import { describe, expect, it } from "vitest"
import influencerCatalog from "../../../../../packs/influencer/catalog.json"
import { isValidLinkUrl, linkCategories, parseContentLinks } from "../../../src/View/Landing/linksDocument"
import { lookCategories, parseContentLooks } from "../../../src/View/Landing/looksDocument"
import { publicAssetPresent } from "../../helpers/publicAssets"
import {
    about,
    collaborations,
    contact,
    creator,
    home,
    links,
    looks,
    metrics,
    platforms,
    testimonials,
    type SiteImage,
} from "../../../src/View/Influencer/content"
import { codeLinkHub, codeLooks, withLookImages } from "../../../src/View/Influencer/inventory"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

/** Every image slot the site can render, labeled for failure messages. */
function allImages(): { label: string; image: SiteImage }[] {
    return [
        { label: "home.heroImage", image: home.heroImage },
        { label: "about.photo", image: about.photo },
        ...looks.map((look) => ({ label: `look ${look.slug}`, image: look.image })),
    ]
}

describe("influencer content", () => {
    it("ships the identity a creator site can't render without", () => {
        expect(creator.name).not.toBe("")
        // The handle renders wherever the platforms are named.
        expect(creator.handle).toMatch(/^@/)
        expect(creator.email).not.toBe("")
        // The audience line renders wherever trust is being earned — the
        // footer, the metrics strip, the about bullets.
        expect(creator.credentialLine).not.toBe("")
    })

    it("meets the content contract's minimums", () => {
        // packs/influencer/catalog.json contentContract — the module
        // satisfies the contract; the contract never drifts ahead of it.
        expect(links.length).toBeGreaterThanOrEqual(5)
        expect(looks.length).toBeGreaterThanOrEqual(4)
        expect(platforms.length).toBeGreaterThanOrEqual(3)
        expect(metrics.length).toBeGreaterThanOrEqual(3)
        expect(collaborations.length).toBeGreaterThanOrEqual(3)
        expect(testimonials.length).toBeGreaterThanOrEqual(3)
        expect(about.paragraphs.length).toBeGreaterThanOrEqual(2)
        expect(contact.headline).not.toBe("")
        expect(contact.body).not.toBe("")
    })

    it("keeps every hub link valid under the links domain's parser", () => {
        // The hub IS the contract shape: the kernel's parser must accept
        // every entry, or a Manage round-trip would silently drop links
        // the code path renders.
        expect(parseContentLinks({ links: { entries: links } })).toEqual(links)
    })

    it("keeps every look valid under the looks domain's parser", () => {
        // The gallery IS the contract shape (plus its photograph): same
        // round-trip discipline as the hub.
        const facts = looks.map(({ image: _image, ...entry }) => entry)
        expect(parseContentLooks({ looks: { entries: facts } })).toEqual(facts)
    })

    it("mirrors the catalog's links seed entry for entry, in the same order", () => {
        // ORDER IS THE CONTENT for the hub: the compose seed and the code
        // fallback must be twins INCLUDING order, so the composed
        // template's Manage surface opens on exactly the hub the site
        // renders, current drop first.
        expect(influencerCatalog.content.links.entries).toEqual(links)
    })

    it("mirrors the catalog's looks seed entry for entry (minus photographs)", () => {
        // Images stay out of the contract by design — the pack joins them
        // back by slug (inventory.ts).
        const facts = looks.map(({ image: _image, ...entry }) => entry)
        expect(influencerCatalog.content.looks.entries).toEqual(facts)
    })

    it("uses https for every URL the site can render — hub, product links, platforms", () => {
        for (const link of links) {
            expect(isValidLinkUrl(link.url), `${link.slug} url`).toBe(true)
        }
        for (const look of looks) {
            for (const piece of look.productLinks ?? []) {
                expect(isValidLinkUrl(piece.url), `${look.slug} → ${piece.label}`).toBe(true)
            }
        }
        for (const platform of platforms) {
            expect(isValidLinkUrl(platform.url), `${platform.name} url`).toBe(true)
        }
    })

    it("derives real taxonomies: several shelves on each domain, each spelled once", () => {
        const lookShelves = lookCategories(looks)
        // The filterable grid is the pack's signature — a one-category
        // gallery would render a pointless chip row.
        expect(lookShelves.length).toBeGreaterThanOrEqual(3)
        const linkGroups = linkCategories(links)
        expect(linkGroups.length).toBeGreaterThanOrEqual(2)
        // Categories are the filter axis: near-duplicate spellings would
        // split one shelf into two chips.
        for (const categories of [lookShelves, linkGroups]) {
            const folded = categories.map((category) => category.toLowerCase().trim())
            expect(new Set(folded).size).toBe(folded.length)
        }
    })

    it("keeps link and look slugs unique and URL-safe", () => {
        const slugs = [...links.map((link) => link.slug), ...looks.map((look) => look.slug)]
        expect(new Set(slugs).size).toBe(slugs.length)
        for (const slug of slugs) {
            expect(slug).toMatch(/^[a-z0-9-]+$/)
        }
    })

    it("gives every look its facts and every link its destination", () => {
        for (const look of looks) {
            expect(look.title, `${look.slug} title`).not.toBe("")
            expect(look.category, `${look.slug} category`).not.toBe("")
            expect(look.description, `${look.slug} description`).not.toBe("")
            // A shoppable look needs at least one piece; the domain caps at 8.
            expect(look.productLinks?.length ?? 0, `${look.slug} pieces`).toBeGreaterThan(0)
            expect(look.productLinks?.length ?? 0, `${look.slug} pieces cap`).toBeLessThanOrEqual(8)
        }
        for (const link of links) {
            expect(link.title, `${link.slug} title`).not.toBe("")
            expect(link.description, `${link.slug} description`).not.toBe("")
        }
    })

    it("features some of the looks but not all of them", () => {
        // The home rail is a curation: everything featured reads as no
        // curation at all, nothing featured empties the rail.
        const featured = looks.filter((look) => look.featured === true)
        expect(featured.length).toBeGreaterThan(0)
        expect(featured.length).toBeLessThan(looks.length)
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

    it("joins photographs back by slug, signature image for unknown slugs", () => {
        // The inventory join: a document edit keeps its code photograph;
        // a look minted in Manage renders under the signature image until
        // a photograph is produced for its slug.
        expect(codeLooks()).toEqual(looks)
        expect(codeLinkHub()).toEqual(links)
        const facts = looks.map(({ image: _image, ...entry }) => entry)
        expect(withLookImages(facts)).toEqual(looks)
        const minted = withLookImages([{ slug: "brand-new", title: "New Look", category: "Everyday" }])
        expect(minted[0].image).toEqual(home.heroImage)
    })
})
