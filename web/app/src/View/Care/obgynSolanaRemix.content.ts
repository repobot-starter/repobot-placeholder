/**
 * The care-obgyn-solana remix's content seed (packs/README.md "Derived
 * templates"): a women's health practice worn over the care pack. At
 * compose time this file is copied byte-for-byte over `View/Care/content.ts`,
 * so it must remain a STRUCTURAL TWIN of that module — the same export
 * surface, the same shapes, the contract's minimums met
 * (tests/View/Care/obgynSolanaRemixSeed.test.ts pins the twin).
 *
 * The trade: Solana Women's Health, a four-physician OB/GYN practice on
 * Ocean Avenue in Santa Monica — annual care, fertility, pregnancy and
 * delivery, postpartum, and midlife. The home page walks the five
 * chapters as stage cards under arched photographs, then the physicians
 * as round medallions. Insurance plans are named as text only, never
 * logos.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/care-obgyn-solana` (see PACK.md). Photographs are soft
 * coastal daylight in sand, sea glass and terracotta rooms over the
 * Pacific, with real laughter in every frame.
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
        src: `/care-obgyn-solana/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/care-obgyn-solana/${name}-${step}w.webp`, width: step })),
    }
}

export const practice = {
    name: "Solana Women's Health",
    tagline: "OB/GYN care for every chapter, on the Santa Monica coast",
    city: "Santa Monica",
    address: "2120 Ocean Avenue, Suite 300, Santa Monica, CA 90405",
    phone: "(310) 555-0148",
    email: "care@solanawomenshealth.example",
    mapsQuery: "2120 Ocean Avenue Santa Monica CA 90405",
}

/**
 * The practice's week: early starts for the before-work appointment, one
 * late evening, and a Saturday morning for prenatal visits. Sundays
 * closed. 0 = Sunday … 6 = Saturday; times are minutes since midnight.
 */
export const clinicHours: PracticeHoursEntry[] = [
    { day: 1, open: 8 * 60, close: 17 * 60 },
    { day: 2, open: 8 * 60, close: 17 * 60 },
    { day: 3, open: 8 * 60, close: 19 * 60 },
    { day: 4, open: 8 * 60, close: 17 * 60 },
    { day: 5, open: 8 * 60, close: 16 * 60 },
    { day: 6, open: 9 * 60, close: 13 * 60 },
]

