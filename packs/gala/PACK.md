# Pack: gala

Client-only category starter: a black-tie evening at `web/app/src/View/Gala/`. The weddings-and-events category's formal one-pager: the demo evening is a sixtieth birthday on New Year's Eve at a grand New York hotel, but the shape fits any dressed-up night — an anniversary, a foundation gala, a New Year's wedding. One dramatic scroll and one ask, told on the ballroom register's candlelit gold.

## What ships

- A one-page evening plus the reply card, on the landing kernel's `ballroom` register (the black-tie look: candlelit near-black, gold-foil accent, monumental Fraunces with the italic flourish, hairline gold frames, one slow spotlight sweep — 8 PM in the grand room):
    - **Home** — masthead hero over the ballroom photograph with a **live countdown badge** ("126 days to go" — computed, never hand-written); the invitation lines set narrow like the engraved card (who, when, where); the **order of the evening** on a timeline (champagne, dinner, the toast, dancing, midnight); the champagne-tower photograph as a full-width beat; the fine print (dress, gifts, getting there, staying over); the venue and the after-party as alternating rows with a **Get directions** link; a closing **ticket-stub RSVP banner** carrying the computed reply-by nudge
    - **RSVP** (`/rsvp`) — the reply card: name, email, **attending and seats selects** (capped at the invitation's two), dinner preference, and a notes field, delivering through the platform's managed forms pipeline (`formKey: "gala-rsvp"`) — the host gets an email and a dashboard entry with zero setup. The FAQ answers the black-tie questions (is it really, plus-ones, midnight logistics, speeches) so the host never has to
- **Everything renders from `content.ts`** — the evening, the program, the details, the venue, the RSVP copy: one typed file; no backend, no CMS. The countdown labels are computed from that data per render by `countdown.ts` (the estate listings engine's idiom): day-of the badge flips to "Tonight's the night", after to "What an evening" — the site outlives its night as the program kept from it
- Demo evening: a coherent fictional night (Vivienne's sixtieth, The Aldridge Hotel, New Year's Eve 2026) with four photographs — the ballroom, the hotel at night in snow, the champagne tower, the rooftop after-party — processed through `npm run image -- responsive` into `web/app/public/gala/`; every image ships intrinsic dimensions and a WebP `srcSet`
- When the pack is active it owns `/` and `/rsvp`; otherwise the same pages preview under `/gala` and `/gala/rsvp`

Set [`../active.json`](../active.json) to `{ "key": "gala" }` to make this pack the home surface.

## Agent recipe: make it yours

- Change the evening: edit `event` in `web/app/src/View/Gala/content.ts` — title, host, date, venue. The date drives the hero countdown and `rsvp.replyByIso` drives the reply nudge; the labels recompute per render, so never hand-write a number of days into copy.
- Change the program: `program.items` is the timeline — a time, a title, and one good line each. The toast joke is load-bearing; replace it with your own.
- Change the register's lean: the evening ships dark (the ballroom preset's native mode); the Feel appearance toggle flips it to the champagne-paper morning reading without any edits here.
- Swap in real photographs: run each original through `npm run image -- responsive <file> --out-dir web/app/public/gala --alt "..."` and paste the emitted media entry into the slot. Never commit raw camera files into media slots.
- Tune the RSVP: `rsvp.fields` — the seats select is capped at what an invitation holds (edit the options to change it); the dinner select should match your actual menu. Replies deliver to the owner's email and dashboard through managed forms.
- Content tests guard the file: every image carries dimensions + alt text, dates stay ISO-formed, the program and FAQ meet the contract minimums, and the clock engine's labels are pinned at fixed instants.

## Non-goals for this pack

- Ticketing, payments, or seat maps (this is an invitation, not a box office — the reply card and the host's list are the system)
- Guest-list management or per-guest invitation codes
- A password gate (an agent can add one on request)
- Server-side state — the shipped site is fully client-side; RSVPs deliver through the platform's managed forms pipeline (email + dashboard), no backend needed
