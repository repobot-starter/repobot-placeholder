/**
 * The interiors-architecture remix's content seed (packs/README.md
 * "Derived templates"): an architecture studio worn over the interiors
 * pack — the remix the base module's landingCopy comment always named.
 * At compose time this file is copied byte-for-byte over
 * `View/Interiors/content.ts`, so it must remain a STRUCTURAL TWIN of
 * that module — the same export surface, the same shapes, the contract's
 * minimums met (tests/View/Interiors/architectureRemixSeed.test.ts pins
 * the twin).
 *
 * The trade: Aldana Architecture, a principal-led architecture studio in
 * Minneapolis, Minnesota. The portfolio stays the projects domain's
 * shape — slug, title, category, location, year, scope, description —
 * but the categories become an architect's shelves (New build, Addition,
 * Renovation, ADU, Commercial), the services become engagement models
 * with honest fee numbers, and the booking books discovery calls and
 * two-hour site consultations against the principal's actual week.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/interiors-architecture` (see PACK.md). The art
 * direction is cool northern daylight on honest materials — timber,
 * board-formed concrete, blackened steel, glass; strong lines, human
 * scale, nothing rendered-looking, nothing staged-empty.
 */

import type { AppointmentsContent } from "../Landing/practiceDocument"
import type { ContentProject } from "../Landing/projectsDocument"

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
        src: `/interiors-architecture/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/interiors-architecture/${name}-${step}w.webp`, width: step })),
    }
}

export const studio = {
    name: "Aldana Architecture",
    /** The architect the brand is built on — bylines, bio, the studio page. */
    principal: "Simone Aldana",
    tagline: "Architecture that belongs where it stands",
    location: "Minneapolis, Minnesota",
    /** Shown everywhere the number appears; `phoneHref` is the tap target. */
    phone: "(612) 555-0147",
    phoneHref: "tel:+16125550147",
    email: "studio@aldanaarchitecture.example",
    address: "219 North 2nd Street, Studio 4, Minneapolis, MN 55401",
    /** The trust line — rendered wherever confidence is being earned. */
    credentialLine: "Licensed architect, MN & WI · AIA member · LEED AP",
}

/**
 * Landing copy the studio's discipline owns: the few strings the landing
 * modules render that would read wrong for a different portfolio practice.
 * This seed retrades them for an architecture studio — everything else in
 * the landing modules is practice-neutral on purpose (the services
 * family's `landingCopy` discipline, packs/README.md "Derived templates").
 */
export const landingCopy = {
    /** The contact ask — the shell's nav CTA and every closing banner. */
    contactCtaLabel: "Start a project",
    /** The home page's featured-work heading. */
    featuredHeading: "Built work",
    /** The home page's services-section heading. */
    servicesHeading: "Three ways to engage the studio",
    /** The portfolio grid's "everything" filter chip. */
    allWorkLabel: "All work",
    /** The closing ask on every page's banner. */
    finalCtaTitle: "Have a site in mind?",
    /** The shell's nav labels for the pack's canonical pages. */
    nav: { portfolio: "Work", services: "Services", about: "Studio" },
}

/**
 * One portfolio project: the contract's owner facts (the `projects`
 * domain shape) plus the code-owned photograph. `inventory.ts` lifts
 * these into contract shape and joins document edits back by slug.
 */
export interface StudioProject extends ContentProject {
    image: SiteImage
}

