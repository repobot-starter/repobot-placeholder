import path from "node:path"
import { describe, expect, it } from "vitest"
import landscapeCatalog from "../../../../../packs/services-landscape-native/catalog.json"
import { parseAppointmentsContent } from "../../../src/View/Landing/practiceDocument"
import { publicAssetPresent } from "../../helpers/publicAssets"
import * as base from "../../../src/View/Services/content"
import * as landscape from "../../../src/View/Services/landscapeNativeRemix.content"
import * as hair from "../../../src/View/Services/hairBraidsRemix.content"
import * as makeup from "../../../src/View/Services/makeupCounterRemix.content"
import * as painting from "../../../src/View/Services/paintingSwissRemix.content"

/**
 * The services-landscape-native seed (Wild Ground, an Austin native-plant studio)
 * beyond the shared parity gate in restyleRemixSeeds.test.ts: it is the one skin
 * that keeps the base pack's title card, so it must feed every section the
 * title-card home draws on — the ticker, the year-in-a-meadow rail, the
 * plant index, the closing banner — and answer the questions a lawn owner
 * actually asks before tearing one out.
 */

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")
const PUBLIC_PREFIX = "/services-landscape-native/"

type ContentModule = typeof base

const module_: ContentModule = landscape

function expectOwnedImage(label: string, image: base.SiteImage) {
    expect(image.alt, `${label} needs alt text`).not.toBe("")
    expect(image.src.startsWith(PUBLIC_PREFIX), `${label} must live under ${PUBLIC_PREFIX}`).toBe(true)
    expect(
        image.srcSet.map((entry) => entry.src),
        `${label} src must be a srcSet variant`,
    ).toContain(image.src)
    for (const entry of image.srcSet) {
        expect(publicAssetPresent(path.join(PUBLIC_DIR, entry.src)), `${label}: missing ${entry.src}`).toBe(
            true,
        )
    }
}

describe("services landscape remix seed", () => {
    it("ships the title card: headline over the photograph, credit, and caption stamp", () => {
        expect(module_.home.hero.storefront).toBe(false)
        expect(module_.home.headline).toBe("Let it grow wild.")
        expect(module_.home.hero.credit).not.toBe("")
        expect(module_.home.hero.caption).toBe("No lawns since 2014")
    })

    it("feeds the ticker, the meadow rail, and the plant index from its own photographs", () => {
        expect(module_.nowBuilding.length).toBeGreaterThanOrEqual(2)
        expect(module_.buildLog.steps.length).toBeGreaterThanOrEqual(3)
        for (const step of module_.buildLog.steps) {
            expect(step.label.length, `${step.title} label`).toBeLessThanOrEqual(10)
            expectOwnedImage(`buildLog ${step.label}`, step.image)
        }
        expect(module_.species.items).toHaveLength(4)
        for (const plant of module_.species.items) {
            expect(plant.use, `${plant.name} use`).not.toBe("")
            expect(plant.image.height, `${plant.name} plate must be portrait`).toBeGreaterThan(
                plant.image.width,
            )
            expectOwnedImage(`species ${plant.name}`, plant.image)
        }
        expect(module_.home.bannerImage).not.toBeNull()
        if (module_.home.bannerImage !== null) {
            expectOwnedImage("home.bannerImage", module_.home.bannerImage)
        }
    })

    it("leaves the color deck to the painters", () => {
        expect(module_.palette.items).toHaveLength(0)
    })

    it("answers the lawn owner's questions: HOA rules, water bills, fill-in time, deer", () => {
        const questions = module_.faq.map((entry) => entry.question).join("\n")
        expect(questions).toMatch(/HOA/)
        expect(questions).toMatch(/water bill/i)
        expect(questions).toMatch(/fills? in/i)
        expect(questions).toMatch(/deer/i)
    })

    it("prices honestly: every service carries a starting figure", () => {
        for (const service of module_.services) {
            expect(service.priceNote, `${service.slug} price`).toMatch(/\$\d/)
        }
    })

    it("keeps its own booking voice and a working appointments twin", () => {
        // content.ts IS this seed in the composed tree, so the sibling skins are the comparison.
        expect(module_.booking.privacyNote).not.toBe("")
        for (const sibling of [hair, makeup, painting]) {
            expect(module_.booking.privacyNote).not.toBe(sibling.booking.privacyNote)
        }
        expect(landscapeCatalog.content.appointments).toEqual(module_.codeAppointments)
        expect(parseAppointmentsContent({ appointments: module_.codeAppointments })).toEqual(
            module_.codeAppointments,
        )
    })

    it("asks the quote form about the yard and the HOA", () => {
        const names = module_.quote.fields.map((field) => field.name)
        expect(names).toEqual(expect.arrayContaining(["name", "email", "yard", "hoa"]))
        expect(module_.quote.fields.find((field) => field.name === "email")?.type).toBe("email")
    })

    it("pins the riso register", () => {
        expect(landscapeCatalog.landing.style.preset).toBe("riso")
    })
})
