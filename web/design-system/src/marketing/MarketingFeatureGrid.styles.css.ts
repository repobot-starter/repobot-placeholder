import { globalStyle, style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { scaledSpace } from "./theme/feelBridge"
import {
    LACQUER_ROOT,
    METALLIC_ROOT,
    MASKING_TAPE,
    POP,
    goldFill,
    TAPED_ROOT,
    TAPE_CLIP,
    mediaImage,
    metalText,
    scriptFont,
    section,
    sectionHeaderCentered,
    sectionKicker,
    sectionTitle,
    spot1,
    LARIAT_ROOT,
} from "./shared.css"

export const wrap = style([section, sectionHeaderCentered])

export const kicker = sectionKicker

export const title = sectionTitle

export const cardsGrid = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: scaledSpace(18),
    textAlign: "left",
})

export const listGrid = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: `${scaledSpace(18)} ${scaledSpace(32)}`,
    textAlign: "left",
})

export const card = style({
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
    padding: `${scaledSpace(22)} ${scaledSpace(22)} ${scaledSpace(24)}`,
})

export const listRow = style({
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
})

export const emoji = style({
    fontSize: 30,
    display: "block",
    marginBottom: 12,
})

export const listEmoji = style({
    fontSize: 24,
    lineHeight: "28px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    background: marketing.color.accentSoft,
    borderRadius: marketing.shape.radiusControl,
    padding: 8,
    flexShrink: 0,
})

/** Named icon in an accent-tinted tile — the non-emoji glyph treatment. */
export const iconTile = style({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 42,
    height: 42,
    marginBottom: 14,
    background: marketing.color.accentSoft,
    borderRadius: marketing.shape.radiusControl,
    color: marketing.color.accent,
})

export const listIconTile = style({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 42,
    height: 42,
    background: marketing.color.accentSoft,
    borderRadius: marketing.shape.radiusControl,
    color: marketing.color.accent,
    flexShrink: 0,
})

/*
 * `bento`: mixed-size cells over a 4-column grid. Wide cells span two
 * columns; cells with product crops let the media hug the bottom edge.
 */
