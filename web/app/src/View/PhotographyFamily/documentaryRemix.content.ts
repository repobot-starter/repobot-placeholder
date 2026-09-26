import type { AppointmentsContent } from "../Landing/practiceDocument"

/**
 * The photography-family-documentary remix seed (packs/README.md "Derived
 * templates"): compose copies this file byte-for-byte over the
 * family-photography pack's `content.ts`, so it is a structural twin of
 * that module (tests/View/PhotographyFamily/documentaryRemixSeed.test.ts).
 *
 * The family-photography pack's single content file: photographer, pages,
 * albums, day offerings, and the booking contract. Public pages render
 * from here — edit this file (not the page components) to make the site
 * yours. Live client galleries do not: they load from the platform
 * proofing door. `demoProofingAlbums` below is fixture data for baked
 * previews only.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/photography-family-documentary` (see PACK.md). The
 * `photo` helper mirrors that verb's naming exactly, so an entry is three
 * arguments, not eight lines. Never point a slot at a raw camera file.
 *
 * Captions are the lines written on the prints' white borders in the
 * snapshot register ("pancake disaster, 9:14am") — short, lower-case,
 * the way you'd label a photo on the fridge. Sequence each album the way
 * the day went: the gallery keeps array order.
 *
 * `home.layout` picks the home page's composition: `pinboard` (this
 * site's) opens on the pile of taped prints and runs the scrapbook wall,
 * the albums, the lengths of day, the day rail, and the checklist;
 * `crossfade` is the photo-led stack — the full-bleed slideshow hero, a
 * justified selected-work wall, the introduction, the albums, one kind
 * word, and a booking banner.
 */

export interface PhotoImage {
    src: string
    alt: string
    width: number
    height: number
    srcSet: { src: string; width: number }[]
    caption?: string
}

export interface Album {
    slug: string
    title: string
    /** Small label on the cover tile, e.g. the kind of day. */
    eyebrow: string
    description: string
    /** First image is the album's cover. */
    images: PhotoImage[]
}

/** The width ladder `npm run image -- responsive` emits by default. */
const LADDER = [640, 1024, 1600, 2400]

