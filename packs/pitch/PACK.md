# Pack: pitch

Full-stack vertical pack: "Deckline", an investor deck builder on the kernel —
public marketing pages (landing + pricing) rendered from the project IA
manifest, sign-up/sign-in on the Identity domain, a per-user accounting
connection (QuickBooks or Xero), decks whose chart slides fill themselves from
the live books, brand controls (logo upload + accent color), and print-quality
PDF export through the documents kernel.

## What ships

- A root `repobot.project.json` (stamped by compose) that owns the public
  site: `/` and `/pricing` carry inline `landing` configs with real Deckline
  starter copy (`aurora-dark` preset, every CTA into `/login`) — see
  `docs/project-ia.md` and `docs/landing.md`
- Three dashboard destinations, wired by the IA scaffolder at compose time
  to finished kernel views under `web/app/src/View/Pitch/` (the destination
  entry pages under `View/Pitch*` re-export them, so the scaffolder keeps
  them instead of stubbing):
    - `/decks` — the signed-in home: create a deck (name, company, tagline —
      the slides arrive pre-written from the live books when they're
      connected), open the builder, or delete a deck
    - `/builder?deck=<id>` — the builder: brand card (company/tagline, accent
      swatches, logo upload through the storage kernel), live `ChartCard`
      previews (revenue, net income, cash) plus headline stats (TTM revenue,
      growth, margin, runway), slide-by-slide copy editing with include
      toggles (the cover never toggles off), one-click PDF export
    - `/books` — the member's own connection surface: connect QuickBooks or
      Xero (instant in the workspace), see the headline numbers the decks use,
      disconnect any time
- The pitch kernel domain end-to-end: `pitch_decks` + `pitch_slides` tables,
  `Services/Pitch/` (`pitchService` — deck/slide CRUD, the `deckData` pass
  that computes traction/revenue/margins/runway from the live books, the
  PDF export that rides `documentGenerationService`), auth-gated GraphQL
  (`pitchDecks` / `pitchDeck` / `pitchDeckData`, `pitchCreateDeck` /
  `pitchUpdateDeck` / `pitchDeleteDeck` / `pitchUpdateSlide` /
  `pitchExportDeckPdf`), and blackbox tests under
  `firebase/functions/test/Pitch/`
- The `pitch-deck` document template
  (`firebase/functions/documents/templates/pitch-deck/`): one Letter page
  per slide — branded cover, traction stat grid, pure-CSS bar charts for
  revenue/net income/cash (the service precomputes bar heights and
  preformatted values; the template never does math), runway stats, and the
  ask. The logo rides in as a data URI read from the storage kernel.
- The QuickBooks per-user surface shared with the flow pack:
  `myBooksConnection` / `connectMyBooks` / `disconnectMyBooks` — each member
  gets a distinct deterministic sample company in `QUICKBOOKS_MODE=local`
- The kernel Identity domain end-to-end: the `/login` `AuthCard` (email codes
    - password via `authMethods`), `currentUser` hydration, protected routes

Set [`../active.json`](../active.json) to `{ "key": "pitch" }` to make this
pack the home surface. (In the kernel checkout the pack's manifest is not
stamped — the composed template gets it; preview the pieces at `/login` and,
once signed in, the pitch views are reachable after composing.)

## The live-numbers contract

- Only brand and copy are stored (`pitch_decks`, `pitch_slides`). The chart
  slides' numbers are never persisted — `pitchService.deckData` computes
  them from the live P&L and balance sheet at read and export time, so a
  deck exported today and re-exported next month shows next month's books.
- The fixed outline is COVER, TRACTION, REVENUE, MARGINS, RUNWAY, ASK — one
  row each in `pitch_slides`. Copy is editable per slide; `included` toggles
  a slide out of the export (the cover is always in).
- Deck creation pre-writes slide copy from the books when they're connected
  ("Revenue grew 34% over the trailing year…") and with placeholders
  otherwise; either way the copy is the user's to rewrite.
- Runway: trailing-three-month average net income against latest cash;
  cash-flow-positive companies show "Cash-flow positive" instead of a
  month count.
- PDF export requires connected books (FAILED_PRECONDITION otherwise — the
  chart slides are the deck) and files the PDF PRIVATE through the storage
  kernel; the web downloads it via `fileUrl` like every other upload.

## The QUICKBOOKS_MODE contract

Same as the accounting/cfo/flow packs (`env.manifest.json`, default `local`):
instant simulated connections per member in `local` mode with 13 trailing
months of deterministic P&L and balance sheet; `QUICKBOOKS_MODE=intuit` is
the labeled seam where real OAuth slots in behind `quickBooksService` with
no template changes.

## Agent recipe: make it the customer's product

1. Content pass first: the marketing copy lives in the root
   `repobot.project.json` as inline `landing` configs — rewrite headlines,
   features, tiers, and FAQs there (vocabulary in `docs/landing.md`). Never
   hand-build a marketing page.
2. New public pages and dashboard destinations are manifest entries, not
   hand-inserted routes: add to `marketing.pages` (live at build time) or
   `dashboard.destinations` and re-run `npm run scaffold:ia` — see
   `docs/project-ia.md`.
3. The dashboard's real content lives in `web/app/src/View/Pitch/`
   (`DecksPage`, `BuilderPage`, `BooksPage`, shared helpers in
   `pitchShared.ts` + `pitchStyles.css.ts`); the `View/Pitch*` directories
   are thin scaffolder entry points that re-export them — edit the `Pitch/`
   views, not the entries.
4. New slide kinds are a vertical pass: add the kind to `pitch_slides`
   (enum + migration), default copy in `defaultSlideCopy`, overrides in
   `exportDeckPdf`, a section in the `pitch-deck` template, and the label in
   `pitchShared.ts`. The deck math lives in `pitchService.deckData`, never
   in views or templates.
5. Deck layout changes go through the `pitch-deck` document template
   (`template.html` + `template.css` + `schema.json`, authoring recipe in
   `docs/documents.md`) — the renderer takes preformatted strings and
   precomputed bar heights; keep the math in the service.
6. Sign-in methods and branding are configuration: pick methods with
   `authMethods`/`VITE_AUTH_METHODS`, restyle in
   `web/design-system/src/components/AuthCard.tsx` via Storybook — never a
   bespoke login form (`docs/auth.md`).

## Non-goals for this pack

- PowerPoint/Keynote export (the PDF is the deliverable; an editable-deck
  export is a follow-up)
- Custom slide ordering or free-form slides (the fixed outline is the
  product; new kinds are an agent pass, see the recipe)
- AI-written narrative (the default copy is deterministic from the numbers;
  an AI polish pass can ride the existing AI capability as a follow-up)
- Xero OAuth (live QuickBooks rides `QUICKBOOKS_MODE=intuit` behind the
  existing service interface; the XERO provider serves the simulation only)
- Real billing (the pricing page is marketing copy; declare `PAYMENTS` and
  reuse the kernel payments domain when the product actually charges —
  `docs/payments.md`)
