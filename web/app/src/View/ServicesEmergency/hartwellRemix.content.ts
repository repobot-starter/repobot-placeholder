/**
 * Remix seed — Hartwell Mechanical, the estate-mechanical derived template
 * of the emergency-services pack (packs/services-emergency-hartwell). A
 * structural twin of `content.ts`: the composer copies this file over the
 * pack's content module byte-for-byte, so every export, interface, and
 * helper below must keep the base module's shape (the remix-seed tests pin
 * the twin). Everything the site renders still comes from here.
 *
 * The trade is the house itself — boilers, radiant floors, wells, the
 * standby generator, snowmelt, the pool plant — kept on care intervals for
 * a few hundred estates, with a 24/7 line for the night something stops.
 * The home leads with the systems index (`systems`), so the services grid
 * and price book stay on /services.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/services-emergency-hartwell`. The `photo` helper mirrors
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
        src: `/services-emergency-hartwell/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({
            src: `/services-emergency-hartwell/${name}-${step}w.webp`,
            width: step,
        })),
    }
}

const boilers = photo(
    "system-boilers",
    1600,
    1200,
    "A pair of graphite boilers plumbed in polished copper and brass on a clean mechanical-room floor",
)
const radiant = photo(
    "system-radiant",
    1600,
    1200,
    "Radiant-floor tubing laid in even loops across a subfloor before the stone goes down",
)
const water = photo(
    "system-water",
    1600,
    1200,
    "Three blue filter housings and a pressure tank on copper manifolds in a well-water treatment room",
)
const generator = photo(
    "system-generator",
    1600,
    1200,
    "A graphite standby generator behind a clipped hedge beside a shingle-style house at dusk",
)
const snowmelt = photo(
    "system-snowmelt",
    1600,
    1200,
    "A heated paver motor court clear and wet between snow-covered lawns and lantern-lit stone gate posts",
)
const poolPlant = photo(
    "system-pool",
    1600,
    1200,
    "Two pool pumps, a sand filter and a heat exchanger plumbed in copper on a concrete plinth",
)

export const business = {
    name: "Hartwell Mechanical",
    tagline: "Estate plumbing, heating and mechanical",
    location: "Greenwich, Connecticut",
    /** Shown everywhere the number appears; `phoneHref` is the tap target.
     * On a dispatch site this number IS the product — it never leaves the
     * viewport (hero, nav CTA, banner, footer). */
    phone: "(203) 555-0142",
    phoneHref: "tel:+12035550142",
    email: "estates@hartwellmechanical.example",
    address: "41 Railroad Avenue, Greenwich, CT 06830",
    /** The license line — rendered wherever trust is being earned. */
    license: "Licensed & insured — CT P-1 #0281554 · S-1 #0304417 · HIC #0655201", // theme-exempt: license number, not a color
    /** The dispatch promise, worn as the hero badge. A 24/7 line has no
     * open/closed state to compute — the badge is the always-on claim
     * itself. Lives on `business` (not a bare string export) because the
     * content service edits a slot by walking an exported object/array
     * literal — a top-level string export is read-only in the panel. */
    dispatchBadge: "24/7 · Est. 1954 · Greenwich & Westport",
}

export const hoursNote = "Estate line 24/7 · Office Monday–Friday 7 AM–5 PM"

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
export const serviceArea = ["Greenwich", "Westport", "Darien", "New Canaan", "Rye", "Bedford"]

/**
 * Landing copy the trade owns: the few strings the landing module renders
 * that would read wrong for a different trade. Remix seeds retrade these
 * along with the rest of the content — everything else in the landing
 * module is trade-neutral on purpose.
 */
