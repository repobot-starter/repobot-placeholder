/**
 * The estate-aldercott remix's content seed — a structural twin of
 * `content.ts` that compose copies over it (packs/README.md "Derived
 * templates"). The demo broker sells Bellingham's waterfront and view
 * homes: Chuckanut Drive, Lake Whatcom, Fairhaven, and Edgemoor. Swap the
 * listings, shorelines, and copy and the site follows.
 *
 * Listing statuses are data (`status`, `listedAt`, `soldAt`); the badges
 * the site renders from them ("New this week", "Sale pending", "Sold")
 * are computed per render by the listings engine (`listings.ts`) — update
 * the dates and statuses here and every badge, count, and caption follows.
 *
 * `home.stack` switches the home to the plates: the featured listings edge
 * to edge at the hero's size, each captioned inside its photograph with
 * the address over its place, price, and computed status.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/estate-aldercott` (see PACK.md). The `photo` helper
 * mirrors that verb's naming exactly. Never point a slot at a raw camera
 * file.
 */

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
        src: `/estate-aldercott/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/estate-aldercott/${name}-${step}w.webp`, width: step })),
    }
}

export const agency = {
    name: "Aldercott",
    /** The broker the brand is built on — bylines, bio, and the about page. */
    agent: "Ines Aldercott",
    tagline: "Waterfront and view homes on Bellingham Bay",
    location: "Bellingham, Washington",
    /** Shown everywhere the number appears; `phoneHref` is the tap target. */
    phone: "(360) 555-0147",
    phoneHref: "tel:+13605550147",
    email: "ines@aldercott.example",
    address: "1307 11th Street, Bellingham, WA 98225",
    /** The trust line — rendered wherever confidence is being earned. */
    license: "Designated broker, Washington license 24031876 · Equal Housing Opportunity",
}

export type ListingStatus = "available" | "pending" | "sold"

export interface Listing {
    slug: string
    /** The street address — the title a buyer actually remembers. */
    title: string
    neighborhood: string
    /** "$1,285,000" — display string; sold listings show their closed price. */
    price: string
    beds: number
    baths: number
    sqft: number
    description: string
    image: SiteImage
    status: ListingStatus
    /** ISO date the listing went live — drives "New this week" / days on market. */
    listedAt: string
    /** ISO date it closed; only meaningful when `status` is "sold". */
    soldAt?: string
}

