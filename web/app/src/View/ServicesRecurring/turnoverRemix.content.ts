/**
 * The recurring-services pack's single content file: the business, its
 * prices, and pages. Everything the site renders comes from here — edit
 * this file (not the page components) to make the site yours. The demo
 * business is Clean Getaway, a Miami turnover crew for Airbnb and VRBO
 * hosts, but the shape fits any repeat-visit trade: lawn care, pool
 * service, pest control — swap the prices and copy and the site follows.
 *
 * This is the `services` category's recurring/booking shape: the sell is
 * repetition and proof, not a one-off job. Price tiles sit on the home
 * page, the turnover timeline and the door-hanger checklist prove speed
 * and thoroughness, the prices page compares what's included line by
 * line, and the form asks for the rhythm, not a project.
 *
 * Optional blocks: the builders render a home section only when its
 * content is filled. This demo fills the turnover pair (`turnover`,
 * `roomReady`) and leaves the classic proof trio (`metrics`, `included`,
 * `gallery`) and the `specimens` board empty — fill those to add the stats
 * strip, the what's-included icon list, a photo gallery, and a specimen
 * board back to the home page.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/services-recurring` (see PACK.md). The `photo` helper
 * mirrors that verb's naming exactly. Never point a slot at a raw camera
 * file.
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
        src: `/services-recurring-turnover/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({
            src: `/services-recurring-turnover/${name}-${step}w.webp`,
            width: step,
        })),
    }
}

export const business = {
    name: "Clean Getaway",
    tagline: "Airbnb turnovers & move-out cleans",
    location: "Miami, Florida",
    /** Shown everywhere the number appears; `phoneHref` is the tap target. */
    phone: "(305) 555-0142",
    phoneHref: "tel:+13055550142",
    email: "book@cleangetaway.example",
    address: "2750 NW 3rd Ave, Suite 12, Miami, FL 33127",
    /** The trust line — rendered wherever trust is being earned. */
    license: "Licensed, bonded & insured — every cleaner background-checked",
}

/**
 * Weekly hours: when the crews roll and the phone answers. Minutes since
 * midnight; a day may have several intervals. (With `home.badge` empty the
 * hero shows a live "Open now" badge computed from these instead.)
 */
export const weeklyHours: DayHours[] = [
    { day: 0, intervals: [[480, 1200]] }, // Sun 8 AM – 8 PM
    { day: 1, intervals: [[480, 1200]] },
    { day: 2, intervals: [[480, 1200]] },
    { day: 3, intervals: [[480, 1200]] },
    { day: 4, intervals: [[480, 1200]] },
    { day: 5, intervals: [[480, 1200]] },
    { day: 6, intervals: [[480, 1200]] }, // Sat
]

export const hoursNote = "Crews out 7 days, 8 AM–8 PM · Same-day when you book by 10 AM"

