/**
 * The gala-otto remix's content seed (packs/README.md "Derived
 * templates"): a first birthday on a blanket in the park, worn over the
 * gala pack. At compose time this file is copied byte-for-byte over
 * `View/Gala/content.ts`, so it must remain a STRUCTURAL TWIN of that
 * module — the same export surface, the same shapes, the contract's
 * minimums met (tests/View/Gala/stackRemixSeeds.test.ts pins the twin).
 *
 * The page is the `stack` home: the photograph with the date line over
 * it, three lines about what to bring, one more photograph, and the ask.
 * The demo is a first birthday picnic in Prospect Park, but the slots fit
 * any small daytime party: a baby shower, a garden birthday, a
 * graduation lunch. The running order, the fine print, and the venue
 * stay filled for the `program` home, and the RSVP page asks the
 * questions a picnic needs answered.
 *
 * The reply-by date is data (`rsvp.replyByIso`); the nudge the RSVP page
 * prints from it is computed per render by the clock engine
 * (`countdown.ts`).
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/gala-otto` (see PACK.md). Never point a slot at a raw
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
        src: `/gala-otto/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/gala-otto/${name}-${step}w.webp`, width: step })),
    }
}

export const event = {
    /** The guest of honor, set in script over the headline ("" keeps the masthead hero). */
    name: "",
    /** The small tracked word under his name. */
    nameNote: "",
    /** The page title: what the day is called. */
    title: "Otto is one.",
    /** The hero line. */
    headline: "Otto is one.",
    /** The line under it — on the stack home, the date line over the photograph. */
    subtitle: "Sunday, May 16 · 3 pm · Prospect Park, by the boathouse",
    /** Who the invitation is from. */
    host: "Maya and Theo Ferrante",
    /** ISO date the clock engine counts toward. */
    dateIso: "2027-05-16",
    /** The date as the invitation says it. */
    dateLabel: "Sunday, May 16, 2027",
    /** The date as the invitation hero's strip prints it. */
    dateShort: "Sunday, May 16",
    /** The afternoon's span, printed beside the date. */
    timeLabel: "Three o'clock until the cake runs out",
    /** The dress code in two words — the footer's last cell. */
    dressLabel: "Grass stains welcome",
    /** The round badge on the invitation hero ("" for none). */
    seal: "",
    venueShort: "Prospect Park · Brooklyn",
    /** Reaching the hosts (questions the details don't answer). */
    email: "otto.is.one@example.com",
    heroImage: photo(
        "hero-cake",
        1152,
        864,
        "Otto laughing on a striped picnic blanket in the long grass, one hand in his small white birthday cake",
    ),
}

export interface ProgramItem {
    /** "3:00 PM" — the program renders time and title together. */
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
    headline: "The afternoon, roughly",
    intro: "Nap-dependent. Everything moves if he's asleep.",
    items: [
        {
            time: "3:00 PM",
            title: "Blankets down",
            description:
                "We'll be on the lawn between the boathouse and the Lullwater bridge — look for the blue-striped blankets and the stack of books.",
        },
        {
            time: "4:00 PM",
            title: "Cake",
            description:
                "One small cake for Otto to take apart, and a proper one for everyone else. Strawberries from the Saturday market.",
        },
        {
            time: "4:30 PM",
            title: "Books and bubbles",
            description:
                "The books you brought get read out loud, notes and all, while the little ones chase bubbles down the slope.",
        },
    ],
}

export interface ProgramFeature {
    title: string
    body: string
    image: SiteImage
}

/** The floor show: what the day is built around, with photographs — none for a picnic. */
export const entertainment: {
    headline: string
    items: ProgramFeature[]
} = {
    headline: "",
    items: [],
}

export interface Swatch {
    name: string
    /** The chip's flat color, `#rrggbb`. */
    color: string
    /** A few words on the chip, like a paint code. */
    code: string
    note: string
}

/** The dress code as fabric chips — a picnic doesn't have one. */
export const dressCode: {
    headline: string
    swatches: Swatch[]
} = {
    headline: "",
    swatches: [],
}

export interface DetailItem {
    title: string
    body: string
}

export const details: {
    headline: string
    items: DetailItem[]
} = {
    headline: "Good to know",
    items: [
        {
            title: "Bring",
            body: "A blanket, a hat for the little ones, and a book for Otto's shelf with a note inside — something you loved, or something you'd like him to.",
        },
        {
            title: "Gifts",
            body: "None, please. The book is the present, and the note is the part he'll keep.",
        },
        {
            title: "Getting there",
            body: "The B/Q to Prospect Park, then ten minutes along the lake. Strollers are easy on the path; the lawn is flat by the water.",
        },
    ],
}

export const venue = {
    name: "The boathouse lawn",
    role: "Prospect Park, by the Lullwater",
    address: "Prospect Park Boathouse, Brooklyn, NY 11225",
    description:
        "The grass between the boathouse and the water, with shade from the big lindens by four. If it rains, we move under the boathouse arcade and nobody minds.",
    image: photo(
        "frame-picnic",
        1152,
        864,
        "A linen picnic blanket from above: picture books with a handwritten note, strawberries, and a small cake with blue flowers, a toddler's hand reaching for a berry",
    ),
    mapUrl: "https://maps.google.com/?q=Prospect+Park+Boathouse%2C+Brooklyn%2C+NY+11225",
}

