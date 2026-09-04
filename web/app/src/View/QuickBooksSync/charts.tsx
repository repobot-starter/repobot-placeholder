import React, { useId } from "react"
import { formatMoneyCompact, formatMoneyWhole, type MonthPoint } from "./booksData"
import { categorySeries, palette } from "./palette"
import * as styles from "./commandCenter.css"

/**
 * Hand-rolled SVG data ink for the command center: a KPI sparkline, the
 * hero revenue-vs-expenses chart, and the expense donut. Kept deliberately
 * lightweight (no charting library) so the page can art-direct every pixel
 * — gradients, glow, and CSS draw-in animations tuned for the dark palette.
 */

//
// Sparkline
//

export type SparklineTone = "inflow" | "outflow" | "amber"

const sparklineStroke: Record<SparklineTone, string> = {
    inflow: palette.inflowBright,
    outflow: palette.outflow,
    amber: palette.amber,
}

export interface SparklineProps {
    values: readonly number[]
    tone?: SparklineTone
    width?: number
    height?: number
}

export function Sparkline({
    values,
    tone = "inflow",
    width = 150,
    height = 44,
}: SparklineProps): React.ReactElement | null {
    const gradientId = useId()
    if (values.length < 2) {
        return null
    }
    const pad = 4
    const min = Math.min(...values)
    const max = Math.max(...values)
    const span = max - min
    const toX = (index: number): number => pad + (index / (values.length - 1)) * (width - pad * 2)
    const toY = (value: number): number =>
        span === 0 ? height / 2 : height - pad - ((value - min) / span) * (height - pad * 2)
    const points = values.map((value, index) => `${toX(index).toFixed(2)},${toY(value).toFixed(2)}`)
    const linePath = `M${points.join(" L")}`
    const areaPath = `${linePath} L${toX(values.length - 1).toFixed(2)},${height} L${toX(0).toFixed(2)},${height} Z`
    const stroke = sparklineStroke[tone]
    const lastX = toX(values.length - 1)
    const lastY = toY(values[values.length - 1])
    return (
        <svg
            className={styles.chartSvg}
            viewBox={`0 0 ${width} ${height}`}
            width={width}
            height={height}
            role="img"
            aria-hidden="true"
        >
            <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
                    <stop offset="100%" stopColor={stroke} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#${gradientId})`} className={styles.chartFadeIn} />
            <path
                d={linePath}
                fill="none"
                stroke={stroke}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                className={styles.chartLineDraw}
            />
            <circle
                cx={lastX}
                cy={lastY}
                r={5.5}
                fill={stroke}
                opacity={0.18}
                className={styles.chartFadeIn}
            />
            <circle cx={lastX} cy={lastY} r={2.4} fill={stroke} className={styles.chartFadeIn} />
        </svg>
    )
}

//
// Hero chart: monthly income and expense bars with a glowing net-profit line
//

function niceCeil(value: number): number {
    if (value <= 0) {
        return 1
    }
    const exponent = 10 ** Math.floor(Math.log10(value))
    const fraction = value / exponent
    const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10
    return nice * exponent
}

export interface TrendChartProps {
    points: readonly MonthPoint[]
}

