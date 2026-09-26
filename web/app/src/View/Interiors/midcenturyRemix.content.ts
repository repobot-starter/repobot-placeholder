/**
 * The interiors-midcentury remix's content seed (packs/README.md
 * "Derived templates"): a Palm Springs designer who restores and
 * furnishes mid-century houses, worn over the interiors pack. At compose
 * time this file is copied byte-for-byte over `View/Interiors/content.ts`,
 * so it must remain a STRUCTURAL TWIN of that module — the same export
 * surface, the same shapes, the contract's minimums met
 * (tests/View/Interiors/midcenturyRemixSeed.test.ts pins the twin).
 *
 * The portfolio is contract-shaped on purpose: `projects` mirrors the
 * business-content contract's `projects` domain
 * (web/app/src/View/Landing/projectsDocument.ts) — slug, title,
 * category, location, year, scope, description, featured — so an owner's
 * Manage edit and this file walk the same rendering path. The taxonomy
 * is the `category` field: the portfolio grid derives its filter chips
 * from whatever categories the entries carry (`projectCategories`), so
 * minting a new shelf is adding a word, never touching a component.
 * Photographs stay code-owned and join back in BY REFERENCE via `slug`
 * (`inventory.ts`) — the contract moves words, never bytes.
 *
 * `home.layout` picks the home page's composition: `catalog` (this
 * studio's) opens on the split cover and runs the numbered services
 * strip, the before-and-after case files, the catalog of pieces, the
 * process, the fees, the questions, and the consultation form; `gallery`
 * is the photo-led stack — the masthead hero, the featured-work rail, the
 * service tiles, and a closing banner. Sections a layout doesn't use
 * (`caseStudies`, `pieces`, `fees`) can stay empty.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/interiors-midcentury` (see PACK.md). The art direction is desert
 * light on real mid-century materials — walnut, terrazzo, breeze block,
 * wool; no brand-name furniture, no staged-empty showrooms.
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
        src: `/interiors-midcentury/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/interiors-midcentury/${name}-${step}w.webp`, width: step })),
    }
}

export const studio = {
    name: "Nadia Farouk Interiors",
    /** The designer the brand is built on — bylines, bio, the about page. */
    principal: "Nadia Farouk",
    tagline: "Mid-century houses, lived in properly",
    location: "Palm Springs, California",
    /** Shown everywhere the number appears; `phoneHref` is the tap target. */
    phone: "(760) 555-0162",
    phoneHref: "tel:+17605550162",
    email: "studio@nadiafaroukinteriors.example",
    address: "1650 S Palm Canyon Drive, Suite 4, Palm Springs, CA 92264",
    /** The trust line — rendered wherever confidence is being earned. */
    credentialLine: "NCIDQ certified · Historic-review experienced in five desert cities",
}

/**
 * Landing copy the studio's discipline owns: the few strings the landing
 * modules render that would read wrong for a different portfolio practice
 * (an architect, a landscape studio). A remix seed retrades these along
 * with the rest of the content — everything else in the landing modules
 * is practice-neutral on purpose (the services family's `landingCopy`
 * discipline, packs/README.md "Derived templates").
 */
