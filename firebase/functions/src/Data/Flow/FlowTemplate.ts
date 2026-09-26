import { sql } from "drizzle-orm"
import { check, integer, text } from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"
import { baseTable } from "../BaseTable.js"

/** The kernel caps grids at two years of months; the UI defaults to twelve. */
export const FLOW_MAX_MONTH_COUNT = 24

/**
 * A budget/forecast template: a named grid whose columns are consecutive
 * calendar months starting at startMonth and whose rows are flow_lines.
 * Actuals and variance are computed at read time from the owner's live
 * accounting connection — only the plan (the budgets) is stored.
 */
export const flowTemplatesTable = baseTable(
    "flow_templates",
    {
        // The member who owns the grid; rows are strictly per-user.
        userId: text("user_id").notNull(),
        name: text("name").notNull(),
        // First grid month as ISO yyyy-mm.
        startMonth: text("start_month").notNull(),
        monthCount: integer("month_count").notNull(),
        // Lowercase ISO currency code; the sample companies report in USD.
        currency: text("currency").notNull().default("usd"),
    },
    (table) => [
        // Must match migrations/*.sql exactly for drift-check to stay green.
        check(
            "flow_templates_month_count_check",
            sql`${table.monthCount} >= 1 AND ${table.monthCount} <= 24`,
        ),
    ],
)

export type FlowTemplate = typeof flowTemplatesTable.$inferSelect
export type NewFlowTemplate = typeof flowTemplatesTable.$inferInsert

export const flowTemplateInsertSchema = createInsertSchema(flowTemplatesTable, {
    userId: (schema) => schema.trim().min(1),
    name: (schema) => schema.trim().min(1).max(120),
    startMonth: (schema) => schema.regex(/^\d{4}-\d{2}$/),
    monthCount: (schema) => schema.int().min(1).max(FLOW_MAX_MONTH_COUNT),
    currency: (schema) => schema.trim().toLowerCase().length(3),
}).omit({ id: true, rowCreatedAt: true, rowUpdatedAt: true })
