import React from "react"
import { SectionBackdrop, type MarketingBackdrop } from "./MarketingBackdrop"
import { MarketingBrowserFrame } from "./MarketingBrowserFrame"
import { LeadCaptureFields, LeadIntakeCard, type MarketingLeadIntake } from "./MarketingLeadForm"
import {
    marketingHref,
    splitAccentWord,
    type MarketingAccentPlacement,
    type MarketingCta,
    type MarketingMedia,
} from "./marketingContent"
import { MarketingImage, marketingImageProps } from "./MarketingImage"
import { marketingItemStamp, marketingMediaStamp, marketingTextStamp } from "./marketingItemStamp"
import { MarketingArtPanel } from "./MarketingGlyph"
import { MarketingThreadCard, type MarketingThreadMessage } from "./MarketingThreadCard"
import { MarketingIcon, isMarketingIconName } from "./marketingIcons"
import * as styles from "./MarketingHero.styles.css"
import { useHeadlineFit } from "./useHeadlineFit"

export type MarketingHeroVariant =
    | "centered-stack"
    | "split-media"
    | "statement"
    | "form-first"
    | "product-frame"
    | "full-bleed-media"
    | "panel-collage"
    | "masthead-overlay"
    | "front-page"
    | "invitation"
    | "pinboard"

/**
 * `front-page` only: the newspaper furniture around the lead story. Every
 * field is optional — a front page with just a headline and a photograph
 * still reads as one, the furniture sharpens it.
 */
/** One captioned photograph in the `panel-collage` row. */
export interface MarketingHeroPanel {
    media: MarketingMedia
    /** A short caption under the photograph ("Mehndi"). */
    label?: string
}

export interface MarketingHeroEdition {
    /** Left ear of the masthead bar: the date or where the paper is printed ("Friday, May 16"). */
    dateline?: string
    /** Center of the bar, set large: the paper's nameplate ("The Late Edition"). */
    masthead?: string
    /** Right ear of the bar: the edition ("Vol. 7 · Late City Final"). */
    issue?: string
    /** "By L. Pressman" — set beside the deck. */
    byline?: string
    /** Under the byline: "Staff Photographer". */
    bylineRole?: string
    /** The byline's small portrait (the reporter's mug). */
    bylineMedia?: MarketingMedia
    /** The caption line under the lead photograph. */
    caption?: string
    /** The jump at the caption line's end — "Page 3 →". */
    jump?: MarketingCta
}

/**
 * `thread` aside: a short text conversation in a phone card (the
 * customer's-eye view of the service — "on the way", a quote, "approved").
 */
export interface MarketingHeroThreadAside {
    kind: "thread"
    /** Who the conversation is with, e.g. the business name. */
    name: string
    detail?: string
    messages: MarketingThreadMessage[]
}

/** One line of a hero price board: "Drains · $189". */
export interface MarketingHeroPriceBoardItem {
    name: string
    price: string
    /** Small honesty word set before the price ("from"). */
    qualifier?: string
}

/**
 * `price-board` aside: the prices on the hero itself — a short menu board
 * (title, a handful of name/price lines, an optional footnote and ask)
 * standing over the photograph's right side. The sign on the van door,
 * the specials board by the counter.
 */
export interface MarketingHeroPriceBoardAside {
    kind: "price-board"
    title: string
    items: MarketingHeroPriceBoardItem[]
    footnote?: string
    cta?: MarketingCta
}

/** One entry of a hero directory: "$89/mo · Membership, not insurance". */
export interface MarketingHeroDirectoryItem {
    label: string
    /** A short line set after (or under) the label. */
    note?: string
    /** Named icon (see marketingIcons) struck beside the entry. */
    icon?: string
    /** Makes the entry a link (a wall-label catalogue entry, a sign's destination). */
    href?: string
}

/**
 * `directory` aside: the business's few load-bearing facts on the hero
 * itself — a station directory, a record's tracklist, a museum wall
 * label, a sheet of stickers (the register's treatment decides the read).
 * An optional title and plain lines lead a short list of entries. On
 * `split-media` it sits in the copy column between the subheadline and
 * the asks, beside a photograph or not.
 */
export interface MarketingHeroDirectoryAside {
    kind: "directory"
    title?: string
    lines?: string[]
    items: MarketingHeroDirectoryItem[]
}

/**
 * A secondary panel beside the hero's copy. `thread` (split-media without
 * a photograph): the text conversation. `price-board` (full-bleed-media, or
 * split-media without a photograph): the menu board of prices.
 * `directory` (split-media, with or without a photograph): the facts list.
 */
export type MarketingHeroAside =
    MarketingHeroThreadAside | MarketingHeroPriceBoardAside | MarketingHeroDirectoryAside

/**
 * A monumental figure set above the headline — the number the business is
 * named for or argues from ("115°"), with an optional short script note
 * slung under it ("72° inside"). A brand statement, not a live reading.
 */
export interface MarketingHeroReadout {
    value: string
    note?: string
}

/**
 * `invitation` only: one piece on the hero's photo wall. `frames` prints a
 * photo-booth strip (the frames top to bottom, in an ink border) and wins
 * over `media`, a single print — a flash snapshot. `sticker` tapes a short
 * label over the piece ("Not picture perfect. Picture us.").
 */
export interface MarketingHeroSnapshot {
    media?: MarketingMedia
    frames?: MarketingMedia[]
    sticker?: string
}

/**
 * `pinboard` only: one print stuck up beside the headline — a photograph
 * and the line written on its white border ("pancake disaster, 9:14am").
 */
export interface MarketingHeroPrint {
    media: MarketingMedia
    caption?: string
}

