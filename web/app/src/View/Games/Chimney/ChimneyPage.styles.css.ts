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

// Width capped by viewport height so the street plus chrome never scrolls:
// street width = (available height) * (720 / 420), plus the side rail.
export const frame = style({
    display: "flex",
    flexDirection: "column",
    width: "min(1160px, 100%, calc((100vh - 176px) * (720 / 420) + 298px))",
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

export const body = style({
    display: "flex",
    gap: 18,
    minHeight: 0,
})

export const streetArea = style({
    flex: 1,
    minWidth: 0,
})

export const viewport = style({
    position: "relative",
    width: "100%",
    aspectRatio: "720 / 420",
    background: surface,
    border: `1px solid ${hairline}`,
    borderRadius: 12,
    overflow: "hidden",
})

export const street = style({
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    display: "block",
    cursor: "pointer",
})

export const rail = style({
    width: 280,
    flex: "none",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    minHeight: 0,
})

export const panel = style({
    display: "flex",
    flexDirection: "column",
    gap: 12,
    padding: "16px 18px",
    background: surface,
    border: `1px solid ${hairline}`,
    borderRadius: 10,
})

export const panelLabel = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 10,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: inkFaint,
})

export const statGrid = style({
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
})

export const stat = style({
    display: "flex",
    flexDirection: "column",
    gap: 4,
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
    fontSize: 20,
    color: ink,
    fontVariantNumeric: "tabular-nums",
})

export const statValueSoft = style([statValue, { color: inkSoft, fontSize: 16 }])

export const controlsList = style({
    display: "flex",
    flexDirection: "column",
    gap: 8,
    fontFamily: mono,
    fontSize: 12,
    color: inkSoft,
})

globalStyle(`${controlsList} > div`, {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
})

globalStyle(`${controlsList} span:last-child`, {
    color: inkFaint,
})

export const copy = style({
    margin: 0,
    fontSize: 12,
    lineHeight: 1.6,
    color: inkSoft,
})

export const modal = style({
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    background: "rgba(10, 10, 10, 0.84)",
    backdropFilter: "blur(2px)",
    textAlign: "center",
    padding: 24,
    zIndex: 2,
})

export const modalTitle = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 24,
    letterSpacing: "0.3em",
    textTransform: "uppercase",
    color: ink,
})

export const modalLine = style({
    fontSize: 13,
    color: inkSoft,
    maxWidth: 420,
    lineHeight: 1.6,
})

export const modalScore = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: inkSoft,
})

export const modalRecord = style([
    modalScore,
    {
        color: ink,
    },
])

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
