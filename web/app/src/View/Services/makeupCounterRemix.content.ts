/**
 * The services-makeup remix's content seed (packs/README.md "Derived
 * templates"): an editorial and bridal makeup artist worn over the
 * services pack. At compose time this file is copied byte-for-byte over
 * `View/Services/content.ts`, so it must remain a STRUCTURAL TWIN of that
 * module — the same export surface, the same shapes, the contract's
 * minimums met (tests/View/Services/makeupRemixSeed.test.ts pins the
 * twin).
 *
 * The trade: Marisol Vega Makeup, one artist working editorial, bridal,
 * and red carpet out of a Melrose Place studio in Los Angeles. The home
 * page is a beauty counter: the headline stacked over the swatch-stroke
 * portrait, the services as shade cards (a texture chip each) riding up
 * over its foot, then the portfolio, the bridal process from trial to
 * first look, the rate card, and the travel policy. Projects become
 * bare-to-done comparisons, the quote form becomes the event inquiry,
 * and the booking strip books consultations, trials, and lessons against
 * Marisol's studio week — wedding days stay contract-only.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/services-makeup` (see PACK.md). The art direction is the
 * counter at night — black grounds, lipstick and shadow smears, glossy
 * skin light — and every comparison is the same face against the same
 * blush backdrop, before honestly bare.
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
        src: `/services-makeup-counter/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({
            src: `/services-makeup-counter/${name}-${step}w.webp`,
            width: step,
        })),
    }
}

export const business = {
    name: "Marisol Vega",
    tagline: "Editorial & bridal makeup",
    location: "Los Angeles, California",
    /** Shown everywhere the number appears; `phoneHref` is the tap target. */
    phone: "(323) 555-0178",
    phoneHref: "tel:+13235550178",
    email: "studio@marisolvega.example",
    address: "8430 Melrose Place, Suite 2, Los Angeles, CA 90069",
    /** The license line — rendered wherever trust is being earned. */
    license: "CA licensed esthetician #Z-98231 · IATSE Local 706",
}

/**
 * Weekly hours drive the quote page's hours line (the shared hours
 * engine, `View/Landing/hours.ts`). Minutes since midnight; a day may
 * have several intervals. Studio days only — wedding days are booked on
 * contract, on location.
 */
export const weeklyHours: DayHours[] = [
    { day: 3, intervals: [[600, 1080]] }, // Wed 10 AM – 6 PM
    { day: 4, intervals: [[600, 1080]] },
    { day: 5, intervals: [[600, 1080]] }, // Fri
]

export const hoursNote =
    "Studio Wednesday–Friday 10 AM–6 PM · Weekends are wedding days, on location by contract"

/** Where the kit travels — the home page's quiet strip. */
export const serviceArea = [
    "Los Angeles",
    "Beverly Hills",
    "Malibu",
    "Pasadena",
    "Palm Springs",
    "Santa Barbara",
    "Ojai",
    "Temecula",
]

/**
 * Landing copy the trade owns: the few strings the landing modules render
 * that would read wrong for a different trade. Remix seeds retrade these
 * along with the rest of the content — everything else in the landing
 * modules is trade-neutral on purpose.
 */
