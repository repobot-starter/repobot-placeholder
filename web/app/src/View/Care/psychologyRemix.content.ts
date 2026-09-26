/**
 * The care-psychology remix's content seed (packs/README.md "Derived
 * templates"): an adult psychotherapy and assessment practice worn over
 * the care pack. At compose time this file is copied byte-for-byte over
 * `View/Care/content.ts`, so it must remain a STRUCTURAL TWIN of that
 * module — the same export surface, the same shapes, the contract's
 * minimums met (tests/View/Care/psychologyRemixSeed.test.ts pins the
 * twin).
 *
 * The trade: Juniper Hill Psychology, a three-psychologist individual
 * adult psychotherapy and assessment practice in Ann Arbor, Michigan.
 * Deliberately apart from the care-therapy remix's couples-and-families
 * warmth: this practice is individual, evidence-forward, and scholarly —
 * doctoral clinicians, named methods (ERP, ACT, CBT-I), testing with
 * plain-language reports, and progress you can see in numbers. The
 * booking surface stays clinically empty — name, contact, appointment
 * type, new/returning. Why someone is seeking care never touches the
 * site.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/care-psychology` (see PACK.md). The art direction is
 * cool quiet morning light — book-lined rooms, oak and slate-blue wool,
 * unposed portraits; nothing clinical, nothing stocky.
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
        src: `/care-psychology/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/care-psychology/${name}-${step}w.webp`, width: step })),
    }
}

export const practice = {
    name: "Juniper Hill Psychology",
    tagline: "Evidence-based therapy and assessment for adults",
    city: "Ann Arbor, Michigan",
    address: "312 South Ashley Street, Suite 310, Ann Arbor, MI 48104",
    phone: "(734) 555-0184",
    email: "hello@juniperhillpsychology.example",
    mapsQuery: "312 South Ashley Street Ann Arbor MI 48104",
}

/**
 * The practice's week: weekday hours that run into the early evening —
 * therapy happens around work — with assessment mornings up front.
 * 0 = Sunday … 6 = Saturday; times are minutes since midnight. The home
 * hero derives its live "Open today until…" badge from these.
 */
export const clinicHours: PracticeHoursEntry[] = [
    { day: 1, open: 8 * 60, close: 18 * 60 },
    { day: 2, open: 8 * 60, close: 18 * 60 },
    { day: 3, open: 8 * 60, close: 18 * 60 },
    { day: 4, open: 8 * 60, close: 18 * 60 },
    { day: 5, open: 8 * 60, close: 16 * 60 },
]

