/**
 * The care-psychology-studio remix's content seed (packs/README.md "Derived
 * templates"): a clinical psychology practice worn over the care pack.
 * At compose time this file is copied byte-for-byte over
 * `View/Care/content.ts`, so it must remain a STRUCTURAL TWIN of that
 * module — the same export surface, the same shapes, the contract's
 * minimums met (tests/View/Care/psychologyStudioRemixSeed.test.ts pins the
 * twin).
 *
 * The trade: Dr. Miriam Castellanos, PsyD, and two colleagues — therapy
 * and adult ADHD evaluation in Park Slope, Brooklyn, and by telehealth
 * across New York. The home page hangs like a gallery: an inkblot as the
 * hero artwork with a museum wall label beside it (the three specialties
 * and three catalogue links), three plates for the three specialties, the
 * fees printed plainly. The booking surface stays clinically empty —
 * name, contact, session type, new/returning.
 *
 * The inkblots are original ink artworks made for this template — not
 * Rorschach plates, and the copy never implies projective testing.
 * Reviews are from FORMER clients, published with consent.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/care-psychology-studio` (see PACK.md). The art direction is a
 * gallery: ultramarine ink on off-white paper, quiet daylight rooms,
 * portraits against bare walls.
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
        src: `/care-psychology-studio/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/care-psychology-studio/${name}-${step}w.webp`, width: step })),
    }
}

export const practice = {
    name: "Miriam Castellanos, PsyD",
    tagline: "Psychology for anxiety, ADHD, and burnout",
    city: "Park Slope & telehealth",
    address: "412 7th Avenue, Suite 3R, Brooklyn, NY 11215",
    phone: "(718) 555-0139",
    email: "office@castellanospsychology.example",
    mapsQuery: "412 7th Avenue Brooklyn NY 11215",
}

/**
 * The practice's week: Monday–Thursday into the evening, a short Friday,
 * weekends closed. 0 = Sunday … 6 = Saturday; times are minutes since
 * midnight.
 */
export const clinicHours: PracticeHoursEntry[] = [
    { day: 1, open: 9 * 60, close: 19 * 60 },
    { day: 2, open: 9 * 60, close: 19 * 60 },
    { day: 3, open: 9 * 60, close: 19 * 60 },
    { day: 4, open: 9 * 60, close: 19 * 60 },
    { day: 5, open: 9 * 60, close: 15 * 60 },
]

