import { globalStyle, keyframes, style } from "@vanilla-extract/css"
import { packBrand } from "@base/design-system/theme"

const cream = "#fff6e6"
const parchment = "#f8ead0"
const amber = "#f0b45c"
const amberDeep = "#c97f2a"
const teal = packBrand?.accent ?? "#2f8f83"
const tealDeep = "#1f6f66"
const ink = "#4a3826"
const rose = "#e2635a"

/** Full-viewport wrapper (owns the warm evening-sky background). */
export const page = style({
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    fontFamily: '"Nunito", sans-serif',
    background: "linear-gradient(180deg, #f3d9a4 0%, #eec489 55%, #dfa967 100%)",
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
    width: "min(1180px, 100%)",
    height: "min(860px, 100%)",
    background: cream,
    border: `3px solid ${ink}`,
    borderRadius: 18,
    boxShadow: "inset 0 2px 0 rgba(255, 255, 255, 0.7), 0 14px 30px rgba(74, 56, 38, 0.35)",
    overflow: "hidden",
})

export const titleBar = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 14px",
    borderBottom: `3px solid ${ink}`,
    background: amber,
    fontWeight: 800,
    fontSize: 16,
})

export const titleControls = style({
    display: "flex",
    gap: 6,
})

export const titleBtn = style({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 20,
    height: 20,
    border: `2px solid ${ink}`,
    borderRadius: 6,
    background: cream,
    fontSize: 10,
    fontWeight: 800,
})

export const toolbar = style({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    borderBottom: `3px solid ${ink}`,
    background: parchment,
})

export const toolbarSpacer = style({
    flex: 1,
})

export const chunky = style({
    font: "inherit",
    fontWeight: 800,
    fontSize: 13,
    padding: "7px 16px",
    color: ink,
    background: cream,
    border: `2px solid ${ink}`,
    borderRadius: 10,
    boxShadow: `2px 2px 0 ${ink}`,
    cursor: "pointer",
    ":active": {
        boxShadow: "none",
        transform: "translate(2px, 2px)",
    },
    ":disabled": {
        opacity: 0.55,
        cursor: "default",
    },
})

export const chunkyLit = style([
    chunky,
    {
        boxShadow: "none",
        transform: "translate(2px, 2px)",
        background: "#d9f2e5",
    },
])

export const payBadge = style({
    padding: "7px 14px",
    border: `2px solid ${ink}`,
    borderRadius: 10,
    background: tealDeep,
    color: "#eafff6",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.05em",
})

export const houseWrap = style({
    position: "relative",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: 12,
    minHeight: 0,
})

const bannerPulse = keyframes({
    "0%, 100%": { transform: "translateX(-50%) scale(1)" },
    "50%": { transform: "translateX(-50%) scale(1.05)" },
})

export const uhOhBanner = style({
    position: "absolute",
    top: 18,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 4,
    padding: "6px 22px",
    border: `3px solid ${ink}`,
    borderRadius: 12,
    background: rose,
    color: "#fff6e6",
    fontSize: 15,
    fontWeight: 800,
    letterSpacing: "0.04em",
    boxShadow: `3px 3px 0 ${ink}`,
    animation: `${bannerPulse} 0.6s ease-in-out infinite`,
})

export const houseGrid = style({
    flex: 1,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "1fr 1fr",
    gap: 12,
    minHeight: 0,
})

export const room = style({
    position: "relative",
    border: `3px solid ${ink}`,
    borderRadius: 16,
    background: parchment,
    boxShadow: "inset 0 3px 0 rgba(255, 255, 255, 0.65), inset 0 -6px 12px rgba(201, 127, 42, 0.14)",
    overflow: "hidden",
})

export const roomFlooded = style([
    room,
    {
        background: "linear-gradient(180deg, #cfeef6 0%, #a5dcef 100%)",
        boxShadow: "inset 0 0 24px rgba(47, 143, 131, 0.5)",
    },
])

export const roomLabel = style({
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    margin: 8,
    padding: "3px 12px",
    border: `2px solid ${ink}`,
    borderRadius: 999,
    background: amber,
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.03em",
})

export const furniture = style({
    position: "absolute",
    transform: "translate(-50%, -50%)",
    fontSize: 26,
    opacity: 0.55,
    pointerEvents: "none",
})

const kidHopIn = keyframes({
    "0%": { transform: "translateY(-16px) scale(0.7)", opacity: 0 },
    "55%": { transform: "translateY(3px) scale(1.06)", opacity: 1 },
    "100%": { transform: "translateY(0) scale(1)", opacity: 1 },
})

export const kid = style({
    position: "absolute",
    transform: "translate(-50%, -50%)",
    fontSize: 30,
    pointerEvents: "none",
    filter: "drop-shadow(0 3px 2px rgba(74, 56, 38, 0.3))",
})

