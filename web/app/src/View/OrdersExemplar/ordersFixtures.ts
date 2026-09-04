import type { SchemaFormPayload, SchemaFormReferenceOption } from "@ui"

/**
 * Fixture data and the wire-format SchemaForm payload for the Orders
 * exemplar (/theme/orders). The payload is byte-for-byte what a backend
 * `buildSchemaForm` call would ship — hand-authored here because the
 * exemplar has no domain backend, but the contract is identical
 * (docs/forms.md).
 */

export interface OrderContainerFixture {
    id: string
    reference: string
    description: string
    qty: number
    sellTotalMinorUnits: number
}

export interface OrderFixture {
    id: string
    contractNumber: string
    customer: string
    status: "IN_PROGRESS" | "COMPLETED"
    incoterms: "FOB" | "CIF"
    valueMinorUnits: number
    costMinorUnits: number
    containers: OrderContainerFixture[]
}

export const orderFixtures: OrderFixture[] = [
    {
        id: "1",
        contractNumber: "C0001",
        customer: "BuildCo Supply",
        status: "IN_PROGRESS",
        incoterms: "FOB",
        valueMinorUnits: 12352400,
        costMinorUnits: 10874100,
        containers: [
            {
                id: "1-1",
                reference: "C0001.C1",
                description: "18mm HMR MDF",
                qty: 44,
                sellTotalMinorUnits: 6238800,
            },
            {
                id: "1-2",
                reference: "C0001.C2",
                description: "16mm HMR MDF",
                qty: 46,
                sellTotalMinorUnits: 6113600,
            },
        ],
    },
    {
        id: "2",
        contractNumber: "C0002",
        customer: "Cascade Millworks",
        status: "IN_PROGRESS",
        incoterms: "CIF",
        valueMinorUnits: 8944000,
        costMinorUnits: 8125600,
        containers: [
            {
                id: "2-1",
                reference: "C0002.C1",
                description: "12mm Birch ply",
                qty: 60,
                sellTotalMinorUnits: 8944000,
            },
        ],
    },
    {
        id: "3",
        contractNumber: "C0003",
        customer: "Highline Cabinets",
        status: "COMPLETED",
        incoterms: "FOB",
        valueMinorUnits: 15211000,
        costMinorUnits: 13094200,
        containers: [
            {
                id: "3-1",
                reference: "C0003.C1",
                description: "18mm HMR MDF",
                qty: 44,
                sellTotalMinorUnits: 5211000,
            },
            {
                id: "3-2",
                reference: "C0003.C2",
                description: "25mm Formply",
                qty: 38,
                sellTotalMinorUnits: 5000000,
            },
            {
                id: "3-3",
                reference: "C0003.C3",
                description: "16mm HMR MDF",
                qty: 40,
                sellTotalMinorUnits: 5000000,
            },
        ],
    },
]

export const customerFixtures: SchemaFormReferenceOption[] = [
    { value: "cus_1", label: "BuildCo Supply", description: "Portland, OR" },
    { value: "cus_2", label: "Cascade Millworks", description: "Tacoma, WA" },
    { value: "cus_3", label: "Highline Cabinets", description: "Boise, ID" },
]

/**
 * The "Add order" form exactly as the backend would define it: nested
 * containers array (F2), an entityRef customer picker with quick-create
 * (F3/F4), `ui:derived` reactivity — container count drives the array,
 * references template themselves, line totals compute, freight rate only
 * shows when billable (F5) — and the `ui:summary` line-economics band (F6).
 */
export const orderCreateFormPayload: SchemaFormPayload = {
    jsonSchema: JSON.stringify({
        type: "object",
        title: "",
        required: ["customerId", "contractNumber"],
        properties: {
            customerId: { type: "string", title: "Customer" },
            contractNumber: { type: "string", title: "Contract #" },
            incoterms: { type: "string", title: "Incoterms", enum: ["FOB", "CIF"] },
            containerCount: { type: "integer", title: "Container count", minimum: 0, maximum: 8 },
            freightBillable: { type: "boolean", title: "Freight billable to customer" },
            freightRatePerContainer: { type: "number", title: "Freight rate per container" },
            containers: {
                type: "array",
                title: "Containers",
                items: {
                    type: "object",
                    properties: {
                        reference: { type: "string", title: "Reference" },
                        description: { type: "string", title: "Description" },
                        qty: { type: "integer", title: "Qty" },
                        sellPrice: { type: "number", title: "Sell price" },
                        lineTotal: { type: "number", title: "Line total" },
                    },
                },
            },
        },
    }),
    uiSchema: JSON.stringify({
        "ui:order": [
            "customerId",
            "contractNumber",
            "incoterms",
            "containerCount",
            "freightBillable",
            "freightRatePerContainer",
            "containers",
        ],
        "ui:options": { columns: 2 },
        customerId: {
            "ui:widget": "entityRef",
            "ui:options": { reference: "customers", allowCreate: true },
        },
        freightBillable: { "ui:options": { fullWidth: true } },
        containers: {
            "ui:options": { addLabel: "+ Container" },
            items: { "ui:options": { columns: 2 } },
        },
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
                    cells: {
                        line: "${reference}",
                        qty: "${qty}",
                        total: "${currency(lineTotal)}",
                    },
                },
                {
                    cells: {
                        line: "Freight",
                        total: "${currency(freightBillable * freightRatePerContainer * count(containers[]))}",
                    },
                },
                {
                    cells: {
                        line: "Total",
                        qty: "${sum(containers[].qty)}",
                        total: "${currency(sum(containers[].lineTotal) + freightBillable * freightRatePerContainer * count(containers[]))}",
                    },
                    emphasis: true,
                },
            ],
        },
    }),
    defaultData: JSON.stringify({ contractNumber: "C0004", incoterms: "FOB", containerCount: 1 }),
}

/** The quick-create customer form — an entity's own create SchemaForm. */
export const customerCreateFormPayload: SchemaFormPayload = {
    jsonSchema: JSON.stringify({
        type: "object",
        title: "",
        required: ["name"],
        properties: {
            name: { type: "string", title: "Name" },
            city: { type: "string", title: "City" },
        },
    }),
    uiSchema: JSON.stringify({ "ui:order": ["name", "city"] }),
    defaultData: JSON.stringify({}),
}
