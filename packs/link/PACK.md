# Pack: link

Client-only vertical pack: a link-in-bio page (LinkBot) at `web/app/src/View/Link/`.

## What ships

- A single-column bio page: avatar, name/handle/bio, social monogram chips, link rows with hover lift, a share button (Web Share API with clipboard fallback), and a "Made with LinkBot" footer (owns `/` when this pack is active; otherwise preview at `/link`)
- Four theme palettes (Midnight, Sunrise, Meadow, Paper) cycled by footer swatches; the visitor's pick persists in localStorage
- **Everything renders from `content.ts`** — profile, links, socials, and themes are one typed file; no backend, no CMS
- Native ports as the home surface of the iOS app (`ios/App/View/Link/`) and the Android app (`android/.../view/link/`) — same content mirrored in `LinkContent.swift` / `LinkContent.kt`, links open in the browser, share uses the native share sheet, theme persists via AppStorage / SharedPreferences

Set [`../active.json`](../active.json) to `{ "key": "link" }` to make this pack the home surface.

## Agent recipe: make it yours

- Change the person: edit `profile`, `links`, and `socials` in `web/app/src/View/Link/content.ts` (and the mirrored constants in `LinkContent.swift` / `LinkContent.kt` if the native apps ship).
- Add a palette: append to the `themes` array — the swatch row and persistence pick it up automatically.
- Add a link category header, a featured/pinned row, or click analytics via a lightweight counter; the row markup lives in `LinkPage.tsx`.
- Content tests guard the file: `web/app/tests/View/Link/`, `ios/AppTests/LinkContentTests.swift`, and `android/.../LinkContentTest.kt` fail if a URL drops https or labels collide.

## Non-goals for this pack

- Auth / accounts (platform flow; see the auth pack)
- Server-side state — the shipped page is fully client-side (add a domain per `docs/adding-a-domain.md` and flip `clientOnly` if you need click tracking)
