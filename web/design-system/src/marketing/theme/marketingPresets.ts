import { contrastText, mixHex, relativeLuminance } from "../../theme/themeConfig"

/**
 * The marketing preset definitions and their brand/font overlay math, as a
 * plain runtime module. The static build (marketingTheme.css.ts) bakes
 * these into vanilla-extract theme classes; the live path
 * (themeHotUpdate.ts) re-runs the same resolution against an edited
 * repobot.theme.json and re-declares the brand-dependent variables over
 * the stale classes — one resolution, two consumers, so the preview can
 * never drift from what a rebuild would produce.
 *
 * (This cannot live in the .css.ts: vanilla-extract serializes that
 * module's exports at build time, and the per-preset `shadowCta` /
 * `backgroundPage` functions don't survive serialization.)
 */

/**
 * Style presets. Append-only: names are public vocabulary shared with the
 * setup architect — never rename or remove one that has shipped.
 */
export type MarketingPresetName =
    | "dark-dev"
    | "soft-saas"
    | "editorial"
    | "brutalist"
    | "warm-boutique"
    | "mono-utility"
    | "aurora-dark"
    | "luxe-light"
    | "atelier"
    | "heirloom"
    | "tourbook"
    | "monolith"
    | "lanternlight"
    | "sitework"
    | "brownstone"
    | "marquee"
    | "ballroom"
    | "picnic"
    | "chalk"
    | "hymnal"
    | "broadside"
    | "crt"
    | "handheld"
    | "lounge"
    | "retroware"
    | "tideline"
    | "memphis"
    | "jacaranda"
    | "tabloid"
    | "gameday"
    | "creature"
    | "riso"
    | "paintchip"
    | "schematic"
    | "sunbelt"
    | "crown"
    | "vanity"
    | "midcentury"
    | "photobooth"
    | "disco"
    | "wayfinding"
    | "groove"
    | "inkblot"
    | "bubblegum"
    | "snapshot"
    | "rodeo"
    | "vitrine"
    | "seamless"
    | "liner"
    | "seafog"
    | "harvest"
    | "carton"
    | "daybook"
    | "jharokha"
    | "horizon"
    | "shingle"
    | "limestone"
    | "cognac"
    | "plantroom"
    | "stormline"
    | "plaster"
    | "basalt"
    | "whiteglove"
    | "palmbeach"
    | "parlor"
    | "trailhead"
    | "hearth"
    | "colophon"
    | "boreal"
    | "terrazzo"
    | "picturebook"
    | "seaglass"
    | "limone"
    | "alpine"
    | "milkglass"
    | "darkroom"
    | "buttercream"
    | "vineyard"
    | "adobe"
    | "fogline"
    | "limewash"
    | "miradouro"
    | "sprocket"
    | "galley"
    | "baylight"
    | "schist"
    | "galleyproof"

/** The two appearances every preset ships (theme contract `mode` picks). */
export type MarketingMode = "light" | "dark"

/**
 * A register's movement idiom — the ambition axis remix and section motion
 * read. `still` pages don't perform; `drift` washes breathe; `kinetic`
 * elements travel (marquees, filmstrips, tilts); `sweep` adds directed
 * light/beam movement. Lands on the page root as `data-marketing-motion`
 * so section styles opt in per idiom, and in the design manifest so the
 * platform can derive a register's energy.
 */
export type MarketingMotionIdiom = "still" | "drift" | "kinetic" | "sweep"

/**
 * Surface-treatment flags — the signatures a register wears beyond palette
 * and shape. Lands on the page root as a space-separated
 * `data-marketing-treatment` (target with `~=`), and in the design
 * manifest. `grain`: film-grain as identity, not just banding control;
 * `glow`: accent light blooms; `outline`: stroke-only display letterforms;
 * `hairline`: razor-thin frames instead of shadow elevation; `tilt`:
 * scrapbook rotation on media clusters; `scanline`: the CRT raster as a
 * fixed overlay of 1px rows in the register's own ink; `pixel`: a dithered
 * checker wash — the shading a four-shade LCD could actually do; `mist`:
 * full-bleed photographs dissolve into the page ground at their edges
 * instead of stopping on a hard line — the frame arrives out of fog;
 * `pop`: 90s pop print — display type and cards cut in ink with hard
 * offset shadows, kickers set as ink tape, the hero badge a starburst
 * sticker, tier cards framed in the register's spot colors; `confetti`:
 * the register's sparse ornament tile (squiggles, triangles, dots) drawn
 * in the page gutters, never behind copy; `halftone`: photographs print
 * through a fine dot screen with the contrast pressed up, the way a press
 * plate reproduces them (sections that opt in lay the screen over their
 * media; hover lifts it); `sport`: the sportswear campaign — condensed
 * block caps that lean italic on the accent, kickers as accent tape, CTAs
 * as slanted plates with a forward arrow, the full-bleed hero cropped
 * short so the next section kicks off above the fold, the hero badge a
 * tilted signature; `pulp`: the creature-feature poster — hand-lettered
 * caps with a hard extruded drop in the accent, kickers as billing tabs,
 * the hero badge a starburst, the hero credit the poster's billing block,
 * cards and photographs mounted like lobby cards; `two-ink`: risograph
 * print — photographs are re-separated into the register's two spot inks
 * (spot-1 for the dark plate, the accent for the warm one, printed
 * slightly off-register through a coarse dot screen) on spot-2 paper, the
 * page headline set like a poster over the print, the media caption
 * struck as a round rubber stamp; `colorblock`: Swiss color-blocking —
 * flat fields of color meet edge to edge (the split hero's photograph
 * bleeds off the page to the right and top), controls are flat chips with
 * a hard ink offset, and nothing is rounded; `signpaint`: the sign-writer's
 * hand — display letters painted with an ink outline and a drop shade in
 * the first spot color, accent words and kickers in the preset's brush
 * script, CTAs cut like painted boards, photographs torn off at their foot;
 * `linework`: the preset's ornament drawn as thin schematic line art over
 * the photographic hero (circuit symbols, a wiring diagram) and readouts
 * set as instrument strips; `sunburst`: the preset's ornament (a rising
 * half-sun of rays) behind a readout figure set in stacked 70s shadows and
 * off the closing banner's corner beside a desert ridge, hero photographs
 * framed as arched windows, and price tags hung first; `metallic`: the
 * glossy 90s cover — display type cast in chrome with the accent word in
 * gold (real text: gradient fills and bevel shadows, never an image), the
 * hero headline set as a masthead over its cover lines, kickers between
 * gold rules, the price ticker a still strip studded with stars, cards
 * framed in gold hairlines; `lacquer`: the beauty counter — ultra-high-
 * contrast fashion serif display with a blush first line and the accent
 * word in lipstick, tiny wide-tracked caps, swatches set as framed shade
 * cards around their texture, hairline frames and gloss highlights on
 * black; `atomic`: the 1950s furniture catalog — the split hero's
 * photograph runs off the page edge beside a cream copy panel ruled above
 * and below its headline, the preset's ornament (a half-disc, a ring, and
 * an atomic star) set in the copy panel's corner, card grids numbered as a
 * catalog strip ("01 02 03" cycling the register's inks between vertical
 * hairlines), specimen plates and price lists set as numbered catalog
 * entries, and small starbursts beside kickers and the wordmark; `zine`:
 * the cut-and-paste friendship zine — kickers as taped labels in the first
 * spot ink, display lines hand-lettered in marker with an accent swoosh
 * under the title, photographs printed as white-bordered snapshots set a
 * few degrees off square, CTAs as typed accent tags; `mirrorball`: the
 * disco supper club — kickers flanked by sparkle stars in the second spot
 * (gold), section titles over a foil rule, the accent phrase in the
 * preset's script, CTAs as foil pills, photographs framed in a thin gold
 * hairline, and the hero seal hung with the preset's mirror ball;
 * `transit`: the 1970s transit wayfinding system — the hero set as a
 * station sign panel in the accent with a signal-colored rule, kickers and
 * section heads as route bars, icons struck as circular pictograms, lists
 * hung on heavy rule lines, the nav a full-width sign band; `sleeve`: the
 * soul LP sleeve — the split hero's photograph a square record cover, the
 * seal a round record label, the hero aside and price list set as a Side A
 * / Side B tracklist with durations flush right; `wall-label`: the gallery
 * poster — artworks hang unframed on the wall ground (their paper
 * multiplies into it), the headline a centered museum title, the hero aside
 * and cards set as museum wall labels, links as quiet catalogue entries;
 * `candy`: Y2K candy pop — inflated display letters with a glossy highlight
 * and a hard candy drop, the hero aside and kickers as die-cut stickers,
 * cards as glossy pills, CTAs as jelly buttons; `taped`: the fridge door —
 * photographs become white-bordered prints stuck up at a lean with masking
 * tape, captions and kickers written on in the preset's felt-tip script,
 * the hero seal a sticky note in the first spot color, CTAs a marker-red
 * plate with an arrow; `lariat`: the rodeo poster — the preset's ornament
 * (a rope frame tile) roping the hero photograph and the closing banner,
 * kickers flanked by stars, the hero credit a ribbon banner, the seal a
 * stamped roundel, cards printed like tickets; `ruled`: the faire-part —
 * a statement hero carrying a badge (the invitation) sets its names
 * enormous over a tracked-caps line under an ink rule, and the prose runs
 * flush to the hero's edge as one column divided by ink hairlines, the way
 * a printed invitation is ruled; `keepsake`: the wedding
 * album — the timeline laid out hour by hour with the time set large and
 * light beside its photographs and a script caption under each, the rate
 * a single centered line, a small drawn heart (the preset's ornament) on
 * the rule over the places, and the ask a soft pill; `filigree`: the
 * jewel box — the hero's event panels arched like jharokha windows over
 * gold name plates, the package board and the closing ask framed in
 * double gold rules, the lotus (the preset's ornament) over the name and
 * between sections, the ask a gold plate; `panorama`: the coastal
 * masthead — the masthead-overlay name lifted off the photograph and set
 * wide above a ruled line of places with the photograph as a panorama
 * under it, kickers hung on long rules, the residences rail as
 * edge-to-edge frames, metrics as light numerals between rules, and the
 * closing ask as one ruled line with an arrow; `engraved`: the country-house
 * quarterly — the preset's crest stamped over the hero's line, the
 * full-bleed headline centered like an engraving's title, a fleuron on
 * the feature's rule, the figures' titles in small caps, the places as
 * a spaced line of Caslon, and the ask as an outlined plate with an arrow;
 * `alcove`: the private atelier — every directory portrait arched like
 * the suite's mirror in a thin stone border, the ranks ruled apart, the
 * filter a quiet dotted line of words instead of chips, the stylists'
 * names in italic, and the closing ask one centered sentence over a
 * squared button; `ritual`: the ritual room — the steps rail as a numbered
 * strip (the photograph, then the step number, its name and its minutes,
 * hairlines between), section kickers hung between long rules, the one
 * testimonial centered in italic between rules, the rates as one still
 * dotted line, and the ask as a squared plate with an arrow;
 * `gauge`: the plant-room
 * spec sheet — kickers set in the preset's monospace between accent rules,
 * specimen plates as tagged equipment cards (a mono index on the frame, the
 * use line as a service interval), hairline-framed; `dispatch`: the
 * dispatch board — day rows set as a dark board of live rows with a status
 * dot, the hero's form-first capture as a frosted intake card over its
 * photograph; `journal`: the garden journal — stories as ruled cards with
 * the photograph beside the text and an italic dateline, kickers in small
 * caps over an italic title, the preset's ornament (a sprig) beside the
 * last story; `stillness`: the garden walk — sequence frames cropped into
 * wide strips and stepped left and right, numbered in tracked light caps,
 * kickers wide-spaced, the hero seal a small stamped square; `concierge`:
 * the house manager's note — kickers in spot-1 tracked caps, the message
 * thread on a quiet white card, square ink CTAs with an arrow; `cabana`:
 * the club calendar — the preset's ornament (a bamboo frame) around the
 * page, kickers between gold rules, titles in spaced caps, schedule columns
 * as ruled month panels, cards framed like club notices; `gilt`: the Southern parlor
 * — kickers engraved in tracked caps between gilt rules with a center
 * lozenge, the full-bleed hero graded warm with its last line in the
 * display italic, the photographic timeline hung as a year of framed
 * photographs on one gilt line, portraits in arched frames, the price
 * list an engraved card, and the preset's ornament (a magnolia sprig in
 * line) set above the footer's imprint; `fieldbook`: the trail journal —
 * left-set pages, kickers led by a pencil trail line ending in a marker,
 * the full-bleed hero graded pine from the left, the promises as cards
 * with inked icon discs, the `stories` showcase as field notes (one row
 * each: the photograph, a pencil trail map — the preset's ornament, a
 * strip of four maps, one per note — and the essay), portraits in soft
 * corners, and a topographic contour over the footer; `weave`: the
 * collective's lounge — a woven textile edge (the preset's ornament, a
 * diamond tile that repeats both ways) under the nav, down the left of the
 * full-bleed hero and over the footer, kickers between small diamonds,
 * the hero's last line in ochre, the `filterable-grid` showcase as a
 * roster of portrait cards with pill filters, numbered steps on a forest
 * band, quotes on a sienna band, and a plum footer; `marginalia`: the
 * press's annotated edition — kickers in drawn small capitals under the
 * preset's ornament (a printer's star), the full-bleed hero graded from
 * the foot, the `report` content split set as a sample page on paper
 * with the section's title centered over it and its bullets as numbered
 * margin notes led by hairlines, numbered steps as three ruled columns
 * under roman numerals, rectangular small-caps asks, and a double rule
 * over the footer; `frost`: a Minnesota winter indoors — the full-bleed
 * hero washed in frost from the left and the foot so its headline sets in
 * slate over the snow, kickers in small tracked caps, the
 * `horizontal-rail` steps as one quiet track (open slate nodes, the step
 * labels as the reading line, the last node and the stretch into it in
 * the preset's one warm color) that turns vertical on phones, the
 * content split's bullets as a run of words between warm points, and
 * white cards on winter white; `terrazzo`: the lakeside
 * studio — kickers in the second ink over a short rule, before/after
 * pairs as soft-cornered plates with their month chips and case line
 * under the frame, a pictogram rail set in one white panel with arrows
 * between the steps, portraits and photographs rounded like the stone's
 * edge, and the closing banner a quiet line of type over one button;
 * `picturebook`: the storybook first visit — a rail of illustrated steps
 * becomes a row of book pages (paper plates, a gutter shadow, a numbered
 * roundel over each), its heading flanked by leaf sprigs; an icon list
 * becomes one ruled strip of facts; portraits sit in soft paper plates and
 * CTAs are soft leaf-green pills set in the display serif; `seaglass`:
 * the ocean-view practice — kickers in terracotta between two short
 * rules, stage cards under arched photographs (a pale sea-glass panel,
 * the emblem in terracotta, the list under a hairline), portraits as
 * round medallions, and the closing banner a sand band with one
 * terracotta pill; `limone`: the Italian coast on film — a centered
 * wordmark masthead in wide thin capitals, hero copy set small over the
 * photograph's foot, captioned stacks in letterspaced small caps, contact
 * sheets on a chalk mat, collections as ruled columns without cards, and
 * the closing band one quiet line of type over a hairline link; `alpine`:
 * the expedition field sheet — the studio's name in wide heavy capitals,
 * kickers, captions and labels in a monospace like a map legend, the hero
 * line low and left in a plain sans, captioned stacks as survey slates,
 * the places as ruled spec cards, packages as granite-ruled columns with
 * the chosen one in magenta, and the closing band one mono line over a
 * hairline link on a darkened photograph; `milkglass`: the daylight
 * newborn studio — the name in thin spaced capitals, titles in a light
 * serif, kickers in small sage capitals, the hero line low on a rain-soft
 * window, and the session builder as quiet photograph tiles beside a
 * summary card whose total is set in the serif; `darkroom`: the
 * portrait studio after the lights go down — charcoal and silver, a book
 * serif with engraved capitals for names and kickers, the specimens board
 * as matted museum prints with engraved plaques, and a hairline ask;
 * `framestack`: the full-bleed stack — the photographic hero and every
 * stack frame held at one size (the 4:3 frame, capped near viewport
 * height), the nav floating chromeless over the hero photograph until the
 * page scrolls, the hero copy set quiet at the frame's foot, the prose
 * after it a short band (a titled band is a list led by its title; an
 * untitled one is one centered line), and testimonials set as a centered
 * list of lines — a page of photographs with type between them, nothing
 * boxed; `tintbands` (worn with `framestack`): the bands between the
 * photographs are painted plates instead of the page ground — the prose
 * band and the closing colophon in the accent, each frame's caption band
 * in spot 1 — so the stack reads as photographs laid between colored
 * stripes; `inkover`: the full-bleed hero over a pale photograph — the
 * copy in the page ink over a wash of the page ground at its corner
 * instead of white over a dark scrim, and (with `framestack`) the floating
 * nav in the page ink too; `roomline` (worn with `framestack`): the stack
 * captioned inside its photographs — the hero headline and each
 * `captionStack` `overlay-*` caption as one quiet sentence-case line in
 * the display face at the foot of the frame, the wordmark in spaced caps;
 * `miradouro` (worn with `framestack`): the diary stack of a fashion
 * creator — the full-bleed hero's headline light and large with its accent
 * in the display italic and its asks as underlined text links, each
 * `overlay-*` caption one italic display line (place and hour, a dash, the
 * outfit), kickers in small tracked caps after a short accent rule, the
 * media rail and collections as uncarded plates and hairline rows, the
 * metrics' numerals in the display italic, the featured quote as an
 * italic pull quote, and the wordmark in the display italic; `sprocket`:
 * a film-and-streetwear creator's page — the masthead name condensed,
 * heavy and on one line across the foot of the photograph, kickers,
 * labels and the credit in the register's mono third voice, the contact
 * sheet's grease pencil in spot 1, specimen plates numbered in the
 * accent, the platforms as a ruled mono list, hard ink rules for cards,
 * the metrics as condensed numerals, and the full-bleed banner solid in
 * the accent; `galley`: a chef's photographic résumé — the full-bleed
 * hero's name in the display with its accent word in the italic and its
 * computed line and badge as ticket mono, kickers in the mono third voice
 * after a short accent rule, the photographic timeline's years as mono
 * tickets on a hairline rail with the kitchens' photographs square-cut,
 * the stories as press clippings between hairline column rules, the
 * stations as a ruled four-up of lists, the numbers in the display, and
 * the contact block as a ticket of mono labels;
 * `soundings` (worn with `framestack`): the waterfront plates — the hero
 * line set light and small at the frame's foot over a hairline-led badge,
 * the asks as a pale square button and an underlined link, each
 * `captionStack` `overlay-*` caption an address in the display face with
 * its `detail` (the place, the price, the status) in small tracked caps
 * beneath, the metrics set like chart soundings (light display numerals
 * between hairlines), and on a phone the hero's copy lifted off the
 * photograph onto the paper under it;
 * `monograph` (worn with `framestack`): the architect's monograph — the
 * full-bleed hero photograph held to the stack's one plate size with the
 * practice's line lifted off it onto the paper beneath (badge and the
 * photograph's caption as mono labels over a light headline, the
 * subheadline and the asks beside), each `captionStack` `band-*` caption
 * a numbered plate label (the numeral in the first spot ink, the
 * project, its `detail` in mono), the `feature` spread's drop cap and
 * rules in the same voice, and a media-less showcase `card-grid` set as
 * a ruled index of works;
 * `proofmark`: the one-line page — a statement hero that carries a
 * `badge` fills the first screen, the badge as a mono slug at its head
 * and the line flush left at its foot at poster scale; the text-logos
 * strip set as a plain comma-run of names in the display face ending on
 * the accent full stop; the colophon as one line with its link and an
 * arrow; labels and badges in the mono body face, no pills.
 */
export type MarketingTreatmentFlag =
    | "grain"
    | "glow"
    | "outline"
    | "hairline"
    | "tilt"
    | "scanline"
    | "pixel"
    | "mist"
    | "pop"
    | "confetti"
    | "halftone"
    | "sport"
    | "pulp"
    | "two-ink"
    | "colorblock"
    | "signpaint"
    | "linework"
    | "sunburst"
    | "metallic"
    | "lacquer"
    | "atomic"
    | "zine"
    | "mirrorball"
    | "transit"
    | "sleeve"
    | "wall-label"
    | "candy"
    | "taped"
    | "lariat"
    | "ruled"
    | "keepsake"
    | "filigree"
    | "panorama"
    | "engraved"
    | "alcove"
    | "ritual"
    | "gauge"
    | "dispatch"
    | "journal"
    | "stillness"
    | "concierge"
    | "cabana"
    | "gilt"
    | "fieldbook"
    | "weave"
    | "marginalia"
    | "frost"
    | "terrazzo"
    | "picturebook"
    | "seaglass"
    | "limone"
    | "alpine"
    | "milkglass"
    | "darkroom"
    | "framestack"
    | "tintbands"
    | "inkover"
    | "roomline"
    | "miradouro"
    | "sprocket"
    | "galley"
    | "soundings"
    | "monograph"
    | "proofmark"

// Font stacks mirror the self-hosted `repobot.theme.json` presets
// (see web/design-system/src/theme/themeConfig.ts FONT_PRESETS and
// web/app/src/fonts.css); every family degrades to a platform stack.
const SANS_FALLBACK = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
const SERIF_FALLBACK = "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif"
const MONO_FALLBACK = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace"
const INTER = `'Inter', ${SANS_FALLBACK}`
const MANROPE = `'Manrope', ${SANS_FALLBACK}`
const SOURCE_SERIF = `'Source Serif 4', ${SERIF_FALLBACK}`
const SPACE_GROTESK = `'Space Grotesk', ${SANS_FALLBACK}`
const PLEX_MONO = `'IBM Plex Mono', ${MONO_FALLBACK}`
const FRAUNCES = `'Fraunces', ${SERIF_FALLBACK}`
// Self-hosted italic-only cut (web/app/src/fonts.css): the memphis register
// sets every display line slanted, so no upright file ships.
const RUBIK_ITALIC = `'Rubik', ${SANS_FALLBACK}`
// Google Fonts (web/app/index.html), like Fraunces: the sign-painter's
// kit — a fat show-card block letter, a brush script, and a sturdy
// grotesk off a California storefront for the body.
const LUCKIEST_GUY = `'Luckiest Guy', 'Arial Black', Impact, ${SANS_FALLBACK}`
const KAUSHAN_SCRIPT = `'Kaushan Script', 'Brush Script MT', cursive`
const BARLOW = `'Barlow', ${SANS_FALLBACK}`
// Google Fonts: the flyer's wide extended grotesk (schematic).
const UNBOUNDED = `'Unbounded', ${SANS_FALLBACK}`
// Google Fonts: a fat rounded 70s display and a thin sign-script (sunbelt).
const BAGEL_FAT_ONE = `'Bagel Fat One', 'Cooper Black', ${SANS_FALLBACK}`
const SACRAMENTO = `'Sacramento', 'Brush Script MT', cursive`
// Google Fonts: a heavy width-axis grotesk cut like transit sign lettering (wayfinding).
const ARCHIVO_TRANSIT = `'Archivo', 'Helvetica Neue', Arial, ${SANS_FALLBACK}`
// Google Fonts: a fat soft-cornered 70s display and a warm italic-rich text serif (groove).
const CAPRASIMO = `'Caprasimo', 'Cooper Black', ${SERIF_FALLBACK}`
const NEWSREADER = `'Newsreader', ${SERIF_FALLBACK}`
// Google Fonts: a high-contrast display Garamond and its book-weight twin (inkblot).
const CORMORANT = `'Cormorant', 'Cormorant Garamond', Garamond, ${SERIF_FALLBACK}`
const EB_GARAMOND = `'EB Garamond', Garamond, ${SERIF_FALLBACK}`
// Google Fonts: an inflated balloon display, a round geometric body, and a
// ballpoint script (bubblegum).
const MODAK = `'Modak', 'Chango', 'Arial Rounded MT Bold', ${SANS_FALLBACK}`
const OUTFIT = `'Outfit', ${SANS_FALLBACK}`
const YELLOWTAIL = `'Yellowtail', 'Brush Script MT', cursive`
// Platform-native chrome stack (nothing to self-host): Tahoma/Verdana are
// the OS-dialog faces the retroware register's whole read depends on —
// they ship on every desktop platform and degrade to the sans stack.
const CHROME_SANS = `Tahoma, Verdana, Geneva, ${SANS_FALLBACK}`
// Tabloid headline type: Anton (self-hosted, web/app/src/fonts.css) with
// the condensed faces most desktops already carry as the fallback ladder.
const ANTON = `'Anton', 'Oswald', Impact, Haettenschweiler, 'Arial Narrow Bold', ${SANS_FALLBACK}`
// Gameday's athletic block caps (self-hosted as "Barlow Condensed Gameday",
// upright + italic 800, apart from riso's Google-hosted faces): the
// jersey-number condensed grotesk, falling back to the platform's narrow
// bolds.
const BARLOW_CONDENSED = `'Barlow Condensed Gameday', 'Arial Narrow', 'Roboto Condensed', Impact, ${SANS_FALLBACK}`
// Creature's poster lettering (self-hosted): the hand-inked caps of a
// drive-in one-sheet; Impact is the closest shape every desktop carries.
const BANGERS = `'Bangers', Impact, Haettenschweiler, 'Arial Narrow Bold', ${SANS_FALLBACK}`
// Google Fonts (web/app/index.html): the riso register's condensed poster
// caps (its workaday body cut is BARLOW above), and the paintchip
// register's tight grotesk (Inter, self-hosted, carries its body).
const BARLOW_CONDENSED_RISO = `'Barlow Condensed', 'Arial Narrow', ${SANS_FALLBACK}`
const INTER_TIGHT = `'Inter Tight', 'Inter', ${SANS_FALLBACK}`
// Google Fonts (web/app/index.html): crown's one variable grotesk — Archivo
// carries a width axis, so the masthead runs expanded and the cover lines
// condensed from the same family — and vanity's Didone (Bodoni Moda at its
// display optical size) over a geometric sans for the tiny tracked caps.
const ARCHIVO = `'Archivo', 'Arial Black', ${SANS_FALLBACK}`
const BODONI_MODA = `'Bodoni Moda', 'Didot', 'Bodoni 72', ${SERIF_FALLBACK}`
const JOST = `'Jost', 'Futura', 'Century Gothic', ${SANS_FALLBACK}`
// The midcentury register (self-hosted, web/app/src/fonts.css): Oswald's
// condensed catalog caps for display, Jost's geometric Futura revival for
// the text — Futura itself and Century Gothic are the platform fallbacks.
// Its Jost registers as "Jost Midcentury", apart from vanity's Google Jost.
const OSWALD = `'Oswald', 'Arial Narrow', Impact, ${SANS_FALLBACK}`
const JOST_MIDCENTURY = `'Jost Midcentury', Futura, 'Century Gothic', ${SANS_FALLBACK}`
// Self-hosted (web/app/src/fonts.css): the photobooth register's felt-tip.
const PERMANENT_MARKER = `'Permanent Marker', 'Marker Felt', 'Comic Sans MS', cursive`
// Google Fonts (web/app/index.html): the disco register's high-contrast
// Didone (BODONI_MODA, shared with vanity above), its geometric deco sans,
// and a swashy supper-club script.
const JOSEFIN_SANS = `'Josefin Sans', Futura, ${SANS_FALLBACK}`
const GREAT_VIBES = `'Great Vibes', 'Snell Roundhand', cursive`
// Snapshot's fridge-door kit (self-hosted, web/app/src/fonts.css): a
// condensed heavy grotesk for the shouted caps (Archivo's 75% width,
// named apart so a customer Archivo never collides) and a felt-tip hand
// for the captions written on the prints.
const ARCHIVO_SNAPSHOT = `'Archivo Snapshot', 'Arial Narrow', Impact, ${SANS_FALLBACK}`
const GOCHI_HAND = `'Gochi Hand', 'Marker Felt', 'Comic Sans MS', cursive`
// Rodeo's poster type (self-hosted): a wood-type Western display and a
// sturdy slab for the reading copy, both degrading to the slab serifs
// desktops carry.
const RYE = `'Rye', 'Rockwell Extra Bold', Rockwell, ${SERIF_FALLBACK}`
const BITTER = `'Bitter', Rockwell, ${SERIF_FALLBACK}`
// Daybook's wedding-morning kit (self-hosted, web/app/src/fonts.css): a
// light variable grotesk for the plain-spoken headlines and the reading
// copy, and a fine handwritten script for the captions under the photos.
const HANKEN_GROTESK = `'Hanken Grotesk', 'Helvetica Neue', Arial, ${SANS_FALLBACK}`
const MS_MADI = `'Ms Madi', 'Snell Roundhand', 'Apple Chancery', cursive`
// Jharokha's jewel-box type (self-hosted): a heavy high-contrast display
// serif drawn for Latin and Devanagari, over a carved-capital text face.
const ROZHA_ONE = `'Rozha One', 'Bodoni 72', Didot, ${SERIF_FALLBACK}`
const MARCELLUS = `'Marcellus', Optima, 'Trajan Pro', ${SERIF_FALLBACK}`
// Horizon's type (self-hosted): the widest cut of Lexend for the tracked
// masthead and heads, its readable Deca width for the text.
const LEXEND_GIGA = `'Lexend Giga', 'Helvetica Neue', ${SANS_FALLBACK}`
const LEXEND_DECA = `'Lexend Deca', 'Helvetica Neue', ${SANS_FALLBACK}`
// Shingle's engraved type (self-hosted): Caslon at its display size for
// the headlines, its text cut (with italic) for the story.
const LIBRE_CASLON_DISPLAY = `'Libre Caslon Display', 'Big Caslon', ${SERIF_FALLBACK}`
const LIBRE_CASLON_TEXT = `'Libre Caslon Text', 'Big Caslon', ${SERIF_FALLBACK}`
// Limestone's atelier type (self-hosted): a Didone for the headlines and
// the stylists' italic names, over an old-style book face.
const LIBRE_BODONI = `'Libre Bodoni', 'Bodoni 72', Didot, ${SERIF_FALLBACK}`
const CRIMSON_PRO = `'Crimson Pro', Garamond, ${SERIF_FALLBACK}`
// Cognac's type (self-hosted): a sharp modern display serif over a
// screen-first text serif with a true italic.
const GLOOCK = `'Gloock', 'Bodoni 72', ${SERIF_FALLBACK}`
const SPECTRAL = `'Spectral', Georgia, ${SERIF_FALLBACK}`
// The Group 2 service registers (self-hosted, web/app/src/fonts.css).
// plantroom: an engineering condensed sans over its full-width twin, with
// IBM Plex Mono as the spec-sheet voice.
const SOFIA_CONDENSED = `'Sofia Sans Condensed', 'Arial Narrow', ${SANS_FALLBACK}`
const SOFIA_SANS = `'Sofia Sans', ${SANS_FALLBACK}`
// stormline: a working grotesque for the board over a plain civic text face.
const SCHIBSTED = `'Schibsted Grotesk', 'Helvetica Neue', Arial, ${SANS_FALLBACK}`
const PUBLIC_SANS = `'Public Sans', ${SANS_FALLBACK}`
// plaster: an old-style garden serif (its italic carries the display) over a warm grotesque.
const SORTS_MILL_GOUDY = `'Sorts Mill Goudy', 'Goudy Old Style', Garamond, ${SERIF_FALLBACK}`
const KARLA = `'Karla', ${SANS_FALLBACK}`
// basalt: a light wide-spaced display sans and its text twin.
const RED_HAT_DISPLAY = `'Red Hat Display', ${SANS_FALLBACK}`
const RED_HAT_TEXT = `'Red Hat Text', ${SANS_FALLBACK}`
// whiteglove: a black geometric display over a clean geometric text face.
const URBANIST = `'Urbanist', Futura, 'Century Gothic', ${SANS_FALLBACK}`
const DM_SANS = `'DM Sans', ${SANS_FALLBACK}`
// palmbeach: a classic Caslon over Franklin Gothic's revival.
const LIBRE_CASLON = `'Libre Caslon Text', 'Big Caslon', Caslon, ${SERIF_FALLBACK}`
const LIBRE_FRANKLIN = `'Libre Franklin', 'Franklin Gothic', ${SANS_FALLBACK}`
// Parlor's engraved-card pair (self-hosted, web/app/src/fonts.css): a
// transitional Baskerville revival with a true italic for the accent line,
// over a soft, open humanist sans for the reading copy.
const BASKERVVILLE = `'Baskervville', Baskerville, 'Libre Baskerville', ${SERIF_FALLBACK}`
const MULISH = `'Mulish', 'Avenir Next', Avenir, ${SANS_FALLBACK}`
// Trailhead's field-journal pair (self-hosted, web/app/src/fonts.css): a
// soft, rounded book-face display over a warm text serif built for long
// reading on screens.
const YOUNG_SERIF = `'Young Serif', 'Cooper Std', Georgia, ${SERIF_FALLBACK}`
const LITERATA = `'Literata', Charter, 'Iowan Old Style', Georgia, ${SERIF_FALLBACK}`
// Hearth's lounge pair (self-hosted, web/app/src/fonts.css): a bold,
// high-contrast display serif with warm ink traps over a friendly
// geometric sans for the reading copy.
const GLOOCK_HEARTH = `'Gloock', 'Bodoni 72', Didot, Georgia, ${SERIF_FALLBACK}`
const FIGTREE = `'Figtree', 'Avenir Next', Avenir, ${SANS_FALLBACK}`
// Colophon's press pair (self-hosted, web/app/src/fonts.css): one
// screen-first book serif for headlines and text, and its drawn small
// capitals as the third voice for kickers, labels, and asks.
const SPECTRAL_COLOPHON = `'Spectral Colophon', 'Iowan Old Style', Charter, Georgia, ${SERIF_FALLBACK}`
const SPECTRAL_SC = `'Spectral SC', 'Spectral Colophon', 'Iowan Old Style', Georgia, ${SERIF_FALLBACK}`
// Boreal's one face (self-hosted, web/app/src/fonts.css): a variable
// humanist grotesk set light for display and at text weight below.
const COMMISSIONER = `'Commissioner', 'Avenir Next', 'Segoe UI', ${SANS_FALLBACK}`
// Terrazzo (self-hosted, web/app/src/fonts.css): a clean geometric display
// (FIGTREE, hearth's, above) and a rounder text companion — the lakeside
// studio's quiet sans pair.
const PLUS_JAKARTA = `'Plus Jakarta Sans', 'Avenir Next', ${SANS_FALLBACK}`
// Fraunces at its softest (SOFT 100, a static instance under its own family
// name so it never collides with the sharp Fraunces other presets set).
const FRAUNCES_SOFT = `'Fraunces Soft', 'Fraunces', ${SERIF_FALLBACK}`
const NUNITO_TEXT = `'Nunito Text', 'Nunito', ${SANS_FALLBACK}`
// Seaglass (self-hosted): a narrow modern serif with a true italic, and its
// grotesk companion for the reading copy.
const INSTRUMENT_SERIF = `'Instrument Serif', ${SERIF_FALLBACK}`
const INSTRUMENT_SANS = `'Instrument Sans', ${SANS_FALLBACK}`
// Limone (self-hosted): a hairline high-contrast display face and a
// humanist sans with small-cap proportions for the reading copy.
const ITALIANA = `'Italiana', 'Didot', ${SERIF_FALLBACK}`
const TENOR_SANS = `'Tenor Sans', 'Gill Sans', ${SANS_FALLBACK}`
// Alpine (self-hosted): a wide heavy grotesque for the name, a neutral
// grotesque for the reading copy, and a monospace for the legend.
const ANYBODY_WIDE = `'Anybody Wide', 'Arial Black', ${SANS_FALLBACK}`
const ALBERT_SANS = `'Albert Sans', ${SANS_FALLBACK}`
const DM_MONO = `'DM Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace`
// Milkglass (self-hosted): a thin book serif and a light grotesque.
const SPECTRAL_MILKGLASS = `'Spectral Milkglass', 'Iowan Old Style', ${SERIF_FALLBACK}`
const WORK_SANS = `'Work Sans', ${SANS_FALLBACK}`
// Darkroom (self-hosted): an old-style book serif and engraved capitals.
const CRIMSON_PRO_DARKROOM = `'Crimson Pro', 'Iowan Old Style', ${SERIF_FALLBACK}`
const CINZEL = `'Cinzel', 'Trajan Pro', ${SERIF_FALLBACK}`
// buttercream: Fraunces at its softest (the Fraunces Soft file under its own
// family, see web/app/src/fonts.css) over Figtree's friendly grotesque.
const FRAUNCES_SOFT_BUTTERCREAM = `'Fraunces Soft Buttercream', 'Fraunces', ${SERIF_FALLBACK}`
const FIGTREE_BUTTERCREAM = `'Figtree', ${SANS_FALLBACK}`
// vineyard: Baskervville's crisp transitional roman over the Caslon text cut.
const BASKERVVILLE_VINEYARD = `'Baskervville', Baskerville, ${SERIF_FALLBACK}`
// adobe: Alegreya's calligraphic roman over its humanist sans.
const ALEGREYA = `'Alegreya', ${SERIF_FALLBACK}`
const ALEGREYA_SANS = `'Alegreya Sans', ${SANS_FALLBACK}`
// fogline: Instrument Serif's narrow display cut over Instrument Sans
// (INSTRUMENT_SERIF / INSTRUMENT_SANS, seaglass's, above).
// limewash: Castoro's quiet Dutch roman over Spectral's text cut.
const CASTORO = `'Castoro', ${SERIF_FALLBACK}`
// miradouro: Noto Serif Display's high-contrast roman and italic over Manrope.
const NOTO_SERIF_DISPLAY = `'Noto Serif Display', 'Didot', ${SERIF_FALLBACK}`
// sprocket: Bricolage Grotesque's condensed heavy cut over Geist, Geist Mono as the third voice.
const BRICOLAGE_GROTESQUE = `'Bricolage Grotesque', 'Arial Narrow', ${SANS_FALLBACK}`
const GEIST = `'Geist', ${SANS_FALLBACK}`
const GEIST_MONO = `'Geist Mono', ${MONO_FALLBACK}`
// galley: Besley's Clarendon (the bistro menu board) over IBM Plex Sans, Plex Mono as the ticket voice.
const BESLEY = `'Besley', 'Clarendon', ${SERIF_FALLBACK}`
const PLEX_SANS = `'IBM Plex Sans', ${SANS_FALLBACK}`
// baylight: Noto Serif Display's hairline light cut over Be Vietnam Pro. The
// static 2022 Noto cuts baylight was tuned on sit under their own family,
// apart from miradouro's variable Noto Serif Display.
const NOTO_SERIF_DISPLAY_BAYLIGHT = `'Noto Serif Display Baylight', ${SERIF_FALLBACK}`
const BE_VIETNAM_PRO = `'Be Vietnam Pro', ${SANS_FALLBACK}`
// schist: Geist's light and regular cuts for display and text, Geist Mono for
// the labels — static cuts under their own families, apart from sprocket's
// variable Geist and Geist Mono.
const GEIST_SCHIST = `'Geist Schist', ${SANS_FALLBACK}`
const GEIST_MONO_SCHIST = `'Geist Mono Schist', ${MONO_FALLBACK}`
// galleyproof: Redaction 35 (a serif degraded like a photocopied proof) over Martian Mono.
const REDACTION_35 = `'Redaction 35', ${SERIF_FALLBACK}`
const MARTIAN_MONO = `'Martian Mono', ${MONO_FALLBACK}`

