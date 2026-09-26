/**
 * The care-primary-magnolia remix's content seed (packs/README.md "Derived
 * templates"): a concierge internal-medicine practice worn over the care
 * pack. At compose time this file is copied byte-for-byte over
 * `View/Care/content.ts`, so it must remain a STRUCTURAL TWIN of that
 * module — the same export surface, the same shapes, the contract's
 * minimums met (tests/View/Care/magnoliaRemixSeed.test.ts pins the twin).
 *
 * The trade: Magnolia Concierge Medicine, two internists and a nurse care
 * coordinator in a converted house in Green Hills, Nashville — membership
 * from $250 a month, limited to 400 patients. The home page opens on a
 * full-bleed photograph (a doctor and a patient laughing at a walnut
 * table under the magnolia windows), then three promises, then the first
 * year as a photographic timeline: the two-hour physical, labs reviewed
 * together, specialists coordinated, a house call, the year in review.
 * The booking surface stays clinically empty — name, contact, visit type,
 * new/returning.
 *
 * Reviews are from members, published with consent.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/care-primary-magnolia` (see PACK.md). The art direction is
 * a Southern parlor in daylight: blush walls, walnut furniture, magnolia
 * branches at the windows, people mid-laugh.
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
        src: `/care-primary-magnolia/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/care-primary-magnolia/${name}-${step}w.webp`, width: step })),
    }
}

export const practice = {
    name: "Magnolia Concierge Medicine",
    tagline: "Concierge internal medicine for adults",
    city: "Green Hills, Nashville",
    address: "2114 Abbott Martin Road, Nashville, TN 37215",
    phone: "(615) 555-0142",
    email: "hello@magnoliaconcierge.example",
    mapsQuery: "2114 Abbott Martin Road Nashville TN 37215",
}

/**
 * The practice's week: weekdays 8 to 5, a Saturday morning for members,
 * Sundays closed (the physicians' cells stay on). 0 = Sunday … 6 =
 * Saturday; times are minutes since midnight.
 */
export const clinicHours: PracticeHoursEntry[] = [
    { day: 1, open: 8 * 60, close: 17 * 60 },
    { day: 2, open: 8 * 60, close: 17 * 60 },
    { day: 3, open: 8 * 60, close: 17 * 60 },
    { day: 4, open: 8 * 60, close: 17 * 60 },
    { day: 5, open: 8 * 60, close: 17 * 60 },
    { day: 6, open: 9 * 60, close: 12 * 60 },
]

