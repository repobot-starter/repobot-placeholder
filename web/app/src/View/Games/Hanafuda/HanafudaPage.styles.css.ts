import { globalStyle, keyframes, style } from "@vanilla-extract/css"

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
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "28px 40px",
    fontFamily: sans,
    background: bg,
    color: ink,
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
    minHeight: "min(900px, calc(100vh - 56px))",
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

export const roundBadge = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 10,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: inkSoft,
    border: `1px solid ${hairline}`,
    borderRadius: 8,
    padding: "10px 14px",
})

export const layout = style({
    flex: 1,
    display: "flex",
    gap: 18,
    minHeight: 0,
})

export const sideColumn = style({
    width: 250,
    flex: "none",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    overflowY: "auto",
})

export const panel = style({
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: "16px 18px",
    background: surface,
    border: `1px solid ${hairline}`,
    borderRadius: 10,
})

export const panelHeader = style({
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 10,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: inkFaint,
})

export const scoreTable = style({
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 12,
    color: inkSoft,
})

globalStyle(`${scoreTable} th`, {
    padding: "2px 6px 6px",
    textAlign: "right",
    color: inkFaint,
    fontWeight: 400,
    borderBottom: `1px solid ${hairline}`,
})

globalStyle(`${scoreTable} th:first-child`, {
    textAlign: "left",
})

globalStyle(`${scoreTable} td`, {
    padding: "3px 6px",
    textAlign: "right",
    fontFamily: mono,
    fontVariantNumeric: "tabular-nums",
})

globalStyle(`${scoreTable} td:first-child`, {
    textAlign: "left",
    fontFamily: sans,
    color: inkFaint,
})

export const scoreTotalRow = style({
    fontWeight: 600,
    color: ink,
    borderTop: `1px solid ${hairline}`,
})

export const yakuList = style({
    margin: 0,
    padding: 0,
    listStyle: "none",
    fontSize: 11.5,
    lineHeight: 1.65,
    color: inkSoft,
})

globalStyle(`${yakuList} li`, {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
})

globalStyle(`${yakuList} li span:last-child`, {
    fontFamily: mono,
    color: ink,
})

export const logPanel = style({
    fontSize: 11.5,
    lineHeight: 1.65,
    minHeight: 110,
    color: inkSoft,
})

export const logLineBot = style({
    color: inkFaint,
})

export const muted = style({
    margin: 0,
    fontSize: 12,
    color: inkFaint,
})

export const stats = style({
    margin: 0,
    fontSize: 12,
})

globalStyle(`${stats} div`, {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    padding: "2px 0",
})

globalStyle(`${stats} dt`, {
    color: inkSoft,
})

globalStyle(`${stats} dd`, {
    margin: 0,
    fontFamily: mono,
    fontWeight: 600,
    color: ink,
})

// -- The table itself --------------------------------------------------------

export const tableArea = style({
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    minWidth: 0,
    position: "relative",
    border: `1px solid ${hairline}`,
    borderRadius: 12,
    padding: 14,
    background: surface,
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
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 10,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: inkFaint,
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
    borderTop: `1px dashed ${hairlineStrong}`,
    borderBottom: `1px dashed ${hairlineStrong}`,
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
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 9,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: inkFaint,
})

export const drawnCardZone = style({
    flex: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 9,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: ink,
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
            boxShadow: `0 8px 16px rgba(0, 0, 0, 0.55), 0 0 0 2px ${ink}`,
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
        boxShadow: `0 0 0 2px ${ink}, 0 0 14px rgba(255, 255, 255, 0.35)`,
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
    boxShadow: "0 3px 10px rgba(0, 0, 0, 0.4)",
})

export const backCard = style({
    width: 58,
})

export const deckCard = style({
    width: 58,
})

export const drawnCard = style({
    width: 64,
    filter: "drop-shadow(0 0 10px rgba(255, 255, 255, 0.4))",
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
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 9,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: inkFaint,
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
    padding: "12px 26px",
    background: "rgba(10, 10, 10, 0.92)",
    border: `1px solid ${hairlineStrong}`,
    borderRadius: 10,
    color: ink,
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    textAlign: "center",
    boxShadow: "0 8px 28px rgba(0, 0, 0, 0.6)",
    animation: `${toastIn} 200ms ease-out`,
    pointerEvents: "none",
    zIndex: 4,
})

export const yakuToastSub = style({
    display: "block",
    marginTop: 4,
    fontFamily: sans,
    fontSize: 11,
    fontWeight: 400,
    letterSpacing: "0.01em",
    textTransform: "none",
    color: inkSoft,
})

export const dialogScrim = style({
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(10, 10, 10, 0.82)",
    zIndex: 6,
})

export const dialog = style({
    width: "min(430px, 92%)",
    background: surface,
    border: `1px solid ${hairlineStrong}`,
    borderRadius: 12,
    padding: "24px 28px",
    textAlign: "center",
    boxShadow: "0 24px 64px rgba(0, 0, 0, 0.6)",
})

export const dialogTitle = style({
    margin: "0 0 10px",
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 17,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: ink,
})

export const dialogBody = style({
    margin: "0 0 16px",
    fontSize: 13,
    lineHeight: 1.6,
    color: inkSoft,
})

export const dialogYaku = style({
    margin: "0 0 14px",
    padding: 0,
    listStyle: "none",
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 12,
    letterSpacing: "0.04em",
    color: ink,
    lineHeight: 1.8,
})

export const dialogButtons = style({
    display: "flex",
    gap: 10,
    justifyContent: "center",
})

export const koiButton = style([
    button,
    {
        padding: "11px 26px",
    },
])

export const shobuButton = style([
    buttonPrimary,
    {
        padding: "11px 26px",
    },
])

export const statusBar = style({
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 10,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: inkFaint,
})

export const statusHot = style({
    color: inkSoft,
})
