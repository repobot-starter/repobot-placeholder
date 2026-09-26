/**
 * The care-psychology-northlight remix's content seed (packs/README.md
 * "Derived templates"): a psychiatry practice for medication management
 * worn over the care pack. At compose time this file is copied
 * byte-for-byte over `View/Care/content.ts`, so it must remain a
 * STRUCTURAL TWIN of that module — the same export surface, the same
 * shapes, the contract's minimums met
 * (tests/View/Care/northlightRemixSeed.test.ts pins the twin).
 *
 * The trade: Northlight Psychiatry, a psychiatrist and two psychiatric
 * nurse practitioners in Minneapolis managing medication for depression,
 * anxiety, ADHD, bipolar disorder, and postpartum mood, in person in
 * Uptown and by telehealth across Minnesota. The home page opens on a
 * full-bleed photograph (a man with a mug at a snowy birch window), then
 * its argument: the first ninety days as a horizontal track — Day 1 to
 * Day 90 — then the visits and what they cost, how paying works (no
 * insurer names, no logos), what the practice treats, and the clinicians.
 * The booking surface stays clinically empty — name, contact, visit
 * type, new/returning.
 *
 * Reviews are from patients, published with consent and initials only.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/care-psychology-northlight` (see PACK.md). The art
 * direction is a Minnesota winter indoors: white walls, birch trunks
 * through tall windows, wool and ceramic, low sun, people at ease.
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
        src: `/care-psychology-northlight/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({
            src: `/care-psychology-northlight/${name}-${step}w.webp`,
            width: step,
        })),
    }
}

export const practice = {
    name: "Northlight Psychiatry",
    tagline: "Medication management, in person and by telehealth",
    city: "Minneapolis, Minnesota",
    address: "2828 Hennepin Avenue, Suite 210, Minneapolis, MN 55408",
    phone: "(612) 555-0176",
    email: "hello@northlightpsychiatry.example",
    mapsQuery: "2828 Hennepin Avenue Minneapolis MN 55408",
}

/**
 * The practice's week: early starts, telehealth evenings Monday to
 * Thursday, a short Friday, weekends closed. 0 = Sunday … 6 = Saturday;
 * times are minutes since midnight.
 */
export const clinicHours: PracticeHoursEntry[] = [
    { day: 1, open: 8 * 60, close: 19 * 60 },
    { day: 2, open: 8 * 60, close: 19 * 60 },
    { day: 3, open: 8 * 60, close: 19 * 60 },
    { day: 4, open: 8 * 60, close: 19 * 60 },
    { day: 5, open: 8 * 60, close: 16 * 60 },
]