export interface MarketingHeroContent {
    /** Optional pill above the headline (availability, launch status). */
    badge?: string
    /**
     * The badge reports a live, computed status ("On call now", "Open —
     * closes 9 PM"): it renders as a sentence-case status pill led by a
     * pulsing dot instead of the tracked uppercase label. The photographic
     * variants keep their own badge treatment.
     */
    badgeLive?: boolean
    /** One word gets the accent treatment (see `accent`); default: the last. */
    headline: string
    /**
     * Where the headline's accent lands: `last-word` (default — end on the
     * word that pops), `first-word` (editorial open), or `none` (pure
     * typography; brutalist/spec-sheet registers read cleaner bare).
     */
    accent?: MarketingAccentPlacement
    subheadline?: string
    /**
     * `full-bleed-media`/`masthead-overlay`/`split-media` only: a
     * tracked-caps credit line, like a title card's billing — what the
     * business does and where ("Custom homes · Timber frame — Cannon
     * Beach, Oregon"). Quieter than a subheadline; not a sentence. The
     * photographic variants set it under the headline; `split-media` sets
     * it under the asks, closing the copy column.
     */
    credit?: string
    /**
     * `full-bleed-media`/`masthead-overlay`: the photograph's own caption,
     * set small in monospace on the frame's lower right — the slug on a
     * contact sheet ("The Haystack House — 2 years, 14 trades, 1 view").
     * With a caption the copy keeps to the left of the frame.
     * `split-media`: a short line hung under the visual ("\n" breaks it) —
     * the register's treatment may move it beside the artwork.
     */
    mediaCaption?: string
    /**
     * `full-bleed-media`/`masthead-overlay` only: the cover lines — short
     * stacked sells under the headline, the way a magazine cover runs
     * them down its left edge ("Knotless · Boho ·\nLocs retwist", "Book\n3
     * weeks out"). A "\n" splits a line's lead from its tail so the
     * register can set the two in different inks and sizes.
     */
    coverLines?: string[]
    primaryCta?: MarketingCta
    secondaryCta?: MarketingCta
    /** `split-media`/`product-frame` place it beside the copy; centered variants below. */
    media?: MarketingMedia
    /**
     * A panel beside the copy — see MarketingHeroAside. `thread`:
     * `split-media` only, and only without `media` (a photograph wins).
     * `price-board`: over the photograph's right side on `full-bleed-media`,
     * or beside the copy on `split-media` without media. Stacks under the
     * CTAs on narrow screens, compact. `directory`: `split-media` only, in
     * the copy column before the asks.
     */
    aside?: MarketingHeroAside
    /**
     * A painted roundel stamped on the hero ("On call\n24/7"): the first
     * line set small, the rest large. `full-bleed-media` hangs it in the
     * photograph's upper left; `split-media` on the media's top corner.
     */
    seal?: string
    /** A monumental figure above the headline — see MarketingHeroReadout. */
    readout?: MarketingHeroReadout
    /**
     * `full-bleed-media` only: several photographs on a slow crossfade
     * (~6s per frame). Wins over `media`; under reduced motion the first
     * frame holds. Image entries with `srcSet` stay responsive.
     */
    slides?: MarketingMedia[]
    /**
     * Full-bleed artwork behind the hero — copy renders over the scrim.
     * Ignored by `full-bleed-media`, where the photograph is the hero
     * itself rather than a backdrop.
     */
    backdrop?: MarketingBackdrop
    /**
     * `form-first` only: lead capture rendered inside the hero. An intake
     * (a `heading`, optionally choices, an extra field and a phone contact)
     * bound to an image `media` renders as the photograph's own tool: the
     * frame goes full-bleed, the copy sits white on the scrim at the left
     * and the intake card holds the right — the dispatcher's first question
     * asked over the scene it's about.
     */
    form?: MarketingLeadIntake
    /**
     * `panel-collage` only: up to two small product crops floating over the
     * framed media's edges (a stat card, an approval row) — the launch-page
     * collage. The first lands lower-left, the second upper-right.
     */
    fragments?: MarketingMedia[]
    /**
     * `panel-collage` only: a row of captioned photographs under the
     * centered copy in place of the framed product — the events of a
     * wedding weekend, the rooms of a house (four read best, portrait).
     * Wins over `media` and `fragments`.
     */
    panels?: MarketingHeroPanel[]
    /** `front-page` only: masthead bar, byline, caption, jump. */
    edition?: MarketingHeroEdition
    /**
     * `invitation` only: the photo wall beside the copy — booth strips and
     * snapshots (see MarketingHeroSnapshot), laid as a tight mosaic of up
     * to five pieces. Wins over `media`.
     */
    snapshots?: MarketingHeroSnapshot[]
    /**
     * `pinboard` only: the pile of prints beside the copy (four read best,
     * landscape photographs), each overlapping the next at its own lean.
     * The first is the biggest and sits on top of the pile's upper edge.
     */
    prints?: MarketingHeroPrint[]
}

export interface MarketingHeroProps extends MarketingHeroContent {
    variant?: MarketingHeroVariant
    anchorId?: string
    /** `form-first` only, injected by the binder. */
    formJoined?: boolean
    onFormSubmit?: (email: string, details?: Record<string, string>) => void
}

function HeroMedia({
    media,
    centered,
    seedHint,
}: {
    media: MarketingMedia
    centered: boolean
    seedHint?: string
}): React.ReactElement {
    const frame = centered ? `${styles.media} ${styles.mediaCentered}` : styles.media
    // Emoji and glyph media render as full-bleed generative art at hero
    // size — platform emoji and small centered marks both read as
    // placeholders in a media slot, so the panel carries seeded artwork.
    if (media.kind === "glyph" || media.kind === "emoji") {
        const seed = media.kind === "glyph" ? media.seed : `${seedHint ?? ""}${media.emoji}`
        return (
            <div className={frame} {...marketingMediaStamp("media", 0)}>
                <MarketingArtPanel seed={seed} className={styles.mediaImg} />
            </div>
        )
    }
    if (media.kind === "browser") {
        return (
            <div className={frame} {...marketingMediaStamp("media", 0)}>
                <MarketingBrowserFrame
                    src={media.src}
                    alt={media.alt}
                    url={media.url}
                    width={media.width}
                    height={media.height}
                    srcSet={media.srcSet}
                />
            </div>
        )
    }
    return (
        <div className={frame} {...marketingMediaStamp("media", 0)}>
            {/* Hero media is above the fold — eager, high-priority load. */}
            <MarketingImage className={styles.mediaImg} {...marketingImageProps(media)} priority />
        </div>
    )
}

/** Resting leans for the pile, in print order (degrees). */
const PINBOARD_TILTS = [2.2, -3.4, 3.8, -2.4, 1.6, -1.8]

/**
 * `pinboard`'s pile: the prints laid over each other at their leans, each
 * taped at the top with its caption written on the white border, and the
 * `seal` stuck on as a note at the pile's foot.
 */
