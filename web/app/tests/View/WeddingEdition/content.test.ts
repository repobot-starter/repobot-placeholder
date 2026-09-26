import path from "node:path"
import { describe, expect, it } from "vitest"
import editionCatalog from "../../../../../packs/wedding-edition/catalog.json"
import { publicAssetPresent } from "../../helpers/publicAssets"
import {
    about,
    classified,
    demoProofingAlbums,
    desksPicks,
    faq,
    home,
    inquire,
    letters,
    packages,
    photoId,
    photographer,
    proofing,
    proofingNote,
    rolls,
    stories,
    type PhotoImage,
} from "../../../src/View/WeddingEdition/content"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

/** Every image slot the site can render, labeled for failure messages. */
function allImages(): { label: string; image: PhotoImage }[] {
    return [
        ...rolls.flatMap((roll) =>
            roll.frames.map((frame, i) => ({ label: `${roll.slug}[${i}]`, image: frame.image })),
        ),
        ...stories.map((story, i) => ({ label: `stories[${i}]`, image: story.image })),
        ...demoProofingAlbums.flatMap((album) =>
            album.images.map((image, i) => ({ label: `proofing ${album.slug}[${i}]`, image })),
        ),
        { label: "home.leadPhoto", image: home.leadPhoto },
        { label: "photographer.portrait", image: photographer.portrait },
        { label: "proofingNote.image", image: proofingNote.image },
    ]
}

/** Resolve a dotted content-contract slot path against the module's exports. */
function slotValue(slotPath: string): unknown {
    const exports: Record<string, unknown> = {
        about,
        classified,
        faq,
        home,
        inquire,
        letters,
        packages,
        photographer,
        rolls,
        stories,
    }
    return slotPath.split(".").reduce<unknown>((value, key) => {
        if (value === null || typeof value !== "object") return undefined
        return (value as Record<string, unknown>)[key]
    }, exports)
}

