/**
 * The interiors-architecture-aokifarrow remix's content seed (packs/README.md
 * "Derived templates"): a New York architecture practice worn over the
 * interiors pack as a monograph. At compose time this file is copied
 * byte-for-byte over `View/Interiors/content.ts`, so it must remain a
 * STRUCTURAL TWIN of that module — the same export surface, the same
 * shapes, the contract's minimums met
 * (tests/View/Interiors/aokifarrowRemixSeed.test.ts pins the twin).
 *
 * The practice: Aoki Farrow Architects, eleven people on Lafayette Street
 * in NoHo, led by Mika Aoki and Julian Farrow — townhouses in the Village
 * and Brooklyn Heights, loft conversions in Tribeca and Dumbo, a tower
 * penthouse on Madison Square, a gallery on Bond Street. The portfolio
 * stays the projects domain's shape; `home.monograph` switches the home
 * to the monograph: the featured work as numbered plates, the West 11th
 * Street house told as a feature, the index of every work.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/interiors-architecture-aokifarrow`. The art direction is
 * monograph photography: straight verticals, raking daylight, limestone,
 * brick, blackened steel, white oak and plaster, all 4:3; people-light but
 * lived-in; the plan in black line on white.
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
        src: `/interiors-architecture-aokifarrow/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({
            src: `/interiors-architecture-aokifarrow/${name}-${step}w.webp`,
            width: step,
        })),
    }
}

export const studio = {
    name: "Aoki Farrow",
    /** The architect the brand is built on — bylines, bio, the studio page. */
    principal: "Mika Aoki",
    tagline: "Architecture for the houses New York already has",
    location: "Lafayette Street, New York",
    /** Shown everywhere the number appears; `phoneHref` is the tap target. */
    phone: "(212) 555-0183",
    phoneHref: "tel:+12125550183",
    email: "office@aokifarrow.example",
    address: "436 Lafayette Street, Fourth Floor, New York, NY 10003",
    /** The trust line — rendered wherever confidence is being earned. */
    credentialLine: "Registered architects, New York State · AIA New York · LPC-experienced",
}

/**
 * Landing copy the practice owns: the few strings the landing modules
 * render that would read wrong for a different portfolio practice.
 */
