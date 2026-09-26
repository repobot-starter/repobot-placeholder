/**
 * The services-contractor-hallock remix's content seed (packs/README.md
 * "Derived templates"): a third-generation estate builder worn over the
 * services pack. At compose time this file is copied byte-for-byte over
 * `View/Services/content.ts`, so it must remain a STRUCTURAL TWIN of that
 * module — the same export surface, the same shapes, the contract's
 * minimums met (tests/View/Services/groupOneRemixSeeds.test.ts pins the
 * twin).
 *
 * The trade: Hallock & Sons, builders of shingle-style estates in the
 * Hamptons and on Nantucket since 1962. The home page is a quarterly's
 * feature: the estate at dawn in full bleed under an engraved headline,
 * then one house told long-form — a kicker and a numbered issue, a drop
 * cap, two columns, the porch as a spread, a pull quote, two detail
 * photographs with their captions, and the elevation drawn as a plate —
 * the lanes it builds on, and one ask. Projects become before-and-after
 * restorations, and the quote form becomes the commission inquiry.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/services-contractor-hallock` (see PACK.md). The art
 * direction is sea fog and hydrangea — weathered cedar, white trim, oak,
 * and the elevation engraved in ink on ivory.
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
        src: `/services-contractor-hallock/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({
            src: `/services-contractor-hallock/${name}-${step}w.webp`,
            width: step,
        })),
    }
}

export const business = {
    name: "Hallock & Sons",
    tagline: "Estate builders since 1962",
    location: "Hamptons & Nantucket",
    /** Shown everywhere the number appears; `phoneHref` is the tap target. */
    phone: "(631) 555-0162",
    phoneHref: "tel:+16315550162",
    email: "commissions@hallockandsons.example",
    address: "41 Montauk Highway, Water Mill, NY 11976",
    /** The license line — rendered wherever trust is being earned. */
    license: "Est. 1962 · Suffolk County licensed builder",
}

/**
 * Weekly hours drive the quote page's hours line (the shared hours
 * engine, `View/Landing/hours.ts`). Minutes since midnight; a day may
 * have several intervals.
 */
export const weeklyHours: DayHours[] = [
    { day: 1, intervals: [[450, 990]] }, // Mon 7:30 AM – 4:30 PM
    { day: 2, intervals: [[450, 990]] },
    { day: 3, intervals: [[450, 990]] },
    { day: 4, intervals: [[450, 990]] },
    { day: 5, intervals: [[450, 900]] }, // Fri 7:30 AM – 3 PM
]

export const hoursNote = "Shop Monday–Friday from 7:30 · Estate visits by appointment"

/** The lanes the firm builds on — the home page's quiet strip. */
export const serviceArea = ["Further Lane", "Sconset Bluff", "Gin Lane"]

/**
 * Landing copy the trade owns: the few strings the landing modules render
 * that would read wrong for a different trade. Remix seeds retrade these
 * along with the rest of the content — everything else in the landing
 * modules is trade-neutral on purpose.
 */
