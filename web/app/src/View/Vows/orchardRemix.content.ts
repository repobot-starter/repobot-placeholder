/**
 * The orchard remix seed: a complete, drop-in replacement for `./content.ts`
 * that retargets the vows pack from Amelia & Jonah's Rhinebeck garden
 * wedding to Nora & Ben's October weekend in a Hudson Valley orchard. The
 * derived template `repobot-vows-orchard` is composed from the vows pack
 * with this file copied over `content.ts`, its catalog's brand, and the
 * `harvest` register (forest-green stock, ivory ink, a light Newsreader).
 * `home.layout: "stack"` sets the names over one full-bleed photograph,
 * then a stack of photographs (`home.stack`), each on a green caption band
 * carrying one line of the story or the weekend, and one closing line
 * (`home.closing`) with the RSVP link; every other page, the RSVP card
 * included, is the base's.
 *
 * Because the copy is verbatim, this file must stay a structural twin of
 * `content.ts`: same exports, same relative imports, images under its own
 * `/vows-orchard/` public directory. The parity test
 * (`tests/View/Vows/remixSeeds.test.ts`) pins the export surface against
 * the real module, so the seed fails CI the moment the pack's contract
 * moves without it.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/vows-orchard` (see PACK.md). Never point a slot at a raw
 * camera file.
 */

import type { MarketingLeadFormField } from "@ui"

export interface SiteImage {
    src: string
    alt: string
    width: number
    height: number
    srcSet: { src: string; width: number }[]
}

/** The width ladder `npm run image -- responsive` emits by default. */
const LADDER = [640, 1024, 1600, 2400]

/** A responsive-verb image entry from its name and intrinsic size. */
function photo(name: string, width: number, height: number, alt: string): SiteImage {
    const widths = [...new Set(LADDER.map((step) => Math.min(step, width)))]
    return {
        src: `/vows-orchard/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/vows-orchard/${name}-${step}w.webp`, width: step })),
    }
}

export const couple = {
    /** The site's masthead: how the couple signs the invitation. */
    names: "Nora & Ben",
    partnerA: "Nora Mensah",
    partnerB: "Ben Hollander",
    /** ISO date the clock engine counts toward. */
    weddingDateIso: "2027-10-09",
    /** The date as the invitation says it. */
    weddingDateLabel: "Saturday, October 9, 2027",
    /** Where — the short line under the names. */
    venueShort: "Wick Hill Orchard · Hudson Valley, New York",
    /** Reaching the couple (questions the FAQ doesn't answer). */
    email: "nora.and.ben@example.com",
    hashtag: "#NoraAndBenPickedEachOther",
}

/** A piece on the hero's photo wall: a booth strip (`frames`) or one snapshot. */
export interface WallPiece {
    frames?: SiteImage[]
    image?: SiteImage
    /** A label taped over the piece. */
    sticker?: string
}

/** The site's composition — see the header. */
export type HomeLayout = "classic" | "zine" | "story" | "stack" | "letter"

/** One frame of the `stack` home: the photograph and the line on its band. */
export interface StackFrame {
    image: SiteImage
    caption: string
}

