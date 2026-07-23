import type { Meta, StoryObj } from "@storybook/react"
import { Badge } from "../primitives/Badge"
import { DataTable, type DataTableColumn } from "./DataTable"

interface DemoRow {
    id: string
    name: string
    status: "ACTIVE" | "ARCHIVED"
    created: string
}

const COLUMNS: DataTableColumn<DemoRow>[] = [
    { id: "name", header: "Name", render: (row) => row.name },
    {
        id: "status",
        header: "Status",
        render: (row) => <Badge tone={row.status === "ACTIVE" ? "success" : "neutral"}>{row.status}</Badge>,
    },
    { id: "created", header: "Created", render: (row) => row.created },
]

const ROWS: DemoRow[] = [
    { id: "project_1", name: "Apollo Migration", status: "ACTIVE", created: "2026-01-12" },
    { id: "project_2", name: "Design Refresh", status: "ACTIVE", created: "2026-02-03" },
    { id: "project_3", name: "Legacy Cleanup", status: "ARCHIVED", created: "2025-11-20" },
]

const meta: Meta<typeof DataTable<DemoRow>> = {
    title: "Components/DataTable",
    component: DataTable<DemoRow>,
}
export default meta

type Story = StoryObj<typeof DataTable<DemoRow>>

export const Default: Story = {
    args: { columns: COLUMNS, rows: ROWS },
}

export const WithRowActions: Story = {
    args: {
        columns: COLUMNS,
        rows: ROWS,
        rowActions: () => [
            { id: "edit", label: "Edit", onSelect: () => {} },
            { id: "archive", label: "Archive", danger: true, onSelect: () => {} },
        ],
    },
}
