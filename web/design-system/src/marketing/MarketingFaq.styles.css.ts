import { globalStyle, style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { ATOMIC_ROOT, section, sectionHeaderCentered, sectionKicker, sectionTitle, spot1 } from "./shared.css"

export const wrap = style([section, sectionHeaderCentered])

export const kicker = sectionKicker

export const title = sectionTitle

export const list = style({
    display: "flex",
    flexDirection: "column",
    gap: 12,
    maxWidth: 720,
    margin: "0 auto",
    textAlign: "left",
})

export const item = style({
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
    padding: "4px 20px",
})

export const question = style({
    fontSize: 15.5,
    fontWeight: 650,
    color: marketing.color.text,
    padding: "16px 0",
    cursor: "pointer",
    listStyle: "none",
    selectors: {
        "&::-webkit-details-marker": { display: "none" },
        "&::after": {
            content: '"+"',
            float: "right",
            color: marketing.color.subtle,
            fontWeight: 400,
            fontSize: 20,
        },
    },
})

globalStyle(`${item}[open] ${question}::after`, {
    content: '"–"',
})

export const answer = style({
    fontSize: 14.5,
    lineHeight: 1.65,
    color: marketing.color.subtle,
    padding: "0 0 18px",
    margin: 0,
})

/*
 * `atomic` (midcentury): the questions as ruled catalog lines — no boxes,
 * a hairline between entries, the question in tracked geometric caps and
 * the toggle in the burnt-orange ink.
 */
globalStyle(`${ATOMIC_ROOT} ${list}`, {
    gap: 0,
    borderTop: `2px solid ${marketing.color.text}`,
})

globalStyle(`${ATOMIC_ROOT} ${item}`, {
    background: "none",
    border: "none",
    borderBottom: `1px solid ${marketing.color.line}`,
    borderRadius: 0,
    boxShadow: "none",
    padding: "2px 0",
})

globalStyle(`${ATOMIC_ROOT} ${question}`, {
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    padding: "18px 0",
})

globalStyle(`${ATOMIC_ROOT} ${question}::after`, {
    color: spot1,
    fontSize: 18,
    lineHeight: 1,
})
