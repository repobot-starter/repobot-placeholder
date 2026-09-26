import { globalStyle, style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { scaledSpace } from "./theme/feelBridge"
import {
    ATOMIC_ROOT,
    LACQUER_ROOT,
    METALLIC_ROOT,
    atomicStar,
    chromeFill,
    ctaPrimary,
    goldFill,
    metalText,
    section,
    spot1,
    spot2,
} from "./shared.css"

export const wrap = section

/** The board: framed in ink, so the head and foot bands read as one card. */
export const board = style({
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.text}`,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
    overflow: "hidden",
})

export const head = style({
    background: marketing.color.text,
    color: marketing.color.pageBg,
    padding: `${scaledSpace(26)} ${scaledSpace(34)} ${scaledSpace(24)}`,
    "@media": {
        "(max-width: 640px)": { padding: `${scaledSpace(22)} ${scaledSpace(20)}` },
    },
})

export const kicker = style({
    display: "block",
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: marketing.color.accent,
    marginBottom: 6,
})

export const title = style({
    fontFamily: marketing.font.display,
    fontSize: `calc(clamp(28px, 3.6vw, 42px) * ${marketing.display.scale})`,
    fontWeight: marketing.display.weight,
    letterSpacing: marketing.display.tracking,
    textTransform: marketing.display.transform as "none",
    lineHeight: 1.05,
    color: "inherit",
    margin: 0,
})

export const intro = style({
    fontSize: 16,
    fontWeight: 600,
    lineHeight: 1.45,
    margin: "8px 0 0",
    opacity: 0.86,
})

export const groups = style({
    display: "grid",
    gridTemplateColumns: "1fr",
    padding: `${scaledSpace(10)} ${scaledSpace(34)} ${scaledSpace(18)}`,
    "@media": {
        "(max-width: 640px)": { padding: `${scaledSpace(6)} ${scaledSpace(18)} ${scaledSpace(14)}` },
    },
})

/** Several groups sit side by side on wide screens, ruled apart. */
export const groupsColumns = style({
    "@media": {
        "(min-width: 900px)": {
            gridTemplateColumns: "1fr 1fr",
            columnGap: scaledSpace(56),
        },
    },
})

export const group = style({
    paddingTop: scaledSpace(14),
})

export const groupHeading = style({
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontFamily: marketing.font.display,
    fontSize: 15,
    fontWeight: marketing.display.weight,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
    margin: "0 0 2px",
    selectors: {
        "&::before": {
            content: '""',
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: marketing.color.accent,
            flex: "none",
        },
    },
})

export const lines = style({
    listStyle: "none",
    margin: 0,
    padding: 0,
})

export const line = style({
    display: "flex",
    alignItems: "baseline",
    gap: 12,
    padding: `${scaledSpace(14)} 0`,
    borderBottom: `${marketing.shape.borderWidth} dashed ${marketing.color.line}`,
    selectors: {
        "&:last-child": { borderBottom: "none" },
    },
})

export const item = style({
    display: "flex",
    flexDirection: "column",
    gap: 2,
    minWidth: 0,
    flex: "0 1 auto",
})

export const name = style({
    fontFamily: marketing.font.display,
    fontSize: "clamp(18px, 1.9vw, 22px)",
    fontWeight: marketing.display.weight,
    letterSpacing: marketing.display.tracking,
    lineHeight: 1.2,
    color: marketing.color.text,
})

export const note = style({
    fontSize: 13.5,
    fontWeight: 600,
    lineHeight: 1.35,
    color: marketing.color.subtle,
})

/** The dotted leader: round dots in the accent, riding the name's baseline. */
export const leader = style({
    flex: "1 1 24px",
    minWidth: 18,
    height: 6,
    alignSelf: "baseline",
    color: marketing.color.accent,
    opacity: 0.7,
    backgroundImage: "radial-gradient(circle, currentColor 1.6px, transparent 1.9px)",
    backgroundSize: "10px 6px",
    backgroundRepeat: "repeat-x",
    backgroundPosition: "left center",
})

export const price = style({
    flex: "none",
    fontFamily: marketing.font.display,
    fontSize: `calc(clamp(26px, 3vw, 36px) * ${marketing.display.scale})`,
    fontWeight: marketing.display.weight,
    letterSpacing: "-0.01em",
    lineHeight: 1,
    color: marketing.color.accent,
    fontVariantNumeric: "tabular-nums",
})

export const qualifier = style({
    fontFamily: marketing.font.body,
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
    verticalAlign: "0.5em",
})

export const foot = style({
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    background: marketing.color.text,
    color: marketing.color.pageBg,
    padding: `${scaledSpace(18)} ${scaledSpace(34)}`,
    "@media": {
        "(max-width: 640px)": { padding: `${scaledSpace(18)} ${scaledSpace(20)}` },
    },
})

export const footnote = style({
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1.4,
    margin: 0,
})

export const cta = style([ctaPrimary, { flex: "none" }])

/*
 * metallic: the style menu as a cover's inside page — the board on the
 * plum stock, framed in gold with a glint at the edge; the title cast in
 * chrome, the groups headed in gold condensed caps behind a sparkle, the
 * names in condensed caps, the prices cast in gold. The head and foot
 * bands dissolve into the board instead of reversing out.
 */
globalStyle(`${METALLIC_ROOT} ${board}`, {
    border: `1px solid ${spot1}`,
    background: `linear-gradient(180deg, color-mix(in srgb, ${marketing.color.surface} 94%, ${spot1}) 0%, ${marketing.color.surface} 40%)`,
})

globalStyle(`${METALLIC_ROOT} ${head}, ${METALLIC_ROOT} ${foot}`, {
    background: "transparent",
    color: marketing.color.text,
})

globalStyle(`${METALLIC_ROOT} ${head}`, {
    borderBottom: `1px solid color-mix(in srgb, ${spot1} 45%, transparent)`,
    paddingTop: 34,
})

globalStyle(`${METALLIC_ROOT} ${foot}`, {
    borderTop: `1px solid color-mix(in srgb, ${spot1} 45%, transparent)`,
})

globalStyle(`${METALLIC_ROOT} ${kicker}`, {
    fontFamily: marketing.font.display,
    fontStretch: "72%",
    fontSize: 15,
    letterSpacing: "0.26em",
    color: spot1,
    marginBottom: 12,
})

globalStyle(`${METALLIC_ROOT} ${title}`, {
    ...metalText(chromeFill),
    fontStyle: "italic",
    fontStretch: "112%",
    fontWeight: 900,
    fontSize: "clamp(32px, 4.6vw, 60px)",
    lineHeight: 1,
})

globalStyle(`${METALLIC_ROOT} ${intro}`, {
    fontWeight: 500,
    color: marketing.color.subtle,
    marginTop: 14,
})

globalStyle(`${METALLIC_ROOT} ${groupHeading}`, {
    fontStretch: "72%",
    fontWeight: 900,
    fontSize: 18,
    letterSpacing: "0.2em",
    color: spot1,
})

globalStyle(`${METALLIC_ROOT} ${groupHeading}::before`, {
    content: '"\\2726"',
    width: "auto",
    height: "auto",
    borderRadius: 0,
    background: "none",
    color: marketing.color.accent,
    fontSize: 16,
})

globalStyle(`${METALLIC_ROOT} ${line}`, {
    borderBottomStyle: "solid",
    borderBottomColor: `color-mix(in srgb, ${marketing.color.line} 80%, transparent)`,
})

globalStyle(`${METALLIC_ROOT} ${name}`, {
    fontStretch: "80%",
    fontWeight: 800,
    fontSize: "clamp(19px, 1.9vw, 24px)",
    textTransform: "uppercase",
    letterSpacing: "0.01em",
})

globalStyle(`${METALLIC_ROOT} ${leader}`, { color: spot1, opacity: 0.55 })

globalStyle(`${METALLIC_ROOT} ${price}`, {
    ...metalText(goldFill, "0.025em"),
    fontStyle: "italic",
    fontStretch: "92%",
    fontWeight: 900,
    fontSize: "clamp(28px, 3vw, 40px)",
})

globalStyle(`${METALLIC_ROOT} ${qualifier}`, {
    fontFamily: marketing.font.display,
    fontStretch: "75%",
    fontStyle: "normal",
    color: marketing.color.text,
    WebkitTextFillColor: marketing.color.text,
})

globalStyle(`${METALLIC_ROOT} ${footnote}`, {
    fontWeight: 500,
    color: marketing.color.subtle,
})

/*
 * lacquer: the rate card as a counter card — black, one blush hairline
 * frame, the Didone title at fashion scale, groups in tiny spaced caps
 * behind a lipstick dash, names in the Didone, prices in lipstick,
 * the leaders a single hairline.
 */
globalStyle(`${LACQUER_ROOT} ${board}`, {
    background: marketing.color.pageBg,
    border: `1px solid color-mix(in srgb, ${spot1} 45%, transparent)`,
    borderRadius: 0,
    boxShadow: "none",
})

globalStyle(`${LACQUER_ROOT} ${head}, ${LACQUER_ROOT} ${foot}`, {
    background: "transparent",
    color: marketing.color.text,
})

globalStyle(`${LACQUER_ROOT} ${head}`, {
    padding: "44px 40px 30px",
    borderBottom: `1px solid color-mix(in srgb, ${spot1} 25%, transparent)`,
})

globalStyle(`${LACQUER_ROOT} ${foot}`, {
    borderTop: `1px solid color-mix(in srgb, ${spot1} 25%, transparent)`,
})

globalStyle(`${LACQUER_ROOT} ${kicker}`, {
    fontWeight: 500,
    fontSize: 11,
    letterSpacing: "0.42em",
    color: spot1,
    marginBottom: 14,
})

globalStyle(`${LACQUER_ROOT} ${title}`, {
    fontWeight: 500,
    fontSize: "clamp(34px, 5vw, 64px)",
    lineHeight: 1,
})

globalStyle(`${LACQUER_ROOT} ${intro}`, {
    fontWeight: 400,
    fontSize: 14,
    letterSpacing: "0.02em",
    color: marketing.color.subtle,
    marginTop: 14,
})

globalStyle(`${LACQUER_ROOT} ${groupHeading}`, {
    fontFamily: marketing.font.body,
    fontWeight: 500,
    fontSize: 11,
    letterSpacing: "0.42em",
    color: spot1,
    margin: "10px 0 4px",
})

globalStyle(`${LACQUER_ROOT} ${groupHeading}::before`, {
    width: 22,
    height: 1,
    borderRadius: 0,
})

globalStyle(`${LACQUER_ROOT} ${line}`, {
    borderBottom: `1px solid color-mix(in srgb, ${spot1} 16%, transparent)`,
})

globalStyle(`${LACQUER_ROOT} ${name}`, {
    fontWeight: 500,
    fontSize: "clamp(18px, 1.7vw, 22px)",
    letterSpacing: "0.02em",
})

globalStyle(`${LACQUER_ROOT} ${note}`, {
    fontWeight: 400,
    fontSize: 12.5,
    letterSpacing: "0.04em",
})

globalStyle(`${LACQUER_ROOT} ${leader}`, {
    height: 1,
    alignSelf: "center",
    backgroundImage: "none",
    background: `color-mix(in srgb, ${spot1} 30%, transparent)`,
    opacity: 1,
})

globalStyle(`${LACQUER_ROOT} ${price}`, {
    fontWeight: 500,
    fontSize: "clamp(24px, 2.4vw, 32px)",
    letterSpacing: "0",
})

globalStyle(`${LACQUER_ROOT} ${qualifier}`, {
    fontWeight: 500,
    fontSize: 10,
    letterSpacing: "0.3em",
    verticalAlign: "0.4em",
})

globalStyle(`${LACQUER_ROOT} ${footnote}`, {
    fontWeight: 400,
    fontSize: 13,
    letterSpacing: "0.06em",
    color: marketing.color.subtle,
})

/*
 * `atomic` (midcentury): the fee board as the catalog's price page. The
 * head and foot bands are walnut (the text ink warmed with the orange);
 * lines run on the stock with ink-dotted leaders; prices sit in the
 * condensed caps in the burnt-orange ink; each group opens on an olive
 * atomic star.
 */
const WALNUT = `color-mix(in srgb, ${spot1} 24%, ${marketing.color.text})`

globalStyle(`${ATOMIC_ROOT} ${board}`, {
    borderColor: WALNUT,
})

globalStyle(`${ATOMIC_ROOT} ${head}, ${ATOMIC_ROOT} ${foot}`, {
    background: WALNUT,
})

globalStyle(`${ATOMIC_ROOT} ${kicker}`, {
    fontWeight: 600,
    letterSpacing: "0.24em",
})

globalStyle(`${ATOMIC_ROOT} ${title}`, {
    fontSize: `calc(clamp(28px, 3.4vw, 40px) * ${marketing.display.scale})`,
    lineHeight: 1,
})

globalStyle(`${ATOMIC_ROOT} ${intro}`, {
    fontWeight: 400,
    opacity: 0.9,
})

globalStyle(`${ATOMIC_ROOT} ${groupHeading}`, {
    fontFamily: marketing.font.body,
    fontSize: 12.5,
    fontWeight: 600,
    letterSpacing: "0.2em",
    color: marketing.color.text,
})

globalStyle(`${ATOMIC_ROOT} ${groupHeading}::before`, {
    ...atomicStar(16, spot2),
    borderRadius: 0,
})

globalStyle(`${ATOMIC_ROOT} ${line}`, {
    borderBottomStyle: "solid",
})

globalStyle(`${ATOMIC_ROOT} ${name}`, {
    fontSize: "clamp(18px, 1.8vw, 21px)",
    textTransform: "uppercase",
})

globalStyle(`${ATOMIC_ROOT} ${note}`, {
    fontWeight: 400,
    fontSize: 13.5,
    lineHeight: 1.45,
})

globalStyle(`${ATOMIC_ROOT} ${leader}`, {
    color: marketing.color.text,
    opacity: 0.45,
    backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1.3px)",
    backgroundSize: "7px 6px",
})

globalStyle(`${ATOMIC_ROOT} ${price}`, {
    fontSize: "clamp(24px, 2.6vw, 34px)",
    letterSpacing: "0.01em",
    color: spot1,
})

globalStyle(`${ATOMIC_ROOT} ${qualifier}`, {
    fontWeight: 600,
    letterSpacing: "0.16em",
    marginRight: 6,
})

globalStyle(`${ATOMIC_ROOT} ${footnote}`, {
    fontSize: 15,
    fontWeight: 500,
    letterSpacing: "0.02em",
})
