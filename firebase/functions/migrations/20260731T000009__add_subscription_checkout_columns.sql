-- Payments kernel: subscription-mode checkout sessions.
-- Matches src/Data/Payments/CheckoutSession.ts exactly.
--
-- One-off checkout stays anonymous; subscription checkout requires an
-- authenticated user (recurring billing entitles an account), so the session
-- row now carries the mode, the owning user for SUBSCRIPTION sessions, and
-- the recurring interval snapshot. Existing rows are one-off payments.

ALTER TABLE checkout_sessions
    ADD COLUMN mode text NOT NULL DEFAULT 'PAYMENT' CHECK (mode IN ('PAYMENT', 'SUBSCRIPTION')),
    -- References users.id by convention only (no cross-domain FK). Null for
    -- anonymous one-off checkouts; required by the service for SUBSCRIPTION.
    ADD COLUMN user_id text,
    -- Recurring billing period snapshot; null for one-off payments.
    ADD COLUMN recurring_interval text CHECK (recurring_interval IN ('MONTH', 'YEAR'));
