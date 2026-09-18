import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

/** Settle import-time hydration work without relying on wall-clock timers. */
async function flushMicrotasks(): Promise<void> {
    for (let i = 0; i < 6; i++) {
        await Promise.resolve()
    }
}

function jsonResponse(status: number, body: unknown, etag?: string): Response {
    return {
        ok: status >= 200 && status < 300,
        status,
        headers: {
            get: (name: string) => (name.toLowerCase() === "etag" ? (etag ?? null) : null),
        } as Headers,
        json: async () => body,
    } as Response
}

function notModifiedResponse(etag?: string): Response {
    return {
        ok: false,
        status: 304,
        headers: {
            get: (name: string) => (name.toLowerCase() === "etag" ? (etag ?? null) : null),
        } as Headers,
        json: async () => {
            throw new Error("json() should not run for 304")
        },
    } as Response
}

describe("runtime content etag hydration", { timeout: 30_000 }, () => {
    beforeEach(() => {
        vi.resetModules()
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
        vi.useRealTimers()
    })

    it("sends If-None-Match once etag is known and keeps document/version on 304", async () => {
        vi.useFakeTimers()
        const firstDocument = { schedule: { sessions: [] } }
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(jsonResponse(200, firstDocument, '"etag-1"'))
            .mockResolvedValueOnce(notModifiedResponse('"etag-1"'))
        vi.stubGlobal("fetch", fetchMock)

        const contentDocument = await import("../../../src/View/Landing/contentDocument")
        await flushMicrotasks()
        const listener = vi.fn()
        const unsubscribe = contentDocument.subscribeContentDocument(listener)
        const versionBefore = contentDocument.getContentDocumentVersion()
        const documentBefore = contentDocument.getContentDocument()

        await vi.advanceTimersByTimeAsync(contentDocument.RUNTIME_CONTENT_REFRESH_INTERVAL_FAST_MS)
        await flushMicrotasks()

        expect(fetchMock).toHaveBeenCalledTimes(2)
        expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
            headers: { "If-None-Match": '"etag-1"' },
        })
        expect(contentDocument.getContentDocumentVersion()).toBe(versionBefore)
        expect(contentDocument.getContentDocument()).toEqual(documentBefore)
        expect(listener).not.toHaveBeenCalled()
        unsubscribe()
    })

    it("uses the slow refresh interval when the door responds without etag", async () => {
        vi.useFakeTimers()
        const firstDocument = { schedule: { sessions: [] } }
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(jsonResponse(200, firstDocument))
            .mockResolvedValue(jsonResponse(200, firstDocument))
        vi.stubGlobal("fetch", fetchMock)

        const contentDocument = await import("../../../src/View/Landing/contentDocument")
        await flushMicrotasks()
        expect(fetchMock).toHaveBeenCalledOnce()

        await vi.advanceTimersByTimeAsync(contentDocument.RUNTIME_CONTENT_REFRESH_INTERVAL_FAST_MS)
        await flushMicrotasks()
        expect(fetchMock).toHaveBeenCalledOnce()

        await vi.advanceTimersByTimeAsync(
            contentDocument.RUNTIME_CONTENT_REFRESH_INTERVAL_MS -
                contentDocument.RUNTIME_CONTENT_REFRESH_INTERVAL_FAST_MS,
        )
        await flushMicrotasks()
        expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    it("uses the fast refresh interval when the door responds with etag", async () => {
        vi.useFakeTimers()
        const firstDocument = { schedule: { sessions: [] } }
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(jsonResponse(200, firstDocument, '"etag-fast"'))
            .mockResolvedValueOnce(notModifiedResponse('"etag-fast"'))
        vi.stubGlobal("fetch", fetchMock)

        const contentDocument = await import("../../../src/View/Landing/contentDocument")
        await flushMicrotasks()
        expect(fetchMock).toHaveBeenCalledOnce()

        await vi.advanceTimersByTimeAsync(contentDocument.RUNTIME_CONTENT_REFRESH_INTERVAL_FAST_MS)
        await flushMicrotasks()
        expect(fetchMock).toHaveBeenCalledTimes(2)
    })
})
