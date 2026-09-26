import { Avatar, Badge, DataTable, type DataTableColumn } from "@ui"
import React, { useMemo } from "react"
import {
    formatDate,
    formatUsd,
    formatUsdExact,
    cards,
    SPEND_CATEGORIES,
    totalInWindow,
    transactions,
    type SpendTransaction,
} from "./spendData"
import * as styles from "./TransactionsPage.styles.css"

/**
 * The full 90-day ledger (manifest destination `/transactions`): the
 * detailed-table treatment — sticky header, per-column filters, column
 * manager, CSV export — over the fixtures in spendData.ts.
 */

const CATEGORY_TONES: Record<string, "accent" | "success" | "danger" | "warning" | "info" | "neutral"> = {
    Software: "accent",
    Marketing: "info",
    Travel: "warning",
    Meals: "success",
    Office: "neutral",
    Services: "danger",
}

function cardLabel(cardId: string): string {
    const card = cards.find((entry) => entry.id === cardId)
    return card ? `${card.label} ···${card.last4}` : cardId
}

const columns: DataTableColumn<SpendTransaction>[] = [
    {
        id: "merchant",
        header: "Merchant",
        pinned: "left",
        render: (row) => (
            <span className={styles.merchantCell}>
                <Avatar name={row.merchant.name} size="sm" />
                {row.merchant.name}
            </span>
        ),
        sortValue: (row) => row.merchant.name,
        filter: { type: "text" },
        exportValue: (row) => row.merchant.name,
    },
    {
        id: "category",
        header: "Category",
        render: (row) => <Badge tone={CATEGORY_TONES[row.merchant.category]}>{row.merchant.category}</Badge>,
        sortValue: (row) => row.merchant.category,
        filter: {
            type: "select",
            options: SPEND_CATEGORIES.map((category) => ({ value: category, label: category })),
        },
        exportValue: (row) => row.merchant.category,
    },
    {
        id: "member",
        header: "Member",
        render: (row) => (
            <span className={styles.memberCell}>
                <Avatar name={row.member.name} size="xs" />
                {row.member.name}
            </span>
        ),
        sortValue: (row) => row.member.name,
        filter: { type: "text" },
        exportValue: (row) => row.member.name,
    },
    {
        id: "card",
        header: "Card",
        render: (row) => cardLabel(row.cardId),
        sortValue: (row) => cardLabel(row.cardId),
        hiddenByDefault: true,
    },
    {
        id: "date",
        header: "Date",
        render: (row) => formatDate(row.date),
        sortValue: (row) => row.date,
    },
    {
        id: "status",
        header: "Status",
        render: (row) =>
            row.status === "pending" ? (
                <Badge tone="warning">Pending</Badge>
            ) : (
                <Badge tone="neutral">Posted</Badge>
            ),
        sortValue: (row) => row.status,
        hiddenByDefault: true,
    },
    {
        id: "amount",
        header: "Amount",
        render: (row) => <span className={styles.amountCell}>{formatUsdExact(row.amountCents)}</span>,
        sortValue: (row) => row.amountCents,
        exportValue: (row) => (row.amountCents / 100).toFixed(2),
    },
]

export default function TransactionsPage(): React.ReactElement {
    const monthSpend = useMemo(() => totalInWindow(30, 0), [])
    return (
        <section className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>Transactions</h1>
                <p className={styles.subtitle}>
                    {transactions.length} transactions in the last 90 days — {formatUsd(monthSpend)} of it
                    this month.
                </p>
            </header>
            {/* Rows arrive newest-first from spendData; sortable columns re-sort client-side. */}
            <DataTable
                tableId="spend-transactions"
                columns={columns}
                rows={transactions}
                style="detailed"
                pagination={{ pageSize: 25 }}
            />
        </section>
    )
}