/** Portraits by provider id — the contract carries facts, code carries art. */
export const providerPhotos: Record<string, CareImage> = {
    "sami-haddad": photo(
        "portrait-haddad",
        1024,
        1365,
        "Dr. Sami Haddad laughing by a window of snowy birches, arms folded, in a charcoal quarter-zip",
    ),
    "anna-solberg": photo(
        "portrait-solberg",
        1024,
        1365,
        "Anna Solberg mid-laugh at a tall window in a blue sweater, a ceramic mug in her hand",
    ),
    "mai-thao": photo(
        "portrait-thao",
        1024,
        1365,
        "Mai Thao laughing at her desk between telehealth visits, one hand up mid-story, snow in the window behind",
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
            providerId: "sami-haddad",
            name: "Dr. Sami Haddad",
            credentials: "MD",
            role: "Founder · Psychiatrist",
            tags: undefined,
            bio: "Sami is a board-certified psychiatrist who spent eight years in a hospital mood clinic before opening Northlight. He prescribes carefully, explains every change, and would rather adjust slowly than guess.",
        },
        {
            providerId: "anna-solberg",
            name: "Anna Solberg",
            credentials: "PMHNP-BC",
            role: "Psychiatric nurse practitioner · Postpartum & anxiety",
            tags: undefined,
            bio: "Anna works with anxiety, depression, and mood during pregnancy and after birth. She grew up in Duluth, keeps a mug of tea on the desk, and is very good at the question behind the question.",
        },
        {
            providerId: "mai-thao",
            name: "Mai Thao",
            credentials: "PMHNP-BC",
            role: "Psychiatric nurse practitioner · ADHD & telehealth",
            tags: undefined,
            bio: "Mai sees adults with ADHD, depression, and bipolar disorder, most of them by video from across the state. She speaks Hmong and English, and she keeps evening hours for people who can't leave work.",
        },
    ],
    services: [
        {
            name: "Depression",
            description: "Medication and steady follow-up, alongside your therapist if you have one.",
        },
        {
            name: "Anxiety & panic",
            description: "Treatment that settles the worry without flattening the rest of you.",
        },
        {
            name: "Adult ADHD",
            description: "A careful evaluation, then medication chosen for how your days actually run.",
        },
        {
            name: "Bipolar disorder",
            description: "Mood stabilizers managed closely, with a plan for the hard months.",
        },
        {
            name: "Postpartum & perinatal mood",
            description: "Care during pregnancy and after birth, including medication while breastfeeding.",
        },
        {
            name: "OCD",
            description: "Medication management that works alongside exposure-based therapy.",
        },
    ],
    // The strip says how paying works — no insurer names, no logos.
    insurance: [
        "In-network with most Minnesota plans",
        "Telehealth anywhere in Minnesota",
        "Self-pay rates posted up front",
        "HSA & FSA accepted",
        "Superbills for out-of-network plans",
        "Prescriptions sent to your pharmacy",
    ],
    locations: [
        {
            locationId: "hennepin-avenue",
            label: "The office on Hennepin Avenue",
            address: practice.address,
            phone: practice.phone,
            hours: clinicHours,
        },
    ],
    // Owner-curated: words from patients, published with consent and
    // initials only — contract data, never runtime review ingestion.
    reviews: [
        {
            quote: "Dr. Haddad changed one thing at a time and told me why every time. By spring I noticed I was just having ordinary days again.",
            name: "J. R.",
            detail: "Patient, in person",
        },
        {
            quote: "Anna saw me three weeks after my daughter was born, by video, with the baby asleep on me. Nobody made me feel like I was failing.",
            name: "K. L.",
            detail: "Patient, telehealth",
        },
        {
            quote: "I've had ADHD my whole life and this is the first plan that fits my actual workday. Mai's evening appointments are the reason I kept going.",
            name: "D. V.",
            detail: "Patient, telehealth",
        },
    ],
    newPatient: [
        {
            title: "A short intro call",
            body: "Fifteen minutes with our coordinator: what's going on, whether we're the right fit, and which clinician has openings.",
        },
        {
            title: "Forms and records",
            body: "A few questionnaires and a list of what you've tried before, through a secure portal. Nothing to print.",
        },
        {
            title: "The evaluation",
            body: "Sixty minutes, in person or by video. We listen first, then talk through what we think is going on and the options.",
        },
        {
            title: "Your plan and follow-ups",
            body: "A written plan within a week, then shorter visits every few weeks while things settle, and less often after that.",
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
            typeId: "intro-call",
            name: "Free intro call",
            durationMinutes: 15,
            description: "A short call with our coordinator about fit, insurance, and openings.",
        },
        {
            typeId: "evaluation",
            name: "Psychiatric evaluation",
            durationMinutes: 60,
            description: "Your first visit, in person or by video: your story, your history, and a plan.",
        },
        {
            typeId: "follow-up",
            name: "Follow-up visit",
            durationMinutes: 30,
            description: "For current patients: how the plan is working and what to adjust.",
        },
    ],
    providers: [
        {
            providerId: "sami-haddad",
            name: "Dr. Sami Haddad",
            windows: [
                { day: 1, start: 8 * 60, end: 12 * 60 },
                { day: 3, start: 8 * 60, end: 12 * 60 },
                { day: 5, start: 9 * 60, end: 13 * 60 },
            ],
        },
        {
            providerId: "anna-solberg",
            name: "Anna Solberg",
            windows: [
                { day: 2, start: 9 * 60, end: 15 * 60 },
                { day: 4, start: 9 * 60, end: 15 * 60 },
            ],
        },
        {
            providerId: "mai-thao",
            name: "Mai Thao",
            windows: [
                { day: 1, start: 14 * 60, end: 19 * 60 },
                { day: 2, start: 14 * 60, end: 19 * 60 },
                { day: 4, start: 14 * 60, end: 19 * 60 },
            ],
        },
    ],
}

