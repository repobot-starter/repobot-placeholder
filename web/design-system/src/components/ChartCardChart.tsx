import React, { useId, useLayoutEffect, useRef, useState } from "react"
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"
import { vars } from "../theme/tokens.css"
import type { ChartCardKind, ChartSeries } from "./ChartCard"
import * as styles from "./ChartCard.styles.css"

/**
 * The recharts-backed body of ChartCard, loaded lazily so the charting
 * library stays out of the main bundle. Never import this module (or
 * recharts) from app code — ChartCard is the public surface.
 */

interface ChartCardChartProps {
    kind: ChartCardKind
    series: ChartSeries[]
    height: number
    valueFormatter?: (value: number) => string
    showLegend: boolean
    legendValues: boolean
    stacked: boolean
}

/**
 * Colors resolved from the live theme class. Charts paint into SVG
 * attributes, which don't resolve CSS variables, so the token values are
 * read off the DOM once mounted (and track theme/mode changes via the
 * container's computed style).
 */
interface ResolvedChartTheme {
    palette: string[]
    grid: string
    tick: string
}

function cssVarName(token: string): string | null {
    const match = token.match(/^var\((--[^),\s]+)/)
    return match ? match[1] : null
}

function resolveToken(element: HTMLElement, token: string): string {
    const name = cssVarName(token)
    if (!name) {
        return token
    }
    const value = getComputedStyle(element).getPropertyValue(name).trim()
    return value || token
}

/**
 * The series ramp lives in the theme contract (`vars.chart.*`): by default
 * themeConfig derives the kernel's monochromatic accent ramp, and
 * `palette.charts` in repobot.theme.json overrides it. Grid/tick keep
 * following the border/secondary-text tokens.
 */
function buildChartTheme(element: HTMLElement): ResolvedChartTheme {
    return {
        palette: [
            resolveToken(element, vars.chart[1]),
            resolveToken(element, vars.chart[2]),
            resolveToken(element, vars.chart[3]),
            resolveToken(element, vars.chart[4]),
            resolveToken(element, vars.chart[5]),
            resolveToken(element, vars.chart[6]),
        ],
        grid: resolveToken(element, vars.color.border),
        tick: resolveToken(element, vars.color.textSecondary),
    }
}

/** Rows in recharts shape: one object per x, one key per series id. */
function mergeSeries(series: ChartSeries[]): Record<string, string | number>[] {
    const order: (string | number)[] = []
    const byX = new Map<string | number, Record<string, string | number>>()
    for (const entry of series) {
        for (const point of entry.points) {
            let row = byX.get(point.x)
            if (!row) {
                row = { x: point.x }
                byX.set(point.x, row)
                order.push(point.x)
            }
            row[entry.id] = point.y
        }
    }
    return order.map((x) => byX.get(x) as Record<string, string | number>)
}

function defaultFormatter(value: number): string {
    return value.toLocaleString()
}

interface TooltipEntry {
    dataKey?: string | number
    name?: string | number
    value?: number | string
}

function ChartTooltip({
    active,
    label,
    payload,
    seriesLabels,
    colorBySeries,
    format,
}: {
    active?: boolean
    label?: string | number
    payload?: TooltipEntry[]
    seriesLabels: Map<string, string>
    colorBySeries: Map<string, string>
    format: (value: number) => string
}): React.ReactElement | null {
    if (!active || !payload || payload.length === 0) {
        return null
    }
    return (
        <div className={styles.tooltip}>
            {label !== undefined && label !== "" ? (
                <span className={styles.tooltipLabel}>{label}</span>
            ) : null}
            {payload.map((entry) => {
                // Cartesian entries key by dataKey (the series id); Pie
                // entries key by name (the segment label).
                const key = String(entry.name ?? entry.dataKey ?? "")
                const value = typeof entry.value === "number" ? format(entry.value) : entry.value
                return (
                    <span key={key} className={styles.tooltipRow}>
                        <span className={styles.swatch} style={{ background: colorBySeries.get(key) }} />
                        {seriesLabels.get(key) ?? key}
                        <span className={styles.tooltipValue}>{value}</span>
                    </span>
                )
            })}
        </div>
    )
}

