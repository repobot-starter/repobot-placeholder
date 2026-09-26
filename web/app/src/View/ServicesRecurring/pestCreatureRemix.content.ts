/**
 * The pest-control remix seed: a complete, drop-in replacement for
 * `./content.ts` that retargets the recurring-services pack from the
 * turnover cleaner to Night Crawlers Pest Co., a Houston exterminator —
 * same subscription shape, different trade. The derived template
 * `repobot-services-pest` is composed from the services-recurring pack
 * with this file copied over `content.ts`, and
 * `packs/services-pest-creature/catalog.json` pins the creature register (a 1950s
 * creature-feature one-sheet: acid green, blood orange, and cream on
 * midnight) with its own brand overlay and pages.
 *
 * The story is the pack's turnover pair, retraded: the treatment is the
 * rail (four reels, from the sighting to the treatment) and the service
 * ticket is the checklist, with the specimen board as the creature index
 * before the plans. The hero runs as a masthead over the painted poster,
 * its credit the billing block.
 *
 * Because the copy is verbatim, this file must stay a structural twin of
 * `content.ts`: same exports, same relative imports, images under its own
 * `/services-pest-creature/` public directory. The parity test
 * (`tests/View/ServicesRecurring/remixSeeds.test.ts`) pins the export
 * surface against the real module, so the seed fails CI the moment the
 * pack's contract moves without it.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/services-pest` (see PACK.md). The `photo` helper mirrors
 * that verb's naming exactly. Never point a slot at a raw camera file.
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
        src: `/services-pest-creature/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/services-pest-creature/${name}-${step}w.webp`, width: step })),
    }
}

export const business = {
    name: "Night Crawlers Pest Co.",
    tagline: "Roaches, termites, rodents & mosquitoes",
    location: "Houston, Texas",
    /** Shown everywhere the number appears; `phoneHref` is the tap target. */
    phone: "(713) 555-0166",
    phoneHref: "tel:+17135550166",
    email: "dispatch@nightcrawlerspest.example",
    address: "3302 Canal St, Suite 9, Houston, TX 77003",
    /** The trust line — rendered wherever trust is being earned. */
    license: "Licensed by the Texas Department of Agriculture · Fully insured",
}

/**
 * Weekly hours: when dispatch answers and the trucks roll. Minutes since
 * midnight; a day may have several intervals. (With `home.badge` empty the
 * hero shows a live "Open now" badge computed from these instead.)
 */
export const weeklyHours: DayHours[] = [
    { day: 1, intervals: [[420, 1140]] }, // Mon 7 AM – 7 PM
    { day: 2, intervals: [[420, 1140]] },
    { day: 3, intervals: [[420, 1140]] },
    { day: 4, intervals: [[420, 1140]] },
    { day: 5, intervals: [[420, 1140]] },
    { day: 6, intervals: [[480, 960]] }, // Sat 8 AM – 4 PM
]

export const hoursNote = "Dispatch Monday–Saturday from 7 AM · Same-week service across Houston"

/** The neighborhoods the trucks actually drive to. */
export const serviceArea = ["The Heights", "Montrose", "Third Ward", "EaDo", "Bellaire", "Pearland", "Katy"]

/**
 * Landing copy the trade owns: the few strings the landing and shell
 * modules render that would read wrong for a different trade. Remix seeds
 * retrade these along with the rest of the content — everything else in
 * those modules is trade-neutral on purpose.
 */
