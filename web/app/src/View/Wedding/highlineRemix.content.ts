/**
 * Highline — the wedding pack's content seed for the `wedding-highline`
 * derived template (packs/wedding-highline/catalog.json `contentSeed`).
 * Compose copies this module over `content.ts`, so it is that file's
 * structural twin: same exports, same shapes, Highline's words and
 * photographs. Everything the site renders comes from here — edit this
 * file (not the page components) to make the site yours.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/wedding-highline` (see PACK.md). The `photo` helper
 * mirrors that verb's naming exactly.
 *
 * The home is the `stack` layout: each place runs edge to edge down the
 * page with its season and coordinates set over the photograph, then the
 * places again as a spec sheet — season, permit, elevation, the walk in.
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
        src: `/wedding-highline/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/wedding-highline/${name}-${step}w.webp`, width: step })),
        ...extra,
    }
}

export const photographer = {
    name: "Highline",
    tagline: "Adventure elopements",
    location: "Telluride, Colorado",
    email: "hello@highline-elopements.example",
    instagram: "https://instagram.com/highline.elopements",
}

export const albums: Album[] = [
    {
        slug: "maya-theo",
        title: "Maya & Theo",
        eyebrow: "Slot canyon · Southern Utah · April",
        description:
            "A two-day canyon elopement — a mile and a half of sand into the slot at noon, vows where the light comes down, coffee on the rim at golden hour and a blanket under the Milky Way.",
        images: [
            photo(
                "canyon-walk",
                1600,
                1200,
                "Maya and Theo walking hand in hand through a red slot canyon, her dress swinging as she laughs",
            ),
            photo(
                "canyon-rim",
                1600,
                1200,
                "The two of them laughing over enamel mugs on the canyon rim at golden hour",
            ),
            photo(
                "canyon-slot",
                1600,
                1200,
                "Dancing in the shaft of light at the bottom of the slot, sand kicking up around her dress",
            ),
            photo(
                "canyon-stars",
                1600,
                1200,
                "Wrapped in a blanket on the rim under the Milky Way, a lantern at their feet",
            ),
            photo(
                "canyon-hike",
                1600,
                1200,
                "The walk out across the red dirt, packs on, her dress hitched over hiking boots",
            ),
            photo(
                "canyon-slickrock",
                1600,
                1200,
                "Slow-dancing on the slickrock as the buttes go orange behind them",
            ),
        ],
    },
    {
        slug: "rosa-eli",
        title: "Rosa & Eli",
        eyebrow: "Aspen grove · Telluride · late September",
        description:
            "Peak gold above Telluride — a quiet ceremony on the grove trail, one spin that sent the leaves flying, a meadow under the peaks and a fire until the stars came out.",
        images: [
            photo("aspen-grove", 1600, 1200, "Rosa and Eli walking a trail through a grove of gold aspens"),
            photo(
                "aspen-spin",
                1600,
                1200,
                "Eli spinning Rosa off the ground on the aspen trail, her bouquet flung out, leaves in the air",
            ),
            photo(
                "aspen-meadow",
                1600,
                1200,
                "Rosa on Eli's back with her arms out, running through a golden meadow under a snowy peak",
            ),
            photo(
                "aspen-campfire",
                1600,
                1200,
                "The two of them laughing under one blanket by a campfire as the sky goes dark blue",
            ),
        ],
    },
    {
        slug: "ana-kit",
        title: "Ana & Kit",
        eyebrow: "Alpine ridge · San Juans · July",
        description:
            "A 3 a.m. start and three miles up to a ridge over an alpine lake — vows read from a notebook, coffee on the rocks as the sun came over, and a bottle of something cold at the top.",
        images: [
            photo(
                "hero-ridge",
                2400,
                1800,
                "Ana and Kit throwing their arms up on an alpine ridge above a turquoise lake, wildflowers at their feet",
            ),
            photo(
                "ridge-vows",
                1600,
                1200,
                "Ana laughing mid-vow as Kit reads from a notebook, the lake and peaks behind them",
            ),
            photo(
                "ridge-sunrise",
                1600,
                1200,
                "Coffee from a camp pot on the ridge at sunrise, the peaks lit pink above the lake",
            ),
            photo(
                "ridge-toast",
                1600,
                1200,
                "Kit popping a bottle on a blanket in the alpine grass while Ana ducks, laughing",
            ),
        ],
    },
]

/** Home hero: one full-bleed frame from the ridge. */
export const heroSlides: PhotoImage[] = [albums[2].images[0]]

