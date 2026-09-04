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
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/services-hvac` (see PACK.md). The `photo` helper mirrors
 * that verb's naming exactly. Never point a slot at a raw camera file.
 */

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
}

/** The dispatch promise, worn as the hero badge. A 24/7 line has no
 * open/closed state to compute — the badge is the always-on claim itself. */
export const dispatchBadge = "24/7 emergency dispatch — a person answers"

export const hoursNote = "Emergency line 24/7 · Office Monday–Friday 8 AM–5 PM"

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

export const home = {
    headline: "No heat? No cool? No waiting.",
    subheadline:
        "Emergency heating and cooling service across Central Oregon — a live dispatcher answers 24/7 and a NATE-certified tech is out the same day, with the price quoted flat before the work starts.",
    heroImage: photo(
        "hero-01",
        1536,
        1024,
        "A uniformed HVAC technician kneeling at an open furnace, headlamp on, meter in hand",
    ),
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
