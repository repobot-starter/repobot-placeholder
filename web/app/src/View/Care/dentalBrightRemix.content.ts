/**
 * The care-dental-bright remix's content seed (packs/README.md "Derived
 * templates"): a general and family dental office worn over the care
 * pack. At compose time this file is copied byte-for-byte over
 * `View/Care/content.ts`, so it must remain a STRUCTURAL TWIN of that
 * module — the same export surface, the same shapes, the contract's
 * minimums met (tests/View/Care/dentalBrightRemixSeed.test.ts pins the twin).
 *
 * The trade: Bright Side Dental, a two-dentist office on Wilshire in
 * Koreatown, Los Angeles — kids, grown-ups, and the extremely nervous.
 * The hero wears three stickers (Open Saturdays, Kids love it here, Most
 * insurance), the three things people switch for ride as glossy pills,
 * and self-pay prices are printed. Insurance plans are named as text
 * only, never logos. The booking surface stays clinically empty — name,
 * contact, visit type, new/returning.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/care-dental-bright` (see PACK.md). The art direction is Y2K
 * candy pop: bubblegum pink and mint rooms, glossy chairs, real grins,
 * color-blocked portraits.
 */
import type { AppointmentsContent, PracticeContent, PracticeHoursEntry } from "../Landing/practiceDocument"
import type {
    CareExhibits,
    CareFaq,
    CareHome,
    CareJourney,
    CareMenu,
    CarePromises,
    CareSpotlight,
} from "./careSections"

export interface CareImage {
    src: string
    alt: string
    width: number
    height: number
    srcSet: { src: string; width: number }[]
}

/** The width ladder `npm run image -- responsive` emits by default. */
const LADDER = [640, 1024, 1600, 2400]

/** A responsive-verb image entry from its name and intrinsic size. */
function photo(name: string, width: number, height: number, alt: string): CareImage {
    const widths = [...new Set(LADDER.map((step) => Math.min(step, width)))]
    return {
        src: `/care-dental-bright/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/care-dental-bright/${name}-${step}w.webp`, width: step })),
    }
}

export const practice = {
    name: "Bright Side Dental",
    tagline: "Gentle dentistry for kids, grown-ups, and the nervous",
    city: "Koreatown, Los Angeles",
    address: "3700 Wilshire Boulevard, Suite 210, Los Angeles, CA 90010",
    phone: "(213) 555-0126",
    email: "hi@brightsidedental.example",
    mapsQuery: "3700 Wilshire Boulevard Los Angeles CA 90010",
}

/**
 * The office's week: weekdays plus a real Saturday (the one day school
 * and work both let go). Sundays closed. 0 = Sunday … 6 = Saturday;
 * times are minutes since midnight.
 */
export const clinicHours: PracticeHoursEntry[] = [
    { day: 1, open: 9 * 60, close: 18 * 60 },
    { day: 2, open: 9 * 60, close: 18 * 60 },
    { day: 3, open: 10 * 60, close: 19 * 60 },
    { day: 4, open: 9 * 60, close: 18 * 60 },
    { day: 5, open: 8 * 60, close: 16 * 60 },
    { day: 6, open: 8 * 60, close: 14 * 60 },
]

/** Portraits by provider id — the contract carries facts, code carries art. */
export const providerPhotos: Record<string, CareImage> = {
    "dr-yoon": photo(
        "portrait-yoon",
        1024,
        1365,
        "Dr. Grace Yoon in mint scrubs, arms folded and grinning, against a bubblegum-pink wall",
    ),
    "dr-ortiz": photo(
        "portrait-ortiz",
        1024,
        1365,
        "Dr. Mateo Ortiz in cherry-red scrubs laughing and holding up a toothbrush against a mint wall",
    ),
    "santos-rdh": photo(
        "portrait-santos",
        1024,
        1365,
        "Joy Santos in pink scrubs with a heart clip in her hair, flashing a peace sign against a red wall",
    ),
}

/**
 * The `practice` content domain, code fallback. Section by section this
 * is what the Manage practice editor writes into repobot.content.json —
 * the site renders identically from either source.
 */
