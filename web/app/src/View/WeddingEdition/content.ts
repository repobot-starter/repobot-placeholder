/**
 * The Late Edition's single content file: the paper, its staff
 * photographer, the rolls, the rate card. Everything the site renders
 * comes from here — edit this file (not the page components) to make the
 * site yours.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/wedding-edition` (see PACK.md). The `photo` helper
 * mirrors that verb's naming exactly, so an entry is three arguments, not
 * eight lines. Never point a slot at a raw camera file.
 *
 * The voice is a New York tabloid's: headlines in caps, facts that are
 * mostly true, and a photographer who files stories instead of galleries.
 * Keep it funny and keep it kind — the joke is always on the party, never
 * on the couple.
 */

export interface PhotoImage {
    src: string
    alt: string
    width: number
    height: number
    srcSet: { src: string; width: number }[]
    caption?: string
}

/** The width ladder `npm run image -- responsive` emits by default. */
const LADDER = [640, 1024, 1600, 2400]

/** A responsive-verb image entry from its name and intrinsic size. */
function photo(name: string, width: number, height: number, alt: string, caption?: string): PhotoImage {
    const widths = [...new Set(LADDER.map((step) => Math.min(step, width)))]
    return {
        src: `/wedding-edition/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/wedding-edition/${name}-${step}w.webp`, width: step })),
        ...(caption !== undefined ? { caption } : {}),
    }
}

export const photographer = {
    /** The nameplate: the site's name, in the nav and the page titles. */
    paper: "The Late Edition",
    name: "Lou Pressman",
    role: "Staff photographer",
    tagline: "Wedding photography for loud parties",
    location: "Greenpoint, Brooklyn",
    email: "desk@thelateedition.example",
    instagram: "https://instagram.com/thelateedition.nyc",
    /** The paper's motto — runs over the stories under the fold. */
    motto: "All the news that's fit to dance to",
    portrait: photo(
        "photographer",
        1152,
        864,
        "Lou Pressman in black and white, a flash camera raised, at the edge of a crowded dance floor",
    ),
}

/**
 * One frame on a contact sheet. `mark` is the grease pencil — `circle`
 * for a keeper, `cross` for a reject — and `note` is what got scrawled
 * under it. Both are optional; most frames go unmarked.
 */
export interface Frame {
    image: PhotoImage
    mark?: "circle" | "cross"
    note?: string
}

/**
 * A wedding, filed as a roll of film. The weddings page prints each roll
 * as a contact sheet in array order — sequence it the way the night
 * happened. `edgeCode` is the stock printed along the film edge and
 * `firstFrame` the number on the first exposure.
 */
export interface Roll {
    slug: string
    /** The roll number the sheet is filed under ("Roll 36"). */
    number: number
    /** The couple — the sheet's headline. */
    title: string
    /** Small caps over the sheet: neighborhood and month. */
    eyebrow: string
    /** The roll's story, one or two sentences — runs on the weddings index. */
    description: string
    edgeCode: string
    firstFrame: number
    frames: Frame[]
}

