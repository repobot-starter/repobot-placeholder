/**
 * The dj pack's single content file: PULSEWIDTH — the alias, the mixes,
 * the dates, the booking ask. Everything the site renders comes from
 * here; edit this file (never the page components) to make it yours.
 *
 * Set dates are plain ISO dates: the pages split them upcoming/past at
 * render time (View/Music/schedule.ts) and compute the "Tonight — City"
 * badge on show days. Mixes play bundled ORIGINAL demo loops through the
 * native waveform player; paste a SoundCloud / Mixcloud / Spotify link
 * into a mix's `embedUrl` and its player swaps to a click-to-load embed
 * of the real recording behind the same frame.
 */

import type { PlayableTrack, TrackImage } from "../Music/AudioPlayer"
import type { ShowDate } from "../Music/schedule"
import { DEMO_LOOPS } from "../Music/demoLoops.gen"

export interface DjImage extends TrackImage {
    srcSet: { src: string; width: number }[]
}

/** The width ladder `npm run image -- responsive` emits (capped at each
 * original's own width). */
function image(name: string, width: number, height: number, alt: string): DjImage {
    const widths = [...new Set([640, 1024, 1536].map((step) => Math.min(step, width)))]
    return {
        src: `/dj/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/dj/${name}-${step}w.webp`, width: step })),
    }
}

export const artist = {
    alias: "PULSEWIDTH",
    tagline: "Techno / electro",
    location: "Berlin",
    email: "bookings@pulsewidth.example",
    /** The mix series' label line, worn as mono microcopy on the shelf. */
    series: "KONTAKT series",
}

export const home = {
    headline: "PULSEWIDTH",
    subheadline:
        "Techno and electro built from square waves and room tone. Four-deck sets, no laptop theatrics, records that still smell like the pressing plant.",
    about: {
        kicker: "Profile",
        title: "Signal first, spectacle never",
        paragraphs: [
            "PULSEWIDTH has spent a decade in the low end: residencies in concrete rooms, a mix series that treats track IDs as a courtesy rather than a secret, and a booth manner best described as punctual.",
            "Sets run from 120 BPM dub weight to 130 BPM electro, read the room before the record bag, and end precisely when the contract says — or eight hours later, if the room insists.",
        ],
    },
}

export const heroImages = {
    booth: image(
        "hero",
        1536,
        1024,
        "PULSEWIDTH in the booth, hands on the mixer under a single strip light",
    ),
    club: image("club", 1536, 1024, "A concrete club room in haze, one white strobe frozen mid-flash"),
    portrait: image("portrait", 1024, 1536, "PULSEWIDTH portrait in an empty stairwell, high contrast"),
}

/* ----------------------------------- Sets ----------------------------------- */

/** Every set booked, any order — the site sorts and splits by date at
 * render time. Links are external (RA pages, venue tickets). */
export const sets: ShowDate[] = [
    {
        date: "2026-09-05",
        city: "Berlin",
        region: "DE",
        venue: "Verk",
        ticketUrl: "https://tickets.example/pulsewidth/verk-sep",
        note: "Open to close",
    },
    {
        date: "2026-09-26",
        city: "Hamburg",
        region: "DE",
        venue: "Halle Nord",
        ticketUrl: "https://tickets.example/pulsewidth/halle-nord",
    },
    {
        date: "2026-10-09",
        city: "Amsterdam",
        region: "NL",
        venue: "Mira",
        ticketUrl: "https://tickets.example/pulsewidth/mira",
        note: "Festival week",
    },
    {
        date: "2026-10-31",
        city: "Essen",
        region: "DE",
        venue: "Schacht 9",
        ticketUrl: "https://tickets.example/pulsewidth/schacht-9",
    },
    {
        date: "2026-11-21",
        city: "Prague",
        region: "CZ",
        venue: "Ankra",
        ticketUrl: "https://tickets.example/pulsewidth/ankra",
    },
    {
        date: "2026-12-31",
        city: "Berlin",
        region: "DE",
        venue: "Verk",
        ticketUrl: "https://tickets.example/pulsewidth/verk-nye",
        note: "All night long",
    },
    // The archive writes itself.
    { date: "2026-07-11", city: "Tbilisi", region: "GE", venue: "Bunkeri" },
    { date: "2026-06-20", city: "Warsaw", region: "PL", venue: "Stroboskop Hala" },
    { date: "2026-05-01", city: "Berlin", region: "DE", venue: "Verk", note: "May Day" },
    { date: "2025-12-31", city: "Berlin", region: "DE", venue: "Verk", note: "All night long" },
    { date: "2025-10-10", city: "London", region: "UK", venue: "The Coal Store" },
]

