# Pack: shop

Full-stack vertical pack: a designed single-product storefront — an author's site selling a book — with Stripe Checkout and no customer accounts. Buyers stay anonymous; the seller manages orders in the Stripe Dashboard.

## What ships

- An editorial storefront at `/`: hero with the book cover, an about-the-author section, pull-quote reviews, and a persistent buy bar — all driven by one content file, `web/app/src/View/Shop/shopContent.ts`
- The product (title, price, currency, cover image) lives server-side in `firebase/functions/src/Services/Shop/ShopCatalog.ts` and is served by the `shopProduct` query; the buy button calls `createCheckoutSession` and redirects to the returned URL
- `/checkout/success` verifies the session server-side (`checkoutSession` query) before showing the confirmation; `/checkout/cancelled` sends the buyer back gracefully
- One designed checkout journey in every mode. In the sandbox, payments run `PAYMENTS_MODE=local`: `createCheckoutSession` records a simulated session in Postgres and the buyer lands on an in-app test checkout page (clearly labeled, no real payment) whose Pay button completes the session
- On deploy, `PAYMENTS_MODE=stripe` creates real Stripe Checkout Sessions with the platform-injected `STRIPE_SECRET_KEY` (connect a Stripe account under Integrations); buyers pay on Stripe's hosted page and orders appear in the Stripe Dashboard (see `docs/payments.md`)

Set [`../active.json`](../active.json) to `{ "key": "shop" }` to make this pack the home surface.

## Agent recipe: build on the storefront

1. Make it theirs: edit `web/app/src/View/Shop/shopContent.ts` (author name, bio, reviews, imagery) and the product in `firebase/functions/src/Services/Shop/ShopCatalog.ts` — price is integer minor units (cents), currency is an ISO code.
2. Restyle in `web/app/src/View/Shop/*.styles.css.ts`; the design language (serif display type, warm paper palette) is meant to be swapped per client.
3. More products: turn `ShopCatalog.ts` into a list, add a `productKey` to `createCheckoutSession`, and grow the storefront into a grid — the session flow already carries the product snapshot.
4. Fulfillment or receipts beyond Stripe's built-ins need a Stripe webhook — a deliberate non-goal here; add one as its own function if the project calls for it.

## Non-goals for this pack

- Real payments in the sandbox (the test checkout is simulated by design; deploy with a connected Stripe account to exercise real Checkout)
- Customer accounts, carts, or inventory (one product, guest checkout — that's the point)
- Webhooks and automated fulfillment (orders live in the Stripe Dashboard)
