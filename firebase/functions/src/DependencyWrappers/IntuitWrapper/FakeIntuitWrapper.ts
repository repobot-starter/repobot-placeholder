import {
    SimulatedBalanceSheetPeriod,
    SimulatedCustomer,
    SimulatedInvoice,
    SimulatedProfitAndLossPeriod,
} from "../../Services/QuickBooks/QuickBooksSimulation.js"
import { IntuitCompanyAuth, IntuitCompanyInfo, IntuitTokens, IntuitWrapper } from "./IntuitWrapper.js"

/**
 * Test-only Intuit fake: deterministic data clearly distinct from the local
 * simulation (so tests can prove the live path served it), plus call
 * recording for the OAuth handshake. Refresh tokens rotate like Intuit's do.
 */
export class FakeIntuitWrapper implements IntuitWrapper {
    static readonly REALM_ID = "fake-intuit-realm-1"
    static readonly COMPANY_NAME = "Live Books Inc."

    exchangedCodes: { code: string; redirectUri: string }[] = []
    refreshedTokens: string[] = []
    private tokenGeneration = 0

    /** When set, the next access token expires at this instant (tests token refresh). */
    nextAccessTokenExpiresAt: Date | undefined

    buildAuthorizationUrl(request: { redirectUri: string; state: string }): string {
        const url = new URL("https://appcenter.intuit.com/connect/oauth2")
        url.searchParams.set("client_id", "fake-client-id")
        url.searchParams.set("response_type", "code")
        url.searchParams.set("scope", "com.intuit.quickbooks.accounting")
        url.searchParams.set("redirect_uri", request.redirectUri)
        url.searchParams.set("state", request.state)
        return url.toString()
    }

    async exchangeAuthorizationCode(request: { code: string; redirectUri: string }): Promise<IntuitTokens> {
        this.exchangedCodes.push(request)
        return this.mintTokens()
    }

    async refreshTokens(refreshToken: string): Promise<IntuitTokens> {
        this.refreshedTokens.push(refreshToken)
        return this.mintTokens()
    }

    async companyInfo(_auth: IntuitCompanyAuth): Promise<IntuitCompanyInfo> {
        return { companyName: FakeIntuitWrapper.COMPANY_NAME, currency: "usd" }
    }

    async customers(_auth: IntuitCompanyAuth): Promise<SimulatedCustomer[]> {
        return [
            {
                id: "live-cust-1",
                displayName: "Harbor Freight Partners",
                companyName: "Harbor Freight Partners LLC",
                email: "ap@harborfreightpartners.example",
                city: "Portland",
                state: "OR",
                customerSince: "2023-04-12",
                openBalanceMinorUnits: 145_000,
            },
            {
                id: "live-cust-2",
                displayName: "Cedar & Main Coffee",
                email: "owner@cedarandmain.example",
                city: "Boise",
                state: "ID",
                customerSince: "2024-01-30",
                openBalanceMinorUnits: 0,
            },
        ]
    }

    async invoices(_auth: IntuitCompanyAuth): Promise<SimulatedInvoice[]> {
        return [
            {
                id: "live-inv-1",
                docNumber: "1042",
                customerId: "live-cust-1",
                customerName: "Harbor Freight Partners",
                status: "OPEN",
                issueDate: "2026-07-20",
                dueDate: "2026-08-19",
                totalMinorUnits: 145_000,
                balanceMinorUnits: 145_000,
            },
            {
                id: "live-inv-2",
                docNumber: "1041",
                customerId: "live-cust-2",
                customerName: "Cedar & Main Coffee",
                status: "PAID",
                issueDate: "2026-06-02",
                dueDate: "2026-07-02",
                totalMinorUnits: 98_000,
                balanceMinorUnits: 0,
            },
        ]
    }

    async profitAndLoss(_auth: IntuitCompanyAuth): Promise<SimulatedProfitAndLossPeriod[]> {
        return [
            {
                month: "2026-07",
                incomeLines: [{ category: "Consulting income", minorUnits: 1_200_000 }],
                totalIncomeMinorUnits: 1_200_000,
                expenseLines: [{ category: "Payroll", minorUnits: 700_000 }],
                totalExpensesMinorUnits: 700_000,
                netIncomeMinorUnits: 500_000,
            },
            {
                month: "2026-08",
                incomeLines: [{ category: "Consulting income", minorUnits: 900_000 }],
                totalIncomeMinorUnits: 900_000,
                expenseLines: [{ category: "Payroll", minorUnits: 720_000 }],
                totalExpensesMinorUnits: 720_000,
                netIncomeMinorUnits: 180_000,
            },
        ]
    }

    async balanceSheet(_auth: IntuitCompanyAuth): Promise<SimulatedBalanceSheetPeriod[]> {
        return [
            {
                month: "2026-08",
                assetLines: [{ category: "Checking", minorUnits: 4_500_000 }],
                totalAssetsMinorUnits: 4_500_000,
                liabilityLines: [{ category: "Credit card", minorUnits: 500_000 }],
                totalLiabilitiesMinorUnits: 500_000,
                equityLines: [{ category: "Retained earnings", minorUnits: 4_000_000 }],
                totalEquityMinorUnits: 4_000_000,
            },
        ]
    }

    private mintTokens(): IntuitTokens {
        this.tokenGeneration += 1
        const expiresAt = this.nextAccessTokenExpiresAt ?? new Date(Date.now() + 3600 * 1000)
        this.nextAccessTokenExpiresAt = undefined
        return {
            accessToken: `fake-access-${this.tokenGeneration}`,
            refreshToken: `fake-refresh-${this.tokenGeneration}`,
            accessTokenExpiresAt: expiresAt,
        }
    }
}
