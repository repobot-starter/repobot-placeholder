# Repobot Shopify Theme Starter

A Shopify Online Store 2.0 theme scaffold with repobot standards: JSON
templates + sections, translations, Theme Check linting, CI, and a live
storefront preview inside the Repobot workspace.

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
