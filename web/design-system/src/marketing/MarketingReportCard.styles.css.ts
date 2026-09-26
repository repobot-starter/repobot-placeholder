import { style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { scaledSpace } from "./theme/feelBridge"

const dashedRule = `${marketing.shape.borderWidth} dashed ${marketing.color.line}`

export const card = style({
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.text}`,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
    padding: `${scaledSpace(22)} ${scaledSpace(26)} ${scaledSpace(20)}`,
    textAlign: "left",
    "@media": {
        "(max-width: 640px)": { padding: `${scaledSpace(18)} ${scaledSpace(16)}` },
    },
})

export const masthead = style({
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingBottom: 12,
    marginBottom: 14,
    borderBottom: dashedRule,
})

export const label = style({
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: marketing.color.accent,
    selectors: {
        "&::before": {
            content: '""',
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: marketing.color.accent,
        },
    },
})

export const issuer = style({
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
})

export const title = style({
    fontFamily: marketing.font.display,
    fontSize: "clamp(20px, 2.2vw, 26px)",
    fontWeight: marketing.display.weight,
    letterSpacing: marketing.display.tracking,
    lineHeight: 1.15,
    color: marketing.color.text,
    margin: 0,
})

export const location = style({
    fontSize: 14,
    fontWeight: 700,
    color: marketing.color.subtle,
    margin: "4px 0 0",
})

export const rowsWrap = style({
    position: "relative",
    marginTop: 12,
})

export const rows = style({
    margin: 0,
})

export const row = style({
    display: "grid",
    gridTemplateColumns: "minmax(96px, 30%) 1fr",
    alignItems: "baseline",
    gap: 12,
    padding: "10px 0",
    borderBottom: dashedRule,
})

export const rowLabel = style({
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
})

export const rowValue = style({
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1.35,
    color: marketing.color.text,
})

export const rowValueHighlight = style({
    fontFamily: marketing.font.display,
    fontSize: `calc(24px * ${marketing.display.scale})`,
    fontWeight: marketing.display.weight,
    lineHeight: 1.05,
    color: marketing.color.accent,
    fontVariantNumeric: "tabular-nums",
})

/** The rubber stamp: outlined caps in the accent, set askew over the rows. */
export const stamp = style({
    position: "absolute",
    right: 4,
    bottom: 14,
    transform: "rotate(-9deg)",
    fontFamily: marketing.font.display,
    fontSize: 17,
    fontWeight: marketing.display.weight,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: marketing.color.accent,
    border: `3px solid ${marketing.color.accent}`,
    borderRadius: 12,
    padding: "6px 12px",
    background: "color-mix(in srgb, currentColor 8%, transparent)",
    pointerEvents: "none",
    "@media": {
        "(max-width: 520px)": { fontSize: 13, padding: "4px 9px", bottom: 10 },
    },
})

export const photos = style({
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginTop: 16,
})

export const photo = style({
    position: "relative",
    margin: 0,
    borderRadius: `calc(${marketing.shape.radiusCard} * 0.6)`,
    overflow: "hidden",
    aspectRatio: "4 / 5",
    background: marketing.color.line,
})

export const photoImg = style({
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "cover",
})

export const photoTag = style({
    position: "absolute",
    left: 10,
    top: 10,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: marketing.color.pageBg,
    background: marketing.color.text,
    borderRadius: 999,
    padding: "4px 10px",
})

export const signature = style({
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: "4px 14px",
    marginTop: 16,
    paddingTop: 12,
    borderTop: dashedRule,
})

export const signatureName = style({
    fontFamily: marketing.font.display,
    fontSize: 20,
    fontWeight: marketing.display.weight,
    color: marketing.color.text,
    selectors: {
        "&::before": { content: '"— "', color: marketing.color.accent },
    },
})

export const signatureDetail = style({
    fontSize: 12.5,
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
})
