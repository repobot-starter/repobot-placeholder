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

export const chipRow = style({
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    margin: `0 0 ${scaledSpace(30)}`,
})

export const chip = style({
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "inherit",
    color: marketing.color.subtle,
    background: "transparent",
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusControl,
    padding: "7px 14px",
    cursor: "pointer",
    selectors: {
        "&:hover": { borderColor: marketing.color.subtle },
        '&[aria-pressed="true"]': {
            color: marketing.color.onAccent,
            background: marketing.color.accent,
            borderColor: marketing.color.accent,
        },
    },
})

export const grid = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: scaledSpace(18),
    textAlign: "left",
})

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
        fontSize: 44,
        minHeight: 130,
        marginBottom: 6,
    },
])

export const mediaImg = style([
    mediaImage,
    {
        marginBottom: 6,
    },
])

/** Positions the card-grid media so the status badge can ride its corner. */
export const mediaWrap = style({
    position: "relative",
})

/**
 * The status pill (a listing's "Sold" / "New this week"): small uppercase
 * signage that must stay legible over a photograph, so both tones are
 * solid fills — accent for live states, ink for settled ones.
 */
export const badge = style({
    zIndex: 1,
    display: "inline-flex",
    alignItems: "center",
    width: "fit-content",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    lineHeight: 1,
    padding: "6px 10px",
    borderRadius: marketing.shape.radiusControl,
})

export const badgeOverlay = style({
    position: "absolute",
    top: 10,
    left: 10,
})

export const badgeAccent = style({
    color: marketing.color.onAccent,
    background: marketing.color.accent,
})

export const badgeNeutral = style({
    color: marketing.color.pageBg,
    background: marketing.color.text,
})

export const eyebrow = style({
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: marketing.color.accent,
})

export const titleRow = style({
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
})

export const itemTitle = style({
    fontFamily: marketing.font.display,
    fontSize: 17,
    fontWeight: 700,
    color: marketing.color.text,
    margin: 0,
})

export const itemLink = style({
    color: "inherit",
    textDecoration: "none",
    selectors: {
        "&:hover": { color: marketing.color.accent },
    },
})

export const meta = style({
    flexShrink: 0,
    fontFamily: marketing.font.display,
    fontSize: 15,
    fontWeight: 700,
    color: marketing.color.accent,
})

export const itemDescription = style({
    fontSize: 14.5,
    lineHeight: 1.6,
    color: marketing.color.subtle,
    margin: 0,
})

export const tagRow = style({
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
})

export const tag = style({
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
    background: marketing.color.accentSoft,
    borderRadius: marketing.shape.radiusControl,
    padding: "3px 9px",
})

/**
 * `collections`: large cover tiles, two abreast — the album index. The
 * cover carries the tile; text sits quietly beneath it, and the whole
 * card links out.
 */
export const collectionsGrid = style({
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: `${scaledSpace(36)} ${scaledSpace(28)}`,
    textAlign: "left",
    "@media": {
        "(max-width: 760px)": { gridTemplateColumns: "1fr" },
    },
})

export const collectionCard = style({
    display: "flex",
    flexDirection: "column",
    gap: 8,
    color: "inherit",
    textDecoration: "none",
})

export const collectionCover = style({
    position: "relative",
    overflow: "hidden",
    borderRadius: marketing.shape.radiusCard,
    aspectRatio: "3 / 2",
    marginBottom: 8,
})

export const collectionImg = style({
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    transition: "transform 500ms ease",
    selectors: {
        [`${collectionCard}:hover &`]: { transform: "scale(1.02)" },
    },
    "@media": {
        "(prefers-reduced-motion: reduce)": {
            transition: "none",
            selectors: {
                [`${collectionCard}:hover &`]: { transform: "none" },
            },
        },
    },
})

/**
 * `media-rail`: the collection covers along a scroll-snapped horizontal
 * strip (the carousel's pure-CSS pattern) — the album index as a browsable
 * lineup instead of a tile grid.
 */
export const rail = style({
    display: "flex",
    gap: scaledSpace(20),
    overflowX: "auto",
    scrollSnapType: "x proximity",
    scrollBehavior: "smooth",
    scrollPadding: 4,
    padding: "4px 4px 16px",
    textAlign: "left",
    "@media": {
        "(prefers-reduced-motion: reduce)": { scrollBehavior: "auto" },
    },
})

export const railCell = style({
    flex: "0 0 min(420px, 80%)",
    scrollSnapAlign: "start",
})

export const collectionTitle = style({
    fontFamily: marketing.font.display,
    fontSize: 20,
    fontWeight: marketing.display.weight,
    letterSpacing: marketing.display.tracking,
    color: marketing.color.text,
    margin: 0,
    selectors: {
        [`${collectionCard}:hover &`]: { color: marketing.color.accent },
    },
})
