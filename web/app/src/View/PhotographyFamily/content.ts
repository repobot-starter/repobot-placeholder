import type { AppointmentsContent } from "../Landing/practiceDocument"

/**
 * The family-photography pack's single content file: photographer, pages,
 * albums, session offerings, and the booking contract. Public pages render
 * from here — edit this file (not the page components) to make the site
 * yours. Live client galleries do not: they load from the platform
 * proofing door. `demoProofingAlbums` below is fixture data for baked
 * previews only.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/photography-family` (see PACK.md). The `photo` helper
 * mirrors that verb's naming exactly, so an entry is three arguments, not
 * eight lines. Never point a slot at a raw camera file.
 *
 * Sequencing is the craft: the `justified` gallery preserves array order
 * exactly (unlike masonry), so order each album the way a photographer
 * would sequence it — open strong, vary rhythm, close strong.
 *
 * `home.layout` picks the home page's composition: `crossfade` (this
 * site's) is the photo-led stack — the full-bleed slideshow hero, a
 * justified selected-work wall, the introduction, the albums, one kind
 * word, and a booking banner; `pinboard` opens on a pile of captioned
 * prints and adds the lengths of day, a day rail (`home.day`), and a
 * checklist (`home.expect`); `builder` opens on a full-bleed photograph
 * and sets the session builder (`home.builder`) right under it;
 * `specimens` opens on a full-bleed photograph and sets the prints
 * (`home.prints`), one sitting in each process, as matted specimens under
 * it. Fields only one layout reads can stay empty.
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
        src: `/photography-family/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/photography-family/${name}-${step}w.webp`, width: step })),
        ...(caption !== undefined ? { caption } : {}),
    }
}

export const photographer = {
    name: "Maeve Callahan",
    tagline: "Family, motherhood & newborn photography",
    location: "Santa Barbara, California",
    email: "hello@maevecallahan.example",
    instagram: "https://instagram.com/maevecallahan.photo",
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
        variant: "centered" as "centered" | "split",
        /** Set beside the wordmark; "" for the name alone. */
        tagline: "",
    },
    /** Every booking button on the site. */
    bookCta: "Book a session",
    /** The /book page's title in the browser tab. */
    bookPageTitle: "Book a session",
    /** The inner pages' statement-hero accent (`none` | `last-word`). */
    heroAccent: "none" as "none" | "last-word",
    home: {
        primaryCta: "See the work",
        selectedWorkKicker: "Selected work",
        selectedWorkTitle: "",
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
        bannerTitle: "Golden hour is booking now.",
        bannerBody: "Evenings fill a season ahead — hold a date and we'll plan the rest together.",
    },
    workPage: {
        headline: "The work.",
        subheadline:
            "Three bodies of work, each sequenced the way the day unfolded. Open a collection to see it in order.",
        albumBannerTitle: "Picture your family here.",
    },
    aboutPage: {
        kicker: "About",
        cta: "Work with me",
        reviewsKicker: "Kind words",
        reviewsTitle: "From the families",
        bannerTitle: "Let's make the album your kids will fight over.",
        bannerCta: "Start an inquiry",
    },
    galleriesPage: {
        stepsKicker: "After the session",
        bannerTitle: "Your gallery starts with a session.",
        bannerBody: "Hold a golden hour on the calendar and the rest of this page takes care of itself.",
    },
    investmentPage: {
        offeringsKicker: "Sessions",
        stepsKicker: "How it works",
        stepsTitle: "From hello to hanging on the wall",
        faqKicker: "Questions",
    },
    inquirePage: {
        formKicker: "Inquiry",
    },
}

