/**
 * The photography pack's single content file: photographer, pages, albums.
 * Public pages render from here — edit this file (not the page components)
 * to make the site yours. Live client galleries do not: they load from
 * the platform proofing door. `demoProofingAlbums` below is fixture data
 * for baked previews only.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/photography` (see PACK.md). The `photo` helper mirrors
 * that verb's naming exactly, so an entry is three arguments, not eight
 * lines. Never point a slot at a raw camera file.
 *
 * Sequencing is the craft: the `justified` gallery preserves array order
 * exactly (unlike masonry), so order each album the way a photographer
 * would sequence a portfolio — open strong, vary rhythm, close strong.
 */
import type { AppointmentsContent } from "../Landing/practiceDocument"

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
    /** Small uppercase label on the cover tile, e.g. a span of years. */
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
        src: `/photography/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/photography/${name}-${step}w.webp`, width: step })),
        ...(caption !== undefined ? { caption } : {}),
    }
}

export const photographer = {
    name: "Mara Voss",
    tagline: "Portrait & editorial photography",
    location: "Portland, Oregon",
    email: "studio@maravoss.example",
    instagram: "https://instagram.com/maravoss.photo",
}

export const albums: Album[] = [
    {
        slug: "portraits",
        title: "Portraits",
        eyebrow: "2024–2026",
        description:
            "Studio and location portraiture in available light — musicians, writers, and people who would rather be anywhere else, held still for a moment.",
        images: [
            photo("portraits-01", 1024, 1536, "A woman in a dark coat, lit by a north-facing window"),
            photo("portraits-02", 1536, 1024, "A seated man in profile against a plaster wall"),
            photo("portraits-03", 1024, 1536, "A cellist resting her chin on the scroll of her instrument"),
            photo("portraits-04", 1024, 1536, "A young man looking past the camera in low tungsten light"),
            photo("portraits-05", 1536, 1024, "Two dancers pausing between takes in an empty studio"),
            photo("portraits-06", 1024, 1536, "A poet in a linen shirt, hands folded, eyes closed"),
            photo("portraits-07", 1536, 1024, "A painter in her studio surrounded by unfinished canvases"),
            photo("portraits-08", 1024, 1536, "A silver-haired woman laughing, caught mid-turn"),
        ],
    },
    {
        slug: "editorial",
        title: "Editorial",
        eyebrow: "Commissions",
        description:
            "Commissioned stories for print and web — chefs, makers, and small industries photographed where the work actually happens.",
        images: [
            photo("editorial-01", 1536, 1024, "A chef plating a dish under a single pendant lamp"),
            photo("editorial-02", 1024, 1536, "A glassblower shaping molten glass at the furnace"),
            photo("editorial-03", 1536, 1024, "Rows of proofing loaves in a bakery at dawn"),
            photo("editorial-04", 1024, 1536, "A bookbinder sewing a spine by hand at her bench"),
            photo("editorial-05", 1536, 1024, "A shipwright checking the fairness of a hull plank"),
            photo("editorial-06", 1024, 1536, "A florist's hands wiring a stem, shot from above"),
            photo("editorial-07", 1536, 1024, "Steam rising from a dye vat in a textile workshop"),
            photo("editorial-08", 1024, 1536, "A watchmaker at his lathe under an articulated lamp"),
        ],
    },
    {
        slug: "north-coast",
        title: "North Coast",
        eyebrow: "Personal work",
        description:
            "A slow personal series from the Oregon coast — fog, basalt, and the few figures who stand out in it. Shot across three winters.",
        images: [
            photo("north-coast-01", 1536, 1024, "A lone figure on an empty beach under heavy fog"),
            photo("north-coast-02", 1536, 1024, "Basalt sea stacks in a calm silver sea under low cloud"),
            photo("north-coast-03", 1024, 1536, "A path through dune grass leading down to the water"),
            photo("north-coast-04", 1536, 1024, "A white cottage standing alone on a treeless headland"),
            photo("north-coast-05", 1536, 1024, "A rain squall crossing the headland across the bay"),
            photo("north-coast-06", 1024, 1536, "A tide pool mirroring the sky between barnacled rocks"),
            photo("north-coast-07", 1536, 1024, "The harbor at dusk, the first window lights coming on"),
            photo("north-coast-08", 1536, 1024, "The lighthouse through sea mist at the end of the coast"),
        ],
    },
]

