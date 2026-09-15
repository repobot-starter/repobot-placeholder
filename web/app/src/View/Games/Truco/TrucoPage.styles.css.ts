import { globalStyle, keyframes, style } from "@vanilla-extract/css"

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

export const cabinet = style({
    display: "flex",
    flexDirection: "column",
    width: "min(1240px, 100%)",
    height: "100%",
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
            "&:disabled": {
                background: "rgba(255, 255, 255, 0.12)",
                borderColor: "transparent",
                color: inkFaint,
            },
        },
    },
])

export const layout = style({
    flex: 1,
    display: "flex",
    gap: 18,
    minHeight: 0,
})

export const panelColumn = style({
    width: 240,
    flex: "none",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    overflowY: "auto",
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

export const scoreRow = style({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    fontSize: 12,
    color: inkSoft,
})

export const scoreValue = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 24,
    color: ink,
    fontVariantNumeric: "tabular-nums",
})

export const stakeBadge = style({
    alignSelf: "flex-start",
    marginTop: 2,
    padding: "3px 12px",
    border: `1px solid ${hairlineStrong}`,
    borderRadius: 999,
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 11,
    letterSpacing: "0.06em",
    color: ink,
})

export const muted = style({
    margin: 0,
    fontSize: 12,
    lineHeight: 1.6,
    color: inkSoft,
})

export const sliderRow = style({
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: 12,
    color: inkSoft,
})

globalStyle(`${sliderRow} input`, {
    width: "100%",
    accentColor: ink,
})

export const sliderScale = style({
    display: "flex",
    justifyContent: "space-between",
    fontFamily: mono,
    fontSize: 9,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: inkFaint,
})

export const trucoButton = style([buttonPrimary, { width: "100%", padding: "11px 18px" }])

export const newGameButton = style([button, { width: "100%" }])

export const stats = style({
    display: "flex",
    flexDirection: "column",
    gap: 8,
    margin: 0,
})

globalStyle(`${stats} div`, {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
})

globalStyle(`${stats} dt`, {
    fontSize: 12,
    color: inkSoft,
})

globalStyle(`${stats} dd`, {
    margin: 0,
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 13,
    color: ink,
})

// ------------------------------------------------------------------
// The table
// ------------------------------------------------------------------

export const tableArea = style({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    minWidth: 0,
})

export const table = style({
    position: "relative",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "20px 24px",
    borderRadius: 12,
    border: `1px solid ${hairline}`,
    background: surface,
    overflow: "hidden",
    minHeight: 0,
})

export const seatRow = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 96,
})

export const seatLabel = style({
    position: "absolute",
    left: 24,
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: inkFaint,
})

export const botSeat = style([seatRow, { position: "relative" }])
export const playerSeat = style([seatRow, { position: "relative" }])

export const trickArea = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
    minHeight: 130,
})

export const trickSlot = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 9,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: inkFaint,
})

export const viraColumn = style([trickSlot, {}])

export const trickDots = style({
    display: "flex",
    gap: 6,
    justifyContent: "center",
})

export const trickDot = style({
    width: 10,
    height: 10,
    borderRadius: "50%",
    border: `1px solid ${hairlineStrong}`,
})

export const trickDotPlayer = style([trickDot, { background: ink, borderColor: ink }])
export const trickDotBot = style([trickDot, { background: "#55555b", borderColor: "#55555b" }])
export const trickDotTie = style([trickDot, { background: "rgba(255, 255, 255, 0.3)" }])

// ------------------------------------------------------------------
// Cards
// ------------------------------------------------------------------

const manilhaPulse = keyframes({
    "0%": { boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.45), 0 4px 14px rgba(0, 0, 0, 0.45)" },
    "50%": { boxShadow: "0 0 0 2px rgba(255, 255, 255, 0.85), 0 4px 14px rgba(0, 0, 0, 0.45)" },
    "100%": { boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.45), 0 4px 14px rgba(0, 0, 0, 0.45)" },
})

export const card = style({
    position: "relative",
    width: 62,
    height: 88,
    borderRadius: 8,
    background: "#fcfcfc",
    color: "#151517",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: mono,
    fontWeight: 600,
    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.45)",
    flex: "none",
})

// Monochrome deck: hearts and diamonds carry the lighter ink.
export const cardRed = style([card, { color: "#8f8f96" }])

export const cardManilha = style({
    animation: `${manilhaPulse} 1.6s ease-in-out infinite`,
})

export const cardCorner = style({
    position: "absolute",
    top: 4,
    left: 6,
    fontSize: 12,
    lineHeight: 1.1,
    textAlign: "left",
})

export const cardCornerBottom = style([
    cardCorner,
    {
        top: "auto",
        left: "auto",
        bottom: 4,
        right: 6,
        transform: "rotate(180deg)",
    },
])

export const cardPip = style({
    fontSize: 26,
    lineHeight: 1,
})

export const cardRank = style({
    fontSize: 15,
})

export const cardBack = style({
    width: 62,
    height: 88,
    borderRadius: 8,
    background: "#1c1c1f",
    boxShadow: `inset 0 0 0 1px ${hairlineStrong}, inset 0 0 0 6px #1c1c1f, inset 0 0 0 7px ${hairline}, 0 4px 14px rgba(0, 0, 0, 0.45)`,
    flex: "none",
})

export const cardBackSmall = style([cardBack, { width: 46, height: 66 }])

export const handCardButton = style({
    padding: 0,
    border: "none",
    background: "none",
    cursor: "pointer",
    transition: "transform 120ms ease",
    ":disabled": {
        cursor: "default",
        opacity: 0.85,
    },
    selectors: {
        "&:hover:not(:disabled)": {
            transform: "translateY(-8px)",
        },
    },
})

export const emptySlot = style({
    width: 62,
    height: 88,
    borderRadius: 8,
    border: `1px dashed ${hairlineStrong}`,
    flex: "none",
})

// ------------------------------------------------------------------
// Speech bubble + dialogs
// ------------------------------------------------------------------

export const speechBubble = style({
    position: "absolute",
    right: 24,
    padding: "8px 14px",
    borderRadius: 10,
    border: `1px solid ${hairlineStrong}`,
    background: "#1c1c1f",
    color: ink,
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 13,
    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.45)",
    zIndex: 3,
    "::after": {
        content: '""',
        position: "absolute",
        bottom: -9,
        left: 18,
        border: "5px solid transparent",
        borderTopColor: hairlineStrong,
    },
})

export const dialogScrim = style({
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(10, 10, 10, 0.7)",
    backdropFilter: "blur(2px)",
    zIndex: 5,
})

export const dialog = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    padding: "22px 28px",
    borderRadius: 12,
    border: `1px solid ${hairlineStrong}`,
    background: "rgba(10, 10, 10, 0.92)",
    maxWidth: 400,
    textAlign: "center",
})

export const dialogTitle = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 18,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: ink,
})

export const dialogText = style({
    margin: 0,
    fontSize: 13,
    lineHeight: 1.6,
    color: inkSoft,
})

export const dialogButtons = style({
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
})

export const dialogButton = style([button, {}])
export const dialogButtonPrimary = style([buttonPrimary, {}])

export const resultBanner = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 10,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    textAlign: "center",
    color: inkFaint,
    minHeight: 16,
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
