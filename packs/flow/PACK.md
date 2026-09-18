# Pack: flow

Full-stack vertical pack: "Flowline", live budgeting and forecasting on the
kernel — public marketing pages (landing + pricing) rendered from the project
IA manifest, sign-up/sign-in on the Identity domain, a per-user accounting
connection (QuickBooks or Xero), budget grids whose rows link to live P&L
categories (actuals auto-populate, variance computed at read time), and
XLSX export/import through the spreadsheet kernel.

## What ships

- A root `repobot.project.json` (stamped by compose) that owns the public
  site: `/` and `/pricing` carry inline `landing` configs with real Flowline
  starter copy (`luxe-light` preset, every CTA into `/login`) — see
  `docs/project-ia.md` and `docs/landing.md`
- Three dashboard destinations, wired by the IA scaffolder at compose time
  to finished kernel views under `web/app/src/View/Flow/` (the destination
  entry pages under `View/Flow*` re-export them, so the scaffolder keeps
  them instead of stubbing):
    - `/templates` — the signed-in home: create a grid (name, first month,
      3–24 months, optional "start from your live actuals" seeding), import
      a workbook, open or delete templates
    - `/grid?template=<id>` — the budget grid: labels edit inline, every row
      carries a link dropdown over the books' P&L categories, budget cells
      edit in place, and linked rows render live actuals with colored
      variance (favorable green, over red) under every cell; section totals
      and one-click workbook download
    - `/books` — the member's own connection surface: connect QuickBooks or
      Xero (instant in the workspace), see the linkable categories, disconnect
- The flow kernel domain end-to-end: `flow_templates` + `flow_lines` tables,
  `Services/Flow/` (`flowService` — grid CRUD, the computed-grid pass that
  joins budgets to live actuals, seeding, the XLSX export/import round
  trip), auth-gated GraphQL (`flowTemplates` / `flowTemplate` /
  `flowLinkableCategories`, `flowCreateTemplate` / `flowRenameTemplate` /
  `flowDeleteTemplate` / `flowAddLine` / `flowUpdateLine` / `flowRemoveLine`
  / `flowExportTemplateXlsx` / `flowImportTemplateXlsx`), and blackbox tests
  under `firebase/functions/test/Flow/`
- The QuickBooks per-user surface grown for standalone packs:
  `myBooksConnection` / `connectMyBooks` / `disconnectMyBooks` on the shared
  QuickBooks domain (the CFO pack's per-user tenancy, without the practice
  semantics) — each member gets a distinct deterministic sample company in
  `QUICKBOOKS_MODE=local`
- The `XlsxService` spreadsheet kernel underneath: export renders the
  importable "Budget" sheet plus a computed "Actuals vs budget" sheet, filed
  PRIVATE through the storage kernel; import parses any workbook with that
  Budget shape
- The kernel Identity domain end-to-end: the `/login` `AuthCard` (email codes
    - password via `authMethods`), `currentUser` hydration, protected routes

Set [`../active.json`](../active.json) to `{ "key": "flow" }` to make this
pack the home surface. (In the kernel checkout the pack's manifest is not
stamped — the composed template gets it; preview the pieces at `/login` and,
once signed in, the flow views are reachable after composing.)

## The linked-data contract

- Only the plan is stored (`flow_lines.budgets`, comma-joined integer minor
  units, always exactly `month_count` entries — the service owns the
  invariant). Actuals and variance are computed at read time from the live
  P&L, so grids never go stale and nothing needs a sync job.
- A row's `linkedCategory` names a P&L statement line on the owner's books.
  Linked rows get actuals for every month the books serve (13 trailing
  months) and `variance = actual − budget`; months beyond the books (the
  forecast horizon) and unlinked rows read null.
- Seeding (`seedFromActuals`) creates one linked row per P&L category with
  the latest actual month replicated across the grid — a plan to react to
  instead of a wall of zeros.
- The workbook contract: export writes a "Budget" sheet (Line, Section,
  Linked category, then one column per ISO month) plus a computed "Actuals
  vs budget" sheet; import accepts any workbook with that Budget shape and
  always round-trips the export.

## The QUICKBOOKS_MODE contract

Same as the accounting/cfo packs (`env.manifest.json`, default `local`):
instant simulated connections per member in `local` mode with 13 trailing
months of deterministic P&L; `QUICKBOOKS_MODE=intuit` is the labeled seam
where real OAuth slots in behind `quickBooksService` with no template
changes. **Live Google Sheets / Excel-online sync is deliberately deferred**
— no Sheets or Microsoft integration exists at the platform level yet; the
linked-data interface is designed so a future `SHEETS` connection slots
behind the same contract.

## Agent recipe: make it the customer's product

1. Content pass first: the marketing copy lives in the root
   `repobot.project.json` as inline `landing` configs — rewrite headlines,
   features, tiers, and FAQs there (vocabulary in `docs/landing.md`). Never
   hand-build a marketing page.
2. New public pages and dashboard destinations are manifest entries, not
   hand-inserted routes: add to `marketing.pages` (live at build time) or
   `dashboard.destinations` and re-run `npm run scaffold:ia` — see
   `docs/project-ia.md`.
3. The dashboard's real content lives in `web/app/src/View/Flow/`
   (`TemplatesPage`, `GridPage`, `BooksPage`, shared helpers in
   `flowShared.ts` + `flowStyles.css.ts`); the `View/Flow*` directories are
   thin scaffolder entry points that re-export them — edit the `Flow/`
   views, not the entries.
4. New computed columns (per-quarter rollups, full-year totals, percent
   variance) are a pass over `flowService.computeGrid` + the `FlowLine`
   GraphQL type — the grid math lives in one place, never in views.
5. New workbook layouts go through `Services/Xlsx/XlsxService.ts` + the
   storage kernel (`docs/storage.md`) — never hand-rolled file responses.
   Keep the "Budget" sheet's shape stable so import keeps round-tripping.
6. Sign-in methods and branding are configuration: pick methods with
   `authMethods`/`VITE_AUTH_METHODS`, restyle in
   `web/design-system/src/components/AuthCard.tsx` via Storybook — never a
   bespoke login form (`docs/auth.md`).

## Non-goals for this pack

- Live Google Sheets / Excel-online sync (a platform-level integration
  follow-up; the linked-data contract is built for it)
- Xero OAuth (live QuickBooks rides `QUICKBOOKS_MODE=intuit` behind the
  existing service interface; the XERO provider serves the simulation only)
- Multi-member shared templates (grids are per-user; shared planning is a
  follow-up)
- Real billing (the pricing page is marketing copy; declare `PAYMENTS` and
  reuse the kernel payments domain when the product actually charges —
  `docs/payments.md`)
