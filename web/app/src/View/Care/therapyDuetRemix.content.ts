/**
 * The care-therapy-duet remix's content seed (packs/README.md "Derived
 * templates"): a marriage & family therapy practice worn over the care
 * pack. At compose time this file is copied byte-for-byte over
 * `View/Care/content.ts`, so it must remain a STRUCTURAL TWIN of that
 * module — the same export surface, the same shapes, the contract's
 * minimums met (tests/View/Care/therapyDuetRemixSeed.test.ts pins the twin).
 *
 * The trade: Duet Family Therapy, a three-therapist marriage and family
 * practice on Sunset Boulevard in Silver Lake, Los Angeles. Sessions
 * replace visits, the hero reads as Side A of a record (couples intake,
 * family session, premarital), the fees print as a Side A / Side B
 * tracklist, and the booking surface stays clinically empty — name,
 * contact, session type, new/returning. What brings someone to therapy
 * never touches the site.
 *
 * Reviews are from FORMER clients, published with consent — therapists'
 * ethics codes bar soliciting testimonials from current clients.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/care-therapy-duet` (see PACK.md). The art direction is a
 * 1970s soul LP sleeve: amber lamplight, wood paneling, corduroy and
 * rust, people laughing mid-sentence; nothing clinical, nothing stocky.
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
        src: `/care-therapy-duet/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/care-therapy-duet/${name}-${step}w.webp`, width: step })),
    }
}

export const practice = {
    name: "Duet Family Therapy",
    tagline: "Couples and family therapy in Silver Lake",
    city: "Silver Lake, Los Angeles",
    address: "3208 Sunset Boulevard, Suite 2, Los Angeles, CA 90026",
    phone: "(323) 555-0167",
    email: "hello@duetfamilytherapy.example",
    mapsQuery: "3208 Sunset Boulevard Los Angeles CA 90026",
}

/**
 * The practice's week: late afternoons into the evening — couples come
 * after work — plus a Saturday morning for families. Sundays closed.
 * 0 = Sunday … 6 = Saturday; times are minutes since midnight.
 */
export const clinicHours: PracticeHoursEntry[] = [
    { day: 1, open: 10 * 60, close: 20 * 60 },
    { day: 2, open: 10 * 60, close: 20 * 60 },
    { day: 3, open: 10 * 60, close: 20 * 60 },
    { day: 4, open: 10 * 60, close: 20 * 60 },
    { day: 5, open: 10 * 60, close: 16 * 60 },
    { day: 6, open: 9 * 60, close: 13 * 60 },
]

