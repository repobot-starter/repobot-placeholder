/**
 * The Casa Cal remix seed: a complete, drop-in replacement for
 * `./content.ts` that retargets the services pack to Casa Cal, a lime
 * plaster studio in Santa Barbara — limewash, tadelakt, and marmorino by
 * hand. The derived template `repobot-services-painting-casacal` is
 * composed from the services pack with this file copied over `content.ts`,
 * its catalog's clay brand, and the `limewash` register (bone ground,
 * Castoro over Spectral, the room stack captioned inside its photographs).
 *
 * Because the copy is verbatim, this file must stay a structural twin of
 * `content.ts`: same exports, same relative imports, images under its own
 * `/services-painting-casacal/` public directory. The parity tests
 * (`tests/View/Services/restyleRemixSeeds.test.ts`,
 * `casacalRemixSeed.test.ts`) pin the export surface against the real
 * module, so the seed fails CI the moment the pack's contract moves
 * without it.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/services-painting-casacal` (see PACK.md). The `photo`
 * helper mirrors that verb's naming exactly. Never point a slot at a raw
 * camera file.
 *
 * The home is the room stack (`home.stack`): the hero room and every frame
 * at one size, so shoot every room at the same 4:3 and keep the foot of
 * each frame quiet enough for its line. Before/after pairs on the rooms
 * page are shot from the same spot in the same light.
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
        src: `/services-painting-casacal/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({
            src: `/services-painting-casacal/${name}-${step}w.webp`,
            width: step,
        })),
    }
}

export const business = {
    name: "Casa Cal",
    tagline: "Lime plaster studio",
    location: "Santa Barbara, California",
    /** Shown everywhere the number appears; `phoneHref` is the tap target. */
    phone: "(805) 555-0172",
    phoneHref: "tel:+18055550172",
    email: "studio@casacal.example",
    address: "418 E Haley St, Santa Barbara, CA 93101",
    /** The license line — rendered wherever trust is being earned. */
    license: "CSLB Lic. No. 1098423 · C-35 Lathing & Plastering · Insured",
}

/**
 * Weekly hours drive the quote page's hours line. Minutes since midnight;
 * a day may have several intervals. The studio keeps plasterer's hours —
 * early, before the walls warm up — and home visits run on weekdays.
 */
export const weeklyHours: DayHours[] = [
    { day: 1, intervals: [[450, 960]] }, // Mon 7:30 AM – 4 PM
    { day: 2, intervals: [[450, 960]] },
    { day: 3, intervals: [[450, 960]] },
    { day: 4, intervals: [[450, 960]] },
    { day: 5, intervals: [[450, 900]] }, // Fri 7:30 AM – 3 PM
]

export const hoursNote = "Studio open Monday–Friday from 7:30 AM · Home visits by appointment"

/** Where the studio works — the quiet strip. */
export const serviceArea = ["Montecito", "Hope Ranch", "the Riviera", "Mission Canyon", "Carpinteria", "Ojai"]

/**
 * Every string the pages render that isn't a fact about the business:
 * section kickers and titles, the asks, the closing banners — mirrors the
 * base module's `landingCopy` so the landing modules retrade with it.
 */
