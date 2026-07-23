# Pack: ludo

Client-only vertical pack: classic four-color Ludo (Parchís / Parqués / Mensch ärgere Dich nicht) with configurable human/bot seats at `web/app/src/View/Games/Ludo/`.

## What ships

- Board page with seat setup (each color Human, Bot, or Off; 2-4 racers, full hotseat), animated dice and token movement, move hints, and a placings overlay (owns `/` when this pack is active; otherwise preview at `/ludo`)
- Pure rules engine (`engine.ts`): 52-square ring topology, sixes to exit, captures with 8 safe squares, exact-roll home columns, triple-six forfeit, and the heuristic bot (capture > escape > exit > advance the leader)
- Match wins tally persisted in `localStorage` (`ludobot-stats`) — no assets, no network, no backend
- Native ports of the game as the home surface of the iOS app (`ios/App/View/Games/Ludo/`) and the Android app (`android/.../view/games/ludo/`) — tap a token to move, human seat(s) vs bots, no backend

Set [`../active.json`](../active.json) to `{ "key": "ludo" }` to make this pack the home surface.

## Agent recipe: extend the game

- Rules knobs (safe squares, exit roll, six-streak limit, bot heuristic weights) live in `engine.ts` constants; the native engines (`LudoEngine.swift`, `LudoEngine.kt`) mirror them and must be kept in sync.
- Add persistent stats or leaderboards by following `docs/adding-a-domain.md` (SQL migration + service + GraphQL + typed hooks), then flip `clientOnly` in `catalog.json` so deploys provision the backend.

## Non-goals for this pack

- Auth / accounts (platform flow; see the auth pack)
- Server-side state or online multiplayer — the shipped game is fully client-side (local hotseat only)