/** Portraits by provider id — the contract carries facts, code carries art. */
export const providerPhotos: Record<string, CareImage> = {
    "baptiste-lmft": photo(
        "portrait-baptiste",
        1024,
        1365,
        "Roz Baptiste, silver-haired, in a rust turtleneck with a mug, smiling in a lamplit wood-paneled room",
    ),
    "ibarra-lmft": photo(
        "portrait-ibarra",
        1024,
        1365,
        "Marco Ibarra in a cream shirt, leaning in a sunlit doorway beside a hanging fern",
    ),
    "kim-amft": photo(
        "portrait-kim",
        1024,
        1365,
        "June Kim in a rust wrap dress, seated on a leather sofa with a notebook by a bookshelf",
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
            providerId: "baptiste-lmft",
            name: "Roz Baptiste",
            credentials: "LMFT",
            role: "Couples therapy · Founder",
            tags: undefined,
            bio: "Roz opened Duet in 2011 after a decade in community mental health. She works with couples at every stage — newly engaged, thirty years in, deciding whether to stay — and supervises the practice's associate. Clients say she's warm and does not let anyone off the hook.",
        },
        {
            providerId: "ibarra-lmft",
            name: "Marco Ibarra",
            credentials: "LMFT",
            role: "Families & teens",
            tags: undefined,
            bio: "Marco sees families with teenagers, blended families, and parents co-parenting across two houses. He's bilingual in English and Spanish and has a gift for getting a sixteen-year-old to say more than one word.",
        },
        {
            providerId: "kim-amft",
            name: "June Kim",
            credentials: "AMFT",
            role: "Associate MFT · supervised by Roz Baptiste, LMFT",
            tags: undefined,
            bio: "June works with premarital couples and partners navigating two cultures, two families, and one wedding. As a registered associate she practices under Roz's supervision, and she keeps a few reduced-fee hours each week.",
        },
    ],
    services: [
        {
            name: "Couples therapy",
            description:
                "For partners who keep having the same fight. We slow it down, find what's under it, and practice a different ending — in the room, then at home.",
        },
        {
            name: "Family therapy",
            description:
                "Parents, kids, grandparents — whoever's in the house. Everyone gets a turn, nobody gets blamed, and the week gets a little easier.",
        },
        {
            name: "Premarital counseling",
            description:
                "Six sessions before the wedding: money, families, conflict, the chores nobody mentions. Structured, practical, and oddly fun.",
        },
        {
            name: "Teens & their parents",
            description:
                "Separate time for the teenager and for the parents, then time together. Confidential within the limits the law sets, which we explain up front.",
        },
        {
            name: "Co-parenting after separation",
            description:
                "For parents who are done as partners but not as parents. One plan, two households, fewer handoffs in the driveway.",
        },
        {
            name: "Discernment counseling",
            description:
                "A short, structured process for couples where one partner is leaning out. Five sessions or fewer to decide — together — what comes next.",
        },
    ],
    // How clients pay — this practice is private pay and bills no insurer
    // directly, so the strip names ways to pay, not plans.
    insurance: [
        "Private pay",
        "Out-of-network superbills",
        "HSA cards",
        "FSA cards",
        "Sliding scale, limited",
        "Payment plans",
    ],
    locations: [
        {
            locationId: "sunset",
            label: "Sunset Boulevard",
            address: practice.address,
            phone: practice.phone,
            hours: clinicHours,
        },
    ],
    // Owner-curated: quotes from former clients, published with their
    // consent — contract data, never runtime review ingestion.
    reviews: [
        {
            quote: "We came in barely speaking. Roz made us slow down until we could actually hear each other, then made us practice it every week. We still do the Sunday check-in she taught us.",
            name: "D. & T.",
            detail: "Former couples clients, shared with consent",
        },
        {
            quote: "Marco got our fifteen-year-old to laugh in the first session. By the fifth, she was the one reminding us it was Tuesday.",
            name: "The R. family",
            detail: "Former family clients, shared with consent",
        },
        {
            quote: "June asked the questions nobody at the wedding shower did — about money, about my mother, about who does the dishes. Best six sessions we spent all year.",
            name: "A. & S.",
            detail: "Former premarital clients, shared with consent",
        },
    ],
    newPatient: [
        {
            title: "A free 15-minute call",
            body: "Tell us a little about what's going on and who'd come. We'll suggest the right therapist, or refer you elsewhere if we're not the fit.",
        },
        {
            title: "Your Good Faith Estimate",
            body: "Before the first session you'll get a written estimate of what care is expected to cost, as federal law requires for self-pay clients.",
        },
        {
            title: "The first session",
            body: "Couples intakes run 80 minutes, family intakes the same. We'll ask how you met, what's working, and what brought you in now.",
        },
        {
            title: "After that",
            body: "Most couples meet weekly or every other week for a few months. You'll get a superbill each month if you use out-of-network benefits.",
        },
    ],
}

