/**
 * The services pack's single content file: the business, its services,
 * projects, and pages. Everything the site renders comes from here — edit
 * this file (not the page components) to make the site yours. The demo
 * business is a remodeling contractor, but the shape fits any trade:
 * plumber, electrician, landscaper, cleaner — swap the services, projects,
 * and copy and the site follows.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/services` (see PACK.md). The `photo` helper mirrors that
 * verb's naming exactly. Never point a slot at a raw camera file.
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
        src: `/services/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/services/${name}-${step}w.webp`, width: step })),
    }
}

export const business = {
    name: "Cedar & Stone Remodeling",
    tagline: "Remodeling and home improvement",
    location: "Bend, Oregon",
    /** Shown everywhere the number appears; `phoneHref` is the tap target. */
    phone: "(541) 555-0147",
    phoneHref: "tel:+15415550147",
    email: "office@cedarandstone.example",
    address: "1140 SE Wilson Ave, Suite B, Bend, OR 97702",
    /** The license line — rendered wherever trust is being earned. */
    license: "Licensed, bonded & insured — OR CCB #204718", // theme-exempt: license number, not a color
}

/**
 * Weekly hours drive the live "Open now — closes 5 PM" hero badge (the
 * shared hours engine, `View/Landing/hours.ts`). Minutes since midnight;
 * a day may have several intervals.
 */
export const weeklyHours: DayHours[] = [
    { day: 1, intervals: [[420, 1020]] }, // Mon 7 AM – 5 PM
    { day: 2, intervals: [[420, 1020]] },
    { day: 3, intervals: [[420, 1020]] },
    { day: 4, intervals: [[420, 1020]] },
    { day: 5, intervals: [[420, 1020]] }, // Fri
    { day: 6, intervals: [[480, 720]] }, // Sat 8 AM – noon
]

export const hoursNote = "Monday–Friday 7 AM–5 PM · Saturday 8 AM–noon · Estimates by appointment"

/** The towns the crew actually drives to — the home page's quiet strip. */
export const serviceArea = ["Bend", "Redmond", "Sisters", "Tumalo", "Sunriver", "Prineville"]

/**
 * Landing copy the trade owns: the few strings the landing modules render
 * that would read wrong for a different trade. Remix seeds retrade these
 * along with the rest of the content — everything else in the landing
 * modules is trade-neutral on purpose.
 */
export const landingCopy = {
    /** The home page's services-section heading. */
    servicesHeading: "Six trades, one crew",
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
        slug: "juniper-kitchen",
        title: "Juniper Avenue kitchen",
        location: "Bend",
        scope: "Full gut remodel — 6 weeks",
        description:
            "A 1970s galley opened into the dining room: new framing, cabinetry to the ceiling, quartz counters, and twice the light.",
        before: photo(
            "project-kitchen-before",
            1536,
            1024,
            "The Juniper Avenue kitchen before the remodel: dated cabinets and a closed-in galley layout",
        ),
        after: photo(
            "project-kitchen-after",
            1536,
            1024,
            "The Juniper Avenue kitchen after the remodel: opened to the dining room with new cabinetry and quartz counters",
        ),
    },
    {
        slug: "shevlin-bath",
        title: "Shevlin Park bath",
        location: "Bend",
        scope: "Tile, vanity & fixtures — 3 weeks",
        description:
            "A hall bath rebuilt from the studs: curbless tiled shower, double vanity, and heated floors under porcelain.",
        before: photo(
            "project-bath-before",
            1536,
            1024,
            "The Shevlin Park bathroom before the remodel: worn fixtures and an aging tub surround",
        ),
        after: photo(
            "project-bath-after",
            1536,
            1024,
            "The Shevlin Park bathroom after the remodel: curbless tiled shower and a double vanity",
        ),
    },
    {
        slug: "larkspur-basement",
        title: "Larkspur basement",
        location: "Redmond",
        scope: "Finish-out — 8 weeks",
        description:
            "Seven hundred unfinished square feet turned into a family room, guest suite, and full bath — egress windows and all permits included.",
        before: photo(
            "project-basement-before",
            1536,
            1024,
            "The Larkspur basement before finishing: bare studs, concrete floor, and exposed joists",
        ),
        after: photo(
            "project-basement-after",
            1536,
            1024,
            "The Larkspur basement after finishing: a warm family room with a guest suite beyond",
        ),
    },
    {
        slug: "metolius-deck",
        title: "Metolius River deck",
        location: "Sisters",
        scope: "Tear-off & rebuild — 2 weeks",
        description:
            "A failing deck torn back to the ledger and rebuilt in cedar with steel-cable rails, sized for the view it was wasting.",
        before: photo(
            "project-deck-before",
            1536,
            1024,
            "The Metolius River deck before the rebuild: weathered boards and a sagging rail",
        ),
        after: photo(
            "project-deck-after",
            1536,
            1024,
            "The Metolius River deck after the rebuild: new cedar decking with steel-cable rails",
        ),
    },
    {
        slug: "tumalo-adu",
        title: "Tumalo garage ADU",
        location: "Tumalo",
        scope: "Conversion — 12 weeks",
        description:
            "A two-car garage converted into a permitted 480 sq ft ADU: insulation, plumbing, a full kitchen, and its own entrance.",
        before: photo(
            "project-adu-before",
            1536,
            1024,
            "The Tumalo garage before conversion: bare walls, a concrete slab, and storage clutter",
        ),
        after: photo(
            "project-adu-after",
            1536,
            1024,
            "The Tumalo ADU after conversion: a bright studio apartment with a full kitchen",
        ),
    },
]

