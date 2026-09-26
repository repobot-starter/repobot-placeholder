/**
 * The care-therapy-opentrail remix's content seed (packs/README.md "Derived
 * templates"): a walk-and-talk counseling practice worn over the care
 * pack. At compose time this file is copied byte-for-byte over
 * `View/Care/content.ts`, so it must remain a STRUCTURAL TWIN of that
 * module — the same export surface, the same shapes, the contract's
 * minimums met (tests/View/Care/opentrailRemixSeed.test.ts pins the twin).
 *
 * The trade: Open Trail Counseling, three therapists in Boulder, Colorado
 * who hold most sessions walking — individuals, couples, and families,
 * with telehealth when the trail ices over. The home page opens on a
 * full-bleed photograph (two people mid-conversation on a trail toward
 * the Flatirons), then three ways to meet, then the therapists' field
 * notes: short essays, each with its own pencil trail map. The booking
 * surface stays clinically empty — name, contact, visit type,
 * new/returning.
 *
 * Reviews are from clients, published with consent and first names only.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/care-therapy-opentrail` (see PACK.md). The art direction
 * is the Front Range in daylight: aspen gold, pine, granite, people
 * walking side by side and actually talking.
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
        src: `/care-therapy-opentrail/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/care-therapy-opentrail/${name}-${step}w.webp`, width: step })),
    }
}

export const practice = {
    name: "Open Trail Counseling",
    tagline: "Walk-and-talk counseling in Boulder",
    city: "Boulder, Colorado",
    address: "1740 Pearl Street, Suite 3, Boulder, CO 80302",
    phone: "(303) 555-0187",
    email: "hello@opentrailcounseling.example",
    mapsQuery: "1740 Pearl Street Boulder CO 80302",
}

/**
 * The practice's week: early starts (the light is best before work),
 * evening walks Monday to Thursday, a short Friday, a Saturday morning,
 * Sundays closed. 0 = Sunday … 6 = Saturday; times are minutes since
 * midnight.
 */
export const clinicHours: PracticeHoursEntry[] = [
    { day: 1, open: 7 * 60, close: 19 * 60 },
    { day: 2, open: 7 * 60, close: 19 * 60 },
    { day: 3, open: 7 * 60, close: 19 * 60 },
    { day: 4, open: 7 * 60, close: 19 * 60 },
    { day: 5, open: 7 * 60, close: 14 * 60 },
    { day: 6, open: 8 * 60, close: 12 * 60 },
]

