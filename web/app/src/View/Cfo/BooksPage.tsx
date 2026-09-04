import { Badge, Button, Spinner, StatCard, StatCardRow, useToast } from "@ui"
import React from "react"
import { useNavigate } from "react-router-dom"
import {
    AccountingProvider,
    useCfoClientStatementsQuery,
    useCfoConnectMyBooksMutation,
    useCfoDisconnectMyBooksMutation,
    useCfoMyMembershipQuery,
    useCurrentUserQuery,
} from "../../generated/graphql/types"
import { useQuickBooksOAuth } from "../../Utils/useQuickBooksOAuth"
import { cfoPaths, formatCfoMoney, providerLabels } from "./cfoShared"
import * as shared from "./cfoStyles.css"

/**
 * A member's own books (manifest destination `/books`, packs/cfo): connect
 * QuickBooks or Xero (instant in the sandbox — each member gets their own
 * deterministic sample company), see the headline numbers, and know the
 * advisor sees the same. Disconnecting is one click.
 */
export default function BooksPage(): React.ReactElement {
    const toast = useToast()
    const navigate = useNavigate()
    const membershipQuery = useCfoMyMembershipQuery()
    const currentUserQuery = useCurrentUserQuery()
    const userId = currentUserQuery.data?.currentUser.id
    const role = membershipQuery.data?.cfoMyMembership.role

    const booksQuery = useCfoClientStatementsQuery({
        skip: userId === undefined,
        variables: { clientUserId: userId ?? "" },
    })
    const [connectMyBooks, connectState] = useCfoConnectMyBooksMutation()
    const [disconnectMyBooks, disconnectState] = useCfoDisconnectMyBooksMutation()

    const oauth = useQuickBooksOAuth({
        onConnected: (companyName) => {
            void booksQuery.refetch()
            void membershipQuery.refetch()
            toast.publish({
                title: "QuickBooks connected",
                description: companyName ? `Now serving the books for ${companyName}.` : undefined,
                tone: "success",
            })
        },
        onError: (message) =>
            toast.publish({ title: "Connecting failed", description: message, tone: "danger" }),
    })

    const connect = async (provider: AccountingProvider): Promise<void> => {
        if (oauth.isOAuthMode) {
            await oauth.startOAuth()
            return
        }
        try {
            const result = await connectMyBooks({
                variables: { input: { idempotencyKey: crypto.randomUUID(), provider } },
                refetchQueries: ["CfoClientStatements", "CfoMyMembership"],
            })
            const companyName = result.data?.cfoConnectMyBooks.companyName
            toast.publish({
                title: `${providerLabels[provider]} connected`,
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
            await disconnectMyBooks({ refetchQueries: ["CfoClientStatements"] })
            toast.publish({ title: "Books disconnected", tone: "success" })
        } catch (caught) {
            toast.publish({
                title: "Disconnecting failed",
                description: caught instanceof Error ? caught.message : undefined,
                tone: "danger",
            })
        }
    }

    if (membershipQuery.loading || currentUserQuery.loading || booksQuery.loading) {
        return (
            <section className={shared.page}>
                <div className={shared.loadingWrap}>
                    <Spinner size="lg" />
                </div>
            </section>
        )
    }

    const error = membershipQuery.error ?? booksQuery.error
    if (error) {
        return (
            <section className={shared.page}>
                <div className={shared.card}>
                    <p className={shared.errorText}>{error.message}</p>
                </div>
            </section>
        )
    }

    const books = booksQuery.data?.cfoClient
    const connection = books?.connection
    const snapshot = books?.snapshot

    return (
        <section className={shared.page}>
            <header className={shared.header}>
                <h1 className={shared.title}>My books</h1>
                <p className={shared.subtitle}>
                    {connection
                        ? `Connected to ${connection.companyName} via ${providerLabels[connection.provider] ?? connection.provider}.`
                        : "Connect your accounting software; your advisor gets live visibility the moment you do."}
                </p>
            </header>

            {!connection ? (
                <div className={shared.card}>
                    <h2 className={shared.cardTitle}>Connect your accounting software</h2>
                    <p className={shared.mutedText}>
                        {oauth.isOAuthMode
                            ? "You'll approve read-only access on Intuit's consent screen and land right back here."
                            : "One click links your company file — read-only, nothing in your books ever changes. In the sandbox this connects instantly to a realistic sample company."}
                    </p>
                    <div className={shared.row}>
                        <Button
                            onClick={() => void connect("QUICKBOOKS")}
                            disabled={connectState.loading || oauth.isCompleting}
                        >
                            {oauth.isCompleting
                                ? "Finishing connection..."
                                : connectState.loading
                                  ? "Connecting..."
                                  : "Connect QuickBooks"}
                        </Button>
                        {oauth.isOAuthMode ? null : (
                            <Button
                                variant="secondary"
                                onClick={() => void connect("XERO")}
                                disabled={connectState.loading}
                            >
                                Connect Xero
                            </Button>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    {snapshot ? (
                        <StatCardRow>
                            <StatCard
                                label="Revenue"
                                value={formatCfoMoney(snapshot.revenueMinorUnits)}
                                hint={`${snapshot.paidInvoiceCount} paid invoices`}
                            />
                            <StatCard
                                label="Outstanding"
                                value={formatCfoMoney(snapshot.outstandingMinorUnits)}
                                hint={`${snapshot.openInvoiceCount + snapshot.overdueInvoiceCount} unpaid invoices`}
                            />
                            <StatCard
                                label="Overdue"
                                value={formatCfoMoney(snapshot.overdueMinorUnits)}
                                hint={`${snapshot.overdueInvoiceCount} invoices past due`}
                            />
                            <StatCard
                                label="Customers"
                                value={`${snapshot.customerCount}`}
                                hint="Active in the books"
                            />
                        </StatCardRow>
                    ) : null}

                    <div className={shared.card}>
                        <div className={shared.cardHeader}>
                            <h2 className={shared.cardTitle}>Statements</h2>
                            <Badge tone="success">
                                {providerLabels[connection.provider] ?? connection.provider}
                            </Badge>
                        </div>
                        <p className={shared.mutedText}>
                            Thirteen trailing months of P&amp;L and balance sheet — the same view your advisor
                            sees{role === "ADVISOR" ? "" : ", kept current automatically"}.
                        </p>
                        <div className={shared.row}>
                            <Button onClick={() => navigate(cfoPaths.statements)}>Open statements</Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => void disconnect()}
                                disabled={disconnectState.loading}
                            >
                                {disconnectState.loading ? "Disconnecting..." : "Disconnect"}
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </section>
    )
}