function DonutValueLegend({
    segments,
    colorBySegment,
    total,
    format,
}: {
    segments: { x: string | number; y: number }[]
    colorBySegment: Map<string, string>
    total: number
    format: (value: number) => string
}): React.ReactElement {
    return (
        <div className={styles.valueLegend}>
            {segments.map((segment) => {
                const key = `${segment.x}`
                const share = total > 0 ? Math.round((segment.y / total) * 100) : 0
                return (
                    <span key={key} className={styles.valueLegendRow}>
                        <span className={styles.swatch} style={{ background: colorBySegment.get(key) }} />
                        <span className={styles.valueLegendLabel}>{key}</span>
                        <span className={styles.valueLegendValue}>{format(segment.y)}</span>
                        <span className={styles.valueLegendShare}>{share}%</span>
                    </span>
                )
            })}
        </div>
    )
}

function ChartLegend({
    series,
    colorBySeries,
}: {
    series: { id: string; label: string }[]
    colorBySeries: Map<string, string>
}): React.ReactElement {
    return (
        <div className={styles.legend}>
            {series.map((entry) => (
                <span key={entry.id} className={styles.legendItem}>
                    <span className={styles.swatch} style={{ background: colorBySeries.get(entry.id) }} />
                    {entry.label}
                </span>
            ))}
        </div>
    )
}

export default function ChartCardChart({
    kind,
    series,
    height,
    valueFormatter,
    showLegend,
    legendValues,
    stacked,
}: ChartCardChartProps): React.ReactElement {
    const containerRef = useRef<HTMLDivElement>(null)
    const [chartTheme, setChartTheme] = useState<ResolvedChartTheme | null>(null)
    const gradientPrefix = useId().replace(/:/g, "")

    useLayoutEffect(() => {
        if (containerRef.current) {
            setChartTheme(buildChartTheme(containerRef.current))
        }
    }, [])

    const format = valueFormatter ?? defaultFormatter
    const colorBySeries = new Map<string, string>()
    if (chartTheme) {
        series.forEach((entry, index) => {
            colorBySeries.set(entry.id, chartTheme.palette[index % chartTheme.palette.length])
        })
    }

    const donutSegments = kind === "donut" ? (series[0]?.points ?? []) : []
    const donutTotal = donutSegments.reduce((sum, point) => sum + point.y, 0)
    const donutLegendSeries = donutSegments.map((point, index) => ({
        id: `${point.x}`,
        label: `${point.x}`,
        color: chartTheme ? chartTheme.palette[index % chartTheme.palette.length] : undefined,
    }))
    const donutColors = new Map(
        donutLegendSeries.map((segment) => [segment.id, segment.color ?? "transparent"]),
    )

    return (
        <>
            <div ref={containerRef} className={styles.body} style={{ height }}>
                {chartTheme ? (
                    <ResponsiveContainer width="100%" height={height}>
                        {kind === "donut"
                            ? renderDonut(donutSegments, format, donutColors)
                            : renderCartesian(
                                  kind,
                                  series,
                                  chartTheme,
                                  format,
                                  stacked,
                                  colorBySeries,
                                  gradientPrefix,
                              )}
                    </ResponsiveContainer>
                ) : null}
                {kind === "donut" && chartTheme ? (
                    <div className={styles.donutCenter}>
                        <span className={styles.donutCenterValue}>{format(donutTotal)}</span>
                        <span className={styles.donutCenterLabel}>Total</span>
                    </div>
                ) : null}
            </div>
            {showLegend && chartTheme ? (
                kind === "donut" ? (
                    legendValues ? (
                        <DonutValueLegend
                            segments={donutSegments}
                            colorBySegment={donutColors}
                            total={donutTotal}
                            format={format}
                        />
                    ) : (
                        <ChartLegend series={donutLegendSeries} colorBySeries={donutColors} />
                    )
                ) : (
                    <ChartLegend series={series} colorBySeries={colorBySeries} />
                )
            ) : null}
        </>
    )
}

