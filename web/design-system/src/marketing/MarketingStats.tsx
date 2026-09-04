import React from "react"
import * as styles from "./MarketingStats.styles.css"

export type MarketingStatsVariant = "row" | "cards"

export interface MarketingStat {
    /** The big number, e.g. "4.2h" or "12,000+". */
    value: string
    label: string
    description?: string
}

export interface MarketingStatsContent {
    kicker?: string
    title?: string
    stats: MarketingStat[]
}

export interface MarketingStatsProps extends MarketingStatsContent {
    variant?: MarketingStatsVariant
    anchorId?: string
}

/**
 * Numeric proof at a glance: big display-font values in the accent color.
 * `row` is a centered strip; `cards` gives each number a surface and room
 * for a supporting sentence.
 */
export function MarketingStats({
    variant = "row",
    anchorId,
    kicker,
    title,
    stats,
}: MarketingStatsProps): React.ReactElement {
    return (
        <section id={anchorId} className={styles.wrap} aria-label={title ?? "Key numbers"}>
            {kicker !== undefined ? <span className={styles.kicker}>{kicker}</span> : null}
            {title !== undefined ? <h2 className={styles.title}>{title}</h2> : null}
            {variant === "cards" ? (
                <div className={styles.cardsGrid}>
                    {stats.map((stat) => (
                        <div key={stat.label} className={styles.card}>
                            <span className={styles.cardValue}>{stat.value}</span>
                            <span className={styles.label}>{stat.label}</span>
                            {stat.description !== undefined ? (
                                <p className={styles.description}>{stat.description}</p>
                            ) : null}
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.row}>
                    {stats.map((stat) => (
                        <div key={stat.label} className={styles.stat}>
                            <span className={styles.value}>{stat.value}</span>
                            <span className={styles.label}>{stat.label}</span>
                            {stat.description !== undefined ? (
                                <p className={styles.description}>{stat.description}</p>
                            ) : null}
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}
