import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

/**
 * Maps caller-supplied idempotency keys to the row that the first successful
 * request created. See Data/Utils/idempotentInsertAndGet: retried mutations
 * with the same key return the original row instead of inserting a duplicate.
 */
export const idempotencyKeysTable = pgTable("idempotency_keys", {
    key: text("key").primaryKey(),
    rowId: text("row_id").notNull(),
    rowCreatedAt: timestamp("row_created_at", { withTimezone: true }).notNull().defaultNow(),
})

export type IdempotencyKeyRow = typeof idempotencyKeysTable.$inferSelect