export const landingCopy = {
    /** The contact ask — the shell's nav CTA and every closing banner. */
    contactCtaLabel: "Start a project",
    /** The home page's featured-work heading. */
    featuredHeading: "The case notes",
    /** The home page's services-section heading. */
    servicesHeading: "Three ways to work together",
    /** The portfolio grid's "everything" filter chip. */
    allWorkLabel: "All projects",
    /** The closing ask on every page's banner. */
    finalCtaTitle: "Got a house with good bones?",
    /** The shell's nav labels for the pack's canonical pages. */
    nav: { portfolio: "Projects", services: "Services", about: "Studio" },
    /** The wordmark's second line in the nav ("" for none). */
    navTagline: "Palm Springs",
    heroAccent: "full-stop" as HeroAccent,
    /** The home hero's portfolio ask. */
    heroCtaLabel: "See the projects",
    /** Section kickers the builders set over the content's own headings. */
    kickers: {
        featured: "Case notes",
        services: "Services",
        testimonials: "From the clients",
        portfolio: "The projects",
        offerings: "Services",
        about: "The studio",
        credentials: "Credentials",
    },
    /** The home page's closing-banner line (the `gallery` layout's close). */
    homeBannerBody:
        "A whole house, one tired kitchen, or a condo that needs its furniture — the first walk-through is free.",
    portfolioHero: {
        headline: "Houses, before and after.",
        subheadline:
            "Post-and-beam renovations, kitchens and baths put back the way the architect meant them, and condos furnished from the warehouse — filter by the kind of project you're planning.",
    },
    offeringsHero: {
        headline: "Three ways in. Honest fees.",
        subheadline:
            "Full renovations for the whole arc, furnishing for houses that are built but bare, and vintage sourcing by the hour — one flat design fee, quoted once, and no markup on furniture.",
    },
    /** The offerings page's closing-banner line. */
    offeringsBannerBody:
        "Book the free walk-through — forty-five minutes in the house, a flat fee in writing within the week.",
    faqHeading: { kicker: "Fair questions", title: "Asked before every project" },
    /** The about page's testimonials heading. */
    testimonialsTitle: "What working together is like",
    /** The /contact form's heading and submit label. */
    inquiry: { kicker: "Or write first", title: "The project inquiry", cta: "Send the inquiry" },
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
        slug: "twin-palms-eichler",
        title: "Twin Palms Eichler",
        category: "Full renovation",
        location: "Twin Palms",
        year: 2025,
        scope: "Whole-house renovation — 1,900 sq ft, 1959",
        description:
            "An atrium house that had been carpeted, popcorned, and ceiling-fanned into a tract home. The beams came back into the light, the walnut paneling was stripped and oiled, and a long teal sofa now faces the pool the way the architect planned it.",
        featured: true,
        image: photo(
            "project-eichler",
            1152,
            864,
            "A restored post-and-beam living room: exposed timber beams, walnut paneling, floor-to-ceiling glass onto a courtyard, a long teal sofa on a striped wool rug",
        ),
    },
    {
        slug: "vista-alexander",
        title: "Vista Las Palmas Alexander",
        category: "Full renovation",
        location: "Vista Las Palmas",
        year: 2026,
        scope: "Whole-house renovation — 1,650 sq ft, 1961",
        description:
            "A butterfly-roof house returned to its clerestories: the 1980s soffits came out, terrazzo went down, and a burnt-orange sofa and a tulip table let the mountain do the rest of the decorating.",
        featured: true,
        image: photo(
            "project-alexander",
            1152,
            864,
            "A butterfly-roof living room with clerestory windows and a timber ceiling, a burnt-orange sofa, a white pedestal dining table, terrazzo floors, and palms beyond the glass",
        ),
    },
    {
        slug: "racquet-club-condo",
        title: "Racquet Club Condo",
        category: "Furnishing",
        location: "Racquet Club Road",
        year: 2025,
        scope: "Furnishing & vintage sourcing — 2-bedroom condo",
        description:
            "A snowbird condo that came with recliners and a peach wall-to-wall. Six weeks of sourcing later: mustard barrel chairs, a shag rug the color of a desert sunset, and a walnut wall unit that finally holds the owner's records.",
        featured: true,
        image: photo(
            "project-racquet",
            1152,
            864,
            "A furnished condo living room: two mustard barrel chairs on a burnt-orange shag rug, a walnut wall unit, and sliding glass onto a tennis court and palms",
        ),
    },
    {
        slug: "rancho-mirage-ranch",
        title: "Rancho Mirage Ranch House",
        category: "Kitchens & baths",
        location: "Rancho Mirage",
        year: 2024,
        scope: "Kitchen & dining — 12 weeks",
        description:
            "A ranch-house kitchen with oak cabinets, a glass dinette, and a view it was ignoring. Olive lacquer uppers, walnut below, three orange pendants, and a long walnut table set square on the window to the desert.",
        featured: true,
        image: photo(
            "project-ranch",
            1152,
            864,
            "A renovated ranch-house kitchen: olive-green upper cabinets, walnut base cabinets, three orange pendant lights over a walnut dining table, and a wide window onto the desert",
        ),
    },
    {
        slug: "vista-las-palmas-bath",
        title: "Vista Las Palmas Primary Bath",
        category: "Kitchens & baths",
        location: "Vista Las Palmas",
        year: 2025,
        scope: "Primary bath — 7 weeks",
        description:
            "The bath the house deserved in 1962: teal tile in a stack bond, a floating walnut vanity with two basins, a round mirror, and a clerestory full of palm fronds.",
        image: photo(
            "project-vlp-bath",
            1152,
            864,
            "A mid-century bathroom with teal stack-bond tile, a floating walnut double vanity, a round mirror, globe sconces, and a clerestory window with palm fronds",
        ),
    },
    {
        slug: "movie-colony-guest-house",
        title: "Movie Colony Guest House",
        category: "Furnishing",
        location: "Movie Colony",
        year: 2026,
        scope: "Furnishing — guest house, 1 bedroom",
        description:
            "A casita furnished in eleven days for a family that hosts all season: a walnut bed with a rust coverlet, an abstract print from a Cathedral City estate sale, and a breeze-block view worth waking up to.",
        image: photo(
            "project-moviecolony",
            1152,
            864,
            "A guest bedroom with a walnut bed and rust coverlet, a teal ceramic lamp, an abstract mid-century print, and sliding glass onto a breeze-block garden wall and citrus tree",
        ),
    },
]

