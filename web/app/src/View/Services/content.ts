/**
 * The services pack's single content file: the business, its services,
 * projects, and pages. Everything the site renders comes from here — edit
 * this file (not the page components) to make the site yours. The demo
 * business is a remodeling contractor, but the shape fits any trade:
 * plumber, electrician, landscaper, cleaner — swap the services, projects,
 * and copy and the site follows.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/services` (see PACK.md). The `photo` helper mirrors that
 * verb's naming exactly. Never point a slot at a raw camera file.
 *
 * Before/after pairs are the pack's proof: shoot (or pick) both frames
 * from the same angle, or the comparison reads as two different rooms.
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
        src: `/services/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/services/${name}-${step}w.webp`, width: step })),
    }
}

export const business = {
    name: "Cedar & Stone Remodeling",
    tagline: "Remodeling and home improvement",
    location: "Bend, Oregon",
    /** Shown everywhere the number appears; `phoneHref` is the tap target. */
    phone: "(541) 555-0147",
    phoneHref: "tel:+15415550147",
    email: "office@cedarandstone.example",
    address: "1140 SE Wilson Ave, Suite B, Bend, OR 97702",
    /** The license line — rendered wherever trust is being earned. */
    license: "Licensed, bonded & insured — OR CCB #204718", // theme-exempt: license number, not a color
}

/**
 * Weekly hours drive the live "Open now — closes 5 PM" hero badge (the
 * shared hours engine, `View/Landing/hours.ts`). Minutes since midnight;
 * a day may have several intervals.
 */
export const weeklyHours: DayHours[] = [
    { day: 1, intervals: [[420, 1020]] }, // Mon 7 AM – 5 PM
    { day: 2, intervals: [[420, 1020]] },
    { day: 3, intervals: [[420, 1020]] },
    { day: 4, intervals: [[420, 1020]] },
    { day: 5, intervals: [[420, 1020]] }, // Fri
    { day: 6, intervals: [[480, 720]] }, // Sat 8 AM – noon
]

export const hoursNote = "Monday–Friday 7 AM–5 PM · Saturday 8 AM–noon · Estimates by appointment"

/** The towns the crew actually drives to — the home page's quiet strip. */
export const serviceArea = ["Bend", "Redmond", "Sisters", "Tumalo", "Sunriver", "Prineville"]

/**
 * Landing copy the trade owns: the few strings the landing modules render
 * that would read wrong for a different trade. Remix seeds retrade these
 * along with the rest of the content — everything else in the landing
 * modules is trade-neutral on purpose.
 */
