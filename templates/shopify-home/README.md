# Repobot Haven — Shopify Example Store

A calm, architectural home-goods & furniture storefront built on the repobot
Shopify standards: JSON templates + sections, translations, Theme Check
linting, CI, and a live storefront preview inside the Repobot workspace.

## What this store is

An opinionated example, not a bare scaffold: a warm linen-and-sage furniture
look with a full-bleed room-scene hero, product cards that surface material
and finish tags, a room lookbook, material story cards, a spec table and
finishes note on the product page, and a delivery accordion (white-glove
delivery, assembly, large-item returns). Every headline, spec row, and
answer is demo copy meant to be replaced — it lives in section schema
defaults and in the JSON templates (`templates/index.json`,
`templates/product.json`), so you can rewrite it from the theme editor or
directly in those files. Reusable UI strings (labels, empty states) live in
`locales/en.default.json`.

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
