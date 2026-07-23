# Pack: carrom

Client-only vertical pack: carrom, the South Asian flicking board game (canvas physics loop, WebAudio clicks, bot opponent) at `web/app/src/View/Games/Carrom/`.

## What ships

- Parlor page with mode (vs bot / hotseat 2P), bot level, coin trays, match score and turn/foul ticker (owns `/` when this pack is active; otherwise preview at `/carrom`)
- `CarromGame` canvas component with slingshot drag-to-flick input, driving the pure `engine.ts` simulation (fixed-timestep circle physics, friction, pockets, queen-cover rules, match to 25)
- WebAudio synth (`audio.ts`) — no assets, no network, no backend; lifetime match tally in localStorage (`carrombot-stats`)
- Native ports of the game as the home surface of the iOS app (`ios/App/View/Games/Carrom/`) and the Android app (`android/.../view/games/carrom/`) — drag-to-flick vs the bot, no backend

Set [`../active.json`](../active.json) to `{ "key": "carrom" }` to make this pack the home surface.

## Agent recipe: extend the game

- Physics feel (friction, restitution, striker power) and rules (match target, queen points) live in `engine.ts` constants; the iOS/Android engines mirror them and must be kept in sync.
- Bot skill lives in the `BOT_LEVELS` gaussian-error table in `engine.ts`.
- Add persistent match history by following `docs/adding-a-domain.md` (SQL migration + service + GraphQL + typed hooks), then flip `clientOnly` in `catalog.json` so deploys provision the backend.

## Non-goals for this pack

- Auth / accounts (platform flow; see the auth pack)
- Online multiplayer — the shipped game is fully client-side (bot or hotseat)
