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

export const home = {
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
    body: "A few lines about the show — who's playing, where, and when. Single nights, full runs, festivals, and sessions. I answer within two days, faster if the show is sooner.",
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
