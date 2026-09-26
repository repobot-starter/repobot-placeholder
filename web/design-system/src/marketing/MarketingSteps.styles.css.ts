import { globalStyle, style } from "@vanilla-extract/css"
import { ATOMIC_ROOT, pulpExtrude, spot1, spot2 } from "./shared.css"
import { marketing } from "./theme/marketingTheme.css"
import { scaledSpace } from "./theme/feelBridge"
import {
    MASKING_TAPE,
    TAPED_ROOT,
    TAPE_CLIP,
    captionFontStack,
    scriptFont,
    section,
    sectionHeaderCentered,
    sectionKicker,
    sectionTitle,
    sectionTitleDisplay,
    LARIAT_ROOT,
} from "./shared.css"

export const wrap = style([section, sectionHeaderCentered])

export const kicker = sectionKicker

export const title = sectionTitle

export const row = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: scaledSpace(18),
    textAlign: "left",
})

export const card = style({
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
    padding: `${scaledSpace(26)} ${scaledSpace(22)} ${scaledSpace(24)}`,
})

export const number = style({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 34,
    height: 34,
    borderRadius: "50%",
    fontWeight: 700,
    color: marketing.color.onAccent,
    background: marketing.color.accent,
    marginBottom: 14,
})

export const timeline = style({
    listStyle: "none",
    display: "flex",
    flexDirection: "column",
    gap: scaledSpace(30),
    maxWidth: 640,
    margin: "0 auto",
    padding: 0,
    textAlign: "left",
})

export const timelineItem = style({
    position: "relative",
    paddingLeft: 56,
    selectors: {
        // The rail connecting one step's dot to the next.
        "&:not(:last-child)::after": {
            content: '""',
            position: "absolute",
            left: 16,
            top: 40,
            // Tracks the scaled timeline gap so the rail still reaches
            // toward the next dot at every density.
            bottom: `calc(-1 * ${scaledSpace(24)})`,
            width: marketing.shape.borderWidth,
            background: marketing.color.line,
        },
    },
})

export const timelineDot = style({
    position: "absolute",
    left: 0,
    top: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 34,
    height: 34,
    borderRadius: "50%",
    fontWeight: 700,
    color: marketing.color.onAccent,
    background: marketing.color.accent,
})

/*
 * `horizontal-rail`: the build log. A wide left-aligned header (a rail
 * reads left to right, so the header starts where the line does), then the
 * steps as equal columns hung from one hairline. Narrow screens turn the
 * row into a scroll-snapped strip with the next card peeking in.
 */
export const wrapRail = style([section, { textAlign: "left" }])

export const titleRail = sectionTitleDisplay

const railGap = scaledSpace(24)

export const rail = style({
    listStyle: "none",
    display: "grid",
    gridAutoFlow: "column",
    gridAutoColumns: "minmax(0, 1fr)",
    gap: railGap,
    margin: 0,
    padding: 0,
    "@media": {
        "(max-width: 860px)": {
            gridAutoColumns: "min(300px, 78%)",
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            scrollPaddingLeft: 0,
            paddingBottom: 12,
            // Bleed the strip to the viewport edge so cards scroll off the
            // side instead of being clipped by the page gutter.
            marginRight: "calc(50% - 50vw)",
            paddingRight: 24,
        },
    },
})

export const railItem = style({
    position: "relative",
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    scrollSnapAlign: "start",
    selectors: {
        // The connecting line: each item draws its span across the gap to
        // the next mark, so the line stays continuous inside a scroller
        // (a single container-wide rule would stop at the visible width).
        "&::before": {
            content: '""',
            position: "absolute",
            top: 5,
            left: 0,
            right: `calc(-1 * ${railGap})`,
            height: marketing.shape.borderWidth,
            background: marketing.color.line,
        },
        "&:last-child::before": { right: 0 },
    },
})

export const railMark = style({
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: scaledSpace(18),
})

export const railDot = style({
    flexShrink: 0,
    width: 11,
    height: 11,
    borderRadius: "50%",
    boxSizing: "border-box",
    border: `1.5px solid ${marketing.color.accent}`,
    background: marketing.color.pageBg,
})

/** A step's `icon`, set on the line in place of the dot: a small disc centered on the rule. */
export const railIcon = style({
    flexShrink: 0,
    width: 38,
    height: 38,
    marginTop: -13,
    borderRadius: "50%",
    boxSizing: "border-box",
    display: "grid",
    placeItems: "center",
    border: `1.5px solid ${marketing.color.accent}`,
    background: marketing.color.pageBg,
    color: marketing.color.accent,
})

