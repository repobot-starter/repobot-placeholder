import { globalStyle } from "@vanilla-extract/css"
import { marketing } from "../theme/marketingTheme.css"
import * as hero from "../MarketingHero.styles.css"
import * as showcase from "../MarketingShowcase.styles.css"

/*
 * `journal` (plaster): the garden notebook. The newspaper stories grid
 * turns into the seasonal journal — the heavy rule softens to a hairline,
 * the flag is set in the italic serif, each dateline is a season written
 * in the olive ink, and the preset's engraved olive sprig sits in the
 * margin beside the journal's title like a pressed leaf.
 */
const J = '[data-marketing-treatment~="journal"]'

globalStyle(`${J} ${showcase.storiesWrap}`, {
    position: "relative",
})

globalStyle(`${J} ${showcase.storiesWrap}::before`, {
    content: '""',
    position: "absolute",
    top: 0,
    right: 0,
    width: 96,
    height: 132,
    backgroundImage: "var(--marketing-ornament, none)",
    backgroundRepeat: "no-repeat",
    backgroundSize: "contain",
    opacity: 0.85,
    pointerEvents: "none",
    "@media": {
        "(max-width: 720px)": { width: 64, height: 88 },
    },
})

globalStyle(`${J} ${showcase.storiesFlag}`, {
    fontFamily: marketing.font.display,
    fontStyle: "italic",
    textTransform: "none",
    letterSpacing: 0,
    borderTopWidth: 1,
})

globalStyle(`${J} ${showcase.storiesGrid}`, {
    borderTopWidth: 1,
})

globalStyle(`${J} ${showcase.storyDateline}, ${J} ${showcase.storyKicker}`, {
    fontFamily: marketing.font.display,
    fontStyle: "italic",
    fontSize: 16,
    letterSpacing: 0,
    textTransform: "none",
    color: marketing.color.accent,
})

globalStyle(`${J} ${showcase.storyImg}`, {
    borderRadius: 1,
})

globalStyle(`${J} ${showcase.storyJump}`, {
    fontFamily: marketing.font.display,
    fontStyle: "italic",
    textTransform: "none",
    letterSpacing: 0,
    fontSize: 16,
})

// Each entry is a card pinned in the notebook, not a newspaper column.
globalStyle(`${J} ${showcase.story}`, {
    padding: 16,
    background: marketing.color.surface,
    border: `1px solid ${marketing.color.line}`,
})

globalStyle(`${J} ${showcase.story}::before`, {
    display: "none",
})

globalStyle(`${J} ${showcase.storyPhoto}, ${J} ${showcase.storyPhotoLead}`, {
    padding: 0,
    border: "none",
})

globalStyle(`${J} ${hero.fullBleed} ${hero.headline}`, {
    fontStyle: "italic",
})
