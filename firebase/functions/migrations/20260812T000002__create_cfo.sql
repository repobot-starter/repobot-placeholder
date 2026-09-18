-- CFO practice domain: app-level advisor/client roles and email invites for
-- the fractional-CFO practice portal. Matches src/Data/Cfo/* exactly.
--
-- Membership is one row per user (the practice is the workspace). Invites
-- are accepted by email match at first sign-in — no token round-trip: the
-- invited address signs up through the normal auth surface and the CFO
-- domain resolves the pending invite into a CLIENT membership.

CREATE TABLE cfo_memberships (
    id text PRIMARY KEY,
    row_created_at timestamptz NOT NULL DEFAULT now(),
    row_updated_at timestamptz NOT NULL DEFAULT now(),
    -- References users.id by convention only (no cross-domain FK).
    user_id text NOT NULL,
    role text NOT NULL CHECK (role IN ('ADVISOR', 'CLIENT')),
    -- The advisor whose invite created this membership, when there was one.
    invited_by_user_id text,
    CONSTRAINT cfo_memberships_user_id_unique UNIQUE (user_id)
);

CREATE TABLE cfo_invites (
    id text PRIMARY KEY,
    row_created_at timestamptz NOT NULL DEFAULT now(),
    row_updated_at timestamptz NOT NULL DEFAULT now(),
    -- Lowercased; matched against the signing-in user's email.
    email text NOT NULL,
    role text NOT NULL DEFAULT 'CLIENT' CHECK (role IN ('ADVISOR', 'CLIENT')),
    status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REVOKED')),
    invited_by_user_id text NOT NULL,
    accepted_by_user_id text
);
