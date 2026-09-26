import { globalStyle, style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { scaledSpace } from "./theme/feelBridge"
import {
    ATOMIC_ROOT,
    atomicStar,
    atomicTeal,
    captionFontStack,
    emojiPanel,
    mediaImage,
    section,
    sectionHeaderCentered,
    sectionKicker,
    sectionTitle,
    spot1,
    spot2,
    LARIAT_ROOT,
} from "./shared.css"

/*
 * `mist` (tideline): the grid sheds its card chrome and reads like the
 * register's other plates — an unboxed image, a hairline, the title in the
 * thin display face, the meta line in tracked mono caps.
 */
const MIST = '[data-marketing-treatment~="mist"] &'

export const wrap = style([section, sectionHeaderCentered, { selectors: { [MIST]: { textAlign: "left" } } }])

export const kicker = sectionKicker

export const title = style([
    sectionTitle,
    {
        selectors: {
            [MIST]: {
                fontSize: `calc(clamp(26px, 3.4vw, 38px) * ${marketing.display.scale})`,
                lineHeight: 1.08,
                maxWidth: 820,
                margin: `0 0 ${scaledSpace(40)}`,
            },
        },
    },
])

const gridBase = style({
    display: "grid",
    gap: scaledSpace(18),
    textAlign: "left",
})

export const grid3 = style([
    gridBase,
    {
        gridTemplateColumns: "repeat(3, 1fr)",
        "@media": {
            "(max-width: 980px)": { gridTemplateColumns: "repeat(2, 1fr)" },
            "(max-width: 640px)": { gridTemplateColumns: "1fr" },
        },
    },
])

export const grid2 = style([
    gridBase,
    {
        gridTemplateColumns: "repeat(2, 1fr)",
        "@media": {
            "(max-width: 700px)": { gridTemplateColumns: "1fr" },
        },
    },
])

export const grid4 = style([
    gridBase,
    {
        gridTemplateColumns: "repeat(4, 1fr)",
        "@media": {
            "(max-width: 1020px)": { gridTemplateColumns: "repeat(2, 1fr)" },
            "(max-width: 640px)": { gridTemplateColumns: "1fr" },
        },
    },
])

export const card = style({
    display: "flex",
    flexDirection: "column",
    gap: 10,
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
    padding: `${scaledSpace(20)} ${scaledSpace(20)} ${scaledSpace(22)}`,
    selectors: {
        [MIST]: {
            gap: 8,
            background: "none",
            border: "none",
            boxShadow: "none",
            padding: 0,
        },
    },
})

export const mediaEmoji = style([
    emojiPanel,
    {
        fontSize: 40,
        minHeight: 120,
        marginBottom: 6,
    },
])

export const mediaImg = style([
    mediaImage,
    {
        marginBottom: 6,
        selectors: {
            [MIST]: {
                border: "none",
                aspectRatio: "5 / 4",
                objectFit: "cover",
                marginBottom: scaledSpace(14),
            },
        },
    },
])

export const cardTitle = style({
    fontFamily: marketing.font.display,
    fontSize: 17,
    fontWeight: 700,
    color: marketing.color.text,
    margin: 0,
    selectors: {
        [MIST]: {
            borderTop: `1px solid ${marketing.color.line}`,
            paddingTop: scaledSpace(14),
            fontSize: 21,
            fontWeight: marketing.display.weight,
            letterSpacing: "-0.01em",
            lineHeight: 1.2,
        },
    },
})

export const cardMeta = style({
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: marketing.color.accent,
    selectors: {
        [MIST]: {
            fontFamily: captionFontStack,
            fontSize: 11.5,
            fontWeight: 500,
            letterSpacing: "0.18em",
        },
    },
})

export const cardBody = style({
    fontSize: 14.5,
    lineHeight: 1.6,
    color: marketing.color.subtle,
    margin: 0,
    selectors: { [MIST]: { fontSize: 14, marginTop: 4 } },
})

export const cardCta = style({
    marginTop: "auto",
    paddingTop: 8,
    fontSize: 14,
    fontWeight: 700,
    color: marketing.color.accent,
    textDecoration: "none",
    selectors: {
        "&:hover": { textDecoration: "underline" },
    },
})

/*
 * `atomic` (midcentury): the catalog strip. The grid sheds its cards and
 * runs as one ruled band of numbered entries — "01 02 03" in the
 * condensed caps over a short rule, cycling the register's inks (burnt
 * orange, mustard, olive), vertical hairlines between entries, each
 * entry's promise in tracked caps in the next ink, and a small atomic
 * star keeping the corner. It sits straight under whatever opens the
 * page, the band's rules doing the separating.
 */
const STRIP_INKS = [spot1, marketing.color.accent, spot2] as const
const STRIP_NOTES = [
    `color-mix(in srgb, ${spot2} 80%, ${marketing.color.text})`,
    atomicTeal,
    marketing.color.subtle,
] as const

globalStyle(`${ATOMIC_ROOT} ${wrap}:has(> ${grid3}), ${ATOMIC_ROOT} ${wrap}:has(> ${grid4})`, {
    paddingTop: 0,
})

for (const grid of [grid3, grid4, grid2]) {
    globalStyle(`${ATOMIC_ROOT} ${grid}`, {
        gap: 0,
        counterReset: "atomic-entry",
        borderBottom: `1px solid ${marketing.color.line}`,
    })
}

globalStyle(`${ATOMIC_ROOT} ${card}`, {
    position: "relative",
    display: "grid",
    gridTemplateColumns: "auto minmax(0, 1fr)",
    alignContent: "start",
    columnGap: 22,
    rowGap: 8,
    background: "none",
    border: "none",
    borderRadius: 0,
    boxShadow: "none",
    padding: `${scaledSpace(26)} ${scaledSpace(56)} ${scaledSpace(26)} ${scaledSpace(28)}`,
    counterIncrement: "atomic-entry",
})

globalStyle(`${ATOMIC_ROOT} ${card} + ${card}`, {
    borderLeft: `1px solid ${marketing.color.line}`,
    "@media": {
        "(max-width: 640px)": { borderLeft: "none", borderTop: `1px solid ${marketing.color.line}` },
    },
})

globalStyle(`${ATOMIC_ROOT} ${card}:first-child`, {
    paddingLeft: 0,
})

globalStyle(`${ATOMIC_ROOT} ${card}`, {
    "@media": {
        "(max-width: 640px)": { paddingLeft: 0, paddingRight: scaledSpace(44) },
    },
})

globalStyle(`${ATOMIC_ROOT} ${card}::before`, {
    content: "counter(atomic-entry, decimal-leading-zero)",
    gridColumn: 1,
    gridRow: "1 / span 3",
    alignSelf: "start",
    fontFamily: marketing.font.display,
    fontWeight: marketing.display.weight,
    fontSize: 50,
    lineHeight: 0.9,
    paddingBottom: 12,
    borderBottom: "2px solid currentColor",
    color: STRIP_INKS[0],
})

globalStyle(`${ATOMIC_ROOT} ${card}::after`, {
    ...atomicStar(26, STRIP_NOTES[0]),
    position: "absolute",
    right: scaledSpace(22),
    bottom: scaledSpace(26),
})

STRIP_INKS.forEach((ink, index) => {
    const nth = `:nth-child(3n + ${index + 1})`
    globalStyle(`${ATOMIC_ROOT} ${card}${nth}::before`, { color: ink })
    globalStyle(`${ATOMIC_ROOT} ${card}${nth}::after`, { background: STRIP_NOTES[index] })
    globalStyle(`${ATOMIC_ROOT} ${card}${nth} ${cardBody}`, { color: STRIP_NOTES[index] })
})

globalStyle(`${ATOMIC_ROOT} ${card} > *`, {
    gridColumn: 2,
})

globalStyle(`${ATOMIC_ROOT} ${card} ${mediaImg}`, {
    gridColumn: "1 / -1",
    border: "none",
})

globalStyle(`${ATOMIC_ROOT} ${cardTitle}`, {
    fontFamily: marketing.font.body,
    fontSize: 19,
    fontWeight: 600,
    lineHeight: 1.18,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
})

globalStyle(`${ATOMIC_ROOT} ${cardMeta}`, {
    color: spot1,
    letterSpacing: "0.16em",
})

globalStyle(`${ATOMIC_ROOT} ${cardBody}`, {
    fontSize: 12.5,
    fontWeight: 600,
    lineHeight: 1.55,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
})

globalStyle(`${ATOMIC_ROOT} ${cardCta}`, {
    paddingTop: 4,
    fontSize: 13,
    fontWeight: 500,
    color: marketing.color.text,
    textDecoration: "underline",
    textDecorationColor: marketing.color.line,
    textUnderlineOffset: 5,
})

/*
 * `lariat` cards: numbered like stops on the trail — a stitched edge, the
 * stop number and the title in wood type.
 */
globalStyle(`${LARIAT_ROOT} ${grid3}, ${LARIAT_ROOT} ${grid2}, ${LARIAT_ROOT} ${grid4}`, {
    counterReset: "mk-stop",
})

globalStyle(`${LARIAT_ROOT} ${card}`, {
    counterIncrement: "mk-stop",
    border: `2px solid ${marketing.color.text}`,
    outline: `1.5px dashed ${marketing.color.line}`,
    outlineOffset: -9,
    padding: `${scaledSpace(28)} ${scaledSpace(26)} ${scaledSpace(28)}`,
})

globalStyle(`${LARIAT_ROOT} ${card}::before`, {
    content: '"No. " counter(mk-stop)',
    fontFamily: marketing.font.display,
    fontSize: 15,
    letterSpacing: "0.12em",
    color: marketing.color.accent,
})

globalStyle(`${LARIAT_ROOT} ${cardTitle}`, {
    fontSize: 22,
    fontWeight: 400,
    letterSpacing: "0.03em",
    textTransform: "uppercase",
    lineHeight: 1.1,
})
