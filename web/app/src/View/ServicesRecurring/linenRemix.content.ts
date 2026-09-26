/**
 * Remix seed — Linen & Laurel, the white-glove housekeeping and estate
 * management derived template of the recurring-services pack
 * (packs/services-recurring-linen). A complete, drop-in replacement for
 * `./content.ts`: the composer copies it over the pack's content module
 * byte-for-byte, so it must stay a structural twin — same exports, same
 * relative imports, images under its own `/services-recurring-linen/`
 * public directory. The parity tests pin the export surface.
 *
 * The home's spine is a text thread with the house manager (`thread`,
 * steps `message-thread`) beside what every residence gets (`included`);
 * the standard follows in photographs (`gallery`).
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/services-recurring-linen`. The `photo` helper mirrors
 * that verb's naming exactly.
 */

import type { MarketingIconName } from "@ui"
import type { DayHours } from "../Landing/hours"
import type { AppointmentsContent } from "../Landing/practiceDocument"

export interface SiteImage {
    src: string
    alt: string
    width: number
    height: number
    srcSet: { src: string; width: number }[]
}

/** The width ladder `npm run image -- responsive` emits by default. */
const LADDER = [640, 1024, 1600, 2400]

/** A responsive-verb image entry from its name and intrinsic size. */
function photo(name: string, width: number, height: number, alt: string): SiteImage {
    const widths = [...new Set(LADDER.map((step) => Math.min(step, width)))]
    return {
        src: `/services-recurring-linen/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({
            src: `/services-recurring-linen/${name}-${step}w.webp`,
            width: step,
        })),
    }
}

export const business = {
    name: "Linen & Laurel",
    tagline: "White-glove housekeeping & estate management",
    location: "Beverly Hills, California",
    /** Shown everywhere the number appears; `phoneHref` is the tap target. */
    phone: "(310) 555-0128",
    phoneHref: "tel:+13105550128",
    email: "residences@linenandlaurel.example",
    address: "9454 Wilshire Boulevard, Suite 610, Beverly Hills, CA 90212",
    /** The trust line — rendered wherever trust is being earned. */
    license: "Bonded & insured — every staff member background-checked and under NDA",
}

/**
 * Weekly hours drive the live "Open now" hero badge (the shared hours
 * engine, `View/Landing/hours.ts`). Minutes since midnight; a day may have
 * several intervals. The residences are staffed daily; these are the
 * office's hours.
 */
export const weeklyHours: DayHours[] = [
    { day: 1, intervals: [[480, 1140]] }, // Mon 8 AM – 7 PM
    { day: 2, intervals: [[480, 1140]] },
    { day: 3, intervals: [[480, 1140]] },
    { day: 4, intervals: [[480, 1140]] },
    { day: 5, intervals: [[480, 1140]] }, // Fri
    { day: 6, intervals: [[540, 960]] }, // Sat 9 AM – 4 PM
]

export const hoursNote =
    "Office Monday–Friday 8 AM–7 PM · Saturday 9 AM–4 PM · Your house manager answers every day"

/** Where the residences are — the quiet strip. */
export const serviceArea = [
    "Beverly Hills",
    "Bel Air",
    "Holmby Hills",
    "Brentwood",
    "Pacific Palisades",
    "Trousdale",
]

/**
 * Landing copy the trade owns: the few strings the landing and shell
 * modules render that would read wrong for a different trade. Remix seeds
 * retrade these along with the rest of the content — everything else in
 * those modules is trade-neutral on purpose.
 */
export const landingCopy = {
    /** The nav wordmark; empty = the business name. */
    navName: "",
    /** A small line under the nav wordmark ("Atlanta", "Pest Co."); empty = none. */
    navTagline: "White-glove housekeeping & estate management",
    /** The booking ask — the shell's nav CTA and every landing CTA. */
    bookCtaLabel: "Request a walkthrough",
    /** The plans page's nudge for the undecided. */
    fitNudgeTitle: "Not sure how much help the house needs? Start with a walkthrough.",
    /** The about page's credentials-strip label. */
    credentialsLabel: "Why families hand us the keys",
    /** The price tiles' header (home and plans page) and the unit after each price. */
    pricesKicker: "Residences",
    pricesTitle: "The rhythm of the house",
    pricePeriod: "/day",
    /** The testimonials kicker. */
    reviewsKicker: "From the families we serve",
    /** The home page's closing banner; the posted hours follow the body. */
    homeBannerTitle: "Come home to perfect.",
    homeBannerBody:
        "A private walkthrough with our director of residences, then a written proposal within two days.",
    /** The plans page's opening statement. */
    plansHeadline: "One standard. Every room, every day.",
    plansSubheadline:
        "Every residence gets a dedicated house manager and the same staff each visit. Day rates cover a typical estate of up to 8,000 sq ft; larger homes and live-in staffing are quoted after the walkthrough.",
    /** The plans page's closing banner body, under `fitNudgeTitle`. */
    fitNudgeBody: `Most families start with five days a week and adjust after the first month. Call ${business.phone} to arrange a walkthrough.`,
    /** The plans page's add-ons header (shown when `addOns` is filled). */
    addOnsKicker: "By arrangement",
    addOnsTitle: "For the rest of the house",
    /** The about page's three proof bullets. */
    aboutBullets: [
        "Bonded & insured — every staff member under NDA",
        "A dedicated house manager for every residence",
        "The same staff every visit, trained in-house",
    ],
    /** The about page's closing banner. */
    aboutBannerTitle: "Meet your house manager.",
    /** The book page's form title. */
    bookFormTitle: "The house, the rhythm, the details",
}

export interface Plan {
    slug: string
    name: string
    /** Per-visit price in dollars — the recurring shape prices the visit. */
    perVisit: number
    description: string
    features: string[]
    /** A word before the price — "From" for a starting price. */
    pricePrefix?: string
    /** The recommended plan: accent border and the badge treatment. */
    highlighted?: boolean
    badge?: string
    /**
     * The code on the plan's ticket stub ("FC-ATL-7D"). When every plan
     * carries one, the price tiles print as season tickets.
     */
    stub?: string
    /** Ticket stubs only: this plan's unit over `pricePeriod` ("/season"). */
    period?: string
}

export const plans: Plan[] = [
    {
        slug: "five-days",
        name: "Five days a week",
        perVisit: 480,
        pricePrefix: "From",
        description: "The house kept, every weekday — beds, baths, wardrobe and the week's details, handled.",
        features: [
            "Dedicated house manager",
            "Two housekeepers, the same each day",
            "Linens pressed, beds turned down",
            "Wardrobe and dry-cleaning care",
            "Guest suites kept ready",
        ],
        highlighted: true,
        badge: "Most residences",
    },
    {
        slug: "three-days",
        name: "Three days a week",
        perVisit: 520,
        pricePrefix: "From",
        description: "Monday, Wednesday, Friday — for homes that live lightly between visits.",
        features: [
            "Dedicated house manager",
            "Two housekeepers, the same each visit",
            "Linens pressed, beds turned down",
            "Wardrobe and dry-cleaning care",
        ],
    },
    {
        slug: "seasonal-residence",
        name: "Seasonal residence",
        perVisit: 640,
        pricePrefix: "From",
        description: "For the house you're away from — opened before you arrive and closed after you leave.",
        features: [
            "House opened, aired and stocked",
            "Weekly inspection while you're away",
            "Vendors met and supervised",
            "House closed and secured",
        ],
    },
]

/** What every residence gets — the icon list on the home page. */
export const included: { icon: MarketingIconName; title: string; description: string }[] = [
    {
        icon: "leaf" as const,
        title: "Daily housekeeping",
        description: "Deep cleans and thoughtful touches, every day — fresh flowers in the foyer included.",
    },
    {
        icon: "hanger" as const,
        title: "Wardrobe & linen care",
        description: "Pressed, pristine and perfectly maintained, from the linen closet to the dry cleaning.",
    },
    {
        icon: "home" as const,
        title: "Estate management",
        description:
            "Vendors, deliveries, dinners and repairs coordinated, so you never have to think about them.",
    },
    {
        icon: "bell" as const,
        title: "Arrival-ready homes",
        description:
            "Rooms aired, beds turned down and the refrigerator stocked before you land, whichever residence it is.",
    },
]

export interface Specimen {
    name: string
    /** The plate's small line under the name — a field-guide note ("Blattella germanica"). */
    meta: string
    description: string
    image: SiteImage
}

/**
 * The home page's specimen board: portrait plates of what the trade deals
 * with (the pests, the weeds), before the plans. Empty here.
 */
export const specimens: { kicker: string; title: string; items: Specimen[] } = {
    kicker: "",
    title: "",
    items: [],
}

/**
 * The plans page's line-by-line comparison. `columns` heads the table
 * (first entry is the criterion column); each row carries one value per
 * plan — booleans render as ✓ / —.
 */
export const planComparison = {
    columns: ["", "Five days a week", "Three days a week", "Seasonal residence"],
    rows: [
        { label: "Dedicated house manager", values: [true, true, true] },
        { label: "The same staff every visit", values: [true, true, true] },
        { label: "Linens pressed, beds turned down", values: [true, true, "On arrival"] },
        { label: "Wardrobe and dry-cleaning care", values: [true, true, false] },
        { label: "Guest suites kept ready", values: [true, "On request", "On arrival"] },
        { label: "Silver, crystal and art care", values: ["Weekly", "Monthly", false] },
        { label: "Vendors met and supervised", values: [true, true, true] },
        { label: "Weekly inspection while you're away", values: [false, false, true] },
    ],
}

/** The trust numbers — the metrics strip. Keep values short and big. */
export const metrics: { value: string; label: string }[] = [
    { value: "64", label: "residences in our care" },
    { value: "9 yrs", label: "average staff tenure" },
    { value: "15 min", label: "house manager reply time" },
]

export const testimonials = [
    {
        quote: "We landed from London at eleven at night and the house smelled of gardenias, the beds were turned down and the fridge was stocked. Ana had thought of everything, again.",
        name: "Eleanor & James Whitcombe",
        detail: "Five days a week, Bel Air",
    },
    {
        quote: "The same two people have cared for our home for six years. They know which linens go in which room and how my husband likes his shirts. It's peace of mind.",
        name: "Priya Castellanos",
        detail: "Five days a week, Beverly Hills",
    },
    {
        quote: "Our Palisades house sits empty half the year. They check it every week, meet every vendor and send photos, and it's perfect the day we arrive.",
        name: "Daniel Okonkwo",
        detail: "Seasonal residence, Pacific Palisades",
    },
]

export const home: {
    headline: string
    subheadline: string
    heroImage: SiteImage
    badge: string
    pricesCta: string
    /**
     * The hero's frame: "split" (copy beside the photo), "full-bleed" (the
     * photograph is the hero, copy over it), or "masthead" (full-bleed
     * under a poster-scale headline).
     */
    layout: "split" | "full-bleed" | "masthead"
    /** Full-bleed and masthead only: a credit line under the headline. Empty = none. */
    credit: string
} = {
    headline: "Come home to perfect.",
    subheadline:
        "White-glove housekeeping and estate management for Beverly Hills and Bel Air — a dedicated house manager, the same staff every visit, and every detail handled.",
    heroImage: photo(
        "hero-pressed-linen",
        2400,
        1350,
        "A housekeeper in a gray uniform smoothing a crisp white duvet beside folded towels in a sunlit white bedroom",
    ),
    /** The hero sticker; empty shows a live "Open now" badge from `weeklyHours`. */
    badge: "Beverly Hills + Bel Air",
    /** The hero's second ask, linking to the plans page. Empty = a call button. */
    pricesCta: "",
    layout: "full-bleed",
    credit: "",
}

export interface ThreadMessage {
    /** The bubble's text, as the message was sent. */
    text: string
    /** `start`: the house manager (left); `end`: you (right). */
    side: "start" | "end"
    /** The bubble's time label, e.g. "2:14 pm"; "" for none. */
    time: string
    /** A photo attached to the bubble. */
    photo?: SiteImage
    /** A small confirmation chip, e.g. "Confirmed". */
    chip?: string
    /** The plain-language line beside the thread for this message. */
    note: string
}

/**
 * A day in the life, as a text thread with the house manager — the home
 * page's conversation (steps `message-thread`). Empty `messages` drops
 * the section.
 */
export const thread: {
    kicker: string
    title: string
    intro: string
    /** The thread's header: who you're talking to. */
    name: string
    detail: string
    messages: ThreadMessage[]
} = {
    kicker: "A conversation with your house manager",
    title: "",
    intro: "",
    name: "Ana · House manager",
    detail: "Usually replies in minutes",
    messages: [
        {
            text: "Guest suite is ready. Fresh hydrangeas in the foyer.",
            side: "start",
            time: "2:14 pm",
            photo: photo(
                "thread-guest-suite",
                1600,
                1200,
                "A guest suite with a freshly made white bed, folded towels and white hydrangeas on the nightstand",
            ),
            note: "Your house manager readies the guest suite and sends a photo when it's done.",
        },
        {
            text: "Perfect. Dinner for 8 Saturday?",
            side: "end",
            time: "2:20 pm",
            note: "Ask for anything by text — a dinner, a delivery, a repair.",
        },
        {
            text: "Confirmed. Silver polished, linens pressed, chef arriving at 5.",
            side: "start",
            time: "2:31 pm",
            chip: "Confirmed",
            note: "She plans it, staffs it and confirms every detail in writing.",
        },
        {
            text: "Dry cleaning is back and hung. Have a lovely evening.",
            side: "start",
            time: "6:02 pm",
            note: "And the small things are simply done before you get home.",
        },
    ],
}

export interface SeasonWindow {
    /** The column's head, e.g. "DEC–APR". */
    label: string
    /** The calendar months (1–12) the window covers — the current one is marked. */
    months: number[]
    title: string
    detail: string
}

/**
 * The year of service, window by window — the home page's season
 * calendar (schedule `week-grid`). Empty `windows` drops the section.
 */
export const season: {
    kicker: string
    title: string
    intro: string
    windows: SeasonWindow[]
    /** One line under the calendar; "" for none. */
    note: string
} = {
    kicker: "",
    title: "",
    intro: "",
    windows: [],
    note: "",
}

export interface TurnoverStep {
    /** The clock time the step happens at, as guests would read it. */
    time: string
    title: string
    description: string
    /** Proof photo for the step (the made bed, the stocked bath). */
    image?: SiteImage
}

/**
 * A service day, hour by hour — the home page's timeline rail. Empty
 * `steps` drops the section.
 */
export const turnover: { kicker: string; title: string; steps: TurnoverStep[] } = {
    kicker: "",
    title: "",
    steps: [],
}

export interface ChecklistItem {
    label: string
    /** One short line of proof under the label. */
    note: string
    /** Unticked items render an open box; default ticked. */
    checked?: boolean
}

/**
 * The door-hanger checklist left after every visit — the home page's
 * thoroughness proof. Empty `items` drops the section.
 */
export const roomReady: {
    kicker: string
    title: string
    cardTitle: string
    body: string
    /** Optional (null = none): the photo beside the card. */
    photo?: SiteImage | null
    items: ChecklistItem[]
} = {
    kicker: "",
    title: "",
    cardTitle: "",
    body: "",
    photo: null,
    items: [],
}

/** Extras — the plans page's add-on cards. Empty drops the section. */
export const addOns: { icon: MarketingIconName; title: string; description: string }[] = [
    {
        icon: "calendar" as const,
        title: "Events & dinners",
        description: "Staffing, rentals, florals and the clean-up for dinners and parties at home.",
    },
    {
        icon: "sparkle" as const,
        title: "Silver, crystal & art",
        description: "Hand-polishing, careful handling and museum-grade care for the collection.",
    },
    {
        icon: "calendar" as const,
        title: "Travel & arrivals",
        description: "Packing, unpacking and a house ready for you, wherever you're flying in from.",
    },
]

/** The proof gallery — the standard, in photos. Click any to zoom. */
export const gallery: { caption: string; image: SiteImage }[] = [
    {
        caption: "Wardrobes: steamed, pressed and hung by color",
        image: photo(
            "standard-wardrobe",
            1600,
            1200,
            "A white-gloved hand steaming a white shirt in a walk-in wardrobe of neatly hung shirts and folded knitwear",
        ),
    },
    {
        caption: "Dinners: set, served and cleared",
        image: photo(
            "standard-dining",
            1600,
            1200,
            "A dining table set for eight with white linen, crystal, silver and low arrangements of white roses",
        ),
    },
    {
        caption: "Baths: marble polished, towels rolled",
        image: photo(
            "standard-bath",
            1600,
            1200,
            "A white marble bathroom with a freestanding tub, rolled towels and a white orchid on a teak stool",
        ),
    },
]

export const about = {
    headline: "The house, handled.",
    photo: photo(
        "about-house-manager",
        1600,
        1200,
        "Priya Raman, Linen & Laurel's founder, laughing as she arranges white hydrangeas in a marble foyer while a colleague carries in folded linens",
    ),
    paragraphs: [
        "Priya Raman ran housekeeping at one of Beverly Hills' grand hotels until a family she'd looked after asked her to run their home instead. In 2018 she founded Linen & Laurel on the same standard: every room, every day, the way a five-star house would do it.",
        "Every residence has a dedicated house manager and the same staff every visit — employees, never contractors, trained in-house, bonded, insured and under NDA. Most of our staff have been with us since the first year.",
        "We bring our own linen care, polish and supplies, keep a written standard for every room, and answer every text the same day — usually within fifteen minutes.",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "Bonded & insured",
        "Every staff member under NDA",
        "Employees, not contractors",
        "Background-checked",
    ],
}

export const faq = [
    {
        question: "Will we have the same staff every visit?",
        answer: "Yes. Every residence has a dedicated house manager and a regular team, and substitutions happen only for illness or holidays — with notice, and always someone who already knows your home.",
    },
    {
        question: "How is our privacy protected?",
        answer: "Every staff member is background-checked and signs a non-disclosure agreement. Keys and codes are held in a bonded system, and we never photograph your home except to report to you.",
    },
    {
        question: "Can you manage the house while we're away?",
        answer: "Yes — the seasonal residence plan includes a weekly inspection, vendor supervision and a full opening before you arrive, with photos after every visit.",
    },
    {
        question: "How is pricing set?",
        answer: "Day rates cover a typical estate of up to 8,000 square feet. After a private walkthrough we send a written proposal with a fixed monthly rate, so there are no surprises.",
    },
]

/**
 * The appointments contract's code fallback — the same booking mode 2 the
 * care pack runs (web/app/src/View/Landing/practiceDocument.ts): visit
 * types x weekly availability windows, projected into concrete capacity-1
 * slots by `generateAppointmentSlots`. The catalog's `content.appointments`
 * seed mirrors this export exactly (the content tests pin the twin).
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "walkthrough",
            name: "Private walkthrough",
            durationMinutes: 60,
            description:
                "A walk through the residence with our director of residences — the rooms, the rhythm, and the details that matter to you.",
        },
        {
            typeId: "proposal-review",
            name: "Proposal review",
            durationMinutes: 30,
            description: "A call to go through your written proposal and meet your house manager.",
        },
    ],
    providers: [
        {
            providerId: "priya-raman",
            name: "Priya Raman",
            windows: [
                { day: 1, start: 10 * 60, end: 16 * 60 },
                { day: 2, start: 10 * 60, end: 16 * 60 },
                { day: 3, start: 10 * 60, end: 16 * 60 },
                { day: 4, start: 10 * 60, end: 16 * 60 },
            ],
        },
    ],
}

/** The /book page's booking strip — the slot picker above the form. */
export const booking: {
    headline: string
    intro: string
    statusLabels: { new: string; returning: string }
    /** The line under the slot picker; omit it for the widget's default. */
    privacyNote?: string
} = {
    headline: "Arrange a private walkthrough",
    intro: "Pick a time for a walkthrough of your residence — you'll get a confirmation with a one-click cancel link. Prefer to write first? The form below reaches our director of residences directly.",
    /** The new/returning select's trade voice (the widget's statusLabels). */
    statusLabels: { new: "A new residence", returning: "We already care for your home" },
    privacyNote: "Everything you share stays with our director of residences.",
}

export const book = {
    headline: "Request a walkthrough.",
    body: "Tell us about the residence and the help you're looking for. Our director of residences replies within one business day to arrange a private walkthrough.",
    confirmation:
        "Thank you — your request is with our director of residences, who will be in touch within one business day.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "phone", label: "Phone", type: "tel" as const, required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        { name: "address", label: "Residence", required: true, placeholder: "Street and neighborhood" },
        { name: "size", label: "Home size", placeholder: "Bedrooms and approximate square feet" },
        {
            name: "frequency",
            label: "How often?",
            placeholder: "Five days, three days, or while you're away",
        },
        {
            name: "notes",
            label: "Anything we should know",
            type: "textarea" as const,
            fullWidth: true,
            placeholder: "Household staff, pets, the collection, upcoming travel …",
        },
    ],
}
