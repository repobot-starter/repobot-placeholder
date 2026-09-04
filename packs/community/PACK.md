# Pack: community

Client-only category starter: a neighborhood association's site at `web/app/src/View/Community/`. Third starter in the `community` category (churches, nonprofits, community organizations) — the neighborhood newsletter set by a careful printer: gallery-white pages, tracked small-caps type, hairline rules, and documentary photography carrying all the warmth.

## What ships

- A multi-page site on the landing kernel (`atelier` preset — the gallery-quiet register: near-white walls, Inter tracked uppercase, zero radius, near-ink accent; `docs/landing.md`):
    - **Home** — the block-party photograph under the nameplate with a **computed "Next up" badge** (from `events`, the menu pack's open-badge discipline), the neighborhood's figures in a hairline stats row, four standing programs with documentary covers, the next three calendar dates, one neighbor's verdict, and the join card
    - **Events** (`/events`) — dated entries **split into upcoming vs. past at render time** with the soonest wearing a "Next up" badge; a passed date can never show as upcoming, and the past keeps accruing as the scrapbook
    - **Join** (`/join`) — annual dues as flat-rate tiers (household / senior / business; `period: "/yr"` with no billing toggle), a three-step how-it-works, and a membership form; submissions deliver through the platform's managed forms pipeline (`formKey: "join"`) — the membership chair gets an email and a dashboard entry with zero setup
    - **About** (`/about`) — the 1974 founding story, how meetings run, and the volunteer board as a ledger of rows with seeded marks instead of headshots
- **Join is the chrome's one CTA** — membership is the association's single ask, so it rides the nav onto every page as a quiet ink button
- **Everything renders from `content.ts`** — association, programs, events, dues, board, page copy: one typed file; no backend, no CMS
- Demo association: Fernhill Commons Neighborhood Association — twelve blocks photographed like a high-end photo essay (documentary, natural light), generated imagery processed through `npm run image -- responsive` into `web/app/public/community/`; every image ships intrinsic dimensions and a WebP `srcSet`
- When the pack is active it owns `/`, `/events`, `/join`, and `/about`; otherwise the same pages preview under `/community`, `/community/events`, ...

Set [`../active.json`](../active.json) to `{ "key": "community" }` to make this pack the home surface.

## Agent recipe: make it yours

- Change the association: edit `assoc`, `home`, `about`, and the collections in `web/app/src/View/Community/content.ts`.
- Add an event: append to `events` with an ISO local `start` (and `end` for multi-hour entries). The upcoming/past split, the "Next up" badge, and the home teaser all follow; leave past entries in place — they're the scrapbook.
- Change the dues: edit `membership.tiers` (numbers, rendered as `$N/yr`); keep tier features honest to what the association actually runs.
- Reseat the board: edit `board` — names, roles, one-line bios. Avatars are seeded generative marks, so no headshot wrangling; swap a member's `media` for a processed image entry if the association wants faces.
- Swap in real photographs: run each original through `npm run image -- responsive <file> --out-dir web/app/public/community --alt "..."` and paste the emitted entry into the matching slot. Never commit raw originals into media slots.
- Content tests guard the file: images carry dimensions + alt text and point at files that exist, event slugs stay unique with parseable dates, and the fidelity suite pins the catalog's landing seed to the code configs.

## Non-goals for this pack

- Dues payment processing or member accounts (dues collect in person or by whatever the association already uses; the form is the front door)
- Member directories, private minutes archives, backend state — the shipped site is fully client-side; forms deliver through the platform's managed forms pipeline (email + dashboard)
- Event RSVPs or ticketing (the calendar informs; the porch does the rest)
