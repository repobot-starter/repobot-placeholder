# Project IA — repobot.project.json

`repobot.project.json` at the repo root is the project's information
architecture: which public marketing pages exist and which signed-in dashboard
destinations exist. It is committed by the setup flow (like
`repobot.theme.json`) and consumed deterministically in three tiers:

| Tier            | Mechanism                                                                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Marketing pages | Rendered **at runtime** from the manifest through the landing kernel (`web/app/src/View/Site/`). No generated files.               |
| Auth gate       | Any dashboard destination implies the AUTH capability; destinations mount under `ProtectedRoutes`. Never a judgment call.          |
| Dashboard       | Scaffolded by `npm run scaffold:ia` — an idempotent script that generates stub pages and wires routes + nav inside managed blocks. |

The invariant: **IA comes from `repobot.project.json` — extend it, don't
bypass it.** Adding a marketing page or dashboard destination means adding a
manifest entry (then re-running the scaffolder for dashboard entries), not
hand-inserting routes.

## The manifest

```json
{
    "marketing": {
        "preset": "soft-saas",
        "siteName": "Fieldbook",
        "shell": { "navVariant": "inline", "footerVariant": "simple" },
        "pages": [
            {
                "id": "home",
                "path": "/",
                "title": "Home",
                "blueprint": "landing",
                "description": "Job tracking for small field crews."
            },
            { "id": "pricing", "path": "/pricing", "title": "Pricing", "blueprint": "pricing" },
            { "id": "contact", "path": "/contact", "title": "Contact", "blueprint": "contact" }
        ]
    },
    "dashboard": {
        "shell": { "variant": "sidebar" },
        "destinations": [
            { "id": "overview", "path": "/overview", "label": "Overview", "blueprint": "overview" },
            {
                "id": "work-orders",
                "path": "/work-orders",
                "label": "Work orders",
                "blueprint": "table",
                "description": "Every job, its crew, and its status."
            }
        ]
    }
}
```

Typed access is `web/app/src/Config/projectManifest.ts` (same pattern as
`activePack.ts`). Ids are lowercase kebab-case; paths are absolute. Blueprint
names are **append-only public vocabulary** shared with the setup flow — the
same governance as landing section/preset names
(`docs/landing-kernel-spec.md` §8).

A destination may also carry an optional `icon` — a feather-style 24×24 SVG
stroke path (path data only) the scaffolder writes into the shell nav in
place of the blueprint's generic glyph. Without it, blueprints share their
default icons, so any product with two `custom` destinations wants its own
paths (the saas pack pins repeat/pie/credit-card glyphs for its ledger,
budgets, and cards).

The manifest is also the SEO surface (`docs/seo.md`): each marketing page's
`title` and `description` become its document title, meta description, and
Open Graph tags (rendered automatically by `SitePage`), the page list feeds
the generated `sitemap.xml`, and `dashboard.destinations` paths land in
`robots.txt`'s disallow list. `marketing.brand` may carry a `social` entry —
the committed share card (`/brand/social.png`, ideally 1200×630) used as
every page's default `og:image`, falling back to `logo`.

## Marketing pages (no codegen)

Every `marketing.pages` entry becomes a public route automatically:
`App.tsx` maps the manifest to `<Route>`s, and a page with `path: "/"`
takes precedence over the active pack's home. Each page renders
`LandingRenderer` with a config resolved by `web/app/src/View/Site/blueprints.ts`:

| Blueprint | Default composition                                                                                                                                            |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `landing` | hero, feature-grid, steps, lead-form — hero variant, backdrop art, and section variants follow the site's style preset (`LANDING_DIRECTIONS` in blueprints.ts) |
| `pricing` | statement hero, pricing tiers, billing FAQ, CTA                                                                                                                |
| `about`   | statement hero, values steps, CTA                                                                                                                              |
| `contact` | statement hero, lead-form                                                                                                                                      |
| `faq`     | statement hero, FAQ accordion, CTA                                                                                                                             |
| `custom`  | statement hero from title/description, CTA                                                                                                                     |

Chrome is not in the stacks: every non-inline page gets the shared shell —
sticky nav + footer built from the page list (`MarketingShell`,
`docs/landing.md` "Page chrome") — so adding a page rewires every nav.
`marketing.shell` carries the setup-chosen chrome variants (`navVariant`:
inline | centered | burger-overlay | full-width | split | pill-links |
logo-only; `footerVariant`: simple | multi-column | newsletter); an absent
or unknown `navVariant` falls back to the theme contract's
`navigation.variant` (`repobot.theme.json`), then full-width; footers fall back
to simple. Note `logo-only` renders no links at all — only pick it for
single-page sites or blogs. Variants only — the shell's links, logo, and
CTA always derive from `siteName` and the page list.

