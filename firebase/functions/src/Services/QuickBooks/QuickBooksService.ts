import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"
import { desc, eq } from "drizzle-orm"
import {
    QuickBooksConnection,
    QuickBooksMode,
    quickBooksConnectionInsertSchema,
    quickBooksConnectionsTable,
} from "../../Data/QuickBooks/QuickBooksConnection.js"
import { Upload } from "../../Data/Storage/Upload.js"
import { quickBooksDb } from "../../Data/QuickBooksDatabase.js"
import { idempotentInsertAndGet } from "../../Data/Utils/index.js"
import { getIntuitWrapper } from "../../DependencyWrappers/IntuitWrapper/index.js"
import { IntuitCompanyAuth, IntuitCompanyInfo } from "../../DependencyWrappers/IntuitWrapper/IntuitWrapper.js"
import { validatedEnv } from "../../Utils/Env.js"
import { RpcError } from "../../Utils/RpcError.js"
import { XlsxSheet, xlsxService } from "../Xlsx/XlsxService.js"
import {
    SIMULATED_COMPANY_NAME,
    SIMULATED_REALM_ID,
    SimulatedBalanceSheetPeriod,
    SimulatedCompanySnapshot,
    SimulatedCustomer,
    SimulatedInvoice,
    SimulatedInvoiceStatus,
    SimulatedProfitAndLossPeriod,
    simulatedBalanceSheet,
    simulatedCompanySnapshot,
    simulatedCustomers,
    simulatedInvoices,
    simulatedProfileForRealm,
    simulatedProfitAndLoss,
    simulatedRealmIdForSeed,
} from "./QuickBooksSimulation.js"

/** How long an OAuth state stays valid between authorize and callback. */
const OAUTH_STATE_TTL_MS = 15 * 60 * 1000

/** Access tokens this close to expiry are refreshed before use. */
const TOKEN_REFRESH_MARGIN_MS = 5 * 60 * 1000

/**
 * The QuickBooks domain: the workspace's connection to a QuickBooks company
 * plus read access to its accounting data (company snapshot, customers,
 * invoices, financial statements).
 *
 * Two modes, chosen by QUICKBOOKS_MODE (mirroring AI_MODE / PAYMENTS_MODE):
 *
 * - `local` (the sandbox default): connecting is instant — it records the
 *   connection row and every read serves the deterministic sample company in
 *   QuickBooksSimulation.ts, so the whole surface works with no Intuit
 *   credentials and no cost.
 * - `intuit`: the real QuickBooks Online integration. Connecting goes through
 *   the Intuit OAuth flow (beginAuthorization -> Intuit consent ->
 *   completeAuthorization), tokens live on the connection row (refreshed
 *   transparently before reads), and every read hits the live company through
 *   the Intuit wrapper — behind the exact same service methods.
 *
 * Reads branch per connection row, not per environment: a LOCAL row keeps
 * serving the simulation even if the deploy later flips to intuit mode, so
 * existing demo data never silently morphs into someone's live books.
 */
class QuickBooksService {
    /** How new connections connect: LOCAL (instant, simulated) or INTUIT (OAuth). */
    mode(): QuickBooksMode {
        return validatedEnv().QUICKBOOKS_MODE === "intuit" ? "INTUIT" : "LOCAL"
    }

    /** The workspace's current connection, or undefined when not connected. */
    async getConnection(): Promise<QuickBooksConnection | undefined> {
        const [connection] = await quickBooksDb
            .select()
            .from(quickBooksConnectionsTable)
            .orderBy(desc(quickBooksConnectionsTable.rowCreatedAt))
            .limit(1)
        return connection
    }

    async getStatus(): Promise<QuickBooksStatus> {
        const connection = await this.getConnection()
        return { connected: connection !== undefined, connection, mode: this.mode() }
    }

    /**
     * Connects the workspace to QuickBooks. In local mode this is instant:
     * it records a LOCAL connection row bound to the simulated sample
     * company. Connecting while already connected returns the existing
     * connection. In intuit mode connecting goes through the OAuth flow
     * instead (beginAuthorization / completeAuthorization).
     */
    async connectQuickBooks(request: ConnectQuickBooksRequest): Promise<QuickBooksConnection> {
        this.requireLocalMode()
        const existing = await this.getConnection()
        if (existing !== undefined) {
            return existing
        }
        const newConnection = quickBooksConnectionInsertSchema.parse({
            realmId: SIMULATED_REALM_ID,
            companyName: SIMULATED_COMPANY_NAME,
            mode: "LOCAL",
            provider: request.provider ?? "QUICKBOOKS",
            connectedByUserId: request.connectedByUserId,
        })
        return await idempotentInsertAndGet(
            quickBooksDb,
            quickBooksConnectionsTable,
            newConnection,
            request.idempotencyKey,
        )
    }

