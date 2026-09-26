-- Pitch domain: investor decks built from the owner's live accounting
-- connection. Matches src/Data/Pitch/* exactly.
--
-- Only brand and copy are stored. Chart slides (revenue, margins, runway)
-- get their numbers from the live books at read and export time, never
-- persisted. The logo lives in the storage kernel (logo_upload_id references
-- uploads.id by convention, no cross-domain FK).

CREATE TABLE pitch_decks (
    id text PRIMARY KEY,
    row_created_at timestamptz NOT NULL DEFAULT now(),
    row_updated_at timestamptz NOT NULL DEFAULT now(),
    -- References users.id by convention only (no cross-domain FK).
    user_id text NOT NULL,
    name text NOT NULL,
    company_name text NOT NULL,
    tagline text,
    logo_upload_id text,
    -- Hex accent color for slide accents.
    accent_color text NOT NULL DEFAULT '#1f6feb'
);

CREATE TABLE pitch_slides (
    id text PRIMARY KEY,
    row_created_at timestamptz NOT NULL DEFAULT now(),
    row_updated_at timestamptz NOT NULL DEFAULT now(),
    -- References pitch_decks.id by convention (same domain, still no FK —
    -- the service owns referential integrity).
    deck_id text NOT NULL,
    position integer NOT NULL,
    kind text NOT NULL
        CONSTRAINT pitch_slides_kind_check
        CHECK (kind IN ('COVER', 'TRACTION', 'REVENUE', 'MARGINS', 'RUNWAY', 'ASK')),
    title text NOT NULL,
    body text NOT NULL,
    included boolean NOT NULL DEFAULT true
);
