/**
 * Fiorella Conti — the wedding pack's content seed for the
 * `wedding-fiorella` derived template (packs/wedding-fiorella/catalog.json
 * `contentSeed`). Compose copies this module over `content.ts`, so it is
 * that file's structural twin: same exports, same shapes, Fiorella's
 * words and photographs. Everything the site renders comes from here —
 * edit this file (not the page components) to make the site yours.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/wedding-fiorella` (see PACK.md). The `photo` helper
 * mirrors that verb's naming exactly.
 *
 * The home is the `stack` layout: the frames run edge to edge down the
 * page with each couple's names set over the photograph, and the
 * contact sheets — the editor's grease-pencil picks — carry the
 * selected work and every wedding's page.
 */
import type { AppointmentsContent } from "../Landing/practiceDocument"

export interface PhotoImage {
    src: string
    alt: string
    width: number
    height: number
    srcSet: { src: string; width: number }[]
    caption?: string
    /** Contact-sheet walls only: the grease-pencil mark — `circle` a keeper, `cross` a reject. */
    mark?: "circle" | "cross"
    /** Contact-sheet walls only: the handwritten note under the frame. */
    note?: string
}

export interface Album {
    slug: string
    title: string
    /** Small uppercase label on the cover tile, e.g. venue and month. */
    eyebrow: string
    description: string
    /** First image is the album's cover. */
    images: PhotoImage[]
}

/** The width ladder `npm run image -- responsive` emits by default. */
const LADDER = [640, 1024, 1600, 2400]

/** A responsive-verb image entry from its name and intrinsic size. */
function photo(
    name: string,
    width: number,
    height: number,
    alt: string,
    extra: { caption?: string; mark?: "circle" | "cross"; note?: string } = {},
): PhotoImage {
    const widths = [...new Set(LADDER.map((step) => Math.min(step, width)))]
    return {
        src: `/wedding-fiorella/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/wedding-fiorella/${name}-${step}w.webp`, width: step })),
        ...extra,
    }
}

export const photographer = {
    name: "Fiorella Conti",
    tagline: "Wedding photography on film",
    location: "Ravello, Amalfi Coast",
    email: "studio@fiorellaconti.example",
    instagram: "https://instagram.com/fiorellaconti.film",
}

