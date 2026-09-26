/**
 * The gala-disco remix's content seed (packs/README.md "Derived
 * templates"): a milestone birthday thrown like a 1970s disco supper club,
 * worn over the gala pack. At compose time this file is copied
 * byte-for-byte over `View/Gala/content.ts`, so it must remain a
 * STRUCTURAL TWIN of that module — the same export surface, the same
 * shapes, the contract's minimums met (tests/View/Gala/discoRemixSeed.test.ts
 * pins the twin).
 *
 * The evening: the running order, the floor show, the dress code, getting
 * there, the decades wall, the song requests, and the RSVP ask. The demo
 * night is a sixtieth in Miami, but the slots fit any big night: a
 * milestone birthday, an anniversary, a retirement party, a foundation
 * gala. The guest of honor's name (`event.name`) makes the hero the
 * invitation card itself — the particulars ride its strip, so the base
 * pack's separate invitation card, toast photograph, and after-party
 * stay empty here.
 *
 * The countdown is data (`event.dateIso`); the labels the site renders
 * from it ("50 days to go", "Tonight's the night") are computed per render
 * by the clock engine (`countdown.ts`) — change the date here and the hero
 * badge and the RSVP nudge follow.
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/gala-disco` (see PACK.md). Never point a slot at a raw
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
        src: `/gala-disco/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/gala-disco/${name}-${step}w.webp`, width: step })),
    }
}

export const event = {
    /** The guest of honor, set in script over the headline. */
    name: "Vivienne",
    /** The small tracked word under her name. */
    nameNote: "turns",
    /** The masthead and the page title: what the night is called. */
    title: "Vivienne Turns Sixty",
    /** The hero line; the line break is the hero's (the number, then the rest sung). */
    headline: "Sixty\nlooks good on me.",
    /** The line under it — the invitation's promise. */
    subtitle:
        "A 1970s disco supper-club celebration of friendship, flavor, and fabulousness. Darling, we're just getting started.",
    /** Who the invitation is from. */
    host: "Rafael, Simone & Julian",
    /** ISO date the clock engine counts toward. */
    dateIso: "2027-10-16",
    /** The date as the invitation says it. */
    dateLabel: "Saturday, October 16, 2027",
    /** The date as the hero strip prints it. */
    dateShort: "Saturday, October 16",
    /** When the doors open, as the strip prints it. */
    timeLabel: "Cocktails at nine",
    /** The dress code in two words — the strip's last cell. */
    dressLabel: "Dress: dazzle",
    /** The round badge on the hero (first line, then the rest). */
    seal: "Dancing\ntill late",
    venueShort: "The Starlight Room, Miami",
    /** Reaching the hosts (questions the details don't answer). */
    email: "vivienne.turns.sixty@example.com",
    heroImage: photo(
        "hero",
        2400,
        1350,
        "Vivienne, silver-haired and laughing in a red sequin gown, raising a martini under a mirror ball as friends in sequins and gold dance behind her",
    ),
}

export interface ProgramItem {
    /** "9:00 PM" — the program renders time and title together. */
    time: string
    title: string
    description: string
}

// Typed by annotation (not `satisfies` on the arrays): the workspace
// content service edits collection slots by walking this module's AST, and
// a `satisfies` expression between a slot path and its array literal makes
// the collection read-only in the Content panel.
export const program: {
    headline: string
    intro: string
    items: ProgramItem[]
} = {
    headline: "The night, in order",
    intro: "Loosely enforced, except the toasts. Nobody misses the toasts.",
    items: [
        {
            time: "9:00 PM",
            title: "Cocktails at nine",
            description:
                "Martinis, dirty and dry, at the mirrored bar — plus a champagne cart that circulates like a good rumor. Say hello to Vivienne before she's on the floor.",
        },
        {
            time: "10:00 PM",
            title: "Supper in the banquettes",
            description:
                "A long, lazy Cuban-Creole supper: croquetas, stone crab, ropa vieja, key lime everything. Family style, red leather, candlelight.",
        },
        {
            time: "11:00 PM",
            title: "Toasts",
            description:
                "Three of them, timed. Rafael goes first, the kids go second, and the best friend since 1979 gets the last word, as is tradition.",
        },
        {
            time: "11:30 PM",
            title: "The band takes the stage",
            description:
                "The Starlight Orchestra: horns, strings, three singers, and every song Vivienne ever roller-skated to. Shoes optional after the second set.",
        },
        {
            time: "12:00 AM",
            title: "The midnight surprise",
            description:
                "Our lips are sealed. Be on the dance floor when the lights go down. That's all we'll say.",
        },
    ],
}

export interface ProgramFeature {
    title: string
    body: string
    image: SiteImage
}

