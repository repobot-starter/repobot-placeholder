/**
 * The influencer pack's single content file: the creator, the link hub,
 * the looks, the collaborations, and the pages. Everything the site
 * renders comes from here — edit this file (not the page components) to
 * make the site yours. The demo creator is an Austin personal-style
 * creator, but the shape fits any creator-led personal brand: swap the
 * links, looks, and copy and the site follows.
 *
 * TWO exports are contract-shaped on purpose — this pack is the flagship
 * of both creator domains of the business-content contract:
 *
 * - `links` mirrors the links domain
 *   (web/app/src/View/Landing/linksDocument.ts) — slug, title, url,
 *   description, badge, category. ORDER IS THE CONTENT: the hub renders
 *   in this order, current drop first. URLs are https only (the domain's
 *   hard rule). The group chips derive from the `category` fields
 *   (`linkCategories`).
 * - `looks` mirrors the looks domain
 *   (web/app/src/View/Landing/looksDocument.ts) — slug, title, category,
 *   description, productLinks, featured — plus each look's code-owned
 *   photograph. The filter chips derive from the `category` fields
 *   (`lookCategories`), so minting a new shelf is adding a word, never
 *   touching a component. Photographs stay code-owned and join back in
 *   BY REFERENCE via `slug` (`inventory.ts`) — the contract moves words
 *   and links, never bytes.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/influencer` (see PACK.md). The art direction is warm
 * golden-hour street photography of one consistent creator — real
 * streets, real clothes; nothing studio-flat.
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
        src: `/influencer/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/influencer/${name}-${step}w.webp`, width: step })),
    }
}

export const creator = {
    /** The brand IS the person — the masthead name and the byline. */
    name: "Noa Castillo",
    /** The @-handle, rendered wherever the platforms are named. */
    handle: "@noacastillo",
    tagline: "Real clothes, real streets",
    location: "Austin, Texas",
    /** Business email — brand inquiries; rendered as copyable plain text. */
    email: "hello@noacastillo.example",
    /** The one-line trust chrome the footer and press strips carry. */
    credentialLine: "527K followers across five platforms · 22 brand partners",
}

/**
 * Landing copy the creator's discipline owns: the few strings the landing
 * modules render that would read wrong for a different creator vertical
 * (a fitness creator, a food creator). A remix seed retrades these along
 * with the rest of the content — everything else in the landing modules
 * is creator-neutral on purpose (the services family's `landingCopy`
 * discipline, packs/README.md "Derived templates").
 */
export const landingCopy = {
    /** The partnership ask — the shell's nav CTA and every closing banner. */
    contactCtaLabel: "Work with me",
    /** The home page's featured-looks heading. */
    featuredHeading: "Recent looks",
    /** The home page's link-hub teaser heading. */
    linksHeading: "Right now",
    /** The looks grid's "everything" filter chip. */
    allLooksLabel: "All looks",
    /** The links hub's "everything" group chip. */
    allLinksLabel: "Everything",
    /** The closing ask on every page's banner. */
    finalCtaTitle: "Have a campaign in mind?",
    /** The shell's nav labels for the pack's canonical pages. */
    nav: { looks: "Looks", links: "Links", about: "About" },
}

/**
 * Where the audience lives: the platform row the home page and footer
 * render. Follower counts are display strings — the creator updates them
 * seasonally, not per follow.
 */
export const platforms = [
    {
        name: "Instagram",
        handle: "@noacastillo",
        followers: "214K",
        url: "https://www.instagram.com/noacastillo",
    },
    { name: "TikTok", handle: "@noacastillo", followers: "158K", url: "https://www.tiktok.com/@noacastillo" },
    {
        name: "YouTube",
        handle: "Noa Castillo",
        followers: "96K",
        url: "https://www.youtube.com/@noacastillo",
    },
    {
        name: "Pinterest",
        handle: "noacastillo",
        followers: "41K",
        url: "https://www.pinterest.com/noacastillo",
    },
    {
        name: "Substack",
        handle: "The Sunday Edit",
        followers: "18K",
        url: "https://noacastillo.substack.com",
    },
]

/**
 * The link hub — the links domain's shape, verbatim (`ContentLink`), so
 * an owner's Manage edit and this file walk the same rendering path.
 * ORDER IS THE CONTENT: the hub renders top to bottom, and the current
 * drop sits first. The catalog seeds these same entries into
 * repobot.content.json (the content tests pin the twin).
 */
