/**
 * The services-makeup-tidewater remix's content seed (packs/README.md
 * "Derived templates"): an on-location bridal hair and makeup team worn
 * over the services pack. At compose time this file is copied
 * byte-for-byte over `View/Services/content.ts`, so it must remain a
 * STRUCTURAL TWIN of that module — the same export surface, the same
 * shapes, the contract's minimums met
 * (tests/View/Services/groupOneRemixSeeds.test.ts pins the twin).
 *
 * The trade: Tidewater Beauty Co., a Charleston team that comes to the
 * bridal suite. The home page is the wedding morning itself: a candid
 * full-bleed of the suite at work, then the morning told hour by hour —
 * 6:30 set-up to 9:00 ready — each hour with its photographs and a line
 * written under them, the rate on one line, the islands the kit travels
 * to, and one ask. Projects become bare-to-ready comparisons, the quote
 * form becomes the wedding inquiry, and the booking strip books trials
 * and consultations against the studio week — wedding mornings stay
 * contract-only.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/services-makeup-tidewater` (see PACK.md). The art
 * direction is a white suite in window light — robes, linen, palmetto
 * shadow — documentary, never posed, and every comparison is the same
 * face against the same white wall.
 */

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
        src: `/services-makeup-tidewater/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({
            src: `/services-makeup-tidewater/${name}-${step}w.webp`,
            width: step,
        })),
    }
}

export const business = {
    name: "Tidewater Beauty Co.",
    tagline: "Bridal hair & makeup, on location",
    location: "Charleston, South Carolina",
    /** Shown everywhere the number appears; `phoneHref` is the tap target. */
    phone: "(843) 555-0164",
    phoneHref: "tel:+18435550164",
    email: "mornings@tidewaterbeauty.example",
    address: "112 Cannon Street, Studio 3, Charleston, SC 29403",
    /** The license line — rendered wherever trust is being earned. */
    license: "SC licensed cosmetologists · Insured on location",
}

/**
 * Weekly hours drive the quote page's hours line (the shared hours
 * engine, `View/Landing/hours.ts`). Minutes since midnight; a day may
 * have several intervals. Studio days only — wedding mornings are booked
 * on contract, in the suite.
 */
export const weeklyHours: DayHours[] = [
    { day: 2, intervals: [[600, 1080]] }, // Tue 10 AM – 6 PM
    { day: 3, intervals: [[600, 1080]] },
    { day: 4, intervals: [[600, 1080]] }, // Thu
]

export const hoursNote =
    "Studio Tuesday–Thursday 10 AM–6 PM · Friday through Sunday we're in the bridal suite"

/** Where the kit travels — the home page's quiet strip. */
export const serviceArea = ["Charleston", "Kiawah", "Folly", "Sullivan's Island"]

/**
 * Landing copy the trade owns: the few strings the landing modules render
 * that would read wrong for a different trade. Remix seeds retrade these
 * along with the rest of the content — everything else in the landing
 * modules is trade-neutral on purpose.
 */
export const landingCopy = {
    /** The home page's services-section heading. */
    servicesHeading: "The chair",
    /** The shared nav: page link labels, the CTA, and the logo's line. */
    nav: {
        projects: "Mornings",
        services: "Rates",
        about: "The team",
        cta: "Plan your morning",
        /** Small line under the wordmark; "" for none. */
        tagline: "",
    },
    /** The booking ask on heroes, banners, and the about story. */
    quoteCta: "Plan your morning",
    home: {
        nowBuildingLabel: "The rate",
        servicesKicker: "The chair",
        transformationsKicker: "Bare to ready",
        transformationsTitle: "Drag from coffee to the aisle",
        testimonialsKicker: "From the suite",
        serviceAreaLabel: "In the suite across the Lowcountry",
        bannerTitle: "Hold the morning.",
        bannerBody: "Spring and fall Saturdays book a year out. Send the date and the head count first.",
    },
    projects: {
        headline: "Mornings.",
        subheadline:
            "Brides, mothers, and the whole party — photographed in window light, bare and then ready. Drag a divider across the same face.",
        kicker: "Bare to ready",
        bannerTitle: "Picture your morning here?",
    },
    servicesPage: {
        headline: "The chair, priced plainly.",
        subheadline:
            "One rate for the bride, one for every face after her. Lashes, skin prep, and a touch-up pouch are in every chair; travel on the peninsula is on us.",
        kicker: "Rates",
        faqKicker: "Before the morning",
        faqTitle: "What brides ask first",
        bannerTitle: "Counting faces?",
        bannerBody: `Call ${business.phone} or send the date — we'll send back the chair schedule and the total.`,
    },
    about: {
        kicker: "The team",
        bullets: [
            business.license,
            "Two artists for every six faces",
            "Trial at the studio, morning in the suite",
        ],
        credentialsLabel: "Credentials",
        reviewsKicker: "From the suite",
        reviewsTitle: "Brides, mothers, and one planner",
        bannerTitle: "Pour the coffee. We'll bring the kit.",
    },
    quotePage: {
        kicker: "Wedding inquiry",
        title: "The date and the faces",
        cta: "Send to Tidewater",
    },
}

