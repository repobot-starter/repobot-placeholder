/**
 * The pest-control remix seed: a complete, drop-in replacement for
 * `./content.ts` that retargets the recurring-services pack from the home
 * cleaner to a pest control company — same subscription shape, different
 * trade. The derived template `repobot-services-pest` is composed from the
 * services-recurring pack with this file copied over `content.ts` and the
 * brick-red brand overlay from `packs/services-pest/catalog.json` merged
 * over the pack's herbal green.
 *
 * Because the copy is verbatim, this file must stay a structural twin of
 * `content.ts`: same exports, same relative imports, images under its own
 * `/services-pest/` public directory. The parity test
 * (`tests/View/ServicesRecurring/remixSeeds.test.ts`) pins the export
 * surface against the real module, so the seed fails CI the moment the
 * pack's contract moves without it.
 *
 * Optional blocks: the builders render a home section only when its
 * content is filled. This demo fills the classic proof trio (`metrics`,
 * `included`, `gallery`) and leaves the `specimens` board, the turnover
 * pair (`turnover`, `roomReady`) and the prices page's `addOns` empty —
 * fill those to add them.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/services-pest` (see PACK.md). The `photo` helper mirrors
 * that verb's naming exactly. Never point a slot at a raw camera file.
 */

import type { MarketingIconName } from "@ui"
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
        src: `/services-pest/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/services-pest/${name}-${step}w.webp`, width: step })),
    }
}

export const business = {
    name: "Basalt Pest Control",
    tagline: "Recurring home pest protection",
    location: "Bend, Oregon",
    /** Shown everywhere the number appears; `phoneHref` is the tap target. */
    phone: "(541) 555-0151",
    phoneHref: "tel:+15415550151",
    email: "hello@basaltpest.example",
    address: "20585 Brinson Blvd, Suite 4, Bend, OR 97701",
    /** The trust line — rendered wherever trust is being earned. */
    license: "OR licensed applicators — bonded, insured & background-checked",
}

/**
 * Weekly hours drive the live "Open now — closes 5 PM" hero badge (the
 * shared hours engine, `View/Landing/hours.ts`). Minutes since midnight;
 * a day may have several intervals.
 */
export const weeklyHours: DayHours[] = [
    { day: 1, intervals: [[480, 1020]] }, // Mon 8 AM – 5 PM
    { day: 2, intervals: [[480, 1020]] },
    { day: 3, intervals: [[480, 1020]] },
    { day: 4, intervals: [[480, 1020]] },
    { day: 5, intervals: [[480, 1020]] }, // Fri
    { day: 6, intervals: [[540, 780]] }, // Sat 9 AM – 1 PM
]

export const hoursNote = "Monday–Friday 8 AM–5 PM · Saturday 9 AM–1 PM · Instant quotes by phone"

/** The neighborhoods the techs actually drive to — the quiet strip. */
export const serviceArea = ["Bend", "Redmond", "Tumalo", "Sisters", "Sunriver", "La Pine"]

/**
 * Landing copy the trade owns — mirrors the base module's `landingCopy`
 * so the landing and shell modules retrade their CTAs with the content.
 */
