/**
 * The landscaping remix seed: a complete, drop-in replacement for
 * `./content.ts` that retargets the services pack from the coastal
 * builder to Wild Ground, a native-plant landscape studio in Austin —
 * same shape, same sections, different trade. The derived template
 * `repobot-services-landscape` is composed from the services pack with
 * this file copied over `content.ts`, its catalog's fluorescent-orange
 * brand, and the `riso` register (two-ink risograph print: deep-sage and
 * fluorescent-orange inks on warm uncoated paper).
 *
 * Because the copy is verbatim, this file must stay a structural twin of
 * `content.ts`: same exports, same relative imports, images under its own
 * `/services-landscape/` public directory. The parity tests
 * (`tests/View/Services/remixSeeds.test.ts`, `landscapeRemixSeed.test.ts`)
 * pin the export surface against the real module, so the seed fails CI
 * the moment the pack's contract moves without it.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/services-landscape` (see PACK.md). The `photo` helper
 * mirrors that verb's naming exactly. Never point a slot at a raw camera
 * file. Shoot in color: the register prints every photograph in its two
 * inks at render time, and the before/after proof stays in full color.
 *
 * Before/after pairs are the pack's proof: shoot both frames from the same
 * spot on the sidewalk, or the comparison reads as two different yards.
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
        src: `/services-landscape-native/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({
            src: `/services-landscape-native/${name}-${step}w.webp`,
            width: step,
        })),
    }
}

export const business = {
    name: "Wild Ground",
    tagline: "Native plant landscapes",
    location: "Austin, Texas",
    /** Shown everywhere the number appears; `phoneHref` is the tap target. */
    phone: "(512) 555-0147",
    phoneHref: "tel:+15125550147",
    email: "hello@wildground.example",
    address: "1911 E 7th St, Studio 3, Austin, TX 78702",
    /** The license line — rendered wherever trust is being earned. */
    license: "Insured · TCEQ Licensed Irrigator LI 24817",
}

/**
 * Weekly hours drive the quote page's hours line (and the live badge, if
 * the storefront hero is ever switched on). Minutes since midnight; a day
 * may have several intervals. Saturdays are for yard walks in season.
 */
export const weeklyHours: DayHours[] = [
    { day: 1, intervals: [[450, 990]] }, // Mon 7:30 AM – 4:30 PM
    { day: 2, intervals: [[450, 990]] },
    { day: 3, intervals: [[450, 990]] },
    { day: 4, intervals: [[450, 990]] },
    { day: 5, intervals: [[450, 990]] }, // Fri
    { day: 6, intervals: [[480, 720]] }, // Sat 8 AM – noon
]

export const hoursNote =
    "Studio open Monday–Friday 7:30 AM–4:30 PM, Saturday 8 AM–noon · Yard walks by appointment"

/** The neighborhoods the crew actually plants in — the home page's quiet strip. */
export const serviceArea = [
    "Travis Heights",
    "Zilker",
    "Hyde Park",
    "Mueller",
    "East Austin",
    "Bouldin Creek",
    "Dripping Springs",
]

/**
 * Every string the pages render that isn't a fact about the business:
 * section kickers and titles, the asks, the closing banners — mirrors the
 * base module's `landingCopy` so the landing modules retrade with it.
 */
