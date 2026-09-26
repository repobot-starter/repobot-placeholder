/**
 * The services pack's single content file: the business, its services,
 * projects, and pages. Everything the site renders comes from here — edit
 * this file (not the page components) to make the site yours. The demo
 * business is a coastal custom builder, but the shape fits any trade that
 * sells by the photograph and the process: timber framers, woodshops,
 * restoration carpenters, stone and tile work — swap the services, the
 * build log, the materials, and the copy and the site follows.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/services` (see PACK.md). The `photo` helper mirrors that
 * verb's naming exactly. Never point a slot at a raw camera file.
 *
 * Before/after pairs are the pack's proof: shoot (or pick) both frames
 * from the same angle, or the comparison reads as two different houses.
 *
 * Optional sections: the home page's now-building ticker, build log,
 * materials board, and color deck render only when their lists have
 * entries, and the home before/after teaser and metrics strip only when
 * `home.featuredProjects` / `home.proofMetrics` do — empty a list to drop
 * its section.
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
        src: `/services-builder/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/services-builder/${name}-${step}w.webp`, width: step })),
    }
}

export const business = {
    name: "Tideline Builders",
    tagline: "Custom homes and fine carpentry",
    location: "Cannon Beach, Oregon",
    /** Shown everywhere the number appears; `phoneHref` is the tap target. */
    phone: "(503) 555-0183",
    phoneHref: "tel:+15035550183",
    email: "studio@tidelinebuilders.example",
    address: "248 N Hemlock St, Cannon Beach, OR 97110",
    /** The license line — rendered wherever trust is being earned. */
    license: "Licensed, bonded & insured — OR CCB #238104", // theme-exempt: license number, not a color
}

/**
 * Weekly hours drive the live "Open now" badge on storefront-style heroes
 * (the shared hours engine, `View/Landing/hours.ts`) and the quote page's
 * hours line. Minutes since midnight; a day may have several intervals.
 */
export const weeklyHours: DayHours[] = [
    { day: 1, intervals: [[480, 1020]] }, // Mon 8 AM – 5 PM
    { day: 2, intervals: [[480, 1020]] },
    { day: 3, intervals: [[480, 1020]] },
    { day: 4, intervals: [[480, 1020]] },
    { day: 5, intervals: [[480, 1020]] }, // Fri
]

export const hoursNote = "Studio open Monday–Friday 8 AM–5 PM · Site walks by appointment"

/** The towns the crew actually builds in — the home page's quiet strip. */
export const serviceArea = [
    "Cannon Beach",
    "Arch Cape",
    "Tolovana Park",
    "Manzanita",
    "Seaside",
    "Gearhart",
    "Astoria",
]

/**
 * Every string the pages render that isn't a fact about the business:
 * section kickers and titles, the asks, the closing banners. Remix seeds
 * retrade these along with the rest of the content — the landing modules
 * themselves carry no copy.
 */
