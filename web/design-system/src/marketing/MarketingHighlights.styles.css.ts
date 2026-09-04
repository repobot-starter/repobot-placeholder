import { style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { scaledSpace } from "./theme/feelBridge"
import {
    ctaSecondary,
    emojiPanel,
    mediaImage,
    section,
    sectionHeaderCentered,
    sectionKicker,
    sectionTitle,
} from "./shared.css"

export const wrap = style([section, sectionHeaderCentered])

export const kicker = sectionKicker

/**
 * A kicker with no title under it is the section's whole header — the 8px
 * title-gap reads cramped against the first row, so it gets real air.
 */
export const kickerSolo = style([sectionKicker, { marginBottom: scaledSpace(28) }])

export const title = sectionTitle

export const rows = style({
    display: "flex",
    flexDirection: "column",
    gap: scaledSpace(56),
    textAlign: "left",
})

export const row = style({
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: scaledSpace(48),
    alignItems: "center",
    "@media": {
        "(max-width: 860px)": { gridTemplateColumns: "1fr", gap: scaledSpace(24) },
    },
})

/** Alternating rows only swap sides while the row is actually two columns. */
export const mediaFlipped = style({
    "@media": {
        "(min-width: 861px)": { order: 2 },
    },
})

export const stack = style({
    display: "flex",
    flexDirection: "column",
    gap: scaledSpace(56),
    maxWidth: 720,
    margin: "0 auto",
    textAlign: "left",
})

export const stackItem = style({
    display: "flex",
    flexDirection: "column",
    gap: scaledSpace(24),
})

export const copy = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 14,
})

export const copyFull = style({
    gridColumn: "1 / -1",
})

export const headline = style({
    fontFamily: marketing.font.display,
    fontSize: "clamp(20px, 3vw, 26px)",
    fontWeight: marketing.display.weight,
    letterSpacing: marketing.display.tracking,
    // The contract emits plain var strings; the token is "none" | "uppercase".
    textTransform: marketing.display.transform as "none",
    color: marketing.color.text,
    margin: 0,
})

export const body = style({
    fontSize: 16,
    lineHeight: 1.7,
    color: marketing.color.subtle,
    margin: 0,
})

export const cta = ctaSecondary

export const mediaEmoji = emojiPanel

export const mediaImg = mediaImage

/*
 * `setlist`: the rows as a show poster — each headline at display scale
 * between thin rules, its body as the small annotation underneath. The
 * register's display voice (case, family, scale) decides whether it reads
 * as a tour lineup or a wedding program.
 */
export const setlist = style({
    display: "flex",
    flexDirection: "column",
    textAlign: "center",
    borderTop: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
})

export const setlistRow = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    padding: `${scaledSpace(26)} 0`,
    borderBottom: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
})

export const setlistHeadline = style({
    fontFamily: marketing.font.display,
    fontSize: `calc(clamp(24px, 3.6vw, 38px) * ${marketing.display.scale})`,
    fontWeight: marketing.display.weight,
    letterSpacing: marketing.display.tracking,
    // The contract emits plain var strings; the token is "none" | "uppercase".
    textTransform: marketing.display.transform as "none",
    lineHeight: 1.15,
    color: marketing.color.text,
    margin: 0,
})

export const setlistBody = style({
    fontSize: 14,
    lineHeight: 1.6,
    letterSpacing: "0.06em",
    color: marketing.color.subtle,
    margin: 0,
})
