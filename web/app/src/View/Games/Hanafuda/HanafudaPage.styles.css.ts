import { globalStyle, keyframes, style } from "@vanilla-extract/css"
import { packBrand } from "@base/design-system/theme"

// Self-contained dark lacquer-and-gold palette — this pack intentionally does
// not import the design system, matching the other game packs.
const lacquer = "#191009"
const lacquerDeep = "#100a06"
const panelBg = "#241610"
const panelEdge = "#4a2f1c"
const gold = packBrand?.accentDark ?? "#d9a441"
const goldSoft = "#eccb84"
const goldDim = "#8a6a34"
const red = "#b53228"
const cream = "#f4ecd6"
const text = "#e8dcc0"
const textDim = "#a8916c"

/** Full-viewport wrapper owning the lacquered-table backdrop. */
export const page = style({
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    fontFamily: '"Georgia", "Hiragino Mincho ProN", serif',
    background: lacquer,
    backgroundImage:
        "radial-gradient(circle at 50% 20%, rgba(217, 164, 65, 0.08), transparent 55%), " +
        "radial-gradient(circle at 15% 90%, rgba(181, 50, 40, 0.06), transparent 45%)",
    color: text,
    userSelect: "none",
    boxSizing: "border-box",
})

globalStyle(`${page} *`, {
    boxSizing: "border-box",
})

export const frame = style({
    display: "flex",
    flexDirection: "column",
    width: "min(1380px, 100%)",
    minHeight: "min(920px, calc(100vh - 28px))",
    background: panelBg,
    border: `2px solid ${panelEdge}`,
    borderRadius: 12,
    boxShadow: "0 0 44px rgba(217, 164, 65, 0.12), inset 0 0 18px rgba(0, 0, 0, 0.75)",
    overflow: "hidden",
})

export const titleBar = style({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "9px 16px",
    borderBottom: `2px solid ${panelEdge}`,
    background: lacquerDeep,
    fontWeight: 700,
    fontSize: 17,
    letterSpacing: "0.06em",
    color: goldSoft,
})

export const titleSub = style({
    fontSize: 12,
    fontWeight: 400,
    color: textDim,
})

export const toolbar = style({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "8px 14px",
    borderBottom: `1px solid ${panelEdge}`,
    background: "rgba(16, 10, 6, 0.5)",
})

export const chunky = style({
    font: "inherit",
    fontWeight: 700,
    fontSize: 13,
    padding: "6px 16px",
    color: goldSoft,
    background: "rgba(217, 164, 65, 0.1)",
    border: `1px solid ${goldDim}`,
    borderRadius: 5,
    cursor: "pointer",
    ":disabled": {
        opacity: 0.4,
        cursor: "default",
    },
    selectors: {
        "&:hover:not(:disabled)": {
            background: "rgba(217, 164, 65, 0.22)",
        },
    },
})

export const toolbarSpacer = style({
    flex: 1,
})

export const roundBadge = style({
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: gold,
    border: `1px solid ${goldDim}`,
    borderRadius: 5,
    padding: "4px 12px",
    background: "rgba(217, 164, 65, 0.06)",
})

export const layout = style({
    flex: 1,
    display: "flex",
    gap: 12,
    padding: 12,
    minHeight: 0,
})

export const sideColumn = style({
    width: 250,
    flex: "none",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    overflowY: "auto",
})

export const panel = style({
    border: `1px solid ${panelEdge}`,
    borderRadius: 6,
    background: "rgba(16, 10, 6, 0.55)",
})

export const panelHeader = style({
    padding: "5px 10px",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: goldSoft,
    borderBottom: `1px solid ${panelEdge}`,
    background: "rgba(217, 164, 65, 0.08)",
})

export const scoreTable = style({
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 12,
})

globalStyle(`${scoreTable} th`, {
    padding: "4px 8px",
    textAlign: "right",
    color: textDim,
    fontWeight: 400,
    borderBottom: `1px solid ${panelEdge}`,
})

