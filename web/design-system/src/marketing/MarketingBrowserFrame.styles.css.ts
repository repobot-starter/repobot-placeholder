import { style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"

export const frame = style({
    margin: 0,
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
    overflow: "hidden",
})

export const bar = style({
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "10px 14px",
    borderBottom: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
})

export const dot = style({
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: marketing.color.line,
    flexShrink: 0,
})

export const addressPill = style({
    marginLeft: 8,
    padding: "3px 14px",
    borderRadius: 999,
    background: marketing.color.accentSoft,
    color: marketing.color.subtle,
    fontFamily: marketing.font.body,
    fontSize: 12,
    lineHeight: "16px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 320,
})

export const img = style({
    width: "100%",
    height: "auto",
    display: "block",
})
