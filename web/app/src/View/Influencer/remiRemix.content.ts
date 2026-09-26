/**
 * The influencer-remi remix seed: Remi Adebayo, a Peckham creator who
 * shoots one roll of 35mm a week with his mates. Same shape as the base
 * content.ts — the composer copies this file over it byte for byte — so
 * every export the pages import is here, in the same contract shapes (see
 * content.ts for what each one feeds).
 *
 * `links` and `looks` mirror the links and looks domains exactly as in
 * the base; the catalog's `content` seed repeats them entry for entry.
 *
 * `home.edition` is this seed's own home (influencerLanding.ts
 * `InfluencerEdition`): his name as the masthead across the foot of the
 * photograph, then this week's roll printed as a contact sheet — frame
 * numbers, the film's edge print, his grease-pencil picks — and the fits
 * as a numbered board.
 *
 * Images: `npm run image -- responsive <original> --out-dir
 * web/app/public/influencer-remi`. One creator, bright London daylight
 * into dusk, candid, with his friends in frame. The hero and the roll are
 * 4:3; the fits and the portrait 3:4.
 */

import type { ContentLink } from "../Landing/linksDocument"
import type { ContentLook } from "../Landing/looksDocument"

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
        src: `/influencer-remi/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/influencer-remi/${name}-${step}w.webp`, width: step })),
    }
}

export const creator = {
    /** The brand IS the person — the masthead name and the byline. */
    name: "Remi Adebayo",
    /** The @-handle, rendered wherever the platforms are named. */
    handle: "@remi.adebayo",
    tagline: "One roll a week",
    location: "Peckham, SE15",
    /** Business email — brand inquiries; rendered as copyable plain text. */
    email: "studio@remiadebayo.example",
    /** The one-line trust chrome the footer and press strips carry. */
    credentialLine: "449K followers across five platforms · 38 rolls this year · 11 brand partners",
}

/** Landing copy the creator's discipline owns (see content.ts). */
export const landingCopy = {
    /** The partnership ask — the shell's nav CTA and every closing banner. */
    contactCtaLabel: "Work with me",
    /** The home page's featured-looks heading. */
    featuredHeading: "Fits this month",
    /** The home page's link-hub teaser heading. */
    linksHeading: "Right now",
    /** The looks grid's "everything" filter chip. */
    allLooksLabel: "All fits",
    /** The links hub's "everything" group chip. */
    allLinksLabel: "Everything",
    /** The closing ask on every page's banner. */
    finalCtaTitle: "Got a brief? Send it.",
    /** The shell's nav labels for the pack's canonical pages. */
    nav: { looks: "Fits", links: "Links", about: "About" },
}

/** Where the audience lives. Follower counts are display strings, updated seasonally. */
export const platforms = [
    {
        name: "TikTok",
        handle: "@remi.adebayo",
        followers: "212K",
        url: "https://www.tiktok.com/@remi.adebayo",
    },
    {
        name: "Instagram",
        handle: "@remi.adebayo",
        followers: "164K",
        url: "https://www.instagram.com/remi.adebayo",
    },
    {
        name: "YouTube",
        handle: "Remi Adebayo",
        followers: "58K",
        url: "https://www.youtube.com/@remiadebayo",
    },
    {
        name: "Depop",
        handle: "The rail",
        followers: "9K",
        url: "https://www.depop.com/remiadebayo",
    },
    {
        name: "Substack",
        handle: "Second Roll",
        followers: "6K",
        url: "https://secondroll.substack.com",
    },
]

/**
 * The link hub — the links domain's shape, verbatim. ORDER IS THE
 * CONTENT: the hub renders top to bottom, newest first.
 */
