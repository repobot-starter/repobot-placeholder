import { globalStyle, keyframes, style } from "@vanilla-extract/css"
import { packBrand } from "@base/design-system/theme"

// Self-contained palette (packs never import the design system): a tea-house
// desk around a wooden goban with slate and shell stones.
const room = "#2c221b"
const shell = "#e9dcc3"
const shellDark = "#d9c9a8"
const ink = "#2b1f14"
const brand = packBrand?.accent ?? "#8a5a2b"
const brandDeep = packBrand?.accentHover ?? "#5f3d1c"
const wood = "#deb26a"
const woodEdge = "#b98a45"
const gridLine = "rgba(59, 40, 18, 0.75)"
const lantern = "#ffd97a"

/** Full-viewport wrapper (owns the dim tea-house background). */
export const page = style({
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    fontFamily: '"IBM Plex Mono", monospace',
    background: room,
    backgroundImage: "radial-gradient(circle at 50% 20%, rgba(255, 217, 122, 0.08), transparent 55%)",
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
    height: "min(860px, 100%)",
    background: shell,
    border: `2px solid ${ink}`,
    borderRadius: 12,
    boxShadow: "inset 0 2px 0 rgba(255, 255, 255, 0.55), 6px 8px 0 rgba(0, 0, 0, 0.4)",
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

export const botBadge = style({
    padding: "6px 14px",
    border: `2px solid ${ink}`,
    borderRadius: 6,
    background: "#1c130b",
    color: "#6b5a41",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.06em",
})

export const botBadgeOn = style([
    botBadge,
    {
        color: lantern,
        textShadow: "0 0 6px rgba(255, 217, 122, 0.8)",
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
    width: 210,
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

export const panelHeader = style({
    background: brand,
    color: "#fbf3e2",
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

export const tallyRow = style({
    display: "flex",
    justifyContent: "space-between",
    padding: "2px 10px",
    fontSize: 13,
    fontWeight: 600,
})

export const tallyValue = style({
    fontWeight: 700,
    color: brandDeep,
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
    color: brandDeep,
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
    background: wood,
    backgroundImage:
        "repeating-linear-gradient(93deg, rgba(133, 90, 38, 0.14) 0 3cqmin, rgba(255, 231, 178, 0.12) 3cqmin 7cqmin)",
    border: `2px solid ${ink}`,
    borderRadius: 8,
    boxShadow: `inset 0 0 0 0.7cqmin ${woodEdge}, inset 0 0 26px rgba(74, 46, 14, 0.4), 4px 4px 0 rgba(0, 0, 0, 0.35)`,
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
    height: 1.5,
    transform: "translateY(-50%)",
    background: gridLine,
    pointerEvents: "none",
})

/** Vertical grid stroke through the intersection center (see `lineH`). */
export const lineV = style({
    position: "absolute",
    left: "50%",
    width: 1.5,
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
    boxShadow: "0.25cqmin 0.35cqmin 0.6cqmin rgba(30, 16, 4, 0.55)",
    animation: `${settle} 0.15s ease-out`,
    pointerEvents: "none",
})

export const stoneBlack = style([
    stone,
    {
        background: "radial-gradient(circle at 32% 28%, #5c5c60 0%, #232326 45%, #0a0a0c 100%)",
    },
])

export const stoneWhite = style([
    stone,
    {
        background: "radial-gradient(circle at 32% 28%, #ffffff 0%, #ece7da 55%, #c9c2ae 100%)",
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
    background: "#e05c3a",
    pointerEvents: "none",
})

/** Glow ring around each stone of the completed five. */
export const winGlow = style({
    position: "absolute",
    inset: "2%",
    borderRadius: "50%",
    boxShadow: `0 0 0 0.55cqmin ${lantern}, 0 0 2cqmin rgba(255, 217, 122, 0.9)`,
    pointerEvents: "none",
})

/** Faint stone preview on hover so placement feels precise. */
export const hoverHint = style({
    position: "absolute",
    inset: "9%",
    borderRadius: "50%",
    opacity: 0,
    background: "rgba(43, 31, 20, 0.35)",
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
        background: "rgba(255, 255, 255, 0.55)",
    },
])

export const controlsHint = style({
    fontSize: 11,
    fontWeight: 600,
    opacity: 0.7,
})

export const statusBar = style({
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 14px",
    borderTop: `2px solid ${ink}`,
    background: "#1c130b",
    color: lantern,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.05em",
})
