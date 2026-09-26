/**
 * The services-contractor-meridian remix's content seed (packs/README.md
 * "Derived templates"): a coastal residential builder worn over the
 * services pack. At compose time this file is copied byte-for-byte over
 * `View/Services/content.ts`, so it must remain a STRUCTURAL TWIN of that
 * module — the same export surface, the same shapes, the contract's
 * minimums met (tests/View/Services/groupOneRemixSeeds.test.ts pins the
 * twin).
 *
 * The trade: Meridian Coastal, a Malibu builder of oceanfront residences.
 * The home page is a masthead — the name set wide across the top, the
 * coast it builds on in one ruled line — over a bluff-top residence in
 * full bleed, then the residences on a sideways rail with their square
 * footage and year, three numbers, one design story (the vanishing-edge
 * pool) beside its photograph, and a ruled closing ask. Projects become
 * before-and-after comparisons of the builds, and the quote form becomes
 * the private inquiry.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/services-contractor-meridian` (see PACK.md). The art
 * direction is late Pacific light — white board-formed concrete, teak,
 * glass, and water meeting the horizon — never a person in frame except
 * on site.
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
        src: `/services-contractor-meridian/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({
            src: `/services-contractor-meridian/${name}-${step}w.webp`,
            width: step,
        })),
    }
}

export const business = {
    name: "Meridian Coastal",
    tagline: "Coastal residences",
    location: "Malibu, California",
    /** Shown everywhere the number appears; `phoneHref` is the tap target. */
    phone: "(310) 555-0126",
    phoneHref: "tel:+13105550126",
    email: "inquiries@meridiancoastal.example",
    address: "23410 Civic Center Way, Suite C4, Malibu, CA 90265",
    /** The license line — rendered wherever trust is being earned. */
    license: "CA licensed general contractor No. 1048211",
}

/**
 * Weekly hours drive the quote page's hours line (the shared hours
 * engine, `View/Landing/hours.ts`). Minutes since midnight; a day may
 * have several intervals.
 */
export const weeklyHours: DayHours[] = [
    { day: 1, intervals: [[480, 1020]] }, // Mon 8 AM – 5 PM
    { day: 2, intervals: [[480, 1020]] },
    { day: 3, intervals: [[480, 1020]] },
    { day: 4, intervals: [[480, 1020]] },
    { day: 5, intervals: [[480, 960]] }, // Fri 8 AM – 4 PM
]

export const hoursNote = "Studio Monday–Friday · Site visits by appointment"

/** Where the residences stand — the credentials-style strip. */
export const serviceArea = ["Malibu", "Santa Monica", "Pacific Palisades", "Topanga", "Point Dume"]

/**
 * Landing copy the trade owns: the few strings the landing modules render
 * that would read wrong for a different trade. Remix seeds retrade these
 * along with the rest of the content — everything else in the landing
 * modules is trade-neutral on purpose.
 */
