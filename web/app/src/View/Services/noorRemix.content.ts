/**
 * The services-makeup-noor remix's content seed (packs/README.md "Derived
 * templates"): a South Asian bridal makeup and hair studio worn over the
 * services pack. At compose time this file is copied byte-for-byte over
 * `View/Services/content.ts`, so it must remain a STRUCTURAL TWIN of that
 * module — the same export surface, the same shapes, the contract's
 * minimums met (tests/View/Services/groupOneRemixSeeds.test.ts pins the
 * twin).
 *
 * The trade: Studio Noor, an Edison, New Jersey studio that dresses a
 * bride for every event of the wedding weekend. The home page opens on
 * the four events as arched portraits — mehndi, sangeet, wedding,
 * reception — then lets the bride build her weekend on a ticked package
 * board with a running total, shows the bridal looks, walks the weekend
 * Thursday to Sunday, and closes on a bride's words and one ask.
 * Projects become bare-to-bridal comparisons, the quote form becomes the
 * wedding-weekend inquiry, and the booking strip books consultations and
 * trials against the studio week — wedding days stay contract-only.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/services-makeup-noor` (see PACK.md). The art direction
 * is jewel light — marigold, rose, vermilion, and emerald grounds with
 * gold everywhere — and every comparison is the same face against the
 * same ivory wall.
 */

import type { DayHours } from "../Landing/hours"
import type { AppointmentsContent } from "../Landing/practiceDocument"

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
        src: `/services-makeup-noor/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({
            src: `/services-makeup-noor/${name}-${step}w.webp`,
            width: step,
        })),
    }
}

export const business = {
    name: "Studio Noor",
    tagline: "South Asian bridal makeup & hair",
    location: "Edison, New Jersey",
    /** Shown everywhere the number appears; `phoneHref` is the tap target. */
    phone: "(732) 555-0188",
    phoneHref: "tel:+17325550188",
    email: "hello@studionoor.example",
    address: "1450 Oak Tree Road, Suite 2B, Edison, NJ 08820",
    /** The license line — rendered wherever trust is being earned. */
    license: "NJ licensed cosmetologists · Serving NJ, NY & the Tri-State",
}

/**
 * Weekly hours drive the quote page's hours line (the shared hours
 * engine, `View/Landing/hours.ts`). Minutes since midnight; a day may
 * have several intervals. Studio days only — wedding events are booked on
 * contract, on location.
 */
export const weeklyHours: DayHours[] = [
    { day: 1, intervals: [[660, 1200]] }, // Mon 11 AM – 8 PM
    { day: 2, intervals: [[660, 1200]] },
    { day: 3, intervals: [[660, 1200]] }, // Wed
]

export const hoursNote = "Studio Monday–Wednesday 11 AM–8 PM · Thursday through Sunday we're at the wedding"

/** Where the kit travels — the home page's quiet strip. */
export const serviceArea = ["Edison", "Jersey City", "Princeton", "Manhattan", "Long Island", "Philadelphia"]

/**
 * Landing copy the trade owns: the few strings the landing modules render
 * that would read wrong for a different trade. Remix seeds retrade these
 * along with the rest of the content — everything else in the landing
 * modules is trade-neutral on purpose.
 */
export const landingCopy = {
    /** The home page's services-section heading. */
    servicesHeading: "Every event",
    /** The shared nav: page link labels, the CTA, and the logo's line. */
    nav: {
        projects: "Bridal looks",
        services: "Packages",
        about: "The studio",
        cta: "Book your consultation",
        /** Small line under the wordmark; "" for none. */
        tagline: "South Asian bridal makeup & hair",
    },
    /** The booking ask on heroes, banners, and the about story. */
    quoteCta: "Book your consultation",
    home: {
        nowBuildingLabel: "This season",
        servicesKicker: "Every event",
        transformationsKicker: "Bare to bridal",
        transformationsTitle: "Drag from the bare face to the wedding",
        testimonialsKicker: "From our brides",
        serviceAreaLabel: "On location across the Tri-State",
        bannerTitle: "Culturally rooted. Contemporarily you.",
        bannerBody: "Limited wedding-season dates available. The first consultation is free.",
    },
    projects: {
        headline: "Bridal looks.",
        subheadline:
            "Mehndi to reception — every look built for the event, the outfit, and the jewelry, and never lighter than your own skin. Drag a divider: bare, then bridal.",
        kicker: "Bare to bridal",
        bannerTitle: "See your weekend in here?",
    },
    servicesPage: {
        headline: "Every event, priced.",
        subheadline:
            "Build the weekend event by event, or book one look. Every bridal booking includes lashes, draping, jewelry setting, and a touch-up kit.",
        kicker: "Packages",
        faqKicker: "Before you book",
        faqTitle: "What brides and mothers ask first",
        bannerTitle: "Planning the whole weekend?",
        bannerBody: `Call ${business.phone} or send your dates — we'll send back the artists, the timings, and the package.`,
    },
    about: {
        kicker: "The studio",
        bullets: [
            business.license,
            "Draping and jewelry setting in every bridal look",
            "Every skin tone, matched by hand",
        ],
        credentialsLabel: "Credentials",
        reviewsKicker: "From our brides",
        reviewsTitle: "Brides, mothers, and a very honest aunt",
        bannerTitle: "Come sit with us.",
    },
    quotePage: {
        kicker: "Wedding weekend inquiry",
        title: "The dates and the events",
        cta: "Send to Studio Noor",
    },
}

