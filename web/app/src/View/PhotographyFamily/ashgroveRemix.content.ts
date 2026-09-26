import type { AppointmentsContent } from "../Landing/practiceDocument"

/**
 * Ashgrove Portrait Studio — the family-photography pack's content seed
 * for the `photography-family-ashgrove` derived template
 * (packs/photography-family-ashgrove/catalog.json `contentSeed`). Compose
 * copies this module over `content.ts`, so it is that file's structural
 * twin: same exports, same shapes, Ashgrove's words and photographs.
 * Everything the site renders comes from here — edit this file (not the
 * page components) to make the site yours.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/photography-family-ashgrove` (see PACK.md).
 *
 * `home.layout` is `specimens`: one full-bleed black-and-white frame of
 * the studio's 8x10 camera and a family, then the prints (`home.prints`) —
 * one sitting printed four ways, each process matted like a museum print
 * with its note and price on a plaque.
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
        src: `/photography-family-ashgrove/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({
            src: `/photography-family-ashgrove/${name}-${step}w.webp`,
            width: step,
        })),
        ...(caption !== undefined ? { caption } : {}),
    }
}

export const photographer = {
    name: "Ashgrove",
    tagline: "Portrait Studio",
    location: "Hudson, New York",
    email: "sittings@ashgrove.example",
    instagram: "https://instagram.com/ashgrove.portraits",
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
    bookCta: "Book a sitting",
    /** The /book page's title in the browser tab. */
    bookPageTitle: "Book a sitting",
    /** The inner pages' statement-hero accent (`none` | `last-word`). */
    heroAccent: "none" as "none" | "last-word",
    home: {
        primaryCta: "",
        selectedWorkKicker: "Recent sittings",
        selectedWorkTitle: "Four generations, one plate at a time.",
        collectionsKicker: "The archive",
        collectionsTitle: "",
        tiersKicker: "",
        tiersTitle: "",
        dayKicker: "",
        dayTitle: "",
        expectKicker: "",
        expectTitle: "",
        expectCardTitle: "",
        expectBody: "",
        reviewsKicker: "From the sitters",
        bannerTitle: "The sitting takes two hours. Prints are ready in six weeks.",
        bannerBody: "",
    },
    workPage: {
        headline: "The archive.",
        subheadline: "Sittings made on the 8x10 in the mill, and the same families printed four ways.",
        albumBannerTitle: "Sit for yours.",
    },
    aboutPage: {
        kicker: "The studio",
        cta: "Book a sitting",
        reviewsKicker: "From the sitters",
        reviewsTitle: "Families who sat",
        bannerTitle: "Come and see the darkroom.",
        bannerCta: "Write to the studio",
    },
    galleriesPage: {
        stepsKicker: "After the sitting",
        bannerTitle: "Every print starts with a sitting.",
        bannerBody: "Book a morning in the mill and the rest of this page follows in six weeks.",
    },
    investmentPage: {
        offeringsKicker: "Sittings",
        stepsKicker: "How a sitting goes",
        stepsTitle: "From the sitting to the finished print",
        faqKicker: "Questions",
    },
    inquirePage: {
        formKicker: "Inquiry",
    },
}

export const albums: Album[] = [
    {
        slug: "sittings",
        title: "Sittings",
        eyebrow: "The mill studio · 8x10",
        description:
            "Families, couples and one very patient sheepdog, photographed on the big camera in the north light of an old Hudson mill.",
        images: [
            photo(
                "sitting-generations",
                1600,
                1200,
                "A grandmother laughing behind her hand beside her granddaughter on a wooden bench",
            ),
            photo(
                "sitting-baby",
                1600,
                1200,
                "Two young parents laughing as their baby grabs his father's chin, in black and white",
            ),
            photo(
                "sitting-brothers",
                1600,
                1200,
                "Two brothers tumbling over a wooden armchair by the mill window, one upside down",
            ),
            photo(
                "sitting-couple",
                1600,
                1200,
                "An older couple leaning together and laughing, his beard against her shawl",
            ),
            photo(
                "sitting-dog",
                1600,
                1200,
                "A girl in a pinafore laughing as a shaggy sheepdog licks her cheek on the studio floor",
            ),
        ],
    },
    {
        slug: "the-prints",
        title: "The Prints",
        eyebrow: "Four processes · One sitting",
        description:
            "One family's sitting printed four ways in the darkroom — silver gelatin, platinum palladium, a tintype and a cyanotype.",
        images: [
            photo(
                "print-silver",
                1600,
                1200,
                "A three-generation family on wooden chairs, printed in neutral silver gelatin",
            ),
            photo("print-platinum", 1600, 1200, "The same family printed in warm platinum palladium tones"),
            photo("print-tintype", 1600, 1200, "The family as a dark, silvery tintype on metal"),
            photo("print-cyanotype", 1600, 1200, "The family printed as a Prussian-blue cyanotype"),
            photo(
                "hero-mill-studio",
                2400,
                1350,
                "A family seated beside the studio's wooden 8x10 camera on its tripod in a brick mill with tall windows",
            ),
        ],
    },
]

