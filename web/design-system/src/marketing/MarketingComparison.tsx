import React from "react"
import * as styles from "./MarketingComparison.styles.css"

export type MarketingComparisonVariant = "table" | "cards"

export interface MarketingComparisonRow {
    /** The criterion, e.g. "Works offline". */
    label: string
    /** One entry per non-label column; booleans render as ✓ / —. */
    values: (string | boolean)[]
}

export interface MarketingComparisonContent {
    kicker?: string
    title?: string
    /** First entry heads the criterion column and may be empty, e.g. ["", "Us", "Others"]. */
    columns: string[]
    rows: MarketingComparisonRow[]
}

export interface MarketingComparisonProps extends MarketingComparisonContent {
    variant?: MarketingComparisonVariant
    anchorId?: string
}

function ComparisonValue({ value }: { value: string | boolean }): React.ReactElement {
    if (value === true) {
        return (
            <span className={styles.yes} role="img" aria-label="Yes">
                ✓
            </span>
        )
    }
    if (value === false) {
        return (
            <span className={styles.no} role="img" aria-label="No">
                —
            </span>
        )
    }
    return <>{value}</>
}

/**
 * "How is this different from X?" — honest criteria, side by side. `table`
 * is the classic matrix (the first value column gets the featured tint);
 * `cards` turns each contender column into a card listing the criteria.
 */
export function MarketingComparison({
    variant = "table",
    anchorId,
    kicker,
    title,
    columns,
    rows,
}: MarketingComparisonProps): React.ReactElement {
    return (
        <section id={anchorId} className={styles.wrap} aria-label={title ?? "Comparison"}>
            {kicker !== undefined ? <span className={styles.kicker}>{kicker}</span> : null}
            {title !== undefined ? <h2 className={styles.title}>{title}</h2> : null}
            {variant === "cards" ? (
                <div className={styles.cardsGrid}>
                    {columns.slice(1).map((column, columnIndex) => (
                        <article
                            key={column}
                            className={
                                columnIndex === 0 ? `${styles.card} ${styles.cardFeatured}` : styles.card
                            }
                        >
                            <h3 className={styles.cardTitle}>{column}</h3>
                            <ul className={styles.cardList}>
                                {rows.map((row) => {
                                    const value = row.values[columnIndex]
                                    return (
                                        <li key={row.label} className={styles.cardRow}>
                                            {typeof value === "boolean" ? (
                                                <>
                                                    <ComparisonValue value={value} />
                                                    <span
                                                        className={
                                                            value
                                                                ? styles.cardRowLabel
                                                                : styles.cardRowLabelMuted
                                                        }
                                                    >
                                                        {row.label}
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className={styles.cardRowLabel}>{row.label}</span>
                                                    <span className={styles.cardRowValue}>{value}</span>
                                                </>
                                            )}
                                        </li>
                                    )
                                })}
                            </ul>
                        </article>
                    ))}
                </div>
            ) : (
                <div className={styles.tableScroll}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                {columns.map((column, index) => (
                                    <th
                                        key={`${column}-${index}`}
                                        scope="col"
                                        className={
                                            index === 1
                                                ? `${styles.headCell} ${styles.featured}`
                                                : styles.headCell
                                        }
                                    >
                                        {column}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.label}>
                                    <th scope="row" className={styles.rowLabel}>
                                        {row.label}
                                    </th>
                                    {row.values.map((value, index) => (
                                        <td
                                            key={index}
                                            className={
                                                index === 0
                                                    ? `${styles.cell} ${styles.featured}`
                                                    : styles.cell
                                            }
                                        >
                                            <ComparisonValue value={value} />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    )
}
