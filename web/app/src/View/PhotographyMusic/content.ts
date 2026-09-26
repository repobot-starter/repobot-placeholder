/**
 * The music-photography pack's single content file: photographer, pages,
 * albums. Everything the site renders comes from here — edit this file
 * (not the page components) to make the site yours.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/photography-music` (see PACK.md). The `photo` helper
 * mirrors that verb's naming exactly, so an entry is three arguments, not
 * eight lines. Never point a slot at a raw camera file.
 *
 * Sequencing is the craft: the home reel and the `justified` galleries
 * preserve array order exactly, so order every set the way a photographer
 * would sequence a portfolio — open loud, breathe, close loud.
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
    /** Small uppercase label on the cover tile, e.g. the where or the when. */
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
        src: `/photography-music/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/photography-music/${name}-${step}w.webp`, width: step })),
        ...(caption !== undefined ? { caption } : {}),
    }
}

export const photographer = {
    name: "Vic Mercer",
    tagline: "Music photography",
    location: "Austin, Texas",
    email: "studio@vicmercer.example",
    instagram: "https://instagram.com/vicmercer.frames",
}

export const albums: Album[] = [
    {
        slug: "live",
        title: "Live",
        eyebrow: "Clubs · Theaters",
        description:
            "Small rooms and big rooms, shot from the side of the stage on pushed film — the leap, the bend, the last chorus before the lights come up.",
        images: [
            photo(
                "live-05",
                1536,
                1024,
                "Spotlight beams crossing over a distant stage in an ornate old theater",
            ),
            photo(
                "live-02",
                1024,
                1536,
                "A singer gripping the microphone stand, eyes closed under a hard spotlight",
            ),
            photo("live-01", 1536, 1024, "A drummer mid-strike, backlit by a wall of white stage light"),
            photo(
                "live-04",
                1024,
                1536,
                "A bass player leaning against a stack of tube amplifiers in stage haze",
            ),
            photo("live-03", 1536, 1024, "A fan crowd-surfing over the front rows of a packed club"),
            photo(
                "live-06",
                1024,
                1536,
                "A guitarist's hands bending a string mid-solo, rings catching the light",
            ),
        ],
    },
    {
        slug: "festivals",
        title: "Festivals",
        eyebrow: "Fields · Dust · Dawn",
        description:
            "Three days in a field for four songs at sunset — flags, dust, rain, and the quiet campground morning nobody photographs.",
        images: [
            photo(
                "fest-03",
                1536,
                1024,
                "A festival crowd stretching to the tree line under golden dust at sunset",
            ),
            photo(
                "fest-02",
                1024,
                1536,
                "A woman on someone's shoulders above the crowd, arms spread against the sun",
            ),
            photo(
                "fest-01",
                1536,
                1024,
                "A festival main stage at dusk, amber lights against a deep blue sky",
            ),
            photo("fest-05", 1024, 1536, "A fan pressed against the front barrier singing every word"),
            photo(
                "fest-04",
                1536,
                1024,
                "A rain-soaked festival crowd at night, faces upturned into the stage light",
            ),
            photo(
                "fest-06",
                1536,
                1024,
                "A misty festival campground at dawn, two figures carrying a guitar case",
            ),
        ],
    },
    {
        slug: "studio",
        title: "The Studio",
        eyebrow: "Between takes",
        description:
            "Where the records actually get made — playback around the console, one voice in the booth, and the setlist nobody can read but the band.",
        images: [
            photo(
                "studio-01",
                1536,
                1024,
                "A band and producer around a mixing console listening to a playback",
            ),
            photo(
                "studio-02",
                1024,
                1536,
                "A vocalist in a dim booth, hands cupping her headphones mid-note",
            ),
            photo(
                "studio-05",
                1536,
                1024,
                "A pianist alone at a grand piano in a dark live room under one lamp",
            ),
            photo(
                "studio-04",
                1024,
                1536,
                "A guitarist slumped on the studio couch, tuning by ear in the window light",
            ),
            photo(
                "studio-03",
                1536,
                1024,
                "A reel-to-reel tape machine mid-recording, VU meters glowing amber",
            ),
            photo(
                "studio-06",
                1024,
                1536,
                "A handwritten setlist, coffee, and a stopwatch on the console armrest",
            ),
        ],
    },
]

/** Home hero: three wide frames on a slow crossfade — the show, the field,
 * the control room. */
export const heroSlides: PhotoImage[] = [
    photo("hero-01", 1536, 1024, "A guitarist in silhouette mid-leap through crossing spotlight beams"),
    photo("hero-02", 1536, 1024, "A festival crowd at golden hour seen from the stage, flags raised"),
    photo(
        "hero-03",
        1536,
        1024,
        "A recording-studio control room at night, smoke drifting through lamp light",
    ),
]

