import { Badge, UiQueryView, type DataTableColumn, type DataTableSort, type UiQueryViewModel } from "@ui"
import React, { useMemo, useState } from "react"
import {
    useQuickBooksInvoicesQuery,
    useQuickBooksStatusQuery,
    type QuickBooksInvoiceStatus,
} from "../../generated/graphql/types"
import {
    formatQuickBooksDate,
    formatQuickBooksMoney,
    invoiceMatchesSearch,
    invoiceStatusLabels,
    invoiceStatusTones,
    type QuickBooksInvoiceNode,
} from "./accountingShared"
import { QuickBooksNotConnected } from "./QuickBooksNotConnected"

/**
 * The accounting pack's invoices table (manifest destination `/invoices`,
 * packs/accounting): the QueryView kit over the QuickBooks invoice list —
 * status facet filter (applied in the query variables), search, sortable
 * columns, money formatted per repo conventions. The dataset is one page
 * from QuickBooks (the simulated sample company in the sandbox), so search
 * and column sorting run client-side.
 */

export type InvoiceRow = QuickBooksInvoiceNode

const DEFAULT_SORT: DataTableSort = { columnId: "issueDate", direction: "desc" }

/** Comparable value per sortable column id. */
const SORT_VALUE_BY_COLUMN: Record<string, (row: InvoiceRow) => string | number> = {
    docNumber: (row) => row.docNumber,
    customerName: (row) => row.customerName,
    status: (row) => row.status,
    issueDate: (row) => row.issueDate,
    dueDate: (row) => row.dueDate,
    total: (row) => row.totalMinorUnits,
    balance: (row) => row.balanceMinorUnits,
}

export function sortInvoiceRows(rows: InvoiceRow[], sort: DataTableSort): InvoiceRow[] {
    const sortValue = SORT_VALUE_BY_COLUMN[sort.columnId]
    if (sortValue === undefined) {
        return rows
    }
    const direction = sort.direction === "asc" ? 1 : -1
    return [...rows].sort((a, b) => {
        const left = sortValue(a)
        const right = sortValue(b)
        if (left === right) {
            return 0
        }
        return (left < right ? -1 : 1) * direction
    })
}

function buildInvoicesColumns(): DataTableColumn<InvoiceRow>[] {
    return [
        { id: "docNumber", header: "Invoice", width: 110, sortable: true, render: (row) => row.docNumber },
        { id: "customerName", header: "Customer", sortable: true, render: (row) => row.customerName },
        {
            id: "status",
            header: "Status",
            width: 110,
            sortable: true,
            render: (row) => (
                <Badge tone={invoiceStatusTones[row.status]}>{invoiceStatusLabels[row.status]}</Badge>
            ),
        },
        {
            id: "issueDate",
            header: "Issued",
            width: 130,
            sortable: true,
            render: (row) => formatQuickBooksDate(row.issueDate),
        },
        {
            id: "dueDate",
            header: "Due",
            width: 130,
            sortable: true,
            render: (row) => formatQuickBooksDate(row.dueDate),
        },
        {
            id: "total",
            header: "Total",
            width: 120,
            sortable: true,
            render: (row) => formatQuickBooksMoney(row.totalMinorUnits),
        },
        {
            id: "balance",
            header: "Balance",
            width: 120,
            sortable: true,
            render: (row) => formatQuickBooksMoney(row.balanceMinorUnits),
        },
    ]
}

export default function InvoicesPage(): React.ReactElement {
    const [search, setSearch] = useState("")
    const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
    const [tableSort, setTableSort] = useState<DataTableSort>(DEFAULT_SORT)

    const statusQuery = useQuickBooksStatusQuery()
    const connected = statusQuery.data?.quickBooksStatus.connected === true

    const input = useMemo(
        () =>
            statusFilter === undefined
                ? null
                : { filters: { statuses: [statusFilter as QuickBooksInvoiceStatus] } },
        [statusFilter],
    )
    const invoicesQuery = useQuickBooksInvoicesQuery({ variables: { input }, skip: !connected })

    const rows = useMemo(() => {
        const invoices = invoicesQuery.data?.quickBooksInvoices ?? []
        return sortInvoiceRows(
            invoices.filter((invoice) => invoiceMatchesSearch(invoice, search)),
            tableSort,
        )
    }, [invoicesQuery.data, search, tableSort])

    if (!statusQuery.loading && !statusQuery.error && !connected) {
        return (
            <section>
                <QuickBooksNotConnected noun="invoices" />
            </section>
        )
    }

    const queryView: UiQueryViewModel<InvoiceRow> = {
        title: "Invoices",
        tableId: "quickbooks-invoices",
        columns: buildInvoicesColumns(),
        rows,
        loading: statusQuery.loading || invoicesQuery.loading,
        error: (statusQuery.error ?? invoicesQuery.error)?.message,
        onRetry: () => {
            void statusQuery.refetch()
            void invoicesQuery.refetch()
        },
        search,
        onSearchChange: setSearch,
        searchPlaceholder: "Search by invoice or customer...",
        hasNextPage: false,
        onLoadMore: () => undefined,
        emptyState: {
            title: "No invoices found",
            description: search ? "Try a different search." : "Invoices from QuickBooks show up here.",
        },
        filters: [
            {
                id: "status",
                label: "Status",
                value: statusFilter,
                onChange: setStatusFilter,
                allLabel: "All statuses",
                options: [
                    { id: "PAID", label: "Paid" },
                    { id: "OPEN", label: "Open" },
                    { id: "OVERDUE", label: "Overdue" },
                ],
            },
        ],
        tableSort,
        onTableSortChange: (sort) => {
            if (SORT_VALUE_BY_COLUMN[sort.columnId] !== undefined) {
                setTableSort(sort)
            }
        },
    }

    return <UiQueryView viewModel={queryView} />
}
