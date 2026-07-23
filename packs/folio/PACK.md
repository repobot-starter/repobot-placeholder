# Pack: folio

Client-only vertical pack: an editorial one-page portfolio (FolioBot) at `web/app/src/View/Folio/`.

## What ships

- A paper-and-ink portfolio: availability badge, serif hero statement, filterable project grid (tag chips derive from project tags), about section with a skills cloud, and a mailto contact CTA (owns `/` when this pack is active; otherwise preview at `/folio`)
- **Everything renders from `content.ts`** — profile, projects, about, and socials are one typed file; no backend, no CMS
- Project cards use emoji-on-accent artwork so the template looks finished with zero image assets; swap in real screenshots by replacing the art block
- Native ports as the home surface of the iOS app (`ios/App/View/Folio/`) and the Android app (`android/.../view/folio/`) — same content mirrored in `FolioContent.swift` / `FolioContent.kt`, with tag filtering and mail/browser handoff

Set [`../active.json`](../active.json) to `{ "key": "folio" }` to make this pack the home surface.

## Agent recipe: make it yours

- Change the person: edit `profile`, `projects`, `about`, and `socials` in `web/app/src/View/Folio/content.ts` (and the mirrored constants in `FolioContent.swift` / `FolioContent.kt` if the native apps ship).
- The hero italicizes the statement's last word automatically — write a sentence that ends on the word you want art-directed.
- Add a case-study page per project by following the existing route pattern in `App.tsx`; add real project images by replacing the emoji art block in `FolioPage.tsx`.
- Content tests guard the file on all three platforms: unique titles, https URLs, and tag-chip integrity.

## Non-goals for this pack

- Auth / accounts (platform flow; see the auth pack)
- Server-side state — the shipped site is fully client-side (add a domain per `docs/adding-a-domain.md` and flip `clientOnly` for a contact-form inbox)
