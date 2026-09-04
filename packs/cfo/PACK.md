# Pack: cfo

Full-stack vertical pack: "Clearline", a fractional-CFO practice portal on the
kernel — public marketing pages (landing + pricing) rendered from the project
IA manifest, sign-up/sign-in on the Identity domain, app-level advisor/client
roles on the CFO domain, email invites, per-user accounting connections
(QuickBooks or Xero), a cross-client portfolio dashboard with statement
drilldowns, and one-click XLSX statement exports through the storage kernel.

## What ships

- A root `repobot.project.json` (stamped by compose) that owns the public
  site: `/` and `/pricing` carry inline `landing` configs with real Clearline
  starter copy (`luxe-light` preset, every CTA into `/login`) — see
  `docs/project-ia.md` and `docs/landing.md`
- Four dashboard destinations, wired by the IA scaffolder at compose time to
  finished kernel views under `web/app/src/View/Cfo/` (the destination entry
  pages under `View/Cfo*` re-export them, so the scaffolder keeps them instead
  of stubbing):
    - `/portfolio` — the signed-in home: advisors get portfolio health tiles
      and a card per client (connection state, revenue, net income, overdue);
      clients get their own headline numbers or a connect prompt
    - `/clients` — advisor-only roster management: invite clients by email,
      watch pending invites, revoke, open any client's statements
    - `/statements` — P&L and balance-sheet drilldowns (13 trailing months)
      with `ChartCard` trends, full statement tables, and XLSX downloads;
      advisors pick a client, clients see their own books
    - `/books` — the member's own connection surface: connect QuickBooks or
      Xero (instant in the workspace), headline stat cards, one-click disconnect
- The CFO kernel domain end-to-end: `cfo_memberships` + `cfo_invites` tables,
  `Services/Cfo/` (`cfoService` — first sign-in becomes the ADVISOR, invited
  emails resolve to CLIENT memberships on sign-in), auth-gated GraphQL
  (`cfoMyMembership` / `cfoClients` / `cfoClient` / `cfoInvites`,
  `cfoInviteClient` / `cfoRevokeInvite` / `cfoConnectMyBooks` /
  `cfoDisconnectMyBooks` / `cfoExportClientStatementsXlsx`), invite email via
  the mail kernel, and blackbox tests under `firebase/functions/test/Cfo/`
- The QuickBooks kernel domain grown for multi-tenancy: per-user connections
  with a `provider` field (`QUICKBOOKS` | `XERO`), realm-scoped snapshot /
  customers / invoices / P&L / balance-sheet getters (each member gets a
  distinct deterministic sample company in `QUICKBOOKS_MODE=local`), and the
  `XlsxService` (exceljs + storage kernel) behind the statement export
- The kernel Identity domain end-to-end: the `/login` `AuthCard` (email codes
    - password via `authMethods`), `currentUser` hydration, protected routes

Set [`../active.json`](../active.json) to `{ "key": "cfo" }` to make this pack
the home surface. (In the kernel checkout the pack's manifest is not stamped —
the composed template gets it; preview the pieces at `/login` and, once signed
in, the CFO views are reachable after composing.)

## Roles and the invite contract

- The first user to sign in becomes the practice's ADVISOR; everyone after
  that is a CLIENT. There is one practice per project (the workspace is the
  practice), so no org/tenant picker exists or is needed.
- Advisors invite clients by email from `/clients`. The invite is a
  `cfo_invites` row plus a mail-kernel email; there is no token round-trip —
  the invited address signs in through the normal auth surface and the CFO
  domain resolves the pending invite into a CLIENT membership on email match.
- Clients see only their own books. Advisors see every client's connection,
  statements, and exports. All authorization lives in `cfoService`
  (`requireAdvisor`, `requireCanViewClient`) — resolvers never re-implement
  it.

## The QUICKBOOKS_MODE contract

`QUICKBOOKS_MODE` (declared in `env.manifest.json`, default `local`) mirrors
`AI_MODE` and `PAYMENTS_MODE`:

- `local` (the workspace and v1 deploys): no Intuit or Xero credentials needed.
  "Connect QuickBooks" / "Connect Xero" connect instantly, and each member's
  realm serves a distinct deterministic sample company from
  `firebase/functions/src/Services/QuickBooks/QuickBooksSimulation.ts` —
  customers, invoices, and 13 trailing months of P&L and balance sheet, scaled
  per company profile with dates computed relative to today. **The accounting
  dataset is simulated in the workspace** — the numbers are Clearline's sample
  companies, not real ledgers.
- `intuit`: the real QuickBooks Online integration behind the same
  `quickBooksService` interface — the Intuit OAuth connect flow, token
  refresh on the connection row, and live reads through the Intuit wrapper;
  staged by the platform when the account binds an Intuit integration. Xero
  OAuth is a named follow-up behind the same `provider` field.

## Agent recipe: make it the customer's product

1. Content pass first: the marketing copy lives in the root
   `repobot.project.json` as inline `landing` configs — rewrite headlines,
   features, tiers, and FAQs there (vocabulary in `docs/landing.md`). Never
   hand-build a marketing page.
2. New public pages and dashboard destinations are manifest entries, not
   hand-inserted routes: add to `marketing.pages` (live at build time) or
   `dashboard.destinations` and re-run `npm run scaffold:ia` — see
   `docs/project-ia.md`.
3. The dashboard's real content lives in `web/app/src/View/Cfo/`
   (`PortfolioPage`, `ClientsPage`, `StatementsPage`, `BooksPage`, shared
   helpers in `cfoShared.ts` + `cfoStyles.css.ts`); the `View/Cfo*`
   directories are thin scaffolder entry points that re-export them — edit
   the `Cfo/` views, not the entries.
4. Growing the books data (new statements, KPIs, categories) is a domain pass
   per `docs/adding-a-domain.md`: grow `QuickBooksSimulation.ts` +
   `quickBooksService` + the GraphQL schema together so `local` mode stays
   fully demoable, then point new views at the new queries.
5. New downloadable artifacts (more workbook layouts, CSVs) go through
   `Services/Xlsx/XlsxService.ts` + the storage kernel (`docs/storage.md`) —
   never hand-rolled file responses.
6. Sign-in methods and branding are configuration: pick methods with
   `authMethods`/`VITE_AUTH_METHODS`, restyle in
   `web/design-system/src/components/AuthCard.tsx` via Storybook — never a
   bespoke login form (`docs/auth.md`).

## Non-goals for this pack

- Xero OAuth (the XERO provider serves the simulation only; live Xero
  follows the intuit mode's shape behind the `provider` field)
- Writing to any client's books (the domain is read-only by design)
- Multi-practice tenancy (one practice per project; a multi-advisor firm is
  the same practice with more ADVISOR memberships, a follow-up)
- Real billing (the pricing page is marketing copy; declare `PAYMENTS` and
  reuse the kernel payments domain when the product actually charges —
  `docs/payments.md`)