export interface Service {
    slug: string
    title: string
    description: string
    /** "Investments from $25,000" / "$450 flat" — honesty over mystery. */
    investment: string
    image: SiteImage
    /** The one-line promise the `catalog` home's numbered strip sets under the title. */
    tagline?: string
}

export const services: Service[] = [
    {
        slug: "full-renovations",
        title: "Full renovations",
        tagline: "Spaces that work for how you live",
        description:
            "The whole arc for a mid-century house: measured drawings, historic-review packages, contractor coordination, finishes, lighting, and furniture — one flat design fee, quoted once, before anything is torn out.",
        investment: "Flat design fee from $18,000",
        image: projects[0].image,
    },
    {
        slug: "furnishing",
        title: "Furnishing",
        tagline: "Pieces that age with character",
        description:
            "For houses that are built but bare: a furnishing plan room by room, new pieces where new is better, vintage where it isn't, and an install day that ends with the art hung and the lamps on.",
        investment: "Flat fee from $3,200 a room",
        image: projects[2].image,
    },
    {
        slug: "vintage-sourcing",
        title: "Vintage sourcing",
        tagline: "Well-chosen. Well-placed. Well-loved.",
        description:
            "The hunt, by the hour: estate sales, dealers, and auctions from Palm Springs to Pasadena, condition reports before you commit, restoration managed, and every piece billed at what we paid — with the receipt.",
        investment: "$165 an hour, logged",
        image: photo(
            "service-sourcing",
            1152,
            864,
            "A sunlit vintage furniture warehouse: rows of walnut chairs and tables, a mustard sofa, pottery lamps on a shelf, and a workbench with restoration tools",
        ),
    },
]

/** The trust numbers — the metrics strip. Keep values short and big. */
export const metrics = [
    { value: "11", label: "years in the desert" },
    { value: "86", label: "mid-century houses" },
    { value: "1,400+", label: "vintage pieces placed" },
    { value: "0%", label: "markup on furniture" },
]

export const testimonials = [
    {
        quote: "Nadia found the house under forty years of good intentions. The beams, the paneling, the way the living room is supposed to meet the pool — it was all still there. She just knew where to look, and what to leave alone.",
        name: "Priya & Ben Castellanos",
        detail: "Whole-house renovation, Twin Palms",
    },
    {
        quote: "We gave her a condo full of recliners and a budget, and six weeks later we had a place our friends ask to borrow. Every piece came with a condition report and the receipt. Nothing was marked up. Nobody does that.",
        name: "Walt Imura",
        detail: "Furnishing & sourcing, Racquet Club Road",
    },
    {
        quote: "Historic review scared us more than the demolition. Nadia had the package drawn, the photographs taken, and the committee nodding before we'd finished worrying about it.",
        name: "Dolores Achebe-Reyes",
        detail: "Renovation, Vista Las Palmas",
    },
]

/** Which home composition the pack renders (see the file header). */
export type HomeLayout = "catalog" | "gallery"

