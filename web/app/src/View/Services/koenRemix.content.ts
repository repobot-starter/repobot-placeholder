/**
 * Remix seed — Kōen Garden Studio, the Pacific Northwest moss-and-stone
 * derived template of the services pack (packs/services-landscape-koen).
 * A complete, drop-in replacement for `./content.ts`: the composer copies
 * it over the pack's content module byte-for-byte, so it must stay a
 * structural twin — same exports, same relative imports, images under its
 * own `/services-landscape-koen/` public directory. The parity tests pin
 * the export surface against the real module.
 *
 * The home is one garden walked frame by frame (`walk`, gallery
 * `panorama`) under a full-bleed title card with the studio's seal; the
 * before/after proof lives on the gardens page.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/services-landscape-koen`. The `photo` helper mirrors that
 * verb's naming exactly. Walk frames are wide 16:9 strips, shot in the
 * order the path is walked.
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
        src: `/services-landscape-koen/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({
            src: `/services-landscape-koen/${name}-${step}w.webp`,
            width: step,
        })),
    }
}

const stoneFrame = photo(
    "walk-stone",
    1600,
    900,
    "Two lichen-covered basalt boulders on cushions of moss in a raked gravel court, sword ferns behind",
)
const mapleFrame = photo(
    "walk-maple",
    1600,
    900,
    "A red Japanese maple spreading over a mossy knoll beside a basalt boulder, fir forest in mist behind",
)

export const business = {
    name: "KŌEN",
    tagline: "Garden Studio",
    location: "Bainbridge Island, Washington",
    /** Shown everywhere the number appears; `phoneHref` is the tap target. */
    phone: "(206) 555-0117",
    phoneHref: "tel:+12065550117",
    email: "studio@koen-garden.example",
    address: "8420 NE Day Road, Bainbridge Island, WA 98110",
    /** The license line — rendered wherever trust is being earned. */
    license: "WA landscape contractor KOENGGS812PB · Bonded & insured",
}

/**
 * Weekly hours drive the quote page's hours line (and the live badge, if
 * the storefront hero is ever switched on). Minutes since midnight; a day
 * may have several intervals.
 */
export const weeklyHours: DayHours[] = [
    { day: 2, intervals: [[540, 1020]] }, // Tue 9 AM – 5 PM
    { day: 3, intervals: [[540, 1020]] },
    { day: 4, intervals: [[540, 1020]] },
    { day: 5, intervals: [[540, 1020]] },
    { day: 6, intervals: [[600, 840]] }, // Sat 10 AM – 2 PM
]

export const hoursNote = "Studio open Tuesday–Saturday · Garden walks by appointment"

/** Where the studio builds and tends — the home page's quiet strip. */
export const serviceArea = [
    "Bainbridge Island",
    "Poulsbo",
    "Port Madison",
    "Seattle",
    "Vashon",
    "Port Townsend",
]

/**
 * Every string the pages render that isn't a fact about the business:
 * section kickers and titles, the asks, the closing banners — mirrors the
 * base module's `landingCopy` so the landing modules retrade with it.
 */
