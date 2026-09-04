# Pack: saas

Full-stack vertical pack: **Outlay**, a team spend-management product on the
kernel — a launch-grade marketing site (landing + pricing) rendered from the
project IA manifest, sign-up/sign-in on the Identity domain, and a signed-in
dashboard under the app shell with a spend overview, the full transactions
ledger, category budgets, and a corporate-card wall. This is the canonical
configurable base of the `app` family (`isBase`), and it is compose-ready:
the catalog declares landing seeds and a content contract, so design-space
composers can generate variants of it.

## What ships

- A root `repobot.project.json` (stamped by compose) that owns the public
  site: `/`, `/features`, and `/pricing` carry inline `landing` configs
  (`monolith` preset — strict black and white, monumental type — every CTA
  into `/login`) composing the SaaS-grade section set — hero `statement`
  over the real dashboard capture, social-proof `ticker`, feature-grid
  `bento` with product crops in every cell, a features page walking the
  four dashboard screens, highlights with real dashboard captures — see
  `docs/project-ia.md` and `docs/landing.md`
- Real product screenshots under `web/app/public/saas/`, captured from the
  shipped dashboard at 2x by `scripts/brand/capture-saas-shots.mjs` (dev
  stack up, saas pack active) and processed by `npm run image -- responsive`
  (the collage fragments and bento crops are crops of real UI, not mockups).
  Every capture is dark mode with the nav rail collapsed — the register is
  dark-native, and the collapsed rail gives the shot to the product
- Four dashboard destinations wired by the IA scaffolder and implemented
  under `web/app/src/View/Spend/`: `/overview` (KPI stat cards with
  sparklines, the daily-spend curve, category donut, approvals queue,
  recent transactions), `/transactions` (the full ledger in a detailed
  DataTable), `/budgets` (pace bars + spent-vs-limit chart), `/cards` (the
  card wall with per-card activity)
- A deterministic fixture module (`View/Spend/spendData.ts`): 90 days of
  believable spend for a ~12-person company, anchored to relative dates so
  it never goes stale — the same data on every machine, every load
- Auth screens with product-fragment panel art (`AuthShell`'s `panelSlot`
  via `View/LoginPage/authPanelByPack.tsx`) — the login page previews the
  product it gates
- The kernel Identity domain end-to-end: the `/login` `AuthCard` (email
  codes + password via `authMethods`), `currentUser` hydration, protected
  routes
- `/settings` (profile edit, password change, sign out) from the kernel.
  The kernel's `/projects` and `/users` exemplar does NOT ship: this pack
  declares its own dashboard destinations, so the IA scaffolder strips the
  exemplar from the composed template's routes and shell nav — the sidebar
  shows the spend product, not the kernel demo (`docs/project-ia.md`)
- On iOS/Android the home surface is the kernel flow: `SignInView` → native
  shell, compiled from the stamped `ActivePack` constants
- In the workspace, auth runs `AUTH_MODE=local` (simulated codes, "skip as
  local dev user"); deploys run the kernel's built-in auth service — see
  `docs/auth.md` and `docs/environments-and-secrets.md`

Set [`../active.json`](../active.json) to `{ "key": "saas" }` to make this
pack the home surface. (In the kernel checkout the pack's manifest is not
stamped — the composed template gets it; preview the pieces at `/login`,
`/projects`, and `/settings`.)

## Agent recipe: make it the customer's product

1. Content pass first: the marketing copy lives in the root
   `repobot.project.json` as inline `landing` configs — rewrite headlines,
   features, tiers, and FAQs there (vocabulary in `docs/landing.md`). Never
   hand-build a marketing page. Replace the `/saas/*` screenshots with
   captures of the customer's own dashboard once it exists — adapt
   `scripts/brand/capture-saas-shots.mjs` (2x page shots + element crops),
   then `npm run image -- responsive` for the WebP ladders. The
   panel-collage and bento crops should always show the real product.
2. New public pages and dashboard destinations are manifest entries, not
   hand-inserted routes: add to `marketing.pages` (live at build time) or
   `dashboard.destinations` and re-run `npm run scaffold:ia` — see
   `docs/project-ia.md`.
3. Replace the spend domain with the customer's: the dashboard pages under
   `View/Spend/` show the register (deterministic fixtures → StatCard rows
   with trends, ChartCards with gradient fills, a detailed DataTable, an
   approvals queue). Follow `docs/adding-a-domain.md` for real data owned
   by a user, scope queries by the authenticated principal
   (`docs/authorization.md`), then point the pages at the new queries.
4. Sign-in methods and branding are configuration: pick methods with
   `authMethods`/`VITE_AUTH_METHODS`, restyle in
   `web/design-system/src/components/AuthCard.tsx` via Storybook — never a
   bespoke login form (`docs/auth.md`). The auth panel art is data too:
   swap the fragments in `View/LoginPage/authPanelByPack.tsx`.
5. Selling something? The subscription exemplar is already wired: a
   server-side plan catalog (`Services/Saas/SaasPlanCatalog.ts` — Growth
   and Scale, monthly) composes the payments kernel's subscription checkout
   (`docs/payments.md`). The pricing page's "Subscribe to Growth" CTA sends
   visitors to `/subscribe?plan=growth` (signed-out visitors sign up
   first), and the settings page's Billing card shows status/renewal with a
   "Manage billing" portal button. Adjust the plan catalog and the pricing
   tiers together — the tiers are display copy, the catalog is what
   charges. Declare the `PAYMENTS` capability in `repobot.deploy.json` to
   deploy with real Stripe billing; the workspace simulates the full
   lifecycle.

## Non-goals for this pack

- Per-seat or usage-based billing (the exemplar is flat recurring plans;
  grow pricing models in the payments kernel, not per-pack)
- A bespoke admin/roles system (the Users exemplar shows the pattern; real
  authorization is a domain pass per `docs/authorization.md`)
- Real email delivery in the workspace (deploy to exercise sign-up
  confirmation and password reset)
- A real card-issuing/banking integration (the spend domain is a designed
  fiction over deterministic fixtures — the product to sell is the
  register, not a Marqeta wrapper)
