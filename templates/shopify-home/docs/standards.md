# Theme Standards

The conventions every change to this theme follows. They exist so any agent
or human can pick up the repo cold and extend it without archaeology.

## Structure

- **Templates are JSON** (`templates/*.json`): they declare which sections a
  page renders and in what order. Never put markup in a template.
- **Sections own page-level UI** (`sections/*.liquid`): each has a
  `{% schema %}` block declaring its settings, and a preset when merchants
  should be able to add it in the theme editor. Section groups
  (`header-group.json`, `footer-group.json`) own the chrome.
- **Snippets are the reusable unit** (`snippets/*.liquid`): render them with
  `{% render 'name', arg: value %}`. A snippet must document its arguments in
  a leading `{% comment %}`.

## Content and settings

- Every user-facing string goes through `| t` with a key in
  `locales/en.default.json`. No hardcoded English in Liquid.
- Merchant-tunable values (colors, headings, product counts) are section or
  theme settings — never constants in the code. Theme-wide tokens live in
  `config/settings_schema.json` and surface as CSS custom properties.

## Styling and scripts

- `assets/base.css` builds on the custom properties declared at `:root`.
  Add tokens rather than one-off values.
- Keep `assets/theme.js` minimal. Behavior that belongs to one section ships
  in that section's file so it loads only where used.
- Images always render through `image_url` with an explicit width, `alt`
  text, and lazy loading below the fold.

## Quality gates

- `npm run check` (Theme Check) passes with zero errors before every commit;
  CI enforces `--fail-level error`.
- Test in the live preview against a real store when the change touches
  product, cart, or checkout flows (`npm run dev`).
