/**
 * The emergency-services pack's single content file: the business, its
 * services, and pages. Everything the site renders comes from here — edit
 * this file (not the page components) to make the site yours. The demo
 * business is a plumber, but the shape fits any dispatch trade: electrician,
 * HVAC, locksmith, towing — swap the services and copy and the site follows.
 *
 * This is the `services` category's emergency/dispatch shape: the sell is
 * speed and trust, not a portfolio. The hero leads with the call, the
 * metrics strip proves response time, and pricing is flat and printed —
 * nobody comparison-shops galleries while their basement floods.
 *
 * The dispatch shape's optional sections ship empty here: an on-call
 * schedule (`onCall.week`), the hero price board, the flat-rate price
 * book, job reports, the hero text thread, and the hero's seal and
 * readout. Fill any of them and the builders render it — see
 * servicesEmergencyLanding.ts for what each one switches on.
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
        src: `/services-emergency/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/services-emergency/${name}-${step}w.webp`, width: step })),
    }
}

export const business = {
    name: "High Desert Plumbing & Drain",
    tagline: "Emergency plumbing and drain service",
    location: "Bend, Oregon",
    /** Shown everywhere the number appears; `phoneHref` is the tap target.
     * On a dispatch site this number IS the product — it never leaves the
     * viewport (hero, nav CTA, banner, footer). */
    phone: "(541) 555-0199",
    phoneHref: "tel:+15415550199",
    email: "dispatch@highdesertplumbing.example",
    address: "2205 NE Division St, Bend, OR 97703",
    /** The license line — rendered wherever trust is being earned. */
    license: "Licensed, bonded & insured — OR CCB #198442 · Plumbing PB #26-441", // theme-exempt: license number, not a color
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
 * Landing copy the trade owns: the few strings the landing module renders
 * that would read wrong for a different trade. Remix seeds retrade these
 * along with the rest of the content — everything else in the landing
 * module is trade-neutral on purpose.
 */
export const landingCopy = {
    /** The home page's services-section heading. */
    servicesHeading: "Drains, heaters, leaks — handled",
    /** The home page's closing call-out — the emergency hook itself. */
    finalCtaTitle: "Water where it shouldn't be?",
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
    /** "From $149" / "Camera inspection $249" — flat, printed, no meter. */
    priceNote: string
    image: SiteImage
}

export const services: Service[] = [
    {
        slug: "emergency",
        title: "Emergency plumbing",
        eyebrow: "24/7",
        description:
            "Burst pipes, active leaks, sewage backups, no water — a live dispatcher answers around the clock and a licensed tech rolls within the hour.",
        priceNote: "No after-hours upcharge",
        image: photo(
            "service-emergency",
            1536,
            1024,
            "A plumber's van at a house at dusk, work lights on and the side door open",
        ),
    },
    {
        slug: "drains",
        title: "Drain clearing",
        eyebrow: "Drains & sewer",
        description:
            "Kitchen, bath, floor, and main-line stoppages cleared with augers and jetting — cleared means cleared, verified by camera on request.",
        priceNote: "From $149",
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
            "Tank and tankless — same-day repair when parts allow, next-day replacement with the old unit hauled away and the permit pulled by us.",
        priceNote: "From $1,450 installed",
        image: photo(
            "service-water-heaters",
            1536,
            1024,
            "A new water heater installed in a garage utility corner with clean copper connections",
        ),
    },
    {
        slug: "leaks",
        title: "Leak detection & repair",
        eyebrow: "Emergency",
        description:
            "Acoustic and thermal detection finds the leak without opening five walls to fix one pipe — then a repair that's warrantied in writing.",
        priceNote: "From $189",
        image: photo(
            "service-leaks",
            1536,
            1024,
            "A plumber checking a copper joint under a sink with a work light",
        ),
    },
    {
        slug: "fixtures",
        title: "Fixtures & faucets",
        eyebrow: "Kitchen & bath",
        description:
            "Faucets, toilets, disposals, and shower valves — installed right, sealed right, and priced flat before the wrench comes out.",
        priceNote: "From $129",
        image: photo(
            "service-fixtures",
            1536,
            1024,
            "A new kitchen faucet being tightened into a stainless sink",
        ),
    },
    {
        slug: "sewer",
        title: "Sewer line service",
        eyebrow: "Drains & sewer",
        description:
            "Camera inspections, spot repairs, and trenchless replacement — you watch the footage with us before anyone talks about digging.",
        priceNote: "Camera inspection $249",
        image: photo(
            "service-sewer",
            1536,
            1024,
            "A sewer camera monitor showing pipe footage beside an open cleanout",
        ),
    },
]

/** The trust numbers — the dispatch strip. Keep values short and big. */
export const metrics = [
    { value: "45 min", label: "average emergency response" },
    { value: "24/7", label: "line answered by a person" },
    { value: "9,400+", label: "jobs completed" },
    { value: "4.9★", label: "average of 480 reviews" },
]

