/**
 * The Theo remix seed: a complete, drop-in replacement for `./content.ts`
 * that retargets the music-photography pack from Vic Mercer to Theo Marsh,
 * an East Nashville photographer who makes album covers, press photos and
 * live-show pictures for the young scene. The derived template `repobot-photography-music-theo` is
 * composed from the photography-music pack with this file copied over
 * `content.ts`, its catalog's ink brand, and the `liner` register in its dark
 * mode (near-black sleeve stock, a small Barlow grotesque).
 * `home.layout: "records"` turns the home page into the record wall: one
 * full-bleed frame, a tight grid of square covers, one line and a link.
 *
 * Because the copy is verbatim, this file must stay a structural twin of
 * `content.ts`: same exports, same relative imports, images under its own
 * `/photography-music-theo/` public directory. The parity test
 * (`tests/View/PhotographyMusic/remixSeeds.test.ts`) pins the export
 * surface against the real module, so the seed fails CI the moment the
 * pack's contract moves without it.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/photography-music-theo` (see PACK.md). Every cover is
 * square; the artists and records are invented.
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
        src: `/photography-music-theo/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/photography-music-theo/${name}-${step}w.webp`, width: step })),
        ...(caption !== undefined ? { caption } : {}),
    }
}

export const photographer = {
    name: "Theo Marsh",
    tagline: "Album art, press photos and live shows",
    location: "East Nashville, Tennessee",
    email: "hello@theomarsh.example",
    instagram: "https://instagram.com/theomarsh.photo",
}

const cover = {
    hornet: photo(
        "cover-hornet",
        1024,
        1024,
        "A drummer shot from above mid-hit, hair whipping, sticks blurred under cyan and magenta light",
    ),
    vane: photo(
        "cover-vane",
        1024,
        1024,
        "A singer in a cream satin shirt spinning and laughing against a tomato-orange wall, her flash shadow behind her",
    ),
    juniper: photo(
        "cover-juniper",
        1024,
        1024,
        "A bleached-haired guitarist in red flannel leaping off the drum riser under magenta light",
    ),
    marrow: photo(
        "cover-marrow",
        1024,
        1024,
        "A rapper in a varsity jacket reaching toward the lens on a rooftop at night, city lights streaking behind",
    ),
    sodium: photo(
        "cover-sodium",
        1024,
        1024,
        "A packed basement show under bare pipes and red light, the crowd pressed to the front and singing along",
    ),
    okafor: photo(
        "cover-okafor",
        1024,
        1024,
        "Close on a soul singer with her lips to a chrome microphone, eyes closed, under magenta and cyan light",
    ),
    kiddo: photo(
        "cover-kiddo",
        1024,
        1024,
        "A punk trio goofing against a cobalt wall — one mid-jump in tartan, one yelling in leopard print, one cracking up",
    ),
    moth: photo(
        "cover-moth",
        1024,
        1024,
        "A grinning singer with a bleached pixie cut crowd-surfing over a sea of raised hands",
    ),
    birdie: photo(
        "cover-birdie",
        1024,
        1024,
        "A songwriter in a pink jacket kicking a leg up and laughing against a yellow cinderblock wall, a sunburst guitar slung low",
    ),
    pinhole: photo(
        "cover-pinhole",
        1024,
        1024,
        "A band piled in the back of a van after a show, all of them laughing under the flash",
    ),
    tessa: photo(
        "cover-tessa",
        1024,
        1024,
        "A soul band clowning around in a cramped green room before a show, one in a sequined jacket",
    ),
    tarRoofs: photo(
        "cover-tar-roofs",
        1024,
        1024,
        "A band playing an outdoor set at night under string lights, a crowd of friends packed in front",
    ),
    ember: photo(
        "cover-ember",
        1024,
        1024,
        "A trumpeter and a saxophonist leaning into the same blast under red stage light",
    ),
}

const scream = photo(
    "hero-scream",
    1600,
    900,
    "A singer mid-scream into the microphone under red light, the crowd's hands in the foreground",
)

export const albums: Album[] = [
    {
        slug: "covers",
        title: "Covers",
        eyebrow: "Album art",
        description:
            "Record sleeves for the East Nashville scene — garage punk, soul, indie rock and hip-hop, shot where the songs get played.",
        images: [
            cover.hornet,
            cover.vane,
            cover.juniper,
            cover.marrow,
            cover.okafor,
            cover.kiddo,
            cover.birdie,
            cover.tarRoofs,
        ],
    },
    {
        slug: "portraits",
        title: "Portraits",
        eyebrow: "Press",
        description:
            "Press photographs for the one-sheet, the festival program and the tour poster — direct flash, bold walls, whatever attitude the band brings.",
        images: [cover.vane, cover.kiddo, cover.birdie, cover.marrow, cover.tessa, cover.okafor],
    },
    {
        slug: "tour",
        title: "Tour",
        eyebrow: "Live",
        description:
            "Out with the band between towns: the packed rooms, the stage dives, the green room, the van ride home laughing.",
        images: [scream, cover.sodium, cover.moth, cover.pinhole, cover.tessa, cover.ember],
    },
]

/** Home hero: the records layout shows the first frame alone, full bleed. */
export const heroSlides: PhotoImage[] = [scream]

