import type { MarketingAccentPlacement, MarketingIconName } from "@ui"

/**
 * The shapes of the care pack's page-copy exports (content.ts and every
 * remix seed that composes over it). Types only: a seed replaces
 * content.ts byte-for-byte, so the shapes live here where both sides can
 * import them without the seed importing itself.
 *
 * Each optional block is content-gated — careLanding emits its section
 * only when the seed fills it — so a remix picks its home page's shape by
 * what it writes, never by a flag.
 */

export interface CarePhoto {
    src: string
    alt: string
    width: number
    height: number
    srcSet: { src: string; width: number }[]
}

/**
 * One hero directory entry. `path` makes it a link: site-relative ("/book",
 * joined to the pack's base path) or an on-page anchor ("#fees").
 */
export interface CareDirectoryItem {
    label: string
    note?: string
    icon?: MarketingIconName
    path?: string
}

/** The hero's facts list (the kernel hero's `directory` aside). */
export interface CareDirectory {
    title?: string
    lines?: string[]
    items: CareDirectoryItem[]
}

export interface CareHome {
    headline: string
    /**
     * Where the headline's accent lands; the register's clinic default is
     * none. `last-line` sets everything after the "\n" as the accent line.
     */
    accent?: MarketingAccentPlacement
    subheadline: string
    /**
     * `full-bleed`: the photograph is the hero (full-bleed-media), copy
     * over it. Unset keeps the split hero beside its art.
     */
    layout?: "split" | "full-bleed"
    hero: CarePhoto
    /**
     * Wear the computed open/closed badge as the live status pill (a
     * pulsing dot, sentence case). Unset keeps the register's tracked-caps
     * badge — the same computed text either way.
     */
    liveBadge?: boolean
    /** Tracked-caps credit under the asks ("Direct primary care · South Philadelphia"). */
    credit?: string
    /** Roundel on the hero art ("\n" splits the small top line from the rest). */
    seal?: string
    /** A line hung under the hero art ("\n" breaks it). */
    caption?: string
    directory?: CareDirectory
    /** Before/after pairs straight under the hero (see CareProgress). */
    progress?: CareProgress
    /**
     * The patient's path as a rail under the hero (see CareHomeJourney).
     * Not the module's `journey` export (CareJourney), which runs after the
     * home bands; a seed fills one or the other — both emit the `journey`
     * section.
     */
    journey?: CareHomeJourney
    /** Set, the home is the `stack` home (see `CareStack`); unset keeps the clinic home. */
    stack?: CareStack
}

/**
 * Treatment results as before/after pairs (gallery before-after). Each
 * pair must be the same person in the same framing — the divider drags
 * across one face, not two photographs.
 */
export interface CareProgress {
    kicker: string
    title: string
    items: {
        caption: string
        before: CarePhoto
        after: CarePhoto
        /** The chips' words ("Month 0" / "Month 14"); default Before / After. */
        beforeLabel?: string
        afterLabel?: string
    }[]
}

/**
 * The visit or treatment path left to right (steps horizontal-rail): an
 * `icon` sets a pictogram on the line, an `image` hangs a plate under it.
 */
export interface CareHomeJourney {
    kicker?: string
    title?: string
    steps: {
        title: string
        description: string
        label?: string
        icon?: MarketingIconName
        image?: CarePhoto
    }[]
}

/**
 * Outcomes as a report (stats `bars`): what is measured and where it is
 * reported, one row per band (label, value — the bar is drawn from the
 * value's number), the small print, and a note tag. Numbers a reader
 * could mistake for the practice's published rates ship with the note
 * set ("Sample data …") until the owner replaces them.
 */
export interface CareStackReport {
    kicker: string
    intro: string
    rows: { label: string; value: string }[]
    footnote: string
    note: string
}

/** One frame of the `stack` home: the photograph and the line on its band ("" for none). */
export interface CareStackFrame {
    image: CarePhoto
    caption: string
}

