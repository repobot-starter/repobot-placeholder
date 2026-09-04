-- Identity domain: accounts and users.
-- Matches src/Data/Identity/{Account,User}.ts exactly. Ids are app-generated
-- prefixed uuids (no DB default). Enums are text with CHECK constraints.

CREATE TABLE accounts (
    id text PRIMARY KEY,
    row_created_at timestamptz NOT NULL DEFAULT now(),
    row_updated_at timestamptz NOT NULL DEFAULT now(),
    name text NOT NULL
);

CREATE TABLE users (
    id text PRIMARY KEY,
    row_created_at timestamptz NOT NULL DEFAULT now(),
    row_updated_at timestamptz NOT NULL DEFAULT now(),
    -- References accounts.id by convention only: domains may live in separate
    -- databases someday, so there is no FK; the service layer enforces it.
    account_id text NOT NULL,
    email text NOT NULL,
    display_name text NOT NULL,
    status text NOT NULL CHECK (status IN ('ACTIVE', 'DISABLED')),
    auth_subject text,
    CONSTRAINT users_email_unique UNIQUE (email),
    CONSTRAINT users_auth_subject_unique UNIQUE (auth_subject)
);
