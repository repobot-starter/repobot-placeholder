import { describe, expect, it } from "vitest"
import { lineups, machines } from "../../../src/View/Sugar/content"

describe("sugar content", () => {
    it("ships at least one lineup, each with pastries at honest prices", () => {
        expect(lineups.length).toBeGreaterThan(0)
        for (const lineup of lineups) {
            expect(lineup.title).not.toBe("")
            expect(lineup.pastries.length).toBeGreaterThan(0)
            for (const pastry of lineup.pastries) {
                expect(pastry.name).not.toBe("")
                expect(pastry.priceCents).toBeGreaterThan(0)
            }
        }
    })

    it("keeps pastry names unique within each lineup", () => {
        for (const lineup of lineups) {
            const names = lineup.pastries.map((pastry) => pastry.name)
            expect(new Set(names).size).toBe(names.length)
        }
    })

    it("gives every machine a coherent schedule", () => {
        expect(machines.length).toBeGreaterThan(0)
        for (const machine of machines) {
            expect(machine.name).not.toBe("")
            expect(machine.schedule.stockedDays.length).toBeGreaterThan(0)
            for (const day of machine.schedule.stockedDays) {
                expect(day).toBeGreaterThanOrEqual(0)
                expect(day).toBeLessThanOrEqual(6)
            }
            // Restock before sellout, both within the day.
            expect(machine.schedule.restockMinute).toBeGreaterThanOrEqual(0)
            expect(machine.schedule.restockMinute).toBeLessThan(
                machine.schedule.selloutMinute,
            )
            expect(machine.schedule.selloutMinute).toBeLessThan(24 * 60)
        }
    })

    it("keeps machine names unique", () => {
        const names = machines.map((machine) => machine.name)
        expect(new Set(names).size).toBe(names.length)
    })
})
