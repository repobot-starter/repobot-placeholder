import { sql } from "drizzle-orm"
import { check, integer, text, timestamp, unique } from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"
import { baseTable } from "../BaseTable.js"
import { allCheckoutProviders, allRecurringIntervals } from "./CheckoutSession.js"

export const allSubscriptionStatuses = ["ACTIVE", "PAST_DUE", "CANCELED"] as const
export type SubscriptionStatus = (typeof allSubscriptionStatuses)[number]

/**
 * The subscription state table: one row per subscription checkout session
 * that reached PAID, written exactly once (unique on checkout_session_id) no
 * matter which observer saw payment first — the Stripe webhook, the success
 * page's server-side verification, or the local test checkout. Status then
 * follows Stripe's lifecycle events (customer.subscription.updated/deleted,
 * invoice.paid/payment_failed). Subscriptions are never anonymous: user_id
 * is the authenticated buyer the recurring billing entitles. Entitlement
 * checks go through paymentsService.hasActiveSubscription.
 */
export const subscriptionsTable = baseTable(
    "subscriptions",
    {
        checkoutSessionId: text("checkout_session_id").notNull(),
        /** References users.id by convention only (no cross-domain FK). */
        userId: text("user_id").notNull(),
        provider: text("provider", { enum: allCheckoutProviders }).notNull(),
        /** Stripe's subscription id ("sub_..."); null for LOCAL simulated rows. */
        stripeSubscriptionId: text("stripe_subscription_id"),
        /** Stripe's customer id ("cus_..."); the Billing Portal needs it. */
        stripeCustomerId: text("stripe_customer_id"),
        /** Product snapshot copied from the session at activation time. */
        productKey: text("product_key").notNull(),
        productName: text("product_name").notNull(),
        /** Per-period total in the currency's minor units (cents for USD). */
        amountTotal: integer("amount_total").notNull(),
        /** Lowercase ISO currency code, e.g. "usd". */
        currency: text("currency").notNull(),
        recurringInterval: text("recurring_interval", { enum: allRecurringIntervals }).notNull(),
        status: text("status", { enum: allSubscriptionStatuses }).notNull(),
        /** End of the current billing period as reported by Stripe; null for LOCAL rows. */
        currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    },
    (table) => [
        unique("subscriptions_checkout_session_id_unique").on(table.checkoutSessionId),
        unique("subscriptions_stripe_subscription_id_unique").on(table.stripeSubscriptionId),
        // Must match migrations/*.sql exactly for drift-check to stay green.
        check("subscriptions_provider_check", sql`${table.provider} IN ('LOCAL', 'STRIPE')`),
        check("subscriptions_recurring_interval_check", sql`${table.recurringInterval} IN ('MONTH', 'YEAR')`),
        check("subscriptions_status_check", sql`${table.status} IN ('ACTIVE', 'PAST_DUE', 'CANCELED')`),
    ],
)

export type Subscription = typeof subscriptionsTable.$inferSelect
export type NewSubscription = typeof subscriptionsTable.$inferInsert

export const subscriptionInsertSchema = createInsertSchema(subscriptionsTable, {
    checkoutSessionId: (schema) => schema.trim().min(1),
    userId: (schema) => schema.trim().min(1),
    productKey: (schema) => schema.trim().min(1),
    productName: (schema) => schema.trim().min(1),
    amountTotal: (schema) => schema.int().positive(),
    currency: (schema) => schema.trim().length(3),
}).omit({ id: true, rowCreatedAt: true, rowUpdatedAt: true })

export const subscriptionUpdateSchema = subscriptionInsertSchema
    .pick({ status: true, currentPeriodEnd: true, stripeSubscriptionId: true, stripeCustomerId: true })
    .partial()
