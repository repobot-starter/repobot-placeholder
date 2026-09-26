/**
 * Remix seed — Bayou Restoration, the water-and-storm restoration derived
 * template of the emergency-services pack (packs/services-emergency-bayou).
 * A structural twin of `content.ts`: the composer copies this file over the
 * pack's content module byte-for-byte, so every export, interface, and
 * helper below must keep the base module's shape (the remix-seed tests pin
 * the twin). Everything the site renders still comes from here.
 *
 * The hero is the intake itself — "What happened?" over the storm photo
 * (`intake`) — then the dispatch board from a storm night (`dispatchBoard`,
 * labeled as the night it was, never a live tracker), the four steps from
 * the call to the insurance file, and the same room before and after
 * (`restorations`).
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/services-emergency-bayou`. The `photo` helper mirrors
 * that verb's naming exactly.
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
        src: `/services-emergency-bayou/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({
            src: `/services-emergency-bayou/${name}-${step}w.webp`,
            width: step,
        })),
    }
}

export const business = {
    name: "Bayou Restoration",
    tagline: "24/7 water, fire and storm restoration",
    location: "Houston, Texas",
    /** Shown everywhere the number appears; `phoneHref` is the tap target.
     * On a dispatch site this number IS the product — it never leaves the
     * viewport (hero, nav CTA, banner, footer). */
    phone: "(713) 555-0199",
    phoneHref: "tel:+17135550199",
    email: "dispatch@bayourestoration.example",
    address: "2710 Navigation Blvd, Houston, TX 77003",
    /** The license line — rendered wherever trust is being earned. */
    license: "IICRC-certified firm · TX mold remediation contractor #RMC-1187 · Fully insured", // theme-exempt: license number, not a color
    /** The dispatch promise, worn as the hero badge. A 24/7 line has no
     * open/closed state to compute — the badge is the always-on claim
     * itself. Lives on `business` (not a bare string export) because the
     * content service edits a slot by walking an exported object/array
     * literal — a top-level string export is read-only in the panel. */
    dispatchBadge: "24/7 · a dispatcher answers",
}

export const hoursNote = "Dispatch 24/7 · Office Monday–Saturday 8 AM–6 PM"

export interface OnCall {
    /** When a tech is on call, in the shared hours engine's shape (0 =
     * Sunday, minutes since midnight). Every day `[[0, 1440]]` reads as
     * 24/7. Empty hides the live status and shows `business.dispatchBadge`. */
    week: DayHours[]
    /** An honest typical, never a live promise — this is a measured
     * average, not a tracker. */
    typicalArrival: string
}

/** The hero's status pill: computed from `week` against the visitor's clock. */
export const onCall: OnCall = {
    week: [],
    typicalArrival: "",
}

/** The towns a truck actually reaches inside the response promise. */
export const serviceArea = [
    "The Heights",
    "Bellaire",
    "Katy",
    "Montrose",
    "Meyerland",
    "Pearland",
    "Kingwood",
]

/**
 * Landing copy the trade owns: the few strings the landing module renders
 * that would read wrong for a different trade. Remix seeds retrade these
 * along with the rest of the content — everything else in the landing
 * module is trade-neutral on purpose.
 */
export const landingCopy = {
    /** The home page's services-section heading. */
    servicesHeading: "Water, fire, storm, mold",
    /** The home page's closing call-out — the emergency hook itself. */
    finalCtaTitle: "Houston deserves calm after chaos.",
    /** The closing call-out's line under the title ("" = the 24/7 line and office hours). */
    finalCtaBody: "We restore homes. We ease burdens. Call or text anytime — a dispatcher answers 24/7.",
    /** The closing call-out's ask: a label sends it to the request page ("" = call the line). */
    finalCtaAsk: "",
    /** The label over the service-area names. */
    serviceAreaLabel: "Crews stationed across",
    /** A small line under the nav wordmark ("" = the wordmark alone). */
    navTagline: "",
}

export interface PriceBookItem {
    /** Items sharing a group print under one heading ("" = no heading). */
    group: string
    name: string
    /** A short aside under the name ("" = none). */
    note: string
    price: string
    /** A small word before the price, e.g. "from" ("" = none). */
    qualifier: string
}

