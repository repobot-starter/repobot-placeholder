import { globalStyle, style } from "@vanilla-extract/css"

const bg = "#0a0a0a"
const surface = "#111112"
const ink = "var(--pack-accent, #fafafa)"
const inkSoft = "#a1a1aa"
const inkFaint = "#5b5b60"
const hairline = "rgba(255, 255, 255, 0.1)"
const hairlineStrong = "rgba(255, 255, 255, 0.18)"
const sans = "var(--pack-font, Inter, system-ui, sans-serif)"
const mono = '"IBM Plex Mono", monospace'
const paper = "#fcfcfc"

/** Full-viewport wrapper (owns the near-black background). */
export const page = style({
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 32px",
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

export const studio = style({
    display: "flex",
    flexDirection: "column",
    width: "min(1280px, 100%)",
    height: "100%",
    gap: 16,
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

export const actionDivider = style({
    width: 1,
    height: 22,
    background: hairline,
    margin: "0 4px",
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

export const workspace = style({
    flex: 1,
    display: "flex",
    gap: 16,
    minHeight: 0,
})

export const toolRail = style({
    width: 128,
    flex: "none",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: 10,
    background: surface,
    border: `1px solid ${hairline}`,
    borderRadius: 10,
    overflowY: "auto",
})

export const tool = style({
    font: "inherit",
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 10,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    textAlign: "left",
    padding: "10px 12px",
    color: inkSoft,
    background: "transparent",
    border: "1px solid transparent",
    borderRadius: 7,
    cursor: "pointer",
    transition: "color 120ms ease, background 120ms ease",
    ":hover": {
        color: ink,
    },
})

export const toolActive = style([
    tool,
    {
        color: "#0a0a0a",
        background: ink,
        ":hover": {
            color: "#0a0a0a",
        },
    },
])

export const railDivider = style({
    height: 1,
    background: hairline,
    margin: "6px 2px",
})

export const railLabel = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 9,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: inkFaint,
    padding: "2px 12px",
})

export const canvasArea = style({
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
})

export const canvasStack = style({
    position: "relative",
    width: "100%",
    maxWidth: "100%",
    aspectRatio: "960 / 640",
    maxHeight: "100%",
    background: paper,
    borderRadius: 10,
    overflow: "hidden",
    boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.14), 0 24px 64px rgba(0, 0, 0, 0.5)",
})

globalStyle(`${canvasStack} canvas`, {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    display: "block",
})

export const overlay = style({
    touchAction: "none",
    cursor: "crosshair",
})

export const sidePanel = style({
    width: 248,
    flex: "none",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    minHeight: 0,
    overflowY: "auto",
})

export const panelSection = style({
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: "14px 16px",
    background: surface,
    border: `1px solid ${hairline}`,
    borderRadius: 10,
})

export const panelHeading = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 10,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: inkFaint,
})

// Previews the stroke against canvas white, so dark inks stay visible.
export const strokePreview = style({
    background: paper,
    border: `1px solid ${hairline}`,
    borderRadius: 7,
})

globalStyle(`${strokePreview} svg`, {
    display: "block",
    width: "100%",
    height: 36,
})

export const sliderRow = style({
    display: "grid",
    gridTemplateColumns: "52px 1fr 38px",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    color: inkSoft,
})

globalStyle(`${sliderRow} input[type="range"]`, {
    width: "100%",
    accentColor: ink,
})

export const sliderValue = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 11,
    textAlign: "right",
    color: ink,
    fontVariantNumeric: "tabular-nums",
})

export const stickerRow = style({
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 6,
})

export const sticker = style({
    fontSize: 18,
    padding: "7px 0",
    background: "transparent",
    border: `1px solid ${hairline}`,
    borderRadius: 7,
    cursor: "pointer",
    transition: "background 120ms ease, border-color 120ms ease",
    ":hover": {
        background: "rgba(255, 255, 255, 0.06)",
    },
})

export const stickerActive = style([
    sticker,
    {
        borderColor: ink,
        background: "rgba(255, 255, 255, 0.08)",
    },
])

export const swatchGrid = style({
    display: "grid",
    gridTemplateColumns: "repeat(8, 1fr)",
    gap: 6,
})

export const swatch = style({
    aspectRatio: "1",
    width: "100%",
    border: "1px solid rgba(255, 255, 255, 0.14)",
    borderRadius: 6,
    cursor: "pointer",
    padding: 0,
})

export const swatchActive = style([
    swatch,
    {
        outline: `2px solid ${ink}`,
        outlineOffset: 2,
    },
])

export const colorRow = style({
    display: "flex",
    alignItems: "center",
    gap: 10,
    paddingTop: 2,
})

export const currentColor = style({
    width: 28,
    height: 28,
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: 7,
    flex: "none",
})

export const colorPicker = style({
    width: 40,
    height: 28,
    padding: 1,
    border: `1px solid ${hairlineStrong}`,
    borderRadius: 7,
    background: "transparent",
    cursor: "pointer",
})

export const colorHint = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 10,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: inkFaint,
})

export const statusBar = style({
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 10,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: inkFaint,
})