export const albums: Album[] = [
    {
        slug: "golden-hour",
        title: "Golden Hour",
        eyebrow: "Families",
        description:
            "Evening sessions in the hills above the coast — the hour when the light goes soft, the shoes come off, and nobody has to say cheese.",
        images: [
            photo(
                "golden-hour-01",
                1152,
                864,
                "A family of four walking through tall golden grass above the ocean at sunset",
            ),
            photo(
                "golden-hour-02",
                864,
                1152,
                "A mother lifting her laughing toddler overhead against the evening sky",
            ),
            photo(
                "golden-hour-03",
                1152,
                864,
                "Two children racing ahead of their parents down a bluff path at golden hour",
            ),
            photo(
                "golden-hour-04",
                864,
                1152,
                "A father and his young daughter forehead to forehead in golden grass",
            ),
            photo(
                "golden-hour-05",
                1152,
                864,
                "A family tangled up laughing together on a blanket in an evening field",
            ),
            photo(
                "golden-hour-06",
                864,
                1152,
                "A girl in a linen dress holding wildflowers, looking toward the sunset",
            ),
            photo(
                "golden-hour-07",
                1152,
                864,
                "Parents swinging their small boy into the air between them at dusk",
            ),
            photo(
                "golden-hour-08",
                1152,
                864,
                "A family walking home down a coastal path under the last warm light",
            ),
        ],
    },
    {
        slug: "first-days",
        title: "The First Days",
        eyebrow: "Newborn · At home",
        description:
            "Slow mornings at home in the first weeks — window light, tiny hands, the nursery you made, and the people who can't stop looking at the baby.",
        images: [
            photo(
                "first-days-01",
                1152,
                864,
                "A mother by a bright curtained window cradling her sleeping newborn",
            ),
            photo("first-days-02", 864, 1152, "A newborn's hand wrapped around a mother's finger"),
            photo(
                "first-days-03",
                1152,
                864,
                "Parents lying on white linens with their newborn asleep between them",
            ),
            photo("first-days-04", 864, 1152, "A father's hands gently holding his newborn's bare feet"),
            photo(
                "first-days-05",
                1152,
                864,
                "A big sister on tiptoe peeking into the bassinet at her new sibling",
            ),
            photo(
                "first-days-06",
                864,
                1152,
                "A mother in an armchair by the window holding her baby against her shoulder",
            ),
            photo("first-days-07", 1152, 864, "The corner of the nursery crib under a felt star mobile"),
            photo("first-days-08", 864, 1152, "A mother laughing while her newborn yawns on her chest"),
        ],
    },
    {
        slug: "salt-and-sun",
        title: "Salt & Sun",
        eyebrow: "Beach days",
        description:
            "Childhood at the shore, photographed the way it actually goes: wet hems, sandy hands, one more wave, and nobody ready to leave.",
        images: [
            photo("salt-and-sun-01", 1152, 864, "Two children splashing through shallow surf at golden hour"),
            photo("salt-and-sun-02", 864, 1152, "A girl with damp braids grinning, wrapped in a beach towel"),
            photo("salt-and-sun-03", 1152, 864, "A toddler crouched on wet sand inspecting a seashell"),
            photo(
                "salt-and-sun-04",
                1152,
                864,
                "A family and their dog walking the tideline under a vast golden sky",
            ),
            photo("salt-and-sun-05", 864, 1152, "A boy caught mid-air leaping off a sand dune"),
            photo("salt-and-sun-06", 1152, 864, "Small sandy hands patting a shell-covered sandcastle"),
            photo(
                "salt-and-sun-07",
                864,
                1152,
                "A mother twirling her daughter by the hand at the water's edge",
            ),
            photo(
                "salt-and-sun-08",
                1152,
                864,
                "A father with his daughter on his shoulders watching the horizon at dusk",
            ),
        ],
    },
]

/** Home hero: three wide frames on a slow crossfade — one from each body of work. */
export const heroSlides: PhotoImage[] = [
    photo("hero-01", 1280, 720, "A family strolling through a golden coastal meadow toward the sea"),
    photo("hero-02", 1280, 720, "A mother on the edge of a white bed holding her newborn nose to nose"),
    photo("hero-03", 1280, 720, "Parents and children running hand in hand along the tideline"),
]

/**
 * The home page's selected-work gallery: a cross-album edit, sequenced by
 * hand. Pull frames from the albums so home and album pages stay in sync.
 */
