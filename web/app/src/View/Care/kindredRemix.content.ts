/**
 * The care-therapy-kindred remix's content seed (packs/README.md "Derived
 * templates"): a culturally affirming therapy collective worn over the
 * care pack. At compose time this file is copied byte-for-byte over
 * `View/Care/content.ts`, so it must remain a STRUCTURAL TWIN of that
 * module — the same export surface, the same shapes, the contract's
 * minimums met (tests/View/Care/kindredRemixSeed.test.ts pins the twin).
 *
 * The trade: Kindred Therapy Collective, six therapists in Atlanta's
 * West End offering culturally affirming therapy — individuals, couples,
 * families and teens, grief, and faith-integrated care for clients who
 * want it — in person and online across Georgia. The home page opens on
 * a full-bleed photograph (three of the therapists laughing in the
 * lounge), then three ways in, then the heart of the site: a therapist
 * directory a visitor filters by what they need, and how matching works.
 * The booking surface stays clinically empty — name, contact, visit
 * type, new/returning.
 *
 * Reviews are from clients, published with consent and first names only.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/care-therapy-kindred` (see PACK.md). The art direction
 * is a warm lounge in late afternoon: plum walls, sienna and ochre
 * textiles, lamplight, people mid-laugh rather than posed.
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
        src: `/care-therapy-kindred/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/care-therapy-kindred/${name}-${step}w.webp`, width: step })),
    }
}

export const practice = {
    name: "Kindred Therapy Collective",
    tagline: "Culturally affirming therapy in Atlanta",
    city: "Atlanta, Georgia",
    address: "1030 Ralph David Abernathy Blvd SW, Suite 2, Atlanta, GA 30310",
    phone: "(404) 555-0198",
    email: "hello@kindredtherapy.example",
    mapsQuery: "1030 Ralph David Abernathy Blvd SW Atlanta GA 30310",
}

/**
 * The collective's week: evenings Monday to Thursday (most clients work
 * days), a full Friday, a Saturday morning, Sundays closed. 0 = Sunday …
 * 6 = Saturday; times are minutes since midnight.
 */
export const clinicHours: PracticeHoursEntry[] = [
    { day: 1, open: 9 * 60, close: 20 * 60 },
    { day: 2, open: 9 * 60, close: 20 * 60 },
    { day: 3, open: 9 * 60, close: 20 * 60 },
    { day: 4, open: 9 * 60, close: 20 * 60 },
    { day: 5, open: 9 * 60, close: 17 * 60 },
    { day: 6, open: 10 * 60, close: 14 * 60 },
]

