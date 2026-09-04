import * as designSystem from "@base/design-system"
import { describe, expect, it } from "vitest"
import * as registry from "../../src/Theme/ui"

describe("@ui registry", () => {
    it("re-exports the full design-system surface", () => {
        // Pages import from @ui, so a design-system export missing here is
        // invisible to the app. Overrides replace entries; they must never
        // silently drop them.
        const missing = Object.keys(designSystem).filter((name) => !(name in registry))
        expect(missing).toEqual([])
    })
})