export interface Service {
    slug: string
    title: string
    /** Small uppercase label on the card, e.g. the room or trade. */
    eyebrow: string
    description: string
    /** "From $12,000" / "By consultation" — honest ballparks build trust. */
    priceNote: string
    image: SiteImage
}

export interface Project {
    slug: string
    title: string
    /** The place — the eyebrow on the comparison caption. */
    location: string
    /** One line of scope and duration, e.g. "Full gut remodel — 6 weeks". */
    scope: string
    description: string
    before: SiteImage
    after: SiteImage
}

/** The morning's photographs, shared by the timeline and the service cards. */
const frames = {
    brushes: photo(
        "setup-brushes",
        1600,
        1200,
        "Makeup brushes laid in a row on a white linen table beside a cup of coffee, morning light from the window",
    ),
    kit: photo(
        "setup-kit",
        1600,
        1200,
        "An artist opening a cream makeup case of brushes and palettes on a white table beside a curling iron",
    ),
    bouquet: photo(
        "setup-bouquet",
        1600,
        1200,
        "A bouquet of white garden roses on a windowsill, live oaks and Spanish moss outside the glass",
    ),
    bride: photo(
        "bride-chair",
        1600,
        900,
        "An artist in a sage shirt brushing blush onto a bride in a white robe, both laughing beside a tall window",
    ),
    party1: photo(
        "party-1",
        1600,
        1200,
        "A bridesmaid in a white robe laughing while an artist in sage blends her blush",
    ),
    party2: photo(
        "party-2",
        1600,
        1200,
        "A bridesmaid with a sleek low bun laughing with her head back while her artist pauses the liner brush, laughing too",
    ),
    party3: photo(
        "party-3",
        1600,
        1200,
        "Two bridesmaids in robes and rollers laughing on a white sofa with a glass of orange juice",
    ),
    party4: photo(
        "party-4",
        1600,
        1200,
        "The bride's grandmother in a white robe smiling as an artist paints her lips, a hand mirror in her lap",
    ),
    veil: photo(
        "veil",
        2400,
        1350,
        "An artist settling a long tulle veil into the bride's low chignon beside the window",
    ),
    ready: photo(
        "ready",
        2400,
        1350,
        "Eight women in matching white robes laughing together in the suite, arms around each other, one mid-jump",
    ),
}

const team = photo(
    "about-team",
    1600,
    1200,
    "The two founders of Tidewater carrying cream kit cases along a white piazza, live oaks behind them",
)

export const projects: Project[] = [
    {
        slug: "bride-soft-glow",
        title: "The bride, soft and lit",
        location: "Wren House, Charleston",
        scope: "Bridal — trial and the morning",
        description:
            "A skin-first base for a humid May ceremony, a brushed brow, a soft brown liner, and a rose balm that survives the vows.",
        before: photo(
            "look-bride-before",
            1600,
            1200,
            "A bride in a white robe grinning mid-sentence, bare-faced with freckles, her hair in a quick clip by a tall window",
        ),
        after: photo(
            "look-bride-after",
            1600,
            1200,
            "The same bride ready and laughing: glowing skin, feathered brows, a soft rose lip, and her hair in a loose low twist",
        ),
    },
    {
        slug: "mother-of-the-bride",
        title: "Mother of the bride",
        location: "The Oyster Point Inn, Kiawah",
        scope: "Family chair — 45 minutes",
        description:
            "A lightweight base that doesn't settle, a lifted lash, and the berry lip she wore on her own wedding day.",
        before: photo(
            "look-mother-before",
            1600,
            1200,
            "A woman with short silver curls in a white robe, bare-faced and smiling mid-conversation by a tall window",
        ),
        after: photo(
            "look-mother-after",
            1600,
            1200,
            "The same woman ready and laughing mid-story: glowing skin, a soft bronze eye, and a berry lip",
        ),
    },
]

