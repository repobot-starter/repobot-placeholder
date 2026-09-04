/**
 * The lawn-care remix seed: a complete, drop-in replacement for
 * `./content.ts` that retargets the recurring-services pack from the home
 * cleaner to a lawn care company — same subscription shape, different
 * trade. The derived template `repobot-services-lawncare` is composed from
 * the services-recurring pack with this file copied over `content.ts` and
 * the deep-emerald brand overlay from `packs/services-lawncare/catalog.json`
 * merged over the pack's herbal green.
 *
 * Because the copy is verbatim, this file must stay a structural twin of
 * `content.ts`: same exports, same relative imports, images under its own
 * `/services-lawncare/` public directory. The parity test
 * (`tests/View/ServicesRecurring/remixSeeds.test.ts`) pins the export
 * surface against the real module, so the seed fails CI the moment the
 * pack's contract moves without it.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/services-lawncare` (see PACK.md). The `photo` helper
 * mirrors that verb's naming exactly. Never point a slot at a raw camera
 * file.
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
        src: `/services-lawncare/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/services-lawncare/${name}-${step}w.webp`, width: step })),
    }
}

export const business = {
    name: "Timberline Lawn Co.",
    tagline: "Recurring lawn care and mowing",
    location: "Bend, Oregon",
    /** Shown everywhere the number appears; `phoneHref` is the tap target. */
    phone: "(541) 555-0138",
    phoneHref: "tel:+15415550138",
    email: "hello@timberlinelawn.example",
    address: "62980 Boyd Acres Rd, Bend, OR 97701",
    /** The trust line — rendered wherever trust is being earned. */
    license: "Licensed & insured — every crew member background-checked",
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
    { day: 6, intervals: [[480, 840]] }, // Sat 8 AM – 2 PM
]

export const hoursNote = "Monday–Friday 7 AM–5 PM · Saturday 8 AM–2 PM · Instant quotes by phone"

/** The neighborhoods the crews actually drive to — the quiet strip. */
export const serviceArea = ["Bend", "Redmond", "Tumalo", "Sisters", "Sunriver", "Eagle Crest"]

/**
 * Landing copy the trade owns — mirrors the base module's `landingCopy`
 * so the landing and shell modules retrade their CTAs with the content.
 */
export const landingCopy = {
    /** The booking ask — the shell's nav CTA and every landing CTA. */
    bookCtaLabel: "Book lawn care",
    /** The plans page's nudge for the undecided. */
    fitNudgeTitle: "Not sure which rhythm fits? Start with weekly mowing.",
    /** The about page's credentials-strip label. */
    credentialsLabel: "Why clients hand us the gate code",
}

export interface Plan {
    slug: string
    name: string
    /** Per-visit price in dollars — the recurring shape prices the visit. */
    perVisit: number
    description: string
    features: string[]
    /** The recommended plan: accent border and the badge treatment. */
    highlighted?: boolean
    badge?: string
}

export const plans: Plan[] = [
    {
        slug: "weekly",
        name: "Weekly mowing",
        perVisit: 59,
        description: "The same crew every week, all season — the lawn never gets a chance to slip.",
        features: [
            "Mow, edge & string-trim",
            "Walks and drives blown clean",
            "Same crew every visit",
            "Sharp blades, patterned stripes",
            "Priority scheduling",
        ],
        highlighted: true,
        badge: "Most popular",
    },
    {
        slug: "biweekly",
        name: "Every two weeks",
        perVisit: 74,
        description: "The rhythm slower-growing lawns run on — tidy, predictable, affordable.",
        features: [
            "Mow, edge & string-trim",
            "Walks and drives blown clean",
            "Same crew every visit",
            "Sharp blades, patterned stripes",
        ],
    },
    {
        slug: "full-season",
        name: "Full-season program",
        perVisit: 89,
        description: "Mowing plus the agronomy — feeding, weed control, and aeration on the calendar.",
        features: [
            "Everything in weekly mowing",
            "5-step fertilization program",
            "Pre- and post-emergent weed control",
            "Spring aeration & overseed",
            "Fall cleanup & final cut",
        ],
    },
]