export interface PriceBook {
    title: string
    intro: string
    items: PriceBookItem[]
    footnote: string
    ctaLabel: string
}

/**
 * The flat-rate price book — printed in full on /services (and on the home
 * page when the hero carries no price board). An empty `items` list drops
 * it.
 */
export const priceBook: PriceBook = {
    title: "What it costs, before the claim",
    intro: "Most jobs are billed to your insurer at the industry's standard rates, and we file it for you. Paying yourself? These are the starting points.",
    items: [
        {
            group: "",
            name: "Emergency water extraction",
            note: "One room, first visit",
            price: "$850",
            qualifier: "from",
        },
        {
            group: "",
            name: "Structural drying",
            note: "Equipment and daily moisture logs",
            price: "$320 / day",
            qualifier: "from",
        },
        {
            group: "",
            name: "Emergency board-up or roof tarp",
            note: "Same night",
            price: "$450",
            qualifier: "from",
        },
        {
            group: "",
            name: "Mold inspection & air test",
            note: "Written report in 48 hours",
            price: "$395",
            qualifier: "",
        },
    ],
    footnote: "Insurance claims: no money up front beyond your deductible.",
    ctaLabel: "Request an inspection",
}

export interface PriceBoardItem {
    /** Short, like it's painted on a van door: "Drains", "Night calls". */
    name: string
    price: string
    /** A small word before the price, e.g. "from" ("" = none). */
    qualifier: string
}

export interface PriceBoard {
    title: string
    items: PriceBoardItem[]
    footnote: string
}

/**
 * The price board painted on a full-bleed hero photograph — five or so
 * headline prices in sign-writer shorthand. An empty `items` list keeps the
 * photograph beside the headline and the services grid on the home page.
 */
export const priceBoard: PriceBoard = {
    title: "",
    items: [],
    footnote: "",
}

export interface JobReport {
    jobNumber: string
    title: string
    location: string
    diagnosed: string
    quoted: string
    final: string
    timeOnSite: string
    /** The rubber stamp across the card ("" = none). */
    stamp: string
    before: SiteImage
    after: SiteImage
    tech: string
    techDetail: string
}

export interface JobReports {
    kicker: string
    headline: string
    body: string
    items: JobReport[]
}

/**
 * Real jobs, documented. The home page shows the first report — the quote
 * and the final side by side. An empty `items` list drops the section.
 */
export const jobReports: JobReports = {
    kicker: "",
    headline: "",
    body: "",
    items: [],
}

export interface Service {
    slug: string
    title: string
    /** Small uppercase label on the card, e.g. the sub-trade. */
    eyebrow: string
    description: string
    /** "From $149" / "Camera inspection $249" — flat, printed, no meter. */
    priceNote: string
    image: SiteImage
}

export const services: Service[] = [
    {
        slug: "water",
        title: "Water damage",
        eyebrow: "24/7",
        description:
            "Burst pipes, flooded slabs, a storm through the ceiling — extraction the same night, then structural drying with a moisture log for every room.",
        priceNote: "Extraction from $850",
        image: photo(
            "service-water",
            1600,
            1200,
            "Air movers and a dehumidifier drying a flood-cut living room while a technician takes a moisture reading",
        ),
    },
    {
        slug: "fire",
        title: "Fire & smoke",
        eyebrow: "Cleanup",
        description:
            "Soot and smoke cleaned from every surface, odor treated at the source, and contents inventoried for the adjuster before anything leaves the house.",
        priceNote: "Assessment free",
        image: photo(
            "service-fire",
            1600,
            1200,
            "A Bayou technician in a respirator wiping soot from white kitchen cabinets beside an air scrubber",
        ),
    },
    {
        slug: "storm",
        title: "Storm & roof tarping",
        eyebrow: "Same night",
        description:
            "Tarps, board-up and tree limbs off the roof before the next band comes through — the house dried in, photographed and ready for the claim.",
        priceNote: "Tarp from $450",
        image: photo(
            "service-storm",
            1600,
            1200,
            "Two Bayou technicians securing a blue tarp over a storm-damaged roof beside a fallen live oak limb",
        ),
    },
    {
        slug: "mold",
        title: "Mold remediation",
        eyebrow: "Contained",
        description:
            "Tested, contained under negative air, removed and cleared by an independent assessor — the way Texas law says it's done.",
        priceNote: "Air test $395",
        image: photo(
            "service-mold",
            1600,
            1200,
            "A technician in a white suit and respirator HEPA-vacuuming a wall cavity inside a plastic containment",
        ),
    },
]

