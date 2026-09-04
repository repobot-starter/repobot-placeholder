# Pack: invoice

Full-stack documents pack: an invoice generator whose form becomes a
professional PDF. The PDF pipeline is the documents kernel — templates are
files in the repo, generation is one stateless endpoint.

Documents is a kernel capability, not pack-private code — the full layer map
and reuse recipes live in `docs/documents.md`.

## What ships

- The generator surface at `/`: `web/app/src/View/Invoices/InvoicePage.tsx`
  is a thin binder — form state and money math live in `invoiceForm.ts`, the
  transport is `web/core/src/Documents/DocumentsApi.ts`, and the PDF downloads
  straight from the response
- The invoice template as repo files:
  `firebase/functions/documents/templates/invoice/` (template.html,
  template.css, schema.json, sample.json) — edit the files, redeploy, done
- The kernel's documents endpoint: `documents__request__api`
  (`firebase/functions/src/CloudFunctions/Documents.ts`) — GET /templates
  lists templates, POST /generate streams PDF bytes back. Clients derive its
  URL from the GraphQL URL — no extra config.
- Two modes, mirroring auth, payments, and ai: in the workspace
  `DOCUMENTS_MODE=local` renders with the machine's own Chromium (no service,
  no token); on deploy `DOCUMENTS_MODE=platform` calls the platform's render
  service with the injected `DOCUMENTS_RENDER_URL` + `DOCUMENTS_TOKEN`
- Stateless by design: nothing is stored server-side; the Downloads card
  keeps this session's PDFs re-downloadable in the client

Set [`../active.json`](../active.json) to `{ "key": "invoice" }` to make this
pack the home surface.

## Agent recipe: build on documents

The template files are the extension point — a new document type is a new
directory, not new code (see `docs/documents.md`).

1. Restyle the invoice: edit
   `firebase/functions/documents/templates/invoice/template.html` and
   `template.css`. Mustache tags (`{{field}}`, `{{#list}}...{{/list}}`) bind
   the schema's fields; money arrives preformatted, so templates never do
   currency math.
2. Add a field: declare it in `schema.json`, reference it in the HTML, add it
   to `sample.json`, then bind a form input in `InvoicePage.tsx` and include
   it in `buildInvoiceOverrides` (`invoiceForm.ts`).
3. Add a new document type (quote, receipt, report): create
   `documents/templates/<key>/` with the four files and POST
   `{ "templateKey": "<key>", "overrides": { ... } }` to the same endpoint.
   `sample.json` must validate against `schema.json` — the kernel's tests
   enforce this for every template in the repo.
4. To require sign-in, add the `AUTH` capability, gate the route with
   `ProtectedRoutes`, and verify the bearer token in
   `CloudFunctions/Documents.ts` with `principalService`.
5. To persist invoices (numbering, status, history), add a domain via
   `docs/adding-a-domain.md` and call the generation service from your
   resolvers — `documentGenerationService.generateDocument` returns the PDF
   bytes for you to store or send.

## Non-goals for this pack

- Saved invoices and numbering sequences (stateless v1; add a domain for
  history)
- Multi-currency and locale-aware totals (the binder formats USD; swap the
  formatter in `invoiceForm.ts`)
- Email delivery (combine with the kernel mail wrapper in a follow-up)
