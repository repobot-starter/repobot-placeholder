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

// Width is capped by the viewport height so the arena's aspect ratio always
// leaves room for the header, controls, and status bar without scrolling.
export const console = style({
    display: "flex",
    flexDirection: "column",
    width: "min(1060px, 100%, calc((100vh - 264px) * (800 / 560)))",
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
    fontWeight: 400,
    color: inkSoft,
    letterSpacing: "0.01em",
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
    transition: "background 120ms ease, border-color 120ms ease",
    ":hover": {
        background: "rgba(255, 255, 255, 0.06)",
    },
})

export const buttonPrimary = style([
    button,
    {
        background: ink,
        borderColor: ink,
        color: "#0a0a0a",
        ":hover": {
            background: "#d4d4d8",
        },
    },
])

export const buttonMuted = style([
    button,
    {
        color: inkFaint,
        borderColor: hairline,
    },
])

export const arena = style({
    position: "relative",
    width: "100%",
    aspectRatio: "800 / 560",
    minHeight: 0,
    background: surface,
    border: `1px solid ${hairline}`,
    borderRadius: 12,
    overflow: "hidden",
})

export const playfield = style({
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    display: "block",
})

export const controls = style({
    display: "flex",
    alignItems: "stretch",
    gap: 12,
})

export const group = style({
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: "14px 16px",
    background: surface,
    border: `1px solid ${hairline}`,
    borderRadius: 10,
})

export const groupGrow = style([group, { flex: 1 }])

export const groupLabel = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 10,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: inkFaint,
})

export const segmented = style({
    display: "flex",
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

export const speedRow = style({
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 180,
})

globalStyle(`${speedRow} input`, {
    flex: 1,
    accentColor: ink,
})

export const speedValue = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 12,
    color: inkSoft,
    minWidth: 40,
    textAlign: "right",
})

export const statsRow = style({
    display: "flex",
    alignItems: "center",
    gap: 24,
})

export const stat = style({
    display: "flex",
    flexDirection: "column",
    gap: 3,
})

export const statLabel = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 10,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: inkFaint,
})

export const statValue = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 14,
    color: ink,
})

export const statEmpty = style({
    fontSize: 12,
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
