-- Scheduled jobs run ledger. Matches src/Data/Jobs/JobRun.ts exactly.
-- One row per (job, due time): the unique constraint is the tick's claim
-- lock — INSERT ... ON CONFLICT DO NOTHING means concurrent ticks can never
-- double-run a due time. Ids are app-generated prefixed uuids (no DB
-- default). Enums are text with CHECK constraints.

CREATE TABLE job_runs (
    id text PRIMARY KEY,
    row_created_at timestamptz NOT NULL DEFAULT now(),
    row_updated_at timestamptz NOT NULL DEFAULT now(),
    job_name text NOT NULL,
    scheduled_for timestamptz NOT NULL,
    started_at timestamptz NOT NULL,
    finished_at timestamptz,
    status text NOT NULL CHECK (status IN ('RUNNING', 'SUCCEEDED', 'FAILED')),
    error text,
    CONSTRAINT job_runs_job_name_scheduled_for_unique UNIQUE (job_name, scheduled_for)
);

CREATE INDEX job_runs_job_name_idx ON job_runs (job_name);
