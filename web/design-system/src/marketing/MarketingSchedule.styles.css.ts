import { style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { scaledSpace } from "./theme/feelBridge"
import { ctaPrimary, section, sectionHeaderCentered, sectionKicker, sectionTitle } from "./shared.css"

export const wrap = style([section, sectionHeaderCentered])

export const kicker = sectionKicker

export const title = style([
    sectionTitle,
    {
        marginBottom: scaledSpace(14),
    },
])

export const intro = style({
    fontSize: 15.5,
    lineHeight: 1.6,
    color: marketing.color.subtle,
    maxWidth: 560,
    margin: `0 auto ${scaledSpace(16)}`,
})

/** The live status chip: hairline pill, uppercase microcopy, accent dot. */
export const badge = style({
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontSize: 11.5,
    fontWeight: 600,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: marketing.color.text,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusControl,
    padding: "7px 14px",
    marginBottom: scaledSpace(28),
})

export const badgeDot = style({
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: marketing.color.accent,
})

/* ------------------------------------------------------------ week-grid */

export const grid = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    borderTop: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderBottom: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    textAlign: "left",
    "@media": {
        "(max-width: 860px)": {
            gridTemplateColumns: "1fr",
        },
    },
})

const columnBase = {
    display: "flex",
    flexDirection: "column" as const,
    padding: `${scaledSpace(18)} ${scaledSpace(16)} ${scaledSpace(20)}`,
    borderLeft: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    selectors: {
        "&:first-child": { borderLeft: "none" },
    },
    "@media": {
        "(max-width: 860px)": {
            borderLeft: "none",
            borderTop: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
            selectors: { "&:first-child": { borderTop: "none" } },
        },
    },
}

export const column = style(columnBase)

/** Today's column sits on the surface tone — a felt lift, not a color. */
export const columnToday = style({
    ...columnBase,
    background: marketing.color.surface,
})

export const dayLabel = style({
    fontSize: 11.5,
    fontWeight: 600,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
    paddingBottom: 12,
})

/** Today, inverted to ink-on-ground: the one loud mark the grid makes. */
export const dayLabelToday = style({
    alignSelf: "flex-start",
    fontSize: 11.5,
    fontWeight: 700,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: marketing.color.pageBg,
    background: marketing.color.text,
    borderRadius: marketing.shape.radiusControl,
    padding: "3px 8px",
    marginBottom: 9,
})

export const columnSessions = style({
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
})

export const session = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
    padding: "12px 0",
    borderTop: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    selectors: {
        "&:first-child": { borderTop: "none" },
    },
})

export const time = style({
    fontSize: 12,
    fontVariantNumeric: "tabular-nums",
    letterSpacing: "0.04em",
    color: marketing.color.subtle,
})

export const sessionTitle = style({
    fontSize: 14.5,
    fontWeight: 600,
    lineHeight: 1.3,
    color: marketing.color.text,
})

export const detail = style({
    fontSize: 12.5,
    color: marketing.color.subtle,
})

export const sessionNote = style({
    fontSize: 11.5,
    fontStyle: "italic",
    color: marketing.color.subtle,
})

const stateChip = {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    borderRadius: marketing.shape.radiusControl,
    padding: "2px 7px",
    marginTop: 4,
}

export const stateNow = style({
    ...stateChip,
    color: marketing.color.onAccent,
    background: marketing.color.accent,
})

export const stateNext = style({
    ...stateChip,
    color: marketing.color.text,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
})

/* ------------------------------------------------------------- day-rows */

export const rows = style({
    borderTop: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    textAlign: "left",
})

export const row = style({
    display: "grid",
    gridTemplateColumns: "140px 1fr",
    gap: scaledSpace(24),
    padding: `${scaledSpace(18)} 0`,
    borderBottom: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    "@media": {
        "(max-width: 640px)": {
            gridTemplateColumns: "1fr",
            gap: 10,
        },
    },
})

export const rowSessions = style({
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "flex",
    flexDirection: "column",
    gap: 10,
})

export const rowSession = style({
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    columnGap: 14,
    rowGap: 2,
})

/* ---------------------------------------------------------------- close */

export const note = style({
    fontSize: 13,
    lineHeight: 1.6,
    color: marketing.color.subtle,
    maxWidth: 560,
    margin: `${scaledSpace(20)} auto 0`,
})

export const ctaRow = style({
    marginTop: scaledSpace(28),
})

export const cta = ctaPrimary