globalStyle(`${scoreTable} th:first-child`, {
    textAlign: "left",
})

globalStyle(`${scoreTable} td`, {
    padding: "3px 8px",
    textAlign: "right",
})

globalStyle(`${scoreTable} td:first-child`, {
    textAlign: "left",
    color: textDim,
})

export const scoreTotalRow = style({
    fontWeight: 700,
    color: goldSoft,
    borderTop: `1px solid ${panelEdge}`,
})

export const yakuList = style({
    margin: 0,
    padding: "7px 10px",
    listStyle: "none",
    fontSize: 11.5,
    lineHeight: 1.55,
})

globalStyle(`${yakuList} li`, {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
})

globalStyle(`${yakuList} li span:last-child`, {
    color: gold,
})

export const logPanel = style({
    padding: "7px 10px",
    fontSize: 11.5,
    lineHeight: 1.6,
    minHeight: 110,
    color: text,
})

export const logLineBot = style({
    color: textDim,
})

export const muted = style({
    margin: 0,
    padding: "8px 10px",
    fontSize: 12,
    color: textDim,
})

export const stats = style({
    margin: 0,
    padding: "7px 10px",
    fontSize: 12,
})

globalStyle(`${stats} div`, {
    display: "flex",
    justifyContent: "space-between",
    padding: "2px 0",
})

globalStyle(`${stats} dt`, {
    color: textDim,
})

globalStyle(`${stats} dd`, {
    margin: 0,
    fontWeight: 700,
    color: goldSoft,
})

// -- The table itself --------------------------------------------------------

export const tableArea = style({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    minWidth: 0,
    position: "relative",
    border: `1px solid ${panelEdge}`,
    borderRadius: 8,
    padding: 12,
    background: "radial-gradient(ellipse at 50% 50%, rgba(74, 47, 28, 0.35), rgba(16, 10, 6, 0.72) 75%)",
    boxShadow: "inset 0 0 30px rgba(0, 0, 0, 0.6)",
    overflow: "hidden",
})

export const seatRow = style({
    display: "flex",
    alignItems: "center",
    gap: 8,
    minHeight: 0,
})

export const seatLabel = style({
    width: 66,
    flex: "none",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: textDim,
    textAlign: "center",
})

export const handRow = style({
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    alignItems: "center",
    flex: 1,
})

export const fieldZone = style({
    flex: 1,
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "8px 4px",
    borderTop: `1px dashed ${goldDim}`,
    borderBottom: `1px dashed ${goldDim}`,
    minHeight: 0,
})

export const fieldGrid = style({
    flex: 1,
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
})

export const deckZone = style({
    flex: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    fontSize: 10,
    letterSpacing: "0.08em",
    color: textDim,
})

export const drawnCardZone = style({
    flex: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    fontSize: 10,
    letterSpacing: "0.08em",
    color: gold,
})

// -- Cards --------------------------------------------------------------------

export const handCard = style({
    width: 74,
    display: "block",
    padding: 0,
    border: "none",
    background: "none",
    cursor: "pointer",
    borderRadius: 7,
    transition: "transform 120ms ease, box-shadow 120ms ease",
    selectors: {
        "&:hover:not(:disabled)": {
            transform: "translateY(-6px)",
            boxShadow: `0 8px 16px rgba(0, 0, 0, 0.55), 0 0 0 2px ${gold}`,
        },
        "&:disabled": {
            cursor: "default",
            opacity: 0.85,
        },
    },
})

export const fieldCard = style({
    width: 64,
    display: "block",
    padding: 0,
    border: "none",
    background: "none",
    borderRadius: 6,
    cursor: "default",
})

export const fieldCardMatchable = style([
    fieldCard,
    {
        cursor: "pointer",
        boxShadow: `0 0 0 2.5px ${gold}, 0 0 14px rgba(217, 164, 65, 0.6)`,
        selectors: {
            "&:hover": {
                transform: "translateY(-4px)",
            },
        },
    },
])

