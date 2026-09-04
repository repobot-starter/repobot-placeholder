/**
 * The electrician remix seed: a complete, drop-in replacement for
 * `./content.ts` that retargets the emergency-services pack from the
 * plumber to an electrician — same dispatch shape, different trade. The
 * derived template `repobot-services-electric` is composed from the
 * services-emergency pack with this file copied over `content.ts` and the
 * amber brand overlay from `packs/services-electric/catalog.json` merged
 * over the pack's utility blue.
 *
 * Because the copy is verbatim, this file must stay a structural twin of
 * `content.ts`: same exports, images under its own `/services-electric/`
 * public directory. The parity test
 * (`tests/View/ServicesEmergency/remixSeeds.test.ts`) pins the export
 * surface against the real module, so the seed fails CI the moment the
 * pack's contract moves without it.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/services-electric` (see PACK.md). The `photo` helper
 * mirrors that verb's naming exactly. Never point a slot at a raw camera
 * file.
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
        src: `/services-electric/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/services-electric/${name}-${step}w.webp`, width: step })),
    }
}

export const business = {
    name: "Pilot Butte Electric",
    tagline: "Emergency and residential electrical service",
    location: "Bend, Oregon",
    /** Shown everywhere the number appears; `phoneHref` is the tap target.
     * On a dispatch site this number IS the product — it never leaves the
     * viewport (hero, nav CTA, banner, footer). */
    phone: "(541) 555-0164",
    phoneHref: "tel:+15415550164",
    email: "dispatch@pilotbutteelectric.example",
    address: "345 NE Greenwood Ave, Bend, OR 97701",
    /** The license line — rendered wherever trust is being earned. */
    license: "Licensed, bonded & insured — OR CCB #187620 · Electrical C-1049", // theme-exempt: license number, not a color
}

/** The dispatch promise, worn as the hero badge. A 24/7 line has no
 * open/closed state to compute — the badge is the always-on claim itself. */
export const dispatchBadge = "24/7 emergency dispatch — a person answers"

export const hoursNote = "Emergency line 24/7 · Office Monday–Friday 7:30 AM–5 PM"

/** The towns a truck actually reaches inside the response promise. */
export const serviceArea = ["Bend", "Redmond", "Sisters", "Tumalo", "Sunriver", "Prineville"]

/**
 * Landing copy the trade owns — mirrors the base module's `landingCopy`
 * so the landing module retrades its headings with the content.
 */
export const landingCopy = {
    /** The home page's services-section heading. */
    servicesHeading: "Panels, wiring, chargers — handled",
    /** The home page's closing call-out — the emergency hook itself. */
    finalCtaTitle: "Half the house gone dark?",
}

export interface Service {
    slug: string
    title: string
    /** Small uppercase label on the card, e.g. the sub-trade. */
    eyebrow: string
    description: string
    /** "From $149" / "Panel quote free" — flat, printed, no meter. */
    priceNote: string
    image: SiteImage
}

export const services: Service[] = [
    {
        slug: "emergency",
        title: "Emergency electrical",
        eyebrow: "24/7",
        description:
            "Burning smells, dead panels, sparking outlets, storm damage — a live dispatcher answers around the clock and a licensed electrician rolls within the hour.",
        priceNote: "No after-hours upcharge",
        image: photo(
            "service-emergency",
            1536,
            1024,
            "An electrician's van at a house at dusk, work lights on and the side door open",
        ),
    },
    {
        slug: "panels",
        title: "Panel upgrades",
        eyebrow: "Service & panels",
        description:
            "100-amp fuse boxes and recalled panels replaced with modern 200-amp service — load calculated, permitted, and inspected, with the utility coordinated by us.",
        priceNote: "From $2,800",
        image: photo(
            "service-panels",
            1536,
            1024,
            "A new electrical panel with neatly combed wiring and labeled breakers",
        ),
    },
    {
        slug: "ev-chargers",
        title: "EV charger installation",
        eyebrow: "Install",
        description:
            "Level 2 chargers installed with a dedicated circuit sized to your panel — hardwired or plug-in, permitted, and done in a day when capacity allows.",
        priceNote: "From $850",
        image: photo(
            "service-ev",
            1536,
            1024,
            "A wall-mounted EV charger newly installed in a tidy garage, cable coiled",
        ),
    },
    {
        slug: "lighting",
        title: "Lighting & fans",
        eyebrow: "Interior & exterior",
        description:
            "Recessed lighting, fixtures, dimmers, and ceiling fans — laid out for the room, installed clean, and switched the way you actually use them.",
        priceNote: "From $189",
        image: photo(
            "service-lighting",
            1536,
            1024,
            "An electrician installing a recessed light in a finished ceiling",
        ),
    },
    {
        slug: "circuits",
        title: "Outlets & circuits",
        eyebrow: "Repair & add",
        description:
            "Dead outlets brought back, GFCI and AFCI protection added, and new dedicated circuits run for kitchens, shops, and hot tubs — to code, every time.",
        priceNote: "From $149",
        image: photo(
            "service-outlets",
            1536,
            1024,
            "A new outlet being wired into a kitchen backsplash, screwdriver in hand",
        ),
    },
    {
        slug: "troubleshooting",
        title: "Troubleshooting & safety",
        eyebrow: "Diagnostics",
        description:
            "Flickering lights, tripping breakers, mystery switches — found with meters and thermal imaging, not guesswork, then quoted flat before repair.",
        priceNote: "Diagnostic $129",
        image: photo(
            "service-troubleshoot",
            1536,
            1024,
            "An electrician reading a multimeter at an open junction box",
        ),
    },
]

