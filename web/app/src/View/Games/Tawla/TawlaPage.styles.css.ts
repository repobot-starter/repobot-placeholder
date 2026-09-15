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

/** Panel that stretches to fill its column and scrolls inside (move log). */
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

/** Two-column key/value rows (pip counts, match score, lifetime tally). */
export const statRow = style({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    fontSize: 12,
    color: inkSoft,
})

export const statValue = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 15,
    color: ink,
    fontVariantNumeric: "tabular-nums",
})

export const muted = style({
    fontSize: 12,
    lineHeight: 1.6,
    color: inkFaint,
})

export const logScroll = style({
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
})

export const logRow = style({
    display: "flex",
    gap: 8,
    fontFamily: mono,
    fontSize: 11,
    lineHeight: 1.5,
    color: inkSoft,
    padding: "2px 0",
})

export const logWho = style({
    width: 46,
    flex: "none",
    color: inkFaint,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
})

// ---------------------------------------------------------------------------
// The board
// ---------------------------------------------------------------------------

export const boardColumn = style({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    minWidth: 0,
    minHeight: 0,
})

/** Sizing container: the board fills the largest 1.42:1 box that fits inside. */
export const boardArena = style({
    flex: 1,
    alignSelf: "stretch",
    minWidth: 0,
    minHeight: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
})

export const board = style({
    width: "100%",
    maxWidth: "min(100%, calc((100vh - 280px) * 1.42))",
    aspectRatio: "1.42",
    display: "flex",
    gap: "0.6%",
    padding: "1.2%",
    background: surface,
    border: `1px solid ${hairline}`,
    borderRadius: 12,
})

/** One half of the board: a 6-wide, 2-tall grid of points. */
export const half = style({
    flex: 1,
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    gridTemplateRows: "1fr 12% 1fr",
    background: "rgba(255, 255, 255, 0.02)",
    borderRadius: 8,
    padding: "1.5% 2%",
    minWidth: 0,
})

/** The raised center bar between the two halves. */
export const bar = style({
    flex: "none",
    width: "7%",
    display: "flex",
    flexDirection: "column",
    background: "#17171a",
    borderRadius: 8,
    border: `1px solid ${hairline}`,
    overflow: "hidden",
})

/** Half of the bar owned by one player's hit checkers. */
export const barWell = style({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "4%",
    padding: "8% 6%",
    border: "none",
    background: "transparent",
    cursor: "default",
    minHeight: 0,
})

export const barWellActive = style([
    barWell,
    {
        cursor: "pointer",
        boxShadow: `inset 0 0 0 2px ${hairlineStrong}`,
        borderRadius: 6,
    },
])

/** Bear-off trays column on the right edge of the board. */
export const offColumn = style({
    flex: "none",
    width: "8.5%",
    display: "flex",
    flexDirection: "column",
    gap: "4%",
})

export const offTray = style({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    background: "rgba(255, 255, 255, 0.03)",
    border: `1px solid ${hairline}`,
    borderRadius: 8,
    color: inkSoft,
    cursor: "default",
    padding: 2,
})

export const offTrayActive = style([
    offTray,
    {
        cursor: "pointer",
        boxShadow: `inset 0 0 0 2px ${hairlineStrong}`,
    },
])

export const offCount = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 16,
    color: ink,
})

export const offLabel = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 8,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: inkFaint,
})

/** A point (triangle + checker stack). Top-row points hang down, bottom-row point up. */
export const point = style({
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: 0,
    border: "none",
    background: "transparent",
    cursor: "default",
    minWidth: 0,
    minHeight: 0,
})

export const pointClickable = style({
    cursor: "pointer",
})

/** The inlaid triangle itself, drawn with clip-path behind the checkers. */
export const triangle = style({
    position: "absolute",
    inset: "0 8%",
    pointerEvents: "none",
})

export const triangleDownLight = style([
    triangle,
    {
        background: "rgba(255, 255, 255, 0.14)",
        clipPath: "polygon(0 0, 100% 0, 50% 92%)",
    },
])

export const triangleDownDark = style([
    triangle,
    {
        background: "rgba(255, 255, 255, 0.05)",
        clipPath: "polygon(0 0, 100% 0, 50% 92%)",
    },
])

export const triangleUpLight = style([
    triangle,
    {
        background: "rgba(255, 255, 255, 0.14)",
        clipPath: "polygon(0 100%, 100% 100%, 50% 8%)",
    },
])

