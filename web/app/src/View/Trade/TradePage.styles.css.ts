import { globalStyle, style } from "@vanilla-extract/css"
import { packBrand, packFont } from "@base/design-system/theme"

/**
 * TradeBot's look is a deliberate contrast: an editorial paper-and-ink
 * marketing shell (serif statements, black CTAs) wrapped around ops-grade
 * components (sans-serif tables, status pills, tabular numerals) — the page
 * reads like a trade manifesto with a live operations desk embedded in it.
 */
const paper = "#f7f6f4"
const ink = "#12161f"
const secondary = "#576074"
const border = "#dce1ea"
const surface = "#ffffff"
const surfaceAlt = "#f3f5f8"
const accent = packBrand?.accent ?? "#1f6feb"

const serif = 'Georgia, "Times New Roman", serif'
const sans =
    packFont ??
    'Lato, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

/** Status pill tones, mirrored from the ops design language. */
export const toneStyles = {
    success: { color: "#166534", background: "rgba(34, 197, 94, 0.18)" },
    info: { color: "#0c4a6e", background: "rgba(14, 165, 233, 0.16)" },
    warning: { color: "#92400e", background: "rgba(245, 158, 11, 0.2)" },
    neutral: { color: secondary, background: surfaceAlt },
} as const

export const page = style({
    minHeight: "100vh",
    background: paper,
    color: ink,
    fontFamily: sans,
    WebkitFontSmoothing: "antialiased",
    boxSizing: "border-box",
})

globalStyle(`${page} *`, {
    boxSizing: "border-box",
})

export const column = style({
    width: "min(1060px, 100%)",
    margin: "0 auto",
    padding: "0 24px 64px",
})

/* ---------------------------------------------------------------- top bar */

export const topBar = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    padding: "18px 0",
    borderBottom: `1px solid ${border}`,
})

export const wordmark = style({
    fontFamily: serif,
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: 0.2,
})

export const topBarActions = style({
    display: "flex",
    alignItems: "center",
    gap: 14,
})

export const topBarLink = style({
    fontSize: 13,
    fontWeight: 600,
    color: secondary,
    textDecoration: "none",
    ":hover": { color: ink },
    "@media": {
        "screen and (max-width: 640px)": { display: "none" },
    },
})

/* ------------------------------------------------------------------- hero */

export const hero = style({
    padding: "72px 0 48px",
    "@media": {
        "screen and (max-width: 640px)": { padding: "48px 0 32px" },
    },
})

export const kicker = style({
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 2.4,
    textTransform: "uppercase",
    color: secondary,
})

export const statement = style({
    fontFamily: serif,
    fontWeight: 900,
    fontSize: "clamp(38px, 6.4vw, 68px)",
    lineHeight: 1.05,
    letterSpacing: -0.5,
    margin: "14px 0 20px",
    maxWidth: 720,
})

export const intro = style({
    fontSize: 17,
    lineHeight: 1.6,
    color: secondary,
    maxWidth: 620,
    margin: "0 0 28px",
})

export const heroActions = style({
    display: "flex",
    alignItems: "center",
    gap: 18,
    flexWrap: "wrap",
})

export const ctaButton = style({
    fontFamily: sans,
    fontSize: 14,
    fontWeight: 600,
    color: surface,
    background: ink,
    border: `1px solid ${ink}`,
    borderRadius: 5,
    padding: "12px 22px",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
    transition: "opacity 120ms ease",
    ":hover": { opacity: 0.85 },
})

export const underlineLink = style({
    fontSize: 14,
    fontWeight: 600,
    color: ink,
    textDecoration: "none",
    borderBottom: `2px solid ${ink}`,
    paddingBottom: 2,
    ":hover": { color: accent, borderBottomColor: accent },
})

/* -------------------------------------------------------------- KPI strip */

export const statStrip = style({
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    background: surface,
    border: `1px solid ${border}`,
    borderRadius: 14,
    overflow: "hidden",
    "@media": {
        "screen and (max-width: 640px)": { gridTemplateColumns: "repeat(2, 1fr)" },
    },
})

export const statCell = style({
    padding: "20px 22px",
    borderRight: `1px solid ${border}`,
    selectors: {
        "&:last-child": { borderRight: "none" },
    },
    "@media": {
        "screen and (max-width: 640px)": {
            selectors: { "&:nth-child(2n)": { borderRight: "none" } },
            borderBottom: `1px solid ${border}`,
        },
    },
})

export const statValue = style({
    fontSize: 30,
    fontWeight: 500,
    fontVariantNumeric: "tabular-nums",
    lineHeight: 1.1,
})

export const statLabel = style({
    fontSize: 12,
    fontWeight: 600,
    color: secondary,
    marginTop: 6,
    letterSpacing: 0.35,
    textTransform: "uppercase",
})

/* --------------------------------------------------------------- sections */

export const section = style({
    padding: "56px 0 0",
})

export const sectionHeading = style({
    fontFamily: serif,
    fontWeight: 900,
    fontSize: 30,
    lineHeight: 1.15,
    margin: "0 0 6px",
})

export const sectionSub = style({
    fontSize: 14,
    color: secondary,
    margin: "0 0 24px",
    maxWidth: 560,
    lineHeight: 1.55,
})

/* -------------------------------------------------------- commodity cards */

export const commodityGrid = style({
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 16,
    "@media": {
        "screen and (max-width: 760px)": { gridTemplateColumns: "1fr" },
    },
})

