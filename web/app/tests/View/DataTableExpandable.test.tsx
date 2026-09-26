import { DataTable, StatCard, type DataTableColumn } from "@base/design-system"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import React from "react"
import { afterEach, describe, expect, it } from "vitest"

interface ContractRow {
    id: string
    contract: string
    containers: string[]
}

const columns: DataTableColumn<ContractRow>[] = [
    { id: "contract", header: "Contract #", render: (row) => row.contract },
]

const rows: ContractRow[] = [
    { id: "1", contract: "C0001", containers: ["C0001.C1", "C0001.C2"] },
    { id: "2", contract: "C0002", containers: [] },
]

afterEach(cleanup)

describe("DataTable expandable rows", () => {
    it("toggles a full-width detail region under the row", () => {
        render(
            <DataTable
                columns={columns}
                rows={rows}
                style="standard"
                expandable={{
                    renderExpanded: (row) => (
                        <div data-testid={`detail-${row.id}`}>{row.containers.join(", ")}</div>
                    ),
                }}
            />,
        )
        expect(screen.queryByTestId("detail-1")).toBeNull()

        const toggles = screen.getAllByRole("button", { name: "Expand row" })
        expect(toggles).toHaveLength(2)

        fireEvent.click(toggles[0]!)
        expect(screen.getByTestId("detail-1").textContent).toBe("C0001.C1, C0001.C2")
        expect(screen.queryByTestId("detail-2")).toBeNull()

        fireEvent.click(screen.getByRole("button", { name: "Collapse row" }))
        expect(screen.queryByTestId("detail-1")).toBeNull()
    })

    it("renders no chevron for rows the callback marks non-expandable", () => {
        render(
            <DataTable
                columns={columns}
                rows={rows}
                style="standard"
                expandable={{
                    renderExpanded: (row) => <div>{row.contract}</div>,
                    isExpandable: (row) => row.containers.length > 0,
                }}
            />,
        )
        expect(screen.getAllByRole("button", { name: "Expand row" })).toHaveLength(1)
    })
})

describe("StatCard tone", () => {
    it("applies the accent top-border variant class per tone", () => {
        const { container } = render(<StatCard label="Accrued revenue" value="$123,524" tone="danger" />)
        const card = container.firstElementChild as HTMLElement
        expect(card.className.split(" ").length).toBeGreaterThan(1)

        const { container: plain } = render(<StatCard label="Plain" value="1" />)
        const plainCard = plain.firstElementChild as HTMLElement
        expect(plainCard.className.split(" ").length).toBe(1)
    })
})
