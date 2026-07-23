import { globalStyle, style } from "@vanilla-extract/css"
import { packBrand } from "@base/design-system/theme"

const bg = "#070a16"
const panelBg = "#0f1428"
const panelEdge = "#2c3555"
const amber = packBrand?.accentDark ?? "#ffbe55"
const ember = "#ff7761"
const mint = "#8df2b6"
const cream = "#fdf3c9"
const text = "#dfe4ff"

/** Full-viewport wrapper (owns the night-street background). */
export const page = style({
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    fontFamily: '"IBM Plex Mono", monospace',
    background: bg,
    backgroundImage:
        "radial-gradient(circle at 80% 12%, rgba(253, 243, 201, 0.10), transparent 40%), " +
        "radial-gradient(circle at 12% 85%, rgba(255, 119, 97, 0.08), transparent 45%)",
    color: text,
    userSelect: "none",
    boxSizing: "border-box",
})

globalStyle(`${page} *`, {
    boxSizing: "border-box",
})

export const cabinet = style({
    display: "flex",
    flexDirection: "column",
    width: "min(1280px, 100%)",
    height: "min(900px, 100%)",
    background: panelBg,
    border: `2px solid ${panelEdge}`,
    borderRadius: 10,
    boxShadow: "0 0 40px rgba(255, 190, 85, 0.12), inset 0 0 20px rgba(0, 0, 0, 0.6)",
    overflow: "hidden",
})

export const masthead = style({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    borderBottom: `2px solid ${panelEdge}`,
    background: "rgba(0, 0, 0, 0.35)",
})

export const logo = style({
    fontFamily: '"Press Start 2P", monospace',
    fontSize: 20,
    background: `linear-gradient(90deg, ${amber}, ${ember})`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    letterSpacing: 2,
})

export const mastheadPod = style({
    marginLeft: "auto",
    fontSize: 11,
    color: cream,
    opacity: 0.8,
})

export const mastheadPodOk = style({
    fontSize: 11,
    color: mint,
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
    display: "flex",
    flexDirection: "column",
    gap: 12,
    "@media": {
        "screen and (max-width: 980px)": { display: "none" },
    },
})

export const panel = style({
    background: "rgba(0, 0, 0, 0.3)",
    border: `1px solid ${panelEdge}`,
    borderRadius: 8,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 10,
})

globalStyle(`${panel} > header`, {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: amber,
    borderBottom: `1px solid ${panelEdge}`,
    paddingBottom: 6,
})

export const panelButtons = style({
    display: "flex",
    flexDirection: "column",
    gap: 8,
})

export const readout = style({
    display: "flex",
    flexDirection: "column",
    gap: 3,
})

globalStyle(`${readout} > label`, {
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
    opacity: 0.65,
})

export const digitsAmber = style({
    fontFamily: '"Press Start 2P", monospace',
    fontSize: 15,
    color: amber,
    textShadow: `0 0 8px ${amber}`,
})

export const digitsMint = style({
    fontFamily: '"Press Start 2P", monospace',
    fontSize: 15,
    color: mint,
    textShadow: `0 0 8px ${mint}`,
})

export const digitsEmber = style({
    fontFamily: '"Press Start 2P", monospace',
    fontSize: 15,
    color: ember,
    textShadow: `0 0 8px ${ember}`,
})

export const controlsGrid = style({
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: 11,
    opacity: 0.85,
})

export const copy = style({
    fontSize: 11,
    lineHeight: 1.55,
    opacity: 0.85,
    margin: 0,
})

export const viewportColumn = style({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
})

export const viewport = style({
    position: "relative",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    border: `2px solid ${panelEdge}`,
    borderRadius: 8,
    overflow: "hidden",
    background: "#050810",
})

export const street = style({
    flex: 1,
    width: "100%",
    height: "100%",
    display: "block",
    objectFit: "contain",
    cursor: "pointer",
})

export const viewportFooter = style({
    padding: "7px 12px",
    fontSize: 11,
    letterSpacing: 1,
    color: cream,
    background: "rgba(0, 0, 0, 0.45)",
    borderTop: `1px solid ${panelEdge}`,
})

export const modal = style({
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    background: "rgba(4, 6, 12, 0.82)",
    backdropFilter: "blur(2px)",
    textAlign: "center",
    padding: 20,
})

export const modalTitle = style({
    fontFamily: '"Press Start 2P", monospace',
    fontSize: 26,
    color: ember,
    textShadow: `0 0 18px ${ember}`,
})

export const modalTitleAmber = style({
    fontFamily: '"Press Start 2P", monospace',
    fontSize: 22,
    color: amber,
    textShadow: `0 0 14px ${amber}`,
})

export const modalLine = style({
    fontSize: 13,
    color: text,
    maxWidth: 420,
    lineHeight: 1.6,
})

export const modalLineNewRecord = style({
    fontFamily: '"Press Start 2P", monospace',
    fontSize: 12,
    color: mint,
    textShadow: `0 0 10px ${mint}`,
})

export const stoveScene = style({
    fontSize: 44,
    letterSpacing: 8,
})

const buttonBase = {
    fontFamily: '"IBM Plex Mono", monospace',
    fontSize: 13,
    padding: "10px 14px",
    borderRadius: 6,
    cursor: "pointer",
    background: "transparent",
    transition: "background 120ms ease, color 120ms ease",
} as const

export const btnAmber = style({
    ...buttonBase,
    border: `1px solid ${amber}`,
    color: amber,
    ":hover": { background: "rgba(255, 190, 85, 0.15)" },
    ":disabled": { opacity: 0.4, cursor: "default" },
})

export const btnMint = style({
    ...buttonBase,
    border: `1px solid ${mint}`,
    color: mint,
    ":hover": { background: "rgba(141, 242, 182, 0.15)" },
})

export const statusBar = style({
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    padding: "8px 14px",
    fontSize: 10,
    letterSpacing: 1,
    color: cream,
    opacity: 0.75,
    borderTop: `2px solid ${panelEdge}`,
    background: "rgba(0, 0, 0, 0.35)",
})
