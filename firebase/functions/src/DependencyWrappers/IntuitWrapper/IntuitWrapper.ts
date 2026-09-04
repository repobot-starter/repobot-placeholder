/**
 * The QuickBooks domain's boundary with Intuit, used when
 * QUICKBOOKS_MODE=intuit. Only what the kernel needs is wrapped — the OAuth
 * authorization-code flow (authorize URL, code exchange, refresh) and the
 * QuickBooks Online reads behind quickBooksService — called over Intuit's
 * REST API directly so the kernel carries no Intuit SDK dependency.
 *
 * Read methods return the domain's own shapes (declared in
 * QuickBooksSimulation.ts, whose simulation is their local-mode producer), so
 * the service and everything above it is mode-agnostic.
 */

import {
    SimulatedBalanceSheetPeriod,
    SimulatedCustomer,
    SimulatedInvoice,
    SimulatedProfitAndLossPeriod,
} from "../../Services/QuickBooks/QuickBooksSimulation.js"

/** The token set Intuit returns from a code exchange or refresh. */
export interface IntuitTokens {
    accessToken: string
    /** Rotates on every refresh; always persist the latest one. */
    refreshToken: string
    /** When accessToken stops working (from expires_in, ~1 hour). */
    accessTokenExpiresAt: Date
}

/** A live QuickBooks Online company: the bearer token plus its realm. */
export interface IntuitCompanyAuth {
    accessToken: string
    realmId: string
}

export interface IntuitCompanyInfo {
    companyName: string
    /** Lowercase ISO currency code (the company's home currency). */
    currency: string
}

export interface IntuitWrapper {
    /** The Intuit consent-screen URL to send the connecting user to. */
    buildAuthorizationUrl(request: { redirectUri: string; state: string }): string
    /** Exchanges the callback's authorization code for tokens. */
    exchangeAuthorizationCode(request: { code: string; redirectUri: string }): Promise<IntuitTokens>
    /** Trades a refresh token for a fresh token set. */
    refreshTokens(refreshToken: string): Promise<IntuitTokens>
    companyInfo(auth: IntuitCompanyAuth): Promise<IntuitCompanyInfo>
    customers(auth: IntuitCompanyAuth): Promise<SimulatedCustomer[]>
    invoices(auth: IntuitCompanyAuth): Promise<SimulatedInvoice[]>
    /** Thirteen trailing months of P&L, oldest first. */
    profitAndLoss(auth: IntuitCompanyAuth): Promise<SimulatedProfitAndLossPeriod[]>
    /** Thirteen trailing month-end balance sheets, oldest first. */
    balanceSheet(auth: IntuitCompanyAuth): Promise<SimulatedBalanceSheetPeriod[]>
}
