import { MarketingHero, splitAccentWord } from "@ui"
import { cleanup, render, screen } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it } from "vitest"

/**
 * The `full-stop` accent placement: only the headline's closing punctuation
 * takes the accent (a catalog full stop), set flush against the last word.
 */

afterEach(() => {
    cleanup()
})

describe("splitAccentWord full-stop", () => {
    it("accents the closing punctuation, joined to the lead", () => {
        expect(splitAccentWord("Rooms with a good attitude.", "full-stop")).toEqual({
            lead: "Rooms with a good attitude",
            accentWord: ".",
            trail: "",
            joined: true,
        })
        expect(splitAccentWord("Really?!", "full-stop").accentWord).toBe("?!")
        expect(splitAccentWord("And then\u2026", "full-stop").accentWord).toBe("\u2026")
    })

    it("stays bare without closing punctuation, or when the headline is only punctuation", () => {
        expect(splitAccentWord("Rooms with a good attitude", "full-stop")).toEqual({
            lead: "Rooms with a good attitude",
            accentWord: "",
            trail: "",
        })
        expect(splitAccentWord("...", "full-stop").accentWord).toBe("")
    })

    it("leaves the other placements unjoined", () => {
        expect(splitAccentWord("Rooms with a good attitude.").joined).toBeUndefined()
        expect(splitAccentWord("Rooms with a good attitude.", "first-word").joined).toBeUndefined()
    })
})

describe("hero full-stop accent", () => {
    it("renders the headline whole, with no space before the accented stop", () => {
        render(
            <MarketingHero
                variant="statement"
                accent="full-stop"
                headline="Rooms with a good attitude."
                subheadline="Interior design in Palm Springs."
            />,
        )
        const heading = screen.getByRole("heading", { level: 1 })
        expect(heading.textContent).toBe("Rooms with a good attitude.")
    })
})
