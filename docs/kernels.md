# Kernels, chassis, utils, packs

Everything shared in this repo belongs to one of four tiers. The tiers answer
a recurring architecture question — "should X become a kernel?" — and tell an
agent how to adopt each kind of shared thing. When you're about to build
something that feels reusable, find its tier first.

## The four tiers

| Tier        | Contract                                                       | Examples                                                                        | Adopted by                            |
| ----------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------- |
| **Kernel**  | Config in, surface out; invariant in `AGENTS.md`; sandbox mode | auth, AI chat + voice, shell, landing, documents, payments, mail                | Composing (write config/content)      |
| **Chassis** | Convention + exemplar; no invariant, just "follow the shape"   | data layer, GraphQL server, env manifest, idempotency, test harness, migrations | Imitating (`docs/adding-a-domain.md`) |
| **Util**    | Plain functions, behavior-identical across platform mirrors    | `DeviceStorage`, `formatMinorUnits`, `GameAudio`, `useAnimationFrameGame`       | Calling                               |
| **Pack**    | One typed content file; owns only its vertical                 | shop catalog, menu content, quiz questions                                      | Editing content                       |

## What makes something a kernel

The existing kernels (auth, AI, shell, landing, documents, payments, mail) all
share a shape, and a candidate needs all of it:

- **Composition is config-shaped.** You adopt the kernel by writing content or
  configuration — a `LandingConfig`, `shellNavSections`, a product catalog, a
  system prompt plus tools, a mail template. You never re-implement machinery.
- **There is one right way, so hand-building is a bug.** That is what the
  `AGENTS.md` invariants encode ("checkout flows are never hand-built").
  Divergence is a defect a review can flag.
- **It has a sandbox/deployed mode split** (`AUTH_MODE`, `AI_MODE`,
  `PAYMENTS_MODE`, `DOCUMENTS_MODE`, SMTP configured-or-degraded) — usually
  because the kernel wraps an external boundary: Stripe, OpenAI, SMTP, the
  render service.
- **It has real consumers.** A kernel is extracted from a working exemplar
  when a second consumer forces it, not built speculatively.

## Why data and GraphQL are not kernels

The chassis fails every kernel test, on purpose. You don't _compose_ the data
layer — every domain writes its own tables, services, and resolvers. The value
is not a reusable artifact; it's the convention plus the exemplar
(`BaseTable`, `ListRows`, the two-layer authorization model, Identity and
Project as worked examples, `docs/adding-a-domain.md` as the recipe). There is
nothing to configure, only a pattern to instantiate — so "kernel" is the wrong
contract, and extraction would add indirection without removing any work.

## The repo is the distribution mechanism

Kernels here are directories with invariants, not packages. For agent-operated
repos, legibility beats DRY: an agent adding a domain learns by reading
`Data/Project/` and copying its shape. Hiding the chassis behind a package API
makes that harder while creating a version-sync problem across every customer
repo. Where in-tree code genuinely must not drift, the answer is an integrity
check (the design system's pristine manifest, `scripts/verify-ds-pristine.mjs`),
not extraction into a dependency.

## Applying the rubric to future candidates

- **Subscriptions** — grows inside the payments kernel when a membership
  vertical needs it; recurring billing has one right way.
- **Media/uploads** — kernel-shaped (external storage boundary, one right
  way to sign and serve) once a gallery-style vertical forces it.
- **Client sync/offline state** — "state that survives a phone upgrade" has
  one-right-way character; a tracker vertical would force it.
- **Markdown rendering, hours/schedule engines** — utils, permanently: plain
  functions with no mode split and no surface.
- **Data, GraphQL, testing, env plumbing** — chassis, permanently.
