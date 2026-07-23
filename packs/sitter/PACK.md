# Pack: sitter

Client-only vertical pack: SitterBot, a babysitting chaos game (DOM room grid, timed mishaps, WebAudio jingles) at `web/app/src/View/Games/Sitter/`.

## What ships

- House page with a 2×2 room grid, wandering kids, tool tray, and a 2:00 "parents home" countdown (owns `/` when this pack is active; otherwise preview at `/sitter`)
- Data-driven gameplay in `mishaps.ts` — rooms, tools, mishap kinds, spawn pacing, the scripted bathtub-overflow event, and scoring all live in one file
- WebAudio synth (`audio.ts`) for doorbell, fix plinks, wrong-tool buzzes, giggles, and the door chime — no assets, no network, no backend
- Best paycheck persisted in `localStorage` under `sitter.bestPay`
- Native ports of the game as the home surface of the iOS app (`ios/App/View/Games/Sitter/`) and the Android app (`android/.../view/games/sitter/`) — tap-a-tool babysitting with the same mishap tables, best pay in UserDefaults/SharedPreferences, no backend

Set [`../active.json`](../active.json) to `{ "key": "sitter" }` to make this pack the home surface.

## Agent recipe: extend the game

- Gameplay tuning (shift length, spawn curve, mess penalties, star thresholds, pay) lives in `mishaps.ts` constants.
- Add a new mishap by appending to `MISHAP_KINDS` (and a matching tool to `TOOLS` if it needs one) — spawning, escalation, and scoring pick it up automatically.
- Add rooms or rearrange furniture by editing `ROOMS`; positions are percent offsets within each room panel.
- Add persistent leaderboards by following `docs/adding-a-domain.md` (SQL migration + service + GraphQL + typed hooks), then flip `clientOnly` in `catalog.json` so deploys provision the backend.

## Non-goals for this pack

- Auth / accounts (platform flow; see the auth pack)
- Server-side state — the shipped game is fully client-side (best pay is localStorage only)
