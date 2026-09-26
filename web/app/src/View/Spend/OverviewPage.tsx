import { Avatar, Badge, Button, ChartCard, Select, StatCard, StatCardRow, useToast } from "@ui"
import React, { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useCurrentUserQuery } from "../../generated/graphql/types"
import {
    approvals as allApprovals,
    budgets,
    cards,
    dailySpend,
    formatUsd,
    formatUsdExact,
    spendByCategory,
    spendPaths,
    totalInWindow,
    transactions,
    weeklyTrend,
    type SpendApproval,
    type SpendCategory,
} from "./spendData"
import * as styles from "./OverviewPage.styles.css"

/**
 * The saas pack's signed-in home (manifest destination `/overview`,
 * docs/project-ia.md): the Outlay spend dashboard — KPI cards with trends,
 * the daily-spend curve, category mix, the approvals queue, and the latest
 * ledger rows. Data comes from the deterministic fixtures in spendData.ts;
 * see packs/saas/PACK.md for the swap-to-live recipe.
 */

const CATEGORY_TONES: Record<
    SpendCategory,
    "accent" | "success" | "danger" | "warning" | "info" | "neutral"
> = {
    Software: "accent",
    Marketing: "info",
    Travel: "warning",
    Meals: "success",
    Office: "neutral",
    Services: "danger",
}

function greeting(): string {
    const hour = new Date().getHours()
    if (hour < 5) {
        return "Working late"
    }
    if (hour < 12) {
        return "Good morning"
    }
    if (hour < 18) {
        return "Good afternoon"
    }
    return "Good evening"
}

const RANGE_OPTIONS = [
    { value: "30", label: "Last 30 days" },
    { value: "60", label: "Last 60 days" },
    { value: "90", label: "Last 90 days" },
]

const RECENT_COUNT = 6

/** Fixture context the ledger can't derive: request and card-count history. */
const APPROVALS_TREND = [3, 5, 4, 7, 6, 8, 5, 9, 7, 10, 8, 6]
const CARDS_TREND = [4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6]

