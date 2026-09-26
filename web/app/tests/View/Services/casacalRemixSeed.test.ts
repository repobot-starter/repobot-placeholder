import path from "node:path"
import { describe, expect, it } from "vitest"
import casacalCatalog from "../../../../../packs/services-painting-casacal/catalog.json"
import { parseAppointmentsContent } from "../../../src/View/Landing/practiceDocument"
import * as casacal from "../../../src/View/Services/casacalRemix.content"
import * as painting from "../../../src/View/Services/paintingSwissRemix.content"
import * as koen from "../../../src/View/Services/koenRemix.content"
import { publicAssetPresent } from "../../helpers/publicAssets"

/**
 * The services-painting-casacal seed (Casa Cal, a Santa Barbara lime
 * plaster studio) beyond the shared parity gate in
 * restyleRemixSeeds.test.ts: its home is the room stack, so every room
 * must be a real photograph at the hero's size with its line, and the
 * closing must ask for a visit.
 */

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

describe("services casacal remix seed", () => {
    const stack = casacal.home.stack

    it("sets the stack home: the hero's line, three or more rooms, the closing ask", () => {
        expect(casacal.home.headline).toBe("Walls with weather in them.")
        expect(stack.frames.length).toBeGreaterThanOrEqual(3)
        expect(stack.closing).not.toBe("")
        expect(stack.closingCta).not.toBe("")
    })

    it("captions every room with its place and finish", () => {
        for (const frame of stack.frames) {
            expect(frame.caption, frame.image.src).toMatch(/^.+ — .+$/)
        }
    })

    it("shoots every room at the hero's size, real under the seed's own directory", () => {
        const ratio = casacal.home.heroImage.width / casacal.home.heroImage.height
        for (const { image } of stack.frames) {
            expect(image.width / image.height, image.src).toBeCloseTo(ratio, 2)
            expect(image.alt, `${image.src} alt`).not.toBe("")
            expect(image.src.startsWith("/services-painting-casacal/")).toBe(true)
            for (const entry of image.srcSet) {
                expect(publicAssetPresent(path.join(PUBLIC_DIR, entry.src)), entry.src).toBe(true)
            }
        }
    })

    it("leaves the storefront home's lists empty: no grid, teaser, strip, or banner photo", () => {
        expect(casacal.home.serviceGrid).toBe(false)
        expect(casacal.home.featuredProjects).toHaveLength(0)
        expect(casacal.home.proofMetrics).toHaveLength(0)
        expect(casacal.home.bannerImage).toBeNull()
        expect(casacal.nowBuilding).toHaveLength(0)
        expect(casacal.palette.items).toHaveLength(0)
    })

    it("prices the three lime finishes and the sample boards", () => {
        const titles = casacal.services.map((service) => service.title.toLowerCase()).join("\n")
        for (const finish of ["limewash", "tadelakt", "marmorino", "sample boards"]) {
            expect(titles).toContain(finish)
        }
        for (const service of casacal.services) {
            expect(service.priceNote, service.slug).toMatch(/\$\d/)
        }
    })

    it("keeps its own booking voice and a working appointments twin", () => {
        expect(casacal.booking.privacyNote).not.toBe("")
        for (const sibling of [painting, koen]) {
            expect(casacal.booking.privacyNote).not.toBe(sibling.booking.privacyNote)
        }
        expect(casacalCatalog.content.appointments).toEqual(casacal.codeAppointments)
        expect(parseAppointmentsContent({ appointments: casacal.codeAppointments })).toEqual(
            casacal.codeAppointments,
        )
    })

    it("pins the limewash register and the stack home skeleton", () => {
        expect(casacalCatalog.landing.style.preset).toBe("limewash")
        expect(casacalCatalog.landing.pages.home.sections.map((section) => section.id)).toEqual([
            "hero",
            "rooms",
            "quote-banner",
        ])
    })
})
