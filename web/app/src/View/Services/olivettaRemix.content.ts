/**
 * Remix seed — Olivetta Garden Studio, the Mediterranean estate-garden
 * derived template of the services pack (packs/services-landscape-olivetta).
 * A complete, drop-in replacement for `./content.ts`: the composer copies
 * it over the pack's content module byte-for-byte, so it must stay a
 * structural twin — same exports, same relative imports, images under its
 * own `/services-landscape-olivetta/` public directory. The parity tests
 * pin the export surface against the real module.
 *
 * The home is a garden journal by season (`journal`, showcase `stories`)
 * under a full-bleed title card; the before/after proof lives on the
 * gardens page.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/services-landscape-olivetta`. The `photo` helper mirrors
 * that verb's naming exactly. Before/after pairs are shot from the same
 * spot, or the comparison reads as two different gardens.
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
        src: `/services-landscape-olivetta/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({
            src: `/services-landscape-olivetta/${name}-${step}w.webp`,
            width: step,
        })),
    }
}

const spring = photo(
    "story-spring",
    1600,
    1200,
    "A decomposed-granite path through drifts of blooming lavender past a stone bench and an old olive tree",
)
const summer = photo(
    "story-summer",
    1600,
    1200,
    "A long rustic table set for lunch under a vine-covered pergola, with terracotta pitchers, figs and tomatoes",
)
const autumn = photo(
    "story-autumn",
    1600,
    1200,
    "Two gardeners laughing as they comb olives from an old tree into nets, olives falling beside a woven basket",
)
const winter = photo(
    "story-winter",
    1600,
    1200,
    "Gloved hands pruning a bare espaliered pear against a warm plaster wall, cuttings gathered in a trug",
)

export const business = {
    name: "Olivetta",
    tagline: "Garden Studio",
    location: "Montecito, California",
    /** Shown everywhere the number appears; `phoneHref` is the tap target. */
    phone: "(805) 555-0163",
    phoneHref: "tel:+18055550163",
    email: "studio@olivetta.example",
    address: "1262 Coast Village Road, Montecito, CA 93108",
    /** The license line — rendered wherever trust is being earned. */
    license: "CA landscape contractor C-27 #1049216 · Fully insured", // theme-exempt: license number, not a color
}

/**
 * Weekly hours drive the quote page's hours line (and the live badge, if
 * the storefront hero is ever switched on). Minutes since midnight; a day
 * may have several intervals.
 */
export const weeklyHours: DayHours[] = [
    { day: 1, intervals: [[480, 1020]] }, // Mon 8 AM – 5 PM
    { day: 2, intervals: [[480, 1020]] },
    { day: 3, intervals: [[480, 1020]] },
    { day: 4, intervals: [[480, 1020]] },
    { day: 5, intervals: [[480, 960]] }, // Fri 8 AM – 4 PM
]

export const hoursNote = "Studio open Monday–Friday · Garden visits by appointment"

/** Where the studio plants and tends — the home page's quiet strip. */
export const serviceArea = ["Montecito", "Santa Barbara", "Hope Ranch", "Summerland", "Carpinteria", "Ojai"]

/**
 * Every string the pages render that isn't a fact about the business:
 * section kickers and titles, the asks, the closing banners — mirrors the
 * base module's `landingCopy` so the landing modules retrade with it.
 */
