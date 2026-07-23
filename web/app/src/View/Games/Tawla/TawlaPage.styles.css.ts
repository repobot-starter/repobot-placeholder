import { globalStyle, keyframes, style } from "@vanilla-extract/css"
import { packBrand } from "@base/design-system/theme"

// Café-table palette: warm woods, brass, and coffee. Self-contained on
// purpose — game packs never import the design system.
const table = "#2e1d12"
const frame = "#5a3a22"
const frameEdge = "#3a2414"
const felt = "#7a4a28"
const pointLight = "#e9d3a8"
const pointDark = "#a34f2a"
const ink = "#241407"
const cream = "#f4e8d0"
const brass = packBrand?.accentDark ?? "#d9a441"
const glow = "#ffd98a"
const checkerWhite = "#f3ead6"
const checkerBlack = "#33231a"

/** Full-viewport wrapper (owns the café-table background). */
export const page = style({
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    fontFamily: '"Georgia", "Times New Roman", serif',
    background: table,
    backgroundImage:
        "radial-gradient(ellipse at 50% 0%, rgba(255, 214, 140, 0.10), transparent 60%)," +
        "repeating-linear-gradient(90deg, rgba(0, 0, 0, 0.14) 0 2px, transparent 2px 90px)",
    color: cream,
    userSelect: "none",
    boxSizing: "border-box",
})

globalStyle(`${page} *`, {
    boxSizing: "border-box",
})

/** The whole café cabinet: title rail, toolbar, board layout, status rail. */
export const console = style({
    display: "flex",
    flexDirection: "column",
    width: "min(1240px, 100%)",
    height: "min(860px, 100%)",
    background: frame,
    border: `3px solid ${frameEdge}`,
    borderRadius: 14,
    boxShadow: "inset 0 2px 0 rgba(255, 226, 170, 0.25), 0 18px 40px rgba(0, 0, 0, 0.55)",
    overflow: "hidden",
})

export const titleBar = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 14px",
    borderBottom: `2px solid ${frameEdge}`,
    background: `linear-gradient(180deg, #6b4527, ${frame})`,
    fontWeight: 700,
    fontSize: 16,
    letterSpacing: "0.04em",
    color: glow,
})

export const titleTag = style({
    fontSize: 11,
    fontStyle: "italic",
    fontWeight: 400,
    color: cream,
    opacity: 0.75,
})

export const toolbar = style({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 14px",
    borderBottom: `2px solid ${frameEdge}`,
})

export const toolbarSpacer = style({
    flex: 1,
})

/** Chunky brass-rimmed café button. */
export const chunky = style({
    font: "inherit",
    fontWeight: 700,
    fontSize: 13,
    padding: "6px 16px",
    color: cream,
    background: "#4a2e1a",
    border: `2px solid ${brass}`,
    borderRadius: 8,
    boxShadow: "0 3px 0 rgba(0, 0, 0, 0.45)",
    cursor: "pointer",
    ":active": {
        boxShadow: "none",
        transform: "translateY(3px)",
    },
    ":disabled": {
        opacity: 0.4,
        cursor: "default",
        boxShadow: "0 3px 0 rgba(0, 0, 0, 0.45)",
        transform: "none",
    },
})

export const botBadge = style({
    padding: "6px 14px",
    border: `2px solid ${frameEdge}`,
    borderRadius: 8,
    background: "#1c1008",
    color: "#7a5a38",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.06em",
})

export const botBadgeOn = style([
    botBadge,
    {
        color: glow,
        textShadow: "0 0 8px rgba(255, 217, 138, 0.8)",
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
    width: 208,
    flex: "none",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    minHeight: 0,
})

export const panel = style({
    border: `2px solid ${frameEdge}`,
    borderRadius: 8,
    background: "#4c3018",
    padding: "0 0 8px",
})

/** Panel that stretches to fill its column and scrolls inside (move log). */
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
    background: `linear-gradient(180deg, ${brass}, #b07f2a)`,
    color: ink,
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    padding: "4px 10px",
    marginBottom: 6,
})

export const radioRow = style({
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "3px 12px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
})

globalStyle(`${radioRow} input`, {
    accentColor: brass,
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
    letterSpacing: "0.06em",
    color: brass,
})

export const brandTag = style({
    fontSize: 11,
    fontStyle: "italic",
    marginTop: 4,
    color: cream,
    opacity: 0.7,
})

/** Two-column key/value rows (pip counts, match score, café tally). */
export const statRow = style({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    padding: "2px 12px",
    fontSize: 13,
    fontWeight: 600,
})

export const statValue = style({
    fontSize: 15,
    fontWeight: 700,
    color: glow,
})

export const muted = style({
    fontSize: 12,
    padding: "2px 12px",
    opacity: 0.7,
})

export const logScroll = style({
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    padding: "0 12px 6px",
})

export const logRow = style({
    display: "flex",
    gap: 8,
    fontSize: 12,
    fontWeight: 600,
    padding: "1px 0",
})

export const logWho = style({
    width: 46,
    flex: "none",
    color: brass,
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
    gap: 8,
    minWidth: 0,
    minHeight: 0,
})

/** Sizing container: the board fills the largest 4:3 box that fits inside. */
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
    maxWidth: "min(100%, calc((100vh - 260px) * 1.42))",
    aspectRatio: "1.42",
    display: "flex",
    gap: "0.6%",
    padding: "1.2%",
    background: `linear-gradient(160deg, #8a5330, ${felt} 55%, #6b3f20)`,
    border: `0.55cqmin solid ${frameEdge}`,
    outline: `3px solid ${brass}`,
    outlineOffset: -1,
    borderRadius: 10,
    boxShadow: "inset 0 0 42px rgba(30, 12, 2, 0.55), 0 10px 24px rgba(0, 0, 0, 0.5)",
})