export const landingCopy = {
    /** The nav wordmark; empty = the business name. */
    navName: "",
    /** A small line under the nav wordmark ("Atlanta", "Pest Co."); empty = none. */
    navTagline: "",
    /** The booking ask — the shell's nav CTA and every landing CTA. */
    bookCtaLabel: "Book a treatment",
    /** The plans page's nudge for the undecided. */
    fitNudgeTitle: "Not sure which plan fits? Start with quarterly protection.",
    /** The about page's credentials-strip label. */
    credentialsLabel: "Why homes stay protected",
    /** The price tiles' header (home and plans page) and the unit after each price. */
    pricesKicker: "Plans",
    pricesTitle: "Pick a rhythm",
    pricePeriod: "/visit",
    /** The testimonials kicker. */
    reviewsKicker: "From our clients",
    /** The home page's closing banner; the posted hours follow the body. */
    homeBannerTitle: "Your team has an opening this week.",
    homeBannerBody: "Flat quote the same day, first clean this week where the schedule allows.",
    /** The plans page's opening statement. */
    plansHeadline: "One checklist. Three rhythms.",
    plansSubheadline:
        "Every plan runs the same checklist — the difference is how often, and what the deep clean adds. Prices cover a typical three-bed, two-bath home; larger homes get a flat adjustment quoted before we book.",
    /** The plans page's closing banner body, under `fitNudgeTitle`. */
    fitNudgeBody: `Most weekly clients started with one deep clean. Call ${business.phone} for an instant quote.`,
    /** The plans page's add-ons header (shown when `addOns` is filled). */
    addOnsKicker: "",
    addOnsTitle: "",
    /** The about page's three proof bullets. */
    aboutBullets: [
        "OR licensed applicators — bonded, insured & background-checked",
        "The same two-person team every visit",
        "48-hour re-clean guarantee, in writing",
    ],
    /** The about page's closing banner. */
    aboutBannerTitle: "Meet your team this week.",
    /** The book page's form title. */
    bookFormTitle: "Your home, your rhythm",
}

export interface Plan {
    slug: string
    name: string
    /** Per-visit price in dollars — the recurring shape prices the visit. */
    perVisit: number
    description: string
    features: string[]
    /** A word before the price — "From" for a starting price. */
    pricePrefix?: string
    /** The recommended plan: accent border and the badge treatment. */
    highlighted?: boolean
    badge?: string
    /**
     * The code on the plan's ticket stub ("FC-ATL-7D"). When every plan
     * carries one, the price tiles print as season tickets.
     */
    stub?: string
    /** Ticket stubs only: this plan's unit over `pricePeriod` ("/season"). */
    period?: string
}

export const plans: Plan[] = [
    {
        slug: "quarterly",
        name: "Quarterly protection",
        perVisit: 119,
        description: "The seasonal barrier most homes need — treated every quarter, covered all year.",
        features: [
            "Full exterior barrier treatment",
            "Eave & entry-point web removal",
            "Ants, spiders, wasps & mice covered",
            "Free re-treats between visits",
            "Same licensed tech every visit",
        ],
        highlighted: true,
        badge: "Most popular",
    },
    {
        slug: "monthly",
        name: "Monthly protection",
        perVisit: 89,
        description: "For heavy pressure — acreage, pine borders, or a problem you never want back.",
        features: [
            "Everything in quarterly protection",
            "Monthly barrier renewal",
            "Rodent stations checked every visit",
            "Seasonal wasp patrols",
        ],
    },
    {
        slug: "one-time",
        name: "One-time treatment",
        perVisit: 249,
        description: "A single knockdown for a current problem — wasps, ants, or an unwanted surprise.",
        features: [
            "Inspection & targeted treatment",
            "Interior and exterior as needed",
            "Entry points identified in writing",
            "30-day re-treat guarantee",
        ],
    },
]

/** What every visit includes — the icon list on the home page. */
export const included: { icon: MarketingIconName; title: string; description: string }[] = [
    {
        icon: "shield" as const,
        title: "The barrier, renewed",
        description: "The full exterior perimeter treated every visit — foundation, entry points, and eaves.",
    },
    {
        icon: "star" as const,
        title: "Webs & wasps down",
        description:
            "Eaves, soffits, and light fixtures de-webbed and wasp starts knocked down before they grow.",
    },
    {
        icon: "layers" as const,
        title: "Entry points closed",
        description:
            "Gaps, weep holes, and door sweeps flagged and sealed as we find them — exclusion beats extermination.",
    },
    {
        icon: "users" as const,
        title: "The same tech",
        description:
            "Your home, your tech: the same licensed, background-checked applicator who knows your property's pressure points.",
    },
    {
        icon: "clock" as const,
        title: "On time, told twice",
        description:
            "A reminder the day before, a text when your tech is en route, and a written report after every visit.",
    },
    {
        icon: "check" as const,
        title: "Guaranteed",
        description:
            "Pests back between visits? We re-treat free within 48 hours — no forms, no fuss, no invoice.",
    },
]

export interface Specimen {
    name: string
    /** The plate's small line under the name — a field-guide note ("Blattella germanica"). */
    meta: string
    description: string
    image: SiteImage
}

