/**
 * The estate pack's single content file: the agent, the listings, the
 * neighborhoods, and the pages. Everything the site renders comes from
 * here — edit this file (not the page components) to make the site yours.
 * The demo agent works Providence's East Side, but the shape fits any
 * market: swap the listings, neighborhoods, and copy and the site follows.
 *
 * Listing statuses are data (`status`, `listedAt`, `soldAt`); the badges
 * the site renders from them ("New this week", "Sale pending", "Sold")
 * are computed per render by the listings engine (`listings.ts`) — update
 * the dates and statuses here and every badge, count, and sort follows.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/estate` (see PACK.md). The `photo` helper mirrors that
 * verb's naming exactly. Never point a slot at a raw camera file.
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
        src: `/estate/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/estate/${name}-${step}w.webp`, width: step })),
    }
}

export const agency = {
    name: "Maren Holt Realty",
    /** The agent the brand is built on — bylines, bio, and the about page. */
    agent: "Maren Holt",
    tagline: "East Side real estate, done personally",
    location: "Providence, Rhode Island",
    /** Shown everywhere the number appears; `phoneHref` is the tap target. */
    phone: "(401) 555-0184",
    phoneHref: "tel:+14015550184",
    email: "maren@holtrealty.example",
    address: "212 Wayland Ave, Providence, RI 02906",
    /** The trust line — rendered wherever confidence is being earned. */
    license: "Licensed Rhode Island broker REB.0018446 · Equal Housing Opportunity",
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
        slug: "benefit-street",
        title: "14 Benefit Street",
        neighborhood: "College Hill",
        price: "$1,285,000",
        beds: 4,
        baths: 3,
        sqft: 2940,
        description:
            "A 1790s brick rowhouse with its fanlight, twelve-pane windows, and heart-pine floors intact — plus a chef's kitchen and a walled garden out back.",
        image: photo(
            "listing-benefit",
            1536,
            1024,
            "A 1790s brick rowhouse with black shutters and a deep green front door behind a boxwood garden",
        ),
        status: "available",
        listedAt: "2026-08-24",
    },
    {
        slug: "atwells-loft",
        title: "66 Atwells Avenue, Loft 4C",
        neighborhood: "Federal Hill",
        price: "$612,000",
        beds: 2,
        baths: 2,
        sqft: 1560,
        description:
            "A corner loft in a converted mill: arched factory windows, exposed brick, timber beams, and a kitchen worth the walk up Atwells.",
        image: photo(
            "listing-atwells",
            1536,
            1024,
            "A mill-conversion loft interior with arched factory windows, exposed brick, and timber beams",
        ),
        status: "available",
        listedAt: "2026-08-16",
    },
    {
        slug: "ives-townhouse",
        title: "18 Ives Street",
        neighborhood: "Fox Point",
        price: "$749,000",
        beds: 3,
        baths: 2.5,
        sqft: 1920,
        description:
            "New construction that behaves on an old street: cedar and standing-seam over three smart stories, with a roof deck facing the harbor.",
        image: photo(
            "listing-ives",
            1536,
            1024,
            "A modern three-story townhouse in dark metal and cedar cladding between older brick houses",
        ),
        status: "available",
        listedAt: "2026-08-02",
    },
    {
        slug: "transit-cottage",
        title: "82 Transit Street",
        neighborhood: "Fox Point",
        price: "$539,000",
        beds: 2,
        baths: 1,
        sqft: 1180,
        description:
            "A butter-yellow clapboard cottage two blocks up from the water — window boxes, iron stoop rail, and morning light in every room.",
        image: photo(
            "listing-transit",
            1536,
            1024,
            "A yellow clapboard cottage with white trim and flower boxes on a narrow street near the harbor",
        ),
        status: "available",
        listedAt: "2026-07-30",
    },
    {
        slug: "orchard-colonial",
        title: "40 Orchard Avenue",
        neighborhood: "Wayland Square",
        price: "$1,150,000",
        beds: 5,
        baths: 3.5,
        sqft: 3480,
        description:
            "A center-hall colonial under old maples: portico entry, twin chimneys, a proper back lawn, and three finished floors of family house.",
        image: photo(
            "listing-wayland",
            1536,
            1024,
            "A white center-hall colonial with black shutters and a columned portico behind a deep lawn",
        ),
        status: "available",
        listedAt: "2026-08-10",
    },
    {
        slug: "pratt-victorian",
        title: "27 Pratt Street",
        neighborhood: "College Hill",
        price: "$875,000",
        beds: 4,
        baths: 2.5,
        sqft: 2610,
        description:
            "A Queen Anne with the turret, the wraparound porch, and the fish-scale gable — lovingly kept, two owners in sixty years.",
        image: photo(
            "listing-hope",
            1536,
            1024,
            "A sage-green Queen Anne Victorian with a corner turret and wraparound porch",
        ),
        status: "pending",
        listedAt: "2026-07-12",
    },
    {
        slug: "westminster-penthouse",
        title: "One Westminster, Penthouse 12",
        neighborhood: "Downcity",
        price: "$1,975,000",
        beds: 3,
        baths: 3,
        sqft: 2410,
        description:
            "Corner glass over the river: herringbone oak, a dusk view that sells itself, and the city's best walk-to-dinner address.",
        image: photo(
            "listing-westminster",
            1536,
            1024,
            "A penthouse living room at dusk with floor-to-ceiling windows over a city skyline and river",
        ),
        status: "pending",
        listedAt: "2026-06-28",
    },
    {
        slug: "governor-cottage",
        title: "9 Governor Street",
        neighborhood: "Fox Point",
        price: "$685,000",
        beds: 3,
        baths: 2,
        sqft: 1610,
        description:
            "A brick garden cottage behind an iron gate — deep porch, slate roof, and the kind of garden that took thirty years. Closed over asking.",
        image: photo(
            "listing-governor",
            1536,
            1024,
            "A brick garden cottage with a deep porch and dormers behind a lush cottage garden and iron gate",
        ),
        status: "sold",
        listedAt: "2026-05-06",
        soldAt: "2026-06-12",
    },
    {
        slug: "camp-bungalow",
        title: "44 Camp Street",
        neighborhood: "Mount Hope",
        price: "$565,000",
        beds: 3,
        baths: 1.5,
        sqft: 1540,
        description:
            "A 1920s craftsman bungalow with its tapered columns and rafter tails intact, a porch swing included. Eleven offers; sold in eighteen days.",
        image: photo(
            "listing-camp",
            1536,
            1024,
            "An olive-green craftsman bungalow with tapered porch columns on stone piers and a porch swing",
        ),
        status: "sold",
        listedAt: "2026-04-14",
        soldAt: "2026-05-02",
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
        slug: "college-hill",
        name: "College Hill",
        tagline: "Gas lamps, brick sidewalks, and the best-kept colonial streets in America",
        description:
            "The historic hill above downtown: Benefit Street's mile of colonial and Federal houses, gas lamps that still light, and Brown and RISD keeping the bookstores and cafés honest. Houses here hold their value the way they hold their paint — carefully, and for centuries.",
        image: photo(
            "hood-collegehill",
            1536,
            1024,
            "A gaslit street of colonial houses on College Hill at blue hour, a white church steeple beyond",
        ),
    },
    {
        slug: "fox-point",
        name: "Fox Point",
        tagline: "Bright clapboard streets running down to the harbor",
        description:
            "Providence's old Portuguese fishing quarter, now its most walkable village: painted cottages shoulder to shoulder, coffee on Wickenden Street, and the water at the end of the block. Small houses, fierce demand — Fox Point listings move faster than anywhere else on the East Side.",
        image: photo(
            "hood-foxpoint",
            1536,
            1024,
            "A row of brightly painted clapboard houses descending toward a harbor full of sailboats",
        ),
    },
    {
        slug: "federal-hill",
        name: "Federal Hill",
        tagline: "The city's table — and its best-value lofts",
        description:
            "Atwells Avenue's café lights and red-sauce institutions, with mill conversions and condo lofts tucked a block off the parade. If you want to walk to dinner every night and still make the highway in five minutes, this is the hill.",
        image: photo(
            "hood-federalhill",
            1536,
            1024,
            "Sidewalk café tables under green awnings and strings of lights on Federal Hill at golden hour",
        ),
    },
    {
        slug: "wayland-square",
        name: "Wayland Square",
        tagline: "Leafy, village-quiet, and five minutes from everything",
        description:
            "A pocket of 1920s colonials and tudors around a village square of bookshops, bakeries, and the morning coffee line. The school-run favorite: quiet streets, old trees, and a grocery you can walk to.",
        image: photo(
            "hood-wayland",
            1536,
            1024,
            "A leafy corner bookshop and café block with striped awnings and plane trees in Wayland Square",
        ),
    },
]