function HeroPinboard({ prints, seal }: { prints: MarketingHeroPrint[]; seal?: string }): React.ReactElement {
    return (
        <div className={styles.pinboardPile}>
            {prints.map((print, index) => (
                <figure
                    key={index}
                    className={styles.pinboardPrint}
                    style={
                        {
                            "--mk-tilt": `${PINBOARD_TILTS[index % PINBOARD_TILTS.length]}deg`,
                        } as React.CSSProperties
                    }
                >
                    <div className={styles.pinboardPhoto} {...marketingMediaStamp("prints", index)}>
                        {print.media.kind === "image" ? (
                            <MarketingImage
                                className={styles.pinboardImg}
                                {...marketingImageProps(print.media)}
                                priority={index < 2}
                            />
                        ) : (
                            <MarketingArtPanel
                                seed={
                                    print.media.kind === "glyph"
                                        ? print.media.seed
                                        : `${print.caption ?? ""}${index}`
                                }
                                className={styles.pinboardImg}
                            />
                        )}
                    </div>
                    {print.caption !== undefined ? (
                        <figcaption
                            className={styles.pinboardCaption}
                            {...marketingTextStamp("caption", "prints", index)}
                        >
                            {print.caption}
                        </figcaption>
                    ) : null}
                </figure>
            ))}
            {seal !== undefined ? (
                <p className={styles.pinboardNote} {...marketingTextStamp("seal")}>
                    {seal.split("\n").map((line, index) => (
                        <span
                            key={index}
                            className={index === 0 ? styles.pinboardNoteTop : styles.pinboardNoteLine}
                        >
                            {line}
                        </span>
                    ))}
                </p>
            ) : null}
        </div>
    )
}

/** CSS browser chrome around the media — the zero-asset product frame. */
function HeroProductFrame({
    media,
    seedHint,
}: {
    media: MarketingMedia
    seedHint?: string
}): React.ReactElement {
    if (media.kind === "emoji" || media.kind === "glyph") {
        const seed = media.kind === "glyph" ? media.seed : `${seedHint ?? ""}${media.emoji}`
        return (
            <div className={styles.productFrame}>
                <div className={styles.productFrameBar} aria-hidden>
                    <span className={styles.productFrameDot} />
                    <span className={styles.productFrameDot} />
                    <span className={styles.productFrameDot} />
                </div>
                {/* The frame supplies the chrome; the art fills the viewport. */}
                <MarketingArtPanel seed={seed} />
            </div>
        )
    }
    return (
        <MarketingBrowserFrame
            src={media.src}
            alt={media.alt}
            url={media.kind === "browser" ? media.url : undefined}
            width={media.width}
            height={media.height}
            srcSet={media.srcSet}
        />
    )
}

/** The `price-board` aside: a short menu board of prices. */
function HeroPriceBoard({
    board,
    className,
}: {
    board: MarketingHeroPriceBoardAside
    className?: string
}): React.ReactElement {
    return (
        <aside
            className={className ? `${styles.priceBoard} ${className}` : styles.priceBoard}
            aria-label={board.title}
        >
            <p className={styles.priceBoardTitle} {...marketingTextStamp("aside.title")}>
                {board.title}
            </p>
            <ul className={styles.priceBoardLines}>
                {board.items.map((item, index) => (
                    <li key={item.name} className={styles.priceBoardLine}>
                        <span
                            className={styles.priceBoardName}
                            {...marketingTextStamp("name", "aside.items", index)}
                        >
                            {item.name}
                        </span>
                        <span className={styles.priceBoardLeader} aria-hidden />
                        <span className={styles.priceBoardPrice}>
                            {item.qualifier !== undefined ? (
                                <span className={styles.priceBoardQualifier}>
                                    <span {...marketingTextStamp("qualifier", "aside.items", index)}>
                                        {item.qualifier}
                                    </span>{" "}
                                </span>
                            ) : null}
                            <span {...marketingTextStamp("price", "aside.items", index)}>{item.price}</span>
                        </span>
                    </li>
                ))}
            </ul>
            {board.footnote !== undefined ? (
                <p className={styles.priceBoardFootnote} {...marketingTextStamp("aside.footnote")}>
                    {board.footnote}
                </p>
            ) : null}
            {board.cta !== undefined ? (
                <a
                    className={styles.priceBoardCta}
                    href={marketingHref(board.cta)}
                    {...marketingTextStamp("aside.cta.label")}
                >
                    {board.cta.label}
                </a>
            ) : null}
        </aside>
    )
}

/** The `directory` aside: a title, plain lines, and a short list of entries. */
function HeroDirectory({ directory }: { directory: MarketingHeroDirectoryAside }): React.ReactElement {
    return (
        <aside className={styles.directory} aria-label={directory.title ?? "At a glance"}>
            {directory.title !== undefined ? (
                <p className={styles.directoryTitle} {...marketingTextStamp("aside.title")}>
                    {directory.title}
                </p>
            ) : null}
            {(directory.lines ?? []).map((line, index) => (
                <p
                    key={line}
                    className={styles.directoryLine}
                    {...marketingTextStamp(`aside.lines.${index}`)}
                >
                    {line}
                </p>
            ))}
            <ol className={styles.directoryList}>
                {directory.items.map((item, index) => {
                    const icon =
                        item.icon !== undefined && isMarketingIconName(item.icon) ? (
                            <span className={styles.directoryIcon} aria-hidden>
                                <MarketingIcon name={item.icon} size={22} />
                            </span>
                        ) : null
                    const body = (
                        <>
                            {icon}
                            <span className={styles.directoryText}>
                                <span
                                    className={styles.directoryLabel}
                                    {...marketingTextStamp("label", "aside.items", index)}
                                >
                                    {item.label}
                                </span>
                                {item.note !== undefined ? (
                                    <span
                                        className={styles.directoryNote}
                                        {...marketingTextStamp("note", "aside.items", index)}
                                    >
                                        {item.note}
                                    </span>
                                ) : null}
                            </span>
                        </>
                    )
                    return (
                        <li key={item.label} className={styles.directoryItem}>
                            {item.href !== undefined ? (
                                <a
                                    className={styles.directoryLink}
                                    href={marketingHref({ label: item.label, href: item.href })}
                                >
                                    {body}
                                </a>
                            ) : (
                                <span className={styles.directoryEntry}>{body}</span>
                            )}
                        </li>
                    )
                })}
            </ol>
        </aside>
    )
}

/**
 * The headline's words with its accent span. Under `last-line` the
 * author's line breaks render as breaks and the final line takes the
 * accent; every other placement keeps the one-sentence reading.
 */
function HeadlineWords({
    headline,
    accent,
}: {
    headline: string
    accent?: MarketingAccentPlacement
}): React.ReactElement {
    const { lead, accentWord, trail, joined } = splitAccentWord(headline, accent)
    const lines = accent === "last-line" && headline.trim().includes("\n")
    const text = (value: string): React.ReactNode =>
        lines
            ? value.split("\n").map((line, index) => (index === 0 ? line : [<br key={index} />, line.trim()]))
            : value
    return (
        <>
            {text(lead)}
            {accentWord !== "" ? (
                <>
                    {lead !== "" && joined !== true ? lines ? <br /> : " " : null}
                    <span className={styles.accentWord}>{accentWord}</span>
                </>
            ) : null}
            {trail !== "" ? ` ${trail}` : null}
        </>
    )
}

