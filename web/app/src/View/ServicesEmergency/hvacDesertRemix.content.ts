/**
 * The HVAC remix seed: a complete, drop-in replacement for `./content.ts`
 * that retargets the emergency-services pack from the Pasadena plumber to
 * 115 Degrees Cooling & Heating, a Phoenix air-conditioning company — same
 * dispatch shape, different trade and city. The derived template
 * `repobot-services-hvac` is composed from the services-emergency pack
 * with this file copied over `content.ts`, the `sunbelt` register and page
 * skeletons pinned by `packs/services-hvac-desert/catalog.json`, and its hot-orange
 * brand merged over the pack's.
 *
 * Because the copy is verbatim, this file must stay a structural twin of
 * `content.ts`: same exports, images under its own `/services-hvac-desert/`
 * public directory. The parity test
 * (`tests/View/ServicesEmergency/remixSeeds.test.ts`) pins the export
 * surface against the real module, so the seed fails CI the moment the
 * pack's contract moves without it.
 *
 * Presence stays content-driven: the hero photograph rides beside the
 * headline (the catalog pins the split hero), `home.readout` sets the
 * giant "115°" over it, the empty `priceBoard` keeps the services grid and
 * the three-price book on the home page, and the empty `heroThread` keeps
 * "how it works" as plain steps.
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
        src: `/services-hvac-desert/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/services-hvac-desert/${name}-${step}w.webp`, width: step })),
    }
}

export const business = {
    name: "115 Degrees Cooling & Heating",
    tagline: "Same-day AC repair across the Valley",
    location: "Phoenix, Arizona",
    /** Shown everywhere the number appears; `phoneHref` is the tap target.
     * On a dispatch site this number IS the product — it never leaves the
     * viewport (hero, nav CTA, banner, footer). */
    phone: "(602) 555-0115",
    phoneHref: "tel:+16025550115",
    email: "cool@115degrees.example",
    address: "3130 E Indian School Rd, Phoenix, AZ 85016",
    /** The license line — rendered wherever trust is being earned. */
    license: "AZ ROC #331580 · Licensed, bonded & insured", // theme-exempt: license number, not a color
    /** The always-on promise, worn as the hero badge when `onCall.week` is
     * empty. Lives on `business` (not a bare string export) because the
     * content service edits a slot by walking an exported object/array
     * literal — a top-level string export is read-only in the panel. */
    dispatchBadge: "Same-day summer repair · 24/7 no-cool line",
}

export const hoursNote = "Office open 6 AM–8 PM, seven days"

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
    typicalArrival: "94% fixed same day last summer",
}

/** The Valley cities a truck actually reaches the same day. */
export const serviceArea = ["Phoenix", "Scottsdale", "Tempe", "Mesa", "Chandler", "Glendale", "Arcadia"]

/**
 * Landing copy the trade owns: the few strings the landing module renders
 * that would read wrong for a different trade. Remix seeds retrade these
 * along with the rest of the content — everything else in the landing
 * module is trade-neutral on purpose.
 */
