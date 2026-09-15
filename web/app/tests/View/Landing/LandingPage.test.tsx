import type { LandingConfig } from "@ui"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { landing } from "../../../src/View/Landing/landing"
import LandingPage from "../../../src/View/Landing/LandingPage"
import { LandingRenderer } from "../../../src/View/Landing/LandingRenderer"

function sectionContent<T extends (typeof landing.sections)[number]["type"]>(
    type: T,
): Extract<(typeof landing.sections)[number], { type: T }>["content"] {
    const section = landing.sections.find(
        (entry): entry is Extract<(typeof landing.sections)[number], { type: T }> => entry.type === type,
    )
    if (!section) throw new Error(`landing.ts fixture needs a "${type}" section`)
    return section.content
}

describe("LandingPage (landing kernel exemplar)", () => {
    beforeEach(() => {
        localStorage.clear()
    })

    afterEach(() => {
        cleanup()
    })

    it("renders the hero, features, and FAQ from landing.ts", () => {
        render(
            <MemoryRouter>
                <LandingPage />
            </MemoryRouter>,
        )

        const hero = sectionContent("hero")
        expect(screen.getByRole("heading", { name: hero.headline })).toBeTruthy()

        for (const feature of sectionContent("feature-grid").features) {
            expect(screen.getByRole("heading", { name: feature.title })).toBeTruthy()
        }
        for (const item of sectionContent("faq").items) {
            expect(screen.getByText(item.question)).toBeTruthy()
        }
    })

    it("gives every section its anchor id so nav links resolve", () => {
        const { container } = render(
            <MemoryRouter>
                <LandingPage />
            </MemoryRouter>,
        )

        for (const section of landing.sections) {
            expect(container.querySelector(`#${section.type}`), section.type).toBeTruthy()
        }
    })

    it("captures a lead email locally and persists across mounts", () => {
        render(
            <MemoryRouter>
                <LandingPage />
            </MemoryRouter>,
        )

        const form = sectionContent("lead-form")

        fireEvent.change(screen.getByRole("textbox", { name: "Email address" }), {
            target: { value: "ada@example.com" },
        })
        fireEvent.click(screen.getByRole("button", { name: form.cta }))

        expect(localStorage.getItem("landing-lead-email")).toBe("ada@example.com")
        expect(screen.getByText(form.confirmation)).toBeTruthy()

        cleanup()
        render(
            <MemoryRouter>
                <LandingPage />
            </MemoryRouter>,
        )
        expect(screen.getByText(form.confirmation)).toBeTruthy()
        expect(screen.queryByRole("textbox", { name: "Email address" })).toBeNull()
    })

    it("filters showcase items by tag chip", () => {
        render(
            <MemoryRouter>
                <LandingPage />
            </MemoryRouter>,
        )

        const items = sectionContent("showcase").items
        fireEvent.click(screen.getByRole("button", { name: "Packaging" }))

        for (const item of items) {
            const shown = screen.queryByRole("heading", { name: item.title }) !== null
            expect(shown, item.title).toBe((item.tags ?? []).includes("Packaging"))
        }

        fireEvent.click(screen.getByRole("button", { name: "All" }))
        for (const item of items) {
            expect(screen.getByRole("heading", { name: item.title })).toBeTruthy()
        }
    })
})

/** Phase 3 sections/variants not exercised by the exemplar page. */
const phase3: LandingConfig = {
    style: { preset: "warm-boutique" },
    sections: [
        {
            type: "hero",
            variant: "product-frame",
            content: {
                headline: "Every job, quoted in minutes.",
                media: { kind: "emoji", emoji: "🧰" },
            },
        },
        {
            type: "social-proof",
            variant: "metrics-row",
            content: {
                metrics: [
                    { value: "1,200+", label: "jobs completed" },
                    { value: "4.9★", label: "average rating" },
                ],
            },
        },
        {
            type: "steps",
            variant: "timeline",
            content: {
                title: "How a job runs",
                steps: [
                    { title: "Call us", description: "Same-day callback, always." },
                    { title: "Fixed quote", description: "The number we say is the number you pay." },
                ],
            },
        },
        {
            type: "testimonials",
            variant: "quote-grid",
            content: {
                title: "Word around town",
                quotes: [{ quote: "Showed up on time, twice.", author: "Rita M.", title: "Homeowner" }],
            },
        },
        {
            type: "lead-form",
            variant: "contact-block",
            content: {
                title: "Reach the crew",
                body: "Weekdays seven to five.",
                channels: [
                    { label: "Email", value: "crew@trade.example", href: "mailto:crew@trade.example" },
                    { label: "Yard", value: "4 Quarry Lane" },
                ],
            },
        },
    ],
}

describe("LandingRenderer (Phase 3 sections)", () => {
    afterEach(() => {
        cleanup()
    })

    it("renders the new section types and variants", () => {
        const { container } = render(<LandingRenderer config={phase3} />)

        expect(screen.getByRole("heading", { name: /Every job, quoted in minutes/ })).toBeTruthy()
        expect(screen.getByText("jobs completed")).toBeTruthy()
        expect(screen.getByText("Fixed quote")).toBeTruthy()
        expect(screen.getByText(/Showed up on time, twice/)).toBeTruthy()
        expect(screen.getByRole("link", { name: "crew@trade.example" })).toBeTruthy()
        expect(screen.getByText("4 Quarry Lane")).toBeTruthy()

        for (const section of phase3.sections) {
            expect(container.querySelector(`#${section.type}`), section.type).toBeTruthy()
        }
    })

    it("stamps each section wrapper with its rendered layout variant", () => {
        // The platform's layout chooser reads data-rb-section-variant to mark
        // the current layout; a section whose config declares none carries no
        // stamp (the component's own default renders, unnamed).
        const withUndeclared: LandingConfig = {
            ...phase3,
            sections: [
                ...phase3.sections,
                { type: "faq", content: { items: [{ question: "Q", answer: "A" }] } },
            ],
        }
        const { container } = render(<LandingRenderer config={withUndeclared} />)

        for (const section of phase3.sections) {
            const wrap = container.querySelector(`[data-rb-section-type="${section.type}"]`)
            expect(wrap, section.type).toBeTruthy()
            expect(wrap?.getAttribute("data-rb-section-variant"), section.type).toBe(section.variant ?? null)
        }
        const faqWrap = container.querySelector('[data-rb-section-type="faq"]')
        expect(faqWrap).toBeTruthy()
        expect(faqWrap?.hasAttribute("data-rb-section-variant")).toBe(false)
    })
})