export const landingCopy = {
    /** The home page's services-section heading. */
    servicesHeading: "Garden design · Seasonal care · Moss & stone",
    /** The shared nav: page link labels, the CTA, and the logo's line. */
    nav: {
        projects: "Gardens",
        services: "Studio",
        about: "About",
        cta: "Arrange a walk",
        /** Small line under the wordmark; "" for none. */
        tagline: "",
    },
    /** The quote ask on heroes, banners, and the about story. */
    quoteCta: "Arrange a garden walk",
    home: {
        nowBuildingLabel: "",
        servicesKicker: "The studio",
        transformationsKicker: "Before & after",
        transformationsTitle: "The same ground, two years on",
        testimonialsKicker: "From our gardens",
        serviceAreaLabel: "Gardens on",
        bannerTitle: "Garden design · Seasonal care · Moss & stone",
        bannerBody: "Bainbridge Island and the Kitsap shore · By appointment",
    },
    projects: {
        headline: "Ground, given time.",
        subheadline:
            "Each pair is the same ground from the same spot — the day we first walked it, and two seasons after. Drag the divider.",
        kicker: "Before & after",
        bannerTitle: "Every garden begins with a walk.",
    },
    servicesPage: {
        headline: "Made slowly. Kept quietly.",
        subheadline:
            "We design, build and tend a small number of gardens each year. Every project begins with a walk and a written proposal.",
        kicker: "The studio",
        faqKicker: "Before the walk",
        faqTitle: "What clients ask us",
        bannerTitle: "Stillness, cultivated.",
        bannerBody: `Call ${business.phone} or write to the studio — Hideo walks every new garden himself.`,
    },
    about: {
        kicker: "The studio",
        bullets: [
            business.license,
            "Moss and stone from the Olympic Peninsula",
            "The same hands, every season",
        ],
        credentialsLabel: "Credentials",
        reviewsKicker: "From our gardens",
        reviewsTitle: "Gardens we still tend",
        bannerTitle: "Walk your garden with us.",
    },
    quotePage: {
        kicker: "Arrange a garden walk",
        title: "The ground, the light, the wish",
        cta: "Send to the studio",
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
    /** The town — the eyebrow on the comparison caption. */
    location: string
    /** One line of scope and duration, e.g. "Full gut remodel — 6 weeks". */
    scope: string
    description: string
    before: SiteImage
    after: SiteImage
}

export const projects: Project[] = [
    {
        slug: "port-madison-garden",
        title: "Port Madison back garden",
        location: "Bainbridge Island",
        scope: "Lawn to moss garden — 8 weeks, two seasons to settle",
        description:
            "A soggy lawn behind a chain-link fence turned into a moss garden: a stepping-stone path, a raked gravel circle, a red maple and a cedar fence.",
        before: photo(
            "yard-before",
            1600,
            1200,
            "The Port Madison back garden before: a patchy, waterlogged lawn behind a chain-link fence under a tall fir",
        ),
        after: photo(
            "yard-after",
            1600,
            1200,
            "The same garden after: moss, stepping stones, a raked gravel circle, clipped shrubs, a red maple and a cedar fence",
        ),
    },
    {
        slug: "winslow-side-path",
        title: "Winslow side path",
        location: "Bainbridge Island",
        scope: "Side yard to stone path — 2 weeks",
        description:
            "A bare, weedy strip beside the house became a cut-stone path through gravel, moss, ferns and hostas, with a small stone lantern at the turn.",
        before: photo(
            "side-before",
            1600,
            1200,
            "The Winslow side yard before: bare mud, weeds, a coiled hose and stacked pavers along a gray house",
        ),
        after: photo(
            "side-after",
            1600,
            1200,
            "The same side yard after: a cut-stone path through gravel and moss, ferns and hostas, a small stone lantern",
        ),
    },
]

export const services: Service[] = [
    {
        slug: "garden-design",
        title: "Garden design",
        eyebrow: "The plan",
        description:
            "A walk, a plan and drawings for the whole garden — paths, stone, water and the trees worth keeping.",
        priceNote: "Design from $9,500",
        image: projects[0].after,
    },
    {
        slug: "moss-and-stone",
        title: "Moss & stone",
        eyebrow: "The build",
        description:
            "Boulders set by hand, stepping stones, gravel courts and moss lawns grown from local cushions.",
        priceNote: "By proposal",
        image: stoneFrame,
    },
    {
        slug: "seasonal-care",
        title: "Seasonal care",
        eyebrow: "Every season",
        description:
            "Pruning the maples and pines, raking the gravel, weeding the moss — a monthly visit from the same gardener.",
        priceNote: "From $640 / month",
        image: mapleFrame,
    },
]

/** The trust numbers — the metrics strip. Keep values short and big. */
export const metrics = [
    { value: "2011", label: "building gardens on the island since" },
    { value: "9", label: "new gardens a year, no more" },
    { value: "54", label: "gardens in our seasonal care" },
]

export const testimonials = [
    {
        quote: "We used to mow a swamp. Now the first thing we do every morning is walk the stones with our coffee.",
        name: "Anna & David Lindqvist",
        detail: "Port Madison, Bainbridge Island",
    },
    {
        quote: "Hideo spent an hour just standing in the garden before he said anything. Everything he built afterwards looks like it has always been there.",
        name: "Margaret Oyelaran",
        detail: "Garden design, Seattle",
    },
    {
        quote: "Two winters of rain and the moss has only gotten deeper. They come once a month and leave it quieter every time.",
        name: "Tomás Ibarra",
        detail: "Seasonal care, Poulsbo",
    },
]

/**
 * What's on the bench right now — the home page's rolling ticker, one
 * line per job. Empty to drop the section.
 */
export const nowBuilding: string[] = []

export interface BuildLogStep {
    /** The short mark on the rail — a month, a phase. */
    label: string
    title: string
    description: string
    image: SiteImage
}

/**
 * One job from start to finish — the home page's horizontal build log.
 * Four to six steps read best across the frame. Empty `steps` to drop it.
 */
export const buildLog = {
    kicker: "",
    title: "",
    steps: [] as BuildLogStep[],
}

export interface Specimen {
    name: string
    /** What it's used for — set after a slash under the name. */
    use: string
    /** One line; the plate does the talking. */
    description: string
    /** A tall portrait (3:4) of the material itself. */
    image: SiteImage
}

/**
 * The materials board — tall 3:4 plates of what the work is made of.
 * Empty `items` to drop the section.
 */
export const species = {
    kicker: "",
    title: "",
    items: [] as Specimen[],
}

export interface Swatch {
    /** The color's name, e.g. "Frenchmen Coral". */
    name: string
    /** The chip number printed under the name, e.g. "014". */
    code: string
    /** The flat color itself, a six-digit hex. */
    color: string
    /** One line under the rule. */
    note: string
    /** Optional texture chip set on the swatch (a lipstick smear, a stain sample). */
    image?: SiteImage
}

/**
 * The color deck — a row of flat paint chips (showcase `swatches`), each
 * linking to the quote page. For trades whose product is the color;
 * empty `items` to drop the section.
 */
export const palette = {
    kicker: "",
    title: "",
    items: [] as Swatch[],
}

export interface PriceMenuItem {
    name: string
    /** Small print under the name — the length, the time in the chair. */
    note?: string
    /** The printed price, e.g. "$220". */
    price: string
    /** The honesty word before the price, e.g. "from". */
    qualifier?: string
}

export interface PriceMenuGroup {
    heading: string
    items: PriceMenuItem[]
}

/**
 * The menu board — every priced line the shop sells, in headed groups
 * (pricing `price-list`). For trades priced off a menu rather than a
 * quote. Empty `groups` to drop the section.
 */
export const priceMenu = {
    kicker: "",
    title: "",
    intro: "",
    groups: [] as PriceMenuGroup[],
    footnote: "",
}

export interface LookbookItem {
    name: string
    /** The detail set after the name — a length, a finish, a client. */
    meta: string
    description: string
    /** Filter chips, where the pinned variant filters (showcase `filterable-grid`). */
    tags: string[]
    /** A tall portrait (3:4). */
    image: SiteImage
}

/**
 * The lookbook — the work as portraits (showcase `specimens` plates, or
 * a filterable grid). Empty `items` to drop the section.
 */
export const lookbook = {
    kicker: "",
    title: "",
    items: [] as LookbookItem[],
}

export interface Policy {
    title: string
    body: string
}

/**
 * The house rules — deposits, lateness, what's included — as one ticked
 * card (feature-grid `checklist`), optionally beside a photograph. Empty
 * `items` to drop the section.
 */
export const policies = {
    kicker: "",
    title: "",
    /** The card's own heading; "" for none. */
    cardTitle: "",
    /** One line under the card heading; "" for none. */
    body: "",
    image: null as SiteImage | null,
    items: [] as Policy[],
}

/** One captioned photograph in the hero's collage row. */
export interface HeroPanel {
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
 * The garden journal — the home page's stories by season (showcase
 * `stories`): the first entry leads, the rest follow beneath. Empty
 * `items` to drop the section.
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
 * The garden walk — one garden frame by frame, wide panoramic strips in
 * the order you'd walk it (gallery `panorama`). Empty `frames` to drop it.
 */
export const walk = {
    kicker: "A garden walk",
    title: "",
    frames: [
        {
            caption: "The gate — cedar and hand-split shakes",
            image: photo(
                "walk-gate",
                1600,
                900,
                "A weathered cedar gate under a small tiled roof, set in a split-rail fence between sword ferns in mist",
            ),
        },
        {
            caption: "The moss path — basalt steppers, set by hand",
            image: photo(
                "walk-moss-path",
                1600,
                900,
                "Wet basalt stepping stones in a moss path between ferns and pink rhododendrons, receding into fog",
            ),
        },
        { caption: "The stone court — two boulders, raked each week", image: stoneFrame },
        { caption: "The maple on the knoll — pruned every winter", image: mapleFrame },
        {
            caption: "The basin — rainwater and a cedar ladle",
            image: photo(
                "walk-basin",
                1600,
                900,
                "A round granite water basin reflecting the sky, a bamboo ladle across its rim, ferns and river stones around it",
            ),
        },
        {
            caption: "Looking back — into the firs",
            image: photo(
                "walk-looking-back",
                1600,
                900,
                "Pale stepping stones leading into a misty forest of tall firs and cedars, ferns and moss along the path",
            ),
        },
    ] as WalkFrame[],
}

export const home = {
    headline: "Stillness, cultivated.",
    subheadline:
        "Moss and stone gardens for Bainbridge Island and the Kitsap shore — designed, built and tended by a small studio.",
    heroImage: photo(
        "hero-moss-maple",
        2400,
        1350,
        "A moss garden in fog: a red Japanese maple, basalt stepping stones, a raked gravel court and a stone lantern under tall firs",
    ),
    /** Show each service's `priceNote` under its title in the home grid. */
    servicePrices: false,
    /** Show the home services grid. */
    serviceGrid: false,
    hero: {
        /**
         * `true`: the storefront hero — live open/closed badge, the
         * subheadline, and quote + call buttons beside the photograph.
         * `false`: the title card — the headline over the full-bleed
         * photograph with the credit line and the photo's caption.
         */
        storefront: false,
        /** Tracked caps — what and where: under the title card's headline, or closing the storefront hero's copy. Empty: none. */
        credit: "Bainbridge Island",
        /** Title-card only: the photograph's own caption. */
        caption: "",
        /** Title-card only: where the headline's accent word lands. */
        accent: "none" as "none" | "last-word",
        /** Title-card only: the small kicker over the headline. Empty: none. */
        kicker: "",
        /** Title-card only: stacked sells under the headline. */
        coverLines: [] as string[],
        /** No collage row. */
        panels: [] as HeroPanel[],
        /** Title-card only: the studio's seal — first line small, the rest large. Empty: none. */
        seal: "Kōen\n庭",
    },
    /** The home before/after teaser: which projects lead (empty: none). */
    featuredProjects: [] as Project[],
    /** The home metrics strip (empty: the strip lives on the about page). */
    proofMetrics: [] as typeof metrics,
    /** The closing banner's photograph (null: a plain banner). */
    bannerImage: null as SiteImage | null,
}

/** A detail photograph with its small-caps title and caption. */
export interface FeatureFigure {
    title: string
    caption: string
    image: SiteImage
}

/** The long-form feature story — unused here, so empty (drops the section). */
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
    headline: "Fifteen years of listening to the ground.",
    photo: photo(
        "about-designer",
        1600,
        1200,
        "Hideo Tanabe laughing as he and a young gardener lever a lichen-covered basalt boulder into place in a misty fir forest",
    ),
    paragraphs: [
        "Hideo Tanabe apprenticed for six years in the temple gardens of Kyoto before moving to the island in 2009, where the rain, the firs and the moss reminded him of the mountains above the city.",
        "He opened Kōen in 2011. The studio builds only a few gardens each year and cares for most of them long after: pruning the maples in winter, raking the gravel, and letting the moss do the rest.",
        "We work with basalt and granite from the Olympic Peninsula, moss grown from local cushions, and plants that belong in a Pacific Northwest winter. Nothing is hurried.",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: ["WA contractor KOENGGS812PB", "ISA Certified Arborist PN-8841A", "Bonded & insured"],
}

export const process = {
    kicker: "How a garden begins",
    title: "From the first walk to the first moss",
    steps: [
        {
            title: "The walk",
            description:
                "Hideo walks the ground with you: the light, the water, the trees worth keeping and the views worth framing.",
        },
        {
            title: "The proposal",
            description:
                "A plan, sketches and a written proposal for the design, the build and the first year of care.",
        },
        {
            title: "Stone and planting",
            description:
                "Stone first, then paths and water, then trees, then moss — mostly in autumn, when the rains return.",
        },
        {
            title: "Tending",
            description:
                "A monthly visit from the same gardener, pruning by hand and keeping the garden quiet.",
        },
    ],
}

export const faq = [
    {
        question: "Do we need a large property?",
        answer: "No. Some of our best gardens are side yards and courtyards. A good garden is about what you see from the window and where you walk, not acreage.",
    },
    {
        question: "Won't moss take over in our climate?",
        answer: "In the Pacific Northwest moss wants to grow — we simply give it the right place. Paths, gravel and clipped edges keep it where it belongs.",
    },
    {
        question: "How long before the garden feels finished?",
        answer: "Stone and paths read as finished on the first day. The moss knits together over one or two wet seasons, and the maples take their shape over years of winter pruning.",
    },
    {
        question: "Do you care for gardens you didn't build?",
        answer: "Sometimes. We begin with a season of care to learn the garden, then suggest what to keep and what to change.",
    },
]

/**
 * The appointments contract's code fallback — the same booking mode 2 the
 * care pack runs (web/app/src/View/Landing/practiceDocument.ts): visit
 * types x weekly availability windows, projected into concrete capacity-1
 * slots by `generateAppointmentSlots`. The catalog's `content.appointments`
 * seed mirrors this export exactly (the content tests pin the twin), so an
 * owner's Manage edit and this file walk the same rendering path.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "garden-walk",
            name: "Garden walk",
            durationMinutes: 90,
            description:
                "Hideo walks the garden with you — the light, the water, the trees — and talks through what it could become.",
        },
        {
            typeId: "proposal-review",
            name: "Proposal review",
            durationMinutes: 60,
            description: "At the studio on Day Road: the plan, the sketches and the proposal, line by line.",
        },
    ],
    providers: [
        {
            providerId: "hideo-tanabe",
            name: "Hideo Tanabe",
            windows: [
                { day: 2, start: 9 * 60, end: 15 * 60 },
                { day: 4, start: 9 * 60, end: 15 * 60 },
                { day: 6, start: 10 * 60, end: 13 * 60 },
            ],
        },
    ],
}

/** The /quote page's booking strip — the slot picker above the form. */
export const booking = {
    headline: "Walk the garden with Hideo",
    intro: "Book a garden walk or a proposal review — pick a time and you'll get a confirmation with a one-click cancel link. Rather write first? The form below reaches the studio directly.",
    /** The new/returning select's trade voice (the widget's statusLabels). */
    statusLabels: { new: "A new garden", returning: "We already tend your garden" },
    /** The line under the booking form (the widget's privacyNote). */
    privacyNote: "Just a name and a way to reach you. The rest we'll talk about in the garden.",
}

export interface QuoteField {
    name: string
    label: string
    type?: "text" | "email" | "tel" | "date" | "textarea" | "select"
    placeholder?: string
    required?: boolean
    fullWidth?: boolean
    /** `select` only: the choices, verbatim. */
    options?: string[]
}

export const quote = {
    headline: "Arrange a garden walk.",
    body: "Tell us about the ground and what you'd like to feel there. Hideo replies within a week to arrange a walk.",
    confirmation: "Thank you — Hideo reads every note himself and will write within a week.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "phone", label: "Phone", type: "tel" },
        {
            name: "address",
            label: "Garden address",
            placeholder: "Street and town",
            fullWidth: true,
            required: true,
        },
        {
            name: "project",
            label: "What are you imagining?",
            type: "select",
            options: ["A new garden", "A courtyard or side path", "Seasonal care", "Not sure yet"],
            required: true,
        },
        {
            name: "message",
            label: "About the garden",
            type: "textarea",
            placeholder: "The light, the trees, the view from the window, what isn't working.",
            fullWidth: true,
        },
    ] as QuoteField[],
}
