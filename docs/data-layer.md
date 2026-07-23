# Data Layer

Location: `firebase/functions/src/Data/`. Exemplars: `firebase/functions/src/Data/Identity/` and `firebase/functions/src/Data/Project/`.

## Concepts

- **`baseTable` factory** (`firebase/functions/src/Data/BaseTable.ts`): every table gets a globally unique prefixed text id (`proj_...`), `rowCreatedAt`, and `rowUpdatedAt`. Prefixes are registered in `firebase/functions/src/Data/TablePrefix.ts` — one prefix per table, never reused.
- **Domain database modules**: each domain has its own `<Domain>Database.ts` wrapping the shared pool with only that domain's schema (see `firebase/functions/src/Data/ProjectDatabase.ts`). Domains share one Postgres instance today but are designed to split into separate physical databases — so never join tables across domains in SQL; cross-domain relationships hold ids and resolve through services.
- **Shared helpers** (`firebase/functions/src/Data/Utils/`): `listRows` (cursor pagination + sort + filters), `getRowByIdOrThrow`, `idempotentInsertAndGet` (uses the `idempotency_keys` table so retried creates return the original row).
- **Validation**: drizzle-zod `createInsertSchema` on each table; enum columns declare `text("...", { enum })` and the zod schema infers them.
- **Enums**: an `as const` array named `all<Xyz>s` plus a derived union type (`export const allProjectStatuses = ["ACTIVE", "ARCHIVED"] as const; export type ProjectStatus = (typeof allProjectStatuses)[number]`). The column is `text(..., { enum: allProjectStatuses })`, the SQL migration adds a matching `CHECK (status IN (...))`, and the Drizzle table declares the same `check(...)` so drift-check stays green. Never use Postgres `ENUM` types, and never re-declare the values with `z.enum` (see `.cursor/rules/zod-drizzle-enum-validation.mdc`).

## Recipe: add a column

1. Migration: `firebase/functions/migrations/<ts>__add_<table>_<column>.sql` (see `docs/migrations-and-db.md`).
2. Mirror the column in the Drizzle table file.
3. `npm run migrate` (+ `migrate:test`), then `npm run check:all` — CI's drift check verifies the mirror matches.

## Never

- Never let Drizzle create or alter tables — SQL migrations are the only schema authority.
- Never join across domain boundaries in SQL.
- Never hand-assign ids or reuse a table prefix.