export const landingCopy = {
    /** The home page's services-section heading. */
    servicesHeading: "Six trades, one crew",
    /** The shared nav: page link labels, the CTA, and the logo's line. */
    nav: {
        projects: "Projects",
        services: "Services",
        about: "About",
        cta: "Get a quote",
        /** Small line under the wordmark; "" for none. */
        tagline: "",
    },
    /** The quote ask on heroes, banners, and the about story. */
    quoteCta: "Get a free quote",
    home: {
        nowBuildingLabel: "",
        servicesKicker: "What we do",
        transformationsKicker: "Before & after",
        transformationsTitle: "Drag to see the difference",
        testimonialsKicker: "From our clients",
        serviceAreaLabel: "Proudly serving",
        bannerTitle: "Tell us what you're planning.",
        bannerBody: `Free walkthroughs and written quotes across Central Oregon. ${hoursNote}.`,
    },
    projects: {
        headline: "The proof is in the after.",
        subheadline:
            "Every project below shows the same room from the same angle, before and after the crew. Drag the divider — we didn't stage the befores.",
        kicker: "Recent projects",
        bannerTitle: "Your place could be the next after.",
    },
    servicesPage: {
        headline: "What we do, and what it costs.",
        subheadline:
            "Honest starting prices below — every job gets a written, itemized quote after a free walkthrough, and the quote is the price.",
        kicker: "Services",
        faqKicker: "Fair questions",
        faqTitle: "What people ask before hiring us",
        bannerTitle: "Not sure which service fits? Ask.",
        bannerBody: `Call ${business.phone} or send the details — we'll tell you straight if a job isn't worth doing.`,
    },
    about: {
        kicker: "The company",
        bullets: [
            business.license,
            "Fixed written quotes — the quote is the price",
            "One crew and one project lead, start to finish",
        ],
        credentialsLabel: "Credentials",
        reviewsKicker: "From our clients",
        reviewsTitle: "The reviews we're proudest of",
        bannerTitle: "Let's walk through it together.",
    },
    quotePage: {
        kicker: "Quote request",
        title: "The details",
        cta: "Request a quote",
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
        slug: "juniper-kitchen",
        title: "Juniper Avenue kitchen",
        location: "Bend",
        scope: "Full gut remodel — 6 weeks",
        description:
            "A 1970s galley opened into the dining room: new framing, cabinetry to the ceiling, quartz counters, and twice the light.",
        before: photo(
            "project-kitchen-before",
            1536,
            1024,
            "The Juniper Avenue kitchen before the remodel: dated cabinets and a closed-in galley layout",
        ),
        after: photo(
            "project-kitchen-after",
            1536,
            1024,
            "The Juniper Avenue kitchen after the remodel: opened to the dining room with new cabinetry and quartz counters",
        ),
    },
    {
        slug: "shevlin-bath",
        title: "Shevlin Park bath",
        location: "Bend",
        scope: "Tile, vanity & fixtures — 3 weeks",
        description:
            "A hall bath rebuilt from the studs: curbless tiled shower, double vanity, and heated floors under porcelain.",
        before: photo(
            "project-bath-before",
            1536,
            1024,
            "The Shevlin Park bathroom before the remodel: worn fixtures and an aging tub surround",
        ),
        after: photo(
            "project-bath-after",
            1536,
            1024,
            "The Shevlin Park bathroom after the remodel: curbless tiled shower and a double vanity",
        ),
    },
    {
        slug: "larkspur-basement",
        title: "Larkspur basement",
        location: "Redmond",
        scope: "Finish-out — 8 weeks",
        description:
            "Seven hundred unfinished square feet turned into a family room, guest suite, and full bath — egress windows and all permits included.",
        before: photo(
            "project-basement-before",
            1536,
            1024,
            "The Larkspur basement before finishing: bare studs, concrete floor, and exposed joists",
        ),
        after: photo(
            "project-basement-after",
            1536,
            1024,
            "The Larkspur basement after finishing: a warm family room with a guest suite beyond",
        ),
    },
    {
        slug: "metolius-deck",
        title: "Metolius River deck",
        location: "Sisters",
        scope: "Tear-off & rebuild — 2 weeks",
        description:
            "A failing deck torn back to the ledger and rebuilt in cedar with steel-cable rails, sized for the view it was wasting.",
        before: photo(
            "project-deck-before",
            1536,
            1024,
            "The Metolius River deck before the rebuild: weathered boards and a sagging rail",
        ),
        after: photo(
            "project-deck-after",
            1536,
            1024,
            "The Metolius River deck after the rebuild: new cedar decking with steel-cable rails",
        ),
    },
    {
        slug: "tumalo-adu",
        title: "Tumalo garage ADU",
        location: "Tumalo",
        scope: "Conversion — 12 weeks",
        description:
            "A two-car garage converted into a permitted 480 sq ft ADU: insulation, plumbing, a full kitchen, and its own entrance.",
        before: photo(
            "project-adu-before",
            1536,
            1024,
            "The Tumalo garage before conversion: bare walls, a concrete slab, and storage clutter",
        ),
        after: photo(
            "project-adu-after",
            1536,
            1024,
            "The Tumalo ADU after conversion: a bright studio apartment with a full kitchen",
        ),
    },
]

