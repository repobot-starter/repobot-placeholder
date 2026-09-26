/**
 * The influencer-lua remix seed: Lua Marinho, a Lisbon fashion and
 * slow-travel creator. Same shape as the base content.ts — the composer
 * copies this file over it byte for byte — so every export the pages
 * import is here, in the same contract shapes (see content.ts for what
 * each one feeds).
 *
 * `links` and `looks` mirror the links and looks domains exactly as in
 * the base; the catalog's `content` seed repeats them entry for entry.
 *
 * `home.edition` is this seed's own home (influencerLanding.ts
 * `InfluencerEdition`): the hero as the first full-bleed frame, then the
 * diary — four more photographs at the hero's size, each captioned inside
 * the frame with the place, the hour, and what she wore.
 *
 * Images: `npm run image -- responsive <original> --out-dir
 * web/app/public/influencer-lua`. One creator, one light: every
 * photograph is the last hour before sunset (or just after it), candid,
 * on real streets, beaches and ferries. The hero and the diary are 4:3;
 * the looks and the portrait 3:4.
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
        src: `/influencer-lua/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/influencer-lua/${name}-${step}w.webp`, width: step })),
    }
}

export const creator = {
    /** The brand IS the person — the masthead name and the byline. */
    name: "Lua Marinho",
    /** The @-handle, rendered wherever the platforms are named. */
    handle: "@luamarinho",
    tagline: "Dressed for the last light",
    location: "Lisbon, Portugal",
    /** Business email — brand inquiries; rendered as copyable plain text. */
    email: "hello@luamarinho.example",
    /** The one-line trust chrome the footer and press strips carry. */
    credentialLine: "388K followers across five platforms · 17 brand partners",
}

/** Landing copy the creator's discipline owns (see content.ts). */
export const landingCopy = {
    /** The partnership ask — the shell's nav CTA and every closing banner. */
    contactCtaLabel: "Work with me",
    /** The home page's featured-looks heading. */
    featuredHeading: "This summer's looks",
    /** The home page's link-hub teaser heading. */
    linksHeading: "Right now",
    /** The looks grid's "everything" filter chip. */
    allLooksLabel: "All looks",
    /** The links hub's "everything" group chip. */
    allLinksLabel: "Everything",
    /** The closing ask on every page's banner. */
    finalCtaTitle: "Planning a season around the light?",
    /** The shell's nav labels for the pack's canonical pages. */
    nav: { looks: "Looks", links: "Links", about: "About" },
}

/** Where the audience lives. Follower counts are display strings, updated seasonally. */
export const platforms = [
    {
        name: "Instagram",
        handle: "@luamarinho",
        followers: "241K",
        url: "https://www.instagram.com/luamarinho",
    },
    { name: "TikTok", handle: "@luamarinho", followers: "86K", url: "https://www.tiktok.com/@luamarinho" },
    {
        name: "YouTube",
        handle: "Lua Marinho",
        followers: "39K",
        url: "https://www.youtube.com/@luamarinho",
    },
    {
        name: "Pinterest",
        handle: "luamarinho",
        followers: "12K",
        url: "https://www.pinterest.com/luamarinho",
    },
    {
        name: "Substack",
        handle: "Last Light",
        followers: "10K",
        url: "https://lastlight.substack.com",
    },
]

/**
 * The link hub — the links domain's shape, verbatim. ORDER IS THE
 * CONTENT: the hub renders top to bottom, newest first.
 */
