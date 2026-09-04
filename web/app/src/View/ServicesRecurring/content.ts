/**
 * The recurring-services pack's single content file: the business, its
 * plans, and pages. Everything the site renders comes from here — edit
 * this file (not the page components) to make the site yours. The demo
 * business is a home cleaner, but the shape fits any subscription trade:
 * lawn care, pool service, pest control — swap the plans and copy and the
 * site follows.
 *
 * This is the `services` category's recurring/booking shape: the sell is
 * plans and repetition, not a one-off job. Pricing tiers sit on the home
 * page, the plans page compares what's included line by line, and the
 * form asks for a frequency, not a project.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/services-recurring` (see PACK.md). The `photo` helper
 * mirrors that verb's naming exactly. Never point a slot at a raw camera
 * file.
 */

import type { DayHours } from "../Landing/hours"

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
        src: `/services-recurring/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/services-recurring/${name}-${step}w.webp`, width: step })),
    }
}

export const business = {
    name: "Juniper Home Cleaning",
    tagline: "Recurring home cleaning",
    location: "Bend, Oregon",
    /** Shown everywhere the number appears; `phoneHref` is the tap target. */
    phone: "(541) 555-0173",
    phoneHref: "tel:+15415550173",
    email: "hello@juniperhomecleaning.example",
    address: "61510 S Hwy 97, Suite 8, Bend, OR 97702",
    /** The trust line — rendered wherever trust is being earned. */
    license: "Bonded & insured — every cleaner background-checked",
}

/**
 * Weekly hours drive the live "Open now — closes 6 PM" hero badge (the
 * shared hours engine, `View/Landing/hours.ts`). Minutes since midnight;
 * a day may have several intervals.
 */
export const weeklyHours: DayHours[] = [
    { day: 1, intervals: [[480, 1080]] }, // Mon 8 AM – 6 PM
    { day: 2, intervals: [[480, 1080]] },
    { day: 3, intervals: [[480, 1080]] },
    { day: 4, intervals: [[480, 1080]] },
    { day: 5, intervals: [[480, 1080]] }, // Fri
    { day: 6, intervals: [[540, 900]] }, // Sat 9 AM – 3 PM
]

export const hoursNote = "Monday–Friday 8 AM–6 PM · Saturday 9 AM–3 PM · Instant quotes by phone"

/** The neighborhoods the teams actually drive to — the quiet strip. */
export const serviceArea = ["Bend", "Redmond", "Tumalo", "Sisters", "Sunriver", "Eagle Crest"]

/**
 * Landing copy the trade owns: the few strings the landing and shell
 * modules render that would read wrong for a different trade. Remix seeds
 * retrade these along with the rest of the content — everything else in
 * those modules is trade-neutral on purpose.
 */
export const landingCopy = {
    /** The booking ask — the shell's nav CTA and every landing CTA. */
    bookCtaLabel: "Book a cleaning",
    /** The plans page's nudge for the undecided. */
    fitNudgeTitle: "Not sure which rhythm fits? Start with a deep clean.",
    /** The about page's credentials-strip label. */
    credentialsLabel: "Why clients hand us keys",
}

export interface Plan {
    slug: string
    name: string
    /** Per-visit price in dollars — the recurring shape prices the visit. */
    perVisit: number
    description: string
    features: string[]
    /** The recommended plan: accent border and the badge treatment. */
    highlighted?: boolean
    badge?: string
}

export const plans: Plan[] = [
    {
        slug: "weekly",
        name: "Weekly",
        perVisit: 129,
        description: "The same team every week — the house never gets a chance to slip.",
        features: [
            "All rooms: dust, vacuum, mop",
            "Kitchen & baths every visit",
            "Same two-person team",
            "Rotating deep-clean task each visit",
            "Priority scheduling",
        ],
        highlighted: true,
        badge: "Most popular",
    },
    {
        slug: "biweekly",
        name: "Every two weeks",
        perVisit: 149,
        description: "The rhythm most homes run on — thorough, predictable, affordable.",
        features: [
            "All rooms: dust, vacuum, mop",
            "Kitchen & baths every visit",
            "Same two-person team",
            "Rotating deep-clean task each visit",
        ],
    },
    {
        slug: "deep-clean",
        name: "Deep clean",
        perVisit: 329,
        description: "A one-time reset — move-ins, move-outs, spring, or before the in-laws.",
        features: [
            "Everything in a recurring visit",
            "Inside fridge & oven",
            "Baseboards, vents & window sills",
            "Interior windows & tracks",
            "Cabinet fronts hand-wiped",
        ],
    },
]

