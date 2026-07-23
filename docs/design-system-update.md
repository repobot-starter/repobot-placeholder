# Design system update playbook

Playbook for the automated DESIGN_SYSTEM_UPDATE run. The workspace is a
customer's live project; this repository (the project's template, containing
the latest kernel design system) is cloned read-only beside it. The goal is
to bring the project's design system up to date **without losing anything the
customer or their agents customized**.

## What to update (from the template clone)

- `web/design-system/**` — the entire package: components, theme contract
  (`tokens.css.ts`, `themeConfig.ts`, `UiThemeProvider.tsx`), stories, and
  `.pristine-manifest.json` inputs.
- `scripts/generate-native-theme.mjs`, `scripts/verify-ds-pristine.mjs`,
  `scripts/check-theme-hardcoding.mjs` — the theme toolchain.
- `docs/design-system.md` and the design-system sections of `AGENTS.md` /
  `.cursor/rules/design-system-layering.mdc` — so future agents in the
  project see current guidance.

## What to preserve (never overwrite from the template)

- `repobot.theme.json` — the project's theme contract. If the update adds new
  contract fields, add them with defaults; never change existing values.
- `web/app/src/Theme/overrides/**` and `web/app/src/Theme/ui.ts` — ejected
  components and the `@ui` registry. If an override no longer compiles
  against the updated design system, adapt it minimally (props/imports only,
  not its design intent) and list it in the report's `todos`.
- All app code under `web/app/src` (outside `Theme/ui.ts` registry updates
  required by the new design system's exports).
- Pack styling files (`*.styles.css.ts`) — they route brand/font through
  `packBrand` / `packFont`; only touch them if the update renames those
  exports, and then mechanically.

## After updating

1. Regenerate the pristine manifest: `node scripts/verify-ds-pristine.mjs --update`.
2. Regenerate native theme constants: `node scripts/generate-native-theme.mjs`.
3. Run `./scripts/check-all.sh` (or at minimum typecheck, unit tests, and
   `node scripts/check-theme-hardcoding.mjs`) and fix what the update broke.
4. In the report, list every override you had to adapt and any template
   change you could not apply because it conflicted with a customization.