export const railLabel = style({
    fontFamily: captionFontStack,
    fontSize: 11.5,
    lineHeight: 1,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: marketing.color.accent,
})

export const railMedia = style({
    aspectRatio: "4 / 3",
    overflow: "hidden",
    borderRadius: marketing.shape.radiusCard,
    background: marketing.color.surface,
    marginBottom: scaledSpace(16),
})

export const railImg = style({
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
})

export const railTitle = style({
    fontFamily: marketing.font.display,
    fontSize: 19,
    fontWeight: marketing.display.weight,
    letterSpacing: marketing.display.tracking,
    lineHeight: 1.25,
    color: marketing.color.text,
    margin: "0 0 8px",
})

/** The time a rail step takes, under its title. */
export const railDuration = style({
    fontSize: 13.5,
    letterSpacing: "0.04em",
    color: marketing.color.subtle,
    margin: "2px 0 8px",
})

export const stepTitle = style({
    fontFamily: marketing.font.display,
    fontSize: 17,
    fontWeight: 700,
    color: marketing.color.text,
    margin: "0 0 8px",
})

export const stepDescription = style({
    fontSize: 14.5,
    lineHeight: 1.6,
    color: marketing.color.subtle,
    margin: 0,
})

/*
 * The photographic timeline (any step with a photograph): a day sheet.
 * Three columns on desktop — the step's mark on the line, the copy, the
 * photographs — with the line running down the mark column through every
 * step. Narrow screens keep mark and copy side by side and drop the
 * photographs under the copy.
 */
const markColumn = 112
const markColumnNarrow = 72

export const timelinePhoto = style({
    listStyle: "none",
    display: "flex",
    flexDirection: "column",
    margin: "0 auto",
    padding: 0,
    maxWidth: 1080,
    textAlign: "left",
})

export const timelinePhotoItem = style({
    position: "relative",
    display: "grid",
    gridTemplateColumns: `${markColumn}px minmax(0, 4fr) minmax(0, 7fr)`,
    gridTemplateAreas: '"mark copy media"',
    columnGap: scaledSpace(32),
    alignItems: "start",
    paddingBottom: scaledSpace(44),
    selectors: {
        // The line: down the mark column from this node to the next.
        "&:not(:last-child)::before": {
            content: '""',
            position: "absolute",
            left: markColumn - 6,
            top: 16,
            bottom: 0,
            width: marketing.shape.borderWidth,
            background: marketing.color.line,
        },
        '&:not([data-pictured="true"])': { gridTemplateAreas: '"mark copy copy"' },
    },
    "@media": {
        "(max-width: 860px)": {
            gridTemplateColumns: `${markColumnNarrow}px minmax(0, 1fr)`,
            gridTemplateAreas: '"mark copy" ". media"',
            columnGap: scaledSpace(18),
            rowGap: scaledSpace(14),
            selectors: {
                "&:not(:last-child)::before": { left: markColumnNarrow - 6 },
                '&:not([data-pictured="true"])': { gridTemplateAreas: '"mark copy"' },
            },
        },
    },
})

export const timelineMark = style({
    gridArea: "mark",
    display: "flex",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    minHeight: 32,
})

export const timelineNode = style({
    flex: "none",
    width: 11,
    height: 11,
    marginRight: -11,
    borderRadius: "50%",
    boxSizing: "border-box",
    border: `1.5px solid ${marketing.color.accent}`,
    background: marketing.color.pageBg,
    position: "relative",
})

export const timelineLabel = style({
    fontFamily: marketing.font.display,
    fontSize: 22,
    fontWeight: marketing.display.weight,
    letterSpacing: marketing.display.tracking,
    lineHeight: 1,
    color: marketing.color.text,
    whiteSpace: "nowrap",
    marginRight: 8,
})

export const timelineCopy = style({ gridArea: "copy", paddingTop: 4, minWidth: 0 })

export const timelineTitle = style({
    fontFamily: marketing.font.display,
    fontSize: 20,
    fontWeight: marketing.display.weight,
    letterSpacing: marketing.display.tracking,
    lineHeight: 1.25,
    color: marketing.color.text,
    margin: "0 0 8px",
})

export const timelineDescription = style({})

/** The lead photograph takes the row; its frames share the row beneath. */
export const timelineMedia = style({
    gridArea: "media",
    display: "flex",
    flexWrap: "wrap",
    gap: scaledSpace(10),
    minWidth: 0,
})

