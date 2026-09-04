import { style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { scaledSpace } from "./theme/feelBridge"
import {
    emojiPanel,
    mediaImage,
    section,
    sectionHeaderCentered,
    sectionKicker,
    sectionTitle,
} from "./shared.css"

export const wrap = style([section, sectionHeaderCentered])

export const kicker = sectionKicker

export const title = sectionTitle

export const grid = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: scaledSpace(18),
    textAlign: "left",
})

export const masonry = style({
    columnCount: 3,
    columnGap: scaledSpace(18),
    textAlign: "left",
    "@media": {
        "(max-width: 980px)": { columnCount: 2 },
        "(max-width: 640px)": { columnCount: 1 },
    },
})

export const figure = style({
    display: "flex",
    flexDirection: "column",
    gap: 8,
    margin: 0,
})

export const figureMasonry = style({
    breakInside: "avoid",
    marginBottom: 18,
})

export const mediaEmoji = style([
    emojiPanel,
    {
        fontSize: 48,
        minHeight: 180,
    },
])

export const mediaImg = mediaImage

/** The uniform grid crops everything to one aspect so rows stay level. */
export const mediaUniform = style({
    aspectRatio: "4 / 3",
    minHeight: 0,
    objectFit: "cover",
})

export const caption = style({
    fontSize: 13.5,
    lineHeight: 1.5,
    color: marketing.color.subtle,
})

/** Unstyled click target wrapping a grid image when the lightbox is on. */
export const mediaButton = style({
    display: "block",
    width: "100%",
    padding: 0,
    border: "none",
    background: "none",
    cursor: "zoom-in",
    textAlign: "inherit",
})

/**
 * Justified rows — the photographer's layout. Each cell's flex math comes
 * from its photo's aspect ratio (set inline), so natural shapes level into
 * even rows in the author's own order; masonry's column flow would scramble
 * a deliberately sequenced portfolio.
 */
export const justified = style({
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    textAlign: "left",
})

/** Breaks the grid out of the page column to the viewport edges. */
export const gridBleed = style({
    width: "100vw",
    marginLeft: "calc(50% - 50vw)",
})

export const justifiedFigure = style({
    position: "relative",
    margin: 0,
    minWidth: 0,
    overflow: "hidden",
    borderRadius: marketing.shape.radiusCard,
})

export const justifiedButton = style({
    display: "block",
    width: "100%",
    height: "100%",
    padding: 0,
    border: "none",
    background: "none",
    cursor: "zoom-in",
})

export const justifiedImg = style({
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
})

/** Caption as a hover scrim so the row geometry stays photographic. */
export const justifiedCaption = style({
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    margin: 0,
    padding: "24px 12px 10px",
    fontSize: 12.5,
    lineHeight: 1.4,
    color: "rgba(255, 255, 255, 0.92)",
    background: "linear-gradient(180deg, transparent 0%, rgba(8, 10, 14, 0.62) 100%)",
    opacity: 0,
    transition: "opacity 160ms ease",
    pointerEvents: "none",
    selectors: {
        [`${justifiedFigure}:hover &, ${justifiedFigure}:focus-within &`]: { opacity: 1 },
    },
    "@media": {
        "(prefers-reduced-motion: reduce)": { transition: "none" },
    },
})

/** Fill-the-frame media treatment shared by the framed variants. */
export const frameImg = justifiedImg

/** Unstyled click target filling a frame when the lightbox is on. */
export const frameButton = justifiedButton

/**
 * `sequence` — the editorial pacing: one photograph per frame, stacked in
 * the author's order, each frame sized from its photo's own shape (inline
 * aspect-ratio) and capped near viewport height. No scroll hijacking: the
 * pacing comes from frame scale, not snap machinery.
 */
export const sequence = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: scaledSpace(56),
    textAlign: "left",
})

export const sequenceFigure = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    margin: 0,
    maxWidth: "100%",
    minWidth: 0,
})

export const sequenceFrame = style({
    position: "relative",
    maxWidth: "100%",
    overflow: "hidden",
    borderRadius: marketing.shape.radiusCard,
})

/**
 * `sequence` + `fullBleed` — the slide-show read: each figure spans the
 * bled track edge to edge (the frame's viewport-height cap and cover-crop
 * ride inline, from the photo's own ratio), and the print corners square
 * off — an edge-to-edge frame with a radius reads as UI, not projection.
 */
export const sequenceBleed = style({
    // Contiguous slides: the projection reads as one reel, not stacked
    // prints, so the page never shows through between frames.
    gap: 0,
})

export const sequenceBleedFigure = style({
    width: "100%",
})

export const sequenceBleedFrame = style({
    borderRadius: 0,
})

export const sequenceCaption = style({
    fontSize: 13,
    lineHeight: 1.5,
    color: marketing.color.subtle,
    textAlign: "center",
})

