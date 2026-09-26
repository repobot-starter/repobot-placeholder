/**
 * The services-hair-sable remix's content seed (packs/README.md "Derived
 * templates"): a natural-hair and silk-press studio worn over the
 * services pack. At compose time this file is copied byte-for-byte over
 * `View/Services/content.ts`, so it must remain a STRUCTURAL TWIN of that
 * module — the same export surface, the same shapes, the contract's
 * minimums met (tests/View/Services/groupOneRemixSeeds.test.ts pins the
 * twin).
 *
 * The trade: Sable Atelier, a Black-owned studio in Shaw, Washington DC,
 * where a silk press is a ritual, not a rush. The home page is a
 * silk-pressed portrait in full bleed in walnut light, then the ritual in
 * five photographed steps with their minutes — consult, cleanse, steam,
 * press, finish — one client's words between two rules, the rates on one
 * line, and one ask. Projects become before-and-after comparisons, the
 * quote form becomes the consultation request, and the booking strip
 * books the ritual against the stylists' week.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/services-hair-sable` (see PACK.md). The art direction
 * is espresso and cognac — walnut panels, leather chairs, lamplight on
 * brick — and every comparison is the same chair against the same wall.
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
        src: `/services-hair-sable/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({
            src: `/services-hair-sable/${name}-${step}w.webp`,
            width: step,
        })),
    }
}

export const business = {
    name: "Sable Atelier",
    tagline: "Silk press & natural hair care",
    location: "Shaw, Washington DC",
    /** Shown everywhere the number appears; `phoneHref` is the tap target. */
    phone: "(202) 555-0131",
    phoneHref: "tel:+12025550131",
    email: "chair@sableatelier.example",
    address: "1827 7th Street NW, Washington, DC 20001",
    /** The license line — rendered wherever trust is being earned. */
    license: "DC licensed natural hair care · Black-owned",
}

/**
 * Weekly hours drive the quote page's hours line (the shared hours
 * engine, `View/Landing/hours.ts`). Minutes since midnight; a day may
 * have several intervals.
 */
export const weeklyHours: DayHours[] = [
    { day: 3, intervals: [[600, 1200]] }, // Wed 10 AM – 8 PM
    { day: 4, intervals: [[600, 1200]] },
    { day: 5, intervals: [[600, 1200]] },
    { day: 6, intervals: [[480, 1080]] }, // Sat 8 AM – 6 PM
]

export const hoursNote = "Wednesday–Friday 10 AM–8 PM · Saturday 8 AM–6 PM · By appointment"