    // --- The Intuit OAuth flow (QUICKBOOKS_MODE=intuit) --------------------

    /**
     * Starts the live connect: returns the Intuit consent-screen URL to send
     * the user to. The embedded state is HMAC-signed over the user and
     * redirect URI (15-minute expiry), so the callback can only complete for
     * the same signed-in user at the same return address.
     */
    beginAuthorization(request: BeginAuthorizationRequest): string {
        this.requireIntuitMode()
        const state = signOAuthState(
            { userId: request.userId, redirectUri: request.redirectUri },
            this.stateSecret(),
        )
        return getIntuitWrapper().buildAuthorizationUrl({ redirectUri: request.redirectUri, state })
    }

    /**
     * Finishes the live connect from Intuit's callback parameters: verifies
     * the state, exchanges the authorization code for tokens, reads the
     * company's name, and stores the connection with its tokens. A user
     * reconnecting (same or different company) updates their existing row.
     */
    async completeAuthorization(request: CompleteAuthorizationRequest): Promise<QuickBooksConnection> {
        this.requireIntuitMode()
        verifyOAuthState(request.state, this.stateSecret(), {
            userId: request.userId,
            redirectUri: request.redirectUri,
        })
        const wrapper = getIntuitWrapper()
        const tokens = await wrapper.exchangeAuthorizationCode({
            code: request.code,
            redirectUri: request.redirectUri,
        })
        const info = await wrapper.companyInfo({
            accessToken: tokens.accessToken,
            realmId: request.realmId,
        })

        const existing = await this.getConnectionForUser(request.userId)
        if (existing !== undefined) {
            const [updated] = await quickBooksDb
                .update(quickBooksConnectionsTable)
                .set({
                    realmId: request.realmId,
                    companyName: info.companyName,
                    mode: "INTUIT",
                    provider: "QUICKBOOKS",
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                    tokenExpiresAt: tokens.accessTokenExpiresAt,
                })
                .where(eq(quickBooksConnectionsTable.id, existing.id))
                .returning()
            return updated
        }
        const newConnection = quickBooksConnectionInsertSchema.parse({
            realmId: request.realmId,
            companyName: info.companyName,
            mode: "INTUIT",
            provider: "QUICKBOOKS",
            connectedByUserId: request.userId,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            tokenExpiresAt: tokens.accessTokenExpiresAt,
        })
        return await idempotentInsertAndGet(
            quickBooksDb,
            quickBooksConnectionsTable,
            newConnection,
            request.idempotencyKey,
        )
    }

    // --- Per-user connections (the multi-client tenancy surface) ----------
    //
    // The workspace-level surface above treats the newest row as "the"
    // connection. Multi-client packs (the CFO practice portal) instead give
    // every user their own connection: connectForUser is idempotent per
    // user, and each user's realm hashes onto a distinct deterministic
    // sample company so a portfolio of clients looks like a portfolio of
    // different businesses.

    /** The given user's connection, or undefined when they have not connected. */
    async getConnectionForUser(userId: string): Promise<QuickBooksConnection | undefined> {
        const [connection] = await quickBooksDb
            .select()
            .from(quickBooksConnectionsTable)
            .where(eq(quickBooksConnectionsTable.connectedByUserId, userId))
            .orderBy(desc(quickBooksConnectionsTable.rowCreatedAt))
            .limit(1)
        return connection
    }

    /** Every connection in the workspace, newest first (the advisor's portfolio). */
    async listConnections(): Promise<QuickBooksConnection[]> {
        return await quickBooksDb
            .select()
            .from(quickBooksConnectionsTable)
            .orderBy(desc(quickBooksConnectionsTable.rowCreatedAt))
    }

