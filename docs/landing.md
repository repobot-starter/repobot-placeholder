# Landing pages

The landing page — hero, features, pricing, FAQ, lead capture — is a modular
kernel component with the same layered shape as auth (`docs/auth.md`) and the
shell (`docs/shell.md`): a presentational section library plus config, no
backend. A whole page is **one declarative config**; building a landing page
means writing content and picking names, not laying out sections by hand.
Never hand-build a hero, pricing table, or waitlist form — compose them.

The full generated vocabulary — every section type's content interface,
variants, presets, tokens — lives in `docs/landing-content.md`. Trust it
instead of reading `web/design-system/src/marketing/` sources.

| Layer    | Where                                          | What it owns                                                                                                                                             |
| -------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Surface  | `web/design-system/src/marketing/`             | The sections (`MarketingHero`, `MarketingPricing`, ...), the `MarketingShell` chrome, and style presets. Purely presentational; content injected.        |
| Config   | `LandingConfig` (`@ui`)                        | The page's content: shell chrome content + an ordered list of `{ id, type, variant, content }` sections.                                                 |
| Document | `repobot.landing.json` (repo root)             | The active page's layout skeleton: style preset, chrome variants, section order and variants — a data contract, like `repobot.theme.json`.               |
| Binder   | `web/app/src/View/Landing/LandingRenderer.tsx` | Maps config to shell + sections; owns lead-capture delivery (managed forms) and the preset scope. `landingDocument.ts` beside it merges the document in. |

Two exemplars show the range from the same components:

- `/landing` — an editorial studio page (`web/app/src/View/Landing/landing.ts`,
  preset `editorial`, statement hero, icon-list features, filterable showcase,
  contact form).
- `/launch` — the launch pack's SaaS page (`web/app/src/View/Launch/LaunchPage.tsx`,
  preset `dark-dev`, form-first hero, pricing, FAQ). Copy stays in its
  `content.ts`; the config maps it.

This component is web-only: landing pages are web surfaces. (The launch
pack's native views predate the kernel and remain hand-built.)

## The page is a config

```ts
import type { LandingConfig } from "@ui"

export const landing: LandingConfig = {
    style: { preset: "dark-dev" },
    shell: {
        nav: { variant: "full-width", content: { logo: { name: "Acme" } /* links, cta, announcement */ } },
        footer: { variant: "simple", content: { blurb: "Acme" /* links | columns, note, newsletter */ } },
    },
    sections: [
        {
            type: "hero",
            variant: "centered-stack",
            content: { headline: "Ship the thing, finally." /* ... */ },
        },
        // ...
    ],
}
```

Render it with `<LandingRenderer config={landing} />`. Section `type` names
double as anchor ids, so a nav link `{ label: "Pricing", anchor: "pricing" }`
scrolls to the pricing section with zero wiring.

### The layout document (`repobot.landing.json`)

The skeleton half of the config — style preset, shell chrome variants,
section order and variants — lives in the root **`repobot.landing.json`**
contract, the landing sibling of `repobot.theme.json`: a data file the
platform's showroom (and any hand edit) can rewrite to re-arrange the page
with no agent involvement. It is Vite-imported, so edits hot-reload. Content
payloads stay in code; the document binds to them by section id:

```json
{
    "style": { "preset": "editorial" },
    "shell": { "nav": { "variant": "full-width" }, "footer": { "variant": "simple" } },
    "sections": [
        { "id": "hero", "type": "hero", "variant": "statement" },
        { "id": "faq", "type": "faq", "variant": "accordion" }
    ]
}
```

A section's `id` in the code config defaults to its `type` (unambiguous
while each type appears once; give explicit ids to duplicate-type
sections). The document's `type` is descriptive — the registered section's
type and content always win.

