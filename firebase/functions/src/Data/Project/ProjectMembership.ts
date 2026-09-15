import { sql } from "drizzle-orm"
import { check, text, unique } from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"
import { baseTable } from "../BaseTable.js"

export const allProjectMembershipRoles = ["OWNER", "EDITOR", "VIEWER"] as const
export type ProjectMembershipRole = (typeof allProjectMembershipRoles)[number]

export const projectMembershipsTable = baseTable(
    "project_memberships",
    {
        projectId: text("project_id").notNull(),
        // References users.id by convention (no cross-db FK; see BaseDatabase.ts).
        userId: text("user_id").notNull(),
        role: text("role", { enum: allProjectMembershipRoles }).notNull(),
    },
    (table) => [
        unique("project_memberships_project_id_user_id_unique").on(table.projectId, table.userId),
        // Must match migrations/*.sql exactly for drift-check to stay green.
        check("project_memberships_role_check", sql`${table.role} IN ('OWNER', 'EDITOR', 'VIEWER')`),
    ],
)

export type ProjectMembership = typeof projectMembershipsTable.$inferSelect
export type NewProjectMembership = typeof projectMembershipsTable.$inferInsert

export const projectMembershipInsertSchema = createInsertSchema(projectMembershipsTable).omit({
    id: true,
    rowCreatedAt: true,
    rowUpdatedAt: true,
})
