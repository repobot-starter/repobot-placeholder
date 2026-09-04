/**
 * The QUICKBOOKS_MODE=local dataset: a deterministic, realistic sample
 * company so the whole accounting surface — dashboard stats, invoice and
 * customer tables, and the advisor's tools — works end to end in the sandbox
 * with no Intuit credentials and no cost (mirroring AI_MODE=local and
 * PAYMENTS_MODE=local).
 *
 * Amounts are fixed; dates are computed as fixed day-offsets from "today" so
 * OPEN invoices are always genuinely not-yet-due and OVERDUE ones are always
 * genuinely past due, no matter when the sandbox runs. Everything else is
 * constant, so tests can pin counts, totals, and statuses.
 */

export const SIMULATED_REALM_ID = "9341450001234567"
export const SIMULATED_COMPANY_NAME = "Bluebird Design Co."
export const SIMULATED_CURRENCY = "usd"

/**
 * A simulated company identity: which sample company a realm maps to and the
 * multiplier applied to every flagship amount. The flagship (Bluebird, scale
 * 1) serves the workspace-level surface unchanged; per-user connections (the
 * CFO practice pack) hash their realm onto a roster of distinct companies so
 * every client's books look like a different business while staying fully
 * deterministic.
 */
export interface SimulatedCompanyProfile {
    realmId: string
    companyName: string
    industry: string
    /** Multiplier applied to every flagship minor-unit amount. */
    scale: number
}

export const FLAGSHIP_PROFILE: SimulatedCompanyProfile = {
    realmId: SIMULATED_REALM_ID,
    companyName: SIMULATED_COMPANY_NAME,
    industry: "Design studio",
    scale: 1,
}

const companyRoster: { companyName: string; industry: string; scale: number }[] = [
    { companyName: "Harvest & Co. Bakery", industry: "Bakery", scale: 0.55 },
    { companyName: "Northgate Physio", industry: "Physical therapy clinic", scale: 0.85 },
    { companyName: "Cedar Peak Coffee Roasters", industry: "Coffee roastery", scale: 0.45 },
    { companyName: "Atlas Landscaping", industry: "Landscaping", scale: 1.3 },
    { companyName: "Foundry Fitness", industry: "Gym", scale: 0.75 },
    { companyName: "Pearl Street Books", industry: "Bookstore", scale: 0.35 },
    { companyName: "Copper Kettle Catering", industry: "Catering", scale: 1.1 },
    { companyName: "Lighthouse Web Studio", industry: "Web agency", scale: 0.95 },
    { companyName: "Summit Peak Outfitters", industry: "Outdoor retail", scale: 1.2 },
    { companyName: "Willow & Sage Florals", industry: "Florist", scale: 0.4 },
    { companyName: "Ironwood Carpentry", industry: "Carpentry", scale: 0.9 },
    { companyName: "Marina Bay Charters", industry: "Boat charters", scale: 1.45 },
]

/** FNV-1a over the seed: stable, dependency-free, well-distributed for a 12-way pick. */
function hashSeed(seed: string): number {
    let hash = 0x811c9dc5
    for (let index = 0; index < seed.length; index += 1) {
        hash ^= seed.charCodeAt(index)
        hash = Math.imul(hash, 0x01000193)
    }
    return hash >>> 0
}

/** The deterministic simulated realm id for a per-user connection. */
export function simulatedRealmIdForSeed(seed: string): string {
    return `sim-${hashSeed(seed).toString(16).padStart(8, "0")}`
}

/**
 * Which company a realm serves. The flagship realm keeps the flagship
 * profile; any other realm hashes onto the roster with a fine-grained scale
 * jitter so even two clients landing on the same roster entry show different
 * numbers.
 */
export function simulatedProfileForRealm(realmId: string): SimulatedCompanyProfile {
    if (realmId === SIMULATED_REALM_ID) {
        return FLAGSHIP_PROFILE
    }
    const hash = hashSeed(realmId)
    const entry = companyRoster[hash % companyRoster.length]
    const jitter = 0.9 + ((hash >>> 4) % 21) / 100
    return {
        realmId,
        companyName: entry.companyName,
        industry: entry.industry,
        scale: entry.scale * jitter,
    }
}