export const codePractice: PracticeContent = {
    providers: [
        {
            providerId: "dr-yoon",
            name: "Dr. Grace Yoon",
            credentials: "DDS",
            role: "General & family dentistry · Founder",
            tags: undefined,
            bio: "Grace opened Bright Side in 2019 because she was tired of dental offices that felt like waiting for bad news. She sees kids from their first tooth and grown-ups who haven't been in a decade — no lectures. She speaks Korean and English.",
        },
        {
            providerId: "dr-ortiz",
            name: "Dr. Mateo Ortiz",
            credentials: "DMD",
            role: "Clear aligners & cosmetic dentistry",
            tags: undefined,
            bio: "Mateo does the office's clear aligner cases, whitening, and bonding, and he's the one to see if a chipped tooth ruined your weekend. He explains every step before he takes it, in English or Spanish.",
        },
        {
            providerId: "santos-rdh",
            name: "Joy Santos",
            credentials: "RDH",
            role: "Registered dental hygienist",
            tags: undefined,
            bio: "Joy runs cleanings like a spa appointment with better lighting. Headphones, a warm blanket, a thumbs-up system for breaks — and a gift for getting kids to open wide on the first try.",
        },
    ],
    services: [
        {
            name: "Cleanings & checkups",
            description:
                "A gentle cleaning, a real look, and x-rays only when you need them. Most visits take under an hour, with breaks whenever you want one.",
        },
        {
            name: "Clear aligners",
            description:
                "Straighter teeth without metal brackets. A scan, a plan you can see before you start, and check-ins every six to eight weeks.",
        },
        {
            name: "Emergency same-day",
            description:
                "A broken tooth, a swollen jaw, a lost filling. Call before noon and we'll see you today — Saturdays included.",
        },
        {
            name: "Kids' dentistry",
            description:
                "First visits from the first tooth. Sealants, fluoride, and a treasure box at the end, with parents welcome in the room.",
        },
        {
            name: "Fillings & crowns",
            description:
                "Tooth-colored fillings and same-week crowns, with numbing that actually works and a plan printed before we start.",
        },
        {
            name: "Whitening & bonding",
            description:
                "In-office whitening in one visit or take-home trays. Bonding for chips and gaps that bug you in photos.",
        },
        {
            name: "Care for nervous patients",
            description:
                "Tell us it's hard for you. Longer appointments, a stop signal we always honor, and laughing gas when it helps.",
        },
    ],
    // Plans the office is in network with, as plain text — never logos.
    insurance: [
        "Delta Dental PPO",
        "MetLife Dental",
        "Cigna Dental PPO",
        "Guardian Dental",
        "Aetna Dental PPO",
        "United Concordia",
        "Medi-Cal Dental for kids",
    ],
    locations: [
        {
            locationId: "wilshire",
            label: "Wilshire & Western",
            address: practice.address,
            phone: practice.phone,
            hours: clinicHours,
        },
    ],
    // Owner-curated: real quotes the office chose to publish — contract
    // data, never runtime review ingestion.
    reviews: [
        {
            quote: "My daughter asked when she gets to go back. To the DENTIST. Joy is a wizard.",
            name: "Hannah L.",
            detail: "Patient family since 2021",
        },
        {
            quote: "I hadn't been in eight years because I was embarrassed. Dr. Yoon didn't lecture me once. We made a plan, and I actually finished it.",
            name: "Marcus T.",
            detail: "Patient since 2023",
        },
        {
            quote: "Cracked a molar on a Saturday morning and was in the chair by eleven. The waiting room is extremely pink and I'm here for it.",
            name: "Priya S.",
            detail: "Patient since 2022",
        },
        {
            quote: "Dr. Ortiz showed me what my teeth would look like before I paid a cent. Nine months later they look exactly like that.",
            name: "Daniel K.",
            detail: "Clear aligner patient, 2024",
        },
    ],
    newPatient: [
        {
            title: "Book online",
            body: "Pick a new-patient visit and a time. We'll check your insurance before you arrive and tell you your share in writing.",
        },
        {
            title: "Paperwork in five minutes",
            body: "Arrive ten minutes early and fill in your forms on a tablet at the front desk — no clipboard, and nothing health-related goes through the website.",
        },
        {
            title: "Your first visit",
            body: "About 90 minutes: x-rays if you need them, an exam, a cleaning, and a printed plan with every price on it.",
        },
        {
            title: "Kids' first visit",
            body: "Short, fun, and mostly about meeting the chair. Parents stay in the room. We see kids from their first tooth.",
        },
    ],
}

