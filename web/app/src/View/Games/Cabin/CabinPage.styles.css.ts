import { globalStyle, keyframes, style } from "@vanilla-extract/css"
import { packBrand } from "@base/design-system/theme"

const sky = "#8ecdf3"
const skyDeep = "#4f9fd9"
const fuselage = "#f2f8fd"
const fuselageDark = "#dcebf7"
const ink = "#1b3a57"
const brand = packBrand?.accent ?? "#1f6fb2"
const sun = "#ffd166"
const good = "#2e9e5b"
const warn = "#e8912d"
const bad = "#d64550"
const nightPanel = "#12283a"
const nightText = "#9fdcff"

/** Full-viewport wrapper (owns the open-sky background). */
export const page = style({
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    fontFamily: '"IBM Plex Mono", monospace',
    background: `linear-gradient(180deg, ${skyDeep} 0%, ${sky} 55%, #d9eefb 100%)`,
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
    width: "min(1150px, 100%)",
    height: "min(860px, 100%)",
    background: fuselage,
    border: `2px solid ${ink}`,
    borderRadius: 18,
    boxShadow: "inset 0 2px 0 rgba(255, 255, 255, 0.7), 6px 8px 0 rgba(27, 58, 87, 0.35)",
    overflow: "hidden",
})

export const titleBar = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "7px 12px",
    borderBottom: `2px solid ${ink}`,
    background: fuselageDark,
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
    background: fuselage,
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
    padding: "6px 14px",
    color: ink,
    background: fuselage,
    border: `2px solid ${ink}`,
    borderRadius: 8,
    boxShadow: `2px 2px 0 ${ink}`,
    cursor: "pointer",
    ":active": {
        boxShadow: "none",
        transform: "translate(2px, 2px)",
    },
    ":disabled": {
        opacity: 0.5,
        cursor: "default",
    },
})

export const chunkyLit = style([
    chunky,
    {
        boxShadow: "none",
        transform: "translate(2px, 2px)",
        background: "#d8f0ff",
    },
])

export const bestBadge = style({
    padding: "6px 14px",
    border: `2px solid ${ink}`,
    borderRadius: 8,
    background: nightPanel,
    color: sun,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.06em",
})

export const progressRow = style({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 14px",
    borderBottom: `2px solid ${ink}`,
    background: fuselageDark,
    fontSize: 16,
})

export const progressTrack = style({
    position: "relative",
    flex: 1,
    height: 10,
    border: `2px solid ${ink}`,
    borderRadius: 999,
    background: fuselage,
})

export const progressFill = style({
    height: "100%",
    borderRadius: 999,
    background: `linear-gradient(90deg, ${brand}, ${skyDeep})`,
})

export const progressPlane = style({
    position: "absolute",
    top: -13,
    transform: "translateX(-50%)",
    fontSize: 18,
    pointerEvents: "none",
})

export const sceneWrap = style({
    position: "relative",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: 12,
    minHeight: 0,
    overflow: "hidden",
})

export const windowsRow = style({
    display: "flex",
    gap: 10,
    justifyContent: "center",
})

export const windowPane = style({
    position: "relative",
    width: 64,
    height: 34,
    border: `2px solid ${ink}`,
    borderRadius: 16,
    background: `linear-gradient(180deg, ${skyDeep}, ${sky})`,
    overflow: "hidden",
    flex: "none",
})

const drift = keyframes({
    from: { transform: "translateX(70px)" },
    to: { transform: "translateX(-46px)" },
})

export const cloud = style({
    position: "absolute",
    top: 4,
    left: 0,
    fontSize: 15,
    animation: `${drift} 7s linear infinite`,
})

export const cabin = style({
    position: "relative",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-evenly",
    gap: 6,
    padding: "12px 18px",
    border: `2px solid ${ink}`,
    borderRadius: 22,
    background: fuselageDark,
    minHeight: 0,
})

export const cabinRow = style({
    display: "grid",
    gridTemplateColumns: "1fr 1fr 52px 1fr 1fr",
    gap: 8,
    alignItems: "stretch",
    minHeight: 0,
})

export const aisle = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 700,
    opacity: 0.45,
})

export const seat = style({
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    padding: "6px 4px 5px",
    border: `2px solid ${ink}`,
    borderRadius: 12,
    background: fuselage,
    boxShadow: "inset 0 -4px 0 rgba(31, 111, 178, 0.18)",
    cursor: "pointer",
    minHeight: 0,
})

export const seatEmpty = style([
    seat,
    {
        borderStyle: "dashed",
        opacity: 0.55,
        cursor: "default",
        boxShadow: "none",
    },
])

const popIn = keyframes({
    "0%": { transform: "scale(0)" },
    "70%": { transform: "scale(1.25)" },
    "100%": { transform: "scale(1)" },
})

export const passengerFace = style({
    fontSize: 24,
    lineHeight: 1,
    animation: `${popIn} 0.3s ease-out`,
})

export const roleBadge = style({
    position: "absolute",
    top: -8,
    right: -6,
    fontSize: 13,
    filter: "drop-shadow(0 1px 1px rgba(27, 58, 87, 0.5))",
})

export const happinessTrack = style({
    width: "72%",
    height: 4,
    borderRadius: 999,
    background: "rgba(27, 58, 87, 0.2)",
    overflow: "hidden",
})

export const happinessFill = style({
    height: "100%",
    borderRadius: 999,
})

export const bubble = style({
    position: "absolute",
    top: -14,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 2,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    padding: "3px 7px",
    border: `2px solid ${ink}`,
    borderRadius: "10px 10px 10px 2px",
    background: "#ffffff",
    animation: `${popIn} 0.25s ease-out`,
    pointerEvents: "none",
})

