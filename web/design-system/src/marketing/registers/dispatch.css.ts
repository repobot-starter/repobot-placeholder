import { globalStyle } from "@vanilla-extract/css"
import { marketing } from "../theme/marketingTheme.css"
import * as gallery from "../MarketingGallery.styles.css"
import * as schedule from "../MarketingSchedule.styles.css"
import * as proof from "../MarketingSocialProof.styles.css"
import { spot1 } from "../shared.css"

/*
 * `dispatch` (stormline): the storm desk. The day-rows schedule becomes
 * the live dispatch board — a navy plate (the first spot ink) with the
 * crews' rows in white, times in tabular amber and a signal dot on every
 * run; the "now" chip glows. The ticker runs on the same navy strip.
 */
const D = '[data-marketing-treatment~="dispatch"]'
const boardInk = "#ffffff" // theme-exempt: copy on the navy dispatch plate is white in every theme
const boardSubtle = "rgba(255, 255, 255, 0.66)" // theme-exempt: secondary copy on the navy dispatch plate
const boardRule = "rgba(255, 255, 255, 0.14)" // theme-exempt: row rules on the navy dispatch plate

// The board runs edge to edge as a navy band; the rows and the summary sit on it.
const board = `${D} ${schedule.wrap}:has(${schedule.rows})`

globalStyle(board, {
    position: "relative",
    marginTop: 64,
    padding: "36px 0 32px",
    textAlign: "left",
    color: boardInk,
    background: spot1,
    boxShadow: `0 0 0 100vmax ${spot1}`,
    clipPath: "inset(0 -100vmax)",
})

globalStyle(`${board} ${schedule.kicker}`, {
    color: boardInk,
})

globalStyle(`${board} ${schedule.note}`, {
    maxWidth: "none",
    margin: "18px 0 0",
    fontSize: 18,
    fontWeight: 700,
    color: boardInk,
})

globalStyle(`${D} ${schedule.rows}`, {
    color: boardInk,
    borderTop: `1px solid ${boardRule}`,
    borderBottom: `1px solid ${boardRule}`,
    background: "transparent",
    padding: 0,
})

globalStyle(`${D} ${schedule.row}`, {
    borderBottomColor: boardRule,
})

globalStyle(`${D} ${schedule.row}:last-child`, {
    borderBottom: "none",
})

globalStyle(`${D} ${schedule.rows} ${schedule.dayLabel}`, {
    color: marketing.color.accent,
})

globalStyle(`${D} ${schedule.rows} ${schedule.dayLabelToday}`, {
    color: spot1,
    background: marketing.color.accent,
})

globalStyle(`${D} ${schedule.rows} ${schedule.sessionTitle}`, {
    color: boardInk,
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
})

globalStyle(`${D} ${schedule.rows} ${schedule.sessionTitle}::before`, {
    content: '""',
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: marketing.color.accent,
    flex: "none",
})

// The board reads status first, its figure at the right edge.
globalStyle(`${D} ${schedule.rows} ${schedule.rowSession}`, {
    justifyContent: "space-between",
})

globalStyle(`${D} ${schedule.rows} ${schedule.time}`, {
    order: 2,
    color: marketing.color.accent,
    fontWeight: 700,
    fontSize: 15,
})

globalStyle(`${D} ${schedule.rows} ${schedule.detail}, ${D} ${schedule.rows} ${schedule.sessionNote}`, {
    color: boardSubtle,
})

globalStyle(`${D} ${schedule.rows} ${schedule.stateNow}`, {
    color: spot1,
    boxShadow: `0 0 0 3px color-mix(in srgb, ${marketing.color.accent} 35%, transparent)`,
})

globalStyle(`${D} ${schedule.rows} ${schedule.stateNext}`, {
    color: boardInk,
    borderColor: boardRule,
})

globalStyle(`${D} ${proof.tickerTrack}`, {
    fontWeight: 700,
})

// Before and after as one wide pair, not a full-height plate.
globalStyle(`${D} ${gallery.compareFrame}`, {
    aspectRatio: "16 / 7 !important",
})