/** Where clients come from — the quiet strip. */
export const serviceArea = ["Shaw", "LeDroit Park", "Bloomingdale", "Columbia Heights", "Capitol Hill"]

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
        projects: "Results",
        services: "Services",
        about: "The studio",
        cta: "Book",
        /** Small line under the wordmark; "" for none. */
        tagline: "",
    },
    /** The booking ask on heroes, banners, and the about story. */
    quoteCta: "Reserve your ritual",
    home: {
        nowBuildingLabel: "Rates",
        servicesKicker: "Services",
        transformationsKicker: "Before & after",
        transformationsTitle: "Drag across the same chair",
        testimonialsKicker: "Clients",
        serviceAreaLabel: "Clients from",
        bannerTitle: "Your chair is waiting.",
        bannerBody: "Two hours, five steps, and hair that moves like silk for two weeks.",
    },
    projects: {
        headline: "Results.",
        subheadline:
            "Silk presses, loc maintenance, and color, photographed in the same chair before and after. Healthy first, then beautiful.",
        kicker: "Before & after",
        bannerTitle: "Ready for your own ritual?",
    },
    servicesPage: {
        headline: "Services.",
        subheadline:
            "Every service starts with your scalp and strands, and every press is heat-trained, never heat-damaged. Rates include the consultation.",
        kicker: "Services",
        faqKicker: "Before your ritual",
        faqTitle: "What new clients ask",
        bannerTitle: "Not sure where to start?",
        bannerBody: `Call ${business.phone} and we'll walk you through the right first visit for your hair.`,
    },
    about: {
        kicker: "The studio",
        bullets: [
            business.license,
            "Heat-trained, never heat-damaged",
            "Scalp and strand consultation every visit",
        ],
        credentialsLabel: "Training",
        reviewsKicker: "Clients",
        reviewsTitle: "From the chair",
        bannerTitle: "Reserve your ritual.",
    },
    quotePage: {
        kicker: "Consultation request",
        title: "Your hair and your history",
        cta: "Send to Sable",
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

/** The ritual's five photographs, shared by the rail and the service cards. */
const ritual = {
    consult: photo(
        "ritual-consult",
        1600,
        1200,
        "A stylist's hands parting a client's coily hair to look at her scalp, close up in warm light",
    ),
    cleanse: photo(
        "ritual-cleanse",
        1600,
        1200,
        "A client laughing up at her stylist at a black basin while the stylist lathers her coils",
    ),
    steam: photo(
        "ritual-steam",
        1600,
        1200,
        "A client in a clear cap under a brass hooded steamer, laughing at her phone with her stylist",
    ),
    press: photo(
        "ritual-press",
        1600,
        1200,
        "A stylist drawing a flat iron through a section of a client's natural hair, half pressed and half coily",
    ),
    finish: photo(
        "ritual-finish",
        1600,
        1200,
        "The back of a client's glossy, blunt silk-pressed bob against walnut paneling",
    ),
}

const studio = photo(
    "about-studio",
    1600,
    1200,
    "The studio: exposed brick, walnut shelves of products, a cognac leather chair, and a stylist at a round mirror",
)

export const projects: Project[] = [
    {
        slug: "natural-to-silk",
        title: "Natural to silk press",
        location: "Shaw",
        scope: "Silk press — two hours",
        description:
            "A deep cleanse, a steam treatment, and a press at the lowest heat that works, so it reverts to healthy curls on wash day.",
        before: photo(
            "press-before",
            1600,
            1200,
            "A client in a black cape laughing and patting her full natural coils, in a cognac chair against walnut panels",
        ),
        after: photo(
            "press-after",
            1600,
            1200,
            "The same client grinning as she flips the ends of her long, glossy silk press",
        ),
    },
    {
        slug: "loc-retwist",
        title: "Loc maintenance",
        location: "LeDroit Park",
        scope: "Retwist & style — ninety minutes",
        description: "New growth palm-rolled and a clean, gathered style that keeps tension off the edges.",
        before: photo(
            "locs-before",
            1600,
            1200,
            "The back of a client's head with shoulder-length locs and fuzzy new growth at the roots",
        ),
        after: photo(
            "locs-after",
            1600,
            1200,
            "The same locs neatly retwisted and gathered into a half-up style",
        ),
    },
]

export const services: Service[] = [
    {
        slug: "silk-press",
        title: "The silk press",
        eyebrow: "The ritual",
        description:
            "Consult, cleanse, steam, press, finish — two hours, and a regimen to keep it for two weeks.",
        priceNote: "From $150",
        image: ritual.finish,
    },
    {
        slug: "loc-maintenance",
        title: "Loc maintenance",
        eyebrow: "Locs",
        description: "Retwists, repairs, and styling, with a scalp treatment at every visit.",
        priceNote: "From $140",
        image: ritual.consult,
    },
    {
        slug: "color",
        title: "Color for natural hair",
        eyebrow: "Color",
        description: "Rich, dimensional color with bond care, planned around your press schedule.",
        priceNote: "From $180",
        image: ritual.press,
    },
    {
        slug: "treatment",
        title: "Scalp & strand treatment",
        eyebrow: "Care",
        description: "A cleanse, a steam, and a deep treatment on its own, for hair between presses.",
        priceNote: "$85",
        image: ritual.steam,
    },
]

/** The trust numbers — the metrics strip. Keep values short and big. */
export const metrics = [
    { value: "9", label: "years on 7th Street" },
    { value: "2", label: "hours, never rushed" },
    { value: "0", label: "heat damage, by design" },
    { value: "5.0★", label: "average of 260 reviews" },
]

export const testimonials = [
    {
        quote: "Sable Atelier has become my ritual, not just my appointment. My hair has never been healthier — or more me.",
        name: "Aaliyah B.",
        detail: "Client since 2022",
    },
    {
        quote: "They pressed my hair at the lowest heat I've ever seen and it still swung. Wash day, every curl came back.",
        name: "Danielle O.",
        detail: "Silk press, Bloomingdale",
    },
    {
        quote: "The only studio where the consultation is actually about my scalp. My edges have grown back in a year.",
        name: "Imani J.",
        detail: "Loc maintenance, Capitol Hill",
    },
]

/**
 * The rates — the home page's single line under the testimonial
 * (social-proof `ticker`, set static and centered by the register).
 */
export const nowBuilding = ["Silk press from $150", "Loc maintenance from $140", "Color from $180"]

export interface BuildLogStep {
    /** The short mark on the rail; "" so the rail numbers the steps. */
    label: string
    /** The minutes the step takes, e.g. "15 min". */
    duration?: string
    title: string
    description: string
    image: SiteImage
    /** More photographs of the same step, set beside the first. */
    frames?: SiteImage[]
}

/** The ritual, five steps with their minutes — the home page's rail. */
export const buildLog = {
    kicker: "The ritual",
    title: "Two hours, five steps, one chair.",
    steps: [
        {
            label: "",
            duration: "15 min",
            title: "Consult — scalp and strand",
            description:
                "We look before we touch: your scalp, your ends, and what your hair has been through.",
            image: ritual.consult,
        },
        {
            label: "",
            duration: "30 min",
            title: "Cleanse & treat",
            description: "A clarifying cleanse and a treatment chosen for what we found.",
            image: ritual.cleanse,
        },
        {
            label: "",
            duration: "20 min",
            title: "Steam",
            description: "Moisture driven in under the hood, so the press needs less heat.",
            image: ritual.steam,
        },
        {
            label: "",
            duration: "45 min",
            title: "Press",
            description:
                "Small sections at the lowest heat that works, and never twice over the same strand.",
            image: ritual.press,
        },
        {
            label: "",
            duration: "15 min",
            title: "Finish & regimen",
            description: "A light oil, a wrap lesson, and a two-week plan you can actually follow.",
            image: ritual.finish,
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

/** The rate card — the rates ride the home line, so no menu board. */
export const priceMenu = {
    kicker: "",
    title: "",
    intro: "",
    groups: [] as PriceMenuGroup[],
    footnote: "",
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

/** The portfolio — the comparisons carry the work, so empty. */
export const lookbook = {
    kicker: "",
    title: "",
    items: [] as LookbookItem[],
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
    /** The title card over the portrait, in two lines. */
    headline: "Silk,\npressed.",
    subheadline:
        "A Black-owned natural hair studio in Shaw: silk presses, loc maintenance, and color, done as a two-hour ritual for healthy hair.",
    heroImage: photo(
        "hero-silk",
        2400,
        1350,
        "A woman in a cream sweater laughing as she runs her fingers through freshly pressed hair, curled up in a cognac leather armchair",
    ),
    /** Show each service's `priceNote` under its title in the home grid. */
    servicePrices: true,
    /** The ritual carries the offer on home, so no services grid there. */
    serviceGrid: false,
    hero: {
        /** The title card: the headline over the portrait. */
        storefront: false,
        /** The billing line under the headline. */
        credit: "Natural hair, cared for · Shaw, Washington DC",
        /** No photo caption. */
        caption: "",
        /** No accent word. */
        accent: "none" as "none" | "last-word",
        /** No kicker over the headline. */
        kicker: "",
        /** No cover lines — the ritual follows. */
        coverLines: [] as string[],
        /** No panels: the photograph is the hero. */
        panels: [] as HeroPanel[],
        /** Title-card only: the studio's seal — first line small, the rest large. Empty: none. */
        seal: "",
    },
    /** The home before/after teaser: the silk press. */
    featuredProjects: [projects[0]] as Project[],
    /** The home metrics strip (empty: the numbers live on the about page). */
    proofMetrics: [] as typeof metrics,
    /** No banner artwork: the closing ask sits on the espresso page. */
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
    headline: "A ritual, not a rush.",
    photo: studio,
    paragraphs: [
        "Nia Whitfield opened Sable Atelier on 7th Street in 2017, after years of watching clients trade the health of their hair for a press that lasted a week. The studio is built on the opposite bargain: healthy first, then beautiful, and never in a hurry.",
        "Every visit starts with the scalp and the strand. We steam before we press, we use the lowest heat that works, and we never pass an iron over the same section twice, so wash day brings every curl back.",
        "Sable is Black-owned, staffed by stylists who grew up with this hair, and deliberately small: four chairs, two hours a client, and a regimen that goes home with you.",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "DC licensed natural hair care",
        "Trichology trained",
        "Certified loctician",
        "Black-owned since 2017",
    ],
}

export const process = {
    kicker: "Your first visit",
    title: "Consultation to regimen",
    steps: [
        {
            title: "Book the ritual",
            description:
                "Choose a time online. First visits get an extra fifteen minutes for the consultation.",
        },
        {
            title: "Come as you are",
            description: "Unwashed and undetangled is perfect. We want to see your hair as it lives.",
        },
        {
            title: "Two hours in the chair",
            description:
                "Consult, cleanse, steam, press, and finish, with nothing rushed and nobody waiting.",
        },
        {
            title: "Take the regimen home",
            description: "A written two-week plan, a wrap lesson, and a date for your next ritual.",
        },
    ],
}

export const faq = [
    {
        question: "Will a silk press damage my curls?",
        answer: "Not the way we do it. We steam first, press at the lowest heat that works, and never pass twice over one section. Most clients revert fully on wash day.",
    },
    {
        question: "How long does a press last?",
        answer: "Two weeks with the regimen we send home — a silk wrap at night, no water, and a light oil. Humidity shortens it, so we'll tell you honestly before a DC August.",
    },
    {
        question: "Do you work on locs and color?",
        answer: "Yes. Loc maintenance and color for natural hair are booked separately, and color is planned around your press schedule so we never stack stress on the same strands.",
    },
    {
        question: "What's the cancellation policy?",
        answer: "Twenty-four hours' notice, please. Later cancellations are charged half the service, because the chair was held for two hours.",
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
 * The studio books the ritual and loc maintenance online, two stylists
 * on the studio's days.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "silk-press",
            name: "The silk press ritual",
            durationMinutes: 120,
            description: "Consult, cleanse, steam, press, and finish, with a two-week regimen to take home.",
        },
        {
            typeId: "loc-maintenance",
            name: "Loc maintenance",
            durationMinutes: 90,
            description: "A retwist and style with a scalp treatment.",
        },
    ],
    providers: [
        {
            providerId: "nia-whitfield",
            name: "Nia Whitfield",
            windows: [
                { day: 3, start: 10 * 60, end: 20 * 60 },
                { day: 4, start: 10 * 60, end: 20 * 60 },
                { day: 6, start: 8 * 60, end: 18 * 60 },
            ],
        },
        {
            providerId: "simone-carter",
            name: "Simone Carter",
            windows: [
                { day: 4, start: 10 * 60, end: 20 * 60 },
                { day: 5, start: 10 * 60, end: 20 * 60 },
                { day: 6, start: 8 * 60, end: 18 * 60 },
            ],
        },
    ],
}

/** The /quote page's booking strip — the slot picker above the form. */
export const booking = {
    headline: "Reserve your ritual",
    intro: "Book the silk press ritual or loc maintenance. Pick a time and you'll get a confirmation with a one-click reschedule link. For color or anything you're unsure about, send a note through the form below.",
    /** The new/returning select's trade voice (the widget's statusLabels). */
    statusLabels: { new: "First visit to Sable", returning: "I've been in the chair" },
    /** The line under the booking form (the widget's privacyNote). */
    privacyNote:
        "A name and a way to reach you hold the chair. Your hair history stays with your stylist, and nowhere else.",
}

export const quote = {
    headline: "Tell us about your hair.",
    body: "What it's been through, how you wear it, and what you'd like it to do. We reply within a day with the right first visit.",
    confirmation:
        "Thank you — it's in. Nia or Simone will reply within one business day with a time and a plan.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        { name: "phone", label: "Phone", type: "tel" as const },
        {
            name: "service",
            label: "The work",
            type: "select" as const,
            options: ["Silk press", "Loc maintenance", "Color", "Treatment", "Not sure yet"],
            required: true,
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