export const albums: Album[] = [
    {
        slug: "giulia-tom",
        title: "Giulia & Tom",
        eyebrow: "Masseria, Puglia · June",
        description:
            "Three days at a whitewashed masseria outside Ostuni — an olive sprig from her nonna, vows under an olive arch, one long table beneath the pergola, and sparklers in the courtyard until two.",
        images: [
            photo(
                "puglia-ready",
                1600,
                1200,
                "Giulia laughing on an iron bed while her grandmother tucks an olive sprig into her hair",
            ),
            photo(
                "puglia-vows",
                1600,
                1200,
                "Giulia and Tom holding hands under an arch of olive branches, guests in linen in the foreground",
            ),
            photo(
                "puglia-table",
                1600,
                1200,
                "The long table under the vine pergola, guests mid-laugh over plates of lemons and bread",
                { mark: "circle", note: "this one" },
            ),
            photo(
                "puglia-grove",
                1600,
                1200,
                "Giulia running barefoot through the olive grove with her sandals in one hand, Tom reaching for her",
            ),
            photo(
                "puglia-dance",
                1600,
                1200,
                "The courtyard dance under string lights, Giulia spinning in the middle of a clapping circle",
                { mark: "cross" },
            ),
            photo(
                "puglia-night",
                1600,
                1200,
                "Tom carrying Giulia piggyback across the courtyard as guests hold sparklers and cheer",
            ),
        ],
    },
    {
        slug: "chiara-luca",
        title: "Chiara & Luca",
        eyebrow: "Lake Como · September",
        description:
            "A villa wedding on Lake Como that the weather tried to cancel — a wooden boat to the ceremony, a veil the wind wanted, a downpour on the pier, and dinner on the terrace once the storm had passed.",
        images: [
            photo(
                "como-boat",
                1600,
                1200,
                "Chiara and Luca laughing in the back of a wooden boat on Lake Como, her veil lifted by the wind",
            ),
            photo(
                "como-villa",
                1600,
                1200,
                "Running down the villa's garden stairs toward the lake, veil streaming behind",
            ),
            photo(
                "como-rain",
                1600,
                1200,
                "The couple doubled over laughing under one canvas umbrella on the rain-soaked pier",
                { mark: "circle", note: "the rain!" },
            ),
            photo(
                "como-toast",
                1600,
                1200,
                "A toast at the candlelit lakeside table, the far shore's lights coming on across the water",
            ),
        ],
    },
    {
        slug: "amelia-rafe",
        title: "Amelia & Rafe",
        eyebrow: "Ravello · May",
        description:
            "A cliffside wedding above the Amalfi Coast — getting ready with sea air through the shutters, bougainvillea on the stairs to the terrace, confetti over the whole coastline, and a lemon-grove morning after.",
        images: [
            photo(
                "ravello-ready",
                1600,
                1200,
                "Amelia and her bridesmaids laughing in a white room with the shutters open to the sea",
            ),
            photo(
                "ravello-steps",
                1600,
                1200,
                "Amelia and Rafe hurrying down stone steps under a wall of bougainvillea, the coast far below",
                { mark: "circle" },
            ),
            photo(
                "ravello-terrace",
                1600,
                1200,
                "Confetti over the couple on a cypress terrace high above the Amalfi Coast",
            ),
            photo(
                "hero-positano",
                2400,
                1800,
                "Amelia and Rafe laughing under a lemon tree on a Positano terrace, the town stacked down to the sea",
            ),
        ],
    },
]

/** Home hero: one full-bleed frame from the Positano terrace. */
export const heroSlides: PhotoImage[] = [albums[2].images[3]]

/**
 * The home page's contact sheet: a cross-wedding edit, sequenced by hand,
 * with the grease-pencil marks riding each frame. Pull frames from the
 * albums so home and album pages stay in sync.
 */
export const selectedWork: PhotoImage[] = [
    albums[0].images[0],
    albums[1].images[2],
    albums[2].images[1],
    albums[0].images[5],
    albums[1].images[0],
    albums[0].images[2],
    albums[2].images[0],
    albums[0].images[4],
]

export const home = {
    /** `marquee`: the photograph under masthead type; `stack`: full-bleed frames down the page. */
    layout: "stack" as "marquee" | "stack",
    /** The selected-work wall's variant. */
    wall: "contact-sheet" as "scrapbook" | "contact-sheet" | "filmstrip",
    /** Every wedding page's wall: `justified`, the roll as a `contact-sheet`, or the captioned `stack`. */
    albumWall: "contact-sheet" as "justified" | "contact-sheet" | "stack",
    /** Contact-sheet walls: the stock printed along the film edge. */
    edgeCode: "Kodak Portra 400",
    badge: "Film · Amalfi · Como · Puglia",
    headline: "Italian weddings, on film.",
    subheadline: `${photographer.name} — medium-format film and a quiet digital second, one wedding a week.`,
    /** `stack` only: the frames run edge to edge under the hero, each couple's names set over the photograph. */
    stack: [
        { ...albums[0].images[2], caption: "Giulia & Tom · Masseria, Puglia" },
        { ...albums[1].images[0], caption: "Chiara & Luca · Lake Como" },
        { ...albums[2].images[1], caption: "Amelia & Rafe · Ravello" },
    ] as PhotoImage[],
    /** `stack` only: the closing band's photograph under the inquiry line (null = the plain banner). */
    closing: {
        image: photo(
            "lemons-closing",
            2400,
            1800,
            "Hands holding three lemons on an olive branch against a lime-washed wall",
        ),
        position: "50% 50%",
        overlay: "soft",
    } as { image: PhotoImage; position: string; overlay: "soft" | "dark" } | null,
    /** `stack` only: the places, as a spec sheet (empty = none). */
    locations: [] as {
        name: string
        where: string
        season: string
        permit: string
        elevation: string
        hike: string
        coordinates: string
    }[],
    intro: {
        kicker: "The approach",
        title: "Film, and patience.",
        paragraphs: [
            "I photograph weddings on medium-format film, with a quiet digital camera for the dark hours. Film makes me slower and more certain: I wait for the laugh instead of asking for it, and I rarely take the same frame twice.",
            "One wedding a week, never two. The days in between go to the lab, the contact sheets and the grease pencil — every roll is edited by hand before you see a single frame.",
        ],
    },
}

