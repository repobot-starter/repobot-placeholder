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

// Width capped by viewport height so the field plus chrome never scrolls.
export const console = style({
    display: "flex",
    flexDirection: "column",
    width: "min(1000px, 100%, calc((100vh - 250px) * (800 / 600)))",
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
    aspectRatio: "800 / 600",
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

export const hud = style({
    position: "absolute",
    top: 16,
    left: 20,
    right: 20,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    pointerEvents: "none",
    fontFamily: mono,
    fontWeight: 600,
})

export const hudScore = style({
    fontSize: 24,
    letterSpacing: "0.1em",
    color: ink,
    fontVariantNumeric: "tabular-nums",
})

export const hudMeta = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 4,
    fontSize: 10,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: inkFaint,
})

export const hudLives = style({
    display: "flex",
    gap: 6,
    color: ink,
    fontSize: 13,
    letterSpacing: 0,
})

export const overlay = style({
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    background: "rgba(10, 10, 10, 0.84)",
    backdropFilter: "blur(2px)",
})

export const overlayTitle = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 26,
    letterSpacing: "0.3em",
    textTransform: "uppercase",
    color: ink,
})

export const overlayText = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 12,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: inkSoft,
})

export const overlayHint = style({
    fontSize: 13,
    color: inkSoft,
    maxWidth: 380,
    textAlign: "center",
    lineHeight: 1.6,
})

// Touch controls: only surface on coarse pointers.
export const touchControls = style({
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    display: "none",
    justifyContent: "space-between",
    padding: 18,
    pointerEvents: "none",
    "@media": {
        "(pointer: coarse)": {
            display: "flex",
        },
    },
})

export const touchCluster = style({
    display: "flex",
    gap: 12,
    pointerEvents: "auto",
})

export const touchButton = style({
    width: 56,
    height: 56,
    borderRadius: "50%",
    border: `1px solid ${hairlineStrong}`,
    background: "rgba(10, 10, 10, 0.5)",
    color: ink,
    fontSize: 18,
    fontFamily: mono,
    cursor: "pointer",
    touchAction: "none",
    ":active": {
        background: "rgba(255, 255, 255, 0.16)",
    },
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