export const projects: StudioProject[] = [
    {
        slug: "lakeside-passive-house",
        title: "Lakeside Passive House",
        category: "New build",
        location: "Lake Minnetonka",
        year: 2026,
        scope: "New residence — 2,900 sq ft, certified Passive House",
        description:
            "A timber house that heats itself on sun and body warmth through a Minnesota January: glulam frame, triple glazing to the water, and a board-formed concrete hearth holding the center. The mechanical room is a closet.",
        featured: true,
        image: photo(
            "project-lakewood",
            1152,
            864,
            "A timber-clad passive house among birches at the edge of a lake, windows glowing at dusk",
        ),
    },
    {
        slug: "north-loop-workshop",
        title: "North Loop Warehouse Offices",
        category: "Commercial",
        location: "North Loop",
        year: 2025,
        scope: "Adaptive reuse — 14,000 sq ft",
        description:
            "A 1908 warehouse turned working offices without erasing the building that was already there: trusses cleaned and left bare, meeting rooms inserted as glass boxes that touch nothing structural, and the original freight stair kept in service.",
        featured: true,
        image: photo(
            "project-northloop",
            1152,
            864,
            "A renovated brick warehouse interior: heavy timber trusses, a glass meeting-room box, and a black steel stair",
        ),
    },
    {
        slug: "linden-hills-addition",
        title: "Linden Hills Addition",
        category: "Addition",
        location: "Linden Hills",
        year: 2025,
        scope: "Rear addition — 640 sq ft",
        description:
            "A cedar-and-glass volume off the back of a 1926 stucco house — new kitchen, garden room, and a step down to the yard — sized so the original house still reads first from the street. The new defers to the old on purpose.",
        featured: true,
        image: photo(
            "project-lindenhills",
            1152,
            864,
            "A modern cedar and glass rear addition opening to a garden, the original stucco house beside it",
        ),
    },
    {
        slug: "superior-shore-cabin",
        title: "Superior Shore Cabin",
        category: "New build",
        location: "North Shore, Lake Superior",
        year: 2024,
        scope: "Off-grid cabin — 480 sq ft",
        description:
            "One room, one roof plane, one window the size of the wall it lives in — charred-timber cladding against the weather and granite footings that touch the shore lightly. Everything the site needed, nothing it didn't.",
        image: photo(
            "project-superior",
            1152,
            864,
            "A small black-stained timber cabin on a rocky Lake Superior shore under an overcast sky",
        ),
    },
    {
        slug: "kingfield-backyard-studio",
        title: "Kingfield Backyard Studio",
        category: "ADU",
        location: "Kingfield",
        year: 2024,
        scope: "Accessory dwelling — 384 sq ft",
        description:
            "A permitted backyard dwelling in cedar and board-formed concrete under a mature hackberry: a full-glass corner to the garden, a murphy bed wall, and rent that pays its own mortgage. Small, precise, legal.",
        image: photo(
            "project-kingfield",
            1152,
            864,
            "A compact flat-roofed backyard ADU in cedar and concrete with a full-glass corner onto a gravel patio",
        ),
    },
    {
        slug: "mill-district-loft",
        title: "Mill District Loft",
        category: "Renovation",
        location: "Mill District",
        year: 2026,
        scope: "Loft renovation — 2,200 sq ft",
        description:
            "A concrete loft reorganized around one new move: a blackened-steel and white-oak stair to the mezzanine, freeing the window wall for living. The concrete was left to be concrete; the craft went into what touches it.",
        image: photo(
            "project-milldistrict",
            1152,
            864,
            "A renovated loft interior: exposed concrete, a blackened-steel and oak stair, tall factory windows with a city view",
        ),
    },
]

export interface Service {
    slug: string
    title: string
    description: string
    /** "Fees from $48,000" / "$4,500 flat" — honesty over mystery. */
    investment: string
    image: SiteImage
}

export const services: Service[] = [
    {
        slug: "full-architecture",
        title: "Full architectural services",
        description:
            "The whole arc, one architect of record: feasibility, schematic design, permit and construction documents, and construction administration through the final walkthrough. You approve the moves; we defend them through bids, inspections, and weather.",
        investment: "Fees from $48,000",
        image: projects[0].image,
    },
    {
        slug: "additions-renovations",
        title: "Additions & renovations",
        description:
            "The hardest brief in residential work: adding to a house that already has an opinion. Measured drawings of what exists, a design that defers where it should, and documents your contractor can actually build from.",
        investment: "Fees from $18,000",
        image: projects[2].image,
    },
    {
        slug: "feasibility-study",
        title: "Feasibility studies",
        description:
            "Before you buy the lot or commit to the addition: zoning and code review, massing options on the real survey, and a cost range from builders we trust — a straight answer about what's possible, in three weeks.",
        investment: "$4,500 flat, credited if you proceed",
        image: projects[4].image,
    },
]

/** The trust numbers — the metrics strip. Keep values short and big. */
export const metrics = [
    { value: "16", label: "years of practice" },
    { value: "60+", label: "buildings completed" },
    { value: "9", label: "design awards" },
    { value: "100%", label: "of permits approved first round" },
]

export const testimonials = [
    {
        quote: "Simone spent the first meeting walking the shoreline instead of showing us a portfolio. The house she designed heats itself in January, and every window frames something she noticed that day. Our energy bill is a rounding error.",
        name: "Claire & Anders Holt",
        detail: "Lakeside Passive House, Lake Minnetonka",
    },
    {
        quote: "Three developers told us to gut the warehouse. Aldana kept the trusses, the freight stair, and the smell of a real building — and delivered offices our tenants photograph for their own websites. On budget, one change order all project.",
        name: "Marcus Devlin",
        detail: "North Loop Warehouse Offices",
    },
    {
        quote: "The addition is twenty percent smaller than what we asked for, and she was right. From the street you can't tell anything changed; from the kitchen, everything did. The contractor said they were the best drawings he'd built from.",
        name: "Priya & Tom Ellison",
        detail: "Addition, Linden Hills",
    },
]

export const home = {
    headline: "Buildings that belong where they stand.",
    subheadline:
        "An architecture studio in Minneapolis — new houses, additions, and adaptive reuse, taken from feasibility to the final walkthrough by the architect who signed the drawings.",
    heroImage: photo(
        "hero-greatroom",
        1152,
        864,
        "A double-height timber great room with a full window wall to a lake, glulam beams and a concrete hearth",
    ),
}

