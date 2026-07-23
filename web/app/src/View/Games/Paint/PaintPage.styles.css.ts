import { globalStyle, style } from "@vanilla-extract/css"
import { packBrand } from "@base/design-system/theme"

const bg = "#b8b2c7"
const frame = "#efece4"
const frameDark = "#d8d4c8"
const ink = "#1d1a26"
const ridge = "#8f8aa0"
const accent = packBrand?.accentSoft ?? "#c7bfe8"
const paper = "#fffdf7"

/** Full-viewport desktop wrapper (owns the dotted retro backdrop). */
export const page = style({
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    fontFamily: '"Nunito", system-ui, sans-serif',
    background: bg,
    backgroundImage: "radial-gradient(circle, rgba(255, 255, 255, 0.14) 1px, transparent 1px)",
    backgroundSize: "8px 8px",
    color: ink,
    userSelect: "none",
    boxSizing: "border-box",
})

globalStyle(`${page} *`, {
    boxSizing: "border-box",
})

export const window = style({
    display: "flex",
    flexDirection: "column",
    width: "min(1240px, 100%)",
    height: "min(860px, 100%)",
    background: frame,
    border: `2px solid ${ink}`,
    borderRadius: 10,
    boxShadow: "6px 6px 0 rgba(29, 26, 38, 0.45)",
    overflow: "hidden",
})

// Title bar with retro pinstripes
export const titleBar = style({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "7px 12px",
    background: frame,
    borderBottom: `2px solid ${ink}`,
})

export const titleBarBox = style({
    width: 14,
    height: 14,
    border: `2px solid ${ink}`,
    background: frame,
    flex: "none",
})

export const titleBarLines = style({
    flex: 1,
    height: 12,
    background: `repeating-linear-gradient(to bottom, ${ink} 0, ${ink} 1px, transparent 1px, transparent 4px)`,
})

export const titleText = style({
    fontWeight: 800,
    fontSize: 15,
    padding: "0 8px",
    whiteSpace: "nowrap",
})

// Top toolbar
export const toolbar = style({
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderBottom: `2px solid ${ink}`,
    background: frameDark,
})

export const toolbarDivider = style({
    width: 2,
    height: 22,
    background: ridge,
    margin: "0 4px",
})

export const chunky = style({
    font: "inherit",
    fontWeight: 700,
    fontSize: 13,
    padding: "5px 14px",
    color: ink,
    background: frame,
    border: `2px solid ${ink}`,
    borderRadius: 7,
    boxShadow: `2px 2px 0 ${ink}`,
    cursor: "pointer",
    selectors: {
        "&:active:not(:disabled)": {
            background: accent,
            boxShadow: "none",
            transform: "translate(2px, 2px)",
        },
        "&:disabled": {
            opacity: 0.4,
            cursor: "default",
        },
    },
})

export const chunkyActive = style([
    chunky,
    {
        background: accent,
        boxShadow: "none",
        transform: "translate(2px, 2px)",
    },
])

// Main workspace: tools | canvas | settings
export const workspace = style({
    flex: 1,
    display: "flex",
    minHeight: 0,
})

export const toolPalette = style({
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: "10px 8px",
    borderRight: `2px solid ${ink}`,
    background: frame,
    overflowY: "auto",
})

export const tool = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    width: 66,
    padding: "7px 4px",
    font: "inherit",
    color: ink,
    background: frame,
    border: `2px solid ${ink}`,
    borderRadius: 8,
    cursor: "pointer",
})

export const toolActive = style([
    tool,
    {
        background: accent,
        boxShadow: "inset 2px 2px 0 rgba(29, 26, 38, 0.3)",
    },
])

export const toolGlyph = style({
    fontSize: 20,
    lineHeight: 1,
})

export const toolLabel = style({
    fontSize: 11,
    fontWeight: 700,
})

export const canvasArea = style({
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    background: frameDark,
    minWidth: 0,
})

export const canvasStack = style({
    position: "relative",
    width: "100%",
    maxWidth: "100%",
    aspectRatio: "960 / 640",
    maxHeight: "100%",
    border: `2px solid ${ink}`,
    background: paper,
    boxShadow: "4px 4px 0 rgba(29, 26, 38, 0.35)",
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

// Right panel
export const sidePanel = style({
    width: 210,
    flex: "none",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    padding: "12px 10px",
    borderLeft: `2px solid ${ink}`,
    background: frame,
    overflowY: "auto",
})

export const panelSection = style({
    border: `2px solid ${ink}`,
    borderRadius: 8,
    padding: 10,
    background: frameDark,
})

export const panelHeading = style({
    fontSize: 12,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    marginBottom: 8,
})

export const strokePreview = style({
    background: paper,
    border: `2px solid ${ink}`,
    borderRadius: 6,
    marginBottom: 10,
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
    gap: 6,
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 6,
})

globalStyle(`${sliderRow} input[type="range"]`, {
    width: "100%",
    accentColor: ink,
})

export const sliderValue = style({
    textAlign: "right",
    fontVariantNumeric: "tabular-nums",
})

export const stickerRow = style({
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 6,
})

export const sticker = style({
    fontSize: 18,
    padding: "5px 0",
    background: paper,
    border: `2px solid ${ink}`,
    borderRadius: 7,
    cursor: "pointer",
})

export const stickerActive = style([
    sticker,
    {
        background: accent,
    },
])

// Bottom color palette
export const paletteBar = style({
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "8px 12px",
    borderTop: `2px solid ${ink}`,
    background: frame,
})

export const currentColor = style({
    width: 38,
    height: 38,
    border: `2px solid ${ink}`,
    borderRadius: 7,
    flex: "none",
})

export const swatchGrid = style({
    display: "flex",
    flexDirection: "column",
    gap: 4,
})

export const swatchRow = style({
    display: "flex",
    gap: 4,
})

export const swatch = style({
    width: 22,
    height: 16,
    border: `2px solid ${ink}`,
    borderRadius: 4,
    cursor: "pointer",
    padding: 0,
})

export const swatchActive = style([
    swatch,
    {
        outline: `2px solid ${ink}`,
        outlineOffset: 1,
    },
])

export const colorPicker = style({
    width: 40,
    height: 38,
    padding: 2,
    border: `2px solid ${ink}`,
    borderRadius: 7,
    background: paper,
    cursor: "pointer",
})

// Status bar
export const statusBar = style({
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: "5px 12px",
    fontSize: 12,
    fontWeight: 700,
    borderTop: `2px solid ${ink}`,
    background: frameDark,
})
