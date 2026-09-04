import { Badge, Button, Spinner, useToast } from "@ui"
import React from "react"
import { useNavigate } from "react-router-dom"
import {
    AccountingProvider,
    useConnectMyBooksMutation,
    useDisconnectMyBooksMutation,
    useMyBooksConnectionQuery,
    usePitchDeckDataQuery,
} from "../../generated/graphql/types"
import { useQuickBooksOAuth } from "../../Utils/useQuickBooksOAuth"
import { formatPitchMoney, pitchPaths, runwayLabel } from "./pitchShared"
import * as shared from "./pitchStyles.css"

const providerLabels: Record<string, string> = {
    QUICKBOOKS: "QuickBooks",
    XERO: "Xero",
}

/**
 * The member's books connection (manifest destination `/books`, packs/pitch):
 * connect QuickBooks or Xero (instant in the sandbox) so decks fill their
 * chart slides from live numbers; disconnect any time.
 */
export default function BooksPage(): React.ReactElement {
    const toast = useToast()
    const navigate = useNavigate()
    const connectionQuery = useMyBooksConnectionQuery()
    const dataQuery = usePitchDeckDataQuery()
    const [connect, connectState] = useConnectMyBooksMutation()
    const [disconnect, disconnectState] = useDisconnectMyBooksMutation()

    const oauth = useQuickBooksOAuth({
        onConnected: (companyName) => {
            void connectionQuery.refetch()
            void dataQuery.refetch()
            toast.publish({
                title: "QuickBooks connected",
                description: companyName ? `Now serving the books for ${companyName}.` : undefined,
                tone: "success",
            })
        },
        onError: (message) =>
            toast.publish({ title: "Connecting failed", description: message, tone: "danger" }),
    })

    const connectBooks = async (provider: AccountingProvider): Promise<void> => {
        if (oauth.isOAuthMode) {
            await oauth.startOAuth()
            return
        }
        try {
            const result = await connect({
                variables: { input: { idempotencyKey: crypto.randomUUID(), provider } },
                refetchQueries: ["MyBooksConnection", "PitchDeckData"],
            })
            const companyName = result.data?.connectMyBooks.companyName
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

    const disconnectBooks = async (): Promise<void> => {
        try {
            await disconnect({ refetchQueries: ["MyBooksConnection", "PitchDeckData"] })
            toast.publish({ title: "Books disconnected", tone: "success" })
        } catch (caught) {
            toast.publish({
                title: "Disconnecting failed",
                description: caught instanceof Error ? caught.message : undefined,
                tone: "danger",
            })
        }
    }

    if (connectionQuery.loading) {
        return (
            <section className={shared.page}>
                <div className={shared.loadingWrap}>
                    <Spinner size="lg" />
                </div>
            </section>
        )
    }
    if (connectionQuery.error) {
        return (
            <section className={shared.page}>
                <div className={shared.card}>
                    <p className={shared.errorText}>{connectionQuery.error.message}</p>
                </div>
            </section>
        )
    }

    const connection = connectionQuery.data?.myBooksConnection
    const data = dataQuery.data?.pitchDeckData ?? undefined

    return (
        <section className={shared.page}>
            <header className={shared.header}>
                <h1 className={shared.title}>My books</h1>
                <p className={shared.subtitle}>
                    {connection
                        ? `Connected to ${connection.companyName} via ${providerLabels[connection.provider] ?? connection.provider}.`
                        : "Connect your accounting software so decks fill their slides with live numbers."}
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
                            onClick={() => void connectBooks("QUICKBOOKS")}
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
                                onClick={() => void connectBooks("XERO")}
                                disabled={connectState.loading}
                            >
                                Connect Xero
                            </Button>
                        )}
                    </div>
                </div>
            ) : (
                <div className={shared.card}>
                    <div className={shared.cardHeader}>
                        <h2 className={shared.cardTitle}>What the decks see</h2>
                        <Badge tone="success">
                            {providerLabels[connection.provider] ?? connection.provider}
                        </Badge>
                    </div>
                    {data !== undefined ? (
                        <p className={shared.mutedText}>
                            Trailing 12-month revenue{" "}
                            {formatPitchMoney(data.trailingTwelveMonthRevenueMinorUnits, data.currency)}, net
                            margin {data.netMarginPercent}%, runway {runwayLabel(data.runwayMonths)}. Chart
                            slides refresh from these books on every view and export.
                        </p>
                    ) : (
                        <p className={shared.mutedText}>
                            Chart slides refresh from these books on every view and export.
                        </p>
                    )}
                    <div className={shared.row}>
                        <Button onClick={() => navigate(pitchPaths.decks)}>Open decks</Button>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => void disconnectBooks()}
                            disabled={disconnectState.loading}
                        >
                            {disconnectState.loading ? "Disconnecting..." : "Disconnect"}
                        </Button>
                    </div>
                </div>
            )}
        </section>
    )
}
