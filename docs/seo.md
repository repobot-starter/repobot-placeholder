# SEO

The SEO kernel: per-route document meta (title, description, canonical,
robots, Open Graph, Twitter cards), generated `sitemap.xml` + `robots.txt`,
and JSON-LD structured data — all config-shaped. Pages declare meta where
their content already lives; one component applies it; a build step emits the
crawler files. Sites and blogs are half of what this repo ships, so every
public surface participates by default.

## The shape of the kernel

| Piece      | Where                                                   | What it owns                                                                       |
| ---------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Helpers    | `web/core/src/Seo/SeoMeta.ts`                           | Title composition, canonical URLs, JSON-LD builders (pure, platform-mirrorable)    |
| Binder     | `web/app/src/Seo/PageMeta.tsx`                          | `<PageMeta>` + `<JsonLd>`: renders the tags; React 19 hoists them into `<head>`    |
| Config     | Page content: `repobot.project.json`, pack `content.ts` | Titles, descriptions, share images — meta is content, never a parallel config file |
| Generator  | `scripts/generate-seo-files.mjs`                        | `sitemap.xml` + `robots.txt` in `web/app/public/`, emitted from the IA manifest    |
| Build hook | `web/app/prebuild.sh`                                   | Regenerates the crawler files before every build and test run                      |
| Exemplar   | `web/app/src/View/Blog/BlogPage.tsx`                    | Per-post meta + schema.org Article JSON-LD from the pack's `content.ts`            |

**Document meta is never hand-set.** A page declares its meta by rendering
`<PageMeta …/>`; writing `document.title` (or inserting meta tags) anywhere
else is a defect — the web app's ESLint config errors on `document.title` in
`src/`. There is no imperative module and no dependency: React 19 hoists
`<title>`/`<meta>`/`<link>` rendered from components into `<head>` natively,
and since exactly one routed page renders at a time, meta swaps on route
change for free (unmounting a page removes its tags).

## Declaring meta on a page

```tsx
import { PageMeta } from "../../Seo/PageMeta"

export default function PricingPage() {
    return (
        <>
            <PageMeta
                title="Pricing" // composed to "Pricing — Fieldbook"
                description="Plans and billing." // meta + og: + twitter:description
                image="/brand/social.png" // optional; defaults below
                type="article" // og:type; default "website"
                robots="noindex" // optional robots hints
                path="/blog?post=slug" // canonical path; default = current route
            />
            {/* …the page itself… */}
        </>
    )
}
```

Every tag set from one declaration: `<title>`, `meta description`,
`link rel="canonical"`, `og:title/description/type/url/image/site_name`, and
the Twitter card triplet. Omitted props omit their tags — never empty ones.

### Where the values come from (meta is content)

- **Manifest marketing pages** need nothing: `SitePage` already renders
  `PageMeta` from each `repobot.project.json` page entry — `title`,
  `description`, and the seeded hero image. The home page collapses to the
  site name alone instead of "Home — Site".
- **Pack pages** pass fields from their one content file: the blog uses
  `blog.title`/`blog.description` and each post's `title`/`summary`/`date`;
  launch uses `product.name`/`subheadline`; menu uses `business.name`/
  `description`; folio uses `profile.name`/`statement`. A pack whose page is
  its own brand passes `siteName` too, so the title doesn't double up.
- **Custom landing pages** keep meta in the config file next to the copy —
  `web/app/src/View/Landing/landing.ts` exports `landingMeta` and the page
  renders it.

### Fallbacks (the documented ladder)

- **Site name**: `repobot.project.json` `marketing.siteName`, else the
  manifest home page's title, else only the page title renders.
- **Share image** (`og:image`/`twitter:image`): the declared `image`, else
  `marketing.brand.social` — the committed social card, expected as
  `social.png` under `web/app/public/brand/`, ideally 1200×630 — else
  `marketing.brand.logo`, else the tag is omitted (and the Twitter card
  downgrades to `summary`).
- **Canonical URL**: the running page's origin plus the route path, so the
  canonical always matches the host actually serving the site — custom
  domains included — with zero configuration. The static `<title>` in
  `web/app/index.html` is only the pre-hydration fallback.

**Every public route declares meta or inherits this documented fallback.**
Signed-in routes don't need `PageMeta` — `robots.txt` disallows them.

## sitemap.xml + robots.txt (generated, never hand-edited)

`scripts/generate-seo-files.mjs` reads `repobot.project.json` and writes both
files into `web/app/public/`; `web/app/prebuild.sh` runs it before every
build and test (`npm run seo:generate` runs it by hand; `npm run test:seo`
tests it). Hand-edits are overwritten by design.

- **sitemap.xml** lists the routable public pages: `/` (whatever owns it —
  the manifest home or the active pack's home surface) plus every
  `marketing.pages` entry. Signed-in and journey routes never appear.
- **robots.txt** allows everything except the kernel's auth/checkout/
  billing/settings journeys, the signed-in exemplar app, the `/theme` style
  guide, and every manifest `dashboard.destinations` path.

### The canonical host (the mode split)

Absolute sitemap URLs need the deployed origin, which only the platform
knows. The generator reads `SITE_BASE_URL`, then `APP_BASE_URL` (the deploy
pipeline's live-site URL), then a `--base-url` flag. **Deployed**: the build
exports the host and both files carry absolute URLs plus a `Sitemap:` line.
**Sandbox / kernel checkout**: no host is set, so the sitemap emits
root-relative `<loc>` paths (flagged with a comment) and robots.txt omits its
`Sitemap:` line (that directive must be absolute) — a known limitation that
self-heals on the first deploy build.

## Structured data

Build the object with a helper from `@base/core` and render it with
`<JsonLd>` (serialization escapes `<`, so content can't break out of the
script tag):

```tsx
<JsonLd data={articleJsonLd({ headline, datePublished, authorName, url })} />
```

The blog pack is the exemplar: an open post (`?post=<slug>` — every article
has a crawlable URL wherever the blog is mounted) emits an Article with
headline, datePublished, author, description, canonical URL, and the brand
share image when one is committed. New structured-data shapes are new
builders in `web/core/src/Seo/SeoMeta.ts`, not inline JSON.

## Invariants (never break these)

- Document meta is never hand-set outside the meta kernel: no
  `document.title` writes, no hand-inserted meta tags — render `<PageMeta>`.
- Every public route declares meta or inherits the documented fallback.
- `sitemap.xml` and `robots.txt` are generated — never hand-edited; new
  public pages enter them through `repobot.project.json`, new exclusions
  through the generator.
- Structured data goes through `<JsonLd>` with a `@base/core` builder.
