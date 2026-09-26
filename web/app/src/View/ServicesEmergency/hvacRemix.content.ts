/**
 * The HVAC remix seed: a complete, drop-in replacement for `./content.ts`
 * that retargets the emergency-services pack from the plumber to a
 * heating-and-cooling company — same dispatch shape, different trade. The
 * derived template `repobot-services-hvac` is composed from the
 * services-emergency pack with this file copied over `content.ts` and the
 * steel-teal brand overlay from `packs/services-hvac/catalog.json` merged
 * over the pack's utility blue.
 *
 * Because the copy is verbatim, this file must stay a structural twin of
 * `content.ts`: same exports, images under its own `/services-hvac/`
 * public directory. The parity test
 * (`tests/View/ServicesEmergency/remixSeeds.test.ts`) pins the export
 * surface against the real module, so the seed fails CI the moment the
 * pack's contract moves without it.
 *
 * The dispatch shape's optional sections ship empty here: an on-call
 * schedule (`onCall.week`), the hero price board, the flat-rate price
 * book, job reports, the hero text thread, and the hero's seal and
 * readout. Fill any of them and the builders render it — see
 * servicesEmergencyLanding.ts for what each one switches on.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/services-hvac` (see PACK.md). The `photo` helper mirrors
 * that verb's naming exactly. Never point a slot at a raw camera file.
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
        src: `/services-hvac/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/services-hvac/${name}-${step}w.webp`, width: step })),
    }
}

export const business = {
    name: "Three Sisters Heating & Air",
    tagline: "Emergency heating and cooling service",
    location: "Bend, Oregon",
    /** Shown everywhere the number appears; `phoneHref` is the tap target.
     * On a dispatch site this number IS the product — it never leaves the
     * viewport (hero, nav CTA, banner, footer). */
    phone: "(541) 555-0117",
    phoneHref: "tel:+15415550117",
    email: "dispatch@threesistershvac.example",
    address: "63020 Plateau Dr, Bend, OR 97701",
    /** The license line — rendered wherever trust is being earned. */
    license: "Licensed, bonded & insured — OR CCB #176254 · NATE-certified techs", // theme-exempt: license number, not a color
    /** The dispatch promise, worn as the hero badge. A 24/7 line has no
     * open/closed state to compute — the badge is the always-on claim
     * itself. Lives on `business` (not a bare string export) because the
     * content service edits a slot by walking an exported object/array
     * literal — a top-level string export is read-only in the panel. */
    dispatchBadge: "24/7 emergency dispatch — a person answers",
}

export const hoursNote = "Emergency line 24/7 · Office Monday–Friday 8 AM–5 PM"

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
export const serviceArea = ["Bend", "Redmond", "Sisters", "Tumalo", "Sunriver", "La Pine"]

/**
 * Landing copy the trade owns — mirrors the base module's `landingCopy`
 * so the landing module retrades its headings with the content.
 */
export const landingCopy = {
    /** The home page's services-section heading. */
    servicesHeading: "Heat, cool, and air — handled",
    /** The home page's closing call-out — the emergency hook itself. */
    finalCtaTitle: "Furnace out in a cold snap?",
    /** The closing call-out's line under the title ("" = the 24/7 line and office hours). */
    finalCtaBody: "",
    /** The closing call-out's ask: a label sends it to the request page ("" = call the line). */
    finalCtaAsk: "",
    /** The label over the service-area names. */
    serviceAreaLabel: "Trucks reach",
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
    title: "",
    intro: "",
    items: [],
    footnote: "",
    ctaLabel: "",
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
    /** "From $129" / "Tune-up $149" — flat, printed, no meter. */
    priceNote: string
    image: SiteImage
}

