# Pack: photography

Client-only category starter: a gallery-first photography portfolio at `web/app/src/View/Photography/`. The first of the category-named marketing starters (no bot persona): the work leads, the chrome recedes.

## What ships

- A multi-page portfolio on the landing kernel's image-led register (`atelier` preset, `docs/landing.md` "The photography-grade set"):
    - **Home** — full-bleed crossfade hero (the photograph IS the page), a justified selected-work gallery with lightbox, a short introduction, collection covers, and an inquiry CTA
    - **Work** (`/work`) — album collections as large cover tiles; each album opens via `?album=<slug>` on the same route (the BlogBot `?post=` pattern — adding an album is a content edit, never a route edit) into a justified, lightboxed gallery with its own sequencing
    - **About** (`/about`) — portrait beside the narrative, kind words from clients
    - **Inquire** (`/inquire`) — a detail form with date/location fields plus direct contact channels; submissions deliver through the platform's managed forms pipeline (`formKey: "inquiry"`) — the photographer gets an email and a dashboard entry with zero setup, and the email address shows as copyable text (never a `mailto:` link)
    - **Proofing** (`/proof?album=<slug>`) — unlisted, code-gated client galleries in selection mode: the client picks frames (persisted locally so they can return), adds an optional note, and sends the selection (`formKey: "proofing-selection"` with the exact frame ids). Not linked from the site nav — the photographer shares the link and code after a shoot
- **Everything renders from `content.ts`** — photographer, albums, about, testimonials, inquiry copy: one typed file; no backend, no CMS
- Demo portfolio: a coherent fictional portrait/editorial photographer (Mara Voss) with three sequenced albums, processed through `npm run image -- responsive` into `web/app/public/photography/` — every image ships intrinsic dimensions and a WebP `srcSet`, so pages load layout-shift-free and phones never download desktop files
- When the pack is active it owns `/`, `/work`, `/about`, and `/inquire`; otherwise the same pages preview under `/photography`, `/photography/work`, ...

Set [`../active.json`](../active.json) to `{ "key": "photography" }` to make this pack the home surface.

## Agent recipe: make it yours

- Change the photographer: edit `photographer`, `home`, `albums`, `about`, and `inquire` in `web/app/src/View/Photography/content.ts`.
- Swap in real photographs: run each original through `npm run image -- responsive <file> --out-dir web/app/public/photography --alt "..."` and paste the emitted media entry into the album's `images`. Never commit raw camera files into media slots.
- Sequencing is the craft: `justified` rows preserve your image order exactly (unlike masonry) — order each album the way the photographer would sequence a portfolio.
- Add an album: append to `albums` in `content.ts` with a unique `slug`; the work page's cover grid, the `?album=` detail view, and the home teaser all follow.
- Add a proofing gallery: append to `proofingAlbums` in `content.ts` with a unique `slug` and a 4–6 digit `accessCode`, then share `/proof?album=<slug>` plus the code with the client. Proofing albums never appear on `/work` or in the nav.
- Content tests guard the file: every image carries dimensions + alt text, album and proofing slugs stay unique, every proofing album carries a code.

## Non-goals for this pack

- True proofing access control and full-res delivery (the access code is soft privacy — it ships in the site bundle, like an unlisted video link; real auth and delivery are platform proofing v2)
- Auth / accounts, e-commerce print sales
- Server-side state — the shipped site is fully client-side; inquiries and proofing selections deliver through the platform's managed forms pipeline (email + dashboard), no backend needed