export const bubbleEmoji = style({
    fontSize: 16,
    lineHeight: 1,
})

export const patienceTrack = style({
    width: 34,
    height: 4,
    borderRadius: 999,
    background: "rgba(27, 58, 87, 0.2)",
    overflow: "hidden",
})

export const patienceFill = style({
    height: "100%",
    borderRadius: 999,
})

export const chatRing = style({
    position: "absolute",
    top: -9,
    left: -7,
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 22,
    height: 22,
    border: `2px solid ${ink}`,
    borderRadius: "50%",
    fontSize: 10,
    pointerEvents: "none",
})

const wobble = keyframes({
    "0%": { transform: "translateX(-50%) rotate(0deg) scale(1)" },
    "25%": { transform: "translateX(-58%) rotate(-14deg) scale(1.15)" },
    "60%": { transform: "translateX(-42%) rotate(12deg) scale(1.1)" },
    "100%": { transform: "translateX(-50%) rotate(0deg) scale(1)" },
})

export const runner = style({
    position: "absolute",
    left: "50%",
    zIndex: 3,
    padding: 2,
    border: "none",
    background: "transparent",
    fontSize: 28,
    lineHeight: 1,
    cursor: "pointer",
    transition: "top 0.55s ease-in-out",
    animation: `${wobble} 0.4s ease-out`,
    filter: "drop-shadow(0 2px 2px rgba(27, 58, 87, 0.45))",
})

const slideDown = keyframes({
    from: { transform: "translate(-50%, -130%)" },
    to: { transform: "translate(-50%, 0)" },
})

export const intercomBanner = style({
    position: "absolute",
    top: 60,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 5,
    maxWidth: "85%",
    padding: "8px 18px",
    border: `2px solid ${ink}`,
    borderRadius: 10,
    background: brand,
    color: "#f2f8fd",
    fontSize: 13,
    fontWeight: 700,
    boxShadow: `3px 3px 0 ${ink}`,
    animation: `${slideDown} 0.3s ease-out`,
})

export const paparazziFlash = style({
    position: "absolute",
    inset: 0,
    zIndex: 6,
    background: "#ffffff",
    pointerEvents: "none",
})

export const cookieGlow = style({
    position: "absolute",
    inset: 0,
    zIndex: 6,
    background: "radial-gradient(circle, rgba(255, 209, 102, 0.55) 0%, transparent 70%)",
    pointerEvents: "none",
})

export const overlay = style({
    position: "absolute",
    inset: 0,
    zIndex: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(27, 58, 87, 0.45)",
})

export const overlayCard = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    maxWidth: 420,
    padding: "22px 30px",
    border: `2px solid ${ink}`,
    borderRadius: 16,
    background: fuselage,
    boxShadow: `5px 5px 0 ${ink}`,
    textAlign: "center",
})

export const overlayTitle = style({
    fontSize: 22,
    fontWeight: 700,
})

export const stars = style({
    fontSize: 30,
    letterSpacing: "0.1em",
    color: sun,
    textShadow: `0 1px 0 ${ink}`,
})

export const overlayStats = style({
    margin: 0,
    display: "flex",
    gap: 18,
    fontSize: 13,
})

globalStyle(`${overlayStats} > div`, {
    display: "flex",
    flexDirection: "column",
    gap: 2,
})

globalStyle(`${overlayStats} dt`, {
    fontWeight: 600,
    opacity: 0.7,
    fontSize: 11,
})

globalStyle(`${overlayStats} dd`, {
    margin: 0,
    fontWeight: 700,
    fontSize: 16,
})

export const muted = style({
    fontSize: 12,
    opacity: 0.75,
    margin: 0,
})

export const galley = style({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 12px",
    borderTop: `2px solid ${ink}`,
    background: fuselageDark,
})

export const galleyLabel = style({
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    opacity: 0.7,
})

export const trayItem = style({
    font: "inherit",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    padding: "5px 12px",
    fontSize: 10,
    fontWeight: 700,
    color: ink,
    background: fuselage,
    border: `2px solid ${ink}`,
    borderRadius: 10,
    boxShadow: `2px 2px 0 ${ink}`,
    cursor: "pointer",
    ":active": {
        boxShadow: "none",
        transform: "translate(2px, 2px)",
    },
    ":disabled": {
        opacity: 0.5,
        cursor: "default",
    },
})

export const trayItemHeld = style([
    trayItem,
    {
        boxShadow: "none",
        transform: "translate(2px, 2px)",
        background: "#fff3d6",
    },
])

export const trayEmoji = style({
    fontSize: 20,
    lineHeight: 1,
})

export const happinessMeter = style({
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 16,
})

export const meterTrack = style({
    width: 130,
    height: 12,
    border: `2px solid ${ink}`,
    borderRadius: 999,
    background: fuselage,
    overflow: "hidden",
})

export const meterFill = style({
    height: "100%",
    transition: "width 0.3s ease-out",
})

export const heldCursor = style({
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 9,
    fontSize: 22,
    pointerEvents: "none",
    filter: "drop-shadow(0 2px 2px rgba(27, 58, 87, 0.5))",
})

export const statusBar = style({
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 14px",
    borderTop: `2px solid ${ink}`,
    background: nightPanel,
    color: nightText,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.05em",
})

export const capitalize = style({
    textTransform: "capitalize",
})

/** Colors the page applies inline for truly dynamic values (bars, chat ring). */
export const dynamicColors = { good, warn, bad, brand, fuselage }
