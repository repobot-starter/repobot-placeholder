-- Daily send counter for the mail quota. Matches
-- src/Data/Mail/MailSendCounter.ts exactly. One row per UTC calendar day
-- ('YYYY-MM-DD' text, like the analytics rollups); the unique day key gives
-- the quota increment its upsert semantics. Template mail and auth mail
-- count into the same row — they share the platform SMTP account, so they
-- share the quota (docs/mail.md). Ids are app-generated prefixed uuids (no
-- DB default).

CREATE TABLE mail_send_counters (
    id text PRIMARY KEY,
    row_created_at timestamptz NOT NULL DEFAULT now(),
    row_updated_at timestamptz NOT NULL DEFAULT now(),
    day text NOT NULL,
    sent_count integer NOT NULL,
    CONSTRAINT mail_send_counters_day_unique UNIQUE (day)
);
