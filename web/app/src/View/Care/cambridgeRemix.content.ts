/**
 * The care-psychology-cambridge remix's content seed (packs/README.md "Derived
 * templates"): a neuropsychological assessment practice worn over
 * the care pack. At compose time this file is copied byte-for-byte over
 * `View/Care/content.ts`, so it must remain a STRUCTURAL TWIN of that
 * module — the same export surface, the same shapes, the contract's
 * minimums met (tests/View/Care/cambridgeRemixSeed.test.ts pins the twin).
 *
 * The trade: Cambridge Neuropsychology, three neuropsychologists in
 * Cambridge, Massachusetts evaluating ADHD, autism, learning differences,
 * and memory for children and adults. The home page opens on a full-bleed
 * photograph (a psychologist and a boy at a block-design puzzle), then its
 * argument: an annotated sample report — no patient, no date — then the
 * three days that produce one (testing, feedback, the written report),
 * the fees, and the clinicians. The booking surface stays clinically
 * empty — name, contact, visit type, new/returning.
 *
 * Reviews are from parents and adult clients, published with consent and
 * initials only.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/care-psychology-cambridge` (see PACK.md). The art direction
 * is a book-lined testing room by a tall window: walnut tables, green
 * banker's lamps, oxblood and cream, a child and a clinician actually
 * enjoying the puzzle.
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
        src: `/care-psychology-cambridge/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({
            src: `/care-psychology-cambridge/${name}-${step}w.webp`,
            width: step,
        })),
    }
}

export const practice = {
    name: "Cambridge Neuropsychology",
    tagline: "Neuropsychological assessment for children and adults",
    city: "Cambridge, Massachusetts",
    address: "48 Brattle Street, Suite 3, Cambridge, MA 02138",
    phone: "(617) 555-0142",
    email: "office@cambridgeneuropsych.example",
    mapsQuery: "48 Brattle Street Cambridge MA 02138",
}

/**
 * The practice's week: testing days start at 8:30 on weekdays, a short
 * Saturday for feedback sessions, Sundays closed. 0 = Sunday … 6 =
 * Saturday; times are minutes since midnight.
 */
export const clinicHours: PracticeHoursEntry[] = [
    { day: 1, open: 8 * 60 + 30, close: 17 * 60 },
    { day: 2, open: 8 * 60 + 30, close: 17 * 60 },
    { day: 3, open: 8 * 60 + 30, close: 17 * 60 },
    { day: 4, open: 8 * 60 + 30, close: 17 * 60 },
    { day: 5, open: 8 * 60 + 30, close: 17 * 60 },
    { day: 6, open: 9 * 60, close: 12 * 60 },
]