export const timelineLead = style({
    flex: "1 1 100%",
    margin: 0,
    aspectRatio: "3 / 2",
    overflow: "hidden",
    borderRadius: marketing.shape.radiusCard,
    background: marketing.color.surface,
})

export const timelineFrame = style({
    flex: "1 1 0",
    minWidth: 0,
    margin: 0,
    aspectRatio: "1",
    overflow: "hidden",
    borderRadius: marketing.shape.radiusCard,
    background: marketing.color.surface,
})

export const timelineImg = style({
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
})

/*
 * `pop` treatment on the rail (memphis): the turnover-day flyer. A dashed ink
 * line, fat spot-ink dots and clock times cut in the display face, each
 * photo a sticker print with a check chip — proof the step is done.
 */
const POP_ROOT = '[data-marketing-treatment~="pop"]'
const POP_INKS = [marketing.color.accent, spot1, spot2] as const
const CHECK_MARK = `url("data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>', // theme-exempt: the check is always white on the accent chip
)}")`

// Desktop frames print 30% larger than the base rail's five-up column: the
// strip scrolls (bleeding to the viewport edge) with the next frame peeking
// in rather than shrinking the photos back to fit. Columns size off the
// section (cqi), since the bleed widens the list itself. The strip paints
// the page ground so gutter ornament never shows behind its copy.
globalStyle(`${POP_ROOT} ${wrapRail}`, { containerType: "inline-size" })

globalStyle(`${POP_ROOT} ${rail}`, {
    "@media": {
        "(min-width: 861px)": {
            gridAutoColumns: `calc((100cqi - 4 * ${railGap}) / 5 * 1.3)`,
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            paddingBottom: 16,
            marginRight: "calc(50% - 50vw)",
            paddingRight: 24,
            background: marketing.color.pageBg,
        },
    },
})

globalStyle(`${POP_ROOT} ${railItem}::before`, {
    top: 9,
    height: 3,
    background: `repeating-linear-gradient(90deg, ${marketing.color.line} 0 10px, transparent 10px 17px)`,
})

globalStyle(`${POP_ROOT} ${railDot}`, {
    width: 21,
    height: 21,
    border: `3px solid ${marketing.color.line}`,
})

globalStyle(`${POP_ROOT} ${railLabel}`, {
    fontFamily: marketing.font.display,
    fontStyle: "italic",
    fontWeight: 900,
    fontSize: "clamp(28px, 2.6vw, 36px)",
    letterSpacing: "-0.01em",
    WebkitTextStroke: `1.5px ${marketing.color.line}`,
    paintOrder: "stroke fill",
    textShadow: `3px 3px 0 ${marketing.color.line}`,
})

POP_INKS.forEach((ink, index) => {
    const nth = `:nth-child(3n + ${index + 1})`
    globalStyle(`${POP_ROOT} ${railItem}${nth} ${railDot}`, { background: ink })
    globalStyle(`${POP_ROOT} ${railItem}${nth} ${railLabel}`, { color: ink })
})

globalStyle(`${POP_ROOT} ${railMedia}`, {
    position: "relative",
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    boxShadow: marketing.shape.shadowCard,
    marginBottom: scaledSpace(20),
})

globalStyle(`${POP_ROOT} ${railMedia}::after`, {
    content: '""',
    position: "absolute",
    right: 8,
    bottom: 8,
    width: 34,
    height: 34,
    boxSizing: "border-box",
    borderRadius: "50%",
    border: `2px solid ${marketing.color.line}`,
    background: `${CHECK_MARK} center / 62% no-repeat, ${marketing.color.accent}`,
    boxShadow: `2px 2px 0 ${marketing.color.line}`,
})

globalStyle(`${POP_ROOT} ${railTitle}`, {
    fontStyle: "italic",
    fontWeight: 900,
    fontSize: 19,
    textTransform: "uppercase",
    letterSpacing: "0.01em",
})

/*
 * `sport` (gameday) on the rail: the season as a fixture list — accent
 * diamonds on an accent line, the months in condensed italic caps, each
 * photo underscored with an accent bar like a broadcast lower third.
 */
const SPORT_ROOT = '[data-marketing-treatment~="sport"]'

globalStyle(`${SPORT_ROOT} ${railItem}::before`, {
    top: 7,
    height: 3,
    background: `linear-gradient(90deg, ${marketing.color.accent}, color-mix(in srgb, ${marketing.color.accent} 35%, transparent))`,
})

globalStyle(`${SPORT_ROOT} ${railDot}`, {
    width: 17,
    height: 17,
    borderRadius: 0,
    border: "none",
    background: marketing.color.accent,
    transform: "rotate(45deg)",
})

