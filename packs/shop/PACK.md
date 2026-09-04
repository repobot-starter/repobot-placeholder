# Pack: shop

Full-stack vertical pack: a designed single-product storefront — an author's site selling a book — composing the payments kernel (`docs/payments.md`) with no customer accounts. Buyers stay anonymous; the seller manages orders in the Stripe Dashboard.

## What ships

- An editorial storefront at `/`: hero with the book cover, an about-the-author section, pull-quote reviews, and a persistent buy bar — all driven by one content file, `web/app/src/View/Shop/shopContent.ts`
- The catalog (product keys, prices, currency) lives server-side in `firebase/functions/src/Services/Shop/ShopCatalog.ts` and is served by the `shopProduct`/`shopProducts` queries; the buy button calls `createCheckoutSession` with a `productKey` and redirects to the returned URL
- `/checkout/success` verifies the session server-side (`checkoutSession` query) before showing the confirmation, and offers the session-gated download when the product ships one (`deliveryAvailable`); `/checkout/cancelled` sends the buyer back gracefully
- A digital-delivery exemplar: the book's bonus letter in `firebase/functions/delivery/book/` is streamed by the payments kernel's `GET /delivery` endpoint only after payment is verified
- One designed checkout journey in every mode. In the workspace, payments run `PAYMENTS_MODE=local`: `createCheckoutSession` records a simulated session in Postgres and the buyer lands on an in-app test checkout page (clearly labeled, no real payment) whose Pay button completes the session
- On deploy, `PAYMENTS_MODE=stripe` creates real Stripe Checkout Sessions with the platform-injected `STRIPE_SECRET_KEY` (connect a Stripe account under Integrations); buyers pay on Stripe's hosted page and orders appear in the Stripe Dashboard. Every path to PAID also writes the kernel's `purchases` ledger

Set [`../active.json`](../active.json) to `{ "key": "shop" }` to make this pack the home surface.

## Agent recipe: build on the storefront

1. Make it theirs: edit `web/app/src/View/Shop/shopContent.ts` (author name, bio, reviews, imagery) and the catalog in `firebase/functions/src/Services/Shop/ShopCatalog.ts` — price is integer minor units (cents), currency is an ISO code. Do this before linking `/shop` from any other page: a CTA into the untouched demo bookshop is a broken promise, and `verify-shop-integration` fails the gate on it.
2. Restyle in `web/app/src/View/Shop/*.styles.css.ts`; the design language (serif display type, warm paper palette) is meant to be swapped per client.
3. More products: add entries to `shopProducts` and grow the storefront into a grid — `createCheckoutSession` already takes a `productKey` and sessions carry per-product snapshots.
4. Digital goods: drop the file in `firebase/functions/delivery/<productKey>/`; the success page renders the download link automatically. Fulfillment beyond that hangs off the kernel's Stripe webhook (`payments__request__api /webhook`) — set `STRIPE_WEBHOOK_SECRET` and read `docs/payments.md`.

## Non-goals for this pack

- Real payments in the workspace (the test checkout is simulated by design; deploy with a connected Stripe account to exercise real Checkout)
- Customer accounts, carts, or inventory (one product, guest checkout — that's the point)
- Automated fulfillment workflows beyond the session-gated download (orders live in the Stripe Dashboard)
