import { sql } from "drizzle-orm"
import { boolean, check, integer, jsonb, text, unique } from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"
import { z } from "zod"
import { baseTable } from "../BaseTable.js"

export const allEntryFieldTypes = ["TEXT", "NUMBER", "DATE", "YESNO", "SELECT"] as const
export type EntryFieldType = (typeof allEntryFieldTypes)[number]

/**
 * One user-defined column of the workbook. `fieldKey` is the stable cell key
 * inside a record's values, derived from the label at create and immutable
 * afterwards (so renaming a field never orphans its cells).
 */
export const entryFieldsTable = baseTable(
    "entry_fields",
    {
        label: text("label").notNull(),
        fieldKey: text("field_key").notNull(),
        fieldType: text("field_type", { enum: allEntryFieldTypes }).notNull(),
        required: boolean("required").notNull().default(false),
        // Choices for SELECT fields; null for every other type.
        options: jsonb("options").$type<string[]>(),
        // Column order, ascending.
        position: integer("position").notNull(),
    },
    (table) => [
        unique("entry_fields_field_key_unique").on(table.fieldKey),
        // Must match migrations/*.sql exactly for drift-check to stay green.
        check(
            "entry_fields_field_type_check",
            sql`${table.fieldType} IN ('TEXT', 'NUMBER', 'DATE', 'YESNO', 'SELECT')`,
        ),
    ],
)

export type EntryField = typeof entryFieldsTable.$inferSelect
export type NewEntryField = typeof entryFieldsTable.$inferInsert

export const entryFieldInsertSchema = createInsertSchema(entryFieldsTable, {
    label: (schema) => schema.trim().min(1).max(120),
    fieldKey: (schema) => schema.trim().min(1),
    options: () => z.array(z.string().trim().min(1)).nullable().optional(),
    position: (schema) => schema.int().min(0),
}).omit({ id: true, rowCreatedAt: true, rowUpdatedAt: true })

export const entryFieldUpdateSchema = entryFieldInsertSchema
    .pick({ label: true, required: true, options: true })
    .partial()