/** Where each hero headline takes the accent color (the kernel's accent placements). */
export type HeroAccent = "last-word" | "first-word" | "none" | "full-stop"

export const home = {
    layout: "catalog" as HomeLayout,
    headline: "Rooms with a good attitude.",
    subheadline: "Interior design in Palm Springs, rooted in mid-century modern.",
    heroImage: photo(
        "hero-pit",
        2400,
        1800,
        "A sunken conversation-pit living room: mustard built-in seating with burnt-orange cushions around a walnut coffee table, a leather lounge chair, a breeze-block screen, and a pool and mountains beyond the glass",
    ),
}

/**
 * The `catalog` home's case files: before-and-after pairs for the
 * FEATURED projects, joined by slug — the featured flag picks the
 * houses; each "before" is shot from the "after" frame's exact angle.
 */
export const caseStudies = {
    kicker: "Case files",
    title: "Before. After. Same house.",
    befores: [
        {
            slug: "twin-palms-eichler",
            image: photo(
                "project-eichler-before",
                1152,
                864,
                "The same living room before: a dropped white ceiling hiding the beams, beige carpet, vertical blinds, a brown leather sofa, and a boxy television",
            ),
        },
        {
            slug: "vista-alexander",
            image: photo(
                "project-alexander-before",
                1152,
                864,
                "The same room before: the clerestories boxed in, beige carpet, a gray sectional, a dark dining set, and heavy curtains",
            ),
        },
        {
            slug: "racquet-club-condo",
            image: photo(
                "project-racquet-before",
                1152,
                864,
                "The same condo before: two floral recliners on maroon carpet, peach walls, vertical blinds, and a television in a white cabinet",
            ),
        },
        {
            slug: "rancho-mirage-ranch",
            image: photo(
                "project-ranch-before",
                1152,
                864,
                "The same kitchen before: honey-oak cabinets, a rooster-tile backsplash, a glass dinette with wrought-iron chairs, and a brass chandelier",
            ),
        },
    ] as { slug: string; image: SiteImage }[],
}

/**
 * The `catalog` home's catalog of pieces: what's in the warehouse right
 * now, numbered like the old furniture catalogs. `number` is the item's
 * catalog number; `meta` its materials and price.
 */
export const pieces = {
    kicker: "The warehouse",
    title: "A catalog of pieces, in stock and restored",
    items: [
        {
            number: "No. 101",
            name: "Molded lounge chair & ottoman",
            meta: "rosewood ply, black leather — $4,800",
            description: "Late-fifties pattern, new cushions, original shock mounts checked and replaced.",
            image: photo(
                "piece-lounge-chair",
                864,
                1152,
                "A molded plywood lounge chair and ottoman in black leather on a terrazzo floor",
            ),
        },
        {
            number: "No. 114",
            name: "Starburst chandelier",
            meta: "brass, twelve arms — $2,150",
            description: "Rewired, UL-listed sockets, brass cleaned but not polished bright.",
            image: photo(
                "piece-sputnik",
                864,
                1152,
                "A brass starburst chandelier with twelve arms and bare bulbs over a walnut sideboard",
            ),
        },
        {
            number: "No. 122",
            name: "Cane-front credenza",
            meta: "walnut, woven cane — $3,400",
            description: "Sixty-six inches, sliding doors, the cane replaced by hand in the original weave.",
            image: photo(
                "piece-credenza",
                864,
                1152,
                "A walnut credenza with woven cane sliding doors and tapered legs, a mustard vase on top",
            ),
        },
        {
            number: "No. 137",
            name: "Fiberglass shell chair",
            meta: "sage fiberglass, wire base — $690",
            description: "Original gelcoat, no cracks at the mounts, on a new-old-stock wire base.",
            image: photo(
                "piece-shell-chair",
                864,
                1152,
                "A sage-green fiberglass shell chair on a black wire base against a warm plaster wall",
            ),
        },
        {
            number: "No. 145",
            name: "Scandinavian rya rug",
            meta: "hand-knotted wool, 5 × 7 ft — $1,950",
            description:
                "Mustard, olive, teal, and rust in the circles-and-squares pattern; professionally washed.",
            image: photo(
                "piece-rya-rug",
                864,
                1152,
                "A hand-knotted rya rug in mustard, olive, teal, and rust circles and squares, draped over a walnut bench",
            ),
        },
        {
            number: "No. 158",
            name: "Drip-glaze pottery lamp",
            meta: "stoneware, linen shade — $820",
            description:
                "California studio pottery, teal and rust drip glaze, rewired with a new linen drum.",
            image: photo(
                "piece-pottery-lamp",
                864,
                1152,
                "A stoneware table lamp in teal and rust drip glaze with a linen drum shade on a walnut side table",
            ),
        },
    ],
}