/** Portraits by psychologist id — the contract carries facts, code carries art. */
export const providerPhotos: Record<string, CareImage> = {
    "dr-adler": photo(
        "portrait-adler",
        864,
        1152,
        "Dr. Naomi Adler seated in an armchair in her book-lined office, cool morning light",
    ),
    "dr-osei": photo(
        "portrait-osei",
        864,
        1152,
        "Dr. Marcus Osei in a rust cardigan beside a tall bookshelf, open and at ease",
    ),
    "dr-raghavan": photo(
        "portrait-raghavan",
        864,
        1152,
        "Dr. Priya Raghavan at a light oak consult table with a closed notebook, calm and attentive",
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
            providerId: "dr-adler",
            name: "Dr. Naomi Adler",
            credentials: "PhD, Licensed Psychologist",
            role: "Anxiety & OCD · Founder",
            tags: undefined,
            bio: "Twenty years treating anxiety disorders and OCD with exposure and response prevention — the treatment with the strongest evidence, done properly and paced humanely. Naomi founded Juniper Hill on one rule: every client knows the plan, the method, and the number we're watching.",
        },
        {
            providerId: "dr-osei",
            name: "Dr. Marcus Osei",
            credentials: "PsyD, Licensed Psychologist",
            role: "Depression & men's mental health",
            tags: undefined,
            bio: "Marcus treats depression the way it actually lifts: behavioral activation first, thought work second, and a plan for the week you're in — not the person you're supposed to become. Half his caseload is men who waited years to call anyone.",
        },
        {
            providerId: "dr-raghavan",
            name: "Dr. Priya Raghavan",
            credentials: "PhD, Licensed Psychologist",
            role: "ADHD & psychological assessment",
            tags: undefined,
            bio: "Priya runs the practice's assessment service: ADHD, memory and attention concerns, and the diagnostic knots two prior providers couldn't untie. Full batteries, plain-language reports in two weeks, and a feedback session where you can ask anything.",
        },
    ],
    services: [
        {
            name: "Individual therapy",
            description:
                "Weekly 50-minute sessions built on cognitive and behavioral methods — with goals you set, and progress you can see.",
        },
        {
            name: "Anxiety & panic",
            description:
                "Structured treatment for generalized anxiety, panic, and phobias — skills first, then practice in the situations that matter.",
        },
        {
            name: "OCD treatment",
            description:
                "Exposure and response prevention (ERP), the gold-standard treatment — collaborative, graded, and never sprung on you.",
        },
        {
            name: "Depression",
            description:
                "Behavioral activation and cognitive therapy for depression — small honest steps, measured weekly, that compound.",
        },
        {
            name: "Adult ADHD assessment",
            description:
                "A full testing battery, a clear yes-or-no answer, and a plain-language report you can take to any prescriber.",
        },
        {
            name: "Psychological assessment",
            description:
                "Diagnostic clarity when the picture is muddy — mood, attention, memory, personality — with a feedback session included.",
        },
        {
            name: "Insomnia (CBT-I)",
            description:
                "Cognitive behavioral therapy for insomnia: four to eight sessions, no sleep hygiene lectures, real sleep-window work.",
        },
        {
            name: "Telehealth sessions",
            description:
                "Secure video sessions anywhere in Michigan and PSYPACT states — the same treatment, without the drive.",
        },
    ],
    insurance: [
        "Blue Cross Blue Shield of Michigan",
        "Blue Care Network",
        "Priority Health",
        "Aetna",
        "Cigna",
        "UnitedHealthcare",
        "McLaren Health Plan",
        "Medicare",
    ],
    locations: [
        {
            locationId: "ashley-street",
            label: "South Ashley Street office",
            address: practice.address,
            phone: practice.phone,
            hours: clinicHours,
        },
    ],
    // Owner-curated: client words shared with written consent — contract
    // data, never runtime review ingestion.
    reviews: [
        {
            quote: "Dr. Adler told me in the first session exactly how ERP works, why it works, and what week four would feel like. Sixteen sessions later I drove over the bridge I'd been avoiding for six years — and then we graduated me, on schedule.",
            name: "M. S.",
            detail: "Anxiety client, shared with consent",
        },
        {
            quote: "I'm 44 and had never told anyone I was struggling. Dr. Osei didn't make me perform sadness or explain my childhood before lunch — we made a plan for that week. The plan got bigger. So did I.",
            name: "D. K.",
            detail: "Individual client, shared with consent",
        },
        {
            quote: "Two doctors and one internet quiz couldn't tell me if I had ADHD. Dr. Raghavan's report answered it in plain English, with the data attached, and the feedback session was worth the fee by itself.",
            name: "R. T.",
            detail: "Assessment client, shared with consent",
        },
    ],
    // The care pack's new-patient guide, worn here as plain-spoken FAQs —
    // title is the question, body is the honest answer.
    newPatient: [
        {
            title: "Do you take insurance?",
            body: "We're in network with the plans listed above; for everything else we provide a superbill for out-of-network reimbursement. Session and assessment fees are on the confirmation email — no surprises at the door.",
        },
        {
            title: "Therapy or assessment — which do I book?",
            body: "If you want to work on something, book therapy. If you want to know what's going on — ADHD, memory, a diagnosis that never quite fit — book an assessment. If you're not sure, the free 15-minute call exists exactly for this question.",
        },
        {
            title: "What happens in the first session?",
            body: "You talk, we listen, and then we're honest with you: what we think is going on, which treatment has the best evidence for it, and how many sessions that usually takes. You leave with a plan and a baseline measure we'll track together.",
        },
        {
            title: "Is what I share confidential?",
            body: "Yes, with the legal exceptions every psychologist carries (safety, court orders), explained in plain language before you say a word. Booking online asks nothing about your reasons — that stays in the room.",
        },
    ],
}