/** One half of the board: a 6-wide, 2-tall grid of points. */
export const half = style({
    flex: 1,
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    gridTemplateRows: "1fr 12% 1fr",
    background: "rgba(24, 10, 2, 0.25)",
    borderRadius: 6,
    boxShadow: "inset 0 0 16px rgba(20, 8, 0, 0.5)",
    padding: "1.5% 2%",
    minWidth: 0,
})

/** The raised center bar between the two halves. */
export const bar = style({
    flex: "none",
    width: "7%",
    display: "flex",
    flexDirection: "column",
    background: `linear-gradient(90deg, #4a2c16, #6b4223 50%, #4a2c16)`,
    borderRadius: 6,
    border: `2px solid ${frameEdge}`,
    boxShadow: "0 0 12px rgba(0, 0, 0, 0.45)",
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
        boxShadow: `inset 0 0 0 2px ${glow}`,
        borderRadius: 4,
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
    background: "#241207",
    border: `2px solid ${frameEdge}`,
    borderRadius: 6,
    color: cream,
    fontSize: 12,
    fontWeight: 700,
    cursor: "default",
    padding: 2,
})

export const offTrayActive = style([
    offTray,
    {
        cursor: "pointer",
        boxShadow: `inset 0 0 0 2px ${glow}, 0 0 10px rgba(255, 217, 138, 0.5)`,
    },
])

export const offCount = style({
    fontSize: 17,
    color: glow,
})

export const offLabel = style({
    fontSize: 9,
    letterSpacing: "0.08em",
    opacity: 0.75,
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
        background: `linear-gradient(180deg, ${pointLight}, #cfae78)`,
        clipPath: "polygon(0 0, 100% 0, 50% 92%)",
    },
])

export const triangleDownDark = style([
    triangle,
    {
        background: `linear-gradient(180deg, ${pointDark}, #7c3a1e)`,
        clipPath: "polygon(0 0, 100% 0, 50% 92%)",
    },
])

export const triangleUpLight = style([
    triangle,
    {
        background: `linear-gradient(0deg, ${pointLight}, #cfae78)`,
        clipPath: "polygon(0 100%, 100% 100%, 50% 8%)",
    },
])

export const triangleUpDark = style([
    triangle,
    {
        background: `linear-gradient(0deg, ${pointDark}, #7c3a1e)`,
        clipPath: "polygon(0 100%, 100% 100%, 50% 8%)",
    },
])

const pulse = keyframes({
    "0%": { boxShadow: `inset 0 0 0 2px ${glow}` },
    "50%": { boxShadow: `inset 0 0 0 3px ${glow}, inset 0 0 14px rgba(255, 217, 138, 0.5)` },
    "100%": { boxShadow: `inset 0 0 0 2px ${glow}` },
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
    boxShadow: `inset 0 0 0 3px ${brass}`,
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
    fontSize: 11,
    fontWeight: 700,
})

export const checkerLight = style([
    checker,
    {
        background: `radial-gradient(circle at 35% 30%, #fffdf2, ${checkerWhite} 55%, #cdbd9a)`,
        border: "1px solid #9f8f6c",
        boxShadow: "0 2px 3px rgba(0, 0, 0, 0.45)",
        color: "#5c4a2c",
    },
])

export const checkerDark = style([
    checker,
    {
        background: `radial-gradient(circle at 35% 30%, #6a4c38, ${checkerBlack} 60%, #180d06)`,
        border: "1px solid #120a04",
        boxShadow: "0 2px 3px rgba(0, 0, 0, 0.55)",
        color: "#e8d5b0",
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
    fontSize: "min(1.4vh, 10px)",
    fontWeight: 700,
    color: cream,
    opacity: 0.55,
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
    background: `linear-gradient(145deg, #fffaf0, ${cream})`,
    border: "1px solid #b8a988",
    boxShadow: "0 3px 6px rgba(0, 0, 0, 0.5), inset 0 -2px 0 rgba(0, 0, 0, 0.12)",
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gridTemplateRows: "repeat(3, 1fr)",
    padding: 6,
})

export const dieUsed = style([
    die,
    {
        opacity: 0.32,
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
    background: ink,
})

export const pipHidden = style([
    pip,
    {
        visibility: "hidden",
    },
])

export const rollButton = style([
    chunky,
    {
        fontSize: 15,
        padding: "8px 26px",
        background: `linear-gradient(180deg, ${brass}, #b07f2a)`,
        color: ink,
        border: `2px solid ${frameEdge}`,
    },
])

export const controlsHint = style({
    fontSize: 12,
    fontStyle: "italic",
    opacity: 0.7,
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
    gap: 10,
    background: "rgba(24, 10, 2, 0.82)",
    borderRadius: 10,
    zIndex: 2,
    textAlign: "center",
    padding: 16,
})

export const overlayTitle = style({
    fontSize: 30,
    fontWeight: 700,
    color: glow,
    textShadow: "0 0 14px rgba(255, 217, 138, 0.6)",
})

export const overlaySub = style({
    fontSize: 15,
    color: cream,
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
    padding: "7px 16px",
    borderTop: `2px solid ${frameEdge}`,
    background: "#1c1008",
    color: glow,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.06em",
})