export const services: Service[] = [
    {
        slug: "bride",
        title: "The bride",
        eyebrow: "First chair",
        description:
            "A trial at the studio, then the morning in your suite: skin prep, airbrush or brushed base, lashes, hair, and a touch-up pouch.",
        priceNote: "$450",
        image: frames.bride,
    },
    {
        slug: "party",
        title: "Every face after",
        eyebrow: "The party",
        description:
            "Bridesmaids, flower girls over twelve, and anyone else in a robe: forty-five minutes each, hair and makeup.",
        priceNote: "$140 each",
        image: frames.party1,
    },
    {
        slug: "family",
        title: "Mothers & grandmothers",
        eyebrow: "The family",
        description:
            "Mature skin, a gentler hand, and the lip she's always worn — photographed before anyone cries.",
        priceNote: "$140 each",
        image: frames.party4,
    },
    {
        slug: "veil-and-touch-ups",
        title: "Veil & touch-ups",
        eyebrow: "Stay on",
        description:
            "An artist stays through the first look and portraits to set the veil, blot, and fix the lip after the toasts.",
        priceNote: "$120 an hour",
        image: frames.veil,
    },
]

/** The trust numbers — the metrics strip. Keep values short and big. */
export const metrics = [
    { value: "11", label: "years of Lowcountry mornings" },
    { value: "900+", label: "brides in the chair" },
    { value: "9:00", label: "ready, every time" },
    { value: "4.9★", label: "average of 410 reviews" },
]

export const testimonials = [
    {
        quote: "Eight of us, one bathroom, and a photographer at nine. They set up before I'd finished my coffee, and we were all standing at the window laughing at 8:55.",
        name: "Caroline W.",
        detail: "Bride, Sullivan's Island",
    },
    {
        quote: "I've planned two hundred weddings on the peninsula. Tidewater is the only team whose chair schedule I never have to check.",
        name: "Margaret L.",
        detail: "Wedding planner, Charleston",
    },
    {
        quote: "At seventy-eight I did not want to look painted. I looked like myself on a very good day, and I kept the lipstick.",
        name: "Evelyn H.",
        detail: "Grandmother of the bride, Kiawah",
    },
]

/**
 * The rate — the home page's single line under the timeline (social-proof
 * `ticker`, set static and centered by the register).
 */
export const nowBuilding = ["Bride $450", "each additional face $140"]

export interface BuildLogStep {
    /** The hour on the timeline, e.g. "6:30". */
    label: string
    title: string
    /** The line written under the hour's photographs. */
    description: string
    image: SiteImage
    /** More photographs of the same hour, set beside the first. */
    frames?: SiteImage[]
}

/** The wedding morning, hour by hour — the home page's timeline. */
export const buildLog = {
    kicker: "The morning",
    title: "Six-thirty to nine.",
    steps: [
        {
            label: "6:30",
            title: "Arrive & set up",
            description: "Curling irons humming, palettes open, coffee close by.",
            image: frames.brushes,
            frames: [frames.kit, frames.bouquet],
        },
        {
            label: "7:15",
            title: "The bride",
            description: "Calm, focused, and already glowing.",
            image: frames.bride,
        },
        {
            label: "8:00",
            title: "The party",
            description: "Laughter, robes, and zero rush. This is the good part.",
            image: frames.party1,
            frames: [frames.party2, frames.party3, frames.party4],
        },
        {
            label: "8:45",
            title: "Touch-ups & veil",
            description: "Last details. Then we let her shine.",
            image: frames.veil,
        },
        {
            label: "9:00",
            title: "Ready",
            description: "Eight faces, nine hands, one beautiful morning. Let's do it again.",
            image: frames.ready,
        },
    ] as BuildLogStep[],
}

export interface Specimen {
    name: string
    use: string
    description: string
    image: SiteImage
}

/** The base pack's materials board — unused by the morning, so empty. */
export const species = {
    kicker: "",
    title: "",
    items: [] as Specimen[],
}

export interface Swatch {
    name: string
    code: string
    color: string
    note: string
    image?: SiteImage
}

/** The color deck — unused by the morning, so empty. */
export const palette = {
    kicker: "",
    title: "",
    items: [] as Swatch[],
}

export interface PriceMenuItem {
    name: string
    /** What's included, or the hours. */
    note?: string
    price: string
    qualifier?: string
}

export interface PriceMenuGroup {
    heading: string
    items: PriceMenuItem[]
}

/** The rate card — the rate rides the home ticker, so no menu board. */
export const priceMenu = {
    kicker: "",
    title: "",
    intro: "",
    groups: [] as PriceMenuGroup[],
    footnote: "",
}

export interface LookbookItem {
    name: string
    /** The work and the occasion. */
    meta: string
    description: string
    /** The portfolio's filter chips. */
    tags: string[]
    image: SiteImage
    /** The column a directory groups the item under; the lookbook's eyebrow. */
    group?: string
}