export const home: {
    layout: HomeLayout
    headline: string
    subheadline: string
    /** Optional on the `letter` home, which sets no photograph. */
    heroImage?: SiteImage
    /** The photo wall beside the zine's headline, top left to bottom right. */
    wall: WallPiece[]
    /** The zine's particulars strip under the hero, cell by cell. */
    details: string[]
    /** The hero's jump to the weekend. */
    detailsLink: string
    /** The welcome note under the classic hero — the couple's voice, not a form letter. */
    welcomeTitle: string
    welcomeBody: string
    /** The `story` and `letter` homes' weekend, one line a day ("Friday — Welcome dinner at the lodge"). */
    weekend: string[]
    /** The `stack` home's frames, top to bottom — every one renders at the first frame's size. */
    stack: StackFrame[]
    /** The quiet homes' closing line above the RSVP link ("The lodge has held twenty rooms for us."). */
    closing: string
} = {
    layout: "stack",
    headline: "Nora & Ben",
    subheadline: "Hudson Valley · October 9, 2027",
    heroImage: photo(
        "hero-table",
        1600,
        900,
        "A long candlelit harvest table set between rows of apple trees at dusk, friends laughing and passing dishes down the benches",
    ),
    wall: [],
    details: [],
    detailsLink: "See the weekend",
    welcomeTitle: "Come pick apples with us.",
    welcomeBody:
        "Everything for the weekend lives here — the story, the schedule, where to stay, and the RSVP. Bring a sweater, boots that don't mind grass, and room for pie.",
    weekend: [
        "Friday — Cider and a bonfire in the barn yard",
        "Saturday — Ceremony in the orchard at four",
        "Sunday — Pancakes and goodbyes",
    ],
    stack: [
        {
            image: photo(
                "stack-hay",
                1600,
                900,
                "Nora and Ben sitting on hay bales at the edge of the orchard, laughing at each other in the late sun",
            ),
            caption: "How we met — two cups of cider at the same farm stand, October 2021",
        },
        {
            image: photo(
                "stack-barn",
                1600,
                900,
                "The red barn at dusk strung with lights, guests dancing on the grass out front",
            ),
            caption:
                "The weekend — Friday cider and bonfire · Saturday ceremony in the orchard at four · Sunday pancakes",
        },
    ],
    closing: "Rooms are held at the inn in Rhinebeck until August 1.",
}

export interface StoryChapter {
    /** The year on the zine's timeline rail ("" keeps the chapter titles bare). */
    year: string
    title: string
    body: string
    /** Optional: a chapter without one renders its words alone. */
    image?: SiteImage
}

/** A snapshot with its caption ("" for none). */
export interface Snapshot {
    image: SiteImage
    caption: string
}

/** One uncut photo-booth strip: four frames, a taped label, a caption. */
export interface BoothStrip {
    label: string
    caption: string
    frames: SiteImage[]
}

// Typed by annotation (not `satisfies` on the arrays): the workspace
// content service edits collection slots by walking this module's AST, and
// a `satisfies` expression between a slot path and its array literal makes
// the collection read-only in the Content panel.
export const story: {
    headline: string
    intro: string
    chapters: StoryChapter[]
    stripsTitle: string
    strips: BoothStrip[]
    galleryTitle: string
    gallery: Snapshot[]
} = {
    headline: "Two cups of cider, then everything.",
    intro: "Six Octobers, one farm stand, and an orchard we keep driving back to — the short version, in three chapters.",
    chapters: [
        {
            year: "",
            title: "The farm stand, 2021",
            body: "Nora was pouring cider at her aunt's stand on Route 9; Ben came back for a second cup, then a third, then asked what time she got off. We walked the orchard rows until it was too dark to see the trees.",
            image: photo(
                "story-cider",
                1600,
                900,
                "Nora laughing as she pours hot cider from a steel jug into Ben's cup at a crowded autumn farm stand",
            ),
        },
        {
            year: "",
            title: "The ladder, 2025",
            body: "Ben asked in the orchard, halfway through picking, with Nora up a ladder and a bag of Macouns on her hip. She came down so fast she dropped the whole bag.",
            image: photo(
                "story-ladder",
                1600,
                900,
                "Ben down on one knee in the grass while Nora, up an orchard ladder with a picking bag, covers her mouth laughing",
            ),
        },
        {
            year: "",
            title: "Why the orchard",
            body: "Every fall since, we've spent a weekend here baking badly and walking the rows. It's where we're gathering the people we love most — to eat, dance in the barn, and celebrate with us.",
            image: photo(
                "story-pie",
                1600,
                900,
                "Ben holding up a lopsided apple pie in a farmhouse kitchen while Nora laughs and dusts flour on his cheek, their dog watching",
            ),
        },
    ],
    stripsTitle: "",
    strips: [],
    galleryTitle: "Six Octobers in the valley",
    gallery: [
        {
            image: photo(
                "gallery-leaves",
                1024,
                1365,
                "Nora dumping an armful of orange leaves over Ben's head under a maple, both laughing",
            ),
            caption: "",
        },
        {
            image: photo(
                "gallery-bicycle",
                1600,
                900,
                "Ben pedaling a bicycle down a leafy lane with Nora standing on the back pegs, arms out",
            ),
            caption: "",
        },
        {
            image: photo(
                "gallery-bonfire",
                1024,
                1365,
                "Nora feeding Ben a toasted marshmallow by a bonfire at night, sparks rising behind them",
            ),
            caption: "",
        },
        {
            image: photo(
                "gallery-rain",
                1600,
                900,
                "Nora and Ben running between the orchard rows under one plaid blanket in the rain, laughing",
            ),
            caption: "",
        },
    ],
}