export const listings: Listing[] = [
    {
        slug: "chuckanut-shore",
        title: "412 Chuckanut Shore Road",
        neighborhood: "Chuckanut Drive",
        price: "$4,850,000",
        beds: 4,
        baths: 3.5,
        sqft: 3860,
        description:
            "A 1968 cedar-and-glass house set into the honeycombed sandstone at the tide line — 180 feet of Samish Bay shore, herons on the flats at low water, and the sun going down behind the San Juans from every room.",
        image: photo(
            "chuckanut-shore",
            2400,
            1800,
            "A long cedar-and-glass house on sandstone at the edge of Samish Bay, a woman laughing on the rocks as her retriever shakes off seawater",
        ),
        status: "available",
        listedAt: "2026-09-19",
    },
    {
        slug: "north-shore-dock",
        title: "2270 North Shore Drive",
        neighborhood: "Lake Whatcom",
        price: "$3,195,000",
        beds: 5,
        baths: 4,
        sqft: 4120,
        description:
            "A timber-gabled lake house on 120 feet of west-facing frontage: a new dock long enough for the whole family to jump off at once, a boathouse deck, and evening light straight down the lake.",
        image: photo(
            "whatcom-dock",
            2400,
            1800,
            "Two children leaping hand in hand off a wooden dock into Lake Whatcom while their father cheers, a glass-gabled cedar lake house behind",
        ),
        status: "available",
        listedAt: "2026-09-10",
    },
    {
        slug: "harris-loft",
        title: "1101 Harris Avenue, Loft 4",
        neighborhood: "Fairhaven",
        price: "$1,475,000",
        beds: 2,
        baths: 2,
        sqft: 1940,
        description:
            "The top floor of an 1890 brick block: arched windows over the rooftops to the bay, old-growth fir beams, a long oak kitchen, and the village's cafés and the ferry terminal two minutes down Harris.",
        image: photo(
            "fairhaven-loft",
            2400,
            1800,
            "A couple dancing and laughing in a brick-walled loft kitchen, arched windows looking over Fairhaven's rooftops to the bay at dusk",
        ),
        status: "available",
        listedAt: "2026-08-24",
    },
    {
        slug: "bayside-baker",
        title: "318 Bayside Road",
        neighborhood: "Edgemoor",
        price: "$2,690,000",
        beds: 4,
        baths: 3,
        sqft: 3340,
        description:
            "A 1962 northwest-modern restored with care: a full wall of steel glass framing Mount Baker across the bay, fir ceilings, a stone hearth, and the Taylor Dock boardwalk at the foot of the street.",
        image: photo(
            "edgemoor-baker",
            2400,
            1800,
            "A woman in socks and an oversized sweater laughing at the window wall of a fir-ceilinged living room, snow-capped Mount Baker across the bay",
        ),
        status: "available",
        listedAt: "2026-09-02",
    },
    {
        slug: "west-shore-bluff",
        title: "2940 West Shore Drive",
        neighborhood: "Lummi Island",
        price: "$1,285,000",
        beds: 1,
        baths: 1,
        sqft: 640,
        description:
            "A cedar studio cabin on two acres of bluff over Rosario Strait — a driftwood beach, wind-bent firs, and permitted plans for the main house. Six minutes across on the ferry, a long way from anywhere.",
        image: photo(
            "lummi-bluff",
            1600,
            1200,
            "A small cedar cabin with a shed roof on a grassy bluff above Rosario Strait, driftwood on the beach and a wooden bench on the lawn",
        ),
        status: "available",
        listedAt: "2026-07-30",
    },
    {
        slug: "sixteenth-craftsman",
        title: "1024 16th Street",
        neighborhood: "South Hill",
        price: "$1,395,000",
        beds: 4,
        baths: 2.5,
        sqft: 2680,
        description:
            "A 1912 craftsman on South Hill with its river-rock porch piers, original fir trim, and the bay at the end of the block. Four offers; pending in nine days.",
        image: photo(
            "south-hill",
            1600,
            1200,
            "A charcoal-green shingled craftsman house with a river-rock porch under golden maples on a wet autumn street",
        ),
        status: "pending",
        listedAt: "2026-08-05",
    },
    {
        slug: "madrona-lane",
        title: "88 Madrona Lane",
        neighborhood: "Chuckanut Drive",
        price: "$3,400,000",
        beds: 3,
        baths: 3,
        sqft: 3050,
        description:
            "Board-formed concrete, charred cedar, and a reflecting pool on a madrona ridge above Chuckanut Bay. Closed at asking in five weeks.",
        image: photo(
            "madrona-house",
            1600,
            1200,
            "A low concrete and charred-cedar house glowing at blue hour behind a black reflecting pool, madronas and firs around it and the bay beyond",
        ),
        status: "sold",
        listedAt: "2026-05-12",
        soldAt: "2026-06-20",
    },
    {
        slug: "samish-ridge",
        title: "5710 Samish Ridge Road",
        neighborhood: "Samish Valley",
        price: "$2,150,000",
        beds: 4,
        baths: 3.5,
        sqft: 3420,
        description:
            "A dark-clad farmhouse on nine acres of meadow above the Samish Valley, the Cascade foothills in every window. Three offers the first weekend.",
        image: photo(
            "samish-ridge",
            1600,
            1200,
            "A dark vertical-cedar farmhouse with a metal roof on a meadow ridge, farmland and blue Cascade foothills beyond",
        ),
        status: "sold",
        listedAt: "2026-04-02",
        soldAt: "2026-05-15",
    },
]

export interface Neighborhood {
    slug: string
    name: string
    /** One line of what living there is actually like. */
    tagline: string
    description: string
    image: SiteImage
}

