import { globalStyle, style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { scaledSpace } from "./theme/feelBridge"
import {
    ATOMIC_ROOT,
    MIRRORBALL_ROOT,
    ZINE_ROOT,
    captionFontStack,
    MASKING_TAPE,
    TAPED_ROOT,
    TAPE_CLIP,
    emojiPanel,
    mediaImage,
    scriptFont,
    section,
    sectionHeaderCentered,
    sectionKicker,
    sectionTitle,
    spot1,
    spot2,
    zineLabel,
    LARIAT_ROOT,
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
 * `sequence` + `captionStack` — the photographer's stack: an unheaded stack
 * starts flush under whatever precedes it and its frames abut. The
 * `band-*` modes hang each caption under its frame as a full-width band of
 * the page ground set small in the page ink — a museum label under each
 * print, at a readable measure (`bandFigure`, `bandCaption`); the
 * `overlay-*` modes set it over the photograph's foot (`overlayFigure`,
 * `overlayCaption`, below).
 */
export const stackWrapFlush = style({
    paddingTop: 0,
})

export const bandFigure = style({
    gap: 0,
})

// A portrait stack's frame caps at 92vh, so wide viewports crop every photo
// top and bottom; hold the crop in the upper third, where the faces are.
globalStyle(`${bandFigure} img`, { objectPosition: "50% 28%" })

export const bandCaption = style({
    boxSizing: "border-box",
    width: "100%",
    margin: 0,
    padding: `${scaledSpace(15)} max(24px, calc((100% - 760px) / 2))`,
    background: marketing.color.pageBg,
    color: marketing.color.text,
    fontFamily: marketing.font.body,
    fontSize: 16.5,
    lineHeight: 1.5,
    letterSpacing: "0.01em",
    textAlign: "center",
    "@media": {
        "(max-width: 640px)": { fontSize: 15 },
    },
})

/**
 * `covers` — the record wall: square sleeves four across (two on phones),
 * tight gutters, and the artist over the album title in small type under
 * each sleeve, left-set like a discography.
 */
export const covers = style({
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    columnGap: scaledSpace(18),
    rowGap: scaledSpace(30),
    textAlign: "left",
    "@media": {
        "(max-width: 640px)": { gridTemplateColumns: "repeat(2, minmax(0, 1fr))", columnGap: 12, rowGap: 22 },
    },
})

export const coverFigure = style({
    display: "flex",
    flexDirection: "column",
    gap: 10,
    margin: 0,
    minWidth: 0,
})

export const coverSleeve = style({
    position: "relative",
    aspectRatio: "1",
    overflow: "hidden",
    borderRadius: marketing.shape.radiusCard,
})

export const coverCaption = style({
    display: "flex",
    flexDirection: "column",
    fontSize: 14,
    lineHeight: 1.4,
    color: marketing.color.text,
})

export const coverLine = style({
    display: "block",
})

export const bandCaptionStart = style({
    paddingInline: `max(24px, calc((100% - ${marketing.layout.maxWidth}) / 2 + 24px))`,
    textAlign: "left",
})

/**
 * `captionStack` `overlay-*`: each caption is a small uppercase line over
 * the foot of its photograph on a soft scrim — a location slate burned
 * into the frame.
 */
export const overlayFigure = style({
    position: "relative",
    gap: 0,
})

export const overlayCaption = style({
    position: "absolute",
    insetInline: 0,
    bottom: 0,
    boxSizing: "border-box",
    margin: 0,
    padding: `${scaledSpace(56)} max(20px, calc((100% - ${marketing.layout.maxWidth}) / 2 + 24px)) ${scaledSpace(22)}`,
    background: "linear-gradient(to top, rgba(8, 10, 14, 0.5), rgba(8, 10, 14, 0))", // theme-exempt: a scrim over photography, the same in every theme
    color: "#ffffff", // theme-exempt: caption type over photography stays light on the scrim in every theme
    fontFamily: marketing.font.body,
    fontSize: 12.5,
    lineHeight: 1.45,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    textAlign: "left",
    pointerEvents: "none",
    "@media": {
        "(max-width: 640px)": { fontSize: 11, letterSpacing: "0.1em" },
    },
})

export const overlayCaptionCenter = style({
    textAlign: "center",
})

/**
 * A stack caption with a `detail`: the caption and its particulars as two
 * lines — the caption as set above, the detail under it a step smaller and
 * quieter, in the same voice.
 */
export const stackCaptionLine = style({
    display: "block",
})

export const stackCaptionDetail = style({
    display: "block",
    marginTop: 4,
    fontSize: "0.86em",
    opacity: 0.82,
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
    selectors: {
        // The proof stays in full color under the riso separation: a
        // before/after re-inked in two drums would stop being evidence.
        [`[data-marketing-treatment~="two-ink"] ${compareFrame} &`]: { filter: "none" },
    },
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

/*
 * `contact-sheet`: a 35mm roll printed as a contact sheet. The sheet and
 * film base are photographic constants — a contact print is black paper
 * and dark film in every theme (the full-bleed scrim's precedent) — so
 * they are fixed colors; the editor's grease pencil takes the register's
 * accent, lifted toward white so it holds on the black. Segments sit
 * shoulder to shoulder (no column gap) so each row's sprocket bands read
 * as one continuous strip; rows are separated by a strip of black paper.
 */
const FILM_BASE = "#1b1916" // theme-exempt: developed film base on a contact print
const SPROCKETS = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='12'%3E%3Crect x='5' y='2.5' width='10' height='7' rx='1.6' fill='%23050505'/%3E%3C/svg%3E")`
const EDGE_INK = "rgba(226, 180, 104, 0.82)" // theme-exempt: the stock's edge print, exposed onto the film at the factory
const EDGE_FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif" // theme-exempt: factory edge print, not the page's type
const GREASE_PENCIL = `color-mix(in srgb, ${marketing.color.accent} 86%, #ffffff)` // theme-exempt: lifts the accent so the pencil holds on black film
const MARKER_FONT = "'Permanent Marker', 'Marker Felt', 'Bradley Hand', 'Segoe Print', cursive" // theme-exempt: the editor's hand, not the page's type

export const sheet = style({
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    columnGap: 0,
    rowGap: 14,
    background: "#0c0b0a", // theme-exempt: contact paper prints black
    padding: "18px 16px 10px",
    textAlign: "left",
    "@media": {
        "(max-width: 980px)": { gridTemplateColumns: "repeat(3, minmax(0, 1fr))" },
        "(max-width: 640px)": { gridTemplateColumns: "repeat(2, minmax(0, 1fr))", padding: "12px 8px 6px" },
    },
})

export const sheetFrame = style({
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    margin: 0,
})

export const sheetStrip = style({
    display: "flex",
    flexDirection: "column",
    background: FILM_BASE,
})

export const sheetNumber = style({
    fontFamily: EDGE_FONT,
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1,
    color: EDGE_INK,
    padding: "6px 10px 3px",
    "@media": {
        "(max-width: 640px)": { fontSize: 11, padding: "5px 8px 2px" },
    },
})

export const sheetSprockets = style({
    display: "block",
    height: 12,
    backgroundImage: SPROCKETS,
    backgroundRepeat: "repeat-x",
    backgroundPosition: "center",
})

export const sheetExposure = style({
    position: "relative",
    aspectRatio: "4 / 3",
    margin: "3px 6px",
    borderRadius: 2,
    background: "#000000", // theme-exempt: unexposed frame
})

export const sheetButton = style({
    position: "absolute",
    inset: 0,
    display: "block",
    width: "100%",
    height: "100%",
    padding: 0,
    border: "none",
    background: "none",
    cursor: "zoom-in",
    borderRadius: 2,
    overflow: "hidden",
    selectors: {
        "&:focus-visible": { outline: `2px solid ${GREASE_PENCIL}`, outlineOffset: 2 },
    },
})

export const sheetImg = style({
    // Pinned to the exposure so a portrait's intrinsic height can't
    // stretch the uniform frame (the roll crops every exposure alike).
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    // Portrait frames keep their faces when the roll crops them square-ish.
    objectPosition: "50% 30%",
    display: "block",
    borderRadius: 2,
    transition: "filter 200ms ease",
    selectors: {
        [`${sheetButton}:hover &`]: { filter: "brightness(1.08)" },
    },
})

export const sheetMark = style({
    position: "absolute",
    inset: "-10% -8%",
    width: "116%",
    height: "120%",
    color: GREASE_PENCIL,
    pointerEvents: "none",
    overflow: "visible",
    filter: "drop-shadow(0 0 1px rgba(0, 0, 0, 0.6))",
})

export const sheetEdge = style({
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    fontFamily: EDGE_FONT,
    fontSize: 10.5,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    overflow: "hidden",
    color: EDGE_INK,
    padding: "2px 10px 5px",
    "@media": {
        "(max-width: 640px)": { fontSize: 9, letterSpacing: "0.06em", padding: "2px 8px 4px" },
    },
})

export const sheetNote = style({
    minHeight: 34,
    fontFamily: MARKER_FONT,
    fontSize: 19,
    lineHeight: 1.15,
    color: GREASE_PENCIL,
    padding: "6px 8px 0",
    textAlign: "center",
    transform: "rotate(-2.5deg)",
    "@media": {
        "(max-width: 640px)": { fontSize: 15, minHeight: 28 },
    },
})

/*
 * `atomic` (midcentury): the case files. Each pair is a numbered file —
 * square frames, the "before" chip in ink on the stock and the "after"
 * chip in the mustard, the caption set as tracked caps under a hairline
 * with its file number in the burnt-orange ink.
 */
globalStyle(`${ATOMIC_ROOT} ${compare}`, {
    gap: `${scaledSpace(40)} ${scaledSpace(28)}`,
    counterReset: "atomic-file",
})

globalStyle(`${ATOMIC_ROOT} ${compareFigure}`, {
    gap: 12,
    counterIncrement: "atomic-file",
})

globalStyle(`${ATOMIC_ROOT} ${compareFrame}`, {
    borderRadius: 0,
})

globalStyle(`${ATOMIC_ROOT} ${compareChip}`, {
    top: 12,
    borderRadius: 0,
    padding: "4px 10px 3px",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.2em",
})

globalStyle(`${ATOMIC_ROOT} ${compareChipBefore}`, {
    left: 12,
    color: marketing.color.text,
    background: marketing.color.pageBg,
})

globalStyle(`${ATOMIC_ROOT} ${compareChipAfter}`, {
    right: 12,
    color: marketing.color.text,
    background: marketing.color.accent,
})

globalStyle(`${ATOMIC_ROOT} ${compareFigure} ${caption}`, {
    display: "flex",
    alignItems: "baseline",
    gap: 12,
    paddingTop: 10,
    borderTop: `1px solid ${marketing.color.line}`,
    fontSize: 12.5,
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: marketing.color.text,
})

globalStyle(`${ATOMIC_ROOT} ${compareFigure} ${caption}::before`, {
    content: "counter(atomic-file, decimal-leading-zero)",
    flex: "none",
    fontFamily: marketing.font.display,
    fontWeight: marketing.display.weight,
    fontSize: 15,
    letterSpacing: "0.04em",
    color: spot1,
})

/**
 * `photo-strip` — photo-booth strips: four square frames stacked in an ink
 * border with the booth's deeper foot, laid side by side at alternating
 * resting tilts (`--mk-tilt`, set by the component). The strip's label is
 * taped over its top; its caption sits under it. Hover straightens a strip.
 */
export const strips = style({
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: `${scaledSpace(36)} ${scaledSpace(40)}`,
    padding: "18px 0 8px",
    textAlign: "center",
})

export const stripFigure = style({
    position: "relative",
    width: "clamp(140px, 19%, 214px)",
    margin: 0,
    transform: "rotate(var(--mk-tilt, 0deg))",
    transition: "transform 220ms ease",
    selectors: {
        "&:hover": { transform: "rotate(0deg) scale(1.02)", zIndex: 1 },
    },
    "@media": {
        "(prefers-reduced-motion: reduce)": { transition: "none" },
        "(max-width: 640px)": { width: "clamp(130px, 42%, 190px)" },
    },
})

export const stripFilm = style({
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: "9px 9px 26px",
    background: marketing.color.text,
    boxShadow: marketing.shape.shadowCard,
})

export const stripFrame = style({
    position: "relative",
    aspectRatio: "1 / 1",
    overflow: "hidden",
})

export const stripImg = style({
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "cover",
})

export const stripNote = style({
    position: "absolute",
    zIndex: 1,
    top: -14,
    left: "50%",
    maxWidth: "110%",
    fontSize: 11.5,
    fontWeight: 700,
    letterSpacing: "0.06em",
    lineHeight: 1.25,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    color: marketing.color.onAccent,
    background: marketing.color.accent,
    padding: "6px 10px",
    transform: "translateX(-50%) rotate(-3deg)",
})

export const stripCaption = style({
    marginTop: 14,
    fontFamily: captionFontStack,
    fontSize: 13,
    lineHeight: 1.4,
    color: marketing.color.subtle,
})

// zine: the strip labels are cobalt label-maker tags; captions in marker.
globalStyle(`${ZINE_ROOT} ${stripNote}`, { ...zineLabel, fontSize: 11.5 })

globalStyle(`${ZINE_ROOT} ${stripCaption}`, {
    fontFamily: marketing.font.display,
    fontSize: 19,
    lineHeight: 1.15,
    textTransform: "uppercase",
    color: marketing.color.text,
})

// mirrorball: gilt strips — the film gold-edged, the label a foil tag.
globalStyle(`${MIRRORBALL_ROOT} ${stripFilm}`, { outline: `1px solid ${spot2}`, outlineOffset: 3 })

globalStyle(`${MIRRORBALL_ROOT} ${stripNote}`, { color: marketing.color.pageBg, background: spot2 })

globalStyle(`${MIRRORBALL_ROOT} ${stripCaption}`, { color: spot1 })

// mirrorball: the decades wall hangs three to a row, the captions clear of
// the neighbor's overlap.
globalStyle(`${MIRRORBALL_ROOT} ${scrapbookFigure}`, {
    "@media": {
        "(min-width: 641px)": { width: "clamp(220px, 31%, 340px)" },
    },
})

globalStyle(`${MIRRORBALL_ROOT} ${scrapbookCaption}`, { padding: "0 12px" })

/*
 * `taped` scrapbook: the fridge door. Lab prints in the landscape frame
 * they came back in, a wide border, a torn strip of masking tape, and the
 * caption written under the photo in marker.
 */
globalStyle(`${TAPED_ROOT} ${scrapbook}`, {
    rowGap: scaledSpace(44),
    columnGap: scaledSpace(6),
    padding: "24px 0 12px",
})

globalStyle(`${TAPED_ROOT} ${scrapbookFigure}`, {
    width: "clamp(220px, 23.4%, 290px)",
    margin: "0 2px",
    padding: "11px 11px 2px",
    gap: 4,
    border: "none",
    borderRadius: 2,
})

globalStyle(`${TAPED_ROOT} ${scrapbookFigure}::before`, {
    top: -14,
    width: "40%",
    height: 28,
    background: MASKING_TAPE,
    clipPath: TAPE_CLIP,
    transform: "translateX(-50%) rotate(-3deg)",
})

globalStyle(`${TAPED_ROOT} ${scrapbookFigure}:nth-child(even)::before`, {
    transform: "translateX(-50%) rotate(4deg)",
})

globalStyle(`${TAPED_ROOT} ${mediaScrapbook}`, {
    aspectRatio: "4 / 3",
    padding: 0,
    borderRadius: 0,
    boxShadow: "none",
})

globalStyle(`${TAPED_ROOT} ${scrapbookCaption}`, {
    fontFamily: scriptFont,
    fontSize: 20,
    lineHeight: 1.2,
    fontStyle: "normal",
    color: marketing.color.text,
    padding: "6px 4px 10px",
})

globalStyle(`${TAPED_ROOT} ${scrapbookFigure}`, {
    "@media": {
        "(max-width: 640px)": { width: "clamp(160px, 47%, 260px)", padding: "7px 7px 0" },
    },
})

globalStyle(`${TAPED_ROOT} ${scrapbookCaption}`, {
    "@media": {
        "(max-width: 640px)": { fontSize: 16, padding: "4px 2px 8px" },
    },
})

/*
 * `lariat` scrapbook: cabinet cards pinned up with a leather strap, the
 * caption set in the slab's italic.
 */
globalStyle(`${LARIAT_ROOT} ${scrapbookFigure}`, {
    border: `2px solid ${marketing.color.text}`,
    borderRadius: 2,
})

globalStyle(`${LARIAT_ROOT} ${scrapbookFigure}::before`, {
    top: -12,
    width: 64,
    height: 22,
    background: `color-mix(in srgb, ${marketing.color.accent} 78%, ${marketing.color.text})`,
    transform: "translateX(-50%)",
    outline: `1px dashed color-mix(in srgb, ${marketing.color.pageBg} 60%, transparent)`,
    outlineOffset: -4,
})

globalStyle(`${LARIAT_ROOT} ${scrapbookCaption}`, {
    fontSize: 14.5,
    fontStyle: "italic",
    color: marketing.color.text,
})

globalStyle(`${LARIAT_ROOT} ${scrapbook}`, { rowGap: scaledSpace(40), columnGap: scaledSpace(10) })

globalStyle(`${LARIAT_ROOT} ${scrapbookFigure}`, {
    width: "clamp(220px, 31%, 360px)",
    margin: "0 4px",
    "@media": {
        "(max-width: 640px)": { width: "clamp(160px, 47%, 260px)", margin: "0 2px" },
    },
})

globalStyle(`${LARIAT_ROOT} ${mediaScrapbook}`, { aspectRatio: "4 / 3" })