/** The trust numbers — the dispatch strip. Keep values short and big. */
export const metrics = [
    { value: "6", label: "Crews on call every night" },
    { value: "43 min", label: "Average arrival" },
]

export const testimonials = [
    {
        quote: "The water heater let go in the attic at 1 AM. They were in the driveway by 1:40, extracting by two, and they handled every call with the insurance company after that.",
        name: "Marisol Treviño",
        detail: "Water damage, The Heights",
    },
    {
        quote: "After the derecho we had a limb through the roof and rain coming in. Bayou had it tarped that night and the adjuster had photos the next morning.",
        name: "Darnell & Keisha Watts",
        detail: "Storm tarp and drying, Bellaire",
    },
    {
        quote: "They told me exactly what my policy covered before they started, and they were right to the dollar.",
        name: "Hannah Lindqvist",
        detail: "Mold remediation, Meyerland",
    },
]

export interface HomeContent {
    headline: string
    subheadline: string
    /** Optional (null = none): the hero photograph — beside the headline,
     * or full-bleed under a price board. Kept as a key so the editor can
     * fill it. */
    heroImage: SiteImage | null
    /** A painted roundel on the hero; a line break splits the small top
     * line from the big one ("" = none). */
    seal: string
    /** A monumental figure over the headline ("115°") and a short script
     * note under it ("72° inside") — a brand statement, never a live
     * reading ("" value = none). */
    readout: { value: string; note: string }
    /** Tracked caps under a full-bleed headline — the line and the promise
     * ("" = none). */
    credit: string
}

export const home: HomeContent = {
    headline: "Calm arrives in 45 minutes",
    subheadline: "24/7 water, fire and storm damage restoration across Houston.",
    heroImage: photo(
        "hero-storm-porch",
        2400,
        1350,
        "Two Bayou technicians carrying a hose line and an equipment case toward a lit porch after a Houston storm at blue hour",
    ),
    seal: "",
    readout: { value: "", note: "" },
    credit: "",
}

export const about = {
    headline: "Neighbors first, then a restoration company.",
    photo: photo(
        "about-founder",
        1600,
        1200,
        "Renée Boudreaux, Bayou's founder, laughing with a young couple on their porch steps, an extraction hose slung over her shoulder",
    ),
    paragraphs: [
        "Renée Boudreaux started Bayou the week after her own house on Brays Bayou took on two feet of water. The contractor she called came three days later. She decided nobody on her street would wait that long again.",
        "Today six crews are on call every night from four stations across Houston, every technician IICRC-certified and every truck stocked to extract, dry and tarp on the first visit.",
        "We photograph and log everything from the first minute, work directly with your insurer, and tell you what your policy covers before we start — not after.",
    ],
    /** The checked lines under the story (after the license line). */
    bullets: [
        "A dispatcher answers 24/7 — never a voicemail",
        "We file with your insurer and meet the adjuster on site",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "IICRC-certified firm",
        "TX RMC #1187", // theme-exempt: license number, not a color
        "Fully insured",
        "Four stations",
    ],
}

export const steps = {
    kicker: "From the call to the claim",
    title: "Four steps, one crew",
    items: [
        {
            title: "Arrive",
            description: "On site in 45 minutes or less, anywhere inside the loop and most of the suburbs.",
        },
        {
            title: "Extract",
            description:
                "Standing water out the same night with truck-mounted pumps — fast, and without tracking it through the house.",
        },
        {
            title: "Dry & document",
            description:
                "Industrial drying with daily moisture readings, every room photographed for the file.",
        },
        {
            title: "Insurance handled",
            description:
                "We work directly with your insurer, meet the adjuster, and send the paperwork you'd otherwise chase.",
        },
    ],
}