/**
 * The home page's reel (the reel layout's): one frame per viewport, in
 * order. Pull from the albums so home and album pages stay in sync.
 */
export const reel: PhotoImage[] = [scream, cover.moth, cover.sodium, cover.ember]

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
    layout: "records" as HomeLayout,
    badge: "Covers · Portraits · Tour",
    headline: "Album art, press photos and live shows.",
    subheadline: `${photographer.name} — music photography from ${photographer.location}.`,
    intro: {
        kicker: "The photographer",
        title: "Pictures for the sleeve",
        paragraphs: [
            "I make the pictures that go on the record: the cover, the press shots, and the live frames from the pit that end up in the liner notes. Most of it happens where the music does — basements, rooftops, back rooms — with the band as loud as they are.",
            "Bands, rappers, songwriters and small labels hire me for a cover, a campaign, or a week on the road.",
        ],
    },
    records: {
        covers: [
            { image: cover.hornet, artist: "Glass Hornet", title: "Spit Shine" },
            { image: cover.vane, artist: "Dakota Vane", title: "Honey, Later" },
            { image: cover.juniper, artist: "Juniper Riot", title: "Kick Drum Heart" },
            { image: cover.marrow, artist: "Lil Marrow", title: "Gallatin Pike" },
            { image: cover.sodium, artist: "The Sodium Lights", title: "Low Ceilings" },
            { image: cover.okafor, artist: "Rae Okafor", title: "Sugar Static" },
            { image: cover.kiddo, artist: "Kiddo Ruin", title: "Bad Posture" },
            { image: cover.moth, artist: "Moth Parade", title: "Hands Up, Eyes Shut" },
            { image: cover.birdie, artist: "Birdie Lusk", title: "Cinderblock Summer" },
            { image: cover.pinhole, artist: "Pinhole Kids", title: "Cheap Flash" },
            { image: cover.tessa, artist: "Tessa & the Fever", title: "Sequins on the Floor" },
            { image: cover.tarRoofs, artist: "The Tar Roofs", title: "Rooftop Season" },
        ] as RecordCover[],
        closing: {
            line: "Album art, press photos and live shows for the East Nashville scene.",
            cta: "Get in touch",
        },
    },
}

export const about = {
    headline: "Theo Marsh, music photographer.",
    portrait: photo(
        "about-theo",
        768,
        1024,
        "Theo Marsh laughing in the crowd at a show, camera raised over his head under magenta light",
    ),
    paragraphs: [
        "I moved to East Nashville to play bass and ended up photographing the bands I played with. The cameras stayed; the bass mostly didn't.",
        "Covers are my favorite work: a week with the demos, then one night or one afternoon to get the picture that sounds like the record. Live shows and press fill in the rest of the year.",
        "I work with young bands, solo artists and small labels across the scene — punk, soul, indie, hip-hop. Prints and licensing are handled from the studio on Gallatin Avenue.",
    ],
    testimonials: [
        {
            quote: "Theo listened to the demos for a week before he'd pick up a camera. The rooftop was his idea, and now I can't imagine the record any other way.",
            name: "Birdie Lusk",
            detail: "Songwriter",
        },
        {
            quote: "He rode two weeks in the van with us and never once made us pose. The tour photos came out louder than the shows.",
            name: "Tessa Oyelaran",
            detail: "Tessa & the Fever",
        },
        {
            quote: "Every cover he's shot for us has been the one people pick up in the shop. That's the whole job.",
            name: "Lena Ruiz",
            detail: "Art director, Porchlight Records",
        },
    ],
}

