import { describe, expect, it } from "vitest"
import paintingCatalog from "../../../../../packs/services-painting-swiss/catalog.json"
import { parseAppointmentsContent } from "../../../src/View/Landing/practiceDocument"
import * as base from "../../../src/View/Services/content"
import * as painting from "../../../src/View/Services/paintingSwissRemix.content"
import * as hair from "../../../src/View/Services/hairBraidsRemix.content"
import * as makeup from "../../../src/View/Services/makeupCounterRemix.content"
import * as landscape from "../../../src/View/Services/landscapeNativeRemix.content"

/**
 * The services-painting-swiss seed (Shotgun Color Co., a New Orleans house
 * painter) beyond the shared parity gate in restyleRemixSeeds.test.ts: its
 * signature is the color deck — five real chips under the hero — and the
 * quote form has to let a customer point at one of them.
 */

type ContentModule = typeof base

const module_: ContentModule = painting

describe("services painting remix seed", () => {
    it("ships the storefront hero with its credit line", () => {
        expect(module_.home.hero.storefront).toBe(true)
        expect(module_.home.headline).toBe("We paint loud houses.")
        expect(module_.home.hero.credit).not.toBe("")
    })

    it("deals a five-chip deck: named, numbered, true hex, one line each", () => {
        const chips = module_.palette.items
        expect(chips).toHaveLength(5)
        for (const chip of chips) {
            expect(chip.name, "chip name").not.toBe("")
            expect(chip.color, `${chip.name} color`).toMatch(/^#[0-9a-f]{6}$/i)
            expect(chip.code, `${chip.name} code`).toMatch(/^\d{3}$/)
            expect(chip.note, `${chip.name} note`).not.toBe("")
        }
        expect(new Set(chips.map((chip) => chip.code)).size).toBe(chips.length)
        expect(new Set(chips.map((chip) => chip.color.toLowerCase())).size).toBe(chips.length)
    })

    it("lets the quote form pick any chip in the deck", () => {
        const picker = module_.quote.fields.find((field) => field.label === "Pick your color")
        expect(picker?.type).toBe("select")
        for (const chip of module_.palette.items) {
            expect(
                picker?.options?.some((option) => option.includes(chip.name) && option.includes(chip.code)),
                `${chip.name} must be pickable`,
            ).toBe(true)
        }
    })

    it("drops the builder's title-card sections: no ticker, no build log, no plates", () => {
        expect(module_.nowBuilding).toHaveLength(0)
        expect(module_.buildLog.steps).toHaveLength(0)
        expect(module_.species.items).toHaveLength(0)
    })

    it("answers the New Orleans questions: humidity, historic approvals, lead paint, weather", () => {
        const questions = module_.faq.map((entry) => entry.question).join("\n")
        expect(questions).toMatch(/humid/i)
        expect(questions).toMatch(/approval/i)
        expect(questions).toMatch(/1978/)
        expect(questions).toMatch(/rain/i)
    })

    it("covers exterior, interior, porches and shutters, and historic work", () => {
        const titles = module_.services.map((service) => service.title.toLowerCase()).join("\n")
        expect(titles).toMatch(/exterior/)
        expect(titles).toMatch(/interior/)
        expect(titles).toMatch(/porch/)
        expect(titles).toMatch(/historic/)
    })

    it("keeps its own booking voice and a working appointments twin", () => {
        // content.ts IS this seed in the composed tree, so the sibling skins are the comparison.
        expect(module_.booking.privacyNote).not.toBe("")
        for (const sibling of [hair, makeup, landscape]) {
            expect(module_.booking.privacyNote).not.toBe(sibling.booking.privacyNote)
        }
        expect(paintingCatalog.content.appointments).toEqual(module_.codeAppointments)
        expect(parseAppointmentsContent({ appointments: module_.codeAppointments })).toEqual(
            module_.codeAppointments,
        )
    })

    it("pins the paintchip register", () => {
        expect(paintingCatalog.landing.style.preset).toBe("paintchip")
    })
})