/** What every visit includes — the icon list on the home page. */
export const included = [
    {
        icon: "star" as const,
        title: "Cut to the season",
        description:
            "Mowing height adjusted through the year — taller in July heat, shorter for the fall finale.",
    },
    {
        icon: "shield" as const,
        title: "Edges, every time",
        description:
            "Walks, drives, and beds edged crisp every visit — the line that makes the lawn look kept.",
    },
    {
        icon: "layers" as const,
        title: "Clippings handled",
        description:
            "Mulched fine to feed the lawn, or bagged and hauled when it's growing too fast — our call, your benefit.",
    },
    {
        icon: "users" as const,
        title: "The same crew",
        description:
            "Your lawn, your crew: the same background-checked pair every visit, who know where the sprinkler heads hide.",
    },
    {
        icon: "clock" as const,
        title: "Your day, kept",
        description:
            "A set day each week, a text when the crew is en route, and gates latched behind us — every visit.",
    },
    {
        icon: "check" as const,
        title: "Guaranteed",
        description:
            "Anything not right, tell us within 48 hours and we come back and fix it free. No forms, no fuss.",
    },
]

/**
 * The plans page's line-by-line comparison. `columns` heads the table
 * (first entry is the criterion column); each row carries one value per
 * plan — booleans render as ✓ / —.
 */
export const planComparison = {
    columns: ["", "Weekly mowing", "Every two weeks", "Full-season program"],
    rows: [
        { label: "Mow, edge & string-trim", values: [true, true, true] },
        { label: "Walks and drives blown clean", values: [true, true, true] },
        { label: "Same crew every visit", values: [true, true, true] },
        { label: "Seasonal mowing-height program", values: [true, true, true] },
        { label: "5-step fertilization", values: ["Add-on", "Add-on", true] },
        { label: "Weed control (pre & post-emergent)", values: ["Add-on", "Add-on", true] },
        { label: "Spring aeration & overseed", values: [false, false, true] },
        { label: "Fall cleanup & final cut", values: ["Add-on", "Add-on", true] },
        { label: "48-hour fix-it guarantee", values: [true, true, true] },
    ],
}

/** The trust numbers — the metrics strip. Keep values short and big. */
export const metrics = [
    { value: "1,900+", label: "lawns on a schedule" },
    { value: "100%", label: "background-checked crews" },
    { value: "4.9★", label: "average of 310 reviews" },
    { value: "48-hr", label: "fix-it guarantee" },
]

export const testimonials = [
    {
        quote: "Same two guys every Thursday for four seasons now. The stripes are straight, the gate is always latched, and I honestly couldn't tell you where my mower is anymore.",
        name: "Greg Palmer",
        detail: "Weekly mowing, Bend",
    },
    {
        quote: "We switched to the full-season program after years of doing the fertilizer aisle guesswork ourselves. The lawn has never looked like this — neighbors ask what we did.",
        name: "Marta & Steve Kowalczyk",
        detail: "Full-season program, Redmond",
    },
    {
        quote: "They mow our eight rental properties on a route and every one is done the same day each week. One invoice, zero tenant complaints — it's the easiest vendor relationship we have.",
        name: "Lena Fujimoto",
        detail: "Property manager, Bend",
    },
]

export const home = {
    headline: "The best lawn on the street, without touching a mower.",
    subheadline:
        "Recurring lawn care across Central Oregon — the same background-checked crew, on a schedule, with sharp blades, crisp edges, and a guarantee in writing.",
    heroImage: photo(
        "hero-01",
        1536,
        1024,
        "A freshly striped green lawn in front of a craftsman home, morning light raking across the cut",
    ),
}