/** The portfolio — the comparisons carry the work, so empty. */
export const lookbook = {
    kicker: "",
    title: "",
    items: [] as LookbookItem[],
}

export interface Policy {
    title: string
    body: string
}

/** House rules — covered in the FAQ, so no card. */
export const policies = {
    kicker: "",
    title: "",
    cardTitle: "",
    body: "",
    image: null as SiteImage | null,
    items: [] as Policy[],
}

export interface HeroPanel {
    /** The plate under the panel, e.g. "Mehndi". */
    label: string
    image: SiteImage
}

export interface JournalEntry {
    /** The season or dateline over the headline, e.g. "Spring". */
    season: string
    title: string
    description: string
    image: SiteImage
}

/**
 * The garden journal — a season's story per entry, set as the stories
 * spread (showcase `stories`: the first entry leads with its photograph,
 * the rest follow in thirds). Each story jumps to the projects page under
 * `linkLabel`. Empty `items` to drop the section.
 */
export const journal = {
    kicker: "",
    title: "",
    linkLabel: "",
    items: [] as JournalEntry[],
}

export interface WalkFrame {
    /** One line under the frame; the number is set by the section. */
    caption: string
    image: SiteImage
}

/**
 * A walk through one garden, frame by frame (gallery `sequence`: each
 * photograph at its own shape, stacked down the page in walking order).
 * Empty `frames` to drop the section.
 */
export const walk = {
    kicker: "",
    title: "",
    frames: [] as WalkFrame[],
}

export const home = {
    /** The title card over the suite: set in two lines. */
    headline: "Eight faces\nby nine.",
    subheadline:
        "Bridal hair and makeup in your suite across Charleston and the islands — the whole party ready, unhurried, by nine.",
    heroImage: photo(
        "hero-morning",
        2400,
        1350,
        "A bright bridal suite with tall windows: an artist in a sage robe doing a bride's makeup while bridesmaids in white robes laugh around her",
    ),
    /** Show each service's `priceNote` under its title in the home grid. */
    servicePrices: true,
    /** The timeline carries the offer on home, so no services grid there. */
    serviceGrid: false,
    hero: {
        /** The title card: the headline over the candid suite. */
        storefront: false,
        /** The written line under the headline. */
        credit: "a wedding morning, beautifully documented",
        /** No photo caption. */
        caption: "",
        /** No accent word: the morning is the color. */
        accent: "none" as "none" | "last-word",
        /** No kicker over the headline. */
        kicker: "",
        /** No cover lines — the timeline follows. */
        coverLines: [] as string[],
        /** No panels: the photograph is the hero. */
        panels: [] as HeroPanel[],
        /** Title-card only: the studio's seal — first line small, the rest large. Empty: none. */
        seal: "",
    },
    /** The home before/after teaser: the bride. */
    featuredProjects: [projects[0]] as Project[],
    /** The home metrics strip (empty: the numbers live on the about page). */
    proofMetrics: [] as typeof metrics,
    /** No banner artwork: the closing ask stays on the white page. */
    bannerImage: null as SiteImage | null,
}

export interface FeatureFigure {
    /** The small caps title under the detail photograph. */
    title: string
    caption: string
    image: SiteImage
}

/** The long-form feature story — the morning tells itself, so empty. */
export const feature = {
    kicker: "",
    headline: "",
    paragraphs: [] as string[],
    image: null as SiteImage | null,
    linkLabel: "",
    pullQuote: "",
    figures: [] as FeatureFigure[],
    plate: null as SiteImage | null,
    plateCaption: "",
}

export const about = {
    headline: "Two artists, one kit, every Saturday.",
    photo: team,
    paragraphs: [
        "Tidewater started in 2015 as two friends with a borrowed case, doing hair and makeup for each other's sisters on the peninsula. It is still run by those two, who still take the first chair at every wedding.",
        "The morning is the product. We arrive at 6:30, we set up where the light is, and we run a chair schedule to the minute so that nobody is waiting in a robe at 8:50. The bride is always done before the party's second coffee.",
        "Every artist on the team is licensed in South Carolina, trained in our kit, and has done at least forty mornings beside one of us before she runs a suite of her own.",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "SC Board of Cosmetology licensed",
        "Airbrush certified",
        "Insured on location",
        "Cruelty-free kit",
    ],
}

