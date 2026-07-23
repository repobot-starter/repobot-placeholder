# Pack: pong

Client-only vertical pack: a retro Pong cabinet (canvas game loop, WebAudio bleeps, bot opponent) at `web/app/src/View/Games/Pong/`.

## What ships

- Cabinet page with mode/difficulty/speed panels (owns `/` when this pack is active; otherwise preview at `/pong`)
- `PongGame` canvas component running its own requestAnimationFrame loop
- WebAudio synth (`audio.ts`) — no assets, no network, no backend
- Native ports of the game as the home surface of the iOS app (`ios/App/View/Games/Pong/`) and the Android app (`android/.../view/games/pong/`) — touch paddle vs the bot, no backend

Set [`../active.json`](../active.json) to `{ "key": "pong" }` to make this pack the home surface.

## Agent recipe: extend the game

- Gameplay (paddle sizes, ball speed, win score) lives in `PongGame.tsx` constants.
- Add persistent high scores by following `docs/adding-a-domain.md` (SQL migration + service + GraphQL + typed hooks), then flip `clientOnly` in `catalog.json` so deploys provision the backend.

## Non-goals for this pack

- Auth / accounts (platform flow; see the auth pack)
- Server-side state — the shipped game is fully client-side