/** Portraits by provider id — the contract carries facts, code carries art. */
export const providerPhotos: Record<string, CareImage> = {
    "dr-beaumont": photo(
        "portrait-beaumont",
        1024,
        1365,
        "Dr. Nadia Beaumont laughing in an oatmeal cardigan beside a blush velvet chair and a walnut bookcase",
    ),
    "dr-marchetti": photo(
        "portrait-marchetti",
        1024,
        1365,
        "Dr. Theo Marchetti in a navy sweater, mid-sentence and gesturing, at a walnut desk by a magnolia window",
    ),
    "marisol-dela-cruz": photo(
        "portrait-delacruz",
        1024,
        1365,
        "Marisol Dela Cruz, RN, laughing on the phone with a notebook and a cup of coffee on a walnut table",
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
            providerId: "dr-beaumont",
            name: "Dr. Nadia Beaumont",
            credentials: "MD",
            role: "Internal medicine · Founder",
            tags: undefined,
            bio: "Nadia practiced hospital medicine at a large Nashville system for twelve years, seeing thirty patients a day, before opening Magnolia with a promise to see eight. She is board-certified in internal medicine, still makes most of the house calls herself, and will tell you exactly what your cholesterol number means over a cup of coffee.",
        },
        {
            providerId: "dr-marchetti",
            name: "Dr. Theo Marchetti",
            credentials: "MD",
            role: "Internal medicine",
            tags: undefined,
            bio: "Theo trained in internal medicine and spent five years in a rural clinic outside Knoxville, where knowing a patient's whole story wasn't optional. He looks after members with diabetes, heart and thyroid conditions, and anyone who has been told to 'watch it' without being told how.",
        },
        {
            providerId: "marisol-dela-cruz",
            name: "Marisol Dela Cruz",
            credentials: "RN, BSN",
            role: "Care coordinator",
            tags: undefined,
            bio: "Marisol is the reason your specialist appointment happens next week instead of next quarter. She books referrals, chases records, reads every note that comes back, and answers the practice line — usually by the second ring.",
        },
    ],
    services: [
        {
            name: "The two-hour physical",
            description:
                "Every year, a comprehensive visit with your physician: history, exam, screenings, and a written plan you take home.",
        },
        {
            name: "Same-day and next-day visits",
            description:
                "Sick on a Tuesday morning? Call or text, and you'll be seen that day, in the office, by video, or at home.",
        },
        {
            name: "House calls",
            description:
                "For a fever, a fall, a post-surgery check, or a parent who can't easily get out. Green Hills, Belle Meade, and nearby.",
        },
        {
            name: "Labs, reviewed together",
            description:
                "Blood drawn in the office, results explained at the table — what's normal, what's changed, and what we do about it.",
        },
        {
            name: "Specialist coordination",
            description:
                "We choose the specialist, send your history, book the appointment, and read the notes when they come back.",
        },
        {
            name: "Ongoing and preventive care",
            description:
                "Blood pressure, diabetes, thyroid, cholesterol, sleep, travel medicine, and the screenings your age calls for.",
        },
    ],
    // The strip names how membership works beside insurance — never
    // insurers.
    insurance: [
        "Works alongside most PPO plans",
        "Medicare patients welcome",
        "Labs and imaging billed to your plan",
        "HSA & FSA cards accepted",
        "Monthly or annual membership",
        "No long-term contract",
    ],
    locations: [
        {
            locationId: "abbott-martin",
            label: "The house on Abbott Martin",
            address: practice.address,
            phone: practice.phone,
            hours: clinicHours,
        },
    ],
    // Owner-curated: quotes from members, published with their consent —
    // contract data, never runtime review ingestion.
    reviews: [
        {
            quote: "My first physical took two hours and nobody looked at a clock. Dr. Beaumont found the thing three other doctors had missed, and then she called me that Saturday to see how I was doing.",
            name: "Caroline W.",
            detail: "Member, Green Hills",
        },
        {
            quote: "I texted Dr. Marchetti at seven in the morning with a fever. He was at my kitchen table by nine. I didn't know medicine could still work like this.",
            name: "Devon R.",
            detail: "Member, Belle Meade",
        },
        {
            quote: "Marisol got my mother in with a cardiologist in six days and then sat with me to go over the notes. That alone is worth the membership.",
            name: "Priya S.",
            detail: "Member, Sylvan Park",
        },
    ],
    newPatient: [
        {
            title: "A twenty-minute introduction",
            body: "A call with one of our physicians to talk about your health, what you're looking for, and whether membership is the right fit. There's no charge and no obligation.",
        },
        {
            title: "Enrollment",
            body: "Choose monthly or annual membership and sign a one-page agreement. We request your records from your previous doctor, so you don't have to.",
        },
        {
            title: "Your two-hour physical",
            body: "Within your first two weeks. Come hungry for the fasting labs, and bring a list of every question you've been saving up.",
        },
        {
            title: "Your physician's number",
            body: "At the end of your first visit you'll have your doctor's cell number. Use it.",
        },
    ],
}

/**
 * The `appointments` content domain, code fallback — booking mode 2's
 * inputs. Visit types carry the slot length they book; each physician's
 * weekly windows are packed back-to-back into concrete capacity-1 slots by
 * `generateAppointmentSlots`.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "introduction",
            name: "Introduction call",
            durationMinutes: 20,
            description: "A free call to see whether membership is the right fit.",
        },
        {
            typeId: "physical",
            name: "Two-hour physical",
            durationMinutes: 120,
            description: "Your annual comprehensive visit, for members.",
        },
        {
            typeId: "visit",
            name: "Visit",
            durationMinutes: 60,
            description: "An hour with your physician, in the office or by video.",
        },
    ],
    providers: [
        {
            providerId: "dr-beaumont",
            name: "Dr. Nadia Beaumont",
            windows: [
                { day: 1, start: 8 * 60, end: 12 * 60 },
                { day: 3, start: 8 * 60, end: 12 * 60 },
                { day: 4, start: 13 * 60, end: 17 * 60 },
            ],
        },
        {
            providerId: "dr-marchetti",
            name: "Dr. Theo Marchetti",
            windows: [
                { day: 2, start: 8 * 60, end: 12 * 60 },
                { day: 4, start: 8 * 60, end: 12 * 60 },
                { day: 5, start: 13 * 60, end: 17 * 60 },
            ],
        },
    ],
}

/**
 * Landing copy the practice's discipline owns — the base module's
 * `landingCopy`, retraded for a concierge practice (members and an
 * introduction, not patients and an appointment).
 */
