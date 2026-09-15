import { vars } from "@base/design-system/tokens"
import { globalStyle, keyframes, style, type StyleRule } from "@vanilla-extract/css"
import { palette } from "./palette"

/**
 * The QuickBooks Sync command center's art direction: a deliberately dark,
 * layered finance surface (the founder's explicit ask — this page forces
 * its own palette regardless of site theme). Charcoal washes, glass cards,
 * inflow data ink for money in, periwinkle for money out, amber for aging —
 * with tabular numerals everywhere and CSS entrance/draw-in motion.
 */

const sans = 'var(--pack-font, "Inter", system-ui, sans-serif)'

const cardSurface = `linear-gradient(180deg, ${palette.surfaceTop} 0%, ${palette.surfaceBottom} 100%)`
const cardShadow = "inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 24px 48px -28px rgba(0, 0, 0, 0.65)"

//
// Motion
//

const riseKeyframes = keyframes({
    from: { opacity: 0, transform: "translateY(14px)" },
    to: { opacity: 1, transform: "translateY(0)" },
})

const fadeKeyframes = keyframes({
    from: { opacity: 0 },
    to: { opacity: 1 },
})

const drawKeyframes = keyframes({
    from: { strokeDashoffset: 1 },
    to: { strokeDashoffset: 0 },
})

const growKeyframes = keyframes({
    from: { transform: "scaleY(0)" },
    to: { transform: "scaleY(1)" },
})

const growXKeyframes = keyframes({
    from: { transform: "scaleX(0)" },
    to: { transform: "scaleX(1)" },
})

const pulseKeyframes = keyframes({
    "0%": { boxShadow: `0 0 0 0 rgba(255, 255, 255, 0.35)` },
    "70%": { boxShadow: `0 0 0 6px rgba(255, 255, 255, 0)` },
    "100%": { boxShadow: `0 0 0 0 rgba(255, 255, 255, 0)` },
})

const reducedMotion: StyleRule["@media"] = {
    "(prefers-reduced-motion: reduce)": {
        animationName: "none",
        opacity: 1,
        transform: "none",
        strokeDashoffset: 0,
    },
}

function rise(delaySeconds: number): StyleRule {
    return {
        animation: `${riseKeyframes} 0.6s cubic-bezier(0.22, 1, 0.36, 1) both`,
        animationDelay: `${delaySeconds}s`,
        "@media": reducedMotion,
    }
}

//
// Page shell
//

/**
 * The ground and body ink ride the theme contract (the pack's catalog seeds
 * the same near-black values), so remixing the theme re-inks the stage; the
 * radial washes stay as translucent art over whatever ground the theme sets.
 */
export const page = style({
    minHeight: "100%",
    backgroundColor: vars.color.background,
    backgroundImage: [
        "radial-gradient(1200px 540px at 12% -12%, rgba(255, 255, 255, 0.05), transparent 62%)",
        "radial-gradient(1000px 480px at 88% -6%, rgba(255, 255, 255, 0.04), transparent 60%)",
        "radial-gradient(1400px 900px at 50% 120%, rgba(255, 255, 255, 0.03), transparent 65%)",
    ].join(", "),
    color: vars.color.textPrimary,
    fontFamily: sans,
    boxSizing: "border-box",
    paddingBottom: "4rem",
})

globalStyle(`${page} *, ${page} *::before, ${page} *::after`, {
    boxSizing: "inherit",
})

const container = style({
    width: "min(86rem, 100% - 3rem)",
    marginInline: "auto",
})

/** The status row above the stage: sync state, mode tag, disconnect. The
 * wordmark it used to share the topbar with now lives in the AppShell brand
 * slot, so this row only carries the connection story. */
export const toolbar = style([
    container,
    {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: "1rem",
        paddingBlock: "1.1rem 0.9rem",
        flexWrap: "wrap",
    },
])

export const tagline = style({
    color: palette.muted,
    fontSize: "0.85rem",
})

export const topbarActions = style({
    display: "flex",
    alignItems: "center",
    gap: "0.85rem",
})

export const stage = style([
    container,
    {
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
    },
])

/** Pre-connection states center their hero in the viewport. */
export const stageCentered = style({
    minHeight: "calc(100vh - 14rem)",
    justifyContent: "center",
})

