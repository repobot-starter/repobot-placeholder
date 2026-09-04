-- Payments kernel: the subscription state table.
-- Matches src/Data/Payments/Subscription.ts exactly.
--
-- One row per subscription checkout session that reached PAID, written
-- exactly once (unique on checkout_session_id) no matter which observer saw
-- payment first: the Stripe webhook, the success page's server-side
-- verification, or the local test checkout. Status then follows Stripe's
-- subscription lifecycle events (customer.subscription.*, invoice.*).
-- Entitlement checks go through paymentsService.hasActiveSubscription; the
-- Stripe Dashboard remains the financial book of record.

CREATE TABLE subscriptions (
    id text PRIMARY KEY,
    row_created_at timestamptz NOT NULL DEFAULT now(),
    row_updated_at timestamptz NOT NULL DEFAULT now(),
    -- References checkout_sessions.id by convention only (no cross-domain FK).
    checkout_session_id text NOT NULL,
    -- References users.id by convention only. Subscriptions are never
    -- anonymous: the authenticated buyer's account is what the recurring
    -- billing entitles.
    user_id text NOT NULL,
    provider text NOT NULL CHECK (provider IN ('LOCAL', 'STRIPE')),
    -- Stripe's subscription id ("sub_..."); null for LOCAL simulated rows.
    stripe_subscription_id text,
    -- Stripe's customer id ("cus_..."); the Billing Portal needs it.
    stripe_customer_id text,
    -- Product snapshot copied from the session at activation time.
    product_key text NOT NULL,
    product_name text NOT NULL,
    amount_total integer NOT NULL,
    currency text NOT NULL,
    recurring_interval text NOT NULL CHECK (recurring_interval IN ('MONTH', 'YEAR')),
    status text NOT NULL CHECK (status IN ('ACTIVE', 'PAST_DUE', 'CANCELED')),
    -- End of the current billing period as reported by Stripe; null for
    -- LOCAL rows and until Stripe reports one.
    current_period_end timestamptz,
    CONSTRAINT subscriptions_checkout_session_id_unique UNIQUE (checkout_session_id),
    CONSTRAINT subscriptions_stripe_subscription_id_unique UNIQUE (stripe_subscription_id)
);
