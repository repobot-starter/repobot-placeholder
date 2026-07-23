# Pack: launch

Client-only vertical pack: a startup landing page (LaunchBot) at `web/app/src/View/Launch/`.

## What ships

- A full SaaS landing page for a fictional product ("Sundial"): nav, hero with waitlist capture, text-logo social-proof strip, six-feature grid, three-step how-it-works, three-tier pricing with a monthly/yearly toggle, FAQ accordion, final CTA, and footer (owns `/` when this pack is active; otherwise preview at `/launch`)
- **Everything renders from `content.ts`** — product story, features, steps, pricing, and FAQ are one typed file; no backend, no CMS
- The waitlist stores the email in localStorage and swaps to a confirmation (client-only); see the upgrade recipe below for a real inbox
- Native ports as the home surface of the iOS app (`ios/App/View/Launch/`) and the Android app (`android/.../view/launch/`) — same content mirrored in `LaunchContent.swift` / `LaunchContent.kt`, with working billing toggle, FAQ accordion, and local waitlist capture

Set [`../active.json`](../active.json) to `{ "key": "launch" }` to make this pack the home surface.

## Agent recipe: make it yours

- Change the product: edit `product`, `features`, `steps`, `pricing`, and `faq` in `web/app/src/View/Launch/content.ts` (and the mirrored constants in `LaunchContent.swift` / `LaunchContent.kt` if the native apps ship).
- The headline's last word gets the accent color automatically — end the sentence on the word you want to pop.
- **Real waitlist inbox:** follow `docs/adding-a-domain.md` to add a `waitlist` domain (SQL migration + service + GraphQL mutation), point `joinWaitlist` in `LaunchPage.tsx` at the mutation, and flip `clientOnly` in `catalog.json` so deploys provision the backend.
- Content tests guard the pricing table on all three platforms — a yearly price above monthly fails the build.

## Non-goals for this pack

- Auth / accounts (platform flow; see the auth pack)
- Payments — when you're ready to charge, see the shop pack's Stripe wiring
