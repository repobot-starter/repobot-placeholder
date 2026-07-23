# Repobot Roastery — Shopify Example Store

A small-batch coffee roastery storefront built on the repobot Shopify
standards: JSON templates + sections, translations, Theme Check linting, CI,
and a live storefront preview inside the Repobot workspace.

## What this store is

An opinionated example, not a bare scaffold: a warm, dark roastery look with
a roast-of-the-month hero, product cards with roast-level badges, tasting
notes on the product page, a pour-over brew guide, a subscription callout,
and an FAQ. Every headline, step, and answer is demo copy meant to be
replaced — it lives in section schema defaults and in the JSON templates
(`templates/index.json`, `templates/product.json`), so you can rewrite it
from the theme editor or directly in those files. Reusable UI strings
(labels, empty states) live in `locales/en.default.json`.

## Development

- `npm run dev` — `shopify theme dev` (needs `SHOPIFY_FLAG_STORE` and a
  Theme Access token, injected automatically in a Repobot workspace with a
  connected store).
- `npm run check` — Theme Check lint.
- `npm run test` — Theme Check at `--fail-level error` (the CI gate).
- `npm run push` — push the theme to your store with the Shopify CLI.

## Layout

See `AGENTS.md` for the repo map and standards, `docs/standards.md` for the
full conventions, and `docs/testing.md` for the verification story.
