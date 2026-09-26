/**
 * The care-dental-fernfinch remix's content seed (packs/README.md "Derived
 * templates"): a pediatric dental office worn over the care pack. At
 * compose time this file is copied byte-for-byte over `View/Care/content.ts`,
 * so it must remain a STRUCTURAL TWIN of that module — the same export
 * surface, the same shapes, the contract's minimums met
 * (tests/View/Care/dentalFernfinchRemixSeed.test.ts pins the twin).
 *
 * The trade: Fern & Finch Pediatric Dentistry, a two-dentist kids' office
 * built like a treehouse on South Lamar in Austin — first visits from age
 * one, cleanings, sealants, gentle fillings, and sedation when it helps.
 * The home page tells the first visit as a picture book: five illustrated
 * pages, from saying hi to Finch at the front desk to the prize tree on
 * the way out, then the three facts parents ask first. Insurance plans
 * are named as text only, never logos.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/care-dental-fernfinch` (see PACK.md). Photographs are warm
 * daylight through arched windows onto live oaks, pale wood and leaf-green
 * upholstery, real giggles; the storybook pages are gouache on paper
 * white, leaf green and marigold, with Finch the goldfinch in each.
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
        src: `/care-dental-fernfinch/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/care-dental-fernfinch/${name}-${step}w.webp`, width: step })),
    }
}

export const practice = {
    name: "Fern & Finch Pediatric Dentistry",
    tagline: "A treehouse dental office for kids in South Austin",
    city: "South Austin",
    address: "2208 South Lamar Boulevard, Austin, TX 78704",
    phone: "(512) 555-0193",
    email: "hello@fernandfinch.example",
    mapsQuery: "2208 South Lamar Boulevard Austin TX 78704",
}

/**
 * The office's week: early starts so kids make school, a short Friday,
 * and Saturday mornings for the families who can't miss work. Sundays
 * closed. 0 = Sunday … 6 = Saturday; times are minutes since midnight.
 */
export const clinicHours: PracticeHoursEntry[] = [
    { day: 1, open: 7 * 60 + 30, close: 17 * 60 },
    { day: 2, open: 7 * 60 + 30, close: 17 * 60 },
    { day: 3, open: 7 * 60 + 30, close: 17 * 60 },
    { day: 4, open: 9 * 60, close: 18 * 60 },
    { day: 5, open: 7 * 60 + 30, close: 15 * 60 },
    { day: 6, open: 8 * 60, close: 12 * 60 },
]

