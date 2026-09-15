import { sql } from "drizzle-orm"
import { check, integer, text, unique } from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"
import { baseTable } from "../BaseTable.js"
import { allCheckoutProviders } from "./CheckoutSession.js"

/**
 * The purchase ledger: one row per checkout session that reached PAID. Rows
 * are written exactly once (unique on checkout_session_id) no matter which
 * path observed payment first — the Stripe webhook, the success page's
 * server-side verification, or the local test checkout. Apps query this
 * table (or the `purchases` GraphQL query) for order history and
 * purchase-unlocked features; the Stripe Dashboard remains the financial
 * book of record.
 */
export const purchasesTable = baseTable(
    "purchases",
    {
        checkoutSessionId: text("checkout_session_id").notNull(),
        provider: text("provider", { enum: allCheckoutProviders }).notNull(),
        /** Product snapshot copied from the session at payment time. */
        productKey: text("product_key").notNull(),
        productName: text("product_name").notNull(),
        /** Total in the currency's minor units (cents for USD). */
        amountTotal: integer("amount_total").notNull(),
        /** Lowercase ISO currency code, e.g. "usd". */
        currency: text("currency").notNull(),
        /** Buyer email as reported by the provider (Stripe Checkout collects it); receipts go here. Null for LOCAL test checkouts. */
        buyerEmail: text("buyer_email"),
    },
    (table) => [
        unique("purchases_checkout_session_id_unique").on(table.checkoutSessionId),
        // Must match migrations/*.sql exactly for drift-check to stay green.
        check("purchases_provider_check", sql`${table.provider} IN ('LOCAL', 'STRIPE')`),
    ],
)

export type Purchase = typeof purchasesTable.$inferSelect
export type NewPurchase = typeof purchasesTable.$inferInsert

export const purchaseInsertSchema = createInsertSchema(purchasesTable, {
    checkoutSessionId: (schema) => schema.trim().min(1),
    productKey: (schema) => schema.trim().min(1),
    productName: (schema) => schema.trim().min(1),
    amountTotal: (schema) => schema.int().positive(),
    currency: (schema) => schema.trim().length(3),
}).omit({ id: true, rowCreatedAt: true, rowUpdatedAt: true })