/** Scales a flagship minor-unit amount to the profile's company size. */
function scaled(minorUnits: number, profile: SimulatedCompanyProfile): number {
    return Math.round(minorUnits * profile.scale)
}

export type SimulatedInvoiceStatus = "PAID" | "OPEN" | "OVERDUE"

export interface SimulatedCustomer {
    /** QuickBooks-side customer id (not a database row id). */
    id: string
    displayName: string
    companyName?: string
    email: string
    city: string
    state: string
    /** Date the customer was added, as YYYY-MM-DD. */
    customerSince: string
    /** Sum of this customer's unpaid invoice balances, in minor units (cents). */
    openBalanceMinorUnits: number
}

export interface SimulatedInvoice {
    /** QuickBooks-side invoice id (not a database row id). */
    id: string
    docNumber: string
    customerId: string
    customerName: string
    status: SimulatedInvoiceStatus
    /** Issue date as YYYY-MM-DD. */
    issueDate: string
    /** Due date as YYYY-MM-DD. */
    dueDate: string
    /** Invoice total in minor units (cents). */
    totalMinorUnits: number
    /** Unpaid remainder in minor units (cents); 0 for PAID invoices. */
    balanceMinorUnits: number
}

export interface SimulatedCompanySnapshot {
    companyName: string
    currency: string
    /** Sum of PAID invoice totals, in minor units (cents). */
    revenueMinorUnits: number
    /** Sum of unpaid balances (OPEN + OVERDUE), in minor units (cents). */
    outstandingMinorUnits: number
    /** Sum of OVERDUE balances, in minor units (cents). */
    overdueMinorUnits: number
    paidInvoiceCount: number
    openInvoiceCount: number
    overdueInvoiceCount: number
    customerCount: number
}

interface CustomerSeed {
    id: string
    displayName: string
    companyName?: string
    email: string
    city: string
    state: string
    /** Fixed day-offset before "today" for customerSince. */
    sinceDaysAgo: number
}

const customerSeeds: CustomerSeed[] = [
    {
        id: "cust-1",
        displayName: "Harbor & Pine Cafe",
        companyName: "Harbor & Pine LLC",
        email: "accounts@harborandpine.example",
        city: "Portland",
        state: "OR",
        sinceDaysAgo: 940,
    },
    {
        id: "cust-2",
        displayName: "Meridian Fitness",
        companyName: "Meridian Fitness Group",
        email: "billing@meridianfit.example",
        city: "Denver",
        state: "CO",
        sinceDaysAgo: 870,
    },
    {
        id: "cust-3",
        displayName: "Alma Ramirez",
        email: "alma.ramirez@example.com",
        city: "Austin",
        state: "TX",
        sinceDaysAgo: 790,
    },
    {
        id: "cust-4",
        displayName: "Copperleaf Realty",
        companyName: "Copperleaf Realty Inc.",
        email: "ap@copperleaf.example",
        city: "Nashville",
        state: "TN",
        sinceDaysAgo: 720,
    },
    {
        id: "cust-5",
        displayName: "Juniper Yoga Studio",
        email: "hello@juniperyoga.example",
        city: "Boulder",
        state: "CO",
        sinceDaysAgo: 610,
    },
    {
        id: "cust-6",
        displayName: "Nolan Whitfield",
        email: "nolan.whitfield@example.com",
        city: "Chicago",
        state: "IL",
        sinceDaysAgo: 540,
    },
    {
        id: "cust-7",
        displayName: "Saltbox Provisions",
        companyName: "Saltbox Provisions Co.",
        email: "finance@saltbox.example",
        city: "Charleston",
        state: "SC",
        sinceDaysAgo: 450,
    },
    {
        id: "cust-8",
        displayName: "Bright Harbor Dental",
        companyName: "Bright Harbor Dental PLLC",
        email: "office@brightharbor.example",
        city: "Seattle",
        state: "WA",
        sinceDaysAgo: 370,
    },
    {
        id: "cust-9",
        displayName: "Priya Natarajan",
        email: "priya.natarajan@example.com",
        city: "San Jose",
        state: "CA",
        sinceDaysAgo: 290,
    },
    {
        id: "cust-10",
        displayName: "Wildflower Events",
        companyName: "Wildflower Events LLC",
        email: "invoices@wildflowerevents.example",
        city: "Santa Fe",
        state: "NM",
        sinceDaysAgo: 210,
    },
    {
        id: "cust-11",
        displayName: "Granite Peak Outfitters",
        companyName: "Granite Peak Outfitters",
        email: "ap@granitepeak.example",
        city: "Bozeman",
        state: "MT",
        sinceDaysAgo: 120,
    },
    {
        id: "cust-12",
        displayName: "Theo Okafor",
        email: "theo.okafor@example.com",
        city: "Atlanta",
        state: "GA",
        sinceDaysAgo: 45,
    },
]