export const landingCopy = {
    /** The home page's services-section heading. */
    servicesHeading: "Four ways out of the lawn.",
    /** The shared nav: page link labels, the CTA, and the logo's line. */
    nav: {
        projects: "Gardens",
        services: "Services",
        about: "Studio",
        cta: "Let's grow →",
        /** Small line under the wordmark; "" for none. */
        tagline: "Austin native plant landscapes",
    },
    /** The quote ask on heroes, banners, and the about story. */
    quoteCta: "Start a garden",
    home: {
        nowBuildingLabel: "In the ground now",
        servicesKicker: "What we plant",
        transformationsKicker: "Lawn → meadow",
        transformationsTitle: "Same yard. Drag the line.",
        testimonialsKicker: "From the neighbors",
        serviceAreaLabel: "Growing wild in",
        bannerTitle: "Your lawn has had a good run.",
        bannerBody:
            "Walk the yard with Rosa — an hour, free, anywhere inside Austin and out to Dripping Springs. You leave with a plant list, a water estimate, and a price.",
    },
    projects: {
        headline: "Lawns we let go.",
        subheadline:
            "Every pair below is the same yard from the same spot on the sidewalk — the before on the day we measured, the after a year in. Drag the divider.",
        kicker: "Before & after",
        bannerTitle: "Tired of watering grass nobody walks on?",
    },
    servicesPage: {
        headline: "Honest prices for wild yards.",
        subheadline:
            "Starting figures below include soil prep, plants, mulch, and a year of care visits. After the yard walk you get a fixed written quote — the quote is the price.",
        kicker: "What we plant",
        faqKicker: "Before the yard walk",
        faqTitle: "What Austin asks us",
        bannerTitle: "Not sure what your yard wants to be?",
        bannerBody: `Call ${business.phone} or send three photos — we'll tell you straight whether it's a meadow, a courtyard, or just fewer sprinklers.`,
    },
    about: {
        kicker: "The studio",
        bullets: [
            business.license,
            "Plants grown from Central Texas seed",
            "Fixed quotes with a year of care included",
        ],
        credentialsLabel: "Credentials",
        reviewsKicker: "Neighbors, in their words",
        reviewsTitle: "Yards that stopped needing a hose",
        bannerTitle: "Let's walk your yard.",
    },
    quotePage: {
        kicker: "Start a garden",
        title: "The yard, the sun, the plan",
        cta: "Send it to the studio",
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
    /** The neighborhood — the eyebrow on the comparison caption. */
    location: string
    /** One line of scope and duration, e.g. "Lawn to meadow — 3 weeks". */
    scope: string
    description: string
    before: SiteImage
    after: SiteImage
}

export const projects: Project[] = [
    {
        slug: "newning-bungalow",
        title: "Newning Avenue bungalow",
        location: "Travis Heights",
        scope: "Lawn to meadow — 3 weeks to plant, one spring to fill",
        description:
            "A thirsty St. Augustine front lawn stripped, the caliche opened up, and 1,400 plugs of feather grass, coneflower, and mistflower set around a limestone path to the porch.",
        before: photo(
            "project-bungalow-before",
            1600,
            1200,
            "The Newning Avenue bungalow before: a patchy, sunburnt St. Augustine lawn and two clipped boxwoods by the porch",
        ),
        after: photo(
            "project-bungalow-after",
            1600,
            1200,
            "The same bungalow after: a native meadow of feather grass, coneflowers, and black-eyed Susans around a limestone path",
        ),
    },
    {
        slug: "philomena-rain-garden",
        title: "Philomena Street yard",
        location: "Mueller",
        scope: "Rain garden & prairie — 4 weeks",
        description:
            "A Bermuda lawn that flooded at the downspout every storm, regraded into a cobble dry creek through little bluestem, gulf muhly, and Turk's cap.",
        before: photo(
            "project-raingarden-before",
            1600,
            1200,
            "The Philomena Street yard before: a brown Bermuda grass lawn with a muddy puddle at the downspout and a coiled hose",
        ),
        after: photo(
            "project-raingarden-after",
            1600,
            1200,
            "The same yard after: a cobble dry creek bed winding through native grasses and pink-plumed gulf muhly",
        ),
    },
]

export const services: Service[] = [
    {
        slug: "lawn-to-meadow",
        title: "Lawn to meadow",
        eyebrow: "Front & back yards",
        description:
            "We strip the turf, rebuild the soil, and seed and plug a native meadow of grasses and wildflowers — the Hill Country, in your front yard.",
        priceNote: "From $9 / sq ft",
        image: photo(
            "service-meadow-install",
            1280,
            960,
            "Two Wild Ground gardeners kneeling in loosened soil, setting native grass plugs from nursery trays",
        ),
    },
    {
        slug: "water-wise-courtyards",
        title: "Water-wise courtyards",
        eyebrow: "Stone & structure",
        description:
            "Decomposed granite, dry-stacked limestone, and sculptural agave, sotol, and yucca — a garden built for August that never asks for the hose.",
        priceNote: "From $14,000",
        image: photo(
            "service-xeric-courtyard",
            1280,
            960,
            "A courtyard of pale granite gravel, a dry-stacked limestone wall, agaves, feather grass, and a blooming desert willow",
        ),
    },
    {
        slug: "rain-gardens",
        title: "Rain gardens & dry creeks",
        eyebrow: "Drainage",
        description:
            "Downspouts and low spots turned into cobble creeks and sedge basins that drink the storm instead of flooding the patio.",
        priceNote: "From $6,500",
        image: projects[1].after,
    },
    {
        slug: "meadow-care",
        title: "Meadow care",
        eyebrow: "Four visits a year",
        description:
            "The winter cut-back, the spring edit, the summer check, and fall seeding — by the same crew that planted it.",
        priceNote: "$165 / visit",
        image: photo(
            "service-meadow-care",
            1280,
            960,
            "A gardener with a long braid cutting back tall bronze winter grasses with hand shears",
        ),
    },
]

/** The trust numbers — the metrics strip. Keep values short and big. */
export const metrics = [
    { value: "412", label: "Austin lawns turned into habitat" },
    { value: "61%", label: "average drop in summer water use" },
    { value: "240+", label: "native species on our plant lists" },
    { value: "0", label: "synthetic fertilizers or pesticides" },
]

export const testimonials = [
    {
        quote: "Our August water bill went from $212 to $64, and ours is the only yard on the block with monarchs in it. The HOA sent a letter. Then the HOA president asked for Rosa's number.",
        name: "Dana & Priya Okafor",
        detail: "Lawn to meadow, Mueller",
    },
    {
        quote: "I was sure it would look like a vacant lot for a year. Six weeks after planting there were bluebonnet rosettes everywhere, and by April people were stopping their cars.",
        name: "Hal Whitaker",
        detail: "Front-yard meadow, Travis Heights",
    },
    {
        quote: "They dug a creek where our yard used to flood. Last May it rained four inches in an afternoon and the patio stayed dry.",
        name: "Marisol Treviño",
        detail: "Rain garden, East Austin",
    },
]

/**
 * What's in the ground right now — the home page's rolling ticker, one
 * line per job: the yard, then the phase and where it stands. Empty to
 * drop the section.
 */
export const nowBuilding = [
    "Travis Heights front yard — meadow seeding, week 2 of 3",
    "Zilker courtyard — dry-stack limestone wall, week 4 of 6",
    "Mueller back yard — creek bed set, planting Friday",
    "Dripping Springs pasture — two acres of native seed, drilling in October",
]

export interface BuildLogStep {
    /** The short mark on the rail — a month, a phase. */
    label: string
    title: string
    description: string
    image: SiteImage
}

/**
 * One yard through one year — the home page's horizontal log. Four to six
 * steps read best across the frame. Empty `steps` to drop it.
 */
export const buildLog = {
    kicker: "One yard, twelve months",
    title: "A year in a meadow.",
    steps: [
        {
            label: "January",
            title: "Plant",
            description: "Turf out, soil opened, 1,800 plugs set and native seed raked in under straw.",
            image: photo(
                "year-01-january",
                1280,
                960,
                "A freshly planted yard in January: rows of small grass plugs in bare mulched soil before a limestone house",
            ),
        },
        {
            label: "March",
            title: "Bluebonnets",
            description: "The first spring: bluebonnets and paintbrush, right on schedule.",
            image: photo(
                "year-02-march",
                1280,
                960,
                "The same meadow in March, a carpet of bluebonnets and red Indian paintbrush",
            ),
        },
        {
            label: "May",
            title: "Firewheel",
            description:
                "Firewheel, coneflower, and horsemint take the handoff; the grasses reach your knees.",
            image: photo(
                "year-03-may",
                1280,
                960,
                "The meadow in May, full of orange firewheel, yellow coneflowers, and purple horsemint",
            ),
        },
        {
            label: "August",
            title: "Holds",
            description: "A hundred and three degrees, no sprinklers — the grasses go silver and keep going.",
            image: photo(
                "year-04-august",
                1280,
                960,
                "The meadow in August heat, silver grasses, lavender sage, and white blackfoot daisies",
            ),
        },
        {
            label: "November",
            title: "Copper",
            description: "Little bluestem turns copper and the asters feed the last monarchs south.",
            image: photo(
                "year-05-november",
                1280,
                960,
                "The meadow in November, copper grasses and drifts of purple fall asters under orange oaks",
            ),
        },
    ] as BuildLogStep[],
}

export interface Specimen {
    name: string
    /** What it's for — set after a slash under the name. */
    use: string
    /** One line; the plate does the talking. Here: the botanical name. */
    description: string
    /** A tall portrait (3:4) of the plant itself. */
    image: SiteImage
}

/**
 * The plant index — what the gardens are made of. Tall 3:4 plates of the
 * plant itself, each with its season or job and its botanical name. Empty
 * `items` to drop the section.
 */
export const species = {
    kicker: "Native plants. Local habitat. Real places.",
    title: "Plant index",
    items: [
        {
            name: "Bluebonnet",
            use: "spring",
            description: "Lupinus texensis",
            image: photo(
                "specimen-bluebonnet",
                1152,
                1536,
                "A clump of Texas bluebonnets in bloom in pale caliche soil",
            ),
        },
        {
            name: "Little bluestem",
            use: "all year",
            description: "Schizachyrium scoparium",
            image: photo(
                "specimen-little-bluestem",
                1152,
                1536,
                "A clump of little bluestem grass, copper stems and silver seed tufts against a limestone wall",
            ),
        },
        {
            name: "Mexican feather grass",
            use: "texture",
            description: "Nassella tenuissima",
            image: photo(
                "specimen-feather-grass",
                1152,
                1536,
                "A fountain of fine Mexican feather grass with blond seed plumes, backlit",
            ),
        },
        {
            name: "Agave",
            use: "structure",
            description: "Agave spp.",
            image: photo(
                "specimen-agave",
                1152,
                1536,
                "A symmetrical blue-gray agave rosette in pale granite gravel",
            ),
        },
    ] as Specimen[],
}

export interface Swatch {
    /** The color's name, e.g. "Frenchmen Coral". */
    name: string
    /** The chip number printed under the name, e.g. "014". */
    code: string
    /** The flat color itself, a hex. */
    color: string
    /** One line under the rule. */
    note: string
    /** Optional texture chip set on the swatch. */
    image?: SiteImage
}

/**
 * The color deck — a row of flat paint chips. Empty `items` to drop the
 * section (this garden sells plants, not paint).
 */
export const palette = {
    kicker: "",
    title: "",
    items: [] as Swatch[],
}

export interface PriceMenuItem {
    name: string
    note?: string
    price: string
    qualifier?: string
}

export interface PriceMenuGroup {
    heading: string
    items: PriceMenuItem[]
}

/** The menu board (pricing `price-list`) — the landscaper quotes by the job, so empty. */
export const priceMenu = {
    kicker: "",
    title: "",
    intro: "",
    groups: [] as PriceMenuGroup[],
    footnote: "",
}

export interface LookbookItem {
    name: string
    meta: string
    description: string
    tags: string[]
    image: SiteImage
}

/** The lookbook (showcase portraits) — not this trade's proof, so empty. */
export const lookbook = {
    kicker: "",
    title: "",
    items: [] as LookbookItem[],
}

export interface Policy {
    title: string
    body: string
}

/** The house-rules card (feature-grid `checklist`) — empty, so never built. */
export const policies = {
    kicker: "",
    title: "",
    cardTitle: "",
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
    headline: "Let it grow wild.",
    subheadline:
        "Native meadows, water-wise courtyards, and rain gardens for Austin yards — planted from Central Texas seed and built to take August without a sprinkler.",
    heroImage: photo(
        "hero-meadow-house",
        2400,
        1350,
        "A front-yard native meadow of bluebonnets, firewheel, silver grasses, and an agave before a limestone ranch house under live oaks",
    ),
    /** Show each service's `priceNote` under its title in the home grid. */
    servicePrices: true,
    /** Show the home services grid. */
    serviceGrid: true,
    hero: {
        /**
         * `true`: the storefront hero — live open/closed badge, the
         * subheadline, and quote + call buttons beside the photograph.
         * `false`: the title card — the headline over the full-bleed
         * photograph with the credit line and the photo's caption.
         */
        storefront: false,
        /** Tracked caps — what and where: under the title card's headline, or closing the storefront hero's copy. Empty: none. */
        credit: "Native plant landscapes · Austin, Texas",
        /** Title-card only: the photograph's own caption (the riso register strikes it as a stamp). */
        caption: "No lawns since 2014",
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
    featuredProjects: [projects[0]] as Project[],
    /** The home metrics strip (empty: the strip lives on the about page). */
    proofMetrics: [] as typeof metrics,
    /** The closing banner's photograph (null: a plain banner). */
    bannerImage: photo(
        "cta-meadow-dusk",
        2400,
        1350,
        "A limestone path winding into a native meadow at sunset, backlit grasses glowing",
    ) as SiteImage | null,
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
    headline: "Rosa stopped mowing in 2014.",
    photo: photo(
        "about-founder",
        1600,
        1200,
        "Rosa Villarreal standing waist-deep in a blooming meadow, holding a tray of native seedlings",
    ),
    paragraphs: [
        "Rosa Villarreal spent twelve years installing sod for other people. In the drought summer of 2011 she watched every one of those lawns go brown on schedule — and the vacant lot behind her East Austin house bloom all June without a drop of water.",
        "In 2014 she tore out her own front yard, seeded it with what grew on that lot, and started Wild Ground from the porch. The crew is nine now: gardeners, a stonemason, and a soil nerd, planting from Central Texas seed we collect and grow on with two local nurseries.",
        "We don't do lawns, sprays, or synthetic fertilizer. Every garden starts with a free yard walk, gets a fixed written quote, and comes with a year of care visits — because the first year is when a meadow learns your yard.",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "TCEQ Licensed Irrigator LI 24817",
        "Native Plant Society of Texas",
        "Texas Nursery & Landscape Association",
        "Fully insured",
    ],
}

export const process = {
    kicker: "How a yard goes wild",
    title: "From the yard walk to the first bloom",
    steps: [
        {
            title: "Yard walk",
            description:
                "An hour with Rosa, free: sun, shade, soil, drainage, deer traffic, and what you'd like to see from the kitchen window.",
        },
        {
            title: "Plant list & quote",
            description:
                "A plant list for your exact yard, a water estimate against your current bill, and a fixed written price — including HOA drawings if you need them.",
        },
        {
            title: "Soil & planting",
            description:
                "Turf out without herbicide, the soil loosened and fed with compost, plugs and seed in the ground — fall is best, spring works.",
        },
        {
            title: "A year of care",
            description:
                "Four visits in the first year to edit, weed, and cut back, so the meadow fills in the way it was drawn.",
        },
    ],
}

export const faq = [
    {
        question: "Will my HOA let me do this?",
        answer: "Almost always, yes. Texas Property Code §202.007 limits an HOA's power to ban drought-tolerant landscaping, and most Austin HOAs have approved every plan we've drawn. We prepare the drawings, the plant list, and the edging detail that makes a meadow read as intentional, and we'll come to the architectural committee meeting if it helps.",
    },
    {
        question: "What happens to our water bill?",
        answer: "Our gardens average 61% less summer water than the lawns they replace, and most need none at all after the first summer. Austin Water's landscape rebates can cover part of a turf conversion — we handle the paperwork and the before photos.",
    },
    {
        question: "How long until it fills in?",
        answer: "Planted in fall, a meadow shows green by Christmas, blooms its first spring, and looks full by the second. Courtyards and stone read finished on day one. We plant densely so there's never a year of bare dirt, and the first year of care visits is in the price.",
    },
    {
        question: "What about the deer?",
        answer: "In Dripping Springs, Zilker, and west of MoPac, we plant for deer from the start: agave, sotol, feather grass, little bluestem, salvias, and mistflower they leave alone. We'll tell you plainly which plants on your list they'll taste, and fence the few that matter.",
    },
    {
        question: "Won't it look messy?",
        answer: "Not if it's designed. Clean mown edges, a path, one or two sculptural plants, and the tall grasses kept to the middle — that's the difference between a meadow and an overgrown lawn. Neighbors notice the monarchs before they notice the grass.",
    },
]

/**
 * The appointments contract's code fallback — the same booking mode 2 the
 * care pack runs (web/app/src/View/Landing/practiceDocument.ts): visit
 * types x weekly availability windows, projected into concrete capacity-1
 * slots by `generateAppointmentSlots`. The catalog's `content.appointments`
 * seed mirrors this export exactly (the content tests pin the twin), so an
 * owner's Manage edit and this file walk the same rendering path.
 *
 * Two kinds of visit: the free yard walk and a plant-list review. One
 * provider — Rosa walks every yard herself — with weekday windows inside
 * the posted studio hours.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "yard-walk",
            name: "Yard walk",
            durationMinutes: 60,
            description:
                "An hour in your yard, free — sun, soil, drainage, deer traffic, and what you'd like to see from the kitchen window.",
        },
        {
            typeId: "plant-list-review",
            name: "Plant list review",
            durationMinutes: 45,
            description:
                "At the studio or on a video call: the plant list, the water estimate, and the quote, line by line.",
        },
    ],
    providers: [
        {
            providerId: "rosa-villarreal",
            name: "Rosa Villarreal",
            windows: [
                { day: 1, start: 8 * 60, end: 15 * 60 + 30 },
                { day: 2, start: 8 * 60, end: 15 * 60 + 30 },
                { day: 3, start: 8 * 60, end: 15 * 60 + 30 },
                { day: 4, start: 8 * 60, end: 15 * 60 + 30 },
                { day: 5, start: 8 * 60, end: 15 * 60 + 30 },
            ],
        },
    ],
}

/** The /quote page's booking strip — the slot picker above the form. */
export const booking = {
    headline: "Walk the yard with Rosa",
    intro: "Book a free yard walk or a plant-list review — pick a time and you'll get a confirmation with a one-click cancel link. Rather write first? The form below reaches the studio directly.",
    /** The new/returning select's trade voice (the widget's statusLabels). */
    statusLabels: { new: "First garden with us", returning: "We've planted for you before" },
    /** The line under the booking form (the widget's privacyNote). */
    privacyNote:
        "Just a name and a way to reach you. The soil, the shade, and the dog we'll ask about standing in the yard.",
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
    headline: "Tell us about your yard.",
    body: "The address, the sun, what you're tired of. Rosa replies within two business days — and every garden starts with a free yard walk.",
    confirmation: "Got it — thank you. Rosa reads every note herself and replies within two business days.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "phone", label: "Phone", type: "tel" },
        {
            name: "address",
            label: "Yard address",
            placeholder: "Street and neighborhood",
            fullWidth: true,
            required: true,
        },
        {
            name: "yard",
            label: "Which yard?",
            type: "select",
            options: ["Front yard", "Back yard", "Front and back", "Acreage / a whole lot"],
            required: true,
        },
        {
            name: "project",
            label: "What are you picturing?",
            type: "select",
            options: [
                "Lawn to meadow",
                "Water-wise courtyard",
                "Rain garden / drainage",
                "Meadow care",
                "Not sure yet",
            ],
            required: true,
        },
        {
            name: "hoa",
            label: "HOA?",
            type: "select",
            options: ["Yes — we'll need approval", "No HOA", "Not sure"],
        },
        {
            name: "timeline",
            label: "When",
            type: "select",
            placeholder: "When would you like to plant?",
            options: ["This fall (best for planting)", "This spring", "Later this year", "Just exploring"],
        },
        {
            name: "message",
            label: "About the yard",
            type: "textarea",
            placeholder:
                "Full sun or oak shade, the spot that floods, the deer, the dog — whatever you'd tell a neighbor.",
            fullWidth: true,
        },
    ] as QuoteField[],
}
