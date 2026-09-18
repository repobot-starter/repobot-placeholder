import { sql } from "drizzle-orm"
import { check, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"
import { baseTable } from "../BaseTable.js"

export const allProjectStatuses = ["ACTIVE", "ARCHIVED"] as const
export type ProjectStatus = (typeof allProjectStatuses)[number]

export const projectsTable = baseTable(
    "projects",
    {
        name: text("name").notNull(),
        description: text("description"),
        status: text("status", { enum: allProjectStatuses }).notNull(),
        // References users.id by convention (no cross-db FK; see BaseDatabase.ts).
        createdByUserId: text("created_by_user_id").notNull(),
        archivedAt: timestamp("archived_at", { withTimezone: true }),
    },
    (table) => [
        // Must match migrations/*.sql exactly for drift-check to stay green.
        check("projects_status_check", sql`${table.status} IN ('ACTIVE', 'ARCHIVED')`),
    ],
)

export type Project = typeof projectsTable.$inferSelect
export type NewProject = typeof projectsTable.$inferInsert

export const projectInsertSchema = createInsertSchema(projectsTable, {
    name: (schema) => schema.trim().min(1),
}).omit({ id: true, rowCreatedAt: true, rowUpdatedAt: true })

export const projectUpdateSchema = projectInsertSchema
    .pick({ name: true, description: true, status: true, archivedAt: true })
    .partial()
