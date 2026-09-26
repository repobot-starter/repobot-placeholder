/**
 * The care-direct remix's content seed (packs/README.md "Derived
 * templates"): a direct primary care membership practice worn over the
 * care pack in the wayfinding register. At compose time this file is
 * copied byte-for-byte over `View/Care/content.ts`, so it must remain a
 * STRUCTURAL TWIN of that module — the same export surface, the same
 * shapes, the contract's minimums met
 * (tests/View/Care/directRemixSeed.test.ts pins the twin). Once composed
 * it is the site's single content file: the practice, the providers, the
 * services, the coverage list, the hours, the reviews, the new-patient
 * guide, the appointment offering, and the page copy around them (the
 * hero's facts, the price list, the FAQ).
 *
 * The two structured exports are contract-shaped on purpose:
 * `codePractice` and `codeAppointments` are the code fallbacks for the
 * business-content contract's `practice` and `appointments` domains
 * (web/app/src/View/Landing/practiceDocument.ts), so an owner's Manage
 * edit and this file walk the same rendering path. The appointments
 * export is booking mode 2's input: visit types x weekly availability
 * windows, projected into concrete capacity-1 slots by the same
 * derivation the platform uses (`generateAppointmentSlots`).
 *
 * DELIBERATE ARCHITECTURE — the booking surface is clinically empty.
 * Booking a visit asks for a name, contact details, a visit type, and
 * new/returning. No free-text reason, no symptoms, no health questions:
 * the platform never holds medical information. Keep every field and
 * every line of copy on that side of the line.
 *
 * The practice: a direct primary care (DPC) membership clinic — one
 * flat monthly fee, no insurance billing for primary care. Prices here
 * are template copy for the owner to replace, written to the shape real
 * DPC practices publish (membership by age, labs at the practice's cost).
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/care-direct` (see PACK.md). The art direction is the
 * neighborhood doctor at work: warm window light, rowhouse brick, real
 * rooms, people mid-conversation — never an empty lobby.
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
        src: `/care-direct/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/care-direct/${name}-${step}w.webp`, width: step })),
    }
}

export const practice = {
    name: "Dr. Ada Okafor — Direct Primary Care",
    tagline: "A doctor who texts back",
    city: "South Philadelphia",
    address: "1529 South 10th Street, Philadelphia, PA 19147",
    phone: "(215) 555-0148",
    email: "hello@okaforprimarycare.example",
    mapsQuery: "1529 South 10th Street Philadelphia PA 19147",
}

/**
 * The practice's week: long weekdays plus a Saturday morning, Sundays
 * closed (members text the doctor instead). 0 = Sunday … 6 = Saturday;
 * times are minutes since midnight. The home hero derives its live
 * "Open — closes…" badge from these.
 */
export const clinicHours: PracticeHoursEntry[] = [
    { day: 1, open: 8 * 60, close: 18 * 60 },
    { day: 2, open: 8 * 60, close: 18 * 60 },
    { day: 3, open: 8 * 60, close: 18 * 60 },
    { day: 4, open: 8 * 60, close: 18 * 60 },
    { day: 5, open: 8 * 60, close: 18 * 60 },
    { day: 6, open: 9 * 60, close: 12 * 60 },
]