/** The neighborhoods the crews actually drive to. */
export const serviceArea = [
    "Miami Beach",
    "Brickell",
    "Wynwood",
    "Little Havana",
    "Coconut Grove",
    "Coral Gables",
    "North Beach",
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
    navTagline: "",
    /** The booking ask — the shell's nav CTA and every landing CTA. */
    bookCtaLabel: "Book a turnover",
    /** The prices page's nudge for the undecided. */
    fitNudgeTitle: "Not sure which fits? Send us your listing link.",
    /** The about page's credentials-strip label. */
    credentialsLabel: "Why hosts trust us with the lockbox",
    /** The price tiles' header (home and prices page) and the unit after each price. */
    pricesKicker: "Prices",
    pricesTitle: "Fast. Reliable. Miami loud.",
    pricePeriod: "",
    /** The testimonials kicker. */
    reviewsKicker: "From our hosts",
    /** The home page's closing banner; the posted hours follow the body. */
    homeBannerTitle: "Next guest lands at four? We've got you.",
    homeBannerBody: "Book by 10 AM for a same-day turnover, photos on your phone by three.",
    /** The prices page's opening statement. */
    plansHeadline: "Flat prices. Every stay.",
    plansSubheadline:
        "Every turnover runs the same photo-checked list — the price moves with the size of the place, never with the day of the week. Bigger units and add-ons get a flat quote before we book.",
    /** The prices page's closing banner body, under `fitNudgeTitle`. */
    fitNudgeBody: `Most hosts start with one turnover and switch to the host plan by the second week. Call ${business.phone} for a same-day slot.`,
    /** The prices page's add-ons header (shown when `addOns` is filled). */
    addOnsKicker: "Add-ons & host plan",
    addOnsTitle: "Extras, priced flat",
    /** The about page's three proof bullets. */
    aboutBullets: [
        "Licensed, bonded & insured",
        "Photo checklist after every clean",
        "Free re-clean if anything's off",
    ],
    /** The about page's closing banner. */
    aboutBannerTitle: "Meet your crew this week.",
    /** The book page's form title. */
    bookFormTitle: "Your place, your check-out time",
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

/** The price tiles — the home page's trading cards and the prices page. */
export const plans: Plan[] = [
    {
        slug: "studio",
        name: "Studio",
        perVisit: 95,
        description: "Quick turn. Great vibes.",
        features: ["Linens & towels swapped", "Kitchen & bath reset", "Photo checklist to your phone"],
    },
    {
        slug: "two-bed",
        name: "2 Bed",
        perVisit: 145,
        description: "Spacious. Sparkling. Stress-free.",
        features: ["2 beds, 2 baths & the balcony", "Restocked from your closet", "Damage check every stay"],
        highlighted: true,
        badge: "Most popular",
    },
    {
        slug: "move-out",
        name: "Move-out deep clean",
        perVisit: 260,
        pricePrefix: "From",
        description: "Leave it spotless. Get your deposit back.",
        features: [
            "Inside oven, fridge & cabinets",
            "Baseboards, blinds & window tracks",
            "Priced by size before we book",
        ],
    },
]

/**
 * The home page's what's-included icon list. Empty in this demo — the
 * door-hanger checklist (`roomReady`) carries that proof instead.
 */
export const included: { icon: MarketingIconName; title: string; description: string }[] = []

export interface Specimen {
    name: string
    /** The plate's small line under the name — a field-guide note ("Blattella germanica"). */
    meta: string
    description: string
    image: SiteImage
}

/**
 * The home page's specimen board: portrait plates of what the trade deals
 * with (the pests, the weeds), before the prices. Empty in this demo —
 * fill `items` to add it.
 */
export const specimens: { kicker: string; title: string; items: Specimen[] } = {
    kicker: "",
    title: "",
    items: [],
}

/**
 * The prices page's line-by-line comparison. `columns` heads the table
 * (first entry is the criterion column); each row carries one value per
 * plan — booleans render as ✓ / —.
 */
export const planComparison = {
    columns: ["", "Studio", "2 Bed", "Move-out deep clean"],
    rows: [
        { label: "Linens & towels swapped, hotel fold", values: [true, true, false] },
        { label: "Kitchen & bathrooms reset and sanitized", values: [true, true, true] },
        { label: "Photo checklist sent to you", values: [true, true, true] },
        { label: "Restock from your supply closet", values: [true, true, false] },
        { label: "Damage & missing-item report", values: [true, true, "Walk-through report"] },
        { label: "Laundry run", values: ["Add-on", "Add-on", false] },
        { label: "Inside oven, fridge & cabinets", values: ["Add-on", "Add-on", true] },
        { label: "Baseboards, blinds & window tracks", values: [false, false, true] },
        { label: "Same-day availability", values: [true, true, "Next day"] },
    ],
}

/** The trust-numbers strip. Empty in this demo — fill to show it on the home page. */
export const metrics: { value: string; label: string }[] = []

export const testimonials = [
    {
        quote: "Back-to-back check-ins every Saturday in South Beach. They turn my two-bed in under four hours and the photos land before I even ask. My cleanliness score hasn't dipped below 5.0 since.",
        name: "Priya Raman",
        detail: "Superhost · 3 listings, Miami Beach",
    },
    {
        quote: "They caught a cracked lamp and a missing remote, photographed both, and I had the claim filed the same afternoon. That report alone pays for them.",
        name: "Jordan Ellis",
        detail: "Host · Brickell high-rise",
    },
    {
        quote: "Guest checked out at one instead of eleven. Clean Getaway reshuffled a crew and still had the place ready for my four o'clock. I didn't lift a finger.",
        name: "Marcus Bell",
        detail: "Host · Wynwood lofts",
    },
    {
        quote: "Move-out deep clean on Friday, landlord walk-through Saturday, full deposit back Monday. The oven looked newer than the day I moved in.",
        name: "Camila Duarte",
        detail: "Move-out · Coral Gables",
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
    headline: "Checked out. Cleaned up. Checked in.",
    subheadline:
        "Airbnb and VRBO turnovers across Miami — same day, photo-checked, restocked, and done before your next guest lands.",
    heroImage: photo(
        "hero-crew",
        1152,
        864,
        "Three Clean Getaway crew members in aqua tracksuits laughing as they push supply carts stacked with pink and yellow towels past a pastel Miami building",
    ),
    /**
     * The hero sticker (a starburst under the memphis register). Leave it
     * empty to show a live "Open now" badge from `weeklyHours` instead.
     */
    badge: "4-hour turnaround",
    /** The hero's second ask, linking to the prices page. Empty = a call button. */
    pricesCta: "See prices",
    layout: "split",
    credit: "",
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
 * Turnover day, hour by hour — the home page's timeline rail. Leave
 * `steps` empty to drop the section.
 */
export const turnover: { kicker: string; title: string; steps: TurnoverStep[] } = {
    kicker: "Turnover day",
    title: "Your guests leave at 11. We're done by 3.",
    steps: [
        {
            time: "11:00",
            title: "Check-out",
            description: "Your guests roll out. Your calendar already told us — no texts, no reminders.",
            image: photo(
                "turnover-checkout",
                1152,
                864,
                "A mint suitcase and a straw beach tote waiting inside an open front door, a pink breezeway and palms beyond",
            ),
        },
        {
            time: "11:20",
            title: "Crew arrives",
            description: "Two cleaners, one cart, the unit's own checklist. Strip, wash, wipe, reset.",
            image: photo(
                "turnover-kitchen",
                1152,
                864,
                "A spotless white kitchen with a bowl of fresh fruit on the island and sun across the counters",
            ),
        },
        {
            time: "1:45",
            title: "Stocked & staged",
            description:
                "Fresh towels rolled, toiletries topped up from your closet, the coffee station set.",
            image: photo(
                "turnover-bath",
                1152,
                864,
                "A bright bathroom with rolled white towels, stocked toiletries, and a pink hand towel by the sink",
            ),
        },
        {
            time: "2:40",
            title: "Photo checklist sent",
            description:
                "Forty-plus photos to your phone: every bed, every bath, anything that needs your eyes.",
            image: photo(
                "turnover-bed",
                1152,
                864,
                "A hotel-tight white bed with a hot-pink pillow and folded towels, palm shadows on the wall",
            ),
        },
        {
            time: "4:00",
            title: "Check-in",
            description: "Your next guest walks into a place that looks like the listing photos. Five stars.",
            image: photo(
                "turnover-checkin",
                1152,
                864,
                "A white sofa with an aqua and pink throw and a welcome tray with water and keys on the coffee table",
            ),
        },
    ],
}

export interface ChecklistItem {
    label: string
    /** One short line of proof under the label. */
    note: string
    /** Unticked items render an open box; default ticked. */
    checked?: boolean
}

/**
 * The door-hanger checklist the crew leaves on every handle — the home
 * page's thoroughness proof. Leave `items` empty to drop the section.
 */
export const roomReady: {
    kicker: string
    title: string
    cardTitle: string
    body: string
    photo?: SiteImage
    items: ChecklistItem[]
} = {
    kicker: "Proof on every door",
    title: "Room ready, or we come back.",
    cardTitle: "Room ready",
    body: "Hung on the handle at lock-up — and texted to you with photos.",
    photo: photo(
        "moveout-empty",
        1152,
        864,
        "A Clean Getaway cleaner in an aqua tracksuit mopping the gleaming floor of an empty high-rise condo overlooking Biscayne Bay",
    ),
    items: [
        { label: "Linens changed", note: "A fresh set every stay, hotel fold." },
        { label: "Restocked", note: "TP, soap, coffee — from your closet or ours." },
        { label: "Damage checked", note: "Anything off is photographed and reported within the hour." },
        { label: "Photos sent", note: "Every room, before your guest's ride lands." },
        { label: "Lockbox reset", note: "Code confirmed, keys counted, door double-checked." },
    ],
}

/** Extras and the host plan — the prices page's add-on cards. Empty drops the section. */
export const addOns: { icon: MarketingIconName; title: string; description: string }[] = [
    {
        icon: "calendar",
        title: "Host plan",
        description:
            "Eight or more turnovers a month? A dedicated crew, 10% off every clean, and we watch your Airbnb and VRBO calendars for you.",
    },
    {
        icon: "layers",
        title: "Laundry run",
        description:
            "Linens washed on-site, or swapped from our pickup service so the beds never wait — $25 a load.",
    },
    {
        icon: "star",
        title: "Restock from our shelf",
        description: "TP, soaps, coffee pods, and welcome snacks from our stock, at cost plus $10.",
    },
    {
        icon: "zap",
        title: "Inside oven & fridge",
        description: "Degreased and wiped down on any turnover — $35.",
    },
    {
        icon: "clock",
        title: "Late-checkout rescue",
        description:
            "Guest ran long? We re-slot a crew and still hit your check-in. No surcharge on the host plan.",
    },
    {
        icon: "shield",
        title: "Damage report",
        description: "Photos and a written note within the hour — ready for your platform claim.",
    },
]

/** The home proof gallery. Empty in this demo — fill to show a gallery with a lightbox. */
export const gallery: { caption: string; image: SiteImage }[] = []

export const about = {
    headline: "Two friends, one pink van, and a checklist.",
    photo: photo(
        "about-founders",
        1152,
        864,
        "Clean Getaway founders Marisol Vega and Dani Ferrer laughing on the tailgate of their pink van, supplies stacked behind them, in front of a Wynwood mural",
    ),
    paragraphs: [
        "Marisol Vega and Dani Ferrer started Clean Getaway in 2019 out of a hot-pink minivan in Wynwood, turning over their friends' Airbnbs between shifts. The rule they wrote on the dashboard that first summer still runs every job: the place has to look like the listing photos, and the host has to see the proof.",
        "Today it's eighteen cleaners in aqua tracksuits, seven days a week, from North Beach to Coral Gables. Every one is background-checked, trained on the same checklist, and paid well enough to stay — which is why hosts keep asking for them by name.",
        "We carry our own supplies, restock from yours, photograph every room, and report anything broken or missing within the hour. If something isn't right when your guest walks in, we come back and fix it free.",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "Licensed, bonded & insured",
        "Background-checked crew",
        "Photo proof every turnover",
        "Damage reports within the hour",
        "Free re-clean guarantee",
    ],
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
    kicker: "",
    title: "",
    intro: "",
    windows: [],
    note: "",
}

export const faq = [
    {
        question: "Can you do same-day turnovers?",
        answer: "Yes — that's most of what we do. Book by 10 AM for a same-day slot; a studio typically takes two hours and a two-bed under four, so an 11 AM check-out is ready well before a 4 PM check-in.",
    },
    {
        question: "Do you bring supplies?",
        answer: "Every crew rolls with its own cleaning products, vacuums, and mops. Guest supplies — TP, soap, coffee — we restock from your closet, or from our shelf at cost plus $10.",
    },
    {
        question: "How do you get in?",
        answer: "Lockbox, smart lock, or a building concierge — you share access once and we store it encrypted. After every clean we reset the lockbox, count the keys, and text you that the door is locked.",
    },
    {
        question: "What if something is damaged or missing?",
        answer: "We photograph it, write it up, and send it to you within the hour — timestamped and ready for your platform claim. If we break something, we tell you first and we cover it.",
    },
    {
        question: "What if my guest checks out late?",
        answer: "Text us and we re-slot the crew. On the host plan there's no surcharge; one-off turnovers pay a flat $20 when we have to split a crew to still make your check-in.",
    },
    {
        question: "Do you keep up with my booking calendar?",
        answer: "On the host plan we do: share your Airbnb or VRBO calendar link and our office schedules a crew for every check-out and flags same-day flips — you don't have to book each clean.",
    },
    {
        question: "What does a move-out deep clean include?",
        answer: "Everything a landlord checks: inside the oven, fridge, and cabinets, baseboards, blinds, window tracks, and every fixture. We price by size before we book — from $260 for a one-bed.",
    },
]

/**
 * The appointments contract's code fallback — the same booking mode 2 the
 * care pack runs (web/app/src/View/Landing/practiceDocument.ts): visit
 * types x weekly availability windows, projected into concrete capacity-1
 * slots by `generateAppointmentSlots`. The catalog's `content.appointments`
 * seed mirrors this export exactly (the content tests pin the twin).
 *
 * The turnover trade books the front of the relationship: the walkthrough
 * that sets a unit's checklist, and the first turnover that starts the
 * rhythm. Standing turnovers are scheduled by the office from the host's
 * calendar — only these two visit kinds go on the public calendar. One
 * provider — Marisol still walks every new unit — Monday to Saturday.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "walkthrough",
            name: "Unit walkthrough",
            durationMinutes: 30,
            description:
                "We walk the unit with you — in person or on video — note the host quirks, and set your checklist.",
        },
        {
            typeId: "first-turnover",
            name: "First turnover",
            durationMinutes: 180,
            description:
                "Your first full turnover: a deep reset, the photo checklist, and your restock list started.",
        },
    ],
    providers: [
        {
            providerId: "marisol-vega",
            name: "Marisol Vega",
            windows: [
                { day: 1, start: 9 * 60, end: 15 * 60 },
                { day: 2, start: 9 * 60, end: 15 * 60 },
                { day: 3, start: 9 * 60, end: 15 * 60 },
                { day: 4, start: 9 * 60, end: 15 * 60 },
                { day: 5, start: 9 * 60, end: 15 * 60 },
                { day: 6, start: 9 * 60, end: 15 * 60 },
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
    headline: "Grab a walkthrough or your first turnover",
    intro: "Pick a time for a unit walkthrough or your first turnover and you'll get a confirmation with a one-click cancel link. Rather write first? The form below reaches the same crew.",
    /** The new/returning select's trade voice (the widget's statusLabels). */
    statusLabels: { new: "New to Clean Getaway", returning: "Returning host" },
    privacyNote:
        "Just what we need to hold the slot — lockbox codes and access notes go in the form below, never in a text thread.",
}

export const book = {
    headline: "Book a turnover. Keep your weekends.",
    body: "Tell us about the place, your check-out and check-in times, and whether it's a one-off or every stay — we reply within the hour, 8 AM to 8 PM, with a flat price and a crew.",
    confirmation:
        "Got it — your request is in. We reply within the hour (8 AM–8 PM) with a flat price and your crew's first opening.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "phone", label: "Phone", type: "tel" as const, required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        {
            name: "address",
            label: "Property address",
            required: true,
            placeholder: "Building, unit, neighborhood",
        },
        {
            name: "size",
            label: "Bedrooms / baths",
            type: "select" as const,
            options: ["Studio", "1 bed / 1 bath", "2 bed / 2 bath", "3 bed / 2 bath", "4+ bedrooms"],
        },
        {
            name: "service",
            label: "One-off or recurring?",
            type: "select" as const,
            options: ["Every stay (host plan)", "One-off turnover", "Move-out deep clean"],
        },
        { name: "checkout", label: "Guest check-out time", placeholder: "11:00 AM" },
        { name: "checkin", label: "Next check-in time", placeholder: "4:00 PM" },
        {
            name: "access",
            label: "Access notes",
            placeholder: "Lockbox, smart lock, concierge, parking…",
        },
        {
            name: "restock",
            label: "Restock needs",
            placeholder: "Coffee pods, TP, welcome snacks…",
        },
        {
            name: "notes",
            label: "Anything else",
            type: "textarea" as const,
            fullWidth: true,
            placeholder: "Listing link, host quirks, the drawer the remote hides in…",
        },
    ],
}