export const bentoGrid = style({
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    // Dense flow backfills the wraps wide cells cause, so the grid stays
    // hole-free whatever the wide/narrow rhythm.
    gridAutoFlow: "dense",
    gap: scaledSpace(18),
    textAlign: "left",
    "@media": {
        "(max-width: 1020px)": { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" },
        "(max-width: 640px)": { gridTemplateColumns: "1fr" },
    },
})

export const bentoCell = style({
    display: "flex",
    flexDirection: "column",
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
    padding: `${scaledSpace(22)} ${scaledSpace(22)} ${scaledSpace(24)}`,
    overflow: "hidden",
})

export const bentoCellWide = style({
    gridColumn: "span 2",
    "@media": {
        "(max-width: 640px)": { gridColumn: "auto" },
    },
})

/* The crop bleeds to the cell's bottom and side edges. */
export const bentoMedia = style({
    marginTop: "auto",
    paddingTop: scaledSpace(18),
    margin: `auto calc(-1 * ${scaledSpace(22)}) calc(-1 * ${scaledSpace(24)})`,
    paddingLeft: scaledSpace(18),
    paddingRight: 0,
})

export const bentoMediaImg = style({
    display: "block",
    width: "100%",
    // Beat the intrinsic height attribute — the crop scales to the cell.
    height: "auto",
    // The crop runs off the cell's right and bottom edges; only its
    // top-left corner is visible, so that's the only radius it needs.
    borderTopLeftRadius: marketing.shape.radiusControl,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    boxShadow: marketing.shape.shadowCard,
})

export const featureTitle = style({
    fontFamily: marketing.font.display,
    fontSize: 17,
    fontWeight: 700,
    color: marketing.color.text,
    margin: "0 0 8px",
})

export const featureDescription = style({
    fontSize: 14.5,
    lineHeight: 1.6,
    color: marketing.color.subtle,
    margin: 0,
})

/*
 * `checklist`: one door-hanger card of ticked rows, optionally hung beside
 * a photograph. The hanger is a real cut shape — an arched crown with a
 * punched hole (a mask, so the page shows through) — and the wrapper
 * carries the elevation as a drop-shadow filter, because a masked element
 * clips its own box-shadow away.
 */
export const checklistLayout = style({
    display: "grid",
    justifyItems: "center",
    textAlign: "left",
})

export const checklistLayoutMedia = style({
    gridTemplateColumns: "minmax(0, 1.25fr) minmax(0, 0.75fr)",
    alignItems: "center",
    justifyItems: "stretch",
    "@media": {
        "(max-width: 860px)": { gridTemplateColumns: "1fr" },
    },
})

export const checklistMedia = style({
    minWidth: 0,
})

export const checklistMediaImg = style([
    mediaImage,
    {
        aspectRatio: "4 / 3",
        objectFit: "cover",
    },
])

const HANGER_HOLE = "radial-gradient(circle at 50% 38px, transparent 15px, black 15.5px)"

export const checklistHanger = style({
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: 400,
    justifySelf: "center",
    filter: `drop-shadow(0 18px 30px color-mix(in srgb, ${marketing.color.text} 14%, transparent))`,
    "@media": {
        "(max-width: 860px)": {
            selectors: {
                [`${checklistLayoutMedia} &`]: { marginLeft: 0, marginTop: -64, maxWidth: 360 },
                // A tall card swings wide at the foot; keep the tilt small
                // so the corner stays inside a phone's gutter.
                [POP]: { transform: "rotate(1deg)" },
            },
        },
    },
    selectors: {
        // Hung over the photograph's edge, the way the card hangs on a
        // handle: overlapping, not boxed off beside it.
        [`${checklistLayoutMedia} &`]: { marginLeft: "-18%" },
        [POP]: {
            filter: `drop-shadow(6px 6px 0 ${marketing.color.line})`,
            transform: "rotate(2.5deg)",
            transformOrigin: "50% 0",
        },
    },
})

export const checklistCard = style({
    position: "relative",
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    // The arched crown of a door hanger over squared shoulders.
    borderRadius: `200px 200px ${marketing.shape.radiusCard} ${marketing.shape.radiusCard} / 90px 90px ${marketing.shape.radiusCard} ${marketing.shape.radiusCard}`,
    padding: `78px ${scaledSpace(30)} ${scaledSpace(30)}`,
    WebkitMaskImage: HANGER_HOLE,
    maskImage: HANGER_HOLE,
    selectors: {
        // The punched hole's rim.
        "&::before": {
            content: '""',
            position: "absolute",
            top: 38 - 19,
            left: "calc(50% - 19px)",
            width: 38,
            height: 38,
            borderRadius: "50%",
            border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
        },
        // Hover lift is for card grids; a hanging card stays put.
        "&:hover": { transform: "none" },
        [POP]: {
            borderWidth: 3,
            backgroundImage: `linear-gradient(${spot1}, ${spot1})`,
            backgroundSize: "100% 12px",
            backgroundPosition: "0 100%",
            backgroundRepeat: "no-repeat",
        },
    },
})

export const checklistCardTitle = style({
    fontFamily: marketing.font.display,
    fontSize: `calc(30px * ${marketing.display.scale})`,
    fontWeight: marketing.display.weight,
    letterSpacing: marketing.display.tracking,
    textTransform: marketing.display.transform as "none",
    lineHeight: 1,
    textAlign: "center",
    color: marketing.color.accent,
    margin: 0,
    selectors: {
        [POP]: {
            fontStyle: "italic",
            fontSize: 44,
            textShadow: `0.06em 0.06em 0 ${marketing.color.text}`,
        },
    },
})

export const checklistBody = style({
    fontSize: 14.5,
    lineHeight: 1.5,
    textAlign: "center",
    color: marketing.color.subtle,
    margin: "10px 0 0",
})

export const checklistItems = style({
    listStyle: "none",
    padding: 0,
    margin: `${scaledSpace(22)} 0 0`,
    display: "flex",
    flexDirection: "column",
})

export const checklistItem = style({
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
    padding: "13px 0",
    borderTop: `1px dashed color-mix(in srgb, ${marketing.color.line} 70%, transparent)`,
    selectors: {
        [POP]: { borderTop: `2px dashed ${marketing.color.line}` },
    },
})

export const checklistBox = style({
    flexShrink: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 26,
    height: 26,
    marginTop: 1,
    borderRadius: 6,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    color: marketing.color.onAccent,
    background: marketing.color.accent,
    selectors: {
        '[data-checked="false"] > &': {
            background: "transparent",
        },
        [POP]: {
            borderWidth: 2,
            borderColor: marketing.color.line,
            boxShadow: `2px 2px 0 ${marketing.color.line}`,
        },
    },
})

export const checklistText = style({
    display: "flex",
    flexDirection: "column",
    gap: 2,
    minWidth: 0,
})

export const checklistItemTitle = style({
    fontFamily: marketing.font.display,
    fontSize: 17,
    fontWeight: 700,
    color: marketing.color.text,
    selectors: {
        [POP]: {
            fontStyle: "italic",
            fontWeight: 900,
            fontSize: 19,
            textTransform: "uppercase",
            letterSpacing: "0.01em",
        },
    },
})

export const checklistItemNote = style({
    fontSize: 13.5,
    lineHeight: 1.45,
    color: marketing.color.subtle,
})

/*
 * metallic and lacquer: the house-rules card is a card, not a door
 * hanger — squared, unmasked, hung over the photograph's edge. On the
 * cover it is framed in gold with its heading cast in gold and the
 * ticks enamelled tangerine; at the counter it is a black card on one
 * blush hairline, the heading in the Didone, the ticks lipstick squares.
 */
const SQUARE_CARD = `${METALLIC_ROOT} ${checklistCard}, ${LACQUER_ROOT} ${checklistCard}`

globalStyle(SQUARE_CARD, {
    WebkitMaskImage: "none",
    maskImage: "none",
    borderRadius: marketing.shape.radiusCard,
    padding: `${scaledSpace(34)} ${scaledSpace(30)} ${scaledSpace(26)}`,
})

globalStyle(`${METALLIC_ROOT} ${checklistCard}::before, ${LACQUER_ROOT} ${checklistCard}::before`, {
    display: "none",
})

globalStyle(`${METALLIC_ROOT} ${checklistHanger}, ${LACQUER_ROOT} ${checklistHanger}`, {
    maxWidth: 440,
})

globalStyle(`${METALLIC_ROOT} ${checklistCard}`, {
    border: `1px solid ${spot1}`,
    boxShadow: marketing.shape.shadowCard,
})

globalStyle(`${METALLIC_ROOT} ${checklistCardTitle}`, {
    ...metalText(goldFill),
    fontStyle: "italic",
    fontStretch: "100%",
    fontWeight: 900,
    fontSize: "clamp(30px, 3.2vw, 40px)",
    lineHeight: 1,
    textAlign: "left",
})

globalStyle(`${METALLIC_ROOT} ${checklistBody}`, { textAlign: "left" })

globalStyle(`${METALLIC_ROOT} ${checklistItem}`, {
    borderTop: `1px solid color-mix(in srgb, ${spot1} 30%, transparent)`,
})

globalStyle(`${METALLIC_ROOT} ${checklistItemTitle}`, {
    fontStretch: "80%",
    fontWeight: 800,
    fontSize: 18,
    textTransform: "uppercase",
    letterSpacing: "0.02em",
})

globalStyle(`${METALLIC_ROOT} ${checklistBox}`, {
    border: `1px solid ${spot1}`,
    borderRadius: 4,
})

globalStyle(`${LACQUER_ROOT} ${checklistHanger}`, { filter: "none" })

globalStyle(`${LACQUER_ROOT} ${checklistCard}`, {
    background: marketing.color.pageBg,
    border: `1px solid color-mix(in srgb, ${spot1} 45%, transparent)`,
})

globalStyle(`${LACQUER_ROOT} ${checklistCardTitle}`, {
    fontWeight: 500,
    fontSize: "clamp(28px, 3vw, 38px)",
    lineHeight: 1.02,
    textAlign: "left",
    color: marketing.color.text,
})

globalStyle(`${LACQUER_ROOT} ${checklistBody}`, {
    textAlign: "left",
    fontSize: 13.5,
})

globalStyle(`${LACQUER_ROOT} ${checklistItem}`, {
    borderTop: `1px solid color-mix(in srgb, ${spot1} 18%, transparent)`,
})

globalStyle(`${LACQUER_ROOT} ${checklistItemTitle}`, {
    fontWeight: 500,
    fontSize: 17,
    letterSpacing: "0.02em",
})

globalStyle(`${LACQUER_ROOT} ${checklistBox}`, {
    width: 18,
    height: 18,
    marginTop: 4,
    borderRadius: 0,
    border: "none",
})

globalStyle(`${LACQUER_ROOT} ${checklistBox} svg`, { width: 12, height: 12 })

/*
 * `taped` checklist: the prep list on a sheet of legal pad taped over the
 * photo's edge, the items written in marker and ticked in red.
 */
globalStyle(`${TAPED_ROOT} ${checklistHanger}`, {
    filter: `drop-shadow(0 16px 22px color-mix(in srgb, ${marketing.color.text} 22%, transparent))`,
    transform: "rotate(2deg)",
})

globalStyle(`${TAPED_ROOT} ${checklistCard}`, {
    borderRadius: 1,
    border: "none",
    WebkitMaskImage: "none",
    maskImage: "none",
    padding: `${scaledSpace(40)} ${scaledSpace(28)} ${scaledSpace(26)} ${scaledSpace(52)}`,
    background: `color-mix(in srgb, ${spot1} 30%, ${marketing.color.surface})`,
    backgroundImage: [
        `linear-gradient(90deg, transparent 34px, color-mix(in srgb, ${marketing.color.accent} 50%, transparent) 34px, color-mix(in srgb, ${marketing.color.accent} 50%, transparent) 36px, transparent 36px)`,
        `repeating-linear-gradient(transparent 0 29px, color-mix(in srgb, ${marketing.color.text} 12%, transparent) 29px 30px)`,
    ].join(", "),
})

globalStyle(`${TAPED_ROOT} ${checklistCard}::before`, {
    top: -15,
    left: "50%",
    width: 128,
    height: 30,
    border: "none",
    borderRadius: 0,
    background: MASKING_TAPE,
    clipPath: TAPE_CLIP,
    transform: "translateX(-50%) rotate(-3deg)",
})

globalStyle(`${TAPED_ROOT} ${checklistCardTitle}`, { textAlign: "left", fontSize: 40, lineHeight: 0.95 })

globalStyle(`${TAPED_ROOT} ${checklistBody}`, {
    textAlign: "left",
    fontFamily: scriptFont,
    fontSize: 19,
    color: marketing.color.text,
})

globalStyle(`${TAPED_ROOT} ${checklistItem}`, { borderTop: "none", padding: "9px 0" })

globalStyle(`${TAPED_ROOT} ${checklistBox}`, {
    borderRadius: 3,
    borderWidth: 2,
    borderColor: marketing.color.accent,
    transform: "rotate(-4deg)",
})

globalStyle(`${TAPED_ROOT} ${checklistItemTitle}`, {
    fontFamily: scriptFont,
    fontSize: 23,
    fontWeight: 400,
    lineHeight: 1.1,
})

globalStyle(`${TAPED_ROOT} ${checklistItemNote}`, { fontSize: 14, color: marketing.color.text })

/*
 * `lariat` checklist: the pack list hung in a rope frame — the register's
 * lariat ornament as the card's border, the list's title in wood type.
 */
globalStyle(`${LARIAT_ROOT} ${checklistHanger}`, {
    filter: `drop-shadow(0 16px 24px color-mix(in srgb, ${marketing.color.text} 24%, transparent))`,
    transform: "rotate(-1.5deg)",
})

globalStyle(`${LARIAT_ROOT} ${checklistCard}`, {
    borderRadius: 0,
    borderStyle: "solid",
    borderColor: "transparent",
    borderWidth: 16,
    borderImageSource: "var(--marketing-ornament, none)",
    borderImageSlice: 16,
    borderImageRepeat: "round",
    backgroundClip: "padding-box",
    WebkitMaskImage: "none",
    maskImage: "none",
    padding: `${scaledSpace(26)} ${scaledSpace(24)} ${scaledSpace(20)}`,
})

globalStyle(`${LARIAT_ROOT} ${checklistCard}::before`, { display: "none" })

globalStyle(`${LARIAT_ROOT} ${checklistCardTitle}`, { fontSize: 38, letterSpacing: "0.04em" })

globalStyle(`${LARIAT_ROOT} ${checklistBody}`, { fontStyle: "italic" })

globalStyle(`${LARIAT_ROOT} ${checklistBox}`, { borderRadius: 2 })

globalStyle(`${LARIAT_ROOT} ${checklistItemTitle}`, { fontSize: 17, fontWeight: 700 })