export const links: ContentLink[] = [
    {
        slug: "roll-38-scans",
        title: "Roll 38 — the full scans",
        url: "https://remiadebayo.gumroad.com/l/roll-38",
        description: "All 36 frames from this week, full res, the ones I didn't circle too.",
        badge: "New",
        category: "Film",
    },
    {
        slug: "scan-a-roll-video",
        title: "How I scan a roll for under £5",
        url: "https://www.youtube.com/@remiadebayo",
        description: "An old flatbed, a phone light and a lot of dust. Twelve minutes.",
        category: "Watch",
    },
    {
        slug: "second-roll-issue-6",
        title: "Second Roll, issue 6",
        url: "https://remiadebayo.gumroad.com/l/second-roll-6",
        description: "The zine: 40 pages of the rolls I couldn't stop looking at, risograph, 200 copies.",
        badge: "Pre-order",
        category: "Film",
    },
    {
        slug: "rail-day",
        title: "Rail Day — first Saturday, Bellenden Road",
        url: "https://remiadebayo.gumroad.com/l/rail-day",
        description: "The monthly thrift rail: everything £5 to £40, come early for the jackets.",
        badge: "Free",
        category: "Thrift",
    },
    {
        slug: "grainhouse-400",
        title: "Grainhouse 400 — the stock I shoot",
        url: "https://www.grainhouse.example/remi",
        description: "Every roll on this site. Ten percent off a five-pack with my code.",
        badge: "Code REMI10",
        category: "Partners",
    },
    {
        slug: "northpaw-trail",
        title: "Northpaw Trail 2 — the grey pair",
        url: "https://www.northpaw.example/remi",
        description: "The ones from the rooftop and the chip-shop frames. Worn in, not worn out.",
        category: "Partners",
    },
    {
        slug: "the-rail-online",
        title: "The rail, online",
        url: "https://www.depop.com/remiadebayo",
        description: "What didn't sell on Rail Day, and the fits I've shot and moved on from.",
        category: "Thrift",
    },
]

/** One look: the looks domain's owner facts plus the code-owned photograph. */
export interface CreatorLook extends ContentLook {
    image: SiteImage
}

export const looks: CreatorLook[] = [
    {
        slug: "olive-chore",
        title: "Olive chore coat, grey hoodie",
        category: "Workwear",
        description:
            "A washed olive chore coat over a grey hoodie, the baggiest light jeans I own, beaten white trainers. Most weeks, honestly.",
        productLinks: [
            { label: "The chore coat", url: "https://www.offcutstudio.example/chore-olive" },
            { label: "The hoodie", url: "https://www.offcutstudio.example/hoodie-grey" },
            { label: "The trainers", url: "https://www.northpaw.example/trail-2-chalk" },
        ],
        featured: true,
        image: photo(
            "fit-chore",
            1152,
            1536,
            "Remi leaning on a pale green painted wall, grinning, in a washed olive chore coat over a grey hoodie, very baggy light jeans and white trainers, a film camera on a strap",
        ),
    },
    {
        slug: "tan-suede",
        title: "Tan suede, brown trousers",
        category: "Thrifted",
        description:
            "A tan suede jacket from the Rail Day box, a plain white tee and wide brown trousers — twenty-two quid all in, before the shoes.",
        productLinks: [
            { label: "The white tee", url: "https://www.offcutstudio.example/tee-white" },
            { label: "The loafers", url: "https://www.kerbskate.example/loafer-brown" },
        ],
        featured: true,
        image: photo(
            "fit-suede",
            1152,
            1536,
            "Remi walking down a terraced South London street at golden hour in a tan suede jacket, white tee, wide brown trousers and brown loafers",
        ),
    },
    {
        slug: "stripe-jersey",
        title: "The stripe jersey",
        category: "Sport",
        description:
            "A navy-and-white striped football shirt, black shorts, white socks pulled up — Sunday five-a-side on the cage court, camera on the bench.",
        productLinks: [
            { label: "The jersey", url: "https://www.kerbskate.example/jersey-stripe" },
            { label: "The socks", url: "https://www.northpaw.example/crew-white" },
        ],
        featured: true,
        image: photo(
            "fit-jersey",
            1152,
            1536,
            "Remi mid-kick on a rooftop cage football court in a navy-and-white striped jersey, black shorts and white socks, laughing, the ball in the air",
        ),
    },
    {
        slug: "night-bus-knit",
        title: "Night bus knit",
        category: "Night out",
        description:
            "A charcoal knit, khaki work trousers and a camera round my neck for the walk home — the N171 stop, the street still wet.",
        productLinks: [
            { label: "The knit", url: "https://www.offcutstudio.example/knit-charcoal" },
            { label: "The work trousers", url: "https://www.offcutstudio.example/work-khaki" },
            { label: "The headphones", url: "https://www.loopaudio.example/remi" },
        ],
        featured: true,
        image: photo(
            "fit-nightbus",
            1152,
            1536,
            "Remi at a lit night-bus shelter on a wet street, in a charcoal knit and khaki work trousers, a film camera in his hands, a red bus blurred behind",
        ),
    },
    {
        slug: "sunday-polo",
        title: "Sunday polo",
        category: "Sunday",
        description:
            "A cream knitted polo, stone trousers and a coffee from the place on Choumert Road — the one day nothing has to be loud.",
        productLinks: [
            { label: "The knitted polo", url: "https://www.offcutstudio.example/polo-cream" },
            { label: "The stone trousers", url: "https://www.offcutstudio.example/trouser-stone" },
        ],
        image: photo(
            "fit-sunday",
            1152,
            1536,
            "Remi outside a sage-green café front on a sunny morning, in a cream knitted polo and stone trousers, holding a paper coffee cup",
        ),
    },
]

