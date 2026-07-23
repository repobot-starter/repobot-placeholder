# Pack: style

Client-only vertical pack: StyleBot, a timed dress-to-impress fashion game (emoji dress-up doll, runway judging, WebAudio glam synth) at `web/app/src/View/Games/Style/`.

## What ships

- Fashion-console page with theme card, season scoreboard, and a tabbed closet (owns `/` when this pack is active; otherwise preview at `/style`)
- `DressUpStage` runway component — a doll composed from stacked emoji layers with a strut animation and camera-flash sparkles
- `wardrobe.ts` — all items, themes, judge one-liners, and scoring constants as pure data
- WebAudio synth (`audio.ts`) — no assets, no network, no backend; best season score persists in localStorage
- Native ports of the game as the home surface of the iOS app (`ios/App/View/Games/Style/`) and the Android app (`android/.../view/games/style/`) — tap-to-dress closet vs the clock, emoji runway doll, best score in device storage, no backend

Set [`../active.json`](../active.json) to `{ "key": "style" }` to make this pack the home surface.

## Agent recipe: extend the game

- New items, slots, themes, and judge one-liners live in `wardrobe.ts` — add an entry and the closet, model, and judging pick it up automatically.
- Scoring (`MATCH_POINTS`, bonuses), round length, and rounds per season are named constants in `wardrobe.ts`; runway timing lives in `StylePage.tsx`.
- Add persistent leaderboards by following `docs/adding-a-domain.md` (SQL migration + service + GraphQL + typed hooks), then flip `clientOnly` in `catalog.json` so deploys provision the backend.

## Non-goals for this pack

- Auth / accounts (platform flow; see the auth pack)
- Server-side state — the shipped game is fully client-side (best score is localStorage only)
