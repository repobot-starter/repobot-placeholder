import path from "node:path"
import { describe, expect, it } from "vitest"
import * as base from "../../../src/View/Vows/content"
import * as photobooth from "../../../src/View/Vows/photoboothRemix.content"
import { publicAssetPresent } from "../../helpers/publicAssets"

/**
 * The vows-photobooth remix seed's parity gate (the services family's
 * remixSeeds discipline). The seed (packs/README.md "Derived templates")
 * is composed over the vows pack's content module verbatim, so it must
 * remain a structural twin of `content.ts`: the same export surface, the
 * contract's minimums met, the sections its pinned skeleton names filled,
 * and every image real under the seed's own public directory. These
 * tests fail the moment the pack's contract moves without its seed — the
 * drift that would otherwise surface as a broken published template.
 */

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")
const PUBLIC_PREFIX = "/vows-photobooth/"

/** Deep key shape (arrays walk their first entry) — the landingCopy twin. */
function keyShape(value: unknown): unknown {
    if (Array.isArray(value)) return value.length > 0 ? [keyShape(value[0])] : []
    if (typeof value === "object" && value !== null) {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, entry]) => [key, keyShape(entry)]),
        )
    }
    return typeof value
}

/** Every image slot the site can render, labeled for failure messages. */
function allImages(): { label: string; image: photobooth.SiteImage }[] {
    const { home, story, schedule } = photobooth
    return [
        ...(home.heroImage !== undefined ? [{ label: "home.heroImage", image: home.heroImage }] : []),
        ...home.wall.flatMap((piece, index) => [
            ...(piece.image !== undefined ? [{ label: `wall[${index}]`, image: piece.image }] : []),
            ...(piece.frames ?? []).map((image, frame) => ({
                label: `wall[${index}].frames[${frame}]`,
                image,
            })),
        ]),
        ...story.chapters.flatMap((chapter) =>
            chapter.image !== undefined ? [{ label: `chapter ${chapter.title}`, image: chapter.image }] : [],
        ),
        ...story.strips.flatMap((strip) =>
            strip.frames.map((image, frame) => ({ label: `strip ${strip.label} frame ${frame}`, image })),
        ),
        ...story.gallery.map((snapshot, index) => ({ label: `gallery[${index}]`, image: snapshot.image })),
        ...schedule.venues.flatMap((venue) =>
            venue.image !== undefined ? [{ label: `venue ${venue.name}`, image: venue.image }] : [],
        ),
    ]
}

describe("vows-photobooth remix seed", () => {
    it("mirrors the base module's export surface exactly", () => {
        // The seed replaces content.ts byte-for-byte at compose time; a
        // missing or extra export is a broken page in the composed template.
        expect(Object.keys(photobooth).sort()).toEqual(Object.keys(base).sort())
    })

    it("keeps landingCopy, the couple, and home structural twins of the base's", () => {
        expect(keyShape(photobooth.landingCopy)).toEqual(keyShape(base.landingCopy))
        expect(keyShape(photobooth.couple)).toEqual(keyShape(base.couple))
        // The layout-owned slots (the classic wall and details, the quiet
        // homes' weekend, stack, and hero photograph) vary with the seed.
        const pick = ({
            wall: _wall,
            details: _details,
            weekend: _weekend,
            stack: _stack,
            heroImage: _hero,
            ...rest
        }: typeof base.home) => rest
        expect(keyShape(pick(photobooth.home))).toEqual(keyShape(pick(base.home)))
    })

    it("meets the content contract's minimums", () => {
        // packs/vows/catalog.json contentContract — inherited whole by the
        // remix (verify-pack-catalogs rejects a remix that redeclares it).
        expect(photobooth.couple.names).not.toBe("")
        expect(photobooth.couple.email).toMatch(/@/)
        expect(photobooth.couple.weddingDateIso).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(photobooth.story.chapters.length).toBeGreaterThanOrEqual(2)
        expect(photobooth.story.gallery.length).toBeGreaterThanOrEqual(3)
        expect(photobooth.schedule.days.length).toBeGreaterThanOrEqual(1)
        expect(photobooth.travel.hotels.length).toBeGreaterThanOrEqual(2)
        expect(photobooth.party.members.length).toBeGreaterThanOrEqual(2)
        expect(photobooth.rsvp.faqs.length).toBeGreaterThanOrEqual(2)
    })

    it("fills every section its pinned skeleton names", () => {
        // The zine's cover, the story rail's years, the booth strips, and
        // the captioned snapshots — an empty one would drop or blank a
        // pinned section.
        expect(photobooth.home.layout).toBe("zine")
        expect(photobooth.home.wall.length).toBeGreaterThanOrEqual(1)
        expect(photobooth.home.details.length).toBeGreaterThanOrEqual(1)
        for (const chapter of photobooth.story.chapters) expect(chapter.year, chapter.title).not.toBe("")
        expect(photobooth.story.strips.length).toBeGreaterThanOrEqual(1)
        for (const snapshot of photobooth.story.gallery) {
            expect(snapshot.caption, snapshot.image.src).not.toBe("")
        }
    })

    it("keeps every image real, described, and under the seed's own directory", () => {
        const prefix = new RegExp(`^${PUBLIC_PREFIX.replace(/[/-]/g, "\\$&")}`)
        for (const { label, image } of allImages()) {
            expect(image.alt, `${label} needs alt text`).not.toBe("")
            expect(image.src, `${label} must live under ${PUBLIC_PREFIX}`).toMatch(prefix)
            expect(
                image.srcSet.map((entry) => entry.src),
                `${label} src must be a srcSet variant`,
            ).toContain(image.src)
            for (const entry of image.srcSet) {
                expect(
                    publicAssetPresent(path.join(PUBLIC_DIR, entry.src)),
                    `${label}: missing ${entry.src}`,
                ).toBe(true)
            }
        }
    })
})