/**
 * The collections: flat prices in euros (the pricing section prints them
 * in `landingCopy.currency`). Keep the middle collection highlighted —
 * it's the honest default, and the page reads better with a spine.
 */
export interface WeddingPackage {
    name: string
    /** Flat price in whole units of `landingCopy.currency`. */
    price: number
    description: string
    features: string[]
    highlighted?: boolean
    badge?: string
}

export const packages: WeddingPackage[] = [
    {
        name: "La giornata",
        price: 9000,
        description:
            "The wedding day itself — from the last minutes of getting ready to the first dance, on film.",
        features: [
            "Ten hours, getting ready to the first dance",
            "Medium-format film with a digital second for the night",
            "Hand-printed contact sheets with my picks marked",
            "A sequenced online gallery within five weeks",
        ],
    },
    {
        name: "Il weekend",
        price: 14500,
        description:
            "Welcome dinner, wedding day and the morning after — the whole story of a destination weekend.",
        features: [
            "Three days, welcome aperitivo to farewell lunch",
            "Two photographers throughout",
            "Contact sheets and a private proofing room for your families",
            "A linen-bound album, printed and bound in Florence",
            "Travel anywhere in Italy included",
        ],
        highlighted: true,
        badge: "Most chosen",
    },
    {
        name: "La settimana",
        price: 19800,
        description:
            "For the week-long gatherings: the arrivals, the boat day, the rehearsal, the wedding and the goodbyes.",
        features: [
            "Up to five days of coverage, planned with you",
            "Two photographers and a film assistant",
            "Portraits of each family, printed as a boxed set",
            "Two albums: yours and your parents'",
            "First priority on 2027 date holds",
        ],
    },
]

export const packagesPage = {
    headline: "Three collections, priced plainly.",
    body: "Every collection is quoted in euros, with travel anywhere in Italy included. Marrying elsewhere in Europe? Ask, and I'll quote the whole thing before you commit to anything.",
    kicker: "Collections",
    faqKicker: "Questions couples ask",
    faqTitle: "Before you write",
}

export const faq = [
    {
        question: "Do you really shoot the whole day on film?",
        answer: "Almost all of it. Medium-format film carries the daylight — getting ready, the ceremony, the portraits, the long lunch — and a quiet digital camera takes over when the candles are the only light. You'll see both in one sequenced gallery, graded to sit together.",
    },
    {
        question: "We don't speak Italian. Is that a problem?",
        answer: "Not at all — I work in English, Italian and French, and I'm happy to be the one who talks to the villa, the boatman and the parish priest. Most of my couples fly in from London, New York and Sydney.",
    },
    {
        question: "When do we see the photographs?",
        answer: "Twenty frames within a week, scanned from the first rolls back from the lab. The contact sheets and the full gallery follow within five weeks — film takes a little longer, and it's worth it.",
    },
    {
        question: "What if it rains?",
        answer: "Then we'll have the best photographs of the weekend. Como in a storm and Puglia in a summer shower made some of my favourite frames — and we'll have a real plan for the ceremony from the first planning call.",
    },
    {
        question: "How do we hold a date?",
        answer: "A signed agreement and a thirty-percent retainer holds it exclusively — one wedding a week means a held date is genuinely off the calendar. The rest is due a month before you travel.",
    },
]

