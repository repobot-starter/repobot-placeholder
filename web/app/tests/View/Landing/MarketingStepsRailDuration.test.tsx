import { MarketingSteps } from "@ui"
import { cleanup, render, screen } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it } from "vitest"

/**
 * `steps` `horizontal-rail` sets a step's optional `duration` under its
 * title — the minutes a step of a ritual takes. Landing documents only carry
 * `{id, type, variant}`, so a rail over steps with no duration must render
 * no empty duration line.
 */

const photo = (name: string) => ({
    kind: "image" as const,
    src: `/services-hair-sable/${name}.webp`,
    alt: name,
    width: 1600,
    height: 1600,
})

afterEach(() => {
    cleanup()
})

describe("steps horizontal-rail duration", () => {
    it("sets each step's minutes under its title, in order", () => {
        render(
            <MarketingSteps
                variant="horizontal-rail"
                title="Two hours, five steps, one chair."
                steps={[
                    {
                        title: "Consult",
                        duration: "15 min",
                        description: "Scalp and strand.",
                        media: photo("a"),
                    },
                    {
                        title: "Press",
                        duration: "45 min",
                        description: "The lowest heat.",
                        media: photo("b"),
                    },
                ]}
            />,
        )
        const minutes = screen.getAllByText(/^\d+ min$/)
        expect(minutes.map((node) => node.textContent)).toEqual(["15 min", "45 min"])
        const consult = screen.getByText("Consult")
        expect(consult.compareDocumentPosition(minutes[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it("renders no duration line for steps without one", () => {
        const { container } = render(
            <MarketingSteps
                variant="horizontal-rail"
                steps={[
                    { label: "Day 1", title: "Survey", description: "We walk the site." },
                    { label: "Day 2", title: "Plan", description: "We draw it up." },
                ]}
            />,
        )
        expect(container.querySelectorAll("li")).toHaveLength(2)
        expect(container.querySelectorAll('[data-rb-text-field="duration"]')).toHaveLength(0)
        expect(screen.getByText("Survey")).toBeTruthy()
    })
})