function renderCartesian(
    kind: Exclude<ChartCardKind, "donut">,
    series: ChartSeries[],
    chartTheme: ResolvedChartTheme,
    format: (value: number) => string,
    stacked: boolean,
    colorBySeries: Map<string, string>,
    gradientPrefix: string,
): React.ReactElement {
    const rows = mergeSeries(series)
    const seriesLabels = new Map(series.map((entry) => [entry.id, entry.label]))
    const tick = { fontSize: 11, fill: chartTheme.tick }
    const margin = { top: 4, right: 4, bottom: 0, left: 0 }
    const shared = (
        <>
            <CartesianGrid vertical={false} stroke={chartTheme.grid} strokeDasharray="3 3" />
            <XAxis dataKey="x" tickLine={false} axisLine={false} tick={tick} tickMargin={8} />
            <YAxis
                width={44}
                tickLine={false}
                axisLine={false}
                tick={tick}
                tickFormatter={(value: number) => format(value)}
            />
            <Tooltip
                cursor={{ stroke: chartTheme.grid }}
                content={
                    <ChartTooltip seriesLabels={seriesLabels} colorBySeries={colorBySeries} format={format} />
                }
            />
        </>
    )

    if (kind === "bar") {
        return (
            <BarChart data={rows} margin={margin}>
                {shared}
                {series.map((entry) => (
                    <Bar
                        key={entry.id}
                        dataKey={entry.id}
                        fill={colorBySeries.get(entry.id)}
                        stackId={stacked ? "stack" : undefined}
                        radius={stacked ? undefined : [4, 4, 0, 0]}
                        maxBarSize={40}
                    />
                ))}
            </BarChart>
        )
    }
    if (kind === "area") {
        // A vertical fade under each curve instead of a flat wash — the
        // gradient-fill read every current dashboard reference shares.
        return (
            <AreaChart data={rows} margin={margin}>
                <defs>
                    {series.map((entry) => (
                        <linearGradient
                            key={entry.id}
                            id={`${gradientPrefix}-${entry.id}`}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                        >
                            <stop offset="0%" stopColor={colorBySeries.get(entry.id)} stopOpacity={0.3} />
                            <stop offset="100%" stopColor={colorBySeries.get(entry.id)} stopOpacity={0.02} />
                        </linearGradient>
                    ))}
                </defs>
                {shared}
                {series.map((entry) => (
                    <Area
                        key={entry.id}
                        dataKey={entry.id}
                        stroke={colorBySeries.get(entry.id)}
                        fill={`url(#${gradientPrefix}-${entry.id})`}
                        strokeWidth={2}
                        stackId={stacked ? "stack" : undefined}
                    />
                ))}
            </AreaChart>
        )
    }
    return (
        <LineChart data={rows} margin={margin}>
            {shared}
            {series.map((entry) => (
                <Line
                    key={entry.id}
                    dataKey={entry.id}
                    stroke={colorBySeries.get(entry.id)}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3 }}
                />
            ))}
        </LineChart>
    )
}

function renderDonut(
    segments: { x: string | number; y: number }[],
    format: (value: number) => string,
    colorBySegment: Map<string, string>,
): React.ReactElement {
    const data = segments.map((point) => ({ name: `${point.x}`, value: point.y }))
    const labels = new Map(data.map((entry) => [entry.name, entry.name]))
    return (
        <PieChart>
            <Tooltip
                content={
                    <ChartTooltip seriesLabels={labels} colorBySeries={colorBySegment} format={format} />
                }
            />
            <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="64%"
                outerRadius="92%"
                paddingAngle={2}
                strokeWidth={0}
            >
                {data.map((entry) => (
                    <Cell key={entry.name} fill={colorBySegment.get(entry.name)} />
                ))}
            </Pie>
        </PieChart>
    )
}