/**
 * The `appointments` content domain, code fallback — booking mode 2's
 * inputs. Visit types carry the slot length they book; each provider's
 * weekly windows are packed back-to-back into concrete capacity-1 slots
 * by `generateAppointmentSlots`.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "new-patient",
            name: "New patient visit",
            durationMinutes: 90,
            description: "Exam, x-rays if needed, a cleaning, and your plan.",
        },
        {
            typeId: "cleaning",
            name: "Cleaning & checkup",
            durationMinutes: 60,
            description: "Your regular cleaning and a quick look from the dentist.",
        },
        {
            typeId: "emergency",
            name: "Emergency visit",
            durationMinutes: 30,
            description: "Same-day for a broken tooth, a lost filling, or swelling.",
        },
    ],
    providers: [
        {
            providerId: "dr-yoon",
            name: "Dr. Grace Yoon",
            windows: [
                { day: 1, start: 9 * 60, end: 13 * 60 },
                { day: 3, start: 14 * 60, end: 18 * 60 },
                { day: 6, start: 8 * 60, end: 12 * 60 },
            ],
        },
        {
            providerId: "dr-ortiz",
            name: "Dr. Mateo Ortiz",
            windows: [
                { day: 2, start: 9 * 60, end: 13 * 60 },
                { day: 4, start: 13 * 60, end: 17 * 60 },
            ],
        },
        {
            providerId: "santos-rdh",
            name: "Joy Santos, RDH",
            windows: [
                { day: 2, start: 13 * 60, end: 17 * 60 },
                { day: 5, start: 8 * 60, end: 12 * 60 },
                { day: 6, start: 10 * 60, end: 14 * 60 },
            ],
        },
    ],
}

/**
 * Landing copy the practice's discipline owns — the base module's
 * `landingCopy`, retraded for a dental office.
 */
export const landingCopy = {
    /** The shell's nav labels for the pack's canonical trio of pages. */
    nav: { providers: "Our team", services: "Treatments", newPatients: "New patients" },
    /** The booking ask — the shell CTA and every page's primary CTA. */
    bookCtaLabel: "Book online",
    home: {
        secondaryCtaLabel: "Meet the team",
        servicesKicker: "Treatments",
        servicesHeading: "Everything under one pink roof",
        providersKicker: "The team",
        providersHeading: "Two dentists, one hygienist, zero lectures.",
        reviewsKicker: "Happy mouths",
        bannerTitle: "Saturday at 10? We're open.",
    },
    /** The insurance strip's kicker, shared by home, treatments, new patients. */
    insuranceKicker: "In network with most PPO plans",
    /** The visit panel's headline — it names the practice's own street. */
    visitHeadline: "On Wilshire, second floor, the pink door.",
    providersPage: {
        headline: "Our team.",
        subheadline:
            "Dr. Yoon, Dr. Ortiz, and Joy — plus a front desk that answers the phone on the second ring. Korean, Spanish, and English spoken.",
    },
    servicesPage: {
        headline: "Treatments.",
        subheadline:
            "Cleanings, kids, clear aligners, and same-day emergencies, with a written plan and every price printed before we start.",
        bannerTitle: "Toothache? Call before noon.",
    },
    newPatientsPage: {
        headline: "New here? Welcome.",
        subheadline:
            "How booking works, what the first visit covers, and how we handle insurance — so there are no surprises in the chair or on the bill.",
        kicker: "Your first visit",
        bannerTitle: "First visits run about 90 minutes.",
    },
    bookPage: {
        steps: [
            {
                title: "Pick a visit",
                description: "New patient, cleaning, or emergency — the length is built in.",
            },
            {
                title: "Choose a provider and time",
                description: "Real openings from each provider's week, Saturdays included.",
            },
            {
                title: "Confirm by email",
                description: "Your confirmation carries a one-click cancel link. No portal, no password.",
            },
        ],
    },
}

export const home: CareHome = {
    liveBadge: true,
    headline: "Smile more. Dread less.",
    accent: "last-word",
    subheadline:
        "A bright, gentle dental office in Koreatown for kids, grown-ups, and the extremely nervous. Saturday hours, same-day emergencies, and prices printed right here.",
    credit: "Koreatown, Los Angeles",
    seal: "Your smile\nour happy place",
    directory: {
        items: [
            { label: "Open Saturdays", icon: "calendar" },
            { label: "Kids love it here", icon: "smile" },
            { label: "Most insurance", icon: "shield" },
        ],
    },
    hero: photo(
        "hero-high-five",
        2400,
        1800,
        "A hygienist in mint scrubs high-fiving a delighted little girl in a glossy mint dental chair in a pink treatment room",
    ),
}

export const journey: CareJourney = { kicker: "", title: "", steps: [] }

export const promises: CarePromises = {
    kicker: "What we're known for",
    title: "Three reasons people switch.",
    items: [
        {
            icon: "sparkle",
            title: "Cleanings",
            description: "Gentle, under an hour, with headphones and a blanket if you want them.",
        },
        {
            icon: "smile",
            title: "Clear aligners",
            description: "See your new smile on screen before you start. Check-ins every six to eight weeks.",
        },
        {
            icon: "zap",
            title: "Emergency same-day",
            description: "Call before noon and we'll see you today — Saturdays too.",
        },
    ],
}

