# Pack roadmap: Wave 2 (auth & payments)

Wave 1 shipped seven client-only packs (link, folio, launch, blog, menu, flash,
quiz) — everything renders from one typed content file, persists on device,
and needs no backend. Wave 2 is the set that earns its backend: every template
below needs accounts, Stripe, or both. **None of these start until the shared
auth + payments foundation is trusted** — the auth pack's config-driven sign-in
and the shop pack's Stripe checkout are the primitives they all compose.

## Shared foundation these packs assume

- **Auth**: the kernel Identity domain as shipped in the `auth` pack —
  config-driven sign-in methods (email code, password, anonymous), session
  stores on all three platforms, and the deploy-time auth provisioning.
- **Payments**: the `shop` pack's Stripe wiring generalized past a single
  product — checkout sessions, webhooks, and a `purchases` table the app can
  query. Subscriptions (for ClubBot/CourseBot) are the piece that does not
  exist yet and should be built once, in the kernel, not per-pack.
- Each pack still keeps the Wave 1 shape: one typed content file for
  everything an owner edits, engines pure and mirrored per platform, native
  iOS/Android ports as the home surface.

## GalleryBot — a gallery storefront the agent stocks

- **Category:** Commerce. **Needs:** payments only (no accounts — buyers stay
  anonymous, like shop buyers).
- ShopBot's single product grown into a curated collection: a gallery grid of
  ~10 pieces, a piece detail view, guest Stripe checkout per piece, and
  digital delivery — the verified success page unlocks the buyer's download.
- The differentiator is the agent as studio assistant: Cursor's native image
  generation (2.4+) lets the workspace agent generate the collection from the
  owner's description. The pack ships a sample 10-piece collection so the
  preview looks finished; the PACK.md recipe's first step is "regenerate the
  collection in the owner's style, owner approves each piece."
- Delivery: full-resolution files live outside the public bundle and are
  served by a backend function that checks the checkout session is paid —
  reusing shop's server-side session verification, still no webhook. This is
  the "content unlocked by purchase" primitive CourseBot needs later, built
  in its simplest form first.
- The promise stays factual (catalog copy rules): your own gallery on your
  own domain, agent-generated inventory you curate, real Stripe checkout,
  instant delivery. No income claims; frame it as curation-by-owner, not
  "sell AI art."
- **Verify before building:** workspace image generation end to end. The
  internal GenerateImage tool is model-dependent (composer models support
  it; the gpt-5.x line currently doesn't) and the image backend has known
  429/timeout flakiness — one sandbox session that generates and lists a
  10-piece collection settles it.

### Draft pack spec

`packs/gallery/catalog.json`:

```json
{
    "key": "gallery",
    "templateKey": "repobot-gallery",
    "title": "GalleryBot",
    "description": "A gallery storefront the agent stocks: describe the collection, curate the pieces, and sell them with Stripe checkout — buyers download instantly, no accounts.",
    "marketingExampleTitle": "Gallery storefront with instant downloads",
    "homePath": "/",
    "previewPath": "/gallery",
    "homeViewDir": "web/app/src/View/Gallery",
    "clientOnly": false,
    "capabilities": ["PAYMENTS", "DATABASE"],
    "isDefault": false
}
```

`packs/gallery/PACK.md` shape (mirrors shop's):

- **What ships:** a gallery grid at `/` (title, cover, price per piece), a
  piece detail view, and the shop checkout journey generalized to a product
  list — pieces (title, description, price, preview image, download file)
  live server-side in a `GalleryCatalog.ts`; `createCheckoutSession` takes a
  `productKey`; `/checkout/success` verifies the session server-side, then
  offers the download from a session-gated function. Display copy (gallery
  name, artist statement, collection intro) lives in one typed
  `galleryContent.ts`.
- **Agent recipe:** (1) generate the collection — the owner describes a
  style, the agent generates ~10 pieces with the image tool, the owner
  approves before listing; (2) make it theirs — content file, palette,
  typography; (3) grow it — collections/tags, editions, pay-what-you-want.
- **Non-goals:** customer accounts or carts (guest checkout per piece),
  webhooks and automated fulfillment beyond the download, print-on-demand,
  and licensing/edition enforcement.

## TipBot — tip jar for creators and crews

- **Category:** Commerce. **Needs:** payments only (no accounts — tippers stay
  anonymous, like shop buyers).
- A one-page tip jar: who you are, what you make, preset amounts ($3/$5/$10)
  plus a custom field, and a thank-you screen worth screenshotting. Owner
  identity, amounts, and copy in `content.ts`.
- Stripe: one-off checkout per tip; webhook records tips so the page can show
  an honest, owner-approved "recent supporters" list.
- Simplest Wave 2 pack — ship first to prove one-off payments outside shop.

## CourseBot — sell one course, teach it well

- **Category:** Learning. **Needs:** auth + payments.
- A course landing page (free preview lessons) and a paid lesson player:
  modules, lessons (video embed or markdown body), and per-lesson completion.
  Course structure in `content.ts`; completion state per account.
- Auth gates the paid lessons; a one-off Stripe purchase (or subscription
  later) unlocks the course; progress syncs across devices via a `progress`
  domain.
- Reuses BlogBot's markdown parser for lesson bodies and FlashBot's
  progress-summary patterns for the module list.

## ClubBot — memberships for a real-world group

- **Category:** Business & Startup. **Needs:** auth + payments (subscriptions).
- A club site: public pages (about, schedule, join) plus a members-only area —
  announcements, member directory, event RSVPs. Club identity and schedule in
  `content.ts`; announcements and RSVPs are backend data.
- Stripe subscriptions with monthly/annual tiers; membership status drives
  what a signed-in account can see. The first subscription consumer, so it
  lands after the kernel grows subscription support.

## TrackBot — habits that survive a phone upgrade

- **Category:** Learning (collection: For kids for the chore variant).
  **Needs:** auth only — no payments.
- A habit tracker: define habits (daily/weekly cadence), check them off, see
  streaks and a month grid. The engine (streak math, cadence windows) is pure
  and mirrored, like the flash scheduler.
- Ships client-only first (device persistence, à la FlashBot), then the same
  `CheckIn` records sync through a `habits` domain once accounts exist —
  the template that proves "start client-only, grow a backend" end to end.

## BookBot — appointments without the phone tag

- **Category:** Business & Startup. **Needs:** auth (owner only) + payments
  (optional deposits).
- A service business booking page: services with durations and prices, weekly
  availability (reuse MenuBot's hours engine), and a slot picker that creates
  bookings. Clients book without accounts; the owner signs in to see the day's
  schedule and block time off.
- Stripe deposits at booking time are the payments piece; cancellation windows
  in content. The scheduling engine (slot generation from hours minus existing
  bookings) is pure and mirrored per platform.

## Sequencing

1. **TipBot** — payments, no accounts; smallest step past shop.
2. **GalleryBot** — payments, no accounts; proves multi-product checkout and
   session-gated delivery (the purchase-unlocks-content primitive CourseBot
   reuses). Gated on verifying workspace image generation first.
3. **TrackBot** — client-only release immediately, accounts sync when auth is
   trusted; no payments risk at all.
4. **BookBot** — owner-only auth plus one-off deposits.
5. **CourseBot** — full auth + one-off purchase + synced progress; reuses
   GalleryBot's session-gated delivery for paid lessons.
6. **ClubBot** — last, once kernel subscriptions exist and have been proven.