/** The two things the night is built around, with their photographs. */
export const entertainment: {
    headline: string
    items: ProgramFeature[]
} = {
    headline: "The floor show",
    items: [
        {
            title: "The Starlight Orchestra",
            body: "Twelve pieces, three singers, one silver jumpsuit. They play the seventies like they invented them — Chic, Donna, Diana, Earth, Wind & Fire — until the room gives out.",
            image: photo(
                "band",
                1600,
                1200,
                "A disco band on a glittering stage, a singer in a silver sequin jumpsuit fronting a horn section in burgundy suits",
            ),
        },
        {
            title: "The midnight surprise",
            body: "Something arrives at midnight. It may be on fire. It is definitely not a speech.",
            image: photo(
                "midnight",
                1600,
                1200,
                "Waiters in white jackets carrying a towering red cake crowned with sparklers through a crowd under a mirror ball",
            ),
        },
    ],
}

export interface Swatch {
    name: string
    /** The chip's flat color, `#rrggbb`. */
    color: string
    /** A few words on the chip, like a paint code. */
    code: string
    note: string
}

export const dressCode: {
    headline: string
    swatches: Swatch[]
} = {
    headline: "Dazzle. Then one notch louder.",
    swatches: [
        {
            name: "Lacquer red sequins",
            color: "#c8102e",
            code: "The birthday girl",
            note: "Vivienne's color. You may match; you may not outshine.",
        },
        {
            name: "Gold lamé",
            color: "#c9a14a",
            code: "Liquid gold",
            note: "Jumpsuits, slip dresses, a jacket that catches the ball.",
        },
        {
            name: "Black velvet",
            color: "#161013",
            code: "Midnight",
            note: "The tuxedo, reconsidered. Wide lapels encouraged.",
        },
        {
            name: "Hot pink satin",
            color: "#e8337f",
            code: "After hours",
            note: "For the brave, the bold, and anyone born under Leo.",
        },
    ],
}

export interface DetailItem {
    title: string
    body: string
}

export const details: {
    headline: string
    items: DetailItem[]
} = {
    headline: "Before you go",
    items: [
        {
            title: "Rides & valet",
            body: "Valet at the door on Biscayne. Better: take a car and leave the keys at home — martinis are strong and the night is long.",
        },
        {
            title: "Flying in",
            body: "MIA is twenty minutes away, FLL forty. October in Miami is warm and humid: pack for dancing, not for sightseeing.",
        },
        {
            title: "Gifts",
            body: "Nothing, please. Bring a story about Vivienne she'd rather you didn't tell — there's a jar for them by the bar.",
        },
    ],
}

export const venue = {
    name: "The Starlight Room",
    role: "The supper club, upstairs",
    address: "7200 Biscayne Boulevard, Miami, FL 33138",
    description:
        "Red leather banquettes, a sunken dance floor, and the original 1972 mirror ball, rewired and turning. Take the elevator up; follow the music.",
    image: photo(
        "venue",
        2400,
        1350,
        "An empty 1970s supper club lit red and pink, curved leather banquettes around a mirrored dance floor under a disco ball",
    ),
    mapUrl: "https://maps.google.com/?q=7200+Biscayne+Boulevard%2C+Miami%2C+FL+33138",
}

export const stay: { title: string; body: string; url: string; image: SiteImage | null } = {
    title: "Stay the weekend: The Coral Palms",
    body: "An Art Deco hotel on Collins Avenue with a neon sign, a pool that stays open late, and a room block under VIVIENNE60 through October 1. Ten minutes from the party; Sunday brunch is on the house.",
    url: "https://example.com/coral-palms",
    image: photo(
        "hotel",
        1600,
        1200,
        "A pastel Art Deco hotel lit in pink neon at night, palm trees and a vintage convertible parked out front",
    ),
}

/** The after-party beside the venue — none here: the supper club is the after-party. */
export const after: { title: string; body: string; image: SiteImage | null } = {
    title: "",
    body: "",
    image: null,
}

/** The evening's detail photograph between the program and the fine print — none here. */
export const toastImage: SiteImage | null = null

export interface DecadePhoto {
    image: SiteImage
    caption: string
}

export const decades: {
    headline: string
    photos: DecadePhoto[]
} = {
    headline: "Vivienne through the decades",
    photos: [
        {
            image: photo(
                "decade-60s",
                1024,
                1024,
                "A little girl in a red party dress laughing and clapping over a birthday cake in a 1960s kitchen",
            ),
            caption: "1970 — Three candles, red dress. Some things never change.",
        },
        {
            image: photo(
                "decade-70s",
                864,
                1152,
                "A teenage girl in a red satin jacket and flared jeans roller-skating across a glittering rink",
            ),
            caption: "1980 — Queen of the roller rink on Flagler Street.",
        },
        {
            image: photo(
                "decade-80s",
                864,
                1152,
                "A young woman in a hot pink dress with big shoulders dancing with friends at a house party",
            ),
            caption: "1988 — Twenty-one, pink, and absolutely not going home yet.",
        },
        {
            image: photo(
                "decade-90s",
                864,
                1152,
                "A woman in a gold slip dress laughing with a champagne glass under falling confetti",
            ),
            caption: "1998 — The gold dress. The legend began here.",
        },
        {
            image: photo(
                "decade-10s",
                864,
                1152,
                "Vivienne with a silver afro in green velvet, dancing and laughing with her silver-haired husband Rafael",
            ),
            caption: "2017 — Fifty, with Rafael, still closing the dance floor.",
        },
    ],
}

