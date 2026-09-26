/**
 * The emergency skins' job reports are real evidence: every report's
 * before/after photographs must exist as responsive assets under the
 * seed's own public directory, described for screen readers, and each
 * report's final must match its quote — the pack's whole argument.
 */

import path from "node:path"
import { describe, expect, it } from "vitest"
import { publicAssetPresent } from "../../helpers/publicAssets"
import * as electric from "../../../src/View/ServicesEmergency/electricTechnoRemix.content"
import * as hvac from "../../../src/View/ServicesEmergency/hvacDesertRemix.content"

const PUBLIC_DIR = path.resolve(__dirname, "../../../public")

const seeds = [
    { name: "electric-techno", module: electric, publicPrefix: "/services-electric-techno/" },
    { name: "hvac-desert", module: hvac, publicPrefix: "/services-hvac-desert/" },
]

describe.each(seeds)("emergency $name remix job reports", ({ module, publicPrefix }) => {
    it("files at least one report whose final matches its quote", () => {
        expect(module.jobReports.items.length).toBeGreaterThanOrEqual(1)
        for (const report of module.jobReports.items) {
            expect(report.final, `${report.jobNumber} final`).toBe(report.quoted)
        }
    })

    it("keeps every before/after photo real, described, and under the seed's own directory", () => {
        for (const report of module.jobReports.items) {
            for (const [label, image] of [
                [`${report.jobNumber} before`, report.before],
                [`${report.jobNumber} after`, report.after],
            ] as const) {
                expect(image.alt, `${label} needs alt text`).not.toBe("")
                expect(image.src.startsWith(publicPrefix), `${label} must live under ${publicPrefix}`).toBe(
                    true,
                )
                expect(image.srcSet.map((entry) => entry.src)).toContain(image.src)
                for (const entry of image.srcSet) {
                    expect(
                        publicAssetPresent(path.join(PUBLIC_DIR, entry.src)),
                        `${label}: ${entry.src}`,
                    ).toBe(true)
                }
            }
        }
    })

    it("carries the new dispatch keys with the board and thread left empty", () => {
        expect(module.priceBoard.items).toEqual([])
        expect(module.heroThread.messages).toEqual([])
        expect(module.home.heroImage).not.toBeNull()
        expect(module.booking.privacyNote).not.toBe("")
    })
})