//
// Live-sync affordance
//

export const syncPill = style({
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.4rem 0.85rem",
    borderRadius: "999px",
    border: `1px solid rgba(255, 255, 255, 0.22)`,
    background: "rgba(255, 255, 255, 0.05)",
    color: palette.inflowBright,
    fontSize: "0.78rem",
    fontWeight: 600,
    letterSpacing: "0.02em",
    whiteSpace: "nowrap",
})

export const syncDot = style({
    width: "0.5rem",
    height: "0.5rem",
    borderRadius: "999px",
    background: palette.inflow,
    animation: `${pulseKeyframes} 2.4s ease-out infinite`,
    "@media": {
        "(prefers-reduced-motion: reduce)": { animationName: "none" },
    },
})

export const modeTag = style({
    color: palette.faint,
    fontSize: "0.75rem",
    fontWeight: 500,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
})

//
// Connected header
//

export const heroRow = style([
    rise(0),
    {
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: "1rem",
        flexWrap: "wrap",
        paddingBlock: "0.35rem 0.4rem",
    },
])

export const companyName = style({
    margin: 0,
    fontSize: "1.9rem",
    lineHeight: 1.15,
    letterSpacing: "-0.02em",
    fontWeight: 700,
})

export const companyMeta = style({
    margin: "0.4rem 0 0",
    color: palette.muted,
    fontSize: "0.88rem",
})

//
// KPI strip
//

export const kpiGrid = style({
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "1.1rem",
    "@media": {
        "screen and (max-width: 68rem)": { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" },
        "screen and (max-width: 36rem)": { gridTemplateColumns: "minmax(0, 1fr)" },
    },
})

export const card = style({
    background: cardSurface,
    border: `1px solid ${palette.line}`,
    borderRadius: "1rem",
    padding: "1.15rem 1.3rem",
    boxShadow: cardShadow,
    minWidth: 0,
})

/** Entrance stagger, applied in DOM order across the dashboard. */
export const stagger = [
    rise(0.05),
    rise(0.11),
    rise(0.17),
    rise(0.23),
    rise(0.3),
    rise(0.38),
    rise(0.46),
    rise(0.54),
].map((rule) => style(rule))

export const kpiCard = style([
    card,
    {
        display: "flex",
        flexDirection: "column",
        gap: "0.55rem",
        position: "relative",
        overflow: "hidden",
    },
])

export const kpiTop = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.75rem",
})

export const kpiLabel = style({
    fontSize: "0.72rem",
    fontWeight: 600,
    letterSpacing: "0.13em",
    textTransform: "uppercase",
    color: palette.muted,
})

const kpiDeltaBase = style({
    display: "inline-flex",
    alignItems: "center",
    gap: "0.25rem",
    fontSize: "0.76rem",
    fontWeight: 700,
    fontVariantNumeric: "tabular-nums",
    padding: "0.14rem 0.5rem",
    borderRadius: "999px",
    whiteSpace: "nowrap",
})

export const kpiDeltaUp = style([
    kpiDeltaBase,
    { color: palette.inflowBright, background: palette.inflowSoft },
])

export const kpiDeltaDown = style([kpiDeltaBase, { color: palette.red, background: palette.redSoft }])

export const kpiDeltaFlat = style([kpiDeltaBase, { color: palette.muted, background: palette.inset }])

export const kpiValue = style({
    fontSize: "1.85rem",
    lineHeight: 1.1,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    fontVariantNumeric: "tabular-nums",
})

export const kpiValueMint = style({
    color: palette.inflowBright,
    textShadow: "0 0 26px rgba(255, 255, 255, 0.25)",
})

export const kpiBottom = style({
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "0.75rem",
    minHeight: "2.75rem",
})

export const kpiFoot = style({
    color: palette.faint,
    fontSize: "0.78rem",
    lineHeight: 1.45,
})

export const kpiFootWarn = style({
    color: palette.amber,
    fontWeight: 600,
})

export const kpiSpark = style({
    flexShrink: 0,
})

/** Mini stacked A/R composition bar (current → oldest). */
export const agingMiniTrack = style({
    display: "flex",
    width: "100%",
    height: "0.5rem",
    borderRadius: "999px",
    overflow: "hidden",
    background: palette.inset,
    gap: "2px",
})

