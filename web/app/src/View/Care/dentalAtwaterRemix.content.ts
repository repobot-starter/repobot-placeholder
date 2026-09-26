/**
 * The care-dental-atwater remix's content seed (packs/README.md "Derived
 * templates"): an orthodontic studio worn over the care pack. At compose
 * time this file is copied byte-for-byte over `View/Care/content.ts`, so it
 * must remain a STRUCTURAL TWIN of that module — the same export surface,
 * the same shapes, the contract's minimums met
 * (tests/View/Care/dentalAtwaterRemixSeed.test.ts pins the twin).
 *
 * The trade: Atwater Orthodontics, a two-orthodontist studio fourteen
 * floors over Oak Street on Chicago's Gold Coast — clear aligners, braces,
 * and early treatment for kids, teens, and adults. The home page leads
 * with the proof: three smiles as before/after pairs (Month 0 against the
 * finished month), then the path from a free consult to retainers as a
 * rail of pictograms, and treatment prices printed plainly. Insurance
 * plans are named as text only, never logos.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/care-dental-atwater` (see PACK.md). The art direction is
 * daylight over Lake Michigan: white terrazzo flecked terracotta and lake
 * blue, pale oak, real laughter. Each before/after pair is one face in one
 * framing — only the teeth move.
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
        src: `/care-dental-atwater/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/care-dental-atwater/${name}-${step}w.webp`, width: step })),
    }
}

export const practice = {
    name: "Atwater Orthodontics",
    tagline: "Orthodontics for kids, teens, and adults on the Gold Coast",
    city: "Gold Coast, Chicago",
    address: "71 East Oak Street, Suite 1400, Chicago, IL 60611",
    phone: "(312) 555-0148",
    email: "hello@atwaterortho.example",
    mapsQuery: "71 East Oak Street Chicago IL 60611",
}

/**
 * The studio's week: early mornings for the before-school crowd, one late
 * evening, and Saturday mornings. Sundays closed. 0 = Sunday … 6 =
 * Saturday; times are minutes since midnight.
 */
export const clinicHours: PracticeHoursEntry[] = [
    { day: 1, open: 7 * 60 + 30, close: 17 * 60 },
    { day: 2, open: 7 * 60 + 30, close: 17 * 60 },
    { day: 3, open: 10 * 60, close: 19 * 60 },
    { day: 4, open: 7 * 60 + 30, close: 17 * 60 },
    { day: 5, open: 7 * 60 + 30, close: 14 * 60 },
    { day: 6, open: 8 * 60, close: 13 * 60 },
]