/** Portraits by provider id — the contract carries facts, code carries art. */
export const providerPhotos: Record<string, CareImage> = {
    "dr-alvarez": photo(
        "dr-alvarez",
        1200,
        1600,
        "Dr. Lucía Alvarez in sage scrubs laughing as she high-fives a small patient under the arched treehouse windows",
    ),
    "dr-bennett": photo(
        "dr-bennett",
        1200,
        1600,
        "Dr. Marcus Bennett in marigold scrubs and round glasses cracking up while a yellow goldfinch hand puppet sings on his hand",
    ),
    "hygienist-tran": photo(
        "hygienist-tran",
        1200,
        1600,
        "Mai Tran in a leaf-print scrub top laughing with a kid's toothbrush in hand among the office's hanging plants",
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
            providerId: "dr-alvarez",
            name: "Dr. Lucía Alvarez",
            credentials: "DDS",
            role: "Pediatric dentist · Founder",
            tags: undefined,
            bio: "Lucía trained in pediatric dentistry at a children's hospital and built Fern & Finch so the first dental visit would feel like a story instead of a test. She sees babies from their first tooth and has a gift for the kid who is sure they won't open their mouth.",
        },
        {
            providerId: "dr-bennett",
            name: "Dr. Marcus Bennett",
            credentials: "DMD",
            role: "Pediatric dentist",
            tags: undefined,
            bio: "Marcus handles the office's sedation visits and most of the teenagers, and he is the voice of Finch the puppet. Parents of anxious kids ask for him by name.",
        },
        {
            providerId: "hygienist-tran",
            name: "Mai Tran",
            credentials: "RDH",
            role: "Dental hygienist",
            tags: undefined,
            bio: "Mai does the counting, the tickly polish, and the sealants, and she keeps a running list of every kid's favorite flavor. She has never met a toddler she couldn't get to say 'ahh'.",
        },
    ],
    services: [
        {
            name: "First visits",
            description:
                "From the first tooth to age three: a lap exam with you, a gentle clean, and a picture-book tour of the office.",
        },
        {
            name: "Checkups & cleanings",
            description:
                "Every six months, with x-rays only when they're due. Kids pick the polish flavor and the sunglasses.",
        },
        {
            name: "Sealants & fluoride",
            description:
                "A clear coat on the back teeth and a quick varnish — the two easiest ways to skip fillings later.",
        },
        {
            name: "Gentle fillings",
            description:
                "Tooth-colored fillings, a numbing gel before anything else, and laughing gas when a kid wants it.",
        },
        {
            name: "Sedation options",
            description:
                "Laughing gas in the chair, and a quiet room with a longer visit for kids who need more time.",
        },
        {
            name: "Emergencies",
            description:
                "Knocked-out tooth, a fall at the park, a sudden toothache — call and we'll see you the same day.",
        },
    ],
    // Plans the office works with, as plain text — never logos.
    insurance: [
        "Delta Dental PPO",
        "MetLife Dental",
        "Cigna Dental PPO",
        "Guardian Dental",
        "United Concordia",
        "Texas Medicaid & CHIP",
        "FSA & HSA cards",
    ],
    locations: [
        {
            locationId: "south-lamar",
            label: "South Lamar",
            address: practice.address,
            phone: practice.phone,
            hours: clinicHours,
        },
    ],
    // Owner-curated: real quotes the office chose to publish — contract
    // data, never runtime review ingestion.
    reviews: [
        {
            quote: "My four-year-old asked when she gets to go back to the treehouse. She rode the chair up and down twice and counted her own teeth.",
            name: "Priya S.",
            detail: "Mom of Anika, 4",
        },
        {
            quote: "Our son had a filling with laughing gas and came out giggling about Finch. Dr. Bennett explained every step to him first, not just to me.",
            name: "Tomás R.",
            detail: "Dad of Mateo, 7",
        },
        {
            quote: "They took Medicaid without a single weird look, and the front desk sorted the paperwork while my twins picked prizes.",
            name: "Keisha W.",
            detail: "Mom of twins, 6",
        },
        {
            quote: "Our daughter used to cry in the parking lot. Mai let her hold the mirror and do the counting. Now she books her own reminders.",
            name: "The Harper family",
            detail: "Patients since kindergarten",
        },
    ],
    newPatient: [
        {
            title: "Book a first visit",
            body: "Pick a time online or call. Most first visits take forty-five minutes, and the youngest kids sit on your lap.",
        },
        {
            title: "Read the story at home",
            body: "We'll email the picture book of the first visit, so the chair and the counting are old friends by the time you arrive.",
        },
        {
            title: "The tour and the counting",
            body: "Your child meets Finch, rides the chair, and counts their teeth with the hygienist before anything else happens.",
        },
        {
            title: "A plan for the grown-ups",
            body: "You leave with what we saw, what to watch, and any prices in writing — plus a prize from the treehouse for the patient.",
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
            typeId: "first-visit",
            name: "First visit",
            durationMinutes: 45,
            description: "The tour, the counting, a gentle clean, and a plan for the grown-ups.",
        },
        {
            typeId: "checkup",
            name: "Checkup & cleaning",
            durationMinutes: 40,
            description: "The six-month visit, with x-rays only when they're due.",
        },
        {
            typeId: "emergency",
            name: "Emergency visit",
            durationMinutes: 30,
            description: "A same-day look at a toothache, a chip, or a fall.",
        },
    ],
    providers: [
        {
            providerId: "dr-alvarez",
            name: "Dr. Lucía Alvarez",
            windows: [
                { day: 1, start: 7 * 60 + 30, end: 12 * 60 },
                { day: 3, start: 12 * 60, end: 17 * 60 },
                { day: 6, start: 8 * 60, end: 12 * 60 },
            ],
        },
        {
            providerId: "dr-bennett",
            name: "Dr. Marcus Bennett",
            windows: [
                { day: 2, start: 7 * 60 + 30, end: 12 * 60 },
                { day: 4, start: 13 * 60, end: 18 * 60 },
                { day: 5, start: 7 * 60 + 30, end: 12 * 60 },
            ],
        },
    ],
}

/**
 * Landing copy the practice's discipline owns — the base module's
 * `landingCopy`, retold for a kids' dental office.
 */
