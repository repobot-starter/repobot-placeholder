/**
 * The emergency-services pack's single content file: the business, its
 * services, and pages. Everything the site renders comes from here — edit
 * this file (not the page components) to make the site yours. The demo
 * business is a plumber, but the shape fits any dispatch trade: electrician,
 * HVAC, locksmith, towing — swap the services and copy and the site follows.
 *
 * This is the `services` category's emergency/dispatch shape: the sell is
 * speed and trust, not a portfolio. The hero is a full-bleed photograph of
 * the owner on the job with the call, a live on-call status, and the
 * prices painted on a board right on it; a real job report shows the
 * quote matching the invoice, and "how it works" is the text thread the
 * customer actually gets.
 *
 * Several sections are content-driven: `home.heroImage` makes the hero a
 * full-bleed photograph (without it the text thread sits beside the
 * headline); `priceBoard.items` hangs the hero price board — and while it
 * does, the home skips the services grid and full price book (both live on
 * /services); `home.seal` stamps a roundel on the hero and `home.readout`
 * sets a monumental figure over the headline ("" = none); an empty
 * `jobReports.items` drops the report; an empty `onCall.week` shows
 * `business.dispatchBadge` instead of the live status.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/services-emergency` (see PACK.md). The `photo` helper
 * mirrors that verb's naming exactly. Never point a slot at a raw camera
 * file.
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
        src: `/services-emergency-van/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/services-emergency-van/${name}-${step}w.webp`, width: step })),
    }
}

export const business = {
    name: "Straight Pipe Plumbing",
    tagline: "Flat-rate plumbing, on call 24/7",
    location: "Pasadena, California",
    /** Shown everywhere the number appears; `phoneHref` is the tap target.
     * On a dispatch site this number IS the product — it never leaves the
     * viewport (hero, nav CTA, banner, footer). */
    phone: "(626) 555-0148",
    phoneHref: "tel:+16265550148",
    email: "hello@straightpipeplumbing.example",
    address: "1847 E Colorado Blvd, Pasadena, CA 91107",
    /** The license line — rendered wherever trust is being earned. */
    license: "CSLB Lic. #1084217 · C-36 Plumbing · Bonded & insured", // theme-exempt: license number, not a color
    /** The always-on promise, worn as the hero badge when `onCall.week` is
     * empty. Lives on `business` (not a bare string export) because the
     * content service edits a slot by walking an exported object/array
     * literal — a top-level string export is read-only in the panel. */
    dispatchBadge: "Flat-rate plumbing · on call 24/7",
}

export const hoursNote = "Office texts back 7 AM–9 PM"

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
    week: [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, intervals: [[0, 24 * 60]] })),
    typicalArrival: "Avg. arrival 38 min",
}

/** The neighborhoods a truck actually reaches inside the arrival average. */
export const serviceArea = [
    "Pasadena",
    "Altadena",
    "South Pasadena",
    "San Marino",
    "Eagle Rock",
    "La Cañada Flintridge",
    "Sierra Madre",
]

/**
 * Landing copy the trade owns: the few strings the landing module renders
 * that would read wrong for a different trade. Remix seeds retrade these
 * along with the rest of the content — everything else in the landing
 * module is trade-neutral on purpose.
 */
export const landingCopy = {
    /** The services-grid heading (the home carries the grid when the hero
     * has no price board). */
    servicesHeading: "Drains, heaters, leaks — handled",
    /** The home page's closing call-out — the emergency hook itself. */
    finalCtaTitle: "Water where it shouldn't be?",
    /** The closing call-out's line under the title ("" = the 24/7 line and office hours). */
    finalCtaBody: "",
    /** The closing call-out's ask: a label sends it to the request page ("" = call the line). */
    finalCtaAsk: "",
    /** The label over the service-area names. */
    serviceAreaLabel: "On call across",
    /** A small line under the nav wordmark ("" = the wordmark alone). */
    navTagline: "Pasadena, California",
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
 * page when the hero carries no price board). Print real numbers: the
 * site's whole argument is that the price on this page is the price on the
 * invoice. An empty `items` list drops it.
 */
