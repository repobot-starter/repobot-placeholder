import { createDomainDatabase } from "./BaseDatabase.js"
import { idempotencyKeysTable } from "./IdempotencyKeys.js"
import { quickBooksConnectionsTable } from "./QuickBooks/QuickBooksConnection.js"

// The QuickBooks domain's database handle. Shares the common pool today; can
// be pointed at a dedicated database later without touching services or
// resolvers.
export const quickBooksDb = createDomainDatabase({
    quickBooksConnectionsTable,
    idempotencyKeysTable,
})

export type QuickBooksDatabase = typeof quickBooksDb