export const services: Service[] = [
    {
        slug: "kitchens",
        title: "Kitchen remodels",
        eyebrow: "Interiors",
        description:
            "From cabinet refacing to full gut remodels — layout, cabinetry, counters, lighting, and the plumbing and electrical to match.",
        priceNote: "From $24,000",
        image: projects[0].after,
    },
    {
        slug: "bathrooms",
        title: "Bathroom remodels",
        eyebrow: "Interiors",
        description:
            "Tile showers, vanities, heated floors, and ventilation done right — small rooms where the craft shows most.",
        priceNote: "From $12,000",
        image: projects[1].after,
    },
    {
        slug: "basements",
        title: "Basement finishing",
        eyebrow: "Interiors",
        description:
            "Framing, egress, insulation, and finish work that turns storage square footage into rooms your family actually uses.",
        priceNote: "From $30,000",
        image: projects[2].after,
    },
    {
        slug: "decks",
        title: "Decks & outdoor living",
        eyebrow: "Exteriors",
        description:
            "Cedar and composite decks, pergolas, and rails — engineered for snow load and built to be barefoot-friendly.",
        priceNote: "From $9,500",
        image: projects[3].after,
    },
    {
        slug: "additions",
        title: "Additions & ADUs",
        eyebrow: "Structures",
        description:
            "Room additions and accessory dwelling units, from feasibility and permits through the final walkthrough.",
        priceNote: "By consultation",
        image: projects[4].after,
    },
    {
        slug: "repairs",
        title: "Repairs & small jobs",
        eyebrow: "Service calls",
        description:
            "Dry rot, drywall, doors, trim, and the list on your fridge — a licensed crew for the jobs too small for a big bid.",
        priceNote: "From $150",
        image: photo(
            "service-repairs",
            1536,
            1024,
            "A carpenter's hands fitting a new piece of trim with a chisel",
        ),
    },
]

/** The trust numbers — the metrics strip. Keep values short and big. */
export const metrics = [
    { value: "18", label: "years in Central Oregon" },
    { value: "430+", label: "projects completed" },
    { value: "4.9★", label: "average of 210 reviews" },
    { value: "10-yr", label: "workmanship warranty" },
]

export const testimonials = [
    {
        quote: "The quote was the price, the schedule was the schedule, and the site was swept every night. Our kitchen came out better than the drawings — and we lived at home through all six weeks of it.",
        name: "Karen & Doug Whitfield",
        detail: "Kitchen remodel, Bend",
    },
    {
        quote: "Three contractors told us the garage couldn't be an ADU without tearing it down. Cedar & Stone pulled the permits, kept the structure, and my mother moved in twelve weeks later.",
        name: "Priya Raman",
        detail: "Garage ADU, Tumalo",
    },
    {
        quote: "They're the only crew I've had in the house that I'd hand a key to. Small repair list, no job too boring, invoice matched the estimate to the dollar.",
        name: "Ed Sorensen",
        detail: "Repairs & maintenance, Redmond",
    },
]

/**
 * What's on the bench right now — the home page's rolling ticker, one
 * line per job. Empty to drop the section.
 */
export const nowBuilding: string[] = []

