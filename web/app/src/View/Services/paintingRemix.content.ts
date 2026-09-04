/**
 * The painting-company remix seed: a complete, drop-in replacement for
 * `./content.ts` that retargets the services pack from the remodeling
 * contractor to a painter — same shape, same sections, different trade.
 * The derived template `repobot-services-painting` is composed from the
 * services pack with this file copied over `content.ts` and the plum brand
 * overlay from `packs/services-painting/catalog.json` merged over the
 * register's safety orange.
 *
 * Because the copy is verbatim, this file must stay a structural twin of
 * `content.ts`: same exports, same relative imports, images under its own
 * `/services-painting/` public directory. The parity test
 * (`tests/View/Services/remixSeeds.test.ts`) pins the export surface
 * against the real module, so the seed fails CI the moment the pack's
 * contract moves without it.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/services-painting` (see PACK.md). The `photo` helper
 * mirrors that verb's naming exactly. Never point a slot at a raw camera
 * file.
 *
 * Before/after pairs are the pack's proof: shoot (or pick) both frames
 * from the same angle, or the comparison reads as two different rooms.
 */

import type { DayHours } from "../Landing/hours"

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
        src: `/services-painting/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/services-painting/${name}-${step}w.webp`, width: step })),
    }
}

export const business = {
    name: "Deschutes Painting Co.",
    tagline: "Interior & exterior painting",
    location: "Bend, Oregon",
    /** Shown everywhere the number appears; `phoneHref` is the tap target. */
    phone: "(541) 555-0142",
    phoneHref: "tel:+15415550142",
    email: "office@deschutespainting.example",
    address: "1135 SE Wilson Ave, Suite B, Bend, OR 97702",
    /** The license line — rendered wherever trust is being earned. */
    license: "Licensed, bonded & insured — OR CCB #221305", // theme-exempt: license number, not a color
}

/**
 * Weekly hours drive the live "Open now — closes 5 PM" hero badge (the
 * shared hours engine, `View/Landing/hours.ts`). Minutes since midnight;
 * a day may have several intervals.
 */
export const weeklyHours: DayHours[] = [
    { day: 1, intervals: [[450, 1020]] }, // Mon 7:30 AM – 5 PM
    { day: 2, intervals: [[450, 1020]] },
    { day: 3, intervals: [[450, 1020]] },
    { day: 4, intervals: [[450, 1020]] },
    { day: 5, intervals: [[450, 1020]] }, // Fri
    { day: 6, intervals: [[540, 780]] }, // Sat 9 AM – 1 PM
]

export const hoursNote = "Monday–Friday 7:30 AM–5 PM · Saturday 9 AM–1 PM · Color consults by appointment"

/** The towns the crew actually drives to — the home page's quiet strip. */
export const serviceArea = ["Bend", "Redmond", "Sisters", "Tumalo", "Sunriver", "La Pine"]

/**
 * Landing copy the trade owns — mirrors the base module's `landingCopy`
 * so the landing modules retrade their headings with the content.
 */
export const landingCopy = {
    /** The home page's services-section heading. */
    servicesHeading: "Every surface, one crew",
}

