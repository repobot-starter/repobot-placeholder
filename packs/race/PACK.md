# Pack: race

Client-only vertical pack: a neon three-lane highway racer (canvas game loop, lane-change steering, nitro boost, overtake scoring) at `web/app/src/View/Games/Race/`.

## What ships

- Pit-wall cockpit page with telemetry/controls/race-brief panels and a localStorage best run (owns `/` when this pack is active; otherwise preview at `/race`)
- `engine.ts` — pure, typed race engine: cruise-speed difficulty ramp, lane-change glide, draining/regenerating nitro gauge, cadence-based traffic spawning that always leaves an escape lane, overtake bonuses, and forgiving crash rectangles
- Canvas renderer with scrolling rumble strips, dashed lane dividers, glowing cars, and a nitro flame — no assets, no network, no backend
- Native ports of the game as the home surface of the iOS app (`ios/App/View/Games/Race/`) and the Android app (`android/.../view/games/race/`) — tap pads to change lane, a hold pad for nitro, no backend

Set [`../active.json`](../active.json) to `{ "key": "race" }` to make this pack the home surface.

## Agent recipe: extend the game

- Gameplay tuning (cruise ramp, nitro drain/regen, traffic speeds, spawn cadence, overtake bonus) lives in the exported constants at the top of `engine.ts`; the native engines (`RaceEngine.swift`, `RaceEngine.kt`) mirror them — keep all three in sync so every platform drives identically.
- Add pickups (fuel cans, score gems) as a new entity list in the engine: spawn them in `trySpawnCar`'s cadence, scroll them with traffic, and pay them in the collision pass.
- Add weather or day/night as render-only variety: the draw functions take everything from engine state, so visual themes never touch the rules.
- Add persistent leaderboards by following `docs/adding-a-domain.md` (SQL migration + service + GraphQL + typed hooks), then flip `clientOnly` in `catalog.json` so deploys provision the backend.

## Non-goals for this pack

- Auth / accounts (platform flow; see the auth pack)
- Server-side state — the shipped game is fully client-side (best run is localStorage only)