/** The trust numbers — the metrics strip. Keep values short and big. */
export const metrics = [
    { value: "$84M", label: "closed since 2012" },
    { value: "214", label: "homes sold" },
    { value: "12", label: "median days on market" },
    { value: "99%", label: "of asking, on average" },
]

export const testimonials = [
    {
        quote: "Maren told us which house NOT to buy — twice — and then found us the one we didn't know we were waiting for. She answered her phone on a Sunday night before our offer deadline. We'd never use anyone else.",
        name: "Dana & Marcus Oyelaran",
        detail: "Bought on College Hill",
    },
    {
        quote: "She priced our cottage a nudge under the neighbors laughed at, ran one perfect open house, and closed eleven offers later at 9% over asking. The staging, the photos, the timing — she runs it like a campaign.",
        name: "Ruth Calderón",
        detail: "Sold in Fox Point",
    },
    {
        quote: "We relocated from Chicago sight unseen. Maren walked us through six houses over video, flagged the two with knob-and-tube wiring before our inspector did, and had keys and a hand-drawn map of the neighborhood waiting at closing.",
        name: "Priya & Sam Venkat",
        detail: "Relocated to Wayland Square",
    },
]

export const home = {
    headline: "The right house, on the right street.",
    subheadline:
        "Fourteen years selling the East Side's rowhouses, colonials, and lofts — one agent from the first showing to the closing table.",
    heroImage: photo(
        "hero-01",
        1536,
        1024,
        "A brick rowhouse street on College Hill at golden hour, gas lamps and autumn trees along the sidewalk",
    ),
    /** Which listings lead the home rail — keep them current and available. */
    featuredListings: [listings[0], listings[1], listings[2], listings[4]],
}

