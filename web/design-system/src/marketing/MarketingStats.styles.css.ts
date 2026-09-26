import { globalStyle, style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { scaledSpace } from "./theme/feelBridge"
import { section, sectionHeaderCentered, sectionKicker, sectionTitle, LARIAT_ROOT } from "./shared.css"

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

/*
 * `bars`: the report. A reading-width column under the centered heading —
 * the intro line in the display face, a ruled table (label, the value in
 * the accent between two hairlines, and a thin accent bar drawn to the
 * value's share of the largest), the footnote, and the note as a small
 * outlined tag.
 */
export const barsFrame = style({
    maxWidth: 760,
    margin: "0 auto",
    paddingBottom: scaledSpace(64),
    textAlign: "left",
})

export const barsIntro = style({
    margin: `0 0 ${scaledSpace(26)}`,
    fontFamily: marketing.font.display,
    fontSize: "clamp(18px, 1.8vw, 22px)",
    lineHeight: 1.45,
    color: marketing.color.text,
    textWrap: "pretty",
})

export const bars = style({
    margin: 0,
    borderTop: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
})

export const barsRow = style({
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(84px, auto) minmax(0, 1.5fr)",
    alignItems: "center",
    borderBottom: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    "@media": {
        "(max-width: 640px)": { gridTemplateColumns: "minmax(0, 1fr) minmax(64px, auto) minmax(0, 1fr)" },
    },
})

export const barsLabel = style({
    padding: `${scaledSpace(14)} 16px ${scaledSpace(14)} 0`,
    fontFamily: marketing.font.display,
    fontSize: 19,
    lineHeight: 1.3,
    color: marketing.color.text,
    "@media": {
        "(max-width: 640px)": { fontSize: 16, paddingRight: 10 },
    },
})

export const barsValue = style({
    alignSelf: "stretch",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    margin: 0,
    padding: "0 20px",
    borderLeft: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRight: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    fontFamily: marketing.font.display,
    fontSize: 21,
    fontVariantNumeric: "tabular-nums",
    color: marketing.color.accent,
    "@media": {
        "(max-width: 640px)": { fontSize: 17, padding: "0 12px" },
    },
})

export const barsTrack = style({
    margin: 0,
    padding: "0 0 0 16px",
    "@media": {
        "(max-width: 640px)": { paddingLeft: 10 },
    },
})

export const barsBar = style({
    display: "block",
    height: 2,
    minWidth: 0,
    background: marketing.color.accent,
    borderRadius: 2,
})

export const barsFootnote = style({
    margin: `${scaledSpace(18)} 0 0`,
    fontSize: 14.5,
    lineHeight: 1.55,
    color: marketing.color.subtle,
})

export const barsNote = style({
    display: "inline-block",
    margin: `${scaledSpace(12)} 0 0`,
    padding: "4px 10px",
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusControl,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
})

/*
 * `lariat` cards: brand tags — a stitched leather edge, the number burned
 * in huge wood type with a hard shadow, the name in caps beneath.
 */
globalStyle(`${LARIAT_ROOT} ${cardsGrid}`, {
    gap: scaledSpace(24),
    "@media": {
        "(max-width: 640px)": { gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 },
    },
})

globalStyle(`${LARIAT_ROOT} ${card}`, {
    alignItems: "center",
    textAlign: "center",
    gap: 8,
    border: `2px solid ${marketing.color.text}`,
    outline: `2px dashed color-mix(in srgb, ${marketing.color.accent} 70%, transparent)`,
    outlineOffset: -10,
    padding: `${scaledSpace(34)} ${scaledSpace(20)} ${scaledSpace(30)}`,
    "@media": {
        "(max-width: 640px)": { padding: "24px 12px 20px", outlineOffset: -7 },
    },
})

globalStyle(`${LARIAT_ROOT} ${cardValue}`, {
    fontSize: "clamp(50px, 6vw, 82px)",
    textShadow: `0.05em 0.05em 0 color-mix(in srgb, ${marketing.color.text} 22%, transparent)`,
})

globalStyle(`${LARIAT_ROOT} ${card} ${label}`, {
    fontFamily: marketing.font.display,
    fontSize: "clamp(14px, 1.3vw, 17px)",
    fontWeight: 400,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
})

globalStyle(`${LARIAT_ROOT} ${card} ${description}`, { fontStyle: "italic", fontSize: 14.5 })
