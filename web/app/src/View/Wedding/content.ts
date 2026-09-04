/**
 * The wedding pack's single content file: photographer, weddings, packages.
 * Everything the site renders comes from here — edit this file (not the
 * page components) to make the site yours.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/wedding` (see PACK.md). The `photo` helper mirrors that
 * verb's naming exactly, so an entry is three arguments, not eight lines.
 * Never point a slot at a raw camera file.
 *
 * Sequencing is the craft: the `justified` gallery preserves array order
 * exactly (unlike masonry), so order each wedding the way it happened —
 * getting ready, ceremony, the quiet details, the party, the goodnight.
 */

export interface PhotoImage {
    src: string
    alt: string
    width: number
    height: number
    srcSet: { src: string; width: number }[]
    caption?: string
}

export interface Album {
    slug: string
    title: string
    /** Small uppercase label on the cover tile, e.g. venue and month. */
    eyebrow: string
    description: string
    /** First image is the album's cover. */
    images: PhotoImage[]
}

/** The width ladder `npm run image -- responsive` emits by default. */
const LADDER = [640, 1024, 1600, 2400]

/** A responsive-verb image entry from its name and intrinsic size. */
function photo(name: string, width: number, height: number, alt: string, caption?: string): PhotoImage {
    const widths = [...new Set(LADDER.map((step) => Math.min(step, width)))]
    return {
        src: `/wedding/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/wedding/${name}-${step}w.webp`, width: step })),
        ...(caption !== undefined ? { caption } : {}),
    }
}

export const photographer = {
    name: "Isla Hart",
    tagline: "Wedding & elopement photography",
    location: "Camden, Maine",
    email: "hello@islahart.example",
    instagram: "https://instagram.com/islahart.photo",
}

export const albums: Album[] = [
    {
        slug: "nora-june",
        title: "Nora & June",
        eyebrow: "Beech Hill · June",
        description:
            "A headland ceremony in sea fog and a sailcloth tent that glowed until midnight — two hundred guests, one long table, and the tide coming in below.",
        images: [
            photo(
                "saltwater-01",
                1536,
                1024,
                "Nora and June walking the headland path, a veil lifted by wind",
            ),
            photo(
                "saltwater-03",
                1536,
                1024,
                "The ceremony from behind the last row, driftwood arch against the fog",
            ),
            photo("saltwater-02", 1024, 1536, "Hands exchanging rings, beach roses just out of focus"),
            photo(
                "saltwater-04",
                1536,
                1024,
                "The long table under sailcloth, taper candles and wildflowers",
            ),
            photo(
                "saltwater-05",
                1024,
                1536,
                "The first dance under string lights, hems blurred with motion",
            ),
            photo("saltwater-06", 1536, 1024, "Down the lantern-lit dock at blue hour, hand in hand"),
        ],
    },
    {
        slug: "cate-sam",
        title: "Cate & Sam",
        eyebrow: "Merrow Farm · October",
        description:
            "An October barn wedding in full color — a first look in the hay door, toasts under dried flowers, and a dance floor that refused to quit.",
        images: [
            photo("merrow-01", 1536, 1024, "Guests gathering at the barn doors in golden hour"),
            photo("merrow-02", 1024, 1536, "Cate laughing with her father as he sees her for the first time"),
            photo("merrow-04", 1024, 1536, "Dahlias, brass candlesticks, and the vow book on a barn table"),
            photo("merrow-03", 1536, 1024, "Toasts under the string lights and dried flowers"),
            photo("merrow-06", 1536, 1024, "The dance floor at full tilt, motion in every arm"),
            photo("merrow-05", 1536, 1024, "Walking out through the hayfield toward the maples"),
        ],
    },
    {
        slug: "priya-daniel",
        title: "Priya & Daniel",
        eyebrow: "Elopement · January",
        description:
            "A city-hall elopement in falling snow — two coats, one dog, a corner table with cake for two, and the whole town square to themselves.",
        images: [
            photo("january-01", 1536, 1024, "Down the city hall steps in light snow, dog leading the way"),
            photo("january-02", 1024, 1536, "Signing the license by the tall window, anemones on the desk"),
            photo("january-03", 1536, 1024, "Under one umbrella on the empty brick street"),
            photo("january-04", 1536, 1024, "Champagne and a cake for two at the corner table"),
            photo("january-05", 1536, 1024, "At the end of the snow-dusted jetty, gulls overhead"),
            photo("january-06", 1536, 1024, "A slow dance alone in the town square at dusk"),
        ],
    },
]

/** Home hero: three wide frames on a slow crossfade, one from each wedding. */
export const heroSlides: PhotoImage[] = [albums[0].images[0], albums[1].images[5], albums[2].images[5]]