    /**
     * Connects the given user's own books. Idempotent per user; in local
     * mode the user's realm is derived from their id, so each client gets a
     * distinct deterministic sample company. In intuit mode connecting goes
     * through the OAuth flow instead (beginAuthorization, whose callback
     * also creates a per-user row).
     */
    async connectForUser(request: ConnectForUserRequest): Promise<QuickBooksConnection> {
        this.requireLocalMode()
        const existing = await this.getConnectionForUser(request.userId)
        if (existing !== undefined) {
            return existing
        }
        const realmId = simulatedRealmIdForSeed(request.userId)
        const profile = simulatedProfileForRealm(realmId)
        const newConnection = quickBooksConnectionInsertSchema.parse({
            realmId,
            companyName: profile.companyName,
            mode: "LOCAL",
            provider: request.provider ?? "QUICKBOOKS",
            connectedByUserId: request.userId,
        })
        return await idempotentInsertAndGet(
            quickBooksDb,
            quickBooksConnectionsTable,
            newConnection,
            request.idempotencyKey,
        )
    }

    /** Disconnects the given user's own books. Idempotent. */
    async disconnectForUser(userId: string): Promise<boolean> {
        const connection = await this.getConnectionForUser(userId)
        if (connection === undefined) {
            return true
        }
        await quickBooksDb
            .delete(quickBooksConnectionsTable)
            .where(eq(quickBooksConnectionsTable.id, connection.id))
        return true
    }

    // --- Reads (branch per connection row: LOCAL simulation or live QBO) ---

    /** The connection's company snapshot (caller resolved the connection). */
    async snapshotForConnection(connection: QuickBooksConnection): Promise<SimulatedCompanySnapshot> {
        if (connection.mode === "LOCAL") {
            return simulatedCompanySnapshot(simulatedProfileForRealm(connection.realmId))
        }
        const wrapper = getIntuitWrapper()
        const auth = await this.liveAuth(connection)
        const [info, customers, invoices] = await Promise.all([
            wrapper.companyInfo(auth),
            wrapper.customers(auth),
            wrapper.invoices(auth),
        ])
        return liveCompanySnapshot(info, customers, invoices)
    }

    async customersForConnection(connection: QuickBooksConnection): Promise<SimulatedCustomer[]> {
        if (connection.mode === "LOCAL") {
            return simulatedCustomers(simulatedProfileForRealm(connection.realmId))
        }
        return await getIntuitWrapper().customers(await this.liveAuth(connection))
    }

    async invoicesForConnection(
        connection: QuickBooksConnection,
        statuses?: SimulatedInvoiceStatus[] | null,
    ): Promise<SimulatedInvoice[]> {
        const invoices =
            connection.mode === "LOCAL"
                ? simulatedInvoices(simulatedProfileForRealm(connection.realmId))
                : await getIntuitWrapper().invoices(await this.liveAuth(connection))
        if (statuses === undefined || statuses === null || statuses.length === 0) {
            return invoices
        }
        return invoices.filter((invoice) => statuses.includes(invoice.status))
    }

    /** Thirteen trailing months of P&L (oldest first, current month last). */
    async profitAndLossForConnection(
        connection: QuickBooksConnection,
    ): Promise<SimulatedProfitAndLossPeriod[]> {
        if (connection.mode === "LOCAL") {
            return simulatedProfitAndLoss(simulatedProfileForRealm(connection.realmId))
        }
        return await getIntuitWrapper().profitAndLoss(await this.liveAuth(connection))
    }

    /** Thirteen trailing month-end balance sheets (oldest first). */
    async balanceSheetForConnection(
        connection: QuickBooksConnection,
    ): Promise<SimulatedBalanceSheetPeriod[]> {
        if (connection.mode === "LOCAL") {
            return simulatedBalanceSheet(simulatedProfileForRealm(connection.realmId))
        }
        return await getIntuitWrapper().balanceSheet(await this.liveAuth(connection))
    }

    /**
     * Renders the connection's statements to an xlsx workbook (one sheet per
     * statement, months as columns) and files it PRIVATE for the requesting
     * user; the client downloads it via the fileUrl query.
     */
    async exportStatementsXlsxForConnection(
        request: ExportStatementsXlsxRequest & { connection: QuickBooksConnection },
    ): Promise<Upload> {
        const sheets: XlsxSheet[] = []
        if (request.statement === "PROFIT_AND_LOSS" || request.statement === "ALL") {
            sheets.push(profitAndLossSheet(await this.profitAndLossForConnection(request.connection)))
        }
        if (request.statement === "BALANCE_SHEET" || request.statement === "ALL") {
            sheets.push(balanceSheetSheet(await this.balanceSheetForConnection(request.connection)))
        }
        return await xlsxService.writeWorkbook({
            idempotencyKey: request.idempotencyKey,
            userId: request.userId,
            visibility: "PRIVATE",
            fileName: statementFileName(request.connection.companyName, request.statement),
            sheets,
        })
    }

