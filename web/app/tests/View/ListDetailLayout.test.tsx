import { ListDetailLayout } from "@base/design-system"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

afterEach(cleanup)

/**
 * The master-detail archetype (Plan 2 Workstream A): list on one side,
 * selected record on the other, one pane at a time on narrow screens.
 * Selection state belongs to the caller — these tests pin the layout's own
 * promises (empty detail, the narrow-screen back control).
 */

describe("ListDetailLayout", () => {
    it("renders both panes, with the empty state standing in for no selection", () => {
        render(
            <ListDetailLayout
                list={<p>Lane list</p>}
                emptyDetail={{ title: "Select a lane", description: "Details show up here." }}
            />,
        )
        expect(screen.getByText("Lane list")).toBeTruthy()
        expect(screen.getByText("Select a lane")).toBeTruthy()
    })

    it("renders the selected record's detail in place of the empty state", () => {
        render(
            <ListDetailLayout
                list={<p>Lane list</p>}
                detail={<p>Lane SHA-RTM detail</p>}
                emptyDetail={{ title: "Select a lane" }}
            />,
        )
        expect(screen.getByText("Lane SHA-RTM detail")).toBeTruthy()
        expect(screen.queryByText("Select a lane")).toBeNull()
    })

    it("offers the narrow-screen back control when onBack is given, and fires it", () => {
        const onBack = vi.fn()
        render(
            <ListDetailLayout
                list={<p>Lane list</p>}
                detail={<p>Detail</p>}
                detailOpen
                onBack={onBack}
                backLabel="Back to lanes"
            />,
        )
        fireEvent.click(screen.getByRole("button", { name: /Back to lanes/ }))
        expect(onBack).toHaveBeenCalledTimes(1)
    })
})
