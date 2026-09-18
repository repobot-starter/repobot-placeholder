import React from "react"
import { type MarketingMedia } from "./marketingContent"
import { marketingMediaStamp } from "./marketingItemStamp"
import { MarketingImage, marketingImageProps } from "./MarketingImage"
import { MarketingLightbox, type MarketingLightboxItem } from "./MarketingLightbox"
import { MarketingArtPanel } from "./MarketingGlyph"
import * as styles from "./MarketingGallery.styles.css"

export type MarketingGalleryVariant =
    "uniform" | "masonry" | "justified" | "sequence" | "filmstrip" | "scrapbook" | "before-after"

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

/**
 * Scrapbook tilt cycle, in degrees: deterministic (the album lays the same
 * way every render) and tuned so neighbors never share an angle or lean the
 * same way twice in a row.
 */
const SCRAPBOOK_TILTS = [-3.2, 2.1, -1.4, 3.4, -2.6, 1.6, -3.6, 2.9]

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
                            Before
                        </span>
                        <span className={`${styles.compareChip} ${styles.compareChipAfter}`} aria-hidden>
                            After
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
    onOpen,
}: {
    item: MarketingGalleryItem
    index: number
    figureClass: string
    frameClass: string
    frameStyle: React.CSSProperties
    captionClass: string
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
            {item.caption !== undefined ? (
                <figcaption className={captionClass}>{item.caption}</figcaption>
            ) : null}
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
 * degrades to a plain photo). `fullBleed`
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
                    before !== undefined
                        ? item.caption !== undefined
                            ? `After — ${item.caption}`
                            : "After"
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
                    caption: item.caption !== undefined ? `Before — ${item.caption}` : "Before",
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
