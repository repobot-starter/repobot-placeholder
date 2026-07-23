import { globalStyle, style } from "@vanilla-extract/css"
import { packBrand } from "@base/design-system/theme"

// Self-contained warm "club room" palette — deliberately not the design
// system: the carrom parlor look (dark teak walls, plywood board, brass
// accents) is part of the game's identity, like the other game packs.
const room = "#221410"
const teak = "#332014"
const teakLine = "#5a3d26"
const parchment = "#f0dfc0"
const parchmentDim = "#c7b394"
const brass = packBrand?.accentDark ?? "#d9a441"
const ember = "#c0392b"
const leaf = "#2e7d32"

/** Full-viewport parlor wrapper (owns the dark teak background). */
export const page = style({
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    fontFamily: 'Georgia, "Times New Roman", serif',
    background: room,
    backgroundImage: "radial-gradient(circle at 50% 20%, rgba(217, 164, 65, 0.08), transparent 55%)",
    color: parchment,
    userSelect: "none",
    boxSizing: "border-box",
})

globalStyle(`${page} *`, {
    boxSizing: "border-box",
})

export const parlor = style({
    display: "flex",
    flexDirection: "column",
    width: "min(1240px, 100%)",
    background: teak,
    border: `2px solid ${teakLine}`,
    borderRadius: 14,
    boxShadow: "0 18px 60px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(240, 223, 192, 0.08)",
    overflow: "hidden",
})

export const titleBar = style({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    padding: "12px 18px",
    borderBottom: `2px solid ${teakLine}`,
    background: "rgba(0, 0, 0, 0.25)",
})

export const title = style({
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: "0.04em",
    color: brass,
})

export const tagline = style({
    fontSize: 12.5,
    fontStyle: "italic",
    color: parchmentDim,
})

export const layout = style({
    display: "flex",
    gap: 14,
    padding: 14,
    alignItems: "stretch",
})

export const sideColumn = style({
    width: 250,
    flex: "none",
    display: "flex",
    flexDirection: "column",
    gap: 12,
})

export const panel = style({
    border: `1px solid ${teakLine}`,
    borderRadius: 8,
    background: "rgba(0, 0, 0, 0.22)",
    overflow: "hidden",
})

export const panelHeader = style({
    padding: "7px 12px",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: brass,
    borderBottom: `1px solid ${teakLine}`,
    background: "rgba(217, 164, 65, 0.08)",
})

export const panelBody = style({
    padding: "10px 12px",
    display: "flex",
    flexDirection: "column",
    gap: 6,
})

export const radioRow = style({
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13.5,
    cursor: "pointer",
})

globalStyle(`${radioRow} input`, {
    accentColor: brass,
})

export const capitalize = style({
    textTransform: "capitalize",
})

export const chunky = style({
    font: "inherit",
    fontWeight: 700,
    fontSize: 13,
    padding: "8px 14px",
    color: parchment,
    background: "rgba(217, 164, 65, 0.12)",
    border: `1px solid ${teakLine}`,
    borderRadius: 6,
    cursor: "pointer",
    ":disabled": {
        opacity: 0.4,
        cursor: "default",
    },
    selectors: {
        "&:hover:not(:disabled)": {
            background: "rgba(217, 164, 65, 0.28)",
        },
    },
})

export const chunkyLit = style([
    chunky,
    {
        color: room,
        background: brass,
        boxShadow: "0 0 14px rgba(217, 164, 65, 0.45)",
        selectors: {
            "&:hover:not(:disabled)": {
                background: brass,
            },
        },
    },
])

export const buttonRow = style({
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
})

/** Coin tray: a felt-lined rail showing pocketed coins per player. */
export const tray = style({
    display: "flex",
    alignItems: "center",
    gap: 5,
    minHeight: 34,
    padding: "6px 10px",
    borderRadius: 6,
    background: "rgba(0, 0, 0, 0.35)",
    border: `1px solid ${teakLine}`,
})

export const trayCoin = style({
    width: 18,
    height: 18,
    borderRadius: "50%",
    flex: "none",
    boxShadow: "inset 0 -2px 3px rgba(0, 0, 0, 0.4)",
})

export const trayCoinWhite = style([
    trayCoin,
    {
        background: "#f5e9d0",
        border: "1px solid #c8b48d",
    },
])

export const trayCoinBlack = style([
    trayCoin,
    {
        background: "#3d2a1e",
        border: "1px solid #241811",
    },
])

export const trayCoinQueen = style([
    trayCoin,
    {
        background: ember,
        border: "1px solid #7d1218",
        boxShadow: "0 0 8px rgba(192, 57, 43, 0.6), inset 0 -2px 3px rgba(0, 0, 0, 0.4)",
    },
])

export const trayEmpty = style({
    fontSize: 11.5,
    fontStyle: "italic",
    color: parchmentDim,
})

export const trayLabel = style({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    fontSize: 12.5,
    fontWeight: 700,
})

export const trayLabelActive = style([
    trayLabel,
    {
        color: brass,
    },
])

export const scoreRow = style({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    fontSize: 13,
})

export const scoreBig = style({
    fontSize: 30,
    fontWeight: 700,
    color: brass,
    lineHeight: 1.1,
})

export const muted = style({
    margin: 0,
    fontSize: 12,
    lineHeight: 1.55,
    color: parchmentDim,
})

export const boardWell = style({
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    alignItems: "center",
})

/** The board sits in a thick lacquered frame. */
export const boardFrame = style({
    padding: 16,
    borderRadius: 16,
    background: "linear-gradient(160deg, #6b4423, #4a2d15)",
    boxShadow: "0 12px 34px rgba(0, 0, 0, 0.6), inset 0 2px 2px rgba(240, 223, 192, 0.18)",
    maxWidth: "100%",
})

export const board = style({
    display: "block",
    width: "min(640px, 74vh, 100%)",
    height: "auto",
    borderRadius: 6,
    touchAction: "none",
    cursor: "crosshair",
})

/** Turn / foul / result ticker under the board. */
export const messageBar = style({
    width: "100%",
    maxWidth: 672,
    textAlign: "center",
    padding: "9px 14px",
    fontSize: 14,
    borderRadius: 8,
    border: `1px solid ${teakLine}`,
    background: "rgba(0, 0, 0, 0.3)",
    color: parchment,
})

export const messageFoul = style([
    messageBar,
    {
        color: "#ffb4a8",
        borderColor: ember,
        background: "rgba(192, 57, 43, 0.14)",
    },
])

export const hint = style({
    fontSize: 11.5,
    color: parchmentDim,
})

export const statChip = style({
    display: "inline-flex",
    gap: 6,
    alignItems: "baseline",
    fontSize: 12.5,
})

export const statValue = style({
    fontWeight: 700,
    color: leaf,
    fontSize: 15,
})

export const statValueLoss = style([
    statValue,
    {
        color: ember,
    },
])

export const statusBar = style({
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 18px",
    borderTop: `2px solid ${teakLine}`,
    background: "rgba(0, 0, 0, 0.25)",
    fontSize: 12,
    color: parchmentDim,
})