export const process = {
    kicker: "How a morning is booked",
    title: "Inquiry to the aisle",
    steps: [
        {
            title: "The inquiry",
            description:
                "Send the date, the suite, and the head count. We answer within a day with the artists, the schedule, and the total.",
        },
        {
            title: "The trial",
            description:
                "Ninety minutes at the Cannon Street studio, ideally with your hairpiece and a photo of the dress. Everything is written down.",
        },
        {
            title: "The schedule",
            description:
                "Two weeks out we send the chair order to the minute, so your photographer knows when to walk in.",
        },
        {
            title: "The morning",
            description:
                "We arrive at 6:30 and leave when the veil is on. Everyone keeps a touch-up pouch with her own lip.",
        },
    ],
}

export const faq = [
    {
        question: "How many artists will you bring?",
        answer: "Two artists for up to six faces, three for up to nine. Every face gets forty-five minutes, and the bride gets ninety. The schedule is built backward from your first look.",
    },
    {
        question: "Do I need a trial?",
        answer: "For brides, yes. It's where the look is decided in daylight, not on the morning. Book it six to ten weeks out and bring your veil or hairpiece.",
    },
    {
        question: "Will it hold in Charleston humidity?",
        answer: "That is most of our job. Skin prep, a humidity-proof set, and pins you can't see. We stay for touch-ups if you book it, and everyone gets a pouch.",
    },
    {
        question: "Do you travel to the islands?",
        answer: "The peninsula, Mount Pleasant, and Sullivan's Island are included. Kiawah, Seabrook, and Folly are a flat $75 travel fee per artist.",
    },
    {
        question: "What holds my date?",
        answer: "A signed contract and a 30% retainer, which comes off your final invoice. It moves with you once if your date changes with ninety days' notice.",
    },
]

/**
 * The appointments contract's code fallback — the same booking mode 2 the
 * care pack runs (web/app/src/View/Landing/practiceDocument.ts): visit
 * types x weekly availability windows, projected into concrete capacity-1
 * slots by `generateAppointmentSlots`. The catalog's `content.appointments`
 * seed mirrors this export exactly (the remix-seed tests pin the twin), so
 * an owner's Manage edit and this file walk the same rendering path.
 *
 * The studio books two kinds of visit online: the free consultation and
 * the bridal trial. Two providers — the founders — on studio days only;
 * wedding mornings are on contract.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "consultation",
            name: "Free consultation",
            durationMinutes: 30,
            description:
                "A video call or a coffee at the studio: the date, the suite, the faces, and the look.",
        },
        {
            typeId: "bridal-trial",
            name: "Bridal trial",
            durationMinutes: 90,
            description:
                "Hair and makeup at the Cannon Street studio, photographed in daylight and written down.",
        },
    ],
    providers: [
        {
            providerId: "anna-reyes",
            name: "Anna Reyes",
            windows: [
                { day: 2, start: 10 * 60, end: 18 * 60 },
                { day: 3, start: 10 * 60, end: 18 * 60 },
            ],
        },
        {
            providerId: "julia-pinckney",
            name: "Julia Pinckney",
            windows: [
                { day: 3, start: 10 * 60, end: 18 * 60 },
                { day: 4, start: 10 * 60, end: 18 * 60 },
            ],
        },
    ],
}

/** The /quote page's booking strip — the slot picker above the form. */
export const booking = {
    headline: "Book a trial",
    intro: "Book a free consultation or your bridal trial at the Cannon Street studio. Pick a time and you'll get a confirmation with a one-click reschedule link. For the wedding morning itself, send the date through the form below.",
    /** The new/returning select's trade voice (the widget's statusLabels). */
    statusLabels: { new: "First time with Tidewater", returning: "We've met before" },
    /** The line under the booking form (the widget's privacyNote). */
    privacyNote:
        "A name and a way to reach you hold the time. Your skin notes and the chair schedule stay with the team, and nowhere else.",
}

export const quote = {
    headline: "Tell us about the morning.",
    body: "The date, the suite, and how many faces. You'll hear back within a day with the artists, the chair schedule, and the total.",
    confirmation:
        "Thank you — it's in. One of the founders answers every inquiry within a day, with your date's availability first.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        { name: "phone", label: "Phone", type: "tel" as const },
        { name: "date", label: "Wedding date", type: "date" as const, required: true },
        {
            name: "location",
            label: "Where you're getting ready",
            placeholder: "The suite, the house, the island",
        },
        {
            name: "faces",
            label: "How many faces",
            type: "select" as const,
            options: ["Just the bride", "2–4", "5–8", "9 or more"],
            required: true,
        },
        { name: "ready", label: "Ready-by time", placeholder: "When the photographer walks in" },
        {
            name: "message",
            label: "Anything else",
            type: "textarea" as const,
            fullWidth: true,
        },
    ],
}
