import { globalStyle, keyframes, style } from "@vanilla-extract/css"
import { packBrand } from "@base/design-system/theme"

const bgDeep = "#1d0631"
const shell = "#33104f"
const shellDark = "#270b3e"
const ink = "#140420"
const hotPink = packBrand?.accentDark ?? "#ff4fa3"
const violet = "#8b2fc9"
const gold = "#ffd166"
const cream = "#fff0fa"
const mutedText = "#c9a8e0"

/** Full-viewport wrapper (owns the velvet backstage background). */
export const page = style({
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    fontFamily: '"IBM Plex Mono", monospace',
    background: bgDeep,
    backgroundImage: `radial-gradient(circle at 20% 0%, rgba(255, 79, 163, 0.25), transparent 45%),
        radial-gradient(circle at 80% 100%, rgba(139, 47, 201, 0.35), transparent 50%)`,
    color: cream,
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
    border: `2px solid ${gold}`,
    borderRadius: 18,
    boxShadow: "inset 0 2px 0 rgba(255, 255, 255, 0.15), 0 12px 40px rgba(0, 0, 0, 0.55)",
    overflow: "hidden",
})

export const titleBar = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 14px",
    borderBottom: `2px solid ${gold}`,
    background: `linear-gradient(90deg, ${hotPink}, ${violet})`,
    fontWeight: 700,
    fontSize: 15,
    textShadow: "0 1px 2px rgba(0, 0, 0, 0.4)",
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
    borderRadius: 5,
    background: gold,
    color: ink,
    fontSize: 10,
    fontWeight: 700,
})

export const toolbar = style({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 12px",
    borderBottom: `2px solid ${gold}`,
    background: shellDark,
})

export const toolbarSpacer = style({
    flex: 1,
})

export const chunky = style({
    font: "inherit",
    fontWeight: 700,
    fontSize: 13,
    padding: "6px 16px",
    color: cream,
    background: violet,
    border: `2px solid ${ink}`,
    borderRadius: 999,
    boxShadow: `0 3px 0 ${ink}`,
    cursor: "pointer",
    ":active": {
        boxShadow: "none",
        transform: "translateY(3px)",
    },
    ":disabled": {
        opacity: 0.45,
        cursor: "default",
        boxShadow: `0 3px 0 ${ink}`,
        transform: "none",
    },
})

export const chunkyLit = style([
    chunky,
    {
        background: hotPink,
        boxShadow: `0 3px 0 ${ink}, 0 0 14px rgba(255, 79, 163, 0.7)`,
    },
])

export const chunkyGold = style([
    chunky,
    {
        background: gold,
        color: ink,
    },
])

export const roundBadge = style({
    padding: "6px 14px",
    border: `2px solid ${gold}`,
    borderRadius: 999,
    background: ink,
    color: gold,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.06em",
})

export const timerChip = style([
    roundBadge,
    {
        minWidth: 92,
        textAlign: "center",
        color: cream,
    },
])

const pulse = keyframes({
    "0%": { transform: "scale(1)" },
    "50%": { transform: "scale(1.08)" },
    "100%": { transform: "scale(1)" },
})

