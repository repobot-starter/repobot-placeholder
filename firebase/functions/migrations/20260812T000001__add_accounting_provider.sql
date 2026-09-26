-- The accounting connection gains a provider: QuickBooks or Xero. Both serve
-- the same simulated dataset in QUICKBOOKS_MODE=local; real integrations slot
-- in behind the same service interface per provider.
-- Matches src/Data/QuickBooks/QuickBooksConnection.ts exactly.

ALTER TABLE quickbooks_connections
    ADD COLUMN provider text NOT NULL DEFAULT 'QUICKBOOKS'
    CHECK (provider IN ('QUICKBOOKS', 'XERO'));
