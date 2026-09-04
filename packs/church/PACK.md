# Pack: church

Client-only category starter: a neighborhood church's site at `web/app/src/View/Church/`. First starter in the `community` category (churches, nonprofits, community organizations) — the midnight service as a website: warm near-black ground, monumental uppercase type, hairline rules, concert-grade night photography (haze, silhouettes, one amber light source), and one candle-amber accent that belongs to the CTAs. A venue's conviction, not a parish newsletter — reverence through boldness, aimed at the congregation's next generation.

## What ships

- A multi-page site on the landing kernel (`hymnal` preset — the midnight-service register: warm near-black ground under grain, monumental uppercase Space Grotesk, hairline rules, one candle-amber accent and a slow beam; `docs/landing.md`):
    - **Home** — the congregation photograph under masthead type with a **computed "Next service" badge** (from `serviceTimes`, the menu pack's open-badge discipline), the week's service times set like a setlist between hairline rules, a word from the pastor, ministry covers, the next three events, and the full-bleed amber Give band
    - **Visit** (`/visit`) — what a first Sunday actually looks like (timeline), the practical details, and a plan-a-visit form; submissions deliver through the platform's managed forms pipeline (`formKey: "plan-visit"`) — the office gets an email and a dashboard entry with zero setup
    - **Ministries** (`/ministries`) — six ministries with stage-lit night photographs
    - **Sermons** (`/sermons`) — the archive as a printed index: passage, date, summary, filterable by series and speaker
    - **Events** (`/events`) — dated entries **split into upcoming vs. past at render time** with the soonest wearing a "Next up" badge; a passed date can never show as upcoming
- **Give is an external link** (`church.giveUrl`) in the nav and the closing cards — the church's own giving processor; no payments run through this site
- **Everything renders from `content.ts`** — congregation, service times, ministries, sermons, events, page copy: one typed file; no backend, no CMS
- Demo congregation: Bellwood Community Church (Bellingham, WA) — a modest congregation photographed like a music venue after dark (one amber source against true black, haze and silhouettes, film grain), generated imagery processed through `npm run image -- responsive` into `web/app/public/church/`; every image ships intrinsic dimensions and a WebP `srcSet`
- When the pack is active it owns `/`, `/visit`, `/ministries`, `/sermons`, and `/events`; otherwise the same pages preview under `/church`, `/church/visit`, ...

Set [`../active.json`](../active.json) to `{ "key": "church" }` to make this pack the home surface.

## Agent recipe: make it yours

- Change the congregation: edit `church`, `home`, `visit`, and the collections in `web/app/src/View/Church/content.ts`.
- Point Give at the real giving page: set `church.giveUrl` (Tithe.ly, Planning Center Giving, PayPal — any external URL). Never wire payments into the site itself.
- Update service times in `serviceTimes` (day + minutes since midnight) — the hero badge recomputes itself — and keep the human-readable `serviceSchedule` rows in step.
- Add an event: append to `events` with an ISO local `start` (and `end` for multi-hour/multi-day entries). The upcoming/past split, the "Next up" badge, and the home teaser all follow; leave past entries in place — they're the archive.
- Add a sermon: prepend to `sermons` (most recent first). Series names become the archive's filter chips.
- Swap in real photographs: run each original through `npm run image -- responsive <file> --out-dir web/app/public/church --alt "..."` and paste the emitted entry into the matching slot. Never commit raw originals into media slots.
- Content tests guard the file: images carry dimensions + alt text and point at files that exist, event slugs stay unique with parseable dates, and the fidelity suite pins the catalog's landing seed to the code configs.

## Non-goals for this pack

- Payment processing, donor accounts, or giving statements (Give links out to the church's own processor)
- Sermon audio/video hosting (the archive lists and summarizes; link a podcast host from the copy when there is one)
- Auth / accounts, member directories, backend state — the shipped site is fully client-side; forms deliver through the platform's managed forms pipeline (email + dashboard)