export const links: ContentLink[] = [
    {
        slug: "fall-capsule-video",
        title: "This week's video — the fall capsule",
        url: "https://www.youtube.com/@noacastillo",
        description: "12 pieces, 30 outfits, zero new purchases required.",
        badge: "New",
        category: "Watch & read",
    },
    {
        slug: "sunday-edit-newsletter",
        title: "The Sunday Edit",
        url: "https://noacastillo.substack.com",
        description: "One email a week: what I wore, what I returned, what's worth it.",
        category: "Watch & read",
    },
    {
        slug: "on-rotation-podcast",
        title: "On Rotation — ep. 41 with a vintage dealer",
        url: "https://open.spotify.com/show/noacastillo-on-rotation",
        description: "How to read a thrift rack in ninety seconds.",
        category: "Watch & read",
    },
    {
        slug: "closet-on-depop",
        title: "My closet on Depop",
        url: "https://www.depop.com/noacastillo",
        description: "Everything I've worn on the feed, one owner, priced to move.",
        category: "Shop",
    },
    {
        slug: "street-preset-pack",
        title: "Lightroom presets — the Street Pack",
        url: "https://noacastillo.gumroad.com/l/street-pack",
        description: "The six presets every photo on this site runs through.",
        category: "Shop",
    },
    {
        slug: "capsule-checklist",
        title: "The fall capsule checklist",
        url: "https://noacastillo.gumroad.com/l/fall-capsule",
        description: "The 12-piece list from this week's video, printable.",
        badge: "Free",
        category: "Shop",
    },
    {
        slug: "sezane-code",
        title: "Sézane — my picks",
        url: "https://www.sezane.com",
        description: "The trench and the loafers, restocked. Code takes 10% off.",
        badge: "Code NOA10",
        category: "Partners",
    },
    {
        slug: "girlfriend-collective",
        title: "Girlfriend Collective — travel knits",
        url: "https://girlfriend.com",
        description: "The charcoal co-ord from the carry-on video.",
        category: "Partners",
    },
]

/**
 * One look: the looks domain's owner facts (the `looks` domain shape)
 * plus the code-owned photograph. `inventory.ts` lifts these into
 * contract shape and joins document edits back by slug.
 */
export interface CreatorLook extends ContentLook {
    image: SiteImage
}

export const looks: CreatorLook[] = [
    {
        slug: "canal-street-trench",
        title: "Canal Street Trench",
        category: "Everyday",
        description:
            "The trench that does the whole season: thrown over a white tee and straight-leg jeans, with the woven tote that fits a laptop and a bakery stop.",
        productLinks: [
            { label: "The trench", url: "https://www.sezane.com" },
            { label: "The loafers", url: "https://www.sezane.com" },
            { label: "The woven tote", url: "https://www.depop.com/noacastillo" },
        ],
        featured: true,
        image: photo(
            "look-trench",
            864,
            1152,
            "Noa in an oversized camel trench over a white tee and straight-leg jeans, cognac loafers and a woven leather tote, on a brick sidewalk",
        ),
    },
    {
        slug: "market-day-linen",
        title: "Market-Day Linen",
        category: "Everyday",
        description:
            "The Saturday uniform: a loose oatmeal linen set and flat sandals — looks put-together at the flower stall, survives the walk home in August.",
        productLinks: [
            { label: "The linen set", url: "https://www.sezane.com" },
            { label: "The sandals", url: "https://www.depop.com/noacastillo" },
        ],
        featured: true,
        image: photo(
            "look-linen",
            864,
            1152,
            "Noa at a farmers market in a loose oatmeal linen shirt and wide-leg trousers, flat tan sandals, carrying a straw bag of flowers",
        ),
    },
    {
        slug: "thrifted-blazer",
        title: "Thrifted Blazer, Three Ways",
        category: "Vintage flip",
        description:
            "An $18 houndstooth blazer from the Burnet Road bins, sleeves rolled, over a breton stripe and cuffed vintage jeans. The video shows the other two ways.",
        productLinks: [
            { label: "Similar blazer", url: "https://www.depop.com/noacastillo" },
            { label: "The breton tee", url: "https://www.sezane.com" },
        ],
        featured: true,
        image: photo(
            "look-blazer",
            864,
            1152,
            "Noa outside a vintage shop in an oversized houndstooth blazer with rolled sleeves, striped tee, cuffed jeans, and white sneakers",
        ),
    },
    {
        slug: "gallery-opening-slip",
        title: "Gallery Opening Slip",
        category: "Evening",
        description:
            "The champagne slip dress with a leather jacket over the shoulders — dressy enough for the opening, tough enough for the bike rack outside.",
        productLinks: [
            { label: "The slip dress", url: "https://www.sezane.com" },
            { label: "The leather jacket", url: "https://www.depop.com/noacastillo" },
        ],
        image: photo(
            "look-slip",
            864,
            1152,
            "Noa at an evening gallery opening in a champagne silk slip dress with a black leather jacket over her shoulders and strappy heels",
        ),
    },
    {
        slug: "carry-on-only",
        title: "Carry-On Only",
        category: "Travel",
        description:
            "The airport co-ord: a charcoal knit set that reads as an outfit at the gate and as pajamas at altitude. Everything else fits in the weekender.",
        productLinks: [
            { label: "The knit co-ord", url: "https://girlfriend.com" },
            { label: "The weekender", url: "https://www.depop.com/noacastillo" },
        ],
        image: photo(
            "look-travel",
            864,
            1152,
            "Noa walking through a bright airport terminal in a charcoal knit co-ord with white sneakers, a rolling suitcase, and an olive weekender bag",
        ),
    },
    {
        slug: "sunday-denim-flip",
        title: "Sunday Denim Flip",
        category: "Vintage flip",
        description:
            "A '90s denim jacket and patchwork-hem jeans, both from the same estate sale rack — proof that double denim works when the washes argue a little.",
        productLinks: [
            { label: "Similar jacket", url: "https://www.depop.com/noacastillo" },
            { label: "The western boots", url: "https://www.depop.com/noacastillo" },
        ],
        image: photo(
            "look-denim",
            864,
            1152,
            "Noa leaning on a colorful mural wall in an oversized vintage denim jacket, white tank, patchwork-hem jeans, and brown western boots",
        ),
    },
]

