# Pack: cabin

Client-only vertical pack: CabinBot, a flight-attendant time-management game (DOM cabin scene, WebAudio chimes, special-event passengers) at `web/app/src/View/Games/Cabin/`.

## What ships

- Cabin page with Start Flight / difficulty toolbar, flight-progress bar, galley tray, and altitude status bar (owns `/` when this pack is active; otherwise preview at `/cabin`)
- `flight.ts` simulation module: passenger roster, request/patience loop, the three special events (celebrity, runner, grandma), and every tuning constant in one `TUNING` object
- WebAudio synth (`audio.ts`) — no assets, no network, no backend; best star rating persists in localStorage (`cabin.bestRating`)
- Native ports of the game as the home surface of the iOS app (`ios/App/View/Games/Cabin/`) and the Android app (`android/.../view/games/cabin/`) — tap-to-serve seat map running the same flight simulation, no backend

Set [`../active.json`](../active.json) to `{ "key": "cabin" }` to make this pack the home surface.

## Agent recipe: extend the game

- Gameplay balance (flight length, patience, spawn ramp, happiness rewards, event timing) lives in `TUNING` inside `flight.ts`; galley items and passenger faces are data arrays right next to it.
- Add a new special event by extending the `events` schedule in `createFlight` and handling its kind in `tickEvents` — the runner/grandma/celebrity handlers are the pattern to copy.
- Add persistent flight logs or leaderboards by following `docs/adding-a-domain.md` (SQL migration + service + GraphQL + typed hooks), then flip `clientOnly` in `catalog.json` so deploys provision the backend.

## Non-goals for this pack

- Auth / accounts (platform flow; see the auth pack)
- Server-side state — the shipped game is fully client-side