export interface Service {
    slug: string
    title: string
    /** Small uppercase label on the card, e.g. the room or trade. */
    eyebrow: string
    description: string
    /** "From $12,000" / "By consultation" — honest ballparks build trust. */
    priceNote: string
    image: SiteImage
}

export interface Project {
    slug: string
    title: string
    /** The place — the eyebrow on the comparison caption. */
    location: string
    /** One line of scope and duration, e.g. "Full gut remodel — 6 weeks". */
    scope: string
    description: string
    before: SiteImage
    after: SiteImage
}

/** The four events as arched portraits, shared by the hero and the service cards. */
const arches = {
    mehndi: photo(
        "arch-mehndi",
        1200,
        1600,
        "A bride in a marigold lehenga laughing mid-twirl, showing off her hennaed hands in front of a wall of marigold garlands",
    ),
    sangeet: photo(
        "arch-sangeet",
        1200,
        1600,
        "A laughing bride twirling in a blush-pink embroidered lehenga, her dark hair loose, pink bokeh behind her",
    ),
    wedding: photo(
        "arch-wedding",
        1200,
        1600,
        "A bride in a red and gold bridal lehenga and dupatta laughing behind her hand, candlelight glowing behind her",
    ),
    reception: photo(
        "arch-reception",
        1200,
        1600,
        "A bride in a champagne-gold sequined lehenga spinning on the dance floor, one arm raised, emerald drapes and string lights behind",
    ),
}

/** The weekend's candid moments — one for each day on the timeline. */
const days = {
    thursday: photo(
        "medallion-thursday",
        1024,
        1024,
        "An artist drawing an intricate henna mandala on a bride's palm over a bed of marigolds",
    ),
    friday: photo(
        "medallion-friday",
        1024,
        1024,
        "A bride in a pink dupatta laughing with her head thrown back as an artist sweeps blush on her cheek",
    ),
    saturday: photo(
        "medallion-saturday",
        1024,
        1024,
        "An artist setting a gold kundan maang tikka on a bride's parting while the bride grins up at her",
    ),
    sunday: photo(
        "medallion-sunday",
        1024,
        1024,
        "A bride in gold sequins pulling a kiss face at her compact mirror, lipstick in hand, emerald bokeh behind her",
    ),
}

/** The bridal looks — the home page's mosaic and the portfolio. */
const looks = {
    emeraldEyes: photo(
        "look-emerald-eyes",
        1600,
        1200,
        "A close portrait of a bride mid-laugh with a gold-and-bronze smoky eye, a nude lip, and an emerald dupatta edged in gold",
    ),
    redDupatta: photo(
        "look-red-dupatta",
        1600,
        1200,
        "A bride in red laughing with her head thrown back on a carved window seat as a cousin adjusts her dupatta",
    ),
    pink: photo(
        "look-pink",
        1600,
        1200,
        "A bride in a dusty-pink lehenga with soft curls, seated before a gilded mirror",
    ),
    hands: photo(
        "look-hands",
        1600,
        1200,
        "A bride's hennaed hands resting on a red lehenga, stacked with red and gold bangles and kaleere",
    ),
    emeraldBride: photo(
        "look-emerald-bride",
        1600,
        1200,
        "A bride in an emerald and gold lehenga glancing back with a wide grin as she walks through a carved sandstone arcade",
    ),
}