export const landingCopy = {
    /** The home page's services-section heading. */
    servicesHeading: "Four trades under one roof.",
    /** The shared nav: page link labels, the CTA, and the logo's line. */
    nav: {
        projects: "Houses",
        services: "Craft",
        about: "Studio",
        cta: "Begin a project",
        /** Small line under the wordmark; "" for none. */
        tagline: "Cannon Beach, Oregon",
    },
    /** The quote ask on heroes, banners, and the about story. */
    quoteCta: "Begin a project",
    home: {
        nowBuildingLabel: "Now building",
        servicesKicker: "The craft",
        transformationsKicker: "Before & after",
        transformationsTitle: "Drag to see the difference",
        testimonialsKicker: "From the people we built for",
        serviceAreaLabel: "Building from Astoria to Manzanita",
        bannerTitle: "Walk the site with us.",
        bannerBody:
            "Every house starts on the ground it will stand on — a ninety-minute site walk with Ingrid, the lot, and the weather side. No drawings needed.",
    },
    projects: {
        headline: "Houses that were here before us.",
        subheadline:
            "Restoration is half our work: beach cottages and early-century houses the coast had started to take back. Drag the divider — same house, same angle, before and after the crew.",
        kicker: "Restorations",
        bannerTitle: "Have a house the weather is winning against?",
    },
    servicesPage: {
        headline: "Honest figures for fine work.",
        subheadline:
            "Honest starting figures below. Every project gets a fixed-price contract with a written allowance schedule after a site walk — the contract is the price.",
        kicker: "What we build",
        faqKicker: "Before the site walk",
        faqTitle: "What people ask about building on the coast",
        bannerTitle: "Not sure where your project starts?",
        bannerBody: `Call ${business.phone} or tell us about the site — we'll say plainly whether it's a house, a restoration, or a reason to wait.`,
    },
    about: {
        kicker: "The founder",
        bullets: [
            business.license,
            "Fixed-price contracts with written allowances",
            "Every frame cut and joined in our own shop",
        ],
        credentialsLabel: "Credentials",
        reviewsKicker: "In their words",
        reviewsTitle: "Houses, and the people who live in them",
        bannerTitle: "Let's walk the ground first.",
    },
    quotePage: {
        kicker: "Begin a project",
        title: "The site and the house",
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
        slug: "seaside-cottage",
        title: "Avenue U cottage",
        location: "Seaside",
        scope: "Restoration — 9 months",
        description:
            "A storm-worn 1912 beach cottage lifted onto a new foundation, re-sided in cedar, and given back the porch it lost in the 1960s.",
        before: photo(
            "restore-cottage-before",
            1152,
            864,
            "The Avenue U cottage before restoration: gray weathered shingles, a sagging porch, and driftwood debris",
        ),
        after: photo(
            "restore-cottage-after",
            1152,
            864,
            "The Avenue U cottage after restoration: new cedar siding, a rebuilt porch, and restored windows",
        ),
    },
    {
        slug: "arch-cape-cabin",
        title: "Hug Point cabin",
        location: "Arch Cape",
        scope: "Envelope & deck rebuild — 4 months",
        description:
            "A tarped 1950s cabin on the dunes re-roofed, re-sided, and set on a new cedar deck sized for the view it had been hiding from.",
        before: photo(
            "restore-deck-before",
            1152,
            864,
            "The Hug Point cabin before the rebuild: a blue tarp over the roof and a collapsing deck in the dune grass",
        ),
        after: photo(
            "restore-deck-after",
            1152,
            864,
            "The Hug Point cabin after the rebuild: new cedar siding and a wide cedar deck above the dune grass",
        ),
    },
]

export const services: Service[] = [
    {
        slug: "custom-homes",
        title: "Custom homes",
        eyebrow: "New construction",
        description:
            "Houses designed with the site, not against it — geotech-first siting, storm-rated envelopes, and finish carpentry from our own shop.",
        priceNote: "From $725 / sq ft",
        image: photo(
            "service-custom-home",
            1152,
            864,
            "A double-height living room under Douglas fir trusses, a wall of windows onto a foggy beach and sea stacks",
        ),
    },
    {
        slug: "timber-framing",
        title: "Timber framing",
        eyebrow: "Structure",
        description:
            "Douglas fir frames cut and pegged in our Cannon Beach shop, raised on your site in days, and left exposed to be looked at.",
        priceNote: "Frames from $140,000",
        image: photo(
            "service-timber-joinery",
            1152,
            864,
            "A Douglas fir post and beam joined with a pegged mortise-and-tenon, the sea through a window behind",
        ),
    },
    {
        slug: "woodwork",
        title: "Fine woodwork & cabinetry",
        eyebrow: "The shop",
        description:
            "Kitchens, stairs, built-ins, and millwork in the species on this page — dovetailed, oiled, and fitted by the hands that cut them.",
        priceNote: "From $38,000",
        image: photo(
            "service-woodwork",
            1152,
            864,
            "Hand-cut dovetailed white oak drawers pulled open beneath a live-edge counter",
        ),
    },
    {
        slug: "restoration",
        title: "Coastal restoration",
        eyebrow: "Restoration",
        description:
            "Beach cottages and early-century houses brought back: new foundations, rot repair, windows, and siding true to the original.",
        priceNote: "By site walk",
        image: projects[0].after,
    },
]

/** The trust numbers — the metrics strip. Keep values short and big. */
export const metrics = [
    { value: "31", label: "years building on the north coast" },
    { value: "64", label: "custom homes completed" },
    { value: "120 mph", label: "design wind, every envelope" },
    { value: "10-yr", label: "structural warranty" },
]

