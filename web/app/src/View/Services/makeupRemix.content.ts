/**
 * The services-makeup remix's content seed (packs/README.md "Derived
 * templates"): a bridal and occasion makeup artist worn over the services
 * pack. At compose time this file is copied byte-for-byte over
 * `View/Services/content.ts`, so it must remain a STRUCTURAL TWIN of that
 * module — the same export surface, the same shapes, the contract's
 * minimums met (tests/View/Services/makeupRemixSeed.test.ts pins the
 * twin).
 *
 * The trade: Velvet Hour Makeup, a one-artist bridal and occasion makeup
 * studio in Charleston, South Carolina. Services become the rate card,
 * before/after projects become face transformations (shot straight-on
 * against the same backdrop — the artist's convention, and the comparison
 * stays honest), the quote form becomes the event inquiry, and the
 * booking strip books consultations, studio sessions, and trials against
 * the artist's actual week — weekend wedding dates stay contract-only.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/services-makeup` (see PACK.md). The art direction is
 * soft natural window light — blush, brass, and linen; transformations
 * from the same angle on the same backdrop so the slider reads as one
 * face, before honestly bare.
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
        src: `/services-makeup/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/services-makeup/${name}-${step}w.webp`, width: step })),
    }
}

export const business = {
    name: "Velvet Hour Makeup",
    tagline: "Bridal & occasion makeup artistry",
    location: "Charleston, South Carolina",
    /** Shown everywhere the number appears; `phoneHref` is the tap target. */
    phone: "(843) 555-0129",
    phoneHref: "tel:+18435550129",
    email: "hello@velvethourmakeup.example",
    address: "58 Cannon Street, Studio 2, Charleston, SC 29403",
    /** The license line — rendered wherever trust is being earned. */
    license: "SC licensed esthetician #EST-30442 · Kit fully sanitized between every face", // theme-exempt: license number, not a color
}

/**
 * Weekly hours drive the live "Open now — closes 6 PM" hero badge (the
 * shared hours engine, `View/Landing/hours.ts`). Minutes since midnight;
 * a day may have several intervals. Wednesday–Friday in the studio;
 * weekend mornings run early for wedding calls.
 */
export const weeklyHours: DayHours[] = [
    { day: 0, intervals: [[420, 840]] }, // Sun 7 AM – 2 PM (wedding mornings)
    { day: 3, intervals: [[600, 1080]] }, // Wed 10 AM – 6 PM
    { day: 4, intervals: [[600, 1080]] }, // Thu
    { day: 5, intervals: [[540, 1080]] }, // Fri 9 AM – 6 PM
    { day: 6, intervals: [[420, 960]] }, // Sat 7 AM – 4 PM (wedding mornings)
]

export const hoursNote =
    "Wednesday–Friday in the studio, by appointment · Weekend mornings on location for weddings · Sundays from 7 AM"

/** The places the kit actually travels — the home page's quiet strip. */
export const serviceArea = [
    "Downtown Charleston",
    "Mount Pleasant",
    "West Ashley",
    "Daniel Island",
    "Sullivan's Island",
    "Kiawah & Seabrook",
]

/**
 * Landing copy the trade owns: the few strings the landing modules render
 * that would read wrong for a different trade. Remix seeds retrade these
 * along with the rest of the content — everything else in the landing
 * modules is trade-neutral on purpose.
 */
export const landingCopy = {
    /** The home page's services-section heading. */
    servicesHeading: "Services & rates",
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
        slug: "bridal-soft-glam",
        title: "The bridal soft glam",
        location: "Downtown Charleston",
        scope: "Trial + wedding day — 90 minutes",
        description:
            "A June bride who wanted to look like herself in forty years of photos: luminous skin over skincare prep, a soft rose eye, and a romantic low updo's worth of staying power — set to survive vows, humidity, and the hug line.",
        before: photo(
            "transform-bridal-before",
            1152,
            864,
            "A bride-to-be bare-faced before her trial: clean skin, hair pinned back, no makeup",
        ),
        after: photo(
            "transform-bridal-after",
            1152,
            864,
            "The same bride after the trial: luminous soft-glam bridal makeup and a loose romantic updo",
        ),
    },
    {
        slug: "evening-glam",
        title: "The evening glam",
        location: "Mount Pleasant",
        scope: "Event glam — 60 minutes",
        description:
            "A gala guest who asked for 'more than I'd ever do myself': a soft-smoked bronze eye, sculpted warmth, and a satin berry lip — glam that reads across a ballroom and still looks like skin up close.",
        before: photo(
            "transform-glam-before",
            1152,
            864,
            "A client bare-faced before her event: natural skin with uneven tone, hair pulled back, no makeup",
        ),
        after: photo(
            "transform-glam-after",
            1152,
            864,
            "The same client in finished evening glam: bronze smoked eye, sculpted cheeks, deep berry lip, polished curls",
        ),
    },
    {
        slug: "no-makeup-makeup",
        title: "The no-makeup makeup",
        location: "Wagener Terrace",
        scope: "Soft natural — 45 minutes",
        description:
            "The hardest look in the kit: redness calmed, skin evened but still skin, brows brushed up, a whisper of taupe and a sheer rosewood lip. Her husband asked if she'd slept well. That's the review.",
        before: photo(
            "transform-natural-before",
            1152,
            864,
            "A client bare-faced before her appointment: visible redness and under-eye shadows, hair clipped back",
        ),
        after: photo(
            "transform-natural-after",
            1152,
            864,
            "The same client after soft natural makeup: calmed even skin that still looks like skin, hair softly styled",
        ),
    },
]