/** The trust numbers — the metrics strip. */
export const metrics = [
    { value: "449K", label: "followers across platforms" },
    { value: "38", label: "rolls shot this year" },
    { value: "6", label: "issues of Second Roll" },
    { value: "11", label: "brand partners" },
]

/** Brands worked with and press that covered the work. */
export const collaborations = [
    "Grainhouse Film — the 400 launch, spring 2026",
    "Northpaw Trail 2 campaign, 2026",
    "Kerb Skate Co. — the Rye Lane deck",
    "Loop Audio — Top Deck, a mix series",
    "Offcut Studio chore coat, autumn 2026",
]

/** What working with the creator is like — the brand-side testimonials. */
export const testimonials = [
    {
        quote: "We sent Remi forty rolls for the launch and got back a contact sheet of his whole street. Half the frames had his mates in them; that was the campaign.",
        name: "Priya Nair",
        detail: "Brand lead, Grainhouse Film",
    },
    {
        quote: "He shot the Trail 2 on the top deck of the 12 at seven in the morning. No crew, no permits, no retouching — and it outperformed the studio set four to one.",
        name: "Tom Whitlock",
        detail: "Marketing, Northpaw",
    },
    {
        quote: "Remi designed the Rye Lane deck with the kids who skate the estate and put all of them in the photos. It sold out in a weekend.",
        name: "Dele Ogun",
        detail: "Co-founder, Kerb Skate Co.",
    },
]

