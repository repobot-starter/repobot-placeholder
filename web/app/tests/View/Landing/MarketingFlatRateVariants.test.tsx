import { MarketingContentSplit, MarketingHero, MarketingPricing, MarketingSteps } from "@ui"
import { cleanup, render, screen, within } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it } from "vitest"

/**
 * The flat-rate trade variants: `pricing` `price-list` (a printed menu
 * board), `content-split` `report` (a signed case file for one job), and
 * `steps` `message-thread` (how it works as a text conversation), plus the
 * hero's live status badge and its text-thread aside. Landing documents only carry `{id, type,
 * variant}`, so each variant must also degrade gracefully over content
 * written for its siblings.
 */

const photo = (name: string) => ({
    kind: "image" as const,
    src: `/services-emergency/${name}.webp`,
    alt: name,
    width: 864,
    height: 1152,
})

afterEach(() => {
    cleanup()
})

describe("pricing price-list", () => {
    it("prints grouped lines with leaders, qualifiers, the footnote, and one ask", () => {
        const { container } = render(
            <MarketingPricing
                variant="price-list"
                title="Price book"
                intro="All flat-rate."
                groups={[
                    {
                        heading: "Drains",
                        items: [
                            { name: "Clear a drain", note: "Sink, tub, or shower", price: "$189" },
                            { name: "Main line clearing", price: "$345", qualifier: "from" },
                        ],
                    },
                    { heading: "Heaters", items: [{ name: "Water heater, 50 gal", price: "$1,850" }] },
                ]}
                footnote="The quote is the price."
                cta={{ label: "Get an exact quote", href: "/request" }}
            />,
        )
        expect(screen.getByRole("heading", { name: "Price book" })).toBeTruthy()
        expect(screen.getByText("Drains")).toBeTruthy()
        expect(screen.getByText("Heaters")).toBeTruthy()
        expect(screen.getByText("$1,850")).toBeTruthy()
        expect(screen.getByText("from")).toBeTruthy()
        expect(screen.getByText("Sink, tub, or shower")).toBeTruthy()
        expect(screen.getByText("The quote is the price.")).toBeTruthy()
        expect(screen.getByRole("link", { name: "Get an exact quote" }).getAttribute("href")).toBe("/request")
        // The dotted leaders are decoration only.
        const leaders = container.querySelectorAll('[aria-hidden="true"]')
        expect(leaders.length).toBeGreaterThanOrEqual(3)
    })

    it("prints tier content as lines when a composer re-rolls a tiers section", () => {
        render(
            <MarketingPricing
                variant="price-list"
                tiers={[
                    {
                        name: "Tune-up",
                        monthly: 149,
                        yearlyPerMonth: 149,
                        description: "Once a year",
                        features: [],
                    },
                ]}
                period=""
            />,
        )
        expect(screen.getByText("Tune-up")).toBeTruthy()
        expect(screen.getByText(/\$149/)).toBeTruthy()
    })
})

describe("content-split report", () => {
    it("files the job as a signed card with labeled rows and before/after photos", () => {
        render(
            <MarketingContentSplit
                variant="report"
                headline="Every job gets a report."
                body="Same number twice."
                report={{
                    label: "Job report",
                    issuer: "Straight Pipe Plumbing",
                    title: "Job #4127 — Water heater swap",
                    location: "Bungalow Heaven, Pasadena",
                    rows: [
                        { label: "Quoted", value: "$1,680" },
                        { label: "Final", value: "$1,680", highlight: true },
                    ],
                    before: photo("before"),
                    after: photo("after"),
                    signature: { name: "Luis Ortega", detail: "Lic. #1084217 · C-36" },
                    stamp: "Quote = final",
                }}
            />,
        )
        expect(screen.getByRole("heading", { name: "Every job gets a report." })).toBeTruthy()
        const card = screen.getByRole("article")
        expect(within(card).getByText("Job #4127 — Water heater swap")).toBeTruthy()
        expect(within(card).getByText("Quoted")).toBeTruthy()
        expect(within(card).getAllByText("$1,680")).toHaveLength(2)
        expect(within(card).getByAltText("before")).toBeTruthy()
        expect(within(card).getByAltText("after")).toBeTruthy()
        expect(within(card).getByText(/Luis Ortega/)).toBeTruthy()
        expect(within(card).getByText("Quote = final")).toBeTruthy()
    })

    it("renders like media-right when the document picks report over plain split content", () => {
        render(<MarketingContentSplit variant="report" headline="The crew" media={photo("crew")} />)
        expect(screen.queryByRole("article")).toBeNull()
        expect(screen.getByAltText("crew")).toBeTruthy()
    })
})

