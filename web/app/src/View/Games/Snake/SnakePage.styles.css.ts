import { globalStyle, style } from "@vanilla-extract/css"

const bg = "#0a0a0a"
const surface = "#111112"
const ink = "var(--pack-accent, #fafafa)"
const inkSoft = "#a1a1aa"
const inkFaint = "#5b5b60"
const hairline = "rgba(255, 255, 255, 0.1)"
const hairlineStrong = "rgba(255, 255, 255, 0.18)"
const sans = "var(--pack-font, Inter, system-ui, sans-serif)"
const mono = '"IBM Plex Mono", monospace'

/** Full-viewport wrapper (owns the near-black background). */
export const page = style({
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "28px 40px",
    fontFamily: sans,
    background: bg,
    color: ink,
    userSelect: "none",
    boxSizing: "border-box",
    overflow: "hidden",
})

globalStyle(`${page} *`, {
    boxSizing: "border-box",
})

// Width capped by viewport height so the board plus chrome never scrolls:
// board width = (available height) * (672 / 528), plus the 298px side rail.
export const frame = style({
    display: "flex",
    flexDirection: "column",
    width: "min(1200px, 100%, calc((100vh - 176px) * (672 / 528) + 298px))",
    gap: 18,
})

export const header = style({
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 24,
})

export const wordmarkBlock = style({
    display: "flex",
    flexDirection: "column",
    gap: 6,
})

export const wordmark = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 20,
    letterSpacing: "0.34em",
    textTransform: "uppercase",
    color: ink,
})

export const tagline = style({
    fontSize: 13,
    fontWeight: 400,
    color: inkSoft,
})

export const headerActions = style({
    display: "flex",
    alignItems: "center",
    gap: 10,
})

export const button = style({
    font: "inherit",
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 11,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    padding: "9px 18px",
    color: ink,
    background: "transparent",
    border: `1px solid ${hairlineStrong}`,
    borderRadius: 8,
    cursor: "pointer",
    transition: "background 120ms ease",
    ":disabled": {
        color: inkFaint,
        cursor: "default",
    },
    selectors: {
        "&:hover:not(:disabled)": {
            background: "rgba(255, 255, 255, 0.06)",
        },
    },
})

export const buttonPrimary = style([
    button,
    {
        background: ink,
        borderColor: ink,
        color: "#0a0a0a",
        selectors: {
            "&:hover:not(:disabled)": {
                background: "#d4d4d8",
            },
        },
    },
])

export const body = style({
    display: "flex",
    gap: 18,
    minHeight: 0,
})

export const screenArea = style({
    flex: 1,
    minWidth: 0,
})

export const screen = style({
    position: "relative",
    width: "100%",
    aspectRatio: "672 / 528",
    background: surface,
    border: `1px solid ${hairline}`,
    borderRadius: 12,
    overflow: "hidden",
})

export const board = style({
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    display: "block",
})

export const rail = style({
    width: 280,
    flex: "none",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    minHeight: 0,
})

export const panel = style({
    display: "flex",
    flexDirection: "column",
    gap: 12,
    padding: "16px 18px",
    background: surface,
    border: `1px solid ${hairline}`,
    borderRadius: 10,
})

export const panelScores = style([panel, { flex: 1, minHeight: 0, overflowY: "auto" }])

export const panelLabel = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 10,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: inkFaint,
})

export const statGrid = style({
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
})

export const stat = style({
    display: "flex",
    flexDirection: "column",
    gap: 4,
})

export const statLabel = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 10,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: inkFaint,
})

export const statValue = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 22,
    color: ink,
    fontVariantNumeric: "tabular-nums",
})

export const speedTrack = style({
    display: "flex",
    gap: 4,
    paddingTop: 4,
})

export const block = style({
    width: 6,
    height: 5,
    borderRadius: 2,
    background: "rgba(255, 255, 255, 0.1)",
})

export const blockOn = style([
    block,
    {
        background: ink,
    },
])

export const scores = style({
    margin: 0,
    padding: 0,
    listStyle: "none",
    fontFamily: mono,
    fontSize: 12,
    color: inkSoft,
})

globalStyle(`${scores} li`, {
    display: "flex",
    justifyContent: "space-between",
    padding: "5px 0",
    borderBottom: `1px solid rgba(255, 255, 255, 0.05)`,
})

globalStyle(`${scores} li:first-child`, {
    color: ink,
})

globalStyle(`${scores} li:last-child`, {
    borderBottom: "none",
})

export const scoresEmpty = style({
    fontSize: 12,
    color: inkFaint,
})

export const modal = style({
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    background: "rgba(10, 10, 10, 0.84)",
    backdropFilter: "blur(2px)",
})

export const modalTitle = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 26,
    letterSpacing: "0.3em",
    textTransform: "uppercase",
    color: ink,
})

export const modalScore = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 14,
    letterSpacing: "0.18em",
    color: inkSoft,
})

export const initialsRow = style({
    display: "flex",
    gap: 8,
})

globalStyle(`${initialsRow} input`, {
    width: 170,
    font: "inherit",
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 12,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: ink,
    background: "transparent",
    border: `1px solid ${hairlineStrong}`,
    borderRadius: 8,
    padding: "9px 12px",
    outline: "none",
})

globalStyle(`${initialsRow} input:focus`, {
    borderColor: "rgba(255, 255, 255, 0.4)",
})

export const statusBar = style({
    display: "flex",
    justifyContent: "space-between",
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 10,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: inkFaint,
})
