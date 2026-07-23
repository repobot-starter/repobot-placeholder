# Testing and Verification

Shopify themes have no unit-test runner in the web-kernel sense; the
verification story is linting + live preview:

1. **Theme Check** (`npm run check`) is the static gate: template/section
   wiring, translation keys, Liquid errors, performance smells. CI runs
   `npx shopify theme check --fail-level error` on every push and PR
   (`.github/workflows/ci.yml`). A change is not done until it passes.
2. **Live preview** (`npm run dev`, automatic in a Repobot workspace with a
   connected store): walk the affected flows against real store data —
   home, collection, product, add-to-cart, cart update, checkout handoff.
3. **Theme editor sanity**: any new section with a preset should be added,
   configured, and removed in the editor without errors.

When the Repobot platform verifies this repo (migrations, promotions) it
runs `npm run test`, which maps to the Theme Check error gate.
