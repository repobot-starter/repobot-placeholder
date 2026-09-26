/**
 * The services-hair remix's content seed (packs/README.md "Derived
 * templates"): a braids and natural-hair studio worn over the services
 * pack. At compose time this file is copied byte-for-byte over
 * `View/Services/content.ts`, so it must remain a STRUCTURAL TWIN of that
 * module — the same export surface, the same shapes, the contract's
 * minimums met (tests/View/Services/hairRemixSeed.test.ts pins the twin).
 *
 * The trade: The Crown Room, Adaeze "Dez" Okafor's one-chair braids and
 * natural-hair studio in Bed-Stuy, Brooklyn. The home page is a glossy
 * cover: the name over the cover photograph with the cover lines down
 * the left, the starting prices as the strip under it, then the style
 * menu (every length, time, and price), the lookbook, an install-day
 * before/after, and the house rules. Projects become install days, the
 * quote form becomes the custom-style request, and the booking strip
 * books consults, installs, and retwists against Dez's actual week.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/services-hair` (see PACK.md). The art direction is the
 * studio's own backdrop — deep plum, gold, warm skin light — with every
 * style photographed on a real head of hair.
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
        src: `/services-hair-braids/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/services-hair-braids/${name}-${step}w.webp`, width: step })),
    }
}

export const business = {
    name: "The Crown Room",
    tagline: "Braids & natural hair studio",
    location: "Bed-Stuy, Brooklyn",
    /** Shown everywhere the number appears; `phoneHref` is the tap target. */
    phone: "(718) 555-0142",
    phoneHref: "tel:+17185550142",
    email: "book@thecrownroom.example",
    address: "412 Tompkins Avenue, 2nd floor, Brooklyn, NY 11216",
    /** The license line — rendered wherever trust is being earned. */
    license: "NY licensed natural hair stylist #NHS-2204817 · One chair, by appointment",
}

/**
 * Weekly hours drive the quote page's hours line (the shared hours
 * engine, `View/Landing/hours.ts`). Minutes since midnight; a day may
 * have several intervals. Long installs start early on Saturdays, and
 * Saturday is the kids' chair.
 */
export const weeklyHours: DayHours[] = [
    { day: 2, intervals: [[540, 1140]] }, // Tue 9 AM – 7 PM
    { day: 3, intervals: [[540, 1140]] },
    { day: 4, intervals: [[540, 1140]] },
    { day: 5, intervals: [[540, 1140]] }, // Fri
    { day: 6, intervals: [[420, 1020]] }, // Sat 7 AM – 5 PM
]

export const hoursNote = "Tuesday–Friday 9 AM–7 PM · Saturday 7 AM–5 PM, kids' chair · By appointment only"

/** Where clients come in from — the home page's quiet strip. */
export const serviceArea = [
    "Bed-Stuy",
    "Crown Heights",
    "Clinton Hill",
    "Fort Greene",
    "Bushwick",
    "Flatbush",
    "Harlem",
    "Jersey City",
]

/**
 * Landing copy the trade owns: the few strings the landing modules render
 * that would read wrong for a different trade. Remix seeds retrade these
 * along with the rest of the content — everything else in the landing
 * modules is trade-neutral on purpose.
 */
