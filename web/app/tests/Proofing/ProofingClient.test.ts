import {
    PROOFING_ROOM_PATH,
    PROOFING_SANDBOX_STORAGE_KEY,
    PROOFING_SELECT_PATH,
    fetchProofingRoom,
    submitProofingSelection,
} from "@base/core"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const room = {
    name: "Harlow family session",
    images: [
        {
            imageId: "img-1",
            objectPath: "proofing/a/r/img-1/preview/one.webp",
            originalObjectPath: "proofing/a/r/img-1/original/one.webp",
            filename: "one.webp",
            width: 1600,
            height: 1067,
            previewUrl: "https://cdn.example/one.webp",
        },
    ],
}

function jsonResponse(status: number, body: unknown): Response {
    return {
        ok: status >= 200 && status < 300,
        status,
        json: async () => body,
    } as Response
}

describe("proofing client (managed proofing kernel)", () => {
    beforeEach(() => {
        localStorage.clear()
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it("reads a room manifest from the same-origin door", async () => {
        const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true, room }))
        vi.stubGlobal("fetch", fetchMock)

        const result = await fetchProofingRoom("harlow-session", "4271")
        expect(fetchMock).toHaveBeenCalledWith(`${PROOFING_ROOM_PATH}?slug=harlow-session&code=4271`)
        expect(result).toEqual({ status: "ok", room, sandbox: false })
    })

    it("relays door domain outcomes and never treats them as unreachable", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(403, { error: "invalid_room_code" })))
        expect(await fetchProofingRoom("harlow-session", "0000")).toEqual({ status: "invalid_code" })

        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(jsonResponse(404, { error: "proofing_room_not_found" })),
        )
        expect(await fetchProofingRoom("missing", "1234")).toEqual({ status: "not_found" })

        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(429, { error: "too_many" })))
        expect(await fetchProofingRoom("harlow-session", "4271")).toEqual({ status: "rate_limited" })

        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue(jsonResponse(503, { error: "proofing_not_configured" })),
        )
        expect(await fetchProofingRoom("harlow-session", "4271")).toEqual({ status: "not_configured" })
    })

    it("reports unreachable when no door answers (sandbox / baked preview)", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")))
        expect(await fetchProofingRoom("harlow-session", "4271")).toEqual({ status: "unreachable" })

        // A static preview's HTML 404 has no JSON door body — that is not a
        // closed room, it is the missing reserved path.
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: false,
                status: 404,
                json: async () => {
                    throw new SyntaxError("not json")
                },
            }),
        )
        expect(await fetchProofingRoom("harlow-session", "4271")).toEqual({ status: "unreachable" })
    })

    it("posts a selection to the same-origin door", async () => {
        const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { ok: true, selectionId: "sel_123" }))
        vi.stubGlobal("fetch", fetchMock)

        const result = await submitProofingSelection({
            slug: "harlow-session",
            code: "4271",
            visitorName: "Ada Lovelace",
            visitorEmail: "ada@example.com",
            note: "The third one is our favorite.",
            picks: ["img-1", "img-3"],
        })
        expect(result).toEqual({ status: "ok", selectionId: "sel_123", sandbox: false })
        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
        expect(url).toBe(PROOFING_SELECT_PATH)
        expect(init.method).toBe("POST")
        expect(JSON.parse(init.body as string)).toEqual({
            slug: "harlow-session",
            code: "4271",
            visitorName: "Ada Lovelace",
            visitorEmail: "ada@example.com",
            note: "The third one is our favorite.",
            picks: ["img-1", "img-3"],
        })
        expect(localStorage.getItem(PROOFING_SANDBOX_STORAGE_KEY)).toBeNull()
    })

    it("relays a wrong-code select and does not write the sandbox store", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(403, { error: "invalid_room_code" })))
        const result = await submitProofingSelection({
            slug: "harlow-session",
            code: "0000",
            visitorName: "Ada",
            visitorEmail: "ada@example.com",
            picks: ["img-1"],
        })
        expect(result).toEqual({ status: "invalid_code" })
        expect(localStorage.getItem(PROOFING_SANDBOX_STORAGE_KEY)).toBeNull()
    })

    it("records a sandbox selection when no door answers", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("no router here")))

        const result = await submitProofingSelection({
            slug: "harlow-session",
            code: "4271",
            visitorName: "Ada",
            visitorEmail: "ada@example.com",
            picks: ["img-1"],
            fallbackStorageKey: "photography-proof-fallback:harlow-session",
        })
        expect(result.status).toBe("ok")
        if (result.status === "ok") {
            expect(result.sandbox).toBe(true)
            expect(result.selectionId.startsWith("sandbox-")).toBe(true)
        }
        expect(JSON.parse(localStorage.getItem(PROOFING_SANDBOX_STORAGE_KEY) ?? "[]")).toEqual([
            {
                slug: "harlow-session",
                visitorName: "Ada",
                visitorEmail: "ada@example.com",
                note: "",
                picks: ["img-1"],
            },
        ])
        expect(
            JSON.parse(localStorage.getItem("photography-proof-fallback:harlow-session") ?? "{}"),
        ).toMatchObject({ slug: "harlow-session", picks: ["img-1"] })
    })
})
