import { sql } from "drizzle-orm"
import { check, text, unique } from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"
import { z } from "zod"
import { baseTable } from "../BaseTable.js"

export const allUserStatuses = ["ACTIVE", "DISABLED"] as const
export type UserStatus = (typeof allUserStatuses)[number]

export const usersTable = baseTable(
    "users",
    {
        // References accounts.id by convention only. There is no cross-database
        // foreign key because Identity tables may move to their own database;
        // UserService validates account existence at write time instead.
        accountId: text("account_id").notNull(),
        email: text("email").notNull(),
        displayName: text("display_name").notNull(),
        status: text("status", { enum: allUserStatuses }).notNull(),
        // The identity provider subject (auth_identities id, or the fixed
        // local dev subject). Null until the user first signs in.
        authSubject: text("auth_subject"),
    },
    (table) => [
        unique("users_email_unique").on(table.email),
        unique("users_auth_subject_unique").on(table.authSubject),
        // Must match migrations/*.sql exactly for drift-check to stay green.
        check("users_status_check", sql`${table.status} IN ('ACTIVE', 'DISABLED')`),
    ],
)

export type User = typeof usersTable.$inferSelect
export type NewUser = typeof usersTable.$inferInsert

export const userInsertSchema = createInsertSchema(usersTable, {
    email: (schema) => schema.trim().toLowerCase().pipe(z.string().email()),
    displayName: (schema) => schema.trim().min(1),
}).omit({ id: true, rowCreatedAt: true, rowUpdatedAt: true })

export const userUpdateSchema = userInsertSchema.pick({ displayName: true, status: true }).partial()
