/**
 * The band pack's single content file: The Overtones — who they are, where
 * they're playing, what they've recorded, and the press kit. Everything
 * the site renders comes from here; edit this file (never the page
 * components) to make the site yours.
 *
 * Tour dates are plain ISO dates: the pages split them upcoming/past at
 * render time (View/Music/schedule.ts), highlight the next show, and
 * compute the "On tour" / "Tonight — City" badge — past shows archive
 * themselves at midnight, no edits required.
 *
 * Audio is the hybrid system (View/Music/AudioPlayer.tsx): each track
 * ships with a bundled ORIGINAL demo loop (waveform peaks precomputed in
 * demoLoops.gen.ts). Paste a Spotify / Bandcamp / SoundCloud link into a
 * track's `embedUrl` and its player swaps to a click-to-load embed of the
 * real recording behind the same frame.
 *
 * Images carry intrinsic dimensions and a WebP srcSet produced by
 * `npm run image -- responsive <original> --out-dir web/app/public/band`
 * (see PACK.md). Press-kit downloads point at the full-resolution
 * originals under /band/press/ — real files, because a booker will
 * actually download them.
 */

import type { PlayableTrack, TrackImage } from "../Music/AudioPlayer"
import type { ShowDate } from "../Music/schedule"
import { DEMO_LOOPS } from "../Music/demoLoops.gen"

export interface BandImage extends TrackImage {
    srcSet: { src: string; width: number }[]
}

/** The width ladder `npm run image -- responsive` emits (capped at each
 * original's own width). */
function image(name: string, width: number, height: number, alt: string): BandImage {
    const widths = [...new Set([640, 1024, 1536].map((step) => Math.min(step, width)))]
    return {
        src: `/band/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/band/${name}-${step}w.webp`, width: step })),
    }
}

export const band = {
    name: "The Overtones",
    tagline: "Loud, warm rock & roll",
    location: "Asbury Park, New Jersey",
    since: "Since 2019",
    email: "mgmt@theovertones.example",
    instagram: "https://instagram.com/theovertonesband",
}

export const home = {
    headline: "The Overtones",
    subheadline:
        "Four people, two amplifiers too many, and songs that sound like the last hour of a long night. Loud, warm rock & roll from Asbury Park.",
    intro: {
        kicker: "The band",
        title: "Built in a boardwalk practice room",
        paragraphs: [
            "The Overtones started as a Tuesday-night habit in a rented room above a shuttered arcade — two guitars, a drummer who hits like a dockworker, and a bass player who owns exactly one pedal and refuses to explain it.",
            "Three records later the habit became the job: a live show tuned in vans and small rooms up and down the coast, taken to tape as live as the meters allow.",
        ],
    },
}

export const heroImages = {
    marquee: image("hero-01", 1536, 1024, "The Overtones on stage under white light, mid-song"),
    crowd: image("hero-02", 1536, 1024, "A packed floor at an Overtones show, hands up in the haze"),
    portrait: image("portrait", 1024, 1536, "The Overtones against a brick wall, morning light"),
}

/* ----------------------------------- Tour ----------------------------------- */

/** Every show ever booked, any order — the site sorts and splits by date
 * at render time. Ticket links are external (the pack never sells). */
export const shows: ShowDate[] = [
    // The run ahead.
    {
        date: "2026-09-04",
        city: "Asbury Park",
        region: "NJ",
        venue: "The Wonder Bar",
        ticketUrl: "https://tickets.example/overtones/asbury-park",
        note: "Hometown",
    },
    {
        date: "2026-09-12",
        city: "Philadelphia",
        region: "PA",
        venue: "Johnny Brenda's",
        ticketUrl: "https://tickets.example/overtones/philadelphia",
    },
    {
        date: "2026-09-19",
        city: "Brooklyn",
        region: "NY",
        venue: "Music Hall of Williamsburg",
        ticketUrl: "https://tickets.example/overtones/brooklyn",
    },
    {
        date: "2026-10-02",
        city: "Boston",
        region: "MA",
        venue: "The Sinclair",
        ticketUrl: "https://tickets.example/overtones/boston",
    },
    {
        date: "2026-10-10",
        city: "Washington",
        region: "DC",
        venue: "Black Cat",
        ticketUrl: "https://tickets.example/overtones/washington",
    },
    {
        date: "2026-10-24",
        city: "Chicago",
        region: "IL",
        venue: "Lincoln Hall",
        ticketUrl: "https://tickets.example/overtones/chicago",
        note: "Sold out",
    },
    {
        date: "2026-11-06",
        city: "Austin",
        region: "TX",
        venue: "Mohawk",
        ticketUrl: "https://tickets.example/overtones/austin",
    },
    {
        date: "2026-11-14",
        city: "Los Angeles",
        region: "CA",
        venue: "The Troubadour",
        ticketUrl: "https://tickets.example/overtones/los-angeles",
    },
    {
        date: "2027-02-20",
        city: "London",
        region: "UK",
        venue: "Omeara",
        ticketUrl: "https://tickets.example/overtones/london",
        note: "First UK show",
    },
    // The archive writes itself.
    { date: "2026-06-19", city: "Asbury Park", region: "NJ", venue: "The Stone Pony", note: "Sold out" },
    { date: "2026-06-06", city: "New Haven", region: "CT", venue: "Toad's Place" },
    { date: "2026-05-22", city: "Baltimore", region: "MD", venue: "Ottobar" },
    { date: "2026-05-09", city: "Richmond", region: "VA", venue: "The Broadberry" },
    { date: "2025-11-28", city: "Jersey City", region: "NJ", venue: "White Eagle Hall" },
    { date: "2025-10-17", city: "Pittsburgh", region: "PA", venue: "Mr. Smalls Theatre" },
    {
        date: "2025-09-05",
        city: "Asbury Park",
        region: "NJ",
        venue: "Sea.Hear.Now (festival)",
        note: "Festival",
    },
]

