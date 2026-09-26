import { globalStyle, style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { scaledSpace } from "./theme/feelBridge"
import { captionFontStack, section, sectionHeaderCentered, sectionKicker, sectionTitle } from "./shared.css"

/*
 * `tickets`: printed season tickets. The stock and its ink are paper, not
 * page: a ticket reads as the same printed object on every register and
 * in both appearances, so those two are fixed; the band carries the
 * register's accent. The stub height is fixed so the perforation's notches
 * (a mask on the whole ticket) land exactly on the tear line.
 */
const STOCK = "#fbfbf5" // theme-exempt: ticket paper stock prints the same in every theme
const INK = "#0b140e" // theme-exempt: ticket print ink on the paper stock
const STUB_HEIGHT = 84
const NOTCH = 11

export const wrap = style([section, sectionHeaderCentered])

export const kicker = sectionKicker

export const title = sectionTitle

export const grid = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(264px, 1fr))",
    gap: scaledSpace(26),
    alignItems: "stretch",
    textAlign: "left",
    paddingTop: 12,
})

export const ticket = style({
    position: "relative",
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    color: INK,
    // The drop shadow follows the notched mask on the child layers.
    filter: "drop-shadow(0 18px 26px rgba(0, 0, 0, 0.28))",
})

const notched = {
    // Two half-masks, each punching a notch at its own edge on the tear line.
    WebkitMask:
        `radial-gradient(circle ${NOTCH}px at 0 calc(100% - ${STUB_HEIGHT}px), transparent ${NOTCH - 0.5}px, black ${NOTCH}px) left / 51% 100% no-repeat, ` +
        `radial-gradient(circle ${NOTCH}px at 100% calc(100% - ${STUB_HEIGHT}px), transparent ${NOTCH - 0.5}px, black ${NOTCH}px) right / 51% 100% no-repeat`,
    mask:
        `radial-gradient(circle ${NOTCH}px at 0 calc(100% - ${STUB_HEIGHT}px), transparent ${NOTCH - 0.5}px, black ${NOTCH}px) left / 51% 100% no-repeat, ` +
        `radial-gradient(circle ${NOTCH}px at 100% calc(100% - ${STUB_HEIGHT}px), transparent ${NOTCH - 0.5}px, black ${NOTCH}px) right / 51% 100% no-repeat`,
} as const

/** The printed object: body, band, and stub, notched on the tear line. */
export const paper = style([notched, { flex: 1, display: "flex", flexDirection: "column" }])

export const body = style({
    position: "relative",
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    background: STOCK,
    borderRadius: `${marketing.shape.radiusCard} ${marketing.shape.radiusCard} 0 0`,
    padding: `${scaledSpace(26)} ${scaledSpace(64)} ${scaledSpace(22)} ${scaledSpace(26)}`,
    selectors: {
        // The tear-off tab: a dashed perforation down the right edge.
        "&::after": {
            content: '""',
            position: "absolute",
            top: 16,
            bottom: 16,
            right: 40,
            borderLeft: `2px dashed color-mix(in srgb, ${INK} 28%, transparent)`,
        },
    },
})

export const badge = style({
    position: "absolute",
    top: -14,
    right: 18,
    zIndex: 2,
    fontFamily: marketing.font.display,
    fontSize: 14,
    fontWeight: marketing.display.weight,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: marketing.color.onAccent,
    background: marketing.color.accent,
    padding: "6px 12px 5px",
    transform: "rotate(3deg)",
    boxShadow: `3px 3px 0 ${INK}`,
})

export const name = style({
    fontFamily: marketing.font.display,
    fontSize: "clamp(22px, 2.2vw, 28px)",
    fontWeight: marketing.display.weight,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    lineHeight: 1,
    color: INK,
    margin: 0,
})

export const price = style({
    fontFamily: marketing.font.display,
    fontSize: `calc(clamp(48px, 5vw, 62px) * ${marketing.display.scale} / 1.2)`,
    fontWeight: marketing.display.weight,
    letterSpacing: "-0.01em",
    lineHeight: 0.95,
    color: INK,
})

export const prefix = style({
    fontSize: "0.34em",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    verticalAlign: "0.9em",
})

export const period = style({
    fontFamily: marketing.font.body,
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: 0,
    textTransform: "lowercase",
})

export const features = style({
    listStyle: "none",
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: 0,
    margin: "6px 0 0",
    fontSize: 14,
    lineHeight: 1.4,
    color: `color-mix(in srgb, ${INK} 78%, transparent)`,
})

export const feature = style({
    display: "flex",
    gap: 8,
    alignItems: "baseline",
    selectors: {
        "&::before": {
            content: '""',
            flex: "none",
            width: 7,
            height: 7,
            background: INK,
            transform: "rotate(45deg) translateY(-1px)",
        },
    },
})

export const band = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    margin: 0,
    padding: "11px 26px 10px",
    fontFamily: marketing.font.display,
    fontSize: 17,
    fontWeight: marketing.display.weight,
    fontStyle: marketing.display.accentStyle,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    lineHeight: 1.15,
    color: marketing.color.onAccent,
    background: marketing.color.accent,
})

export const bandArrow = style({
    flex: "none",
    fontStyle: "normal",
    fontSize: 20,
})

export const stub = style([
    {
        position: "relative",
        height: STUB_HEIGHT,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: "0 26px",
        color: STOCK,
        background: INK,
        borderRadius: `0 0 ${marketing.shape.radiusCard} ${marketing.shape.radiusCard}`,
        selectors: {
            // The tear line: a dashed perforation between the notches.
            "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: NOTCH + 6,
                right: NOTCH + 6,
                borderTop: `2px dashed color-mix(in srgb, ${STOCK} 42%, transparent)`,
            },
        },
    },
])

export const stubCode = style({
    display: "flex",
    flexDirection: "column",
    gap: 6,
    minWidth: 0,
    flex: 1,
})

export const barcode = style({
    display: "block",
    width: "min(100%, 190px)",
    height: 30,
    fill: STOCK,
})

export const stubText = style({
    fontFamily: captionFontStack,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
})

export const diamond = style({
    flex: "none",
    width: 34,
    height: 34,
    fill: "currentColor",
    color: STOCK,
    selectors: {
        [`${ticket}[data-highlighted="true"] &`]: { color: marketing.color.accent },
    },
})

/*
 * `sport` (gameday): tickets sit high under the hero (the drop sells the
 * product in the first view), and the kicker becomes the ticket window's
 * banner — accent tape centered on a long accent streak.
 */
const SPORT_ROOT = '[data-marketing-treatment~="sport"]'

globalStyle(`${SPORT_ROOT} ${wrap}`, { paddingTop: scaledSpace(26) })

globalStyle(`${SPORT_ROOT} ${wrap} > ${kicker}`, {
    position: "relative",
    fontSize: 24,
    padding: "7px 26px 6px",
    marginBottom: scaledSpace(26),
})

globalStyle(`${SPORT_ROOT} ${wrap}::before`, {
    content: '""',
    display: "block",
    height: 4,
    margin: "0 auto -4px",
    maxWidth: 920,
    background: `linear-gradient(90deg, transparent, ${marketing.color.accent} 18%, ${marketing.color.accent} 82%, transparent)`,
    transform: "translateY(21px)",
})