/** Portraits by provider id — the contract carries facts, code carries art. */
export const providerPhotos: Record<string, CareImage> = {
    "ji-woo-seo": photo(
        "portrait-seo",
        1024,
        1365,
        "Dr. Ji-woo Seo laughing between library shelves in an oxblood cardigan, a testing manual under one arm",
    ),
    "elena-ferrer": photo(
        "portrait-ferrer",
        1024,
        1365,
        "Dr. Elena Ferrer in a camel coat, mid-laugh against a wall of books",
    ),
    "marcus-bell": photo(
        "portrait-bell",
        1024,
        1365,
        "Dr. Marcus Bell in a tweed jacket, laughing at a walnut desk stacked with protocols",
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
            providerId: "ji-woo-seo",
            name: "Dr. Ji-woo Seo",
            credentials: "PhD, ABPP-CN",
            role: "Founder · Children & adolescents",
            tags: undefined,
            bio: "Ji-woo is a board-certified pediatric neuropsychologist who trained in hospital clinics before opening the practice. She evaluates children and teenagers for ADHD, autism, and learning differences, and she writes reports a parent can read at the kitchen table.",
        },
        {
            providerId: "elena-ferrer",
            name: "Dr. Elena Ferrer",
            credentials: "PsyD",
            role: "Autism & adult ADHD",
            tags: undefined,
            bio: "Elena evaluates teenagers and adults — many of them late-identified, many of them tired of being told they're fine. She is bilingual in Spanish and English and sees a lot of graduate students and new parents.",
        },
        {
            providerId: "marcus-bell",
            name: "Dr. Marcus Bell",
            credentials: "PhD",
            role: "Memory & concussion",
            tags: undefined,
            bio: "Marcus works with adults worried about memory, attention after a concussion, or changes they've noticed in a parent. He spent a decade in a memory clinic and is known for explaining a test score without a single acronym.",
        },
    ],
    services: [
        {
            name: "ADHD evaluation",
            description:
                "For children and adults: attention, organization, and what actually helps at school or at work.",
        },
        {
            name: "Autism evaluation",
            description:
                "For children, teenagers, and adults, including people who have spent years masking.",
        },
        {
            name: "Learning evaluation",
            description:
                "Reading, writing, and math — dyslexia, dysgraphia, dyscalculia — with recommendations a school can use.",
        },
        {
            name: "Memory & cognitive evaluation",
            description:
                "For adults noticing changes in memory or thinking, after a concussion, or before a treatment decision.",
        },
        {
            name: "Gifted & twice-exceptional",
            description: "For bright children whose grades, behavior, or boredom don't add up.",
        },
        {
            name: "School meetings",
            description: "We join the IEP or 504 meeting, in person or by video, to explain the findings.",
        },
    ],
    // The strip says how paying works — no insurer names, no logos.
    insurance: [
        "Superbills for out-of-network reimbursement",
        "HSA & FSA accepted",
        "Payment plans over three months",
        "Good Faith Estimate before testing",
        "Accommodation letters included",
        "School meetings by request",
    ],
    locations: [
        {
            locationId: "brattle-street",
            label: "The office on Brattle Street",
            address: practice.address,
            phone: practice.phone,
            hours: clinicHours,
        },
    ],
    // Owner-curated: words from parents and adult clients, published with
    // consent and initials only — contract data, never runtime review
    // ingestion.
    reviews: [
        {
            quote: "We finally had a picture of our son that made sense, and a list of things to try on Monday. The school took the report seriously on the first read.",
            name: "R. & D. P.",
            detail: "Parents of a ten-year-old",
        },
        {
            quote: "I was diagnosed at thirty-four. Dr. Ferrer's report explained twenty years of my life in eleven pages, and it was kind about it.",
            name: "S. K.",
            detail: "Adult client",
        },
        {
            quote: "Dr. Bell walked my mother and me through every score. We left knowing what was normal aging and what wasn't.",
            name: "L. M.",
            detail: "Family member",
        },
    ],
    newPatient: [
        {
            title: "An intake call",
            body: "Twenty minutes with a clinician about the questions you have. We'll tell you which evaluation fits, what it costs, and how soon we can start.",
        },
        {
            title: "Records and forms",
            body: "School reports, prior testing, and a few questionnaires for you, and for a teacher if it's a child's evaluation. Everything goes through a secure portal.",
        },
        {
            title: "Testing day",
            body: "About six hours with breaks, over one or two days. Bring glasses, snacks, and anything that helps you or your child feel settled.",
        },
        {
            title: "Feedback and the report",
            body: "A feedback session about a week later, and the full written report within three weeks.",
        },
    ],
}

/**
 * The `appointments` content domain, code fallback — booking mode 2's
 * inputs. Visit types carry the slot length they book; each clinician's
 * weekly windows are packed back-to-back into concrete capacity-1 slots
 * by `generateAppointmentSlots`.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "intake-call",
            name: "Free intake call",
            durationMinutes: 20,
            description: "A short call with a clinician about your questions and which evaluation fits.",
        },
        {
            typeId: "consultation",
            name: "Intake consultation",
            durationMinutes: 60,
            description:
                "The first appointment of an evaluation: history, goals, and a plan for testing day.",
        },
        {
            typeId: "feedback",
            name: "Feedback session",
            durationMinutes: 90,
            description: "We walk through the findings and recommendations together, in person or by video.",
        },
    ],
    providers: [
        {
            providerId: "ji-woo-seo",
            name: "Dr. Ji-woo Seo",
            windows: [
                { day: 1, start: 14 * 60, end: 17 * 60 },
                { day: 3, start: 14 * 60, end: 17 * 60 },
                { day: 6, start: 9 * 60, end: 12 * 60 },
            ],
        },
        {
            providerId: "elena-ferrer",
            name: "Dr. Elena Ferrer",
            windows: [
                { day: 2, start: 13 * 60, end: 17 * 60 },
                { day: 4, start: 13 * 60, end: 17 * 60 },
            ],
        },
        {
            providerId: "marcus-bell",
            name: "Dr. Marcus Bell",
            windows: [
                { day: 3, start: 9 * 60, end: 12 * 60 },
                { day: 5, start: 13 * 60, end: 17 * 60 },
            ],
        },
    ],
}

/**
 * Landing copy the practice's discipline owns — the base module's
 * `landingCopy`, retraded for assessment (clinicians, evaluations, the
 * process).
 */
