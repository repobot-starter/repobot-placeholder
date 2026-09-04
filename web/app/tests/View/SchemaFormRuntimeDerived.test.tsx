import {
    parseSchemaForm,
    SchemaFormRuntime,
    type SchemaFormData,
    type SchemaFormPayload,
} from "@base/design-system"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import React, { useState } from "react"
import { afterEach, describe, expect, it } from "vitest"

afterEach(cleanup)

/**
 * The `ui:derived` reactivity layer end to end inside the runtime: a
 * container-count field drives the array's length, each item derives a
 * templated reference, a visibleWhen condition hides a field, and the
 * `ui:summary` band recomputes as data changes.
 */

const payload: SchemaFormPayload = {
    jsonSchema: JSON.stringify({
        type: "object",
        properties: {
            contractNumber: { type: "string", title: "Contract #" },
            containerCount: { type: "integer", title: "Container count" },
            freightBillable: { type: "boolean", title: "Freight billable" },
            freightRate: { type: "number", title: "Freight rate" },
            containers: {
                type: "array",
                title: "Containers",
                items: {
                    type: "object",
                    properties: {
                        reference: { type: "string", title: "Reference" },
                        qty: { type: "integer", title: "Qty" },
                    },
                },
            },
        },
    }),
    uiSchema: JSON.stringify({
        "ui:derived": [
            { target: "containers", arraySize: "containerCount" },
            { target: "containers[].reference", template: "${contractNumber}.C${index + 1}" },
            { target: "freightRate", visibleWhen: "freightBillable" },
        ],
        "ui:summary": {
            title: "Totals",
            columns: [
                { key: "label", title: "Label" },
                { key: "qty", title: "Qty", align: "right" },
            ],
            rows: [{ cells: { label: "Total qty", qty: "${sum(containers[].qty)}" }, emphasis: true }],
        },
    }),
    defaultData: JSON.stringify({ contractNumber: "C0003", containerCount: 2, freightBillable: false }),
}

function Harness(): React.ReactElement {
    const parsed = parseSchemaForm(payload)
    const [formData, setFormData] = useState<SchemaFormData>(parsed.defaultData)
    return <SchemaFormRuntime schemaForm={parsed} formData={formData} onFormDataChange={setFormData} />
}

describe("SchemaFormRuntime with ui:derived rules", () => {
    it("sizes the array from the count field and derives templated references", async () => {
        render(<Harness />)

        // The mount-time derivation pass expands containerCount=2 into two
        // items with derived references.
        await waitFor(() => {
            const references = screen.getAllByDisplayValue(/C0003\.C\d/)
            expect(references).toHaveLength(2)
        })
        expect(screen.getByDisplayValue("C0003.C1")).toBeTruthy()
        expect(screen.getByDisplayValue("C0003.C2")).toBeTruthy()

        fireEvent.change(screen.getByLabelText(/Container count/), {
            target: { value: "3" },
        })
        await waitFor(() => expect(screen.getByDisplayValue("C0003.C3")).toBeTruthy())
    })

    it("hides fields through visibleWhen until the condition holds", async () => {
        render(<Harness />)
        await waitFor(() => expect(screen.getByDisplayValue("C0003.C1")).toBeTruthy())

        expect(screen.queryByLabelText(/Freight rate/)).toBeNull()
        fireEvent.click(screen.getByLabelText(/Freight billable/))
        await waitFor(() => expect(screen.getByLabelText(/Freight rate/)).toBeTruthy())
    })

    it("recomputes the ui:summary band as quantities change", async () => {
        render(<Harness />)
        await waitFor(() => expect(screen.getByDisplayValue("C0003.C1")).toBeTruthy())

        const region = screen.getByRole("region", { name: "Totals" })
        expect(region.textContent).toContain("Total qty")

        const qtyInputs = screen.getAllByLabelText(/^Qty$/)
        fireEvent.change(qtyInputs[0]!, { target: { value: "4" } })
        fireEvent.change(qtyInputs[1]!, { target: { value: "6" } })
        await waitFor(() => expect(region.textContent).toContain("10"))
    })
})
