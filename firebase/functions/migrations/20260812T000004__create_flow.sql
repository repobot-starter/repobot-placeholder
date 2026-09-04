-- Budgeting domain: budget/forecast templates as month-grids over the
-- owner's live accounting connection. Matches src/Data/Flow/* exactly.
--
-- Only the plan is stored: budgets per grid month, comma-joined integer
-- minor units (the kernel money rule; always exactly month_count entries —
-- the service owns that invariant). Actuals and variance are computed at
-- read time from the live P&L, never persisted.

CREATE TABLE flow_templates (
    id text PRIMARY KEY,
    row_created_at timestamptz NOT NULL DEFAULT now(),
    row_updated_at timestamptz NOT NULL DEFAULT now(),
    -- References users.id by convention only (no cross-domain FK).
    user_id text NOT NULL,
    name text NOT NULL,
    -- First grid month as ISO yyyy-mm.
    start_month text NOT NULL,
    month_count integer NOT NULL
        CONSTRAINT flow_templates_month_count_check
        CHECK (month_count >= 1 AND month_count <= 24),
    -- Lowercase ISO currency code; the sample companies report in USD.
    currency text NOT NULL DEFAULT 'usd'
);

CREATE TABLE flow_lines (
    id text PRIMARY KEY,
    row_created_at timestamptz NOT NULL DEFAULT now(),
    row_updated_at timestamptz NOT NULL DEFAULT now(),
    -- References flow_templates.id by convention (same domain, still no FK —
    -- the service owns referential integrity).
    template_id text NOT NULL,
    position integer NOT NULL,
    label text NOT NULL,
    section text NOT NULL
        CONSTRAINT flow_lines_section_check
        CHECK (section IN ('INCOME', 'EXPENSES')),
    -- A P&L category on the owner's books, or null for an unlinked row.
    linked_category text,
    -- Comma-joined integer minor units, one per grid month.
    budgets text NOT NULL
);