export const rolls: Roll[] = [
    {
        slug: "maya-theo",
        number: 36,
        title: "Maya & Theo",
        eyebrow: "Greenpoint · June",
        description:
            "A Greenpoint dive, a loft upstairs, and a dance floor that closed when the super said so. Grandma won the night.",
        edgeCode: "Kodak Portra 400",
        firstFrame: 12,
        frames: [
            {
                image: photo(
                    "lead-chairs",
                    1152,
                    864,
                    "Maya and Theo hoisted on chairs above a packed dance floor, flash-lit, arms in the air",
                ),
                mark: "circle",
                note: "FRONT PAGE",
            },
            {
                image: photo(
                    "bar-shots",
                    1152,
                    864,
                    "A row of guests slamming shots down on a bar under neon light",
                ),
            },
            {
                image: photo(
                    "bestman",
                    1152,
                    864,
                    "The best man mid-speech, microphone in one hand and a beer in the other, the room in stitches",
                ),
                note: "p.3 — 'mostly true'",
            },
            {
                image: photo(
                    "grandma",
                    864,
                    1152,
                    "Grandma in sequins dancing hard in the middle of the floor while guests cheer around her",
                ),
                mark: "circle",
                note: "GRANDMA!!",
            },
            {
                image: photo("cake", 1152, 864, "The couple feeding each other cake, frosting on both noses"),
                mark: "cross",
                note: "dad blinked",
            },
            {
                image: photo("dog", 864, 1152, "A dog in a tiny bow tie sitting proudly on the dance floor"),
                mark: "circle",
                note: "GOOD BOY",
            },
            {
                image: photo(
                    "street-run",
                    864,
                    1152,
                    "Maya and Theo running down a Greenpoint street at night, her dress hitched up, streetlights streaking",
                ),
            },
        ],
    },
    {
        slug: "dani-marcus",
        number: 37,
        title: "Dani & Marcus",
        eyebrow: "Bushwick · September",
        description:
            "A Bushwick warehouse, a sparkler tunnel, and an after-party on the L train that the MTA need not hear about.",
        edgeCode: "Kodak Portra 800",
        firstFrame: 4,
        frames: [
            {
                image: photo(
                    "loft-ready",
                    1152,
                    864,
                    "Dani getting ready in a sunlit warehouse loft, friends zipping her dress and laughing",
                ),
            },
            {
                image: photo(
                    "bride-jump",
                    1280,
                    720,
                    "Dani jumping mid-air on the warehouse dance floor, veil flying, the crowd blurred behind her",
                ),
                mark: "circle",
                note: "KEEPER",
            },
            {
                image: photo(
                    "sparklers",
                    1152,
                    864,
                    "Guests holding sparklers in a tunnel as the couple runs through",
                ),
                mark: "circle",
                note: "run it big",
            },
            {
                image: photo(
                    "subway-party",
                    1152,
                    864,
                    "The wedding party dancing in a subway car, the bride hanging from the pole",
                ),
                note: "L train, 1am",
            },
            {
                image: photo(
                    "taxi-kiss",
                    1152,
                    864,
                    "Dani and Marcus kissing in the back of a yellow cab, city lights smeared through the window",
                ),
                mark: "circle",
                note: "cover?",
            },
        ],
    },
    {
        slug: "priya-sam",
        number: 38,
        title: "Priya & Sam",
        eyebrow: "City Hall → a rooftop · March",
        description:
            "City Hall on a Tuesday, flowers from the bodega, a dollar slice for the reception and a rooftop at dusk.",
        edgeCode: "Kodak Gold 200",
        firstFrame: 21,
        frames: [
            {
                image: photo(
                    "cityhall",
                    864,
                    1152,
                    "Priya and Sam on the steps of the City Clerk's office, license held up like a trophy",
                ),
            },
            {
                image: photo(
                    "bodega-bouquet",
                    864,
                    1152,
                    "Priya holding a bouquet of bodega flowers at the counter, the bodega cat on the register",
                ),
                mark: "circle",
                note: "p.1 below the fold",
            },
            {
                image: photo(
                    "pizza",
                    1152,
                    864,
                    "The couple splitting a dollar slice on the sidewalk in wedding clothes",
                ),
                note: "$1 slice reception",
            },
            {
                image: photo(
                    "rooftop",
                    1152,
                    864,
                    "Priya and Sam dancing on a Brooklyn rooftop at dusk, the Manhattan skyline behind them",
                ),
                mark: "circle",
                note: "THIS ONE",
            },
        ],
    },
]

/**
 * The desk's picks: every circled frame across the rolls, in roll order —
 * the weddings index prints them as one sheet. Circle a frame on its roll
 * and it joins; there is no second list to keep in step.
 */
export const desksPicks: Frame[] = rolls.flatMap((roll) =>
    roll.frames.filter((entry) => entry.mark === "circle"),
)

/** Look a frame up by roll slug and index — keeps story art joined to the sheets. */
function frame(slug: string, index: number): PhotoImage {
    const roll = rolls.find((entry) => entry.slug === slug)
    const found = roll?.frames[index]
    if (found === undefined) {
        throw new Error(`content.ts: no frame ${index} on roll ${slug}`)
    }
    return found.image
}