describe("wedding-edition content", () => {
    it("ships rolls with a story, film stock, and at least four frames each", () => {
        expect(rolls.length).toBeGreaterThan(0)
        for (const roll of rolls) {
            expect(roll.title).not.toBe("")
            expect(roll.eyebrow).not.toBe("")
            expect(roll.description).not.toBe("")
            expect(roll.edgeCode).not.toBe("")
            expect(Number.isInteger(roll.firstFrame) && roll.firstFrame > 0, `${roll.slug} firstFrame`).toBe(
                true,
            )
            expect(roll.frames.length, `${roll.slug} frames`).toBeGreaterThanOrEqual(4)
        }
    })

    it("keeps roll slugs and numbers unique and URL-safe", () => {
        const slugs = rolls.map((roll) => roll.slug)
        expect(new Set(slugs).size).toBe(slugs.length)
        for (const slug of slugs) {
            expect(slug).toMatch(/^[a-z0-9-]+$/)
        }
        const numbers = rolls.map((roll) => roll.number)
        expect(new Set(numbers).size).toBe(numbers.length)
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

    it("keeps grease-pencil notes short enough to sit under a frame", () => {
        for (const roll of rolls) {
            for (const frame of roll.frames) {
                if (frame.note !== undefined) {
                    expect(frame.note.length, `${roll.slug} note "${frame.note}"`).toBeLessThanOrEqual(24)
                }
            }
        }
    })

    it("circles at least one keeper per roll, and the desk's picks are exactly the circled frames", () => {
        for (const roll of rolls) {
            expect(
                roll.frames.some((frame) => frame.mark === "circle"),
                `${roll.slug} keeper`,
            ).toBe(true)
        }
        const circled = rolls.flatMap((roll) => roll.frames.filter((frame) => frame.mark === "circle"))
        expect(desksPicks).toEqual(circled)
        expect(desksPicks.length).toBeGreaterThanOrEqual(4)
        // The sheet sets four frames across on desktop; a short last row reads as unexposed film.
        expect(desksPicks.length % 4).toBe(0)
    })

    it("runs every story off a real roll, so its jump line lands on a sheet", () => {
        expect(stories.length).toBeGreaterThanOrEqual(3)
        const slugs = new Set(rolls.map((roll) => roll.slug))
        for (const story of stories) {
            expect(story.kicker).not.toBe("")
            expect(story.headline).not.toBe("")
            expect(story.body).not.toBe("")
            expect(story.dateline).not.toBe("")
            expect(slugs.has(story.roll), `${story.headline} roll`).toBe(true)
        }
    })

    it("ships the front page's lead story and the paper's furniture", () => {
        expect(photographer.paper).not.toBe("")
        expect(photographer.name).not.toBe("")
        expect(photographer.role).not.toBe("")
        expect(photographer.motto).not.toBe("")
        expect(home.headline).not.toBe("")
        expect(home.deck).not.toBe("")
        expect(home.caption).not.toBe("")
        expect(home.issue).not.toBe("")
    })

    it("heads the about page with the house rule", () => {
        expect(about.headline).toBe("No posed photos.")
        expect(about.paragraphs.length).toBeGreaterThanOrEqual(2)
        expect(about.rules.length).toBeGreaterThanOrEqual(2)
    })
})

describe("wedding-edition rate card, classified, FAQ, and letters", () => {
    it("ships flat-priced packages with descriptions and features", () => {
        expect(packages.length).toBeGreaterThanOrEqual(2)
        for (const entry of packages) {
            expect(entry.name).not.toBe("")
            expect(entry.description).not.toBe("")
            // Flat one-off prices: positive whole dollars, never 0 ("Free"
            // would render) and never fractional cents in the price line.
            expect(entry.price, `${entry.name} price`).toBeGreaterThan(0)
            expect(Number.isInteger(entry.price), `${entry.name} price must be whole dollars`).toBe(true)
            expect(entry.features.length, `${entry.name} needs features`).toBeGreaterThanOrEqual(2)
        }
    })

    it("prices the owner's three packages", () => {
        expect(packages.map((entry) => [entry.name, entry.price])).toEqual([
            ["City Hall elopement", 1600],
            ["Party only", 3400],
            ["Full day", 5800],
        ])
    })

    it("highlights exactly one package (the page needs a spine)", () => {
        expect(packages.filter((entry) => entry.highlighted === true)).toHaveLength(1)
    })

    it("keeps the classified's quoted prices in step with the rate card", () => {
        const dollars = (price: number): string => `$${price.toLocaleString("en-US")}`
        const fullDay = packages.find((entry) => entry.highlighted === true)
        expect(fullDay).toBeDefined()
        expect(classified.price).toContain(dollars(fullDay?.price ?? 0))
        for (const entry of packages.filter((item) => item !== fullDay)) {
            expect(classified.finePrint, `${entry.name} in the fine print`).toContain(dollars(entry.price))
        }
    })

    it("answers the questions couples actually ask", () => {
        expect(faq.length).toBeGreaterThanOrEqual(5)
        for (const entry of faq) {
            expect(entry.question).not.toBe("")
            expect(entry.answer).not.toBe("")
        }
        const copy = faq
            .map((entry) => `${entry.question} ${entry.answer}`)
            .join(" ")
            .toLowerCase()
        for (const topic of ["five boroughs", "second shooter", "48 hours", "film", "retainer"]) {
            expect(copy, `FAQ covers ${topic}`).toContain(topic)
        }
    })

    it("runs testimonials as signed letters", () => {
        expect(letters.length).toBeGreaterThanOrEqual(2)
        for (const letter of letters) {
            expect(letter.quote).not.toBe("")
            expect(letter.name).not.toBe("")
            expect(letter.detail).not.toBe("")
        }
    })

    it("asks for the date, venue, borough, guest count, and vibe", () => {
        const names = inquire.fields.map((field) => field.name)
        for (const name of ["names", "email", "date", "venue", "borough", "guests", "vibe", "message"]) {
            expect(names, `inquiry field ${name}`).toContain(name)
        }
        for (const field of inquire.fields) {
            if ("type" in field && field.type === "select") {
                expect(field.options.length, `${field.name} options`).toBeGreaterThanOrEqual(2)
            }
        }
    })
})

describe("wedding-edition proofing", () => {
    it("ships demo rooms with preview PINs, clients, and images", () => {
        expect(demoProofingAlbums.length).toBeGreaterThan(0)
        for (const album of demoProofingAlbums) {
            expect(album.title).not.toBe("")
            expect(album.clientName).not.toBe("")
            expect(album.note).not.toBe("")
            // Fictional preview PIN only — published sites never consult this.
            expect(album.accessCode, `${album.slug} demo access code`).toMatch(/^\d{4,6}$/)
            expect(album.images.length).toBeGreaterThanOrEqual(4)
        }
    })

    it("keeps demo proofing slugs unique, URL-safe, and unlisted from the public rolls", () => {
        const slugs = demoProofingAlbums.map((album) => album.slug)
        expect(new Set(slugs).size).toBe(slugs.length)
        const publicSlugs = new Set(rolls.map((roll) => roll.slug))
        for (const slug of slugs) {
            expect(slug).toMatch(/^[a-z0-9-]+$/)
            expect(publicSlugs.has(slug), `${slug} collides with a public roll`).toBe(false)
        }
    })

    it("derives stable, unique frame ids inside each demo proofing album", () => {
        expect(photoId(home.leadPhoto)).toBe("lead-chairs")
        for (const album of demoProofingAlbums) {
            const ids = album.images.map((image) => photoId(image))
            expect(new Set(ids).size, `${album.slug} frame ids must be unique`).toBe(ids.length)
            for (const id of ids) {
                expect(id).toMatch(/^[a-z0-9-]+$/)
            }
        }
    })

    it("points the rate card's proofing note at a real demo room and shows its code", () => {
        const room = demoProofingAlbums.find((album) => album.slug === proofingNote.slug)
        expect(room, `demo room '${proofingNote.slug}' must exist`).toBeDefined()
        expect(proofingNote.body).toContain(room?.accessCode ?? "")
    })

    it("keeps user-facing copy free of platform naming", () => {
        const copy = JSON.stringify({
            home,
            stories,
            packages,
            classified,
            faq,
            letters,
            about,
            inquire,
            proofing,
        })
        expect(copy).not.toMatch(/repobot/i)
        expect(copy).not.toMatch(/\bbot\b/i)
    })
})

describe("wedding-edition content contract", () => {
    const contract = editionCatalog.contentContract

    it("names this module", () => {
        expect(contract.module).toBe("web/app/src/View/WeddingEdition/content.ts")
    })

    it("binds every declared slot to real content that meets its minimum", () => {
        for (const [slotPath, slot] of Object.entries(contract.slots)) {
            const value = slotValue(slotPath)
            expect(value, `slot ${slotPath}`).toBeDefined()
            const spec = slot as { kind: string; min?: number }
            if (spec.kind === "text") {
                expect(typeof value === "string" && value.length > 0, `slot ${slotPath} text`).toBe(true)
            } else if (spec.kind === "number") {
                expect(typeof value, `slot ${slotPath} number`).toBe("number")
            } else if (spec.kind === "media") {
                expect((value as PhotoImage).src, `slot ${slotPath} media`).toMatch(/^\/wedding-edition\//)
            } else {
                expect(Array.isArray(value), `slot ${slotPath} list`).toBe(true)
                expect((value as unknown[]).length, `slot ${slotPath} min`).toBeGreaterThanOrEqual(
                    spec.min ?? 0,
                )
            }
        }
    })
})
