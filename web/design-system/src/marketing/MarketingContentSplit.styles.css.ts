import { style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { scaledSpace } from "./theme/feelBridge"
import { ctaPrimary, emojiPanel, mediaImage, section, sectionKicker } from "./shared.css"

export const wrap = style([
    section,
    {
        display: "grid",
        gridTemplateColumns: "1.1fr 0.9fr",
        gap: scaledSpace(48),
        alignItems: "center",
        textAlign: "left",
        "@media": {
            "(max-width: 860px)": { gridTemplateColumns: "1fr", gap: scaledSpace(32) },
        },
    },
])

export const wrapMediaLeft = style({
    gridTemplateColumns: "0.9fr 1.1fr",
    "@media": {
        "(max-width: 860px)": { gridTemplateColumns: "1fr" },
    },
})

/** Over a backdrop the split is an edge-to-edge band, not a framed section. */
export const grid = style({
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    gap: scaledSpace(48),
    alignItems: "center",
    textAlign: "left",
    padding: `${scaledSpace(88)} 0`,
    marginTop: scaledSpace(72),
    "@media": {
        "(max-width: 860px)": { gridTemplateColumns: "1fr", gap: scaledSpace(32) },
    },
})

export const gridMediaLeft = style({
    gridTemplateColumns: "0.9fr 1.1fr",
    "@media": {
        "(max-width: 860px)": { gridTemplateColumns: "1fr" },
    },
})

export const kicker = sectionKicker

export const headline = style({
    fontFamily: marketing.font.display,
    fontSize: "clamp(26px, 4vw, 36px)",
    fontWeight: marketing.display.weight,
    letterSpacing: marketing.display.tracking,
    // The contract emits plain var strings; the token is "none" | "uppercase".
    textTransform: marketing.display.transform as "none",
    lineHeight: 1.15,
    color: marketing.color.text,
    margin: "0 0 18px",
})

export const body = style({
    fontSize: 16,
    lineHeight: 1.7,
    color: marketing.color.subtle,
    margin: 0,
})

export const bullets = style({
    listStyle: "none",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    margin: "22px 0 0",
    padding: 0,
})

export const bullet = style({
    display: "flex",
    gap: 10,
    fontSize: 15,
    lineHeight: 1.6,
    color: marketing.color.text,
})

export const bulletMark = style({
    color: marketing.color.accent,
    fontWeight: 700,
    flexShrink: 0,
})

export const ctaRow = style({
    marginTop: 28,
})

export const cta = ctaPrimary

export const mediaEmoji = emojiPanel

export const mediaImg = mediaImage