export const testimonials = [
    {
        quote: "We brought Tideline a view lot and a geotech report that had scared off two builders. Ingrid sited the house eighty feet back from the edge, and it is the quietest place we have ever lived through a storm.",
        name: "Elena & Mark Hollis",
        detail: "Custom home, Tolovana Park",
    },
    {
        quote: "They lifted our 1912 cottage, poured a real foundation under it, and put back every piece of trim they could save. It looks like it always did — it just doesn't move in the wind anymore.",
        name: "Ruth Calder",
        detail: "Cottage restoration, Seaside",
    },
    {
        quote: "The frame went up in four days. The neighbors brought chairs.",
        name: "Daniel Okafor",
        detail: "Timber-frame retreat, Arch Cape",
    },
]

/**
 * What's on the bench right now — the home page's rolling ticker, one
 * site-board line per job: the house, then the phase and where it stands.
 * Empty to drop the section.
 */
export const nowBuilding = [
    "Arch Cape cabin — timber frame, week 9 of 30",
    "Seaside cottage, 1912 — new foundation, week 4 of 14",
    "Manzanita kitchen — cabinetry in the shop, week 6 of 10",
    "Tolovana bluff house — geotech & design, month 2",
]

export interface BuildLogStep {
    /** The short mark on the rail — a month, a phase. */
    label: string
    title: string
    description: string
    image: SiteImage
}

/**
 * One house from survey to keys — the home page's horizontal build log.
 * Four to six steps read best across the frame. Empty `steps` to drop it.
 */
