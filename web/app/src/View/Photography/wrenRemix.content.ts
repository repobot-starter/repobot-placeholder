/**
 * The Wren remix seed: a complete, drop-in replacement for `./content.ts`
 * that retargets the photography pack from Mara Voss to Wren Hollis, a
 * Los Angeles portrait photographer who works in window light, mostly in
 * her sitters' own rooms. The derived template `repobot-photography-wren`
 * is composed from the photography pack with this file copied over
 * `content.ts`, its catalog's ink brand, and the `vitrine` register (flat
 * stone ground, a small refined Garamond, museum-label caption bands).
 * `home.layout: "stack"` turns the home page into the photographer's
 * stack: every sitting at one size, full bleed, a caption band under each.
 *
 * Because the copy is verbatim, this file must stay a structural twin of
 * `content.ts`: same exports, same relative imports, images under its own
 * `/photography-wren/` public directory. The parity test
 * (`tests/View/Photography/remixSeeds.test.ts`) pins the export surface
 * against the real module, so the seed fails CI the moment the pack's
 * contract moves without it.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/photography-wren` (see PACK.md). Every stack frame is
 * the same 4:3 shape — the stack renders them at one size regardless,
 * but a matched set keeps each crop the photographer's own.
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
        src: `/photography-wren/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/photography-wren/${name}-${step}w.webp`, width: step })),
        ...(caption !== undefined ? { caption } : {}),
    }
}

export const photographer = {
    name: "Wren Hollis",
    tagline: "Portraits in natural light",
    location: "Los Angeles, California",
    email: "sittings@wrenhollis.example",
    instagram: "https://instagram.com/wrenhollis.portraits",
}

const sitting = {
    adaeze: photo(
        "adaeze",
        1600,
        1200,
        "A novelist at her kitchen table cracking up, one hand over her mouth, manuscript pages beside her",
        "Adaeze, novelist — Echo Park",
    ),
    tanaka: photo(
        "tanaka",
        1600,
        1200,
        "A tailor in his workshop grinning as he holds out a half-finished tweed jacket, bolts of cloth behind him",
        "Kenji Tanaka, tailor — Little Tokyo",
    ),
    reyes: photo(
        "reyes",
        1600,
        1200,
        "Two sisters laughing on the family sofa, one with her face buried in the other's shoulder",
        "The Reyes sisters — Boyle Heights",
    ),
    alvarado: photo(
        "alvarado",
        1600,
        1200,
        "A potter at her wheel laughing, clay on her cheek, both clay-covered hands held up to the camera",
        "Luz Alvarado, potter — Highland Park",
    ),
    webb: photo(
        "webb",
        1600,
        1200,
        "An older pianist at his upright piano, hands on the keys, turning to grin at the camera",
        "Clarence Webb, pianist — Leimert Park",
    ),
    couple: photo(
        "couple",
        1600,
        1200,
        "A young couple on their front stoop, him mid-joke pulling a face, her doubled over laughing",
        "Priya and Sam, newlyweds — Silver Lake",
    ),
    kim: photo(
        "kim",
        1600,
        1200,
        "A grandmother baker cackling with laughter, one floury hand waving at the camera, trays of buns behind her",
        "Mrs. Kim, baker — Koreatown",
    ),
    ortega: photo(
        "ortega",
        1600,
        1200,
        "A young boxer grinning as he pulls off a hand wrap with his teeth, heavy bags behind him",
        "Danny Ortega, welterweight — East Los Angeles",
    ),
}

export const albums: Album[] = [
    {
        slug: "at-home",
        title: "At home",
        eyebrow: "2023–2026",
        description:
            "Portraits made in the sitter's own rooms — the chair by the window, the bench against the wall — in whatever light the afternoon gives.",
        images: [sitting.adaeze, sitting.webb, sitting.couple, sitting.reyes],
    },
    {
        slug: "at-work",
        title: "At work",
        eyebrow: "Makers & trades",
        description:
            "People photographed where the work happens: a tailor's shop, a potter's bench, a bakery before dawn, a gym on a weekday afternoon.",
        images: [sitting.tanaka, sitting.alvarado, sitting.kim, sitting.ortega],
    },
]

/** Home hero: three wide frames on a slow crossfade (the portfolio layout's). */
export const heroSlides: PhotoImage[] = [sitting.adaeze, sitting.tanaka, sitting.reyes]

