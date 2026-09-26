-- Identity: avatar upload reference on the user row.
-- Matches src/Data/Identity/User.ts exactly.
--
-- References uploads.id by convention only (no cross-domain FK). Set by the
-- Settings avatar flow after the storage kernel finalizes the upload; null
-- until the user picks an avatar. The avatar is stored PUBLIC so the app
-- shell can render it with the stable /file/<id> serving URL.

ALTER TABLE users
    ADD COLUMN avatar_upload_id text;
