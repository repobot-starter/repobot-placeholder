import { createInsertSchema } from "drizzle-zod"
import { text } from "drizzle-orm/pg-core"
import { baseTable } from "../BaseTable.js"

export const accountsTable = baseTable("accounts", {
    name: text("name").notNull(),
})

export type Account = typeof accountsTable.$inferSelect
export type NewAccount = typeof accountsTable.$inferInsert

export const accountInsertSchema = createInsertSchema(accountsTable, {
    name: (schema) => schema.trim().min(1),
}).omit({ id: true, rowCreatedAt: true, rowUpdatedAt: true })
