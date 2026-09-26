import { PROOFING_ROOM_PATH, PROOFING_SELECT_PATH } from "@base/core"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import React from "react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { demoProofingAlbums, photoId, photographer } from "../../../src/View/WeddingEdition/content"
import ProofingPage from "../../../src/View/WeddingEdition/ProofingPage"

const album = demoProofingAlbums[0]

const noNetworkFetch: typeof fetch = () =>
    Promise.reject(new TypeError("Failed to fetch (network is disabled in tests)"))

function renderProofing(slug: string | null = album.slug): ReturnType<typeof render> {
    const search = slug !== null ? `?album=${slug}` : ""
    return render(
        <MemoryRouter initialEntries={[`/proof${search}`]}>
            <ProofingPage />
        </MemoryRouter>,
    )
}

async function unlock(code: string = album.accessCode): Promise<void> {
    fireEvent.change(screen.getByRole("textbox", { name: "Access code" }), {
        target: { value: code },
    })
    fireEvent.click(screen.getByRole("button", { name: "Open the sheets" }))
}

function jsonResponse(status: number, body: unknown): Response {
    return {
        ok: status >= 200 && status < 300,
        status,
        json: async () => body,
    } as Response
}

const doorRoom = {
    name: album.title,
    images: album.images.slice(0, 3).map((image, index) => ({
        imageId: `door-${index + 1}`,
        objectPath: `proofing/demo/r/door-${index + 1}/preview/${photoId(image)}.webp`,
        originalObjectPath: `proofing/demo/r/door-${index + 1}/original/${photoId(image)}.webp`,
        filename: `${photoId(image)}.webp`,
        width: image.width,
        height: image.height,
        previewUrl: image.src,
    })),
}

