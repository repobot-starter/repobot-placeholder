-- Drive domain: the file tree and photo library over the storage kernel.
-- Matches src/Data/Drive/DriveEntry.ts and src/Data/Drive/DriveAlbum.ts
-- exactly.
--
-- One owner-scoped library per user (the Files and Photos utility packs are
-- two lenses over the same entries). FILE entries bind a finalized upload
-- (uploads.id, by convention only — storage is its own domain); FOLDER
-- entries have no upload and act as parents. Trash is a nullable timestamp,
-- not a deletion: restore clears it, permanent delete removes the row and
-- its object through the storage kernel. The photo columns (captured_at,
-- caption, thumb_upload_id) stay null for plain files.

CREATE TABLE drive_entries (
    id text PRIMARY KEY,
    row_created_at timestamptz NOT NULL DEFAULT now(),
    row_updated_at timestamptz NOT NULL DEFAULT now(),
    -- References users.id by convention only (no cross-domain FK). Null when
    -- the entry was created by an authenticated principal that has no
    -- application user row (e.g. the test harness principal).
    user_id text,
    -- References uploads.id by convention only. Null exactly for folders.
    upload_id text,
    -- The parent folder within the same table; null at the library root.
    parent_id text,
    name text NOT NULL,
    kind text NOT NULL CHECK (kind IN ('FILE', 'FOLDER')),
    starred boolean NOT NULL DEFAULT false,
    trashed_at timestamptz,
    -- Photo lens: EXIF capture time (client-extracted), caption, and the
    -- sibling WebP thumbnail upload (references uploads.id by convention).
    captured_at timestamptz,
    caption text,
    thumb_upload_id text,
    CONSTRAINT drive_entries_upload_id_unique UNIQUE (upload_id),
    CONSTRAINT drive_entries_kind_upload_check CHECK (
        (kind = 'FILE' AND upload_id IS NOT NULL) OR (kind = 'FOLDER' AND upload_id IS NULL)
    )
);

CREATE TABLE drive_albums (
    id text PRIMARY KEY,
    row_created_at timestamptz NOT NULL DEFAULT now(),
    row_updated_at timestamptz NOT NULL DEFAULT now(),
    -- References users.id by convention only; null for user-less principals.
    user_id text,
    name text NOT NULL
);

CREATE TABLE drive_album_entries (
    id text PRIMARY KEY,
    row_created_at timestamptz NOT NULL DEFAULT now(),
    row_updated_at timestamptz NOT NULL DEFAULT now(),
    -- Both reference within the drive domain; ownership is enforced on the
    -- album and the entry in the service layer.
    album_id text NOT NULL,
    entry_id text NOT NULL,
    CONSTRAINT drive_album_entries_album_entry_unique UNIQUE (album_id, entry_id)
);
