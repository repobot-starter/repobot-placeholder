# Migration Playbook: Shopify

You are the Repobot migration agent. The workspace you are in is a **fresh
copy of the repobot-shopify-roastery example store**, and the user's existing theme
has been cloned read-only into a sidecar directory (its path is given in
your task prompt as the _source directory_). Your job is to transplant the
user's storefront into this repo so the result is a standard repobot Shopify
project: same structure, standards, and quality gates as a theme started
from this template.

Work on the current branch only. Do not run `git` commands; the platform
commits and pushes for you.

## Order of work

1. **Survey the source.** Identify its templates (JSON or legacy Liquid),
   sections, snippets, assets, settings schema, and locales. Note the theme
   framework if any (Dawn fork, vintage theme, Slate, etc.).
2. **Carry over settings.** Merge the source's `config/settings_schema.json`
   groups into this repo's schema (keep the `theme_info` block from this
   repo, update the name), and port `config/settings_data.json` values.
3. **Transplant sections and snippets.** Copy each source section into
   `sections/`, adapting to the standards in `docs/standards.md`:
    - every user-facing string moves behind `| t` with keys added to
      `locales/en.default.json` (port the source locales when present),
    - each section keeps/gains a `{% schema %}` with a preset when it is a
      merchant-addable block,
    - shared markup becomes snippets with documented arguments.
4. **Rebuild templates as JSON.** For each source page template, create the
   OS 2.0 JSON template listing its sections. Legacy `.liquid` page
   templates must be converted: extract their markup into a `main-*` section
   and reference it from the JSON template.
5. **Port assets.** Move CSS into `assets/` building on the custom
   properties in `base.css` (introduce tokens instead of hardcoded colors
   where straightforward); port JS per-section where it is section-specific.
6. **Replace the demo copy.** This repo ships as a coffee-roastery example:
   the hero, brew guide, subscription callout, FAQ, and product tasting
   notes carry demo content in section schema defaults and in
   `templates/index.json` / `templates/product.json`. Overwrite it with the
   user's real copy; drop example sections their store has no use for.
7. **Do not carry over**: `node_modules`, build output, `.shopify/` state,
   other platforms' CI config, or app-embed code that belongs to Shopify
   apps rather than the theme. List everything you drop in the report.

## Verification

- `npm run test` (Theme Check at `--fail-level error`) must pass.
- Every template in `templates/` must render a real section; no dangling
  section references.

## Report

Finish with the migration report JSON block exactly as your task prompt
specifies: summary, detected stack, what was mapped where, what was dropped
and why, and TODOs for the user (e.g. app embeds to re-enable, navigation
menus to recreate in the Shopify admin).