/**
 * Film-grain tile (inline SVG turbulence): layered over large gradient
 * washes it kills banding and reads as printed texture instead of a screen
 * gradient. Opacity lives inside the SVG so the tile composites safely on
 * any wash; 160px repeat is small enough to stay non-directional.
 */
const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E")`

/** The grain tile, shared with the backdrop art layers (MarketingBackdrop). */
export const grainTile = GRAIN

/** An inline SVG as a CSS url() — only the characters data URIs choke on are escaped. */
function svgUrl(svg: string): string {
    const escaped = svg
        .replace(/%/g, "%25")
        .replace(/#/g, "%23")
        .replace(/</g, "%3C")
        .replace(/>/g, "%3E")
        .replace(/"/g, "'")
    return `url("data:image/svg+xml,${escaped}")`
}

/**
 * The memphis ornament tile: ten shapes per 2200px of page — squiggles,
 * triangles, a dot grid, a zigzag, a ring — pinned to the two page edges
 * (left shapes at fixed x from 0, right shapes translated back from 100%)
 * so they land in the gutters at any page width and never under copy. No
 * viewBox: the tile renders at the size the treatment CSS gives it (page
 * width x 2200px), so shapes stay crisp and undistorted. Static by design.
 */
function memphisOrnament(ink: string, pink: string, aqua: string, lemon: string): string {
    const squiggle = (color: string) =>
        `<path d="M4 22 q 12 -20 24 0 t 24 0 t 24 0" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round"/>`
    const triangle = (color: string) =>
        `<path d="M6 52 L 52 46 L 24 6 Z" fill="${color}" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>`
    const zigzag = (color: string) =>
        `<path d="M4 18 l 12 -12 l 12 12 l 12 -12 l 12 12 l 12 -12" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`
    const ring = (color: string) =>
        `<circle cx="26" cy="26" r="17" fill="${color}" stroke="${ink}" stroke-width="3"/><circle cx="31" cy="31" r="17" fill="none" stroke="${ink}" stroke-width="3" opacity="0.18"/>`
    const dots = [0, 1, 2, 3]
        .flatMap((row) =>
            [0, 1, 2, 3].map(
                (col) => `<circle cx="${6 + col * 13}" cy="${6 + row * 13}" r="3" fill="${ink}"/>`,
            ),
        )
        .join("")
    const left = (y: number, x: number, shape: string) =>
        `<svg x="${x}" y="${y}" overflow="visible">${shape}</svg>`
    const right = (y: number, inset: number, shape: string) =>
        `<svg x="100%" y="${y}" overflow="visible"><g transform="translate(-${inset} 0)">${shape}</g></svg>`
    return svgUrl(
        `<svg xmlns="http://www.w3.org/2000/svg">` +
            left(150, 26, squiggle(aqua)) +
            left(620, 34, triangle(pink)) +
            left(1080, 36, dots) +
            left(1560, 30, ring(lemon)) +
            left(1980, 26, zigzag(pink)) +
            right(360, 86, ring(lemon)) +
            right(840, 96, zigzag(ink)) +
            right(1300, 84, triangle(aqua)) +
            right(1760, 104, squiggle(pink)) +
            right(2120, 80, dots) +
            `</svg>`,
    )
}

/**
 * Riso paper tooth: a heavier, warmer grain than GRAIN — ink-colored
 * speckle (the fiber flecks of uncoated stock) at a visible density, so
 * the ground reads as paper under the prints. Fixed ink (sage flecks on
 * cream read as the paper in both appearances).
 */
function risoTooth(fleck: string): string {
    return svgUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220">` +
            `<filter id="t"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>` +
            `<feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.6 1.55"/></filter>` +
            `<rect width="220" height="220" fill="${fleck}" filter="url(#t)" opacity="0.2"/></svg>`,
    )
}

/**
 * The riso ornament tile: botanical line cuts in one ink — a grass tuft, a
 * leaf sprig, a prickly pear, an agave — pinned to the two page edges like
 * the memphis tile (left shapes at fixed x, right shapes translated back
 * from 100%), drawn at gutter scale so they read as the printer's border
 * plants, never behind copy. Static, stroke-only.
 */
function risoOrnament(ink: string): string {
    const stroke = `fill="none" stroke="${ink}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"`
    const tuft =
        `<g ${stroke}>` +
        `<path d="M44 150 C 42 110 30 70 8 34"/><path d="M44 150 C 45 100 50 52 44 4"/>` +
        `<path d="M44 150 C 50 108 66 72 88 44"/><path d="M44 150 C 36 118 20 100 2 94"/>` +
        `<path d="M44 150 C 54 124 72 112 92 108"/><path d="M44 150 C 40 120 38 90 24 58"/>` +
        `<path d="M44 150 C 50 124 58 96 68 72"/></g>`
    const leaf = (x: number, y: number, angle: number) =>
        `<path transform="translate(${x} ${y}) rotate(${angle})" d="M0 0 C 8 -10 26 -12 38 -4 C 26 4 10 6 0 0 Z M0 0 L 30 -5"/>`
    const sprig =
        `<g ${stroke}><path d="M18 196 C 34 150 46 100 50 8"/>` +
        leaf(46, 40, -40) +
        leaf(48, 44, 200) +
        leaf(42, 84, -30) +
        leaf(44, 88, 210) +
        leaf(36, 128, -24) +
        leaf(38, 132, 214) +
        leaf(28, 166, -16) +
        leaf(30, 170, 220) +
        `</g>`
    const spines = (cx: number, cy: number) =>
        [-8, 0, 8]
            .flatMap((dx) => [-10, 2, 14].map((dy) => `<path d="M${cx + dx} ${cy + dy} l 2 -2"/>`))
            .join("")
    const pear =
        `<g ${stroke}>` +
        `<ellipse cx="52" cy="150" rx="30" ry="40"/>` +
        `<ellipse cx="24" cy="86" rx="20" ry="28" transform="rotate(-22 24 86)"/>` +
        `<ellipse cx="82" cy="80" rx="19" ry="27" transform="rotate(20 82 80)"/>` +
        `<ellipse cx="86" cy="28" rx="12" ry="17" transform="rotate(8 86 28)"/>` +
        spines(52, 150) +
        spines(24, 86) +
        spines(82, 80) +
        `<path d="M0 192 H 110"/></g>`
    const agave =
        `<g ${stroke}>` +
        `<path d="M60 130 C 56 90 50 50 60 4 C 68 50 66 90 60 130"/>` +
        `<path d="M60 130 C 44 100 24 70 4 48 C 34 62 50 92 60 130"/>` +
        `<path d="M60 130 C 76 100 96 70 116 48 C 86 62 70 92 60 130"/>` +
        `<path d="M60 130 C 36 118 16 108 0 104 C 26 100 44 110 60 130"/>` +
        `<path d="M60 130 C 84 118 104 108 120 104 C 94 100 76 110 60 130"/>` +
        `<path d="M60 130 C 50 104 40 80 30 22 C 48 60 56 96 60 130"/>` +
        `<path d="M60 130 C 70 104 80 80 90 22 C 72 60 64 96 60 130"/>` +
        `<path d="M14 136 H 106"/></g>`
    const left = (y: number, x: number, shape: string) =>
        `<svg x="${x}" y="${y}" overflow="visible">${shape}</svg>`
    const right = (y: number, inset: number, shape: string) =>
        `<svg x="100%" y="${y}" overflow="visible"><g transform="translate(-${inset} 0)">${shape}</g></svg>`
    return svgUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" opacity="0.62">` +
            left(96, 18, sprig) +
            left(720, 12, pear) +
            left(1340, 20, tuft) +
            left(1880, 12, agave) +
            right(160, 116, tuft) +
            right(640, 124, agave) +
            right(1180, 92, sprig) +
            right(1760, 124, pear) +
            `</svg>`,
    )
}

/**
 * Sign-board paint: the soft, uneven mottle of enamel brushed onto a
 * board by hand, tinted in the register's ink. Laid under the
 * grain on the page ground so the cream reads as a painted panel, not a
 * flat screen fill.
 */
function paintTexture(ink: string, opacity: number): string {
    return svgUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="480">` +
            `<filter id="p" x="0" y="0" width="100%" height="100%">` +
            `<feTurbulence type="fractalNoise" baseFrequency="0.005 0.011" numOctaves="3" seed="7" stitchTiles="stitch"/>` +
            `<feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.5 0 0 0 -0.5" result="n"/>` +
            `<feFlood flood-color="${ink}"/><feComposite in2="n" operator="in"/></filter>` +
            `<rect width="720" height="480" filter="url(#p)" opacity="${opacity}"/>` +
            `</svg>`,
    )
}

/**
 * The terrazzo ground: a 360px tile of stone chips — small irregular
 * polygons in the register's inks scattered at a fixed seed, so the floor
 * reads the same on every load and every page. Opacity lives in the SVG;
 * the chips stay small enough to sit behind copy without speckling it.
 */
function terrazzoChips(inks: readonly string[], opacity: number): string {
    let seed = 20180611
    const next = (): number => {
        seed = (seed * 1103515245 + 12345) % 2147483648
        return seed / 2147483648
    }
    const chips: string[] = []
    for (let index = 0; index < 72; index++) {
        const cx = next() * 360
        const cy = next() * 360
        const radius = 1.4 + next() * next() * 5.2
        const corners = 4 + Math.floor(next() * 3)
        const turn = next() * Math.PI * 2
        const points = Array.from({ length: corners }, (_, corner) => {
            const angle = turn + (corner / corners) * Math.PI * 2
            const reach = radius * (0.6 + next() * 0.6)
            return `${(cx + Math.cos(angle) * reach).toFixed(1)},${(cy + Math.sin(angle) * reach).toFixed(1)}`
        }).join(" ")
        chips.push(`<polygon points="${points}" fill="${inks[index % inks.length]}"/>`)
    }
    return svgUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="360"><g opacity="${opacity}">` +
            chips.join("") +
            `</g></svg>`,
    )
}

/**
 * The lariat ornament: a 48px border-image tile with a twisted rope run
 * 5–13px in from every edge and a whipped knot at each corner. Sliced at
 * 16px, each edge's middle third is exactly four strand periods wide, so
 * `border-image-repeat: round` lays the rope around any box seamlessly
 * (and a top-only border draws a straight rope rule).
 */
function lariatFrame(rope: string, strand: string): string {
    return svgUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">` +
            `<defs>` +
            `<pattern id="h" width="4" height="48" patternUnits="userSpaceOnUse">` +
            `<rect width="4" height="48" fill="${rope}"/>` +
            `<path d="M-4 13 L1 5 M0 13 L5 5 M4 13 L9 5 M-4 43 L1 35 M0 43 L5 35 M4 43 L9 35" stroke="${strand}" stroke-width="1.5"/>` +
            `</pattern>` +
            `<pattern id="v" width="48" height="4" patternUnits="userSpaceOnUse">` +
            `<rect width="48" height="4" fill="${rope}"/>` +
            `<path d="M5 -4 L13 1 M5 0 L13 5 M5 4 L13 9 M35 -4 L43 1 M35 0 L43 5 M35 4 L43 9" stroke="${strand}" stroke-width="1.5"/>` +
            `</pattern>` +
            `</defs>` +
            `<rect x="0" y="5" width="48" height="8" fill="url(#h)"/>` +
            `<rect x="0" y="35" width="48" height="8" fill="url(#h)"/>` +
            `<rect x="5" y="0" width="8" height="48" fill="url(#v)"/>` +
            `<rect x="35" y="0" width="8" height="48" fill="url(#v)"/>` +
            `<g fill="none" stroke="${strand}" stroke-width="0.8" opacity="0.7">` +
            `<path d="M0 5 H48 M0 13 H48 M0 35 H48 M0 43 H48 M5 0 V48 M13 0 V48 M35 0 V48 M43 0 V48"/>` +
            `</g>` +
            `<g fill="${rope}" stroke="${strand}" stroke-width="1.4">` +
            `<circle cx="9" cy="9" r="6"/><circle cx="39" cy="9" r="6"/>` +
            `<circle cx="9" cy="39" r="6"/><circle cx="39" cy="39" r="6"/>` +
            `</g>` +
            `<g stroke="${strand}" stroke-width="1.2">` +
            `<path d="M5 7 H13 M5 11 H13 M35 7 H43 M35 11 H43 M5 37 H13 M5 41 H13 M35 37 H43 M35 41 H43"/>` +
            `</g>` +
            `</svg>`,
    )
}

/**
 * The palmbeach ornament: a bamboo frame as a border-image tile — green
 * canes with pale nodes down every edge, lashed at the four corners — the
 * `cabana` treatment runs it around the whole page like a club poster's
 * border.
 */
function bambooFrame(cane: string, node: string): string {
    const caneH = (y: number) =>
        `<rect x="0" y="${y}" width="48" height="8" fill="${cane}"/>` +
        `<path d="M10 ${y} V${y + 8} M30 ${y} V${y + 8}" stroke="${node}" stroke-width="2"/>`
    const caneV = (x: number) =>
        `<rect x="${x}" y="0" width="8" height="48" fill="${cane}"/>` +
        `<path d="M${x} 10 H${x + 8} M${x} 30 H${x + 8}" stroke="${node}" stroke-width="2"/>`
    return svgUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">` +
            caneH(4) +
            caneH(36) +
            caneV(4) +
            caneV(36) +
            `<g fill="${node}"><rect x="2" y="2" width="12" height="12" rx="3"/><rect x="34" y="2" width="12" height="12" rx="3"/>` +
            `<rect x="2" y="34" width="12" height="12" rx="3"/><rect x="34" y="34" width="12" height="12" rx="3"/></g>` +
            `<g stroke="${cane}" stroke-width="1.2"><path d="M4 6 L12 12 M12 6 L4 12 M36 6 L44 12 M44 6 L36 12 M4 38 L12 44 M12 38 L4 44 M36 38 L44 44 M44 38 L36 44"/></g>` +
            `</svg>`,
    )
}

/**
 * The plaster ornament: an olive sprig in thin engraving line — a curved
 * stem, paired leaves, three fruit — which the `journal` treatment sets
 * beside the garden journal's last story. Stroke-only, one ink.
 */
function oliveSprig(ink: string): string {
    const leaf = (x: number, y: number, angle: number) =>
        `<path transform="translate(${x} ${y}) rotate(${angle})" d="M0 0 C 6 -8, 22 -8, 30 0 C 22 8, 6 8, 0 0 Z M2 0 H28" fill="none" stroke="${ink}" stroke-width="1.3"/>`
    return svgUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="220" viewBox="0 0 160 220">` +
            `<path d="M36 212 C 58 160, 70 110, 118 16" fill="none" stroke="${ink}" stroke-width="1.6" stroke-linecap="round"/>` +
            leaf(52, 176, -150) +
            leaf(56, 170, -30) +
            leaf(66, 138, -160) +
            leaf(72, 130, -20) +
            leaf(82, 100, -150) +
            leaf(88, 92, -30) +
            leaf(98, 64, -165) +
            leaf(104, 56, -15) +
            leaf(114, 30, -120) +
            `<g fill="none" stroke="${ink}" stroke-width="1.3"><ellipse cx="44" cy="150" rx="6" ry="8"/><ellipse cx="96" cy="118" rx="6" ry="8"/><ellipse cx="60" cy="112" rx="5" ry="7"/></g>` +
            `</svg>`,
    )
}

/**
 * The schematic ornament: an electrician's drawing in thin line art — a
 * house wiring diagram standing on a ground bus, a feeder down the left
 * edge (resistor, capacitor, coil), a switched lamp circuit across the
 * top, a breaker and fuse run off to the right. One 1600x900 composition
 * the `linework` treatment lays over the photographic hero (cover-fit,
 * anchored to the foot), so the copy's column and the subject stay clear.
 */
function schematicOrnament(ink: string, spark: string): string {
    const line = `fill="none" stroke="${ink}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"`
    const ground = (x: number, y: number) =>
        `<path d="M${x} ${y} v24 M${x - 14} ${y + 24} h28 M${x - 9} ${y + 31} h18 M${x - 4} ${y + 38} h8" ${line}/>`
    const dot = (x: number, y: number) => `<circle cx="${x}" cy="${y}" r="3.2" fill="${ink}"/>`
    const resistorV = (x: number, y: number) =>
        `<path d="M${x} ${y} l9 6 l-18 12 l18 12 l-18 12 l18 12 l-9 6" ${line}/>`
    const coilV = (x: number, y: number) =>
        `<path d="M${x} ${y} a9 9 0 0 1 0 18 a9 9 0 0 1 0 18 a9 9 0 0 1 0 18 a9 9 0 0 1 0 18" ${line}/>`
    return svgUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice">` +
            // The ground bus and its drops.
            `<path d="M0 812 H1600" ${line}/>` +
            ground(150, 812) +
            ground(430, 812) +
            ground(1010, 812) +
            ground(1330, 812) +
            // The house: roof, walls, floor, windows, door, chimney.
            `<path d="M548 660 L736 552 L924 660 M568 648 V812 M904 648 V812 M568 736 H904" ${line}/>` +
            `<path d="M846 604 V566 H872 V620" ${line}/>` +
            `<path d="M604 676 h58 v44 h-58 z M633 676 v44 M604 698 h58 M810 676 h58 v44 h-58 z M839 676 v44 M810 698 h58" ${line}/>` +
            `<path d="M714 812 v-58 h44 v58 M604 760 h52 v34 h-52 z M816 760 h52 v34 h-52 z" ${line}/>` +
            // Branch circuits inside the walls, outlets as small rings.
            `<path d="M588 736 V786 H604 M884 736 V786 H868 M736 736 V754" ${line}/>` +
            `<circle cx="588" cy="700" r="7" ${line}/><circle cx="884" cy="700" r="7" ${line}/>` +
            // Service drop from the roof peak to the meter.
            `<path d="M736 552 V470 H500" ${line}/>` +
            `<circle cx="486" cy="470" r="14" ${line}/><path d="M478 474 q8 -12 16 0" ${line}/>` +
            `<path d="M472 470 H300 V600" ${line}/>` +
            dot(736, 470) +
            // The left feeder: resistor, capacitor, coil, down to ground.
            `<path d="M86 96 V250" ${line}/>` +
            resistorV(86, 250) +
            `<path d="M86 322 V430 M66 430 h40 M66 442 h40 M86 442 V540" ${line}/>` +
            coilV(86, 540) +
            `<path d="M86 612 V812" ${line}/>` +
            dot(86, 812) +
            // The switched lamp run across the top.
            `<path d="M86 96 H420 M420 96 l40 -18 M466 96 H760" ${line}/>` +
            dot(420, 96) +
            dot(466, 96) +
            `<circle cx="780" cy="96" r="20" ${line}/><path d="M766 82 l28 28 M794 82 l-28 28" ${line}/>` +
            `<path d="M800 96 H1040 V260" ${line}/>` +
            `<path d="M1026 220 h28 l-14 22 z M1026 242 h28" ${line}/>` +
            // A tap line with a live node in the spark ink.
            `<path d="M300 600 H250 M300 600 V700 H430 V812" ${line}/>` +
            `<circle cx="300" cy="600" r="5" fill="${spark}"/>` +
            // The right run: breaker, fuse, to ground.
            `<path d="M904 784 H1120 M1120 770 h40 v28 h-40 z M1160 784 H1260" ${line}/>` +
            `<path d="M1260 774 h54 v20 h-54 z M1260 784 H1314 M1314 784 H1330 V812" ${line}/>` +
            `<path d="M1136 784 l18 -12" ${line}/>` +
            `<circle cx="1330" cy="784" r="5" fill="${spark}"/>` +
            `</svg>`,
    )
}

/**
 * The sunburst ornament: a half-sun rising off the ground line — a solid
 * disc and eighteen rays alternating the register's hot inks, the 70s
 * desert-motel sign. One 800x420 composition; the `sunburst` treatment
 * sizes and places it (the closing banner's lower corner).
 */
function sunburstOrnament(sun: string, rayA: string, rayB: string, ground: string): string {
    const rays = Array.from({ length: 18 }, (_, index) => {
        const start = Math.PI + (index * Math.PI) / 18
        const end = start + Math.PI / 18
        const r = 400
        const x1 = (400 + r * Math.cos(start)).toFixed(1)
        const y1 = (400 + r * Math.sin(start)).toFixed(1)
        const x2 = (400 + r * Math.cos(end)).toFixed(1)
        const y2 = (400 + r * Math.sin(end)).toFixed(1)
        return `<path d="M400 400 L${x1} ${y1} L${x2} ${y2} Z" fill="${index % 2 === 0 ? rayA : rayB}"/>`
    }).join("")
    return svgUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 420" preserveAspectRatio="xMidYMax meet">` +
            rays +
            `<circle cx="400" cy="400" r="150" fill="${ground}"/>` +
            `<circle cx="400" cy="400" r="128" fill="${sun}"/>` +
            `<rect x="0" y="400" width="800" height="20" fill="${ground}"/>` +
            `</svg>`,
    )
}

/**
 * The atomic ornament: the 1950s catalog's corner device — a half-disc
 * set on the ground line, a thin ring floating over it, and a four-point
 * atomic star with its fine diagonal rays. One 360x300 composition; the
 * `atomic` treatment sizes and places it (the split hero's copy panel).
 */
function atomicOrnament(disc: string, ring: string, star: string): string {
    const rays = [0, 45, 90, 135]
        .map((angle) => {
            const long = angle % 90 === 0
            const r = long ? 22 : 13
            const dx = (r * Math.cos((angle * Math.PI) / 180)).toFixed(1)
            const dy = (r * Math.sin((angle * Math.PI) / 180)).toFixed(1)
            return `<path d="M${(262 - Number(dx)).toFixed(1)} ${(196 - Number(dy)).toFixed(1)} L${(262 + Number(dx)).toFixed(1)} ${(196 + Number(dy)).toFixed(1)}" stroke="${star}" stroke-width="${long ? 2.4 : 1.6}" stroke-linecap="round"/>`
        })
        .join("")
    return svgUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 300" preserveAspectRatio="xMaxYMax meet">` +
            `<path d="M20 300 A130 130 0 0 1 280 300 Z" fill="${disc}"/>` +
            `<circle cx="252" cy="150" r="92" fill="none" stroke="${ring}" stroke-width="2.5"/>` +
            rays +
            `<circle cx="262" cy="196" r="3.2" fill="${star}"/>` +
            `</svg>`,
    )
}

/**
 * The disco sparkle tile: four-point glints scattered at three sizes over a
 * 420px repeat — the light a mirror ball throws across a dark room. Fixed
 * geometry, gold and white; opacity lives in the SVG so it layers safely.
 */
function discoSparkle(gold: string, white: string): string {
    const glint = (x: number, y: number, r: number, color: string, opacity: number) =>
        `<path d="M${x} ${y - r} C ${x + r * 0.14} ${y - r * 0.14} ${x + r * 0.14} ${y - r * 0.14} ${x + r} ${y} ` +
        `C ${x + r * 0.14} ${y + r * 0.14} ${x + r * 0.14} ${y + r * 0.14} ${x} ${y + r} ` +
        `C ${x - r * 0.14} ${y + r * 0.14} ${x - r * 0.14} ${y + r * 0.14} ${x - r} ${y} ` +
        `C ${x - r * 0.14} ${y - r * 0.14} ${x - r * 0.14} ${y - r * 0.14} ${x} ${y - r} Z" fill="${color}" opacity="${opacity}"/>`
    const dot = (x: number, y: number, r: number, color: string, opacity: number) =>
        `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="${opacity}"/>`
    return svgUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="420">` +
            glint(62, 48, 9, gold, 0.5) +
            glint(318, 96, 5, white, 0.45) +
            glint(188, 214, 7, gold, 0.34) +
            glint(384, 300, 10, gold, 0.42) +
            glint(96, 352, 5, white, 0.36) +
            glint(250, 386, 4, gold, 0.4) +
            dot(140, 120, 1.4, white, 0.5) +
            dot(270, 30, 1.2, gold, 0.6) +
            dot(30, 230, 1.3, gold, 0.5) +
            dot(352, 190, 1.1, white, 0.45) +
            dot(212, 318, 1.4, white, 0.4) +
            dot(402, 402, 1.2, gold, 0.5) +
            `</svg>`,
    )
}

/**
 * The disco ornament: a mirror ball — a silver sphere ruled into facets,
 * a few tiles catching the light in the gold and pink inks, hung from a
 * chain. The hero seal and the closing banner hang it (`mirrorball`).
 */
function mirrorBallOrnament(steel: string, shine: string, gold: string, pink: string): string {
    const rows = [18, 30, 42, 54, 66, 78]
        .map(
            (y) =>
                `<path d="M8 ${y} Q 50 ${y + (y < 48 ? -6 : 6)} 92 ${y}" fill="none" stroke="${steel}" stroke-width="1" opacity="0.55"/>`,
        )
        .join("")
    const cols = [-30, -18, -6, 6, 18, 30]
        .map(
            (dx) =>
                `<path d="M50 4 Q ${50 + dx * 1.7} 50 50 96" fill="none" stroke="${steel}" stroke-width="1" opacity="0.55"/>`,
        )
        .join("")
    const tile = (x: number, y: number, color: string, opacity: number) =>
        `<rect x="${x}" y="${y}" width="9" height="9" fill="${color}" opacity="${opacity}" transform="rotate(8 ${x + 4} ${y + 4})"/>`
    return svgUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -24 100 124">` +
            `<defs><radialGradient id="b" cx="0.36" cy="0.32" r="0.75">` +
            `<stop offset="0" stop-color="${shine}"/><stop offset="0.55" stop-color="${steel}"/><stop offset="1" stop-color="#1b1a1f"/>` +
            `</radialGradient><clipPath id="c"><circle cx="50" cy="50" r="46"/></clipPath></defs>` +
            `<path d="M50 -24 V 4" stroke="${gold}" stroke-width="1.6"/>` +
            `<circle cx="50" cy="50" r="46" fill="url(#b)"/>` +
            `<g clip-path="url(#c)">${rows}${cols}` +
            tile(28, 24, shine, 0.95) +
            tile(40, 34, shine, 0.7) +
            tile(62, 58, gold, 0.8) +
            tile(22, 58, pink, 0.6) +
            tile(70, 30, shine, 0.45) +
            tile(46, 72, gold, 0.5) +
            `</g><circle cx="50" cy="50" r="46" fill="none" stroke="${gold}" stroke-width="1.4"/>` +
            `</svg>`,
    )
}

/**
 * The keepsake ornament: a hairline broken by a small drawn heart — the
 * divider a wedding album sets between the rate and the places. 240x16,
 * drawn at its own size where the `keepsake` treatment sets it.
 */
function keepsakeHeart(ink: string): string {
    return svgUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="16" viewBox="0 0 240 16">` +
            `<path d="M0 8 H104 M136 8 H240" stroke="${ink}" stroke-width="1"/>` +
            `<path d="M120 14 C111 8 107 4.5 110.5 2.2 C113.5 0.4 117.5 1.6 120 5 C122.5 1.6 126.5 0.4 129.5 2.2 C133 4.5 129 8 120 14 Z" fill="${ink}"/>` +
            `</svg>`,
    )
}

/**
 * The filigree ornament: a gold lotus between two scrolls, the flourish
 * a jharokha window's lintel carries — set over the collage's name and on
 * the rules between sections by the `filigree` treatment. 120x36.
 */
function filigreeLotus(gold: string): string {
    return svgUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="36" viewBox="0 0 120 36">` +
            `<g fill="${gold}">` +
            `<path d="M60 3 C54 11 54 21 60 30 C66 21 66 11 60 3 Z"/>` +
            `<path d="M60 30 C50 27 44 19 43 10 C51 14 57 21 60 30 Z"/>` +
            `<path d="M60 30 C70 27 76 19 77 10 C69 14 63 21 60 30 Z"/>` +
            `<circle cx="4" cy="24" r="2"/><circle cx="116" cy="24" r="2"/>` +
            `</g>` +
            `<g fill="none" stroke="${gold}" stroke-width="1.6" stroke-linecap="round">` +
            `<path d="M42 27 C32 31 20 31 12 25 C6 20 10 13 16 15 C21 17 19 23 14 22"/>` +
            `<path d="M78 27 C88 31 100 31 108 25 C114 20 110 13 104 15 C99 17 101 23 106 22"/>` +
            `</g>` +
            `</svg>`,
    )
}

/**
 * The engraved crest: a crowned shield between laurel sprays, drawn in
 * one ink like a letterpress die — the `engraved` treatment stamps it
 * over the hero's line and beside the closing ask. 80x88.
 */