/* --------------------------------- The records --------------------------------- */

export interface BandTrack extends PlayableTrack {
    cover?: BandImage
}

export interface Record {
    slug: string
    title: string
    year: number
    /** "LP" | "EP" | "Single" — mono microcopy on the shelf. */
    format: string
    label: string
    cover: BandImage
    notes: string
    tracks: BandTrack[]
}

const covers = {
    staticGold: image("album-static-gold", 1024, 1024, "Static & Gold — album artwork"),
    nightSignals: image("album-night-signals", 1024, 1024, "Night Signals — album artwork"),
    copperSky: image("album-copper-sky", 1024, 1024, "Copper Sky — EP artwork"),
}

/**
 * The shelf, newest first. Demo tracks play bundled original instrumental
 * loops; set a track's `embedUrl` to your streaming link and the player
 * swaps to the real recording.
 */
export const records: Record[] = [
    {
        slug: "static-and-gold",
        title: "Static & Gold",
        year: 2026,
        format: "LP",
        label: "Boardwalk Sound",
        cover: covers.staticGold,
        notes: "Ten songs cut live to tape in six days. The loud record — the one the van was tuned for.",
        tracks: [
            {
                title: "Static & Gold",
                meta: "LP · 2026",
                audioSrc: "/band/audio/band-static-gold.m4a",
                seconds: DEMO_LOOPS["band-static-gold"].seconds,
                peaks: DEMO_LOOPS["band-static-gold"].peaks,
                cover: covers.staticGold,
            },
            {
                title: "Overtime",
                meta: "LP · 2026",
                audioSrc: "/band/audio/band-overtime.m4a",
                seconds: DEMO_LOOPS["band-overtime"].seconds,
                peaks: DEMO_LOOPS["band-overtime"].peaks,
                cover: covers.staticGold,
            },
        ],
    },
    {
        slug: "night-signals",
        title: "Night Signals",
        year: 2024,
        format: "LP",
        label: "Boardwalk Sound",
        cover: covers.nightSignals,
        notes: "The 2 a.m. record. Slower, wider, written in the off-season when the boardwalk empties out.",
        tracks: [
            {
                title: "Night Signals",
                meta: "LP · 2024",
                audioSrc: "/band/audio/band-night-signals.m4a",
                seconds: DEMO_LOOPS["band-night-signals"].seconds,
                peaks: DEMO_LOOPS["band-night-signals"].peaks,
                cover: covers.nightSignals,
            },
        ],
    },
    {
        slug: "copper-sky",
        title: "Copper Sky",
        year: 2022,
        format: "EP",
        label: "Self-released",
        cover: covers.copperSky,
        notes: "Five songs recorded in the practice room with one good microphone. Where it started.",
        tracks: [
            {
                title: "Copper Sky",
                meta: "EP · 2022",
                audioSrc: "/band/audio/band-copper-sky.m4a",
                seconds: DEMO_LOOPS["band-copper-sky"].seconds,
                peaks: DEMO_LOOPS["band-copper-sky"].peaks,
                cover: covers.copperSky,
            },
        ],
    },
]

/* ---------------------------------- Video ---------------------------------- */

export interface BandVideo {
    title: string
    meta: string
    /** YouTube URL — loads click-to-behind the poster frame. */
    videoUrl: string
    poster: BandImage
}

export const videos: BandVideo[] = [
    {
        title: "Static & Gold — live at The Stone Pony",
        meta: "Live · June 2026",
        videoUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
        poster: heroImages.crowd,
    },
]

