import React, { useId } from "react"
import * as styles from "./StatCard.styles.css"

export type StatCardDeltaDirection = "up" | "down" | "flat"

export interface StatCardDelta {
    /** Already-formatted delta, e.g. "+12%" or "-3". */
    value: string
    direction: StatCardDeltaDirection
    /**
     * Whether this direction is good news. Defaults to "up" being positive —
     * pass false for metrics like churn where a rise is bad.
     */
    upIsPositive?: boolean
}

export type StatCardTone = "accent" | "success" | "danger" | "warning" | "info"

export interface StatCardProps {
    label: string
    /** Already-formatted value — formatting belongs to the caller. */
    value: string
    hint?: string
    delta?: StatCardDelta
    /**
     * Colored top-border accent from the theme palette — the classic
     * revenue-red / cogs-blue / profit-green KPI strip treatment. Omit for
     * the plain card.
     */
    tone?: StatCardTone
    /**
     * Raw values for a small sparkline under the value — the metric's recent
     * shape at a glance (needs at least two points; scale is per-card). Color
     * follows `tone`, defaulting to the accent.
     */
    trend?: number[]
}

function deltaTone(delta: StatCardDelta): string {
    if (delta.direction === "flat") {
        return styles.deltaNeutral
    }
    const upIsPositive = delta.upIsPositive ?? true
    const positive = delta.direction === "up" ? upIsPositive : !upIsPositive
    return positive ? styles.deltaPositive : styles.deltaNegative
}

const DELTA_ARROWS: Record<StatCardDeltaDirection, string> = {
    up: "\u2191",
    down: "\u2193",
    flat: "\u2192",
}

/** Line + closed area paths for the sparkline, in a 0..100 × 0..32 box. */
function sparklinePaths(values: number[]): { line: string; area: string } {
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1
    const step = 100 / (values.length - 1)
    const line = values
        .map((value, index) => {
            const x = (index * step).toFixed(1)
            const y = (28 - ((value - min) / range) * 24).toFixed(1)
            return `${index === 0 ? "M" : "L"}${x} ${y}`
        })
        .join(" ")
    return { line, area: `${line} L100 32 L0 32 Z` }
}

function Sparkline({ values, tone }: { values: number[]; tone?: StatCardTone }): React.ReactElement {
    const gradientId = useId().replace(/:/g, "")
    const { line, area } = sparklinePaths(values)
    return (
        <svg
            className={`${styles.spark}${tone ? ` ${styles.sparkTone[tone]}` : ""}`}
            viewBox="0 0 100 32"
            preserveAspectRatio="none"
            aria-hidden
        >
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={area} fill={`url(#${gradientId})`} />
            <path
                d={line}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    )
}

/**
 * One KPI on a dashboard. Compose several inside a `StatCardRow` for the
 * classic stats strip at the top of an overview page.
 */
export function StatCard({ label, value, hint, delta, tone, trend }: StatCardProps): React.ReactElement {
    return (
        <div className={`${styles.card}${tone ? ` ${styles.cardTone[tone]}` : ""}`}>
            <span className={styles.label}>{label}</span>
            <span className={styles.valueRow}>
                <span className={styles.value}>{value}</span>
                {delta ? (
                    <span className={`${styles.delta} ${deltaTone(delta)}`}>
                        <span aria-hidden>{DELTA_ARROWS[delta.direction]}</span>
                        {delta.value}
                    </span>
                ) : null}
            </span>
            {hint ? <span className={styles.hint}>{hint}</span> : null}
            {trend && trend.length > 1 ? <Sparkline values={trend} tone={tone} /> : null}
        </div>
    )
}

export interface StatCardRowProps {
    children: React.ReactNode
}

/** Responsive grid for a row of StatCards — wraps as the viewport narrows. */
export function StatCardRow({ children }: StatCardRowProps): React.ReactElement {
    // data-rb-widget names the dashboard section kind for the platform's
    // preview editor (selection chips and agent intents resolve to it).
    return (
        <div className={styles.row} data-rb-widget="stat-cards">
            {children}
        </div>
    )
}
