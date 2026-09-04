/**
 * The landscaping remix seed: a complete, drop-in replacement for
 * `./content.ts` that retargets the services pack from the remodeling
 * contractor to a landscaper — same shape, same sections, different trade.
 * The derived template `repobot-services-landscape` is composed from the
 * services pack with this file copied over `content.ts` and the moss-green
 * brand overlay from `packs/services/remixes/landscape.json` merged over
 * the register's safety orange.
 *
 * Because the copy is verbatim, this file must stay a structural twin of
 * `content.ts`: same exports, same relative imports, images under its own
 * `/services-landscape/` public directory. The parity test
 * (`tests/View/Services/remixSeeds.test.ts`) pins the export surface
 * against the real module, so the seed fails CI the moment the pack's
 * contract moves without it.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/services-landscape` (see PACK.md). The `photo` helper
 * mirrors that verb's naming exactly. Never point a slot at a raw camera
 * file.
 *
 * Before/after pairs are the pack's proof: shoot (or pick) both frames
 * from the same angle, or the comparison reads as two different yards.
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
        src: `/services-landscape/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/services-landscape/${name}-${step}w.webp`, width: step })),
    }
}

export const business = {
    name: "Juniper Ridge Landscaping",
    tagline: "Landscape design, build & renewal",
    location: "Bend, Oregon",
    /** Shown everywhere the number appears; `phoneHref` is the tap target. */
    phone: "(541) 555-0186",
    phoneHref: "tel:+15415550186",
    email: "office@juniperridgelandscape.example",
    address: "20310 Empire Ave, Suite C, Bend, OR 97703",
    /** The license line — rendered wherever trust is being earned. */
    license: "Licensed landscape contractor — OR LCB #9614 · Bonded & insured", // theme-exempt: license number, not a color
}

/**
 * Weekly hours drive the live "Open now — closes 4:30 PM" hero badge (the
 * shared hours engine, `View/Landing/hours.ts`). Minutes since midnight;
 * a day may have several intervals.
 */
export const weeklyHours: DayHours[] = [
    { day: 1, intervals: [[420, 990]] }, // Mon 7 AM – 4:30 PM
    { day: 2, intervals: [[420, 990]] },
    { day: 3, intervals: [[420, 990]] },
    { day: 4, intervals: [[420, 990]] },
    { day: 5, intervals: [[420, 990]] }, // Fri
]

export const hoursNote = "Monday–Friday 7 AM–4:30 PM · Design consults by appointment"

/** The towns the crew actually drives to — the home page's quiet strip. */
export const serviceArea = ["Bend", "Redmond", "Sisters", "Tumalo", "Sunriver", "Eagle Crest"]

/**
 * Landing copy the trade owns — mirrors the base module's `landingCopy`
 * so the landing modules retrade their headings with the content.
 */
export const landingCopy = {
    /** The home page's services-section heading. */
    servicesHeading: "Design, build, and maintain — one crew",
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
        slug: "awbrey-patio",
        title: "Awbrey Butte backyard",
        location: "Bend",
        scope: "Patio, fire pit & sod — 3 weeks",
        description:
            "A bare-dirt quarter acre turned into an outdoor room: a sandstone paver patio around a gas fire pit, new sod, and planting beds that frame the mountain instead of hiding it.",
        before: photo(
            "project-patio-before",
            1536,
            1024,
            "The Awbrey Butte backyard before landscaping: bare dirt, patchy weeds, and a weathered fence",
        ),
        after: photo(
            "project-patio-after",
            1536,
            1024,
            "The Awbrey Butte backyard after landscaping: a paver patio with a fire pit, new sod, and planted beds",
        ),
    },
    {
        slug: "norton-xeriscape",
        title: "Norton Avenue xeriscape",
        location: "Bend",
        scope: "Front-yard conversion — 2 weeks",
        description:
            "A dying lawn traded for a high-desert front yard that waters itself: basalt boulders, drought-tolerant plantings on drip, and a flagstone path to the porch.",
        before: photo(
            "project-frontyard-before",
            1536,
            1024,
            "The Norton Avenue front yard before conversion: dying patchy lawn and an overgrown shrub at the porch",
        ),
        after: photo(
            "project-frontyard-after",
            1536,
            1024,
            "The Norton Avenue front yard after conversion: gravel beds, boulders, drought-tolerant plantings, and a flagstone path",
        ),
    },
    {
        slug: "ochoco-terraces",
        title: "Ochoco slope terraces",
        location: "Redmond",
        scope: "Retaining walls & steps — 4 weeks",
        description:
            "An eroding hillside held with two tiers of stacked basalt, stone steps between them, and terraces planted to knit the slope together for good.",
        before: photo(
            "project-wall-before",
            1536,
            1024,
            "The Ochoco backyard slope before the walls: raw eroding dirt with runoff gullies",
        ),
        after: photo(
            "project-wall-after",
            1536,
            1024,
            "The Ochoco backyard slope after the walls: two tiers of basalt block terraces with stone steps and plantings",
        ),
    },
    {
        slug: "ponderosa-lawn",
        title: "Ponderosa lawn & irrigation",
        location: "Sisters",
        scope: "Sod & 4-zone irrigation — 1 week",
        description:
            "A dead late-summer lawn stripped, graded, and relaid as sod over a four-zone irrigation system — green in a week and set up to stay that way on a schedule.",
        before: photo(
            "project-lawn-before",
            1536,
            1024,
            "The Ponderosa backyard before the new lawn: dead brown grass with bare dirt patches",
        ),
        after: photo(
            "project-lawn-after",
            1536,
            1024,
            "The Ponderosa backyard after the new lawn: deep green sod with a sprinkler running and a freshly mulched bed",
        ),
    },
]