export const landingCopy = {
    /** The contact ask — the shell's nav CTA and every closing banner. */
    contactCtaLabel: "Write to the studio",
    /** The home page's featured-work heading. */
    featuredHeading: "Selected work",
    /** The home page's services-section heading. */
    servicesHeading: "Three kinds of commission",
    /** The portfolio grid's "everything" filter chip. */
    allWorkLabel: "All work",
    /** The closing ask on every page's banner. */
    finalCtaTitle: "New commissions for 2027, by introduction or by letter.",
    /** The shell's nav labels for the pack's canonical pages. */
    nav: { portfolio: "Work", services: "Practice", about: "Studio" },
    /** The wordmark's second line in the nav ("" for none). */
    navTagline: "",
    heroAccent: "none" as HeroAccent,
    /** The home hero's portfolio ask. */
    heroCtaLabel: "The work",
    /** Section kickers the builders set over the content's own headings. */
    kickers: {
        featured: "Selected work",
        services: "Commissions",
        testimonials: "A client",
        portfolio: "Index",
        offerings: "The practice",
        about: "The studio",
        credentials: "Recognition",
    },
    /** The home page's closing-banner line (the `gallery` layout's close). */
    homeBannerBody:
        "Townhouses, lofts and the occasional tower — one or two new houses a year, by introduction.",
    portfolioHero: {
        headline: "Every building, with its year.",
        subheadline:
            "Townhouses in the Village and Brooklyn Heights, lofts in Tribeca and Dumbo, a penthouse on Madison Square and a gallery on Bond Street — filter by the kind of building.",
    },
    offeringsHero: {
        headline: "Three kinds of commission.",
        subheadline:
            "The townhouse renovation, the loft or apartment made whole, and the new commission from its first feasibility study — each with its fee stated before the first drawing.",
    },
    /** The offerings page's closing-banner line. */
    offeringsBannerBody:
        "An hour at the studio or at the house, before any fee — to see whether the building and the practice suit each other.",
    faqHeading: { kicker: "Fair questions", title: "Asked before every commission" },
    /** The about page's testimonials heading. */
    testimonialsTitle: "What living in the work is like",
    /** The /contact form's heading and submit label. */
    inquiry: { kicker: "Or write first", title: "A letter to the studio", cta: "Send the letter" },
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
        slug: "franklin-street-loft",
        title: "Franklin Street Loft",
        category: "Loft",
        location: "Tribeca",
        year: 2025,
        scope: "Loft conversion, 4,800 sq ft",
        description:
            "The fourth floor of an 1861 cast-iron store building, returned to one room: fourteen Corinthian columns stripped to their casting, the pine floor planed rather than replaced, and a single travertine island set on the building's centerline so the kitchen reads as furniture in a hall.",
        featured: true,
        image: photo(
            "franklin-loft",
            2400,
            1800,
            "A white cast-iron loft in Tribeca with fluted columns and arched windows, a couple laughing at a travertine island",
        ),
    },
    {
        slug: "madison-square-penthouse",
        title: "Madison Square Penthouse",
        category: "Penthouse",
        location: "Flatiron",
        year: 2026,
        scope: "Penthouse interior, 5,600 sq ft",
        description:
            "A glass tower's top floor given a floor that steps: a sunken room in limestone under the Flatiron Building's prow, oak walls that hide every door, and glazing left clear of mullions so the park reads as the fourth wall.",
        featured: true,
        image: photo(
            "madison-penthouse",
            2400,
            1800,
            "A penthouse living room with a sunken limestone seating area and oak walls, the Flatiron Building and Madison Square Park beyond the glass",
        ),
    },
    {
        slug: "water-street-library",
        title: "Water Street Library",
        category: "Loft",
        location: "Dumbo",
        year: 2024,
        scope: "Warehouse loft, 3,900 sq ft",
        description:
            "A coffee-roasting warehouse under the Manhattan Bridge fitted with one wall of white oak shelving for eleven thousand books, a rolling ladder on a bronze rail, and the steel window left exactly as the roasters had it.",
        featured: true,
        image: photo(
            "dumbo-library",
            2400,
            1800,
            "A warehouse loft with a steel-framed window onto the Manhattan Bridge and a wall of oak bookshelves, one person on a rolling ladder",
        ),
    },
    {
        slug: "pierrepont-street-parlor",
        title: "Pierrepont Street Parlor",
        category: "Townhouse",
        location: "Brooklyn Heights",
        year: 2025,
        scope: "Parlor floor restoration, 1,400 sq ft",
        description:
            "The parlor of an 1848 brownstone, the plaster cornice and ceiling rose recast from the one bay that survived, the herringbone floor relaid, and the pocket doors rehung so the two rooms open into one for the piano.",
        featured: true,
        image: photo(
            "heights-parlor",
            1600,
            1200,
            "A restored brownstone parlor with a plaster cornice, tall windows, and two people laughing at a grand piano",
        ),
    },
    {
        slug: "west-11th-street",
        title: "West 11th Street House",
        category: "Townhouse",
        location: "Greenwich Village",
        year: 2026,
        scope: "Full renovation, 5,200 sq ft",
        description:
            "An 1846 Greek Revival row house opened from the garden to the roof: a limestone stair under a new rooflight, a rear facade rebuilt in steel windows the Landmarks Commission approved on first review, and a kitchen that steps straight into the garden.",
        image: photo(
            "west-11th-garden",
            2400,
            1800,
            "The rear brick facade of a Village townhouse with tall black steel windows over a garden and a birch tree, a father carrying a toddler on his shoulders",
        ),
    },
    {
        slug: "bond-street-gallery",
        title: "Bond Street Gallery",
        category: "Gallery",
        location: "NoHo",
        year: 2024,
        scope: "Gallery and mezzanine, 3,100 sq ft",
        description:
            "A double-height room behind a cast-iron front on Bond Street: the concrete floor ground to a matte finish, a blackened-steel stair and mezzanine hung from the party wall, and nothing on the walls that the art has to compete with.",
        image: photo(
            "bond-gallery",
            1600,
            1200,
            "A double-height white gallery with a blackened steel stair and mezzanine, a pale sculpture on a plinth and two visitors talking",
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
    /** The one-line promise the `catalog` home's numbered strip sets under the title. */
    tagline?: string
}

export const services: Service[] = [
    {
        slug: "townhouse-renovation",
        title: "Townhouse renovation",
        description:
            "The whole house, garden to roof: measured drawings of what stands, the Landmarks Commission and the Department of Buildings, construction documents the trades can price, and construction administration until the last door is hung. A townhouse is two years of decisions; the practice stays for all of them.",
        investment: "Fees from $120,000, or 12% of construction",
        image: projects[4].image,
    },
    {
        slug: "lofts-and-apartments",
        title: "Lofts & apartments",
        description:
            "A floor of a building made whole: the board approvals, the alteration agreement, the plumbing that has to cross a neighbor's ceiling, and the millwork drawn to the sixteenth. Lofts where the building's own structure becomes the architecture; apartments where it is hidden completely.",
        investment: "Fees from $140,000",
        image: projects[0].image,
    },
    {
        slug: "new-commission",
        title: "New commissions",
        description:
            "Before you buy the building: a feasibility study on the real zoning lot, the landmark district's precedents, massing in a basswood model, and a construction range from builders we have worked with for a decade — a straight answer about what the building can become, in four weeks.",
        investment: "Feasibility $18,000, credited if you proceed",
        image: projects[5].image,
    },
]

/** The trust numbers — the metrics strip. Keep values short and big. */
export const metrics = [
    { value: "2012", label: "the studio opens on Lafayette Street" },
    { value: "41", label: "buildings completed" },
    { value: "19", label: "landmark approvals, none on appeal" },
    { value: "11", label: "architects and designers" },
]

export const testimonials = [
    {
        quote: "We asked for a kitchen and they asked us where the afternoon light landed. The house now turns toward the garden at four o'clock, and our daughter reads on the stair every day under a rooflight we didn't know we needed.",
        name: "Hannah Leigh & Tomás Ferreira",
        detail: "West 11th Street House, Greenwich Village",
    },
    {
        quote: "Julian found a drawing of our building from 1861 in a municipal archive and used it to argue for every column. The board approved the alteration in one meeting. The loft looks like it was always meant to be one room.",
        name: "Noor Haddad",
        detail: "Franklin Street Loft, Tribeca",
    },
    {
        quote: "Eleven thousand books, one wall, and a ladder that runs on bronze. They measured every shelf against the books we actually own, which is the most flattering thing anyone has ever done for us.",
        name: "Owen Marsh & Idris Bello",
        detail: "Water Street Library, Dumbo",
    },
]

export const home = {
    layout: "gallery" as HomeLayout,
    headline: "Architecture for the houses New\u00a0York already has.",
    subheadline:
        "Aoki Farrow is an eleven-person practice in NoHo. Townhouses, lofts and the occasional tower floor, drawn from the first survey to the last hinge by the two architects whose names are on the door.",
    heroImage: photo(
        "hero-west-11th-stair",
        2400,
        1800,
        "A limestone stair rising under a rooflight in a white Village townhouse, black steel balusters, a girl reading on the steps",
    ),
    /** The monograph home: the featured work as plates, one project as a feature, the index of works. */
    monograph: {
        heroCaption:
            "Plate 00 — West 11th Street, Greenwich Village. The new stair, under a rooflight cut through four floors.",
        feature: {
            kicker: "Feature — West 11th Street House, 2026",
            headline: "A row house opened from the garden to the roof.",
            body: "The house was built in 1846 for a ship's chandler and had been cut into five apartments by 1931. By the time Hannah Leigh and Tomás Ferreira bought it, the stair had been boxed in twice and the garden could only be reached through a boiler room. The brief was one line long: make it a house again.\n\nThe move that did it was taking the stair out. Its replacement is limestone, set against the party wall and lit from a rooflight cut through four floors, so the house now has a spine of daylight from the garden level up. The Landmarks Commission approved the rebuilt rear facade, eight bays of steel windows on the original brick openings, on its first review.\n\nThe kitchen sits a step above the garden and opens onto it completely. Everything else was restored rather than invented.",
            pullQuote:
                "The stair had been boxed in twice. We took it out and let the light fall four floors.",
            spread: photo(
                "feature-kitchen",
                2400,
                1350,
                "A white oak kitchen whose steel doors fold open onto an ivy-walled garden, a woman sitting on the counter laughing with a man leaning in the doorway",
            ),
            figures: [
                {
                    image: photo(
                        "detail-rail",
                        1024,
                        768,
                        "A child's hand sliding along a curved bronze handrail over hand-forged balusters and limestone steps",
                    ),
                    title: "The upper flight",
                    caption:
                        "Bronze rail, forged balusters, and treads cut from one Indiana limestone block.",
                },
                {
                    image: photo(
                        "detail-window",
                        1024,
                        768,
                        "A blackened steel window with a brass lever set into old red brick, the garden blurred beyond",
                    ),
                    title: "The garden windows",
                    caption: "Steel sections set into the 1846 brick openings, each lever cast in brass.",
                },
            ],
            plate: {
                image: photo(
                    "plan-garden-level",
                    1600,
                    1200,
                    "An architectural floor plan of the townhouse garden level: stair, kitchen, and the garden with its tree",
                ),
                caption: "Garden level, 1:100 — the stair, the kitchen, and the garden it opens onto.",
            },
        },
        indexKicker: "Index",
        indexTitle: "The work, 2014–2026",
        closing: "New commissions for 2027, by introduction or by letter.",
        closingCta: "Write to the studio",
        portfolioClosing: "The drawings for each of these are kept at the studio, and we show them gladly.",
    },
}

/** Which home composition the pack renders (see the base content.ts header). */
export type HomeLayout = "catalog" | "gallery"

/** Where each hero headline takes the accent color (the kernel's accent placements). */
export type HeroAccent = "last-word" | "first-word" | "none" | "full-stop"

/** The `catalog` home's before-and-after case files — unused by the monograph. */
export const caseStudies = {
    kicker: "",
    title: "",
    befores: [] as { slug: string; image: SiteImage }[],
}

/** The `catalog` home's catalog of pieces — unused by the monograph. */
export const pieces = {
    kicker: "",
    title: "",
    items: [] as { number: string; name: string; meta: string; description: string; image: SiteImage }[],
}

/** The fee board — empty, so /offerings keeps its commissions, process, and questions. */
export const fees = {
    kicker: "",
    title: "",
    intro: "",
    groups: [] as {
        heading: string
        items: { name: string; note?: string; price: string; qualifier?: string }[]
    }[],
    footnote: "",
}

export const process = {
    kicker: "How a commission runs",
    title: "Survey, argument, drawings, building",
    steps: [
        {
            title: "Survey",
            description:
                "Measured drawings of the building as it stands, a morning in the municipal archive, and a written account of what the landmark district will and won't allow. You receive a fee in writing before anything is designed.",
        },
        {
            title: "Argument",
            description:
                "Two directions in drawings and a basswood model, argued out at the studio table until one of them is obviously right. The big moves are settled here, while changing them still costs nothing.",
        },
        {
            title: "Drawings & approvals",
            description:
                "Construction documents the trades can price without guessing, and the approvals from the Landmarks Commission, the Department of Buildings and, where there is one, the board. Nineteen landmark approvals so far, none on appeal.",
        },
        {
            title: "Building",
            description:
                "Site visits at every decisive moment, shop drawings checked against the model, and a note every Friday on exactly where things stand. The practice stays until the last hinge is hung.",
        },
    ],
}

export const about = {
    headline: "Two architects, one table, eleven people.",
    photo: photo(
        "principals",
        1600,
        1200,
        "Mika Aoki and Julian Farrow laughing over a basswood model of a townhouse at the studio table, drawings spread around it",
    ),
    paragraphs: [
        "Mika Aoki and Julian Farrow met at a large firm drawing museum wings and left in 2012 to work on the buildings New York already had. The studio's first commission was a single parlor floor on Pierrepont Street; the practice has returned to Brooklyn Heights six times since.",
        "The conviction is that a good renovation should look inevitable — as if the house had always meant to be this way. That means archives before sketches, models before renderings, and details drawn at full size. Renderings are made to test a decision, never to sell one.",
        "The studio stays small on purpose. Eleven people, five or six commissions at a time, and a principal on every site visit, which is why the calendar books a season ahead and why commissions arrive mostly by introduction.",
    ],
    /** The content-split's bullet list beside the story. */
    bullets: [
        studio.credentialLine,
        "A principal at every site meeting, on every commission",
        "Five or six commissions at a time, by design",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "AIA New York Design Award, 2026",
        "Architectural Record — Record Houses, 2025",
        "The Village Preservation Award, 2024",
        "Registered architects, New York State",
    ],
}

export const faq = [
    {
        question: "What does an architect cost in New York?",
        answer: "For a full townhouse renovation, fees run between twelve and fifteen percent of construction; lofts and apartments start at $140,000. You will have the number in writing after the survey, before any design begins.",
    },
    {
        question: "Our house is in a landmark district. Is that a problem?",
        answer: "It is the ordinary case. Nineteen of our commissions have gone through the Landmarks Commission, none on appeal. We prepare the application as an argument about the building's history, not a request for permission, and it usually reads that way.",
    },
    {
        question: "How long does a townhouse take?",
        answer: "The survey takes four weeks. Design and approvals take eight to twelve months; construction takes fourteen to twenty. A house started this winter is usually lived in two summers later. Anyone promising faster is leaving something out.",
    },
    {
        question: "Do you work outside New York?",
        answer: "Occasionally — a house in the Hudson Valley and one in Litchfield County are in construction now. Past the city we add travel at cost and cluster site visits around the decisions that matter.",
    },
]

/**
 * The appointments contract's code fallback — visit types x weekly
 * availability windows, projected into concrete capacity-1 slots by
 * `generateAppointmentSlots`. The catalog's `content.appointments` seed
 * mirrors this export exactly (the remix-seed tests pin the twin).
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "studio-hour",
            name: "An hour at the studio",
            durationMinutes: 60,
            description:
                "An hour at the Lafayette Street table with a principal: the building, the brief, and the budget.",
        },
        {
            typeId: "house-visit",
            name: "A visit to the house",
            durationMinutes: 120,
            description:
                "Two hours walking the building with a principal, and a written note on what it could become the week after.",
        },
    ],
    providers: [
        {
            providerId: "mika-aoki",
            name: "Mika Aoki",
            windows: [
                { day: 2, start: 9 * 60, end: 13 * 60 },
                { day: 4, start: 14 * 60, end: 18 * 60 },
            ],
        },
        {
            providerId: "julian-farrow",
            name: "Julian Farrow",
            windows: [
                { day: 1, start: 14 * 60, end: 18 * 60 },
                { day: 3, start: 9 * 60, end: 13 * 60 },
            ],
        },
    ],
}

/** The /contact page's booking strip — the slot picker above the form. */
export const booking = {
    headline: "Begin with an hour",
    intro: "Book an hour at the studio or a visit to the house with one of the principals — pick a time and you'll receive a confirmation with a one-click reschedule link. Prefer to write first? The letter below reaches both of them.",
    /** The new/returning select's studio voice (the widget's statusLabels). */
    statusLabels: { new: "New to the studio", returning: "A returning client" },
}

export const contact = {
    headline: "Tell us about the building.",
    body: "A few lines about the building — the address or the neighborhood, what it is now, and what you hope it becomes — and one of the principals will reply within three working days.",
    confirmation:
        "Thank you — your letter is with the studio. One of the principals replies to every letter within three working days.",
    /** The `catalog` home's consultation form heading — unused by the monograph. */
    consultation: { kicker: "", title: "", body: "", cta: "" },
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        { name: "phone", label: "Phone", type: "tel" as const },
        {
            name: "project",
            label: "The building",
            placeholder: "A townhouse, a loft, a floor of a building …",
        },
        {
            name: "site",
            label: "Address or neighborhood",
            placeholder: "West Village, Brooklyn Heights, Tribeca …",
        },
        {
            name: "budget",
            label: "Construction budget",
            placeholder: "$1.5–3M, $3–6M, still forming …",
        },
        { name: "timeline", label: "Timing", placeholder: "Closing this spring, moving in 2028 …" },
        {
            name: "message",
            label: "About the building",
            type: "textarea" as const,
            fullWidth: true,
            required: true,
        },
    ],
}