export const buildLog = {
    kicker: "The build log",
    title: "One house, twenty-six months.",
    steps: [
        {
            label: "Mar 2023",
            title: "Survey & geotech",
            description: "Bluff setbacks staked and borings logged before a line was drawn.",
            image: photo(
                "buildlog-01-survey",
                1152,
                864,
                "A surveyor with a tripod on a foggy bluff, orange stakes in the grass above the sea",
            ),
        },
        {
            label: "Aug 2023",
            title: "Foundation",
            description: "Engineered piers poured into basalt, eighty feet back from the edge.",
            image: photo(
                "buildlog-02-foundation",
                1152,
                864,
                "A worker finishing a concrete foundation slab on a headland above the ocean",
            ),
        },
        {
            label: "Jan 2024",
            title: "Timber frame",
            description: "Forty-one Douglas fir bents, cut in our shop, raised in four days.",
            image: photo(
                "buildlog-03-timber-frame",
                1152,
                864,
                "A crane lowering a Douglas fir timber onto a raised frame among coastal spruce",
            ),
        },
        {
            label: "Sep 2024",
            title: "Glass & envelope",
            description: "Storm-rated glazing set against a 120 mph design wind.",
            image: photo(
                "buildlog-04-glass",
                1152,
                864,
                "Two carpenters setting a tall window in a timber frame that looks out to Haystack Rock",
            ),
        },
        {
            label: "May 2025",
            title: "Keys",
            description: "Punch list walked, the first fire lit, keys handed over at low tide.",
            image: photo(
                "buildlog-05-keys",
                1152,
                864,
                "Hands on a live-edge table in the finished great room, a stone fireplace and the sea beyond",
            ),
        },
    ] as BuildLogStep[],
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
 * The materials board — what the houses are made of. Tall 3:4 plates of
 * the material itself. Empty `items` to drop the section.
 */
export const species = {
    kicker: "The species",
    title: "Four woods, one day's drive.",
    items: [
        {
            name: "Douglas fir",
            use: "Frames & beams",
            description: "Stiff, straight, and pegged to outlast the mortgage.",
            image: photo("species-douglas-fir", 1404, 1872, "A vertical-grain Douglas fir board"),
        },
        {
            name: "Western red cedar",
            use: "Siding & decks",
            description: "Salt-proof, and silvers to the color of the fog.",
            image: photo("species-red-cedar", 1404, 1872, "A western red cedar board with a single knot"),
        },
        {
            name: "White oak",
            use: "Floors & stairs",
            description: "Rift-sawn so the boards stay flat in wet air.",
            image: photo("species-white-oak", 1404, 1872, "A pale rift-sawn white oak board"),
        },
        {
            name: "Bigleaf maple",
            use: "Cabinetry",
            description: "Figured boards from storm-felled Coast Range trees.",
            image: photo(
                "species-bigleaf-maple",
                1404,
                1872,
                "A figured bigleaf maple board with quilted grain",
            ),
        },
    ] as Specimen[],
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
 * quote: a salon's styles, a detailer's packages. Empty `groups` to drop
 * the section.
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
 * a filterable grid). For trades whose product is a person's look. Empty
 * `items` to drop the section.
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
    headline: "Built for the weather.",
    subheadline:
        "Custom homes, timber frames, and fine woodwork on the north Oregon coast — sited with the geology, engineered for the storms, finished by hand.",
    heroImage: photo(
        "hero-haystack-house",
        2400,
        1350,
        "A timber house glowing at dusk on a bluff above Cannon Beach, Haystack Rock in the surf below",
    ),
    /** Show each service's `priceNote` under its title in the home craft grid. */
    servicePrices: true,
    /** Show the home services grid (false: the menu board or deck carries the offer). */
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
        credit: "Custom homes · Timber frame · Restoration — Cannon Beach, Oregon",
        /** Title-card only: the photograph's own caption. */
        caption: "The Haystack House, Tolovana Park — 26 months, 14 trades, one view.",
        /** Title-card only: where the headline's accent word lands. */
        accent: "none" as "none" | "last-word",
        /** Title-card only: the small kicker over the headline. Empty: none. */
        kicker: "",
        /** Title-card only: short stacked sells under the headline ("\n" splits a line's lead from its tail). */
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
    bannerImage: photo(
        "cta-woodshop",
        2400,
        1350,
        "The Tideline woodshop at dusk, workbenches under one lamp and rain on the windows",
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
    headline: "Thirty-one winters on one coast.",
    photo: photo(
        "about-founder",
        1152,
        864,
        "Ingrid Solvang at her workbench in the Tideline shop, a hand plane and curled shavings in front of her",
    ),
    paragraphs: [
        "Ingrid Solvang came to Cannon Beach in 1994 as a boat carpenter, refitting trollers in the Astoria yards, and built her first house two winters later — a timber-frame cabin in Arch Cape that is still standing, still dry, on a bluff that has lost twenty feet of its edge since.",
        "Tideline grew from that cabin the slow way: one house at a time, never more than three underway, every frame and cabinet made in the same shop on Hemlock Street. The crew is eleven — framers, finish carpenters, a cabinetmaker — working with the two engineers and the geologist we have trusted for twenty years.",
        "The coast asks more of a house than most places do. We build for the storms we have seen, not the code minimum: every project starts with a site walk and a geotechnical report, and ends with a ten-year structural warranty in writing.",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "OR CCB #238104", // theme-exempt: license number, not a color
        "Bonded & insured",
        "Timber Framers Guild",
        "Oregon Home Builders Association",
    ],
}

export const process = {
    kicker: "How a project runs",
    title: "From the site walk to the keys",
    steps: [
        {
            title: "Site walk",
            description:
                "Ninety minutes on the lot or in the house with Ingrid: the ground, the view, the weather side, and an honest read on what's possible.",
        },
        {
            title: "Geotech & design",
            description:
                "A licensed engineering geologist sets the setbacks; the design follows the site. Permits and hazard reviews start here, not later.",
        },
        {
            title: "Fixed contract",
            description:
                "A fixed price with a written allowance schedule and a start date. Changes happen on paper, signed by you first.",
        },
        {
            title: "The build & the keys",
            description:
                "One project lead, a posted schedule, frames and cabinetry from our shop — and a ten-year structural warranty at the walkthrough.",
        },
    ],
}

export const faq = [
    {
        question: "Can you build on a bluff lot?",
        answer: "Often — but the geology decides, not us. Before any design we commission a geotechnical report from an Oregon-licensed engineering geologist; it sets the setback, the foundation, and occasionally whether to build at all. We would rather tell you no on day one than on day ninety.",
    },
    {
        question: "Who handles Clatsop County permitting?",
        answer: "We do. Coastal lots in Clatsop County and in Cannon Beach, Seaside, and Gearhart often need a geologic hazard review, a tsunami-zone check, and design review on top of the building permit. We pull and track all of it, and it's in the schedule from the first week.",
    },
    {
        question: "How long does a custom home take?",
        answer: "Plan on nine to fourteen months of design, engineering, and permitting, then fourteen to twenty months of building. Timber frames and restorations run shorter. The site walk is where you get a real schedule.",
    },
    {
        question: "What should we budget?",
        answer: "Our custom homes land between $725 and $1,100 per square foot, including engineering and the site work bluff lots need. Restorations are priced after a site walk and a look behind the siding. Every contract is fixed-price with written allowances.",
    },
    {
        question: "Do you need drawings before the site walk?",
        answer: "No. Bring the lot's address, or the house, and whatever you're imagining. If you already have an architect, we're glad to build their drawings — we just ask to walk the site with them early.",
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
 * The demo builder books two kinds of visit: the site walk (ninety minutes
 * on the lot or in the house) and a design consult at the studio. One
 * provider — the founder does every first visit — with weekday windows
 * inside the posted studio hours.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "site-walk",
            name: "Site walk",
            durationMinutes: 90,
            description:
                "Ninety minutes on the lot or in the house — the ground, the view, the weather side, and what's possible.",
        },
        {
            typeId: "design-consult",
            name: "Design consult",
            durationMinutes: 60,
            description:
                "An hour at the studio with drawings, samples, and the species boards: scope, budget, and schedule.",
        },
    ],
    providers: [
        {
            providerId: "ingrid-solvang",
            name: "Ingrid Solvang",
            windows: [
                { day: 1, start: 9 * 60, end: 16 * 60 },
                { day: 2, start: 9 * 60, end: 16 * 60 },
                { day: 3, start: 9 * 60, end: 16 * 60 },
                { day: 4, start: 9 * 60, end: 16 * 60 },
                { day: 5, start: 9 * 60, end: 16 * 60 },
            ],
        },
    ],
}