interface InvoiceSeed {
    customerId: string
    status: SimulatedInvoiceStatus
    /** Fixed day-offset before "today" for the issue date. */
    issuedDaysAgo: number
    totalMinorUnits: number
    /** Unpaid remainder; defaults to the total for OPEN/OVERDUE, 0 for PAID. */
    balanceMinorUnits?: number
}

const PAYMENT_TERMS_DAYS = 30

/**
 * 30 invoices: 14 paid, 9 open, 7 overdue. Issue-day offsets keep every
 * status honest against the computed due date (issue + 30 days): OPEN
 * invoices were issued within the last 30 days, OVERDUE ones earlier.
 */
const invoiceSeeds: InvoiceSeed[] = [
    { customerId: "cust-1", status: "PAID", issuedDaysAgo: 172, totalMinorUnits: 245_000 },
    { customerId: "cust-2", status: "PAID", issuedDaysAgo: 165, totalMinorUnits: 480_000 },
    { customerId: "cust-4", status: "PAID", issuedDaysAgo: 154, totalMinorUnits: 1_250_000 },
    { customerId: "cust-3", status: "PAID", issuedDaysAgo: 147, totalMinorUnits: 87_500 },
    { customerId: "cust-7", status: "PAID", issuedDaysAgo: 139, totalMinorUnits: 362_500 },
    { customerId: "cust-5", status: "PAID", issuedDaysAgo: 126, totalMinorUnits: 145_000 },
    { customerId: "cust-8", status: "PAID", issuedDaysAgo: 118, totalMinorUnits: 690_000 },
    { customerId: "cust-1", status: "PAID", issuedDaysAgo: 104, totalMinorUnits: 245_000 },
    { customerId: "cust-10", status: "PAID", issuedDaysAgo: 96, totalMinorUnits: 532_500 },
    { customerId: "cust-6", status: "PAID", issuedDaysAgo: 88, totalMinorUnits: 56_000 },
    { customerId: "cust-2", status: "PAID", issuedDaysAgo: 77, totalMinorUnits: 480_000 },
    { customerId: "cust-9", status: "PAID", issuedDaysAgo: 66, totalMinorUnits: 118_000 },
    { customerId: "cust-11", status: "PAID", issuedDaysAgo: 58, totalMinorUnits: 274_000 },
    { customerId: "cust-4", status: "PAID", issuedDaysAgo: 49, totalMinorUnits: 1_250_000 },

    { customerId: "cust-7", status: "OVERDUE", issuedDaysAgo: 96, totalMinorUnits: 362_500 },
    { customerId: "cust-3", status: "OVERDUE", issuedDaysAgo: 84, totalMinorUnits: 92_000 },
    { customerId: "cust-12", status: "OVERDUE", issuedDaysAgo: 73, totalMinorUnits: 41_500 },
    {
        customerId: "cust-5",
        status: "OVERDUE",
        issuedDaysAgo: 62,
        totalMinorUnits: 145_000,
        balanceMinorUnits: 72_500,
    },
    { customerId: "cust-10", status: "OVERDUE", issuedDaysAgo: 55, totalMinorUnits: 218_000 },
    { customerId: "cust-6", status: "OVERDUE", issuedDaysAgo: 47, totalMinorUnits: 56_000 },
    {
        customerId: "cust-8",
        status: "OVERDUE",
        issuedDaysAgo: 39,
        totalMinorUnits: 690_000,
        balanceMinorUnits: 345_000,
    },

    { customerId: "cust-1", status: "OPEN", issuedDaysAgo: 26, totalMinorUnits: 245_000 },
    { customerId: "cust-9", status: "OPEN", issuedDaysAgo: 22, totalMinorUnits: 118_000 },
    { customerId: "cust-11", status: "OPEN", issuedDaysAgo: 19, totalMinorUnits: 274_000 },
    { customerId: "cust-2", status: "OPEN", issuedDaysAgo: 15, totalMinorUnits: 480_000 },
    { customerId: "cust-12", status: "OPEN", issuedDaysAgo: 12, totalMinorUnits: 41_500 },
    { customerId: "cust-4", status: "OPEN", issuedDaysAgo: 8, totalMinorUnits: 1_250_000 },
    { customerId: "cust-7", status: "OPEN", issuedDaysAgo: 5, totalMinorUnits: 362_500 },
    { customerId: "cust-10", status: "OPEN", issuedDaysAgo: 2, totalMinorUnits: 218_000 },
    { customerId: "cust-3", status: "OPEN", issuedDaysAgo: 1, totalMinorUnits: 87_500 },
]