/**
 * The fee board: one flat design fee, quoted once, and sourcing by the
 * hour — the studio's honesty about money, set as a price list.
 */
export const fees = {
    kicker: "Honest fees",
    title: "Flat for the design. Hourly for the hunt.",
    intro: "Every project starts with a free walk-through and a written flat fee. Furniture is billed at cost, with receipts.",
    groups: [
        {
            heading: "Design — flat, quoted once",
            items: [
                {
                    name: "Full renovation",
                    note: "Drawings, historic review, finishes, lighting, furniture plan — to 2,500 sq ft",
                    qualifier: "from",
                    price: "$18,000",
                },
                {
                    name: "Kitchen or bath",
                    note: "Full drawing set, cabinetry and tile specification, four site visits",
                    qualifier: "from",
                    price: "$7,500",
                },
                {
                    name: "Furnishing plan",
                    note: "Per room: layout, new and vintage selections, an install day",
                    price: "$3,200",
                },
            ],
        },
        {
            heading: "Sourcing — hourly, logged",
            items: [
                {
                    name: "Vintage sourcing",
                    note: "Estate sales, dealers, auctions; condition reports before you commit",
                    price: "$165 / hr",
                },
                {
                    name: "Restoration management",
                    note: "Upholstery, refinishing, rewiring — quotes approved by you",
                    price: "$165 / hr",
                },
                {
                    name: "Design consultation",
                    note: "Two hours in the house, decisions in the room, notes the next day",
                    price: "$450",
                },
            ],
        },
    ],
    footnote: "No markup on furniture, ever. Pieces are billed at what we paid, with the receipt attached.",
}

export const process = {
    kicker: "How a project runs",
    title: "Four steps, one flat fee, no surprises",
    steps: [
        {
            title: "The walk-through",
            description:
                "Forty-five minutes in the house, free: what's original, what's salvageable, what's hiding under the carpet — and how you actually want to live in it.",
        },
        {
            title: "The plan & the fee",
            description:
                "A written scope and one flat design fee within the week. Measured drawings follow, with the historic-review package if the house needs one.",
        },
        {
            title: "Build & hunt",
            description:
                "The trades build to drawings they respect while the sourcing runs in parallel — every find photographed, condition-reported, and approved by you before it's bought.",
        },
        {
            title: "Install day",
            description:
                "Everything lands on one day: furniture placed, art hung, lamps wired, records shelved. You come home to a finished house, not a punch list.",
        },
    ],
}

export const about = {
    headline: "A designer who reads the house first.",
    photo: photo(
        "portrait-nadia",
        864,
        1152,
        "Nadia Farouk in a mustard sweater and olive trousers, seated on a walnut cabinet in front of a white breeze-block screen, holding a fabric swatch book",
    ),
    paragraphs: [
        "Nadia Farouk came to the desert in 2015 from a decade of restoration work in Los Angeles, where she learned the unglamorous parts of mid-century houses: how post-and-beam moves, which terrazzo can be saved, and what a historic committee wants to see before it says yes.",
        "The studio's work starts with what the house already is — a clerestory, a breeze-block screen, a wall of walnut someone painted beige — and builds the owner's life back into it. New where new is better, vintage where it isn't, and never a room that looks like a museum or a movie set.",
        "It's a small studio on purpose: Nadia leads every project, with a project manager and a sourcing lead behind her, and four houses on the go at most. That's why the fee is flat, and why the calendar books out a season ahead.",
    ],
    /** The content-split's bullet list beside the story. */
    bullets: [
        studio.credentialLine,
        "Nadia leads every project — four houses at a time, at most",
        "Eleven years, eighty-six houses, zero markup on furniture",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "NCIDQ certificate No. 40277",
        "ASID professional member",
        "Historic-review packages in five desert cities",
        "Featured in two design quarterlies, 2025",
    ],
}

