-- Payments kernel: buyer email on the purchase ledger.
-- Matches src/Data/Payments/Purchase.ts exactly.
--
-- Stripe Checkout collects the buyer's email; the webhook and the success
-- page's server-side verification record it here so the mail kernel can send
-- a receipt. Null for LOCAL (sandbox) test checkouts, which have no buyer.

ALTER TABLE purchases
    ADD COLUMN buyer_email text;