function engravedCrest(ink: string): string {
    const leaves =
        `<path d="M22 32 C12 44 12 62 30 80" fill="none" stroke="${ink}" stroke-width="1.4"/>` +
        `<path d="M17 40 q-7 -1 -8 -8 q7 1 8 8 Z M14 50 q-7 0 -9 -7 q7 0 9 7 Z M15 60 q-6 2 -10 -4 q7 -1 10 4 Z M19 69 q-5 3 -10 -2 q6 -2 10 2 Z M25 76 q-4 4 -9 0 q5 -3 9 0 Z" fill="${ink}"/>`
    return svgUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="88" viewBox="0 0 80 88">` +
            `<path d="M26 16 L29 6 L35 12 L40 3 L45 12 L51 6 L54 16 Z" fill="${ink}"/>` +
            `<g fill="none" stroke="${ink}">` +
            `<path d="M24 20 H56 V44 C56 58 48 67 40 73 C32 67 24 58 24 44 Z" stroke-width="1.6"/>` +
            `<path d="M28 24 H52 V44 C52 55 46 62 40 67 C34 62 28 55 28 44 Z" stroke-width="0.9"/>` +
            `<path d="M30 40 L40 48 L50 40" stroke-width="1.4"/>` +
            `</g>` +
            leaves +
            `<g transform="translate(80 0) scale(-1 1)">${leaves}</g>` +
            `</svg>`,
    )
}

/**
 * The parlor ornament: a magnolia branch in fine line — one open bloom,
 * a bud, four leaves on a curving stem — the engraver's corner device.
 * One 260x260 composition; the `gilt` treatment sizes and places it (a
 * sprig above the footer's imprint). Stroke-only, so it reads as drawn,
 * not stamped.
 */
function magnoliaOrnament(ink: string): string {
    const line = `fill="none" stroke="${ink}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"`
    return svgUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 260">` +
            `<g ${line}>` +
            // The stem, rising from the lower left.
            `<path d="M18 252 C 52 214 84 186 118 150 C 140 126 150 104 156 82"/>` +
            `<path d="M86 184 C 70 168 64 150 66 132"/>` +
            // Leaves.
            `<path d="M60 222 C 36 214 20 196 16 172 C 40 176 56 194 60 222 Z M60 222 C 44 204 32 190 20 178"/>` +
            `<path d="M104 164 C 124 170 146 166 162 150 C 140 142 118 146 104 164 Z M104 164 C 124 158 142 154 158 152"/>` +
            `<path d="M66 132 C 52 116 50 98 58 80 C 72 94 74 114 66 132 Z"/>` +
            `<path d="M132 134 C 150 146 172 148 188 138 C 172 124 150 122 132 134 Z"/>` +
            // The open bloom.
            `<path d="M156 82 C 134 70 124 48 132 24 C 150 38 160 58 156 82 Z"/>` +
            `<path d="M156 82 C 162 58 180 42 204 40 C 200 62 182 78 156 82 Z"/>` +
            `<path d="M156 82 C 176 76 200 84 214 102 C 190 108 170 100 156 82 Z"/>` +
            `<path d="M156 82 C 138 88 118 84 104 70 C 124 62 144 66 156 82 Z"/>` +
            `<path d="M156 82 C 150 66 152 52 160 40 M156 82 C 168 70 178 62 190 58"/>` +
            `<circle cx="157" cy="80" r="4"/>` +
            // A closed bud on the side shoot.
            `<path d="M66 132 C 60 150 70 160 80 158 M58 80 C 54 66 58 54 66 46 C 72 56 70 70 58 80"/>` +
            `</g></svg>`,
    )
}

/**
 * The trailhead ornament: four pencil trail maps in one 640x160 strip —
 * a contour loop with a pine, switchbacks to a summit, a creek crossing,
 * a folded map with a pin — each a 160x160 cell. The `fieldbook`
 * treatment shows one cell per field note (background-size 400%, the
 * position stepping 0/33/67/100%), so every note gets its own map from
 * one image. Graphite line only, dotted where the trail runs.
 */
function trailMapsOrnament(ink: string): string {
    const line = `fill="none" stroke="${ink}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"`
    const trail = `fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round" stroke-dasharray="0.1 6"`
    const pine = (x: number, y: number) =>
        `<path d="M${x} ${y - 26} L${x - 9} ${y - 8} H${x + 9} Z M${x} ${y - 16} L${x - 12} ${y + 4} H${x + 12} Z M${x} ${y + 4} V${y + 10}"/>`
    return svgUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 160">` +
            // 1. A contour loop, the trail climbing through it, a pine.
            `<g ${line}>` +
            `<path d="M30 40 C 60 18 110 22 128 48 C 146 74 132 118 100 132 C 70 146 30 130 22 100 C 14 72 16 52 30 40 Z"/>` +
            `<path d="M48 58 C 70 44 102 48 112 68 C 120 88 104 110 82 114 C 60 118 42 106 40 88 C 38 74 40 64 48 58 Z"/>` +
            `<path d="M66 74 C 76 66 92 68 96 80 C 98 92 88 100 78 98 C 68 96 62 84 66 74 Z"/>` +
            pine(138, 128) +
            `</g>` +
            `<path ${trail} d="M16 146 C 36 124 56 116 66 100 C 76 84 94 80 102 64 C 108 52 120 42 142 34"/>` +
            // 2. Switchbacks up to a summit mark.
            `<g ${line}>` +
            `<path d="M186 132 C 200 70 222 36 244 30 C 268 26 292 70 304 132"/>` +
            `<path d="M204 132 C 214 88 230 58 246 54 C 262 52 280 88 288 132"/>` +
            `<path d="M224 132 C 230 106 240 84 248 82 C 258 82 266 106 270 132"/>` +
            `<path d="M238 24 L246 12 L254 24 Z"/>` +
            `</g>` +
            `<path ${trail} d="M176 150 L236 132 L200 114 L254 98 L222 80 L252 62 L236 44 L246 30"/>` +
            // 3. A creek, the trail crossing it, two pines on the far bank.
            `<g ${line}>` +
            `<path d="M330 22 C 362 52 352 84 390 104 C 420 120 444 124 476 146"/>` +
            `<path d="M342 18 C 374 48 366 78 402 96 C 432 110 452 116 480 132"/>` +
            pine(440, 58) +
            pine(460, 74) +
            `<path d="M378 132 C 386 126 396 126 404 132"/>` +
            `</g>` +
            `<path ${trail} d="M336 146 C 360 124 380 110 390 98 C 404 80 408 60 424 44 C 438 30 456 26 474 26"/>` +
            // 4. A folded map, the route across it, a pin at the end.
            `<g ${line}>` +
            `<path d="M496 44 L540 32 L584 44 L628 32 V124 L584 136 L540 124 L496 136 Z"/>` +
            `<path d="M540 32 V124 M584 44 V136"/>` +
            `<path d="M608 38 C 600 38 596 44 596 50 C 596 60 608 72 608 72 C 608 72 620 60 620 50 C 620 44 616 38 608 38 Z"/>` +
            `<circle cx="608" cy="50" r="3.2"/>` +
            `</g>` +
            `<path ${trail} d="M508 120 C 526 100 546 112 562 92 C 578 72 592 84 606 74"/>` +
            `</svg>`,
    )
}

/**
 * The hearth ornament: one 48x48 woven tile — a diamond inside a diamond
 * around a center dot, half-diamonds at the edges so the tile meets its
 * neighbours in a continuous lattice, and a rule along the top and
 * bottom. It repeats both ways, so the `weave` treatment lays it as a
 * horizontal edge (repeat-x) and a vertical one (repeat-y) from one image.
 */
function wovenTileOrnament(ink: string): string {
    const line = `fill="none" stroke="${ink}" stroke-width="2.4" stroke-linejoin="miter"`
    return svgUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">` +
            `<g ${line}>` +
            `<path d="M24 5 L43 24 L24 43 L5 24 Z"/>` +
            `<path d="M24 14 L34 24 L24 34 L14 24 Z"/>` +
            `<path d="M0 12 L12 0 M36 0 L48 12 M0 36 L12 48 M36 48 L48 36"/>` +
            `<path d="M0 1.5 H48 M0 46.5 H48"/>` +
            `</g>` +
            `<circle cx="24" cy="24" r="3.4" fill="${ink}"/>` +
            `<path d="M0 20 L4 24 L0 28 Z M48 20 L44 24 L48 28 Z" fill="${ink}"/>` +
            `</svg>`,
    )
}

/**
 * The colophon ornament: a printer's star — eight tapered rays around an
 * open ring, the fleuron a press sets over a chapter head. One 40x40 mark;
 * the `marginalia` treatment centers it over kickers and the footer rule.
 */
function printersStarOrnament(ink: string): string {
    const rays = [0, 45, 90, 135, 180, 225, 270, 315]
        .map(
            (angle, index) =>
                `<path transform="rotate(${angle} 20 20)" d="M20 ${index % 2 === 0 ? 1.5 : 6} L21.6 14.4 L20 16.4 L18.4 14.4 Z"/>`,
        )
        .join("")
    return svgUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">` +
            `<g fill="${ink}">${rays}</g>` +
            `<circle cx="20" cy="20" r="2.6" fill="none" stroke="${ink}" stroke-width="1.2"/>` +
            `</svg>`,
    )
}

export interface PresetPalette {
    pageBg: string
    surface: string
    line: string
    text: string
    subtle: string
    /** The preset's art-direction accent; the customer brand wins over it. */
    accent: string
    /**
     * The register's label ink on accent plates (primary CTAs, badges): a
     * gold plate lettered in the room's black rather than white. Kept
     * wherever it reads on the resolved accent (≥4.5:1, brand or preset),
     * otherwise the plate's own readable ink. Omitted, labels take
     * contrastText(accent) wherever it reaches 3:1 on the accent, and the
     * plate's readable ink below that.
     */
    onAccent?: string
}

/**
 * One appearance of a preset: everything that must be re-authored when the
 * page ground flips between light and dark. Type, shape metrics, and layout
 * stay shared across modes — they ARE the preset; the palette, elevation
 * language, and wash are per-mode surface treatments.
 */
export interface PresetModeVariant {
    palette: PresetPalette
    shadowCard: string
    /** Receives the resolved accent for glow-style shadows. */
    shadowCta: (accent: string) => string
    /** Receives the resolved accent so page washes stay on brand. */
    backgroundPage: (accent: string) => string
    /**
     * Extra print inks beside the accent (multi-color registers only).
     * MarketingPage emits them as `--marketing-spot-1` / `--marketing-spot-2`;
     * section styles read them with the accent as fallback, so a preset
     * without spots stays single-accent everywhere.
     */
    spot?: readonly [string, string]
    /**
     * The register's ornament: a full background-image value MarketingPage
     * emits as `--marketing-ornament`. Each treatment that reads it decides
     * where it lands: `confetti` draws it in the page gutters on wide
     * viewports (MarketingPage.styles.css.ts), `linework` over the
     * photographic hero, `sunburst` off the closing banner's corner.
     */
    ornament?: string
}

export interface PresetDefinition {
    /**
     * The mode this preset's art direction was authored in — its lean.
     * Packs that pin a preset stamp this as the theme contract's `mode` at
     * compose time, so a fresh project opens in the preset's native
     * appearance; the Feel appearance toggle then always wins (it swaps to
     * the other authored variant, never a naive inversion).
     */
    nativeMode: MarketingMode
    /**
     * `script` (optional): a third voice — a brush or sign script, or a
     * press's drawn small capitals, the register sets accent words and
     * kickers in where its treatment asks (signpaint, sunburst,
     * marginalia). MarketingPage emits it as
     * `--marketing-font-script`; readers fall back to the display face.
     */
    fonts: { display: string; body: string; script?: string }
    /**
     * Display-type voice. `scale` is the ambition axis: a multiplier the
     * big display moments (hero headlines, stat numerals) calc() against —
     * "1" is the classic scale, monumental registers push past 1.25 so the
     * type IS the layout instead of sitting in it.
     */
    display: { weight: string; tracking: string; accentStyle: string; transform: string; scale: string }
    shape: {
        radiusCard: string
        radiusControl: string
        borderWidth: string
    }
    /** Movement: the idiom (see MarketingMotionIdiom) + rise-on-load duration ("0ms" disables). */
    motion: { idiom: MarketingMotionIdiom; rise: string }
    /** Surface signatures (see MarketingTreatmentFlag); empty = quiet surfaces. */
    treatment: readonly MarketingTreatmentFlag[]
    maxWidth: string
    modes: { light: PresetModeVariant; dark: PresetModeVariant }
}