export default function OverviewPage(): React.ReactElement {
    const toast = useToast()
    const currentUserQuery = useCurrentUserQuery()
    const [range, setRange] = useState("30")
    const [resolved, setResolved] = useState<Record<string, "approved" | "declined">>({})

    const days = Number(range)
    const spendSeries = useMemo(() => dailySpend(days), [days])
    const categories = useMemo(() => spendByCategory(days), [days])
    const trend = useMemo(() => weeklyTrend(), [])

    const monthSpend = totalInWindow(30, 0)
    const priorSpend = totalInWindow(60, 30)
    const deltaPct = priorSpend > 0 ? Math.round(((monthSpend - priorSpend) / priorSpend) * 100) : 0
    const budgetTotal = budgets.reduce((sum, budget) => sum + budget.monthlyLimitCents, 0)
    const budgetRemaining = Math.max(budgetTotal - monthSpend, 0)
    const pending = allApprovals.filter((approval) => !resolved[approval.id])
    const pendingSum = pending.reduce((sum, approval) => sum + approval.amountCents, 0)

    const recent = transactions.slice(0, RECENT_COUNT)
    const displayName = currentUserQuery.data?.currentUser.displayName?.split(" ")[0]

    const resolve = (approval: SpendApproval, verdict: "approved" | "declined"): void => {
        setResolved((current) => ({ ...current, [approval.id]: verdict }))
        toast.publish({
            title: verdict === "approved" ? "Request approved" : "Request declined",
            description: `${formatUsdExact(approval.amountCents)} — ${approval.merchant}`,
            tone: verdict === "approved" ? "success" : "neutral",
        })
    }

    return (
        <section className={styles.page}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>
                        {greeting()}
                        {displayName ? `, ${displayName}` : ""}
                    </h1>
                    <p className={styles.subtitle}>Here's where the team's spend stands.</p>
                </div>
                <div className={styles.rangeSelect}>
                    <Select
                        aria-label="Date range"
                        options={RANGE_OPTIONS}
                        value={range}
                        onValueChange={setRange}
                    />
                </div>
            </header>

            <StatCardRow>
                <StatCard
                    label="Spend this month"
                    value={formatUsd(monthSpend)}
                    delta={{
                        value: `${deltaPct >= 0 ? "+" : ""}${deltaPct}%`,
                        direction: deltaPct > 0 ? "up" : deltaPct < 0 ? "down" : "flat",
                        upIsPositive: false,
                    }}
                    hint="vs prior 30 days"
                    trend={trend}
                />
                <StatCard
                    label="Budget remaining"
                    value={formatUsd(budgetRemaining)}
                    hint={`${Math.round((budgetRemaining / budgetTotal) * 100)}% of ${formatUsd(budgetTotal)}`}
                    trend={trend.map((cents) => Math.max(budgetTotal / 4 - cents, 0))}
                />
                <StatCard
                    label="Pending approvals"
                    value={`${pending.length}`}
                    hint={`${formatUsd(pendingSum)} requested`}
                    trend={APPROVALS_TREND}
                />
                <StatCard
                    label="Active cards"
                    value={`${cards.length}`}
                    hint={`${formatUsd(cards.reduce((sum, card) => sum + card.monthlyLimitCents, 0))} in limits`}
                    trend={CARDS_TREND}
                />
            </StatCardRow>

            <div className={styles.chartsRow}>
                <ChartCard
                    kind="area"
                    title="Daily spend"
                    description={`${formatUsd(spendSeries.reduce((sum, point) => sum + point.cents, 0))} over the period`}
                    series={[
                        {
                            id: "spend",
                            label: "Spend",
                            points: spendSeries.map((point) => ({
                                x: point.label,
                                y: Math.round(point.cents / 100),
                            })),
                        },
                    ]}
                    valueFormatter={(value) => formatUsd(value * 100)}
                    height={280}
                />
                <ChartCard
                    kind="donut"
                    title="Spend by category"
                    series={[
                        {
                            id: "categories",
                            label: "Categories",
                            points: categories.map((entry) => ({
                                x: entry.category,
                                y: Math.round(entry.cents / 100),
                            })),
                        },
                    ]}
                    valueFormatter={(value) => formatUsd(value * 100)}
                    showLegend
                    legendValues
                    height={200}
                />
            </div>

            <div className={styles.listsRow}>
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>
                            Approvals queue
                            {pending.length > 0 ? <Badge tone="warning">{pending.length}</Badge> : null}
                        </h2>
                    </div>
                    {pending.length > 0 ? (
                        <ul className={styles.queue}>
                            {pending.map((approval) => (
                                <li key={approval.id} className={styles.queueRow}>
                                    <Avatar name={approval.member.name} size="md" />
                                    <div className={styles.queueBody}>
                                        <span className={styles.queueName}>{approval.member.name}</span>
                                        <span className={styles.queueMeta}>
                                            {approval.merchant} — {approval.purpose}
                                        </span>
                                    </div>
                                    <span className={styles.queueAmount}>
                                        {formatUsdExact(approval.amountCents)}
                                    </span>
                                    <div className={styles.queueActions}>
                                        <Button size="sm" onClick={() => resolve(approval, "approved")}>
                                            Approve
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => resolve(approval, "declined")}
                                        >
                                            Decline
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className={styles.queueEmpty}>All caught up — nothing waiting on you.</p>
                    )}
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Recent transactions</h2>
                        <Link className={styles.cardLink} to={spendPaths.transactions}>
                            View all
                        </Link>
                    </div>
                    <ul className={styles.ledger}>
                        {recent.map((transaction) => (
                            <li key={transaction.id} className={styles.ledgerRow}>
                                <Avatar name={transaction.merchant.name} size="sm" />
                                <div className={styles.ledgerBody}>
                                    <span className={styles.ledgerName}>{transaction.merchant.name}</span>
                                    <span className={styles.ledgerMeta}>{transaction.member.name}</span>
                                </div>
                                <Badge tone={CATEGORY_TONES[transaction.merchant.category]}>
                                    {transaction.merchant.category}
                                </Badge>
                                <span className={styles.ledgerAmount}>
                                    {formatUsdExact(transaction.amountCents)}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    )
}
