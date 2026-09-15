import {
    Badge,
    DataTable,
    formatCurrencyMinorUnits,
    formatPercent,
    StatCard,
    StatCardRow,
    Tabs,
    UiQueryView,
    UiQueryViewFormModal,
    type DataTableColumn,
    type SchemaFormData,
    type SchemaFormReferenceOption,
    type SchemaFormReferenceResolvers,
    type UiQueryViewModel,
} from "@ui"
import React, { useMemo, useRef, useState } from "react"
import {
    customerCreateFormPayload,
    customerFixtures,
    orderCreateFormPayload,
    orderFixtures,
    type OrderContainerFixture,
    type OrderFixture,
} from "./ordersFixtures"
import * as styles from "./OrdersExemplarPage.styles.css"

/**
 * The Orders exemplar (/theme/orders): the TimberEye-class dashboard surface
 * composed entirely from kernel pieces — toned StatCards, Tabs, per-tab
 * UiQueryView with expandable contract → container rows, shared money/percent
 * formatters, and an "Add order" backend-driven form exercising the full
 * forms kernel (nested arrays, entityRef + quick-create, ui:derived,
 * ui:summary). Fixture-driven: the composition recipe it demonstrates is
 * documented in docs/design-system.md; a real app swaps the fixtures for its
 * generated Apollo hooks (Page -> ViewModel -> Columns).
 */

const CURRENCY = "usd"

const containerColumns: DataTableColumn<OrderContainerFixture>[] = [
    { id: "reference", header: "Reference", render: (row) => <strong>{row.reference}</strong> },
    { id: "description", header: "Description", render: (row) => row.description },
    { id: "qty", header: "Qty", render: (row) => row.qty },
    {
        id: "sellTotal",
        header: "Sell total",
        render: (row) => formatCurrencyMinorUnits(row.sellTotalMinorUnits, CURRENCY),
    },
]

const orderColumns: DataTableColumn<OrderFixture>[] = [
    { id: "contract", header: "Contract #", render: (row) => <strong>{row.contractNumber}</strong> },
    { id: "customer", header: "Customer", render: (row) => row.customer },
    {
        id: "status",
        header: "Status",
        render: (row) => (
            <Badge tone={row.status === "COMPLETED" ? "success" : "accent"}>
                {row.status === "COMPLETED" ? "Completed" : "In progress"}
            </Badge>
        ),
    },
    { id: "incoterms", header: "Incoterms", render: (row) => row.incoterms },
    { id: "containers", header: "Containers", render: (row) => row.containers.length },
    {
        id: "value",
        header: "Value",
        render: (row) => formatCurrencyMinorUnits(row.valueMinorUnits, CURRENCY),
        sortValue: (row) => row.valueMinorUnits,
    },
    {
        id: "margin",
        header: "Margin",
        render: (row) => formatPercent((row.valueMinorUnits - row.costMinorUnits) / row.valueMinorUnits),
        sortValue: (row) => (row.valueMinorUnits - row.costMinorUnits) / row.valueMinorUnits,
    },
]

function matchesSearch(order: OrderFixture, search: string): boolean {
    const needle = search.trim().toLowerCase()
    if (needle === "") {
        return true
    }
    return (
        order.contractNumber.toLowerCase().includes(needle) || order.customer.toLowerCase().includes(needle)
    )
}

/** The expanded detail region: the contract's containers as a mini-table. */
function ContainersDetail({ order }: { order: OrderFixture }): React.ReactElement {
    return (
        <div className={styles.detail}>
            <h4 className={styles.detailTitle}>Containers on {order.contractNumber}</h4>
            <DataTable columns={containerColumns} rows={order.containers} style="minimalist" />
        </div>
    )
}

function OrdersTab({
    orders,
    search,
    onSearchChange,
    onAddOrder,
}: {
    orders: OrderFixture[]
    search: string
    onSearchChange: (value: string) => void
    onAddOrder: () => void
}): React.ReactElement {
    const viewModel: UiQueryViewModel<OrderFixture> = {
        title: "Orders",
        columns: orderColumns,
        rows: orders,
        loading: false,
        search,
        onSearchChange,
        searchPlaceholder: "Search contracts or customers...",
        primaryAction: { label: "Add order", onClick: onAddOrder },
        expandable: {
            renderExpanded: (order) => <ContainersDetail order={order} />,
            isExpandable: (order) => order.containers.length > 0,
        },
        hasNextPage: false,
        onLoadMore: () => {},
        emptyState: {
            title: "No orders found",
            description: "Adjust the search or add the first order.",
        },
    }
    return <UiQueryView viewModel={viewModel} />
}