export const commodityCard = style({
    display: "flex",
    gap: 16,
    background: surface,
    border: `1px solid ${border}`,
    borderRadius: 14,
    padding: 18,
})

export const commodityTile = style({
    flexShrink: 0,
    width: 52,
    height: 52,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: serif,
    fontWeight: 700,
    fontSize: 17,
    color: ink,
})

export const commodityBody = style({
    display: "flex",
    flexDirection: "column",
    gap: 6,
    minWidth: 0,
})

export const commodityName = style({
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1.25,
})

export const commodityChips = style({
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
})

export const commodityChip = style({
    fontSize: 11,
    fontWeight: 600,
    color: secondary,
    background: surfaceAlt,
    border: `1px solid ${border}`,
    borderRadius: 999,
    padding: "2px 8px",
    whiteSpace: "nowrap",
})

export const commodityNote = style({
    fontSize: 13,
    lineHeight: 1.55,
    color: secondary,
    margin: 0,
})

/* --------------------------------------------------------- journey timeline */

export const journeyCard = style({
    background: surface,
    border: `1px solid ${border}`,
    borderRadius: 14,
    padding: "8px 0",
})

export const journeyRow = style({
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
    padding: "14px 20px",
    position: "relative",
})

export const journeyRail = style({
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    alignSelf: "stretch",
    width: 12,
    paddingTop: 5,
})

export const journeyBullet = style({
    width: 9,
    height: 9,
    borderRadius: "50%",
    background: accent,
    boxShadow: `0 0 0 1px ${border}`,
    flexShrink: 0,
})

export const journeyLine = style({
    flex: 1,
    width: 1,
    background: border,
    marginTop: 4,
})

export const journeyStep = style({
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: secondary,
})

export const journeyTitle = style({
    fontSize: 15,
    fontWeight: 700,
    margin: "2px 0 3px",
})

export const journeyDescription = style({
    fontSize: 13,
    lineHeight: 1.55,
    color: secondary,
    margin: 0,
})

/* ---------------------------------------------------------- shipment board */

export const board = style({
    background: surface,
    border: `1px solid ${border}`,
    borderRadius: 14,
    overflow: "hidden",
})

export const boardHeader = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: "12px 16px",
    borderBottom: `1px solid ${border}`,
    background: surfaceAlt,
})

export const boardTitle = style({
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 0.35,
    textTransform: "uppercase",
    color: secondary,
})

export const boardLive = style({
    fontSize: 11,
    fontWeight: 700,
    color: "#166534",
    display: "flex",
    alignItems: "center",
    gap: 6,
})

export const boardTable = style({
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
})

globalStyle(`${boardTable} th`, {
    textAlign: "left",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 0.2,
    color: secondary,
    padding: "8px 16px",
    borderBottom: `1px solid ${border}`,
})

globalStyle(`${boardTable} td`, {
    padding: "10px 16px",
    borderBottom: `1px solid ${border}`,
    fontWeight: 600,
    lineHeight: 1.3,
    verticalAlign: "middle",
})

globalStyle(`${boardTable} tr:last-child td`, {
    borderBottom: "none",
})

export const refCell = style({
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
})

export const laneCell = style({
    whiteSpace: "nowrap",
})

export const mutedCell = style({
    color: secondary,
    fontWeight: 400,
})

export const statusPill = style({
    display: "inline-flex",
    alignItems: "center",
    minHeight: 22,
    borderRadius: 999,
    padding: "0 10px",
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: "nowrap",
})

export const hideNarrow = style({
    "@media": {
        "screen and (max-width: 640px)": { display: "none" },
    },
})

/* ----------------------------------------------------- partners & certs */

export const certRow = style({
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
})

export const certChip = style({
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: surface,
    border: `1px solid ${border}`,
    borderRadius: 999,
    padding: "8px 14px",
})

export const certCode = style({
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 0.5,
})

export const certLabel = style({
    fontSize: 12,
    color: secondary,
})

export const partnerRow = style({
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "14px 28px",
    marginTop: 26,
})

export const partnerMark = style({
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: "#a8a8a8",
})

/* ----------------------------------------------------------------- footer */

export const contactBand = style({
    marginTop: 64,
    background: ink,
    borderRadius: 14,
    color: paper,
    padding: "44px 40px",
    display: "flex",
    flexDirection: "column",
    gap: 18,
    "@media": {
        "screen and (max-width: 640px)": { padding: "32px 24px" },
    },
})

export const contactStatement = style({
    fontFamily: serif,
    fontWeight: 900,
    fontSize: "clamp(26px, 4vw, 40px)",
    lineHeight: 1.15,
    margin: 0,
    maxWidth: 560,
})

export const contactActions = style({
    display: "flex",
    alignItems: "center",
    gap: 18,
    flexWrap: "wrap",
})

export const contactButton = style({
    fontFamily: sans,
    fontSize: 14,
    fontWeight: 600,
    color: ink,
    background: paper,
    border: `1px solid ${paper}`,
    borderRadius: 5,
    padding: "12px 22px",
    textDecoration: "none",
    display: "inline-block",
    transition: "opacity 120ms ease",
    ":hover": { opacity: 0.85 },
})

export const contactMeta = style({
    fontSize: 13,
    color: "#b6bcc8",
})

export const footer = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "26px 0 0",
    fontSize: 12,
    color: secondary,
    flexWrap: "wrap",
})