function isoDateDaysAgo(daysAgo: number): string {
    const date = new Date()
    date.setUTCDate(date.getUTCDate() - daysAgo)
    return date.toISOString().slice(0, 10)
}

export function simulatedInvoices(profile: SimulatedCompanyProfile = FLAGSHIP_PROFILE): SimulatedInvoice[] {
    const customerNameById = new Map(customerSeeds.map((seed) => [seed.id, seed.displayName]))
    return invoiceSeeds.map((seed, index) => ({
        id: `qbinv-${index + 1}`,
        docNumber: `INV-${1001 + index}`,
        customerId: seed.customerId,
        customerName: customerNameById.get(seed.customerId) ?? seed.customerId,
        status: seed.status,
        issueDate: isoDateDaysAgo(seed.issuedDaysAgo),
        dueDate: isoDateDaysAgo(seed.issuedDaysAgo - PAYMENT_TERMS_DAYS),
        totalMinorUnits: scaled(seed.totalMinorUnits, profile),
        balanceMinorUnits:
            seed.status === "PAID" ? 0 : scaled(seed.balanceMinorUnits ?? seed.totalMinorUnits, profile),
    }))
}

export function simulatedCustomers(profile: SimulatedCompanyProfile = FLAGSHIP_PROFILE): SimulatedCustomer[] {
    const invoices = simulatedInvoices(profile)
    return customerSeeds.map((seed) => ({
        id: seed.id,
        displayName: seed.displayName,
        companyName: seed.companyName,
        email: seed.email,
        city: seed.city,
        state: seed.state,
        customerSince: isoDateDaysAgo(seed.sinceDaysAgo),
        openBalanceMinorUnits: invoices
            .filter((invoice) => invoice.customerId === seed.id)
            .reduce((sum, invoice) => sum + invoice.balanceMinorUnits, 0),
    }))
}

// --- Financial statements ---------------------------------------------------
//
// Thirteen trailing calendar months (oldest first, current month last) of
// P&L and balance-sheet data. Amounts are fixed per month-offset — position
// 0 is always twelve months ago, position 12 is always the current month —
// so the series is deterministic within any run and tests can pin totals
// and the accounting identity, while month labels stay current.

export const SIMULATED_STATEMENT_MONTHS = 13

export interface SimulatedStatementLine {
    category: string
    minorUnits: number
}

export interface SimulatedProfitAndLossPeriod {
    /** Calendar month as YYYY-MM. */
    month: string
    incomeLines: SimulatedStatementLine[]
    totalIncomeMinorUnits: number
    expenseLines: SimulatedStatementLine[]
    totalExpensesMinorUnits: number
    netIncomeMinorUnits: number
}

export interface SimulatedBalanceSheetPeriod {
    /** Calendar month as YYYY-MM (as-of month end). */
    month: string
    assetLines: SimulatedStatementLine[]
    totalAssetsMinorUnits: number
    liabilityLines: SimulatedStatementLine[]
    totalLiabilitiesMinorUnits: number
    equityLines: SimulatedStatementLine[]
    totalEquityMinorUnits: number
}

