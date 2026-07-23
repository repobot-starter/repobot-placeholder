import { globalStyle, keyframes, style } from "@vanilla-extract/css"
import { packBrand } from "@base/design-system/theme"

const shell = "#d8d2c4"
const shellDark = "#c2bcae"
const shellDeep = "#a8a294"
const ink = "#26221a"
const green = "#7cf29c"
const brand = packBrand?.accent ?? "#4a3f8f"
const woodLight = "#f0d9b5"
const woodDark = "#b58863"

/** Full-viewport wrapper (owns the retro desk background). */
export const page = style({
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    fontFamily: '"IBM Plex Mono", monospace',
    background: shellDeep,
    backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px)",
    backgroundSize: "100% 3px",
    color: ink,
    userSelect: "none",
    boxSizing: "border-box",
})

globalStyle(`${page} *`, {
    boxSizing: "border-box",
})

export const console = style({
    display: "flex",
    flexDirection: "column",
    width: "min(1220px, 100%)",
    height: "min(850px, 100%)",
    background: shell,
    border: `2px solid ${ink}`,
    borderRadius: 12,
    boxShadow: "inset 0 2px 0 rgba(255, 255, 255, 0.6), 6px 8px 0 rgba(38, 34, 26, 0.4)",
    overflow: "hidden",
})

export const titleBar = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "7px 12px",
    borderBottom: `2px solid ${ink}`,
    background: shellDark,
    fontWeight: 700,
    fontSize: 15,
})

export const titleControls = style({
    display: "flex",
    gap: 5,
})

export const titleBtn = style({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 18,
    height: 18,
    border: `2px solid ${ink}`,
    background: shell,
    fontSize: 10,
    fontWeight: 700,
})

export const toolbar = style({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 12px",
    borderBottom: `2px solid ${ink}`,
})

export const toolbarSpacer = style({
    flex: 1,
})

export const chunky = style({
    font: "inherit",
    fontWeight: 700,
    fontSize: 13,
    padding: "6px 16px",
    color: ink,
    background: shell,
    border: `2px solid ${ink}`,
    borderRadius: 6,
    boxShadow: `2px 2px 0 ${ink}`,
    cursor: "pointer",
    ":active": {
        boxShadow: "none",
        transform: "translate(2px, 2px)",
    },
    ":disabled": {
        opacity: 0.45,
        cursor: "default",
        boxShadow: `2px 2px 0 ${ink}`,
        transform: "none",
    },
})

export const chunkyLit = style([
    chunky,
    {
        boxShadow: "none",
        transform: "translate(2px, 2px)",
        background: "#e9f7d8",
    },
])

export const botBadge = style({
    padding: "6px 14px",
    border: `2px solid ${ink}`,
    borderRadius: 6,
    background: "#101408",
    color: "#5a6a4a",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.06em",
})

export const botBadgeOn = style([
    botBadge,
    {
        color: green,
        textShadow: "0 0 6px rgba(124, 242, 156, 0.8)",
    },
])

export const layout = style({
    flex: 1,
    display: "flex",
    gap: 12,
    padding: 12,
    minHeight: 0,
})

export const panelColumn = style({
    width: 200,
    flex: "none",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    minHeight: 0,
})

export const panel = style({
    border: `2px solid ${ink}`,
    borderRadius: 6,
    background: shell,
    padding: "0 0 8px",
})

/** Panel that stretches to fill its column and scrolls inside (move list). */
export const panelGrow = style([
    panel,
    {
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
    },
])

export const panelHeader = style({
    background: brand,
    color: "#f2eefc",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    padding: "4px 8px",
    marginBottom: 6,
})

export const radioRow = style({
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "3px 10px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
})

globalStyle(`${radioRow} input`, {
    accentColor: brand,
})

export const capitalize = style({
    textTransform: "capitalize",
})

export const panelBrand = style([
    panel,
    {
        padding: 10,
        textAlign: "center",
    },
])

export const brandName = style({
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: "0.04em",
    color: brand,
})

export const brandTag = style({
    fontSize: 10,
    marginTop: 4,
    color: ink,
    opacity: 0.75,
})

export const boardColumn = style({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
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
    border: `2px solid ${ink}`,
    borderRadius: 8,
    overflow: "hidden",
    boxShadow: "inset 0 0 24px rgba(0, 0, 0, 0.25), 4px 4px 0 rgba(38, 34, 26, 0.35)",
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

export const squareLight = style([square, { background: woodLight }])

export const squareDark = style([square, { background: woodDark }])

export const squareSelected = style({
    boxShadow: "inset 0 0 0 0.5cqmin #a08a1f",
    backgroundImage: "linear-gradient(rgba(255, 235, 59, 0.45), rgba(255, 235, 59, 0.45))",
})

export const squareLastMove = style({
    backgroundImage: "linear-gradient(rgba(255, 213, 79, 0.42), rgba(255, 213, 79, 0.42))",
})

export const squareCheck = style({
    backgroundImage:
        "radial-gradient(circle at 50% 50%, rgba(255, 60, 50, 0.85) 0%, rgba(255, 60, 50, 0.35) 55%, transparent 75%)",
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
        color: "#faf4e4",
        textShadow: "0 0.15cqmin 0.3cqmin rgba(0, 0, 0, 0.65), 0 0 0.5cqmin rgba(0, 0, 0, 0.4)",
    },
])

export const pieceBlack = style([
    pieceGlyph,
    {
        color: "#211812",
        textShadow: "0 0.15cqmin 0.3cqmin rgba(255, 255, 255, 0.3)",
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
    width: "3.6cqmin",
    height: "3.6cqmin",
    transform: "translate(-50%, -50%)",
    borderRadius: "50%",
    background: "rgba(30, 24, 16, 0.35)",
    pointerEvents: "none",
})

/** Legal-destination marker on a capture square. */
export const captureRing = style({
    position: "absolute",
    inset: "6%",
    borderRadius: "50%",
    border: "0.8cqmin solid rgba(30, 24, 16, 0.35)",
    pointerEvents: "none",
})

export const coordFile = style({
    position: "absolute",
    right: "5%",
    bottom: "3%",
    fontSize: "2cqmin",
    fontWeight: 700,
    opacity: 0.55,
    pointerEvents: "none",
})

export const coordRank = style({
    position: "absolute",
    left: "5%",
    top: "4%",
    fontSize: "2cqmin",
    fontWeight: 700,
    opacity: 0.55,
    pointerEvents: "none",
})

export const controlsHint = style({
    fontSize: 11,
    fontWeight: 600,
    opacity: 0.7,
})

export const moveScroll = style({
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    padding: "0 10px 6px",
})

export const moveRow = style({
    display: "grid",
    gridTemplateColumns: "26px 1fr 1fr",
    gap: 4,
    fontSize: 12,
    fontWeight: 600,
    padding: "1px 0",
})

export const moveNumber = style({
    opacity: 0.55,
})

export const trayLabel = style({
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    opacity: 0.65,
    padding: "2px 10px 0",
})

export const tray = style({
    display: "flex",
    flexWrap: "wrap",
    gap: 1,
    minHeight: 22,
    padding: "0 10px",
    fontSize: 17,
    lineHeight: 1.25,
})

export const materialDiff = style({
    fontSize: 12,
    fontWeight: 700,
    padding: "4px 10px 0",
})

export const muted = style({
    fontSize: 12,
    padding: "2px 10px",
    opacity: 0.7,
})

export const statusBar = style({
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 14px",
    borderTop: `2px solid ${ink}`,
    background: "#101408",
    color: green,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.05em",
})
