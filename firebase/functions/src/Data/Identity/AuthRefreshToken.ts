import { text, timestamp, unique, index } from "drizzle-orm/pg-core"
import { baseTable } from "../BaseTable.js"

/**
 * One row per issued refresh token, stored as a SHA-256 hash. Tokens are
 * single-use: a refresh consumes the row (consumed_at) and issues a new one.
 * Presenting an already-consumed token is treated as theft and revokes every
 * live token for the identity.
 */
export const authRefreshTokensTable = baseTable(
    "auth_refresh_tokens",
    {
        // References auth_identities.id (the JWT sub).
        authSubject: text("auth_subject").notNull(),
        // SHA-256 (hex) of the opaque token handed to the client.
        tokenHash: text("token_hash").notNull(),
        expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
        consumedAt: timestamp("consumed_at", { withTimezone: true }),
        revokedAt: timestamp("revoked_at", { withTimezone: true }),
    },
    (table) => [
        unique("auth_refresh_tokens_token_hash_unique").on(table.tokenHash),
        index("auth_refresh_tokens_auth_subject_idx").on(table.authSubject),
    ],
)

export type AuthRefreshToken = typeof authRefreshTokensTable.$inferSelect
export type NewAuthRefreshToken = typeof authRefreshTokensTable.$inferInsert
