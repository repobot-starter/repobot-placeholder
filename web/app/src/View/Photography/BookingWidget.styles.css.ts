import { style } from "@vanilla-extract/css"
import { marketing } from "@base/design-system/marketing-theme"

/**
 * The booking widget's chrome, drawn from the marketing token contract so
 * it inherits the pack's register (tourbook: grained monochrome paper,
 * masthead type, ink accent). Editorial by intent — session cards fronted
 * by photographs, hairline rules, no clinical scheduling grid.
 */

export const wrap = style({
    maxWidth: 960,
    margin: "0 auto",
    padding: "8px 24px 88px",
    fontFamily: marketing.font.body,
    color: marketing.color.text,
})

export const step = style({
    display: "grid",
    gap: 16,
    paddingTop: 36,
})

export const stepLabel = style({
    margin: 0,
    fontSize: 12,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
})

/* ---- Step one: the session ---- */

export const sessionGrid = style({
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 18,
    "@media": {
        "(max-width: 860px)": { gridTemplateColumns: "1fr" },
    },
})

const sessionCardBase = {
    display: "grid",
    gap: 0,
    padding: 0,
    textAlign: "left",
    fontFamily: "inherit",
    color: marketing.color.text,
    background: marketing.color.surface,
    borderRadius: marketing.shape.radiusCard,
    overflow: "hidden",
    cursor: "pointer",
} as const

export const sessionCard = style({
    ...sessionCardBase,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
})

export const sessionCardSelected = style({
    ...sessionCardBase,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.accent}`,
    outline: `${marketing.shape.borderWidth} solid ${marketing.color.accent}`,
})

export const sessionImage = style({
    width: "100%",
    aspectRatio: "4 / 3",
    objectFit: "cover",
    display: "block",
    // The photograph reads as a print: no rounding of its own, the card
    // clips it.
})

export const sessionBody = style({
    display: "grid",
    gap: 8,
    padding: "18px 18px 20px",
})

export const sessionTitle = style({
    margin: 0,
    fontFamily: marketing.font.display,
    fontSize: 21,
    lineHeight: 1.15,
})

export const sessionMeta = style({
    fontSize: 12,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
})

export const sessionDescription = style({
    margin: 0,
    fontSize: 14.5,
    lineHeight: 1.6,
    color: marketing.color.subtle,
})

/* ---- Step two: the date and time ---- */

export const dateSelect = style({
    justifySelf: "start",
    fontSize: 15,
    fontFamily: "inherit",
    color: marketing.color.text,
    background: marketing.color.pageBg,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusControl,
    padding: "10px 14px",
    outline: "none",
    selectors: {
        "&:focus": { borderColor: marketing.color.accent },
    },
})

export const timeRow = style({
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
})

const timeChipBase = {
    fontSize: 14,
    fontFamily: "inherit",
    padding: "9px 18px",
    borderRadius: 999,
    cursor: "pointer",
} as const

export const timeChip = style({
    ...timeChipBase,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    background: "transparent",
    color: marketing.color.text,
})

export const timeChipSelected = style({
    ...timeChipBase,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.accent}`,
    background: marketing.color.accent,
    color: marketing.color.onAccent,
})

/* ---- Step three: the details ---- */

export const form = style({
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
    gap: 12,
    "@media": {
        "(max-width: 640px)": { gridTemplateColumns: "1fr" },
    },
})

export const input = style({
    fontSize: 15,
    fontFamily: "inherit",
    color: marketing.color.text,
    background: marketing.color.pageBg,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusControl,
    padding: "11px 14px",
    outline: "none",
    selectors: {
        "&:focus": { borderColor: marketing.color.accent },
    },
})

/** The honeypot: visually gone, present in the DOM for bots to find. */
export const honeypot = style({
    position: "absolute",
    width: 1,
    height: 1,
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
})

export const bookButton = style({
    gridColumn: "1 / -1",
    fontSize: 15,
    fontWeight: 600,
    fontFamily: "inherit",
    padding: "13px 22px",
    borderRadius: marketing.shape.radiusControl,
    border: "none",
    background: marketing.color.accent,
    color: marketing.color.onAccent,
    cursor: "pointer",
    selectors: {
        "&:disabled": { opacity: 0.45, cursor: "default" },
    },
})

export const finePrint = style({
    margin: 0,
    fontSize: 13,
    lineHeight: 1.6,
    color: marketing.color.subtle,
})

/* ---- States ---- */

export const stateText = style({
    margin: 0,
    fontSize: 15,
    lineHeight: 1.6,
})

export const stateSubtext = style({
    margin: "8px 0 0",
    fontSize: 14,
    lineHeight: 1.6,
    color: marketing.color.subtle,
})

export const confirmedCard = style({
    marginTop: 36,
    display: "grid",
    gap: 8,
    padding: "32px 28px",
    textAlign: "center",
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
})

export const confirmedTitle = style({
    margin: 0,
    fontFamily: marketing.font.display,
    fontSize: 26,
})