/**
 * The home page's selected-work gallery: a cross-wedding edit, sequenced by
 * hand. Pull frames from the albums so home and album pages stay in sync.
 */
export const selectedWork: PhotoImage[] = [
    albums[0].images[1],
    albums[1].images[1],
    albums[2].images[4],
    albums[0].images[4],
    albums[1].images[4],
    albums[2].images[0],
    albums[0].images[3],
    albums[1].images[5],
]

export const home = {
    badge: "Weddings · Elopements",
    headline: "The day, the way it felt.",
    subheadline: `${photographer.name} — wedding and elopement photography, ${photographer.location}.`,
    intro: {
        kicker: "The approach",
        title: "Present, not posing",
        paragraphs: [
            "I photograph weddings the way they actually happen — the look across the tent, the grandmother's hands, the weather you didn't order. Almost everything I make is unposed, in whatever light the day gives us.",
            "One wedding a weekend, never two. That's how the good frames happen: I'm not watching the clock, I'm watching you.",
        ],
    },
}

/**
 * The packages page: flat prices, no billing toggle (the pricing section
 * renders these with `period: ""`). Keep the middle package highlighted —
 * it's the honest default, and the page reads better with a spine.
 */
export interface WeddingPackage {
    name: string
    /** Flat price in dollars. */
    price: number
    description: string
    features: string[]
    highlighted?: boolean
    badge?: string
}

export const packages: WeddingPackage[] = [
    {
        name: "The elopement",
        price: 2400,
        description:
            "For two people, an officiant, and somewhere that matters. Up to three hours, any day of the week.",
        features: [
            "Up to three hours of coverage",
            "Help with permits, timing, and where the light will be",
            "A sequenced online gallery within two weeks",
            "Print release included",
        ],
    },
    {
        name: "The wedding day",
        price: 5200,
        description:
            "Eight hours from getting ready to the dance floor, with a second photographer on the other side of the room.",
        features: [
            "Eight hours with two photographers",
            "An engagement session, on the coast or wherever you met",
            "A sequenced online gallery within three weeks",
            "A private proofing gallery for your family's print picks",
            "Print release included",
        ],
        highlighted: true,
        badge: "Most chosen",
    },
    {
        name: "The whole weekend",
        price: 7800,
        description:
            "Rehearsal dinner through morning-after brunch — the full story, including the parts the day itself is too fast for.",
        features: [
            "Rehearsal dinner, wedding day, and next-morning coverage",
            "Two photographers throughout",
            "An engagement session included",
            "A linen-bound heirloom album, designed with you",
            "First priority on date holds",
        ],
    },
]

export const packagesPage = {
    headline: "Plain numbers.",
    body: "Three ways to work together, priced flat. Maine travel is always included; beyond New England, ask and I'll quote the whole thing before you commit to anything.",
    kicker: "Packages",
    faqKicker: "Questions couples ask",
    faqTitle: "The honest answers",
}

export const faq = [
    {
        question: "Do you travel?",
        answer: "Anywhere in Maine is included in every package — the coast is home. Across New England I add a flat travel fee quoted up front; farther than that, let's talk, I love a reason to pack the vans.",
    },
    {
        question: "How many photographs will we get?",
        answer: "Roughly sixty to eighty finished frames per hour of coverage, delivered as a sequenced gallery — edited like a story, not a memory-card dump. Every finished frame is retouched; there's no second tier of half-edited extras.",
    },
    {
        question: "When do we see them?",
        answer: "A dozen frames within two days, so the week after doesn't feel so quiet. The full gallery lands in two weeks for elopements, three for weddings — busy-season dates never change that.",
    },
    {
        question: "What happens if it rains?",
        answer: "In Maine, weather is the third photographer. Fog and rain made half the frames on this site — but we'll also have a real plan B from the planning call, not a shrug and an umbrella.",
    },
    {
        question: "Can our families order prints?",
        answer: "Yes — after delivery you get a private proofing gallery where you and your families pick frames, and prints and albums come straight from the studio at press quality. No third-party print mill.",
    },
    {
        question: "How do we hold a date?",
        answer: "A signed agreement and a thirty-percent retainer holds it exclusively — I book one wedding a weekend, so a held date is genuinely off the calendar. The rest is due two weeks before the day.",
    },
]

