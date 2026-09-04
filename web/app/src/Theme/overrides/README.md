# Component overrides

Ejected copies of `@base/design-system` components live here, one directory
per component (`Button/Button.tsx` + `Button/Button.styles.css.ts`), and are
activated by re-pointing the export in `../ui.ts`.

Rules:

- Only eject when tokens (`repobot.theme.json`) and props can't express the
  change — overrides are excluded from automatic design-system updates and
  become this project's responsibility.
- Keep the component's public props type compatible so call sites keep
  working.
- Never edit `web/design-system/` itself; `scripts/verify-ds-pristine.mjs`
  guards it.
