# Pack: resume

Client-only vertical pack: a personal résumé / CV one-pager at `web/app/src/View/Resume/`. First starter in the `resume` category — the site a job seeker sends instead of a PDF. Pairs naturally with the link-in-bio template: the links band at the bottom IS the link-in-bio move, upgraded with a career above it.

## What ships

- A typeset document on the landing kernel's `editorial` register (paper ground, serif display, hairline rules — typography does all the art direction, deliberately zero images): statement hero with the name at display scale, a profile paragraph, the experience timeline, a restrained stats strip, a skills matrix, selected projects with links, education, and a links band that delivers the link-in-bio pairing; owns `/` when this pack is active, otherwise preview at `/resume`
- **Everything renders from `content.ts`** — person, roles, education, skills, projects, links: one typed file; no backend, no CMS
- **Dates are data, math is computed** (`dates.ts`, the menu pack's computed-from-content pattern): each role carries `start`/`end` as `"YYYY-MM"` (omit `end` while you still work there) and the page computes the rest at render time — "2019 – Present · 6 yrs" per role, the hero's total years of experience (an interval union, so overlapping roles never double count), and most-recent-first ordering. Content tests pin the math; the owner never writes a duration
- **Print is the killer feature** (`ResumePage.print.css`): the same page typesets to a clean one-page Letter/A4 résumé — chrome and CTAs hidden, rhythm tightened to document scale, paper-white ground — and the "Download résumé" buttons are `#print` anchors turned into `window.print()`; the browser is the whole PDF pipeline
- The home page is doc-aware (`useSitePageConfig`, page id `home`): the catalog's landing seed mirrors `resumeLanding.ts`, so the platform's structural editor can re-arrange the page with a live repaint

Set [`../active.json`](../active.json) to `{ "key": "resume" }` to make this pack the home surface.

## Agent recipe: make it yours

- **Paste your LinkedIn export or existing résumé text at the agent** and have it fill `web/app/src/View/Resume/content.ts`: `person` (name, title, location, email, availability, summary), `roles` (title, company, `start`/`end` as `"YYYY-MM"` — leave `end` off the current role — and a two-line summary each), `education`, `skillGroups`, `projects` (with real URLs), and `links`. Never write durations, totals, or orderings into the copy — the page computes all of them from the dates.
- Print-check after any content change: the page should still print to ONE page (⌘P or the Download résumé button). If it runs long, tighten role summaries before touching the print stylesheet.
- The register-owned strings (section titles, the Download résumé label) live in `landingCopy` — retitle there, not in the landing config.
- Content tests guard the file: valid `YYYY-MM` dates, no hand-written durations in summaries, unique companies+titles, https project/link URLs.

## Non-goals for this pack

- Auth, accounts, or any backend — the shipped site is fully client-side
- A PDF rendering service (the documents kernel) — `window.print()` over the print stylesheet is deliberately the whole feature
- Multi-page case studies (that's the folio/portfolio shape; this is the one-pager)
