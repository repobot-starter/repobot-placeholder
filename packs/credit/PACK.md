# Pack: credit

Full-stack vertical pack: "Docket", a letter-of-credit checking desk on the
kernel — public marketing pages (landing + pricing) rendered from the project
IA manifest, sign-up/sign-in on the Identity domain, drag-and-drop PDF intake
through the storage kernel, SWIFT MT700 field extraction through the
document-intake kernel, and a deterministic discrepancy engine that checks
supporting documents against the credit's terms.

## What ships

- A root `repobot.project.json` (stamped by compose) that owns the public
  site: `/` and `/pricing` carry inline `landing` configs with real Docket
  starter copy (`luxe-light` preset, every CTA into `/login`) — see
  `docs/project-ia.md` and `docs/landing.md`
- Two dashboard destinations, wired by the IA scaffolder at compose time to
  finished kernel views under `web/app/src/View/Credit/` (the destination
  entry pages under `View/Credit*` re-export them, so the scaffolder keeps
  them instead of stubbing):
    - `/desk` — the signed-in home: a drop zone for the LC PDF, and every
      credit on the desk as a card with amount/tolerance, ship-by and expiry
      countdowns, documents-dropped count, and the discrepancy badge
    - `/review?lc=<id>` — one credit in full: the MT700 breakdown (field 20
      reference, 39A tolerance, 44C latest shipment, 48 presentation period,
      ports, partial-shipment/transhipment terms, 46A documents required), a
      drop zone for supporting documents, what each document was read as, and
      the discrepancy report — worst findings first, refreshed on every drop
- The credit kernel domain end-to-end: `credit_lcs` + `credit_documents`
  tables, `Services/Credit/` (`creditService` — LC ingestion, document
  attachment + classification, the deterministic discrepancy engine),
  auth-gated GraphQL (`creditLcs` / `creditLc`, `creditIngestLc` /
  `creditAttachDocument` / `creditRemoveDocument` / `creditDeleteLc`), and
  blackbox tests under `firebase/functions/test/Credit/` that run the bundled
  sample set through the whole flow
- The document-intake kernel underneath: `Services/DocumentIntake/` extracts
  real text from any PDF (`pdfjs-dist`) everywhere, and resolves structured
  fields from the AI model on AI deploys or from deterministic fixtures in
  `AI_MODE=local` (`DocumentIntakeFixtures.ts`)
- Bundled sample PDFs at `web/app/public/samples/credit/` — a letter of
  credit plus invoice, bill of lading, and packing list, downloadable from
  the desk — so the demo works with nothing on hand
- The kernel Identity domain end-to-end: the `/login` `AuthCard` (email codes
    - password via `authMethods`), `currentUser` hydration, protected routes

Set [`../active.json`](../active.json) to `{ "key": "credit" }` to make this
pack the home surface. (In the kernel checkout the pack's manifest is not
stamped — the composed template gets it; preview the pieces at `/login` and,
once signed in, the credit views are reachable after composing.)

## The sample set (and its deliberate discrepancies)

The bundled samples are engineered so the demo shows a real report, not a
blank one:

- `sample-letter-of-credit.pdf` — LC-2026-0815: USD 184,500.00 ±5%, expiry
  2027-06-30, latest shipment 2027-05-31, presentation period 21 days,
  Shanghai → Hamburg, partial shipments not allowed
- `sample-commercial-invoice.pdf` — draws USD 195,300.00: **over the 5%
  tolerance** (cap 193,725.00) → `AMOUNT_OVER_TOLERANCE`
- `sample-bill-of-lading.pdf` — shipped on board 2027-06-04: **four days
  late** → `LATE_SHIPMENT`
- `sample-packing-list.pdf` — clean; ports and goods match

## The discrepancy engine

Deterministic rules in `creditService.checkDiscrepancies` — the same
documents always produce the same report:

- LC-level: credit in force / expired (`LC_IN_FORCE` / `LC_EXPIRED`),
  shipment window open / passed with no B/L yet
- Amount: invoice total against amount + field 39A tolerance
  (`AMOUNT_OVER_TOLERANCE`), currency match (`CURRENCY_MISMATCH`)
- Dates: B/L shipped-on-board against 44C (`LATE_SHIPMENT`), presentation
  window from shipment date + field 48 (`PRESENTATION_WINDOW_OPEN` /
  `PRESENTATION_WINDOW_CLOSED`)
- Ports: B/L loading/discharge against the credit
  (`PORT_OF_LOADING_MISMATCH` / `PORT_OF_DISCHARGE_MISMATCH`)
- Reference: documents quoting a different LC number (`REFERENCE_MISMATCH`)

Findings carry a stable machine `code`, a severity (`OK` / `WARNING` /
`DISCREPANCY`), a human title/detail, and the document they're about; the
report leads with the worst findings.

## The AI_MODE contract

Extraction rides `AI_MODE` (declared in `env.manifest.json`, default
`local`), mirroring `PAYMENTS_MODE` and `QUICKBOOKS_MODE`:

- `local` (the workspace): PDF **text** extraction is real everywhere;
  **structured** field extraction resolves from
  `DocumentIntakeFixtures.ts` — the bundled samples embed fixture markers, so
  the demo is fully deterministic and credential-free.
- `openai` / gateway deploys: structured extraction goes through the model
  with the same Zod schemas (`Services/Credit/CreditService.ts`), so real
  LCs and shipping documents work with no template changes.

## Agent recipe: make it the customer's product

1. Content pass first: the marketing copy lives in the root
   `repobot.project.json` as inline `landing` configs — rewrite headlines,
   features, tiers, and FAQs there (vocabulary in `docs/landing.md`). Never
   hand-build a marketing page.
2. New public pages and dashboard destinations are manifest entries, not
   hand-inserted routes: add to `marketing.pages` (live at build time) or
   `dashboard.destinations` and re-run `npm run scaffold:ia` — see
   `docs/project-ia.md`.
3. The dashboard's real content lives in `web/app/src/View/Credit/`
   (`DeskPage`, `ReviewPage`, the shared `PdfDropZone`, helpers in
   `creditShared.ts` + `creditStyles.css.ts`); the `View/Credit*` directories
   are thin scaffolder entry points that re-export them — edit the `Credit/`
   views, not the entries.
4. New checks are a service pass: add the rule to
   `creditService.checkDiscrepancies` (a pure function over the LC + document
   rows) and assert it in `test/Credit/CreditTest.ts` — the report shape
   (`CreditFinding`) already carries any new code.
5. New document kinds (certificate of origin, insurance certificate) are a
   domain pass per `docs/adding-a-domain.md`: grow the `CreditDocumentKind`
   enum, the extraction schema in `CreditService.ts`, and (for the workspace)
   a fixture in `DocumentIntakeFixtures.ts` + a bundled sample.
6. Sign-in methods and branding are configuration: pick methods with
   `authMethods`/`VITE_AUTH_METHODS`, restyle in
   `web/design-system/src/components/AuthCard.tsx` via Storybook — never a
   bespoke login form (`docs/auth.md`).

## Non-goals for this pack

- Reading raw SWIFT wire messages (the input is the PDF the bank sends; a
  raw MT700 text parser is a follow-up inside `creditService`)
- UCP 600 legal completeness (the engine checks the objective fields —
  dates, amounts, ports, tolerance, references; it is a pre-presentation
  checklist, not a legal opinion)
- Multi-team tenancy (credits are per-user; a shared desk is a follow-up)
- Real billing (the pricing page is marketing copy; declare `PAYMENTS` and
  reuse the kernel payments domain when the product actually charges —
  `docs/payments.md`)
