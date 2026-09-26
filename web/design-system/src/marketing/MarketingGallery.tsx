import React from "react"
import { type MarketingMedia } from "./marketingContent"
import { marketingMediaStamp, marketingTextStamp } from "./marketingItemStamp"
import { MarketingImage, marketingImageProps } from "./MarketingImage"
import { MarketingLightbox, type MarketingLightboxItem } from "./MarketingLightbox"
import { MarketingArtPanel } from "./MarketingGlyph"
import * as styles from "./MarketingGallery.styles.css"

export type MarketingGalleryVariant =
    | "uniform"
    | "masonry"
    | "justified"
    | "sequence"
    | "filmstrip"
    | "scrapbook"
    | "before-after"
    | "contact-sheet"
    | "photo-strip"
    | "covers"

/**
 * Where a captioned stack (`sequence` + `captionStack`) sets each caption.
 * `band-center` / `band-start`: on a band of the page ground under its
 * frame, like a museum label under a print — centered at a readable
 * measure, or at the page column's start (the portrait and music
 * portfolios, the vows stack). `overlay-start` / `overlay-center`: small
 * uppercase type over the foot of its photograph on a soft scrim, like a
 * location slate burned into the frame — at the page column's start, or
 * centered (the wedding story told in pictures). Same frames either way;
 * only the caption moves.
 */
export type MarketingGalleryCaptionStack = "band-center" | "band-start" | "overlay-start" | "overlay-center"

export interface MarketingGalleryItem {
    media: MarketingMedia
    caption?: string
    /**
     * The "before" frame of a transformation pair — the `before-after`
     * variant reveals it under a draggable divider, with `media` as the
     * finished "after". Shot from the same angle as `media`, or the
     * comparison reads as two different rooms. Other variants ignore it.
     */
    beforeMedia?: MarketingMedia
    /**
     * `before-after` only: the chips' words over the two sides of the
     * divider — a treatment timeline reads "Month 0" / "Month 14" where a
     * renovation reads the default "Before" / "After". The lightbox
     * captions carry the same words.
     */
    beforeLabel?: string
    afterLabel?: string
    /**
     * `contact-sheet` only: the editor's grease-pencil mark on the frame —
     * `circle` rings a keeper, `cross` strikes a reject. Other variants
     * ignore it.
     */
    mark?: "circle" | "cross"
    /**
     * `contact-sheet`: a handwritten note under the frame ("THIS ONE").
     * `photo-strip`: on a strip's first frame, a label taped over the
     * strip's top ("Take 3 of 4"). `covers`: the album title, set under
     * the artist (`caption`). Other variants ignore it.
     */
    note?: string
    /**
     * A captioned stack (`sequence` + `captionStack`) only: a second,
     * smaller line under the caption — the frame's particulars (the
     * neighborhood and the price under an address, the use and the year
     * under a project), stamped for the editor on its own. Ignored without
     * a `caption`, and by every other variant.
     */
    detail?: string
}

export interface MarketingGalleryContent {
    kicker?: string
    title?: string
    items: MarketingGalleryItem[]
    /**
     * Break the grid out of the page column to the viewport edges — the
     * photography treatment where the work owns the whole width.
     */
    fullBleed?: boolean
    /** Click any image to open it in the full-screen lightbox. */
    lightbox?: boolean
    /** `contact-sheet` only: the stock printed along the film edge ("Kodak Portra 400"). */
    edgeCode?: string
    /** `contact-sheet` only: the first frame's number on the roll (default 1). */
    firstFrame?: number
    /**
     * `sequence` only: the captioned stack — the photographer's portfolio
     * stack. Every frame renders at one size (the first photograph's
     * aspect ratio, capped near viewport height, with later photographs
     * cover-cropped into it, so a photo of another shape can't break the
     * rhythm), the frames bleed edge to edge with no gap, and the mode
     * places each caption (see MarketingGalleryCaptionStack). Implies
     * `fullBleed`. Unset keeps a plain sequence on each photo's own shape.
     */
    captionStack?: MarketingGalleryCaptionStack
}

export interface MarketingGalleryProps extends MarketingGalleryContent {
    variant?: MarketingGalleryVariant
    anchorId?: string
    /**
     * Selection mode (client proofing): which item indexes are selected.
     * Selection state lives in the caller; the gallery only renders it.
     * Currently honored by the `justified` variant (the proofing layout).
     */
    selectedIndexes?: ReadonlySet<number>
    /** Present = selection mode on: each cell gets a check toggle, and the lightbox a select button. */
    onToggleSelect?: (index: number) => void
}

/** Justified rows size each cell from its photo's shape; this is the fallback. */
const DEFAULT_RATIO = 3 / 2

const STACK_CAPTION_CLASS: Record<MarketingGalleryCaptionStack, string> = {
    "band-center": styles.bandCaption,
    "band-start": `${styles.bandCaption} ${styles.bandCaptionStart}`,
    "overlay-start": styles.overlayCaption,
    "overlay-center": `${styles.overlayCaption} ${styles.overlayCaptionCenter}`,
}