/** Portraits by provider id — the contract carries facts, code carries art. */
export const providerPhotos: Record<string, CareImage> = {
    "hannah-albright": photo(
        "portrait-albright",
        1024,
        1365,
        "Hannah Albright laughing on an aspen trail in a sage fleece vest, a daypack over one shoulder",
    ),
    "marcus-whitfield": photo(
        "portrait-whitfield",
        1024,
        1365,
        "Marcus Whitfield mid-sentence on a granite boulder, in a rust canvas jacket under ponderosa pines",
    ),
    "priya-raman": photo(
        "portrait-raman",
        1024,
        1365,
        "Priya Raman in a mustard beanie and a forest-green jacket, smiling back over her shoulder among golden aspens",
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
            providerId: "hannah-albright",
            name: "Hannah Albright",
            credentials: "LPC",
            role: "Founder · Individual therapy",
            tags: undefined,
            bio: "Hannah spent eight years in a downtown office before she noticed that her clients' best sessions happened on the walk to the parking lot. She started Open Trail to hold every session there. She works with anxiety, burnout, grief, and big life changes, and she knows every bench on the Mesa Trail.",
        },
        {
            providerId: "marcus-whitfield",
            name: "Marcus Whitfield",
            credentials: "LMFT",
            role: "Couples & family therapy",
            tags: undefined,
            bio: "Marcus is a marriage and family therapist trained in emotionally focused therapy. He walks with couples, co-parents, and parents with teenagers, and says the trail does half his job: it's hard to stay in a standoff when you're both watching your footing.",
        },
        {
            providerId: "priya-raman",
            name: "Priya Raman",
            credentials: "LPC",
            role: "Young adults · Telehealth lead",
            tags: undefined,
            bio: "Priya works with college students and people in their twenties and thirties: first jobs, first heartbreaks, identity, and the anxiety that comes with all of it. She runs the practice's winter plan and holds most of the video sessions when the snow comes in.",
        },
    ],
    services: [
        {
            name: "Walk-and-talk therapy",
            description:
                "Fifty minutes on an easy, mostly flat trail at a conversational pace. We stop whenever you want to.",
        },
        {
            name: "Couples on the trail",
            description:
                "Eighty-minute walks for partners, side by side, with a bench or two for the harder parts.",
        },
        {
            name: "Parents & teens",
            description: "Family sessions for a parent and a teenager who talk better when they're moving.",
        },
        {
            name: "Telehealth",
            description:
                "Video sessions from anywhere in Colorado, for snow days, travel weeks, or whenever you'd rather stay in.",
        },
        {
            name: "Office sessions",
            description:
                "A warm room on Pearl Street, for days when you want four walls and a door that closes.",
        },
        {
            name: "Grief walks",
            description: "A slower pace and a longer loop for the months after a loss. Silence is allowed.",
        },
    ],
    // The strip says how paying works — no insurer names, no logos.
    insurance: [
        "Superbills for out-of-network benefits",
        "HSA & FSA accepted",
        "Sliding-scale spots every season",
        "Good Faith Estimate on request",
        "Card or bank transfer",
        "No fee for weather cancellations",
    ],
    locations: [
        {
            locationId: "pearl-street",
            label: "The room on Pearl Street",
            address: practice.address,
            phone: practice.phone,
            hours: clinicHours,
        },
    ],
    // Owner-curated: quotes from clients, published with consent and first
    // names only — contract data, never runtime review ingestion.
    reviews: [
        {
            quote: "I'd tried therapy twice and sat frozen on a couch both times. Walking beside Hannah, I said more in the first twenty minutes than I had in a year.",
            name: "Sam",
            detail: "Individual client",
        },
        {
            quote: "We couldn't have a conversation at our kitchen table without it turning into a fight. On the trail with Marcus, we actually listened to each other.",
            name: "Alex & Jordan",
            detail: "Couples clients",
        },
        {
            quote: "Priya switched us to video the morning of the first big storm, and my session happened right on time. I didn't lose a week.",
            name: "Leah",
            detail: "Individual client",
        },
    ],
    newPatient: [
        {
            title: "A free 15-minute call",
            body: "Tell us a little about what's going on and what you're hoping for. We'll suggest the therapist who fits and answer any question about fees or the trail.",
        },
        {
            title: "Your first walk",
            body: "We meet at the trailhead with a short intake on your phone first. Wear shoes you can walk in and bring water. The pace is a stroll, not a hike.",
        },
        {
            title: "A plan for the season",
            body: "Weekly or every other week, on the trail, in the room, or by video. You can switch between them any week.",
        },
        {
            title: "Snow days",
            body: "If the weather turns, you'll get a text by 7 a.m. with the plan: a lower trail, the room on Pearl Street, or video at the same time.",
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
            typeId: "consult",
            name: "Free 15-minute call",
            durationMinutes: 15,
            description: "A short phone call to see whether we're the right fit.",
        },
        {
            typeId: "walk",
            name: "Walk-and-talk session",
            durationMinutes: 50,
            description: "Fifty minutes on the trail, in the room, or by video.",
        },
        {
            typeId: "couples",
            name: "Couples walk",
            durationMinutes: 80,
            description: "Eighty minutes for partners or a parent and teen.",
        },
    ],
    providers: [
        {
            providerId: "hannah-albright",
            name: "Hannah Albright",
            windows: [
                { day: 1, start: 7 * 60, end: 12 * 60 },
                { day: 3, start: 7 * 60, end: 12 * 60 },
                { day: 6, start: 8 * 60, end: 12 * 60 },
            ],
        },
        {
            providerId: "marcus-whitfield",
            name: "Marcus Whitfield",
            windows: [
                { day: 2, start: 13 * 60, end: 19 * 60 },
                { day: 4, start: 13 * 60, end: 19 * 60 },
            ],
        },
        {
            providerId: "priya-raman",
            name: "Priya Raman",
            windows: [
                { day: 2, start: 7 * 60, end: 12 * 60 },
                { day: 5, start: 7 * 60, end: 14 * 60 },
            ],
        },
    ],
}

/**
 * Landing copy the practice's discipline owns — the base module's
 * `landingCopy`, retraded for counseling on foot (therapists, an
 * approach, a first walk).
 */