/** Portraits by provider id — the contract carries facts, code carries art. */
export const providerPhotos: Record<string, CareImage> = {
    "dr-castellanos": photo(
        "portrait-castellanos",
        1024,
        1365,
        "Dr. Miriam Castellanos in a charcoal blazer, seated on a wooden chair against a bare off-white wall",
    ),
    "dr-mensah": photo(
        "portrait-mensah",
        1024,
        1365,
        "Dr. Kofi Mensah in a navy sweater, standing with a small smile against a plain gallery wall",
    ),
    "dr-lindqvist": photo(
        "portrait-lindqvist",
        1024,
        1365,
        "Dr. Ingrid Lindqvist, gray-haired, in a linen jacket, seated on a wooden bench with a notebook",
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
            providerId: "dr-castellanos",
            name: "Dr. Miriam Castellanos",
            credentials: "PsyD",
            role: "Clinical psychologist · Founder",
            tags: undefined,
            bio: "Miriam treats anxiety in adults who have been told, one way or another, that they're too much. Her work is practical — cognitive behavioral therapy and exposure, explained plainly — and her sessions are, clients report, surprisingly funny. She sees clients in English and Spanish.",
        },
        {
            providerId: "dr-mensah",
            name: "Dr. Kofi Mensah",
            credentials: "PhD",
            role: "Adult ADHD evaluation",
            tags: undefined,
            bio: "Kofi runs the practice's adult ADHD evaluations: an interview, standardized testing, a written report you can actually read, and a long feedback session. He also sees clients for ADHD-focused therapy once the question is answered.",
        },
        {
            providerId: "dr-lindqvist",
            name: "Dr. Ingrid Lindqvist",
            credentials: "PhD",
            role: "Burnout & work stress",
            tags: undefined,
            bio: "Ingrid spent a decade consulting to hospitals and law firms before returning to therapy. She works with people whose jobs have eaten their sleep, their weekends, and their sense of humor — and helps them get at least two of the three back.",
        },
    ],
    services: [
        {
            name: "Anxiety",
            description:
                "Panic, worry that won't switch off, the avoidance that keeps shrinking your week. Cognitive behavioral therapy and exposure, paced with you.",
        },
        {
            name: "Adult ADHD evaluation",
            description:
                "A full evaluation across two or three appointments, with testing, a plain-English report, and a feedback session to go through it together.",
        },
        {
            name: "ADHD-focused therapy",
            description:
                "After the evaluation: systems, not willpower. Planning, time, the shame that piles up, and how to explain it to the people you live with.",
        },
        {
            name: "Burnout",
            description:
                "For the exhausted and overcommitted. We map what's draining you, what you can change, and what you can stop apologizing for.",
        },
        {
            name: "Individual therapy",
            description:
                "Grief, transitions, relationships, the thing you can't name yet. Weekly sessions in person or by video.",
        },
        {
            name: "Telehealth across New York",
            description:
                "Every service except in-person testing is available by secure video anywhere in New York State.",
        },
    ],
    // How clients pay — the practice is out of network with every plan, so
    // the strip names ways to pay, not insurers.
    insurance: [
        "Private pay",
        "Out-of-network superbills",
        "HSA & FSA cards",
        "Sliding scale from $120",
        "Good Faith Estimate for every client",
        "Payment plans for evaluations",
    ],
    locations: [
        {
            locationId: "seventh-avenue",
            label: "Park Slope office",
            address: practice.address,
            phone: practice.phone,
            hours: clinicHours,
        },
    ],
    // Owner-curated: quotes from former clients, published with their
    // consent — contract data, never runtime review ingestion.
    reviews: [
        {
            quote: "I'd spent years apologizing for how anxious I was. Dr. Castellanos never once made me feel like a lot. Six months later I took the subway again — and then we planned my last session together.",
            name: "L. M.",
            detail: "Former client, shared with consent",
        },
        {
            quote: "The report from Dr. Mensah was the first thing about my brain that made sense on paper. I read it twice and then sent it to my mother.",
            name: "J. K.",
            detail: "Former evaluation client, shared with consent",
        },
        {
            quote: "Dr. Lindqvist asked what I used to do for fun. I couldn't answer. Now I can, and I leave work at six.",
            name: "P. A.",
            detail: "Former client, shared with consent",
        },
    ],
    newPatient: [
        {
            title: "A free 15-minute consultation",
            body: "A short phone call to hear what you're looking for and whether one of us is the right fit. If we're not, we'll suggest who might be.",
        },
        {
            title: "Your Good Faith Estimate",
            body: "Before your first session you'll receive a written estimate of expected costs, as federal law requires for self-pay clients.",
        },
        {
            title: "The first session",
            body: "Sixty minutes. We'll talk about what's happening now, what you've tried, and what you'd like to be different. You don't need to prepare anything.",
        },
        {
            title: "After that",
            body: "Most clients meet weekly at first. Evaluations follow their own schedule: two or three appointments, then a feedback session about two weeks later.",
        },
    ],
}

/**
 * The `appointments` content domain, code fallback — booking mode 2's
 * inputs. Session types carry the slot length they book; each
 * psychologist's weekly windows are packed back-to-back into concrete
 * capacity-1 slots by `generateAppointmentSlots`.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "consultation",
            name: "Free consultation",
            durationMinutes: 15,
            description: "A short phone call to see if we're the right fit.",
        },
        {
            typeId: "first-session",
            name: "First session",
            durationMinutes: 60,
            description: "The longer first appointment, in person or by video.",
        },
        {
            typeId: "session",
            name: "Session",
            durationMinutes: 50,
            description: "An ongoing session with your psychologist.",
        },
    ],
    providers: [
        {
            providerId: "dr-castellanos",
            name: "Dr. Miriam Castellanos",
            windows: [
                { day: 1, start: 10 * 60, end: 14 * 60 },
                { day: 3, start: 14 * 60, end: 19 * 60 },
                { day: 4, start: 10 * 60, end: 14 * 60 },
            ],
        },
        {
            providerId: "dr-mensah",
            name: "Dr. Kofi Mensah",
            windows: [
                { day: 2, start: 9 * 60, end: 13 * 60 },
                { day: 4, start: 14 * 60, end: 18 * 60 },
            ],
        },
        {
            providerId: "dr-lindqvist",
            name: "Dr. Ingrid Lindqvist",
            windows: [
                { day: 2, start: 15 * 60, end: 19 * 60 },
                { day: 5, start: 9 * 60, end: 13 * 60 },
            ],
        },
    ],
}

/**
 * Landing copy the practice's discipline owns — the base module's
 * `landingCopy`, retraded for a psychology practice (sessions and
 * evaluations, not visits).
 */