export const home = {
    headline: "Remi Adebayo",
    subheadline:
        "Secondhand workwear, big denim and my mates — one roll of 35mm a week, scanned on Sunday, every fit linked.",
    heroImage: photo(
        "hero",
        2400,
        1800,
        "Remi Adebayo laughing on a rooftop car park at golden hour with the South London skyline behind him, in an olive chore jacket over a grey hoodie and baggy light jeans, a film camera on his chest and a skateboard under his arm",
    ),
    /** This seed's own home (influencerLanding.ts `InfluencerEdition`). */
    edition: {
        hero: "masthead-overlay" as const,
        accent: "none" as const,
        credit: "Shot on 35mm by my mates · one roll a week",
        story: {
            variant: "contact-sheet" as const,
            kicker: "Roll 38",
            title: "This week's roll",
            frames: [
                {
                    image: photo(
                        "roll-estate",
                        1600,
                        1200,
                        "Remi skating along a riverside path past estate towers on a bright winter afternoon",
                    ),
                    caption: "Monday — the long way round the estate",
                },
                {
                    image: photo(
                        "roll-bus",
                        1600,
                        1200,
                        "Remi laughing in the front seat of a bus top deck, sun through the window, in an olive jacket and grey hoodie",
                    ),
                    caption: "Top deck of the 12, front seat",
                    mark: "circle" as const,
                    note: "zine cover?",
                },
                {
                    image: photo(
                        "roll-kickflip",
                        1600,
                        1200,
                        "A friend in a white tee kickflipping off a ledge under a railway bridge while two friends watch from the wall",
                    ),
                    caption: "Tobi under the arches, first try",
                    mark: "circle" as const,
                    note: "Tobi's best",
                },
                {
                    image: photo(
                        "roll-records",
                        1600,
                        1200,
                        "Remi in a cream knit and black beanie laughing while flipping through a crate in a record shop, a friend beside him",
                    ),
                    caption: "Record shop, Rye Lane",
                },
                {
                    image: photo(
                        "roll-chips",
                        1600,
                        1200,
                        "Remi sharing a paper of chips on a bench at dusk with two friends, all three laughing",
                    ),
                    caption: "Chips after, on the bench",
                    mark: "cross" as const,
                },
                {
                    image: photo(
                        "roll-market",
                        1600,
                        1200,
                        "Remi holding up a tan jacket at a crowded thrift market stall while an older stallholder looks on",
                    ),
                    caption: "Saturday market — the suede, found",
                },
                {
                    image: photo(
                        "roll-barber",
                        1600,
                        1200,
                        "Remi laughing in a barber's chair under a black cape while the barber trims his hairline",
                    ),
                    caption: "Fresh cut at Kay's",
                },
                {
                    image: photo(
                        "roll-rooftop",
                        1600,
                        1200,
                        "Remi photographing the skyline from a rooftop at dusk while a friend points across the city",
                    ),
                    caption: "Roof at dusk, last frame",
                    mark: "circle" as const,
                    note: "THIS ONE",
                },
            ],
            edgeCode: "Grainhouse 400",
            firstFrame: 14,
        },
        looks: "specimens" as const,
        kindWords: "quote-grid" as const,
        banner: "full-bleed" as const,
        copy: {
            looksCta: "See the fits",
            featuredKicker: "The fits",
            platformsKicker: "Where I post",
            platformsTitle: "Five feeds, same roll",
            hubKicker: "Links",
            kindWordsKicker: "Brands I've shot with",
            kindWordsTitle: "What they said after",
            homeBannerBody:
                "Campaigns, lookbooks, a film stock launch — shot on real film, on real streets, with my mates in it.",
            looksBannerBody: "",
            linksBannerBody: "",
            aboutKicker: "About Remi",
            aboutBullets: [
                "Every campaign shot on film, scanned by hand",
                "Secondhand first — I always say what was gifted",
            ],
        },
    },
}

export const linksPage = {
    headline: "Links. All of them.",
    subheadline:
        "This week's scans, the zine, Rail Day and the codes — newest at the top, same as the group chat.",
}

export const looksPage = {
    headline: "Every fit, numbered.",
    subheadline:
        "Workwear, thrift finds, match days and night buses — filter it down, then find where it's from.",
    /** The shop-the-looks strip under the grid. */
    shopHeading: "Where it's from",
}

export const about = {
    headline: "Thirty-eight rolls and counting.",
    photo: photo(
        "portrait-remi",
        1152,
        1536,
        "Remi at his desk by a bright window, laughing as he holds a strip of negatives up to the light, prints pinned to the wall behind him",
    ),
    paragraphs: [
        "Remi Adebayo grew up two stops down the line in Lewisham and started shooting in 2023 on his uncle's old rangefinder, one roll a week because that was what the job at the record shop paid for. The rule stuck.",
        "Every Sunday the roll gets scanned at his desk and the best frames go up — his mates skating, the top deck, the barber, whatever he wore that week. Most of it is secondhand, from markets and the Rail Day box, and he always says what was gifted.",
        "Brand work is shot the same way: on film, on real streets, with the people who are actually there. Second Roll, the zine, prints the frames he can't stop looking at.",
    ],
    /** The uppercase collaborations strip under the story. */
    credentials: collaborations,
}

export const contact = {
    headline: "Send the brief.",
    body: "Tell me the product, the idea and when you need it — I reply within two working days. Everything is shot on film; rates, usage and scans are priced upfront, no surprises.",
    confirmation: "Cheers — got it. I'll reply within two working days.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "company", label: "Brand / company", required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        {
            name: "campaign",
            label: "What's the job",
            placeholder: "A campaign, a lookbook, a launch, a zine collab …",
        },
        { name: "budget", label: "Budget range", placeholder: "£1–3k, £3–10k, still working it out …" },
        { name: "timeline", label: "When", placeholder: "Spring 2027, next month, whenever it's right …" },
        {
            name: "message",
            label: "The brief",
            type: "textarea" as const,
            fullWidth: true,
            required: true,
        },
    ],
}
