# Pack: chimney

Client-only vertical pack: ChimneyBot, a night-time rooftop runner (canvas game loop, variable-height jumps, localStorage best run) at `web/app/src/View/Games/Chimney/`.

## What ships

- Cabinet page with run-log / controls / house-rules panels (owns `/` when this pack is active; otherwise preview at `/chimney`)
- `ChimneyPage` canvas view running its own requestAnimationFrame loop over a pure engine (`engine.ts` — no React, no DOM)
- The premise: jump house by house across an endless street. Land on a roof: +1. Land IN a chimney: you slide down onto the family's dinner stove — **you get cooked**. Smack a chimney or miss a roof: you fall
- Variable jumps (tap hops, hold soars) with coyote time and jump buffering; run speed ramps forever
- Best run persisted in `localStorage` — no assets, no network, no backend
- Native ports of the game as the home surface of the iOS app (`ios/App/View/Games/Chimney/`) and the Android app (`android/.../view/games/chimney/`) — tap/hold to jump, local best runs, no backend

Set [`../active.json`](../active.json) to `{ "key": "chimney" }` to make this pack the home surface.

## Agent recipe: extend the game

- Gameplay (run speed ramp, gravity, jump strength, house/gap/chimney geometry, warm-up houses) lives in `engine.ts` constants; the native ports mirror them — keep the constants and the RNG call order in `pushHouse` in sync across all three.
- The engine is deterministic under an injected `random` closure, so exact streets can be replayed in tests.
- Add persistent leaderboards by following `docs/adding-a-domain.md` (SQL migration + service + GraphQL + typed hooks), then flip `clientOnly` in `catalog.json` so deploys provision the backend.

## Non-goals for this pack

- Auth / accounts (platform flow; see the auth pack)
- Server-side state — the shipped game is fully client-side
