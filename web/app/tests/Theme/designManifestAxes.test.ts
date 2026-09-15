import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { marketingPresetDefinitions, marketingPresetNames } from "@ui"

/**
 * The design manifest's per-preset ambition axes are extracted from
 * marketingPresets.ts by regex (scripts/lib/design-vocabulary.mjs) — the
 * platform's remix energy derivation trusts them. This pins the extraction
 * to the real module: a source-format change that silently mis-parses an
 * axis fails here instead of shipping wrong energy data.
 */
describe("design manifest preset axes", () => {
    const manifest = JSON.parse(
        readFileSync(path.resolve(__dirname, "../../../../docs/design-manifest.json"), "utf8"),
    ) as {
        landing: {
            stylePresets: string[]
            stylePresetAxes: Record<string, { motion: string; treatment: string[]; displayScale: number }>
        }
    }

    it("enumerates every registered preset", () => {
        expect(manifest.landing.stylePresets).toEqual(marketingPresetNames)
        expect(Object.keys(manifest.landing.stylePresetAxes).sort()).toEqual([...marketingPresetNames].sort())
    })

    it("matches the module's authored axes exactly", () => {
        for (const name of marketingPresetNames) {
            const definition = marketingPresetDefinitions[name]
            expect(manifest.landing.stylePresetAxes[name], name).toEqual({
                motion: definition.motion.idiom,
                treatment: [...definition.treatment],
                displayScale: Number(definition.display.scale),
            })
        }
    })
})