/**
 * `filmstrip` — the frames along a scroll-snapped horizontal rail (the
 * carousel's pure-CSS pattern): every cell shares the strip height and
 * takes its width from the photo's own shape, so the strip reads like a
 * contact strip of sequenced frames.
 */
export const filmstrip = style({
    display: "flex",
    gap: 10,
    overflowX: "auto",
    scrollSnapType: "x proximity",
    scrollBehavior: "smooth",
    scrollPadding: 4,
    padding: "4px 4px 16px",
    textAlign: "left",
    "@media": {
        "(prefers-reduced-motion: reduce)": { scrollBehavior: "auto" },
    },
})

export const filmstripFigure = style({
    display: "flex",
    flexDirection: "column",
    gap: 8,
    margin: 0,
    flex: "0 0 auto",
    scrollSnapAlign: "start",
})

export const filmstripFrame = style({
    position: "relative",
    height: "clamp(300px, 52vh, 480px)",
    maxWidth: "88vw",
    overflow: "hidden",
    borderRadius: marketing.shape.radiusCard,
})

export const filmstripCaption = style({
    fontSize: 12.5,
    lineHeight: 1.4,
    color: marketing.color.subtle,
})

/**
 * `scrapbook` — taped prints at resting tilts, slightly overlapped: the
 * tour-book/party-album voice shared by the kinetic registers. Each print
 * is a matted card (surface + shadow) rotated by its `--mk-tilt` custom
 * property (set deterministically by the component); a translucent tape
 * strip sits over the top edge. Hover straightens the print — a kinetic
 * flourish that reduced-motion turns off.
 */
export const scrapbook = style({
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    rowGap: scaledSpace(28),
    columnGap: 0,
    textAlign: "left",
    // Rotated neighbors need somewhere to lean.
    padding: "12px 0",
})

export const scrapbookFigure = style({
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    width: "clamp(200px, 27%, 300px)",
    // Prints overlap like they were laid down by hand, not typeset.
    margin: "0 -10px",
    padding: "10px 10px 12px",
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    boxShadow: marketing.shape.shadowCard,
    transform: "rotate(var(--mk-tilt, 0deg))",
    transition: "transform 220ms ease",
    selectors: {
        "&:hover": { transform: "rotate(0deg) scale(1.02)", zIndex: 1 },
        // The tape: translucent ink so it reads on warm paper and midnight
        // ground alike, skewed a touch so it looks pressed on, not printed.
        "&::before": {
            content: "",
            position: "absolute",
            top: -10,
            left: "50%",
            width: 76,
            height: 20,
            transform: "translateX(-50%) skewX(-8deg)",
            background: `color-mix(in srgb, ${marketing.color.text} 12%, transparent)`,
            pointerEvents: "none",
        },
    },
    "@media": {
        "(prefers-reduced-motion: reduce)": { transition: "none" },
        "(max-width: 640px)": { width: "clamp(180px, 44%, 260px)" },
    },
})

/**
 * Every print in the album is the same portrait frame, the photo filling
 * its full height: prints come back from the lab in one size, and mixed
 * natural ratios left landscape shots as short strips between tall
 * neighbors — the tape and tilt read as a bug, not a composition.
 */
export const mediaScrapbook = style({
    aspectRatio: "4 / 5",
    minHeight: 0,
    objectFit: "cover",
})

/** Handwritten-adjacent when the register's accent style is italic. */
export const scrapbookCaption = style({
    fontSize: 13,
    lineHeight: 1.45,
    color: marketing.color.subtle,
    textAlign: "center",
    fontStyle: marketing.display.accentStyle as "italic",
})

/**
 * `before-after` — the transformation as direct manipulation: the finished
 * "after" underneath, the "before" clipped to a draggable divider above it.
 * The reveal position rides the `--mk-reveal` custom property (set by the
 * component from an invisible full-frame range input, so pointer drag and
 * keyboard arrows are the same control). Frames sit two-up where the width
 * allows; each wants room for the drag, so the floor is generous.
 */
export const compare = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(420px, 100%), 1fr))",
    gap: scaledSpace(24),
    textAlign: "left",
})

export const compareFigure = style({
    display: "flex",
    flexDirection: "column",
    gap: 8,
    margin: 0,
    minWidth: 0,
})

export const compareFrame = style({
    position: "relative",
    overflow: "hidden",
    borderRadius: marketing.shape.radiusCard,
    // The drag is horizontal; leave vertical gestures to the page.
    touchAction: "pan-y",
    selectors: {
        "&:has(:focus-visible)": {
            outline: `2px solid ${marketing.color.accent}`,
            outlineOffset: 2,
        },
    },
})

export const compareImg = style({
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
})

/**
 * The before layer clips at the divider but its image spans the FULL
 * frame, so the two photographs stay registered — the divider uncovers
 * the after, it never squeezes the before.
 */