export const book = {
    headline: "Get in touch.",
    body: "Hold a session time straight from the studio calendar below, or tell me about the record — covers, press shots, and tour work. I answer within two days, faster if the release is sooner.",
    confirmation: "Got it — your note is on its way. I answer every inquiry within two days.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        { name: "date", label: "Release or show date (if known)", type: "date" as const },
        { name: "venue", label: "Band / record / tour", placeholder: "Who and what" },
        {
            name: "message",
            label: "About the project",
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
 * Tours stay with the booking form — the calendar holds only what fits in
 * a day.
 */
export const codeAppointments: AppointmentsContent = {
    types: [
        {
            typeId: "cover-shoot",
            name: "Cover shoot",
            durationMinutes: 240,
            description:
                "A night or an afternoon for the sleeve — in the room the record sounds like, with the light it needs.",
        },
        {
            typeId: "press-shoot",
            name: "Press shoot",
            durationMinutes: 120,
            description:
                "Two hours for the one-sheet, the festival program and the poster — direct flash, a bold wall, your attitude.",
        },
        {
            typeId: "listening-session",
            name: "Listening session",
            durationMinutes: 60,
            description:
                "An hour at the studio with the demos and a pot of coffee, to find the picture before we shoot it.",
        },
    ],
    providers: [
        {
            providerId: "theo-marsh",
            name: "Theo Marsh",
            windows: [
                { day: 2, start: 13 * 60, end: 20 * 60 },
                { day: 4, start: 13 * 60, end: 20 * 60 },
                { day: 6, start: 10 * 60, end: 18 * 60 },
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
        "cover-shoot": cover.juniper,
        "press-shoot": cover.vane,
        "listening-session": cover.pinhole,
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
 * file's base name ("cover-hornet"). Live rooms use the door's minted
 * `imageId` instead.
 */
export function photoId(image: PhotoImage): string {
    const file = image.src.split("/").pop() ?? image.src
    return file.replace(/-\d+w\.webp$/, "")
}

/**
 * Demo fixtures for baked previews and the funnel screenshot. The Fever
 * room is the well-populated client gallery the platform renders when it
 * shows what the proofing service runs for the studio.
 */
export const demoProofingAlbums: DemoProofingAlbum[] = [
    {
        slug: "fever-cover",
        accessCode: "3718",
        clientName: "Tessa & the Fever",
        title: "Sequins on the Floor — cover and press",
        note: "The edit from the green room and the show. Pick the cover and the press frames — as many or as few as you want — and press Send when you're done. I'll prep your picks at print resolution for the sleeve.",
        images: [
            cover.tessa,
            scream,
            cover.sodium,
            cover.moth,
            cover.pinhole,
            cover.okafor,
            cover.ember,
            cover.juniper,
        ],
    },
    {
        slug: "porchlight-reissue",
        accessCode: "52064",
        clientName: "Porchlight Records",
        title: "Porchlight — singles series",
        note: "The frames for this summer's singles. Select what the sleeves need; the counter keeps track. Send your picks and I'll follow up about licensing and files.",
        images: [cover.hornet, cover.kiddo, cover.birdie, cover.marrow, cover.tarRoofs],
    },
]

export const proofing = {
    /** The gate screen's copy — what a client sees before entering the code. */
    gate: {
        title: "Client proofing",
        body: "This gallery is private. Enter the access code from Theo's note to view and select your photographs.",
        placeholder: "Access code",
        cta: "View gallery",
        checking: "Checking…",
        error: "That code doesn't match this gallery — check the note from Theo.",
        notFound: "This gallery isn't available — it may have closed. Ask Theo for a new link.",
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
 * happens after the shoot, in the photographer's own voice. The sample
 * card points at the demo Fever room and derives its access code from
 * `demoProofingAlbums`, so the page and the fixture can never drift apart.
 */
const sampleRoom = demoProofingAlbums[0]

export const galleries = {
    headline: "After the shoot, the contact sheet.",
    intro: "Every shoot ends the same way: a private gallery of the whole take, where the band and the label pick the frames for the sleeve and the press kit. No public link, no account — just the pictures and time to argue about them.",
    steps: [
        {
            title: "A private link arrives",
            body: "Within a week you'll get a link to your gallery and an access code that's yours alone. Share it with the band, the manager and the label.",
        },
        {
            title: "Pick the cover",
            body: "Mark the frames you keep coming back to; your picks save as you go, so everyone can take a turn before you decide.",
        },
        {
            title: "Send your picks",
            body: "One press and your selection reaches the studio, with any notes for the designer. I finish the frames and send files sized for vinyl, CD and streaming.",
        },
    ],
    sample: {
        kicker: "Client galleries",
        headline: "Walk through a sample.",
        body: `Curious what the band sees? A sample gallery is open for you to try — the same gate, the same choosing, the same send. The access code is ${sampleRoom.accessCode}.`,
        cta: "Open the sample gallery",
        /** Demo room slug — must name a `demoProofingAlbums` room. */
        slug: sampleRoom.slug,
        image: cover.tessa,
    },
}
