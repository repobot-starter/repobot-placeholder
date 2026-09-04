# Documents

Documents is a modular kernel capability with the same three-layer shape as
auth (`docs/auth.md`) and AI (`docs/ai.md`): it turns a template plus data
into a downloadable PDF. The defining design choice is that **templates are
files in the repo**, not database rows — an agent builds a new document type
by writing files, exactly like it builds everything else.

| Layer    | Where                                        | What it owns                                                                                                                                   |
| -------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Template | `firebase/functions/documents/templates/`    | One directory per document type: `template.html` + `template.css` (Mustache-tagged), `schema.json` (fields, page size), `sample.json`.         |
| Client   | `web/core/src/Documents/DocumentsApi.ts`     | Endpoint derivation, `fetchDocumentTemplates`, and `generateDocumentPdf` (overrides in, `Blob` + file name out).                               |
| Backend  | `firebase/functions/src/Services/Documents/` | Template loading, override validation, Mustache render, the printable wrapper, and the PDF render client (`documents__request__api` endpoint). |

There is no document persistence layer of its own: generation is stateless,
the PDF bytes stream straight back to the caller. Products that need saved
documents file them through the storage kernel —
`documentGenerationService.generateAndFileDocument` is the one-call path
(generate → `writeFile` → the READY upload record, e.g. for a document
register); `docs/storage.md` covers the record. Products with their own
shape add a domain (`docs/adding-a-domain.md`) and call
`documentGenerationService` from their resolvers.

## Two modes, one pipeline

Like auth, payments, and AI, rendering runs in two modes chosen by
`DOCUMENTS_MODE` (see `docs/environments-and-secrets.md`):

- `DOCUMENTS_MODE=local` — the sandbox default. `LocalPdfRenderer.ts` drives
  the machine's own Chromium via playwright-core (no service, no token, no
  cost). Set `DOCUMENTS_CHROMIUM_PATH` if Chromium is somewhere unusual.
- `DOCUMENTS_MODE=platform` — deployed environments. The kernel POSTs
  printable HTML to the platform's shared render service using
  `DOCUMENTS_RENDER_URL` + `DOCUMENTS_TOKEN`, both injected at deploy time
  when the deploy manifest declares the `DOCUMENTS` capability.

Everything before the final render — validation, Mustache, the printable
wrapper — is identical in both modes, so a sandbox PDF is a faithful preview
of a deployed one.

## Anatomy of a template

```
firebase/functions/documents/templates/invoice/
    template.html   # Mustache-tagged markup ({{field}}, {{#list}}...{{/list}})
    template.css    # the document's own styles; @page is added by the kernel
    schema.json     # name, description, pageSize (Letter|A4|Letter-landscape|A4-landscape), fields
    sample.json     # sample overrides; must validate against schema.json
```

The directory name is the template key — the API identifier clients POST.
`schema.json` declares a tree of typed fields (`string`, `number`,
`boolean`, `array`, `object`, plus `required` and `format: email|date`);
`validateDocumentOverrides` rejects unknown keys and type mismatches so a
typo fails loudly instead of rendering a blank tag. The kernel's tests load
every template in the repo and check that its `sample.json` passes its own
schema — a broken template fails CI, not a customer's download.

Conventions that keep templates trivial to reason about:

- Money and dates arrive preformatted as strings (`"$1,250.00"`,
  `"2026-07-24"`); templates never compute or localize. The binder owns the
  math (see `web/app/src/View/Invoices/invoiceForm.ts`).
- `pageSize` in `schema.json` is the single source of page geometry: the
  kernel injects the matching `@page` rule and asks the renderer for the same
  size, so the CSS and the PDF can never disagree.
- Optional fields pair with Mustache sections (`{{#notes}}...{{/notes}}`) so
  empty data removes the row instead of leaving a hole.

## The generation flow

One stateless path (`DocumentGenerationService.generateDocument`):