Blueprint output is placeholder copy — presentable, but meant to be
replaced. Config resolution precedence, highest first:

1. An inline `landing: LandingConfig` on the entry (the full landing
   vocabulary, `docs/landing.md`) wins outright — the editing surface for
   fully custom pages.
2. A `sections[]` scaffold (below) replaces the blueprint's stack.
3. The blueprint default.

### Page section scaffolds

A page entry may carry `sections[]` — the composition the user chose during
setup. Each entry names a landing kernel section `type` (and optional
`variant`; heroes may also pin an `accent` grammar — `last-word`,
`first-word`, or `none` — otherwise the preset's own lean applies), the
user's verbatim copy (`headline`, `body`, `ctaLabel`), a `description` of
what the section must cover, and for image-bearing types a servable `image`
path. Heroes may additionally carry a `badge` (the pill above the headline)
and a `secondaryCtaLabel` (a quieter second button, anchored to the page's
story section) — both are setup-chosen design decisions: absent means the
hero renders bare on purpose, never "fall back to the stock flourishes".

```json
{
    "id": "home",
    "path": "/",
    "title": "Home",
    "blueprint": "landing",
    "sections": [
        {
            "id": "hero",
            "type": "hero",
            "variant": "split-media",
            "headline": "Job tracking for small field crews",
            "image": "/brand/home-hero.png"
        },
        { "id": "how", "type": "steps", "description": "Assign, track, invoice — the three-step story." },
        { "id": "cta", "type": "cta-banner", "ctaLabel": "Start free" }
    ]
}
```

`web/app/src/View/Site/sectionsFromManifest.ts` maps the scaffold to kernel
sections at runtime: verbatim copy and artwork land where each type expects
them; whatever else a type needs renders as instructive placeholder copy
folding in the `description`. The content pass refines copy **inside** this
scaffold and never reorders or drops the user's sections. Unknown types are
skipped; unknown variants fall back to the type's default.

A page entry may also carry a `seed` — the copy the user wrote during
project setup (`headline`, `subheadline`, `bullets`, `ctaLabel`,
`heroImage`). Blueprints render every present seed field **verbatim** over
their placeholders: the headline and subheadline replace the hero copy,
`ctaLabel` relabels the primary CTA, `bullets` render as an icon-list
section of the user's key points, and `heroImage` (a servable path; setup
commits the file under `web/app/public/brand/`) fills the hero's media
slot. This is the user's voice, not a suggestion — the content pass builds
around seeded copy instead of replacing it. Like blueprint names, seed
fields are append-only vocabulary.

## Dashboard destinations (scaffolded)

Dashboard pages are real React code, so they are provisioned by a script
instead of rendered from data:

```
npm run scaffold:ia
```

For each `dashboard.destinations` entry the scaffolder, idempotently:

- generates a stub page (`web/app/src/View/<Pascal>/<Pascal>Page.tsx` +
  styles) per blueprint — `overview` (`StatCardRow` + `ActivityFeed`),
  `table` (`DataTable`), `settings` (`SettingsGroups`), `custom` (empty
  state) — only when the file doesn't already exist; **your edits are never
  overwritten**;
- a destination with a `sections[]` scaffold (widget types: `stat-cards`,
  `chart`, `data-table`, `activity-feed`, `detail-form`, `settings-groups`,
  `filters-toolbar`, `list-detail`, each with optional `title` and
  `description`) gets a page composed of one widget function per section,
  each a working placeholder on the kernel component that type maps to
  (`stat-cards` → `StatCardRow`, `chart` → `ChartCard`, `data-table` →
  `DataTable`, `activity-feed` → `ActivityFeed`, `detail-form` → form
  primitives, `settings-groups` → `SettingsGroups`, `filters-toolbar` →
  `FiltersToolbar`, `list-detail` → `ListDetailLayout`) — the setup-chosen
  composition renders before any agent runs, the rubric comment at the top
  of the file carries the verbatim ask, and the content pass swaps
  placeholder data for real queries while keeping the components;