/* --------------------------------- Mailing list --------------------------------- */

export const mailingList = {
    kicker: "The list",
    title: "First to know",
    body: "Tour dates, new records, and the occasional demo that never makes it past the practice room. No noise otherwise.",
    cta: "Sign up",
    confirmation: "You're on the list. See you up front.",
}

/* ---------------------------------- Press kit ---------------------------------- */

export interface PressPhoto {
    /** Display rendition (responsive WebP). */
    display: BandImage
    /** The full-resolution original a booker actually downloads. */
    downloadHref: string
    downloadLabel: string
    credit: string
}

export const pressKit = {
    intro: "Everything a promoter, booker, or writer needs — approved photography, logos, bios in three lengths, and the tech rider. If it's on this page, it's cleared for use.",
    bios: {
        short: "The Overtones are a four-piece rock & roll band from Asbury Park, New Jersey — loud, warm, and built for small rooms with low ceilings. Three records in, the live show is the argument.",
        medium: "The Overtones are a four-piece rock & roll band from Asbury Park, New Jersey. Formed in 2019 in a practice room above a shuttered boardwalk arcade, the band has released three records — Copper Sky (2022), Night Signals (2024), and Static & Gold (2026) — each cut as live as the meters allow. The songs are loud and warm at the same time: two guitars traded like a conversation, a rhythm section that swings harder than it should, and choruses written for the last hour of a long night.",
        long: [
            "The Overtones are a four-piece rock & roll band from Asbury Park, New Jersey. They formed in 2019 the usual way: a Tuesday-night habit in a rented practice room above a shuttered arcade, two guitars, a drummer who hits like a dockworker, and a bass player who owns exactly one pedal and refuses to explain it.",
            "The first EP, Copper Sky (2022), was recorded in that room with one good microphone and sold out of its cassette run at shows. Night Signals (2024) followed — the 2 a.m. record, slower and wider, written in the off-season when the boardwalk empties out and the town belongs to the people who stay. Static & Gold (2026), cut live to tape in six days, is the loud one: the record the van was tuned for.",
            "The band has shared stages across the Northeast and Midwest, played Sea.Hear.Now on their home beach, and built the kind of live reputation that doesn't compress well into a sentence — you had to be there, and increasingly, everyone was. The first UK dates arrive in early 2027.",
        ],
    },
    photos: [
        {
            display: image("press-01", 1024, 1536, "The Overtones — approved press photo, portrait"),
            downloadHref: "/band/press/overtones-press-01.jpg",
            downloadLabel: "Portrait · JPG · 1024×1536",
            credit: "Photo: Dana Whitfield",
        },
        {
            display: image("press-02", 1536, 1024, "The Overtones — approved press photo, on stage"),
            downloadHref: "/band/press/overtones-press-02.jpg",
            downloadLabel: "Live · JPG · 1536×1024",
            credit: "Photo: Dana Whitfield",
        },
        {
            display: image("portrait", 1024, 1536, "The Overtones — approved press photo, exterior"),
            downloadHref: "/band/press/overtones-press-03.jpg",
            downloadLabel: "Exterior · JPG · 1024×1536",
            credit: "Photo: Marcus Lee",
        },
    ] satisfies PressPhoto[],
    logos: [
        {
            label: "Wordmark — ink on transparent",
            downloadHref: "/band/press/overtones-logo-black.png",
            downloadLabel: "PNG · 1435×830",
            /** Which tile ground shows the mark honestly. */
            onDark: false,
        },
        {
            label: "Wordmark — bone on transparent",
            downloadHref: "/band/press/overtones-logo-white.png",
            downloadLabel: "PNG · 1435×830",
            onDark: true,
        },
    ],
    stage: {
        lineup: [
            "June Calder — vocals, guitar",
            "Ray Okafor — lead guitar, vocals",
            "Petra Lindqvist — bass",
            "Sam Torres — drums",
        ],
        specs: [
            { label: "Set length", value: "45–90 minutes" },
            { label: "Inputs", value: "12 channels — stage plot on request" },
            { label: "Vocal mics", value: "3 × dynamic, center / SR / DR" },
            { label: "Backline", value: "Drums and bass rig preferred for fly dates" },
            { label: "Monitors", value: "4 wedges minimum, drum fill appreciated" },
            { label: "Power", value: "4 × 20A circuits stage-side" },
        ],
    },
    contacts: [
        { role: "Management", name: "Harriet Vane", email: "mgmt@theovertones.example" },
        {
            role: "Booking — North America",
            name: "Coastal Talent Group",
            email: "booking@theovertones.example",
        },
        { role: "Press", name: "Loud & Clear PR", email: "press@theovertones.example" },
    ],
}