export const landingCopy = {
    /** The shell's nav labels for the pack's canonical trio of pages. */
    nav: { providers: "Clinicians", services: "Evaluations", newPatients: "The process" },
    /** The booking ask — the shell CTA and every page's primary CTA. */
    bookCtaLabel: "Request an evaluation",
    home: {
        secondaryCtaLabel: "Meet the clinicians",
        servicesKicker: "Evaluations",
        servicesHeading: "What we evaluate",
        providersKicker: "Clinicians",
        providersHeading: "Three neuropsychologists, one careful process.",
        reviewsKicker: "After the report",
        bannerTitle: "Evaluations from $2,800 · superbills provided",
    },
    /** The paying strip's kicker, shared by home, evaluations, the process. */
    insuranceKicker: "Paying for an evaluation",
    /** The visit panel's headline — it names where testing happens. */
    visitHeadline: "Testing happens in a quiet room on Brattle Street.",
    providersPage: {
        headline: "The clinicians.",
        subheadline:
            "Three licensed neuropsychologists — children and adolescents, autism and adult ADHD, memory and concussion.",
    },
    servicesPage: {
        headline: "Evaluations.",
        subheadline:
            "ADHD, autism, learning differences, and memory, for children and adults. Every evaluation ends in a report written for the people who will use it.",
        bannerTitle: "Start with a free intake call.",
    },
    newPatientsPage: {
        headline: "The process.",
        subheadline: "An intake call, records and forms, a testing day, and feedback — then the report.",
        kicker: "From first call to report",
        bannerTitle: "The intake call is free.",
    },
    bookPage: {
        steps: [
            {
                title: "Choose an appointment",
                description: "A free intake call, an intake consultation, or a feedback session.",
            },
            {
                title: "Pick a clinician and time",
                description:
                    "Real openings from Dr. Seo's, Dr. Ferrer's, and Dr. Bell's weeks, up to four weeks out.",
            },
            {
                title: "Confirm by email",
                description: "Your confirmation carries a one-click cancel link. No portal, no password.",
            },
        ],
    },
}

export const home: CareHome = {
    layout: "full-bleed",
    headline: "Understand\nhow you think.",
    accent: "none",
    subheadline:
        "Neuropsychological assessment for ADHD, autism, learning differences, and memory — for children and adults in Cambridge, Massachusetts.",
    credit: "PhD & PsyD neuropsychologists · Cambridge, MA · Superbills provided",
    directory: { items: [] },
    hero: photo(
        "hero",
        2400,
        1350,
        "A psychologist in an oxblood cardigan and a delighted boy at a walnut table, a block-design puzzle between them, bookshelves and a tall window behind",
    ),
}

export const journey: CareJourney = {
    kicker: "The process",
    title: "Three appointments, one report you can use.",
    layout: "cards",
    steps: [
        {
            label: undefined,
            title: "Testing day — about six hours, with breaks.",
            description:
                "Split across one or two days if that's easier. A quiet room, clear instructions, snacks, and as many breaks as you need.",
            image: undefined,
        },
        {
            label: undefined,
            title: "Feedback — we walk through it together.",
            description:
                "About a week later, in person or by video. We explain what we found in plain language and answer every question.",
            image: undefined,
        },
        {
            label: undefined,
            title: "Your report — within three weeks.",
            description:
                "A full written report by secure portal, with recommendations you can hand to a school, an employer, or a doctor.",
            image: undefined,
        },
    ],
}

export const promises: CarePromises = { kicker: "", title: "", items: [] }

export const exhibits: CareExhibits = { kicker: "", title: "", items: [], extras: [] }