/** The painted roundel: first line small, the rest set large. */
function HeroSeal({ seal }: { seal: string }): React.ReactElement {
    const [top, ...rest] = seal.split("\n")
    return (
        <span className={styles.seal} {...marketingTextStamp("seal")}>
            <span className={styles.sealTop}>{top}</span>
            {rest.length > 0 ? <span className={styles.sealMain}>{rest.join(" ")}</span> : null}
        </span>
    )
}

/** The monumental figure over the headline, the script note slung under it. */
function HeroReadout({ readout }: { readout: MarketingHeroReadout }): React.ReactElement {
    return (
        <p className={styles.readout}>
            <span className={styles.readoutValue} {...marketingTextStamp("readout.value")}>
                {readout.value}
            </span>
            {readout.note !== undefined ? (
                <span className={styles.readoutNote} {...marketingTextStamp("readout.note")}>
                    {readout.note}
                </span>
            ) : null}
        </p>
    )
}

/** A full-bleed slide: a photograph (or art panel) painted edge to edge. */
function FullBleedSlide({
    media,
    index,
    active,
    priority,
    seedHint,
}: {
    media: MarketingMedia
    index: number
    active: boolean
    priority: boolean
    seedHint?: string
}): React.ReactElement {
    const frame = active ? `${styles.fullBleedSlide} ${styles.fullBleedSlideActive}` : styles.fullBleedSlide
    if (media.kind === "glyph" || media.kind === "emoji") {
        const seed = media.kind === "glyph" ? media.seed : `${seedHint ?? ""}${media.emoji}`
        return (
            <div className={frame} aria-hidden={!active} {...marketingMediaStamp("slides", index)}>
                <MarketingArtPanel seed={seed} className={styles.fullBleedImg} />
            </div>
        )
    }
    return (
        <div className={frame} aria-hidden={!active} {...marketingMediaStamp("slides", index)}>
            <MarketingImage
                className={styles.fullBleedImg}
                {...marketingImageProps(media)}
                priority={priority}
            />
        </div>
    )
}

/**
 * `full-bleed-media`: the photograph is the hero. Viewport-wide and most of
 * the viewport tall; copy floats low over a dark grade; several `slides`
 * crossfade slowly. Under reduced motion the first frame holds.
 *
 * `masthead-overlay` (the `masthead` flag) is its type-dominant reading:
 * the same photograph, but the headline grows to masthead scale — display
 * type AS the layout, filling the frame's width over the image — with the
 * badge set as a small kicker above it. The register's own display voice
 * (case, family, scale) decides whether it reads as an expedition cover or
 * a wedding marquee.
 */
function HeroFullBleed({
    anchorId,
    badge,
    headline,
    accent,
    subheadline,
    credit,
    mediaCaption,
    coverLines,
    primaryCta,
    secondaryCta,
    media,
    slides,
    aside,
    seal,
    readout,
    masthead = false,
    form,
    formJoined = false,
    onFormSubmit,
}: MarketingHeroProps & { masthead?: boolean }): React.ReactElement {
    const headlineRef = useHeadlineFit<HTMLHeadingElement>(headline)
    const frames = React.useMemo(
        () => (slides !== undefined && slides.length > 0 ? slides : media !== undefined ? [media] : []),
        [slides, media],
    )
    const [active, setActive] = React.useState(0)

    React.useEffect(() => {
        if (frames.length < 2) {
            return
        }
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return
        }
        const timer = window.setInterval(() => {
            setActive((current) => (current + 1) % frames.length)
        }, 6000)
        return () => window.clearInterval(timer)
    }, [frames.length])

    const intake = form !== undefined && onFormSubmit !== undefined ? form : undefined
    const board = intake === undefined && aside?.kind === "price-board" ? aside : undefined
    const slotted = board !== undefined || intake !== undefined
    const innerClass = [
        styles.fullBleedInner,
        mediaCaption !== undefined ? styles.fullBleedInnerCaptioned : "",
        slotted ? styles.fullBleedInnerBoarded : "",
    ]
        .filter(Boolean)
        .join(" ")
    return (
        <header
            id={anchorId}
            className={slotted ? `${styles.fullBleed} ${styles.fullBleedBoarded}` : styles.fullBleed}
        >
            {frames.map((frame, index) => (
                <FullBleedSlide
                    key={index}
                    media={frame}
                    index={index}
                    active={index === active}
                    priority={index === 0}
                    seedHint={headline}
                />
            ))}
            <div className={styles.fullBleedScrim} aria-hidden />
            {seal !== undefined ? (
                <div className={styles.fullBleedSealSlot}>
                    <HeroSeal seal={seal} />
                </div>
            ) : null}
            <div className={innerClass}>
                <div className={styles.fullBleedCopy}>
                    {readout !== undefined ? <HeroReadout readout={readout} /> : null}
                    {badge !== undefined ? (
                        <span
                            className={masthead ? styles.mastheadKicker : styles.fullBleedBadge}
                            {...marketingTextStamp("badge")}
                        >
                            {badge}
                        </span>
                    ) : null}
                    <h1
                        ref={headlineRef}
                        className={`${styles.headline} ${
                            masthead
                                ? styles.mastheadHeadline
                                : mediaCaption !== undefined
                                  ? `${styles.fullBleedHeadline} ${styles.fullBleedHeadlineCaptioned}`
                                  : styles.fullBleedHeadline
                        }`}
                        {...marketingTextStamp("headline")}
                    >
                        <HeadlineWords headline={headline} accent={accent} />
                    </h1>
                    {credit !== undefined ? (
                        <p className={styles.fullBleedCredit} {...marketingTextStamp("credit")}>
                            {credit}
                        </p>
                    ) : null}
                    {coverLines !== undefined && coverLines.length > 0 ? (
                        <ul className={styles.coverLines}>
                            {coverLines.map((line, index) => {
                                const [lead, ...tail] = line.split("\n")
                                return (
                                    <li
                                        key={index}
                                        className={styles.coverLine}
                                        {...marketingItemStamp("coverLines", index)}
                                    >
                                        <span className={styles.coverLineLead}>{lead}</span>
                                        {tail.length > 0 ? (
                                            <span className={styles.coverLineTail}>{tail.join(" ")}</span>
                                        ) : null}
                                    </li>
                                )
                            })}
                        </ul>
                    ) : null}
                    {subheadline !== undefined ? (
                        <p
                            className={`${styles.subheadline} ${styles.fullBleedSubheadline}`}
                            {...marketingTextStamp("subheadline")}
                        >
                            {subheadline}
                        </p>
                    ) : null}
                    {primaryCta || secondaryCta ? (
                        <div className={styles.ctaRow}>
                            {primaryCta ? (
                                <a
                                    className={styles.primary}
                                    href={marketingHref(primaryCta)}
                                    {...marketingTextStamp("primaryCta.label")}
                                >
                                    {primaryCta.label}
                                </a>
                            ) : null}
                            {secondaryCta ? (
                                <a
                                    className={styles.fullBleedSecondary}
                                    href={marketingHref(secondaryCta)}
                                    {...marketingTextStamp("secondaryCta.label")}
                                >
                                    {secondaryCta.label}
                                </a>
                            ) : null}
                        </div>
                    ) : null}
                </div>
                {mediaCaption !== undefined ? (
                    <p className={styles.fullBleedCaption} {...marketingTextStamp("mediaCaption")}>
                        {mediaCaption}
                    </p>
                ) : null}
                {board !== undefined ? (
                    <HeroPriceBoard board={board} className={styles.fullBleedBoard} />
                ) : null}
                {intake !== undefined && onFormSubmit !== undefined ? (
                    <LeadIntakeCard
                        {...intake}
                        joined={formJoined}
                        onSubmit={onFormSubmit}
                        className={styles.fullBleedIntake}
                    />
                ) : null}
            </div>
        </header>
    )
}