export const landingCopy = {
    /** The shell's nav labels for the pack's canonical trio of pages. */
    nav: { providers: "Our team", services: "Care", newPatients: "First visit" },
    /** The booking ask — the shell CTA and every page's primary CTA. */
    bookCtaLabel: "Book a first visit",
    home: {
        secondaryCtaLabel: "Meet the team",
        servicesKicker: "Care",
        servicesHeading: "Everything a growing smile needs.",
        providersKicker: "Our team",
        providersHeading: "Two kids' dentists and a hygienist who does the voices.",
        reviewsKicker: "From parents",
        bannerTitle: "Ready for page one?",
    },
    /** The insurance strip's kicker, shared by home, care, first visit. */
    insuranceKicker: "Most insurance, plus Texas Medicaid and CHIP",
    /** The visit panel's headline — it names the practice's own street. */
    visitHeadline: "South Lamar, under the big live oak.",
    providersPage: {
        headline: "Our team.",
        subheadline:
            "Dr. Alvarez, Dr. Bennett, and Mai — a small kids' office on South Lamar where nothing happens in the chair until your child says go.",
    },
    servicesPage: {
        headline: "Care for ages 1 to 18.",
        subheadline:
            "First visits, checkups, sealants, gentle fillings, sedation when it helps, and same-day emergencies, all in the treehouse.",
        bannerTitle: "Questions before you book? Call and ask for Mai.",
    },
    newPatientsPage: {
        headline: "The first visit.",
        subheadline:
            "When to come in, what happens in the chair, how insurance and Medicaid work, and how to get a nervous kid through the door.",
        kicker: "Your first visit",
        bannerTitle: "First tooth, first visit. We'll take it from there.",
    },
    bookPage: {
        steps: [
            {
                title: "Pick a visit",
                description: "A first visit, a checkup, or an emergency — the length is built in.",
            },
            {
                title: "Choose a dentist and time",
                description:
                    "Real openings from each dentist's week, 7:30 AM starts and Saturday mornings included.",
            },
            {
                title: "Confirm by email",
                description:
                    "Your confirmation carries a one-click cancel link and the picture book to read at home.",
            },
        ],
    },
}

export const home: CareHome = {
    layout: "full-bleed",
    headline: "Brave little smiles start here.",
    accent: "none",
    subheadline: "Gentle, playful dentistry for ages 1 to 18, in a treehouse office in South Austin.",
    credit: "South Lamar · Austin, Texas",
    // The facts aside belongs to the split hero; the full-bleed frame keeps
    // the photograph clear, so the list starts empty.
    directory: { items: [] },
    hero: photo(
        "hero-treehouse",
        2400,
        1350,
        "A laughing boy in a leaf-print bib in a sage green dental chair while a smiling dentist in a white coat counts his teeth, under arched wooden windows onto live oaks and a painted ceiling of birds",
    ),
    journey: {
        kicker: "The first visit",
        title: "Your first visit, told like a story.",
        steps: [
            {
                label: "1",
                title: "Say hi to Finch at the front desk",
                description: "Our goldfinch hands out the very first sticker.",
                image: photo(
                    "page-hello",
                    1024,
                    1365,
                    "A gouache storybook page: Finch the goldfinch perched on a wooden front desk beside a potted fern and a little heart sign",
                ),
            },
            {
                label: "2",
                title: "Ride the chair up and down",
                description: "Kids push the button. Twice is the rule.",
                image: photo(
                    "page-chair",
                    1024,
                    1365,
                    "A gouache storybook page: a giggling girl in overalls throws her arms up in a green dental chair as Finch flutters overhead",
                ),
            },
            {
                label: "3",
                title: "Count your teeth together",
                description: "Twenty baby teeth, counted out loud.",
                image: photo(
                    "page-count",
                    1024,
                    1365,
                    "A gouache storybook page: Finch on a wooden stool beside a tidy row of little white teeth, marigolds all around",
                ),
            },
            {
                label: "4",
                title: "A tickly toothbrush polish",
                description: "Bubblegum or mint, your pick.",
                image: photo(
                    "page-tickle",
                    1024,
                    1365,
                    "A gouache storybook page: Finch carrying a toothbrush over a smiling cartoon tooth in a cloud of soap bubbles",
                ),
            },
            {
                label: "5",
                title: "Pick a prize from the treehouse",
                description: "Every patient climbs the prize tree.",
                image: photo(
                    "page-prize",
                    1024,
                    1365,
                    "A gouache storybook page: a boy in a striped shirt reaching into a little treehouse full of prizes in a tree, Finch on the roof",
                ),
            },
        ],
    },
}

