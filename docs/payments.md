# Payments

The payments kernel: one-off and subscription Stripe Checkout with a
simulated sandbox mode, a purchase ledger, a subscription state table, and
session-gated digital delivery. Selling domains own their product catalogs
and compose the kernel — the shop pack is the one-off exemplar, the saas
pack the subscription exemplar. One-off buyers are anonymous by design;
subscriptions always belong to an authenticated user.

## The shape of the kernel

| Piece                 | Where                                                         | What it is                                                                              |
| --------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Service               | `firebase/functions/src/Services/Payments/PaymentsService.ts` | Checkout sessions, verification, the ledgers, subscriptions, the delivery gate          |
| Product contract      | `Services/Payments/PaymentCatalog` (`PaymentProduct`)         | key, name, price in minor units, currency, kind (`one_time`/`subscription`), interval   |
| Stripe boundary       | `DependencyWrappers/StripeWrapper`                            | The only Stripe call site (no SDK; form-encoded REST)                                   |
| Data                  | `Data/Payments/{CheckoutSession,Purchase,Subscription}`       | `checkout_sessions`, the `purchases` ledger, the `subscriptions` state table            |
| GraphQL               | `Graphql/Core/Payments/Payments.gql`                          | `checkoutSession`, `completeTestCheckoutSession`, `purchases`, `mySubscription`, portal |
| HTTP surface          | `CloudFunctions/Payments.ts` (`payments__request__api`)       | `POST /webhook` (Stripe events), `GET /delivery` (session-gated files)                  |
| One-off exemplar      | `Services/Shop` + `Graphql/Core/Shop/Shop.gql`                | Catalog + `createCheckoutSession(productKey)` over the kernel                           |
| Subscription exemplar | `Services/Saas` + `Graphql/Core/Saas/Saas.gql`                | Plan catalog + `createSubscriptionCheckoutSession(productKey)` over the kernel          |

**Checkout flows are never hand-built.** A pack that sells something keeps a
server-side catalog of `PaymentProduct`s in its own domain and calls
`paymentsService.createCheckoutSession({ idempotencyKey, origin, product })`
(or `createSubscriptionCheckoutSession({ ..., userId })` for recurring
billing). The kernel owns sessions, modes, verification, webhooks, the
ledgers, subscription state, the Billing Portal, and delivery; the consumer
owns only what is being sold.

## The two modes

`PAYMENTS_MODE` (see `env.manifest.json`) selects the checkout backend:

- **`local`** — the simulated mode: sandbox, tests, and dev-posture deploys
  that don't have a Stripe account connected yet (the platform injects
  `DEPLOY_POSTURE=dev` there; production boot refuses `local`). Sessions
  are Postgres rows whose URL points at the in-app test checkout page
  (`/checkout/test`), which is clearly labeled and completes the session via
  `completeTestCheckoutSession`. No Stripe calls, no keys, no real money.
- **`stripe`** — the real mode. A real Stripe Checkout Session is created
  priced from the caller's server-side catalog, and the URL is Stripe's
  hosted payment page. The platform injects `STRIPE_SECRET_KEY` at deploy
  time from the account's connected Stripe integration when
  `repobot.deploy.json` declares the `PAYMENTS` capability; without a
  connected Stripe account a production deploy fails with instructions
  (dev deploys fall back to `local`), and checkout use without a key fails
  with an actionable `FAILED_PRECONDITION`.

## The flow

1. The storefront (`web/app/src/View/Shop/ShopPage.tsx`) reads products from
   the `shopProduct`/`shopProducts` queries and calls `createCheckoutSession`
   with the page's origin and a `productKey`; the backend resolves the
   product server-side and builds the success/cancel redirect URLs.
2. The buyer pays on the session's `checkoutUrl` (Stripe's page, or the test
   checkout locally).
3. Stripe redirects to `/checkout/success?session=<id>`. The success page
   runs the `checkoutSession` query, and the service verifies payment
   **server-side** — a `STRIPE` session is only reported `PAID` after
   retrieving it from Stripe and seeing `payment_status = "paid"`. The
   redirect alone is never trusted.
4. Independently, Stripe's `checkout.session.completed` webhook (when
   configured) marks the session `PAID` — so payment state converges even if
   the buyer never returns to the success page.

## The purchase ledger