export const services: Service[] = [
    {
        slug: "bridal",
        title: "Bridal makeup",
        eyebrow: "The big day",
        description:
            "Wedding-day artistry on location: skincare prep, the look from your trial executed to the minute, and a touch-up kit in your maid of honor's hands before I leave. Party and mothers' faces quoted per person.",
        priceNote: "From $285",
        image: projects[0].after,
    },
    {
        slug: "bridal-trial",
        title: "The bridal trial",
        eyebrow: "The big day",
        description:
            "Ninety minutes in the studio, months before the morning matters: photos, skin talk, the full look built and adjusted until it's yours — then worn out the door to test it against real life.",
        priceNote: "From $95",
        image: projects[1].after,
    },
    {
        slug: "event-glam",
        title: "Evening & event glam",
        eyebrow: "Occasions",
        description:
            "Galas, black tie, milestone birthdays, engagement shoots — glam calibrated to the room and the camera, from soft radiance to a full smoked eye.",
        priceNote: "From $110",
        image: projects[2].after,
    },
    {
        slug: "lessons",
        title: "Makeup lessons",
        eyebrow: "The studio",
        description:
            "Your face, your bag, my mirror: a two-hour one-on-one where we build a five-minute routine and a night-out look with the products you already own — plus a shopping list for the three that are missing.",
        priceNote: "From $150",
        image: photo(
            "service-lesson",
            1152,
            864,
            "A makeup lesson at the studio mirror: the artist guiding a client's hand holding an angled brush, face chart on the counter",
        ),
    },
    {
        slug: "editorial",
        title: "Editorial & photoshoots",
        eyebrow: "On set",
        description:
            "Camera-ready artistry for brand shoots, headshots, and editorial work — HD and flash-tested, with on-set touch-ups through the last frame. Half- and full-day rates.",
        priceNote: "From $175",
        image: photo(
            "service-editorial",
            1152,
            864,
            "A makeup artist applying finishing powder to a model on a photo set with studio lights",
        ),
    },
]

/** The trust numbers — the metrics strip. Keep values short and big. */
export const metrics = [
    { value: "9", label: "years behind the brush" },
    { value: "180+", label: "weddings made up" },
    { value: "5.0★", label: "average of 210 reviews" },
    { value: "1,400+", label: "faces done" },
]