/**
 * The `appointments` content domain, code fallback — booking mode 2's
 * inputs. Session types carry the slot length they book; each
 * therapist's weekly windows are packed back-to-back into concrete
 * capacity-1 slots by `generateAppointmentSlots`.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "free-call",
            name: "Free 15-minute call",
            durationMinutes: 15,
            description: "A phone call to see if we're the right fit before anything else.",
        },
        {
            typeId: "intake",
            name: "Couples or family intake",
            durationMinutes: 80,
            description: "The long first session, for everyone who's coming.",
        },
        {
            typeId: "session",
            name: "Session",
            durationMinutes: 50,
            description: "An ongoing session with your therapist, in person or by video.",
        },
    ],
    providers: [
        {
            providerId: "baptiste-lmft",
            name: "Roz Baptiste, LMFT",
            windows: [
                { day: 1, start: 15 * 60, end: 20 * 60 },
                { day: 3, start: 15 * 60, end: 20 * 60 },
                { day: 4, start: 12 * 60, end: 16 * 60 },
            ],
        },
        {
            providerId: "ibarra-lmft",
            name: "Marco Ibarra, LMFT",
            windows: [
                { day: 2, start: 15 * 60, end: 20 * 60 },
                { day: 6, start: 9 * 60, end: 13 * 60 },
            ],
        },
        {
            providerId: "kim-amft",
            name: "June Kim, AMFT",
            windows: [
                { day: 4, start: 16 * 60, end: 20 * 60 },
                { day: 5, start: 11 * 60, end: 15 * 60 },
            ],
        },
    ],
}

/**
 * Landing copy the practice's discipline owns — the base module's
 * `landingCopy`, retraded for a therapy practice (sessions, not visits).
 */
