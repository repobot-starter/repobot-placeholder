# Project Brief — Spec

Status: **Phases 1–2 implemented** (the `repobot.brief.json` contract, schema
validation, and the `npm run brief:check` assertion runner with its
`--vocabulary` handshake; exemplar: the shop fixture at
`scripts/brief/fixtures/shop-brief.json`, exercised by `npm run test:brief`).
Phase 3 — the setup flow emitting real briefs, per-promise status UI, and the
corpus replay — is platform-side work. This file is the interface both sides
build against: the setup flow (platform repo) emits the brief; this repo
ships the schema, the reconciliation rules, and the runner.

Scope decisions locked at the outset:

- **The brief is desired state, not a work log.** It records what the user
  asked for and what "done" means — never progress, status, or agent notes.
  Status is _derived_ by running the assertions, exactly as `scaffold:ia`
  derives dashboard stubs from the IA manifest.
- **The existing manifests stay authoritative.** `repobot.deploy.json`,
  `repobot.theme.json`, `repobot.project.json`, and `repobot.emails.json`
  remain the compiled outputs of setup; the brief references them, never
  duplicates them.
- **The coupling surface is strings** (tier names, assertion names, field
  names), governed append-only — the same stability promise the landing and
  IA vocabularies make (`docs/landing-kernel-spec.md` §8,
  `docs/project-ia.md`).

## 1. Why a brief

The setup flow ends with a handoff: a plan the user approved, executed by an
agent in a pod minutes later. Today the plan's intent survives only as prose,
and prose gets re-interpreted — every re-interpretation is a fresh sample
from a distribution, which is how promises made in setup fail to materialize
in the repo.

The fix is the same move this repo makes everywhere else: **determinism at
the edges, freedom in the middle.** The spec (what was promised) and the
acceptance (how "done" is checked) are frozen, structured, and committed;
the agent's path between them stays nondeterministic, inside a
verify-and-retry loop. Concretely, every user-visible promise is one of
three tiers:

| Tier        | Who realizes it                                                                          | What makes it deterministic                      | Honest setup-UI language        |
| ----------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------- |
| `compiled`  | The manifests + their consumers (runtime render, `scaffold:ia`, provisioning) — no agent | The mechanism itself                             | "Done in minutes"               |
| `checkable` | The pod agent                                                                            | A deterministic oracle: its `acceptance` asserts | "The agent is building this"    |
| `judged`    | The pod agent                                                                            | Nothing — only a rubric and taste                | Aspiration, never a deliverable |

Tier classification happens **in the setup flow's compiler**, not the pod:
whether an ask is compilable is a fact about the current manifest vocabulary,
and the setup UI must know the tier anyway to choose honest language.

## 2. The manifest — `repobot.brief.json`

Committed at the repo root by the setup flow (like `repobot.project.json`),
amended — never rewritten — by later sessions. Three parts:

```json
{
    "business": {
        "name": "Ember & Oak",
        "oneLiner": "Hand-poured soy candles from a Portland garage studio.",
        "audience": "Gift shoppers and candle enthusiasts",
        "tone": "Warm, personal, unhurried",
        "locale": "en-US",
        "currency": "usd"
    },
    "content": {
        "products.amber": { "kind": "product", "name": "Amber Noir", "priceMinorUnits": 2400 },
        "products.cedar": { "kind": "product", "name": "Cedar Smoke", "priceMinorUnits": 2400 },
        "faq.shipping": { "kind": "faq", "question": "Do you ship?", "answer": "US only, 3-5 days." }
    },
    "asks": [
        {
            "id": "pricing-page",
            "statement": "A pricing page with your tiers",
            "tier": "compiled",
            "realizedBy": { "manifest": "repobot.project.json", "pointer": "marketing.pages[pricing]" }
        },
        {
            "id": "candle-catalog",
            "statement": "Your candles, purchasable online",
            "tier": "checkable",
            "contentRefs": ["products.amber", "products.cedar"],
            "acceptance": [
                { "assert": "query-returns", "operation": "shopProducts", "expectCount": 2 },
                { "assert": "content-present", "path": "/", "text": "Amber Noir" },
                { "assert": "gate-passes", "gate": "check:all" }
            ]
        },
        {
            "id": "warm-feel",
            "statement": "A warm, handmade feel",
            "tier": "judged",
            "rubric": "Warm palette via repobot.theme.json; no stock-corporate imagery; copy in the stated tone."
        }
    ]
}
```

### `business` — facts everything draws from

Free-text values, structured keys. This section is also **durable context
for every future agent session** (the repo is the distribution mechanism for
intent, not just code): an agent asked to "add a page" a month later should
find what the project _is_ here, not re-derive it from the UI.

### `content` — the seed

