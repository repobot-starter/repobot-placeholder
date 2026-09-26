/**
 * The care-therapy remix's content seed (packs/README.md "Derived
 * templates"): a marriage & family therapy practice worn over the care
 * pack. At compose time this file is copied byte-for-byte over
 * `View/Care/content.ts`, so it must remain a STRUCTURAL TWIN of that
 * module — the same export surface, the same shapes, the contract's
 * minimums met (tests/View/Care/therapyRemixSeed.test.ts pins the twin).
 *
 * The trade: Stillwater Family Therapy, a three-therapist marriage and
 * family practice in Madison, Wisconsin. Sessions replace visits, the
 * new-patient guide reads as plain-spoken FAQs, and the booking surface
 * stays clinically empty — name, contact, session type, new/returning.
 * What brings someone to therapy never touches the site.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/care-therapy` (see PACK.md). The art direction is warm
 * evening light — soft lamplit rooms, linen and wood, unposed portraits;
 * nothing clinical, nothing stocky.
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
        src: `/care-therapy/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/care-therapy/${name}-${step}w.webp`, width: step })),
    }
}

export const practice = {
    name: "Stillwater Family Therapy",
    tagline: "Therapy for couples, families, and the people in them",
    city: "Madison, Wisconsin",
    address: "743 Monroe Street, Suite 204, Madison, WI 53711",
    phone: "(608) 555-0142",
    email: "hello@stillwaterfamilytherapy.example",
    mapsQuery: "743 Monroe Street Madison WI 53711",
}

/**
 * The practice's week: weekday hours that run into the evening — therapy
 * happens after work — plus a Saturday morning. 0 = Sunday … 6 =
 * Saturday; times are minutes since midnight. The home hero derives its
 * live "Open today until…" badge from these.
 */
export const clinicHours: PracticeHoursEntry[] = [
    { day: 1, open: 9 * 60, close: 20 * 60 },
    { day: 2, open: 9 * 60, close: 20 * 60 },
    { day: 3, open: 9 * 60, close: 20 * 60 },
    { day: 4, open: 9 * 60, close: 20 * 60 },
    { day: 5, open: 9 * 60, close: 17 * 60 },
    { day: 6, open: 9 * 60, close: 13 * 60 },
]

