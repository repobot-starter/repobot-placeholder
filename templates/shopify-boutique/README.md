# Repobot Boutique

An editorial apparel & accessories example store built on the Repobot
Shopify theme standards: JSON templates + sections, translations, Theme
Check linting, CI, and a live storefront preview inside the Repobot
workspace.

## What this store is

Repobot Boutique is a fully composed storefront — announcement bar, split
hero, featured collection, lookbook rows, newsletter capture, and a product
page with size-guide and fabric-care panels — dressed in a warm editorial
palette with serif display type. Start here, swap the demo copy and
placeholder imagery for your catalog, and you have a boutique instead of a
blank scaffold. The demo copy lives in section `{% schema %}` defaults
(merchant-editable in the theme editor) and in `locales/en.default.json`
(fixed chrome strings).

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