export const priceBook: PriceBook = {
    title: "Straight Pipe price book",
    intro: "All flat-rate. No surprise upcharges. Ever.",
    items: [
        {
            group: "Drains & leaks",
            name: "Clear a drain",
            note: "Sink, tub, or shower",
            price: "$189",
            qualifier: "",
        },
        {
            group: "Drains & leaks",
            name: "Fix a leak under the sink",
            note: "Supply lines, trap, or shutoff",
            price: "$165",
            qualifier: "",
        },
        {
            group: "Drains & leaks",
            name: "Main line clearing",
            note: "Camera check included",
            price: "$345",
            qualifier: "from",
        },
        {
            group: "Drains & leaks",
            name: "Leak detection",
            note: "Without opening five walls",
            price: "$295",
            qualifier: "",
        },
        {
            group: "Fixtures, heaters & after hours",
            name: "Replace a toilet",
            note: "Standard toilet supplied",
            price: "$425",
            qualifier: "",
        },
        {
            group: "Fixtures, heaters & after hours",
            name: "Water heater, 50 gal, installed",
            note: "Permit, seismic straps, haul-away",
            price: "$1,850",
            qualifier: "",
        },
        {
            group: "Fixtures, heaters & after hours",
            name: "Faucet swap",
            note: "Your faucet or ours",
            price: "$235",
            qualifier: "",
        },
        {
            group: "Fixtures, heaters & after hours",
            name: "Emergency call, any hour",
            note: "Credited to the repair",
            price: "$95",
            qualifier: "",
        },
    ],
    footnote: "Flat rate means the quote is the price — at noon or at 3 AM.",
    ctaLabel: "Get an exact quote",
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
 * The price board painted on the hero photograph — five or so headline
 * prices from the price book, in sign-writer shorthand. An empty `items`
 * list takes the board off the hero (and puts the services grid and full
 * price book back on the home page).
 */
export const priceBoard: PriceBoard = {
    title: "Upfront pricing.",
    items: [
        { name: "Drains", price: "$189", qualifier: "" },
        { name: "Toilets", price: "$425", qualifier: "" },
        { name: "Water heaters", price: "$1,850", qualifier: "" },
        { name: "Leaks", price: "$165", qualifier: "" },
        { name: "Night calls", price: "$95", qualifier: "" },
    ],
    footnote: "Same price at 3 AM.",
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
 * and the final side by side are the proof the price book is honest. An
 * empty `items` list drops the section.
 */
export const jobReports: JobReports = {
    kicker: "Job reports",
    headline: "Every job gets a report.",
    body: "What we found, what we quoted, what you paid, and photos of before and after — texted to you before the van leaves. Same number twice. That's the point.",
    items: [
        {
            jobNumber: "4127",
            title: "Water heater swap",
            location: "Bungalow Heaven, Pasadena",
            diagnosed: "Failed 40-gal tank, sediment + leaking base",
            quoted: "$1,680",
            final: "$1,680",
            timeOnSite: "3h 10m",
            stamp: "Quote = final",
            before: photo(
                "report-waterheater-before",
                864,
                1152,
                "A rusted, leaking water heater with corroded pipes in a garage corner",
            ),
            after: photo(
                "report-waterheater-after",
                864,
                1152,
                "A new white water heater with fresh copper and brass fittings, strapped and labeled",
            ),
            tech: "Luis Ortega",
            techDetail: "Lic. #1084217 · C-36", // theme-exempt: license number, not a color
        },
    ],
}

export interface Service {
    slug: string
    title: string
    /** Small uppercase label on the card, e.g. the sub-trade. */
    eyebrow: string
    description: string
    /** "From $189" / "Camera check included" — flat, printed, no meter. */
    priceNote: string
    image: SiteImage
}

export const services: Service[] = [
    {
        slug: "emergency",
        title: "Emergencies",
        eyebrow: "Any hour",
        description:
            "Burst pipe, backed-up sewer, no water at all — call any hour and a licensed plumber heads your way. The price book doesn't change after dark.",
        priceNote: "$95 any hour",
        image: photo(
            "van-pasadena",
            1280,
            720,
            "A white Straight Pipe van parked on a tree-lined Pasadena street with purple jacaranda in bloom",
        ),
    },
    {
        slug: "drains",
        title: "Drain clearing",
        eyebrow: "Drains & sewer",
        description:
            "Kitchen, bath, and main-line stoppages cleared properly — not just poked until the water goes down for a week.",
        priceNote: "From $189",
        image: photo(
            "service-drains",
            1536,
            1024,
            "A technician feeding a drain machine cable into a cleanout fitting",
        ),
    },
    {
        slug: "water-heaters",
        title: "Water heaters",
        eyebrow: "Install & repair",
        description:
            "Tank and tankless. Repairs when a repair makes sense, a straight answer when it doesn't — permit, seismic straps, and haul-away included.",
        priceNote: "From $1,850",
        image: photo(
            "service-water-heaters",
            1536,
            1024,
            "A new water heater installed in a garage utility corner with clean copper connections",
        ),
    },
    {
        slug: "leaks",
        title: "Leaks & valves",
        eyebrow: "Repair",
        description:
            "Dripping shutoffs, weeping supply lines, the mystery wet spot on the ceiling. We find it, photograph it, and quote it before touching it.",
        priceNote: "From $165",
        image: photo(
            "thread-valve",
            1152,
            864,
            "A close-up of a green-crusted, corroded shutoff valve under a sink, lit by a flashlight",
        ),
    },
    {
        slug: "fixtures",
        title: "Toilets & faucets",
        eyebrow: "Kitchen & bath",
        description:
            "New toilet, new faucet, a shower valve that finally works. Installed level, sealed right, and the old one hauled off.",
        priceNote: "Toilets $425",
        image: photo(
            "service-bathroom",
            1152,
            864,
            "A bright, freshly tiled bathroom with a new toilet and chrome fixtures",
        ),
    },
    {
        slug: "sewer",
        title: "Sewer line service",
        eyebrow: "Drains & sewer",
        description:
            "Camera first, digging last. You watch the footage with us before anyone says the word trench — older Pasadena clay lines included.",
        priceNote: "From $345",
        image: photo(
            "service-sewer",
            1536,
            1024,
            "A sewer camera monitor showing pipe footage beside an open cleanout",
        ),
    },
]

/** The status strip under the job report. Keep values short and big. */
export const metrics = [
    { value: "24/7", label: "on call, nights & weekends" },
    { value: "38 min", label: "average arrival, last 90 days" },
    { value: "Quote = price", label: "no surprise upcharges" },
]

export const testimonials = [
    {
        quote: "The quote said $240. The receipt said $240. I got a text with photos of the old valve before I'd even found my wallet. I'm a little in love.",
        name: "Priya Raman",
        detail: "Shutoff valve, Altadena",
    },
    {
        quote: "Our water heater died on a Sunday night. Luis was here in forty minutes, showed us the price book on his phone, and had hot water back by midnight. Same price as a Tuesday.",
        name: "Marcus & Jen Whitfield",
        detail: "Water heater, South Pasadena",
    },
    {
        quote: "I manage a 1920s fourplex in Bungalow Heaven. Straight Pipe is the only plumber whose invoice I don't have to argue with — the job report makes my owner happy, too.",
        name: "Dolores Ybarra",
        detail: "Property manager, Pasadena",
    },
]

export interface HomeContent {
    headline: string
    subheadline: string
    /** Optional (null = none): the full-bleed hero photograph. Without it
     * the text thread sits beside the headline. Kept as a key so the
     * editor can fill it. */
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
    headline: "The price is the price.",
    subheadline:
        "Flat-rate plumbing across Pasadena. We find the problem, text you one flat quote with a photo, and that's what you pay — at noon or at 3 AM.",
    heroImage: photo(
        "hero-luis-van",
        2160,
        1350,
        "Luis Ortega, arms crossed and grinning, leaning on his purple Straight Pipe van on a Pasadena street under blooming jacaranda, the San Gabriel Mountains behind",
    ),
    seal: "On call\n24/7",
    readout: { value: "", note: "" },
    credit: "",
}

export const about = {
    headline: "Hi, I'm Luis. I answer the phone.",
    photo: photo(
        "luis-portrait",
        1152,
        864,
        "Luis Ortega, owner of Straight Pipe Plumbing, smiling beside his van in a Pasadena driveway",
    ),
    paragraphs: [
        "I spent eleven years plumbing for other shops around the San Gabriel Valley, watching customers flinch at invoices that had nothing to do with the estimate. In 2019 I started Straight Pipe with one rule: the price you're quoted is the price you pay.",
        "So we print our prices. Every job starts with a diagnosis and one flat quote — sent by text, with a photo of what we found — and nothing starts until you say yes. When the job's done you get a report: before and after photos, what we fixed, what it cost.",
        "Today there are four of us, all licensed, all local. Nights and weekends cost the same as Tuesday at noon, because a burst pipe doesn't check the calendar.",
    ],
    /** The checked lines under the story (after the license line). */
    bullets: [
        "Printed flat prices — no hourly meter, no after-hours upcharge",
        "One flat quote by text, with a photo, before any work starts",
        "A job report with before-and-after photos on every job",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "CSLB Lic. #1084217", // theme-exempt: license number, not a color
        "C-36 Plumbing",
        "Bonded & insured",
        "Permits pulled by us",
        "1-year labor warranty",
    ],
}

/**
 * How it works. With a hero photograph the text thread moves down here:
 * each message becomes a step (its bubble) and the step at the same
 * position supplies the walkthrough under it; without one, these read as
 * four numbered steps.
 */
export const steps = {
    kicker: "How it works",
    title: "Your whole job, in one text thread.",
    items: [
        {
            title: "You call or text",
            description:
                "A real person picks up, day or night, and the closest licensed plumber heads over. We text you when we're rolling.",
        },
        {
            title: "We text a flat quote",
            description:
                "We find the problem and text you one price for the whole job, with a photo of what we found. Nothing starts until you say yes.",
        },
        {
            title: "You approve it",
            description:
                "Approve by text or in person. The number doesn't move if the job runs long or the part fights back.",
        },
        {
            title: "Fixed, with a report",
            description:
                "We fix it, test it, clean up, and text you photos and the receipt. What we quoted is what you paid.",
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
    name: "Straight Pipe",
    detail: "Pasadena, CA",
    messages: [
        { text: "Luis is on the way — about 25 minutes out.", side: "end", time: "10:28 AM" },
        {
            text: "Found it: a corroded shutoff valve. Flat quote $240 to replace it. Approve?",
            side: "end",
            time: "10:34 AM",
            photo: photo(
                "thread-valve",
                1152,
                864,
                "A close-up of a green-crusted, corroded shutoff valve under a sink, lit by a flashlight",
            ),
        },
        { text: "Yes — go ahead!", side: "start", time: "10:35 AM", chip: "Approved" },
        {
            text: "All done. Photos, receipt, and your job report are attached — $240, as quoted.",
            side: "end",
            time: "10:47 AM",
        },
    ],
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
 * figure, over a summary line. A picture of a real night, labeled as one,
 * never a live tracker. Filled rows put the board in place of the home's
 * metrics strip; an empty `rows` list keeps the strip.
 */
export const dispatchBoard = {
    label: "",
    rows: [] as DispatchRow[],
    /** The line under the board: "Crews available now: 6 · Average arrival 43 min" ("" = none). */
    summary: "",
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
    kicker: "",
    title: "",
    items: [] as Restoration[],
}

export interface IntakeChoice {
    label: string
    /** A marketing icon name: "droplet", "flame", "storm", "spores", … */
    icon: string
}

/**
 * The hero's intake card over the photograph ("What happened?"): the kind
 * of job as tap-to-pick tiles, one short extra field (a ZIP code; "" name
 * = none), the callback contact, and the ask. A filled `cta` with a hero
 * photograph sets the hero as the form over the photograph; "" keeps the
 * call buttons.
 */
export const intake = {
    title: "",
    choices: [] as IntakeChoice[],
    field: { name: "", label: "", placeholder: "" },
    contact: "tel" as "tel" | "email",
    placeholder: "",
    cta: "",
    confirmation: "",
}

export const faq = [
    {
        question: "Is the price on the site really the price?",
        answer: "Yes. The price book is what we charge — the quote we text you on site is the number on your receipt. If a job turns out bigger than we thought, we stop and send a new quote before doing anything extra. You never find out at the end.",
    },
    {
        question: "What if my job isn't in the price book?",
        answer: "We diagnose it and text you one flat price for the whole job — parts, labor, cleanup — with a photo of the problem. No hourly meter, no \"we'll see.\" Approve it and it's locked.",
    },
    {
        question: "Do nights and weekends cost more?",
        answer: "No. The $95 call-out is the same at any hour, and it's credited to the repair. A burst pipe at 3 AM costs what it costs at noon.",
    },
    {
        question: "How fast can you get here?",
        answer: "Our average arrival across Pasadena and the nearby neighborhoods has been 38 minutes over the last 90 days. That's an average, not a promise — when you call we'll tell you honestly how far out the closest plumber is.",
    },
    {
        question: "Are you licensed? Do you pull permits?",
        answer: "Yes — CSLB license #1084217, C-36 Plumbing, bonded and insured. When a job needs a permit (water heaters usually do), we pull it and it's already in the price.", // theme-exempt: license number, not a color
    },
    {
        question: "Is the work guaranteed?",
        answer: "Every repair carries a one-year labor warranty, written on your job report. Parts and fixtures we supply carry the manufacturer's warranty. If our fix fails, we come back free.",
    },
]

/**
 * The appointments contract's code fallback — the same booking mode 2 the
 * care pack runs (web/app/src/View/Landing/practiceDocument.ts): visit
 * types x weekly availability windows, projected into concrete capacity-1
 * slots by `generateAppointmentSlots`. The catalog's `content.appointments`
 * seed mirrors this export exactly (the content tests pin the twin).
 *
 * The dispatch trade books what can WAIT: a scheduled repair visit and a
 * walkthrough for a bigger job's flat quote. True emergencies never touch
 * the calendar — the 24/7 line owns those, and the copy keeps saying so.
 * One provider — the owner runs the scheduled work — with weekday
 * windows inside office hours.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "repair-visit",
            name: "Scheduled repair visit",
            durationMinutes: 90,
            description:
                "For a drip, a slow drain, or a running toilet — anything that can wait for a time that suits you.",
        },
        {
            typeId: "flat-quote-walkthrough",
            name: "Flat-quote walkthrough",
            durationMinutes: 45,
            description:
                "For bigger jobs — a water heater, a repipe, a bathroom. We look, then text you one flat price.",
        },
    ],
    providers: [
        {
            providerId: "luis-ortega",
            name: "Luis Ortega",
            windows: [
                { day: 1, start: 8 * 60, end: 16 * 60 },
                { day: 2, start: 8 * 60, end: 16 * 60 },
                { day: 3, start: 8 * 60, end: 16 * 60 },
                { day: 4, start: 8 * 60, end: 16 * 60 },
                { day: 5, start: 8 * 60, end: 16 * 60 },
            ],
        },
    ],
}

/** The /request page's booking strip — the slot picker above the form. */
export const booking = {
    headline: "Book a visit",
    intro: "For anything that can wait, pick a time — you'll get a text to confirm and a one-tap cancel link. Water on the floor right now? Skip the calendar and call.",
    /** The new/returning select's trade voice (the widget's statusLabels). */
    statusLabels: { new: "First time with Straight Pipe", returning: "We've been out before" },
    /** The small print under the booking form: what happens to the details. */
    privacyNote:
        "Your number is only for this visit — the confirmation text, the flat quote, and the job report. Luis's office never sells or shares it.",
}

export const request = {
    headline: "Get an exact quote.",
    body: "Tell us what's going on and we'll text back a flat price — usually within the hour, 7 AM to 9 PM. Water on the floor right now? Don't fill in a form — call, it's answered 24/7.",
    confirmation:
        "Got it. We'll text you a flat quote shortly (7 AM–9 PM). If it turns urgent, call — a person answers 24/7.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "phone", label: "Mobile (we'll text the quote)", type: "tel" as const, required: true },
        { name: "email", label: "Email", type: "email" as const },
        { name: "address", label: "Service address", required: true },
        {
            name: "issue",
            label: "What's going on?",
            placeholder: "Slow drain, leaking valve, no hot water …",
        },
        { name: "timing", label: "When works?", placeholder: "Today, this week, whenever …" },
        {
            name: "message",
            label: "Anything else? (Photos help — you can text them after.)",
            type: "textarea" as const,
            fullWidth: true,
        },
    ],
}
