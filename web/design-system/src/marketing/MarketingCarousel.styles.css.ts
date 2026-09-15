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

export const track = style({
    display: "flex",
    gap: scaledSpace(18),
    overflowX: "auto",
    scrollSnapType: "x mandatory",
    scrollBehavior: "smooth",
    scrollPadding: 4,
    padding: "4px 4px 18px",
    textAlign: "left",
    "@media": {
        "(prefers-reduced-motion: reduce)": { scrollBehavior: "auto" },
    },
})

export const slide = style({
    scrollSnapAlign: "start",
    flex: "0 0 min(300px, 82%)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
    padding: `${scaledSpace(20)} ${scaledSpace(20)} ${scaledSpace(22)}`,
})

export const slideSpotlight = style({
    flex: "0 0 min(880px, 92%)",
})

export const mediaEmoji = style([
    emojiPanel,
    {
        fontSize: 40,
        minHeight: 130,
        marginBottom: 6,
    },
])

export const mediaEmojiSpotlight = style({
    fontSize: 64,
    minHeight: 240,
})

export const mediaImg = style([
    mediaImage,
    {
        marginBottom: 6,
    },
])

export const slideTitle = style({
    fontFamily: marketing.font.display,
    fontSize: 17,
    fontWeight: 700,
    color: marketing.color.text,
    margin: 0,
})

export const slideBody = style({
    fontSize: 14.5,
    lineHeight: 1.6,
    color: marketing.color.subtle,
    margin: 0,
})

export const slideCta = style({
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
