import { uiConfig, UiQueryViewFormModal, type SchemaFormPayload } from "@base/design-system"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

afterEach(cleanup)

/**
 * The `inline` form presentation and the per-view override (Plan 2
 * Workstream A). Theme-agnostic: assertions that depend on the project
 * default read `uiConfig.forms.presentation` instead of assuming a kernel
 * value, so the file holds under any committed repobot.theme.json.
 */

const schemaForm: SchemaFormPayload = {
    jsonSchema: JSON.stringify({
        type: "object",
        required: ["name"],
        properties: { name: { type: "string", title: "Name" } },
    }),
    uiSchema: JSON.stringify({}),
    defaultData: JSON.stringify({ name: "" }),
}

function renderForm(
    props: Partial<React.ComponentProps<typeof UiQueryViewFormModal>> = {},
): ReturnType<typeof render> {
    return render(
        <UiQueryViewFormModal
            open
            title="Quick add"
            schemaForm={schemaForm}
            onSubmit={() => {}}
            onClose={() => {}}
            {...props}
        />,
    )
}

describe("inline form presentation", () => {
    it("renders in-flow — a titled region, no dialog, no overlay", () => {
        renderForm({ presentation: "inline" })
        expect(screen.queryByRole("dialog")).toBeNull()
        const region = screen.getByRole("region", { name: "Quick add" })
        expect(region.querySelector("form")).toBeTruthy()
        expect(screen.getByLabelText(/Name/)).toBeTruthy()
    })

    it("submits the entered data and cancels through onClose", async () => {
        const onSubmit = vi.fn()
        const onClose = vi.fn()
        renderForm({ presentation: "inline", onSubmit, onClose })

        fireEvent.change(screen.getByLabelText(/Name/), { target: { value: "Lane A" } })
        fireEvent.click(screen.getByRole("button", { name: "Save" }))
        await waitFor(() =>
            expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: "Lane A" })),
        )

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
        expect(onClose).toHaveBeenCalledTimes(1)
    })

    it("renders nothing while closed (open gates the in-flow card like the dialog)", () => {
        const { container } = renderForm({ presentation: "inline", open: false })
        expect(container.innerHTML).toBe("")
    })
})

describe("per-view presentation override vs the project default", () => {
    it("with no presentation prop, the form follows ui.forms.presentation from the contract", () => {
        renderForm()
        if (uiConfig.forms.presentation === "inline") {
            expect(screen.queryByRole("dialog")).toBeNull()
            expect(screen.getByRole("region", { name: "Quick add" })).toBeTruthy()
        } else {
            expect(screen.getByRole("dialog")).toBeTruthy()
        }
    })

    it("an explicit per-view prop beats the contract in both directions", () => {
        const modal = renderForm({ presentation: "modal" })
        expect(screen.getByRole("dialog")).toBeTruthy()
        modal.unmount()

        renderForm({ presentation: "inline" })
        expect(screen.queryByRole("dialog")).toBeNull()
        expect(screen.getByRole("region", { name: "Quick add" })).toBeTruthy()
    })
})
