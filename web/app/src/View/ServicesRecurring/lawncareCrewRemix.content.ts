/**
 * The lawn-care remix seed: a complete, drop-in replacement for
 * `./content.ts` that retargets the recurring-services pack from the
 * turnover cleaner to Fresh Cut, an Atlanta lawn crew — same subscription
 * shape, different trade. The derived template `repobot-services-lawncare`
 * is composed from the services-recurring pack with this file copied over
 * `content.ts`, and `packs/services-lawncare-crew/catalog.json` pins the
 * gameday register (striped-lawn ground, white condensed block type, one
 * volt accent) with its own brand overlay and pages.
 *
 * The story is the pack's turnover pair, retraded: the season is the rail
 * (spring pre-emergent to winter cleanup) and what's in a cut is the
 * checklist. The hero runs full-bleed over the crew photograph, and every
 * plan carries a ticket `stub`, so the plans print as season tickets.
 *
 * Because the copy is verbatim, this file must stay a structural twin of
 * `content.ts`: same exports, same relative imports, images under its own
 * `/services-lawncare-crew/` public directory. The parity test
 * (`tests/View/ServicesRecurring/remixSeeds.test.ts`) pins the export
 * surface against the real module, so the seed fails CI the moment the
 * pack's contract moves without it.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/services-lawncare` (see PACK.md). The `photo` helper
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
        src: `/services-lawncare-crew/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/services-lawncare-crew/${name}-${step}w.webp`, width: step })),
    }
}

export const business = {
    name: "Fresh Cut Lawn Co.",
    tagline: "Weekly lawn care & season passes",
    location: "Atlanta, Georgia",
    /** Shown everywhere the number appears; `phoneHref` is the tap target. */
    phone: "(404) 555-0187",
    phoneHref: "tel:+14045550187",
    email: "crew@freshcutatl.example",
    address: "1015 Boulevard SE, Suite 4, Atlanta, GA 30312",
    /** The trust line — rendered wherever trust is being earned. */
    license: "Licensed & insured in Georgia — every crew background-checked",
}

/**
 * Weekly hours: when the crews roll and the phone answers. Minutes since
 * midnight; a day may have several intervals. (With `home.badge` empty the
 * hero shows a live "Open now" badge computed from these instead.)
 */
export const weeklyHours: DayHours[] = [
    { day: 1, intervals: [[420, 1140]] }, // Mon 7 AM – 7 PM
    { day: 2, intervals: [[420, 1140]] },
    { day: 3, intervals: [[420, 1140]] },
    { day: 4, intervals: [[420, 1140]] },
    { day: 5, intervals: [[420, 1140]] },
    { day: 6, intervals: [[420, 1140]] }, // Sat
]

export const hoursNote = "Crews out Monday–Saturday, 7 AM–7 PM · Rain days roll to the next dry one"

/** The neighborhoods the crews actually drive to. */
export const serviceArea = [
    "Kirkwood",
    "Grant Park",
    "Virginia-Highland",
    "Decatur",
    "West End",
    "Old Fourth Ward",
    "East Point",
]

/**
 * Landing copy the trade owns: the few strings the landing and shell
 * modules render that would read wrong for a different trade. Remix seeds
 * retrade these along with the rest of the content — everything else in
 * those modules is trade-neutral on purpose.
 */