export interface SongRequest {
    song: string
    note: string
}

export const songs: {
    headline: string
    intro: string
    requests: SongRequest[]
} = {
    headline: "Requests, darling",
    intro: "Requested on the RSVP cards",
    requests: [
        {
            song: "“Love Hangover” — Diana Ross",
            note: "Vivienne's own request. She will be first on the floor; do not get in her way.",
        },
        {
            song: "“September” — Earth, Wind & Fire",
            note: "Requested by eleven different guests. It's happening.",
        },
        {
            song: "“I'm Coming Out” — Diana Ross",
            note: "Simone, for the entrance. You'll see.",
        },
        {
            song: "“Le Freak” — Chic",
            note: "Rafael, who has been practicing in the garage.",
        },
        {
            song: "“Conga” — Miami Sound Machine",
            note: "It's Miami. There will be a conga line.",
        },
    ],
}

export const rsvp = {
    headline: "Say yes, darling.",
    body: "One reply per invitation, names as they appear on the envelope. Tell us your dinner, your plus-one, and the song that gets you on the floor.",
    /** ISO reply-by date the clock engine counts toward; label as printed. */
    replyByIso: "2027-10-01",
    replyByLabel: "October 1, 2027",
    confirmation:
        "You're on the list — now go find something that sparkles. If plans change, send the card again under the same name and we'll take the newest answer.",
    /** The guest-facing form; delivers through the managed forms pipeline. */
    fields: [
        { name: "name", label: "Your name", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        {
            name: "attending",
            label: "Will you be there?",
            type: "select",
            required: true,
            options: ["Wouldn't miss it", "Sending love from afar"],
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
            label: "Supper",
            type: "select",
            options: ["Everything, family style", "Pescatarian", "Vegetarian"],
            placeholder: "Choose at your leisure",
        },
        {
            name: "song",
            label: "Your song request",
            placeholder: "The band reads every one",
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
            question: "What exactly is “dazzle”?",
            answer: "Sequins, gold, velvet, satin — anything that throws light back at the mirror ball. A tuxedo with a shiny lapel counts. So does a very good hat.",
        },
        {
            question: "Can I bring a guest?",
            answer: "Your invitation lists the seats we've held, and the reply card won't let you exceed it — the room is small and the banquettes are smaller. If something's changed, write to us.",
        },
        {
            question: "Is it adults only?",
            answer: "It is. It's late, it's loud, and the martinis are strong. Grandkids get their own cake at Sunday brunch.",
        },
        {
            question: "How late is late?",
            answer: "The band plays until two; the DJ plays until Vivienne sits down, which historically has not happened.",
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
    finalCtaTitle: "The mirror ball is waiting.",
    /** The running order's kicker. */
    programKicker: "The night",
    /** The venue band's kicker. */
    venueKicker: "Getting there",
    /** The RSVP page's form heading. */
    rsvpFormTitle: "Your name on the list",
    /** The RSVP page's questions heading. */
    faqTitle: "Before you ask, darling",
}

/**
 * The nav's links into the home scroll (LandingRenderer ids sections by
 * type): on-page from home, back to home from the RSVP page. With anchors
 * the nav splits the name from its links; without, it centers the name.
 */
export const homeAnchors: { label: string; anchor: string }[] = [
    { label: "The night", anchor: "steps" },
    { label: "Getting there", anchor: "highlights" },
    { label: "Dress code", anchor: "showcase" },
]

/** The home's composition — see `home`. */
export type HomeLayout = "program" | "stack"

/** One frame of the `stack` home: the photograph and the line on its band ("" for none). */
export interface StackFrame {
    image: SiteImage
    caption: string
}

/** One page of the `stack` home's memory book: what a guest wrote, and who. */
export interface Memory {
    note: string
    name: string
}

/**
 * The home's composition: the disco night is the `program` home, so the
 * `stack` home's band, frames, memory book, and closing stay empty.
 */
export const home: {
    layout: HomeLayout
    bandTitle: string
    band: string[]
    stack: StackFrame[]
    /** The memory book's heading ("A book of memories"). */
    memoriesKicker: string
    memories: Memory[]
    /** The line over the RSVP link at the foot of the `stack` home. */
    closing: string
    /** The RSVP link's label there ("" uses `landingCopy.rsvpCtaLabel`). */
    closingCta: string
} = {
    layout: "program",
    bandTitle: "",
    band: [],
    stack: [],
    memoriesKicker: "",
    memories: [],
    closing: "",
    closingCta: "",
}