/** Portraits by therapist id — the contract carries facts, code carries art. */
export const providerPhotos: Record<string, CareImage> = {
    "dr-brennan": photo(
        "portrait-brennan",
        864,
        1152,
        "Dr. Maya Brennan seated in a warm, lamplit therapy office, smiling gently",
    ),
    "delgado-lmft": photo(
        "portrait-delgado",
        864,
        1152,
        "Sam Delgado, LMFT, in a cardigan by a bookshelf, relaxed and open",
    ),
    "okafor-lmft": photo(
        "portrait-okafor",
        864,
        1152,
        "Ruth Okafor, LMFT, in an armchair by a window with soft morning light",
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
            providerId: "dr-brennan",
            name: "Dr. Maya Brennan",
            credentials: "PhD, LMFT",
            role: "Couples therapy · Founder",
            tags: undefined,
            bio: "Eighteen years of couples work, trained in Emotionally Focused Therapy and Gottman Method Level 3. Maya founded Stillwater around one belief: the relationship is the client. She's direct, warm, and unafraid of the hard conversation you've been avoiding.",
        },
        {
            providerId: "delgado-lmft",
            name: "Sam Delgado",
            credentials: "LMFT",
            role: "Families & teens",
            tags: undefined,
            bio: "Sam works with whole families and the teenagers in them — school refusal, blended-family friction, the silence at the dinner table. Structural family therapy, a decade of school-counseling experience, and sessions in English or Spanish.",
        },
        {
            providerId: "okafor-lmft",
            name: "Ruth Okafor",
            credentials: "LMFT",
            role: "Individuals · Grief & life transitions",
            tags: undefined,
            bio: "Ruth sees the individuals inside family systems — new parents, adult children of aging parents, anyone carrying a loss. Clients describe her as the calmest hour of their week. ACT and narrative therapy, with homework you'll actually do.",
        },
    ],
    services: [
        {
            name: "Couples therapy",
            description:
                "Weekly 50-minute sessions for couples at any stage — gridlocked conflict, rebuilding trust, or a strong marriage you want to keep that way.",
        },
        {
            name: "Family therapy",
            description:
                "The whole household in one room, working on the patterns between people rather than blaming any one of them.",
        },
        {
            name: "Individual therapy",
            description:
                "One-on-one work on anxiety, life transitions, and the relationships you bring with you — because individuals live in systems too.",
        },
        {
            name: "Teen & adolescent therapy",
            description:
                "A place for 13-to-18-year-olds that isn't the principal's office — with parents involved exactly as much as helps.",
        },
        {
            name: "Premarital counseling",
            description:
                "Six structured sessions before the wedding: money, family, conflict, and the conversations easier to have now than at year five.",
        },
        {
            name: "Parenting support",
            description:
                "Practical, judgment-free coaching for the season you're in — toddler storms, co-parenting after divorce, launching young adults.",
        },
        {
            name: "Grief & loss",
            description:
                "Room to grieve at your own pace — a death, a divorce, a diagnosis — with a therapist who won't rush you to the silver lining.",
        },
        {
            name: "Telehealth sessions",
            description:
                "Secure video sessions anywhere in Wisconsin, for the weeks when getting to Monroe Street is the obstacle.",
        },
    ],
    insurance: [
        "Anthem Blue Cross Blue Shield",
        "UnitedHealthcare",
        "Cigna",
        "Aetna",
        "Dean Health Plan",
        "Quartz",
        "Group Health Cooperative",
        "Medicare",
    ],
    locations: [
        {
            locationId: "monroe-street",
            label: "Monroe Street office",
            address: practice.address,
            phone: practice.phone,
            hours: clinicHours,
        },
    ],
    // Owner-curated: client words shared with written consent — contract
    // data, never runtime review ingestion.
    reviews: [
        {
            quote: "We came in barely speaking and planning who'd keep the house. Two years later we still do our Thursday check-ins from the worksheets Dr. Brennan gave us. She saved us the hard way — by making us do the work.",
            name: "J. & M.",
            detail: "Couples clients, shared with consent",
        },
        {
            quote: "Sam is the first counselor our son didn't stonewall. He talked to him like a person, not a problem, and taught the rest of us to do the same.",
            name: "The K. family",
            detail: "Family clients, shared with consent",
        },
        {
            quote: "Ruth sat with me through the worst year of my life and never once handed me a platitude. That hour was the one place I didn't have to be okay.",
            name: "A. R.",
            detail: "Individual client, shared with consent",
        },
    ],
    // The care pack's new-patient guide, worn here as plain-spoken FAQs —
    // title is the question, body is the honest answer.
    newPatient: [
        {
            title: "Do you take insurance?",
            body: "We're in network with the plans listed above, and for everything else we provide a superbill for out-of-network reimbursement. Session fees are on the confirmation email — no surprises at the door.",
        },
        {
            title: "What happens in the first session?",
            body: "Mostly, you talk and we listen: what's bringing you in, what you've tried, what better would look like. You'll leave with a plan — how often we'll meet, what we're working toward, and how we'll know it's working.",
        },
        {
            title: "How long does therapy take?",
            body: "It depends on the work, and you'll always know where we are. Many couples come weekly for three to six months, then taper. We review goals every eight sessions — staying is a choice we make together, never a default.",
        },
        {
            title: "Is what we say confidential?",
            body: "Yes, with the legal exceptions every therapist carries (safety, court orders), which we'll walk through in plain language before you say a word. Booking online asks nothing about your story — that stays in the room.",
        },
    ],
}

/**
 * The `appointments` content domain, code fallback — booking mode 2's
 * inputs. Session types carry the slot length they book; each therapist's
 * weekly windows are packed back-to-back into concrete capacity-1 slots
 * by `generateAppointmentSlots` (kernel and platform run the same
 * derivation, so the preview offers exactly what a deploy would).
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "free-consult",
            name: "Free 15-minute consultation",
            durationMinutes: 15,
            description: "A short phone call to see whether we're the right fit — no charge, no pressure.",
        },
        {
            typeId: "intake-session",
            name: "First session (intake)",
            durationMinutes: 75,
            description: "A longer first session: your story, your goals, and a plan for the work.",
        },
        {
            typeId: "therapy-session",
            name: "Therapy session",
            durationMinutes: 50,
            description: "The standard 50-minute session — individual, couples, or family.",
        },
    ],
    providers: [
        {
            providerId: "dr-brennan",
            name: "Dr. Maya Brennan",
            windows: [
                { day: 1, start: 12 * 60, end: 19 * 60 },
                { day: 3, start: 12 * 60, end: 19 * 60 },
                { day: 4, start: 9 * 60, end: 14 * 60 },
            ],
        },
        {
            providerId: "delgado-lmft",
            name: "Sam Delgado, LMFT",
            windows: [
                { day: 2, start: 13 * 60, end: 20 * 60 },
                { day: 4, start: 13 * 60, end: 20 * 60 },
                { day: 6, start: 9 * 60, end: 12 * 60 },
            ],
        },
        {
            providerId: "okafor-lmft",
            name: "Ruth Okafor, LMFT",
            windows: [
                { day: 1, start: 9 * 60, end: 13 * 60 },
                { day: 3, start: 9 * 60, end: 13 * 60 },
                { day: 5, start: 10 * 60, end: 16 * 60 },
            ],
        },
    ],
}

/**
 * Landing copy the practice's discipline owns: the strings the landing
 * modules and shell render that would read wrong for a different kind of
 * practice. This seed retrades them for the therapy room — everything
 * else in the landing modules is practice-neutral on purpose.
 */
