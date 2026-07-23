# Pack: hanafuda

Client-only vertical pack: Koi-Koi, the classic two-player Japanese hanafuda (flower card) game, played against a bot at `web/app/src/View/Games/Hanafuda/`.

## What ships

- Koi-Koi table page (owns `/` when this pack is active; otherwise preview at `/hanafuda`) — dark lacquer-and-gold aesthetic, capture trays grouped by card type, yaku toasts, koi-koi/shobu dialog, 6-round scoreboard
- The full 48-card hanafuda deck drawn as inline SVG (`cards.tsx`) — 12 months x 4 cards in traditional red/black/white/gold flat art, no assets, no network
- Pure rules engine (`engine.ts`): deck, deal, turn state machine, yaku evaluation, and the bot AI — no React imports, unit-testable
- Match tally persisted in localStorage under `hanafudabot-stats`
- Native ports of the game as the home surface of the iOS app (`ios/App/View/Games/Hanafuda/`) and the Android app (`android/.../view/games/hanafuda/`) — same engine rules mirrored 1:1; native card faces use simplified drawing (month kanji + motif emoji + card-type color coding) instead of the web's full SVG art, no backend

Set [`../active.json`](../active.json) to `{ "key": "hanafuda" }` to make this pack the home surface.

## House rules (implemented identically on all three platforms)

- 6-round match, dealer alternates each round; the player deals (and leads) round 1
- Deal is 8/8/8 (each hand / the field); the remaining 24 cards form the draw pile
- Matching three field cards of the played month captures all four
- Winning with 7+ points doubles the round score; winning after the _opponent_ called koi-koi doubles it again (the two multipliers stack)
- If you called koi-koi and later win with a bigger hand, standard scoring applies (no extra multiplier beyond the two above)
- If both hands run out with no shobu, the round is a draw (0 points each)
- A yaku formed on your last hand card auto-banks (shobu) — you cannot koi-koi with an empty hand
- The September sake cup counts as an animal only (not dual animal/chaff); teyaku (lucky deals) and the four-of-a-month redeal are not implemented
- Ribbon/animal/chaff counting yaku (tan/tane/kasu) stack with akatan/aotan; the bright yaku (goko/shiko/ame-shiko/sanko) are mutually exclusive — only the best applies

## Agent recipe: extend the game

- Rules knobs (round count, yaku point values, bot heuristics) live in `engine.ts` constants — mirror any change into `HanafudaEngine.swift` / `HanafudaEngine.kt` to keep the ports in lockstep (both carry "must stay in sync with the web" doc comments)
- Card art is componentized per month in `cards.tsx`; restyle a motif without touching the engine
- Add persistent match history by following `docs/adding-a-domain.md` (SQL migration + service + GraphQL + typed hooks), then flip `clientOnly` in `catalog.json` so deploys provision the backend

## Non-goals for this pack

- Auth / accounts (platform flow; see the auth pack)
- Server-side state — the shipped game is fully client-side
- Multiplayer — the opponent is always the bot