export const timerChipUrgent = style([
    timerChip,
    {
        color: hotPink,
        borderColor: hotPink,
        textShadow: "0 0 8px rgba(255, 79, 163, 0.9)",
        animation: `${pulse} 1s infinite`,
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
    border: `2px solid ${gold}`,
    borderRadius: 12,
    background: shellDark,
    padding: "0 0 8px",
    overflow: "hidden",
})

export const panelHeader = style({
    background: `linear-gradient(90deg, ${violet}, ${hotPink})`,
    color: cream,
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    padding: "5px 10px",
    marginBottom: 6,
})

export const themeCard = style({
    textAlign: "center",
    padding: "6px 10px 4px",
})

export const themeEmoji = style({
    fontSize: 44,
    lineHeight: 1.1,
})

export const themeName = style({
    fontSize: 17,
    fontWeight: 700,
    color: gold,
    marginTop: 2,
})

export const themeHint = style({
    fontSize: 11,
    color: mutedText,
    marginTop: 4,
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
    color: mutedText,
})

globalStyle(`${stats} dd`, {
    margin: 0,
    fontWeight: 700,
})

export const muted = style({
    fontSize: 12,
    padding: "2px 10px",
    color: mutedText,
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
    background: `linear-gradient(90deg, ${hotPink}, ${gold})`,
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    color: "transparent",
})

export const brandTag = style({
    fontSize: 10,
    marginTop: 4,
    color: mutedText,
})

// ---------------------------------------------------------------------------
// Stage + runway
// ---------------------------------------------------------------------------

export const stageArea = style({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    minWidth: 0,
})

/** Positioning context for the stage plus its overlays. */
export const stageWrap = style({
    position: "relative",
    flex: 1,
    minHeight: 0,
    display: "flex",
})

export const stage = style({
    position: "relative",
    flex: 1,
    minHeight: 0,
    border: `2px solid ${gold}`,
    borderRadius: 16,
    background: `linear-gradient(180deg, #2a0a44 0%, #3d1160 62%, #1a0529 62%, #12031e 100%)`,
    overflow: "hidden",
})

const twinkle = keyframes({
    "0%": { opacity: 0.35 },
    "50%": { opacity: 1 },
    "100%": { opacity: 0.35 },
})

export const runwayLights = style({
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 12,
    background: `radial-gradient(circle at 10px 6px, ${gold} 3px, transparent 4px)`,
    backgroundSize: "28px 12px",
    animation: `${twinkle} 1.6s infinite`,
})

export const runway = style({
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "38%",
    background: `linear-gradient(180deg, ${hotPink} 0%, #b32b73 8%, #6e1a49 100%)`,
    borderTop: `3px solid ${gold}`,
    boxShadow: "0 -6px 24px rgba(255, 79, 163, 0.45)",
})

// ---------------------------------------------------------------------------
// The doll
// ---------------------------------------------------------------------------

export const doll = style({
    position: "absolute",
    left: "50%",
    bottom: "14%",
    width: 230,
    height: 330,
    transform: "translateX(-50%)",
    transition: "transform 0.2s",
})

const strut = keyframes({
    "0%": { left: "-15%", transform: "translateX(-50%) rotate(-2deg)" },
    "25%": { transform: "translateX(-50%) rotate(2deg)" },
    "50%": { left: "50%", transform: "translateX(-50%) rotate(-2deg) scale(1.06)" },
    "75%": { transform: "translateX(-50%) rotate(2deg)" },
    "100%": { left: "115%", transform: "translateX(-50%) rotate(-2deg)" },
})

export const dollWalking = style([
    doll,
    {
        animation: `${strut} 2.6s ease-in-out forwards`,
        transition: "none",
    },
])

const layer = style({
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
    lineHeight: 1,
    pointerEvents: "none",
})

export const dollBase = style([
    layer,
    {
        bottom: 0,
        fontSize: 190,
        filter: "drop-shadow(0 10px 12px rgba(0, 0, 0, 0.5))",
    },
])

const bounce = keyframes({
    "0%": { transform: "translateX(-50%) scale(0.3)" },
    "55%": { transform: "translateX(-50%) scale(1.35)" },
    "100%": { transform: "translateX(-50%) scale(1)" },
})

const wornLayer = style([
    layer,
    {
        animation: `${bounce} 0.35s ease-out`,
        filter: "drop-shadow(0 3px 4px rgba(0, 0, 0, 0.45))",
    },
])

// Offsets sit each layer over the right part of the 190px base figure:
// head top ≈ 185, torso ≈ 75-140, legs ≈ 20-75, feet ≈ 0.
export const dollHat = style([wornLayer, { bottom: 182, fontSize: 58 }])
export const dollTop = style([wornLayer, { bottom: 80, fontSize: 76 }])
export const dollBottom = style([wornLayer, { bottom: 26, fontSize: 60 }])
export const dollShoes = style([wornLayer, { bottom: -6, fontSize: 42 }])
export const dollAccessory = style([
    wornLayer,
    {
        bottom: 84,
        fontSize: 54,
        left: "82%",
    },
])

const flash = keyframes({
    "0%": { opacity: 0, transform: "scale(0.4)" },
    "40%": { opacity: 1, transform: "scale(1.3)" },
    "100%": { opacity: 0, transform: "scale(0.6)" },
})

export const sparkle = style({
    position: "absolute",
    fontSize: 30,
    pointerEvents: "none",
    animation: `${flash} 0.9s ease-out infinite`,
})

// ---------------------------------------------------------------------------
// Verdict / season overlays
// ---------------------------------------------------------------------------

export const stageOverlay = style({
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(20, 4, 32, 0.82)",
    zIndex: 2,
})

const cardIn = keyframes({
    "0%": { opacity: 0, transform: "translateY(24px) scale(0.9)" },
    "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
})

export const verdictCard = style({
    width: "min(420px, 90%)",
    textAlign: "center",
    padding: "22px 26px",
    border: `2px solid ${gold}`,
    borderRadius: 18,
    background: shellDark,
    boxShadow: `0 0 34px rgba(255, 209, 102, 0.35)`,
    animation: `${cardIn} 0.35s ease-out`,
})

export const verdictStars = style({
    fontSize: 30,
    letterSpacing: "0.1em",
    marginBottom: 6,
})

export const verdictScore = style({
    fontSize: 34,
    fontWeight: 700,
    color: gold,
})

export const verdictLine = style({
    fontSize: 14,
    fontStyle: "italic",
    color: cream,
    margin: "8px 0 4px",
})

export const verdictDetail = style({
    fontSize: 12,
    color: mutedText,
    marginBottom: 14,
})

export const overlayTitle = style({
    fontSize: 26,
    fontWeight: 700,
    color: hotPink,
    textShadow: "0 0 12px rgba(255, 79, 163, 0.8)",
    marginBottom: 10,
})

// ---------------------------------------------------------------------------
// Closet
// ---------------------------------------------------------------------------

export const closet = style([
    panel,
    {
        width: 250,
        flex: "none",
        display: "flex",
        flexDirection: "column",
        padding: 0,
        minHeight: 0,
    },
])

export const slotTabs = style({
    display: "flex",
    borderBottom: `2px solid ${gold}`,
})

export const slotTab = style({
    flex: 1,
    font: "inherit",
    fontSize: 18,
    padding: "8px 0",
    background: shellDark,
    color: cream,
    border: "none",
    borderRight: `1px solid ${ink}`,
    cursor: "pointer",
    ":last-child": {
        borderRight: "none",
    },
})

export const slotTabActive = style([
    slotTab,
    {
        background: `linear-gradient(180deg, ${hotPink}, ${violet})`,
    },
])

export const closetLabel = style({
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: gold,
    padding: "8px 12px 4px",
})

export const itemGrid = style({
    flex: 1,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
    padding: "4px 10px 10px",
    alignContent: "start",
    overflowY: "auto",
    minHeight: 0,
})

export const itemButton = style({
    font: "inherit",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    padding: "8px 4px 6px",
    background: shell,
    color: cream,
    border: `2px solid ${violet}`,
    borderRadius: 10,
    cursor: "pointer",
    ":hover": {
        borderColor: hotPink,
    },
    ":disabled": {
        opacity: 0.4,
        cursor: "default",
    },
})

export const itemButtonSelected = style([
    itemButton,
    {
        borderColor: gold,
        background: `linear-gradient(180deg, ${violet}, ${shellDark})`,
        boxShadow: `0 0 10px rgba(255, 209, 102, 0.5)`,
    },
])

export const itemEmoji = style({
    fontSize: 30,
    lineHeight: 1.1,
})

export const itemName = style({
    fontSize: 10,
    fontWeight: 600,
    textAlign: "center",
})

export const closetActions = style({
    display: "flex",
    gap: 8,
    padding: "8px 10px 10px",
    borderTop: `2px solid ${gold}`,
})

// ---------------------------------------------------------------------------
// Status bar
// ---------------------------------------------------------------------------

export const statusBar = style({
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 14px",
    borderTop: `2px solid ${gold}`,
    background: ink,
    color: hotPink,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.05em",
})