/** The front page: the lead story. `headline` line breaks are kept. */
export const home = {
    kicker: "Exclusive",
    headline: "Local couple gets hitched,\ndances till 2AM",
    deck: "Witnesses describe open bar, “possessed” grandmother, flash photography some are calling “unreal.”",
    issue: "Vol. 7 · Late City Final",
    leadPhoto: frame("maya-theo", 0),
    caption:
        "Maya and Theo, airborne at 1:47am, Greenpoint. Moments later the chairs were returned to their owners.",
}

/**
 * The stories under the fold — each one a frame from a roll, jumping to
 * its contact sheet. Three stories set as thirds; four or seven open with
 * a lead, two or five with halves (the stories grid does the math).
 */
export interface Story {
    kicker: string
    headline: string
    body: string
    /** The dateline run into the body ("GREENPOINT — …"). */
    dateline: string
    image: PhotoImage
    /** The roll whose sheet the jump line opens. */
    roll: string
}

export const stories: Story[] = [
    {
        kicker: "Toast report",
        headline: "Best man's speech: ‘mostly true’",
        body: "Fact-checkers at table nine confirmed roughly sixty percent of the Atlantic City story. The groom's mother has requested a correction; the groom has requested a copy.",
        dateline: "Greenpoint",
        image: frame("maya-theo", 2),
        roll: "maya-theo",
    },
    {
        kicker: "Dance floor",
        headline: "Grandma outdances DJ",
        body: "Rose K., 84, held the floor through three Whitney songs and one ill-advised limbo. The DJ, visibly shaken, has asked for a rematch.",
        dateline: "Greenpoint",
        image: frame("maya-theo", 3),
        roll: "maya-theo",
    },
    {
        kicker: "Exclusive",
        headline: "Bouquet from bodega, sources confirm",
        body: "Ranunculus, $14.99, plus a bacon-egg-and-cheese for the road. The bodega cat was present but declined to comment.",
        dateline: "Chambers St.",
        image: frame("priya-sam", 1),
        roll: "priya-sam",
    },
]

/**
 * The rate card: flat prices, no billing toggle (the pricing section
 * renders these with `period: ""`). Keep exactly one package highlighted —
 * the page reads better with a spine.
 */
export interface EditionPackage {
    name: string
    /** Flat price in dollars. */
    price: number
    description: string
    features: string[]
    highlighted?: boolean
    badge?: string
}

export const packages: EditionPackage[] = [
    {
        name: "City Hall elopement",
        price: 1600,
        description: "Two hours: the clerk, the steps, the slice after. Any weekday, any borough.",
        features: [
            "Two hours, anywhere in the five boroughs",
            "City Hall plus one spot of your choosing",
            "150+ edited frames within a week",
            "Subway fare's on us",
        ],
    },
    {
        name: "Party only",
        price: 3400,
        description:
            "Four hours from the first round to the last song, for couples who did the paperwork already.",
        features: [
            "Four hours, one photographer, all flash",
            "300+ edited frames in a private gallery",
            "Contact-sheet proofs, grease pencil included",
            "The full edit within three weeks",
        ],
    },
    {
        name: "Full day",
        price: 5800,
        description:
            "Getting ready to last call — up to ten hours, with a second shooter working the dance floor.",
        features: [
            "Up to ten hours with two photographers",
            "700+ edited frames and 20 sneak peeks in 48 hours",
            "One roll of real 35mm film, developed and scanned",
            "A private proofing room for the family's print picks",
        ],
        highlighted: true,
        badge: "Front page",
    },
]

export const pricesPage = {
    headline: "The rate card.",
    body: "Three ways to get covered, priced flat. All five boroughs included — the ferry too. Outside the city, ask and the desk quotes it whole before you sign a thing.",
    kicker: "Rates",
    faqKicker: "Reader questions",
    faqTitle: "Ask the desk",
}

/** The classified ad that closes the home page and the rate card. */
export const classified = {
    kicker: "Classifieds",
    title: "Now booking 2027",
    price: "Full day from $5,800",
    body: "Loud parties, city halls, rooftops, dives. Five boroughs, no posed photos, one wedding a day.",
    finePrint: "30% holds your date. Party-only from $3,400 · City Hall from $1,600.",
    signoff: { name: "Ask for Lou", note: "Replies in two working days" },
}

