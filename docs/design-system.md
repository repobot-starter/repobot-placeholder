# Design System

Location: `web/design-system/`. Layers: `src/primitives/` (Radix-based building blocks) → `src/components/` (AppShell, UiQueryView, modals, states). Domain code never lives here — pages belong in `web/app`.

## Styling

- vanilla-extract only. Every component has a sibling `X.styles.css.ts` exporting class names.
- All values come from the theme contract (`web/design-system/src/theme/`): semantic color tokens, spacing, radius, type scale, with light/dark themes as CSS variables. Never hardcode a color or pixel value.
- Interactive behavior (dialogs, selects, menus) comes from Radix primitives skinned with our tokens — keyboard and ARIA correctness is inherited, don't rebuild it.

## Theming

The whole design system derives its token values from the root
**`repobot.theme.json`** contract: `brand.primary` / `brand.primaryDark`
(accent hexes), `radius` (`sharp` | `soft` | `round`), `density`
(`compact` | `comfortable` | `spacious`), `fontFamily` (preset key or raw CSS
stack), and `mode` (`light` | `dark` | `system`, the default UI mode).

`fontFamily` presets: `system`, `serif`, `rounded`, `mono` map to platform
font stacks; `inter`, `manrope`, `source-serif`, `space-grotesk`, `plex-mono`
are self-hosted web fonts (`web/app/public/fonts` + `web/app/src/fonts.css`)
with matching TTFs bundled natively (`ios/App/Fonts`, `android res/font`), so
the same preset renders the same family on all three platforms. Raw CSS
stacks apply on web only — native falls back to the system font.

- `web/design-system/src/theme/themeConfig.ts` resolves the contract at build
  time — hover shades, on-accent text color, and the dark-theme accent derive
  from `brand.primary` automatically. Invalid values warn and fall back.
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
3. Re-point the export in `ui.ts` (explicit exports win over `export *`):
   `export { Button, type ButtonProps } from "./overrides/Button/Button"`.
4. Edit the override copy freely; keep its props type compatible.

Never edit `web/design-system/` itself: `scripts/verify-ds-pristine.mjs`
(run by check:all) compares it against `.pristine-manifest.json`, and a
pristine base is what lets design-system updates land automatically without
clobbering your customization. Kernel maintainers refresh the manifest with
`node scripts/verify-ds-pristine.mjs --write` after intentional base changes.

## Recipe: create a component

1. Decide the layer: generic building block → `primitives/`; reusable composition → `components/`. If it knows about a domain concept, it goes in `web/app` instead.
2. Create `X.tsx` + `X.styles.css.ts` (styles reference theme tokens only).
3. Add `X.stories.tsx` next to it — a component without a story is unfinished. Run `npm run storybook` to verify.
4. Export from `web/design-system/src/index.ts`; consumers import from `@base/design-system` only.

## Key components

- `AppShell` — sidebar nav + header; pages render inside it.
- `UiQueryView` — the list-page workhorse: toolbar, search, table, load-more pagination, skeleton/empty/error states built in.
- `UiQueryViewFormModal` + `SchemaFormRuntime` — renders backend-driven forms (see `docs/forms.md`).
- `ErrorBoundary`, `EmptyState`, `Skeleton` — standard states; use them instead of ad-hoc conditionals.
- `AuthCard` + `AuthScreen` — the reusable sign-in surface (see `docs/auth.md`). Purely presentational: methods and handlers are injected, so it renders in Storybook with mocks and backs any template needing auth.
- `AiChatThread` — the reusable AI chat surface (see `docs/ai.md`). Purely presentational: responses and handlers are injected (the stream lives in `web/core`), so it renders in Storybook with mock data and backs any template needing an assistant.

## Never

- No inline styles, styled-components, or CSS frameworks.
- No business features in the design system.
- No deep imports (`@base/design-system/src/...`) from other packages.
