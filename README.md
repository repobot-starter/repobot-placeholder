# Base

A domain-oriented full-stack starter with world-class standards baked in. Concepts are split into separate domains across every layer — data, services, GraphQL, events, and UI — so big ideas stay organized as the product grows.

**Stack**: Firebase Functions + Apollo GraphQL + Drizzle/Postgres (SQL-first migrations) · GCP Pub/Sub events with dead-lettering · React 19 + Vite + Apollo web app · Radix + vanilla-extract design system with Storybook · backend-driven forms · blackbox GraphQL test harness.

**Exemplar domains**: `Identity` (accounts, users, auth) and `Project` (CRUD, forms, events). Every pattern you need is demonstrated by one of them.

## Quick start

```bash
npm install
npm run dev:up
```

Open http://127.0.0.1:5173 and continue as the local dev user. See `docs/local-development.md` for details and `AGENTS.md` for the full guide (humans welcome too).

## Layout

- `Graphql/` — GraphQL SDL (API source of truth)
- `protobufs/` — event schemas
- `firebase/functions/` — backend (`Data` → `Services` → `Graphql` → `CloudFunctions`), SQL migrations, blackbox tests
- `web/core` · `web/design-system` · `web/app` — client runtime, component library, product app
- `scripts/` — every operational command (surface: root `npm run`)
- `docs/` — per-layer recipe guides; start with `docs/adding-a-domain.md`
- `env.manifest.json` — source of truth for environment variables

## Quality gates

```bash
npm run check:all   # codegen + lint + build + prettier
npm test            # backend blackbox tests
```
