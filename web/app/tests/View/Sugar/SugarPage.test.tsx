import { cleanup, render, screen } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it } from "vitest"
import { brand, contact, howItWorks, lineups, machines } from "../../../src/View/Sugar/content"
import { epochDay, formatPrice, lineupIndexForDay } from "../../../src/View/Sugar/freshness"
import SugarPage from "../../../src/View/Sugar/SugarPage"

describe("SugarPage (landing kernel)", () => {
    afterEach(() => {
        cleanup()
    })

    it("renders the brand, story, and every how-it-works step", () => {
        render(<SugarPage />)
        expect(screen.getByRole("heading", { name: brand.tagline })).toBeTruthy()
        expect(screen.getAllByText(brand.name).length).toBeGreaterThan(0)
        expect(screen.getByText(brand.story)).toBeTruthy()
        for (const step of howItWorks) {
            expect(screen.getByRole("heading", { name: step.title })).toBeTruthy()
        }
    })

    it("shows today's lineup with every pastry and its price", () => {
        render(<SugarPage />)
        const lineup = lineups[lineupIndexForDay(epochDay(new Date()), lineups.length)]
        expect(screen.getByRole("heading", { name: lineup.title })).toBeTruthy()
        for (const pastry of lineup.pastries) {
            expect(screen.getByRole("heading", { name: pastry.name })).toBeTruthy()
            expect(screen.getAllByText(formatPrice(pastry.priceCents)).length).toBeGreaterThan(0)
        }
    })

    it("lists every machine with a live status badge", () => {
        render(<SugarPage />)
        for (const machine of machines) {
            expect(screen.getByRole("heading", { name: machine.name })).toBeTruthy()
        }
        const badges = screen.getAllByText(/^(Stocked fresh|Selling fast|Restocking at|Sold out|Back )/)
        expect(badges.length).toBe(machines.length)
    })

    it("wires the host CTA to email", () => {
        render(<SugarPage />)
        expect(screen.getByRole("heading", { name: contact.hostPitch })).toBeTruthy()
        const ctas = screen.getAllByRole("link", { name: "Talk to us" }) as HTMLAnchorElement[]
        expect(ctas.length).toBeGreaterThan(0)
        for (const cta of ctas) {
            expect(cta.href).toContain("mailto:")
        }
    })
})