/**
 * The `appointments` content domain, code fallback — booking mode 2's
 * inputs. Appointment types carry the slot length they book; each
 * psychologist's weekly windows are packed back-to-back into concrete
 * capacity-1 slots by `generateAppointmentSlots` (kernel and platform run
 * the same derivation, so the preview offers exactly what a deploy
 * would).
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "free-consult",
            name: "Free 15-minute consultation",
            durationMinutes: 15,
            description:
                "A short phone call to match you with the right psychologist — or point you elsewhere, honestly.",
        },
        {
            typeId: "intake-session",
            name: "First session (intake)",
            durationMinutes: 60,
            description:
                "A structured first hour: your history, a baseline measure, and a treatment plan with a number of sessions on it.",
        },
        {
            typeId: "therapy-session",
            name: "Therapy session",
            durationMinutes: 50,
            description: "The standard 50-minute session — in the office or by secure video.",
        },
        {
            typeId: "assessment-block",
            name: "Assessment testing block",
            durationMinutes: 180,
            description:
                "A three-hour testing block with breaks built in — most assessments need one or two.",
        },
    ],
    providers: [
        {
            providerId: "dr-adler",
            name: "Dr. Naomi Adler",
            windows: [
                { day: 1, start: 9 * 60, end: 15 * 60 },
                { day: 3, start: 9 * 60, end: 15 * 60 },
                { day: 4, start: 12 * 60, end: 18 * 60 },
            ],
        },
        {
            providerId: "dr-osei",
            name: "Dr. Marcus Osei",
            windows: [
                { day: 2, start: 10 * 60, end: 18 * 60 },
                { day: 4, start: 10 * 60, end: 16 * 60 },
                { day: 5, start: 9 * 60, end: 13 * 60 },
            ],
        },
        {
            providerId: "dr-raghavan",
            name: "Dr. Priya Raghavan",
            windows: [
                { day: 1, start: 8 * 60, end: 14 * 60 },
                { day: 2, start: 8 * 60, end: 14 * 60 },
                { day: 5, start: 8 * 60, end: 14 * 60 },
            ],
        },
    ],
}

/**
 * Landing copy the practice's discipline owns: the strings the landing
 * modules and shell render that would read wrong for a different kind of
 * practice. This seed retrades them for a psychology practice —
 * everything else in the landing modules is practice-neutral on purpose.
 */