    /** Disconnects the workspace from QuickBooks. Idempotent. */
    async disconnectQuickBooks(): Promise<boolean> {
        const connection = await this.getConnection()
        if (connection === undefined) {
            return true
        }
        await quickBooksDb
            .delete(quickBooksConnectionsTable)
            .where(eq(quickBooksConnectionsTable.id, connection.id))
        return true
    }

    // --- Workspace-level reads (the newest connection is "the" connection) -

    async getCompanySnapshot(): Promise<SimulatedCompanySnapshot> {
        return await this.snapshotForConnection(await this.requireConnection())
    }

    async listCustomers(): Promise<SimulatedCustomer[]> {
        return await this.customersForConnection(await this.requireConnection())
    }

    /** Thirteen trailing months of P&L (oldest first, current month last). */
    async getProfitAndLoss(): Promise<SimulatedProfitAndLossPeriod[]> {
        return await this.profitAndLossForConnection(await this.requireConnection())
    }

    /** Thirteen trailing month-end balance sheets (oldest first). */
    async getBalanceSheet(): Promise<SimulatedBalanceSheetPeriod[]> {
        return await this.balanceSheetForConnection(await this.requireConnection())
    }

    async exportStatementsXlsx(request: ExportStatementsXlsxRequest): Promise<Upload> {
        const connection = await this.requireConnection()
        return await this.exportStatementsXlsxForConnection({ ...request, connection })
    }

    async listInvoices(request: ListQuickBooksInvoicesRequest): Promise<SimulatedInvoice[]> {
        const connection = await this.requireConnection()
        return await this.invoicesForConnection(connection, request.filters?.statuses)
    }

    private async requireConnection(): Promise<QuickBooksConnection> {
        const connection = await this.getConnection()
        if (connection === undefined) {
            throw new RpcError(
                "FAILED_PRECONDITION",
                "QuickBooks is not connected. Connect QuickBooks from the dashboard first.",
            )
        }
        return connection
    }

    /**
     * The live company's bearer auth for an INTUIT connection, refreshing
     * the access token (and persisting the rotated refresh token — Intuit
     * rotates it on every refresh) when it is within five minutes of expiry.
     */
    private async liveAuth(connection: QuickBooksConnection): Promise<IntuitCompanyAuth> {
        if (connection.refreshToken === null || connection.refreshToken === "") {
            throw new RpcError(
                "FAILED_PRECONDITION",
                "This QuickBooks connection has no OAuth tokens. Reconnect QuickBooks from the dashboard.",
            )
        }
        const accessToken = connection.accessToken
        const expiresAt = connection.tokenExpiresAt?.getTime()
        if (
            accessToken !== null &&
            accessToken !== "" &&
            expiresAt !== undefined &&
            expiresAt - Date.now() > TOKEN_REFRESH_MARGIN_MS
        ) {
            return { accessToken, realmId: connection.realmId }
        }
        const tokens = await getIntuitWrapper().refreshTokens(connection.refreshToken)
        await quickBooksDb
            .update(quickBooksConnectionsTable)
            .set({
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
                tokenExpiresAt: tokens.accessTokenExpiresAt,
            })
            .where(eq(quickBooksConnectionsTable.id, connection.id))
        return { accessToken: tokens.accessToken, realmId: connection.realmId }
    }

    /** Instant connects are the simulation's; intuit mode connects over OAuth. */
    private requireLocalMode(): void {
        if (validatedEnv().QUICKBOOKS_MODE !== "local") {
            throw new RpcError(
                "FAILED_PRECONDITION",
                "QUICKBOOKS_MODE=intuit connects through the Intuit OAuth flow: call " +
                    "beginQuickBooksAuthorization and send the user to the returned URL.",
            )
        }
    }

    private requireIntuitMode(): void {
        if (validatedEnv().QUICKBOOKS_MODE !== "intuit") {
            throw new RpcError(
                "FAILED_PRECONDITION",
                "QUICKBOOKS_MODE=local connects instantly over connectQuickBooks/connectMyBooks; " +
                    "the OAuth flow only exists in intuit mode.",
            )
        }
    }

    /** OAuth states are signed with the app's client secret (present in intuit mode). */
    private stateSecret(): string {
        const secret = validatedEnv().QUICKBOOKS_CLIENT_SECRET
        if (secret === undefined || secret === "") {
            throw new RpcError(
                "FAILED_PRECONDITION",
                "QUICKBOOKS_CLIENT_SECRET is not set. Connect an Intuit app under Integrations " +
                    "and redeploy.",
            )
        }
        return secret
    }
}