/** Fixed 13-value series per category, oldest month first (index 0 = 12 months ago). */
const incomeSeries: Record<string, number[]> = {
    "Design services": [
        1_820_000, 1_945_000, 2_110_000, 1_760_000, 2_240_000, 2_385_000, 2_150_000, 2_470_000, 2_615_000,
        2_330_000, 2_720_000, 2_845_000, 2_590_000,
    ],
    Retainers: [
        960_000, 960_000, 1_080_000, 1_080_000, 1_080_000, 1_200_000, 1_200_000, 1_200_000, 1_320_000,
        1_320_000, 1_440_000, 1_440_000, 1_440_000,
    ],
    Workshops: [0, 145_000, 0, 210_000, 0, 0, 305_000, 0, 180_000, 0, 260_000, 0, 195_000],
}

const expenseSeries: Record<string, number[]> = {
    Payroll: [
        1_480_000, 1_480_000, 1_480_000, 1_620_000, 1_620_000, 1_620_000, 1_620_000, 1_780_000, 1_780_000,
        1_780_000, 1_780_000, 1_940_000, 1_940_000,
    ],
    Contractors: [
        320_000, 285_000, 410_000, 265_000, 380_000, 445_000, 350_000, 470_000, 505_000, 415_000, 520_000,
        545_000, 480_000,
    ],
    Rent: [
        240_000, 240_000, 240_000, 240_000, 240_000, 240_000, 252_000, 252_000, 252_000, 252_000, 252_000,
        252_000, 252_000,
    ],
    Software: [
        86_000, 86_000, 91_000, 91_000, 94_500, 94_500, 94_500, 99_000, 99_000, 103_500, 103_500, 103_500,
        108_000,
    ],
    Marketing: [
        120_000, 95_000, 150_000, 80_000, 165_000, 185_000, 140_000, 190_000, 210_000, 160_000, 225_000,
        240_000, 205_000,
    ],
    Insurance: [
        42_000, 42_000, 42_000, 42_000, 42_000, 42_000, 42_000, 45_500, 45_500, 45_500, 45_500, 45_500,
        45_500,
    ],
}

/** Fixed balance-sheet series (as-of month end), oldest first. */
const balanceSeries: Record<string, number[]> = {
    Cash: [
        3_240_000, 3_385_000, 3_610_000, 3_420_000, 3_755_000, 4_020_000, 4_180_000, 4_395_000, 4_640_000,
        4_710_000, 5_005_000, 5_240_000, 5_390_000,
    ],
    "Accounts receivable": [
        1_460_000, 1_385_000, 1_620_000, 1_540_000, 1_735_000, 1_820_000, 1_690_000, 1_910_000, 2_045_000,
        1_880_000, 2_130_000, 2_260_000, 2_105_000,
    ],
    "Equipment (net)": [
        920_000, 905_000, 890_000, 875_000, 860_000, 845_000, 830_000, 815_000, 800_000, 785_000, 770_000,
        755_000, 740_000,
    ],
    "Credit card": [
        185_000, 160_000, 205_000, 140_000, 220_000, 245_000, 190_000, 260_000, 285_000, 215_000, 300_000,
        320_000, 270_000,
    ],
    "Loan payable": [
        1_100_000, 1_065_000, 1_030_000, 995_000, 960_000, 925_000, 890_000, 855_000, 820_000, 785_000,
        750_000, 715_000, 680_000,
    ],
    "Owner's equity": [
        1_500_000, 1_500_000, 1_500_000, 1_500_000, 1_500_000, 1_500_000, 1_500_000, 1_500_000, 1_500_000,
        1_500_000, 1_500_000, 1_500_000, 1_500_000,
    ],
}

/** YYYY-MM for the month `monthsAgo` calendar months before the current one. */
function isoMonthMonthsAgo(monthsAgo: number): string {
    const date = new Date()
    date.setUTCDate(1)
    date.setUTCMonth(date.getUTCMonth() - monthsAgo)
    return date.toISOString().slice(0, 7)
}