export const landingCopy = {
    /** The home page's services-section heading. */
    servicesHeading: "The styles",
    /** The shared nav: page link labels, the CTA, and the logo's line. */
    nav: {
        projects: "Lookbook",
        services: "Prices",
        about: "Dez",
        cta: "Book",
        /** Small line under the wordmark; "" for none. */
        tagline: "Bed-Stuy, Brooklyn",
    },
    /** The booking ask on heroes, banners, and the about story. */
    quoteCta: "Book your chair",
    home: {
        nowBuildingLabel: "Starting prices",
        servicesKicker: "The styles",
        transformationsKicker: "Install day",
        transformationsTitle: "From the parting grid to the finish",
        testimonialsKicker: "From the chair",
        serviceAreaLabel: "Clients come in from",
        bannerTitle: "Your crown, on the calendar.",
        bannerBody:
            "Books open on the 1st and the 15th and fill about three weeks out. A $50 deposit holds your chair and comes off your total.",
    },
    projects: {
        headline: "Install day, before and after.",
        subheadline:
            "One client, one chair, photographed the day they walked out. Drag the divider from the fresh wash-and-stretch to the finished style — no filters, no borrowed photos.",
        kicker: "Install day",
        bannerTitle: "Seen your next style?",
    },
    servicesPage: {
        headline: "Styles & prices.",
        subheadline:
            "Every price is posted with its length and its chair time. Pre-stretched hair in your color is included in every braid price — you bring your head, washed and blown out.",
        kicker: "The styles",
        faqKicker: "Before you book",
        faqTitle: "What clients ask Dez first",
        bannerTitle: "Not sure which size or length?",
        bannerBody: `Text a photo to ${business.phone} — Dez answers between clients with the size, the time, and the price.`,
    },
    about: {
        kicker: "The chair",
        bullets: [
            business.license,
            "Hair included in every braid price",
            "Edges first: no tension at the root, ever",
        ],
        credentialsLabel: "Credentials",
        reviewsKicker: "From the chair",
        reviewsTitle: "Crowned, in their words",
        bannerTitle: "Come sit with Dez.",
    },
    quotePage: {
        kicker: "Custom style request",
        title: "Tell Dez the look",
        cta: "Send to Dez",
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
    /** The neighborhood — the eyebrow on the comparison caption. */
    location: string
    /** One line of scope and duration, e.g. "Full gut remodel — 6 weeks". */
    scope: string
    description: string
    before: SiteImage
    after: SiteImage
}

/** The lookbook's portrait plates, shared with the style cards. */
const plates = {
    knotless: photo(
        "look-knotless",
        1152,
        1536,
        "A young woman over her shoulder in small waist-length knotless braids and gold hoops, on a plum backdrop",
    ),
    boho: photo(
        "look-boho",
        1152,
        1536,
        "A laughing woman in boho knotless braids with loose curls through them, wearing a rust satin top",
    ),
    fulani: photo(
        "look-fulani",
        1152,
        1536,
        "A woman in profile wearing Fulani braids with cowrie shells and gold cuffs, a cornrowed crown at the front",
    ),
    stitch: photo(
        "look-stitch",
        1152,
        1536,
        "A woman in eight crisp stitch-braid cornrows falling past her shoulders, in an orange top and gold hoops",
    ),
    locs: photo(
        "look-locs",
        1152,
        1536,
        "A man with freshly retwisted shoulder-length locs trimmed with gold cuffs, in a black turtleneck and gold chain",
    ),
    kids: photo(
        "look-kids",
        1152,
        1536,
        "A grinning girl in a plum hoodie with knotless braids finished in clear and gold beads",
    ),
}

export const projects: Project[] = [
    {
        slug: "knotless-install",
        title: "Medium knotless, mid-back",
        location: "Crown Heights",
        scope: "Install — 5 hours, hair included",
        description:
            "A blown-out afro puff to medium knotless in one sitting: a clean square-part grid, every braid started flat at the root so it moves on day one.",
        before: photo(
            "install-knotless-before",
            1600,
            1200,
            "A smiling young woman with her natural hair blown out into a high afro puff, before her install",
        ),
        after: photo(
            "install-knotless-after",
            1600,
            1200,
            "The same young woman after her install, in mid-back medium knotless braids with gold cuffs",
        ),
    },
    {
        slug: "retwist-two-strand",
        title: "Retwist & two-strand style",
        location: "Bed-Stuy",
        scope: "Retwist — 2 hours",
        description:
            "Twelve weeks of new growth palm-rolled and set, the frizzy ends shaped, and a clean part line — same locs, sharper.",
        before: photo(
            "install-retwist-before",
            1600,
            1200,
            "A man with twelve weeks of loose new growth at the roots of his shoulder-length locs, before his retwist",
        ),
        after: photo(
            "install-retwist-after",
            1600,
            1200,
            "The same man after his retwist, locs neat and defined at the root and falling evenly",
        ),
    },
]

export const services: Service[] = [
    {
        slug: "knotless",
        title: "Knotless braids",
        eyebrow: "Braids",
        description:
            "Small, smedium, or medium, shoulder to butt length — started flat at the root, so there's no knot, no pull, and no headache on night one.",
        priceNote: "From $220",
        image: plates.knotless,
    },
    {
        slug: "boho-knotless",
        title: "Boho knotless",
        eyebrow: "Braids",
        description:
            "Knotless with human-hair curls left loose through every braid — soft, a little undone, and the most-requested style on the wall.",
        priceNote: "From $260",
        image: plates.boho,
    },
    {
        slug: "fulani",
        title: "Fulani braids",
        eyebrow: "Braids",
        description:
            "A cornrowed crown, a center row to the nape, and braids down the sides — finished with your choice of cowries, cuffs, and beads.",
        priceNote: "From $230",
        image: plates.fulani,
    },
    {
        slug: "stitch-braids",
        title: "Stitch braids",
        eyebrow: "Cornrows",
        description:
            "Six to ten feed-in rows with the stitch lines drawn clean — to the nape, or long with extensions to the waist.",
        priceNote: "From $140",
        image: plates.stitch,
    },
    {
        slug: "locs-retwist",
        title: "Locs retwist & style",
        eyebrow: "Locs",
        description:
            "Palm-roll or interlock, a scalp cleanse first, and a style to finish — barrel twists, a two-strand, or a high bun.",
        priceNote: "From $120",
        image: plates.locs,
    },
    {
        slug: "kids-braids",
        title: "Kids' braids",
        eyebrow: "Saturdays",
        description:
            "Knotless and cornrows for ages 5–12, gentle and quick, with the beads of their choosing. Saturdays only, one grown-up in the chair beside them.",
        priceNote: "From $80",
        image: plates.kids,
    },
]

/** The trust numbers — the metrics strip. Keep values short and big. */
export const metrics = [
    { value: "12", label: "years in the chair" },
    { value: "4,800+", label: "installs" },
    { value: "4.9★", label: "average of 610 reviews" },
    { value: "3 wks", label: "booked out" },
]

export const testimonials = [
    {
        quote: "Six hours in Dez's chair felt like two — the music, the snacks, the stories. My knotless lasted eight weeks and my edges came back thanking me.",
        name: "Tanisha W.",
        detail: "Medium knotless, Crown Heights",
    },
    {
        quote: "I've been retwisting with Dez since my starter locs in 2019. She keeps a photo of every retwist, and she remembers which side I sleep on.",
        name: "Marcus J.",
        detail: "Locs retwist, Bed-Stuy",
    },
    {
        quote: "My daughter asks for the gold-beads lady every month. Dez let her pick every bead and never once braided too tight.",
        name: "Keisha B.",
        detail: "Kids' knotless, Flatbush",
    },
]

/**
 * The starting prices — the home page's price strip, straight under the
 * cover (social-proof `ticker`, set static by the register). Keep it to
 * three: style, the honesty word, the price.
 */
export const nowBuilding = ["Knotless from $220", "Boho from $260", "Retwist from $120"]

export interface BuildLogStep {
    label: string
    title: string
    description: string
    image: SiteImage
}

/** The base pack's build log — the studio has no build to log, so empty. */
export const buildLog = {
    kicker: "",
    title: "",
    steps: [] as BuildLogStep[],
}

export interface Specimen {
    name: string
    use: string
    description: string
    image: SiteImage
}

/** The base pack's materials board — the lookbook carries the plates, so empty. */
export const species = {
    kicker: "",
    title: "",
    items: [] as Specimen[],
}

export interface Swatch {
    /** The color's name, e.g. "Frenchmen Coral". */
    name: string
    /** The chip number printed under the name, e.g. "014". */
    code: string
    /** The flat color itself, a six-digit hex. */
    color: string
    /** One line under the rule. */
    note: string
    /** Optional texture chip set on the swatch. */
    image?: SiteImage
}

/** The color deck — not this trade's product, so empty. */
export const palette = {
    kicker: "",
    title: "",
    items: [] as Swatch[],
}

export interface PriceMenuItem {
    name: string
    /** The length and the chair time. */
    note?: string
    price: string
    qualifier?: string
}

export interface PriceMenuGroup {
    heading: string
    items: PriceMenuItem[]
}

/**
 * The style menu — every style with its length, chair time, and price
 * (pricing `price-list`). Braid prices include pre-stretched hair.
 */
export const priceMenu = {
    kicker: "The style menu",
    title: "Every length, every price.",
    intro: "Hair is included in every braid price. Times are chair times — bring a snack, a charger, and a show to finish.",
    groups: [
        {
            heading: "Knotless",
            items: [
                { name: "Medium knotless", note: "Mid-back · 4–5 hrs", qualifier: "from", price: "$220" },
                { name: "Smedium knotless", note: "Mid-back · 5–6 hrs", qualifier: "from", price: "$260" },
                { name: "Small knotless", note: "Mid-back · 7–8 hrs", qualifier: "from", price: "$320" },
                { name: "Waist or butt length", note: "Any size · +1–2 hrs", price: "+$40" },
            ],
        },
        {
            heading: "Boho & Fulani",
            items: [
                {
                    name: "Boho knotless",
                    note: "Human-hair curls · 6–7 hrs",
                    qualifier: "from",
                    price: "$260",
                },
                {
                    name: "Fulani braids",
                    note: "Cornrow crown, cuffs & cowries · 5 hrs",
                    qualifier: "from",
                    price: "$230",
                },
                { name: "Goddess locs", note: "Crochet, mid-back · 4 hrs", qualifier: "from", price: "$240" },
            ],
        },
        {
            heading: "Locs",
            items: [
                {
                    name: "Retwist & style",
                    note: "Palm-roll or interlock · 2 hrs",
                    qualifier: "from",
                    price: "$120",
                },
                {
                    name: "Starter locs",
                    note: "Comb coils or two-strand · 3 hrs",
                    qualifier: "from",
                    price: "$180",
                },
                { name: "Loc repair", note: "Per loc, at your retwist", price: "$10" },
            ],
        },
        {
            heading: "Cornrows & kids",
            items: [
                { name: "Stitch braids", note: "6–10 rows · 3 hrs", qualifier: "from", price: "$140" },
                {
                    name: "Kids' knotless",
                    note: "Ages 5–12 · beads included · 4 hrs",
                    qualifier: "from",
                    price: "$150",
                },
                { name: "Kids' cornrows", note: "Ages 5–12 · 2 hrs", qualifier: "from", price: "$80" },
            ],
        },
    ] as PriceMenuGroup[],
    footnote:
        "Prices are for hair washed, detangled, and blown out. Wash & blow-dry at the chair: $25 and 45 minutes.",
}

export interface LookbookItem {
    name: string
    /** The size and length. */
    meta: string
    description: string
    tags: string[]
    image: SiteImage
}

/** The lookbook — six styles, each on a real head of hair (showcase `specimens`). */
export const lookbook = {
    kicker: "The lookbook",
    title: "Wear the crown.",
    items: [
        {
            name: "Knotless",
            meta: "Small · waist length",
            description: "Feather-light from the root, and flat enough to sleep on night one.",
            tags: ["Braids"],
            image: plates.knotless,
        },
        {
            name: "Boho knotless",
            meta: "Human-hair curls",
            description: "The curls stay loose through every braid — soft, undone, on purpose.",
            tags: ["Braids"],
            image: plates.boho,
        },
        {
            name: "Fulani",
            meta: "Cowries & gold cuffs",
            description: "A cornrowed crown and side braids, dressed the way you want them.",
            tags: ["Braids"],
            image: plates.fulani,
        },
        {
            name: "Stitch braids",
            meta: "Eight rows · to the waist",
            description: "Clean stitch lines, drawn with a rat-tail and a steady hand.",
            tags: ["Cornrows"],
            image: plates.stitch,
        },
        {
            name: "Locs retwist",
            meta: "Palm-roll · gold cuffs",
            description: "Twelve weeks of growth set sharp, ends shaped, scalp cleansed.",
            tags: ["Locs"],
            image: plates.locs,
        },
        {
            name: "Kids' knotless",
            meta: "Ages 5–12 · beads",
            description: "Gentle, quick, and every bead picked by the one wearing it.",
            tags: ["Kids"],
            image: plates.kids,
        },
    ] as LookbookItem[],
}

export interface Policy {
    title: string
    body: string
}

/** The house rules — one ticked card (feature-grid `checklist`). */
export const policies = {
    kicker: "Before you book",
    title: "The house rules.",
    cardTitle: "Read before you book",
    body: "One chair and long appointments — these keep everyone's day on time.",
    image: photo(
        "about-dez",
        1600,
        1200,
        "Dez Okafor in a plum satin blouse smiling behind a client in her chair, a gold mirror and lamps behind them",
    ) as SiteImage | null,
    items: [
        {
            title: "$50 deposit holds your chair",
            body: "Sent by text after you book, and taken off your total. No deposit, no appointment.",
        },
        {
            title: "15-minute grace period",
            body: "Past 15 minutes there's a $25 late fee; past 30, we reschedule and the deposit rolls once.",
        },
        {
            title: "Hair is included",
            body: "Pre-stretched hair in your color comes with every braid price. Bringing your own is $20 off — ask first.",
        },
        {
            title: "Arrive washed & blown out",
            body: "Detangled, no oils. Can't? Wash & blow-dry at the chair is $25 and 45 minutes.",
        },
        {
            title: "Kids 5–12 on Saturdays",
            body: "One grown-up with them, please. Snacks welcome; tablets with headphones even more so.",
        },
        {
            title: "48 hours to reschedule",
            body: "Once, free, with 48 hours' notice. Inside that, the deposit stays with the chair.",
        },
    ] as Policy[],
}

/** One captioned photograph in the hero's collage row. */
export interface HeroPanel {
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
    /** The masthead: the first line set small, the last word cast in gold. */
    headline: "The\nCrown Room",
    subheadline:
        "Knotless, boho, Fulani, stitch braids, and locs — one chair on Tompkins Avenue, hair included, prices on the wall.",
    heroImage: photo(
        "hero-crown-cover",
        2400,
        1800,
        "A woman in long knotless braids threaded with gold cuffs, gold hoops and a crushed-velvet plum top, against a plum and gold backdrop",
    ),
    /** Show each service's `priceNote` under its title in the home grid. */
    servicePrices: true,
    /** The style menu carries the offer on home, so no services grid there. */
    serviceGrid: false,
    hero: {
        /** The title card: the masthead over the cover photograph. */
        storefront: false,
        /** The billing line between gold rules. */
        credit: "Braids & natural hair studio",
        /** No photo caption on the cover. */
        caption: "",
        /** The last word ("Room") cast in gold. */
        accent: "last-word" as "none" | "last-word",
        /** The small line over the masthead. */
        kicker: "Est. 2014 · The braids issue",
        /** The cover lines down the left: each line's lead, then its tail. */
        coverLines: ["Knotless · Boho ·\nLocs retwist", "Book\n3 weeks out", "Bed-Stuy's\nfavorite chair"],
        /** No collage row. */
        panels: [] as HeroPanel[],
        /** Title-card only: the studio's seal — first line small, the rest large. Empty: none. */
        seal: "",
    },
    /** The home before/after teaser: the knotless install. */
    featuredProjects: [projects[0]] as Project[],
    /** The home metrics strip (empty: the numbers live on the about page). */
    proofMetrics: [] as typeof metrics,
    /** The closing banner's photograph. */
    bannerImage: photo(
        "cta-braiding-hands",
        2400,
        1350,
        "Close on a stylist's hands with gold rings finishing a braid, over a client's plum velvet shoulder",
    ) as SiteImage | null,
}

/** A detail photograph with its small-caps title and caption. */
export interface FeatureFigure {
    title: string
    caption: string
    image: SiteImage
}

/** The long-form feature story — unused here, so empty (drops the section). */
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
    headline: "Dez, and the chair.",
    photo: photo(
        "about-dez",
        1600,
        1200,
        "Dez Okafor in a plum satin blouse smiling behind a client in her chair, a gold mirror and lamps behind them",
    ),
    paragraphs: [
        "The Crown Room is Adaeze “Dez” Okafor — Nigerian-American, Brooklyn-raised, braiding since she was eleven on her aunties' stoop on Halsey Street. She took her first paying client at fifteen, earned her New York natural hair styling license at twenty, and opened the Crown Room above a Tompkins Avenue bakery in 2014.",
        "It is one chair and one stylist on purpose. No assistant finishes your ends, and no second client gets squeezed in while you sit. Dez parts every grid herself, braids edges-first with no tension at the root, and won't start a style your hair isn't ready for.",
        "The music is loud, the snacks are free, and the prices are on the wall. Books open on the 1st and the 15th and fill about three weeks out — which is why the deposit, the grace period, and the house rules exist.",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "NY natural hair styling license #NHS-2204817",
        "Tension-free braiding certified",
        "Loc care specialist",
        "Kids' chair on Saturdays",
    ],
}

