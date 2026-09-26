# Pack: band

Client-only starter: the flagship band/artist site at `web/app/src/View/Band/`. First starter in the `music` category (band / dj / single). Type-forward gig-poster monochrome — the `broadside` register: ink on paper, halftone dot screen, big condensed caps, hairline rules, one oxblood accent — deliberately apart from the photo-forward `marquee` register the music-photographer pack wears.

## What ships

- A four-page band site on the landing kernel plus the category's bespoke surfaces:
    - **Home** — doc-aware kernel page (statement hero, full-bleed stage frame, the record shelf, band intro, next-show banner, mailing-list form). The hero badge and the banner title are **computed from the tour dates at render time**.
    - **Tour** (`/tour`) — the category's signature mechanic: `shows` in `content.ts` are plain ISO dates; the page splits them upcoming/past at render time (`View/Music/schedule.ts`), highlights the next confirmed show in a framed card, and wears the computed badge — `On tour` while dates remain, `Tonight — City` on show days. Past shows archive themselves at midnight; ticket links are external URLs (the pack never sells tickets).
    - **Music** (`/music`) — the discography: each record with cover, notes, and per-track players; a click-to-load video section behind the pack's own poster frame; the mailing-list form.
    - **Press** (`/press`) — a real EPK, the vertical's underserved feature: bios in three lengths with one-click copy, approved photography and logo marks as REAL downloadable files under `web/app/public/band/press/`, the stage/tech rider, and management/booking/press contacts.
- **The hybrid audio system** (`View/Music/AudioPlayer.tsx`): by default each track plays a bundled ORIGINAL instrumental demo loop (composed offline with Web Audio — no samples, no third-party chrome) through the native hairline-waveform player with mono timecode; waveform peaks are precomputed (`View/Music/demoLoops.gen.ts`). **Paste your streaming links and the players swap to your real catalog**: set a track's `embedUrl` to a Spotify / SoundCloud / Mixcloud share URL and its player becomes a click-to-load embed behind the same frame (plain Bandcamp pages link out, since Bandcamp's iframe needs its own EmbeddedPlayer URL).
- **Everything renders from `content.ts`** — band, shows, records, videos, mailing list, press kit: one typed file; no backend, no CMS.
- Demo band: The Overtones (fictional four-piece, Asbury Park NJ) with three records and four playable demo loops (~1.6 MB of audio total), generated imagery processed through `npm run image -- responsive` into `web/app/public/band/`.
- Mailing-list and lead capture deliver through the platform's managed forms pipeline (`formKey: "mailing-list"`) — email + dashboard entry, zero setup.
- When the pack is active it owns `/`, `/tour`, `/music`, and `/press`; otherwise the same pages preview under `/band`, `/band/tour`, ...

Set [`../active.json`](../active.json) to `{ "key": "band" }` to make this pack the home surface.

## Agent recipe: make it yours

- Change the band: edit `band`, `home`, `shows`, `records`, `videos`, `mailingList`, and `pressKit` in `web/app/src/View/Band/content.ts`.
- Tour dates: append shows to `shows` in any order with ISO dates — the site sorts, splits upcoming/past, highlights the next show, and computes the badge. Never move rows between lists by hand.
- Real audio: paste a streaming share URL into a track's `embedUrl` — the native demo player swaps to a click-to-load embed of the real recording. To replace the bundled demo loops themselves, drop encoded m4a files into `web/app/public/band/audio/` and update `audioSrc`/`seconds`/`peaks`.
- Images: run each original through `npm run image -- responsive <file> --out-dir web/app/public/band --alt "..."`; press-kit downloads should point at full-resolution originals in `web/app/public/band/press/` — a booker will actually download them.
- Video: set `videoUrl` to any YouTube link; nothing loads until the visitor presses play on your poster frame.
- Content tests guard the file: show dates parse as ISO dates, records carry covers with dimensions + alt text, every track has a playable source, and press-kit downloads point at real files.

## Non-goals for this pack

- Merch / store (another pack's domain; needs a backend) and ticketing beyond external links
- Auth / accounts, server-side state — the shipped site is fully client-side; forms deliver through the platform's managed pipeline
