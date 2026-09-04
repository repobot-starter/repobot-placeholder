import { Button, ChartCard, EmptyState, Select, Spinner, useToast } from "@ui"
import React, { useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { deriveStorageEndpoint, resolveStorageUrl } from "@base/core"
import {
    QuickBooksStatementExportKind,
    useCfoClientStatementsQuery,
    useCfoClientsQuery,
    useCfoExportClientStatementsXlsxMutation,
    useCfoMyMembershipQuery,
    useCurrentUserQuery,
    useFileUrlLazyQuery,
} from "../../generated/graphql/types"
import {
    CfoBalancePeriod,
    CfoPnlPeriod,
    cfoPaths,
    formatCfoMoney,
    formatStatementMonth,
    providerLabels,
} from "./cfoShared"
import * as shared from "./cfoStyles.css"

/**
 * The statement drilldown (manifest destination `/statements`, packs/cfo):
 * thirteen trailing months of P&L and balance sheet for one member's books,
 * charted with ChartCard and tabled with month columns, with XLSX export
 * through the spreadsheet kernel. The advisor picks any client
 * (?client=<userId>, defaulting to the first connected one); a client sees
 * their own books.
 */

const storageEndpoint = (): string => deriveStorageEndpoint(import.meta.env.VITE_GRAPHQL_URL)

export default function StatementsPage(): React.ReactElement {
    const toast = useToast()
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const membershipQuery = useCfoMyMembershipQuery()
    const currentUserQuery = useCurrentUserQuery()
    const role = membershipQuery.data?.cfoMyMembership.role
    const isAdvisor = role === "ADVISOR"
    const clientsQuery = useCfoClientsQuery({ skip: !isAdvisor })

    const clients = useMemo(
        () => (clientsQuery.data?.cfoClients ?? []).filter((client) => client.connection != null),
        [clientsQuery.data],
    )
    const requestedClientId = searchParams.get("client") ?? undefined
    const selectedClientId = isAdvisor
        ? (requestedClientId ?? clients[0]?.membership.user.id)
        : currentUserQuery.data?.currentUser.id

    const statementsQuery = useCfoClientStatementsQuery({
        skip: selectedClientId === undefined,
        variables: { clientUserId: selectedClientId ?? "" },
    })
    const [exportXlsx, exportState] = useCfoExportClientStatementsXlsxMutation()
    const [fetchFileUrl] = useFileUrlLazyQuery()

    const download = async (statement: QuickBooksStatementExportKind): Promise<void> => {
        if (selectedClientId === undefined) {
            return
        }
        try {
            const result = await exportXlsx({
                variables: {
                    input: {
                        idempotencyKey: crypto.randomUUID(),
                        clientUserId: selectedClientId,
                        statement,
                    },
                },
            })
            const uploadId = result.data?.cfoExportClientStatementsXlsx.id
            if (uploadId === undefined) {
                throw new Error("The export did not return a file.")
            }
            const urlResult = await fetchFileUrl({
                variables: { uploadId },
                fetchPolicy: "network-only",
            })
            const url = urlResult.data?.fileUrl.url
            if (url === undefined) {
                throw new Error("The exported file has no download URL.")
            }
            window.open(resolveStorageUrl(storageEndpoint(), url), "_blank", "noopener")
            toast.publish({ title: "Workbook exported", tone: "success" })
        } catch (caught) {
            toast.publish({
                title: "Export failed",
                description: caught instanceof Error ? caught.message : undefined,
                tone: "danger",
            })
        }
    }

    const loading =
        membershipQuery.loading ||
        currentUserQuery.loading ||
        (isAdvisor && clientsQuery.loading) ||
        (selectedClientId !== undefined && statementsQuery.loading)
    const error = membershipQuery.error ?? clientsQuery.error ?? statementsQuery.error

    if (loading) {
        return (
            <section className={shared.page}>
                <div className={shared.loadingWrap}>
                    <Spinner size="lg" />
                </div>
            </section>
        )
    }

    if (error) {
        return (
            <section className={shared.page}>
                <div className={shared.card}>
                    <p className={shared.errorText}>{error.message}</p>
                </div>
            </section>
        )
    }

    const client = statementsQuery.data?.cfoClient
    const connected = client?.connection != null

    return (
        <section className={shared.page}>
            <header className={shared.header}>
                <h1 className={shared.title}>Statements</h1>
                <p className={shared.subtitle}>
                    {connected
                        ? `${client.connection?.companyName} · ${providerLabels[client.connection?.provider ?? ""] ?? ""} · thirteen trailing months`
                        : "Thirteen trailing months of P&L and balance sheet, once the books are connected."}
                </p>
            </header>

            {isAdvisor ? (
                clients.length > 0 ? (
                    <div className={shared.row}>
                        <Select
                            aria-label="Client"
                            value={selectedClientId ?? ""}
                            onValueChange={(value) => setSearchParams({ client: value })}
                            options={clients.map((row) => ({
                                value: row.membership.user.id,
                                label: `${row.connection?.companyName} — ${row.membership.user.displayName}`,
                            }))}
                        />
                    </div>
                ) : (
                    <div className={shared.card}>
                        <EmptyState
                            title="No connected clients yet"
                            description="Statements light up as soon as a client connects their books."
                        />
                        <div>
                            <Button onClick={() => navigate(cfoPaths.clients)}>Invite a client</Button>
                        </div>
                    </div>
                )
            ) : null}

            {!connected && !isAdvisor ? (
                <div className={shared.card}>
                    <EmptyState
                        title="Your books are not connected"
                        description="Connect QuickBooks or Xero and your statements appear here."
                    />
                    <div>
                        <Button onClick={() => navigate(cfoPaths.books)}>Connect my books</Button>
                    </div>
                </div>
            ) : null}

            {connected && client ? (
                <>
                    <div className={shared.row}>
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={exportState.loading}
                            onClick={() => void download("PROFIT_AND_LOSS")}
                        >
                            Download P&amp;L (xlsx)
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={exportState.loading}
                            onClick={() => void download("BALANCE_SHEET")}
                        >
                            Download balance sheet (xlsx)
                        </Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={exportState.loading}
                            onClick={() => void download("ALL")}
                        >
                            Download both
                        </Button>
                    </div>

                    <div className={shared.chartGrid}>
                        <ChartCard
                            kind="bar"
                            title="Income vs. expenses"
                            description="Monthly totals from the P&L"
                            valueFormatter={(value) => formatCfoMoney(Math.round(value))}
                            series={[
                                {
                                    id: "income",
                                    label: "Income",
                                    points: client.profitAndLoss.map((period) => ({
                                        x: formatStatementMonth(period.month),
                                        y: period.totalIncomeMinorUnits,
                                    })),
                                },
                                {
                                    id: "expenses",
                                    label: "Expenses",
                                    points: client.profitAndLoss.map((period) => ({
                                        x: formatStatementMonth(period.month),
                                        y: period.totalExpensesMinorUnits,
                                    })),
                                },
                            ]}
                        />
                        <ChartCard
                            kind="line"
                            title="Net income"
                            description="Income minus expenses, by month"
                            valueFormatter={(value) => formatCfoMoney(Math.round(value))}
                            series={[
                                {
                                    id: "net",
                                    label: "Net income",
                                    points: client.profitAndLoss.map((period) => ({
                                        x: formatStatementMonth(period.month),
                                        y: period.netIncomeMinorUnits,
                                    })),
                                },
                            ]}
                        />
                        <ChartCard
                            kind="area"
                            title="Balance sheet"
                            description="Assets against liabilities, month end"
                            valueFormatter={(value) => formatCfoMoney(Math.round(value))}
                            series={[
                                {
                                    id: "assets",
                                    label: "Total assets",
                                    points: client.balanceSheet.map((period) => ({
                                        x: formatStatementMonth(period.month),
                                        y: period.totalAssetsMinorUnits,
                                    })),
                                },
                                {
                                    id: "liabilities",
                                    label: "Total liabilities",
                                    points: client.balanceSheet.map((period) => ({
                                        x: formatStatementMonth(period.month),
                                        y: period.totalLiabilitiesMinorUnits,
                                    })),
                                },
                            ]}
                        />
                    </div>

                    <div className={shared.card}>
                        <h2 className={shared.cardTitle}>Profit &amp; loss</h2>
                        <ProfitAndLossTable periods={client.profitAndLoss} />
                    </div>

                    <div className={shared.card}>
                        <h2 className={shared.cardTitle}>Balance sheet</h2>
                        <BalanceSheetTable periods={client.balanceSheet} />
                    </div>
                </>
            ) : null}
        </section>
    )
}

function MonthHeadRow({ months }: { months: string[] }): React.ReactElement {
    return (
        <tr>
            <th className={shared.statementHeadCell}>Category</th>
            {months.map((month) => (
                <th key={month} className={shared.statementHeadCell}>
                    {formatStatementMonth(month)}
                </th>
            ))}
        </tr>
    )
}

function LineRow({ label, values }: { label: string; values: number[] }): React.ReactElement {
    return (
        <tr>
            <td className={shared.statementCell}>{label}</td>
            {values.map((value, index) => (
                <td key={index} className={shared.statementCell}>
                    {formatCfoMoney(value)}
                </td>
            ))}
        </tr>
    )
}

function SectionRow({ label, span }: { label: string; span: number }): React.ReactElement {
    return (
        <tr className={shared.statementSectionRow}>
            <td className={shared.statementCell} colSpan={span}>
                {label}
            </td>
        </tr>
    )
}

function TotalRow({ label, values }: { label: string; values: number[] }): React.ReactElement {
    return (
        <tr className={shared.statementTotalRow}>
            <td className={shared.statementCell}>{label}</td>
            {values.map((value, index) => (
                <td key={index} className={shared.statementCell}>
                    {formatCfoMoney(value)}
                </td>
            ))}
        </tr>
    )
}

function ProfitAndLossTable({ periods }: { periods: CfoPnlPeriod[] }): React.ReactElement {
    if (periods.length === 0) {
        return <EmptyState title="No data" description="Statements appear once the books connect." />
    }
    const months = periods.map((period) => period.month)
    const span = months.length + 1
    return (
        <div className={shared.tableWrap}>
            <table className={shared.statementTable}>
                <thead>
                    <MonthHeadRow months={months} />
                </thead>
                <tbody>
                    <SectionRow label="Income" span={span} />
                    {periods[0].incomeLines.map((line, lineIndex) => (
                        <LineRow
                            key={line.category}
                            label={line.category}
                            values={periods.map((period) => period.incomeLines[lineIndex].minorUnits)}
                        />
                    ))}
                    <TotalRow
                        label="Total income"
                        values={periods.map((period) => period.totalIncomeMinorUnits)}
                    />
                    <SectionRow label="Expenses" span={span} />
                    {periods[0].expenseLines.map((line, lineIndex) => (
                        <LineRow
                            key={line.category}
                            label={line.category}
                            values={periods.map((period) => period.expenseLines[lineIndex].minorUnits)}
                        />
                    ))}
                    <TotalRow
                        label="Total expenses"
                        values={periods.map((period) => period.totalExpensesMinorUnits)}
                    />
                    <TotalRow
                        label="Net income"
                        values={periods.map((period) => period.netIncomeMinorUnits)}
                    />
                </tbody>
            </table>
        </div>
    )
}

function BalanceSheetTable({ periods }: { periods: CfoBalancePeriod[] }): React.ReactElement {
    if (periods.length === 0) {
        return <EmptyState title="No data" description="Statements appear once the books connect." />
    }
    const months = periods.map((period) => period.month)
    const span = months.length + 1
    return (
        <div className={shared.tableWrap}>
            <table className={shared.statementTable}>
                <thead>
                    <MonthHeadRow months={months} />
                </thead>
                <tbody>
                    <SectionRow label="Assets" span={span} />
                    {periods[0].assetLines.map((line, lineIndex) => (
                        <LineRow
                            key={line.category}
                            label={line.category}
                            values={periods.map((period) => period.assetLines[lineIndex].minorUnits)}
                        />
                    ))}
                    <TotalRow
                        label="Total assets"
                        values={periods.map((period) => period.totalAssetsMinorUnits)}
                    />
                    <SectionRow label="Liabilities" span={span} />
                    {periods[0].liabilityLines.map((line, lineIndex) => (
                        <LineRow
                            key={line.category}
                            label={line.category}
                            values={periods.map((period) => period.liabilityLines[lineIndex].minorUnits)}
                        />
                    ))}
                    <TotalRow
                        label="Total liabilities"
                        values={periods.map((period) => period.totalLiabilitiesMinorUnits)}
                    />
                    <SectionRow label="Equity" span={span} />
                    {periods[0].equityLines.map((line, lineIndex) => (
                        <LineRow
                            key={line.category}
                            label={line.category}
                            values={periods.map((period) => period.equityLines[lineIndex].minorUnits)}
                        />
                    ))}
                    <TotalRow
                        label="Total equity"
                        values={periods.map((period) => period.totalEquityMinorUnits)}
                    />
                </tbody>
            </table>
        </div>
    )
}