export const landingCopy = {
    /** The home page's services-section heading. */
    servicesHeading: "Every system, one standard",
    /** The home page's closing call-out — the emergency hook itself. */
    finalCtaTitle: "Estate Care Plans from $4,800 / year",
    /** The closing call-out's line under the title ("" = the 24/7 line and office hours). */
    finalCtaBody: "All systems. One standard. Peace of mind.",
    /** The closing call-out's ask: a label sends it to the request page ("" = call the line). */
    finalCtaAsk: "Request a systems survey",
    /** The label over the service-area names. */
    serviceAreaLabel: "Estates under care in",
    /** A small line under the nav wordmark ("" = the wordmark alone). */
    navTagline: "Mechanical",
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
    title: "Care plans and visits",
    intro: "Every estate starts with a systems survey. The plan is priced from what we find, in writing, before the first visit.",
    items: [
        {
            group: "Estate Care Plans",
            name: "Estate Care",
            note: "Up to four systems, every interval",
            price: "$4,800 / yr",
            qualifier: "from",
        },
        {
            group: "Estate Care Plans",
            name: "Estate Care Complete",
            note: "Every system on the property",
            price: "$9,600 / yr",
            qualifier: "from",
        },
        {
            group: "Visits",
            name: "Systems survey",
            note: "Every system logged, photographed and graded",
            price: "$650",
            qualifier: "",
        },
        {
            group: "Visits",
            name: "Estate line call-out",
            note: "Plan members: no call-out fee, any hour",
            price: "$395",
            qualifier: "",
        },
    ],
    footnote: "Plans renew each spring. Repairs are quoted flat before any work begins.",
    ctaLabel: "Request a systems survey",
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
        slug: "estate-care",
        title: "Estate Care Plans",
        eyebrow: "Every interval",
        description:
            "Each system on the property serviced on its own interval, logged in the house book, and graded — so nothing is ever a surprise in February.",
        priceNote: "From $4,800 a year",
        image: boilers,
    },
    {
        slug: "estate-line",
        title: "The estate line",
        eyebrow: "24/7",
        description:
            "No heat, no water, a generator that didn't start. A Hartwell engineer answers, and a truck is on the drive within the hour.",
        priceNote: "No call-out fee for plan members",
        image: generator,
    },
    {
        slug: "heating",
        title: "Heating & radiant",
        eyebrow: "Boilers · Radiant",
        description:
            "Boilers, indirect water heaters and radiant floors — commissioned, balanced and serviced by the engineers who installed half of them.",
        priceNote: "Boiler service from $425",
        image: radiant,
    },
    {
        slug: "water",
        title: "Well & water treatment",
        eyebrow: "Water",
        description:
            "Well pumps, pressure tanks, filtration and softening, tested every summer and adjusted to the lab results, not a guess.",
        priceNote: "Water panel from $290",
        image: water,
    },
    {
        slug: "snowmelt",
        title: "Snowmelt & outdoor",
        eyebrow: "Winter",
        description:
            "Driveway and terrace snowmelt, freeze protection and hose-bib shut-downs, readied before the first storm is forecast.",
        priceNote: "Season start-up from $380",
        image: snowmelt,
    },
    {
        slug: "pool",
        title: "Pool mechanicals",
        eyebrow: "Pool plant",
        description:
            "Pumps, filters, heaters and automation — the plant room behind the pool, opened in spring and put to bed in fall.",
        priceNote: "Opening service from $540",
        image: poolPlant,
    },
]

/** The trust numbers — the dispatch strip. Keep values short and big. */
export const metrics = [
    { value: "60 min", label: "on site from the estate line" },
    { value: "1954", label: "three generations of Hartwells" },
    { value: "212", label: "estates under a care plan" },
    { value: "24/7", label: "an engineer answers, not a service" },
]

