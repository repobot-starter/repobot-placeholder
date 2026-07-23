import { globalStyle, keyframes, style, styleVariants } from "@vanilla-extract/css"

// Self-contained board-game palette (deliberately NOT the design system):
// a felt table, a warm wooden frame, and the four classic token colors.
const felt = "#1c6b47"
const feltDeep = "#125034"
const wood = "#8a5a2b"
const woodDark = "#5f3d1c"
const woodLight = "#c9944e"
const boardFace = "#f8f2e3"
const ink = "#2b2015"
const paper = "#fffaf0"

const seatRed = "#e0453a"
const seatGreen = "#2fa24c"
const seatYellow = "#f2b705"
const seatBlue = "#2f6fd0"

/** Full-viewport wrapper (owns the green-felt table background). */
export const page = style({
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    fontFamily: '"Trebuchet MS", "Segoe UI", Verdana, sans-serif',
    background: felt,
    backgroundImage: `radial-gradient(circle at 50% 32%, rgba(255, 255, 255, 0.10), transparent 62%),
        radial-gradient(circle at 50% 110%, ${feltDeep} 20%, transparent 70%)`,
    color: ink,
    userSelect: "none",
    boxSizing: "border-box",
})

globalStyle(`${page} *`, {
    boxSizing: "border-box",
})

/** The wooden game box: title bar, board + side panel, status footer. */
export const table = style({
    display: "flex",
    flexDirection: "column",
    width: "min(1120px, 100%)",
    height: "min(860px, 100%)",
    background: wood,
    backgroundImage: "linear-gradient(180deg, rgba(255, 255, 255, 0.14), transparent 26%)",
    border: `2px solid ${woodDark}`,
    borderRadius: 16,
    boxShadow: "0 18px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25)",
    overflow: "hidden",
})

export const titleBar = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 18px",
    background: woodDark,
    color: paper,
    fontWeight: 700,
    fontSize: 18,
    letterSpacing: "0.04em",
    textShadow: "0 1px 0 rgba(0, 0, 0, 0.5)",
})

export const titleTag = style({
    fontSize: 11,
    fontWeight: 600,
    opacity: 0.75,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
})

export const layout = style({
    flex: 1,
    display: "flex",
    gap: 14,
    padding: 14,
    minHeight: 0,
})

/** Sizing container: the SVG board fills the largest square that fits. */
export const boardArena = style({
    flex: 1,
    position: "relative",
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
    background: boardFace,
    border: `3px solid ${woodDark}`,
    borderRadius: 12,
    boxShadow: "inset 0 0 26px rgba(0, 0, 0, 0.18), 0 6px 16px rgba(0, 0, 0, 0.3)",
})

// ---------------------------------------------------------------------------
// Tokens and hints (SVG)
// ---------------------------------------------------------------------------

const tokenPulse = keyframes({
    "0%": { strokeOpacity: 0.9, strokeWidth: 3 },
    "50%": { strokeOpacity: 0.25, strokeWidth: 6 },
    "100%": { strokeOpacity: 0.9, strokeWidth: 3 },
})

/** Token group; the transform transition is what animates movement. */
export const token = style({
    transition: "transform 0.4s cubic-bezier(0.3, 1.25, 0.5, 1)",
})

export const tokenClickable = style({
    cursor: "pointer",
})

/** Pulsing halo around tokens the player may move right now. */
export const tokenHalo = style({
    fill: "none",
    stroke: "#ffffff",
    animation: `${tokenPulse} 1.1s ease-in-out infinite`,
    pointerEvents: "none",
})

/** Dashed outline on the square a hinted token would land on. */
export const hintRing = style({
    fill: "rgba(255, 255, 255, 0.25)",
    stroke: ink,
    strokeDasharray: "4 4",
    pointerEvents: "none",
})

/** Star marking on the 4 shared safe squares. */
export const starGlyph = style({
    pointerEvents: "none",
    fill: "rgba(43, 32, 21, 0.45)",
})

// ---------------------------------------------------------------------------
// Side panel
// ---------------------------------------------------------------------------

export const side = style({
    width: 264,
    flex: "none",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    minHeight: 0,
    overflowY: "auto",
})

export const panel = style({
    background: paper,
    border: `2px solid ${woodDark}`,
    borderRadius: 10,
    padding: "0 0 10px",
    boxShadow: "0 3px 0 rgba(0, 0, 0, 0.25)",
})

export const panelHeader = style({
    background: woodLight,
    color: ink,
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.09em",
    padding: "5px 10px",
    marginBottom: 8,
    borderBottom: `2px solid ${woodDark}`,
    borderRadius: "8px 8px 0 0",
})

export const panelBody = style({
    padding: "0 10px",
    display: "flex",
    flexDirection: "column",
    gap: 8,
})

const swatchBase = style({
    display: "inline-block",
    width: 14,
    height: 14,
    borderRadius: 4,
    border: `2px solid ${woodDark}`,
    flex: "none",
})