export const landingCopy = {
    /** The shell's nav labels for the pack's canonical trio of pages. */
    nav: { providers: "Therapists", services: "Approach", newPatients: "Begin" },
    /** The booking ask — the shell CTA and every page's primary CTA. */
    bookCtaLabel: "Book a free 15-minute call",
    home: {
        secondaryCtaLabel: "Meet the therapists",
        servicesKicker: "Approach",
        servicesHeading: "How we work",
        providersKicker: "Therapists",
        providersHeading: "Three therapists, one trailhead.",
        reviewsKicker: "From the trail",
        bannerTitle: "Start with a free 15-minute call.",
    },
    /** The paying-for-therapy strip's kicker, shared by home, approach, begin. */
    insuranceKicker: "Paying for therapy",
    /** The visit panel's headline — it names where sessions start. */
    visitHeadline: "Rain, shine, or snow, we start on Pearl Street.",
    providersPage: {
        headline: "The therapists.",
        subheadline:
            "Two licensed professional counselors and a marriage and family therapist, all of whom would rather be outside.",
    },
    servicesPage: {
        headline: "How we work.",
        subheadline:
            "Most sessions happen walking. Some happen in a room or on a screen. You choose, and you can change your mind any week.",
        bannerTitle: "Walk with us this season.",
    },
    newPatientsPage: {
        headline: "Beginning.",
        subheadline:
            "A free call, a short intake, and your first walk. We'll meet you at the trailhead in good shoes.",
        kicker: "Your first month",
        bannerTitle: "The first call is free, and it's short.",
    },
    bookPage: {
        steps: [
            {
                title: "Choose a session",
                description: "A free 15-minute call, a walk-and-talk session, or a couples walk.",
            },
            {
                title: "Pick a therapist and time",
                description:
                    "Real openings from Hannah's, Marcus's, and Priya's weeks, up to four weeks out.",
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
    headline: "Some conversations\ngo better outside.",
    accent: "none",
    subheadline:
        "Walk-and-talk and nature-based counseling for individuals, couples, and families in Boulder, Colorado.",
    credit: "LPC · LMFT · Boulder, CO · Sliding scale available",
    directory: { items: [] },
    hero: photo(
        "hero",
        2400,
        1350,
        "Two people laughing mid-conversation on a dirt trail through golden grass and aspens, the Flatirons lit by late sun behind them",
    ),
}

export const journey: CareJourney = { kicker: "", title: "", steps: [] }

export const promises: CarePromises = {
    kicker: "Approach",
    title: "Three ways to meet.",
    items: [
        {
            icon: "map-pin",
            title: "Walk-and-talk therapy",
            description:
                "Fifty minutes on an easy trail at a conversational pace. Side by side, with fewer eyes on you and more room to think.",
        },
        {
            icon: "heart",
            title: "Couples & family",
            description:
                "Walking together changes how people talk. We walk with partners, co-parents, and parents with teenagers.",
        },
        {
            icon: "message",
            title: "Telehealth when it snows",
            description:
                "When the trail ices over or you'd rather stay in, we meet by video at the same time, with the same therapist.",
        },
    ],
}

export const exhibits: CareExhibits = {
    kicker: "Field notes",
    title: "Short essays from the trail.",
    layout: "notes",
    items: [
        {
            title: "Why walking makes it easier to talk.",
            meta: "Hannah Albright, LPC",
            description:
                "Sitting across from someone, every pause feels like a spotlight. Walking, you look at the path instead of each other, your breathing slows to match your steps, and the hard sentence tends to arrive on its own, usually about twenty minutes in.",
            image: photo(
                "walking",
                1600,
                1200,
                "A therapist and a client in conversation on a creekside trail under golden aspens",
            ),
        },
        {
            title: "What happens when it snows.",
            meta: "Priya Raman, LPC",
            description:
                "Boulder gets about eighty inches a year, and we don't cancel for it. In light snow we walk the lower trails in good boots. For ice or wind we move to the room or to video. Either way, you'll have a text by 7 a.m.",
            image: photo(
                "snow-walk",
                1600,
                1200,
                "Priya Raman in a mustard beanie laughing as a client in a red scarf talks with his hands on a snowy trail below the Flatirons",
            ),
        },
        {
            title: "Couples on the trail.",
            meta: "Marcus Whitfield, LMFT",
            description:
                "When partners walk side by side, their shoulders line up and the conversation softens. We take a longer loop with a bench halfway, for the part of the story that needs you both to stop.",
            image: photo(
                "couples",
                1600,
                1200,
                "Two partners walking arm in arm and laughing with their therapist on an aspen trail below the foothills",
            ),
        },
        {
            title: "Your first walk: what to wear, where we meet.",
            meta: "Hannah Albright, LPC",
            description:
                "Shoes you can walk a couple of miles in, a layer, and water. We meet at the trailhead gate. The pace is a stroll, and we can turn back whenever you like. Your phone can stay in your pocket.",
            image: photo(
                "trailhead",
                1600,
                1200,
                "A therapist with a daypack greeting a client at a wooden trailhead fence, sandstone peaks behind them",
            ),
        },
    ],
    extras: [],
}

export const menu: CareMenu = {
    kicker: "Fees",
    title: "Plain fees, and a few sliding-scale spots.",
    intro: "We're out of network with every insurer. We'll give you a superbill each month so you can claim out-of-network benefits yourself.",
    groups: [
        {
            heading: "Sessions",
            items: [
                { name: "Walk-and-talk session", note: "50 minutes, trail, room, or video", price: "$160" },
                { name: "Couples or family walk", note: "80 minutes", price: "$220" },
                { name: "Telehealth session", note: "50 minutes, anywhere in Colorado", price: "$150" },
                { name: "First call", note: "15 minutes, by phone", price: "Free" },
            ],
        },
        {
            heading: "Ways to pay",
            items: [
                {
                    name: "Sliding scale",
                    note: "A few spots each season, by household income",
                    price: "$90",
                    qualifier: "from",
                },
                { name: "Superbills", note: "For out-of-network reimbursement", price: "Monthly" },
                { name: "HSA & FSA cards", note: "Therapy is a qualified expense", price: "Accepted" },
            ],
        },
    ],
    footnote:
        "You have the right to a Good Faith Estimate of what your care will cost. Ask for one on your first call.",
}

export const spotlight: CareSpotlight | null = {
    kicker: "",
    headline: "",
    body: "",
    bullets: [],
    image: photo(
        "room",
        1600,
        1200,
        "A therapist and a client talking in leather armchairs by a window onto snowy pines, boots drying by the door",
    ),
    report: { label: "", title: "", summary: "", rows: [], signature: "", stamp: "" },
}

export const faq: CareFaq = {
    kicker: "Questions",
    title: "Before your first walk.",
    items: [
        {
            question: "What if someone we know walks past?",
            answer: "It happens now and then, and we plan for it. We choose quieter trails and times, and if you'd rather not be seen, we'll simply keep walking and talk about the weather until they're gone.",
        },
        {
            question: "Do I need to be fit?",
            answer: "No. The pace is a stroll on mostly flat, well-kept trails, and we stop whenever you want. If walking isn't right for your body, we'll meet in the room or by video.",
        },
        {
            question: "What happens when it snows?",
            answer: "Light snow, we walk the lower trails. Ice, wind, or lightning, we move to the Pearl Street room or to video at the same time. You'll get a text with the plan by 7 a.m.",
        },
        {
            question: "Is it confidential outside?",
            answer: "The same confidentiality rules apply on the trail as in an office. We'll talk about what privacy looks like outdoors in your first session and agree on a plan together.",
        },
        {
            question: "Do you take insurance?",
            answer: "We're out of network. You'll get a monthly superbill to claim out-of-network benefits, and a few sliding-scale spots open each season.",
        },
    ],
}

export const story = {
    kicker: "The practice",
    headline: "Started on the walk to the parking lot.",
    paragraphs: [
        "Hannah noticed it after eight years in a downtown office: the most honest minute of the week came on the walk out, side by side, looking at the street instead of each other. So she moved the whole hour outside.",
        "Open Trail meets at a room on Pearl Street, five minutes from three trailheads. We walk most weeks, sit inside some weeks, and switch to video when the Front Range reminds us who's in charge.",
    ],
    image: photo(
        "room",
        1600,
        1200,
        "A therapist and a client talking in leather armchairs by a window onto snowy pines, boots drying by the door",
    ),
}

export const booking = {
    headline: "Book a free 15-minute call.",
    intro: "Start with a short call with Hannah, Marcus, or Priya. Current clients can book walks and couples sessions here too. You'll get an email confirmation with a one-click cancel link — no portal, no password.",
    // The privacy line the visitor reads beside the form. Honest by
    // design: it describes what the form collects, and claims nothing
    // beyond it (never write compliance claims into template copy).
    privacyNote:
        "Booking asks for your name, contact details, and session type, and nothing about why you're coming. That conversation happens on the trail.",
}
