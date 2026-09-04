-- Shop domain: checkout sessions for the single-product storefront pack.
-- Matches src/Data/Shop/CheckoutSession.ts exactly.
--
-- Buyers are anonymous (no user reference by design): a session is created
-- when a buyer starts checkout and marked PAID either by the local test
-- checkout (PAYMENTS_MODE=local) or by server-side verification against
-- Stripe (PAYMENTS_MODE=stripe).

CREATE TABLE checkout_sessions (
    id text PRIMARY KEY,
    row_created_at timestamptz NOT NULL DEFAULT now(),
    row_updated_at timestamptz NOT NULL DEFAULT now(),
    provider text NOT NULL CHECK (provider IN ('LOCAL', 'STRIPE')),
    status text NOT NULL CHECK (status IN ('PENDING', 'PAID')),
    -- Product snapshot at checkout time, so price changes never rewrite
    -- history and the success page needs no catalog lookup.
    product_key text NOT NULL,
    product_name text NOT NULL,
    amount_total integer NOT NULL,
    currency text NOT NULL,
    -- Stripe's own session id ("cs_..."), null for LOCAL sessions.
    stripe_session_id text,
    -- Where the buyer is sent to pay: the in-app test checkout (LOCAL) or
    -- Stripe's hosted checkout page (STRIPE).
    checkout_url text NOT NULL
);
