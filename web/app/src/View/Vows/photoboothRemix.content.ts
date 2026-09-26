/**
 * The vows-photobooth remix's content seed (packs/README.md "Derived
 * templates"): an unstaged, photo-booth kind of wedding in Chicago, worn
 * over the vows pack as a cut-and-paste zine. At compose time this file is
 * copied byte-for-byte over `View/Vows/content.ts`, so it must remain a
 * STRUCTURAL TWIN of that module — the same export surface, the same
 * shapes, the contract's minimums met
 * (tests/View/Vows/photoboothRemixSeed.test.ts pins the twin).
 *
 * The couple, the story, the booth strips, the weekend, the travel notes,
 * the registry and the crew, and the RSVP ask. `home.layout: "zine"`
 * opens on the photo wall (see the base module's header for the layouts).
 *
 * The countdown is data (`couple.weddingDateIso`); the labels the site
 * renders from it ("289 days to go", "Today's the day") are computed per
 * render by the clock engine (`countdown.ts`) — change the date here and
 * the hero badge, the RSVP nudge, and the day-of flip all follow.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/vows-photobooth` (see PACK.md). Never point a slot at a raw
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
        src: `/vows-photobooth/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/vows-photobooth/${name}-${step}w.webp`, width: step })),
    }
}

/** One photo-booth frame (the booth prints square). */
const frame = (name: string, alt: string): SiteImage => photo(name, 640, 640, alt)

export const couple = {
    /** The site's masthead: how the couple signs the invitation. */
    names: "Priya & Marcus",
    partnerA: "Priya Raman",
    partnerB: "Marcus Whitaker",
    /** ISO date the clock engine counts toward. */
    weddingDateIso: "2027-06-12",
    /** The date as the invitation says it. */
    weddingDateLabel: "Saturday, June 12, 2027",
    /** Where — the short line under the names. */
    venueShort: "Chicago, IL",
    /** Reaching the couple (questions the FAQ doesn't answer). */
    email: "priya.and.marcus@example.com",
    hashtag: "#OkayWereDoingIt",
}

/** A piece on the hero's photo wall: a booth strip (`frames`) or one snapshot. */
export interface WallPiece {
    frames?: SiteImage[]
    image?: SiteImage
    /** A label taped over the piece. */
    sticker?: string
}

/** The home page's composition — see the base module's header. */
export type HomeLayout = "classic" | "zine" | "story" | "stack" | "letter"

/** One frame of the `stack` home: the photograph and the line on its band. */
export interface StackFrame {
    image: SiteImage
    caption: string
}

export const home: {
    layout: HomeLayout
    /** Line breaks are the hero's: one line per ink. */
    headline: string
    subheadline: string
    /** The one photograph variants without a photo wall fall back to. */
    heroImage?: SiteImage
    /** The photo wall beside the headline, top left to bottom right. */
    wall: WallPiece[]
    /** The particulars strip under the hero, cell by cell. */
    details: string[]
    /** The jump from the hero down to the details. */
    detailsLink: string
    /** The welcome note under the classic hero. */
    welcomeTitle: string
    welcomeBody: string
    /** The quiet homes' weekend lines, stack frames, and closing line (unused by the zine). */
    weekend: string[]
    stack: StackFrame[]
    closing: string
} = {
    layout: "zine",
    headline: "Okay,\nwe're\ndoing it.",
    subheadline: "Join us for our wedding — an unstaged, real-life kind of party.",
    heroImage: photo(
        "snap-kitchen",
        1600,
        1200,
        "Priya laughing at the stove while Marcus fans smoke away from a flaring pan with a dish towel",
    ),
    wall: [
        {
            frames: [
                frame("booth-a-1", "Priya pulling a skeptical face beside Marcus in a photo booth"),
                frame("booth-a-2", "Priya and Marcus cracking up in the same photo booth"),
            ],
        },
        {
            image: photo(
                "snap-kitchen",
                1600,
                1200,
                "Priya laughing at the stove while Marcus fans smoke away from a flaring pan with a dish towel",
            ),
        },
        {
            frames: [
                frame(
                    "booth-b-3",
                    "Priya and Marcus in winter hats laughing cheek to cheek in a photo booth",
                ),
                frame(
                    "booth-b-4",
                    "Priya showing off her engagement ring while Marcus points at it, mouth open",
                ),
            ],
            sticker: "Not picture perfect.\nPicture us.",
        },
        {
            image: photo(
                "snap-platform",
                1600,
                2133,
                "Priya laughing on an elevated train platform at night as a train pulls in",
            ),
        },
        {
            image: photo(
                "snap-roadtrip",
                1600,
                2133,
                "Bare feet in sandals up on a car dashboard, a flat prairie highway through the windshield",
            ),
            sticker: "Road trip. Bad cooking. Best people. ♥",
        },
    ],
    details: ["Saturday, June 12", "Chicago", "RSVP by May 1"],
    detailsLink: "Details, maps & all that jazz",
    welcomeTitle: "",
    welcomeBody: "",
    weekend: [],
    stack: [],
    closing: "",
}

