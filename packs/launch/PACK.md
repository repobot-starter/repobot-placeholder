# Pack: launch

Client-only vertical pack: a startup landing page (LaunchBot) at `web/app/src/View/Launch/`, composed on the **landing kernel** (`docs/landing.md`).

## What ships

- A full landing page for a fictional product ("Lumina", a smart night light that tells dad jokes — the copy speaks in the lamp's first-person voice): nav, badge hero with two scroll-anchor CTAs over night photography, text-logo social-proof strip, six-feature grid, alternating image highlight rows (`web/app/public/showcase/lumina-*.jpg`), three-step how-it-works, reviews, three-tier pricing with a monthly/yearly toggle, FAQ accordion, waitlist capture at the foot, and footer (owns `/` when this pack is active; otherwise preview at `/launch`)
- **Copy lives in `content.ts`; composition lives in `LaunchPage.tsx`** — the page is a `LandingConfig` (section order, variants, `dark-dev` style preset) rendered by the kernel's `LandingRenderer`; there is no bespoke section code or styles file
- The waitlist stores the email in localStorage and swaps to a confirmation (client-only); see the upgrade recipe below for a real inbox
- Native ports as the home surface of the iOS app (`ios/App/View/Launch/`) and the Android app (`android/.../view/launch/`) — same content mirrored in `LaunchContent.swift` / `LaunchContent.kt`, with working billing toggle, FAQ accordion, and local waitlist capture

Set [`../active.json`](../active.json) to `{ "key": "launch" }` to make this pack the home surface.

## Agent recipe: make it yours

- Change the product: edit `product`, `features`, `steps`, `nightly`, `reviews`, `pricing`, and `faq` in `web/app/src/View/Launch/content.ts` (and the mirrored constants in `LaunchContent.swift` / `LaunchContent.kt` if the native apps ship). The first-person lamp voice is a deliberate conceit — keep it or replace it wholesale; half-measures read worst.
- Change the artwork: the hero backdrop and highlight rows point at `web/app/public/showcase/lumina-*.jpg`; swap in your own images (or switch the highlight media to `glyph` for zero-asset art) — see `docs/landing.md`.
- Change the look: swap the `preset` in `LaunchPage.tsx` (`dark-dev` | `soft-saas` | `editorial`), or override individual `--marketing-*` tokens via `style.overrides` — see `docs/landing.md`.
- Change the structure: reorder the `sections` array, switch a section's `variant` (e.g. hero `centered-stack` → `split-media`), or drop/add sections — all config edits, no new components.
- The headline's last word gets the accent treatment automatically — end the sentence on the word you want to pop.
- **Real waitlist inbox:** follow `docs/adding-a-domain.md` to add a `waitlist` domain (SQL migration + service + GraphQL mutation), swap the `LandingRenderer`'s localStorage capture for the mutation, and flip `clientOnly` in `catalog.json` so deploys provision the backend.
- Content tests guard the pricing table on all three platforms — a yearly price above monthly fails the build.

## Non-goals for this pack

- Auth / accounts (platform flow; see the auth pack)
- Payments — when you're ready to charge, see the shop pack's Stripe wiring
