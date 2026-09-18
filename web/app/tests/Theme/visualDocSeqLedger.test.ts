import { recordVisualDocSeq, visualDocSeq } from "@base/design-system"
import { describe, expect, it } from "vitest"

/**
 * The write-sequence ledger behind seq-stamped acks. The dev server
 * announces each ack-bearing document's write sequence (the changed file's
 * mtime) ahead of its apply event; renderers stamp their visual-applied
 * acks with the recorded value so the platform can tell WHICH write an ack
 * repainted — the correlation that keeps a rapid-fire remix burst's
 * coalesced or reordered acks from clearing the wrong overlay arm.
 */
describe("visual-doc write-sequence ledger", () => {
    it("returns undefined before any announcement (old dev servers: acks stay unkeyed)", () => {
        expect(visualDocSeq("repobot.unannounced.json")).toBeUndefined()
    })

    it("tracks the newest sequence per document, monotonically", () => {
        recordVisualDocSeq("repobot.landing.json", 1_000)
        expect(visualDocSeq("repobot.landing.json")).toBe(1_000)
        // A newer write advances it…
        recordVisualDocSeq("repobot.landing.json", 2_000)
        expect(visualDocSeq("repobot.landing.json")).toBe(2_000)
        // …but an out-of-order older announcement must not roll it back:
        // stamping a NEWER seq on an older paint would falsely satisfy the
        // platform's newest arm.
        recordVisualDocSeq("repobot.landing.json", 1_500)
        expect(visualDocSeq("repobot.landing.json")).toBe(2_000)
    })

    it("keeps documents independent", () => {
        recordVisualDocSeq("repobot.theme.json", 3_000)
        expect(visualDocSeq("repobot.theme.json")).toBe(3_000)
        expect(visualDocSeq("repobot.content.json")).toBeUndefined()
    })
})