A section entry may also carry **`order`** — per-list item permutations
(the platform editor's drag-an-item gesture), e.g.
`{ "id": "nav", "type": "nav", "order": { "links": [0, 2, 1, 3] } }`:
render the code config's `links` items in that index order. Content never
moves out of code; the document only stores the shuffle. Design-system
marketing components stamp each mapped list item
(`data-rb-item-list` / `data-rb-item-index`, see
`marketingItemStamp.ts`) so the editor can resolve a pointer to "item N of
section S's links".

A section entry may also carry **`text`** — per-field copy overrides (the
platform editor's click-to-edit gesture), e.g.
`{ "id": "hero", "type": "hero", "text": { "headline": "Ship faster" } }`.
Keys are dotted paths into the section's content (`"headline"`,
`"cta.label"`, `"features.2.title"` — array indices are CODE indices,
applied before `order` so an edit stays on its item across a reorder);
values are the replacement strings. Only an existing string is ever
replaced — a path that doesn't resolve to a string is ignored with a
warning, so an override can't invent structure. Components stamp each
directly editable element (`data-rb-text-field`, plus
`data-rb-text-list`/`data-rb-text-index` for item fields, see
`marketingTextStamp`).

**Which page reads it:** the document describes the **active** pack's
landing surface, the same "active" semantics as everything else
(`packs/active.json`). When a pack with a landing surface (e.g. `launch`)
is active, its page reads the document and the kernel's `/landing`
exemplar keeps its code config; under every other pack, `/landing` is the
documented surface. `scripts/compose-pack.sh` stamps a pack's skeleton
(the catalog's partial `landing` object, same pattern as the
`catalog.theme` overlay) into the document at compose time; packs without
a landing surface leave the kernel default in place.

**Other pages** read the document through its top-level **`pages`** map:
`pages["<pageId>"].sections` is that page's whole skeleton (order, variants,
adds, deletes — unlike the root merge, unclaimed code sections do NOT ride
along), applied via `useSitePageConfig(pageId, config)`. Manifest marketing
pages get this automatically; a pack-authored page opts in by calling
`useSitePageConfig` itself and declaring its route in the document's
top-level **`routes`** map (`{ "/work": "work" }` — path → page id), which
the platform's structural editor reads to know the page is editable. Seed
both in the catalog's `landing` overlay (the photography pack is the
exemplar) and pin fidelity in a test: the seeded skeleton must reproduce
the code config exactly. Two compositions sharing one path (e.g. `?album=`
detail views) must not both bind: pass an empty page id for the variant
composition and keep its section ids disjoint from the indexed page's.

**Merge semantics** (`web/app/src/View/Landing/landingDocument.ts`) mirror
the theme resolver — a hand-edited or platform-written document can never
crash the page:

- Unknown/invalid preset, chrome variants, or section variants fall back
  to the code config's values (with a console warning).
- A document section with no registered content is skipped.
- Content registered in code but absent from the document renders after
  the documented sections, in code order — layout edits never silently
  lose content.
- Chrome variants apply only when the code config defines that chrome
  (its content lives in code); duplicate document references to one
  section are dropped; a missing/invalid `sections` array leaves the code
  order untouched.
- Item `order` degrades gracefully against content drift: stale, repeated
  or out-of-range positions are dropped, and items the permutation doesn't
  mention render after the ordered ones in code order — a stale shuffle can
  misplace a new item at the end, never lose it.
- `text` overrides degrade the same way: an override whose path no longer
  resolves to a string (the item was removed, the field renamed) is
  skipped with a warning and the code copy renders.

Agents changing the LAYOUT of the active landing page edit
`repobot.landing.json`; content edits (copy, media, CTAs) stay in the
config file. Never inline the skeleton back into TS.