export const landingCopy = {
    /** The shell's nav labels for the pack's canonical trio of pages. */
    nav: { providers: "Physicians", services: "Membership", newPatients: "Join" },
    /** The booking ask — the shell CTA and every page's primary CTA. */
    bookCtaLabel: "Schedule an introduction",
    home: {
        secondaryCtaLabel: "Meet the physicians",
        servicesKicker: "Membership",
        servicesHeading: "What membership includes",
        providersKicker: "Your physicians",
        providersHeading: "Two doctors. Four hundred members.",
        reviewsKicker: "From our members",
        bannerTitle: "Start with a twenty-minute introduction.",
    },
    /** The alongside-insurance strip's kicker, shared by home, membership, join. */
    insuranceKicker: "Alongside your insurance",
    /** The visit panel's headline — it names the practice's own street. */
    visitHeadline: "The house on Abbott Martin Road.",
    providersPage: {
        headline: "Your physicians.",
        subheadline:
            "Two board-certified internists and a nurse who knows every member by name. Each physician looks after no more than two hundred people.",
    },
    servicesPage: {
        headline: "What membership includes.",
        subheadline:
            "Everything a doctor should have time for: the long physical, same-day visits, house calls, and someone to coordinate the rest.",
        bannerTitle: "Membership from $250 a month.",
    },
    newPatientsPage: {
        headline: "Joining Magnolia.",
        subheadline:
            "An introduction call, a one-page agreement, and your first two-hour physical within two weeks. We'll request your records for you.",
        kicker: "How joining works",
        bannerTitle: "We keep a short waitlist when we're full.",
    },
    bookPage: {
        steps: [
            {
                title: "Choose a visit",
                description: "A free introduction call, or — for members — a visit or your annual physical.",
            },
            {
                title: "Pick a physician and time",
                description:
                    "Real openings from Dr. Beaumont's and Dr. Marchetti's weeks, up to four weeks out.",
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
    headline: "Time with your doctor.\nImagine that.",
    accent: "last-line",
    subheadline:
        "Concierge internal medicine in Green Hills: same-day visits, house calls, and appointments that run an hour, with a physician who has time to listen.",
    credit: "Membership from $250/month · Limited to 400 members",
    directory: { items: [] },
    hero: photo(
        "hero",
        2400,
        1350,
        "A doctor and her patient laughing together at a walnut table with coffee cups, magnolia blossoms filling the tall window behind them",
    ),
}

export const journey: CareJourney = {
    kicker: "Your first year",
    title: "A year of care, not a visit.",
    layout: "timeline",
    steps: [
        {
            label: "Week 1",
            title: "The two-hour physical",
            description:
                "A comprehensive visit, without rush. We listen, we examine, and we write down what matters to you — not only what's on the chart.",
            image: photo(
                "physical",
                1600,
                1200,
                "A young woman in a mustard sweater laughing as her doctor takes her blood pressure in a blush sitting room",
            ),
        },
        {
            label: "Week 2",
            title: "Labs, reviewed together",
            description:
                "Your results explained in context, at the table, with time for every question. Not a portal message — a conversation.",
            image: photo(
                "labs",
                1600,
                1200,
                "A doctor and a patient in a denim jacket going over a printed lab report and laughing at a walnut table",
            ),
        },
        {
            label: "Month 3",
            title: "Your specialists, coordinated",
            description:
                "When you need a cardiologist or a dermatologist, we make the call, send your history ahead, and read the notes when they come back.",
            image: photo(
                "specialists",
                1600,
                1200,
                "Dr. Marchetti laughing on the phone with a specialist as a patient with auburn curls reads her referral letter beside him at a walnut desk",
            ),
        },
        {
            label: "Anytime",
            title: "A house call when you need one",
            description:
                "Care comes to you — for a fever, a fall, or simply peace of mind. Dr. Beaumont still carries the bag.",
            image: photo(
                "housecall",
                1600,
                1200,
                "A doctor with a leather bag greeted at a brick front door by a father holding his toddler, magnolias in bloom",
            ),
        },
        {
            label: "Month 12",
            title: "Your year in review",
            description:
                "A long visit to look back at your health and your goals, and to decide together what matters most next.",
            image: photo(
                "review",
                1600,
                1200,
                "A silver-haired woman and her doctor walking and talking under a blooming magnolia, petals on the brick path",
            ),
        },
    ],
}

export const promises: CarePromises = {
    kicker: "Membership",
    title: "What changes when your doctor has time.",
    items: [
        {
            icon: "calendar",
            title: "Same-day access",
            description: "When you're sick, you're seen today — in the office, by video, or at home.",
        },
        {
            icon: "clock",
            title: "Sixty-minute visits",
            description: "Unhurried time for the question you'd normally save for the parking lot.",
        },
        {
            icon: "phone",
            title: "Your doctor's cell",
            description: "Call or text your physician directly. Evenings and weekends, too.",
        },
    ],
}

export const exhibits: CareExhibits = { kicker: "", title: "", items: [], extras: [] }

export const menu: CareMenu = {
    kicker: "Membership",
    title: "One membership. Everything in it.",
    intro: "Billed monthly or once a year. It covers every visit, call, and house call with your physician.",
    groups: [
        {
            heading: "Membership",
            items: [
                { name: "Individual", note: "Per month, ages 26 and up", price: "$250", qualifier: "from" },
                { name: "Couple", note: "Per month, two members in one household", price: "$450" },
                { name: "Young adult", note: "Per month, ages 18 to 25", price: "$150" },
                { name: "Annual, paid upfront", note: "Individual, one payment a year", price: "$2,700" },
            ],
        },
        {
            heading: "Included",
            items: [
                { name: "Two-hour annual physical", note: "With in-office labs", price: "Included" },
                { name: "Same-day and next-day visits", note: "Office, video, or home", price: "Included" },
                { name: "House calls", note: "Green Hills, Belle Meade, and nearby", price: "Included" },
                { name: "Specialist coordination", note: "Referrals, records, follow-up", price: "Included" },
            ],
        },
    ],
    footnote:
        "Membership covers your physician's time. Labs, imaging, and specialist visits are billed to your insurance as usual. Limited to 400 members — when we're full, we keep a short waitlist.",
}

export const spotlight: CareSpotlight | null = {
    kicker: "",
    headline: "",
    body: "",
    bullets: [],
    image: photo(
        "house",
        1600,
        1200,
        "A woman in a camel coat arriving at a brick Tudor house under a blooming magnolia as the doctor waves from the open door",
    ),
    report: { label: "", title: "", summary: "", rows: [], signature: "", stamp: "" },
}

export const faq: CareFaq = {
    kicker: "Questions",
    title: "Before you join.",
    items: [
        {
            question: "What is concierge medicine?",
            answer: "You pay a membership fee for your physician's time, and in return the practice stays small: two doctors, no more than 400 members. That's what makes same-day visits, hour-long appointments, and a doctor's cell number possible.",
        },
        {
            question: "Do I still need insurance?",
            answer: "Yes. Membership covers your time with us; your insurance still covers labs, imaging, prescriptions, specialists, and the hospital. We recommend keeping a plan you're happy with.",
        },
        {
            question: "Can I use my HSA or FSA?",
            answer: "HSA and FSA cards are accepted for membership, though whether membership counts as a qualified expense depends on your plan — check with your plan administrator.",
        },
        {
            question: "Do you really make house calls?",
            answer: "We do, in Green Hills, Belle Meade, Forest Hills, and nearby neighborhoods, for members who are too sick to come in, recovering from surgery, or simply better seen at home.",
        },
        {
            question: "What if it's an emergency?",
            answer: "Call 911 or go to the nearest emergency room. Then call us — we'll talk to the ER team and follow you through the hospital stay.",
        },
    ],
}

export const story = {
    kicker: "The practice",
    headline: "A house in Green Hills, on purpose.",
    paragraphs: [
        "Nadia opened Magnolia in a 1930s brick house on Abbott Martin Road after twelve years of fifteen-minute visits. She wanted a waiting room nobody waits in, a table instead of an exam desk, and a front door she could wave from.",
        "The magnolia out front was already there. It blooms every April, and most of our members have a photo of it by the end of their first year.",
    ],
    image: photo(
        "house",
        1600,
        1200,
        "A woman in a camel coat arriving at a brick Tudor house under a blooming magnolia as the doctor waves from the open door",
    ),
}

export const booking = {
    headline: "Schedule an introduction.",
    intro: "Start with a free twenty-minute call with Dr. Beaumont or Dr. Marchetti. Members can book visits and their annual physical here too. You'll get an email confirmation with a one-click cancel link — no portal, no password.",
    // The privacy line the visitor reads beside the form. Honest by
    // design: it describes what the form collects, and claims nothing
    // beyond it (never write compliance claims into template copy).
    privacyNote:
        "Booking asks for your name, contact details, and visit type — nothing about your health. That conversation happens at the table.",
}
