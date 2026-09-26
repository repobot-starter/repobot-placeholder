import { style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { scaledSpace } from "./theme/feelBridge"
import { ctaPrimary, section } from "./shared.css"

export const wrap = section

/** The board: one framed card, head band to total, like the menu board. */
export const board = style({
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
    padding: `${scaledSpace(26)} ${scaledSpace(34)} ${scaledSpace(24)}`,
    "@media": {
        "(max-width: 640px)": { padding: `${scaledSpace(20)} ${scaledSpace(16)}` },
    },
})

export const head = style({
    textAlign: "center",
    marginBottom: scaledSpace(16),
})

export const kicker = style({
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: marketing.color.accent,
    marginBottom: 6,
})

export const title = style({
    fontFamily: marketing.font.display,
    fontSize: "clamp(20px, 2.2vw, 26px)",
    fontWeight: marketing.display.weight,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    lineHeight: 1.2,
    color: marketing.color.text,
    margin: 0,
})

export const intro = style({
    fontSize: 15,
    lineHeight: 1.5,
    color: marketing.color.subtle,
    margin: "8px 0 0",
})

export const group = style({
    border: "none",
    margin: 0,
    padding: 0,
    minWidth: 0,
})

export const groupHeading = style({
    display: "block",
    width: "100%",
    padding: `0 0 ${scaledSpace(8)}`,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    textAlign: "center",
    color: marketing.color.subtle,
    borderBottom: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
})

export const lines = style({
    listStyle: "none",
    margin: 0,
    padding: 0,
})

/** A row: the ticked name, what's included, the price — three columns on wide screens. */
export const line = style({
    display: "grid",
    gridTemplateColumns: "minmax(150px, 1fr) minmax(0, 2fr) auto",
    alignItems: "center",
    gap: scaledSpace(16),
    padding: `${scaledSpace(12)} 0`,
    borderBottom: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    transition: "opacity 160ms ease",
    selectors: {
        '&[data-ticked="false"]': { opacity: 0.55 },
    },
    "@media": {
        "(max-width: 640px)": {
            gridTemplateColumns: "1fr auto",
            rowGap: 4,
        },
    },
})

export const pick = style({
    display: "flex",
    alignItems: "center",
    gap: 12,
    cursor: "pointer",
    minWidth: 0,
})

/** The real checkbox, kept focusable and read aloud; `box` paints it. */
export const check = style({
    position: "absolute",
    opacity: 0,
    width: 1,
    height: 1,
    margin: 0,
})

export const box = style({
    flex: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 20,
    height: 20,
    boxSizing: "border-box",
    border: `1.5px solid ${marketing.color.accent}`,
    borderRadius: marketing.shape.radiusControl,
    color: marketing.color.onAccent,
    selectors: {
        [`${check}:checked + &`]: { background: marketing.color.accent },
        [`${check}:checked + &::after`]: {
            content: '"✓"',
            fontSize: 13,
            fontWeight: 700,
            lineHeight: 1,
        },
        [`${check}:focus-visible + &`]: {
            outline: `2px solid ${marketing.color.accent}`,
            outlineOffset: 2,
        },
    },
})

export const name = style({
    fontFamily: marketing.font.display,
    fontSize: "clamp(17px, 1.7vw, 20px)",
    fontWeight: marketing.display.weight,
    letterSpacing: marketing.display.tracking,
    lineHeight: 1.2,
    color: marketing.color.text,
})

export const note = style({
    fontSize: 14,
    lineHeight: 1.4,
    textAlign: "center",
    color: marketing.color.subtle,
    "@media": {
        "(max-width: 640px)": {
            gridColumn: "1 / -1",
            gridRow: 2,
            textAlign: "left",
            paddingLeft: 32,
        },
    },
})

export const price = style({
    fontFamily: marketing.font.display,
    fontSize: "clamp(18px, 1.9vw, 22px)",
    fontWeight: marketing.display.weight,
    lineHeight: 1,
    textAlign: "right",
    color: marketing.color.text,
    fontVariantNumeric: "tabular-nums",
})

export const qualifier = style({
    fontFamily: marketing.font.body,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
})

/** The running total: its own ruled band under the lines. */
export const total = style({
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
    marginTop: scaledSpace(16),
    padding: `${scaledSpace(14)} ${scaledSpace(18)}`,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
})

export const totalLabel = style({
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
})

export const totalValue = style({
    fontFamily: marketing.font.display,
    fontSize: `calc(clamp(26px, 3vw, 36px) * ${marketing.display.scale})`,
    fontWeight: marketing.display.weight,
    lineHeight: 1,
    color: marketing.color.accent,
    fontVariantNumeric: "tabular-nums",
})

export const foot = style({
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    marginTop: scaledSpace(18),
})

export const footnote = style({
    fontSize: 14,
    lineHeight: 1.45,
    color: marketing.color.subtle,
    margin: 0,
})

export const cta = ctaPrimary

/*
 * `builderLayout: "tiles"` — the session builder: groups of photograph
 * tiles beside a summary card that lists the ticked lines over the total.
 */
export const tilesLayout = style({
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(260px, 330px)",
    alignItems: "start",
    gap: scaledSpace(24),
    textAlign: "left",
    "@media": {
        "(max-width: 980px)": { gridTemplateColumns: "1fr" },
    },
})

export const tileGroups = style({
    display: "grid",
    gap: scaledSpace(16),
    minWidth: 0,
})

export const tileGroup = style({
    margin: 0,
    minWidth: 0,
    padding: `${scaledSpace(14)} ${scaledSpace(18)} ${scaledSpace(18)}`,
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
})

export const tileGroupHeading = style({
    float: "left",
    width: "100%",
    padding: `0 0 ${scaledSpace(12)}`,
    fontFamily: marketing.font.display,
    fontSize: 18,
    fontWeight: marketing.display.weight,
    letterSpacing: marketing.display.tracking,
    color: marketing.color.text,
})

export const tiles = style({
    clear: "both",
    display: "grid",
    // Three tiles a row wherever a third is at least 124px, else two or one.
    gridTemplateColumns: `repeat(auto-fill, minmax(max(min(100%, 124px), calc((100% - 2 * ${scaledSpace(12)}) / 3)), 1fr))`,
    gap: scaledSpace(12),
    listStyle: "none",
    margin: 0,
    padding: 0,
})

export const tile = style({
    position: "relative",
    background: marketing.color.pageBg,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    overflow: "hidden",
    transition: "border-color 160ms ease, background-color 160ms ease",
    selectors: {
        '&[data-ticked="true"]': {
            borderColor: marketing.color.accent,
            background: `color-mix(in srgb, ${marketing.color.accent} 7%, ${marketing.color.surface})`,
        },
    },
})

export const tilePick = style({
    display: "flex",
    flexDirection: "column",
    gap: 3,
    height: "100%",
    padding: `8px 8px ${scaledSpace(12)}`,
    cursor: "pointer",
})

export const tileMedia = style({
    position: "relative",
    display: "block",
    aspectRatio: "4 / 3",
    marginBottom: 8,
    overflow: "hidden",
    borderRadius: `calc(${marketing.shape.radiusCard} * 0.6)`,
    background: marketing.color.line,
})

export const tileImg = style({
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "cover",
})

/** The tile's check, painted in the photograph's corner. */
export const tileBox = style({
    position: "absolute",
    top: 8,
    right: 8,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 22,
    height: 22,
    boxSizing: "border-box",
    border: `1.5px solid ${marketing.color.line}`,
    borderRadius: "50%",
    background: marketing.color.surface,
    color: marketing.color.onAccent,
    selectors: {
        [`${check}:checked + ${tileMedia} &`]: {
            background: marketing.color.accent,
            borderColor: marketing.color.accent,
        },
        [`${check}:checked + ${tileMedia} &::after`]: {
            content: '"✓"',
            fontSize: 12,
            fontWeight: 700,
            lineHeight: 1,
        },
        [`${check}:focus-visible + ${tileMedia} &`]: {
            outline: `2px solid ${marketing.color.accent}`,
            outlineOffset: 2,
        },
    },
})

export const tileName = style({
    fontSize: 14.5,
    fontWeight: 500,
    lineHeight: 1.3,
    color: marketing.color.text,
})

export const tileNote = style({
    fontSize: 12.5,
    lineHeight: 1.35,
    color: marketing.color.subtle,
})

export const tilePrice = style({
    marginTop: "auto",
    paddingTop: 2,
    fontSize: 13.5,
    color: marketing.color.subtle,
    fontVariantNumeric: "tabular-nums",
})

/** The summary card: the ticked lines, the total, the ask. */
export const summary = style({
    position: "sticky",
    top: scaledSpace(96),
    padding: `${scaledSpace(24)} ${scaledSpace(22)}`,
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
    "@media": {
        "(max-width: 980px)": { position: "static" },
    },
})

export const summaryTitle = style({
    fontFamily: marketing.font.display,
    fontSize: "clamp(20px, 2vw, 24px)",
    fontWeight: marketing.display.weight,
    letterSpacing: marketing.display.tracking,
    textAlign: "center",
    color: marketing.color.text,
    margin: 0,
    paddingBottom: scaledSpace(16),
    borderBottom: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
})

export const summaryLines = style({
    listStyle: "none",
    margin: `${scaledSpace(8)} 0 0`,
    padding: 0,
})

export const summaryLine = style({
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    padding: `${scaledSpace(10)} 0`,
    fontSize: 14.5,
    lineHeight: 1.35,
    color: marketing.color.text,
})

export const summaryPrice = style({
    flex: "none",
    fontVariantNumeric: "tabular-nums",
})

export const summaryTotal = style({
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
    marginTop: scaledSpace(10),
    paddingTop: scaledSpace(18),
    borderTop: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
})

export const summaryCta = style({
    display: "grid",
    marginTop: scaledSpace(20),
})
