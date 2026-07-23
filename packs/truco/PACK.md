# Pack: truco

Client-only vertical pack: Truco Paulista — Brazil's bluffing card game — heads-up against a bot, on a festive boteco table at `web/app/src/View/Games/Truco/`.

## What ships

- Boteco table page with score panel, vira display, truco raise dialogs, and a "Cara de pau" bluff-personality slider (owns `/` when this pack is active; otherwise preview at `/truco`)
- `engine.ts` — the pure rules engine: 40-card deck, manilha ordering, trick/hand/game state machine, the 1→3→6→9→12 raise ladder, and the bluffing bot — no React, no network, no assets
- Game tally persisted in localStorage under `trucobot-stats`
- Native ports of the game as the home surface of the iOS app (`ios/App/View/Games/Truco/`) and the Android app (`android/.../view/games/truco/`) — tap to play cards, same rules engine, no backend

Set [`../active.json`](../active.json) to `{ "key": "truco" }` to make this pack the home surface.

## Rules implemented (Truco Paulista)

- 40-card deck: ranks 4, 5, 6, 7, Q, J, K, A, 2, 3 in four suits (no 8/9/10). Plain-card order, low to high: 4 < 5 < 6 < 7 < Q < J < K < A < 2 < 3.
- Manilhas: after the deal, the vira is flipped; the rank **above** the vira (wrapping 3 → 4) is the manilha rank. Manilhas beat every plain card and rank among themselves by suit: ouros ♦ < espadas ♠ < copas ♥ < zap ♣ — the clubs manilha is the strongest card in the game.
- Hands: 3 cards each, best of 3 tricks. Plain cards of equal rank tie ("empate"); manilhas never tie.
- Tie edge cases (documented on the engine too):
    - Trick 1 tied → whoever wins trick 2 takes the hand.
    - Tricks 1 and 2 tied → trick 3 decides.
    - A later trick ties after someone won an earlier one → the winner of the first non-tied trick takes the hand immediately.
    - All three tricks tied → the hand goes to the "mão" (the player who led the hand).
    - A tied trick keeps the same leader for the next trick; otherwise the trick winner leads.
- Stakes: a hand is worth 1 point. Either side may call "Truco!" (3), and raises alternate up the ladder: Seis (6), Nove (9), Doze (12). The responder may accept, re-raise, or fold ("correr") — folding concedes the stake in force _before_ the pending raise. First to 12 points wins the game.
- Mão de onze: at 11 points you see your hand and choose to play (hand locked at 3 points, no truco calls) or fold (opponent gets 1). Simplification: when _both_ sides are at 11, the hand is played normally at a locked stake of 3 (no raises).

## Bot

Hand strength is scored from manilha count and top ranks; the bot calls and answers truco proportionally to strength, but bluffs a configurable fraction of the time. The "Cara de pau" slider (honest → shameless) sets the bluff rate and is passed straight to the engine. Calls come with table-talk lines ("Truco!", "Seis!", "Cai dentro!", "Corro!").

## Agent recipe: extend the game

- Rules knobs (raise ladder, winning score, bot thresholds, table-talk lines) live in `engine.ts` constants; the iOS/Android engines mirror them and must be kept in sync.
- Add persistent match history by following `docs/adding-a-domain.md` (SQL migration + service + GraphQL + typed hooks), then flip `clientOnly` in `catalog.json` so deploys provision the backend.

## Non-goals for this pack

- Auth / accounts (platform flow; see the auth pack)
- Multiplayer or server-side state — the shipped game is fully client-side vs the bot
- Truco Mineiro / Gaudério rule variants (Paulista only)
