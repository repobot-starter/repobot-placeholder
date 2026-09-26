import React from "react"
import { Skeleton } from "./Skeleton"
import * as styles from "./ChartCard.styles.css"

export type ChartCardKind = "line" | "area" | "bar" | "donut"

export interface ChartPoint {
    /** Category or time label along the x axis (donut: the segment label). */
    x: string | number
    y: number
}

export interface ChartSeries {
    id: string
    label: string
    points: ChartPoint[]
}

export interface ChartCardProps {
    kind: ChartCardKind
    /** Donut charts read segments from the first series only. */
    series: ChartSeries[]
    title?: string
    description?: string
    /** Chart body height in pixels. */
    height?: number
    /** Formats y values for axis ticks, tooltips, and the donut total. */
    valueFormatter?: (value: number) => string
    /** Defaults to visible when there is more than one series. */
    showLegend?: boolean
    /**
     * Donut only: render the legend as rows with each segment's value and
     * share — the "spend by category" read where the numbers matter as much
     * as the shape.
     */
    legendValues?: boolean
    /** Stack series on top of each other (bar and area only). */
    stacked?: boolean
    /** Header right slot, e.g. a range Select or a "View report" link. */
    action?: React.ReactNode
}

const DEFAULT_HEIGHT = 260

// The recharts-backed body loads as its own chunk so marketing pages and
// chart-free dashboards never pay for the charting library.
const ChartCardBody = React.lazy(() => import("./ChartCardChart"))

/**
 * The kernel's charting surface: a themed card around a line, area, bar, or
 * donut chart. Always chart through this component — series colors, grid,
 * tooltip, and typography are bound to the theme tokens here, so pages stay
 * on-theme without touching the charting library directly.
 */
export function ChartCard({
    kind,
    series,
    title,
    description,
    height = DEFAULT_HEIGHT,
    valueFormatter,
    showLegend,
    legendValues,
    stacked,
    action,
}: ChartCardProps): React.ReactElement {
    const hasHeader = Boolean(title || description || action)
    return (
        <section className={styles.card} data-rb-widget="chart">
            {hasHeader ? (
                <header className={styles.header}>
                    <div className={styles.headerText}>
                        {title ? <h2 className={styles.title}>{title}</h2> : null}
                        {description ? <p className={styles.description}>{description}</p> : null}
                    </div>
                    {action ? <div className={styles.action}>{action}</div> : null}
                </header>
            ) : null}
            <React.Suspense fallback={<Skeleton height={height} />}>
                <ChartCardBody
                    kind={kind}
                    series={series}
                    height={height}
                    valueFormatter={valueFormatter}
                    showLegend={showLegend ?? series.length > 1}
                    legendValues={legendValues ?? false}
                    stacked={stacked ?? false}
                />
            </React.Suspense>
        </section>
    )
}
