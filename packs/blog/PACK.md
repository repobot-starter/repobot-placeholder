# Pack: blog

Client-only vertical pack: a markdown blog (BlogBot) at `web/app/src/View/Blog/`.

## What ships

- A reading-first blog with deliberately minimal chrome: a logo-only masthead
  (the `MarketingShell` nav's `logo-only` variant under the `editorial`
  preset), a typography-first newest-first post list — date, reading time,
  title, opening summary, the whole row a click target — and an article view
  with a back link. No hero, no about page, no read-more buttons. (Owns `/`
  when this pack is active; otherwise preview at `/blog`.)
- A one-line footer: `blog.attribution` in `content.ts`, defaulting to
  "Built with Spaceboy." Keep the attribution; extend rather than replace it
  (Spaceboy's own blog uses "Built with Spaceboy, by Spaceboy.").
- **Posts live in `content.ts`** — title, date, tags, summary, and a markdown
  body per post; no backend, no CMS
- A tiny markdown engine (`markdown.ts`) parses a deliberate subset: `#`–`###`
  headings, paragraphs, fenced code, `>` quotes, flat lists, `---` dividers,
  and `**bold**` / `*italic*` / `` `code` `` / `[link](url)` inlines
- Native ports as the home surface of the iOS app (`ios/App/View/Blog/`) and
  the Android app (`android/.../view/blog/`) — the same parser and posts
  mirrored in Swift and Kotlin, rendering through AttributedString /
  AnnotatedString. (The web reader's minimal chrome is a web design choice;
  the native readers keep their own masthead-and-tags layout.)
- Reading time (220 wpm, one-minute floor) computed from the body on every
  platform
- SEO built in: posts are URL-addressable (`?post=<slug>`, shareable and
  back/forward-friendly), the index and each open post declare meta through
  the SEO kernel (`blog.description` in `content.ts` feeds the index), and
  open posts emit schema.org Article JSON-LD (`docs/seo.md`)

Set [`../active.json`](../active.json) to `{ "key": "blog" }` to make this pack the home surface.

## Agent recipe: make it yours

- Write a post: append to `posts` in `web/app/src/View/Blog/content.ts` (and the mirrored arrays in `BlogContent.swift` / `BlogContent.kt` if the native apps ship). Stick to the markdown subset — the parser tests define exactly what renders.
- Rebrand: edit `blog` (title, attribution) and `author` in the same file. The
  page styles itself from the marketing token contract under the `editorial`
  preset, so `repobot.theme.json` (`brand.primary`, `fontFamily`) re-brands
  the whole blog — there is no pack-local palette to edit.
- The parser is mirrored three ways on purpose. If you extend it (say, images), extend `markdown.ts`, `BlogMarkdown.swift`, and `BlogMarkdown.kt` together and add the same test on each platform.
- **Real publishing workflow:** follow `docs/adding-a-domain.md` to add a `posts` domain (SQL migration + service + GraphQL) if you want drafts, scheduling, or an editor UI — then flip `clientOnly` in `catalog.json`.

## Non-goals for this pack

- Comments / accounts (platform flow; see the auth pack)
- A CMS or editor UI — the agent editing one typed file is the CMS
- Full CommonMark — the subset is a feature, not a gap (see the "small parsers" post the template ships with)