/**
 * `front-page`: the lead story of a daily. A masthead bar in the accent
 * (dateline · nameplate or motto · edition) rules the top; beneath it the
 * headline runs at wood-type scale beside the lead photograph, then the
 * deck (the subheadline) and the byline, and a ruled caption line closes
 * the story with its jump link. Line breaks in the headline are honored,
 * so an author can set the wood the way a copy desk would. Photographs
 * print through the register's dot screen where it declares `halftone`.
 */
function HeroFrontPage({
    anchorId,
    badge,
    headline,
    accent,
    subheadline,
    primaryCta,
    secondaryCta,
    media,
    slides,
    edition,
}: MarketingHeroProps): React.ReactElement {
    const headlineRef = useHeadlineFit<HTMLHeadingElement>(headline)
    const lead = media ?? slides?.[0]
    const { lead: before, accentWord, trail, joined } = splitAccentWord(headline, accent)
    const bar = edition?.dateline ?? edition?.masthead ?? edition?.issue
    const byline = edition?.byline
    return (
        <header id={anchorId} className={styles.frontPage}>
            {bar !== undefined ? (
                <div className={styles.frontBar}>
                    <span className={styles.frontBarDateline}>
                        {edition?.dateline !== undefined ? (
                            <>
                                <span className={styles.frontBarStar} aria-hidden>
                                    ★
                                </span>
                                <span {...marketingTextStamp("edition.dateline")}>{edition.dateline}</span>
                                <span className={styles.frontBarStar} aria-hidden>
                                    ★
                                </span>
                            </>
                        ) : null}
                    </span>
                    <span className={styles.frontBarMasthead}>
                        {edition?.masthead !== undefined ? (
                            <span {...marketingTextStamp("edition.masthead")}>{edition.masthead}</span>
                        ) : null}
                    </span>
                    <span className={styles.frontBarIssue}>
                        {edition?.issue !== undefined ? (
                            <span {...marketingTextStamp("edition.issue")}>{edition.issue}</span>
                        ) : null}
                    </span>
                </div>
            ) : null}
            <div className={lead !== undefined ? styles.frontGrid : styles.frontGridSolo}>
                <div className={styles.frontCopy}>
                    {badge !== undefined ? (
                        <span className={styles.frontKicker} {...marketingTextStamp("badge")}>
                            {badge}
                        </span>
                    ) : null}
                    <h1
                        ref={headlineRef}
                        className={styles.frontHeadline}
                        {...marketingTextStamp("headline")}
                    >
                        {before}
                        {accentWord !== "" ? (
                            <>
                                {before !== "" && joined !== true ? " " : null}
                                <span className={styles.accentWord}>{accentWord}</span>
                            </>
                        ) : null}
                        {trail !== "" ? ` ${trail}` : null}
                    </h1>
                    <div className={styles.frontDeckRow}>
                        {subheadline !== undefined ? (
                            <p className={styles.frontDeck} {...marketingTextStamp("subheadline")}>
                                {subheadline}
                            </p>
                        ) : null}
                        {byline !== undefined ? (
                            <div className={styles.frontByline}>
                                {edition?.bylineMedia !== undefined &&
                                edition.bylineMedia.kind === "image" ? (
                                    <span
                                        className={styles.frontBylineMug}
                                        {...marketingMediaStamp("edition.bylineMedia", 0)}
                                    >
                                        <MarketingImage
                                            className={styles.frontBylineImg}
                                            {...marketingImageProps(edition.bylineMedia)}
                                            sizes="120px"
                                        />
                                    </span>
                                ) : null}
                                <span>
                                    <span
                                        className={styles.frontBylineName}
                                        {...marketingTextStamp("edition.byline")}
                                    >
                                        {byline}
                                    </span>
                                    {edition?.bylineRole !== undefined ? (
                                        <span
                                            className={styles.frontBylineRole}
                                            {...marketingTextStamp("edition.bylineRole")}
                                        >
                                            {edition.bylineRole}
                                        </span>
                                    ) : null}
                                </span>
                            </div>
                        ) : null}
                    </div>
                    {primaryCta || secondaryCta ? (
                        <div className={styles.ctaRow}>
                            {primaryCta ? (
                                <a
                                    className={styles.primary}
                                    href={marketingHref(primaryCta)}
                                    {...marketingTextStamp("primaryCta.label")}
                                >
                                    {primaryCta.label}
                                </a>
                            ) : null}
                            {secondaryCta ? (
                                <a
                                    className={styles.secondary}
                                    href={marketingHref(secondaryCta)}
                                    {...marketingTextStamp("secondaryCta.label")}
                                >
                                    {secondaryCta.label}
                                </a>
                            ) : null}
                        </div>
                    ) : null}
                </div>
                {lead !== undefined ? (
                    <div
                        className={styles.frontPhoto}
                        {...marketingMediaStamp(media !== undefined ? "media" : "slides", 0)}
                    >
                        {lead.kind === "glyph" || lead.kind === "emoji" ? (
                            <MarketingArtPanel
                                seed={lead.kind === "glyph" ? lead.seed : `${headline}${lead.emoji}`}
                                className={styles.frontPhotoImg}
                            />
                        ) : (
                            <MarketingImage
                                className={styles.frontPhotoImg}
                                {...marketingImageProps(lead)}
                                sizes="(min-width: 960px) 50vw, 100vw"
                                priority
                            />
                        )}
                    </div>
                ) : null}
            </div>
            {edition?.caption !== undefined || edition?.jump !== undefined ? (
                <div className={styles.frontCaptionRow}>
                    {edition?.caption !== undefined ? (
                        <p className={styles.frontCaption} {...marketingTextStamp("edition.caption")}>
                            {edition.caption}
                        </p>
                    ) : (
                        <span />
                    )}
                    {edition?.jump !== undefined ? (
                        <a
                            className={styles.frontJump}
                            href={marketingHref(edition.jump)}
                            {...marketingTextStamp("edition.jump.label")}
                        >
                            {edition.jump.label}
                        </a>
                    ) : null}
                </div>
            ) : null}
        </header>
    )
}

