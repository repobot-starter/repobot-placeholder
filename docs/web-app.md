# Web App

Location: `web/app/`. React 19 + Vite + react-router v7 + Apollo. Exemplar pages: `web/app/src/View/QueryView/Pages/Projects/` and `web/app/src/View/QueryView/Pages/Users/`.

## Structure

- `src/Config/` — runtime wiring (auth client per `VITE_AUTH_MODE`, Apollo client, route table, protected routes).
- `src/Graphql/Operations/Gql/` — the ONLY place `gql` documents live. Codegen produces typed hooks from them (`npm run codegen`).
- `src/View/` — pages. List pages follow Page → ViewModel → Columns, feeding `UiQueryView` from `@base/design-system`.
- `src/generated/` — codegen output; never edit.

## Recipe: add a list page for an entity

1. Add fragments/queries/mutations to `src/Graphql/Operations/Gql/<Domain>.ts`; run `npm run codegen`.
2. Create `src/View/QueryView/Pages/<Entities>/` with `<Entities>Page.tsx` (thin: renders `UiQueryView` with the view model), `<Entities>ViewModel.ts` (query hook, search/filter state, form schema queries, mutation handlers), `<Entities>Columns.tsx` (typed column defs).
3. Create/edit modals come from the backend form schemas — pass them to `UiQueryViewFormModal`; submit with `{ idempotencyKey: crypto.randomUUID(), fields }` and refetch the connection query after mutating.
4. Register the route in `src/Config/Router.ts` and the nav item in the shell.

## Data fetching conventions

- Apollo's normalized cache is on (row ids are globally unique). Do not switch queries to `no-cache`; after mutations, refetch the affected connection queries.
- Auth: the runtime attaches `Authorization: Bearer <token>`; `currentUser` hydrates the signed-in user.

## Never

- No `gql` blocks in View files.
- No hand-built entity forms (see `docs/forms.md`).
- No deep imports into other packages' `src/`.
