/**
 * The vows pack's single content file: the couple, the story, the weekend,
 * the travel notes, the party, the registry, and the RSVP ask. Everything
 * the site renders comes from here — edit this file (not the page
 * components) to make the site yours. The demo couple marries at a Hudson
 * Valley garden estate, but the slots are wedding-agnostic: swap the names,
 * dates, venues, and photographs and the site follows.
 *
 * The countdown is data (`couple.weddingDateIso`); the labels the site
 * renders from it ("289 days to go", "Today's the day") are computed per
 * render by the clock engine (`countdown.ts`) — change the date here and
 * the hero badge, the RSVP nudge, and the day-of flip all follow.
 *
 * `home.layout` picks the site's composition: `classic` (this wedding's)
 * sets the masthead over the engagement photograph, the welcome note, the
 * weekend, the venues, and the engagement gallery, with the story told in
 * chapters and a filmstrip; `zine` opens on the invitation cover beside
 * the photo wall (`home.wall`, the particulars strip `home.details`), runs
 * the story as a rail of years (`story.chapters[].year`), the booth
 * strips, the weekend, the hotels, the registry, and the questions, tapes
 * the story page's snapshots up with their captions, and leads the party
 * page with the registry. `story`, `stack`, and `letter` are the quiet
 * one-page homes: the names over one photograph, then the story in
 * stacked chapters and the weekend in a few lines (`home.weekend`); the
 * names over one photograph, then the caption-band stack (`home.stack`);
 * or no photograph at all — the names set enormous, then the weekend, the
 * hotels, and the couple's note as a ruled column. All three close on one
 * line (`home.closing`) and the RSVP link. The photo wall, the booth
 * strips, the weekend lines, and the stack ship empty here and render
 * once filled; chapter and venue photographs are optional.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/vows` (see PACK.md). Never point a slot at a raw
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
        src: `/vows/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/vows/${name}-${step}w.webp`, width: step })),
    }
}

export const couple = {
    /** The site's masthead: how the couple signs the invitation. */
    names: "Amelia & Jonah",
    partnerA: "Amelia Hart",
    partnerB: "Jonah Reyes",
    /** ISO date the clock engine counts toward. */
    weddingDateIso: "2027-06-12",
    /** The date as the invitation says it. */
    weddingDateLabel: "Saturday, June 12, 2027",
    /** Where — the short line under the names. */
    venueShort: "Maplecroft Estate · Rhinebeck, New York",
    /** Reaching the couple (questions the FAQ doesn't answer). */
    email: "amelia.and.jonah@example.com",
    hashtag: "#HartMeetsReyes",
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
    layout: "classic",
    headline: "We're getting married.",
    subheadline: `${couple.weddingDateLabel} · ${couple.venueShort}`,
    heroImage: photo(
        "hero-01",
        1536,
        1024,
        "Amelia and Jonah walking hand in hand down a garden path at golden hour, a stone estate house behind them",
    ),
    wall: [],
    details: [],
    detailsLink: "See the weekend",
    welcomeTitle: "Welcome to our little corner of the internet.",
    welcomeBody:
        "Everything you need for the weekend lives here — the story, the schedule, where to stay, and the RSVP. We can't wait to celebrate with you under the maples at Maplecroft. Come hungry, bring dancing shoes.",
    weekend: [],
    stack: [],
    closing: "",
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
    headline: "First the bookstore, then everything.",
    intro: "Eight years, two apartments, one very opinionated dog — the short version, in three chapters.",
    chapters: [
        {
            year: "",
            title: "The bookstore, 2019",
            body: "We reached for the same used copy of The Shipping News at Oblong Books and argued about who saw it first. Jonah let Amelia have it; Amelia let him buy her coffee as a consolation prize. The receipt is framed in our kitchen.",
            image: photo(
                "story-bookstore",
                1536,
                1024,
                "Amelia and Jonah reaching for the same book on a wooden shelf in a cozy bookstore",
            ),
        },
        {
            year: "",
            title: "The question, 2025",
            body: "On the overlook above Cold Spring — the hike we've done a hundred times — Jonah knelt in the wildflowers at dusk with his grandmother's ring and completely forgot the speech he'd practiced. Amelia said yes before he found it.",
            image: photo(
                "story-proposal",
                1536,
                1024,
                "Jonah kneeling with a ring box before Amelia on a bluff over the Hudson River at dusk",
            ),
        },
        {
            year: "",
            title: "Home, now",
            body: "These days we're in a white farmhouse outside Rhinebeck with Biscuit, the terrier who came with more opinions than the lease allowed. Saturday coffee on the porch steps is the standing appointment we plan everything else around.",
            image: photo(
                "story-porch",
                1536,
                1024,
                "Amelia and Jonah with coffee mugs and their terrier on the front steps of a white farmhouse porch",
            ),
        },
    ],
    stripsTitle: "",
    strips: [],
    galleryTitle: "From the engagement session",
    gallery: [
        {
            image: photo(
                "gallery-01",
                1024,
                1536,
                "Amelia and Jonah slow dancing under a maple tree in a backlit meadow",
            ),
            caption: "",
        },
        {
            image: photo(
                "gallery-02",
                1536,
                1024,
                "Amelia and Jonah rowing a wooden boat under weeping willows",
            ),
            caption: "",
        },
        {
            image: photo(
                "gallery-03",
                1024,
                1536,
                "The couple's intertwined hands with the engagement ring and a sprig of dried flowers",
            ),
            caption: "",
        },
        {
            image: photo(
                "gallery-04",
                1536,
                1024,
                "Amelia and Jonah sharing wine on a plaid blanket at a hilltop picnic at dusk",
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
    headline: "One weekend, three parties.",
    intro: "Everything is within fifteen minutes of the estate, and the shuttle covers the two that matter. Times are gentle estimates — weddings run on champagne, not trains.",
    days: [
        {
            label: "Friday, June 11",
            events: [
                {
                    time: "6:00 PM",
                    title: "Welcome drinks at The Corner Bar",
                    description:
                        "Come say hi the night before — no dress code, no speeches, first round on us. We'll be the nervous-looking pair by the jukebox.",
                },
            ],
        },
        {
            label: "Saturday, June 12",
            events: [
                {
                    time: "4:00 PM",
                    title: "Ceremony on the ceremony lawn",
                    description:
                        "Under the two-hundred-year-old maples behind the house. Seats from 3:30; the aisle closes at 3:55 sharp so Amelia doesn't have to race anyone down it.",
                },
                {
                    time: "5:00 PM",
                    title: "Cocktails in the walled garden",
                    description:
                        "Hudson Valley cheeses, a raw bar, and a gin cart while we're off taking photographs. The espresso martinis arrive at 5:30 — pace yourselves.",
                },
                {
                    time: "6:30 PM",
                    title: "Dinner in the conservatory",
                    description:
                        "A long-table dinner under the glass roof and the string lights. Seating cards at the door; every table has at least one good storyteller, we checked.",
                },
                {
                    time: "8:30 PM",
                    title: "Dancing until they turn the lights on",
                    description:
                        "The band plays until eleven, the DJ takes it from there, and the late-night grilled cheeses appear at ten. The last shuttle leaves at half past midnight.",
                },
            ],
        },
        {
            label: "Sunday, June 13",
            events: [
                {
                    time: "10:00 AM",
                    title: "Farewell brunch at the farmhouse",
                    description:
                        "Bagels, eggs, and very strong coffee on our own porch until noon. Come in whatever state Saturday left you — Biscuit greets every guest personally.",
                },
            ],
        },
    ],
    venues: [
        {
            name: "Maplecroft Estate",
            role: "Ceremony & reception",
            address: "48 River Bend Road, Rhinebeck, NY 12572",
            description:
                "A 1902 stone house on forty acres above the Hudson: the ceremony under the maples, cocktails in the walled garden, dinner and dancing in the glass conservatory.",
            image: photo(
                "venue-ceremony",
                1536,
                1024,
                "White ceremony chairs and a rose-covered arch on the lawn of a stone estate house under old maple trees",
            ),
            mapUrl: "https://maps.google.com/?q=48+River+Bend+Road%2C+Rhinebeck%2C+NY+12572",
        },
        {
            name: "The conservatory",
            role: "Dinner & dancing",
            address: "On the estate grounds — follow the string lights",
            description:
                "The estate's glass orangery, set with long farm tables, taper candles, and more garden roses than the florist advised. When the sun goes down the whole room glows.",
            image: photo(
                "venue-reception",
                1536,
                1024,
                "A glass conservatory at dusk set for a wedding dinner with long tables, candles, and string lights",
            ),
            mapUrl: "https://maps.google.com/?q=Maplecroft+Estate+Rhinebeck+NY",
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
    headline: "Getting here, staying here.",
    intro: "Rhinebeck is two hours north of the city — Amtrak to Rhinecliff is the pretty way up. We've held rooms at three places; the shuttle runs from the first two.",
    gettingThere: [
        "By train: Amtrak from Penn Station to Rhinecliff (about 1h45); the river side of the train has the views. Cabs meet every arrival, and the estate is ten minutes from the station.",
        "By car: the Taconic to Route 199 west. Parking at the estate is free and nobody checks how long you leave your car — take the shuttle back if the evening goes the way we hope.",
    ],
    hotels: [
        {
            name: "The Beekman Arms",
            description:
                "America's oldest inn, right on the village green — creaky floors, four-poster beds, and the tavern where half the wedding party will end up Friday night.",
            distance: "8 minutes from the estate · shuttle stop",
            blockNote: "Mention HART-REYES for the block rate through May 1.",
            url: "https://example.com/beekman-arms",
        },
        {
            name: "Mirbeau Inn & Spa",
            description:
                "The comfortable modern option: big rooms, a very good spa, and a heated pool. Book the recovery massage for Sunday now; thank us later.",
            distance: "12 minutes from the estate · shuttle stop",
            blockNote: "Mention HART-REYES for the block rate through May 1.",
            url: "https://example.com/mirbeau",
        },
        {
            name: "Hudson House Cottages",
            description:
                "Six little cottages on the river for anyone making a weekend of it — kitchens, fire pits, and the sunrise over the water. No shuttle, but a five-minute cab.",
            distance: "15 minutes from the estate",
            url: "https://example.com/hudson-house",
        },
    ],
    thingsToDo: [
        {
            title: "The Saturday farmers market",
            body: "Rhinebeck's market runs 9 to 1 in the village lot — the cider doughnuts sell out by 11 and deserve their reputation.",
        },
        {
            title: "Walkway Over the Hudson",
            body: "The old rail bridge at Poughkeepsie, now the longest pedestrian bridge in the world. Twenty minutes south; go at golden hour.",
        },
        {
            title: "Oblong Books",
            body: "The scene of the crime (see: Our story). Tell Suzanna at the register you're with the wedding and she'll point you to the shelf.",
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
    intro: "Between them they've supplied two decades of pep talks, one borrowed truck, and the group chat that planned most of this weekend.",
    members: [
        {
            name: "Priya Natarajan",
            role: "Maid of honor",
            bio: "Amelia's roommate from year one of art school, keeper of every secret since, and the only person allowed to edit the vows.",
        },
        {
            name: "Marcus Reyes",
            role: "Best man",
            bio: "Jonah's little brother, taller than him since 2011, and the reason the proposal stayed a secret for five whole months.",
        },
        {
            name: "June Hart",
            role: "Bridesmaid",
            bio: "Amelia's sister — the family's actual planner, who color-coded this weekend's spreadsheet before we asked.",
        },
        {
            name: "Dev Okafor",
            role: "Groomsman",
            bio: "College radio co-host, best-man-speech understudy, and the DJ of last resort if the band misses the Taconic exit.",
        },
        {
            name: "Rosa Delgado",
            role: "Bridesmaid",
            bio: "Amelia's studio mate, who framed the bookstore receipt as an engagement gift and cried before we did.",
        },
        {
            name: "Sam Whitfield",
            role: "Groomsman",
            bio: "Jonah's fishing partner and the owner of the porch where most of this wedding was quietly planned.",
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
    intro: "Truly — but for those who've asked, we've kept a small registry and a honeymoon fund for the trip to Portugal we've been promising ourselves since the bookstore.",
    links: [
        {
            name: "Zola",
            description: "The main registry — kitchen things, garden things, and one extravagant tent.",
            url: "https://example.com/registry/zola",
        },
        {
            name: "The honeymoon fund",
            description: "Three weeks of Portugal: pastel de nata research, mostly.",
            url: "https://example.com/registry/honeymoon",
        },
    ],
}

export const rsvp = {
    headline: "Tell us you're coming.",
    body: "One reply per guest, please — names exactly as they appear on your invitation, so the seating chart doesn't become a diplomatic incident.",
    /** ISO reply-by date the clock engine counts toward; label as printed. */
    replyByIso: "2027-05-01",
    replyByLabel: "May 1, 2027",
    confirmation:
        "Got it — thank you! Your reply is in. If plans change, just submit again with the same name and we'll take the newest answer.",
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
            options: ["Braised short rib", "Roasted halibut", "Wild mushroom risotto (vegetarian)"],
            placeholder: "Choose at your leisure",
        },
        {
            name: "song",
            label: "A song that gets you dancing",
            placeholder: "The DJ reads every one of these",
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
            answer: "If your invitation says “and guest”, absolutely — put both names in the reply. If it doesn't, it's a table-space thing, not a you thing; dinner seats forty-eight and our families are enormous.",
        },
        {
            question: "What should I wear?",
            answer: "Garden formal: suits or jackets, dresses that can handle grass, and shoes that forgive a lawn. The ceremony is outdoors and June evenings by the river cool off — bring a layer for dancing under glass.",
        },
        {
            question: "Are kids invited?",
            answer: "We love yours, and we've kept the guest list adults-only except for the flower girl and the ring bearer, who are contractually obligated. The inns can recommend sitters if that helps.",
        },
        {
            question: "What about the weather?",
            answer: "If it rains, the ceremony moves into the conservatory and gets, frankly, more dramatic. Nobody gets wet except the photographer, who insists.",
        },
        {
            question: "Can I take photos during the ceremony?",
            answer:
                "We're having an unplugged ceremony — twenty minutes of phones in pockets while the professionals work. From cocktail hour on, post everything, tagged " +
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
    finalCtaTitle: "We're saving you a seat.",
    /** The home page's schedule teaser heading. */
    scheduleHeading: "The weekend at a glance",
    /** The zine home's story heading. */
    storyHeading: "",
    /** The hotels heading (the travel page, and the zine home). */
    hotelsHeading: "Where to stay",
    /** The venue heading (the classic home, and the schedule page). */
    venuesHeading: "Where it all happens",
    /** The travel page's headings. */
    gettingThereTitle: "Trains are the pretty way up.",
    thingsToDoTitle: "While you're here",
    /** The RSVP form's title, and the questions' kicker and title (the zine home repeats them). */
    rsvpFormTitle: "The reply card",
    faqKicker: "Good questions",
    faqTitle: "Asked and answered",
    /** The nav label for the /party page. */
    partyNavLabel: "Wedding party",
}