export const about = {
    headline: "The person who'll be there.",
    portrait: photo("about-portrait", 1024, 1536, "Isla Hart in the doorway of a barn, cameras slung"),
    paragraphs: [
        "I shot fishing harbors and town meetings for a coastal weekly for six years before my first wedding, and I still work like a newspaper photographer: be early, stay out of the way, never miss the moment because you were arranging one.",
        "I photograph about twenty weddings a year from a studio in Camden — headlands, barns, granite steps of town halls. One a weekend, always with backups of everything, usually with boots in the bag.",
        "The couples who find me tend to want their day photographed more than they want to be photographed. That distinction is the whole job.",
    ],
    testimonials: [
        {
            quote: "We barely saw her all day, and somehow she was everywhere. The gallery had moments we'd already forgotten by dinner — my father crying during the toasts, my grandmother dancing. Those are the pictures on our wall.",
            name: "Nora & June",
            detail: "Married at Beech Hill",
        },
        {
            quote: "It poured for an hour and Isla was genuinely delighted. The photographs from that hour are the best of the whole day. Trust her about the weather.",
            name: "Cate Merrow",
            detail: "Married at the family farm",
        },
        {
            quote: "We eloped with a dog and no plan and the pictures look like a film. She found us a jetty, a cafe table, and somehow a snowstorm.",
            name: "Priya & Daniel",
            detail: "Eloped in January",
        },
    ],
}

/**
 * A client proofing gallery: unlisted (never on /weddings, never in nav —
 * the only way in is the /proof link the photographer shares), gated by a
 * short access code, and rendered in selection mode so the couple and
 * their families can pick the frames they want printed.
 *
 * The code is soft privacy, not security: it ships in the site bundle and
 * keeps casual visitors and search engines out, like an unlisted video
 * link. True access control (and full-res delivery) is the platform's
 * proofing v2.
 */
export interface ProofingAlbum {
    /** Rides `?album=` on /proof; part of the link the photographer shares. */
    slug: string
    /** The 4–6 digit code the photographer tells the client. */
    accessCode: string
    clientName: string
    title: string
    /** A short note to the client above the gallery. */
    note: string
    images: PhotoImage[]
}

/**
 * A photograph's stable id in proofing selections: the processed file's
 * base name ("saltwater-03"), which is what the photographer's own files
 * are named — so a selection email reads as a usable pick list.
 */
export function photoId(image: PhotoImage): string {
    const file = image.src.split("/").pop() ?? image.src
    return file.replace(/-\d+w\.webp$/, "")
}

export const proofingAlbums: ProofingAlbum[] = [
    {
        slug: "nora-june-prints",
        accessCode: "6183",
        clientName: "Nora & June",
        title: "Nora & June — print picks",
        note: "Here's the edit your families keep asking about. Pick the frames you'd like printed — as many or as few as you want — and press Send when you're done. I'll prepare your picks and follow up about sizes and the album.",
        images: [
            albums[0].images[0],
            albums[0].images[2],
            albums[0].images[1],
            albums[0].images[4],
            albums[0].images[3],
            albums[0].images[5],
        ],
    },
    {
        slug: "merrow-family-frames",
        accessCode: "20417",
        clientName: "Cate & Sam",
        title: "Merrow Farm — the family edit",
        note: "The frames from the farm your parents will want. Select what you'd like printed; the counter keeps track. Send your picks and I'll get proofs in the mail within the week.",
        images: [
            albums[1].images[1],
            albums[1].images[0],
            albums[1].images[3],
            albums[1].images[5],
            albums[1].images[4],
        ],
    },
]

export const proofing = {
    /** The gate screen's copy — what a client sees before entering the code. */
    gate: {
        title: "Client proofing",
        body: "This gallery is private. Enter the access code from your photographer to view and select your photographs.",
        placeholder: "Access code",
        cta: "View gallery",
        error: "That code doesn't match this gallery — check the note from your photographer.",
    },
    /** The selection tray and confirmation copy. */
    selection: {
        sendCta: "Send selections",
        notePlaceholder: "Anything to add about your picks? (optional)",
        confirm: "Send",
        cancel: "Keep choosing",
        sentTitle: "Selections sent.",
        sentBody:
            "Your picks are on their way to the studio. You can revisit this gallery and send an updated selection any time.",
        reopenCta: "Revise selections",
    },
}

export const inquire = {
    headline: "Tell me about the day you're planning.",
    body: "A few lines about the two of you, roughly when, and where — and I'll reply within two working days with availability and a real quote. If your date is held by someone else, I'll tell you straight away and suggest photographers I trust.",
    confirmation:
        "Thank you — your note is on its way. I reply to every inquiry within two working days, usually sooner.",
    fields: [
        { name: "names", label: "Your names", required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        { name: "date", label: "Date (if you have one)", type: "date" as const },
        { name: "venue", label: "Venue or town", placeholder: "Booked, dreaming, or somewhere in between" },
        {
            name: "message",
            label: "About the two of you & the day",
            type: "textarea" as const,
            fullWidth: true,
            required: true,
        },
    ],
}