/** Portraits by provider id — the contract carries facts, code carries art. */
export const providerPhotos: Record<string, CareImage> = {
    "dr-okafor": photo(
        "portrait-okafor",
        1024,
        1365,
        "Dr. Ada Okafor in forest-green scrubs and a stethoscope, arms folded, smiling by a brick wall",
    ),
    "ferreira-rn": photo(
        "portrait-ferreira",
        1024,
        1365,
        "Luis Ferreira, RN, in green scrubs and a gray cardigan at the foot of the rowhouse stairs",
    ),
    "tran-ma": photo(
        "portrait-tran",
        1024,
        1365,
        "Linh Tran laughing on a window bench with a mug of tea, in green scrubs",
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
            providerId: "dr-okafor",
            name: "Dr. Ada Okafor",
            credentials: "MD",
            role: "Family medicine · Founder",
            tags: undefined,
            bio: "Fourteen years in family medicine, the last five running this practice out of a South 10th Street rowhouse. Ada left a clinic that booked her four patients an hour. Her panel is capped so she can answer your text herself — usually before lunch.",
        },
        {
            providerId: "ferreira-rn",
            name: "Luis Ferreira",
            credentials: "RN",
            role: "Care coordinator",
            tags: undefined,
            bio: "Luis handles everything between visits: specialist referrals, prior authorizations, the imaging center that won't call back. He runs the free meet & greets and speaks Portuguese and Spanish.",
        },
        {
            providerId: "tran-ma",
            name: "Linh Tran",
            credentials: "CMA",
            role: "Medical assistant · Labs",
            tags: undefined,
            bio: "Linh draws labs in-house, calls with results, and keeps the dispensary of common generics stocked at cost. Ask her which lab panels are $5 — she knows every price by heart.",
        },
    ],
    services: [
        {
            name: "Same-day visits",
            description:
                "Text by noon and you're usually seen today, next day at the latest. Thirty minutes minimum, never a waiting room full of strangers.",
        },
        {
            name: "Text & call your doctor",
            description:
                'Dr. Okafor\'s own number. Photos of the rash, questions about the new prescription, the 9 PM "is this normal?" — all included.',
        },
        {
            name: "House calls",
            description:
                "For members who can't easily get out: after a hospital stay, with a new baby, or on a bad mobility week. Same doctor, your living room.",
        },
        {
            name: "Unhurried visits",
            description:
                "Visits run 30 to 60 minutes. Annual physicals, second opinions, the long talk about a new diagnosis — there's time for all of it.",
        },
        {
            name: "Labs at our cost",
            description:
                "Blood work drawn here and billed at the practice's wholesale price. A lipid panel runs about $6; an A1C about $8.",
        },
        {
            name: "Chronic care",
            description:
                "Blood pressure, diabetes, thyroid, asthma, depression — steady management by text between visits instead of a three-month wait.",
        },
        {
            name: "Minor procedures",
            description:
                "Stitches, skin tag and mole removals, joint injections, ear flushes. Done here, included in the membership, supplies at cost.",
        },
        {
            name: "Care coordination",
            description:
                "Referrals to specialists who take your insurance, imaging at cash prices, and someone who reads their notes and calls you after.",
        },
    ],
    // Coverage the membership pairs with — kinds of coverage, never
    // insurer names: the practice doesn't bill any of them for primary care.
    insurance: [
        "Employer plans",
        "Marketplace plans",
        "High-deductible plans",
        "Catastrophic plans",
        "Self-employed",
        "No insurance at all",
    ],
    locations: [
        {
            locationId: "south-10th",
            label: "South 10th Street",
            address: practice.address,
            phone: practice.phone,
            hours: clinicHours,
        },
    ],
    // Owner-curated: real quotes the practice chose to publish — contract
    // data, never runtime review ingestion.
    reviews: [
        {
            quote: "I texted a photo of my son's arm at 7:40 on a Saturday. Dr. Okafor wrote back in ten minutes: not broken, ice it, come by at nine if it swells. It didn't. That's the whole review.",
            name: "Tasha M.",
            detail: "Member since 2022",
        },
        {
            quote: "My blood work used to cost more than my phone bill. Here the whole panel was eleven dollars and Linh called me with the results the next morning.",
            name: "Ray D.",
            detail: "Member since 2023",
        },
        {
            quote: "After my hip surgery she came up our front steps with her bag and checked the incision in my own kitchen. I didn't know doctors still did that.",
            name: "Gloria P.",
            detail: "Member since 2021",
        },
        {
            quote: "An hour for my first physical. Nobody has ever asked me that many questions and then actually waited for the answers.",
            name: "Sam K.",
            detail: "Member since 2025",
        },
    ],
    newPatient: [
        {
            title: "Meet us first — free",
            body: "Book a 15-minute meet & greet, in the office or by phone. Ask anything; there's no pitch and no paperwork.",
        },
        {
            title: "Join online",
            body: "Pick a membership, add family members, and set up monthly billing. No enrollment fee, no contract — cancel with 30 days' notice.",
        },
        {
            title: "Your first long visit",
            body: "An hour with Dr. Okafor: your history, a full exam, and labs drawn on the spot if you need them. You'll leave with her cell number.",
        },
        {
            title: "Records & prescriptions",
            body: "Sign one release and Luis requests your records. Ongoing prescriptions carry over, and common generics can be filled here at cost.",
        },
    ],
}

