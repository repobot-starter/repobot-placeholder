/**
 * Remix seed — The Worth Pool Co., the Palm Beach estate pool-care
 * derived template of the recurring-services pack
 * (packs/services-recurring-worth). A complete, drop-in replacement for
 * `./content.ts`: the composer copies it over the pack's content module
 * byte-for-byte, so it must stay a structural twin — same exports, same
 * relative imports, images under its own `/services-recurring-worth/`
 * public directory. The parity tests pin the export surface.
 *
 * The home's spine is the season calendar (`season`, schedule
 * `week-grid`): from the November opening through hurricane season, the
 * current window marked. The plans follow as the three kinds of care.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/services-recurring-worth`. The `photo` helper mirrors
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
        src: `/services-recurring-worth/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({
            src: `/services-recurring-worth/${name}-${step}w.webp`,
            width: step,
        })),
    }
}

export const business = {
    name: "The Worth Pool Co.",
    tagline: "Estate pool care",
    location: "Palm Beach, Florida",
    /** Shown everywhere the number appears; `phoneHref` is the tap target. */
    phone: "(561) 555-0171",
    phoneHref: "tel:+15615550171",
    email: "care@worthpool.example",
    address: "340 Royal Poinciana Way, Suite 12, Palm Beach, FL 33480",
    /** The trust line — rendered wherever trust is being earned. */
    license: "Florida certified pool contractor CPC1459820 · Insured",
}

/**
 * Weekly hours drive the live "Open now" hero badge (the shared hours
 * engine, `View/Landing/hours.ts`). Minutes since midnight; a day may have
 * several intervals.
 */
export const weeklyHours: DayHours[] = [
    { day: 1, intervals: [[450, 1020]] }, // Mon 7:30 AM – 5 PM
    { day: 2, intervals: [[450, 1020]] },
    { day: 3, intervals: [[450, 1020]] },
    { day: 4, intervals: [[450, 1020]] },
    { day: 5, intervals: [[450, 1020]] }, // Fri
    { day: 6, intervals: [[480, 720]] }, // Sat 8 AM – noon
]

export const hoursNote =
    "Monday–Friday 7:30 AM–5 PM · Saturday 8 AM–noon · Storm line open all hurricane season"

/** Where the trucks go — the quiet strip. */
export const serviceArea = [
    "Palm Beach",
    "Manalapan",
    "Jupiter Island",
    "North Palm Beach",
    "Gulf Stream",
    "Wellington",
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
    navTagline: "Palm Beach, Florida · Est. 1971",
    /** The booking ask — the shell's nav CTA and every landing CTA. */
    bookCtaLabel: "Schedule weekly care",
    /** The plans page's nudge for the undecided. */
    fitNudgeTitle: "Not sure what the pool needs? Start with a water test.",
    /** The about page's credentials-strip label. */
    credentialsLabel: "Why Palm Beach calls us",
    /** The price tiles' header (home and plans page) and the unit after each price. */
    pricesKicker: "Thoughtful care. Beautiful results.",
    pricesTitle: "Care for every season",
    pricePeriod: "/visit",
    /** The testimonials kicker. */
    reviewsKicker: "From our clients",
    /** The home page's closing banner; the posted hours follow the body. */
    homeBannerTitle: "Always swim-ready.",
    homeBannerBody:
        "A water test and equipment check at your first visit, and the same technician every week after.",
    /** The plans page's opening statement. */
    plansHeadline: "Every week, every season.",
    plansSubheadline:
        "Weekly care runs the same checklist all year; cabana care and hurricane prep are added as the season asks. Prices cover a typical estate pool and spa; larger or commercial pools are quoted after the first visit.",
    /** The plans page's closing banner body, under `fitNudgeTitle`. */
    fitNudgeBody: `Most estates start with weekly care and add hurricane prep in June. Call ${business.phone} to schedule a water test.`,
    /** The plans page's add-ons header (shown when `addOns` is filled). */
    addOnsKicker: "",
    addOnsTitle: "",
    /** The about page's three proof bullets. */
    aboutBullets: [
        "Florida certified pool contractor",
        "The same technician every week",
        "Hurricane prep for every client, every June",
    ],
    /** The about page's closing banner. */
    aboutBannerTitle: "Meet your technician.",
    /** The book page's form title. */
    bookFormTitle: "The pool, the house, the season",
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
        slug: "weekly-pool-care",
        name: "Weekly Pool Care",
        perVisit: 125,
        pricePrefix: "From",
        description: "Routine service, balancing, skimming, brushing and crystal-clear water — every week.",
        features: [
            "Water tested and balanced",
            "Skimmed, brushed and vacuumed",
            "Filters and baskets cleaned",
            "Equipment checked every visit",
            "The same technician each week",
        ],
        highlighted: true,
        badge: "Most estates",
    },
    {
        slug: "cabana-terrace",
        name: "Cabana & Terrace",
        perVisit: 175,
        pricePrefix: "From",
        description: "Care for cushions, curtains, stone, glass and outdoor furnishings.",
        features: [
            "Cushions and curtains cleaned",
            "Coral stone and pavers washed",
            "Glass and fixtures polished",
            "Furnishings set and squared",
        ],
    },
    {
        slug: "hurricane-prep",
        name: "Hurricane Prep",
        perVisit: 295,
        description: "Secure, protect and storm-ready your pool and outdoor living areas.",
        features: [
            "Furniture and cushions secured",
            "Water level and chemistry set",
            "Equipment shut down and protected",
            "Reopened and balanced after the storm",
        ],
    },
]

