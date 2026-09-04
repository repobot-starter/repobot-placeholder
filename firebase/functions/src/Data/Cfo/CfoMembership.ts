import { sql } from "drizzle-orm"
import { check, text, unique } from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"
import { baseTable } from "../BaseTable.js"

export const allCfoRoles = ["ADVISOR", "CLIENT"] as const
export type CfoRole = (typeof allCfoRoles)[number]

/**
 * One user's role in the CFO practice (the practice is the workspace, so
 * membership is one row per user). The first user to touch the CFO surface
 * becomes the ADVISOR; everyone after — invited or self-served — is a
 * CLIENT. See CfoService.ensureMembership.
 */
export const cfoMembershipsTable = baseTable(
    "cfo_memberships",
    {
        // References users.id by convention (no cross-db FK; see BaseDatabase.ts).
        userId: text("user_id").notNull(),
        role: text("role", { enum: allCfoRoles }).notNull(),
        // The advisor whose invite created this membership, when there was one.
        invitedByUserId: text("invited_by_user_id"),
    },
    (table) => [
        // Must match migrations/*.sql exactly for drift-check to stay green.
        unique("cfo_memberships_user_id_unique").on(table.userId),
        check("cfo_memberships_role_check", sql`${table.role} IN ('ADVISOR', 'CLIENT')`),
    ],
)

export type CfoMembership = typeof cfoMembershipsTable.$inferSelect
export type NewCfoMembership = typeof cfoMembershipsTable.$inferInsert

export const cfoMembershipInsertSchema = createInsertSchema(cfoMembershipsTable, {
    userId: (schema) => schema.trim().min(1),
}).omit({ id: true, rowCreatedAt: true, rowUpdatedAt: true })