export const process = {
    kicker: "How install day runs",
    title: "Parting grid to finish, one chair",
    steps: [
        {
            title: "Book & deposit",
            description:
                "Pick your style block online; the $50 deposit comes by text and holds the chair. Not sure of the size? A free 15-minute consult first.",
        },
        {
            title: "Prep night",
            description:
                "Wash, deep-condition, and blow out the night before — detangled, no oils. Dez texts a reminder two days out with your exact start time.",
        },
        {
            title: "The install",
            description:
                "A clean parting grid, edges first, every braid started flat at the root. Snacks, music, and a break whenever you need one.",
        },
        {
            title: "The send-off",
            description:
                "Ends dipped and sealed, a satin scarf to sleep in, and a care card for the next eight weeks. Rebook before you leave and it's ten off.",
        },
    ],
}

export const faq = [
    {
        question: "Is the hair included?",
        answer: "Yes — pre-stretched braiding hair in your color is in every braid price, and human-hair curls are in the boho price. Bringing your own is $20 off; text Dez the brand first so it braids the way it should.",
    },
    {
        question: "How long will I be in the chair?",
        answer: "The menu lists every style's chair time. Medium knotless is four to five hours, small is seven to eight, and long lengths add one to two. Installs start early so you're out before dinner.",
    },
    {
        question: "Will it hurt, or pull my edges?",
        answer: "No. Every braid starts flat at the root with your own hair before any extension is fed in, and Dez won't braid over thinning edges — she'll tell you, and suggest a style that lets them rest.",
    },
    {
        question: "Can I bring my kids?",
        answer: "Saturdays are the kids' chair, ages five to twelve, with one grown-up beside them. They pick their beads. For your own install, please come solo — it's a long day in a small room.",
    },
    {
        question: "How long do knotless braids last?",
        answer: "Six to eight weeks with a satin scarf and a light scalp oil. Past eight weeks the new growth starts to mat, and Dez would rather see you back than see you lose length.",
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
 * The studio books three kinds of visit online: the free style consult, a
 * braid install block, and a locs retwist. One provider — it's one chair —
 * with windows inside the posted hours, early on Saturdays.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "style-consult",
            name: "Free style consult",
            durationMinutes: 15,
            description:
                "Photos, your hair now, and the size, length, and price for your style — by video or at the chair.",
        },
        {
            typeId: "braid-install",
            name: "Braid install",
            durationMinutes: 240,
            description:
                "Knotless, boho, Fulani, or stitch — this holds your start; Dez keeps the rest of the day for your install. The exact style is set at your consult.",
        },
        {
            typeId: "locs-retwist",
            name: "Locs retwist",
            durationMinutes: 120,
            description: "Scalp cleanse, palm-roll or interlock retwist, and a style to finish.",
        },
    ],
    providers: [
        {
            providerId: "dez-okafor",
            name: "Dez Okafor",
            windows: [
                { day: 2, start: 9 * 60, end: 19 * 60 },
                { day: 3, start: 9 * 60, end: 19 * 60 },
                { day: 4, start: 9 * 60, end: 19 * 60 },
                { day: 5, start: 9 * 60, end: 19 * 60 },
                { day: 6, start: 7 * 60, end: 17 * 60 },
            ],
        },
    ],
}

