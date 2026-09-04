# Pack: photography-music

Client-only category alternate: a music photographer's portfolio at `web/app/src/View/PhotographyMusic/`. Second starter in the `photography` category (after the portrait/editorial `photography` pack) — image-forward to the point of full-page frames: the site reads like a slide show in a dark room.

## What ships

- A multi-page portfolio on the landing kernel's image-led register (`marquee` preset — the stage-night register: true-black ground, white playbill caps, pushed film grain; `docs/landing.md` "The photography-grade set"):
    - **Home** — full-bleed crossfade hero (masthead type over the photograph), then **the reel**: gallery `sequence`, one photograph per near-viewport frame, full-bleed, lightboxed — scrolling the home page IS the portfolio. Collection covers, a short introduction, and a full-bleed booking CTA close it.
    - **Work** (`/work`) — the archive as large cover tiles; each album opens via `?album=<slug>` on the same route (adding an album is a content edit, never a route edit) into a justified, lightboxed gallery with its own sequencing
    - **About** (`/about`) — the photographer's story beside his portrait, pull-quote testimonials from the road
    - **Book** (`/book`) — a detail form with show-date/venue fields plus direct contact channels; submissions deliver through the platform's managed forms pipeline (`formKey: "booking"`) — the photographer gets an email and a dashboard entry with zero setup, and the email address shows as copyable text (never a `mailto:` link)
- **Everything renders from `content.ts`** — photographer, albums, reel, about, testimonials, booking copy: one typed file; no backend, no CMS
- Demo portfolio: a coherent fictional veteran music photographer (Vic Mercer, "thirty years side-stage") with three sequenced albums — Live (clubs/theaters), Festivals (fields/dust/dawn), The Studio (between takes) — in a vintage classic-rock register, generated imagery processed through `npm run image -- responsive` into `web/app/public/photography-music/`; every image ships intrinsic dimensions and a WebP `srcSet`, so pages load layout-shift-free and phones never download desktop files
- When the pack is active it owns `/`, `/work`, `/about`, and `/book`; otherwise the same pages preview under `/photography-music`, `/photography-music/work`, ...

Set [`../active.json`](../active.json) to `{ "key": "photography-music" }` to make this pack the home surface.

## Agent recipe: make it yours

- Change the photographer: edit `photographer`, `home`, `albums`, `reel`, `about`, and `book` in `web/app/src/View/PhotographyMusic/content.ts`.
- Swap in real photographs: run each original through `npm run image -- responsive <file> --out-dir web/app/public/photography-music --alt "..."` and paste the emitted media entry into the album's `images`. Never commit raw camera files into media slots.
- Sequencing is the craft: the home `reel` shows one frame per viewport in array order — treat it like a set list (open loud, breathe in the middle, close loud). Wide frames read best at full bleed.
- Add an album: append to `albums` in `content.ts` with a unique `slug`; the work page's cover grid, the `?album=` detail view, and the home collections teaser all follow.
- Content tests guard the file: every image carries dimensions + alt text, album slugs stay unique, and the reel only shows frames that exist in the albums.

## Non-goals for this pack

- Client proofing (the portrait/editorial `photography` pack ships the proofing room; a music archive sells licensing, not proof sheets)
- Auth / accounts, e-commerce print sales
- Server-side state — the shipped site is fully client-side; bookings deliver through the platform's managed forms pipeline (email + dashboard), no backend needed
