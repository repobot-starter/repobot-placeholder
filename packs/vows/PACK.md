# Pack: vows

Client-only category starter: a classic wedding website at `web/app/src/View/Vows/`. The first starter of the `weddings-and-events` category: the demo couple marries at a Hudson Valley garden estate, but the shape is the one every wedding needs — the story, the weekend, the logistics, and one ask (the RSVP), told on the heirloom register's invitation stationery.

## What ships

- A multi-page wedding site on the landing kernel's `heirloom` register (the romantic-editorial look: warm ivory stock, Fraunces serif with an italic flourish, champagne hairlines, botanical green — the invitation suite itself):
    - **Home** — masthead hero over the couple's engagement photograph with a **live countdown badge** ("289 days to go" — computed, never hand-written) and the RSVP ask; the couple's welcome note set narrow like the inside of the invitation; the weekend at a glance on a timeline; venue cover tiles; an engagement gallery; a closing RSVP banner carrying the **computed reply-by nudge**
    - **Our story** (`/story`) — the couple's story in alternating photo chapters (the bookstore, the proposal, home now) and the engagement-session gallery with a lightbox
    - **Schedule** (`/schedule`) — the weekend day by day, each date its own timeline (welcome drinks, ceremony, cocktails, dinner, dancing, farewell brunch), then each venue as a full alternating row with its photograph and a **Get directions** link straight into the guest's maps app
    - **Travel** (`/travel`) — how to get there (train and car), room blocks with rate codes and distances, and a short list of things to do while you're in town
    - **Wedding party** (`/party`) — the party as the invitation's inner leaf (names, roles, one good line each — no headshot grid to source before the site can ship), plus registry link cards
    - **RSVP** (`/rsvp`) — the reply card: name, email, **attending and party-size selects**, dinner preference, a song request, and a notes field, delivering through the platform's managed forms pipeline (`formKey: "vows-rsvp"`) — the couple gets an email and a dashboard entry with zero setup. The reply-by nudge above the form counts down; the FAQ (plus-ones, dress code, kids, weather, unplugged ceremony) answers everything else
- **Everything renders from `content.ts`** — couple, dates, story, schedule, venues, hotels, party, registry, RSVP copy: one typed file; no backend, no CMS. The countdown labels are computed from that data per render by `countdown.ts` (the estate listings engine's idiom): day-of the badge flips to "Today's the day", after to "Just married" — the site outlives its date as the keepsake
- Demo couple: a coherent fictional pair (Amelia Hart & Jonah Reyes, Rhinebeck, New York, June 2027) with ten photographs — engagement session, story chapters, both venues — processed through `npm run image -- responsive` into `web/app/public/vows/`; every image ships intrinsic dimensions and a WebP `srcSet`, so pages load layout-shift-free and phones never download desktop files
- When the pack is active it owns `/`, `/story`, `/schedule`, `/travel`, `/party`, and `/rsvp`; otherwise the same pages preview under `/vows`, `/vows/story`, ...

Set [`../active.json`](../active.json) to `{ "key": "vows" }` to make this pack the home surface.

## Agent recipe: make it yours

- Change the couple: edit `couple`, `home`, and `story` in `web/app/src/View/Vows/content.ts`. The hashtag renders in the footer, the welcome kicker, and the FAQ — pick it once.
- Change the date: `couple.weddingDateIso` (and its printed `weddingDateLabel`) drives the hero countdown; `rsvp.replyByIso` / `replyByLabel` drive the reply nudge. The labels recompute per render — never hand-write a number of days into copy.
- Change the weekend: `schedule.days` is the timeline (a day with one event is fine); `schedule.venues` are the alternating venue rows — each `mapUrl` should be a maps link for the printed address. The schedule page seeds three day sections (`day-1`…`day-3`); if you add or remove a day, update the catalog's schedule seed to match the code config.
- Swap in real photographs: run each original through `npm run image -- responsive <file> --out-dir web/app/public/vows --alt "..."` and paste the emitted media entry into the slot. Never commit raw camera files into media slots.
- Tune the RSVP: `rsvp.fields` is the reply card — the selects (attending, party size, dinner) are real `select` fields; edit the options to match the menu. Replies deliver to the owner's email and dashboard through managed forms.
- Content tests guard the file: every image carries dimensions + alt text, dates stay ISO-formed, the party and FAQ meet the contract minimums, and the clock engine's labels are pinned at fixed instants.

## Non-goals for this pack

- Guest-list management, seating charts, per-guest invitation codes (replies arrive in the dashboard; the couple's spreadsheet stays the source of truth)
- A password gate (an agent can add one on request; the shipped site is open like a paper invitation is)
- Registry purchasing (the registry cards link out to the registries themselves)
- Server-side state — the shipped site is fully client-side; RSVPs deliver through the platform's managed forms pipeline (email + dashboard), no backend needed
