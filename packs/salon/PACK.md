# Pack: salon

Client-only vertical pack: a pastel hair-salon glow-up game (SVG hair rendering, station-by-station play loop, WebAudio foley) at `web/app/src/View/Games/Salon/`.

## What ships

- Salon page with request cards, a five-station strip (wash / cut / color / style / finish), and a before/after reveal with scoring and a persisted best streak (owns `/` when this pack is active; otherwise preview at `/salon`)
- `ClientHead` SVG component — `buildHairdo({length, texture})` turns any look into hair shapes, with dye colors and accessories layered on
- Client/request/reaction data and scoring constants in `clients.ts`
- WebAudio synth (`audio.ts`) — no assets, no network, no backend
- Native ports of the game as the home surface of the iOS app (`ios/App/View/Games/Salon/`) and the Android app (`android/.../view/games/salon/`) — touch-driven stations and canvas-drawn clients, no backend (best streak is in-memory only)

Set [`../active.json`](../active.json) to `{ "key": "salon" }` to make this pack the home surface.

## Agent recipe: extend the game

- New dye colors, styles, accessories, names, and reaction lines are data edits in `clients.ts` (the UI grids and scoring pick them up automatically).
- Hair shapes (silhouettes, braids, the updo bun) live in `buildHairdo` and its edge helpers in `ClientHead.tsx`.
- Scoring knobs are `POINTS_PER_MATCH` and `WASH_BONUS_MAX` in `clients.ts`; the mood thresholds are in `moodFor`.
- Add persistent salon leaderboards by following `docs/adding-a-domain.md` (SQL migration + service + GraphQL + typed hooks), then flip `clientOnly` in `catalog.json` so deploys provision the backend.

## Non-goals for this pack

- Auth / accounts (platform flow; see the auth pack)
- Server-side state — the shipped game is fully client-side (best streak lives in localStorage)