export interface Service {
    slug: string
    title: string
    /** Small uppercase label on the card, e.g. the room or trade. */
    eyebrow: string
    description: string
    /** "From $3,200" / "By consultation" — honest ballparks build trust. */
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
        slug: "westside-exterior",
        title: "Westside craftsman exterior",
        location: "Bend",
        scope: "Full exterior repaint — 8 days",
        description:
            "Twenty years of high-desert sun scraped, primed, and repainted in a deep sage with crisp cream trim — caulked, sealed, and warrantied against the next twenty.",
        before: photo(
            "project-exterior-before",
            1536,
            1024,
            "The craftsman house before repainting: faded, chalky paint with peeling trim and bare patches",
        ),
        after: photo(
            "project-exterior-after",
            1536,
            1024,
            "The craftsman house after repainting: fresh sage siding with crisp cream trim and a glossy front door",
        ),
    },
    {
        slug: "orchard-cabinets",
        title: "Orchard District kitchen cabinets",
        location: "Bend",
        scope: "Cabinet refinish — 5 days",
        description:
            "Dated oak cabinets degreased, sanded, and sprayed to a factory-smooth white in our booth-quality process — a new kitchen for a fifth the cost of one.",
        before: photo(
            "project-cabinets-before",
            1536,
            1024,
            "The kitchen before refinishing: dated orange-toned oak cabinets with worn fronts",
        ),
        after: photo(
            "project-cabinets-after",
            1536,
            1024,
            "The kitchen after refinishing: smooth white sprayed cabinets with new brushed hardware",
        ),
    },
    {
        slug: "ridge-interior",
        title: "Awbrey Ridge great room",
        location: "Bend",
        scope: "Interior repaint — 4 days",
        description:
            "A dark, dated great room with scuffed walls taken to a warm white with a rolled finish you can't find a lap mark in — ceilings, trim, and doors included.",
        before: photo(
            "project-living-before",
            1536,
            1024,
            "The great room before repainting: dark beige walls with scuffs and dated trim",
        ),
        after: photo(
            "project-living-after",
            1536,
            1024,
            "The great room after repainting: bright warm-white walls with clean lines and fresh trim",
        ),
    },
    {
        slug: "river-deck",
        title: "Riverside deck & fence",
        location: "Tumalo",
        scope: "Strip & stain — 3 days",
        description:
            "A gray, weathered deck and fence stripped, brightened, and stained in a semi-transparent cedar that shows the grain and sheds the weather.",
        before: photo(
            "project-deck-before",
            1536,
            1024,
            "The deck before refinishing: gray weathered boards with water stains and a faded fence",
        ),
        after: photo(
            "project-deck-after",
            1536,
            1024,
            "The deck after refinishing: rich cedar-stained boards with a matching fence line",
        ),
    },
]

export const services: Service[] = [
    {
        slug: "interior",
        title: "Interior painting",
        eyebrow: "Interior",
        description:
            "Walls, ceilings, trim, and doors — furniture moved and masked, two coats rolled tight, and every line cut sharp by hand.",
        priceNote: "From $450 a room",
        image: projects[2].after,
    },
    {
        slug: "exterior",
        title: "Exterior painting",
        eyebrow: "Exterior",
        description:
            "Wash, scrape, prime, and two finish coats matched to high-desert sun and freeze — with a written warranty on the whole envelope.",
        priceNote: "From $4,800",
        image: projects[0].after,
    },
    {
        slug: "cabinets",
        title: "Cabinet refinishing",
        eyebrow: "Kitchen & bath",
        description:
            "Doors and drawers sprayed off-site to a factory finish, boxes finished in place — a transformed kitchen in under a week.",
        priceNote: "From $3,200",
        image: projects[1].after,
    },
    {
        slug: "staining",
        title: "Deck & fence staining",
        eyebrow: "Exterior",
        description:
            "Strip, brighten, and stain — semi-transparent or solid — so the wood you already own looks new and lasts longer.",
        priceNote: "From $1,400",
        image: projects[3].after,
    },
    {
        slug: "repairs",
        title: "Drywall & trim repair",
        eyebrow: "Prep",
        description:
            "Patches, texture matching, caulk, and trim replacement — the prep work that separates a paint job from a Deschutes paint job.",
        priceNote: "From $250",
        image: photo(
            "service-prep",
            1536,
            1024,
            "A painter skim-coating a drywall patch smooth beside taped-off trim",
        ),
    },
    {
        slug: "color",
        title: "Color consultation",
        eyebrow: "Design",
        description:
            "An hour with a color specialist, large drawdown samples on your actual walls, and a palette you'll still love in five years.",
        priceNote: "$150, credited to your job",
        image: photo(
            "service-color",
            1536,
            1024,
            "Fan decks and large painted color samples laid out on a table in natural light",
        ),
    },
]

/** The trust numbers — the metrics strip. Keep values short and big. */
export const metrics = [
    { value: "16", label: "years painting Central Oregon" },
    { value: "2,300+", label: "homes painted" },
    { value: "4.9★", label: "average of 410 reviews" },
    { value: "5-yr", label: "written workmanship warranty" },
]

export const testimonials = [
    {
        quote: "Three crews bid our exterior; Deschutes was the only one whose quote listed the prep hours. Watching them scrape and prime for two days before a drop of paint went on told me everything.",
        name: "Ellen & Mark Fitzgerald",
        detail: "Exterior repaint, Bend",
    },
    {
        quote: "They sprayed our cabinets in place over five days and I cannot find a brush mark, a drip, or a speck of overspray anywhere in my kitchen. It looks like we bought new cabinets.",
        name: "Priya Raman",
        detail: "Cabinet refinish, Bend",
    },
    {
        quote: "Two painters, four days, the whole main floor — and they left it cleaner than they found it. The cut lines along our vaulted ceiling are dead straight.",
        name: "Dan Whitcomb",
        detail: "Interior repaint, Redmond",
    },
]

