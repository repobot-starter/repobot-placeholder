import type { Meta, StoryObj } from "@storybook/react"
import React from "react"
import { Badge } from "../primitives/Badge"
import type { DataTableColumn } from "./DataTable"
import { UiQueryView, type UiQueryViewModel } from "./UiQueryView"

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

function buildViewModel(overrides: Partial<UiQueryViewModel<DemoRow>>): UiQueryViewModel<DemoRow> {
    return {
        title: "Projects",
        columns: COLUMNS,
        rows: ROWS,
        loading: false,
        search: "",
        onSearchChange: () => {},
        primaryAction: { label: "Create Project", onClick: () => {} },
        rowActions: () => [
            { id: "edit", label: "Edit", onSelect: () => {} },
            { id: "archive", label: "Archive", danger: true, onSelect: () => {} },
        ],
        hasNextPage: true,
        onLoadMore: () => {},
        ...overrides,
    }
}

const meta: Meta<typeof UiQueryView<DemoRow>> = {
    title: "Components/UiQueryView",
    component: UiQueryView<DemoRow>,
}
export default meta

type Story = StoryObj<typeof UiQueryView<DemoRow>>

export const WithData: Story = {
    render: function WithDataStory() {
        const [search, setSearch] = React.useState("")
        const rows = ROWS.filter((row) => row.name.toLowerCase().includes(search.toLowerCase()))
        return <UiQueryView viewModel={buildViewModel({ rows, search, onSearchChange: setSearch })} />
    },
}

export const Loading: Story = {
    render: () => <UiQueryView viewModel={buildViewModel({ rows: [], loading: true })} />,
}

export const Empty: Story = {
    render: () => (
        <UiQueryView
            viewModel={buildViewModel({
                rows: [],
                hasNextPage: false,
                emptyState: {
                    title: "No projects yet",
                    description: "Create your first project to get started.",
                },
            })}
        />
    ),
}

export const ErrorState: Story = {
    render: () => (
        <UiQueryView
            viewModel={buildViewModel({
                rows: [],
                error: "Network request failed (500).",
                onRetry: () => {},
            })}
        />
    ),
}

export const LoadingMore: Story = {
    render: () => <UiQueryView viewModel={buildViewModel({ loadingMore: true })} />,
}
