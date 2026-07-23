# Pack: gomoku

Client-only vertical pack: five-in-a-row on a 15x15 goban (the game known as Gomoku in Japan, Omok in Korea, and Wuziqi in China) against a bot or a friend, at `web/app/src/View/Games/Gomoku/`.

## What ships

- GomokuPage with mode/level panels, a wooden goban board with star points, last-move marker, winning-line highlight, undo, and a localStorage score tally (owns `/` when this pack is active; otherwise preview at `/gomoku`)
- `engine.ts` — pure, typed Gomoku engine: freestyle win detection (five or more in a row), draw-on-full-board, candidate-move generation, pattern scoring (open/closed twos, threes, fours), and three bots (proximity-greedy, pattern scoring, pattern scoring + 2-ply minimax with win/block detection)
- DOM board with CSS-drawn grid lines and stones — no assets, no network, no backend
- Native ports of the game as the home surface of the iOS app (`ios/App/View/Games/Gomoku/`) and the Android app (`android/.../view/games/gomoku/`) — tap-to-place vs the same three-level bot, no backend

Set [`../active.json`](../active.json) to `{ "key": "gomoku" }` to make this pack the home surface.

## Agent recipe: extend the game

- The engine API is small and pure: `findWinLine(board, index)`, `candidateCells(board)`, `winningCells(board, stone)`, `cellScore(board, index, stone)`, `findBotMove(board, stone, level)` — all plain functions over the board array, so new rules and bots slot in without touching React.
- Add tournament rules (renju forbidden moves for black, swap2 opening) as a rules toggle in `GomokuPage.tsx` plus a legality check in the engine.
- Strengthen the bot: deepen the minimax in `findBotMove` (the candidate pruning already keeps the branching factor small) or add threat-space search.
- The native bots share the web engine's heuristic weights (`PATTERN_SCORES`); tune them in all three engines together so every platform plays identically.
- Add persistent ratings or saved games by following `docs/adding-a-domain.md` (SQL migration + service + GraphQL + typed hooks), then flip `clientOnly` in `catalog.json` so deploys provision the backend.

## Non-goals for this pack

- Auth / accounts (platform flow; see the auth pack)
- Server-side state or online multiplayer — the shipped game is fully client-side
