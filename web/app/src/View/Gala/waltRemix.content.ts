/**
 * The gala-walt remix's content seed (packs/README.md "Derived
 * templates"): a seventieth birthday dinner on the harbor lawn, worn over
 * the gala pack. At compose time this file is copied byte-for-byte over
 * `View/Gala/content.ts`, so it must remain a STRUCTURAL TWIN of that
 * module — the same export surface, the same shapes, the contract's
 * minimums met (tests/View/Gala/stackRemixSeeds.test.ts pins the twin).
 *
 * The page is the `stack` home: the dinner photograph with the date line
 * over it, one line asking for a memory, one more photograph, the memory
 * book so far, and the ask. The demo is a family dinner in Edgartown, but
 * the slots fit any milestone that gathers people who go back: a big
 * birthday, an anniversary, a retirement, a reunion supper. The running
 * order, the fine print, and the venue stay filled for the `program`
 * home, and the RSVP page takes each guest's memory for the book.
 *
 * The reply-by date is data (`rsvp.replyByIso`); the nudge the RSVP page
 * prints from it is computed per render by the clock engine
 * (`countdown.ts`).
 *
 * Images: every entry carries intrinsic dimensions and a WebP srcSet,
 * produced by `npm run image -- responsive <original> --out-dir
 * web/app/public/gala-walt` (see PACK.md). Never point a slot at a raw
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
        src: `/gala-walt/${name}-${width}w.webp`,
        alt,
        width,
        height,
        srcSet: widths.map((step) => ({ src: `/gala-walt/${name}-${step}w.webp`, width: step })),
    }
}

export const event = {
    /** The guest of honor, set in script over the headline ("" keeps the masthead hero). */
    name: "",
    /** The small tracked word under his name. */
    nameNote: "",
    /** The page title: what the day is called. */
    title: "Walt at seventy",
    /** The hero line. */
    headline: "Seventy years of Walt.",
    /** The line under it — on the stack home, the date line over the photograph. */
    subtitle: "Saturday, August 7 · Edgartown · dinner at seven",
    /** Who the invitation is from. */
    host: "Nora, Ben, and the whole Callahan table",
    /** ISO date the clock engine counts toward. */
    dateIso: "2027-08-07",
    /** The date as the invitation says it. */
    dateLabel: "Saturday, August 7, 2027",
    /** The date as the invitation hero's strip prints it. */
    dateShort: "Saturday, August 7",
    /** The evening's span, printed beside the date. */
    timeLabel: "Drinks at six thirty, dinner at seven",
    /** The dress code in two words — the footer's last cell. */
    dressLabel: "Summer jackets, flat shoes",
    /** The round badge on the invitation hero ("" for none). */
    seal: "",
    venueShort: "Edgartown · Martha's Vineyard",
    /** Reaching the hosts (questions the details don't answer). */
    email: "walt.at.seventy@example.com",
    heroImage: photo(
        "hero-dinner",
        1152,
        864,
        "The family at a long table on the lawn under lanterns at sunset, Walt laughing with his head thrown back, the harbor behind",
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
    headline: "The evening",
    intro: "Nothing formal. Walt asked for no speeches; he'll get three short ones.",
    items: [
        {
            time: "6:30 PM",
            title: "Drinks on the porch",
            description:
                "Dark and stormies and cold rosé on the porch, with the boats coming in below the lawn.",
        },
        {
            time: "7:00 PM",
            title: "Dinner under the oak",
            description:
                "One long table: striped bass, corn from Morning Glory Farm, and the tomato salad Walt has made every August since 1981.",
        },
        {
            time: "9:00 PM",
            title: "The book, and cake",
            description:
                "We give him the book of memories you sent, read a few out loud, and cut the cake before anyone gets sentimental.",
        },
    ],
}

export interface ProgramFeature {
    title: string
    body: string
    image: SiteImage
}

/** The floor show: what the day is built around, with photographs — none for a dinner at home. */
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

/** The dress code as fabric chips — the footer's two words are enough. */
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
            title: "The book",
            body: "Send a memory with your reply — a line, a story, a photo you'll bring. We're binding them into a book for him, and we'll read a few after dinner.",
        },
        {
            title: "Gifts",
            body: "None, please. Walt says he has everything; the book is the one thing he doesn't.",
        },
        {
            title: "Getting here",
            body: "The ferry from Woods Hole to Vineyard Haven, then twenty minutes by car or the 13 bus. Park on North Water Street; the lawn is at the end of the lane.",
        },
    ],
}