export const landingCopy = {
    /** The home page's services-section heading. */
    servicesHeading: "Design, planting and care",
    /** The shared nav: page link labels, the CTA, and the logo's line. */
    nav: {
        projects: "Gardens",
        services: "Studio",
        about: "Journal",
        cta: "Begin a garden",
        /** Small line under the wordmark; "" for none. */
        tagline: "Garden Studio",
    },
    /** The quote ask on heroes, banners, and the about story. */
    quoteCta: "Begin a garden",
    home: {
        nowBuildingLabel: "",
        servicesKicker: "The studio",
        transformationsKicker: "Before & after",
        transformationsTitle: "The same garden, a year apart",
        testimonialsKicker: "From our gardens",
        serviceAreaLabel: "Gardens in",
        bannerTitle: "We design and care for Mediterranean estate gardens rooted in place, beauty, and time.",
        bannerBody: "Montecito · Santa Barbara · since 2018",
    },
    projects: {
        headline: "Gardens, a year on.",
        subheadline:
            "Each pair is the same garden from the same spot — the day we first walked it, and a year after planting. Drag the divider.",
        kicker: "Before & after",
        bannerTitle: "Every garden starts with a walk.",
    },
    servicesPage: {
        headline: "Designed once. Tended for years.",
        subheadline:
            "Most of our gardens are ones we planted and still care for. Every project begins with a garden walk and a written proposal.",
        kicker: "The studio",
        faqKicker: "Before the walk",
        faqTitle: "What clients ask us",
        bannerTitle: "A garden that ripens with time.",
        bannerBody: `Call ${business.phone} or write to the studio — Livia walks every new garden herself.`,
    },
    about: {
        kicker: "The studio",
        bullets: [
            business.license,
            "Plants from California and Mediterranean growers",
            "The same gardeners, season after season",
        ],
        credentialsLabel: "Credentials",
        reviewsKicker: "From our gardens",
        reviewsTitle: "Gardens we still tend",
        bannerTitle: "Let's walk your garden.",
    },
    quotePage: {
        kicker: "Begin a garden",
        title: "The garden, the house, the wish",
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
        slug: "hot-springs-courtyard",
        title: "Hot Springs Road courtyard",
        location: "Montecito",
        scope: "Courtyard and fountain restored — 10 weeks",
        description:
            "A tired lawn and a dry fountain turned into a gravel court of lavender, rosemary and white salvia, the fountain running again between potted olives.",
        before: photo(
            "courtyard-before",
            1600,
            1200,
            "The Hot Springs Road courtyard before: dead lawn, a cracked path, a leggy hedge and a dry octagonal fountain",
        ),
        after: photo(
            "courtyard-after",
            1600,
            1200,
            "The same courtyard after: a clipped hedge, the fountain running, gravel beds of lavender and potted olive trees",
        ),
    },
    {
        slug: "riven-rock-terraces",
        title: "Riven Rock terraces",
        location: "Montecito",
        scope: "Hillside terraced and planted — one season",
        description:
            "A bare, eroding slope below the garden wall terraced in dry-stacked sandstone and planted with olives, lavender, rockrose and trailing rosemary.",
        before: photo(
            "slope-before",
            1600,
            1200,
            "The Riven Rock hillside before: dry cracked soil, scattered weeds and a crumbling timber edge below a plaster wall",
        ),
        after: photo(
            "slope-after",
            1600,
            1200,
            "The same hillside after: sandstone terraces of lavender, olive trees and roses climbing on a gravel switchback path",
        ),
    },
]

export const services: Service[] = [
    {
        slug: "garden-design",
        title: "Garden design",
        eyebrow: "The plan",
        description:
            "A garden walk, a planting plan and drawings for the whole property — courtyards, terraces, orchards and the long view from the loggia.",
        priceNote: "Design from $12,000",
        image: projects[0].after,
    },
    {
        slug: "planting",
        title: "Planting & stonework",
        eyebrow: "The build",
        description:
            "Olives moved and planted, dry-stacked walls, gravel courts and fountains, built by the crew that will tend them.",
        priceNote: "By proposal",
        image: projects[1].after,
    },
    {
        slug: "seasonal-care",
        title: "Seasonal care",
        eyebrow: "Every season",
        description:
            "Pruning, the lavender cut-back, olive harvest and the winter edit — a weekly visit from the same gardeners.",
        priceNote: "From $1,800 / month",
        image: winter,
    },
]

/** The trust numbers — the metrics strip. Keep values short and big. */
export const metrics = [
    { value: "2018", label: "planting in Montecito since" },
    { value: "86", label: "gardens in our weekly care" },
    { value: "1,200+", label: "olive trees moved and planted" },
]

