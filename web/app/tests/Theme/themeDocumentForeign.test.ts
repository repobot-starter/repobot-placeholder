import {
    gateThemeDocumentForPack,
    themeDocumentForeign,
    themeDocumentForeignForPack,
} from "@base/design-system"
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest"
import activePack from "../../../../packs/active.json"

/*
 * The pack-stamp gate's quiet predicate, driving the visual-applied ACK
 * (themeHotUpdate.ts). A live edit the gate refuses still paints — as the
 * default theme — but must never ack: the platform's repaint watchdog
 * holds every preview write to an OBSERVED repaint, and acking a gated
 * write stood it down against a look the user never asked for (the
 * post-template-flip "remix stops repainting while the sidebar's values
 * keep changing" wedge, driven by a stale client writing the old pack's
 * stamp). The predicate must agree with the gate exactly, or the ack and
 * the paint drift apart again.
 */
describe("themeDocumentForeignForPack", () => {
    let warn: MockInstance

    beforeEach(() => {
        warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
    })

    afterEach(() => {
        warn.mockRestore()
    })

    const branded = { pack: "gala", brand: { primary: "#8b1e3f" }, mode: "dark" }

    it("agrees with the gate on every stamp shape", () => {
        const documents: unknown[] = [
            branded,
            { ...branded, pack: "band" },
            { mode: "dark" },
            { ...branded, pack: "" },
            { ...branded, pack: 42 },
            null,
            undefined,
            "not an object",
            ["gala"],
        ]
        for (const document of documents) {
            for (const active of ["gala", "band", "", undefined]) {
                // The gate returns the document itself unless it refuses it
                // (then a fresh default) — objects only; non-objects never
                // gate.
                const gatedToDefault =
                    typeof document === "object" &&
                    document !== null &&
                    !Array.isArray(document) &&
                    gateThemeDocumentForPack(document, active) !== document
                expect(themeDocumentForeignForPack(document, active)).toBe(gatedToDefault)
            }
        }
    })

    it("stays quiet — the gate owns the console warning, once, where the refusal resolves", () => {
        expect(themeDocumentForeignForPack(branded, "band")).toBe(true)
        expect(warn).not.toHaveBeenCalled()
        gateThemeDocumentForPack(branded, "band")
        expect(warn).toHaveBeenCalledOnce()
    })

    it("the bound form follows this checkout's active pack", () => {
        expect(themeDocumentForeign({ pack: activePack.key, mode: "dark" })).toBe(false)
        expect(themeDocumentForeign({ pack: "definitely-not-a-real-pack" })).toBe(true)
        expect(themeDocumentForeign({ mode: "dark" })).toBe(false)
    })
})
