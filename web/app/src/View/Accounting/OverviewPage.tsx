import { Badge, Button, EmptyState, Spinner, StatCard, StatCardRow, useToast } from "@ui"
import React, { useMemo } from "react"
import { Link } from "react-router-dom"
import {
    useConnectQuickBooksMutation,
    useDisconnectQuickBooksMutation,
    useQuickBooksCompanySnapshotQuery,
    useQuickBooksInvoicesQuery,
    useQuickBooksStatusQuery,
} from "../../generated/graphql/types"
import { useQuickBooksOAuth } from "../../Utils/useQuickBooksOAuth"
import {
    accountingPaths,
    formatQuickBooksDate,
    formatQuickBooksMoney,
    invoiceStatusLabels,
    invoiceStatusTones,
    type QuickBooksInvoiceNode,
} from "./accountingShared"
import * as styles from "./OverviewPage.styles.css"

/**
 * The accounting pack's signed-in home (manifest destination `/overview`,
 * packs/accounting): the connect-QuickBooks card until the books are
 * connected, then company stat cards (revenue, outstanding, overdue) over
 * the QuickBooks domain plus the most recent invoices. In the sandbox the
 * data is the simulated sample company (QUICKBOOKS_MODE=local).
 */

const RECENT_INVOICE_COUNT = 6

function buildRecentInvoices(invoices: readonly QuickBooksInvoiceNode[]): QuickBooksInvoiceNode[] {
    return [...invoices].sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1)).slice(0, RECENT_INVOICE_COUNT)
}