const miniSegment = style({ height: "100%", minWidth: "2px" })

export const miniSegCurrent = style([miniSegment, { background: palette.inflow }])
export const miniSeg30 = style([miniSegment, { background: "#c9ced6" }])
export const miniSeg60 = style([miniSegment, { background: palette.amber }])
export const miniSeg90 = style([miniSegment, { background: palette.red }])

//
// Main grid
//

export const mainGrid = style({
    display: "grid",
    gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
    gap: "1.1rem",
    alignItems: "stretch",
})

export const spanHero = style({
    gridColumn: "span 8",
    "@media": {
        "screen and (max-width: 68rem)": { gridColumn: "span 12" },
    },
})

export const spanSide = style({
    gridColumn: "span 4",
    "@media": {
        "screen and (max-width: 68rem)": { gridColumn: "span 12" },
    },
})

export const spanThird = style({
    gridColumn: "span 4",
    "@media": {
        "screen and (max-width: 68rem)": { gridColumn: "span 6" },
        "screen and (max-width: 44rem)": { gridColumn: "span 12" },
    },
})

/** Cards whose last row should pin to the bottom (via margin-top auto). */
export const cardColumn = style({
    display: "flex",
    flexDirection: "column",
})

export const cardHead = style({
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: "1rem",
    marginBottom: "0.9rem",
    flexWrap: "wrap",
})

export const cardTitle = style({
    margin: 0,
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: palette.muted,
})

export const cardMeta = style({
    color: palette.faint,
    fontSize: "0.78rem",
    fontVariantNumeric: "tabular-nums",
})

//
// Charts
//

export const chartSvg = style({
    display: "block",
    width: "100%",
    height: "auto",
    fontFamily: sans,
})

export const chartFadeIn = style({
    animation: `${fadeKeyframes} 0.7s ease-out both`,
    animationDelay: "0.55s",
    "@media": reducedMotion,
})

export const chartLineDraw = style({
    strokeDasharray: 1,
    strokeDashoffset: 1,
    animation: `${drawKeyframes} 0.9s cubic-bezier(0.33, 1, 0.68, 1) forwards`,
    animationDelay: "0.25s",
    "@media": reducedMotion,
})

export const chartLineDrawSlow = style({
    strokeDasharray: 1,
    strokeDashoffset: 1,
    animation: `${drawKeyframes} 1.5s cubic-bezier(0.33, 1, 0.68, 1) forwards`,
    animationDelay: "0.45s",
    "@media": reducedMotion,
})

export const chartBarGrow = style({
    transformBox: "fill-box",
    transformOrigin: "bottom",
    transform: "scaleY(0)",
    animation: `${growKeyframes} 0.55s cubic-bezier(0.22, 1, 0.36, 1) both`,
    "@media": reducedMotion,
})

export const chartHitRect = style({
    fill: "transparent",
    selectors: {
        "&:hover": {
            fill: "rgba(255, 255, 255, 0.03)",
        },
    },
})

export const legend = style({
    display: "flex",
    alignItems: "center",
    gap: "1.1rem",
    flexWrap: "wrap",
})

export const legendItem = style({
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
    fontSize: "0.78rem",
    color: palette.muted,
    whiteSpace: "nowrap",
})

const swatch = style({
    width: "0.62rem",
    height: "0.62rem",
    borderRadius: "0.2rem",
    flexShrink: 0,
})

export const swatchIncome = style([swatch, { background: palette.inflow }])
export const swatchExpense = style([swatch, { background: palette.outflow }])
export const swatchNet = style([
    swatch,
    {
        height: "0.18rem",
        borderRadius: "999px",
        background: palette.inflowBright,
        boxShadow: "0 0 8px rgba(255, 255, 255, 0.6)",
    },
])

//
// Donut card
//

export const donutWrap = style({
    display: "flex",
    justifyContent: "center",
    paddingBlock: "0.35rem 0.9rem",
})

globalStyle(`${donutWrap} svg`, {
    maxWidth: "13.5rem",
})

export const donutLegend = style({
    margin: 0,
    padding: 0,
    listStyle: "none",
    display: "flex",
    flexDirection: "column",
    gap: "0.42rem",
})