export const landingCopy = {
    /** The shell's nav labels for the pack's canonical trio of pages. */
    nav: { providers: "Psychologists", services: "Specialties", newPatients: "New clients" },
    /** The booking ask — the shell CTA and every page's primary CTA. */
    bookCtaLabel: "Book an appointment",
    home: {
        secondaryCtaLabel: "Meet the psychologists",
        servicesKicker: "What we treat",
        servicesHeading: "Focused treatment, named methods, honest timelines",
        providersKicker: "Your psychologists",
        providersHeading: "Three doctors, one standard of evidence",
        reviewsKicker: "From our clients",
        bannerTitle: "When you're ready to work on it.",
    },
    /** The insurance strip's kicker, shared by home, services, new clients. */
    insuranceKicker: "In network with most plans",
    /** The visit panel's headline — it names the practice's own street. */
    visitHeadline: "On South Ashley Street, two blocks from the farmers market.",
    providersPage: {
        headline: "The psychologists.",
        subheadline:
            "Three doctoral-level licensed psychologists, one standard: you'll know the method, the evidence behind it, and the measure we're tracking — from the first session to the last.",
    },
    servicesPage: {
        headline: "What we treat.",
        subheadline:
            "Anxiety, OCD, depression, insomnia, and the questions assessment answers — and when your situation calls for a different specialist or a prescriber, we'll say so and help you get there.",
        bannerTitle: "Assessment reports in plain language, in two weeks.",
    },
    newPatientsPage: {
        headline: "Starting is simpler than the deciding was.",
        subheadline:
            "Honest answers to the questions every new client asks — cost and insurance, therapy versus assessment, and what confidentiality really means.",
        kicker: "Common questions",
        bannerTitle: "The first step is a free 15-minute call.",
    },
    bookPage: {
        steps: [
            {
                title: "Pick an appointment type",
                description:
                    "A free consultation, an intake, a therapy session, or an assessment block — the length is built in.",
            },
            {
                title: "Choose a psychologist and time",
                description: "Real openings from each psychologist's actual week, up to four weeks out.",
            },
            {
                title: "Confirm by email",
                description: "Your confirmation carries a one-click cancel link. No portal, no password.",
            },
        ],
    },
}

export const home: CareHome = {
    headline: "Therapy that shows its work.",
    subheadline:
        "Individual psychotherapy and assessment for adults on South Ashley Street — evidence-based methods, progress measured every session, and an honest answer about when you're done.",
    credit: undefined,
    directory: { items: [] },
    hero: photo(
        "hero-office",
        1152,
        864,
        "The practice's waiting room: an oak bench and two slate-blue armchairs in cool, quiet morning light",
    ),
}

/**
 * The content-gated home bands (careSections.ts) stay empty: the practice
 * leads with its service grid, and filling one grows the matching section
 * (the spotlight appears once it has a headline; its photograph defaults
 * to the story's room).
 */
export const journey: CareJourney = { kicker: "", title: "", steps: [] }

export const promises: CarePromises = { kicker: "", title: "", items: [] }

export const exhibits: CareExhibits = { kicker: "", title: "", items: [], extras: [] }

export const menu: CareMenu = { kicker: "", title: "", intro: "", groups: [] }

export const spotlight: CareSpotlight | null = {
    kicker: "",
    headline: "",
    body: "",
    bullets: [],
    image: photo(
        "story-office",
        1152,
        864,
        "A consulting office: two facing armchairs, a wall of psychology texts, and soft morning window light",
    ),
    report: { label: "", title: "", summary: "", rows: [], signature: "", stamp: "" },
}

export const faq: CareFaq = { kicker: "", title: "", items: [] }

export const story = {
    kicker: "Our approach",
    headline: "We measure, so you know it's working.",
    paragraphs: [
        "Juniper Hill practices measurement-based care: every course of treatment starts with a baseline, uses a method with published evidence behind it — exposure and response prevention, behavioral activation, CBT-I — and tracks a number you can watch move. Not because you're a data point, but because feeling better is easier to trust when you can see it.",
        "Every psychologist here holds a doctorate and a license, and every plan comes with an estimate in sessions, reviewed every eighth one. Therapy that isn't working gets changed; therapy that's done gets finished. We'd rather graduate you than keep you.",
    ],
    image: photo(
        "story-office",
        1152,
        864,
        "A consulting office: two facing armchairs, a wall of psychology texts, and soft morning window light",
    ),
}

export const booking = {
    headline: "Book an appointment.",
    intro: "Pick an appointment type, a psychologist, and a time. You'll get an email confirmation with a one-click cancel link — no phone tree, no portal password.",
    // The privacy line the visitor reads beside the form. Honest by
    // design: it describes what the form collects, and claims nothing
    // beyond it (never write compliance claims into template copy).
    privacyNote:
        "Booking asks for your name, contact details, and appointment type — nothing about your reasons for coming. That conversation belongs in the room, and that's where it stays.",
}
