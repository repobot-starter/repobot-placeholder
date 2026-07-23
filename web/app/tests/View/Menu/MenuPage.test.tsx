import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it } from "vitest"
import { business, formatPrice, menu } from "../../../src/View/Menu/content"
import MenuPage from "../../../src/View/Menu/MenuPage"

describe("MenuPage", () => {
    afterEach(() => {
        cleanup()
    })

    it("renders the business identity and the first menu section", () => {
        render(<MenuPage />)
        expect(screen.getByRole("heading", { name: business.name })).toBeTruthy()
        for (const item of menu[0].items) {
            expect(screen.getByText(item.name)).toBeTruthy()
            expect(screen.getAllByText(formatPrice(item.priceCents)).length).toBeGreaterThan(0)
        }
    })

    it("switches menu sections via the tabs", () => {
        render(<MenuPage />)
        fireEvent.click(screen.getByRole("button", { name: "Drinks" }))
        const drinks = menu.find((s) => s.title === "Drinks")
        if (!drinks) throw new Error("fixture needs a Drinks section")
        for (const item of drinks.items) {
            expect(screen.getByText(item.name)).toBeTruthy()
        }
        expect(screen.queryByText(menu[0].items[0].name)).toBeNull()
    })

    it("filters items by dietary chips", () => {
        render(<MenuPage />)
        fireEvent.click(screen.getByRole("button", { name: "Gluten-free" }))
        const breakfast = menu[0]
        for (const item of breakfast.items) {
            if (item.dietary.includes("GF")) {
                expect(screen.getByText(item.name)).toBeTruthy()
            } else {
                expect(screen.queryByText(item.name)).toBeNull()
            }
        }
    })

    it("shows an open/closed status badge and weekly hours", () => {
        render(<MenuPage />)
        expect(screen.getByText(/^(Open — closes|Closed — opens)/)).toBeTruthy()
        expect(screen.getByText("Monday")).toBeTruthy()
        expect(screen.getByText("Get directions →")).toBeTruthy()
    })

    it("keeps menu content well-formed", () => {
        for (const section of menu) {
            expect(section.items.length).toBeGreaterThan(0)
            const names = section.items.map((i) => i.name)
            expect(new Set(names).size).toBe(names.length)
            for (const item of section.items) {
                expect(item.priceCents).toBeGreaterThan(0)
            }
        }
    })
})
