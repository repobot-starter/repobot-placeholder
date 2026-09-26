# Pack: reunion

Client-only category starter: a family gathering's home base at `web/app/src/View/Reunion/`. The weddings-and-events category's third register: the demo weekend is a fortieth family reunion at a New Hampshire lake, but the shape fits any recurring gathering — a class reunion, a fiftieth-birthday campout, the annual cousins' weekend. A weekend page, a memory wall, and one ask: the head count. Told on the picnic register's 2 PM lawn.

## What ships

- Three pages on the landing kernel's `picnic` register (the backyard-party look: sunny cream paper, one tomato accent, marigold and sky washes, name-tag pill controls, snapshots that tilt like photos passed around the table):
    - **Home** — masthead hero over the long-table photograph with a **live countdown badge** ("351 days till the lake" — computed, never hand-written); the organizers' welcome note; the **weekend at a glance** as numbered day cards (roll in Friday, the big Saturday, one more pancake Sunday); the activities as photo cards (the lake, the tournament, the campfire); a scrapbook teaser from the memory wall; a closing head-count banner carrying the computed reply-by nudge
    - **Memory wall** (`/memories`) — the full-bleed scrapbook gallery with lightbox, captions in the family voice, and the shoebox rule (send scans, the wall grows) — the page relatives keep revisiting between summers
    - **RSVP** (`/rsvp`) — one reply per household: name, email, **attending / head-count / lodging selects**, the potluck-dish claim, and a notes field, delivering through the platform's managed forms pipeline (`formKey: "reunion-rsvp"`) — the organizers get an email and a dashboard entry with zero setup. The FAQ answers the reunion questions (kids and dogs, what's provided, rain, where to sleep) so the organizers never have to
- **Everything renders from `content.ts`** — the family, the weekend, the activities, the wall, the RSVP copy: one typed file; no backend, no CMS. The countdown labels are computed from that data per render by `countdown.ts` (the estate listings engine's idiom) in the family's words (`landingCopy.countdown` / `landingCopy.nudge`): day-of the badge flips to "It's reunion weekend", after to "Until next summer" — the site outlives the weekend as the album from it
- The content-driven sections ship empty on this weekend and render once filled: the full schedule (each day's timed `items`, with `weekend.intro`), lodging by family branch (`lodging`), the family branches as a head count (`branches`), getting there (`gettingThere`), and the pack list (`packing`). `home.layout: "poster"` swaps the lawn composition for the rodeo bill (see below)
- Demo weekend: a coherent fictional gathering (the Calloways' fortieth, Birch Point on Lake Winnisquam, August 2027) with eight photographs — the long table, the dock, the cornhole toss, the campfire, and four period "scans" for the memory wall — processed through `npm run image -- responsive` into `web/app/public/reunion/`; every image ships intrinsic dimensions and a WebP `srcSet`
- One derived template rides the same pages with its own seed, register, and pinned skeletons (see `packs/README.md` "Derived templates"): `reunion-rodeo` (the Calloways riding again at a desert guest ranch outside Wickenburg, Arizona, `rodeo`) — the poster layout with every content-driven section filled, the "C" brand mark, and the inline ranch-sign nav its theme pins
- When the pack is active it owns `/`, `/memories`, and `/rsvp`; otherwise the same pages preview under `/reunion/*`

Set [`../active.json`](../active.json) to `{ "key": "reunion" }` to make this pack the home surface.

## Register and special fields

Every field below belongs to a section _variant_, not to the register, so a remix to any other `style.preset` keeps it; the register only restyles it (docs/landing-content.md → "The registers" lists every preset and treatment). Text is click-to-edit and photographs Replace-able in the preview editor, and the content paths named are Content-panel slots in `catalog.json`'s `contentContract` (switches such as `home.layout` stay in code).

- **Registers**: `picnic` (`tilt`, `glow`) here; reunion-rodeo wears `rodeo` (`lariat`, `grain`).
- **Home layout** (`home.layout`): `lawn` — the `masthead-overlay` hero, the note, the weekend as `numbered-cards`, the activities as a `3up` card grid; `poster` — the `split-media` hero (the headline's last line in the accent, `credit` from `reunion.ribbon`, `seal` from `reunion.seal`), the activities as a `horizontal-rail` of stops stamped with `activities.items[].when`, then the note, with the `ticket` banner and accented statement headlines on every page.
- **Weekend**: the schedule's `day-rows` items carry `time`, `title` and a `detail` line (`weekend.days[].items[].detail`); packing is a `feature-grid` `checklist` (`packing.cardTitle`, `packing.body`).
- **Nav**: the logo and the nav's own links are `landingCopy` (`navName`, `navTagline`, `navMarkSrc`, `navLinks`; a `/#section` path lands on a home section), and a catalog's theme `navigation.variant` outranks the pill links.

## Agent recipe: make it yours

- Change the gathering: edit `reunion` in `web/app/src/View/Reunion/content.ts` — title, family name, dates, venue, organizers. `startDateIso` drives the hero countdown and `rsvp.replyByIso` drives the head-count nudge; the labels recompute per render, so never hand-write a number of days into copy.
- Change the weekend: `weekend.days` is the day-card list — a label, a title, one good paragraph each; give the days timed `items` and the full schedule appears. Keep the jokes; they're what make it read like a family wrote it.
- Add the practical sections when the weekend needs them: `lodging.rooms` (with a photograph), `branches.items`, `gettingThere.steps`, and `packing.items` (with a photograph) each render once filled.
- Change the voice: `landingCopy` carries the countdown and nudge wording (`{days}` and `{label}` are filled per render), the nav, and the page titles that name the gathering.
- Grow the wall: `memories.photos` — run each scan through the responsive verb (below) and give it a caption with a year. The wall is the pack's soul; more photos beat better photos.
- Swap in real photographs: run each original through `npm run image -- responsive <file> --out-dir web/app/public/reunion --alt "..."` and paste the emitted media entry into the slot. Scans count too — never commit raw camera files or raw scans into media slots.
- Tune the head count: `rsvp.fields` — the headcount select tops out at "8+" (edit the options for bigger crews), the lodging select should list your actual options, and the potluck field is first-come-first-claimed by design. Replies deliver to the owner's email and dashboard through managed forms.
- Content tests guard the file: every image carries dimensions + alt text, dates stay ISO-formed, the weekend / activities / wall / FAQ meet the contract minimums, and the clock engine's labels are pinned at fixed instants.

## Non-goals for this pack

- Guest accounts, shared photo uploads, or a comment wall (the memory wall grows by email — the shoebox rule — not by user-generated content; an agent can wire uploads on request)
- Ticketing or payments (the reunion fund is a coffee can, not a checkout)
- A password gate (an agent can add one on request)
- Server-side state — the shipped site is fully client-side; RSVPs deliver through the platform's managed forms pipeline (email + dashboard), no backend needed