/** A hotel block with its own card and booking link ("" title: the details carry it). */
export const stay: { title: string; body: string; url: string; image: SiteImage | null } = {
    title: "",
    body: "",
    url: "",
    image: null,
}

export const after: { title: string; body: string; image: SiteImage | null } = {
    title: "",
    body: "",
    image: null,
}

/** The day's detail photograph — the stack home carries its own frames instead.
 * An object literal (not a bare helper call) whenever it's set: `toastImage`
 * is a top-level media slot the content service edits by matching its
 * named export against a literal. */
export const toastImage: SiteImage | null = null

export interface DecadePhoto {
    image: SiteImage
    caption: string
}

/** A photo wall through the years — one year is short for a wall. */
export const decades: {
    headline: string
    photos: DecadePhoto[]
} = {
    headline: "",
    photos: [],
}

export interface SongRequest {
    song: string
    note: string
}

/** Song requests from the reply cards — none for a picnic. */
export const songs: {
    headline: string
    intro: string
    requests: SongRequest[]
} = {
    headline: "",
    intro: "",
    requests: [],
}

export const rsvp = {
    headline: "Tell us you're coming.",
    body: "So we know how much cake to bake and how many blankets to bring. Little ones count too — they eat the most strawberries.",
    /** ISO reply-by date the clock engine counts toward; label as printed. */
    replyByIso: "2027-05-01",
    replyByLabel: "May 1, 2027",
    confirmation:
        "Got it — see you on the lawn. If plans change, send the form again under the same name and we'll take the newest answer.",
    /** The guest-facing form; delivers through the managed forms pipeline. */
    fields: [
        { name: "name", label: "Your name", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        {
            name: "attending",
            label: "Will you come?",
            type: "select",
            required: true,
            options: ["We'll be there", "Sending love from afar"],
        },
        {
            name: "guests",
            label: "Grown-ups",
            type: "select",
            required: true,
            options: ["1", "2", "3", "4"],
        },
        {
            name: "little-ones",
            label: "Little ones",
            type: "select",
            options: ["0", "1", "2", "3", "4"],
        },
        {
            name: "notes",
            label: "Allergies, or the book you're bringing",
            type: "textarea",
            fullWidth: true,
        },
    ] satisfies MarketingLeadFormField[],
    faqs: [
        {
            question: "What if it rains?",
            answer: "We move under the boathouse arcade, twenty steps away. Same time, same cake, slightly louder.",
        },
        {
            question: "What kind of book?",
            answer: "Any book you'd hand a child you love: a picture book from your own shelf, a favorite you read a hundred times, a new one you think he'll ask for. Write him a note inside — that's the gift.",
        },
        {
            question: "Can we bring older kids?",
            answer: "Please do. There's room to run, a slope for rolling down, and more bubbles than any one-year-old can manage.",
        },
        {
            question: "Is there anywhere to change a diaper?",
            answer: "The boathouse has restrooms with changing tables, and we'll have a basket of spares if you forget.",
        },
    ],
}

/**
 * Landing copy the hosts own: the few strings the landing modules render
 * that would read wrong for a different party. A remix seed retrades
 * these along with the rest of the content — everything else in the
 * landing modules is event-neutral on purpose.
 */
export const landingCopy = {
    /** The one ask, everywhere: the shell's nav CTA and the closing banner. */
    rsvpCtaLabel: "RSVP",
    /** The closing banner's title. */
    finalCtaTitle: "Picnic from three, cake at four.",
    /** The running order's kicker. */
    programKicker: "The afternoon",
    /** The venue band's kicker. */
    venueKicker: "The lawn",
    /** The RSVP page's form heading. */
    rsvpFormTitle: "Who's coming",
    /** The RSVP page's questions heading. */
    faqTitle: "Before you ask",
}

/**
 * The nav's links into the home scroll (LandingRenderer ids sections by
 * type): on-page from home, back to home from the RSVP page. With anchors
 * the nav splits the name from its links; without, it centers the name.
 */
export const homeAnchors: { label: string; anchor: string }[] = []

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
 * The home's composition: the `stack` home — the photograph and its date
 * line, what to bring as a short band (the first line leads), the picnic
 * blanket edge to edge, and the ask. No memory book: at one, the notes
 * go inside the books.
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
    layout: "stack",
    bandTitle: "Bring a blanket.",
    band: ["Bring a book for his shelf, with a note inside.", "Leave the gifts at home."],
    stack: [
        {
            image: {
                ...photo(
                    "frame-picnic",
                    1152,
                    864,
                    "A linen picnic blanket from above: picture books with a handwritten note, strawberries, and a small cake with blue flowers, a toddler's hand reaching for a berry",
                ),
            },
            caption: "",
        },
    ],
    memoriesKicker: "",
    memories: [],
    closing: "Picnic from three, cake at four.",
    closingCta: "Tell us you're coming",
}
