/**
 * The care-obgyn-clearwater remix's content seed (packs/README.md "Derived
 * templates"): a fertility clinic worn over the care pack. At compose time
 * this file is copied byte-for-byte over `View/Care/content.ts`, so it
 * must remain a STRUCTURAL TWIN of that module — the same export surface,
 * the same shapes, the contract's minimums met
 * (tests/View/Care/clearwaterRemixSeed.test.ts pins the twin).
 *
 * The trade: Clearwater Fertility, a reproductive endocrinology practice
 * in San Francisco — two physicians and a nurse coordinator. The home is
 * the `stack` home (`home.stack`): the couple in the fog under the
 * headline, then the numbers as a report (live-birth rates by age band,
 * `home.stack.report`), and the prices over the consultation ask.
 * Providers, what we offer, coverage, and booking keep the base pack's
 * pages, and the booking surface stays clinically empty — name, contact,
 * visit type, new/returning.
 *
 * The rates are DEMO CONTENT: invented figures in the shape a clinic
 * reports to SART, shipped with the report's `note` set to say so. An
 * owner replaces the rows with their own published rates and clears the
 * note — never publish sample outcomes as a clinic's own.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/care-obgyn-clearwater` (see PACK.md). The art direction
 * is pale morning fog, white rooms, dusty rose and plum, people mid-laugh;
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
        src: `/care-obgyn-clearwater/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/care-obgyn-clearwater/${name}-${step}w.webp`, width: step })),
    }
}

export const practice = {
    name: "Clearwater Fertility",
    tagline: "Fertility care in San Francisco",
    city: "San Francisco, California",
    address: "2340 Clay Street, Suite 400, San Francisco, CA 94115",
    phone: "(415) 555-0132",
    email: "hello@clearwaterfertility.example",
    mapsQuery: "2340 Clay Street San Francisco CA 94115",
}

/**
 * The clinic's week: early mornings for monitoring visits, consultations
 * into the afternoon, and a short Saturday for monitoring. Sundays
 * closed. 0 = Sunday … 6 = Saturday; times are minutes since midnight.
 */
export const clinicHours: PracticeHoursEntry[] = [
    { day: 1, open: 7 * 60, close: 16 * 60 },
    { day: 2, open: 7 * 60, close: 16 * 60 },
    { day: 3, open: 7 * 60, close: 16 * 60 },
    { day: 4, open: 7 * 60, close: 16 * 60 },
    { day: 5, open: 7 * 60, close: 15 * 60 },
    { day: 6, open: 7 * 60, close: 11 * 60 },
]

