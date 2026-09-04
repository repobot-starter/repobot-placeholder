# Pack: quickbooks

Feature pack (one-page app): the QuickBooks connection moment and the books
it unlocks, on a single page — a dark-mode finance command center. Connect
hero (with a live dashboard preview) until a company is linked, then KPI
cards with sparklines (cash on hand, monthly revenue, net profit,
outstanding A/R), thirteen months of income vs expenses with a glowing
net-profit line, the expense mix donut, A/R aging, top customers, and the
latest invoices — every number derived from the same reads so the story is
consistent across cards, charts, and tables. The accounting pack is the
full product built on the same domain (multi-page dashboard, AI advisor);
this pack is the sync itself.

The QuickBooks domain is kernel machinery, not pack code:
`firebase/functions/src/Services/QuickBooks/QuickBooksService.ts` behind
`Graphql/Core/QuickBooks/QuickBooks.gql`.

## What ships

- The sync surface at `/`:
  `web/app/src/View/QuickBooksSync/QuickBooksSyncPage.tsx` — connect hero
  until a company is connected, then the one-page command center (KPI
  sparkline cards, 13-month cash-flow chart, expense donut, A/R aging, top
  customers, latest invoices) with a live-sync pill and disconnect action.
  The page force-applies its own dark palette (`commandCenter.css.ts`);
  chart data comes from `quickBooksProfitAndLoss`/`quickBooksBalanceSheet`
  via the pack's own statements query (`booksData.ts`), charts are
  hand-rolled SVG (`charts.tsx`)
- Two modes on one env var (`QUICKBOOKS_MODE`, mirroring auth/payments/ai):
    - `local` (the workspace): `connectQuickBooks` connects instantly to a
      realistic simulated sample company — no Intuit account needed
    - `intuit` (deploys with a bound INTUIT connection): the connect button
      starts the real OAuth consent flow (`useQuickBooksOAuth` →
      `beginQuickBooksAuthorization` / `completeQuickBooksAuthorization`) and
      reads hit the live Intuit API
- The mode is stored per connection row, so a LOCAL sample connection keeps
  simulating even after the env flips — demos never break on deploy
- Reads (`quickBooksStatus`, `quickBooksCompanySnapshot`,
  `quickBooksCustomers`, `quickBooksInvoices`) are public; connecting
  requires a session, so the page signs visitors in as anonymous guests
  before connecting

Set [`../active.json`](../active.json) to `{ "key": "quickbooks" }` to make
this pack the home surface.

## Agent recipe: build on the sync

1. Show different numbers: `quickBooksProfitAndLoss` and
   `quickBooksBalanceSheet` serve thirteen trailing months each — the home
   surface already charts them (`booksData.ts` is the query + derivation
   exemplar; the donut plots expense lines, income lines are still
   unplotted).
2. Add the advisor: declare the `AI` capability and mount the kernel chat
   surface with the `quickbooks_*` tools — the accounting pack's
   AdvisorPage is the exemplar (`docs/ai.md`).
3. Export statements: `exportQuickBooksStatementsXlsx` files a workbook
   through the storage kernel; download via `fileUrl`.
4. Per-user books instead of one workspace company: use
   `connectMyBooks`/`myBooksConnection` (each user gets their own
   connection) — the cfo and flow packs are the exemplars.

## Non-goals for this pack

- Writing back to QuickBooks (the kernel domain is read-only by design)
- Multi-company switching (one workspace connection; per-user books are the
  recipe above)
- The full accounting dashboard and advisor (that is the accounting pack)