export const landingCopy = {
    /** The nav wordmark; empty = the business name. */
    navName: "Fresh Cut",
    /** A small line under the nav wordmark ("Atlanta", "Pest Co."); empty = none. */
    navTagline: "Atlanta",
    /** The booking ask — the shell's nav CTA and every landing CTA. */
    bookCtaLabel: "Book a cut",
    /** The prices page's nudge for the undecided. */
    fitNudgeTitle: "Weekly or biweekly? Send us your address.",
    /** The about page's credentials-strip label. */
    credentialsLabel: "Why Atlanta hands us the gate code",
    /** The price tiles' header (home and prices page) and the unit after each price. */
    pricesKicker: "Pick your plan",
    pricesTitle: "",
    pricePeriod: "/cut",
    /** The testimonials kicker. */
    reviewsKicker: "From the stands",
    /** The home page's closing banner; the posted hours follow the body. */
    homeBannerTitle: "Game day is Saturday. Your lawn's ready Friday.",
    homeBannerBody: "Book by Wednesday and your first cut lands this week.",
    /** The prices page's opening statement. */
    plansHeadline: "Season tickets. Three ways in.",
    plansSubheadline:
        "Every cut runs the same five moves — mow, edge, trim, blow, stripe. The price moves with how often we come, never with the size of the argument over the fence line. Lots over half an acre get a flat quote first.",
    /** The prices page's closing banner body, under `fitNudgeTitle`. */
    fitNudgeBody: `Most yards start biweekly in March and go weekly when the Bermuda wakes up in May. Call ${business.phone} and a crew lead walks it with you.`,
    /** The prices page's add-ons header (shown when `addOns` is filled). */
    addOnsKicker: "Add-ons",
    addOnsTitle: "Extra innings, priced flat",
    /** The about page's three proof bullets. */
    aboutBullets: [
        "Licensed & insured in Georgia",
        "Same crew, same day, every week",
        "Free re-cut if we miss a spot",
    ],
    /** The about page's closing banner. */
    aboutBannerTitle: "Meet your crew this week.",
    /** The book page's form title. */
    bookFormTitle: "Your yard, your gate, your day",
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

/** The season tickets — the home page's price tiles and the prices page. */
export const plans: Plan[] = [
    {
        slug: "weekly",
        name: "Weekly",
        perVisit: 45,
        description: "Every week",
        features: ["Mow, edge, trim & blow", "Striped every visit", "Same crew, same day"],
        stub: "FC-ATL-7D",
    },
    {
        slug: "biweekly",
        name: "Biweekly",
        perVisit: 55,
        description: "Every 2 weeks",
        features: ["Mow, edge, trim & blow", "Clippings hauled on request", "Skip a cut, no fee"],
        stub: "FC-ATL-14D",
    },
    {
        slug: "season-pass",
        name: "Season pass",
        perVisit: 1400,
        period: "/season",
        description: "Full season. Full coverage.",
        features: [
            "Weekly cuts, March to November",
            "Pre-emergent & fall aeration",
            "Winter cleanup included",
        ],
        highlighted: true,
        badge: "Best seat",
        stub: "FC-ATL-SEASON",
    },
]

/**
 * The home page's what's-included icon list. Empty in this seed — the
 * what's-in-a-cut checklist (`roomReady`) carries that proof instead.
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
 * with (the pests, the weeds), before the prices. Empty in this seed — the
 * season rail tells this story.
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
    columns: ["", "Weekly", "Biweekly", "Season pass"],
    rows: [
        { label: "Mow, edge, string-trim & blow", values: [true, true, true] },
        { label: "Striped finish", values: [true, true, true] },
        { label: "Visit rhythm", values: ["Every 7 days", "Every 14 days", "Weekly, Mar–Nov"] },
        { label: "Spring pre-emergent", values: ["Add-on", "Add-on", true] },
        { label: "Fall core aeration & overseed", values: ["Add-on", "Add-on", true] },
        { label: "Leaf season cleanup", values: ["Add-on", "Add-on", true] },
        { label: "Winter cleanup visits", values: [false, false, true] },
        { label: "Rain-day reschedule", values: [true, true, true] },
        { label: "Skip a cut with 48 hours' notice", values: [true, true, false] },
    ],
}

/** The trust-numbers strip. Empty in this seed — fill to show it on the home page. */
export const metrics: { value: string; label: string }[] = []

export const testimonials = [
    {
        quote: "Our corner lot in Kirkwood finally has stripes the neighbors slow down for. Same crew every Thursday, gate latched, not a clipping on the porch.",
        name: "Tasha Greene",
        detail: "Weekly · Kirkwood",
    },
    {
        quote: "Bought the season pass in March. Pre-emergent went down before the crabgrass knew what happened, and October's aeration brought the zoysia all the way back.",
        name: "Daniel Okafor",
        detail: "Season pass · Decatur",
    },
    {
        quote: "Storms washed out Tuesday. They texted, showed up Wednesday at seven, and still edged the driveway like a ruler.",
        name: "Rosa Delgado",
        detail: "Biweekly · East Point",
    },
    {
        quote: "I rent out the Old Fourth Ward house and never think about the yard anymore. The after photo lands before I finish lunch.",
        name: "Kevin Tran",
        detail: "Weekly · Old Fourth Ward",
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
    headline: "Every lawn, game day ready.",
    subheadline:
        "Atlanta's lawn care crew — weekly cuts striped on every pass, and season passes from spring pre-emergent to winter cleanup.",
    heroImage: photo(
        "hero-crew",
        2400,
        1350,
        "Three Fresh Cut crew members in plain white tees and volt-yellow caps — a Black woman standing on a black zero-turn mower and two men beside it, arms crossed — on a freshly striped lawn",
    ),
    /**
     * The hero sticker (a tilted signature under the gameday register).
     * Leave it empty to show a live "Open now" badge from `weeklyHours`
     * instead.
     */
    badge: "Built in Atlanta",
    /** The hero's second ask, linking to the prices page. Empty = a call button. */
    pricesCta: "See all plans",
    layout: "full-bleed",
    credit: "Fast. Fresh. Relentless.",
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
 * The season, month by month — the home page's timeline rail. Leave
 * `steps` empty to drop the section.
 */
export const turnover: { kicker: string; title: string; steps: TurnoverStep[] } = {
    kicker: "The season",
    title: "Four quarters. One standard.",
    steps: [
        {
            time: "Feb–Mar",
            title: "Spring pre-emergent",
            description:
                "Down before the soil hits 55°, so crabgrass never gets a start. First cut the week the Bermuda greens.",
            image: photo(
                "season-spring",
                1152,
                864,
                "A Fresh Cut crew member in a white tee and volt cap pushing a spreader across a greening front lawn under a tree in spring bloom",
            ),
        },
        {
            time: "Apr–Sep",
            title: "Summer weekly",
            description:
                "Bermuda and zoysia at their peak: mowed at the right height, edged, and striped every seven days.",
            image: photo(
                "season-summer",
                1152,
                864,
                "A zero-turn mower laying a fresh stripe across a deep green lawn under a blue summer sky",
            ),
        },
        {
            time: "Oct",
            title: "Fall aeration",
            description:
                "Core aeration and overseed where it's thin — the lawn's off-season training camp before the cold.",
            image: photo(
                "season-fall",
                1152,
                864,
                "Rows of fresh aeration plugs across a green lawn scattered with orange and red fall leaves, the aerator behind",
            ),
        },
        {
            time: "Nov–Jan",
            title: "Winter cleanup",
            description:
                "Leaves mulched or hauled, beds cleared, pine straw refreshed. The yard sleeps clean.",
            image: photo(
                "season-winter",
                1152,
                864,
                "A crew member in a volt beanie blowing a drift of oak leaves off a lawn in front of a brick ranch house",
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
 * What's in a cut — the card the crew texts after every visit, the home
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
    kicker: "What's in a cut",
    title: "Five moves. Every visit.",
    cardTitle: "The cut card",
    body: "Ticked at the curb before the trailer pulls off — and texted to you with an after photo.",
    photo: photo(
        "checklist-edge",
        1152,
        864,
        "Close on a string trimmer cutting a razor-straight edge where the lawn meets the sidewalk",
    ),
    items: [
        { label: "Mowed", note: "Blade height set for your grass — Bermuda low, fescue high." },
        { label: "Edged", note: "Driveway, walks, and curb cut to a clean line." },
        { label: "Trimmed", note: "String-trimmed around beds, fences, and the mailbox post." },
        { label: "Blown clean", note: "Clippings off every hard surface. Nothing tracked inside." },
        { label: "Striped", note: "A crosscut pattern on every pass — game day, every week." },
        { label: "Gate latched", note: "Checked twice, photo sent. The dog stays in." },
    ],
}

/** Extras and one-off jobs — the prices page's add-on cards. Empty drops the section. */
export const addOns: { icon: MarketingIconName; title: string; description: string }[] = [
    {
        icon: "layers",
        title: "Leaf season cleanup",
        description:
            "Every leaf mulched or hauled, beds and gutters' worth of pine straw cleared — $120 a visit.",
    },
    {
        icon: "sliders",
        title: "Core aeration & overseed",
        description: "Pulled plugs and fresh seed where it's thin, best in October — $185 on most yards.",
    },
    {
        icon: "shield",
        title: "Pre-emergent treatment",
        description: "Crabgrass stopped before it sprouts, February through March — $65 a treatment.",
    },
    {
        icon: "star",
        title: "Hedge & shrub trim",
        description: "Boxwoods squared, hollies shaped, clippings gone — $75 an hour.",
    },
    {
        icon: "zap",
        title: "Pine straw refresh",
        description: "Long-needle straw tucked around every bed — $8 a bale, spread.",
    },
    {
        icon: "calendar",
        title: "Game day touch-up",
        description: "Party Saturday? A same-week cut, edge, and blow on top of your plan — $35.",
    },
]

/** The home proof gallery. Empty in this seed — fill to show a gallery with a lightbox. */
export const gallery: { caption: string; image: SiteImage }[] = []

export const about = {
    headline: "Two friends, one zero-turn, and a straight line.",
    photo: photo(
        "about-founders",
        1152,
        864,
        "Fresh Cut founders Andre Whitfield and Lucía Paredes in white tees and volt caps, arms crossed and smiling beside their pickup and mower trailer on a tree-lined street",
    ),
    paragraphs: [
        "Andre Whitfield and Lucía Paredes started Fresh Cut in 2018 with a borrowed mower and six yards in Grant Park. The rule they painted on the trailer that first summer still runs every cut: leave a line you'd put on a jersey, and send the owner the photo.",
        "Today it's five crews in plain white tees and volt caps, Monday through Saturday, from Virginia-Highland to East Point. Every crew member is background-checked, trained on the same five moves, and paid well enough to stay — which is why yards keep asking for the same crew by name.",
        "We bring our own equipment, set the blade for your grass, latch every gate twice, and text an after photo from the curb. If a spot gets missed, we come back and re-cut it free.",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "Licensed & insured in Georgia",
        "Background-checked crews",
        "Same crew every week",
        "After photo every cut",
        "Free re-cut guarantee",
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
        question: "What happens on a rain day?",
        answer: "Mowing wet grass tears it, so we don't. Your cut rolls to the next dry day — usually the day after — and you get a text with the new time. Rain never costs you a cut on any plan.",
    },
    {
        question: "Bermuda or zoysia — does it change anything?",
        answer: "The blade height and the rhythm. Bermuda gets cut low (about an inch and a half) and weekly at its summer peak; zoysia a touch higher and it forgives a biweekly plan. Not sure what you've got? We'll tell you on the yard walk.",
    },
    {
        question: "Do you handle leaf season?",
        answer: "Yes. The season pass includes fall and winter cleanup visits. On weekly or biweekly plans, leaf cleanup is a flat $120 add-on per visit from November through January — mulched into the lawn or hauled away, your call.",
    },
    {
        question: "Do I need to be home? What about the gate?",
        answer: "No need to be home. Share the gate code or latch once and we keep it in your file, never in a text thread. Every crew checks the latch twice, and the after photo includes the closed gate — dogs stay in.",
    },
    {
        question: "Can I pause or skip a cut?",
        answer: "On weekly and biweekly plans, skip any cut with 48 hours' notice at no charge. The season pass is one flat price, March to November, and covers every visit on the calendar.",
    },
]

/**
 * The appointments contract's code fallback — the same booking mode 2 the
 * care pack runs (web/app/src/View/Landing/practiceDocument.ts): visit
 * types x weekly availability windows, projected into concrete capacity-1
 * slots by `generateAppointmentSlots`. The catalog's `content.appointments`
 * seed mirrors this export exactly (the content tests pin the twin).
 *
 * The lawn trade books the front of the relationship: the yard walk that
 * sets the blade height and the quote, and the first cut that starts the
 * rhythm. Recurring cuts are scheduled by the office — only these two
 * visit kinds go on the public calendar. One provider — Andre still walks
 * every new yard — Monday to Saturday.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "yard-walk",
            name: "Yard walk & quote",
            durationMinutes: 30,
            description:
                "We walk the yard with you, name the grass, set the blade height, and quote the plan on the spot.",
        },
        {
            typeId: "first-cut",
            name: "First cut",
            durationMinutes: 90,
            description:
                "Your first full cut: mow, edge, trim, blow, and stripe — with the after photo from the curb.",
        },
    ],
    providers: [
        {
            providerId: "andre-whitfield",
            name: "Andre Whitfield",
            windows: [
                { day: 1, start: 8 * 60, end: 16 * 60 },
                { day: 2, start: 8 * 60, end: 16 * 60 },
                { day: 3, start: 8 * 60, end: 16 * 60 },
                { day: 4, start: 8 * 60, end: 16 * 60 },
                { day: 5, start: 8 * 60, end: 16 * 60 },
                { day: 6, start: 8 * 60, end: 13 * 60 },
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
    headline: "Grab a yard walk or your first cut",
    intro: "Pick a time for a yard walk or your first cut and you'll get a confirmation with a one-click cancel link. Rather write first? The form below reaches the same crew lead.",
    /** The new/returning select's trade voice (the widget's statusLabels). */
    statusLabels: { new: "New to Fresh Cut", returning: "Returning customer" },
    privacyNote:
        "We only use this to hold your slot. Gate codes and pet notes go in the form below and stay with your crew lead.",
}

export const book = {
    headline: "Book a cut. Keep your Saturdays.",
    body: "Tell us where the yard is, what's growing, and how often you want us — we reply the same day, Monday to Saturday, with a flat price and your crew's first open slot.",
    confirmation:
        "You're on the schedule request list. A crew lead replies today (7 AM–7 PM) with a flat price and your first cut date.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "phone", label: "Phone", type: "tel" as const, required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        {
            name: "address",
            label: "Street address",
            required: true,
            placeholder: "Street, neighborhood",
        },
        {
            name: "lot",
            label: "Lot size",
            type: "select" as const,
            options: ["Under 1/8 acre", "1/8–1/4 acre", "1/4–1/2 acre", "Over 1/2 acre", "Not sure"],
        },
        {
            name: "plan",
            label: "Which plan?",
            type: "select" as const,
            options: ["Weekly — $45 a cut", "Biweekly — $55 a cut", "Season pass — $1,400", "Not sure yet"],
        },
        {
            name: "grass",
            label: "Grass type",
            type: "select" as const,
            options: ["Bermuda", "Zoysia", "Fescue", "Not sure"],
        },
        {
            name: "gate",
            label: "Gate & pet notes",
            placeholder: "Side gate code, the dog's name…",
        },
        {
            name: "notes",
            label: "Anything else",
            type: "textarea" as const,
            fullWidth: true,
            placeholder: "Problem spots, the neighbor's fence line, when the sprinklers run…",
        },
    ],
}
