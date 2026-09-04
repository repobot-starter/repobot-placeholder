# Pack: fitness-yoga

Client-only fitness-category starter: a yoga & pilates studio's site at `web/app/src/View/FitnessYoga/`. The strength club's quiet sibling — the same computable timetable (the weekly schedule is data in one content file; the site derives the wall chart AND the live "Next class / In session" badge from it), set on paper instead of rubber.

## What ships

- A five-page site on the landing kernel's `atelier` register (gallery-quiet: paper-white ground, hairline rules, tracked-caps display, near-ink accent; `docs/landing.md`) — the warmth all comes from the photography's bone, sand, and linen tones; the chrome never competes with the room:
    - **Home** — full-bleed sunlit hero with the live schedule badge, the room's story, **the week-grid schedule**, an editorial sequence of the spaces, a pull-quote, and the two-week introduction band
    - **Schedule** (`/schedule`) — the full weekly grid, practice every day of the week: today's column highlighted, the running class marked "In session", the single next class marked "Next", all computed from the clock by the schedule engine (`web/app/src/View/Landing/schedule.ts`)
    - **Teachers** (`/teachers`) — four teacher bios as full-frame portraits (the team section's `portraits` variant), then the founder's story
    - **Pricing** (`/pricing`) — mat and reformer membership tiers with a yearly rate, drop-ins and the introduction, and an FAQ that explains the mat/reformer split honestly
    - **Begin** (`/begin`) — the two-week-introduction detail form; submissions deliver through the platform's managed forms pipeline (`formKey: "intro-offer"`) — the owner gets an email and a dashboard entry with zero setup
- **Everything renders from `content.ts`** — the studio, the schedule entries (day/start/end/class/teacher as numbers and strings), teachers, prices, FAQ, the introduction: one typed file; no backend, no CMS
- Demo studio: a coherent fictional yoga & pilates studio (Stillwater, Santa Fe — sixteen mats, four reformer beds, one long shaft of light) with a nineteen-entry weekly schedule across all seven days, four teachers, and warm sunlit photography generated and processed through `npm run image -- responsive` into `web/app/public/fitness-yoga/`; every image ships intrinsic dimensions and a WebP `srcSet`
- When the pack is active it owns `/`, `/schedule`, `/teachers`, `/pricing`, and `/begin`; otherwise the same pages preview under `/yoga`, `/yoga/schedule`, ...

Set [`../active.json`](../active.json) to `{ "key": "fitness-yoga" }` to make this pack the home surface.

## Agent recipe: make it yours

- Change the studio: edit `studio`, `home`, `practice`, `founder`, and `intro` in `web/app/src/View/FitnessYoga/content.ts`.
- Change the timetable: edit `weeklySchedule` — `day` is the weekday index (0 = Sunday), `start`/`end` are minutes since midnight. The grid, the today highlight, and the live badge all follow; nothing else to touch.
- Swap in real photographs: run each original through `npm run image -- responsive <file> --out-dir web/app/public/fitness-yoga --alt "..."` and paste the emitted entry into the matching slot. Keep the art direction: warm neutrals in natural light — bone, sand, linen — on white rooms; the register's chrome is neutral by design and a saturated frame breaks it.
- Change prices: `memberships` (yearly must not exceed monthly — the content test enforces it) and `singleVisits`.
- Content tests guard the file: schedule entries stay inside a day and inside the week, teachers are never double-booked, every image carries dimensions + alt text, and the badge logic is pinned to instants.

## Non-goals for this pack

- Online booking / class reservations with capacity (the schedule informs; reservations are a booking-system upgrade — see `docs/adding-a-domain.md` if a project needs it)
- Member accounts, payments, or a portal
- Server-side state — the shipped site is fully client-side; introduction requests deliver through the platform's managed forms pipeline (email + dashboard), no backend needed