export function simulatedProfitAndLoss(
    profile: SimulatedCompanyProfile = FLAGSHIP_PROFILE,
): SimulatedProfitAndLossPeriod[] {
    return Array.from({ length: SIMULATED_STATEMENT_MONTHS }, (_, index) => {
        const incomeLines = Object.entries(incomeSeries).map(([category, series]) => ({
            category,
            minorUnits: scaled(series[index], profile),
        }))
        const expenseLines = Object.entries(expenseSeries).map(([category, series]) => ({
            category,
            minorUnits: scaled(series[index], profile),
        }))
        const totalIncomeMinorUnits = incomeLines.reduce((sum, line) => sum + line.minorUnits, 0)
        const totalExpensesMinorUnits = expenseLines.reduce((sum, line) => sum + line.minorUnits, 0)
        return {
            month: isoMonthMonthsAgo(SIMULATED_STATEMENT_MONTHS - 1 - index),
            incomeLines,
            totalIncomeMinorUnits,
            expenseLines,
            totalExpensesMinorUnits,
            netIncomeMinorUnits: totalIncomeMinorUnits - totalExpensesMinorUnits,
        }
    })
}

export function simulatedBalanceSheet(
    profile: SimulatedCompanyProfile = FLAGSHIP_PROFILE,
): SimulatedBalanceSheetPeriod[] {
    return Array.from({ length: SIMULATED_STATEMENT_MONTHS }, (_, index) => {
        const assetLines = ["Cash", "Accounts receivable", "Equipment (net)"].map((category) => ({
            category,
            minorUnits: scaled(balanceSeries[category][index], profile),
        }))
        const liabilityLines = ["Credit card", "Loan payable"].map((category) => ({
            category,
            minorUnits: scaled(balanceSeries[category][index], profile),
        }))
        const totalAssetsMinorUnits = assetLines.reduce((sum, line) => sum + line.minorUnits, 0)
        const totalLiabilitiesMinorUnits = liabilityLines.reduce((sum, line) => sum + line.minorUnits, 0)
        // Retained earnings is the balancing figure, so the accounting
        // identity (assets = liabilities + equity) holds exactly every month.
        const ownersEquityMinorUnits = scaled(balanceSeries["Owner's equity"][index], profile)
        const retainedEarningsMinorUnits =
            totalAssetsMinorUnits - totalLiabilitiesMinorUnits - ownersEquityMinorUnits
        const equityLines = [
            { category: "Owner's equity", minorUnits: ownersEquityMinorUnits },
            { category: "Retained earnings", minorUnits: retainedEarningsMinorUnits },
        ]
        return {
            month: isoMonthMonthsAgo(SIMULATED_STATEMENT_MONTHS - 1 - index),
            assetLines,
            totalAssetsMinorUnits,
            liabilityLines,
            totalLiabilitiesMinorUnits,
            equityLines,
            totalEquityMinorUnits: totalAssetsMinorUnits - totalLiabilitiesMinorUnits,
        }
    })
}

export function simulatedCompanySnapshot(
    profile: SimulatedCompanyProfile = FLAGSHIP_PROFILE,
): SimulatedCompanySnapshot {
    const invoices = simulatedInvoices(profile)
    const byStatus = (status: SimulatedInvoiceStatus): SimulatedInvoice[] =>
        invoices.filter((invoice) => invoice.status === status)
    const unpaid = invoices.filter((invoice) => invoice.status !== "PAID")
    return {
        companyName: profile.companyName,
        currency: SIMULATED_CURRENCY,
        revenueMinorUnits: byStatus("PAID").reduce((sum, invoice) => sum + invoice.totalMinorUnits, 0),
        outstandingMinorUnits: unpaid.reduce((sum, invoice) => sum + invoice.balanceMinorUnits, 0),
        overdueMinorUnits: byStatus("OVERDUE").reduce((sum, invoice) => sum + invoice.balanceMinorUnits, 0),
        paidInvoiceCount: byStatus("PAID").length,
        openInvoiceCount: byStatus("OPEN").length,
        overdueInvoiceCount: byStatus("OVERDUE").length,
        customerCount: customerSeeds.length,
    }
}
