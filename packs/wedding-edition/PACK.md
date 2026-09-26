# Pack: wedding-edition

Client-only category starter: a loud wedding photographer's site styled as a New York tabloid, at `web/app/src/View/WeddingEdition/`. The photography category's wedding template for raucous parties. It sits beside `wedding` (Isla Hart), which covers the same service business in a quieter register. This one wears its own `tabloid` preset (Anton banner caps, serif columns, newsprint, black column rules, fire-engine red, halftone-screened photographs) and the kernel's newsroom variants (`docs/landing.md`, "The newsroom set"). The whole look comes from the preset and real section variants; there are no style overrides and no pack-local page CSS.

## What ships

- A multi-page site for the fictional photographer Lou Pressman, "staff photographer" at _The Late Edition_ (Greenpoint, Brooklyn):
    - **Home**: hero `front-page` (red nameplate bar with today's date in New York time, banner headline, deck, byline with mug, halftone lead photo, caption with a jump to the roll). Then showcase `stories` (three stories under the fold, each jumping to its roll), the rate card (pricing `tiers`), letters to the editor (testimonials `quote-grid`) and the cta-banner `classified` ("Now booking 2027 — full day from $5,800").
    - **Weddings** (`/weddings`): the desk's circled picks as one gallery `contact-sheet`, every roll as a story, and the classified. Each roll opens via `?roll=<slug>` on the same route (the BlogBot `?post=` pattern) into its full contact sheet. Sprocket bands, film stock on the edge, frame numbers, grease-pencil rings and strikes, marker notes, and a lightbox that shows each photograph whole.
    - **Prices** (`/prices`): three flat-priced packages (`period: ""`), the proofing room's public door with the sample room's code, the reader FAQ (five-borough travel, second shooter, timeline, film vs digital, deposits, posing) and the classified.
    - **About** (`/about`): "No posed photos." as the headline, the staff photographer's story beside his portrait, the desk's house rules (steps `timeline`), the letters and the classified.
    - **Inquire** (`/inquire`): a detail form (names, email, date, venue, borough, guest count, vibe, the story so far) plus copyable contact channels. Submissions deliver through the managed forms pipeline (`formKey: "inquiry"`).
    - **Proofing** (`/proof?album=<slug>`): unlisted, code-gated client rooms on the platform proofing doors. Picks POST to `/__proofing/select`; demo fixtures answer when the door is unreachable (baked previews). Storage keys are scoped `wedding-edition-proof-*`, so they never collide with the wedding pack's rooms.
- **Everything renders from `content.ts`**: one typed file with no backend or CMS.
- Photographs are processed through `npm run image -- responsive` into `web/app/public/wedding-edition/`. Every image ships intrinsic dimensions and a WebP `srcSet`.
- When the pack is active it owns `/`, `/weddings`, `/prices`, `/about`, `/inquire` and `/proof`. Otherwise the same pages preview under `/wedding-edition/*`.

Set [`../active.json`](../active.json) to `{ "key": "wedding-edition" }` (or run `npm run dev:pack wedding-edition`) to make this pack the home surface.

## Register and special fields

Every field below belongs to a section _variant_, not to the register, so a remix to any other `style.preset` keeps it; the register only restyles it (docs/landing-content.md → "The registers" lists every preset and treatment). Text is click-to-edit and photographs Replace-able in the preview editor, and the content paths named are Content-panel slots in `catalog.json`'s `contentContract` (switches such as `home.layout` stay in code).

- **Register**: `tabloid` (`hairline`, `halftone`).
- **Hero** (`front-page`): `edition` — `masthead` (`photographer.paper`), computed `dateline`, `issue` (`home.issue`), `byline`/`bylineRole` and the byline portrait (Replace-able as `edition.bylineMedia`), the lead `caption`, and a jump line.
- **Rolls**: `gallery` `contact-sheet` — `rolls[].edgeCode`, `firstFrame`, and per-frame `mark` (`circle`/`cross`) and `note`.
- **Classified**: `cta-banner` `classified` (`classified.kicker/title/body/price/finePrint/signoff`).

## Agent recipe: make it yours

- Change the paper and the photographer: edit `photographer` (`paper` is the nameplate, `motto` runs over the stories), `home`, `stories`, `packages`, `classified`, `faq`, `letters`, `about` and `inquire` in `web/app/src/View/WeddingEdition/content.ts`.
- Keep the voice: headlines are tabloid ("Grandma outdances DJ"), facts are mostly true, and the joke is on the party, never on the couple.
- Swap in real photographs: run each original through `npm run image -- responsive <file> --out-dir web/app/public/wedding-edition --name <slug>` and use the `photo(name, width, height, alt)` helper. Never point a slot at a raw camera file.
- File a wedding as a roll: append to `rolls` with a unique `slug` and `number`, the film stock (`edgeCode`) and the first frame number. Sequence `frames` the way the night went. Grease-pencil a frame with `mark: "circle"` (a keeper; it also joins the desk's picks on the weddings index) or `mark: "cross"` (a reject), and add a short `note` of 24 characters or fewer.
- Point a story at a roll with its `roll` slug; its jump line opens that roll's sheet.
- Reprice: edit `packages` (flat whole dollars, exactly one `highlighted`) and keep `classified.price`/`finePrint` in step. The content tests hold them together.
- Add a proofing room: append to `demoProofingAlbums` for previews. Live rooms are created in Manage's Client galleries surface, and the access code is checked server-side.
- Content tests (`web/app/tests/View/WeddingEdition/`) guard the file: every image carries dimensions, alt text and an existing srcSet; slugs stay unique; each roll circles a keeper; stories land on real rolls; the FAQ covers the questions couples ask; the content contract binds.

## Non-goals for this pack

- Online session booking (inquiries deliver through managed forms; there is no `/book` page)
- Full-resolution delivery and print sales (proofing collects picks; delivery is the photographer's own workflow)
- Auth / accounts, e-commerce
- Server-side state: the shipped site is fully client-side