export interface BuildLogStep {
    /** The short mark on the rail — a month, a phase; "" for the step number. */
    label: string
    /** The time the step takes ("15 min"), set under its title on the rail; omit for none. */
    duration?: string
    title: string
    description: string
    image: SiteImage
    /**
     * More photographs of the same step, set beside the first — a contact
     * strip. Only the timeline reading lays them out; the rail shows the
     * first photograph alone.
     */
    frames?: SiteImage[]
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
    /**
     * The column a directory reading groups the item under (a stylist's
     * level, a collection); set as the item's small eyebrow elsewhere.
     */
    group?: string
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
    /** The caption under the photograph, e.g. "Mehndi". */
    label: string
    /** A tall portrait (3:4). */
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
    headline: "Built right the first time.",
    subheadline:
        "Kitchens, baths, basements, decks, and additions across Central Oregon — one licensed crew from the first walkthrough to the final one.",
    heroImage: photo(
        "hero-01",
        1536,
        1024,
        "A finished open-plan kitchen and living room with timber beams and afternoon light",
    ),
    /** Show each service's `priceNote` under its title in the home services grid. */
    servicePrices: false,
    /** Show the home services grid (false: the menu board or deck carries the offer). */
    serviceGrid: true,
    hero: {
        /**
         * `true`: the storefront hero — live open/closed badge, the
         * subheadline, and quote + call buttons beside the photograph.
         * `false`: the title card — the headline over the full-bleed
         * photograph with the credit line and the photo's caption.
         */
        storefront: true,
        /** Tracked caps — what and where: under the title card's headline, or closing the storefront hero's copy. Empty: none. */
        credit: "",
        /** Title-card only: the photograph's own caption. */
        caption: "",
        /** Title-card only: where the headline's accent word lands. */
        accent: "none" as "none" | "last-word",
        /** Title-card only: the small kicker over the headline. Empty: none. */
        kicker: "",
        /** Title-card only: short stacked sells under the headline ("\n" splits a line's lead from its tail). */
        coverLines: [] as string[],
        /**
         * A row of captioned photographs under the copy — the events of a
         * weekend, the rooms of a house — where the pinned hero variant
         * lays them out (`panel-collage`). Empty: none.
         */
        panels: [] as HeroPanel[],
        /** Title-card only: the studio's seal — first line small, the rest large. Empty: none. */
        seal: "",
    },
    /** The home before/after teaser: which projects lead (empty: none). */
    featuredProjects: [projects[0], projects[3]] as Project[],
    /** The home metrics strip (empty: the strip lives on the about page). */
    proofMetrics: metrics,
    /** The closing banner's photograph (null: a plain banner). */
    bannerImage: null as SiteImage | null,
}

/** A detail photograph with its small-caps title and caption. */
export interface FeatureFigure {
    title: string
    caption: string
    image: SiteImage
}

/**
 * One story told at length — a house, a pool, a restoration — as a
 * content split on the home page: kicker and headline, the paragraphs,
 * the photograph, and a link through to the work. The pinned variant
 * decides how much of it shows: `feature` (the magazine spread) adds the
 * pull quote, the detail figures, and the closing plate. An empty
 * `headline` drops the section.
 */
export const feature = {
    kicker: "",
    headline: "",
    paragraphs: [] as string[],
    image: null as SiteImage | null,
    /** The link through to the projects page; "" for none. */
    linkLabel: "",
    /** `feature` only: the sentence lifted out of the story; "" for none. */
    pullQuote: "",
    /** `feature` only: detail photographs under the story. */
    figures: [] as FeatureFigure[],
    /** `feature` only: the closing plate (a drawing, an elevation); null for none. */
    plate: null as SiteImage | null,
    plateCaption: "",
}