export const landingCopy = {
    /** The shell's nav labels for the pack's canonical trio of pages. */
    nav: { providers: "Therapists", services: "Sessions", newPatients: "Getting started" },
    /** The booking ask — the shell CTA and every page's primary CTA. */
    bookCtaLabel: "Book a free call",
    home: {
        secondaryCtaLabel: "Meet the therapists",
        servicesKicker: "Liner notes",
        servicesHeading: "What we work on",
        providersKicker: "The therapists",
        providersHeading: "Three voices, one practice.",
        reviewsKicker: "From former clients",
        bannerTitle: "Let's talk. The first call is free.",
    },
    /** The ways-to-pay strip's kicker, shared by home, services, getting started. */
    insuranceKicker: "Ways to pay",
    /** The visit panel's headline — it names the practice's own street. */
    visitHeadline: "Up the stairs at 3208 Sunset.",
    providersPage: {
        headline: "The therapists.",
        subheadline:
            "Two licensed marriage and family therapists and one supervised associate. We meet weekly to talk through our work — you get the whole practice, not one person alone.",
    },
    servicesPage: {
        headline: "The sessions.",
        subheadline:
            "Couples, families, teenagers, and the people about to marry each other. In person on Sunset or by video anywhere in California.",
        bannerTitle: "Side A starts with a free call.",
    },
    newPatientsPage: {
        headline: "Getting started.",
        subheadline:
            "What happens before the first session, what it costs, and what the first hour and twenty minutes is actually like.",
        kicker: "Before the first session",
        bannerTitle: "Fifteen minutes on the phone. No pressure.",
    },
    bookPage: {
        steps: [
            {
                title: "Pick a session type",
                description: "A free call, an intake for couples or families, or an ongoing session.",
            },
            {
                title: "Choose a therapist and time",
                description: "Real openings from each therapist's week, evenings and Saturdays included.",
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
    headline: "Let's talk about us.",
    accent: "last-word",
    subheadline:
        "Couples and family therapy in Silver Lake. We help partners, parents, and teenagers hear each other again — on Sunset Boulevard or by video anywhere in California.",
    credit: "Marriage & family therapy · Los Angeles",
    seal: "Side A · Est. 2011\nSilver Lake",
    directory: {
        title: "Side A",
        items: [
            { label: "Couples intake", note: "80 min" },
            { label: "Family session", note: "50 min" },
            { label: "Premarital", note: "6 sessions" },
        ],
    },
    hero: photo(
        "hero-duet",
        2400,
        2400,
        "A couple in 1970s prints laughing together on a velvet sofa in warm amber lamplight, a macramé hanging behind them",
    ),
}

export const journey: CareJourney = { kicker: "", title: "", steps: [] }

export const promises: CarePromises = { kicker: "", title: "", items: [] }

export const exhibits: CareExhibits = { kicker: "", title: "", items: [], extras: [] }

export const menu: CareMenu = {
    kicker: "The tracklist",
    title: "Sessions & fees.",
    intro: "Private pay, by the session. Every length is the real one.",
    groups: [
        {
            heading: "Side A · Couples",
            items: [
                { name: "Couples intake", note: "$240", price: "80 min" },
                { name: "Couples session", note: "$180", price: "50 min" },
                { name: "Premarital series", note: "$900 for the set", price: "6 sessions" },
                { name: "Discernment counseling", note: "$220 each", price: "5 sessions max" },
            ],
        },
        {
            heading: "Side B · Families",
            items: [
                { name: "Family intake", note: "$240", price: "80 min" },
                { name: "Family session", note: "$180", price: "50 min" },
                { name: "Teen session", note: "$160", price: "50 min" },
                { name: "Co-parenting session", note: "$180", price: "50 min" },
            ],
        },
    ],
    footnote:
        "Every self-pay client gets a Good Faith Estimate before the first session and a monthly superbill for out-of-network benefits. A few reduced-fee hours with June open each season — ask on the free call.",
}

export const spotlight: CareSpotlight | null = {
    kicker: "Side B",
    headline: "Families, teenagers included.",
    body: "Family sessions bring everyone in the house into one room, then give each person a turn to be heard without the usual interruptions. Teenagers get their own time too — and a straight answer about what stays private.",
    bullets: [
        "Evenings and Saturday mornings",
        "In English or Spanish with Marco",
        "Blended families and two-household co-parenting",
    ],
    image: photo(
        "family-session",
        1600,
        1200,
        "A father, mother, teenage daughter, and young son laughing together on a brown sofa in a warm wood-paneled room",
    ),
    report: { label: "", title: "", summary: "", rows: [], signature: "", stamp: "" },
    cta: { label: "See every session", path: "/what-we-treat" },
}

export const faq: CareFaq = {
    kicker: "Before the first call",
    title: "Things couples ask us.",
    items: [
        {
            question: "What does it cost?",
            answer: "Intakes are $240 for 80 minutes and ongoing sessions $180 for 50. Premarital is a six-session set. You'll get a Good Faith Estimate in writing before you start.",
        },
        {
            question: "Do you take insurance?",
            answer: "We're private pay. If your plan has out-of-network mental health benefits, we give you a monthly superbill to submit for reimbursement — call your plan to ask what they cover for couples or family therapy.",
        },
        {
            question: "Is what we say confidential?",
            answer: "Yes, with the limits the law sets — mainly risk of serious harm and suspected abuse. We explain all of it in the first session, and how we handle secrets between partners, before anyone shares anything.",
        },
        {
            question: "Do we both have to come?",
            answer: "For couples therapy, ideally yes. If your partner isn't ready, one of you can start; plenty of couples begin that way.",
        },
        {
            question: "Can we meet by video?",
            answer: "Yes, anywhere in California. Couples can even join from two different places if work travel gets in the way.",
        },
    ],
}

export const story = {
    kicker: "The practice",
    headline: "Why a duet.",
    paragraphs: [
        "Most problems couples bring in aren't about one person. They're about the song two people keep playing — the same fight, the same silence, the same Sunday. So we built a practice around the duet, not the soloist.",
        "Duet has been up the stairs on Sunset since 2011: three therapists, lamps instead of fluorescent lights, a sofa big enough for a whole family, and evening hours because that's when couples can come.",
    ],
    image: photo(
        "premarital",
        1600,
        1200,
        "Two men holding hands on a brown leather sofa, one laughing as the other gestures mid-story, under a warm lamp",
    ),
}

export const booking = {
    headline: "Book a free call.",
    intro: "Start with fifteen minutes on the phone, or book an intake if you're ready. You'll get an email confirmation with a one-click cancel link — no portal, no password.",
    // The privacy line the visitor reads beside the form. Honest by
    // design: it describes what the form collects, and claims nothing
    // beyond it (never write compliance claims into template copy).
    privacyNote:
        "Booking asks for your name, contact details, and session type — nothing about what's going on. That conversation starts in the room, at your pace.",
}