- **content-bearing sections**: the four data widgets accept real demo
  values, so a scaffolded page can arrive finished instead of placeholder.
  `stat-cards` takes `cards[]` (`label`, `value`, `hint?`, `delta?`
  `{ value, direction: up|down|flat, upIsPositive? }`, `tone?`, `trend?`
  — an array of numbers rendered as the card's sparkline); `chart` takes
  `chart` (`kind: line|area|bar|donut`, `series[]` of
  `{ label, points: [{ x, y }] }`, `unit?` — `"$"` prefixes, anything else
  suffixes, `stacked?`, `legendValues?`, `height?`); `data-table` takes
  `table` (`columns[]` of `{ id, header }` with camelCase ids, `rows[]` of
  `{ <columnId>: value }`); `activity-feed` takes `items[]`
  (`title`, `meta?`, `timestamp?`, `badge?: { label, tone? }`). Content is
  validated loudly at scaffold time (bad tone/kind/span names fail the run
  with the exact field). A section may also carry `span: "half"` —
  consecutive halves share a responsive two-column row; everything else is
  full-width. The single source of truth for this vocabulary is
  `DASHBOARD_SECTION_TYPES` in `scripts/scaffold-ia.mjs`, which also feeds
  the pack map's "Building an app" table (`scripts/generate-agent-map.mjs`);
- regenerates the `<ia:*>` managed blocks: route keys in
  `web/app/src/Config/Router.ts`, lazy imports and `<Route>` entries under
  `ProtectedRoutes` in `App.tsx`, and a `product` nav section in
  `shellNavSections.tsx`. Never edit inside the markers — the next run
  replaces the block wholesale; everything outside them is yours;
- strips the kernel's Projects/Users exemplar (the `<ia:exemplar-*>` blocks
  in `App.tsx` and `shellNavSections.tsx`) whenever the manifest declares
  destinations of its own — a composed product's sidebar shows its product
  IA, not the kernel demo. The raw kernel (no destinations) keeps the
  exemplar wired as reference. The strip is one-way by design; dev-pack
  switches snapshot the pristine files and restore them
  (`scripts/lib/pack-switch.mjs`).

Re-running converges (`npm run test:scaffold` is the contract, and the suite
is state-aware: the exemplar-presupposing tests skip cleanly in a checkout
where the strip already ran, so a pre-commit test pass on a scaffolded
project is honestly green). Collisions with hand-written routes fail the run
loudly. Verification after a scaffold run is `npm run typecheck` — the
generated pages are covered by the kernel's contract tests; full test suites
only pay for themselves when shared kernel code changed. When the repo ships
iOS/Android, mirror new destinations in the native `ShellNavModels` binders
per `docs/shell.md` — the script prints a reminder.

`dashboard.shell` carries the setup-chosen dashboard chrome, mirroring
`marketing.shell`: `variant` picks the `AppShell` layout (sidebar |
top-nav | minimal | sidebar-inset | sidebar-topbar | sidebar-only |
logo-rail — see `docs/shell.md` "Shell variants" for when to pick which);
an absent or unknown value falls back to the theme contract's
`shell.variant` (`repobot.theme.json`), then sidebar. Variants only — the
shell's nav always derives from the destinations.

The **first** destination is also the post-auth landing: signed-in users are
sent to it after login (`postAuthRoutePath` in `web/app/src/Config/Router.ts`
reads the manifest and falls back to the kernel exemplar's `/projects`).
Order the destinations with the signed-in home first.

The first destination is also the marketing site's app entry: the derived
marketing shell (`shellForContext` in `web/app/src/View/Site/blueprints.ts`)
points its nav CTA at it (and adds it to the simple footer), so the app is
one click from the site home — visitors never have to know a route. Packs
with hand-authored shells (inline `shell` blocks, `packShell` chrome) keep
their own affordance; the saas pack's "Sign in" CTA is the precedent.

A pack may ship its own manifest (`packs/<key>/repobot.project.json` in the
kernel repo): `compose-pack.sh` stamps it to the root of the composed
template and runs the scaffolder, so published templates arrive with their
IA already wired. The saas pack is the exemplar.

## Order of operations (setup and after)

1. `repobot.project.json` is committed (setup flow, or you edit it).
2. `npm run scaffold:ia` provisions dashboard routes, gate, and nav.
3. Content pass: replace placeholder copy with the real product — inside
   any `sections[]` scaffold (refine, never reorder or drop), via inline
   `landing` configs for fully custom pages, and in the dashboard stubs.

Marketing-only changes (adding a page, changing the preset) need no
scaffolder run — the manifest is live at build time.
