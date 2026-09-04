/**
 * The gala pack's single content file: the evening, the program, the
 * details, the venue, and the RSVP ask. Everything the site renders comes
 * from here — edit this file (not the page components) to make the site
 * yours. The demo evening is a black-tie sixtieth on New Year's Eve, but
 * the slots fit any formal night: a milestone birthday, an anniversary, a
 * foundation gala, a New Year's wedding.
 *
 * The countdown is data (`event.dateIso`); the labels the site renders
 * from it ("126 days to go", "Tonight's the night") are computed per
 * render by the clock engine (`countdown.ts`) — change the date here and
 * the hero badge and the RSVP nudge follow.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/gala` (see PACK.md). Never point a slot at a raw
 * camera file.
 */

import type { MarketingLeadFormField } from "@ui"

export interface SiteImage {
    src: string
    alt: string
    width: number
    height: number
    srcSet: { src: string; width: number }[]
}

/** The width ladder `npm run image -- responsive` emits by default. */
const LADDER = [640, 1024, 1600, 2400]

/** A responsive-verb image entry from its name and intrinsic size. */
function photo(name: string, width: number, height: number, alt: string): SiteImage {
    const widths = [...new Set(LADDER.map((step) => Math.min(step, width)))]
    return {
        src: `/gala/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/gala/${name}-${step}w.webp`, width: step })),
    }
}

export const event = {
    /** The masthead: what the night is called. */
    title: "Vivienne turns sixty.",
    /** The line under it — who's asking, and how formally. */
    subtitle:
        "A black-tie evening of dinner, dancing, and one very good toast — New Year's Eve at The Aldridge.",
    /** Who the invitation is from. */
    host: "The Marlowe family",
    /** ISO date the clock engine counts toward. */
    dateIso: "2026-12-31",
    /** The date as the invitation says it. */
    dateLabel: "Thursday, December 31, 2026",
    /** The evening's span, printed beside the date. */
    timeLabel: "Seven o'clock until well past midnight",
    venueShort: "The Aldridge Hotel · New York",
    /** Reaching the hosts (questions the details don't answer). */
    email: "rsvp.vivienne60@example.com",
    heroImage: photo(
        "hero",
        1536,
        1024,
        "A grand hotel ballroom at night set for a black-tie gala, crystal chandeliers over black-linen tables and a parquet dance floor",
    ),
}

export interface ProgramItem {
    /** "7:00 PM" — the program renders time and title together. */
    time: string
    title: string
    description: string
}

export const program = {
    headline: "The order of the evening",
    intro: "Loosely enforced, except the toast. Nobody misses the toast.",
    items: [
        {
            time: "7:00 PM",
            title: "Champagne on arrival",
            description:
                "Coupes at the door and the coat check inside — come up the Fifth Avenue steps and follow the music. The champagne tower is structural until 7:40 and sculptural after.",
        },
        {
            time: "8:00 PM",
            title: "Dinner in the grand ballroom",
            description:
                "Four courses under the chandeliers. Place cards at the door; the kitchen can turn any course vegetarian if your reply said so.",
        },
        {
            time: "10:00 PM",
            title: "The toast",
            description:
                "One speech, by contract, delivered by whichever of Vivienne's children wins the coin flip. Glasses charged by 9:55, please.",
        },
        {
            time: "10:15 PM",
            title: "Dancing",
            description:
                "A twelve-piece band until half past midnight — they open with the song from the wedding, and yes, she knows you know the words.",
        },
        {
            time: "11:55 PM",
            title: "Midnight",
            description:
                "Sixty years and a new one, counted down together. Confetti falls, the band does what bands do, and January begins properly.",
        },
    ] satisfies ProgramItem[],
}

export interface DetailItem {
    title: string
    body: string
}

export const details = {
    headline: "The fine print, finely set",
    items: [
        {
            title: "Dress",
            body: "Black tie — tuxedos, evening gowns, and the jewelry that never leaves the safe. If in doubt, overdress; Vivienne will.",
        },
        {
            title: "Gifts",
            body: "None, truly. Your presence, a full glass, and one story about Vivienne she'd rather you didn't tell — that's the registry.",
        },
        {
            title: "Getting there",
            body: "The Aldridge sits on Fifth at 61st. Valet at the door, or the N/R/W to Fifth Avenue–59th. Snow is likely; the doormen have umbrellas and opinions.",
        },
        {
            title: "Staying over",
            body: "A small block of rooms is held under MARLOWE through December 1 — mention it when booking and stay for the New Year's Day breakfast.",
        },
    ] satisfies DetailItem[],
}

