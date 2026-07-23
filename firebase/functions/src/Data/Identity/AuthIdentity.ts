import { sql } from "drizzle-orm"
import { boolean, check, integer, text, timestamp, unique } from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"
import { z } from "zod"
import { baseTable } from "../BaseTable.js"

/**
 * One row per identity the built-in auth service has issued tokens for. The
 * row id ("auid_...") is the JWT `sub` claim and what `users.auth_subject`
 * links to. Email-keyed methods (OTP, password) and Google OAuth resolve to
 * the same identity when they share an email; anonymous (guest) identities
 * have no email.
 */
export const authIdentitiesTable = baseTable(
    "auth_identities",
    {
        // Null only for anonymous identities.
        email: text("email"),
        // scrypt hash in PasswordHashing.ts format; null until a password is set.
        passwordHash: text("password_hash"),
        // Google's stable OpenID subject, when the identity linked via Google.
        googleSubject: text("google_subject"),
        displayName: text("display_name"),
        isAnonymous: boolean("is_anonymous").notNull().default(false),
        // Set when the email was proven (OTP verified, signup confirmed, or a
        // verified Google email). Password sign-in requires it.
        emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
        // Brute-force guard for password sign-in.
        failedPasswordAttempts: integer("failed_password_attempts").notNull().default(0),
        lockedOutUntil: timestamp("locked_out_until", { withTimezone: true }),
        lastSignInAt: timestamp("last_sign_in_at", { withTimezone: true }),
    },
    (table) => [
        unique("auth_identities_email_unique").on(table.email),
        unique("auth_identities_google_subject_unique").on(table.googleSubject),
        // Must match migrations/*.sql exactly for drift-check to stay green.
        check(
            "auth_identities_email_or_anonymous_check",
            sql`${table.email} IS NOT NULL OR ${table.isAnonymous} = true`,
        ),
    ],
)

export type AuthIdentity = typeof authIdentitiesTable.$inferSelect
export type NewAuthIdentity = typeof authIdentitiesTable.$inferInsert

export const authIdentityInsertSchema = createInsertSchema(authIdentitiesTable, {
    email: (schema) => schema.trim().toLowerCase().pipe(z.string().email()).nullish(),
}).omit({ id: true, rowCreatedAt: true, rowUpdatedAt: true })