/**
 * The home page's filmstrip: a cross-elopement edit, sequenced by hand.
 * Pull frames from the albums so home and album pages stay in sync.
 */
export const selectedWork: PhotoImage[] = [
    albums[1].images[1],
    albums[0].images[1],
    albums[2].images[1],
    albums[1].images[2],
    albums[0].images[3],
    albums[2].images[3],
    albums[1].images[3],
    albums[0].images[0],
]

export const home = {
    /** `marquee`: the photograph under masthead type; `stack`: full-bleed frames down the page. */
    layout: "stack" as "marquee" | "stack",
    /** The selected-work wall's variant. */
    wall: "filmstrip" as "scrapbook" | "contact-sheet" | "filmstrip",
    /** Every wedding page's wall: `justified`, the roll as a `contact-sheet`, or the captioned `stack`. */
    albumWall: "stack" as "justified" | "contact-sheet" | "stack",
    /** Contact-sheet walls: the stock printed along the film edge. */
    edgeCode: "Safety film",
    badge: "Elopements · Telluride",
    headline: "Say it somewhere that takes your breath away.",
    subheadline:
        "Two guides and two cameras. We plan the place, file the permits, time the sunrise and carry the dress up the hill.",
    /** `stack` only: the frames run edge to edge under the hero, each place's season and coordinates set over the photograph. */
    stack: [
        { ...albums[0].images[2], caption: "Slot canyon · Southern Utah · March–May · 37.62°N 111.88°W" },
        { ...albums[1].images[0], caption: "Aspen grove · Telluride · Late Sept · 37.93°N 107.81°W" },
        photo(
            "winter-ice-lakes",
            1600,
            1200,
            "A couple in white parkas throwing snow on a frozen alpine lakeshore under jagged peaks",
            { caption: "Ice Lakes Basin · San Juans · Jan–Mar · 37.81°N 107.80°W" },
        ),
    ] as PhotoImage[],
    /** `stack` only: the closing band's photograph under the inquiry line (null = the plain banner). */
    closing: {
        image: photo(
            "coast-seastacks",
            2400,
            1800,
            "A couple running out of the surf in the fog below the Oregon sea stacks",
        ),
        position: "50% 60%",
        overlay: "dark",
    } as { image: PhotoImage; position: string; overlay: "soft" | "dark" } | null,
    /** `stack` only: the places, as a spec sheet (empty = none). */
    locations: [
        {
            name: "Slot canyon",
            where: "Southern Utah",
            season: "Mar–May · Sept–Oct",
            permit: "BLM special-use — we file it",
            elevation: "5,600 ft",
            hike: "1.5 mi of sand",
            coordinates: "37.62°N 111.88°W",
        },
        {
            name: "Aspen grove",
            where: "Telluride, Colorado",
            season: "Late Sept – early Oct",
            permit: "USFS special-use — we file it",
            elevation: "9,600 ft",
            hike: "0.5 mi, easy",
            coordinates: "37.93°N 107.81°W",
        },
        {
            name: "Alpine ridge",
            where: "San Juan Mountains",
            season: "July–Aug",
            permit: "USFS special-use — we file it",
            elevation: "12,300 ft",
            hike: "3 mi, 1,800 ft of gain",
            coordinates: "37.84°N 107.77°W",
        },
        {
            name: "Sea stacks",
            where: "Oregon coast",
            season: "Year round",
            permit: "State parks ceremony permit",
            elevation: "Sea level",
            hike: "0.2 mi of beach",
            coordinates: "45.88°N 123.96°W",
        },
    ] as {
        name: string
        where: string
        season: string
        permit: string
        elevation: string
        hike: string
        coordinates: string
    }[],
    intro: {
        kicker: "Who we are",
        title: "Guides first, photographers always.",
        paragraphs: [
            "We're Tali and Dario — a mountain guide and a documentary photographer who got tired of watching couples spend a year planning a day they barely remember. So we plan the day around the place instead.",
            "We scout every location on foot, file every permit, and pack the layers, the headlamps and the thermos. You bring the vows. One elopement a week, so the whole week is yours.",
        ],
    },
}