/** The trust numbers — the metrics strip. Keep values short and big. */
export const metrics = [
    { value: "527K", label: "followers across platforms" },
    { value: "48M", label: "views last year" },
    { value: "22", label: "brand partners to date" },
    { value: "6", label: "years creating" },
]

/**
 * The collaborations strip — brands worked with and press that covered
 * the work. Rendered as the uppercase text-logos row wherever a brand
 * team needs the fast credibility read.
 */
export const collaborations = [
    "Sézane campaign, fall 2026",
    "Girlfriend Collective travel edit",
    "Levi's secondhand series",
    "Featured in Refinery29 & Austin Monthly",
]

/** What working with the creator is like — the brand-side testimonials. */
export const testimonials = [
    {
        quote: "Noa treated our brief like an editor, not a billboard — she cut two products that didn't fit her closet and the two that ran outperformed every placement we bought that quarter. Her audience trusts her because she earns it weekly.",
        name: "Camille Fournier",
        detail: "Partnerships lead, Sézane",
    },
    {
        quote: "Deliverables arrived early, twice. The travel edit she built around our knit set drove a sell-through we usually only see from paid search — and the comments were people planning trips, not asking for codes.",
        name: "Dana Okafor",
        detail: "Brand marketing, Girlfriend Collective",
    },
    {
        quote: "We've commissioned a lot of creator content for the secondhand series; Noa's was the only piece our own stylists forwarded to each other. She shoots real clothes on real streets and it shows.",
        name: "Marcus Bell",
        detail: "Campaign manager, Levi's",
    },
]

export const home = {
    headline: "Real clothes, real streets.",
    subheadline:
        "Personal style from Austin — capsule wardrobes, vintage flips, and the honest math on what's worth it. New looks weekly, everything shoppable.",
    heroImage: photo(
        "hero",
        1152,
        864,
        "Noa Castillo on a warm brick sidewalk at golden hour in a camel trench, white tee, and jeans, carrying a woven leather tote",
    ),
}

export const linksPage = {
    headline: "Everything in one place.",
    subheadline:
        "The current video, the newsletter, the closet on Depop, and the partner codes — every link I'm asked for, in the order I'd send them.",
}

export const looksPage = {
    headline: "The looks, shelf by shelf.",
    subheadline:
        "Everyday fits, vintage flips, evenings out, and carry-on capsules — filter by the kind of outfit you're building, then shop the pieces.",
    /** The shop-the-looks strip under the grid. */
    shopHeading: "Shop the looks",
}

export const about = {
    headline: "Six years of getting dressed in public.",
    photo: photo(
        "portrait-noa",
        864,
        1152,
        "Noa Castillo laughing in a rust knit sweater, seated in a leather armchair in her home studio beside a clothing rack and ring light",
    ),
    paragraphs: [
        "Noa Castillo started posting outfits from a studio apartment in 2020 with a phone propped on a stack of library books. The premise hasn't changed: real clothes, priced honestly, photographed on the streets where they actually get worn — no gifting-closet hauls, no outfits that only work standing still.",
        "The work runs on two rules. Every piece gets linked exactly once, with the price in frame; and anything gifted gets the same review a paid-for piece would, which is why roughly a third of gifted items never appear. Brands keep coming back because the audience believes the feed — 527 thousand people across five platforms, and a newsletter that reads like a friend doing the returns math for you.",
        "Partnerships are one campaign at a time, planned around the season's capsule rather than bolted onto it. If the piece wouldn't survive a month of real rotation, it doesn't run — and that's negotiable with exactly nobody.",
    ],
    /** The uppercase collaborations strip under the story. */
    credentials: collaborations,
}

export const contact = {
    headline: "Let's build the campaign.",
    body: "A few lines about the brand, the products you have in mind, and the window you're planning for — and you'll hear back within two business days. Rate card available on request; usage and exclusivity priced separately and plainly.",
    confirmation:
        "Thank you — your inquiry is in. Every campaign note gets a reply within two business days, usually sooner.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "company", label: "Brand / company", required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        {
            name: "campaign",
            label: "Campaign type",
            placeholder: "Sponsored posts, video, UGC, event …",
        },
        { name: "budget", label: "Budget range", placeholder: "$2–5k, $5–15k, still scoping …" },
        { name: "timeline", label: "Timing", placeholder: "This month, next quarter, evergreen …" },
        {
            name: "message",
            label: "About the campaign",
            type: "textarea" as const,
            fullWidth: true,
            required: true,
        },
    ],
}