/** Portraits by provider id — the contract carries facts, code carries art. */
export const providerPhotos: Record<string, CareImage> = {
    "rao-md": photo(
        "portrait-rao",
        864,
        1152,
        "Dr. Meera Rao in a grey sweater by a window onto the fog, laughing with a paper chart in hand",
    ),
    "moreno-md": photo(
        "portrait-moreno",
        864,
        1152,
        "Dr. Daniel Moreno in a navy sweater, laughing as he turns in a white hallway with a tablet under his arm",
    ),
    "lin-rn": photo(
        "portrait-lin",
        864,
        1152,
        "Grace Lin in rose scrubs and a white cardigan, laughing on a phone call by the window",
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
            providerId: "rao-md",
            name: "Meera Rao",
            credentials: "MD",
            role: "Reproductive endocrinologist · Medical director",
            tags: undefined,
            bio: "Dr. Rao trained at UCSF and opened Clearwater in 2016 to run a clinic that tells patients the odds plainly. She sees every new patient at least once, and she will draw your timeline on paper until it makes sense.",
        },
        {
            providerId: "moreno-md",
            name: "Daniel Moreno",
            credentials: "MD",
            role: "Reproductive endocrinologist",
            tags: undefined,
            bio: "Dr. Moreno leads the egg-freezing and donor programs and works with many LGBTQ+ families building through donors and gestational carriers. He's bilingual in English and Spanish and answers his own messages.",
        },
        {
            providerId: "lin-rn",
            name: "Grace Lin",
            credentials: "RN",
            role: "Nurse coordinator",
            tags: undefined,
            bio: "Grace is the person you'll talk to most: medication calendars, monitoring times, the 6 a.m. question. She has coordinated more than two thousand cycles and still celebrates every call with good news.",
        },
    ],
    services: [
        {
            name: "Fertility consultation",
            description:
                "An hour with a physician: your history, your tests, and a plain account of your options and odds — including doing nothing yet.",
        },
        {
            name: "IVF",
            description:
                "Stimulation, retrieval, and transfer, with monitoring before work and a nurse coordinator who knows your calendar.",
        },
        {
            name: "Egg freezing",
            description:
                "One or two cycles, with a straight answer about how many eggs you're likely to need at your age.",
        },
        {
            name: "IUI",
            description:
                "A simpler first step for some couples and single parents, with or without medication.",
        },
        {
            name: "Fertility testing",
            description:
                "Bloodwork, ultrasound, and semen analysis in one morning, with results explained at a follow-up — not in a portal.",
        },
        {
            name: "Donor & carrier programs",
            description:
                "Egg and sperm donors and gestational carriers, for LGBTQ+ families, single parents, and anyone who needs them.",
        },
    ],
    // Plans and fertility benefits the clinic bills directly; self-pay
    // patients get the cycle price in writing before they start.
    insurance: [
        "Progyny",
        "Carrot Fertility",
        "Aetna",
        "Blue Shield of California",
        "Cigna",
        "UnitedHealthcare",
    ],
    locations: [
        {
            locationId: "clay-street",
            label: "Clay Street",
            address: practice.address,
            phone: practice.phone,
            hours: clinicHours,
        },
    ],
    // Owner-curated: quotes from former patients, published with their
    // consent — contract data, never runtime review ingestion.
    reviews: [
        {
            quote: "Dr. Rao showed us the real numbers at the first visit, and then she showed us what would change them. We knew exactly what we were choosing.",
            name: "Ana & Chris P.",
            detail: "IVF, 2025",
        },
        {
            quote: "Grace texted me back at 6:10 in the morning about a dose. That's the whole review.",
            name: "Jordan M.",
            detail: "Egg freezing, 2026",
        },
        {
            quote: "Dr. Moreno never once made us feel like an exception. Two dads, one donor, one carrier, one very loud daughter.",
            name: "Sam & Eli T.",
            detail: "Donor and carrier program, 2025",
        },
    ],
    newPatient: [
        {
            title: "Book a consultation",
            body: "Most people see a physician within a week. Bring any old test results; we'll order what's missing.",
        },
        {
            title: "Testing in one morning",
            body: "Bloodwork, ultrasound, and a semen analysis if it applies, all before ten.",
        },
        {
            title: "A plan and a price",
            body: "At your follow-up you get a written plan, your odds as we see them, and the cost with and without your benefits.",
        },
        {
            title: "Your coordinator",
            body: "From then on, Grace or one of her team is your first call for everything.",
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
            typeId: "consultation",
            name: "New-patient consultation",
            durationMinutes: 60,
            description: "An hour with a physician, in person or by video.",
        },
        {
            typeId: "intro-call",
            name: "Free intro call",
            durationMinutes: 15,
            description: "Fifteen minutes with a nurse coordinator to ask anything first.",
        },
        {
            typeId: "follow-up",
            name: "Follow-up",
            durationMinutes: 30,
            description: "Results, your plan, and next steps with your physician.",
        },
    ],
    providers: [
        {
            providerId: "rao-md",
            name: "Dr. Meera Rao",
            windows: [
                { day: 1, start: 10 * 60, end: 15 * 60 },
                { day: 3, start: 10 * 60, end: 15 * 60 },
            ],
        },
        {
            providerId: "moreno-md",
            name: "Dr. Daniel Moreno",
            windows: [
                { day: 2, start: 10 * 60, end: 15 * 60 },
                { day: 4, start: 10 * 60, end: 15 * 60 },
            ],
        },
        {
            providerId: "lin-rn",
            name: "Grace Lin, RN",
            windows: [
                { day: 1, start: 9 * 60, end: 12 * 60 },
                { day: 5, start: 9 * 60, end: 13 * 60 },
            ],
        },
    ],
}

/**
 * Landing copy the practice's discipline owns — the base module's
 * `landingCopy`, retraded for a fertility clinic.
 */
export const landingCopy = {
    /** The shell's nav labels for the pack's canonical trio of pages. */
    nav: { providers: "Our team", services: "Treatments", newPatients: "Getting started" },
    /** The booking ask — the shell CTA and every page's primary CTA. */
    bookCtaLabel: "Book a consultation",
    home: {
        secondaryCtaLabel: "Meet the team",
        servicesKicker: "Treatments",
        servicesHeading: "What we do",
        providersKicker: "The team",
        providersHeading: "Two physicians, one coordinator, your whole cycle.",
        reviewsKicker: "From former patients",
        bannerTitle: "Most patients see a doctor within a week.",
    },
    /** The coverage strip's kicker, shared by treatments and getting started. */
    insuranceKicker: "Benefits and plans we bill",
    /** The visit panel's headline — it names the clinic's own street. */
    visitHeadline: "On Clay Street, in Pacific Heights.",
    providersPage: {
        headline: "Our team.",
        subheadline:
            "Two reproductive endocrinologists and a nurse coordinator. You'll know every name on your chart.",
    },
    servicesPage: {
        headline: "Treatments.",
        subheadline:
            "From a first consultation to IVF, egg freezing, and donor and carrier programs — each with its price in writing before you start.",
        bannerTitle: "Start with an hour and a straight answer.",
    },
    newPatientsPage: {
        headline: "Getting started.",
        subheadline:
            "What the first two weeks look like, what we test, and how you'll get your plan and your price.",
        kicker: "Before your first visit",
        bannerTitle: "Book a consultation. Most people are seen within a week.",
    },
    bookPage: {
        steps: [
            {
                title: "Pick a visit",
                description:
                    "A consultation, a free intro call with a nurse, or a follow-up if you're already a patient.",
            },
            {
                title: "Choose a time",
                description: "Real openings from each clinician's week, in person or by video.",
            },
            {
                title: "Confirm by email",
                description: "Your confirmation carries a one-click cancel link. No portal, no password.",
            },
        ],
    },
}