/**
 * The home page's reel: one frame per viewport, in order — the pacing of a
 * slide show in a dark room. A cross-album edit of wide frames; pull from
 * the albums so home and album pages stay in sync.
 */
export const reel: PhotoImage[] = [
    albums[0].images[0],
    albums[1].images[4],
    albums[2].images[2],
    albums[0].images[4],
    albums[1].images[0],
    albums[2].images[0],
]

/** One sleeve on the records home's wall: the cover art, who, and what. */
export interface RecordCover {
    image: PhotoImage
    artist: string
    title: string
}

/**
 * The home page's shape. `reel` is the marquee hero over the full-bleed
 * reel, the archive, and the intro. `records` is the record wall: the
 * first hero slide as one full-bleed frame, then `records.covers` as a
 * tight grid of square sleeves (artist over album title), closed by
 * `records.closing` — one line and a text link to /book. The wall reads
 * nothing else on `home`.
 */
export type HomeLayout = "reel" | "records"

export const home = {
    layout: "reel" as HomeLayout,
    badge: "Live · Festivals · Studio",
    headline: "Thirty years side-stage.",
    subheadline: `${photographer.name} — music photography on film. Clubs, festivals, and control rooms.`,
    intro: {
        kicker: "The photographer",
        title: "Loud rooms, long lenses, no flash",
        paragraphs: [
            "I photograph music the way it actually happens: from the side of the stage, in the third encore, in the hour after load-in when nobody is performing anything. Almost everything here was made on film, because film forgives stage light and I don't trust a picture I can delete.",
            "Bands, venues, festivals, and labels hire me for full runs and single nights. The archive runs deep; prints and licensing are handled directly.",
        ],
    },
    records: {
        covers: [] as RecordCover[],
        closing: {
            line: "Live, festival, and studio photography on film. Based in Austin.",
            cta: "Get in touch",
        },
    },
}

export const about = {
    headline: "The guy with the laminate.",
    portrait: photo(
        "about-portrait",
        1024,
        1536,
        "Vic Mercer backstage with two film cameras around his neck",
    ),
    paragraphs: [
        "I got my first side-stage pass by lying about who I worked for, and my second by showing the tour manager what I shot on the first. It has been bands, fields, and buses ever since — the pass changed, the cameras mostly didn't.",
        "I work available light, side-stage and backstage, and I don't direct anybody. A show photographed from the pit looks like everyone else's night; from the wings you get what the band sees, and that's the picture worth keeping.",
        "The archive covers club runs, festival summers, and studio sessions across three decades. Prints are editioned; licensing for press, reissues, and documentaries is handled from the studio in Austin.",
    ],
    testimonials: [
        {
            quote: "Vic shot our whole run and we never once saw him work. Then the contact sheets came back and there was the entire tour — the shows, the bus, the boredom, all of it.",
            name: "Ray Delgado",
            detail: "Tour manager",
        },
        {
            quote: "The picture on our live record is his. People who were at that show say the photograph is louder than the tape.",
            name: "Junie Hart",
            detail: "Singer, The Late Hours",
        },
        {
            quote: "We've licensed his frames for three reissues. Nobody else's archive has that light — you can smell the smoke machine.",
            name: "Marcus Bell",
            detail: "Art director, Wildflower Records",
        },
    ],
}

export const book = {
    headline: "Get me side-stage.",
    body: "Hold a session time straight from the studio calendar below, or send the show's details — single nights, full runs, festivals, and sessions. I answer within two days, faster if the show is sooner.",
    confirmation: "Got it — your note is on its way. I answer every booking inquiry within two days.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        { name: "date", label: "Show date (if known)", type: "date" as const },
        { name: "venue", label: "Venue / festival / studio", placeholder: "Room, field, or session" },
        {
            name: "message",
            label: "About the show",
            type: "textarea" as const,
            fullWidth: true,
            required: true,
        },
    ],
}

