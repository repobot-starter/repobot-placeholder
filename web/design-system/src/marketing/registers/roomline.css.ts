import { globalStyle } from "@vanilla-extract/css"
import { marketing } from "../theme/marketingTheme.css"
import { scaledSpace } from "../theme/feelBridge"
import * as gallery from "../MarketingGallery.styles.css"
import * as hero from "../MarketingHero.styles.css"
import * as shell from "../MarketingShell.styles.css"

/*
 * `roomline` (worn with `framestack`): the stack captioned inside its
 * photographs. The hero's headline drops to the size of a caption and
 * sits where every frame's caption sits — the foot of the photograph at
 * the page column — so the opening room reads as the first frame of the
 * stack with its line written into it, and each `captionStack`
 * `overlay-*` caption is the same quiet sentence-case line in the display
 * face (the room, a dash, its finish) on a lighter, taller scrim. The
 * wordmark over the first room is set in spaced caps. Needs photographs
 * that are darker or busy at the foot, where the scrim sits.
 */
const R = '[data-marketing-treatment~="roomline"]'
const LINE = `clamp(17px, 1.45vw, 22px)`

globalStyle(`${R} ${hero.fullBleedInner}`, {
    paddingBottom: scaledSpace(24),
    "@media": {
        "(max-width: 640px)": { paddingBottom: 16, paddingLeft: 20, paddingRight: 20 },
    },
})

globalStyle(`${R} ${hero.fullBleed} ${hero.headline}`, {
    fontSize: `calc(${LINE} * 1.08)`,
    lineHeight: 1.35,
    letterSpacing: "0",
    maxWidth: "28em",
    "@media": {
        "(max-width: 640px)": { fontSize: 17 },
    },
})

globalStyle(`${R} ${gallery.overlayCaption}`, {
    padding: `${scaledSpace(64)} max(20px, calc((100% - ${marketing.layout.maxWidth}) / 2 + 24px)) ${scaledSpace(24)}`,
    background: "linear-gradient(to top, rgba(8, 10, 14, 0.42), rgba(8, 10, 14, 0))", // theme-exempt: the register's lighter, taller scrim over photography, the same in every theme
    fontFamily: marketing.font.display,
    fontSize: LINE,
    lineHeight: 1.35,
    letterSpacing: "0",
    textTransform: "none",
    "@media": {
        "(max-width: 640px)": { fontSize: 15.5, letterSpacing: "0", paddingBottom: 16, paddingInline: 20 },
    },
})

globalStyle(`${R} ${shell.logo}`, {
    fontFamily: marketing.font.display,
    fontSize: "clamp(19px, 1.75vw, 26px)",
    fontWeight: 400,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
})