export const links: ContentLink[] = [
    {
        slug: "sintra-carry-on-video",
        title: "New video — Sintra in one carry-on",
        url: "https://www.youtube.com/@luamarinho",
        description: "Three days of fog and sun, nine pieces, one small case.",
        badge: "New",
        category: "Watch & read",
    },
    {
        slug: "last-light-letter",
        title: "Last Light — the Sunday letter",
        url: "https://lastlight.substack.com",
        description: "Where the week's light was best, what I wore into it, and what I'd skip.",
        category: "Watch & read",
    },
    {
        slug: "lisbon-map",
        title: "My Lisbon map — 40 places I actually go",
        url: "https://luamarinho.gumroad.com/l/lisbon-map",
        description: "Miradouros by the hour, tascas without menus in English, the good linen shop.",
        badge: "Free",
        category: "Guides",
    },
    {
        slug: "summer-packing-list",
        title: "The summer packing list",
        url: "https://luamarinho.gumroad.com/l/summer-list",
        description: "The nine pieces from the Sintra video, printable and in order.",
        category: "Guides",
    },
    {
        slug: "casa-areia-linen",
        title: "Casa Areia — the linen edit",
        url: "https://www.casaareia.example/lua",
        description: "The shirt and wide trousers from the Alfama stairs, restocked in oat and ink.",
        badge: "Code LUA15",
        category: "Partners",
    },
    {
        slug: "tecela-knit",
        title: "Tecelã — hand-knit in the Minho",
        url: "https://www.tecela.example/lua",
        description: "The moss sweater from the Sintra diary entry, and the cream cardigan.",
        category: "Partners",
    },
    {
        slug: "closet-on-vinted",
        title: "My closet on Vinted",
        url: "https://www.vinted.pt/member/luamarinho",
        description: "Everything I've worn in the diary and no longer reach for.",
        category: "Shop",
    },
]

/** One look: the looks domain's owner facts plus the code-owned photograph. */
export interface CreatorLook extends ContentLook {
    image: SiteImage
}

export const looks: CreatorLook[] = [
    {
        slug: "alfama-linen",
        title: "Linen on the Alfama Stairs",
        category: "Everyday",
        description:
            "An untucked white linen shirt, wide oat trousers and a crocheted straw bag — the uniform for a city that is mostly stairs and mostly warm.",
        productLinks: [
            { label: "The linen shirt", url: "https://www.casaareia.example/shirt" },
            { label: "The wide trousers", url: "https://www.casaareia.example/trousers" },
            { label: "The straw bag", url: "https://www.oficinapalha.example/bag" },
        ],
        featured: true,
        image: photo(
            "look-linen",
            1152,
            1536,
            "Lua laughing as she walks down a cobbled Alfama street past blue-and-white azulejo panels, in an untucked white linen shirt, wide oat linen trousers and a straw shoulder bag",
        ),
    },
    {
        slug: "feira-stripes",
        title: "Stripes for the Feira da Ladra",
        category: "Market day",
        description:
            "A blue-striped shirt, cream jeans and brown loafers for the flea market — good for kneeling over crates of old plates, better for carrying one home.",
        productLinks: [
            { label: "The striped shirt", url: "https://www.casaareia.example/stripe" },
            { label: "The loafers", url: "https://www.sapatarialume.example/loafer" },
        ],
        featured: true,
        image: photo(
            "look-feira",
            1152,
            1536,
            "Lua kneeling at a flea-market stall in low sun, holding up a blue-and-white painted plate, in a blue-striped shirt, cream jeans and brown loafers, her hair half up in a tortoiseshell clip",
        ),
    },
    {
        slug: "ferry-to-cacilhas",
        title: "The Ferry to Cacilhas",
        category: "Travel",
        description:
            "A butter-yellow satin skirt, a white tee and a cable cardigan off the shoulders — twelve minutes across the river, dressed for dinner on the other side.",
        productLinks: [
            { label: "The satin skirt", url: "https://www.casaareia.example/skirt" },
            { label: "The cable cardigan", url: "https://www.tecela.example/cardigan" },
        ],
        featured: true,
        image: photo(
            "look-ferry",
            1152,
            1536,
            "Lua sitting on the rail bench of a river ferry at sunset with Lisbon behind her, in a butter-yellow satin skirt, white tee, cream cable cardigan and white sneakers",
        ),
    },
    {
        slug: "patio-evening",
        title: "Supper in the Patio",
        category: "Evening",
        description:
            "A chocolate satin skirt, a fine black knit and a gold chain — string lights, a garden table, and a skirt that moves when the conversation does.",
        productLinks: [
            { label: "The satin skirt", url: "https://www.casaareia.example/bias" },
            { label: "The fine knit", url: "https://www.tecela.example/fine-knit" },
            { label: "The sandals", url: "https://www.sapatarialume.example/sandal" },
        ],
        image: photo(
            "look-evening",
            1152,
            1536,
            "Lua laughing in a garden patio under string lights at dusk, in a black short-sleeved knit, a gold chain and a long chocolate-brown satin skirt, one hand on an iron chair",
        ),
    },
    {
        slug: "santa-apolonia-carry-on",
        title: "Carry-On from Santa Apolónia",
        category: "Travel",
        description:
            "A navy cardigan buttoned as a top, cream wide trousers and suede loafers — the train to Porto, one small case, nothing that creases.",
        productLinks: [
            { label: "The navy cardigan", url: "https://www.tecela.example/navy" },
            { label: "The wide trousers", url: "https://www.casaareia.example/cream" },
            { label: "The suede loafers", url: "https://www.sapatarialume.example/suede" },
        ],
        image: photo(
            "look-carryon",
            1152,
            1536,
            "Lua walking through a sunlit railway station hall pulling a vintage leather suitcase, in a navy button cardigan, cream wide-leg trousers and suede loafers, a straw bag on her shoulder",
        ),
    },
]

