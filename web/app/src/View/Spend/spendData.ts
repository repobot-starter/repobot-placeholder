/**
 * Outlay's demo ledger — the deterministic fixture module behind the spend
 * dashboard (docs/project-ia.md destinations: overview, transactions,
 * budgets, cards). Everything derives from one seeded generator keyed by
 * day-offset, so the data is identical on every load and every machine,
 * while dates stay anchored to "today" and never go stale.
 *
 * Swapping to live data: keep the exported shapes, replace the generators
 * with your queries (see packs/saas/PACK.md, "From fixtures to live data").
 * The pages only consume the exported functions and constants — nothing in
 * them knows the data is synthetic.
 */

/**
 * Dashboard destination paths (repobot.project.json) — string constants like
 * accountingShared's, so pages link across the IA without depending on the
 * scaffolder having run in this checkout.
 */
export const spendPaths = {
    overview: "/overview",
    transactions: "/transactions",
    budgets: "/budgets",
    cards: "/cards",
} as const

export type SpendCategory = "Software" | "Marketing" | "Travel" | "Meals" | "Office" | "Services"

export const SPEND_CATEGORIES: SpendCategory[] = [
    "Software",
    "Marketing",
    "Travel",
    "Meals",
    "Office",
    "Services",
]

export interface SpendMember {
    id: string
    name: string
    role: string
}

export interface SpendMerchant {
    id: string
    name: string
    category: SpendCategory
}

export interface SpendCard {
    id: string
    label: string
    holder: string
    last4: string
    kind: "virtual" | "physical"
    /** Monthly limit in cents. */
    monthlyLimitCents: number
}

export interface SpendTransaction {
    id: string
    /** ISO date (no time) — real calendar dates relative to today. */
    date: string
    merchant: SpendMerchant
    member: SpendMember
    cardId: string
    /** Amount in cents. */
    amountCents: number
    status: "posted" | "pending"
    note?: string
}

export interface SpendBudget {
    category: SpendCategory
    /** Monthly limit in cents. */
    monthlyLimitCents: number
}

export interface SpendApproval {
    id: string
    member: SpendMember
    merchant: string
    purpose: string
    category: SpendCategory
    amountCents: number
    /** Whole days ago the request came in (0 = today). */
    requestedDaysAgo: number
}

// ---------------------------------------------------------------------------
// The cast. All names and merchants are fictional — templates ship no real
// people and no trademarks; the Avatar monogram stands in for logos.
// ---------------------------------------------------------------------------

export const members: SpendMember[] = [
    { id: "priya", name: "Priya Raman", role: "Finance lead" },
    { id: "jonah", name: "Jonah Reyes", role: "Marketing" },
    { id: "nell", name: "Nell Okafor", role: "Engineering" },
    { id: "tomas", name: "Tomas Lindqvist", role: "Sales" },
    { id: "ada", name: "Ada Kaplan", role: "Design" },
    { id: "miles", name: "Miles Grant", role: "Operations" },
    { id: "sofia", name: "Sofia Marchetti", role: "Engineering" },
    { id: "dev", name: "Dev Patel", role: "Sales" },
]

export const merchants: SpendMerchant[] = [
    { id: "beacon", name: "Beacon Cloud", category: "Software" },
    { id: "fieldnote", name: "Fieldnote Analytics", category: "Software" },
    { id: "quillboard", name: "Quillboard", category: "Software" },
    { id: "relaylab", name: "Relaylab", category: "Software" },
    { id: "wavelength", name: "Wavelength Ads", category: "Marketing" },
    { id: "grove", name: "Signal & Grove", category: "Marketing" },
    { id: "adcastle", name: "Adcastle", category: "Marketing" },
    { id: "skylark", name: "Skylark Air", category: "Travel" },
    { id: "harborlane", name: "Harbor Lane Hotels", category: "Travel" },
    { id: "transit", name: "City Transit", category: "Travel" },
    { id: "copperline", name: "Copperline Coffee", category: "Meals" },
    { id: "goldenhour", name: "Golden Hour Catering", category: "Meals" },
    { id: "noonmarket", name: "Noon Market", category: "Meals" },
    { id: "brightpine", name: "Brightpine Supplies", category: "Office" },
    { id: "printpost", name: "Print & Post", category: "Office" },
    { id: "ledgerline", name: "Ledgerline Accounting", category: "Services" },
]