/** Portraits by provider id — the contract carries facts, code carries art. */
export const providerPhotos: Record<string, CareImage> = {
    "aisha-grant": photo(
        "portrait-aisha",
        1024,
        1365,
        "Aisha Grant laughing on a lounge sofa in a plum wrap top, lamplight and a mudcloth pillow behind her",
    ),
    "nia-okoro": photo(
        "portrait-nia",
        1024,
        1365,
        "Nia Okoro smiling over a mug by a window full of plants, in a burnt-orange sweater",
    ),
    "beverly-jackson": photo(
        "portrait-beverly",
        1024,
        1365,
        "Beverly Jackson with silver locs and red glasses, hand on her heart mid-laugh, in a forest-green cardigan",
    ),
    "jamal-williams": photo(
        "portrait-jamal",
        1024,
        1365,
        "Jamal Williams in glasses and a rust overshirt, leaning forward mid-sentence in a leather chair",
    ),
    "imani-baker": photo(
        "portrait-imani",
        1024,
        1365,
        "Imani Baker with long braids and a mustard top, laughing with a notebook open on the table",
    ),
    "kwame-mensah": photo(
        "portrait-kwame",
        1024,
        1365,
        "Kwame Mensah, bald with a gray beard, laughing in a plum sweater beside a bookshelf",
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
            providerId: "aisha-grant",
            name: "Aisha Grant",
            credentials: "LMFT",
            role: "Founder · Couples & individuals",
            tags: "Individual · Couples",
            bio: "Aisha started Kindred after years of clients telling her they'd spent their first sessions elsewhere explaining their lives instead of working on them. She sees couples and individuals, and is trained in emotionally focused and narrative therapy.",
        },
        {
            providerId: "nia-okoro",
            name: "Nia Okoro",
            credentials: "LMFT",
            role: "Families & teens",
            tags: "Families & teens · Couples",
            bio: "Nia works with teenagers and the adults who love them: school stress, identity, blended families, and the silence that sometimes settles over a house. She grew up between Lagos and Decatur and speaks both languages of home.",
        },
        {
            providerId: "beverly-jackson",
            name: "Beverly Jackson",
            credentials: "LCSW",
            role: "Grief · Faith-integrated care",
            tags: "Grief · Faith-integrated · Individual",
            bio: "Beverly has sat with grief for twenty-five years, in hospice, in church basements, and here. For clients who want it, she brings faith into the room; for those who don't, she leaves it at the door.",
        },
        {
            providerId: "jamal-williams",
            name: "Jamal Williams",
            credentials: "LPC",
            role: "Men's mental health · Anxiety",
            tags: "Individual · Takes insurance · Evenings",
            bio: "Jamal works with men who were raised to handle it alone: anxiety, anger, burnout, and fatherhood. Most of his clients have never been to therapy before, and he likes it that way. Evening sessions, in person or online.",
        },
        {
            providerId: "imani-baker",
            name: "Imani Baker",
            credentials: "LPC",
            role: "Young adults · Identity",
            tags: "Individual · Evenings · Takes insurance",
            bio: "Imani sees people in their twenties and early thirties: first jobs, first apartments, racial stress at work, queer identity, and the pressure of being the first in the family to do all of it. She keeps evenings open for clients who can't leave work.",
        },
        {
            providerId: "kwame-mensah",
            name: "Kwame Mensah",
            credentials: "LPC",
            role: "Couples · Faith-integrated care",
            tags: "Couples · Faith-integrated · Takes insurance",
            bio: "Kwame is a former youth pastor turned counselor who sees couples and individuals, with or without faith in the conversation. Premarital work, rebuilding trust, and the long middle of a marriage are his favorite rooms to be in.",
        },
    ],
    services: [
        {
            name: "Individual therapy",
            description:
                "Fifty minutes, weekly or every other week, with a therapist who gets the context of your life.",
        },
        {
            name: "Couples & marriage",
            description:
                "Eighty-minute sessions for partners, premarital or decades in, with or without faith in the room.",
        },
        {
            name: "Families & teens",
            description:
                "Sessions for a teenager, a parent, or the whole household, at a pace the youngest person can keep.",
        },
        {
            name: "Grief & loss",
            description:
                "Support after a death, a diagnosis, or any loss that the people around you don't quite name.",
        },
        {
            name: "Faith-integrated therapy",
            description: "For clients who want their faith in the conversation, and only for them.",
        },
        {
            name: "Online therapy",
            description:
                "Video sessions anywhere in Georgia, with the same therapist you'd see in the lounge.",
        },
    ],
    // The strip says how paying works — no insurer names, no logos.
    insurance: [
        "In network with several major plans",
        "We check your benefits before you book",
        "Sliding scale from $85",
        "HSA & FSA accepted",
        "Superbills for out-of-network benefits",
        "Good Faith Estimate on request",
    ],
    locations: [
        {
            locationId: "west-end",
            label: "The lounge in the West End",
            address: practice.address,
            phone: practice.phone,
            hours: clinicHours,
        },
    ],
    // Owner-curated: quotes from clients, published with consent and
    // initials only — contract data, never runtime review ingestion.
    reviews: [
        {
            quote: "For the first time I didn't spend the first three sessions explaining my family, my church, or my job. Nia already understood, so we just started.",
            name: "D. M.",
            detail: "Individual client",
        },
        {
            quote: "Kwame asked if we wanted faith in the room. Nobody had ever asked us that. We said yes, and it changed how we talked to each other.",
            name: "T. & R.",
            detail: "Couples clients",
        },
        {
            quote: "My son wouldn't talk to anyone. He talks to Nia. Some weeks he talks to me on the drive home, too.",
            name: "K. A.",
            detail: "Parent of a teen client",
        },
    ],
    newPatient: [
        {
            title: "Tell us what matters",
            body: "A short form: what's going on, what kind of therapist you'd feel at home with, faith or no faith, days and times, and how you'd like to pay.",
        },
        {
            title: "A 15-minute matching call",
            body: "Our intake coordinator reads your form, calls you within two business days, and suggests one or two therapists by name.",
        },
        {
            title: "Your first session",
            body: "In the lounge or on video. If the fit isn't right after a session or two, we'll match you again, no explanation needed.",
        },
    ],
}

