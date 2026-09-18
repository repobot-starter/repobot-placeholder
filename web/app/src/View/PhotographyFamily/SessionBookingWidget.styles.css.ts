import { style } from "@vanilla-extract/css"
import { marketing } from "@base/design-system/marketing-theme"

/**
 * The session-booking widget's dress: drawn entirely from the marketing
 * token contract, so it wears the heirloom register (warm ivory ground,
 * champagne hairlines, Fraunces headings) and restyles with the platform's
 * theme controls. Deliberately quieter than the healthcare widget it is
 * modeled on — hairline card, serif heading, generous air.
 */

export const wrap = style({
    maxWidth: marketing.layout.maxWidth,
    margin: "0 auto",
    padding: "8px 24px 84px",
})

export const card = style({
    maxWidth: 760,
    margin: "0 auto",
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    background: marketing.color.surface,
    padding: "36px 36px 34px",
    display: "grid",
    gap: 26,
    "@media": {
        "(max-width: 640px)": {
            padding: "24px 20px 24px",
        },
    },
})

export const heading = style({
    margin: 0,
    fontFamily: marketing.font.display,
    fontWeight: 500,
    fontSize: 24,
    lineHeight: 1.25,
    color: marketing.color.text,
})

export const intro = style({
    margin: "6px 0 0",
    fontSize: 14.5,
    lineHeight: 1.65,
    color: marketing.color.subtle,
    maxWidth: 560,
})

export const step = style({
    display: "grid",
    gap: 12,
})

export const stepLabel = style({
    margin: 0,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.14em",
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
    padding: "12px 16px",
    cursor: "pointer",
    display: "grid",
    gap: 3,
    transition: "border-color 160ms ease",
    selectors: {
        "&:hover": {
            borderColor: marketing.color.subtle,
        },
    },
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
    padding: "9px 14px",
    cursor: "pointer",
    transition: "border-color 160ms ease",
    selectors: {
        "&:hover": {
            borderColor: marketing.color.subtle,
        },
    },
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
    padding: "10px 12px",
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
    padding: "11px 13px",
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
    letterSpacing: "0.02em",
    padding: "13px 26px",
    cursor: "pointer",
    justifySelf: "start",
    selectors: {
        "&:disabled": {
            opacity: 0.55,
            cursor: "default",
        },
    },
})

export const formNote = style({
    margin: 0,
    fontSize: 12.5,
    lineHeight: 1.6,
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
    lineHeight: 1.6,
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
