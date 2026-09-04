import { style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { scaledSpace } from "./theme/feelBridge"
import { section, sectionHeaderCentered, sectionKicker, sectionTitle } from "./shared.css"

export const wrap = style([section, sectionHeaderCentered])

export const kicker = sectionKicker

export const title = sectionTitle

export const tableScroll = style({
    overflowX: "auto",
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
})

export const table = style({
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
})

export const headCell = style({
    fontFamily: marketing.font.display,
    fontSize: 14.5,
    fontWeight: 700,
    color: marketing.color.text,
    padding: "16px 18px",
    borderBottom: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
})

export const rowLabel = style({
    fontSize: 14.5,
    fontWeight: 600,
    color: marketing.color.text,
    padding: "13px 18px",
    borderTop: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    selectors: {
        "tr:first-child > &": { borderTop: "none" },
    },
})

export const cell = style({
    fontSize: 14.5,
    lineHeight: 1.5,
    color: marketing.color.subtle,
    padding: "13px 18px",
    borderTop: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    selectors: {
        "tr:first-child > &": { borderTop: "none" },
    },
})

/** The first value column — "us" — gets the featured tint. */
export const featured = style({
    background: marketing.color.accentSoft,
})

export const yes = style({
    color: marketing.color.accent,
    fontWeight: 700,
})

export const no = style({
    color: marketing.color.subtle,
})

export const cardsGrid = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: scaledSpace(18),
    textAlign: "left",
})

export const card = style({
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
    padding: `${scaledSpace(22)} ${scaledSpace(22)} ${scaledSpace(24)}`,
})

export const cardFeatured = style({
    borderColor: marketing.color.accent,
})

export const cardTitle = style({
    fontFamily: marketing.font.display,
    fontSize: 17,
    fontWeight: 700,
    color: marketing.color.text,
    margin: "0 0 14px",
})

export const cardList = style({
    listStyle: "none",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    margin: 0,
    padding: 0,
})

export const cardRow = style({
    display: "flex",
    alignItems: "baseline",
    gap: 10,
    fontSize: 14.5,
    lineHeight: 1.5,
})

export const cardRowLabel = style({
    color: marketing.color.text,
    flex: 1,
})

export const cardRowLabelMuted = style({
    color: marketing.color.subtle,
    flex: 1,
})

export const cardRowValue = style({
    color: marketing.color.subtle,
    textAlign: "right",
})
