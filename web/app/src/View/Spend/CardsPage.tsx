import { Avatar, Badge, DataTable, type DataTableColumn } from "@ui"
import React, { useMemo, useState } from "react"
import {
    cards,
    cardSpent,
    formatDate,
    formatUsd,
    formatUsdExact,
    transactions,
    type SpendCard,
    type SpendTransaction,
} from "./spendData"
import * as styles from "./CardsPage.styles.css"

/**
 * Team cards (manifest destination `/cards`): the card wall — each tile a
 * corporate card with holder, limit, and month-to-date pace — and the
 * selected card's recent activity underneath. Fixture-backed, like the rest
 * of the spend surface (spendData.ts).
 */

const RECENT_COUNT = 8

function last4Display(card: SpendCard): string {
    return `···· ${card.last4}`
}

const activityColumns: DataTableColumn<SpendTransaction>[] = [
    {
        id: "merchant",
        header: "Merchant",
        render: (row) => (
            <span className={styles.merchantCell}>
                <Avatar name={row.merchant.name} size="sm" />
                {row.merchant.name}
            </span>
        ),
        sortValue: (row) => row.merchant.name,
    },
    {
        id: "member",
        header: "Member",
        render: (row) => row.member.name,
        sortValue: (row) => row.member.name,
    },
    {
        id: "date",
        header: "Date",
        render: (row) => formatDate(row.date),
        sortValue: (row) => row.date,
    },
    {
        id: "amount",
        header: "Amount",
        render: (row) => <span className={styles.amountCell}>{formatUsdExact(row.amountCents)}</span>,
        sortValue: (row) => row.amountCents,
    },
]

export default function CardsPage(): React.ReactElement {
    const [selectedId, setSelectedId] = useState(cards[0].id)
    const selected = cards.find((card) => card.id === selectedId) ?? cards[0]

    const activity = useMemo(
        () => transactions.filter((transaction) => transaction.cardId === selectedId).slice(0, RECENT_COUNT),
        [selectedId],
    )

    return (
        <section className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>Cards</h1>
                <p className={styles.subtitle}>
                    {cards.length} active cards — pick one to see its recent activity.
                </p>
            </header>

            <div className={styles.wall}>
                {cards.map((card) => {
                    const spent = cardSpent(card.id)
                    const pct = Math.min(Math.round((spent / card.monthlyLimitCents) * 100), 100)
                    const active = card.id === selectedId
                    return (
                        <button
                            key={card.id}
                            type="button"
                            className={`${styles.cardTile}${active ? ` ${styles.cardTileActive}` : ""}`}
                            onClick={() => setSelectedId(card.id)}
                            aria-pressed={active}
                        >
                            <span className={styles.cardTop}>
                                <span className={styles.cardLabel}>{card.label}</span>
                                <Badge tone={card.kind === "virtual" ? "info" : "neutral"}>
                                    {card.kind === "virtual" ? "Virtual" : "Physical"}
                                </Badge>
                            </span>
                            <span className={styles.cardNumber}>{last4Display(card)}</span>
                            <span className={styles.cardHolder}>{card.holder}</span>
                            <span className={styles.cardMeterTrack} aria-hidden>
                                <span className={styles.cardMeterFill} style={{ width: `${pct}%` }} />
                            </span>
                            <span className={styles.cardPace}>
                                {formatUsd(spent)} of {formatUsd(card.monthlyLimitCents)} this month
                            </span>
                        </button>
                    )
                })}
            </div>

            <div className={styles.activityCard}>
                <h2 className={styles.activityTitle}>
                    Recent activity — {selected.label} {last4Display(selected)}
                </h2>
                <DataTable
                    tableId="spend-card-activity"
                    columns={activityColumns}
                    rows={activity}
                    style="minimalist"
                />
            </div>
        </section>
    )
}