describe("steps message-thread", () => {
    it("renders each step as a bubble with its time, chip, and attachment, beside the walkthrough", () => {
        render(
            <MarketingSteps
                variant="message-thread"
                title="How it works"
                thread={{ name: "Straight Pipe", detail: "Pasadena, CA" }}
                steps={[
                    {
                        title: "Luis is on the way",
                        description: "We text when we're rolling.",
                        side: "end",
                        time: "10:28 AM",
                    },
                    {
                        title: "Found it. Quote $240 — approve?",
                        description: "One flat quote with a photo.",
                        side: "end",
                        media: photo("valve"),
                    },
                    { title: "Yes — go ahead!", description: "You approve by text.", chip: "Approved" },
                ]}
            />,
        )
        const messages = screen.getByRole("list", { name: "Text messages" })
        expect(within(messages).getAllByRole("listitem")).toHaveLength(3)
        expect(within(messages).getByText("10:28 AM")).toBeTruthy()
        expect(within(messages).getByText(/Approved/)).toBeTruthy()
        expect(within(messages).getByAltText("valve")).toBeTruthy()
        expect(screen.getByText("Straight Pipe")).toBeTruthy()
        expect(screen.getByText("You approve by text.")).toBeTruthy()
    })

    it("still renders plain numbered-card content as a thread", () => {
        render(
            <MarketingSteps
                variant="message-thread"
                steps={[
                    { title: "A person answers", description: "No phone tree." },
                    { title: "Fixed", description: "Tested and tidy." },
                ]}
            />,
        )
        expect(
            within(screen.getByRole("list", { name: "Text messages" })).getAllByRole("listitem"),
        ).toHaveLength(2)
    })
})

describe("hero live badge", () => {
    it("marks the live badge as a status with a decorative dot", () => {
        render(
            <MarketingHero
                variant="statement"
                headline="The price is the price."
                badge="On call now, 24/7"
                badgeLive
            />,
        )
        expect(screen.getByRole("status").textContent).toBe("On call now, 24/7")
    })

    it("keeps the plain badge when not live", () => {
        render(<MarketingHero variant="statement" headline="The price is the price." badge="24/7 dispatch" />)
        expect(screen.queryByRole("status")).toBeNull()
        expect(screen.getByText("24/7 dispatch")).toBeTruthy()
    })
})

describe("hero thread aside", () => {
    const aside = {
        kind: "thread" as const,
        name: "Straight Pipe",
        detail: "Pasadena, CA",
        messages: [
            { text: "Luis is on the way.", side: "end" as const, time: "10:28 AM" },
            { text: "Quote $240. Approve?", side: "end" as const, media: photo("thread-valve") },
            { text: "Yes — go ahead!", chip: "Approved" },
        ],
    }

    it("renders the thread beside the split hero's copy, after the CTAs", () => {
        const { container } = render(
            <MarketingHero
                variant="split-media"
                headline="The price is the price."
                primaryCta={{ label: "Call now", href: "tel:+16265550148" }}
                aside={aside}
            />,
        )
        const thread = screen.getByRole("list", { name: "Text messages" })
        expect(within(thread).getAllByRole("listitem")).toHaveLength(3)
        expect(screen.getByText("Straight Pipe")).toBeTruthy()
        expect(screen.getByText("✓ Approved")).toBeTruthy()
        expect(within(thread).getByRole("img").getAttribute("src")).toContain("thread-valve")
        const cta = screen.getByRole("link", { name: "Call now" })
        expect(cta.compareDocumentPosition(thread) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
        expect(container.querySelectorAll("header")).toHaveLength(1)
    })

    it("yields the column to a hero photo, and is ignored by other variants", () => {
        render(<MarketingHero variant="split-media" headline="Hi" media={photo("van")} aside={aside} />)
        expect(screen.queryByRole("list", { name: "Text messages" })).toBeNull()
        cleanup()
        render(<MarketingHero variant="statement" headline="Hi" aside={aside} />)
        expect(screen.queryByRole("list", { name: "Text messages" })).toBeNull()
    })
})