export const cards: SpendCard[] = [
    {
        id: "card-eng",
        label: "Engineering",
        holder: "Nell Okafor",
        last4: "4127",
        kind: "virtual",
        monthlyLimitCents: 2_000_000,
    },
    {
        id: "card-mkt",
        label: "Marketing",
        holder: "Jonah Reyes",
        last4: "8843",
        kind: "virtual",
        monthlyLimitCents: 1_600_000,
    },
    {
        id: "card-sales",
        label: "Sales travel",
        holder: "Tomas Lindqvist",
        last4: "2210",
        kind: "physical",
        monthlyLimitCents: 1_400_000,
    },
    {
        id: "card-ops",
        label: "Operations",
        holder: "Miles Grant",
        last4: "9954",
        kind: "physical",
        monthlyLimitCents: 800_000,
    },
    {
        id: "card-design",
        label: "Design tools",
        holder: "Ada Kaplan",
        last4: "6371",
        kind: "virtual",
        monthlyLimitCents: 800_000,
    },
    {
        id: "card-exec",
        label: "Team events",
        holder: "Priya Raman",
        last4: "1085",
        kind: "virtual",
        monthlyLimitCents: 600_000,
    },
]

export const budgets: SpendBudget[] = [
    { category: "Software", monthlyLimitCents: 2_400_000 },
    { category: "Marketing", monthlyLimitCents: 2_000_000 },
    { category: "Travel", monthlyLimitCents: 1_600_000 },
    { category: "Meals", monthlyLimitCents: 400_000 },
    { category: "Office", monthlyLimitCents: 250_000 },
    { category: "Services", monthlyLimitCents: 500_000 },
]

export const approvals: SpendApproval[] = [
    {
        id: "apr-1",
        member: members[1],
        merchant: "Wavelength Ads",
        purpose: "Q3 campaign — search retargeting",
        category: "Marketing",
        amountCents: 245_000,
        requestedDaysAgo: 0,
    },
    {
        id: "apr-2",
        member: members[3],
        merchant: "Skylark Air",
        purpose: "Client visit — Chicago, two seats",
        category: "Travel",
        amountCents: 118_400,
        requestedDaysAgo: 0,
    },
    {
        id: "apr-3",
        member: members[2],
        merchant: "Beacon Cloud",
        purpose: "Staging cluster upgrade",
        category: "Software",
        amountCents: 89_900,
        requestedDaysAgo: 1,
    },
    {
        id: "apr-4",
        member: members[4],
        merchant: "Quillboard",
        purpose: "Two more design seats",
        category: "Software",
        amountCents: 4_800,
        requestedDaysAgo: 1,
    },
    {
        id: "apr-5",
        member: members[5],
        merchant: "Golden Hour Catering",
        purpose: "Offsite lunch — 24 people",
        category: "Meals",
        amountCents: 62_500,
        requestedDaysAgo: 2,
    },
    {
        id: "apr-6",
        member: members[7],
        merchant: "Harbor Lane Hotels",
        purpose: "Conference block — 3 nights",
        category: "Travel",
        amountCents: 174_000,
        requestedDaysAgo: 3,
    },
]

// ---------------------------------------------------------------------------
// Deterministic generation. A small hash over (seed, dayOffset, slot) drives
// every choice; day-of-week rhythm keys off `dayOffset % 7`, not the real
// weekday, so aggregate totals are identical no matter when the app runs.
// ---------------------------------------------------------------------------

const DAYS = 90

function mix(...parts: number[]): number {
    let hash = 2166136261
    for (const part of parts) {
        hash ^= part + 0x9e3779b9
        hash = Math.imul(hash, 16777619)
    }
    return (hash >>> 0) / 4294967296
}

/** Monthly recurring charges — the subscription spine of the ledger. */
const RECURRING: { merchantId: string; amountCents: number; memberId: string; cardId: string }[] = [
    { merchantId: "beacon", amountCents: 198_212, memberId: "nell", cardId: "card-eng" },
    { merchantId: "fieldnote", amountCents: 64_900, memberId: "nell", cardId: "card-eng" },
    { merchantId: "quillboard", amountCents: 28_800, memberId: "ada", cardId: "card-design" },
    { merchantId: "relaylab", amountCents: 12_000, memberId: "sofia", cardId: "card-eng" },
    { merchantId: "ledgerline", amountCents: 125_000, memberId: "priya", cardId: "card-ops" },
    { merchantId: "wavelength", amountCents: 145_000, memberId: "jonah", cardId: "card-mkt" },
]

