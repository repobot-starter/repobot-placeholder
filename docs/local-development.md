# Local Development

## Fresh clone to running app

```bash
npm install          # one install, all workspaces
npm run dev:up       # env bootstrap -> db -> migrate -> codegen -> emulator -> web
```

Then open http://127.0.0.1:5173 and click "Continue as local dev user". `dev:up` is idempotent — rerun it any time; running components are left alone.

## The pieces (all via root npm scripts — never run docker/emulators by hand)

| Command                                           | What it does                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------------- |
| `npm run dev:up`                                  | Everything, in order, with health waits                                   |
| `npm run dev:status`                              | Up/down per component with ports and log paths                            |
| `npm run dev:logs`                                | Tail all service logs                                                     |
| `npm run dev:down`                                | Stop everything (data kept)                                               |
| `npm run dev:db` / `dev:db:test` / `dev:db:reset` | Postgres 16 on :5432 / :5433 (Docker; `DB_MODE=embedded` for Docker-free) |
| `npm run migrate` / `migrate:test`                | Apply SQL migrations                                                      |
| `npm run codegen`                                 | Regenerate after `.gql` / `.proto` changes                                |
| `npm run check:all`                               | Full quality gate (CI-equivalent)                                         |
| `npm test`                                        | Backend blackbox tests (needs test db + migrate:test)                     |
| `npm run storybook`                               | Design-system workbench on :6006                                          |

## Where things run

- Web dev server: http://127.0.0.1:5173
- GraphQL (functions emulator): http://127.0.0.1:5001/demo-repobot-base/us-central1/graphql__request__api
- Postgres core/test: 127.0.0.1:5432 / 5433
- Logs: `.dev/logs/`, pids: `.dev/pids/`

## Troubleshooting

- `npm run dev:status` first. Each script fails with an actionable message (e.g. Docker not running → start it or `DB_MODE=embedded`).
- Blown-away generated types → `npm run codegen`.
- Weird db state → `npm run dev:db:reset` then `npm run migrate`.
