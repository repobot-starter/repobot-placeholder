import { AppShell, Button, Spinner, useToast } from "@ui"
import React, { useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useSnapshot } from "valtio"
import { runtime } from "../../Config/Runtime"
import { authRouteWithReturnTo, routes } from "../../Config/Router"
import {
    useConnectQuickBooksMutation,
    useDisconnectQuickBooksMutation,
    useQuickBooksCompanySnapshotQuery,
    useQuickBooksCustomersQuery,
    useQuickBooksInvoicesQuery,
    useQuickBooksStatusQuery,
    type QuickBooksInvoiceStatus,
} from "../../generated/graphql/types"
import { useQuickBooksOAuth } from "../../Utils/useQuickBooksOAuth"
import { formatQuickBooksDate, invoiceStatusLabels } from "../Accounting/accountingShared"
import {
    buildAgingBuckets,
    buildCashSeries,
    buildExpenseMix,
    buildMonthlySeries,
    buildTopCustomers,
    formatMoneyCompact,
    formatMoneyWhole,
    monthShortLabel,
    QUICK_BOOKS_SYNC_STATEMENTS_NAME,
    trendBetween,
    useQuickBooksSyncStatementsQuery,
    type Trend,
} from "./booksData"
import { DonutChart, Sparkline, TrendChart, type SparklineTone } from "./charts"
import { categorySeries } from "./palette"
import * as styles from "./commandCenter.css"

const INVOICE_LIST_LIMIT = 7
const TOP_CUSTOMER_LIMIT = 5

const REFETCH_QUERIES = [
    "QuickBooksStatus",
    "QuickBooksCompanySnapshot",
    "QuickBooksInvoices",
    "QuickBooksCustomers",
    QUICK_BOOKS_SYNC_STATEMENTS_NAME,
]

const statusPillClass: Record<QuickBooksInvoiceStatus, string> = {
    PAID: styles.pillPaid,
    OPEN: styles.pillOpen,
    OVERDUE: styles.pillOverdue,
}

const agingFillClasses = [styles.agingFillCurrent, styles.agingFill30, styles.agingFill60, styles.agingFill90]

const agingMiniClasses = [styles.miniSegCurrent, styles.miniSeg30, styles.miniSeg60, styles.miniSeg90]

/** The command center is a single surface — no in-app navigation to offer the shell. */
const NO_NAV_SECTIONS: never[] = []

function OutlayBrandIcon(): React.ReactElement {
    return (
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
            <path
                d="M3 13.5 L7.5 9 L11 12 L17 5.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path d="M3 16.5 H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    )
}

/**
 * The quickbooks pack's home surface: the connection moment and the books it
 * unlocks, on one page. In the sandbox (QUICKBOOKS_MODE=local) connecting is
 * instant against a simulated sample company; on deploys with a bound Intuit
 * connection the same button starts the real OAuth consent flow. See
 * packs/quickbooks/PACK.md.
 *
 * Once connected the page is a single-screen finance command center over
 * the synced books: KPI cards with sparklines, thirteen months of income vs
 * expenses with a net-profit line, the expense mix, A/R aging, top
 * customers, and the latest invoices — every number derived from the same
 * QuickBooks reads so the story is consistent across cards, charts, and
 * tables.
 *
 * The whole QuickBooks domain is authenticated (a company's books are never
 * public), so the page renders a sign-in invitation while signed out and
 * runs no queries until there is a session — the pack declares AUTH for
 * exactly this reason.
 */
