import {
    GlobalErrors,
    dismissAllGlobalErrors,
    getGlobalErrors,
    publishGlobalError,
} from "@base/design-system"
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it } from "vitest"

afterEach(() => {
    cleanup()
    act(() => dismissAllGlobalErrors())
})

describe("global error store", () => {
    it("stacks errors and dismisses individually or all at once", () => {
        publishGlobalError("first failed")
        const secondId = publishGlobalError({ title: "Sync failed", message: "second failed" })
        expect(getGlobalErrors().map((entry) => entry.message)).toEqual(["first failed", "second failed"])
        expect(getGlobalErrors()[1].id).toBe(secondId)

        dismissAllGlobalErrors()
        expect(getGlobalErrors()).toEqual([])
    })
})

describe("GlobalErrors modal presentation", () => {
    it("pages through stacked errors and dismisses the visible one", () => {
        render(<GlobalErrors presentation="modal" />)
        act(() => {
            publishGlobalError("Could not save the booking.")
            publishGlobalError({ title: "Sync failed", message: "The order list could not be refreshed." })
        })

        // Oldest first; the pager reports position in the stack.
        expect(screen.getByRole("alertdialog")).toBeTruthy()
        expect(screen.getByText("Could not save the booking.")).toBeTruthy()
        expect(screen.getByText("1 of 2")).toBeTruthy()

        fireEvent.click(screen.getByLabelText("Next error"))
        expect(screen.getByText("Sync failed")).toBeTruthy()
        expect(screen.getByText("2 of 2")).toBeTruthy()

        // Dismissing the visible entry clamps onto the remaining one.
        fireEvent.click(screen.getByRole("button", { name: "Dismiss" }))
        expect(screen.getByText("Could not save the booking.")).toBeTruthy()
        expect(screen.queryByText(/of 2/)).toBeNull()

        fireEvent.click(screen.getByRole("button", { name: "Dismiss" }))
        expect(screen.queryByRole("alertdialog")).toBeNull()
    })

    it("clears the whole stack with dismiss all", () => {
        render(<GlobalErrors presentation="modal" />)
        act(() => {
            publishGlobalError("one")
            publishGlobalError("two")
            publishGlobalError("three")
        })
        fireEvent.click(screen.getByRole("button", { name: "Dismiss all" }))
        expect(screen.queryByRole("alertdialog")).toBeNull()
        expect(getGlobalErrors()).toEqual([])
    })
})

describe("GlobalErrors corner presentation", () => {
    it("stacks cards bottom-right with per-card dismissal", () => {
        render(<GlobalErrors presentation="corner" />)
        act(() => {
            publishGlobalError("first failed")
            publishGlobalError("second failed")
        })
        expect(screen.getAllByRole("alert")).toHaveLength(2)

        fireEvent.click(screen.getAllByLabelText("Dismiss")[0])
        expect(screen.getAllByRole("alert")).toHaveLength(1)
        expect(screen.getByText("second failed")).toBeTruthy()
    })
})