export const landingCopy = {
    /** The shell's nav labels for the pack's canonical trio of pages. */
    nav: { providers: "Psychologists", services: "Specialties", newPatients: "First session" },
    /** The booking ask — the shell CTA and every page's primary CTA. */
    bookCtaLabel: "Book a consultation",
    home: {
        secondaryCtaLabel: "Meet the psychologists",
        servicesKicker: "Specialties",
        servicesHeading: "What we treat",
        providersKicker: "The psychologists",
        providersHeading: "Three doctors, one quiet office.",
        reviewsKicker: "From former clients",
        bannerTitle: "Fifteen minutes. No wrong answers.",
    },
    /** The ways-to-pay strip's kicker, shared by home, specialties, first session. */
    insuranceKicker: "How people pay",
    /** The visit panel's headline — it names the practice's own street. */
    visitHeadline: "On Seventh Avenue, third floor rear.",
    providersPage: {
        headline: "The psychologists.",
        subheadline:
            "Three doctoral-level psychologists licensed in New York, each with a focus: anxiety, adult ADHD, and burnout. We consult with each other weekly.",
    },
    servicesPage: {
        headline: "Specialties.",
        subheadline:
            "Therapy for anxiety and burnout, and adult ADHD evaluation start to finish. In person in Park Slope or by video anywhere in New York.",
        bannerTitle: "Start with a free consultation.",
    },
    newPatientsPage: {
        headline: "Your first session.",
        subheadline:
            "What happens before you come in, what the first hour is like, and what it costs — in writing, before you commit to anything.",
        kicker: "How it starts",
        bannerTitle: "You don't need to prepare anything.",
    },
    bookPage: {
        steps: [
            {
                title: "Pick an appointment",
                description: "A free consultation, a first session, or an ongoing session.",
            },
            {
                title: "Choose a psychologist and time",
                description: "Real openings from each psychologist's week, up to four weeks out.",
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
    headline: "You're not too much.",
    accent: "last-word",
    subheadline:
        "Therapy and adult ADHD evaluation for people who've been told they're too anxious, too scattered, too tired. In Park Slope and by telehealth across New York.",
    caption: "What do you see?\n(There's no wrong answer.)",
    /** No hero credit line; the key stays so the Content panel can write one. */
    credit: undefined,
    directory: {
        title: "Miriam Castellanos, PsyD",
        lines: ["Anxiety · ADHD · Burnout", "Park Slope & telehealth"],
        items: [
            { label: "First session", path: "/new-patients" },
            { label: "Fees & insurance", path: "#pricing" },
            { label: "Is this right for me?", path: "#faq" },
        ],
    },
    hero: photo(
        "hero-inkblot",
        2400,
        2400,
        "A large symmetrical ultramarine ink blot on off-white paper, soft-edged like a butterfly, with a faint center fold",
    ),
}

export const journey: CareJourney = { kicker: "", title: "", steps: [] }

export const promises: CarePromises = { kicker: "", title: "", items: [] }

export const exhibits: CareExhibits = {
    kicker: "The collection",
    title: "Three things people bring in.",
    items: [
        {
            meta: "Plate I",
            title: "Anxiety",
            description:
                "The worry that won't switch off, and everything you've stopped doing to keep it quiet.",
            image: photo(
                "plate-flame",
                1200,
                1600,
                "A tall, narrow symmetrical ultramarine ink blot rising like a flame on off-white paper",
            ),
        },
        {
            meta: "Plate II",
            title: "ADHD",
            description:
                "An evaluation that finally answers the question — and therapy that works with your brain, not against it.",
            image: photo(
                "plate-moth",
                1200,
                1600,
                "A speckled, feathery ultramarine ink blot shaped like a moth, spattered across off-white paper",
            ),
        },
        {
            meta: "Plate III",
            title: "Burnout",
            description: "For when the job took the weekends, then the sleep, then the sense of humor.",
            image: photo(
                "plate-drip",
                1200,
                1600,
                "Two round ultramarine ink shapes meeting at a fold, their lower edges dripping down the paper",
            ),
        },
    ],
    extras: [],
}

export const menu: CareMenu = {
    kicker: "Fees & insurance",
    title: "What it costs.",
    intro: "Private pay, out of network with every plan. The prices are the prices.",
    groups: [
        {
            heading: "Therapy",
            items: [
                { name: "Consultation", note: "15 min, by phone", price: "Free" },
                { name: "First session", note: "60 min", price: "$300" },
                { name: "Session", note: "50 min", price: "$250" },
                { name: "Sliding scale", note: "Limited hours each week", price: "$120", qualifier: "from" },
            ],
        },
        {
            heading: "Evaluation",
            items: [
                {
                    name: "Adult ADHD evaluation",
                    note: "Interview, testing, written report, feedback session",
                    price: "$2,400",
                },
                { name: "Records review", note: "Prior evaluations, school or work records", price: "$250" },
            ],
        },
    ],
    footnote:
        "You'll receive a monthly superbill to submit for out-of-network reimbursement, and a Good Faith Estimate of expected costs before your first session.",
}

export const spotlight: CareSpotlight | null = {
    kicker: "The first session",
    headline: "Mostly, we talk.",
    body: "Sixty minutes in a quiet room on Seventh Avenue, or on video from wherever you are. We'll talk about what's happening, what you've tried, and what you'd like to feel different. Nobody will ask you to interpret an inkblot — they're just on the walls.",
    bullets: [
        "In person or by video, your choice every week",
        "In English or Spanish with Dr. Castellanos",
        "No homework before you come",
    ],
    image: photo(
        "office",
        1600,
        1200,
        "A bright therapy office: a client in a mustard sweater talking with a psychologist in armchairs beneath a framed blue ink blot",
    ),
    report: { label: "", title: "", summary: "", rows: [], signature: "", stamp: "" },
    cta: { label: "What to expect", path: "/new-patients" },
}

export const faq: CareFaq = {
    kicker: "Is this right for me?",
    title: "Questions, answered plainly.",
    items: [
        {
            question: "Is this right for me?",
            answer: "If anxiety, attention, or exhaustion is getting between you and the life you want, probably. If you need crisis support, medication management, or a higher level of care, we'll help you find it — and if it's an emergency, call or text 988 or go to the nearest emergency room.",
        },
        {
            question: "Do you take insurance?",
            answer: "We're out of network with every plan. Many PPO plans reimburse part of each session; we give you a monthly superbill to submit, and you can call your plan to ask about out-of-network mental health benefits.",
        },
        {
            question: "Do you prescribe medication?",
            answer: "Psychologists in New York don't prescribe. If medication might help, we coordinate with your primary care doctor or a psychiatrist you choose.",
        },
        {
            question: "How long does therapy take?",
            answer: "It depends on what you came for. Many clients working on anxiety meet weekly for three to six months; we check in regularly about whether it's still helping.",
        },
        {
            question: "Is telehealth as good as in person?",
            answer: "For most therapy, research suggests it works about as well. Testing for ADHD evaluations happens in the office; everything else can be by video anywhere in New York.",
        },
    ],
}

export const story = {
    kicker: "The practice",
    headline: "A quiet room, on purpose.",
    paragraphs: [
        "Miriam opened the practice on Seventh Avenue in 2016 after years in hospital clinics, where the rooms were loud and the sessions short. She wanted the opposite: a bright, still room, a door that closes, and time to think.",
        "The inkblots on the walls are there as a joke and an invitation. Everyone sees something different — and in this office, whatever you see is allowed.",
    ],
    image: photo(
        "plate-shoulders",
        1600,
        1600,
        "A broad symmetrical ultramarine ink blot with wide shoulders and fine veined edges on off-white paper",
    ),
}

export const booking = {
    headline: "Book a consultation.",
    intro: "Start with a free fifteen-minute call, or book a first session if you're ready. You'll get an email confirmation with a one-click cancel link — no portal, no password.",
    // The privacy line the visitor reads beside the form. Honest by
    // design: it describes what the form collects, and claims nothing
    // beyond it (never write compliance claims into template copy).
    privacyNote:
        "Booking asks for your name, contact details, and appointment type — nothing about what you're going through. That part waits for the room.",
}
