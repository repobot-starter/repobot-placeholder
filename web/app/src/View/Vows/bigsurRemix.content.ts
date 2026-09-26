/**
 * The Big Sur remix seed: a complete, drop-in replacement for `./content.ts`
 * that retargets the vows pack from Amelia & Jonah's Rhinebeck garden
 * wedding to Maya & Eli's weekend on the Big Sur coast. The derived
 * template `repobot-vows-bigsur` is composed from the vows pack with this
 * file copied over `content.ts`, its catalog's ink brand, and the `seafog`
 * register (grey-blue coastal mist, a light Cormorant with a small Jost).
 * `home.layout: "story"` sets the names over one full-bleed photograph,
 * the story as stacked photo chapters, the weekend in three lines
 * (`home.weekend`), and one closing line (`home.closing`) with the RSVP
 * link; every other page, the RSVP card included, is the base's.
 *
 * Because the copy is verbatim, this file must stay a structural twin of
 * `content.ts`: same exports, same relative imports, images under its own
 * `/vows-bigsur/` public directory. The parity test
 * (`tests/View/Vows/remixSeeds.test.ts`) pins the export surface against
 * the real module, so the seed fails CI the moment the pack's contract
 * moves without it.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/vows-bigsur` (see PACK.md). Never point a slot at a raw
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
        src: `/vows-bigsur/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/vows-bigsur/${name}-${step}w.webp`, width: step })),
    }
}

export const couple = {
    /** The site's masthead: how the couple signs the invitation. */
    names: "Maya & Eli",
    partnerA: "Maya Sato",
    partnerB: "Eli Brennan",
    /** ISO date the clock engine counts toward. */
    weddingDateIso: "2027-06-12",
    /** The date as the invitation says it. */
    weddingDateLabel: "Saturday, June 12, 2027",
    /** Where — the short line under the names. */
    venueShort: "Cypress House Lodge · Big Sur, California",
    /** Reaching the couple (questions the FAQ doesn't answer). */
    email: "maya.and.eli@example.com",
    hashtag: "#MayaAndEliInTheFog",
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
    layout: "story",
    headline: "Maya & Eli",
    subheadline: "Big Sur · June 12, 2027",
    heroImage: photo(
        "hero-trail",
        1600,
        1152,
        "Maya pulling Eli by the hand along a foggy cliffside trail above the Pacific, both laughing, cypress trees behind",
    ),
    wall: [],
    details: [],
    detailsLink: "See the weekend",
    welcomeTitle: "Come down the coast with us.",
    welcomeBody:
        "Everything for the weekend lives here — the story, the schedule, where to stay, and the RSVP. Bring a sweater for the fog and shoes you can walk a trail in.",
    weekend: [
        "Friday — Welcome dinner at the lodge",
        "Saturday — Ceremony on the bluff at five",
        "Sunday — Coffee and goodbyes",
    ],
    stack: [],
    closing: "Stay: the lodge has held twenty rooms for us.",
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
    headline: "A ferry, then everything.",
    intro: "Eight years, one very slow ferry, and a coastline we keep coming back to — the short version, in three chapters.",
    chapters: [
        {
            year: "",
            title: "The ferry, 2019",
            body: "We met on a ferry in 2019, crossing from Seattle to Bainbridge Island in the rain. What began as a quiet conversation about the weather turned into a life we never wanted to untangle.",
            image: photo(
                "story-ferry",
                1600,
                900,
                "Maya and Eli in rain jackets laughing at the railing of a ferry deck, a misty island behind them",
            ),
        },
        {
            year: "",
            title: "The bluff, 2025",
            body: "Eli asked on a bluff above the water on our fourth trip down Highway 1, in fog so thick we could hear the ocean and not see it. He picked Maya up before she'd finished saying yes.",
            image: photo(
                "story-bluff",
                1600,
                900,
                "Eli lifting Maya off the ground and spinning her on a grassy bluff in the fog, both laughing with their eyes shut",
            ),
        },
        {
            year: "",
            title: "Why Big Sur",
            body: "Big Sur is where we learned to slow down — no signal, long walks, the lighthouse on the point. It's where we're gathering the people we love most to celebrate with us.",
            image: photo(
                "story-lighthouse",
                1600,
                900,
                "Maya and Eli sitting on a stone wall pointing out at the water, a white lighthouse on the headland behind them in the fog",
            ),
        },
    ],
    stripsTitle: "",
    strips: [],
    galleryTitle: "A foggy weekend on the coast",
    gallery: [
        {
            image: photo(
                "gallery-beach",
                1024,
                1365,
                "Maya riding piggyback on Eli on a foggy beach, both laughing, driftwood and sea stacks behind",
            ),
            caption: "",
        },
        {
            image: photo(
                "gallery-surf",
                1600,
                900,
                "Maya kicking a spray of seawater at Eli in the shallow surf, both laughing, sea stacks in the fog",
            ),
            caption: "",
        },
        {
            image: photo(
                "gallery-fire",
                1024,
                1365,
                "Maya and Eli wrapped in one plaid blanket by a fire pit at night, she laughing with a mug in her hand",
            ),
            caption: "",
        },
        {
            image: photo(
                "gallery-kitchen",
                1600,
                900,
                "Eli dancing Maya around a redwood cabin kitchen on a foggy morning, a coffee pot in her hand",
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
    headline: "Three days on the coast.",
    intro: "Everything happens at the lodge or a short walk from it — once you're here, you can leave the car where it is. Times are gentle estimates; the fog keeps its own schedule.",
    days: [
        {
            label: "Friday, June 11",
            events: [
                {
                    time: "6:30 PM",
                    title: "Welcome dinner at the lodge",
                    description:
                        "One long table in the dining room, family style, candles and whatever the kitchen caught that morning. Come as you are — most of us will have just driven down Highway 1.",
                },
            ],
        },
        {
            label: "Saturday, June 12",
            events: [
                {
                    time: "5:00 PM",
                    title: "Ceremony on the bluff",
                    description:
                        "A ten-minute walk down the lodge's cliff trail to the benches above the water. Seats from 4:30; flat shoes, a layer, and the patience for wind in your hair.",
                },
                {
                    time: "6:00 PM",
                    title: "Supper by the fire",
                    description:
                        "Back up at the lodge: oysters, a wood-fired dinner on the deck, and heaters for when the fog rolls back in.",
                },
                {
                    time: "8:30 PM",
                    title: "Dancing in the dining room",
                    description:
                        "Tables pushed back, a band from Monterey, and the doors open to the deck until the lodge asks us, politely, to stop.",
                },
            ],
        },
        {
            label: "Sunday, June 13",
            events: [
                {
                    time: "9:00 AM",
                    title: "Coffee and goodbyes",
                    description:
                        "Pastries and very strong coffee on the lodge deck until eleven. Hugs, leftover cake, and directions to the good bakery for the drive home.",
                },
            ],
        },
    ],
    venues: [
        {
            name: "Cypress House Lodge",
            role: "Dinners, dancing & rooms",
            address: "Highway 1, Big Sur, CA 93920",
            description:
                "A redwood lodge on the cliffs with twenty rooms, a dining room that looks straight into the fog, and a deck built for long evenings.",
            image: photo(
                "venue-lodge",
                1600,
                900,
                "A long candlelit dinner table in a redwood lodge dining room, fog and cypress trees in the windows, guests toasting",
            ),
            mapUrl: "https://maps.google.com/?q=Big+Sur+CA+93920",
        },
        {
            name: "The bluff",
            role: "Ceremony",
            address: "A ten-minute walk down the lodge's cliff trail",
            description:
                "A few rows of weathered benches on the grass above the Pacific, a driftwood arch, and nothing between you and the water but wildflowers.",
            image: photo(
                "venue-bluff",
                1600,
                900,
                "Two friends laughing as they carry a wooden bench into place among rows of benches on a foggy bluff above the ocean",
            ),
            mapUrl: "https://maps.google.com/?q=Big+Sur+CA+93920",
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
    headline: "Getting here slowly.",
    intro: "Big Sur is a long, beautiful drive from anywhere — that's the point. The lodge has held twenty rooms for us; two places nearby cover the overflow.",
    gettingThere: [
        "By air: fly into San Jose or Monterey, then drive south on Highway 1 (about an hour from Monterey). Fill the tank in Carmel — there's one pump on the coast and it knows it.",
        "By car: take Highway 1 south from Carmel. Cell service disappears about twenty minutes in, so download your map before you leave and text us when you're back in range.",
    ],
    hotels: [
        {
            name: "Cypress House Lodge",
            description:
                "Where everything happens: twenty rooms on the cliffs, fireplaces in most of them, and breakfast on the deck.",
            distance: "On site",
            blockNote: "Mention SATO-BRENNAN for the block rate through March 1.",
            url: "https://example.com/cypress-house",
        },
        {
            name: "Salt Creek Cabins",
            description:
                "A handful of redwood cabins by the creek with kitchens and wood stoves — good for friends traveling together.",
            distance: "10 minutes up the coast",
            blockNote: "Ask for the Sato–Brennan cabins; they're holding six.",
            url: "https://example.com/salt-creek",
        },
        {
            name: "The Harbor Street Inn",
            description:
                "A small inn in Carmel for anyone who wants restaurants, a real signal, and a slower drive down on Saturday.",
            distance: "50 minutes north",
            url: "https://example.com/harbor-street",
        },
    ],
    thingsToDo: [
        {
            title: "The cove at low tide",
            body: "Ten minutes down the lodge trail: tide pools, sea stars, and a beach you'll probably have to yourself before nine.",
        },
        {
            title: "The redwood loop",
            body: "An easy hour through old redwoods and ferns, a mile north of the lodge. Go on Saturday morning and you'll be back in time to change.",
        },
        {
            title: "The bakery on the highway",
            body: "Morning buns and coffee in a garden a few minutes south. It opens at eight and the line is worth it.",
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
    intro: "Between them they've supplied a decade of pep talks, one borrowed van, and the group chat that planned most of this weekend.",
    members: [
        {
            name: "Hana Sato",
            role: "Maid of honor",
            bio: "Maya's little sister, keeper of every embarrassing photo since 1998, and the only person allowed to edit the vows.",
        },
        {
            name: "Jonas Alvarez",
            role: "Best man",
            bio: "Eli's roommate from the first apartment in Seattle, and the reason the proposal survived a week of fog delays.",
        },
        {
            name: "Priya Nair",
            role: "Bridesmaid",
            bio: "Maya's climbing partner, who has held the rope — and the plan — more times than anyone can count.",
        },
        {
            name: "Sam Okoye",
            role: "Groomsman",
            bio: "Eli's oldest friend, playlist keeper, and the designated driver of the Highway 1 caravan.",
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
    intro: "Truly — but for those who've asked, we've kept a small registry and a fund for the trip up the coast to Haida Gwaii we've been promising ourselves since the ferry.",
    links: [
        {
            name: "The registry",
            description: "Kitchen things, camping things, and one very good tent.",
            url: "https://example.com/registry/sato-brennan",
        },
        {
            name: "The honeymoon fund",
            description: "Two weeks up the coast by ferry, mostly in rain jackets.",
            url: "https://example.com/registry/sato-brennan-honeymoon",
        },
    ],
}

export const rsvp = {
    headline: "Tell us you're coming.",
    body: "One reply per guest, please — names exactly as they appear on your invitation, so the table at the lodge has a seat with your name on it.",
    /** ISO reply-by date the clock engine counts toward; label as printed. */
    replyByIso: "2027-04-15",
    replyByLabel: "April 15, 2027",
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
            options: ["Wood-fired rockfish", "Grilled short rib", "Roasted mushrooms and farro (vegetarian)"],
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
            answer: "If your invitation says “and guest”, absolutely — put both names in the reply. If it doesn't, it's a lodge-size thing, not a you thing: the dining room seats sixty.",
        },
        {
            question: "What should I wear?",
            answer: "Coastal formal: suits or jackets, dresses that don't mind wind, and flat shoes for the trail to the bluff. It's cool by the water even in June — bring a real layer.",
        },
        {
            question: "Is there cell service?",
            answer: "Barely. The lodge has wifi; the bluff has none. Download your map before you leave Carmel and plan to meet people where you said you would.",
        },
        {
            question: "What if it's foggy?",
            answer: "It will be, a little — that's the coast. If it turns to real rain, the ceremony moves into the lodge dining room with the doors open to the view.",
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
    finalCtaTitle: "We're saving you a seat by the fire.",
    /** The home page's schedule teaser heading. */
    scheduleHeading: "The weekend",
    /** The zine home's story heading. */
    storyHeading: "",
    /** The hotels heading (the travel page, and the zine home). */
    hotelsHeading: "Where to stay",
    /** The venue heading (the classic home, and the schedule page). */
    venuesHeading: "Where it all happens",
    /** The travel page's headings. */
    gettingThereTitle: "Highway 1 is the pretty way down.",
    thingsToDoTitle: "While you're on the coast",
    /** The RSVP form's title, and the questions' kicker and title (the zine home repeats them). */
    rsvpFormTitle: "The reply card",
    faqKicker: "Good questions",
    faqTitle: "Asked and answered",
    /** The nav label for the /party page. */
    partyNavLabel: "Wedding party",
}
