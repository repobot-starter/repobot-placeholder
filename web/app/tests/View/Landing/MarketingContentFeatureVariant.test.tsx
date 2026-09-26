import { MarketingContentSplit } from "@ui"
import { cleanup, render, screen } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it } from "vitest"

/**
 * content-split `feature`: one project told as a magazine feature — the
 * body in two columns under a drop cap, the media as a spread, the pull
 * quote, the detail figures, the plate. Landing documents only carry
 * `{id, type, variant}`, so it must also read over a plain split's content.
 */

const photo = (name: string) => ({
    kind: "image" as const,
    src: `/services-contractor-hallock/${name}.webp`,
    alt: name,
    width: 1600,
    height: 1000,
})

afterEach(() => {
    cleanup()
})

describe("content-split feature", () => {
    it("sets the story, the spread, the quote, the figures and the plate in order", () => {
        const { container } = render(
            <MarketingContentSplit
                variant="feature"
                kicker="The Estates · No. 41"
                headline="Hedges Lane, Amagansett"
                body={
                    "Set back from the lane.\n\nThe architecture is classic.\n\nA house for long breakfasts."
                }
                media={photo("feature-porch")}
                pullQuote="We build the house their grandchildren will argue over."
                figures={[
                    {
                        media: photo("detail-shingle"),
                        title: "Cedar shingle detail",
                        caption: "Left to weather.",
                    },
                    {
                        media: photo("detail-newel"),
                        title: "Hand-carved newel post",
                        caption: "Carved by hand.",
                    },
                ]}
                plate={{ media: photo("elevation"), caption: "Elevation · Hedges Lane, Amagansett" }}
                cta={{ label: "See the estates", href: "/projects" }}
            />,
        )
        expect(screen.getByRole("heading", { name: "Hedges Lane, Amagansett" })).toBeTruthy()
        expect(screen.getByText("The Estates · No. 41")).toBeTruthy()
        expect([...container.querySelectorAll("p")].slice(0, 3).map((p) => p.textContent)).toEqual([
            "Set back from the lane.",
            "The architecture is classic.",
            "A house for long breakfasts.",
        ])
        expect(container.querySelector("blockquote")?.textContent).toBe(
            "We build the house their grandchildren will argue over.",
        )
        expect([...container.querySelectorAll("img")].map((img) => img.getAttribute("alt"))).toEqual([
            "feature-porch",
            "detail-shingle",
            "detail-newel",
            "elevation",
        ])
        expect(screen.getByText("Cedar shingle detail")).toBeTruthy()
        expect(screen.getByText("Elevation · Hedges Lane, Amagansett")).toBeTruthy()
        expect(screen.getByRole("link", { name: "See the estates" }).getAttribute("href")).toBe("/projects")
    })

    it("opens as a feature over a plain split's content", () => {
        const { container } = render(
            <MarketingContentSplit
                variant="feature"
                headline="One claim"
                body="A single paragraph."
                bullets={["Unused by the feature"]}
                media={photo("feature-porch")}
            />,
        )
        expect(screen.getByRole("heading", { name: "One claim" })).toBeTruthy()
        expect(screen.getByText("A single paragraph.")).toBeTruthy()
        expect(container.querySelector("blockquote")).toBeNull()
        expect(container.querySelectorAll("img")).toHaveLength(1)
    })

    it("leaves the other split variants untouched by the feature fields", () => {
        const { container } = render(
            <MarketingContentSplit
                variant="media-left"
                headline="Side by side"
                body="The story."
                media={photo("feature-porch")}
                pullQuote="Not shown"
                figures={[{ media: photo("detail-shingle"), title: "Not shown either" }]}
            />,
        )
        expect(container.querySelector("blockquote")).toBeNull()
        expect(screen.queryByText("Not shown either")).toBeNull()
        expect(container.querySelectorAll("img")).toHaveLength(1)
    })
})
