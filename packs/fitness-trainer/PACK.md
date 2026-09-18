# Pack: fitness-trainer

Client-only fitness-category starter: a strength coach's personal-brand site at `web/app/src/View/FitnessTrainer/`. The category's third register — one coach, one book, one continuous photo shoot — with the same computable timetable as its siblings (the training week is data in one content file; the site derives the day-rows chart AND the live "Next session / In session" badge from it).

## What ships

- A four-page site on the landing kernel's `monolith` register (true black, monumental type with the closing word stroke-only, hairline rules, zero color; `docs/landing.md`) — all the atmosphere comes from the photography: a single hard light in a nearly black gym, one continuous shoot:
    - **Home** — full-bleed hero with the live session badge, a proof row (years, clients, slots, retention), the coach's bio with credentials as a ruled list, **the training week as day rows** (1:1 windows and small-group hours; Wednesdays and Sundays deliberately dark), a featured client quote, and the free-consult band
    - **Programs** (`/programs`) — small group / 1:1 / online as pricing tiers with yearly rates, the apply → consult → assess → train timeline, and an FAQ that answers like a person
    - **Results** (`/results`) — the proof row, a full-bleed filmstrip of the floor, and client quotes; no before-and-after photos by design
    - **Apply** (`/apply`) — the free-consult application; submissions deliver through the platform's managed forms pipeline (`formKey: "free-consult"`) — the owner gets an email and a dashboard entry with zero setup
- **Everything renders from `content.ts`** — the coach, the training-week entries (day/start/end/block as numbers and strings), programs, process, FAQ, the consult offer: one typed file; no backend, no CMS
- Demo coach: a coherent fictional strength coach (Dara Quinn, Chicago's West Loop — twelve years coaching, eighteen client slots, desk-worker specialty) with a ten-entry training week, three programs, and moody single-light photography generated and processed through `npm run image -- responsive` into `web/app/public/fitness-trainer/`; every image ships intrinsic dimensions and a WebP `srcSet`
- When the pack is active it owns `/`, `/programs`, `/results`, and `/apply`; otherwise the same pages preview under `/trainer`, `/trainer/programs`, ...

Set [`../active.json`](../active.json) to `{ "key": "fitness-trainer" }` to make this pack the home surface.

## Agent recipe: make it yours

- Change the coach: edit `trainer`, `bio`, `home`, and `consult` in `web/app/src/View/FitnessTrainer/content.ts`.
- Change the book: edit `trainingWeek` — `day` is the weekday index (0 = Sunday), `start`/`end` are minutes since midnight; `title` is the block ("1:1 blocks", "Small group"), `instructor` is the capacity note. The day rows, the today mark, and the live badge all follow; nothing else to touch.
- Swap in real photographs: run each original through `npm run image -- responsive <file> --out-dir web/app/public/fitness-trainer --alt "..."` and paste the emitted entry into the matching slot. Keep the art direction: one shoot, one hard light, muted color on near-black — the register's chrome is pure black and white and a bright frame breaks it.
- Change prices: `programs` (yearly must not exceed monthly — the content test enforces it).
- Content tests guard the file: week entries stay inside a day and inside the week, blocks never overlap, every image carries dimensions + alt text, and the badge logic is pinned to instants.

## Non-goals for this pack

- Online booking with real calendar slots (the week informs; scheduling is a booking-system upgrade — see `docs/adding-a-domain.md` if a project needs it)
- Client accounts, payments, or a training log portal
- Server-side state — the shipped site is fully client-side; applications deliver through the platform's managed forms pipeline (email + dashboard), no backend needed
