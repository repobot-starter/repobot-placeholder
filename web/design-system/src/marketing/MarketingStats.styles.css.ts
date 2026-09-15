import { style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { scaledSpace } from "./theme/feelBridge"
import { section, sectionHeaderCentered, sectionKicker, sectionTitle } from "./shared.css"

export const wrap = style([section, sectionHeaderCentered])

export const kicker = sectionKicker

export const title = sectionTitle

export const row = style({
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: `${scaledSpace(36)} ${scaledSpace(72)}`,
})

export const stat = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
})

export const value = style({
    fontFamily: marketing.font.display,
    // Stat numerals are display moments: the display-scale axis grows them
    // with the register's ambition (the monumental "86% faster" band).
    fontSize: `calc(clamp(36px, 5vw, 54px) * ${marketing.display.scale})`,
    fontWeight: marketing.display.weight,
    letterSpacing: marketing.display.tracking,
    lineHeight: 1,
    color: marketing.color.accent,
})

export const cardsGrid = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: scaledSpace(18),
    textAlign: "left",
})

export const card = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 6,
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
    padding: `${scaledSpace(24)} ${scaledSpace(22)} ${scaledSpace(22)}`,
})

export const cardValue = style({
    fontFamily: marketing.font.display,
    fontSize: `calc(clamp(30px, 4vw, 42px) * ${marketing.display.scale})`,
    fontWeight: marketing.display.weight,
    letterSpacing: marketing.display.tracking,
    lineHeight: 1,
    color: marketing.color.accent,
})

export const label = style({
    fontSize: 14,
    fontWeight: 600,
    color: marketing.color.text,
})

export const description = style({
    fontSize: 13.5,
    lineHeight: 1.55,
    color: marketing.color.subtle,
    margin: 0,
    maxWidth: 260,
})
