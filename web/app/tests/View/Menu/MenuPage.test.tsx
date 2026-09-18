import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, describe, expect, it } from "vitest"
import { business, formatPrice, menu } from "../../../src/View/Menu/content"
import MenuPage from "../../../src/View/Menu/MenuPage"

describe("MenuPage (landing kernel)", () => {
    afterEach(() => {
        cleanup()
    })

    it("renders the business identity and every menu item with its price", () => {
        render(
            <MemoryRouter>
                <MenuPage />
            </MemoryRouter>,
        )
        expect(screen.getByRole("heading", { name: business.name })).toBeTruthy()
        for (const section of menu) {
            for (const item of section.items) {
                expect(screen.getByText(item.name)).toBeTruthy()
                expect(screen.getAllByText(formatPrice(item.priceCents)).length).toBeGreaterThan(0)
            }
        }
    })

    it("narrows to one menu section via its filter chip", () => {
        render(
            <MemoryRouter>
                <MenuPage />
            </MemoryRouter>,
        )
        fireEvent.click(screen.getByRole("button", { name: "Drinks" }))
        const drinks = menu.find((s) => s.title === "Drinks")
        if (!drinks) throw new Error("fixture needs a Drinks section")
        for (const item of drinks.items) {
            expect(screen.getByText(item.name)).toBeTruthy()
        }
        expect(screen.queryByText(menu[0].items[0].name)).toBeNull()

        // The "show everything" chip restores the full menu.
        fireEvent.click(screen.getByRole("button", { name: "Everything" }))
        expect(screen.getByText(menu[0].items[0].name)).toBeTruthy()
    })

    it("filters items by a dietary chip", () => {
        render(
            <MemoryRouter>
                <MenuPage />
            </MemoryRouter>,
        )
        fireEvent.click(screen.getByRole("button", { name: "Gluten-free" }))
        for (const section of menu) {
            for (const item of section.items) {
                if (item.dietary.includes("GF")) {
                    expect(screen.getByText(item.name)).toBeTruthy()
                } else {
                    expect(screen.queryByText(item.name)).toBeNull()
                }
            }
        }
    })

    it("shows a live open/closed badge and the weekly hours", () => {
        render(
            <MemoryRouter>
                <MenuPage />
            </MemoryRouter>,
        )
        expect(screen.getByText(/^(Open — closes|Closed — opens)/)).toBeTruthy()
        // Weekly hours render as contact channels, one row per day.
        expect(screen.getByText("Monday")).toBeTruthy()
        const directions = screen.getByRole("link", { name: business.address })
        expect(directions.getAttribute("href")).toContain("maps.google.com")
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