const studio = photo(
    "about-studio",
    1600,
    1200,
    "Two artists laughing at a lit vanity in an emerald-walled studio, a rail of embroidered lehengas behind them",
)

export const projects: Project[] = [
    {
        slug: "wedding-bride",
        title: "The wedding look",
        location: "The Marigold Estate, Somerset",
        scope: "Bridal — trial, draping, and the ceremony",
        description:
            "A long-wear base matched by hand, a soft bronze eye, a deep rose lip, and a tikka pinned so it never moved through the pheras.",
        before: photo(
            "look-bride-before",
            1600,
            1200,
            "A young woman in a cream robe laughing, bare-faced, with her damp hair in a loose bun",
        ),
        after: photo(
            "look-bride-after",
            1600,
            1200,
            "The same woman ready and laughing: bronze-gold shimmer eyes, a deep rose lip, and a gold maang tikka",
        ),
    },
    {
        slug: "mother-of-the-bride",
        title: "Mother of the bride",
        location: "The Palace Ballroom, Edison",
        scope: "Family chair — makeup and saree draping",
        description:
            "A soft, luminous base that stays put under stage lights, a defined brow, and the rose lip she's worn for thirty years.",
        before: photo(
            "look-mother-before",
            1600,
            1200,
            "A woman with long loose gray hair and reading glasses on her head, bare-faced and laughing, in a sage kurta",
        ),
        after: photo(
            "look-mother-after",
            1600,
            1200,
            "The same woman ready: hair in a low bun, a small bindi, a rose-brown lip, laughing with her hands clasped",
        ),
    },
]

export const services: Service[] = [
    {
        slug: "mehndi",
        title: "Mehndi",
        eyebrow: "Thursday",
        description:
            "Soft, fresh, and festive: airbrush makeup, hair, and a henna touch-up so your hands photograph.",
        priceNote: "$450",
        image: arches.mehndi,
    },
    {
        slug: "sangeet",
        title: "Sangeet",
        eyebrow: "Friday",
        description: "Party makeup, a hairstyle built to dance in, and a lash set.",
        priceNote: "$550",
        image: arches.sangeet,
    },
    {
        slug: "wedding",
        title: "Wedding",
        eyebrow: "Saturday",
        description:
            "Bridal makeup and hair, the trial, dupatta draping, jewelry setting, and touch-ups through the pheras.",
        priceNote: "$1,250",
        image: arches.wedding,
    },
    {
        slug: "reception",
        title: "Reception",
        eyebrow: "Sunday",
        description: "Glam makeup, a fresh hairstyle, and your reception jewelry set and pinned.",
        priceNote: "$650",
        image: arches.reception,
    },
]

/** The trust numbers — the metrics strip. Keep values short and big. */
export const metrics = [
    { value: "12", label: "wedding seasons" },
    { value: "700+", label: "brides" },
    { value: "4", label: "events, one artist" },
    { value: "5.0★", label: "average of 320 reviews" },
]

export const testimonials = [
    {
        quote: "From my Mehndi touch-up to my Wedding day, Studio Noor made me feel like the most beautiful version of myself. Every detail, every look — absolutely flawless.",
        name: "Priya S.",
        detail: "Bride",
    },
    {
        quote: "They matched my foundation to my actual skin, not two shades lighter. I have never been so happy to see my own face in photographs.",
        name: "Ananya R.",
        detail: "Bride, Princeton",
    },
    {
        quote: "They draped my saree faster than my mother ever could, and my makeup lasted through the baraat, the ceremony, and every aunty's hug.",
        name: "Meera P.",
        detail: "Mother of the bride, Edison",
    },
]

/** The season's line — unused on the collage home, so empty. */
export const nowBuilding: string[] = []

export interface BuildLogStep {
    /** The day on the rail, e.g. "Thursday". */
    label: string
    title: string
    description: string
    image: SiteImage
    /** More photographs of the same step, set beside the first. */
    frames?: SiteImage[]
}

