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

// Monochrome goban
const boardSurface = "#161618"
const gridLine = "rgba(255, 255, 255, 0.22)"

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

export const tallyRow = style({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    fontSize: 12,
    color: inkSoft,
})

export const tallyValue = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 13,
    color: ink,
})

export const tallyReset = style([
    button,
    {
        marginTop: 4,
        padding: "7px 14px",
        alignSelf: "flex-start",
    },
])

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

/** Sizing container: the goban fills the largest square that fits inside it. */
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

/**
 * The goban. Padding of half a cell (100cqmin / 15 / 2) makes intersections
 * land exactly on the grid cell centers, like a real board's margin.
 */
export const goban = style({
    width: "100cqmin",
    height: "100cqmin",
    padding: "calc(100cqmin / 30)",
    background: boardSurface,
    border: "1px solid rgba(255, 255, 255, 0.16)",
    borderRadius: 10,
    boxShadow: "0 24px 64px rgba(0, 0, 0, 0.5)",
})

export const grid = style({
    width: "100%",
    height: "100%",
    display: "grid",
    gridTemplateColumns: "repeat(15, 1fr)",
    gridTemplateRows: "repeat(15, 1fr)",
})

/** One intersection; the grid line spans and stone layers stack inside it. */
export const cell = style({
    position: "relative",
    padding: 0,
    border: "none",
    background: "transparent",
    cursor: "pointer",
    ":disabled": {
        cursor: "default",
    },
})

/**
 * Horizontal grid stroke through the intersection center. Edge columns pass
 * inline left/right offsets of 50% so border lines stop at the intersection
 * and the playing area reads as a clean frame.
 */
export const lineH = style({
    position: "absolute",
    top: "50%",
    height: 1,
    transform: "translateY(-50%)",
    background: gridLine,
    pointerEvents: "none",
})

/** Vertical grid stroke through the intersection center (see `lineH`). */
export const lineV = style({
    position: "absolute",
    left: "50%",
    width: 1,
    transform: "translateX(-50%)",
    background: gridLine,
    pointerEvents: "none",
})

/** Star point (hoshi) dot under the stone layer. */
export const starPoint = style({
    position: "absolute",
    left: "50%",
    top: "50%",
    width: "1.6cqmin",
    height: "1.6cqmin",
    transform: "translate(-50%, -50%)",
    borderRadius: "50%",
    background: gridLine,
    pointerEvents: "none",
})

const settle = keyframes({
    from: { transform: "scale(1.3)" },
    to: { transform: "scale(1)" },
})

const stone = style({
    position: "absolute",
    inset: "9%",
    borderRadius: "50%",
    boxShadow: "0.25cqmin 0.35cqmin 0.6cqmin rgba(0, 0, 0, 0.55)",
    animation: `${settle} 0.15s ease-out`,
    pointerEvents: "none",
})

export const stoneBlack = style([
    stone,
    {
        background: "radial-gradient(circle at 32% 28%, #45454c 0%, #1c1c1f 45%, #0a0a0c 100%)",
        boxShadow:
            "inset 0 0 0 1px rgba(255, 255, 255, 0.25), 0.25cqmin 0.35cqmin 0.6cqmin rgba(0, 0, 0, 0.55)",
    },
])

export const stoneWhite = style([
    stone,
    {
        background: "radial-gradient(circle at 32% 28%, #ffffff 0%, #ececf0 55%, #c2c2c8 100%)",
    },
])

/** Small contrasting dot marking the most recent move. */
export const lastMoveDot = style({
    position: "absolute",
    left: "50%",
    top: "50%",
    width: "1.7cqmin",
    height: "1.7cqmin",
    transform: "translate(-50%, -50%)",
    borderRadius: "50%",
    background: "#8f8f96",
    pointerEvents: "none",
})

/** Ring around each stone of the completed five. */
export const winGlow = style({
    position: "absolute",
    inset: "2%",
    borderRadius: "50%",
    boxShadow: "0 0 0 0.45cqmin #fafafa, 0 0 2cqmin rgba(255, 255, 255, 0.7)",
    pointerEvents: "none",
})

/** Faint stone preview on hover so placement feels precise. */
export const hoverHint = style({
    position: "absolute",
    inset: "9%",
    borderRadius: "50%",
    opacity: 0,
    background: "rgba(10, 10, 12, 0.7)",
    boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.3)",
    pointerEvents: "none",
    selectors: {
        [`${cell}:hover:not(:disabled) &`]: {
            opacity: 1,
        },
    },
})

export const hoverHintWhite = style([
    hoverHint,
    {
        background: "rgba(255, 255, 255, 0.4)",
        boxShadow: "none",
    },
])

export const controlsHint = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 10,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
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
