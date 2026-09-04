import { style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { scaledSpace } from "./theme/feelBridge"
import { section, sectionHeaderCentered, sectionKicker, sectionTitle } from "./shared.css"

export const wrap = style([section, sectionHeaderCentered])

export const kicker = sectionKicker

export const title = sectionTitle

export const cardsGrid = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: scaledSpace(18),
    textAlign: "left",
})

export const listGrid = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: `${scaledSpace(18)} ${scaledSpace(32)}`,
    textAlign: "left",
})

export const card = style({
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
    padding: `${scaledSpace(22)} ${scaledSpace(22)} ${scaledSpace(24)}`,
})

export const listRow = style({
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
})

export const emoji = style({
    fontSize: 30,
    display: "block",
    marginBottom: 12,
})

export const listEmoji = style({
    fontSize: 24,
    lineHeight: "28px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: marketing.color.accentSoft,
    borderRadius: marketing.shape.radiusControl,
    padding: 8,
    flexShrink: 0,
})

/** Named icon in an accent-tinted tile — the non-emoji glyph treatment. */
export const iconTile = style({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 42,
    height: 42,
    marginBottom: 14,
    background: marketing.color.accentSoft,
    borderRadius: marketing.shape.radiusControl,
    color: marketing.color.accent,
})

export const listIconTile = style({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 42,
    height: 42,
    background: marketing.color.accentSoft,
    borderRadius: marketing.shape.radiusControl,
    color: marketing.color.accent,
    flexShrink: 0,
})

/*
 * `bento`: mixed-size cells over a 4-column grid. Wide cells span two
 * columns; cells with product crops let the media hug the bottom edge.
 */
export const bentoGrid = style({
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    // Dense flow backfills the wraps wide cells cause, so the grid stays
    // hole-free whatever the wide/narrow rhythm.
    gridAutoFlow: "dense",
    gap: scaledSpace(18),
    textAlign: "left",
    "@media": {
        "(max-width: 1020px)": { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" },
        "(max-width: 640px)": { gridTemplateColumns: "1fr" },
    },
})

export const bentoCell = style({
    display: "flex",
    flexDirection: "column",
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
    padding: `${scaledSpace(22)} ${scaledSpace(22)} ${scaledSpace(24)}`,
    overflow: "hidden",
})

export const bentoCellWide = style({
    gridColumn: "span 2",
    "@media": {
        "(max-width: 640px)": { gridColumn: "auto" },
    },
})

/* The crop bleeds to the cell's bottom and side edges. */
export const bentoMedia = style({
    marginTop: "auto",
    paddingTop: scaledSpace(18),
    margin: `auto calc(-1 * ${scaledSpace(22)}) calc(-1 * ${scaledSpace(24)})`,
    paddingLeft: scaledSpace(18),
    paddingRight: 0,
})

export const bentoMediaImg = style({
    display: "block",
    width: "100%",
    // Beat the intrinsic height attribute — the crop scales to the cell.
    height: "auto",
    // The crop runs off the cell's right and bottom edges; only its
    // top-left corner is visible, so that's the only radius it needs.
    borderTopLeftRadius: marketing.shape.radiusControl,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    boxShadow: marketing.shape.shadowCard,
})

export const featureTitle = style({
    fontFamily: marketing.font.display,
    fontSize: 17,
    fontWeight: 700,
    color: marketing.color.text,
    margin: "0 0 8px",
})

export const featureDescription = style({
    fontSize: 14.5,
    lineHeight: 1.6,
    color: marketing.color.subtle,
    margin: 0,
})