/**
 * Landing copy the practice's discipline owns — the base module's
 * `landingCopy`, retraded for psychiatry (clinicians, what we treat, the
 * first ninety days).
 */
export const landingCopy = {
    /** The shell's nav labels for the pack's canonical trio of pages. */
    nav: { providers: "Clinicians", services: "What we treat", newPatients: "Your first 90 days" },
    /** The booking ask — the shell CTA and every page's primary CTA. */
    bookCtaLabel: "Request an appointment",
    home: {
        secondaryCtaLabel: "Meet the clinicians",
        servicesKicker: "What we treat",
        servicesHeading: "Medication management for adults",
        providersKicker: "Clinicians",
        providersHeading: "A psychiatrist and two nurse practitioners.",
        reviewsKicker: "From patients",
        bannerTitle: "In person in Uptown, or by video from anywhere in Minnesota.",
    },
    /** The paying strip's kicker, shared by home, what we treat, the first 90 days. */
    insuranceKicker: "Paying for care",
    /** The visit panel's headline — it names where the office is. */
    visitHeadline: "A quiet office on Hennepin Avenue, or your own kitchen table.",
    providersPage: {
        headline: "The clinicians.",
        subheadline:
            "One board-certified psychiatrist and two psychiatric nurse practitioners, in person and by telehealth.",
    },
    servicesPage: {
        headline: "What we treat.",
        subheadline:
            "Medication management for adults: depression, anxiety, ADHD, bipolar disorder, postpartum mood, and OCD.",
        bannerTitle: "Start with a free intro call.",
    },
    newPatientsPage: {
        headline: "Your first 90 days.",
        subheadline: "An intro call, a sixty-minute evaluation, a written plan, and steady follow-ups.",
        kicker: "From first call to steady",
        bannerTitle: "The intro call is free.",
    },
    bookPage: {
        steps: [
            {
                title: "Choose an appointment",
                description: "A free intro call, a psychiatric evaluation, or a follow-up visit.",
            },
            {
                title: "Pick a clinician and time",
                description:
                    "Real openings from Dr. Haddad's, Anna's, and Mai's weeks, including evenings, up to four weeks out.",
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
    headline: "Steady, one\nseason at a time.",
    accent: "none",
    subheadline:
        "Psychiatric care and medication management for adults — in person in Minneapolis, or by telehealth anywhere in Minnesota.",
    credit: "MD & PMHNP clinicians · Minneapolis · Telehealth across Minnesota",
    directory: { items: [] },
    hero: photo(
        "hero",
        2400,
        1350,
        "A young man in an oatmeal sweater sitting on a window seat with a steaming mug, looking out at snowy birches and a cardinal in the low winter sun",
    ),
}

export const journey: CareJourney = {
    kicker: "Your first 90 days",
    title: "Five appointments, one plan that fits.",
    layout: "rail",
    steps: [
        {
            label: "Day 1",
            title: "A 60-minute evaluation",
            description:
                "We listen to your story and what you've tried, then say plainly what we think is going on.",
            image: undefined,
        },
        {
            label: "Week 2",
            title: "Your plan, in writing",
            description:
                "What we suggest and why, what to expect in the first weeks, and what to call us about.",
            image: undefined,
        },
        {
            label: "Week 4",
            title: "First check-in",
            description:
                "Thirty minutes on sleep, mood, and side effects, and a first adjustment if you need one.",
            image: undefined,
        },
        {
            label: "Week 8",
            title: "Adjust together",
            description: "We review what's changed and decide the next step with you, not for you.",
            image: undefined,
        },
        {
            label: "Day 90",
            title: "Review: what's working",
            description:
                "We look back at the season, name what's better, and set the pace of visits from here.",
            image: undefined,
        },
    ],
}

export const promises: CarePromises = { kicker: "", title: "", items: [] }

export const exhibits: CareExhibits = { kicker: "", title: "", items: [], extras: [] }

export const menu: CareMenu = {
    kicker: "Visits",
    title: "Covered by most Minnesota plans.",
    intro: "We bill your insurer directly for every visit below. If you'd rather pay yourself, these are the self-pay rates, posted before you book.",
    groups: [
        {
            heading: "Visits",
            items: [
                { name: "Psychiatric evaluation", note: "60 minutes", price: "$340", qualifier: "self-pay" },
                { name: "Follow-up visit", note: "30 minutes", price: "$165", qualifier: "self-pay" },
                { name: "Intro call", note: "15 minutes, by phone", price: "Free" },
            ],
        },
        {
            heading: "Between visits",
            items: [
                { name: "Refills", note: "Sent to your pharmacy", price: "Included" },
                { name: "Portal messages", note: "Answered within a day", price: "Included" },
                { name: "Letters & forms", note: "Work, school, leave", price: "Included" },
            ],
        },
    ],
    footnote:
        "If you pay yourself, you have the right to a Good Faith Estimate of what your care will cost. We send one before your first visit.",
}

export const spotlight: CareSpotlight | null = {
    kicker: "What we treat",
    headline: "Medication management, with time to talk.",
    body: "Follow-ups run thirty minutes, not ten. We treat adults eighteen and over, and we work alongside your therapist if you have one.",
    bullets: ["Depression", "Anxiety", "ADHD", "Bipolar disorder", "Postpartum", "OCD"],
    image: photo(
        "office",
        1600,
        1200,
        "A nurse practitioner and a young man in a winter parka laughing in a bright office, snowy rooftops through the tall window",
    ),
    report: { label: "", title: "", summary: "", rows: [], signature: "", stamp: "" },
}

export const faq: CareFaq = {
    kicker: "Questions",
    title: "Before your first visit.",
    items: [
        {
            question: "Do you offer therapy too?",
            answer: "We focus on medication, with thirty-minute follow-ups so there's time to talk. Most of our patients also see a therapist, and we're glad to coordinate with yours.",
        },
        {
            question: "Is telehealth as good as coming in?",
            answer: "For most follow-ups, yes. Anyone physically in Minnesota can see us by video, and you can switch between video and in person whenever you like.",
        },
        {
            question: "Do you take my insurance?",
            answer: "We're in network with most Minnesota plans. Call or book the free intro call and we'll check your plan before you're seen.",
        },
        {
            question: "Can you prescribe ADHD medication by telehealth?",
            answer: "Often, yes, within current federal and Minnesota rules. Some patients will need one in-person visit first, and we'll tell you up front if you do.",
        },
        {
            question: "What if I'm in crisis?",
            answer: "We aren't an emergency service. Call or text 988, or go to the nearest emergency room. Current patients can reach an on-call clinician after hours.",
        },
    ],
}

export const story = {
    kicker: "The practice",
    headline: "Care that keeps pace with you.",
    paragraphs: [
        "Dr. Haddad opened Northlight after years of watching patients wait months for a ten-minute medication check. Here, follow-ups are thirty minutes, plans are written down, and changes happen one at a time.",
        "We see patients in a bright second-floor office on Hennepin Avenue, and by video in every corner of the state — from Duluth to Worthington.",
    ],
    image: photo(
        "office",
        1600,
        1200,
        "A nurse practitioner and a young man in a winter parka laughing in a bright office, snowy rooftops through the tall window",
    ),
}

export const booking = {
    headline: "Request an appointment.",
    intro: "Book a free intro call, or a visit if you're already a patient. You'll get an email confirmation with a one-click cancel link — no portal, no password.",
    // The privacy line the visitor reads beside the form. Honest by
    // design: it describes what the form collects, and claims nothing
    // beyond it (never write compliance claims into template copy).
    privacyNote:
        "Booking asks for your name, contact details, and appointment type, and nothing about why you're coming in. We'll ask about that on the call.",
}