export interface WeekendEvent {
    /** "4:00 PM" — the schedule renders time and title together. */
    time: string
    title: string
    description: string
}

export interface WeekendDay {
    label: string
    events: WeekendEvent[]
}

export interface Venue {
    name: string
    /** What happens there: "Ceremony & reception", "Welcome drinks", … */
    role: string
    address: string
    description: string
    /** Optional: a venue without one renders its words alone. */
    image?: SiteImage
    /** The directions link — Google Maps resolves the address anywhere. */
    mapUrl: string
}

export const schedule: {
    headline: string
    intro: string
    days: WeekendDay[]
    venues: Venue[]
} = {
    headline: "Three days in the orchard.",
    intro: "Everything happens at Wick Hill or a short walk from it — once you're parked, you can leave the car where it is. Times are gentle estimates; the cider sets its own pace.",
    days: [
        {
            label: "Friday, October 8",
            events: [
                {
                    time: "7:00 PM",
                    title: "Cider and a bonfire",
                    description:
                        "Hot cider, doughnuts, and a fire in the barn yard. Come as you are — most of us will have just driven up the Taconic.",
                },
            ],
        },
        {
            label: "Saturday, October 9",
            events: [
                {
                    time: "4:00 PM",
                    title: "Ceremony in the orchard",
                    description:
                        "Under the arch at the end of the Macoun rows, a five-minute walk from the barn. Seats from 3:30; boots are welcome and heels will sink.",
                },
                {
                    time: "5:00 PM",
                    title: "Supper at the long table",
                    description:
                        "One table down the middle of the orchard, family style, with candles, blankets on the benches, and pie for dessert.",
                },
                {
                    time: "8:00 PM",
                    title: "Dancing in the barn",
                    description:
                        "A string band from Kingston, the doors rolled open, and heaters on the grass until the farm asks us, politely, to stop.",
                },
            ],
        },
        {
            label: "Sunday, October 10",
            events: [
                {
                    time: "9:30 AM",
                    title: "Pancakes and goodbyes",
                    description:
                        "Apple pancakes and very strong coffee in the barn until noon. Hugs, leftover pie, and a half-peck for the drive home.",
                },
            ],
        },
    ],
    venues: [
        {
            name: "Wick Hill Orchard",
            role: "Ceremony & supper",
            address: "Wick Hill Road, Red Hook, NY 12571",
            description:
                "Forty acres of old apple trees on a hill above the river, a grass aisle between the rows, and an arch Ben built out of fallen branches.",
            image: photo(
                "venue-orchard",
                1600,
                900,
                "A branch arch at the end of a grass aisle between apple trees, rows of wooden benches on either side",
            ),
            mapUrl: "https://maps.google.com/?q=Red+Hook+NY+12571",
        },
        {
            name: "The red barn",
            role: "Bonfire, dancing & pancakes",
            address: "At the top of the orchard lane",
            description:
                "A hundred-year-old barn at the top of the hill, strung with lights, with a dance floor inside and the bonfire ring out front.",
            mapUrl: "https://maps.google.com/?q=Red+Hook+NY+12571",
        },
    ],
}