export const neighborhoods: Neighborhood[] = [
    {
        slug: "chuckanut-drive",
        name: "Chuckanut Drive",
        tagline: "Sandstone, madrona, and the sun going down behind the San Juans",
        description:
            "Seven miles of road cut into the cliffs above Chuckanut and Samish Bays — the loveliest drive in the state and some of its most private shoreline. Houses here are few, they sit on rock, and they seldom sell twice in a decade. Buy one for the light; the tide pools come with it.",
        image: photo(
            "hood-chuckanut",
            1600,
            1200,
            "Two friends on a sandstone ledge under a red-barked madrona above Samish Bay at dusk, one laughing, one pointing out at the islands",
        ),
    },
    {
        slug: "lake-whatcom",
        name: "Lake Whatcom",
        tagline: "Ten miles of freshwater, docks, and morning mist",
        description:
            "A long, deep lake ten minutes from downtown: docks and swim floats along the north shore, forest down to the water on the south, and paddleboards out before the mist burns off. Waterfront here trades on frontage and the angle of the evening sun.",
        image: photo(
            "hood-whatcom",
            1600,
            1200,
            "Two paddleboarders gliding across a misty lake at dawn, the one in front looking back and laughing, forested hills fading into fog",
        ),
    },
    {
        slug: "fairhaven",
        name: "Fairhaven",
        tagline: "An 1890s brick village on the water",
        description:
            "Bellingham's old port town: brick blocks from the 1890 boom, bookshops and cafés on Harris and 11th, the Alaska ferry at the foot of the hill, and the Interurban trail out the back door. Lofts, townhouses, and a few old Victorians — the walkable end of the city.",
        image: photo(
            "hood-fairhaven",
            1600,
            1200,
            "Four friends laughing over coffee and pastries at a café table on a brick sidewalk in historic Fairhaven",
        ),
    },
    {
        slug: "edgemoor",
        name: "Edgemoor",
        tagline: "Mount Baker across the bay, from the living room",
        description:
            "Quiet streets of midcentury houses on the bluff south of Fairhaven, most of them turned to face the bay and the mountain. Big lots, big trees, the Taylor Dock boardwalk for the morning run, and the steadiest view values in the city.",
        image: photo(
            "hood-edgemoor",
            1600,
            1200,
            "A young man jogging on a wooden boardwalk over Bellingham Bay with a border collie bounding beside him, Mount Baker white in the distance",
        ),
    },
]

/** The trust numbers — the metrics strip. Keep values short and big. */
export const metrics = [
    { value: "$486M", label: "in waterfront and view sales" },
    { value: "171", label: "homes sold since 2014" },
    { value: "23", label: "median days on market" },
    { value: "98.6%", label: "of asking, on average" },
]

export const testimonials = [
    {
        quote: "Ines walked the Chuckanut house with us at low tide and again at a king tide before she'd let us write an offer, and she found the bulkhead permit the seller never pulled. We paid less than we'd budgeted and sleep straight through the storms.",
        name: "Hana & Theo Marchetti",
        detail: "Bought on Chuckanut Drive",
    },
    {
        quote: "She told us to list in September, not June — the lake photographs better when the evening light comes straight down it. Eleven days, two offers, over asking, and she never once raised her voice.",
        name: "Rosalind Achebe",
        detail: "Sold on Lake Whatcom",
    },
    {
        quote: "We bought from Brooklyn with a toddler and a dog. Ines sent video of the whole block, the ferry schedule, and the three bakeries worth knowing, and we closed without flying out once.",
        name: "Devika & Owen Hale",
        detail: "Moved to Fairhaven",
    },
]

export const home = {
    headline: "Bellingham, from the waterline up.",
    subheadline:
        "Waterfront and view homes on Chuckanut Drive, Lake Whatcom, Fairhaven, and Edgemoor — one broker from the first walk-through to the keys.",
    heroImage: photo(
        "hero-chuckanut",
        2400,
        1800,
        "A cedar-and-glass house cantilevered over sandstone above Chuckanut Bay at blue hour, two people laughing on the lit deck under the madronas",
    ),
    /** Which listings lead the home plates — keep them current and available. */
    featuredListings: [listings[0], listings[1], listings[2], listings[3]],
    /** The plates home: the featured listings at the hero's size, captioned inside their photographs. */
    stack: {
        closing: "Tell me which water you want to live beside.",
        closingBody: "I'll tell you what the tide does to it.",
        agentCta: "More about Ines",
    },
}

