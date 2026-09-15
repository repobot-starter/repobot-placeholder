# Pack: accounting

Full-stack vertical pack: "Ledgerly", an AI accounting advisor on the kernel —
public marketing pages (landing + pricing) rendered from the project IA
manifest, sign-up/sign-in on the Identity domain, and a signed-in dashboard
that connects QuickBooks, shows the books in stat cards and data tables, and
chats about them through the kernel AI surface with QuickBooks tool calls.

## What ships

- A root `repobot.project.json` (stamped by compose) that owns the public
  site: `/` and `/pricing` carry inline `landing` configs with real Ledgerly
  starter copy (`soft-saas` preset, every CTA into `/login`) — see
  `docs/project-ia.md` and `docs/landing.md`
- Four dashboard destinations, wired by the IA scaffolder at compose time to
  finished kernel views under `web/app/src/View/Accounting/` (the destination
  entry pages under `View/Accounting*` re-export them, so the scaffolder keeps
  them instead of stubbing):
    - `/overview` — connect-QuickBooks card when disconnected; revenue /
      outstanding / overdue stat cards plus recent invoices once connected
    - `/invoices` — QueryView-style table with a status facet filter, status
      badges, and money formatted per `docs/design-system.md`
    - `/customers` — customer table with open balances
    - `/advisor` — the kernel chat surface (`AiChatThread` over `useAiChat`)
      with accounting starter prompts
- The QuickBooks kernel domain end-to-end: `quickbooks_connections` table,
  `Services/QuickBooks/` (`quickBooksService`), GraphQL
  (`quickBooksStatus` / `quickBooksCompanySnapshot` / `quickBooksCustomers` /
  `quickBooksInvoices`, `connectQuickBooks` / `disconnectQuickBooks` — all
  auth-gated), and blackbox tests under
  `firebase/functions/test/QuickBooks/`
- Three AI advisor tools in
  `firebase/functions/src/Services/Ai/AiChatTools.ts` —
  `quickbooks_company_snapshot`, `quickbooks_list_invoices` (optional status
  filter), `quickbooks_list_customers` — that call the QuickBooks service and
  return JSON (error payloads on failure, never throws), so the advisor
  answers from live data in both `AI_MODE`s
- The kernel Identity domain end-to-end: the `/login` `AuthCard` (email codes
    - password via `authMethods`), `currentUser` hydration, protected routes

Set [`../active.json`](../active.json) to `{ "key": "accounting" }` to make
this pack the home surface. (In the kernel checkout the pack's manifest is not
stamped — the composed template gets it; preview the pieces at `/login` and,
once signed in, the accounting views are reachable after composing.)

## The QUICKBOOKS_MODE contract

`QUICKBOOKS_MODE` (declared in `env.manifest.json`, default `local`) mirrors
`AI_MODE` and `PAYMENTS_MODE`:

- `local` (the workspace and v1 deploys): no Intuit credentials needed.
  "Connect QuickBooks" connects instantly (it creates the connection row), and
  the snapshot/customers/invoices queries serve a deterministic, realistic
  sample company from
  `firebase/functions/src/Services/QuickBooks/QuickBooksSimulation.ts` — a
  dozen customers and ~30 invoices across paid/open/overdue with dates
  computed relative to today, so the demo stays fresh and tests stay
  reproducible. **The QuickBooks dataset is simulated in the workspace** — the
  numbers on the dashboard are Ledgerly's sample company, not a real ledger.
- `intuit`: the real QuickBooks Online integration behind the same
  `quickBooksService` interface — the Intuit OAuth connect flow
  (`beginQuickBooksAuthorization` / `completeQuickBooksAuthorization`), token
  refresh on the connection row, and live reads through the Intuit wrapper.
  The platform stages `QUICKBOOKS_MODE=intuit` plus `QUICKBOOKS_CLIENT_ID` /
  `QUICKBOOKS_CLIENT_SECRET` when the account binds an Intuit integration.

## Agent recipe: make it the customer's product

1. Content pass first: the marketing copy lives in the root
   `repobot.project.json` as inline `landing` configs — rewrite headlines,
   features, tiers, and FAQs there (vocabulary in `docs/landing.md`). Never
   hand-build a marketing page.
2. New public pages and dashboard destinations are manifest entries, not
   hand-inserted routes: add to `marketing.pages` (live at build time) or
   `dashboard.destinations` and re-run `npm run scaffold:ia` — see
   `docs/project-ia.md`.
3. The dashboard's real content lives in `web/app/src/View/Accounting/`
   (`OverviewPage`, `InvoicesPage`, `CustomersPage`, `AdvisorPage`, shared
   helpers in `accountingShared.ts`); the `View/Accounting*` directories are
   thin scaffolder entry points that re-export them — edit the `Accounting/`
   views, not the entries.
4. Tune the advisor in `AiChatTools.ts` (add domain tools next to the
   `quickbooks_*` ones) and the system prompt in `AiChatService.ts` — see
   `docs/ai.md`. Never build bespoke streaming plumbing; the chat surface is
   the kernel's.
5. Extending the books data (e.g. expenses, P&L) is a domain pass per
   `docs/adding-a-domain.md`: grow `QuickBooksSimulation.ts` +
   `quickBooksService` + the GraphQL schema together so `local` mode stays
   fully demoable, then point new views/tools at the new queries.
6. Sign-in methods and branding are configuration: pick methods with
   `authMethods`/`VITE_AUTH_METHODS`, restyle in
   `web/design-system/src/components/AuthCard.tsx` via Storybook — never a
   bespoke login form (`docs/auth.md`).

## Non-goals for this pack

- Xero OAuth (the XERO provider serves the simulation only; live Xero is a
  named follow-up behind the same interface)
- Writing to the customer's books (the domain is read-only by design)
- Real billing (the pricing page is marketing copy; declare `PAYMENTS` and
  reuse the kernel payments domain when the product actually charges —
  `docs/payments.md`)