export interface Hotel {
    name: string
    description: string
    /** "8 minutes from the estate" — the decision the guest is making. */
    distance: string
    /** The room-block magic word, when there is one. */
    blockNote?: string
    url: string
}

export const travel: {
    headline: string
    intro: string
    gettingThere: string[]
    hotels: Hotel[]
    thingsToDo: { title: string; body: string }[]
} = {
    headline: "Up the river in October.",
    intro: "The valley is two hours from the city and at its best the second week of October. The inn in Rhinebeck is holding rooms for us until August 1; two places nearby cover the overflow.",
    gettingThere: [
        "By train: Amtrak from Penn Station to Rhinecliff (about an hour and forty minutes, along the river the whole way). We'll run a shuttle from the station on Friday afternoon and Saturday at two.",
        "By car: take the Taconic north and cut over on Route 199. The orchard lane is gravel — go slowly, and park in the field by the barn.",
    ],
    hotels: [
        {
            name: "The Linden Inn",
            description:
                "A white clapboard inn on the main street in Rhinebeck, with a porch, a bar, and breakfast until ten.",
            distance: "15 minutes",
            blockNote: "Mention MENSAH-HOLLANDER for the block rate until August 1.",
            url: "https://example.com/linden-inn",
        },
        {
            name: "Stone Ridge Cottages",
            description:
                "A few cottages with kitchens and wood stoves on a farm up the road — good for friends traveling together.",
            distance: "8 minutes",
            blockNote: "Ask for the Mensah–Hollander cottages; they're holding five.",
            url: "https://example.com/stone-ridge",
        },
        {
            name: "The Riverside House",
            description:
                "A small hotel in Kingston for anyone who wants restaurants, a late bar, and a slower drive over on Saturday.",
            distance: "25 minutes",
            url: "https://example.com/riverside-house",
        },
    ],
    thingsToDo: [
        {
            title: "Pick your own",
            body: "The orchard's rows are open Saturday morning — grab a bag at the barn. Macouns first; they go quickly.",
        },
        {
            title: "The river walk",
            body: "An easy hour along the Hudson from the Rhinecliff station, with the mountains across the water turning orange.",
        },
        {
            title: "Doughnuts on Route 9",
            body: "Cider doughnuts, still warm, at the farm stand where we met. It opens at eight and the line is worth it.",
        },
    ],
}

export interface PartyMember {
    name: string
    role: string
    bio: string
}

export const party: {
    headline: string
    intro: string
    members: PartyMember[]
} = {
    headline: "The people standing up with us.",
    intro: "Between them they've supplied a decade of pep talks, one borrowed truck, and the group chat that planned most of this weekend.",
    members: [
        {
            name: "Ama Mensah",
            role: "Maid of honor",
            bio: "Nora's big sister, keeper of every embarrassing photo since 1996, and the only person allowed to edit the vows.",
        },
        {
            name: "Theo Park",
            role: "Best man",
            bio: "Ben's roommate from the first apartment in Brooklyn, and the one who drove him back to the farm stand for that third cup.",
        },
        {
            name: "Lucía Ferrer",
            role: "Bridesmaid",
            bio: "Nora's oldest friend from school, baker of the wedding pies, and the calmest person in any kitchen.",
        },
        {
            name: "Dev Raman",
            role: "Groomsman",
            bio: "Ben's bandmate, playlist keeper, and the designated driver of the station shuttle.",
        },
    ],
}

export interface RegistryLink {
    name: string
    description: string
    url: string
}

export const registry: {
    headline: string
    intro: string
    links: RegistryLink[]
} = {
    headline: "Your company is the present.",
    intro: "Truly — but for those who've asked, we've kept a small registry and a fund for the trip to Portugal we've been promising ourselves since that first October.",
    links: [
        {
            name: "The registry",
            description: "Kitchen things, a proper pie dish, and one very good cast-iron pan.",
            url: "https://example.com/registry/mensah-hollander",
        },
        {
            name: "The honeymoon fund",
            description: "Two weeks in Portugal, mostly eating.",
            url: "https://example.com/registry/mensah-hollander-honeymoon",
        },
    ],
}

