import { globalStyle } from "@vanilla-extract/css"
import { marketing } from "../theme/marketingTheme.css"
import { spot1 } from "../shared.css"
import * as banner from "../MarketingCtaBanner.styles.css"
import * as gallery from "../MarketingGallery.styles.css"
import * as hero from "../MarketingHero.styles.css"
import * as prose from "../MarketingRichProse.styles.css"

/*
 * `tintbands` (worn with `framestack`): on a page that opens on the
 * photograph, the bands between the frames are painted plates instead of
 * the page ground — the short prose band and the closing colophon in the
 * accent, each frame's caption band in spot 1 — each edge to edge and
 * set in the ink that reads on it. Pages that open on paper keep their
 * ground.
 */
const OVER = `[data-marketing-treatment~="tintbands"]:has(${hero.fullBleed})`

globalStyle(`${OVER} ${prose.wrap}`, {
    background: marketing.color.accent,
    // The band spans the viewport from inside the page column.
    boxShadow: `0 0 0 100vmax ${marketing.color.accent}`,
    clipPath: "inset(0 -100vmax)",
})

globalStyle(`${OVER} ${prose.wrap} ${prose.title}, ${OVER} ${prose.wrap} ${prose.paragraph}`, {
    color: marketing.color.onAccent,
})

globalStyle(`${OVER} ${gallery.bandCaption}`, {
    background: spot1,
    color: marketing.color.inkOnSpot,
})

globalStyle(`${OVER} ${banner.colophon}`, {
    background: marketing.color.accent,
    color: marketing.color.onAccent,
})

globalStyle(`${OVER} ${banner.colophonLine}, ${OVER} ${banner.colophonLink}`, {
    color: marketing.color.onAccent,
})

globalStyle(`${OVER} ${banner.colophonLink}:hover`, {
    color: `color-mix(in srgb, ${marketing.color.onAccent} 78%, ${marketing.color.accent})`,
})

globalStyle(`${OVER} ${banner.colophonLink}:focus-visible`, {
    outlineColor: marketing.color.onAccent,
})