/**
 * The `appointments` content domain, code fallback — booking mode 2's
 * inputs. Visit types carry the slot length they book; each therapist's
 * weekly windows are packed back-to-back into concrete capacity-1 slots
 * by `generateAppointmentSlots`.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "match",
            name: "Free matching call",
            durationMinutes: 15,
            description: "A short call with our intake coordinator to find the right therapist.",
        },
        {
            typeId: "individual",
            name: "Individual session",
            durationMinutes: 50,
            description: "Fifty minutes in the lounge or on video.",
        },
        {
            typeId: "couples",
            name: "Couples or family session",
            durationMinutes: 80,
            description: "Eighty minutes for partners, or a parent and teen.",
        },
    ],
    providers: [
        {
            providerId: "aisha-grant",
            name: "Aisha Grant",
            windows: [
                { day: 1, start: 12 * 60, end: 20 * 60 },
                { day: 3, start: 12 * 60, end: 20 * 60 },
            ],
        },
        {
            providerId: "nia-okoro",
            name: "Nia Okoro",
            windows: [
                { day: 2, start: 15 * 60, end: 20 * 60 },
                { day: 4, start: 15 * 60, end: 20 * 60 },
                { day: 6, start: 10 * 60, end: 14 * 60 },
            ],
        },
        {
            providerId: "beverly-jackson",
            name: "Beverly Jackson",
            windows: [
                { day: 2, start: 9 * 60, end: 15 * 60 },
                { day: 5, start: 9 * 60, end: 15 * 60 },
            ],
        },
        {
            providerId: "jamal-williams",
            name: "Jamal Williams",
            windows: [
                { day: 1, start: 16 * 60, end: 20 * 60 },
                { day: 4, start: 16 * 60, end: 20 * 60 },
            ],
        },
        {
            providerId: "imani-baker",
            name: "Imani Baker",
            windows: [
                { day: 3, start: 15 * 60, end: 20 * 60 },
                { day: 5, start: 12 * 60, end: 17 * 60 },
            ],
        },
        {
            providerId: "kwame-mensah",
            name: "Kwame Mensah",
            windows: [
                { day: 2, start: 12 * 60, end: 20 * 60 },
                { day: 6, start: 10 * 60, end: 14 * 60 },
            ],
        },
    ],
}

/**
 * Landing copy the practice's discipline owns — the base module's
 * `landingCopy`, retraded for a therapy collective (therapists, services,
 * a matching call).
 */