export function TrendChart({ points }: TrendChartProps): React.ReactElement | null {
    const uid = useId()
    if (points.length === 0) {
        return null
    }
    const width = 860
    const height = 336
    const margin = { top: 16, right: 12, bottom: 28, left: 52 }
    const innerWidth = width - margin.left - margin.right
    const innerHeight = height - margin.top - margin.bottom
    const rawMax = Math.max(
        ...points.map((point) => Math.max(point.incomeMinorUnits, point.expensesMinorUnits)),
    )
    const yMax = niceCeil(rawMax)
    const toY = (value: number): number => margin.top + innerHeight - (value / yMax) * innerHeight
    const slot = innerWidth / points.length
    const barWidth = Math.min(13, slot * 0.27)
    const centerX = (index: number): number => margin.left + slot * index + slot / 2

    const ticks = [0, 1, 2, 3, 4].map((step) => (yMax * step) / 4)
    const netLine = `M${points
        .map((point, index) => `${centerX(index).toFixed(2)},${toY(point.netMinorUnits).toFixed(2)}`)
        .join(" L")}`
    const lastIndex = points.length - 1
    const lastNetY = toY(points[lastIndex].netMinorUnits)

    const incomeGradient = `${uid}-income`
    const expenseGradient = `${uid}-expense`
    const glowFilter = `${uid}-glow`

    return (
        <svg
            className={styles.chartSvg}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label="Monthly income, expenses, and net profit for the trailing thirteen months"
        >
            <defs>
                <linearGradient id={incomeGradient} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={palette.inflowBright} stopOpacity="0.95" />
                    <stop offset="100%" stopColor={palette.inflow} stopOpacity="0.28" />
                </linearGradient>
                <linearGradient id={expenseGradient} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={palette.outflow} stopOpacity="0.8" />
                    <stop offset="100%" stopColor={palette.outflow} stopOpacity="0.16" />
                </linearGradient>
                <filter id={glowFilter} x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="3.6" />
                </filter>
            </defs>

            {ticks.map((tick) => (
                <g key={tick}>
                    <line
                        x1={margin.left}
                        x2={width - margin.right}
                        y1={toY(tick)}
                        y2={toY(tick)}
                        stroke={tick === 0 ? palette.line : palette.lineSoft}
                        strokeWidth={1}
                    />
                    <text
                        x={margin.left - 10}
                        y={toY(tick) + 3.5}
                        textAnchor="end"
                        fontSize={11}
                        fill={palette.faint}
                    >
                        {formatMoneyCompact(tick)}
                    </text>
                </g>
            ))}

            {points.map((point, index) => {
                const cx = centerX(index)
                const incomeY = toY(point.incomeMinorUnits)
                const expenseY = toY(point.expensesMinorUnits)
                const baseline = toY(0)
                return (
                    <g key={point.month}>
                        <rect
                            className={styles.chartHitRect}
                            x={margin.left + slot * index}
                            y={margin.top}
                            width={slot}
                            height={innerHeight}
                        >
                            <title>
                                {`${point.label} — income ${formatMoneyWhole(point.incomeMinorUnits)}, expenses ${formatMoneyWhole(point.expensesMinorUnits)}, net ${formatMoneyWhole(point.netMinorUnits)}`}
                            </title>
                        </rect>
                        <rect
                            x={cx - barWidth - 1.5}
                            y={incomeY}
                            width={barWidth}
                            height={Math.max(baseline - incomeY, 1)}
                            rx={2.5}
                            fill={`url(#${incomeGradient})`}
                            className={styles.chartBarGrow}
                            style={{ animationDelay: `${0.15 + index * 0.035}s` }}
                            pointerEvents="none"
                        />
                        <rect
                            x={cx + 1.5}
                            y={expenseY}
                            width={barWidth}
                            height={Math.max(baseline - expenseY, 1)}
                            rx={2.5}
                            fill={`url(#${expenseGradient})`}
                            className={styles.chartBarGrow}
                            style={{ animationDelay: `${0.19 + index * 0.035}s` }}
                            pointerEvents="none"
                        />
                        <text
                            x={cx}
                            y={height - 8}
                            textAnchor="middle"
                            fontSize={11}
                            fill={index === lastIndex ? palette.muted : palette.faint}
                            fontWeight={index === lastIndex ? 600 : 400}
                            pointerEvents="none"
                        >
                            {index === 0 ? `${point.label} ’${point.month.slice(2, 4)}` : point.label}
                        </text>
                    </g>
                )
            })}

            <path
                d={netLine}
                fill="none"
                stroke={palette.inflowBright}
                strokeWidth={5}
                strokeLinecap="round"
                opacity={0.35}
                filter={`url(#${glowFilter})`}
                pathLength={1}
                className={styles.chartLineDrawSlow}
                pointerEvents="none"
            />
            <path
                d={netLine}
                fill="none"
                stroke={palette.inflowBright}
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                className={styles.chartLineDrawSlow}
                pointerEvents="none"
            />
            <circle
                cx={centerX(lastIndex)}
                cy={lastNetY}
                r={7}
                fill={palette.inflowBright}
                opacity={0.2}
                className={styles.chartFadeIn}
            />
            <circle
                cx={centerX(lastIndex)}
                cy={lastNetY}
                r={3}
                fill={palette.inflowBright}
                stroke={palette.bg}
                strokeWidth={1.5}
                className={styles.chartFadeIn}
            />
        </svg>
    )
}

//
// Expense donut
//

export interface DonutSegment {
    label: string
    value: number
}

export interface DonutChartProps {
    segments: readonly DonutSegment[]
    centerValue: string
    centerLabel: string
    size?: number
}

export function DonutChart({
    segments,
    centerValue,
    centerLabel,
    size = 176,
}: DonutChartProps): React.ReactElement | null {
    const total = segments.reduce((sum, segment) => sum + segment.value, 0)
    if (total <= 0) {
        return null
    }
    const center = size / 2
    const radius = center - 12
    const circumference = 2 * Math.PI * radius
    const gap = 2.5
    let cursor = 0
    return (
        <svg
            className={styles.chartSvg}
            viewBox={`0 0 ${size} ${size}`}
            width={size}
            height={size}
            role="img"
            aria-label="Operating spend by category"
        >
            <circle cx={center} cy={center} r={radius} fill="none" stroke={palette.inset} strokeWidth={15} />
            <g transform={`rotate(-90 ${center} ${center})`}>
                {segments.map((segment, index) => {
                    const fraction = segment.value / total
                    const length = Math.max(fraction * circumference - gap, 0.75)
                    const offset = -cursor * circumference
                    cursor += fraction
                    return (
                        <circle
                            key={segment.label}
                            cx={center}
                            cy={center}
                            r={radius}
                            fill="none"
                            stroke={categorySeries[index % categorySeries.length]}
                            strokeWidth={15}
                            strokeDasharray={`${length} ${circumference}`}
                            strokeDashoffset={offset}
                            className={styles.chartFadeIn}
                            style={{ animationDelay: `${0.1 + index * 0.07}s` }}
                        >
                            <title>{`${segment.label} — ${formatMoneyWhole(segment.value)}`}</title>
                        </circle>
                    )
                })}
            </g>
            <text
                x={center}
                y={center - 4}
                textAnchor="middle"
                fontSize={20}
                fontWeight={700}
                fill={palette.ink}
            >
                {centerValue}
            </text>
            <text x={center} y={center + 15} textAnchor="middle" fontSize={10.5} fill={palette.muted}>
                {centerLabel}
            </text>
        </svg>
    )
}
