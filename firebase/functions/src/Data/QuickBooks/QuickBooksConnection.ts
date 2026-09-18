import { sql } from "drizzle-orm"
import { check, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"
import { baseTable } from "../BaseTable.js"

export const allQuickBooksModes = ["LOCAL", "INTUIT"] as const
export type QuickBooksMode = (typeof allQuickBooksModes)[number]

export const allAccountingProviders = ["QUICKBOOKS", "XERO"] as const
export type AccountingProvider = (typeof allAccountingProviders)[number]

/**
 * The workspace's accounting company connection (QuickBooks or Xero). LOCAL
 * connections (the sandbox simulation, QUICKBOOKS_MODE=local) never carry
 * OAuth tokens; INTUIT connections store their Intuit tokens here, refreshed
 * in place before reads (Intuit rotates the refresh token on every refresh).
 */
export const quickBooksConnectionsTable = baseTable(
    "quickbooks_connections",
    {
        // The QuickBooks company (realm) id this connection is bound to.
        realmId: text("realm_id").notNull(),
        companyName: text("company_name").notNull(),
        mode: text("mode", { enum: allQuickBooksModes }).notNull(),
        provider: text("provider", { enum: allAccountingProviders }).notNull().default("QUICKBOOKS"),
        // References users.id by convention (no cross-db FK; see BaseDatabase.ts).
        connectedByUserId: text("connected_by_user_id").notNull(),
        accessToken: text("access_token"),
        refreshToken: text("refresh_token"),
        tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
    },
    (table) => [
        // Must match migrations/*.sql exactly for drift-check to stay green.
        check("quickbooks_connections_mode_check", sql`${table.mode} IN ('LOCAL', 'INTUIT')`),
        check("quickbooks_connections_provider_check", sql`${table.provider} IN ('QUICKBOOKS', 'XERO')`),
    ],
)

export type QuickBooksConnection = typeof quickBooksConnectionsTable.$inferSelect
export type NewQuickBooksConnection = typeof quickBooksConnectionsTable.$inferInsert

export const quickBooksConnectionInsertSchema = createInsertSchema(quickBooksConnectionsTable, {
    realmId: (schema) => schema.trim().min(1),
    companyName: (schema) => schema.trim().min(1),
}).omit({ id: true, rowCreatedAt: true, rowUpdatedAt: true })