Document meta (title, description, OG/Twitter tags) is the SEO kernel's job,
not the renderer's: a hand-built landing page renders `<PageMeta …/>` with
copy from the same content file as the config (`docs/seo.md`; the `/landing`
exemplar's `landingMeta` shows the shape). Manifest-driven pages get this
automatically from their `repobot.project.json` entry.

### Page chrome (the shell)

Nav and footer are **chrome, not sections**: `MarketingShell` renders them
once around the section stream, from `LandingConfig.shell`. The nav is
sticky and scroll-aware and collapses to a fullscreen burger menu on
mobile at every variant; it takes an optional one-line `announcement`.

Shell nav variants — each is a designed treatment, not a knob:

| Variant          | The design                                                                                                                            | Reach for it when                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `inline`         | Inset bar that lifts into a floating, blurred card on scroll; logo left, plain links + CTA right.                                     | A safe, product-y treatment for SaaS and app pages          |
| `centered`       | Links left, logo centered, CTA right on a flush masthead band ruled underneath — the program at the door, not a card                  | Brand-forward pages where the mark is the hero              |
| `burger-overlay` | Logo plus a burger at every width, chromeless (no card; a blur veil on scroll); links live in the fullscreen type-led overlay         | Editorial/portfolio pages that want maximal quiet           |
| `full-width`     | Edge-to-edge translucent band flush against the viewport top, hairline-ruled, content re-constrained to the page column. The default. | Stripe/Linear-style product sites; pages with dense nav     |
| `split`          | Squared bar ruled underneath: logo left, links right in full text color with an accent underline on hover, CTA a size up              | Conversion-focused pages where the CTA should dominate      |
| `pill-links`     | Logo left, CTA right, links centered in a bordered pill cluster shaped by the preset's control radius                                 | Playful or app-like brands; pairs well with `soft-saas`     |
| `logo-only`      | The mark alone, centered; `links`/`cta` ignored                                                                                       | Blogs and single-surface sites where the content is the nav |

**Vary this choice between projects.** The nav is the first thing every
visitor sees; two projects that share a nav variant read as siblings even
with different presets. The default when `shell.nav.variant` is absent
comes from `repobot.theme.json` → `navigation.variant` (kernel default
`full-width`) — set it there during setup so every marketing page follows,
or per page in the config. Blueprint-derived pages also lean per preset:
`brutalist` and `warm-boutique` default to `inline` (their hard rules and
sunlit warmth suit the contained card better than the translucent band);
a manifest-pinned `navVariant` always wins.

**Hover menus.** Any nav link may carry a `menu` of titled columns of
described links (`MarketingNavLink` — see `docs/landing-content.md`).
Hover or focus opens the panel under the bar; on mobile the entries
flatten into the burger overlay. Use one for the product/features link on
sites with more than a handful of destinations — it is the single
strongest "real company" signal a nav can send.

Shell footer variants: `simple` (single row), `multi-column` (titled link
groups), `newsletter` (email capture embedded; persistence injected by the
renderer like `lead-form`).

The legacy `nav` / `footer` **section** types remain renderable for
pre-shell configs; new pages put chrome in `shell`.

## Vocabulary

The names below are a stable, append-only contract (shared with the platform
setup architect — see `docs/landing-kernel-spec.md` §8). Variants marked *
are planned but not yet built.

### Sections and variants

| Type              | Retires the doubt                | Variants                                                                                                         |
| ----------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `nav` (legacy)    | Where am I, what can I do        | `inline`, `minimal` — new pages use shell chrome instead                                                         |
| `hero`            | "Is this for my use case?"       | `centered-stack`, `split-media`, `statement`, `form-first`, `product-frame`, `full-bleed-media`, `panel-collage` |
| `social-proof`    | "Who else trusts this?"          | `text-logos`, `metrics-row`, `marquee`, `badges`\*                                                               |
| `logos`           | "Which names back this?"         | `strip`, `grid`                                                                                                  |
| `stats`           | "Prove it with numbers"          | `row`, `cards`                                                                                                   |
| `feature-grid`    | "What does it do for me?"        | `cards-3up`, `icon-list`, `bento`                                                                                |
| `highlights`      | "Show me, one feature at a time" | `alternating`, `stacked`                                                                                         |
| `content-split`   | "One claim, told properly"       | `media-right`, `media-left`                                                                                      |
| `steps`           | "How does it work? Is it hard?"  | `numbered-cards`, `timeline`, `horizontal-rail`\*                                                                |
| `comparison`      | "How is this different from X?"  | `table`, `cards`                                                                                                 |
| `schedule`        | "When can I actually come?"      | `week-grid`, `day-rows`                                                                                          |
| `testimonials`    | "Do real people vouch for it?"   | `quote-grid`, `single-featured`, `quote-carousel`\*                                                              |
| `pricing`         | "What does it cost?"             | `tiers`, `single-price`\*, `table`\*                                                                             |
| `faq`             | Residual objections              | `accordion`, `two-column`\*                                                                                      |
| `showcase`        | "Show me the work / the goods"   | `card-grid`, `filterable-grid`, `collections`, `media-rail`                                                      |
| `card-grid`       | "What's on offer?"               | `3up`, `2up`, `4up`                                                                                              |
| `carousel`        | "Let me browse the lineup"       | `cards`, `spotlight`                                                                                             |
| `gallery`         | "Show me, don't tell me"         | `uniform`, `masonry`, `justified`, `sequence`, `filmstrip`                                                       |
| `rich-prose`      | "Give me the long version"       | `narrow`, `two-column`                                                                                           |
| `team`            | "Who's behind this?"             | `grid`, `list`, `portraits`                                                                                      |
| `blog-list`       | "Is anyone home? What's new?"    | `cards`, `list`                                                                                                  |
| `cta-banner`      | "Okay — let me act"              | `card`, `full-bleed`, `split-with-form`\*                                                                        |
| `lead-form`       | Capture intent, minimal friction | `inline-email`, `contact-block`, `detail-form`                                                                   |
| `footer` (legacy) | Housekeeping and trust residue   | `single-row` — new pages use shell chrome instead                                                                |

Shell chrome (not sections): nav `inline` / `centered` / `burger-overlay` /
`full-width` / `split` / `pill-links` / `logo-only`, footer `simple` /
`multi-column` / `newsletter` — see "Page chrome" above.

**The photography-grade set.** Image-led pages (photographers, weddings,
real estate) compose from: hero `full-bleed-media` (the photograph IS the
hero; optional `slides` crossfade slowly, the first frame holds under
reduced motion), gallery `justified` (natural aspect ratios leveled into
rows in the author's order — never masonry for sequenced work), gallery
`sequence` (one photograph per near-viewport frame, in order — the
editorial pacing) and `filmstrip` (the frames on a scroll-snapped
horizontal rail), showcase `collections` (large cover tiles, whole card a
link — the album index) or `media-rail` (the same covers as a browsable
strip), cta-banner `full-bleed` (an edge-to-edge tinted closing band), and
testimonials `single-featured` (one voice at pull-quote scale).
Galleries take two content flags: `fullBleed` (edge-to-edge breakout) and
`lightbox` (click-to-open full-screen viewer with keyboard/swipe nav).
These sections expect real image media **with intrinsic `width`/`height`
and a `srcSet`** — run originals through `npm run image -- responsive` to
get ready-to-paste entries; an image without dimensions costs the page its
layout-shift-free loading. Two shipped packs compose from this set: the
`photography` portfolio (Mara Voss) and the `wedding` studio site (Isla
Hart), which adds the service-business spine — pricing `tiers` with flat
prices (`period: ""`) and an faq `accordion` — to the same image-led
register.

**The SaaS-grade set.** Product-led pages (SaaS, dev tools, dashboards)
compose from: hero `panel-collage` (centered copy over the product in CSS
browser chrome, with up to two `fragments` — small crops of real UI, a stat
card or an approval row — floating over the frame's edges) or
`product-frame` (copy beside the framed screenshot), social-proof `marquee`
(the text-logo strip on a continuous scroll behind edge-fade masks; pauses
on hover, static wrap under reduced motion), and feature-grid `bento`
(mixed-size cells over a 4-column grid; a feature may carry `media` — a
product crop that bleeds off the cell's bottom-right — so features are
shown, not told). These variants expect real product screenshots processed
through `npm run image -- responsive`, same as the photography set: the
collage and bento crops are what make the page read as "this product
exists" rather than template filler. The `saas` pack (Outlay) composes
from this set.

### Style presets

A preset is the page's whole art direction: palette, type pairing, shape,
background treatment, motion. Pick one; don't mix section-level styling.
When the brief expresses no color direction, default achromatic: lean on
the monochrome registers (`editorial`, `brutalist`, `mono-utility`,
`atelier`, `marquee`, `chalk`) and let type and spacing carry the page —
the moment the user names a color, brand, or mood, follow them, not the
default.

Motion is baked into every preset: sections rise into place as they enter
the viewport (a one-shot scroll reveal with a short above-the-fold
cascade), cards lift subtly on hover, and hover menus animate in — all
disabled under `prefers-reduced-motion`. Don't add per-section animation
libraries; the kernel's motion signature is deliberate and uniform.

| Preset          | Identity                                                                                                                                                                  | Lean toward it for                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `dark-dev`      | Near-black, one saturated accent, aurora wash + grain                                                                                                                     | SaaS, dev tools, AI products                      |
| `soft-saas`     | Light, friendly, iridescent aurora wash, floating cards                                                                                                                   | Consumer apps, approachable SaaS                  |
| `editorial`     | Paper-and-ink, serif display, rules over cards                                                                                                                            | Studios, portfolios, writing                      |
| `brutalist`     | Zero radius, double-weight ink rules, hard offset shadows                                                                                                                 | Portfolios, statements, anti-slick                |
| `warm-boutique` | Cream-and-terracotta warmth, sunlit wash, pill controls                                                                                                                   | Cafés, salons, local businesses                   |
| `mono-utility`  | Monospace display, graph-paper ground, spec-sheet restraint                                                                                                               | Utilities, technical products                     |
| `aurora-dark`   | True-black, molten violet-cyan-pink ribbon, glass cards                                                                                                                   | Flagship dark launches, AI, fintech               |
| `luxe-light`    | Near-white, deep ink type, iridescent top band, crisp depth                                                                                                               | Polished fintech-grade SaaS, B2B                  |
| `atelier`       | Gallery-quiet: near-white walls, light tracked caps, hairlines, no wash — the photos carry all color                                                                      | Photographers, visual portfolios, image-led sites |
| `heirloom`      | Romantic stationery: Fraunces serif with an italic accent, warm ivory + champagne hairlines, botanical green, generous air                                                | Wedding/event studios, keepsake trades            |
| `sitework`      | The plan table: work paper ruled in a faint site-plan grid, stenciled uppercase display, safety-orange accent, jobsite grain                                              | Contractors, plumbers, electricians, the trades   |
| `marquee`       | The stage night: true black, plain white playbill caps (Fraunces heavy, uppercase), pushed grain — strictly monochrome, photographs are the only color                    | Music photographers, venues, bands, tour sites    |
| `chalk`         | The training floor: near-black rubber ground, chalk-bone ink, stenciled uppercase signage, hairline rules, dust grain — strictly monochrome, photography carries all tone | Gyms, strength studios, fitness and wellness      |
| `hymnal`        | The midnight service: warm near-black ground under grain, monumental uppercase Space Grotesk, hairline rules, one candle-amber accent in the CTAs and a slow beam         | Churches, congregations, community organizations  |
| `broadside`     | The gig poster: aged print paper under a halftone dot screen, ink hairline rules, monumental uppercase caps, one oxblood accent                                           | Bands, venues, tours, record releases             |
| `crt`           | The phosphor terminal: pure-black tube, mono type, hairline rules, scanline raster + glow — accent-agnostic, the brand supplies the phosphor (green, amber…)              | Dev tools, terminals, retro-tech products         |
| `handheld`      | The pea-green LCD: LIGHT olive-on-sage four-shade ground, chunky mono uppercase, zero radius, dithered pixel wash                                                         | Games, toys, playful retro products               |
| `lounge`        | The night lounge: neutral #121212 ground, flat charcoal panels, pill-round shapes, one saturated accent glow                                                              | Music, entertainment, nightlife products          |
| `retroware`     | The silver machine: bevel chrome, zero radius, outset-shadow dialogs, the page ground an accent-driven desktop wash (teal, navy, felt, toy red)                           | Retro-web, desktop-era, novelty sites             |

Resolution order for colors and fonts: **customer theme > preset**. Presets
route their accent through the `packBrand`/`packFont` overlay, so "make it my
brand color" in `repobot.theme.json` re-skins the page without config edits.
For one-off tweaks, `style.overrides` re-assigns individual `--marketing-*`
variables (names in `web/design-system/src/marketing/theme/marketingTheme.css.ts`)
before you ever consider ejecting.

## Writing the page (copy rules)

- **Each section retires one doubt** (see the table above). If two sections
  answer the same doubt, merge them. Don't ship "features", "benefits", and
  "how it works" as the same paragraph in three outfits.
- **Section order is the argument.** Default skeleton: hero → social-proof →
  feature-grid → steps → pricing → faq → cta-banner → lead-form (chrome —
  nav and footer — comes from the shell, not the stack). Re-sequence around
  the visitor's dominant doubt: new-category products show the product
  earlier; crowded-category products surface comparison and pricing sooner.
- **One primary CTA, repeated** — nav, hero, cta-banner, lead-form all point
  at the same action. Never five competing actions.
- **Headline under ~10 words**, naming a specific outcome for a specific
  person. One word gets the accent treatment; where it lands is the hero's
  `accent` grammar — `last-word` (the default: end the sentence on the word
  you want to pop), `first-word` (editorial open), or `none` (pure
  typography — brutalist and spec-sheet registers read cleaner bare). Each
  preset ships its own lean (`LANDING_DIRECTIONS` in blueprints.ts); an
  explicit `accent` on the hero content overrides it.
- **FAQ answers real objections** (cost, cancellation, security, setup
  effort) — never "what is your product?"; the page already answered that.

### Blueprints by business type

Chrome (shell nav + footer) wraps every stack automatically; the stacks
below are body sections only.

| Business                        | Section stack                                                                                                                          | Preset lean                |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| SaaS / app                      | hero (`panel-collage`), social-proof (`marquee`), feature-grid (`bento`), highlights, testimonials, pricing, faq, cta-banner           | `luxe-light` / `dark-dev`  |
| Local business                  | hero (`split-media`), showcase (menu/services), social-proof (`metrics-row`), faq, lead-form (`contact-block`)                         | `warm-boutique`            |
| Trades / contractor             | hero (`split-media`), card-grid (services), gallery (`before-after`), social-proof (`metrics-row`), testimonials, cta-banner           | `sitework`                 |
| Portfolio / studio              | hero (`statement`), showcase (`filterable-grid`), steps, faq, lead-form (`contact-block`)                                              | `editorial` or `brutalist` |
| Photographer / visual portfolio | hero (`full-bleed-media`), gallery (`justified`, lightbox), showcase (`collections`), content-split (about), lead-form (`detail-form`) | `atelier`                  |
| Pre-launch / waitlist           | hero (`form-first`), feature-grid, faq                                                                                                 | any                        |

## Media without assets

Every section looks finished with zero images — don't block a page on
artwork. The ladder, best rung available:

1. **Type-led**: the `statement` hero needs no visual at all.
2. **Preset backgrounds**: the page wash comes from the preset's tokens.
3. **Generative artwork**: `media: { kind: "glyph", seed: "Adaptive checklists" }`
   renders seeded, accent-keyed generated art — an abstract geometric mark
   at icon scale, a full-bleed iridescent gradient panel at media scale.
   Every item gets unique custom artwork with zero assets; the seed (use
   the item's title) makes it deterministic. `{ kind: "emoji", emoji }`
   renders the same artwork with the emoji folded into the seed — raw
   platform emoji are never shown, they read as template filler.
4. **Real images**: `media: { kind: "image", src, alt }`; in a Repobot
   workspace you can generate them (save under `web/app/public/`) — prefer
   abstract, on-palette imagery over stock-photo pastiche.

## Lead capture: managed forms by default

`LandingRenderer` submits every lead form through the platform's **managed
forms pipeline**: `submitForm` (`web/core/src/Forms/FormsClient.ts`) POSTs
`{ formKey, fields }` to `/__forms/submit` on the site's own origin, where
the platform resolves the site from the Host header. On a deployed site —
static or full-stack, platform subdomain or custom domain — the owner gets
an email and a dashboard entry (the workspace's Submissions page) with
**zero setup**: no CORS, no baked-in site ids, no backend required.

- Outside a deploy (the sandbox dev server) the reserved path doesn't
  exist, so `submitForm` falls back to a localStorage write — the visitor's
  submit interaction always completes, and nothing breaks pre-deploy.
- Forms carry a hidden `_trap` honeypot input; submissions where a bot
  filled it are silently dropped server-side. Underscore-prefixed fields
  are machinery and never shown to the site owner.
- Custom forms in a pack can call `submitForm` directly with their own
  `formKey` (e.g. `"proofing-selection"`, `"rsvp"`); `fields` is structured
  JSON, so arrays and nested objects ride along fine.
- Never use `mailto:` as a form fallback — it opens a local mail app and
  loses the lead on most machines.

### The backend upgrade (optional)

Managed forms deliver to the owner's email and dashboard, not to the app's
own database. When the product needs submissions as first-class app data
(e.g. an admin screen over them), follow `docs/adding-a-domain.md` to add
the domain (SQL migration + service + GraphQL mutation), point the form's
submit at the mutation, and flip `clientOnly`/capabilities in the deploy
manifest so provisioning follows.

## Matching an uploaded screenshot

A common request: the user attaches a screenshot or mockup of a landing
page and asks you to make theirs look like it (often with different brand
or copy). That image is a **design spec**, not an asset.

This recipe covers marketing pages. When the screenshot shows a dashboard
or signed-in app screen, the same principle applies but the target is the
widget kernel (`docs/web-app-content.md`), not `LandingConfig`; an auth
screen is the kernel auth card restyled through tokens (`docs/auth.md`),
never a hand-built form.

Do this:

1. **Read the image first — and measure it.** Extract layout (nav, hero
   split, section count and order, alignment), type (scale, weight, case,
   tracking), and which bits are unique chrome versus stock sections. Sample
   colors deterministically: `npm run image -- palette <file>` prints the
   exact hex palette with coverage — never eyeball hexes from the vision
   read. Check `npm run image -- info <file>` for dimensions: a tall, narrow
   screenshot is usually a **phone capture of a desktop site**, not a
   mobile-only design — build the responsive desktop layout, then verify at
   the capture's width too. (A prod session rebuilt a desktop page as a
   burger-nav mobile stack because the spec arrived as a phone shot.)
   Several page screenshots map to several routes; build each one.
   Then **persist the spec**: copy it into the repo (e.g.
   `assets/brand/design-spec-home.png`) and commit it on your first pass.
   Attachment staging dirs do not survive workspace restarts — a spec that
   only lives there turns the next "match the example I shared" round into
   guessing, and `page:check --compare` has nothing to point at.
2. **Restyle the kernel to match.** Set `repobot.theme.json` (accent, radius,
   light/dark, and the design's body font as `fontFamily` so the signed-in
   app matches the landing — see Typography below for the mono/decorative
   exception) and the page's `LandingConfig` (preset, nav variant,
   section types/variants, `style.overrides`) so the skeleton, type, and
   palette match. Generate or crop **individual** photos, illustrations, and
   card art — a person, a product, a pack shot — into `web/app/public/`.
3. **Eject only the chrome the kernel cannot express** (perspective card
   fans, a custom pack mockup, an unusual nav). Copy the section into
   `web/app/src/Theme/overrides/` and re-point `@ui` (`docs/design-system.md`).
   Keep the page on the manifest route (`LandingRenderer` / inline `landing`
   config). Do not edit `web/design-system/`. Do not replace `/` with a
   one-off TypeScript page that orphans `repobot.project.json`.
4. **Never paste the screenshot onto the page** as an `<img>`, CSS
   background, or hero `media`. That is the failure this recipe exists to
   prevent: a stock template with their mockup sitting in the media slot.
5. **Verify with a side-by-side.** `npm run page:check -- / --compare
<spec image> --width <design's viewport, e.g. 1440>` (or the route you
   built) writes a labeled design-vs-build PNG under `.dev/page-check/`
   alongside the plain screenshot. Read that **one** file — differences are
   far easier to spot inside a single image than across two reads — and fix
   spacing, type, and color element by element until a visitor would
   recognize them as the same design. The user's requested copy and brand
   win over text in the screenshot.

### What "identical" is judged on

Users asking for a match compare the details, not the skeleton. A page that
gets the section order right but keeps kernel defaults for the items below
reads as "a template", and the request comes straight back:

- **Nav chrome.** Same link count, order, and casing; dropdown carets in the
  spec become nav `menu` entries; same button treatment on the right — if the
  design shows two buttons (e.g. an outline "Book a demo" beside a filled
  "Get X") or chrome no nav variant expresses, eject the nav via `@ui` and
  build it. A single default CTA under a design that shows two is a miss.
- **Wordmark.** Render a real logo in the design's style — generate one
  (`npm run brand:generate -- --name "..."`, or the image tool for a styled
  mark), stamp `marketing.brand` in `repobot.project.json` so the shell
  renders it. Never ship the default plain-text project name where the spec
  shows a designed wordmark.
- **Typography.** Pick the closest font, then put it where it keeps the
  product coherent. The design's **body/text face goes in
  `repobot.theme.json` `fontFamily`**: it styles the marketing pages _and_
  the signed-in dashboard together, so the landing a user just styled and
  the dashboard they open next read as one design — a styled landing over a
  default-sans dashboard is a miss users notice immediately. Tune the
  marketing display face, weight, tracking, and case with
  `--marketing-font-display`, `--marketing-display-weight`, and friends via
  `style.overrides`. The exception is mono and decorative display faces:
  keep those marketing-only (`--marketing-font-display`) — never make them
  the app-wide `fontFamily` unless the user wants that font everywhere,
  because it would turn their dashboard into a terminal. The
  headline's accent treatment (which word is colored, gradient vs flat)
  comes from the hero's `accent` grammar or an ejected hero.
- **Hero artwork.** A layered product composition (overlapping panels,
  floating tags, a waveform) is rebuilt piece by piece: generate each
  panel/card as its own asset, position with CSS at matching scale and
  overlap inside an ejected section. One flat generated image where the
  spec shows a composition is a miss.
- **Icons.** Match the design's icon language: stroke vs filled, weight,
  corner rounding, and chip treatment (a tinted rounded-square behind the
  glyph is part of the design). The kernel's `MarketingIcon` vocabulary is
  a small feather-style stroke set — when the spec's glyphs are not in it,
  eject the section via `@ui` and draw matching 24×24 inline SVGs in the
  same stroke language (or crop the icon out of the spec as an asset).
  Forcing the nearest stock icon under a design that shows different
  glyphs reads as "not the same icons" every time.

## Iterating and customizing

- `npm run storybook` — every section has stories per variant, and
  `Marketing/Presets` renders one composed page under each preset (the
  visual QA gate).
- Restyle order: `repobot.theme.json` first (brand flows into every preset),
  then `style.overrides`, then component props — and only then eject a
  section via the `@ui` registry (`docs/design-system.md`). Never edit
  `web/design-system/` in a customer project.
- Content tests guard invariants (see
  `web/app/tests/View/Landing/LandingPage.test.tsx` and the launch pack's
  pricing guard: a yearly price above monthly fails the build).