/**
 * The packages: flat prices (the pricing section prints them in
 * `landingCopy.currency`). Keep the middle package highlighted — it's the
 * honest default, and the page reads better with a spine.
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
        name: "Sunrise",
        price: 5800,
        description:
            "Four hours around first light — a short walk in, the vows, and the sun coming over the peaks.",
        features: [
            "Four hours of coverage, timed to the sunrise",
            "Location scouting and permit filing",
            "One guide-photographer",
            "A sequenced online gallery within three weeks",
        ],
    },
    {
        name: "The full day",
        price: 8400,
        description:
            "Sunrise to stars — getting ready at the cabin, the hike, the vows, a picnic, and the fire after dark.",
        features: [
            "Up to ten hours, one location",
            "Two guides and two cameras",
            "Permits, timing plan and a gear list for you both",
            "Picnic, camp coffee and a bottle for the top",
            "A private proofing room for your families",
        ],
        highlighted: true,
        badge: "Most chosen",
    },
    {
        name: "The expedition",
        price: 12600,
        description:
            "Two days and two places — the canyon and the ridge, the aspens and the coast — with a night out under the stars.",
        features: [
            "Two days, two locations",
            "Two guides, two cameras, a camp crew",
            "Backcountry camp or a cabin between days",
            "A linen-bound album of both days",
            "Travel within the Four Corners included",
        ],
    },
]

export const packagesPage = {
    headline: "Three ways up, priced flat.",
    body: "Every package includes the scouting, the permits and the guiding. Travel within the Four Corners is included; the Oregon coast and anywhere farther we quote before you commit.",
    kicker: "Packages",
    faqKicker: "Questions couples ask",
    faqTitle: "Before the trailhead",
}

export const faq = [
    {
        question: "We're not hikers. Can we still do this?",
        answer: "Yes. Half our places are a short, flat walk from the car — the aspen grove is half a mile. For the ridge we'll plan a pace you can enjoy, carry the heavy things, and turn around happily if the weather says so.",
    },
    {
        question: "Who handles the permits?",
        answer: "We do. Every place we shoot needs a special-use permit from the BLM, the Forest Service or the state parks; we file it in our name, pay the fees inside the package and carry it on the day.",
    },
    {
        question: "What if the weather turns?",
        answer: "Mountains decide, and we plan for it: every elopement has a second location and a flexible window. If it's unsafe we'll move the day — no fee — and if it's merely dramatic, we'll probably stay.",
    },
    {
        question: "Can our families come?",
        answer: "Of course. Up to twelve guests works on most of our routes; we'll pick a place everyone can reach, and our camp crew can set up chairs, a picnic and a fire for them.",
    },
    {
        question: "How do we hold a date?",
        answer: "A signed agreement and a retainer of a third holds it exclusively — we take one elopement a week, so a held date is really held. The rest is due two weeks before.",
    },
]

export const about = {
    headline: "Two guides, two cameras.",
    portrait: photo(
        "about-guides",
        1200,
        1600,
        "Tali Mensah and Dario Brooks laughing over a trail map on a boulder, a camera in her hands",
    ),
    paragraphs: [
        "Tali spent ten years guiding in the San Juans before picking up a camera; Dario came to Telluride to photograph a film festival and never went home. We've been walking couples up mountains together since 2019.",
        "We photograph around forty elopements a year across Colorado, Utah and the Oregon coast, from a small office above the gear shop on Colorado Avenue.",
        "We're certified wilderness first responders, we follow Leave No Trace to the letter, and we'll happily tell you when a place is too crowded to be worth it.",
    ],
    testimonials: [
        {
            quote: "We started walking at three in the morning and I was sure I'd hate it. Then the sun came over the ridge while Kit was reading his vows and Tali had the camera up before I'd even started crying.",
            name: "Ana & Kit",
            detail: "Eloped on an alpine ridge in the San Juans",
        },
        {
            quote: "They filed the permit, knew exactly when the light would hit the bottom of the slot, and carried my dress in a dry bag. All we had to do was show up.",
            name: "Maya Okafor",
            detail: "Eloped in a Southern Utah slot canyon",
        },
        {
            quote: "My parents came, my grandmother came, and Dario found a path she could walk. The photo of her in the aspens is on every wall of our house.",
            name: "Rosa & Eli",
            detail: "Eloped in the aspens above Telluride",
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
 * Maya & Theo room is the well-populated client gallery the platform
 * renders when it shows "what the studio runs for you".
 */