export const about = {
    headline: "A crew you'd hand a key to.",
    photo: photo(
        "crew",
        1024,
        1536,
        "The Cedar & Stone crew on a job site, tool belts on, in front of a framed addition",
    ),
    paragraphs: [
        "Cedar & Stone started in 2008 with one truck, a table saw, and a rule that hasn't changed: the quote is the price. Founder Marcus Webb spent a decade framing custom homes before turning to remodeling, where the craft is harder — every wall you open has a surprise behind it, and the difference between contractors is what they do about it.",
        "Today we're a crew of nine — carpenters, a tile setter, and a project lead for every job — plus the same three licensed subs we've used for over a decade for plumbing, electrical, and HVAC. We take on a limited number of projects at a time so the crew that starts your job finishes it.",
        "Every project is permitted, every change order is written and signed before the work happens, and every job ends the same way: a walkthrough with a punch list, and a ten-year warranty on our workmanship in writing.",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: ["OR CCB #204718", "Bonded & insured", "EPA lead-safe certified", "NARI member"], // theme-exempt: license number, not a color
}

export const process = {
    kicker: "How a project runs",
    title: "No surprises, start to finish",
    steps: [
        {
            title: "Walkthrough",
            description:
                "We come out, measure, and listen. You get honest feedback on what's worth doing — and what isn't — within two days.",
        },
        {
            title: "Fixed quote",
            description:
                "A written, itemized quote with a start date. The quote is the price; changes only happen on paper, signed by you first.",
        },
        {
            title: "The build",
            description:
                "One project lead, a posted schedule, and a site left broom-clean every evening. You'll never wonder who's showing up.",
        },
        {
            title: "Walkthrough, again",
            description:
                "We punch-list the job together before the final invoice — then stand behind the work with a ten-year warranty.",
        },
    ],
}

export const faq = [
    {
        question: "What does an estimate cost?",
        answer: "Nothing. Walkthroughs and written quotes are free within our service area, and the quote you sign is the price you pay — changes only happen through written, signed change orders.",
    },
    {
        question: "Are you licensed and insured?",
        answer: "Yes — Oregon CCB #204718, bonded and fully insured, and we're happy to send certificates before any work starts. Our plumbing, electrical, and HVAC subs carry their own licenses.", // theme-exempt: license number, not a color
    },
    {
        question: "Who handles permits?",
        answer: "We do. Every project that needs a permit gets one, pulled by us and inspected on schedule — it's included in the quote, never a surprise line item.",
    },
    {
        question: "How far out are you booking?",
        answer: "Larger remodels typically start six to ten weeks from a signed quote. Repairs and small jobs usually land within two weeks. The walkthrough is the fastest way to get a real date.",
    },
    {
        question: "How does payment work?",
        answer: "A deposit at signing, progress payments at milestones we agree on in advance, and the final payment only after the walkthrough punch list is done. We never ask for large sums up front.",
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
 * The demo trade books two kinds of visit: the free estimate walkthrough
 * (an hour on site) and a scheduled service call for the repair list. One
 * provider — the founder does every walkthrough — with weekday windows
 * inside the posted business hours.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "estimate-visit",
            name: "Free estimate visit",
            durationMinutes: 60,
            description: "A walkthrough of the job — we measure, listen, and follow up with a written quote.",
        },
        {
            typeId: "service-call",
            name: "Service call",
            durationMinutes: 120,
            description: "A scheduled block for repairs and small jobs — the list on your fridge, handled.",
        },
    ],
    providers: [
        {
            providerId: "marcus-webb",
            name: "Marcus Webb",
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
    headline: "Put us on the calendar",
    intro: "Book a free estimate walkthrough or a service call directly — pick a time and you'll get a confirmation with a one-click cancel link. Prefer to write first? The form below reaches the same crew.",
    /** The new/returning select's trade voice (the widget's statusLabels). */
    statusLabels: { new: "First time working together", returning: "We've worked together before" },
    /** The line under the booking form (the widget's privacyNote). */
    privacyNote:
        "Just the basics to hold your time — no health questions here, ever. Anything about your visit stays between you and your care team at the office.",
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
    headline: "Tell us about the job.",
    body: "A few lines about the project — what, where, and roughly when — and we'll call you back within one business day to set up a free walkthrough.",
    confirmation:
        "Thank you — your request is in. We reply to every inquiry within one business day, usually the same afternoon.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "phone", label: "Phone", type: "tel", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "town", label: "Town", placeholder: "Bend, Redmond, Sisters …" },
        { name: "project", label: "Type of project", placeholder: "Kitchen, bath, deck, repairs …" },
        { name: "timeline", label: "Ideal timing", placeholder: "This spring, flexible …" },
        {
            name: "message",
            label: "About the project",
            type: "textarea",
            fullWidth: true,
            required: true,
        },
    ] as QuoteField[],
}
