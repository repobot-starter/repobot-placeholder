import { globalStyle, keyframes, style } from "@vanilla-extract/css"
import { packBrand } from "@base/design-system/theme"

const cream = "#fdf3e7"
const creamDeep = "#f3e2cb"
const mint = "#bfe8d6"
const mintDeep = "#7fcbb0"
const pink = "#f9cfe1"
const pinkDeep = "#ef9ec6"
const ink = "#4a3b45"
const accent = packBrand?.accent ?? "#c9578f"
const statusDark = "#3c2e38"

/** Full-viewport salon wrapper (owns the pastel checkered-floor background). */
export const page = style({
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    fontFamily: '"IBM Plex Mono", monospace',
    background: mintDeep,
    backgroundImage: "repeating-conic-gradient(rgba(255, 255, 255, 0.22) 0% 25%, transparent 0% 50%)",
    backgroundSize: "48px 48px",
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
    background: cream,
    border: `2px solid ${ink}`,
    borderRadius: 16,
    boxShadow: "inset 0 2px 0 rgba(255, 255, 255, 0.7), 6px 8px 0 rgba(74, 59, 69, 0.35)",
    overflow: "hidden",
})

export const titleBar = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "7px 12px",
    borderBottom: `2px solid ${ink}`,
    background: pink,
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
    background: cream,
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
    background: cream,
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
        background: mint,
    },
])

export const streakBadge = style({
    padding: "6px 14px",
    border: `2px solid ${ink}`,
    borderRadius: 6,
    background: statusDark,
    color: pink,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.06em",
})

export const layout = style({
    flex: 1,
    display: "flex",
    gap: 12,
    padding: 12,
    minHeight: 0,
})

export const panelColumn = style({
    width: 216,
    flex: "none",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    overflowY: "auto",
})

export const panel = style({
    border: `2px solid ${ink}`,
    borderRadius: 6,
    background: "#fffdf8",
    padding: "0 0 8px",
})

export const panelHeader = style({
    background: accent,
    color: "#fff5fa",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    padding: "4px 8px",
    marginBottom: 6,
})

export const requestRow = style({
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "3px 10px",
    fontSize: 13,
    fontWeight: 600,
})

export const colorChip = style({
    display: "inline-block",
    width: 14,
    height: 14,
    border: `2px solid ${ink}`,
    borderRadius: 4,
})

export const muted = style({
    fontSize: 12,
    margin: 0,
    padding: "2px 10px 6px",
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
    color: accent,
})

export const brandTag = style({
    fontSize: 10,
    marginTop: 4,
    color: ink,
    opacity: 0.75,
})

export const stage = style({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minWidth: 0,
    minHeight: 0,
})

/** Big rounded mirror: glass gradient on top, checkered floor hint below. */
const mirrorFrame = style({
    position: "relative",
    aspectRatio: "320 / 360",
    maxWidth: "100%",
    margin: 12,
    border: `3px solid ${ink}`,
    borderRadius: "150px 150px 20px 20px",
    background: `linear-gradient(180deg, #f2fbff 0%, #dff0f7 68%, transparent 68%), repeating-conic-gradient(${creamDeep} 0% 25%, #ffffff 0% 50%)`,
    backgroundSize: "100% 100%, 36px 36px",
    boxShadow: `0 0 0 8px ${pinkDeep}, 0 0 0 10px ${ink}`,
    overflow: "hidden",
})

export const stageMirror = style([
    mirrorFrame,
    {
        height: "calc(100% - 46px)",
        minHeight: 0,
    },
])

export const cutting = style({
    cursor: "crosshair",
})

export const revealRow = style({
    display: "flex",
    alignItems: "stretch",
    justifyContent: "center",
    gap: 18,
    flex: 1,
    minHeight: 0,
    width: "100%",
})

const flipIn = keyframes({
    "0%": { transform: "perspective(700px) rotateY(85deg)", opacity: 0 },
    "100%": { transform: "perspective(700px) rotateY(0deg)", opacity: 1 },
})

export const revealCard = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    minHeight: 0,
    animation: `${flipIn} 0.7s ease both`,
})

export const revealCardAfter = style([
    revealCard,
    {
        animationDelay: "0.35s",
    },
])

export const revealLabel = style({
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
})

export const revealMirror = style([
    mirrorFrame,
    {
        flex: 1,
        minHeight: 0,
    },
])

export const moodBubble = style({
    position: "relative",
    maxWidth: 520,
    padding: "10px 16px",
    border: `2px solid ${ink}`,
    borderRadius: 14,
    background: "#ffffff",
    fontSize: 14,
    fontWeight: 700,
    textAlign: "center",
    "::after": {
        content: "",
        position: "absolute",
        top: -12,
        left: "50%",
        marginLeft: -6,
        border: "6px solid transparent",
        borderBottomColor: ink,
    },
})

export const stageHint = style({
    fontSize: 11,
    fontWeight: 600,
    opacity: 0.7,
})

