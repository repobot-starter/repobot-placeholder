import path from "node:path"
import { describe, expect, it } from "vitest"
import musicCatalog from "../../../../../packs/photography-music/catalog.json"
import {
    APPOINTMENT_MAX_DURATION,
    APPOINTMENT_MIN_DURATION,
    generateAppointmentSlots,
    MAX_APPOINTMENT_SLOTS,
    parseAppointmentsContent,
    PRACTICE_ID_PATTERN,
} from "../../../src/View/Landing/practiceDocument"
import { publicAssetPresent } from "../../helpers/publicAssets"
import {
    albums,
    codeAppointments,
    demoProofingAlbums,
    galleries,
    heroSlides,
    photoId,
    reel,
    sessionBooking,
    about,
    type PhotoImage,
} from "../../../src/View/PhotographyMusic/content"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

/** Every image slot the site can render, labeled for failure messages. */
function allImages(): { label: string; image: PhotoImage }[] {
    return [
        ...albums.flatMap((album) =>
            album.images.map((image, i) => ({ label: `${album.slug}[${i}]`, image })),
        ),
        ...heroSlides.map((image, i) => ({ label: `heroSlides[${i}]`, image })),
        ...reel.map((image, i) => ({ label: `reel[${i}]`, image })),
        ...demoProofingAlbums.flatMap((album) =>
            album.images.map((image, i) => ({ label: `proofing ${album.slug}[${i}]`, image })),
        ),
        { label: "about.portrait", image: about.portrait },
        { label: "galleries.sample.image", image: galleries.sample.image },
    ]
}