export default function OverviewPage(): React.ReactElement {
    const toast = useToast()
    const statusQuery = useQuickBooksStatusQuery()
    const connected = statusQuery.data?.quickBooksStatus.connected === true
    const snapshotQuery = useQuickBooksCompanySnapshotQuery({ skip: !connected })
    const invoicesQuery = useQuickBooksInvoicesQuery({ skip: !connected })

    const [connectQuickBooks, connectState] = useConnectQuickBooksMutation()
    const [disconnectQuickBooks, disconnectState] = useDisconnectQuickBooksMutation()

    const oauth = useQuickBooksOAuth({
        onConnected: (companyName) => {
            void statusQuery.refetch()
            toast.publish({
                title: "QuickBooks connected",
                description: companyName ? `Now serving the books for ${companyName}.` : undefined,
                tone: "success",
            })
        },
        onError: (message) =>
            toast.publish({ title: "Connecting failed", description: message, tone: "danger" }),
    })

    const connect = async (): Promise<void> => {
        if (oauth.isOAuthMode) {
            await oauth.startOAuth()
            return
        }
        try {
            const result = await connectQuickBooks({
                variables: { input: { idempotencyKey: crypto.randomUUID() } },
                refetchQueries: ["QuickBooksStatus", "QuickBooksCompanySnapshot", "QuickBooksInvoices"],
            })
            const companyName = result.data?.connectQuickBooks.companyName
            toast.publish({
                title: "QuickBooks connected",
                description: companyName ? `Now serving the books for ${companyName}.` : undefined,
                tone: "success",
            })
        } catch (caught) {
            toast.publish({
                title: "Connecting failed",
                description: caught instanceof Error ? caught.message : undefined,
                tone: "danger",
            })
        }
    }

    const disconnect = async (): Promise<void> => {
        try {
            await disconnectQuickBooks({ refetchQueries: ["QuickBooksStatus"] })
            toast.publish({ title: "QuickBooks disconnected", tone: "success" })
        } catch (caught) {
            toast.publish({
                title: "Disconnecting failed",
                description: caught instanceof Error ? caught.message : undefined,
                tone: "danger",
            })
        }
    }

    const snapshot = snapshotQuery.data?.quickBooksCompanySnapshot
    const recentInvoices = useMemo(
        () => buildRecentInvoices(invoicesQuery.data?.quickBooksInvoices ?? []),
        [invoicesQuery.data],
    )

    const loading = statusQuery.loading || (connected && (snapshotQuery.loading || invoicesQuery.loading))
    const error = statusQuery.error ?? snapshotQuery.error ?? invoicesQuery.error

    return (
        <section className={styles.page}>
            <header className={styles.header}>
                <h1 className={styles.title}>Overview</h1>
                <p className={styles.subtitle}>
                    {connected && snapshot
                        ? `The books for ${snapshot.companyName}, straight from QuickBooks.`
                        : "Connect QuickBooks and your books show up here."}
                </p>
            </header>

            {error ? (
                <div className={styles.card}>
                    <p className={styles.errorText}>{error.message}</p>
                    <div>
                        <Button variant="secondary" size="sm" onClick={() => void statusQuery.refetch()}>
                            Retry
                        </Button>
                    </div>
                </div>
            ) : loading ? (
                <div className={styles.loadingWrap}>
                    <Spinner size="lg" />
                </div>
            ) : !connected ? (
                <div className={styles.connectCard}>
                    <h2 className={styles.cardTitle}>Connect QuickBooks</h2>
                    <p className={styles.subtitle}>
                        {oauth.isOAuthMode
                            ? "Link your QuickBooks company to see revenue, outstanding invoices, and customers on this dashboard. You'll approve read-only access on Intuit's consent screen and land right back here."
                            : "Link your QuickBooks company to see revenue, outstanding invoices, and customers on this dashboard — and to let the advisor answer questions about your books. In the sandbox this connects instantly to a realistic sample company."}
                    </p>
                    <div>
                        <Button
                            onClick={() => void connect()}
                            disabled={connectState.loading || oauth.isCompleting}
                        >
                            {oauth.isCompleting
                                ? "Finishing connection..."
                                : connectState.loading
                                  ? "Connecting..."
                                  : "Connect QuickBooks"}
                        </Button>
                    </div>
                </div>
            ) : (
                <>
                    {snapshot && (
                        <StatCardRow>
                            <StatCard
                                label="Revenue"
                                value={formatQuickBooksMoney(snapshot.revenueMinorUnits)}
                                hint={`${snapshot.paidInvoiceCount} paid invoices`}
                            />
                            <StatCard
                                label="Outstanding"
                                value={formatQuickBooksMoney(snapshot.outstandingMinorUnits)}
                                hint={`${snapshot.openInvoiceCount + snapshot.overdueInvoiceCount} unpaid invoices`}
                            />
                            <StatCard
                                label="Overdue"
                                value={formatQuickBooksMoney(snapshot.overdueMinorUnits)}
                                hint={`${snapshot.overdueInvoiceCount} invoices past due`}
                            />
                            <StatCard
                                label="Customers"
                                value={`${snapshot.customerCount}`}
                                hint="Active in QuickBooks"
                            />
                        </StatCardRow>
                    )}

                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>Recent invoices</h2>
                            <Link className={styles.cardLink} to={accountingPaths.invoices}>
                                View all invoices
                            </Link>
                        </div>
                        {recentInvoices.length > 0 ? (
                            <ul className={styles.invoiceList}>
                                {recentInvoices.map((invoice) => (
                                    <li key={invoice.id} className={styles.invoiceRow}>
                                        <div className={styles.invoiceBody}>
                                            <span className={styles.invoiceName}>
                                                {invoice.docNumber} — {invoice.customerName}
                                            </span>
                                            <span className={styles.invoiceMeta}>
                                                Issued {formatQuickBooksDate(invoice.issueDate)} · due{" "}
                                                {formatQuickBooksDate(invoice.dueDate)}
                                            </span>
                                        </div>
                                        <Badge tone={invoiceStatusTones[invoice.status]}>
                                            {invoiceStatusLabels[invoice.status]}
                                        </Badge>
                                        <span className={styles.invoiceAmount}>
                                            {formatQuickBooksMoney(invoice.totalMinorUnits)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <EmptyState
                                title="No invoices yet"
                                description="Invoices from QuickBooks show up here."
                            />
                        )}
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>Ask the advisor</h2>
                            <Link className={styles.cardLink} to={accountingPaths.advisor}>
                                Open the advisor
                            </Link>
                        </div>
                        <p className={styles.subtitle}>
                            The AI advisor reads these same books through its QuickBooks tools — ask it which
                            invoices are overdue or how revenue is trending.
                        </p>
                        <div>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => void disconnect()}
                                disabled={disconnectState.loading}
                            >
                                {disconnectState.loading ? "Disconnecting..." : "Disconnect QuickBooks"}
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </section>
    )
}
