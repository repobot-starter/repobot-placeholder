# Payments

How the shop pack sells things: anonymous Stripe Checkout with a simulated
sandbox mode. One designed journey in every environment; no customer accounts
anywhere.

## The two modes

`PAYMENTS_MODE` (see `env.manifest.json`) selects the checkout backend:

- **`local`** — sandbox and tests only; deployed boot refuses it. The
  `createCheckoutSession` mutation records a `LOCAL` session row in Postgres
  and returns a URL to the in-app test checkout page (`/checkout/test`),
  which is clearly labeled and completes the session via
  `completeTestCheckoutSession`. No Stripe calls, no keys, no real money.
- **`stripe`** — the deployed mode. The mutation creates a real Stripe
  Checkout Session (`DependencyWrappers/StripeWrapper`) priced from the
  server-side catalog and returns Stripe's hosted payment page URL. The
  platform injects `STRIPE_SECRET_KEY` at deploy time from the account's
  connected Stripe integration when `repobot.deploy.json` declares the
  `PAYMENTS` capability; without a connected Stripe account the deploy fails
  with instructions, and checkout use without a key fails with an actionable
  `FAILED_PRECONDITION`.

## The flow

1. The storefront (`web/app/src/View/Shop/ShopPage.tsx`) reads the product
   from the `shopProduct` query and calls `createCheckoutSession` with the
   page's origin; the backend builds the success/cancel redirect URLs from it.
2. The buyer pays on the session's `checkoutUrl` (Stripe's page, or the test
   checkout locally).
3. Stripe redirects to `/checkout/success?session=<id>`. The success page
   runs the `checkoutSession` query, and the service verifies payment
   **server-side** — a `STRIPE` session is only reported `PAID` after
   retrieving it from Stripe and seeing `payment_status = "paid"`. The
   redirect alone is never trusted.

## Invariants — keep these

- **Prices live server-side** (`Services/Shop/ShopCatalog.ts`). The client
  never sends an amount; changing the displayed price cannot change the
  charge.
- **The checkout operations are public by design** (buyers are anonymous);
  they are allowlisted in `publicQueryRootFields` / `publicMutationRootFields`
  (see `docs/authorization.md`). Anything you add to the Shop API must stay
  safe without a principal.
- **Test completion refuses outside local mode.**
  `completeTestCheckoutSession` throws `FAILED_PRECONDITION` when
  `PAYMENTS_MODE=stripe`, so a deployed session can never be faked to PAID.
- **Sessions snapshot the product** (name, amount, currency) so catalog edits
  never rewrite order history.

## Where orders live

The Stripe Dashboard is the order book: payments, receipts, refunds, and
payouts all live there. The `checkout_sessions` table is checkout state, not
fulfillment — if the project needs shipping workflows or webhooks
(`checkout.session.completed`), add them deliberately as their own function
and secret; they are out of scope for the starter.

## Growing the shop

- More products: make `ShopCatalog.ts` a list, add a `productKey` field to
  `CreateCheckoutSessionFields`, and render a grid — sessions already carry a
  product snapshot.
- Real cover art: drop an image in `web/app/public/` and swap the CSS cover in
  `ShopPage.tsx`.
- All storefront copy is in `web/app/src/View/Shop/shopContent.ts`; the
  visual theme is four constants at the top of `ShopPage.styles.css.ts`.