export const compareBeforeClip = style({
    position: "absolute",
    inset: 0,
    clipPath: "inset(0 calc(100% - var(--mk-reveal, 50%)) 0 0)",
})

/** The whole frame is the slider: invisible, but it IS the interaction. */
export const compareRange = style({
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    margin: 0,
    padding: 0,
    opacity: 0,
    appearance: "none",
    cursor: "ew-resize",
})

export const compareDivider = style({
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "var(--mk-reveal, 50%)",
    width: 2,
    transform: "translateX(-50%)",
    background: "rgba(255, 255, 255, 0.92)",
    boxShadow: "0 0 8px rgba(8, 10, 14, 0.45)",
    pointerEvents: "none",
})

export const compareHandle = style({
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 38,
    height: 38,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    background: "rgba(255, 255, 255, 0.94)",
    color: "#16140f", // theme-exempt: glyph on the white handle floating over the photograph — same ink in every theme
    boxShadow: "0 2px 10px rgba(8, 10, 14, 0.4)",
})

/** Corner labels so the halves read without dragging. */
export const compareChip = style({
    position: "absolute",
    top: 10,
    padding: "3px 10px",
    borderRadius: marketing.shape.radiusControl,
    fontSize: 11.5,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "rgba(255, 255, 255, 0.94)",
    background: "rgba(10, 12, 16, 0.55)",
    pointerEvents: "none",
})

export const compareChipBefore = style({ left: 10 })

export const compareChipAfter = style({ right: 10 })

/**
 * The lightbox affordance on a comparison frame: a corner button, because
 * a click anywhere else IS the drag. Bottom corner — the chips own the top
 * ones. Revealed on hover/focus (always on coarse pointers, where there is
 * no hover), and stacked above the invisible range input so it stays
 * clickable.
 */
export const compareExpand = style({
    position: "absolute",
    right: 10,
    bottom: 10,
    zIndex: 1,
    width: 32,
    height: 32,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    border: "1px solid rgba(255, 255, 255, 0.85)",
    background: "rgba(10, 12, 16, 0.45)",
    color: "rgba(255, 255, 255, 0.95)",
    cursor: "zoom-in",
    opacity: 0,
    transition: "opacity 140ms ease, background 140ms ease",
    selectors: {
        [`${compareFigure}:hover &, ${compareFigure}:focus-within &`]: { opacity: 1 },
        "&:focus-visible": { opacity: 1 },
        "&:hover": { background: "rgba(10, 12, 16, 0.72)" },
    },
    "@media": {
        "(hover: none)": { opacity: 1 },
        "(prefers-reduced-motion: reduce)": { transition: "none" },
    },
})

/**
 * Absorbs the leftover width of a sparse final row so its photos keep
 * their natural size instead of stretching to fill.
 */
export const justifiedSpacer = style({
    flexGrow: 999999,
    flexBasis: 0,
    height: 0,
})

/**
 * Selection mode (client proofing): the check toggle floats over the cell's
 * corner. Always visible when selected; otherwise revealed on hover/focus
 * (and always on coarse pointers, where there is no hover).
 */
export const selectToggle = style({
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    border: "1px solid rgba(255, 255, 255, 0.85)",
    background: "rgba(10, 12, 16, 0.45)",
    color: "rgba(255, 255, 255, 0.95)",
    cursor: "pointer",
    opacity: 0,
    transition: "opacity 140ms ease, background 140ms ease",
    selectors: {
        [`${justifiedFigure}:hover &, ${justifiedFigure}:focus-within &`]: { opacity: 1 },
        "&:focus-visible": { opacity: 1 },
    },
    "@media": {
        "(hover: none)": { opacity: 1 },
        "(prefers-reduced-motion: reduce)": { transition: "none" },
    },
})

export const selectToggleSelected = style({
    opacity: 1,
    background: marketing.color.accent,
    borderColor: marketing.color.accent,
    color: marketing.color.onAccent,
})

/** A selected cell keeps an inset ring so the state reads at grid scale. */
export const justifiedFigureSelected = style({
    // The ring is an overlay pseudo-element: an inset box-shadow on the
    // figure itself would paint underneath the photograph.
    selectors: {
        "&::after": {
            content: "",
            position: "absolute",
            inset: 0,
            borderRadius: marketing.shape.radiusCard,
            boxShadow: `inset 0 0 0 3px ${marketing.color.accent}`,
            pointerEvents: "none",
        },
    },
})

/** The image dips slightly behind the ring so the mark reads instantly. */
export const justifiedImgSelected = style({
    opacity: 0.86,
    transform: "scale(0.985)",
    transition: "opacity 140ms ease, transform 140ms ease",
    "@media": {
        "(prefers-reduced-motion: reduce)": { transition: "none", transform: "none" },
    },
})