export const services: Service[] = [
    {
        slug: "emergency",
        title: "Emergency heat & AC",
        eyebrow: "24/7",
        description:
            "No heat in January, no cooling in a heat wave, a furnace making a noise it shouldn't — a live dispatcher answers around the clock and a certified tech rolls the same day.",
        priceNote: "No after-hours upcharge",
        image: photo(
            "service-emergency",
            1536,
            1024,
            "A heating company's van outside a snowy house at dusk, work lights on",
        ),
    },
    {
        slug: "furnaces",
        title: "Furnace repair & install",
        eyebrow: "Heating",
        description:
            "Gas and electric furnaces repaired same-day when parts allow, and replaced with right-sized high-efficiency units — permitted, commissioned, and hauled away.",
        priceNote: "Repairs from $189",
        image: photo(
            "service-furnace",
            1536,
            1024,
            "A technician servicing a high-efficiency furnace with the panel open",
        ),
    },
    {
        slug: "ac",
        title: "AC repair & install",
        eyebrow: "Cooling",
        description:
            "Central air diagnosed and repaired fast in season, and new systems sized to the house with a load calculation — not a guess off the old nameplate.",
        priceNote: "Repairs from $189",
        image: photo(
            "service-ac",
            1536,
            1024,
            "A new air-conditioning condenser installed on a level pad beside a house",
        ),
    },
    {
        slug: "heat-pumps",
        title: "Heat pumps & ductless",
        eyebrow: "Electrification",
        description:
            "Cold-climate heat pumps and ductless mini-splits that heat at -5°F and cool in August — sized, installed, and registered for every rebate you qualify for.",
        priceNote: "From $4,900 installed",
        image: photo(
            "service-heatpump",
            1536,
            1024,
            "A ductless mini-split head mounted high on a bedroom wall, remote in hand",
        ),
    },
    {
        slug: "maintenance",
        title: "Tune-ups & maintenance",
        eyebrow: "Prevention",
        description:
            "A 21-point seasonal tune-up that catches the $80 part before it becomes the $800 failure — priority scheduling for members, reminders handled by us.",
        priceNote: "Tune-up $149",
        image: photo(
            "service-tuneup",
            1536,
            1024,
            "A technician checking refrigerant gauges during a seasonal tune-up",
        ),
    },
    {
        slug: "air-quality",
        title: "Ducts & air quality",
        eyebrow: "Air",
        description:
            "Duct sealing and repair, filtration upgrades, and whole-home ventilation — for wildfire-smoke summers and the dust the high desert kicks up.",
        priceNote: "From $249",
        image: photo(
            "service-ducts",
            1536,
            1024,
            "A technician sealing a duct joint in a crawl space with mastic",
        ),
    },
]

/** The trust numbers — the dispatch strip. Keep values short and big. */
export const metrics = [
    { value: "Same day", label: "emergency response, in season" },
    { value: "24/7", label: "line answered by a person" },
    { value: "11,000+", label: "systems serviced" },
    { value: "4.9★", label: "average of 520 reviews" },
]