/** The wedding weekend, Thursday to Sunday — the home page's rail. */
export const buildLog = {
    kicker: "The weekend",
    title: "Wedding weekend timeline",
    steps: [
        {
            label: "Thursday",
            title: "Welcome & Mehndi",
            description: "Soft, fresh & festive. Henna-ready hands and a radiant you.",
            image: days.thursday,
        },
        {
            label: "Friday",
            title: "Sangeet",
            description: "Fun, glamorous & unforgettable. Let's make you shine on the dance floor.",
            image: days.friday,
        },
        {
            label: "Saturday",
            title: "Wedding",
            description: "The main moment. Timeless bridal beauty, perfected.",
            image: days.saturday,
        },
        {
            label: "Sunday",
            title: "Reception",
            description: "Polished, elegant & celebratory. Your final glow.",
            image: days.sunday,
        },
    ] as BuildLogStep[],
}

export interface Specimen {
    name: string
    use: string
    description: string
    image: SiteImage
}

/** The base pack's materials board — unused, so empty. */
export const species = {
    kicker: "",
    title: "",
    items: [] as Specimen[],
}

export interface Swatch {
    name: string
    code: string
    color: string
    note: string
    image?: SiteImage
}

/** The color deck — unused, so empty. */
export const palette = {
    kicker: "",
    title: "",
    items: [] as Swatch[],
}

export interface PriceMenuItem {
    name: string
    /** What's included, or the hours. */
    note?: string
    price: string
    qualifier?: string
}

export interface PriceMenuGroup {
    heading: string
    items: PriceMenuItem[]
}

/** The weekend package, event by event (pricing `builder`: tick the events, watch the total). */
export const priceMenu = {
    kicker: "",
    title: "Build your wedding weekend look",
    intro: "",
    groups: [
        {
            heading: "Look inclusions",
            items: [
                { name: "Mehndi", note: "Airbrush makeup + hair + henna touch-up", price: "$450" },
                { name: "Sangeet", note: "Party makeup + hairstyle + eyelash set", price: "$550" },
                { name: "Wedding", note: "Bridal makeup + hair + trial + touch-up", price: "$1,250" },
                { name: "Reception", note: "Glam makeup + hair + jewelry setting", price: "$650" },
            ],
        },
    ] as PriceMenuGroup[],
    footnote: "Custom package · a 30% retainer holds your dates",
}

export interface LookbookItem {
    name: string
    /** The work and the occasion. */
    meta: string
    description: string
    /** The portfolio's filter chips. */
    tags: string[]
    image: SiteImage
    /** The column a directory groups the item under; the lookbook's eyebrow. */
    group?: string
}

/** The bridal looks — the home page's mosaic and the portfolio's first grid. */
export const lookbook = {
    kicker: "Bridal looks",
    title: "Timeless. Personalized. Unforgettable.",
    items: [
        {
            name: "Emerald & gold",
            meta: "Wedding · Somerset",
            description: "A gold-bronze smoky eye built to hold through a four-hour ceremony.",
            tags: ["Wedding"],
            image: looks.emeraldEyes,
        },
        {
            name: "Red & kundan",
            meta: "Wedding · Jersey City",
            description: "The classic red, a winged kohl, and a lip lined twice for the photographs.",
            tags: ["Wedding"],
            image: looks.redDupatta,
        },
        {
            name: "Rose sangeet",
            meta: "Sangeet · Princeton",
            description: "Soft curls and a rose-gold eye made for dancing.",
            tags: ["Sangeet"],
            image: looks.pink,
        },
        {
            name: "The hands",
            meta: "Mehndi · Edison",
            description: "A henna touch-up and bangles set before the photographer arrives.",
            tags: ["Mehndi"],
            image: looks.hands,
        },
        {
            name: "Emerald reception",
            meta: "Reception · Manhattan",
            description: "A lifted lash and a nude lip for an evening in emerald.",
            tags: ["Reception"],
            image: looks.emeraldBride,
        },
    ] as LookbookItem[],
}

export interface Policy {
    title: string
    body: string
}

/** House rules — covered in the FAQ, so no card. */
export const policies = {
    kicker: "",
    title: "",
    cardTitle: "",
    body: "",
    image: null as SiteImage | null,
    items: [] as Policy[],
}