export const kidHop = style({
    display: "inline-block",
    animation: `${kidHopIn} 0.5s ease-out`,
})

const wobble = keyframes({
    "0%, 100%": { transform: "rotate(-5deg)" },
    "50%": { transform: "rotate(5deg)" },
})

/** Round badge — the severity ring is a conic-gradient set inline (dynamic). */
export const mishap = style({
    position: "absolute",
    transform: "translate(-50%, -50%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 52,
    height: 52,
    padding: 0,
    border: "none",
    borderRadius: "50%",
    cursor: "pointer",
    boxShadow: "0 3px 6px rgba(74, 56, 38, 0.35)",
})

const messPulse = keyframes({
    "0%, 100%": { boxShadow: `0 0 0 0 rgba(226, 99, 90, 0.6)` },
    "50%": { boxShadow: `0 0 0 9px rgba(226, 99, 90, 0)` },
})

export const mishapMess = style([
    mishap,
    {
        background: rose,
        animation: `${messPulse} 0.9s ease-in-out infinite`,
    },
])

export const mishapInner = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: 42,
    height: 42,
    borderRadius: "50%",
    background: cream,
    border: `2px solid ${ink}`,
    fontSize: 20,
    lineHeight: 1,
    animation: `${wobble} 0.5s ease-in-out infinite`,
})

export const mishapPips = style({
    fontSize: 6,
    letterSpacing: 2,
    color: amberDeep,
})

export const floodMark = style({
    position: "absolute",
    left: "50%",
    top: "52%",
    transform: "translate(-50%, -50%)",
    fontSize: 54,
    opacity: 0.8,
    pointerEvents: "none",
})

const splash = keyframes({
    "0%, 100%": { transform: "translate(-50%, -50%) scale(1)" },
    "50%": { transform: "translate(-50%, -50%) scale(1.15)" },
})

export const overflowBadge = style({
    position: "absolute",
    left: "50%",
    top: "55%",
    transform: "translate(-50%, -50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    padding: "10px 16px",
    border: `3px solid ${ink}`,
    borderRadius: 16,
    background: "#bfe8f4",
    fontSize: 30,
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: `3px 3px 0 ${ink}`,
    animation: `${splash} 0.4s ease-in-out infinite`,
})

export const overflowCount = style({
    fontSize: 13,
    fontFamily: '"Nunito", sans-serif',
    color: ink,
})

export const toolTray = style({
    display: "flex",
    justifyContent: "center",
    gap: 10,
    padding: "10px 14px",
    borderTop: `3px solid ${ink}`,
    background: parchment,
})

export const toolBtn = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    width: 82,
    padding: "7px 0 5px",
    font: "inherit",
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: "0.05em",
    color: ink,
    background: cream,
    border: `2px solid ${ink}`,
    borderRadius: 12,
    boxShadow: `2px 2px 0 ${ink}`,
    cursor: "pointer",
    ":active": {
        boxShadow: "none",
        transform: "translate(2px, 2px)",
    },
})

export const toolBtnActive = style([
    toolBtn,
    {
        boxShadow: "none",
        transform: "translate(2px, 2px)",
        background: teal,
        color: "#eafff6",
    },
])

export const toolEmoji = style({
    fontSize: 22,
    lineHeight: 1,
})

export const overlay = style({
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(74, 56, 38, 0.45)",
    zIndex: 5,
})

export const overlayCard = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    width: "min(430px, 90%)",
    padding: "26px 30px",
    border: `3px solid ${ink}`,
    borderRadius: 20,
    background: cream,
    boxShadow: `6px 6px 0 ${ink}`,
    textAlign: "center",
})

export const overlayTitle = style({
    margin: 0,
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: "0.03em",
})

export const overlayText = style({
    margin: 0,
    fontSize: 14,
    fontWeight: 600,
    opacity: 0.85,
})

export const parentsRow = style({
    fontSize: 34,
    letterSpacing: 6,
})

export const stars = style({
    fontSize: 34,
    letterSpacing: 4,
    color: amberDeep,
})

export const ratingStats = style({
    display: "flex",
    gap: 18,
    fontSize: 13,
    fontWeight: 700,
})

export const paycheck = style({
    padding: "6px 20px",
    border: `2px solid ${ink}`,
    borderRadius: 10,
    background: tealDeep,
    color: "#eafff6",
    fontSize: 20,
    fontWeight: 800,
    letterSpacing: "0.04em",
})

export const statusBar = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "7px 14px",
    borderTop: `3px solid ${ink}`,
    background: ink,
    color: "#ffe9bd",
    fontFamily: '"IBM Plex Mono", monospace',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.05em",
})

export const statusMiddle = style({
    flex: 1,
    textAlign: "center",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
})

export const countdown = style({
    color: amber,
})

export const countdownUrgent = style([
    countdown,
    {
        color: rose,
        textShadow: "0 0 6px rgba(226, 99, 90, 0.8)",
    },
])
