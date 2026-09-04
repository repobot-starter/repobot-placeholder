import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import { Button } from "../primitives/Button"
import type { SchemaFormReferenceResolvers } from "./EntityRefWidget"
import { parseSchemaForm, type SchemaFormPayload } from "./parseSchemaForm"
import { sampleSchemaFormPayload } from "./sampleSchemaForm"
import { SchemaFormRuntime, type SchemaFormData } from "./SchemaFormRuntime"

const meta: Meta<typeof SchemaFormRuntime> = {
    title: "Forms/SchemaFormRuntime",
    component: SchemaFormRuntime,
}
export default meta

type Story = StoryObj<typeof SchemaFormRuntime>

export const SampleSchema: Story = {
    render: function SampleSchemaStory() {
        const parsed = React.useMemo(() => parseSchemaForm(sampleSchemaFormPayload), [])
        const [formData, setFormData] = React.useState<SchemaFormData>(parsed.defaultData)
        const [submitted, setSubmitted] = React.useState<SchemaFormData | null>(null)
        return (
            <div style={{ maxWidth: 420 }}>
                <SchemaFormRuntime
                    id="sample-schema-form"
                    schemaForm={parsed}
                    formData={formData}
                    onFormDataChange={setFormData}
                    onSubmit={setSubmitted}
                />
                <Button type="submit" form="sample-schema-form">
                    Submit
                </Button>
                {submitted ? <pre style={{ fontSize: 12 }}>{JSON.stringify(submitted, null, 2)}</pre> : null}
            </div>
        )
    },
}

/**
 * The reactive layer: `ui:derived` rules (arraySize / template / expr /
 * visibleWhen), the `entityRef` picker with quick-create, and the
 * `ui:summary` computed band — see docs/forms.md.
 */
const derivedOrderPayload: SchemaFormPayload = {
    jsonSchema: JSON.stringify({
        type: "object",
        required: ["customerId", "contractNumber"],
        properties: {
            customerId: { type: "string", title: "Customer" },
            contractNumber: { type: "string", title: "Contract #" },
            containerCount: { type: "integer", title: "Container count", minimum: 0, maximum: 8 },
            freightBillable: { type: "boolean", title: "Freight billable" },
            freightRatePerContainer: { type: "number", title: "Freight rate per container" },
            containers: {
                type: "array",
                title: "Containers",
                items: {
                    type: "object",
                    properties: {
                        reference: { type: "string", title: "Reference" },
                        qty: { type: "integer", title: "Qty" },
                        sellPrice: { type: "number", title: "Sell price" },
                        lineTotal: { type: "number", title: "Line total" },
                    },
                },
            },
        },
    }),
    uiSchema: JSON.stringify({
        customerId: { "ui:widget": "entityRef", "ui:options": { reference: "customers", allowCreate: true } },
        containers: { "ui:options": { addLabel: "+ Container" }, items: { "ui:options": { columns: 2 } } },
        "ui:derived": [
            { target: "containers", arraySize: "containerCount" },
            { target: "containers[].reference", template: "${contractNumber}.C${index + 1}" },
            { target: "containers[].lineTotal", expr: "qty * sellPrice" },
            { target: "freightRatePerContainer", visibleWhen: "freightBillable" },
        ],
        "ui:summary": {
            title: "Line economics",
            columns: [
                { key: "line", title: "Line" },
                { key: "qty", title: "Qty", align: "right" },
                { key: "total", title: "Total", align: "right" },
            ],
            rows: [
                {
                    forEach: "containers[]",
                    cells: { line: "${reference}", qty: "${qty}", total: "${currency(lineTotal)}" },
                },
                {
                    cells: {
                        line: "Total",
                        qty: "${sum(containers[].qty)}",
                        total: "${currency(sum(containers[].lineTotal))}",
                    },
                    emphasis: true,
                },
            ],
        },
    }),
    defaultData: JSON.stringify({ contractNumber: "C0003", containerCount: 2 }),
}

const storyCustomers = [
    { value: "cus_1", label: "BuildCo Supply", description: "Portland, OR" },
    { value: "cus_2", label: "Cascade Millworks", description: "Tacoma, WA" },
]

const storyResolvers: SchemaFormReferenceResolvers = {
    customers: {
        search: async (query) =>
            storyCustomers.filter((option) => option.label.toLowerCase().includes(query.toLowerCase())),
        resolve: async (value) => storyCustomers.find((option) => option.value === value) ?? null,
        create: {
            label: "+ Add customer",
            run: async () => {
                const name = window.prompt("Customer name")
                return name === null || name.trim() === ""
                    ? null
                    : { value: `cus_${Date.now()}`, label: name.trim() }
            },
        },
    },
}

export const DerivedOrderForm: Story = {
    render: function DerivedOrderFormStory() {
        const parsed = React.useMemo(() => parseSchemaForm(derivedOrderPayload), [])
        const [formData, setFormData] = React.useState<SchemaFormData>(parsed.defaultData)
        return (
            <div style={{ maxWidth: 560 }}>
                <SchemaFormRuntime
                    id="derived-order-form"
                    schemaForm={parsed}
                    formData={formData}
                    onFormDataChange={setFormData}
                    referenceResolvers={storyResolvers}
                />
            </div>
        )
    },
}

export const Disabled: Story = {
    render: function DisabledStory() {
        const parsed = React.useMemo(() => parseSchemaForm(sampleSchemaFormPayload), [])
        return (
            <div style={{ maxWidth: 420 }}>
                <SchemaFormRuntime
                    schemaForm={parsed}
                    formData={parsed.defaultData}
                    onFormDataChange={() => {}}
                    disabled
                />
            </div>
        )
    },
}
