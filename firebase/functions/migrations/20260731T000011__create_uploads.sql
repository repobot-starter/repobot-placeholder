-- Storage kernel: the uploads table.
-- Matches src/Data/Storage/Upload.ts exactly.
--
-- One row per upload slot. Rows are created PENDING when the client requests
-- an upload URL and flip to READY exactly once when the bytes are verified
-- (local mode: the storage function received them; gcs mode: the object
-- exists in the bucket). Download surfaces only ever serve READY rows.

CREATE TABLE uploads (
    id text PRIMARY KEY,
    row_created_at timestamptz NOT NULL DEFAULT now(),
    row_updated_at timestamptz NOT NULL DEFAULT now(),
    -- References users.id by convention only (no cross-domain FK). Null when
    -- the upload was created by an authenticated principal that has no
    -- application user row (e.g. the test harness principal).
    user_id text,
    -- Object key relative to the storage root (local data dir or the
    -- STORAGE_PREFIX inside the GCS bucket), e.g. "uploads/upld_<uuid>".
    storage_key text NOT NULL,
    content_type text NOT NULL,
    -- Declared at create time; overwritten with the actual byte count at
    -- finalize time.
    size_bytes bigint NOT NULL,
    visibility text NOT NULL CHECK (visibility IN ('PUBLIC', 'PRIVATE')),
    status text NOT NULL CHECK (status IN ('PENDING', 'READY')),
    CONSTRAINT uploads_storage_key_unique UNIQUE (storage_key)
);