export const landingCopy = {
    /** The nav wordmark; empty = the business name. */
    navName: "Night Crawlers",
    /** A small line under the nav wordmark ("Atlanta", "Pest Co."); empty = none. */
    navTagline: "Pest Co.",
    /** The booking ask — the shell's nav CTA and every landing CTA. */
    bookCtaLabel: "Book a treatment",
    /** The prices page's nudge for the undecided. */
    fitNudgeTitle: "Not sure what you've got? Send us a photo of it.",
    /** The about page's credentials-strip label. */
    credentialsLabel: "Why Houston lets us under the sink",
    /** The price tiles' header (home and prices page) and the unit after each price. */
    pricesKicker: "Now showing",
    pricesTitle: "Plans that keep them gone.",
    pricePeriod: "/mo",
    /** The testimonials kicker. */
    reviewsKicker: "Survivor stories",
    /** The home page's closing banner; the posted hours follow the body. */
    homeBannerTitle: "Seen one? There are more. Book this week.",
    homeBannerBody: "Call by Thursday for a same-week treatment.",
    /** The prices page's opening statement. */
    plansHeadline: "Pick your protection.",
    plansSubheadline:
        "Every plan starts with a full inspection and a sealed-up house, and every plan re-treats free between visits. The price moves with what you're fighting — roaches and ants, the whole rogues' gallery, or Houston's mosquito season.",
    /** The prices page's closing banner body, under `fitNudgeTitle`. */
    fitNudgeBody: `Most Houston homes start on Quarterly Shield and add termite stations before the May swarms. Call ${business.phone} and a technician walks it with you.`,
    /** The prices page's add-ons header (shown when `addOns` is filled). */
    addOnsKicker: "Special features",
    addOnsTitle: "One-time jobs, priced up front",
    /** The about page's three proof bullets. */
    aboutBullets: [
        "Texas-licensed technicians",
        "Pet- and kid-safe products first",
        "Free re-treats between visits",
    ],
    /** The about page's closing banner. */
    aboutBannerTitle: "Meet your technician this week.",
    /** The book page's form title. */
    bookFormTitle: "Tell us what crawled out",
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

/** The plans — the home page's price tiles and the prices page. Billed monthly. */
export const plans: Plan[] = [
    {
        slug: "quarterly-shield",
        name: "Quarterly Shield",
        perVisit: 39,
        pricePrefix: "From",
        description: "Roaches, ants, spiders & the usual suspects.",
        features: [
            "Inside & outside treatment every 3 months",
            "Free re-treats between visits",
            "Pet- and kid-safe products",
        ],
    },
    {
        slug: "home-defender",
        name: "Home Defender",
        perVisit: 59,
        description: "The whole rogues' gallery, termites included.",
        features: [
            "Everything in Quarterly Shield",
            "Termite monitoring stations",
            "Rodent bait & entry-point checks",
        ],
        highlighted: true,
        badge: "Top billing",
    },
    {
        slug: "mosquito-season",
        name: "Mosquito Season",
        perVisit: 49,
        description: "Your backyard back, April to October.",
        features: [
            "Monthly barrier spray, April–October",
            "Standing-water sweep every visit",
            "Re-spray free if they're back",
        ],
    },
]

/**
 * The home page's what's-included icon list. Empty in this seed — the
 * service ticket (`roomReady`) carries that proof instead.
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
 * The creature index: portrait plates of Houston's usual suspects, before
 * the prices. Leave `items` empty to drop the section.
 */
export const specimens: { kicker: string; title: string; items: Specimen[] } = {
    kicker: "The creature index",
    title: "Know your monster.",
    items: [
        {
            name: "American cockroach",
            meta: "Periplaneta americana",
            description:
                "The “palmetto bug.” Lives in drains and crawlspaces, flies in August. Baited inside and out on every plan.",
            image: photo(
                "creature-roach",
                864,
                1152,
                "A painted pulp-poster cockroach rearing up on its legs in an eerie green glow on a kitchen floor",
            ),
        },
        {
            name: "Formosan termite",
            meta: "Coptotermes formosanus",
            description:
                "Swarms on humid May evenings and eats a house quietly. Stations on Home Defender; sale inspections in 48 hours.",
            image: photo(
                "creature-termite",
                864,
                1152,
                "A painted winged termite bursting out of splintered wood with a swarm glowing behind it",
            ),
        },
        {
            name: "Roof rat",
            meta: "Rattus rattus",
            description:
                "Rides the live oaks onto the roof and into the attic. We find the gap, seal it, and trap until it's quiet.",
            image: photo(
                "creature-rat",
                864,
                1152,
                "A painted rat with glowing eyes creeping along an attic rafter under a round green-lit vent",
            ),
        },
        {
            name: "Asian tiger mosquito",
            meta: "Aedes albopictus",
            description:
                "Bites by day, breeds in a bottle cap of water. Monthly barrier spray from April to October.",
            image: photo(
                "creature-mosquito",
                864,
                1152,
                "A giant painted mosquito looming over a backyard birdbath and fence under a blood-orange sky",
            ),
        },
        {
            name: "Red imported fire ant",
            meta: "Solenopsis invicta",
            description:
                "Mounds overnight after every rain. Yard broadcast plus mound treatments, pet-safe once dry.",
            image: photo(
                "creature-fireant",
                864,
                1152,
                "A giant painted red fire ant marching out of a towering mound at night, a column of ants behind it",
            ),
        },
    ],
}

/**
 * The prices page's line-by-line comparison. `columns` heads the table
 * (first entry is the criterion column); each row carries one value per
 * plan — booleans render as ✓ / —.
 */
export const planComparison = {
    columns: ["", "Quarterly Shield", "Home Defender", "Mosquito Season"],
    rows: [
        { label: "Roaches, ants & spiders", values: [true, true, false] },
        { label: "Inside & outside treatment", values: ["Every 3 months", "Every 3 months", false] },
        { label: "Free re-treats between visits", values: [true, true, true] },
        { label: "Termite monitoring stations", values: [false, true, false] },
        { label: "Rodent bait & entry-point checks", values: ["Add-on", true, false] },
        { label: "Mosquito barrier spray", values: ["Add-on", "Add-on", "Monthly, Apr–Oct"] },
        { label: "Pet- and kid-safe products", values: [true, true, true] },
        { label: "Same-week first visit", values: [true, true, true] },
    ],
}

/** The trust-numbers strip. Empty in this seed — fill to show it on the home page. */
export const metrics: { value: string; label: string }[] = []

export const testimonials = [
    {
        quote: "A roach the size of my thumb ran out from under the sink at midnight. Night Crawlers came Tuesday, sealed the pipe gap, and I haven't seen one since March.",
        name: "Brianna Collins",
        detail: "Quarterly Shield · The Heights",
    },
    {
        quote: "We needed a termite letter for our Bellaire sale in five days. Inspection Monday, clean report Wednesday, closing on schedule.",
        name: "Héctor Villarreal",
        detail: "Termite inspection · Bellaire",
    },
    {
        quote: "Something was running laps in the attic. They found the gap behind the dryer vent, closed it, and checked the traps every week until it went quiet.",
        name: "Grace Liu",
        detail: "Home Defender · Montrose",
    },
    {
        quote: "By June our Pearland backyard was unusable. One month on the mosquito plan and the kids are out there after dinner again.",
        name: "Marcus & Tanya Reed",
        detail: "Mosquito Season · Pearland",
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
    headline: "They came from under the sink!",
    subheadline:
        "Houston's pest crew — roaches, termites, rodents, and mosquitoes, sent packing with pet-safe treatments.",
    heroImage: photo(
        "hero-poster",
        2400,
        1350,
        "A painted 1950s creature-feature scene: a giant cockroach looms over a lamp-lit Houston ranch house under a green moon while an exterminator with a sprayer tank stands in a car's headlights",
    ),
    /**
     * The hero sticker (a starburst under the creature register). Leave it
     * empty to show a live "Open now" badge from `weeklyHours` instead.
     */
    badge: "Now playing in Houston",
    /** The hero's second ask, linking to the prices page. Empty = a call button. */
    pricesCta: "See plans",
    layout: "masthead",
    credit: "Starring: quarterly plans from $39/mo · free re-treats · same-week service",
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
 * The treatment in four reels — the home page's timeline rail. Leave
 * `steps` empty to drop the section.
 */
export const turnover: { kicker: string; title: string; steps: TurnoverStep[] } = {
    kicker: "How we fight back",
    title: "Four reels. No sequel.",
    steps: [
        {
            time: "Reel 1",
            title: "The sighting",
            description:
                "You spot one in the kitchen light. Call or book online — a technician is out the same week.",
            image: photo(
                "step-safe",
                1152,
                864,
                "A painted 1950s family and their golden retriever on the living-room sofa, startled by a cockroach crossing the rug",
            ),
        },
        {
            time: "Reel 2",
            title: "Inspect",
            description:
                "A flashlight tour of every sink, attic hatch, and weep hole. You get the map of how they're getting in.",
            image: photo(
                "step-inspect",
                1152,
                864,
                "A painted exterminator kneeling at an open sink cabinet, flashlight beam catching roaches under the pipes",
            ),
        },
        {
            time: "Reel 3",
            title: "Seal",
            description:
                "Gaps at pipes, vents, and door sweeps closed with copper mesh and sealant. No way back in.",
            image: photo(
                "step-seal",
                1152,
                864,
                "A painted gloved hand sealing a gap around a pipe in a brick wall at dusk",
            ),
        },
        {
            time: "Reel 4",
            title: "Treat",
            description:
                "Baits inside, a barrier outside, dust in the wall voids — targeted, never fogged. Back? We re-treat free.",
            image: photo(
                "step-treat",
                1152,
                864,
                "A painted exterminator spraying a glowing barrier along a brick house's foundation under a full moon",
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
 * The service ticket the technician leaves on the counter — the home
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
    kicker: "The treatment checklist",
    title: "Nothing gets past the ticket.",
    cardTitle: "Service ticket",
    body: "Left on your counter after every visit — and texted with photos of every spot we treated.",
    photo: photo(
        "checklist-tech",
        1152,
        864,
        "A painted Night Crawlers technician in a cream coverall and cap, sprayer tank on her back, smiling on a lamp-lit porch with a clipboard",
    ),
    items: [
        {
            label: "Kitchen & baths baited",
            note: "Gel bait under sinks, behind appliances, in cabinet hinges.",
        },
        { label: "Entry points sealed", note: "Pipe gaps, dryer vent, and door sweeps checked and closed." },
        {
            label: "Exterior barrier",
            note: "Foundation, eaves, and window frames — three feet up, three out.",
        },
        { label: "Weep holes screened", note: "The brick's little doors, shut to roaches for good." },
        { label: "Yard sweep", note: "Standing water dumped, fire ant mounds treated." },
        { label: "Pets & kids all-clear", note: "Products dry, bowls covered, the all-clear texted to you." },
    ],
}

/** One-time jobs — the prices page's add-on cards. Empty drops the section. */
export const addOns: { icon: MarketingIconName; title: string; description: string }[] = [
    {
        icon: "search",
        title: "Termite inspection letter",
        description: "The WDI report your home sale needs, usually within 48 hours — $95.",
    },
    {
        icon: "shield",
        title: "Rodent exclusion",
        description: "Every gap sealed, traps set, and a weekly check until it's quiet — from $295.",
    },
    {
        icon: "calendar",
        title: "Backyard event spray",
        description: "Party this weekend? A one-time mosquito barrier two days out — $89.",
    },
    {
        icon: "zap",
        title: "Wasp & hornet nests",
        description: "Eaves, sheds, and swing sets cleared the same week — $85.",
    },
    {
        icon: "layers",
        title: "Fire ant yard broadcast",
        description: "The whole lawn treated plus every mound, pet-safe once dry — $75.",
    },
    {
        icon: "bell",
        title: "Bed bug inspection",
        description: "A room-by-room check and a straight answer; treatment priced by room.",
    },
]

/** The home proof gallery. Empty in this seed — fill to show a gallery with a lightbox. */
export const gallery: { caption: string; image: SiteImage }[] = []

export const about = {
    headline: "Two night-shift exterminators and a flashlight.",
    photo: photo(
        "about-founders",
        1152,
        864,
        "A painted portrait of Night Crawlers founders Terrence Boyd and Linh Pham in cream coveralls with sprayer tanks, standing by a vintage truck under a green moon",
    ),
    paragraphs: [
        "Terrence Boyd and Linh Pham met working nights for a commercial exterminator in the Port of Houston — the shift where you learn where roaches really live. In 2017 they started Night Crawlers out of a garage in EaDo with one truck, two sprayers, and a rule: find how they're getting in before you spray anything.",
        "Today it's eleven licensed technicians in cream coveralls, Monday to Saturday, from the Heights to Katy. Every one is trained on the same inspection, carries pet- and kid-safe products first, and leaves a service ticket on the counter so you know exactly what was done.",
        "We seal before we treat, bait instead of fog, and come back free between visits if anything crawls back out. Houston has more bugs than most places. We think it deserves better exterminators.",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "Texas Department of Agriculture licensed",
        "Pet- and kid-safe products first",
        "Free re-treats between visits",
        "Same-week service",
        "Termite letters for home sales",
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
        question: "Is it safe for my pets and kids?",
        answer: "Yes. We start with baits and targeted gels placed where pets and kids can't reach, and every spray we use is labeled for homes with both. Keep everyone off treated surfaces until they're dry — usually under an hour — and we text you the all-clear.",
    },
    {
        question: "How long until the roaches are gone?",
        answer: "You'll see fewer within days and most activity stops in two to three weeks as the bait works through the colony. Seeing more for a few days at first is normal — they're coming out to die. Still seeing them after two weeks? We re-treat free.",
    },
    {
        question: "Do you do termite inspections for home sales?",
        answer: "We do. A wood-destroying insect (WDI) inspection with the report your lender needs, usually scheduled within 48 hours and delivered the same day — $95. If we find activity, you get a treatment quote on the spot.",
    },
    {
        question: "When is mosquito season in Houston?",
        answer: "Roughly April through October, with peaks after every heavy rain. Our Mosquito Season plan sprays a barrier on your foliage monthly across those months and dumps standing water every visit. Start in March and the first hatch never gets going.",
    },
    {
        question: "Do I need to be home?",
        answer: "For the first visit, yes — we inspect inside and walk you through what we find. After that, quarterly visits can be exterior-only unless you're seeing activity inside; just leave the gate open and we text when we're done.",
    },
]

/**
 * The appointments contract's code fallback — the same booking mode 2 the
 * care pack runs (web/app/src/View/Landing/practiceDocument.ts): visit
 * types x weekly availability windows, projected into concrete capacity-1
 * slots by `generateAppointmentSlots`. The catalog's `content.appointments`
 * seed mirrors this export exactly (the content tests pin the twin).
 *
 * The pest trade books the front of the relationship: the free inspection
 * that maps how they're getting in, and the first treatment that starts
 * the plan. Quarterly visits are scheduled by dispatch — only these two
 * visit kinds go on the public calendar. One provider — Terrence still
 * does every first inspection — Monday to Saturday.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "inspection",
            name: "Free home inspection",
            durationMinutes: 45,
            description:
                "A flashlight tour of your kitchen, baths, attic hatch, and foundation — and a plan for what we find.",
        },
        {
            typeId: "first-treatment",
            name: "First treatment",
            durationMinutes: 90,
            description: "Inspect, seal, and treat inside and out — the service ticket left on your counter.",
        },
    ],
    providers: [
        {
            providerId: "terrence-boyd",
            name: "Terrence Boyd",
            windows: [
                { day: 1, start: 8 * 60, end: 17 * 60 },
                { day: 2, start: 8 * 60, end: 17 * 60 },
                { day: 3, start: 8 * 60, end: 17 * 60 },
                { day: 4, start: 8 * 60, end: 17 * 60 },
                { day: 5, start: 8 * 60, end: 17 * 60 },
                { day: 6, start: 9 * 60, end: 14 * 60 },
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
    headline: "Book a free inspection or your first treatment",
    intro: "Pick a time for a free inspection or your first treatment and you'll get a confirmation with a one-click cancel link. Rather describe it first? The form below reaches dispatch.",
    /** The new/returning select's trade voice (the widget's statusLabels). */
    statusLabels: { new: "New to Night Crawlers", returning: "Returning customer" },
    privacyNote:
        "Only what we need to hold the slot. Tell us about pets, kids, and allergies in the form below so your technician brings the right products.",
}

export const book = {
    headline: "Book a treatment. Sleep with the lights off.",
    body: "Tell us what you're seeing, where, and who lives with you — dispatch replies the same day, Monday to Saturday, with a price and your technician's first opening this week.",
    confirmation:
        "Got it — dispatch has your request. We reply today (7 AM–7 PM) with a price and your first opening this week.",
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
            name: "pest",
            label: "What are you seeing?",
            type: "select" as const,
            options: [
                "Roaches",
                "Termites",
                "Rats or mice",
                "Mosquitoes",
                "Ants",
                "Something else — it's big",
            ],
        },
        {
            name: "home",
            label: "Home type",
            type: "select" as const,
            options: ["House", "Townhome", "Apartment or condo", "Business"],
        },
        {
            name: "plan",
            label: "Which plan?",
            type: "select" as const,
            options: ["Quarterly Shield", "Home Defender", "Mosquito Season", "One-time job", "Not sure yet"],
        },
        {
            name: "household",
            label: "Pets & kids at home",
            placeholder: "Two dogs, a toddler, one very brave cat…",
        },
        {
            name: "notes",
            label: "Anything else",
            type: "textarea" as const,
            fullWidth: true,
            placeholder: "Where you've seen them, when, and how big…",
        },
    ],
}
