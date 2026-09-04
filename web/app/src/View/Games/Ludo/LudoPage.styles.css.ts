import { globalStyle, keyframes, style, styleVariants } from "@vanilla-extract/css"

const bg = "#0a0a0a"
const surface = "#111112"
const ink = "var(--pack-accent, #fafafa)"
const inkSoft = "#a1a1aa"
const inkFaint = "#5b5b60"
const hairline = "rgba(255, 255, 255, 0.1)"
const hairlineStrong = "rgba(255, 255, 255, 0.18)"
const sans = "var(--pack-font, Inter, system-ui, sans-serif)"
const mono = '"IBM Plex Mono", monospace'

// The four seat colors are gameplay: racers must be tellable apart, so they
// stay colored — muted to sit on the dark board — while every other surface
// is monochrome.
const seatRed = "#d64537"
const seatGreen = "#3fa35c"
const seatYellow = "#e3b341"
const seatBlue = "#4a80d9"

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

/** The game column: header, board + side panel, status footer. */
export const table = style({
    display: "flex",
    flexDirection: "column",
    width: "min(1120px, 100%)",
    height: "min(860px, calc(100vh - 56px))",
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

export const layout = style({
    flex: 1,
    display: "flex",
    gap: 18,
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
    background: "#161618",
    border: "1px solid rgba(255, 255, 255, 0.16)",
    borderRadius: 12,
    boxShadow: "0 24px 64px rgba(0, 0, 0, 0.5)",
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
    fill: "rgba(255, 255, 255, 0.14)",
    stroke: "#fafafa",
    strokeDasharray: "4 4",
    pointerEvents: "none",
})

/** Star marking on the 4 shared safe squares. */
export const starGlyph = style({
    pointerEvents: "none",
    fill: "rgba(255, 255, 255, 0.28)",
})

// ---------------------------------------------------------------------------
// Side panel
// ---------------------------------------------------------------------------

export const side = style({
    width: 268,
    flex: "none",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    minHeight: 0,
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

export const panelBody = style({
    display: "flex",
    flexDirection: "column",
    gap: 8,
})

const swatchBase = style({
    display: "inline-block",
    width: 12,
    height: 12,
    borderRadius: 4,
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
    fontSize: 12,
    color: inkSoft,
})

export const seatName = style({
    width: 48,
    textTransform: "capitalize",
})

export const segmented = style({
    display: "flex",
    flex: 1,
    gap: 4,
})

export const segment = style({
    flex: 1,
    font: "inherit",
    fontSize: 11,
    fontWeight: 500,
    padding: "5px 0",
    background: "transparent",
    color: inkSoft,
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

const buttonBase = style({
    font: "inherit",
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 11,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    padding: "10px 18px",
    borderRadius: 8,
    cursor: "pointer",
    transition: "background 120ms ease",
    ":disabled": {
        cursor: "default",
    },
})

export const primaryBtn = style([
    buttonBase,
    {
        background: ink,
        border: `1px solid ${ink}`,
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

export const woodBtn = style([
    buttonBase,
    {
        background: "transparent",
        border: `1px solid ${hairlineStrong}`,
        color: ink,
        selectors: {
            "&:hover:not(:disabled)": {
                background: "rgba(255, 255, 255, 0.06)",
            },
            "&:disabled": {
                color: inkFaint,
                borderColor: hairline,
            },
        },
    },
])

export const turnChip = style({
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 500,
    textTransform: "capitalize",
    color: ink,
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

/** The die itself: a white cube face rendering pips in a 3x3 grid. */
export const die = style({
    width: 62,
    height: 62,
    flex: "none",
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gridTemplateRows: "repeat(3, 1fr)",
    padding: 9,
    background: "#fafafa",
    border: "none",
    borderRadius: 12,
    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.45)",
    cursor: "pointer",
    transition: "background 120ms ease",
    ":disabled": {
        cursor: "default",
        background: "#8f8f96",
    },
})

export const dieRolling = style({
    animation: `${diceShake} 0.16s linear infinite`,
})

export const pip = style({
    alignSelf: "center",
    justifySelf: "center",
    width: 9,
    height: 9,
    borderRadius: "50%",
    background: "#0a0a0a",
})

export const diceHint = style({
    fontSize: 12,
    lineHeight: 1.4,
    color: inkSoft,
})

export const note = style({
    fontSize: 12,
    lineHeight: 1.5,
    minHeight: 34,
    color: inkSoft,
})

// ---------------------------------------------------------------------------
// Placings, stats, overlay
// ---------------------------------------------------------------------------

export const listRow = style({
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    color: inkSoft,
    textTransform: "capitalize",
})

export const listValue = style({
    marginLeft: "auto",
    fontFamily: mono,
    fontWeight: 600,
    color: ink,
})

export const mutedRow = style({
    fontSize: 12,
    lineHeight: 1.5,
    color: inkFaint,
})

export const overlay = style({
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(10, 10, 10, 0.82)",
    borderRadius: 12,
})

export const overlayCard = style({
    display: "flex",
    flexDirection: "column",
    gap: 12,
    width: "min(380px, 86%)",
    padding: "24px 28px",
    background: surface,
    border: `1px solid ${hairlineStrong}`,
    borderRadius: 12,
    boxShadow: "0 24px 64px rgba(0, 0, 0, 0.6)",
    textAlign: "center",
    fontSize: 13,
    color: inkSoft,
})

export const overlayTitle = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 17,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: ink,
})

export const overlayButtons = style({
    display: "flex",
    gap: 10,
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
