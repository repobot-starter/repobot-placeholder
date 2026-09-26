import { globalStyle } from "@vanilla-extract/css"
import { marketing } from "../theme/marketingTheme.css"
import * as schedule from "../MarketingSchedule.styles.css"
import { spot1, spot2 } from "../shared.css"

/*
 * `cabana` (palmbeach): the club's season card. The week-grid becomes the
 * season calendar — each column a month panel on the surface with a gold
 * keyline, the month in spaced caps, the current window flagged in
 * flamingo; the page's bamboo frame lives with the page shell
 * (MarketingPage.styles).
 */
const C = '[data-marketing-treatment~="cabana"]'

// One season card: the months as columns on a single gold-keyed panel.
globalStyle(`${C} ${schedule.grid}`, {
    gap: 0,
    padding: "10px 0",
    border: `1px solid color-mix(in srgb, ${spot2} 70%, transparent)`,
    background: marketing.color.surface,
    borderRadius: marketing.shape.radiusCard,
})

globalStyle(`${C} ${schedule.column}, ${C} ${schedule.columnToday}`, {
    textAlign: "center",
    alignItems: "center",
    background: "transparent",
    border: "none",
    borderLeft: `1px dashed color-mix(in srgb, ${spot2} 60%, transparent)`,
    borderRadius: 0,
})

globalStyle(`${C} ${schedule.column}:first-child, ${C} ${schedule.columnToday}:first-child`, {
    borderLeft: "none",
})

globalStyle(`${C} ${schedule.dayLabel}, ${C} ${schedule.dayLabelToday}`, {
    fontFamily: marketing.font.display,
    fontSize: 26,
    fontWeight: 700,
    letterSpacing: "0.02em",
    textTransform: "uppercase",
    color: marketing.color.accent,
    background: "transparent",
    border: "none",
    marginBottom: 4,
})

// The current window: its month flagged under a flamingo keyline.
globalStyle(`${C} ${schedule.dayLabelToday}`, {
    boxShadow: `inset 0 -3px 0 ${spot1}`,
})

globalStyle(`${C} ${schedule.time}`, {
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: marketing.color.accent,
})

globalStyle(`${C} ${schedule.columnSessions}, ${C} ${schedule.session}`, {
    alignItems: "center",
    textAlign: "center",
})