export const testimonials = [
    {
        quote: "Livia saw the garden the house had been waiting for. Four years on, the olives are heavy every autumn and the lavender walk is where we have coffee every morning.",
        name: "Caroline & Martín Aldana",
        detail: "Hot Springs Road, Montecito",
    },
    {
        quote: "They pruned our old olives the way my grandfather did in Liguria — slowly, and only what the tree asked for.",
        name: "Giulia Ferrante",
        detail: "Seasonal care, Hope Ranch",
    },
    {
        quote: "The slope used to wash onto the drive every winter. Now it's the view.",
        name: "Robert Haldane",
        detail: "Riven Rock terraces, Montecito",
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
    kicker: "Stories",
    title: "A Garden Journal",
    linkLabel: "Read the story →",
    items: [
        {
            season: "Spring",
            title: "The lavender walk at Hot Springs Road",
            description:
                "Four hundred Provence lavenders along the gravel path, cut back in March so they flower low and even by May.",
            image: spring,
        },
        {
            season: "Summer",
            title: "Lunch under the pergola",
            description:
                "The Concord vine we trained six summers ago now shades the whole table from noon to four.",
            image: summer,
        },
        {
            season: "Autumn",
            title: "The olive harvest",
            description:
                "Nets under the old Mission olives in November, and forty liters of oil pressed in Santa Ynez.",
            image: autumn,
        },
        {
            season: "Winter",
            title: "Pruning the espalier",
            description:
                "Bare wood against warm plaster: January is when the pears on the south wall are shaped for another decade.",
            image: winter,
        },
    ] as JournalEntry[],
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
    kicker: "",
    title: "",
    frames: [] as WalkFrame[],
}

export const home = {
    headline: "Gardens that ripen with time.",
    subheadline:
        "Mediterranean estate gardens for Montecito and Santa Barbara — designed, planted and tended season after season by the same small studio.",
    heroImage: photo(
        "hero-villa-garden",
        2400,
        1350,
        "A Montecito villa garden at golden hour: an olive tree over a gravel path, lavender and roses, cypress and a stone fountain before a plaster house",
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
        credit: "Montecito · Santa Barbara",
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
        seal: "",
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
    headline: "A small studio, a long view.",
    photo: photo(
        "about-designer",
        1600,
        1200,
        "Livia Marchetti laughing as she firms the soil around a young lavender plant, a gardener beside her with a terracotta pot",
    ),
    paragraphs: [
        "Livia Marchetti grew up between her grandmother's terraces above Sanremo and the dry hills of the Central Coast. She trained in landscape architecture at Cal Poly and spent her first years restoring the gardens of old Montecito estates for other studios.",
        "She opened Olivetta in 2018 with one idea: that a Mediterranean garden is never finished on the day it is planted. The studio is twelve people now — designers, a stonemason, and gardeners who tend the same properties every week, year after year.",
        "We plant olives, lavender, rosemary, citrus and roses that belong in this climate, water them sparingly, and prune them by hand. The best of our gardens are the ones we have cared for longest.",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "CA C-27 #1049216", // theme-exempt: license number, not a color
        "Qualified Water Efficient Landscaper",
        "California Native Plant Society",
        "Fully insured",
    ],
}

export const process = {
    kicker: "How a garden begins",
    title: "From the first walk to the first harvest",
    steps: [
        {
            title: "The garden walk",
            description:
                "Livia walks the property with you: the light, the soil, the views worth keeping and the ones worth framing.",
        },
        {
            title: "The proposal",
            description:
                "A planting plan, drawings and a written proposal for the design, the build and the first year of care.",
        },
        {
            title: "Planting",
            description:
                "Stone, gravel and water first, then the trees, then everything else — in autumn, when the rains help.",
        },
        {
            title: "Tending",
            description:
                "The same gardeners every week, pruning by hand and adjusting the garden as it grows into itself.",
        },
    ],
}

export const faq = [
    {
        question: "Do you only work on estates?",
        answer: "Most of our gardens are an acre or more, but we also design courtyards and terraces for smaller houses in Montecito and Santa Barbara. The garden walk is the same either way.",
    },
    {
        question: "Can you care for a garden you didn't design?",
        answer: "Often, yes. We start with a season of care to learn the garden, then suggest what to keep, what to edit and what to replant.",
    },
    {
        question: "How much water do these gardens need?",
        answer: "Far less than a lawn. Olives, lavender, rosemary and rockrose are made for dry summers; once established, most of our gardens are watered by drip every week or two in summer.",
    },
    {
        question: "Can you move a mature olive tree?",
        answer: "Yes. We source and move mature olives up to about eighty years old, boxing them months ahead and planting in autumn so they settle in with the rains.",
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
                "Livia walks the property with you — the light, the soil, the views — and talks through what the garden could become.",
        },
        {
            typeId: "proposal-review",
            name: "Proposal review",
            durationMinutes: 60,
            description:
                "At the studio on Coast Village Road: the plan, the drawings and the proposal, line by line.",
        },
    ],
    providers: [
        {
            providerId: "livia-marchetti",
            name: "Livia Marchetti",
            windows: [
                { day: 2, start: 9 * 60, end: 16 * 60 },
                { day: 3, start: 9 * 60, end: 16 * 60 },
                { day: 4, start: 9 * 60, end: 16 * 60 },
            ],
        },
    ],
}

/** The /quote page's booking strip — the slot picker above the form. */
export const booking = {
    headline: "Walk the garden with Livia",
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
    headline: "Begin a garden.",
    body: "Tell us about the property and what you imagine. Livia replies within two business days to arrange a garden walk.",
    confirmation: "Thank you — Livia reads every note herself and will be in touch within two business days.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "phone", label: "Phone", type: "tel" },
        {
            name: "address",
            label: "Property",
            placeholder: "Street and town",
            fullWidth: true,
            required: true,
        },
        {
            name: "project",
            label: "What are you imagining?",
            type: "select",
            options: [
                "A new garden",
                "Restoring an old garden",
                "Seasonal care",
                "Olive and orchard care",
                "Not sure yet",
            ],
            required: true,
        },
        {
            name: "size",
            label: "Garden size",
            type: "select",
            options: ["A courtyard or terrace", "Up to an acre", "One to five acres", "More than five acres"],
        },
        {
            name: "message",
            label: "About the garden",
            type: "textarea",
            placeholder: "The house, the views, the trees you love, what isn't working.",
            fullWidth: true,
        },
    ] as QuoteField[],
}