/**
 * The home page's specimen board: portrait plates of what the trade deals
 * with (the pests, the weeds), before the plans. Empty in this demo —
 * fill `items` to add it.
 */
export const specimens: { kicker: string; title: string; items: Specimen[] } = {
    kicker: "",
    title: "",
    items: [],
}

/**
 * The plans page's line-by-line comparison. `columns` heads the table
 * (first entry is the criterion column); each row carries one value per
 * plan — booleans render as ✓ / —.
 */
export const planComparison = {
    columns: ["", "Quarterly protection", "Monthly protection", "One-time treatment"],
    rows: [
        { label: "Exterior barrier treatment", values: [true, true, true] },
        { label: "Ants, spiders, wasps & mice", values: [true, true, "Targeted"] },
        { label: "Eave & entry-point web removal", values: [true, true, true] },
        { label: "Free re-treats between visits", values: [true, true, "30 days"] },
        { label: "Rodent stations checked", values: ["Quarterly", "Monthly", false] },
        { label: "Seasonal wasp patrols", values: [false, true, false] },
        { label: "Entry points sealed as found", values: [true, true, "Flagged"] },
        { label: "Same licensed tech every visit", values: [true, true, false] },
        { label: "Written report after every visit", values: [true, true, true] },
    ],
}

/** The trust numbers — the metrics strip. Keep values short and big. */
export const metrics: { value: string; label: string }[] = [
    { value: "3,400+", label: "homes under protection" },
    { value: "100%", label: "licensed applicators" },
    { value: "4.9★", label: "average of 290 reviews" },
    { value: "48-hr", label: "free re-treat guarantee" },
]

export const testimonials = [
    {
        quote: "We had carpenter ants in the pines and wasps under every eave. Two visits in, both gone — and they've stayed gone for two years because the same tech walks the whole property every quarter.",
        name: "Rick & Donna Aldous",
        detail: "Quarterly protection, Bend",
    },
    {
        quote: "Found mice in the garage in October. They set stations, sealed the gap under the door in the same visit, and the written report told me exactly what they did and where. Haven't seen a dropping since.",
        name: "Sandra Ellis",
        detail: "Monthly protection, Sunriver",
    },
    {
        quote: "A wasp nest the size of a basketball over our deck, gone the next morning. The tech pointed out two more starts we'd never have found and knocked those down too, no extra charge.",
        name: "Kevin Broder",
        detail: "One-time treatment, Redmond",
    },
]

export const home: {
    headline: string
    subheadline: string
    heroImage: SiteImage
    badge: string
    pricesCta: string
    /**
     * The hero's frame: "split" (copy beside the photo), "full-bleed" (the
     * photograph is the hero, copy over it), or "masthead" (full-bleed
     * under a poster-scale headline).
     */
    layout: "split" | "full-bleed" | "masthead"
    /** Full-bleed and masthead only: a credit line under the headline. Empty = none. */
    credit: string
} = {
    headline: "Your house. Not theirs.",
    subheadline:
        "Recurring pest protection across Central Oregon — the same licensed tech, on a schedule, with a renewed barrier every visit and a free re-treat guarantee in writing.",
    heroImage: photo(
        "hero-01",
        1536,
        1024,
        "A uniformed pest control technician treating the foundation line of a tidy home on a sunny morning",
    ),
    /** The hero sticker; empty shows a live "Open now" badge from `weeklyHours`. */
    badge: "",
    /** The hero's second ask, linking to the plans page. Empty = a call button. */
    pricesCta: "",
    layout: "split",
    credit: "",
}

export interface TurnoverStep {
    /** The clock time the step happens at, as guests would read it. */
    time: string
    title: string
    description: string
    /** Proof photo for the step (the made bed, the stocked bath). */
    image?: SiteImage
}

/**
 * A service day, hour by hour — the home page's timeline rail. Empty
 * `steps` drops the section.
 */
export const turnover: { kicker: string; title: string; steps: TurnoverStep[] } = {
    kicker: "",
    title: "",
    steps: [],
}

