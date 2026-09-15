# Pack: wedding

Client-only category starter: a wedding photographer's studio site at `web/app/src/View/Wedding/`. The photography category's second template — gallery-first like photography, but a service business, not a portfolio, and it wears its own register: the romantic `heirloom` preset (Fraunces serif, warm ivory, dried-rose claret) instead of photography's gallery-quiet `atelier`, packages with flat prices, an FAQ that closes deals, and copy addressed to couples.

## What ships

- A multi-page studio site on the landing kernel's romantic stationery register (`heirloom` preset, `docs/landing.md` "The photography-grade set"):
    - **Home** — full-bleed crossfade hero (one frame from each wedding), a short introduction (the person before the work), a filmstrip selected-work rail with lightbox, the flat-priced packages as a teaser, one featured testimonial (`single-featured`), wedding covers, and a full-bleed inquiry CTA
    - **Weddings** (`/weddings`) — real weddings as large cover tiles; each opens via `?wedding=<slug>` on the same route (the BlogBot `?post=` pattern — adding a wedding is a content edit, never a route edit) into a justified, lightboxed gallery sequenced the way the day happened
    - **Packages** (`/packages`) — three flat-priced packages on the pricing section (`period: ""` suppresses the SaaS "/mo" reading; equal monthly/yearly suppresses the billing toggle) plus an FAQ accordion of the questions couples actually ask
    - **About** (`/about`) — portrait beside the narrative, kind words from couples and their families
    - **Inquire** (`/inquire`) — a detail form with date/venue fields plus direct contact channels; submissions deliver through the platform's managed forms pipeline (`formKey: "inquiry"`) — the photographer gets an email and a dashboard entry with zero setup, and the email address shows as copyable text (never a `mailto:` link)
    - **Proofing** (`/proof?album=<slug>`) — unlisted, code-gated client galleries in selection mode: the couple and their families pick frames (persisted locally so they can return), add an optional note, and send the selection (`formKey: "proofing-selection"` with the exact frame ids). Not linked from the site nav — the photographer shares the link and code after the wedding
- **Everything renders from `content.ts`** — photographer, weddings, packages, FAQ, about, testimonials, proofing, inquiry copy: one typed file; no backend, no CMS
- Demo portfolio: a coherent fictional coastal-Maine wedding photographer (Isla Hart) with three sequenced weddings — a fogged-in headland ceremony, an October barn wedding, a January city-hall elopement — processed through `npm run image -- responsive` into `web/app/public/wedding/`; every image ships intrinsic dimensions and a WebP `srcSet`, so pages load layout-shift-free and phones never download desktop files
- When the pack is active it owns `/`, `/weddings`, `/packages`, `/about`, and `/inquire`; otherwise the same pages preview under `/wedding`, `/wedding/weddings`, ...

Set [`../active.json`](../active.json) to `{ "key": "wedding" }` to make this pack the home surface.

## Agent recipe: make it yours

- Change the photographer: edit `photographer`, `home`, `albums`, `packages`, `faq`, `about`, and `inquire` in `web/app/src/View/Wedding/content.ts`.
- Swap in real photographs: run each original through `npm run image -- responsive <file> --out-dir web/app/public/wedding --alt "..."` and paste the emitted media entry into the wedding's `images`. Never commit raw camera files into media slots.
- Sequencing is the craft: `justified` rows preserve your image order exactly (unlike masonry) — order each wedding the way the day happened: getting ready, ceremony, details, the party, the goodnight.
- Add a wedding: append to `albums` in `content.ts` with a unique `slug`; the weddings page's cover grid, the `?wedding=` detail view, and the home teaser all follow.
- Reprice the packages: edit `packages` — flat dollar amounts, feature lists, and which package is `highlighted` (keep exactly one; the page reads better with a spine).
- Add a proofing gallery: append to `proofingAlbums` in `content.ts` with a unique `slug` and a 4–6 digit `accessCode`, then share `/proof?album=<slug>` plus the code with the couple. Proofing albums never appear on `/weddings` or in the nav.
- Content tests guard the file: every image carries dimensions + alt text, wedding and proofing slugs stay unique, every proofing album carries a code, package prices stay positive, exactly one package is highlighted.

## Non-goals for this pack

- Booking / availability calendars and contracts (inquiries deliver through managed forms; scheduling is a platform capability, not a content pack's)
- True proofing access control and full-res delivery (the access code is soft privacy — it ships in the site bundle, like an unlisted video link; real auth and delivery are platform proofing v2)
- Auth / accounts, e-commerce print or album sales
- Server-side state — the shipped site is fully client-side; inquiries and proofing selections deliver through the platform's managed forms pipeline (email + dashboard), no backend needed