/** Seat color swatch used in chips, placings, and the wins tally. */
export const swatch = styleVariants({
    red: [swatchBase, { background: seatRed }],
    green: [swatchBase, { background: seatGreen }],
    yellow: [swatchBase, { background: seatYellow }],
    blue: [swatchBase, { background: seatBlue }],
})

export const seatRow = style({
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 700,
})

export const seatName = style({
    width: 52,
    textTransform: "capitalize",
})

export const segmented = style({
    display: "flex",
    flex: 1,
    gap: 0,
    border: `2px solid ${woodDark}`,
    borderRadius: 7,
    overflow: "hidden",
})

export const segment = style({
    flex: 1,
    font: "inherit",
    fontSize: 11,
    fontWeight: 700,
    padding: "5px 0",
    background: paper,
    color: ink,
    border: "none",
    borderRight: `1px solid ${woodDark}`,
    cursor: "pointer",
    selectors: {
        "&:last-child": { borderRight: "none" },
    },
})

export const segmentOn = style([
    segment,
    {
        background: woodDark,
        color: paper,
    },
])

const buttonBase = style({
    font: "inherit",
    fontWeight: 700,
    fontSize: 14,
    padding: "9px 14px",
    borderRadius: 8,
    border: `2px solid ${woodDark}`,
    cursor: "pointer",
    boxShadow: "0 3px 0 rgba(0, 0, 0, 0.3)",
    ":active": {
        boxShadow: "none",
        transform: "translateY(3px)",
    },
    ":disabled": {
        opacity: 0.5,
        cursor: "default",
        boxShadow: "0 3px 0 rgba(0, 0, 0, 0.3)",
        transform: "none",
    },
})

export const primaryBtn = style([
    buttonBase,
    {
        background: seatGreen,
        color: paper,
        textShadow: "0 1px 0 rgba(0, 0, 0, 0.35)",
    },
])

export const woodBtn = style([
    buttonBase,
    {
        background: woodLight,
        color: ink,
    },
])

export const turnChip = style({
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    fontWeight: 700,
    textTransform: "capitalize",
})

// ---------------------------------------------------------------------------
// Dice
// ---------------------------------------------------------------------------

const diceShake = keyframes({
    "0%": { transform: "rotate(0deg) translate(0, 0)" },
    "25%": { transform: "rotate(-14deg) translate(-3px, 2px)" },
    "50%": { transform: "rotate(10deg) translate(3px, -2px)" },
    "75%": { transform: "rotate(-8deg) translate(-2px, -2px)" },
    "100%": { transform: "rotate(0deg) translate(0, 0)" },
})

export const diceRow = style({
    display: "flex",
    alignItems: "center",
    gap: 12,
})

/** The die itself: a chunky white cube face rendering pips in a 3x3 grid. */
export const die = style({
    width: 64,
    height: 64,
    flex: "none",
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gridTemplateRows: "repeat(3, 1fr)",
    padding: 9,
    background: "#ffffff",
    border: `2px solid ${ink}`,
    borderRadius: 12,
    boxShadow: "inset 0 -4px 0 rgba(0, 0, 0, 0.12), 0 3px 0 rgba(0, 0, 0, 0.3)",
    cursor: "pointer",
    ":disabled": {
        cursor: "default",
        opacity: 0.85,
    },
})

export const dieRolling = style({
    animation: `${diceShake} 0.16s linear infinite`,
})

export const pip = style({
    alignSelf: "center",
    justifySelf: "center",
    width: 10,
    height: 10,
    borderRadius: "50%",
    background: ink,
})

export const diceHint = style({
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1.35,
})

export const note = style({
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1.4,
    minHeight: 34,
})

// ---------------------------------------------------------------------------
// Placings, stats, overlay
// ---------------------------------------------------------------------------

export const listRow = style({
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 600,
    textTransform: "capitalize",
})

export const listValue = style({
    marginLeft: "auto",
    fontWeight: 700,
})

export const mutedRow = style({
    fontSize: 12,
    opacity: 0.65,
})

export const overlay = style({
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(18, 30, 24, 0.62)",
    borderRadius: 12,
})

export const overlayCard = style({
    display: "flex",
    flexDirection: "column",
    gap: 12,
    width: "min(360px, 86%)",
    padding: 20,
    background: paper,
    border: `3px solid ${woodDark}`,
    borderRadius: 14,
    boxShadow: "0 14px 34px rgba(0, 0, 0, 0.5)",
    textAlign: "center",
})

export const overlayTitle = style({
    fontSize: 24,
    fontWeight: 800,
    letterSpacing: "0.02em",
})

export const overlayButtons = style({
    display: "flex",
    gap: 10,
    justifyContent: "center",
})

export const statusBar = style({
    display: "flex",
    justifyContent: "space-between",
    padding: "7px 16px",
    background: woodDark,
    color: paper,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.04em",
})