/** Spot-spend amount ranges per category, in cents. */
const SPOT_RANGES: Record<SpendCategory, [number, number]> = {
    Software: [6_900, 118_000],
    Marketing: [16_000, 96_000],
    Travel: [18_500, 152_000],
    Meals: [1_800, 22_000],
    Office: [3_800, 52_000],
    Services: [36_000, 120_000],
}

/**
 * Category weights for spot picks — Software leads the mix (the SaaS-stack
 * read), Meals is frequent but small, Services is rare.
 */
const SPOT_WEIGHTS: Record<SpendCategory, number> = {
    Software: 3,
    Marketing: 2,
    Travel: 2,
    Meals: 3,
    Office: 1,
    Services: 1,
}

/** Weighted merchant pool for spot spend (recurring-only ones excluded). */
const SPOT_MERCHANTS = merchants
    .filter((merchant) => merchant.id !== "ledgerline")
    .flatMap((merchant) => Array<SpendMerchant>(SPOT_WEIGHTS[merchant.category]).fill(merchant))

function memberFor(merchant: SpendMerchant, roll: number): SpendMember {
    const byCategory: Record<SpendCategory, string[]> = {
        Software: ["nell", "sofia"],
        Marketing: ["jonah", "ada"],
        Travel: ["tomas", "dev"],
        Meals: ["miles", "jonah", "tomas", "nell", "dev"],
        Office: ["miles", "priya"],
        Services: ["priya", "miles"],
    }
    const pool = byCategory[merchant.category]
    const id = pool[Math.floor(roll * pool.length)]
    return members.find((member) => member.id === id) as SpendMember
}

function cardFor(member: SpendMember): SpendCard {
    const byMember: Record<string, string> = {
        priya: "card-exec",
        jonah: "card-mkt",
        nell: "card-eng",
        tomas: "card-sales",
        ada: "card-design",
        miles: "card-ops",
        sofia: "card-eng",
        dev: "card-sales",
    }
    return cards.find((card) => card.id === byMember[member.id]) as SpendCard
}

function isoDaysAgo(daysAgo: number): string {
    const date = new Date()
    date.setHours(12, 0, 0, 0)
    date.setDate(date.getDate() - daysAgo)
    return date.toISOString().slice(0, 10)
}

function buildTransactions(): SpendTransaction[] {
    const rows: SpendTransaction[] = []
    for (let daysAgo = 0; daysAgo < DAYS; daysAgo += 1) {
        const offset = DAYS - 1 - daysAgo
        // Synthetic week rhythm: two quiet days per 7-day cycle.
        const cycle = offset % 7
        const quiet = cycle === 5 || cycle === 6
        // Recurring charges land on a fixed day each 30-day cycle.
        RECURRING.forEach((entry, index) => {
            if (offset % 30 === (index * 11) % 30) {
                const merchant = merchants.find((m) => m.id === entry.merchantId) as SpendMerchant
                const member = members.find((m) => m.id === entry.memberId) as SpendMember
                rows.push({
                    id: `rec-${offset}-${entry.merchantId}`,
                    date: isoDaysAgo(daysAgo),
                    merchant,
                    member,
                    cardId: entry.cardId,
                    amountCents: entry.amountCents,
                    status: "posted",
                    note: "Monthly subscription",
                })
            }
        })
        const spotCount = quiet ? 1 : 2 + Math.floor(mix(offset, 1) * 3)
        const usedMerchants = new Set<string>()
        for (let slot = 0; slot < spotCount; slot += 1) {
            // Walk forward from the seeded pick until the merchant is new for
            // the day — repeat charges from one merchant on one day read as a
            // generator artifact, not a ledger.
            let pick = Math.floor(mix(offset, 2, slot) * SPOT_MERCHANTS.length)
            while (usedMerchants.has(SPOT_MERCHANTS[pick].id)) {
                pick = (pick + 1) % SPOT_MERCHANTS.length
            }
            const merchant = SPOT_MERCHANTS[pick]
            usedMerchants.add(merchant.id)
            const [low, high] = SPOT_RANGES[merchant.category]
            const amountCents = Math.round((low + mix(offset, 3, slot) * (high - low)) / 25) * 25
            const member = memberFor(merchant, mix(offset, 4, slot))
            rows.push({
                id: `txn-${offset}-${slot}`,
                date: isoDaysAgo(daysAgo),
                merchant,
                member,
                cardId: cardFor(member).id,
                amountCents,
                status: daysAgo === 0 && slot === 0 ? "pending" : "posted",
            })
        }
    }
    return rows
}

