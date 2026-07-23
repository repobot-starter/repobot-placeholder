# Pack: sugar

Client-only vertical pack: a landing page for a physical retail brand (SugarBot) at `web/app/src/View/Sugar/`. The demo brand is **The Sugar Bin**, a pink pastry vending machine restocked fresh every morning — but the shape fits any "physical thing, sold from real locations, on a schedule" business: coffee carts, flower kiosks, farm stands, food trucks.

## What ships

- A one-page brand site: hero with story, a CSS-drawn pink vending machine, how-it-works steps, today's rotating case, machine locations with live status badges, a host-a-machine CTA, and a donation note (owns `/` when this pack is active; otherwise preview at `/sugar`)
- **Everything editable lives in `content.ts`** — brand copy, how-it-works steps, daily lineups (name / emoji / description / price in cents), machine locations with schedules, and contact links in one typed file
- The freshness logic lives in `freshness.ts`: pure functions that turn a machine's schedule (stocked days, restock minute, sellout minute) into a live badge — *Restocking at 7:00 AM*, *Stocked fresh*, *Selling fast*, *Sold out — back tomorrow* — mirrored in `SugarFreshness.swift` / `SugarFreshness.kt` with the same tests
- The daily case rotates automatically: `lineupIndexForDay` cycles through the lineups one per day, so regulars see a different case each morning
- Native ports as the home surface of the iOS app (`ios/App/View/Sugar/`) and the Android app (`android/.../view/sugar/`)

Set [`../active.json`](../active.json) to `{ "key": "sugar" }` to make this pack the home surface.

## Agent recipe: make it yours

- Change the brand: edit `brand`, `howItWorks`, and `contact` in `web/app/src/View/Sugar/content.ts` (and the mirrored data in `SugarContent.swift` / `SugarContent.kt` if the native apps ship).
- Change the menu: edit `lineups` — any number of lineups, each with any number of items. One lineup means a fixed menu; more means daily rotation.
- Change the locations: edit `machines`. Times are minutes since midnight (`7 * 60` = 7 AM); `stockedDays` uses 0 = Sunday … 6 = Saturday. The status badges follow automatically.
- Content tests on all three platforms verify machine names are unique and every schedule is coherent (restock before sellout, days in range).
- **Online ordering, reservations, or real-time inventory:** that's a backend — follow `docs/adding-a-domain.md`, then flip `clientOnly` in `catalog.json`. Payments land with the platform's Stripe foundation.

## Non-goals for this pack

- Real inventory tracking — the badges are schedule-based ("typically sells out by 1 PM"), which is honest and needs no backend
- Online ordering or payments (planned platform foundation; see `packs/ROADMAP.md`)
- Maps integration — locations are described in words; ask the agent to add map links if you want them
