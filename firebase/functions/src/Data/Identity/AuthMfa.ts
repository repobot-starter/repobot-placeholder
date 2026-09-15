import { integer, text, timestamp, unique, index } from "drizzle-orm/pg-core"
import { baseTable } from "../BaseTable.js"

/**
 * One TOTP factor per identity (unique auth_subject; v1 is single-factor).
 * The secret is AES-256-GCM-encrypted with a key derived from
 * AUTH_JWT_SECRET (see MfaSecretCipher in BuiltinAuthService.ts). A factor
 * only gates sign-in once confirmed_at is set — an abandoned enrollment can
 * never lock its owner out. failed_attempts/locked_until throttle
 * verification (5 failures lock the challenge for 15 minutes).
 */
export const authMfaFactorsTable = baseTable(
    "auth_mfa_factors",
    {
        // References auth_identities.id (the JWT sub).
        authSubject: text("auth_subject").notNull(),
        // AES-256-GCM ciphertext (base64url iv.tag.data) of the base32 secret.
        secretEncrypted: text("secret_encrypted").notNull(),
        confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
        failedAttempts: integer("failed_attempts").notNull().default(0),
        lockedUntil: timestamp("locked_until", { withTimezone: true }),
    },
    (table) => [unique("auth_mfa_factors_auth_subject_unique").on(table.authSubject)],
)

export type AuthMfaFactor = typeof authMfaFactorsTable.$inferSelect

/**
 * Single-use recovery codes, ten per enrollment, stored as SHA-256 hashes
 * (the same discipline as refresh tokens). Consuming one sets used_at.
 */
export const authMfaRecoveryCodesTable = baseTable(
    "auth_mfa_recovery_codes",
    {
        authSubject: text("auth_subject").notNull(),
        codeHash: text("code_hash").notNull(),
        usedAt: timestamp("used_at", { withTimezone: true }),
    },
    (table) => [index("auth_mfa_recovery_codes_auth_subject_idx").on(table.authSubject)],
)

export type AuthMfaRecoveryCode = typeof authMfaRecoveryCodesTable.$inferSelect