/** Home hero: one full-bleed frame of the family beside the 8x10. */
export const heroSlides: PhotoImage[] = [albums[1].images[4]]

/**
 * The home page's selected-work gallery: a cross-album edit, sequenced by
 * hand. Pull frames from the albums so home and album pages stay in sync.
 */
export const selectedWork: PhotoImage[] = [
    albums[0].images[1],
    albums[0].images[2],
    albums[0].images[0],
    albums[0].images[4],
    albums[0].images[3],
]

export const home = {
    /** The home composition: `crossfade`, `pinboard`, `builder`, or `specimens` (see the header). */
    layout: "specimens" as "crossfade" | "pinboard" | "builder" | "specimens",
    badge: "",
    headline: "Sit for a portrait your great-grandchildren will keep",
    /** Where the hero headline's accent lands (`none` | `last-word` | `last-line`). */
    accent: "none" as "none" | "last-word" | "last-line",
    subheadline: "",
    /** Scribbled on the page beside the prints (`pinboard` only; null drops it). */
    scribble: null as string | null,
    /** The sticky note on the hero (null drops it). */
    note: null as string | null,
    intro: {
        kicker: "The studio",
        title: "A big camera, a north window, and no hurry.",
        paragraphs: [
            "Ashgrove is a portrait studio on the second floor of a brick mill in Hudson. Every sitting is made on a wooden 8x10 view camera, one sheet of film at a time, in the light from the tall north windows.",
            "Because each plate takes a moment to set up, nobody performs for it. Grandparents settle, children fidget and then forget, and the photograph that comes out of the darkroom looks like the family on an ordinary good day.",
        ],
    },
    /** "What to expect" promises (`pinboard` only): one line each. */
    expect: [] as { title: string; body: string }[],
    /** "How a day goes" (`pinboard` only): clock-stamped steps, `image` indexing the first album. */
    day: [] as { label: string; title: string; body: string; image: number }[],
    /** The session builder (`builder` only). null drops it. */
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
    prints: {
        kicker: "Heirloom portraits. Timeless processes.",
        title: "The prints",
        items: [
            {
                name: "Silver gelatin",
                note: "Fiber paper, archival 150+ years",
                price: "From $900",
                image: albums[1].images[0],
            },
            {
                name: "Platinum palladium",
                note: "Hand-coated, warm tones",
                price: "From $1,600",
                image: albums[1].images[1],
            },
            {
                name: "Tintype",
                note: "One of a kind, on metal",
                price: "From $400",
                image: albums[1].images[2],
            },
            { name: "Cyanotype", note: "Prussian blue", price: "From $350", image: albums[1].images[3] },
        ],
    } as {
        kicker: string
        title: string
        items: { name: string; note: string; price: string; image: PhotoImage }[]
    } | null,
}

export const about = {
    headline: "The darkroom is the other half of the studio.",
    portrait: photo(
        "about-studio",
        1200,
        1600,
        "June Adeyemi laughing beside the studio's 8x10 camera, prints drying on the wall behind her",
    ),
    paragraphs: [
        "I'm June Adeyemi. I opened Ashgrove after a decade printing for other photographers, because I wanted to make portraits that would still be on a wall in a hundred years — not on a hard drive nobody can open.",
        "The studio is a room in the old Ashgrove mill with a 1940s view camera, two painted backdrops and a darkroom behind the curtain. I shoot every sitting on film and make every print by hand: silver gelatin, platinum palladium, tintypes and cyanotypes.",
        "Families usually sit once every few years. The prints go on the stairs, and the grandchildren end up asking for copies.",
    ],
    testimonials: [
        {
            quote: "My mother is ninety-one and hates having her picture taken. June sat with her for twenty minutes before she touched the camera. The platinum print is the only photograph of her she's ever liked.",
            name: "Ruth & Daniel Osei",
            detail: "Four generations, platinum palladium",
        },
        {
            quote: "The boys were upside down on the chair for most of the sitting and June just waited. That's the plate we chose. It's on the landing and everybody stops at it.",
            name: "The Brennan family",
            detail: "Silver gelatin, 11x14",
        },
        {
            quote: "We gave the tintype to my parents for their fiftieth. There is only one of it in the world, which felt exactly right.",
            name: "Leila Haddad",
            detail: "Tintype, whole plate",
        },
    ],
}

