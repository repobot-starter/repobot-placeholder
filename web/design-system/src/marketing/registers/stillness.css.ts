import { globalStyle } from "@vanilla-extract/css"
import { marketing } from "../theme/marketingTheme.css"
import { scaledSpace } from "../theme/feelBridge"
import * as gallery from "../MarketingGallery.styles.css"
import * as hero from "../MarketingHero.styles.css"

/*
 * `stillness` (basalt): the garden walk. The sequence reads as a path
 * walked frame by frame — each photograph a wide strip, square-cornered,
 * held to the right of the column, its numbered caption at the strip's
 * foot on the left like a marker stone beside the path. The hero's seal
 * is a small vermilion chop rather than a round medallion.
 */
const S = '[data-marketing-treatment~="stillness"]'

globalStyle(`${S} ${gallery.sequence}`, {
    counterReset: "walk",
    gap: scaledSpace(28),
    alignItems: "stretch",
})

globalStyle(`${S} ${gallery.sequenceFigure}`, {
    counterIncrement: "walk",
    width: "100%",
    flexDirection: "row-reverse",
    alignItems: "flex-end",
    gap: scaledSpace(28),
    "@media": {
        "(max-width: 720px)": { flexDirection: "column", alignItems: "flex-start", gap: 10 },
    },
})

// The frame's shape and width ride inline from each photo's own ratio;
// the walk crops every frame to the same wide strip, so it has to win.
globalStyle(`${S} ${gallery.sequenceFrame}`, {
    width: "78% !important",
    aspectRatio: "16 / 5 !important",
    flex: "none",
    borderRadius: 0,
    "@media": {
        "(max-width: 720px)": { width: "100% !important", aspectRatio: "16 / 7 !important" },
    },
})

globalStyle(`${S} ${gallery.sequenceCaption}`, {
    flex: 1,
    fontSize: 11,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    textAlign: "left",
})

globalStyle(`${S} ${gallery.sequenceCaption}::before`, {
    content: 'counter(walk, decimal-leading-zero) "  ·  "',
    color: marketing.color.accent,
    whiteSpace: "pre",
})

globalStyle(`${S} ${hero.seal}`, {
    width: 64,
    height: 64,
    padding: 6,
    gap: 2,
    borderRadius: 0,
    border: `1.5px solid ${marketing.color.accent}`,
    boxShadow: "none",
    background: "transparent",
    color: marketing.color.accent,
    transform: "none",
})

globalStyle(`${S} ${hero.sealTop}`, {
    fontSize: 8,
    letterSpacing: "0.2em",
})

globalStyle(`${S} ${hero.sealMain}`, {
    fontSize: 26,
})

// Wide, the chop sits low on the photograph's right, over the dark moss.
globalStyle(`${S} ${hero.fullBleedSealSlot}`, {
    "@media": {
        "(min-width: 861px)": {
            top: "auto",
            bottom: scaledSpace(48),
            left: "auto",
            right: `max(24px, calc((100vw - ${marketing.layout.maxWidth}) / 2 + 24px))`,
        },
    },
})