export const journey: CareJourney = { kicker: "", title: "", steps: [] }

export const promises: CarePromises = {
    kicker: "",
    title: "",
    items: [
        { icon: "smile", title: "Ages 1 to 18", description: "From the first tooth to the first car." },
        {
            icon: "shield",
            title: "Most insurance and Medicaid",
            description: "Texas Medicaid and CHIP welcome.",
        },
        { icon: "heart", title: "Sedation options", description: "Laughing gas and a quiet room." },
    ],
}

export const exhibits: CareExhibits = { kicker: "", title: "", items: [], extras: [] }

export const menu: CareMenu = {
    kicker: "Self-pay prices",
    title: "The price, before the polish.",
    intro: "For families paying without insurance. With insurance or Medicaid, we check your coverage before the visit and tell you your share.",
    groups: [
        {
            heading: "Visits",
            items: [
                { name: "First visit", note: "Under three, on your lap", price: "$95" },
                { name: "Checkup & cleaning", note: "X-rays when due", price: "$129" },
                { name: "Emergency visit", note: "Same day", price: "$89" },
            ],
        },
        {
            heading: "Treatments",
            items: [
                { name: "Sealants", note: "Per tooth", price: "$45" },
                { name: "Tooth-colored filling", note: "One surface", price: "$165", qualifier: "from" },
                { name: "Laughing gas", note: "Per visit", price: "$55" },
            ],
        },
    ],
    footnote: "Prices are for this office and can change; your written estimate is the final word.",
}

export const spotlight: CareSpotlight | null = {
    kicker: "Nervous kids welcome",
    headline: "We go at the speed of the bravest part of your kid.",
    body: "Every first visit starts with a tour and a hand mirror. Nothing happens in the chair until your child says go — and if today is only for counting teeth, that counts as a win.",
    bullets: [
        "Tell, show, then do — every single step",
        "Parents stay in the room",
        "Laughing gas and quiet rooms when they help",
    ],
    image: photo(
        "mirror-giggle",
        1600,
        1200,
        "A hygienist in sage scrubs holds up a hand mirror as a giggling five-year-old in a marigold T-shirt points at her own teeth from a leaf-print dental chair",
    ),
    cta: { label: "See our care", path: "/what-we-treat" },
    report: { label: "", title: "", summary: "", rows: [], signature: "", stamp: "" },
}

export const faq: CareFaq = {
    kicker: "Questions",
    title: "What parents ask first.",
    items: [
        {
            question: "When should my child first see a dentist?",
            answer: "By their first birthday, or within six months of the first tooth. The first visit is short, happens on your lap, and is mostly about getting to know us.",
        },
        {
            question: "Do you take Medicaid?",
            answer: "Yes — Texas Medicaid and CHIP, plus most PPO plans. We check coverage before the visit so there are no surprises at the desk.",
        },
        {
            question: "Can I stay with my child?",
            answer: "Always. Parents are welcome in the room for every visit. Some older kids like to go solo, and that's fine too.",
        },
        {
            question: "What if my child is really scared?",
            answer: "Tell us when you book. We'll plan a longer visit in the quiet room, send the picture book ahead, and go one page at a time. Laughing gas is there if it helps.",
        },
    ],
}

export const story = {
    kicker: "Our office",
    headline: "A treehouse on South Lamar.",
    paragraphs: [
        "Lucía opened Fern & Finch after years of meeting kids who had learned to dread the dentist before they turned five. Here, the first visit is a story they already know by heart.",
        "The office is pale wood, arched windows onto the live oaks, a reading nook, and a prize tree. Mornings start at 7:30 so kids make first bell, and Saturdays are open.",
    ],
    image: photo(
        "reading-nook",
        1600,
        1200,
        "Two kids curled up with picture books in a curved oak reading nook while a mom laughs on the bench beside them, plants and arched windows all around",
    ),
}

export const booking = {
    headline: "Book a first visit.",
    intro: "Pick a visit, a dentist, and a time — 7:30 AM starts and Saturday mornings included. You'll get an email confirmation with a one-click cancel link and the picture book to read together.",
    // The privacy line the visitor reads beside the form. Honest by
    // design: it describes what the form collects, and claims nothing
    // beyond it (never write compliance claims into template copy).
    privacyNote:
        "Booking asks for your name, your child's first name, contact details, and visit type — nothing about health history. We'll ask about that at the visit.",
}
