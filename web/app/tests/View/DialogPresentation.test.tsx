import { Dialog } from "@base/design-system"
import { cleanup, render, screen } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it } from "vitest"

afterEach(cleanup)

describe("Dialog presentation presets", () => {
    it("modal presentation renders the close X after the title (upper right)", () => {
        render(
            <Dialog open onOpenChange={() => {}} title="Create booking">
                <span>fields</span>
            </Dialog>,
        )
        const dialog = screen.getByRole("dialog")
        const close = screen.getByLabelText("Close")
        const title = screen.getByText("Create booking")
        expect(dialog.contains(close)).toBe(true)
        // In the modal header, the title precedes the X.
        expect(title.compareDocumentPosition(close) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it("page presentation leads with the close X (upper left)", () => {
        render(
            <Dialog open onOpenChange={() => {}} title="Create booking" presentation="page">
                <span>fields</span>
            </Dialog>,
        )
        const close = screen.getByLabelText("Close")
        const title = screen.getByText("Create booking")
        // In the page header, the X precedes the title.
        expect(close.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
        expect(screen.getByText("fields")).toBeTruthy()
    })
})