export const menu: CareMenu = {
    kicker: "Fees",
    title: "Evaluations from $2,800, superbills provided.",
    intro: "One fee covers the intake, testing, scoring, the feedback session, and the written report. We're out of network with every insurer, and we'll give you everything you need to claim.",
    groups: [
        {
            heading: "Evaluations",
            items: [
                { name: "ADHD evaluation", note: "Children and adults", price: "$2,800", qualifier: "from" },
                {
                    name: "Learning evaluation",
                    note: "Reading, writing, math",
                    price: "$3,200",
                    qualifier: "from",
                },
                {
                    name: "Autism evaluation",
                    note: "Children, teens, adults",
                    price: "$3,400",
                    qualifier: "from",
                },
                { name: "Memory & cognitive", note: "Adults", price: "$3,000", qualifier: "from" },
            ],
        },
        {
            heading: "Also",
            items: [
                { name: "Intake call", note: "20 minutes, by phone", price: "Free" },
                { name: "School meeting", note: "IEP or 504, in person or video", price: "$300" },
                { name: "Records review", note: "Prior testing and school reports", price: "Included" },
            ],
        },
    ],
    footnote:
        "You have the right to a Good Faith Estimate of what your evaluation will cost. We send one before testing day.",
}

export const spotlight: CareSpotlight | null = {
    kicker: "The report",
    headline: "A language-first way to see strengths and needs.",
    body: "Every report is individual. This sample shows our structure and tone — no real patient, no real scores.",
    bullets: [
        "Summary of findings — a plain-language overview of what the evaluation shows, and what it means.",
        "Domain summaries — each area we tested, with the key result and a short clinical note.",
        "Recommendations — specific, practical steps for school, home, and work.",
        "Scores, with context — standard scores that compare strengths and needs, interpreted so they inform rather than define.",
    ],
    image: photo(
        "feedback",
        1600,
        1200,
        "A clinician and a teenage girl with her mother laughing together over an open report at a library table",
    ),
    report: {
        label: "Report of assessment",
        title: "Summary of findings",
        summary:
            "Strengths in verbal reasoning and visual problem-solving. Attention and processing speed sit below age expectation, and they account for most of the difficulty at school.",
        rows: [
            { label: "Verbal reasoning", value: "A clear strength" },
            { label: "Visual problem-solving", value: "Above average" },
            { label: "Working memory", value: "A relative weakness" },
            { label: "Sustained attention", value: "Below age expectation" },
            { label: "Reading fluency", value: "Slower than accuracy" },
        ],
        signature: "Examiner: Ji-woo Seo, PhD, ABPP-CN",
        stamp: "Sample",
    },
}

export const faq: CareFaq = {
    kicker: "Questions",
    title: "Before you call.",
    items: [
        {
            question: "How is this different from a school evaluation?",
            answer: "A school evaluation asks whether a child qualifies for services. Ours asks why things are hard and what will help, at school and at home, and it goes further into attention, memory, and emotional life.",
        },
        {
            question: "Do you take insurance?",
            answer: "We're out of network. You'll get a superbill with the codes your insurer needs, and many families recover part of the fee. We send a Good Faith Estimate before testing.",
        },
        {
            question: "How should my child prepare?",
            answer: "A good night's sleep, breakfast, and their usual medication unless we've agreed otherwise. Tell them they'll do puzzles and answer questions, and that nobody passes or fails.",
        },
        {
            question: "What ages do you see?",
            answer: "Children from five, teenagers, and adults of any age. Dr. Seo sees most children, Dr. Ferrer teenagers and adults, and Dr. Bell adults with memory questions.",
        },
        {
            question: "Will we get a diagnosis?",
            answer: "If the findings support one, yes, written plainly and explained in the feedback session. Just as often, the most useful part is the recommendations.",
        },
    ],
}

export const story = {
    kicker: "The practice",
    headline: "Reports written for the people who read them.",
    paragraphs: [
        "Dr. Seo opened the practice after years of watching families leave hospital clinics with forty pages they couldn't use. Our reports lead with plain language and end with recommendations a teacher, an employer, or a doctor can act on.",
        "We test in two quiet rooms off Brattle Street, with tall windows, good light, and a supply of snacks we take seriously.",
    ],
    image: photo(
        "feedback",
        1600,
        1200,
        "A clinician and a teenage girl with her mother laughing together over an open report at a library table",
    ),
}

export const booking = {
    headline: "Request an evaluation.",
    intro: "Book a free intake call, or an appointment if you've already begun. You'll get an email confirmation with a one-click cancel link — no portal, no password.",
    // The privacy line the visitor reads beside the form. Honest by
    // design: it describes what the form collects, and claims nothing
    // beyond it (never write compliance claims into template copy).
    privacyNote:
        "Booking asks for your name, contact details, and appointment type, and nothing about why you're seeking an evaluation. We'll talk about that on the call.",
}
