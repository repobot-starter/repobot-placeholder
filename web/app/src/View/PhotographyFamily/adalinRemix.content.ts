import type { AppointmentsContent } from "../Landing/practiceDocument"

/**
 * Ada Lin — the family-photography pack's content seed for the
 * `photography-family-adalin` derived template
 * (packs/photography-family-adalin/catalog.json `contentSeed`). Compose
 * copies this module over `content.ts`, so it is that file's structural
 * twin: same exports, same shapes, Ada's words and photographs.
 * Everything the site renders comes from here — edit this file (not the
 * page components) to make the site yours.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/photography-family-adalin` (see PACK.md).
 *
 * `home.layout` is `builder`: one full-bleed photograph at a rain-soft
 * window, then the session builder (`home.builder`) — the session, the
 * keepsakes, and the extras as photograph tiles beside a running total.
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
    /** Small uppercase label on the cover tile, e.g. a season or a place. */
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
        src: `/photography-family-adalin/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({
            src: `/photography-family-adalin/${name}-${step}w.webp`,
            width: step,
        })),
        ...(caption !== undefined ? { caption } : {}),
    }
}

export const photographer = {
    name: "Ada Lin",
    tagline: "Newborn & motherhood photography",
    location: "Seattle, Washington",
    email: "hello@adalin.example",
    instagram: "https://instagram.com/adalin.studio",
}

/**
 * Landing copy the photographer's voice owns: the headings, kickers, and
 * button labels the page builders render around the content below.
 * Fields left "" are dropped.
 */
export const landingCopy = {
    nav: {
        /** The masthead layout: `centered` wordmark over links, or `split`. */
        variant: "split" as "centered" | "split",
        /** Set beside the wordmark; "" for the name alone. */
        tagline: "",
    },
    /** Every booking button on the site. */
    bookCta: "Reserve your due date",
    /** The /book page's title in the browser tab. */
    bookPageTitle: "Reserve a session",
    /** The inner pages' statement-hero accent (`none` | `last-word`). */
    heroAccent: "none" as "none" | "last-word",
    home: {
        primaryCta: "",
        selectedWorkKicker: "From the studio",
        selectedWorkTitle: "Small hands, soft light.",
        collectionsKicker: "The work",
        collectionsTitle: "",
        tiersKicker: "",
        tiersTitle: "",
        dayKicker: "",
        dayTitle: "",
        expectKicker: "",
        expectTitle: "",
        expectCardTitle: "",
        expectBody: "",
        reviewsKicker: "Kind words",
        bannerTitle: "Due this season? Hold your window now.",
        bannerBody:
            "Babies choose their own dates, so I hold the two weeks around yours and we settle the day once they've arrived.",
    },
    workPage: {
        headline: "The work.",
        subheadline:
            "Newborn mornings and motherhood portraits, each sequenced the way the session unfolded.",
        albumBannerTitle: "Picture your first weeks here.",
    },
    aboutPage: {
        kicker: "About",
        cta: "Reserve your due date",
        reviewsKicker: "Kind words",
        reviewsTitle: "From new parents",
        bannerTitle: "Let's plan the first weeks together.",
        bannerCta: "Write to me",
    },
    galleriesPage: {
        stepsKicker: "After the session",
        bannerTitle: "Your gallery starts with your due date.",
        bannerBody: "Hold a window on the calendar and the rest of this page takes care of itself.",
    },
    investmentPage: {
        offeringsKicker: "Sessions",
        stepsKicker: "How it works",
        stepsTitle: "From your due date to the album",
        faqKicker: "Questions",
    },
    inquirePage: {
        formKicker: "Inquiry",
    },
}

export const albums: Album[] = [
    {
        slug: "first-weeks",
        title: "The First Weeks",
        eyebrow: "Newborn · Studio & home",
        description:
            "Newborn mornings in the daylight studio and at home — the sleepy first weeks, the big sister who can't stop kissing, the grandparents meeting the baby for the first time.",
        images: [
            photo(
                "session-newborn-studio",
                1600,
                1200,
                "New parents laughing on a linen bed with their newborn tucked between them",
            ),
            photo(
                "extra-siblings",
                1600,
                1200,
                "A curly-haired big sister giggling as she kisses her swaddled baby brother",
            ),
            photo(
                "newborn-feet",
                1600,
                1200,
                "A newborn's tiny foot cupped in a parent's hands on white linen",
            ),
            photo(
                "session-fresh48",
                1600,
                1200,
                "A father beaming as he holds his day-old daughter beside her mother's hospital bed",
            ),
            photo(
                "extra-grandparents",
                1600,
                1200,
                "Grandparents laughing on the sofa as they cradle their first grandchild",
            ),
        ],
    },
    {
        slug: "motherhood",
        title: "Motherhood",
        eyebrow: "Motherhood · Maternity",
        description:
            "Motherhood portraits in window light — the last weeks of waiting, the first mornings together, and the toddler who wants to be in every frame.",
        images: [
            photo(
                "session-motherhood",
                1600,
                1200,
                "A mother lying on a white bed laughing as her baby reaches for her face",
            ),
            photo(
                "motherhood-maternity",
                1600,
                1200,
                "An expecting couple laughing by a tall window, his hands over her belly",
            ),
            photo(
                "motherhood-twirl",
                1600,
                1200,
                "A red-haired mother twirling her giggling toddler around the studio",
            ),
            photo(
                "hero-rain-window",
                2400,
                1800,
                "A mother smiling down at her newborn in a sage linen robe by a rain-streaked window",
            ),
            photo(
                "keepsake-gallery",
                1600,
                1200,
                "A mother on the sofa with her baby, laughing at the finished gallery on a tablet",
            ),
        ],
    },
]

/** Home hero: one full-bleed frame at the rain window. */
export const heroSlides: PhotoImage[] = [albums[1].images[3]]

/**
 * The home page's selected-work gallery: a cross-album edit, sequenced by
 * hand. Pull frames from the albums so home and album pages stay in sync.
 */
export const selectedWork: PhotoImage[] = [
    albums[0].images[1],
    albums[1].images[0],
    albums[0].images[0],
    albums[1].images[2],
    albums[0].images[3],
]

export const home = {
    /** The home composition: `crossfade`, `pinboard`, `builder`, or `specimens` (see the header). */
    layout: "builder" as "crossfade" | "pinboard" | "builder" | "specimens",
    badge: "",
    headline: "The first weeks, held in light.",
    /** Where the hero headline's accent lands (`none` | `last-word` | `last-line`). */
    accent: "none" as "none" | "last-word" | "last-line",
    subheadline: "Newborn & motherhood photography in a Seattle daylight studio.",
    /** Scribbled on the page beside the prints (`pinboard` only; null drops it). */
    scribble: null as string | null,
    /** The sticky note on the hero (null drops it). */
    note: null as string | null,
    intro: {
        kicker: "Hello",
        title: "Slow mornings, window light, nobody posing.",
        paragraphs: [
            "I photograph the first weeks the way they actually feel — sleepy, milky, a little overwhelming and completely beautiful. My studio is a north-facing room in Fremont with one big window and a very warm heater.",
            "Sessions follow the baby: feeds, cuddles, the sibling who wants to help. You'll leave with photographs that feel like the days you were in, not a set someone built.",
        ],
    },
    /** "What to expect" promises (`pinboard` only): one line each. */
    expect: [] as { title: string; body: string }[],
    /** "How a day goes" (`pinboard` only): clock-stamped steps, `image` indexing the first album. */
    day: [] as { label: string; title: string; body: string; image: number }[],
    /**
     * The session builder (`builder` only): groups of photograph tiles the
     * visitor ticks — a pick-one session, then keepsakes and extras — beside
     * a summary card with the running total and the booking ask. Prices are
     * printed strings ("$650"); a line without a number ("Included") ticks
     * but adds nothing. null drops it.
     */
    builder: {
        kicker: "",
        title: "Build your session",
        intro: "Choose your session, keepsakes, and extras.",
        summaryTitle: "Your session",
        totalLabel: "Total",
        footnote: "Secure booking · No payment today",
        groups: [
            {
                heading: "Session",
                choose: "one",
                items: [
                    { name: "Newborn, studio", price: "$650", image: albums[0].images[0], selected: true },
                    { name: "Motherhood", price: "$550", image: albums[1].images[0] },
                    { name: "Fresh 48", note: "At the hospital", price: "$750", image: albums[0].images[3] },
                ],
            },
            {
                heading: "Keepsakes",
                choose: "many",
                items: [
                    {
                        name: "Linen heirloom album",
                        price: "$1,200",
                        image: photo(
                            "keepsake-album",
                            1600,
                            1200,
                            "A sage linen album and a box of small prints on a white blanket with eucalyptus",
                        ),
                        selected: true,
                    },
                    {
                        name: "Ten fine-art prints",
                        price: "$480",
                        image: photo(
                            "keepsake-prints",
                            1600,
                            1200,
                            "Black-and-white newborn prints fanned across an oak table beside a pencil",
                        ),
                    },
                    { name: "Digital gallery", price: "Included", image: albums[1].images[4] },
                ],
            },
            {
                heading: "Extras",
                choose: "many",
                items: [
                    { name: "Sibling portraits", price: "$150", image: albums[0].images[1] },
                    { name: "Grandparents", price: "$150", image: albums[0].images[4] },
                ],
            },
        ],
    } as {
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
    headline: "The one with the warm studio.",
    portrait: photo(
        "about-ada",
        1200,
        1600,
        "Ada Lin laughing on a stool by the studio window, her camera in her lap",
    ),
    paragraphs: [
        "I started photographing newborns after my own son was born and I realised the only pictures of those weeks were blurry phone shots taken at 3 a.m. Every gallery I make is the one I wish I'd had.",
        "My studio is a quiet, north-lit room in Fremont — warm, unhurried, stocked with muslin wraps, snacks and a very comfortable chair for feeding. Sessions go at the baby's pace; nobody is ever rushed.",
        "I'm trained in newborn safety and I never pose a baby in a way that isn't natural to them. Parents are in the frames as much as the baby: those are the photographs that end up on the wall.",
    ],
    testimonials: [
        {
            quote: "I was nervous about being photographed eleven days after a C-section. Ada made me tea, turned the heater up and somehow made me look like myself. I cried when the gallery came.",
            name: "Mei & Jordan",
            detail: "Newborn, studio",
        },
        {
            quote: "She photographed our daughter's first day at the hospital and then her first birthday. The album sits on the coffee table and gets opened every week.",
            name: "Priya Raman",
            detail: "Fresh 48 & Motherhood",
        },
        {
            quote: "Our toddler refused to sit still for one second. Ada just followed her around the studio — the twirling photograph is the best picture anyone has ever taken of us.",
            name: "The Keller family",
            detail: "Motherhood session",
        },
    ],
}

/**
 * The `/investment` page: session offerings with flat prices, how a
 * session unfolds, and the questions new parents actually ask. Prices are
 * whole dollars; exactly one offering stays `highlighted`.
 */
export const investment = {
    headline: "Investment.",
    body: "Three sessions, each ending in a hand-finished gallery you own. Keepsakes and extras are priced on their own in the session builder, so you only pay for what you'll keep.",
    /** The badge on the highlighted offering's card; "" for none. */
    highlightNote: "Most booked",
    offerings: [
        {
            name: "Motherhood",
            price: 550,
            duration: "60 minutes",
            description: "Maternity or the first months — window light, you and the little one.",
            includes: [
                "An hour in the daylight studio",
                "30+ hand-finished photographs",
                "Online gallery with print rights",
            ],
            highlighted: false,
        },
        {
            name: "Newborn, studio",
            price: 650,
            duration: "Up to 3 hours",
            description: "In the first two weeks, at the baby's pace, with feeds and cuddles built in.",
            includes: [
                "A slow morning in the warm studio",
                "40+ hand-finished photographs",
                "Parent and sibling frames included",
                "Online gallery with print rights",
            ],
            highlighted: true,
        },
        {
            name: "Fresh 48",
            price: 750,
            duration: "90 minutes",
            description: "The first day or two, photographed quietly at the hospital or birth centre.",
            includes: [
                "On call around your due date",
                "40+ hand-finished photographs",
                "Online gallery within a week",
            ],
            highlighted: false,
        },
    ],
    steps: [
        {
            title: "Reserve your due date",
            body: "Book in your second trimester. I hold the two weeks around your due date and send a short questionnaire.",
        },
        {
            title: "Baby arrives",
            body: "Text me when they're here and we'll pick a morning in the first two weeks — or I'll come to the hospital for a Fresh 48.",
        },
        {
            title: "The session",
            body: "Slow, warm and unposed. We stop for feeds and cuddles as often as the baby wants.",
        },
        {
            title: "Your gallery",
            body: "Hand-finished photographs in a private gallery within two weeks, with prints and the album a click away.",
        },
    ],
    faq: [
        {
            question: "When should we book?",
            answer: "In the second trimester is ideal. I only take a few newborns a month, so I hold the two weeks around your due date and we settle the day once the baby is here.",
        },
        {
            question: "Is the studio safe and warm for a newborn?",
            answer: "Yes. The studio is kept at a baby-friendly temperature, every wrap is washed between sessions, and I never pose a baby in a way that isn't natural and supported.",
        },
        {
            question: "What if the baby needs to feed or won't settle?",
            answer: "Then we feed, cuddle and wait. Sessions are open-ended for exactly that reason — some of my favourite photographs happen during a feed.",
        },
        {
            question: "Can siblings and grandparents join?",
            answer: "Of course — add them in the session builder. Siblings are best at the start, while everyone is fresh.",
        },
    ],
}

/**
 * The `appointments` content domain, code fallback — booking mode 2's
 * inputs. Session types carry the slot length they book; one provider:
 * it's a one-photographer studio.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "newborn-planning",
            name: "Newborn planning call",
            durationMinutes: 30,
            description: "Before baby arrives, we plan the morning",
        },
        {
            typeId: "motherhood-session",
            name: "Motherhood session",
            durationMinutes: 60,
            description: "Maternity or the first months, in the studio",
        },
        {
            typeId: "studio-visit",
            name: "Studio visit",
            durationMinutes: 30,
            description: "See the space and the wraps before you book",
        },
    ],
    providers: [
        {
            providerId: "ada-lin",
            name: "Ada Lin",
            windows: [
                { day: 1, start: 10 * 60, end: 13 * 60 },
                { day: 3, start: 10 * 60, end: 13 * 60 },
                { day: 4, start: 14 * 60, end: 17 * 60 },
            ],
        },
    ],
}

export const book = {
    headline: "Reserve your due date.",
    intro: "Book a planning call or a motherhood session on the studio's real calendar. You'll get a confirmation straight away, then my guide to the session — what to bring, what to wear, and how we'll keep the morning easy.",
    /** The reassurance line beside the form — honest about what it collects. */
    formNote: "Holding a time takes a name and an email, nothing more. No payment is due today.",
    /** Below the widget: for the dates the calendar can't hold. */
    flexibleNote:
        "Due soon or already here? Send a note instead and I'll find you a morning off the calendar.",
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
 * file's base name ("session-motherhood"). Live rooms use the door's minted
 * `imageId` instead.
 */
export function photoId(image: PhotoImage): string {
    const file = image.src.split("/").pop() ?? image.src
    return file.replace(/-\d+w\.webp$/, "")
}

/**
 * Demo fixtures for baked previews and the funnel screenshot. The first
 * room (slug `ashford-family`, the funnel's demo gallery) is the
 * well-populated client gallery the platform renders.
 */
export const demoProofingAlbums: DemoProofingAlbum[] = [
    {
        slug: "ashford-family",
        accessCode: "2604",
        clientName: "Mei & Jordan",
        title: "Mei, Jordan & baby Theo — the first weeks",
        note: "Here's your morning in the studio with Theo. Choose the frames you'd like finished — as many or as few as you want — and press Send when you're done. I'll finish your picks by hand and we'll talk about the album.",
        images: [
            albums[0].images[0],
            albums[0].images[1],
            albums[0].images[2],
            albums[0].images[4],
            albums[1].images[0],
            albums[1].images[3],
            albums[1].images[2],
            albums[0].images[3],
        ],
    },
    {
        slug: "priya-fresh48",
        accessCode: "7319",
        clientName: "Priya & Sam",
        title: "Anika — the first day",
        note: "Your first day with Anika. Pick the frames you want finished — the counter keeps track — and send them whenever you're ready. No rush at all.",
        images: [albums[0].images[3], albums[1].images[1], albums[1].images[4], albums[0].images[2]],
    },
]

export const proofing = {
    /**
     * The room's chrome: `quiet` keeps a small tracked studio line and
     * plain headings on a flat page panel; `register` speaks in the
     * register's own voice (its script face for the studio name, display
     * caps for titles and the button).
     */
    voice: "quiet" as "quiet" | "register",
    /** The gate screen's copy — what a client sees before entering the code. */
    gate: {
        title: "Your gallery",
        body: "This gallery is private — just for your family. Enter the access code from Ada's note to see and choose your photographs.",
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
 * The `/galleries` page: what happens after a session, told to parents in
 * plain words. The sample section points at the first demo room above;
 * `sample.slug` and `sample.code` derive from the fixture.
 */
export const galleries = {
    headline: "Then comes the gallery.",
    intro: "The session is a morning; the gallery is what you keep. Within two weeks a private online gallery of your photographs arrives by email — here's how it works from there.",
    steps: [
        {
            title: "It arrives by email",
            body: "Within two weeks — one for a Fresh 48 — you'll get a link to your own gallery and a short access code. Only the people you share the code with can open it.",
        },
        {
            title: "Choose the ones you love",
            body: "Open it during a night feed if you like. Tap the frames you want finished and the tray keeps count; grandparents get the code too.",
        },
        {
            title: "I finish them by hand",
            body: "Press Send and your picks come straight to me. I finish every one by hand, then we lay out the linen album together.",
        },
    ],
    sample: {
        kicker: "See for yourself",
        title: "Step inside a finished gallery.",
        body: `This is Mei and Jordan's morning with baby Theo, arranged exactly the way your gallery will arrive. The access code is ${demoProofingAlbums[0].accessCode} — open it, tap a few favourites, and try the sending tray.`,
        cta: "Open the sample gallery",
        slug: demoProofingAlbums[0].slug,
        code: demoProofingAlbums[0].accessCode,
    },
}

export const inquire = {
    headline: "Tell me about your little one.",
    body: "A few lines is plenty — your due date, who's in the family, and the kind of session you're imagining. I reply to every note within two working days.",
    confirmation: "Thank you — your note is on its way. I reply to every inquiry within two working days.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        {
            name: "session",
            label: "Session type",
            placeholder: "Newborn, Fresh 48, motherhood — or not sure yet",
        },
        { name: "date", label: "Due date (or baby's birthday)", type: "date" as const },
        {
            name: "message",
            label: "About your family",
            type: "textarea" as const,
            fullWidth: true,
            required: true,
        },
    ],
}
