/**
 * The electrician remix seed: a complete, drop-in replacement for
 * `./content.ts` that retargets the emergency-services pack from the
 * Pasadena plumber to Live Wire Electric, a Detroit electrical contractor
 * — same dispatch shape, different trade and city. The derived template
 * `repobot-services-electric` is composed from the services-emergency pack
 * with this file copied over `content.ts`, the `schematic` register and
 * page skeletons pinned by `packs/services-electric-techno/catalog.json`, and its
 * electric-cyan brand merged over the pack's.
 *
 * Because the copy is verbatim, this file must stay a structural twin of
 * `content.ts`: same exports, images under its own `/services-electric-techno/`
 * public directory. The parity test
 * (`tests/View/ServicesEmergency/remixSeeds.test.ts`) pins the export
 * surface against the real module, so the seed fails CI the moment the
 * pack's contract moves without it.
 *
 * Presence stays content-driven: the hero photograph makes the hero
 * full-bleed, the empty `priceBoard` keeps the services grid and the full
 * price sheet on the home page, and the empty `heroThread` keeps "how it
 * works" as plain steps.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/services-electric` (see PACK.md). The `photo` helper
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
        src: `/services-electric-techno/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({
            src: `/services-electric-techno/${name}-${step}w.webp`,
            width: step,
        })),
    }
}

export const business = {
    name: "Live Wire Electric",
    tagline: "Licensed master electricians since 1998",
    location: "Detroit, Michigan",
    /** Shown everywhere the number appears; `phoneHref` is the tap target.
     * On a dispatch site this number IS the product — it never leaves the
     * viewport (hero, nav CTA, banner, footer). */
    phone: "(313) 555-0187",
    phoneHref: "tel:+13135550187",
    email: "dispatch@livewireelectric.example",
    address: "2410 Michigan Ave, Detroit, MI 48216",
    /** The license line — rendered wherever trust is being earned. */
    license: "MI Master Electrician #6110482 · Electrical Contractor #6215093 · Insured", // theme-exempt: license number, not a color
    /** The always-on promise, worn as the hero badge when `onCall.week` is
     * empty. Lives on `business` (not a bare string export) because the
     * content service edits a slot by walking an exported object/array
     * literal — a top-level string export is read-only in the panel. */
    dispatchBadge: "Master electricians · outages answered 24/7",
}

export const hoursNote = "Office open 7 AM–7 PM, Monday–Saturday"

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
    typicalArrival: "Avg. outage response 52 min",
}

