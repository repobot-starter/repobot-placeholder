import { DataTable, type DataTableColumn } from "@base/design-system"
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

interface Row {
    id: string
    name: string
    status: string
}

const columns: DataTableColumn<Row>[] = [
    { id: "name", header: "Name", render: (row) => row.name, sortValue: (row) => row.name },
    {
        id: "status",
        header: "Status",
        render: (row) => row.status,
        sortValue: (row) => row.status,
        filter: {
            type: "select",
            options: [
                { value: "ACTIVE", label: "Active" },
                { value: "ARCHIVED", label: "Archived" },
            ],
        },
    },
]

function makeRows(count: number): Row[] {
    return Array.from({ length: count }, (_, index) => ({
        id: `row_${index + 1}`,
        name: `Row ${String(index + 1).padStart(2, "0")}`,
        status: index % 2 === 0 ? "ACTIVE" : "ARCHIVED",
    }))
}

afterEach(() => {
    cleanup()
    window.localStorage.clear()
})

describe("DataTable column filters", () => {
    it("filters rows client-side from the header filter row", () => {
        render(<DataTable columns={columns} rows={makeRows(4)} />)
        expect(screen.getAllByText(/^Row \d+/)).toHaveLength(4)

        fireEvent.change(screen.getByLabelText("Filter Status"), { target: { value: "ARCHIVED" } })
        expect(screen.getAllByText(/^Row \d+/)).toHaveLength(2)

        fireEvent.change(screen.getByLabelText("Filter Status"), { target: { value: "" } })
        expect(screen.getAllByText(/^Row \d+/)).toHaveLength(4)
    })
})

describe("DataTable pagination", () => {
    it("loadMore reveals more local rows, then hands off to the server fetch", () => {
        const onLoadMore = vi.fn()
        render(
            <DataTable
                columns={columns}
                rows={makeRows(30)}
                pagination={{ mode: "loadMore", pageSize: 25, hasNextPage: true, onLoadMore }}
            />,
        )
        expect(screen.getAllByText(/^Row \d+/)).toHaveLength(25)

        // First click reveals the remaining local rows…
        fireEvent.click(screen.getByRole("button", { name: "Load more" }))
        expect(screen.getAllByText(/^Row \d+/)).toHaveLength(30)
        expect(onLoadMore).not.toHaveBeenCalled()

        // …and once local rows are exhausted, the click fetches from the server.
        fireEvent.click(screen.getByRole("button", { name: "Load more" }))
        expect(onLoadMore).toHaveBeenCalledTimes(1)
    })

    it("pages mode pages back and forth with a row count", () => {
        render(
            <DataTable columns={columns} rows={makeRows(30)} pagination={{ mode: "pages", pageSize: 25 }} />,
        )
        expect(screen.getAllByText(/^Row \d+/)).toHaveLength(25)
        expect(screen.getByText("Page 1 of 2")).toBeTruthy()
        expect(screen.getByText("30 rows")).toBeTruthy()

        fireEvent.click(screen.getByRole("button", { name: "Next" }))
        expect(screen.getAllByText(/^Row \d+/)).toHaveLength(5)
        expect(screen.getByText("Page 2 of 2")).toBeTruthy()

        fireEvent.click(screen.getByRole("button", { name: "Previous" }))
        expect(screen.getByText("Page 1 of 2")).toBeTruthy()
    })
})

describe("DataTable column manager", () => {
    it("hides a column via the dialog and persists per tableId", () => {
        render(<DataTable columns={columns} rows={makeRows(2)} style="detailed" tableId="orders" />)
        expect(screen.getByRole("columnheader", { name: /Status/ })).toBeTruthy()

        fireEvent.click(screen.getByRole("button", { name: "Columns" }))
        const dialog = screen.getByRole("dialog")
        fireEvent.click(within(dialog).getByRole("checkbox", { name: "Status" }))
        fireEvent.click(within(dialog).getByRole("button", { name: "Save" }))

        expect(screen.queryByRole("columnheader", { name: /Status/ })).toBeNull()
        const stored = window.localStorage.getItem("base.table.orders.columns.v1")
        expect(stored).toContain("status")
    })
})

describe("DataTable inline editing", () => {
    it("commits on Enter and cancels on Escape", async () => {
        const onCommit = vi.fn().mockResolvedValue(undefined)
        const editableColumns: DataTableColumn<Row>[] = [
            {
                id: "name",
                header: "Name",
                render: (row) => row.name,
                editable: { value: (row) => row.name, onCommit },
            },
        ]
        render(<DataTable columns={editableColumns} rows={makeRows(1)} />)

        fireEvent.click(screen.getByRole("button", { name: "Edit Name" }))
        const input = screen.getByDisplayValue("Row 01")
        fireEvent.change(input, { target: { value: "Renamed" } })
        await act(async () => {
            fireEvent.keyDown(input, { key: "Enter" })
        })
        expect(onCommit).toHaveBeenCalledWith(expect.objectContaining({ id: "row_1" }), "Renamed")

        // Escape leaves the value untouched.
        fireEvent.click(screen.getByRole("button", { name: "Edit Name" }))
        const secondInput = screen.getByDisplayValue("Row 01")
        fireEvent.change(secondInput, { target: { value: "Ignored" } })
        fireEvent.keyDown(secondInput, { key: "Escape" })
        expect(onCommit).toHaveBeenCalledTimes(1)
    })
})

describe("DataTable detailed extras", () => {
    it("shows the toolbar (Columns, CSV, Focus) only for the detailed style", () => {
        const { unmount } = render(
            <DataTable columns={columns} rows={makeRows(2)} style="detailed" tableId="orders" />,
        )
        expect(screen.getByRole("button", { name: "Columns" })).toBeTruthy()
        expect(screen.getByRole("button", { name: "CSV" })).toBeTruthy()
        expect(screen.getByRole("button", { name: "Focus" })).toBeTruthy()
        unmount()

        render(<DataTable columns={columns} rows={makeRows(2)} style="standard" />)
        expect(screen.queryByRole("button", { name: "Columns" })).toBeNull()
    })
})