export const landingCopy = {
    /** The home page's services-section heading. */
    servicesHeading: "Services",
    /** The shared nav: page link labels, the CTA, and the logo's line. */
    nav: {
        projects: "Portfolio",
        services: "Rates",
        about: "Marisol",
        cta: "Book a consultation",
        /** Small line under the wordmark; "" for none. */
        tagline: "Makeup · Los Angeles",
    },
    /** The booking ask on heroes, banners, and the about story. */
    quoteCta: "Book a consultation",
    home: {
        nowBuildingLabel: "The studio line",
        servicesKicker: "Services",
        transformationsKicker: "Bare to done",
        transformationsTitle: "Drag from the bare face to the beat",
        testimonialsKicker: "Worn by",
        serviceAreaLabel: "On location across Southern California",
        bannerTitle: "Hold your date.",
        bannerBody:
            "May-through-October wedding dates fill a year out. The first consultation — thirty minutes, video or at the studio — is free.",
    },
    projects: {
        headline: "Portfolio.",
        subheadline:
            "Editorial, bridal, and red carpet — shot in daylight and never retouched past the skin it came with. Filter by the work, then drag a divider: bare, then done.",
        kicker: "Bare to done",
        bannerTitle: "See your face in here?",
    },
    servicesPage: {
        headline: "Services & rates.",
        subheadline:
            "Every rate includes lashes, skin prep, and a touch-up kit to keep. Travel inside Los Angeles is included; destinations are a flat travel day.",
        kicker: "Services",
        faqKicker: "Before you book",
        faqTitle: "What brides and producers ask first",
        bannerTitle: "Not sure what the day needs?",
        bannerBody: `Call ${business.phone} or send the date — Marisol will tell you the artists, the hours, and the rate.`,
    },
    about: {
        kicker: "The artist",
        bullets: [
            business.license,
            "Lashes, skin prep, and a touch-up kit in every rate",
            "Patch-tested, cruelty-free kit",
        ],
        credentialsLabel: "Credentials",
        reviewsKicker: "Worn by",
        reviewsTitle: "Brides, producers, and one legend",
        bannerTitle: "Sit at the vanity.",
    },
    quotePage: {
        kicker: "Event inquiry",
        title: "The date and the face",
        cta: "Send to Marisol",
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

/** The portfolio's portrait plates, shared with the service cards and the bridal rail. */
const plates = {
    liner: photo(
        "portfolio-editorial-liner",
        1152,
        1536,
        "A model with a bleached buzz cut and deep brown skin wearing a sharp violet graphic liner and a glossy nude lip, on black",
    ),
    gloss: photo(
        "portfolio-editorial-gloss",
        1152,
        1536,
        "A model with a glossy black bob, glass skin, and a cherry-red lip, touching her collarbone with red-lacquered nails",
    ),
    veil: photo(
        "portfolio-bridal-veil",
        1152,
        1536,
        "A bride in a lace veil and pearl earrings with soft bronzed skin and a rose lip, candlelight behind her",
    ),
    gold: photo(
        "portfolio-bridal-gold",
        1152,
        1536,
        "A South Asian bride in a red and gold dupatta and maang tikka, with smoked kohl eyes and a berry lip",
    ),
    carpet: photo(
        "portfolio-carpet-gold",
        1152,
        1536,
        "A woman with a sleek high ponytail in a gold sequined gown, luminous skin and a plum lip, event lights behind",
    ),
    silver: photo(
        "portfolio-carpet-silver",
        1152,
        1536,
        "A silver-haired woman in her seventies in black velvet and pearls, soft glowing skin and a classic red lip",
    ),
}

const marisol = photo(
    "about-marisol",
    1600,
    1200,
    "Marisol Vega in a black turtleneck holding a fan of brushes at her vanity, a lit mirror and a velvet curtain behind her",
)

export const projects: Project[] = [
    {
        slug: "bridal-soft-glam",
        title: "Soft-glam bride",
        location: "Santa Barbara",
        scope: "Bridal — trial and morning-of",
        description:
            "Skin prepped for a ten-hour day, bronze in the crease, a feathered lash, and a rose lip that survives the toasts.",
        before: photo(
            "look-bridal-before",
            1600,
            1200,
            "A bride in a white satin robe, bare-faced with her hair pulled back, against a blush backdrop",
        ),
        after: photo(
            "look-bridal-after",
            1600,
            1200,
            "The same bride after her makeup: glowing skin, bronzed eyes, a soft lash, and a rose lip",
        ),
    },
    {
        slug: "evening-glam",
        title: "Cherry evening glam",
        location: "West Hollywood",
        scope: "Event — 90 minutes at her hotel",
        description:
            "A satin base, a lifted wing, and a cherry lip lined and blotted twice — built to read under flash and in the dark.",
        before: photo(
            "look-glam-before",
            1600,
            1200,
            "A woman with short natural curls in a black camisole, bare-faced, against a blush backdrop",
        ),
        after: photo(
            "look-glam-after",
            1600,
            1200,
            "The same woman after her makeup: luminous skin, a lifted liner, and a deep cherry lip",
        ),
    },
]

export const services: Service[] = [
    {
        slug: "bridal",
        title: "Bridal",
        eyebrow: "The day",
        description:
            "A trial at the studio, the morning-of on location, lashes, and a touch-up kit — with a second artist for parties over five.",
        priceNote: "From $450",
        image: plates.veil,
    },
    {
        slug: "editorial",
        title: "Editorial & campaign",
        eyebrow: "On set",
        description:
            "Campaigns, lookbooks, press, and covers — skin that reads true on camera, and a look change every two hours.",
        priceNote: "Day rate $1,200",
        image: plates.liner,
    },
    {
        slug: "red-carpet",
        title: "Red carpet & events",
        eyebrow: "The night",
        description:
            "Premieres, galas, and award nights, at your home or hotel — ninety minutes, and the lip in your clutch.",
        priceNote: "From $350",
        image: plates.carpet,
    },
    {
        slug: "lessons",
        title: "Private lessons",
        eyebrow: "The vanity",
        description:
            "Ninety minutes with your own kit: the base, a wing that behaves, and the one lip you'll wear forever.",
        priceNote: "$180",
        image: marisol,
    },
]

/** The trust numbers — the metrics strip. Keep values short and big. */
export const metrics = [
    { value: "14", label: "years in the kit" },
    { value: "600+", label: "brides" },
    { value: "120", label: "editorial credits" },
    { value: "4.9★", label: "average of 380 reviews" },
]

export const testimonials = [
    {
        quote: "Marisol did my trial in daylight and took notes. On the day, my makeup survived a hundred-degree ceremony in Ojai, the crying, and the dance floor — and in the photos I look like me, just rested.",
        name: "Daniela R.",
        detail: "Bridal, Ojai",
    },
    {
        quote: "She's who I call when the light is unforgiving. Twelve hours, three looks, and not one frame where the skin read as makeup.",
        name: "Joanna K.",
        detail: "Photographer, editorial campaign",
    },
    {
        quote: "At seventy-four I did not want to look painted. Marisol gave me my own face back, with a red lip I'll wear for the rest of my life.",
        name: "Lorraine P.",
        detail: "Red carpet, lifetime-achievement night",
    },
]

/**
 * The studio line — the home page's tagline strip under the shade cards
 * (social-proof `ticker`, set static by the register).
 */
export const nowBuilding = ["Crafted for brides", "Edited for icons", "Made to be remembered"]

export interface BuildLogStep {
    /** The short mark on the rail — how far out from the date. */
    label: string
    title: string
    description: string
    image: SiteImage
}

/** The bridal process, trial to first look — the home page's horizontal rail. */
export const buildLog = {
    kicker: "The bridal process",
    title: "Trial to first look.",
    steps: [
        {
            label: "A year out",
            title: "Consultation",
            description:
                "Thirty free minutes, video or at the studio: the dress, the light, the timeline, your skin.",
            image: marisol,
        },
        {
            label: "Three months out",
            title: "The trial",
            description:
                "Two hours bare-faced at the studio: two looks tested, shot in daylight, and written down.",
            image: photo(
                "look-bridal-before",
                1600,
                1200,
                "A bride in a white satin robe, bare-faced with her hair pulled back, against a blush backdrop",
            ),
        },
        {
            label: "Morning of",
            title: "The beat",
            description:
                "On location from six, a chair schedule to the minute, and a second artist for the party.",
            image: plates.veil,
        },
        {
            label: "First look",
            title: "Touch-ups",
            description: "Staying through the first look and portraits with powder, blotting, and the lip.",
            image: photo(
                "look-bridal-after",
                1600,
                1200,
                "The same bride after her makeup: glowing skin, bronzed eyes, a soft lash, and a rose lip",
            ),
        },
    ] as BuildLogStep[],
}

export interface Specimen {
    name: string
    use: string
    description: string
    image: SiteImage
}

/** The base pack's materials board — the portfolio carries the plates, so empty. */
export const species = {
    kicker: "",
    title: "",
    items: [] as Specimen[],
}

export interface Swatch {
    /** The service's name, e.g. "Bridal". */
    name: string
    /** The rate printed under the name, e.g. "From $450". */
    code: string
    /** The card's ground, a six-digit hex — lacquer black, so the chip reads. */
    color: string
    /** One line under the rate. */
    note: string
    /** The shade's texture chip. */
    image?: SiteImage
}

/**
 * The services as shade cards (showcase `swatches`), each with its
 * texture chip and each linking to the booking page. No header, so the
 * row sits straight under the hero.
 */
export const palette = {
    kicker: "",
    title: "",
    items: [
        {
            name: "Bridal",
            code: "From $450",
            color: "#120a0c",
            note: "Trial, morning-of, lashes, and a touch-up kit.",
            image: photo("swatch-cherry", 1024, 1024, "A thick smear of glossy cherry-red lipstick on black"),
        },
        {
            name: "Editorial",
            code: "Day rate",
            color: "#120a0c",
            note: "Campaigns, covers, and press, from $1,200.",
            image: photo(
                "swatch-rose-gold",
                1024,
                1024,
                "A pressed rose-gold shimmer eyeshadow swatch on black",
            ),
        },
        {
            name: "Lessons",
            code: "$180",
            color: "#120a0c",
            note: "Ninety minutes at the vanity, your own kit.",
            image: photo("swatch-plum", 1024, 1024, "A creamy deep-plum lipstick smear on black"),
        },
    ] as Swatch[],
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

/** The rate card (pricing `price-list`). */
export const priceMenu = {
    kicker: "Rates",
    title: "The rate card.",
    intro: "Every rate includes lashes, skin prep, and a touch-up kit to keep. Travel is its own line — see the fine print.",
    groups: [
        {
            heading: "Bridal",
            items: [
                {
                    name: "Bridal makeup",
                    note: "Morning-of, lashes, touch-up kit",
                    qualifier: "from",
                    price: "$450",
                },
                { name: "Bridal trial", note: "Two hours at the studio, two looks", price: "$180" },
                {
                    name: "Bridal party",
                    note: "Per face; a second artist over five",
                    qualifier: "from",
                    price: "$175",
                },
                {
                    name: "Stay for touch-ups",
                    note: "Per hour · through the first look & portraits",
                    price: "$150",
                },
            ],
        },
        {
            heading: "Editorial & red carpet",
            items: [
                { name: "Editorial day", note: "Up to ten hours on set", price: "$1,200" },
                { name: "Editorial half day", note: "Up to five hours on set", price: "$750" },
                {
                    name: "Red carpet & events",
                    note: "Ninety minutes at your home or hotel",
                    qualifier: "from",
                    price: "$350",
                },
            ],
        },
        {
            heading: "Lessons",
            items: [
                { name: "Private lesson", note: "Ninety minutes, your own kit", price: "$180" },
                { name: "Two-person lesson", note: "Two hours, bring a friend", price: "$300" },
            ],
        },
    ] as PriceMenuGroup[],
    footnote: "A 30% retainer holds your date and comes off your final invoice.",
}

export interface LookbookItem {
    name: string
    /** The work and the occasion. */
    meta: string
    description: string
    /** The portfolio's filter chips. */
    tags: string[]
    image: SiteImage
}

/** The portfolio — editorial, bridal, red carpet (showcase `filterable-grid`). */
export const lookbook = {
    kicker: "Portfolio",
    title: "Editorial, bridal, red carpet.",
    items: [
        {
            name: "The violet line",
            meta: "Editorial",
            description: "A graphic liner drawn in one pass, and skin left to be skin.",
            tags: ["Editorial"],
            image: plates.liner,
        },
        {
            name: "Glass & cherry",
            meta: "Editorial",
            description: "Glass skin, a cherry lip, and a nail to match — for a spring campaign.",
            tags: ["Editorial"],
            image: plates.gloss,
        },
        {
            name: "The veil",
            meta: "Bridal · Santa Barbara",
            description: "Bronze and rose for a mission ceremony at golden hour.",
            tags: ["Bridal"],
            image: plates.veil,
        },
        {
            name: "Gold & kohl",
            meta: "Bridal · three days, Artesia",
            description:
                "Smoked kohl and a berry lip that held through the sangeet, the ceremony, and the reception.",
            tags: ["Bridal"],
            image: plates.gold,
        },
        {
            name: "Gold on gold",
            meta: "Red carpet · a Hollywood premiere",
            description: "A plum lip against sequins, built to hold under a hundred flashes.",
            tags: ["Red carpet"],
            image: plates.carpet,
        },
        {
            name: "Silver screen",
            meta: "Red carpet · a lifetime achievement",
            description: "Soft light on the skin, the classic red, and nothing that reads as painted.",
            tags: ["Red carpet"],
            image: plates.silver,
        },
    ] as LookbookItem[],
}

export interface Policy {
    title: string
    body: string
}

/** Travel, retainers, and the day — one ticked card (feature-grid `checklist`). */
export const policies = {
    kicker: "The fine print",
    title: "Travel, retainers, the day.",
    cardTitle: "Before you book",
    body: "The same rules for every face — they keep the chair on time and your date safe.",
    image: plates.silver as SiteImage | null,
    items: [
        {
            title: "A 30% retainer holds your date",
            body: "Non-refundable, and it comes off your final invoice. Dates are held on a signed contract only.",
        },
        {
            title: "Travel inside LA is included",
            body: "Anywhere inside the 405 and the 10 is on the house. Beyond that, $1 a mile round trip from Melrose Place.",
        },
        {
            title: "Destinations are a flat travel day",
            body: "Palm Springs, Santa Barbara, Ojai, Temecula: $350, plus a hotel night before any start earlier than 7 AM.",
        },
        {
            title: "Early starts",
            body: "Chair times before 6 AM are $100 per artist.",
        },
        {
            title: "Skin first",
            body: "Tell me about allergies, retinoids, or a recent facial at the trial — anything new gets a patch test.",
        },
        {
            title: "Moving your date",
            body: "Once, free, with 90 days' notice — the retainer travels with you.",
        },
    ] as Policy[],
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
    /** The counter card: the first line huge, the middle small, the last word in lipstick. */
    headline: "Beat\nfor the gods.",
    subheadline:
        "Editorial, bridal, and red-carpet makeup out of a Melrose Place studio — skin first, lashes included, and a touch-up kit to keep.",
    heroImage: photo(
        "hero-beat",
        2400,
        1800,
        "A woman with dark curls, a winged liner, and a glossy red lip looking back over her shoulder through painterly strokes of cherry, plum, and rose-gold makeup",
    ),
    /** Show each service's `priceNote` under its title in the home grid. */
    servicePrices: true,
    /** The shade cards carry the offer on home, so no services grid there. */
    serviceGrid: false,
    hero: {
        /** The title card: the headline over the swatch-stroke portrait. */
        storefront: false,
        /** The billing line under the headline. */
        credit: "Editorial & bridal makeup artist · Los Angeles",
        /** No photo caption on the counter card. */
        caption: "",
        /** The last word ("gods.") in lipstick. */
        accent: "last-word" as "none" | "last-word",
        /** No kicker over the headline. */
        kicker: "",
        /** No cover lines — the shade cards follow. */
        coverLines: [] as string[],
        /** No collage row. */
        panels: [] as HeroPanel[],
        /** Title-card only: the studio's seal — first line small, the rest large. Empty: none. */
        seal: "",
    },
    /** The home before/after teaser: the soft-glam bride. */
    featuredProjects: [projects[0]] as Project[],
    /** The home metrics strip (empty: the numbers live on the about page). */
    proofMetrics: [] as typeof metrics,
    /** The closing banner's artwork: the three shades, stroked on black. */
    bannerImage: photo(
        "cta-swatch-strokes",
        2400,
        1350,
        "Three long painterly strokes of cherry lipstick, rose-gold shimmer, and deep plum across a black ground",
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
    headline: "Marisol, at the vanity.",
    photo: marisol,
    paragraphs: [
        "Marisol Vega grew up in Boyle Heights doing her tías' makeup for quinceañeras and weddings, a fishing-tackle box of drugstore shadows on the kitchen table. Fourteen years later she works out of a Melrose Place studio, a Local 706 card in her wallet and the same belief: skin first, and nothing that reads as painted.",
        "Her editorial work runs from campaign sets to covers, where the light is merciless and the skin has to hold for twelve hours. Her brides get the same discipline — a trial in daylight, notes on every product, and a minute-by-minute chair schedule on the day.",
        "It is one artist, on purpose. Marisol does every bride's face herself, brings a second artist she has trained only for parties over five, and books a limited number of wedding dates each season so no morning is rushed.",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "CA licensed esthetician #Z-98231",
        "IATSE Local 706 makeup artist",
        "Airbrush & HD certified",
        "Cruelty-free, patch-tested kit",
    ],
}

export const process = {
    kicker: "How a booking runs",
    title: "Consultation to the last touch-up",
    steps: [
        {
            title: "Consultation",
            description:
                "Thirty free minutes, video or at the studio: the event, the light, your skin, and the look you keep saving.",
        },
        {
            title: "The contract",
            description:
                "Artists, hours, travel, and the rate in writing, and a 30% retainer to hold the date. Nothing added later.",
        },
        {
            title: "The trial",
            description:
                "Two hours at the studio for brides: two looks, photographed in daylight, every product written on your face chart.",
        },
        {
            title: "The day",
            description:
                "On location to the minute, lashes and skin prep included, and a touch-up kit with your exact lip left in your hand.",
        },
    ],
}

export const faq = [
    {
        question: "Do I need a trial?",
        answer: "For brides, yes — it's where the look gets decided in daylight, not on the morning. Book it two to three months out, ideally on the day of your hair trial, and wear something in the color of your dress.",
    },
    {
        question: "Will it last through the day?",
        answer: "Skin prep is half the work: the base is built to wear ten hours and read true on camera. I stay for touch-ups through the first look when you book it, and every bride leaves with a kit and her own lip.",
    },
    {
        question: "Do you work with every skin tone and texture?",
        answer: "Every one. The kit is built for deep, olive, fair, mature, and textured skin, and the foundation is mixed on your face, not picked from a wall.",
    },
    {
        question: "Do you travel?",
        answer: "Inside Los Angeles, travel is included. Palm Springs, Santa Barbara, Ojai, and Temecula are a flat $350 travel day; anywhere else, ask — I've packed the kit for Mexico City and Maui.",
    },
    {
        question: "What's the deposit?",
        answer: "A 30% retainer holds your date on a signed contract and comes off the final invoice. It's non-refundable, but it moves with you once if you change your date with 90 days' notice.",
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
 * The studio books three kinds of visit online: the free consultation, a
 * bridal trial, and a private lesson. One provider — every face is
 * Marisol's — with studio windows only; wedding days are on contract.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "consultation",
            name: "Free consultation",
            durationMinutes: 30,
            description: "Video or at the studio: the event, the light, your skin, and the look.",
        },
        {
            typeId: "bridal-trial",
            name: "Bridal trial",
            durationMinutes: 120,
            description:
                "Two looks tested at the studio, photographed in daylight, and written on your face chart.",
        },
        {
            typeId: "private-lesson",
            name: "Private lesson",
            durationMinutes: 90,
            description: "Ninety minutes at the vanity with your own kit.",
        },
    ],
    providers: [
        {
            providerId: "marisol-vega",
            name: "Marisol Vega",
            windows: [
                { day: 3, start: 10 * 60, end: 18 * 60 },
                { day: 4, start: 10 * 60, end: 18 * 60 },
                { day: 5, start: 10 * 60, end: 18 * 60 },
            ],
        },
    ],
}

/** The /quote page's booking strip — the slot picker above the form. */
export const booking = {
    headline: "Book the vanity",
    intro: "Book a free consultation, a bridal trial, or a lesson at the studio — pick a time and you'll get a confirmation with a one-click reschedule link. For a wedding day or a set, send the date through the form below.",
    /** The new/returning select's trade voice (the widget's statusLabels). */
    statusLabels: { new: "First time with Marisol", returning: "I've been in the chair" },
    /** The line under the booking form (the widget's privacyNote). */
    privacyNote:
        "A name and a way to reach you hold the time. Your skin notes and face chart stay in Marisol's book, and nowhere else.",
}

export const quote = {
    headline: "Tell me about the day.",
    body: "The date, the place, how many faces, and the look you keep saving. You'll hear back within one business day — with the artists, the hours, and the rate.",
    confirmation:
        "Thank you — it's in. Marisol answers every inquiry herself within one business day, with your date's availability first.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        { name: "phone", label: "Phone", type: "tel" as const },
        {
            name: "event",
            label: "The occasion",
            type: "select" as const,
            options: [
                "Wedding",
                "Editorial or campaign",
                "Red carpet or event",
                "Private lesson",
                "Something else",
            ],
            required: true,
        },
        { name: "date", label: "Date", type: "date" as const, required: true },
        { name: "location", label: "Where", placeholder: "Venue, hotel, or set — and the city" },
        { name: "faces", label: "How many faces", placeholder: "Just me, me and four, a cast of twelve …" },
        {
            name: "message",
            label: "The look",
            type: "textarea" as const,
            fullWidth: true,
            required: true,
        },
    ],
}