export interface ChecklistItem {
    label: string
    /** One short line of proof under the label. */
    note: string
    /** Unticked items render an open box; default ticked. */
    checked?: boolean
}

/**
 * The door-hanger checklist left after every visit — the home page's
 * thoroughness proof. Empty `items` drops the section.
 */
export const roomReady: {
    kicker: string
    title: string
    cardTitle: string
    body: string
    /** Optional (null = none): the photo beside the card. */
    photo?: SiteImage | null
    items: ChecklistItem[]
} = {
    kicker: "",
    title: "",
    cardTitle: "",
    body: "",
    photo: null,
    items: [],
}

/** Extras — the plans page's add-on cards. Empty drops the section. */
export const addOns: { icon: MarketingIconName; title: string; description: string }[] = []

/** The proof gallery — the standard, in photos. Click any to zoom. */
export const gallery: { caption: string; image: SiteImage }[] = [
    {
        caption: "The barrier: foundation and entry points, treated every visit",
        image: photo(
            "gallery-barrier",
            1536,
            1024,
            "A technician applying a precise barrier treatment along a home's foundation",
        ),
    },
    {
        caption: "Eaves cleared: webs down, wasp starts gone before they grow",
        image: photo(
            "gallery-eaves",
            1536,
            1024,
            "A technician removing webs from a home's eaves with an extension pole",
        ),
    },
    {
        caption: "Exclusion: gaps found and sealed, in the report with photos",
        image: photo(
            "gallery-exclusion",
            1536,
            1024,
            "A close-up of a sealed utility gap at a home's foundation, mortar still fresh",
        ),
    },
]

export const about = {
    headline: "A tech you'd wave in from the porch.",
    photo: photo(
        "crew",
        1024,
        1536,
        "Two Basalt Pest Control technicians with a sprayer and inspection kit beside their truck",
    ),
    paragraphs: [
        "Basalt started in 2014 when founder Ray Delgado — a state inspector for nine years first — got tired of watching companies spray and pray. His rule became the company's: find how they're getting in, close it, and treat the barrier. The spraying is the last step, not the plan.",
        "Every tech is an employee — never a contractor — an Oregon-licensed applicator, background-checked, and trained to inspect before they treat. You get the same tech every visit, and after each one, a written report with photos of what was found, treated, and sealed.",
        "We use targeted, EPA-registered products applied kid- and pet-conscious — exterior-first, interior only where needed — and we stand behind every visit: pests back between treatments, and we re-treat free within 48 hours.",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "OR licensed applicators",
        "Bonded & insured",
        "Employees, not contractors",
        "Kid- & pet-conscious products",
        "48-hour re-treat guarantee",
    ],
}

export interface ThreadMessage {
    /** The bubble's text, as the message was sent. */
    text: string
    /** `start`: the house manager (left); `end`: you (right). */
    side: "start" | "end"
    /** The bubble's time label, e.g. "2:14 pm"; "" for none. */
    time: string
    /** A photo attached to the bubble. */
    photo?: SiteImage
    /** A small confirmation chip, e.g. "Confirmed". */
    chip?: string
    /** The plain-language line beside the thread for this message. */
    note: string
}

/**
 * A day in the life, as a text thread with the house manager — the home
 * page's conversation (steps `message-thread`). Empty `messages` drops
 * the section.
 */
export const thread: {
    kicker: string
    title: string
    intro: string
    /** The thread's header: who you're talking to. */
    name: string
    detail: string
    messages: ThreadMessage[]
} = {
    kicker: "",
    title: "",
    intro: "",
    name: "",
    detail: "",
    messages: [],
}

export interface SeasonWindow {
    /** The column's head, e.g. "DEC–APR". */
    label: string
    /** The calendar months (1–12) the window covers — the current one is marked. */
    months: number[]
    title: string
    detail: string
}

/**
 * The year of service, window by window — the home page's season
 * calendar (schedule `week-grid`). Empty `windows` drops the section.
 */
export const season: {
    kicker: string
    title: string
    intro: string
    windows: SeasonWindow[]
    /** One line under the calendar; "" for none. */
    note: string
} = {
    kicker: "",
    title: "",
    intro: "",
    windows: [],
    note: "",
}