export const process = {
    kicker: "How a project runs",
    title: "A building is a sequence of decisions",
    steps: [
        {
            title: "Feasibility",
            description:
                "The site walk, the zoning and code review, and massing options on the real survey. You get a written scope, a fee, and a straight answer about what's possible — including no.",
        },
        {
            title: "Schematic design",
            description:
                "Two directions presented in drawings and a physical model, refined to one you'd defend yourself. The big moves get decided here, while changing them still costs nothing.",
        },
        {
            title: "Documents & permits",
            description:
                "Construction documents the trades respect and the city approves — we've never lost a first-round permit review. Bidding support included, with builders we'd stake our name on.",
        },
        {
            title: "Construction administration",
            description:
                "Site visits at the decisive moments, shop-drawing review, and one weekly note that tells you exactly where things stand. The drawings get defended until the building matches them.",
        },
    ],
}

export const about = {
    headline: "An architect who walks the site first.",
    photo: photo(
        "portrait-aldana",
        864,
        1152,
        "Simone Aldana in a black shirt at her studio worktable, a massing model and rolled drawings in front of her",
    ),
    paragraphs: [
        "Simone Aldana opened the studio in 2010 after six years at a large firm doing museum work, where she learned that detail drawings win arguments that opinions lose. The studio's first project was a 384-square-foot backyard studio; the discipline of small budgets — every square foot argued for, every material doing two jobs — still runs through the built work.",
        "The studio's conviction is that a building should belong to its site and its climate before it belongs to a style: passive solar before mechanical heroics, materials that weather instead of fail, and additions that let the original house keep speaking. Renderings are made to test decisions, never to sell them.",
        "It's deliberately a small practice: Simone is the architect of record on every project, with two staff architects behind her. Four or five projects run at a time, which is why the drawings are deep and the permit record is clean — and why the calendar books out a season ahead.",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "Licensed architect, Minnesota & Wisconsin",
        "AIA member · NCARB certified",
        "LEED AP, Building Design + Construction",
        "AIA Minnesota Honor Award, 2025",
    ],
}

export const faq = [
    {
        question: "What does an architect cost?",
        answer: "For full services, most residential projects land between nine and twelve percent of construction cost — from $48,000 on a typical new house — and you'll have a written fee after the feasibility conversation, before any commitment. We'd rather lose a project to honesty than start one on a fantasy budget.",
    },
    {
        question: "Do we need an architect for an addition?",
        answer: "Legally, often not. Practically — an addition has to negotiate with a house that already exists, and that negotiation is the entire job. Our addition clients' most common feedback is that the design got smaller and the rooms got better.",
    },
    {
        question: "How long does a project take?",
        answer: "Feasibility takes three weeks. Design and documents run four to eight months depending on scope; construction is the builder's schedule, with our site visits riding it. A new house started this fall is typically lived in two autumns later — anyone promising faster is skipping something you'll pay for.",
    },
    {
        question: "Do you work outside Minneapolis?",
        answer: "Yes — built work stands in four cities, and the North Shore cabin is three hours from the studio. Past the metro we add travel at cost and cluster site visits around the construction moments that decide whether the building matches the drawings.",
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
 * The studio books two kinds of visit online: the free discovery call and
 * the paid two-hour site consultation. One calendar — Simone takes every
 * first meeting herself.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "discovery-call",
            name: "Discovery call",
            durationMinutes: 20,
            description:
                "A free call about your site, budget, and timeline — and whether we're the right studio.",
        },
        {
            typeId: "site-consultation",
            name: "Site consultation",
            durationMinutes: 120,
            description:
                "Two working hours on your site or in the studio: constraints, options, and a written summary the next day.",
        },
    ],
    providers: [
        {
            providerId: "simone-aldana",
            name: "Simone Aldana",
            windows: [
                { day: 1, start: 13 * 60, end: 17 * 60 },
                { day: 3, start: 9 * 60, end: 13 * 60 },
                { day: 4, start: 13 * 60, end: 17 * 60 },
                { day: 5, start: 9 * 60, end: 15 * 60 },
            ],
        },
    ],
}

/** The /contact page's booking strip — the slot picker above the form. */
export const booking = {
    headline: "Put a first meeting on the calendar",
    intro: "Book a free discovery call or a two-hour site consultation directly — pick a time and you'll get a confirmation with a one-click reschedule link. Prefer to write first? The form below reaches the studio.",
    /** The new/returning select's studio voice (the widget's statusLabels). */
    statusLabels: { new: "New to the studio", returning: "Returning client" },
}

export const contact = {
    headline: "Tell us about the site.",
    body: "A few lines about the project — the site or the house, the timeline, and the budget range you're working with — and the studio will reply within two business days. Honest numbers get honest answers.",
    confirmation:
        "Thank you — your note is in. The studio replies to every inquiry within two business days, usually sooner.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        { name: "phone", label: "Phone", type: "tel" as const },
        {
            name: "project",
            label: "Type of project",
            placeholder: "New build, addition, renovation, ADU …",
        },
        {
            name: "site",
            label: "Site or neighborhood",
            placeholder: "Linden Hills, the North Shore, a lot you're eyeing …",
        },
        {
            name: "budget",
            label: "Budget range",
            placeholder: "$250–500k, $500k–1M, still figuring it out …",
        },
        { name: "timeline", label: "Ideal timing", placeholder: "Break ground next spring, flexible …" },
        {
            name: "message",
            label: "About the project",
            type: "textarea" as const,
            fullWidth: true,
            required: true,
        },
    ],
}