/** One photograph on the invitation's wall, cover-cropped to its cell. */
function InvitationPrint({
    media,
    stampList = "snapshots",
    stampIndex,
    className,
    seedHint,
}: {
    media: MarketingMedia
    /** Replaceable as (stampList, stampIndex): a print is ("snapshots", i),
     * a strip frame ("snapshots.i.frames", j). */
    stampList?: string
    stampIndex?: number
    className: string
    seedHint: string
}): React.ReactElement {
    const stamp = stampIndex !== undefined ? marketingMediaStamp(stampList, stampIndex) : {}
    if (media.kind === "glyph" || media.kind === "emoji") {
        const seed = media.kind === "glyph" ? media.seed : `${seedHint}${media.emoji}`
        return (
            <span className={className} {...stamp}>
                <MarketingArtPanel seed={seed} className={styles.invitePrintImg} />
            </span>
        )
    }
    return (
        <span className={className} {...stamp}>
            <MarketingImage
                className={styles.invitePrintImg}
                {...marketingImageProps(media)}
                sizes="(min-width: 960px) 30vw, 60vw"
                priority
            />
        </span>
    )
}

/**
 * `invitation`: the party invitation as a hero. The copy column carries an
 * optional script name over the headline (`readout`: value + note), the
 * headline broken on its authored line breaks (each line its own ink), the
 * subheadline, the ask, and a round `seal`. Beside it, either a photo wall
 * of booth strips and snapshots (`snapshots`) or a single portrait
 * (`media`) that bleeds to the viewport's edge. Under both, the
 * particulars strip: `credit` split on " · " into ruled cells, and the
 * `secondaryCta` as the jump to the details ("Details, maps & all that
 * jazz ↓"). The register's treatment decides the inks — a marker zine or
 * a supper-club card.
 */
function HeroInvitation({
    anchorId,
    badge,
    headline,
    subheadline,
    credit,
    primaryCta,
    secondaryCta,
    media,
    seal,
    readout,
    snapshots,
}: MarketingHeroProps): React.ReactElement {
    const headlineRef = useHeadlineFit<HTMLHeadingElement>(headline)
    const wall = (snapshots ?? []).slice(0, 5)
    const portrait = wall.length === 0 ? media : undefined
    const lines = headline.split("\n")
    const cells = credit !== undefined ? credit.split(" · ") : []
    const jumpWords = secondaryCta !== undefined ? secondaryCta.label.split(" ") : []
    const jumpLast = jumpWords.pop()
    return (
        <header id={anchorId} className={styles.invite}>
            <div
                className={
                    wall.length > 0
                        ? styles.inviteGrid
                        : portrait !== undefined
                          ? `${styles.inviteGrid} ${styles.inviteGridPortrait}`
                          : styles.inviteGridSolo
                }
            >
                <div className={styles.inviteCopy}>
                    {badge !== undefined ? (
                        <span className={styles.inviteBadge} {...marketingTextStamp("badge")}>
                            {badge}
                        </span>
                    ) : null}
                    {readout !== undefined ? (
                        <p className={styles.inviteReadout}>
                            <span
                                className={styles.inviteReadoutValue}
                                {...marketingTextStamp("readout.value")}
                            >
                                {readout.value}
                            </span>
                            {readout.note !== undefined ? (
                                <span
                                    className={styles.inviteReadoutNote}
                                    {...marketingTextStamp("readout.note")}
                                >
                                    {readout.note}
                                </span>
                            ) : null}
                        </p>
                    ) : null}
                    <h1
                        ref={headlineRef}
                        className={`${styles.headline} ${styles.inviteHeadline}`}
                        {...marketingTextStamp("headline")}
                    >
                        {lines.map((line, index) => (
                            <span key={index} className={styles.inviteLine}>
                                {line}
                            </span>
                        ))}
                    </h1>
                    {subheadline !== undefined ? (
                        <p
                            className={`${styles.subheadline} ${styles.inviteSub}`}
                            {...marketingTextStamp("subheadline")}
                        >
                            {subheadline}
                        </p>
                    ) : null}
                    {primaryCta !== undefined || seal !== undefined ? (
                        <div className={styles.inviteAskRow}>
                            {primaryCta !== undefined ? (
                                <a
                                    className={styles.primary}
                                    href={marketingHref(primaryCta)}
                                    {...marketingTextStamp("primaryCta.label")}
                                >
                                    {primaryCta.label}
                                </a>
                            ) : null}
                            {seal !== undefined ? (
                                <span className={styles.inviteSeal} {...marketingTextStamp("seal")}>
                                    {seal.split("\n").map((line, index) => (
                                        <span key={index} className={styles.inviteSealLine}>
                                            {line}
                                        </span>
                                    ))}
                                </span>
                            ) : null}
                        </div>
                    ) : null}
                </div>
                {wall.length > 0 ? (
                    <div className={styles.inviteWall} data-pieces={wall.length}>
                        {wall.map((piece, index) => {
                            const strip =
                                piece.frames !== undefined && piece.frames.length > 0
                                    ? piece.frames
                                    : undefined
                            return (
                                <figure
                                    key={index}
                                    className={
                                        strip !== undefined
                                            ? `${styles.invitePiece} ${styles.inviteStrip}`
                                            : styles.invitePiece
                                    }
                                >
                                    {strip !== undefined ? (
                                        strip.map((frame, frameIndex) => (
                                            <InvitationPrint
                                                key={frameIndex}
                                                media={frame}
                                                stampList={`snapshots.${index}.frames`}
                                                stampIndex={frameIndex}
                                                className={styles.inviteStripFrame}
                                                seedHint={headline}
                                            />
                                        ))
                                    ) : piece.media !== undefined ? (
                                        <InvitationPrint
                                            media={piece.media}
                                            stampIndex={index}
                                            className={styles.invitePrint}
                                            seedHint={headline}
                                        />
                                    ) : null}
                                    {piece.sticker !== undefined ? (
                                        <figcaption
                                            className={styles.inviteSticker}
                                            {...marketingTextStamp("sticker", "snapshots", index)}
                                        >
                                            {piece.sticker}
                                        </figcaption>
                                    ) : null}
                                </figure>
                            )
                        })}
                    </div>
                ) : portrait !== undefined ? (
                    <div className={styles.invitePortrait} {...marketingMediaStamp("media", 0)}>
                        {portrait.kind === "glyph" || portrait.kind === "emoji" ? (
                            <MarketingArtPanel
                                seed={
                                    portrait.kind === "glyph" ? portrait.seed : `${headline}${portrait.emoji}`
                                }
                                className={styles.invitePortraitImg}
                            />
                        ) : (
                            <MarketingImage
                                className={styles.invitePortraitImg}
                                {...marketingImageProps(portrait)}
                                sizes="(min-width: 960px) 66vw, 100vw"
                                priority
                            />
                        )}
                    </div>
                ) : null}
            </div>
            {cells.length > 0 || secondaryCta !== undefined ? (
                <div className={styles.inviteDetails}>
                    {cells.length > 0 ? (
                        <p className={styles.inviteCells} {...marketingTextStamp("credit")}>
                            {cells.map((cell, index) => (
                                <span key={index} className={styles.inviteCell}>
                                    {cell}
                                </span>
                            ))}
                        </p>
                    ) : (
                        <span />
                    )}
                    {secondaryCta !== undefined ? (
                        <a
                            className={styles.inviteJump}
                            href={marketingHref(secondaryCta)}
                            {...marketingTextStamp("secondaryCta.label")}
                        >
                            {jumpWords.length > 0 ? `${jumpWords.join(" ")} ` : null}
                            <span className={styles.inviteJumpWord}>{jumpLast}</span>
                            <span className={styles.inviteJumpArrow} aria-hidden>
                                ↓
                            </span>
                        </a>
                    ) : null}
                </div>
            ) : null}
        </header>
    )
}