/** Portraits by provider id — the contract carries facts, code carries art. */
export const providerPhotos: Record<string, CareImage> = {
    "dr-rao": photo(
        "dr-rao",
        1200,
        1600,
        "Dr. Meera Rao in a soft grey sweater, laughing mid-sentence in front of a white terrazzo wall and a window onto the lake",
    ),
    "dr-okoro": photo(
        "dr-okoro",
        1200,
        1600,
        "Dr. Tobi Okoro in a pale blue shirt grinning and holding up a clear aligner beside an oak counter",
    ),
    "kim-coordinator": photo(
        "kim-coordinator",
        1200,
        1600,
        "Hana Kim in a terracotta linen shirt laughing with a tablet in hand by the curved oak front desk",
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
            providerId: "dr-rao",
            name: "Dr. Meera Rao",
            credentials: "DDS, MS",
            role: "Orthodontist · Founder",
            tags: undefined,
            bio: "Meera trained in orthodontics at a university clinic and opened Atwater on Oak Street in 2018 with one rule: every patient sees their plan and their price before anything goes on their teeth. She treats kids from age seven and adults who waited decades to ask.",
        },
        {
            providerId: "dr-okoro",
            name: "Dr. Tobi Okoro",
            credentials: "DMD, MS",
            role: "Orthodontist · Clear aligners",
            tags: undefined,
            bio: "Tobi runs the studio's clear aligner cases and the 3D scanner, and he will happily show you your finished smile on screen before you commit to anything. He sees most of the adult patients and a lot of teenagers who refuse to wear metal.",
        },
        {
            providerId: "kim-coordinator",
            name: "Hana Kim",
            credentials: "",
            role: "Treatment coordinator",
            tags: undefined,
            bio: "Hana is the one who walks you through the plan, the price, and the insurance, and she answers every text. Parents know her as the person who makes the schedule work around school and practice.",
        },
    ],
    services: [
        {
            name: "Clear aligners",
            description:
                "Nearly invisible trays, a 3D preview of your finished smile before you start, and a check-in every eight weeks. For teens and adults.",
        },
        {
            name: "Braces",
            description:
                "Small ceramic or metal brackets, colors optional. Usually 14 to 22 months, with visits that fit before school.",
        },
        {
            name: "Early treatment",
            description:
                "A first look at age seven, and a short phase of treatment only when it heads off a bigger problem later.",
        },
        {
            name: "Adult orthodontics",
            description:
                "It's never too late. Discreet options, evening appointments, and plans that work with crowns and implants.",
        },
        {
            name: "Retainers for life",
            description:
                "Your first set is included. Replacements are printed in-house from your scan, often the same week.",
        },
        {
            name: "Second opinions",
            description:
                "Already in treatment elsewhere, or told you need surgery? Bring your records and we'll give you a straight answer.",
        },
    ],
    // Plans the studio works with, as plain text — never logos.
    insurance: [
        "Delta Dental PPO",
        "MetLife Dental",
        "Cigna Dental PPO",
        "Guardian Dental",
        "Aetna Dental PPO",
        "United Concordia",
        "FSA & HSA cards",
    ],
    locations: [
        {
            locationId: "oak-street",
            label: "Oak Street, 14th floor",
            address: practice.address,
            phone: practice.phone,
            hours: clinicHours,
        },
    ],
    // Owner-curated: real quotes the studio chose to publish — contract
    // data, never runtime review ingestion.
    reviews: [
        {
            quote: "I put off aligners for fifteen years. Dr. Okoro showed me the end result on the first visit, the price was on one page, and fourteen months later it looks exactly like the screen.",
            name: "Elena V.",
            detail: "Clear aligner patient",
        },
        {
            quote: "Our son had braces on at 7:30 in the morning and was at school by nine. Hana scheduled every visit around hockey without being asked.",
            name: "The Brennan family",
            detail: "Braces, age 13",
        },
        {
            quote: "Two other offices said our daughter needed a big treatment. Dr. Rao said wait a year, and she was right. We trust her completely.",
            name: "Aisha M.",
            detail: "Early treatment parent",
        },
        {
            quote: "Best view of the lake I've ever had in a dentist's chair. My retainer broke on a Tuesday and a new one was ready Thursday.",
            name: "Jordan P.",
            detail: "Patient since 2022",
        },
    ],
    newPatient: [
        {
            title: "Book a free consult",
            body: "Forty-five minutes, no charge, no pressure. Bring any x-rays you already have; we take the rest in the studio.",
        },
        {
            title: "A 3D scan, no goop",
            body: "A quick handheld scan replaces the old putty impressions. You'll see your teeth on screen in about two minutes.",
        },
        {
            title: "Your plan and your price",
            body: "You leave with the treatment, the timeline, and the full price on one page, with your insurance share and a 0% monthly plan worked out.",
        },
        {
            title: "Starting treatment",
            body: "Most patients start within two weeks. Aligners arrive at the studio; braces go on in about an hour.",
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
            typeId: "consult",
            name: "Free consult",
            durationMinutes: 45,
            description: "A 3D scan, an exam, and your plan and price — no charge.",
        },
        {
            typeId: "check-in",
            name: "Treatment check-in",
            durationMinutes: 20,
            description: "Your regular adjustment or aligner check, every eight weeks.",
        },
        {
            typeId: "retainer",
            name: "Retainer fitting",
            durationMinutes: 30,
            description: "A new or replacement retainer from your scan.",
        },
    ],
    providers: [
        {
            providerId: "dr-rao",
            name: "Dr. Meera Rao",
            windows: [
                { day: 1, start: 7 * 60 + 30, end: 12 * 60 },
                { day: 3, start: 13 * 60, end: 19 * 60 },
                { day: 6, start: 8 * 60, end: 13 * 60 },
            ],
        },
        {
            providerId: "dr-okoro",
            name: "Dr. Tobi Okoro",
            windows: [
                { day: 2, start: 7 * 60 + 30, end: 12 * 60 },
                { day: 4, start: 12 * 60, end: 17 * 60 },
                { day: 5, start: 7 * 60 + 30, end: 12 * 60 },
            ],
        },
    ],
}

/**
 * Landing copy the practice's discipline owns — the base module's
 * `landingCopy`, retraded for an orthodontic studio.
 */
