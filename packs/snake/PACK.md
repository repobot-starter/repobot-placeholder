# Pack: snake

Client-only vertical pack: a retro terminal Snake game (canvas game loop, level progression, localStorage high scores) at `web/app/src/View/Games/Snake/`.

## What ships

- Terminal page with status/log/high-score panels (owns `/` when this pack is active; otherwise preview at `/snake`)
- `SnakeGame` canvas component running its own requestAnimationFrame loop
- High scores persisted in `localStorage` — no assets, no network, no backend
- Native ports of the game as the home surface of the iOS app (`ios/App/View/Games/Snake/`) and the Android app (`android/.../view/games/snake/`) — swipe-to-steer snake with local high scores, no backend

Set [`../active.json`](../active.json) to `{ "key": "snake" }` to make this pack the home surface.

## Agent recipe: extend the game

- Gameplay (grid size, tick rate, level pacing, scoring) lives in `SnakeGame.tsx` constants.
- Add persistent high scores by following `docs/adding-a-domain.md` (SQL migration + service + GraphQL + typed hooks), then flip `clientOnly` in `catalog.json` so deploys provision the backend.

## Non-goals for this pack

- Auth / accounts (platform flow; see the auth pack)
- Server-side state — the shipped game is fully client-side