export const about = {
    headline: "The one with the Hasselblad.",
    portrait: photo(
        "about-fiorella",
        1200,
        1600,
        "Fiorella Conti laughing on a stone wall under a lemon tree, a film camera in her lap",
    ),
    paragraphs: [
        "I grew up above my father's print shop in Salerno, learning to read a contact sheet before I could read a menu. I still edit that way: a loupe, a grease pencil, and a long time over every roll.",
        "I photograph around twenty weddings a year — on the Amalfi Coast, around Lake Como and across Puglia — from a small studio in Ravello, with a darkroom in the old cistern downstairs.",
        "The couples who find me want their families photographed as much as themselves: the nonna at the head of the table, the brother who cries at the toast, the long afternoon when nobody wants to leave.",
    ],
    testimonials: [
        {
            quote: "We didn't notice her once all weekend, and then the contact sheets arrived with little red circles around the moments we'd forgotten — my nonna, the sparklers, Tom crying at the arch. We framed the sheet itself.",
            name: "Giulia & Tom",
            detail: "Married at a masseria in Puglia",
        },
        {
            quote: "It poured on our wedding day and Fiorella simply handed us an umbrella and walked us onto the pier. That photograph is the one everybody asks about.",
            name: "Chiara Bellandi",
            detail: "Married on Lake Como",
        },
        {
            quote: "She handled the villa, the boats and the priest in three languages and still found the light on every terrace. The album is the best thing we own.",
            name: "Amelia & Rafe",
            detail: "Married in Ravello",
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
 * file's base name ("puglia-vows"), which is what the photographer's own
 * scans are named — so a selection reads as a usable pick list. Live
 * rooms use the door's minted `imageId` instead.
 */
export function photoId(image: PhotoImage): string {
    const file = image.src.split("/").pop() ?? image.src
    return file.replace(/-\d+w\.webp$/, "")
}

/**
 * Demo fixtures for baked previews and the funnel screenshot. The
 * Giulia & Tom room is the well-populated client gallery the platform
 * renders when it shows "what the studio runs for you".
 */
export const demoProofingAlbums: DemoProofingAlbum[] = [
    {
        slug: "giulia-tom-prints",
        accessCode: "4721",
        clientName: "Giulia & Tom",
        title: "Giulia & Tom — print picks",
        note: "Here are the frames from the masseria your families keep asking about. Choose the ones you'd like printed — as many or as few as you like — and press Send when you're done. I'll print your picks in the darkroom and write about sizes and the album.",
        images: [
            albums[0].images[0],
            albums[0].images[1],
            albums[0].images[2],
            albums[0].images[3],
            albums[0].images[4],
            albums[0].images[5],
        ],
    },
    {
        slug: "chiara-luca-album",
        accessCode: "58302",
        clientName: "Chiara & Luca",
        title: "Lake Como — the album edit",
        note: "The frames I'd put in your album, in order. Select the ones you want to keep and the counter will keep track; send them back and I'll lay out the first spreads within the week.",
        images: [albums[1].images[0], albums[1].images[1], albums[1].images[2], albums[1].images[3]],
    },
]

export const proofing = {
    /** The gate screen's copy — what a client sees before entering the code. */
    gate: {
        title: "Client proofing",
        body: "This gallery is private. Enter the access code from Fiorella's note to view and choose your photographs.",
        placeholder: "Access code",
        cta: "View gallery",
        checking: "Checking…",
        error: "That code doesn't match this gallery — check the note from the studio.",
        notFound: "This gallery isn't available — it may have closed. Write to the studio for a new link.",
        rateLimited: "Too many attempts. Wait a moment and try again.",
        notConfigured: "Client galleries aren't set up yet. Check back shortly.",
    },
    /** The selection tray and confirmation copy. */
    selection: {
        sendCta: "Send selections",
        namePlaceholder: "Your name",
        emailPlaceholder: "Your email",
        notePlaceholder: "Anything to add about your picks? (optional)",
        confirm: "Send",
        cancel: "Keep choosing",
        sending: "Sending…",
        sendError: "Something went wrong sending your picks — try again in a moment.",
        sentTitle: "Selections sent.",
        sentBody:
            "Your picks are on their way to the studio. You can come back to this gallery and send a new selection any time.",
        reopenCta: "Revise selections",
    },
}

/**
 * The /galleries page: the client-facing proofing explainer — what
 * happens after the wedding, in the photographer's own voice. The sample
 * card points at the demo Giulia & Tom room and derives its access code
 * from `demoProofingAlbums`, so the page and the fixture can never drift
 * apart.
 */
const sampleRoom = demoProofingAlbums[0]

export const galleries = {
    headline: "After the wedding, the contact sheets.",
    intro: "Every wedding ends the way my father's print shop taught me: the rolls come back, I mark the keepers in grease pencil, and you get a private gallery of your own where you and your families choose the frames that become prints and the album.",
    steps: [
        {
            title: "The sheets arrive",
            body: "Five weeks after the wedding you'll get a private link and an access code that's yours alone — the contact sheets first, with my circles on them, then the whole sequenced day.",
        },
        {
            title: "Sit with the day",
            body: "The gallery reads like the weekend itself, in order. Mark the frames you keep returning to; your picks save as you go, so parents and grandparents can take their turn tomorrow.",
        },
        {
            title: "Send your picks",
            body: "One press and your selection lands at the studio, with any notes about sizes or the album. I print your picks by hand and lay out the album spreads with you.",
        },
    ],
    sample: {
        kicker: "Client galleries",
        headline: "Walk through a sample.",
        body: `Curious what your families will see? A sample gallery is open for you to try — the same gate, the same choosing, the same send. The access code at the door is ${sampleRoom.accessCode}.`,
        cta: "Open the sample gallery",
        /** Demo room slug — must name a `demoProofingAlbums` room. */
        slug: sampleRoom.slug,
        image: albums[0].images[3],
    },
}

/**
 * The `appointments` content domain, code fallback — the /book page's
 * input, same contract as the photography pack (booking mode 2 on the
 * managed booking kernel). Times are NUMBERS — `day` is the weekday index
 * (0 = Sunday), `start`/`end` minutes since midnight. The catalog's
 * content seed mirrors this export entry for entry.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "first-call",
            name: "A first call",
            durationMinutes: 45,
            description:
                "Forty-five minutes on a video call to hear about the two of you, the place and the weekend you're imagining — and to see whether we're right for each other.",
        },
        {
            typeId: "planning-call",
            name: "Planning call",
            durationMinutes: 60,
            description:
                "An hour on the timeline once you've booked: where the light falls on your venue, when the quiet moments will happen, and which rolls go where.",
        },
        {
            typeId: "venue-walk",
            name: "Venue walk",
            durationMinutes: 120,
            description:
                "Two hours together at your villa or masseria before the wedding — walking the ceremony line, finding the family-portrait wall and making the rain plan a real plan.",
        },
    ],
    providers: [
        {
            providerId: "fiorella-conti",
            name: "Fiorella Conti",
            windows: [
                { day: 2, start: 9 * 60, end: 15 * 60 },
                { day: 3, start: 9 * 60, end: 15 * 60 },
                { day: 4, start: 11 * 60, end: 17 * 60 },
            ],
        },
    ],
}

/**
 * The /book page's copy and art. `sessionImages` fronts each session
 * type's card with a frame from the weddings — art from code, facts from
 * the contract. Keys must stay joined to `codeAppointments.types` type
 * ids; the booking tests hold the join. `notesImage` fronts the
 * how-a-booking-works panel.
 */
export const booking = {
    headline: "Book a call with the studio.",
    intro: "Choose a call, then a time from the studio's real weekday calendar — Fridays to Sundays belong to the weddings. A confirmation with a one-click cancel link arrives by email.",
    sessionImages: {
        "first-call": albums[1].images[3],
        "planning-call": albums[2].images[0],
        "venue-walk": albums[0].images[1],
    } as Record<string, PhotoImage>,
    notesImage: albums[1].images[1],
}

export const inquire = {
    headline: "Tell me about the wedding you're planning.",
    body: "A few lines about the two of you, roughly when, and where in Italy — and I'll reply within two working days with availability and a real quote. If your date is already held, I'll say so straight away and suggest photographers I trust.",
    confirmation:
        "Grazie — your note is on its way. I reply to every inquiry within two working days, usually sooner.",
    fields: [
        { name: "names", label: "Your names", required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        { name: "date", label: "Date (if you have one)", type: "date" as const },
        { name: "venue", label: "Venue or town", placeholder: "A villa, a masseria, or still dreaming" },
        {
            name: "message",
            label: "About the two of you & the weekend",
            type: "textarea" as const,
            fullWidth: true,
            required: true,
        },
    ],
}

/**
 * The site's headings, button labels and closing lines — the copy the page
 * builders print around the content above, so a remix seed retrades the
 * whole site. An empty heading or button drops.
 */
export const landingCopy = {
    nav: {
        /** The masthead layout: `split` letterhead, `centered` wordmark over links, … */
        variant: "centered" as "split" | "centered" | "inline" | "full-width" | "pill-links",
        cta: "Inquire",
    },
    /** The inquiry ask the pages close on. */
    inquireCta: "Inquire",
    /** The softer ask on the about and book pages. */
    startInquiryCta: "Write to the studio",
    /** The currency package prices are in (ISO 4217). */
    currency: "eur",
    home: {
        primaryCta: "",
        secondaryCta: "",
        introCta: "About Fiorella",
        selectedWorkKicker: "From the contact sheets",
        selectedWorkTitle: "The frames I circled.",
        packagesTitle: "Three collections, priced plainly.",
        reviewsKicker: "Kind words",
        weddingsKicker: "Recent weddings",
        locationsKicker: "",
        locationsTitle: "",
        /** The spec sheet's row labels (`stack` with `home.locations`). */
        locationLabels: {
            where: "Where",
            season: "Season",
            permit: "Permit",
            elevation: "Elevation",
            hike: "The walk in",
            coordinates: "Coordinates",
        },
        bannerTitle: "Now booking 2027 — collections from €9,000",
        bannerBody: "",
        bannerCta: "Inquire",
    },
    weddingsPage: {
        headline: "The weddings.",
        subheadline:
            "Three recent weddings, each printed as its contact sheet, in the order the day happened. Open one to see the roll.",
        allCta: "All weddings",
        bannerTitle: "Marrying in Italy? Tell me where.",
    },
    packagesPage: { bannerTitle: "Your date might still be open." },
    galleriesPage: {
        stepsKicker: "How proofing works",
        bannerTitle: "Your contact sheets start with your date.",
    },
    bookPage: {
        notesKicker: "Good to know",
        notesHeadline: "How a booking works.",
        notesBody:
            "The calendar shows the studio's real weekday openings a few weeks out, in Italian time. Hold a time and it's yours — the confirmation email carries a one-click cancel link, and rescheduling is free up to 48 hours before we meet.",
        notesBullets: [
            "First calls and planning calls happen over video, wherever you are",
            "Venue walks happen in person, at your villa or masseria",
            "Wedding dates themselves are held by inquiry, never by the calendar",
        ],
        notesCta: "Ask a question first",
        bannerTitle: "Planning something the calendar can't hold?",
    },
    aboutPage: {
        kicker: "About",
        reviewsKicker: "Kind words",
        reviewsTitle: "From couples and their families",
        bannerTitle: "Let's talk about your wedding.",
    },
    inquirePage: { formKicker: "Inquiry", formTitle: "The details", submit: "Send inquiry" },
}