export const services: Service[] = [
    {
        slug: "design-build",
        title: "Landscape design & build",
        eyebrow: "Design",
        description:
            "A plan for the whole yard — grading, hardscape, planting, lighting, irrigation — built in phases you can live with and budget for.",
        priceNote: "From $8,000",
        image: projects[0].after,
    },
    {
        slug: "patios",
        title: "Paver patios & hardscape",
        eyebrow: "Hardscape",
        description:
            "Paver and flagstone patios, walkways, and fire pits on a compacted base that stays flat through Central Oregon freeze-thaw.",
        priceNote: "From $6,500",
        image: photo(
            "service-pavers",
            1536,
            1024,
            "A landscaper's hands setting a sandstone paver into leveled sand beside a level and string line",
        ),
    },
    {
        slug: "xeriscape",
        title: "Xeriscape conversions",
        eyebrow: "Planting",
        description:
            "Lawns traded for high-desert plantings on drip — boulders, natives, and steel edging that cut the water bill and look better in August.",
        priceNote: "From $4,500",
        image: projects[1].after,
    },
    {
        slug: "walls",
        title: "Retaining walls & terraces",
        eyebrow: "Hardscape",
        description:
            "Engineered stacked-stone and block walls that hold a slope for good — drainage behind, plantings on top, permits handled when height needs them.",
        priceNote: "From $5,000",
        image: projects[2].after,
    },
    {
        slug: "lawns",
        title: "Lawns & irrigation",
        eyebrow: "Turf",
        description:
            "Grading, sod, and multi-zone irrigation with a controller you can actually use — plus spring start-ups and fall blowouts on a schedule.",
        priceNote: "From $2,800",
        image: projects[3].after,
    },
    {
        slug: "cleanups",
        title: "Cleanups & maintenance",
        eyebrow: "Care",
        description:
            "Spring and fall cleanups, pruning, mulch refreshes, and bed care — the standing appointment that keeps the yard the way we left it.",
        priceNote: "From $95",
        image: photo(
            "service-cleanup",
            1536,
            1024,
            "Gloved hands pruning back ornamental grasses beside a freshly mulched garden bed",
        ),
    },
]

/** The trust numbers — the metrics strip. Keep values short and big. */
export const metrics = [
    { value: "12", label: "years in Central Oregon" },
    { value: "640+", label: "yards transformed" },
    { value: "4.9★", label: "average of 185 reviews" },
    { value: "2-yr", label: "plant & hardscape warranty" },
]

export const testimonials = [
    {
        quote: "We lived with a dirt lot for two years because every bid felt like guesswork. Juniper Ridge drew the plan, priced it in phases, and the patio came out better than the rendering — done in the three weeks they said.",
        name: "Carrie & Matt Delgado",
        detail: "Backyard design & build, Bend",
    },
    {
        quote: "The slope behind our house shed mud into the patio every spring. They terraced it in basalt, planted the tiers, and it hasn't moved an inch through two winters.",
        name: "Gordon Hsu",
        detail: "Retaining walls, Redmond",
    },
    {
        quote: "They ripped out our dead lawn on Monday and my kids were playing on new grass that Saturday. The irrigation schedule was set up on my phone before the crew left.",
        name: "Annie Kowalski",
        detail: "Lawn & irrigation, Sisters",
    },
]

