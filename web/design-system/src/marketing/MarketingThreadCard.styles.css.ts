import { style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"

/** The phone card: framed in ink like a device, the thread inside. */
export const phone = style({
    width: "100%",
    maxWidth: 440,
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.text}`,
    borderRadius: `calc(${marketing.shape.radiusCard} + 6px)`,
    boxShadow: marketing.shape.shadowCard,
    overflow: "hidden",
})

export const phoneHead = style({
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 18px",
    background: marketing.color.text,
    color: marketing.color.pageBg,
})

export const avatar = style({
    flex: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 38,
    height: 38,
    borderRadius: "50%",
    fontFamily: marketing.font.display,
    fontSize: 18,
    fontWeight: marketing.display.weight,
    color: marketing.color.onAccent,
    background: marketing.color.accent,
})

export const phoneWho = style({
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
})

export const phoneName = style({
    fontFamily: marketing.font.display,
    fontSize: 18,
    fontWeight: marketing.display.weight,
    lineHeight: 1.15,
})

export const phoneDetail = style({
    fontSize: 13,
    fontWeight: 600,
    opacity: 0.78,
})

export const messages = style({
    listStyle: "none",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    margin: 0,
    padding: "20px 16px 22px",
    background: marketing.color.pageBg,
})

export const message = style({
    display: "flex",
    justifyContent: "flex-start",
})

export const messageEnd = style({
    justifyContent: "flex-end",
})

export const bubble = style({
    display: "flex",
    flexDirection: "column",
    gap: 6,
    maxWidth: "82%",
    padding: "10px 14px 8px",
    borderRadius: "20px 20px 20px 6px",
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    color: marketing.color.text,
})

export const bubbleEnd = style({
    borderRadius: "20px 20px 6px 20px",
    background: marketing.color.accent,
    borderColor: marketing.color.accent,
    color: marketing.color.onAccent,
})

export const bubbleText = style({
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1.35,
})

export const attachment = style({
    display: "block",
    marginTop: 2,
    borderRadius: 14,
    overflow: "hidden",
})

export const attachmentImg = style({
    display: "block",
    width: "100%",
    height: "auto",
    maxHeight: 220,
    objectFit: "cover",
})

export const meta = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: 8,
})

export const chip = style({
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.02em",
    padding: "2px 9px",
    borderRadius: 999,
    background: "color-mix(in srgb, currentColor 14%, transparent)",
})

export const time = style({
    fontSize: 11.5,
    fontWeight: 600,
    opacity: 0.7,
})

/** `compact`: the card as a hero aside — tighter bubbles, a shorter photo. */
export const phoneCompact = style({
    maxWidth: 420,
})

export const messagesCompact = style({
    gap: 9,
    padding: "14px 14px 16px",
})

export const bubbleCompact = style({
    maxWidth: "88%",
    padding: "8px 12px 6px",
})

export const bubbleTextCompact = style({
    fontSize: 14.5,
})

export const attachmentImgCompact = style({
    maxHeight: 150,
    "@media": {
        "(max-width: 640px)": { maxHeight: 112 },
    },
})

export const phoneHeadCompact = style({
    padding: "11px 16px",
})
