# Pack: single

Client-only starter: a single/album launch one-pager at `web/app/src/View/Single/`. Third starter in the `music` category. The `monolith` register — true black and white, monumental display type, razor hairlines, zero accent hue; the appearance toggle flips to the gallery-white inversion as part of the art direction.

## What ships

- **One page, launch-day ready**, in reading order:
    - **The countdown masthead** — the pack's signature mechanic: `record.releaseDate` in `content.ts` is a plain ISO date; the page computes days/hours/minutes at render time (`View/Music/schedule.ts`) under a computed label (`Out Friday` inside the final week, `Out Oct 16` before that) beside the cover art, with **pre-save links**. At local midnight on the date the whole masthead flips to **OUT NOW** and the same slots become **listen links** — no edits on release day. The clock re-renders every half minute.
    - **The excerpt** — the title track through the native hairline-waveform player (bundled ORIGINAL audio, composed offline with Web Audio; peaks precomputed). Set `record.excerpt.embedUrl` to a streaming link and the player swaps to a click-to-load embed of the real song.
    - **The tracklist** — numbered mono rows with durations, hairline-ruled.
    - **The visual** — one click-to-load video behind the pack's own poster frame; nothing loads until play is pressed.
    - **The doc-aware tail** — about-the-record and the mailing-list form as kernel sections merged through the landing document (page id `home`), so the platform's structural editor can reorder and extend the close.
- **Everything renders from `content.ts`** — artist, record, links, tracklist, video, mailing list: one typed file; no backend, no CMS.
- Demo release: Noor Vela — MERIDIAN (fictional; Oct 16, 2026) with a ~34s title-track excerpt (~0.5 MB) and generated artwork processed through `npm run image -- responsive` into `web/app/public/single/`.
- Mailing list delivers through the platform's managed forms pipeline (`formKey: "mailing-list"`).
- When the pack is active it owns `/`; otherwise it previews under `/single`.

Set [`../active.json`](../active.json) to `{ "key": "single" }` to make this pack the home surface.

## Agent recipe: make it yours

- Change the record: edit `artist`, `record`, `listenLinks`, `tracklist`, `video`, and `mailingList` in `web/app/src/View/Single/content.ts`. Set `record.releaseDate` to your date — the countdown, the label, and the OUT NOW flip are all computed.
- Real audio: paste a streaming link into `record.excerpt.embedUrl` — the demo player swaps to a click-to-load embed. To replace the bundled excerpt, drop an encoded m4a into `web/app/public/single/audio/` and update `audioSrc`/`seconds`/`peaks`.
- Artwork: run originals through `npm run image -- responsive <file> --out-dir web/app/public/single --alt "..."`. The cover should be square.
- Pre-save vs. listen: the same `listenLinks` serve both states; point them at your pre-save pages before the date and they read as listen links after. They ship with EMPTY hrefs — rendered as non-navigating platform badges (and the nav CTA anchors to the mailing list) until you paste real store URLs, because a placeholder streaming link would send visitors to a dead page.
- Content tests guard the file: the release date parses as an ISO date, the countdown flips exactly at local midnight, artwork carries dimensions + alt text, and the excerpt has a playable source.

## Non-goals for this pack

- Multi-page artist sites (that's the `band` pack), merch/store, ticketing
- Auth / accounts, server-side state — the shipped page is fully client-side; the form delivers through the platform's managed pipeline