/**
 * The `appointments` content domain, code fallback — the /book page's
 * slot picker input, same contract as the photography pack (booking mode
 * 2 on the managed booking kernel). Session types carry the slot length
 * they book; the studio's weekly windows are packed into concrete
 * capacity-1 slots by the platform's own derivation
 * (`generateAppointmentSlots`), so a preview offers exactly what a deploy
 * would. Times are NUMBERS — `day` is the weekday index (0 = Sunday),
 * `start`/`end` minutes since midnight. The catalog's content seed
 * mirrors this export entry for entry (the booking tests pin the twin).
 * Tours and full runs stay with the booking form — the calendar holds
 * only what fits in a day.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "live-show-coverage",
            name: "Live show coverage",
            durationMinutes: 240,
            description:
                "Load-in through the encore, from the wings — one night, one room, the whole set. The evening block holds soundcheck onward.",
        },
        {
            typeId: "promo-shoot",
            name: "Promo shoot",
            durationMinutes: 120,
            description:
                "Two hours on location or backstage for the press kit, the poster, and the record sleeve — available light, no seamless paper.",
        },
        {
            typeId: "studio-session",
            name: "Studio session",
            durationMinutes: 180,
            description:
                "Three hours in the room while you track — playback huddles, the booth, the setlist nobody can read. The frames the reissue will want.",
        },
    ],
    providers: [
        {
            providerId: "vic-mercer",
            name: "Vic Mercer",
            windows: [
                { day: 2, start: 12 * 60, end: 18 * 60 },
                { day: 3, start: 12 * 60, end: 18 * 60 },
                { day: 5, start: 14 * 60, end: 22 * 60 },
            ],
        },
    ],
}

/**
 * The /book page's session-card art. `sessionImages` fronts each session
 * type's card with a frame from the albums — art from code, facts from
 * the contract (the photography pack's discipline). Keys must stay joined
 * to `codeAppointments.types` type ids; the booking tests hold the join.
 */
export const sessionBooking = {
    sessionImages: {
        "live-show-coverage": albums[0].images[0],
        "promo-shoot": albums[0].images[3],
        "studio-session": albums[2].images[0],
    } as Record<string, PhotoImage>,
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
 * file's base name ("live-03"). Live rooms use the door's minted
 * `imageId` instead.
 */
export function photoId(image: PhotoImage): string {
    const file = image.src.split("/").pop() ?? image.src
    return file.replace(/-\d+w\.webp$/, "")
}

/**
 * Demo fixtures for baked previews and the funnel screenshot. The Late
 * Hours room is the well-populated client gallery the platform renders
 * when it shows what the proofing service runs for the studio.
 */
export const demoProofingAlbums: DemoProofingAlbum[] = [
    {
        slug: "late-hours-run",
        accessCode: "8146",
        clientName: "The Late Hours",
        title: "The Late Hours — spring run",
        note: "The edit from the run — the shows and the field. Pick the frames you want for the record and the press kit — as many or as few as you want — and press Send when you're done. I'll prep your picks at press resolution.",
        images: [
            albums[0].images[0],
            albums[0].images[1],
            albums[0].images[2],
            albums[0].images[3],
            albums[1].images[0],
            albums[1].images[1],
            albums[1].images[3],
            albums[0].images[5],
        ],
    },
    {
        slug: "wildflower-session",
        accessCode: "40272",
        clientName: "Wildflower Records",
        title: "Wildflower — session frames",
        note: "The frames from the tracking week. Select what the reissue needs; the counter keeps track. Send your picks and I'll follow up about licensing and scans.",
        images: [
            albums[2].images[0],
            albums[2].images[1],
            albums[2].images[3],
            albums[2].images[4],
            albums[2].images[5],
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
 * happens after the show, in the photographer's own voice. It speaks to
 * bands, managers, and labels, and in doing so shows a photographer
 * evaluating the template exactly what the platform's proofing service
 * will do for them. The sample card points at the demo Late Hours room
 * and derives its access code from `demoProofingAlbums`, so the page and
 * the fixture can never drift apart.
 */
const sampleRoom = demoProofingAlbums[0]

export const galleries = {
    headline: "After the show, the contact sheet.",
    intro: "Every run ends the same way: a private online gallery, sequenced like the set, where the band and the label pick the frames that get finished. No public link, no account to make — just the night and a quiet place to decide.",
    steps: [
        {
            title: "A private link arrives",
            body: "Within a week of the show you'll get a link to your own gallery and an access code that's yours alone. Nothing is posted anywhere public; nobody sees the frames but the people you hand the code to.",
        },
        {
            title: "Read it like a set list",
            body: "The gallery runs first note to last — the way the night actually went. Mark the frames you keep coming back to; your picks save as you go, so the manager and the label can take their turn tomorrow.",
        },
        {
            title: "Send your picks",
            body: "One press and your selection lands at the studio instantly, with any notes about the press kit or the sleeve. I finish the frames you chose and follow up about files and licensing.",
        },
    ],
    sample: {
        kicker: "Client galleries",
        headline: "Walk through a sample.",
        body: `Curious what the band sees? A sample gallery is open for you to try — the same gate, the same choosing, the same send. The access code at the door is ${sampleRoom.accessCode}.`,
        cta: "Open the sample gallery",
        /** Demo room slug — must name a `demoProofingAlbums` room. */
        slug: sampleRoom.slug,
        image: albums[1].images[1],
    },
}
