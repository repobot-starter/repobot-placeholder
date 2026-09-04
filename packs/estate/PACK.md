# Pack: estate

Client-only category starter: a real-estate agent site at `web/app/src/View/Estate/`. The first starter of the `real-estate` category: the demo agent works Providence's East Side, but the shape fits any market — the personal trust brand plus live inventory. The listings and their computed status badges are the proof; the conversation is the ask.

## What ships

- A multi-page agent site on the landing kernel's `brownstone` register (the residential look: limestone paper, deep navy serif, brick accent, stone grain — the open-house folder from a good agency):
    - **Home** — masthead hero over the pack's signature street photograph with a **live market-pulse badge** ("3 new listings this week" — computed, never hand-written) and click-to-call; featured listings on a browsable rail, each photograph wearing its **computed status pill**; the license line over a trust-metrics strip; neighborhood cover tiles; a featured testimonial; a closing contact banner
    - **Listings** (`/listings`) — the signature section at full strength: every listing in a **filterable grid** (neighborhood chips derive from the tags) with specs, price, and a **status badge computed from the listing dates** by the listings engine (`listings.ts`, the hours engine's sibling): sold and pending straight from the data, available listings earning "New this week" / "Just listed" / "For sale" from the clock — plus days-on-market lines on the home rail from the same arithmetic
    - **Neighborhoods** (`/neighborhoods`) — each neighborhood as a full alternating row: cover photograph, what living there is actually like, and a pointer back to the listings
    - **About** (`/about`) — the agent's portrait beside her story with trust bullets, an uppercase credentials strip (license, Equal Housing, REALTOR®), and the review grid
    - **Contact** (`/contact`) — a detail form (name/phone/email/buying-or-selling/neighborhood/timing/message) delivering through the platform's managed forms pipeline (`formKey: "estate-inquiry"`) — the owner gets an email and a dashboard entry with zero setup. The phone channel is a `tel:` link (a listing question is a phone call); the email shows as copyable plain text (never a `mailto:` link)
- **Everything renders from `content.ts`** — agency, listings (with statuses and dates), neighborhoods, metrics, testimonials, bio, contact copy: one typed file; no backend, no CMS. The badges, counts, and days-on-market lines are computed from that data per render by `listings.ts`
- Demo agent: a coherent fictional broker (Maren Holt, Providence, Rhode Island) with nine listings across six neighborhoods — available, pending, and sold — processed through `npm run image -- responsive` into `web/app/public/estate/`; every image ships intrinsic dimensions and a WebP `srcSet`, so pages load layout-shift-free and phones never download desktop files
- When the pack is active it owns `/`, `/listings`, `/neighborhoods`, `/about`, and `/contact`; otherwise the same pages preview under `/estate`, `/estate/listings`, ...

Set [`../active.json`](../active.json) to `{ "key": "estate" }` to make this pack the home surface.

## Agent recipe: make it yours

- Change the agent: edit `agency`, `home`, `about`, and `contact` in `web/app/src/View/Estate/content.ts`. The license and fair-housing line renders in the footer, the metrics strip, and the about bullets — keep it real.
- Change the market: the slots are market-agnostic. A Denver agent swaps the listings, the neighborhoods, and the copy; the pages follow. The strings in `landingCopy` are the few the market owns (the CTA carries the agent's name) — retrade those too.
- Update inventory: a listing's `status` ("available" / "pending" / "sold") and `listedAt` / `soldAt` dates are the facts; the badges ("New this week", "Sale pending", "Sold"), days-on-market lines, and the hero's market pulse recompute from them every render. Selling a house is a one-word edit.
- Swap in real photographs: run each original through `npm run image -- responsive <file> --out-dir web/app/public/estate --alt "..."` and paste the emitted media entry into the slot. Never commit raw camera files into media slots.
- Add a listing or neighborhood: append to `listings` or `neighborhoods` in `content.ts`; the home rail (`home.featuredListings`), the filter chips, and the neighborhood pages all follow. Filter chips derive from each listing's `neighborhood` — keep the spellings consistent.
- Content tests guard the file: every image carries dimensions + alt text, slugs stay unique, statuses and dates stay well-formed, and the engine's badge rules are pinned at fixed instants.

## Non-goals for this pack

- MLS / IDX feeds and search (this starter is the agent's own site with content-authored inventory — the badges compute from data the agent edits, not from a feed)
- Mortgage calculators, saved searches, accounts
- Server-side state — the shipped site is fully client-side; inquiries deliver through the platform's managed forms pipeline (email + dashboard), no backend needed
