# Migrations and Databases

Schema truth lives in `firebase/functions/migrations/*.sql` — an ordered, forward-only stream applied by a small in-repo runner (`firebase/functions/scripts/migrate.ts`) that records applied files in a `schema_migrations` table. Read the runner; it is intentionally simple.

## Recipe: any schema or data change

1. Create `firebase/functions/migrations/<YYYYMMDDTHHMMSS>__<snake_case_description>.sql`. One concern per file. Data backfills use the same stream.
2. Mirror schema changes in the Drizzle tables under `firebase/functions/src/Data/<Domain>/`. Keep table files inside a domain subdirectory — the drift check's schema glob (`drizzle.config.ts`) covers `src/Data/*/*.ts`, so a new domain directory is verified with no config edit. Register the table's row-id prefix in `src/Data/TablePrefix.ts`.
3. Apply: `npm run migrate` (core db) and `npm run migrate:test` (test db). The runner is idempotent. This works mid-session against the running stack — new tables are visible to the functions emulator immediately, no restart needed (embedded-Postgres sandboxes included).
4. CI applies the full stream to a scratch database and runs a drizzle-kit drift check (`firebase/functions/scripts/drift-check.sh`); if the TS mirror disagrees with the SQL, the build fails. The check compares every table except `schema_migrations` — never add an allowlist to `drizzle.config.ts`, it would silently exempt new tables.

## Conventions

- Text ids, `row_created_at` / `row_updated_at timestamptz not null default now()`.
- Enums are `text` columns with `CHECK` constraints (mirrored as `text("...", { enum })` in Drizzle).
- Prefer additive, backwards-compatible changes (new nullable columns, new tables). Destructive changes need a deliberate multi-step plan.

## When something goes wrong

- **A migration fails while applying**: each file runs in its own transaction, and the runner records a file only after it commits — a failed file leaves the database exactly as before it and is not marked applied. Fix the SQL in place (it never applied anywhere, so editing is safe) and rerun `npm run migrate`.
- **A migration applied somewhere but is wrong**: never edit or delete it — the ledger has it and other databases may too. Write a new forward migration that corrects it (drop the bad column, fix the constraint, backfill the data).
- **Two branches added migrations with interleaving timestamps**: the runner applies strictly in filename order and skips anything already recorded, so a merge can leave a database where a "later" file applied before an "earlier" one. That is fine when the files touch different concerns (the common case). If your file depends on the other branch's schema, rename yours to a timestamp after theirs before merging so fresh databases replay in dependency order.
- **The drift check fails**: the SQL stream and the Drizzle mirror disagree. Read drizzle-kit's output — it names the table and change it wanted to make — then fix whichever side is wrong (usually the mirror; the SQL is the authority once applied anywhere).

## Never

- Never edit or delete an applied migration — write a new one.
- Never write down-migrations.
- Never use `drizzle-kit push` against any database; drizzle-kit exists only as CI verification.

## Environments

- Local core db: `127.0.0.1:5432` (`npm run dev:db`), test db: `127.0.0.1:5433` (`npm run dev:db:test`). `DB_MODE=embedded` runs Postgres without Docker (sandboxes).
- Deployed migrations run in the deploy pipeline against the environment's `DATABASE_URL` (GitHub environment secret).