export const services: Service[] = [
    {
        slug: "kitchens",
        title: "Kitchen remodels",
        eyebrow: "Interiors",
        description:
            "From cabinet refacing to full gut remodels — layout, cabinetry, counters, lighting, and the plumbing and electrical to match.",
        priceNote: "From $24,000",
        image: projects[0].after,
    },
    {
        slug: "bathrooms",
        title: "Bathroom remodels",
        eyebrow: "Interiors",
        description:
            "Tile showers, vanities, heated floors, and ventilation done right — small rooms where the craft shows most.",
        priceNote: "From $12,000",
        image: projects[1].after,
    },
    {
        slug: "basements",
        title: "Basement finishing",
        eyebrow: "Interiors",
        description:
            "Framing, egress, insulation, and finish work that turns storage square footage into rooms your family actually uses.",
        priceNote: "From $30,000",
        image: projects[2].after,
    },
    {
        slug: "decks",
        title: "Decks & outdoor living",
        eyebrow: "Exteriors",
        description:
            "Cedar and composite decks, pergolas, and rails — engineered for snow load and built to be barefoot-friendly.",
        priceNote: "From $9,500",
        image: projects[3].after,
    },
    {
        slug: "additions",
        title: "Additions & ADUs",
        eyebrow: "Structures",
        description:
            "Room additions and accessory dwelling units, from feasibility and permits through the final walkthrough.",
        priceNote: "By consultation",
        image: projects[4].after,
    },
    {
        slug: "repairs",
        title: "Repairs & small jobs",
        eyebrow: "Service calls",
        description:
            "Dry rot, drywall, doors, trim, and the list on your fridge — a licensed crew for the jobs too small for a big bid.",
        priceNote: "From $150",
        image: photo(
            "service-repairs",
            1536,
            1024,
            "A carpenter's hands fitting a new piece of trim with a chisel",
        ),
    },
]

/** The trust numbers — the metrics strip. Keep values short and big. */
export const metrics = [
    { value: "18", label: "years in Central Oregon" },
    { value: "430+", label: "projects completed" },
    { value: "4.9★", label: "average of 210 reviews" },
    { value: "10-yr", label: "workmanship warranty" },
]

export const testimonials = [
    {
        quote: "The quote was the price, the schedule was the schedule, and the site was swept every night. Our kitchen came out better than the drawings — and we lived at home through all six weeks of it.",
        name: "Karen & Doug Whitfield",
        detail: "Kitchen remodel, Bend",
    },
    {
        quote: "Three contractors told us the garage couldn't be an ADU without tearing it down. Cedar & Stone pulled the permits, kept the structure, and my mother moved in twelve weeks later.",
        name: "Priya Raman",
        detail: "Garage ADU, Tumalo",
    },
    {
        quote: "They're the only crew I've had in the house that I'd hand a key to. Small repair list, no job too boring, invoice matched the estimate to the dollar.",
        name: "Ed Sorensen",
        detail: "Repairs & maintenance, Redmond",
    },
]