/** The trust numbers — the metrics strip. */
export const metrics = [
    { value: "388K", label: "followers across platforms" },
    { value: "31M", label: "views last year" },
    { value: "17", label: "brand partners to date" },
    { value: "4", label: "summers of the diary" },
]

/** Brands worked with and press that covered the work. */
export const collaborations = [
    "Casa Areia linen campaign, summer 2026",
    "Tecelã knitwear, autumn/winter 2026",
    "Quinta do Mar hotels — the slow weekend series",
    "Featured in Travessa Magazine & Lisboa Weekly",
]

/** What working with the creator is like — the brand-side testimonials. */
export const testimonials = [
    {
        quote: "Lua moved our whole shoot to seven in the evening and walked the linen up the Alfama stairs herself. The pieces she wore sold through in nine days — and the comments were people asking where the street was, not for a code.",
        name: "Inês Couto",
        detail: "Brand director, Casa Areia",
    },
    {
        quote: "She wore the moss sweater in the Sintra rain because that's where it belongs, and said so. We're a four-person knitting workshop; her diary entry filled our autumn order book.",
        name: "Beatriz Lemos",
        detail: "Founder, Tecelã",
    },
    {
        quote: "Three weekends, three houses, no staged breakfasts. Lua's series is the only content our guests quote back to us at check-in.",
        name: "Rafael Moura",
        detail: "Marketing lead, Quinta do Mar hotels",
    },
]