export const donutLegendRow = style({
    display: "flex",
    alignItems: "center",
    gap: "0.55rem",
    fontSize: "0.83rem",
})

export const donutLegendLabel = style({
    flex: 1,
    minWidth: 0,
    color: palette.ink,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
})

export const donutLegendValue = style({
    fontVariantNumeric: "tabular-nums",
    fontWeight: 600,
    color: palette.ink,
})

export const donutLegendShare = style({
    fontVariantNumeric: "tabular-nums",
    color: palette.faint,
    fontSize: "0.76rem",
    width: "2.6rem",
    textAlign: "right",
})

export const donutSwatch = style([swatch, { borderRadius: "999px" }])

//
// A/R aging card
//

export const agingList = style({
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
    flex: 1,
    justifyContent: "space-evenly",
})

export const agingRow = style({
    display: "grid",
    gridTemplateColumns: "5.4rem minmax(0, 1fr) auto",
    alignItems: "center",
    columnGap: "0.8rem",
    rowGap: "0.3rem",
})

export const agingLabel = style({
    fontSize: "0.82rem",
    color: palette.muted,
    whiteSpace: "nowrap",
})

export const agingTrack = style({
    height: "0.55rem",
    borderRadius: "999px",
    background: palette.inset,
    overflow: "hidden",
})

const agingFillBase = style({
    height: "100%",
    borderRadius: "999px",
    minWidth: "2px",
    transformOrigin: "left",
    transform: "scaleX(0)",
    animation: `${growXKeyframes} 0.7s cubic-bezier(0.22, 1, 0.36, 1) both`,
    animationDelay: "0.4s",
    "@media": reducedMotion,
})

export const agingFillCurrent = style([
    agingFillBase,
    { background: `linear-gradient(90deg, ${palette.inflow}, ${palette.inflowBright})` },
])
export const agingFill30 = style([agingFillBase, { background: "#c9ced6" }])
export const agingFill60 = style([agingFillBase, { background: palette.amber }])
export const agingFill90 = style([
    agingFillBase,
    { background: `linear-gradient(90deg, ${palette.red}, #ff9a9e)` },
])

export const agingAmount = style({
    fontVariantNumeric: "tabular-nums",
    fontWeight: 600,
    fontSize: "0.88rem",
    whiteSpace: "nowrap",
    textAlign: "right",
})

export const agingCount = style({
    gridColumn: "2 / span 2",
    color: palette.faint,
    fontSize: "0.72rem",
})

export const agingTotalRow = style({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: "auto",
    paddingBottom: "0.15rem",
    paddingTop: "0.85rem",
    borderTop: `1px solid ${palette.lineSoft}`,
    fontSize: "0.84rem",
    color: palette.muted,
})

export const agingTotalValue = style({
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    fontSize: "1.05rem",
    color: palette.ink,
})

//
// Top customers card
//

export const custList = style({
    margin: 0,
    padding: 0,
    listStyle: "none",
    display: "flex",
    flexDirection: "column",
    gap: "0.72rem",
})

export const custRow = style({
    display: "flex",
    flexDirection: "column",
    gap: "0.3rem",
})

export const custHead = style({
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: "0.75rem",
})

export const custName = style({
    fontSize: "0.9rem",
    fontWeight: 600,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
})

export const custAmount = style({
    fontVariantNumeric: "tabular-nums",
    fontWeight: 600,
    fontSize: "0.88rem",
    whiteSpace: "nowrap",
})

export const custMetaRow = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.75rem",
    color: palette.faint,
    fontSize: "0.74rem",
})

export const custShareTrack = style({
    height: "0.3rem",
    borderRadius: "999px",
    background: palette.inset,
    overflow: "hidden",
})

export const custShareFill = style({
    height: "100%",
    borderRadius: "999px",
    background: `linear-gradient(90deg, rgba(255, 255, 255, 0.5), ${palette.inflow})`,
    transformOrigin: "left",
    transform: "scaleX(0)",
    animation: `${growXKeyframes} 0.7s cubic-bezier(0.22, 1, 0.36, 1) both`,
    animationDelay: "0.45s",
    "@media": reducedMotion,
})

//
// Invoice activity card
//

