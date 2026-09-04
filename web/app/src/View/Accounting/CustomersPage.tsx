import { UiQueryView, type DataTableColumn, type DataTableSort, type UiQueryViewModel } from "@ui"
import React, { useMemo, useState } from "react"
import {
    useQuickBooksCustomersQuery,
    useQuickBooksStatusQuery,
    type QuickBooksCustomersQuery,
} from "../../generated/graphql/types"
import { formatQuickBooksDate, formatQuickBooksMoney } from "./accountingShared"
import { QuickBooksNotConnected } from "./QuickBooksNotConnected"

/**
 * The accounting pack's customers table (manifest destination `/customers`,
 * packs/accounting): the QueryView kit over the QuickBooks customer list.
 * One page from QuickBooks (the simulated sample company in the sandbox),
 * so search and column sorting run client-side.
 */

export type CustomerRow = QuickBooksCustomersQuery["quickBooksCustomers"][number]

const DEFAULT_SORT: DataTableSort = { columnId: "displayName", direction: "asc" }

const SORT_VALUE_BY_COLUMN: Record<string, (row: CustomerRow) => string | number> = {
    displayName: (row) => row.displayName.toLowerCase(),
    customerSince: (row) => row.customerSince,
    openBalance: (row) => row.openBalanceMinorUnits,
}

export function customerMatchesSearch(customer: CustomerRow, search: string): boolean {
    const needle = search.trim().toLowerCase()
    if (needle === "") {
        return true
    }
    return (
        customer.displayName.toLowerCase().includes(needle) ||
        (customer.companyName ?? "").toLowerCase().includes(needle) ||
        customer.email.toLowerCase().includes(needle)
    )
}

export function sortCustomerRows(rows: CustomerRow[], sort: DataTableSort): CustomerRow[] {
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

function buildCustomersColumns(): DataTableColumn<CustomerRow>[] {
    return [
        { id: "displayName", header: "Name", sortable: true, render: (row) => row.displayName },
        { id: "companyName", header: "Company", render: (row) => row.companyName ?? "—" },
        { id: "email", header: "Email", render: (row) => row.email },
        {
            id: "location",
            header: "Location",
            width: 150,
            render: (row) => `${row.city}, ${row.state}`,
        },
        {
            id: "customerSince",
            header: "Since",
            width: 130,
            sortable: true,
            render: (row) => formatQuickBooksDate(row.customerSince),
        },
        {
            id: "openBalance",
            header: "Open balance",
            width: 130,
            sortable: true,
            render: (row) => formatQuickBooksMoney(row.openBalanceMinorUnits),
        },
    ]
}

export default function CustomersPage(): React.ReactElement {
    const [search, setSearch] = useState("")
    const [tableSort, setTableSort] = useState<DataTableSort>(DEFAULT_SORT)

    const statusQuery = useQuickBooksStatusQuery()
    const connected = statusQuery.data?.quickBooksStatus.connected === true
    const customersQuery = useQuickBooksCustomersQuery({ skip: !connected })

    const rows = useMemo(() => {
        const customers = customersQuery.data?.quickBooksCustomers ?? []
        return sortCustomerRows(
            customers.filter((customer) => customerMatchesSearch(customer, search)),
            tableSort,
        )
    }, [customersQuery.data, search, tableSort])

    if (!statusQuery.loading && !statusQuery.error && !connected) {
        return (
            <section>
                <QuickBooksNotConnected noun="customers" />
            </section>
        )
    }

    const queryView: UiQueryViewModel<CustomerRow> = {
        title: "Customers",
        tableId: "quickbooks-customers",
        columns: buildCustomersColumns(),
        rows,
        loading: statusQuery.loading || customersQuery.loading,
        error: (statusQuery.error ?? customersQuery.error)?.message,
        onRetry: () => {
            void statusQuery.refetch()
            void customersQuery.refetch()
        },
        search,
        onSearchChange: setSearch,
        searchPlaceholder: "Search by name, company, or email...",
        hasNextPage: false,
        onLoadMore: () => undefined,
        emptyState: {
            title: "No customers found",
            description: search ? "Try a different search." : "Customers from QuickBooks show up here.",
        },
        tableSort,
        onTableSortChange: (sort) => {
            if (SORT_VALUE_BY_COLUMN[sort.columnId] !== undefined) {
                setTableSort(sort)
            }
        },
    }

    return <UiQueryView viewModel={queryView} />
}