export const home = {
    headline: "Dressed for\nthe last light.",
    subheadline:
        "Fashion and slow travel from Lisbon — linen, loafers and whatever the evening asks for. A new diary entry every Sunday, every piece linked.",
    heroImage: photo(
        "hero",
        2400,
        1800,
        "Lua Marinho laughing on an Alfama stairway at golden hour, in a white linen shirt and wide oat trousers with a straw bag, terracotta roofs and the Tagus behind her",
    ),
    /** This seed's own home (influencerLanding.ts `InfluencerEdition`). */
    edition: {
        hero: "full-bleed-media" as const,
        accent: "last-line" as const,
        credit: "Lisbon · fashion & slow travel",
        story: {
            variant: "sequence" as const,
            kicker: "",
            title: "",
            frames: [
                {
                    image: photo(
                        "diary-comporta",
                        1600,
                        1200,
                        "Lua laughing on a dune boardwalk in Comporta at sunset, holding her straw hat, in a long white shirt-dress",
                    ),
                    caption: "Comporta, 8:10 pm — the white shirt-dress",
                },
                {
                    image: photo(
                        "diary-palermo",
                        1600,
                        1200,
                        "Lua biting into a lemon at a fruit market in Palermo, in a rust satin slip dress with a cream cardigan knotted over her shoulders",
                    ),
                    caption: "Palermo, 11:20 am — rust slip, cardigan knotted",
                },
                {
                    image: photo(
                        "diary-sintra",
                        1600,
                        1200,
                        "Lua twirling on a wet stone terrace in Sintra after rain, mist in the tree ferns, in a moss-green sweater and a pleated cream skirt",
                    ),
                    caption: "Sintra, after the rain — moss knit, pleated cream",
                },
                {
                    image: photo(
                        "diary-quay",
                        1600,
                        1200,
                        "Lua laughing on the river wall at Cais das Colunas at dusk, the bridge behind her, in a navy blazer, white tee, light jeans and white sneakers",
                    ),
                    caption: "Cais das Colunas, 7:52 pm — navy blazer, old jeans",
                },
            ],
            edgeCode: "",
            firstFrame: 1,
        },
        looks: "media-rail" as const,
        kindWords: "single-featured" as const,
        banner: "colophon" as const,
        copy: {
            looksCta: "See the looks",
            featuredKicker: "The looks",
            platformsKicker: "Find me on",
            platformsTitle: "Five places, one diary",
            hubKicker: "The link hub",
            kindWordsKicker: "From the brand teams",
            kindWordsTitle: "What a campaign together is like",
            homeBannerBody:
                "Campaigns, travel edits, or a hotel that wants its evening light — one short email starts it.",
            looksBannerBody: "",
            linksBannerBody:
                "Brand teams: the partnership inbox is one click away — the rate card on request.",
            aboutKicker: "About Lua",
            aboutBullets: [
                "Shot in the last hour of light, never in a studio",
                "Linen, knit and leather made within a day's drive of Lisbon",
            ],
        },
    },
}

export const linksPage = {
    headline: "Every link, in order.",
    subheadline:
        "The new video, the Sunday letter, the Lisbon map and the partner codes — newest first, the way I'd send them to a friend.",
}

export const looksPage = {
    headline: "The looks, by the hour.",
    subheadline:
        "Everyday linen, market mornings, ferries and suppers — filter by the day you're dressing for, then shop the pieces.",
    /** The shop-the-looks strip under the grid. */
    shopHeading: "Shop the pieces",
}

export const about = {
    headline: "Four summers of dressing for the light.",
    photo: photo(
        "portrait-lua",
        1152,
        1536,
        "Lua Marinho laughing on a sunlit window seat in her Lisbon flat with a cup of coffee, in a cream knit sweater and linen trousers, rooftops through the open balcony door",
    ),
    paragraphs: [
        "Lua Marinho grew up in Setúbal and moved to Lisbon at nineteen, into a fourth-floor room with a west window. The diary started there in 2023: one outfit, one street, photographed in the hour before sunset because that was when she got home from the shop she worked in.",
        "It is still shot the same way — no studio, no borrowed wardrobe rail, the photographs taken by friends on the stairs, ferries and beaches where the clothes actually get worn. Most of what she wears is linen, knit and leather made within a day's drive of the city, and she says which pieces she paid for.",
        "Partnerships are one season at a time: a brand whose clothes she would wear anyway, shot on her own streets, in her own light. The letter on Sunday says what worked and what didn't.",
    ],
    /** The uppercase collaborations strip under the story. */
    credentials: collaborations,
}

export const contact = {
    headline: "Let's plan the light.",
    body: "A few lines about the brand, the pieces, and the season you have in mind — you'll hear back within two working days. Rate card on request; usage and exclusivity priced separately and plainly.",
    confirmation: "Obrigada — your note is in. Every campaign inquiry gets a reply within two working days.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "company", label: "Brand / company", required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        {
            name: "campaign",
            label: "Campaign type",
            placeholder: "Diary entries, video, a travel edit, an event …",
        },
        { name: "budget", label: "Budget range", placeholder: "€2–5k, €5–15k, still scoping …" },
        { name: "timeline", label: "Season", placeholder: "Summer 2027, autumn, evergreen …" },
        {
            name: "message",
            label: "About the campaign",
            type: "textarea" as const,
            fullWidth: true,
            required: true,
        },
    ],
}
