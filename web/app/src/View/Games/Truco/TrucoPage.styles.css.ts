import { globalStyle, keyframes, style } from "@vanilla-extract/css"
import { packBrand } from "@base/design-system/theme"

// Self-contained boteco palette (no design-system imports): green felt table,
// warm wood, string-light glow, chalkboard side panels.
const wood = "#5a3520"
const woodDark = "#3e2312"
const woodDeep = "#241205"
const felt = "#1e6b3c"
const feltDark = "#14512c"
const feltEdge = "#0c3b1f"
const cream = "#f6ecd4"
const ink = "#1c1006"
const amber = packBrand?.accentDark ?? "#ffbf47"
const amberSoft = "#ffdf9e"
const red = "#c8402f"
const cardFace = "#fdf8ec"
const cardBackBlue = "#27548f"
const manilhaGold = "#ffd76a"

/** Full-viewport wrapper (owns the warm boteco-night background). */
export const page = style({
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    fontFamily: '"IBM Plex Mono", monospace',
    background: woodDeep,
    backgroundImage:
        "radial-gradient(ellipse at 20% 0%, rgba(255, 191, 71, 0.14), transparent 55%)," +
        "radial-gradient(ellipse at 80% 0%, rgba(255, 191, 71, 0.12), transparent 55%)",
    color: cream,
    userSelect: "none",
    boxSizing: "border-box",
})

globalStyle(`${page} *`, {
    boxSizing: "border-box",
})

export const cabinet = style({
    display: "flex",
    flexDirection: "column",
    width: "min(1240px, 100%)",
    height: "min(860px, 100%)",
    background: `linear-gradient(${wood}, ${woodDark})`,
    border: `2px solid ${ink}`,
    borderRadius: 12,
    boxShadow: "inset 0 2px 0 rgba(255, 255, 255, 0.12), 6px 8px 0 rgba(0, 0, 0, 0.45)",
    overflow: "hidden",
})

export const titleBar = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "7px 12px",
    borderBottom: `2px solid ${ink}`,
    background: woodDark,
    color: amberSoft,
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
    background: wood,
    color: cream,
    fontSize: 10,
    fontWeight: 700,
})

export const layout = style({
    flex: 1,
    display: "flex",
    gap: 12,
    padding: 12,
    minHeight: 0,
})

export const panelColumn = style({
    width: 236,
    flex: "none",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    overflowY: "auto",
})

export const panel = style({
    border: `2px solid ${ink}`,
    borderRadius: 8,
    background: "rgba(20, 10, 3, 0.55)",
    padding: "0 0 8px",
})

export const panelHeader = style({
    display: "block",
    padding: "6px 10px",
    marginBottom: 8,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: amberSoft,
    borderBottom: `1px solid rgba(255, 191, 71, 0.35)`,
})

export const scoreRow = style({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    padding: "3px 12px",
    fontSize: 13,
})

export const scoreValue = style({
    fontSize: 26,
    fontWeight: 700,
    color: amber,
    textShadow: "0 0 10px rgba(255, 191, 71, 0.45)",
})

export const stakeBadge = style({
    display: "inline-block",
    margin: "6px 12px 2px",
    padding: "4px 12px",
    border: `2px solid ${amber}`,
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 700,
    color: amber,
})

export const muted = style({
    padding: "0 12px",
    margin: 0,
    fontSize: 11.5,
    lineHeight: 1.5,
    opacity: 0.75,
})

export const sliderRow = style({
    padding: "2px 12px 6px",
    fontSize: 11.5,
})

globalStyle(`${sliderRow} input`, {
    width: "100%",
    accentColor: amber,
})

export const sliderScale = style({
    display: "flex",
    justifyContent: "space-between",
    fontSize: 10,
    opacity: 0.7,
})

export const chunky = style({
    font: "inherit",
    fontWeight: 700,
    fontSize: 13,
    margin: "4px 12px 0",
    padding: "7px 16px",
    color: ink,
    background: cream,
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

export const trucoButton = style([
    chunky,
    {
        background: red,
        color: cream,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
    },
])

export const stats = style({
    margin: 0,
    padding: "0 12px",
    fontSize: 12,
})

globalStyle(`${stats} div`, {
    display: "flex",
    justifyContent: "space-between",
    padding: "2.5px 0",
})

globalStyle(`${stats} dt`, {
    opacity: 0.8,
})

globalStyle(`${stats} dd`, {
    margin: 0,
    fontWeight: 700,
    color: amberSoft,
})

// ------------------------------------------------------------------
// The table
// ------------------------------------------------------------------

export const tableArea = style({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    minWidth: 0,
})

export const table = style({
    position: "relative",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "14px 18px",
    borderRadius: 16,
    border: `6px solid ${woodDark}`,
    background: `radial-gradient(ellipse at 50% 40%, ${felt}, ${feltDark} 70%, ${feltEdge})`,
    boxShadow: "inset 0 0 60px rgba(0, 0, 0, 0.5), 0 4px 0 rgba(0, 0, 0, 0.4)",
    overflow: "hidden",
    minHeight: 0,
})

/** Warm string-lights strip along the top of the felt. */
export const lights = style({
    position: "absolute",
    top: 6,
    left: 0,
    right: 0,
    height: 10,
    backgroundImage:
        `radial-gradient(circle 4px at 10% 50%, ${amber} 0 3px, transparent 4px),` +
        `radial-gradient(circle 4px at 30% 50%, ${red} 0 3px, transparent 4px),` +
        `radial-gradient(circle 4px at 50% 50%, ${amber} 0 3px, transparent 4px),` +
        `radial-gradient(circle 4px at 70% 50%, ${red} 0 3px, transparent 4px),` +
        `radial-gradient(circle 4px at 90% 50%, ${amber} 0 3px, transparent 4px)`,
    filter: "drop-shadow(0 0 6px rgba(255, 191, 71, 0.8))",
    pointerEvents: "none",
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
    left: 18,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: amberSoft,
    opacity: 0.85,
})

export const botSeat = style([seatRow, { position: "relative" }])
export const playerSeat = style([seatRow, { position: "relative" }])

export const trickArea = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 26,
    minHeight: 130,
})

