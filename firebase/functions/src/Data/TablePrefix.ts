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

    // Project
    projects: "proj",
    project_memberships: "pmem",

    // Shop
    checkout_sessions: "csn",

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
