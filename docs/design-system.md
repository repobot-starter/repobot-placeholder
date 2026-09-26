# Design System

Location: `web/design-system/`. Layers: `src/primitives/` (Radix-based building blocks) → `src/components/` (AppShell, UiQueryView, modals, states). Domain code never lives here — pages belong in `web/app`.

## Styling

- vanilla-extract only. Every component has a sibling `X.styles.css.ts` exporting class names.
- All values come from the theme contract (`web/design-system/src/theme/`): semantic color tokens, spacing, radius, type scale, with light/dark themes as CSS variables. Never hardcode a color or pixel value.
- Interactive behavior (dialogs, selects, menus, tabs) comes from Radix primitives skinned with our tokens — keyboard and ARIA correctness is inherited, don't rebuild it.

### Writing `.styles.css.ts` files (rules that trip people up)

- In app code (`web/app`, including `Theme/overrides/`), import tokens from
  the package: `import { vars } from "@base/design-system"`. Only files
  INSIDE `web/design-system/src/` use the relative `../theme/tokens.css`.
  Never import styles from `@ui` — it exists for components, and overrides
  imported through it become circular.
- `style()` selectors must target the class itself: `&:hover`,
  `&[data-x]`, `.other &`. Element descendants (`& strong`, `& svg`) are
  rejected by vanilla-extract — use
  `globalStyle(\`${myClass} svg\`, { … })` for those.
- `globalStyle()` takes ONE selector string and a plain style object — no
  `selectors`/`@media` nesting inside it; wrap media queries outside:
  `globalStyle` supports `@media` at its top level only.
- Every top-level export in the file shares one namespace: a `const brand`
  helper and an exported `brand` style can't coexist — name helpers
  differently.
- Dark mode comes from the theme contract (`vars.*` flip automatically);
  reach for `@media (prefers-color-scheme: …)` only for art-directed values
  the contract can't express.

## Theming

The whole design system derives its token values from the root
**`repobot.theme.json`** contract: `brand.primary` / `brand.primaryDark`
(accent hexes), `radius` (`sharp` | `soft` | `round`), `density`
(`compact` | `comfortable` | `spacious`), `fontFamily` (preset key or raw CSS
stack), `displayFontFamily` (headline stack for the auth panel and other
display moments — defaults to Manrope, following a serif/mono body choice
instead so deliberate identities carry through), `mode` (`light` | `dark` |
`system`, the default UI mode), `motion` (`smooth` | `snappy` | `instant` —
the transition clock; `instant` zeroes durations for retro/terminal
identities), `character` (below), and the optional `palette` block below.

The contract's **`character`** field is the app-side sibling of the
marketing presets: an art-direction layer over the flat palette that sets
the surface treatments — page and brand-panel washes, the floating-surface
elevation recipe, the focus-ring treatment (resolved into `vars.treatment`,
consumed by AuthShell, AppShell, Dialog, AuthCard, and the input focus
rings):

- `plain` — no washes, the pre-character kernel look. The default.
- `soft` — gentle accent blooms, soft two-layer elevation. Pairs with
  `soft-saas` / `warm-boutique` marketing sites.
- `aurora` — iridescent accent-violet-pink blooms, glassier elevation, glow
  focus rings. Pairs with `dark-dev` / `aurora-dark`.
- `luxe` — clean ground, one iridescent band grazing panel tops, crisp
  two-layer elevation, precise focus rings. Pairs with `luxe-light` /
  `editorial`.

Pick the character alongside the marketing preset so the public site and
the signed-in app read as one product; preview every character live at
`/theme/app`.

The contract's **`navigation` block** sets the marketing-site nav treatment:
`navigation.variant` (default `full-width` — the flush, edge-to-edge band)
picks the `MarketingShell` nav design for every marketing page whose config
doesn't set one explicitly — `inline` | `centered` | `burger-overlay` |
`full-width` | `split` | `pill-links` | `logo-only`. See `docs/landing.md`
"Page chrome" for what each looks like and when to pick which; vary it
between projects.

The contract's **`shell` block** does the same for the signed-in dashboard
chrome: `shell.variant` (default `sidebar`) picks the `AppShell` layout —
`sidebar` | `top-nav` | `minimal` | `sidebar-inset` | `sidebar-topbar` |
`sidebar-only` | `logo-rail` — and `shell.content` (default `full`) sets the
page-content relationship (`full` | `centered` | `flush`). See
`docs/shell.md` "Shell variants" for what each looks like and when to pick
which; vary it between projects.