export const exhibits: CareExhibits = { kicker: "", title: "", items: [], extras: [] }

export const menu: CareMenu = {
    kicker: "Self-pay prices",
    title: "No mystery bills.",
    intro: "No insurance? These are the prices. Insured? We check your benefits and tell you your share first.",
    groups: [
        {
            heading: "Everyday",
            items: [
                { name: "New-patient exam & x-rays", note: "With your first cleaning", price: "$189" },
                { name: "Adult cleaning", price: "$119" },
                { name: "Kids' cleaning & exam", note: "Under 14", price: "$89" },
                { name: "Emergency exam", note: "Same day", price: "$79" },
            ],
        },
        {
            heading: "Glow-ups",
            items: [
                { name: "In-office whitening", price: "$399" },
                { name: "Bonding", note: "Per tooth", price: "$250", qualifier: "from" },
                { name: "Night guard", price: "$350" },
                {
                    name: "Clear aligners",
                    note: "Full treatment, retainers included",
                    price: "$3,900",
                    qualifier: "from",
                },
            ],
        },
    ],
    footnote:
        "Payment plans for anything over $500. Prices are for this office and can change; your written plan is the final word.",
}

export const spotlight: CareSpotlight | null = {
    kicker: "Clear aligners & braces",
    headline: "Straighter, on your schedule.",
    body: "Dr. Ortiz scans your teeth, shows you the finished smile on screen, and maps every step before you pay a cent. Check-ins take about twenty minutes, every six to eight weeks — Saturdays included.",
    bullets: [
        "A 3D preview before you commit",
        "Payment plans, and we check your ortho benefits",
        "Retainers included in the price",
    ],
    image: photo(
        "braces-check",
        1600,
        1200,
        "A teenager in a red hoodie grinning at her smile in a round hand mirror while Dr. Ortiz gives a thumbs-up",
    ),
    report: { label: "", title: "", summary: "", rows: [], signature: "", stamp: "" },
    cta: { label: "See all treatments", path: "/what-we-treat" },
}

export const faq: CareFaq = {
    kicker: "Good questions",
    title: "Before you sit down.",
    items: [
        {
            question: "Do you take my insurance?",
            answer: "We're in network with most PPO dental plans (the list is above) and see kids with Medi-Cal Dental. Send us your plan when you book and we'll tell you your share before the visit.",
        },
        {
            question: "What if I'm really nervous?",
            answer: "Tell us when you book. We'll give you a longer appointment, agree on a stop signal we always honor, and offer laughing gas if it helps. Nobody here will lecture you about how long it's been.",
        },
        {
            question: "How young do you see kids?",
            answer: "From their first tooth. First visits are short and mostly about getting comfortable. Parents stay in the room.",
        },
        {
            question: "What counts as an emergency?",
            answer: "A broken or knocked-out tooth, swelling, a lost filling or crown, or pain that keeps you up. Call before noon for a same-day visit. For facial swelling with fever or trouble breathing, go to the emergency room.",
        },
        {
            question: "How much do clear aligners cost?",
            answer: "Full treatment starts at $3,900 with retainers included. Many PPO plans cover part of it; we check your ortho benefits and offer payment plans.",
        },
    ],
}

export const story = {
    kicker: "The office",
    headline: "The dentist's office we wanted as kids.",
    paragraphs: [
        "Grace grew up dreading the dentist: beige walls, a buzzing light, and a lecture every six months. When she opened Bright Side on Wilshire in 2019, she painted the lobby pink and made one rule — nobody gets scolded here.",
        "The chairs are mint, the playlist is loud-ish, and every plan comes printed with its prices. Kids ask to come back. So do grown-ups, which is the part we're proudest of.",
    ],
    image: photo(
        "lounge",
        1600,
        1200,
        "A sunlit pink waiting lounge with a curved sofa, cherry-red stools, and a mint reception desk, a parent and child reading together",
    ),
}

export const booking = {
    headline: "Book online.",
    intro: "Pick a visit type, a provider, and a time — Saturdays included. You'll get an email confirmation with a one-click cancel link, no portal password.",
    // The privacy line the visitor reads beside the form. Honest by
    // design: it describes what the form collects, and claims nothing
    // beyond it (never write compliance claims into template copy).
    privacyNote:
        "Booking asks for your name, contact details, and visit type — nothing about your teeth or your health. We'll ask about that in the chair.",
}
