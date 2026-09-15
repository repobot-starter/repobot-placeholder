# Pack: asteroid

Client-only vertical pack: vector asteroids in wraparound space (canvas game loop, WebAudio synth, keyboard + touch controls) at `web/app/src/View/Games/Asteroid/`.

## What ships

- Monochrome game page with score/lives/wave HUD and start/pause/game-over overlays (owns `/` when this pack is active; otherwise preview at `/asteroid`)
- `AsteroidGame` canvas component running its own requestAnimationFrame loop: ship rotation and thrust with momentum, wraparound space, rocks that split twice before clearing, waves that grow, three lives with respawn invulnerability
- WebAudio synth (`audio.ts`) — no assets, no network, no backend
- Touch controls (turn, thrust, fire) overlaid on coarse-pointer devices; keyboard is arrows/WASD plus space
- Best score persisted in `localStorage` under `asteroid.best`

Unlike the older game packs, this one has no native iOS/Android port — the web surface is the whole product (`capabilities` is empty).

Set [`../active.json`](../active.json) to `{ "key": "asteroid" }` to make this pack the home surface.

## Agent recipe: extend the game

- Gameplay (ship handling, rock tiers and scores, wave sizes, lives, fire rate) lives in `AsteroidGame.tsx` constants.
- Classic extensions: a flying saucer that shoots back, hyperspace jump on a cooldown, score-based extra lives.
- Add persistent high scores by following `docs/adding-a-domain.md` (SQL migration + service + GraphQL + typed hooks), then flip `clientOnly` in `catalog.json` so deploys provision the backend.

## Non-goals for this pack

- Native ports (no iOS/Android surface yet)
- Auth / accounts (platform flow; see the auth pack)
- Server-side state — the shipped game is fully client-side