export const rsvp = {
    headline: "Tell us you're coming.",
    body: "One reply per guest, please — names exactly as they appear on your invitation, so the long table has a seat with your name on it.",
    /** ISO reply-by date the clock engine counts toward; label as printed. */
    replyByIso: "2027-08-15",
    replyByLabel: "August 15, 2027",
    confirmation:
        "Got it — thank you! Your reply is in. If plans change, just send it again with the same name and we'll take the newest answer.",
    /** The guest-facing form; delivers through the managed forms pipeline. */
    fields: [
        { name: "name", label: "Your full name", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        {
            name: "attending",
            label: "Will you be there?",
            type: "select",
            required: true,
            options: ["Joyfully accepts", "Regretfully declines"],
        },
        {
            name: "guests",
            label: "Seats in your party",
            type: "select",
            required: true,
            options: ["1", "2", "3", "4"],
        },
        {
            name: "dinner",
            label: "Dinner preference",
            type: "select",
            options: ["Cider-braised pork", "Roast chicken with apples", "Squash and farro (vegetarian)"],
            placeholder: "Choose at your leisure",
        },
        {
            name: "song",
            label: "A song that gets you dancing",
            placeholder: "The band reads every one of these",
        },
        {
            name: "notes",
            label: "Allergies, kids' meals, anything else",
            type: "textarea",
            fullWidth: true,
        },
    ] satisfies MarketingLeadFormField[],
    faqs: [
        {
            question: "Can I bring a plus one?",
            answer: "If your invitation says “and guest”, absolutely — put both names in the reply. If it doesn't, it's a table-length thing, not a you thing: the long table seats eighty.",
        },
        {
            question: "What should I wear?",
            answer: "Autumn cocktail: jackets, sweaters, dresses with a layer, and shoes you can walk on grass in. It's cool once the sun goes down — bring a real coat.",
        },
        {
            question: "Are kids welcome?",
            answer: "Yes — the orchard is a very good place to be six. Put them in the reply so the kitchen knows, and there'll be a quiet corner in the barn once they fade.",
        },
        {
            question: "What if it rains?",
            answer: "The ceremony and supper move into the barn with the doors rolled open. It will still smell like apples.",
        },
        {
            question: "Can I take photos during the ceremony?",
            answer:
                "We're having an unplugged ceremony — twenty minutes of phones in pockets while the photographer works. From supper on, post everything, tagged " +
                couple.hashtag +
                ".",
        },
    ],
}

/**
 * Landing copy the couple owns: the few strings the landing modules render
 * that would read wrong for a different wedding. A remix seed retrades
 * these along with the rest of the content — everything else in the
 * landing modules is wedding-neutral on purpose.
 */
export const landingCopy = {
    /** The one ask, everywhere: the shell's nav CTA and every closing banner. */
    rsvpCtaLabel: "RSVP",
    /** The closing banner's title on every page. */
    finalCtaTitle: "We're saving you a seat at the long table.",
    /** The home page's schedule teaser heading. */
    scheduleHeading: "The weekend",
    /** The zine home's story heading. */
    storyHeading: "",
    /** The hotels heading (the travel page, and the zine home). */
    hotelsHeading: "Where to stay",
    /** The venue heading (the classic home, and the schedule page). */
    venuesHeading: "Where it all happens",
    /** The travel page's headings. */
    gettingThereTitle: "The river is the pretty way up.",
    thingsToDoTitle: "While you're in the valley",
    /** The RSVP form's title, and the questions' kicker and title (the zine home repeats them). */
    rsvpFormTitle: "The reply card",
    faqKicker: "Good questions",
    faqTitle: "Asked and answered",
    /** The nav label for the /party page. */
    partyNavLabel: "Wedding party",
}