export const testimonials = [
    {
        quote: "Furnace died the night it hit nine degrees. A person answered at 10 PM, the tech was here by morning with the part on the truck, and the price didn't grow an 'emergency fee' on the invoice.",
        name: "Carol Britt",
        detail: "Emergency furnace repair, Bend",
    },
    {
        quote: "Everyone else quoted us the biggest heat pump they sold. Three Sisters ran a load calculation, quoted one size down with the math to prove it, and our power bill dropped by a third.",
        name: "Aaron & Lily Tsang",
        detail: "Heat pump install, Redmond",
    },
    {
        quote: "They've maintained the furnaces in our forty rental units for years. Tune-ups happen on schedule without us chasing them, and tenants get a text with the tech's name before every visit.",
        name: "Deb Norquist",
        detail: "Property manager, Bend",
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
    headline: "No heat? No cool? No waiting.",
    subheadline:
        "Emergency heating and cooling service across Central Oregon — a live dispatcher answers 24/7 and a NATE-certified tech is out the same day, with the price quoted flat before the work starts.",
    heroImage: photo(
        "hero-01",
        1536,
        1024,
        "A uniformed HVAC technician kneeling at an open furnace, headlamp on, meter in hand",
    ),
    seal: "",
    readout: { value: "", note: "" },
    credit: "",
}

export const about = {
    headline: "The crew behind the trucks.",
    photo: photo(
        "crew",
        1024,
        1536,
        "Three Three Sisters Heating & Air technicians standing in front of a service van in the shop yard",
    ),
    paragraphs: [
        "Three Sisters started in 2010 with one van and a promise that still runs the company: answer the phone. Founder Rosa Camacho spent twelve years commissioning commercial systems before bringing that rigor to houses — and the first thing she bought wasn't a second van, it was a phone line a person answers at 3 AM in January.",
        "Today we run seven trucks and a crew of eleven, every tech NATE-certified, background-checked, and in uniform. Dispatch texts you a name, a photo, and a live ETA before the truck is out of the yard — you always know who's knocking.",
        "Every repair is quoted flat before the work starts, every install is sized by load calculation and commissioned by instrument, and the after-hours price is the daytime price. Cold houses can't wait for Monday — they shouldn't cost extra either.",
    ],
    /** The checked lines under the story (after the license line). */
    bullets: [
        "Flat prices quoted before the work — no hourly meter",
        "A name, a photo, and a live ETA texted before the truck rolls",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "OR CCB #176254", // theme-exempt: license number, not a color
        "NATE-certified techs",
        "Bonded & insured",
        "EPA 608 certified",
        "Background-checked techs",
    ],
}

export const steps = {
    kicker: "When you call",
    title: "From your call to comfortable, in four steps",
    items: [
        {
            title: "A person answers",
            description:
                "No phone tree, no callback queue — a dispatcher picks up 24/7, asks the right questions, and tells you what to check while help rolls.",
        },
        {
            title: "The truck is dispatched",
            description:
                "You get a text with your tech's name, photo, and a live ETA. In-season emergencies get same-day response across our service area.",
        },
        {
            title: "Flat quote, before the work",
            description:
                "The tech diagnoses, then quotes the whole job flat — parts, labor, refrigerant. No hourly meter running while someone walks to the truck.",
        },
        {
            title: "Fixed, tested, tidy",
            description:
                "The system is run through a full cycle in front of you, temperatures verified at the registers, and the warranty put in writing on the invoice.",
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
        question: "Do you charge extra after hours?",
        answer: "No. The emergency line runs 24/7 and the after-hours price is the daytime price. A furnace that quits at midnight in January is the job we built the company for — it shouldn't cost extra.",
    },
    {
        question: "How fast can you actually get here?",
        answer: "In-season emergencies — no heat in winter, no cooling in a heat wave — get same-day response across Bend, Redmond, Sisters, Tumalo, Sunriver, and La Pine, and dispatch texts you a live ETA the moment the truck rolls.",
    },
    {
        question: "Are you licensed and certified?",
        answer: "Yes — Oregon CCB #176254, bonded and fully insured, every tech NATE-certified and EPA 608 certified for refrigerant work. Certificates available before any work starts.", // theme-exempt: license number, not a color
    },
    {
        question: "How does pricing work?",
        answer: "Flat, quoted before the work starts. The tech diagnoses the problem, quotes the whole job — parts, labor, refrigerant — and the quote is the invoice. There is no hourly meter.",
    },
    {
        question: "Should I repair or replace my system?",
        answer: "We'll show you the math, not a sales pitch: the repair cost against the unit's age, efficiency, and the rebates a replacement qualifies for. Most systems under twelve years old are worth fixing — and we'll say so.",
    },
]

/**
 * The appointments contract's code fallback (the base module's structural
 * twin — see ServicesEmergency/content.ts). The remix catalog reseeds
 * `content.appointments` to mirror this export, so the composed template's
 * booking widget and Manage editor open on the HVAC company's own
 * provider, not the base plumber's.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "urgent-service-call",
            name: "Urgent service call",
            durationMinutes: 90,
            description:
                "The first opening for a problem that can't wait long — but isn't a right-now emergency.",
        },
        {
            typeId: "inspection",
            name: "Whole-home inspection",
            durationMinutes: 60,
            description:
                "A scheduled top-to-bottom look at the system — heat, cooling, and ducts; what's fine, what's next.",
        },
    ],
    providers: [
        {
            providerId: "rosa-camacho",
            name: "Rosa Camacho",
            windows: [
                { day: 1, start: 9 * 60, end: 16 * 60 },
                { day: 2, start: 9 * 60, end: 16 * 60 },
                { day: 3, start: 9 * 60, end: 16 * 60 },
                { day: 4, start: 9 * 60, end: 16 * 60 },
                { day: 5, start: 9 * 60, end: 16 * 60 },
            ],
        },
    ],
}

/** The /request page's booking strip — the slot picker above the form. */
export const booking = {
    headline: "Book a visit",
    intro: "For anything that can wait for a scheduled visit, pick a time — you'll get a confirmation with a one-click cancel link. An active emergency? Skip the calendar and call the line.",
    /** The new/returning select's trade voice (the widget's statusLabels). */
    statusLabels: { new: "First time working together", returning: "We've worked together before" },
    /** The small print under the booking form: what happens to the details. */
    privacyNote:
        "Just the basics to hold your time — no health questions here, ever. Anything about your visit stays between you and your care team at the office.",
}

export const request = {
    headline: "Tell us what's happening.",
    body: "No heat or no cooling right now? Call the line — it's answered 24/7. For tune-ups, quotes, and anything that can wait, send the details below and the office will call you back within the hour, 8 AM to 5 PM.",
    confirmation:
        "Got it — your request is in. The office calls back within the hour during business hours; for anything urgent, the emergency line answers 24/7.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "phone", label: "Phone", type: "tel" as const, required: true },
        { name: "email", label: "Email", type: "email" as const },
        { name: "address", label: "Service address", required: true },
        {
            name: "issue",
            label: "What's the problem?",
            placeholder: "No heat, weak cooling, tune-up, new system …",
        },
        { name: "timing", label: "How urgent?", placeholder: "Today, this week, whenever …" },
        {
            name: "message",
            label: "Anything else we should know",
            type: "textarea" as const,
            fullWidth: true,
        },
    ],
}