/**
 * `panel-collage`: centered copy over the product in CSS browser chrome,
 * with up to two small product crops floating over the frame's edges — the
 * flagship-launch collage. Fragments are plain image media (crops of real
 * UI) with their own card chrome supplied here.
 */
function HeroPanelCollage({
    media,
    fragments,
    headline,
}: {
    media: MarketingMedia
    fragments: MarketingMedia[]
    headline: string
}): React.ReactElement {
    return (
        <div className={styles.collage}>
            <div className={styles.collageFrame}>
                <HeroProductFrame media={media} seedHint={headline} />
            </div>
            {fragments.slice(0, 2).map((fragment, index) =>
                fragment.kind === "image" || fragment.kind === "browser" ? (
                    <div
                        key={index}
                        className={index === 0 ? styles.collageFragmentLeft : styles.collageFragmentRight}
                        {...marketingMediaStamp("fragments", index)}
                    >
                        <MarketingImage
                            className={styles.collageFragmentImg}
                            {...marketingImageProps(fragment)}
                            priority
                        />
                    </div>
                ) : null,
            )}
        </div>
    )
}

/**
 * `panel-collage` with `panels`: the collage as a row of framed
 * photographs, each captioned beneath. Narrow screens hold two per row.
 */
function HeroPanelRow({
    panels,
    headline,
}: {
    panels: MarketingHeroPanel[]
    headline: string
}): React.ReactElement {
    return (
        <ul className={styles.panelRow}>
            {panels.map((panel, index) => (
                <li key={index} className={styles.panel} {...marketingItemStamp("panels", index)}>
                    <figure className={styles.panelFrame} {...marketingMediaStamp("panels", index)}>
                        {panel.media.kind === "image" ? (
                            <MarketingImage
                                className={styles.panelImg}
                                {...marketingImageProps(panel.media)}
                                sizes="(min-width: 860px) 22vw, 45vw"
                                priority={index < 2}
                            />
                        ) : (
                            <MarketingArtPanel
                                seed={`${headline}${panel.label ?? index}`}
                                className={styles.panelImg}
                            />
                        )}
                    </figure>
                    {panel.label !== undefined ? (
                        <span className={styles.panelLabel} {...marketingTextStamp("label", "panels", index)}>
                            {panel.label}
                        </span>
                    ) : null}
                </li>
            ))}
        </ul>
    )
}

/**
 * The landing hero. Variants: `centered-stack` (copy and CTAs centered),
 * `split-media` (copy beside a visual — a photograph, or an `aside` panel
 * such as a text thread), `statement` (oversized editorial
 * sentence, left-aligned), `form-first` (centered copy over lead capture;
 * an intake bound to a photograph sets the card over the full-bleed frame),
 * `product-frame` (copy beside the media in CSS browser chrome),
 * `full-bleed-media` (the photograph is the hero; copy floats over it),
 * `panel-collage` (centered copy over the framed product with floating
 * UI-crop fragments — the flagship-launch collage), `masthead-overlay`
 * (full-bleed photograph under a masthead-scale headline — the type-led
 * reading of the photographic hero), `front-page` (a daily's lead story:
 * accent masthead bar with dateline and edition, wood-type headline beside
 * the lead photograph, deck, byline, and a ruled caption line with a jump
 * link — halftone-screened where the register declares it), `invitation`
 * (the party invitation: headline lines in their own inks beside a photo
 * wall of booth strips and snapshots or a bleeding portrait, over a strip
 * of the particulars and a jump to the details), `pinboard` (the copy
 * beside a pile of taped prints with written captions — see `prints` —
 * the seal stuck on as a note, the credit a scribble).
 */