export interface HeroPanel {
    /** The plate under the panel, e.g. "Mehndi". */
    label: string
    image: SiteImage
}

export interface JournalEntry {
    /** The season or dateline over the headline, e.g. "Spring". */
    season: string
    title: string
    description: string
    image: SiteImage
}

/**
 * The garden journal — a season's story per entry, set as the stories
 * spread (showcase `stories`: the first entry leads with its photograph,
 * the rest follow in thirds). Each story jumps to the projects page under
 * `linkLabel`. Empty `items` to drop the section.
 */
export const journal = {
    kicker: "",
    title: "",
    linkLabel: "",
    items: [] as JournalEntry[],
}

export interface WalkFrame {
    /** One line under the frame; the number is set by the section. */
    caption: string
    image: SiteImage
}

/**
 * A walk through one garden, frame by frame (gallery `sequence`: each
 * photograph at its own shape, stacked down the page in walking order).
 * Empty `frames` to drop the section.
 */
export const walk = {
    kicker: "",
    title: "",
    frames: [] as WalkFrame[],
}

export const home = {
    /** The studio's name over the four arches. */
    headline: "Studio Noor",
    subheadline: "Every event, every look.",
    heroImage: arches.wedding,
    /** Show each service's `priceNote` under its title in the home grid. */
    servicePrices: true,
    /** The package board carries the offer on home, so no services grid there. */
    serviceGrid: false,
    hero: {
        /** The collage: the name over the four event arches. */
        storefront: false,
        /** No credit line: the subheadline is the line under the name. */
        credit: "",
        /** No photo caption. */
        caption: "",
        /** The name stays whole. */
        accent: "none" as "none" | "last-word",
        /** No kicker over the name. */
        kicker: "",
        /** No cover lines. */
        coverLines: [] as string[],
        /** The four events as arched portraits. */
        panels: [
            { label: "Mehndi", image: arches.mehndi },
            { label: "Sangeet", image: arches.sangeet },
            { label: "Wedding", image: arches.wedding },
            { label: "Reception", image: arches.reception },
        ] as HeroPanel[],
        /** Title-card only: the studio's seal — first line small, the rest large. Empty: none. */
        seal: "",
    },
    /** The home before/after teaser: the wedding look. */
    featuredProjects: [projects[0]] as Project[],
    /** The home metrics strip (empty: the numbers live on the about page). */
    proofMetrics: [] as typeof metrics,
    /** No banner artwork: the closing ask sits on the emerald ground. */
    bannerImage: null as SiteImage | null,
}

export interface FeatureFigure {
    /** The small caps title under the detail photograph. */
    title: string
    caption: string
    image: SiteImage
}

/** The long-form feature story — unused, so empty. */
export const feature = {
    kicker: "",
    headline: "",
    paragraphs: [] as string[],
    image: null as SiteImage | null,
    linkLabel: "",
    pullQuote: "",
    figures: [] as FeatureFigure[],
    plate: null as SiteImage | null,
    plateCaption: "",
}

export const about = {
    headline: "Four events. One artist who knows your face.",
    photo: studio,
    paragraphs: [
        "Noor Qureshi started doing makeup for her cousins' mehndis in a basement in Iselin, with a fishing-tackle box of kohl and a very strong opinion about foundation shades. Twelve wedding seasons later, Studio Noor is a team of six on Oak Tree Road.",
        "We build the weekend with you, not just the wedding. The mehndi look is lighter so the henna can be the star; the sangeet look is built to dance; the wedding look is tested at a trial and holds through every ritual; the reception look is the glamorous one.",
        "Every artist matches foundation by hand, drapes a dupatta and a saree, and sets jewelry so it stays put. The same artist follows you from Thursday to Sunday, so nobody has to learn your face twice.",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "NJ Board of Cosmetology licensed",
        "Airbrush & HD certified",
        "Saree & dupatta draping",
        "Cruelty-free kit",
    ],
}

export const process = {
    kicker: "How a weekend is booked",
    title: "Consultation to reception",
    steps: [
        {
            title: "The consultation",
            description:
                "Free, thirty minutes, at the studio or on video: your events, your outfits, your jewelry, and your skin.",
        },
        {
            title: "The package",
            description:
                "Pick the events, see the total, and hold your dates with a 30% retainer. Nothing is added later.",
        },
        {
            title: "The trial",
            description:
                "Two hours at the studio, ideally with your wedding dupatta and jewelry. Every product goes on your face chart.",
        },
        {
            title: "The weekend",
            description:
                "The same artist from mehndi to reception, on location, with a touch-up kit and your exact lip left with your sister.",
        },
    ],
}

