import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { faq, features, pricing, product } from "../../../src/View/Launch/content"
import LaunchPage from "../../../src/View/Launch/LaunchPage"

describe("LaunchPage", () => {
    beforeEach(() => {
        localStorage.clear()
    })

    afterEach(() => {
        cleanup()
    })

    it("renders the hero, features, and FAQ from content.ts", () => {
        render(<LaunchPage />)

        expect(screen.getByRole("heading", { name: product.headline })).toBeTruthy()
        for (const feature of features) {
            expect(screen.getByRole("heading", { name: feature.title })).toBeTruthy()
        }
        for (const item of faq) {
            expect(screen.getByText(item.question)).toBeTruthy()
        }
    })

    it("switches tier prices with the billing toggle", () => {
        render(<LaunchPage />)

        const pro = pricing.find((tier) => tier.name === "Pro")
        if (!pro) throw new Error("fixture needs a Pro tier")
        expect(screen.getByText(`$${pro.monthly}`)).toBeTruthy()

        fireEvent.click(screen.getByRole("button", { name: "Yearly" }))
        expect(screen.getByText(`$${pro.yearlyPerMonth}`)).toBeTruthy()
        expect(screen.queryByText(`$${pro.monthly}`)).toBeNull()
    })

    it("captures a waitlist email locally and persists across mounts", () => {
        render(<LaunchPage />)

        fireEvent.change(screen.getByRole("textbox", { name: "Email address" }), {
            target: { value: "ada@example.com" },
        })
        fireEvent.click(screen.getAllByRole("button", { name: product.waitlistCta })[0])

        expect(localStorage.getItem("launchbot-waitlist-email")).toBe("ada@example.com")
        expect(screen.getByText(/You're on the list/)).toBeTruthy()

        cleanup()
        render(<LaunchPage />)
        // Once joined, the form stays replaced by the confirmation.
        expect(screen.getByText(/You're on the list/)).toBeTruthy()
        expect(screen.queryByRole("textbox", { name: "Email address" })).toBeNull()
    })

    it("keeps yearly prices at or below monthly for every tier", () => {
        for (const tier of pricing) {
            expect(tier.yearlyPerMonth).toBeLessThanOrEqual(tier.monthly)
        }
    })
})
