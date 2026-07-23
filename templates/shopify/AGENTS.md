# Agent Guide

This repository is a **Shopify Online Store 2.0 theme** on repobot standards.
It is not a web-kernel project: there is no GraphQL layer, database, or
backend here — the storefront is rendered by Shopify from Liquid templates.

## Repo map

| Path               | What it is                                                         |
| ------------------ | ------------------------------------------------------------------ |
| `layout/`          | The HTML shell (`theme.liquid`)                                    |
| `templates/*.json` | Page templates: which sections render, in what order               |
| `sections/`        | Section components (Liquid + `{% schema %}`), incl. section groups |
| `snippets/`        | Reusable Liquid partials (`{% render %}`)                          |
| `assets/`          | CSS / JS / images served by the Shopify CDN                        |
| `config/`          | Theme settings schema and current values                           |
| `locales/`         | Translations; every user-facing string goes through `              | t`  |
| `scripts/`         | Sandbox preview entry points (`repobot.sandbox.json`)              |
| `docs/`            | Standards, testing, and migration guides                           |

## Standards (the short version)

- Every user-visible string goes through the translation filter (`| t`) with
  a key in `locales/en.default.json`.
- New page-level building blocks are **sections** with a `{% schema %}` and a
  preset, so merchants can add them in the theme editor. Reusable fragments
  are **snippets**.
- Styling lives in `assets/base.css` on the CSS custom properties declared at
  `:root`; wire new colors through `config/settings_schema.json` rather than
  hardcoding.
- `npm run check` (Theme Check) must pass; CI runs it with
  `--fail-level error` on every push. Read `docs/standards.md` and
  `docs/testing.md` before larger changes.

## Live sandbox rules (Repobot workspace)

- With a connected Shopify store the preview is a live `shopify theme dev`
  session against the user's storefront; edits hot-reload.
- Never run `git` commands; the platform commits and pushes automatically.
- Write progress updates and summaries for the store's owner, not for an
  engineer — plain words about what is changing in their storefront, never
  internal mechanics like tests, refactors, or file names.
- You can create images with your image generation tool (banners, product
  placeholders, section backgrounds). When the user asks for an image,
  generate it and save it under `assets/` with a descriptive filename. The
  platform attaches images you create to your chat reply automatically, so
  don't apologize about not being able to show them.
- Theme publishing happens through the Shopify CLI (`npm run push`) for now;
  Repobot-managed theme publish is coming.
