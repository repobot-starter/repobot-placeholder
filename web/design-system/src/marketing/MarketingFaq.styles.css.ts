import { globalStyle, style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { section, sectionHeaderCentered, sectionKicker, sectionTitle } from "./shared.css"

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
