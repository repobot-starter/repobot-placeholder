/**
 * The Paris remix seed: a complete, drop-in replacement for `./content.ts`
 * that retargets the vows pack from Amelia & Jonah's Rhinebeck garden
 * wedding to Inès & Paul's September weekend in Paris. The derived template
 * `repobot-vows-paris` is composed from the vows pack with this file copied
 * over `content.ts`, its catalog's brand, and the `carton` register
 * (cornflower ink on warm paper, an enormous hairline Bodoni Moda).
 * `home.layout: "letter"` sets the home like a faire-part, with no
 * photograph: the names enormous, then the weekend in three lines
 * (`home.weekend`), the hotels, the couple's note (`home.welcomeTitle` and
 * `welcomeBody`), and one closing line (`home.closing`) with the RSVP link.
 * The story's chapters and the schedule's venues run as text; only the
 * story page's gallery (the contract's three frames) carries photographs.
 * Every other page, the RSVP card included, is the base's.
 *
 * Because the copy is verbatim, this file must stay a structural twin of
 * `content.ts`: same exports, same relative imports, images under its own
 * `/vows-paris/` public directory. The parity test
 * (`tests/View/Vows/remixSeeds.test.ts`) pins the export surface against
 * the real module, so the seed fails CI the moment the pack's contract
 * moves without it.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/vows-paris` (see PACK.md). Never point a slot at a raw
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
        src: `/vows-paris/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/vows-paris/${name}-${step}w.webp`, width: step })),
    }
}

export const couple = {
    /** The site's masthead: how the couple signs the invitation. */
    names: "Inès & Paul",
    partnerA: "Inès Benali",
    partnerB: "Paul Vasseur",
    /** ISO date the clock engine counts toward. */
    weddingDateIso: "2027-09-18",
    /** The date as the invitation says it. */
    weddingDateLabel: "Saturday 18 September 2027",
    /** Where — the short line under the names. */
    venueShort: "Mairie du 6e · Paris",
    /** Reaching the couple (questions the FAQ doesn't answer). */
    email: "ines.et.paul@example.com",
    hashtag: "#InesEtPaul",
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
    layout: "letter",
    /** The no-break space keeps "& Paul" together when the names wrap. */
    headline: "Inès &\u00a0Paul",
    subheadline: "Paris · Saturday 18 September 2027",
    heroImage: undefined,
    wall: [],
    details: [],
    detailsLink: "See the weekend",
    welcomeTitle: "A note from us",
    welcomeBody:
        "Thank you for being part of our weekend. We can't wait to share Paris with you — the long lunches, the walks, the views, and all the small moments in between.",
    weekend: [
        "Friday — Drinks at Chez Odile, 7 pm",
        "Saturday — Ceremony at the Mairie du 6e, 3 pm; dinner to follow",
        "Sunday — Picnic in the Luxembourg Gardens",
    ],
    stack: [],
    closing: "With love, Inès & Paul.",
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
    headline: "One umbrella, then everything.",
    intro: "Five years, one borrowed umbrella, and a city we never quite finished walking — the short version, in three chapters.",
    chapters: [
        {
            year: "",
            title: "The umbrella, 2022",
            body: "Paul lent Inès half an umbrella outside a bookshop on the rue de Seine, and then walked her the long way home so he could keep it. By the time the rain stopped they were in the 14th and neither of them had noticed.",
        },
        {
            year: "",
            title: "The quay, 2026",
            body: "Paul asked on the quay below the Pont Neuf, halfway through a bag of cherries, on the first warm Sunday of spring. Inès said yes with her mouth full, and a man fishing nearby clapped.",
        },
        {
            year: "",
            title: "Why Paris",
            body: "It's where we met and where we've stayed — a small flat, a bistro that knows our order, and a park we walk every Sunday. It's where we're gathering the people we love most to celebrate with us.",
        },
    ],
    stripsTitle: "",
    strips: [],
    galleryTitle: "Five years in the city",
    gallery: [
        {
            image: photo(
                "gallery-umbrella",
                1024,
                1365,
                "Inès and Paul running laughing down a wet cobbled street under one umbrella, a bistro awning behind them — black and white",
            ),
            caption: "",
        },
        {
            image: photo(
                "gallery-bistro",
                1600,
                900,
                "Paul throwing both arms up at a crowded zinc bar while Inès laughs beside him and friends cheer — black and white",
            ),
            caption: "",
        },
        {
            image: photo(
                "gallery-quay",
                1024,
                1365,
                "Inès feeding Paul a cherry as they lounge on a stone quay by the Seine, a bridge behind them — black and white",
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
    headline: "Three days in Paris.",
    intro: "Everything is in the 6th or a short walk from it — leave the car at home and bring shoes for cobblestones. Times are gentle estimates; lunch in Paris keeps its own schedule.",
    days: [
        {
            label: "Friday 17 September",
            events: [
                {
                    time: "7:00 PM",
                    title: "Drinks at Chez Odile",
                    description:
                        "The bistro on the corner where we had our first dinner. We've taken the back room and the terrace; come as you are, straight off the train.",
                },
            ],
        },
        {
            label: "Saturday 18 September",
            events: [
                {
                    time: "3:00 PM",
                    title: "Ceremony at the Mairie du 6e",
                    description:
                        "The civil ceremony in the town hall's salle des mariages, facing the Luxembourg Gardens. It is short and in French — the English is on the card on your seat. Please arrive by 2:40.",
                },
                {
                    time: "4:00 PM",
                    title: "Photographs in the Gardens",
                    description:
                        "A slow walk across the road into the Luxembourg, for photographs by the fountain and a glass of champagne.",
                },
                {
                    time: "7:30 PM",
                    title: "Dinner to follow",
                    description:
                        "Dinner and dancing at La Treille, a restaurant with a courtyard two streets away, until they turn the lights on.",
                },
            ],
        },
        {
            label: "Sunday 19 September",
            events: [
                {
                    time: "12:00 PM",
                    title: "Picnic in the Luxembourg Gardens",
                    description:
                        "Bread, cheese, and whatever is left of the cake on the lawn by the Medici Fountain. Bring a blanket if you have one; we'll bring more than enough wine.",
                },
            ],
        },
    ],
    venues: [
        {
            name: "Mairie du 6e",
            role: "Ceremony",
            address: "78 rue Bonaparte, 75006 Paris",
            description:
                "The 6th arrondissement's town hall, across the square from the Luxembourg Gardens — a painted marriage room, tall windows, and a staircase made for photographs.",
            mapUrl: "https://maps.google.com/?q=78+rue+Bonaparte+75006+Paris",
        },
        {
            name: "La Treille",
            role: "Dinner & dancing",
            address: "Two streets from the Mairie, in the 6th",
            description:
                "A restaurant with a vine-covered courtyard, one long table under the lights, and a back room cleared for dancing.",
            mapUrl: "https://maps.google.com/?q=75006+Paris",
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
    headline: "Getting to Paris.",
    intro: "Paris is easy to reach and better on foot. We've asked three small hotels in the 6th to hold rooms; each is a short walk from everything.",
    gettingThere: [
        "By air: fly into Charles de Gaulle or Orly. The RER B runs from CDG to Luxembourg station in about forty minutes; a taxi is a fixed fare to the Left Bank.",
        "By train: the Eurostar arrives at Gare du Nord, the TGV from the south at Gare de Lyon. From either, the metro or a taxi gets you to the 6th in twenty minutes.",
    ],
    hotels: [
        {
            name: "Hôtel des Glycines",
            description:
                "A narrow hotel with wisteria over the door and small, bright rooms above a quiet street.",
            distance: "5 minutes' walk",
            blockNote: "Mention BENALI-VASSEUR for the wedding rate until 1 June.",
            url: "https://example.com/hotel-des-glycines",
        },
        {
            name: "Hôtel Saint-Clair",
            description:
                "A family-run hotel with a courtyard breakfast room — good for friends traveling together.",
            distance: "8 minutes' walk",
            blockNote: "Ask for the Benali–Vasseur rooms; they're holding eight.",
            url: "https://example.com/hotel-saint-clair",
        },
        {
            name: "Hôtel de la Treille",
            description:
                "Above the restaurant where we're having dinner, for anyone who wants to be the last to leave and the first to bed.",
            distance: "At dinner",
            url: "https://example.com/hotel-de-la-treille",
        },
    ],
    thingsToDo: [
        {
            title: "The bookshops on the rue de Seine",
            body: "Where we met: a street of small bookshops and galleries a few minutes from the Mairie. Go on Saturday morning.",
        },
        {
            title: "The quays at golden hour",
            body: "Walk down to the river below the Pont Neuf with a bag of cherries. It's the best free seat in the city.",
        },
        {
            title: "The market on the boulevard",
            body: "The Sunday market on the boulevard Raspail — pick up picnic things before you meet us in the Gardens.",
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
    intro: "Our witnesses — in France they sign the register with us — and the friends who have walked most of this city at our side.",
    members: [
        {
            name: "Camille Benali",
            role: "Witness",
            bio: "Inès's sister, keeper of every embarrassing photo since 1997, and the only person allowed to edit the vows.",
        },
        {
            name: "Hugo Marchetti",
            role: "Witness",
            bio: "Paul's oldest friend from the lycée, and the one who told him to keep the umbrella.",
        },
        {
            name: "Yasmine Haddad",
            role: "Witness",
            bio: "Inès's closest friend from art school, who designed the invitations in exactly this ink.",
        },
        {
            name: "Tom Achterberg",
            role: "Witness",
            bio: "Paul's colleague and running partner, playlist keeper, and the designated pourer at Chez Odile.",
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
    intro: "Truly — but for those who've asked, we've kept a small registry and a fund for the train trip down to Marseille we've been promising ourselves.",
    links: [
        {
            name: "The registry",
            description: "Kitchen things, a proper coffee pot, and a few books.",
            url: "https://example.com/registry/benali-vasseur",
        },
        {
            name: "The honeymoon fund",
            description: "Two weeks by train down to the sea, mostly eating.",
            url: "https://example.com/registry/benali-vasseur-honeymoon",
        },
    ],
}

export const rsvp = {
    headline: "Tell us you're coming.",
    body: "One reply per guest, please — names exactly as they appear on your invitation, so there's a seat with your name on it at dinner.",
    /** ISO reply-by date the clock engine counts toward; label as printed. */
    replyByIso: "2027-06-01",
    replyByLabel: "1 June 2027",
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
            options: ["Sea bass with fennel", "Roast duck", "Summer vegetables and lentils (vegetarian)"],
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
            answer: "If your invitation says “and guest”, absolutely — put both names in the reply. If it doesn't, it's a courtyard-size thing, not a you thing: La Treille seats seventy.",
        },
        {
            question: "What should I wear?",
            answer: "City formal: suits, dresses, and shoes that can manage cobblestones and gravel paths. September in Paris is mild, but bring a layer for the evening.",
        },
        {
            question: "Is the ceremony in French?",
            answer: "Yes — a French civil ceremony is short and spoken by the mayor's deputy. There'll be an English card on every seat, and a friend translating the funny parts.",
        },
        {
            question: "What if it rains?",
            answer: "The ceremony is indoors either way. If it rains on Sunday, the picnic moves to Chez Odile's back room.",
        },
        {
            question: "Can I take photos during the ceremony?",
            answer:
                "We're having an unplugged ceremony — twenty minutes of phones in pockets while the photographer works. From the Gardens on, post everything, tagged " +
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
    finalCtaTitle: "We're saving you a seat at dinner.",
    /** The home page's schedule teaser heading. */
    scheduleHeading: "The weekend",
    /** The zine home's story heading. */
    storyHeading: "",
    /** The hotels heading (the travel page, and the zine home). */
    hotelsHeading: "Where to stay",
    /** The venue heading (the classic home, and the schedule page). */
    venuesHeading: "Where it all happens",
    /** The travel page's headings. */
    gettingThereTitle: "The train is the pretty way in.",
    thingsToDoTitle: "While you're in the city",
    /** The RSVP form's title, and the questions' kicker and title (the zine home repeats them). */
    rsvpFormTitle: "The reply card",
    faqKicker: "Good questions",
    faqTitle: "Asked and answered",
    /** The nav label for the /party page. */
    partyNavLabel: "Wedding party",
}
