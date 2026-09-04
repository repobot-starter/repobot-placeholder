import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { decks } from "../../../src/View/Flash/content"
import FlashPage from "../../../src/View/Flash/FlashPage"

describe("FlashPage", () => {
    beforeEach(() => {
        localStorage.clear()
    })

    afterEach(() => {
        cleanup()
    })

    it("lists every deck with its due count", () => {
        render(<FlashPage />)
        for (const deck of decks) {
            expect(screen.getByRole("heading", { name: deck.title })).toBeTruthy()
        }
        // Fresh state: every card is due.
        expect(screen.getAllByText(/\d+ due/).length).toBe(decks.length)
    })

    it("flips a card and grades it, persisting progress", () => {
        render(<FlashPage />)
        const deck = decks[0]
        fireEvent.click(screen.getByRole("heading", { name: deck.title }))

        // Grading is locked until the card is flipped.
        const good = screen.getByRole("button", { name: "Got it" })
        expect((good as HTMLButtonElement).disabled).toBe(true)

        fireEvent.click(screen.getByRole("button", { name: "Reveal answer" }))
        expect((screen.getByRole("button", { name: "Got it" }) as HTMLButtonElement).disabled).toBe(false)
        fireEvent.click(screen.getByRole("button", { name: "Got it" }))

        const saved = JSON.parse(localStorage.getItem("flashbot-progress") ?? "{}")
        expect(saved[deck.id][deck.cards[0].front].box).toBe(2)
    })

    it("requeues a missed card at the end of the session", () => {
        render(<FlashPage />)
        const deck = decks[0]
        fireEvent.click(screen.getByRole("heading", { name: deck.title }))

        expect(screen.getByText(`${deck.cards.length} to go`)).toBeTruthy()
        fireEvent.click(screen.getByRole("button", { name: "Reveal answer" }))
        fireEvent.click(screen.getByRole("button", { name: "Again" }))
        // Missed card goes to the back of the queue; the count doesn't drop.
        expect(screen.getByText(`${deck.cards.length} to go`)).toBeTruthy()

        const saved = JSON.parse(localStorage.getItem("flashbot-progress") ?? "{}")
        expect(saved[deck.id][deck.cards[0].front].box).toBe(1)
    })

    it("keeps deck content well-formed", () => {
        const ids = decks.map((d) => d.id)
        expect(new Set(ids).size).toBe(ids.length)
        for (const deck of decks) {
            expect(deck.cards.length).toBeGreaterThan(0)
            const fronts = deck.cards.map((c) => c.front)
            expect(new Set(fronts).size).toBe(fronts.length)
        }
    })
})