describe("WeddingEdition ProofingPage (client proofing room)", () => {
    beforeEach(() => {
        localStorage.clear()
        sessionStorage.clear()
    })

    afterEach(() => {
        cleanup()
        vi.unstubAllGlobals()
        globalThis.fetch = noNetworkFetch
        if (typeof window !== "undefined") {
            window.fetch = noNetworkFetch
        }
    })

    it("asks for the photographer's link when the album query is missing", () => {
        renderProofing(null)
        expect(screen.getByText(/ask your photographer/i)).toBeTruthy()
    })

    it("fetches the room manifest after a code entry (published-site happy path)", async () => {
        const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true, room: doorRoom }))
        vi.stubGlobal("fetch", fetchMock)

        renderProofing()
        expect(screen.queryByRole("heading", { name: album.title })).toBeNull()
        await unlock("9911")

        expect(await screen.findByRole("heading", { name: album.title })).toBeTruthy()
        expect(fetchMock).toHaveBeenCalled()
        const url = fetchMock.mock.calls[0]![0] as string
        expect(url).toBe(`${PROOFING_ROOM_PATH}?slug=${album.slug}&code=9911`)
        // Door image ids, not the bundled demo filenames.
        expect(screen.getByText("door-1")).toBeTruthy()
        expect(screen.queryByText(`For ${album.clientName}`)).toBeNull()
    })

    it("shows a retryable wrong-code state when the door rejects the PIN", async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(jsonResponse(403, { error: "invalid_room_code" }))
            .mockResolvedValueOnce(jsonResponse(200, { ok: true, room: doorRoom }))
        vi.stubGlobal("fetch", fetchMock)

        renderProofing()
        await unlock("0000")
        expect(await screen.findByText(/doesn't match this gallery/i)).toBeTruthy()
        expect(screen.queryByRole("heading", { name: album.title })).toBeNull()

        await unlock("3621")
        expect(await screen.findByRole("heading", { name: album.title })).toBeTruthy()
    })

    it("renders the demo fixture when the door is unreachable (baked preview)", async () => {
        renderProofing()
        expect(screen.queryByRole("heading", { name: album.title })).toBeNull()

        fireEvent.change(screen.getByRole("textbox", { name: "Access code" }), {
            target: { value: "0000" },
        })
        fireEvent.click(screen.getByRole("button", { name: "Open the sheets" }))
        expect(await screen.findByText(/doesn't match this gallery/i)).toBeTruthy()

        await unlock()
        expect(await screen.findByRole("heading", { name: album.title })).toBeTruthy()
        expect(screen.getByText(`For ${album.clientName}`)).toBeTruthy()
        expect(screen.getByText(album.note)).toBeTruthy()
    })

    it("shows a closed-gallery state for an unknown slug when no door answers", async () => {
        renderProofing("no-such-album")
        await unlock("1234")
        expect(await screen.findByText(/isn't available/i)).toBeTruthy()
    })

    it("shows a calm empty state when the published door is not configured", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(jsonResponse(503, { error: "proofing_not_configured" })),
        )
        renderProofing()
        await unlock("3621")
        expect(await screen.findByText(/aren't set up yet/i)).toBeTruthy()
        expect(screen.queryByRole("heading", { name: album.title })).toBeNull()
    })

    it("shows a wait-a-moment state when the door rate-limits code attempts", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(429, { error: "slow_down" })))
        renderProofing()
        await unlock("3621")
        expect(await screen.findByText(/too many attempts/i)).toBeTruthy()
        expect(screen.getByRole("textbox", { name: "Access code" })).toBeTruthy()
    })

    it("remembers access for the session, so a reload skips the gate", async () => {
        renderProofing()
        await unlock()
        expect(await screen.findByRole("heading", { name: album.title })).toBeTruthy()
        cleanup()

        renderProofing()
        expect(await screen.findByRole("heading", { name: album.title })).toBeTruthy()
    })

    it("selects frames, persists picks locally, and posts them to the proofing door", async () => {
        const fetchMock = vi.fn().mockImplementation((url: string) => {
            if (typeof url === "string" && url.startsWith(PROOFING_ROOM_PATH)) {
                return Promise.resolve(jsonResponse(200, { ok: true, room: doorRoom }))
            }
            if (url === PROOFING_SELECT_PATH) {
                return Promise.resolve(jsonResponse(200, { ok: true, selectionId: "sel_9" }))
            }
            return Promise.reject(new Error(`unexpected ${url}`))
        })
        vi.stubGlobal("fetch", fetchMock)

        renderProofing()
        await unlock("3621")
        expect(await screen.findByRole("heading", { name: album.title })).toBeTruthy()

        const sendButton = screen.getByRole("button", { name: "Send picks to the desk" })
        expect((sendButton as HTMLButtonElement).disabled).toBe(true)

        const firstAlt = doorRoom.images[0]!.filename.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ")
        const thirdAlt = doorRoom.images[2]!.filename.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ")
        fireEvent.click(screen.getByRole("button", { name: `Select ${thirdAlt}` }))
        fireEvent.click(screen.getByRole("button", { name: `Select ${firstAlt}` }))
        expect(screen.getByText("2 photographs selected")).toBeTruthy()

        cleanup()
        renderProofing()
        expect(await screen.findByText("2 photographs selected")).toBeTruthy()

        fireEvent.click(screen.getByRole("button", { name: "Send picks to the desk" }))
        fireEvent.change(screen.getByRole("textbox", { name: "Your name" }), {
            target: { value: "Ada Lovelace" },
        })
        fireEvent.change(screen.getByRole("textbox", { name: "Your email" }), {
            target: { value: "ada@example.com" },
        })
        fireEvent.change(screen.getByRole("textbox", { name: /anything to add/i }), {
            target: { value: "The third one is our favorite." },
        })
        fireEvent.click(screen.getByRole("button", { name: "Send" }))

        expect(await screen.findByText("Picks filed.")).toBeTruthy()
        const selectCall = fetchMock.mock.calls.find((call) => call[0] === PROOFING_SELECT_PATH)
        expect(selectCall).toBeDefined()
        const body = JSON.parse((selectCall![1] as RequestInit).body as string)
        expect(body.formKey).toBeUndefined()
        expect(body.slug).toBe(album.slug)
        expect(body.code).toBe("3621")
        expect(body.visitorName).toBe("Ada Lovelace")
        expect(body.visitorEmail).toBe("ada@example.com")
        expect(body.picks).toEqual(["door-1", "door-3"])
        expect(body.note).toBe("The third one is our favorite.")

        cleanup()
        renderProofing()
        expect(await screen.findByText("Picks filed.")).toBeTruthy()
        fireEvent.click(screen.getByRole("button", { name: "Revise picks" }))
        expect(screen.getByText("2 photographs selected")).toBeTruthy()
    })

    it("scopes remembered access to this pack, apart from the wedding pack's rooms", async () => {
        renderProofing()
        await unlock()
        expect(await screen.findByRole("heading", { name: album.title })).toBeTruthy()
        expect(sessionStorage.getItem(`wedding-edition-proof-access:${album.slug}`)).toBe(album.accessCode)
        expect(sessionStorage.getItem(`wedding-proof-access:${album.slug}`)).toBeNull()
    })

    it("keeps proofing rooms off the public site chrome", async () => {
        renderProofing()
        await unlock()
        await waitFor(() => {
            expect(screen.getByRole("heading", { name: album.title })).toBeTruthy()
        })
        expect(screen.queryByRole("link", { name: "Weddings" })).toBeNull()
        expect(screen.queryByRole("link", { name: "Inquire" })).toBeNull()
        expect(screen.getAllByText(photographer.name).length).toBeGreaterThan(0)
    })
})