/** Portraits by provider id — the contract carries facts, code carries art. */
export const providerPhotos: Record<string, CareImage> = {
    "dr-patel": photo(
        "dr-patel",
        1024,
        1024,
        "Dr. Alisha Patel in a white coat over a sage blouse laughing in a sunlit office with palms and the ocean behind her",
    ),
    "dr-anderson": photo(
        "dr-anderson",
        1024,
        1024,
        "Dr. Claire Anderson with loose blond waves laughing warmly in a white coat by a bright window",
    ),
    "dr-ellison": photo(
        "dr-ellison",
        1024,
        1024,
        "Dr. Maya Ellison in a white coat over a terracotta top laughing mid-story with one hand raised, palms outside",
    ),
    "dr-reyes": photo(
        "dr-reyes",
        1024,
        1024,
        "Dr. Sophia Reyes with long dark hair laughing in a white coat over navy scrubs in a daylight exam suite",
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
            providerId: "dr-patel",
            name: "Alisha Patel, MD",
            credentials: "FACOG",
            role: "Gynecology & wellness",
            tags: undefined,
            bio: "Alisha founded Solana after a decade of fifteen-minute visits at a big hospital group. She sees annual care, contraception and the hard conversations, and keeps an hour free every week for the patients who need more time.",
        },
        {
            providerId: "dr-anderson",
            name: "Claire Anderson, MD",
            credentials: "FACOG",
            role: "Obstetrics & fertility",
            tags: undefined,
            bio: "Claire runs the practice's fertility consults and preconception planning and delivers most of the babies who started with her. She draws everything on the whiteboard, twice.",
        },
        {
            providerId: "dr-ellison",
            name: "Maya Ellison, MD",
            credentials: "FACOG",
            role: "Obstetrics & midlife health",
            tags: undefined,
            bio: "Maya splits her week between prenatal care and perimenopause, and is certified in menopause medicine. Patients say she is the first doctor who explained their symptoms instead of listing them.",
        },
        {
            providerId: "dr-reyes",
            name: "Sophia Reyes, MD",
            credentials: "FACOG",
            role: "Gynecology & minimally invasive surgery",
            tags: undefined,
            bio: "Sophia handles the practice's procedures, from IUDs to laparoscopic surgery, and sees endometriosis and fibroid care. She sees patients in English and Spanish.",
        },
    ],
    services: [
        {
            name: "Annual care",
            description:
                "Well-woman exams, screenings, contraception and the questions you've been saving, in a visit that isn't rushed.",
        },
        {
            name: "Fertility",
            description:
                "Preconception counseling, ovarian reserve testing, and egg-freezing consults, with a plan you can read.",
        },
        {
            name: "Pregnancy & birth",
            description:
                "Prenatal care from the first heartbeat, your birth plan in writing, and delivery with a physician you know.",
        },
        {
            name: "Postpartum",
            description:
                "Fourth-trimester visits, lactation support and mental health screening, for as long as the recovery takes.",
        },
        {
            name: "Midlife & menopause",
            description:
                "Perimenopause, hormone therapy and bone health, with a physician certified in menopause medicine.",
        },
        {
            name: "Gynecologic surgery",
            description:
                "IUD placement, fibroid and endometriosis care, and minimally invasive surgery with a short recovery.",
        },
    ],
    // Plans the practice works with, as plain text — never logos.
    insurance: [
        "Aetna PPO",
        "Anthem Blue Cross PPO",
        "Blue Shield of California PPO",
        "Cigna PPO",
        "UnitedHealthcare PPO",
        "Health Net PPO",
        "FSA & HSA cards",
    ],
    locations: [
        {
            locationId: "ocean-avenue",
            label: "Ocean Avenue",
            address: practice.address,
            phone: practice.phone,
            hours: clinicHours,
        },
    ],
    // Owner-curated: real quotes the practice chose to publish — contract
    // data, never runtime review ingestion.
    reviews: [
        {
            quote: "Dr. Anderson walked me through egg freezing on a whiteboard, twice, and never once looked at the clock. Two years later she delivered my daughter.",
            name: "Renata M.",
            detail: "Fertility, then pregnancy",
        },
        {
            quote: "I went in for hot flashes and left with an actual plan. Dr. Ellison is the first doctor who explained what was happening instead of shrugging.",
            name: "Denise K.",
            detail: "Midlife care",
        },
        {
            quote: "My postpartum visits felt like someone was checking on me, not just my stitches. They caught my anxiety early and got me help that week.",
            name: "Hana T.",
            detail: "Postpartum",
        },
        {
            quote: "Same-week appointment, a real conversation, and a view of the ocean from the exam room. I've stopped dreading my annual.",
            name: "Jess O.",
            detail: "Patient since 2021",
        },
    ],
    newPatient: [
        {
            title: "Book online or call",
            body: "Pick a physician and a time. New patients usually see someone the same week.",
        },
        {
            title: "Send your records",
            body: "We'll email a short health history and request your past records for you, so the visit starts with a conversation.",
        },
        {
            title: "A longer first visit",
            body: "Your first appointment is forty-five minutes: your history, your questions, and an exam only if you want one that day.",
        },
        {
            title: "A plan in writing",
            body: "You leave with what we found, what's next, and any costs spelled out, plus a direct line to your care team.",
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
            durationMinutes: 45,
            description: "Your history, your questions, and an exam if you want one.",
        },
        {
            typeId: "annual-exam",
            name: "Annual exam",
            durationMinutes: 30,
            description: "The well-woman visit, screenings and contraception.",
        },
        {
            typeId: "prenatal",
            name: "Prenatal visit",
            durationMinutes: 30,
            description: "Heartbeat, measurements, and the week's questions.",
        },
    ],
    providers: [
        {
            providerId: "dr-patel",
            name: "Alisha Patel, MD",
            windows: [
                { day: 1, start: 8 * 60, end: 12 * 60 },
                { day: 3, start: 13 * 60, end: 19 * 60 },
            ],
        },
        {
            providerId: "dr-anderson",
            name: "Claire Anderson, MD",
            windows: [
                { day: 2, start: 8 * 60, end: 12 * 60 },
                { day: 4, start: 13 * 60, end: 17 * 60 },
                { day: 6, start: 9 * 60, end: 13 * 60 },
            ],
        },
        {
            providerId: "dr-ellison",
            name: "Maya Ellison, MD",
            windows: [
                { day: 1, start: 13 * 60, end: 17 * 60 },
                { day: 5, start: 8 * 60, end: 12 * 60 },
            ],
        },
    ],
}

