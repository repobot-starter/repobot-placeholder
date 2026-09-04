# Pack: fund-index

Client-only category starter: a venture fund's site at `web/app/src/View/FundIndex/`. The `venture-funds` category's one starter (shelf name **Ordinal**) — the index register: the fund as a numbered filing system, paper-on-ink, with **zero image assets** and every numeral computed from array position.

## What ships

- A multi-page fund site on the landing kernel's spec-sheet register (`mono-utility` preset in its dark reading, worn achromatic — monospace display type, graph-paper hairlines, the accent pinned to the register's own text ink so the page reads pure black/white in dark and ink-on-paper in light; the pack's blackout pin (`FundIndexPage.styles.css.ts`) re-grounds the dark appearance on neutral true black instead of the register's phosphor green, which belongs to the dj pack; `docs/landing.md`):
    - **Home** — the index: a bare mono statement, focus areas filed as **001–006** sector vignettes (`showcase card-grid` with computed eyebrows — reorder the content array and the numerals follow), the underwriting formula rendered at display scale (`testimonials single-featured` — the quantitative school's one flourish), a metrics band mixing stated figures with computed counts (`social-proof metrics-row`), three numbered principles down the timeline rail, and the send-your-deck card
    - **Portfolio** (`/portfolio`) — the spec sheet: company / one-liner / year / sector chips, with filter chips derived from the sector tags (the folio derivation) and computed status pills
    - **Team** (`/team`) — a compact list of technical briefs: names, roles, no headshots
    - **Log** (`/log`) — dated research notes and position papers rendered newest-first (computed)
    - **Contact** (`/contact`) — the deck ask with a plain-text deck address (never a `mailto:` form)
    - **Disclosures** (`/disclosures`) — the compliance boilerplate every real fund carries, typeset like it matters instead of pasted as an afterthought
- **Computed from content** (`portfolio.ts`, sibling of the fund pack's engine — pure functions over an injected clock): portfolio count, exit count (acquired + public), sector chip derivation, "New" pills on investments younger than ~6 months, "Acquired"/"Public" pills on exits, newest-first log sorting, and the register's signature — `indexNumber`, position → "001"/"002"/"003" for focus areas and "01"/"02" for principles. Change a date, a status, or an array order in `content.ts` and every badge, count, and numeral follows.
- **Everything renders from `content.ts`** — firm, focus areas, principles, stated metrics, companies, team, log, disclosures: one typed file; no backend, no CMS
- Demo fund: a coherent fictional Boston complex-sectors firm (Ordinal Capital, "capital for sectors that resist simplification") with six focus areas, twelve portfolio companies, three exits, and five log entries
- When the pack is active it owns `/`, `/portfolio`, `/team`, `/log`, `/contact`, and `/disclosures`; otherwise the same pages preview under `/fund-index`, `/fund-index/portfolio`, ...

Set [`../active.json`](../active.json) to `{ "key": "fund-index" }` to make this pack the home surface.

## Agent recipe: make it yours

- Change the fund: edit `firm`, `home`, `contact`, and `disclosures` in `web/app/src/View/FundIndex/content.ts`. The formula (`home.formula`) is the register's set piece — keep it short enough to render at display scale, or clear it and delete the section from the seed.
- File a focus area: append to `focusAreas` (title + a two-sentence technical vignette); the 001-numbering computes itself from position. Same for `principles` and their 01-numbering.
- Add an investment: append to `companies` with its sector tags, the `investedAt` date, and a `status` — the row, the filter chips, the counts line, and the metrics band all follow. A fresh date earns the "New" pill for ~6 months on its own.
- Record an exit: flip `status` to `"acquired"` or `"public"` — the pill and the exits count update; nothing else to touch.
- Append to the log: add the entry with its date; the list keeps itself newest-first.
- Restate the fund's figures: `statedMetrics` is strings on purpose — word AUM and fund number however the fund does; never add a countable number there (the computed ones ride beside them automatically).
- Content tests guard the file: statuses stay in the vocabulary, dates stay ISO, sectors stay non-empty, ordered lists stay long enough to number, and the disclosures never ship empty.

## Non-goals for this pack

- Jobs boards, LP portals/logins, live data integrations, a CMS — the content file is the CMS
- Photography or generated imagery — this register's finished look is mono type and computed numerals
- Server-side state — the shipped site is fully client-side