/** The neighborhoods a truck actually reaches inside the response average. */
export const serviceArea = [
    "Corktown",
    "Woodbridge",
    "Indian Village",
    "Boston-Edison",
    "West Village",
    "Hamtramck",
    "Ferndale",
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
    servicesHeading: "Panels, rewires, chargers — wired to code",
    /** The home page's closing call-out — the emergency hook itself. */
    finalCtaTitle: "Lights out? Breaker smoking?",
    /** The closing call-out's line under the title ("" = the 24/7 line and office hours). */
    finalCtaBody: "",
    /** The closing call-out's ask: a label sends it to the request page ("" = call the line). */
    finalCtaAsk: "",
    /** The label over the service-area names. */
    serviceAreaLabel: "Wiring the neighborhoods",
    /** A small line under the nav wordmark ("" = the wordmark alone). */
    navTagline: "Detroit, Michigan",
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
 * The flat-rate price sheet — printed in full on the home page (there is
 * no hero price board) and on /services. Real numbers: the price on this
 * sheet is the price on the invoice.
 */
export const priceBook: PriceBook = {
    title: "The price sheet.",
    intro: "Flat rates. City permit and inspection included wherever Detroit asks for one.",
    items: [
        {
            group: "Panels & service",
            name: "200A panel upgrade",
            note: "Permit, inspection, new meter base",
            price: "$3,400",
            qualifier: "from",
        },
        {
            group: "Panels & service",
            name: "Replace a breaker",
            note: "Any standard breaker, installed and tested",
            price: "$225",
            qualifier: "",
        },
        {
            group: "Panels & service",
            name: "Service call & diagnosis",
            note: "Credited to the repair",
            price: "$129",
            qualifier: "",
        },
        {
            group: "Panels & service",
            name: "Outage call, any hour",
            note: "Same rate at 2 AM as at 2 PM",
            price: "$149",
            qualifier: "",
        },
        {
            group: "Old-house wiring & chargers",
            name: "Knob & tube rewire, per room",
            note: "Plaster patched, ready for paint",
            price: "$1,850",
            qualifier: "from",
        },
        {
            group: "Old-house wiring & chargers",
            name: "GFCI outlet",
            note: "Kitchen, bath, basement, garage",
            price: "$165",
            qualifier: "",
        },
        {
            group: "Old-house wiring & chargers",
            name: "Level 2 EV charger install",
            note: "Up to 30 ft from the panel, permit included",
            price: "$1,450",
            qualifier: "",
        },
        {
            group: "Old-house wiring & chargers",
            name: "Standby generator hookup",
            note: "Transfer switch and permit",
            price: "$2,900",
            qualifier: "from",
        },
    ],
    footnote: "The quote is the price — outage calls included, day or night.",
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
 * No price board on this hero — the photograph and the schematic carry it,
 * and the full price sheet runs on the home page instead.
 */
export const priceBoard: PriceBoard = {
    title: "Upfront pricing.",
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
 * and the final side by side are the proof the price sheet is honest.
 */
export const jobReports: JobReports = {
    kicker: "Job reports",
    headline: "Every panel gets a report.",
    body: "What we found, what we quoted, what you paid, the permit number, and photos of the box before and after — in your inbox before the truck pulls away. Hand it to your insurer; that's what it's for.",
    items: [
        {
            jobNumber: "D-2214",
            title: "Fuse box to 200A panel",
            location: "Indian Village, Detroit",
            diagnosed: "1940s 60A fuse box, scorched bus bar, insurer refusing renewal",
            quoted: "$3,650",
            final: "$3,650",
            timeOnSite: "1 day + city inspection",
            stamp: "Passed",
            before: photo(
                "report-panel-before",
                1152,
                1536,
                "A Live Wire electrician in a knit cap inspecting an old fuse panel full of cloth-wrapped wiring on a brick basement wall, lit by a work light",
            ),
            after: photo(
                "report-panel-after",
                1152,
                1536,
                "A new gray 200-amp breaker panel mounted on a fresh plywood backboard against the same brick wall, conduit running straight up",
            ),
            tech: "Darnell Hayes",
            techDetail: "Master Electrician #6110482", // theme-exempt: license number, not a color
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
        slug: "panels",
        title: "Panel upgrades",
        eyebrow: "100A → 200A",
        description:
            "Old fuse boxes and overloaded 100-amp panels swapped for a 200-amp service that runs a kitchen, a dryer, and a car charger at once. We pull the permit and meet the city inspector.",
        priceNote: "From $3,400",
        image: photo(
            "service-panels",
            1536,
            1152,
            "A gloved hand with a screwdriver working inside an open breaker panel of tangled old wiring, lit warm against a dark brick wall",
        ),
    },
    {
        slug: "rewires",
        title: "Old-house rewires",
        eyebrow: "Knob & tube",
        description:
            "Boston-Edison and Indian Village houses were wired before anyone owned a toaster. We replace knob and tube room by room, fish new cable through the plaster, and patch what we open.",
        priceNote: "From $1,850",
        image: photo(
            "service-rewire",
            1536,
            1152,
            "Knob-and-tube wiring on porcelain insulators inside an opened plaster wall, a gloved hand holding a voltage tester up to it",
        ),
    },
    {
        slug: "ev-chargers",
        title: "EV chargers",
        eyebrow: "Level 2",
        description:
            "A 240-volt Level 2 charger in the garage or on the alley wall, with a load check on your panel first so the charger never fights the furnace.",
        priceNote: "$1,450",
        image: photo(
            "service-ev",
            1536,
            1152,
            "An electrician kneeling to wire a wall-mounted EV charger on a brick garage in a wet Detroit alley at night, a streetlight behind him",
        ),
    },
    {
        slug: "generators",
        title: "Standby generators",
        eyebrow: "Backup power",
        description:
            "When an ice storm takes the lines down, the furnace, sump pump, and fridge keep running. Transfer switch, gas tie-in coordination, permit, and a test under load.",
        priceNote: "From $2,900",
        image: photo(
            "service-generator",
            1536,
            1152,
            "An electrician kneeling at an open standby generator beside a brick house on a snowy winter night, the windows lit warm",
        ),
    },
    {
        slug: "outages",
        title: "Outages & emergencies",
        eyebrow: "Any hour",
        description:
            "Half the house dark, a burning smell, a breaker that won't reset. Call any hour and a licensed electrician heads your way — the rate doesn't change after dark.",
        priceNote: "$149",
        image: photo(
            "service-outage",
            1536,
            1152,
            "An electrician with a flashlight checking the meter on a dark porch of a Detroit row house during a power outage",
        ),
    },
    {
        slug: "lighting",
        title: "Fixtures & lighting",
        eyebrow: "Inside & out",
        description:
            "Restored chandeliers on old ceiling medallions, recessed cans, porch and alley lights. Hung level, wired to code, and the old fixture hauled away.",
        priceNote: "From $185",
        image: photo(
            "service-lighting",
            1536,
            1152,
            "An electrician on a ladder hanging a brass chandelier from an ornate plaster ceiling medallion in an old Detroit house",
        ),
    },
]

/** The readout strip under the hero. Keep values short and big. */
export const metrics = [
    { value: "200A", label: "panel upgrades" },
    { value: "Knob & tube", label: "rewires" },
    { value: "EV", label: "chargers, Level 2" },
    { value: "24/7", label: "outage response" },
]

export const testimonials = [
    {
        quote: "Our insurer gave us thirty days to get rid of the fuse box. Darnell quoted $3,650 on a Tuesday, had the new panel in by Friday, and the city inspector signed off the next week. The invoice said $3,650.",
        name: "Renee Carter",
        detail: "Panel upgrade, Indian Village",
    },
    {
        quote: "Power went out on half the house at one in the morning in January. Somebody picked up on the second ring and a truck was at the curb in under an hour. Same price they print on the site.",
        name: "Tomasz Nowak",
        detail: "Outage call, Hamtramck",
    },
    {
        quote: "They rewired our 1915 house room by room while we lived in it, and you honestly can't find where they opened the plaster. The charger in the garage was done the same week.",
        name: "Aisha & Malik Jordan",
        detail: "Rewire + EV charger, Boston-Edison",
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
    headline: "We wire Detroit.",
    subheadline:
        "Panels, rewires, EV chargers — licensed master electricians since 1998. Flat prices, city permits pulled, and a person on the line when the power goes out.",
    heroImage: photo(
        "hero-panel",
        2400,
        1350,
        "A Live Wire electrician in a knit cap and work jacket reaching into a glowing breaker panel on the brick wall of an old Detroit building, cool light at his shoulder",
    ),
    seal: "",
    readout: { value: "", note: "" },
    credit: "",
}

export const about = {
    headline: "I'm Darnell. I've probably been in your basement.",
    photo: photo(
        "about-owner",
        1536,
        1152,
        "Darnell Hayes, owner of Live Wire Electric, arms crossed in a knit cap in the lit doorway of his Corktown supply room at night",
    ),
    paragraphs: [
        "I pulled my first wire in 1998 as an apprentice on the west side, and I've been in the basements of this city ever since — Corktown workers' cottages, Boston-Edison mansions, two-flats in Hamtramck with three generations of somebody's wiring in the same box.",
        "Live Wire runs on two rules. The price is printed before we pick up a tool, and every job ends with a report: the permit, the inspection, before-and-after photos of the panel. Insurers take it, buyers' inspectors take it, and you keep it.",
        "There are six of us now, every one licensed in Michigan. We answer outages around the clock because a dark house in February isn't a next-week problem.",
    ],
    /** The checked lines under the story (after the license line). */
    bullets: [
        "Printed flat prices — no hourly meter, no after-dark upcharge",
        "City permits pulled and inspections met, every time",
        "A job report with panel photos your insurer will accept",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "MI Master Electrician #6110482", // theme-exempt: license number, not a color
        "Electrical Contractor #6215093", // theme-exempt: license number, not a color
        "City of Detroit permits",
        "Insured",
        "Since 1998",
    ],
}

/**
 * How it works. With a hero photograph the text thread moves down here:
 * each message becomes a step (its bubble) and the step at the same
 * position supplies the walkthrough under it; without one, these read as
 * four numbered steps.
 */
export const steps = {
    kicker: "When you call",
    title: "From dark to done, in four steps.",
    items: [
        {
            title: "A person picks up",
            description:
                "Any hour. Tell us what's dark, what smells, what tripped. If it's dangerous we'll tell you what to shut off before we hang up.",
        },
        {
            title: "We trace it and price it",
            description:
                "A licensed electrician finds the fault and quotes one flat price for the fix — permit included — before any work starts.",
        },
        {
            title: "You say go",
            description:
                "The number is locked. If the wall hides a surprise, we stop and re-quote; you never find out on the invoice.",
        },
        {
            title: "Power on, report sent",
            description:
                "We test every circuit we touched, book the inspection when there is one, and email the report with photos of the box.",
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
    name: "Live Wire",
    detail: "Detroit, MI",
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
        question: "Do I need a City of Detroit permit?",
        answer: "For a panel upgrade, a new circuit, a generator, or an EV charger — yes. We pull it, it's already in the price, and we're there when the city inspector comes. Swapping a fixture or an outlet like-for-like usually doesn't need one.",
    },
    {
        question: "My insurer says my old wiring is a problem. Now what?",
        answer: "Fuse boxes, knob and tube, and some old panel brands get flagged at renewal all the time. We inspect, write up exactly what's there, and quote the fix. The job report afterward — permit number, photos, inspection sign-off — is the document insurers ask for.",
    },
    {
        question: "Are there rebates for an EV charger?",
        answer: "DTE has offered rebates on Level 2 chargers for eligible customers, and the terms change. Tell us your utility account when you book and we'll check what's current, size the install to qualify, and hand you the paperwork the program asks for.",
    },
    {
        question: "How fast can you get here when the power's out?",
        answer: "Our average outage response over the last 90 days has been 52 minutes across the neighborhoods we cover. That's an average, not a promise — when you call we'll tell you honestly how far out the closest electrician is. If the whole block is dark, call DTE first; if it's just you, call us.",
    },
    {
        question: "Can you rewire an old house without gutting the plaster?",
        answer: "Almost always. We fish new cable through the walls and floors, open small access holes where we have to, and patch them ready for paint. Most rooms take a day, and you can live in the house while we work.",
    },
    {
        question: "Is the work guaranteed?",
        answer: "Every job carries a two-year labor warranty, written on your report. Panels, breakers, and chargers we supply carry the manufacturer's warranty on top. If our work fails, we come back free.",
    },
]

/**
 * The appointments contract's code fallback — the same booking mode 2 the
 * care pack runs (web/app/src/View/Landing/practiceDocument.ts): visit
 * types x weekly availability windows, projected into concrete capacity-1
 * slots by `generateAppointmentSlots`. The catalog's `content.appointments`
 * seed mirrors this export exactly (the content tests pin the twin).
 *
 * The dispatch trade books what can WAIT: a panel assessment and an EV
 * charger site visit. Outages never touch the calendar — the 24/7 line
 * owns those, and the copy keeps saying so. One provider — the owner does
 * the assessments — Monday through Saturday inside office hours.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "panel-assessment",
            name: "Panel & wiring assessment",
            durationMinutes: 60,
            description:
                "For an old fuse box, an insurer's letter, or a panel that's out of room — we look, then send one flat price.",
        },
        {
            typeId: "ev-charger-visit",
            name: "EV charger site visit",
            durationMinutes: 45,
            description:
                "We check the panel's load and the run to where the car parks, then quote the install flat.",
        },
    ],
    providers: [
        {
            providerId: "darnell-hayes",
            name: "Darnell Hayes",
            windows: [
                { day: 1, start: 8 * 60, end: 16 * 60 },
                { day: 2, start: 8 * 60, end: 16 * 60 },
                { day: 3, start: 8 * 60, end: 16 * 60 },
                { day: 4, start: 8 * 60, end: 16 * 60 },
                { day: 5, start: 8 * 60, end: 16 * 60 },
                { day: 6, start: 9 * 60, end: 13 * 60 },
            ],
        },
    ],
}

/** The /request page's booking strip — the slot picker above the form. */
export const booking = {
    headline: "Book an assessment",
    intro: "For anything that can wait — a panel quote, a charger, an insurer's deadline — pick a time and we'll confirm by text. Power out or a burning smell? Don't book it. Call.",
    /** The new/returning select's trade voice (the widget's statusLabels). */
    statusLabels: { new: "First time with Live Wire", returning: "You've had us out before" },
    /** The small print under the booking form: what happens to the details. */
    privacyNote:
        "Your address and number go on the work order and the permit application, nowhere else. We never sell or share them.",
}

export const request = {
    headline: "Get an exact quote.",
    body: "Tell us what you need wired and we'll send one flat price — usually the same day, Monday to Saturday. Power out, sparking, or a hot panel? Don't fill in a form. Call, it's answered 24/7.",
    confirmation:
        "Got it. We'll send a flat quote shortly (7 AM–7 PM, Mon–Sat). If anything sparks or smells hot, call — a person answers 24/7.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "phone", label: "Mobile (we'll text the quote)", type: "tel" as const, required: true },
        { name: "email", label: "Email", type: "email" as const },
        { name: "address", label: "Service address", required: true },
        {
            name: "issue",
            label: "What needs wiring?",
            placeholder: "Panel upgrade, flickering lights, EV charger …",
        },
        {
            name: "timing",
            label: "When works?",
            placeholder: "Today, this week, before the insurer's deadline …",
        },
        {
            name: "message",
            label: "Anything else? (A photo of the panel helps — you can text it after.)",
            type: "textarea" as const,
            fullWidth: true,
        },
    ],
}