export const selectedWork: PhotoImage[] = [
    albums[0].images[1],
    albums[2].images[0],
    albums[1].images[3],
    albums[0].images[6],
    albums[2].images[6],
    albums[1].images[7],
    albums[2].images[2],
    albums[0].images[7],
]

export const home = {
    /** The home composition: `crossfade`, `pinboard`, `builder`, or `specimens` (see the header). */
    layout: "crossfade" as "crossfade" | "pinboard" | "builder" | "specimens",
    badge: "Family · Motherhood · Newborn",
    headline: "Photographs that feel like these days.",
    /** Where the hero headline's accent lands (`none` | `last-word` | `last-line`). */
    accent: "none" as "none" | "last-word" | "last-line",
    subheadline: `${photographer.name} — family, motherhood, and newborn photography in ${photographer.location}.`,
    /** Scribbled on the page beside the prints (`pinboard` only; null drops it). */
    scribble: null as string | null,
    /** The sticky note on the hero (null drops it). */
    note: null as string | null,
    intro: {
        kicker: "Hello",
        title: "The years go quietly. The photographs don't have to.",
        paragraphs: [
            "I photograph families the way the day actually feels — barefoot walks at golden hour, slow mornings with a two-week-old, the beach trip where everyone came home sandy. Nothing staged, nothing stiff; I mostly just keep up.",
            "Sessions happen where your life does: the coast at sunset, your own living room, the field at the end of your street. You'll get photographs your kids will fight over someday.",
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
    headline: "The one usually behind the camera.",
    portrait: photo(
        "about-portrait",
        864,
        1152,
        "Maeve Callahan holding her medium-format camera in soft window light",
    ),
    paragraphs: [
        "I started photographing families the year my own daughter was born, when I realized how few pictures existed of my mother just being our mom. Every gallery I deliver is the album I wish we had.",
        "Sessions with me feel more like a walk than a production. I shoot in soft natural light, give gentle direction instead of poses, and let the small people set the pace — the best frames always happen in the in-between.",
        "I work along the Santa Barbara coast and at home wherever you are. Most families print: I'll help you turn the gallery into albums and framed prints you'll actually hang.",
    ],
    testimonials: [
        {
            quote: "Maeve photographed the week our son was born and somehow made our messy, sleepless house look like the most beautiful place on earth. I cry every time I open the album.",
            name: "Nora Bennett",
            detail: "First Days session",
        },
        {
            quote: "Our four-year-old refuses to sit still for anything. Maeve never once asked him to. The gallery is all of us laughing, and it's the most 'us' we've ever looked.",
            name: "Daniel & Priya Shah",
            detail: "Golden hour session",
        },
        {
            quote: "Three years, three sessions. The pictures on our stairwell wall are the story of our family so far, and every single one of them is hers.",
            name: "The Okamoto family",
            detail: "Returning clients",
        },
    ],
}

/**
 * The `/investment` page: session offerings with flat prices, how a
 * session unfolds, and the questions families actually ask. Prices are
 * whole dollars; exactly one offering stays `highlighted` (the page reads
 * better with a spine).
 */
export const investment = {
    headline: "Investment.",
    body: "Three ways to work together, each ending in a finished gallery you own. Every session includes the planning, the shoot, hand-finished photographs, and print rights — no per-image fees, ever.",
    /** The badge on the highlighted offering's card; "" for none. */
    highlightNote: "",
    offerings: [
        {
            name: "The Mini",
            price: 350,
            duration: "30 minutes",
            description: "Short and sweet: one location, one roll of laughter, the highlights.",
            includes: [
                "30 minutes at one location",
                "20+ hand-finished photographs",
                "Online gallery with print rights",
                "Ready in one week",
            ],
            highlighted: false,
        },
        {
            name: "The Full Session",
            price: 650,
            duration: "90 minutes",
            description: "The signature session — golden hour on the coast, or at home where the life is.",
            includes: [
                "90 unhurried minutes, one or two spots",
                "60+ hand-finished photographs",
                "Online gallery with print rights",
                "Wardrobe help & location planning",
                "Print and album ordering built in",
            ],
            highlighted: true,
        },
        {
            name: "The First Days",
            price: 950,
            duration: "A slow morning",
            description: "An in-home newborn morning in the first two weeks — unposed, unhurried.",
            includes: [
                "2–3 hours at home, baby sets the pace",
                "75+ hand-finished photographs",
                "Family & sibling frames included",
                "Online gallery with print rights",
                "Heirloom album credit",
            ],
            highlighted: false,
        },
    ],
    steps: [
        {
            title: "Say hello",
            body: "Send an inquiry or book a time directly. I'll confirm the date and send a short questionnaire about your crew.",
        },
        {
            title: "We plan it together",
            body: "Location, light, and what to wear — I'll send a guide and we'll choose a spot that feels like you.",
        },
        {
            title: "The session",
            body: "It feels like a walk, not a shoot. Kids play, parents relax, and I keep quietly working the light.",
        },
        {
            title: "Your gallery",
            body: "Hand-finished photographs in an online gallery within two weeks, with prints and albums a click away.",
        },
    ],
    faq: [
        {
            question: "What should we wear?",
            answer: "Soft, light, comfortable — creams, sands, muted tones that let faces lead. After booking you'll get my wardrobe guide, and you can always text me photos of options.",
        },
        {
            question: "What if the kids won't cooperate?",
            answer: "They never do, and it has never once ruined a session. I don't ask children to perform; I photograph them being themselves, and those are the frames you'll love most.",
        },
        {
            question: "When should we book a newborn session?",
            answer: "Reserve a window in your second trimester and book the newborn planning call — babies pick their own dates, so I hold the two weeks around yours and we settle the morning once they've arrived.",
        },
        {
            question: "How long until we see the photographs?",
            answer: "A little preview within 48 hours, the full hand-finished gallery within two weeks. Minis arrive in one.",
        },
        {
            question: "What about weather?",
            answer: "Coastal fog is a gift and light rain makes the best pictures — but if the day truly turns, we reschedule at no charge. Golden hour always comes back.",
        },
        {
            question: "Do you help with prints?",
            answer: "Yes, and I hope you'll let me. Your gallery has museum-grade prints and linen albums built in, and I'll design the wall or the album with you.",
        },
    ],
}

/**
 * The `appointments` content domain, code fallback — booking mode 2's
 * inputs. Session types carry the slot length they book; the weekly
 * windows are packed back-to-back into concrete capacity-1 slots by
 * `generateAppointmentSlots` (kernel and platform run the same
 * derivation, so the preview offers exactly what a deploy would).
 * One provider: it's a one-photographer studio.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "mini-session",
            name: "Mini session",
            durationMinutes: 30,
            description: "One location, short and sweet",
        },
        {
            typeId: "full-session",
            name: "Full session",
            durationMinutes: 90,
            description: "The signature — coast or at home",
        },
        {
            typeId: "newborn-planning",
            name: "Newborn planning call",
            durationMinutes: 45,
            description: "Before baby arrives, we plan the morning",
        },
    ],
    providers: [
        {
            providerId: "maeve",
            name: "Maeve Callahan",
            windows: [
                { day: 2, start: 9 * 60, end: 12 * 60 },
                { day: 3, start: 14 * 60, end: 17 * 60 },
                { day: 4, start: 9 * 60, end: 12 * 60 },
                { day: 5, start: 15 * 60, end: 18 * 60 },
                { day: 6, start: 9 * 60, end: 12 * 60 },
            ],
        },
    ],
}

export const book = {
    headline: "Hold a date.",
    intro: "Pick a session type and a time that suits your family. You'll get an email confirmation right away, then my planning guide — location ideas, what to wear, and how we'll make the hour easy.",
    /** The reassurance line beside the form — honest about what it collects. */
    formNote:
        "Holding a time takes a name and an email, nothing more. No deposit is due today — we'll settle details together before the session.",
    /** Below the widget: for the dates the calendar can't hold. */
    flexibleNote:
        "Expecting, or juggling nap schedules? Send an inquiry instead and we'll find a time off the calendar.",
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
 * file's base name ("golden-hour-03"). Live rooms use the door's minted
 * `imageId` instead.
 */
export function photoId(image: PhotoImage): string {
    const file = image.src.split("/").pop() ?? image.src
    return file.replace(/-\d+w\.webp$/, "")
}

/**
 * Demo fixtures for baked previews and the funnel screenshot. The
 * Ashford room is the well-populated client gallery the platform renders
 * when it shows "what Spaceboy runs for you".
 */
export const demoProofingAlbums: DemoProofingAlbum[] = [
    {
        slug: "ashford-family",
        accessCode: "5417",
        clientName: "The Ashford family",
        title: "The Ashfords — golden hour",
        note: "Here they are — your evening in the hills. Choose the frames you'd like finished, as many or as few as you want, and press Send when you're done. I'll hand-finish your picks and follow up about prints and the album.",
        images: [
            albums[0].images[0],
            albums[0].images[1],
            albums[0].images[3],
            albums[0].images[2],
            albums[0].images[5],
            albums[0].images[4],
            albums[2].images[0],
            albums[2].images[6],
            albums[0].images[6],
            albums[0].images[7],
        ],
    },
    {
        slug: "rowan-first-days",
        accessCode: "8092",
        clientName: "Nora & Ben",
        title: "Rowan — the first days",
        note: "Your slow morning with Rowan. Pick the frames you want finished for the album — the counter keeps track — and send them over whenever you're ready. No rush at all.",
        images: [
            albums[1].images[0],
            albums[1].images[1],
            albums[1].images[3],
            albums[1].images[4],
            albums[1].images[5],
            albums[1].images[7],
        ],
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
 * The `/galleries` page: what happens after a session, told to clients in
 * plain words — the private gallery arrives by email behind an access
 * code, they choose the frames they love, Maeve hand-finishes the picks.
 * The sample section points at the Ashford demo room above so any visitor
 * (including a photographer evaluating the template) can step into the
 * real gate, enter the code, and try the selection tray. `sample.slug`
 * and `sample.code` derive from the fixture — one source, never drift.
 */
export const galleries = {
    headline: "Then comes the gallery.",
    intro: "The session is an hour; the gallery is what you keep. A couple of weeks after we shoot, a private online gallery of your family's photographs arrives by email — here's how it works from there.",
    steps: [
        {
            title: "It arrives by email",
            body: "Within two weeks of your session — one for minis — you'll get a link to your own gallery and a short access code. It's completely private: only the people you give the code to can open it.",
        },
        {
            title: "Choose the ones you love",
            body: "Open it on any device and take your time. Tap the frames you want finished — as many or as few as you like — and the tray keeps count. Grandparents get the code too; voting is encouraged.",
        },
        {
            title: "I finish them by hand",
            body: "Press Send and your picks come straight to me. I hand-finish every one, then we talk prints, albums, and which wall they're going on.",
        },
    ],
    sample: {
        kicker: "See for yourself",
        title: "Step inside a finished gallery.",
        body: `This is the Ashfords' evening in the hills, arranged exactly the way your gallery will arrive. The access code is ${demoProofingAlbums[0].accessCode} — open it, tap a few favorites, and try the sending tray. It's a sample room, so choose freely.`,
        cta: "Open the sample gallery",
        slug: demoProofingAlbums[0].slug,
        code: demoProofingAlbums[0].accessCode,
    },
}

export const inquire = {
    headline: "Tell me about your family.",
    body: "A few lines is plenty — who's in the crew, what kind of session you're dreaming of, and roughly when. I reply to every note within two working days.",
    confirmation: "Thank you — your note is on its way. I reply to every inquiry within two working days.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        {
            name: "session",
            label: "Session type",
            placeholder: "Mini, full session, newborn — or not sure yet",
        },
        { name: "date", label: "Date (if known)", type: "date" as const },
        {
            name: "message",
            label: "About your family",
            type: "textarea" as const,
            fullWidth: true,
            required: true,
        },
    ],
}
