# Migrations and Databases

Schema truth lives in `firebase/functions/migrations/*.sql` — an ordered, forward-only stream applied by a small in-repo runner (`firebase/functions/scripts/migrate.ts`) that records applied files in a `schema_migrations` table. Read the runner; it is intentionally simple.

## Recipe: any schema or data change

1. Create `firebase/functions/migrations/<YYYYMMDDTHHMMSS>__<snake_case_description>.sql`. One concern per file. Data backfills use the same stream.
2. Mirror schema changes in the Drizzle tables under `firebase/functions/src/Data/`.
3. Apply: `npm run migrate` (core db) and `npm run migrate:test` (test db). The runner is idempotent.
4. CI applies the full stream to a scratch database and runs a drizzle-kit drift check (`firebase/functions/scripts/drift-check.sh`); if the TS mirror disagrees with the SQL, the build fails.

## Conventions

- Text ids, `row_created_at` / `row_updated_at timestamptz not null default now()`.
- Enums are `text` columns with `CHECK` constraints (mirrored as `text("...", { enum })` in Drizzle).
- Prefer additive, backwards-compatible changes (new nullable columns, new tables). Destructive changes need a deliberate multi-step plan.

## Never

- Never edit or delete an applied migration — write a new one.
- Never write down-migrations.
- Never use `drizzle-kit push` against any database; drizzle-kit exists only as CI verification.

## Environments

- Local core db: `127.0.0.1:5432` (`npm run dev:db`), test db: `127.0.0.1:5433` (`npm run dev:db:test`). `DB_MODE=embedded` runs Postgres without Docker (sandboxes).
- Deployed migrations run in the deploy pipeline against the environment's `DATABASE_URL` (GitHub environment secret).