/**
 * The `appointments` content domain, code fallback — booking mode 2's
 * inputs. Visit types carry the slot length they book; each provider's
 * weekly windows are packed back-to-back into concrete capacity-1 slots
 * by `generateAppointmentSlots` (kernel and platform run the same
 * derivation, so the preview offers exactly what a deploy would).
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "meet-and-greet",
            name: "Meet & greet (free)",
            durationMinutes: 15,
            description: "Fifteen minutes to meet the practice and ask anything before you join.",
        },
        {
            typeId: "member-visit",
            name: "Member visit",
            durationMinutes: 30,
            description: "A same-day or scheduled visit with Dr. Okafor.",
        },
        {
            typeId: "long-visit",
            name: "Long visit",
            durationMinutes: 60,
            description: "A physical, a first visit, or the conversation that needs an hour.",
        },
    ],
    providers: [
        {
            providerId: "dr-okafor",
            name: "Dr. Ada Okafor",
            windows: [
                { day: 1, start: 9 * 60, end: 12 * 60 },
                { day: 2, start: 13 * 60, end: 17 * 60 },
                { day: 3, start: 9 * 60, end: 12 * 60 },
                { day: 4, start: 13 * 60, end: 17 * 60 },
                { day: 5, start: 9 * 60, end: 12 * 60 },
                { day: 6, start: 9 * 60, end: 11 * 60 },
            ],
        },
        {
            providerId: "ferreira-rn",
            name: "Luis Ferreira, RN",
            windows: [
                { day: 2, start: 9 * 60, end: 11 * 60 },
                { day: 4, start: 9 * 60, end: 11 * 60 },
            ],
        },
    ],
}

/**
 * Landing copy the practice's discipline owns: the strings the landing
 * modules and shell render that would read wrong for a different kind of
 * practice (a therapy group, a dental office). A remix seed retrades
 * these along with the rest of the content — everything else in the
 * landing modules is practice-neutral on purpose (the services family's
 * `landingCopy` discipline, packs/README.md "Derived templates").
 */
