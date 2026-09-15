# Pack: dj

Client-only starter: a DJ / electronic artist site at `web/app/src/View/Dj/`. Second starter in the `music` category — a completely different energy from the `band` pack: paper-on-ink dark, brutalist-minimal, grid-and-mono. The register is `mono-utility` worn ACHROMATIC (the landing style pins the accent to the register's own text ink), so there is no hue anywhere: terminal mono display type, graph-paper ground, hairline rules.

## What ships

- A four-page DJ site on the landing kernel plus the category's bespoke surfaces:
    - **Home** — doc-aware kernel page (statement hero, full-bleed booth frame, the mix shelf, profile, next-set banner, mailing-list form). The hero badge and the banner are **computed from the set dates at render time**.
    - **Mixes** (`/mixes`) — the numbered mix shelf (KONTAKT 041, 040, …): cover, BPM/style line, notes, and a native waveform player per mix.
    - **Dates** (`/dates`) — the category's computed mechanic in the mono register: `sets` in `content.ts` are plain ISO dates; the page splits them upcoming/past at render time (`View/Music/schedule.ts`), frames the next set, and wears the computed badge (`Tonight — City` on set days). Links are external (RA / venue tickets).
    - **Book** (`/book`) — doc-aware kernel page: a detail form whose fields carry the **tech-rider ask** (venue, date, set length, booth/mixer notes); submissions deliver through the platform's managed forms pipeline (`formKey: "booking"`) — email + dashboard entry, zero setup.
- **The hybrid audio system** (`View/Music/AudioPlayer.tsx`): each mix plays a bundled ORIGINAL electronic demo loop (techno / dub / electro / after-hours, composed offline with Web Audio — no samples) through the native hairline-waveform player with mono timecode. **Paste your streaming links and the players swap to your real catalog**: set a mix's `embedUrl` to a SoundCloud / Mixcloud / Spotify share URL and its player becomes a click-to-load embed behind the same frame.
- **Everything renders from `content.ts`** — artist, sets, mixes, booking, mailing list: one typed file; no backend, no CMS.
- Demo artist: PULSEWIDTH (fictional, Berlin) with four demo mixes (~1.8 MB of audio total) and generated imagery processed through `npm run image -- responsive` into `web/app/public/dj/`.
- When the pack is active it owns `/`, `/mixes`, `/dates`, and `/book`; otherwise the same pages preview under `/dj`, `/dj/mixes`, ...

Set [`../active.json`](../active.json) to `{ "key": "dj" }` to make this pack the home surface.

## Agent recipe: make it yours

- Change the artist: edit `artist`, `home`, `sets`, `mixes`, `booking`, and `mailingList` in `web/app/src/View/Dj/content.ts`.
- Set dates: append to `sets` in any order with ISO dates — the site sorts, splits upcoming/past, frames the next set, and computes the badge.
- Real mixes: paste a streaming share URL into a mix's `embedUrl` — the demo player swaps to a click-to-load embed of the real transmission. To replace the bundled loops, drop encoded m4a files into `web/app/public/dj/audio/` and update `audioSrc`/`seconds`/`peaks`.
- Images: run each original through `npm run image -- responsive <file> --out-dir web/app/public/dj --alt "..."`.
- Keep it achromatic: the register's discipline IS the design — if you add an accent hue, do it through the platform's brand controls, not by editing the pages.
- Content tests guard the file: set dates parse as ISO dates, mixes carry covers with dimensions + alt text and a playable source, and the booking form keeps exactly one email field.

## Non-goals for this pack

- Merch / store and ticketing beyond external links
- Auth / accounts, server-side state — the shipped site is fully client-side; forms deliver through the platform's managed pipeline
