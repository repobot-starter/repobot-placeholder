/**
 * The Kaito remix seed: a complete, drop-in replacement for `./content.ts`
 * that retargets the photography pack from Mara Voss to Kaito Mori, a New
 * York headshot photographer for actors, musicians and writers. The
 * derived template `repobot-photography-kaito` is composed from the
 * photography pack with this file copied over `content.ts`, its catalog's
 * ink brand, and the `seamless` register (white walls, a small clean
 * grotesque, the seamless paper the only color). `home.layout: "stack"`
 * turns the home page into the photographer's stack: every headshot at
 * one size, full bleed, a white caption band under each.
 *
 * Because the copy is verbatim, this file must stay a structural twin of
 * `content.ts`: same exports, same relative imports, images under its own
 * `/photography-kaito/` public directory. The parity test
 * (`tests/View/Photography/remixSeeds.test.ts`) pins the export surface
 * against the real module, so the seed fails CI the moment the pack's
 * contract moves without it.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/photography-kaito` (see PACK.md). Every stack frame is
 * the same 4:3 shape, shot on tomato, cobalt or sage seamless.
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
        src: `/photography-kaito/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/photography-kaito/${name}-${step}w.webp`, width: step })),
        ...(caption !== undefined ? { caption } : {}),
    }
}

export const photographer = {
    name: "Kaito Mori",
    tagline: "Headshots for actors and creatives",
    location: "New York, New York",
    email: "studio@kaitomori.example",
    instagram: "https://instagram.com/kaitomori.headshots",
}

const sitter = {
    jordan: photo(
        "jordan",
        1600,
        1200,
        "A young man in a cream sweater laughing with his eyes squeezed shut, a hand on his chest, against tomato-red paper",
        "Jordan, actor — Broadway",
    ),
    minji: photo(
        "minji",
        1600,
        1200,
        "A cellist in a black turtleneck grinning as she points her bow at the camera, against cobalt-blue paper",
        "Min-ji, cellist",
    ),
    walter: photo(
        "walter",
        1600,
        1200,
        "A chef in whites snapping a striped towel over his shoulder with a big grin, against sage-green paper",
        "Rafael, chef",
    ),
    priya: photo(
        "priya",
        1600,
        1200,
        "A young woman in a white t-shirt pulling a cross-eyed, puffed-cheek face and giving herself bunny ears, against tomato-red paper",
        "Priya, actor — Off-Broadway",
    ),
    mateo: photo(
        "mateo",
        1600,
        1200,
        "A dancer mid-move with his arms flung wide and one knee up, his hard shadow on cobalt-blue paper",
        "Mateo, dancer",
    ),
    amara: photo(
        "amara",
        1600,
        1200,
        "Two friends cracking up together, both covering their mouths, against sage-green paper",
        "Amara and Tess, improv duo",
    ),
    dev: photo(
        "dev",
        1600,
        1200,
        "A bearded comedian in glasses cracking up as he pushes his glasses up his nose, against tomato-red paper",
        "Dev, comedian",
    ),
    noelle: photo(
        "noelle",
        1600,
        1200,
        "A singer with short natural hair and gold hoops mouthing a lyric with a snap of her fingers, against cobalt-blue paper",
        "Noelle, jazz singer",
    ),
}

export const albums: Album[] = [
    {
        slug: "actors",
        title: "Actors",
        eyebrow: "Stage & screen",
        description:
            "Theatrical and commercial headshots — two or three looks, each on its own color of seamless, retouched lightly enough to walk into the room looking like the picture.",
        images: [sitter.jordan, sitter.priya, sitter.mateo, sitter.dev],
    },
    {
        slug: "creatives",
        title: "Musicians & writers",
        eyebrow: "Press & jackets",
        description:
            "Press photographs and jacket portraits for people who make things: chefs, comedians, dancers, a singer between sets.",
        images: [sitter.minji, sitter.walter, sitter.amara, sitter.noelle],
    },
]

/** Home hero: three wide frames on a slow crossfade (the portfolio layout's). */
export const heroSlides: PhotoImage[] = [sitter.jordan, sitter.minji, sitter.walter]

/**
 * The home page's stack: a cross-album edit, sequenced by hand so the
 * seamless colors rotate — tomato, cobalt, sage — each frame captioned
 * with a first name and a trade.
 */