export const about = {
    headline: "The agent who answers her phone.",
    photo: photo(
        "agent",
        1024,
        1536,
        "Maren Holt in a navy blazer on a brick sidewalk in front of a historic rowhouse",
    ),
    paragraphs: [
        "Maren Holt has sold Providence's East Side for fourteen years — long enough to have sold some houses twice and to know which block floods, which foundations to walk away from, and which listing agent underprices on purpose. She grew up on Camp Street, studied historic preservation, and can date a house from its window glass.",
        "She works alone, on purpose. No team, no hand-offs: the person at your first showing is the person negotiating your inspection credits and the person beside you at closing. She takes on a limited number of clients at a time so that stays true.",
        "Buyers get the truth about every house, including the ones she talks them out of. Sellers get a pricing strategy, staging, photography, and a negotiation run like a campaign — her listings have averaged 99% of asking across two hundred sales.",
    ],
    /** The uppercase credentials strip under the story. */
    credentials: [
        "RI broker REB.0018446",
        "Equal Housing Opportunity",
        "REALTOR® — Greater Providence Board",
        "Certified Residential Specialist",
    ],
}

export const contact = {
    headline: "Tell me what you're looking for.",
    body: "Buying, selling, or just wondering what your house is worth — a few lines here and I'll call you back within one business day. No mailing list, no hand-off to an assistant.",
    confirmation:
        "Thank you — your note is in. I reply to every inquiry personally within one business day, usually the same evening.",
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
            label: "Neighborhood",
            placeholder: "College Hill, Fox Point, flexible …",
        },
        { name: "timeline", label: "Ideal timing", placeholder: "This fall, next spring, flexible …" },
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
 * that would read wrong for a different city or brand. A remix seed
 * retrades these along with the rest of the content — everything else in
 * the landing modules is market-neutral on purpose.
 */
export const landingCopy = {
    /** The contact ask — the shell's nav CTA and every landing CTA. */
    contactCtaLabel: "Work with Maren",
    /** The home page's featured-listings heading. */
    featuredHeading: "On the market now",
    /** The home page's neighborhoods heading. */
    neighborhoodsHeading: "The streets I work",
    /** The closing ask on every page's banner. */
    finalCtaTitle: "Thinking about a move?",
}
