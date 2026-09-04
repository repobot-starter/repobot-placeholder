import { validatedEnv } from "../../Utils/Env.js"
import { RpcError } from "../../Utils/RpcError.js"
import {
    SIMULATED_STATEMENT_MONTHS,
    SimulatedBalanceSheetPeriod,
    SimulatedCustomer,
    SimulatedInvoice,
    SimulatedInvoiceStatus,
    SimulatedProfitAndLossPeriod,
    SimulatedStatementLine,
} from "../../Services/QuickBooks/QuickBooksSimulation.js"
import { IntuitCompanyAuth, IntuitCompanyInfo, IntuitTokens, IntuitWrapper } from "./IntuitWrapper.js"

const INTUIT_AUTHORIZE_URL = "https://appcenter.intuit.com/connect/oauth2"
const INTUIT_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer"
const QBO_SCOPE = "com.intuit.quickbooks.accounting"
// Pins the QBO API behavior we parse against (Intuit's versioning knob).
const QBO_MINOR_VERSION = "75"

/**
 * The real Intuit client, used when QUICKBOOKS_MODE=intuit. The app's OAuth
 * client credentials are injected by the platform at deploy time from the
 * account's connected Intuit integration; they are never present locally.
 */
export class IntuitApiWrapper implements IntuitWrapper {
    buildAuthorizationUrl(request: { redirectUri: string; state: string }): string {
        const url = new URL(INTUIT_AUTHORIZE_URL)
        url.searchParams.set("client_id", this.credentials().clientId)
        url.searchParams.set("response_type", "code")
        url.searchParams.set("scope", QBO_SCOPE)
        url.searchParams.set("redirect_uri", request.redirectUri)
        url.searchParams.set("state", request.state)
        return url.toString()
    }

    async exchangeAuthorizationCode(request: { code: string; redirectUri: string }): Promise<IntuitTokens> {
        return await this.tokenRequest(
            new URLSearchParams({
                grant_type: "authorization_code",
                code: request.code,
                redirect_uri: request.redirectUri,
            }),
        )
    }

    async refreshTokens(refreshToken: string): Promise<IntuitTokens> {
        return await this.tokenRequest(
            new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
        )
    }

    async companyInfo(auth: IntuitCompanyAuth): Promise<IntuitCompanyInfo> {
        const info = await this.apiGet<QboCompanyInfoResponse>(
            auth,
            `/v3/company/${encodeURIComponent(auth.realmId)}/companyinfo/${encodeURIComponent(auth.realmId)}`,
        )
        const preferences = await this.query<QboPreferences>(auth, "select * from Preferences")
        const currency = preferences[0]?.CurrencyPrefs?.HomeCurrency?.value ?? "USD"
        return {
            companyName: info.CompanyInfo?.CompanyName ?? "QuickBooks company",
            currency: currency.toLowerCase(),
        }
    }

    async customers(auth: IntuitCompanyAuth): Promise<SimulatedCustomer[]> {
        const rows = await this.query<QboCustomer>(
            auth,
            "select * from Customer where Active = true orderby DisplayName maxresults 1000",
        )
        return rows.map((row) => ({
            id: row.Id,
            displayName: row.DisplayName ?? row.CompanyName ?? `Customer ${row.Id}`,
            companyName: row.CompanyName ?? undefined,
            email: row.PrimaryEmailAddr?.Address ?? "",
            city: row.BillAddr?.City ?? "",
            state: row.BillAddr?.CountrySubDivisionCode ?? "",
            customerSince: (row.MetaData?.CreateTime ?? "").slice(0, 10),
            openBalanceMinorUnits: toMinorUnits(row.Balance),
        }))
    }

    async invoices(auth: IntuitCompanyAuth): Promise<SimulatedInvoice[]> {
        const rows = await this.query<QboInvoice>(
            auth,
            "select * from Invoice orderby TxnDate desc maxresults 1000",
        )
        const today = new Date().toISOString().slice(0, 10)
        return rows.map((row) => {
            const balanceMinorUnits = toMinorUnits(row.Balance)
            const dueDate = row.DueDate ?? row.TxnDate ?? ""
            const status: SimulatedInvoiceStatus =
                balanceMinorUnits === 0 ? "PAID" : dueDate !== "" && dueDate < today ? "OVERDUE" : "OPEN"
            return {
                id: row.Id,
                docNumber: row.DocNumber ?? row.Id,
                customerId: row.CustomerRef?.value ?? "",
                customerName: row.CustomerRef?.name ?? "",
                status,
                issueDate: row.TxnDate ?? "",
                dueDate,
                totalMinorUnits: toMinorUnits(row.TotalAmt),
                balanceMinorUnits,
            }
        })
    }