export const landingCopy = {
    /** The shell's nav labels for the pack's canonical trio of pages. */
    nav: { providers: "Dr. Okafor", services: "What's included", newPatients: "Join" },
    /** The booking ask — the shell CTA and every page's primary CTA. */
    bookCtaLabel: "Book a visit",
    home: {
        secondaryCtaLabel: "Meet Dr. Okafor",
        servicesKicker: "What's included",
        servicesHeading: "Everything in the membership",
        providersKicker: "The team",
        providersHeading: "Three people. One phone number.",
        reviewsKicker: "From members",
        bannerTitle: "Your doctor, one text away.",
    },
    /** The coverage strip's kicker, shared by home, services, new patients. */
    insuranceKicker: "Membership works beside any coverage — or none",
    /** The visit panel's headline — it names the practice's own street. */
    visitHeadline: "On South 10th, a block off Passyunk.",
    providersPage: {
        headline: "Dr. Okafor and the team.",
        subheadline:
            "A capped panel, a nurse who chases your referrals, and a medical assistant who knows what every lab costs. Small on purpose.",
    },
    servicesPage: {
        headline: "What's included.",
        subheadline:
            "One monthly membership covers every visit, every text, and every house call. Labs and generics are billed at our cost, printed below.",
        bannerTitle: "Join this week, be seen this week.",
    },
    newPatientsPage: {
        headline: "Joining takes ten minutes.",
        subheadline:
            "Meet us free, sign up online, and book your first long visit. No enrollment fee, no contract, no insurance forms.",
        kicker: "How to join",
        bannerTitle: "Start with a free meet & greet.",
    },
    bookPage: {
        steps: [
            {
                title: "Pick a visit",
                description: "A free meet & greet, a member visit, or a long visit — the length is built in.",
            },
            {
                title: "Choose a time",
                description: "Real openings from Dr. Okafor's and Luis's actual week, up to four weeks out.",
            },
            {
                title: "Confirm by email",
                description:
                    "Your confirmation carries a one-click cancel link. Members can always just text.",
            },
        ],
    },
}

export const home: CareHome = {
    liveBadge: true,
    headline: "A doctor who texts back.",
    subheadline:
        "Direct primary care in South Philadelphia. One flat membership buys same-day visits, your doctor's own number, house calls, and labs at cost. No copays. No insurance forms.",
    credit: "Direct primary care · South Philadelphia",
    directory: {
        items: [
            { label: "$89/mo", note: "Membership, not insurance", icon: "shield", path: "/what-we-treat" },
            { label: "Same-day visits", note: "Text by noon, seen today", icon: "clock" },
            { label: "Text your doctor", note: "Her number, her replies", icon: "message" },
        ],
    },
    hero: photo(
        "hero-visit",
        1800,
        2400,
        "Dr. Okafor in a green sweater laughing with an older patient in a lavender cardigan, knee to knee in a sunlit rowhouse living room",
    ),
}

export const journey: CareJourney = { kicker: "", title: "", steps: [] }

export const promises: CarePromises = {
    kicker: "What $89 a month gets you",
    title: "The membership, line by line.",
    items: [
        {
            icon: "clock",
            title: "Same-day visits",
            description: "Text by noon and you're usually seen today. Thirty minutes minimum.",
        },
        {
            icon: "message",
            title: "Text & call your doctor",
            description: 'Dr. Okafor\'s own number — photos, questions, the 9 PM "is this normal?"',
        },
        {
            icon: "home",
            title: "House calls",
            description: "After a hospital stay, with a new baby, on a bad mobility week.",
        },
        {
            icon: "stethoscope",
            title: "Visits that take an hour",
            description: "Physicals, second opinions, the long talk — the schedule has room.",
        },
        {
            icon: "chart",
            title: "Labs at our cost",
            description: "A lipid panel runs about $6. We print the whole price list.",
        },
        {
            icon: "check",
            title: "No copays, ever",
            description: "The membership is the bill. No surprise statements in March.",
        },
    ],
}

export const exhibits: CareExhibits = { kicker: "", title: "", items: [], extras: [] }

export const menu: CareMenu = {
    kicker: "Price list",
    title: "Printed prices. No fine print.",
    intro: "Membership is monthly, by age. Everything the practice buys for you is passed through at our cost.",
    groups: [
        {
            heading: "Membership",
            items: [
                { name: "Adults", note: "Ages 26–64", price: "$89/mo" },
                { name: "Young adults", note: "Ages 18–25", price: "$59/mo" },
                { name: "Seniors", note: "65 and up · see Medicare below", price: "$109/mo" },
                { name: "Kids", note: "With a member parent", price: "$25/mo" },
            ],
        },
        {
            heading: "At our cost",
            items: [
                { name: "Lipid panel", price: "$6", qualifier: "about" },
                { name: "Hemoglobin A1C", price: "$8", qualifier: "about" },
                { name: "Metabolic panel (CMP)", price: "$5", qualifier: "about" },
                { name: "Thyroid (TSH)", price: "$8", qualifier: "about" },
                { name: "Common generics", note: "Dispensed here", price: "$2/mo", qualifier: "from" },
            ],
        },
    ],
    footnote:
        "No enrollment fee, no contract — cancel with 30 days' notice. Membership isn't insurance: keep coverage for hospitals, specialists, and emergencies.",
}

