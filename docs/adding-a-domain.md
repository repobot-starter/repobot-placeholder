# Adding a Domain

The master recipe. Each step names the exemplar file to imitate — copy its shape, rename, and trim. The example below adds a hypothetical `Tag` domain; substitute your own concept.

## 1. Migration (SQL first)

Create `firebase/functions/migrations/<UTC timestamp>__create_tag.sql` (format `YYYYMMDDTHHMMSS`, e.g. `20260801T120000__create_tag.sql`). Imitate `firebase/functions/migrations/` → the `create_project` migration: text `id` primary key, `row_created_at`/`row_updated_at timestamptz not null default now()`, enums as `text` with `CHECK` constraints. Run `npm run migrate`.

## 2. Drizzle tables (the TS mirror)

Add `firebase/functions/src/Data/Tag/Tag.ts` (new) using the `baseTable` factory — imitate `firebase/functions/src/Data/Project/Project.ts`. Register an id prefix in `firebase/functions/src/Data/TablePrefix.ts`. Create the domain database module `firebase/functions/src/Data/TagDatabase.ts` (new) (imitate `firebase/functions/src/Data/ProjectDatabase.ts`) — every domain owns its own database module; never join across domains.

## 3. Service

Add `firebase/functions/src/Services/Tag/TagService.ts` (new) — imitate `firebase/functions/src/Services/Project/ProjectService.ts`: class + singleton export, request-object methods (`createTag`, `updateTag`, `listTags`, `getTagByIdOrThrow`, `orderedBatchLoadByIds`), drizzle-zod validation, `idempotentInsertAndGet` for creates, `RpcError` for failures. Export via `firebase/functions/src/Services/Tag/index.ts` (new).

## 4. GraphQL schema

Add `Graphql/Core/Tag/Tag.gql` (new) — imitate `Graphql/Core/Project/Project.gql`: type, `TagConnection`/`TagConnectionInput`, `Create`/`Update` inputs with `{ idempotencyKey, fields }`. Add the queries/mutations to `Graphql/Core/Schema.gql`. Run `npm run codegen`.

## 5. Resolvers

Add `firebase/functions/src/Graphql/Resolvers/Tag/TagResolvers.ts` (new) — imitate `firebase/functions/src/Graphql/Resolvers/Project/`: root resolvers map service results to `PartiallyResolved` shapes; relation fields hydrate via context dataloaders; no database access. Register in the resolver aggregator and add a dataloader to `GraphqlRequestContext` if other domains reference tags.

## 6. Form resolver (backend-driven forms)

Add `firebase/functions/src/Graphql/Resolvers/Tag/TagSchemaFormResolvers.ts` (new) — imitate `firebase/functions/src/Graphql/Resolvers/Project/ProjectSchemaFormResolvers.ts` with `buildSchemaForm`. Expose `tagCreateFormSchema` / `tagUpdateFormSchema` queries. The web form now exists with zero frontend form code.

## 7. Web page

Add `web/app/src/View/QueryView/Pages/Tags/` (new) — imitate `web/app/src/View/QueryView/Pages/Projects/` (Page → ViewModel → Columns). Add gql documents to `web/app/src/Graphql/Operations/Gql/`, run `npm run codegen`, add the route and nav item.

## 8. Tests

Add `firebase/functions/test/Tag/TagTest.ts` (new) + `TagTestHelper.ts` — imitate `firebase/functions/test/Project/`. Blackbox through GraphQL; add a `tag` default to `addDefaults` if other suites will need one.

## 9. Gate

`npm run check:all` and `npm test` must pass.

## Never

- Never skip the migration and rely on Drizzle to create tables.
- Never put business logic in resolvers or SQL in services outside the domain's database module.
- Never hand-build the create/edit form in the web app.