The contract's **`ui` block** sets the app-chrome presets — how tables,
forms, errors, and loaders present app-wide (resolved into `uiConfig`, which
components read as their defaults; per-instance props override):

- `ui.table.style`: `minimalist` (hairlines, no chrome) | `standard`
  (bordered card) | `detailed` (dense rows, sticky header, column dividers,
  and the column manager / CSV export / focus mode on by default).
- `ui.table.pagination`: `loadMore` (append via a button) | `pages`
  (previous/next with a page counter).
- `ui.forms.presentation`: `modal` (centered dialog) | `inline` (an in-flow
  card on the page, above/beside the content it feeds) | `page`
  (full-viewport with a close X upper left); `ui.forms.width`: `skinny` |
  `normal` | `wide`. Individual views override the project default through
  `UiQueryViewFormModal`'s `presentation`/`width` props — a big ship-order
  flow takes `page` while the same app's quick-add stays a `modal`.
- `ui.errors.presentation`: `modal` (centered stacking dialog with prev/next
  paging) | `corner` (bottom-right stack).
- `ui.loaders.style`: `gate` (one page-level spinner, then everything at
  once) | `progressive` (layout immediately, regions skeleton themselves).

The contract's **`palette` block** carries the full surface identity — the
token vocabulary the platform dashboard's design system proves out (its
appearance themes reach a Windows-95 mode with zero component forks). Every
entry is optional, a light value with an optional `<name>Dark` override:

- Colors (hex or `rgb()`/`rgba()`): `background` (page bg), `surface` (cards),
  `surfaceHover` (hover wash), `ring` (input focus halo — defaults to
  `surfaceHover`, its pre-palette source), `muted` (muted _surface_ — badge
  and quiet-fill backgrounds; defaults to `surfaceHover`, distinct from
  `textSecondary` the muted _text_), `input` (form-control border —
  defaults to `border`, its pre-token source), `border`, `textPrimary`,
  `textSecondary` (muted), `accentText` (text on solid accent fills —
  defaults to the luminance contrast of `brand.primary`), `danger` +
  `dangerSurface`, `success` + `successSurface`, `warning` +
  `warningSurface`, `info` + `infoSurface` (badge tones), `overlay` (modal
  backdrop), `skeleton`.
- `nav` sub-block (the sidebar's own surface family, for dark-charcoal
  sidebars on light apps): `bg`, `text` (item hover/strong text), `muted`
  (item text), `hover` (item hover wash), `border`, `ring` (item focus
  outline) — each with an optional `<field>Dark` twin. Fields left unset
  derive from `nav.bg`'s luminance the way the shell always derived them
  (strong text = the bg's contrast color; muted/hover/border = blends of
  bg and strong text); with no `nav.bg` at all the whole set derives from
  the resolved surface colors exactly as before. The active item always
  derives from the brand accent, washed over the nav bg.
- `charts` / `chartsDark`: an array of 5–6 series colors for the chart
  tokens (`--chart-1..6`; a 5-color palette cycles into the 6th slot).
  Default: the accent-derived monochromatic ramp the chart components
  mixed at runtime — branding the accent still rebrands the charts.
  Without `chartsDark`, each light entry blends 88% toward the dark
  theme's own ramp slot.
- Shadows (`shadowSm` / `shadowMd` / `shadowLg` / `shadowXl`): free-form CSS
  box-shadow strings, shape-validated but never enumerated — hard inset
  strokes (`"inset -1px -1px 0 #808080, inset 1px 1px 0 #ffffff"`), offset
  stickers, `color-mix()` glows, and `"none"` are all valid. A shadow carries
  its own color, so a custom light shadow inherits into dark unchanged;
  `shadow<Size>Dark` overrides when dark needs distinct elevation.
- The accent stays with `brand.primary` / `brand.primaryDark` (they derive
  hover/on-accent text); `palette.accent` is rejected with a warning.