/** The trust numbers — the dispatch strip. Keep values short and big. */
export const metrics = [
    { value: "50 min", label: "average emergency response" },
    { value: "24/7", label: "line answered by a person" },
    { value: "7,200+", label: "jobs completed" },
    { value: "4.9★", label: "average of 390 reviews" },
]

export const testimonials = [
    {
        quote: "Half the house went dead at 9 PM and the panel was hot to the touch. A person answered immediately, talked me through shutting off the main, and an electrician was here in forty minutes.",
        name: "Teresa Malloy",
        detail: "Emergency panel repair, Bend",
    },
    {
        quote: "Two companies told us our EV charger needed a $6,000 service upgrade. Pilot Butte ran a load calculation, showed us the math, and installed it on our existing panel for a fraction of that.",
        name: "James & Hana Okada",
        detail: "EV charger install, Redmond",
    },
    {
        quote: "They've wired every remodel our company has built for five years. Clean work, labeled panels, inspections passed first time — and an office that answers the phone.",
        name: "Curt Weaver",
        detail: "General contractor, Bend",
    },
]

export const home = {
    headline: "When the power's wrong, we're already rolling.",
    subheadline:
        "Emergency and residential electrical service across Central Oregon — a live dispatcher answers 24/7 and a licensed electrician is at your door within the hour, with the price quoted flat before the work starts.",
    heroImage: photo(
        "hero-01",
        1536,
        1024,
        "A uniformed electrician working in an open electrical panel, headlamp on, tester in hand",
    ),
}

export const about = {
    headline: "The crew behind the trucks.",
    photo: photo(
        "crew",
        1024,
        1536,
        "Three Pilot Butte Electric electricians standing in front of a service van in the shop yard",
    ),
    paragraphs: [
        "Pilot Butte Electric started in 2012 with one van and a promise that still runs the company: answer the phone. Founder Marcus Bell spent ten years as a journeyman wiring Central Oregon homes before going out on his own, and the first hire wasn't a second electrician — it was a dispatcher.",
        "Today we run five trucks and a crew of eight, every electrician licensed, background-checked, and in uniform. Dispatch texts you a name, a photo, and a live ETA before the truck is out of the yard — you always know who's knocking.",
        "Every price is quoted flat before the work starts, every repair is warrantied in writing, and the after-hours price is the daytime price. Electrical emergencies don't wait for business hours — neither do we.",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "OR CCB #187620", // theme-exempt: license number, not a color
        "Electrical C-1049",
        "Bonded & insured",
        "Licensed journeyman crews",
        "Background-checked electricians",
    ],
}

export const steps = {
    kicker: "When you call",
    title: "From your call to fixed, in four steps",
    items: [
        {
            title: "A person answers",
            description:
                "No phone tree, no callback queue — a dispatcher picks up 24/7, asks the right questions, and tells you what to switch off while help rolls.",
        },
        {
            title: "The truck is dispatched",
            description:
                "You get a text with your electrician's name, photo, and a live ETA. Average emergency response across our service area is 50 minutes.",
        },
        {
            title: "Flat quote, before the work",
            description:
                "The electrician diagnoses, then quotes the whole job flat — parts, labor, permits. No hourly meter running while someone walks to the truck.",
        },
        {
            title: "Fixed, tested, tidy",
            description:
                "The repair is tested in front of you, the panel labeled, the area cleaned, and the warranty put in writing on the invoice before the van leaves.",
        },
    ],
}

export const faq = [
    {
        question: "Do you charge extra after hours?",
        answer: "No. The emergency line runs 24/7 and the after-hours price is the daytime price. Electrical emergencies are the job we built the company for — they shouldn't cost extra.",
    },
    {
        question: "What counts as an electrical emergency?",
        answer: "Burning smells, buzzing or hot panels, sparking outlets, exposed wires, and whole-home outages your utility says aren't theirs. When in doubt, call — the dispatcher will tell you honestly whether it can wait.",
    },
    {
        question: "Are you licensed and insured?",
        answer: "Yes — Oregon CCB #187620 and electrical contractor license C-1049, bonded and fully insured, and every electrician on the crew is a licensed journeyman. Certificates available before any work starts.", // theme-exempt: license number, not a color
    },
    {
        question: "How does pricing work?",
        answer: "Flat, quoted before the work starts. The electrician diagnoses the problem, quotes the whole job — parts, labor, permits — and the quote is the invoice. There is no hourly meter.",
    },
    {
        question: "Do you pull permits?",
        answer: "Always, when the work requires one — panels, new circuits, EV chargers, service changes. We file it, schedule the inspection, and meet the inspector. Unpermitted electrical work bites at resale; we don't do it.",
    },
]

export const request = {
    headline: "Tell us what's happening.",
    body: "Sparks, smells, or a dead panel? Call the line — it's answered 24/7. For anything that can wait until business hours, send the details below and the office will call you back within the hour, 7:30 AM to 5 PM.",
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
            placeholder: "Tripping breaker, dead outlets, EV charger …",
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
