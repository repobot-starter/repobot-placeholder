# Pack: code

Client-only vertical pack: CodeBot, a block-programming puzzle game (build a program, press RUN, watch the robot feed the pet) at `web/app/src/View/Games/Code/`.

## What ships

- Lab console page with level picker, mission panel, program strip, and block palette (owns `/` when this pack is active; otherwise preview at `/code`)
- Pure interpreter (`interpreter.ts`) that turns a level + program into a full step-by-step trace — separately testable, no React or timers
- 10 levels as pure ASCII-map data (`levels.ts`); progress and stars persist to localStorage (`code.progress`)
- WebAudio synth (`audio.ts`) — no assets, no network, no backend
- Native ports of the game as the home surface of the iOS app (`ios/App/View/Games/Code/`) and the Android app (`android/.../view/games/code/`) — same ten levels and interpreter, touch block editing, progress in UserDefaults/SharedPreferences, no backend

Set [`../active.json`](../active.json) to `{ "key": "code" }` to make this pack the home surface.

## Agent recipe: extend the game

- Add a level: append one entry to `LEVELS` in `levels.ts` (ASCII grid + facing + slot limit + par). Legend is documented at the top of the file.
- Tuning knobs are named constants: `STEP_MS` and `TILE_PX` in `CodePage.tsx`, per-level `slotLimit`/`par` in `levels.ts`.
- New block types (e.g. a "jump" command) go in `interpreter.ts` (`CommandBlock`, `runProgram`) plus a palette label in `CodePage.tsx`.
- Add persistent cross-device progress by following `docs/adding-a-domain.md` (SQL migration + service + GraphQL + typed hooks), then flip `clientOnly` in `catalog.json` so deploys provision the backend.

## Non-goals for this pack

- Auth / accounts (platform flow; see the auth pack)
- Server-side state — the shipped game is fully client-side (localStorage only)
- Drag-and-drop block editing — blocks are click-to-add / click-to-remove by design
