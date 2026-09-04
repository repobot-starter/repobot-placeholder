import { sql } from "drizzle-orm"
import { check, index, integer, text, timestamp } from "drizzle-orm/pg-core"
import { baseTable } from "../BaseTable.js"

export const allAuthEmailCodePurposes = ["SIGN_IN", "SIGN_UP", "RECOVERY"] as const
export type AuthEmailCodePurpose = (typeof allAuthEmailCodePurposes)[number]

/**
 * One row per emailed one-time code. The 6-digit code and the long link token
 * (the magic-link fallback in the same email) are both stored hashed; a row
 * is spent by setting consumed_at. Verification failures increment
 * attempt_count until the cap invalidates the row.
 */
export const authEmailCodesTable = baseTable(
    "auth_email_codes",
    {
        email: text("email").notNull(),
        purpose: text("purpose", { enum: allAuthEmailCodePurposes }).notNull(),
        // SHA-256 (hex) of the 6-digit code.
        codeHash: text("code_hash").notNull(),
        // SHA-256 (hex) of the emailed link token ({{ .ConfirmationURL }}).
        linkTokenHash: text("link_token_hash").notNull(),
        expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
        consumedAt: timestamp("consumed_at", { withTimezone: true }),
        attemptCount: integer("attempt_count").notNull().default(0),
    },
    (table) => [
        index("auth_email_codes_email_idx").on(table.email),
        // Must match migrations/*.sql exactly for drift-check to stay green.
        check("auth_email_codes_purpose_check", sql`${table.purpose} IN ('SIGN_IN', 'SIGN_UP', 'RECOVERY')`),
    ],
)

export type AuthEmailCode = typeof authEmailCodesTable.$inferSelect
export type NewAuthEmailCode = typeof authEmailCodesTable.$inferInsert
