import { Badge, Button, EmptyState, Input, Label, Spinner, useToast } from "@ui"
import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
    useCfoClientsQuery,
    useCfoInviteClientMutation,
    useCfoInvitesQuery,
    useCfoMyMembershipQuery,
    useCfoRevokeInviteMutation,
} from "../../generated/graphql/types"
import { siteNameFromManifest } from "../../Seo/PageMeta"
import { cfoPaths, formatCfoMoney, providerLabels } from "./cfoShared"
import * as shared from "./cfoStyles.css"
import * as styles from "./ClientsPage.styles.css"

/**
 * The advisor's roster (manifest destination `/clients`, packs/cfo): every
 * client with the state of their connection, an invite-by-email form, and
 * the invite pipeline. Invites are accepted by email match — the client
 * signs up with the invited address and lands in the roster automatically.
 */
export default function ClientsPage(): React.ReactElement {
    const toast = useToast()
    const navigate = useNavigate()
    const membershipQuery = useCfoMyMembershipQuery()
    const role = membershipQuery.data?.cfoMyMembership.role
    const isAdvisor = role === "ADVISOR"
    const clientsQuery = useCfoClientsQuery({ skip: !isAdvisor })
    const invitesQuery = useCfoInvitesQuery({ skip: !isAdvisor })
    const [inviteClient, inviteState] = useCfoInviteClientMutation()
    const [revokeInvite] = useCfoRevokeInviteMutation()
    const [inviteEmail, setInviteEmail] = useState("")

    const invite = async (): Promise<void> => {
        const email = inviteEmail.trim()
        if (email === "") {
            return
        }
        try {
            await inviteClient({
                variables: {
                    input: {
                        idempotencyKey: crypto.randomUUID(),
                        email,
                        siteName: siteNameFromManifest() ?? "your CFO portal",
                        signInUrl: `${window.location.origin}/login`,
                    },
                },
                refetchQueries: ["CfoInvites"],
            })
            setInviteEmail("")
            toast.publish({
                title: "Invite sent",
                description: `${email} can now sign up and connect their books.`,
                tone: "success",
            })
        } catch (caught) {
            toast.publish({
                title: "Inviting failed",
                description: caught instanceof Error ? caught.message : undefined,
                tone: "danger",
            })
        }
    }

    const revoke = async (inviteId: string): Promise<void> => {
        try {
            await revokeInvite({
                variables: { input: { inviteId } },
                refetchQueries: ["CfoInvites"],
            })
            toast.publish({ title: "Invite revoked", tone: "success" })
        } catch (caught) {
            toast.publish({
                title: "Revoking failed",
                description: caught instanceof Error ? caught.message : undefined,
                tone: "danger",
            })
        }
    }

    if (membershipQuery.loading || (isAdvisor && (clientsQuery.loading || invitesQuery.loading))) {
        return (
            <section className={shared.page}>
                <div className={shared.loadingWrap}>
                    <Spinner size="lg" />
                </div>
            </section>
        )
    }

    if (!isAdvisor) {
        return (
            <section className={shared.page}>
                <header className={shared.header}>
                    <h1 className={shared.title}>Clients</h1>
                </header>
                <div className={shared.card}>
                    <EmptyState
                        title="This page is for your advisor"
                        description="The roster and invites live with the practice's advisor. Your own company lives under your books."
                    />
                    <div>
                        <Button onClick={() => navigate(cfoPaths.books)}>Go to my books</Button>
                    </div>
                </div>
            </section>
        )
    }

    const clients = clientsQuery.data?.cfoClients ?? []
    const invites = (invitesQuery.data?.cfoInvites ?? []).filter((row) => row.status === "PENDING")

    return (
        <section className={shared.page}>
            <header className={shared.header}>
                <h1 className={shared.title}>Clients</h1>
                <p className={shared.subtitle}>
                    Invite a client by email; they sign up with that address, connect their own books, and
                    appear here.
                </p>
            </header>

            <div className={shared.card}>
                <h2 className={shared.cardTitle}>Invite a client</h2>
                <div className={styles.inviteRow}>
                    <div className={styles.inviteField}>
                        <Label htmlFor="cfo-invite-email">Email</Label>
                        <Input
                            id="cfo-invite-email"
                            type="email"
                            placeholder="client@company.com"
                            value={inviteEmail}
                            onChange={(event) => setInviteEmail(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    void invite()
                                }
                            }}
                        />
                    </div>
                    <Button onClick={() => void invite()} disabled={inviteState.loading}>
                        {inviteState.loading ? "Sending..." : "Send invite"}
                    </Button>
                </div>
                {invites.length > 0 ? (
                    <ul className={styles.inviteList}>
                        {invites.map((row) => (
                            <li key={row.id} className={styles.inviteItem}>
                                <span className={styles.inviteEmail}>{row.email}</span>
                                <Badge tone="info">Pending</Badge>
                                <Button variant="ghost" size="sm" onClick={() => void revoke(row.id)}>
                                    Revoke
                                </Button>
                            </li>
                        ))}
                    </ul>
                ) : null}
            </div>

            <div className={shared.card}>
                <h2 className={shared.cardTitle}>Roster</h2>
                {clients.length === 0 ? (
                    <EmptyState
                        title="No clients yet"
                        description="Send the first invite above — accepted clients and their books land here."
                    />
                ) : (
                    <div className={shared.tableWrap}>
                        <table className={shared.statementTable}>
                            <thead>
                                <tr>
                                    <th className={shared.statementHeadCell}>Client</th>
                                    <th className={shared.statementHeadCell}>Company</th>
                                    <th className={shared.statementHeadCell}>Connection</th>
                                    <th className={shared.statementHeadCell}>Revenue</th>
                                    <th className={shared.statementHeadCell}>Overdue</th>
                                    <th className={shared.statementHeadCell}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {clients.map((client) => (
                                    <tr key={client.membership.id}>
                                        <td className={shared.statementCell}>
                                            <div className={styles.clientCell}>
                                                <span className={styles.clientName}>
                                                    {client.membership.user.displayName}
                                                </span>
                                                <span className={styles.clientEmail}>
                                                    {client.membership.user.email}
                                                </span>
                                            </div>
                                        </td>
                                        <td className={shared.statementCell}>
                                            {client.connection?.companyName ?? "—"}
                                        </td>
                                        <td className={shared.statementCell}>
                                            {client.connection ? (
                                                <Badge tone="success">
                                                    {providerLabels[client.connection.provider] ??
                                                        client.connection.provider}
                                                </Badge>
                                            ) : (
                                                <Badge tone="neutral">Not connected</Badge>
                                            )}
                                        </td>
                                        <td className={shared.statementCell}>
                                            {client.snapshot
                                                ? formatCfoMoney(client.snapshot.revenueMinorUnits)
                                                : "—"}
                                        </td>
                                        <td className={shared.statementCell}>
                                            {client.snapshot
                                                ? formatCfoMoney(client.snapshot.overdueMinorUnits)
                                                : "—"}
                                        </td>
                                        <td className={shared.statementCell}>
                                            {client.connection ? (
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() =>
                                                        navigate(
                                                            `${cfoPaths.statements}?client=${client.membership.user.id}`,
                                                        )
                                                    }
                                                >
                                                    Statements
                                                </Button>
                                            ) : null}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    )
}