    async profitAndLoss(auth: IntuitCompanyAuth): Promise<SimulatedProfitAndLossPeriod[]> {
        const report = await this.report(auth, "ProfitAndLoss")
        return parseProfitAndLossReport(report)
    }

    async balanceSheet(auth: IntuitCompanyAuth): Promise<SimulatedBalanceSheetPeriod[]> {
        const report = await this.report(auth, "BalanceSheet")
        return parseBalanceSheetReport(report)
    }

    private async report(auth: IntuitCompanyAuth, name: string): Promise<QboReport> {
        const { startDate, endDate } = trailingStatementRange()
        const search = new URLSearchParams({
            start_date: startDate,
            end_date: endDate,
            summarize_column_by: "Month",
            accounting_method: "Accrual",
        })
        return await this.apiGet<QboReport>(
            auth,
            `/v3/company/${encodeURIComponent(auth.realmId)}/reports/${name}`,
            search,
        )
    }

    private async query<TRow>(auth: IntuitCompanyAuth, query: string): Promise<TRow[]> {
        const response = await this.apiGet<{ QueryResponse?: Record<string, unknown> }>(
            auth,
            `/v3/company/${encodeURIComponent(auth.realmId)}/query`,
            new URLSearchParams({ query }),
        )
        const queryResponse = response.QueryResponse ?? {}
        // The entity rows sit under the entity's own name ("Customer", ...);
        // the only array-valued key in the response.
        for (const value of Object.values(queryResponse)) {
            if (Array.isArray(value)) {
                return value as TRow[]
            }
        }
        return []
    }

    private async apiGet<TResponse>(
        auth: IntuitCompanyAuth,
        path: string,
        search?: URLSearchParams,
    ): Promise<TResponse> {
        const params = search ?? new URLSearchParams()
        params.set("minorversion", QBO_MINOR_VERSION)
        const response = await fetch(`${this.apiBase()}${path}?${params.toString()}`, {
            headers: { authorization: `Bearer ${auth.accessToken}`, accept: "application/json" },
        })
        if (!response.ok) {
            const body = await response.text()
            throw new RpcError(
                "UNAVAILABLE",
                `QuickBooks Online request failed with status ${response.status}: ${body.slice(0, 300)}`,
            )
        }
        return (await response.json()) as TResponse
    }

    private async tokenRequest(body: URLSearchParams): Promise<IntuitTokens> {
        const { clientId, clientSecret } = this.credentials()
        const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
        const response = await fetch(INTUIT_TOKEN_URL, {
            method: "POST",
            headers: {
                authorization: `Basic ${basic}`,
                "content-type": "application/x-www-form-urlencoded",
                accept: "application/json",
            },
            body,
        })
        const payload = (await response.json()) as {
            access_token?: string
            refresh_token?: string
            expires_in?: number
            error?: string
            error_description?: string
        }
        if (!response.ok || payload.access_token === undefined || payload.refresh_token === undefined) {
            const detail = payload.error_description ?? payload.error ?? `status ${response.status}`
            throw new RpcError("UNAVAILABLE", `Intuit token request failed: ${detail}`)
        }
        return {
            accessToken: payload.access_token,
            refreshToken: payload.refresh_token,
            accessTokenExpiresAt: new Date(Date.now() + (payload.expires_in ?? 3600) * 1000),
        }
    }

    private apiBase(): string {
        return validatedEnv().QUICKBOOKS_ENVIRONMENT === "sandbox"
            ? "https://sandbox-quickbooks.api.intuit.com"
            : "https://quickbooks.api.intuit.com"
    }

