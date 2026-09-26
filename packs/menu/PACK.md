# Pack: menu

Client-only vertical pack: a local-business site (MenuBot) at `web/app/src/View/Menu/`.

## What ships

- A café/restaurant one-pager: hero with a live **Open / Closed** badge, a filterable menu (section + dietary chips, prices on the showcase `meta` slot), weekly hours, and a contact block with call / directions / email links — composed on the landing kernel (`warm-boutique` preset; `menuLanding.ts` rebuilds the `LandingConfig` from `content.ts` per render so the badge stays live, `docs/landing.md`); owns `/` when this pack is active, otherwise preview at `/menu`
- **Everything renders from `content.ts`** — business identity, menu sections and prices (in cents), weekly hours, and contact details in one typed file
- The open/closed logic lives in `hours.ts`: pure functions over minutes-since-midnight intervals (split days like lunch + supper service supported), mirrored in `MenuHours.swift` / `MenuHours.kt` with the same tests, so the badge agrees on every platform
- Native ports as the home surface of the iOS app (`ios/App/View/Menu/`) and the Android app (`android/.../view/menu/`) with tel:, mailto:, and maps links wired to native intents

Set [`../active.json`](../active.json) to `{ "key": "menu" }` to make this pack the home surface.

## Agent recipe: make it yours

- Change the business: edit `business`, `menu`, `weeklyHours`, and `hoursNote` in `web/app/src/View/Menu/content.ts` (and the mirrored constants in `MenuContent.swift` / `MenuContent.kt` if the native apps ship). Prices are integers in cents; hours are minutes since midnight.
- A day with two service windows is just two intervals; a closed day is simply omitted.
- Content tests on all three platforms verify prices are positive, item names unique, and hour intervals sorted and non-overlapping.
- **Online ordering / reservations:** that's a backend — follow `docs/adding-a-domain.md` for an `orders` domain, or wire the CTA to an external service, then flip `clientOnly` in `catalog.json` if you add the domain.

## Non-goals for this pack

- Online ordering, reservations, or payments (see the shop pack's Stripe wiring when ready)
- Multi-location support — duplicate the content file per location or ask the agent to add a location switcher