export const landingCopy = {
    /** The shell's nav labels for the pack's canonical trio of pages. */
    nav: { providers: "About", services: "Treatment", newPatients: "For parents" },
    /** The booking ask — the shell CTA and every page's primary CTA. */
    bookCtaLabel: "Book a free consult",
    home: {
        secondaryCtaLabel: "Meet the orthodontists",
        servicesKicker: "Treatment",
        servicesHeading: "Aligners, braces, and the right time to start.",
        providersKicker: "The studio",
        providersHeading: "Two orthodontists. One page with your price on it.",
        reviewsKicker: "Reviews",
        bannerTitle: "Treatment from $4,900 · 0% monthly plans",
    },
    /** The insurance strip's kicker, shared by home, treatment, for parents. */
    insuranceKicker: "We work with most PPO orthodontic benefits",
    /** The visit panel's headline — it names the practice's own street. */
    visitHeadline: "Oak Street, fourteenth floor, lake side.",
    providersPage: {
        headline: "About the studio.",
        subheadline:
            "Dr. Rao, Dr. Okoro, and Hana — a small orthodontic studio over Oak Street where every plan comes with its price, in writing, on the first visit.",
    },
    servicesPage: {
        headline: "Treatment.",
        subheadline:
            "Clear aligners, braces, early treatment, and retainers for life, planned on a 3D scan and priced before you start.",
        bannerTitle: "The consult is free. So is the second opinion.",
    },
    newPatientsPage: {
        headline: "For parents.",
        subheadline:
            "When to come in, what the free consult covers, how insurance and monthly plans work, and how we schedule around school.",
        kicker: "Your first visit",
        bannerTitle: "First look at age seven. Treatment only if it helps.",
    },
    bookPage: {
        steps: [
            {
                title: "Pick a visit",
                description: "A free consult, a check-in, or a retainer fitting — the length is built in.",
            },
            {
                title: "Choose an orthodontist and time",
                description:
                    "Real openings from each orthodontist's week, 7:30 AM starts and Saturdays included.",
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
    headline: "Straight talk. Straighter smiles.",
    accent: "none",
    subheadline: "Expert orthodontics for kids, teens, and adults on Chicago's Gold Coast.",
    credit: "Oak Street · Gold Coast, Chicago",
    // The facts aside belongs to the split hero; the full-bleed frame keeps
    // the photograph clear, so the list starts empty.
    directory: { items: [] },
    hero: photo(
        "hero-lake-studio",
        2400,
        1350,
        "A mother and her teenage daughter laughing together at the curved oak front desk of a bright orthodontic studio, floor-to-ceiling windows onto Lake Michigan and a white terrazzo floor",
    ),
    progress: {
        kicker: "Smile progress",
        title: "Real results. Every smile.",
        items: [
            {
                caption: "Clear aligners · Age 34",
                beforeLabel: "Month 0",
                afterLabel: "Month 14",
                before: photo(
                    "aligners-before",
                    1600,
                    1200,
                    "A woman's smile before treatment, her lower front teeth crowded and one upper canine turned",
                ),
                after: photo(
                    "aligners-after",
                    1600,
                    1200,
                    "The same smile after fourteen months of clear aligners, the teeth evenly aligned in a smooth arch",
                ),
            },
            {
                caption: "Braces · Age 13",
                beforeLabel: "Month 0",
                afterLabel: "Month 18",
                before: photo(
                    "braces-before",
                    1600,
                    1200,
                    "A teenage boy's grin before braces, a gap between his upper front teeth and uneven lower teeth",
                ),
                after: photo(
                    "braces-after",
                    1600,
                    1200,
                    "The same grin the day his braces came off, the gap closed and both arches straight",
                ),
            },
            {
                caption: "Early treatment · Age 8",
                beforeLabel: "Month 0",
                afterLabel: "Month 10",
                before: photo(
                    "early-before",
                    1600,
                    1200,
                    "A freckled girl's smile before early treatment, her narrow upper arch crowding the new front teeth",
                ),
                after: photo(
                    "early-after",
                    1600,
                    1200,
                    "The same girl ten months later, her upper arch wider and the front teeth sitting evenly in line",
                ),
            },
        ],
    },
    journey: {
        steps: [
            { title: "Free consult", description: "Forty-five minutes, no charge.", icon: "users" },
            { title: "3D scan", description: "Two minutes, no putty.", icon: "layers" },
            { title: "Your plan and price", description: "On one page, before you start.", icon: "check" },
            { title: "Every 8 weeks", description: "A twenty-minute check-in.", icon: "calendar" },
            { title: "Retainers", description: "Your first set is included.", icon: "shield" },
        ],
    },
}

export const journey: CareJourney = { kicker: "", title: "", steps: [] }

export const promises: CarePromises = { kicker: "", title: "", items: [] }

export const exhibits: CareExhibits = { kicker: "", title: "", items: [], extras: [] }

export const menu: CareMenu = {
    kicker: "Treatment prices",
    title: "The whole price, up front.",
    intro: "Every plan is priced on the first visit and includes your retainers. We bill your orthodontic benefits and spread the rest over 0% monthly payments.",
    groups: [
        {
            heading: "Treatment",
            items: [
                { name: "Clear aligners", note: "Retainers included", price: "$4,900", qualifier: "from" },
                { name: "Braces", note: "Ceramic or metal", price: "$5,400", qualifier: "from" },
                {
                    name: "Early treatment",
                    note: "Phase one, ages 7 to 10",
                    price: "$2,900",
                    qualifier: "from",
                },
            ],
        },
        {
            heading: "Visits & retainers",
            items: [
                { name: "Consult & 3D scan", note: "With your plan and price", price: "Free" },
                { name: "Second opinion", note: "Bring your records", price: "Free" },
                { name: "Replacement retainer", note: "Printed from your scan", price: "$225" },
            ],
        },
    ],
    footnote:
        "0% monthly plans from $189 a month. Prices are for this studio and can change; your written plan is the final word.",
}

export const spotlight: CareSpotlight | null = {
    kicker: "The first visit",
    headline: "See the finished smile before you start.",
    body: "A handheld scanner maps your teeth in about two minutes, and the finished result comes up on screen while you're still in the chair. You leave with the plan, the timeline, and the full price on one page.",
    bullets: [
        "No putty impressions, ever",
        "Your insurance share worked out on the spot",
        "0% monthly plans, no credit check",
    ],
    image: photo(
        "scan-bay",
        1600,
        1200,
        "A teenage girl in a navy sweatshirt laughing in an oak treatment chair while the coordinator holds a 3D scanner, her teeth on the screen and the lake in the window",
    ),
    cta: { label: "See treatment options", path: "/what-we-treat" },
    report: { label: "", title: "", summary: "", rows: [], signature: "", stamp: "" },
}

export const faq: CareFaq = {
    kicker: "Questions",
    title: "Straight answers.",
    items: [
        {
            question: "When should my child first see an orthodontist?",
            answer: "Around age seven. Most kids don't need treatment yet — we check how the jaw and adult teeth are coming in and tell you whether to wait. The visit is free.",
        },
        {
            question: "Aligners or braces?",
            answer: "Both move teeth well. Aligners suit most adults and disciplined teens; braces handle complex bites and kids who'd lose a tray. We'll show you both plans on your scan.",
        },
        {
            question: "Does insurance cover orthodontics?",
            answer: "Many PPO plans carry a lifetime orthodontic benefit, often $1,500 to $2,500. We check it before your consult ends and bill it for you. FSA and HSA cards work too.",
        },
        {
            question: "How often are the visits?",
            answer: "About every eight weeks, and most take twenty minutes. Mornings start at 7:30, Wednesdays run until seven, and Saturdays are open.",
        },
    ],
}

export const story = {
    kicker: "The studio",
    headline: "Fourteen floors up, with the lake in every chair.",
    paragraphs: [
        "Meera opened Atwater on Oak Street in 2018 after years of watching families get a price only after the brackets went on. Here, the plan and the whole price come first, on one page, at a free consult.",
        "The studio is terrazzo, pale oak, and a wall of windows onto Lake Michigan. Mornings start at 7:30 so kids make first period, and nobody waits more than ten minutes.",
    ],
    image: photo(
        "lounge",
        1600,
        1200,
        "A dad in a camel coat and his son in a green hoodie laughing over a phone on a curved oak bench, terrazzo underfoot and Lake Michigan filling the windows",
    ),
}

export const booking = {
    headline: "Book a free consult.",
    intro: "Pick a visit, an orthodontist, and a time — 7:30 AM starts and Saturdays included. You'll get an email confirmation with a one-click cancel link, no portal password.",
    // The privacy line the visitor reads beside the form. Honest by
    // design: it describes what the form collects, and claims nothing
    // beyond it (never write compliance claims into template copy).
    privacyNote:
        "Booking asks for your name, contact details, and visit type — nothing about your teeth or your health. We'll ask about that at the consult.",
}
