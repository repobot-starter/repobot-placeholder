-- QuickBooks domain: the workspace's QuickBooks company connection.
-- Matches src/Data/QuickBooks/QuickBooksConnection.ts exactly.
--
-- Token columns are nullable: QUICKBOOKS_MODE=local connections (the sandbox
-- simulation) never carry OAuth tokens; a future intuit mode fills them in.

CREATE TABLE quickbooks_connections (
    id text PRIMARY KEY,
    row_created_at timestamptz NOT NULL DEFAULT now(),
    row_updated_at timestamptz NOT NULL DEFAULT now(),
    -- The QuickBooks company (realm) id this connection is bound to.
    realm_id text NOT NULL,
    company_name text NOT NULL,
    mode text NOT NULL CHECK (mode IN ('LOCAL', 'INTUIT')),
    -- References users.id by convention only (no cross-domain FK).
    connected_by_user_id text NOT NULL,
    access_token text,
    refresh_token text,
    token_expires_at timestamptz
);