/** The /quote page's booking strip — the slot picker above the form. */
export const booking = {
    headline: "Hold your chair",
    intro: "Pick your style block and a time. The $50 deposit comes by text and holds the chair. Books open on the 1st and the 15th — if the calendar looks full, the form below puts you on Dez's cancellation list.",
    /** The new/returning select's trade voice (the widget's statusLabels). */
    statusLabels: { new: "First time in the Crown Room", returning: "I've sat in the chair before" },
    /** The line under the booking form (the widget's privacyNote). */
    privacyNote:
        "Your name and number hold the chair — nothing more. Dez texts one reminder two days out and never shares your number.",
}

export const quote = {
    headline: "Tell Dez the look.",
    body: "A photo of the style, your hair right now, and when you want it done. Dez answers between clients — usually the same evening.",
    confirmation:
        "Got it — Dez answers every request herself, usually the same evening. Keep an eye on your texts.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "phone", label: "Phone (for texts)", type: "tel" as const, required: true },
        { name: "email", label: "Email", type: "email" as const },
        {
            name: "style",
            label: "The style",
            type: "select" as const,
            options: [
                "Knotless",
                "Boho knotless",
                "Fulani",
                "Stitch braids",
                "Goddess locs",
                "Locs retwist",
                "Starter locs",
                "Kids' braids",
                "Not sure yet",
            ],
            required: true,
        },
        {
            name: "length",
            label: "Length",
            type: "select" as const,
            options: ["Shoulder", "Mid-back", "Waist", "Butt length"],
        },
        {
            name: "timing",
            label: "When you want it",
            placeholder: "A date, a trip, a wedding …",
        },
        {
            name: "message",
            label: "The look (paste a photo link)",
            type: "textarea" as const,
            fullWidth: true,
            required: true,
        },
    ],
}