export const faq = [
    {
        question: "Can I book just the wedding?",
        answer: "Of course. Every event can be booked on its own. The weekend board is there so you can see what the whole package comes to before you decide.",
    },
    {
        question: "Will my foundation match?",
        answer: "It's matched by hand at the trial, on your jaw, in daylight, and mixed if it needs to be. We never go lighter than your skin, and we bring the full range to every booking.",
    },
    {
        question: "Do you drape the dupatta and set jewelry?",
        answer: "Yes, both are included in every bridal look. We pin the dupatta for the ceremony and re-drape it for the photographs, and we set the tikka, the nath, and the passa so nothing moves.",
    },
    {
        question: "Do you travel?",
        answer: "Across New Jersey, New York City, Long Island, and Philadelphia. Travel inside Middlesex County is included; everywhere else is a flat travel fee quoted with your package.",
    },
    {
        question: "What holds my dates?",
        answer: "A signed contract and a 30% retainer, which comes off your final invoice. It moves with you once if your dates change with ninety days' notice.",
    },
]

/**
 * The appointments contract's code fallback — the same booking mode 2 the
 * care pack runs (web/app/src/View/Landing/practiceDocument.ts): visit
 * types x weekly availability windows, projected into concrete capacity-1
 * slots by `generateAppointmentSlots`. The catalog's `content.appointments`
 * seed mirrors this export exactly (the remix-seed tests pin the twin), so
 * an owner's Manage edit and this file walk the same rendering path.
 *
 * The studio books two kinds of visit online: the free consultation and
 * the bridal trial. One provider — Noor takes every bride's first visit —
 * on studio days only; wedding events are on contract.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "consultation",
            name: "Free consultation",
            durationMinutes: 30,
            description: "At the studio or on video: your events, your outfits, your jewelry, and your skin.",
        },
        {
            typeId: "bridal-trial",
            name: "Bridal trial",
            durationMinutes: 120,
            description:
                "Your wedding look tested at the studio, with your dupatta and jewelry, and written on your face chart.",
        },
    ],
    providers: [
        {
            providerId: "noor-qureshi",
            name: "Noor Qureshi",
            windows: [
                { day: 1, start: 11 * 60, end: 20 * 60 },
                { day: 2, start: 11 * 60, end: 20 * 60 },
                { day: 3, start: 11 * 60, end: 20 * 60 },
            ],
        },
    ],
}

/** The /quote page's booking strip — the slot picker above the form. */
export const booking = {
    headline: "Book your consultation",
    intro: "Book a free consultation or your bridal trial at the studio. Pick a time and you'll get a confirmation with a one-click reschedule link. For the wedding weekend itself, send your dates through the form below.",
    /** The new/returning select's trade voice (the widget's statusLabels). */
    statusLabels: { new: "First visit to Studio Noor", returning: "I've been in the chair" },
    /** The line under the booking form (the widget's privacyNote). */
    privacyNote:
        "A name and a way to reach you hold the time. Your face chart and your family's details stay at the studio, and nowhere else.",
}

export const quote = {
    headline: "Tell us about your weekend.",
    body: "Your dates, your events, and how many faces. You'll hear back within a day with the artists, the timings, and the package.",
    confirmation:
        "Thank you — it's in. Noor answers every weekend inquiry herself within a day, with your dates' availability first.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        { name: "phone", label: "Phone", type: "tel" as const, required: true },
        { name: "date", label: "Wedding date", type: "date" as const, required: true },
        {
            name: "events",
            label: "Events",
            type: "select" as const,
            options: ["The whole weekend", "Wedding only", "Wedding and reception", "Mehndi or sangeet only"],
            required: true,
        },
        { name: "location", label: "Venues", placeholder: "Where each event is, and the city" },
        { name: "faces", label: "Family & party faces", placeholder: "Mother, sisters, cousins …" },
        {
            name: "message",
            label: "Your outfits and ideas",
            type: "textarea" as const,
            fullWidth: true,
        },
    ],
}