export const trickSlot = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    fontSize: 10,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    opacity: 0.9,
})

export const viraColumn = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    fontSize: 10,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: amberSoft,
})

export const trickDots = style({
    display: "flex",
    gap: 6,
    justifyContent: "center",
})

export const trickDot = style({
    width: 12,
    height: 12,
    borderRadius: "50%",
    border: `2px solid ${cream}`,
    opacity: 0.5,
})

export const trickDotPlayer = style([trickDot, { background: amber, opacity: 1, borderColor: amber }])
export const trickDotBot = style([trickDot, { background: red, opacity: 1, borderColor: red }])
export const trickDotTie = style([trickDot, { background: cream, opacity: 0.9 }])

// ------------------------------------------------------------------
// Cards
// ------------------------------------------------------------------

const manilhaPulse = keyframes({
    "0%": { boxShadow: `0 0 6px 2px rgba(255, 215, 106, 0.55)` },
    "50%": { boxShadow: `0 0 14px 5px rgba(255, 215, 106, 0.9)` },
    "100%": { boxShadow: `0 0 6px 2px rgba(255, 215, 106, 0.55)` },
})

export const card = style({
    position: "relative",
    width: 62,
    height: 88,
    borderRadius: 7,
    border: `2px solid ${ink}`,
    background: cardFace,
    color: ink,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    boxShadow: "1px 2px 0 rgba(0, 0, 0, 0.35)",
    flex: "none",
})

export const cardRed = style([card, { color: red }])

export const cardManilha = style({
    borderColor: manilhaGold,
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
    borderRadius: 7,
    border: `2px solid ${ink}`,
    background: `repeating-linear-gradient(45deg, ${cardBackBlue} 0 6px, #1c3f6e 6px 12px)`,
    boxShadow: "1px 2px 0 rgba(0, 0, 0, 0.35)",
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
    borderRadius: 7,
    border: `2px dashed rgba(246, 236, 212, 0.4)`,
    flex: "none",
})

// ------------------------------------------------------------------
// Speech bubble + dialogs
// ------------------------------------------------------------------

export const speechBubble = style({
    position: "absolute",
    right: 18,
    padding: "7px 14px",
    borderRadius: 12,
    border: `2px solid ${ink}`,
    background: cream,
    color: ink,
    fontWeight: 700,
    fontSize: 14,
    boxShadow: `2px 2px 0 ${ink}`,
    zIndex: 3,
    "::after": {
        content: '""',
        position: "absolute",
        bottom: -8,
        left: 18,
        border: "5px solid transparent",
        borderTopColor: ink,
    },
})

export const dialogScrim = style({
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(12, 6, 2, 0.55)",
    zIndex: 5,
})

export const dialog = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    padding: "18px 24px",
    borderRadius: 12,
    border: `2px solid ${ink}`,
    background: `linear-gradient(${wood}, ${woodDark})`,
    boxShadow: `4px 4px 0 rgba(0, 0, 0, 0.5)`,
    maxWidth: 380,
    textAlign: "center",
})

export const dialogTitle = style({
    fontSize: 22,
    fontWeight: 700,
    color: amber,
    textShadow: "0 0 12px rgba(255, 191, 71, 0.5)",
})

export const dialogText = style({
    margin: 0,
    fontSize: 12.5,
    lineHeight: 1.5,
    opacity: 0.9,
})

export const dialogButtons = style({
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
})

export const dialogButton = style([chunky, { margin: 0 }])
export const dialogButtonDanger = style([trucoButton, { margin: 0 }])

export const resultBanner = style({
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: "0.06em",
    textAlign: "center",
    color: amberSoft,
    minHeight: 20,
})

export const statusBar = style({
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 14px",
    borderTop: `2px solid ${ink}`,
    background: woodDark,
    fontSize: 11.5,
    color: amberSoft,
})