/**
 * Scrapbook tilt cycle, in degrees: deterministic (the album lays the same
 * way every render) and tuned so neighbors never share an angle or lean the
 * same way twice in a row.
 */
const SCRAPBOOK_TILTS = [-3.2, 2.1, -1.4, 3.4, -2.6, 1.6, -3.6, 2.9]

/** Frames per photo-booth strip — the booth's four flashes. */
const STRIP_FRAMES = 4

/** Photo-strip resting tilts: gentler than the album, alternating lean. */
const STRIP_TILTS = [-2.4, 1.8, -1.2, 2.6, -1.9, 1.3]

/**
 * Cuts a run of items into booth strips of four, in order. A short final
 * run joins the strip before it when it would be a lone frame, so no strip
 * ever prints a single exposure.
 */
function stripsOf(count: number): number[][] {
    const strips: number[][] = []
    for (let start = 0; start < count; start += STRIP_FRAMES) {
        strips.push(
            Array.from({ length: Math.min(STRIP_FRAMES, count - start) }, (_, offset) => start + offset),
        )
    }
    const last = strips[strips.length - 1]
    const previous = strips[strips.length - 2]
    if (last !== undefined && previous !== undefined && last.length === 1) {
        previous.push(...last)
        strips.pop()
    }
    return strips
}

/** The row height justified rows aim for before flex-grow levels them. */
const JUSTIFIED_TARGET_ROW = 280

function ratioOf(media: MarketingMedia): number {
    if (
        (media.kind === "image" || media.kind === "browser") &&
        media.width !== undefined &&
        media.height !== undefined &&
        media.height > 0
    ) {
        return media.width / media.height
    }
    return DEFAULT_RATIO
}

// Emoji and glyph media render as full-bleed generative art at this size —
// platform emoji and small centered marks both read as placeholders in a
// media slot, so the panel carries seeded artwork instead.
function GalleryMedia({
    media,
    uniform,
    scrapbook = false,
    seedHint,
}: {
    media: MarketingMedia
    uniform: boolean
    /** Scrapbook prints share one portrait frame, the photo at full height. */
    scrapbook?: boolean
    seedHint?: string
}): React.ReactElement {
    const className = scrapbook
        ? `${styles.mediaImg} ${styles.mediaScrapbook}`
        : uniform
          ? `${styles.mediaImg} ${styles.mediaUniform}`
          : styles.mediaImg
    if (media.kind === "glyph" || media.kind === "emoji") {
        const seed = media.kind === "glyph" ? media.seed : `${seedHint ?? ""}${media.emoji}`
        return (
            <MarketingArtPanel
                seed={seed}
                className={className}
                ratio={scrapbook ? "4 / 5" : uniform ? "4 / 3" : undefined}
            />
        )
    }
    return (
        <MarketingImage
            className={className}
            {...marketingImageProps(media)}
            sizes="(min-width: 980px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
    )
}

