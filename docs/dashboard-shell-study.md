# Dashboard shell study — what the exemplars and the field do well

The dashboard — the signed-in view of a user's application — is a critical
piece of the product's design. Before the shell kernel grew its variant
vocabulary, we studied the two in-house exemplars (Timbereye web-admin and
Repobot's own dashboard), the kernel's existing `AppShell`, and the state of
the art in libraries and top products. This doc records what each does well
and which patterns the kernel codified. The resulting vocabulary lives in
`docs/shell.md`; this is the design rationale behind it.

## Timbereye web-admin (`marketplace/typescript/web-admin` + `ui-kit`)

The strongest single idea in Timbereye's shell is **icon stability**: the
nav row keeps the same left padding (24px) in both expanded and collapsed
states, so the icon never moves — only the label fades and slides away
(`opacity: 0; transform: translateX(-8px); width: 0`) while the sidebar
width animates on a CSS variable. Collapse feels like the chrome exhaling,
not a re-layout. Other patterns worth keeping:

- **Width on a CSS var, one transition.** The shell writes
  `--sidebar-width` via `assignInlineVars`; `width`/`min-width` transition
  on a shared duration/easing token pair, and a `prefers-reduced-motion`
  global kills every transition at once.
- **Labels stay mounted.** Collapse animates label opacity/width instead of
  unmounting, which is what makes the crossfade possible (and keeps the DOM
  stable for a11y).
- **Collapsed hover hints via portal.** Icon-only rows show a floating
  label chip (label + hotkey) positioned off the row's bounding rect,
  rendered to `document.body` so it never clips.
- **Active group halo.** When a group with children holds the active item,
  the whole group gets a soft background container — selection reads at the
  group level, not just the leaf.
- **Meta fades with the label.** Badges and hotkey hints share the label's
  collapse animation (`translateX(8px)`, width 0), so nothing pops.
- **Command search as top-bar anchor.** The top bar's left slot defaults to
  a command-search button ("Plan, search, ship anything…"), making the bar
  earn its height.
- **The binder persists collapse** in localStorage under a namespaced key.

## Repobot's own dashboard (`repobot/web/app/src/View/Dashboard/`)

Repobot's `DashboardShell` is the origin of two patterns the product owner
called out explicitly:

- **Collapse to logo-only.** Repobot's collapsed state is not an icon rail
  — it hides _everything except the logo_. A floating brand tile sits at
  the top-left; clicking it expands the full sidebar; the content column's
  margin animates (160ms) between states. Full-bleed surfaces (the
  workspace) drop even the logo gutter and take the whole viewport. This
  became the kernel's `logo-rail` variant.
- **The profile modal.** The sidebar footer is an identity row (avatar with
  initials + display name + org sublabel) with a menu trigger that opens a
  layered overlay: identity header (name + email), icon'd navigation rows
  (Organizations, Organization settings, Projects, Settings), preference
  rows that open **submenus with checkmarked options** (theme, timezone,
  language), and a separated sign-out row. Everything the account can do,
  one press away from the avatar. This became the kernel's enriched profile
  modal: identity header, icon'd app-supplied items, a checkmarked theme
  picker, separated sign-out.
- **Drill-down levels.** Root (org picker, no nav) → organization → project,
  with the brand mark doubling as "drill up one level". The kernel already
  models this as `ShellNavLevel` + `drillUp`.
- **Selection via accent mixes.** Active/hover backgrounds are
  `color-mix(accent 16%/8%)` over the sidebar background — the theme's
  accent flows through selection without dedicated colors.

What we deliberately did not copy: the route-to-nav matching is a 30-branch
ternary — the kernel's `resolveActiveShellNavItemId` (schema + pure helpers,
parity-tested on three platforms) is the better shape.

## The kernel's `AppShell` before this work

Three layouts (`sidebar` / `top-nav` / `minimal`), schema-driven nav,
badges, expandable groups, drill-up, hotkey tooltips, mobile drawer, profile
overlay with theme toggle + sign out, all styled from `vars.navigation.*`
tokens derived from the theme contract. Solid bones; the gaps against the
exemplars:

- Collapsed items were **re-centered** (`justify-content: center`), so
  icons jumped horizontally on collapse; labels/badges unmounted instead of
  fading.
- Only one sidebar treatment — no logo-only collapse, no inset/card
  relationship with the content, no full-width top bar relationship, no
  no-top-bar option.
- The profile overlay was a flat text list — no identity avatar header, no
  item icons, no theme picker, no visual separation of sign-out.
- Layout selection was code (`shellLayout` in `shellNavSections.tsx`) with
  no theme-contract or manifest lever, unlike the marketing nav variants.

## Libraries and the field

**shadcn/ui sidebar** is the reference vocabulary in the ecosystem: a
provider + composable parts with `variant: sidebar | floating | inset` and
`collapsible: offcanvas | icon | none`. The `inset` variant — sidebar flush
on the app background, _content floating as a rounded, shadowed panel_ — is
"the classic dashboard look" (Linear/Notion/Arc-adjacent) and the direct
model for the kernel's `sidebar-inset`. Mobile always falls back to a sheet
(drawer), which the kernel already does.

**Linear** is the no-top-bar exemplar: the sidebar is the only chrome and
each page owns its own header row, which keeps the product dense and makes
the content feel like the whole app. That is the kernel's `sidebar-only`.

**Vercel/GitHub-style shells** put a full-width top bar _above_ the
sidebar: brand and account live in the bar spanning the whole viewport, the
sidebar is pure navigation hanging beneath it. That relationship — bar owns
the top edge, rail owns the left — is the kernel's `sidebar-topbar`.

Field consensus on the mechanics (uipotion, DesignRevision, Create UI,
justfigma surveys):

- Expanded 240–280px, collapsed 56–72px; animate width 160–300ms
  ease-in-out and **nothing else should reflow**.
- Collapsed rail: icons keep position ("the leading icons glide, nothing
  jumps"), labels collapse via `max-width`/`opacity`, every item gets a
  tooltip on hover _and focus_ (keyboard users need labels too), rendered
  via portal.
- Collapsed badges must not render as flow siblings (they overflow the
  rail) — reduce to a dot on the icon's corner, put the count in the
  tooltip.
- Active state: one system-wide treatment — tinted background + accent
  text, optionally a 3px leading indicator; `aria-current="page"`.
- Persist collapse per user; respect `prefers-reduced-motion`; scrim +
  focus-return for mobile drawers.

## What the kernel codified from this

| Study finding                                                                    | Kernel form                                                                                                                   |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Timbereye's fixed icon rail                                                      | `sidebar` family: constant item inset, label/badge fade, icons never move                                                     |
| Repobot's logo-only collapse                                                     | `logo-rail` variant                                                                                                           |
| Repobot's profile modal                                                          | Enriched profile overlay: avatar identity header, icon'd items, checkmarked theme picker, separated sign-out                  |
| shadcn `inset`                                                                   | `sidebar-inset` variant (content as elevated rounded panel)                                                                   |
| Vercel/GitHub bar-over-rail                                                      | `sidebar-topbar` variant                                                                                                      |
| Linear's chrome-less content                                                     | `sidebar-only` variant                                                                                                        |
| Marketing nav variant governance                                                 | `shell` theme-contract block + manifest `dashboard.shell.variant`, warn-and-fallback, append-only, story-and-test per variant |
| Field: collapsed badge dot, tooltip on focus, reduced motion, persisted collapse | Baked into the shared sidebar chrome                                                                                          |
| Content relationship (shadcn inset, Linear full-bleed)                           | `shell.content` modes: `full` / `centered` / `flush`                                                                          |
