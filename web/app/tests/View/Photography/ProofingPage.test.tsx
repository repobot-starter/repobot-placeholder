import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { photoId, photographer, proofingAlbums } from "../../../src/View/Photography/content"
import ProofingPage from "../../../src/View/Photography/ProofingPage"

const album = proofingAlbums[0]

function renderProofing(slug: string | null = album.slug): ReturnType<typeof render> {
    const search = slug !== null ? `?album=${slug}` : ""
    return render(
        <MemoryRouter initialEntries={[`/proof${search}`]}>
            <ProofingPage />
        </MemoryRouter>,
    )
}

function unlock(): void {
    fireEvent.change(screen.getByRole("textbox", { name: "Access code" }), {
        target: { value: album.accessCode },
    })
    fireEvent.click(screen.getByRole("button", { name: "View gallery" }))
}

describe("ProofingPage (client proofing room)", () => {
    beforeEach(() => {
        localStorage.clear()
        sessionStorage.clear()
    })

    afterEach(() => {
        cleanup()
        vi.unstubAllGlobals()
    })

    it("asks for the photographer's link when the album is unknown", () => {
        renderProofing("no-such-album")
        expect(screen.getByText(/ask your photographer/i)).toBeTruthy()
    })

    it("gates the gallery behind the access code and rejects wrong codes", () => {
        renderProofing()
        expect(screen.queryByRole("heading", { name: album.title })).toBeNull()

        fireEvent.change(screen.getByRole("textbox", { name: "Access code" }), {
            target: { value: "0000" },
        })
        fireEvent.click(screen.getByRole("button", { name: "View gallery" }))
        expect(screen.getByText(/doesn't match this gallery/i)).toBeTruthy()
        expect(screen.queryByRole("heading", { name: album.title })).toBeNull()

        unlock()
        expect(screen.getByRole("heading", { name: album.title })).toBeTruthy()
        expect(screen.getByText(`For ${album.clientName}`)).toBeTruthy()
    })

    it("remembers access for the session, so a reload skips the gate", () => {
        renderProofing()
        unlock()
        cleanup()

        renderProofing()
        expect(screen.getByRole("heading", { name: album.title })).toBeTruthy()
    })

    it("selects frames, persists picks locally, and sends them through the forms pipeline", async () => {
        const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 })
        vi.stubGlobal("fetch", fetchMock)

        renderProofing()
        unlock()

        // Send is disabled until something is selected.
        const sendButton = screen.getByRole("button", { name: "Send selections" })
        expect((sendButton as HTMLButtonElement).disabled).toBe(true)

        const firstId = photoId(album.images[0])
        const thirdId = photoId(album.images[2])
        fireEvent.click(screen.getByRole("button", { name: `Select ${album.images[2].alt}` }))
        fireEvent.click(screen.getByRole("button", { name: `Select ${album.images[0].alt}` }))
        expect(screen.getByText("2 photographs selected")).toBeTruthy()

        // Picks survive leaving and coming back (localStorage, per album).
        cleanup()
        renderProofing()
        expect(screen.getByText("2 photographs selected")).toBeTruthy()

        fireEvent.click(screen.getByRole("button", { name: "Send selections" }))
        fireEvent.change(screen.getByRole("textbox", { name: /anything to add/i }), {
            target: { value: "The third one is our favorite." },
        })
        fireEvent.click(screen.getByRole("button", { name: "Send" }))

        expect(await screen.findByText("Selections sent.")).toBeTruthy()
        expect(fetchMock).toHaveBeenCalledOnce()
        const body = JSON.parse((fetchMock.mock.calls[0]![1] as RequestInit).body as string)
        expect(body.formKey).toBe("proofing-selection")
        expect(body.fields.album).toBe(album.slug)
        expect(body.fields.clientName).toBe(album.clientName)
        // Selection order follows the album's own sequence regardless of
        // click order — the photographer reads picks as a sequenced list.
        expect(body.fields.selectedImageIds).toEqual([firstId, thirdId])
        expect(body.fields.note).toBe("The third one is our favorite.")

        // The sent state persists; the room offers revision, not re-entry.
        cleanup()
        renderProofing()
        expect(screen.getByText("Selections sent.")).toBeTruthy()
        fireEvent.click(screen.getByRole("button", { name: "Revise selections" }))
        expect(screen.getByText("2 photographs selected")).toBeTruthy()
    })

    it("keeps proofing rooms off the public site chrome", () => {
        renderProofing()
        unlock()
        // No site nav: the only wordmark is the quiet studio mark, and the
        // public pages (/work, /about, /inquire) are not linked from here.
        expect(screen.queryByRole("link", { name: "Work" })).toBeNull()
        expect(screen.queryByRole("link", { name: "Inquire" })).toBeNull()
        expect(screen.getAllByText(photographer.name).length).toBeGreaterThan(0)
    })
})