/** What every visit includes — the icon list on the home page. */
export const included = [
    {
        icon: "star" as const,
        title: "Kitchens, reset",
        description: "Counters, sink, stovetop, and appliance exteriors degreased and shined — every visit.",
    },
    {
        icon: "shield" as const,
        title: "Baths, disinfected",
        description: "Toilets, tubs, showers, and tile scrubbed with hospital-grade, kid-safe product.",
    },
    {
        icon: "layers" as const,
        title: "Every floor",
        description:
            "Vacuumed and mopped to the corners — including under the things other crews slide around.",
    },
    {
        icon: "users" as const,
        title: "The same team",
        description:
            "Your home, your team: the same background-checked pair every visit, who learn how you like it.",
    },
    {
        icon: "clock" as const,
        title: "On time, told twice",
        description:
            "A reminder the day before, a text when the team is en route, and an arrival window we hit.",
    },
    {
        icon: "check" as const,
        title: "Guaranteed",
        description:
            "Anything not right, tell us within 48 hours and we re-clean it free. No forms, no fuss.",
    },
]

/**
 * The plans page's line-by-line comparison. `columns` heads the table
 * (first entry is the criterion column); each row carries one value per
 * plan — booleans render as ✓ / —.
 */
export const planComparison = {
    columns: ["", "Weekly", "Every two weeks", "Deep clean"],
    rows: [
        { label: "All rooms: dust, vacuum, mop", values: [true, true, true] },
        { label: "Kitchen counters, sink & appliance exteriors", values: [true, true, true] },
        { label: "Bathrooms scrubbed & disinfected", values: [true, true, true] },
        { label: "Rotating deep-clean task each visit", values: [true, true, false] },
        { label: "Inside fridge & oven", values: ["On request", "On request", true] },
        { label: "Baseboards, vents & window sills", values: ["Rotating", "Rotating", true] },
        { label: "Interior windows & tracks", values: [false, false, true] },
        { label: "Same team every visit", values: [true, true, false] },
        { label: "48-hour re-clean guarantee", values: [true, true, true] },
    ],
}

/** The trust numbers — the metrics strip. Keep values short and big. */
export const metrics = [
    { value: "2,800+", label: "homes on a schedule" },
    { value: "100%", label: "background-checked cleaners" },
    { value: "4.9★", label: "average of 340 reviews" },
    { value: "48-hr", label: "re-clean guarantee" },
]

export const testimonials = [
    {
        quote: "Same two people every Tuesday for three years. They know which door the cat bolts for and how I like the pillows — I haven't thought about cleaning since 2023.",
        name: "Melissa Grant",
        detail: "Weekly plan, Bend",
    },
    {
        quote: "We tried four services before Juniper. The difference is the checklist — nothing gets skipped, and when a baseboard got missed once, they came back the next morning without an argument.",
        name: "Tom & Rachel Osei",
        detail: "Every-two-weeks plan, Redmond",
    },
    {
        quote: "Booked a move-out deep clean on a Thursday for Saturday. The landlord walked through, checked his list twice, and handed back the whole deposit.",
        name: "Kayla Nguyen",
        detail: "Deep clean, Bend",
    },
]

export const home = {
    headline: "Come home to done.",
    subheadline:
        "Recurring home cleaning across Central Oregon — the same background-checked team, on a schedule, with a checklist that never gets skipped and a guarantee in writing.",
    heroImage: photo(
        "hero-01",
        1536,
        1024,
        "A bright, freshly cleaned living room with morning light across a spotless wood floor",
    ),
}