/**
 * The home page's stack: a cross-album edit, sequenced by hand, each frame
 * captioned like a museum label — who, what they do, where.
 */
export const selectedWork: PhotoImage[] = [
    sitting.adaeze,
    sitting.tanaka,
    sitting.reyes,
    sitting.alvarado,
    sitting.webb,
    sitting.kim,
    sitting.ortega,
    sitting.couple,
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
    badge: "Portraits · Los Angeles",
    headline: "Portraits in natural light.",
    subheadline: `${photographer.name} — portraits made slowly, in window light, ${photographer.location}.`,
    intro: {
        kicker: "The sittings",
        title: "Slowly, in your own rooms",
        paragraphs: [
            "I photograph people where they already live and work, by the nearest window, with one camera and no lights. A sitting takes an afternoon; most of it is talking.",
            "Clients are writers, makers, families, and anyone who wants one true photograph more than fifty good ones.",
        ],
    },
    stack: {
        align: "center" as "center" | "start",
        closing: {
            line: "I make portraits in natural light, slowly, usually in your own rooms.",
            note: "",
            cta: "Book a sitting",
        },
    },
}

/** The /work index's hero: the collections page's headline and one line under it. */
export const work = {
    headline: "The sittings.",
    intro: "Two collections, each sequenced as it would hang: people at home, and people at work. Open one to see it in order.",
}