export const headSvg = style({
    display: "block",
    width: "100%",
    height: "100%",
})

export const stationRow = style({
    display: "flex",
    alignItems: "center",
    gap: 8,
    margin: "0 8px 4px",
    padding: "4px 8px",
    border: "2px solid transparent",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 700,
    opacity: 0.55,
})

export const stationRowActive = style([
    stationRow,
    {
        border: `2px solid ${ink}`,
        background: pink,
        opacity: 1,
    },
])

export const stationRowDone = style([
    stationRow,
    {
        color: accent,
        opacity: 1,
    },
])

export const stationState = style({
    marginLeft: "auto",
})

export const meterWrap = style({
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: "0 10px 6px",
})

export const meterTrack = style({
    height: 14,
    border: `2px solid ${ink}`,
    borderRadius: 8,
    background: "#ffffff",
    overflow: "hidden",
})

export const meterFill = style({
    height: "100%",
    background: `linear-gradient(90deg, #9fdcf2, ${mintDeep})`,
    transition: "width 0.2s ease",
})

export const meterLabel = style({
    fontSize: 11,
    fontWeight: 700,
})

export const optionGrid = style({
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 6,
    padding: "2px 10px 6px",
})

export const optionBtn = style({
    font: "inherit",
    fontSize: 12,
    fontWeight: 700,
    padding: "6px 6px",
    color: ink,
    background: "#ffffff",
    border: `2px solid ${ink}`,
    borderRadius: 6,
    boxShadow: `2px 2px 0 ${ink}`,
    cursor: "pointer",
    ":active": {
        boxShadow: "none",
        transform: "translate(2px, 2px)",
    },
})

export const optionBtnActive = style([
    optionBtn,
    {
        background: pink,
        boxShadow: "none",
        transform: "translate(2px, 2px)",
    },
])

export const swatchGrid = style({
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 8,
    padding: "2px 10px 6px",
})

export const swatchBtn = style({
    width: "100%",
    aspectRatio: "1",
    border: `2px solid ${ink}`,
    borderRadius: 8,
    boxShadow: `2px 2px 0 ${ink}`,
    cursor: "pointer",
    ":active": {
        boxShadow: "none",
        transform: "translate(2px, 2px)",
    },
})

export const swatchBtnActive = style([
    swatchBtn,
    {
        boxShadow: "none",
        transform: "translate(2px, 2px)",
        outline: `2px solid ${accent}`,
        outlineOffset: 2,
    },
])

export const spritzBtn = style([
    optionBtn,
    {
        display: "block",
        width: "calc(100% - 20px)",
        margin: "4px 10px 0",
        background: mint,
    },
])

export const nextBtn = style([
    optionBtn,
    {
        display: "block",
        width: "calc(100% - 20px)",
        margin: "8px 10px 2px",
        fontSize: 13,
        background: mint,
        ":disabled": {
            opacity: 0.45,
            cursor: "not-allowed",
        },
    },
])

export const statusBar = style({
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: "6px 14px",
    borderTop: `2px solid ${ink}`,
    background: statusDark,
    color: pink,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.05em",
})

const shimmerPulse = keyframes({
    "0%": { filter: "brightness(1)" },
    "45%": { filter: "brightness(1.6) saturate(1.5)" },
    "100%": { filter: "brightness(1)" },
})

/** Applied to the SVG hair groups while fresh dye settles in. */
export const hairShimmer = style({
    animation: `${shimmerPulse} 0.7s ease`,
})

const twinkle = keyframes({
    "0%": { opacity: 0, transform: "scale(0.4)" },
    "40%": { opacity: 1, transform: "scale(1.2)" },
    "100%": { opacity: 0, transform: "scale(0.6)" },
})

export const sparkleStar = style({
    animation: `${twinkle} 1.1s ease both`,
    transformBox: "fill-box",
    transformOrigin: "center",
})

const bob = keyframes({
    "0%": { transform: "translateY(0)" },
    "50%": { transform: "translateY(-3px)" },
    "100%": { transform: "translateY(0)" },
})

export const bubble = style({
    animation: `${bob} 1.6s ease-in-out infinite`,
    transformBox: "fill-box",
    cursor: "pointer",
})

export const stray = style({
    cursor: "pointer",
})

const strayFall = keyframes({
    "0%": { transform: "translateY(0) rotate(0deg)", opacity: 1 },
    "100%": { transform: "translateY(48px) rotate(28deg)", opacity: 0 },
})

export const straySnipped = style({
    animation: `${strayFall} 0.5s ease both`,
    transformBox: "fill-box",
    pointerEvents: "none",
})

const wiggle = keyframes({
    "0%": { transform: "rotate(-10deg)" },
    "50%": { transform: "rotate(12deg)" },
    "100%": { transform: "rotate(-10deg)" },
})

export const strayScissors = style({
    animation: `${wiggle} 0.8s ease-in-out infinite`,
    transformBox: "fill-box",
    transformOrigin: "center",
})