/** The proof gallery — the standard, in photos. Click any to zoom. */
export const gallery = [
    {
        caption: "Kitchens: counters, sink, stovetop & appliance fronts, every visit",
        image: photo(
            "gallery-kitchen",
            1536,
            1024,
            "A spotless white kitchen with polished counters and a shining sink",
        ),
    },
    {
        caption: "Baths: scrubbed, disinfected, and towels squared",
        image: photo(
            "gallery-bath",
            1536,
            1024,
            "A gleaming bathroom with folded white towels and polished fixtures",
        ),
    },
    {
        caption: "Bedrooms: dusted, vacuumed, beds made hotel-tight",
        image: photo(
            "gallery-bedroom",
            1536,
            1024,
            "A tidy bedroom with a crisply made bed and sunlight on a clean floor",
        ),
    },
]

export const about = {
    headline: "A team you'd leave a key with.",
    photo: photo(
        "crew",
        1024,
        1536,
        "Two Juniper Home Cleaning team members with a supply caddy at a client's front door",
    ),
    paragraphs: [
        "Juniper started in 2016 when founder Anh Tran cleaned houses solo with a paper checklist and a rule she never broke: if it's on the list, it gets done — every visit, no matter whose house or how tired the day. The checklist is longer now and the team is twenty-two people, but the rule hasn't moved.",
        "Every cleaner is an employee — never a contractor — background-checked, bonded, insured, and paid above market so they stay. That's why you get the same team every visit: the average cleaner has been with us four years, and clients notice.",
        "We clean with kid-safe, pet-safe products, carry our own supplies, and stand behind every visit with a 48-hour guarantee: anything not right, we come back and re-clean it free.",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "Bonded & insured",
        "Employees, not contractors",
        "100% background-checked",
        "Kid- & pet-safe products",
        "48-hour guarantee",
    ],
}

export const faq = [
    {
        question: "Do I get the same cleaners every time?",
        answer: "Yes — on weekly and every-two-weeks plans you're assigned a two-person team, and they're yours. Substitutions only happen for illness or vacation, and we tell you in advance when they do.",
    },
    {
        question: "Do I need to be home?",
        answer: "Most clients aren't. We can hold a key or a garage code in our bonded key system, and you get a text when the team arrives and another when they lock up.",
    },
    {
        question: "What if something isn't right?",
        answer: "Tell us within 48 hours and we re-clean it free — no forms, no debate. It's the guarantee that keeps our checklist honest.",
    },
    {
        question: "Are your cleaners employees?",
        answer: "Yes, every one — background-checked, bonded, insured, trained on our checklist, and paid above market. We never send contractors or day labor into your home.",
    },
    {
        question: "What does it cost for my house?",
        answer: "The plan prices cover a typical three-bed, two-bath home. Larger homes, first visits, and add-ons like inside-fridge get a flat adjustment we quote before we book — call for an instant quote, or send the form and we'll reply the same day.",
    },
    {
        question: "Can I skip or reschedule a visit?",
        answer: "Any time up to noon the day before, free — life happens. Same-day skips are half the visit price, because your team's day was planned around you.",
    },
]

export const book = {
    headline: "Get your Saturdays back.",
    body: "Tell us about your home and the rhythm you want — weekly, every two weeks, or a one-time deep clean — and we'll reply the same day with a flat quote and your team's first opening.",
    confirmation:
        "Thank you — your request is in. We reply the same business day with a flat quote and the first opening for your home.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "phone", label: "Phone", type: "tel" as const, required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        { name: "address", label: "Home address", required: true },
        { name: "size", label: "Home size", placeholder: "3 bed / 2 bath, about 1,800 sq ft" },
        {
            name: "frequency",
            label: "How often?",
            placeholder: "Weekly, every two weeks, one-time deep clean",
        },
        {
            name: "notes",
            label: "Anything we should know",
            type: "textarea" as const,
            fullWidth: true,
            placeholder: "Pets, gate codes, the room that needs extra love …",
        },
    ],
}