1. Load the template by key (cached from disk).
2. Validate the overrides against `schema.json`.
3. `Mustache.render` the html and css with the overrides.
4. Wrap as a printable document (`buildPrintableHtmlDocument`) — print styles
   injected into `<head>`, fragments wrapped in a minimal sheet.
5. Render to PDF (local Chromium or the platform service).
6. Stream the bytes back with a download file name.

Clients reach it through `documents__request__api`
(`firebase/functions/src/CloudFunctions/Documents.ts`), whose URL every
client derives from the GraphQL URL (`deriveDocumentsEndpoint` in web/core):
`GET /templates` lists the repo's templates (key, name, fields, sample);
`POST /generate` takes `{ templateKey, overrides }` and answers
`application/pdf`.

`GET /templates` is open (static repo metadata). `POST /generate` requires
an authenticated principal (a bearer token in the `Authorization` header) —
rendering is metered compute, so anonymous generation would be a free PDF
service for anyone with the URL. Any session counts, including anonymous
guest sessions: the invoice page signs signed-out visitors in as guests
before generating. Projects using `generateDocumentPdf` therefore also need
the `AUTH` capability declared.

## Adding documents to any template

Any project composed from this kernel can grow the capability; nothing about
it is specific to the invoice pack.

1. Author a template: create `firebase/functions/documents/templates/<key>/`
   with the four files. Start from the invoice template and reshape it.
2. Wire a surface: call `generateDocumentPdf` from `@base/core` with your
   overrides and hand the returned blob to a download link (see
   `web/app/src/View/Invoices/InvoicePage.tsx` — the whole page is a form
   plus one call).
3. Declare the capability: add `"DOCUMENTS"` to `capabilities` in
   `repobot.deploy.json`. In the sandbox rendering already works
   (`DOCUMENTS_MODE=local`); on the next deploy the platform provisions the
   render token and injects `DOCUMENTS_MODE=platform`,
   `DOCUMENTS_RENDER_URL`, and `DOCUMENTS_TOKEN`.

For a worked product example — restyling, adding fields, new document types,
persistence — see `packs/invoice/PACK.md`.

## Testing

`firebase/functions/test/Documents/DocumentsTest.ts` pins the pipeline:
override validation semantics, the printable wrapper, template loading (every
repo template's sample must pass its own schema), the Mustache render, the
HTTP endpoint's contract including error mapping, and
`generateAndFileDocument`'s storage-kernel handoff (a fake writer captures
the request; the default service lands a READY upload in local mode). The
suite runs with a fake renderer — no Chromium needed — so it is fast and
deterministic.

## Reading documents: the intake service

Generation's mirror image lives in
`firebase/functions/src/Services/DocumentIntake/`: the path from an uploaded
PDF to usable data. It has two deliberately separate layers.

**Text extraction is real everywhere.** `extractPdfText(bytes)` parses the
actual PDF (pdfjs) into per-page text; `extractUploadText({ userId,
uploadId })` reads a READY upload through the storage kernel's server-side
`readFileBytes` path first (PRIVATE files stay owner-checked — a service
reading on someone else's behalf authorizes that relationship itself). No
mode split, no credentials: sandbox demos read the actual documents they
bundle.

**Structured extraction needs a model — or a fixture.**
`extractStructured({ text, instructions })` returns parsed JSON in the shape
the caller's instructions describe (validate it with your domain's zod
schema at the call site). With `AI_MODE=openai|gateway` it runs one
strict-JSON model turn over the text. With `AI_MODE=local` it resolves
deterministically from `DocumentIntakeFixtures.ts`: a bundled sample
document carries a `REPOBOT-INTAKE-FIXTURE: <key>` marker line in its
visible text, and the registry returns that key's payload — the same
contract as the AI path, zero credentials, so drag-and-drop demos work
end-to-end in the sandbox. Packs register their sample documents' payloads
next to the kernel's `intake-exemplar` entry.

`firebase/functions/test/DocumentIntake/DocumentIntakeTest.ts` pins the
whole surface with a handcrafted spec-conformant PDF (`TestPdf.ts`) — no
PDF-writing dependency, no Chromium.
