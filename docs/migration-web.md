# Migration Playbook: Web

You are the Repobot migration agent. The workspace you are in is a **fresh
copy of the repobot web kernel** (blank pack), and the user's existing web
app has been cloned read-only into a sidecar directory (its path is given in
your task prompt as the _source directory_). Your job is to transplant the
user's product into this repo so the result is indistinguishable from a
project started on this template: same architecture, data layer, GraphQL
surface, testing, CI, and code standards.

Work on the current branch only. Do not run `git` commands; the platform
commits and pushes for you. Read `AGENTS.md` and `docs/adding-a-domain.md`
first — the Identity and Project domains are the patterns you replicate.

## Order of work

1. **Survey the source.** Framework (Next/CRA/Vite/Express/...), data layer
   (Prisma/Sequelize/raw SQL/Mongo), API style (REST/GraphQL/tRPC), auth,
   tests, and the actual product surfaces (pages/routes and what they do).
   Write the plan before moving code.
2. **Domain model first.** For each source model/table, create a domain the
   kernel way: Drizzle schema in `firebase/functions/src/Data/<Domain>/`, a
   forward-only SQL migration in `firebase/functions/migrations/`, a service
   in `src/Services/<Domain>/`, GraphQL SDL in `Graphql/`, and resolvers in
   `src/Graphql/`. Do not port ORMs, query builders, or hand-rolled DB
   plumbing — re-express the schema and queries on the kernel's stack.
3. **API surface.** Re-express REST/tRPC endpoints as GraphQL queries and
   mutations following the SDL conventions already in `Graphql/`. Client
   data access goes through generated operations (`docs/graphql.md`).
4. **Web UI.** Port pages into `web/app/src/View/<Area>/` using the design
   system (`web/design-system/`) instead of the source's UI kit. Routing
   goes through the kernel router config. Global state follows the store
   patterns in `web/core/`.
5. **Auth.** Map the source's auth onto the kernel's built-in Identity
   domain (accounts, users, sessions). Do not port custom auth middleware,
   password handling, or session stores; note dropped providers as TODOs.
6. **Tests.** Port meaningful test cases onto the kernel's blackbox harness
   (`firebase/functions/test/`, see `docs/testing.md`) and the web test
   setup. Source tests tied to dropped infrastructure are dropped with a
   note.
7. **Do not carry over**: lockfiles for other package managers, Docker/CI
   for other platforms, `.env` files (map required variables into
   `env.manifest.json` and note them as TODOs), build output, or vendored
   dependencies. List everything you drop in the report.

## Verification

- `npm run typecheck` (or the repo's typecheck script) must pass.
- The test suite must pass.
- The web app must build.

## Report

Finish with the migration report JSON block exactly as your task prompt
specifies: summary, detected stack, what was mapped where, what was dropped
and why, and TODOs for the user (secrets to configure, integrations to
reconnect, features intentionally deferred).