/** Home hero: three wide frames on a slow crossfade. */
export const heroSlides: PhotoImage[] = [
    photo("hero-01", 1536, 1024, "A portrait subject at a rain-streaked window, lit softly from the side"),
    photo("hero-02", 1536, 1024, "A dancer standing alone in a vast empty daylight studio"),
    photo("hero-03", 1536, 1024, "The north coast at dusk, dark cliffs receding into mist"),
]

/**
 * The home page's selected-work gallery: a cross-album edit, sequenced by
 * hand. Pull frames from the albums so home and album pages stay in sync.
 */
export const selectedWork: PhotoImage[] = [
    albums[0].images[0],
    albums[1].images[1],
    albums[2].images[0],
    albums[0].images[2],
    albums[1].images[4],
    albums[2].images[5],
    albums[0].images[7],
    albums[1].images[2],
]

/**
 * The home page's shape. `portfolio` is the tour-book cover over the
 * scrapbook edit, the studio intro, and the collections. `stack` is the
 * photographer's stack: `selectedWork` as one full-bleed column of
 * same-size frames, each photograph's `caption` on a band under it set
 * by `stack.align`, closed by `stack.closing` — one line, an optional
 * second (`note`, "" for none), and a text link to /book. The stack
 * reads nothing else on `home`.
 */
export type HomeLayout = "portfolio" | "stack"

export const home = {
    layout: "portfolio" as HomeLayout,
    badge: "Portrait · Editorial",
    headline: "Photographs that hold still.",
    subheadline: `${photographer.name} — portrait and editorial photography, ${photographer.location}.`,
    intro: {
        kicker: "The studio",
        title: "Quiet pictures of loud lives",
        paragraphs: [
            "I photograph people the way they are between poses — the exhale, not the smile. Most of my work is made in available light, on location, with as little apparatus between us as possible.",
            "Clients include magazines, publishers, and people marking something worth remembering. Commissions usually run a half day; prints and licensing are handled directly.",
        ],
    },
    stack: {
        align: "center" as "center" | "start",
        closing: {
            line: "Portraits in available light, made slowly, in the studio or wherever you feel most yourself.",
            note: "",
            cta: "Book a session",
        },
    },
}

/** The /work index's hero: the collections page's headline and one line under it. */
export const work = {
    headline: "The work.",
    intro: "Three bodies of work, each sequenced as it would hang. Open a collection to see it in order.",
}

export const about = {
    headline: "The person behind the camera.",
    portrait: photo("about-portrait", 1024, 1536, "Mara Voss holding her camera in her studio"),
    paragraphs: [
        "I came to photography from bookbinding, which taught me the two things I still care most about: sequence and restraint. A portfolio is read like a book — the order of the pictures is as much the work as the pictures.",
        "I shoot portraits and editorial commissions from a small studio in Southeast Portland, and spend the winters walking the north coast with one camera and one lens. My clients tend to be people who are photographed rarely and warily; the job is to make an hour feel like ten minutes.",
        "Selected work has appeared in regional and national print. Prints from the North Coast series are editioned and available directly from the studio.",
    ],
    testimonials: [
        {
            quote: "Mara made a portrait of me that my family says is the first one that looks like me. I was dreading the sitting; it was over before I noticed it had started.",
            name: "Ellen Marsh",
            detail: "Novelist",
        },
        {
            quote: "She photographed our workshop for a feature and somehow made the mess look like the point. The pictures did more for us than the article did.",
            name: "Tom Okafor",
            detail: "Boatbuilder, Astoria",
        },
        {
            quote: "Precise, quick, and completely unobtrusive. The crew forgot she was in the kitchen, which is exactly why the photographs work.",
            name: "Dana Reyes",
            detail: "Chef & owner, Alder House",
        },
    ],
}

/**
 * Demo-only proofing rooms. Baked template previews and the funnel's
 * console preview have no site router, so `/proof` renders from these
 * fixtures when `/__proofing/room` is unreachable. Published sites never
 * authorize against them — the platform door checks the real access code
 * server-side, and the code never ships in the customer bundle.
 *
 * `accessCode` here is a fictional preview PIN so the gate still looks
 * like a real client room. It is not a secret and is never consulted on
 * a published site whose door answers.
 */