/** The full 90-day ledger, newest first. */
export const transactions: SpendTransaction[] = buildTransactions()

// ---------------------------------------------------------------------------
// Aggregations the pages consume.
// ---------------------------------------------------------------------------

function daysAgoOf(transaction: SpendTransaction): number {
    const today = new Date()
    today.setHours(12, 0, 0, 0)
    const then = new Date(`${transaction.date}T12:00:00`)
    return Math.round((today.getTime() - then.getTime()) / 86_400_000)
}

/** Sum of a window ending today, in cents. */
export function totalInWindow(fromDaysAgo: number, toDaysAgo: number): number {
    return transactions
        .filter((transaction) => {
            const age = daysAgoOf(transaction)
            return age >= toDaysAgo && age < fromDaysAgo
        })
        .reduce((sum, transaction) => sum + transaction.amountCents, 0)
}

export interface DailyPoint {
    /** Short label, e.g. "Aug 12". */
    label: string
    cents: number
}

const SHORT_DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" })

/** Daily spend for the last `days` days, oldest first. */
export function dailySpend(days: number): DailyPoint[] {
    const byAge = new Map<number, number>()
    for (const transaction of transactions) {
        const age = daysAgoOf(transaction)
        if (age < days) {
            byAge.set(age, (byAge.get(age) ?? 0) + transaction.amountCents)
        }
    }
    const points: DailyPoint[] = []
    for (let age = days - 1; age >= 0; age -= 1) {
        const date = new Date()
        date.setHours(12, 0, 0, 0)
        date.setDate(date.getDate() - age)
        points.push({ label: SHORT_DATE.format(date), cents: byAge.get(age) ?? 0 })
    }
    return points
}

/** Spend by category over the last `days` days, largest first. */
export function spendByCategory(days: number): { category: SpendCategory; cents: number }[] {
    const byCategory = new Map<SpendCategory, number>()
    for (const transaction of transactions) {
        if (daysAgoOf(transaction) < days) {
            const key = transaction.merchant.category
            byCategory.set(key, (byCategory.get(key) ?? 0) + transaction.amountCents)
        }
    }
    return [...byCategory.entries()]
        .map(([category, cents]) => ({ category, cents }))
        .sort((a, b) => b.cents - a.cents)
}

/** Weekly totals over the last 12 synthetic weeks — sparkline food. */
export function weeklyTrend(): number[] {
    const buckets = new Array<number>(12).fill(0)
    for (const transaction of transactions) {
        const age = daysAgoOf(transaction)
        const bucket = 11 - Math.floor(age / 7)
        if (bucket >= 0 && bucket < 12) {
            buckets[bucket] += transaction.amountCents
        }
    }
    return buckets
}

/** Spend this month (last 30 days) per budget category, in cents. */
export function budgetSpent(category: SpendCategory): number {
    return transactions
        .filter((transaction) => transaction.merchant.category === category && daysAgoOf(transaction) < 30)
        .reduce((sum, transaction) => sum + transaction.amountCents, 0)
}

/** Spend this month (last 30 days) per card, in cents. */
export function cardSpent(cardId: string): number {
    return transactions
        .filter((transaction) => transaction.cardId === cardId && daysAgoOf(transaction) < 30)
        .reduce((sum, transaction) => sum + transaction.amountCents, 0)
}

// ---------------------------------------------------------------------------
// Formatting.
// ---------------------------------------------------------------------------

const USD = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
})

const USD_EXACT = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

/** Whole-dollar display for KPIs and charts: "$128,400". */
export function formatUsd(cents: number): string {
    return USD.format(Math.round(cents / 100))
}

/** Exact display for ledger rows: "$1,982.12". */
export function formatUsdExact(cents: number): string {
    return USD_EXACT.format(cents / 100)
}

const MEDIUM_DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" })

/** "Aug 24, 2026" from an ISO transaction date. */
export function formatDate(isoDate: string): string {
    return MEDIUM_DATE.format(new Date(`${isoDate}T12:00:00`))
}