export const about = {
    headline: "The broker who reads the tide tables.",
    photo: photo(
        "agent-ines",
        1024,
        1365,
        "Ines Aldercott laughing mid-stride on a marina dock with a coffee, in a camel coat and oatmeal sweater, sailboat masts behind her",
    ),
    paragraphs: [
        "Ines Aldercott grew up on Lummi Island, worked the ferry deck through college, and has sold Bellingham's waterfront for twelve years — long enough to know which bulkheads were permitted, which slopes move in a wet winter, and which view easements hold up.",
        "She works alone, on purpose. The person at your first walk-through is the one reading the geotechnical report, negotiating the dock survey, and standing on the deck with you at closing. She takes on a handful of clients at a time so that stays true.",
        "Sellers get pricing from a decade of shoreline trades rather than a zip-code average, photographs scheduled for the light each house was built for, and a negotiation run quietly. Buyers get the truth about every shoreline, including the ones she talks them out of.",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "WA designated broker 24031876",
        "Equal Housing Opportunity",
        "Certified Residential Specialist",
        "Whatcom County Association of REALTORS®",
    ],
}

export const contact = {
    headline: "Tell me about the house, or the water you want.",
    body: "Buying, selling, or wondering what the view is worth — a few lines here and I'll call you back within one business day. No mailing list, no hand-off to an assistant.",
    confirmation:
        "Thank you — your note is in. I answer every inquiry myself within one business day, usually the same evening.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "phone", label: "Phone", type: "tel" as const, required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        {
            name: "interest",
            label: "Buying or selling",
            placeholder: "Buying, selling, both, curious …",
        },
        {
            name: "neighborhood",
            label: "Shoreline",
            placeholder: "Chuckanut, Lake Whatcom, Fairhaven, flexible …",
        },
        { name: "timeline", label: "Ideal timing", placeholder: "This winter, next summer, flexible …" },
        {
            name: "message",
            label: "About your move",
            type: "textarea" as const,
            fullWidth: true,
            required: true,
        },
    ],
}

/**
 * Landing copy the market owns: the few strings the landing modules render
 * that would read wrong for a different city or brand.
 */
export const landingCopy = {
    /** The contact ask — the shell's nav CTA and every landing CTA. */
    contactCtaLabel: "Talk to Ines",
    /** The home page's featured-listings heading. */
    featuredHeading: "On the water now",
    /** The home page's neighborhoods heading. */
    neighborhoodsHeading: "Four shorelines, four ways to live",
    /** The closing ask on every page's banner. */
    finalCtaTitle: "Thinking about the water?",
    /** The home page's asks, kickers, and closing line. */
    home: {
        heroCta: "See the listings",
        featuredKicker: "Featured",
        neighborhoodsKicker: "Where I work",
        testimonialsKicker: "From my clients",
        bannerBody: "Buying or selling on the shoreline — one conversation, no obligation.",
    },
    /** The listings page. */
    listingsPage: {
        headline: "Every house on the water, with its status.",
        subheadline:
            "What's new, what's pending, and what just closed along Bellingham's shoreline — the status keeps itself current. Filter by neighborhood below.",
        kicker: "The inventory",
        allLabel: "All shorelines",
        bannerBody: "Want a private showing, or first word when a house like this comes up? Say so.",
    },
    /** The neighborhoods page. */
    neighborhoodsPage: {
        headline: "Buy the shoreline, not just the house.",
        subheadline:
            "Twelve years on the same stretch of the Salish Sea — how its shorelines actually differ, from the light to the frontage to the winter storms.",
        kicker: "Where I work",
        listingsCta: "See what's listed",
        bannerBody: "Not sure which water suits you? That's the first conversation.",
    },
    /** The about page: the story's kicker and the bullets after the license line. */
    aboutPage: {
        kicker: "The broker",
        bullets: [
            "One broker, first walk-through to closing — no hand-offs",
            "171 waterfront and view sales since 2014, at 98.6% of asking",
        ],
        credentialsLabel: "Credentials",
        testimonialsTitle: "In their words",
    },
    /** The contact page's form. */
    contactPage: {
        kicker: "Contact",
        title: "The details",
        submitLabel: "Send the note",
    },
}
