/**
 * Registry of table names to row-id prefixes. Every row id is globally
 * identifiable by its prefix (for example "proj_9f2c..."), which makes ids
 * self-describing in logs, URLs, and support tooling.
 */
export const tablePrefixByName = {
    // Identity
    accounts: "acct",
    users: "user",
    auth_identities: "auid",
    auth_email_codes: "acod",
    auth_refresh_tokens: "arft",
    auth_mfa_factors: "amfa",
    auth_mfa_recovery_codes: "amrc",

    // Project
    projects: "proj",
    project_memberships: "pmem",

    // Payments
    checkout_sessions: "csn",
    purchases: "prch",
    subscriptions: "sub",

    // QuickBooks
    quickbooks_connections: "qbc",

    // Cfo
    cfo_memberships: "cfom",
    cfo_invites: "cfoi",

    // Credit
    credit_lcs: "lc",
    credit_documents: "lcd",

    // Flow
    flow_templates: "flt",
    flow_lines: "fll",

    // Entry
    entry_fields: "efd",
    entry_records: "erc",

    // Songs (the AI agent pack's living catalog)
    songs: "sng",

    // Pitch
    pitch_decks: "pdk",
    pitch_slides: "psl",

    // Storage
    uploads: "upld",

    // Drive (the Files/Photos utility packs' shared library)
    drive_entries: "dent",
    drive_albums: "dalb",
    drive_album_entries: "dmem",

    // Jobs
    job_runs: "jrun",

    // Push
    push_devices: "pshd",

    // Mail
    mail_send_counters: "msct",

    // Ai
    ai_embeddings: "aemb",

    // Analytics
    analytics_events: "aevt",
    analytics_daily: "aday",
    analytics_page_daily: "apgd",

    // Infrastructure
    idempotency_keys: "idem",
} as const

export type TableName = keyof typeof tablePrefixByName
export type TablePrefix = (typeof tablePrefixByName)[TableName]

function assertUniqueTablePrefixes(): void {
    const seen = new Map<string, string>()
    for (const [tableName, prefix] of Object.entries(tablePrefixByName)) {
        const existing = seen.get(prefix)
        if (existing !== undefined) {
            throw new Error(`Duplicate table prefix "${prefix}" for "${existing}" and "${tableName}"`)
        }
        seen.set(prefix, tableName)
    }
}

assertUniqueTablePrefixes()

export function getTablePrefix(tableName: TableName): TablePrefix {
    return tablePrefixByName[tableName]
}
