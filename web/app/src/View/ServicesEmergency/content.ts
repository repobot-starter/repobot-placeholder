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
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/services-emergency` (see PACK.md). The `photo` helper
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
}

/** The dispatch promise, worn as the hero badge. A 24/7 line has no
 * open/closed state to compute — the badge is the always-on claim itself. */
export const dispatchBadge = "24/7 emergency dispatch — a person answers"

export const hoursNote = "Emergency line 24/7 · Office Monday–Friday 8 AM–5 PM"

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

export const home = {
    headline: "Water doesn't wait. Neither do we.",
    subheadline:
        "Emergency plumbing and drain service across Central Oregon — a live dispatcher answers 24/7 and a licensed tech is at your door in under an hour, with the price quoted flat before the work starts.",
    heroImage: photo(
        "hero-01",
        1536,
        1024,
        "A uniformed plumber kneeling at an open sink cabinet, headlamp on, wrench in hand",
    ),
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