/** The expand affordance: arrows pushing out to the corners. */
function ExpandIcon(): React.ReactElement {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
                d="M8.5 1.5H12.5V5.5M5.5 12.5H1.5V8.5M12.5 1.5L8.25 5.75M1.5 12.5L5.75 8.25"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

/** The comparison handle's grip: two arrows pulling apart. */
function CompareArrowsIcon(): React.ReactElement {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path
                d="M5.5 4.5L2 8L5.5 11.5M10.5 4.5L14 8L10.5 11.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

/** A comparison layer: the image (or seeded art panel) filling the frame. */
function CompareLayer({ media, seedHint }: { media: MarketingMedia; seedHint: string }): React.ReactElement {
    if (media.kind === "glyph" || media.kind === "emoji") {
        return (
            <MarketingArtPanel
                seed={media.kind === "glyph" ? media.seed : `${seedHint}${media.emoji}`}
                className={styles.compareImg}
            />
        )
    }
    return (
        <MarketingImage
            className={styles.compareImg}
            {...marketingImageProps(media)}
            sizes="(min-width: 980px) 50vw, 100vw"
        />
    )
}

/**
 * A before/after comparison frame: the finished "after" is the base layer,
 * the "before" sits above it clipped to the divider, and an invisible
 * full-frame range input drives the reveal — pointer drag, tap-to-place,
 * and keyboard arrows all come from the native control. Without a
 * `beforeMedia` the frame renders the after image alone, so a half-filled
 * pair degrades to a plain photo instead of a broken slider.
 *
 * With `onOpen` (the gallery's `lightbox` flag) an expand button floats in
 * the frame's corner — an explicit affordance, because a click anywhere
 * else on the frame IS the drag and must stay that way.
 */
function BeforeAfterFigure({
    item,
    index,
    onOpen,
}: {
    item: MarketingGalleryItem
    index: number
    onOpen?: () => void
}): React.ReactElement {
    const [reveal, setReveal] = React.useState(50)
    const ratio = ratioOf(item.media)
    const label = item.media.kind === "image" ? item.media.alt : "this project"
    const seedHint = item.caption ?? String(index)
    return (
        <figure className={styles.compareFigure} {...marketingMediaStamp("items", index)}>
            <div
                className={styles.compareFrame}
                style={{ aspectRatio: `${ratio}`, "--mk-reveal": `${reveal}%` } as React.CSSProperties}
            >
                <CompareLayer media={item.media} seedHint={`${seedHint}-after`} />
                {item.beforeMedia !== undefined ? (
                    <>
                        <div className={styles.compareBeforeClip}>
                            <CompareLayer media={item.beforeMedia} seedHint={`${seedHint}-before`} />
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            step={1}
                            value={reveal}
                            className={styles.compareRange}
                            aria-label={`Compare before and after: ${label}`}
                            onChange={(event) => setReveal(Number(event.currentTarget.value))}
                        />
                        <div className={styles.compareDivider} aria-hidden>
                            <span className={styles.compareHandle}>
                                <CompareArrowsIcon />
                            </span>
                        </div>
                        <span className={`${styles.compareChip} ${styles.compareChipBefore}`} aria-hidden>
                            {item.beforeLabel ?? "Before"}
                        </span>
                        <span className={`${styles.compareChip} ${styles.compareChipAfter}`} aria-hidden>
                            {item.afterLabel ?? "After"}
                        </span>
                    </>
                ) : null}
                {onOpen !== undefined ? (
                    <button
                        type="button"
                        className={styles.compareExpand}
                        onClick={onOpen}
                        aria-label={`View ${label} full screen`}
                    >
                        <ExpandIcon />
                    </button>
                ) : null}
            </div>
            {item.caption !== undefined ? (
                <figcaption className={styles.caption}>{item.caption}</figcaption>
            ) : null}
        </figure>
    )
}

/** The selection check: outline while unselected, filled when selected. */
function SelectCheckIcon(): React.ReactElement {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
                d="M2.5 7.5L5.5 10.5L11.5 3.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

/** A justified cell: the row's flex math comes from the photo's own shape. */
function JustifiedFigure({
    item,
    index,
    seedHint,
    onOpen,
    selected = false,
    onToggleSelect,
}: {
    item: MarketingGalleryItem
    index: number
    seedHint?: string
    onOpen?: () => void
    selected?: boolean
    onToggleSelect?: () => void
}): React.ReactElement {
    const ratio = ratioOf(item.media)
    const cellStyle: React.CSSProperties = {
        flexGrow: ratio * 100,
        flexBasis: ratio * JUSTIFIED_TARGET_ROW * 0.72,
        aspectRatio: `${ratio}`,
    }
    const imgClass = selected ? `${styles.justifiedImg} ${styles.justifiedImgSelected}` : styles.justifiedImg
    const media =
        item.media.kind === "glyph" || item.media.kind === "emoji" ? (
            <MarketingArtPanel
                seed={item.media.kind === "glyph" ? item.media.seed : `${seedHint ?? ""}${item.media.emoji}`}
                className={imgClass}
            />
        ) : (
            <MarketingImage
                className={imgClass}
                {...marketingImageProps(item.media)}
                sizes="(min-width: 980px) 50vw, 100vw"
            />
        )
    const label = item.media.kind === "image" ? item.media.alt : "image"
    return (
        <figure
            className={
                selected
                    ? `${styles.justifiedFigure} ${styles.justifiedFigureSelected}`
                    : styles.justifiedFigure
            }
            style={cellStyle}
            {...marketingMediaStamp("items", index)}
        >
            {onOpen !== undefined ? (
                <button
                    type="button"
                    className={styles.justifiedButton}
                    onClick={onOpen}
                    aria-label={item.media.kind === "image" ? `View ${item.media.alt}` : "View image"}
                >
                    {media}
                </button>
            ) : (
                media
            )}
            {onToggleSelect !== undefined ? (
                <button
                    type="button"
                    className={
                        selected
                            ? `${styles.selectToggle} ${styles.selectToggleSelected}`
                            : styles.selectToggle
                    }
                    aria-pressed={selected}
                    aria-label={selected ? `Deselect ${label}` : `Select ${label}`}
                    onClick={onToggleSelect}
                >
                    <SelectCheckIcon />
                </button>
            ) : null}
            {item.caption !== undefined ? (
                <figcaption className={styles.justifiedCaption}>{item.caption}</figcaption>
            ) : null}
        </figure>
    )
}

/** A framed cell (`sequence`/`filmstrip`): the frame takes the photo's own
 * aspect ratio (set inline) and the caption sits beneath it, so the image
 * geometry stays photographic while the text keeps the page's rhythm. */
function FrameFigure({
    item,
    index,
    figureClass,
    frameClass,
    frameStyle,
    captionClass,
    captionStamped = false,
    onOpen,
}: {
    item: MarketingGalleryItem
    index: number
    figureClass: string
    frameClass: string
    frameStyle: React.CSSProperties
    captionClass: string
    captionStamped?: boolean
    onOpen?: () => void
}): React.ReactElement {
    const media =
        item.media.kind === "glyph" || item.media.kind === "emoji" ? (
            <MarketingArtPanel
                seed={
                    item.media.kind === "glyph" ? item.media.seed : `${item.caption ?? ""}${item.media.emoji}`
                }
                className={styles.frameImg}
            />
        ) : (
            <MarketingImage
                className={styles.frameImg}
                {...marketingImageProps(item.media)}
                sizes="(min-width: 980px) 80vw, 100vw"
            />
        )
    return (
        <figure className={figureClass} {...marketingMediaStamp("items", index)}>
            <div className={frameClass} style={frameStyle}>
                {onOpen !== undefined ? (
                    <button
                        type="button"
                        className={styles.frameButton}
                        onClick={onOpen}
                        aria-label={item.media.kind === "image" ? `View ${item.media.alt}` : "View image"}
                    >
                        {media}
                    </button>
                ) : (
                    media
                )}
            </div>
            {item.caption !== undefined && captionStamped && item.detail !== undefined ? (
                <figcaption className={captionClass}>
                    <span
                        className={styles.stackCaptionLine}
                        {...marketingTextStamp("caption", "items", index)}
                    >
                        {item.caption}
                    </span>
                    <span
                        className={styles.stackCaptionDetail}
                        {...marketingTextStamp("detail", "items", index)}
                    >
                        {item.detail}
                    </span>
                </figcaption>
            ) : item.caption !== undefined ? (
                <figcaption
                    className={captionClass}
                    {...(captionStamped ? marketingTextStamp("caption", "items", index) : {})}
                >
                    {item.caption}
                </figcaption>
            ) : null}
        </figure>
    )
}

/** A record sleeve (`covers`): the photo square-cropped, the artist and the
 * album title set as two short lines under it. */
function CoverFigure({
    item,
    index,
    onOpen,
}: {
    item: MarketingGalleryItem
    index: number
    onOpen?: () => void
}): React.ReactElement {
    const media =
        item.media.kind === "glyph" || item.media.kind === "emoji" ? (
            <MarketingArtPanel
                seed={
                    item.media.kind === "glyph" ? item.media.seed : `${item.caption ?? ""}${item.media.emoji}`
                }
                className={styles.frameImg}
            />
        ) : (
            <MarketingImage
                className={styles.frameImg}
                {...marketingImageProps(item.media)}
                sizes="(min-width: 980px) 25vw, 50vw"
            />
        )
    return (
        <figure className={styles.coverFigure} {...marketingMediaStamp("items", index)}>
            <div className={styles.coverSleeve}>
                {onOpen !== undefined ? (
                    <button
                        type="button"
                        className={styles.frameButton}
                        onClick={onOpen}
                        aria-label={item.media.kind === "image" ? `View ${item.media.alt}` : "View image"}
                    >
                        {media}
                    </button>
                ) : (
                    media
                )}
            </div>
            {item.caption !== undefined || item.note !== undefined ? (
                <figcaption className={styles.coverCaption}>
                    {item.caption !== undefined ? (
                        <span className={styles.coverLine} {...marketingTextStamp("caption", "items", index)}>
                            {item.caption}
                        </span>
                    ) : null}
                    {item.note !== undefined ? (
                        <span className={styles.coverLine} {...marketingTextStamp("note", "items", index)}>
                            {item.note}
                        </span>
                    ) : null}
                </figcaption>
            ) : null}
        </figure>
    )
}

/** A grease-pencil ring: one loose, overshooting loop, like a hand drew it. */
function GreasePencilCircle(): React.ReactElement {
    return (
        <svg className={styles.sheetMark} viewBox="0 0 200 150" preserveAspectRatio="none" aria-hidden="true">
            <path
                d="M 44 18 C 104 -4 188 10 193 68 C 198 124 124 146 66 139 C 14 132 0 88 10 56 C 18 30 52 12 96 9"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    )
}

/** A grease-pencil strike: two quick diagonals across a reject. */
function GreasePencilCross(): React.ReactElement {
    return (
        <svg className={styles.sheetMark} viewBox="0 0 200 150" preserveAspectRatio="none" aria-hidden="true">
            <path
                d="M 22 18 C 70 52 128 96 182 134 M 178 16 C 128 56 74 98 24 136"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    )
}

/**
 * One frame of a contact sheet: a segment of film — frame number and
 * sprocket band above, the exposure, sprocket band and edge print below —
 * with the editor's optional grease-pencil mark and note. Segments sit
 * shoulder to shoulder so the sprocket bands run continuous along a row.
 */
function ContactFrame({
    item,
    index,
    frameNumber,
    edgeCode,
    onOpen,
}: {
    item: MarketingGalleryItem
    index: number
    frameNumber: number
    edgeCode: string
    onOpen?: () => void
}): React.ReactElement {
    const label = item.media.kind === "image" ? item.media.alt : "image"
    const media =
        item.media.kind === "glyph" || item.media.kind === "emoji" ? (
            <MarketingArtPanel
                seed={item.media.kind === "glyph" ? item.media.seed : `${item.note ?? ""}${item.media.emoji}`}
                className={styles.sheetImg}
            />
        ) : (
            <MarketingImage
                className={styles.sheetImg}
                {...marketingImageProps(item.media)}
                sizes="(min-width: 980px) 25vw, (min-width: 640px) 33vw, 50vw"
            />
        )
    return (
        <figure className={styles.sheetFrame} {...marketingMediaStamp("items", index)}>
            <div className={styles.sheetStrip}>
                <span className={styles.sheetNumber} aria-hidden>
                    {frameNumber}
                </span>
                <span className={styles.sheetSprockets} aria-hidden />
                <div className={styles.sheetExposure}>
                    {onOpen !== undefined ? (
                        <button
                            type="button"
                            className={styles.sheetButton}
                            onClick={onOpen}
                            aria-label={`View ${label}`}
                        >
                            {media}
                        </button>
                    ) : (
                        media
                    )}
                    {item.mark === "circle" ? <GreasePencilCircle /> : null}
                    {item.mark === "cross" ? <GreasePencilCross /> : null}
                </div>
                <span className={styles.sheetSprockets} aria-hidden />
                <span className={styles.sheetEdge} aria-hidden>
                    <span>{index % 2 === 0 ? edgeCode : ""}</span>
                    <span>▸ {frameNumber}A</span>
                </span>
            </div>
            <figcaption
                className={styles.sheetNote}
                {...(item.note !== undefined ? marketingTextStamp("note", "items", index) : {})}
            >
                {item.note ?? ""}
            </figcaption>
        </figure>
    )
}

/**
 * Visual proof — the work, the space, the product. `uniform` crops every
 * item to the same aspect on a grid; `masonry` flows natural heights through
 * CSS columns; `justified` levels natural aspect ratios into rows in the
 * photographer's own order (masonry's column flow scrambles a deliberately
 * sequenced portfolio — justified never does); `sequence` gives each
 * photograph a frame of (near) viewport height, one at a time in order —
 * the editorial pacing; `filmstrip` runs the frames along a scroll-snapped
 * horizontal rail; `scrapbook` lays taped prints at deterministic tilts in
 * an overlapping cluster — the tour-book/party-album treatment (tourbook
 * and lanternlight's shared voice); `before-after` pairs each item's
 * `beforeMedia` with its `media` under a draggable comparison divider —
 * the trades treatment, where the transformation IS the proof (pointer
 * drag, tap, and keyboard arrows all work; an item without `beforeMedia`
 * degrades to a plain photo); `contact-sheet` prints the roll as a 35mm
 * contact sheet — film-base segments with sprocket bands, frame numbers
 * from `firstFrame`, the `edgeCode` stock along the edge, and each item's
 * optional grease-pencil `mark` (a ring for keepers, a strike for rejects)
 * and handwritten `note`; frames crop to one uniform size the way a roll
 * does, and the lightbox shows each photograph whole; `photo-strip` cuts
 * the items into photo-booth strips of four square frames in an ink
 * border, laid side by side at alternating tilts — each strip captioned
 * by its first item's `caption` and labeled by its `note`, every frame
 * opening whole in the lightbox; `covers` hangs the items as a record
 * wall — square sleeves in a tight grid (four across, two on phones), the
 * artist (`caption`) and album (`note`) as two short lines under each
 * sleeve. A `sequence` with `captionStack` is the photographer's stack
 * (see the field). `fullBleed`
 * breaks the grid out to the viewport edges; `lightbox` opens images
 * full-screen on click (the comparison variant keeps the frame drag and
 * opens through a corner expand button, with each pair as adjacent
 * after/before slides).
 */
export function MarketingGallery({
    variant = "uniform",
    anchorId,
    kicker,
    title,
    items,
    fullBleed = false,
    lightbox = false,
    edgeCode = "Safety film",
    firstFrame = 1,
    captionStack,
    selectedIndexes,
    onToggleSelect,
}: MarketingGalleryProps): React.ReactElement {
    const uniform = variant === "uniform"
    const justified = variant === "justified"
    const [openIndex, setOpenIndex] = React.useState<number | null>(null)

    // One photograph can't compose a row or grid: `justified`'s end spacer
    // devours the row and orphans the image at ~flex-basis width, and the
    // other multi-photo layouts leave one undersized cell adrift. Composed
    // documents only carry `{id, type, variant}` — a composer (remix, an
    // agent, a hand edit) can write any variant over any content — so a
    // single item renders through the `sequence` presentation instead: one
    // full-content-width frame, honoring `fullBleed`. Exceptions that keep
    // their own layout: a `before-after` item WITH a `beforeMedia` is a
    // complete comparison (two images), and selection mode (client
    // proofing) keeps `justified` so the select affordance survives.
    // Multi-item rendering is untouched.
    const presentedVariant: MarketingGalleryVariant =
        items.length === 1 &&
        onToggleSelect === undefined &&
        !(variant === "before-after" && items[0]?.beforeMedia !== undefined)
            ? "sequence"
            : variant

    // Only real images open in the lightbox; art panels stay in the grid.
    // The comparison variant contributes each pair as adjacent slides
    // (after first — the beauty shot — then its before), so paging flips
    // between the two full screen.
    const lightboxItems: MarketingLightboxItem[] = []
    const lightboxIndexByItem = new Map<number, number>()
    const itemIndexByLightbox: number[] = []
    if (lightbox) {
        items.forEach((item, itemIndex) => {
            if (item.media.kind !== "image") {
                return
            }
            const before =
                variant === "before-after" && item.beforeMedia?.kind === "image"
                    ? item.beforeMedia
                    : undefined
            lightboxIndexByItem.set(itemIndex, lightboxItems.length)
            itemIndexByLightbox.push(itemIndex)
            lightboxItems.push({
                src: item.media.src,
                alt: item.media.alt,
                width: item.media.width,
                height: item.media.height,
                srcSet: item.media.srcSet,
                caption:
                    variant === "covers" && item.note !== undefined
                        ? item.caption !== undefined
                            ? `${item.caption} — ${item.note}`
                            : item.note
                        : variant === "contact-sheet" && item.note !== undefined
                          ? item.caption !== undefined
                              ? `“${item.note}” — ${item.caption}`
                              : `“${item.note}”`
                          : before !== undefined
                            ? item.caption !== undefined
                                ? `${item.afterLabel ?? "After"} — ${item.caption}`
                                : (item.afterLabel ?? "After")
                            : item.caption,
            })
            if (before !== undefined) {
                itemIndexByLightbox.push(itemIndex)
                lightboxItems.push({
                    src: before.src,
                    alt: before.alt,
                    width: before.width,
                    height: before.height,
                    srcSet: before.srcSet,
                    caption:
                        item.caption !== undefined
                            ? `${item.beforeLabel ?? "Before"} — ${item.caption}`
                            : (item.beforeLabel ?? "Before"),
                })
            }
        })
    }

    // Selection state translated into the lightbox's own index space.
    const lightboxSelected =
        onToggleSelect !== undefined && selectedIndexes !== undefined
            ? new Set(
                  itemIndexByLightbox.flatMap((itemIndex, lightboxIndex) =>
                      selectedIndexes.has(itemIndex) ? [lightboxIndex] : [],
                  ),
              )
            : undefined
    const onLightboxToggleSelect =
        onToggleSelect !== undefined
            ? (lightboxIndex: number): void => {
                  const itemIndex = itemIndexByLightbox[lightboxIndex]
                  if (itemIndex !== undefined) {
                      onToggleSelect(itemIndex)
                  }
              }
            : undefined

    const openerFor = (itemIndex: number): (() => void) | undefined => {
        const target = lightboxIndexByItem.get(itemIndex)
        if (target === undefined) {
            return undefined
        }
        return () => setOpenIndex(target)
    }

    if (presentedVariant === "before-after") {
        return (
            <section id={anchorId} className={styles.wrap} aria-label={title ?? "Before and after"}>
                {kicker !== undefined ? <span className={styles.kicker}>{kicker}</span> : null}
                {title !== undefined ? <h2 className={styles.title}>{title}</h2> : null}
                <div className={fullBleed ? `${styles.compare} ${styles.gridBleed}` : styles.compare}>
                    {items.map((item, index) => (
                        <BeforeAfterFigure
                            key={item.caption ?? index}
                            item={item}
                            index={index}
                            onOpen={openerFor(index)}
                        />
                    ))}
                </div>
                {lightbox ? (
                    <MarketingLightbox items={lightboxItems} index={openIndex} onIndexChange={setOpenIndex} />
                ) : null}
            </section>
        )
    }

    if (presentedVariant === "contact-sheet") {
        return (
            <section id={anchorId} className={styles.wrap} aria-label={title ?? "Contact sheet"}>
                {kicker !== undefined ? <span className={styles.kicker}>{kicker}</span> : null}
                {title !== undefined ? <h2 className={styles.title}>{title}</h2> : null}
                <div className={fullBleed ? `${styles.sheet} ${styles.gridBleed}` : styles.sheet}>
                    {items.map((item, index) => (
                        <ContactFrame
                            key={item.caption ?? index}
                            item={item}
                            index={index}
                            frameNumber={firstFrame + index}
                            edgeCode={edgeCode}
                            onOpen={openerFor(index)}
                        />
                    ))}
                </div>
                {lightbox ? (
                    <MarketingLightbox items={lightboxItems} index={openIndex} onIndexChange={setOpenIndex} />
                ) : null}
            </section>
        )
    }

    if (presentedVariant === "photo-strip") {
        return (
            <section id={anchorId} className={styles.wrap} aria-label={title ?? "Photo strips"}>
                {kicker !== undefined ? <span className={styles.kicker}>{kicker}</span> : null}
                {title !== undefined ? <h2 className={styles.title}>{title}</h2> : null}
                <div className={fullBleed ? `${styles.strips} ${styles.gridBleed}` : styles.strips}>
                    {stripsOf(items.length).map((frames, stripIndex) => {
                        const head = items[frames[0] ?? 0]
                        return (
                            <figure
                                key={stripIndex}
                                className={styles.stripFigure}
                                style={
                                    {
                                        "--mk-tilt": `${STRIP_TILTS[stripIndex % STRIP_TILTS.length]}deg`,
                                    } as React.CSSProperties
                                }
                            >
                                {head?.note !== undefined ? (
                                    <span className={styles.stripNote}>{head.note}</span>
                                ) : null}
                                <div className={styles.stripFilm}>
                                    {frames.map((itemIndex) => {
                                        const item = items[itemIndex]
                                        if (item === undefined) {
                                            return null
                                        }
                                        const onOpen = openerFor(itemIndex)
                                        const media =
                                            item.media.kind === "glyph" || item.media.kind === "emoji" ? (
                                                <MarketingArtPanel
                                                    seed={
                                                        item.media.kind === "glyph"
                                                            ? item.media.seed
                                                            : `${item.caption ?? itemIndex}${item.media.emoji}`
                                                    }
                                                    className={styles.stripImg}
                                                />
                                            ) : (
                                                <MarketingImage
                                                    className={styles.stripImg}
                                                    {...marketingImageProps(item.media)}
                                                    sizes="(min-width: 980px) 240px, 45vw"
                                                />
                                            )
                                        return (
                                            <div
                                                key={itemIndex}
                                                className={styles.stripFrame}
                                                {...marketingMediaStamp("items", itemIndex)}
                                            >
                                                {onOpen !== undefined ? (
                                                    <button
                                                        type="button"
                                                        className={styles.frameButton}
                                                        onClick={onOpen}
                                                        aria-label={
                                                            item.media.kind === "image"
                                                                ? `View ${item.media.alt}`
                                                                : "View image"
                                                        }
                                                    >
                                                        {media}
                                                    </button>
                                                ) : (
                                                    media
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                                {head?.caption !== undefined ? (
                                    <figcaption className={styles.stripCaption}>{head.caption}</figcaption>
                                ) : null}
                            </figure>
                        )
                    })}
                </div>
                {lightbox ? (
                    <MarketingLightbox items={lightboxItems} index={openIndex} onIndexChange={setOpenIndex} />
                ) : null}
            </section>
        )
    }

    if (presentedVariant === "covers") {
        return (
            <section id={anchorId} className={styles.wrap} aria-label={title ?? "Record covers"}>
                {kicker !== undefined ? <span className={styles.kicker}>{kicker}</span> : null}
                {title !== undefined ? <h2 className={styles.title}>{title}</h2> : null}
                <div className={fullBleed ? `${styles.covers} ${styles.gridBleed}` : styles.covers}>
                    {items.map((item, index) => (
                        <CoverFigure
                            key={item.caption ?? index}
                            item={item}
                            index={index}
                            onOpen={openerFor(index)}
                        />
                    ))}
                </div>
                {lightbox ? (
                    <MarketingLightbox items={lightboxItems} index={openIndex} onIndexChange={setOpenIndex} />
                ) : null}
            </section>
        )
    }

    if (presentedVariant === "sequence" && captionStack !== undefined) {
        // One frame size for the whole stack, whatever each photo's shape.
        const ratio = items[0] !== undefined ? ratioOf(items[0].media) : DEFAULT_RATIO
        const headed = kicker !== undefined || title !== undefined
        const overlay = captionStack === "overlay-start" || captionStack === "overlay-center"
        return (
            <section
                id={anchorId}
                className={headed ? styles.wrap : `${styles.wrap} ${styles.stackWrapFlush}`}
                aria-label={title ?? "Gallery"}
            >
                {kicker !== undefined ? <span className={styles.kicker}>{kicker}</span> : null}
                {title !== undefined ? <h2 className={styles.title}>{title}</h2> : null}
                <div className={`${styles.sequence} ${styles.sequenceBleed} ${styles.gridBleed}`}>
                    {items.map((item, index) => (
                        <FrameFigure
                            key={item.caption ?? index}
                            item={item}
                            index={index}
                            figureClass={`${styles.sequenceFigure} ${styles.sequenceBleedFigure} ${
                                overlay ? styles.overlayFigure : styles.bandFigure
                            }`}
                            frameClass={`${styles.sequenceFrame} ${styles.sequenceBleedFrame}`}
                            frameStyle={{ aspectRatio: `${ratio}`, width: "100%", maxHeight: "92vh" }}
                            captionClass={STACK_CAPTION_CLASS[captionStack]}
                            captionStamped
                            onOpen={openerFor(index)}
                        />
                    ))}
                </div>
                {lightbox ? (
                    <MarketingLightbox items={lightboxItems} index={openIndex} onIndexChange={setOpenIndex} />
                ) : null}
            </section>
        )
    }

    if (presentedVariant === "sequence" || presentedVariant === "filmstrip") {
        const strip = presentedVariant === "filmstrip"
        const trackClass = strip
            ? styles.filmstrip
            : fullBleed
              ? `${styles.sequence} ${styles.sequenceBleed}`
              : styles.sequence
        return (
            <section id={anchorId} className={styles.wrap} aria-label={title ?? "Gallery"}>
                {kicker !== undefined ? <span className={styles.kicker}>{kicker}</span> : null}
                {title !== undefined ? <h2 className={styles.title}>{title}</h2> : null}
                <div className={fullBleed ? `${trackClass} ${styles.gridBleed}` : trackClass}>
                    {items.map((item, index) => {
                        const ratio = ratioOf(item.media)
                        return (
                            <FrameFigure
                                key={item.caption ?? index}
                                item={item}
                                index={index}
                                figureClass={
                                    strip
                                        ? styles.filmstripFigure
                                        : fullBleed
                                          ? `${styles.sequenceFigure} ${styles.sequenceBleedFigure}`
                                          : styles.sequenceFigure
                                }
                                frameClass={
                                    strip
                                        ? styles.filmstripFrame
                                        : fullBleed
                                          ? `${styles.sequenceFrame} ${styles.sequenceBleedFrame}`
                                          : styles.sequenceFrame
                                }
                                frameStyle={
                                    strip
                                        ? { aspectRatio: `${ratio}` }
                                        : fullBleed
                                          ? {
                                                // The slide show: the frame takes the whole bled
                                                // track and caps near viewport height — the photo
                                                // cover-crops into it, one full-page frame per
                                                // scroll stop.
                                                aspectRatio: `${ratio}`,
                                                width: "100%",
                                                maxHeight: "92vh",
                                            }
                                          : {
                                                aspectRatio: `${ratio}`,
                                                // Cap the frame so tall photos never outgrow the
                                                // viewport: width = 80vh × the photo's own ratio.
                                                width: `min(100%, ${Math.round(ratio * 80)}vh)`,
                                            }
                                }
                                captionClass={strip ? styles.filmstripCaption : styles.sequenceCaption}
                                onOpen={openerFor(index)}
                            />
                        )
                    })}
                </div>
                {lightbox ? (
                    <MarketingLightbox items={lightboxItems} index={openIndex} onIndexChange={setOpenIndex} />
                ) : null}
            </section>
        )
    }

    const scrapbook = variant === "scrapbook"
    const gridClass = justified
        ? styles.justified
        : uniform
          ? styles.grid
          : scrapbook
            ? styles.scrapbook
            : styles.masonry

    return (
        <section id={anchorId} className={styles.wrap} aria-label={title ?? "Gallery"}>
            {kicker !== undefined ? <span className={styles.kicker}>{kicker}</span> : null}
            {title !== undefined ? <h2 className={styles.title}>{title}</h2> : null}
            <div className={fullBleed ? `${gridClass} ${styles.gridBleed}` : gridClass}>
                {justified ? (
                    <>
                        {items.map((item, index) => (
                            <JustifiedFigure
                                key={item.caption ?? index}
                                item={item}
                                index={index}
                                seedHint={item.caption}
                                onOpen={openerFor(index)}
                                selected={selectedIndexes?.has(index) ?? false}
                                onToggleSelect={
                                    onToggleSelect !== undefined ? () => onToggleSelect(index) : undefined
                                }
                            />
                        ))}
                        {/* Keeps a sparse final row at natural size instead of
                            stretching its photos to fill the width. */}
                        <div className={styles.justifiedSpacer} aria-hidden />
                    </>
                ) : (
                    items.map((item, index) => {
                        const onOpen = openerFor(index)
                        const media = (
                            <GalleryMedia
                                media={item.media}
                                uniform={uniform}
                                scrapbook={scrapbook}
                                seedHint={item.caption}
                            />
                        )
                        return (
                            <figure
                                key={item.caption ?? index}
                                className={
                                    scrapbook
                                        ? styles.scrapbookFigure
                                        : uniform
                                          ? styles.figure
                                          : `${styles.figure} ${styles.figureMasonry}`
                                }
                                // The print's resting tilt, as a var so the
                                // hover-straighten transition stays in CSS.
                                style={
                                    scrapbook
                                        ? ({
                                              "--mk-tilt": `${SCRAPBOOK_TILTS[index % SCRAPBOOK_TILTS.length]}deg`,
                                          } as React.CSSProperties)
                                        : undefined
                                }
                                {...marketingMediaStamp("items", index)}
                            >
                                {onOpen !== undefined ? (
                                    <button
                                        type="button"
                                        className={styles.mediaButton}
                                        onClick={onOpen}
                                        aria-label={
                                            item.media.kind === "image"
                                                ? `View ${item.media.alt}`
                                                : "View image"
                                        }
                                    >
                                        {media}
                                    </button>
                                ) : (
                                    media
                                )}
                                {item.caption !== undefined ? (
                                    <figcaption
                                        className={scrapbook ? styles.scrapbookCaption : styles.caption}
                                    >
                                        {item.caption}
                                    </figcaption>
                                ) : null}
                            </figure>
                        )
                    })
                )}
            </div>
            {lightbox ? (
                <MarketingLightbox
                    items={lightboxItems}
                    index={openIndex}
                    onIndexChange={setOpenIndex}
                    selectedIndexes={lightboxSelected}
                    onToggleSelect={onLightboxToggleSelect}
                />
            ) : null}
        </section>
    )
}
