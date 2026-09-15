-- First-party analytics beacon tables. Match src/Data/Analytics/*.ts exactly.
-- analytics_events holds raw pageview pings (7-day retention; visitor_hash is
-- a daily-salted hash — no raw IPs, ever). analytics_daily and
-- analytics_page_daily are the rollups the dashboard reads (90-day
-- retention); their unique day keys let the rollup job recompute a day
-- convergently. Days are UTC 'YYYY-MM-DD' text, matching what the platform's
-- dashboard passthrough queries expect.

CREATE TABLE analytics_events (
    id text PRIMARY KEY,
    row_created_at timestamptz NOT NULL DEFAULT now(),
    row_updated_at timestamptz NOT NULL DEFAULT now(),
    day text NOT NULL,
    path text NOT NULL,
    visitor_hash text NOT NULL
);

CREATE INDEX analytics_events_day_idx ON analytics_events (day);

CREATE TABLE analytics_daily (
    id text PRIMARY KEY,
    row_created_at timestamptz NOT NULL DEFAULT now(),
    row_updated_at timestamptz NOT NULL DEFAULT now(),
    day text NOT NULL,
    pageviews integer NOT NULL,
    unique_visitors integer NOT NULL,
    CONSTRAINT analytics_daily_day_unique UNIQUE (day)
);

CREATE TABLE analytics_page_daily (
    id text PRIMARY KEY,
    row_created_at timestamptz NOT NULL DEFAULT now(),
    row_updated_at timestamptz NOT NULL DEFAULT now(),
    day text NOT NULL,
    path text NOT NULL,
    pageviews integer NOT NULL,
    unique_visitors integer NOT NULL,
    CONSTRAINT analytics_page_daily_day_path_unique UNIQUE (day, path)
);
