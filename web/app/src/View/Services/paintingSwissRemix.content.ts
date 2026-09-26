/**
 * The painting remix seed: a complete, drop-in replacement for
 * `./content.ts` that retargets the services pack from the coastal
 * builder to Shotgun Color Co., a house painter in New Orleans — same
 * shape, same sections, different trade. The derived template
 * `repobot-services-painting` is composed from the services pack with
 * this file copied over `content.ts`, its catalog's coral brand, and the
 * `paintchip` register (Swiss color-blocking: flat fields edge to edge,
 * huge tight caps, no radius anywhere).
 *
 * Because the copy is verbatim, this file must stay a structural twin of
 * `content.ts`: same exports, same relative imports, images under its own
 * `/services-painting/` public directory. The parity tests
 * (`tests/View/Services/remixSeeds.test.ts`, `paintingRemixSeed.test.ts`)
 * pin the export surface against the real module, so the seed fails CI
 * the moment the pack's contract moves without it.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/services-painting` (see PACK.md). The `photo` helper
 * mirrors that verb's naming exactly. Never point a slot at a raw camera
 * file.
 *
 * Before/after pairs are the pack's proof: shoot both frames from the same
 * spot across the street, in the same light, or the comparison reads as
 * two different houses.
 *
 * The color deck (`palette`) is this trade's signature section: the chips
 * a customer can point at. Keep the chip colors true to the paint — they
 * render as flat fields, and the type on each follows its lightness.
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
        src: `/services-painting-swiss/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({
            src: `/services-painting-swiss/${name}-${step}w.webp`,
            width: step,
        })),
    }
}

export const business = {
    name: "Shotgun Color Co.",
    tagline: "House painting",
    location: "New Orleans, Louisiana",
    /** Shown everywhere the number appears; `phoneHref` is the tap target. */
    phone: "(504) 555-0139",
    phoneHref: "tel:+15045550139",
    email: "paint@shotguncolor.example",
    address: "3021 St Claude Ave, New Orleans, LA 70117",
    /** The license line — rendered wherever trust is being earned. */
    license: "LSLBC Lic. No. 88412 · EPA Lead-Safe Certified Firm · Insured",
}

/**
 * Weekly hours drive the storefront hero's live open/closed badge and the
 * quote page's hours line. Minutes since midnight; a day may have several
 * intervals. The crew starts early to beat the afternoon heat and storms;
 * Sundays the ladders rest.
 */
export const weeklyHours: DayHours[] = [
    { day: 1, intervals: [[420, 960]] }, // Mon 7 AM – 4 PM
    { day: 2, intervals: [[420, 960]] },
    { day: 3, intervals: [[420, 960]] },
    { day: 4, intervals: [[420, 960]] },
    { day: 5, intervals: [[420, 960]] }, // Fri
    { day: 6, intervals: [[480, 720]] }, // Sat 8 AM – noon
]

export const hoursNote = "Shop open Monday–Friday 7 AM–4 PM, Saturday 8 AM–noon · Color walks by appointment"

/** The neighborhoods the crew actually paints in — the home page's quiet strip. */
export const serviceArea = ["Bywater", "Marigny", "Tremé", "Mid-City", "Uptown", "Algiers Point"]

/**
 * Every string the pages render that isn't a fact about the business:
 * section kickers and titles, the asks, the closing banners — mirrors the
 * base module's `landingCopy` so the landing modules retrade with it.
 */
