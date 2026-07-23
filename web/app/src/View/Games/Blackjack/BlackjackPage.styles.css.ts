import { globalStyle, keyframes, style } from "@vanilla-extract/css"
import { packBrand } from "@base/design-system/theme"

const wood = "#4b2f1a"
const woodDark = "#38220f"
const woodDeep = "#241608"
const gold = packBrand?.accentDark ?? "#d4af37"
const goldSoft = "#e8cf7a"
const cream = "#f3ead2"
const ink = "#1a1108"
const feltEdge = "#0f4224"
const red = "#c0392b"

/** Full-viewport wrapper (owns the dim casino-floor background). */
export const page = style({
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    fontFamily: '"IBM Plex Mono", monospace',
    background: woodDeep,
    backgroundImage: "radial-gradient(ellipse at 50% 0%, rgba(212, 175, 55, 0.08), transparent 65%)",
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
    background: `linear-gradient(${wood}, ${woodDark})`,
    border: `2px solid ${ink}`,
    borderRadius: 12,
    boxShadow: "inset 0 2px 0 rgba(255, 255, 255, 0.12), 6px 8px 0 rgba(0, 0, 0, 0.45)",
    overflow: "hidden",
})

export const titleBar = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "7px 12px",
    borderBottom: `2px solid ${ink}`,
    background: woodDark,
    color: goldSoft,
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
    background: wood,
    color: cream,
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
    ":disabled": {
        opacity: 0.45,
        cursor: "default",
        boxShadow: `2px 2px 0 ${ink}`,
        transform: "none",
    },
})

export const chunkyLit = style([
    chunky,
    {
        boxShadow: "none",
        transform: "translate(2px, 2px)",
        background: goldSoft,
    },
])

export const botBadge = style({
    padding: "6px 14px",
    border: `2px solid ${ink}`,
    borderRadius: 6,
    background: "#120d05",
    color: gold,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.06em",
    textShadow: "0 0 6px rgba(212, 175, 55, 0.7)",
})

export const layout = style({
    flex: 1,
    display: "flex",
    gap: 12,
    padding: 12,
    minHeight: 0,
})

export const panelColumn = style({
    width: 200,
    flex: "none",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    overflowY: "auto",
})

export const panel = style({
    border: `2px solid ${ink}`,
    borderRadius: 6,
    background: woodDark,
    padding: "0 0 8px",
})

export const panelHeader = style({
    background: ink,
    color: goldSoft,
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    padding: "4px 8px",
    marginBottom: 6,
})

export const moneyRow = style({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    padding: "3px 10px",
    fontSize: 13,
    fontWeight: 600,
})

export const moneyValue = style({
    fontWeight: 700,
    color: goldSoft,
})

export const chipRow = style({
    display: "flex",
    justifyContent: "center",
    gap: 8,
    padding: "8px 10px 4px",
})

const chipBase = style({
    font: "inherit",
    width: 52,
    height: 52,
    borderRadius: "50%",
    border: "4px dashed rgba(255, 255, 255, 0.85)",
    boxShadow: "0 2px 0 rgba(0, 0, 0, 0.5), inset 0 0 0 2px rgba(0, 0, 0, 0.25)",
    color: "#ffffff",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    transition: "transform 0.1s ease",
    ":active": {
        transform: "translateY(2px)",
    },
    ":disabled": {
        opacity: 0.4,
        cursor: "default",
        transform: "none",
    },
})

export const chipRed = style([chipBase, { background: red }])

export const chipGreen = style([chipBase, { background: "#1e8449" }])

export const chipBlack = style([chipBase, { background: "#20242c" }])

export const betButtonRow = style({
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: "6px 10px 2px",
})

export const dealButton = style({
    font: "inherit",
    fontWeight: 700,
    fontSize: 14,
    padding: "8px 0",
    color: ink,
    background: `linear-gradient(${goldSoft}, ${gold})`,
    border: `2px solid ${ink}`,
    borderRadius: 6,
    boxShadow: `2px 2px 0 ${ink}`,
    cursor: "pointer",
    ":active": {
        boxShadow: "none",
        transform: "translate(2px, 2px)",
    },
    ":disabled": {
        opacity: 0.45,
        cursor: "default",
        boxShadow: `2px 2px 0 ${ink}`,
        transform: "none",
    },
})

export const clearButton = style({
    font: "inherit",
    fontWeight: 700,
    fontSize: 12,
    padding: "5px 0",
    color: cream,
    background: "transparent",
    border: `2px solid ${cream}`,
    borderRadius: 6,
    cursor: "pointer",
    ":disabled": {
        opacity: 0.4,
        cursor: "default",
    },
})

export const creditButton = style([
    dealButton,
    {
        background: `linear-gradient(#7cc98e, #3f9d5f)`,
        fontSize: 12,
    },
])

export const ruleList = style({
    margin: 0,
    padding: "2px 10px 2px 24px",
    fontSize: 11.5,
    lineHeight: 1.55,
    opacity: 0.85,
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
    letterSpacing: "0.04em",
    color: gold,
})

export const brandTag = style({
    fontSize: 10,
    marginTop: 4,
    color: cream,
    opacity: 0.75,
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

export const muted = style({
    fontSize: 12,
    padding: "2px 10px",
    opacity: 0.7,
})

export const statusBar = style({
    display: "flex",
    justifyContent: "space-between",
    padding: "6px 14px",
    borderTop: `2px solid ${ink}`,
    background: "#120d05",
    color: gold,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.05em",
})

// ---------------------------------------------------------------------------
// Felt table
// ---------------------------------------------------------------------------

export const tableArea = style({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
})

export const table = style({
    position: "relative",
    flex: 1,
    width: "100%",
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: "16px 24px 18px",
    background: "radial-gradient(ellipse at 50% 28%, #2f8f54 0%, #1d6b3c 55%, #12492a 100%)",
    border: `10px solid ${woodDark}`,
    borderRadius: "18px 18px 46% 46% / 18px 18px 14% 14%",
    boxShadow: `inset 0 0 0 2px ${gold}, inset 0 0 60px ${feltEdge}, 4px 4px 0 rgba(0, 0, 0, 0.35)`,
    overflow: "hidden",
})

export const handArea = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
})

