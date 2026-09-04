-- Entry domain: a data-entry workbook the user shapes to their own work.
-- Fields are the user-defined schema (the designer surface); records are the
-- rows, each storing its cell values as jsonb keyed by field_key.
-- Matches src/Data/Entry/{EntryField,EntryRecord}.ts exactly.

CREATE TABLE entry_fields (
    id text PRIMARY KEY,
    row_created_at timestamptz NOT NULL DEFAULT now(),
    row_updated_at timestamptz NOT NULL DEFAULT now(),
    label text NOT NULL,
    -- Stable cell key inside a record's values; derived from the label at
    -- create and immutable afterwards.
    field_key text NOT NULL,
    field_type text NOT NULL CHECK (field_type IN ('TEXT', 'NUMBER', 'DATE', 'YESNO', 'SELECT')),
    required boolean NOT NULL DEFAULT false,
    -- Choices for SELECT fields; null for every other type.
    options jsonb,
    -- Column order, ascending.
    position integer NOT NULL,
    CONSTRAINT entry_fields_field_key_unique UNIQUE (field_key)
);

CREATE TABLE entry_records (
    id text PRIMARY KEY,
    row_created_at timestamptz NOT NULL DEFAULT now(),
    row_updated_at timestamptz NOT NULL DEFAULT now(),
    -- The row's cell values: { [field_key]: string | number | boolean }.
    -- Cells for deleted fields are kept (orphaned) by design.
    "values" jsonb NOT NULL DEFAULT '{}'::jsonb
);

-- Seed: a simple contact log, so the first paint shows the product.
-- Fixed ids keep the seed deterministic (and re-runnable per database).

INSERT INTO entry_fields (id, label, field_key, field_type, required, options, position) VALUES
    ('efd_00000000-0000-4000-8000-000000000001', 'Name', 'name', 'TEXT', true, NULL, 1),
    ('efd_00000000-0000-4000-8000-000000000002', 'Company', 'company', 'TEXT', false, NULL, 2),
    ('efd_00000000-0000-4000-8000-000000000003', 'Contacted', 'contacted', 'DATE', false, NULL, 3),
    ('efd_00000000-0000-4000-8000-000000000004', 'Follow up', 'follow_up', 'YESNO', false, NULL, 4),
    ('efd_00000000-0000-4000-8000-000000000005', 'Notes', 'notes', 'TEXT', false, NULL, 5);

INSERT INTO entry_records (id, "values", row_created_at, row_updated_at) VALUES
    (
        'erc_00000000-0000-4000-8000-000000000001',
        '{"name": "Maya Chen", "company": "Brightline Studio", "contacted": "2026-08-24", "follow_up": true, "notes": "Wants a quote for the fall campaign; send the deck."}'::jsonb,
        now() - interval '1 day', now() - interval '1 day'
    ),
    (
        'erc_00000000-0000-4000-8000-000000000002',
        '{"name": "Derek Okafor", "company": "Northgate Logistics", "contacted": "2026-08-21", "follow_up": false, "notes": "Renewed for another year on the current plan."}'::jsonb,
        now() - interval '2 days', now() - interval '2 days'
    ),
    (
        'erc_00000000-0000-4000-8000-000000000003',
        '{"name": "Priya Raman", "company": "Fielder & Sons", "contacted": "2026-08-18", "follow_up": true, "notes": "Asked for references; intro her to Maya."}'::jsonb,
        now() - interval '4 days', now() - interval '4 days'
    ),
    (
        'erc_00000000-0000-4000-8000-000000000004',
        '{"name": "Tom Alvarez", "company": "Copper Kettle Cafe", "contacted": "2026-08-12", "follow_up": false, "notes": "Not a fit right now; check back in the winter."}'::jsonb,
        now() - interval '7 days', now() - interval '7 days'
    ),
    (
        'erc_00000000-0000-4000-8000-000000000005',
        '{"name": "Hannah Boyle", "company": "Westbrook Realty", "contacted": "2026-08-08", "follow_up": true, "notes": "Left a voicemail; try email next."}'::jsonb,
        now() - interval '12 days', now() - interval '12 days'
    ),
    (
        'erc_00000000-0000-4000-8000-000000000006',
        '{"name": "Luis Ferreira", "company": "Atlas Print Co", "contacted": "2026-07-30", "follow_up": false, "notes": "Met at the trade show; sent the intro one-pager."}'::jsonb,
        now() - interval '20 days', now() - interval '20 days'
    );
