# Pack: blank (spaceboy starter)

Default pack every new sign-up starts from. Public landing only — the spaceboy night scene: a boy on a grassy hill crest holding the moon on a string (the brand artwork staged as a scene). No copy, no wordmark.

## What ships

- The spaceboy scene at `/` (`web/app/src/View/Blank/`): an animated night sky (twinkling stars, a glowing textured moon with a gentle halo pulse), a grassy hill, and the boy silhouette holding a dotted string up to the moon. Art-directed custom view, not a `LandingConfig` composition; animations respect `prefers-reduced-motion`.
- No domain GraphQL contract beyond the kernel exemplars (`/login`, `/users`, `/projects`)

## Agent recipe

Treat this as a blank canvas. The spaceboy scene is a placeholder with personality, not the product: keep it until the product has a real home, then replace `/` with the app shell the user asked for. Use Identity/Project exemplars as pattern references, not as the product UI.

One caveat: when `repobot.project.json` declares a marketing page at `/`, that manifest entry owns the home page. Design it through the page's inline `landing` config (or its sections) — never by rerouting `/` to a bespoke component, which leaves the manifest describing a page nobody renders (`verify-manifest-routes` fails the check).