/** The /quote page's booking strip — the slot picker above the form. */
export const booking = {
    headline: "Walk the site with us",
    intro: "Book a site walk on your lot or a design consult at the studio — pick a time and you'll get a confirmation with a one-click cancel link. Prefer to write first? The form below reaches Ingrid directly.",
    /** The new/returning select's trade voice (the widget's statusLabels). */
    statusLabels: { new: "First project with us", returning: "We've built together before" },
    /** The line under the booking form (the widget's privacyNote). */
    privacyNote:
        "Just enough to hold the time — your name and a way to reach you. Drawings, surveys and budgets can wait for the walk.",
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
    headline: "Tell us about the place.",
    body: "The site, the house you're imagining, and roughly when. We reply within two business days — and every project starts with a site walk.",
    confirmation:
        "Thank you — it's in. Ingrid reads every inquiry herself and replies within two business days.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "phone", label: "Phone", type: "tel" },
        {
            name: "site",
            label: "Site address",
            placeholder: "Street and town, or the lot's tax map number",
            fullWidth: true,
            required: true,
        },
        {
            name: "lot",
            label: "Do you own the lot?",
            type: "select",
            options: ["Yes, we own it", "Under contract", "Still looking", "It's an existing house"],
            required: true,
        },
        {
            name: "project",
            label: "Project type",
            type: "select",
            options: ["Custom home", "Timber frame", "Woodwork & cabinetry", "Restoration", "Not sure yet"],
            required: true,
        },
        {
            name: "timeline",
            label: "Timeline",
            type: "select",
            placeholder: "When would you like to start?",
            options: ["Within 6 months", "6–12 months", "1–2 years", "Just exploring"],
        },
        {
            name: "budget",
            label: "Budget range",
            type: "select",
            placeholder: "A rough range helps",
            options: ["Under $250k", "$250k–$750k", "$750k–$1.5M", "$1.5M+", "Not sure yet"],
        },
        {
            name: "message",
            label: "About the project",
            type: "textarea",
            placeholder: "The view, the rooms, the house you grew up in — whatever you're imagining.",
            fullWidth: true,
        },
    ] as QuoteField[],
}