Every path to `PAID` on a one-off (PAYMENT) session writes one row to
`purchases` — exactly once, no matter
which observer saw payment first (the webhook, the success page's
verification, or the local test checkout; enforced by a unique constraint on
`checkout_session_id`). The row snapshots the product, so catalog edits never
rewrite order history. Stripe paths also record the buyer's email
(`purchases.buyer_email`; Stripe Checkout collects it) and the same
exactly-once write gates a **receipt email** through the mail kernel
(`docs/mail.md`) — one receipt per purchase, best-effort, never failing the
payment observation it rides on. LOCAL test checkouts have no buyer, so no
email and no receipt.

- Query it with `purchases` (authenticated — for owner dashboards; buyers see
  their own confirmation via the public `checkoutSession` query).
- SUBSCRIPTION sessions never write `purchases`; their exactly-once row goes
  to `subscriptions` instead (see Subscriptions below).
- The Stripe Dashboard remains the financial book of record: payments,
  receipts, refunds, and payouts all live there.

## Subscriptions

Recurring billing grows here in the kernel — a `mode: "subscription"`
session type plus the `subscriptions` state table — never per-pack.

- **The product contract**: a subscription is a `PaymentProduct` with
  `kind: "subscription"` and an `interval` (`"month"` or `"year"`). One-off
  products omit `kind` (it defaults to `one_time`) and are unaffected.
- **Checkout is never anonymous.** Unlike one-off checkout, recurring
  billing entitles an account:
  `paymentsService.createSubscriptionCheckoutSession({ idempotencyKey,
origin, product, userId })` requires the acting user, and the consumer's
  GraphQL mutation (`createSubscriptionCheckoutSession` in the saas domain)
  is authenticated — deliberately NOT in the public allowlist.
- **Activation is exactly-once.** Every path to PAID on a SUBSCRIPTION
  session writes one `subscriptions` row (status ACTIVE), enforced by a
  unique constraint on `checkout_session_id` — the same pattern as the
  purchases ledger, no matter which observer saw payment first (webhook,
  success-page verification, or the local test checkout). The row snapshots
  the product (key, name, amount, currency, interval). Stripe activations
  also send a `subscriptionStarted` receipt through the mail kernel,
  exactly once, best-effort.
- **Status follows Stripe.** `customer.subscription.updated`,
  `customer.subscription.deleted`, `invoice.paid`, and
  `invoice.payment_failed` move the row through
  ACTIVE / PAST_DUE / CANCELED. The success page's server-side verification
  also pulls the subscription's status and `current_period_end` at
  activation, so state converges without the webhook — but keeping deployed
  subscriptions current (dunning, cancellations from the portal) needs the
  webhook configured.
- **Entitlement checks always go through
  `paymentsService.hasActiveSubscription(userId, productKey)`.** Only
  ACTIVE entitles; PAST_DUE and CANCELED do not. Never query the table
  ad-hoc from another domain.
- **Reading state**: `mySubscription(productKey)` (authenticated) returns
  the caller's subscription or null; the settings page's Billing card is
  the exemplar surface.
- **Managing billing**: `createBillingPortalSession(origin)`
  (authenticated) returns a Stripe Billing Portal URL — Stripe owns payment
  methods, invoices, and cancellation there. In local mode it returns the
  in-app test billing page (`/billing/test`, clearly labeled like
  `/checkout/test`), which cancels the simulated subscription via
  `cancelTestSubscription` — a mutation that refuses outright when
  `PAYMENTS_MODE=stripe`, mirroring `completeTestCheckoutSession`.
- **The local lifecycle** needs no Stripe: subscription checkout returns
  the in-app test checkout URL, completing it activates a simulated ACTIVE
  subscription, and the test billing page cancels it.

## The webhook

`payments__request__api` `POST /webhook` handles `checkout.session.completed`
(one-off and subscription sessions), the subscription lifecycle events
(`customer.subscription.updated` / `customer.subscription.deleted` /
`invoice.paid` / `invoice.payment_failed`), and acknowledges everything
else. Every delivery is verified against `STRIPE_WEBHOOK_SECRET` (Stripe's
v1 signing scheme, implemented in `Services/Payments/StripeWebhook.ts`)
before any processing; without the secret the endpoint refuses.

