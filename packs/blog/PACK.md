# Pack: blog

Client-only vertical pack: a markdown blog (BlogBot) at `web/app/src/View/Blog/`.

## What ships

- A reading-first blog: masthead with author card, tag filter chips (derived from post tags), a newest-first post list with reading times, and an article view with a back link (owns `/` when this pack is active; otherwise preview at `/blog`)
- **Posts live in `content.ts`** — title, date, tags, summary, and a markdown body per post; no backend, no CMS
- A tiny markdown engine (`markdown.ts`) parses a deliberate subset: `#`–`###` headings, paragraphs, fenced code, `>` quotes, flat lists, `---` dividers, and `**bold**` / `*italic*` / `` `code` `` / `[link](url)` inlines
- Native ports as the home surface of the iOS app (`ios/App/View/Blog/`) and the Android app (`android/.../view/blog/`) — the same parser and posts mirrored in Swift and Kotlin, rendering through AttributedString / AnnotatedString
- Reading time (220 wpm, one-minute floor) computed from the body on every platform

Set [`../active.json`](../active.json) to `{ "key": "blog" }` to make this pack the home surface.

## Agent recipe: make it yours

- Write a post: append to `posts` in `web/app/src/View/Blog/content.ts` (and the mirrored arrays in `BlogContent.swift` / `BlogContent.kt` if the native apps ship). Stick to the markdown subset — the parser tests define exactly what renders.
- Rebrand: edit `blog` and `author` in the same file; the accent color and type ramp live in `BlogPage.styles.css.ts`.
- The parser is mirrored three ways on purpose. If you extend it (say, images), extend `markdown.ts`, `BlogMarkdown.swift`, and `BlogMarkdown.kt` together and add the same test on each platform.
- **Real publishing workflow:** follow `docs/adding-a-domain.md` to add a `posts` domain (SQL migration + service + GraphQL) if you want drafts, scheduling, or an editor UI — then flip `clientOnly` in `catalog.json`.

## Non-goals for this pack

- Comments / accounts (platform flow; see the auth pack)
- A CMS or editor UI — the agent editing one typed file is the CMS
- Full CommonMark — the subset is a feature, not a gap (see the "small parsers" post the template ships with)