export const home = {
    headline: "From bare dirt to done.",
    subheadline:
        "Patios, plantings, lawns, and retaining walls across Central Oregon — designed and built by one licensed crew, from the first sketch to the final rake.",
    heroImage: photo(
        "hero-01",
        1536,
        1024,
        "A finished landscaped backyard at golden hour: a flagstone path through new sod, layered planting beds, and a corten water feature",
    ),
    /** The before/after teaser: which projects lead on the home page. */
    featuredProjects: [projects[0], projects[2]],
}

export const about = {
    headline: "Dirt under our nails since 2013.",
    photo: photo(
        "crew",
        1024,
        1536,
        "The Juniper Ridge crew in matching green work shirts in front of a freshly finished yard, shovel and wheelbarrow in hand",
    ),
    paragraphs: [
        "Juniper Ridge started in 2013 with a pickup, a trailer, and a habit that became the company: draw the yard before you dig it. Founder Sam Otero spent eight years building golf-course landscapes before bringing the same standard home — grade it right, drain it right, and the pretty parts take care of themselves.",
        "Today we're a crew of eight — a designer, hardscape leads, and planting specialists — running two crews so a job that starts keeps moving until it's done. We build for this climate: freeze-thaw-proof bases, hardy natives, and irrigation sized for high-desert water rules.",
        "Every design is drawn to scale before we quote it, every quote is itemized and fixed, and every yard leaves with a two-year warranty on plants and hardscape — in writing.",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "OR LCB #9614", // theme-exempt: license number, not a color
        "Bonded & insured",
        "ICPI-certified paver installers",
        "EPA WaterSense partner",
    ], // theme-exempt: license number, not a color
}

export const process = {
    kicker: "How a yard comes together",
    title: "Designed first, built once",
    steps: [
        {
            title: "Walk the yard",
            description:
                "We come out, measure, and listen — sun, slopes, drainage, and how you actually want to use the space. Honest feedback on what's worth doing.",
        },
        {
            title: "The plan & fixed quote",
            description:
                "A scaled design with plant and material lists, itemized and priced in phases. The quote is the price; changes only happen on paper first.",
        },
        {
            title: "The build",
            description:
                "One crew, a posted schedule, and a site left tidy every evening. Hardscape first, irrigation next, plants and sod last — in that order for a reason.",
        },
        {
            title: "The walkthrough & care guide",
            description:
                "We walk the finished yard together, hand over a watering and care guide, and back the work with a two-year plant and hardscape warranty.",
        },
    ],
}

export const faq = [
    {
        question: "What does a design cost?",
        answer: "Site visits and ballpark estimates are free within our service area. A full scaled design runs $450–$900 by yard size — and we credit it back in full when you build the project with us.",
    },
    {
        question: "Are you licensed and insured?",
        answer: "Yes — Oregon Landscape Contractors Board license #9614, bonded and fully insured, and our paver crew is ICPI-certified. Certificates available before any work starts.", // theme-exempt: license number, not a color
    },
    {
        question: "Can we build the plan in phases?",
        answer: "Most clients do. The design prices each phase separately — hardscape one season, plantings the next — and phase one is always built so the later phases don't disturb it.",
    },
    {
        question: "How far out are you booking?",
        answer: "Design consults happen within two weeks year-round. Builds typically start four to eight weeks from a signed quote in season — fall and early spring book fastest and grow best.",
    },
    {
        question: "Will you maintain the yard after it's built?",
        answer: "Yes — spring and fall cleanups, pruning, mulch, and irrigation start-ups and blowouts on a standing schedule. Yards we maintain stay under warranty care, and problems get caught small.",
    },
]

export const quote = {
    headline: "Tell us about the yard.",
    body: "A few lines about the space — what's there now, what you want it to be, and roughly when — and we'll call you back within one business day to set up a free site visit.",
    confirmation:
        "Thank you — your request is in. We reply to every inquiry within one business day, usually the same afternoon.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "phone", label: "Phone", type: "tel" as const, required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        { name: "town", label: "Town", placeholder: "Bend, Redmond, Sisters …" },
        { name: "project", label: "Type of project", placeholder: "Patio, full design, lawn, cleanup …" },
        { name: "timeline", label: "Ideal timing", placeholder: "This spring, flexible …" },
        {
            name: "message",
            label: "About the yard",
            type: "textarea" as const,
            fullWidth: true,
            required: true,
        },
    ],
}