/* ----------------------------------- Mixes ----------------------------------- */

export interface Mix extends PlayableTrack {
    /** Two-digit shelf index, newest first ("041"). */
    index: string
    style: string
    bpm: number
    notes: string
    cover: DjImage
}

/**
 * The shelf, newest first. Demo mixes play bundled original loops; set an
 * `embedUrl` (SoundCloud / Mixcloud / Spotify) to swap a player to the
 * real recording.
 */
export const mixes: Mix[] = [
    {
        index: "041",
        title: "Volthalle",
        style: "Peak time",
        bpm: 126,
        notes: "Recorded at Verk, closing hour. One riser, no mercy — the room asked for drums and got them.",
        meta: "KONTAKT 041 · 126 BPM",
        audioSrc: "/dj/audio/dj-volthalle.m4a",
        seconds: DEMO_LOOPS["dj-volthalle"].seconds,
        peaks: DEMO_LOOPS["dj-volthalle"].peaks,
        cover: image("mix-01", 1024, 1024, "Volthalle — mix artwork, concrete texture"),
    },
    {
        index: "040",
        title: "Substrat",
        style: "Dub techno",
        bpm: 120,
        notes: "The deep one. Chords on the offbeat, delay doing half the work, patience doing the rest.",
        meta: "KONTAKT 040 · 120 BPM",
        audioSrc: "/dj/audio/dj-substrat.m4a",
        seconds: DEMO_LOOPS["dj-substrat"].seconds,
        peaks: DEMO_LOOPS["dj-substrat"].peaks,
        cover: image("mix-02", 1024, 1024, "Substrat — mix artwork, deep grey field"),
    },
    {
        index: "039",
        title: "Nachtwerk",
        style: "Electro",
        bpm: 130,
        notes: "Broken kicks and an acid line that climbs the whole phrase. For the hour when the floor stops checking phones.",
        meta: "KONTAKT 039 · 130 BPM",
        audioSrc: "/dj/audio/dj-nachtwerk.m4a",
        seconds: DEMO_LOOPS["dj-nachtwerk"].seconds,
        peaks: DEMO_LOOPS["dj-nachtwerk"].peaks,
        cover: image("mix-03", 1024, 1024, "Nachtwerk — mix artwork, strobe-white grid"),
    },
    {
        index: "038",
        title: "Der Ring",
        style: "After hours",
        bpm: 100,
        notes: "Six in the morning as a genre. Heartbeat kick, bells with long echo, the pad tide coming in.",
        meta: "KONTAKT 038 · 100 BPM",
        audioSrc: "/dj/audio/dj-der-ring.m4a",
        seconds: DEMO_LOOPS["dj-der-ring"].seconds,
        peaks: DEMO_LOOPS["dj-der-ring"].peaks,
        cover: image("mix-04", 1024, 1024, "Der Ring — mix artwork, faint circular halo"),
    },
]

/* --------------------------------- Booking --------------------------------- */

export const booking = {
    headline: "Book PULSEWIDTH",
    body: "Club sets, festivals, and the occasional gallery that should know better. Send the essentials — the tech and hospitality rider ships with the confirmation, but tell us up front if the booth has quirks.",
    confirmation: "Received. Expect a reply within two working days, rider attached.",
    fields: [
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email" as const, required: true },
        { name: "date", label: "Date", type: "date" as const, required: true },
        { name: "venue", label: "Venue / club", required: true },
        { name: "city", label: "City", required: true },
        { name: "slot", label: "Set length & slot" },
        {
            name: "tech",
            label: "Tech & booth notes (mixer, monitors, turntables)",
            type: "textarea" as const,
            fullWidth: true,
        },
    ],
}

export const mailingList = {
    kicker: "Transmission",
    title: "The list",
    body: "New mixes and confirmed dates, a few times a year. Nothing else.",
    cta: "Subscribe",
    confirmation: "Subscribed. See you in the dark.",
}