export const home: CareHome = {
    headline: "The honest path to a family.",
    accent: "none",
    subheadline: "",
    credit: undefined,
    directory: { items: [] },
    hero: photo(
        "hero-fog",
        1152,
        864,
        "A couple from behind on a weathered bench among wildflowers, her head on his shoulder, San Francisco dissolving into fog below",
    ),
    stack: {
        band: "",
        frames: [],
        report: {
            kicker: "The numbers, honestly",
            intro: "Live-birth rates per egg retrieval, by age. Reported to SART.",
            rows: [
                { label: "Under 35", value: "52%" },
                { label: "35–37", value: "39%" },
                { label: "38–40", value: "24%" },
                { label: "Over 40", value: "8%" },
            ],
            footnote: "Updated every year, including the years we'd rather not.",
            note: "Sample data — replace with your clinic's reported rates",
        },
        closing: "IVF from $16,900 · Egg freezing from $9,400 · Most patients see a doctor within a week",
        closingCta: "Book a consultation",
    },
}

export const journey: CareJourney = { kicker: "", title: "", steps: [] }

export const promises: CarePromises = { kicker: "", title: "", items: [] }

export const exhibits: CareExhibits = { kicker: "", title: "", items: [], extras: [] }

export const menu: CareMenu = {
    kicker: "Prices",
    title: "What it costs.",
    intro: "Self-pay prices, before any benefits. You get yours in writing before you start.",
    groups: [
        {
            heading: "Treatment",
            items: [
                { name: "IVF cycle", note: "Monitoring, retrieval, transfer", price: "$16,900" },
                { name: "Egg freezing", note: "One cycle, first year of storage", price: "$9,400" },
                { name: "IUI", note: "Per cycle", price: "$1,100" },
                { name: "Consultation", note: "An hour with a physician", price: "$350" },
            ],
        },
    ],
    footnote:
        "Medications are billed by the pharmacy and vary by protocol. Payment plans and multi-cycle packages on request.",
}

export const spotlight: CareSpotlight | null = {
    kicker: "",
    headline: "",
    body: "",
    bullets: [],
    image: photo(
        "story-consult",
        1152,
        864,
        "A physician sketching a timeline on paper for a couple at a pale oak table by a foggy window, all three laughing",
    ),
    report: { label: "", title: "", summary: "", rows: [], signature: "", stamp: "" },
}

export const faq: CareFaq = {
    kicker: "Before the consultation",
    title: "Things people ask us.",
    items: [
        {
            question: "Do I need a referral?",
            answer: "No. Book directly; if your plan needs one, we'll ask your doctor for it.",
        },
        {
            question: "How long until I can start?",
            answer: "Most people see a physician within a week and have a plan within three. Treatment starts on your next cycle, or when you're ready.",
        },
        {
            question: "Do you work with LGBTQ+ families and single parents?",
            answer: "Yes — donors, carriers, reciprocal IVF, and single-parent plans are a big part of what we do.",
        },
        {
            question: "Where do your numbers come from?",
            answer: "Clinics report every cycle to SART, the national registry, and we publish ours by age band every year — good years and bad.",
        },
    ],
}

export const story = {
    kicker: "The clinic",
    headline: "Why honest.",
    paragraphs: [
        "Dr. Rao opened Clearwater after years of watching patients choose treatments without the numbers. So we start every plan with your odds as we see them — what they are now, and what would change them.",
        "We're a small practice on Clay Street: two physicians, a nurse team that picks up the phone, and a monitoring room that opens at seven so you can make it to work.",
    ],
    image: photo(
        "story-consult",
        1152,
        864,
        "A physician sketching a timeline on paper for a couple at a pale oak table by a foggy window, all three laughing",
    ),
}

export const booking = {
    headline: "Book a consultation.",
    intro: "Start with an hour with a physician or a free call with a nurse. You'll get an email confirmation with a one-click cancel link — no portal, no password.",
    // The privacy line the visitor reads beside the form. Honest by
    // design: it describes what the form collects, and claims nothing
    // beyond it (never write compliance claims into template copy).
    privacyNote:
        "Booking asks for your name, contact details, and visit type — nothing about your history. That conversation starts at the visit, with your physician.",
}