export const invList = style({
    margin: 0,
    padding: 0,
    listStyle: "none",
    display: "flex",
    flexDirection: "column",
})

export const invRow = style({
    display: "flex",
    alignItems: "center",
    gap: "0.7rem",
    paddingBlock: "0.55rem",
    borderTop: `1px solid ${palette.lineSoft}`,
    selectors: {
        "&:first-child": { borderTop: "none", paddingTop: 0 },
    },
})

export const invBody = style({
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: "0.12rem",
})

export const invName = style({
    fontSize: "0.86rem",
    fontWeight: 600,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
})

export const invMeta = style({
    color: palette.faint,
    fontSize: "0.73rem",
})

export const invAmount = style({
    fontVariantNumeric: "tabular-nums",
    fontWeight: 600,
    fontSize: "0.88rem",
    whiteSpace: "nowrap",
})

const pillBase = style({
    display: "inline-flex",
    alignItems: "center",
    gap: "0.32rem",
    fontSize: "0.68rem",
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    padding: "0.16rem 0.5rem",
    borderRadius: "999px",
    whiteSpace: "nowrap",
})

const pillDot = style({
    width: "0.32rem",
    height: "0.32rem",
    borderRadius: "999px",
    background: "currentColor",
})

export const statusDot = pillDot

export const pillPaid = style([
    pillBase,
    {
        color: palette.inflowBright,
        background: palette.inflowSoft,
        border: `1px solid rgba(255, 255, 255, 0.28)`,
    },
])

export const pillOpen = style([
    pillBase,
    {
        color: palette.slate,
        background: "rgba(255, 255, 255, 0.08)",
        border: `1px solid rgba(255, 255, 255, 0.25)`,
    },
])

export const pillOverdue = style([
    pillBase,
    { color: palette.red, background: palette.redSoft, border: `1px solid rgba(255, 128, 133, 0.3)` },
])

//
// Connect / sign-in hero
//

export const connectShell = style([
    card,
    rise(0.05),
    {
        padding: "2.6rem 2.8rem",
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 1fr)",
        gap: "2.6rem",
        alignItems: "center",
        overflow: "hidden",
        position: "relative",
        "@media": {
            "screen and (max-width: 60rem)": { gridTemplateColumns: "minmax(0, 1fr)", padding: "2rem" },
            ...reducedMotion,
        },
    },
])

export const connectCopy = style({
    display: "flex",
    flexDirection: "column",
    gap: "1.1rem",
    alignItems: "flex-start",
})

export const connectKicker = style({
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: palette.inflowBright,
})

export const connectTitle = style({
    margin: 0,
    fontSize: "2.3rem",
    lineHeight: 1.12,
    letterSpacing: "-0.025em",
    fontWeight: 700,
})

export const connectBody = style({
    margin: 0,
    color: palette.muted,
    fontSize: "0.98rem",
    lineHeight: 1.65,
    maxWidth: "34rem",
})

export const checklist = style({
    margin: 0,
    padding: 0,
    listStyle: "none",
    display: "flex",
    flexDirection: "column",
    gap: "0.55rem",
})

export const checkItem = style({
    display: "flex",
    alignItems: "center",
    gap: "0.6rem",
    color: palette.ink,
    fontSize: "0.88rem",
})

export const checkTick = style({
    width: "1.15rem",
    height: "1.15rem",
    borderRadius: "999px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: palette.inflowSoft,
    color: palette.inflowBright,
    fontSize: "0.7rem",
    fontWeight: 800,
    flexShrink: 0,
})

export const sandboxNote = style({
    margin: 0,
    fontSize: "0.83rem",
    lineHeight: 1.55,
    color: palette.inflowBright,
    background: "rgba(255, 255, 255, 0.05)",
    border: `1px solid rgba(255, 255, 255, 0.2)`,
    borderRadius: "0.6rem",
    padding: "0.65rem 0.9rem",
    maxWidth: "34rem",
})

export const connectActions = style({
    display: "flex",
    alignItems: "center",
    gap: "0.9rem",
    marginTop: "0.35rem",
})

