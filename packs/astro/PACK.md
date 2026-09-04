# Pack: astro

Client-only vertical pack: a neon asteroids shooter cockpit (canvas game loop, splitting asteroids, parallax starfield) at `web/app/src/View/Games/Astro/`.

## What ships

- Cockpit page with status/controls/mission panels (owns `/` when this pack is active; otherwise preview at `/astro`)
- `AstroGame` canvas component running its own requestAnimationFrame loop
- Entity factories (`entities.ts`) — no assets, no network, no backend
- Native ports of the game as the home surface of the iOS app (`ios/App/View/Games/Astro/`) and the Android app (`android/.../view/games/astro/`) — touch pads to turn/thrust/fire, no backend

Set [`../active.json`](../active.json) to `{ "key": "astro" }` to make this pack the home surface.

## Agent recipe: extend the game

- Gameplay (thrust, fire cooldown, lives, per-tier scores) lives in `AstroGame.tsx` constants; asteroid tiers (radius/speed) live in `entities.ts`.
- Add persistent high scores by following `docs/adding-a-domain.md` (SQL migration + service + GraphQL + typed hooks), then flip `clientOnly` in `catalog.json` so deploys provision the backend.

## Non-goals for this pack

- Auth / accounts (platform flow; see the auth pack)
- Server-side state — the shipped game is fully client-side (high score is localStorage only)
