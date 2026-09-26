# Plumber & emergency services

The `services` category's **emergency/dispatch shape**: a site for trades
people call in a crisis — plumber, electrician, HVAC, locksmith, towing. The
sell is speed and trust, not a portfolio: the phone number leads everywhere,
the metrics strip proves response time, and pricing is flat and printed.
The demo business is a 24/7 plumber (High Desert Plumbing & Drain, Bend,
Oregon).

## What it ships

- A multi-page marketing site on the landing kernel, wearing the `sitework`
  register (the trades voice) with the catalog's **utility-blue brand
  overlay** — the category's shared register, visibly its own company:
    - **Home** — a split hero where the **call is the primary CTA** and the
      badge is the 24/7 dispatch promise (an always-on line has no
      open/closed state to compute); the **dispatch-proof metrics strip**
      (average response, 24/7, jobs, rating) directly under it; a
      six-service card grid; the four-step "when you call" sequence; a
      featured testimonial; the towns-served strip; a closing call banner
    - **Services & prices** (`/services`) — every service with an honest
      flat `priceNote` ("From $149", "Camera inspection $249"), the FAQ
      people actually ask before calling (after-hours pricing, licensing,
      warranty), and a call banner
    - **About** (`/about`) — the story split beside the crew photo, the
      credentials strip (CCB, PB license, bonded, background-checked), and
      the review grid
    - **Request service** (`/request`) — a detail form for everything that
      can wait until morning, with the 24/7 line leading the direct
      channels. Submits through the platform's **managed forms pipeline**
      (formKey `service-request`): the owner gets an email and a dashboard
      entry with zero setup
- **One content file** — `web/app/src/View/ServicesEmergency/content.ts`
  owns every word, number, price, and image on the site
- **Content-driven sections** — the dispatch shape's optional sections
  ship empty here and switch on with content: `onCall.week` turns the
  badge into a live on-call pill; `priceBoard.items` paints a price board
  on a full-bleed hero photograph (and moves the services grid and price
  book to /services); `priceBook.items` prints the flat-rate book;
  `jobReports.items` files a job report; `heroThread.messages` sets the
  customer's text thread (beside the headline without a hero photo, else
  as how-it-works); `home.seal` / `home.readout` add a roundel or a
  monumental figure; `landingCopy.navTagline` letters a line under the
  wordmark; `systems.items` leads the home with the systems index (the
  services grid and price book move to /services); `dispatchBoard.rows`
  puts the dispatch board just before the metrics strip (a remix pins one or both);
  `restorations.items` adds a before/after gallery; a filled `intake.cta`
  (with a hero photo) turns the hero into the intake card over the
  photograph; `home.credit` tracks a line under a full-bleed headline;
  `landingCopy.finalCtaBody` / `finalCtaAsk` retune the closing banner
- **Seven derived templates** (`remixOf: services-emergency`): the
  originals `services-electric` (Pilot Butte Electric, amber) and
  `services-hvac` (Three Sisters Heating & Air, steel teal) inherit these
  pages on sitework; the restyles pin their own registers and skeletons —
  `services-emergency-van` (Straight Pipe Plumbing, Pasadena, `jacaranda`:
  full-bleed hero with the price board, job report, text-thread steps),
  `services-electric-techno` (Live Wire Electric, Detroit, `schematic`),
  `services-hvac-desert` (115 Degrees, Phoenix, `sunbelt`),
  `services-emergency-hartwell` (Hartwell Mechanical, Greenwich,
  `plantroom`: full-bleed hero, the systems index) and
  `services-emergency-bayou` (Bayou Restoration, Houston, `stormline`: the
  intake card over the storm photo, the dispatch board, before/after)
- Demo imagery processed through `npm run image -- responsive` into
  `web/app/public/services-emergency/` — every image ships intrinsic
  dimensions and a WebP `srcSet`
- Doc-aware pages: the catalog's `landing` seeds mirror each page's code
  skeleton, so the platform's structural editor can reorder / delete / add
  sections with a live repaint

## Make it active

Set `packs/active.json` to `services-emergency` (platform installs do this
via the template flip). Inactive, the pages preview under `/emergency`,
`/emergency/services`, `/emergency/about`, `/emergency/request`.

## Register and special fields

Every field below belongs to a section _variant_, not to the register, so a remix to any other `style.preset` keeps it; the register only restyles it (docs/landing-content.md → "The registers" lists every preset and treatment). Text is click-to-edit and photographs Replace-able in the preview editor, and the content paths named are Content-panel slots in `catalog.json`'s `contentContract`.

- **Registers**: `sitework` (`grain`) here and on the original trade remixes; the restyles wear `jacaranda` (services-emergency-van), `schematic` (services-electric-techno), `sunbelt` (services-hvac-desert), `plantroom` (`gauge`, services-emergency-hartwell) and `stormline` (`dispatch`, services-emergency-bayou).
- **Hero**: `badgeLive`, `seal` (`home.seal`), `readout` (`home.readout.value/note`), `credit` (`home.credit`), and an `aside` — a `price-board` (`priceBoard.*`) or a text `thread` (`heroThread.name/detail/messages[]`); `form-first` with the intake card (`intake.title/choices[]/field/contact/cta`) over the hero photograph.
- **Systems index**: showcase `specimens` (`systems.items[]`: code, name, care interval, photo).
- **Dispatch board**: schedule `day-rows` (`dispatchBoard.label/rows[]/summary`).
- **Restorations**: gallery `before-after` (`restorations.items[]`).
- **Job reports**: `content-split` `report` (`jobReports.items[]`: rows, stamp, signature, `before`/`after` photos).
- **Steps**: `message-thread` (the steps as texts; `thread` header, `chip`, `time`).

## Agent recipe — make it yours

1. **The business**: name, phone (update `phoneHref` in the same edit —
   click-to-call is the pack's point), email, address, license line, and
   the `dispatchBadge` promise in `content.ts`.
2. **The trade**: swap the six services (title, eyebrow, description, flat
   `priceNote`, image). An electrician variant is panel upgrades / EV
   chargers / troubleshooting; HVAC is no-heat calls / tune-ups /
   replacements. Keep prices honest and flat — the shape's credibility
   rests on "the quote is the invoice".
3. **The proof**: update `metrics` with the company's real response time,
   job count, and rating; rewrite `steps.items` if the dispatch flow
   differs.
4. **Photos**: run originals through
   `npm run image -- responsive <file> --out-dir web/app/public/services-emergency`
   and reference them with the `photo` helper (name, intrinsic size, alt).
5. **The brand**: the catalog `theme` re-brands the sitework register per
   company (the demo is utility blue). Pick a color that reads on both the
   light plan-paper and dark modes.
6. **Content tests**: `web/app/tests/View/ServicesEmergency/` guards the
   contract — run `npx vitest run tests/View/ServicesEmergency` after
   editing.
