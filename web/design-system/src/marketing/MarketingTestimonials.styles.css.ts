import { globalStyle, style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { scaledSpace } from "./theme/feelBridge"
import {
    ATOMIC_ROOT,
    COLORBLOCK_ROOT,
    MASKING_TAPE,
    TAPED_ROOT,
    TAPE_CLIP,
    atomicStar,
    scriptFont,
    section,
    sectionHeaderCentered,
    sectionKicker,
    sectionTitle,
    spot2,
} from "./shared.css"

export const wrap = style([section, sectionHeaderCentered])

export const kicker = sectionKicker

export const title = sectionTitle

export const grid = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: scaledSpace(18),
    alignItems: "stretch",
    textAlign: "left",
})

/**
 * Exactly two quotes: cap the card width and center the pair, so they read
 * as a balanced spread instead of two page-half slabs.
 */
export const gridPair = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 460px))",
    gap: scaledSpace(18),
    alignItems: "stretch",
    justifyContent: "center",
    textAlign: "left",
})

export const card = style({
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    gap: scaledSpace(18),
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
    padding: `${scaledSpace(24)} ${scaledSpace(22)}`,
    margin: 0,
})

export const quote = style({
    fontSize: 15.5,
    lineHeight: 1.65,
    color: marketing.color.text,
    margin: 0,
})

export const attribution = style({
    display: "flex",
    flexDirection: "column",
    gap: 2,
    borderTop: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    paddingTop: 14,
})

/**
 * `single-featured`: one voice, given the whole room — a display-type
 * quote, centered, no card chrome. Reads at pull-quote scale.
 */
export const featured = style({
    maxWidth: 780,
    margin: "0 auto",
    textAlign: "center",
})

export const featuredQuote = style({
    fontFamily: marketing.font.display,
    fontSize: "clamp(24px, 3.4vw, 34px)",
    fontWeight: marketing.display.weight,
    letterSpacing: marketing.display.tracking,
    lineHeight: 1.35,
    color: marketing.color.text,
    margin: 0,
})

export const featuredAttribution = style({
    display: "flex",
    flexDirection: "column",
    gap: 2,
    marginTop: scaledSpace(24),
})

export const author = style({
    fontFamily: marketing.font.display,
    fontSize: 14.5,
    fontWeight: 700,
    color: marketing.color.text,
})

export const authorTitle = style({
    fontSize: 13,
    color: marketing.color.subtle,
})

// The colorblock register's pull quote: a notch lighter than its 900 poster caps.
globalStyle(`${COLORBLOCK_ROOT} ${featuredQuote}`, {
    fontWeight: 800,
    letterSpacing: "-0.01em",
    wordSpacing: "0.06em",
    lineHeight: 1.25,
})

/*
 * `atomic` (midcentury): the pull quote in the geometric text face — a
 * client's voice, not a headline — under a small olive atomic star, the
 * name in tracked caps.
 */
globalStyle(`${ATOMIC_ROOT} ${featured}::before`, {
    ...atomicStar(30, spot2),
    marginBottom: scaledSpace(18),
})

globalStyle(`${ATOMIC_ROOT} ${featuredQuote}`, {
    fontFamily: marketing.font.body,
    fontSize: "clamp(21px, 2.5vw, 29px)",
    fontWeight: 400,
    letterSpacing: 0,
    lineHeight: 1.45,
})

globalStyle(`${ATOMIC_ROOT} ${author}`, {
    fontFamily: marketing.font.body,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
})

/*
 * `taped` cards: thank-you notes taped up beside the prints — a lean, a
 * strip of tape, the name signed in marker.
 */
globalStyle(`${TAPED_ROOT} ${grid}`, { gap: scaledSpace(30), paddingTop: 14 })

globalStyle(`${TAPED_ROOT} ${card}`, {
    position: "relative",
    border: "none",
    borderRadius: 1,
    transform: "rotate(-1deg)",
})

globalStyle(`${TAPED_ROOT} ${card}:nth-child(even)`, { transform: "rotate(1.2deg)" })

globalStyle(`${TAPED_ROOT} ${card}::before`, {
    content: '""',
    position: "absolute",
    top: -13,
    left: "50%",
    width: 104,
    height: 26,
    background: MASKING_TAPE,
    clipPath: TAPE_CLIP,
    transform: "translateX(-50%) rotate(-3deg)",
})

globalStyle(`${TAPED_ROOT} ${card} ${author}`, {
    fontFamily: scriptFont,
    fontSize: 22,
    fontWeight: 400,
    color: marketing.color.accent,
})