export interface StoryChapter {
    /** The year on the timeline rail. */
    year: string
    title: string
    body: string
    image?: SiteImage
}

/** A snapshot with its scrawled caption. */
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
    headline: "Nothing about us was planned. Especially this.",
    intro: "Seven years, one terrible karaoke duet, three apartments, and a proposal that went sideways in the rain. The short version:",
    chapters: [
        {
            year: "2019",
            title: "How we met",
            body: "Karaoke night at a Logan Square dive. Marcus signed up for “Islands in the Stream” and his duet partner bailed; Priya was the only one who knew the Dolly part. We were not good. We closed the bar anyway.",
            image: photo(
                "story-met",
                1600,
                1200,
                "Marcus singing into a microphone beside Priya in a crowded bar, both laughing, beer in hand",
            ),
        },
        {
            year: "2022",
            title: "First apartment",
            body: "A third-floor walk-up in Pilsen with a radiator that clanked all night. The couch didn't fit up the stairs, so for two months we ate every dinner on the floor between the boxes. Still the best pizza of our lives.",
            image: photo(
                "story-apartment",
                1600,
                1200,
                "Priya and Marcus sitting on the floor among moving boxes, sharing a pizza in an empty apartment",
            ),
        },
        {
            year: "2026",
            title: "The proposal that went wrong",
            body: "Marcus planned a sunset on the lakefront. Chicago sent a thunderstorm. He knelt anyway, in a puddle, holding the umbrella over the ring instead of her. She said yes before he finished the sentence — mostly to get inside.",
            image: photo(
                "story-proposal",
                1600,
                1200,
                "Marcus kneeling in the rain on the lakefront holding a ring out to Priya under an umbrella, the skyline behind",
            ),
        },
    ],
    stripsTitle: "Straight out of the booth",
    strips: [
        {
            label: "Take one",
            caption: "The first strip. Our friends still have copies.",
            frames: [
                frame("booth-a-1", "Priya pulling a skeptical face beside Marcus in a photo booth"),
                frame("booth-a-2", "Priya and Marcus cracking up in the same photo booth"),
                frame("booth-a-3", "Marcus kissing Priya's cheek while she laughs, eyes squeezed shut"),
                frame("booth-a-4", "Priya and Marcus both laughing open-mouthed at the camera"),
            ],
        },
        {
            label: "Winter, obviously",
            caption: "Minus eleven outside. The booth had heat.",
            frames: [
                frame("booth-b-1", "Priya in a knit hat nuzzling Marcus in a scarf inside a photo booth"),
                frame("booth-b-2", "Priya kissing Marcus's cheek, both bundled in winter coats"),
                frame(
                    "booth-b-3",
                    "Priya and Marcus in winter hats laughing cheek to cheek in a photo booth",
                ),
                frame(
                    "booth-b-4",
                    "Priya showing off her engagement ring while Marcus points at it, mouth open",
                ),
            ],
        },
        {
            label: "Engaged!!",
            caption: "Paper crowns, party of two.",
            frames: [
                frame(
                    "booth-c-1",
                    "Marcus in a paper crown and suit throwing a peace sign beside Priya in a pink dress",
                ),
                frame("booth-c-2", "Priya laughing while Marcus grins under his paper crown"),
                frame("booth-c-3", "Priya and Marcus cheek to cheek in front of a silver tinsel curtain"),
                frame("booth-c-4", "Priya kissing Marcus on the cheek as his crown slips"),
            ],
        },
    ],
    galleryTitle: "The disposable camera roll",
    gallery: [
        {
            image: photo(
                "snap-bar",
                1600,
                1200,
                "Priya and Marcus squeezed into a booth at a dim bar, laughing into the flash",
            ),
            caption: "Our bar. Our booth. Our fourth round.",
        },
        {
            image: photo(
                "snap-kitchen",
                1600,
                1200,
                "Priya laughing at the stove while Marcus fans smoke away from a flaring pan with a dish towel",
            ),
            caption: "Marcus cooks. The smoke alarm reviews.",
        },
        {
            image: photo(
                "snap-platform",
                1600,
                2133,
                "Priya laughing on an elevated train platform at night as a train pulls in",
            ),
            caption: "Blue Line, 1:10 AM, missed it twice.",
        },
        {
            image: photo(
                "snap-roadtrip",
                1600,
                2133,
                "Bare feet in sandals up on a car dashboard, a flat prairie highway through the windshield",
            ),
            caption: "Route 66 until the car said no.",
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
    /** What happens there: "Ceremony & party", "Welcome night", … */
    role: string
    address: string
    description: string
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
    headline: "Three days. Zero dress rehearsals.",
    intro: "Everything is a short ride on the L or a cheap cab from the next thing. Times are approximate — we're us.",
    days: [
        {
            label: "Friday, June 11",
            events: [
                {
                    time: "7:00 PM",
                    title: "Welcome night at Kedzie Lanes",
                    description:
                        "Bowling, deep dish, and a jukebox that only takes quarters. Bring your worst form — the lanes are ours until midnight and the first pitchers are on us.",
                },
            ],
        },
        {
            label: "Saturday, June 12",
            events: [
                {
                    time: "4:30 PM",
                    title: "Ceremony at the Fulton Street Loft",
                    description:
                        "Twenty minutes, one aisle, both our grandmothers in the front row. Doors at 4:00. Short, sweet, and we promise the vows are funnier than the speeches.",
                },
                {
                    time: "5:15 PM",
                    title: "Cocktails on the roof",
                    description:
                        "Skyline, spritzes, and a mango lassi bar that Priya's aunties have strong opinions about. Hang around the photo booth — it's open all night.",
                },
                {
                    time: "6:30 PM",
                    title: "Family-style dinner",
                    description:
                        "Long tables, big bowls: biryani from Devon Avenue next to Marcus's grandma's mac and cheese. Pass everything left.",
                },
                {
                    time: "8:30 PM",
                    title: "Dancing, obviously",
                    description:
                        "The DJ has our list and a do-not-play list. Late-night tamales roll in at eleven; the last song is at one.",
                },
            ],
        },
        {
            label: "Sunday, June 13",
            events: [
                {
                    time: "11:00 AM",
                    title: "Recovery brunch in Priya's parents' backyard",
                    description:
                        "Dosas, bagels, and coffee strong enough to fix Saturday. Come as you are — sunglasses encouraged.",
                },
            ],
        },
    ],
    venues: [
        {
            name: "The Fulton Street Loft",
            role: "Ceremony, dinner & dancing",
            address: "1215 W Fulton Market, Chicago, IL 60607",
            description:
                "An old spice warehouse with brick walls, a skylight over the long tables, and a freight elevator we're told can fit a band. The roof deck is where cocktails happen.",
            image: photo(
                "venue-loft",
                1600,
                1200,
                "A brick loft with a glass skylight set with long wooden tables, pink flowers, and bistro lights",
            ),
            mapUrl: "https://maps.google.com/?q=1215+W+Fulton+Market%2C+Chicago%2C+IL+60607",
        },
        {
            name: "Kedzie Lanes",
            role: "Friday welcome night",
            address: "3159 N Kedzie Ave, Chicago, IL 60618",
            description:
                "Eight lanes, wood paneling, and the best bad pizza on the Northwest Side. Our friends have been losing to Priya here since 2020.",
            image: photo(
                "venue-bowling",
                1600,
                1200,
                "Friends cheering and dancing in a retro bowling alley bar, a woman in a pink dress mid-twirl",
            ),
            mapUrl: "https://maps.google.com/?q=3159+N+Kedzie+Ave%2C+Chicago%2C+IL+60618",
        },
    ],
}

export interface Hotel {
    name: string
    description: string
    /** "10 minutes from the loft" — the decision the guest is making. */
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
    headline: "Getting here, crashing here.",
    intro: "Fly into O'Hare or Midway, grab the train, and you're basically at the party. We held rooms at three places near the loft.",
    gettingThere: [
        "By plane: O'Hare and Midway both work. From O'Hare the Blue Line gets you downtown in about forty minutes for five bucks; from Midway it's the Orange Line, twenty-five.",
        "Around town: the L is your friend — the loft is three blocks from the Morgan stop (Green and Pink lines). Parking in Fulton Market is a sport; skip it and cab home.",
    ],
    hotels: [
        {
            name: "The Morgan Street Hotel",
            description:
                "Right in Fulton Market — walkable to the loft, a rooftop pool, and the lobby bar where Friday night will probably end.",
            distance: "5-minute walk from the loft",
            blockNote: "Use code PRIYAMARCUS for the block rate through May 1.",
            url: "https://example.com/morgan-street-hotel",
        },
        {
            name: "Kinzie Street Inn",
            description:
                "Quieter, cheaper, with huge windows over the river. Ten minutes by cab, and they do a free breakfast worth waking up for.",
            distance: "10 minutes from the loft",
            blockNote: "Use code PRIYAMARCUS for the block rate through May 1.",
            url: "https://example.com/kinzie-street-inn",
        },
        {
            name: "Logan Square Guesthouse",
            description:
                "A few rooms above a coffee shop in our old neighborhood, near the bar where it all started. Best for anyone staying the week.",
            distance: "20 minutes by Blue Line",
            url: "https://example.com/logan-square-guesthouse",
        },
    ],
    thingsToDo: [
        {
            title: "Take the river architecture boat",
            body: "Ninety minutes on the Chicago River, craning at buildings. Marcus will explain the ones they skip.",
        },
        {
            title: "Eat a hot dog the correct way",
            body: "Mustard, onions, relish, tomato, pickle, sport peppers, celery salt. No ketchup. We will know.",
        },
        {
            title: "Find a jazz night uptown",
            body: "The old clubs in Uptown still run sets past midnight. All that jazz, as promised.",
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
    headline: "The crew.",
    intro: "The people who held the umbrella, helped carry the couch, and voted on the playlist. Stand near them at dinner.",
    members: [
        {
            name: "Anjali Raman",
            role: "Maid of honor",
            bio: "Priya's big sister, keeper of every embarrassing story since 1996, and the only person allowed to edit the vows.",
        },
        {
            name: "Darnell Whitaker",
            role: "Best man",
            bio: "Marcus's cousin and former karaoke partner, who swears the duet was his idea.",
        },
        {
            name: "Sofia Álvarez",
            role: "Bridesmaid",
            bio: "Priya's college roommate, who drove the road trip after the car died and the rental after that.",
        },
        {
            name: "Kenji Mori",
            role: "Groomsman",
            bio: "Marcus's bandmate and the DJ of last resort. Has already made a playlist called “do not play this.”",
        },
        {
            name: "Leah Goldberg",
            role: "Bridesmaid",
            bio: "Priya's work wife and the reason we have a photo booth at all.",
        },
        {
            name: "Tomás Reyes",
            role: "Groomsman",
            bio: "Lived downstairs in Pilsen. Heard everything. Brought earplugs to the housewarming as a gift.",
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
    headline: "Registry (a.k.a. new pans).",
    intro: "Showing up is plenty. If you insist: pans that survive Marcus, and a honeymoon we've been promising ourselves since the karaoke bar.",
    links: [
        {
            name: "The kitchen, rebuilt",
            description: "Real pans, a fire extinguisher (serious), and a couch that fits up the stairs.",
            url: "https://example.com/registry/kitchen",
        },
        {
            name: "The honeymoon fund",
            description: "Two weeks in Kerala visiting family, then Lisbon — pastries mostly.",
            url: "https://example.com/registry/honeymoon",
        },
    ],
}

export const rsvp = {
    headline: "Okay — are you in?",
    body: "One reply per invitation, please. Names like they are on the envelope; tell us about your people and your feet (dancing shoes, yes or no).",
    /** ISO reply-by date the clock engine counts toward; label as printed. */
    replyByIso: "2027-05-01",
    replyByLabel: "May 1, 2027",
    confirmation:
        "Got it — you're on the list! Changed your mind? Just send it again with the same name and we'll take the newest answer.",
    /** The guest-facing form; delivers through the managed forms pipeline. */
    fields: [
        { name: "name", label: "Your name(s)", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        {
            name: "attending",
            label: "You coming?",
            type: "select",
            required: true,
            options: ["Wouldn't miss it", "Can't make it — sending love"],
        },
        {
            name: "guests",
            label: "How many of you",
            type: "select",
            required: true,
            options: ["1", "2", "3", "4"],
        },
        {
            name: "dinner",
            label: "Dinner",
            type: "select",
            options: ["Everything, family style", "Vegetarian", "Vegan", "Gluten-free"],
            placeholder: "Pick one",
        },
        {
            name: "song",
            label: "One song that gets you on the floor",
            placeholder: "The DJ reads every one of these",
        },
        {
            name: "notes",
            label: "Allergies, kids, anything else",
            type: "textarea",
            fullWidth: true,
        },
    ] satisfies MarketingLeadFormField[],
    faqs: [
        {
            question: "Can I bring a plus-one?",
            answer: "If your invitation has “& guest” on it, yes — put both names on the reply. If not, it's a loft-capacity thing, not a you thing.",
        },
        {
            question: "What's the dress code?",
            answer: "Party best — whatever you'd dance in. Suits, jumpsuits, saris, sneakers, all good. It's a warehouse in June: leave the stilettos, bring a layer for the roof.",
        },
        {
            question: "Are kids invited?",
            answer: "The nieces and nephews in the wedding party, yes. Otherwise it's a grown-ups night — the hotels can recommend sitters, and Sunday brunch is all ages.",
        },
        {
            question: "Is there really a photo booth?",
            answer:
                "Obviously. It's open from cocktails to last song, props included. Tag everything " +
                couple.hashtag +
                " — the blurry ones are our favorites.",
        },
        {
            question: "Can I take photos during the ceremony?",
            answer: "Yes! No unplugged rule. Just don't block the aisle — Priya's grandma has the good seat.",
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
    finalCtaTitle: "Save us a dance.",
    /** The home page's story heading. */
    storyHeading: "The story so far",
    /** The home page's schedule teaser heading. */
    scheduleHeading: "The weekend",
    /** The home page's hotels heading. */
    hotelsHeading: "Where to crash",
    /** The schedule page's venue heading. */
    venuesHeading: "Where it all happens",
    /** The travel page's headings. */
    gettingThereTitle: "Take the L. Trust us.",
    thingsToDoTitle: "While you're in town",
    /** The RSVP form's title, and the questions' kicker and title (the zine home repeats them). */
    rsvpFormTitle: "Fill it out, fold it up",
    faqKicker: "Real questions",
    faqTitle: "Asked & answered",
    /** The nav label for the /party page. */
    partyNavLabel: "Registry",
}
