import { MarketingSteps } from "@ui"
import { cleanup, render, screen } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it } from "vitest"

/**
 * `steps` `timeline` turns photographic when any step carries media or
 * frames: each step hangs from a clock mark on the line with its lead
 * photograph and a contact strip of frames. Landing documents only carry
 * `{id, type, variant}`, so a timeline over copy-only steps must keep the
 * original numbered reading.
 */

const photo = (name: string) => ({
    kind: "image" as const,
    src: `/services-makeup-tidewater/${name}.webp`,
    alt: name,
    width: 1600,
    height: 1200,
})

afterEach(() => {
    cleanup()
})

describe("steps timeline, photographic", () => {
    it("sets each step's clock mark, lead photograph and frames, in order", () => {
        const { container } = render(
            <MarketingSteps
                variant="timeline"
                title="Six-thirty to nine."
                steps={[
                    {
                        label: "6:30",
                        title: "Arrive & set up",
                        description: "Curling irons humming.",
                        media: photo("brushes"),
                        frames: [photo("kit"), photo("bouquet")],
                    },
                    {
                        label: "7:15",
                        title: "The bride",
                        description: "Calm and focused.",
                        media: photo("bride"),
                    },
                    { title: "Wrap", description: "Kits packed by ten." },
                ]}
            />,
        )
        const items = container.querySelectorAll("ol > li")
        expect(items).toHaveLength(3)
        expect(screen.getByText("6:30")).toBeTruthy()
        expect(screen.getByText("7:15")).toBeTruthy()
        expect(screen.getByRole("heading", { name: "Arrive & set up" })).toBeTruthy()
        expect(screen.getByText("Curling irons humming.")).toBeTruthy()
        const firstImages = [...items[0].querySelectorAll("img")].map((img) => img.getAttribute("alt"))
        expect(firstImages).toEqual(["brushes", "kit", "bouquet"])
        expect(items[1].querySelectorAll("img")).toHaveLength(1)
        expect(items[0].getAttribute("data-pictured")).toBe("true")
        // A copy-only step keeps a numbered mark and no media column.
        expect(items[2].getAttribute("data-pictured")).not.toBe("true")
        expect(items[2].querySelectorAll("img")).toHaveLength(0)
        expect(items[2].textContent).toMatch(/03|3/)
    })

    it("turns photographic on frames alone", () => {
        const { container } = render(
            <MarketingSteps
                variant="timeline"
                steps={[
                    { title: "One", description: "a", frames: [photo("a"), photo("b")] },
                    { title: "Two", description: "b" },
                ]}
            />,
        )
        expect(container.querySelector('li[data-pictured="true"]')).not.toBeNull()
        expect(container.querySelectorAll("img")).toHaveLength(2)
    })

    it("keeps the numbered timeline for copy-only steps", () => {
        const { container } = render(
            <MarketingSteps
                variant="timeline"
                steps={[
                    { title: "Consult", description: "We talk." },
                    { title: "Trial", description: "We test." },
                ]}
            />,
        )
        expect(container.querySelector("[data-pictured]")).toBeNull()
        expect(screen.getByRole("heading", { name: "Consult" })).toBeTruthy()
        expect(container.querySelectorAll("img")).toHaveLength(0)
    })
})
