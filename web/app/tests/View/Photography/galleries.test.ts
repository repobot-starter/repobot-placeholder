import path from "node:path"
import { describe, expect, it } from "vitest"
import { demoProofingAlbums, galleries } from "../../../src/View/Photography/content"
import { publicAssetPresent } from "../../helpers/publicAssets"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

/**
 * The /galleries page's contract guards. The page is the client-facing
 * proofing explainer — it speaks to the photographer's clients, and in
 * doing so shows a photographer evaluating the template what the
 * proofing service does. Its sample card must stay walkable: it points
 * at a demo proofing room and shows that room's own preview PIN, so a
 * preview visitor can click through the real gate-and-choose flow.
 */
describe("photography client-galleries explainer", () => {
    it("ships the copy the page can't render without", () => {
        expect(galleries.headline).not.toBe("")
        expect(galleries.intro).not.toBe("")
        expect(galleries.steps.length).toBeGreaterThanOrEqual(2)
        for (const step of galleries.steps) {
            expect(step.title).not.toBe("")
            expect(step.body).not.toBe("")
        }
    })

    it("points the sample card at a real demo proofing room", () => {
        const room = demoProofingAlbums.find((album) => album.slug === galleries.sample.slug)
        expect(room, `demo room '${galleries.sample.slug}' must exist`).toBeDefined()
        // The shown access code is the room's own preview PIN — the page
        // derives it from the fixture, and this holds the two together.
        expect(galleries.sample.body).toContain(room?.accessCode ?? "")
    })

    it("fronts the sample card with a real responsive frame", () => {
        const image = galleries.sample.image
        expect(image.alt).not.toBe("")
        expect(image.width).toBeGreaterThan(0)
        expect(image.height).toBeGreaterThan(0)
        expect(image.srcSet.map((entry) => entry.src)).toContain(image.src)
        for (const entry of image.srcSet) {
            expect(
                publicAssetPresent(path.join(PUBLIC_DIR, entry.src)),
                `sample image: missing ${entry.src}`,
            ).toBe(true)
        }
    })

    it("keeps user-facing copy free of platform naming", () => {
        const copy = JSON.stringify(galleries)
        expect(copy).not.toMatch(/repobot/i)
        expect(copy).not.toMatch(/\bbot\b/i)
    })
})