export default function QuickBooksSyncPage(): React.ReactElement {
    const toast = useToast()
    const navigate = useNavigate()
    const location = useLocation()
    const auth = useSnapshot(runtime.store.auth)
    const signedIn = auth.status === "signedIn"
    const statusQuery = useQuickBooksStatusQuery({ skip: !signedIn })
    const connected = statusQuery.data?.quickBooksStatus.connected === true
    const snapshotQuery = useQuickBooksCompanySnapshotQuery({ skip: !connected })
    const invoicesQuery = useQuickBooksInvoicesQuery({ skip: !connected })
    const customersQuery = useQuickBooksCustomersQuery({ skip: !connected })
    const statementsQuery = useQuickBooksSyncStatementsQuery({ skip: !connected })

    const [connectQuickBooks, connectState] = useConnectQuickBooksMutation()
    const [disconnectQuickBooks, disconnectState] = useDisconnectQuickBooksMutation()

    const oauth = useQuickBooksOAuth({
        enabled: signedIn,
        onConnected: (companyName) => {
            void statusQuery.refetch()
            toast.publish({
                title: "QuickBooks connected",
                description: companyName ? `Now showing the books for ${companyName}.` : undefined,
                tone: "success",
            })
        },
        onError: (message) =>
            toast.publish({ title: "Connecting failed", description: message, tone: "danger" }),
    })

    const connect = async (): Promise<void> => {
        try {
            if (oauth.isOAuthMode) {
                await oauth.startOAuth()
                return
            }
            const result = await connectQuickBooks({
                variables: { input: { idempotencyKey: crypto.randomUUID() } },
                refetchQueries: REFETCH_QUERIES,
            })
            const companyName = result.data?.connectQuickBooks.companyName
            toast.publish({
                title: "QuickBooks connected",
                description: companyName ? `Now showing the books for ${companyName}.` : undefined,
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
    const allInvoices = invoicesQuery.data?.quickBooksInvoices
    const allCustomers = customersQuery.data?.quickBooksCustomers

    const recentInvoices = useMemo(
        () =>
            [...(allInvoices ?? [])]
                .sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1))
                .slice(0, INVOICE_LIST_LIMIT),
        [allInvoices],
    )
    const agingBuckets = useMemo(() => buildAgingBuckets(allInvoices ?? []), [allInvoices])
    const topCustomers = useMemo(
        () => buildTopCustomers(allInvoices ?? [], allCustomers ?? [], TOP_CUSTOMER_LIMIT),
        [allInvoices, allCustomers],
    )

    const profitAndLoss = statementsQuery.data?.quickBooksProfitAndLoss
    const balanceSheet = statementsQuery.data?.quickBooksBalanceSheet
    const monthly = useMemo(() => buildMonthlySeries(profitAndLoss ?? []), [profitAndLoss])
    const cashSeries = useMemo(() => buildCashSeries(balanceSheet ?? []), [balanceSheet])
    const latestPeriod = profitAndLoss?.[profitAndLoss.length - 1]
    const previousPeriod = profitAndLoss?.[profitAndLoss.length - 2]
    const expenseMix = useMemo(() => buildExpenseMix(latestPeriod), [latestPeriod])

    const loading =
        auth.status === "loading" ||
        statusQuery.loading ||
        (connected &&
            (snapshotQuery.loading ||
                invoicesQuery.loading ||
                customersQuery.loading ||
                statementsQuery.loading))
    const error =
        statusQuery.error ??
        snapshotQuery.error ??
        invoicesQuery.error ??
        customersQuery.error ??
        statementsQuery.error

    const isSampleCompany = statusQuery.data?.quickBooksStatus.mode === "LOCAL"
    const compareLabel = previousPeriod ? `vs ${monthShortLabel(previousPeriod.month)}` : ""
    const latestLabel = latestPeriod ? monthShortLabel(latestPeriod.month) : ""

    const unpaidCount = snapshot ? snapshot.openInvoiceCount + snapshot.overdueInvoiceCount : 0
    const agingTotal = agingBuckets.reduce((sum, bucket) => sum + bucket.amountMinorUnits, 0)
    const agingMax = Math.max(...agingBuckets.map((bucket) => bucket.amountMinorUnits), 1)

    return (
        <AppShell
            title="QuickBooks Sync"
            brandIcon={<OutlayBrandIcon />}
            sections={NO_NAV_SECTIONS}
            onItemSelect={() => undefined}
        >
            <main className={styles.page}>
                <div className={styles.toolbar}>
                    <div className={styles.topbarActions}>
                        {connected ? (
                            <>
                                {isSampleCompany && <span className={styles.modeTag}>Sample company</span>}
                                <span className={styles.syncPill}>
                                    <span className={styles.syncDot} aria-hidden="true" />
                                    Live · Synced with QuickBooks
                                </span>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => void disconnect()}
                                    disabled={disconnectState.loading}
                                >
                                    {disconnectState.loading ? "Disconnecting…" : "Disconnect"}
                                </Button>
                            </>
                        ) : (
                            <span className={styles.tagline}>Your books, on one page.</span>
                        )}
                    </div>
                </div>

                <div className={connected ? styles.stage : `${styles.stage} ${styles.stageCentered}`}>
                    {error ? (
                        <section className={styles.errorCard}>
                            <p className={styles.errorText}>{error.message}</p>
                            <div className={styles.footerActions}>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => void statusQuery.refetch()}
                                >
                                    Retry
                                </Button>
                            </div>
                        </section>
                    ) : loading ? (
                        <div className={styles.loadingWrap}>
                            <Spinner size="lg" />
                        </div>
                    ) : !signedIn ? (
                        <ConnectHero
                            title="Sign in to open the books."
                            body="A company's books are never public, so seeing them here needs an account. Sign in and you can link a QuickBooks company on this page — the whole financial picture, one screen."
                            action={
                                <button
                                    type="button"
                                    className={styles.ctaButton}
                                    onClick={() =>
                                        navigate(
                                            authRouteWithReturnTo(
                                                routes.login.path,
                                                `${location.pathname}${location.search}${location.hash}`,
                                            ),
                                        )
                                    }
                                >
                                    Sign in
                                </button>
                            }
                        />
                    ) : !connected ? (
                        <ConnectHero
                            title="One connection. Your whole financial picture."
                            body={
                                oauth.isOAuthMode
                                    ? "Link your QuickBooks company and this page becomes a live command center for the books — cash, profit, receivables, customers. You'll approve read-only access on Intuit's consent screen and land right back here."
                                    : "Link your QuickBooks company and this page becomes a live command center for the books — cash, profit, receivables, customers. Read-only, always current."
                            }
                            note={
                                oauth.isOAuthMode
                                    ? undefined
                                    : "No QuickBooks account needed to try this: connecting here brings up a realistic sample company instantly."
                            }
                            action={
                                <button
                                    type="button"
                                    className={styles.ctaButton}
                                    onClick={() => void connect()}
                                    disabled={connectState.loading || oauth.isCompleting}
                                >
                                    {oauth.isCompleting
                                        ? "Finishing connection…"
                                        : connectState.loading
                                          ? "Connecting…"
                                          : "Connect QuickBooks"}
                                </button>
                            }
                        />
                    ) : (
                        <>
                            <section className={styles.heroRow}>
                                <div>
                                    <h1 className={styles.companyName}>
                                        {snapshot?.companyName ?? "Your company"}
                                    </h1>
                                    <p className={styles.companyMeta}>
                                        Thirteen months of statements, {snapshot?.customerCount ?? 0}{" "}
                                        customers, and every invoice — live from QuickBooks on one page.
                                    </p>
                                </div>
                            </section>

                            <div className={styles.kpiGrid}>
                                {cashSeries.length >= 2 && (
                                    <KpiCard
                                        stagger={0}
                                        label="Cash on hand"
                                        value={formatMoneyWhole(cashSeries[cashSeries.length - 1])}
                                        inflow
                                        trend={trendBetween(
                                            cashSeries[cashSeries.length - 2],
                                            cashSeries[cashSeries.length - 1],
                                        )}
                                        compareLabel={compareLabel}
                                        foot="Month-end bank balance"
                                        spark={<Sparkline values={cashSeries} tone="inflow" />}
                                    />
                                )}
                                {latestPeriod && previousPeriod && (
                                    <KpiCard
                                        stagger={1}
                                        label={`Revenue · ${latestLabel}`}
                                        value={formatMoneyWhole(latestPeriod.totalIncomeMinorUnits)}
                                        trend={trendBetween(
                                            previousPeriod.totalIncomeMinorUnits,
                                            latestPeriod.totalIncomeMinorUnits,
                                        )}
                                        compareLabel={compareLabel}
                                        foot={`${monthShortLabel(previousPeriod.month)} booked ${formatMoneyWhole(previousPeriod.totalIncomeMinorUnits)}`}
                                        spark={
                                            <Sparkline
                                                values={monthly.map((point) => point.incomeMinorUnits)}
                                                tone="inflow"
                                            />
                                        }
                                    />
                                )}
                                {latestPeriod && previousPeriod && (
                                    <KpiCard
                                        stagger={2}
                                        label={`Net profit · ${latestLabel}`}
                                        value={formatMoneyWhole(latestPeriod.netIncomeMinorUnits)}
                                        inflow
                                        trend={trendBetween(
                                            previousPeriod.netIncomeMinorUnits,
                                            latestPeriod.netIncomeMinorUnits,
                                        )}
                                        compareLabel={compareLabel}
                                        foot={
                                            latestPeriod.totalIncomeMinorUnits > 0
                                                ? `${Math.round((latestPeriod.netIncomeMinorUnits / latestPeriod.totalIncomeMinorUnits) * 100)}% margin`
                                                : "—"
                                        }
                                        spark={
                                            <Sparkline
                                                values={monthly.map((point) => point.netMinorUnits)}
                                                tone="inflow"
                                            />
                                        }
                                    />
                                )}
                                {snapshot && (
                                    <article className={`${styles.kpiCard} ${styles.stagger[3]}`}>
                                        <div className={styles.kpiTop}>
                                            <span className={styles.kpiLabel}>Outstanding A/R</span>
                                            <span className={styles.kpiDeltaFlat}>{unpaidCount} open</span>
                                        </div>
                                        <div className={styles.kpiValue}>
                                            {formatMoneyWhole(snapshot.outstandingMinorUnits)}
                                        </div>
                                        <div className={styles.kpiBottom}>
                                            <span className={styles.kpiFoot}>
                                                <span className={styles.kpiFootWarn}>
                                                    {formatMoneyWhole(snapshot.overdueMinorUnits)} overdue
                                                </span>{" "}
                                                · {snapshot.overdueInvoiceCount} invoices past due
                                            </span>
                                        </div>
                                        <div className={styles.agingMiniTrack} aria-hidden="true">
                                            {agingBuckets.map(
                                                (bucket, index) =>
                                                    bucket.amountMinorUnits > 0 && (
                                                        <span
                                                            key={bucket.key}
                                                            className={agingMiniClasses[index]}
                                                            style={{
                                                                width: `${(bucket.amountMinorUnits / Math.max(agingTotal, 1)) * 100}%`,
                                                            }}
                                                        />
                                                    ),
                                            )}
                                        </div>
                                    </article>
                                )}
                            </div>

                            <div className={styles.mainGrid}>
                                {monthly.length > 0 && (
                                    <section
                                        className={`${styles.card} ${styles.spanHero} ${styles.stagger[4]}`}
                                    >
                                        <div className={styles.cardHead}>
                                            <h2 className={styles.cardTitle}>
                                                Cash flow · trailing 13 months
                                            </h2>
                                            <div className={styles.legend}>
                                                <span className={styles.legendItem}>
                                                    <span className={styles.swatchIncome} /> Income
                                                </span>
                                                <span className={styles.legendItem}>
                                                    <span className={styles.swatchExpense} /> Expenses
                                                </span>
                                                <span className={styles.legendItem}>
                                                    <span className={styles.swatchNet} /> Net profit
                                                </span>
                                            </div>
                                        </div>
                                        <TrendChart points={monthly} />
                                    </section>
                                )}

                                {expenseMix.length > 0 && latestPeriod && (
                                    <section
                                        className={`${styles.card} ${styles.spanSide} ${styles.stagger[5]}`}
                                    >
                                        <div className={styles.cardHead}>
                                            <h2 className={styles.cardTitle}>Where the money goes</h2>
                                            <span className={styles.cardMeta}>{latestLabel}</span>
                                        </div>
                                        <div className={styles.donutWrap}>
                                            <DonutChart
                                                segments={expenseMix.map((slice) => ({
                                                    label: slice.category,
                                                    value: slice.amountMinorUnits,
                                                }))}
                                                centerValue={formatMoneyCompact(
                                                    latestPeriod.totalExpensesMinorUnits,
                                                )}
                                                centerLabel={`${latestLabel} operating spend`}
                                            />
                                        </div>
                                        <ul className={styles.donutLegend}>
                                            {expenseMix.map((slice, index) => (
                                                <li key={slice.category} className={styles.donutLegendRow}>
                                                    <span
                                                        className={styles.donutSwatch}
                                                        style={{
                                                            background:
                                                                categorySeries[index % categorySeries.length],
                                                        }}
                                                    />
                                                    <span className={styles.donutLegendLabel}>
                                                        {slice.category}
                                                    </span>
                                                    <span className={styles.donutLegendValue}>
                                                        {formatMoneyWhole(slice.amountMinorUnits)}
                                                    </span>
                                                    <span className={styles.donutLegendShare}>
                                                        {Math.round(slice.share * 100)}%
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                )}

                                <section
                                    className={`${styles.card} ${styles.cardColumn} ${styles.spanThird} ${styles.stagger[6]}`}
                                >
                                    <div className={styles.cardHead}>
                                        <h2 className={styles.cardTitle}>A/R aging</h2>
                                        <span className={styles.cardMeta}>{unpaidCount} unpaid invoices</span>
                                    </div>
                                    <div className={styles.agingList}>
                                        {agingBuckets.map((bucket, index) => (
                                            <div key={bucket.key} className={styles.agingRow}>
                                                <span className={styles.agingLabel}>{bucket.label}</span>
                                                <div className={styles.agingTrack}>
                                                    <div
                                                        className={agingFillClasses[index]}
                                                        style={{
                                                            width: `${Math.max((bucket.amountMinorUnits / agingMax) * 100, 1.5)}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className={styles.agingAmount}>
                                                    {formatMoneyWhole(bucket.amountMinorUnits)}
                                                </span>
                                                <span className={styles.agingCount}>
                                                    {bucket.invoiceCount === 1
                                                        ? "1 invoice"
                                                        : `${bucket.invoiceCount} invoices`}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className={styles.agingTotalRow}>
                                        <span>Total outstanding</span>
                                        <span className={styles.agingTotalValue}>
                                            {formatMoneyWhole(agingTotal)}
                                        </span>
                                    </div>
                                </section>

                                <section
                                    className={`${styles.card} ${styles.spanThird} ${styles.stagger[7]}`}
                                >
                                    <div className={styles.cardHead}>
                                        <h2 className={styles.cardTitle}>Top customers</h2>
                                        <span className={styles.cardMeta}>by billed</span>
                                    </div>
                                    {topCustomers.length > 0 ? (
                                        <ul className={styles.custList}>
                                            {topCustomers.map((customer) => (
                                                <li key={customer.id} className={styles.custRow}>
                                                    <div className={styles.custHead}>
                                                        <span className={styles.custName}>
                                                            {customer.name}
                                                        </span>
                                                        <span className={styles.custAmount}>
                                                            {formatMoneyWhole(customer.billedMinorUnits)}
                                                        </span>
                                                    </div>
                                                    <div className={styles.custShareTrack}>
                                                        <div
                                                            className={styles.custShareFill}
                                                            style={{ width: `${customer.share * 100}%` }}
                                                        />
                                                    </div>
                                                    <div className={styles.custMetaRow}>
                                                        <span>
                                                            {customer.invoiceCount === 1
                                                                ? "1 invoice"
                                                                : `${customer.invoiceCount} invoices`}
                                                            {customer.detail !== ""
                                                                ? ` · ${customer.detail}`
                                                                : ""}
                                                        </span>
                                                        <span>
                                                            {customer.openMinorUnits > 0
                                                                ? `${formatMoneyWhole(customer.openMinorUnits)} open`
                                                                : "Paid up"}
                                                        </span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className={styles.emptyNote}>
                                            Customers from QuickBooks show up here.
                                        </p>
                                    )}
                                </section>

                                <section
                                    className={`${styles.card} ${styles.spanThird} ${styles.stagger[8]}`}
                                >
                                    <div className={styles.cardHead}>
                                        <h2 className={styles.cardTitle}>Latest invoices</h2>
                                        <span className={styles.cardMeta}>
                                            {(allInvoices ?? []).length} synced
                                        </span>
                                    </div>
                                    {recentInvoices.length > 0 ? (
                                        <ul className={styles.invList}>
                                            {recentInvoices.map((invoice) => (
                                                <li key={invoice.id} className={styles.invRow}>
                                                    <div className={styles.invBody}>
                                                        <span className={styles.invName}>
                                                            {invoice.docNumber} · {invoice.customerName}
                                                        </span>
                                                        <span className={styles.invMeta}>
                                                            Issued {formatQuickBooksDate(invoice.issueDate)} ·
                                                            due {formatQuickBooksDate(invoice.dueDate)}
                                                        </span>
                                                    </div>
                                                    <span className={statusPillClass[invoice.status]}>
                                                        <span
                                                            className={styles.statusDot}
                                                            aria-hidden="true"
                                                        />
                                                        {invoiceStatusLabels[invoice.status]}
                                                    </span>
                                                    <span className={styles.invAmount}>
                                                        {formatMoneyWhole(invoice.totalMinorUnits)}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className={styles.emptyNote}>
                                            Invoices from QuickBooks show up here.
                                        </p>
                                    )}
                                </section>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </AppShell>
    )
}

//
// KPI card
//

interface KpiCardProps {
    stagger: number
    label: string
    value: string
    trend: Trend
    compareLabel: string
    foot: string
    spark: React.ReactNode
    inflow?: boolean
}

function KpiCard({
    stagger,
    label,
    value,
    trend,
    compareLabel,
    foot,
    spark,
    inflow = false,
}: KpiCardProps): React.ReactElement {
    const deltaClass =
        trend.direction === "up"
            ? styles.kpiDeltaUp
            : trend.direction === "down"
              ? styles.kpiDeltaDown
              : styles.kpiDeltaFlat
    const arrow = trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→"
    const percent =
        trend.deltaPercent === null
            ? "new"
            : `${Math.abs(trend.deltaPercent).toFixed(1).replace(/\.0$/, "")}%`
    return (
        <article className={`${styles.kpiCard} ${styles.stagger[stagger]}`}>
            <div className={styles.kpiTop}>
                <span className={styles.kpiLabel}>{label}</span>
                <span className={deltaClass}>
                    {arrow} {percent}
                    {compareLabel !== "" ? ` ${compareLabel}` : ""}
                </span>
            </div>
            <div className={inflow ? `${styles.kpiValue} ${styles.kpiValueMint}` : styles.kpiValue}>
                {value}
            </div>
            <div className={styles.kpiBottom}>
                <span className={styles.kpiFoot}>{foot}</span>
                <span className={styles.kpiSpark}>{spark}</span>
            </div>
        </article>
    )
}

//
// Connect / sign-in hero with a decorative dashboard preview. The preview
// numbers mirror the sample company the sandbox actually connects to
// (Bluebird Design Co.), so what you see is what connecting reveals.
//

const PREVIEW_CASH_SERIES = [3240, 3385, 3610, 3420, 3755, 4020, 4180, 4395, 4640, 4710, 5005, 5240, 5390]
const PREVIEW_INCOME_SERIES = [278, 305, 319, 305, 332, 359, 366, 367, 412, 365, 442, 429, 423]

interface ConnectHeroProps {
    title: string
    body: string
    action: React.ReactNode
    note?: string
}

function ConnectHero({ title, body, action, note }: ConnectHeroProps): React.ReactElement {
    const maxIncome = Math.max(...PREVIEW_INCOME_SERIES)
    return (
        <section className={styles.connectShell}>
            <div className={styles.connectCopy}>
                <span className={styles.connectKicker}>
                    <span className={styles.syncDot} aria-hidden="true" />
                    Live books · One page
                </span>
                <h1 className={styles.connectTitle}>{title}</h1>
                <p className={styles.connectBody}>{body}</p>
                <ul className={styles.checklist}>
                    <li className={styles.checkItem}>
                        <span className={styles.checkTick} aria-hidden="true">
                            ✓
                        </span>
                        Cash, revenue, and profit at a glance — with month-over-month deltas
                    </li>
                    <li className={styles.checkItem}>
                        <span className={styles.checkTick} aria-hidden="true">
                            ✓
                        </span>
                        Thirteen months of income vs expenses, charted
                    </li>
                    <li className={styles.checkItem}>
                        <span className={styles.checkTick} aria-hidden="true">
                            ✓
                        </span>
                        A/R aging, top customers, and the latest invoices — always current
                    </li>
                </ul>
                {note !== undefined && <p className={styles.sandboxNote}>{note}</p>}
                <div className={styles.connectActions}>{action}</div>
            </div>
            <div className={styles.previewPanel} aria-hidden="true">
                <div className={styles.previewGlow} />
                <div className={styles.previewCard}>
                    <div className={styles.previewHead}>
                        <span className={styles.previewCompany}>Bluebird Design Co.</span>
                        <span className={styles.syncPill}>
                            <span className={styles.syncDot} />
                            Live
                        </span>
                    </div>
                    <div className={styles.previewChips}>
                        <div className={styles.previewChip}>
                            <span className={styles.previewChipLabel}>Cash on hand</span>
                            <span className={styles.previewChipValue}>$53,900</span>
                            <span className={styles.previewChipDelta}>↑ 2.9% vs Jul</span>
                        </div>
                        <div className={styles.previewChip}>
                            <span className={styles.previewChipLabel}>Net profit</span>
                            <span className={styles.previewChipValue}>$11,945</span>
                            <span className={styles.previewChipDelta}>↑ 3.1% vs Jul</span>
                        </div>
                    </div>
                    <Sparkline
                        values={PREVIEW_CASH_SERIES}
                        tone={"inflow" satisfies SparklineTone}
                        width={340}
                        height={64}
                    />
                    <div className={styles.previewBars}>
                        {PREVIEW_INCOME_SERIES.map((value, index) => (
                            <span
                                key={index}
                                className={styles.previewBar}
                                style={{
                                    height: `${(value / maxIncome) * 100}%`,
                                    animationDelay: `${0.45 + index * 0.04}s`,
                                }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
