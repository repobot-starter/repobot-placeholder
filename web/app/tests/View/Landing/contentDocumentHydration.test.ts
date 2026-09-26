import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

function deferred<T>() {
    let resolve!: (value: T) => void
    const promise = new Promise<T>((done) => {
        resolve = done
    })
    return { promise, resolve }
}

/** Settle the async hydration path (fetch + json) without real timers. */
async function flushMicrotasks(): Promise<void> {
    for (let i = 0; i < 6; i++) {
        await Promise.resolve()
    }
}

// Generous per-suite budget: each test cold-imports the module graph after
// vi.resetModules(), and CI compose gates run 16 vitest instances in
// parallel — the default 5s test budget has repeatedly expired mid-import
// on loaded runners (2026-09-16, twice). The waits themselves are
// microtask/fake-timer based, so passing runs stay fast; this only buys
// headroom for slow transforms.
describe("runtime content hydration", { timeout: 30_000 }, () => {
    beforeEach(() => {
        vi.resetModules()
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
        vi.useRealTimers()
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

        await vi.waitFor(
            () => {
                expect(contentDocument.getContentDocument()).toEqual(nextDocument)
                expect(contentDocument.getContentDocumentVersion()).toBe(initialVersion + 1)
                expect(listener).toHaveBeenCalled()
            },
            // Generous: loaded CI runners have blown default budgets here.
            { timeout: 15_000 },
        )

        unsubscribe()
    })

    it("uses a query-provided hydration URL when present", async () => {
        const hydrated = { schedule: { sessions: [] } }
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => hydrated,
        } as Response)
        vi.stubGlobal("fetch", fetchMock)
        window.history.replaceState(
            {},
            "",
            "/preview/index.html?repobotContentDocUrl=%2Fcontent__request__project_doc%2Fprj_hydrate",
        )

        const contentDocument = await import("../../../src/View/Landing/contentDocument")
        await flushMicrotasks()

        expect(fetchMock).toHaveBeenCalled()
        expect(fetchMock.mock.calls[0]?.[0]).toBe("/content__request__project_doc/prj_hydrate")
        expect(contentDocument.getContentDocument()).toEqual(hydrated)
    })

    it("keeps the baked document when the endpoint returns non-ok", async () => {
        const debug = vi.spyOn(console, "debug").mockImplementation(() => undefined)
        const fetchMock = vi.fn().mockResolvedValue({
            ok: false,
            status: 404,
            json: async () => ({}),
        } as Response)
        vi.stubGlobal("fetch", fetchMock)

        // Imports are SEQUENTIAL on purpose: concurrent dynamic imports
        // right after vi.resetModules() can double-evaluate the module on
        // loaded runners (two instances → two import-time fetches), which
        // is a harness artifact, not the behavior under test. This suite
        // repeatedly broke CI trains that way (2026-09-16).
        const contentDocument = await import("../../../src/View/Landing/contentDocument")
        const committed = await import("../../../../../repobot.content.json")

        await vi.waitFor(
            () => {
                expect(fetchMock).toHaveBeenCalled()
            },
            { timeout: 15_000 },
        )
        await flushMicrotasks()

        expect(contentDocument.getContentDocument()).toEqual(committed.default)
        expect(contentDocument.getContentDocumentVersion()).toBe(0)
        expect(debug).toHaveBeenCalled()
    })

    it("keeps polling the door once it has answered, applying newer documents", async () => {
        vi.useFakeTimers()
        const firstDocument = { schedule: { sessions: [] } }
        const secondDocument = {
            schedule: {
                sessions: [
                    {
                        sessionId: "mon-0600-strength-test",
                        day: 1,
                        start: 360,
                        end: 420,
                        title: "Strength Test",
                        instructor: "Mara Reyes",
                    },
                ],
            },
        }
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce({ ok: true, status: 200, json: async () => firstDocument } as Response)
            .mockResolvedValueOnce({ ok: true, status: 200, json: async () => secondDocument } as Response)
        vi.stubGlobal("fetch", fetchMock)

        const contentDocument = await import("../../../src/View/Landing/contentDocument")
        await flushMicrotasks()
        expect(fetchMock).toHaveBeenCalledOnce()
        expect(contentDocument.getContentDocument()).toEqual(firstDocument)

        // The management edit lands in the platform store; the next poll
        // carries it into this already-open tab — no commit, no redeploy.
        await vi.advanceTimersByTimeAsync(contentDocument.RUNTIME_CONTENT_REFRESH_INTERVAL_MS)
        await flushMicrotasks()
        expect(fetchMock).toHaveBeenCalledTimes(2)
        expect(contentDocument.getContentDocument()).toEqual(secondDocument)
    })

    it("does not poll a surface whose first fetch found no door", async () => {
        vi.useFakeTimers()
        vi.spyOn(console, "debug").mockImplementation(() => undefined)
        const fetchMock = vi.fn().mockResolvedValue({
            ok: false,
            status: 404,
            json: async () => ({}),
        } as Response)
        vi.stubGlobal("fetch", fetchMock)

        const contentDocument = await import("../../../src/View/Landing/contentDocument")
        await flushMicrotasks()
        expect(fetchMock).toHaveBeenCalledOnce()

        // A doorless surface (dev server, workspace preview) must stay
        // quiet: its freshness lane is HMR preview writes, not this poll.
        await vi.advanceTimersByTimeAsync(contentDocument.RUNTIME_CONTENT_REFRESH_INTERVAL_MS * 3)
        await flushMicrotasks()
        expect(fetchMock).toHaveBeenCalledOnce()
    })

    it("refetches when the tab becomes visible again", async () => {
        vi.spyOn(console, "debug").mockImplementation(() => undefined)
        const freshDocument = { schedule: { sessions: [] } }
        const fetchMock = vi
            .fn()
            // The recovery case: the page's first fetch lost (cold router),
            // and the focus-gain refetch is what heals it.
            .mockResolvedValueOnce({ ok: false, status: 502, json: async () => ({}) } as Response)
            .mockResolvedValue({ ok: true, status: 200, json: async () => freshDocument } as Response)
        vi.stubGlobal("fetch", fetchMock)

        const contentDocument = await import("../../../src/View/Landing/contentDocument")
        await flushMicrotasks()
        const callsBeforeFocus = fetchMock.mock.calls.length
        expect(callsBeforeFocus).toBeGreaterThanOrEqual(1)

        document.dispatchEvent(new Event("visibilitychange"))
        await flushMicrotasks()

        // Module instances from sibling tests may also hear the event, so
        // pin growth and the applied document, not an exact call count.
        expect(fetchMock.mock.calls.length).toBeGreaterThan(callsBeforeFocus)
        expect(contentDocument.getContentDocument()).toEqual(freshDocument)
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

        // Sequential imports — see the non-ok test above for why.
        const contentDocument = await import("../../../src/View/Landing/contentDocument")
        const committed = await import("../../../../../repobot.content.json")

        await vi.waitFor(
            () => {
                expect(fetchMock).toHaveBeenCalled()
            },
            { timeout: 15_000 },
        )
        await flushMicrotasks()

        expect(contentDocument.getContentDocument()).toEqual(committed.default)
        expect(contentDocument.getContentDocumentVersion()).toBe(0)
        expect(debug).toHaveBeenCalled()
    })
})
