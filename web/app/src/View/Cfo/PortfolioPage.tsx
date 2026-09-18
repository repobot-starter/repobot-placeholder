import { Badge, Button, EmptyState, Spinner, StatCard, StatCardRow } from "@ui"
import React from "react"
import { useNavigate } from "react-router-dom"
import { useCfoClientsQuery, useCfoMyMembershipQuery } from "../../generated/graphql/types"
import { cfoPaths, formatCfoMoney, latestNetIncome, providerLabels } from "./cfoShared"
import * as shared from "./cfoStyles.css"
import * as styles from "./PortfolioPage.styles.css"

/**
 * The CFO pack's signed-in home (manifest destination `/portfolio`,
 * packs/cfo). The advisor gets the cross-client view: portfolio health tiles
 * over every connected client, and a card per client linking into the
 * statement drilldown. A client landing here is pointed at their own books.
 */
export default function PortfolioPage(): React.ReactElement {
    const navigate = useNavigate()
    const membershipQuery = useCfoMyMembershipQuery()
    const role = membershipQuery.data?.cfoMyMembership.role
    const clientsQuery = useCfoClientsQuery({ skip: role !== "ADVISOR" })

    if (membershipQuery.loading || (role === "ADVISOR" && clientsQuery.loading)) {
        return (
            <section className={shared.page}>
                <div className={shared.loadingWrap}>
                    <Spinner size="lg" />
                </div>
            </section>
        )
    }

    const error = membershipQuery.error ?? clientsQuery.error
    if (error) {
        return (
            <section className={shared.page}>
                <div className={shared.card}>
                    <p className={shared.errorText}>{error.message}</p>
                    <div>
                        <Button variant="secondary" size="sm" onClick={() => void membershipQuery.refetch()}>
                            Retry
                        </Button>
                    </div>
                </div>
            </section>
        )
    }

    if (role === "CLIENT") {
        return (
            <section className={shared.page}>
                <header className={shared.header}>
                    <h1 className={shared.title}>Welcome</h1>
                    <p className={shared.subtitle}>
                        Your advisor keeps an eye on the practice from this page. Everything about your own
                        company lives under your books.
                    </p>
                </header>
                <div className={shared.card}>
                    <h2 className={shared.cardTitle}>Your books</h2>
                    <p className={shared.mutedText}>
                        Connect your accounting software once, and your advisor gets live visibility into your
                        numbers — statements included.
                    </p>
                    <div>
                        <Button onClick={() => navigate(cfoPaths.books)}>Go to my books</Button>
                    </div>
                </div>
            </section>
        )
    }

    const clients = clientsQuery.data?.cfoClients ?? []
    const connected = clients.filter((client) => client.connection != null)
    const portfolioRevenue = connected.reduce(
        (sum, client) => sum + (client.snapshot?.revenueMinorUnits ?? 0),
        0,
    )
    const portfolioOverdue = connected.reduce(
        (sum, client) => sum + (client.snapshot?.overdueMinorUnits ?? 0),
        0,
    )

    return (
        <section className={shared.page}>
            <header className={shared.header}>
                <h1 className={shared.title}>Portfolio</h1>
                <p className={shared.subtitle}>
                    Every client&apos;s books at a glance — live from their own accounting connections.
                </p>
            </header>

            <StatCardRow>
                <StatCard
                    label="Clients"
                    value={`${clients.length}`}
                    hint={`${connected.length} connected`}
                />
                <StatCard
                    label="Portfolio revenue"
                    value={formatCfoMoney(portfolioRevenue)}
                    hint="Collected, trailing books"
                />
                <StatCard
                    label="Overdue across clients"
                    value={formatCfoMoney(portfolioOverdue)}
                    hint="Balances past due"
                />
            </StatCardRow>

            {clients.length === 0 ? (
                <div className={shared.card}>
                    <EmptyState
                        title="No clients yet"
                        description="Invite your first client and their books show up here the moment they connect."
                    />
                    <div>
                        <Button onClick={() => navigate(cfoPaths.clients)}>Invite a client</Button>
                    </div>
                </div>
            ) : (
                <div className={styles.clientGrid}>
                    {clients.map((client) => {
                        const netIncome = latestNetIncome(client)
                        return (
                            <article key={client.membership.id} className={shared.card}>
                                <div className={shared.cardHeader}>
                                    <div>
                                        <h2 className={shared.cardTitle}>
                                            {client.connection?.companyName ??
                                                client.membership.user.displayName}
                                        </h2>
                                        <p className={styles.clientMeta}>
                                            {client.membership.user.displayName} ·{" "}
                                            {client.membership.user.email}
                                        </p>
                                    </div>
                                    {client.connection ? (
                                        <Badge tone="success">
                                            {providerLabels[client.connection.provider] ??
                                                client.connection.provider}
                                        </Badge>
                                    ) : (
                                        <Badge tone="neutral">Not connected</Badge>
                                    )}
                                </div>
                                {client.snapshot ? (
                                    <dl className={styles.clientStats}>
                                        <div className={styles.clientStat}>
                                            <dt className={styles.clientStatLabel}>Revenue</dt>
                                            <dd className={styles.clientStatValue}>
                                                {formatCfoMoney(client.snapshot.revenueMinorUnits)}
                                            </dd>
                                        </div>
                                        <div className={styles.clientStat}>
                                            <dt className={styles.clientStatLabel}>Overdue</dt>
                                            <dd className={styles.clientStatValue}>
                                                {formatCfoMoney(client.snapshot.overdueMinorUnits)}
                                            </dd>
                                        </div>
                                        <div className={styles.clientStat}>
                                            <dt className={styles.clientStatLabel}>Net income (mo.)</dt>
                                            <dd className={styles.clientStatValue}>
                                                {netIncome === undefined ? "—" : formatCfoMoney(netIncome)}
                                            </dd>
                                        </div>
                                    </dl>
                                ) : (
                                    <p className={shared.mutedText}>
                                        Waiting on their connection — nudge them to link QuickBooks or Xero
                                        from their books page.
                                    </p>
                                )}
                                {client.connection ? (
                                    <div>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() =>
                                                navigate(
                                                    `${cfoPaths.statements}?client=${client.membership.user.id}`,
                                                )
                                            }
                                        >
                                            Open statements
                                        </Button>
                                    </div>
                                ) : null}
                            </article>
                        )
                    })}
                </div>
            )}
        </section>
    )
}
