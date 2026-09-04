# Pack: nonprofit

Client-only community-category starter: a mission-driven nonprofit's site at `web/app/src/View/Nonprofit/`. The annual report as a website — true black, monumental numbers typography, documentary field photography as the only color on the page, and a Donate plate that is the register's entire accent budget.

## What ships

- A multi-page site on the landing kernel (`monolith` preset — strict ink-and-paper at monumental scale; `docs/landing.md`):
    - **Home** — the fieldwork photograph under masthead type with a **computed "Next volunteer day" badge** (from the events file), the year's four numbers at display scale (`stats row`), program covers, a restored-reach case study, one neighbor's verdict at full width, and the inverted Donate plate
    - **Programs** (`/programs`) — four annual-report program spreads (alternating `content-split` with outcome bullets)
    - **Impact** (`/impact`) — the full ledger (`stats cards`, each number with its supporting sentence), the founder's letter, and three witnesses (`quote-grid`)
    - **Volunteer** (`/volunteer`) — dated volunteer days **split into upcoming vs. past at render time** with the soonest wearing a "Next up" badge (a passed date can never show as upcoming), how a crew day works, and a signup form; submissions deliver through the platform's managed forms pipeline (`formKey: "volunteer"`) — the org gets an email and a dashboard entry with zero setup
- **Donate is an external link** (`org.donateUrl`) rendered as the full-width band's one filled plate and as the closing plate — the org's own donation processor; no payments run through this site
- **Everything renders from `content.ts`** — mission, stats, programs, events, voices, page copy: one typed file; no backend, no CMS
- Demo org: The Waterline Project (Seattle) — urban creek restoration photographed like serious photojournalism (documentary, natural light, no charity clichés), generated imagery processed through `npm run image -- responsive` into `web/app/public/nonprofit/`; every image ships intrinsic dimensions and a WebP `srcSet`
- When the pack is active it owns `/`, `/programs`, `/impact`, and `/volunteer`; otherwise the same pages preview under `/nonprofit`, `/nonprofit/programs`, ...

Set [`../active.json`](../active.json) to `{ "key": "nonprofit" }` to make this pack the home surface.

## Agent recipe: make it yours

- Change the org: edit `org`, `home`, `impact`, `volunteer`, and the collections in `web/app/src/View/Nonprofit/content.ts`.
- Point Donate at the real donation page: set `org.donateUrl` (Givebutter, Donorbox, PayPal Giving — any external URL). Never wire payments into the site itself.
- Keep the numbers honest and typographic: `stats` (home) and `impactStats` (the ledger) take display strings — "92%", "$0.86", "212,000" — with the sentence that earns each one in `description`.
- Add a volunteer day: append to `events` with an ISO local `start` (and `end` for multi-hour/multi-day entries). The upcoming/past split, the "Next up" badge, and the home hero's next-day line all follow; leave past entries in place — they're the field record.
- Swap in real photographs: run each original through `npm run image -- responsive <file> --out-dir web/app/public/nonprofit --alt "..."` and paste the emitted entry into the matching slot. Never commit raw originals into media slots.
- Content tests guard the file: images carry dimensions + alt text and point at files that exist, event slugs stay unique with parseable dates, stats stay non-empty, and the fidelity suite pins the catalog's landing seed to the code configs.

## Non-goals for this pack

- Payment processing, donor accounts, receipts, or pledge management (Donate links out to the org's own processor)
- A CMS or blog — the impact page is the publication; add manifest marketing pages for anything more
- Auth / accounts, volunteer scheduling backends — the shipped site is fully client-side; forms deliver through the platform's managed forms pipeline (email + dashboard)