export const selectedWork: PhotoImage[] = [
    sitter.jordan,
    sitter.minji,
    sitter.walter,
    sitter.priya,
    sitter.mateo,
    sitter.amara,
    sitter.dev,
    sitter.noelle,
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
    layout: "stack" as HomeLayout,
    badge: "Headshots · New York",
    headline: "Headshots that look like you.",
    subheadline: `${photographer.name} — headshots for actors and creatives, ${photographer.location}.`,
    intro: {
        kicker: "The studio",
        title: "Ninety minutes, three looks",
        paragraphs: [
            "Sessions happen in a small daylight studio in the Garment District, on tomato, cobalt or sage seamless. We talk first, then shoot until the face stops performing.",
            "Actors, musicians, authors and anyone whose picture has to walk into a room ahead of them.",
        ],
    },
    stack: {
        align: "start" as "center" | "start",
        closing: {
            line: "Ninety minutes, three looks, retouched selects in two days.",
            note: "$650.",
            cta: "Book a session",
        },
    },
}

/** The /work index's hero: the collections page's headline and one line under it. */
export const work = {
    headline: "The work.",
    intro: "Actors on one wall, musicians and writers on the other. Open a collection to see every face in order.",
}

export const about = {
    headline: "Kaito Mori, headshot photographer.",
    portrait: photo(
        "about-kaito",
        768,
        1024,
        "Kaito Mori laughing in his white studio, camera at his hip, beside a roll of red seamless",
    ),
    paragraphs: [
        "I spent eight years assisting fashion photographers before I realized the part I loved was the thirty seconds before a shot, when someone forgets the camera. Headshots are nothing but those thirty seconds.",
        "The studio is one white room in the Garment District with a north window, three rolls of seamless and a coffee machine. Casting directors see a thousand faces a week; the job is to make yours the one that looks like the person who walks in.",
        "Selects are retouched by hand — skin stays skin — and delivered in two days, sized for casting sites, press kits and print.",
    ],
    testimonials: [
        {
            quote: "My agent sent me to Kaito after two sessions that made me look like somebody's cousin. I booked three callbacks the month the new shots went up.",
            name: "Jordan Ellis",
            detail: "Actor, Broadway",
        },
        {
            quote: "He talked to me about Bach for twenty minutes and then the pictures just happened. The cobalt one is on every program this season.",
            name: "Min-ji Park",
            detail: "Cellist",
        },
        {
            quote: "Fast, funny, and completely honest about which look worked. I've never been so happy to see my own face on a book jacket.",
            name: "Amara Osei",
            detail: "Author",
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
 * file's base name ("jordan"). Live rooms use the door's minted
 * `imageId` instead.
 */
export function photoId(image: PhotoImage): string {
    const file = image.src.split("/").pop() ?? image.src
    return file.replace(/-\d+w\.webp$/, "")
}

/**
 * Demo fixtures for baked previews and the funnel screenshot. The Ellis
 * room is the well-populated client gallery the platform renders when it
 * shows "what Spaceboy runs for you".
 */
export const demoProofingAlbums: DemoProofingAlbum[] = [
    {
        slug: "ellis-session",
        accessCode: "6243",
        clientName: "Jordan Ellis",
        title: "Jordan — three looks",
        note: "Here's the edit from our session, all three looks. Pick your favorite two or three — I'd start with the tomato — and press Send when you're done. Retouched selects come back within two days.",
        images: [sitter.jordan, sitter.priya, sitter.mateo, sitter.dev, sitter.walter, sitter.noelle],
    },
    {
        slug: "park-press",
        accessCode: "71590",
        clientName: "Min-ji Park",
        title: "Min-ji — press portraits",
        note: "The press set for the season. Mark the frames the orchestra should license; the counter keeps track. Send your picks and I'll prepare files for print and web.",
        images: [sitter.minji, sitter.noelle, sitter.amara, sitter.walter, sitter.mateo],
    },
]

export const proofing = {
    /** The gate screen's copy — what a client sees before entering the code. */
    gate: {
        title: "Your session",
        body: "This gallery is private. Enter the access code from Kaito's email to view and pick your selects.",
        placeholder: "Access code",
        cta: "View gallery",
        checking: "Checking…",
        error: "That code doesn't match this gallery — check the email from the studio.",
        notFound: "This gallery isn't available — it may have closed. Ask the studio for a new link.",
        rateLimited: "Too many attempts. Wait a moment and try again.",
        notConfigured: "Client galleries aren't set up yet. Check back shortly.",
    },
    /** The selection tray and confirmation copy. */
    selection: {
        sendCta: "Send selects",
        namePlaceholder: "Your name",
        emailPlaceholder: "Your email",
        notePlaceholder: "Anything to add about your picks? (optional)",
        confirm: "Send",
        cancel: "Keep choosing",
        sending: "Sending…",
        sendError: "Something went wrong sending your picks — try again in a moment.",
        sentTitle: "Selects sent.",
        sentBody:
            "Your picks are on their way to the studio. Retouched files arrive within two days; you can revisit this gallery and send an updated selection any time.",
        reopenCta: "Revise selects",
    },
}

/**
 * The /galleries page: the client-facing proofing explainer — what
 * happens after a session, in the photographer's own voice. The sample
 * card points at the demo Ellis room and derives its access code from
 * `demoProofingAlbums`, so the page and the fixture can never drift apart
 * (see PACK.md for the after-publish rule).
 */
const sampleRoom = demoProofingAlbums[0]

export const galleries = {
    headline: "Your selects, the same evening.",
    intro: "Every session ends with a private gallery of the whole take, posted the same evening, where you pick the frames I retouch. No public link, no account — just the pictures and your agent's opinion.",
    steps: [
        {
            title: "A private link arrives",
            body: "The night of your session you'll get a link to the full take and an access code that's yours alone. Share it with your agent or manager if you like.",
        },
        {
            title: "Pick your looks",
            body: "Mark the frames you keep coming back to; your marks save as you go. Most people choose two or three per look.",
        },
        {
            title: "Send your picks",
            body: "One press and your selects reach the studio. Retouched files, sized for casting sites and print, come back within two days.",
        },
    ],
    sample: {
        kicker: "Client galleries",
        headline: "Walk through a sample.",
        body: `A sample gallery is open for you to try — the same door, the same picking, the same send. The access code is ${sampleRoom.accessCode}.`,
        cta: "Open the sample gallery",
        /** Demo room slug — must name a `demoProofingAlbums` room. */
        slug: sampleRoom.slug,
        image: sitter.priya,
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
            typeId: "headshot-session",
            name: "Headshot session",
            durationMinutes: 90,
            description:
                "Ninety minutes, three looks on three colors of seamless, retouched selects in two days. $650.",
        },
        {
            typeId: "quick-refresh",
            name: "Quick refresh",
            durationMinutes: 45,
            description: "One look, one color, forty-five minutes — for a new haircut or a new season. $325.",
        },
        {
            typeId: "press-portrait",
            name: "Press portrait",
            durationMinutes: 120,
            description:
                "Two hours for musicians and authors: studio headshots plus a few frames with the instrument or the book. $850.",
        },
    ],
    providers: [
        {
            providerId: "kaito-mori",
            name: "Kaito Mori",
            windows: [
                { day: 1, start: 10 * 60, end: 17 * 60 },
                { day: 2, start: 10 * 60, end: 17 * 60 },
                { day: 4, start: 12 * 60, end: 19 * 60 },
                { day: 6, start: 10 * 60, end: 15 * 60 },
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
    intro: "Choose a session, then a time from the studio's real calendar. A confirmation with a one-click cancel link arrives by email — pay on the day.",
    /** The "good to know" band under the calendar: where, what if, and when the frames arrive. */
    notes: {
        kicker: "Good to know",
        headline: "How a session works.",
        body: "The calendar shows the studio's actual openings, a few weeks out. Hold a time and it's yours — the confirmation email carries a one-click cancel link, and rescheduling is free up to 48 hours before we shoot.",
        bullets: [
            "The studio is one white room in the Garment District, two blocks from the 34th Street station",
            "Bring three tops in plain colors; we choose the seamless together",
            "Your full take arrives the same evening; retouched selects within two days",
        ],
        image: sitter.walter,
    },
    sessionImages: {
        "headshot-session": sitter.jordan,
        "quick-refresh": sitter.priya,
        "press-portrait": sitter.minji,
    } as Record<string, PhotoImage>,
}

export const inquire = {
    headline: "Questions before you book?",
    body: "Tell me what the pictures are for — casting, a press kit, a book jacket — and anything you're unsure about. I reply within a day.",
    confirmation: "Thank you — your note is on its way. I reply to every message within a day.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        { name: "date", label: "Date (if known)", type: "date" as const },
        { name: "location", label: "What the photos are for", placeholder: "Casting, press, a book jacket" },
        {
            name: "message",
            label: "Your note",
            type: "textarea" as const,
            fullWidth: true,
            required: true,
        },
    ],
}