export const testimonials = [
    {
        quote: "The boiler failed at two in the morning in January with guests in the house. Hartwell was in the plant room by three, and nobody upstairs ever knew.",
        name: "Caroline Ashby",
        detail: "Estate Care Complete, Round Hill",
    },
    {
        quote: "They know this house better than we do. The house book lists every valve, every filter and every date, and they're at the door before anything is due.",
        name: "James & Eleanor Whitcombe",
        detail: "Estate Care, Westport",
    },
    {
        quote: "Our house manager calls one number for everything mechanical. That alone was worth the plan.",
        name: "Priya Castellane",
        detail: "Estate Care, Belle Haven",
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
    headline: "The house runs. Quietly.",
    subheadline:
        "Estate plumbing, heating and mechanical for Greenwich and Westport since 1954 — every system on a care interval, and a 24/7 line for the night one stops.",
    heroImage: photo(
        "hero-plant-room",
        2400,
        1350,
        "A Hartwell engineer kneeling at a wall of polished copper and brass piping in an estate mechanical room, checking a pressure gauge",
    ),
    seal: "",
    readout: { value: "", note: "" },
    credit: "24/7 estate line (203) 555-0142 · On site in 60 min",
}

export const about = {
    headline: "Three generations in the plant room.",
    photo: photo(
        "about-workshop",
        1600,
        1200,
        "Thomas Hartwell laughing with a homeowner as he opens a brass valve wheel on a copper manifold in an estate plant room",
    ),
    paragraphs: [
        "Walter Hartwell opened the shop on Railroad Avenue in 1954 fitting oil burners in the big houses on Round Hill. His son added boilers and radiant heat; his grandson Thomas runs the company today and still takes the estate line one night a week.",
        "We look after a few hundred estates, not thousands of houses. Every one has a house book — every system, valve and filter, photographed and dated — and the same two engineers who know it by heart.",
        "Care plans are priced in writing after a systems survey, repairs are quoted flat before any work begins, and the estate line is answered by an engineer at any hour.",
    ],
    /** The checked lines under the story (after the license line). */
    bullets: [
        "A house book for every estate — every system, logged and dated",
        "The same two engineers on your property, year after year",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "CT P-1 #0281554", // theme-exempt: license number, not a color
        "CT S-1 #0304417", // theme-exempt: license number, not a color
        "Radiant design certified",
        "Fully insured",
        "Est. 1954",
    ],
}

export const steps = {
    kicker: "When you call the estate line",
    title: "One number, any hour",
    items: [
        {
            title: "An engineer answers",
            description:
                "Not a service. A Hartwell engineer with your house book open, who can talk you through a shut-off while the truck rolls.",
        },
        {
            title: "On the drive in 60 minutes",
            description:
                "Trucks carry parts for the systems we look after, so most calls end on the first visit — at any hour, in any weather.",
        },
        {
            title: "Quoted flat, before the work",
            description:
                "The repair is priced in writing before a wrench turns. Plan members pay no call-out fee.",
        },
        {
            title: "Logged in the house book",
            description:
                "Every visit is photographed and dated in the house book, and your house manager gets the note the same day.",
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
    kicker: "Systems index",
    title: "",
    items: [
        {
            code: "SYS-01",
            name: "Boiler & hydronic",
            interval: "serviced every fall",
            description:
                "Combustion tested, controls calibrated, the loop bled and balanced before the first cold night.",
            image: boilers,
        },
        {
            code: "SYS-02",
            name: "Radiant floors",
            interval: "serviced every spring",
            description:
                "Manifolds flushed, every zone's supply temperature logged against the design sheet.",
            image: radiant,
        },
        {
            code: "SYS-03",
            name: "Well & water treatment",
            interval: "serviced every summer",
            description:
                "Lab-tested each year; filters, softener and UV adjusted to what the water actually carries.",
            image: water,
        },
        {
            code: "SYS-04",
            name: "Standby generator",
            interval: "tested monthly",
            description:
                "Run under load every month, oil and batteries on schedule, transfer switch exercised twice a year.",
            image: generator,
        },
        {
            code: "SYS-05",
            name: "Snowmelt",
            interval: "serviced before first snow",
            description:
                "Glycol tested, sensors cleaned and the drive proven clear before the first storm is forecast.",
            image: snowmelt,
        },
        {
            code: "SYS-06",
            name: "Pool mechanicals",
            interval: "serviced every spring",
            description:
                "The plant room opened in April and put to bed in October — pumps, filter, heater and automation.",
            image: poolPlant,
        },
    ] as EstateSystem[],
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
 * of job as tap-to-pick chips, one callback field, and the ask. A filled
 * `cta` sets the hero as the form over the photograph; "" keeps the call
 * buttons.
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
        question: "What does a care plan cover?",
        answer: "Every system named in your house book, each serviced on its own interval — boilers in the fall, radiant and pool in spring, water in summer, the generator every month. Parts are billed at cost; labor on scheduled visits is included.",
    },
    {
        question: "What happens when I call the estate line at night?",
        answer: "A Hartwell engineer answers with your house book open. Most calls are talked through a safe shut-off in minutes, and a truck is on the drive within sixty minutes when one is needed.",
    },
    {
        question: "Do you work with our house manager and other trades?",
        answer: "Every day. House managers get the visit note the same afternoon, and we coordinate with your builder, pool company and security installer so nobody works blind.",
    },
    {
        question: "Are you licensed and insured?",
        answer: "Yes — Connecticut P-1 #0281554, S-1 #0304417 and HIC #0655201, fully insured, with certificates sent to your office before the first visit.", // theme-exempt: license number, not a color
    },
    {
        question: "Can you take over a system someone else installed?",
        answer: "Usually. The systems survey tells us what's there, what's aging and what we'd change. If we can't stand behind a system, we'll say so in writing before you sign anything.",
    },
]

/**
 * The appointments contract's code fallback — the same booking mode 2 the
 * care pack runs (web/app/src/View/Landing/practiceDocument.ts): visit
 * types x weekly availability windows, projected into concrete capacity-1
 * slots by `generateAppointmentSlots`. The catalog's `content.appointments`
 * seed mirrors this export exactly (the content tests pin the twin).
 *
 * The estate trade books what can wait: the systems survey that starts
 * every plan and a scheduled service visit. The estate line owns the rest.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "systems-survey",
            name: "Systems survey",
            durationMinutes: 120,
            description:
                "Every system on the property logged, photographed and graded — the start of every care plan.",
        },
        {
            typeId: "service-visit",
            name: "Scheduled service visit",
            durationMinutes: 90,
            description: "A planned visit for a system that's due, or something that can wait for a weekday.",
        },
    ],
    providers: [
        {
            providerId: "thomas-hartwell",
            name: "Thomas Hartwell",
            windows: [
                { day: 1, start: 8 * 60, end: 15 * 60 },
                { day: 2, start: 8 * 60, end: 15 * 60 },
                { day: 3, start: 8 * 60, end: 15 * 60 },
                { day: 4, start: 8 * 60, end: 15 * 60 },
                { day: 5, start: 8 * 60, end: 13 * 60 },
            ],
        },
    ],
}

/** The /request page's booking strip — the slot picker above the form. */
export const booking = {
    headline: "Book a systems survey",
    intro: "Pick a time for the survey that starts every care plan, or a scheduled visit for something that can wait. Anything that can't wait — call the estate line.",
    /** The new/returning select's trade voice (the widget's statusLabels). */
    statusLabels: { new: "A new estate for us", returning: "Already in our house books" },
    /** The small print under the booking form: what happens to the details. */
    privacyNote:
        "Just what we need to hold the time. Gate codes and alarm details are taken by phone, never through this form.",
}

export const request = {
    headline: "Tell us about the house.",
    body: "No heat or no water? Call the estate line — an engineer answers 24/7. For a survey, a plan or anything that can wait, send the details below and the office will call you back the same day.",
    confirmation:
        "Thank you — the office will call you back today. For anything urgent, the estate line answers 24/7 at (203) 555-0142.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "phone", label: "Phone", type: "tel" as const, required: true },
        { name: "email", label: "Email", type: "email" as const },
        { name: "address", label: "Property address", required: true },
        { name: "issue", label: "Which systems?", placeholder: "Boiler, radiant, well, generator …" },
        { name: "timing", label: "House manager or contact", placeholder: "Name and number, if different" },
        {
            name: "message",
            label: "Anything else we should know",
            type: "textarea" as const,
            fullWidth: true,
        },
    ],
}