/** The page's own primary CTA: a glowing inflow pill that owns the dark stage. */
export const ctaButton = style({
    appearance: "none",
    border: "1px solid rgba(255, 255, 255, 0.5)",
    borderRadius: "999px",
    padding: "0.72rem 1.6rem",
    fontFamily: "inherit",
    fontSize: "0.95rem",
    fontWeight: 700,
    letterSpacing: "0.01em",
    color: "#111111",
    background: `linear-gradient(180deg, ${palette.inflowBright} 0%, ${palette.inflow} 100%)`,
    boxShadow: "0 0 28px rgba(255, 255, 255, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.35)",
    cursor: "pointer",
    transition: "transform 150ms ease, box-shadow 150ms ease, filter 150ms ease",
    selectors: {
        "&:hover:not(:disabled)": {
            filter: "brightness(1.06)",
            boxShadow: "0 0 36px rgba(255, 255, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.35)",
            transform: "translateY(-1px)",
        },
        "&:active:not(:disabled)": {
            transform: "translateY(0)",
        },
        "&:disabled": {
            opacity: 0.55,
            cursor: "default",
        },
        "&:focus-visible": {
            outline: `2px solid ${palette.inflowBright}`,
            outlineOffset: "2px",
        },
    },
})

//
// Decorative dashboard preview beside the connect copy
//

export const previewPanel = style({
    position: "relative",
    display: "flex",
    justifyContent: "center",
    "@media": {
        "screen and (max-width: 60rem)": { display: "none" },
    },
})

export const previewGlow = style({
    position: "absolute",
    inset: "-12% -10%",
    background: "radial-gradient(60% 55% at 55% 45%, rgba(255, 255, 255, 0.09), transparent 70%)",
    pointerEvents: "none",
})

export const previewCard = style([
    rise(0.2),
    {
        position: "relative",
        width: "100%",
        maxWidth: "26rem",
        background: "linear-gradient(180deg, #191919 0%, #101010 100%)",
        border: `1px solid rgba(255, 255, 255, 0.14)`,
        borderRadius: "1rem",
        padding: "1.2rem 1.3rem 1.3rem",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 32px 64px -32px rgba(0,0,0,0.8)",
        transform: "perspective(1400px) rotateX(2deg) rotateY(-4deg)",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
    },
])

export const previewHead = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.75rem",
})

export const previewCompany = style({
    fontSize: "0.9rem",
    fontWeight: 700,
})

export const previewChips = style({
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "0.6rem",
})

export const previewChip = style({
    background: palette.inset,
    border: `1px solid ${palette.lineSoft}`,
    borderRadius: "0.65rem",
    padding: "0.6rem 0.75rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.18rem",
})

export const previewChipLabel = style({
    fontSize: "0.62rem",
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: palette.faint,
})

export const previewChipValue = style({
    fontSize: "1.05rem",
    fontWeight: 700,
    fontVariantNumeric: "tabular-nums",
    letterSpacing: "-0.01em",
})

export const previewChipDelta = style({
    fontSize: "0.68rem",
    fontWeight: 700,
    color: palette.inflowBright,
    fontVariantNumeric: "tabular-nums",
})

export const previewBars = style({
    display: "flex",
    alignItems: "flex-end",
    gap: "0.34rem",
    height: "3.4rem",
})

export const previewBar = style({
    flex: 1,
    borderRadius: "0.2rem 0.2rem 0 0",
    background: `linear-gradient(180deg, ${palette.inflow} 0%, rgba(255, 255, 255, 0.22) 100%)`,
    transformOrigin: "bottom",
    transform: "scaleY(0)",
    animation: `${growKeyframes} 0.6s cubic-bezier(0.22, 1, 0.36, 1) both`,
    animationDelay: "0.5s",
    "@media": reducedMotion,
})

//
// States
//

export const loadingWrap = style([
    container,
    {
        display: "flex",
        justifyContent: "center",
        paddingBlock: "7rem",
    },
])

export const errorCard = style([
    card,
    {
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
    },
])

export const errorText = style({
    margin: 0,
    color: palette.red,
    fontSize: "0.9rem",
})

export const footerActions = style({
    display: "flex",
    justifyContent: "flex-start",
})

export const emptyNote = style({
    margin: 0,
    color: palette.faint,
    fontSize: "0.85rem",
    paddingBlock: "1.4rem",
    textAlign: "center",
})
