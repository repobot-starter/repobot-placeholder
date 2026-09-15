import { jsonb } from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"
import { z } from "zod"
import { baseTable } from "../BaseTable.js"

/** A record's cell values, keyed by the owning field's fieldKey. */
export type EntryRecordValues = Record<string, unknown>

/**
 * One row of the workbook. `values` keeps the cells as jsonb keyed by
 * fieldKey; cells for deleted fields are kept (orphaned) by design.
 */
export const entryRecordsTable = baseTable("entry_records", {
    values: jsonb("values").$type<EntryRecordValues>().notNull().default({}),
})

export type EntryRecord = typeof entryRecordsTable.$inferSelect
export type NewEntryRecord = typeof entryRecordsTable.$inferInsert

export const entryRecordInsertSchema = createInsertSchema(entryRecordsTable, {
    values: () => z.record(z.unknown()),
}).omit({ id: true, rowCreatedAt: true, rowUpdatedAt: true })

export const entryRecordUpdateSchema = entryRecordInsertSchema.pick({ values: true }).partial()