export const testimonials = [
    {
        quote: "I cried through my vows, hugged two hundred people in July humidity, and danced until midnight. My makeup outlasted my heels. Ivy finished six faces that morning and mine still felt like the only one that mattered.",
        name: "Lauren B.",
        detail: "Bridal, Downtown Charleston",
    },
    {
        quote: "I showed her a photo of a look I was sure would be 'too much' for me. She built a version of it that was somehow both bolder and more me — three people at the gala asked who did my makeup before dinner was served.",
        name: "Danielle R.",
        detail: "Evening glam, Mount Pleasant",
    },
    {
        quote: "The lesson paid for itself in a month. She went through my actual makeup bag, threw nothing away, taught me a five-minute face with what I owned, and the list of three things to buy came to less than $60.",
        name: "Grace T.",
        detail: "Makeup lesson, West Ashley",
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
    headline: "Makeup that photographs like skin.",
    subheadline:
        "Bridal and occasion artistry in Charleston — soft glam that survives tears, humidity, and the last song. In the studio on Cannon Street, or on location with the kit.",
    heroImage: photo(
        "hero-studio",
        1152,
        864,
        "The studio vanity: a bulb-ringed mirror, brushes in ceramic cups, palettes on a brass tray, and a rose velvet stool",
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
        /** No collage row. */
        panels: [] as HeroPanel[],
        /** Title-card only: the studio's seal — first line small, the rest large. Empty: none. */
        seal: "",
    },
    /** The home before/after teaser: which projects lead (empty: none). */
    featuredProjects: [projects[0], projects[2]] as Project[],
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
    headline: "Faces first, trends second.",
    photo: photo(
        "portrait-ivy",
        864,
        1152,
        "Ivy Calloway in a black brush apron beside her studio vanity, fan brush in hand",
    ),
    paragraphs: [
        "Velvet Hour is Ivy Calloway — nine years behind the brush, the first three assisting an editorial artist on Atlanta fashion shoots, the last six building a bridal book in Charleston one referred face at a time. The studio on Cannon Street opened in 2022; the kit still travels every weekend.",
        "The philosophy is skin first: prep is half the appointment, coverage goes only where it's needed, and the finished face has to survive a hug, a happy cry, and a flash photo — not just the mirror. Trends visit the kit; they don't run it.",
        "Every brush and lash tray is sanitized between faces, the kit is cruelty-free end to end, and the quote you get is the price you pay — travel, early-morning starts, and party faces all written down before you sign anything.",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "SC esthetician license #EST-30442",
        "Editorial-trained, Atlanta",
        "Airbrush & HD certified",
        "Cruelty-free kit, sanitized between faces",
    ], // theme-exempt: license number, not a color
}

export const process = {
    kicker: "How a booking runs",
    title: "No surprises, mirror to last dance",
    steps: [
        {
            title: "The consultation",
            description:
                "Fifteen free minutes: your date, your venue, your photos — the ones you love and the ones that scared you off makeup artists. You'll leave with a real quote, faces and travel included.",
        },
        {
            title: "The trial",
            description:
                "Ninety minutes in the studio, months out. We build the look, photograph it in daylight and flash, adjust until it's yours — then you wear it out the door and tell me how it lived.",
        },
        {
            title: "The day",
            description:
                "On location, timed backward from photos: a written schedule per face, the bride last so she's freshest, and a finished room before the photographer wants anyone.",
        },
        {
            title: "The staying power",
            description:
                "Every face gets set for twelve hours, and the touch-up kit — lipstick, blot papers, pins — goes to a named keeper before I pack the brushes. What I promise at the trial, I hand over on the day.",
        },
    ],
}

export const faq = [
    {
        question: "Do I need a trial?",
        answer: "For weddings, yes — it's where the look gets built, photographed, and stress-tested months before the morning it has to be perfect. For events and shoots, the consultation photos are usually enough, and we adjust in the chair.",
    },
    {
        question: "How long does a wedding morning take?",
        answer: "Forty-five minutes to an hour per face, and the schedule is written backward from your photographer's start time — each face gets a slot, the bride goes last, and the room is finished with margin to spare. You'll have the timeline in writing a week out.",
    },
    {
        question: "Do you travel?",
        answer: "Every weekend. Downtown and Mount Pleasant carry no travel fee; Kiawah, Seabrook, and beyond are quoted flat with the booking — written into the contract, never a surprise on the invoice. Early starts before 7 AM carry a posted fee too.",
    },
    {
        question: "I have sensitive skin or a skin condition. Can you work with it?",
        answer: "Almost always, and honestly when not. The consultation asks about skin history for exactly this reason: the kit carries hypoallergenic and fragrance-free lines, every tool is sanitized between faces, and if something needs a dermatologist's sign-off first, I'll say so.",
    },
    {
        question: "What's your cancellation policy?",
        answer: "Studio appointments move free with 48 hours' notice. Wedding dates are held by a retainer that applies to your balance — it's what turns other brides away from your morning — and reschedules inside ninety days rebook at the season's open dates.",
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
 * The studio books three kinds of visit online: the free consultation,
 * an in-studio session, and the bridal trial. One artist, studio days
 * only — weekend wedding dates are reserved by contract, never by the
 * booking widget, so the windows deliberately stop on Friday.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "consultation",
            name: "Free 15-minute consultation",
            durationMinutes: 15,
            description:
                "Your date, your venue, your inspiration photos — and a real quote before you commit to anything.",
        },
        {
            typeId: "studio-session",
            name: "Studio session",
            durationMinutes: 75,
            description:
                "An in-studio appointment — event glam, a natural look, or the first hour of a lesson.",
        },
        {
            typeId: "bridal-trial",
            name: "Bridal trial",
            durationMinutes: 90,
            description:
                "The full wedding look, built and adjusted in the studio mirror — then worn out the door.",
        },
    ],
    providers: [
        {
            providerId: "ivy-calloway",
            name: "Ivy Calloway",
            windows: [
                { day: 3, start: 10 * 60, end: 17 * 60 },
                { day: 4, start: 10 * 60, end: 17 * 60 },
                { day: 5, start: 9 * 60, end: 17 * 60 },
            ],
        },
    ],
}

/** The /quote page's booking strip — the slot picker above the form. */
export const booking = {
    headline: "Get on the calendar",
    intro: "Book a free consultation, a studio session, or a bridal trial directly — pick a time and you'll get a confirmation with a one-click reschedule link. Weekend wedding dates are reserved by contract, so start with the consultation and I'll hold your morning.",
    /** The new/returning select's trade voice (the widget's statusLabels). */
    statusLabels: { new: "First time in the chair", returning: "Returning client" },
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
    headline: "Tell me about your day.",
    body: "A few lines — the date, the venue, how many faces, and the look you're dreaming about (inspiration photos welcome at the consult) — and you'll hear back within one business day.",
    confirmation:
        "Thank you — your note is in. I answer every inquiry personally within one business day, and wedding dates get a same-week call.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "phone", label: "Phone", type: "tel", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "event", label: "The occasion", placeholder: "Wedding, gala, shoot, lesson …" },
        { name: "date", label: "The date", placeholder: "June 14th, next spring, flexible …" },
        { name: "party", label: "How many faces", placeholder: "Just me, me + 4, the whole party …" },
        {
            name: "message",
            label: "About the look",
            type: "textarea",
            fullWidth: true,
            required: true,
        },
    ] as QuoteField[],
}
