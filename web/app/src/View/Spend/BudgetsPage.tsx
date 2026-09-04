import { Badge, ChartCard, StatCard, StatCardRow } from "@ui"
import React, { useMemo } from "react"
import { budgets, budgetSpent, formatUsd, type SpendBudget } from "./spendData"
import * as styles from "./BudgetsPage.styles.css"

/**
 * Category budgets (manifest destination `/budgets`): limit vs. actual per
 * category with pace bars, plus the spent-against-limit comparison chart.
 * Data derives from the fixtures in spendData.ts.
 */

interface BudgetRow {
    budget: SpendBudget
    spentCents: number
    pct: number
}

function pace(pct: number): { label: string; tone: "success" | "warning" | "danger" } {
    if (pct >= 100) {
        return { label: "Over budget", tone: "danger" }
    }
    if (pct >= 80) {
        return { label: "Running hot", tone: "warning" }
    }
    return { label: "On pace", tone: "success" }
}

export default function BudgetsPage(): React.ReactElement {
    const rows = useMemo<BudgetRow[]>(
        () =>
            budgets
                .map((budget) => {
                    const spentCents = budgetSpent(budget.category)
                    return {
                        budget,
                        spentCents,
                        pct: Math.round((spentCents / budget.monthlyLimitCents) * 100),
                    }
                })
                .sort((a, b) => b.pct - a.pct),
        [],
    )

    const limitTotal = budgets.reduce((sum, budget) => sum + budget.monthlyLimitCents, 0)
    const spentTotal = rows.reduce((sum, row) => sum + row.spentCents, 0)
    const hot = rows.filter((row) => row.pct >= 80).length

    return (
        <section className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>Budgets</h1>
                <p className={styles.subtitle}>Monthly limits per category, against the last 30 days.</p>
            </header>

            <StatCardRow>
                <StatCard label="Total budget" value={formatUsd(limitTotal)} hint="Across 6 categories" />
                <StatCard
                    label="Spent this month"
                    value={formatUsd(spentTotal)}
                    hint={`${Math.round((spentTotal / limitTotal) * 100)}% of budget`}
                />
                <StatCard
                    label="Remaining"
                    value={formatUsd(Math.max(limitTotal - spentTotal, 0))}
                    tone="success"
                />
                <StatCard
                    label="Running hot"
                    value={`${hot}`}
                    hint="Categories at 80%+ of limit"
                    tone={hot > 0 ? "warning" : undefined}
                />
            </StatCardRow>

            <div className={styles.grid}>
                {rows.map((row) => {
                    const status = pace(row.pct)
                    return (
                        <div key={row.budget.category} className={styles.budgetCard}>
                            <div className={styles.budgetHeader}>
                                <span className={styles.budgetName}>{row.budget.category}</span>
                                <Badge tone={status.tone}>{status.label}</Badge>
                            </div>
                            <div className={styles.budgetNumbers}>
                                <span className={styles.budgetSpent}>{formatUsd(row.spentCents)}</span>
                                <span className={styles.budgetLimit}>
                                    of {formatUsd(row.budget.monthlyLimitCents)}
                                </span>
                            </div>
                            <div
                                className={styles.meter}
                                role="progressbar"
                                aria-valuenow={Math.min(row.pct, 100)}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`${row.budget.category} budget used`}
                            >
                                <div
                                    className={`${styles.meterFill} ${styles.meterTone[status.tone]}`}
                                    style={{ width: `${Math.min(row.pct, 100)}%` }}
                                />
                            </div>
                            <span className={styles.budgetPct}>{row.pct}% used</span>
                        </div>
                    )
                })}
            </div>

            <ChartCard
                kind="bar"
                title="Spent vs. limit"
                description="This month's actuals against each category's monthly limit"
                series={[
                    {
                        id: "spent",
                        label: "Spent",
                        points: rows.map((row) => ({
                            x: row.budget.category,
                            y: Math.round(row.spentCents / 100),
                        })),
                    },
                    {
                        id: "limit",
                        label: "Limit",
                        points: rows.map((row) => ({
                            x: row.budget.category,
                            y: Math.round(row.budget.monthlyLimitCents / 100),
                        })),
                    },
                ]}
                valueFormatter={(value) => formatUsd(value * 100)}
                height={260}
            />
        </section>
    )
}