export const faq = [
    {
        question: "Do you work remotely?",
        answer: "Yes — about a third of our clients live elsewhere most of the year. We run the project on a shared weekly note with photographs, hold meetings on video, and walk the house with you on your visits. Install day happens whether you're here or not; most people like to be.",
    },
    {
        question: "Vintage or reproduction — which do you use?",
        answer: "Both, honestly labeled. Vintage where the original is better built or holds its value (case goods, lighting, rugs); new or licensed reproduction where daily use would ruin an original (a family sofa, dining chairs with kids). Every piece is marked one or the other on your list, with its condition report.",
    },
    {
        question: "How long does a project take?",
        answer: "A furnishing project runs six to ten weeks, most of it sourcing. A kitchen or bath is three to four months with the build; a full renovation is typically eight to fourteen months, depending on the house and the historic review. You'll get a dated schedule with the flat fee.",
    },
    {
        question: "Can you handle HOA and historic review?",
        answer: "That's a large part of the job here. We prepare the drawings, photographs, and material samples the HOA or historic-site committee asks for, attend the hearings, and design so the answer is yes the first time. Class 1 sites and condo boards both.",
    },
    {
        question: "Do you mark up furniture?",
        answer: "No. Everything is billed at what we paid, with the receipt attached; our income is the flat design fee and logged sourcing hours. It keeps the advice honest — we have no reason to sell you the expensive chair.",
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
 * The studio books two kinds of visit online: the free walk-through and
 * the paid two-hour design consultation. One calendar — Nadia takes every
 * first meeting herself.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "walk-through",
            name: "Free walk-through",
            durationMinutes: 45,
            description:
                "Forty-five minutes in the house — what's original, what's possible, and a flat fee in writing within the week.",
        },
        {
            typeId: "design-consultation",
            name: "Design consultation",
            durationMinutes: 120,
            description: "Two working hours in the house: decisions in the room, written notes the next day.",
        },
    ],
    providers: [
        {
            providerId: "nadia-farouk",
            name: "Nadia Farouk",
            windows: [
                { day: 1, start: 8 * 60, end: 12 * 60 },
                { day: 2, start: 8 * 60, end: 12 * 60 },
                { day: 4, start: 13 * 60, end: 17 * 60 },
                { day: 5, start: 8 * 60, end: 13 * 60 },
            ],
        },
    ],
}

/** The /contact page's booking strip — the slot picker above the form. */
export const booking = {
    headline: "Put a walk-through on the calendar",
    intro: "Book the free walk-through or a two-hour design consultation directly — pick a time and you'll get a confirmation with a one-click reschedule link. Prefer to write first? The form below reaches the studio.",
    /** The new/returning select's studio voice (the widget's statusLabels). */
    statusLabels: { new: "New to the studio", returning: "Returning client" },
}

export const contact = {
    headline: "Tell us about the house.",
    body: "A few lines about the place — the year it was built, what's original, what isn't, and the budget you're working with — and the studio will reply within two business days. Good bones get a quick answer.",
    confirmation:
        "Thank you — your note is in. The studio replies to every inquiry within two business days, usually sooner.",
    /** The home page's consultation form heading (the `catalog` layout's close). */
    consultation: {
        kicker: "Consultation",
        title: "Book the free walk-through",
        body: "Tell us about the house and when you'd like us there. We'll bring a tape measure, a camera, and an honest opinion.",
        cta: "Request the walk-through",
    },
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        { name: "phone", label: "Phone", type: "tel" as const },
        {
            name: "project",
            label: "Type of project",
            placeholder: "Full renovation, furnishing, sourcing …",
        },
        { name: "neighborhood", label: "Neighborhood", placeholder: "Twin Palms, Racquet Club, elsewhere …" },
        { name: "year", label: "Year built", placeholder: "1957, 1962, not sure …" },
        {
            name: "timeline",
            label: "Ideal timing",
            placeholder: "Before the season, next spring, flexible …",
        },
        {
            name: "message",
            label: "About the house",
            type: "textarea" as const,
            fullWidth: true,
            required: true,
        },
    ],
}