export const landingCopy = {
    /** The home page's services-section heading. */
    servicesHeading: "Four finishes, all lime.",
    /** The shared nav: page link labels, the CTA, and the logo's line. */
    nav: {
        projects: "Rooms",
        services: "Finishes",
        about: "The studio",
        cta: "Request a visit",
        /** Small line under the wordmark; "" for none. */
        tagline: "",
    },
    /** The quote ask on heroes, banners, and the about story. */
    quoteCta: "Request a visit",
    home: {
        nowBuildingLabel: "On the walls now",
        servicesKicker: "The finishes",
        transformationsKicker: "Before & after",
        transformationsTitle: "The same room, in lime.",
        testimonialsKicker: "From the houses",
        serviceAreaLabel: "Working in",
        bannerTitle: "Consultations in your home. Sample boards made by hand.",
        bannerBody:
            "Cal comes to the house with a case of boards, holds them to your walls in the morning and afternoon light, and leaves you a written estimate.",
    },
    projects: {
        headline: "Rooms, before and after.",
        subheadline:
            "Every pair is the same room from the same spot — the before on the day we measured, the after once the lime had cured. Drag the divider.",
        kicker: "Before & after",
        bannerTitle: "A room you keep walking past?",
    },
    servicesPage: {
        headline: "Every finish, priced plainly.",
        subheadline:
            "Prices are per square foot of wall, prep and two to four coats included. Every estimate is written after a visit and a set of sample boards made for your house.",
        kicker: "The finishes",
        faqKicker: "Before the first coat",
        faqTitle: "What people ask about lime",
        bannerTitle: "Now booking visits for January through March 2027.",
        bannerBody: `Call ${business.phone} or request a visit — the studio replies within two working days.`,
    },
    about: {
        kicker: "The studio",
        bullets: [
            business.license,
            "Natural lime, mineral pigments, no acrylic binders",
            "Sample boards made for every house",
        ],
        credentialsLabel: "Credentials",
        reviewsKicker: "From the houses",
        reviewsTitle: "Rooms people touch on the way past",
        bannerTitle: "Let's hold a board to your wall.",
    },
    quotePage: {
        kicker: "Request a visit",
        title: "The house, the rooms, the light",
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
    /** One line of scope and duration, e.g. "Exterior repaint — 9 days". */
    scope: string
    description: string
    before: SiteImage
    after: SiteImage
}

export const projects: Project[] = [
    {
        slug: "montecito-bath",
        title: "A bath above Butterfly Beach",
        location: "Montecito",
        scope: "Tadelakt in sage, walls and ledge — 12 working days",
        description:
            "A builder's bathroom stripped back to the substrate and rebuilt in sage tadelakt: walls, basin ledge, and window seat polished with river stones and sealed with olive-oil soap, so the whole room sheds water like one carved piece.",
        before: photo(
            "project-bath-before",
            1152,
            864,
            "The bathroom before: flat white painted drywall, a white drop-in sink in a laminate ledge, and blue tape on the window trim",
        ),
        after: photo(
            "room-bath",
            1152,
            864,
            "The same bathroom after: seamless sage-green tadelakt walls and ledge, a carved stone basin, and a brass wall faucet",
        ),
    },
    {
        slug: "riviera-dining",
        title: "The Riviera dining room",
        location: "the Riviera",
        scope: "Marmorino in ochre, four walls — 8 working days",
        description:
            "Beige eggshell over a cracked 1920s wall, repaired and brought back in ochre marmorino — burnished in the last coat so the evening light moves across it.",
        before: photo(
            "project-dining-before",
            1152,
            864,
            "The dining room before: flat beige painted walls with a patched crack and a paint can on the bare table",
        ),
        after: photo(
            "room-dining",
            1152,
            864,
            "The same dining room after: warm ochre marmorino walls behind a set walnut table and an iron sconce",
        ),
    },
]

export const services: Service[] = [
    {
        slug: "limewash",
        title: "Limewash",
        eyebrow: "Walls & stairs",
        description:
            "Slaked lime and earth pigment brushed on in three or four thin coats, crosshatched so the wall clouds as it dries. Breathable, matte, and renewable with a fresh coat years from now.",
        priceNote: "From $9 / sq ft",
        image: photo(
            "room-stair",
            1152,
            864,
            "A bone-white limewash stair hall with a thin wrought-iron balustrade and window light across the wall",
        ),
    },
    {
        slug: "tadelakt",
        title: "Tadelakt",
        eyebrow: "Baths & showers",
        description:
            "The Moroccan lime plaster for wet rooms: troweled, compressed with polishing stones, and sealed with black soap until it holds water off like glazed clay. Walls, ledges, and basins.",
        priceNote: "From $48 / sq ft",
        image: photo(
            "room-bath",
            1152,
            864,
            "A bathroom in sage-green tadelakt with a carved stone basin, a brass faucet, and a potted herb on the ledge",
        ),
    },
    {
        slug: "marmorino",
        title: "Marmorino",
        eyebrow: "Living & dining",
        description:
            "Lime and marble dust laid in fine coats and burnished with the trowel's edge, for a low sheen that deepens as the day goes. Warm in ochre and clay, cool in chalk and stone.",
        priceNote: "From $26 / sq ft",
        image: photo(
            "room-dining",
            1152,
            864,
            "A dining room in ochre marmorino plaster with a walnut table set for dinner and an iron sconce",
        ),
    },
    {
        slug: "sample-boards",
        title: "Sample boards",
        eyebrow: "Color & finish",
        description:
            "Boards made in the studio for your house — each finish in two or three colors, labeled by hand — then held to your walls in the morning and afternoon light before anything is decided.",
        priceNote: "$180, credited to the job",
        image: photo(
            "service-samples",
            1152,
            864,
            "Hands laying out handmade plaster sample boards in terracotta, sage, bone, and ochre on a worn workbench",
        ),
    },
]

/** The trust numbers — the metrics strip. Keep values short and big. */
export const metrics = [
    { value: "410", label: "rooms plastered since 2014" },
    { value: "4", label: "coats on a tadelakt wall" },
    { value: "0", label: "acrylic binders" },
    { value: "2 wk", label: "from boards to first coat" },
]

export const testimonials = [
    {
        quote: "Cal brought nine boards and made us stand in the hallway at four o'clock. The terracotta we'd have never chosen from a chip is the one people ask about every time they come in.",
        name: "Priya & Daniel Okafor",
        detail: "Limewash, Mission Canyon",
    },
    {
        quote: "The shower is one piece of sage stone as far as anyone can tell. It's been a year of daily use and it still beads water like the day they sealed it.",
        name: "Hannah Weiss",
        detail: "Tadelakt, Montecito",
    },
    {
        quote: "They repaired a crack that three painters had papered over, and the ochre wall changes color through dinner. We moved the table so we'd face it.",
        name: "Tomás Herrera",
        detail: "Marmorino, the Riviera",
    },
]

/** What's on the walls right now — the rolling ticker. The stack home leaves it out. */
export const nowBuilding: string[] = []

export interface BuildLogStep {
    /** The short mark on the rail — a month, a phase. */
    label: string
    title: string
    description: string
    image: SiteImage
}

/** The build log — dropped here (empty `steps`). */
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

/** The color deck — dropped here (empty `items`); the sample boards stand in for it. */
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

/** The menu board (pricing `price-list`) — the studio prices each finish on its card, so empty. */
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

/** The journal spread — dropped here (empty `items`). */
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

/** The walk-through sequence — dropped here; the stack home carries the rooms. */
export const walk = {
    kicker: "",
    title: "",
    frames: [] as WalkFrame[],
}

/** One room of the stack home: the photograph and the line written into it ("" for none). */
interface StackFrame {
    image: SiteImage
    caption: string
}

export const home = {
    /** The stack home's first line, written into the hero room. */
    headline: "Walls with weather in them.",
    subheadline:
        "Limewash, tadelakt, and marmorino by hand for houses from Carpinteria to Hope Ranch — every finish mixed in the studio and sampled on your walls first.",
    heroImage: photo(
        "hero-living",
        1152,
        864,
        "A living room with a terracotta limewash wall in dappled sun, an olive tree in a clay pot, a deep arched doorway, and a linen sofa",
    ),
    /** Show each service's `priceNote` under its title in the home grid. */
    servicePrices: true,
    /** Show the home services grid (the stack home has none; the finishes live on /services). */
    serviceGrid: false,
    hero: {
        /** `false`: the title card (the stack home sets its own hero). */
        storefront: false,
        /** Tracked caps closing the hero copy — what and where ("" for none). */
        credit: "",
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
    featuredProjects: [] as Project[],
    /** The home metrics strip (empty: the strip lives on the about page). */
    proofMetrics: [] as typeof metrics,
    /** The closing banner's photograph (null: a plain banner). */
    bannerImage: null as SiteImage | null,
    /**
     * The stack home (servicesLanding.ts `ServicesStack`): the hero room,
     * then each room edge to edge at the hero's size with its line in the
     * foot of the photograph, then the closing line over the visit link.
     */
    stack: {
        frames: [
            {
                image: photo(
                    "room-bath",
                    1152,
                    864,
                    "A bathroom in sage-green tadelakt with a carved stone basin, a brass faucet, and a potted herb on the ledge",
                ),
                caption: "Montecito bath — tadelakt, sage.",
            },
            {
                image: photo(
                    "room-stair",
                    1152,
                    864,
                    "A bone-white limewash stair hall with a thin wrought-iron balustrade and window light across the wall",
                ),
                caption: "Hope Ranch stair — limewash, bone.",
            },
            {
                image: photo(
                    "room-dining",
                    1152,
                    864,
                    "A dining room in ochre marmorino plaster with a walnut table set for dinner and an iron sconce",
                ),
                caption: "Riviera dining room — marmorino, ochre.",
            },
        ] as StackFrame[],
        closing: "Consultations in your home. Sample boards made by hand.",
        closingCta: "Request a visit.",
    },
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
    headline: "Cal learned lime on a scaffold in Oaxaca.",
    photo: photo(
        "about-founder",
        1152,
        864,
        "Inés Calderón laughing as she sweeps a steel trowel across a fresh terracotta limewash wall, a plaster bucket beside her",
    ),
    paragraphs: [
        "Inés Calderón — Cal to everyone on a job — spent two summers restoring a convent's lime walls in Oaxaca before she ever held a hawk board in California. She came home to Santa Barbara, plastered for a restoration crew on the Riviera, and opened Casa Cal in a Haley Street workshop in 2014.",
        "The studio is five people now. Every finish is mixed on the bench from slaked lime, marble dust, and earth pigment, and every house gets its own sample boards before a single wall is touched — because a color that sings in the workshop can go flat in a north-facing room.",
        "Lime breathes, cures harder every year, and takes a fresh coat decades from now. We prep carefully, work in thin coats, and leave you the pigment recipe so the next patch matches.",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "CSLB Lic. No. 1098423",
        "C-35 Lathing & Plastering",
        "Santa Barbara Conservancy member",
        "Fully insured",
    ],
}

export const process = {
    kicker: "How a wall gets lime",
    title: "From the first visit to the last coat",
    steps: [
        {
            title: "A visit to the house",
            description:
                "An hour with Cal, free: the rooms, the light at two times of day, the substrate under the paint, and what the house already wears.",
        },
        {
            title: "Sample boards",
            description:
                "Boards made in the studio for your rooms, held to the walls a week later, with a written estimate per room.",
        },
        {
            title: "Prep, the patient part",
            description:
                "Cracks repaired, surfaces keyed and primed with a mineral base coat, floors and fixtures wrapped.",
        },
        {
            title: "Coats and cure",
            description:
                "Two to four thin coats by hand, burnished or polished for the finish, then left to cure — we walk every room with you once it has.",
        },
    ],
}

export const faq = [
    {
        question: "Can lime go over my painted drywall?",
        answer: "Usually, yes. We key the wall and roll on a mineral primer so the lime has something to grip, then work in thin coats. Glossy or flaking paint gets sanded or stripped first; we'll tell you at the visit which your walls need.",
    },
    {
        question: "Is tadelakt really waterproof in a shower?",
        answer: "Tadelakt is water-resistant, not a membrane: we build the shower on a proper waterproofed substrate and the plaster sheds water on top of it. Polished and soaped well, it beads water like glazed clay. A soap treatment once or twice a year keeps it that way.",
    },
    {
        question: "How long before we can use the room?",
        answer: "Limewash rooms are usable the next day. Marmorino needs a few days before furniture goes back against it. A tadelakt shower wants about three weeks to cure before daily use — we schedule the job around that.",
    },
    {
        question: "Will the color look like the sample?",
        answer: "That's what the boards are for. Lime dries several shades lighter than it goes on, and it reads differently in every light, so we make boards for your rooms and look at them on your walls in the morning and the afternoon before deciding.",
    },
    {
        question: "What about cracks and repairs later?",
        answer: "Lime moves with the house and hairline cracks can be closed with a damp brush and a little fresh lime. We leave you the pigment recipe for every room, so a patch years from now matches.",
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
 * Two kinds of visit: the free home visit and the sample-board review.
 * One provider — Cal makes every first visit herself — with weekday
 * windows inside the studio hours.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "home-visit",
            name: "Home visit",
            durationMinutes: 60,
            description:
                "An hour at the house with Cal, free — the rooms, the light, the walls under the paint, and which finish suits each room.",
        },
        {
            typeId: "board-review",
            name: "Sample-board review",
            durationMinutes: 30,
            description: "Your sample boards held to your walls, then a written estimate room by room.",
        },
    ],
    providers: [
        {
            providerId: "ines-calderon",
            name: "Inés Calderón",
            windows: [
                { day: 1, start: 9 * 60, end: 15 * 60 },
                { day: 2, start: 9 * 60, end: 15 * 60 },
                { day: 3, start: 9 * 60, end: 15 * 60 },
                { day: 4, start: 9 * 60, end: 15 * 60 },
                { day: 5, start: 9 * 60, end: 13 * 60 },
            ],
        },
    ],
}

/** The /quote page's booking strip — the slot picker above the form. */
export const booking = {
    headline: "Book a home visit",
    intro: "Pick a time for a free home visit or, once your boards are made, a sample-board review — you'll get a confirmation with a one-click cancel link. Rather write first? The form below reaches the studio directly.",
    /** The new/returning select's trade voice (the widget's statusLabels). */
    statusLabels: { new: "First house with us", returning: "We've plastered for you before" },
    /** The line under the booking form (the widget's privacyNote). */
    privacyNote:
        "Just a name and a way to reach you. The rooms, the colors, and the walls we'll talk through at the house.",
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
    headline: "Tell us about the rooms.",
    body: "The house, the rooms, the finish you keep thinking about. Cal replies within two working days — and every estimate starts with a free visit.",
    confirmation: "Got it — thank you. Cal reads every request herself and replies within two working days.",
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
            name: "finish",
            label: "Which finish?",
            type: "select",
            options: ["Limewash", "Tadelakt", "Marmorino", "More than one", "Help me choose"],
            required: true,
        },
        {
            name: "rooms",
            label: "Which rooms?",
            type: "select",
            options: ["Living & dining", "Bath or shower", "Stair & hall", "Bedroom", "Exterior", "Several"],
        },
        {
            name: "timing",
            label: "When?",
            type: "select",
            options: ["Winter 2027", "Spring 2027", "Summer 2027", "Not sure yet"],
        },
        {
            name: "message",
            label: "About the rooms",
            type: "textarea",
            placeholder:
                "The light, what's on the walls now, the colors you keep saving — whatever you'd tell a friend.",
            fullWidth: true,
        },
    ] as QuoteField[],
}
