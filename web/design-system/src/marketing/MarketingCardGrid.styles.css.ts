import { style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { scaledSpace } from "./theme/feelBridge"
import {
    emojiPanel,
    mediaImage,
    section,
    sectionHeaderCentered,
    sectionKicker,
    sectionTitle,
} from "./shared.css"

export const wrap = style([section, sectionHeaderCentered])

export const kicker = sectionKicker

export const title = sectionTitle

const gridBase = style({
    display: "grid",
    gap: scaledSpace(18),
    textAlign: "left",
})

export const grid3 = style([
    gridBase,
    {
        gridTemplateColumns: "repeat(3, 1fr)",
        "@media": {
            "(max-width: 980px)": { gridTemplateColumns: "repeat(2, 1fr)" },
            "(max-width: 640px)": { gridTemplateColumns: "1fr" },
        },
    },
])

export const grid2 = style([
    gridBase,
    {
        gridTemplateColumns: "repeat(2, 1fr)",
        "@media": {
            "(max-width: 700px)": { gridTemplateColumns: "1fr" },
        },
    },
])

export const grid4 = style([
    gridBase,
    {
        gridTemplateColumns: "repeat(4, 1fr)",
        "@media": {
            "(max-width: 1020px)": { gridTemplateColumns: "repeat(2, 1fr)" },
            "(max-width: 640px)": { gridTemplateColumns: "1fr" },
        },
    },
])

export const card = style({
    display: "flex",
    flexDirection: "column",
    gap: 10,
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
    padding: `${scaledSpace(20)} ${scaledSpace(20)} ${scaledSpace(22)}`,
})

export const mediaEmoji = style([
    emojiPanel,
    {
        fontSize: 40,
        minHeight: 120,
        marginBottom: 6,
    },
])

export const mediaImg = style([
    mediaImage,
    {
        marginBottom: 6,
    },
])

export const cardTitle = style({
    fontFamily: marketing.font.display,
    fontSize: 17,
    fontWeight: 700,
    color: marketing.color.text,
    margin: 0,
})

export const cardBody = style({
    fontSize: 14.5,
    lineHeight: 1.6,
    color: marketing.color.subtle,
    margin: 0,
})

export const cardCta = style({
    marginTop: "auto",
    paddingTop: 8,
    fontSize: 14,
    fontWeight: 700,
    color: marketing.color.accent,
    textDecoration: "none",
    selectors: {
        "&:hover": { textDecoration: "underline" },
    },
})
