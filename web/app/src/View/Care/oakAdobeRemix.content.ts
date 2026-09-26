/**
 * The care-obgyn-oakadobe remix's content seed (packs/README.md "Derived
 * templates"): a freestanding birth center worn over the care pack. At
 * compose time this file is copied byte-for-byte over
 * `View/Care/content.ts`, so it must remain a STRUCTURAL TWIN of that
 * module — the same export surface, the same shapes, the contract's
 * minimums met (tests/View/Care/oakAdobeRemixSeed.test.ts pins the twin).
 *
 * The trade: Oak & Adobe Birth Center, a midwife-led birth center in
 * Ojai, California — three birth suites, two certified nurse-midwives who
 * see each family from the first prenatal visit to six weeks after the
 * birth, and a lactation consultant. The home is the `stack` home
 * (`home.stack`): the suite under the headline, one band line, two
 * frames, and the tour. Providers, what we offer, coverage, and booking
 * keep the base pack's pages, and the booking surface stays clinically
 * empty — name, contact, visit type, new/returning.
 *
 * Reviews are from families who gave birth here, published with consent.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/care-obgyn-oakadobe` (see PACK.md). The art direction is
 * late-afternoon light on adobe plaster, olive and fired clay, people
 * mid-laugh; nothing clinical, nothing stocky.
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
        src: `/care-obgyn-oakadobe/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/care-obgyn-oakadobe/${name}-${step}w.webp`, width: step })),
    }
}

export const practice = {
    name: "Oak & Adobe Birth Center",
    tagline: "Birth center and midwifery care in Ojai",
    city: "Ojai, California",
    address: "1120 Grand Avenue, Ojai, CA 93023",
    phone: "(805) 555-0148",
    email: "hello@oakandadobe.example",
    mapsQuery: "1120 Grand Avenue Ojai CA 93023",
}

/**
 * The center's clinic week: prenatal and postpartum visits on weekdays,
 * tours on Saturday mornings. Births keep their own hours — the midwife
 * on call answers the phone around the clock. Sundays closed.
 * 0 = Sunday … 6 = Saturday; times are minutes since midnight.
 */
export const clinicHours: PracticeHoursEntry[] = [
    { day: 1, open: 9 * 60, close: 17 * 60 },
    { day: 2, open: 9 * 60, close: 17 * 60 },
    { day: 3, open: 9 * 60, close: 17 * 60 },
    { day: 4, open: 9 * 60, close: 17 * 60 },
    { day: 5, open: 9 * 60, close: 15 * 60 },
    { day: 6, open: 9 * 60, close: 12 * 60 },
]