/**
 * The `/investment` page: session offerings with flat prices, how a
 * session unfolds, and the questions families actually ask. Prices are
 * whole dollars; exactly one offering stays `highlighted`.
 */
export const investment = {
    headline: "Sittings & prints.",
    body: "Every sitting includes the film, the proofs and one finished print. Further prints are priced by process and size, and every one is made by hand in the studio's darkroom.",
    /** The badge on the highlighted offering's card; "" for none. */
    highlightNote: "Most families",
    offerings: [
        {
            name: "The portrait sitting",
            price: 450,
            duration: "About an hour",
            description: "One to three people — a couple, a parent and child, two sisters.",
            includes: [
                "Six sheets of 8x10 film",
                "A contact-print proof of every plate",
                "One 8x10 silver gelatin print",
            ],
            highlighted: false,
        },
        {
            name: "The family sitting",
            price: 850,
            duration: "Two hours",
            description: "The whole family, grandparents and dog included, in the mill studio.",
            includes: [
                "Ten sheets of 8x10 film",
                "A contact-print proof of every plate",
                "One 11x14 silver gelatin print",
                "Help choosing the process for the rest",
            ],
            highlighted: true,
        },
        {
            name: "The heirloom sitting",
            price: 2200,
            duration: "Half a day",
            description: "Every generation, alone and together, printed as a matched set.",
            includes: [
                "Twenty sheets of 8x10 film",
                "Four 11x14 platinum palladium prints",
                "Archival portfolio box",
            ],
            highlighted: false,
        },
    ],
    steps: [
        {
            title: "Book the sitting",
            body: "Pick a morning on the calendar. I'll send a note on what to wear — plain, dark, no logos — and how to get to the mill.",
        },
        {
            title: "The sitting",
            body: "Two unhurried hours on the 8x10. Tea first, then one plate at a time, with breaks whenever anyone needs one.",
        },
        {
            title: "The proofs",
            body: "Two weeks later you'll see a contact print of every plate, and we choose the frames and the process together.",
        },
        {
            title: "The prints",
            body: "I print, tone and mat everything by hand. Finished prints are ready to collect or ship in six weeks.",
        },
    ],
    faq: [
        {
            question: "Why film and not digital?",
            answer: "A negative from an 8x10 holds more than any print will ask of it, and a fiber print made from it will outlast every file format we have today. It also slows the sitting down, which is where the good photographs come from.",
        },
        {
            question: "Will the children manage two hours?",
            answer: "Yes — the sitting is two hours because we stop often. Children usually sit for the first plates and then get to play; some of the best frames happen after they've stopped trying.",
        },
        {
            question: "Which process should we choose?",
            answer: "Silver gelatin is the classic and the most durable. Platinum is softer and warmer. A tintype is a single object on metal. Cyanotype is blue and inexpensive. We choose together once you've seen the proofs.",
        },
        {
            question: "Can we bring the dog?",
            answer: "Please do. Dogs are very good at sitting for the big camera.",
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
            typeId: "family-sitting",
            name: "Family sitting",
            durationMinutes: 120,
            description: "The whole family on the 8x10, two hours",
        },
        {
            typeId: "portrait-sitting",
            name: "Portrait sitting",
            durationMinutes: 60,
            description: "One to three people, about an hour",
        },
        {
            typeId: "print-consult",
            name: "Print consultation",
            durationMinutes: 30,
            description: "Choose the process and size from your proofs",
        },
    ],
    providers: [
        {
            providerId: "june-adeyemi",
            name: "June Adeyemi",
            windows: [
                { day: 3, start: 9 * 60, end: 13 * 60 },
                { day: 5, start: 9 * 60, end: 13 * 60 },
                { day: 6, start: 9 * 60, end: 15 * 60 },
            ],
        },
    ],
}

