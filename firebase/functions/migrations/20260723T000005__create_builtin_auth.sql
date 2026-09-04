-- Built-in auth: identities, emailed one-time codes, and refresh tokens.
-- Matches src/Data/Identity/{AuthIdentity,AuthEmailCode,AuthRefreshToken}.ts
-- exactly. Ids are app-generated prefixed uuids (no DB default). Enums are
-- text with CHECK constraints.

CREATE TABLE auth_identities (
    id text PRIMARY KEY,
    row_created_at timestamptz NOT NULL DEFAULT now(),
    row_updated_at timestamptz NOT NULL DEFAULT now(),
    email text,
    password_hash text,
    google_subject text,
    display_name text,
    is_anonymous boolean NOT NULL DEFAULT false,
    email_verified_at timestamptz,
    failed_password_attempts integer NOT NULL DEFAULT 0,
    locked_out_until timestamptz,
    last_sign_in_at timestamptz,
    CONSTRAINT auth_identities_email_unique UNIQUE (email),
    CONSTRAINT auth_identities_google_subject_unique UNIQUE (google_subject),
    CONSTRAINT auth_identities_email_or_anonymous_check CHECK (email IS NOT NULL OR is_anonymous = true)
);

CREATE TABLE auth_email_codes (
    id text PRIMARY KEY,
    row_created_at timestamptz NOT NULL DEFAULT now(),
    row_updated_at timestamptz NOT NULL DEFAULT now(),
    email text NOT NULL,
    purpose text NOT NULL CHECK (purpose IN ('SIGN_IN', 'SIGN_UP', 'RECOVERY')),
    code_hash text NOT NULL,
    link_token_hash text NOT NULL,
    expires_at timestamptz NOT NULL,
    consumed_at timestamptz,
    attempt_count integer NOT NULL DEFAULT 0
);

CREATE INDEX auth_email_codes_email_idx ON auth_email_codes (email);

CREATE TABLE auth_refresh_tokens (
    id text PRIMARY KEY,
    row_created_at timestamptz NOT NULL DEFAULT now(),
    row_updated_at timestamptz NOT NULL DEFAULT now(),
    auth_subject text NOT NULL,
    token_hash text NOT NULL,
    expires_at timestamptz NOT NULL,
    consumed_at timestamptz,
    revoked_at timestamptz,
    CONSTRAINT auth_refresh_tokens_token_hash_unique UNIQUE (token_hash)
);

CREATE INDEX auth_refresh_tokens_auth_subject_idx ON auth_refresh_tokens (auth_subject);
