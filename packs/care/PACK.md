# Pack: care

Client-only category starter: a primary-care practice's site at `web/app/src/View/Care/`. First starter in the `healthcare` category — practice marketing made computable AND bookable: the business facts live in the content contract's `practice` domain, and the `appointments` domain (visit types x provider availability windows) projects into real capacity-1 booking slots on the managed booking domain (booking mode 2).

## What ships

- A five-page site on the landing kernel's `luxe-light` register worn in the practice's own calm teal (near-white ground, deep ink type, hairline rules, crisp elevation; `docs/landing.md`), with the full-width nav treatment (wordmark at the true left edge, links at the true right — deliberately apart from the centered/squared/inset navbars):
    - **Home** — split-media hero with a live "Open — closes 5 PM" badge computed from the contract's hours, the in-network insurance strip, a services grid, provider portraits, owner-curated patient reviews, the visit panel (map-ready address, phone, grouped hours), and the booking band
    - **Providers** (`/providers`) — four clinicians with credentials, portraits, and bios, then the story of the practice
    - **Services** (`/what-we-treat`) — the full services grid and the insurance strip (`/services` belongs to the services pack's preview route, which every checkout keeps)
    - **New patients** (`/new-patients`) — the first-visit guide as a timeline (before your visit, what to bring, the 45-minute first visit, records & refills)
- **Book** (`/book`) — **online appointment booking**: the AppointmentWidget projects each provider's actual weekly windows x visit types (new patient 45 min, follow-up 15, annual physical 30) into concrete bookable times. Live availability from the booking domain on a deploy; workspace simulation with the same provider-overlap rule, so double-booking is impossible in both worlds
- **Everything renders from `content.ts`** — the practice, the providers, services, insurance, hours, reviews, the new-patient guide, and the appointment offering: one typed file; no backend to run, booking rides the platform's managed booking domain
- The business facts resolve through the business-content contract (`repobot.content.json` `practice` + `appointments` domains — the Manage UI's write surface) over the code defaults, so the owner edits facts in Manage and the site repaints
- Demo practice: a coherent fictional clinic (Alder House Family Medicine, Bellingham, Washington) with four providers, eight services, ten insurance plans, Saturday hours, and calm natural-light photography processed through `npm run image -- responsive` into `web/app/public/care/`; every image ships intrinsic dimensions and a WebP `srcSet`
- When the pack is active it owns `/`, `/providers`, `/what-we-treat`, `/new-patients`, and `/book`; otherwise the same pages preview under `/care/*`

Set [`../active.json`](../active.json) to `{ "key": "care" }` to make this pack the home surface.

## The clinically-empty booking constraint (deliberate architecture)

Booking a visit asks for a **name, email, optional phone, visit type, and new/returning** — nothing else. No free-text reason for the visit, no symptom fields, no health questions, ever. The platform never holds medical information; the schema enforces it end to end (the widget's tests enumerate the form's every field, and the platform's booking door drops unknown fields). Marketing copy may say that patient health information never touches the site — it is true and the `/book` page says exactly that. Do **not** write "HIPAA compliant" (or any compliance claim) into template copy: the site avoids the problem by architecture instead of claiming certification.

## Agent recipe: make it yours

- Change the practice: edit `practice`, `home`, `story`, and `booking` in `web/app/src/View/Care/content.ts`.
- Change the facts: edit `codePractice` (providers, services, insurance, location/hours, reviews, new-patient guide) and `clinicHours`. Hours are numbers — `day` is the weekday index (0 = Sunday), `open`/`close` are minutes since midnight; the live badge follows.
- Change the appointment offering: edit `codeAppointments` — visit types carry the slot length they book (5–240 minutes), providers carry weekly windows (`day`/`start`/`end`, minutes since midnight). Slots pack back-to-back from each window's start; the workspace widget and a deploy project identical slots.
- Swap in real photographs: run each original through `npm run image -- responsive <file> --out-dir web/app/public/care --alt "..."` and paste the emitted entry into the matching slot. Keep the art direction: calm natural light, unposed, warm — nothing stocky, nothing fluorescent.
- Content tests guard the file: contract-shaped exports parse contract-clean, hours and windows stay inside a day, ids match the contract grammar, every image carries dimensions + alt text, and the booking copy stays free of clinical asks.

## Non-goals for this pack

- Clinical intake of any kind — symptoms, reasons for visit, health history (deliberate architecture, see above)
- Payments, reminders, or waitlists (booking-domain upgrades, not template features)
- Runtime review ingestion — reviews are owner-curated contract data
- Patient portals or accounts — the shipped site is fully client-side; booking rides the platform's managed booking domain
