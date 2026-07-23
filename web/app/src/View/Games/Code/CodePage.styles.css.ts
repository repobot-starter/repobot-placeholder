import { globalStyle, keyframes, style } from "@vanilla-extract/css"
import { packBrand } from "@base/design-system/theme"

// Blueprint tech-lab palette: deep navy panels ruled with glowing cyan lines,
// chunky candy-colored command blocks, monospace labels everywhere.
const navyDeep = "#060b1e"
const navy = "#0c1631"
const navyPanel = "#101d40"
const line = "rgba(87, 230, 255, 0.35)"
const lineSoft = "rgba(87, 230, 255, 0.12)"
const cyan = packBrand?.accentDark ?? "#57e6ff"
const text = "#d7e8ff"
const textDim = "rgba(215, 232, 255, 0.55)"
const green = "#34d873"
const greenDark = "#157a3f"
const orange = "#ffa64d"
const orangeDark = "#b05e14"
const purple = "#a78bfa"
const purpleDark = "#5b3fae"
const gold = "#ffd166"

/** Full-viewport wrapper (owns the blueprint-grid lab background). */
export const page = style({
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    fontFamily: '"IBM Plex Mono", monospace',
    background: navyDeep,
    backgroundImage: `linear-gradient(${lineSoft} 1px, transparent 1px), linear-gradient(90deg, ${lineSoft} 1px, transparent 1px)`,
    backgroundSize: "28px 28px",
    color: text,
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
    height: "min(860px, 100%)",
    background: navy,
    border: `2px solid ${cyan}`,
    borderRadius: 14,
    boxShadow: `0 0 24px rgba(87, 230, 255, 0.25), inset 0 0 60px rgba(6, 11, 30, 0.9)`,
    overflow: "hidden",
})

export const titleBar = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 14px",
    borderBottom: `2px solid ${line}`,
    background: navyPanel,
    fontWeight: 700,
    fontSize: 15,
    letterSpacing: "0.04em",
})

export const titleControls = style({
    display: "flex",
    gap: 6,
})

export const titleBtn = style({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 18,
    height: 18,
    border: `2px solid ${line}`,
    borderRadius: 4,
    background: navy,
    color: cyan,
    fontSize: 10,
    fontWeight: 700,
})

export const toolbar = style({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 12px",
    borderBottom: `2px solid ${line}`,
})

export const toolbarSpacer = style({
    flex: 1,
})

export const chunky = style({
    font: "inherit",
    fontWeight: 700,
    fontSize: 13,
    padding: "6px 16px",
    color: text,
    background: navyPanel,
    border: `2px solid ${cyan}`,
    borderRadius: 8,
    boxShadow: `2px 2px 0 rgba(87, 230, 255, 0.5)`,
    cursor: "pointer",
    ":active": {
        boxShadow: "none",
        transform: "translate(2px, 2px)",
    },
    ":disabled": {
        opacity: 0.4,
        cursor: "default",
        boxShadow: `2px 2px 0 rgba(87, 230, 255, 0.5)`,
        transform: "none",
    },
})

export const chunkyLit = style([
    chunky,
    {
        boxShadow: "none",
        transform: "translate(2px, 2px)",
        background: "rgba(87, 230, 255, 0.2)",
    },
])

export const chunkyRun = style([
    chunky,
    {
        background: greenDark,
        borderColor: green,
        boxShadow: `2px 2px 0 rgba(52, 216, 115, 0.5)`,
        ":disabled": {
            boxShadow: `2px 2px 0 rgba(52, 216, 115, 0.5)`,
        },
    },
])

export const runBadge = style({
    padding: "6px 14px",
    border: `2px solid ${line}`,
    borderRadius: 8,
    background: navyDeep,
    color: textDim,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.06em",
})

export const runBadgeOn = style([
    runBadge,
    {
        color: green,
        textShadow: "0 0 6px rgba(52, 216, 115, 0.8)",
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
    width: 210,
    flex: "none",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    overflowY: "auto",
})

export const panel = style({
    border: `2px solid ${line}`,
    borderRadius: 8,
    background: navyPanel,
    padding: "0 0 8px",
})

export const panelHeader = style({
    background: "rgba(87, 230, 255, 0.15)",
    color: cyan,
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    padding: "4px 8px",
    marginBottom: 6,
})

export const levelRow = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    font: "inherit",
    fontSize: 12,
    fontWeight: 600,
    color: text,
    background: "transparent",
    border: "none",
    padding: "4px 10px",
    cursor: "pointer",
    textAlign: "left",
    ":hover": {
        background: "rgba(87, 230, 255, 0.1)",
    },
})

export const levelRowActive = style([
    levelRow,
    {
        background: "rgba(87, 230, 255, 0.2)",
        color: cyan,
    },
])

export const levelRowLocked = style([
    levelRow,
    {
        color: textDim,
        cursor: "default",
        ":hover": {
            background: "transparent",
        },
    },
])

export const levelStars = style({
    fontSize: 10,
    letterSpacing: "0.1em",
    color: gold,
})

export const missionRow = style({
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    padding: "3px 10px",
})

export const missionLabel = style({
    fontWeight: 600,
    color: textDim,
})

export const missionValue = style({
    fontWeight: 700,
})

export const missionHint = style({
    fontSize: 11,
    lineHeight: 1.5,
    padding: "6px 10px 2px",
    color: textDim,
})

export const panelBrand = style([
    panel,
    {
        padding: 10,
        textAlign: "center",
    },
])

export const brandName = style({
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: cyan,
    textShadow: "0 0 10px rgba(87, 230, 255, 0.6)",
})

export const brandTag = style({
    fontSize: 10,
    marginTop: 4,
    color: textDim,
})

// ---- Stage (grid board) ----