export const marketingPresetDefinitions: Record<MarketingPresetName, PresetDefinition> = {
    // Launch-pack lineage: near-black page, one saturated accent. The wash
    // is a three-bloom aurora under film grain — fixed pixel geometry so
    // the color lives where the hero is, whatever the page's height.
    "dark-dev": {
        nativeMode: "dark",
        fonts: { display: MANROPE, body: INTER },
        display: { weight: "800", tracking: "-0.03em", accentStyle: "normal", transform: "none", scale: "1" },
        shape: {
            radiusCard: "16px",
            radiusControl: "12px",
            borderWidth: "1px",
        },
        motion: { idiom: "drift", rise: "480ms" },
        treatment: ["grain", "glow"],
        maxWidth: "1080px",
        modes: {
            dark: {
                palette: {
                    pageBg: "#090d1d",
                    surface: "#131a34",
                    line: "#28305a",
                    text: "#eef0fb",
                    subtle: "#9aa3c7",
                    accent: "#f5b83d",
                },
                // Inset hairline highlight + deep drop: glass panels instead
                // of flat rectangles on the dark page.
                shadowCard: "inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 20px 48px rgba(2, 6, 22, 0.5)",
                shadowCta: (accent) => `0 0 36px color-mix(in srgb, ${accent} 30%, transparent)`,
                backgroundPage: (accent) =>
                    `${GRAIN}, ` +
                    `radial-gradient(1100px 520px at 82% -140px, color-mix(in srgb, ${accent} 20%, transparent), transparent 60%), ` +
                    "radial-gradient(900px 480px at -10% 22%, rgba(93, 111, 255, 0.16), transparent 55%), " +
                    "radial-gradient(1000px 620px at 55% 115%, rgba(168, 85, 247, 0.10), transparent 60%)",
            },
            // Daylight developer register: indigo-tinted paper, the amber
            // accent deepened to hold contrast on white, the same aurora
            // geometry at print-light opacities.
            light: {
                palette: {
                    pageBg: "#f7f8fd",
                    surface: "#ffffff",
                    line: "#dbe0f2",
                    text: "#111635",
                    subtle: "#5a628c",
                    accent: "#b47708",
                },
                shadowCard: "0 1px 2px rgba(17, 22, 53, 0.05), 0 18px 44px rgba(17, 22, 53, 0.10)",
                shadowCta: (accent) => `0 8px 24px color-mix(in srgb, ${accent} 28%, transparent)`,
                backgroundPage: (accent) =>
                    `radial-gradient(1100px 520px at 82% -140px, color-mix(in srgb, ${accent} 10%, transparent), transparent 60%), ` +
                    "radial-gradient(900px 480px at -10% 22%, rgba(93, 111, 255, 0.08), transparent 55%), " +
                    "radial-gradient(1000px 620px at 55% 115%, rgba(168, 85, 247, 0.05), transparent 60%)",
            },
        },
    },
    // Repobot-marketing lineage: light and friendly, now wearing a proper
    // iridescent aurora (accent + cyan + pink blooms) instead of a single
    // shy radial — the wash is the preset's signature, not an apology.
    "soft-saas": {
        nativeMode: "light",
        fonts: { display: MANROPE, body: MANROPE },
        display: {
            weight: "800",
            tracking: "-0.025em",
            accentStyle: "normal",
            transform: "none",
            scale: "1",
        },
        shape: {
            radiusCard: "18px",
            radiusControl: "12px",
            borderWidth: "1px",
        },
        motion: { idiom: "drift", rise: "480ms" },
        treatment: ["glow"],
        maxWidth: "1120px",
        modes: {
            light: {
                palette: {
                    pageBg: "#ffffff",
                    surface: "#ffffff",
                    line: "#dfe4f3",
                    text: "#0f1c3a",
                    subtle: "#5a6687",
                    accent: "#635bff",
                },
                // Two-layer elevation: a crisp contact shadow plus a wide
                // soft one — cards float instead of smudging.
                shadowCard: "0 1px 2px rgba(24, 36, 72, 0.05), 0 18px 50px rgba(24, 36, 72, 0.13)",
                shadowCta: (accent) => `0 10px 28px color-mix(in srgb, ${accent} 32%, transparent)`,
                backgroundPage: (accent) =>
                    `radial-gradient(1100px 520px at 50% -160px, color-mix(in srgb, ${accent} 18%, transparent), transparent 62%), ` +
                    "radial-gradient(820px 420px at 88% -60px, rgba(56, 189, 248, 0.14), transparent 55%), " +
                    "radial-gradient(760px 420px at 6% 4%, rgba(236, 121, 187, 0.10), transparent 52%)",
            },
            // Night SaaS: deep navy ground, the same friendly aurora glowing
            // instead of blushing, glass cards with an inset highlight.
            dark: {
                palette: {
                    pageBg: "#0d1226",
                    surface: "#161c3a",
                    line: "#2a3158",
                    text: "#eef1fc",
                    subtle: "#99a2c6",
                    accent: "#7d76ff",
                },
                shadowCard: "inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 20px 50px rgba(3, 6, 24, 0.5)",
                shadowCta: (accent) => `0 10px 32px color-mix(in srgb, ${accent} 40%, transparent)`,
                backgroundPage: (accent) =>
                    `${GRAIN}, ` +
                    `radial-gradient(1100px 520px at 50% -160px, color-mix(in srgb, ${accent} 26%, transparent), transparent 62%), ` +
                    "radial-gradient(820px 420px at 88% -60px, rgba(56, 189, 248, 0.16), transparent 55%), " +
                    "radial-gradient(760px 420px at 6% 4%, rgba(236, 121, 187, 0.12), transparent 52%)",
            },
        },
    },
    // Folio lineage: paper-and-ink, serif display, rules instead of cards.
    editorial: {
        nativeMode: "light",
        fonts: { display: SOURCE_SERIF, body: INTER },
        display: { weight: "600", tracking: "-0.01em", accentStyle: "italic", transform: "none", scale: "1" },
        shape: {
            radiusCard: "4px",
            radiusControl: "6px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "480ms" },
        treatment: [],
        maxWidth: "920px",
        modes: {
            light: {
                palette: {
                    pageBg: "#faf7f2",
                    surface: "#ffffff",
                    line: "#e0d9cd",
                    text: "#1c1a17",
                    subtle: "#6b645a",
                    accent: "#b4552d",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                // The faintest warm crown at the top of the paper — felt as
                // stock, not seen as a gradient. Rules and type stay the
                // whole show.
                backgroundPage: (accent) =>
                    `radial-gradient(140% 46% at 50% 0%, color-mix(in srgb, ${accent} 6%, transparent), transparent 70%)`,
            },
            // Lamplit reading: warm near-black stock, ivory ink, the
            // terracotta accent brightened a step — the same rules-and-type
            // restraint, printed in negative.
            dark: {
                palette: {
                    pageBg: "#181411",
                    surface: "#201b17",
                    line: "#3a332a",
                    text: "#f0ebe3",
                    subtle: "#a89d8e",
                    accent: "#e0784a",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: (accent) =>
                    `radial-gradient(140% 46% at 50% 0%, color-mix(in srgb, ${accent} 8%, transparent), transparent 70%)`,
            },
        },
    },
    // The anti-median-page statement: zero radius, hard ink borders, no
    // shadows, uppercase display type on stark paper.
    brutalist: {
        nativeMode: "light",
        fonts: { display: SPACE_GROTESK, body: INTER },
        display: {
            weight: "700",
            tracking: "0.01em",
            accentStyle: "normal",
            transform: "uppercase",
            scale: "1",
        },
        shape: {
            radiusCard: "0px",
            radiusControl: "0px",
            // Full commitment: double-weight ink rules and hard offset
            // shadows. Half-hearted brutalism reads as unstyled; this reads
            // as a decision.
            borderWidth: "2px",
        },
        motion: { idiom: "still", rise: "480ms" },
        treatment: [],
        maxWidth: "1000px",
        modes: {
            light: {
                palette: {
                    // Pure white, not bone: 1-bit ink-on-white is the whole
                    // statement, and the heritage System 7 Look reads truest
                    // against it.
                    pageBg: "#ffffff",
                    surface: "#ffffff",
                    line: "#17170f",
                    text: "#17170f",
                    subtle: "#55554b",
                    accent: "#2c1fe0",
                },
                shadowCard: "8px 8px 0 #17170f",
                shadowCta: () => "4px 4px 0 #17170f",
                backgroundPage: () => "none",
            },
            // The negative print: ink paper, paper rules, the hard offset
            // shadows now cast in bone — brutalism doesn't soften at night,
            // it inverts.
            dark: {
                palette: {
                    pageBg: "#14140e",
                    surface: "#1d1d15",
                    line: "#eeede2",
                    text: "#eeede2",
                    subtle: "#a5a496",
                    accent: "#8b81ff",
                },
                shadowCard: "8px 8px 0 #eeede2",
                shadowCta: () => "4px 4px 0 #eeede2",
                backgroundPage: () => "none",
            },
        },
    },
    // Menu/salon lineage: cream-and-terracotta warmth, serif display, pill
    // controls, big soft-shadowed radius.
    "warm-boutique": {
        nativeMode: "light",
        fonts: { display: SOURCE_SERIF, body: MANROPE },
        display: { weight: "700", tracking: "-0.01em", accentStyle: "normal", transform: "none", scale: "1" },
        shape: {
            radiusCard: "22px",
            radiusControl: "999px",
            borderWidth: "1px",
        },
        motion: { idiom: "drift", rise: "480ms" },
        treatment: ["glow"],
        maxWidth: "1060px",
        modes: {
            light: {
                palette: {
                    pageBg: "#faf3ea",
                    surface: "#fffdf9",
                    line: "#ecdcc8",
                    text: "#42302a",
                    subtle: "#8c7563",
                    accent: "#c25e3e",
                },
                shadowCard: "0 2px 6px rgba(116, 74, 48, 0.08), 0 22px 48px rgba(116, 74, 48, 0.15)",
                shadowCta: (accent) => `0 8px 22px color-mix(in srgb, ${accent} 30%, transparent)`,
                // Terracotta bloom on one shoulder, honey on the other: the
                // page feels sunlit instead of merely beige.
                backgroundPage: (accent) =>
                    `radial-gradient(1000px 460px at 12% -120px, color-mix(in srgb, ${accent} 16%, transparent), transparent 58%), ` +
                    "radial-gradient(900px 480px at 96% -40px, rgba(233, 178, 106, 0.20), transparent 55%)",
            },
            // Candlelit boutique: espresso ground, cream type, terracotta
            // warmed a step — the same sunlit shoulders, now embers.
            dark: {
                palette: {
                    pageBg: "#221610",
                    surface: "#2c1e16",
                    line: "#4a382b",
                    text: "#f5ebe0",
                    subtle: "#bfa691",
                    accent: "#e07a52",
                },
                shadowCard: "inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 22px 48px rgba(12, 6, 2, 0.5)",
                shadowCta: (accent) => `0 8px 26px color-mix(in srgb, ${accent} 36%, transparent)`,
                backgroundPage: (accent) =>
                    `radial-gradient(1000px 460px at 12% -120px, color-mix(in srgb, ${accent} 14%, transparent), transparent 58%), ` +
                    "radial-gradient(900px 480px at 96% -40px, rgba(233, 178, 106, 0.10), transparent 55%)",
            },
        },
    },
    // Terminal/spec-sheet minimalism: mono display type, thin rules, no
    // decoration; the accent works only in links, CTAs, and numbers.
    "mono-utility": {
        nativeMode: "light",
        fonts: { display: PLEX_MONO, body: INTER },
        display: { weight: "600", tracking: "-0.02em", accentStyle: "normal", transform: "none", scale: "1" },
        shape: {
            radiusCard: "4px",
            radiusControl: "4px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "480ms" },
        treatment: ["hairline"],
        maxWidth: "940px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f7f7f4",
                    surface: "#fdfdfb",
                    line: "#d8d8d0",
                    text: "#1b1d1b",
                    subtle: "#61665e",
                    accent: "#0f7b3f",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                // Barely-there graph paper: the spec-sheet identity made
                // literal. Hairlines at 2.8% ink stay invisible until you
                // look for them.
                backgroundPage: () =>
                    "repeating-linear-gradient(0deg, rgba(27, 29, 27, 0.028) 0 1px, transparent 1px 28px), " +
                    "repeating-linear-gradient(90deg, rgba(27, 29, 27, 0.028) 0 1px, transparent 1px 28px)",
            },
            // The terminal itself: near-black phosphor ground, the green
            // brightened to CRT legibility, graph paper ruled in faint
            // phosphor instead of ink.
            dark: {
                palette: {
                    pageBg: "#101312",
                    surface: "#171b19",
                    line: "#2c332e",
                    text: "#e6ece7",
                    subtle: "#8f9a91",
                    accent: "#34c375",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () =>
                    "repeating-linear-gradient(0deg, rgba(230, 236, 231, 0.030) 0 1px, transparent 1px 28px), " +
                    "repeating-linear-gradient(90deg, rgba(230, 236, 231, 0.030) 0 1px, transparent 1px 28px)",
            },
        },
    },
    // The molten flagship: true-black neutral page (not navy), a single
    // iridescent ribbon of violet-cyan-pink blooms sweeping the hero under
    // film grain, glass cards. The Stripe-Sessions register — for products
    // that want "edge of gorgeous" rather than "friendly SaaS".
    "aurora-dark": {
        nativeMode: "dark",
        fonts: { display: MANROPE, body: INTER },
        display: {
            weight: "800",
            tracking: "-0.035em",
            accentStyle: "normal",
            transform: "none",
            scale: "1",
        },
        shape: {
            radiusCard: "20px",
            radiusControl: "14px",
            borderWidth: "1px",
        },
        motion: { idiom: "drift", rise: "480ms" },
        treatment: ["grain", "glow"],
        maxWidth: "1120px",
        modes: {
            dark: {
                palette: {
                    pageBg: "#08080d",
                    surface: "#121218",
                    line: "#26262f",
                    text: "#f4f4f8",
                    subtle: "#9b9ba9",
                    accent: "#8b5cf6",
                },
                shadowCard: "inset 0 1px 0 rgba(255, 255, 255, 0.07), 0 24px 60px rgba(0, 0, 0, 0.55)",
                shadowCta: (accent) => `0 0 44px color-mix(in srgb, ${accent} 38%, transparent)`,
                // The ribbon: a diagonal chain of blooms sweeping down across
                // the hero — accent into cyan into pink — reads as one molten
                // band.
                backgroundPage: (accent) =>
                    `${GRAIN}, ` +
                    `radial-gradient(820px 460px at 4% 320px, color-mix(in srgb, ${accent} 32%, transparent), transparent 64%), ` +
                    "radial-gradient(860px 440px at 42% 120px, rgba(56, 189, 248, 0.20), transparent 62%), " +
                    "radial-gradient(800px 420px at 82% -60px, rgba(244, 114, 182, 0.20), transparent 60%), " +
                    "radial-gradient(900px 560px at 50% 118%, rgba(99, 102, 241, 0.10), transparent 60%)",
            },
            // Daybreak aurora: gallery-white ground with the same molten
            // ribbon at watercolor strength, the violet deepened to hold
            // ink-grade contrast.
            light: {
                palette: {
                    pageBg: "#fbfbfd",
                    surface: "#ffffff",
                    line: "#e5e5ef",
                    text: "#121218",
                    subtle: "#636370",
                    accent: "#7443f0",
                },
                shadowCard: "0 2px 5px rgba(18, 18, 24, 0.06), 0 24px 60px rgba(18, 18, 24, 0.10)",
                shadowCta: (accent) => `0 10px 32px color-mix(in srgb, ${accent} 30%, transparent)`,
                backgroundPage: (accent) =>
                    `radial-gradient(820px 460px at 4% 320px, color-mix(in srgb, ${accent} 12%, transparent), transparent 64%), ` +
                    "radial-gradient(860px 440px at 42% 120px, rgba(56, 189, 248, 0.10), transparent 62%), " +
                    "radial-gradient(800px 420px at 82% -60px, rgba(244, 114, 182, 0.10), transparent 60%), " +
                    "radial-gradient(900px 560px at 50% 118%, rgba(99, 102, 241, 0.06), transparent 60%)",
            },
        },
    },
    // The light flagship: Stripe-homepage register — near-white ground,
    // deep ink type set tight, hairline rules, crisp two-layer elevation,
    // and an iridescent band grazing the top edge. Polished-fintech, not
    // friendly-pastel; sits deliberately apart from soft-saas.
    "luxe-light": {
        nativeMode: "light",
        fonts: { display: MANROPE, body: INTER },
        display: { weight: "800", tracking: "-0.03em", accentStyle: "normal", transform: "none", scale: "1" },
        shape: {
            radiusCard: "12px",
            radiusControl: "8px",
            borderWidth: "1px",
        },
        motion: { idiom: "drift", rise: "480ms" },
        treatment: ["glow"],
        maxWidth: "1120px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f8f9fc",
                    surface: "#ffffff",
                    line: "#e3e7f2",
                    text: "#0a1733",
                    subtle: "#5b6478",
                    accent: "#0f6fff",
                },
                shadowCard: "0 2px 5px rgba(50, 50, 93, 0.08), 0 24px 60px rgba(50, 50, 93, 0.10)",
                shadowCta: (accent) => `0 8px 24px color-mix(in srgb, ${accent} 34%, transparent)`,
                backgroundPage: (accent) =>
                    `radial-gradient(720px 340px at 8% -40px, color-mix(in srgb, ${accent} 20%, transparent), transparent 62%), ` +
                    "radial-gradient(760px 340px at 38% -120px, rgba(139, 92, 246, 0.16), transparent 60%), " +
                    "radial-gradient(720px 320px at 66% -180px, rgba(244, 114, 182, 0.13), transparent 58%), " +
                    "radial-gradient(700px 300px at 92% -240px, rgba(255, 184, 108, 0.13), transparent 56%)",
            },
            // After-hours fintech: deep boardroom navy, the blue lifted to
            // signal on dark, the same iridescent band grazing the top edge.
            dark: {
                palette: {
                    pageBg: "#0a0f1f",
                    surface: "#121a33",
                    line: "#233052",
                    text: "#eef1fb",
                    subtle: "#8d96b4",
                    accent: "#4d94ff",
                },
                shadowCard: "inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 24px 60px rgba(2, 6, 20, 0.55)",
                shadowCta: (accent) => `0 8px 28px color-mix(in srgb, ${accent} 42%, transparent)`,
                backgroundPage: (accent) =>
                    `${GRAIN}, ` +
                    `radial-gradient(720px 340px at 8% -40px, color-mix(in srgb, ${accent} 24%, transparent), transparent 62%), ` +
                    "radial-gradient(760px 340px at 38% -120px, rgba(139, 92, 246, 0.18), transparent 60%), " +
                    "radial-gradient(720px 320px at 66% -180px, rgba(244, 114, 182, 0.14), transparent 58%), " +
                    "radial-gradient(700px 300px at 92% -240px, rgba(255, 184, 108, 0.12), transparent 56%)",
            },
        },
    },
    // The gallery-quiet register: near-white walls, ink type set light and
    // tracked in small caps, hairline rules, zero radius, no wash — the
    // page recedes so photographs carry every square inch of color.
    // Built for photography/portfolio sites (the Pixieset-class look); the
    // near-ink accent renders CTAs as quiet black buttons rather than a
    // brand shout.
    atelier: {
        nativeMode: "light",
        fonts: { display: INTER, body: INTER },
        display: {
            weight: "500",
            tracking: "0.06em",
            accentStyle: "normal",
            transform: "uppercase",
            scale: "1",
        },
        shape: {
            radiusCard: "0px",
            radiusControl: "0px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "480ms" },
        treatment: ["hairline"],
        maxWidth: "1160px",
        modes: {
            light: {
                palette: {
                    pageBg: "#fdfdfb",
                    surface: "#ffffff",
                    line: "#e7e5e0",
                    text: "#1b1a18",
                    subtle: "#807a72",
                    accent: "#211f1c",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
            // The dim gallery: charcoal walls, bone type, the near-ink
            // accent flipped to near-paper — CTAs become quiet white
            // buttons, photographs still carry all the color.
            dark: {
                palette: {
                    pageBg: "#141413",
                    surface: "#1b1b19",
                    line: "#2f2e2b",
                    text: "#ecebe8",
                    subtle: "#9c968d",
                    accent: "#e9e7e2",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
        },
    },
    // The romantic-editorial register: wedding-stationery warmth where
    // atelier is gallery chill. Fraunces serif display set roman-quiet with
    // an italic accent word, warm ivory ground with champagne hairlines, a
    // deep botanical-green accent (garden foliage, not florist purple), and
    // a narrow measure with generous air — the page reads as an invitation
    // suite, not a white-wall gallery.
    // Built for wedding/event studios and other keepsake trades; imagery
    // still carries the color, but the paper itself is warm instead of
    // receding to near-white.
    heirloom: {
        nativeMode: "light",
        fonts: { display: FRAUNCES, body: INTER },
        display: { weight: "500", tracking: "-0.01em", accentStyle: "italic", transform: "none", scale: "1" },
        shape: {
            // A stationery card's barely-eased corner: softer than atelier's
            // hard zero, nowhere near boutique roundness.
            radiusCard: "2px",
            radiusControl: "2px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "480ms" },
        treatment: [],
        // The narrowest measure of the image-led registers: whitespace is
        // the pacing, so the column stays close and the margins breathe.
        maxWidth: "980px",
        modes: {
            light: {
                palette: {
                    pageBg: "#faf6ee",
                    surface: "#fffdf8",
                    line: "#e8ddcb",
                    text: "#322820",
                    subtle: "#8b7d6a",
                    accent: "#46583c",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                // A champagne crown and one warm shoulder at print-light
                // opacity — felt as warm stock, never seen as a gradient;
                // rules and serif type stay the whole show.
                backgroundPage: (accent) =>
                    `radial-gradient(130% 44% at 50% 0%, color-mix(in srgb, ${accent} 6%, transparent), transparent 70%), ` +
                    "radial-gradient(900px 420px at 85% -80px, rgba(214, 178, 120, 0.12), transparent 55%)",
            },
            // Candlelit reading of the same suite: umber ground, ivory ink,
            // the green lifted to pressed sage so it reads against the dark
            // paper — the crown glows instead of blushing.
            dark: {
                palette: {
                    pageBg: "#1a1410",
                    surface: "#221a15",
                    line: "#3b3128",
                    text: "#f2e9dc",
                    subtle: "#a8988a",
                    accent: "#a9bd97",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: (accent) =>
                    `${GRAIN}, ` +
                    `radial-gradient(130% 44% at 50% 0%, color-mix(in srgb, ${accent} 9%, transparent), transparent 70%), ` +
                    "radial-gradient(900px 420px at 85% -80px, rgba(214, 178, 120, 0.08), transparent 55%)",
            },
        },
    },
    // The expedition register: a photographer's tour book, not a gallery
    // wall. Ink on plain paper under visible grain — strictly black and
    // white, so the photographs are the only color on the page — with a
    // condensed-energy uppercase masthead voice (Space Grotesk at bold);
    // the page reads as a field journal from someone mid-adventure.
    // Kinetic: filmstrips travel, media clusters tilt like taped-in
    // prints. Where atelier recedes so photographs can whisper, tourbook
    // runs alongside them shouting.
    tourbook: {
        nativeMode: "dark",
        fonts: { display: SPACE_GROTESK, body: INTER },
        display: {
            weight: "700",
            tracking: "0.015em",
            accentStyle: "normal",
            transform: "uppercase",
            scale: "1.12",
        },
        shape: {
            // Prints have corners; radius would read as UI, not paper.
            radiusCard: "2px",
            radiusControl: "4px",
            borderWidth: "1px",
        },
        motion: { idiom: "kinetic", rise: "520ms" },
        treatment: ["grain", "tilt"],
        maxWidth: "1180px",
        modes: {
            light: {
                palette: {
                    pageBg: "#fafafa",
                    surface: "#ffffff",
                    line: "#dfdfdf",
                    text: "#141414",
                    subtle: "#6e6e6e",
                    accent: "#141414",
                },
                // A print lifted off the page: crisp contact edge plus a
                // soft throw — photographs sit ON the paper, not in glass.
                shadowCard: "0 2px 5px rgba(20, 20, 20, 0.12), 0 16px 36px rgba(20, 20, 20, 0.13)",
                shadowCta: () => "none",
                // Grain over the whole sheet — the treatment IS the paper —
                // with one shadowed shoulder; the ink stays in type and
                // tape, never in the wash.
                backgroundPage: () =>
                    `${GRAIN}, ` +
                    "radial-gradient(1000px 480px at 88% -100px, rgba(20, 20, 20, 0.05), transparent 56%)",
            },
            // Night leg of the tour — the register's native face: a true-black
            // darkroom ground, white ink, the same monochrome conviction; the
            // photographs are the only light in the room.
            dark: {
                palette: {
                    pageBg: "#000000",
                    surface: "#101010",
                    line: "#2e2e2e",
                    text: "#f4f4f4",
                    subtle: "#9c9c9c",
                    accent: "#ffffff",
                },
                shadowCard: "inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 18px 40px rgba(0, 0, 0, 0.5)",
                shadowCta: () => "none",
                backgroundPage: () =>
                    `${GRAIN}, ` +
                    "radial-gradient(1000px 480px at 88% -100px, rgba(255, 255, 255, 0.05), transparent 56%)",
            },
        },
    },
    // The severe register: strict black and white, zero accent hue — the
    // Blackbox move, where monumental type and implied movement carry
    // everything color usually does. Display type past the scale ceiling,
    // stroke-only letterforms on the headline's accent word, razor hairline
    // frames instead of elevation, and a diagonal light beam swept through
    // the ground. The accent token resolves to ink-on-ground, so CTAs are
    // hard white (or black) plates; charts read as white line-work. Both
    // modes are true inversions of each other — the toggle is part of the
    // art direction, not an accommodation.
    monolith: {
        nativeMode: "dark",
        fonts: { display: SPACE_GROTESK, body: INTER },
        display: {
            weight: "700",
            tracking: "-0.04em",
            accentStyle: "normal",
            transform: "none",
            scale: "1.3",
        },
        shape: {
            radiusCard: "0px",
            radiusControl: "0px",
            borderWidth: "1px",
        },
        motion: { idiom: "sweep", rise: "620ms" },
        treatment: ["grain", "outline", "hairline"],
        maxWidth: "1200px",
        modes: {
            dark: {
                palette: {
                    pageBg: "#000000",
                    surface: "#0c0c0c",
                    line: "#2a2a2a",
                    text: "#ffffff",
                    subtle: "#9c9c9c",
                    accent: "#ffffff",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                // One diagonal beam through true black under grain: the
                // static trace of the sweep idiom (the motion layer animates
                // it; without JavaScript this is what remains).
                backgroundPage: () =>
                    `${GRAIN}, ` +
                    "linear-gradient(115deg, transparent 40%, rgba(255, 255, 255, 0.055) 50%, transparent 60%)",
            },
            // The negative: gallery-white ground, ink type, the beam cast
            // in graphite — an inversion, not a softening.
            light: {
                palette: {
                    pageBg: "#fbfbfb",
                    surface: "#ffffff",
                    line: "#dcdcdc",
                    text: "#0a0a0a",
                    subtle: "#5e5e5e",
                    accent: "#0a0a0a",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () =>
                    "linear-gradient(115deg, transparent 40%, rgba(10, 10, 10, 0.035) 50%, transparent 60%)",
            },
        },
    },
    // The nighttime-celebration register: a barn party in full swing —
    // string lights against a midnight sky, "a little bit louder now".
    // Staid monochrome: true-black ground, white ink, zero accent hue —
    // the photographs carry all the color of the night. Fraunces display
    // with an italic accent word over pill controls that read as festival
    // wristbands. Kinetic like tourbook (tilted polaroid clusters,
    // traveling strips) but glowing instead of taped: the white blooms in
    // the wash are the bulbs overhead. Where heirloom is the keepsake
    // after the day, lanternlight is the night itself.
    lanternlight: {
        nativeMode: "dark",
        fonts: { display: FRAUNCES, body: INTER },
        display: {
            weight: "550",
            tracking: "-0.015em",
            accentStyle: "italic",
            transform: "none",
            scale: "1.12",
        },
        shape: {
            radiusCard: "6px",
            // Wristband pills: CTAs and controls curve fully — celebratory
            // against the stationery flatness of the cards.
            radiusControl: "999px",
            borderWidth: "1px",
        },
        motion: { idiom: "kinetic", rise: "560ms" },
        treatment: ["grain", "glow", "tilt"],
        maxWidth: "1040px",
        modes: {
            dark: {
                palette: {
                    // True black: the night fully dark, so the ground never
                    // reads as a washed charcoal beside the photographs.
                    pageBg: "#000000",
                    surface: "#121212",
                    line: "#2e2e2e",
                    text: "#f4f4f4",
                    subtle: "#9a9a9a",
                    accent: "#f4f4f4",
                },
                shadowCard: "inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 18px 44px rgba(0, 0, 0, 0.55)",
                // Bulb glow, not tech glow: soft and close.
                shadowCta: (accent) => `0 0 30px color-mix(in srgb, ${accent} 42%, transparent)`,
                // String lights over the dance floor: faint white blooms at
                // the crown under grain — bare bulbs against a black night,
                // quiet enough that the ground stays black.
                backgroundPage: (accent) =>
                    `${GRAIN}, ` +
                    `radial-gradient(720px 380px at 18% -90px, color-mix(in srgb, ${accent} 10%, transparent), transparent 60%), ` +
                    "radial-gradient(640px 340px at 80% -70px, rgba(255, 255, 255, 0.05), transparent 58%)",
            },
            // The morning after on the same field: plain white ground, ink
            // type, the bulbs now daylight.
            light: {
                palette: {
                    pageBg: "#fafafa",
                    surface: "#ffffff",
                    line: "#e2e2e2",
                    text: "#1a1a1a",
                    subtle: "#767676",
                    accent: "#1a1a1a",
                },
                shadowCard: "0 2px 5px rgba(26, 26, 26, 0.07), 0 18px 44px rgba(26, 26, 26, 0.11)",
                shadowCta: (accent) => `0 8px 24px color-mix(in srgb, ${accent} 30%, transparent)`,
                backgroundPage: (accent) =>
                    `radial-gradient(720px 380px at 18% -90px, color-mix(in srgb, ${accent} 8%, transparent), transparent 60%), ` +
                    "radial-gradient(640px 340px at 80% -70px, rgba(26, 26, 26, 0.05), transparent 58%)",
            },
        },
    },
    // The trades register: the plan table, not the café counter. Warm
    // work paper ruled in a faint site-plan grid, deep ink type set as
    // stenciled uppercase signage (Space Grotesk at bold, tracked open),
    // and one safety-orange accent — the color of cones, vests, and
    // "call now". Grain reads as jobsite dust on the sheet; cards lift
    // like spec sheets clipped to a board. Still: the work is heavy, the
    // page doesn't perform. Where warm-boutique is sunlit hospitality
    // and brutalist is an art statement, sitework is licensed-and-
    // insured confidence — built for contractors, plumbers, electricians,
    // landscapers, and the rest of the trades.
    sitework: {
        nativeMode: "light",
        fonts: { display: SPACE_GROTESK, body: INTER },
        display: {
            weight: "700",
            tracking: "0.02em",
            accentStyle: "normal",
            transform: "uppercase",
            scale: "1.12",
        },
        shape: {
            // Squared like cut lumber, eased just past brutalism: signage,
            // not an art piece.
            radiusCard: "4px",
            radiusControl: "6px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "480ms" },
        treatment: ["grain"],
        maxWidth: "1120px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f6f4ef",
                    surface: "#ffffff",
                    line: "#ddd7c9",
                    text: "#181611",
                    subtle: "#645d4f",
                    accent: "#c2410c",
                },
                // A spec sheet lifted off the clipboard: crisp contact edge
                // plus a modest throw — sturdy, never floaty.
                shadowCard: "0 1px 3px rgba(24, 22, 17, 0.10), 0 14px 32px rgba(24, 22, 17, 0.12)",
                shadowCta: (accent) => `0 6px 18px color-mix(in srgb, ${accent} 32%, transparent)`,
                // The site plan made literal: a 44px plan grid at 3% ink
                // (larger cells than mono-utility's graph paper — a drawing
                // sheet, not an engineer's pad) under grain, with one
                // safety-orange bloom at the crown.
                backgroundPage: (accent) =>
                    `${GRAIN}, ` +
                    "repeating-linear-gradient(0deg, rgba(24, 22, 17, 0.03) 0 1px, transparent 1px 44px), " +
                    "repeating-linear-gradient(90deg, rgba(24, 22, 17, 0.03) 0 1px, transparent 1px 44px), " +
                    `radial-gradient(1000px 460px at 90% -120px, color-mix(in srgb, ${accent} 10%, transparent), transparent 58%)`,
            },
            // The night shift: floodlit yard — warm asphalt-ink ground,
            // bone type, the orange lifted to vest brightness, the same
            // plan grid ruled in faint bone.
            dark: {
                palette: {
                    pageBg: "#161511",
                    surface: "#1e1c17",
                    line: "#38352b",
                    text: "#f1efe9",
                    subtle: "#a29b8b",
                    accent: "#ff8a3d",
                },
                shadowCard: "inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 18px 40px rgba(0, 0, 0, 0.5)",
                shadowCta: (accent) => `0 6px 22px color-mix(in srgb, ${accent} 38%, transparent)`,
                backgroundPage: (accent) =>
                    `${GRAIN}, ` +
                    "repeating-linear-gradient(0deg, rgba(241, 239, 233, 0.03) 0 1px, transparent 1px 44px), " +
                    "repeating-linear-gradient(90deg, rgba(241, 239, 233, 0.03) 0 1px, transparent 1px 44px), " +
                    `radial-gradient(1000px 460px at 90% -120px, color-mix(in srgb, ${accent} 12%, transparent), transparent 58%)`,
            },
        },
    },
    // The residential register: the listing sheet from a good agency.
    // Limestone paper, deep navy ink set in a quiet serif (weight, not
    // shout — the display barely scales), and one brick accent the color
    // of the facades themselves. Grain reads as stone; cards sit like
    // mounted photographs with soft, believable shadows. Where sitework
    // is the trades' clipboard and heirloom is the wedding's stationery,
    // brownstone is the open-house folder on a good street — photography
    // does the persuading, the type just introduces it.
    brownstone: {
        nativeMode: "light",
        fonts: { display: SOURCE_SERIF, body: INTER },
        display: {
            weight: "600",
            tracking: "-0.01em",
            accentStyle: "italic",
            transform: "none",
            scale: "1.04",
        },
        shape: {
            // Eased like worn masonry edges: neither the trades' cut
            // lumber nor SaaS pill-roundness.
            radiusCard: "8px",
            radiusControl: "8px",
            borderWidth: "1px",
        },
        motion: { idiom: "drift", rise: "560ms" },
        treatment: ["grain"],
        maxWidth: "1120px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f7f3ec",
                    surface: "#fffdf8",
                    line: "#e0d8c8",
                    text: "#212d43",
                    subtle: "#5f6b80",
                    accent: "#9c4a2f",
                },
                // A mounted listing photograph: crisp contact edge and a
                // gentle throw — gallery weight, never floaty.
                shadowCard: "0 1px 2px rgba(33, 45, 67, 0.06), 0 16px 40px rgba(33, 45, 67, 0.10)",
                shadowCta: (accent) => `0 8px 22px color-mix(in srgb, ${accent} 30%, transparent)`,
                // Late light on a limestone street: one brick bloom at the
                // crown, one cool navy wash opposite, under stone grain.
                backgroundPage: (accent) =>
                    `${GRAIN}, ` +
                    `radial-gradient(920px 440px at 86% -110px, color-mix(in srgb, ${accent} 9%, transparent), transparent 58%), ` +
                    "radial-gradient(720px 380px at 6% -70px, rgba(33, 45, 67, 0.06), transparent 55%)",
            },
            // The same street after the lamps come on: night-navy ground,
            // ivory ink, the brick lifted to lamplit terracotta.
            dark: {
                palette: {
                    pageBg: "#151b28",
                    surface: "#1c2333",
                    line: "#303a4e",
                    text: "#ece7dc",
                    subtle: "#9aa3b5",
                    accent: "#d98a64",
                },
                shadowCard: "inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 18px 42px rgba(0, 0, 0, 0.5)",
                shadowCta: (accent) => `0 8px 24px color-mix(in srgb, ${accent} 36%, transparent)`,
                backgroundPage: (accent) =>
                    `${GRAIN}, ` +
                    `radial-gradient(920px 440px at 86% -110px, color-mix(in srgb, ${accent} 12%, transparent), transparent 58%), ` +
                    "radial-gradient(720px 380px at 6% -70px, rgba(236, 231, 220, 0.05), transparent 55%)",
            },
        },
    },
    // The stage-night register: the house lights down, the marquee lit.
    // True-black ground, plain white ink, and heavy Fraunces caps set like
    // playbill lettering — the seventies rock bill, not the wedding's
    // stationery. Strictly monochrome: the accent resolves to the ink
    // itself, so the photographs are the only color and the only warmth on
    // the page. Kinetic like tourbook (filmstrips travel), grain pushed
    // like Tri-X. Where lanternlight is the party under bulbs and tourbook
    // is the field journal, marquee is the show itself.
    marquee: {
        nativeMode: "dark",
        fonts: { display: FRAUNCES, body: INTER },
        display: {
            weight: "750",
            tracking: "0.03em",
            accentStyle: "italic",
            transform: "uppercase",
            scale: "1.2",
        },
        shape: {
            // Ticket-stub squared: prints and stubs have corners.
            radiusCard: "2px",
            radiusControl: "3px",
            borderWidth: "1px",
        },
        motion: { idiom: "kinetic", rise: "560ms" },
        treatment: ["grain", "glow"],
        maxWidth: "1180px",
        modes: {
            dark: {
                palette: {
                    // True black: the house fully dark so the photographs
                    // are the only light on the page.
                    pageBg: "#000000",
                    surface: "#121212",
                    line: "#2e2e2e",
                    // Plain white ink — no tungsten cream; the photographs
                    // carry every degree of warmth.
                    text: "#f5f5f5",
                    subtle: "#9e9e9e",
                    // Achromatic on purpose: the wash machinery collapses
                    // accentSoft to the black ground (no gray bands).
                    accent: "#f2f2f2",
                },
                shadowCard: "inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 18px 44px rgba(0, 0, 0, 0.6)",
                // White spill off the marquee bulbs: close, not tech glow.
                shadowCta: (accent) => `0 0 28px color-mix(in srgb, ${accent} 38%, transparent)`,
                // No haze, no beams: pure black between frames, grain only.
                backgroundPage: () => GRAIN,
            },
            // The tour program under daylight: plain white stock, the same
            // playbill caps in black ink — the morning-after read of the
            // same show, as strictly monochrome as the night.
            light: {
                palette: {
                    pageBg: "#fafafa",
                    surface: "#ffffff",
                    line: "#e0e0e0",
                    text: "#161616",
                    subtle: "#6e6e6e",
                    accent: "#161616",
                },
                shadowCard: "0 2px 5px rgba(0, 0, 0, 0.10), 0 16px 36px rgba(0, 0, 0, 0.12)",
                shadowCta: () => "none",
                backgroundPage: () =>
                    `${GRAIN}, ` +
                    "radial-gradient(940px 480px at 50% -140px, rgba(0, 0, 0, 0.05), transparent 62%)",
            },
        },
    },
    // The black-tie register: the evening itself — a candlelit ballroom,
    // not a tech product's dark mode. Warm near-black ground (candle smoke,
    // never blue), gold-foil accent the color of the invitation's engraving,
    // Fraunces display past the scale ceiling with the italic flourish, and
    // one slow spotlight beam swept through the dark under grain. Hairline
    // gold frames instead of elevation — engraved stationery, not glass.
    // Where lanternlight is the barn party under string lights and heirloom
    // is the invitation on morning paper, ballroom is 8 PM in the grand
    // room: built for galas, milestone evenings, and New Year's weddings.
    ballroom: {
        nativeMode: "dark",
        fonts: { display: FRAUNCES, body: INTER },
        display: {
            weight: "600",
            tracking: "-0.02em",
            accentStyle: "italic",
            transform: "none",
            scale: "1.2",
        },
        shape: {
            // Engraved card corners: sharp enough to read as print, a hair
            // off brutalism's statement zero.
            radiusCard: "2px",
            radiusControl: "2px",
            borderWidth: "1px",
        },
        motion: { idiom: "sweep", rise: "620ms" },
        treatment: ["grain", "glow", "hairline"],
        maxWidth: "1040px",
        modes: {
            dark: {
                palette: {
                    pageBg: "#0c0a07",
                    surface: "#151109",
                    line: "#352b18",
                    text: "#f6f1e4",
                    subtle: "#a3987f",
                    accent: "#d4a72c",
                    // Foil plates are lettered in the room's black, the
                    // way an engraved card is — white on gold washes out.
                    onAccent: "#0c0a07",
                },
                shadowCard: "none",
                // Candle glow, close and warm — never a neon bloom.
                shadowCta: (accent) => `0 0 32px color-mix(in srgb, ${accent} 36%, transparent)`,
                // The spotlight: one gold bloom at the crown and one slow
                // diagonal beam through the smoke, under grain — the static
                // trace of the sweep idiom.
                backgroundPage: (accent) =>
                    `${GRAIN}, ` +
                    `radial-gradient(900px 460px at 50% -140px, color-mix(in srgb, ${accent} 16%, transparent), transparent 60%), ` +
                    `linear-gradient(115deg, transparent 42%, color-mix(in srgb, ${accent} 7%, transparent) 50%, transparent 58%)`,
            },
            // The morning rehearsal: champagne paper, ink type, the gold
            // deepened to hold engraving contrast — the same room with the
            // curtains open.
            light: {
                palette: {
                    // White stock, not champagne: the engraved card is
                    // printed on bright white and the gold does the talking.
                    pageBg: "#ffffff",
                    surface: "#ffffff",
                    line: "#e6dcc2",
                    text: "#241d10",
                    subtle: "#77694b",
                    accent: "#9a7514",
                },
                shadowCard: "none",
                shadowCta: (accent) => `0 8px 22px color-mix(in srgb, ${accent} 28%, transparent)`,
                backgroundPage: () => "none",
            },
        },
    },
    // The backyard-party register: a reunion picnic in full afternoon —
    // sunny cream paper, one tomato-red accent the color of the gingham
    // cooler, marigold and sky washes, big rounded cards and full-pill
    // controls that read as name tags. Kinetic like tourbook but grinning
    // instead of expeditionary: photo clusters tilt like snapshots passed
    // around the table. Where warm-boutique is the café counter and
    // lanternlight is the night's glow, picnic is 2 PM on the lawn —
    // built for reunions, birthdays, and the parties between weddings.
    picnic: {
        nativeMode: "light",
        fonts: { display: MANROPE, body: INTER },
        display: {
            weight: "800",
            tracking: "-0.02em",
            accentStyle: "normal",
            transform: "none",
            scale: "1.08",
        },
        shape: {
            radiusCard: "20px",
            // Name-tag pills: every control curves fully.
            radiusControl: "999px",
            borderWidth: "1px",
        },
        motion: { idiom: "kinetic", rise: "520ms" },
        treatment: ["tilt", "glow"],
        maxWidth: "1080px",
        modes: {
            light: {
                palette: {
                    pageBg: "#fdf7ec",
                    surface: "#ffffff",
                    line: "#f0dfc2",
                    text: "#3a2a1c",
                    subtle: "#8a7458",
                    accent: "#e0472e",
                },
                // A snapshot lifted off the picnic table: crisp contact
                // edge plus a friendly throw.
                shadowCard: "0 2px 5px rgba(90, 55, 20, 0.08), 0 20px 44px rgba(90, 55, 20, 0.13)",
                shadowCta: (accent) => `0 8px 24px color-mix(in srgb, ${accent} 32%, transparent)`,
                // Full afternoon: a marigold bloom overhead and a sky-blue
                // shoulder — the lawn, not a screen gradient.
                backgroundPage: (accent) =>
                    `radial-gradient(1000px 480px at 18% -120px, rgba(240, 173, 46, 0.20), transparent 58%), ` +
                    `radial-gradient(880px 440px at 94% -60px, rgba(94, 170, 220, 0.14), transparent 55%), ` +
                    `radial-gradient(760px 400px at 55% 115%, color-mix(in srgb, ${accent} 7%, transparent), transparent 60%)`,
            },
            // The bonfire after dark: toasted-brown ground, cream type, the
            // tomato lifted to ember orange, the marigold now firelight.
            dark: {
                palette: {
                    pageBg: "#1c130c",
                    surface: "#271a11",
                    line: "#46331f",
                    text: "#f7ede0",
                    subtle: "#b39c82",
                    accent: "#ff8c66",
                },
                shadowCard: "inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 20px 44px rgba(0, 0, 0, 0.5)",
                shadowCta: (accent) => `0 8px 26px color-mix(in srgb, ${accent} 38%, transparent)`,
                backgroundPage: (accent) =>
                    `${GRAIN}, ` +
                    `radial-gradient(1000px 480px at 18% -120px, rgba(240, 173, 46, 0.12), transparent 58%), ` +
                    `radial-gradient(760px 400px at 55% 115%, color-mix(in srgb, ${accent} 10%, transparent), transparent 60%)`,
            },
        },
    },
    // The training-floor register: black rubber and gym chalk, nothing
    // else. Near-black neutral ground, chalk-bone ink, Space Grotesk set
    // as stenciled uppercase signage tracked open — the whiteboard wall,
    // not a fitness app. Strictly monochrome: the accent resolves to the
    // chalk itself, so CTAs are hard chalk plates and the photography
    // (high-contrast black and white) is the only tonal drama. Grain reads
    // as chalk dust; hairlines rule the schedule wall; still motion — the
    // work is heavy, the page doesn't perform. Where monolith is the
    // monumental tech statement, chalk is a room you train in.
    chalk: {
        nativeMode: "dark",
        fonts: { display: SPACE_GROTESK, body: INTER },
        display: {
            weight: "700",
            tracking: "0.05em",
            accentStyle: "normal",
            transform: "uppercase",
            scale: "1.16",
        },
        shape: {
            // Squared like a bumper plate's edge; radius would read as app
            // chrome, not signage.
            radiusCard: "2px",
            radiusControl: "2px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "520ms" },
        treatment: ["grain", "hairline"],
        maxWidth: "1140px",
        modes: {
            dark: {
                palette: {
                    pageBg: "#111110",
                    surface: "#181817",
                    line: "#2e2e2c",
                    text: "#f0eee7",
                    subtle: "#8f8d85",
                    accent: "#f0eee7",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                // Chalk dust under one worklight: grain over near-black
                // with the faintest bone bloom at the crown — monochrome
                // light, never a color wash.
                backgroundPage: () =>
                    `${GRAIN}, ` +
                    "radial-gradient(940px 440px at 50% -160px, rgba(240, 238, 231, 0.05), transparent 60%)",
            },
            // The morning session: the whiteboard wall in daylight — warm
            // paper ground, ink signage, the same rules and restraint.
            light: {
                palette: {
                    pageBg: "#f4f2ec",
                    surface: "#fbfaf6",
                    line: "#d9d6cc",
                    text: "#181815",
                    subtle: "#6d6b62",
                    accent: "#181815",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () =>
                    `${GRAIN}, ` +
                    "radial-gradient(940px 440px at 50% -160px, rgba(24, 24, 21, 0.04), transparent 60%)",
            },
        },
    },
    // The midnight-service register: the sanctuary with the house lights
    // down — a church that gathers like a venue, not a parish office.
    // Warm near-black ground under grain, bone ink set as monumental
    // uppercase signage (Space Grotesk past the scale ceiling), hairline
    // rules instead of elevation, and one candle-amber accent — the color
    // of stage wash and votive flame — that lives in CTAs and one slow
    // diagonal beam through the dark, like light through the west window.
    // Reverence through boldness: the computed badge, the setlist of
    // service times, and the open table stay; the bone paper doesn't.
    // Built for churches and congregations reaching a young city —
    // deliberately apart from ballroom's gala gold (engraved stationery)
    // and marquee's playbill (the photographs there are the show; here
    // the type preaches).
    hymnal: {
        nativeMode: "dark",
        fonts: { display: SPACE_GROTESK, body: INTER },
        display: {
            weight: "700",
            tracking: "0.02em",
            accentStyle: "normal",
            transform: "uppercase",
            // Past the monumental ceiling: the headline is the marquee.
            scale: "1.3",
        },
        shape: {
            // Squared like cut stone — signage, not UI chrome.
            radiusCard: "2px",
            radiusControl: "2px",
            borderWidth: "1px",
        },
        motion: { idiom: "sweep", rise: "560ms" },
        treatment: ["grain", "glow", "hairline"],
        // A wide room: monumental type needs the nave, not the pamphlet
        // column the old order-of-service reading kept.
        maxWidth: "1140px",
        modes: {
            dark: {
                palette: {
                    pageBg: "#0e0c09",
                    surface: "#171411",
                    line: "#332d24",
                    text: "#f4efe4",
                    subtle: "#a3988a",
                    accent: "#ff9e2c",
                },
                shadowCard: "none",
                // Candle spill, close and warm — never a neon bloom.
                shadowCta: (accent) => `0 0 30px color-mix(in srgb, ${accent} 34%, transparent)`,
                // One amber crown over the crowd and the beam through the
                // dark under grain — the static trace of the sweep idiom.
                backgroundPage: (accent) =>
                    `${GRAIN}, ` +
                    `radial-gradient(1000px 480px at 50% -160px, color-mix(in srgb, ${accent} 13%, transparent), transparent 60%), ` +
                    `linear-gradient(115deg, transparent 42%, color-mix(in srgb, ${accent} 6%, transparent) 50%, transparent 58%)`,
            },
            // The same room with the doors open at noon: warm white walls,
            // ink signage, the amber deepened to hold on daylight — an
            // inversion of the night service, not a retreat to bone paper.
            light: {
                palette: {
                    pageBg: "#faf7f1",
                    surface: "#ffffff",
                    line: "#e2dbcb",
                    text: "#181510",
                    subtle: "#6e6553",
                    accent: "#a16207",
                },
                shadowCard: "none",
                shadowCta: (accent) => `0 8px 24px color-mix(in srgb, ${accent} 26%, transparent)`,
                backgroundPage: (accent) =>
                    `${GRAIN}, ` +
                    `radial-gradient(1000px 480px at 50% -160px, color-mix(in srgb, ${accent} 7%, transparent), transparent 60%)`,
            },
        },
    },
    // The gig-poster register: the sheet stapled to the venue door, printed
    // loud. Aged poster paper under a halftone dot screen (the print
    // texture made literal), ink hairline rules, and display caps pushed
    // past the monumental ceiling — the type IS the layout, the way a
    // broadside names the band bigger than the photograph. One oxblood
    // accent, the color of a two-ink print run — never a candy hue. Still:
    // posters don't perform; the scale does. Where tourbook is the
    // photographer's field journal running beside the pictures and marquee
    // (the stage-night register) is the show itself, broadside is the
    // PRINTED ARTIFACT — type-forward where those are photo-forward, built
    // for bands, venues, tours, and record releases.
    broadside: {
        nativeMode: "light",
        fonts: { display: SPACE_GROTESK, body: INTER },
        display: {
            weight: "800",
            tracking: "0.01em",
            accentStyle: "normal",
            transform: "uppercase",
            scale: "1.35",
        },
        shape: {
            // Print has corners; a radius would read as UI, not paper.
            radiusCard: "0px",
            radiusControl: "0px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "480ms" },
        treatment: ["grain", "outline", "hairline"],
        maxWidth: "1200px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f4efe4",
                    surface: "#fbf8f0",
                    line: "#c9c2b0",
                    text: "#1a1712",
                    subtle: "#6d665a",
                    accent: "#a63a2c",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                // The halftone screen: a 6px dot matrix at 3.5% ink over
                // grain — the page reads as a print run, not a gradient —
                // with the faintest warm crown where the masthead sits.
                backgroundPage: (accent) =>
                    `${GRAIN}, ` +
                    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='6'%3E%3Ccircle cx='1.5' cy='1.5' r='0.85' fill='%231a1712' opacity='0.035'/%3E%3C/svg%3E"), ` +
                    `radial-gradient(140% 42% at 50% 0%, color-mix(in srgb, ${accent} 6%, transparent), transparent 70%)`,
            },
            // The night bill: the same sheet printed in negative — ink
            // ground, bone type, the oxblood lifted to hold against the
            // dark paper, the dot screen ruled in faint bone.
            dark: {
                palette: {
                    pageBg: "#16130e",
                    surface: "#1e1a14",
                    line: "#3d372c",
                    text: "#f0e9da",
                    subtle: "#a29885",
                    accent: "#d05a41",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: (accent) =>
                    `${GRAIN}, ` +
                    `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='6'%3E%3Ccircle cx='1.5' cy='1.5' r='0.85' fill='%23f0e9da' opacity='0.03'/%3E%3C/svg%3E"), ` +
                    `radial-gradient(140% 42% at 50% 0%, color-mix(in srgb, ${accent} 9%, transparent), transparent 70%)`,
            },
        },
    },
    // The phosphor terminal: the CRT itself, not a spec sheet. Pure-black
    // ground, mono type throughout, hairline rules, and the scanline
    // treatment (the raster made literal) under an accent glow. Accent-
    // agnostic on purpose: the brand overlay supplies the phosphor's color
    // — mint green for one machine, amber for another — so ONE register
    // carries every tube. Dark-native; the light variant is the morning
    // printout, the same session tractor-fed onto fanfold paper.
    // (Heritage lineage: the platform's "terminal" and "the-terminal"
    // dashboard skins — see repobot's theme/tokens.ts heritage catalog.)
    crt: {
        nativeMode: "dark",
        fonts: { display: PLEX_MONO, body: PLEX_MONO },
        display: { weight: "600", tracking: "0em", accentStyle: "normal", transform: "none", scale: "1" },
        shape: {
            radiusCard: "2px",
            radiusControl: "2px",
            borderWidth: "1px",
        },
        // Terminals repaint, they don't animate: still idiom, no rise.
        motion: { idiom: "still", rise: "0ms" },
        treatment: ["scanline", "glow"],
        maxWidth: "960px",
        modes: {
            dark: {
                palette: {
                    // True black, like the reference tube. Surfaces stay a
                    // hair off pure black — on a terminal, panels are
                    // borders on the screen, not lifted cards.
                    pageBg: "#000000",
                    surface: "#0a0a0a",
                    line: "#262626",
                    text: "#e8e8e2",
                    subtle: "#8f948c",
                    accent: "#a2d49a",
                },
                shadowCard: "none",
                // Phosphor bloom, close to the glass.
                shadowCta: (accent) => `0 0 28px color-mix(in srgb, ${accent} 42%, transparent)`,
                // The tube's own light: an accent haze at the crown and a
                // faint full-screen phosphor cast — the scanline overlay
                // (treatment CSS) rules the raster over it.
                backgroundPage: (accent) =>
                    `radial-gradient(1100px 640px at 50% -180px, color-mix(in srgb, ${accent} 10%, transparent), transparent 62%), ` +
                    `radial-gradient(140% 90% at 50% 40%, color-mix(in srgb, ${accent} 4%, transparent), transparent 75%)`,
            },
            // The paper printout: the same session on fanfold stock —
            // tractor-feed ruling instead of raster rows, the phosphor
            // deepened to ribbon-ink green.
            light: {
                palette: {
                    pageBg: "#f6f5ee",
                    surface: "#fdfcf6",
                    line: "#d8d6c8",
                    text: "#1d1f1c",
                    subtle: "#67695f",
                    accent: "#186b3a",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: (accent) =>
                    "repeating-linear-gradient(0deg, rgba(29, 31, 28, 0.03) 0 1px, transparent 1px 26px), " +
                    `radial-gradient(140% 44% at 50% 0%, color-mix(in srgb, ${accent} 5%, transparent), transparent 70%)`,
            },
        },
    },
    // The handheld LCD, the way the unlit glass actually read: a LIGHT
    // pea-green ground with olive ink — four desaturated greens, never
    // neon. Mono type set as chunky uppercase, hard zero radius,
    // double-weight rules, and the pixel treatment's dithered checker
    // wash. Light-native on purpose — the dark-only translation was the
    // identity loss this register exists to repair. The dark variant is
    // the backlit mod: the same four shades inverted, ink glass and pale
    // pixels.
    handheld: {
        nativeMode: "light",
        fonts: { display: PLEX_MONO, body: PLEX_MONO },
        display: {
            weight: "700",
            tracking: "0.02em",
            accentStyle: "normal",
            transform: "uppercase",
            scale: "1",
        },
        shape: {
            radiusCard: "0px",
            radiusControl: "0px",
            // Chunky like the shell's molding: the pixel read needs rules
            // you can count.
            borderWidth: "2px",
        },
        // The hardware had no tweens: still idiom, no rise.
        motion: { idiom: "still", rise: "0ms" },
        treatment: ["pixel"],
        maxWidth: "1000px",
        modes: {
            light: {
                palette: {
                    pageBg: "#c4cfa1",
                    surface: "#b4bf90",
                    line: "#5c6847",
                    text: "#333b27",
                    subtle: "#5c6847",
                    accent: "#4a5238",
                },
                // The screen was flat glass: no elevation anywhere; ink
                // plates read as pressed buttons on their own.
                shadowCard: "none",
                shadowCta: () => "none",
                // The LCD's own pixel lattice at whisper opacity — the
                // dither wash rides in the pixel treatment overlay.
                backgroundPage: () =>
                    "repeating-linear-gradient(0deg, rgba(51, 59, 39, 0.05) 0 1px, transparent 1px 3px), " +
                    "repeating-linear-gradient(90deg, rgba(51, 59, 39, 0.05) 0 1px, transparent 1px 3px)",
            },
            // The backlit mod: ink glass, the pea-green now the light
            // itself — pale pixels glowing out of dark olive.
            dark: {
                palette: {
                    pageBg: "#1e2418",
                    surface: "#28301f",
                    line: "#49543a",
                    text: "#c4cfa1",
                    subtle: "#8d9a70",
                    accent: "#c4cfa1",
                },
                shadowCard: "none",
                shadowCta: (accent) => `0 0 22px color-mix(in srgb, ${accent} 30%, transparent)`,
                backgroundPage: () =>
                    "repeating-linear-gradient(0deg, rgba(196, 207, 161, 0.04) 0 1px, transparent 1px 3px), " +
                    "repeating-linear-gradient(90deg, rgba(196, 207, 161, 0.04) 0 1px, transparent 1px 3px)",
            },
        },
    },
    // The night lounge: near-black NEUTRAL ground (#121212 — not dark-dev's
    // navy ink), flat charcoal panels, pill-round cards and controls, and
    // one saturated accent that blooms — the glow is the only light in the
    // room. Dark-native; the light variant is the daytime session, the
    // same lounge with the house lights up. (The Jade Look's Spotify
    // lineage, restored from the dark-dev aurora it was flattened onto.)
    lounge: {
        nativeMode: "dark",
        fonts: { display: MANROPE, body: INTER },
        display: {
            weight: "800",
            tracking: "-0.03em",
            accentStyle: "normal",
            transform: "none",
            scale: "1",
        },
        shape: {
            radiusCard: "24px",
            radiusControl: "999px",
            borderWidth: "1px",
        },
        motion: { idiom: "drift", rise: "480ms" },
        treatment: ["glow"],
        maxWidth: "1080px",
        modes: {
            dark: {
                palette: {
                    pageBg: "#121212",
                    surface: "#1d1d1d",
                    line: "#2e2e2e",
                    text: "#ffffff",
                    subtle: "#a7a7a7",
                    accent: "#1db954",
                    // The lounge letters its green pills in the room's
                    // black — its lineage's button, and the one that reads.
                    onAccent: "#121212",
                },
                // Flat panels over a deep throw — the lounge's cards sit in
                // the dark, they don't turn to glass.
                shadowCard: "0 12px 32px rgba(0, 0, 0, 0.45)",
                shadowCta: (accent) => `0 0 34px color-mix(in srgb, ${accent} 36%, transparent)`,
                // One accent bloom at the crown and the faintest white
                // spill opposite: stage light on a neutral black room,
                // never an aurora.
                backgroundPage: (accent) =>
                    `radial-gradient(1000px 520px at 16% -140px, color-mix(in srgb, ${accent} 16%, transparent), transparent 60%), ` +
                    "radial-gradient(900px 480px at 92% 110%, rgba(255, 255, 255, 0.03), transparent 55%)",
            },
            // Daytime session: warm-neutral paper, the green deepened to
            // hold ink-grade contrast (white pills at 4.5:1, green type on
            // the paper past 4:1), the same bloom at print strength.
            light: {
                palette: {
                    pageBg: "#f6f6f4",
                    surface: "#ffffff",
                    line: "#e2e2de",
                    text: "#121212",
                    subtle: "#6b6b66",
                    accent: "#13863c",
                },
                shadowCard: "0 1px 3px rgba(18, 18, 18, 0.06), 0 16px 40px rgba(18, 18, 18, 0.10)",
                shadowCta: (accent) => `0 8px 24px color-mix(in srgb, ${accent} 30%, transparent)`,
                backgroundPage: (accent) =>
                    `radial-gradient(1000px 520px at 16% -140px, color-mix(in srgb, ${accent} 9%, transparent), transparent 60%)`,
            },
        },
    },
    // The silver machine: bevel-chrome retroware. Desktop silver ground,
    // window-chrome surfaces, hard edges, zero radius, and the bevel
    // carried in inset outset-shadows instead of elevation. The key trick:
    // the page ground IS the desktop — backgroundPage derives from the
    // accent (the dark-dev pattern), so ONE register yields the teal
    // desktop, navy web chrome, green card felt, or toy-red plastic as
    // accent-driven washes; the Looks supply the accent. Light-native;
    // dark is the high-contrast scheme, the same chrome with the lights
    // off.
    retroware: {
        nativeMode: "light",
        fonts: { display: CHROME_SANS, body: CHROME_SANS },
        display: {
            weight: "700",
            tracking: "0em",
            accentStyle: "normal",
            transform: "none",
            scale: "1",
        },
        shape: {
            radiusCard: "0px",
            radiusControl: "0px",
            borderWidth: "1px",
        },
        // Windows didn't tween: still idiom, no rise.
        motion: { idiom: "still", rise: "0ms" },
        treatment: [],
        maxWidth: "1040px",
        modes: {
            light: {
                palette: {
                    pageBg: "#c0c0c0",
                    surface: "#d4d0c8",
                    line: "#808080",
                    text: "#000000",
                    subtle: "#3d3d3d",
                    accent: "#000080",
                },
                // The period bevel: light from the top-left, shade to the
                // bottom-right, one hard drop — panels sit proud like
                // dialogs, never float.
                shadowCard:
                    "inset -1px -1px 0 #808080, inset 1px 1px 0 #ffffff, 2px 2px 0 rgba(0, 0, 0, 0.25)",
                shadowCta: (accent) =>
                    `inset -1px -1px 0 color-mix(in srgb, #000000 40%, ${accent}), ` +
                    `inset 1px 1px 0 color-mix(in srgb, #ffffff 45%, ${accent}), ` +
                    "2px 2px 0 rgba(0, 0, 0, 0.3)",
                // The desktop wash: strong accent behind the hero, fading
                // toward working silver — teal for one Look, navy for
                // another, felt green or toy red for the rest.
                backgroundPage: (accent) =>
                    `linear-gradient(180deg, color-mix(in srgb, ${accent} 46%, #c0c0c0) 0px, ` +
                    `color-mix(in srgb, ${accent} 30%, #c0c0c0) 420px, ` +
                    `color-mix(in srgb, ${accent} 10%, #c0c0c0) 100%)`,
            },
            // The high-contrast scheme: charcoal chrome, bone type, the
            // same bevel grammar cut in black and half-light.
            dark: {
                palette: {
                    pageBg: "#1f1f1f",
                    surface: "#2b2b28",
                    line: "#565650",
                    text: "#f0f0ea",
                    subtle: "#a6a6a0",
                    accent: "#6f9edb",
                },
                shadowCard:
                    "inset -1px -1px 0 #000000, inset 1px 1px 0 #4c4c46, 2px 2px 0 rgba(0, 0, 0, 0.5)",
                shadowCta: (accent) =>
                    `inset -1px -1px 0 color-mix(in srgb, #000000 45%, ${accent}), ` +
                    `inset 1px 1px 0 color-mix(in srgb, #ffffff 30%, ${accent}), ` +
                    "2px 2px 0 rgba(0, 0, 0, 0.55)",
                backgroundPage: (accent) =>
                    `linear-gradient(180deg, color-mix(in srgb, ${accent} 30%, #1f1f1f) 0px, ` +
                    `color-mix(in srgb, ${accent} 16%, #1f1f1f) 420px, ` +
                    `color-mix(in srgb, ${accent} 6%, #1f1f1f) 100%)`,
            },
        },
    },
    // The coastal timber house: a builder's register for the wet edge of
    // the continent. Fog-slate ground (sea weather, never navy tech-dark),
    // bone ink, and the display set in Fraunces at a thin weight and a
    // monumental scale — the headline reads like a film title over the
    // photograph, not signage. One lamplight-amber accent: the window glow
    // in a dusk photograph of the finished house, so it lives only in the
    // asks. Sea-mist grain on the ground, full-bleed photographs dissolving
    // into it at their edges (the `mist` treatment), hairlines instead of
    // elevation, squared corners like milled stock. Still: craft doesn't
    // perform, it waits. Where sitework is the plan table (licensed-and-
    // insured signage), tideline is the finished house at dusk — built for
    // custom builders, timber framers, woodshops, restoration carpenters,
    // and the other trades that sell by the photograph.
    tideline: {
        nativeMode: "dark",
        fonts: { display: FRAUNCES, body: INTER },
        display: {
            weight: "300",
            tracking: "-0.022em",
            accentStyle: "italic",
            transform: "none",
            // Past the monumental ceiling: thin strokes need size to carry.
            scale: "1.6",
        },
        shape: {
            // Milled stock has corners; a radius would read as UI.
            radiusCard: "0px",
            radiusControl: "1px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "760ms" },
        treatment: ["grain", "hairline", "mist"],
        // A wide room: the photographs want the whole window.
        maxWidth: "1240px",
        modes: {
            dark: {
                palette: {
                    pageBg: "#161c1f",
                    surface: "#1d2428",
                    line: "#2f383d",
                    text: "#ece6da",
                    subtle: "#9aa3a6",
                    accent: "#e0a255",
                    // Slate lettering on the lamplight, like a cut sign.
                    onAccent: "#161c1f",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                // Sea mist over slate: two cool fog banks at the crown and
                // the shoulder, the faintest lamplight low on the page, all
                // under grain — weather on the ground, never a gradient.
                backgroundPage: (accent) =>
                    `${GRAIN}, ` +
                    "radial-gradient(1400px 620px at 18% -120px, rgba(154, 163, 166, 0.09), transparent 62%), " +
                    "radial-gradient(1100px 700px at 96% 38%, rgba(154, 163, 166, 0.05), transparent 60%), " +
                    `radial-gradient(1000px 560px at 70% 108%, color-mix(in srgb, ${accent} 6%, transparent), transparent 62%)`,
            },
            // The same house on a bright fog morning: sea-mist paper, slate
            // ink, the amber deepened to hold on daylight.
            light: {
                palette: {
                    pageBg: "#eef0ee",
                    surface: "#f7f8f6",
                    line: "#d4d9d7",
                    text: "#1b2225",
                    subtle: "#5b6569",
                    accent: "#9a5f17",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: (accent) =>
                    `${GRAIN}, ` +
                    "radial-gradient(1400px 620px at 18% -120px, rgba(27, 34, 37, 0.05), transparent 62%), " +
                    `radial-gradient(1000px 560px at 70% 108%, color-mix(in srgb, ${accent} 5%, transparent), transparent 62%)`,
            },
        },
    },
    // 90s Miami pop: the Memphis Group by way of a South Beach sticker
    // sheet. Bright white ground, black ink, and three print inks — the
    // accent (hot pink by default; the brand overlay wins) plus aqua and
    // lemon as spot colors. Chunky Rubik Black set italic and uppercase,
    // cards and CTAs cut in ink with HARD offset shadows (no blur — print,
    // not a screen), kickers as ink tape, the hero badge a starburst.
    // The discipline is the point: ornaments are a sparse, deterministic
    // gutter tile (the confetti treatment), never a clip-art wallpaper
    // behind copy, and the body stays a legible Manrope. Kinetic idiom:
    // the starburst turns slowly (reduced motion holds it still).
    // Light-native; dark is the after-hours club flyer — near-black
    // ground, bone ink outlines, the shadows printed in aqua.
    memphis: {
        nativeMode: "light",
        fonts: { display: RUBIK_ITALIC, body: MANROPE },
        display: {
            weight: "900",
            tracking: "-0.01em",
            accentStyle: "italic",
            transform: "uppercase",
            scale: "1.12",
        },
        shape: {
            radiusCard: "14px",
            radiusControl: "10px",
            // Ink outlines you can see from across the street.
            borderWidth: "2px",
        },
        motion: { idiom: "kinetic", rise: "420ms" },
        treatment: ["pop", "confetti"],
        maxWidth: "1180px",
        modes: {
            light: {
                palette: {
                    pageBg: "#ffffff",
                    surface: "#ffffff",
                    line: "#141414",
                    text: "#141414",
                    subtle: "#45434d",
                    accent: "#ff2d87",
                },
                spot: ["#19c7ca", "#ffd92e"],
                // Print, not glass: a hard ink offset, zero blur.
                shadowCard: "6px 6px 0 #141414",
                shadowCta: () => "4px 4px 0 #141414",
                // Paper-white: the color lives in the inks and the
                // ornament tile, not a wash.
                backgroundPage: () => "none",
                ornament: memphisOrnament("#141414", "#ff2d87", "#19c7ca", "#ffd92e"),
            },
            dark: {
                palette: {
                    pageBg: "#141218",
                    surface: "#1d1a23",
                    line: "#f4f1ea",
                    text: "#f7f5f0",
                    subtle: "#c9c4d4",
                    accent: "#ff5fa8",
                },
                spot: ["#3fe1e4", "#ffe45e"],
                shadowCard: "6px 6px 0 #3fe1e4",
                shadowCta: () => "4px 4px 0 #3fe1e4",
                backgroundPage: () => "none",
                ornament: memphisOrnament("#f4f1ea", "#ff5fa8", "#3fe1e4", "#ffe45e"),
            },
        },
    },
    // Los Angeles sign-painter vernacular: the hand-lettered storefront,
    // the painted van door, the taco-truck menu board. Warm cream board
    // ground, deep jacaranda-purple ink, a sign-red accent for the things
    // you press, and a sunset orange as the drop shade under painted
    // letters (spot 1) with a brighter jacaranda purple as the second ink
    // (spot 2). Luckiest Guy show-card caps for display, Kaushan brush
    // script for the flourish word, Barlow's storefront grotesk for the
    // body. The `signpaint` treatment does the hand: outlined, shaded
    // display letters, script kickers between brush dashes, CTAs cut like
    // painted boards, photographs torn at the foot. Built for the trades
    // that live on a van door — plumbers, electricians, movers, taquerias,
    // detailers — over bright documentary photography. Still idiom: paint
    // doesn't move. Dark is the same board under a neon night.
    jacaranda: {
        nativeMode: "light",
        fonts: { display: LUCKIEST_GUY, body: BARLOW, script: KAUSHAN_SCRIPT },
        display: {
            // Luckiest Guy ships one heavy cut; asking for more smears it.
            weight: "400",
            tracking: "0.02em",
            accentStyle: "normal",
            transform: "uppercase",
            scale: "1.22",
        },
        shape: {
            // A board's eased corners, not a sticker's pill.
            radiusCard: "10px",
            radiusControl: "10px",
            // The sign-writer's outline, readable from across the street.
            borderWidth: "3px",
        },
        motion: { idiom: "still", rise: "420ms" },
        treatment: ["signpaint", "grain"],
        maxWidth: "1160px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f6ecd4",
                    surface: "#fff8e7",
                    line: "#2d1757",
                    text: "#2d1757",
                    subtle: "#62507f",
                    accent: "#d2341c",
                },
                spot: ["#f08a1c", "#6c3fc4"],
                // Painted, not lit: a hard purple shade under every board.
                shadowCard: "5px 6px 0 #2d1757",
                shadowCta: () => "3px 4px 0 #2d1757",
                // Enamel on a cream board: brush streaks in the ink, grain
                // over them, a little afternoon warmth at the crown.
                backgroundPage: () =>
                    `${GRAIN}, ${paintTexture("#8a5a1c", 0.08)}, ` +
                    "radial-gradient(1100px 520px at 88% -140px, rgba(255, 196, 92, 0.26), transparent 64%)",
            },
            // The same board after dark: a jacaranda-night ground, the
            // letters in cream, the red and orange lifted to neon.
            dark: {
                palette: {
                    pageBg: "#1c1030",
                    surface: "#281840",
                    line: "#f6ecd4",
                    text: "#fbf1dc",
                    subtle: "#c7b5e0",
                    accent: "#ff5a3a",
                },
                spot: ["#ffa23d", "#b48cff"],
                shadowCard: "5px 6px 0 rgba(0, 0, 0, 0.6)",
                shadowCta: () => "3px 4px 0 rgba(0, 0, 0, 0.6)",
                backgroundPage: () =>
                    `${GRAIN}, ${paintTexture("#000000", 0.18)}, ` +
                    "radial-gradient(900px 480px at 86% -140px, rgba(180, 140, 255, 0.18), transparent 62%)",
            },
        },
    },
    // The city tabloid: the front page off the late truck. Newsprint
    // off-white (cooler and greyer than broadside's aged poster bone),
    // crisp black ink, heavy condensed headline caps (Anton) over a serif
    // body set like column type, black column rules, and ONE fire-engine
    // red — the masthead bar's ink, never a wash. Photographs print
    // through a halftone screen (the `halftone` treatment). Where
    // broadside is the gig poster (one sheet, type as monument, oxblood,
    // outline caps) the tabloid is the DAILY: many stories at once, column
    // grids, bylines, datelines — built for anything that makes news
    // nightly: wedding and event photographers, bars, venues, restaurants,
    // bands with a lot going on. Presses don't tween: still idiom.
    tabloid: {
        nativeMode: "light",
        fonts: { display: ANTON, body: SOURCE_SERIF },
        display: {
            // Anton ships one (heavy) weight; asking for more would make
            // the browser smear a faux bold over it.
            weight: "400",
            tracking: "0.004em",
            accentStyle: "normal",
            transform: "uppercase",
            scale: "1.3",
        },
        shape: {
            radiusCard: "0px",
            radiusControl: "0px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "320ms" },
        treatment: ["hairline", "halftone"],
        // A broadsheet-wide page: the column grid needs the room.
        maxWidth: "1240px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f1eee6",
                    surface: "#f8f6f0",
                    line: "#2b2926",
                    text: "#111110",
                    subtle: "#57534b",
                    accent: "#d0161e",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                // Newsprint tooth: grain over a faint sheet falloff — no
                // dot screen on the ground (the screen belongs to the
                // photographs) and no accent wash (red is ink, not light).
                backgroundPage: () =>
                    `${GRAIN}, ` +
                    `radial-gradient(130% 90% at 50% 20%, transparent 55%, rgba(92, 78, 52, 0.07))`,
            },
            // The night final: the same page printed in negative — press
            // black ground, newsprint type, the red lifted to hold on it.
            dark: {
                palette: {
                    pageBg: "#121110",
                    surface: "#1b1a18",
                    line: "#5a564f",
                    text: "#f3f0e8",
                    subtle: "#aaa59a",
                    accent: "#f0333a",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => `${GRAIN}`,
            },
        },
    },
    // Game day: the sportswear campaign shot on a ballpark outfield. The
    // page ground IS the mowed grass — deep turf green cut in wide diagonal
    // mowing bands (alternating light and dark, the way a striped lawn
    // reads from the stands) under a night-game falloff at the edges. Crisp
    // white condensed block caps (Barlow Condensed 800, uppercase) that
    // lean italic on the accent word; ONE electric volt accent for the
    // things you press and the numbers you pay (kickers as volt tape, CTAs
    // as slanted plates). Square-cut shapes like jersey patches, no soft
    // cards. The `sport` treatment carries the campaign moves. Where
    // memphis is the party flyer and jacaranda the van-door sign, gameday
    // is the drop campaign: crews who sell a standard and a season — lawn
    // care, pool service, detailing, pressure washing, youth sports.
    gameday: {
        nativeMode: "dark",
        fonts: { display: BARLOW_CONDENSED, body: INTER },
        display: {
            weight: "800",
            tracking: "0.004em",
            accentStyle: "italic",
            transform: "uppercase",
            // Condensed caps need size to hit like a campaign.
            scale: "1.42",
        },
        shape: {
            radiusCard: "4px",
            radiusControl: "2px",
            borderWidth: "2px",
        },
        motion: { idiom: "kinetic", rise: "380ms" },
        treatment: ["sport"],
        maxWidth: "1200px",
        modes: {
            dark: {
                palette: {
                    pageBg: "#15492a",
                    surface: "#0e3a1f",
                    line: "#2f7045",
                    text: "#ffffff",
                    subtle: "#cfe5d3",
                    accent: "#dcff1f",
                },
                // Chalk white and jersey black: the ticket stock and the ink.
                spot: ["#f6f8f1", "#0b140e"],
                shadowCard: "0 22px 44px rgba(3, 20, 9, 0.38)",
                shadowCta: (accent) => `0 10px 26px color-mix(in srgb, ${accent} 32%, transparent)`,
                // The outfield: wide diagonal mowing bands (light, dark)
                // over the turf, dimmed toward the edges like stadium light
                // falling off the grass.
                backgroundPage: () =>
                    "radial-gradient(140% 90% at 50% 0%, transparent 52%, rgba(3, 20, 9, 0.34) 100%), " +
                    "repeating-linear-gradient(150deg, rgba(255, 255, 255, 0.045) 0 132px, rgba(3, 20, 9, 0.07) 132px 264px)",
            },
            // The day game: the same field in bright sun — chalk-line white
            // ground with the faintest mowing bands, turf-green ink, the
            // volt deepened to a grass green that holds on white.
            light: {
                palette: {
                    pageBg: "#f3f6ef",
                    surface: "#ffffff",
                    line: "#c9d8c8",
                    text: "#0b1f12",
                    subtle: "#4b5f50",
                    accent: "#1f8a3a",
                },
                spot: ["#15492a", "#0b140e"],
                shadowCard: "0 18px 38px rgba(11, 31, 18, 0.12)",
                shadowCta: (accent) => `0 10px 24px color-mix(in srgb, ${accent} 26%, transparent)`,
                backgroundPage: () =>
                    "repeating-linear-gradient(150deg, rgba(21, 73, 42, 0.035) 0 132px, transparent 132px 264px)",
            },
        },
    },
    // The creature feature: a 1950s drive-in one-sheet. Deep midnight-blue
    // ground under film grain and a sickly moon glow, cream poster type,
    // ONE blood-orange accent (the title's extruded drop, the asks, the
    // prices) and an acid-green spot ink for the things that glow — the
    // starburst, the billing tabs, the checkmarks. Bangers caps (hand-
    // lettered poster type) over a Space Grotesk body that stays a working
    // service page underneath; photographs print through the halftone
    // screen. The `pulp` treatment carries the poster moves (extruded
    // titles, billing block, lobby-card mounts). Where tabloid is the late
    // edition and broadside the gig poster, creature is the monster movie:
    // pest control, haunted tours, escape rooms, horror bars, anything
    // that sells a thrill with a straight face.
    creature: {
        nativeMode: "dark",
        fonts: { display: BANGERS, body: SPACE_GROTESK },
        display: {
            // Bangers ships one weight; a faux bold would smear it.
            weight: "400",
            tracking: "0.02em",
            accentStyle: "normal",
            transform: "uppercase",
            scale: "1.36",
        },
        shape: {
            radiusCard: "3px",
            radiusControl: "4px",
            borderWidth: "2px",
        },
        motion: { idiom: "drift", rise: "560ms" },
        treatment: ["pulp", "halftone", "grain"],
        maxWidth: "1200px",
        modes: {
            dark: {
                palette: {
                    pageBg: "#0d1633",
                    surface: "#152148",
                    line: "#34427a",
                    text: "#f4ead0",
                    subtle: "#c3bda6",
                    accent: "#ff5a1f",
                },
                // Acid green (the glow) and poster cream (the stock).
                spot: ["#b4f03a", "#f4ead0"],
                // Lobby cards on the wall: a hard black drop, no blur.
                shadowCard: "7px 7px 0 #040818",
                shadowCta: () => "4px 4px 0 #040818",
                // Night over Houston: an acid-green moon glow at the crown,
                // a blood-orange headlight haze low on the page, all under
                // grain — lurid, never a flat fill.
                backgroundPage: (accent) =>
                    `${GRAIN}, ` +
                    "radial-gradient(900px 620px at 88% -120px, rgba(180, 240, 58, 0.13), transparent 62%), " +
                    `radial-gradient(1200px 620px at 8% 104%, color-mix(in srgb, ${accent} 12%, transparent), transparent 64%), ` +
                    "radial-gradient(160% 100% at 50% 40%, transparent 55%, rgba(2, 5, 16, 0.5) 100%)",
            },
            // The matinee reissue: the same one-sheet printed on cream
            // stock, midnight ink, the orange and green pressed deeper so
            // they hold on paper.
            light: {
                palette: {
                    pageBg: "#f2e8cf",
                    surface: "#fbf5e4",
                    line: "#1c2550",
                    text: "#131a38",
                    subtle: "#4c4a5c",
                    accent: "#d6400e",
                },
                spot: ["#4d8a00", "#131a38"],
                shadowCard: "6px 6px 0 #131a38",
                shadowCta: () => "4px 4px 0 #131a38",
                backgroundPage: (accent) =>
                    `${GRAIN}, ` +
                    `radial-gradient(1100px 560px at 90% -140px, color-mix(in srgb, ${accent} 9%, transparent), transparent 62%)`,
            },
        },
    },
    // The risograph botanical print: a two-drum run on warm uncoated
    // paper. Deep-sage ink carries the type, the rules, and the dark plate
    // of every photograph; fluorescent orange (the accent — the customer
    // brand re-inks it) is the second drum: the warm plate, the CTAs, the
    // brush-stroke under a section title. Photographs are re-separated into
    // the two inks through a coarse screen, a hair off-register (the
    // `two-ink` treatment); line-cut border plants grow in the gutters
    // (`confetti`). Condensed poster caps (Barlow Condensed) over a plain
    // workaday body; botanical names set in italic serif. Nothing glows,
    // nothing floats: flat ink, square-ish print corners, a still press.
    // Built for anything rooted in a place and printed by hand — native
    // landscapers, nurseries, farm stands, community gardens, zine shops.
    // Light-native; dark is the night run — the same inks pulled on a
    // deep-sage stock, the photographs still printed on cream.
    riso: {
        nativeMode: "light",
        fonts: { display: BARLOW_CONDENSED_RISO, body: BARLOW },
        display: {
            weight: "800",
            tracking: "0.004em",
            accentStyle: "normal",
            transform: "uppercase",
            scale: "1.22",
        },
        shape: {
            // A trimmed print, not a pill: the corners just barely eased.
            radiusCard: "6px",
            radiusControl: "4px",
            borderWidth: "1.5px",
        },
        motion: { idiom: "still", rise: "360ms" },
        treatment: ["two-ink", "confetti"],
        maxWidth: "1200px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f3ead6",
                    surface: "#f8f1e2",
                    line: "#b8b596",
                    text: "#2b4634",
                    subtle: "#56664f",
                    accent: "#ea5a1c",
                },
                // [the dark drum's ink, the photographs' paper]
                spot: ["#2f4d3a", "#f3ead6"],
                shadowCard: "none",
                shadowCta: () => "none",
                // Paper, not light: the stock's fiber flecks over a faint
                // warm falloff at the sheet's edges.
                backgroundPage: () =>
                    `${risoTooth("#2b4634")}, ` +
                    "radial-gradient(140% 100% at 50% 30%, transparent 55%, rgba(120, 92, 40, 0.08))",
                ornament: risoOrnament("#2b4634"),
            },
            dark: {
                palette: {
                    pageBg: "#1b2a20",
                    surface: "#223428",
                    line: "#4c6452",
                    text: "#f1e7cf",
                    subtle: "#bfc3a8",
                    accent: "#ff7a3d",
                },
                spot: ["#2f4d3a", "#f3ead6"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => `${risoTooth("#f1e7cf")}`,
                ornament: risoOrnament("#9fb59a"),
            },
        },
    },
    // The paint-chip deck: Swiss color-blocking for a trade that sells
    // color. Flat fields meet edge to edge — the split hero's photograph
    // bleeds off the page, the swatch row runs wall to wall — under huge
    // tight grotesk caps (Inter Tight Black) in one ink. Coral is the
    // accent (the customer brand re-inks it); teal and marigold are the
    // deck's spot chips. No radius anywhere, 2px ink rules, CTAs as flat
    // chips with a hard ink offset (the `colorblock` treatment). Where
    // brutalist is raw and tabloid is news, paintchip is a color studio's
    // fan deck: painters, color consultants, sign shops, print studios,
    // anything whose product IS the color. Still: flat stock doesn't move.
    // Light-native; dark is the showroom after hours — ink ground, bone
    // type, the chips lifted to glow against it.
    paintchip: {
        nativeMode: "light",
        fonts: { display: INTER_TIGHT, body: INTER },
        display: {
            weight: "900",
            tracking: "-0.012em",
            accentStyle: "normal",
            transform: "uppercase",
            scale: "1.5",
        },
        shape: {
            radiusCard: "0px",
            radiusControl: "0px",
            borderWidth: "2px",
        },
        motion: { idiom: "still", rise: "300ms" },
        treatment: ["colorblock"],
        maxWidth: "1240px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f5f2ea",
                    surface: "#fffdf8",
                    line: "#121212",
                    text: "#121212",
                    subtle: "#4a4640",
                    accent: "#ef5b43",
                },
                spot: ["#0f6c70", "#f5a524"],
                shadowCard: "none",
                // The chip's hard ink offset — print, not light.
                shadowCta: () => "4px 4px 0 #121212",
                // Flat stock: the color lives in the fields, not a wash.
                backgroundPage: () => "none",
            },
            dark: {
                palette: {
                    pageBg: "#121212",
                    surface: "#1c1b19",
                    line: "#f5f2ea",
                    text: "#f5f2ea",
                    subtle: "#bdb7ab",
                    accent: "#ff7a62",
                },
                spot: ["#2fb3b8", "#ffc04d"],
                shadowCard: "none",
                shadowCta: () => "4px 4px 0 #f5f2ea",
                backgroundPage: () => "none",
            },
        },
    },
    // The Detroit techno flyer crossed with an electrician's drawing:
    // near-black ground, one electric cyan for the current, one sodium-
    // streetlight orange as the spark (spot 1), thin white schematic line
    // art as the ornament — circuit symbols and a house wiring diagram
    // the `linework` treatment lays over the photographic hero. Unbounded's
    // wide extended caps for display (the flyer headline), Space Grotesk
    // body, readouts in mono. Hairline frames instead of shadows; the
    // cyan glows where you press. Built for trades and makers whose work
    // is technical and after-dark: electricians, solar and EV installers,
    // sound engineers, repair benches. Kinetic idiom: the readout strip
    // rolls. Light is the blueprint on the drafting table.
    schematic: {
        nativeMode: "dark",
        fonts: { display: UNBOUNDED, body: SPACE_GROTESK },
        display: {
            weight: "800",
            tracking: "-0.01em",
            accentStyle: "normal",
            transform: "uppercase",
            // Unbounded is extended: its caps fill the measure at a
            // smaller multiplier than a condensed face.
            scale: "1.1",
        },
        shape: {
            radiusCard: "3px",
            radiusControl: "3px",
            borderWidth: "1px",
        },
        motion: { idiom: "kinetic", rise: "480ms" },
        treatment: ["linework", "hairline", "glow"],
        maxWidth: "1200px",
        modes: {
            dark: {
                palette: {
                    pageBg: "#07090c",
                    surface: "#0d1116",
                    line: "#233039",
                    text: "#eef6f8",
                    subtle: "#8fa3ad",
                    accent: "#22d3ee",
                },
                spot: ["#ff8a1f", "#7ff0ff"],
                shadowCard: "none",
                shadowCta: (accent) =>
                    `0 0 0 1px ${accent}, 0 0 26px color-mix(in srgb, ${accent} 42%, transparent)`,
                // Drafting film over black: a faint 48px grid, a cyan bloom
                // off the top right, a sodium glow low on the left.
                backgroundPage: (accent) =>
                    `radial-gradient(900px 520px at 92% -120px, color-mix(in srgb, ${accent} 16%, transparent), transparent 62%), ` +
                    "radial-gradient(800px 460px at -4% 104%, rgba(255, 138, 31, 0.08), transparent 60%), " +
                    "repeating-linear-gradient(0deg, rgba(238, 246, 248, 0.028) 0 1px, transparent 1px 48px), " +
                    "repeating-linear-gradient(90deg, rgba(238, 246, 248, 0.028) 0 1px, transparent 1px 48px)",
                ornament: schematicOrnament("#eef6f8", "#ff8a1f"),
            },
            light: {
                palette: {
                    pageBg: "#edf2f4",
                    surface: "#f8fbfc",
                    line: "#c3d0d7",
                    text: "#0a1117",
                    subtle: "#4b5c66",
                    accent: "#0a8fb0",
                },
                spot: ["#e06600", "#0a1117"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () =>
                    "repeating-linear-gradient(0deg, rgba(10, 17, 23, 0.045) 0 1px, transparent 1px 48px), " +
                    "repeating-linear-gradient(90deg, rgba(10, 17, 23, 0.045) 0 1px, transparent 1px 48px)",
                // Over the hero photograph the drawing stays white: the
                // frame is a dark photograph in either appearance.
                ornament: schematicOrnament("#eef6f8", "#e06600"),
            },
        },
    },
    // Desert modernism, sun-bleached: a 1970s Southwest motel sign and a
    // Palm Springs carport. Sand ground, burnt-umber ink, a hot orange
    // accent, sun yellow (spot 1) and one ice-blue (spot 2) — the only
    // cool thing on the page, kept for what's cold. Bagel Fat One's fat
    // rounded display, Sacramento's thin sign-script for the aside, a
    // warm Manrope body. The `sunburst` treatment raises a half-sun of
    // rays behind the hero readout and off the closing banner, stacks
    // display numerals in 70s shadows, and frames hero photographs as
    // arched windows. Built for businesses
    // that live in the heat: HVAC, pool service, solar, desert landscaping,
    // roadside diners. Drift idiom: the sun is slow. Dark is monsoon dusk.
    sunbelt: {
        nativeMode: "light",
        fonts: { display: BAGEL_FAT_ONE, body: MANROPE, script: SACRAMENTO },
        display: {
            // Bagel Fat One ships one weight.
            weight: "400",
            tracking: "-0.005em",
            accentStyle: "normal",
            transform: "none",
            scale: "1.18",
        },
        shape: {
            radiusCard: "22px",
            radiusControl: "999px",
            borderWidth: "2px",
        },
        motion: { idiom: "drift", rise: "560ms" },
        treatment: ["sunburst", "grain"],
        maxWidth: "1200px",
        modes: {
            light: {
                palette: {
                    pageBg: "#fbefdc",
                    surface: "#fff8ee",
                    line: "#ecd3b6",
                    text: "#35190f",
                    subtle: "#76543f",
                    accent: "#ee5a1d",
                },
                spot: ["#f6b327", "#5fb3e3"],
                shadowCard: "0 2px 0 rgba(53, 25, 15, 0.06), 0 22px 40px -22px rgba(170, 72, 24, 0.45)",
                shadowCta: (accent) => `0 12px 24px -10px color-mix(in srgb, ${accent} 75%, transparent)`,
                // Sun-bleached paper: grain, the noon sun pooled at the top
                // right, a faded terracotta warmth at the foot.
                backgroundPage: () =>
                    `${GRAIN}, ` +
                    "radial-gradient(1000px 560px at 96% -180px, rgba(246, 179, 39, 0.32), transparent 62%), " +
                    "radial-gradient(1200px 600px at 20% 108%, rgba(226, 148, 128, 0.2), transparent 64%)",
                ornament: sunburstOrnament("#f6b327", "#ee5a1d", "#f4a38e", "#fbefdc"),
            },
            dark: {
                palette: {
                    pageBg: "#2a150e",
                    surface: "#381d14",
                    line: "#5b3526",
                    text: "#fdebd6",
                    subtle: "#d8b39c",
                    accent: "#ff7a3d",
                },
                spot: ["#ffc94d", "#9edcf5"],
                shadowCard: "0 22px 44px -22px rgba(0, 0, 0, 0.7)",
                shadowCta: (accent) => `0 12px 26px -10px color-mix(in srgb, ${accent} 70%, transparent)`,
                backgroundPage: () =>
                    `${GRAIN}, ` +
                    "radial-gradient(1000px 560px at 96% -180px, rgba(255, 122, 61, 0.22), transparent 62%), " +
                    "radial-gradient(1100px 600px at 10% 110%, rgba(158, 220, 245, 0.08), transparent 64%)",
                ornament: sunburstOrnament("#ffc94d", "#ff7a3d", "#c9705c", "#2a150e"),
            },
        },
    },
    // The glossy cover: a late-90s hip-hop / R&B monthly on the newsstand.
    // A deep plum night; display caps cast in chrome with the accent word
    // in gold (the `metallic` treatment — gradient fills and bevel drops on
    // real text, never an image of it); cover lines stacked in the
    // condensed cut of the same Archivo; tangerine (the accent — the
    // customer brand re-inks it) for the asks and the hot cover line; gold
    // rules and stars for the furniture; the price ticker a still strip
    // under the cover. Built for anything sold on a look and a name —
    // braiders, barbers, nail studios, beauty supply, R&B nights, mixtape
    // DJs. Dark-native; light is the newsstand reissue — plum ink on gloss
    // cream, the gold pressed to bronze and the chrome to gunmetal.
    crown: {
        nativeMode: "dark",
        fonts: { display: ARCHIVO, body: ARCHIVO },
        display: {
            weight: "900",
            tracking: "-0.012em",
            accentStyle: "normal",
            transform: "uppercase",
            scale: "1.3",
        },
        shape: {
            radiusCard: "3px",
            radiusControl: "3px",
            borderWidth: "1.5px",
        },
        motion: { idiom: "kinetic", rise: "420ms" },
        treatment: ["metallic", "grain"],
        maxWidth: "1240px",
        modes: {
            dark: {
                palette: {
                    pageBg: "#150a1c",
                    surface: "#221029",
                    line: "#4d2d55",
                    text: "#fbf3ea",
                    subtle: "#d2bcd4",
                    accent: "#ff7a1a",
                },
                // [gold — rules, stars, the accent word's cast; chrome — the headline's cast]
                spot: ["#f2c14e", "#dedbe6"],
                // A gloss page: a gold glint on the top edge and a deep drop.
                shadowCard: "inset 0 1px 0 rgba(242, 193, 78, 0.28), 0 24px 48px rgba(6, 2, 10, 0.55)",
                shadowCta: (accent) => `0 10px 28px color-mix(in srgb, ${accent} 38%, transparent)`,
                // Studio light on the plum sweep: a violet bloom over the
                // cover's right side, a low gold spill on the left, a
                // tangerine warmth at the foot — all under grain.
                backgroundPage: (accent) =>
                    `${GRAIN}, ` +
                    "radial-gradient(1100px 680px at 88% -140px, rgba(150, 52, 176, 0.32), transparent 62%), " +
                    "radial-gradient(900px 620px at -10% 28%, rgba(242, 193, 78, 0.07), transparent 60%), " +
                    `radial-gradient(1200px 700px at 50% 112%, color-mix(in srgb, ${accent} 10%, transparent), transparent 62%)`,
            },
            light: {
                palette: {
                    pageBg: "#fbf1e4",
                    surface: "#fffaf3",
                    line: "#dcc4ad",
                    text: "#2a0d34",
                    subtle: "#654770",
                    accent: "#d4560a",
                },
                spot: ["#a8741a", "#4f4960"],
                shadowCard: "inset 0 1px 0 rgba(168, 116, 26, 0.3), 0 18px 40px rgba(42, 13, 52, 0.14)",
                shadowCta: (accent) => `0 8px 22px color-mix(in srgb, ${accent} 30%, transparent)`,
                backgroundPage: (accent) =>
                    `${GRAIN}, ` +
                    "radial-gradient(1100px 620px at 88% -140px, rgba(150, 52, 176, 0.12), transparent 62%), " +
                    `radial-gradient(1100px 600px at 50% 112%, color-mix(in srgb, ${accent} 8%, transparent), transparent 62%)`,
            },
        },
    },
    // The beauty counter after hours: black lacquer, a fashion Didone at
    // its display optical size (Bodoni Moda) against tiny wide-tracked
    // geometric caps (Jost), blush for the soft voice, cherry (the accent —
    // the customer brand re-inks it) for the word that lands, rose gold
    // and plum as the counter's two other shades. The `lacquer` treatment
    // sets the swatches as framed shade cards around their texture, the
    // headline's first line in white over a blush middle, kickers as
    // spaced caps between hairlines, and a gloss highlight across the
    // asks; `hairline` keeps every frame razor-thin. Built for anything
    // sold on a face and a finish — makeup artists, lash and brow studios,
    // nail bars, fragrance, bridal glam. Dark-native; light is the
    // daylight counter — black ink on blush card, the lipstick deepened.
    vanity: {
        nativeMode: "dark",
        fonts: { display: BODONI_MODA, body: JOST },
        display: {
            weight: "500",
            tracking: "-0.008em",
            accentStyle: "normal",
            transform: "uppercase",
            scale: "1.42",
        },
        shape: {
            radiusCard: "0px",
            radiusControl: "0px",
            borderWidth: "1px",
        },
        motion: { idiom: "drift", rise: "560ms" },
        treatment: ["lacquer", "hairline"],
        maxWidth: "1240px",
        modes: {
            dark: {
                palette: {
                    pageBg: "#080506",
                    surface: "#130c0e",
                    line: "#5a3d40",
                    text: "#fbf3f0",
                    subtle: "#e5bdb8",
                    accent: "#d0142f",
                },
                // [blush — the soft voice and the frames; plum — the third shade]
                spot: ["#efb4ae", "#5c1b40"],
                shadowCard: "none",
                shadowCta: () => "none",
                // A lit counter: a lipstick glow off the lower right, a
                // blush glint at the top left, the rest pure lacquer.
                backgroundPage: (accent) =>
                    `radial-gradient(1000px 640px at 104% 92%, color-mix(in srgb, ${accent} 11%, transparent), transparent 62%), ` +
                    "radial-gradient(800px 420px at -6% -80px, rgba(239, 180, 174, 0.07), transparent 60%)",
            },
            light: {
                palette: {
                    pageBg: "#f8e6e2",
                    surface: "#fdf3f1",
                    line: "#d5aaa8",
                    text: "#150a0c",
                    subtle: "#6d464b",
                    accent: "#b10d28",
                },
                spot: ["#b76e69", "#5c1b40"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: (accent) =>
                    `radial-gradient(1000px 640px at 104% 92%, color-mix(in srgb, ${accent} 7%, transparent), transparent 62%)`,
            },
        },
    },
    // The 1950s furniture catalog, Palm Springs edition: warm off-white
    // stock, walnut-dark ink, a mustard accent, burnt orange (spot 1) and
    // olive (spot 2) as the second and third inks, teal kept for the one
    // arrow that points somewhere. Oswald's condensed caps for display,
    // Jost's geometric Futura revival for the text. Square corners, thin
    // rules, a confident grid. The `atomic` treatment bleeds the split
    // hero's photograph off the page, numbers card grids as a catalog
    // strip, sets specimens and price lists as catalog entries, and spends
    // the atomic-star motif sparingly. Built for design studios, vintage
    // dealers, architects, and anyone whose work lives in a good room.
    // Still idiom: a catalog doesn't perform. Dark is the walnut den.
    midcentury: {
        nativeMode: "light",
        fonts: { display: OSWALD, body: JOST_MIDCENTURY },
        display: {
            weight: "600",
            tracking: "0.004em",
            accentStyle: "normal",
            transform: "uppercase",
            scale: "1.22",
        },
        shape: {
            radiusCard: "0px",
            radiusControl: "0px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "360ms" },
        treatment: ["atomic", "hairline"],
        maxWidth: "1240px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f4ecdd",
                    surface: "#faf5ea",
                    line: "#d8c8ac",
                    text: "#1f1a15",
                    subtle: "#5b4f43",
                    accent: "#e4ad2e",
                },
                spot: ["#bf4f1e", "#6d7628"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
                ornament: atomicOrnament("#6d7628", "#e4ad2e", "#1f1a15"),
            },
            dark: {
                palette: {
                    pageBg: "#1c1611",
                    surface: "#261e17",
                    line: "#47392b",
                    text: "#f3e8d6",
                    subtle: "#c5b39b",
                    accent: "#e6b032",
                },
                spot: ["#e27140", "#a5ae4c"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
                ornament: atomicOrnament("#7d8632", "#e6b032", "#f3e8d6"),
            },
        },
    },
    // The photo-booth zine: a wedding told the way the couple's friends
    // would tell it — booth strips and disposable-camera flash snapshots
    // taped to newsprint, headlines in felt-tip marker, the details typed
    // on a label maker. Hot pink ink with a cobalt second color; typewriter
    // body (IBM Plex Mono). The `zine` treatment tapes the kickers, swooshes
    // the section titles, and prints every photograph as a bordered
    // snapshot. Kinetic idiom: the scraps sit a little off square. Dark is
    // the darkroom — safelight red over black paper.
    photobooth: {
        nativeMode: "light",
        fonts: { display: PERMANENT_MARKER, body: PLEX_MONO },
        display: {
            // Permanent Marker ships one weight.
            weight: "400",
            tracking: "0.005em",
            accentStyle: "normal",
            transform: "uppercase",
            scale: "1.28",
        },
        shape: {
            radiusCard: "2px",
            radiusControl: "3px",
            borderWidth: "2px",
        },
        motion: { idiom: "kinetic", rise: "420ms" },
        treatment: ["zine", "tilt", "grain"],
        maxWidth: "1200px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f3ede1",
                    surface: "#fcf9f2",
                    line: "#d6ccb9",
                    text: "#161514",
                    subtle: "#57504a",
                    accent: "#e2207a",
                },
                spot: ["#1f3fc4", "#fcf9f2"],
                shadowCard: "0 1px 1px rgba(22, 21, 20, 0.08), 0 16px 26px -16px rgba(22, 21, 20, 0.5)",
                shadowCta: () => "3px 3px 0 #161514",
                // Newsprint: paper tooth, a faint warm yellowing at the edges.
                backgroundPage: () =>
                    `${risoTooth("#b09c74")}, ` +
                    "radial-gradient(140% 90% at 50% 20%, transparent 62%, rgba(150, 118, 60, 0.08) 100%)",
            },
            dark: {
                palette: {
                    pageBg: "#141113",
                    surface: "#201b1e",
                    line: "#3d3439",
                    text: "#f5eee3",
                    subtle: "#bdb1a5",
                    accent: "#ff4c98",
                },
                spot: ["#7d94ff", "#f5eee3"],
                shadowCard: "0 18px 34px -18px rgba(0, 0, 0, 0.8)",
                shadowCta: () => "3px 3px 0 #000000",
                // The darkroom: grain and a safelight glowing red up top.
                backgroundPage: () =>
                    `${GRAIN}, ` +
                    "radial-gradient(1100px 520px at 50% -220px, rgba(214, 38, 52, 0.26), transparent 66%)",
            },
        },
    },
    // The 1970s disco supper club: a birthday thrown like a floor show —
    // lacquer red, hot pink, and gold foil on a black lacquer room, a mirror
    // ball throwing glints across the walls. High-contrast Didone caps
    // (Bodoni Moda), a swashy script for the phrase that sings (Great
    // Vibes), a deco geometric sans for everything read at the table
    // (Josefin Sans). The `mirrorball` treatment adds the sparkle kickers,
    // foil rules, foil pills, and gilt frames. Sweep idiom: the light moves.
    // Light is the matinee — champagne linen, the same inks.
    disco: {
        nativeMode: "dark",
        fonts: { display: BODONI_MODA, body: JOSEFIN_SANS, script: GREAT_VIBES },
        display: {
            weight: "700",
            tracking: "0.005em",
            accentStyle: "italic",
            transform: "uppercase",
            scale: "1.3",
        },
        shape: {
            radiusCard: "4px",
            radiusControl: "999px",
            borderWidth: "1px",
        },
        motion: { idiom: "sweep", rise: "700ms" },
        treatment: ["mirrorball", "glow", "grain"],
        maxWidth: "1200px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f7eee2",
                    surface: "#fffaf2",
                    line: "#e2cfae",
                    text: "#1d0f10",
                    subtle: "#6d5446",
                    accent: "#c8102e",
                },
                spot: ["#d2166f", "#a57a1c"],
                shadowCard: "0 2px 0 rgba(29, 15, 16, 0.05), 0 26px 44px -26px rgba(120, 30, 30, 0.45)",
                shadowCta: (accent) => `0 12px 26px -12px color-mix(in srgb, ${accent} 70%, transparent)`,
                backgroundPage: () =>
                    `${discoSparkle("#a57a1c", "#d2166f")}, ${GRAIN}, ` +
                    "radial-gradient(1000px 600px at 92% -160px, rgba(210, 22, 111, 0.14), transparent 64%), " +
                    "radial-gradient(1100px 620px at 4% 104%, rgba(200, 16, 46, 0.1), transparent 64%)",
                ornament: mirrorBallOrnament("#8b8a94", "#ffffff", "#a57a1c", "#d2166f"),
            },
            dark: {
                palette: {
                    pageBg: "#0b0708",
                    surface: "#170d10",
                    line: "#46321f",
                    text: "#fbeee0",
                    subtle: "#c9ae92",
                    accent: "#ea2a43",
                },
                spot: ["#ff4f9f", "#e1b35a"],
                shadowCard: "0 30px 60px -30px rgba(0, 0, 0, 0.9)",
                shadowCta: (accent) => `0 0 30px -4px color-mix(in srgb, ${accent} 55%, transparent)`,
                // Black lacquer: grain, the ball's glints, a pink bloom over
                // the dance floor and a red one under the banquettes.
                backgroundPage: () =>
                    `${discoSparkle("#e1b35a", "#ffffff")}, ${GRAIN}, ` +
                    "radial-gradient(1100px 640px at 88% -200px, rgba(255, 79, 159, 0.16), transparent 64%), " +
                    "radial-gradient(1200px 700px at 0% 110%, rgba(234, 42, 67, 0.14), transparent 66%)",
                ornament: mirrorBallOrnament("#9d9ca8", "#ffffff", "#e1b35a", "#ff4f9f"),
            },
        },
    },
    // The 1970s transit wayfinding register: a station's sign system turned
    // into a page. Forest-green sign panels, white ground, one signal
    // yellow for the rule and the route dots; Archivo's heavy grotesk in
    // caps, zero radius, heavy rule lines, icons struck as circular
    // pictograms. The `transit` treatment builds the sign panel, the route
    // bars, and the full-width sign band nav. Built for practices and
    // services that want to read as public infrastructure — clear, civic,
    // unmissable: direct primary care, clinics, libraries, transit-adjacent
    // trades. Still idiom: signs don't move. Dark is the platform at night.
    wayfinding: {
        nativeMode: "light",
        fonts: { display: ARCHIVO_TRANSIT, body: ARCHIVO_TRANSIT },
        display: {
            weight: "800",
            tracking: "-0.015em",
            accentStyle: "normal",
            transform: "uppercase",
            scale: "1.28",
        },
        shape: {
            radiusCard: "0px",
            radiusControl: "0px",
            borderWidth: "2px",
        },
        motion: { idiom: "still", rise: "360ms" },
        treatment: ["transit"],
        maxWidth: "1240px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f6f5ef",
                    surface: "#ffffff",
                    line: "#0d2b1f",
                    text: "#0d2b1f",
                    subtle: "#3f5a4c",
                    accent: "#0b4a31",
                },
                spot: ["#f4c20d", "#0d2b1f"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
            dark: {
                palette: {
                    pageBg: "#071d14",
                    surface: "#0c2b1e",
                    line: "#e9efe8",
                    text: "#f2f3ec",
                    subtle: "#b6c7bb",
                    accent: "#1f7a52",
                },
                spot: ["#f4c20d", "#f2f3ec"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
        },
    },
    // The 1970s soul-duet LP sleeve: amber light pooling into burnt orange
    // and cocoa, cream type, film grain. Caprasimo's fat soft-cornered
    // display (the Cooper Black sleeve face) in caps over Newsreader's warm
    // text serif. The `sleeve` treatment squares the hero photograph into a
    // record cover, turns the seal into a round record label, and sets the
    // hero aside and price list as a Side A / Side B tracklist. Built for
    // warm, talk-it-through practices: couples and family therapy, vinyl
    // shops, supper clubs, small venues. Drift idiom: the needle is down.
    // Light is the sleeve's cream back cover.
    groove: {
        nativeMode: "dark",
        fonts: { display: CAPRASIMO, body: NEWSREADER },
        display: {
            // Caprasimo ships one weight.
            weight: "400",
            tracking: "0",
            accentStyle: "normal",
            transform: "uppercase",
            scale: "1.3",
        },
        shape: {
            radiusCard: "16px",
            radiusControl: "999px",
            borderWidth: "1.5px",
        },
        motion: { idiom: "drift", rise: "620ms" },
        treatment: ["sleeve", "grain"],
        maxWidth: "1200px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f5e6c8",
                    surface: "#fbf1dc",
                    line: "#d8b88a",
                    text: "#3b1d0e",
                    subtle: "#6e4527",
                    accent: "#c4541b",
                },
                spot: ["#e59a2c", "#3b1d0e"],
                shadowCard: "0 22px 44px -26px rgba(92, 42, 14, 0.55)",
                shadowCta: (accent) => `0 12px 26px -12px color-mix(in srgb, ${accent} 80%, transparent)`,
                backgroundPage: () =>
                    `${GRAIN}, ` +
                    "radial-gradient(1100px 620px at 0% -10%, rgba(229, 154, 44, 0.34), transparent 64%), " +
                    "radial-gradient(900px 600px at 100% 110%, rgba(196, 84, 27, 0.16), transparent 62%)",
            },
            dark: {
                palette: {
                    pageBg: "#3f1d0f",
                    surface: "#522814",
                    line: "#85482a",
                    text: "#f7e7c9",
                    subtle: "#e4c59b",
                    accent: "#e8792c",
                },
                spot: ["#f2b64a", "#f7e7c9"],
                shadowCard: "0 26px 50px -26px rgba(0, 0, 0, 0.7)",
                shadowCta: (accent) => `0 14px 30px -12px color-mix(in srgb, ${accent} 70%, transparent)`,
                // The sleeve's lighting: amber hot at the top-left corner,
                // burning down through orange into cocoa at the foot.
                backgroundPage: () =>
                    `${GRAIN}, ${GRAIN}, ` +
                    "radial-gradient(1200px 820px at -6% -12%, rgba(242, 182, 74, 0.62), transparent 60%), " +
                    "radial-gradient(1400px 900px at 30% 10%, rgba(212, 98, 32, 0.5), transparent 66%), " +
                    "linear-gradient(170deg, #7a3515 0%, #56260f 36%, #3f1d0f 64%, #2e140a 100%)",
            },
        },
    },
    // The gallery-poster register: off-white museum wall, ultramarine ink,
    // a refined high-contrast serif set huge and centered, nothing rounded,
    // no shadows. The `wall-label` treatment hangs artworks unframed (their
    // paper multiplies into the wall), sets the hero aside and cards as
    // museum wall labels and links as catalogue entries. Built for quiet,
    // considered practices whose client needs space: psychologists,
    // counselors, galleries, architects, bookbinders. Still idiom. Dark is
    // the gallery after hours — ink ground, bone type, the blue lifted.
    inkblot: {
        nativeMode: "light",
        fonts: { display: CORMORANT, body: EB_GARAMOND },
        display: {
            weight: "500",
            tracking: "-0.012em",
            accentStyle: "italic",
            transform: "uppercase",
            scale: "1.5",
        },
        shape: {
            radiusCard: "0px",
            radiusControl: "0px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "760ms" },
        treatment: ["wall-label", "hairline"],
        maxWidth: "1280px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f4f0e6",
                    surface: "#f8f5ed",
                    line: "#cfc8b8",
                    text: "#191916",
                    subtle: "#5e5a51",
                    accent: "#1f3fa6",
                },
                spot: ["#1f3fa6", "#e9e2d2"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
            dark: {
                palette: {
                    pageBg: "#10152a",
                    surface: "#161c35",
                    line: "#303a60",
                    text: "#efeadf",
                    subtle: "#b1adb4",
                    accent: "#93a9ff",
                },
                spot: ["#93a9ff", "#1a2140"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
        },
    },
    // Y2K candy pop: bubblegum pink ground, mint and cherry red, glossy
    // everything. Modak's inflated balloon display in caps (the glossy
    // highlight and candy drop come from the `candy` treatment, never from
    // images of text), Outfit's round geometric body, a Yellowtail
    // ballpoint script for the aside. Stickers, pills, jelly buttons —
    // stylish, not childish: the palette is the joke, the layout stays
    // grown-up. Built for bright neighborhood businesses with a sense of
    // humor: dentists, nail bars, froyo, kids' salons. Drift idiom.
    bubblegum: {
        nativeMode: "light",
        fonts: { display: MODAK, body: OUTFIT, script: YELLOWTAIL },
        display: {
            // Modak ships one weight.
            weight: "400",
            tracking: "0.005em",
            accentStyle: "normal",
            transform: "uppercase",
            scale: "1.34",
        },
        shape: {
            radiusCard: "30px",
            radiusControl: "999px",
            borderWidth: "3px",
        },
        motion: { idiom: "drift", rise: "520ms" },
        treatment: ["candy"],
        maxWidth: "1240px",
        modes: {
            light: {
                palette: {
                    pageBg: "#ffe1ee",
                    surface: "#fff6fa",
                    line: "#f4a6c8",
                    text: "#3a0a24",
                    subtle: "#7b3a5d",
                    accent: "#ff2f86",
                },
                spot: ["#5fd9b4", "#e3203b"],
                shadowCard: "0 3px 0 rgba(58, 10, 36, 0.12), 0 24px 44px -24px rgba(214, 31, 110, 0.5)",
                shadowCta: (accent) =>
                    `inset 0 3px 0 rgba(255, 255, 255, 0.45), 0 6px 0 color-mix(in srgb, ${accent} 60%, #3a0a24), 0 18px 30px -12px color-mix(in srgb, ${accent} 70%, transparent)`,
                backgroundPage: () =>
                    "radial-gradient(900px 520px at 92% -8%, rgba(95, 217, 180, 0.42), transparent 62%), " +
                    "radial-gradient(1000px 620px at 0% 30%, rgba(255, 255, 255, 0.7), transparent 60%), " +
                    "radial-gradient(1000px 600px at 100% 100%, rgba(255, 47, 134, 0.18), transparent 62%)",
            },
            dark: {
                palette: {
                    pageBg: "#2a0a1d",
                    surface: "#3b102a",
                    line: "#6e2654",
                    text: "#ffe7f2",
                    subtle: "#f2b2d1",
                    accent: "#ff5aa0",
                },
                spot: ["#6fe8c4", "#ff4d5e"],
                shadowCard: "0 24px 44px -24px rgba(0, 0, 0, 0.7)",
                shadowCta: (accent) =>
                    `inset 0 3px 0 rgba(255, 255, 255, 0.35), 0 6px 0 color-mix(in srgb, ${accent} 55%, #12030b), 0 18px 30px -12px color-mix(in srgb, ${accent} 60%, transparent)`,
                backgroundPage: () =>
                    "radial-gradient(900px 520px at 92% -8%, rgba(111, 232, 196, 0.18), transparent 62%), " +
                    "radial-gradient(1000px 600px at 0% 100%, rgba(255, 90, 160, 0.2), transparent 62%)",
            },
        },
    },
    // The fridge door: documentary family photographs stuck up as white-
    // bordered prints at a lean, masking tape, felt-tip captions, shouted
    // condensed caps in near-black with the tomato-red line. Kraft-cream
    // paper ground; the dark appearance is the same door after bedtime.
    snapshot: {
        nativeMode: "light",
        fonts: { display: ARCHIVO_SNAPSHOT, body: INTER, script: GOCHI_HAND },
        display: {
            weight: "900",
            tracking: "-0.012em",
            accentStyle: "normal",
            transform: "uppercase",
            scale: "1.22",
        },
        shape: {
            radiusCard: "3px",
            radiusControl: "6px",
            borderWidth: "1px",
        },
        motion: { idiom: "kinetic", rise: "520ms" },
        treatment: ["taped", "tilt", "grain"],
        maxWidth: "1240px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f4ecdd",
                    surface: "#fffdf8",
                    line: "#e2d5bf",
                    text: "#1d1916",
                    subtle: "#5b4f46",
                    accent: "#d63a2c",
                },
                spot: ["#f7d154", "#3f7fbf"],
                shadowCard:
                    "0 1px 1px rgba(40, 28, 16, 0.12), 0 6px 10px -4px rgba(40, 28, 16, 0.2), 0 22px 30px -18px rgba(40, 28, 16, 0.32)",
                shadowCta: (accent) => `0 10px 20px -10px color-mix(in srgb, ${accent} 80%, transparent)`,
                // Cream paper under a kitchen window: grain, a soft mottle,
                // morning light pooled top left, a warm shadow at the foot.
                backgroundPage: () =>
                    `${GRAIN}, ` +
                    `${paintTexture("#9a7446", 0.07)}, ` +
                    "radial-gradient(1100px 640px at 8% -160px, rgba(255, 246, 222, 0.9), transparent 64%), " +
                    "radial-gradient(1300px 700px at 92% 110%, rgba(214, 170, 120, 0.18), transparent 64%)",
            },
            dark: {
                palette: {
                    pageBg: "#1c1815",
                    surface: "#2a2420",
                    line: "#40362f",
                    text: "#f6eee2",
                    subtle: "#c6b8a8",
                    accent: "#ff6b57",
                },
                spot: ["#f2c94c", "#7fb2e5"],
                shadowCard: "0 2px 2px rgba(0, 0, 0, 0.4), 0 24px 34px -18px rgba(0, 0, 0, 0.75)",
                shadowCta: (accent) => `0 10px 22px -10px color-mix(in srgb, ${accent} 70%, transparent)`,
                backgroundPage: () =>
                    `${GRAIN}, ` +
                    `${paintTexture("#000000", 0.18)}, ` +
                    "radial-gradient(900px 560px at 12% -140px, rgba(255, 196, 140, 0.1), transparent 62%)",
            },
        },
    },
    // The rodeo poster and the ranch brand: wood-type Western caps in
    // saddle brown on sun-faded parchment, a sunset-orange line, turquoise
    // and sage as the two spot inks, a rope frame thrown around the few
    // things that matter. Dark is the same ranch after the fire's lit.
    rodeo: {
        nativeMode: "light",
        fonts: { display: RYE, body: BITTER },
        display: {
            // Rye ships one weight.
            weight: "400",
            tracking: "0.01em",
            accentStyle: "normal",
            transform: "uppercase",
            scale: "1.04",
        },
        shape: {
            radiusCard: "4px",
            radiusControl: "4px",
            borderWidth: "2px",
        },
        motion: { idiom: "still", rise: "480ms" },
        treatment: ["lariat", "grain"],
        maxWidth: "1220px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f2e4c7",
                    surface: "#f9efd9",
                    line: "#c9a77a",
                    text: "#3b2415",
                    subtle: "#6d4d34",
                    accent: "#c2531c",
                },
                spot: ["#2d8a86", "#7f9163"],
                shadowCard: "0 1px 0 rgba(59, 36, 21, 0.18), 0 16px 30px -20px rgba(92, 52, 22, 0.55)",
                shadowCta: (accent) => `0 4px 0 color-mix(in srgb, ${accent} 55%, #2a170c)`,
                // Sun-faded parchment: grain, a tobacco mottle, the page
                // edges browned like an old handbill.
                backgroundPage: () =>
                    `${GRAIN}, ` +
                    `${paintTexture("#7a4a22", 0.12)}, ` +
                    "radial-gradient(140% 120% at 50% 40%, transparent 62%, rgba(122, 74, 34, 0.16)), " +
                    "radial-gradient(1000px 520px at 88% -140px, rgba(236, 150, 72, 0.18), transparent 62%)",
                ornament: lariatFrame("#c79a5e", "#6b4221"),
            },
            dark: {
                palette: {
                    pageBg: "#22160e",
                    surface: "#2f2015",
                    line: "#5a3e28",
                    text: "#f4e4c4",
                    subtle: "#d2b894",
                    accent: "#ea7a3c",
                },
                spot: ["#4fb9b1", "#a8b88a"],
                shadowCard: "0 20px 36px -20px rgba(0, 0, 0, 0.75)",
                shadowCta: (accent) => `0 4px 0 color-mix(in srgb, ${accent} 45%, black)`,
                backgroundPage: () =>
                    `${GRAIN}, ` +
                    `${paintTexture("#000000", 0.2)}, ` +
                    "radial-gradient(900px 520px at 50% -160px, rgba(234, 122, 60, 0.14), transparent 62%)",
                ornament: lariatFrame("#9c7447", "#e7cfa3"),
            },
        },
    },
    // The portrait sitter's wall: flat window-light stone, a small refined
    // Garamond set roman and quiet, hairlines, nothing rounded, no wash.
    // Built for the portrait stack (gallery `sequence` + `captionStack` `band-*`):
    // the stone ground IS the caption band, and the surface a shade darker
    // is the closing `colophon` band. Ink-dark accent so any button stays
    // a quiet print. Dark is the same studio after the light goes.
    vitrine: {
        nativeMode: "light",
        fonts: { display: EB_GARAMOND, body: EB_GARAMOND },
        display: {
            weight: "400",
            tracking: "0.005em",
            accentStyle: "italic",
            transform: "none",
            scale: "0.9",
        },
        shape: {
            radiusCard: "0px",
            radiusControl: "0px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "760ms" },
        treatment: ["hairline"],
        maxWidth: "1120px",
        modes: {
            light: {
                palette: {
                    pageBg: "#d8d4cd",
                    surface: "#a7a29a",
                    line: "#bdb7ae",
                    text: "#211f1c",
                    subtle: "#57524b",
                    accent: "#26231f",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
            dark: {
                palette: {
                    pageBg: "#1d1c1a",
                    surface: "#2b2926",
                    line: "#3d3a36",
                    text: "#e7e2da",
                    subtle: "#a8a197",
                    accent: "#e7e2da",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
        },
    },
    // The headshot studio: white walls, a small clean grotesque, nothing
    // but the sitters on their colored seamless. Inter Tight names over an
    // Inter body, zero radius, no shadows, ink-black accent so the only
    // color on the page is the paper behind each face. Dark is the studio
    // with the modeling lights off.
    seamless: {
        nativeMode: "light",
        fonts: { display: INTER_TIGHT, body: INTER },
        display: {
            weight: "500",
            tracking: "-0.01em",
            accentStyle: "normal",
            transform: "none",
            scale: "0.9",
        },
        shape: {
            radiusCard: "0px",
            radiusControl: "0px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "480ms" },
        treatment: [],
        maxWidth: "1200px",
        modes: {
            light: {
                palette: {
                    pageBg: "#ffffff",
                    surface: "#ffffff",
                    line: "#e3e3e3",
                    text: "#111111",
                    subtle: "#666666",
                    accent: "#111111",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
            dark: {
                palette: {
                    pageBg: "#0f0f0f",
                    surface: "#0f0f0f",
                    line: "#2a2a2a",
                    text: "#f2f2f2",
                    subtle: "#9a9a9a",
                    accent: "#f2f2f2",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
        },
    },
    // The liner notes: a near-black sleeve after the show, Barlow's plain
    // grotesque set small, square corners, a record wall of covers (gallery
    // `covers`) doing all the talking — night-lit live frames bleed into
    // the page. Warm paper ink, no shadows, no wash. Light is the
    // warm-white inner sleeve.
    liner: {
        nativeMode: "dark",
        fonts: { display: BARLOW, body: BARLOW },
        display: {
            weight: "500",
            tracking: "0em",
            accentStyle: "normal",
            transform: "none",
            scale: "0.9",
        },
        shape: {
            radiusCard: "0px",
            radiusControl: "0px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "520ms" },
        treatment: [],
        maxWidth: "1240px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f8f5ef",
                    surface: "#f8f5ef",
                    line: "#e2dbcf",
                    text: "#1c1a17",
                    subtle: "#6a6358",
                    accent: "#1f1c18",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
            dark: {
                palette: {
                    pageBg: "#171411",
                    surface: "#171411",
                    line: "#3a332b",
                    text: "#f3ede2",
                    subtle: "#b3a998",
                    accent: "#f3ede2",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
        },
    },
    // The sea-fog register: a Big Sur morning before it burns off. Grey-blue
    // mist for the ground, a light Cormorant for the names and the lines, a
    // small Jost for everything that has to be read quickly; hairlines,
    // square corners, no shadow. The photographs carry the coast.
    seafog: {
        nativeMode: "light",
        fonts: { display: CORMORANT, body: JOST },
        display: {
            weight: "400",
            tracking: "0.005em",
            accentStyle: "italic",
            transform: "none",
            scale: "1.12",
        },
        shape: {
            radiusCard: "0px",
            radiusControl: "0px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "560ms" },
        treatment: ["hairline"],
        maxWidth: "1080px",
        modes: {
            light: {
                palette: {
                    pageBg: "#eaeef0",
                    surface: "#f3f5f6",
                    line: "#cfd7db",
                    text: "#27323a",
                    subtle: "#5d6a73",
                    accent: "#3e5666",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
            // The same coast after dark: the fog gone slate, ink lifted to mist.
            dark: {
                palette: {
                    pageBg: "#161c21",
                    surface: "#1c242a",
                    line: "#2f3a42",
                    text: "#e6ebee",
                    subtle: "#9ba8b1",
                    accent: "#b8c8d3",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
        },
    },
    // The harvest register: an orchard wedding in October. Forest-green
    // stock and ivory ink — the caption bands of a photo stack read as
    // green ribbons between the frames — with a light Newsreader for the
    // names and the story. Square corners, hairlines, no shadow. Light is
    // the ivory reply card with green ink.
    harvest: {
        nativeMode: "dark",
        fonts: { display: NEWSREADER, body: NEWSREADER },
        display: {
            weight: "400",
            tracking: "-0.005em",
            accentStyle: "italic",
            transform: "none",
            scale: "1.12",
        },
        shape: {
            radiusCard: "0px",
            radiusControl: "0px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "520ms" },
        treatment: ["hairline"],
        maxWidth: "1080px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f6f1e5",
                    surface: "#efe8d7",
                    line: "#d8cfb9",
                    text: "#1f3a2b",
                    subtle: "#5a6b5d",
                    accent: "#1f3a2b",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
            dark: {
                palette: {
                    pageBg: "#1e3a2b",
                    surface: "#1e3a2b",
                    line: "#3a5a46",
                    text: "#f5f0e4",
                    subtle: "#c8c4b3",
                    accent: "#f5f0e4",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
        },
    },
    // The carton register: a Paris faire-part with no photograph on it.
    // Cornflower ink on warm paper, Bodoni Moda's hairline contrast set
    // enormous for the names and at book size for everything else, ink
    // hairlines ruling the column. Nothing else — the type is the page.
    carton: {
        nativeMode: "light",
        fonts: { display: BODONI_MODA, body: BODONI_MODA },
        display: {
            weight: "400",
            tracking: "-0.01em",
            accentStyle: "italic",
            transform: "none",
            scale: "1.5",
        },
        shape: {
            radiusCard: "0px",
            radiusControl: "0px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "520ms" },
        treatment: ["hairline", "ruled"],
        maxWidth: "860px",
        modes: {
            light: {
                palette: {
                    pageBg: "#faf6ee",
                    surface: "#faf6ee",
                    line: "#9fb0dc",
                    text: "#1d3a8f",
                    subtle: "#4a5f9e",
                    accent: "#1d3a8f",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
            // Ink and paper swapped: cornflower on midnight.
            dark: {
                palette: {
                    pageBg: "#121a33",
                    surface: "#121a33",
                    line: "#2e3d6b",
                    text: "#e9edf8",
                    subtle: "#a9b4d6",
                    accent: "#aebcf0",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
        },
    },
    // The wedding morning, documented: pure white stock, warm near-black
    // ink, a dusty-rose accent for the one ask, sage as the second ink. A
    // light variable grotesk (Hanken Grotesk at 300) says the headlines
    // plainly; a fine script (Ms Madi) writes the captions under the
    // photographs like an album. The `keepsake` treatment turns the
    // timeline into the morning hour by hour — the time set large and light
    // beside its photographs, a script caption under each — sets the rate
    // as one centered line, hangs a small heart on the rule over the
    // places, and makes the ask a soft rose pill. Built for bridal hair and
    // makeup teams, wedding planners, and anyone whose product is a day.
    // Drift idiom: nothing performs. Dark is the candlelit suite.
    daybook: {
        nativeMode: "light",
        fonts: { display: HANKEN_GROTESK, body: HANKEN_GROTESK, script: MS_MADI },
        display: {
            weight: "300",
            tracking: "-0.015em",
            accentStyle: "normal",
            transform: "none",
            scale: "1.18",
        },
        shape: {
            radiusCard: "2px",
            radiusControl: "999px",
            borderWidth: "1px",
        },
        motion: { idiom: "drift", rise: "520ms" },
        treatment: ["keepsake", "hairline"],
        maxWidth: "1180px",
        modes: {
            light: {
                palette: {
                    pageBg: "#fdfcfa",
                    surface: "#ffffff",
                    line: "#e9dfda",
                    text: "#2b2522",
                    subtle: "#6d605a",
                    accent: "#a0675f",
                },
                // [the caption rose; sage for the second voice]
                spot: ["#b27d74", "#8c9d88"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
                ornament: keepsakeHeart("#c9968d"),
            },
            dark: {
                palette: {
                    pageBg: "#1c1918",
                    surface: "#252120",
                    line: "#3e3633",
                    text: "#f6f0ed",
                    subtle: "#c6b8b1",
                    accent: "#dcaaa1",
                },
                spot: ["#e3b5ac", "#a9b8a4"],
                shadowCard: "none",
                shadowCta: () => "none",
                // Candlelight low on the right, the rest the dark suite.
                backgroundPage: (accent) =>
                    `radial-gradient(900px 560px at 96% 100%, color-mix(in srgb, ${accent} 9%, transparent), transparent 64%)`,
                ornament: keepsakeHeart("#dcaaa1"),
            },
        },
    },
    // The jewel box: a South Asian bridal trousseau opened on emerald
    // velvet — deep emerald ground, ivory-gold ink, gold for the rules, the
    // frames, and the one ask, vermilion as the second ink. A heavy
    // high-contrast serif drawn for Latin and Devanagari (Rozha One) for
    // display over a carved-capital text face (Marcellus). The `filigree`
    // treatment arches the hero's event panels like jharokha windows with
    // gold plates for their names, frames the package board and the
    // closing ask in double gold rules with filigree corners, sets the
    // lotus ornament over the name and between sections, and makes the ask
    // a gold plate. Built for bridal studios, mehndi artists, and any
    // celebration that runs for days. Drift idiom. Light is ivory silk
    // with emerald ink.
    jharokha: {
        nativeMode: "dark",
        fonts: { display: ROZHA_ONE, body: MARCELLUS },
        display: {
            // Rozha One ships one weight.
            weight: "400",
            tracking: "0.004em",
            accentStyle: "normal",
            transform: "none",
            scale: "1.2",
        },
        shape: {
            radiusCard: "6px",
            radiusControl: "6px",
            borderWidth: "1px",
        },
        motion: { idiom: "drift", rise: "560ms" },
        treatment: ["filigree", "grain"],
        maxWidth: "1180px",
        modes: {
            dark: {
                palette: {
                    pageBg: "#0c2a1f",
                    surface: "#113325",
                    line: "#7d6a3c",
                    text: "#f7eed6",
                    subtle: "#d8ca9f",
                    accent: "#d6b25e",
                },
                // [bright gold — the ornament and the frames; vermilion]
                spot: ["#e8cb7a", "#a8322e"],
                shadowCard: "0 18px 40px -24px rgba(0, 0, 0, 0.7)",
                shadowCta: (accent) => `0 8px 24px -12px color-mix(in srgb, ${accent} 60%, transparent)`,
                // Velvet: an emerald bloom behind the name, grain over all.
                backgroundPage: () =>
                    `${GRAIN}, ` +
                    "radial-gradient(1100px 640px at 50% -120px, rgba(34, 102, 72, 0.45), transparent 64%)",
                ornament: filigreeLotus("#d6b25e"),
            },
            light: {
                palette: {
                    pageBg: "#f8f1e1",
                    surface: "#fffaef",
                    line: "#c9ad6d",
                    text: "#123527",
                    subtle: "#4a5d4f",
                    accent: "#9c7627",
                },
                spot: ["#8a651c", "#a8322e"],
                shadowCard: "0 16px 32px -24px rgba(18, 53, 39, 0.35)",
                shadowCta: () => "none",
                backgroundPage: () => `${GRAIN}`,
                ornament: filigreeLotus("#9c7627"),
            },
        },
    },
    // The coastal masthead: bright white stock, graphite ink, thin gray
    // rules, and no color but the photographs' Pacific. The widest cut of
    // Lexend (Giga) at a light weight for the tracked caps, its Deca width
    // for the text. The `panorama` treatment lifts the masthead-overlay
    // headline off the photograph — the name set enormous and wide-tracked
    // above a ruled line of places, the photograph a full-width panorama
    // under it — hangs every kicker on a long rule, turns the residences
    // rail into edge-to-edge frames with caps captions, sets the metrics as
    // light numerals between rules, the split's ask as a quiet caps link,
    // and the closing banner as one ruled line with an arrow. Built for
    // architects, builders, developers, and hospitality — anyone whose
    // work is a view. Still idiom. Dark is the house at night.
    horizon: {
        nativeMode: "light",
        fonts: { display: LEXEND_GIGA, body: LEXEND_DECA },
        display: {
            weight: "300",
            tracking: "0.06em",
            accentStyle: "normal",
            transform: "uppercase",
            scale: "0.92",
        },
        shape: {
            radiusCard: "0px",
            radiusControl: "0px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "420ms" },
        treatment: ["panorama", "hairline"],
        maxWidth: "1280px",
        modes: {
            light: {
                palette: {
                    pageBg: "#fbfaf7",
                    surface: "#ffffff",
                    line: "#d8d3c9",
                    text: "#1b1b19",
                    subtle: "#5c5953",
                    accent: "#22211e",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
            dark: {
                palette: {
                    pageBg: "#111315",
                    surface: "#191c1f",
                    line: "#33383d",
                    text: "#f2f0eb",
                    subtle: "#a8a69f",
                    accent: "#ebe6da",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
        },
    },
    // The engraved quarterly: ivory laid stock, navy ink, and nothing else —
    // the letterhead of a family firm and the pages of a country-house
    // magazine. Caslon at display size (Libre Caslon Display) for the
    // headlines, its text cut with a real italic (Libre Caslon Text) for
    // the story. The `engraved` treatment stamps the preset's crest over
    // the hero's line, sets the hero headline centered and white over the
    // photograph like an engraving's title, ornaments the feature's rule
    // with a fleuron, deepens the drop cap, sets the figures' titles in
    // small caps, the places as a spaced line of Caslon, and the ask as a
    // navy-ruled plate with an arrow. Built for builders of old houses,
    // restorers, furniture makers, and anyone selling heirlooms. Still
    // idiom. Dark is the navy library.
    shingle: {
        nativeMode: "light",
        fonts: { display: LIBRE_CASLON_DISPLAY, body: LIBRE_CASLON_TEXT },
        display: {
            // Libre Caslon Display ships one weight.
            weight: "400",
            tracking: "0em",
            accentStyle: "italic",
            transform: "none",
            scale: "1.22",
        },
        shape: {
            radiusCard: "0px",
            radiusControl: "0px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "460ms" },
        treatment: ["engraved"],
        maxWidth: "1120px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f6f1e5",
                    surface: "#fbf7ee",
                    line: "#cdbfa2",
                    text: "#1c2944",
                    subtle: "#55607a",
                    accent: "#1c2944",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                // Laid paper: grain and the faintest horizontal chain lines.
                backgroundPage: () =>
                    `${GRAIN}, ` +
                    "repeating-linear-gradient(0deg, rgba(28, 41, 68, 0.018) 0 1px, transparent 1px 9px)",
                ornament: engravedCrest("#1c2944"),
            },
            dark: {
                palette: {
                    pageBg: "#131a2a",
                    surface: "#1a2337",
                    line: "#35415b",
                    text: "#f2ebd9",
                    subtle: "#bfc2cd",
                    accent: "#e6dbbd",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => `${GRAIN}`,
                ornament: engravedCrest("#e6dbbd"),
            },
        },
    },
    // The private atelier: warm limestone stock like a plastered suite,
    // umber ink, a taupe ask, nothing bright. A Didone (Libre Bodoni) sets
    // the headlines and the stylists' names in italic over an old-style
    // book face (Crimson Pro). The `alcove` treatment arches every portrait
    // like the suite's mirror in a thin stone border, rules the directory's
    // ranks apart with column hairlines, sets the filter as a quiet dotted
    // line of words instead of chips, and lays the closing ask as one
    // centered sentence over a squared taupe button. Built for salons,
    // ateliers, private practices, and anyone who sells a quiet room.
    // Still idiom. Dark is the suite after hours.
    limestone: {
        nativeMode: "light",
        fonts: { display: LIBRE_BODONI, body: CRIMSON_PRO },
        display: {
            weight: "400",
            tracking: "-0.012em",
            accentStyle: "italic",
            transform: "none",
            scale: "1.32",
        },
        shape: {
            radiusCard: "0px",
            radiusControl: "2px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "480ms" },
        treatment: ["alcove", "hairline"],
        maxWidth: "1180px",
        modes: {
            light: {
                palette: {
                    pageBg: "#efe7da",
                    surface: "#f6f0e6",
                    line: "#d3c5b0",
                    text: "#2a241e",
                    subtle: "#66594b",
                    accent: "#8b7a60",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                // Plaster: a fine grain and a soft daylight from the left.
                backgroundPage: () =>
                    `${GRAIN}, ` +
                    "radial-gradient(1200px 800px at -10% 20%, rgba(255, 252, 245, 0.55), transparent 62%)",
            },
            dark: {
                palette: {
                    pageBg: "#1f1b17",
                    surface: "#29241f",
                    line: "#473e34",
                    text: "#f1e9dc",
                    subtle: "#c8baa5",
                    accent: "#bca587",
                },
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => `${GRAIN}`,
            },
        },
    },
    // The ritual room: espresso ground, cream ink, cognac for the one ask,
    // walnut in the rules. A sharp modern display serif (Gloock) over a
    // screen-first text serif with a true italic (Spectral). The `ritual`
    // treatment sets the process rail as a numbered strip — the photograph,
    // the step number, its name, its minutes, hairlines between — hangs the
    // section heads between long rules, sets the one testimonial centered
    // in italic between rules with a tracked-caps credit, the rates as one
    // dotted line, and the ask as a squared cognac plate. Built for silk
    // press and natural-hair studios, barbers, spas, and anyone whose
    // service is a sequence. Drift idiom. Light is the cream towel.
    cognac: {
        nativeMode: "dark",
        fonts: { display: GLOOCK, body: SPECTRAL },
        display: {
            // Gloock ships one weight.
            weight: "400",
            tracking: "-0.01em",
            accentStyle: "italic",
            transform: "none",
            scale: "1.3",
        },
        shape: {
            radiusCard: "0px",
            radiusControl: "2px",
            borderWidth: "1px",
        },
        motion: { idiom: "drift", rise: "600ms" },
        treatment: ["ritual", "grain"],
        maxWidth: "1160px",
        modes: {
            dark: {
                palette: {
                    pageBg: "#1d1410",
                    surface: "#271b15",
                    line: "#4b382c",
                    text: "#f4e9dd",
                    subtle: "#cdb9a5",
                    accent: "#b8743f",
                },
                spot: ["#d59a62", "#6e4a33"],
                shadowCard: "none",
                shadowCta: () => "none",
                // Lamplight: a warm pool at the top, grain over the walnut.
                backgroundPage: () =>
                    `${GRAIN}, ` +
                    "radial-gradient(1000px 600px at 50% -160px, rgba(184, 116, 63, 0.14), transparent 62%)",
            },
            light: {
                palette: {
                    pageBg: "#f5ede3",
                    surface: "#fbf6ef",
                    line: "#dccab6",
                    text: "#2a1b13",
                    subtle: "#6a5141",
                    accent: "#9b5b2c",
                },
                spot: ["#b0703d", "#6e4a33"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => `${GRAIN}`,
            },
        },
    },
    // The estate plant room: graphite walls, copper and brass pipework, a
    // condensed engineering sans with the spec sheet in monospace, equipment
    // tagged like a service ledger. Dark is the room itself; light is the
    // same ledger printed on warm concrete.
    plantroom: {
        nativeMode: "dark",
        fonts: { display: SOFIA_CONDENSED, body: SOFIA_SANS, script: PLEX_MONO },
        display: {
            weight: "500",
            tracking: "-0.012em",
            accentStyle: "normal",
            transform: "none",
            scale: "1.16",
        },
        shape: {
            radiusCard: "2px",
            radiusControl: "2px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "420ms" },
        treatment: ["gauge", "hairline", "grain"],
        maxWidth: "1240px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f1ede7",
                    surface: "#faf7f2",
                    line: "#d6cdc1",
                    text: "#1b1917",
                    subtle: "#665d55",
                    accent: "#9c5426",
                },
                spot: ["#b78649", "#4d6b70"],
                shadowCard: "0 1px 0 rgba(27, 25, 23, 0.08)",
                shadowCta: () => "none",
                backgroundPage: () =>
                    `${GRAIN}, ` +
                    "radial-gradient(1200px 600px at 80% -200px, rgba(156, 84, 38, 0.08), transparent 64%)",
            },
            dark: {
                palette: {
                    pageBg: "#111214",
                    surface: "#191a1d",
                    line: "#35312c",
                    text: "#eee8df",
                    subtle: "#a3998d",
                    accent: "#b06a38",
                },
                spot: ["#d6a063", "#6d8a8f"],
                shadowCard: "0 1px 0 rgba(0, 0, 0, 0.5)",
                shadowCta: () => "none",
                // A lamp over the manifold: one low copper glow at the top of
                // the room, the corners falling off to graphite.
                backgroundPage: () =>
                    `${GRAIN}, ` +
                    "radial-gradient(1100px 520px at 70% -180px, rgba(204, 135, 83, 0.12), transparent 64%), " +
                    "radial-gradient(140% 120% at 50% 30%, transparent 64%, rgba(0, 0, 0, 0.35))",
            },
        },
    },
    // The storm dispatch desk: harbor navy and signal amber on a clean
    // white working page, a heavy grotesque for the board, the intake card
    // frosted over the storm photograph. Dark is the desk at 3 AM.
    stormline: {
        nativeMode: "light",
        fonts: { display: SCHIBSTED, body: PUBLIC_SANS },
        display: {
            weight: "800",
            tracking: "-0.022em",
            accentStyle: "normal",
            transform: "none",
            scale: "1.12",
        },
        shape: {
            radiusCard: "10px",
            radiusControl: "8px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "360ms" },
        treatment: ["dispatch"],
        maxWidth: "1200px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f5f7fa",
                    surface: "#ffffff",
                    line: "#d5dce5",
                    text: "#0e1c2d",
                    subtle: "#4b5b6e",
                    accent: "#c2680c",
                },
                spot: ["#10233d", "#f3a531"],
                shadowCard: "0 1px 2px rgba(14, 28, 45, 0.08), 0 12px 28px -18px rgba(14, 28, 45, 0.35)",
                shadowCta: (accent) => `0 10px 22px -12px color-mix(in srgb, ${accent} 75%, transparent)`,
                backgroundPage: () => "linear-gradient(#f5f7fa, #f5f7fa)",
            },
            dark: {
                palette: {
                    pageBg: "#0b1828",
                    surface: "#122338",
                    line: "#253e5c",
                    text: "#edf2f8",
                    subtle: "#9cafc4",
                    accent: "#f2a23a",
                },
                spot: ["#1c3a60", "#ffc062"],
                shadowCard: "0 16px 32px -20px rgba(0, 0, 0, 0.7)",
                shadowCta: (accent) => `0 10px 24px -12px color-mix(in srgb, ${accent} 65%, transparent)`,
                backgroundPage: () =>
                    "radial-gradient(1100px 560px at 20% -200px, rgba(242, 162, 58, 0.1), transparent 62%)",
            },
        },
    },
    // The Montecito garden journal: warm lime plaster, an old-style italic
    // serif, olive green and lavender, stories set as ruled cards with an
    // engraved sprig in the margin. Dark is the same terrace after sunset.
    plaster: {
        nativeMode: "light",
        fonts: { display: SORTS_MILL_GOUDY, body: KARLA },
        display: {
            // Sorts Mill Goudy ships one weight (upright and italic).
            weight: "400",
            tracking: "-0.005em",
            accentStyle: "italic",
            transform: "none",
            scale: "1.08",
        },
        shape: {
            radiusCard: "2px",
            radiusControl: "4px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "520ms" },
        treatment: ["journal", "grain"],
        maxWidth: "1180px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f3ece0",
                    surface: "#fbf7ef",
                    line: "#dccfb8",
                    text: "#2e2922",
                    subtle: "#6b6152",
                    accent: "#62733a",
                },
                spot: ["#8a6fa8", "#b5804b"],
                shadowCard: "0 1px 0 rgba(46, 41, 34, 0.06), 0 14px 30px -24px rgba(90, 70, 40, 0.4)",
                shadowCta: (accent) => `0 8px 18px -12px color-mix(in srgb, ${accent} 70%, transparent)`,
                // Lime plaster: grain, a warm limewash mottle, sun on the
                // wall's upper edge.
                backgroundPage: () =>
                    `${GRAIN}, ` +
                    `${paintTexture("#a9885a", 0.06)}, ` +
                    "radial-gradient(1200px 620px at 50% -220px, rgba(255, 244, 220, 0.8), transparent 64%)",
                ornament: oliveSprig("#7d7358"),
            },
            dark: {
                palette: {
                    pageBg: "#221e18",
                    surface: "#2c2720",
                    line: "#4a4234",
                    text: "#f1e9da",
                    subtle: "#bdb09a",
                    accent: "#bccb80",
                },
                spot: ["#b59bd0", "#d29a61"],
                shadowCard: "0 18px 34px -22px rgba(0, 0, 0, 0.7)",
                shadowCta: (accent) => `0 8px 18px -12px color-mix(in srgb, ${accent} 55%, transparent)`,
                backgroundPage: () =>
                    `${GRAIN}, ` +
                    `${paintTexture("#000000", 0.16)}, ` +
                    "radial-gradient(1000px 520px at 50% -200px, rgba(233, 196, 128, 0.1), transparent 62%)",
                ornament: oliveSprig("#a89c80"),
            },
        },
    },
    // The moss garden in fog: basalt-dark ground, a light wide-spaced sans,
    // one maple red, frames stepped down the page like stones on a path.
    // Light is the same garden on a white-sky morning.
    basalt: {
        nativeMode: "dark",
        fonts: { display: RED_HAT_DISPLAY, body: RED_HAT_TEXT },
        display: {
            weight: "300",
            tracking: "0.02em",
            accentStyle: "normal",
            transform: "none",
            scale: "1.04",
        },
        shape: {
            radiusCard: "0px",
            radiusControl: "0px",
            borderWidth: "1px",
        },
        motion: { idiom: "drift", rise: "720ms" },
        treatment: ["stillness", "mist"],
        maxWidth: "1180px",
        modes: {
            light: {
                palette: {
                    pageBg: "#edebe6",
                    surface: "#f6f5f1",
                    line: "#d2cfc7",
                    text: "#1a1c1d",
                    subtle: "#5d6163",
                    accent: "#a23224",
                },
                spot: ["#56704a", "#8f8a7e"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () =>
                    "radial-gradient(1400px 700px at 50% -300px, rgba(255, 255, 255, 0.7), transparent 66%)",
            },
            dark: {
                palette: {
                    pageBg: "#111315",
                    surface: "#181b1e",
                    line: "#2c3136",
                    text: "#e8e5de",
                    subtle: "#989b9d",
                    accent: "#c2402f",
                },
                spot: ["#6f8a5a", "#c9c3b4"],
                shadowCard: "none",
                shadowCta: () => "none",
                // Fog lifting off the ground: a pale wash high on the page.
                backgroundPage: () =>
                    `${GRAIN}, ` +
                    "radial-gradient(1400px 620px at 50% -260px, rgba(200, 210, 205, 0.08), transparent 66%)",
            },
        },
    },
    // White-glove housekeeping: a pure white house, black geometric type,
    // a sage kicker, hairline cards and square ink asks. Dark is the same
    // residence at night — black lacquer and white linen.
    whiteglove: {
        nativeMode: "light",
        fonts: { display: URBANIST, body: DM_SANS },
        display: {
            weight: "700",
            tracking: "-0.022em",
            accentStyle: "normal",
            transform: "none",
            scale: "1.1",
        },
        shape: {
            radiusCard: "14px",
            radiusControl: "2px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "460ms" },
        treatment: ["concierge", "hairline"],
        maxWidth: "1180px",
        modes: {
            light: {
                palette: {
                    pageBg: "#ffffff",
                    surface: "#fafaf8",
                    line: "#e5e5e1",
                    text: "#0b0b0b",
                    subtle: "#5b5b57",
                    accent: "#111111",
                },
                spot: ["#4d6a47", "#c9c9c2"],
                shadowCard: "0 1px 2px rgba(11, 11, 11, 0.04)",
                shadowCta: () => "none",
                backgroundPage: () => "linear-gradient(#ffffff, #ffffff)",
            },
            dark: {
                palette: {
                    pageBg: "#0d0d0d",
                    surface: "#161616",
                    line: "#2a2a2a",
                    text: "#f4f4f1",
                    subtle: "#a2a29c",
                    accent: "#f4f4f1",
                },
                spot: ["#9bb895", "#3a3a37"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "linear-gradient(#0d0d0d, #0d0d0d)",
            },
        },
    },
    // The Palm Beach club: flamingo-blush ground, palm green, a classic
    // Caslon in spaced caps with its italic for the hero, gold rules and a
    // bamboo frame around the page. Dark is the terrace under lanterns.
    palmbeach: {
        nativeMode: "light",
        fonts: { display: LIBRE_CASLON, body: LIBRE_FRANKLIN },
        display: {
            weight: "400",
            tracking: "0.005em",
            accentStyle: "italic",
            transform: "none",
            scale: "1.06",
        },
        shape: {
            radiusCard: "4px",
            radiusControl: "6px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "480ms" },
        treatment: ["cabana"],
        maxWidth: "1200px",
        modes: {
            light: {
                palette: {
                    pageBg: "#fbe9e4",
                    surface: "#fffaf6",
                    line: "#e9cdc2",
                    text: "#1d3a2b",
                    subtle: "#56695a",
                    accent: "#23845f",
                },
                spot: ["#e8a0ab", "#c19a45"],
                shadowCard: "0 1px 0 rgba(29, 58, 43, 0.06), 0 14px 26px -20px rgba(120, 60, 60, 0.35)",
                shadowCta: (accent) => `0 8px 18px -10px color-mix(in srgb, ${accent} 70%, transparent)`,
                backgroundPage: () =>
                    "radial-gradient(1200px 600px at 50% -240px, rgba(255, 250, 244, 0.9), transparent 64%)",
                ornament: bambooFrame("#6f8f4e", "#d9d2a2"),
            },
            dark: {
                palette: {
                    pageBg: "#12231a",
                    surface: "#1a3025",
                    line: "#2e4a3a",
                    text: "#f8ece5",
                    subtle: "#c3b6ad",
                    accent: "#6fd3aa",
                },
                spot: ["#f0a7b3", "#d8b35c"],
                shadowCard: "0 18px 30px -20px rgba(0, 0, 0, 0.7)",
                shadowCta: (accent) => `0 8px 18px -10px color-mix(in srgb, ${accent} 55%, transparent)`,
                backgroundPage: () =>
                    "radial-gradient(1000px 520px at 50% -200px, rgba(240, 167, 179, 0.1), transparent 62%)",
                ornament: bambooFrame("#4f6b3a", "#a79f73"),
            },
        },
    },
    // The Southern parlor in daylight: magnolia-blush walls, walnut ink, a
    // gilt hairline where an engraver would put one. Baskervville's
    // transitional display with its italic for the last line, Mulish for
    // the reading copy, square-ish corners, no wash beyond window light.
    // Built for a concierge practice, a private bank, an inn — quiet
    // luxury that isn't green. Dark is the same parlor by lamplight.
    parlor: {
        nativeMode: "light",
        fonts: { display: BASKERVVILLE, body: MULISH },
        display: {
            weight: "400",
            tracking: "-0.006em",
            accentStyle: "italic",
            transform: "none",
            scale: "1.06",
        },
        shape: {
            radiusCard: "2px",
            radiusControl: "2px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "700ms" },
        treatment: ["gilt", "hairline"],
        maxWidth: "1180px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f7ede7",
                    surface: "#fcf6f2",
                    line: "#e4cfc3",
                    text: "#3a261c",
                    subtle: "#735646",
                    accent: "#7b4a2d",
                },
                spot: ["#b08a4f", "#ecd4cf"],
                shadowCard: "0 1px 0 rgba(58, 38, 28, 0.05), 0 22px 40px -30px rgba(92, 56, 36, 0.42)",
                shadowCta: (accent) => `0 12px 24px -16px color-mix(in srgb, ${accent} 75%, transparent)`,
                // Window light from the upper right, a petal warmth pooled
                // at the lower left; no grain — the walls are painted plaster.
                backgroundPage: () =>
                    "radial-gradient(1200px 720px at 88% -160px, rgba(255, 250, 246, 0.95), transparent 62%), " +
                    "radial-gradient(1100px 820px at -4% 104%, rgba(233, 196, 188, 0.32), transparent 64%)",
                ornament: magnoliaOrnament("#9b7650"),
            },
            dark: {
                palette: {
                    pageBg: "#22160f",
                    surface: "#2d1e16",
                    line: "#4b3427",
                    text: "#f6e9e0",
                    subtle: "#cbb0a0",
                    accent: "#e2b99b",
                },
                spot: ["#cfa968", "#5b3b33"],
                shadowCard: "0 24px 40px -26px rgba(0, 0, 0, 0.7)",
                shadowCta: (accent) => `0 12px 24px -16px color-mix(in srgb, ${accent} 55%, transparent)`,
                backgroundPage: () =>
                    "radial-gradient(1000px 620px at 84% -140px, rgba(226, 185, 155, 0.12), transparent 62%)",
                ornament: magnoliaOrnament("#cfa968"),
            },
        },
    },
    // The Front Range in daylight: oat paper, pine ink, graphite for the
    // pencil maps, aspen gold and sage as the two spot inks, used small.
    // Young Serif's rounded book-face at a modest size over Literata's
    // text serif; soft corners, the page set left like a field journal.
    // Built for a walk-and-talk therapist, an outfitter, a nature school —
    // outdoors without the gear catalog. Dark is the trail after sundown.
    trailhead: {
        nativeMode: "light",
        fonts: { display: YOUNG_SERIF, body: LITERATA },
        display: {
            weight: "400",
            tracking: "-0.012em",
            accentStyle: "none",
            transform: "none",
            scale: "1",
        },
        shape: {
            radiusCard: "10px",
            radiusControl: "8px",
            borderWidth: "1px",
        },
        motion: { idiom: "drift", rise: "620ms" },
        treatment: ["fieldbook", "hairline"],
        maxWidth: "1160px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f1ebdd",
                    surface: "#f8f4ea",
                    line: "#ddd3bf",
                    text: "#1f2b24",
                    subtle: "#5b6358",
                    accent: "#2f4a3a",
                },
                spot: ["#c99a45", "#8a9a7e"],
                shadowCard: "0 1px 0 rgba(31, 43, 36, 0.05), 0 18px 34px -28px rgba(31, 43, 36, 0.45)",
                shadowCta: (accent) => `0 10px 22px -14px color-mix(in srgb, ${accent} 70%, transparent)`,
                // Late sun from the upper left over oat paper; no grain —
                // the pencil maps carry the texture.
                backgroundPage: () =>
                    "radial-gradient(1100px 680px at 6% -120px, rgba(255, 246, 222, 0.8), transparent 60%), " +
                    "radial-gradient(900px 700px at 100% 108%, rgba(138, 154, 126, 0.16), transparent 62%)",
                ornament: trailMapsOrnament("#6f6a5c"),
            },
            dark: {
                palette: {
                    pageBg: "#151d18",
                    surface: "#1c2620",
                    line: "#314036",
                    text: "#ede6d6",
                    subtle: "#b3b9a8",
                    accent: "#a9c2a3",
                },
                spot: ["#d9b36e", "#6d7f6a"],
                shadowCard: "0 22px 38px -26px rgba(0, 0, 0, 0.7)",
                shadowCta: (accent) => `0 10px 22px -14px color-mix(in srgb, ${accent} 45%, transparent)`,
                backgroundPage: () =>
                    "radial-gradient(1000px 620px at 8% -120px, rgba(217, 179, 110, 0.1), transparent 60%)",
                ornament: trailMapsOrnament("#a8a390"),
            },
        },
    },
    hearth: {
        nativeMode: "light",
        fonts: { display: GLOOCK_HEARTH, body: FIGTREE },
        display: {
            weight: "400",
            tracking: "-0.01em",
            accentStyle: "none",
            transform: "none",
            scale: "1",
        },
        shape: {
            radiusCard: "14px",
            radiusControl: "999px",
            borderWidth: "1px",
        },
        motion: { idiom: "drift", rise: "560ms" },
        treatment: ["weave"],
        maxWidth: "1200px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f7f1e6",
                    surface: "#fffaf2",
                    line: "#e6d7c2",
                    text: "#2e1a26",
                    subtle: "#6b5662",
                    accent: "#5b2a45",
                },
                spot: ["#c65d3a", "#d4a017"],
                shadowCard: "0 1px 0 rgba(46, 26, 38, 0.05), 0 22px 40px -30px rgba(46, 26, 38, 0.5)",
                shadowCta: (accent) => `0 12px 24px -14px color-mix(in srgb, ${accent} 70%, transparent)`,
                // Lamplight from the upper right over warm cream.
                backgroundPage: () =>
                    "radial-gradient(1000px 640px at 96% -140px, rgba(212, 160, 23, 0.1), transparent 60%), " +
                    "radial-gradient(900px 700px at 0% 110%, rgba(198, 93, 58, 0.08), transparent 62%)",
                ornament: wovenTileOrnament("#d4a017"),
            },
            dark: {
                palette: {
                    pageBg: "#1d1118",
                    surface: "#281820",
                    line: "#452f3a",
                    text: "#f6ecdf",
                    subtle: "#cdb8b2",
                    accent: "#e2b04a",
                },
                spot: ["#e07a55", "#d4a017"],
                shadowCard: "0 24px 40px -28px rgba(0, 0, 0, 0.75)",
                shadowCta: (accent) => `0 12px 24px -14px color-mix(in srgb, ${accent} 45%, transparent)`,
                backgroundPage: () =>
                    "radial-gradient(1000px 620px at 96% -140px, rgba(226, 176, 74, 0.1), transparent 60%)",
                ornament: wovenTileOrnament("#e2b04a"),
            },
        },
    },
    colophon: {
        nativeMode: "light",
        fonts: { display: SPECTRAL_COLOPHON, body: SPECTRAL_COLOPHON, script: SPECTRAL_SC },
        display: {
            weight: "400",
            tracking: "-0.012em",
            accentStyle: "italic",
            transform: "none",
            scale: "1",
        },
        shape: {
            radiusCard: "1px",
            radiusControl: "1px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "640ms" },
        treatment: ["marginalia"],
        maxWidth: "1160px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f5efe3",
                    surface: "#fbf8f1",
                    line: "#ddd2bf",
                    text: "#2b1f1b",
                    subtle: "#65574d",
                    accent: "#6e1f24",
                },
                spot: ["#8a6a3b", "#3e4a3c"],
                shadowCard: "0 1px 0 rgba(43, 31, 27, 0.04), 0 24px 44px -34px rgba(43, 31, 27, 0.5)",
                shadowCta: () => "none",
                // Window light across a reading room, falling from the top.
                backgroundPage: () =>
                    "radial-gradient(1100px 620px at 50% -180px, rgba(255, 252, 244, 0.7), transparent 62%)",
                ornament: printersStarOrnament("#6e1f24"),
            },
            dark: {
                palette: {
                    pageBg: "#1b1413",
                    surface: "#241a18",
                    line: "#3f302b",
                    text: "#f1e9dc",
                    subtle: "#c2b3a4",
                    accent: "#e6aaa0",
                },
                spot: ["#c9a06a", "#9fb197"],
                shadowCard: "0 24px 44px -30px rgba(0, 0, 0, 0.75)",
                shadowCta: () => "none",
                backgroundPage: () =>
                    "radial-gradient(1100px 620px at 50% -180px, rgba(230, 170, 160, 0.07), transparent 62%)",
                ornament: printersStarOrnament("#e6aaa0"),
            },
        },
    },
    boreal: {
        nativeMode: "light",
        fonts: { display: COMMISSIONER, body: COMMISSIONER },
        display: {
            weight: "300",
            tracking: "-0.025em",
            accentStyle: "none",
            transform: "none",
            scale: "1",
        },
        shape: {
            radiusCard: "6px",
            radiusControl: "4px",
            borderWidth: "1px",
        },
        motion: { idiom: "drift", rise: "720ms" },
        treatment: ["frost"],
        maxWidth: "1140px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f6f7f7",
                    surface: "#ffffff",
                    line: "#dfe4e7",
                    text: "#1e2a33",
                    subtle: "#5a6873",
                    accent: "#2f4454",
                },
                // Peach is the one warm note (the rail's last node, the
                // points between conditions); birch grey stays in reserve.
                spot: ["#ee9f7e", "#9aa8b2"],
                shadowCard: "0 1px 0 rgba(30, 42, 51, 0.03), 0 18px 36px -28px rgba(30, 42, 51, 0.32)",
                shadowCta: () => "none",
                // Low winter light from the upper left, cool across the page.
                backgroundPage: () =>
                    "radial-gradient(1200px 640px at 0% -160px, rgba(255, 255, 255, 0.9), transparent 62%)",
            },
            dark: {
                palette: {
                    pageBg: "#11171d",
                    surface: "#172029",
                    line: "#2a3641",
                    text: "#e8edf1",
                    subtle: "#a7b4be",
                    accent: "#b9cad8",
                },
                spot: ["#f2ae90", "#8795a0"],
                shadowCard: "0 20px 38px -28px rgba(0, 0, 0, 0.7)",
                shadowCta: () => "none",
                backgroundPage: () =>
                    "radial-gradient(1200px 640px at 0% -160px, rgba(185, 202, 216, 0.06), transparent 62%)",
            },
        },
    },
    terrazzo: {
        nativeMode: "light",
        fonts: { display: FIGTREE, body: PLUS_JAKARTA },
        display: {
            weight: "500",
            tracking: "-0.025em",
            accentStyle: "normal",
            transform: "none",
            scale: "1.04",
        },
        shape: {
            radiusCard: "14px",
            radiusControl: "10px",
            borderWidth: "1px",
        },
        motion: { idiom: "drift", rise: "520ms" },
        treatment: ["terrazzo"],
        maxWidth: "1200px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f6f3ee",
                    surface: "#ffffff",
                    line: "#e3dcd1",
                    text: "#1e2a32",
                    subtle: "#5b6870",
                    accent: "#c4633f",
                },
                spot: ["#3a7aa3", "#d7c4a8"],
                shadowCard: "0 1px 0 rgba(30, 42, 50, 0.04), 0 18px 40px -28px rgba(30, 42, 50, 0.28)",
                shadowCta: (accent) => `0 10px 24px -14px color-mix(in srgb, ${accent} 80%, transparent)`,
                backgroundPage: () =>
                    `${terrazzoChips(["#c4633f", "#3a7aa3", "#8b959b", "#cdb391", "#c4633f", "#8b959b"], 0.2)}, ` +
                    "linear-gradient(180deg, #f8f6f2 0%, #f3efe8 100%)",
            },
            dark: {
                palette: {
                    pageBg: "#121c23",
                    surface: "#19262f",
                    line: "#2b3a44",
                    text: "#f1ece4",
                    subtle: "#a6b1b8",
                    accent: "#d06b46",
                },
                spot: ["#7fb3d3", "#8c7b63"],
                shadowCard: "0 20px 44px -28px rgba(0, 0, 0, 0.7)",
                shadowCta: (accent) => `0 10px 24px -14px color-mix(in srgb, ${accent} 70%, transparent)`,
                backgroundPage: () =>
                    `${terrazzoChips(["#e07b56", "#7fb3d3", "#5d6a72", "#8c7b63"], 0.16)}, ` +
                    "linear-gradient(180deg, #131e25 0%, #10191f 100%)",
            },
        },
    },
    picturebook: {
        nativeMode: "light",
        fonts: { display: FRAUNCES_SOFT, body: NUNITO_TEXT },
        display: {
            weight: "500",
            tracking: "-0.012em",
            accentStyle: "italic",
            transform: "none",
            scale: "1.02",
        },
        shape: {
            radiusCard: "18px",
            radiusControl: "999px",
            borderWidth: "1px",
        },
        motion: { idiom: "drift", rise: "560ms" },
        treatment: ["picturebook"],
        maxWidth: "1200px",
        modes: {
            light: {
                palette: {
                    pageBg: "#fbf7ee",
                    surface: "#fffdf7",
                    line: "#e7dec9",
                    text: "#2d3a2b",
                    subtle: "#646b58",
                    accent: "#4f7a3a",
                },
                spot: ["#e3a52b", "#a9bf8e"],
                shadowCard: "0 1px 0 rgba(45, 58, 43, 0.05), 0 16px 34px -24px rgba(45, 58, 43, 0.35)",
                shadowCta: (accent) => `0 8px 20px -12px color-mix(in srgb, ${accent} 85%, transparent)`,
                backgroundPage: () =>
                    `${GRAIN}, ` +
                    "radial-gradient(1100px 600px at 12% -120px, rgba(227, 165, 43, 0.08), transparent 60%), " +
                    "linear-gradient(180deg, #fcf9f1 0%, #f9f4e8 100%)",
            },
            dark: {
                palette: {
                    pageBg: "#171e16",
                    surface: "#1f281d",
                    line: "#334030",
                    text: "#f3eedf",
                    subtle: "#b4b8a4",
                    accent: "#63904a",
                },
                spot: ["#e3a52b", "#7f9866"],
                shadowCard: "0 18px 40px -26px rgba(0, 0, 0, 0.7)",
                shadowCta: (accent) => `0 8px 20px -12px color-mix(in srgb, ${accent} 70%, transparent)`,
                backgroundPage: () => `${GRAIN}, linear-gradient(180deg, #182017 0%, #141a13 100%)`,
            },
        },
    },
    seaglass: {
        nativeMode: "light",
        fonts: { display: INSTRUMENT_SERIF, body: INSTRUMENT_SANS },
        display: {
            weight: "400",
            tracking: "-0.01em",
            accentStyle: "italic",
            transform: "none",
            scale: "1.1",
        },
        shape: {
            radiusCard: "20px",
            radiusControl: "999px",
            borderWidth: "1px",
        },
        motion: { idiom: "drift", rise: "600ms" },
        treatment: ["seaglass"],
        maxWidth: "1240px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f7f2ea",
                    surface: "#fcf9f4",
                    line: "#e2d9cb",
                    text: "#22312f",
                    subtle: "#5d6966",
                    accent: "#b35a3b",
                },
                spot: ["#cfdcd3", "#ecdfcb"],
                shadowCard: "0 1px 0 rgba(34, 49, 47, 0.04), 0 22px 44px -32px rgba(34, 49, 47, 0.32)",
                shadowCta: (accent) => `0 10px 24px -14px color-mix(in srgb, ${accent} 80%, transparent)`,
                backgroundPage: () =>
                    "radial-gradient(1200px 520px at 85% -160px, rgba(207, 220, 211, 0.55), transparent 65%), " +
                    "linear-gradient(180deg, #f8f4ed 0%, #f5efe5 100%)",
            },
            dark: {
                palette: {
                    pageBg: "#13201e",
                    surface: "#1a2926",
                    line: "#2d3e3a",
                    text: "#f2ece2",
                    subtle: "#a9b6b1",
                    accent: "#c0603d",
                },
                spot: ["#3f5a52", "#8a7a63"],
                shadowCard: "0 20px 44px -28px rgba(0, 0, 0, 0.7)",
                shadowCta: (accent) => `0 10px 24px -14px color-mix(in srgb, ${accent} 70%, transparent)`,
                backgroundPage: () =>
                    "radial-gradient(1200px 520px at 85% -160px, rgba(63, 90, 82, 0.35), transparent 65%), " +
                    "linear-gradient(180deg, #14221f 0%, #111c1a 100%)",
            },
        },
    },
    limone: {
        nativeMode: "light",
        fonts: { display: ITALIANA, body: TENOR_SANS },
        display: {
            weight: "400",
            tracking: "0.01em",
            accentStyle: "normal",
            transform: "none",
            scale: "1.08",
        },
        shape: {
            radiusCard: "0px",
            radiusControl: "0px",
            borderWidth: "1px",
        },
        motion: { idiom: "drift", rise: "700ms" },
        treatment: ["limone"],
        maxWidth: "1200px",
        modes: {
            light: {
                palette: {
                    pageBg: "#faf7f0",
                    surface: "#fffdf8",
                    line: "#e6dfcf",
                    text: "#1f1d19",
                    subtle: "#6d675c",
                    accent: "#4f5f31",
                },
                spot: ["#f1d35a", "#dfe5d2"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "linear-gradient(180deg, #fbf8f2 0%, #f8f4eb 100%)",
            },
            dark: {
                palette: {
                    pageBg: "#15140f",
                    surface: "#1d1b15",
                    line: "#35322a",
                    text: "#f3eee2",
                    subtle: "#b2aa96",
                    accent: "#6f8440",
                },
                spot: ["#c9a93a", "#3a4230"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "linear-gradient(180deg, #16150f 0%, #121109 100%)",
            },
        },
    },
    alpine: {
        nativeMode: "light",
        fonts: { display: ANYBODY_WIDE, body: ALBERT_SANS, script: DM_MONO },
        display: {
            weight: "800",
            tracking: "0.01em",
            accentStyle: "normal",
            transform: "none",
            scale: "1",
        },
        shape: {
            radiusCard: "0px",
            radiusControl: "0px",
            borderWidth: "1px",
        },
        motion: { idiom: "drift", rise: "600ms" },
        treatment: ["alpine"],
        maxWidth: "1240px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f3f5f6",
                    surface: "#ffffff",
                    line: "#d6dcdf",
                    text: "#1c2125",
                    subtle: "#5a646b",
                    accent: "#b01f68",
                },
                spot: ["#c9d3d8", "#f0d3e2"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "linear-gradient(180deg, #f5f7f8 0%, #eff2f3 100%)",
            },
            dark: {
                palette: {
                    pageBg: "#121518",
                    surface: "#191d21",
                    line: "#2d3439",
                    text: "#edf0f2",
                    subtle: "#a0aab1",
                    accent: "#d23f87",
                },
                spot: ["#3a454c", "#5a2140"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "linear-gradient(180deg, #13171a 0%, #0f1214 100%)",
            },
        },
    },
    milkglass: {
        nativeMode: "light",
        fonts: { display: SPECTRAL_MILKGLASS, body: WORK_SANS },
        display: {
            weight: "300",
            tracking: "0",
            accentStyle: "italic",
            transform: "none",
            scale: "1",
        },
        shape: {
            radiusCard: "6px",
            radiusControl: "4px",
            borderWidth: "1px",
        },
        motion: { idiom: "drift", rise: "800ms" },
        treatment: ["milkglass"],
        maxWidth: "1180px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f6f5f1",
                    surface: "#fdfcf9",
                    line: "#e2e3dc",
                    text: "#2a2e2a",
                    subtle: "#6b7069",
                    accent: "#6e8868",
                },
                spot: ["#dfe6db", "#efe9df"],
                shadowCard: "0 1px 2px rgba(42, 46, 42, 0.04), 0 10px 28px -18px rgba(42, 46, 42, 0.18)",
                shadowCta: () => "none",
                backgroundPage: () => "linear-gradient(180deg, #f7f6f2 0%, #f3f2ed 100%)",
            },
            dark: {
                palette: {
                    pageBg: "#151714",
                    surface: "#1c1f1b",
                    line: "#30352f",
                    text: "#eeefe9",
                    subtle: "#a9afa5",
                    accent: "#7a9574",
                },
                spot: ["#2c3529", "#39352d"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "linear-gradient(180deg, #161815 0%, #121411 100%)",
            },
        },
    },
    darkroom: {
        nativeMode: "dark",
        fonts: { display: CRIMSON_PRO_DARKROOM, body: CRIMSON_PRO_DARKROOM, script: CINZEL },
        display: {
            weight: "400",
            tracking: "0",
            accentStyle: "italic",
            transform: "none",
            scale: "1",
        },
        shape: {
            radiusCard: "0px",
            radiusControl: "0px",
            borderWidth: "1px",
        },
        motion: { idiom: "drift", rise: "900ms" },
        treatment: ["darkroom"],
        maxWidth: "1120px",
        modes: {
            light: {
                palette: {
                    pageBg: "#ecebe7",
                    surface: "#f6f5f2",
                    line: "#cfccc5",
                    text: "#1d1d1f",
                    subtle: "#5e5d59",
                    accent: "#3d3c39",
                },
                spot: ["#dcdad4", "#e6e2d8"],
                shadowCard: "0 1px 2px rgba(29, 29, 31, 0.06), 0 12px 30px -20px rgba(29, 29, 31, 0.3)",
                shadowCta: () => "none",
                backgroundPage: () => "linear-gradient(180deg, #edece8 0%, #e7e6e1 100%)",
            },
            dark: {
                palette: {
                    pageBg: "#1b1b1d",
                    surface: "#232326",
                    line: "#3b3b3f",
                    text: "#e9e7e2",
                    subtle: "#a5a39d",
                    accent: "#c8c4ba",
                },
                spot: ["#2b2b2e", "#34322d"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "linear-gradient(180deg, #1d1d1f 0%, #171719 100%)",
            },
        },
    },
    // The picnic blanket: buttercream ground, cocoa ink, Fraunces at its
    // softest set roman and large over Figtree, square frames, no shadow,
    // no wash. Built for the full-bleed stack (`framestack`): the ground IS
    // the band between the photographs, the surface a shade lighter is the
    // closing colophon. Dark is the same blanket at dusk.
    buttercream: {
        nativeMode: "light",
        fonts: { display: FRAUNCES_SOFT_BUTTERCREAM, body: FIGTREE_BUTTERCREAM },
        display: {
            weight: "400",
            tracking: "-0.015em",
            accentStyle: "italic",
            transform: "none",
            scale: "1.1",
        },
        shape: {
            radiusCard: "10px",
            radiusControl: "14px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "560ms" },
        treatment: ["framestack"],
        maxWidth: "1120px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f6eedb",
                    surface: "#faf4e7",
                    line: "#e4d5b7",
                    text: "#3d3026",
                    subtle: "#76665a",
                    accent: "#5b4636",
                },
                spot: ["#8ea6c1", "#d4806e"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
            dark: {
                palette: {
                    pageBg: "#231c16",
                    surface: "#2c241d",
                    line: "#3f3429",
                    text: "#f3e8d3",
                    subtle: "#bcab94",
                    accent: "#ead9b8",
                },
                spot: ["#9fb5cd", "#df9888"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
        },
    },
    // The harbor at dusk: deep navy ground, warm-white ink, Baskervville
    // for the headlines and the memory book over Caslon's text cut, hairline
    // rules, no shadow, no wash. Dark-native and built for the full-bleed
    // stack (`framestack`): the navy IS the band between the photographs.
    // Light is the same table set on a white linen cloth, navy ink.
    vineyard: {
        nativeMode: "dark",
        fonts: { display: BASKERVVILLE_VINEYARD, body: LIBRE_CASLON_TEXT },
        display: {
            weight: "400",
            tracking: "-0.01em",
            accentStyle: "italic",
            transform: "none",
            scale: "1.05",
        },
        shape: {
            radiusCard: "2px",
            radiusControl: "2px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "560ms" },
        treatment: ["framestack"],
        maxWidth: "1120px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f7f3ea",
                    surface: "#fbf8f1",
                    line: "#e0d9c9",
                    text: "#15233b",
                    subtle: "#596276",
                    accent: "#1a2b4a",
                },
                spot: ["#a8864a", "#5f7fa6"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
            dark: {
                palette: {
                    pageBg: "#0f1b2e",
                    surface: "#132238",
                    line: "#2b3a54",
                    text: "#f4ecdd",
                    subtle: "#b7bdc9",
                    accent: "#efe3c8",
                },
                spot: ["#c9a96b", "#8fa9c7"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
        },
    },
    // The birth house in the valley: adobe plaster ground, clay-brown ink,
    // olive as the accent, the fired-clay red as spot 1, Alegreya's
    // calligraphic roman over its humanist sans, soft corners, no shadow,
    // no wash. Built for the full-bleed stack with painted bands
    // (`framestack`, `tintbands`): olive stripes open and close the page,
    // clay under the frames. Dark is the same house after sundown.
    adobe: {
        nativeMode: "light",
        fonts: { display: ALEGREYA, body: ALEGREYA_SANS },
        display: {
            weight: "400",
            tracking: "-0.005em",
            accentStyle: "italic",
            transform: "none",
            scale: "1.05",
        },
        shape: {
            radiusCard: "6px",
            radiusControl: "6px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "560ms" },
        treatment: ["framestack", "tintbands"],
        maxWidth: "1120px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f3ebdf",
                    surface: "#f8f2e9",
                    line: "#e2d3bf",
                    text: "#3b2a20",
                    subtle: "#6f5d4f",
                    accent: "#565c3a",
                },
                spot: ["#a65d3c", "#d9c3a5"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
            dark: {
                palette: {
                    pageBg: "#211a15",
                    surface: "#2a211b",
                    line: "#3e3128",
                    text: "#f1e6d6",
                    subtle: "#bfae9b",
                    accent: "#b9bf93",
                },
                spot: ["#c7805e", "#5a4636"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
        },
    },
    // Morning fog over the city: white ground, plum ink, a dusty rose
    // accent, Instrument Serif's narrow display cut over Instrument Sans,
    // hairline rules, no shadow, no wash. Built for the full-bleed stack
    // over a pale photograph (`framestack`, `inkover`): the headline and
    // the floating nav in plum over the fog, the numbers in rose on white.
    // Dark is the same room at night.
    fogline: {
        nativeMode: "light",
        fonts: { display: INSTRUMENT_SERIF, body: INSTRUMENT_SANS },
        display: {
            weight: "400",
            tracking: "-0.01em",
            accentStyle: "italic",
            transform: "none",
            scale: "1.12",
        },
        shape: {
            radiusCard: "4px",
            radiusControl: "4px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "560ms" },
        treatment: ["framestack", "inkover"],
        maxWidth: "1120px",
        modes: {
            light: {
                palette: {
                    pageBg: "#fdfbfa",
                    surface: "#f9f3f2",
                    line: "#ecdfe1",
                    text: "#3b1f35",
                    subtle: "#6d5967",
                    accent: "#a8445f",
                },
                spot: ["#e9c4cd", "#5a2d4d"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
            dark: {
                palette: {
                    pageBg: "#1c1219",
                    surface: "#251820",
                    line: "#3a2733",
                    text: "#f6eaf0",
                    subtle: "#c4aebb",
                    accent: "#c9607c",
                },
                spot: ["#6b3a58", "#e9c4cd"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
        },
    },
    // Lime plaster in daylight: a bone ground, umber ink, a burnt-clay
    // accent, Castoro over Spectral — serif all the way down, set quietly,
    // square corners, hairlines, no shadow. Built for the full-bleed room
    // stack (`framestack`, `roomline`): each photograph at one size with its
    // room and finish written into the foot of the frame. Dark is the same
    // rooms by lamplight.
    limewash: {
        nativeMode: "light",
        fonts: { display: CASTORO, body: SPECTRAL },
        display: {
            weight: "400",
            tracking: "0",
            accentStyle: "italic",
            transform: "none",
            scale: "1",
        },
        shape: {
            radiusCard: "0px",
            radiusControl: "2px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "640ms" },
        treatment: ["framestack", "roomline"],
        maxWidth: "1180px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f5f0e8",
                    surface: "#eee7dc",
                    line: "#ddd3c4",
                    text: "#2e2922",
                    subtle: "#6b6257",
                    accent: "#8a5234",
                },
                spot: ["#c98a6b", "#98a58f"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
            dark: {
                palette: {
                    pageBg: "#1c1915",
                    surface: "#25211c",
                    line: "#3b352d",
                    text: "#f2ece2",
                    subtle: "#bdb3a5",
                    accent: "#b57652",
                },
                spot: ["#a8674a", "#7d8c76"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
        },
    },
    // Lisbon at the last light: limestone ivory, espresso ink, a bordeaux
    // accent, Noto Serif Display's high-contrast roman and italic set light
    // and large over Manrope — a fashion creator's printed diary, not a
    // feed. Square frames, hairlines, no shadow; apricot and azulejo blue
    // ride as the two quiet spot inks. Built for the diary stack
    // (`framestack`, `miradouro`): the hero and every diary frame one 4:3
    // photograph edge to edge, each captioned with its place, hour and
    // outfit. Dark is the river after sunset, the accent warmed to rose.
    miradouro: {
        nativeMode: "light",
        fonts: { display: NOTO_SERIF_DISPLAY, body: MANROPE },
        display: {
            weight: "300",
            tracking: "-0.015em",
            accentStyle: "italic",
            transform: "none",
            scale: "1.08",
        },
        shape: {
            radiusCard: "0px",
            radiusControl: "0px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "720ms" },
        treatment: ["framestack", "miradouro"],
        maxWidth: "1200px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f6f1e9",
                    surface: "#efe7db",
                    line: "#dfd4c3",
                    text: "#2a1f1a",
                    subtle: "#6f6157",
                    accent: "#7a2331",
                },
                spot: ["#e3a47c", "#3c5f86"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
            dark: {
                palette: {
                    pageBg: "#1b1718",
                    surface: "#241f20",
                    line: "#3a3233",
                    text: "#f3ece4",
                    subtle: "#bcaea3",
                    accent: "#d9848f",
                },
                spot: ["#c98b67", "#7f9cc0"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
        },
    },
    // South London on a bright afternoon: concrete off-white, near-black
    // ink, one Klein blue — Bricolage Grotesque condensed and heavy over
    // Geist, with Geist Mono for the labels, the credit and the kickers.
    // Square corners, hard rules, no shadow, no glow; the film edge's amber
    // is spot 1 (the grease pencil on the contact sheet). Built for the
    // roll home (`sprocket`): the name as the masthead across the photo,
    // the week's roll as a contact sheet, the fits as numbered plates.
    // Dark is the asphalt after the night bus, the blue lifted.
    sprocket: {
        nativeMode: "light",
        fonts: { display: BRICOLAGE_GROTESQUE, body: GEIST, script: GEIST_MONO },
        display: {
            weight: "800",
            tracking: "-0.01em",
            accentStyle: "normal",
            transform: "uppercase",
            scale: "1",
        },
        shape: {
            radiusCard: "0px",
            radiusControl: "0px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "480ms" },
        treatment: ["sprocket"],
        maxWidth: "1240px",
        modes: {
            light: {
                palette: {
                    pageBg: "#edece8",
                    surface: "#e2e1dc",
                    line: "#c4c2bb",
                    text: "#161616",
                    subtle: "#5b5a56",
                    accent: "#2335e0",
                },
                spot: ["#e8a33d", "#161616"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
            dark: {
                palette: {
                    pageBg: "#141414",
                    surface: "#1d1d1d",
                    line: "#3a3a38",
                    text: "#edece8",
                    subtle: "#a09f9a",
                    accent: "#7c89ff",
                },
                spot: ["#e8a33d", "#edece8"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
        },
    },
    // A ship's galley and a printer's proof: oyster-shell white, cast-iron
    // ink, one deep kelp green — Besley's Clarendon over IBM Plex Sans,
    // with Plex Mono as the kitchen ticket (kickers, years, labels). Brass
    // and oyster grey are the spots; square corners and hairline rules, no
    // shadow. Built for the photographic résumé (`galley`): the cook at
    // the pass full-bleed, the kitchens on a timeline, the work as press
    // clippings. Dark is the kitchen after close, the kelp lifted.
    galley: {
        nativeMode: "light",
        fonts: { display: BESLEY, body: PLEX_SANS, script: PLEX_MONO },
        display: {
            weight: "600",
            tracking: "-0.015em",
            accentStyle: "italic",
            transform: "none",
            scale: "1",
        },
        shape: {
            radiusCard: "0px",
            radiusControl: "0px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "520ms" },
        treatment: ["galley"],
        maxWidth: "1200px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f4f1ea",
                    surface: "#ebe6db",
                    line: "#d6cfc0",
                    text: "#1e1d1b",
                    subtle: "#5f5a51",
                    accent: "#2f5241",
                },
                spot: ["#b08a4e", "#9a958a"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
            dark: {
                palette: {
                    pageBg: "#151714",
                    surface: "#1d201c",
                    line: "#363a34",
                    text: "#f1ede4",
                    subtle: "#a8a397",
                    accent: "#8fb8a0",
                },
                spot: ["#c9a468", "#8a867c"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
        },
    },
    // Marine light on the Salish Sea: a fog-pale ground, a spruce-black ink,
    // a deep sound-green accent, weathered cedar and bay-grey spots —
    // Noto Serif Display's light cut over Be Vietnam Pro, square corners,
    // hairlines, no shadow. Built for the waterfront plates (`framestack`,
    // `soundings`): the houses at one size edge to edge, each with its
    // address and particulars written into the foot of the photograph.
    // Dark is the same water after the ferry lights come on.
    baylight: {
        nativeMode: "light",
        fonts: { display: NOTO_SERIF_DISPLAY_BAYLIGHT, body: BE_VIETNAM_PRO },
        display: {
            weight: "300",
            tracking: "-0.01em",
            accentStyle: "italic",
            transform: "none",
            scale: "1",
        },
        shape: {
            radiusCard: "0px",
            radiusControl: "0px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "720ms" },
        treatment: ["framestack", "soundings"],
        maxWidth: "1240px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f0efea",
                    surface: "#e7e6e0",
                    line: "#d3d4ce",
                    text: "#1c2220",
                    subtle: "#5b6461",
                    accent: "#2e4a46",
                },
                spot: ["#9b7654", "#8da1a4"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
            dark: {
                palette: {
                    pageBg: "#121715",
                    surface: "#1a201e",
                    line: "#2c3431",
                    text: "#ecebe5",
                    subtle: "#a9b1ad",
                    accent: "#a6c8bf",
                },
                spot: ["#b8926c", "#6f8487"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
        },
    },
    // Manhattan's bedrock under a drafting lamp: gallery white, a true
    // near-black ink that is also the accent (the asks are ink, not
    // colour), graphite and hairline greys, and ONE signal vermilion kept
    // for the plate numerals and the index rule — Geist's light cut for
    // the display over its regular for the text, Geist Mono (the `script`
    // voice) for every label, square corners, no shadow. Built for the
    // monograph (`framestack`, `monograph`): the built work as numbered
    // plates at one size, one project told as a feature, the index of
    // works ruled like the back of the book. Dark is the drafting room
    // after hours.
    schist: {
        nativeMode: "light",
        fonts: { display: GEIST_SCHIST, body: GEIST_SCHIST, script: GEIST_MONO_SCHIST },
        display: {
            weight: "300",
            tracking: "-0.035em",
            accentStyle: "normal",
            transform: "none",
            scale: "1",
        },
        shape: {
            radiusCard: "0px",
            radiusControl: "0px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "600ms" },
        treatment: ["framestack", "monograph"],
        maxWidth: "1280px",
        modes: {
            light: {
                palette: {
                    pageBg: "#f6f6f3",
                    surface: "#eeeeea",
                    line: "#dadad5",
                    text: "#121212",
                    subtle: "#6c6c68",
                    accent: "#1a1a1a",
                },
                spot: ["#d2401d", "#8c8c86"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
            dark: {
                palette: {
                    pageBg: "#111111",
                    surface: "#191918",
                    line: "#2e2e2c",
                    text: "#ededea",
                    subtle: "#9a9a95",
                    accent: "#ededea",
                },
                spot: ["#ef5a36", "#77776f"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
        },
    },
    // The galley proof: bone proof paper, carbon ink, graphite and a
    // hairline the colour of a blue-pencil erasure, and ONE proof-red for
    // the mark — the accent is the proofreader's pencil, used on a full
    // stop, a link, a submit. Redaction 35 (a roman whose edges step at
    // display size like a third-generation photocopy) over Martian Mono
    // for every fact, square corners, no shadow, no motion. Built for the
    // one-line page (`proofmark`): the line at poster scale on the first
    // screen, the portfolio as a comma-run of names, one closing line.
    // Dark is the same proof under a desk lamp at night: carbon ground,
    // bone ink, a hotter red.
    galleyproof: {
        nativeMode: "light",
        fonts: { display: REDACTION_35, body: MARTIAN_MONO, script: MARTIAN_MONO },
        display: {
            weight: "400",
            tracking: "-0.025em",
            accentStyle: "normal",
            transform: "none",
            scale: "1",
        },
        shape: {
            radiusCard: "0px",
            radiusControl: "0px",
            borderWidth: "1px",
        },
        motion: { idiom: "still", rise: "600ms" },
        treatment: ["proofmark"],
        maxWidth: "1360px",
        modes: {
            light: {
                palette: {
                    pageBg: "#efece4",
                    surface: "#e7e3d9",
                    line: "#d6d2c7",
                    text: "#0c0c0c",
                    subtle: "#5f5d57",
                    accent: "#a82a15",
                },
                spot: ["#a82a15", "#8a877f"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
            dark: {
                palette: {
                    pageBg: "#0c0c0b",
                    surface: "#161614",
                    line: "#2b2a27",
                    text: "#efece4",
                    subtle: "#9a978f",
                    accent: "#ff6a4d",
                },
                spot: ["#ff6a4d", "#6f6c65"],
                shadowCard: "none",
                shadowCta: () => "none",
                backgroundPage: () => "none",
            },
        },
    },
}

/** The variables of a preset that depend on the customer's brand or font —
 * everything a live repobot.theme.json edit can change on a marketing page. */
export interface PresetOverlay {
    accent: string
    accentSoft: string
    onAccent: string
    inkOnAccent: string
    inkOnSpot: string
    fontDisplay: string
    fontBody: string
    shadowCta: string
    backgroundPage: string
}

/**
 * The customer overlay, resolved (packs/README.md order: customer brand >
 * preset palette) for one appearance of a preset. `brand`/`font` are the
 * pack-overlay shapes from themeConfig (`packBrand` / `packFont`, or their
 * pure `resolvePack*` twins) — null means "keep the preset's own art
 * direction". `mode` is the RESOLVED appearance (the theme contract's mode
 * with "system" already settled), never the preset's native lean: the Feel
 * appearance toggle always wins.
 */
/**
 * A hueless accent (equal RGB channels — the monochrome registers' ink-on-
 * ground move) has no soft tint to give: mixing white into black just
 * manufactures gray, and a gray band on an ink-and-paper page reads as a
 * smudge, not a wash. Monochrome registers collapse accentSoft to the page
 * ground and let hairlines and type carry the structure.
 */
function achromatic(hex: string): boolean {
    const channels = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim())
    return channels !== null && channels[1] === channels[2] && channels[2] === channels[3]
}

/**
 * Registers ink their plates with page colors (the page ink on an accent
 * CTA, a deep-accent ink on a spot-1 sign), which only reads for the
 * palette they were drawn with: remixed onto another brand, a pale accent
 * under pale ink vanishes. The ink tokens keep the authored ink wherever it
 * clears body-text contrast and fall back to the plate's own readable ink
 * where it does not.
 */
const PLATE_INK_CONTRAST = 4.5
const HEX_COLOR = /^#[0-9a-f]{6}$/i

function contrastRatio(a: string, b: string): number {
    const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x)
    return (light + 0.05) / (dark + 0.05)
}

function plateInk(plate: string, authored: string, authoredCss: string): string {
    if (!HEX_COLOR.test(plate) || !HEX_COLOR.test(authored)) return authoredCss
    if (contrastRatio(authored, plate) >= PLATE_INK_CONTRAST) return authoredCss
    const dark = contrastText("#ffffff")
    return contrastRatio(dark, plate) >= contrastRatio("#ffffff", plate) ? dark : "#ffffff"
}

/**
 * contrastText only turns dark above 0.45 luminance, so a bright mid-tone
 * accent (a gold or amber brand in a dark appearance) gets a white label
 * under 3:1. The default label keeps contrastText wherever it reaches the
 * legibility floor, so every label that reads today is unchanged, and
 * takes the plate's readable ink only below it.
 */
const LABEL_FLOOR_CONTRAST = 3

function defaultLabelInk(accent: string): string {
    const ink = contrastText(accent)
    if (!HEX_COLOR.test(accent) || contrastRatio(ink, accent) >= LABEL_FLOOR_CONTRAST) return ink
    return plateInk(accent, ink, ink)
}

export function resolvePresetOverlay(
    definition: PresetDefinition,
    mode: MarketingMode,
    brand: { accent: string; accentDark: string } | null,
    font: string | null,
): PresetOverlay {
    const variant = definition.modes[mode]
    const dark = mode === "dark"
    const accent = (dark ? brand?.accentDark : brand?.accent) ?? variant.palette.accent
    const spot1 = variant.spot?.[0] ?? accent
    return {
        accent,
        accentSoft: achromatic(accent)
            ? variant.palette.pageBg
            : mixHex(accent, variant.palette.pageBg, dark ? 0.78 : 0.86),
        onAccent:
            variant.palette.onAccent === undefined
                ? defaultLabelInk(accent)
                : plateInk(accent, variant.palette.onAccent, variant.palette.onAccent),
        inkOnAccent: plateInk(accent, variant.palette.text, "var(--marketing-color-text)"),
        inkOnSpot: plateInk(
            spot1,
            mixHex(accent, "#000000", 0.28),
            "color-mix(in srgb, var(--marketing-color-accent) 72%, black)",
        ),
        fontDisplay: font ?? definition.fonts.display,
        fontBody: font ?? definition.fonts.body,
        shadowCta: variant.shadowCta(accent),
        backgroundPage: variant.backgroundPage(accent),
    }
}