export const book = {
    headline: "Book a sitting.",
    intro: "Choose a morning in the mill on the studio's real calendar. You'll get a confirmation straight away, then a short note on what to wear, how to find the studio, and what happens after the sitting.",
    /** The reassurance line beside the form — honest about what it collects. */
    formNote: "Holding a sitting takes a name and an email, nothing more. No payment is due today.",
    /** Below the widget: for the dates the calendar can't hold. */
    flexibleNote:
        "Coming from out of town, or need a weekday afternoon? Send a note and I'll find a time off the calendar.",
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
 * file's base name ("sitting-generations"). Live rooms use the door's
 * minted `imageId` instead.
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
        accessCode: "1908",
        clientName: "Ruth & Daniel Osei",
        title: "The Osei family — four generations",
        note: "Here are the contact proofs from your sitting in the mill. Choose the plates you'd like printed and press Send when you're done. We'll pick the process for each one together.",
        images: [
            albums[1].images[0],
            albums[1].images[1],
            albums[1].images[2],
            albums[1].images[3],
            albums[0].images[0],
            albums[0].images[3],
            albums[1].images[4],
            albums[0].images[1],
        ],
    },
    {
        slug: "brennan-boys",
        accessCode: "4417",
        clientName: "The Brennans",
        title: "Finn & Oscar — the armchair sitting",
        note: "The boys were wonderful, mostly upside down. Pick the plates you want printed — the counter keeps track — and send them whenever you're ready.",
        images: [albums[0].images[2], albums[0].images[4], albums[0].images[1], albums[0].images[0]],
    },
]

export const proofing = {
    /**
     * The room's chrome: `quiet` keeps a small tracked studio line and
     * plain headings on a flat page panel; `register` speaks in the
     * register's own voice (its script face for the studio name, display
     * caps for titles and the button).
     */
    voice: "register" as "quiet" | "register",
    /** The gate screen's copy — what a client sees before entering the code. */
    gate: {
        title: "Your proofs",
        body: "These proofs are private — just for your family. Enter the access code from the studio's note to see your plates and choose the ones to print.",
        placeholder: "Access code",
        cta: "Open proofs",
        checking: "Checking…",
        error: "That code doesn't match these proofs — check the note from the studio.",
        notFound: "These proofs aren't available — they may have closed. Ask the studio for a new link.",
        rateLimited: "Too many attempts. Wait a moment and try again.",
        notConfigured: "Client proofs aren't set up yet. Check back shortly.",
    },
    /** The selection tray and confirmation copy. */
    selection: {
        sendCta: "Send choices",
        namePlaceholder: "Your name",
        emailPlaceholder: "Your email",
        notePlaceholder: "Any thoughts on process or size? (optional)",
        confirm: "Send",
        cancel: "Keep choosing",
        sending: "Sending…",
        sendError: "Something went wrong sending your choices — try again in a moment.",
        sentTitle: "Choices sent.",
        sentBody:
            "Your plates are on their way to the darkroom. You can come back to these proofs and send an updated selection any time.",
        reopenCta: "Revise choices",
    },
}

/**
 * The `/galleries` page: what happens after a sitting, told to families in
 * plain words. The sample section points at the first demo room above;
 * `sample.slug` and `sample.code` derive from the fixture.
 */
export const galleries = {
    headline: "Then comes the darkroom.",
    intro: "The sitting is a morning; the prints are what you keep. Two weeks after the sitting your contact proofs arrive online — here's how it goes from there.",
    steps: [
        {
            title: "The proofs arrive",
            body: "Two weeks after the sitting you'll get a link to a private room of contact proofs, one for every plate, and a short access code to share with the family.",
        },
        {
            title: "Choose the plates",
            body: "Tap the plates you want printed and the tray keeps count. Add a note if you already know the process or the size.",
        },
        {
            title: "The prints are made",
            body: "Press Send and your choices come to the darkroom. Every print is made, toned and matted by hand, ready in six weeks.",
        },
    ],
    sample: {
        kicker: "See for yourself",
        title: "Step inside a proof room.",
        body: `These are the Osei family's proofs from a four-generation sitting, arranged exactly the way yours will arrive. The access code is ${demoProofingAlbums[0].accessCode} — open it, choose a few plates, and try the sending tray.`,
        cta: "Open the sample proofs",
        slug: demoProofingAlbums[0].slug,
        code: demoProofingAlbums[0].accessCode,
    },
}

export const inquire = {
    headline: "Tell the studio about your family.",
    body: "A few lines is plenty — who would sit, roughly when, and whether there's a process you already love. I reply to every note within two working days.",
    confirmation:
        "Thank you — your note is on its way to the studio. I reply to every inquiry within two working days.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        {
            name: "session",
            label: "Sitting",
            placeholder: "Family, portrait, heirloom — or not sure yet",
        },
        { name: "date", label: "Preferred month", type: "date" as const },
        {
            name: "message",
            label: "About your family",
            type: "textarea" as const,
            fullWidth: true,
            required: true,
        },
    ],
}
