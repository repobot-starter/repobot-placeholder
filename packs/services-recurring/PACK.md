# Cleaning & recurring services

The `services` category's **recurring/booking shape**: a site for
subscription trades — home cleaning, lawn care, pool service, pest control.
The sell is plans and repetition, not a one-off job: pricing tiers sit on
the home page, the plans page compares what's included line by line, and
the booking form asks for a frequency, not a project. The demo business is
a home cleaner (Juniper Home Cleaning, Bend, Oregon).

## What it ships

- A multi-page marketing site on the landing kernel, wearing the
  `warm-boutique` register (cream local-business warmth) with the catalog's
  **herbal-green brand overlay** — the clean-and-natural voice, deliberately
  apart from the trades register the category's other starters wear:
    - **Home** — a split hero with the live **"Open now / Closed" badge**
      (the shared hours engine) and the booking CTA; the trust metrics
      strip; the **what-every-visit-includes icon checklist**; the
      **pricing tiers on the home page** (the shape's signature — a
      subscription sells its rhythm up front); a proof gallery with a
      **lightbox**; a featured testimonial; the neighborhoods strip; a
      closing booking banner
    - **Plans & pricing** (`/plans`) — the tiers again at full strength,
      then the **line-by-line comparison table** (what's included, exactly
      — the checklist is the product), the FAQ (same team? key handling?
      guarantee?), and a booking banner
    - **About** (`/about`) — the story split beside the team photo, the
      trust strip (employees not contractors, background-checked, bonded),
      and the review grid
    - **Book** (`/book`) — a detail form that asks for home size and
      **frequency**. Submits through the platform's **managed forms
      pipeline** (formKey `booking-request`): the owner gets an email and
      a dashboard entry with zero setup
- **One content file** — `web/app/src/View/ServicesRecurring/content.ts`
  owns every word, plan, price, checklist row, and image on the site
- Demo imagery processed through `npm run image -- responsive` into
  `web/app/public/services-recurring/` — every image ships intrinsic
  dimensions and a WebP `srcSet`
- Doc-aware pages: the catalog's `landing` seeds mirror each page's code
  skeleton, so the platform's structural editor can reorder / delete / add
  sections with a live repaint

## Make it active

Set `packs/active.json` to `services-recurring` (platform installs do this
via the template flip). Inactive, the pages preview under `/cleaning`,
`/cleaning/plans`, `/cleaning/about`, `/cleaning/book`.

## Agent recipe — make it yours

1. **The business**: name, phone (update `phoneHref` in the same edit),
   email, address, and the trust line in `content.ts`.
2. **The trade**: swap the three plans (name, `perVisit` price,
   description, features) and the `planComparison` rows. A lawn-care
   variant is weekly mow / full maintenance / seasonal cleanup; pool
   service is weekly chemical / full service / one-time green-to-clean.
   Keep the comparison honest — the table is the product page.
3. **The checklist**: rewrite `included` (icon, title, one line each) for
   what every visit actually covers.
4. **The hours**: `weeklyHours` drives the live badge — minutes since
   midnight, per weekday.
5. **Photos**: run originals through
   `npm run image -- responsive <file> --out-dir web/app/public/services-recurring`
   and reference them with the `photo` helper (name, intrinsic size, alt).
6. **The brand**: the catalog `theme` re-brands warm-boutique per company
   (the demo is herbal green). Pick a color that reads on cream and dark.
7. **Content tests**: `web/app/tests/View/ServicesRecurring/` guards the
   contract — run `npx vitest run tests/View/ServicesRecurring` after
   editing.