export const testimonials = [
    {
        quote: "Water heater let go at 11 PM on a Sunday. A human answered on the second ring, the tech was here by midnight, and the price he quoted in the driveway was the price on the invoice.",
        name: "Dana Okafor",
        detail: "Emergency water heater, Bend",
    },
    {
        quote: "Two other outfits quoted us a $14,000 dig for the sewer line. High Desert ran the camera, showed us the footage, and fixed the one bad section trenchless for a third of that.",
        name: "Ray & Marisol Beltran",
        detail: "Sewer line repair, Redmond",
    },
    {
        quote: "They've done our rentals for six years. Flat prices, techs who wear shoe covers without being asked, and an office that actually calls you back.",
        name: "Sue Ellingson",
        detail: "Property manager, Sisters",
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
    headline: "Water doesn't wait. Neither do we.",
    subheadline:
        "Emergency plumbing and drain service across Central Oregon — a live dispatcher answers 24/7 and a licensed tech is at your door in under an hour, with the price quoted flat before the work starts.",
    heroImage: photo(
        "hero-01",
        1536,
        1024,
        "A uniformed plumber kneeling at an open sink cabinet, headlamp on, wrench in hand",
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
        "Three High Desert Plumbing technicians standing in front of a service van in the shop yard",
    ),
    paragraphs: [
        "High Desert started in 2011 with one van and a promise that still runs the company: answer the phone. Founder Luis Herrera spent twelve years as a journeyman before going out on his own, and the first thing he bought wasn't a second van — it was a phone line a person answers at 3 AM.",
        "Today we run six trucks and a crew of nine, every tech journeyman-led, background-checked, and in uniform. Dispatch texts you a name, a photo, and a live ETA before the truck is out of the yard — you always know who's knocking.",
        "Every price is quoted flat before the work starts, every repair is warrantied in writing, and the after-hours price is the daytime price. Emergencies are the job — they shouldn't cost extra.",
    ],
    /** The checked lines under the story (after the license line). */
    bullets: [
        "Flat prices quoted before the work — no hourly meter",
        "A name, a photo, and a live ETA texted before the truck rolls",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "OR CCB #198442", // theme-exempt: license number, not a color
        "Plumbing PB #26-441",
        "Bonded & insured",
        "Journeyman-led crews",
        "Background-checked techs",
    ],
}

export const steps = {
    kicker: "When you call",
    title: "From your call to fixed, in four steps",
    items: [
        {
            title: "A person answers",
            description:
                "No phone tree, no callback queue — a dispatcher picks up 24/7, asks the right questions, and tells you what to shut off while help rolls.",
        },
        {
            title: "The truck is dispatched",
            description:
                "You get a text with your tech's name, photo, and a live ETA. Average emergency response across our service area is 45 minutes.",
        },
        {
            title: "Flat quote, before the work",
            description:
                "The tech diagnoses, then quotes the whole job flat — parts, labor, cleanup. No hourly meter running while someone walks to the truck.",
        },
        {
            title: "Fixed, tested, tidy",
            description:
                "The repair is tested in front of you, the area cleaned, and the warranty put in writing on the invoice before the van leaves.",
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
        answer: "No. The emergency line runs 24/7 and the after-hours price is the daytime price. Emergencies are the job we built the company for — they shouldn't cost extra.",
    },
    {
        question: "How fast can you actually get here?",
        answer: "Our average emergency response across Bend, Redmond, Sisters, Tumalo, Sunriver, and La Pine is 45 minutes. Dispatch texts you a live ETA the moment the truck rolls, so you're never guessing.",
    },
    {
        question: "Are you licensed and insured?",
        answer: "Yes — Oregon CCB #198442 and plumbing license PB #26-441, bonded and fully insured, and every tech on the crew is background-checked. Certificates available before any work starts.", // theme-exempt: license number, not a color
    },
    {
        question: "How does pricing work?",
        answer: "Flat, quoted before the work starts. The tech diagnoses the problem, quotes the whole job — parts, labor, cleanup — and the quote is the invoice. There is no hourly meter.",
    },
    {
        question: "Is the work warrantied?",
        answer: "Every repair carries a written warranty on the invoice — one year on labor, and the manufacturer's warranty on parts and fixtures we supply. If it fails, we come back free.",
    },
]

/**
 * The appointments contract's code fallback — the same booking mode 2 the
 * care pack runs (web/app/src/View/Landing/practiceDocument.ts): visit
 * types x weekly availability windows, projected into concrete capacity-1
 * slots by `generateAppointmentSlots`. The catalog's `content.appointments`
 * seed mirrors this export exactly (the content tests pin the twin).
 *
 * The dispatch trade books what can WAIT: an urgent-but-not-emergency
 * service call and a whole-home inspection. True emergencies never touch
 * the calendar — the 24/7 line owns those, and the copy keeps saying so.
 * One provider — the founder runs the scheduled work — with weekday
 * windows inside office hours.
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
                "A scheduled top-to-bottom look at the system — what's fine, what's aging, what's next.",
        },
    ],
    providers: [
        {
            providerId: "luis-herrera",
            name: "Luis Herrera",
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
    body: "Active leak or no water? Call the line — it's answered 24/7. For anything that can wait until business hours, send the details below and the office will call you back within the hour, 8 AM to 5 PM.",
    confirmation:
        "Got it — your request is in. The office calls back within the hour during business hours; for anything urgent, the emergency line answers 24/7.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "phone", label: "Phone", type: "tel" as const, required: true },
        { name: "email", label: "Email", type: "email" as const },
        { name: "address", label: "Service address", required: true },
        { name: "issue", label: "What's the problem?", placeholder: "Slow drain, water heater, leak …" },
        { name: "timing", label: "How urgent?", placeholder: "Today, this week, whenever …" },
        {
            name: "message",
            label: "Anything else we should know",
            type: "textarea" as const,
            fullWidth: true,
        },
    ],
}
