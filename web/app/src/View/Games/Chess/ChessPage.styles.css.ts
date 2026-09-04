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

// Monochrome board
const squareLightColor = "#d6d6da"
const squareDarkColor = "#76767e"

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
    width: 232,
    flex: "none",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    minHeight: 0,
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

/** Panel that stretches to fill its column and scrolls inside (move list). */
export const panelGrow = style([
    panel,
    {
        flex: 1,
        minHeight: 0,
    },
])

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

export const checkRow = style({
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 12,
    color: inkSoft,
    cursor: "pointer",
})

globalStyle(`${checkRow} input`, {
    accentColor: ink,
})

export const boardColumn = style({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minWidth: 0,
    minHeight: 0,
})

/** Sizing container: the board fills the largest square that fits inside it. */
export const boardArena = style({
    flex: 1,
    alignSelf: "stretch",
    minWidth: 0,
    minHeight: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    containerType: "size",
})

export const board = style({
    width: "100cqmin",
    height: "100cqmin",
    display: "grid",
    gridTemplateColumns: "repeat(8, 1fr)",
    gridTemplateRows: "repeat(8, 1fr)",
    border: "1px solid rgba(255, 255, 255, 0.16)",
    borderRadius: 10,
    overflow: "hidden",
    boxShadow: "0 24px 64px rgba(0, 0, 0, 0.5)",
})

const square = style({
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    border: "none",
    fontFamily: "inherit",
    fontSize: "9.5cqmin",
    lineHeight: 1,
    cursor: "pointer",
})

export const squareLight = style([square, { background: squareLightColor }])

export const squareDark = style([square, { background: squareDarkColor }])

export const squareSelected = style({
    boxShadow: "inset 0 0 0 0.5cqmin rgba(10, 10, 10, 0.85)",
    backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.28), rgba(255, 255, 255, 0.28))",
})

export const squareLastMove = style({
    backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.22))",
})

// Check is the one accent on the board: everything else stays monochrome.
export const squareCheck = style({
    backgroundImage:
        "radial-gradient(circle at 50% 50%, rgba(214, 69, 55, 0.8) 0%, rgba(214, 69, 55, 0.3) 55%, transparent 75%)",
})

const pop = keyframes({
    from: { transform: "scale(1.28)" },
    to: { transform: "scale(1)" },
})

const pieceGlyph = style({
    pointerEvents: "none",
})

export const pieceWhite = style([
    pieceGlyph,
    {
        color: "#fdfdfd",
        textShadow: "0 0.15cqmin 0.3cqmin rgba(0, 0, 0, 0.65), 0 0 0.5cqmin rgba(0, 0, 0, 0.4)",
    },
])

export const pieceBlack = style([
    pieceGlyph,
    {
        color: "#141416",
        textShadow: "0 0.15cqmin 0.3cqmin rgba(255, 255, 255, 0.28)",
    },
])

export const piecePop = style({
    animation: `${pop} 0.18s ease-out`,
})

/** Legal-destination marker on an empty square. */
export const moveDot = style({
    position: "absolute",
    left: "50%",
    top: "50%",
    width: "3.4cqmin",
    height: "3.4cqmin",
    transform: "translate(-50%, -50%)",
    borderRadius: "50%",
    background: "rgba(10, 10, 10, 0.4)",
    pointerEvents: "none",
})

/** Legal-destination marker on a capture square. */
export const captureRing = style({
    position: "absolute",
    inset: "6%",
    borderRadius: "50%",
    border: "0.7cqmin solid rgba(10, 10, 10, 0.4)",
    pointerEvents: "none",
})

export const coordFile = style({
    position: "absolute",
    right: "5%",
    bottom: "3%",
    fontSize: "2cqmin",
    fontWeight: 600,
    opacity: 0.5,
    pointerEvents: "none",
})

export const coordRank = style({
    position: "absolute",
    left: "5%",
    top: "4%",
    fontSize: "2cqmin",
    fontWeight: 600,
    opacity: 0.5,
    pointerEvents: "none",
})

export const controlsHint = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 10,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: inkFaint,
})

export const moveScroll = style({
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
})

export const moveRow = style({
    display: "grid",
    gridTemplateColumns: "30px 1fr 1fr",
    gap: 6,
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 12,
    color: inkSoft,
    padding: "2px 0",
})

export const moveNumber = style({
    color: inkFaint,
})

export const trayLabel = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: "0.16em",
    color: inkFaint,
})

export const tray = style({
    display: "flex",
    flexWrap: "wrap",
    gap: 2,
    minHeight: 22,
    fontSize: 17,
    lineHeight: 1.25,
    color: ink,
})

export const materialDiff = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 11,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: inkSoft,
    paddingTop: 2,
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