export const stageColumn = style({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    minWidth: 0,
    minHeight: 0,
})

export const stage = style({
    position: "relative",
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: `2px solid ${line}`,
    borderRadius: 10,
    background: navyDeep,
    boxShadow: "inset 0 0 40px rgba(0, 0, 0, 0.7)",
    overflow: "auto",
    minHeight: 0,
})

export const board = style({
    position: "relative",
    display: "grid",
    border: `2px solid ${line}`,
    borderRadius: 6,
    boxShadow: `0 0 18px rgba(87, 230, 255, 0.25)`,
    background: navy,
})

export const tile = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: `1px solid ${lineSoft}`,
    fontSize: 30,
    lineHeight: 1,
})

export const tilePit = style([
    tile,
    {
        background: "rgba(0, 0, 0, 0.55)",
    },
])

export const tileWall = style([
    tile,
    {
        background: "rgba(87, 230, 255, 0.08)",
    },
])

const bonkShake = keyframes({
    "0%, 100%": { translate: "0 0" },
    "20%": { translate: "-5px 0" },
    "40%": { translate: "5px 0" },
    "60%": { translate: "-4px 0" },
    "80%": { translate: "4px 0" },
})

const fallAway = keyframes({
    from: { scale: "1", opacity: 1 },
    to: { scale: "0.2", opacity: 0 },
})

export const robot = style({
    position: "absolute",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 30,
    lineHeight: 1,
    pointerEvents: "none",
    transition: "left 0.3s ease, top 0.3s ease, transform 0.3s ease",
    filter: "drop-shadow(0 0 6px rgba(87, 230, 255, 0.8))",
})

export const robotBonk = style([
    robot,
    {
        animation: `${bonkShake} 0.35s ease`,
    },
])

export const robotFall = style([
    robot,
    {
        animation: `${fallAway} 0.4s ease forwards`,
        animationDelay: "0.25s",
    },
])

export const robotHeading = style({
    position: "absolute",
    top: -2,
    fontSize: 10,
    color: cyan,
})

const heartsFloat = keyframes({
    from: { translate: "0 0", opacity: 1 },
    to: { translate: "0 -34px", opacity: 0 },
})

export const hearts = style({
    position: "absolute",
    fontSize: 20,
    pointerEvents: "none",
    animation: `${heartsFloat} 1.4s ease-out forwards`,
})

export const overlay = style({
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    background: "rgba(6, 11, 30, 0.82)",
    zIndex: 2,
})

export const overlayTitle = style({
    fontSize: 26,
    fontWeight: 700,
    color: green,
    textShadow: "0 0 12px rgba(52, 216, 115, 0.7)",
})

export const overlayTitleFail = style([
    overlayTitle,
    {
        color: orange,
        textShadow: "0 0 12px rgba(255, 166, 77, 0.7)",
    },
])

export const overlayStars = style({
    fontSize: 30,
    letterSpacing: "0.2em",
})

export const overlayNote = style({
    fontSize: 13,
    color: textDim,
})

// ---- Program strip + palette ----

export const codeSection = style({
    flex: "none",
    border: `2px solid ${line}`,
    borderRadius: 10,
    background: navyPanel,
    padding: "0 0 10px",
})

export const codeSectionHeader = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "rgba(87, 230, 255, 0.15)",
    color: cyan,
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    padding: "4px 10px",
    marginBottom: 8,
})

export const clearBtn = style({
    font: "inherit",
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: text,
    background: "transparent",
    border: `1px solid ${line}`,
    borderRadius: 4,
    padding: "1px 8px",
    cursor: "pointer",
    ":hover": {
        background: "rgba(87, 230, 255, 0.15)",
    },
})

export const strip = style({
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    minHeight: 46,
    padding: "0 10px",
})

export const stripEmpty = style({
    fontSize: 12,
    color: textDim,
    padding: "0 2px",
})

export const block = style({
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    font: "inherit",
    fontSize: 12,
    fontWeight: 700,
    color: "#08131f",
    padding: "7px 10px",
    border: "2px solid transparent",
    borderRadius: 10,
    cursor: "pointer",
    lineHeight: 1,
    whiteSpace: "nowrap",
})

export const blockMove = style([
    block,
    {
        background: green,
        borderColor: greenDark,
        boxShadow: `0 3px 0 ${greenDark}`,
    },
])

export const blockTurn = style([
    block,
    {
        background: orange,
        borderColor: orangeDark,
        boxShadow: `0 3px 0 ${orangeDark}`,
    },
])

export const blockRepeat = style([
    block,
    {
        background: purple,
        borderColor: purpleDark,
        boxShadow: `0 3px 0 ${purpleDark}`,
        padding: "5px 8px",
    },
])

export const blockActive = style({
    outline: `3px solid ${gold}`,
    outlineOffset: 1,
})

export const repeatBody = style({
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    minHeight: 30,
    minWidth: 34,
    padding: 3,
    borderRadius: 8,
    background: "rgba(8, 19, 31, 0.35)",
})

export const paletteRow = style({
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    padding: "0 10px",
})

export const paletteBtn = style({
    selectors: {
        "&:disabled": {
            opacity: 0.35,
            cursor: "default",
        },
    },
})

export const timesBtn = style({
    font: "inherit",
    fontSize: 11,
    fontWeight: 700,
    width: 30,
    padding: "5px 0",
    color: text,
    background: navyDeep,
    border: `2px solid ${purpleDark}`,
    borderRadius: 6,
    cursor: "pointer",
})

export const timesBtnOn = style([
    timesBtn,
    {
        background: purpleDark,
        color: "#ffffff",
    },
])

export const statusBar = style({
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 14px",
    borderTop: `2px solid ${line}`,
    background: navyDeep,
    color: cyan,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.05em",
})