export const triangleUpDark = style([
    triangle,
    {
        background: "rgba(255, 255, 255, 0.05)",
        clipPath: "polygon(0 100%, 100% 100%, 50% 8%)",
    },
])

const pulse = keyframes({
    "0%": { boxShadow: "inset 0 0 0 2px rgba(255, 255, 255, 0.4)" },
    "50%": { boxShadow: "inset 0 0 0 3px rgba(255, 255, 255, 0.65)" },
    "100%": { boxShadow: "inset 0 0 0 2px rgba(255, 255, 255, 0.4)" },
})

/** Halo behind a legal destination point. */
export const pointHighlight = style({
    position: "absolute",
    inset: "0 6%",
    borderRadius: 6,
    animation: `${pulse} 1.1s ease-in-out infinite`,
    pointerEvents: "none",
})

/** Ring around the currently selected source point. */
export const pointSelected = style({
    position: "absolute",
    inset: "0 6%",
    borderRadius: 6,
    boxShadow: `inset 0 0 0 2px ${ink}`,
    pointerEvents: "none",
})

/** Container the checkers stack inside (direction set inline per row). */
export const stack = style({
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "76%",
    height: "100%",
    padding: "3% 0",
})

const checker = style({
    width: "100%",
    aspectRatio: "1",
    maxHeight: "19%",
    borderRadius: "50%",
    flex: "none",
    marginTop: "-2%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: mono,
    fontSize: 11,
    fontWeight: 600,
})

export const checkerLight = style([
    checker,
    {
        background: "#fafafa",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.5)",
        color: "#0a0a0a",
    },
])

export const checkerDark = style([
    checker,
    {
        background: "#26262b",
        border: `1px solid ${hairlineStrong}`,
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.5)",
        color: "#fafafa",
    },
])

/** Mini checkers used in the bar wells and the bear-off trays. */
export const barChecker = style({
    width: "70%",
    aspectRatio: "1",
    maxHeight: "22%",
    borderRadius: "50%",
    flex: "none",
})

export const pointNumberLabel = style({
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontFamily: mono,
    fontSize: "min(1.4vh, 9px)",
    fontWeight: 600,
    color: inkFaint,
    pointerEvents: "none",
})

// ---------------------------------------------------------------------------
// Dice
// ---------------------------------------------------------------------------

const diceShake = keyframes({
    "0%": { transform: "rotate(0deg) translateY(0)" },
    "25%": { transform: "rotate(-14deg) translateY(-3px)" },
    "50%": { transform: "rotate(10deg) translateY(2px)" },
    "75%": { transform: "rotate(-6deg) translateY(-2px)" },
    "100%": { transform: "rotate(0deg) translateY(0)" },
})

export const diceTray = style({
    display: "flex",
    alignItems: "center",
    gap: 10,
    minHeight: 46,
})

export const die = style({
    position: "relative",
    width: 40,
    height: 40,
    borderRadius: 8,
    background: "#fafafa",
    boxShadow: "0 3px 8px rgba(0, 0, 0, 0.45)",
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gridTemplateRows: "repeat(3, 1fr)",
    padding: 6,
})

export const dieUsed = style([
    die,
    {
        opacity: 0.28,
        transform: "scale(0.9)",
    },
])

export const dieRolling = style([
    die,
    {
        animation: `${diceShake} 0.16s linear infinite`,
    },
])

export const pip = style({
    width: "70%",
    height: "70%",
    placeSelf: "center",
    borderRadius: "50%",
    background: "#111112",
})

export const pipHidden = style([
    pip,
    {
        visibility: "hidden",
    },
])

export const rollButton = style([buttonPrimary, { padding: "10px 26px" }])

export const controlsHint = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 10,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: inkFaint,
})

// ---------------------------------------------------------------------------
// Overlay + status
// ---------------------------------------------------------------------------

export const overlay = style({
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    background: "rgba(10, 10, 10, 0.88)",
    backdropFilter: "blur(2px)",
    borderRadius: 12,
    zIndex: 2,
    textAlign: "center",
    padding: 16,
})

export const overlayTitle = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 22,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: ink,
})

export const overlaySub = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 12,
    letterSpacing: "0.1em",
    color: inkSoft,
})

export const boardWrap = style({
    position: "relative",
    width: "100%",
    display: "flex",
    justifyContent: "center",
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
