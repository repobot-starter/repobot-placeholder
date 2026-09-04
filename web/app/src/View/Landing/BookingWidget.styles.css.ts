import { style } from "@vanilla-extract/css"
import { marketing } from "@base/design-system/marketing-theme"

/**
 * The booking widget's dress: drawn entirely from the marketing token
 * contract so it wears whatever register the pack's preset sets (the
 * fitness packs' included) and restyles with the platform's theme controls
 * — the widget never invents colors or radii of its own.
 */

export const wrap = style({
    maxWidth: marketing.layout.maxWidth,
    margin: "0 auto",
    padding: "48px 24px 72px",
})

export const heading = style({
    margin: "0 0 6px",
    fontFamily: marketing.font.display,
    fontSize: 26,
    lineHeight: 1.2,
    color: marketing.color.text,
})

export const intro = style({
    margin: "0 0 28px",
    fontSize: 15,
    lineHeight: 1.6,
    color: marketing.color.subtle,
    maxWidth: 560,
})

export const list = style({
    display: "grid",
    gap: 14,
    margin: 0,
    padding: 0,
    listStyle: "none",
})

export const card = style({
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    background: marketing.color.surface,
    padding: "16px 18px",
    display: "grid",
    gap: 12,
})

export const cardHeader = style({
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
})

export const cardTitle = style({
    margin: 0,
    fontSize: 17,
    fontWeight: 600,
    color: marketing.color.text,
})

export const cardMeta = style({
    margin: 0,
    fontSize: 13.5,
    color: marketing.color.subtle,
})

export const seatsChip = style({
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: marketing.color.accent,
    whiteSpace: "nowrap",
})

export const seatsChipFull = style([
    seatsChip,
    {
        color: marketing.color.subtle,
    },
])

export const controlsRow = style({
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
})

export const dateSelect = style({
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusControl,
    background: marketing.color.surface,
    color: marketing.color.text,
    fontSize: 14,
    padding: "9px 12px",
})

export const input = style({
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusControl,
    background: marketing.color.surface,
    color: marketing.color.text,
    fontSize: 14,
    padding: "9px 12px",
    minWidth: 160,
    flex: "1 1 160px",
})

export const bookButton = style({
    appearance: "none",
    border: "none",
    borderRadius: marketing.shape.radiusControl,
    background: marketing.color.accent,
    color: marketing.color.onAccent,
    fontSize: 14,
    fontWeight: 600,
    padding: "10px 20px",
    cursor: "pointer",
    selectors: {
        "&:disabled": {
            opacity: 0.55,
            cursor: "default",
        },
    },
})

export const stateText = style({
    margin: 0,
    fontSize: 14.5,
    fontWeight: 600,
    color: marketing.color.text,
})

export const stateSubtext = style({
    margin: 0,
    fontSize: 13.5,
    color: marketing.color.subtle,
})

/** Visually hidden but focusable-by-bots: the honeypot's clothes. */
export const honeypot = style({
    position: "absolute",
    width: 1,
    height: 1,
    margin: -1,
    padding: 0,
    border: 0,
    clip: "rect(0 0 0 0)",
    overflow: "hidden",
})
