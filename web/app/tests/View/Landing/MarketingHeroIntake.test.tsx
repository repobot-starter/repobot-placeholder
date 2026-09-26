import { isMarketingIconName, MarketingHero, type MarketingLeadIntake } from "@ui"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

/**
 * The form-first intake: a hero whose form carries a heading, over its own
 * photograph, sets the copy full-bleed and seats a dispatcher's intake card
 * (icon choices, one extra field, the contact line) in the board's slot.
 * The heading-less form keeps the centered email capture.
 */

afterEach(() => {
    cleanup()
})

const intake: MarketingLeadIntake = {
    heading: "What happened?",
    choices: [
        { label: "Water", icon: "droplet" },
        { label: "Fire", icon: "flame" },
        { label: "Storm", icon: "storm" },
        { label: "Mold", icon: "spores" },
    ],
    field: { name: "zip", label: "ZIP code", placeholder: "ZIP" },
    contact: "tel",
    placeholder: "Phone for the callback",
    cta: "Send a crew",
    confirmation: "A dispatcher is calling you now.",
}

const photo = { kind: "image" as const, src: "/storm.webp", alt: "A crew at a flooded porch" }

describe("hero form-first intake", () => {
    it("names every new icon in the landing vocabulary", () => {
        for (const name of ["droplet", "flame", "storm", "spores", "leaf", "hanger"]) {
            expect(isMarketingIconName(name), name).toBe(true)
        }
    })

    it("offers the choices, the extra field, and a phone line", () => {
        render(
            <MarketingHero
                variant="form-first"
                headline="Storm damage, handled tonight."
                media={photo}
                form={intake}
                onFormSubmit={() => undefined}
            />,
        )
        expect(screen.getByRole("group", { name: "What happened?" })).toBeTruthy()
        expect(screen.getAllByRole("radio")).toHaveLength(4)
        expect(screen.getByRole("radio", { name: "Water" })).toHaveProperty("checked", true)
        expect(screen.getByRole("textbox", { name: "ZIP code" })).toBeTruthy()
        expect(screen.getByPlaceholderText("Phone for the callback")).toHaveProperty("type", "tel")
        expect(screen.getByRole("button", { name: "Send a crew" })).toBeTruthy()
    })

    it("submits the phone, the choice, and the field — never an email", () => {
        const onFormSubmit = vi.fn()
        render(
            <MarketingHero
                variant="form-first"
                headline="Storm damage, handled tonight."
                media={photo}
                form={intake}
                onFormSubmit={onFormSubmit}
            />,
        )
        fireEvent.click(screen.getByRole("radio", { name: "Storm" }))
        fireEvent.change(screen.getByRole("textbox", { name: "ZIP code" }), { target: { value: "70115" } })
        fireEvent.change(screen.getByPlaceholderText("Phone for the callback"), {
            target: { value: "(504) 555-0187" },
        })
        fireEvent.click(screen.getByRole("button", { name: "Send a crew" }))
        expect(onFormSubmit).toHaveBeenCalledWith("", {
            phone: "(504) 555-0187",
            choice: "Storm",
            zip: "70115",
        })
    })

    it("holds a too-short phone number back", () => {
        const onFormSubmit = vi.fn()
        render(
            <MarketingHero
                variant="form-first"
                headline="Storm damage, handled tonight."
                media={photo}
                form={intake}
                onFormSubmit={onFormSubmit}
            />,
        )
        fireEvent.change(screen.getByPlaceholderText("Phone for the callback"), { target: { value: "555" } })
        fireEvent.click(screen.getByRole("button", { name: "Send a crew" }))
        expect(onFormSubmit).not.toHaveBeenCalled()
    })

    it("shows the confirmation once joined", () => {
        render(
            <MarketingHero
                variant="form-first"
                headline="Storm damage, handled tonight."
                media={photo}
                form={intake}
                formJoined
                onFormSubmit={() => undefined}
            />,
        )
        expect(screen.getByText("A dispatcher is calling you now.")).toBeTruthy()
        expect(screen.queryByRole("radio")).toBeNull()
    })

    it("keeps the heading-less form as the centered email capture", () => {
        render(
            <MarketingHero
                variant="form-first"
                headline="Join the list."
                media={photo}
                form={{ placeholder: "you@example.com", cta: "Join", confirmation: "Thanks." }}
                onFormSubmit={() => undefined}
            />,
        )
        expect(screen.queryByRole("radio")).toBeNull()
        expect(screen.getByRole("button", { name: "Join" })).toBeTruthy()
    })
})