export function MarketingHero({
    variant = "centered-stack",
    anchorId,
    badge,
    badgeLive = false,
    headline,
    accent,
    subheadline,
    credit,
    mediaCaption,
    coverLines,
    primaryCta,
    secondaryCta,
    media,
    aside,
    seal,
    readout,
    slides,
    backdrop,
    form,
    formJoined = false,
    onFormSubmit,
    fragments,
    panels,
    edition,
    snapshots,
    prints,
}: MarketingHeroProps): React.ReactElement {
    const headlineRef = useHeadlineFit<HTMLHeadingElement>(headline)
    if (variant === "invitation") {
        return (
            <HeroInvitation
                anchorId={anchorId}
                badge={badge}
                headline={headline}
                subheadline={subheadline}
                credit={credit}
                primaryCta={primaryCta}
                secondaryCta={secondaryCta}
                media={media}
                seal={seal}
                readout={readout}
                snapshots={snapshots}
            />
        )
    }
    if (variant === "front-page") {
        return (
            <HeroFrontPage
                anchorId={anchorId}
                badge={badge}
                headline={headline}
                accent={accent}
                subheadline={subheadline}
                primaryCta={primaryCta}
                secondaryCta={secondaryCta}
                media={media}
                slides={slides}
                edition={edition}
            />
        )
    }
    if (variant === "full-bleed-media" || variant === "masthead-overlay") {
        return (
            <HeroFullBleed
                anchorId={anchorId}
                badge={badge}
                headline={headline}
                accent={accent}
                subheadline={subheadline}
                credit={credit}
                mediaCaption={mediaCaption}
                coverLines={coverLines}
                primaryCta={primaryCta}
                secondaryCta={secondaryCta}
                media={media}
                slides={slides}
                aside={aside}
                seal={seal}
                readout={readout}
                masthead={variant === "masthead-overlay"}
            />
        )
    }
    if (variant === "form-first" && form?.heading !== undefined && media?.kind === "image") {
        return (
            <HeroFullBleed
                anchorId={anchorId}
                badge={badge}
                headline={headline}
                accent={accent}
                subheadline={subheadline}
                credit={credit}
                primaryCta={primaryCta}
                secondaryCta={secondaryCta}
                media={media}
                seal={seal}
                readout={readout}
                form={form}
                formJoined={formJoined}
                onFormSubmit={onFormSubmit}
            />
        )
    }
    const centered = variant === "centered-stack" || variant === "form-first" || variant === "panel-collage"

    const headlineClass = [
        styles.headline,
        centered ? styles.headlineCentered : "",
        variant === "statement" ? styles.headlineStatement : "",
    ]
        .filter(Boolean)
        .join(" ")

    const copy = (
        <>
            {readout !== undefined ? <HeroReadout readout={readout} /> : null}
            {badge !== undefined ? (
                badgeLive ? (
                    <span className={styles.badgeLive} role="status">
                        <span className={styles.badgeLiveDot} aria-hidden />
                        <span {...marketingTextStamp("badge")}>{badge}</span>
                    </span>
                ) : (
                    <span className={styles.badge} {...marketingTextStamp("badge")}>
                        {badge}
                    </span>
                )
            ) : null}
            <h1 ref={headlineRef} className={headlineClass} {...marketingTextStamp("headline")}>
                <HeadlineWords headline={headline} accent={accent} />
            </h1>
            {subheadline !== undefined ? (
                <p
                    className={
                        centered ? `${styles.subheadline} ${styles.subheadlineCentered}` : styles.subheadline
                    }
                    {...marketingTextStamp("subheadline")}
                >
                    {subheadline}
                </p>
            ) : null}
            {variant === "split-media" && aside?.kind === "directory" ? (
                <HeroDirectory directory={aside} />
            ) : null}
            {variant === "form-first" && form && onFormSubmit ? (
                <div className={styles.formSlot}>
                    <LeadCaptureFields
                        placeholder={form.placeholder}
                        cta={form.cta}
                        confirmation={form.confirmation}
                        joined={formJoined}
                        onSubmit={onFormSubmit}
                    />
                </div>
            ) : primaryCta || secondaryCta ? (
                <div className={centered ? `${styles.ctaRow} ${styles.ctaRowCentered}` : styles.ctaRow}>
                    {primaryCta ? (
                        <a
                            className={styles.primary}
                            href={marketingHref(primaryCta)}
                            {...marketingTextStamp("primaryCta.label")}
                        >
                            {primaryCta.label}
                        </a>
                    ) : null}
                    {secondaryCta ? (
                        <a
                            className={styles.secondary}
                            href={marketingHref(secondaryCta)}
                            {...marketingTextStamp("secondaryCta.label")}
                        >
                            {secondaryCta.label}
                        </a>
                    ) : null}
                </div>
            ) : null}
            {variant === "split-media" && credit !== undefined ? (
                <p className={styles.splitCredit} {...marketingTextStamp("credit")}>
                    {credit}
                </p>
            ) : null}
            {variant === "pinboard" && credit !== undefined ? (
                <p className={styles.pinboardScribble} {...marketingTextStamp("credit")}>
                    {credit}
                </p>
            ) : null}
        </>
    )

    // With a backdrop the anchor id moves to the bleed wrapper, so on-page
    // nav links land on the full art-directed band, not the inner column.
    const headerId = backdrop ? undefined : anchorId
    const body =
        variant === "split-media" || variant === "product-frame" ? (
            <header
                id={headerId}
                className={
                    variant === "split-media" && media !== undefined && media.kind === "image"
                        ? `${styles.split} ${styles.splitPhoto}`
                        : styles.split
                }
            >
                <div className={styles.splitCopy}>{copy}</div>
                {media ? (
                    variant === "product-frame" ? (
                        <HeroProductFrame media={media} seedHint={headline} />
                    ) : (
                        <HeroMedia media={media} centered={false} seedHint={headline} />
                    )
                ) : variant === "split-media" && aside?.kind === "thread" ? (
                    <MarketingThreadCard
                        className={styles.aside}
                        name={aside.name}
                        detail={aside.detail}
                        messages={aside.messages}
                        compact
                        stampPath="aside"
                    />
                ) : variant === "split-media" && aside?.kind === "price-board" ? (
                    <HeroPriceBoard board={aside} className={styles.aside} />
                ) : (
                    <div />
                )}
                {variant === "split-media" && mediaCaption !== undefined ? (
                    <p className={styles.splitCaption} {...marketingTextStamp("mediaCaption")}>
                        {mediaCaption}
                    </p>
                ) : null}
                {seal !== undefined && variant === "split-media" ? (
                    <div className={styles.splitSealSlot}>
                        <HeroSeal seal={seal} />
                    </div>
                ) : null}
            </header>
        ) : variant === "pinboard" ? (
            <header id={headerId} className={styles.pinboard}>
                <div className={styles.pinboardCopy}>{copy}</div>
                <HeroPinboard prints={prints ?? []} seal={seal} />
            </header>
        ) : variant === "panel-collage" ? (
            <header id={headerId} className={styles.centered}>
                {copy}
                {panels !== undefined && panels.length > 0 ? (
                    <HeroPanelRow panels={panels} headline={headline} />
                ) : media ? (
                    <HeroPanelCollage media={media} fragments={fragments ?? []} headline={headline} />
                ) : null}
            </header>
        ) : (
            <header id={headerId} className={variant === "statement" ? styles.statement : styles.centered}>
                {copy}
                {media ? <HeroMedia media={media} centered={centered} seedHint={headline} /> : null}
            </header>
        )

    if (backdrop) {
        return (
            <SectionBackdrop backdrop={backdrop} anchorId={anchorId} priority>
                {body}
            </SectionBackdrop>
        )
    }
    return body
}
