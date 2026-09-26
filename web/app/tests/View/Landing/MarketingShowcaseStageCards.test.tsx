import { MarketingShowcase, type MarketingShowcaseItem } from "@ui"
import { cleanup, render } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it } from "vitest"

/**
 * A `card-grid` item's `icon` and `points` turn a plain card into a stage
 * card: a named line icon set above the title, and a short list of what
 * the card covers under the description. Both are optional; a card
 * without them renders exactly as before, and an unknown icon name
 * (manifest data is unchecked JSON) renders nothing rather than a hole.
 */

const stages: MarketingShowcaseItem[] = [
    {
        title: "Pregnancy",
        description: "From heartbeat to birth day.",
        icon: "sun",
        points: ["Prenatal care", "Your birth plan, in writing"],
    },
    { title: "Plain", description: "No emblem, no list." },
    { title: "Unknown", description: "A stray icon name.", icon: "trumpet" as MarketingShowcaseItem["icon"] },
]

function card(container: HTMLElement, title: string): HTMLElement {
    const heading = [...container.querySelectorAll("article h3")].find((node) => node.textContent === title)
    const article = heading?.closest("article")
    if (!(article instanceof HTMLElement)) throw new Error(`no card titled ${title}`)
    return article
}

afterEach(cleanup)

describe("MarketingShowcase card-grid stage cards", () => {
    it("sets the emblem above the title and the list under the description", () => {
        const { container } = render(<MarketingShowcase variant="card-grid" items={stages} />)
        const pregnancy = card(container, "Pregnancy")
        const icon = pregnancy.querySelector("svg")
        const title = pregnancy.querySelector("h3")
        const description = pregnancy.querySelector("p")
        const list = pregnancy.querySelector("ul")
        expect(icon).not.toBeNull()
        expect(list).not.toBeNull()
        expect([...(list?.querySelectorAll("li") ?? [])].map((item) => item.textContent)).toEqual([
            "Prenatal care",
            "Your birth plan, in writing",
        ])
        // Document order: emblem, title, description, list.
        expect(icon?.compareDocumentPosition(title as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
        expect(description?.compareDocumentPosition(list as Node)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    })

    it("leaves a card without them unchanged, and drops an unknown icon", () => {
        const { container } = render(<MarketingShowcase variant="card-grid" items={stages} />)
        const plain = card(container, "Plain")
        expect(plain.querySelector("svg")).toBeNull()
        expect(plain.querySelector("ul")).toBeNull()
        expect(card(container, "Unknown").querySelector("svg")).toBeNull()
    })
})