export const about = {
    headline: "Wren Hollis, portrait photographer.",
    portrait: photo(
        "about-wren",
        768,
        1024,
        "Wren Hollis laughing on a windowsill with a medium-format camera in her lap",
    ),
    paragraphs: [
        "I trained as a painter and still think like one: one window, one face, and as long as it takes for the room to go quiet. I work on a medium-format camera and never bring lights.",
        "Most sittings happen in the sitter's own rooms across Los Angeles — Echo Park kitchens, a tailor's shop in Little Tokyo, a gym in East LA. The places people choose tell me more than any backdrop could.",
        "Prints are made by hand in the studio and delivered framed or in a portfolio box. Every sitter receives a small edition of their favorite frame.",
    ],
    testimonials: [
        {
            quote: "Wren sat in my kitchen for three hours and took maybe forty frames. The one we chose is the only picture of me I have ever liked.",
            name: "Adaeze Okafor",
            detail: "Novelist, Echo Park",
        },
        {
            quote: "She photographed my father at his piano the spring before he stopped playing. We have it over the mantel now, and it's the first thing guests ask about.",
            name: "Denise Webb",
            detail: "Leimert Park",
        },
        {
            quote: "No lights, no fuss, no posing. She waited for my hands to go still at the bench and that was the picture.",
            name: "Luz Alvarado",
            detail: "Potter, Highland Park",
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
 * file's base name ("adaeze"). Live rooms use the door's minted
 * `imageId` instead.
 */
export function photoId(image: PhotoImage): string {
    const file = image.src.split("/").pop() ?? image.src
    return file.replace(/-\d+w\.webp$/, "")
}

/**
 * Demo fixtures for baked previews and the funnel screenshot. The Webb
 * room is the well-populated client gallery the platform renders when it
 * shows "what Spaceboy runs for you".
 */
export const demoProofingAlbums: DemoProofingAlbum[] = [
    {
        slug: "webb-sitting",
        accessCode: "5184",
        clientName: "The Webb family",
        title: "Clarence at the piano",
        note: "Here are the frames from our afternoon with your father. Choose the ones you'd like printed — as many or as few as you want — and press Send when you're done. I'll make the prints by hand and follow up about framing.",
        images: [sitting.webb, sitting.couple, sitting.adaeze, sitting.tanaka, sitting.kim, sitting.alvarado],
    },
    {
        slug: "reyes-sisters",
        accessCode: "30927",
        clientName: "Marisol and Ana Reyes",
        title: "The Reyes sisters",
        note: "The edit from our sitting in Boyle Heights. Mark the frames you both love; the counter keeps track. Send your picks and I'll print two of each, one for each house.",
        images: [sitting.reyes, sitting.couple, sitting.ortega, sitting.adaeze, sitting.webb],
    },
]

export const proofing = {
    /** The gate screen's copy — what a client sees before entering the code. */
    gate: {
        title: "Your sitting",
        body: "This gallery is private. Enter the access code from Wren's note to view and choose your photographs.",
        placeholder: "Access code",
        cta: "View gallery",
        checking: "Checking…",
        error: "That code doesn't match this gallery — check the note from Wren.",
        notFound: "This gallery isn't available — it may have closed. Ask Wren for a new link.",
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
 * happens after a sitting, in the photographer's own voice. The sample
 * card points at the demo Webb room and derives its access code from
 * `demoProofingAlbums`, so the page and the fixture can never drift apart
 * (see PACK.md for the after-publish rule).
 */
const sampleRoom = demoProofingAlbums[0]

export const galleries = {
    headline: "After the sitting, a gallery of your own.",
    intro: "Every sitting ends the same way: a private gallery of the frames worth keeping, sequenced the way the afternoon went, where you choose the ones I print. No public link, no account — just your pictures and time to decide.",
    steps: [
        {
            title: "A private link arrives",
            body: "About ten days after we meet, you'll get a link to your gallery and an access code that's yours alone. Nothing is posted anywhere public.",
        },
        {
            title: "Sit with the frames",
            body: "Look slowly — the gallery keeps your marks as you go, so you can close it and come back after dinner, or after a week.",
        },
        {
            title: "Send your picks",
            body: "One press and your choices reach the studio. I print them by hand and write to you about framing and delivery.",
        },
    ],
    sample: {
        kicker: "Client galleries",
        headline: "Walk through a sample.",
        body: `A sample gallery is open for you to try — the same door, the same choosing, the same send. The access code is ${sampleRoom.accessCode}.`,
        cta: "Open the sample gallery",
        /** Demo room slug — must name a `demoProofingAlbums` room. */
        slug: sampleRoom.slug,
        image: sitting.webb,
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
            typeId: "portrait-sitting",
            name: "Portrait sitting",
            durationMinutes: 180,
            description:
                "An afternoon in your own rooms or mine, by the best window we can find. One person, no lights, no hurry.",
        },
        {
            typeId: "double-sitting",
            name: "Couples & families",
            durationMinutes: 180,
            description:
                "The same slow afternoon for two or more — partners, siblings, three generations at the kitchen table.",
        },
        {
            typeId: "short-sitting",
            name: "Short sitting",
            durationMinutes: 60,
            description:
                "One hour in the studio's north window: a portrait for the book jacket, the program, or the mantel.",
        },
    ],
    providers: [
        {
            providerId: "wren-hollis",
            name: "Wren Hollis",
            windows: [
                { day: 2, start: 13 * 60, end: 18 * 60 },
                { day: 3, start: 13 * 60, end: 18 * 60 },
                { day: 5, start: 12 * 60, end: 18 * 60 },
                { day: 6, start: 10 * 60, end: 14 * 60 },
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
    headline: "Book a sitting.",
    intro: "Choose a sitting, then an afternoon from the studio's real calendar. A confirmation with a one-click cancel link arrives by email — no deposit to hold the date.",
    /** The "good to know" band under the calendar: where, what if, and when the frames arrive. */
    notes: {
        kicker: "Good to know",
        headline: "How a sitting works.",
        body: "The calendar shows the studio's actual afternoons, a few weeks out. Hold one and it's yours — the confirmation email carries a one-click cancel link, and moving the date is free up to 48 hours before.",
        bullets: [
            "Sittings happen in your own rooms anywhere in Los Angeles, or in the studio's north window in Echo Park",
            "We pick the room and the window together, a day or two before",
            "Your private gallery arrives about ten days later; prints are made by hand",
        ],
        image: sitting.kim,
    },
    sessionImages: {
        "portrait-sitting": sitting.adaeze,
        "double-sitting": sitting.couple,
        "short-sitting": sitting.tanaka,
    } as Record<string, PhotoImage>,
}

export const inquire = {
    headline: "Write to me about a sitting.",
    body: "A few lines about who you'd like photographed, and where — your rooms, a workshop, a place that matters — and I'll reply within three days.",
    confirmation: "Thank you — your note is on its way. I reply to every letter within three days.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        { name: "date", label: "Date (if known)", type: "date" as const },
        { name: "location", label: "Where", placeholder: "Your home, a workshop, or the studio" },
        {
            name: "message",
            label: "About the sitting",
            type: "textarea" as const,
            fullWidth: true,
            required: true,
        },
    ],
}
