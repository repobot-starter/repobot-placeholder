import React from "react"
import { evaluateSummary, type SchemaFormSummaryConfig } from "./schemaFormDerivations"
import * as styles from "./SchemaFormSummary.styles.css"

export interface SchemaFormSummaryTableProps {
    config: SchemaFormSummaryConfig
    formData: Record<string, unknown>
}

/**
 * The read-only computed table a uiSchema declares as root-level
 * `ui:summary` — the "line economics" band that recomputes as the user
 * types. Columns are static config; every cell is a template evaluated
 * against the live form data (see schemaFormDerivations).
 */
export function SchemaFormSummaryTable({
    config,
    formData,
}: SchemaFormSummaryTableProps): React.ReactElement {
    const rows = evaluateSummary(config, formData)
    return (
        <section className={styles.container} aria-label={config.title ?? "Summary"}>
            {config.title !== undefined ? <h4 className={styles.title}>{config.title}</h4> : null}
            {config.description !== undefined ? (
                <p className={styles.description}>{config.description}</p>
            ) : null}
            <table className={styles.table}>
                <thead>
                    <tr>
                        {config.columns.map((column) => (
                            <th
                                key={column.key}
                                className={`${styles.headerCell}${column.align === "right" ? ` ${styles.cellRight}` : ""}`}
                            >
                                {column.title}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {row.cells.map((cell, cellIndex) => (
                                <td
                                    key={cellIndex}
                                    className={`${styles.cell}${config.columns[cellIndex]?.align === "right" ? ` ${styles.cellRight}` : ""}${row.emphasis ? ` ${styles.cellEmphasis}` : ""}`}
                                >
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </section>
    )
}