export const faq = [
    {
        question: "Do you travel outside Brooklyn?",
        answer: "All five boroughs are included in every package — Staten Island ferry too. Jersey, the Hudson Valley and the Catskills get a flat travel fee, quoted up front. Farther than that, I'll bring a passport and a quote.",
    },
    {
        question: "Is there a second shooter?",
        answer: "The full day includes one — usually Dee Alvarez, who works the dance floor while I work the room. Add a second shooter to party-only coverage for $900.",
    },
    {
        question: "When do we get the photos?",
        answer: "Twenty sneak peeks within 48 hours so the morning after isn't so quiet. The full edit lands in three weeks (one week for City Hall), and the proofing room opens the same day.",
    },
    {
        question: "Film or digital?",
        answer: "Digital, mostly — flash on a dance floor at 1am is a digital job. Every full day includes one roll of real 35mm (Portra 400), developed and scanned; extra rolls are $95 each. Either way, every edit is proofed as a contact sheet, grease pencil and all.",
    },
    {
        question: "How do deposits work?",
        answer: "A signed agreement and a 30% retainer holds your date — I shoot one wedding a day, never two. The balance is due two weeks before. Move the date once, for free.",
    },
    {
        question: "Will you pose us?",
        answer: "No. We'll do fifteen minutes of family photos because your grandmother asked nicely. Everything else happens on its own, and I'll be there when it does.",
    },
]

/** Testimonials, run as letters to the editor. */
export const letters = [
    {
        quote: "Sir — I told Lou “no dancing photos of me.” There are forty-one dancing photos of me. I have framed six.",
        name: "Maya R.",
        detail: "Greenpoint",
    },
    {
        quote: "To the editor: my grandmother has asked that the limbo photo be retracted. We have declined. It is on the fridge.",
        name: "Theo K.",
        detail: "Williamsburg",
    },
    {
        quote: "We got married at City Hall on a Tuesday and it looks like a movie. He also found us the best dollar slice in Manhattan, which frankly should be in the contract.",
        name: "Priya & Sam",
        detail: "Chambers St.",
    },
]

export const about = {
    headline: "No posed photos.",
    deck: "Lou Pressman shot nightlife for a Brooklyn weekly for eight years. Then a bartender asked him to shoot her wedding. He never went back.",
    kicker: "Staff photographer",
    title: "On the beat since 2014",
    paragraphs: [
        "I learned to shoot in bars, basements and warehouse shows, where nobody waits for you to find your angle. That's still the job: be there early, stay out of the way, and never miss the moment because you were busy arranging one.",
        "I photograph about thirty weddings a year, mostly after dark and almost all of them loud — Greenpoint dives, Bushwick lofts, City Hall on a Tuesday, a rooftop with a borrowed speaker. One a day, never two.",
        "The couples who call the desk want their party photographed more than they want to be photographed. That's the whole beat.",
    ],
    rules: [
        {
            title: "No posed photos",
            body: "Fifteen minutes of family portraits because Grandma asked. Everything else happens on its own.",
        },
        {
            title: "Flash after dark",
            body: "Direct, on-camera, unapologetic — the way a dance floor actually looks at 1am.",
        },
        {
            title: "The party is the story",
            body: "Speeches, spills, the limbo. If it happened, it's in the edit, sequenced the way the night went.",
        },
        {
            title: "Every roll gets proofed",
            body: "You get the edit as contact sheets first, with my grease-pencil picks, so you see how the story got chosen.",
        },
    ],
}