/** What every visit includes — the icon list on the home page. */
export const included: { icon: MarketingIconName; title: string; description: string }[] = [
    {
        icon: "droplet" as const,
        title: "Water, balanced",
        description: "Tested at the pool's edge and balanced every visit, with the readings sent to you.",
    },
    {
        icon: "sparkle" as const,
        title: "Tile and stone, bright",
        description: "Waterline tile brushed and coral stone rinsed, so the pool looks new all season.",
    },
    {
        icon: "shield" as const,
        title: "Equipment, watched",
        description:
            "Pumps, heaters, salt cells and lights checked every week, before a small fault becomes a green pool.",
    },
    {
        icon: "calendar" as const,
        title: "Your technician, your day",
        description:
            "The same technician on the same weekday, with a text the evening before and a note after.",
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
    columns: ["", "Weekly Pool Care", "Cabana & Terrace", "Hurricane Prep"],
    rows: [
        { label: "Water tested and balanced", values: [true, false, true] },
        { label: "Skimmed, brushed and vacuumed", values: [true, false, false] },
        { label: "Equipment checked", values: [true, false, true] },
        { label: "Cushions, curtains and furnishings", values: [false, true, "Secured"] },
        { label: "Coral stone and pavers washed", values: ["Rinsed", true, false] },
        { label: "Reopened after a storm", values: [false, false, true] },
        { label: "Same technician every visit", values: [true, true, true] },
    ],
}

/** The trust numbers — the metrics strip. Keep values short and big. */
export const metrics: { value: string; label: string }[] = [
    { value: "1971", label: "caring for Palm Beach pools since" },
    { value: "380", label: "estate pools on a weekly route" },
    { value: "12 yrs", label: "average technician tenure" },
]

export const testimonials = [
    {
        quote: "Our technician has come every Tuesday for eleven years. The pool has never once been anything but perfect when the grandchildren arrive.",
        name: "Catherine Ashby",
        detail: "Weekly Pool Care, Palm Beach",
    },
    {
        quote: "Two days before the storm they had every cushion stored, the furniture tied down and the pool set. The morning after, it was swim-ready again by noon.",
        name: "Richard & Helena Marsh",
        detail: "Hurricane Prep, Manalapan",
    },
    {
        quote: "They keep the cabana like a hotel — curtains pressed, cushions spotless, the stone washed every week.",
        name: "Beatriz Solano",
        detail: "Cabana & Terrace, Jupiter Island",
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
    headline: "Always swim-ready.",
    subheadline:
        "Weekly estate pool care for Palm Beach since 1971 — the same technician every week, from the November opening through hurricane season.",
    heroImage: photo(
        "hero-palm-beach-pool",
        2400,
        1350,
        "A technician in white skimming a turquoise pool before a pink Palm Beach villa with royal palms and a striped cabana",
    ),
    /** The hero sticker; empty shows a live "Open now" badge from `weeklyHours`. */
    badge: "Palm Beach · Est. 1971",
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
    kicker: "",
    title: "",
    intro: "",
    name: "",
    detail: "",
    messages: [],
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
    kicker: "A Palm Beach tradition of care, since 1971",
    title: "The Season Calendar",
    intro: "",
    windows: [
        {
            label: "NOV",
            months: [11],
            title: "Season opening",
            detail: "Open with care. Ready for the season.",
        },
        {
            label: "DEC–APR",
            months: [12, 1, 2, 3, 4],
            title: "Weekly care, the season",
            detail: "Consistent care keeps your pool sparkling all season long.",
        },
        {
            label: "MAY",
            months: [5],
            title: "Deep clean & resurfacing",
            detail: "Refresh the surface. Restore the finish. Elevate every detail.",
        },
        {
            label: "JUN–NOV",
            months: [6, 7, 8, 9, 10, 11],
            title: "Hurricane watch & prep",
            detail: "Prepared in advance. Protected when it matters.",
        },
    ],
    note: "Thoughtful care. Beautiful results.",
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
export const addOns: { icon: MarketingIconName; title: string; description: string }[] = []

/** The proof gallery — the standard, in photos. Click any to zoom. */
export const gallery: { caption: string; image: SiteImage }[] = [
    {
        caption: "Cabanas: curtains pressed, cushions squared, stone washed",
        image: photo(
            "standard-cabana",
            1600,
            1200,
            "A striped pink-and-white cabana with white loungers on coral stone beside a turquoise pool and bougainvillea",
        ),
    },
    {
        caption: "Water: tested at the edge, every visit",
        image: photo(
            "standard-water-test",
            1600,
            1200,
            "A technician's hands holding a water sample over a turquoise pool beside an open wooden test kit on coral stone",
        ),
    },
    {
        caption: "Hurricane prep: cushions stored, furniture tied down, pool set",
        image: photo(
            "standard-hurricane-prep",
            1600,
            1200,
            "Pool furniture stacked and strapped under a loggia beside a still pool as palms bend under storm clouds",
        ),
    },
]

export const about = {
    headline: "Three generations at the water's edge.",
    photo: photo(
        "about-owner",
        1600,
        1200,
        "Tess Worth laughing as her pool brush throws a splash off the waterline tile, a pink villa and royal palms behind her",
    ),
    paragraphs: [
        "Arthur Worth started cleaning pools on the island in 1971 with a pickup truck, a brush and a test kit he kept in a cigar box. His granddaughter Tess rode along every summer as a kid, and has run the company since 2019.",
        "The Worth Pool Co. still works the way Arthur did: the same technician at your pool every week, the water tested at the edge, and nothing left for next time. Our technicians average twelve years with us.",
        "Every June we prepare every client's pool and terrace for hurricane season, and after every storm we're back the next morning to reopen them.",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: ["FL CPC1459820", "Certified pool operators", "Fully insured", "Family owned since 1971"],
}

export const faq = [
    {
        question: "Will the same technician come every week?",
        answer: "Yes. Every pool has a regular technician who learns its equipment and its quirks. Substitutions happen only for illness or holidays, with notice.",
    },
    {
        question: "What happens when a hurricane is coming?",
        answer: "Hurricane Prep clients are scheduled in order the moment a storm is named. We secure furniture and cushions, set the water level and chemistry, protect the equipment, and reopen the pool after the storm passes.",
    },
    {
        question: "Do we need to be home?",
        answer: "No. Most of our clients are away part of the year. We hold gate codes securely and send the water readings and a photo after every visit.",
    },
    {
        question: "Do you resurface pools?",
        answer: "Yes — May is our resurfacing season, before the summer storms. We inspect the finish during weekly care and quote any resurfacing well ahead.",
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
            typeId: "water-test",
            name: "Water test & equipment check",
            durationMinutes: 45,
            description:
                "A first visit to test the water, check the pumps, filters and heaters, and quote weekly care.",
        },
        {
            typeId: "first-service",
            name: "First weekly visit",
            durationMinutes: 90,
            description:
                "The first full service — brushed, vacuumed and balanced, so weekly care starts from clean.",
        },
    ],
    providers: [
        {
            providerId: "tess-worth",
            name: "Tess Worth",
            windows: [
                { day: 1, start: 8 * 60, end: 14 * 60 },
                { day: 2, start: 8 * 60, end: 14 * 60 },
                { day: 3, start: 8 * 60, end: 14 * 60 },
                { day: 4, start: 8 * 60, end: 14 * 60 },
                { day: 5, start: 8 * 60, end: 14 * 60 },
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
    headline: "Schedule a water test",
    intro: "Book the first water test or your first weekly visit — pick a time and you'll get a confirmation with a one-click cancel link. Prefer to write first? The form below reaches the office directly.",
    /** The new/returning select's trade voice (the widget's statusLabels). */
    statusLabels: { new: "A new pool for us", returning: "We already care for your pool" },
    privacyNote: "Your address and gate code stay with the office and your technician.",
}

export const book = {
    headline: "Schedule weekly care.",
    body: "Tell us about the pool and the season you're planning — weekly care, cabana care or hurricane prep — and we'll reply the same day with a price and your technician's first opening.",
    confirmation:
        "Thank you — your request is in. We reply the same business day with a price and the first opening for your pool.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "phone", label: "Phone", type: "tel" as const, required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        { name: "address", label: "Property address", required: true },
        { name: "size", label: "Pool", placeholder: "Pool and spa, approximate size, salt or chlorine" },
        {
            name: "frequency",
            label: "What care?",
            placeholder: "Weekly care, cabana & terrace, hurricane prep",
        },
        {
            name: "notes",
            label: "Anything we should know",
            type: "textarea" as const,
            fullWidth: true,
            placeholder: "Gate codes, when you're in residence, the equipment you have …",
        },
    ],
}
