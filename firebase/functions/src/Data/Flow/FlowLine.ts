import { sql } from "drizzle-orm"
import { check, integer, text } from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"
import { baseTable } from "../BaseTable.js"

export const allFlowSections = ["INCOME", "EXPENSES"] as const
export type FlowSection = (typeof allFlowSections)[number]

/**
 * One row of a budget grid. `budgets` keeps the planned amount per grid
 * month as comma-joined integer minor units (always exactly the template's
 * monthCount entries — the service owns that invariant). `linkedCategory`
 * names a P&L statement line on the owner's books; when set, actuals for
 * the row auto-populate from the live connection and variance is computed.
 */
export const flowLinesTable = baseTable(
    "flow_lines",
    {
        templateId: text("template_id").notNull(),
        position: integer("position").notNull(),
        label: text("label").notNull(),
        section: text("section", { enum: allFlowSections }).notNull(),
        // A P&L category on the owner's books, or null for an unlinked row.
        linkedCategory: text("linked_category"),
        // Comma-joined integer minor units, one per grid month.
        budgets: text("budgets").notNull(),
    },
    (table) => [
        // Must match migrations/*.sql exactly for drift-check to stay green.
        check("flow_lines_section_check", sql`${table.section} IN ('INCOME', 'EXPENSES')`),
    ],
)

export type FlowLine = typeof flowLinesTable.$inferSelect
export type NewFlowLine = typeof flowLinesTable.$inferInsert

export const flowLineInsertSchema = createInsertSchema(flowLinesTable, {
    templateId: (schema) => schema.trim().min(1),
    position: (schema) => schema.int().min(0),
    label: (schema) => schema.trim().min(1).max(120),
}).omit({ id: true, rowCreatedAt: true, rowUpdatedAt: true })