A flat map of stable ids to typed entries (`kind` discriminates). This is
what separates "a shop" from "_their_ shop": copy-filling becomes
transcription from seed data rather than invention, which converts
taste-level work into checkable work ("the product the user named appears
at its stated price" has a mechanical oracle). Entry kinds are an
append-only vocabulary that grows with the pack catalog (`product`, `faq`,
`hours`, `link`, `quizQuestion`, ...); unknown kinds are carried, not
rejected — the brief may be written by a newer setup flow than the repo
that receives it.

### `asks` — the promise ledger

One entry per user-visible commitment. Fields:

| Field         | Tiers       | Meaning                                                                                                |
| ------------- | ----------- | ------------------------------------------------------------------------------------------------------ |
| `id`          | all         | Stable kebab-case slug. Survives plan edits and later sessions; amend the entry, never re-mint the id. |
| `statement`   | all         | The promise in (approximately) the user's words — what the setup UI showed.                            |
| `tier`        | all         | `compiled` \| `checkable` \| `judged`.                                                                 |
| `realizedBy`  | `compiled`  | Pointer to the manifest entry that realizes it (`manifest` + `pointer`).                               |
| `contentRefs` | `checkable` | Ids into `content` this ask consumes.                                                                  |
| `acceptance`  | `checkable` | Ordered list of assertions (§3). All must pass for the ask to be satisfied.                            |
| `rubric`      | `judged`    | Grading guidance for a human or model reviewer. Never machine-gates.                                   |

## 3. Assertion vocabulary (v1)

The heart of the contract, governed exactly like landing section names:
**append-only, never renamed, never removed.** The setup flow may only emit
assertions the target base-repo version declares (see §6). Each assertion is
a thin adapter over infrastructure this repo already has — v1 deliberately
contains nothing that needs new machinery:

| Assert                | Arguments                                                   | Oracle (existing mechanism)                                                    |
| --------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `manifest-entry`      | `manifest`, `pointer`                                       | The entry exists in the named manifest (verifies `compiled` asks mechanically) |
| `capability-declared` | `capability`                                                | `repobot.deploy.json` declares it                                              |
| `route-renders`       | `path`, `signedIn?`                                         | The route renders without error (web test harness)                             |
| `content-present`     | `path`, `text`, `signedIn?`                                 | The rendered route contains the text (case-insensitive)                        |
| `query-returns`       | `operation`, `variables?`, `expectCount?`                   | Blackbox GraphQL harness: operation succeeds, optional row-count check         |
| `mutation-roundtrip`  | `operation`, `variables?`                                   | Blackbox GraphQL harness: mutation succeeds and its result re-reads            |
| `gate-passes`         | `gate` (`check:all` \| `test` \| `test:web` \| `check:web`) | The named quality gate exits 0                                                 |
| `screenshot`          | `path`, `signedIn?`                                         | Captures evidence for `judged` review; never pass/fail                         |

Composition rule: every `checkable` ask should end with a `gate-passes`
assertion — feature-level asserts prove the promise, the gate proves the
repo is still healthy around it.

`signedIn: true` runs the browser assertion as the sandbox's local dev user
(the runner drives the login page's "Skip as local dev user" affordance in
an isolated session first), so auth-gated dashboard routes can be rendered
and captured. It needs the sandbox's simulated auth (`AUTH_MODE=local`); on
a builtin-auth stack the assertion reports `blocked`, never a false pass.

## 4. The reconciliation contract (pod agent)

The agent in the pod treats the brief the way `scaffold:ia` treats the IA
manifest — as desired state to converge on, with idempotent steps:

1. **Never realize `compiled` asks by hand.** They belong to the manifests;
   if one is unrealized, the manifest entry is wrong or the
   compiler/scaffolder hasn't run — fix that, don't hand-wire (the existing
   IA invariant, generalized).
2. **Work `checkable` asks until their assertions pass**, drawing copy and
   data from `contentRefs`, composing kernels per the `AGENTS.md`
   invariants. The path is the agent's choice; the oracle is not.
3. **Honor `judged` rubrics best-effort**, capturing `screenshot` evidence
   where asked. Judged asks never block completion.
4. **Amend, don't erase.** If reality must diverge from an ask (infeasible,
   contradictory), the agent updates the ask with a note in the same commit
   as the divergence — the brief stays truthful as a record of intent.
5. **Resume by re-diffing, not replaying.** A run that dies mid-way starts
   over from "which assertions currently fail?", never from a step list.

Status is computed, not stored: `npm run brief:check` evaluates every
assertion and emits a per-ask report the platform can render as per-promise
progress. The agent's self-report is never the source of truth.

## The runner — `npm run brief:check`

`scripts/brief/check.mjs` evaluates the whole ledger and prints a JSON
report on stdout (`{ summary, asks: [{ id, tier, statement, status,
assertions }] }`), with a human summary on stderr. Exit 0 unless a checkable
ask **fails**. Statuses:

- `pass` / `fail` — the assertion's oracle ran and decided.
- `blocked` — the oracle's dependency is unavailable: dev stack down
  (browser asserts), database down (GraphQL asserts), or
  `repobot.deploy.json` absent because the repo has not been composed for a
  project (capability asserts). Blocked is environment state, never a broken
  promise, and never fails the run.
- `judged` — the ask's tier; its `screenshot` assertions capture evidence
  into the uncommitted `brief-report/` directory, and nothing gates.

Flags and environment:

- `--brief <path>` (default: the root `repobot.brief.json`),
  `--base-url <url>` / `BRIEF_BASE_URL` (default: `repobot.sandbox.json`'s
  port), `--report-dir <dir>`, `--vocabulary`.
- `--skip-gates` reports `gate-passes` assertions as blocked instead of
  spawning them — for cheap periodic checks (a pod polling while the setup
  agent works) where running the full quality gate every pass would be
  prohibitive. Any final, authoritative check runs without it.
- Before any page assertion runs, the runner verifies the base URL serves
  **this** app (the `repobot-app` meta marker in `web/app/index.html`) —
  a machine hosting several dev servers must block, not check a stranger.
- `BRIEF_BROWSER_CDP_URL` attaches to an existing Chromium over CDP (in an
  isolated context, never the user's tab) instead of launching one, so a pod
  that already runs a browser for the streamed preview shares it. Without
  it, the runner launches the machine's Chromium — the same discovery (and
  `DOCUMENTS_CHROMIUM_PATH` override) as the documents kernel's local mode.
- GraphQL assertions run through the in-process Apollo server
  (`firebase/functions/scripts/brief-gql.ts`) against the dev database, as
  an authenticated principal with no application user — public and
  gate-level access exactly mirror a real caller's. The harness primes
  `FUNCTIONS_EMULATOR=true` so sandbox `AUTH_MODE=local` /
  `PAYMENTS_MODE=local` pass the kernel's boot guard (those modes are
  otherwise refused outside the emulator/tests).

## 5. What this deliberately is not

- **Not a workflow engine.** No steps, no ordering, no dependencies between
  asks. If two asks conflict, that's a compiler bug in the setup flow.
- **Not a second theme/IA/deploy contract.** The brief points at manifests;
  it never restates them.
- **Not a test suite.** Assertions are product promises, not regression
  coverage; the blackbox tests remain the correctness net underneath.

## 6. Setup-flow integration contract

Mirrors `docs/landing-kernel-spec.md` §8 — the coupling surface is
explicit and tiny:

**The setup flow may depend on:**

- the file name and top-level shape (`business` / `content` / `asks`)
- tier names (`compiled`, `checkable`, `judged`)
- assertion names and their argument names (§3)
- content-entry `kind` names
- ask field names (§2)

**Guarantees:** all of the above are append-only once shipped. New
assertions, kinds, and fields may be added; none are renamed or removed.
The repo declares its supported assertion set (Phase 2: a
`brief-vocabulary` listing the runner ships) so the setup flow can emit
only what the target repo version can check — the same
no-version-coupling mechanism as blueprint names.

**The setup flow must never depend on:** how assertions are executed, which
harness runs them, file layout under `firebase/functions/test/` or the web
test setup — all internal and free to change.

## 7. Rollout plan

**Phase 1 — the contract (this spec).** Done: schema documented, placeholder
`repobot.brief.json` committed, `AGENTS.md` routing row.

**Phase 2 — the runner.** Done: `npm run brief:check` (see "The runner"
above) with the `--vocabulary` declaration; adapters reuse the in-process
GraphQL server, a real Chromium against the dev stack, root manifests, and
the npm quality gates. The shop fixture
(`scripts/brief/fixtures/shop-brief.json`) is the end-to-end exemplar,
exercised by `npm run test:brief` (green on a bare checkout — unavailable
dependencies report blocked; fully passing with the stack up).

**Phase 3 — the loop (platform-side).** The setup flow emits real briefs;
the pod runs reconcile-until-green; the platform renders per-promise status
from the runner's stdout report. Then the statistical layer: a corpus of
real briefs replayed against the current base repo on a schedule, graded to
pass rates per assertion type — the honest measure of which promises the
setup UI is allowed to keep making.

### Resolved decisions

- **Where the status report lands:** runner stdout (JSON), plus the
  uncommitted `brief-report/` directory for screenshot evidence. Status is
  derived, so it never enters git.
- **Amendment protocol:** re-emit or edit the brief whole with stable ask
  ids preserved — same as how the theme file is edited whole.

### Open questions

- **Judged-ask grading.** Rubric + screenshot reviewed by a model grader in
  the corpus replay is the likely shape; per-run grading is out of scope
  until the corpus exists.