export interface HeroThreadMessage {
    text: string
    /** "end": the business's own (accent) bubble; "start": the customer's. */
    side: "start" | "end"
    time: string
    /** A photo attached to the message. */
    photo?: SiteImage
    /** A confirmation chip, e.g. "Approved". */
    chip?: string
}

export interface HeroThread {
    /** The conversation header — who the customer is texting. */
    name: string
    detail: string
    messages: HeroThreadMessage[]
}

/** One real job, start to finish, as the customer sees it: beside the
 * hero headline when there's no hero photograph, otherwise the "how it
 * works" thread. Empty `messages` → no thread. */
export const heroThread: HeroThread = {
    name: "",
    detail: "",
    messages: [],
}

export interface EstateSystem {
    /** The index code on the plate, e.g. "SYS-01". */
    code: string
    name: string
    /** The care interval, set after a slash under the name: "serviced every fall". */
    interval: string
    description: string
    image: SiteImage
}

/**
 * The systems index — the property's mechanical systems as specimen plates,
 * each coded and named with its care interval. When it has items the home
 * leads with it and the services grid and price book stay on /services.
 * An empty `items` list drops the section.
 */
export const systems = {
    kicker: "",
    title: "",
    items: [] as EstateSystem[],
}

export interface DispatchRow {
    /** Who and where: "Crew 4 · Heights". */
    crew: string
    /** What they're doing: "Arrived", "Drying". */
    status: string
    /** The figure in the accent: "38 min", "day 2" ("" = none). */
    value: string
}

/**
 * The dispatch board — crews on the board, each with its status and its
 * figure, over the metrics as a summary line. A picture of a real night,
 * labeled as one, never a live tracker. Filled rows switch the home's
 * metrics strip to the board; an empty `rows` list keeps the strip.
 */
export const dispatchBoard = {
    label: "Dispatch board · Houston · storm night, June 18",
    rows: [
        { crew: "Crew 4 · Heights", status: "Arrived", value: "38 min" },
        { crew: "Crew 2 · Bellaire", status: "Drying", value: "day 2" },
        { crew: "Crew 6 · Katy", status: "En route", value: "12 min" },
        { crew: "Crew 1 · Montrose", status: "Insurance filed", value: "" },
    ] as DispatchRow[],
    summary: "Crews on call tonight: 6 · Average arrival 43 min",
}

export interface Restoration {
    title: string
    location: string
    /** One line of scope: "Category 2 water, 3 rooms — dried in 4 days". */
    scope: string
    before: SiteImage
    after: SiteImage
}

/**
 * Before and after, from the same doorway — the home's comparison gallery.
 * An empty `items` list drops the section.
 */
export const restorations = {
    kicker: "Before & after",
    title: "The same room, eleven weeks apart",
    items: [
        {
            title: "Brays Bayou living room",
            location: "Meyerland",
            scope: "Two feet of floodwater — dried in 4 days, rebuilt in 11 weeks",
            before: photo(
                "restore-living-before",
                1600,
                1200,
                "A flooded living room with flood-cut drywall, a water line on the walls and a soaked sofa",
            ),
            after: photo(
                "restore-living-after",
                1600,
                1200,
                "The same living room restored with fresh white walls, a new oak floor and a grey sofa",
            ),
        },
    ] as Restoration[],
}

export interface IntakeChoice {
    label: string
    /** A marketing icon name: "droplet", "flame", "storm", "spores", … */
    icon: string
}

/**
 * The hero's intake card over the photograph ("What happened?"): the kind
 * of job as tap-to-pick chips, one callback field, and the ask. A filled
 * `cta` sets the hero as the form over the photograph; "" keeps the call
 * buttons.
 */
export const intake = {
    title: "What happened?",
    choices: [
        { label: "Water", icon: "droplet" },
        { label: "Fire", icon: "flame" },
        { label: "Storm", icon: "storm" },
        { label: "Mold", icon: "spores" },
    ] as IntakeChoice[],
    field: { name: "zip", label: "ZIP code", placeholder: "Enter ZIP code" },
    contact: "tel" as "tel" | "email",
    placeholder: "Phone for the callback",
    cta: "Send a crew",
    confirmation:
        "Got it — a dispatcher is calling you back within five minutes. If water is still coming in, call (713) 555-0199 now.",
}

