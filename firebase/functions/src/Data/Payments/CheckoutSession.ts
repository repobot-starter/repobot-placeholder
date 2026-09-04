import { sql } from "drizzle-orm"
import { check, integer, text } from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"
import { baseTable } from "../BaseTable.js"

export const allCheckoutProviders = ["LOCAL", "STRIPE"] as const
export type CheckoutProvider = (typeof allCheckoutProviders)[number]

export const allCheckoutSessionStatuses = ["PENDING", "PAID"] as const
export type CheckoutSessionStatus = (typeof allCheckoutSessionStatuses)[number]

export const allCheckoutModes = ["PAYMENT", "SUBSCRIPTION"] as const
export type CheckoutMode = (typeof allCheckoutModes)[number]

export const allRecurringIntervals = ["MONTH", "YEAR"] as const
export type RecurringInterval = (typeof allRecurringIntervals)[number]

/**
 * One buyer's checkout attempt, owned by the payments kernel. One-off
 * (PAYMENT) buyers are anonymous by design; SUBSCRIPTION sessions require an
 * authenticated user (user_id), because recurring billing entitles an
 * account. The row carries a snapshot of the product so history survives
 * catalog edits. LOCAL rows are completed by the in-app test checkout;
 * STRIPE rows are marked PAID when server-side verification observes
 * Stripe's payment_status = "paid" or the Stripe webhook reports
 * checkout.session.completed.
 */
export const checkoutSessionsTable = baseTable(
    "checkout_sessions",
    {
        provider: text("provider", { enum: allCheckoutProviders }).notNull(),
        status: text("status", { enum: allCheckoutSessionStatuses }).notNull(),
        /** One-off payment (the default) or recurring subscription checkout. */
        mode: text("mode", { enum: allCheckoutModes }).notNull().default("PAYMENT"),
        /** The authenticated buyer; required for SUBSCRIPTION, null for anonymous one-off checkouts. */
        userId: text("user_id"),
        productKey: text("product_key").notNull(),
        productName: text("product_name").notNull(),
        /** Total in the currency's minor units (cents for USD). */
        amountTotal: integer("amount_total").notNull(),
        /** Lowercase ISO currency code, e.g. "usd". */
        currency: text("currency").notNull(),
        /** Recurring billing period snapshot; null for one-off payments. */
        recurringInterval: text("recurring_interval", { enum: allRecurringIntervals }),
        /** Stripe's session id ("cs_..."); null for LOCAL sessions. */
        stripeSessionId: text("stripe_session_id"),
        checkoutUrl: text("checkout_url").notNull(),
    },
    (table) => [
        // Must match migrations/*.sql exactly for drift-check to stay green.
        check("checkout_sessions_provider_check", sql`${table.provider} IN ('LOCAL', 'STRIPE')`),
        check("checkout_sessions_status_check", sql`${table.status} IN ('PENDING', 'PAID')`),
        check("checkout_sessions_mode_check", sql`${table.mode} IN ('PAYMENT', 'SUBSCRIPTION')`),
        check(
            "checkout_sessions_recurring_interval_check",
            sql`${table.recurringInterval} IN ('MONTH', 'YEAR')`,
        ),
    ],
)

export type CheckoutSession = typeof checkoutSessionsTable.$inferSelect
export type NewCheckoutSession = typeof checkoutSessionsTable.$inferInsert

export const checkoutSessionInsertSchema = createInsertSchema(checkoutSessionsTable, {
    productKey: (schema) => schema.trim().min(1),
    productName: (schema) => schema.trim().min(1),
    amountTotal: (schema) => schema.int().positive(),
    currency: (schema) => schema.trim().length(3),
}).omit({ id: true, rowCreatedAt: true, rowUpdatedAt: true })

export const checkoutSessionUpdateSchema = checkoutSessionInsertSchema
    .pick({ status: true, stripeSessionId: true, checkoutUrl: true })
    .partial()
