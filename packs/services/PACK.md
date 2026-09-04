# Pack: services

Client-only category starter: a local service business site at `web/app/src/View/Services/`. The first starter of the `services` category (the successor naming scheme to the bot personas — no "ServiceBot"): the demo business is a remodeling contractor, but the shape fits any trade — plumber, electrician, landscaper, cleaner. The transformation is the proof; the quote and the call are the asks.

## What ships

- A multi-page trades site on the landing kernel's `sitework` register (the plan-table look: plan-grid work paper, stenciled uppercase display, safety-orange accent — `docs/landing.md` "Trades / contractor" blueprint):
    - **Home** — split hero with a live **Open / Closed** badge (the shared hours engine, `web/app/src/View/Landing/hours.ts`) and the two asks a trades site lives on: a quote CTA and a **click-to-call** button; a six-service card grid; a before/after teaser; the license line over a trust-metrics strip; a featured testimonial; the towns-served strip; a closing quote banner
    - **Projects** (`/projects`) — the signature section at full strength: every project as a **draggable before/after comparison** (the gallery kernel's `before-after` variant — pointer drag, tap, and keyboard arrows all work), each frame with a corner expand button that opens the pair **full screen in the lightbox** (after/before as adjacent slides), then the four-step process timeline
    - **Services** (`/services`) — the full service list with honest **starting prices** riding the `meta` slot, plus an FAQ that answers the real objections (estimates, licensing, permits, scheduling, payment)
    - **About** (`/about`) — crew photo beside the story with trust bullets, an uppercase credentials strip (license number, bonded & insured), and the review grid
    - **Quote** (`/quote`) — a detail form (name/phone/email/town/project/timing/message) delivering through the platform's managed forms pipeline (`formKey: "quote-request"`) — the owner gets an email and a dashboard entry with zero setup. The phone channel is a `tel:` link (click-to-call is how trades customers reach out); the email shows as copyable plain text (never a `mailto:` link)
- **Everything renders from `content.ts`** — business, hours, services, projects, testimonials, FAQ, quote copy: one typed file; no backend, no CMS
- Demo business: a coherent fictional remodeling contractor (Cedar & Stone Remodeling, Bend, Oregon) with five before/after project pairs, processed through `npm run image -- responsive` into `web/app/public/services/` — every image ships intrinsic dimensions and a WebP `srcSet`, so pages load layout-shift-free and phones never download desktop files
- When the pack is active it owns `/`, `/projects`, `/services`, `/about`, and `/quote`; otherwise the same pages preview under `/services`, `/services/projects`, ... (the services list previews at `/services/services` — the pack key and the page share a name, and the preview prefix wins)

Set [`../active.json`](../active.json) to `{ "key": "services" }` to make this pack the home surface.

## Agent recipe: make it yours

- Change the business: edit `business`, `weeklyHours`, `serviceArea`, `home`, `about`, and `quote` in `web/app/src/View/Services/content.ts`. The license line renders in the footer, the metrics strip, and the about bullets — keep it real.
- Change the trade: the slots are trade-agnostic. A plumber swaps the services (water heaters, repipes, drain service), the projects (a repiped crawlspace reads as well as a remodeled kitchen), and the copy; the pages follow.
- Swap in real photographs: run each original through `npm run image -- responsive <file> --out-dir web/app/public/services --alt "..."` and paste the emitted media entry into the slot. Never commit raw camera files into media slots.
- Before/after pairs are the craft: shoot both frames from the **same angle** — the comparison divider only convinces when the room registers as the same room. Update a project's `before`/`after` together.
- Add a service or project: append to `services` or `projects` in `content.ts`; the home teaser (`home.featuredProjects`), the projects page, and the services grid all follow.
- Adjust hours: `weeklyHours` uses minutes since midnight per weekday; the hero badge ("Open — closes 5 PM") recomputes every render from the shared hours engine.
- Content tests guard the file: every image carries dimensions + alt text, service and project slugs stay unique, before/after pairs stay complete, and prices stay in the `priceNote` strings.

## Non-goals for this pack

- Online booking / scheduling and deposits (the roadmap's booking evolution — this starter is the conversion-first marketing site with quote capture)
- Auth / accounts, payments, invoicing
- Server-side state — the shipped site is fully client-side; quote requests deliver through the platform's managed forms pipeline (email + dashboard), no backend needed