globalStyle(`${SPORT_ROOT} ${railLabel}`, {
    fontFamily: marketing.font.display,
    fontStyle: "italic",
    fontWeight: 800,
    fontSize: "clamp(26px, 2.4vw, 34px)",
    letterSpacing: "0.01em",
    color: marketing.color.text,
})

globalStyle(`${SPORT_ROOT} ${railMedia}`, {
    position: "relative",
    boxShadow: marketing.shape.shadowCard,
})

globalStyle(`${SPORT_ROOT} ${railMedia}::after`, {
    content: '""',
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 7,
    background: marketing.color.accent,
})

globalStyle(`${SPORT_ROOT} ${railTitle}`, {
    fontStyle: "italic",
    fontSize: 24,
    lineHeight: 1.05,
    textTransform: "uppercase",
    letterSpacing: "0.01em",
})

/*
 * `pulp` (creature) on the rail: the treatment as a reel of lobby cards —
 * the reel numbers in spot-ink poster caps, accent dots on a cream dashed
 * line, each frame mounted in cream under a dot screen.
 */
const PULP_ROOT = '[data-marketing-treatment~="pulp"]'

globalStyle(`${PULP_ROOT} ${railItem}::before`, {
    top: 8,
    height: 3,
    background: `repeating-linear-gradient(90deg, ${spot2} 0 12px, transparent 12px 20px)`,
})

globalStyle(`${PULP_ROOT} ${railDot}`, {
    width: 19,
    height: 19,
    border: `3px solid ${spot2}`,
    background: marketing.color.accent,
})

globalStyle(`${PULP_ROOT} ${railLabel}`, {
    fontFamily: marketing.font.display,
    fontSize: "clamp(24px, 2.2vw, 30px)",
    letterSpacing: "0.06em",
    color: spot1,
})

globalStyle(`${PULP_ROOT} ${railMedia}`, {
    position: "relative",
    border: `4px solid ${spot2}`,
    borderRadius: 2,
    boxShadow: marketing.shape.shadowCard,
    marginBottom: scaledSpace(20),
})

globalStyle(`${PULP_ROOT} ${railMedia}::after`, {
    content: '""',
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    backgroundImage: "radial-gradient(rgba(4, 8, 24, 0.55) 0.9px, transparent 1.4px)", // theme-exempt: press ink dots over the painted frame
    backgroundSize: "4px 4px",
    mixBlendMode: "multiply",
    opacity: 0.45,
})

globalStyle(`${PULP_ROOT} ${railTitle}`, {
    fontSize: 27,
    fontWeight: 400,
    lineHeight: 1,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    textShadow: pulpExtrude(2),
})

/*
 * `atomic` (midcentury): the process as a catalog's ruled run — the
 * timeline turns across the page as equal columns hung from an ink rule,
 * hairlines between steps, each step numbered in the condensed caps and
 * cycling the register's inks instead of riding a dot.
 */
const STEP_INKS = [spot1, marketing.color.accent, spot2] as const

globalStyle(`${ATOMIC_ROOT} ${timeline}`, {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: 0,
    maxWidth: "none",
    borderTop: `2px solid ${marketing.color.text}`,
    counterReset: "atomic-step",
})

globalStyle(`${ATOMIC_ROOT} ${timelineItem}`, {
    padding: `${scaledSpace(20)} ${scaledSpace(26)} ${scaledSpace(6)} 0`,
    counterIncrement: "atomic-step",
})

globalStyle(`${ATOMIC_ROOT} ${timelineItem} + ${timelineItem}`, {
    paddingLeft: scaledSpace(26),
    borderLeft: `1px solid ${marketing.color.line}`,
    "@media": {
        "(max-width: 700px)": {
            paddingLeft: 0,
            borderLeft: "none",
            borderTop: `1px solid ${marketing.color.line}`,
        },
    },
})

globalStyle(`${ATOMIC_ROOT} ${timelineItem}:not(:last-child)::after`, {
    display: "none",
})

globalStyle(`${ATOMIC_ROOT} ${timelineDot}`, {
    position: "static",
    display: "block",
    width: "auto",
    height: "auto",
    borderRadius: 0,
    background: "none",
    fontSize: 0,
    marginBottom: 14,
})

globalStyle(`${ATOMIC_ROOT} ${timelineDot}::before`, {
    content: "counter(atomic-step, decimal-leading-zero)",
    fontFamily: marketing.font.display,
    fontWeight: marketing.display.weight,
    fontSize: 46,
    lineHeight: 1,
    color: STEP_INKS[0],
})

