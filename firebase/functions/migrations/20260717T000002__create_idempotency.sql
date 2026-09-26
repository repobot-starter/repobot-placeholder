-- Idempotency key registry, used by idempotentInsertAndGet (Data/Utils).
-- key -> the row that the first successful request with that key created.

CREATE TABLE idempotency_keys (
    key text PRIMARY KEY,
    row_id text NOT NULL,
    row_created_at timestamptz NOT NULL DEFAULT now()
);
