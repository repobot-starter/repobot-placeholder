import { globalStyle } from "@vanilla-extract/css"
import { marketing } from "../theme/marketingTheme.css"
import * as card from "../MarketingThreadCard.styles.css"
import * as thread from "../MarketingMessageThread.styles.css"
import { spot1 } from "../shared.css"

/*
 * `concierge` (whiteglove): the house manager's thread. The phone loses
 * its device chrome and becomes a correspondence card on the white page —
 * a hairline frame, the manager's bubbles in black, the house's in a pale
 * sage wash, the confirmation chips in sage caps. The walkthrough numbers
 * are small black squares.
 */
const C = '[data-marketing-treatment~="concierge"]'

globalStyle(`${C} ${card.phone}`, {
    borderRadius: marketing.shape.radiusCard,
    border: `1px solid ${marketing.color.line}`,
    boxShadow: "none",
})

globalStyle(`${C} ${card.bubble}`, {
    borderRadius: 4,
    background: `color-mix(in srgb, ${spot1} 10%, ${marketing.color.pageBg})`,
    color: marketing.color.text,
})

globalStyle(`${C} ${card.bubbleEnd}`, {
    background: marketing.color.text,
    color: marketing.color.pageBg,
})

globalStyle(`${C} ${card.chip}`, {
    color: spot1,
    borderColor: spot1,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
})

globalStyle(`${C} ${thread.walkthroughNumber}`, {
    borderRadius: 0,
    background: marketing.color.text,
    color: marketing.color.pageBg,
})

// The correspondence leads: the card on the left, its plain lines beside it.
globalStyle(`${C} ${thread.wrap}`, {
    "@media": {
        "(min-width: 900px)": {
            gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 0.95fr)",
            gridTemplateAreas: '"phone head" "phone list" "phone ."',
        },
    },
})
