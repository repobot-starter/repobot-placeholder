import { globalStyle } from "@vanilla-extract/css"
import { marketing } from "../theme/marketingTheme.css"
import * as showcase from "../MarketingShowcase.styles.css"
import * as steps from "../MarketingSteps.styles.css"
import { scriptFont } from "../shared.css"

/*
 * `gauge` (plantroom): the estate's mechanical log. The specimens drawer
 * becomes the systems index — each plate a square-cornered instrument
 * window under a copper index line, the name in the condensed caps, the
 * care interval in mono after its slash. Timeline dots are gauge faces.
 */
const G = '[data-marketing-treatment~="gauge"]'

globalStyle(`${G} ${showcase.specimens}`, {
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 16,
    "@media": {
        "(max-width: 860px)": { gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 },
    },
})

globalStyle(`${G} ${showcase.specimen}`, {
    border: `1px solid ${marketing.color.line}`,
    background: marketing.color.surface,
    padding: "0 0 16px",
})

globalStyle(`${G} ${showcase.specimen} > *:not(${showcase.specimenPlate})`, {
    marginLeft: 16,
    marginRight: 16,
})

globalStyle(`${G} ${showcase.specimenPlate}`, {
    aspectRatio: "4 / 3",
    borderRadius: 0,
    borderBottom: `1px solid ${marketing.color.line}`,
})

globalStyle(`${G} ${showcase.specimenIndex}`, {
    fontFamily: scriptFont,
    fontSize: 12,
    letterSpacing: "0.12em",
    paddingTop: 10,
    borderTop: `1px solid ${marketing.color.accent}`,
})

globalStyle(`${G} ${showcase.specimenName}`, {
    textTransform: "uppercase",
    letterSpacing: "0.02em",
})

globalStyle(`${G} ${showcase.specimenUse}`, {
    fontFamily: scriptFont,
    color: marketing.color.accent,
})

globalStyle(`${G} ${steps.timelineDot}`, {
    borderRadius: "50%",
    background: marketing.color.pageBg,
    boxShadow: `0 0 0 1px ${marketing.color.accent}, inset 0 0 0 3px ${marketing.color.pageBg}, inset 0 0 0 4px ${marketing.color.accent}`,
})