export const faq = [
    {
        question: "Will my insurance cover this?",
        answer: "Most sudden water, fire and storm damage is covered; slow leaks and flood water usually aren't unless you carry flood insurance. We read your policy with you before we start, and we file the claim and meet the adjuster.",
    },
    {
        question: "How fast can you actually get here?",
        answer: "Our average arrival over the last twelve months was 43 minutes, from four stations across Houston. On big storm nights we triage by danger — active water and open roofs first — and tell you honestly when we'll be there.",
    },
    {
        question: "Do I have to pay up front?",
        answer: "On an insurance claim you pay your deductible and nothing else up front; we bill the insurer directly. Paying yourself, you get a written estimate before work begins.",
    },
    {
        question: "Are you certified?",
        answer: "Yes — Bayou is an IICRC-certified firm, every technician holds IICRC water-restoration certification, and we're a licensed Texas mold remediation contractor (#RMC-1187), fully insured.", // theme-exempt: license number, not a color
    },
    {
        question: "What should I do before you arrive?",
        answer: "Shut off the water at the main if you can do it safely, turn off power to wet rooms at the breaker, and move what you can off wet floors. Take photos. Don't use a household vacuum on water.",
    },
]

/**
 * The appointments contract's code fallback — the same booking mode 2 the
 * care pack runs (web/app/src/View/Landing/practiceDocument.ts): visit
 * types x weekly availability windows, projected into concrete capacity-1
 * slots by `generateAppointmentSlots`. The catalog's `content.appointments`
 * seed mirrors this export exactly (the content tests pin the twin).
 *
 * Restoration books what can wait: a mold inspection and the rebuild
 * walkthrough after drying. Water in the house never touches the calendar —
 * the dispatch line owns those.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "mold-inspection",
            name: "Mold inspection & air test",
            durationMinutes: 90,
            description:
                "A visual inspection, moisture mapping and air samples, with a written report in 48 hours.",
        },
        {
            typeId: "rebuild-walkthrough",
            name: "Rebuild walkthrough",
            durationMinutes: 60,
            description: "After drying: we walk the house with you and scope the rebuild for the claim.",
        },
    ],
    providers: [
        {
            providerId: "renee-boudreaux",
            name: "Renée Boudreaux",
            windows: [
                { day: 1, start: 9 * 60, end: 17 * 60 },
                { day: 2, start: 9 * 60, end: 17 * 60 },
                { day: 3, start: 9 * 60, end: 17 * 60 },
                { day: 4, start: 9 * 60, end: 17 * 60 },
                { day: 5, start: 9 * 60, end: 17 * 60 },
                { day: 6, start: 9 * 60, end: 13 * 60 },
            ],
        },
    ],
}

/** The /request page's booking strip — the slot picker above the form. */
export const booking = {
    headline: "Book an inspection",
    intro: "For a mold inspection or a rebuild walkthrough, pick a time. Water in the house right now? Don't book — call (713) 555-0199.",
    /** The new/returning select's trade voice (the widget's statusLabels). */
    statusLabels: { new: "First time with Bayou", returning: "You've worked with us before" },
    /** The small print under the booking form: what happens to the details. */
    privacyNote:
        "Just enough to hold the time. Policy numbers and claim details are taken by phone with your permission.",
}

export const request = {
    headline: "Tell us what happened.",
    body: "Water coming in right now? Call (713) 555-0199 — a dispatcher answers 24/7. For anything that can wait, send the details and the office calls back within the hour.",
    confirmation:
        "Got it — the office calls back within the hour. If water is still coming in, call (713) 555-0199 now.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "phone", label: "Phone", type: "tel" as const, required: true },
        { name: "email", label: "Email", type: "email" as const },
        { name: "address", label: "Property address", required: true },
        { name: "issue", label: "What happened?", placeholder: "Water, fire, storm, mold …" },
        {
            name: "timing",
            label: "Insurance carrier (optional)",
            placeholder: "If you've already opened a claim",
        },
        {
            name: "message",
            label: "Anything else we should know",
            type: "textarea" as const,
            fullWidth: true,
        },
    ],
}
