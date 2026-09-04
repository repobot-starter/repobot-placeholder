# Application shell

The app shell — sidebar navigation, header, profile menu — is a modular
kernel component with the same layered shape as auth (`docs/auth.md`) and AI
(`docs/ai.md`), minus a backend: it is pure UI plus config. Understanding the
split is what lets you restyle the chrome, change a product's navigation, or
reuse the shell in a new template without touching the other layers.

| Layer   | Where                                           | What it owns                                                                                                                                                                  |
| ------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Surface | `web/design-system/src/components/AppShell.tsx` | The chrome: seven layout variants behind one prop (see below), header slots, profile modal with theme + sign out. Purely presentational — nav data and handlers are injected. |
| Config  | `web/core/src/Shell/`                           | The nav schema (`ShellNavTypes.ts`: items, sections, levels) and pure helpers (`ShellNavigation.ts`: active-item resolution, badge merge, hotkey map).                        |
| Binder  | `web/app/src/View/Navbar/`                      | `AppLayout.tsx` (~80 lines) plugs the app's nav config (`shellNavSections.tsx`), router, hotkeys (`useNavHotkeys.ts`), and session into the surface.                          |

The iOS and Android apps mirror all three layers natively:

- iOS — `ios/App/Components/Shell/ShellNavModels.swift` (config),
  `ios/App/View/Navigation/NavigationShellView.swift` + `SidebarMenuView.swift`
  (surface: slide-over drawer + top bar), `KernelShellView.swift` (binder).
- Android — `android/.../components/shell/ShellNavModels.kt`,
  `android/.../view/navigation/NavigationShellView.kt` + `SidebarMenuView.kt`,
  `KernelShellView.kt`.

The nav schema is mirrored in three files — web
`web/core/src/Shell/ShellNavTypes.ts`, iOS `ShellNavModels.swift`, Android
`ShellNavModels.kt`. Change all three together; the active-matching and
hotkey semantics are pinned by the parity tests
(`web/app/tests/Shell/ShellNavigation.test.ts`,
`ios/AppTests/ShellNavModelsTests.swift`,
`android/.../ShellNavModelsTest.kt`).

## Shell variants

