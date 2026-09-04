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

export const console = style({
    display: "flex",
    flexDirection: "column",
    width: "min(1200px, 100%)",
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

export const buttonMuted = style([
    button,
    {
        color: inkFaint,
        borderColor: hairline,
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
    gap: 12,
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

export const moneyRow = style({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    fontSize: 12,
    color: inkSoft,
})

export const moneyValue = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 16,
    color: ink,
    fontVariantNumeric: "tabular-nums",
})

export const chipRow = style({
    display: "flex",
    justifyContent: "center",
    gap: 10,
    padding: "4px 0",
})

const chipBase = style({
    font: "inherit",
    fontFamily: mono,
    fontWeight: 600,
    width: 54,
    height: 54,
    borderRadius: "50%",
    fontSize: 12,
    cursor: "pointer",
    transition: "transform 100ms ease, background 120ms ease",
    ":active": {
        transform: "translateY(2px)",
    },
    ":disabled": {
        opacity: 0.35,
        cursor: "default",
        transform: "none",
    },
})

export const chipRed = style([
    chipBase,
    {
        color: ink,
        background: "transparent",
        border: `1px dashed ${hairlineStrong}`,
        selectors: {
            "&:hover:not(:disabled)": { background: "rgba(255, 255, 255, 0.06)" },
        },
    },
])

export const chipGreen = style([
    chipBase,
    {
        color: ink,
        background: "rgba(255, 255, 255, 0.1)",
        border: `1px dashed ${hairlineStrong}`,
        selectors: {
            "&:hover:not(:disabled)": { background: "rgba(255, 255, 255, 0.16)" },
        },
    },
])

export const chipBlack = style([
    chipBase,
    {
        color: "#0a0a0a",
        background: ink,
        border: `1px dashed ${ink}`,
        selectors: {
            "&:hover:not(:disabled)": { background: "#d4d4d8" },
        },
    },
])

export const betButtonRow = style({
    display: "flex",
    flexDirection: "column",
    gap: 8,
})

export const dealButton = style([buttonPrimary, { width: "100%" }])

export const clearButton = style([button, { width: "100%" }])

export const creditButton = style([button, { width: "100%", letterSpacing: "0.08em" }])

export const ruleList = style({
    margin: 0,
    padding: 0,
    listStyle: "none",
    fontSize: 12,
    lineHeight: 1.7,
    color: inkSoft,
})

export const stats = style({
    display: "flex",
    flexDirection: "column",
    gap: 8,
    margin: 0,
})

globalStyle(`${stats} > div`, {
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

export const muted = style({
    fontSize: 12,
    color: inkFaint,
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

// ---------------------------------------------------------------------------
// Table
// ---------------------------------------------------------------------------

export const tableArea = style({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
})

export const table = style({
    position: "relative",
    flex: 1,
    width: "100%",
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "22px 24px",
    background: surface,
    border: `1px solid ${hairline}`,
    borderRadius: 12,
    overflow: "hidden",
})

export const handArea = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
})

export const handLabel = style({
    display: "flex",
    alignItems: "baseline",
    gap: 10,
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 10,
    letterSpacing: "0.2em",
    color: inkFaint,
    textTransform: "uppercase",
})

export const handTotalBadge = style({
    padding: "2px 10px",
    borderRadius: 10,
    background: "rgba(255, 255, 255, 0.08)",
    color: ink,
    fontSize: 11,
    letterSpacing: "0.06em",
})

export const cardRow = style({
    display: "flex",
    justifyContent: "center",
    gap: 10,
    minHeight: 106,
})

export const tableCenter = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
})

export const tableMotto = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 10,
    letterSpacing: "0.22em",
    color: inkFaint,
    textTransform: "uppercase",
})

export const betSpot = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 74,
    height: 74,
    borderRadius: "50%",
    border: `1px dashed ${hairlineStrong}`,
    color: inkSoft,
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: "0.08em",
})

export const shuffleNote = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 10,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: inkFaint,
})

export const actionRow = style({
    display: "flex",
    justifyContent: "center",
    gap: 10,
    minHeight: 40,
})

export const actionButton = style([button, { padding: "9px 26px" }])

export const controlsHint = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 10,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: inkFaint,
})

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

export const cardOuter = style({
    width: 74,
    height: 106,
    flex: "none",
    perspective: 600,
    opacity: 0,
    transform: "translate(-20px, -32px) rotate(-6deg)",
    transition: "transform 0.35s ease-out, opacity 0.35s ease-out",
})

export const cardOuterDealt = style([
    cardOuter,
    {
        opacity: 1,
        transform: "none",
    },
])

const cardInnerBase = style({
    position: "relative",
    width: "100%",
    height: "100%",
    transformStyle: "preserve-3d",
    transition: "transform 0.45s ease",
})

export const cardInnerFaceDown = style([cardInnerBase, { transform: "rotateY(180deg)" }])

export const cardInnerFaceUp = style([cardInnerBase, { transform: "rotateY(0deg)" }])

const cardFace = style({
    position: "absolute",
    inset: 0,
    borderRadius: 8,
    backfaceVisibility: "hidden",
    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.45)",
})

const cardFront = style([
    cardFace,
    {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fcfcfc",
    },
])

// Monochrome deck: hearts and diamonds carry the lighter ink.
export const cardFrontRed = style([cardFront, { color: "#8f8f96" }])

export const cardFrontBlack = style([cardFront, { color: "#151517" }])

export const cardBack = style([
    cardFace,
    {
        transform: "rotateY(180deg)",
        background: "#1c1c1f",
        boxShadow: `inset 0 0 0 1px ${hairlineStrong}, inset 0 0 0 6px #1c1c1f, inset 0 0 0 7px ${hairline}, 0 4px 14px rgba(0, 0, 0, 0.45)`,
    },
])

export const cardCorner = style({
    position: "absolute",
    top: 5,
    left: 7,
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.1,
    textAlign: "center",
    whiteSpace: "pre-line",
    fontFamily: mono,
})

export const cardCornerFlipped = style([
    cardCorner,
    {
        top: "auto",
        left: "auto",
        bottom: 5,
        right: 7,
        transform: "rotate(180deg)",
    },
])

export const cardPip = style({
    fontSize: 34,
    lineHeight: 1,
})

// ---------------------------------------------------------------------------
// Result banner
// ---------------------------------------------------------------------------

const bannerPop = keyframes({
    from: { transform: "translate(-50%, -50%) scale(0.6)", opacity: 0 },
    to: { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
})

const bannerBase = style({
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    padding: "18px 44px",
    borderRadius: 12,
    background: "rgba(10, 10, 10, 0.92)",
    border: `1px solid ${hairlineStrong}`,
    textAlign: "center",
    pointerEvents: "none",
    animation: `${bannerPop} 0.25s ease-out`,
})

export const bannerWin = style([bannerBase, { color: ink, borderColor: "rgba(255, 255, 255, 0.4)" }])

export const bannerLose = style([bannerBase, { color: inkSoft }])

export const bannerPush = style([bannerBase, { color: inkSoft }])

export const bannerTitle = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 22,
    letterSpacing: "0.28em",
    textTransform: "uppercase",
})

export const bannerNet = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: "0.1em",
    color: inkSoft,
})
