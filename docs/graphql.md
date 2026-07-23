# GraphQL

The SDL in `Graphql/` is the API source of truth; `npm run codegen` generates resolver types, client hooks, and form JSON-schema definitions from it. The server is Apollo 4 behind the `graphql__request__api` HTTPS function (`firebase/functions/src/Graphql/GraphqlServer.ts`).

## Layering

Resolvers are adapters: they map GraphQL inputs to service calls and service results to GraphQL types. No database access, no business logic. Exemplars: `firebase/functions/src/Graphql/Resolvers/Project/` and `firebase/functions/src/Graphql/Resolvers/Identity/`.

## Partial resolution + dataloaders

1. Root resolvers return `PartiallyResolved*` objects (scalar fields + the backend model).
2. Relation fields (`Project.createdBy`, `ProjectMembership.user`) are separate field resolvers that hydrate via the per-request dataloaders on `GraphqlRequestContext`.
3. Dataloaders batch through the owning service's `orderedBatchLoadByIds`.

This keeps connections N+1-free. Add a new dataloader to `GraphqlRequestContext` when another domain starts referencing your entity.

## Conventions

- All mutations take `{ idempotencyKey, fields }` inputs (updates add `objectId`).
- List queries take `<X>ConnectionInput` `{ filters, connection: { pagination, sort } }` and return `{ nodes, pageInfo }`.
- Scalars: `Id` (prefixed row id), `Instant` (ISO 8601 UTC string).
- After editing any `.gql`, run `npm run codegen` and commit the regenerated `generated/` output (it is committed so composed templates typecheck on a fresh clone) — never hand-edit `generated/`.

## Never

- Never execute queries in resolvers (`docs/services.md` is the layer for logic, `docs/data-layer.md` for SQL).
- Never resolve relations with per-node service calls inside a connection — use the dataloader.