/** A responsive-verb image entry from its name and intrinsic size. */
function photo(name: string, width: number, height: number, alt: string, caption?: string): PhotoImage {
    const widths = [...new Set(LADDER.map((step) => Math.min(step, width)))]
    return {
        src: `/photography-family-documentary/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({
            src: `/photography-family-documentary/${name}-${step}w.webp`,
            width: step,
        })),
        ...(caption !== undefined ? { caption } : {}),
    }
}

export const photographer = {
    name: "Hattie Moreau",
    tagline: "Documentary family photography",
    location: "Chicago, Illinois",
    email: "hello@hattiemoreau.example",
    instagram: "https://instagram.com/hattiemoreau.photo",
}

/**
 * Landing copy the photographer's voice owns: the headings, kickers, and
 * button labels the page builders render around the content below. A
 * remix seed retrades these with everything else. Fields left "" are
 * dropped (the `home.tiers*`, `home.day*`, and `home.expect*` headings
 * only render in the `pinboard` home).
 */
export const landingCopy = {
    nav: {
        /** The masthead layout: `centered` wordmark over links, or `split`. */
        variant: "split" as "centered" | "split",
        /** Set beside the wordmark; "" for the name alone. */
        tagline: "— Family Photography",
    },
    /** Every booking button on the site. */
    bookCta: "Book a day with us",
    /** The /book page's title in the browser tab. */
    bookPageTitle: "Book a day",
    /** The inner pages' statement-hero accent (`none` | `last-word`). */
    heroAccent: "last-word" as "none" | "last-word",
    home: {
        primaryCta: "See the days",
        selectedWorkKicker: "real days, real people",
        selectedWorkTitle: "Other people's Saturdays.",
        collectionsKicker: "galleries of real days",
        collectionsTitle: "Whole days, in the order they happened.",
        tiersKicker: "a day with us",
        tiersTitle: "Pick a length of day.",
        dayKicker: "how a day goes",
        dayTitle: "Breakfast to bath time.",
        expectKicker: "what to expect",
        expectTitle: "No posing. Keep the mess.",
        expectCardTitle: "Before I come over",
        expectBody: "The whole prep list. That's it.",
        reviewsKicker: "from the fridge doors",
        bannerTitle: "Now booking weekends.",
        bannerBody: "Saturdays go first. Hold one now and we'll plan the rest on a quick call.",
    },
    workPage: {
        headline: "Real days.",
        subheadline:
            "Five whole days, each one sequenced the way it happened. Open one and scroll it start to finish.",
        albumBannerTitle: "Picture your Saturday here.",
    },
    aboutPage: {
        kicker: "about",
        cta: "Book a day with us",
        reviewsKicker: "from the fridge doors",
        reviewsTitle: "What families say",
        bannerTitle: "Let's photograph a totally normal Saturday.",
        bannerCta: "Tell me about your people",
    },
    galleriesPage: {
        stepsKicker: "after your day",
        bannerTitle: "Your gallery starts with a Saturday.",
        bannerBody: "Hold one on the calendar and the rest of this page takes care of itself.",
    },
    investmentPage: {
        offeringsKicker: "three lengths of day",
        stepsKicker: "how it works",
        stepsTitle: "From hello to the fridge door",
        faqKicker: "questions",
    },
    inquirePage: {
        formKicker: "say hi",
    },
}

export const albums: Album[] = [
    {
        slug: "a-saturday",
        title: "One Saturday, start to finish",
        eyebrow: "Day in the life",
        description:
            "Eight frames from the Ashfords' Saturday in Logan Square — cartoons in the big bed, pancakes, a first lap of the alley with no training wheels, the hose war, the fort, popsicles on the stoop, bath, and all four asleep on the couch by nine.",
        images: [
            photo(
                "a-saturday-01",
                2400,
                1800,
                "A girl jumping on an unmade bed while her little brother sits on their laughing dad and mom holds a mug",
                "7:40am, everybody in the big bed",
            ),
            photo(
                "a-saturday-02",
                1152,
                864,
                "A dad flipping pancakes while his son licks batter off a spoon on the counter",
                "pancakes, round two",
            ),
            photo(
                "a-saturday-03",
                1152,
                864,
                "A girl wobbling down a sunny alley on her bike with her mom running behind and her brother on a scooter",
                "no training wheels!!",
            ),
            photo(
                "a-saturday-04",
                1152,
                864,
                "A girl spraying her dad with the garden hose while he hides behind a bucket in the backyard",
                "the hose war (dad lost)",
            ),
            photo(
                "a-saturday-05",
                1152,
                864,
                "A dad playing monster outside a blanket fort strung with lights while his kids shriek inside",
                "fort monster, 2:15pm",
            ),
            photo(
                "a-saturday-06",
                1152,
                864,
                "A family on their brick front stoop, the little boy's face covered in melted popsicle",
                "popsicle o'clock",
            ),
            photo(
                "a-saturday-07",
                1152,
                864,
                "A little boy in a bubble bath wearing a bubble beard while his sister gives him a bubble mohawk",
                "bubble beard",
            ),
            photo(
                "a-saturday-08",
                1152,
                864,
                "The whole family asleep in a heap on the couch in the glow of the TV",
                "9:02pm, out cold",
            ),
        ],
    },
    {
        slug: "new-baby-week",
        title: "A new baby week",
        eyebrow: "New baby",
        description:
            "Not the posed-in-a-basket kind. Day four through day nine at home with Iris — forehead kisses, the dad nap, ten toes counted twice, and dinner eaten standing up at the counter.",
        images: [
            photo(
                "new-baby-week-01",
                1152,
                864,
                "A mother kissing her newborn's forehead on a rumpled couch",
                "day 4, first real kiss",
            ),
            photo(
                "new-baby-week-02",
                1152,
                864,
                "A dad asleep on the couch with his newborn asleep on his chest while his older son watches",
                "the dad nap",
            ),
            photo(
                "new-baby-week-03",
                1152,
                864,
                "A big sister counting her newborn brother's toes on a white blanket",
                "ten toes, counted twice",
            ),
            photo(
                "new-baby-week-04",
                1152,
                864,
                "Parents eating standing up at the kitchen counter with the baby in a carrier",
                "dinner, standing up",
            ),
        ],
    },
    {
        slug: "move-out-day",
        title: "Move-out day",
        eyebrow: "Big days",
        description:
            "The last day in the two-flat where both kids were born: box rides down the sidewalk, pizza on the floor with no plates, one last mark on the doorframe, and the first night on a mattress in the new place.",
        images: [
            photo(
                "move-out-day-01",
                1152,
                864,
                "A boy riding in a cardboard box pulled along the sidewalk beside a moving truck",
                "box express",
            ),
            photo(
                "move-out-day-02",
                1152,
                864,
                "A family eating pizza straight from the box on the floor of an empty apartment",
                "pizza on the floor, no plates",
            ),
            photo(
                "move-out-day-03",
                1152,
                864,
                "A dad marking his daughter's height on a doorframe full of old pencil lines",
                "measuring one last time",
            ),
            photo(
                "move-out-day-04",
                1152,
                864,
                "A family asleep together on a mattress on the floor among moving boxes and string lights",
                "first night, new place",
            ),
        ],
    },
    {
        slug: "grandparents-visit",
        title: "The grandparents' visit",
        eyebrow: "Family",
        description:
            "Abuela and Abuelo came up from San Antonio for two weeks. The hug at the door, braids on the stoop, the card game he always wins, and the whole kitchen on tamale duty.",
        images: [
            photo(
                "grandparents-visit-01",
                1152,
                864,
                "Grandchildren throwing themselves into their grandmother's arms at the front door as their grandfather arrives with suitcases",
                "they're here!!",
            ),
            photo(
                "grandparents-visit-02",
                1152,
                864,
                "A grandmother braiding her granddaughter's hair on the front steps while the girl eats a popsicle",
                "braids before the park",
            ),
            photo(
                "grandparents-visit-03",
                1152,
                864,
                "A grandfather playing cards with his grandkids at the kitchen table, everyone laughing",
                "abuelo wins again",
            ),
            photo(
                "grandparents-visit-04",
                1152,
                864,
                "Three generations of women spreading masa on corn husks in a crowded kitchen",
                "tamale assembly line",
            ),
        ],
    },
    {
        slug: "snow-day",
        title: "Snow day",
        eyebrow: "Weekend",
        description:
            "School called it at 5:30am. Sledding the hill in the park, an ambush by the garages, snow angels in the backyard, and cocoa with far too many marshmallows.",
        images: [
            photo(
                "snow-day-01",
                1152,
                864,
                "A family piled onto two sleds racing down a snowy park hill",
                "the big hill, run six",
            ),
            photo(
                "snow-day-02",
                1152,
                864,
                "A dad getting hit by a snowball from his kids on a snowy city street",
                "ambush by the garages",
            ),
            photo(
                "snow-day-03",
                1152,
                864,
                "A child in a red snowsuit making a snow angel in a backyard",
                "snow angel, 10:20am",
            ),
            photo(
                "snow-day-04",
                1152,
                864,
                "Two kids with rosy cheeks drinking cocoa piled with marshmallows by a radiator",
                "too many marshmallows",
            ),
        ],
    },
]

/**
 * The home hero's pinned-up prints (the `pinboard` pile, biggest first).
 * Each caption is the line written on the print's border; the times make
 * it read like one long day.
 */
export const heroSlides: PhotoImage[] = [
    photo(
        "saturday-pillow-fight",
        2400,
        1800,
        "A dad and his daughter mid-leap in a pillow fight on the bed with feathers flying",
        "pillow fight championship",
    ),
    photo(
        "saturday-pancakes",
        2400,
        1800,
        "A mom and her toddler dancing barefoot through spilled flour on the kitchen floor",
        "pancake disaster, 9:14am",
    ),
    photo(
        "saturday-sprinkler",
        2400,
        1800,
        "Two brothers running through a lawn sprinkler on a sunny afternoon",
        "sprinkler run, 11:03am",
    ),
    photo(
        "saturday-dinner",
        2400,
        1800,
        "A grandmother laughing hard at a crowded family dinner table",
        "best laugh at dinner",
    ),
]

/**
 * The home page's selected work, pinned up as prints: a cross-album edit
 * sequenced by hand, each frame keeping its album caption.
 */
export const selectedWork: PhotoImage[] = [
    photo(
        "saturday-kitchen-dance",
        1152,
        864,
        "A dad spinning his daughter around the kitchen while her sister claps",
        "kitchen dance party",
    ),
    albums[1].images[1],
    albums[4].images[1],
    albums[0].images[5],
    albums[3].images[3],
    albums[2].images[0],
    albums[0].images[6],
    albums[4].images[3],
]

export const home = {
    /** The home composition: `pinboard` or `crossfade` (see the header). */
    layout: "pinboard" as "crossfade" | "pinboard" | "builder" | "specimens",
    badge: "Chicago documentary family photographer",
    /** Line breaks are kept; the last line takes the red marker. */
    headline: "Not a\nportrait.\nYour Saturday.",
    /** Where the hero headline's accent lands (`none` | `last-word` | `last-line`). */
    accent: "last-line" as "none" | "last-word" | "last-line",
    subheadline:
        "Candid, chaotic, joyful everyday family life — pancakes, pillow fights, the whole mess. No posing. Just your people, the way they really are.",
    /** Scribbled on the page beside the prints (`pinboard` only; null drops it). */
    scribble: "no perfect houses, no perfect poses — just your people." as string | null,
    /** The sticky note on the pile: first line small, the last circled (null drops it). */
    note: "now booking\nweekends!" as string | null,
    intro: {
        kicker: "hi, I'm Hattie",
        title: "I show up for breakfast and stay till the bath.",
        paragraphs: [
            "I'm a documentary family photographer in Chicago. I don't bring props or a backdrop, and I will never ask anyone to say cheese. I come over for a morning, an afternoon, or the whole day and photograph what your family actually does with it.",
            "The flour on the floor, the fort that took over the living room, the grandpa who cheats at cards — that's the stuff you'll want in twenty years. So we keep it all.",
        ],
    },
    /** "What to expect" on the home page: four promises, one line each. */
    expect: [
        {
            title: "No posing",
            body: "Nobody lines up, nobody says cheese. I'll ask you to do nothing but carry on.",
        },
        {
            title: "Keep the mess",
            body: "Don't clean for me. The laundry pile and the cereal on the floor are part of the story.",
        },
        {
            title: "Everyone's in it",
            body: "The parent who's always behind the phone gets to be in the pictures for once. So does the dog.",
        },
        {
            title: "You'll forget I'm there",
            body: "Give it twenty minutes. Kids stop performing, grown-ups stop noticing, and the real day starts.",
        },
    ],
    /** "How a day goes": the rail of prints, each hung from a clock time. */
    day: [
        {
            label: "7:40am",
            title: "I show up early",
            body: "Pajamas, cartoons, coffee. Nobody gets dressed on my account.",
            image: 0,
        },
        {
            label: "9:14am",
            title: "Breakfast happens",
            body: "Usually loudly. Sometimes with flour on the ceiling.",
            image: 1,
        },
        {
            label: "2:15pm",
            title: "The big middle",
            body: "Parks, errands, forts, naps — whatever your Saturday really is.",
            image: 4,
        },
        {
            label: "9:02pm",
            title: "Lights out",
            body: "Bath, books, the couch pile. I sneak out; your gallery comes in two weeks.",
            image: 7,
        },
    ],
    /**
     * The session builder (`builder` only): groups of photograph tiles the
     * visitor ticks — a pick-one session, then keepsakes and extras — beside
     * a summary card with the running total and the booking ask. Prices are
     * printed strings ("$650"); a line without a number ("Included") ticks
     * but adds nothing. null drops it.
     */
    builder: null as {
        kicker: string
        title: string
        intro: string
        summaryTitle: string
        totalLabel: string
        footnote: string
        groups: {
            heading: string
            choose: "one" | "many"
            items: { name: string; note?: string; price: string; image: PhotoImage; selected?: boolean }[]
        }[]
    } | null,
    /**
     * The prints (`specimens` only): one sitting printed in each process
     * the studio offers — the process, one line on the paper or plate, and
     * the price it starts from. null drops it.
     */
    prints: null as {
        kicker: string
        title: string
        items: { name: string; note: string; price: string; image: PhotoImage }[]
    } | null,
}

export const about = {
    headline: "The one lying on your kitchen floor.",
    portrait: photo(
        "about-hattie",
        864,
        1152,
        "Hattie Moreau lying on a living-room rug photographing, a baby climbing on her back and a dog sniffing her hair",
    ),
    paragraphs: [
        "I spent ten years photographing weddings before I realized the best frames were never at the ceremony — they were the kids asleep under the table after. Now I only photograph the everyday: breakfasts, bath times, snow days, moving days.",
        "I work all over Chicago and the near suburbs, on foot and by train, with one small camera and no flash stand. Most sessions happen on a Saturday. You keep doing your day; I keep up.",
        "Every gallery comes back in the order the day happened, so it reads like a story, not a pile. Most families print an album. A few frame the pancake disaster.",
    ],
    testimonials: [
        {
            quote: "She was there for nine hours and I genuinely forgot about her by lunch. The gallery is our actual Saturday — the fort, the hose, all four of us passed out on the couch. It's the most us we've ever looked.",
            name: "Dana Ashford",
            detail: "Day in the life, Logan Square",
        },
        {
            quote: "We asked for 'the week after the baby, but real.' Hattie photographed the dad nap, the counter dinners, my son counting toes. I didn't brush my hair once and I love every frame.",
            name: "Priya & Sam Okafor",
            detail: "New baby week",
        },
        {
            quote: "My mother flies up once a year. Now we have her braiding my daughter's hair on our stoop, forever. I can't put a price on that, but Hattie's was very fair.",
            name: "Marisol Treviño",
            detail: "Grandparents' visit",
        },
    ],
}

/**
 * The `/investment` page: "a day with us" — three lengths of day, flat
 * prices, how the day goes, and the questions families ask. Prices are
 * whole dollars; exactly one offering stays `highlighted`.
 */
export const investment = {
    headline: "A day with us.",
    body: "Three lengths of day, each priced flat and told up front. Every one includes the planning call, the day itself, a finished gallery in story order, and print rights — no per-photo fees, ever.",
    /** The sticky note on the highlighted offering's card. */
    highlightNote: "most booked!",
    offerings: [
        {
            name: "Half day",
            price: 1150,
            duration: "4 hours",
            description: "A morning or an afternoon — breakfast chaos, or the park and the nap after.",
            includes: [
                "4 hours at home and around your neighborhood",
                "150+ finished photographs",
                "Private online gallery with print rights",
                "Sneak peek within three days",
            ],
            highlighted: false,
        },
        {
            name: "Full day",
            price: 1950,
            duration: "8 hours",
            description: "Breakfast to dinner. Long enough that everyone forgets I'm there.",
            includes: [
                "8 hours, one Saturday, start to finish",
                "300+ finished photographs in story order",
                "Private online gallery with print rights",
                "A 20-page printed storybook",
                "Planning call beforehand",
            ],
            highlighted: true,
        },
        {
            name: "Day in the life",
            price: 2900,
            duration: "Wake-up to lights-out",
            description: "The whole thing, pajamas to pajamas — plus the album it deserves.",
            includes: [
                "Up to 14 hours, first cartoon to last story",
                "450+ finished photographs in story order",
                "A 40-page lay-flat album",
                "Private online gallery with print rights",
                "A second Saturday at half price, any time that year",
            ],
            highlighted: false,
        },
    ],
    steps: [
        {
            title: "We talk",
            body: "A short call: who's in the family, what a normal Saturday looks like, and which one you want.",
        },
        {
            title: "I show up",
            body: "Early, in sneakers, with one small camera. You do your day; I keep up and stay out of the way.",
        },
        {
            title: "You forget I'm there",
            body: "The kids stop performing by mid-morning. That's when the good frames start.",
        },
        {
            title: "The story comes back",
            body: "Your gallery arrives within two weeks, in the order the day happened, ready to pick favorites and print.",
        },
    ],
    faq: [
        {
            question: "Do we need to clean the house?",
            answer: "Please don't. The dishes, the laundry mountain, the drawings taped to every wall — that's what your house looks like, and in twenty years you'll want to remember it.",
        },
        {
            question: "What should we wear?",
            answer: "Whatever you'd wear on a Saturday. Pajamas are welcome. Matching outfits are gently discouraged.",
        },
        {
            question: "What if nothing exciting happens?",
            answer: "Something always does. And if it doesn't, the quiet stuff — a bowl of cereal, a kid reading upside down on the couch — ends up being the favorite.",
        },
        {
            question: "Do you travel outside Chicago?",
            answer: "The city and the near suburbs are included. Farther out, I add travel at cost and we plan around the train.",
        },
        {
            question: "How long until we see the photographs?",
            answer: "A sneak peek within three days, the full gallery within two weeks, storybooks and albums about a month after you choose.",
        },
    ],
}

/**
 * The `appointments` content domain, code fallback — booking mode 2's
 * inputs. Session types carry the slot length they book; the weekly
 * windows are packed back-to-back into concrete capacity-1 slots by
 * `generateAppointmentSlots` (kernel and platform run the same
 * derivation, so the preview offers exactly what a deploy would).
 * A half day books straight off the weekend calendar; full days and
 * day-in-the-life days start with a planning call (they run past the
 * booking domain's longest slot). One provider: one photographer.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "half-day",
            name: "Half day",
            durationMinutes: 240,
            description: "Four hours — a morning or an afternoon",
        },
        {
            typeId: "day-planning-call",
            name: "Full day planning call",
            durationMinutes: 45,
            description: "We pick your Saturday and plan the day",
        },
        {
            typeId: "new-baby-call",
            name: "New baby week call",
            durationMinutes: 30,
            description: "Before baby arrives, we hold the week",
        },
    ],
    providers: [
        {
            providerId: "hattie",
            name: "Hattie Moreau",
            windows: [
                { day: 0, start: 9 * 60, end: 13 * 60 },
                { day: 2, start: 18 * 60, end: 20 * 60 },
                { day: 4, start: 18 * 60, end: 20 * 60 },
                { day: 6, start: 8 * 60, end: 16 * 60 },
            ],
        },
    ],
}

export const book = {
    headline: "Hold a Saturday.",
    intro: "Book a half day straight off the calendar, or grab a quick call to plan a full day or a new baby week. You'll get a confirmation right away, then a short note from me about what happens next (spoiler: not much prep).",
    /** The reassurance line beside the form — honest about what it collects. */
    formNote:
        "Holding a time takes a name and an email, nothing more. No deposit today — we'll settle the rest on our call.",
    /** Below the widget: for the dates the calendar can't hold. */
    flexibleNote:
        "Due any day, or want a weekday instead? Send a note and we'll find a day off the calendar.",
}

/**
 * Demo-only proofing rooms. Baked template previews and the funnel's
 * console preview have no site router, so `/proof` renders from these
 * fixtures when `/__proofing/room` is unreachable. Published sites never
 * authorize against them — the platform door checks the real access code
 * server-side, and the code never ships in the customer bundle.
 *
 * `accessCode` here is a fictional preview PIN so the gate still looks
 * like a real client room. It is not a secret and is never consulted on
 * a published site whose door answers.
 */
export interface DemoProofingAlbum {
    /** Rides `?album=` on /proof; the funnel screenshots this slug. */
    slug: string
    /** Fictional preview PIN. Never a real client's code. */
    accessCode: string
    clientName: string
    title: string
    /** A short note to the client above the gallery. */
    note: string
    images: PhotoImage[]
}

/**
 * A photograph's stable id in demo proofing selections: the processed
 * file's base name ("a-saturday-03"). Live rooms use the door's minted
 * `imageId` instead.
 */
export function photoId(image: PhotoImage): string {
    const file = image.src.split("/").pop() ?? image.src
    return file.replace(/-\d+w\.webp$/, "")
}

/**
 * Demo fixtures for baked previews and the funnel screenshot. The
 * Ashford room is the well-populated client gallery the platform renders
 * when it shows "what Spaceboy runs for you" — their whole Saturday.
 */
export const demoProofingAlbums: DemoProofingAlbum[] = [
    {
        slug: "ashford-family",
        accessCode: "5417",
        clientName: "The Ashford family",
        title: "The Ashfords — one Saturday",
        note: "Here's your Saturday, start to finish. Tap the frames you want in the storybook — as many as you like — and press Send when you're done. I'll finish your picks and we'll lay out the book together.",
        images: [...albums[0].images],
    },
    {
        slug: "iris-first-week",
        accessCode: "8092",
        clientName: "Priya & Sam",
        title: "Iris — the first week",
        note: "Your first week with Iris. Pick the frames you want finished — the counter keeps track — and send them over whenever you surface. No rush at all.",
        images: [...albums[1].images],
    },
]

export const proofing = {
    /**
     * The room's chrome: `register` speaks in the register's own voice
     * (its script face for the studio name, display caps for titles and
     * the button); `quiet` keeps a small tracked studio line and plain
     * headings on a flat page panel.
     */
    voice: "register" as "quiet" | "register",
    /** The gate screen's copy — what a client sees before entering the code. */
    gate: {
        title: "Your gallery",
        body: "This gallery is private — just for your family. Enter the access code from your photographer to see and choose your photographs.",
        placeholder: "Access code",
        cta: "Open gallery",
        checking: "Checking…",
        error: "That code doesn't match this gallery — check the note from your photographer.",
        notFound: "This gallery isn't available — it may have closed. Ask your photographer for a new link.",
        rateLimited: "Too many attempts. Wait a moment and try again.",
        notConfigured: "Client galleries aren't set up yet. Check back shortly.",
    },
    /** The selection tray and confirmation copy. */
    selection: {
        sendCta: "Send favorites",
        namePlaceholder: "Your name",
        emailPlaceholder: "Your email",
        notePlaceholder: "Anything to add about your picks? (optional)",
        confirm: "Send",
        cancel: "Keep choosing",
        sending: "Sending…",
        sendError: "Something went wrong sending your picks — try again in a moment.",
        sentTitle: "Favorites sent.",
        sentBody:
            "Your picks are on their way to the studio. You can come back to this gallery and send an updated selection any time.",
        reopenCta: "Revise favorites",
    },
}

/**
 * The `/galleries` page: client proofing told in plain words — the
 * private gallery arrives by email behind an access code, the family
 * picks favorites, Hattie finishes the picks. The sample section points
 * at the Ashford demo room so any visitor can step through the real gate
 * and try the selection tray. `sample.slug` and `sample.code` derive from
 * the fixture — one source, never drift.
 */
export const galleries = {
    headline: "Then your day comes back.",
    intro: "About two weeks after your day, the whole story lands in a private online gallery — in the order it happened, pancakes to pajamas. Here's how it works from there.",
    steps: [
        {
            title: "It arrives by email",
            body: "You'll get a link to your own gallery and a short access code. It's completely private: only people with the code can open it.",
        },
        {
            title: "Pick favorites",
            body: "Scroll the day on any device and tap the frames you love — the tray keeps count. Send the code to the grandparents; voting is encouraged.",
        },
        {
            title: "I finish them",
            body: "Press Send and your picks come straight to me. I finish every one, then we lay out the storybook or pick what goes on the fridge.",
        },
    ],
    sample: {
        kicker: "try it",
        title: "Step inside a real gallery.",
        body: `This is the Ashfords' Saturday, set up exactly the way yours will arrive. The access code is ${demoProofingAlbums[0].accessCode} — open it, tap a few favorites, and try the tray. It's a sample room, so pick freely.`,
        cta: "Open the sample gallery",
        slug: demoProofingAlbums[0].slug,
        code: demoProofingAlbums[0].accessCode,
    },
}

export const inquire = {
    headline: "Tell me about your people.",
    body: "A few lines is plenty — who's in the family, what a normal Saturday looks like, and roughly when. I answer every note within two days.",
    confirmation: "Got it — thank you. I answer every note within two days.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        {
            name: "session",
            label: "Kind of day",
            placeholder: "Half day, full day, day in the life, new baby week — or not sure yet",
        },
        { name: "date", label: "A Saturday you have in mind", type: "date" as const },
        {
            name: "message",
            label: "About your family",
            type: "textarea" as const,
            fullWidth: true,
            required: true,
        },
    ],
}
