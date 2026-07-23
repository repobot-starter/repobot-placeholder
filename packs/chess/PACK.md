# Pack: chess

Client-only vertical pack: full-rules chess against a bot or a friend (DOM board, pure-function engine, WebAudio sounds) at `web/app/src/View/Games/Chess/`.

## What ships

- ChessPage with mode/difficulty panels, algebraic move list, and captured-piece trays (owns `/` when this pack is active; otherwise preview at `/chess`)
- `engine.ts` — pure, typed chess engine: full legal move generation (castling, en passant, promotion), check/checkmate/stalemate/insufficient-material detection, evaluation, and three bots (random, greedy, depth-3 alpha-beta)
- `ChessBoard.tsx` DOM grid board with Unicode pieces and WebAudio synth (`audio.ts`) — no assets, no network, no backend
- Native ports of the game as the home surface of the iOS app (`ios/App/View/Games/Chess/`) and the Android app (`android/.../view/games/chess/`) — tap-to-move board vs the bot or local 2P, no backend

Set [`../active.json`](../active.json) to `{ "key": "chess" }` to make this pack the home surface.

## Agent recipe: extend the game

- The engine API is small and pure: `legalMoves(state)`, `applyMove(state, move)`, `evaluate(state)`, `getOutcome(state)`, `findBotMove(state, difficulty)` — all plain functions over `GameState`, so new rules and bots slot in without touching React.
- Add a promotion-choice dialog: the engine already generates all four promotion pieces per pawn move; `handleSquareClick` in `ChessPage.tsx` currently auto-picks the queen.
- Add more draw rules (fifty-move via the tracked `halfmoveClock`, threefold repetition) in `getOutcome`, or a stronger bot (deeper search, quiescence, opening book) in `findBotMove`.
- Add persistent ratings or saved games by following `docs/adding-a-domain.md` (SQL migration + service + GraphQL + typed hooks), then flip `clientOnly` in `catalog.json` so deploys provision the backend.

## Non-goals for this pack

- Auth / accounts (platform flow; see the auth pack)
- Server-side state or online multiplayer — the shipped game is fully client-side
