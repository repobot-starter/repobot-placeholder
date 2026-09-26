import { sql } from "drizzle-orm"
import { check, text } from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"
import { baseTable } from "../BaseTable.js"
import { allCfoRoles } from "./CfoMembership.js"

export const allCfoInviteStatuses = ["PENDING", "ACCEPTED", "REVOKED"] as const
export type CfoInviteStatus = (typeof allCfoInviteStatuses)[number]

/**
 * An email invite into the practice. There is no token round-trip: the
 * invited address signs up through the normal auth surface, and
 * ensureMembership resolves the pending invite into a CLIENT membership by
 * email match.
 */
export const cfoInvitesTable = baseTable(
    "cfo_invites",
    {
        // Lowercased; matched against the signing-in user's email.
        email: text("email").notNull(),
        role: text("role", { enum: allCfoRoles }).notNull().default("CLIENT"),
        status: text("status", { enum: allCfoInviteStatuses }).notNull().default("PENDING"),
        invitedByUserId: text("invited_by_user_id").notNull(),
        acceptedByUserId: text("accepted_by_user_id"),
    },
    (table) => [
        // Must match migrations/*.sql exactly for drift-check to stay green.
        check("cfo_invites_role_check", sql`${table.role} IN ('ADVISOR', 'CLIENT')`),
        check("cfo_invites_status_check", sql`${table.status} IN ('PENDING', 'ACCEPTED', 'REVOKED')`),
    ],
)

export type CfoInvite = typeof cfoInvitesTable.$inferSelect
export type NewCfoInvite = typeof cfoInvitesTable.$inferInsert

export const cfoInviteInsertSchema = createInsertSchema(cfoInvitesTable, {
    email: (schema) => schema.trim().toLowerCase().email(),
    invitedByUserId: (schema) => schema.trim().min(1),
}).omit({ id: true, rowCreatedAt: true, rowUpdatedAt: true })