export const spotlight: CareSpotlight | null = {
    kicker: "House calls",
    headline: "Sometimes the doctor takes the stoop.",
    body: "House calls are part of the membership for anyone who can't easily get to South 10th — after surgery, with a newborn, or on a week when the stairs win. Dr. Okafor brings the bag; Linh brings the lab kit if you need a draw.",
    bullets: [
        "Included for members, no visit fee",
        "Within about two miles of the office",
        "Post-hospital check-ins, usually within 48 hours",
    ],
    image: photo(
        "housecall",
        1600,
        1200,
        "Dr. Okafor with her medical bag climbing a brick rowhouse stoop on an autumn street as a patient waves from the doorway",
    ),
    report: { label: "", title: "", summary: "", rows: [], signature: "", stamp: "" },
    cta: { label: "See everything included", path: "/what-we-treat" },
}

export const faq: CareFaq = {
    kicker: "Before you join",
    title: "The questions everybody asks.",
    items: [
        {
            question: "Do I still need insurance?",
            answer: "Yes, for the big things. The membership covers primary care — visits, texts, house calls — but not hospital stays, surgery, specialists, or emergencies. Many members pair it with a high-deductible or catastrophic plan and spend less overall.",
        },
        {
            question: "What do labs actually cost?",
            answer: "What the lab charges us, nothing added. The price list above covers the common panels; for anything else, Linh looks up the exact price before we draw.",
        },
        {
            question: "What happens after hours?",
            answer: "Text Dr. Okafor. For urgent questions she answers evenings and weekends; for emergencies, call 911 first and text her after — she'll coordinate with the hospital.",
        },
        {
            question: "I'm on Medicare. Can I join?",
            answer: "Yes, under a private contract. Dr. Okafor has opted out of Medicare, so she doesn't bill it and Medicare won't reimburse the membership or visits with her. Your Medicare coverage for hospitals, specialists, and prescriptions keeps working as usual; we'll walk you through the contract at the meet & greet.",
        },
        {
            question: "Can I cancel?",
            answer: "Any time, with 30 days' notice. No cancellation fee. If you rejoin later there's still no enrollment fee.",
        },
    ],
}

export const story = {
    kicker: "The practice",
    headline: "Why I left the fifteen-minute visit.",
    paragraphs: [
        "I spent nine years in a clinic that scheduled me four patients an hour. I knew my patients' insurance better than their families. So I opened a practice in a South 10th Street rowhouse with a capped panel, one flat price, and my own phone number on every member's fridge.",
        "Membership pays for my time, not for billing codes. That's why visits can run an hour, why I can answer a text on a Saturday, and why a lipid panel costs six dollars instead of sixty.",
    ],
    image: photo(
        "exam-room",
        1600,
        1200,
        "A patient in a denim jacket talking with Dr. Okafor in armchairs by a tall window, a brick wall and plants behind them",
    ),
}

export const booking = {
    headline: "Book a visit.",
    intro: "Members: pick a visit and a time. New here? Start with a free 15-minute meet & greet. You'll get an email confirmation with a one-click cancel link — no portal password.",
    // The privacy line the visitor reads beside the form. Honest by
    // design: it describes what the form collects, and claims nothing
    // beyond it (never write compliance claims into template copy).
    privacyNote:
        "Booking asks for your name, contact details, and visit type — nothing about your health. Tell Dr. Okafor the rest in the room, where it belongs.",
}