/** Portraits by provider id — the contract carries facts, code carries art. */
export const providerPhotos: Record<string, CareImage> = {
    "reyes-cnm": photo(
        "portrait-reyes",
        864,
        1152,
        "Inés Reyes in a sage linen shirt, laughing with a mug of tea by a doorway open to the olive garden",
    ),
    "lindqvist-cnm": photo(
        "portrait-lindqvist",
        864,
        1152,
        "Hanne Lindqvist, sandy-grey hair and freckles, laughing as she folds a clean linen sheet in a birth suite",
    ),
    "achebe-ibclc": photo(
        "portrait-achebe",
        864,
        1152,
        "Adaeze Achebe in a terracotta dress, laughing mid-sentence on the porch bench with a notebook on her knee",
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
            providerId: "reyes-cnm",
            name: "Inés Reyes",
            credentials: "CNM",
            role: "Midwife · Co-founder",
            tags: undefined,
            bio: "Inés caught babies at a hospital in Oxnard for nine years before she and Hanne opened Oak & Adobe in 2019. She sees every family on her side of the schedule from the first visit to the six-week check, and she's bilingual in English and Spanish.",
        },
        {
            providerId: "lindqvist-cnm",
            name: "Hanne Lindqvist",
            credentials: "CNM",
            role: "Midwife · Co-founder",
            tags: undefined,
            bio: "Hanne trained in Stockholm and Los Angeles and has attended more than eight hundred births, about a third of them in water. She runs the center's postpartum home visits and still drives out to every one.",
        },
        {
            providerId: "achebe-ibclc",
            name: "Adaeze Achebe",
            credentials: "IBCLC",
            role: "Lactation consultant",
            tags: undefined,
            bio: "Adaeze meets every family on day two and again at one week, at the center or at home. Feeding, sleep, pumping for work — she has an answer, or she'll find one, and she never makes anyone feel behind.",
        },
    ],
    services: [
        {
            name: "Prenatal care",
            description:
                "Hour-long visits with the same two midwives, from the first appointment to thirty-nine weeks. Labs, ultrasound referrals, and time to ask everything.",
        },
        {
            name: "Birth in the suites",
            description:
                "Three suites with a bed, a deep tub, and a window on the valley. Your people come; the midwife stays until you're settled at home.",
        },
        {
            name: "Water birth",
            description:
                "Labor and birth in warm water, if you want it and it stays safe. Every suite has a tub; about half our families use it.",
        },
        {
            name: "Postpartum home visits",
            description:
                "Visits at home on day one and day three, then at the center at two and six weeks — for you and the baby, by the midwife you know.",
        },
        {
            name: "Lactation support",
            description:
                "Feeding help on day two and at one week with Adaeze, and a drop-in circle every Thursday morning for anyone who needs it.",
        },
        {
            name: "Well-person care",
            description:
                "Annual exams, contraception, and preconception visits with the midwives, between babies or long after them.",
        },
    ],
    // Plans the center bills directly; self-pay families get the package
    // price up front.
    insurance: [
        "Blue Shield of California",
        "Anthem Blue Cross",
        "Aetna",
        "Cigna",
        "Medi-Cal",
        "Self-pay birth package",
    ],
    locations: [
        {
            locationId: "grand-avenue",
            label: "Grand Avenue",
            address: practice.address,
            phone: practice.phone,
            hours: clinicHours,
        },
    ],
    // Owner-curated: quotes from families who gave birth here, published
    // with their consent — contract data, never runtime review ingestion.
    reviews: [
        {
            quote: "Inés was at my first visit and at the last push, and she knew exactly what I meant when I said I was done. I was not done. She was right.",
            name: "Lucía M.",
            detail: "Birth in the west suite, 2026",
        },
        {
            quote: "Hanne came to our house the day after with a pot of soup and a scale. We cried, she weighed him, we ate the soup.",
            name: "Sam & Theo R.",
            detail: "Water birth, 2026",
        },
        {
            quote: "Adaeze fixed in twenty minutes what three days of videos couldn't. Then she told me to go take a nap, and I did.",
            name: "Priya K.",
            detail: "Lactation visits, 2025",
        },
    ],
    newPatient: [
        {
            title: "Come on a tour",
            body: "Tours run the first Saturday of every month at ten. See the suites, meet a midwife, and ask the questions you'd feel silly asking on the phone.",
        },
        {
            title: "A consult with the midwives",
            body: "Thirty minutes to talk through your health history and whether a birth center is right for you. Most healthy, low-risk pregnancies are.",
        },
        {
            title: "Your first prenatal visit",
            body: "An hour-long visit before twelve weeks if you can: history, labs, the due date, and a plan that fits you.",
        },
        {
            title: "If plans change",
            body: "Ojai Valley Hospital is five minutes away. If you need to transfer, your midwife comes with you and stays.",
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
            typeId: "tour",
            name: "Birth center tour",
            durationMinutes: 60,
            description: "The first Saturday of every month: the suites, a midwife, and your questions.",
        },
        {
            typeId: "consult",
            name: "Midwife consult",
            durationMinutes: 30,
            description: "A first talk about your pregnancy and whether the center fits.",
        },
        {
            typeId: "prenatal",
            name: "Prenatal visit",
            durationMinutes: 60,
            description: "An hour with your midwife, every visit.",
        },
    ],
    providers: [
        {
            providerId: "reyes-cnm",
            name: "Inés Reyes, CNM",
            windows: [
                { day: 1, start: 9 * 60, end: 16 * 60 },
                { day: 3, start: 9 * 60, end: 16 * 60 },
                { day: 6, start: 9 * 60, end: 12 * 60 },
            ],
        },
        {
            providerId: "lindqvist-cnm",
            name: "Hanne Lindqvist, CNM",
            windows: [
                { day: 2, start: 9 * 60, end: 16 * 60 },
                { day: 4, start: 9 * 60, end: 16 * 60 },
            ],
        },
        {
            providerId: "achebe-ibclc",
            name: "Adaeze Achebe, IBCLC",
            windows: [
                { day: 4, start: 9 * 60, end: 12 * 60 },
                { day: 5, start: 9 * 60, end: 14 * 60 },
            ],
        },
    ],
}

/**
 * Landing copy the practice's discipline owns — the base module's
 * `landingCopy`, retraded for a birth center (families, not patients).
 */
export const landingCopy = {
    /** The shell's nav labels for the pack's canonical trio of pages. */
    nav: { providers: "Midwives", services: "Care", newPatients: "Getting started" },
    /** The booking ask — the shell CTA and every page's primary CTA. */
    bookCtaLabel: "Book a tour",
    home: {
        secondaryCtaLabel: "Meet the midwives",
        servicesKicker: "The care",
        servicesHeading: "From the first visit to six weeks after",
        providersKicker: "The midwives",
        providersHeading: "The same two midwives, start to finish.",
        reviewsKicker: "From our families",
        bannerTitle: "Tours on the first Saturday of every month.",
    },
    /** The coverage strip's kicker, shared by care and getting started. */
    insuranceKicker: "Plans we bill directly",
    /** The visit panel's headline — it names the center's own street. */
    visitHeadline: "Under the oak on Grand Avenue.",
    providersPage: {
        headline: "The midwives.",
        subheadline:
            "Two certified nurse-midwives and a lactation consultant. You meet both midwives in pregnancy, and one of them is with you for the birth.",
    },
    servicesPage: {
        headline: "The care.",
        subheadline:
            "Prenatal visits, birth in the suites, and six weeks of care after — for healthy, low-risk pregnancies, with Ojai Valley Hospital five minutes away.",
        bannerTitle: "See the suites first. Tours are free.",
    },
    newPatientsPage: {
        headline: "Getting started.",
        subheadline: "How to begin care with us, what it costs, and what happens if plans change on the day.",
        kicker: "Before your first visit",
        bannerTitle: "Come see the suites.",
    },
    bookPage: {
        steps: [
            {
                title: "Pick a visit",
                description:
                    "A tour, a consult with the midwives, or a prenatal visit if you're already in care.",
            },
            {
                title: "Choose a time",
                description: "Real openings from each midwife's week, Saturday tours included.",
            },
            {
                title: "Confirm by email",
                description: "Your confirmation carries a one-click cancel link. No portal, no password.",
            },
        ],
    },
}

