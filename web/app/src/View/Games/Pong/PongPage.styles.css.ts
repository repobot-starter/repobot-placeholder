import { globalStyle, style } from "@vanilla-extract/css"
import { packBrand } from "@base/design-system/theme"

const shell = "#d8d2c4"
const shellDark = "#c2bcae"
const shellDeep = "#a8a294"
const ink = "#26221a"
const screen = "#0a0a0f"
const green = "#7cf29c"
const brand = packBrand?.accent ?? "#4a3f8f"

/** Full-viewport cabinet wrapper (owns the retro desk background). */
export const page = style({
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    fontFamily: '"IBM Plex Mono", monospace',
    background: shellDeep,
    backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px)",
    backgroundSize: "100% 3px",
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
    height: "min(850px, 100%)",
    background: shell,
    border: `2px solid ${ink}`,
    borderRadius: 12,
    boxShadow: "inset 0 2px 0 rgba(255, 255, 255, 0.6), 6px 8px 0 rgba(38, 34, 26, 0.4)",
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
})

export const chunkyLit = style([
    chunky,
    {
        boxShadow: "none",
        transform: "translate(2px, 2px)",
        background: "#e9f7d8",
    },
])

export const botBadge = style({
    padding: "6px 14px",
    border: `2px solid ${ink}`,
    borderRadius: 6,
    background: "#101408",
    color: "#5a6a4a",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.06em",
})

export const botBadgeOn = style([
    botBadge,
    {
        color: green,
        textShadow: "0 0 6px rgba(124, 242, 156, 0.8)",
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
    width: 190,
    flex: "none",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    overflowY: "auto",
})

export const panel = style({
    border: `2px solid ${ink}`,
    borderRadius: 6,
    background: shell,
    padding: "0 0 8px",
})

export const panelHeader = style({
    background: brand,
    color: "#f2eefc",
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

export const speedRow = style({
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "4px 10px",
})

globalStyle(`${speedRow} input`, {
    width: "100%",
    accentColor: brand,
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
    color: brand,
})

export const brandTag = style({
    fontSize: 10,
    marginTop: 4,
    color: ink,
    opacity: 0.75,
})

export const screenBezel = style({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minWidth: 0,
})

export const crt = style({
    position: "relative",
    width: "100%",
    maxWidth: "100%",
    aspectRatio: "800 / 560",
    maxHeight: "calc(100% - 30px)",
    border: `2px solid ${ink}`,
    borderRadius: 14,
    background: screen,
    boxShadow: "inset 0 0 40px rgba(0, 0, 0, 0.9), 4px 4px 0 rgba(38, 34, 26, 0.35)",
    overflow: "hidden",
})

export const playfield = style({
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    display: "block",
})

export const scanlines = style({
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    background:
        "repeating-linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 0, rgba(255, 255, 255, 0.04) 1px, transparent 1px, transparent 3px)",
})

export const controlsHint = style({
    fontSize: 11,
    fontWeight: 600,
    opacity: 0.7,
})

export const stats = style({
    margin: 0,
    padding: "2px 10px",
})

globalStyle(`${stats} > div`, {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    padding: "3px 0",
})

globalStyle(`${stats} dt`, {
    fontWeight: 600,
    opacity: 0.75,
})

globalStyle(`${stats} dd`, {
    margin: 0,
    fontWeight: 700,
})

export const muted = style({
    fontSize: 12,
    padding: "2px 10px",
    opacity: 0.7,
})

export const statusBar = style({
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 14px",
    borderTop: `2px solid ${ink}`,
    background: "#101408",
    color: green,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.05em",
})