`AppShell` takes `layout`, one of the stable keys the setup flow's
`AppShellStep` promises (append-only, like the landing kernel's vocabulary).
Each is a designed treatment, not a parameter permutation — vary it between
projects the way you vary the marketing nav. The study behind this
vocabulary (Timbereye web-admin, Repobot's own dashboard, shadcn/Linear/
Vercel-class patterns) is `docs/dashboard-shell-study.md`.

- `sidebar` (default) — the icon-rail workhorse: sections, badges,
  expandable children, drill-up, collapse, profile footer, and a header bar
  over the content.
- `top-nav` — one horizontal bar: brand, the same nav items flattened
  (groups go to their first leaf, as in the collapsed rail), header slots,
  profile menu on the right.
- `minimal` — no nav at all: brand, header slots, and profile over the
  content. For single-screen apps.
- `sidebar-inset` — the rail sits naked on the canvas and the content
  column floats as an elevated, rounded card (the Linear/Notion-class
  "inset" look). Pick it when the product should feel like a crafted tool
  rather than an admin panel.
- `sidebar-topbar` — a full-width top bar owns brand, header slots, and the
  profile; a nav-only rail hangs beneath it (the Vercel/GitHub
  relationship). Pick it when the top bar carries real work (search,
  environment switchers) that deserves the whole viewport width.
- `sidebar-only` — no top bar at all: the sidebar is the only chrome and
  every page owns its own header row (the Linear relationship). Header
  slots are unused on desktop; the profile modal carries the theme control.
  Pick it for dense, keyboard-first tools.
- `logo-rail` — collapse hides everything except the brand mark (Repobot's
  own dashboard treatment): the rail dissolves to a floating logo, content
  takes the room, and the logo brings the sidebar back. Pick it when the
  content is the product and chrome should get out of the way.

### Choosing a variant (precedence)

Selection mirrors the marketing shell's nav variant — config first, code
last:

1. `repobot.project.json` → `dashboard.shell.variant` — the setup-chosen
   treatment, validated against the exported `appShellLayouts` list in the
   binder (unknown values are ignored, never blank chrome).
2. `shellLayout` in `web/app/src/View/Navbar/shellNavSections.tsx` — an
   optional in-code pin; the kernel ships `undefined` (defer).
3. `repobot.theme.json` → `shell.variant` — the project-wide default,
   resolved warn-and-fallback in `themeConfig.ts` like the `ui` block.
4. `sidebar`.

All variants consume the same `shellNavSections`, so switching is one
config word.

### The content relationship

`shell.content` in the theme contract (or the `contentMode` prop) sets how
pages relate to the shell, in every layout:

- `full` (default) — pages fill the region with the standard gutter.
- `centered` — pages constrain to a readable ~1120px column; the gutter
  grows symmetrically. For content-led products.
- `flush` — no gutter at all: the page owns the region (dense tables,
  canvases, chat surfaces).

The shell owns scroll: the chrome is viewport-fixed and the content region
scrolls internally, so the rail and profile never scroll away.

## Navigation is config, not code

A product's IA is data against the schema, not chrome edits:

- **Items** — `id` (route items use their web path, e.g. `/projects`, on
  every platform so the IA stays mirrored), `label`, an icon (platform-native:
  a React node on web, an SF Symbol name on iOS, an ImageVector on Android),
  optional `badgeText`, optional `hotkey`, optional `children`.
- **Sections** — groups of items with an optional uppercase `title`; untitled
  sections render as plain separators.
- **Levels** — `ShellNavLevel` models drill-down hierarchies (e.g.
  organization → project): the binder picks the active level's sections and
  the shell renders a drill-up row back to the parent via the `drillUp` prop.
- **Hotkeys** — the schema names a single key per item; each platform owns
  the chord (Cmd/Ctrl+Shift+key on web via `useNavHotkeys`, Cmd+Shift+key on
  iPad hardware keyboards). Collapsed web tooltips show the label + hotkey.
- **Badges** — set `badgeText` in the config, or merge live counts onto item
  ids with `applyShellNavBadges` (`ShellNavigation.applyBadges` natively).

The kernel exemplar's config is `web/app/src/View/Navbar/shellNavSections.tsx`
with native twins in the `KernelShellView` binders — a workspace section
(Projects and Users, hotkeys `p`/`u`) and an account section (Settings,
hotkey `s`, the `/settings` destination — see `docs/auth.md` for what the
settings page owns). Edit these (in lockstep) to change a product's
navigation.

## Shell behavior

- **Web** — persistent icon rail: expanded (240px) or collapsed (56px) with
  hover/focus tooltips; the brand tile toggles collapse and the binder
  persists the choice (`base.navCollapsed` in localStorage). The rail's
  geometry is fixed: every row keeps the same left inset in both states, so
  **icons never move on collapse** — labels, badges, and carets fade and
  give up their width instead (`logo-rail` is the exception: its collapse
  dissolves the whole rail down to the brand mark). Collapsed badge counts
  reduce to a dot on the icon's shoulder; the hover tooltip carries the
  number. Everything rides one 180ms collapse clock, and
  `prefers-reduced-motion` turns all of it off. Groups expand inline
  (animated) when the rail is expanded; in the collapsed rail, clicking a
  group goes to its first leaf. The active item gets the accent-tinted
  background, accent text, a leading accent bar, and `aria-current="page"`.
  The profile footer opens the profile modal: the signed-in identity
  (avatar, name, email), any app-supplied account options (with optional
  icons), a checkmarked Light/Dark theme picker, and sign out.
- **iOS / Android** — a slide-over drawer over a top bar + content host
  (no tab bar, no `NavigationSplitView`): hamburger opens the drawer, scrim
  tap dismisses, selecting a destination closes it. The drawer footer is the
  account menu (app-supplied items + theme toggle + sign out). The theme
  choice persists under the same `base.themeMode` key on all three platforms.

### Profile menu items are config too

The shell stays domain-agnostic: what the profile menu offers beyond the
built-in theme toggle and sign out is injected by the binder, never hardcoded
in the chrome. On web, `AppShellProfile.items` takes
`{ id, label, onSelect, icon? }` entries; natively, `ShellProfile.items`
takes `ShellProfileMenuItem` twins (with an optional platform icon). The kernel
exemplar's binders (`AppLayout.tsx` and the `KernelShellView` twins) supply
one item — "Account settings", navigating to the `/settings` destination —
mirrored across all three platforms.

## Iterating on the shell (no backend needed)

`AppShell` is a design-system component with Storybook coverage
(`AppShell.stories.tsx`): every layout variant, expanded/collapsed, badges,
expanded children, drill-up, profile, and the content modes — all against
mock data. To tune styling:

```
npm run storybook   # from the repo root
```

Edit `AppShell.styles.css.ts` (theme tokens only — note the dedicated
`vars.navigation.*` block: sidebar background, item hover/active colors,
derived from the palette in `themeConfig.ts`) and watch every state update
live. The app's `AppLayout` is a thin binder, so Storybook is pixel-identical
to the product.

## Reusing the shell in a new template

Any template with signed-in navigation renders the kernel shell — never a
bespoke sidebar:

1. Describe the IA: write your nav sections (and levels, if hierarchical)
   against the schema, per platform binder.
2. Bind the surface: on web, render `AppShell` from `@ui` inside your layout
   route (see `AppLayout.tsx`); on iOS/Android, bind `NavigationShellView`
   with your config and a destination → view switch (see the
   `KernelShellView` twins).
3. Make it yours: brand via the `title`/`brandIcon` props and
   `repobot.theme.json`; the `vars.navigation.*` tokens re-derive from the
   brand accent automatically.

Full-bleed surfaces (games, landing pages, chat-first packs) simply don't
render the shell — it is chrome for multi-destination apps, not a mandatory
wrapper.