/**
 * The `stack` home, for registers built for the full-bleed stack
 * (`framestack`): the hero photograph with the headline over it and no
 * ask of its own, one band line, the frames edge to edge at one size, and
 * the closing line over the booking link. The providers, services,
 * coverage, and booking pages are unchanged; the home drops the clinic
 * sections (they live on those pages).
 */
export interface CareStack {
    band: string
    frames: CareStackFrame[]
    /** The practice's outcomes as a report after the frames (stats `bars`); unset or empty rows, none. */
    report?: CareStackReport
    closing: string
    /** The booking link's label there ("" uses `landingCopy.bookCtaLabel`). */
    closingCta: string
}

/**
 * What the practice promises, as icon rows (feature-grid icon-list). When
 * filled, it stands in for the home page's service grid — the services
 * page keeps the full list.
 */
export interface CarePromises {
    kicker: string
    title: string
    items: { icon: MarketingIconName; title: string; description: string }[]
}

/** A price list (pricing price-list): memberships, fees, self-pay prices. */
export interface CareMenu {
    kicker: string
    title: string
    intro?: string
    groups: {
        heading: string
        items: { name: string; note?: string; price: string; qualifier?: string }[]
    }[]
    footnote?: string
}

/**
 * Photograph-led items on the home page. `plates` (the default) prints
 * them as labeled plates (showcase card-grid, `meta` as the eyebrow);
 * `notes` as short essays (showcase stories, `meta` as the byline that
 * opens the text); `directory` as a filterable roster of the practice's
 * providers (showcase filterable-grid). A directory's cards are the
 * resolved providers themselves — name, photo, credentials and role as
 * the eyebrow, `tags` as the filter chips — so a Manage edit repaints
 * them; `extras` adds each card's blurb by providerId, and `items` stays
 * empty. The directory is the practice's people, so the home page drops
 * its portraits band for it. When filled, exhibits stand in for the home
 * page's service grid, like `promises`.
 */
export interface CareExhibits {
    kicker: string
    title: string
    layout?: "plates" | "notes" | "directory"
    items: {
        title: string
        /** The small label over the title; "" drops it (the card grid). */
        meta: string
        description: string
        image: CarePhoto
        tags?: string
        /** A line icon set above the title (the stage's emblem). */
        icon?: MarketingIconName
        /** A short list under the description, a few words each. */
        points?: string[]
    }[]
    extras: { providerId: string; description: string }[]
}

/**
 * A sample document the spotlight shows in its photograph's place (the
 * content-split `report` card): what the practice hands a patient,
 * specimen-set. `summary` is the paragraph under the title; each row is a
 * labeled finding; `stamp` is set askew over the rows ("Sample"). Empty
 * (`title: ""`) keeps the photograph.
 */
export interface CareReport {
    label: string
    title: string
    summary: string
    rows: { label: string; value: string }[]
    signature: string
    stamp: string
}

/**
 * One story on the home page (content-split): photograph-led, or — with
 * a filled `report` — the report card beside the story, its `bullets`
 * the annotations. A report is the practice's evidence, so it leads the
 * home page ahead of the journey instead of following the prices.
 */
export interface CareSpotlight {
    kicker: string
    headline: string
    body: string
    bullets: string[]
    image: CarePhoto
    report: CareReport
    /** Site-relative ("/new-patients") — joined to the pack's base path. */
    cta?: { label: string; path: string }
}

/**
 * What becoming a patient looks like over time, as steps. `timeline` runs
 * them down a line (photographic once any step has an image), `rail` left
 * to right on one track, `cards` as numbered cards. `label` is the step's
 * mark ("Week 1", "Day 90"). When filled, it stands in for the home
 * page's service grid, like `promises`.
 */
export interface CareJourney {
    kicker: string
    title: string
    layout?: "timeline" | "rail" | "cards"
    steps: { label?: string; title: string; description: string; image?: CarePhoto }[]
}

export interface CareFaq {
    kicker: string
    title: string
    items: { question: string; answer: string }[]
}