Dark derivation when a `Dark` override is absent: a hex light value blends
88% toward the kernel dark counterpart (the dark theme keeps its luminance
structure and picks up ~12% of the brand's hue); an `rgba()` light value
can't blend, so the kernel dark value stands. Shell navigation re-derives
from the resolved colors, so `surface`/`surfaceHover` restyle the sidebar
automatically — unless `palette.nav` takes the sidebar over. Invalid values
warn at build time and fall back, like every other contract field — and
with no `palette` block the derived CSS custom properties are
byte-identical to the pre-palette kernel (pinned by
`web/app/tests/Theme/themePalette.test.ts`).

```json
"palette": {
    "background": "#e7f2ef",
    "surface": "#faf7f2",
    "border": "#cfe0da",
    "textPrimary": "#1f2d2a",
    "textSecondary": "#5d726d",
    "ring": "rgba(53, 143, 130, 0.28)",
    "nav": { "bg": "#21312d", "muted": "#9db8b1" },
    "charts": ["#358f82", "#4f8ac6", "#51b67a", "#eba941", "#9470cd"],
    "shadowMd": "0 8px 24px rgba(31, 45, 42, 0.12)"
}
```

`fontFamily` presets: `system`, `serif`, `rounded`, `mono` map to platform
font stacks; `inter`, `manrope`, `source-serif`, `space-grotesk`, `plex-mono`
are self-hosted web fonts (`web/app/public/fonts` + `web/app/src/fonts.css`)
with matching TTFs bundled natively (`ios/App/Fonts`, `android res/font`), so
the same preset renders the same family on all three platforms. Raw CSS
stacks apply on web only — native falls back to the system font.

### Importing a reference app's theme

When the project rebuilds an existing Lovable/shadcn app, don't hand-pick
tokens — import them. The whole visual identity of those apps lives in ~25
CSS custom properties in one stylesheet:

```bash
node scripts/import-theme.mjs path/to/their/styles.css          # dry run: mapping report + fragment
node scripts/import-theme.mjs path/to/their/styles.css --write  # merge into repobot.theme.json
```

The importer reads `:root` (and the `.dark` block, shadcn's dark-mode
convention; `--dark none|<file>` overrides), understands the HSL-triplet
convention (`--primary: 174 42% 34%;`), hex/rgb/hsl literals, and oklch, and
maps onto the contract: `--primary` → `brand.primary`, `--background` →
`palette.background`, `--card`/`--popover` → `palette.surface`, `--accent` →
`palette.surfaceHover` (only when it genuinely differs from `--primary`),
`--border`/`--foreground`/`--muted-foreground`/`--muted`/`--input`/`--ring`/
`--destructive`/`--success`/`--warning`/`--info`/`--primary-foreground` →
their palette twins, the `--sidebar-*`/`--nav-*` families → `palette.nav`,
`--chart-1..5` → `palette.charts`, `--radius` → the nearest radius preset,
`--font-sans` → the nearest font preset. The report shows every source var's
fate — mapped, skipped, or "no contract field — dropped" — so gaps stay
visible, and emitted values are validated against the contract's own rules
before they reach the file. `--write` preserves non-theme fields (`density`,
`mode`, `navigation`, `shell`, `ui`) and palette keys the import didn't
produce (hand-tuned shadows survive a re-import).

- `web/design-system/src/theme/themeConfig.ts` resolves the contract at build
  time — hover shades, on-accent text color, and the dark-theme accent derive
  from `brand.primary` automatically. Invalid values warn and fall back.
- **Live edits (dev server)**: editing `repobot.theme.json` (or
  `repobot.landing.json`) in a running dev server repaints the page in ~1s
  with **no full reload** — the platform showroom preview-writes both files
  and auto-applies. The mechanism: the dev server's manifest watcher
  (`web/app/vite.config.ts`) ships the parsed theme contract over a custom
  HMR event (the JSON cannot ride module-level HMR: the vanilla-extract
  compilation registers it as a dependency of every compiled `.css.ts`
  module, and Vite's import-analysis skips `.json` modules, so no accept
  boundary can cover it). `themeHotUpdate.ts` re-resolves the contract with
  the same pure resolvers the build uses and re-declares every token as CSS
  custom properties over the theme classes; structural presets (`navigation`,
  `shell`, `ui`, `mode`) re-render through `useThemeContract()`, which
  components read as their prop defaults. The landing document rides normal
  HMR: `landingDocument.ts` accepts the JSON module and pages subscribe via
  `useLandingConfig`. Two boundaries stay build-time on purpose: pack-scoped
  art palettes (`packBrand`/`packFont` consumed inside `.styles.css.ts` files
  compile to literals — a live brand edit reaches every token-driven surface
  immediately, pack accents on the next dev-server start or build) and the
  design-system source itself (editing `themeConfig.ts`/`tokens.css.ts` still
  full-reloads; only the contract files are hot).
- The `/theme` route (`web/app/src/View/ThemeGallery/`) is a live style guide:
  every token and component rendered with the current theme. Keep it current
  when adding components.
- Restyle order: edit `repobot.theme.json` first (covers brand/shape/density
  requests), reach for component props/slots second, and only then touch view
  styles. Never edit `tokens.css.ts` values directly — they are derived.
- Native twins consume the same file via `scripts/generate-native-theme.mjs`
  (run by `npm run codegen`), which regenerates the iOS/Android theme
  constants.
- Art-directed pack pages keep their own palettes but route accent and font
  constants through the `packBrand` / `packFont` overlay
  (`@base/design-system/theme`), which is `null` until the customer brands the
  project — see `packs/README.md` ("Pack palettes and the theme contract").

## Recipe: customize a component (eject)

When tokens and props can't express a change, eject the component instead of
editing the base design system:

1. App code already imports every component from `@ui`
   (`web/app/src/Theme/ui.ts`) — that registry is the override seam.
2. Copy the base component's `.tsx` + `.styles.css.ts` from
   `web/design-system/src/` into `web/app/src/Theme/overrides/<Component>/`.
3. Fix the copied files' imports for their new home: the base files use
   relative paths (`../theme/tokens.css`, sibling components) that break in
   `overrides/`. Import tokens and siblings from `@base/design-system`
   (`import { vars } from "@base/design-system"`) — NOT from `@ui`: `ui.ts`
   re-exports your override, so an override importing `@ui` is a circular
   dependency.
4. Re-point the export in `ui.ts` (explicit exports win over `export *`):
   `export { Button, type ButtonProps } from "./overrides/Button/Button"`.
5. Edit the override copy freely; keep its props type compatible.

Never edit `web/design-system/` itself: `scripts/verify-ds-pristine.mjs`
(run by check:all) compares it against `.pristine-manifest.json`, and a
pristine base is what lets design-system updates land automatically without
clobbering your customization. Kernel maintainers refresh the manifest with
`node scripts/verify-ds-pristine.mjs --write` after intentional base changes.

## Recipe: an Orders-style dashboard (stats + tabs + master-detail table + form)

The TimberEye-class list page — KPI strip, status tabs, contract rows that
expand into their containers, and a reactive "Add order" form — is a pure
composition of kernel parts. Live exemplar: `/theme/orders`
(`web/app/src/View/OrdersExemplar/`); imitate it, swapping its fixtures for
your generated Apollo hooks (Page → ViewModel → Columns).

1. **KPI strip** — `StatCardRow` of `StatCard`s. The `tone` prop
   (`accent` | `success` | `danger` | `warning` | `info`) draws the colored
   top-border accent; format values with the shared
   `formatCurrencyMinorUnits` / `formatPercent` exports — never a local
   `Intl.NumberFormat` copy.
2. **Status tabs** — the `Tabs` primitive with one `UiQueryView` per tab.
   Filter rows (or vary query variables) per tab; keep one shared search
   state so switching tabs keeps the query.
3. **Master-detail rows** — the `expandable` view-model field
   (`renderExpanded`, optional `isExpandable`) puts a chevron on each row
   and opens a full-width detail region under it. Render a `minimalist`
   `DataTable` of child rows (a contract's containers) inside; it works with
   sorting, pagination, pinned columns, and all three table styles.
4. **The form** — `primaryAction` opens a `UiQueryViewFormModal` over the
   backend's create SchemaForm. Nested arrays, the `entityRef` picker,
   `ui:derived` reactivity, and the `ui:summary` band are all uiSchema
   contract — see `docs/forms.md`. The page's only form code is wiring
   `referenceResolvers` (search/resolve to Apollo queries, quick-create to a
   nested `UiQueryViewFormModal` over the referenced entity's create form).

## Recipe: create a component

1. Decide the layer: generic building block → `primitives/`; reusable composition → `components/`. If it knows about a domain concept, it goes in `web/app` instead.
2. Create `X.tsx` + `X.styles.css.ts` (styles reference theme tokens only).
3. Add `X.stories.tsx` next to it — a component without a story is unfinished. Run `npm run storybook` to verify.
4. Export from `web/design-system/src/index.ts`; consumers import from `@base/design-system` only.

## Key components

- `AppShell` — the application shell: seven layout variants (icon-rail sidebar, inset card, top-bar-owned, logo-rail, …) behind one `layout` prop, with sections, badges, expandable children, drill-up, header slots, and the profile modal; pages render inside it. Nav is config, not code — see `docs/shell.md`.
- `UiQueryView` — the list-page workhorse: toolbar, search, table, pagination (per the `ui.table` preset), skeleton/empty/error states built in. Optional `filters`/`sort` view-model fields render a `FiltersToolbar`; `tableSort`/`onTableSortChange` enable column-header sorting; `tableId`/`tableStyle` feed the table's detailed-mode extras.
- `UiQueryViewFormModal` + `SchemaFormRuntime` — renders backend-driven forms (see `docs/forms.md`). Presentation (centered modal, in-flow inline card, or full page) and width follow `ui.forms`; the `presentation`/`width` props override per view.
- `DataTable` — typed columns + row actions; columns with a `sortValue` sort client-side, or pass `sort`/`onSortChange` to re-query server-side. Style and pagination follow `ui.table`; column-level `filter`, `pinned`, `hiddenByDefault`, and `editable` unlock per-column filters, sticky columns, the column manager (persisted per `tableId`), and click-to-edit cells; the detailed style adds CSV export and a fullscreen focus toggle. The `expandable` prop adds master-detail rows: a chevron column toggling a full-width detail region under each row (see the Orders recipe above).
- `StatCard` / `StatCardRow` — dashboard KPI cards with optional deltas; the `tone` prop adds a colored top-border accent for classic revenue/costs/profit strips.
- `ChartCard` — the only charting surface: line, area, bar, and donut charts on a lazy-loaded recharts chunk, with series colors, grid, tooltip, and legend bound to the theme tokens. **Never import recharts (or `ChartCardChart`) from app code** — chart through `ChartCard` so pages stay on-theme and marketing bundles stay chart-free.
- `ActivityFeed` — the "recent events" list for dashboard cards; callers shape domain events into items.
- `Timeline` — the change-log surface: entries over time with who/when/what (timestamp, actor, title, optional description), a tone-colored marker rail, and optional before → after value pairs per entry. Works as a page section (an order's History tab) or inside a `Dialog` (the "view change log" popup). Reach for it whenever a record's history is worth showing; `ActivityFeed` is the lighter pick for a plain recent-events card without diffs.
- `SettingsGroups` + `SettingsGroup` + `SettingsRow` — the settings-page pattern: titled cards of label-and-control rows, with footer actions and a `danger` tone.
- `FiltersToolbar` — search + facet filter chips + sort select for list pages; fully controlled, apply the filtering in query variables.
- `DetailPage` — the drill-down page scaffold: back control, title + status badge + right-aligned action slot, a key-fact `meta` row, and a tabbed (or plain `children`) content area built on the `Tabs` primitive. Reach for it whenever a record is worth its own route — an order detail with overview/documents/history tabs — instead of flattening the drill-down into another DataTable + modal. Tabs run uncontrolled (`defaultTabId`) or controlled (`activeTabId`/`onTabChange`, e.g. mirrored into the URL).
- `ListDetailLayout` — the master-detail split: list on one side, the selected record's detail on the other, collapsing to one pane at a time on narrow screens (with a back control); selection state stays with the caller. Reach for it when browsing context matters — a lane list you scrub while reading each lane's detail. Rule of thumb: record deserves its own route → `DetailPage`; list + record side by side → `ListDetailLayout`; plain list with create/edit → `UiQueryView` + `UiQueryViewFormModal`.
- `ToastProvider` + `useToast` — global transient notifications for action outcomes ("Saved", "Delete failed"); mounted at the app root in `main.tsx`.
- `GlobalErrors` + `publishGlobalError` — the app's single surface for unexpected failures, mounted once in `main.tsx`. Publish from anywhere (the Apollo failure link already does); errors stack until dismissed, presented per `ui.errors`. Callsites that render errors inline opt out of the Apollo publisher with `context: { suppressGlobalError: true }`.
- `PageLoadingGate` — wraps a page's content with its aggregate loading flag; `gate` style holds one spinner then presents everything at once, `progressive` renders immediately (per `ui.loaders`), with a minimum-visible window so fast loads don't flash.
- `ErrorBoundary`, `EmptyState`, `Skeleton` — standard states; use them instead of ad-hoc conditionals.
- `AuthCard` + `AuthScreen` — the reusable sign-in surface (see `docs/auth.md`). Purely presentational: methods and handlers are injected, so it renders in Storybook with mocks and backs any template needing auth.
- `AiChatThread` — the reusable AI chat surface (see `docs/ai.md`). Purely presentational: responses and handlers are injected (the stream lives in `web/core`), so it renders in Storybook with mock data and backs any template needing an assistant.

## Never

- No inline styles, styled-components, or CSS frameworks.
- No business features in the design system.
- No deep imports (`@base/design-system/src/...`) from other packages.
