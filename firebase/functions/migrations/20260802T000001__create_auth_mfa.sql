-- Two-factor authentication (TOTP): one factor per identity plus single-use
-- recovery codes. Matches src/Data/Identity/AuthMfa.ts exactly. The secret
-- is encrypted at rest (AES-256-GCM keyed off AUTH_JWT_SECRET); recovery
-- codes are SHA-256 hashes, the same discipline as refresh tokens.

CREATE TABLE auth_mfa_factors (
    id text PRIMARY KEY,
    row_created_at timestamptz NOT NULL DEFAULT now(),
    row_updated_at timestamptz NOT NULL DEFAULT now(),
    auth_subject text NOT NULL,
    secret_encrypted text NOT NULL,
    confirmed_at timestamptz,
    failed_attempts integer NOT NULL DEFAULT 0,
    locked_until timestamptz,
    CONSTRAINT auth_mfa_factors_auth_subject_unique UNIQUE (auth_subject)
);

CREATE TABLE auth_mfa_recovery_codes (
    id text PRIMARY KEY,
    row_created_at timestamptz NOT NULL DEFAULT now(),
    row_updated_at timestamptz NOT NULL DEFAULT now(),
    auth_subject text NOT NULL,
    code_hash text NOT NULL,
    used_at timestamptz
);

CREATE INDEX auth_mfa_recovery_codes_auth_subject_idx ON auth_mfa_recovery_codes (auth_subject);
