import React from "react"
import { Button } from "../primitives/Button"
import { DropdownMenu, type DropdownMenuItem } from "../primitives/DropdownMenu"
import * as styles from "./DataTable.styles.css"

export interface DataTableColumn<TRow> {
    id: string
    header: string
    width?: number | string
    render: (row: TRow) => React.ReactNode
}

export interface DataTableProps<TRow extends { id: string }> {
    columns: DataTableColumn<TRow>[]
    rows: TRow[]
    /** When provided, a trailing "..." menu column is rendered per row. */
    rowActions?: (row: TRow) => DropdownMenuItem[]
}

/** Generic typed table. Data shaping (formatting, badges) belongs in column render functions. */
export function DataTable<TRow extends { id: string }>({
    columns,
    rows,
    rowActions,
}: DataTableProps<TRow>): React.ReactElement {
    const hasActions = rowActions !== undefined
    return (
        <div className={styles.wrapper}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th key={column.id} className={styles.headerCell} style={{ width: column.width }}>
                                {column.header}
                            </th>
                        ))}
                        {hasActions ? <th className={styles.headerCell} aria-label="Actions" /> : null}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.id} className={styles.row}>
                            {columns.map((column) => (
                                <td key={column.id} className={styles.cell}>
                                    {column.render(row)}
                                </td>
                            ))}
                            {hasActions ? (
                                <td className={`${styles.cell} ${styles.actionsCell}`}>
                                    <RowActionsMenu items={rowActions(row)} />
                                </td>
                            ) : null}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function RowActionsMenu({ items }: { items: DropdownMenuItem[] }): React.ReactElement | null {
    if (items.length === 0) {
        return null
    }
    return (
        <DropdownMenu
            trigger={
                <Button variant="ghost" size="sm" aria-label="Row actions">
                    &#8943;
                </Button>
            }
            items={items}
        />
    )
}