export const cardSvg = style({
    width: "100%",
    height: "auto",
    display: "block",
    borderRadius: 6,
})

export const backCard = style({
    width: 58,
})

export const deckCard = style({
    width: 58,
})

export const drawnCard = style({
    width: 64,
    filter: "drop-shadow(0 0 10px rgba(217, 164, 65, 0.7))",
})

export const trayRow = style({
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    flex: 1,
    minHeight: 52,
})

export const tray = style({
    display: "flex",
    flexDirection: "column",
    gap: 3,
})

export const trayLabel = style({
    fontSize: 9,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: textDim,
})

export const trayCards = style({
    display: "flex",
})

export const trayCard = style({
    width: 34,
    flex: "none",
    marginLeft: -14,
    selectors: {
        "&:first-child": {
            marginLeft: 0,
        },
    },
})

// -- Overlays -------------------------------------------------------------------

const toastIn = keyframes({
    from: { opacity: 0, transform: "translate(-50%, 14px)" },
    to: { opacity: 1, transform: "translate(-50%, 0)" },
})

export const yakuToast = style({
    position: "absolute",
    left: "50%",
    bottom: 108,
    transform: "translateX(-50%)",
    padding: "10px 22px",
    background: "rgba(16, 10, 6, 0.94)",
    border: `2px solid ${gold}`,
    borderRadius: 8,
    color: goldSoft,
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: "0.04em",
    textAlign: "center",
    boxShadow: "0 8px 28px rgba(0, 0, 0, 0.6), 0 0 18px rgba(217, 164, 65, 0.35)",
    animation: `${toastIn} 200ms ease-out`,
    pointerEvents: "none",
    zIndex: 4,
})

export const yakuToastSub = style({
    display: "block",
    marginTop: 3,
    fontSize: 11,
    fontWeight: 400,
    color: text,
})

export const dialogScrim = style({
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(10, 6, 4, 0.78)",
    zIndex: 6,
})

export const dialog = style({
    width: "min(430px, 92%)",
    background: panelBg,
    border: `2px solid ${gold}`,
    borderRadius: 10,
    padding: "20px 24px",
    textAlign: "center",
    boxShadow: "0 14px 44px rgba(0, 0, 0, 0.7)",
})

export const dialogTitle = style({
    margin: "0 0 6px",
    fontSize: 22,
    fontWeight: 700,
    color: goldSoft,
    letterSpacing: "0.05em",
})

export const dialogBody = style({
    margin: "0 0 14px",
    fontSize: 13,
    lineHeight: 1.6,
    color: text,
})

export const dialogYaku = style({
    margin: "0 0 14px",
    padding: 0,
    listStyle: "none",
    fontSize: 13,
    color: gold,
    lineHeight: 1.7,
})

export const dialogButtons = style({
    display: "flex",
    gap: 10,
    justifyContent: "center",
})

export const koiButton = style([
    chunky,
    {
        fontSize: 15,
        padding: "9px 24px",
        color: cream,
        background: red,
        border: `1px solid ${red}`,
        selectors: {
            "&:hover:not(:disabled)": {
                background: "#c94438",
            },
        },
    },
])

export const shobuButton = style([
    chunky,
    {
        fontSize: 15,
        padding: "9px 24px",
        color: lacquerDeep,
        background: gold,
        border: `1px solid ${gold}`,
        selectors: {
            "&:hover:not(:disabled)": {
                background: goldSoft,
            },
        },
    },
])

export const statusBar = style({
    display: "flex",
    justifyContent: "space-between",
    padding: "7px 16px",
    borderTop: `2px solid ${panelEdge}`,
    background: lacquerDeep,
    fontSize: 11.5,
    letterSpacing: "0.04em",
    color: textDim,
})

export const statusHot = style({
    color: goldSoft,
})
