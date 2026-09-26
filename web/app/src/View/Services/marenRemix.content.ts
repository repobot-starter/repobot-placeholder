/**
 * The services-hair-maren remix's content seed (packs/README.md "Derived
 * templates"): a private-suite hair atelier worn over the services pack.
 * At compose time this file is copied byte-for-byte over
 * `View/Services/content.ts`, so it must remain a STRUCTURAL TWIN of that
 * module — the same export surface, the same shapes, the contract's
 * minimums met (tests/View/Services/groupOneRemixSeeds.test.ts pins the
 * twin).
 *
 * The trade: Maren Atelier, a Highland Park salon in Dallas where every
 * appointment is a private suite. The home page is a daylight suite in
 * full bleed under a Didone headline, then the stylists as a directory —
 * three columns by level (Master, Senior, Artisan), each portrait under
 * an arch with the stylist's specialties, the cut rate, and the next
 * open suite, filtered by specialty — and one quiet ask. Projects become
 * before-and-after comparisons, the quote form becomes the consultation
 * request, and the booking strip books consultations against each
 * stylist's week.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/services-hair-maren` (see PACK.md). The art direction
 * is limestone and daylight — plaster walls, an arched mirror, an olive
 * tree, black smocks — and every portrait is shot against the same warm
 * plaster.
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
        src: `/services-hair-maren/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({
            src: `/services-hair-maren/${name}-${step}w.webp`,
            width: step,
        })),
    }
}

export const business = {
    name: "Maren Atelier",
    tagline: "Private-suite hair atelier",
    location: "Highland Park, Dallas",
    /** Shown everywhere the number appears; `phoneHref` is the tap target. */
    phone: "(214) 555-0149",
    phoneHref: "tel:+12145550149",
    email: "suites@marenatelier.example",
    address: "4417 Lovers Lane, Suite 200, Dallas, TX 75225",
    /** The license line — rendered wherever trust is being earned. */
    license: "Texas licensed cosmetology salon · By appointment only",
}

/**
 * Weekly hours drive the quote page's hours line (the shared hours
 * engine, `View/Landing/hours.ts`). Minutes since midnight; a day may
 * have several intervals.
 */
export const weeklyHours: DayHours[] = [
    { day: 2, intervals: [[540, 1140]] }, // Tue 9 AM – 7 PM
    { day: 3, intervals: [[540, 1140]] },
    { day: 4, intervals: [[540, 1200]] }, // Thu 9 AM – 8 PM
    { day: 5, intervals: [[540, 1140]] },
    { day: 6, intervals: [[480, 960]] }, // Sat 8 AM – 4 PM
]

export const hoursNote = "Tuesday–Friday 9 AM–7 PM (Thursday until 8) · Saturday 8 AM–4 PM · By appointment"

