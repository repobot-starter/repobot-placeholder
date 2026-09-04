-- Storage kernel: per-surface admission profiles on the upload row.
-- Matches src/Data/Storage/Upload.ts exactly.
--
-- The kernel's original allowlist and 20MB cap are avatar-era; the drive
-- domain (Files/Photos utility packs) files much larger objects, and the
-- bytes PUT straight to GCS so functions never proxy them. The profile the
-- slot was admitted under is recorded here so finalize and the local-mode
-- ingest verify the arriving bytes against the same cap that admitted the
-- declaration (StorageConfig.ts is the single tuning surface). Existing rows
-- were all admitted under the original rules and backfill to DEFAULT.

ALTER TABLE uploads
    ADD COLUMN profile text NOT NULL DEFAULT 'DEFAULT'
        CONSTRAINT uploads_profile_check CHECK (profile IN ('DEFAULT', 'DRIVE'));