export const landingCopy = {
    /** The home page's services-section heading. */
    servicesHeading: "Outside, inside, and every shutter.",
    /** The shared nav: page link labels, the CTA, and the logo's line. */
    nav: {
        projects: "Houses",
        services: "Services",
        about: "The crew",
        cta: "Get a quote",
        /** Small line under the wordmark; "" for none. */
        tagline: "",
    },
    /** The quote ask on heroes, banners, and the about story. */
    quoteCta: "Pick your color → get a quote",
    home: {
        nowBuildingLabel: "On the ladders now",
        servicesKicker: "What we paint",
        transformationsKicker: "Before & after",
        transformationsTitle: "Same house. Louder.",
        testimonialsKicker: "From the porch",
        serviceAreaLabel: "Painting in",
        bannerTitle: "Your house wants a color.",
        bannerBody:
            "Walk the block with Dolores — an hour, free. She brings the deck, you pick the chips, and you get a written quote with the historic-district paperwork spelled out.",
    },
    projects: {
        headline: "Houses we made loud.",
        subheadline:
            "Every pair is the same house from the same spot across the street — the before on the day we measured, the after on the day the ladders came down. Drag the divider.",
        kicker: "Before & after",
        bannerTitle: "Seen a house you love on your block?",
    },
    servicesPage: {
        headline: "Starting prices, straight.",
        subheadline:
            "Every quote is fixed and written after a color walk: scraping, lead-safe prep, primer, and two full coats included. Rain days move the schedule, never the price.",
        kicker: "What we paint",
        faqKicker: "Before the ladders go up",
        faqTitle: "What New Orleans asks us",
        bannerTitle: "Historic district? Pre-1978? Humid week?",
        bannerBody: `Call ${business.phone} — we'll tell you straight what the rules are for your address and what the job will take.`,
    },
    about: {
        kicker: "The crew",
        bullets: [
            business.license,
            "Lead-safe prep on every pre-1978 house",
            "Two full coats, five-year written warranty",
        ],
        credentialsLabel: "Credentials",
        reviewsKicker: "Neighbors, in their words",
        reviewsTitle: "Houses people slow down for",
        bannerTitle: "Let's pick your color.",
    },
    quotePage: {
        kicker: "Get a quote",
        title: "The house, the colors, the plan",
        cta: "Send it to the shop",
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
    /** One line of scope and duration, e.g. "Exterior repaint — 9 days". */
    scope: string
    description: string
    before: SiteImage
    after: SiteImage
}

export const projects: Project[] = [
    {
        slug: "burgundy-street-single",
        title: "Burgundy Street single",
        location: "Marigny",
        scope: "Exterior repaint in Frenchmen Coral — 9 working days",
        description:
            "A single shotgun gone silver with weather, scraped to sound wood, lead-safe, primed, and brought back in Frenchmen Coral with Bywater Teal shutters and bright-white gingerbread.",
        before: photo(
            "project-marigny-before",
            1600,
            1200,
            "A single shotgun house before painting: weathered, peeling gray-white siding and dull gingerbread trim behind an iron fence",
        ),
        after: photo(
            "project-marigny-after",
            1600,
            1200,
            "The same shotgun house after: coral siding, teal door and shutters, and crisp white gingerbread trim",
        ),
    },
    {
        slug: "governor-nicholls-double",
        title: "Governor Nicholls double",
        location: "Tremé",
        scope: "Exterior restoration in Tremé Lavender — 3 weeks",
        description:
            "A peeling double on Governor Nicholls: rotten trim replaced in kind, the brackets repaired, then Tremé Lavender with Garden District Green shutters — approved by the HDLC on the first review.",
        before: photo(
            "project-treme-before",
            1600,
            1200,
            "A double Creole cottage before painting: bare, peeling gray boards and faded shutters behind an iron fence",
        ),
        after: photo(
            "project-treme-after",
            1600,
            1200,
            "The same double cottage after: soft lavender siding, deep green shutters, and white trim",
        ),
    },
]

export const services: Service[] = [
    {
        slug: "exteriors",
        title: "Exterior repaints",
        eyebrow: "Siding & trim",
        description:
            "Scrape, sand, replace rot in kind, prime bare wood, and two full coats of exterior acrylic — with the trim, gingerbread, and porch ceiling done by hand.",
        priceNote: "From $7,800",
        image: photo(
            "service-exterior",
            1280,
            960,
            "A painter on a ladder rolling coral paint over gray clapboard siding beside a white bracket",
        ),
    },
    {
        slug: "interiors",
        title: "Interiors",
        eyebrow: "Rooms & ceilings",
        description:
            "Plaster repair, twelve-foot ceilings, crown and baseboard — furniture moved and floors covered, and every room left broom-clean the same day.",
        priceNote: "From $650 / room",
        image: photo(
            "service-interior",
            1280,
            960,
            "A tall-ceilinged room with a freshly painted deep teal wall, a stepladder, and a paint tray on drop cloths",
        ),
    },
    {
        slug: "porches-shutters",
        title: "Porches & shutters",
        eyebrow: "Gingerbread included",
        description:
            "Shutters taken down, stripped, and sprayed in the shop; porch floors, rails, and the haint-blue ceiling done while they're away.",
        priceNote: "From $1,900",
        image: photo(
            "service-shutters",
            1280,
            960,
            "A painter in a bandana brushing marigold-yellow paint onto louvered shutters laid across sawhorses",
        ),
    },
    {
        slug: "historic-restoration",
        title: "Historic restoration",
        eyebrow: "Brackets, millwork, HDLC",
        description:
            "Carved brackets, cornices, and millwork repaired or re-made to match, with the historic-district paperwork prepared and filed for you.",
        priceNote: "By color walk",
        image: photo(
            "service-historic",
            1280,
            960,
            "A restorer in a respirator repairing a carved wooden porch bracket under plastic sheeting",
        ),
    },
]

/** The trust numbers — the metrics strip. Keep values short and big. */
export const metrics = [
    { value: "1,140", label: "New Orleans houses painted" },
    { value: "2", label: "full coats on every job" },
    { value: "5 yr", label: "written warranty" },
    { value: "30", label: "years on the same crew's ladders" },
]

export const testimonials = [
    {
        quote: "We wanted coral and were scared of it. Dolores painted three test patches on the porch and stood in the street with us at four o'clock. Now people take pictures of our house on their way to Frenchmen.",
        name: "Keisha & Marcus Lewis",
        detail: "Exterior repaint, Marigny",
    },
    {
        quote: "Our house was built in 1880 and wrapped in about nine layers of lead paint. They tented it, cleaned up every chip, and gave us the paperwork. The lavender went through the HDLC on the first try.",
        name: "Anh Nguyen",
        detail: "Historic restoration, Tremé",
    },
    {
        quote: "It rained on and off for two weeks in June. They never painted a wet board, never charged us a dollar more, and finished the shutters in the shop while they waited.",
        name: "Paul Theriot",
        detail: "Porches & shutters, Bywater",
    },
]

/**
 * What's on the ladders right now — the home page's rolling ticker. This
 * template leads with the color deck instead; empty to drop the section.
 */
export const nowBuilding: string[] = []

export interface BuildLogStep {
    /** The short mark on the rail — a month, a phase. */
    label: string
    title: string
    description: string
    image: SiteImage
}

/** The build log — dropped here (empty `steps`); the color deck leads. */
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

/** The materials board — dropped here (empty `items`). */
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
    /** Optional texture chip set on the swatch. */
    image?: SiteImage
}