export const landingCopy = {
    /** The home page's services-section heading. */
    servicesHeading: "The work",
    /** The shared nav: page link labels, the CTA, and the logo's line. */
    nav: {
        projects: "The Estates",
        services: "The work",
        about: "The family",
        cta: "Discuss a commission",
        /** Small line under the wordmark; "" for none. */
        tagline: "Est. 1962",
    },
    /** The booking ask on heroes, banners, and the about story. */
    quoteCta: "Discuss a commission",
    home: {
        nowBuildingLabel: "In the shop",
        servicesKicker: "The work",
        transformationsKicker: "Restorations",
        transformationsTitle: "Drag across the same porch",
        testimonialsKicker: "Families",
        serviceAreaLabel: "Estates on",
        bannerTitle: "A house for the next sixty years.",
        bannerBody: "We take on three commissions a year, and begin every one at the kitchen table.",
    },
    projects: {
        headline: "The Estates.",
        subheadline:
            "New estates and careful restorations from Southampton to Sconset, each one built by the family's own crews. Drag a divider across the same house.",
        kicker: "Restorations",
        bannerTitle: "Have a house worth keeping?",
    },
    servicesPage: {
        headline: "The work.",
        subheadline:
            "New shingle-style estates, restorations of old ones, and the millwork that makes both, all from our own shop in Water Mill.",
        kicker: "The work",
        faqKicker: "Before a commission",
        faqTitle: "What families and architects ask",
        bannerTitle: "Planning an estate?",
        bannerBody: `Call ${business.phone} and a Hallock will walk the property with you.`,
    },
    about: {
        kicker: "The family",
        bullets: [business.license, "Three generations, one shop", "Millwork made in Water Mill"],
        credentialsLabel: "Credentials",
        reviewsKicker: "Families",
        reviewsTitle: "From the families",
        bannerTitle: "Discuss a commission.",
    },
    quotePage: {
        kicker: "Commission inquiry",
        title: "The property and the house",
        cta: "Send to Hallock & Sons",
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

/** The feature's photographs, shared by the story and the service cards. */
const estate = {
    porch: photo(
        "feature-porch",
        2400,
        1350,
        "A deep shingled porch with white columns, teak rockers, and blue hydrangeas, looking out over dunes to the sea",
    ),
    shingle: photo(
        "detail-shingle",
        1600,
        1200,
        "Weathered silver-gray cedar shingles meeting a white-painted window casing, close up",
    ),
    newel: photo(
        "detail-newel",
        1600,
        1200,
        "A hand-carved dark oak newel post and turned balusters at the foot of a staircase",
    ),
    elevation: photo(
        "elevation",
        1600,
        900,
        "An engraved ink elevation drawing of a gambrel-roofed shingle-style house with dormers, a long porch, and hydrangeas, on ivory",
    ),
}

const shop = photo(
    "about-shop",
    1600,
    1200,
    "A young carpenter grinning over his shoulder as he planes white oak, his father laughing with a mug nearby",
)

export const projects: Project[] = [
    {
        slug: "sconset-cottage",
        title: "The Sconset cottage",
        location: "Siasconset, Nantucket",
        scope: "Restoration — 14 months",
        description:
            "An 1890s cottage lifted, re-framed, re-shingled in white cedar, and given back its porch, with every original window rebuilt.",
        before: photo(
            "restore-before",
            1600,
            1200,
            "A neglected shingle cottage with dark, rotting shingles, a sagging porch, and overgrown hydrangeas",
        ),
        after: photo(
            "restore-after",
            1600,
            1200,
            "The same cottage restored: crisp white shingles, a rebuilt porch with turned balusters, and hydrangeas in bloom",
        ),
    },
    {
        slug: "sagaponack-kitchen",
        title: "The Sagaponack kitchen",
        location: "Sagaponack",
        scope: "Kitchen & millwork — 5 months",
        description:
            "A dropped ceiling taken out to reveal the beams, and inset painted cabinetry made in our shop around a fireclay sink.",
        before: photo(
            "kitchen-before",
            1600,
            1200,
            "A dated kitchen with a dropped tile ceiling, dark laminate cabinets, and a checkered vinyl floor",
        ),
        after: photo(
            "kitchen-after",
            1600,
            1200,
            "The same kitchen rebuilt: exposed oak beams, white inset cabinetry, a fireclay sink, and wide oak floors",
        ),
    },
]

export const services: Service[] = [
    {
        slug: "new-estates",
        title: "New estates",
        eyebrow: "Build",
        description:
            "Shingle-style houses built from the sill up by our own framers, masons, and finish carpenters.",
        priceNote: "By commission",
        image: estate.porch,
    },
    {
        slug: "restoration",
        title: "Restoration",
        eyebrow: "Restore",
        description:
            "Old houses lifted, re-framed, and re-shingled, with every original detail kept or remade by hand.",
        priceNote: "By commission",
        image: estate.shingle,
    },
    {
        slug: "millwork",
        title: "Millwork",
        eyebrow: "The shop",
        description:
            "Newel posts, paneling, mantels, and cabinetry, carved and joined in our Water Mill shop.",
        priceNote: "By drawing",
        image: estate.newel,
    },
]

/** The trust numbers — the metrics strip. Keep values short and big. */
export const metrics = [
    { value: "1962", label: "the first Hallock house" },
    { value: "3", label: "generations" },
    { value: "140+", label: "estates" },
    { value: "3", label: "commissions a year" },
]

export const testimonials = [
    {
        quote: "My father-in-law had Hallock build this house in 1978. We asked his grandson to add the wing. You cannot see where one ends and the other begins.",
        name: "The Whitcomb family",
        detail: "Further Lane",
    },
    {
        quote: "They argued with me about a porch column for a week. They were right, and I have thanked them every summer since.",
        name: "Thomas Reade",
        detail: "Architect, Gin Lane",
    },
    {
        quote: "Our cottage was a year from falling down. It now looks exactly like the 1904 photograph we found in the attic.",
        name: "Anne and Peter G.",
        detail: "Sconset",
    },
]

/** The shop line — unused on the feature home, so empty. */
export const nowBuilding: string[] = []

export interface BuildLogStep {
    label: string
    title: string
    description: string
    image: SiteImage
    /** More photographs of the same step, set beside the first. */
    frames?: SiteImage[]
}

/** The build log — the feature carries the home page, so empty. */
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

/** The rate card — estates are by commission, so no menu board. */
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

/** The portfolio — the feature and the restorations carry the work, so empty. */
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
    /** The engraved headline over the estate at dawn. */
    headline: "Built to become heirlooms.",
    subheadline:
        "Shingle-style estates and restorations in the Hamptons and on Nantucket, built by the same family since 1962.",
    heroImage: photo(
        "hero-estate",
        2400,
        1350,
        "A gambrel-roofed shingle-style estate at dawn above the dunes, blue hydrangeas in the foreground and sea fog beyond",
    ),
    /** Show each service's `priceNote` under its title in the home grid. */
    servicePrices: true,
    /** The feature carries the home page, so no services grid there. */
    serviceGrid: false,
    hero: {
        /** The title card: the headline over the estate. */
        storefront: false,
        /** No billing line: the badge carries the name. */
        credit: "",
        /** No photo caption. */
        caption: "",
        /** No accent word: the engraving carries it. */
        accent: "none" as "none" | "last-word",
        /** The firm's line over the headline. */
        kicker: "Hallock & Sons · Est. 1962",
        /** No cover lines — the feature follows. */
        coverLines: [] as string[],
        /** No panels: the photograph is the hero. */
        panels: [] as HeroPanel[],
        /** Title-card only: the studio's seal — first line small, the rest large. Empty: none. */
        seal: "",
    },
    /** The home before/after teaser: the Sconset cottage. */
    featuredProjects: [projects[0]] as Project[],
    /** The home metrics strip (empty: the numbers live on the about page). */
    proofMetrics: [] as typeof metrics,
    /** No banner artwork: the closing ask sits on the ivory page. */
    bannerImage: null as SiteImage | null,
}

export interface FeatureFigure {
    /** The small caps title under the detail photograph. */
    title: string
    caption: string
    image: SiteImage
}

/** One estate as a long-form story (content-split `feature`). */
export const feature = {
    kicker: "The Estates · No. 41",
    headline: "Hedges Lane, Amagansett",
    paragraphs: [
        "Set back from the lane and just inland from the ocean, this estate was conceived not for a moment, but for a lineage. Every line of the roof, every dormer, every threshold, was considered with the quiet understanding that a house should improve with time and with the people who come after.",
        "The architecture is classic Hamptons shingle style — cedar shingles weathered to silver-gray, white-painted trim, gambrel roofs that break the skyline gently, and porches turned toward the sea. The materials are restrained and honest: wide-plank oak floors, hand-carved millwork, brass hardware, and stone that feels cool underfoot even in August.",
        "It is a house built for long breakfasts, for summer light that lingers, and for memories that compound.",
    ],
    image: estate.porch as SiteImage | null,
    linkLabel: "",
    pullQuote: "We build the house their grandchildren will argue over.",
    figures: [
        {
            title: "Cedar shingle detail",
            caption:
                "Hand-selected cedar, left to weather naturally. Silver-gray in three seasons, warmer where the sun finds it.",
            image: estate.shingle,
        },
        {
            title: "Hand-carved newel post",
            caption: "Carved from select oak and finished by hand. Details that ask to be touched.",
            image: estate.newel,
        },
    ] as FeatureFigure[],
    plate: estate.elevation as SiteImage | null,
    plateCaption: "Elevation · Hedges Lane, Amagansett",
}

export const about = {
    headline: "Three generations, one shop.",
    photo: shop,
    paragraphs: [
        "Walter Hallock built his first house in Water Mill in 1962, with two carpenters and a truck. His son joined in 1979, his grandsons in 2008, and the shop on Montauk Highway still smells of the same oak.",
        "We take on three commissions a year, so that a Hallock is on every site every week. Our own framers, masons, and finish carpenters build every house; the millwork is carved and joined in our shop and installed by the people who made it.",
        "We build for the long view. Cedar is chosen to weather, oak to wear, and every house is drawn so the next generation can add to it without anyone seeing the seam.",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "Suffolk County licensed builder",
        "Nantucket Historic District approved",
        "Preservation carpentry",
        "Est. 1962",
    ],
}

export const process = {
    kicker: "How a commission begins",
    title: "The kitchen table to the keys",
    steps: [
        {
            title: "The kitchen table",
            description:
                "A Hallock sits down with your family and your architect, and walks the property with you.",
        },
        {
            title: "The drawings",
            description:
                "We price and detail the drawings with your architect, so the house is fixed before it's built.",
        },
        {
            title: "The build",
            description:
                "Our own crews on site, the millwork made in our shop, and a Hallock there every week.",
        },
        {
            title: "The long view",
            description:
                "An annual walk-through for as long as the house stands, and a record of every board we used.",
        },
    ],
}

export const faq = [
    {
        question: "How many commissions do you take?",
        answer: "Three a year. It is the number that lets a member of the family be on every site every week, and it is why we are sometimes booked two seasons out.",
    },
    {
        question: "Do you work with our architect?",
        answer: "Gladly, and often with the same architects for decades. We also draw houses ourselves for families who'd rather work with one firm.",
    },
    {
        question: "Can you restore an old house?",
        answer: "About half our work is restoration. We document every original detail, keep what can be kept, and remake the rest by hand in our shop.",
    },
    {
        question: "Do you build on Nantucket?",
        answer: "Yes. We've built on the island since 1984 and work within the Historic District Commission's guidelines on every project.",
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
 * The shop books two kinds of meeting online: a call with a Hallock and a
 * property visit.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "introduction",
            name: "A call with a Hallock",
            durationMinutes: 30,
            description: "The property, the house, and the timeline — a first conversation.",
        },
        {
            typeId: "property-visit",
            name: "Property visit",
            durationMinutes: 90,
            description: "A Hallock walks the property with you and your architect.",
        },
    ],
    providers: [
        {
            providerId: "william-hallock",
            name: "William Hallock",
            windows: [
                { day: 2, start: 8 * 60, end: 15 * 60 },
                { day: 4, start: 8 * 60, end: 15 * 60 },
            ],
        },
    ],
}

/** The /quote page's booking strip — the slot picker above the form. */
export const booking = {
    headline: "Meet a Hallock",
    intro: "Book a call or a property visit. Pick a time and you'll get a confirmation with a one-click reschedule link. For everything else, write to us below.",
    /** The new/returning select's trade voice (the widget's statusLabels). */
    statusLabels: { new: "First conversation", returning: "We've built together" },
    /** The line under the booking form (the widget's privacyNote). */
    privacyNote:
        "A name and a way to reach you hold the time. Property details stay with the family, and nowhere else.",
}

export const quote = {
    headline: "Discuss a commission.",
    body: "The property, the house you imagine, and your architect if you have one. A Hallock replies personally within two business days.",
    confirmation: "Thank you. A member of the family will reply personally within two business days.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        { name: "phone", label: "Phone", type: "tel" as const },
        { name: "location", label: "Property", placeholder: "The lane and the town" },
        {
            name: "work",
            label: "The work",
            type: "select" as const,
            options: ["A new estate", "A restoration", "An addition", "Millwork"],
            required: true,
        },
        {
            name: "message",
            label: "The house",
            type: "textarea" as const,
            fullWidth: true,
        },
    ],
}
