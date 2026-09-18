-- Storage kernel: an optional download-friendly file name on the upload row.
-- Matches src/Data/Storage/Upload.ts exactly.
--
-- Server-side writes (the writeFile mutation) file bytes that already have a
-- name — a generated document's, an export's — and record it so serving
-- surfaces can offer a sane download name. Browser uploads never declare one
-- and stay null. Nullable, so no backfill.

ALTER TABLE uploads
    ADD COLUMN file_name text;