/** Where clients come from — the quiet strip. */
export const serviceArea = ["Highland Park", "University Park", "Preston Hollow", "Uptown", "Turtle Creek"]

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
        projects: "Work",
        services: "Services",
        about: "The atelier",
        cta: "Reserve",
        /** Small line under the wordmark; "" for none. */
        tagline: "",
    },
    /** The booking ask on heroes, banners, and the about story. */
    quoteCta: "Reserve a consultation",
    home: {
        nowBuildingLabel: "This week",
        servicesKicker: "Services",
        transformationsKicker: "Before & after",
        transformationsTitle: "Drag across the same chair",
        testimonialsKicker: "Clients",
        serviceAreaLabel: "Clients from",
        bannerTitle: "Every appointment is a private suite.",
        bannerBody: "One stylist, one client, one room, with the door closed.",
    },
    projects: {
        headline: "The work.",
        subheadline:
            "Color, cuts, and extensions, photographed in the suite's north light before and after. Drag a divider across the same chair.",
        kicker: "Before & after",
        bannerTitle: "Ready for your own suite?",
    },
    servicesPage: {
        headline: "Services, by level.",
        subheadline:
            "Every stylist is Master, Senior, or Artisan, and the rate follows the level, never the length of your hair. A consultation comes with every first visit.",
        kicker: "Services",
        faqKicker: "Before your first suite",
        faqTitle: "What new clients ask",
        bannerTitle: "Not sure who to book?",
        bannerBody: `Call ${business.phone} and our coordinator will match you with the right stylist for the work.`,
    },
    about: {
        kicker: "The atelier",
        bullets: [
            business.license,
            "Six private suites, one client each",
            "Consultation with every first visit",
        ],
        credentialsLabel: "Training",
        reviewsKicker: "Clients",
        reviewsTitle: "Kind words from the suites",
        bannerTitle: "Reserve a suite.",
    },
    quotePage: {
        kicker: "Consultation request",
        title: "Your hair and your stylist",
        cta: "Request a consultation",
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

/** The stylists' portraits, shared by the directory and the service cards. */
const portraits = {
    camille: photo(
        "stylist-camille",
        1200,
        1600,
        "Camille Moreau, a stylist with dark shoulder-length waves, laughing with scissors and a comb raised",
    ),
    helene: photo(
        "stylist-helene",
        1200,
        1600,
        "Hélène Bastide, a colorist with a cropped platinum natural cut and gold hoops, grinning as she paints a foil",
    ),
    lena: photo(
        "stylist-lena",
        1200,
        1600,
        "Lena Ellison, a stylist with a sleek bob and fringe, laughing behind her hand, a round brush in the other",
    ),
    ines: photo(
        "stylist-ines",
        1200,
        1600,
        "Inès Laurent, a stylist with a high dark ponytail, mid-sentence with a blow-dryer in one hand",
    ),
    rohan: photo(
        "stylist-rohan",
        1200,
        1600,
        "Rohan Mehta, a stylist with a textured crop and a gold chain, laughing as he combs his own hair",
    ),
    margaux: photo(
        "stylist-margaux",
        1200,
        1600,
        "Margaux Fontaine, a stylist with curly blonde hair piled up, tongue out, snipping the air with shears",
    ),
}

const atelier = photo(
    "about-atelier",
    1600,
    1200,
    "An empty limestone suite with an arched doorway, a travertine console, a vase of white blossoms, and a linen bench",
)

export const projects: Project[] = [
    {
        slug: "glossed-brunette",
        title: "Brassy to glossed brunette",
        location: "Suite 2 · Lena Ellison",
        scope: "Color correction — one visit, three hours",
        description:
            "Two years of box color lifted out, a cool brunette laid in, and a gloss that keeps it from turning orange again.",
        before: photo(
            "color-before",
            1600,
            1200,
            "The back of a client's long, brassy orange-brown hair in a black smock, seen from behind in the suite",
        ),
        after: photo(
            "color-after",
            1600,
            1200,
            "The same client's hair after color: an even, glossy cool brunette falling past her shoulders",
        ),
    },
    {
        slug: "collarbone-cut",
        title: "Long layers to a collarbone cut",
        location: "Suite 1 · Camille Moreau",
        scope: "Precision cut — ninety minutes",
        description:
            "Ten inches off, cut dry to fall where it grows, with a soft bevel that dries straight without a round brush.",
        before: photo(
            "cut-before",
            1600,
            1200,
            "A client in a black cape laughing as she holds up her long, heavy, overgrown ends",
        ),
        after: photo(
            "cut-after",
            1600,
            1200,
            "The same client laughing as she swings her new glossy collarbone-length bob",
        ),
    },
]

export const services: Service[] = [
    {
        slug: "precision-cut",
        title: "Precision cut",
        eyebrow: "Cut",
        description: "Cut dry, to the way it grows, with a finish you can repeat at home in ten minutes.",
        priceNote: "From $120",
        image: portraits.camille,
    },
    {
        slug: "color",
        title: "Color & gloss",
        eyebrow: "Color",
        description:
            "Single-process, corrections, and glosses mixed to your skin in the suite's north light.",
        priceNote: "From $180",
        image: portraits.lena,
    },
    {
        slug: "blonding",
        title: "Blonding",
        eyebrow: "Color",
        description: "Hand-painted balayage and fine foils, lifted slowly and toned so they grow out soft.",
        priceNote: "From $260",
        image: portraits.margaux,
    },
    {
        slug: "extensions",
        title: "Extensions",
        eyebrow: "Length",
        description:
            "Hand-tied wefts matched strand by strand, installed in one visit, moved up every eight weeks.",
        priceNote: "By consultation",
        image: portraits.rohan,
    },
]

/** The trust numbers — the metrics strip. Keep values short and big. */
export const metrics = [
    { value: "6", label: "private suites" },
    { value: "1", label: "client per room" },
    { value: "19", label: "years on Lovers Lane" },
    { value: "4.9★", label: "average of 540 reviews" },
]

export const testimonials = [
    {
        quote: "Nobody talks over the blow-dryer next to you, because there is no one next to you. Camille listens, cuts, and it falls exactly the same way six weeks later.",
        name: "Katherine D.",
        detail: "Client since 2019",
    },
    {
        quote: "Lena spent twenty minutes looking at my hair in daylight before she mixed a thing. The color is the first one I haven't had to fix myself.",
        name: "Alexis M.",
        detail: "Color, Preston Hollow",
    },
    {
        quote: "I came in for a trim and left knowing why my hair did what it did. That is the whole atelier: they explain, and then they are right.",
        name: "Renée T.",
        detail: "Precision cut, University Park",
    },
]

/** The week's line — unused on the directory home, so empty. */
export const nowBuilding: string[] = []

export interface BuildLogStep {
    label: string
    title: string
    description: string
    image: SiteImage
    /** More photographs of the same step, set beside the first. */
    frames?: SiteImage[]
}

/** The build log — the directory carries the home page, so empty. */
export const buildLog = {
    kicker: "",
    title: "",
    steps: [] as BuildLogStep[],
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

/** The rate card — rates ride the stylists, so no menu board. */
export const priceMenu = {
    kicker: "",
    title: "",
    intro: "",
    groups: [] as PriceMenuGroup[],
    footnote: "",
}

export interface LookbookItem {
    name: string
    /** The cut rate. */
    meta: string
    /** The next open suite. */
    description: string
    /** Specialties — the directory's filter chips. */
    tags: string[]
    image: SiteImage
    /** The stylist's level — the directory's column. */
    group?: string
}

/** The stylists by level (showcase `directory`: columns by group, chips by specialty). */
export const lookbook = {
    kicker: "",
    title: "",
    items: [
        {
            name: "Camille Moreau",
            group: "Master",
            meta: "Cut from $250",
            description: "Next suite: Thursday",
            tags: ["Precision cuts", "Color"],
            image: portraits.camille,
        },
        {
            name: "Hélène Bastide",
            group: "Master",
            meta: "Cut from $250",
            description: "Next suite: Saturday",
            tags: ["Blonding", "Color"],
            image: portraits.helene,
        },
        {
            name: "Lena Ellison",
            group: "Senior",
            meta: "Cut from $180",
            description: "Next suite: Thursday",
            tags: ["Color", "Blonding"],
            image: portraits.lena,
        },
        {
            name: "Inès Laurent",
            group: "Senior",
            meta: "Cut from $180",
            description: "Next suite: Friday",
            tags: ["Precision cuts", "Extensions"],
            image: portraits.ines,
        },
        {
            name: "Rohan Mehta",
            group: "Artisan",
            meta: "Cut from $120",
            description: "Next suite: Thursday",
            tags: ["Extensions", "Precision cuts"],
            image: portraits.rohan,
        },
        {
            name: "Margaux Fontaine",
            group: "Artisan",
            meta: "Cut from $120",
            description: "Next suite: Wednesday",
            tags: ["Blonding", "Extensions"],
            image: portraits.margaux,
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
    /** The title card over the suite, in two lines. */
    headline: "Hair,\nconsidered.",
    subheadline:
        "A Highland Park atelier of six private suites — precision cuts, color, blonding, and extensions, one client to a room.",
    heroImage: photo(
        "hero-suite",
        2400,
        1350,
        "A stylist in black laughing with a seated client into an arched mirror as she lifts a section of hair, an olive tree beside them",
    ),
    /** Show each service's `priceNote` under its title in the home grid. */
    servicePrices: true,
    /** The directory carries the offer on home, so no services grid there. */
    serviceGrid: false,
    hero: {
        /** The title card: the headline over the suite. */
        storefront: false,
        /** No billing line: the headline stands alone. */
        credit: "",
        /** No photo caption. */
        caption: "",
        /** No accent word: the Didone carries it. */
        accent: "none" as "none" | "last-word",
        /** No kicker over the headline. */
        kicker: "",
        /** No cover lines — the directory follows. */
        coverLines: [] as string[],
        /** No panels: the photograph is the hero. */
        panels: [] as HeroPanel[],
        /** Title-card only: the studio's seal — first line small, the rest large. Empty: none. */
        seal: "",
    },
    /** The home before/after teaser: the color correction. */
    featuredProjects: [projects[0]] as Project[],
    /** The home metrics strip (empty: the numbers live on the about page). */
    proofMetrics: [] as typeof metrics,
    /** No banner artwork: the closing ask sits on the limestone page. */
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
    headline: "Six rooms, and a door that closes.",
    photo: atelier,
    paragraphs: [
        "Maren Lindqvist opened the atelier in 2007 after a decade on open salon floors in Paris and New York, where she learned to cut and color beautifully and hated every minute of the noise. Maren Atelier is the opposite: six private suites off Lovers Lane, each with its own chair, basin, and north window.",
        "Every stylist trains in the atelier's method and advances by level — Artisan, Senior, Master — on the work alone. The rate follows the level, and every level cuts dry, colors in daylight, and explains what they're doing.",
        "Appointments run long on purpose. Nobody is double-booked, the next client never waits outside your door, and a consultation comes with every first visit.",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "Texas licensed cosmetology salon",
        "Master colorist certified",
        "Hand-tied extension certified",
        "Vegan, ammonia-free color line",
    ],
}

export const process = {
    kicker: "Your first suite",
    title: "Consultation to finish",
    steps: [
        {
            title: "The consultation",
            description:
                "Fifteen minutes in daylight with your stylist: how your hair grows, what it has been through, and what you want it to do.",
        },
        {
            title: "The plan",
            description:
                "The time, the rate, and the maintenance, in writing before anything is mixed or cut.",
        },
        {
            title: "The work",
            description: "Cut dry, colored in north light, with the door closed and nobody waiting outside.",
        },
        {
            title: "The finish",
            description:
                "A lesson in the ten-minute version you'll do at home, and the date of your next suite.",
        },
    ],
}

export const faq = [
    {
        question: "What do the levels mean?",
        answer: "Artisan, Senior, and Master are earned on the work alone, reviewed each year by Maren. Every level trains in the same method; the rate reflects experience and demand, not a different standard.",
    },
    {
        question: "Why is every appointment private?",
        answer: "Because a good consultation is quiet, color needs honest light, and nobody wants to be watched mid-foil. Each suite has its own chair, basin, and window.",
    },
    {
        question: "Do I need a consultation first?",
        answer: "It comes with every first visit and is free on its own. For color corrections and extensions, we ask for a separate consultation so the plan and the price are right.",
    },
    {
        question: "What is your cancellation policy?",
        answer: "Forty-eight hours' notice, please. Later cancellations are charged half the service, because the suite was held for you alone.",
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
 * The atelier books consultations and cuts online, one stylist per
 * level, each on their own days.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "consultation",
            name: "Consultation",
            durationMinutes: 30,
            description:
                "Fifteen minutes in daylight with your stylist, then the plan and the rate in writing.",
        },
        {
            typeId: "precision-cut",
            name: "Precision cut & finish",
            durationMinutes: 90,
            description: "Cut dry to the way your hair grows, with a finish you can repeat at home.",
        },
    ],
    providers: [
        {
            providerId: "camille-moreau",
            name: "Camille Moreau",
            windows: [
                { day: 2, start: 9 * 60, end: 19 * 60 },
                { day: 4, start: 9 * 60, end: 20 * 60 },
            ],
        },
        {
            providerId: "lena-ellison",
            name: "Lena Ellison",
            windows: [
                { day: 3, start: 9 * 60, end: 19 * 60 },
                { day: 4, start: 9 * 60, end: 20 * 60 },
            ],
        },
        {
            providerId: "rohan-mehta",
            name: "Rohan Mehta",
            windows: [
                { day: 4, start: 9 * 60, end: 20 * 60 },
                { day: 6, start: 8 * 60, end: 16 * 60 },
            ],
        },
    ],
}

/** The /quote page's booking strip — the slot picker above the form. */
export const booking = {
    headline: "Reserve a suite",
    intro: "Book a consultation or a cut with the stylist of your choice. Pick a time and you'll get a confirmation with a one-click reschedule link. For color corrections and extensions, send a request through the form below.",
    /** The new/returning select's trade voice (the widget's statusLabels). */
    statusLabels: { new: "First suite at Maren", returning: "I've been in a suite" },
    /** The line under the booking form (the widget's privacyNote). */
    privacyNote:
        "A name and a way to reach you hold the suite. Your color formulas stay in your stylist's book, and nowhere else.",
}

export const quote = {
    headline: "Tell us about your hair.",
    body: "What it's been through, what you'd like it to do, and who you'd like to see. Our coordinator replies within a day with a stylist and a suite.",
    confirmation:
        "Thank you — it's in. Our coordinator replies within one business day with a stylist, a suite, and a time.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        { name: "phone", label: "Phone", type: "tel" as const },
        {
            name: "service",
            label: "The work",
            type: "select" as const,
            options: ["Precision cut", "Color", "Blonding", "Extensions", "Color correction", "Not sure yet"],
            required: true,
        },
        {
            name: "stylist",
            label: "Stylist",
            type: "select" as const,
            options: ["No preference", "Master", "Senior", "Artisan"],
        },
        {
            name: "message",
            label: "Your hair's story",
            type: "textarea" as const,
            fullWidth: true,
            required: true,
        },
    ],
}