export const quickBooksService = new QuickBooksService()

export interface QuickBooksStatus {
    connected: boolean
    connection?: QuickBooksConnection
    /** How new connections connect: LOCAL (instant, simulated) or INTUIT (OAuth). */
    mode: QuickBooksMode
}

export interface ConnectQuickBooksRequest {
    idempotencyKey: string
    /** The authenticated user performing the connect. */
    connectedByUserId: string
    /** Which accounting provider to connect; defaults to QuickBooks. */
    provider?: "QUICKBOOKS" | "XERO" | null
}

export interface BeginAuthorizationRequest {
    /** The authenticated user connecting their books. */
    userId: string
    /** Where Intuit redirects back after consent (registered on the Intuit app). */
    redirectUri: string
}

export interface CompleteAuthorizationRequest {
    idempotencyKey: string
    /** The authenticated user finishing the connect (must match the state's). */
    userId: string
    /** The authorization code from Intuit's callback query string. */
    code: string
    /** The opaque state from Intuit's callback query string. */
    state: string
    /** The connected company's realm id from Intuit's callback query string. */
    realmId: string
    /** The exact redirect URI the authorization began with. */
    redirectUri: string
}

export interface ListQuickBooksInvoicesRequest {
    filters?: {
        statuses?: SimulatedInvoiceStatus[] | null
    } | null
}

export interface ConnectForUserRequest {
    idempotencyKey: string
    /** The user connecting their own books (also the connection's owner). */
    userId: string
    /** Which accounting provider to connect; defaults to QuickBooks. */
    provider?: "QUICKBOOKS" | "XERO" | null
}

export type StatementExportKind = "PROFIT_AND_LOSS" | "BALANCE_SHEET" | "ALL"

function statementFileName(companyName: string, statement: StatementExportKind): string {
    const slug = statement.toLowerCase().replace(/_/g, "-")
    const date = new Date().toISOString().slice(0, 10)
    const companySlug = companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
    return `${companySlug}-${slug}-${date}.xlsx`
}

export interface ExportStatementsXlsxRequest {
    idempotencyKey: string
    /** The authenticated user requesting the export (the upload's owner). */
    userId: string
    statement: StatementExportKind
}

/** The same snapshot rollup the simulation serves, computed over live rows. */
function liveCompanySnapshot(
    info: IntuitCompanyInfo,
    customers: SimulatedCustomer[],
    invoices: SimulatedInvoice[],
): SimulatedCompanySnapshot {
    const byStatus = (status: SimulatedInvoiceStatus): SimulatedInvoice[] =>
        invoices.filter((invoice) => invoice.status === status)
    const paid = byStatus("PAID")
    const open = byStatus("OPEN")
    const overdue = byStatus("OVERDUE")
    return {
        companyName: info.companyName,
        currency: info.currency,
        revenueMinorUnits: paid.reduce((sum, invoice) => sum + invoice.totalMinorUnits, 0),
        outstandingMinorUnits: [...open, ...overdue].reduce(
            (sum, invoice) => sum + invoice.balanceMinorUnits,
            0,
        ),
        overdueMinorUnits: overdue.reduce((sum, invoice) => sum + invoice.balanceMinorUnits, 0),
        paidInvoiceCount: paid.length,
        openInvoiceCount: open.length,
        overdueInvoiceCount: overdue.length,
        customerCount: customers.length,
    }
}

// --- OAuth state signing -----------------------------------------------------
//
// The state parameter carries {userId, redirectUri, expiry, nonce} HMAC-signed
// with the Intuit app's client secret: the callback can only complete for the
// same signed-in user at the same return address, within 15 minutes. Stateless
// on purpose — nothing to store or clean up between authorize and callback.

interface OAuthStatePayload {
    userId: string
    redirectUri: string
    expiresAtEpochMs: number
    nonce: string
}

function signOAuthState(request: { userId: string; redirectUri: string }, secret: string): string {
    const payload: OAuthStatePayload = {
        userId: request.userId,
        redirectUri: request.redirectUri,
        expiresAtEpochMs: Date.now() + OAUTH_STATE_TTL_MS,
        nonce: randomBytes(8).toString("hex"),
    }
    const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url")
    return `${encoded}.${stateSignature(encoded, secret)}`
}

