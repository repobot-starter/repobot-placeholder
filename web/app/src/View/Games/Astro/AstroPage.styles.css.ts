import { globalStyle, style } from "@vanilla-extract/css"
import { packBrand } from "@base/design-system/theme"

const bg = "#060412"
const panelBg = "#0d0a22"
const panelEdge = "#2b2454"
const cyan = packBrand?.accentDark ?? "#57c8ff"
const green = "#7cf29c"
const amber = "#ffd166"
const red = "#ff6b6b"
const text = "#cfd4ff"

/** Full-viewport hangar wrapper (owns the deep-space background). */
export const page = style({
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    fontFamily: '"IBM Plex Mono", monospace',
    background: bg,
    backgroundImage:
        "radial-gradient(circle at 20% 10%, rgba(87, 200, 255, 0.07), transparent 45%), " +
        "radial-gradient(circle at 80% 90%, rgba(185, 140, 255, 0.07), transparent 45%)",
    color: text,
    userSelect: "none",
    boxSizing: "border-box",
})

globalStyle(`${page} *`, {
    boxSizing: "border-box",
})

export const cockpit = style({
    display: "flex",
    flexDirection: "column",
    width: "min(1280px, 100%)",
    height: "min(880px, 100%)",
    background: panelBg,
    border: `2px solid ${panelEdge}`,
    borderRadius: 10,
    boxShadow: "0 0 40px rgba(87, 200, 255, 0.15), inset 0 0 20px rgba(0, 0, 0, 0.6)",
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
    background: "linear-gradient(90deg, #ff5cd0, #57c8ff)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    filter: "drop-shadow(0 0 8px rgba(255, 92, 208, 0.5))",
    marginRight: "auto",
})

export const mastheadPod = style({
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.05em",
    padding: "6px 12px",
    border: `1px solid ${panelEdge}`,
    borderRadius: 5,
    background: "rgba(0, 0, 0, 0.4)",
    color: cyan,
})

export const mastheadPodOk = style([
    mastheadPod,
    {
        color: green,
    },
])

export const layout = style({
    flex: 1,
    display: "flex",
    gap: 12,
    padding: 12,
    minHeight: 0,
})

export const side = style({
    width: 220,
    flex: "none",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    overflowY: "auto",
})

export const panel = style({
    border: `1px solid ${panelEdge}`,
    borderRadius: 6,
    background: "rgba(0, 0, 0, 0.35)",
})

globalStyle(`${panel} header`, {
    padding: "5px 10px",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: cyan,
    borderBottom: `1px solid ${panelEdge}`,
    background: "rgba(87, 200, 255, 0.07)",
})

export const readout = style({
    padding: "7px 10px 3px",
})

globalStyle(`${readout} label`, {
    display: "block",
    fontSize: 10,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    opacity: 0.65,
})

export const digits = style({
    fontFamily: '"Press Start 2P", monospace',
    fontSize: 15,
    lineHeight: 1.5,
})

export const digitsCyan = style([digits, { color: cyan, textShadow: "0 0 8px rgba(87, 200, 255, 0.6)" }])

export const digitsGreen = style([digits, { color: green, textShadow: "0 0 8px rgba(124, 242, 156, 0.6)" }])

export const digitsAmber = style([
    digits,
    { color: amber, textShadow: "0 0 8px rgba(255, 209, 102, 0.6)", fontSize: 12 },
])

export const barTrack = style({
    height: 12,
    margin: "4px 0 6px",
    border: `1px solid ${panelEdge}`,
    borderRadius: 3,
    overflow: "hidden",
})

export const barFill = style({
    height: "100%",
    background: `repeating-linear-gradient(90deg, ${cyan} 0, ${cyan} 6px, transparent 6px, transparent 9px)`,
    transition: "width 0.3s",
})

export const controlsGrid = style({
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 6,
    padding: "8px 10px",
    fontSize: 11,
    fontWeight: 600,
})

export const copy = style({
    margin: 0,
    padding: "7px 10px",
    fontSize: 11.5,
    lineHeight: 1.55,
    opacity: 0.85,
})

export const viewportColumn = style({
    flex: 1,
    display: "flex",
    minWidth: 0,
})

export const viewport = style({
    position: "relative",
    flex: 1,
    border: `2px solid ${cyan}`,
    borderRadius: 8,
    boxShadow: "0 0 24px rgba(87, 200, 255, 0.3), inset 0 0 60px rgba(0, 0, 0, 0.8)",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#05030f",
})

export const space = style({
    maxWidth: "100%",
    maxHeight: "100%",
    display: "block",
})

export const viewportFooter = style({
    position: "absolute",
    bottom: 10,
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: amber,
    padding: "4px 14px",
    border: "1px solid rgba(255, 209, 102, 0.4)",
    borderRadius: 4,
    background: "rgba(0, 0, 0, 0.6)",
    whiteSpace: "nowrap",
})

export const modal = style({
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    background: "rgba(5, 3, 15, 0.85)",
    zIndex: 2,
})

export const modalTitle = style({
    fontFamily: '"Press Start 2P", monospace',
    fontSize: 26,
    color: red,
    textShadow: "0 0 14px rgba(255, 107, 107, 0.7)",
})

export const modalTitleAmber = style([
    modalTitle,
    {
        color: amber,
        textShadow: "0 0 14px rgba(255, 209, 102, 0.7)",
    },
])

export const modalLine = style({
    fontSize: 14,
    fontWeight: 700,
})

export const modalLineNewRecord = style([
    modalLine,
    {
        color: amber,
    },
])

export const btn = style({
    font: "inherit",
    fontWeight: 700,
    fontSize: 13,
    padding: "8px 18px",
    borderRadius: 5,
    border: "1px solid",
    background: "rgba(0, 0, 0, 0.4)",
    cursor: "pointer",
    selectors: {
        "&:hover:not(:disabled)": {
            background: "rgba(255, 255, 255, 0.08)",
        },
        "&:disabled": {
            opacity: 0.4,
            cursor: "default",
        },
    },
})

export const btnGreen = style([
    btn,
    { color: green, borderColor: green, boxShadow: "0 0 10px rgba(124, 242, 156, 0.3)" },
])

export const btnAmber = style([
    btn,
    { color: amber, borderColor: amber, boxShadow: "0 0 10px rgba(255, 209, 102, 0.3)" },
])

export const panelButtons = style([
    panel,
    {
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: 10,
        border: "none",
        background: "none",
    },
])

export const statusBar = style({
    display: "flex",
    justifyContent: "space-between",
    padding: "7px 14px",
    borderTop: `2px solid ${panelEdge}`,
    background: "rgba(0, 0, 0, 0.4)",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.05em",
    color: cyan,
})
