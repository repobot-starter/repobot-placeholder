import { globalStyle, style } from "@vanilla-extract/css"
import { packBrand } from "@base/design-system/theme"

const bg = "#0d1410"
const frameBg = "#1a241c"
const green = packBrand?.accentDark ?? "#42f578"
const greenDim = "#1d7a3c"
const greenSoft = "#b8ffd0"
const amber = "#ffd166"
const ink = "#020b04"

/** Full-viewport terminal wrapper (owns the phosphor-glow background). */
export const page = style({
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    fontFamily: '"IBM Plex Mono", monospace',
    background: bg,
    backgroundImage: "radial-gradient(circle at 50% 30%, rgba(66, 245, 120, 0.06), transparent 60%)",
    color: green,
    userSelect: "none",
    boxSizing: "border-box",
})

globalStyle(`${page} *`, {
    boxSizing: "border-box",
})

export const frame = style({
    display: "flex",
    flexDirection: "column",
    width: "min(1260px, 100%)",
    height: "min(860px, 100%)",
    background: frameBg,
    border: `2px solid ${greenDim}`,
    borderRadius: 10,
    boxShadow: "0 0 34px rgba(66, 245, 120, 0.18), inset 0 0 12px rgba(0, 0, 0, 0.7)",
    overflow: "hidden",
})

export const titleBar = style({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "7px 12px",
    borderBottom: `2px solid ${greenDim}`,
    background: "#101a12",
    fontWeight: 700,
    fontSize: 15,
    color: greenSoft,
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
    border: `1px solid ${greenDim}`,
    fontSize: 10,
    color: green,
})

export const layout = style({
    flex: 1,
    display: "flex",
    gap: 12,
    padding: 12,
    minHeight: 0,
})

export const side = style({
    width: 230,
    flex: "none",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    overflowY: "auto",
})

export const panel = style({
    border: `1px solid ${greenDim}`,
    borderRadius: 4,
    background: "rgba(2, 11, 4, 0.6)",
})

globalStyle(`${panel} header`, {
    padding: "5px 10px",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: greenSoft,
    borderBottom: `1px solid ${greenDim}`,
    background: "rgba(66, 245, 120, 0.08)",
})

export const readout = style({
    padding: "7px 10px 2px",
})

globalStyle(`${readout} label`, {
    display: "block",
    fontSize: 10,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    opacity: 0.75,
})

export const sevenSeg = style({
    fontFamily: '"VT323", monospace',
    fontSize: 34,
    lineHeight: 1,
    color: green,
    textShadow: "0 0 8px rgba(66, 245, 120, 0.7)",
})

export const sevenSegDim = style([
    sevenSeg,
    {
        color: greenDim,
        textShadow: "none",
    },
])

export const speedBlocks = style({
    display: "inline-flex",
    gap: 3,
    padding: "4px 0 6px",
})

export const speedBlocksSmall = style([speedBlocks])

export const block = style({
    width: 12,
    height: 14,
    border: `1px solid ${greenDim}`,
})

globalStyle(`${speedBlocksSmall} ${block}`, {
    width: 8,
    height: 9,
})

export const blockOn = style([
    block,
    {
        background: green,
        boxShadow: "0 0 6px rgba(66, 245, 120, 0.8)",
    },
])

export const copy = style({
    margin: 0,
    padding: "7px 10px",
    fontSize: 11.5,
    lineHeight: 1.5,
    color: greenSoft,
    opacity: 0.85,
})

export const log = style({
    padding: "7px 10px",
    fontSize: 11,
    lineHeight: 1.6,
    minHeight: 90,
})

export const screenArea = style({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    minWidth: 0,
})

export const screenHeading = style({
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: greenSoft,
    padding: "0 2px",
})

export const screen = style({
    position: "relative",
    flex: 1,
    border: `2px solid ${green}`,
    borderRadius: 8,
    background: ink,
    boxShadow: "0 0 24px rgba(66, 245, 120, 0.25), inset 0 0 40px rgba(0, 0, 0, 0.8)",
    overflow: "hidden",
    minHeight: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
})

export const board = style({
    maxWidth: "100%",
    maxHeight: "100%",
    display: "block",
})

export const crtOverlay = style({
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background:
        "repeating-linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 0, rgba(255, 255, 255, 0.03) 1px, transparent 1px, transparent 3px)",
})

export const modal = style({
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    background: "rgba(2, 11, 4, 0.82)",
})

export const modalTitle = style({
    fontFamily: '"VT323", monospace',
    fontSize: 52,
    color: amber,
    textShadow: "0 0 12px rgba(255, 209, 102, 0.6)",
})

export const modalScore = style({
    fontFamily: '"VT323", monospace',
    fontSize: 30,
})

export const initialsRow = style({
    display: "flex",
    gap: 8,
})

globalStyle(`${initialsRow} input`, {
    width: 150,
    font: "inherit",
    fontWeight: 700,
    textTransform: "uppercase",
    color: green,
    background: ink,
    border: `1px solid ${greenDim}`,
    borderRadius: 4,
    padding: "6px 10px",
    outline: "none",
})

export const chunky = style({
    font: "inherit",
    fontWeight: 700,
    fontSize: 13,
    padding: "7px 18px",
    color: green,
    background: "rgba(66, 245, 120, 0.08)",
    border: `1px solid ${greenDim}`,
    borderRadius: 4,
    cursor: "pointer",
    ":disabled": {
        opacity: 0.4,
        cursor: "default",
    },
    selectors: {
        "&:hover:not(:disabled)": {
            background: "rgba(66, 245, 120, 0.2)",
        },
    },
})

export const chunkyPrimary = style([
    chunky,
    {
        color: ink,
        background: green,
        boxShadow: "0 0 12px rgba(66, 245, 120, 0.5)",
    },
])

export const controlsRow = style({
    display: "flex",
    alignItems: "center",
    gap: 10,
})

export const hint = style({
    fontSize: 11,
    opacity: 0.7,
})

export const scores = style({
    margin: 0,
    padding: "7px 10px",
    listStyle: "none",
    fontSize: 12,
})

globalStyle(`${scores} li`, {
    display: "flex",
    justifyContent: "space-between",
    padding: "2.5px 0",
})

globalStyle(`${scores} li:first-child`, {
    color: amber,
})

export const botCard = style({
    display: "flex",
    gap: 10,
    padding: "8px 10px",
    alignItems: "center",
})

export const botFace = style({
    fontSize: 34,
})

export const botStats = style({
    flex: 1,
})

export const botStat = style({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 10,
    fontWeight: 700,
})

export const statusBar = style({
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 14px",
    borderTop: `2px solid ${greenDim}`,
    background: "#101a12",
    fontSize: 11.5,
    color: greenSoft,
})
