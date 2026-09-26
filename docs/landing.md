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
| `stats`           | "Prove it with numbers"          | `row`, `cards`, `bars` (a report: `intro`, ruled rows with a bar each, `footnote`, `note` tag)                   |
| `feature-grid`    | "What does it do for me?"        | `cards-3up`, `icon-list`, `bento`, `checklist`                                                                   |
| `highlights`      | "Show me, one feature at a time" | `alternating`, `stacked`                                                                                         |
| `content-split`   | "One claim, told properly"       | `media-right`, `media-left`, `report`                                                                            |
| `steps`           | "How does it work? Is it hard?"  | `numbered-cards`, `timeline`, `horizontal-rail`, `message-thread`                                                |
| `comparison`      | "How is this different from X?"  | `table`, `cards`                                                                                                 |
| `schedule`        | "When can I actually come?"      | `week-grid`, `day-rows`                                                                                          |
| `testimonials`    | "Do real people vouch for it?"   | `quote-grid`, `single-featured`, `quote-carousel`\*                                                              |
| `pricing`         | "What does it cost?"             | `tiers`, `price-list`, `price-tags`, `single-price`\*, `table`\*                                                 |
| `faq`             | Residual objections              | `accordion`, `two-column`\*                                                                                      |
| `showcase`        | "Show me the work / the goods"   | `card-grid`, `filterable-grid`, `collections`, `media-rail`, `specimens`, `swatches`                             |
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
register. A `sequence` gallery with an `overlay-*` `captionStack`
(`overlay-start` or `overlay-center`) is the captioned stack with its
captions set small over each photograph's foot on a scrim — the location
slate of a destination or elopement studio (the `band-*` modes are the
portrait stack's museum labels; see "The portrait-stack set"). Pricing takes a
`currency` (ISO 4217, default `usd`) so a studio quoting in euros prints
"€9,000" across tiers, tickets, and tier-derived price lists. Pricing `builder` sets the same `groups` as the menu
board as a package the visitor assembles: every line a ticked checkbox row
(name, what's included, the printed price) over a running total that adds
the ticked lines' numbers as they change (`totalLabel` names it; lines
priced "Included" or "By quote" tick but add nothing). A group with
`choose: "one"` is a pick-one choice; lines marked `selected` open ticked
(otherwise every line does). `builderLayout: "tiles"` sets each group as a
row of photograph tiles (each line's `media`) beside a summary card
(`summaryTitle`) listing the ticked lines over the total and the ask — the
session builder of a newborn or portrait studio (`photography-family-adalin`);
the default `board` layout is the checklist board of a multi-event studio
(`services-makeup-noor`). It is one component either way, and a board with
none of the tiles fields set renders exactly as before they existed.

**The turnover set.** Service crews that sell speed and proof (turnover
and move-out cleaners, organizers, pop-up services) compose from: pricing
`tiers` as the home page's second section (a tier may carry `pricePrefix`
— "From" — for quoted-up services), steps `horizontal-rail` with clock
times as each step's `label` and a proof photo as its `media`, and
feature-grid `checklist` (a door-hanger card: `cardTitle`, `body`, optional
side `media`, and features with a `checked` state — unticked items render an
open box). Under the `memphis` register the tiers print as trading cards,
the rail's photos carry check chips, and the hero `badge` becomes a
starburst sticker. The `services-recurring-turnover` derived template (Clean
Getaway) composes from this set; the `services-recurring` pack itself and
its original trade remixes stay on `warm-boutique`.

Two more frames serve the recurring set. Pricing `tickets` prints the same
tiers as season tickets — paper stock, the price big, the description on an
accent band, a notched tear-off stub with a barcode and the tier's `stub`
code, and an optional per-tier `period` ("/season" among per-cut tickets).
Showcase `specimens` doubles as a creature or weed index before the prices.
The recurring pack picks both from content: every plan carrying a `stub`
prints as tickets, and `home.layout` frames the hero `split-media`,
`full-bleed-media`, or `masthead-overlay` (with `home.credit` as the
credit line). The skins show the range: `services-lawncare-crew` (Fresh Cut,
`gameday`: a full-bleed crew photograph over tickets) and
`services-pest-creature` (Night Crawlers, `creature`: a painted masthead poster, a creature index,
and lobby-card tiers).

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

**The craft-trade set.** Builders and makers who sell by the photograph
(custom homes, timber framers, woodshops, restoration carpenters, stone
and metal work) compose from: hero `full-bleed-media` with a `credit` line
(tracked caps under the headline — what and where) and a `mediaCaption`
(the photograph's own slug, small monospace on the frame's lower right),
social-proof `ticker` (what's on the bench right now — one site-board
line per job, "Arch Cape cabin — timber frame, week 9 of 30"; under the
`mist` treatment the ticker is a quiet hairline-ruled strip of small
tracked mono instead of the monumental outline), steps
`horizontal-rail` (the build log: photo cards on one thin connecting line,
each step with an optional `label` — a month, a phase code — and `media`;
scroll-snapped on narrow screens), and showcase `specimens` (tall portrait
cards — a material, a finish, a species — each item's `meta` read as
its "/ use" sub-label and one line of `description`; reusable for any
trade that sells by what it works in: tile, stone, fabric, paint), and
card-grid with each card's optional `meta` (a starting price) — under
`mist` the cards drop their boxes: image, hairline, title, tracked-caps
meta. The
`services-builder` derived template (Tideline Builders) composes from
this set under the `tideline` preset; the `services` pack itself and its
original trade remixes stay on `sitework`.

**The newsroom set.** Loud, witty, story-led pages (event photographers,
bars, local papers, anything that wants to read like a tabloid front)
compose from: hero `front-page` (an accent dateline bar, a banner headline
over a deck and a byline with its mug, the lead photo, and a caption with
a jump link — the newspaper furniture rides on the hero's `edition`
content), showcase `stories` (a flag, then column-ruled articles: kicker,
headline, photo, a `meta` dateline run into the body, and a
`linkLabel` jump; the grid gives 1/4/7 items a lead story and 2/5/8 two
halves), cta-banner `classified` (a double-ruled newspaper classified — tab
`kicker`, headline, `price` between rules, `finePrint`, and a signed
`signoff` box), and gallery `contact-sheet` (the roll as a 35mm contact
sheet: sprocket bands, frame numbers from `firstFrame`, the `edgeCode`
stock along the film edge, and per-frame grease-pencil `mark` — `circle`
or `cross` — plus a handwritten `note`; lightbox, intrinsic sizes and
`srcSet` as in the photography set). The `tabloid` preset is their native
register; its `halftone` treatment lays a dot screen over framed
photographs. The `wedding-edition` pack (The Late Edition) composes from
this set.

**The print-shop set.** Two loud local-trade registers built from the same
parts as the builder set. `riso` is the two-ink risograph poster: its
`two-ink` treatment reprints every photograph as a fluorescent-orange and
sage plate pair on warm paper (a dot screen, a slight misregistration,
paper speckle) through a shared SVG filter, turns the `full-bleed-media`
hero into an inset print with a round `mediaCaption` stamp and a tape-strip
`credit`, sets the ticker as a solid spot-ink band, names `specimens` on
ink bands, and brush-strokes section titles; before/after proof stays in
full color. `paintchip` is the Swiss paint deck: its `colorblock`
treatment runs the `split-media` hero edge to edge (copy column, full-height
photograph, `credit` closing the copy), marks kickers with an accent
square, and prints hard-shadowed square CTAs. Its companion is showcase
`swatches` — a full-bleed row of flat paint-chip fields, each item's
`color` filling the chip with its name, `meta` code, and a one-line note in
whichever ink reads on it. `services-landscape-native` (Wild Ground) and
`services-painting-swiss` (Shotgun Color Co.) compose from this set.

**The beauty set.** Two dark glam registers for chair-and-counter trades.
`crown` is the late-90s hip-hop/R&B glossy cover: plum ground under grain,
wide italic Archivo caps cast in chrome with a gold accent word (the
`metallic` treatment sets them as real text through a gradient clip and a
cast shadow), tangerine CTAs enamelled in a gold inset. Its
`masthead-overlay` hero takes `coverLines` — the cover's stacked sells down
the left edge, a "\n" splitting each line's lead from its tail so the inks
and sizes alternate — plus a `badge` kicker and a gold-ruled `credit`; the
ticker stops rolling and becomes a centered gold price strip between
stars, `price-list` a gold-framed inside page with chrome title and gold
prices, `specimens`/`filterable-grid` a gold-framed lookbook of portraits
with chrome names, and `checklist` a squared house-rules card. `vanity` is
the beauty counter at night: true black, a Bodoni Moda Didone at fashion
scale over tiny Jost caps tracked wide, one lipstick accent with blush and
plum spot inks (`lacquer`). Its `full-bleed-media` hero stacks the
headline's first line large over a smaller second, the accent word back at
size in lipstick, and ends on a hairline-led `credit`; showcase `swatches`
rides up over the hero's foot as hairline shade cards, each item's image
`media` a texture chip beside the name, `meta` and note; the ticker is a
tiny spaced tagline between hairlines, `price-list` a black rate card on
one blush hairline, and `checklist` a square hairline card. `services-hair-braids`
(The Crown Room) and `services-makeup-counter` (Marisol Vega) compose
from this set.

**The dispatch set.** Call-first trades that sell a flat price
(plumbers, electricians, HVAC, locksmiths, towing) compose from: hero
`full-bleed-media` with an `aside` of kind `price-board` (a short menu
board on the photograph — `title`, `items` of `name`/`price`/`qualifier`,
`footnote`, `cta`), a `seal` (a roundel; a line break splits its small top
line from the big one), or a `readout` (a monumental `value` — "115°" —
with a script `note` under it; a brand statement, never a live reading),
pricing `price-list` (the printed price book) or `price-tags` (the same
groups flattened into a row of hang tags — three to five items), content-
split `report` (a signed job card with the quote beside the final),
and steps `message-thread` (the customer's real text thread as how it
works). Three registers wear it: `jacaranda` with its `signpaint`
treatment (cream show-card caps with an ink outline and drop shade over
the photograph, a brush-script accent word, a hand-lettered board, a torn
print edge), `schematic` with `linework` (a wiring diagram drawn over the
photograph, the ticker as a mono instrument readout), and `sunbelt` with
`sunburst` (the photo in an arched window, a rising sun behind the
readout and the closing banner, the price tags hung first). The `services-emergency-van`
(Straight Pipe Plumbing), `services-electric-techno` (Live Wire Electric)
and `services-hvac-desert` (115 Degrees) derived templates compose from
this set; the `services-emergency` pack itself and its original trade
remixes stay on `sitework`.

**The estate set.** Six registers for high-touch home trades, each built
around one spine from the existing vocabulary. `plantroom` (`gauge`) is
the mechanical log — graphite and copper, Sofia Sans Condensed caps and
mono tags — and reads showcase `specimens` as a systems index (each
plate's `eyebrow` a system code, `meta` its care interval).
`stormline` (`dispatch`) is the storm desk — harbor navy and amber over a
cool ground — and pairs hero `form-first` bound to a photograph (the
intake card over the scene: `form.heading`, icon `choices`, a ZIP
`field`, a `tel` contact) with schedule `day-rows` set as a navy dispatch
board and gallery `before-after`. `plaster` (`journal`) is the garden
notebook — warm plaster, olive ink, Sorts Mill Goudy's italic — and sets
showcase `stories` as a seasonal journal beside an engraved olive sprig.
`basalt` (`stillness`, `mist`) is the tea garden — basalt dark, Red Hat
Display light and widely spaced — and walks gallery `sequence` as numbered
wide strips, the hero's `seal` a vermilion chop. `whiteglove`
(`concierge`) is pure white with black Urbanist and sage kickers, and
sets steps `message-thread` as a correspondence card. `palmbeach`
(`cabana`) is club pink and palm green in Libre Caslon, framed in bamboo,
with schedule `week-grid` as month panels (the window the clock is in
marked `today`). `services-emergency-hartwell`,
`services-emergency-bayou`, `services-landscape-olivetta`,
`services-landscape-koen`, `services-recurring-linen` and
`services-recurring-worth` compose from this set.

**The catalog set.** Design trades that sell taste and a fee schedule
(interior designers, furniture dealers, restoration studios) compose from:
hero `split-media` with the `full-stop` accent, card-grid `3up` as a
numbered service strip, gallery `before-after`, showcase `card-grid` (case
notes) and `specimens` (numbered pieces — each item's `eyebrow` is its
catalog number), steps `timeline`, pricing `price-list`, testimonials
`single-featured`, faq, and lead-form `detail-form`. `midcentury` wears it
with its `atomic` treatment: the hero bleeds edge to edge with the copy
column hung from a mustard rule and the preset's boomerang-and-starburst
ornament in its corner, card-grids and timelines count off in Oswald
numerals cycling orange, mustard and olive, showcase cards become a ruled
index, the price list prints on a walnut board, and one small four-point
star marks the logo, the strip, and the closing banner — sparingly. The
`interiors` pack's `interiors-midcentury` remix (Nadia Farouk Interiors)
composes from this set; `interiors` itself stays on `atelier`.

**The party set.** Invitations that read as the party itself compose from
hero `invitation` — the headline split into lines on "\n", a `badge`
(the countdown), an optional `readout` (a name in script over a tracked
`note`), a `seal` roundel beside the primary ask, and a particulars strip
built from `credit` split on " · " with the secondary CTA as a jump link.
Beside the copy hangs either one portrait (`media`) or a pasted-up wall
from `snapshots` (up to five pieces: a piece with `frames` is a photo-booth
strip, one with `media` a single print, each with an optional `sticker`
label) — and gallery `photo-strip` (the album as booth strips of four
frames, a strip's `note` and `caption` riding its first item). Two
registers wear it: `photobooth` with its `zine` treatment (newsprint cream,
Permanent Marker caps in ink, hot pink and cobalt, a felt-tip swoosh under
titles, typed label-maker tags, drugstore-print borders) and `disco` with
`mirrorball` (black lacquer, lacquer red, hot pink and gold foil, Bodoni
Moda caps with a Great Vibes script, foil rules, a mirror ball throwing
sparkle, the portrait dissolving into the dark). The `vows-photobooth`
remix (Priya & Marcus) and the `gala-disco` remix (Vivienne Turns Sixty)
compose from this set; `vows` and `gala` themselves stay on `heirloom`
and `ballroom`.

**The practice set.** Appointment businesses whose visitor arrives
nervous (doctors, therapists, psychologists, dentists) compose from: hero
`split-media` with an `aside` of kind `directory` (a short index under the
subheadline — an optional `title` and `lines`, then `items` of
`label`/`note`/`icon`/`href`: the three facts or links a visitor looks for
first), its `mediaCaption` set under the visual, a `seal`, and a `credit`;
feature-grid `icon-list` (what's included), pricing `price-list` (the
printed fees, or a tracklist of session lengths), showcase `card-grid`
(plates), content-split, team `portraits`, faq `accordion`, and the
booking band. Four registers wear it, each with a treatment that restyles
every section at once: `wayfinding` with `transit` (the station sign panel
bleeding edge to edge, route-bar kickers, circular pictograms, heavy rule
lines, arrows on every ask), `groove` with `sleeve` (the LP front — a
square cover with the record sliding out, a round label sticker, a
three-stripe band — and tracklists numbered A1, A2 … B1), `inkblot` with
`wall-label` (the title across the wall, the plate centered and printed
into it, the directory as the museum label beside it), and `bubblegum`
with `candy` (gradient-filled inflated caps on a candy drop, die-cut
sticker directory, heart seal, glossy pills). The `care` pack's restyled
remixes — `care-direct` (Dr. Ada Okafor), `care-therapy-duet`,
`care-psychology-studio`, and `care-dental-bright` — compose from this
set; `care` itself and its original remixes stay on `luxe-light`.

**The quiet-practice set.** Practices that sell time and attention rather
than a price board compose from the same sections with a full-bleed
photograph instead of the directory hero: hero `full-bleed-media` (the
author's line break kept, the last line as the accent, a `credit`) and a
`steps` band for the practice's own course of care, the builders choosing
`timeline`, `horizontal-rail`, or `numbered-cards` from the seed's
`journey`. `parlor` with `gilt` sells a concierge physician as a Southern
parlor in daylight: kickers engraved in tracked caps between gilt rules,
the hero graded warm with its last line in Baskervville italic, the first
year as a photographic `timeline` — each step's `label` ("Week 1", "Month
12") in small caps over its title, the photograph framed with an inset
mat — the promises as engraved cards, portraits in arched frames, the
membership `price-list` as an engraved card, and a magnolia sprig over the
footer. `trailhead` with `fieldbook` sells walk-and-talk counseling as a
trail journal: headers set left under a pencil trail line ending in a
marker, the hero graded pine from the left, the promises as cards with
inked icon discs, and the seed's `exhibits` with `layout: "notes"` as a
showcase `stories` band turned into field notes — one row per note, the
photograph, a pencil trail map (the preset's ornament is a strip of four;
each note shows its own), and the essay opening on its byline (`meta`).
`hearth` with `weave` sells a therapy collective as its lounge: a woven
textile edge (the preset's ornament, one diamond tile laid both ways) down
the left of the full-bleed hero, along its foot and over a plum footer,
the hero's last line in ochre, kickers between small diamonds, and the
seed's `exhibits` with `layout: "directory"` as a `filterable-grid`
roster of the practice's providers — tall portrait cards built from the
resolved provider content (name, photo, role, each provider's `tags` line
its filter chips, so a Manage edit repaints them), with a blurb per
provider from `exhibits.extras` — that replaces the home portraits band; the matching `journey` (`cards`)
sits on a forest band and clients' words on a sienna one. `colophon` with
`marginalia` sells an assessment practice as a university press: one book
serif (Spectral) with its drawn small capitals as the preset's third voice
(`fonts.script`) for kickers, labels, and rectangular asks, the printer's
star (the preset's ornament) over every kicker and set into the footer's
double rule, and the seed's `spotlight.report` — a filled sample report
leads the home page ahead of the journey — as a content-split `report`
spread: the section's title centered over it, the case file on paper at
the left with a second sheet behind it and its `stamp` in oxblood, and the
spotlight's bullets at the right as numbered margin notes, each led in by
a hairline; the process (`cards`) prints as three ruled columns under
roman numerals. `boreal` with `frost` sells a psychiatry practice as a
Minnesota winter indoors: one light humanist sans (Commissioner), the
full-bleed hero washed in frost from the left and the foot so the headline
sets in slate over the snow instead of white over a dark grade, and the
seed's `journey` with `layout: "rail"` as a `horizontal-rail` of labeled
steps with no photographs — "Day 1" to "Day 90" as the reading line over
open slate nodes, the last node and the stretch into it in the preset's
one warm color (peach, spot 1) — that turns vertical on phones; the
spotlight's bullets set inline as a plain run of conditions between peach
points. The `care-primary-magnolia` (Magnolia Concierge Medicine),
`care-therapy-opentrail` (Open Trail Counseling), `care-therapy-kindred`
(Kindred Therapy Collective), `care-psychology-cambridge` (Cambridge
Neuropsychology) and `care-psychology-northlight` (Northlight Psychiatry)
remixes compose from this set.

**The fridge-door and show-bill sets.** Two warm, family-scale registers.
`snapshot` sells a documentary family photographer from the fridge door:
hero `pinboard` pins a pile of white-bordered `prints` (each a `media` with
an optional marker `caption`; four read best) beside the headline, with
the `seal` as a sticky note (a line break splits its lines) and the
`credit` as a marker scribble; the `taped` treatment carries the look down
the page — masking-tape strips and small leans on scrapbook prints,
collection covers, index-card pricing tiers (the highlighted tier's badge
as a round sticker), rail photos, the checklist's legal pad, testimonial
cards, and the closing banner. `rodeo` sells a family reunion as a Western
show bill: hero `split-media` with the `last-line` accent (the line after
the break prints nearly twice the size), the badge as a turquoise
countdown line, a roundel `seal`, and the credit as a ribbon; the
`lariat` treatment frames the whole page in rope (the register's `ornament` tile as a border image), sets the day rail
on a stitched line with star stops, prints schedule `day-rows` as a bill's
program, stats `cards` as brand tags, card-grid cards as numbered claim
tickets, the checklist on a rope-framed board, scrapbook prints under a
leather strap, and the ticket banner with stars. Nav logos take a
`markSrc` (a single-color SVG brand mark set beside the wordmark in its
ink). The `photography-family-documentary` template (Hattie Moreau, a
remix of `photography-family`, whose own site stays on `heirloom`) and the
`reunion` pack's `reunion-rodeo` remix (the Calloways at a Wickenburg guest
ranch) compose from these sets; `reunion` itself stays on `picnic`.

**The portrait-stack set.** Portfolios that let the photographs do all the
talking (almost no chrome, no cards, no icons, one text-link CTA) compose
from: gallery `sequence` with `captionStack` — every frame at ONE size,
the first photograph's aspect ratio, full width and capped at 92vh, each
image cover-cropped into it, so a remixed or uploaded photo of another
shape can't break the rhythm (it implies `fullBleed`). The mode places
the captions: `band-center` / `band-start` set each `caption` on a band
of the page ground under its frame like a museum label (the portrait and
music portfolios, the vows stack); `overlay-start` / `overlay-center` set
it small and uppercase over the photograph's foot on a scrim, like a
location slate (the wedding stack). Use a band when the caption is a
sitter's name or a line worth reading at text size, and the page ground
should frame each print; use an overlay when the caption is a short
place-and-date slate and the photographs should run unbroken. Every
caption is stamped for the content editor in either mode; gallery `covers` — the record wall: square
sleeves in a tight four-up grid (two-up on phones), each item's `caption`
the artist and `note` the album title; and cta-banner `colophon` — one
closing line (`title`), an optional second line (`body`, e.g. the price),
and the `cta` as a plain underlined text link on a full-width band in the
register's surface (`align` `"start"` sets it flush left). Three quiet
registers wear it: `vitrine` (stone grey, small EB Garamond),
`seamless` (white, small Inter Tight grotesque) and `liner` (a near-black
sleeve that turns warm white in light mode, small Barlow). The `photography` builder switches to the stack with
`home.layout: "stack"` and `photography-music` to the record wall with
`home.layout: "records"`; the `photography-wren` (Wren Hollis),
`photography-kaito` (Kaito Mori) and `photography-music-theo` (Theo Marsh)
remixes compose from this set.

**The full-bleed stack set.** Pages that are a column of photographs with
type between them compose from: hero `full-bleed-media` (the headline and
one date or promise line, usually no ask), rich-prose `narrow` as a short
band, gallery `sequence` with `captionStack` `band-center`, and cta-banner
`colophon`.
The `framestack` treatment holds it together: the hero is held to the
stack's frame size (the 4:3 height of the viewport's width, capped where
the hero caps itself), so a 4:3 stack is one size from the opening
photograph to the last, on a phone as on a desktop; on a page that opens
on the photograph the nav floats chromeless over it (white until the page
scrolls, the variant's own veil after), and pages that open on paper keep
it in flow. The band after the hero is a short list led by its `title` in
the body face, or — untitled — one centered line in the display face; and
testimonials there are a centered list of lines, each voice and its name
on one line (a guest book, not quote cards). `buttercream` (warm
buttercream, cocoa ink, Fraunces at its softest over Figtree) and
`vineyard` (deep navy, warm-white ink, Baskervville over Caslon's text
cut) wear it. The `gala` builder switches to the stack with
`home.layout: "stack"` (`home.bandTitle`/`band`, `home.stack`,
`home.memories`, `home.closing`); the `gala-otto` remix (a first birthday
picnic in Prospect Park) and the `gala-walt` remix (a seventieth birthday
dinner in Edgartown, with a memory book) compose from this set. The
`tintbands` treatment (worn with `framestack`) paints the bands: the
prose band and the closing colophon in the accent, each frame's caption
band in spot 1, so the stack reads as photographs laid between colored
stripes; `adobe` (adobe plaster, olive and fired clay, Alegreya over
Alegreya Sans) wears both. The `care` builder switches to the stack with
`home.stack` (`band`, `frames`, `closing`) — the team, prices, coverage,
and booking keep their pages — and the `care-obgyn-oakadobe` remix (a
birth center in Ojai) composes from it. `home.stack.report` (`kicker`,
`intro`, `rows[]` label/value, `footnote`, `note`) adds the outcomes
report as stats `bars` after the frames; the `care-obgyn-clearwater` remix
(a fertility clinic in San Francisco) sets it with no band or frames, the
demo rates tagged by the `note` as sample data. The `inkover` treatment
(worn with `framestack`) is for pale photographs: the full-bleed hero's
headline and the floating nav set in the page ink over a pale wash
instead of white over a dark scrim; `fogline` (white, plum ink, dusty
rose, Instrument Serif over Instrument Sans) wears both. A `sequence`
gallery with an `overlay-*` `captionStack` is the captioned stack (see
"The portrait-stack set"): the frames at one size edge to edge, each
caption set over the foot of its photograph on a soft scrim. The
`roomline` treatment (worn with `framestack`) makes it the room stack —
the hero headline drops to a caption's size at the caption's place, every
caption is one quiet sentence-case line in the display face, the wordmark
in spaced caps; `limewash` (bone, umber, burnt clay, Castoro over
Spectral) wears both. The `services` builder switches to the stack with
`home.stack` (`frames`, `closing`, `closingCta`), and the
`services-painting-casacal` remix (a lime-plaster studio in Santa
Barbara) composes from it. A captioned-stack item's `detail` sets a
second, smaller line under its caption (both stamped for the editor;
ignored without a caption or outside the captioned stack). The
`soundings` treatment (worn with `framestack`) makes it the waterfront
plates — each caption an address in the light display face over its
`detail` (place, price, computed status) in small tracked caps, the hero
line set light and small over a hairline-led badge with a pale square ask
and an underlined link, metrics-row numerals as a chart's depth soundings
between hairlines; on a phone the hero's copy lifts off the photograph
onto the paper beneath it. `baylight` (fog-pale ground, spruce ink,
sound-green accent, Noto Serif Display Light over Be Vietnam Pro) wears
both. The `estate` builder switches to the plates with `home.stack`
(`closing`, `closingBody`, `agentCta`): hero, the featured listings as
the stack, the metrics, the broker, the neighborhoods, one testimonial,
and the colophon; the `estate-aldercott` remix (a Bellingham waterfront
broker) composes from it.
The `miradouro` treatment (worn with `framestack`) makes the captioned
stack a fashion creator's diary: every caption one italic line in the
display face over a tall warm scrim, the kickers in small caps on a short
accent rule, the hero asks as underlined small-caps links, the looks rail
on portrait covers and the chips as small-caps text; `miradouro` (limestone
ivory, espresso ink, bordeaux, Noto Serif Display over Manrope) wears both. The
`influencer` builder reads `home.edition` (`hero`, `accent`, `credit`,
`story`, `looks`, `kindWords`, `banner`, `copy`) and the `influencer-lua`
remix (a Lisbon fashion and slow-travel creator) composes from it.
The `sprocket` treatment is a film-and-streetwear creator's page: the
`masthead-overlay` name condensed, heavy and on one line across the foot
of the photograph (the kicker, credit, line and asks stacked above it),
kickers, labels and asks in the register's mono third voice, the
`contact-sheet` grease pencil in spot 1, `specimens` numbered in large
accent numerals, `collections` as a ruled mono list, cards and quotes
hung from hard ink rules, condensed metric numerals, and the `full-bleed`
banner solid in the accent; `sprocket` (concrete, ink, Klein blue,
Bricolage Grotesque over Geist and Geist Mono) wears it. The
`influencer-remi` remix (a Peckham film and streetwear creator) sets its
`home.edition` story to a `contact-sheet`.
The `galley` treatment is a chef's photographic résumé: the
`full-bleed-media` hero's name in the display with its accent word in the
italic and its badge and computed line as ticket mono over a warm scrim,
kickers in the register's mono third voice after a short accent rule, the
photographic `timeline`'s labels as mono year tickets on an ink hairline
with square nodes and 4:3 photographs, `stories` as press clippings under
a double-ruled flag with mono kickers in spot 1, cards unboxed into a
ruled four-up, display numerals over mono stat labels, and the contact
block's channels as mono-labelled display lines; `galley` (oyster white,
cast-iron ink, kelp green, Besley over IBM Plex Sans and Plex Mono) wears
it. The `resume` builder turns photographic for a seed that photographs
its person (`person.portrait`, a role's or a project's `image` — see
`ResumePhoto` in `resumeLanding.ts`) and the `resume-yara` remix (a chef
de cuisine) composes from it.

Steps `timeline` turns photographic when any step carries `media` or
`frames`: each step hangs from its `label` (a clock time, "6:30") on the
line, with its title and description beside a lead photograph and the
step's `frames` (smaller photographs of the same moment) as a contact
strip; copy-only steps keep the numbered timeline, so a remix onto
content written for the other variants degrades cleanly. `daybook` sells
an on-location bridal team as the wedding morning's album: hero
`full-bleed-media` with the author's line break kept and the `credit`
written in script, and the `keepsake` treatment setting each hour large
and light over its title, the hour's photographs as one run of equal
prints with the description written under them in script, the social-proof
`ticker` as one still line of rates, a heart on a hairline over the
`text-logos` places, and the banner as a single pill. The
`services-makeup-tidewater` remix (Tidewater Beauty Co., Charleston)
composes from this set.

Pricing `builder` (the package builder; its fields are under "The
photography-grade set") sets the menu board's `groups` as a checklist over
a running total, for offers sold by the part — the events of a wedding
weekend, the rooms of a renovation. Hero `panel-collage` takes
`panels` — captioned portrait photographs in a row under the centered
copy, four across (two on narrow screens) — in place of the framed
product. `jharokha` sells a South Asian bridal studio as a jewel box on
emerald velvet: the `filigree` treatment crowns the name with a gold lotus
(the register's `ornament`), arches the panels like jharokha windows with
gold name plates, frames the package board and the closing ask in double
gold rules, and lays showcase `collections` out as a mosaic. The
`services-makeup-noor` remix (Studio Noor, Edison) composes from this set.

Content-split `media-left` doubles as a home design story: the services
builder emits it from the seed's `feature` slot (kicker, headline, the
paragraphs as one body, the photograph, a link through to the projects
page) whenever its `headline` is set, so a builder can hang one detail —
the pool, the stair, the window wall — beside its photograph under the
work. `horizon` sells a coastal residential builder as a quiet masthead on
white stock: the `panorama` treatment lifts the `masthead-overlay` name off
the photograph and sets it wide in the page's ink above a ruled line of
places, runs the photograph under it as a panorama, hangs kickers on long
rules, turns the `media-rail` into plain frames with caps captions, sets
`metrics-row` as light numerals between rules, and closes on one ruled
line with an arrow. The `services-contractor-meridian` remix (Meridian
Coastal, Malibu) composes from this set.

Content-split `feature` tells the same slot as a magazine feature: a
centered kicker and headline over a rule, the body in two columns under a
drop cap (paragraphs split on blank lines; the last reads as the coda),
the `media` as a full-width spread, then the optional `pullQuote`
between rules, the `figures` (detail photographs, each with a small-caps
`title` and a `caption`), and the `plate` (a drawing — the elevation, the
plan — with its `caption`). It is a paired-media variant: composers never
roll a split onto it, because its figures and plate are photographs no
other split sets. The services builder fills all of it from the seed's
`feature` slot. `shingle` sells a family estate builder as a country-house
quarterly on ivory laid stock: the `engraved` treatment stamps the crest
(the register's `ornament`) over the hero's line and centers the
full-bleed title like an engraving's, puts a fleuron on the feature's rule
and under its quote, feathers the plate into the page, sets the places as
one spaced line of Caslon, and turns the ask into an outlined plate with
an arrow. The `services-contractor-hallock` remix (Hallock & Sons,
Amagansett) composes from this set.

The `monograph` treatment (worn with `framestack`) sets an architect's
monograph: the full-bleed hero becomes one plate the height of the
viewport with the copy on the paper beneath it (the badge and the
photograph's `mediaCaption` as mono labels over a seven-five grid, the
headline light and large, the ask an ink button beside an underlined
link); the captioned stack's `band-start` captions become numbered plates
(`01`, `02` in the spot color before the title, the item's `detail`
flush right in mono); the `feature` loses its italics and sets its labels
in mono; and a showcase `card-grid` whose items carry no photograph
becomes a ruled index of works — number, title, eyebrow, description,
and meta in five columns. `schist` (drafting-room white, near-black ink as
the accent, one vermilion for the numerals, Geist Light over Geist with
Geist Mono labels, square corners) wears both. The `interiors` builder
switches to the monograph with `home.monograph` (`heroCaption`, the
`feature` slot, `indexKicker`/`indexTitle`, `closing`, `closingCta`):
hero, the featured projects as the plates (each `detail` the place, year,
and scope), the feature, the index of every project, one testimonial, the
credentials, and the colophon; the inner pages are unchanged. The
`interiors-architecture-aokifarrow` remix (Aoki Farrow, a New York
architecture practice) composes from it.

The `proofmark` treatment sets the one-line page like a galley proof: a
`statement` hero that carries a `badge` (page-title statements carry none)
fills the first screen — the badge as a mono slug at its head, the
headline flush left at its foot at poster scale with its accent (use
`full-stop`), the subheadline in the mono body face beneath; a
`text-logos` strip becomes a plain comma-run of names in the display face
that breaks only between names and ends on the accent full stop; a
`colophon` sits on the paper under a hairline, its line and its link (an
arrow after it) on one row. `galleyproof` (bone proof paper, carbon ink, one
proof red, Redaction 35 over Martian Mono, square corners, no motion)
wears it. The `fund-index` builder switches to the one-line home with
`home.line` (`badge`, `portfolioLabel`): hero, the portfolio's names, the
deck ask as the colophon — and drops the register-specific achromatic
style pin on every page; the `fund-index-stet` remix (Stet, a pre-seed
fund in New York) composes from it.

Showcase `directory` sets the items out by rank: one column per item
`eyebrow` (a stylist's level, an office, a department; items without one
share an unheaded column), each entry a tall portrait over its name, its
specialties (`tags`, small between dots), its rate (`meta`) and one line
of availability (`description`), with filters built from the tags that
narrow every column at once while the columns stay put. The services
builder sets each lookbook item's optional `group` as its `eyebrow`.
`limestone` sells a private-suite hair atelier as a quiet stone room: the
`alcove` treatment keeps the full-bleed headline's authored line breaks,
arches every directory portrait like the suite's mirror inside a thin
stone border, turns the filter into a dotted line of words, sets the
stylists' names in italic, and closes on one centered sentence over a
squared button. The `services-hair-maren` remix (Maren Atelier, Dallas)
composes from this set.

Steps `horizontal-rail` takes an optional `duration` per step, set under
the step's title (the minutes a step of a service takes); a step with no
`label` is numbered on the rail. The services builder carries each build-log
step's optional `duration` and drops an empty `label`. `cognac` sells a
natural-hair and silk-press studio as a ritual room: an espresso ground,
cream ink, a cognac ask, a high-contrast display serif (Gloock) over a book
face (Spectral). The `ritual` treatment keeps the full-bleed headline's
authored line breaks, hangs every kicker between two long rules, turns the
rail into a numbered strip (the photograph, then a display numeral, the
step's name and its minutes, hairlines between the steps), centers the one
testimonial in italic between rules, sets the rates ticker as one still
dotted line, and closes on a squared plate with an arrow. The
`services-hair-sable` remix (Sable Atelier, Washington DC) composes from
this set.

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

| Preset          | Identity                                                                                                                                                                                                                                                                                                                                                        | Lean toward it for                                                                       |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `dark-dev`      | Near-black, one saturated accent, aurora wash + grain                                                                                                                                                                                                                                                                                                           | SaaS, dev tools, AI products                                                             |
| `soft-saas`     | Light, friendly, iridescent aurora wash, floating cards                                                                                                                                                                                                                                                                                                         | Consumer apps, approachable SaaS                                                         |
| `editorial`     | Paper-and-ink, serif display, rules over cards                                                                                                                                                                                                                                                                                                                  | Studios, portfolios, writing                                                             |
| `brutalist`     | Zero radius, double-weight ink rules, hard offset shadows                                                                                                                                                                                                                                                                                                       | Portfolios, statements, anti-slick                                                       |
| `warm-boutique` | Cream-and-terracotta warmth, sunlit wash, pill controls                                                                                                                                                                                                                                                                                                         | Cafés, salons, local businesses                                                          |
| `mono-utility`  | Monospace display, graph-paper ground, spec-sheet restraint                                                                                                                                                                                                                                                                                                     | Utilities, technical products                                                            |
| `aurora-dark`   | True-black, molten violet-cyan-pink ribbon, glass cards                                                                                                                                                                                                                                                                                                         | Flagship dark launches, AI, fintech                                                      |
| `luxe-light`    | Near-white, deep ink type, iridescent top band, crisp depth                                                                                                                                                                                                                                                                                                     | Polished fintech-grade SaaS, B2B                                                         |
| `atelier`       | Gallery-quiet: near-white walls, light tracked caps, hairlines, no wash — the photos carry all color                                                                                                                                                                                                                                                            | Photographers, visual portfolios, image-led sites                                        |
| `heirloom`      | Romantic stationery: Fraunces serif with an italic accent, warm ivory + champagne hairlines, botanical green, generous air                                                                                                                                                                                                                                      | Wedding/event studios, keepsake trades, family photographers                             |
| `sitework`      | The plan table: work paper ruled in a faint site-plan grid, stenciled uppercase display, safety-orange accent, jobsite grain                                                                                                                                                                                                                                    | Contractors, plumbers, electricians, the trades                                          |
| `marquee`       | The stage night: true black, plain white playbill caps (Fraunces heavy, uppercase), pushed grain — strictly monochrome, photographs are the only color                                                                                                                                                                                                          | Music photographers, venues, bands, tour sites                                           |
| `chalk`         | The training floor: near-black rubber ground, chalk-bone ink, stenciled uppercase signage, hairline rules, dust grain — strictly monochrome, photography carries all tone                                                                                                                                                                                       | Gyms, strength studios, fitness and wellness                                             |
| `hymnal`        | The midnight service: warm near-black ground under grain, monumental uppercase Space Grotesk, hairline rules, one candle-amber accent in the CTAs and a slow beam                                                                                                                                                                                               | Churches, congregations, community organizations                                         |
| `broadside`     | The gig poster: aged print paper under a halftone dot screen, ink hairline rules, monumental uppercase caps, one oxblood accent                                                                                                                                                                                                                                 | Bands, venues, tours, record releases                                                    |
| `crt`           | The phosphor terminal: pure-black tube, mono type, hairline rules, scanline raster + glow — accent-agnostic, the brand supplies the phosphor (green, amber…)                                                                                                                                                                                                    | Dev tools, terminals, retro-tech products                                                |
| `handheld`      | The pea-green LCD: LIGHT olive-on-sage four-shade ground, chunky mono uppercase, zero radius, dithered pixel wash                                                                                                                                                                                                                                               | Games, toys, playful retro products                                                      |
| `lounge`        | The night lounge: neutral #121212 ground, flat charcoal panels, pill-round shapes, one saturated accent glow                                                                                                                                                                                                                                                    | Music, entertainment, nightlife products                                                 |
| `retroware`     | The silver machine: bevel chrome, zero radius, outset-shadow dialogs, the page ground an accent-driven desktop wash (teal, navy, felt, toy red)                                                                                                                                                                                                                 | Retro-web, desktop-era, novelty sites                                                    |
| `tideline`      | The coastal timber house: fog-slate ground under sea-mist grain, bone Fraunces set thin at monumental scale, hairlines and squared corners, one lamplight-amber accent; full-bleed photographs dissolve into the ground (`mist`)                                                                                                                                | Custom builders, timber framers, woodshops, restoration trades                           |
| `memphis`       | The 90s Miami flyer: bright white and black ink, hot-pink accent with aqua and lemon spot inks, chunky italic caps under hard offset shadows, sparse confetti                                                                                                                                                                                                   | Cleaners, turnover crews, pop-up and party trades                                        |
| `jacaranda`     | The LA sign painter: warm cream ground under a faint brushed paint texture, purple ink, sign red and marigold, Luckiest Guy show-card caps with a Kaushan brush script, hand-cut borders under hard ink shades                                                                                                                                                  | Neighborhood trades, plumbers, van-lettered home services                                |
| `tabloid`       | The late edition: newsprint paper, condensed banner caps (Anton), serif column body, black column rules, fire-engine red, a halftone screen on the photographs                                                                                                                                                                                                  | Event photographers, nightlife, loud local brands                                        |
| `gameday`       | The sportswear drop: a striped-lawn ground, white condensed block caps leaning italic (Barlow Condensed), one volt accent as tape and plates, slanted CTAs (`sport`)                                                                                                                                                                                            | Lawn crews, sports trades, club and season-pass businesses                               |
| `creature`      | The creature-feature one-sheet: midnight ground, extruded poster caps (Bangers), acid green, blood orange and cream, lobby-card mounts under a dot screen (`pulp`)                                                                                                                                                                                              | Pest control, haunted and late-night trades, loud local brands                           |
| `riso`          | The riso poster: warm speckled paper, condensed Barlow caps, sage ink with one fluorescent-orange accent, photographs reprinted as a two-ink dot-screen plate pair (`two-ink`), line-cut plant ornaments in the gutters                                                                                                                                         | Landscapers, gardeners, nurseries, makers, local shops                                   |
| `paintchip`     | The paint deck: warm white, tight black Inter Tight caps, zero radius, 2px ink rules, hard offset CTAs, coral accent with teal and marigold spot inks; heroes bleed edge to edge (`colorblock`)                                                                                                                                                                 | Painters, color trades, loud local brands                                                |
| `schematic`     | The Detroit techno flyer as a wiring diagram: near-black ground on a faint grid, wide heavy Unbounded caps, electric cyan with one sodium-orange spark, thin white schematic line art, mono readouts                                                                                                                                                            | Electricians, audio and lighting techs, night-shift trades                               |
| `sunbelt`       | 70s desert modern: adobe cream, hot orange, sun yellow and terracotta pink with one ice blue, fat rounded Bagel Fat One display with a Sacramento script, pill controls, a rising sunburst                                                                                                                                                                      | HVAC, pool and solar trades, sun-belt home services                                      |
| `crown`         | The glossy cover: plum ground under grain, wide italic Archivo caps cast in chrome with a gold accent word, condensed cover lines, tangerine enamel CTAs with gold insets (`metallic`)                                                                                                                                                                          | Braid and natural-hair studios, barbers, loud beauty trades                              |
| `vanity`        | The beauty counter at night: true black, Bodoni Moda Didone at fashion scale, tiny Jost caps tracked wide, one lipstick accent with blush and plum hairlines (`lacquer`)                                                                                                                                                                                        | Makeup artists, lash and brow studios, glam beauty trades                                |
| `midcentury`    | The 1950s furniture catalog: warm off-white stock, condensed Oswald caps over geometric Jost, zero radius, thin rules, mustard with burnt-orange and olive spot inks, numbered strips, a sparing starburst (`atomic`)                                                                                                                                           | Interior designers, furniture and vintage dealers                                        |
| `photobooth`    | The photo-booth zine: newsprint cream under paper tooth, Permanent Marker caps in ink, hot pink and cobalt, typed mono body, a felt-tip swoosh under titles, label-maker tags, prints in paper borders (`zine`)                                                                                                                                                 | Weddings, engagements, birthdays — candid, unstaged parties                              |
| `disco`         | The 1970s disco supper club: black lacquer, lacquer red and hot pink with gold foil, Bodoni Moda caps with a Great Vibes script, foil rules, mirror-ball sparkle (`mirrorball`)                                                                                                                                                                                 | Milestone birthdays, anniversaries, galas, nightlife events                              |
| `wayfinding`    | The transit sign system: forest-green sign panels on off-white, signal-yellow rules, heavy Archivo caps, zero radius, circular pictograms and route-bar kickers (`transit`)                                                                                                                                                                                     | Doctors, clinics, civic and public-facing services                                       |
| `groove`        | The 70s soul-duet LP: cocoa ground under amber light and grain, cream Caprasimo caps on a stacked orange shadow, Newsreader italics, the record sleeve and tracklists (`sleeve`)                                                                                                                                                                                | Couples and family therapists, counselors, record-warm brands                            |
| `inkblot`       | The gallery poster: off-white wall, ultramarine ink, huge Cormorant caps with an italic accent, hairlines, plates printed into the wall and a museum wall label (`wall-label`)                                                                                                                                                                                  | Psychologists, counselors, galleries, quiet studios                                      |
| `bubblegum`     | Y2K candy pop: bubblegum pink with mint and cherry, gradient-filled Modak caps on a candy drop, Outfit body, a Yellowtail script, die-cut stickers, glossy pills, jelly buttons (`candy`)                                                                                                                                                                       | Dentists, nail bars, froyo, kids' salons                                                 |
| `snapshot`      | The fridge door: cream paper, condensed grotesk caps (Archivo) with a marker script (Gochi Hand), tomato-red accent, white-bordered prints under masking tape at small leans (`taped`)                                                                                                                                                                          | Family and documentary photographers, kids' and home trades                              |
| `rodeo`         | The Western show bill: sun-faded paper, wood-type caps (Rye) over a slab serif (Bitter), saddle brown, burnt orange and turquoise, a rope frame around the page, stars for bullets (`lariat`)                                                                                                                                                                   | Family reunions, ranch and Western events, desert getaways                               |
| `plantroom`     | The estate plant room: graphite ground, copper accent with brass and steel-teal spot inks, Sofia Sans Condensed caps over Sofia Sans with mono tags, square instrument plates between copper rules (`gauge`)                                                                                                                                                    | Estate mechanical, boiler and systems contractors                                        |
| `stormline`     | The storm desk: cool ground, harbor-navy plates, one safety-amber signal, heavy Schibsted Grotesk over Public Sans, a navy dispatch board and a frosted intake card (`dispatch`)                                                                                                                                                                                | Restoration, storm and 24/7 dispatch trades                                              |
| `plaster`       | The garden notebook: warm plaster ground, olive ink, Sorts Mill Goudy with its italic over Karla, ruled journal cards and an engraved olive sprig (`journal`)                                                                                                                                                                                                   | Garden studios, estate landscapes, slow seasonal trades                                  |
| `basalt`        | The tea garden at dusk: basalt-dark ground, light Red Hat Display widely spaced, one vermilion seal, frames that dissolve into mist and a numbered walk (`stillness`)                                                                                                                                                                                           | Japanese gardens, stone and moss work, quiet studios                                     |
| `whiteglove`    | The pressed-linen house: pure white, black Urbanist over DM Sans, sage kickers, square black asks with an arrow, hairline correspondence cards (`concierge`)                                                                                                                                                                                                    | White-glove housekeeping, estate and house management                                    |
| `palmbeach`     | The Palm Beach club: flamingo-pink ground, palm-green ink and gold rules, Libre Caslon over Libre Franklin, green pills, a bamboo frame around the page (`cabana`)                                                                                                                                                                                              | Resort pool service, club and coastal estate trades                                      |
| `daybook`       | The wedding morning's album: white stock, a light grotesk (Hanken Grotesk) with a handwritten script (Ms Madi), dusty rose and sage, an hour-by-hour photographic timeline, a heart rule (`keepsake`)                                                                                                                                                           | On-location bridal hair & makeup, wedding-day services                                   |
| `jharokha`      | The jewel box: emerald velvet, ivory-gold ink, a Devanagari-born display serif (Rozha One) over carved capitals (Marcellus), arched event windows, gold filigree (`filigree`)                                                                                                                                                                                   | South Asian bridal studios, mehndi artists, multi-day celebrations                       |
| `horizon`       | The coastal masthead: white stock, graphite ink, the widest Lexend (Giga) set light in tracked caps over its Deca text width, the photograph as a panorama under ruled lines (`panorama`)                                                                                                                                                                       | Luxury residential builders, architects, coastal developers                              |
| `shingle`       | The engraved quarterly: ivory laid stock, navy ink, Caslon at display size (Libre Caslon Display) over its text cut with a true italic, a crowned crest and fleurons (`engraved`)                                                                                                                                                                               | Estate builders, restorers, furniture makers, heirloom trades                            |
| `cognac`        | The ritual room: espresso ground, cream ink, a cognac ask, a high-contrast display serif (Gloock) over a book face (Spectral), a numbered ritual strip between long rules (`ritual`)                                                                                                                                                                            | Natural-hair and silk-press studios, spas, barbers, ritual services                      |
| `limestone`     | The private atelier: warm limestone stock, umber ink, a taupe ask, a Didone (Libre Bodoni) over an old-style book face (Crimson Pro), arched portraits in a stone border (`alcove`)                                                                                                                                                                             | Salons, ateliers, private practices, quiet-room services                                 |
| `vitrine`       | The museum label: stone-grey walls, small EB Garamond set quiet, hairline rules, zero radius, near-black ink — the photographs carry every other tone                                                                                                                                                                                                           | Portrait photographers, fine-art and gallery portfolios                                  |
| `seamless`      | The studio seamless: all-white ground, small Inter Tight grotesque over Inter, near-black ink, no decoration — the colored backdrops in the photos are the color                                                                                                                                                                                                | Headshot and commercial studios, clean product portfolios                                |
| `liner`         | The liner notes: near-black sleeve (warm white in light), small Barlow grotesque, paper ink, no decoration — the covers carry the color                                                                                                                                                                                                                         | Music, album-art and press photographers, record labels                                  |
| `seafog`        | Sea fog: grey-blue coastal mist, a light Cormorant with a small Jost, hairlines, square corners — the photographs carry the coast                                                                                                                                                                                                                               | Coastal and destination weddings, quiet event sites                                      |
| `harvest`       | Orchard harvest: forest-green stock and ivory ink (ivory in light), a light Newsreader, hairlines — caption bands read as green ribbons                                                                                                                                                                                                                         | Farm and orchard weddings, autumn events                                                 |
| `carton`        | The faire-part: cornflower ink on warm paper, an enormous hairline Bodoni Moda, ink hairlines ruling the column — no photograph needed                                                                                                                                                                                                                          | Type-only wedding sites, invitations, announcements                                      |
| `parlor`        | The Southern parlor in daylight: magnolia blush and walnut, Baskervville with an italic last line over Mulish, gilt rules ending in a lozenge, arched portraits, framed photographs, a magnolia sprig (`gilt`)                                                                                                                                                  | Concierge physicians, private practices, quiet hospitality                               |
| `trailhead`     | The trail journal: oat paper, pine ink, Young Serif's rounded book-face over Literata, pencil trail maps and a contour footer, aspen gold and sage used small, soft pills (`fieldbook`)                                                                                                                                                                         | Walk-and-talk therapists, outfitters, nature schools                                     |
| `hearth`        | The collective's lounge: warm cream, plum, sienna and ochre, Gloock's bold display serif over Figtree, a woven textile edge, forest and sienna bands, a plum footer (`weave`)                                                                                                                                                                                   | Therapy collectives, community clinics, salons and studios with a roster                 |
| `colophon`      | The university press: cream paper and oxblood ink, Spectral with its drawn small capitals as the third voice, a printer's star, a sample report on paper with numbered margin notes, ruled columns (`marginalia`)                                                                                                                                               | Assessment practices, tutors and learning specialists, law and archives                  |
| `boreal`        | A Minnesota winter indoors: winter white and slate, Commissioner set light, a frost-washed photo hero with slate copy, a quiet first-90-days track ending in one peach node, white cards (`frost`)                                                                                                                                                              | Psychiatry and medication management, sleep clinics, telehealth practices                |
| `terrazzo`      | The lakeside studio: white terrazzo flecked terracotta and lake blue, medium Figtree over Plus Jakarta Sans, soft stone corners, lake-blue kickers, before/after plates with month tabs, a pictogram rail in one panel (`terrazzo`)                                                                                                                             | Orthodontists, dental and skin studios, design-led clinics                               |
| `picturebook`   | The storybook first visit: paper white, leaf green and marigold, a soft rounded serif (Fraunces at SOFT 100) over Nunito, illustrated steps as numbered book pages under a leaf-sprig heading, a ruled strip of facts, leaf-green pills (`picturebook`)                                                                                                         | Pediatric dentists and doctors, kids' classes, children's bookshops                      |
| `seaglass`      | The ocean-view practice: sea glass and sand, a narrow modern serif (Instrument Serif, true italic) over Instrument Sans, rule-flanked terracotta kickers, stage cards under arched photographs with an emblem and a short list, round portrait medallions, terracotta pills (`seaglass`)                                                                        | OB/GYN and women's health, midwives, fertility and wellness clinics                      |
| `limone`        | The Italian coast on film: chalk white and lemon, a hairline display face (Italiana) over Tenor Sans, a centered wide-capital wordmark masthead, hero copy small over the photograph, captioned full-bleed stacks in small caps, contact sheets on a chalk mat, collections as ruled columns, square corners (`limone`)                                         | Destination wedding photographers, film photographers, coastal hotels and villas         |
| `alpine`        | The expedition field sheet: glacier white and granite with one magenta accent, a wide heavy grotesque wordmark (Anybody) over Albert Sans with DM Mono legends, the hero line low and left, captioned full-bleed stacks as survey slates (place, season, coordinates), places as ruled spec cards, packages as granite-ruled columns, square corners (`alpine`) | Adventure elopement photographers, mountain guides, outfitters and lodges                |
| `milkglass`     | The daylight newborn studio: milk white and sage, a thin book serif (Spectral) over light Work Sans, the name in thin spaced capitals, the hero line low on a full-bleed window photograph, the session builder as soft photograph tiles beside a summary card with the total in the serif (`milkglass`)                                                        | Newborn and motherhood photographers, doulas, lactation and postpartum studios           |
| `darkroom`      | The portrait studio after dark: charcoal and silver, an old-style book serif (Crimson Pro) with engraved capitals (Cinzel) for the name, kickers and the ask, the specimens board as matted museum prints two to a row with the process, note and price engraved on a ruled plaque, and a hairline-boxed ask                                                    | Heritage portrait studios, darkroom printers, film and alternative-process photographers |
| `buttercream`   | The picnic blanket: buttercream ground, cocoa ink, Fraunces at its softest set large over Figtree, square frames, no shadow — a stack of photographs with type between them (`framestack`)                                                                                                                                                                      | First birthdays, baby showers, garden and daytime parties                                |
| `vineyard`      | The harbor at dusk: deep navy ground, warm-white ink, Baskervville over Caslon's text cut, hairline rules, no shadow — the family dinner's stack of photographs and its memory book (`framestack`)                                                                                                                                                              | Milestone birthdays, anniversaries, retirements, reunion suppers                         |
| `limewash`      | Lime plaster in daylight: bone ground, umber ink, burnt clay, Castoro over Spectral, square corners — rooms at one size, each captioned inside its photograph (`framestack`, `roomline`)                                                                                                                                                                        | Plaster and limewash studios, decorative painters                                        |
| `miradouro`     | Lisbon at the last light: limestone ivory ground, espresso ink, bordeaux accent, Noto Serif Display at its lightest over Manrope, square corners — the headline's last line in italic, the diary at one size edge to edge with italic captions, small-caps kickers on a short rule, portrait covers, a colophon close (`framestack`, `miradouro`)               | Fashion, lifestyle and travel creators, stylists, boutique hotels                        |
| `galley`        | A ship's galley in print: oyster-shell white, cast-iron ink, one deep kelp green, Besley's Clarendon over IBM Plex Sans with Plex Mono as the ticket voice, brass and oyster-grey spots, square corners, hairline rules — the cook full-bleed at the pass, the kitchens on a photographic timeline, the work as press clippings (`galley`)                      | Chefs, bakers, sommeliers, makers and trades whose résumé is their work, photographed    |
| `sprocket`      | South London on film: concrete off-white, near-black ink, one Klein blue, Bricolage Grotesque condensed and heavy over Geist with Geist Mono labels, square corners, hard ink rules — the name as a one-line masthead across the photograph, the week's roll as a contact sheet in amber grease pencil, numbered plates, a solid blue band (`sprocket`)         | Streetwear, skate, music and film creators, photographers, zine makers                   |
| `galleyproof`   | The galley proof: bone proof paper, carbon ink, one proof red, Redaction 35 (a roman degraded like a photocopy) over Martian Mono, square corners, no motion, no photography — one line at poster scale, names as a comma-run (`proofmark`)                                                                                                                     | One-line fund sites, manifestos, studios whose statement is the page                     |
| `schist`        | The drafting room: gallery white, near-black ink as the accent, one vermilion for the numerals, Geist Light over Geist with Geist Mono labels, square corners — the architect's monograph: plates, a feature, the index of works (`framestack`, `monograph`)                                                                                                    | Architects, design-build studios, practices published by the project                     |
| `baylight`      | Marine light: fog-pale ground, spruce ink, sound-green accent, Noto Serif Display Light over Be Vietnam Pro, square corners — listings as waterfront plates, each address and its particulars inside its photograph (`framestack`, `soundings`)                                                                                                                 | Waterfront and view-home brokers, coastal agents                                         |
| `fogline`       | The clinic in the fog: white ground, plum ink, dusty rose, a narrow Instrument Serif over Instrument Sans, no shadow — dark ink over a pale photograph, the numbers as a report (`framestack`, `inkover`)                                                                                                                                                       | Fertility clinics, practices that publish outcomes                                       |
| `adobe`         | The birth house in the valley: adobe plaster ground, clay ink, Alegreya over Alegreya Sans, soft corners, no shadow — photographs between olive and fired-clay bands (`framestack`, `tintbands`)                                                                                                                                                                | Birth centers, midwives, retreats, small hospitality                                     |

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
  you want to pop), `first-word` (editorial open), `full-stop` (only the
  closing punctuation takes the color — a catalog full stop; with no
  closing punctuation the headline stays bare), `last-line` (the whole
  line after the headline's line break — a show bill's shout, "The
  Calloways / ride again."), or `none` (pure typography — brutalist and
  spec-sheet registers read cleaner bare). Each
  preset ships its own lean (`LANDING_DIRECTIONS` in blueprints.ts); an
  explicit `accent` on the hero content overrides it.
- **FAQ answers real objections** (cost, cancellation, security, setup
  effort) — never "what is your product?"; the page already answered that.

### Blueprints by business type

Chrome (shell nav + footer) wraps every stack automatically; the stacks
below are body sections only.

| Business                           | Section stack                                                                                                                                                                                                                                                                                                                                 | Preset lean                |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| SaaS / app                         | hero (`panel-collage`), social-proof (`marquee`), feature-grid (`bento`), highlights, testimonials, pricing, faq, cta-banner                                                                                                                                                                                                                  | `luxe-light` / `dark-dev`  |
| Local business                     | hero (`split-media`), showcase (menu/services), social-proof (`metrics-row`), faq, lead-form (`contact-block`)                                                                                                                                                                                                                                | `warm-boutique`            |
| Trades / contractor                | hero (`split-media`), card-grid (services), gallery (`before-after`), social-proof (`metrics-row`), testimonials, cta-banner                                                                                                                                                                                                                  | `sitework`                 |
| Custom builder / fine trades       | hero (`full-bleed-media`, credit + caption), social-proof (`ticker`), steps (`horizontal-rail`), showcase (`specimens`), card-grid (services), testimonials (`single-featured`), cta-banner                                                                                                                                                   | `tideline`                 |
| Portfolio / studio                 | hero (`statement`), showcase (`filterable-grid`), steps, faq, lead-form (`contact-block`)                                                                                                                                                                                                                                                     | `editorial` or `brutalist` |
| Photographer / visual portfolio    | hero (`full-bleed-media`), gallery (`justified`, lightbox), showcase (`collections`), content-split (about), lead-form (`detail-form`)                                                                                                                                                                                                        | `atelier`                  |
| Pre-launch / waitlist              | hero (`form-first`), feature-grid, faq                                                                                                                                                                                                                                                                                                        | any                        |
| Cleaning / turnover crew           | hero (`split-media` + badge), pricing (`tiers`), steps (`horizontal-rail`), feature-grid (`checklist`), testimonials, cta-banner                                                                                                                                                                                                              | `memphis`                  |
| Lawn care crew                     | hero (`full-bleed-media` + badge, credit), pricing (`tickets`), steps (`horizontal-rail`, the season), feature-grid (`checklist`), testimonials (`single-featured`), cta-banner                                                                                                                                                               | `gameday`                  |
| Pest control                       | hero (`masthead-overlay` + badge, credit), showcase (`specimens`), pricing (`tiers`), steps (`horizontal-rail`), feature-grid (`checklist`), testimonials, cta-banner                                                                                                                                                                         | `creature`                 |
| Landscaper / native plants         | hero (`full-bleed-media`, credit + caption), showcase (`specimens`), social-proof (`ticker`), steps (`horizontal-rail`), card-grid (services), gallery (`before-after`), cta-banner                                                                                                                                                           | `riso`                     |
| House painter / color trade        | hero (`split-media` + credit), showcase (`swatches`), card-grid (services), gallery (`before-after`), testimonials (`single-featured`), cta-banner                                                                                                                                                                                            | `paintchip`                |
| Portrait / headshot photographer   | gallery (`sequence` + `captionStack` `band-*`, fullBleed, lightbox), cta-banner (`colophon`)                                                                                                                                                                                                                                                  | `vitrine`, `seamless`      |
| Music / album-art photographer     | gallery (`sequence` + `captionStack` `band-start`, one frame), gallery (`covers`, lightbox), cta-banner (`colophon`)                                                                                                                                                                                                                          | `liner`                    |
| Wedding website (coastal story)    | hero (`full-bleed-media` + badge, `accent: "none"`), highlights (`stacked`), rich-prose (`narrow`, the weekend lines), cta-banner (`colophon`)                                                                                                                                                                                                | `seafog`                   |
| Wedding website (photo stack)      | hero (`full-bleed-media` + badge), gallery (`sequence` + `captionStack` `band-center`, fullBleed), cta-banner (`colophon`)                                                                                                                                                                                                                    | `harvest`                  |
| Wedding website (type only)        | hero (`statement` + badge, `accent: "none"`), rich-prose (`narrow`) ×3, cta-banner (`colophon`, `align: "start"`)                                                                                                                                                                                                                             | `carton`                   |
| Party (full-bleed stack)           | hero (`full-bleed-media`, date line, no ask), rich-prose (`narrow`, a short band), gallery (`sequence` + `captionStack` `band-center`), testimonials (a memory book), cta-banner (`colophon`)                                                                                                                                                 |
| Birth center (full-bleed stack)    | hero (`full-bleed-media`, no ask), rich-prose (`narrow`, one band line), gallery (`sequence` + `captionStack` `band-center`), cta-banner (`colophon`) — `tintbands` paints the bands                                                                                                                                                          |
| Fertility clinic (report stack)    | hero (`full-bleed-media`, no ask, ink over a pale photograph), stats (`bars`, the outcomes report + sample-data note), cta-banner (`colophon`, prices over the consultation ask)                                                                                                                                                              |
| Plaster studio (room stack)        | hero (`full-bleed-media`, the headline as the first room's line, no ask), gallery (`sequence` + `captionStack` `overlay-start`), cta-banner (`colophon`, `align: "start"`) — `roomline` writes the lines in                                                                                                                                   |                            |
| Fashion creator (diary stack)      | hero (`full-bleed-media`, `accent: "last-line"`, credit), gallery (`sequence` + `captionStack` `overlay-start`), showcase (`media-rail`), showcase (`collections`), card-grid, social-proof (`metrics-row`), testimonials (`single-featured`), cta-banner (`colophon`)                                                                        | `miradouro`                |
| Photographic résumé (chef)         | hero (`full-bleed-media`, badge, computed line), rich-prose (`narrow`), steps (`timeline`, photographic, year labels), stats (`row`), card-grid (`4up`), showcase (`stories`), card-grid (`2up`), lead-form (`contact-block`)                                                                                                                 | `galley`                   |
| Film creator (roll home)           | hero (`masthead-overlay`, the name on one line, credit), gallery (`contact-sheet`, `edgeCode`, `firstFrame`, marks and notes), showcase (`specimens`), showcase (`collections`), card-grid, social-proof (`metrics-row`), testimonials (`quote-grid`), cta-banner (`full-bleed`)                                                              | `sprocket`                 |
| Waterfront broker (plates)         | hero (`full-bleed-media`, market-pulse badge, both asks), gallery (`sequence` + `captionStack` `overlay-start`, each `detail` the place, price, status), social-proof (`metrics-row`), content-split, showcase (`collections`), testimonials, cta-banner (`colophon`)                                                                         | `baylight`                 |
| Architect (monograph)              | hero (`full-bleed-media`, the plate over the copy, `mediaCaption`, both asks), gallery (`sequence` + `captionStack` `band-start`, each `detail` the place, year, scope), content-split (`feature`), showcase (`card-grid`, no photographs: the index), testimonials (`single-featured`), social-proof (`text-logos`), cta-banner (`colophon`) | `schist`                   |
| One-line fund                      | hero (`statement` + badge, `full-stop`, the pitch as the subheadline, no ask), social-proof (`text-logos`, the portfolio run on), cta-banner (`colophon`, `align: "start"`)                                                                                                                                                                   | `galley`                   |
| Family photographer                | hero (`pinboard` + seal, credit), gallery (`scrapbook`), showcase (`collections`), pricing (`tiers`), steps (`horizontal-rail`), feature-grid (`checklist`), testimonials, cta-banner                                                                                                                                                         | `snapshot`                 |
| Family reunion / gathering         | hero (`split-media` + badge, seal, credit), steps (`horizontal-rail`), schedule (`day-rows`), content-split, stats (`cards`), card-grid, feature-grid (`checklist`), gallery (`scrapbook`)                                                                                                                                                    | `rodeo`                    |
| Bridal hair & makeup (on location) | hero (`full-bleed-media`, credit), steps (`timeline`, photographic), social-proof (`ticker`, `text-logos`), cta-banner                                                                                                                                                                                                                        | `daybook`                  |
| South Asian bridal studio          | hero (`panel-collage` + panels), pricing (`builder`), showcase (`collections`), steps (`horizontal-rail`), testimonials (`single-featured`), cta-banner                                                                                                                                                                                       | `jharokha`                 |
| Luxury coastal builder             | hero (`masthead-overlay`), showcase (`media-rail`), social-proof (`metrics-row`), content-split (`media-left`), cta-banner                                                                                                                                                                                                                    | `horizon`                  |
| Estate builder (long-form feature) | hero (`full-bleed-media` + badge), content-split (`feature`), social-proof (`text-logos`), cta-banner                                                                                                                                                                                                                                         | `shingle`                  |
| Private-suite hair atelier         | hero (`full-bleed-media`), showcase (`directory`), cta-banner                                                                                                                                                                                                                                                                                 | `limestone`                |
| Silk press / natural-hair studio   | hero (`full-bleed-media`), steps (`horizontal-rail` + durations), testimonials (`single-featured`), social-proof (`ticker`), cta-banner                                                                                                                                                                                                       | `cognac`                   |
| Direct primary care / clinic       | hero (`split-media` + badge, `directory` aside, credit), feature-grid (`icon-list`), pricing (`price-list`), logos (coverage), content-split, team (`portraits`), testimonials, faq, cta-banner                                                                                                                                               | `wayfinding`               |
| Couples / family therapist         | hero (`split-media` + badge, `directory` aside as a tracklist, seal), card-grid (services), pricing (`price-list` as Side A / Side B), content-split, team (`portraits`), testimonials, faq, cta-banner                                                                                                                                       | `groove`                   |
| Psychologist                       | hero (`split-media`, `directory` aside as the wall label, `mediaCaption`), showcase (`card-grid`, plates), pricing (`price-list`), content-split, team (`portraits`), testimonials, faq, cta-banner                                                                                                                                           | `inkblot`                  |
| Dental office                      | hero (`split-media` + badge, `directory` aside as stickers, seal, credit), feature-grid (`icon-list`), pricing (`price-list`), logos (insurers as text), content-split, team (`portraits`), testimonials, faq, cta-banner                                                                                                                     | `bubblegum`                |
| Concierge primary care             | hero (`full-bleed-media`, credit), feature-grid (`icon-list`), steps (`timeline`, photographic — the first year), pricing (`price-list`), logos (coverage as text), team (`portraits`), testimonials, faq, content-split, cta-banner                                                                                                          | `parlor`                   |
| Walk-and-talk therapist            | hero (`full-bleed-media`, credit), feature-grid (`icon-list`), showcase (`stories`, field notes), pricing (`price-list`), logos (paying as text), team (`portraits`), testimonials, faq, content-split, cta-banner                                                                                                                            | `trailhead`                |
| Therapy collective                 | hero (`full-bleed-media`, credit, `last-line` accent), feature-grid (`icon-list`), showcase (`filterable-grid`, the therapist directory), steps (`numbered-cards`, how matching works), pricing (`price-list`), logos (paying as text), testimonials, faq, content-split, cta-banner                                                          | `hearth`                   |
| Neuropsychology practice           | hero (`full-bleed-media`, credit), content-split (`report`, the annotated sample report), steps (`numbered-cards`, testing day to report), pricing (`price-list`), logos (paying as text), team (`portraits`), testimonials, faq, content-split, cta-banner                                                                                   | `colophon`                 |
| Psychiatry practice                | hero (`full-bleed-media`, credit), steps (`horizontal-rail`, the first 90 days), pricing (`price-list`), logos (paying as text), content-split (`media-right`, conditions as text), team (`portraits`), testimonials, faq, content-split, cta-banner                                                                                          | `boreal`                   |
| Braid / natural hair studio        | hero (`masthead-overlay` + badge, credit, `coverLines`), social-proof (`ticker`, the price strip), pricing (`price-list`), showcase (`specimens`), gallery (`before-after`), feature-grid (`checklist`), testimonials (`single-featured`), cta-banner                                                                                         | `crown`                    |
| Makeup artist                      | hero (`full-bleed-media`, credit), showcase (`swatches` with texture chips), social-proof (`ticker`), showcase (`filterable-grid`), steps (`horizontal-rail`), pricing (`price-list`), feature-grid (`checklist`), cta-banner                                                                                                                 | `vanity`                   |

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
