/**
 * The single pack's content file: one record, one page. Noor Vela —
 * MERIDIAN. Everything the launch page renders comes from here; edit this
 * file (never the page component) to launch your own record.
 *
 * The countdown is computed from `record.releaseDate` at render time
 * (View/Music/schedule.ts): before the date the page counts down in
 * days/hours/minutes under an "Out Friday" label and shows pre-save
 * links; after local midnight on the date it flips to "OUT NOW" and the
 * same slots become listen links. No edits on release day.
 *
 * The title-track excerpt plays through the native waveform player
 * (bundled original audio); set `record.embedUrl` to a streaming link to
 * swap it for a click-to-load embed of the real song.
 */

import type { TrackImage } from "../Music/AudioPlayer"
import { DEMO_LOOPS } from "../Music/demoLoops.gen"

export interface SingleImage extends TrackImage {
    srcSet: { src: string; width: number }[]
}

/** The width ladder `npm run image -- responsive` emits (capped at each
 * original's own width). */
function image(name: string, width: number, height: number, alt: string): SingleImage {
    const widths = [...new Set([640, 1024, 1536].map((step) => Math.min(step, width)))]
    return {
        src: `/single/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/single/${name}-${step}w.webp`, width: step })),
    }
}

export const artist = {
    name: "Noor Vela",
    tagline: "Electronic — night music",
    email: "hello@noorvela.example",
}

export const record = {
    title: "MERIDIAN",
    /** ISO local date — the record is out at local midnight. */
    releaseDate: "2026-10-16",
    format: "LP · 9 tracks",
    label: "Parallel Recordings",
    cover: image("cover", 1024, 1024, "MERIDIAN — album artwork: a thin light line crossing a dark field"),
    /** One line under the title, the record's whole pitch. */
    statement:
        "Nine songs recorded between midnight and first light — pulse, breath, and the thin bright line where a day changes.",
    about: {
        kicker: "About the record",
        title: "Made in the hour nobody owns",
        paragraphs: [
            "MERIDIAN was written in single takes at the end of long nights: a heartbeat pulse, chords that arrive like weather, and Vela's voice used as one instrument among the machines rather than above them.",
            "It was recorded to two-inch tape in a borrowed studio with the lights off, and mixed until the meters agreed with the mood. Play it after dark; it knows what to do.",
        ],
    },
    /** The title-track excerpt for the native player. */
    excerpt: {
        title: "Meridian — title track excerpt",
        meta: "LP · Out soon",
        audioSrc: "/single/audio/meridian-excerpt.m4a",
        seconds: DEMO_LOOPS["single-meridian"].seconds,
        peaks: DEMO_LOOPS["single-meridian"].peaks,
        /** Paste a streaming link here to swap the player to the real song. */
        embedUrl: undefined as string | undefined,
    },
}

/**
 * Pre-save slots before the date; the same slots read "Listen" after.
 *
 * `href` is EMPTY until the record has real store pages: the template ships
 * with no working streaming links, and a placeholder URL would navigate the
 * visitor to a dead page (streaming platforms also refuse to load inside
 * the workspace preview). An empty href renders the slot as a non-navigating
 * platform badge — paste your real Spotify / Apple Music / Bandcamp URLs
 * here and the badges become live links, nothing else to change.
 */
export const listenLinks: { label: string; href: string }[] = [
    { label: "Spotify", href: "" },
    { label: "Apple Music", href: "" },
    { label: "Bandcamp", href: "" },
]

export interface TracklistEntry {
    title: string
    /** "4:12" — display only; the page never parses it. */
    duration: string
}

export const tracklist: TracklistEntry[] = [
    { title: "Meridian", duration: "4:12" },
    { title: "Antiphon", duration: "3:48" },
    { title: "Low Sun", duration: "4:31" },
    { title: "Verglas", duration: "3:22" },
    { title: "Halfway House", duration: "5:04" },
    { title: "Sodium Light", duration: "3:57" },
    { title: "The Divide", duration: "4:44" },
    { title: "Marginalia", duration: "3:16" },
    { title: "Meridian (Reprise)", duration: "6:08" },
]

export const video = {
    title: "Meridian — visual",
    meta: "Official visual · 4:12",
    videoUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    poster: image(
        "video-poster",
        1536,
        1024,
        "A road at night under sodium light — still from the Meridian visual",
    ),
}

export const portrait = image("portrait", 1024, 1536, "Noor Vela, lit by a single window before dawn")

export const mailingList = {
    kicker: "First light",
    title: "Hear it first",
    body: "One email when the record drops, one when the shows go up. That's the whole list.",
    cta: "Notify me",
    confirmation: "Done. You'll hear it before anyone.",
}