export const demoProofingAlbums: DemoProofingAlbum[] = [
    {
        slug: "maya-theo-prints",
        accessCode: "3916",
        clientName: "Maya & Theo",
        title: "Maya & Theo — print picks",
        note: "Here are the canyon frames — the slot, the rim and the stars. Choose the ones you'd like printed, as many or as few as you like, and press Send when you're done. We'll write about sizes and the album.",
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
        slug: "rosa-eli-edit",
        accessCode: "71540",
        clientName: "Rosa & Eli",
        title: "The aspens — the album edit",
        note: "The frames we'd put in your album, in order. Select the ones you want to keep and the counter will keep track; send them back and we'll lay out the first spreads within the week.",
        images: [albums[1].images[0], albums[1].images[1], albums[1].images[2], albums[1].images[3]],
    },
]

export const proofing = {
    /** The gate screen's copy — what a client sees before entering the code. */
    gate: {
        title: "Client proofing",
        body: "This gallery is private. Enter the access code from our note to view and choose your photographs.",
        placeholder: "Access code",
        cta: "View gallery",
        checking: "Checking…",
        error: "That code doesn't match this gallery — check the note from Highline.",
        notFound: "This gallery isn't available — it may have closed. Write to us for a new link.",
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
            "Your picks are on their way to Highline. You can come back to this gallery and send a new selection any time.",
        reopenCta: "Revise selections",
    },
}

/**
 * The /galleries page: the client-facing proofing explainer — what
 * happens after the elopement, in the guides' own voice. The sample card
 * points at the demo Maya & Theo room and derives its access code from
 * `demoProofingAlbums`, so the page and the fixture can never drift apart.
 */
const sampleRoom = demoProofingAlbums[0]

export const galleries = {
    headline: "After the summit, your gallery.",
    intro: "Three weeks after you come down, you get a private gallery of your own — the whole day in order, from the trailhead to the stars — where you and your families choose the frames that become prints and the album.",
    steps: [
        {
            title: "The link arrives",
            body: "Three weeks after the elopement you'll get a private link and an access code that's yours alone — the day sequenced the way it happened.",
        },
        {
            title: "Relive the climb",
            body: "Scroll the day from the headlamps to the fire. Mark the frames you keep returning to; your picks save as you go, so parents can take their turn tomorrow.",
        },
        {
            title: "Send your picks",
            body: "One press and your selection lands with us, with any notes about sizes or the album. We print your picks and lay out the album spreads with you.",
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
            typeId: "planning-call",
            name: "Planning call",
            durationMinutes: 45,
            description:
                "Forty-five minutes on video: the kind of place you're dreaming about, who's coming, how far you'd like to walk — and three locations we'd suggest.",
        },
        {
            typeId: "gear-check",
            name: "Gear check",
            durationMinutes: 30,
            description:
                "Half an hour a month out to go through layers, boots, the dress and the dry bag — so nobody is cold, blistered or soaked on the day.",
        },
        {
            typeId: "scouting-hike",
            name: "Scouting hike",
            durationMinutes: 180,
            description:
                "Three hours on the trail with a guide if you're in Telluride before the day — walk the route, stand where you'll say it and see the light.",
        },
    ],
    providers: [
        {
            providerId: "tali-mensah",
            name: "Tali Mensah",
            windows: [
                { day: 1, start: 9 * 60, end: 15 * 60 },
                { day: 2, start: 9 * 60, end: 15 * 60 },
                { day: 3, start: 12 * 60, end: 18 * 60 },
            ],
        },
    ],
}