/**
 * Landing copy the practice's discipline owns — the base module's
 * `landingCopy`, retold for a women's health practice.
 */
export const landingCopy = {
    /** The shell's nav labels for the pack's canonical trio of pages. */
    nav: { providers: "Physicians", services: "Care", newPatients: "New patients" },
    /** The booking ask — the shell CTA and every page's primary CTA. */
    bookCtaLabel: "Book an appointment",
    home: {
        secondaryCtaLabel: "Meet our physicians",
        servicesKicker: "Care",
        servicesHeading: "Care for every chapter.",
        providersKicker: "Our physicians",
        providersHeading: "Meet our physicians.",
        reviewsKicker: "From our patients",
        bannerTitle: "Whatever chapter you're in, we're here for it.",
    },
    /** The insurance strip's kicker, shared by home, care, new patients. */
    insuranceKicker: "Most PPO plans · Same-week appointments",
    /** The visit panel's headline — it names the practice's own street. */
    visitHeadline: "Ocean Avenue, a block from the bluffs.",
    providersPage: {
        headline: "Our physicians.",
        subheadline:
            "Four board-certified OB/GYNs who each keep a small panel, so the physician you meet is the one who follows you through.",
    },
    servicesPage: {
        headline: "Care for every chapter.",
        subheadline:
            "Annual care, fertility, pregnancy and birth, postpartum, midlife and surgery, under one roof above the ocean.",
        bannerTitle: "Not sure which visit you need? Call and we'll book the right one.",
    },
    newPatientsPage: {
        headline: "New patients.",
        subheadline:
            "How to book, what to bring, how insurance and self-pay work, and what happens at a first visit that isn't rushed.",
        kicker: "Your first visit",
        bannerTitle: "Same-week appointments for new patients.",
    },
    bookPage: {
        steps: [
            {
                title: "Pick a visit",
                description:
                    "A new patient visit, an annual exam, or a prenatal visit — the length is built in.",
            },
            {
                title: "Choose a physician and time",
                description:
                    "Real openings from each physician's week, early mornings and a Wednesday evening included.",
            },
            {
                title: "Confirm by email",
                description:
                    "Your confirmation carries a one-click cancel link and the short health history to fill in.",
            },
        ],
    },
}

export const home: CareHome = {
    layout: "full-bleed",
    headline: "Care for every chapter.",
    accent: "none",
    subheadline: "OB/GYN care rooted in listening, science, and you.",
    credit: "Santa Monica, California",
    // The facts aside belongs to the split hero; the full-bleed frame keeps
    // the photograph clear, so the list starts empty.
    directory: { items: [] },
    hero: photo(
        "hero-ocean-suite",
        2400,
        1350,
        "A laughing pregnant woman in a sand linen dress on a curved cream sofa beside her smiling OB in a camel suit, palms and the Pacific through tall windows",
    ),
}

export const journey: CareJourney = { kicker: "", title: "", steps: [] }

export const promises: CarePromises = { kicker: "", title: "", items: [] }

export const exhibits: CareExhibits = {
    kicker: "Every stage",
    title: "Lifelong care, just for you.",
    items: [
        {
            title: "Annual care",
            meta: "",
            description: "The yearly visit, unhurried.",
            icon: "sprig",
            points: ["Well-woman exams", "Contraception", "Preventive screening"],
            image: photo(
                "stage-annual",
                1024,
                1365,
                "A young woman in a green cardigan laughing on an exam bench by a window onto palms and the sea",
            ),
        },
        {
            title: "Fertility",
            meta: "",
            description: "A plan you can read.",
            icon: "flower",
            points: ["Preconception counseling", "Egg-freezing consults", "Ovarian reserve testing"],
            image: photo(
                "stage-fertility",
                1024,
                1365,
                "Two women laughing together on a sofa, one holding a mug of tea, in a sunny room with a window onto palms",
            ),
        },
        {
            title: "Pregnancy",
            meta: "",
            description: "From heartbeat to birth day.",
            icon: "sun",
            points: ["Prenatal care", "Delivery at the Marisol Pavilion", "Your birth plan, in writing"],
            image: photo(
                "stage-pregnancy",
                1024,
                1365,
                "A pregnant woman in a white sundress laughing with her hands on her bump by a tall window onto the ocean",
            ),
        },
        {
            title: "Postpartum",
            meta: "",
            description: "The fourth trimester, cared for.",
            icon: "waves",
            points: ["Fourth-trimester visits", "Lactation support", "Mental health screening"],
            image: photo(
                "stage-postpartum",
                1024,
                1365,
                "A new mother in a cream sweater laughing as she cradles her sleeping newborn in soft window light",
            ),
        },
        {
            title: "Midlife",
            meta: "",
            description: "Perimenopause and beyond.",
            icon: "moon",
            points: ["Perimenopause & menopause", "Hormone & symptom care", "Bone health"],
            image: photo(
                "stage-midlife",
                1024,
                1365,
                "A woman with silver hair laughing on a palm-lined bluff path above the ocean, a water bottle in hand",
            ),
        },
    ],
    extras: [],
}

