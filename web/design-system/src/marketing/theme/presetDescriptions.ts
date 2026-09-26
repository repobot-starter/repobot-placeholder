import type { MarketingPresetName, MarketingTreatmentFlag } from "./marketingPresets"

/**
 * One line of art direction per style preset and per treatment flag — the
 * vocabulary the setup architect, remix and the site agent choose from.
 * Exhaustive by type, so a new preset or flag cannot ship undescribed; the
 * design manifest, docs/landing-content.md and every pack's agent map are
 * generated from these records (scripts/lib/design-vocabulary.mjs parses
 * them: keep each value one plain double-quoted string).
 */
export const MARKETING_PRESET_DESCRIPTIONS: Record<MarketingPresetName, string> = {
    "dark-dev":
        "Developer launch page: near-black ground, one saturated accent, a three-bloom aurora under film grain.",
    "soft-saas": "Friendly light SaaS: white ground with an iridescent accent, cyan and pink aurora wash.",
    editorial: "Folio paper-and-ink: serif display, rules instead of cards.",
    brutalist:
        "The anti-median page: zero radius, hard ink borders, no shadows, uppercase display on stark paper.",
    "warm-boutique":
        "Menu and salon warmth: cream and terracotta, serif display, pill controls, soft big radius.",
    "mono-utility":
        "Spec-sheet minimalism: mono display, thin rules, the accent only on links, CTAs and numbers.",
    "aurora-dark":
        "Molten flagship: true-black ground, one violet-cyan-pink ribbon sweeping the hero, glass cards.",
    "luxe-light":
        "Polished fintech: near-white ground, tight deep ink, hairlines, crisp two-layer elevation.",
    atelier:
        "Gallery-quiet portfolio: near-white walls, light tracked small caps, hairlines, no wash; photographs carry the color.",
    heirloom:
        "Romantic wedding stationery: Fraunces with an italic accent word, ivory ground, champagne hairlines, botanical green.",
    tourbook:
        "Expedition field journal: black and white under grain, condensed uppercase masthead, kinetic photo strips.",
    monolith:
        "Severe monochrome: monumental type past the scale ceiling, stroke-only accent word, razor hairlines.",
    lanternlight:
        "Night celebration: true-black ground, white ink, Fraunces with an italic accent; photographs carry the color.",
    sitework:
        "Trades plan table: work paper ruled in a site grid, stenciled uppercase signage, one safety-orange accent.",
    brownstone:
        "Residential listing sheet: limestone paper, navy serif, one brick accent, mounted-photo cards.",
    marquee: "Stage night: true-black ground, white Fraunces caps set like a playbill, strictly monochrome.",
    ballroom:
        "Black tie: warm candlelit near-black, gold-foil accent, Fraunces past the scale ceiling, one slow spotlight.",
    picnic: "Backyard party: sunny cream paper, tomato-red accent, marigold and sky washes, name-tag pills.",
    chalk: "Training floor: black rubber and gym chalk, stenciled uppercase signage, strictly monochrome.",
    hymnal: "Midnight service: warm near-black under grain, monumental bone signage, hairlines, one candle-lit accent.",
    broadside:
        "Gig poster on the venue door: aged paper under a halftone screen, display caps past the ceiling.",
    crt: "Phosphor terminal: pure black, mono type, scanline raster under an accent glow the brand colors.",
    handheld: "Handheld LCD: light pea-green glass, olive ink, chunky mono caps, dithered pixel wash.",
    lounge: "Night lounge: neutral near-black, flat charcoal panels, pill shapes, one blooming accent.",
    retroware: "Bevel-chrome desktop: silver window chrome, zero radius, inset bevels instead of elevation.",
    tideline:
        "Coastal timber house: fog-slate ground, bone ink, thin monumental Fraunces over photographs that dissolve into mist.",
    memphis:
        "90s Miami pop: white ground, black ink, hot pink with aqua and lemon, italic Rubik Black, hard offset shadows, confetti gutters.",
    jacaranda:
        "LA sign-painter: cream board, jacaranda-purple ink, sign-red asks, painted letters with a sunset drop shade and a brush script.",
    tabloid:
        "City tabloid front page: newsprint, heavy condensed Anton caps, serif column type, black rules, one fire-engine red.",
    gameday:
        "Sportswear campaign on the outfield: striped turf ground, white condensed block caps leaning italic, slanted plate CTAs.",
    creature:
        "1950s drive-in one-sheet: midnight blue under grain, cream poster caps with a blood-orange extruded drop, acid-green spot.",
    riso: "Two-drum risograph botanical print: warm uncoated paper, sage ink, fluorescent orange, photographs re-separated into two inks.",
    paintchip:
        "Paint-chip deck: Swiss color-blocking, flat fields edge to edge, huge tight grotesk caps, coral accent.",
    schematic:
        "Techno flyer meets wiring diagram: near-black, electric cyan, sodium-orange spark, thin white circuit line art.",
    sunbelt:
        "Desert modernism: sand ground, burnt umber, hot orange and sun yellow, fat rounded 70s display, sunburst ornament.",
    crown: "Late-90s glossy cover: deep plum night, chrome display caps with a gold accent word, stacked cover lines.",
    vanity: "Beauty counter after hours: black lacquer, Bodoni Moda display, blush and cherry, tiny wide-tracked caps.",
    midcentury:
        "1950s furniture catalog: warm stock, walnut ink, mustard, burnt orange and olive, condensed caps, atomic starbursts.",
    photobooth:
        "Photo-booth zine: booth strips and flash snapshots taped to newsprint, felt-tip marker, typewriter details, hot pink and cobalt.",
    disco: "1970s disco supper club: black lacquer, red, hot pink and gold foil, Bodoni caps, a swash script, a mirror ball.",
    wayfinding:
        "1970s transit signage: forest-green sign panels, white ground, signal yellow, heavy grotesk caps, circular pictograms.",
    groove: "1970s soul LP sleeve: amber into burnt orange and cocoa, cream Cooper-style caps, a record-cover hero and tracklists.",
    inkblot:
        "Gallery poster: off-white museum wall, ultramarine ink, a huge centered high-contrast serif, wall-label cards.",
    bubblegum:
        "Y2K candy pop: bubblegum pink, mint and cherry, inflated glossy balloon caps, die-cut stickers, jelly buttons.",
    snapshot:
        "The fridge door: family prints taped up at a lean, felt-tip captions, condensed near-black caps with a tomato-red line.",
    rodeo: "Rodeo poster and ranch brand: wood-type Western caps, parchment, sunset orange, turquoise and sage, a rope frame.",
    vitrine:
        "Portrait sitter's wall: flat window-light stone, a small refined Garamond, museum-label caption bands under every frame.",
    seamless:
        "Headshot studio: white walls, a small clean grotesque, the only color the seamless paper behind each face.",
    liner: "Liner notes: a near-black sleeve (warm-white in light), a plain grotesque set small, a wall of square record covers.",
    seafog: "Sea fog: a grey-blue coastal morning, a light Cormorant with a small Jost, hairlines, the photographs carrying the coast.",
    harvest:
        "Orchard harvest: forest-green stock and ivory ink (ivory in light), a light Newsreader, green caption bands between the frames.",
    carton: "Faire-part: cornflower ink on warm paper, an enormous hairline Bodoni, a ruled column, no photograph needed.",
    daybook:
        "The wedding morning, documented: white stock, a light grotesk, script captions, dusty rose and sage, an hour-by-hour album.",
    jharokha:
        "The jewel box: emerald velvet, ivory-gold ink, a heavy Devanagari-born serif, arched event windows, gold filigree rules.",
    horizon:
        "The coastal masthead: white stock, graphite ink, a wide light Lexend in tracked caps, the photograph as a panorama.",
    shingle:
        "The engraved quarterly: ivory laid stock, navy ink, Caslon at display size over its text cut, a crowned crest and fleurons.",
    limestone:
        "The private atelier: warm limestone stock, umber ink, a taupe ask, a Didone over an old-style book face, arched portraits.",
    cognac: "The ritual room: espresso ground, cream ink, a cognac ask, walnut rules, a sharp display serif over a text serif with a true italic.",
    plantroom:
        "Estate plant room: graphite and copper, a condensed engineering sans with a monospace spec voice, tagged equipment cards.",
    stormline:
        "Storm dispatch desk: harbor navy and signal amber on white, a heavy grotesque, a live dispatch board and a frosted intake card.",
    plaster:
        "Garden journal: warm lime plaster, an old-style italic serif, olive green and lavender, ruled story cards and an engraved sprig.",
    basalt: "Moss garden in fog: basalt-dark ground, a light wide-spaced sans, one maple red, frames stepped like stones on a path.",
    whiteglove:
        "White-glove household: pure white, black geometric type, a sage kicker, hairline cards and square ink buttons.",
    palmbeach:
        "Palm Beach club: flamingo blush and palm green, spaced Caslon caps with an italic hero, gold rules, a bamboo frame.",
    parlor: "Southern parlor in daylight: magnolia blush and walnut, a Baskerville with an italic last line, gilt rules, arched portraits.",
    trailhead:
        "Front Range field journal: oat paper, pine ink, a rounded book serif, pencil trail maps, aspen gold used small.",
    hearth: "A lounge in the West End: warm cream, plum, sienna and ochre, a bold display serif, a woven textile edge.",
    colophon:
        "A university press: cream paper, oxblood ink, one book serif with its drawn small capitals, a printer's star.",
    boreal: "A Minnesota winter indoors: winter white and slate, a light humanist sans, one peach accent.",
    terrazzo:
        "Lakeside studio: white terrazzo flecked terracotta and lake blue, a quiet geometric sans, soft stone corners.",
    picturebook:
        "Storybook first visit: paper white, leaf green and marigold, a soft rounded serif, gouache pages, leaf-green pills.",
    seaglass:
        "Ocean-view practice: sea glass and sand, a narrow modern serif with a true italic, terracotta pills, arched photographs.",
    limone: "The Italian coast on film: chalk white and lemon, a hairline display face over a small-cap sans, square corners.",
    alpine: "The expedition field sheet: glacier white and granite, a wide heavy grotesque, mono legends, one magenta accent.",
    milkglass:
        "The daylight newborn studio: milk white and sage, a thin book serif over a light grotesque, soft photograph tiles.",
    darkroom:
        "The portrait studio after dark: charcoal and silver, a book serif with engraved capitals, matted museum prints.",
    buttercream:
        "Picnic blanket: buttercream ground, cocoa ink, a soft rounded Fraunces over Figtree, square frames, no shadow.",
    vineyard:
        "Harbor at dusk: deep navy ground, warm-white ink, Baskervville over Caslon's text cut, hairline rules, no shadow.",
    adobe: "Birth house in the valley: adobe plaster ground, clay ink, olive and fired-clay bands, Alegreya over Alegreya Sans, soft corners.",
    fogline:
        "Morning fog: white ground, plum ink, dusty rose accent, Instrument Serif over Instrument Sans, hairline rules, no shadow.",
    limewash:
        "Lime plaster in daylight: bone ground, umber ink, burnt-clay accent, Castoro over Spectral, square corners, no shadow.",
    miradouro:
        "Lisbon at the last light: limestone ivory, espresso ink, bordeaux accent, Noto Serif Display light and italic over Manrope.",
    sprocket:
        "South London on film: concrete off-white, near-black ink, Klein blue, Bricolage Grotesque condensed over Geist and Geist Mono.",
    galley: "A ship's galley in print: oyster white, cast-iron ink, kelp green, Besley's Clarendon over IBM Plex Sans and Plex Mono.",
    baylight:
        "Marine light: fog-pale ground, spruce ink, sound-green accent, Noto Serif Display Light over Be Vietnam Pro, square corners.",
    schist: "Drafting-room white: near-black ink as the accent, one vermilion for numerals, Geist Light over Geist with Geist Mono labels, square corners.",
    galleyproof:
        "The galley proof: bone paper, carbon ink, one proof-red mark, Redaction 35 over Martian Mono, square corners, no motion.",
}

