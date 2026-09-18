import { Dialog, Timeline } from "@base/design-system"
import { cleanup, render, screen, within } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it } from "vitest"

afterEach(cleanup)

/**
 * The change-log surface (Plan 2 Workstream A): who/when/what entries with
 * optional before -> after value pairs. Assertions are structural — every
 * color comes from theme tokens, so the file holds under any committed
 * repobot.theme.json.
 */

const ENTRIES = [
    {
        id: "1",
        timestamp: "Mar 12, 16:40",
        actor: "Dana Reyes",
        title: "Rate amended",
        description: "Quarterly cost sheet update.",
        tone: "warning" as const,
        changes: [
            { label: "Rate", before: "$2,140.00", after: "$2,320.00" },
            { label: "Valid until", after: "Jun 30" },
        ],
    },
    { id: "2", timestamp: "Mar 4, 11:30", title: "Order created" },
]

describe("Timeline", () => {
    it("renders each entry's who/when/what", () => {
        render(<Timeline entries={ENTRIES} />)
        const items = screen.getAllByRole("listitem")
        // Two entries plus the first entry's two change rows.
        expect(items.length).toBe(4)
        expect(screen.getByText("Rate amended")).toBeTruthy()
        expect(screen.getByText("Dana Reyes")).toBeTruthy()
        expect(screen.getByText("Mar 12, 16:40")).toBeTruthy()
        expect(screen.getByText("Quarterly cost sheet update.")).toBeTruthy()
        expect(screen.getByText("Order created")).toBeTruthy()
    })

    it("renders value diffs as before -> after pairs, and one-sided sets without an arrow", () => {
        render(<Timeline entries={ENTRIES} />)
        const rateChange = screen.getByText("Rate").closest("li") as HTMLElement
        expect(within(rateChange).getByText("$2,140.00")).toBeTruthy()
        expect(within(rateChange).getByText("$2,320.00")).toBeTruthy()
        expect(rateChange.textContent).toContain("\u2192")

        // "Valid until" was first set: no before value, no arrow.
        const setChange = screen.getByText("Valid until").closest("li") as HTMLElement
        expect(within(setChange).getByText("Jun 30")).toBeTruthy()
        expect(setChange.textContent).not.toContain("\u2192")
    })

    it("shows the empty state when there are no entries", () => {
        render(
            <Timeline
                entries={[]}
                emptyState={{ title: "No history yet", description: "Changes land here." }}
            />,
        )
        expect(screen.getByText("No history yet")).toBeTruthy()
        expect(screen.getByText("Changes land here.")).toBeTruthy()
        expect(screen.queryByRole("listitem")).toBeNull()
    })

    it("renders inside a dialog (the change-log popup shape)", () => {
        render(
            <Dialog open onOpenChange={() => {}} title="Change log">
                <Timeline entries={ENTRIES} />
            </Dialog>,
        )
        const dialog = screen.getByRole("dialog")
        expect(within(dialog).getByText("Rate amended")).toBeTruthy()
    })
})
