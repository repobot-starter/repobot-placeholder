-- Payments kernel: the purchase ledger.
-- Matches src/Data/Payments/Purchase.ts exactly.
--
-- One row per checkout session that reached PAID, written exactly once
-- (unique on checkout_session_id) no matter which observer saw payment
-- first: the Stripe webhook, the success page's server-side verification,
-- or the local test checkout. Apps query this for order history and
-- purchase-unlocked features; the Stripe Dashboard remains the financial
-- book of record. (checkout_sessions itself was created in the shop
-- migration and now belongs to the payments kernel.)

CREATE TABLE purchases (
    id text PRIMARY KEY,
    row_created_at timestamptz NOT NULL DEFAULT now(),
    row_updated_at timestamptz NOT NULL DEFAULT now(),
    -- References checkout_sessions.id by convention only (no cross-domain FK).
    checkout_session_id text NOT NULL,
    provider text NOT NULL CHECK (provider IN ('LOCAL', 'STRIPE')),
    -- Product snapshot copied from the session at payment time.
    product_key text NOT NULL,
    product_name text NOT NULL,
    amount_total integer NOT NULL,
    currency text NOT NULL,
    CONSTRAINT purchases_checkout_session_id_unique UNIQUE (checkout_session_id)
);