export interface DemoProofingAlbum {
    /** Rides `?album=` on /proof; the funnel screenshots this slug. */
    slug: string
    /** Fictional preview PIN. Never a real client's code. */
    accessCode: string
    clientName: string
    title: string
    /** A short note to the client above the gallery. */
    note: string
    images: PhotoImage[]
}

/**
 * A photograph's stable id in demo proofing selections: the processed
 * file's base name ("portraits-03"). Live rooms use the door's minted
 * `imageId` instead.
 */
export function photoId(image: PhotoImage): string {
    const file = image.src.split("/").pop() ?? image.src
    return file.replace(/-\d+w\.webp$/, "")
}

/**
 * Demo fixtures for baked previews and the funnel screenshot. The
 * Harlow room is the well-populated client gallery the platform renders
 * when it shows "what Spaceboy runs for you".
 */
export const demoProofingAlbums: DemoProofingAlbum[] = [
    {
        slug: "harlow-session",
        accessCode: "4271",
        clientName: "The Harlow family",
        title: "Harlow family session",
        note: "Here are the frames worth considering from our afternoon. Pick the ones you'd like finished — as many or as few as you want — and press Send when you're done. I'll retouch your picks and follow up about prints.",
        images: [
            albums[0].images[7],
            albums[0].images[0],
            albums[0].images[4],
            albums[0].images[2],
            albums[0].images[5],
            albums[0].images[1],
            albums[0].images[3],
            albums[0].images[6],
        ],
    },
    {
        slug: "alder-house-editorial",
        accessCode: "80412",
        clientName: "Alder House",
        title: "Alder House — kitchen story",
        note: "The edit from the kitchen shoot. Select the frames you want licensed for the feature; the counter keeps track. Send your picks and I'll prepare final files at press resolution.",
        images: [
            albums[1].images[0],
            albums[1].images[2],
            albums[1].images[5],
            albums[1].images[3],
            albums[1].images[6],
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
        checking: "Checking…",
        error: "That code doesn't match this gallery — check the note from your photographer.",
        notFound: "This gallery isn't available — it may have closed. Ask your photographer for a new link.",
        rateLimited: "Too many attempts. Wait a moment and try again.",
        notConfigured: "Client galleries aren't set up yet. Check back shortly.",
    },
    /** The selection tray and confirmation copy. */
    selection: {
        sendCta: "Send selections",
        namePlaceholder: "Your name",
        emailPlaceholder: "Your email",
        notePlaceholder: "Anything to add about your picks? (optional)",
        confirm: "Send",
        cancel: "Keep choosing",
        sending: "Sending…",
        sendError: "Something went wrong sending your picks — try again in a moment.",
        sentTitle: "Selections sent.",
        sentBody:
            "Your picks are on their way to the studio. You can revisit this gallery and send an updated selection any time.",
        reopenCta: "Revise selections",
    },
}

/**
 * The /galleries page: the client-facing proofing explainer — what
 * happens after a shoot, in the photographer's own voice. It speaks to
 * clients, and in doing so shows a photographer evaluating the template
 * exactly what the platform's proofing service will do for them. The
 * sample card points at the demo Harlow room and derives its access code
 * from `demoProofingAlbums`, so the page and the fixture can never
 * drift apart (see PACK.md for the after-publish rule).
 */
const sampleRoom = demoProofingAlbums[0]

export const galleries = {
    headline: "After the shoot, a gallery of your own.",
    intro: "Every session ends the same way: a private online gallery, sequenced the way the work deserves, where you choose the frames that get finished. No public link, no account to make — just your pictures and a quiet place to decide.",
    steps: [
        {
            title: "A private link arrives",
            body: "Within two weeks of our session you'll get a link to your own gallery and an access code that's yours alone. Nothing is posted anywhere public; nobody sees the frames but you.",
        },
        {
            title: "Sit with the frames",
            body: "The gallery reads like a small book — sequenced first to last, the way the session actually went. Mark the ones you keep returning to; your picks save as you go, so you can close it and come back tomorrow.",
        },
        {
            title: "Send your picks",
            body: "One press and your selection lands at the studio instantly, with any notes you'd like to add. I retouch the frames you chose and follow up about prints and files.",
        },
    ],
    sample: {
        kicker: "Client galleries",
        headline: "Walk through a sample.",
        body: `Curious what it feels like? A sample gallery is open for you to try — the same gate, the same choosing, the same send. The access code at the door is ${sampleRoom.accessCode}.`,
        cta: "Open the sample gallery",
        /** Demo room slug — must name a `demoProofingAlbums` room. */
        slug: sampleRoom.slug,
        image: albums[0].images[4],
    },
}

/**
 * The `appointments` content domain, code fallback — the /book page's
 * input, same contract as the care pack (booking mode 2 on the managed
 * booking kernel). Session types carry the slot length they book; the
 * photographer's weekly windows are packed into concrete capacity-1
 * slots by the platform's own derivation (`generateAppointmentSlots`),
 * so a preview offers exactly what a deploy would. Times are NUMBERS —
 * `day` is the weekday index (0 = Sunday), `start`/`end` minutes since
 * midnight. The catalog's content seed mirrors this export entry for
 * entry (the booking tests pin the twin).
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "portrait-session",
            name: "Portrait session",
            durationMinutes: 90,
            description:
                "An unhurried ninety minutes, in the studio's north light or a place that matters to you. For one person or two — the exhale, not the smile.",
        },
        {
            typeId: "engagement-shoot",
            name: "Engagement session",
            durationMinutes: 120,
            description:
                "Two hours on location — the coast at golden hour, or the streets you two actually walk. Less a shoot than a slow walk with a camera along.",
        },
        {
            typeId: "mini-session",
            name: "Mini session",
            durationMinutes: 30,
            description:
                "Thirty minutes in the studio, one look: a portrait for the book jacket, the press page, or the mantel.",
        },
    ],
    providers: [
        {
            providerId: "mara-voss",
            name: "Mara Voss",
            windows: [
                { day: 2, start: 10 * 60, end: 16 * 60 },
                { day: 4, start: 10 * 60, end: 16 * 60 },
                { day: 5, start: 12 * 60, end: 18 * 60 },
                { day: 6, start: 9 * 60, end: 13 * 60 },
            ],
        },
    ],
}

/**
 * The /book page's copy and art. `sessionImages` fronts each session
 * type's card with a frame from the albums — art from code, facts from
 * the contract (the care pack's providerPhotos discipline). Keys must
 * stay joined to `codeAppointments.types` type ids; the booking tests
 * hold the join.
 */
export const booking = {
    headline: "Book a session.",
    intro: "Choose the session, then a time from the studio's real calendar. A confirmation with a one-click cancel link arrives by email — no deposit to hold the date.",
    /** The "good to know" band under the calendar: where, what if, and when the frames arrive. */
    notes: {
        kicker: "Good to know",
        headline: "How a booking works.",
        body: "The calendar shows the studio's actual openings, a few weeks out. Hold a time and it's yours — the confirmation email carries a one-click cancel link, and rescheduling is free up to 48 hours before we shoot.",
        bullets: [
            "Studio sessions happen in Southeast Portland; location sessions within an hour of the city",
            "Weather calls for outdoor sessions are made together, the day before",
            "Finished frames arrive as a private online gallery within two weeks",
        ],
        image: albums[2].images[3],
    },
    sessionImages: {
        "portrait-session": albums[0].images[0],
        "engagement-shoot": albums[2].images[0],
        "mini-session": albums[0].images[5],
    } as Record<string, PhotoImage>,
}

export const inquire = {
    headline: "Tell me what you're planning.",
    body: "A few lines about the project — who it's for, roughly when, and where — and I'll reply within two working days with availability and a quote.",
    confirmation: "Thank you — your note is on its way. I reply to every inquiry within two working days.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        { name: "date", label: "Date (if known)", type: "date" as const },
        { name: "location", label: "Location", placeholder: "Portland studio, or on location" },
        {
            name: "message",
            label: "About the project",
            type: "textarea" as const,
            fullWidth: true,
            required: true,
        },
    ],
}