export const landingCopy = {
    /** The shell's nav labels for the pack's canonical trio of pages. */
    nav: { providers: "Our therapists", services: "Services", newPatients: "Get started" },
    /** The booking ask — the shell CTA and every page's primary CTA. */
    bookCtaLabel: "Find your therapist",
    home: {
        secondaryCtaLabel: "Meet our therapists",
        servicesKicker: "Services",
        servicesHeading: "Ways in",
        providersKicker: "Our therapists",
        providersHeading: "Six therapists, one lounge.",
        reviewsKicker: "In their words",
        bannerTitle: "You don't have to explain everything. Start with a short form.",
    },
    /** The paying-for-therapy strip's kicker, shared by home, services, get started. */
    insuranceKicker: "Fees & insurance",
    /** The visit panel's headline — it names where sessions happen. */
    visitHeadline: "A lounge in the West End, and a screen anywhere in Georgia.",
    providersPage: {
        headline: "Our therapists.",
        subheadline:
            "Six licensed therapists — marriage and family therapists, counselors, and a clinical social worker — who share your context, so you can skip the explaining.",
    },
    servicesPage: {
        headline: "Services.",
        subheadline:
            "Individuals, couples, families and teens, grief, and faith-integrated care for those who want it. In person or online.",
        bannerTitle: "Tell us what matters, and we'll do the matching.",
    },
    newPatientsPage: {
        headline: "Getting started.",
        subheadline:
            "A short form, a 15-minute call with our intake coordinator, and a first session with someone who fits.",
        kicker: "How matching works",
        bannerTitle: "The matching call is free.",
    },
    bookPage: {
        steps: [
            {
                title: "Choose a session",
                description: "A free matching call, an individual session, or a couples or family session.",
            },
            {
                title: "Pick a therapist and time",
                description:
                    "Real openings from all six therapists' weeks, evenings included, up to four weeks out.",
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
    headline: "Therapy that\nsees all of you.",
    accent: "last-line",
    subheadline:
        "Culturally affirming therapy for Black individuals, couples, and families in Atlanta, Georgia.",
    credit: "Licensed in Georgia · In person in the West End & online",
    directory: { items: [] },
    hero: photo(
        "hero",
        2400,
        1350,
        "Three therapists laughing together on a sofa in a warm lounge, textile pillows and a plum and ochre painting behind them",
    ),
}

export const journey: CareJourney = {
    kicker: "How matching works",
    title: "Three steps to the right person.",
    layout: "cards",
    steps: [
        {
            label: undefined,
            title: "Tell us what matters",
            description:
                "Share what's going on, who you'd feel at home with, faith or no faith, and when you're free.",
            image: undefined,
        },
        {
            label: undefined,
            title: "We match you",
            description:
                "Our intake coordinator reads every form and calls you within two business days with one or two names.",
            image: undefined,
        },
        {
            label: undefined,
            title: "Begin",
            description:
                "Your first session, in the lounge or on video. Not the right fit? We'll match you again.",
            image: undefined,
        },
    ],
}

export const promises: CarePromises = {
    kicker: "Services",
    title: "Three ways in.",
    items: [
        {
            icon: "smile",
            title: "Individual therapy",
            description:
                "For anxiety, burnout, identity, and the weight of carrying everyone else. Weekly or every other week.",
        },
        {
            icon: "heart",
            title: "Couples & marriage",
            description:
                "Premarital, newly married, or decades in. Rebuild trust and learn to hear each other again.",
        },
        {
            icon: "users",
            title: "Families & teens",
            description: "For teenagers, parents, and blended households finding their way back to talking.",
        },
    ],
}

export const exhibits: CareExhibits = {
    kicker: "Our therapists",
    title: "Find your therapist.",
    layout: "directory",
    items: [],
    extras: [
        {
            providerId: "aisha-grant",
            description:
                "Couples and individuals. Emotionally focused, warm, and direct. Openings on Monday and Wednesday evenings.",
        },
        {
            providerId: "nia-okoro",
            description:
                "Teenagers and the adults who love them. School stress, identity, blended families. Saturday mornings too.",
        },
        {
            providerId: "beverly-jackson",
            description:
                "Twenty-five years with grief and loss. Faith in the room if you want it, and never if you don't.",
        },
        {
            providerId: "jamal-williams",
            description:
                "Men's mental health: anxiety, anger, burnout, fatherhood. Most of his clients are new to therapy.",
        },
        {
            providerId: "imani-baker",
            description:
                "Young adults: first jobs, racial stress at work, queer identity, being the first in the family.",
        },
        {
            providerId: "kwame-mensah",
            description: "Couples and premarital work, rebuilding trust, and the long middle of a marriage.",
        },
    ],
}

export const menu: CareMenu = {
    kicker: "Fees & insurance",
    title: "We believe access matters.",
    intro: "Several of our therapists are in network with major plans. Our coordinator checks your benefits before your first session, so the price is never a surprise.",
    groups: [
        {
            heading: "Sessions",
            items: [
                { name: "Individual session", note: "50 minutes, in person or online", price: "$150" },
                { name: "Couples or family session", note: "80 minutes", price: "$195" },
                { name: "Matching call", note: "15 minutes, by phone", price: "Free" },
            ],
        },
        {
            heading: "Ways to pay",
            items: [
                {
                    name: "Sliding scale",
                    note: "Limited spots, by household income",
                    price: "$85",
                    qualifier: "from",
                },
                { name: "Insurance", note: "In network with several major plans", price: "Your copay" },
                { name: "HSA & FSA cards", note: "Therapy is a qualified expense", price: "Accepted" },
            ],
        },
    ],
    footnote:
        "You have the right to a Good Faith Estimate of what your care will cost. Ask for one on your matching call.",
}

export const spotlight: CareSpotlight | null = {
    kicker: "",
    headline: "",
    body: "",
    bullets: [],
    image: photo(
        "family",
        1600,
        1200,
        "A mother in a gold head wrap, a father, and their teenage daughter laughing together on a sofa during a family session",
    ),
    report: { label: "", title: "", summary: "", rows: [], signature: "", stamp: "" },
}

export const faq: CareFaq = {
    kicker: "Questions",
    title: "Before you reach out.",
    items: [
        {
            question: "Do I have to be Black to see a therapist here?",
            answer: "No. Everyone is welcome. Our therapists are Black and our work centers Black experience, and anyone who wants that lens is welcome in the lounge.",
        },
        {
            question: "What does faith-integrated mean?",
            answer: "If you want your faith in the conversation, prayer, scripture, and belief can be part of your therapy with Beverly or Kwame. If you don't, it never comes up. You choose on the form.",
        },
        {
            question: "Do you take my insurance?",
            answer: "Several of our therapists are in network with major plans. Tell us your plan on the form and our coordinator will check your benefits before your first session.",
        },
        {
            question: "What if my therapist isn't the right fit?",
            answer: "Say so, to them or to our coordinator, and we'll match you with someone else. You won't have to explain why.",
        },
        {
            question: "Do you see teenagers?",
            answer: "Yes, from thirteen up. Nia works with teens alone and with their families. A parent or guardian signs the consent for anyone under eighteen.",
        },
    ],
}

export const story = {
    kicker: "The collective",
    headline: "Built so no one has to explain themselves first.",
    paragraphs: [
        "Aisha kept hearing the same thing from new clients: they'd spent their first sessions elsewhere teaching a therapist about their family, their church, or what it's like to be the only one at work. Kindred exists so that time goes to the work instead.",
        "We're six therapists in a lounge off Ralph David Abernathy Boulevard, with evening hours and video across Georgia. Faith is welcome if you want it, and so is everything else you bring.",
    ],
    image: photo(
        "family",
        1600,
        1200,
        "A mother in a gold head wrap, a father, and their teenage daughter laughing together on a sofa during a family session",
    ),
}

export const booking = {
    headline: "Find your therapist.",
    intro: "Book a free matching call, or book straight in with a therapist you've chosen. You'll get an email confirmation with a one-click cancel link — no portal, no password.",
    // The privacy line the visitor reads beside the form. Honest by
    // design: it describes what the form collects, and claims nothing
    // beyond it (never write compliance claims into template copy).
    privacyNote:
        "Booking asks for your name, contact details, and session type, and nothing about why you're coming. That conversation is yours to start.",
}