export const landingCopy = {
    /** The home page's services-section heading. */
    servicesHeading: "Practice",
    /** The shared nav: page link labels, the CTA, and the logo's line. */
    nav: {
        projects: "Residences",
        services: "Practice",
        about: "Studio",
        cta: "Inquire",
        /** Small line under the wordmark; "" for none. */
        tagline: "",
    },
    /** The booking ask on heroes, banners, and the about story. */
    quoteCta: "Schedule a private inquiry",
    home: {
        nowBuildingLabel: "On site",
        servicesKicker: "Practice",
        transformationsKicker: "Site to residence",
        transformationsTitle: "Drag across the same bluff",
        testimonialsKicker: "Clients",
        serviceAreaLabel: "Residences in",
        bannerTitle: "Begin a residence",
        bannerBody: "Two residences break ground each year.",
    },
    projects: {
        headline: "Residences.",
        subheadline:
            "Oceanfront houses from the bluff to the sand, each one designed with its architect and built by our own crews. Drag a divider: the site, then the residence.",
        kicker: "Site to residence",
        bannerTitle: "Have a site on the coast?",
    },
    servicesPage: {
        headline: "One builder, from bluff to keys.",
        subheadline:
            "Preconstruction, coastal permitting, engineering, construction, and care after, under one contract and one superintendent.",
        kicker: "Practice",
        faqKicker: "Before a residence",
        faqTitle: "What owners and architects ask",
        bannerTitle: "Considering a site?",
        bannerBody: `Call ${business.phone} to walk the site with a principal before you buy.`,
    },
    about: {
        kicker: "Studio",
        bullets: [
            business.license,
            "Coastal Commission permitting in-house",
            "One superintendent, start to keys",
        ],
        credentialsLabel: "Credentials",
        reviewsKicker: "Clients",
        reviewsTitle: "Owners and architects",
        bannerTitle: "Begin a residence.",
    },
    quotePage: {
        kicker: "Private inquiry",
        title: "The site and the house",
        cta: "Send the inquiry",
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

/** The residences, shared by the rail and the practice cards. */
const residences = {
    carbon: photo(
        "res-carbon",
        1600,
        1200,
        "A low white residence with a cantilevered roof and a long lap pool running toward the beach at dusk",
    ),
    paradise: photo(
        "res-paradise",
        1600,
        1200,
        "A dark-framed glass pavilion with an infinity pool facing a headland at sunset",
    ),
    palisades: photo(
        "res-palisades",
        1600,
        1200,
        "A terraced white residence on a cliff edge with a cantilevered pool above the surf",
    ),
    rustic: photo(
        "res-rustic",
        1600,
        1200,
        "A teak-soffited pavilion and reflecting pool among sycamores in a canyon",
    ),
}

const pool = photo(
    "feature-pool",
    1600,
    1200,
    "A vanishing-edge pool lined up with the Pacific horizon beside a travertine terrace and two teak loungers",
)

const site = photo(
    "about-site",
    1600,
    1200,
    "Three builders laughing over drawings at a plank table on a bluff-top site, the ocean glowing behind them",
)

export const projects: Project[] = [
    {
        slug: "palisades-bluff",
        title: "The Palisades Bluff",
        location: "Pacific Palisades",
        scope: "New residence — 26 months",
        description:
            "Caissons forty feet into the bluff, a steel frame, and a pool cantilevered past the edge so the water meets the horizon.",
        before: photo(
            "build-before",
            1600,
            1200,
            "A bluff-top site mid-construction: board-formed concrete walls and an open steel frame above the ocean",
        ),
        after: photo(
            "build-after",
            1600,
            1200,
            "The same site finished: a white two-story residence with glass walls and a pool facing the ocean",
        ),
    },
    {
        slug: "carbon-beach-remodel",
        title: "Carbon Beach living room",
        location: "Malibu",
        scope: "Structural remodel — 11 months",
        description:
            "A 1970s beach house opened to the water: steel moment frames, a forty-foot glass wall, and white oak underfoot.",
        before: photo(
            "remodel-before",
            1600,
            1200,
            "A gutted room with exposed wood studs and a concrete floor, the ocean visible through the open frame",
        ),
        after: photo(
            "remodel-after",
            1600,
            1200,
            "The same room finished: a floor-to-ceiling glass wall to the ocean, a plaster fireplace, and a white sofa",
        ),
    },
]

export const services: Service[] = [
    {
        slug: "new-residences",
        title: "New residences",
        eyebrow: "Build",
        description:
            "Ground-up houses on bluffs, beaches, and canyons, built with your architect by our own crews.",
        priceNote: "By consultation",
        image: residences.palisades,
    },
    {
        slug: "preconstruction",
        title: "Preconstruction & permitting",
        eyebrow: "Before ground",
        description:
            "Site feasibility, geology, Coastal Commission approvals, and a fixed budget before the first caisson.",
        priceNote: "Fixed fee",
        image: site,
    },
    {
        slug: "pools-and-landscape",
        title: "Pools & terraces",
        eyebrow: "Water",
        description: "Vanishing-edge pools engineered with the structure, aligned to the horizon by survey.",
        priceNote: "By consultation",
        image: pool,
    },
    {
        slug: "residence-care",
        title: "Residence care",
        eyebrow: "After keys",
        description:
            "Salt, wind, and sun maintenance for every house we build, scheduled for as long as you own it.",
        priceNote: "Annual agreement",
        image: residences.carbon,
    },
]

/** The trust numbers — the metrics strip. Keep values short and big. */
export const metrics = [
    { value: "41", label: "Residences" },
    { value: "0.6", label: "Mi of Pacific frontage" },
    { value: "26", label: "Months average build" },
]

export const testimonials = [
    {
        quote: "Meridian built the house we drew, on a bluff three other builders walked away from, within a month of the schedule they gave us.",
        name: "The Hartwell family",
        detail: "The Palisades Bluff",
    },
    {
        quote: "As an architect, I care about one thing: the shadow line at the pool's edge. Meridian surveyed it to a sixteenth. It disappears.",
        name: "Elena Vasquez, AIA",
        detail: "Architect, Paradise Cove",
    },
    {
        quote: "They still come every spring to check the glass and the teak. Five years in, the house looks like the day we moved in.",
        name: "David and Ruth K.",
        detail: "Carbon Beach",
    },
]

/** The site line — unused on the masthead home, so empty. */
export const nowBuilding: string[] = []

export interface BuildLogStep {
    label: string
    title: string
    description: string
    image: SiteImage
    /** More photographs of the same step, set beside the first. */
    frames?: SiteImage[]
}

/** The build log — the residences carry the home page, so empty. */
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

/** The rate card — residences are quoted privately, so no menu board. */
export const priceMenu = {
    kicker: "",
    title: "",
    intro: "",
    groups: [] as PriceMenuGroup[],
    footnote: "",
}

export interface LookbookItem {
    name: string
    /** Square footage and year. */
    meta: string
    description: string
    /** The portfolio's filter chips. */
    tags: string[]
    image: SiteImage
    /** The column a directory groups the item under; the lookbook's eyebrow. */
    group?: string
}

/** The residences — the home page's sideways rail and the portfolio's first grid. */
export const lookbook = {
    kicker: "Residences",
    title: "",
    items: [
        {
            name: "Carbon Beach",
            meta: "7,400 sq ft · 2025",
            description: "A single long volume on the sand, the pool running to the tide line.",
            tags: ["Beach"],
            image: residences.carbon,
        },
        {
            name: "Paradise Cove",
            meta: "6,800 sq ft · 2025",
            description: "A glass pavilion under a steel roof, framed on the headland.",
            tags: ["Bluff"],
            image: residences.paradise,
        },
        {
            name: "The Palisades Bluff",
            meta: "8,100 sq ft · 2026",
            description: "Three terraces stepping down the cliff, the pool past the edge.",
            tags: ["Bluff"],
            image: residences.palisades,
        },
        {
            name: "Rustic Canyon",
            meta: "7,200 sq ft · 2026",
            description: "Teak and board-formed concrete among the sycamores.",
            tags: ["Canyon"],
            image: residences.rustic,
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
    /** The masthead: the name alone, set wide. */
    headline: "Meridian",
    subheadline:
        "Oceanfront residences in Malibu, Santa Monica, and Pacific Palisades — designed with your architect, built by our own crews.",
    heroImage: photo(
        "hero-bluff",
        2400,
        1350,
        "A white bluff-top residence with glass walls and an infinity pool above the Pacific coastline at golden hour",
    ),
    /** Show each service's `priceNote` under its title in the home grid. */
    servicePrices: true,
    /** The residences carry the offer on home, so no services grid there. */
    serviceGrid: false,
    hero: {
        /** The masthead over the bluff. */
        storefront: false,
        /** The ruled coast line under the name. */
        credit: "Coastal residences · Malibu · Santa Monica · Pacific Palisades",
        /** No photo caption. */
        caption: "",
        /** The name stays whole. */
        accent: "none" as "none" | "last-word",
        /** No kicker over the name. */
        kicker: "",
        /** No cover lines. */
        coverLines: [] as string[],
        /** No panels: the photograph is the hero. */
        panels: [] as HeroPanel[],
        /** Title-card only: the studio's seal — first line small, the rest large. Empty: none. */
        seal: "",
    },
    /** The home before/after teaser: the bluff. */
    featuredProjects: [projects[0]] as Project[],
    /** The home metrics strip: the three numbers under the residences. */
    proofMetrics: metrics,
    /** No banner artwork: the closing ask is a ruled line. */
    bannerImage: null as SiteImage | null,
}

export interface FeatureFigure {
    /** The small caps title under the detail photograph. */
    title: string
    caption: string
    image: SiteImage
}

/** One design story beside its photograph (content-split `media-left`). */
export const feature = {
    kicker: "Design",
    headline: "Pools engineered to disappear",
    paragraphs: [
        "Vanishing-edge pools align with the Pacific, creating a seamless threshold between architecture and ocean.",
    ],
    image: pool as SiteImage | null,
    linkLabel: "Explore the details",
    pullQuote: "",
    figures: [] as FeatureFigure[],
    plate: null as SiteImage | null,
    plateCaption: "",
}

export const about = {
    headline: "Builders of the edge.",
    photo: site,
    paragraphs: [
        "Meridian Coastal was founded in 2004 by two superintendents who had spent a decade building other people's houses on the Malibu bluffs and knew exactly what the ocean does to a bad detail.",
        "We take on two new residences a year. Each is run by one superintendent from the first caisson to the keys, built by our own concrete, steel, and finish crews, and engineered with the architect rather than around them.",
        "The coast is the client, too. Every house is permitted through the Coastal Commission in-house, set back from the bluff edge by survey, and built to outlast the salt.",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "CA licensed general contractor No. 1048211",
        "Coastal Commission permitting",
        "Caisson & shoring certified",
        "Bonded & insured",
    ],
}

export const process = {
    kicker: "How a residence is built",
    title: "Site to keys",
    steps: [
        {
            title: "The site walk",
            description:
                "A principal walks the land with you and your architect: geology, setbacks, views, and access.",
        },
        {
            title: "Preconstruction",
            description:
                "Engineering, permitting, and a fixed budget, agreed before a single caisson is drilled.",
        },
        {
            title: "The build",
            description:
                "One superintendent and our own crews, with a weekly site report and a photograph of every pour.",
        },
        {
            title: "Keys and care",
            description:
                "A walkthrough, a binder of every finish, and an annual visit for as long as you own the house.",
        },
    ],
}

export const faq = [
    {
        question: "How long does a residence take?",
        answer: "Twenty-six months on average from permit to keys, and permitting on the coast adds nine to eighteen months before that. We schedule both honestly from the first meeting.",
    },
    {
        question: "Do you work with our architect?",
        answer: "Always. We join during design to price and engineer the drawings, so the house that gets built is the house that was drawn.",
    },
    {
        question: "Can you build on a bluff?",
        answer: "That is most of our work. Caissons, shoring, and drainage are designed with the geologist, and every house is set back from the edge by survey.",
    },
    {
        question: "How many projects do you take on?",
        answer: "Two new residences a year, plus structural remodels for owners of houses we already know. It keeps a principal on every site every week.",
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
 * The studio books two kinds of meeting online: an introductory call and
 * a site walk with a principal.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "introduction",
            name: "Introductory call",
            durationMinutes: 30,
            description: "The site, the architect, and the timeline — a first conversation with a principal.",
        },
        {
            typeId: "site-walk",
            name: "Site walk",
            durationMinutes: 90,
            description: "A principal walks the land with you: geology, setbacks, views, and access.",
        },
    ],
    providers: [
        {
            providerId: "james-okafor",
            name: "James Okafor",
            windows: [
                { day: 1, start: 9 * 60, end: 16 * 60 },
                { day: 3, start: 9 * 60, end: 16 * 60 },
            ],
        },
        {
            providerId: "claire-lindgren",
            name: "Claire Lindgren",
            windows: [
                { day: 2, start: 9 * 60, end: 16 * 60 },
                { day: 4, start: 9 * 60, end: 16 * 60 },
            ],
        },
    ],
}

/** The /quote page's booking strip — the slot picker above the form. */
export const booking = {
    headline: "Meet a principal",
    intro: "Book an introductory call or a site walk. Pick a time and you'll get a confirmation with a one-click reschedule link. For everything else, send a private inquiry below.",
    /** The new/returning select's trade voice (the widget's statusLabels). */
    statusLabels: { new: "First conversation", returning: "We've built together" },
    /** The line under the booking form (the widget's privacyNote). */
    privacyNote:
        "A name and a way to reach you hold the time. Site addresses and drawings stay with the principals, and nowhere else.",
}

export const quote = {
    headline: "A private inquiry.",
    body: "The site, the architect, and the timeline you have in mind. A principal replies personally within two business days.",
    confirmation: "Thank you. A principal will reply personally within two business days.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        { name: "phone", label: "Phone", type: "tel" as const },
        { name: "location", label: "Site", placeholder: "Neighborhood, or the address if you have one" },
        {
            name: "stage",
            label: "Where you are",
            type: "select" as const,
            options: ["Considering a site", "Site purchased", "In design", "Permitted", "Remodel"],
            required: true,
        },
        { name: "architect", label: "Architect", placeholder: "If you've chosen one" },
        {
            name: "message",
            label: "The house",
            type: "textarea" as const,
            fullWidth: true,
        },
    ],
}
