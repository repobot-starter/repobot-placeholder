import { Button, DetailPage } from "@base/design-system"
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import React from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

afterEach(cleanup)

/**
 * The drill-down page scaffold (Plan 2 Workstream A): header block + tabbed
 * content. Assertions are structural (roles, selection state) — every color
 * and space comes from theme tokens, so the file holds under any committed
 * repobot.theme.json.
 */

const TABS = [
    { id: "overview", label: "Overview", content: <p>Overview panel</p> },
    { id: "documents", label: "Documents", content: <p>Documents panel</p> },
    { id: "history", label: "History", content: <p>History panel</p> },
]

describe("DetailPage header block", () => {
    it("renders the title, status badge, subtitle, actions, and meta facts", () => {
        render(
            <DetailPage
                title="Order #1042"
                subtitle="Shanghai to Rotterdam"
                status={{ label: "In transit", tone: "info" }}
                actions={<Button>Ship order</Button>}
                meta={[
                    { label: "Created", value: "Mar 4" },
                    { label: "Total", value: "$12,840.00" },
                ]}
            >
                <p>Body</p>
            </DetailPage>,
        )
        expect(screen.getByRole("heading", { name: "Order #1042" })).toBeTruthy()
        expect(screen.getByText("In transit")).toBeTruthy()
        expect(screen.getByText("Shanghai to Rotterdam")).toBeTruthy()
        expect(screen.getByRole("button", { name: "Ship order" })).toBeTruthy()
        expect(screen.getByText("Created")).toBeTruthy()
        expect(screen.getByText("$12,840.00")).toBeTruthy()
        expect(screen.getByText("Body")).toBeTruthy()
    })

    it("renders a back control only when onBack is given, and fires it", () => {
        const onBack = vi.fn()
        const withoutBack = render(<DetailPage title="Order #1042" />)
        expect(screen.queryByRole("button", { name: /Back to orders/ })).toBeNull()
        withoutBack.unmount()

        render(<DetailPage title="Order #1042" onBack={onBack} backLabel="Back to orders" />)
        fireEvent.click(screen.getByRole("button", { name: /Back to orders/ }))
        expect(onBack).toHaveBeenCalledTimes(1)
    })
})

describe("DetailPage tabbed content", () => {
    it("renders an accessible tablist named after the record and starts on the first tab", () => {
        render(<DetailPage title="Order #1042" tabs={TABS} />)
        const tablist = screen.getByRole("tablist", { name: "Order #1042" })
        expect(within(tablist).getAllByRole("tab")).toHaveLength(3)
        expect(screen.getByRole("tab", { name: "Overview", selected: true })).toBeTruthy()
        expect(screen.getByText("Overview panel")).toBeTruthy()
        expect(screen.queryByText("Documents panel")).toBeNull()
    })

    it("switches panels on tab click", async () => {
        render(<DetailPage title="Order #1042" tabs={TABS} />)
        await userEvent.click(screen.getByRole("tab", { name: "Documents" }))
        expect(screen.getByRole("tab", { name: "Documents", selected: true })).toBeTruthy()
        expect(screen.getByText("Documents panel")).toBeTruthy()
        expect(screen.queryByText("Overview panel")).toBeNull()
    })

    it("honors defaultTabId and supports controlled tab state", async () => {
        const uncontrolled = render(<DetailPage title="Order #1042" tabs={TABS} defaultTabId="history" />)
        expect(screen.getByRole("tab", { name: "History", selected: true })).toBeTruthy()
        uncontrolled.unmount()

        const onTabChange = vi.fn()
        render(
            <DetailPage title="Order #1042" tabs={TABS} activeTabId="documents" onTabChange={onTabChange} />,
        )
        expect(screen.getByText("Documents panel")).toBeTruthy()
        await userEvent.click(screen.getByRole("tab", { name: "History" }))
        expect(onTabChange).toHaveBeenCalledWith("history")
        // Controlled: the panel follows the prop, not the click.
        expect(screen.getByText("Documents panel")).toBeTruthy()
    })
})