export const venue = {
    name: "The Aldridge Hotel",
    role: "The grand ballroom, second floor",
    address: "781 Fifth Avenue, New York, NY 10022",
    description:
        "The 1926 ballroom with its coffered ceiling and original chandeliers — the room New York keeps for exactly this kind of night. Doors from the marble landing; the elevators know the way.",
    image: photo(
        "venue",
        1536,
        1024,
        "The limestone facade and glowing marquee entrance of a grand 1920s hotel at night in light snow",
    ),
    mapUrl: "https://maps.google.com/?q=781+Fifth+Avenue%2C+New+York%2C+NY+10022",
}

export const after = {
    title: "The after-party",
    body: "When the ballroom closes, the rooftop opens: the Aldridge's bar on the eighteenth floor is ours from midnight, with the skyline, the last of the champagne, and the band's rhythm section gone acoustic. First light optional.",
    image: photo(
        "after",
        1536,
        1024,
        "An intimate rooftop bar at night with velvet chairs, candles, and a glittering city skyline beyond the glass",
    ),
}

/** The evening's detail photograph — the champagne tower, mid-pour. */
export const toastImage = photo(
    "toast",
    1024,
    1536,
    "A champagne coupe tower mid-pour by candlelight, chandelier bokeh behind",
)

export const rsvp = {
    headline: "Say you'll be there.",
    body: "One reply per invitation, names as they appear on the envelope — the seating chart is already a work of diplomacy.",
    /** ISO reply-by date the clock engine counts toward; label as printed. */
    replyByIso: "2026-12-01",
    replyByLabel: "December 1, 2026",
    confirmation:
        "Received, with pleasure — you're on the list. If plans change, submit again under the same name and we'll take the newest answer.",
    /** The guest-facing form; delivers through the managed forms pipeline. */
    fields: [
        { name: "name", label: "Your full name", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        {
            name: "attending",
            label: "Will you join us?",
            type: "select",
            required: true,
            options: ["Delighted to attend", "Regretfully declines"],
        },
        {
            name: "guests",
            label: "Seats on your invitation",
            type: "select",
            required: true,
            options: ["1", "2"],
        },
        {
            name: "dinner",
            label: "Dinner preference",
            type: "select",
            options: ["Beef Wellington", "Dover sole", "Winter vegetable pithivier (vegetarian)"],
            placeholder: "Choose at your leisure",
        },
        {
            name: "notes",
            label: "Allergies, or a story for the toast",
            type: "textarea",
            fullWidth: true,
        },
    ] satisfies MarketingLeadFormField[],
    faqs: [
        {
            question: "Is it really black tie?",
            answer: "Really. It's the one night a year the tuxedo earns its closet space, and Vivienne has waited sixty years to see the room dressed properly. Rentals count; effort is the dress code.",
        },
        {
            question: "Can I bring a guest?",
            answer: "Your invitation lists the seats we've held — the reply form won't let you exceed it, and the ballroom genuinely can't. If circumstances have changed, write to us; we're kinder than the fire marshal.",
        },
        {
            question: "What about midnight and getting home?",
            answer: "Cars are easy on Fifth Avenue even on New Year's — the doormen will marshal them. Better: take a room from the MARLOWE block and let the elevator be your ride home.",
        },
        {
            question: "Will there be speeches?",
            answer: "One. It's in the program with a start time, which is how we keep it at one.",
        },
    ],
}

/**
 * Landing copy the host owns: the few strings the landing modules render
 * that would read wrong for a different evening. A remix seed retrades
 * these along with the rest of the content — everything else in the
 * landing modules is event-neutral on purpose.
 */
export const landingCopy = {
    /** The one ask, everywhere: the shell's nav CTA and the closing banner. */
    rsvpCtaLabel: "RSVP",
    /** The closing banner's title. */
    finalCtaTitle: "The chandeliers are counting on you.",
}
