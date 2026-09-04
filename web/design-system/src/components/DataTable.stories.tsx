import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
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

export const Sortable: Story = {
    args: {
        columns: [
            { id: "name", header: "Name", render: (row) => row.name, sortValue: (row) => row.name },
            {
                id: "status",
                header: "Status",
                render: (row) => (
                    <Badge tone={row.status === "ACTIVE" ? "success" : "neutral"}>{row.status}</Badge>
                ),
                sortValue: (row) => row.status,
            },
            {
                id: "created",
                header: "Created",
                render: (row) => row.created,
                sortValue: (row) => row.created,
            },
        ],
        rows: ROWS,
    },
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

// The ui.table style presets.
export const Minimalist: Story = {
    args: { columns: COLUMNS, rows: ROWS, style: "minimalist" },
}

const MANY_ROWS: DemoRow[] = Array.from({ length: 60 }, (_, index) => ({
    id: `project_${index + 1}`,
    name: `Project ${index + 1}`,
    status: index % 3 === 0 ? "ARCHIVED" : "ACTIVE",
    created: `2026-0${(index % 9) + 1}-1${index % 10}`,
}))

// Detailed: dense rows, sticky header, per-column filters, a pinned column,
// the column manager, CSV export, focus mode, and page-based pagination.
export const Detailed: Story = {
    args: {
        tableId: "projects-demo",
        style: "detailed",
        columns: [
            {
                id: "name",
                header: "Name",
                width: 200,
                pinned: "left",
                render: (row) => row.name,
                sortValue: (row) => row.name,
                filter: { type: "text" },
            },
            {
                id: "status",
                header: "Status",
                render: (row) => (
                    <Badge tone={row.status === "ACTIVE" ? "success" : "neutral"}>{row.status}</Badge>
                ),
                sortValue: (row) => row.status,
                filter: {
                    type: "select",
                    options: [
                        { value: "ACTIVE", label: "Active" },
                        { value: "ARCHIVED", label: "Archived" },
                    ],
                },
            },
            {
                id: "created",
                header: "Created",
                render: (row) => row.created,
                sortValue: (row) => row.created,
            },
            {
                id: "notes",
                header: "Notes",
                hiddenByDefault: true,
                render: () => "—",
            },
        ],
        rows: MANY_ROWS,
        pagination: { mode: "pages", pageSize: 15 },
    },
}

// Master-detail rows: the chevron column opens a full-width detail region —
// here a nested minimalist mini-table, the contract → containers pattern.
export const ExpandableRows: Story = {
    args: {
        columns: COLUMNS,
        rows: ROWS,
        expandable: {
            isExpandable: (row) => row.status === "ACTIVE",
            renderExpanded: (row) => (
                <DataTable
                    style="minimalist"
                    columns={[
                        { id: "item", header: "Milestone", render: (child: DemoRow) => child.name },
                        { id: "created", header: "Date", render: (child: DemoRow) => child.created },
                    ]}
                    rows={ROWS.map((child) => ({ ...child, id: `${row.id}-${child.id}` }))}
                />
            ),
        },
    },
}

// Inline editing: click a name to edit; Enter commits, Escape cancels.
export const InlineEdit: Story = {
    render: function InlineEditStory() {
        const [rows, setRows] = React.useState(ROWS)
        return (
            <DataTable
                columns={[
                    {
                        id: "name",
                        header: "Name",
                        render: (row) => row.name,
                        editable: {
                            value: (row) => row.name,
                            onCommit: (row, value) =>
                                setRows((current) =>
                                    current.map((entry) =>
                                        entry.id === row.id ? { ...entry, name: value } : entry,
                                    ),
                                ),
                        },
                    },
                    { id: "created", header: "Created", render: (row) => row.created },
                ]}
                rows={rows}
            />
        )
    },
}
