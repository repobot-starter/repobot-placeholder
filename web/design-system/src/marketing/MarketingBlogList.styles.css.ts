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

export const grid = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: scaledSpace(18),
    textAlign: "left",
})

export const card = style({
    display: "flex",
    flexDirection: "column",
    gap: 8,
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
    padding: `${scaledSpace(20)} ${scaledSpace(20)} ${scaledSpace(22)}`,
})

export const list = style({
    display: "flex",
    flexDirection: "column",
    maxWidth: 720,
    margin: "0 auto",
    textAlign: "left",
})

export const listRow = style({
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: `${scaledSpace(22)} 0`,
    borderTop: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    selectors: {
        "&:first-child": { borderTop: "none", paddingTop: 0 },
        "&:last-child": { paddingBottom: 0 },
    },
})

export const mediaEmoji = style([
    emojiPanel,
    {
        fontSize: 44,
        minHeight: 150,
        marginBottom: 6,
    },
])

export const mediaImg = style([
    mediaImage,
    {
        marginBottom: 6,
    },
])

export const date = style({
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
})

export const postTitle = style({
    fontFamily: marketing.font.display,
    fontSize: 18,
    fontWeight: 700,
    lineHeight: 1.3,
    color: marketing.color.text,
    margin: 0,
})

export const postLink = style({
    color: "inherit",
    textDecoration: "none",
    selectors: {
        "&:hover": { color: marketing.color.accent },
    },
})

export const excerpt = style({
    fontSize: 14.5,
    lineHeight: 1.6,
    color: marketing.color.subtle,
    margin: 0,
})