export const landingCopy = {
    /** The shell's nav labels for the pack's canonical trio of pages. */
    nav: { providers: "Therapists", services: "Services", newPatients: "Getting started" },
    /** The booking ask — the shell CTA and every page's primary CTA. */
    bookCtaLabel: "Book a session",
    home: {
        secondaryCtaLabel: "Meet the therapists",
        servicesKicker: "How we help",
        servicesHeading: "Care for every relationship under your roof",
        providersKicker: "Your therapists",
        providersHeading: "The people across from the couch",
        reviewsKicker: "From our clients",
        bannerTitle: "Whenever you're ready.",
    },
    /** The insurance strip's kicker, shared by home, services, getting started. */
    insuranceKicker: "In network with most plans",
    /** The visit panel's headline — it names the practice's own street. */
    visitHeadline: "On Monroe Street, a short walk from Camp Randall.",
    providersPage: {
        headline: "The therapists.",
        subheadline:
            "Three licensed marriage and family therapists, one standard: you'll always know what we're working on, why, and how we'll know it's helping.",
    },
    servicesPage: {
        headline: "How we help.",
        subheadline:
            "Evidence-based therapy for couples, families, and individuals — and when a different specialist would serve you better, we'll say so and help you find them.",
        bannerTitle: "Evening sessions, most weekdays.",
    },
    newPatientsPage: {
        headline: "Starting therapy shouldn't need therapy.",
        subheadline:
            "Honest answers to the questions everyone asks — cost and insurance, what the first session is like, and what confidentiality really means.",
        kicker: "Common questions",
        bannerTitle: "The first step is a free 15-minute call.",
    },
    bookPage: {
        steps: [
            {
                title: "Pick a session type",
                description:
                    "A free consultation, a first intake, or an ongoing session — the length is built in.",
            },
            {
                title: "Choose a therapist and time",
                description: "Real openings from each therapist's actual week, up to four weeks out.",
            },
            {
                title: "Confirm by email",
                description: "Your confirmation carries a one-click cancel link. No portal, no password.",
            },
        ],
    },
}

export const home: CareHome = {
    headline: "A calm hour for the people you love.",
    subheadline:
        "Marriage and family therapy on Monroe Street — evening sessions, telehealth across Wisconsin, and therapists who give you tools, not just time.",
    credit: undefined,
    directory: { items: [] },
    hero: photo(
        "hero-office",
        1152,
        864,
        "The practice's sitting room: linen armchairs by tall windows, plants, and warm evening light",
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
        "story-room",
        1152,
        864,
        "A therapy room with two facing armchairs, a soft rug, and a lamp — no desk between them",
    ),
    report: { label: "", title: "", summary: "", rows: [], signature: "", stamp: "" },
}

export const faq: CareFaq = { kicker: "", title: "", items: [] }

export const story = {
    kicker: "Our approach",
    headline: "We treat the space between people.",
    paragraphs: [
        "Stillwater practices systems therapy: the client isn't one person's flaws, it's the pattern the two of you (or five of you) fall into under stress. Name the pattern, and it loosens. Every therapist here is a licensed MFT trained in evidence-based methods — Emotionally Focused Therapy, the Gottman Method, structural family work.",
        "Sessions end with something to practice, and every eighth session we check the work against the goals you set in your first one. Therapy that isn't helping is a schedule, not a treatment — we'd rather graduate you than keep you.",
    ],
    image: photo(
        "story-room",
        1152,
        864,
        "A therapy room with two facing armchairs, a soft rug, and a lamp — no desk between them",
    ),
}

export const booking = {
    headline: "Book a session.",
    intro: "Pick a session type, a therapist, and a time. You'll get an email confirmation with a one-click cancel link — no phone tree, no portal password.",
    // The privacy line the visitor reads beside the form. Honest by
    // design: it describes what the form collects, and claims nothing
    // beyond it (never write compliance claims into template copy).
    privacyNote:
        "Booking asks for your name, contact details, and session type — nothing about your story. What brings you in stays in the room, where it belongs.",
}
