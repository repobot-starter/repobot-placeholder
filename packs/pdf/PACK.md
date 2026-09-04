# Pack: pdf

Feature pack (one-page app): a PDF workbench. The page lists every template
the repo ships (GET /templates) behind a document-type picker, opens the
selected one as three live-editable panes — the JSON data (seeded from the
template's sample), the CSS, and the HTML — and renders them onto a paper
preview as you type. Generate posts the JSON to the documents kernel and
stages the real PDF's download in a modal. Adding a document type to the
product is adding a template directory; the page picks it up with zero code
changes.

Documents is a kernel capability, not pack-private code — the full layer map
and reuse recipes live in `docs/documents.md`.

## What ships

- The workbench surface at `/`:
  `web/app/src/View/PdfGenerator/PdfGeneratorPage.tsx` — a document-type
  picker over `fetchDocumentTemplates`, a tabbed code editor (data.json /
  styles.css / template.html), a live paper preview (a dependency-free
  Mustache subset in `preview.ts` renders the panes into a sandboxed
  iframe), and a staged generate-and-download modal. The HTML/CSS panes
  start as faithful copies of the server templates (`starters.ts`) and
  drive the preview; the generated PDF binds the edited JSON to the repo's
  template files server-side
- The transport: `web/core/src/Documents/DocumentsApi.ts`
  (`fetchDocumentTemplates`, `generateDocumentPdf`) — the endpoint URL is
  derived from the GraphQL URL, no extra config
- The templates: every directory under
  `firebase/functions/documents/templates/` (the kernel ships `invoice` and
  `pitch-deck`); each is template.html + template.css + schema.json +
  sample.json
- Two modes, mirroring auth, payments, and ai: in the workspace
  `DOCUMENTS_MODE=local` renders with the machine's own Chromium (no
  service, no token); on deploy `DOCUMENTS_MODE=platform` calls the
  platform's render service
- Stateless by design: nothing is stored server-side; POST /generate signs
  the visitor in as an anonymous guest when no session exists

Set [`../active.json`](../active.json) to `{ "key": "pdf" }` to make this
pack the home surface.

## Agent recipe: build on the generator

1. Add a document type (quote, receipt, certificate, report): create
   `firebase/functions/documents/templates/<key>/` with the four files —
   the page lists and renders it automatically. `sample.json` must validate
   against `schema.json`; the kernel's tests enforce this for every
   template in the repo.
2. Restyle a document: edit its `template.html`/`template.css`. Mustache
   tags (`{{field}}`, `{{#list}}...{{/list}}`) bind the schema's fields.
   Mirror the change in the pack's starter copies
   (`web/app/src/View/PdfGenerator/starters.ts`) so the live preview keeps
   matching the PDF; templates without a starter get a generic key/value
   sheet automatically.
3. Specialize the surface for one template (custom layout, computed
   fields): follow the invoice pack — a hand-built binder over the same
   `generateDocumentPdf` call beats a generic editor when the document has
   domain math.
4. To persist generated documents (history, sharing), add the `STORAGE`
   capability and file the blob through the storage kernel
   (`docs/storage.md`), or add a domain (`docs/adding-a-domain.md`).

## Non-goals for this pack

- Server-side rendering of the edited HTML/CSS (POST /generate accepts
  data overrides only; the panes restyle the live preview, and template
  files stay the repo's source of truth by design)
- Saved documents and history (stateless v1)
- A full code editor (the panes are plain textareas dressed as a code
  surface — no editor dependency)