export default function OrdersExemplarPage(): React.ReactElement {
    const [search, setSearch] = useState("")
    const [orders, setOrders] = useState(orderFixtures)
    const [orderFormOpen, setOrderFormOpen] = useState(false)
    const [customerFormOpen, setCustomerFormOpen] = useState(false)
    const [customers, setCustomers] = useState(customerFixtures)
    // The quick-create handshake: entityRef's create.run awaits this resolver,
    // which the nested customer modal settles on submit or cancel.
    const pendingCustomerRef = useRef<((option: SchemaFormReferenceOption | null) => void) | null>(null)

    const totals = useMemo(() => {
        const revenue = orders.reduce((sum, order) => sum + order.valueMinorUnits, 0)
        const cost = orders.reduce((sum, order) => sum + order.costMinorUnits, 0)
        return { revenue, cost, profit: revenue - cost }
    }, [orders])

    const filtered = orders.filter((order) => matchesSearch(order, search))
    const inProgress = filtered.filter((order) => order.status === "IN_PROGRESS")
    const completed = filtered.filter((order) => order.status === "COMPLETED")

    const referenceResolvers: SchemaFormReferenceResolvers = useMemo(
        () => ({
            customers: {
                search: async (query) =>
                    customers.filter((option) => option.label.toLowerCase().includes(query.toLowerCase())),
                resolve: async (value) => customers.find((option) => option.value === value) ?? null,
                create: {
                    label: "+ Add customer",
                    run: () =>
                        new Promise<SchemaFormReferenceOption | null>((resolve) => {
                            pendingCustomerRef.current = resolve
                            setCustomerFormOpen(true)
                        }),
                },
            },
        }),
        [customers],
    )

    const settleCustomerCreate = (option: SchemaFormReferenceOption | null): void => {
        pendingCustomerRef.current?.(option)
        pendingCustomerRef.current = null
        setCustomerFormOpen(false)
    }

    const submitOrder = (formData: SchemaFormData): void => {
        const containers = Array.isArray(formData.containers)
            ? (formData.containers as Array<Record<string, unknown>>)
            : []
        const valueMinorUnits = Math.round(
            containers.reduce((sum, container) => sum + (Number(container.lineTotal) || 0), 0) * 100,
        )
        setOrders((current) => [
            ...current,
            {
                id: crypto.randomUUID(),
                contractNumber: String(formData.contractNumber ?? ""),
                customer:
                    customers.find((option) => option.value === formData.customerId)?.label ??
                    "Unknown customer",
                status: "IN_PROGRESS",
                incoterms: formData.incoterms === "CIF" ? "CIF" : "FOB",
                valueMinorUnits,
                costMinorUnits: Math.round(valueMinorUnits * 0.88),
                containers: containers.map((container, index) => ({
                    id: crypto.randomUUID(),
                    reference: String(container.reference ?? `C${index + 1}`),
                    description: String(container.description ?? ""),
                    qty: Number(container.qty) || 0,
                    sellTotalMinorUnits: Math.round((Number(container.lineTotal) || 0) * 100),
                })),
            },
        ])
        setOrderFormOpen(false)
    }

    return (
        <div className={styles.page}>
            <header className={styles.intro}>
                <h1 className={styles.introTitle}>Orders exemplar</h1>
                <p className={styles.introSubtitle}>
                    The whole dashboard-and-form surface from kernel parts: toned stat cards, tabs, expandable
                    contract rows, and a backend-driven order form with live references, quick-create, derived
                    fields, and computed line economics. Composition recipe: docs/design-system.md; form
                    contract: docs/forms.md.
                </p>
            </header>

            <StatCardRow>
                <StatCard
                    label="Accrued revenue"
                    value={formatCurrencyMinorUnits(totals.revenue, CURRENCY)}
                    tone="danger"
                />
                <StatCard
                    label="Accrued costs"
                    value={formatCurrencyMinorUnits(totals.cost, CURRENCY)}
                    tone="info"
                />
                <StatCard
                    label="Accrued profit"
                    value={formatCurrencyMinorUnits(totals.profit, CURRENCY)}
                    hint={`${formatPercent(totals.profit / Math.max(totals.revenue, 1))} margin`}
                    tone="success"
                />
                <StatCard label="Open contracts" value={String(inProgress.length)} tone="accent" />
            </StatCardRow>

            <Tabs
                aria-label="Order status"
                items={[
                    {
                        id: "in-progress",
                        label: `In progress (${inProgress.length})`,
                        content: (
                            <OrdersTab
                                orders={inProgress}
                                search={search}
                                onSearchChange={setSearch}
                                onAddOrder={() => setOrderFormOpen(true)}
                            />
                        ),
                    },
                    {
                        id: "completed",
                        label: `Completed (${completed.length})`,
                        content: (
                            <OrdersTab
                                orders={completed}
                                search={search}
                                onSearchChange={setSearch}
                                onAddOrder={() => setOrderFormOpen(true)}
                            />
                        ),
                    },
                    {
                        id: "all",
                        label: `All (${filtered.length})`,
                        content: (
                            <OrdersTab
                                orders={filtered}
                                search={search}
                                onSearchChange={setSearch}
                                onAddOrder={() => setOrderFormOpen(true)}
                            />
                        ),
                    },
                ]}
            />

            <UiQueryViewFormModal
                open={orderFormOpen}
                title="Add order"
                schemaForm={orderCreateFormPayload}
                submitLabel="Create order"
                width="wide"
                referenceResolvers={referenceResolvers}
                onSubmit={submitOrder}
                onClose={() => setOrderFormOpen(false)}
            />

            <UiQueryViewFormModal
                open={customerFormOpen}
                title="Add customer"
                schemaForm={customerCreateFormPayload}
                submitLabel="Create customer"
                onSubmit={(formData) => {
                    const option: SchemaFormReferenceOption = {
                        value: `cus_${Date.now()}`,
                        label: String(formData.name ?? "New customer"),
                        description:
                            typeof formData.city === "string" && formData.city !== ""
                                ? formData.city
                                : undefined,
                    }
                    setCustomers((current) => [...current, option])
                    settleCustomerCreate(option)
                }}
                onClose={() => settleCustomerCreate(null)}
            />
        </div>
    )
}