function verifyOAuthState(
    state: string,
    secret: string,
    expected: { userId: string; redirectUri: string },
): void {
    const invalid = new RpcError(
        "INVALID_ARGUMENT",
        "The QuickBooks authorization state is invalid or expired. Start the connect again.",
    )
    const [encoded, signature] = state.split(".")
    if (encoded === undefined || signature === undefined) {
        throw invalid
    }
    const expectedSignature = stateSignature(encoded, secret)
    const signatureBytes = Buffer.from(signature, "hex")
    const expectedBytes = Buffer.from(expectedSignature, "hex")
    if (signatureBytes.length !== expectedBytes.length || !timingSafeEqual(signatureBytes, expectedBytes)) {
        throw invalid
    }
    let payload: OAuthStatePayload
    try {
        payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as OAuthStatePayload
    } catch {
        throw invalid
    }
    if (
        payload.userId !== expected.userId ||
        payload.redirectUri !== expected.redirectUri ||
        payload.expiresAtEpochMs < Date.now()
    ) {
        throw invalid
    }
}

function stateSignature(encodedPayload: string, secret: string): string {
    return createHmac("sha256", secret).update(encodedPayload).digest("hex")
}

/**
 * Statement-to-sheet mapping: months as columns (oldest first), one row per
 * category line with section totals — the layout a CFO expects when the
 * workbook opens. Amounts convert from minor units to currency units.
 */
function profitAndLossSheet(periods: SimulatedProfitAndLossPeriod[]): XlsxSheet {
    const monthColumns = periods.map((period) => ({
        header: period.month,
        width: 14,
        numberFormat: "#,##0.00",
    }))
    const rows: (string | number | null)[][] = []
    const line = (label: string, values: number[]): void => {
        rows.push([label, ...values.map((value) => value / 100)])
    }

    rows.push(["Income", ...periods.map(() => null)])
    periods[0].incomeLines.forEach((_, lineIndex) => {
        line(
            `  ${periods[0].incomeLines[lineIndex].category}`,
            periods.map((period) => period.incomeLines[lineIndex]?.minorUnits ?? 0),
        )
    })
    line(
        "Total income",
        periods.map((period) => period.totalIncomeMinorUnits),
    )
    rows.push(["Expenses", ...periods.map(() => null)])
    periods[0].expenseLines.forEach((_, lineIndex) => {
        line(
            `  ${periods[0].expenseLines[lineIndex].category}`,
            periods.map((period) => period.expenseLines[lineIndex]?.minorUnits ?? 0),
        )
    })
    line(
        "Total expenses",
        periods.map((period) => period.totalExpensesMinorUnits),
    )
    line(
        "Net income",
        periods.map((period) => period.netIncomeMinorUnits),
    )

    return {
        name: "Profit & Loss",
        columns: [{ header: "Category", width: 28 }, ...monthColumns],
        rows,
    }
}

function balanceSheetSheet(periods: SimulatedBalanceSheetPeriod[]): XlsxSheet {
    const monthColumns = periods.map((period) => ({
        header: period.month,
        width: 14,
        numberFormat: "#,##0.00",
    }))
    const rows: (string | number | null)[][] = []
    const line = (label: string, values: number[]): void => {
        rows.push([label, ...values.map((value) => value / 100)])
    }

    const sections = [
        {
            title: "Assets",
            lines: (period: SimulatedBalanceSheetPeriod) => period.assetLines,
            totalLabel: "Total assets",
            total: (period: SimulatedBalanceSheetPeriod) => period.totalAssetsMinorUnits,
        },
        {
            title: "Liabilities",
            lines: (period: SimulatedBalanceSheetPeriod) => period.liabilityLines,
            totalLabel: "Total liabilities",
            total: (period: SimulatedBalanceSheetPeriod) => period.totalLiabilitiesMinorUnits,
        },
        {
            title: "Equity",
            lines: (period: SimulatedBalanceSheetPeriod) => period.equityLines,
            totalLabel: "Total equity",
            total: (period: SimulatedBalanceSheetPeriod) => period.totalEquityMinorUnits,
        },
    ]
    for (const section of sections) {
        rows.push([section.title, ...periods.map(() => null)])
        section.lines(periods[0]).forEach((_, lineIndex) => {
            line(
                `  ${section.lines(periods[0])[lineIndex].category}`,
                periods.map((period) => section.lines(period)[lineIndex]?.minorUnits ?? 0),
            )
        })
        line(
            section.totalLabel,
            periods.map((period) => section.total(period)),
        )
    }

    return {
        name: "Balance Sheet",
        columns: [{ header: "Category", width: 28 }, ...monthColumns],
        rows,
    }
}