describe("photography-music content", () => {
    it("ships albums with covers, descriptions, and at least one image each", () => {
        expect(albums.length).toBeGreaterThan(0)
        for (const album of albums) {
            expect(album.title).not.toBe("")
            expect(album.description).not.toBe("")
            expect(album.images.length).toBeGreaterThan(0)
        }
    })

    it("keeps album slugs unique and URL-safe", () => {
        const slugs = albums.map((album) => album.slug)
        expect(new Set(slugs).size).toBe(slugs.length)
        for (const slug of slugs) {
            expect(slug).toMatch(/^[a-z0-9-]+$/)
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

    it("keeps the hero and the reel populated", () => {
        expect(heroSlides.length).toBeGreaterThan(0)
        expect(reel.length).toBeGreaterThanOrEqual(4)
    })

    it("edits the reel only from frames that exist in the albums", () => {
        // The reel is a cross-album edit: pulling from the albums keeps home
        // and album pages in sync when a frame is swapped.
        const albumSrcs = new Set(albums.flatMap((album) => album.images.map((image) => image.src)))
        for (const [i, image] of reel.entries()) {
            expect(albumSrcs.has(image.src), `reel[${i}] must come from an album`).toBe(true)
        }
    })
})

/**
 * The /book slot picker's contract guards — the photography pack's
 * booking-content discipline worn by the music-photography pack.
 * `codeAppointments` is the appointments domain's code fallback and the
 * catalog's content seed is its structural twin: the platform projects
 * exactly the capacity-1 slots the sandbox simulation offers, and Manage
 * opens on exactly the sessions the site already shows.
 */
describe("photography-music booking content", () => {
    it("meets the content contract's minimums", () => {
        expect(codeAppointments.types.length).toBeGreaterThanOrEqual(2)
        expect(codeAppointments.providers.length).toBeGreaterThanOrEqual(1)
    })

    it("parses contract-clean: the code fallback IS a valid appointments document", () => {
        // The export is contract-shaped on purpose — an owner's Manage
        // edit and this file walk the same rendering path, so the code
        // content must survive its own domain parser whole.
        expect(parseAppointmentsContent({ appointments: codeAppointments })).toEqual(codeAppointments)
    })

    it("mirrors the catalog's content seed entry for entry", () => {
        // The seed compose stamps into repobot.content.json must be a
        // structural twin of the module: a freshly composed template
        // books identically from the document or the code fallback.
        expect(musicCatalog.content.appointments).toEqual(codeAppointments)
    })

    it("keeps every availability window inside a day", () => {
        for (const provider of codeAppointments.providers) {
            for (const window of provider.windows) {
                const label = `${provider.providerId} day ${window.day}`
                expect(window.day, label).toBeGreaterThanOrEqual(0)
                expect(window.day, label).toBeLessThanOrEqual(6)
                expect(window.start, label).toBeGreaterThanOrEqual(0)
                expect(window.end, label).toBeLessThanOrEqual(24 * 60)
                expect(window.end, label).toBeGreaterThan(window.start)
            }
        }
    })

    it("keeps ids on the contract grammar", () => {
        for (const type of codeAppointments.types) {
            expect(type.typeId).toMatch(PRACTICE_ID_PATTERN)
        }
        for (const provider of codeAppointments.providers) {
            expect(provider.providerId).toMatch(PRACTICE_ID_PATTERN)
        }
    })

    it("keeps session durations bookable and the projection real", () => {
        for (const type of codeAppointments.types) {
            expect(type.durationMinutes).toBeGreaterThanOrEqual(APPOINTMENT_MIN_DURATION)
            expect(type.durationMinutes).toBeLessThanOrEqual(APPOINTMENT_MAX_DURATION)
            expect(Number.isInteger(type.durationMinutes)).toBe(true)
        }
        // The projection must produce a real week's worth of slots without
        // hitting the deterministic-truncation ceiling — a truncated week
        // would silently drop late-week availability.
        const slots = generateAppointmentSlots(codeAppointments)
        expect(slots.length).toBeGreaterThan(0)
        expect(slots.length).toBeLessThan(MAX_APPOINTMENT_SLOTS)
    })

    it("fronts every session type with a real frame, and only session types", () => {
        // Art from code, facts from the contract: the join must hold both
        // ways, and every card image is a processed responsive entry.
        const typeIds = new Set(codeAppointments.types.map((type) => type.typeId))
        for (const typeId of typeIds) {
            expect(sessionBooking.sessionImages[typeId], `card image for ${typeId}`).toBeDefined()
        }
        for (const [typeId, image] of Object.entries(sessionBooking.sessionImages)) {
            expect(typeIds.has(typeId), `${typeId} is not a session type`).toBe(true)
            expect(image, `${typeId} image`).toBeDefined()
            if (image === undefined) continue
            expect(image.alt, `${typeId} needs alt text`).not.toBe("")
            expect(
                image.srcSet.map((entry) => entry.src),
                `${typeId} src must be a srcSet variant`,
            ).toContain(image.src)
            for (const entry of image.srcSet) {
                expect(
                    publicAssetPresent(path.join(PUBLIC_DIR, entry.src)),
                    `${typeId}: missing ${entry.src}`,
                ).toBe(true)
            }
        }
    })

    it("keeps user-facing booking copy free of platform naming", () => {
        const copy = JSON.stringify({ codeAppointments, sessionBooking })
        expect(copy).not.toMatch(/repobot/i)
        expect(copy).not.toMatch(/\bbot\b/i)
    })
})

describe("photography-music proofing demo fixtures", () => {
    it("ships demo rooms with preview PINs, clients, and images", () => {
        expect(demoProofingAlbums.length).toBeGreaterThan(0)
        for (const album of demoProofingAlbums) {
            expect(album.title).not.toBe("")
            expect(album.clientName).not.toBe("")
            expect(album.note).not.toBe("")
            // Fictional preview PIN only — published sites never consult this.
            expect(album.accessCode, `${album.slug} demo access code`).toMatch(/^\d{4,6}$/)
            expect(album.images.length).toBeGreaterThan(0)
        }
        // The sample walkthrough opens the Late Hours room; it must look
        // populated.
        const lateHours = demoProofingAlbums.find((album) => album.slug === "late-hours-run")
        expect(lateHours, "late-hours-run is the sample demo gallery").toBeDefined()
        expect(lateHours?.images.length).toBeGreaterThanOrEqual(8)
    })

    it("keeps demo proofing slugs unique, URL-safe, and unlisted from public albums", () => {
        const slugs = demoProofingAlbums.map((album) => album.slug)
        expect(new Set(slugs).size).toBe(slugs.length)
        const publicSlugs = new Set(albums.map((album) => album.slug))
        for (const slug of slugs) {
            expect(slug).toMatch(/^[a-z0-9-]+$/)
            // A collision would make an unlisted gallery reachable from /work.
            expect(publicSlugs.has(slug), `${slug} collides with a public album`).toBe(false)
        }
    })

    it("derives stable, unique frame ids inside each demo proofing album", () => {
        expect(photoId(albums[0].images[0])).toBe("live-05")
        for (const album of demoProofingAlbums) {
            const ids = album.images.map((image) => photoId(image))
            expect(new Set(ids).size, `${album.slug} frame ids must be unique`).toBe(ids.length)
            for (const id of ids) {
                expect(id).toMatch(/^[a-z0-9-]+$/)
            }
        }
    })
})

describe("photography-music client-galleries explainer", () => {
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

    it("keeps user-facing galleries copy free of platform naming", () => {
        const copy = JSON.stringify(galleries)
        expect(copy).not.toMatch(/repobot/i)
        expect(copy).not.toMatch(/\bbot\b/i)
    })
})