export const inquire = {
    headline: "File your story.",
    body: "Tell the desk the when, the where and the vibe. Lou answers every inquiry within two working days — usually faster, usually from a bar. If your date's taken, you'll hear that straight away, with names of photographers he trusts.",
    confirmation: "Filed. Your story's on the desk — Lou replies within two working days, usually sooner.",
    fields: [
        { name: "names", label: "Your names", required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        { name: "date", label: "Date (if you have one)", type: "date" as const },
        { name: "venue", label: "Venue", placeholder: "A dive, a loft, City Hall, your aunt's backyard" },
        {
            name: "borough",
            label: "Borough",
            type: "select" as const,
            options: [
                "Brooklyn",
                "Manhattan",
                "Queens",
                "The Bronx",
                "Staten Island",
                "Outside the five boroughs",
            ],
        },
        {
            name: "guests",
            label: "Guest count",
            type: "select" as const,
            options: ["Just us (and a witness)", "Under 50", "50–100", "100–150", "150+"],
        },
        {
            name: "vibe",
            label: "The vibe",
            type: "select" as const,
            options: [
                "Raucous — dancing till 2am",
                "City Hall, then a long lunch",
                "Somewhere in between",
                "Surprise me",
            ],
        },
        {
            name: "message",
            label: "The story so far",
            type: "textarea" as const,
            placeholder: "How you met, who's giving the speech, what could possibly go wrong",
            fullWidth: true,
            required: true,
        },
    ],
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
    /** Rides `?album=` on /proof; part of the link the photographer shares. */
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
 * file's base name ("lead-chairs"), which is what the photographer's own
 * files are named — so a selection reads as a usable pick list. Live
 * rooms use the door's minted `imageId` instead.
 */
export function photoId(image: PhotoImage): string {
    const file = image.src.split("/").pop() ?? image.src
    return file.replace(/-\d+w\.webp$/, "")
}

export const demoProofingAlbums: DemoProofingAlbum[] = [
    {
        slug: "maya-theo-prints",
        accessCode: "3621",
        clientName: "Maya & Theo",
        title: "Maya & Theo — print picks",
        note: "Roll 36, the family edit. Pick the frames you want printed — the grandma ones are non-negotiable — and hit Send when you're done. I'll follow up about sizes.",
        images: rolls[0].frames.map((entry) => entry.image),
    },
    {
        slug: "dani-marcus-picks",
        accessCode: "4187",
        clientName: "Dani & Marcus",
        title: "Dani & Marcus — the wall edit",
        note: "The Bushwick frames your parents keep texting about. Select what you'd like printed; the counter keeps score. Send your picks and proofs go in the mail within the week.",
        images: rolls[1].frames.map((entry) => entry.image),
    },
]

export const proofing = {
    /** The gate screen's copy — what a client sees before entering the code. */
    gate: {
        title: "The proofing room",
        body: "This gallery is private. Enter the access code from the desk to see your photographs and mark the ones you want printed.",
        placeholder: "Access code",
        cta: "Open the sheets",
        checking: "Checking…",
        error: "That code doesn't match this gallery — check the note from Lou.",
        notFound: "This gallery isn't available — it may have closed. Ask the desk for a new link.",
        rateLimited: "Too many attempts. Wait a moment and try again.",
        notConfigured: "Client galleries aren't set up yet. Check back shortly.",
    },
    /** The selection tray and confirmation copy. */
    selection: {
        sendCta: "Send picks to the desk",
        namePlaceholder: "Your name",
        emailPlaceholder: "Your email",
        notePlaceholder: "Anything to add about your picks? (optional)",
        confirm: "Send",
        cancel: "Keep choosing",
        sending: "Sending…",
        sendError: "Something went wrong sending your picks — try again in a moment.",
        sentTitle: "Picks filed.",
        sentBody:
            "Your picks are on the desk. Come back any time to revise them and send an updated selection.",
        reopenCta: "Revise picks",
    },
}

/**
 * The rate card's proofing note: what happens after the party, with the
 * sample room's code derived from the fixture so the page and the room
 * can never drift apart.
 */
const sampleRoom = demoProofingAlbums[0]

export const proofingNote = {
    kicker: "After the party",
    headline: "The proofing room.",
    body: `Three weeks after the wedding you get a private link and a code of your own. Your families mark the frames they want printed, and the picks land on the desk the moment they hit Send. Try the sample room — the code at the door is ${sampleRoom.accessCode}.`,
    cta: "Open the sample room",
    /** Demo room slug — must name a `demoProofingAlbums` room. */
    slug: sampleRoom.slug,
    image: frame("dani-marcus", 4),
}