export const home: CareHome = {
    headline: "Birth, at home in the valley",
    accent: "none",
    subheadline: "",
    credit: undefined,
    directory: { items: [] },
    hero: photo(
        "hero-suite",
        1152,
        864,
        "A birth suite at dusk: clay plaster walls, a low linen bed, a deep stone tub, and a big window on the Topatopa mountains",
    ),
    stack: {
        band: "Three birth suites · Licensed midwives · Five minutes from Ojai Valley Hospital",
        frames: [
            {
                image: photo(
                    "frame-prenatal",
                    1152,
                    864,
                    "A midwife kneeling beside a pregnant woman on a linen daybed, listening with a wooden Pinard horn as they both laugh",
                ),
                caption: "Prenatal care, birth, and six weeks after — with the same two midwives.",
            },
            {
                image: photo(
                    "frame-newborn",
                    1152,
                    864,
                    "New parents in rumpled linen with their newborn, the father laughing softly as the baby holds his finger",
                ),
                caption: "",
            },
        ],
        closing: "Tours on the first Saturday of every month.",
        closingCta: "Book a tour",
    },
}

export const journey: CareJourney = { kicker: "", title: "", steps: [] }

export const promises: CarePromises = { kicker: "", title: "", items: [] }

export const exhibits: CareExhibits = { kicker: "", title: "", items: [], extras: [] }

export const menu: CareMenu = {
    kicker: "Self-pay",
    title: "The birth package.",
    intro: "One price for the whole year of care, if you're paying yourself.",
    groups: [
        {
            heading: "Care",
            items: [
                { name: "Birth package", note: "Prenatal through six weeks", price: "$7,400" },
                { name: "Prenatal care only", note: "Birth elsewhere", price: "$2,900" },
                { name: "Postpartum care only", note: "Home and center visits", price: "$1,200" },
                { name: "Lactation visit", note: "At the center or at home", price: "$160" },
            ],
        },
    ],
    footnote: "Labs, ultrasound, and any hospital care bill separately. Payment plans on request.",
}

export const spotlight: CareSpotlight | null = {
    kicker: "",
    headline: "",
    body: "",
    bullets: [],
    image: photo(
        "story-courtyard",
        1152,
        864,
        "A pregnant woman and her partner walking arm in arm through the adobe courtyard, laughing, as a midwife holds the door open",
    ),
    report: { label: "", title: "", summary: "", rows: [], signature: "", stamp: "" },
}

export const faq: CareFaq = {
    kicker: "Before the tour",
    title: "Things families ask us.",
    items: [
        {
            question: "Who can give birth here?",
            answer: "Healthy people with low-risk pregnancies, one baby, head down, between 37 and 42 weeks. We'll talk through your history at the consult.",
        },
        {
            question: "What if I need the hospital?",
            answer: "Ojai Valley Hospital is five minutes away and we transfer there directly. Your midwife comes with you and stays.",
        },
        {
            question: "Can my family be there?",
            answer: "Yes — partners, parents, older kids, a doula. The suites are big enough, and there's a garden for anyone who needs air.",
        },
        {
            question: "Do you take insurance?",
            answer: "We bill Blue Shield, Anthem, Aetna, Cigna, and Medi-Cal directly. Self-pay families get one package price up front.",
        },
    ],
}

export const story = {
    kicker: "The center",
    headline: "Why a birth center.",
    paragraphs: [
        "Inés and Hanne met on a hospital night shift and kept talking about the births they wished they could offer: slower, quieter, with the same person from the first visit to the last. In 2019 they found an old adobe house under an oak on Grand Avenue.",
        "Now it has three suites, a garden, and a porch where families wait for their visits. Most people who come here give birth here; those who need the hospital go five minutes down the road, with their midwife beside them.",
    ],
    image: photo(
        "story-courtyard",
        1152,
        864,
        "A pregnant woman and her partner walking arm in arm through the adobe courtyard, laughing, as a midwife holds the door open",
    ),
}

export const booking = {
    headline: "Book a tour.",
    intro: "Start with a tour or a consult with the midwives. You'll get an email confirmation with a one-click cancel link — no portal, no password.",
    // The privacy line the visitor reads beside the form. Honest by
    // design: it describes what the form collects, and claims nothing
    // beyond it (never write compliance claims into template copy).
    privacyNote:
        "Booking asks for your name, contact details, and visit type — nothing about your pregnancy. That conversation starts at the visit, with your midwife.",
}