The webhook is **optional for one-off sales**: server-side verification on
the success page already converges payment state. Configure it (Stripe
Dashboard → Webhooks → the deployed function URL) when the app must observe
payment without the buyer returning — fulfillment flows, digital delivery
notifications, membership activation — and whenever the app sells
subscriptions, so PAST_DUE/CANCELED transitions land without the user
visiting.

## Session-gated delivery

The "purchase unlocks content" primitive: `GET /delivery?session=<id>`
verifies the session is `PAID` server-side, then streams the product's
delivery file — the single file in
`firebase/functions/delivery/<productKey>/`. Adding a deliverable to a
product is dropping a file in that directory, not writing code; products
without a directory simply have no delivery (`CheckoutSession.deliveryAvailable`
is false and no link renders).

On the web, derive the endpoint with `derivePaymentsEndpoint` and build the
link with `buildDeliveryUrl` (both in `@base/core`); the shop's success page
is the exemplar. Full-resolution files stay out of the public web bundle by
construction — they live with the functions package and are only ever
streamed through the paid-session check.

## Invariants — keep these

- **Prices live server-side** in the consumer's catalog
  (`Services/Shop/ShopCatalog.ts`, `Services/Saas/SaasPlanCatalog.ts`). The
  client sends a `productKey`, never an amount; changing the displayed price
  cannot change the charge.
- **The one-off checkout operations are public by design** (buyers are
  anonymous); they are allowlisted in `publicQueryRootFields` /
  `publicMutationRootFields` (see `docs/authorization.md`). Anything added
  to the public checkout surface must stay safe without a principal. The
  `purchases` ledger query is deliberately NOT public.
- **Subscription checkout is never anonymous.** Every subscription
  operation (`createSubscriptionCheckoutSession`, `mySubscription`,
  `createBillingPortalSession`, `cancelTestSubscription`) is authenticated
  and stays out of the public allowlist; the service requires the acting
  `userId`.
- **Test completion and test cancellation refuse outside local mode.**
  `completeTestCheckoutSession` and `cancelTestSubscription` throw
  `FAILED_PRECONDITION` when `PAYMENTS_MODE=stripe`, so a deployed session
  can never be faked to PAID and a deployed subscription can only be
  cancelled through Stripe's Billing Portal.
- **Sessions snapshot the product** (key, name, amount, currency, interval)
  so catalog edits never rewrite order history; purchases and subscriptions
  copy the snapshot again.
- **Entitlement checks always go through `hasActiveSubscription`.** Domains
  gate subscriber features on
  `paymentsService.hasActiveSubscription(userId, productKey)`, never on a
  redirect, a client claim, or ad-hoc table reads.
- **Webhook deliveries are never processed unverified.** Signature first,
  parsing second.
- **Delivery trusts only the database.** The gate re-verifies `PAID`
  server-side on every request; possession of the success URL alone unlocks
  nothing until payment settles.

## Growing a paid product

- **More products**: add entries to `ShopCatalog.ts` (or your own domain's
  catalog) and pass their keys through
  `CreateCheckoutSessionFields.productKey`; sessions and purchases already
  carry per-product snapshots.
- **A new selling domain** (e.g. a gallery, tips, bookings): mirror the shop
  shape — a catalog module, a thin service that resolves the product and
  delegates to `paymentsService`, and your own GraphQL create mutation.
  Do not fork session/webhook/ledger plumbing.
- **Digital delivery**: drop the file in
  `firebase/functions/delivery/<productKey>/` and render the success-page
  link when `deliveryAvailable` is true.
- **A new subscription plan or subscribing domain**: mirror the saas shape —
  a plan catalog of `kind: "subscription"` products
  (`Services/Saas/SaasPlanCatalog.ts`), a thin service delegating to
  `paymentsService.createSubscriptionCheckoutSession`, an authenticated
  mutation, and `hasActiveSubscription` for the entitlement gate. The
  subscribe journey (`/subscribe` → checkout → `/checkout/success`) and the
  settings Billing card already work for any registered plan.
- All storefront copy is in `web/app/src/View/Shop/shopContent.ts`; the
  visual theme is four constants at the top of `ShopPage.styles.css.ts`.
- Adapt before you signpost: rewrite `shopContent.ts` and the catalog to
  what the project sells _before_ adding any nav entry or CTA to `/shop`.
  `scripts/verify-shop-integration.mjs` (part of `check:all`/`check:web`)
  fails the gate when anything links to `/shop` while the storefront still
  carries the stock demo (The Lighthouse Letters).
