# Pack: blackjack

Client-only vertical pack: a casino blackjack table vs a dealer bot (DOM-rendered animated cards, chip betting, WebAudio table sounds) at `web/app/src/View/Games/Blackjack/`.

## What ships

- Table page with chip betting, Hit / Stand / Double Down, and session stats (owns `/` when this pack is active; otherwise preview at `/blackjack`)
- `cards.ts` — pure table logic: 6-deck shoe, soft-total hand valuation, and the house rules as tweakable constants
- `BlackjackTable` felt component rendering DOM cards with CSS deal/flip animations — no canvas, no image assets
- WebAudio synth (`audio.ts`) — chip clinks, card slides, win chimes; no assets, no network, no backend
- Bankroll persisted in `localStorage` under `blackjack.bankroll` (starts at $500, friendly "house credit" reset when broke)
- Native ports of the game as the home surface of the iOS app (`ios/App/View/Games/Blackjack/`) and the Android app (`android/.../view/games/blackjack/`) — same shoe/dealer/payout rules in a pure tested engine, bankroll persisted on-device, no backend

Set [`../active.json`](../active.json) to `{ "key": "blackjack" }` to make this pack the home surface.

## Agent recipe: extend the game

- House rules (deck count, reshuffle point, dealer stand total, blackjack payout, starting bankroll, chip denominations) live in `cards.ts` constants.
- Add splitting pairs: track an array of player hands in `BlackjackPage` instead of one, settle each against the dealer, and add a Split button next to Double.
- Other classic extensions: insurance when the dealer shows an ace, surrender, or a basic-strategy hint bot.
- Add persistent stats or a leaderboard by following `docs/adding-a-domain.md` (SQL migration + service + GraphQL + typed hooks), then flip `clientOnly` in `catalog.json` so deploys provision the backend.

## Non-goals for this pack

- Split, insurance, surrender — left as remix ideas above
- Auth / accounts (platform flow; see the auth pack)
- Server-side state — the shipped game is fully client-side
