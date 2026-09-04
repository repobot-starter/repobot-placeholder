import { style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { scaledSpace } from "./theme/feelBridge"
import { section, sectionHeaderCentered, sectionKicker, sectionTitle } from "./shared.css"

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