    private credentials(): { clientId: string; clientSecret: string } {
        const { QUICKBOOKS_CLIENT_ID, QUICKBOOKS_CLIENT_SECRET } = validatedEnv()
        if (
            QUICKBOOKS_CLIENT_ID === undefined ||
            QUICKBOOKS_CLIENT_ID === "" ||
            QUICKBOOKS_CLIENT_SECRET === undefined ||
            QUICKBOOKS_CLIENT_SECRET === ""
        ) {
            throw new RpcError(
                "FAILED_PRECONDITION",
                "QUICKBOOKS_CLIENT_ID / QUICKBOOKS_CLIENT_SECRET are not set. Connect an Intuit app " +
                    "under Integrations and redeploy, or run with QUICKBOOKS_MODE=local for the " +
                    "simulated sample company.",
            )
        }
        return { clientId: QUICKBOOKS_CLIENT_ID, clientSecret: QUICKBOOKS_CLIENT_SECRET }
    }
}

/** The 13-trailing-month window every statement read serves. */
function trailingStatementRange(): { startDate: string; endDate: string } {
    const now = new Date()
    const start = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (SIMULATED_STATEMENT_MONTHS - 1), 1),
    )
    return { startDate: start.toISOString().slice(0, 10), endDate: now.toISOString().slice(0, 10) }
}

// --- QBO report parsing -----------------------------------------------------
//
// QBO reports come as a column list (first the account column, then one Money
// column per month, then a Total column) and a recursive row tree of Section
// rows with Data leaves. The parsers below flatten that into the domain's
// period shapes. Exported for unit tests.

export interface QboReport {
    Columns?: { Column?: QboReportColumn[] }
    Rows?: { Row?: QboReportRow[] }
}

interface QboReportColumn {
    ColTitle?: string
    ColType?: string
    MetaData?: { Name?: string; Value?: string }[]
}

export interface QboReportRow {
    type?: string
    group?: string
    ColData?: { value?: string }[]
    Header?: { ColData?: { value?: string }[] }
    Summary?: { ColData?: { value?: string }[] }
    Rows?: { Row?: QboReportRow[] }
}

interface MonthColumn {
    /** Index into each row's ColData. */
    index: number
    /** Calendar month as YYYY-MM. */
    month: string
}

/** One statement category with its per-month values (parallel to monthColumns). */
interface CategorySeries {
    category: string
    minorUnitsByMonth: number[]
}

export function parseProfitAndLossReport(report: QboReport): SimulatedProfitAndLossPeriod[] {
    const months = monthColumns(report)
    const rows = report.Rows?.Row ?? []
    const income: CategorySeries[] = []
    const expenses: CategorySeries[] = []
    for (const row of rows) {
        const target = classifyProfitAndLossSection(row.group)
        if (target === "income") {
            collectLeafSeries(row.Rows?.Row ?? [], months, income)
        } else if (target === "expenses") {
            collectLeafSeries(row.Rows?.Row ?? [], months, expenses)
        }
    }
    return months.map((column, monthIndex) => {
        const incomeLines = seriesAt(income, monthIndex)
        const expenseLines = seriesAt(expenses, monthIndex)
        const totalIncomeMinorUnits = sumLines(incomeLines)
        const totalExpensesMinorUnits = sumLines(expenseLines)
        return {
            month: column.month,
            incomeLines,
            totalIncomeMinorUnits,
            expenseLines,
            totalExpensesMinorUnits,
            netIncomeMinorUnits: totalIncomeMinorUnits - totalExpensesMinorUnits,
        }
    })
}

export function parseBalanceSheetReport(report: QboReport): SimulatedBalanceSheetPeriod[] {
    const months = monthColumns(report)
    const assets: CategorySeries[] = []
    const liabilities: CategorySeries[] = []
    const equity: CategorySeries[] = []
    classifyBalanceSheetSections(report.Rows?.Row ?? [], months, { assets, liabilities, equity })
    return months.map((column, monthIndex) => {
        const assetLines = seriesAt(assets, monthIndex)
        const liabilityLines = seriesAt(liabilities, monthIndex)
        const equityLines = seriesAt(equity, monthIndex)
        return {
            month: column.month,
            assetLines,
            totalAssetsMinorUnits: sumLines(assetLines),
            liabilityLines,
            totalLiabilitiesMinorUnits: sumLines(liabilityLines),
            equityLines,
            totalEquityMinorUnits: sumLines(equityLines),
        }
    })
}

/**
 * P&L top-level sections by QBO group: Income/OtherIncome count toward
 * income; COGS/Expenses/OtherExpenses toward expenses. Derived summary
 * sections (GrossProfit, NetOperatingIncome, NetIncome, ...) are skipped —
 * totals are recomputed from the lines so they always reconcile.
 */