export const handLabel = style({
    display: "flex",
    alignItems: "baseline",
    gap: 10,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.1em",
    color: goldSoft,
    textTransform: "uppercase",
})

export const handTotalBadge = style({
    padding: "1px 10px",
    borderRadius: 10,
    background: "rgba(0, 0, 0, 0.35)",
    color: cream,
    fontSize: 12,
    fontWeight: 700,
    textTransform: "none",
    letterSpacing: "0.02em",
})

export const cardRow = style({
    display: "flex",
    justifyContent: "center",
    gap: 10,
    minHeight: 106,
})

export const tableCenter = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
})

export const tableMotto = style({
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.18em",
    color: "rgba(232, 207, 122, 0.65)",
    textTransform: "uppercase",
})

export const betSpot = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 76,
    height: 76,
    borderRadius: "50%",
    border: "2px dashed rgba(243, 234, 210, 0.55)",
    color: cream,
    fontSize: 15,
    fontWeight: 700,
})

export const shuffleNote = style({
    fontSize: 11,
    fontWeight: 600,
    color: "rgba(243, 234, 210, 0.75)",
    fontStyle: "italic",
})

export const actionRow = style({
    display: "flex",
    justifyContent: "center",
    gap: 12,
    minHeight: 40,
})

export const actionButton = style({
    font: "inherit",
    fontWeight: 700,
    fontSize: 14,
    padding: "7px 22px",
    color: ink,
    background: `linear-gradient(${goldSoft}, ${gold})`,
    border: `2px solid ${ink}`,
    borderRadius: 8,
    boxShadow: `2px 2px 0 ${ink}`,
    cursor: "pointer",
    ":active": {
        boxShadow: "none",
        transform: "translate(2px, 2px)",
    },
    ":disabled": {
        opacity: 0.45,
        cursor: "default",
        boxShadow: `2px 2px 0 ${ink}`,
        transform: "none",
    },
})

export const controlsHint = style({
    fontSize: 11,
    fontWeight: 600,
    opacity: 0.7,
})

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

export const cardOuter = style({
    width: 74,
    height: 106,
    flex: "none",
    perspective: 600,
    opacity: 0,
    transform: "translate(-20px, -32px) rotate(-6deg)",
    transition: "transform 0.35s ease-out, opacity 0.35s ease-out",
})

export const cardOuterDealt = style([
    cardOuter,
    {
        opacity: 1,
        transform: "none",
    },
])

const cardInnerBase = style({
    position: "relative",
    width: "100%",
    height: "100%",
    transformStyle: "preserve-3d",
    transition: "transform 0.45s ease",
})

export const cardInnerFaceDown = style([cardInnerBase, { transform: "rotateY(180deg)" }])

export const cardInnerFaceUp = style([cardInnerBase, { transform: "rotateY(0deg)" }])

const cardFace = style({
    position: "absolute",
    inset: 0,
    borderRadius: 8,
    backfaceVisibility: "hidden",
    border: "1px solid rgba(0, 0, 0, 0.35)",
    boxShadow: "0 3px 6px rgba(0, 0, 0, 0.35)",
})

const cardFront = style([
    cardFace,
    {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(150deg, #ffffff 70%, #f0ecdf 100%)",
    },
])

export const cardFrontRed = style([cardFront, { color: "#c0392b" }])

export const cardFrontBlack = style([cardFront, { color: "#20242c" }])

export const cardBack = style([
    cardFace,
    {
        transform: "rotateY(180deg)",
        background: "repeating-linear-gradient(45deg, #7b1e2b 0, #7b1e2b 6px, #5d1620 6px, #5d1620 12px)",
        boxShadow: `inset 0 0 0 4px #ffffff, 0 3px 6px rgba(0, 0, 0, 0.35)`,
    },
])

export const cardCorner = style({
    position: "absolute",
    top: 5,
    left: 7,
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1.1,
    textAlign: "center",
    whiteSpace: "pre-line",
})

export const cardCornerFlipped = style([
    cardCorner,
    {
        top: "auto",
        left: "auto",
        bottom: 5,
        right: 7,
        transform: "rotate(180deg)",
    },
])

export const cardPip = style({
    fontSize: 34,
    lineHeight: 1,
})

// ---------------------------------------------------------------------------
// Result banner
// ---------------------------------------------------------------------------

const bannerPop = keyframes({
    from: { transform: "translate(-50%, -50%) scale(0.6)", opacity: 0 },
    to: { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
})

const bannerBase = style({
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    padding: "12px 34px",
    borderRadius: 12,
    background: "rgba(10, 20, 12, 0.88)",
    border: `2px solid ${gold}`,
    textAlign: "center",
    pointerEvents: "none",
    animation: `${bannerPop} 0.25s ease-out`,
})

export const bannerWin = style([bannerBase, { color: goldSoft }])

export const bannerLose = style([bannerBase, { color: "#e08a7c", borderColor: "#a24d3f" }])

export const bannerPush = style([bannerBase, { color: cream, borderColor: cream }])

export const bannerTitle = style({
    fontSize: 26,
    fontWeight: 700,
    letterSpacing: "0.08em",
})

export const bannerNet = style({
    fontSize: 14,
    fontWeight: 700,
    opacity: 0.9,
})
