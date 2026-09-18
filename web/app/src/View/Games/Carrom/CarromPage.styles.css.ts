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

// The queen is the one accent on the board: everything else stays monochrome.
const queenRed = "#c2382c"

/** Full-viewport wrapper (owns the near-black background). */
export const page = style({
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "28px 40px",
    fontFamily: sans,
    background: bg,
    color: ink,
    userSelect: "none",
    boxSizing: "border-box",
})

globalStyle(`${page} *`, {
    boxSizing: "border-box",
})

export const parlor = style({
    display: "flex",
    flexDirection: "column",
    width: "min(1240px, 100%)",
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
        borderColor: hairline,
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

export const buttonMuted = style([
    button,
    {
        color: inkFaint,
        borderColor: hairline,
    },
])

export const layout = style({
    display: "flex",
    gap: 18,
    alignItems: "stretch",
    minHeight: 0,
})

export const sideColumn = style({
    width: 250,
    flex: "none",
    display: "flex",
    flexDirection: "column",
    gap: 12,
})

export const panel = style({
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: "16px 18px",
    background: surface,
    border: `1px solid ${hairline}`,
    borderRadius: 10,
})

export const panelHeader = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 10,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: inkFaint,
})

export const segmented = style({
    display: "flex",
    flexWrap: "wrap",
    gap: 4,
})

export const segment = style({
    font: "inherit",
    fontSize: 12,
    fontWeight: 500,
    padding: "6px 12px",
    color: inkSoft,
    background: "transparent",
    border: "1px solid transparent",
    borderRadius: 6,
    cursor: "pointer",
    transition: "color 120ms ease, background 120ms ease",
    ":hover": {
        color: ink,
    },
    ":disabled": {
        color: inkFaint,
        cursor: "default",
    },
})

export const segmentOn = style([
    segment,
    {
        color: "#0a0a0a",
        background: ink,
        ":hover": {
            color: "#0a0a0a",
        },
        ":disabled": {
            color: "#0a0a0a",
            opacity: 0.4,
        },
    },
])

/** Coin tray: a rail showing pocketed coins per player. */
export const tray = style({
    display: "flex",
    alignItems: "center",
    gap: 5,
    minHeight: 34,
    padding: "6px 10px",
    borderRadius: 8,
    background: "rgba(255, 255, 255, 0.04)",
    border: `1px solid ${hairline}`,
})

export const trayCoin = style({
    width: 18,
    height: 18,
    borderRadius: "50%",
    flex: "none",
})

export const trayCoinWhite = style([
    trayCoin,
    {
        background: "#f2f2f4",
        border: "1px solid #c6c6cc",
    },
])

export const trayCoinBlack = style([
    trayCoin,
    {
        background: "#232326",
        border: "1px solid #66666e",
    },
])

export const trayCoinQueen = style([
    trayCoin,
    {
        background: queenRed,
        border: "1px solid #8c2018",
    },
])

export const trayEmpty = style({
    fontSize: 11.5,
    color: inkFaint,
})

export const trayLabel = style({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 10,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: inkFaint,
})

export const trayLabelActive = style([
    trayLabel,
    {
        color: ink,
    },
])

export const scoreRow = style({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    fontSize: 13,
    color: inkSoft,
})

export const scoreBig = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 26,
    color: ink,
    lineHeight: 1.1,
    fontVariantNumeric: "tabular-nums",
})

export const muted = style({
    margin: 0,
    fontSize: 12,
    lineHeight: 1.6,
    color: inkFaint,
})

export const boardWell = style({
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    alignItems: "center",
})

export const boardFrame = style({
    padding: 14,
    borderRadius: 12,
    background: surface,
    border: `1px solid ${hairline}`,
    boxShadow: "0 24px 64px rgba(0, 0, 0, 0.5)",
    maxWidth: "100%",
})

export const board = style({
    display: "block",
    width: "min(640px, 74vh, 100%)",
    height: "auto",
    borderRadius: 8,
    touchAction: "none",
    cursor: "crosshair",
})

/** Turn / foul / result ticker under the board. */
export const messageBar = style({
    width: "100%",
    maxWidth: 668,
    textAlign: "center",
    padding: "9px 14px",
    fontSize: 13,
    borderRadius: 8,
    border: `1px solid ${hairline}`,
    background: surface,
    color: inkSoft,
})

export const messageFoul = style([
    messageBar,
    {
        color: "#e08a7c",
        borderColor: "rgba(194, 56, 44, 0.5)",
    },
])

export const hint = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 10,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: inkFaint,
})

export const statChip = style({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    fontSize: 12,
    color: inkSoft,
})

export const statValue = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 13,
    color: ink,
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
