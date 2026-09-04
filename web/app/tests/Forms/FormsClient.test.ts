import { FORMS_SUBMIT_PATH, submitForm } from "@base/core"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

describe("submitForm (managed forms client)", () => {
    beforeEach(() => {
        localStorage.clear()
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it("posts the submission to the same-origin forms door", async () => {
        const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 })
        vi.stubGlobal("fetch", fetchMock)

        const result = await submitForm({
            formKey: "inquiry",
            fields: { email: "ada@example.com", message: "June availability?" },
            fallbackStorageKey: "lead",
        })

        expect(result.delivered).toBe(true)
        expect(fetchMock).toHaveBeenCalledOnce()
        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
        expect(url).toBe(FORMS_SUBMIT_PATH)
        expect(init.method).toBe("POST")
        expect(JSON.parse(init.body as string)).toEqual({
            formKey: "inquiry",
            fields: { email: "ada@example.com", message: "June availability?" },
        })
        // Delivered submissions never touch the fallback store.
        expect(localStorage.getItem("lead")).toBeNull()
    })

    it("falls back to localStorage when the pipeline is unreachable", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("no router here")))

        const result = await submitForm({
            formKey: "inquiry",
            fields: { email: "ada@example.com" },
            fallbackStorageKey: "lead",
        })

        expect(result.delivered).toBe(false)
        expect(JSON.parse(localStorage.getItem("lead") ?? "{}")).toEqual({
            formKey: "inquiry",
            email: "ada@example.com",
        })
    })

    it("falls back on non-2xx responses (dev servers, throttling)", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }))

        const result = await submitForm({
            formKey: "rsvp",
            fields: { name: "Grace", attending: true },
            fallbackStorageKey: "rsvp-fallback",
        })

        expect(result.delivered).toBe(false)
        expect(JSON.parse(localStorage.getItem("rsvp-fallback") ?? "{}")).toEqual({
            formKey: "rsvp",
            name: "Grace",
            attending: true,
        })
    })

    it("never throws even without a fallback key", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")))

        const result = await submitForm({ formKey: "inquiry", fields: {} })
        expect(result.delivered).toBe(false)
    })
})
