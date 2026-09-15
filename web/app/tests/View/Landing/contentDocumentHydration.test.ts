import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

function deferred<T>() {
    let resolve!: (value: T) => void
    const promise = new Promise<T>((done) => {
        resolve = done
    })
    return { promise, resolve }
}

describe("runtime content hydration", () => {
    beforeEach(() => {
        vi.resetModules()
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
    })

    it("replaces the baked document and notifies subscribers after a valid runtime fetch", async () => {
        const nextDocument = {
            schedule: {
                sessions: [],
            },
        }
        const response = deferred<Response>()
        const fetchMock = vi.fn().mockReturnValue(response.promise)
        vi.stubGlobal("fetch", fetchMock)

        const contentDocument = await import("../../../src/View/Landing/contentDocument")
        const initialVersion = contentDocument.getContentDocumentVersion()
        const listener = vi.fn()
        const unsubscribe = contentDocument.subscribeContentDocument(listener)

        response.resolve({
            ok: true,
            status: 200,
            json: async () => nextDocument,
        } as Response)

        await vi.waitFor(() => {
            expect(contentDocument.getContentDocument()).toEqual(nextDocument)
            expect(contentDocument.getContentDocumentVersion()).toBe(initialVersion + 1)
            expect(listener).toHaveBeenCalledOnce()
        })

        unsubscribe()
    })

    it("keeps the baked document when the endpoint returns non-ok", async () => {
        const debug = vi.spyOn(console, "debug").mockImplementation(() => undefined)
        const fetchMock = vi.fn().mockResolvedValue({
            ok: false,
            status: 404,
            json: async () => ({}),
        } as Response)
        vi.stubGlobal("fetch", fetchMock)

        const [contentDocument, committed] = await Promise.all([
            import("../../../src/View/Landing/contentDocument"),
            import("../../../../../repobot.content.json"),
        ])

        await vi.waitFor(() => {
            expect(fetchMock).toHaveBeenCalledOnce()
        })

        expect(contentDocument.getContentDocument()).toEqual(committed.default)
        expect(contentDocument.getContentDocumentVersion()).toBe(0)
        expect(debug).toHaveBeenCalled()
    })

    it("keeps the baked document when the endpoint returns invalid JSON", async () => {
        const debug = vi.spyOn(console, "debug").mockImplementation(() => undefined)
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => {
                throw new SyntaxError("bad json")
            },
        } as Response)
        vi.stubGlobal("fetch", fetchMock)

        const [contentDocument, committed] = await Promise.all([
            import("../../../src/View/Landing/contentDocument"),
            import("../../../../../repobot.content.json"),
        ])

        await vi.waitFor(() => {
            expect(fetchMock).toHaveBeenCalledOnce()
        })

        expect(contentDocument.getContentDocument()).toEqual(committed.default)
        expect(contentDocument.getContentDocumentVersion()).toBe(0)
        expect(debug).toHaveBeenCalled()
    })
})
