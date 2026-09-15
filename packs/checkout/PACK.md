# Pack: checkout

Feature pack (one-page app): a single-event payment page. The demo sells
"Handmade Pasta Night" — a small-group home cooking class with a date, a
menu card, seats-left scarcity, and one reserve button backed by a real
checkout session: the smallest complete demonstration of taking money,
dressed as something you'd actually want to buy. The shop pack is the full
storefront exemplar; this pack is the payment moment alone, selling an
experience rather than a good so the two read differently in the picker.

Payments is a kernel capability — the checkout session, the Stripe webhook,
the purchases ledger, and the workspace simulation all live in the payments
kernel: see `docs/payments.md`. This pack never touches Stripe directly.

## What ships

- The payment page at `/`: `web/app/src/View/Checkout/CheckoutPage.tsx` —
  class name, date, menu, host, seats left, price, and the reserve button;
  all display copy (including the product's on-page name) lives in
  `checkoutContent.ts`
- The server-side product: the `session` entry in
  `firebase/functions/src/Services/Shop/ShopCatalog.ts` — prices are always
  server-side so the client can never tamper with what a buyer is charged;
  the page passes its key through `CreateCheckoutSessionFields.productKey`
  and reads only the price from it (the catalog entry's own name/tagline
  appear on the hosted checkout, so keep them in step with the page's story)
- The checkout journey: `createCheckoutSession` → redirect to the session's
  URL → `/checkout/success` or `/checkout/cancelled` (kernel routes shared
  with the shop pack)
- Two modes: in the workspace `PAYMENTS_MODE=local` serves the in-app test
  checkout at `/checkout/test` for free; on deploy the account's connected
  Stripe integration makes it a real hosted Stripe Checkout

Set [`../active.json`](../active.json) to `{ "key": "checkout" }` to make
this pack the home surface.

## Agent recipe: build on the payment page

1. Change what's sold: edit the `session` product in `ShopCatalog.ts` (name,
   tagline, price in minor units, currency) and the presentation copy in
   `checkoutContent.ts`. Prices never come from the client.
2. Sell more than one thing: add catalog entries and render a card per
   product — each buy button passes its own `productKey`. The shop pack
   shows the full storefront shape.
3. Gate delivery on payment: read the session on `/checkout/success` and
   deliver there (download link, booking form, access grant). The purchases
   ledger records every completed session.
4. Sell a subscription instead: use the payments kernel's subscription
   journey (`/subscribe`, `createSubscriptionCheckoutSession`) — see
   `docs/payments.md`.

## Non-goals for this pack

- A product catalog, cart, or quantity selection (this is the single-payment
  moment; grow toward the shop pack for a storefront)
- Customer accounts (buyers are anonymous; add `AUTH` to change that)
- Bespoke Stripe wiring of any kind (the payments kernel owns Stripe)
