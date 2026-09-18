import { style } from "@vanilla-extract/css"
import { marketing } from "@base/design-system/marketing-theme"

/**
 * The appointment widget's dress: like the class-booking widget, drawn
 * entirely from the marketing token contract so it wears the pack's own
 * register and restyles with the platform's theme controls.
 */

export const wrap = style({
    maxWidth: marketing.layout.maxWidth,
    margin: "0 auto",
    padding: "48px 24px 72px",
})

export const card = style({
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    background: marketing.color.surface,
    boxShadow: marketing.shape.shadowCard,
    padding: "26px 26px 28px",
    display: "grid",
    gap: 22,
})

export const heading = style({
    margin: "0 0 6px",
    fontFamily: marketing.font.display,
    fontSize: 26,
    lineHeight: 1.2,
    color: marketing.color.text,
})

export const intro = style({
    margin: 0,
    fontSize: 15,
    lineHeight: 1.6,
    color: marketing.color.subtle,
    maxWidth: 620,
})

export const step = style({
    display: "grid",
    gap: 10,
})

export const stepLabel = style({
    margin: 0,
    fontSize: 12.5,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
})

export const choiceRow = style({
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
})

export const choice = style({
    appearance: "none",
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusControl,
    background: marketing.color.surface,
    color: marketing.color.text,
    fontSize: 14,
    textAlign: "left",
    padding: "10px 14px",
    cursor: "pointer",
    display: "grid",
    gap: 2,
})

export const choiceSelected = style([
    choice,
    {
        borderColor: marketing.color.accent,
        boxShadow: `inset 0 0 0 1px ${marketing.color.accent}`,
    },
])

export const choiceTitle = style({
    fontWeight: 600,
})

export const choiceMeta = style({
    fontSize: 12.5,
    color: marketing.color.subtle,
})

export const timeChip = style({
    appearance: "none",
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusControl,
    background: marketing.color.surface,
    color: marketing.color.text,
    fontSize: 13.5,
    fontVariantNumeric: "tabular-nums",
    padding: "8px 12px",
    cursor: "pointer",
})

export const timeChipSelected = style([
    timeChip,
    {
        background: marketing.color.accent,
        borderColor: marketing.color.accent,
        color: marketing.color.onAccent,
        fontWeight: 600,
    },
])

export const dateSelect = style({
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusControl,
    background: marketing.color.surface,
    color: marketing.color.text,
    fontSize: 14,
    padding: "9px 12px",
    justifySelf: "start",
})

export const form = style({
    display: "grid",
    gap: 10,
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
})

export const input = style({
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusControl,
    background: marketing.color.surface,
    color: marketing.color.text,
    fontSize: 14,
    padding: "10px 12px",
})

export const bookButton = style({
    appearance: "none",
    border: "none",
    borderRadius: marketing.shape.radiusControl,
    background: marketing.color.accent,
    color: marketing.color.onAccent,
    boxShadow: marketing.shape.shadowCta,
    fontSize: 14.5,
    fontWeight: 600,
    padding: "12px 22px",
    cursor: "pointer",
    justifySelf: "start",
    selectors: {
        "&:disabled": {
            opacity: 0.55,
            cursor: "default",
        },
    },
})

export const privacyNote = style({
    margin: 0,
    fontSize: 12.5,
    lineHeight: 1.55,
    color: marketing.color.subtle,
})

export const stateText = style({
    margin: 0,
    fontSize: 15,
    fontWeight: 600,
    color: marketing.color.text,
})

export const stateSubtext = style({
    margin: 0,
    fontSize: 13.5,
    lineHeight: 1.55,
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
