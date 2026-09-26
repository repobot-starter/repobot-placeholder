-- Push device registry. Matches src/Data/Push/PushDevice.ts exactly.
-- One row per push destination an app user enabled. The endpoint (the Web
-- Push subscription endpoint; native device tokens in C1b) is unique — the
-- constraint is what gives registerPushDevice its upsert-on-endpoint
-- semantics. Ids are app-generated prefixed uuids (no DB default). Enums are
-- text with CHECK constraints.

CREATE TABLE push_devices (
    id text PRIMARY KEY,
    row_created_at timestamptz NOT NULL DEFAULT now(),
    row_updated_at timestamptz NOT NULL DEFAULT now(),
    user_id text NOT NULL,
    platform text NOT NULL CHECK (platform IN ('WEB', 'IOS', 'ANDROID')),
    endpoint text NOT NULL,
    subscription_json text NOT NULL,
    rotated_at timestamptz NOT NULL,
    CONSTRAINT push_devices_endpoint_unique UNIQUE (endpoint)
);

CREATE INDEX push_devices_user_id_idx ON push_devices (user_id);