export const venue = {
    name: "The Callahan lawn",
    role: "Edgartown, on the harbor",
    address: "14 Starbuck's Neck Road, Edgartown, MA 02539",
    description:
        "The lawn behind the grey-shingled house Walt has summered in for fifty years, under the old oak, with the harbor at the foot of the grass. If it rains, we move onto the porch and squeeze.",
    image: photo(
        "frame-sail",
        1152,
        864,
        "Walt at the tiller of a small wooden sailboat, laughing as he shows his granddaughter the mainsheet, his grandson grinning at the rail, Edgartown harbor behind",
    ),
    mapUrl: "https://maps.google.com/?q=Edgartown+Harbor%2C+Edgartown%2C+MA+02539",
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

/** A photo wall through the years — the memory book carries them instead. */
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

/** Song requests from the reply cards — none for a dinner. */
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
    headline: "Will you come?",
    body: "Tell us by July 15 so we can set the table. And send a memory for the book — a line is plenty.",
    /** ISO reply-by date the clock engine counts toward; label as printed. */
    replyByIso: "2027-07-15",
    replyByLabel: "July 15, 2027",
    confirmation:
        "Thank you — your place is set. If plans change, send the form again under the same name and we'll take the newest answer.",
    /** The guest-facing form; delivers through the managed forms pipeline. */
    fields: [
        { name: "name", label: "Your name", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        {
            name: "attending",
            label: "Will you come?",
            type: "select",
            required: true,
            options: ["I'll be there", "Sending love from afar"],
        },
        {
            name: "guests",
            label: "Seats",
            type: "select",
            required: true,
            options: ["1", "2", "3", "4"],
        },
        {
            name: "memory",
            label: "A memory for the book",
            type: "textarea",
            fullWidth: true,
        },
        {
            name: "notes",
            label: "Anything we should know (dietary, the ferry you're on)",
            type: "textarea",
            fullWidth: true,
        },
    ] satisfies MarketingLeadFormField[],
    faqs: [
        {
            question: "Does Walt know?",
            answer: "He knows there's a dinner. He doesn't know about the book, so please keep that between us.",
        },
        {
            question: "What should I write?",
            answer: "Anything true: the day he taught you something, the thing he always says, the time he was wrong and said so. One line is plenty; a story is better.",
        },
        {
            question: "Can I bring the kids?",
            answer: "Please. There's a kids' end of the table, and the lawn runs down to the water.",
        },
        {
            question: "Where do I stay?",
            answer: "The Harbor View and the Victorian Inn are both a short walk. Book early; August on the island fills.",
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
    finalCtaTitle: "Add yours when you reply.",
    /** The running order's kicker. */
    programKicker: "The evening",
    /** The venue band's kicker. */
    venueKicker: "The lawn",
    /** The RSVP page's form heading. */
    rsvpFormTitle: "Your reply",
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
 * The home's composition: the `stack` home — the dinner and its date
 * line, the one ask as a band, Walt at the tiller edge to edge, the
 * memory book so far, and the RSVP.
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
    bandTitle: "",
    band: ["Send us a memory — we're making him a book."],
    stack: [
        {
            image: {
                ...photo(
                    "frame-sail",
                    1152,
                    864,
                    "Walt at the tiller of a small wooden sailboat, laughing as he shows his granddaughter the mainsheet, his grandson grinning at the rail, Edgartown harbor behind",
                ),
            },
            caption: "",
        },
    ],
    memoriesKicker: "A book of memories",
    memories: [
        { note: "He taught me to sail, and to say sorry first.", name: "Nora" },
        { note: "Forty years of Thursday poker, and he still can't bluff.", name: "Desmond" },
        { note: "He made room at every table, including mine.", name: "Priya" },
        { note: "The best listener I know.", name: "Julian" },
        { note: "Still fixes everything, and makes you laugh while he does it.", name: "Kofi" },
    ],
    closing: "Add yours when you reply.",
    closingCta: "RSVP by July 15",
}
