import { SQL, sql } from "drizzle-orm"
import { createDomainDatabase } from "./BaseDatabase.js"
import { entryFieldsTable } from "./Entry/EntryField.js"
import { entryRecordsTable } from "./Entry/EntryRecord.js"
import { idempotencyKeysTable } from "./IdempotencyKeys.js"

// The Entry domain's database handle. Shares the common pool today; can be
// pointed at a dedicated database later without touching services or resolvers.
export const entryDb = createDomainDatabase({
    entryFieldsTable,
    entryRecordsTable,
    idempotencyKeysTable,
})

export type EntryDatabase = typeof entryDb

/**
 * Case-insensitive substring match across a record's jsonb cell values
 * (the whole jsonb rendered as text). Raw SQL lives here in the domain's
 * database module, never in the service.
 */
export function entryRecordValuesSearchCondition(search: string): SQL {
    return sql`${entryRecordsTable.values}::text ILIKE ${`%${search}%`}`
}
