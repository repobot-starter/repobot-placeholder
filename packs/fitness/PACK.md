# Pack: fitness

Client-only category starter: a boutique strength studio's site at `web/app/src/View/Fitness/`. First starter in the `fitness` category — the timetable made computable: the weekly class schedule is data in one content file, and the site derives the wall chart AND the live "Next class / In session" badge from it.

## What ships

- A five-page site on the landing kernel's `chalk` register (the training floor: near-black rubber ground, chalk-bone stenciled signage, hairline rules, dust grain — strictly monochrome, so the high-contrast black-and-white photography carries all tone; `docs/landing.md`):
    - **Home** — full-bleed black-and-white hero with the live schedule badge, the club's numbers, **the week-grid schedule**, a full-bleed filmstrip of the floor, a pull-quote from a member, and the free-week closing band
    - **Schedule** (`/schedule`) — the full weekly grid: today's column highlighted, the running class marked "In session", the single next class marked "Next", all computed from the clock by the schedule engine (`web/app/src/View/Landing/schedule.ts`, the timetable sibling of the menu pack's hours engine — pure, clock-passed, tested against pinned instants)
    - **Coaches** (`/coaches`) — four coach bios with photographs, then the story of the room
    - **Pricing** (`/pricing`) — three month-to-month membership tiers with a yearly rate, class packs and drop-ins, and an FAQ that answers the contract question honestly
    - **Trial** (`/trial`) — the free-week detail form; submissions deliver through the platform's managed forms pipeline (`formKey: "free-trial"`) — the owner gets an email and a dashboard entry with zero setup
- **Everything renders from `content.ts`** — the club, the schedule entries (day/start/end/class/instructor as numbers and strings), coaches, prices, FAQ, the trial offer: one typed file; no backend, no CMS
- Demo club: a coherent fictional strength studio (Foundry Strength Club, Eastern Market, Detroit — a stamping plant that now presses people) with an 18-entry weekly schedule across six days, four coaches, and black-and-white photography generated and processed through `npm run image -- responsive` into `web/app/public/fitness/`; every image ships intrinsic dimensions and a WebP `srcSet`
- When the pack is active it owns `/`, `/schedule`, `/coaches`, `/pricing`, and `/trial`; otherwise the same pages preview under `/fitness`, `/fitness/schedule`, ...

Set [`../active.json`](../active.json) to `{ "key": "fitness" }` to make this pack the home surface.

## Agent recipe: make it yours

- Change the club: edit `gym`, `home`, `stats`, `story`, and `trial` in `web/app/src/View/Fitness/content.ts`.
- Change the timetable: edit `weeklySchedule` — `day` is the weekday index (0 = Sunday), `start`/`end` are minutes since midnight. The grid, the today highlight, and the live badge all follow; nothing else to touch.
- Swap in real photographs: run each original through `npm run image -- responsive <file> --out-dir web/app/public/fitness --alt "..."` and paste the emitted entry into the matching slot. Keep the art direction: high-contrast black and white — the chrome is monochrome by design, and a color frame breaks the register.
- Change prices: `memberships` (yearly must not exceed monthly — the content test enforces it) and `classPacks`.
- Content tests guard the file: schedule entries stay inside a day and inside the week, every image carries dimensions + alt text, and the badge logic is pinned to instants.

## Non-goals for this pack

- Online booking / class reservations with capacity (the schedule informs; reservations are a booking-system upgrade — see `docs/adding-a-domain.md` if a project needs it)
- Member accounts, payments, or a portal
- Server-side state — the shipped site is fully client-side; trial requests deliver through the platform's managed forms pipeline (email + dashboard), no backend needed
