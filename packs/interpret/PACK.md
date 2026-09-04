# Pack: interpret

Feature pack (one-page app): drop a PDF, get an interpretation — document
type, a plain-language summary, key points, and the notable fields. Rides
the document-intake kernel (`docs/documents.md` covers the read side): text
extraction is real pdfjs parsing in every mode, and the interpretation layer
is the model on AI deploys or a deterministic heuristic reading in the
workspace — so the demo works on any PDF with zero credentials.

The credit pack is the deep exemplar of the same machinery (typed domain
extraction with a discrepancy engine); this pack is the general-purpose
front door.

## What ships

- The interpreter surface at `/`:
  `web/app/src/View/Interpreter/InterpreterPage.tsx` — a two-pane reading
  room: the left pane is a PDF drop zone over the storage kernel
  (`createUpload` → `putUploadBytes` → `finalizeUpload`) that becomes the
  document preview, the right pane stages the AI's reading (analyzing scan,
  then type badge, verdict, summary, key points, extracted fields);
  visitors without a session are signed in as anonymous guests first
- The domain: `interpretDocument` (one stateless mutation,
  `Graphql/Core/Interpret/Interpret.gql`) →
  `firebase/functions/src/Services/Interpret/InterpretService.ts`
- The intake layers it composes
  (`firebase/functions/src/Services/DocumentIntake/DocumentIntakeService.ts`):
  `extractUploadText` (real pdfjs text, every mode) and `extractStructured`
  (one strict-JSON model turn when `AI_MODE=openai|gateway`)
- The workspace path: with `AI_MODE=local` the service produces a
  deterministic heuristic interpretation from the extracted text itself —
  any PDF works, nothing needs a fixture marker

Set [`../active.json`](../active.json) to `{ "key": "interpret" }` to make
this pack the home surface.

## Agent recipe: build on the interpreter

1. Change what gets extracted: edit the instructions and the zod schema in
   `InterpretService.ts` — the shape the model returns is the shape the
   service validates, so evolve them together (and mirror the heuristic
   fallback so the workspace stays honest).
2. Specialize for a document family (contracts, resumes, receipts): replace
   the generic instructions with field-level ones and render a typed card —
   the credit pack shows the full typed-domain version, including persisted
   rows and a findings engine.
3. Persist interpretations (history, search): add a domain via
   `docs/adding-a-domain.md` and store the result next to the uploadId.
4. Interpret more formats: `extractPdfText` is PDF-only; plain text can go
   straight to `extractStructured`. New binary formats need their own
   extraction step first.

## Non-goals for this pack

- Saved interpretations and history (stateless v1; add a domain to keep
  them)
- Multi-document comparison (one document in, one reading out)
- OCR of scanned/image-only PDFs (pdfjs extracts embedded text; image-only
  documents come back empty)