export const home = {
    headline: "Built right the first time.",
    subheadline:
        "Kitchens, baths, basements, decks, and additions across Central Oregon — one licensed crew from the first walkthrough to the final one.",
    heroImage: photo(
        "hero-01",
        1536,
        1024,
        "A finished open-plan kitchen and living room with timber beams and afternoon light",
    ),
    /** The before/after teaser: which projects lead on the home page. */
    featuredProjects: [projects[0], projects[3]],
}

export const about = {
    headline: "A crew you'd hand a key to.",
    photo: photo(
        "crew",
        1024,
        1536,
        "The Cedar & Stone crew on a job site, tool belts on, in front of a framed addition",
    ),
    paragraphs: [
        "Cedar & Stone started in 2008 with one truck, a table saw, and a rule that hasn't changed: the quote is the price. Founder Marcus Webb spent a decade framing custom homes before turning to remodeling, where the craft is harder — every wall you open has a surprise behind it, and the difference between contractors is what they do about it.",
        "Today we're a crew of nine — carpenters, a tile setter, and a project lead for every job — plus the same three licensed subs we've used for over a decade for plumbing, electrical, and HVAC. We take on a limited number of projects at a time so the crew that starts your job finishes it.",
        "Every project is permitted, every change order is written and signed before the work happens, and every job ends the same way: a walkthrough with a punch list, and a ten-year warranty on our workmanship in writing.",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: ["OR CCB #204718", "Bonded & insured", "EPA lead-safe certified", "NARI member"], // theme-exempt: license number, not a color
}

export const process = {
    kicker: "How a project runs",
    title: "No surprises, start to finish",
    steps: [
        {
            title: "Walkthrough",
            description:
                "We come out, measure, and listen. You get honest feedback on what's worth doing — and what isn't — within two days.",
        },
        {
            title: "Fixed quote",
            description:
                "A written, itemized quote with a start date. The quote is the price; changes only happen on paper, signed by you first.",
        },
        {
            title: "The build",
            description:
                "One project lead, a posted schedule, and a site left broom-clean every evening. You'll never wonder who's showing up.",
        },
        {
            title: "Walkthrough, again",
            description:
                "We punch-list the job together before the final invoice — then stand behind the work with a ten-year warranty.",
        },
    ],
}

export const faq = [
    {
        question: "What does an estimate cost?",
        answer: "Nothing. Walkthroughs and written quotes are free within our service area, and the quote you sign is the price you pay — changes only happen through written, signed change orders.",
    },
    {
        question: "Are you licensed and insured?",
        answer: "Yes — Oregon CCB #204718, bonded and fully insured, and we're happy to send certificates before any work starts. Our plumbing, electrical, and HVAC subs carry their own licenses.", // theme-exempt: license number, not a color
    },
    {
        question: "Who handles permits?",
        answer: "We do. Every project that needs a permit gets one, pulled by us and inspected on schedule — it's included in the quote, never a surprise line item.",
    },
    {
        question: "How far out are you booking?",
        answer: "Larger remodels typically start six to ten weeks from a signed quote. Repairs and small jobs usually land within two weeks. The walkthrough is the fastest way to get a real date.",
    },
    {
        question: "How does payment work?",
        answer: "A deposit at signing, progress payments at milestones we agree on in advance, and the final payment only after the walkthrough punch list is done. We never ask for large sums up front.",
    },
]

export const quote = {
    headline: "Tell us about the job.",
    body: "A few lines about the project — what, where, and roughly when — and we'll call you back within one business day to set up a free walkthrough.",
    confirmation:
        "Thank you — your request is in. We reply to every inquiry within one business day, usually the same afternoon.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "phone", label: "Phone", type: "tel" as const, required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        { name: "town", label: "Town", placeholder: "Bend, Redmond, Sisters …" },
        { name: "project", label: "Type of project", placeholder: "Kitchen, bath, deck, repairs …" },
        { name: "timeline", label: "Ideal timing", placeholder: "This spring, flexible …" },
        {
            name: "message",
            label: "About the project",
            type: "textarea" as const,
            fullWidth: true,
            required: true,
        },
    ],
}
