# Pack: interiors

Client-only category starter: an interior design studio's portfolio site at `web/app/src/View/Interiors/`. The first starter of the `design` category — and the **projects-domain flagship**: its portfolio is the business-content contract's `projects` domain (`web/app/src/View/Landing/projectsDocument.ts`), the body-of-work sibling of the estate pack's listings. The demo studio is a Portland interior designer, but the shape fits any portfolio-led practice: the finished rooms are the proof; the first meeting is the ask.

## What ships

- A multi-page studio site on the landing kernel's `atelier` register (the gallery look: gallery-white paper, hairline rules, uppercase Inter display, still motion — the studio's own portfolio wall) with a warm bronze brand overlay:
    - **Home** — masthead hero over the studio's signature room; featured projects on a browsable rail (the contract's `featured` flags decide which rooms lead); the three services as cover tiles with **honest investment numbers**; the credential line over a trust-metrics strip; a featured testimonial; a closing contact banner
    - `home.layout: "gallery"` is this studio's stack; `home.layout: "catalog"` is the derived `interiors-midcentury` template's 1950s furniture-catalog home (split cover, numbered services strip, before/after case files from `caseStudies.befores`, the numbered `pieces`, the process, the `fees` board, FAQs, the consultation form) — the sections it adds render only from a seed that fills them
    - `home.monograph` (outranks `home.layout`) is the derived `interiors-architecture-aokifarrow` template's architect's monograph (Aoki Farrow, New York): one full-height hero plate with the copy on the paper beneath it, the featured projects as numbered full-bleed plates at one size (each captioned with its place, year, and scope), a magazine `feature` told from the seed's own photographs and plan, a ruled index of every project, one testimonial, the credentials, and the colophon; the inner pages are unchanged
    - **Portfolio** (`/portfolio`) — the signature section at full strength: every project in a **filterable grid** whose **category chips derive from the entries themselves** (`projectCategories`) — the projects domain's taxonomy axis is data, so an owner minting a new category in Manage grows the filter row without a code change
    - **Services** (`/offerings` — NOT `/services`, that path is the services pack's preview route) — each engagement as an alternating photographed spread with its investment number, the fee schedule (only when `fees.groups` is non-empty — empty here), the four-step studio process as a timeline, and plain-language FAQs on cost, contractors, and timing
    - **About** (`/about`) — the principal's portrait beside the studio story with trust bullets, an uppercase credentials strip (NCIDQ, ASID, press), and the review grid
    - **Contact** (`/contact`) — both asks on one page: **real online booking** (the appointment widget under the hero — free 20-minute discovery calls and paid two-hour consultations projected from the studio's actual week into capacity-1 slots, double-booking impossible) above a detail inquiry form (name/email/phone/project/neighborhood/budget/timing/message) delivering through the platform's managed forms pipeline (`formKey: "interiors-inquiry"`). The phone channel is a `tel:` link; the email shows as copyable plain text (never a `mailto:` link)
- **Everything renders from `content.ts`** — studio, projects (with categories, scopes, years, the featured flags), services, metrics, testimonials, process, story, FAQs, booking calendar, contact copy: one typed file; no backend, no CMS
- **The portfolio is contract-first**: `projects` in `content.ts` IS the projects-domain shape plus each entry's code-owned photograph. The catalog seeds the same entries (minus images) into `repobot.content.json`, the platform's Manage editor writes the same domain, and `inventory.ts` joins photographs back **by reference via `slug`** — the contract moves words and categories, never bytes. A project added in Manage renders under the signature room until a photograph is produced for its slug
- Demo studio: a coherent fictional practice (Elin Marsh Interiors, Portland, Oregon) with six projects across four categories — full homes, kitchens & baths, commercial, styling — processed through `npm run image -- responsive` into `web/app/public/interiors/`; every image ships intrinsic dimensions and a WebP `srcSet`, so pages load layout-shift-free and phones never download desktop files
- When the pack is active it owns `/`, `/portfolio`, `/offerings`, `/about`, and `/contact`; otherwise the same pages preview under `/interiors`, `/interiors/portfolio`, ...

Set [`../active.json`](../active.json) to `{ "key": "interiors" }` to make this pack the home surface.

## Register and special fields

Every field below belongs to a section _variant_, not to the register, so a remix to any other `style.preset` keeps it; the register only restyles it (docs/landing-content.md → "The registers" lists every preset and treatment). Text is click-to-edit and photographs Replace-able in the preview editor, and the content paths named are Content-panel slots in `catalog.json`'s `contentContract` (switches such as `home.layout` stay in code).

- **Registers**: `atelier` (`hairline`) here and on the architecture, CFO, and wedding-planner derived templates; `interiors-midcentury` wears `midcentury` (`atomic`, `hairline`); `interiors-architecture-aokifarrow` wears `schist` (`framestack`, `monograph`).
- **Fees**: `pricing` `price-list` from `fees` (`fees.kicker/title/intro/footnote`, `fees.groups[].items[]` name/note/price/qualifier; lines edit as `groups.<g>.items.<i>.<field>`) — empty here, so /offerings keeps services, process, and questions.
- **Bands**: `process`, `pieces` and `caseStudies` carry their own `kicker`/`title`.

## Agent recipe: make it yours

- Change the studio: edit `studio`, `home`, `about`, and `contact` in `web/app/src/View/Interiors/content.ts`. Fees, pieces, and case files are plain arrays — filling `fees.groups` adds the fee board to Services; `home.layout` picks the gallery or catalog home; `landingCopy.heroAccent` sets where every hero headline takes the accent. The credential line renders in the footer, the metrics strips, and the about bullets — keep it real.
- Change the practice: the slots are practice-agnostic. An architect swaps the projects, services, and copy; the pages follow (Wave 2's architect template remixes exactly this pack). The strings in `landingCopy` are the few the trade owns — retrade those too.
- Reshape the portfolio: append to `projects` in `content.ts` (or let the owner do it in Manage — same domain, same render path). The filter chips derive from each project's `category` — keep the spellings consistent; a new category is a new chip, not a code change. `featured: true` puts a project on the home rail.
- Swap in real photographs: run each original through `npm run image -- responsive <file> --out-dir web/app/public/interiors --alt "..."` and paste the emitted media entry into the project's `image` slot. Never commit raw camera files into media slots.
- Change the calendar: `codeAppointments` is visit types x weekly windows (minutes since midnight); the widget projects them into real capacity-1 slots. The catalog's `content.appointments` seed must mirror it entry for entry (the content tests pin the twin).
- Content tests guard the file: every image carries dimensions + alt text, slugs stay unique and contract-valid (the projects domain's parser must accept every entry), the catalog seeds stay twins of the code exports, and the derived category taxonomy stays non-empty.

## Non-goals for this pack

- Per-project detail pages (the grid IS the portfolio in this phase; a project's story lives in its description and scope line)
- Client portals, proposals, invoicing
- Server-side state — the shipped site is fully client-side; bookings and inquiries deliver through the platform's managed booking and forms pipelines (email + dashboard), no backend needed
