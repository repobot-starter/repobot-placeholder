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
- The zine's own slots ship empty on this wedding and render once filled or chosen: the hero's photo wall (`home.wall`) and particulars strip (`home.details`), the story rail's years (`story.chapters[].year`), the booth strips (`story.strips`), and snapshot captions (`story.gallery[].caption`). `home.layout: "zine"` swaps the classic composition for the zine's (see below)
- Derived templates ride the same pages with their own seeds, registers, and pinned skeletons (see `packs/README.md` "Derived templates"): `vows-photobooth` (Priya & Marcus's unstaged Chicago wedding as a cut-and-paste zine, `photobooth`) — the invitation cover beside the photo wall, the story rail, the booth strips, the taped-up snapshots, and the registry leading the party page
    - `vows-bigsur` (Maya & Eli on the Big Sur coast, `seafog`) — `home.layout: "story"`: the names over one full-bleed photograph, the story in stacked photo chapters, the weekend in three lines (`home.weekend`), and one closing line (`home.closing`) with the RSVP link; images in `web/app/public/vows-bigsur/`
    - `vows-orchard` (Nora & Ben's October orchard weekend in the Hudson Valley, `harvest`, dark-native) — `home.layout: "stack"`: the names over one full-bleed photograph, then same-size photographs (`home.stack`) on forest-green caption bands carrying the story and the weekend, and the closing line with the RSVP link; images in `web/app/public/vows-orchard/`
    - `vows-paris` (Inès & Paul's September weekend in Paris, `carton`) — `home.layout: "letter"`: a faire-part with no photograph — the names enormous, the weekend in three lines, the hotels, the couple's note, and the closing line with the RSVP link; chapters and venues run as text, and only the story page's gallery (the contract's three frames) carries photographs, in `web/app/public/vows-paris/`
- When the pack is active it owns `/`, `/story`, `/schedule`, `/travel`, `/party`, and `/rsvp`; otherwise the same pages preview under `/vows`, `/vows/story`, ...

Set [`../active.json`](../active.json) to `{ "key": "vows" }` to make this pack the home surface.

## Register and special fields

Every field below belongs to a section _variant_, not to the register, so a remix to any other `style.preset` keeps it; the register only restyles it (docs/landing-content.md → "The registers" lists every preset and treatment). Text is click-to-edit and photographs Replace-able in the preview editor, and the content paths named are Content-panel slots in `catalog.json`'s `contentContract` (switches such as `home.layout` stay in code).

- **Registers**: `heirloom` here; vows-photobooth wears `photobooth` (`zine`, `tilt`, `grain`), vows-bigsur `seafog`, vows-orchard `harvest`, vows-paris `carton`.
- **Layout** (`home.layout`): `story`, `stack`, and `letter` are the quiet one-page homes (see `content.ts`'s header) — each closes on `home.closing` and the RSVP link through cta-banner `colophon`, and chapter and venue photographs are optional (an empty slot renders its words alone); `classic` — the `masthead-overlay` hero, the welcome note (`home.welcomeTitle` / `welcomeBody`), the weekend timeline, the venue `collections`, the `masonry` engagement gallery, the story page's `sequence` filmstrip, and the party ahead of the registry; `zine` — the `invitation` hero, the story as a `horizontal-rail` of years, the booth strips, the weekend, hotels, registry, and questions on the home page, the story page's snapshots as a captioned `scrapbook`, the registry leading the party page (the nav's `landingCopy.partyNavLabel` names it), and the city printed under the names in the nav.
- **Hero** (`invitation`): `snapshots` from `home.wall[]` — a piece is a single print (`image`, Replace as `snapshots[i]`) or a booth strip (`frames`, each frame Replace-able as `snapshots.<i>.frames[j]`), plus a `sticker`; `credit` from `home.details`. Either hero's second button reads `home.detailsLink`.
- **Booth strips**: `gallery` `photo-strip` from `story.strips[].frames` (media list), rendered once there are strips.

## Agent recipe: make it yours

- Change the couple: edit `couple`, `home`, and `story` in `web/app/src/View/Vows/content.ts`. The hashtag renders in the footer, the welcome kicker, and the FAQ — pick it once. `landingCopy` carries the headings that name the wedding's voice (travel, RSVP, questions, the nav's party label).
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
