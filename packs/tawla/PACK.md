# Pack: tawla

Client-only vertical pack: backgammon the café way (tawla) — full western rules, a heuristic bot with three levels, and a match-to-5 scoreboard — at `web/app/src/View/Games/Tawla/`.

## What ships

- Café-table page with mode/level panels, dice tray, pip counts, and the match score (owns `/` when this pack is active; otherwise preview at `/tawla`)
- Pure rules engine (`engine.ts`): legal move-sequence generation with forced-move rules (play both dice when possible, else the higher), bar entry, blot hitting, exact-or-higher bear-off, and gammon/backgammon scoring
- Heuristic bot (pip count, blot exposure vs direct shots, made points, home-board strength, bear-off progress) at easy/medium/hard — no assets, no network, no backend
- Match tally persists in localStorage (`tawlabot-stats`)
- Native ports of the game as the home surface of the iOS app (`ios/App/View/Games/Tawla/`) and the Android app (`android/.../view/games/tawla/`) — touch-first vs the bot, no backend

Set [`../active.json`](../active.json) to `{ "key": "tawla" }` to make this pack the home surface.

## Agent recipe: extend the game

- Rules and bot weights live in `engine.ts` (`HEURISTIC` constants); the match target and dice pacing live in `TawlaPage.tsx` constants.
- Add the doubling cube: track cube value/owner in `TawlaPage.tsx` state, add offer/take/drop UI between rolls, and multiply `GameResult.points` on settle — the engine's `winResult` already isolates the scoring math.
- Add persistent leaderboards by following `docs/adding-a-domain.md` (SQL migration + service + GraphQL + typed hooks), then flip `clientOnly` in `catalog.json` so deploys provision the backend.

## Non-goals for this pack

- Doubling cube (see the extension recipe above — intentionally left out of the shipped table)
- Auth / accounts (platform flow; see the auth pack)
- Server-side state — the shipped game is fully client-side