/** The proof gallery — the standard, in photos. Click any to zoom. */
export const gallery = [
    {
        caption: "Stripes: sharp blades and straight lines, every cut",
        image: photo(
            "gallery-stripes",
            1536,
            1024,
            "Crisp alternating mow stripes across a deep green backyard lawn",
        ),
    },
    {
        caption: "Edges: walks, drives, and beds cut crisp every visit",
        image: photo(
            "gallery-edging",
            1536,
            1024,
            "A perfectly edged lawn line along a clean concrete walkway",
        ),
    },
    {
        caption: "Beds kept: trimmed, blown clean, and mulch-tidy",
        image: photo(
            "gallery-beds",
            1536,
            1024,
            "A tidy planting bed with fresh mulch beside a trimmed lawn",
        ),
    },
]

export const about = {
    headline: "A crew you'd trust with the gate code.",
    photo: photo(
        "crew",
        1024,
        1536,
        "Two Timberline Lawn Co. crew members with a mower at their trailer in front of a green lawn",
    ),
    paragraphs: [
        "Timberline started in 2015 with one truck, one trailer, and a rule founder Cole Whitaker still enforces personally: sharp blades, every morning. A dull blade tears grass and browns the cut by Wednesday — most people never learn why their lawn looks tired. Ours don't.",
        "Every crew member is an employee — never day labor — background-checked, trained on our route standards, and paid above market so they stay. That's why you get the same crew every visit: our average crew member has been on the same routes for three years, and clients notice.",
        "We run tight routes so your day is your day, text when we're en route, latch gates behind us, and stand behind every visit with a 48-hour guarantee: anything not right, we come back and fix it free.",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "Licensed & insured",
        "Employees, not day labor",
        "100% background-checked",
        "OR licensed pesticide applicators",
        "48-hour guarantee",
    ],
}

export const faq = [
    {
        question: "Do I get the same crew every time?",
        answer: "Yes — you're assigned a two-person crew and a route day, and they're yours for the season. Substitutions only happen for illness or vacation, and we tell you in advance when they do.",
    },
    {
        question: "Do I need to be home?",
        answer: "Most clients aren't. Give us the gate code or leave it unlocked on your route day — you get a text when the crew arrives and another when they latch the gate behind them.",
    },
    {
        question: "What if it rains on my mowing day?",
        answer: "We shift the route, not skip it — your lawn gets cut within a day or two and your next visit lands back on your regular day. You'll get a text either way.",
    },
    {
        question: "What if something isn't right?",
        answer: "Tell us within 48 hours and we come back and fix it free — a missed strip, a scalped spot, an unlatched gate. No forms, no debate. It's the guarantee that keeps our routes honest.",
    },
    {
        question: "What does it cost for my lawn?",
        answer: "The plan prices cover a typical city lot up to a quarter acre. Larger lots, heavy spring growth, and first cuts get a flat adjustment we quote before we book — call for an instant quote, or send the form and we'll reply the same day.",
    },
    {
        question: "Can I skip or pause visits?",
        answer: "Any time up to noon the day before, free — vacations, parties, drought restrictions. Same-day skips are half the visit price, because your crew's route was planned around you.",
    },
]

export const book = {
    headline: "Get your weekends back.",
    body: "Tell us about your lawn and the rhythm you want — weekly, every two weeks, or the full-season program — and we'll reply the same day with a flat quote and your crew's first opening.",
    confirmation:
        "Thank you — your request is in. We reply the same business day with a flat quote and the first opening for your lawn.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "phone", label: "Phone", type: "tel" as const, required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        { name: "address", label: "Home address", required: true },
        { name: "size", label: "Lot size", placeholder: "Standard city lot, quarter acre, more …" },
        {
            name: "frequency",
            label: "How often?",
            placeholder: "Weekly, every two weeks, full-season program",
        },
        {
            name: "notes",
            label: "Anything we should know",
            type: "textarea" as const,
            fullWidth: true,
            placeholder: "Dogs, gate codes, the slope out back …",
        },
    ],
}