/**
 * The /book page's copy and art. `sessionImages` fronts each session
 * type's card with a frame from the elopements — art from code, facts
 * from the contract. Keys must stay joined to `codeAppointments.types`
 * type ids; the booking tests hold the join. `notesImage` fronts the
 * how-a-booking-works panel.
 */
export const booking = {
    headline: "Book a call with the guides.",
    intro: "Choose a call, then a time from our real weekday calendar — Thursdays to Sundays we're on the mountain. A confirmation with a one-click cancel link arrives by email.",
    sessionImages: {
        "planning-call": albums[2].images[2],
        "gear-check": albums[0].images[4],
        "scouting-hike": albums[1].images[2],
    } as Record<string, PhotoImage>,
    notesImage: albums[0].images[1],
}

export const inquire = {
    headline: "Tell us where you'd say it.",
    body: "A few lines about the two of you, roughly when, and the kind of place you're imagining — a canyon, a ridge, the aspens, the coast. We'll reply within two working days with dates, three places we'd suggest and a real quote.",
    confirmation:
        "Thank you — your note is on its way. We reply to every inquiry within two working days, usually sooner.",
    fields: [
        { name: "names", label: "Your names", required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        { name: "date", label: "Date or season", type: "date" as const },
        {
            name: "venue",
            label: "The kind of place",
            placeholder: "A canyon, a ridge, the aspens, the coast",
        },
        {
            name: "message",
            label: "About the two of you & who's coming",
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
        variant: "split" as "split" | "centered" | "inline" | "full-width" | "pill-links",
        cta: "Plan your elopement",
    },
    /** The inquiry ask the pages close on. */
    inquireCta: "Plan your elopement",
    /** The softer ask on the about and book pages. */
    startInquiryCta: "Write to the guides",
    /** The currency package prices are in (ISO 4217). */
    currency: "usd",
    home: {
        primaryCta: "Plan your elopement",
        secondaryCta: "",
        introCta: "Meet the guides",
        selectedWorkKicker: "From recent elopements",
        selectedWorkTitle: "Up the hill, on the day.",
        packagesTitle: "Three ways up, priced flat.",
        reviewsKicker: "From the trail",
        weddingsKicker: "Recent elopements",
        locationsKicker: "The places",
        locationsTitle: "Four places we know by heart.",
        /** The spec sheet's row labels (`stack` with `home.locations`). */
        locationLabels: {
            where: "Where",
            season: "Season",
            permit: "Permit",
            elevation: "Elevation",
            hike: "The walk in",
            coordinates: "Coordinates",
        },
        bannerTitle: "We handle permits, sunrise timing and the hike. From $5,800.",
        bannerBody: "",
        bannerCta: "Plan your elopement",
    },
    weddingsPage: {
        headline: "The elopements.",
        subheadline:
            "Three recent days, each told place by place, the way they happened. Open one to walk it with us.",
        allCta: "All elopements",
        bannerTitle: "Know a place that takes your breath away?",
    },
    packagesPage: { bannerTitle: "The best dates go a season ahead." },
    galleriesPage: {
        stepsKicker: "How proofing works",
        bannerTitle: "Your gallery starts at the trailhead.",
    },
    bookPage: {
        notesKicker: "Good to know",
        notesHeadline: "How a booking works.",
        notesBody:
            "The calendar shows our real weekday openings a few weeks out, in Mountain time. Hold a time and it's yours — the confirmation email carries a one-click cancel link, and rescheduling is free up to 48 hours before we meet.",
        notesBullets: [
            "Planning calls and gear checks happen over video, wherever you are",
            "Scouting hikes start from the Telluride gondola plaza",
            "Elopement dates themselves are held by inquiry, never by the calendar",
        ],
        notesCta: "Ask a question first",
        bannerTitle: "Planning something the calendar can't hold?",
    },
    aboutPage: {
        kicker: "About",
        reviewsKicker: "From the trail",
        reviewsTitle: "From couples and their families",
        bannerTitle: "Let's find your place.",
    },
    inquirePage: { formKicker: "Inquiry", formTitle: "The details", submit: "Send inquiry" },
}
