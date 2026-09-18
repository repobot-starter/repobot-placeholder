# Pack: reunion

Client-only category starter: a family gathering's home base at `web/app/src/View/Reunion/`. The weddings-and-events category's third register: the demo weekend is a fortieth family reunion at a New Hampshire lake, but the shape fits any recurring gathering — a class reunion, a fiftieth-birthday campout, the annual cousins' weekend. A weekend page, a memory wall, and one ask: the head count. Told on the picnic register's 2 PM lawn.

## What ships

- Three pages on the landing kernel's `picnic` register (the backyard-party look: sunny cream paper, one tomato accent, marigold and sky washes, name-tag pill controls, snapshots that tilt like photos passed around the table):
    - **Home** — masthead hero over the long-table photograph with a **live countdown badge** ("351 days till the lake" — computed, never hand-written); the organizers' welcome note; the **weekend at a glance** as numbered day cards (roll in Friday, the big Saturday, one more pancake Sunday); the activities as photo cards (the lake, the tournament, the campfire); a scrapbook teaser from the memory wall; a closing head-count banner carrying the computed reply-by nudge
    - **Memory wall** (`/memories`) — the full-bleed scrapbook gallery with lightbox, captions in the family voice, and the shoebox rule (send scans, the wall grows) — the page relatives keep revisiting between summers
    - **RSVP** (`/rsvp`) — one reply per household: name, email, **attending / head-count / lodging selects**, the potluck-dish claim, and a notes field, delivering through the platform's managed forms pipeline (`formKey: "reunion-rsvp"`) — the organizers get an email and a dashboard entry with zero setup. The FAQ answers the reunion questions (kids and dogs, what's provided, rain, where to sleep) so the organizers never have to
- **Everything renders from `content.ts`** — the family, the weekend, the activities, the wall, the RSVP copy: one typed file; no backend, no CMS. The countdown labels are computed from that data per render by `countdown.ts` (the estate listings engine's idiom): day-of the badge flips to "It's reunion weekend", after to "Until next summer" — the site outlives the weekend as the album from it
- Demo weekend: a coherent fictional gathering (the Calloways' fortieth, Birch Point on Lake Winnisquam, August 2027) with eight photographs — the long table, the dock, the cornhole toss, the campfire, and four period "scans" for the memory wall — processed through `npm run image -- responsive` into `web/app/public/reunion/`; every image ships intrinsic dimensions and a WebP `srcSet`
- When the pack is active it owns `/`, `/memories`, and `/rsvp`; otherwise the same pages preview under `/reunion/*`

Set [`../active.json`](../active.json) to `{ "key": "reunion" }` to make this pack the home surface.

## Agent recipe: make it yours

- Change the gathering: edit `reunion` in `web/app/src/View/Reunion/content.ts` — title, family name, dates, venue, organizers. `startDateIso` drives the hero countdown and `rsvp.replyByIso` drives the head-count nudge; the labels recompute per render, so never hand-write a number of days into copy.
- Change the weekend: `weekend.days` is the day-card list — a label, a title, one good paragraph each. Keep the jokes; they're what make it read like a family wrote it.
- Grow the wall: `memories.photos` — run each scan through the responsive verb (below) and give it a caption with a year. The wall is the pack's soul; more photos beat better photos.
- Swap in real photographs: run each original through `npm run image -- responsive <file> --out-dir web/app/public/reunion --alt "..."` and paste the emitted media entry into the slot. Scans count too — never commit raw camera files or raw scans into media slots.
- Tune the head count: `rsvp.fields` — the headcount select tops out at "8+" (edit the options for bigger crews), the lodging select should list your actual options, and the potluck field is first-come-first-claimed by design. Replies deliver to the owner's email and dashboard through managed forms.
- Content tests guard the file: every image carries dimensions + alt text, dates stay ISO-formed, the weekend / activities / wall / FAQ meet the contract minimums, and the clock engine's labels are pinned at fixed instants.

## Non-goals for this pack

- Guest accounts, shared photo uploads, or a comment wall (the memory wall grows by email — the shoebox rule — not by user-generated content; an agent can wire uploads on request)
- Ticketing or payments (the reunion fund is a coffee can, not a checkout)
- A password gate (an agent can add one on request)
- Server-side state — the shipped site is fully client-side; RSVPs deliver through the platform's managed forms pipeline (email + dashboard), no backend needed