function classifyProfitAndLossSection(group: string | undefined): "income" | "expenses" | undefined {
    switch (group) {
        case "Income":
        case "OtherIncome":
            return "income"
        case "COGS":
        case "Expenses":
        case "OtherExpenses":
            return "expenses"
        default:
            return undefined
    }
}

/**
 * Balance sheet sections vary in nesting ("ASSETS" vs "Liabilities and
 * Equity" containing "Liabilities" and "Equity"), so classification walks
 * the tree matching group/header names and recurses through combined
 * sections until it finds a specific one.
 */
function classifyBalanceSheetSections(
    rows: QboReportRow[],
    months: MonthColumn[],
    out: { assets: CategorySeries[]; liabilities: CategorySeries[]; equity: CategorySeries[] },
): void {
    for (const row of rows) {
        const label = (row.group ?? row.Header?.ColData?.[0]?.value ?? "").toLowerCase()
        const mentionsLiabilities = label.includes("liabilit")
        const mentionsEquity = label.includes("equity")
        if (mentionsLiabilities && mentionsEquity) {
            classifyBalanceSheetSections(row.Rows?.Row ?? [], months, out)
        } else if (mentionsEquity) {
            collectLeafSeries(row.Rows?.Row ?? [], months, out.equity)
        } else if (mentionsLiabilities) {
            collectLeafSeries(row.Rows?.Row ?? [], months, out.liabilities)
        } else if (label.includes("asset")) {
            collectLeafSeries(row.Rows?.Row ?? [], months, out.assets)
        } else if (row.Rows?.Row !== undefined) {
            classifyBalanceSheetSections(row.Rows.Row, months, out)
        }
    }
}

/** Month columns are the ones QBO stamps with a StartDate; skips the Total column. */
function monthColumns(report: QboReport): MonthColumn[] {
    const columns = report.Columns?.Column ?? []
    const months: MonthColumn[] = []
    columns.forEach((column, index) => {
        const startDate = column.MetaData?.find((entry) => entry.Name === "StartDate")?.Value
        if (startDate !== undefined && startDate.length >= 7) {
            months.push({ index, month: startDate.slice(0, 7) })
        }
    })
    return months
}

/** Depth-first over a section's rows, one series per Data leaf (account line). */
function collectLeafSeries(rows: QboReportRow[], months: MonthColumn[], out: CategorySeries[]): void {
    for (const row of rows) {
        if (row.Rows?.Row !== undefined) {
            collectLeafSeries(row.Rows.Row, months, out)
            continue
        }
        const colData = row.ColData
        if (colData === undefined) {
            continue
        }
        const category = colData[0]?.value ?? ""
        if (category === "") {
            continue
        }
        out.push({
            category,
            minorUnitsByMonth: months.map((column) => parseReportAmount(colData[column.index]?.value)),
        })
    }
}

function seriesAt(series: CategorySeries[], monthIndex: number): SimulatedStatementLine[] {
    return series.map((entry) => ({
        category: entry.category,
        minorUnits: entry.minorUnitsByMonth[monthIndex] ?? 0,
    }))
}

function sumLines(lines: SimulatedStatementLine[]): number {
    return lines.reduce((sum, line) => sum + line.minorUnits, 0)
}

/** Report cells are decimal strings; empty means zero. */
function parseReportAmount(value: string | undefined): number {
    if (value === undefined || value === "") {
        return 0
    }
    const parsed = Number.parseFloat(value)
    return Number.isNaN(parsed) ? 0 : Math.round(parsed * 100)
}

function toMinorUnits(value: number | undefined): number {
    return Math.round((value ?? 0) * 100)
}

interface QboCompanyInfoResponse {
    CompanyInfo?: { CompanyName?: string }
}

interface QboPreferences {
    CurrencyPrefs?: { HomeCurrency?: { value?: string } }
}

interface QboCustomer {
    Id: string
    DisplayName?: string
    CompanyName?: string
    PrimaryEmailAddr?: { Address?: string }
    BillAddr?: { City?: string; CountrySubDivisionCode?: string }
    MetaData?: { CreateTime?: string }
    Balance?: number
}

interface QboInvoice {
    Id: string
    DocNumber?: string
    CustomerRef?: { value?: string; name?: string }
    TxnDate?: string
    DueDate?: string
    TotalAmt?: number
    Balance?: number
}