export const MARKETING_TREATMENT_DESCRIPTIONS: Record<MarketingTreatmentFlag, string> = {
    grain: "Film grain as identity, not just banding control.",
    glow: "Accent light blooms behind CTAs and display moments.",
    outline: "Stroke-only display letterforms on the accent word.",
    hairline: "Razor-thin frames instead of shadow elevation.",
    tilt: "Scrapbook rotation on media clusters.",
    scanline: "The CRT raster as a fixed overlay of 1px rows in the register's ink.",
    pixel: "A dithered checker wash, the shading a four-shade LCD could do.",
    mist: "Full-bleed photographs dissolve into the page ground at their edges.",
    pop: "90s pop print: type and cards cut in ink with hard offset shadows, ink-tape kickers, a starburst badge.",
    confetti: "The register's sparse ornament tile drawn in the page gutters, never behind copy.",
    halftone: "Photographs print through a fine dot screen with the contrast pressed up.",
    sport: "Sportswear campaign: condensed caps leaning italic, accent-tape kickers, slanted CTA plates, a short hero.",
    pulp: "Creature-feature poster: extruded hand-lettered caps, billing tabs, a starburst badge, lobby-card media.",
    "two-ink":
        "Risograph: photographs re-separated into two spot inks off-register on spot-2 paper, a rubber-stamp caption.",
    colorblock:
        "Swiss color-blocking: flat fields edge to edge, flat chips with a hard ink offset, nothing rounded.",
    signpaint:
        "Sign-writer's hand: outlined painted letters with a spot-1 drop shade, brush-script accents, board CTAs.",
    linework: "The ornament as thin schematic line art over the photo hero; readouts as instrument strips.",
    sunburst:
        "A rising half-sun of rays behind a stacked-shadow readout, arched hero windows, hung price tags.",
    metallic:
        "Glossy 90s cover: chrome display with a gold accent word, masthead over cover lines, gold hairlines.",
    lacquer:
        "Beauty counter: high-contrast fashion serif, blush first line, lipstick accent word, framed shade cards.",
    atomic: "1950s catalog: off-page split photo beside a ruled copy panel, atomic ornament, numbered catalog strips.",
    zine: "Friendship zine: taped kicker labels, marker display with an accent swoosh, tilted white-bordered snapshots.",
    mirrorball:
        "Disco supper club: sparkle-star kickers, foil rules, script accent phrase, foil pills, a mirror-ball seal.",
    transit:
        "Transit wayfinding: the hero as an accent sign panel with a signal rule, route-bar kickers, pictogram icons.",
    sleeve: "Soul LP sleeve: square record-cover hero photo, a record-label seal, Side A / Side B tracklists.",
    "wall-label":
        "Gallery poster: unframed artworks multiplied into the wall, a centered museum title, wall-label cards.",
    candy: "Y2K candy: inflated glossy display with a candy drop, die-cut sticker asides, glossy pill cards, jelly CTAs.",
    taped: "Fridge door: taped white-bordered prints at a lean, felt-tip captions, a sticky-note seal, marker-red CTAs.",
    lariat: "Rodeo poster: a rope frame around the hero photo and banner, star-flanked kickers, a ribbon credit, ticket cards.",
    ruled: "Faire-part: enormous statement names, a tracked-caps line under them, the prose one flush column between ink hairlines.",
    keepsake:
        "Wedding album: a photographic timeline with large light times and script captions, a one-line rate, a heart rule, a pill ask.",
    filigree:
        "Jewel box: arched event panels over gold name plates, double gold frames on the package board and the ask, a lotus rule.",
    panorama:
        "Coastal masthead: the name set wide above a ruled line of places and a panorama, ruled kickers, a quiet ruled ask.",
    engraved:
        "Country-house quarterly: the crest over the hero's line, a centered engraved title, fleuron rules, small-caps figures, an outlined ask.",
    alcove: "Private atelier: arched portraits in a stone border, ranks ruled apart, a dotted line of filter words, a quiet centered ask.",
    ritual: "Ritual room: the steps as a numbered strip with their minutes, kickers between long rules, an italic testimonial, a still rates line.",
    gauge: "Plant-room spec sheet: monospace kickers between accent rules, specimens as tagged equipment cards with a service interval.",
    dispatch:
        "Dispatch board: day rows as a dark board of live rows with status dots, the form-first capture as a frosted intake card.",
    journal:
        "Garden journal: stories as ruled cards with the photo beside the text, italic datelines, an engraved sprig in the margin.",
    stillness:
        "Garden walk: sequence frames as wide strips stepped left and right, numbered in light caps, a small stamped seal.",
    concierge:
        "House manager's note: spot-1 tracked-caps kickers, the message thread on a quiet white card, square ink CTAs.",
    cabana: "Club calendar: a bamboo frame around the page, kickers between gold rules, spaced caps, month panels, notice cards.",
    gilt: "Southern parlor: kickers between gilt rules, a warm-graded photo hero, a framed-photo timeline, arched portraits.",
    fieldbook:
        "Trail journal: left-set pages, pencil-trail kickers, a pine-graded photo hero, field notes with a pencil map each.",
    weave: "Collective lounge: a woven textile edge, diamond kickers, a portrait roster with pill filters, forest and sienna bands.",
    marginalia:
        "Annotated edition: small-caps kickers under a printer's star, a sample report on paper with numbered margin notes, ruled columns.",
    frost: "Winter indoors: slate copy over a frost-washed photo hero, a quiet first-90-days track ending in peach, white cards.",
    terrazzo:
        "Lakeside studio: ruled second-ink kickers, soft-cornered before/after plates, a pictogram rail in one white panel.",
    picturebook:
        "Storybook: illustrated steps as numbered book pages under a leaf-sprig heading, a ruled fact strip, soft pills.",
    seaglass:
        "Ocean view: rule-flanked terracotta kickers, stage cards under arched photographs, round portrait medallions.",
    limone: "Italian coast: a wide-capital wordmark masthead, captioned full-bleed stacks, contact sheets on a chalk mat.",
    alpine: "Field sheet: a wide heavy wordmark, survey-slate stacks in mono, places as ruled spec cards, a magenta ask.",
    milkglass:
        "Daylight studio: thin spaced-capital name, a light serif, a session builder of photograph tiles and a serif total.",
    darkroom:
        "Print room: an engraved-capital name, prints matted on the charcoal wall with engraved plaques, a hairline ask.",
    framestack:
        "Full-bleed stack: hero and frames at one size, the nav floating over the photo, quiet hero copy, prose as short bands.",
    tintbands:
        "With framestack: the bands between the photos as painted plates — prose band and colophon in the accent, caption bands in spot 1.",
    inkover:
        "Full-bleed hero over a pale photo: copy (and a floating nav) in the page ink over a wash of the page ground, not white on a scrim.",
    roomline:
        "With framestack: captions inside the photos — the hero line and each overlay caption as one quiet serif line, the wordmark in caps.",
    miradouro:
        "With framestack: the creator's diary — italic serif captions and accent, text-link asks, uncarded plates, italic numerals and quote.",
    sprocket:
        "The film creator's page: a one-line condensed masthead name, mono labels, amber grease pencil, numbered plates, a solid blue band.",
    galley: "The chef's photographic résumé: ticket-mono kickers and years, a hairline timeline, press-clipping stories, a ruled four-up.",
    soundings:
        "With framestack: waterfront plates — an address and its particulars in each photo's foot, metrics as chart soundings.",
    monograph:
        "With framestack: the architect's monograph — hero copy on the paper under the plate, numbered plate labels, a ruled index of works.",
    proofmark:
        "The one-line page: a badged statement hero fills the first screen at poster scale, names as a comma-run, one closing line with an arrow.",
}
