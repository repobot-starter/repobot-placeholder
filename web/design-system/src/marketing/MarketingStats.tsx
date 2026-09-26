import React from "react"
import { marketingItemStamp, marketingTextStamp } from "./marketingItemStamp"
import * as styles from "./MarketingStats.styles.css"

export type MarketingStatsVariant = "row" | "cards" | "bars"

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
    /** `bars` only: the line under the heading that says what is measured and where it's reported. */
    intro?: string
    /** `bars` only: the small print under the table (how often it's updated, what it excludes). */
    footnote?: string
    /**
     * `bars` only: a tag under the table, set apart from the footnote —
     * "Sample figures", "Unaudited" — for numbers a reader must not take
     * as published.
     */
    note?: string
}

/** A stat value's leading number ("54%" → 54, "$1.2M" → 1.2); NaN when it has none. */
function statNumber(value: string): number {
    const match = /-?\d+(?:[.,]\d+)*/.exec(value)
    return match === null ? Number.NaN : Number.parseFloat(match[0].replace(/,/g, ""))
}

export interface MarketingStatsProps extends MarketingStatsContent {
    variant?: MarketingStatsVariant
    anchorId?: string
}

/**
 * Numeric proof at a glance: big display-font values in the accent color.
 * `row` is a centered strip; `cards` gives each number a surface and room
 * for a supporting sentence; `bars` is the report — the `intro` line, a
 * ruled table of label, value, and a bar drawn to the value's share of
 * the largest value in the table, then the `footnote` and the `note` tag.
 * Values without a number draw no bar.
 */
export function MarketingStats({
    variant = "row",
    anchorId,
    kicker,
    title,
    stats,
    intro,
    footnote,
    note,
}: MarketingStatsProps): React.ReactElement {
    if (variant === "bars") {
        const numbers = stats.map((stat) => statNumber(stat.value))
        const max = Math.max(0, ...numbers.filter((n) => Number.isFinite(n)))
        return (
            <section id={anchorId} className={styles.wrap} aria-label={title ?? kicker ?? "Key numbers"}>
                {kicker !== undefined ? <span className={styles.kicker}>{kicker}</span> : null}
                {title !== undefined ? <h2 className={styles.title}>{title}</h2> : null}
                <div className={styles.barsFrame}>
                    {intro !== undefined ? (
                        <p className={styles.barsIntro} {...marketingTextStamp("intro")}>
                            {intro}
                        </p>
                    ) : null}
                    <dl className={styles.bars}>
                        {stats.map((stat, index) => {
                            const n = numbers[index]
                            const share = max > 0 && Number.isFinite(n) ? Math.max(0, n) / max : 0
                            return (
                                <div
                                    key={stat.label}
                                    className={styles.barsRow}
                                    {...marketingItemStamp("stats", index)}
                                >
                                    <dt
                                        className={styles.barsLabel}
                                        {...marketingTextStamp("label", "stats", index)}
                                    >
                                        {stat.label}
                                    </dt>
                                    <dd
                                        className={styles.barsValue}
                                        {...marketingTextStamp("value", "stats", index)}
                                    >
                                        {stat.value}
                                    </dd>
                                    <dd className={styles.barsTrack} aria-hidden="true">
                                        <span
                                            className={styles.barsBar}
                                            style={{ width: `${(share * 100).toFixed(1)}%` }}
                                        />
                                    </dd>
                                </div>
                            )
                        })}
                    </dl>
                    {footnote !== undefined ? (
                        <p className={styles.barsFootnote} {...marketingTextStamp("footnote")}>
                            {footnote}
                        </p>
                    ) : null}
                    {note !== undefined ? (
                        <p className={styles.barsNote} {...marketingTextStamp("note")}>
                            {note}
                        </p>
                    ) : null}
                </div>
            </section>
        )
    }
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