export const faq = [
    {
        question: "Is the treatment safe for kids and pets?",
        answer: "We treat exterior-first with targeted, EPA-registered products and go inside only where a problem calls for it. Your tech tells you the re-entry window for anything applied — usually under an hour — and it's in the written report too.",
    },
    {
        question: "Do I get the same tech every time?",
        answer: "Yes — you're assigned a licensed tech who learns your property's pressure points: the pine border, the crawl space vent, the garage gap. Substitutions only happen for illness or vacation, and we tell you in advance.",
    },
    {
        question: "Do I need to be home?",
        answer: "Not for exterior visits, which is most of them. You get a text when your tech arrives, a written report with photos when they're done, and a knock first if anything needs interior attention.",
    },
    {
        question: "What if pests come back between visits?",
        answer: "We come back and re-treat free within 48 hours — that's the guarantee, in writing on every plan. Recurring pressure between visits usually means a new entry point, and finding it is on us.",
    },
    {
        question: "What pests are covered?",
        answer: "The plans cover the Central Oregon regulars: ants, spiders, wasps, earwigs, box elder bugs, and mice. Termites, bed bugs, and stinging-insect nests inside walls are quoted separately after an inspection — we'll always tell you which is which before any work.",
    },
    {
        question: "Can I skip or reschedule a visit?",
        answer: "Any time up to noon the day before, free. Skipping a barrier renewal stretches the protection thin, so your tech will suggest the next best date — but it's always your call.",
    },
]

/**
 * The appointments contract's code fallback (the base module's structural
 * twin — see ServicesRecurring/content.ts). The remix catalog reseeds
 * `content.appointments` to mirror this export, so the composed template's
 * booking widget and Manage editor open on the pest company's own
 * provider, not the base cleaner's.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "walkthrough",
            name: "Inspection walkthrough",
            durationMinutes: 45,
            description:
                "A walk of the home and grounds together — we find how they're getting in and quote a flat rate.",
        },
        {
            typeId: "first-service",
            name: "First service visit",
            durationMinutes: 120,
            description:
                "The first full treatment — entry points closed, barrier laid, so the standing schedule holds.",
        },
    ],
    providers: [
        {
            providerId: "ray-delgado",
            name: "Ray Delgado",
            windows: [
                { day: 1, start: 9 * 60, end: 15 * 60 },
                { day: 2, start: 9 * 60, end: 15 * 60 },
                { day: 3, start: 9 * 60, end: 15 * 60 },
                { day: 4, start: 9 * 60, end: 15 * 60 },
                { day: 5, start: 9 * 60, end: 15 * 60 },
            ],
        },
    ],
}

/** The /book page's booking strip — the slot picker above the form. */
export const booking: {
    headline: string
    intro: string
    statusLabels: { new: string; returning: string }
    /** The line under the slot picker; omit it for the widget's default. */
    privacyNote?: string
} = {
    headline: "Pick your first visit",
    intro: "Book the walkthrough or your first treatment directly — pick a time and you'll get a confirmation with a one-click cancel link. Prefer to write first? The form below reaches the same techs.",
    /** The new/returning select's trade voice (the widget's statusLabels). */
    statusLabels: { new: "First time working together", returning: "We've worked together before" },
}

export const book = {
    headline: "Evict them for good.",
    body: "Tell us about your home and what you're seeing — ants in the kitchen, wasps under the eaves, or nothing yet and you'd like to keep it that way — and we'll reply the same day with a flat quote and your tech's first opening.",
    confirmation:
        "Thank you — your request is in. We reply the same business day with a flat quote and the first opening for your home.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "phone", label: "Phone", type: "tel" as const, required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        { name: "address", label: "Home address", required: true },
        { name: "size", label: "Property", placeholder: "City lot, half acre, backs to pines …" },
        {
            name: "frequency",
            label: "What are you after?",
            placeholder: "Quarterly plan, monthly plan, one-time problem",
        },
        {
            name: "notes",
            label: "What are you seeing?",
            type: "textarea" as const,
            fullWidth: true,
            placeholder: "Ants in the kitchen, wasps on the deck, mice in the garage …",
        },
    ],
}
