# Web project setup playbook

The ordered playbook a setup agent follows after the deterministic phase has
committed the project's contracts: the promise ledger (`repobot.brief.json`,
see `docs/brief-spec.md`), the narrative brief (`docs/setup-brief.md` (new),
committed per-project by the setup flow), theme (`repobot.theme.json`),
capabilities (`repobot.deploy.json`), and IA
(`repobot.project.json`). Work top to bottom; each step builds on the one
before it, and the contracts — not the brief's prose — are the source of
truth when they disagree.

## 1. Read the ledger, the brief, and the contracts

`repobot.brief.json` is the promise ledger: every ask in it is a commitment
the owner saw during setup, and `npm run brief:check` — not your own
judgment — decides whether it is kept (`docs/brief-spec.md` §4). The
narrative brief (`docs/setup-brief.md` (new)) carries the same intent as
prose plus the execution plan. Cross-check both against the committed
contracts
before writing code: the theme file for branding, the deploy manifest for
capabilities (AUTH, DATABASE, ...), and `repobot.project.json` for the
marketing pages and dashboard destinations.

Ledger rules (brief-spec §4): never realize `compiled` asks by hand — they
belong to the manifests; work `checkable` asks until their assertions pass;
honor `judged` rubrics best-effort. If reality must diverge from an ask,
amend the ask in the same commit — never delete it or re-mint its id.

Read only the docs your project's capabilities need: the deploy manifest
(`repobot.deploy.json`) lists what this project actually uses. A content-only
site needs the landing, IA, and design docs — not auth, payments, AI, or
documents. Kernel modules for capabilities the manifest doesn't list ship
dormant in every tree: they are config-gated and harmless. Leave them
exactly as they are — deleting or rewiring them breaks codegen and burns the
run on rework.

For marketing work, `docs/landing-content.md` is the complete, generated
landing vocabulary — every section type's content interface, the shell
contract, presets, tokens, and eject rules. Trust it: never open
`web/design-system/` sources or audit the test suite to re-verify what it
states. The same scoping applies to platforms: when the deploy manifest
lists only WEB, never open, build, or "check" `ios/` or `android/` — that
work has zero value for the project and burns the run.

Auth account emails (verification, magic link, reset) ship working defaults
and are out of setup's scope: never spend the run styling
`repobot.emails.json` or email templates unless the ledger carries an
explicit ask for them.

## 2. Provision the IA (before any custom code)

If `repobot.project.json` declares pages or destinations
(`docs/project-ia.md`):

1. Run `npm run scaffold:ia`. This generates a stub page per dashboard
   destination and wires routes, the auth gate, and shell nav inside the
   `<ia:*>` managed blocks — deterministically, so never do this wiring by
   hand.
2. Verify: `npm --workspace web/app run lint && npm --workspace web/app run build`.
3. Marketing pages need no scaffolding — they already render from the
   manifest through the landing kernel (`web/app/src/View/Site/`).

## 3. Content pass

Replace placeholders with the product the brief describes, drawing names,
copy, and data from the ledger's `business` and `content` sections (seed
data is transcribed, never reinvented):

- **Marketing pages**: blueprint defaults are placeholder copy. Give each
  page an inline `landing: LandingConfig` in `repobot.project.json` composed
  from the landing vocabulary — real headlines, features, pricing, FAQ
  answers. `docs/landing-content.md` carries every section's content
  interface; `docs/landing.md` explains the composition patterns. Never
  hand-build marketing sections except when matching a design-target
  screenshot: then follow `docs/landing.md` (Matching an uploaded
  screenshot) — recreate the layout; never paste the full-page comp in as
  hero/media.
- **Dashboard stubs**: fill each generated page with real data and views per
  `docs/web-app.md` (ViewModel + GraphQL patterns). The stubs are yours;
  re-running the scaffolder never overwrites them.

Complete pages in order, one at a time: the owner watches the build page by
page, and the platform's periodic checks reveal each finished page to them
as it starts passing. Finish the landing page first — it sets the design
language — then the remaining marketing pages, then the auth surface, then
each dashboard destination. Finish each page completely before starting the
next; never leave every page half-done at once.

Verification stays batched: do not run screenshots or checks per page.
Write the pages to completion in the order above, then compare against the
design targets in at most two fix rounds across the whole site. Each extra
check iteration replays your entire context — batched verification is the
single biggest cost saving available to you. The platform pre-rendered and
committed every section's artwork under `web/app/public/brand/` (the
manifest references each file by exact name) — that is what you put on
the page. Design comps under `assets/brand/` are specs to match, not
images to embed. Only generate a new image when the brief points at a
section with no committed file.

## 4. Domain and data (only when the brief asks for it)

Content-only projects — no capabilities in the deploy manifest, no dashboard
destinations — skip this step entirely; their product is the pages and copy
from step 3.

Otherwise: model the product's data per `docs/data-layer.md` and
`docs/graphql.md`; gate anything signed-in behind `ProtectedRoutes` and the
auth kernel (`docs/auth.md`). Compose capabilities from their kernels — AI
(`docs/ai.md`), payments (`docs/payments.md`), documents
(`docs/documents.md`) — never bespoke plumbing (AGENTS.md invariants).

## 5. Reconcile cheaply, gate once

Verification is a loop, but the loop must be the cheap one. The full gated
check rebuilds the monorepo and costs minutes per pass; running it as a
fix-discovery tool is the single biggest source of slow, expensive runs.

1. Iterate with `npm run brief:check -- --skip-gates` (JSON report on
   stdout; human summary on stderr). This runs every manifest, page, and
   content assertion — the real work list — without the expensive gates.
   With the dev stack up, page assertions run against the same app the
   preview shows; set `BRIEF_BROWSER_CDP_URL` when the pod already runs a
   Chromium for the streamed preview so the runner attaches to it instead
   of launching a second one.
2. For each **failing** assertion, fix the repo — never the assertion.
   A failing `compiled` ask means a manifest entry is wrong or a scaffolder
   didn't run; fix that, don't hand-wire.
3. `blocked` assertions are environment state (dev stack or database down,
   repo not composed) — start the dependency and re-run; never treat
   blocked as done. Gate asks report blocked under `--skip-gates`; that is
   expected, not a failure.
4. When no checkable ask fails, run the ledger's repo-health gate directly,
   once (`npm run check:web` for content-only trees, `npm run check:all`
   otherwise — the `repo-healthy` ask names which). If it fails, fix the
   specific failure and re-run just that gate — not the whole brief check.
5. Finish with one full `npm run brief:check` (gates on) as the evidence
   pass. The runner caches passing gate results keyed by the workspace's
   content hash, so the platform's post-run verification reuses your gate
   run instead of paying the whole gate again (~1.5 min per run) — but only
   if the tree hasn't changed, so don't edit files after the evidence pass.
   One cheap loop, one gate cycle, one evidence pass — the platform re-runs
   the full check after you report and grants a single reconcile pass, so
   handing it a green tree beats discovering failures through repeated full
   checks.

When the deploy manifest includes IOS/ANDROID, mirror new navigation in the
native `ShellNavModels` binders (`docs/shell.md`) and run those platform
checks too. Report the final `brief:check` JSON with the run outcome —
per-promise status the owner sees comes from that report, never from a
self-assessment.