export const landingCopy = {
    /** The services-grid heading (the home carries the grid when the hero
     * has no price board). */
    servicesHeading: "Repairs, tune-ups, heat pumps, whole new systems",
    /** The home page's closing call-out — the emergency hook itself. */
    finalCtaTitle: "AC quit at 4 PM in July?",
    /** The closing call-out's line under the title ("" = the 24/7 line and office hours). */
    finalCtaBody: "",
    /** The closing call-out's ask: a label sends it to the request page ("" = call the line). */
    finalCtaAsk: "",
    /** The label over the service-area names. */
    serviceAreaLabel: "Cooling the Valley",
    /** A small line under the nav wordmark ("" = the wordmark alone). */
    navTagline: "Phoenix, Arizona",
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
 * Three prices worth knowing, hung as tags on the home page and on
 * /services. Real numbers: the price on the tag is the price on the
 * invoice, in July the same as in January.
 */
export const priceBook: PriceBook = {
    title: "Three prices to know.",
    intro: "Printed, flat, and the same at 116° as at 72°. Every repair is quoted before we start.",
    items: [
        {
            group: "",
            name: "Tune-up",
            note: "Coil rinse, capacitor test, refrigerant check, new filter",
            price: "$89",
            qualifier: "",
        },
        {
            group: "",
            name: "Diagnostic",
            note: "With any repair — $79 on its own",
            price: "$0",
            qualifier: "",
        },
        {
            group: "",
            name: "New system",
            note: "3-ton heat pump, installed, permit and haul-away included",
            price: "$6,900",
            qualifier: "from",
        },
    ],
    footnote: "The quote is the invoice. No summer surcharge, no weekend rate.",
    ctaLabel: "Book a tune-up",
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
 * No price board on this hero — the 115° readout carries it, and the three
 * price tags run right under the hero instead.
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
 * and the final side by side are the proof the tags are honest.
 */
export const jobReports: JobReports = {
    kicker: "Job reports",
    headline: "What failed. What it cost.",
    body: "Every call ends with a report: what broke, a photo of the old part next to the new one, what we quoted, and what you paid. Most summer failures are a $20 part that cooked in the heat — we'll show you which.",
    items: [
        {
            jobNumber: "PHX-7731",
            title: "Dead at 116° — capacitor & contactor",
            location: "Arcadia, Phoenix",
            diagnosed: "Swollen run capacitor, pitted contactor, condenser fan stalled",
            quoted: "$385",
            final: "$385",
            timeOnSite: "1h 05m",
            stamp: "Cold again",
            before: photo(
                "report-capacitor-before",
                1152,
                1536,
                "A burned, soot-streaked contactor and dusty wiring inside a failed rooftop AC unit",
            ),
            after: photo(
                "report-capacitor-after",
                1152,
                1536,
                "The same AC unit with a new silver run capacitor, a clean contactor, and gauges connected to the refrigerant lines",
            ),
            tech: "Ruben Olivas",
            techDetail: "NATE-certified technician",
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
        slug: "ac-repair",
        title: "Same-day AC repair",
        eyebrow: "May through September",
        description:
            "Blowing warm, won't start, freezing up. Call before noon and a tech is at your unit the same day all summer — the truck carries the capacitors, contactors, and motors that fail most.",
        priceNote: "Free diagnostic",
        image: photo(
            "service-repair",
            1536,
            1152,
            "A 115 Degrees technician in a sun hat kneeling at an outdoor AC condenser with gauges, a palo verde tree and stucco wall behind him",
        ),
    },
    {
        slug: "tune-ups",
        title: "Tune-ups & maintenance plans",
        eyebrow: "Spring & fall",
        description:
            "Coils rinsed, capacitors tested, refrigerant checked before the first 110° day. Plan members get two visits a year, front of the line in July, and 15% off repairs.",
        priceNote: "$89",
        image: photo(
            "service-tuneup",
            1536,
            1152,
            "A gloved hand rinsing a dusty condenser coil with a hose spray in the desert sun, a saguaro and mountain behind",
        ),
    },
    {
        slug: "heat-pumps",
        title: "Heat pumps",
        eyebrow: "Cool & heat",
        description:
            "One system for 115° afternoons and 38° January mornings. We size it to your house — not the last house — and file the SRP or APS rebate paperwork for you.",
        priceNote: "From $6,900",
        image: photo(
            "service-heatpump",
            1536,
            1152,
            "A 115 Degrees technician kneeling at a new heat pump beside a pink stucco house with a citrus tree and desert landscaping",
        ),
    },
    {
        slug: "new-systems",
        title: "New systems & rooftop swaps",
        eyebrow: "Replacements",
        description:
            "Rooftop package units craned on and off in a morning, split systems swapped in a day. City permit, haul-away, and a ten-year parts and labor warranty.",
        priceNote: "From $6,900",
        image: photo(
            "service-install",
            1536,
            1152,
            "A crane lowering a new rooftop AC package unit onto a flat roof as two technicians guide it, a red rock mountain and saguaros behind",
        ),
    },
    {
        slug: "ducts-air",
        title: "Ducts, filters & monsoon dust",
        eyebrow: "Air quality",
        description:
            "After a haboob the dust ends up in your filter, your coil, and your lungs. Filter swaps, duct sealing, and a post-storm coil clean that gets the airflow back.",
        priceNote: "From $149",
        image: photo(
            "service-ducts",
            1536,
            1152,
            "A gloved hand pulling a dust-clogged air filter from a return vent next to a clean new filter, a tiled hallway behind",
        ),
    },
    {
        slug: "no-cool",
        title: "24/7 no-cool line",
        eyebrow: "After dark",
        description:
            "When it's still 100° at 9 PM, nobody should wait until morning. A person answers around the clock and a tech rolls for seniors, babies, and pets first.",
        priceNote: "Same prices",
        image: photo(
            "service-emergency",
            1536,
            1152,
            "A 115 Degrees technician working on an AC unit outside a house at dusk, palm trees and a saguaro silhouetted against an orange sky",
        ),
    },
]

/** The proof strip. Keep values short and big. */
export const metrics = [
    { value: "94%", label: "fixed same day, June–Sept" },
    { value: "24/7", label: "no-cool line" },
    { value: "10 yr", label: "parts & labor on new systems" },
]

export const testimonials = [
    {
        quote: "It was 116 and the unit just stopped. They were on my roof by two, it was a capacitor, and the house was cold again before my kids got home. $385, exactly what the tech said up top.",
        name: "Marisol Reyes",
        detail: "Same-day repair, Glendale",
    },
    {
        quote: "Two other companies told us we needed a whole new system. Dana's tech found a cooked contactor, showed us the burn marks, and fixed it for a fraction. We'll call them when it's actually time.",
        name: "Greg & Linda Hoffman",
        detail: "Diagnostic + repair, Scottsdale",
    },
    {
        quote: "We switched to a heat pump before summer. They did the SRP rebate paperwork, the bill dropped the first month, and we finally have heat in January that isn't a space heater.",
        name: "Tuan Pham",
        detail: "Heat pump install, Mesa",
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
    headline: "Cold air. Fast.",
    subheadline:
        "Same-day AC repair across the Valley, three prices printed right here, and a person on the line at 2 AM when the house won't cool down.",
    heroImage: photo(
        "hero-rooftop",
        2400,
        1800,
        "A 115 Degrees technician in a sun hat kneeling at a rooftop AC unit under a hard blue Phoenix sky, a saguaro and a red rock mountain behind him",
    ),
    seal: "",
    readout: { value: "115°", note: "72° inside" },
    credit: "",
}

export const about = {
    headline: "I'm Dana. Nobody in this Valley should sweat through a night.",
    photo: photo(
        "about-owner",
        1536,
        1152,
        "Dana Begay, owner of 115 Degrees, smiling in a khaki work shirt beside her white service van, saguaros and a red mountain behind her",
    ),
    paragraphs: [
        "I grew up in Tuba City with a swamp cooler that quit every August, and I learned the trade because I got tired of waiting on somebody else to fix it. I started 115 Degrees in 2011 with one van and a phone that never went to voicemail.",
        "We run on a simple idea: the price is printed before the work starts, and summer doesn't cost extra. Most calls in July are a part that cooked in the heat, not a new system — we'll show you the burned part and let you decide.",
        "There are fourteen of us now, NATE-certified, working Phoenix to Chandler. From May to September we hold trucks open every afternoon for same-day calls.",
    ],
    /** The checked lines under the story (after the license line). */
    bullets: [
        "Three prices printed on the site — no summer surcharge",
        "Same-day repair held open every afternoon, May through September",
        "SRP and APS rebate paperwork filed for you",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "AZ ROC #331580", // theme-exempt: license number, not a color
        "NATE-certified techs",
        "EPA 608 refrigerant",
        "Woman- & Native-owned",
        "Since 2011",
    ],
}

/**
 * How it works. With a hero photograph the text thread moves down here:
 * each message becomes a step (its bubble) and the step at the same
 * position supplies the walkthrough under it; without one, these read as
 * four numbered steps.
 */
export const steps = {
    kicker: "When it quits",
    title: "From 98° inside back to 72°.",
    items: [
        {
            title: "Call before noon",
            description:
                "A person answers and asks what the unit is doing. If you've got seniors, a baby, or pets at home, say so — they go first.",
        },
        {
            title: "A tech is there today",
            description:
                "We text the arrival window and the tech's photo. The diagnostic is free if we do the repair.",
        },
        {
            title: "One flat price",
            description:
                "You see the failed part and the price to fix it before anything's replaced. Say no and you owe $79, nothing more.",
        },
        {
            title: "Cold before dinner",
            description:
                "Most summer repairs are done in about an hour off the truck. The report and the photos hit your phone before we leave.",
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
    name: "115 Degrees",
    detail: "Phoenix, AZ",
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
        question: "Why does my AC always quit on the hottest day?",
        answer: "Because the hottest day is when it works hardest. At 115° the condenser is trying to dump heat into air that's already hotter than most units were designed for, so capacitors swell, contactors pit, and fan motors overheat. A spring tune-up catches most of those parts before July does.",
    },
    {
        question: "Do I need more refrigerant?",
        answer: "Refrigerant isn't used up — if it's low, it's leaking. We find the leak before we add any, and we'll tell you honestly whether a repair makes sense. Older units that run on R-22 are expensive to recharge now that it's phased out; that's often when replacing pays off.",
    },
    {
        question: "Are there SRP or APS rebates?",
        answer: "Both SRP and APS have offered rebates on qualifying high-efficiency heat pumps and on some maintenance, and the terms change from year to year. Tell us your utility when you book and we'll check what's current, size the system to qualify, and file the paperwork for you.",
    },
    {
        question: "What does monsoon dust do to my unit?",
        answer: "A haboob packs your condenser coil and filter with fine dust, and the unit has to fight to move heat and air. Change the filter after a big storm and rinse the outdoor coil gently with a hose (power off first). Monsoon lightning and outages also take out capacitors — if it won't restart after a storm, call.",
    },
    {
        question: "Is summer really the same price?",
        answer: "Yes. The tune-up is $89 in January and in July, the diagnostic is free with a repair, and every repair is quoted flat before we start. No surge pricing, no weekend rate, no after-dark upcharge.",
    },
    {
        question: "Is the work guaranteed?",
        answer: "Repairs carry a one-year parts and labor warranty; new systems carry ten years on parts and labor, registered in your name. If something we fixed fails, we come back free.",
    },
]

/**
 * The appointments contract's code fallback — the same booking mode 2 the
 * care pack runs (web/app/src/View/Landing/practiceDocument.ts): visit
 * types x weekly availability windows, projected into concrete capacity-1
 * slots by `generateAppointmentSlots`. The catalog's `content.appointments`
 * seed mirrors this export exactly (the content tests pin the twin).
 *
 * The dispatch trade books what can WAIT: a tune-up and a new-system
 * estimate. A dead AC never touches the calendar — the 24/7 line owns
 * those, and the copy keeps saying so. One provider, early hours: nobody
 * wants a tech on the roof at 3 PM in July.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "tune-up",
            name: "AC tune-up",
            durationMinutes: 60,
            description:
                "Coil rinse, capacitor and contactor test, refrigerant check, and a new filter — $89, flat.",
        },
        {
            typeId: "system-estimate",
            name: "New system estimate",
            durationMinutes: 45,
            description:
                "We measure the house, look at the ducts, and quote a heat pump or AC flat, rebates included.",
        },
    ],
    providers: [
        {
            providerId: "dana-begay",
            name: "Dana Begay",
            windows: [
                { day: 1, start: 6 * 60, end: 14 * 60 },
                { day: 2, start: 6 * 60, end: 14 * 60 },
                { day: 3, start: 6 * 60, end: 14 * 60 },
                { day: 4, start: 6 * 60, end: 14 * 60 },
                { day: 5, start: 6 * 60, end: 14 * 60 },
                { day: 6, start: 6 * 60, end: 11 * 60 },
            ],
        },
    ],
}

/** The /request page's booking strip — the slot picker above the form. */
export const booking = {
    headline: "Book a tune-up",
    intro: "Mornings only, while the roof is still cool. We'll text to confirm. Unit dead and the house heating up? Don't book it — call, a person answers 24/7.",
    /** The new/returning select's trade voice (the widget's statusLabels). */
    statusLabels: { new: "New to 115 Degrees", returning: "We've been out before" },
    /** The small print under the booking form: what happens to the details. */
    privacyNote:
        "We use your number to text the tech's arrival window and your address to find the unit. Never sold, never shared.",
}

export const request = {
    headline: "Get a flat quote.",
    body: "Tell us what the unit's doing and we'll text back a flat price — usually within the hour, 6 AM to 8 PM. No cool air and it's getting hot inside? Skip the form and call. Someone answers 24/7.",
    confirmation:
        "Got it. A flat quote is on its way by text (6 AM–8 PM). If the house is heating up, call — a person answers 24/7.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "phone", label: "Mobile (we'll text the quote)", type: "tel" as const, required: true },
        { name: "email", label: "Email", type: "email" as const },
        { name: "address", label: "Service address", required: true },
        {
            name: "issue",
            label: "What's the unit doing?",
            placeholder: "Blowing warm, won't turn on, water by the air handler …",
        },
        {
            name: "timing",
            label: "How soon?",
            placeholder: "Today — it's 90° inside, this week, before summer …",
        },
        {
            name: "message",
            label: "Anything else? (A photo of the unit's label helps — you can text it after.)",
            type: "textarea" as const,
            fullWidth: true,
        },
    ],
}