export const menu: CareMenu = {
    kicker: "Self-pay",
    title: "Clear prices, with or without insurance.",
    intro: "For patients paying directly. With a PPO plan, we check your benefits before the visit and tell you your share.",
    groups: [
        {
            heading: "Visits",
            items: [
                { name: "New patient visit", note: "Forty-five minutes", price: "$295" },
                { name: "Annual well-woman exam", note: "Screenings included", price: "$245" },
                { name: "Telehealth follow-up", note: "Twenty minutes", price: "$95" },
            ],
        },
        {
            heading: "Consults & procedures",
            items: [
                { name: "Fertility consult", note: "With a written plan", price: "$325" },
                { name: "Menopause consult", note: "Labs extra", price: "$295" },
                { name: "IUD placement", note: "Device extra", price: "$450", qualifier: "from" },
            ],
        },
    ],
    footnote: "Prices are for this practice and can change; your written estimate is the final word.",
}

export const spotlight: CareSpotlight | null = {
    kicker: "Pregnancy",
    headline: "Hear the heartbeat with the physician who'll be there on the day.",
    body: "Each physician keeps a small panel, so the voice at your first prenatal visit is the one in the delivery room. Births happen at the Marisol Pavilion, ten minutes up the coast.",
    bullets: [
        "One physician from first visit to delivery",
        "Your birth plan, written together",
        "Postpartum visits for as long as you need",
    ],
    image: photo(
        "heartbeat-suite",
        1600,
        1200,
        "A pregnant woman laughing in a sea-glass exam chair as her OB listens to the heartbeat and her partner leans in grinning, palms and the ocean outside",
    ),
    cta: { label: "See our care", path: "/what-we-treat" },
    report: { label: "", title: "", summary: "", rows: [], signature: "", stamp: "" },
}

export const faq: CareFaq = {
    kicker: "Questions",
    title: "What new patients ask first.",
    items: [
        {
            question: "How soon can I be seen?",
            answer: "New patients usually see a physician the same week. For pregnancy, call as soon as you have a positive test and we'll book your first prenatal visit around eight weeks.",
        },
        {
            question: "Which insurance do you take?",
            answer: "Most PPO plans, including Aetna, Anthem Blue Cross, Blue Shield of California, Cigna, UnitedHealthcare and Health Net. We check your benefits before the visit and tell you your share.",
        },
        {
            question: "Where do you deliver?",
            answer: "At the Marisol Pavilion, ten minutes up the coast. Your physician, or one of the four of us you've met, is there for the birth.",
        },
        {
            question: "Can I see the same physician every time?",
            answer: "Yes. Each of us keeps a small panel on purpose, so you see the same physician for annual care, pregnancy and beyond.",
        },
    ],
}

export const story = {
    kicker: "Our practice",
    headline: "An ocean-view practice, on purpose.",
    paragraphs: [
        "Alisha opened Solana so a gynecology visit could feel like a conversation instead of a conveyor belt. Four physicians, small panels, and appointments long enough to ask the question you almost didn't.",
        "The practice sits on the third floor above Ocean Avenue: sand walls, sea-glass chairs, and windows onto the palms. Mornings start at eight and Wednesdays run late.",
    ],
    image: photo(
        "lounge-front-desk",
        1600,
        1200,
        "A young woman in a denim jacket laughing with the receptionist across a curved oak front desk while another patient reads on a cream sofa by windows onto palms and the sea",
    ),
}

export const booking = {
    headline: "Book an appointment.",
    intro: "Pick a visit, a physician, and a time — early mornings and a Wednesday evening included. You'll get an email confirmation with a one-click cancel link.",
    // The privacy line the visitor reads beside the form. Honest by
    // design: it describes what the form collects, and claims nothing
    // beyond it (never write compliance claims into template copy).
    privacyNote:
        "Booking asks for your name, contact details, and visit type — nothing about your health history. We'll ask about that privately before the visit.",
}