STEP_INKS.forEach((ink, index) => {
    globalStyle(`${ATOMIC_ROOT} ${timelineItem}:nth-child(3n + ${index + 1}) ${timelineDot}::before`, {
        color: ink,
    })
})

globalStyle(`${ATOMIC_ROOT} ${stepTitle}`, {
    fontFamily: marketing.font.body,
    fontSize: 16,
    fontWeight: 600,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    margin: "0 0 10px",
})

/*
 * `taped` rail: the day as a strip of prints along a dashed marker line,
 * each stamped with the time it happened in the felt-tip script.
 */
globalStyle(`${TAPED_ROOT} ${railItem}::before`, {
    top: 17,
    height: 2,
    background: `repeating-linear-gradient(90deg, ${marketing.color.accent} 0 10px, transparent 10px 18px)`,
})

globalStyle(`${TAPED_ROOT} ${railMark}`, {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: scaledSpace(22),
})

globalStyle(`${TAPED_ROOT} ${railDot}`, {
    position: "relative",
    width: 16,
    height: 16,
    marginTop: 3,
    border: "none",
    background: marketing.color.accent,
    boxShadow: `0 2px 3px color-mix(in srgb, ${marketing.color.text} 35%, transparent)`,
})

globalStyle(`${TAPED_ROOT} ${railLabel}`, {
    fontFamily: scriptFont,
    fontSize: 34,
    letterSpacing: 0,
    textTransform: "none",
    padding: "0 8px",
    background: marketing.color.pageBg,
})

globalStyle(`${TAPED_ROOT} ${railMedia}`, {
    position: "relative",
    aspectRatio: "auto",
    overflow: "visible",
    padding: 10,
    borderRadius: 2,
    boxShadow: marketing.shape.shadowCard,
    marginBottom: scaledSpace(20),
    transform: "rotate(-1.6deg)",
})

globalStyle(`${TAPED_ROOT} ${railItem}:nth-child(even) ${railMedia}`, { transform: "rotate(1.4deg)" })

globalStyle(`${TAPED_ROOT} ${railMedia}::before`, {
    content: '""',
    position: "absolute",
    zIndex: 1,
    top: -12,
    left: "50%",
    width: "34%",
    height: 24,
    background: MASKING_TAPE,
    clipPath: TAPE_CLIP,
    transform: "translateX(-50%) rotate(3deg)",
})

globalStyle(`${TAPED_ROOT} ${railImg}`, { aspectRatio: "4 / 3", height: "auto" })

globalStyle(`${TAPED_ROOT} ${railTitle}`, {
    fontSize: 26,
    textTransform: "uppercase",
    lineHeight: 1,
})

/*
 * `lariat` rail: the poster's bottom strip — a stitched rope line, a star at
 * each stop, the day in wood type, and each photograph framed like a
 * cabinet card with a hard shadow.
 */
globalStyle(`${LARIAT_ROOT} ${railItem}::before`, {
    top: 12,
    height: 2,
    background: `repeating-linear-gradient(90deg, ${marketing.color.line} 0 9px, transparent 9px 15px)`,
})

globalStyle(`${LARIAT_ROOT} ${railMark}`, {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: scaledSpace(20),
})

globalStyle(`${LARIAT_ROOT} ${railDot}`, {
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 26,
    height: 26,
    border: "none",
    background: marketing.color.pageBg,
})

globalStyle(`${LARIAT_ROOT} ${railDot}::before`, {
    content: '"★"',
    fontSize: 20,
    lineHeight: 1,
    color: marketing.color.accent,
})

globalStyle(`${LARIAT_ROOT} ${railLabel}`, {
    fontFamily: marketing.font.display,
    fontSize: 22,
    letterSpacing: "0.06em",
    color: marketing.color.text,
    paddingRight: 10,
    background: marketing.color.pageBg,
})

globalStyle(`${LARIAT_ROOT} ${railLabel}::after`, { content: '" —"' })

globalStyle(`${LARIAT_ROOT} ${railMedia}`, {
    border: `3px solid ${marketing.color.text}`,
    borderRadius: 2,
    boxShadow: `6px 6px 0 color-mix(in srgb, ${marketing.color.text} 22%, transparent)`,
})

globalStyle(`${LARIAT_ROOT} ${railTitle}`, {
    fontSize: 21,
    textTransform: "uppercase",
    letterSpacing: "0.02em",
    lineHeight: 1.1,
})