/**
 * The color deck — the house colors, as flat chips straight under the
 * hero. Each chip links to the quote page, where the same names are the
 * "Pick your color" choices.
 */
export const palette = {
    kicker: "",
    title: "",
    items: [
        {
            name: "Frenchmen Coral",
            code: "014",
            color: "#f0634e",
            note: "Creole warmth. Made for sun‑days.",
        },
        {
            name: "Bywater Teal",
            code: "027",
            color: "#0e6f73",
            note: "Bold & calm. Bayou soul in every coat.",
        },
        {
            name: "Marigold Heights",
            code: "039",
            color: "#f5a623",
            note: "Joyful. Bright. For porches that pop.",
        },
        {
            name: "Tremé Lavender",
            code: "052",
            color: "#a58bd0",
            note: "Soft history. Strong character.",
        },
        {
            name: "Garden District Green",
            code: "063",
            color: "#1f5b3c",
            note: "Timeless. Deep. New Orleans.",
        },
    ] as Swatch[],
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

/** The menu board (pricing `price-list`) — the painter quotes by the job, so empty. */
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
    headline: "We paint loud houses.",
    subheadline:
        "Exteriors, interiors, porches & shutters — historic approvals handled, lead-safe prep, two full coats.",
    heroImage: photo(
        "hero-shotgun-row",
        2400,
        1800,
        "A row of New Orleans shotgun houses painted coral, teal, lavender, and yellow, with white gingerbread trim and iron fences",
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
        storefront: true,
        /** Tracked caps closing the hero copy — what and where ("" for none). */
        credit: "New Orleans house painting",
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
    featuredProjects: [projects[0]] as Project[],
    /** The home metrics strip (empty: the strip lives on the about page). */
    proofMetrics: [] as typeof metrics,
    /** The closing banner's photograph (null: a plain banner). */
    bannerImage: photo(
        "cta-color-facades",
        2400,
        1350,
        "Close-up of neighboring facades in coral, teal, lavender, and marigold, with a louvered shutter and white trim",
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
    headline: "Dolores has painted this city since 1996.",
    photo: photo(
        "about-founder",
        1600,
        1200,
        "Dolores Guidry in paint-speckled overalls on a teal-columned porch, holding an open fan deck of color chips",
    ),
    paragraphs: [
        "Dolores Guidry grew up in the Seventh Ward watching her uncle paint shotguns the colors the neighbors dared him to. She picked up a brush on his crew in 1996, and after the storm in 2005 she came home to a city that needed every house painted at once.",
        "She opened Shotgun Color Co. in a St. Claude Avenue storefront in 2009. The crew is eight now — prep, brush, and restoration carpenters — and most of them have been on the same ladders for over a decade. Every quote starts with a color walk: Dolores on your sidewalk at four o'clock with the deck, because that's the light your neighbors will see.",
        "We scrape to sound wood, prime what's bare, and put on two full coats — never one thick one. Every pre-1978 house is treated as lead until tested, and the historic-district paperwork is part of the job, not an extra.",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "LSLBC Lic. No. 88412",
        "EPA Lead-Safe Certified Firm",
        "Preservation Resource Center member",
        "Fully insured",
    ],
}

export const process = {
    kicker: "How a house gets loud",
    title: "From the color walk to the last coat",
    steps: [
        {
            title: "Color walk",
            description:
                "An hour on your sidewalk with Dolores and the deck, free: test patches on the house, the late-afternoon light, and what the block already wears.",
        },
        {
            title: "Written quote & approvals",
            description:
                "A fixed price in writing, plus the historic-district paperwork prepared and filed if your address needs it.",
        },
        {
            title: "Prep, the slow part",
            description:
                "Lead-safe containment where the house is pre-1978, then scrape, sand, repair rot in kind, and prime every bare board.",
        },
        {
            title: "Two full coats",
            description:
                "Body, trim, shutters, and doors — two coats each, walked with you before the ladders come down.",
        },
    ],
}

export const faq = [
    {
        question: "Can you paint in this humidity?",
        answer: "Yes — carefully. We check the siding with a moisture meter and don't paint a board wetter than the manufacturer allows, start after the morning dew burns off, and stop early enough that the coat skins before the evening damp. We use acrylics made for Gulf Coast heat, which is also why every job gets two full coats.",
    },
    {
        question: "Do I need approval for my colors?",
        answer: "It depends on the address. In most of the city's historic districts the Historic District Landmarks Commission reviews repairs and materials rather than your paint colors; in full-control districts and landmarks, and in the French Quarter under the Vieux Carré Commission, the work and the colors can need a certificate first. We look up your address, prepare the submission, and walk it through before we set a start date.",
    },
    {
        question: "My house was built before 1978. What about lead paint?",
        answer: "We assume it's there until a test says otherwise. We're an EPA Lead-Safe Certified Firm, so the prep follows the federal Renovation, Repair and Painting rule: containment on the ground and the windows, wet scraping, HEPA vacuums, and a cleaning check before we leave. You get the pamphlet before we start and the records when we're done.",
    },
    {
        question: "What happens when it rains?",
        answer: "The schedule moves; the price doesn't. Quotes are fixed, so a storm day costs you nothing — we shift to the shutters in the shop or to interior work. In hurricane season we take the ladders down and secure the site whenever a storm is forecast.",
    },
    {
        question: "How long will it take?",
        answer: "Most single shotguns take seven to ten working days outside, a double two to three weeks; interiors run about a room a day. Prep is most of the time — the paint goes on fast once the wood is right.",
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
 * Two kinds of visit: the free color walk at the house and an interior
 * estimate. One provider — Dolores walks every house herself — with
 * weekday windows inside the posted shop hours.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "color-walk",
            name: "Color walk",
            durationMinutes: 60,
            description:
                "An hour at your house with Dolores and the deck, free — test patches, the afternoon light, and the historic-district rules for your address.",
        },
        {
            typeId: "interior-estimate",
            name: "Interior estimate",
            durationMinutes: 45,
            description:
                "A walk through the rooms: walls, ceilings, plaster repairs, and trim, measured for a written quote.",
        },
    ],
    providers: [
        {
            providerId: "dolores-guidry",
            name: "Dolores Guidry",
            windows: [
                { day: 1, start: 8 * 60, end: 15 * 60 },
                { day: 2, start: 8 * 60, end: 15 * 60 },
                { day: 3, start: 8 * 60, end: 15 * 60 },
                { day: 4, start: 8 * 60, end: 15 * 60 },
                { day: 5, start: 8 * 60, end: 15 * 60 },
            ],
        },
    ],
}

/** The /quote page's booking strip — the slot picker above the form. */
export const booking = {
    headline: "Book a color walk",
    intro: "Pick a time for a free color walk at the house or an interior estimate — you'll get a confirmation with a one-click cancel link. Rather write first? The form below reaches the shop directly.",
    /** The new/returning select's trade voice (the widget's statusLabels). */
    statusLabels: { new: "First house with us", returning: "We've painted for you before" },
    /** The line under the booking form (the widget's privacyNote). */
    privacyNote:
        "Just a name and a way to reach you. The colors, the permits, and the lead test we'll talk through on the porch.",
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
    headline: "Tell us about the house.",
    body: "The address, the job, the color you can't stop looking at. Dolores replies within two business days — and every quote starts with a free color walk.",
    confirmation:
        "Got it — thank you. Dolores reads every request herself and replies within two business days.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "phone", label: "Phone", type: "tel" },
        {
            name: "address",
            label: "House address",
            placeholder: "Street and neighborhood",
            fullWidth: true,
            required: true,
        },
        {
            name: "project",
            label: "What are we painting?",
            type: "select",
            options: ["Exterior", "Interior", "Porches & shutters", "Historic restoration", "More than one"],
            required: true,
        },
        {
            name: "color",
            label: "Pick your color",
            type: "select",
            options: [
                ...palette.items.map((swatch) => `${swatch.name} ${swatch.code}`),
                "Help me choose",
                "Keep my current colors",
            ],
        },
        {
            name: "historic",
            label: "Historic district?",
            type: "select",
            options: ["Yes — HDLC district", "French Quarter (Vieux Carré)", "No", "Not sure"],
        },
        {
            name: "built",
            label: "Built before 1978?",
            type: "select",
            options: ["Yes", "No", "Not sure"],
        },
        {
            name: "message",
            label: "About the house",
            type: "textarea",
            placeholder:
                "Single or double, camelback or not, the shutters, the porch — whatever you'd tell a neighbor.",
            fullWidth: true,
        },
    ] as QuoteField[],
}