export const home = {
    headline: "The finish everyone notices.",
    subheadline:
        "Interior and exterior painting across Central Oregon — real prep, sharp lines, and a five-year written warranty, from a licensed crew that shows up when it says it will.",
    heroImage: photo(
        "hero-01",
        1536,
        1024,
        "A painter cutting a crisp line where a deep green wall meets white trim, brush in hand",
    ),
    /** The before/after teaser: which projects lead on the home page. */
    featuredProjects: [projects[0], projects[1]],
}

export const about = {
    headline: "Brushes down, standards up.",
    photo: photo(
        "crew",
        1024,
        1536,
        "Three Deschutes Painting crew members in white painters' gear in front of a freshly painted house",
    ),
    paragraphs: [
        "Deschutes Painting started in 2009 when founder Tom Barrera got tired of repainting other companies' three-year-old jobs. His rule became the company's: the paint is the last 20% — the scraping, sanding, priming, and caulking underneath is what you're actually paying for.",
        "Today we run two full-time crews of career painters — employees, not day labor — and a spray shop for cabinet and door work. Every job gets a written scope, a posted schedule, and a lead painter whose name you know.",
        "Every surface is prepped to spec, every product is matched to this climate's sun and freeze, and every job carries a five-year workmanship warranty in writing. If our work fails, we fix it free.",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "OR CCB #221305", // theme-exempt: license number, not a color
        "Bonded & insured",
        "Lead-safe certified (EPA RRP)",
        "5-year written warranty",
    ], // theme-exempt: license number, not a color
}

export const process = {
    kicker: "How a repaint runs",
    title: "Prep first, paint once",
    steps: [
        {
            title: "The walkthrough & written scope",
            description:
                "We walk every surface with you, note the repairs the paint can't hide, and quote a fixed price with the prep spelled out line by line.",
        },
        {
            title: "Colors, on your walls",
            description:
                "Large drawdown samples on your actual walls in your actual light — not a chip under showroom fluorescents. Decide once, love it for years.",
        },
        {
            title: "Prep and protection",
            description:
                "Furniture moved and masked, floors covered, surfaces scraped, sanded, patched, and primed. This is most of the job — it's supposed to be.",
        },
        {
            title: "Finish coats & the blue-tape walk",
            description:
                "Two coats, sharp lines, then a walkthrough with blue tape in your hand: anything you flag gets fixed before we call it done.",
        },
    ],
}

export const faq = [
    {
        question: "How much does a repaint cost?",
        answer: "Interiors start around $450 a room including trim; full exteriors start around $4,800 and depend on size, height, and how much prep the siding needs. Every quote is fixed, itemized, and free.",
    },
    {
        question: "Are you licensed and insured?",
        answer: "Yes — Oregon CCB #221305, bonded and fully insured, and EPA lead-safe certified for pre-1978 homes. Certificates available before any work starts.", // theme-exempt: license number, not a color
    },
    {
        question: "What paint do you use?",
        answer: "Premium lines matched to the job — high-build acrylics on high-desert exteriors, scrubbable matte and enamel inside, catalyzed lacquer on cabinets. The exact products are named on your quote, never swapped on site.",
    },
    {
        question: "Do we need to move out while you paint?",
        answer: "Almost never. Interiors run room by room — we mask, paint, and put each space back before moving on — and low-VOC products keep the house livable. Kitchens and cabinet jobs stay usable every evening.",
    },
    {
        question: "Is the work warrantied?",
        answer: "Five years on workmanship, in writing, on every job. If our prep or application fails — peeling, blistering, cracking — we come back and make it right at no cost.",
    },
]

export const quote = {
    headline: "Tell us about the job.",
    body: "A few details about the space — inside or out, roughly how big, and when you'd like it done — and we'll call you back within one business day to set up a free walkthrough and fixed quote.",
    confirmation:
        "Thank you — your request is in. We reply to every inquiry within one business day, usually the same afternoon.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "phone", label: "Phone", type: "tel" as const, required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        { name: "town", label: "Town", placeholder: "Bend, Redmond, Sisters …" },
        { name: "project", label: "Type of project", placeholder: "Interior, exterior, cabinets, deck …" },
        { name: "timeline", label: "Ideal timing", placeholder: "This month, before summer, flexible …" },
        {
            name: "message",
            label: "About the job",
            type: "textarea" as const,
            fullWidth: true,
            required: true,
        },
    ],
}
