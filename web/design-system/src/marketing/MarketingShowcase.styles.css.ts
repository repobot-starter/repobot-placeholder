import { globalStyle, style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { scaledSpace } from "./theme/feelBridge"
import {
    LACQUER_ROOT,
    METALLIC_ROOT,
    ATOMIC_ROOT,
    MASKING_TAPE,
    TAPED_ROOT,
    TAPE_CLIP,
    TWO_INK_ROOT,
    captionFontStack,
    chromeFill,
    emojiPanel,
    halftonePlate,
    mediaImage,
    metalText,
    pulpExtrude,
    scriptFont,
    section,
    sectionHeaderCentered,
    sectionKicker,
    sectionTitle,
    sectionTitleDisplay,
    spot1,
    spot2,
} from "./shared.css"

export const wrap = style([section, sectionHeaderCentered])

export const kicker = sectionKicker

export const title = sectionTitle

export const chipRow = style({
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    margin: `0 0 ${scaledSpace(30)}`,
})

export const chip = style({
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "inherit",
    color: marketing.color.subtle,
    background: "transparent",
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusControl,
    padding: "7px 14px",
    cursor: "pointer",
    selectors: {
        "&:hover": { borderColor: marketing.color.subtle },
        '&[aria-pressed="true"]': {
            color: marketing.color.onAccent,
            background: marketing.color.accent,
            borderColor: marketing.color.accent,
        },
    },
})

export const grid = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: scaledSpace(18),
    textAlign: "left",
})

export const card = style({
    display: "flex",
    flexDirection: "column",
    gap: 10,
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
    padding: `${scaledSpace(20)} ${scaledSpace(20)} ${scaledSpace(22)}`,
})

export const mediaEmoji = style([
    emojiPanel,
    {
        fontSize: 44,
        minHeight: 130,
        marginBottom: 6,
    },
])

export const mediaImg = style([
    mediaImage,
    {
        marginBottom: 6,
    },
])

/** Positions the card-grid media so the status badge can ride its corner. */
export const mediaWrap = style({
    position: "relative",
})

/**
 * The status pill (a listing's "Sold" / "New this week"): small uppercase
 * signage that must stay legible over a photograph, so both tones are
 * solid fills — accent for live states, ink for settled ones.
 */
export const badge = style({
    zIndex: 1,
    display: "inline-flex",
    alignItems: "center",
    width: "fit-content",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    lineHeight: 1,
    padding: "6px 10px",
    borderRadius: marketing.shape.radiusControl,
})

export const badgeOverlay = style({
    position: "absolute",
    top: 10,
    left: 10,
})

export const badgeAccent = style({
    color: marketing.color.onAccent,
    background: marketing.color.accent,
})

export const badgeNeutral = style({
    color: marketing.color.pageBg,
    background: marketing.color.text,
})

export const eyebrow = style({
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: marketing.color.accent,
})

export const titleRow = style({
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
})

export const itemTitle = style({
    fontFamily: marketing.font.display,
    fontSize: 17,
    fontWeight: 700,
    color: marketing.color.text,
    margin: 0,
})

export const itemLink = style({
    color: "inherit",
    textDecoration: "none",
    selectors: {
        "&:hover": { color: marketing.color.accent },
    },
})

export const meta = style({
    flexShrink: 0,
    fontFamily: marketing.font.display,
    fontSize: 15,
    fontWeight: 700,
    color: marketing.color.accent,
})

export const itemDescription = style({
    fontSize: 14.5,
    lineHeight: 1.6,
    color: marketing.color.subtle,
    margin: 0,
})

/** The card's emblem (`icon`): a line mark in the accent above the title. */
export const itemIcon = style({
    display: "inline-flex",
    color: marketing.color.accent,
})

/** What the card covers (`points`): short lines, each set off by a small dot. */
export const pointList = style({
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "grid",
    gap: 6,
})

export const point = style({
    position: "relative",
    paddingLeft: 14,
    fontSize: 13.5,
    lineHeight: 1.5,
    color: marketing.color.text,
    selectors: {
        "&::before": {
            content: '""',
            position: "absolute",
            left: 0,
            top: "0.62em",
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: marketing.color.accent,
        },
    },
})

export const tagRow = style({
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
})

export const tag = style({
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
    background: marketing.color.accentSoft,
    borderRadius: marketing.shape.radiusControl,
    padding: "3px 9px",
})

/**
 * `collections`: large cover tiles, two abreast — the album index. The
 * cover carries the tile; text sits quietly beneath it, and the whole
 * card links out.
 */
export const collectionsGrid = style({
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: `${scaledSpace(36)} ${scaledSpace(28)}`,
    textAlign: "left",
    "@media": {
        "(max-width: 760px)": { gridTemplateColumns: "1fr" },
    },
})

export const collectionCard = style({
    display: "flex",
    flexDirection: "column",
    gap: 8,
    color: "inherit",
    textDecoration: "none",
})

export const collectionCover = style({
    position: "relative",
    overflow: "hidden",
    borderRadius: marketing.shape.radiusCard,
    aspectRatio: "3 / 2",
    marginBottom: 8,
})

export const collectionImg = style({
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
    transition: "transform 500ms ease",
    selectors: {
        [`${collectionCard}:hover &`]: { transform: "scale(1.02)" },
    },
    "@media": {
        "(prefers-reduced-motion: reduce)": {
            transition: "none",
            selectors: {
                [`${collectionCard}:hover &`]: { transform: "none" },
            },
        },
    },
})

/**
 * `media-rail`: the collection covers along a scroll-snapped horizontal
 * strip (the carousel's pure-CSS pattern) — the album index as a browsable
 * lineup instead of a tile grid.
 */
export const rail = style({
    display: "flex",
    gap: scaledSpace(20),
    overflowX: "auto",
    scrollSnapType: "x proximity",
    scrollBehavior: "smooth",
    scrollPadding: 4,
    padding: "4px 4px 16px",
    textAlign: "left",
    "@media": {
        "(prefers-reduced-motion: reduce)": { scrollBehavior: "auto" },
    },
})

export const railCell = style({
    flex: "0 0 min(420px, 80%)",
    scrollSnapAlign: "start",
})

export const collectionTitle = style({
    fontFamily: marketing.font.display,
    fontSize: 20,
    fontWeight: marketing.display.weight,
    letterSpacing: marketing.display.tracking,
    color: marketing.color.text,
    margin: 0,
    selectors: {
        [`${collectionCard}:hover &`]: { color: marketing.color.accent },
    },
})

/*
 * `specimens`: the materials board. Tall 3:4 plates in an even row (four
 * across on desktop, two on phones), each captioned like a sample in a
 * drawer — the name in the display voice, its use after a slash in small
 * monospace, one line of description. Left-aligned header, like a rail.
 */
export const wrapSpecimens = style([section, { textAlign: "left" }])

export const titleSpecimens = sectionTitleDisplay

export const specimens = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: `${scaledSpace(36)} ${scaledSpace(24)}`,
    "@media": {
        "(max-width: 560px)": { gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "28px 14px" },
    },
})

export const specimen = style({
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
})

export const specimenPlate = style({
    position: "relative",
    aspectRatio: "3 / 4",
    overflow: "hidden",
    borderRadius: marketing.shape.radiusCard,
    background: marketing.color.surface,
    marginBottom: scaledSpace(16),
})

export const specimenImg = style({
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
})

export const specimenIndex = style({
    fontFamily: captionFontStack,
    fontSize: 11,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: marketing.color.accent,
    marginBottom: 6,
})

export const specimenName = style({
    fontFamily: marketing.font.display,
    fontSize: "clamp(20px, 2vw, 25px)",
    fontWeight: marketing.display.weight,
    letterSpacing: marketing.display.tracking,
    textTransform: marketing.display.transform as "none",
    lineHeight: 1.15,
    color: marketing.color.text,
    margin: 0,
})

export const specimenUse = style({
    fontFamily: captionFontStack,
    fontSize: 11.5,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
    margin: "6px 0 10px",
})

export const specimenDescription = style({
    fontSize: 14,
    lineHeight: 1.55,
    color: marketing.color.subtle,
    margin: 0,
})

/*
 * `stories`: newspaper stories between column rules. A heavy rule and the
 * section flag open the grid; stories sit on six tracks (lead = 6,
 * half = 3, third = 2) and each carries a hairline on its left except
 * the story that opens its row (the component marks row edges), so rules
 * fall only BETWEEN columns and the outer columns sit flush with the page.
 * Left-aligned throughout: newspapers never center body copy.
 */
export const storiesWrap = style([section, { textAlign: "left" }])

export const storiesFlag = style({
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "4px 16px",
    borderTop: `3px solid ${marketing.color.text}`,
    borderBottom: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    padding: "10px 0 8px",
    marginBottom: scaledSpace(22),
})

export const storiesTitle = style({
    fontFamily: marketing.font.display,
    fontWeight: marketing.display.weight,
    textTransform: marketing.display.transform as "none",
    letterSpacing: "0.02em",
    fontSize: "clamp(22px, 2.6vw, 30px)",
    lineHeight: 1,
    color: marketing.color.text,
    margin: 0,
})

export const storiesKicker = style({
    fontFamily: marketing.font.body,
    fontSize: 13,
    fontStyle: "italic",
    color: marketing.color.subtle,
})

export const storiesGrid = style({
    display: "grid",
    gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
    // The gutter is fixed so the column rule can sit exactly in its middle.
    columnGap: 44,
    rowGap: scaledSpace(26),
    "@media": {
        "(max-width: 900px)": { gridTemplateColumns: "1fr" },
    },
})

export const story = style({
    position: "relative",
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    selectors: {
        // The column rule, centered in the gutter to this story's left.
        "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            bottom: 0,
            left: -22,
            borderLeft: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
        },
    },
    "@media": {
        "(max-width: 900px)": {
            paddingBottom: scaledSpace(22),
            borderBottom: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
            selectors: { "&::before": { display: "none" } },
        },
    },
})

export const storyRowStart = style({
    selectors: { "&::before": { display: "none" } },
})

const singleColumnSpan = { "@media": { "(max-width: 900px)": { gridColumn: "auto" } } } as const
export const storyLead = style({ gridColumn: "span 6", ...singleColumnSpan })
export const storyHalf = style({ gridColumn: "span 3", ...singleColumnSpan })
export const storyThird = style({ gridColumn: "span 2", ...singleColumnSpan })

export const storyLeadGrid = style({
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.35fr) minmax(0, 1fr)",
    gap: scaledSpace(26),
    alignItems: "start",
    "@media": {
        "(max-width: 900px)": { gridTemplateColumns: "1fr" },
    },
})

export const storyLeadText = style({
    display: "flex",
    flexDirection: "column",
})

export const storyKicker = style({
    display: "block",
    fontFamily: marketing.font.body,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: marketing.color.accent,
    marginBottom: 6,
})

const storyHeadlineBase = style({
    fontFamily: marketing.font.display,
    fontWeight: marketing.display.weight,
    textTransform: marketing.display.transform as "none",
    letterSpacing: marketing.display.tracking,
    lineHeight: 0.98,
    color: marketing.color.text,
    margin: `0 0 ${scaledSpace(14)}`,
})

export const storyHeadline = style([storyHeadlineBase, { fontSize: "clamp(24px, 2.3vw, 31px)" }])
export const storyHeadlineHalf = style([storyHeadlineBase, { fontSize: "clamp(28px, 3vw, 40px)" }])
export const storyHeadlineLead = style([storyHeadlineBase, { fontSize: "clamp(32px, 4vw, 54px)" }])

export const storyHeadlineLink = style({
    color: "inherit",
    textDecoration: "none",
    selectors: {
        "&:hover": { textDecoration: "underline", textDecorationThickness: 2, textUnderlineOffset: 4 },
    },
})

export const storyPhoto = style([
    halftonePlate,
    {
        aspectRatio: "4 / 3",
        marginBottom: scaledSpace(14),
        background: marketing.color.text,
    },
])

export const storyPhotoLead = style([
    halftonePlate,
    {
        aspectRatio: "3 / 2",
        background: marketing.color.text,
    },
])

export const storyImg = style({
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    // Portrait frames (grandma mid-spin, a bouquet held high) keep their
    // subject: bias the crop toward the upper third, where faces live.
    objectPosition: "50% 30%",
    display: "block",
})

export const storyBody = style({
    fontFamily: marketing.font.body,
    fontSize: 15.5,
    lineHeight: 1.5,
    color: marketing.color.text,
    margin: 0,
    flex: "1 1 auto",
})

export const storyBodyLead = style({
    fontSize: 17,
})

export const storyDateline = style({
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    fontSize: "0.86em",
})

export const storyJump = style({
    alignSelf: "stretch",
    marginTop: scaledSpace(14),
    paddingTop: 8,
    borderTop: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    fontFamily: marketing.font.display,
    fontWeight: marketing.display.weight,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    fontSize: 14,
    color: marketing.color.text,
    textDecoration: "none",
    textAlign: "center",
    selectors: {
        "&:hover": { color: marketing.color.accent },
    },
})

/*
 * `pulp` (creature) on the specimens board: the creature index as lobby
 * cards pinned in a row — each plate mounted in poster cream with the hard
 * drop, tipped alternately, a dot screen over the paint; the index number
 * a spot-ink tag, the name in extruded poster caps.
 */
const PULP_ROOT = '[data-marketing-treatment~="pulp"]'

globalStyle(`${PULP_ROOT} ${specimens}`, {
    "@media": {
        // Five plates hold one row on the page column; phones keep the base two-up.
        "(min-width: 561px)": {
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: `${scaledSpace(40)} ${scaledSpace(24)}`,
        },
    },
})

/*
 * `two-ink` (riso) specimens: the plant index as a row of trimmed prints.
 * Each card is framed in a hairline, its plate a shorter landscape-ish
 * pull (the index sits under the poster, not beside it), and the caption
 * a solid band of the dark drum with the name reversed out in paper caps,
 * the use after its slash, and the description in italic serif — the
 * botanical name on a seed packet. The header sets the title left and the
 * kicker right on one line.
 */
globalStyle(`${TWO_INK_ROOT} ${wrapSpecimens}`, {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gridTemplateAreas: '"title kicker" "grid grid"',
    alignItems: "end",
    columnGap: 24,
    "@media": {
        "(max-width: 720px)": { gridTemplateColumns: "1fr", gridTemplateAreas: '"kicker" "title" "grid"' },
    },
})

globalStyle(`${TWO_INK_ROOT} ${wrapSpecimens} > span`, {
    gridArea: "kicker",
    justifySelf: "end",
    marginBottom: scaledSpace(26),
    "@media": {
        "(max-width: 720px)": { justifySelf: "start", marginBottom: 8 },
    },
})

globalStyle(`${TWO_INK_ROOT} ${titleSpecimens}`, {
    gridArea: "title",
    fontSize: "clamp(26px, 3vw, 36px)",
    margin: `0 0 ${scaledSpace(22)}`,
})

globalStyle(`${TWO_INK_ROOT} ${specimens}`, {
    gridArea: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: scaledSpace(20),
    "@media": {
        "(max-width: 560px)": { gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 },
    },
})

globalStyle(`${TWO_INK_ROOT} ${specimen}`, {
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    overflow: "hidden",
    background: spotPaper(),
})

globalStyle(`${TWO_INK_ROOT} ${specimenPlate}`, {
    aspectRatio: "4 / 3",
    borderRadius: 0,
    marginBottom: 0,
    background: spotPaper(),
})

globalStyle(`${TWO_INK_ROOT} ${specimenIndex}`, {
    display: "none",
})

globalStyle(
    `${TWO_INK_ROOT} ${specimenName}, ${TWO_INK_ROOT} ${specimenUse}, ${TWO_INK_ROOT} ${specimenDescription}`,
    {
        background: spotInk(),
        color: spotPaper(),
        padding: "0 16px",
        margin: 0,
        "@media": {
            "(max-width: 560px)": { paddingLeft: 11, paddingRight: 11 },
        },
    },
)

globalStyle(`${TWO_INK_ROOT} ${specimenName}`, {
    fontSize: "clamp(19px, 1.7vw, 23px)",
    letterSpacing: "0.03em",
    lineHeight: 1.05,
    paddingTop: 14,
})

globalStyle(`${TWO_INK_ROOT} ${specimenUse}`, {
    fontFamily: marketing.font.body,
    fontSize: 14,
    letterSpacing: "0.02em",
    textTransform: "none",
    paddingTop: 3,
    opacity: 1,
})

globalStyle(`${TWO_INK_ROOT} ${specimenDescription}`, {
    flex: 1,
    fontFamily: "'Fraunces', ui-serif, Georgia, serif",
    fontStyle: "italic",
    fontSize: 15,
    lineHeight: 1.35,
    paddingTop: 2,
    paddingBottom: 14,
})

function spotInk(): string {
    return `var(--marketing-spot-1, ${marketing.color.text})`
}

function spotPaper(): string {
    return `var(--marketing-spot-2, ${marketing.color.pageBg})`
}

/*
 * `swatches`: the paint-chip row. Flat fields of color run wall to wall
 * (a hairline of page ground between chips), each field printed like a
 * fan-deck chip — the name in heavy caps, its code under it, a short
 * rule, and the one-line note at the foot. The chip's own color and ink
 * arrive inline from the item; without a color it takes the accent.
 * Phones stack the chips as strips, name left and note right.
 */
export const swatchesWrap = style([section, { textAlign: "left" }])

export const swatchesHeader = style({
    marginBottom: scaledSpace(28),
})

export const swatchesTitle = sectionTitleDisplay

export const swatches = style({
    display: "grid",
    gridAutoFlow: "column",
    gridAutoColumns: "minmax(0, 1fr)",
    gap: 4,
    width: "100vw",
    marginLeft: "calc(50% - 50vw)",
    "@media": {
        "(max-width: 760px)": { gridAutoFlow: "row", gridAutoColumns: "auto", gap: 3 },
    },
})

/** The hero-adjacent chip row sits flush under the section above it. */
globalStyle(`${swatchesWrap}:not(:has(${swatchesHeader}))`, {
    paddingTop: 4,
})

export const swatch = style({
    position: "relative",
    display: "flex",
    flexDirection: "column",
    minHeight: "clamp(230px, 21vw, 340px)",
    padding: "clamp(20px, 2.2vw, 30px) clamp(18px, 2vw, 28px)",
    minWidth: 0,
    "@media": {
        "(max-width: 760px)": {
            minHeight: 0,
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.1fr)",
            gridTemplateAreas: '"name note" "code note" "rule note"',
            alignItems: "start",
            columnGap: 18,
            padding: "18px 20px",
        },
    },
})

globalStyle(`${PULP_ROOT} ${specimen}:nth-child(odd)`, { transform: "rotate(-1.4deg)" })
globalStyle(`${PULP_ROOT} ${specimen}:nth-child(even)`, { transform: "rotate(1.1deg) translateY(10px)" })

globalStyle(`${PULP_ROOT} ${specimenPlate}`, {
    border: `4px solid ${spot2}`,
    boxShadow: marketing.shape.shadowCard,
    marginBottom: scaledSpace(20),
})

globalStyle(`${PULP_ROOT} ${specimenPlate}::after`, {
    content: '""',
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    backgroundImage: "radial-gradient(rgba(4, 8, 24, 0.55) 0.9px, transparent 1.4px)", // theme-exempt: press ink dots over the painted plate
    backgroundSize: "4px 4px",
    mixBlendMode: "multiply",
    opacity: 0.45,
})

globalStyle(`${PULP_ROOT} ${specimenIndex}`, {
    alignSelf: "flex-start",
    fontFamily: marketing.font.display,
    fontSize: 15,
    letterSpacing: "0.1em",
    color: marketing.color.pageBg,
    background: spot1,
    padding: "3px 9px 1px",
    marginBottom: 10,
})

globalStyle(`${PULP_ROOT} ${specimenName}`, {
    fontSize: "clamp(22px, 2.1vw, 27px)",
    lineHeight: 1,
    letterSpacing: "0.03em",
    textShadow: pulpExtrude(2),
})

globalStyle(`${PULP_ROOT} ${specimenUse}`, {
    fontStyle: "italic",
    color: marketing.color.accent,
    margin: "8px 0 10px",
})

export const swatchAccent = style({
    background: marketing.color.accent,
    color: marketing.color.onAccent,
})

export const swatchName = style({
    gridArea: "name",
    fontFamily: marketing.font.display,
    fontSize: "clamp(17px, 1.6vw, 23px)",
    fontWeight: 800,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    lineHeight: 1.2,
    color: "inherit",
    margin: 0,
})

export const swatchLink = style({
    color: "inherit",
    textDecoration: "none",
    selectors: {
        // The whole chip is the link.
        "&::after": { content: '""', position: "absolute", inset: 0 },
        "&:focus-visible": { outline: "none" },
    },
})

globalStyle(`${swatch}:has(${swatchLink}:focus-visible)`, {
    outline: "3px solid currentColor",
    outlineOffset: -7,
})

export const swatchCode = style({
    gridArea: "code",
    fontFamily: marketing.font.display,
    fontSize: "clamp(17px, 1.6vw, 23px)",
    fontWeight: 800,
    letterSpacing: "0.1em",
    lineHeight: 1.2,
    fontVariantNumeric: "tabular-nums",
})

export const swatchRule = style({
    gridArea: "rule",
    display: "block",
    width: 44,
    height: 2,
    background: "currentColor",
    margin: "clamp(16px, 1.6vw, 22px) 0 0",
})

export const swatchNote = style({
    gridArea: "note",
    marginTop: "auto",
    marginBottom: 0,
    paddingTop: scaledSpace(24),
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    lineHeight: 1.55,
    maxWidth: "20ch",
    "@media": {
        "(max-width: 760px)": { marginTop: 0, paddingTop: 0, maxWidth: "none" },
    },
})

/** A swatch's texture chip (item image media): a square sample above the name. */
export const swatchMedia = style({
    gridArea: "media",
    position: "relative",
    width: "clamp(72px, 8vw, 120px)",
    aspectRatio: "1",
    overflow: "hidden",
    marginBottom: scaledSpace(18),
})

export const swatchMediaImg = style({
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
})

/*
 * lacquer: the deck becomes the counter's shade cards — three framed
 * cards in the page column, each a texture chip beside its name, the
 * price under a dash in tiny blush caps, the note in small caps. Right
 * under the title-card hero (no header) the row rides up over the
 * photograph's graded foot, the way the shade cards sit on the board.
 */
globalStyle(`${LACQUER_ROOT} ${swatches}`, {
    width: "auto",
    marginLeft: 0,
    gap: "clamp(12px, 1.6vw, 22px)",
})

globalStyle(`${LACQUER_ROOT} ${swatchesWrap}:not(:has(${swatchesHeader}))`, {
    position: "relative",
    zIndex: 2,
    paddingTop: 0,
    marginTop: "clamp(-72px, -5vw, -28px)",
    "@media": {
        "(max-width: 760px)": { marginTop: 0, paddingTop: scaledSpace(8) },
    },
})

globalStyle(`${LACQUER_ROOT} ${swatch}`, {
    display: "grid",
    gridTemplateColumns: "clamp(84px, 8.4vw, 124px) minmax(0, 1fr)",
    gridTemplateAreas: '"media name" "media code" "media note"',
    gridTemplateRows: "auto auto 1fr",
    alignItems: "start",
    columnGap: "clamp(14px, 1.6vw, 24px)",
    minHeight: 0,
    padding: "clamp(12px, 1.2vw, 18px)",
    border: `1px solid color-mix(in srgb, ${spot1} 50%, transparent)`,
    backdropFilter: "blur(6px)",
    transition: "border-color 200ms ease",
    "@media": {
        "(max-width: 760px)": {
            gridTemplateColumns: "84px minmax(0, 1fr)",
            gridTemplateAreas: '"media name" "media code" "media note"',
            padding: 12,
        },
    },
})

globalStyle(`${LACQUER_ROOT} ${swatch}:hover`, {
    borderColor: marketing.color.accent,
})

globalStyle(`${LACQUER_ROOT} ${swatchMedia}`, {
    width: "100%",
    margin: 0,
    outline: `1px solid color-mix(in srgb, ${spot1} 28%, transparent)`,
})

globalStyle(`${LACQUER_ROOT} ${swatchName}`, {
    fontWeight: 500,
    fontSize: "clamp(18px, 1.8vw, 27px)",
    letterSpacing: "0.12em",
    lineHeight: 1.05,
    marginTop: 4,
})

globalStyle(`${LACQUER_ROOT} ${swatchCode}`, {
    fontFamily: marketing.font.body,
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: "0.3em",
    textTransform: "uppercase",
    color: spot1,
    marginTop: 10,
})

globalStyle(`${LACQUER_ROOT} ${swatchCode}::before`, {
    content: '"\\2014\\00a0"',
})

globalStyle(`${LACQUER_ROOT} ${swatchRule}`, { display: "none" })

globalStyle(`${LACQUER_ROOT} ${swatchNote}`, {
    fontFamily: marketing.font.body,
    fontSize: 11,
    fontWeight: 400,
    letterSpacing: "0.16em",
    lineHeight: 1.7,
    marginTop: 0,
    paddingTop: 12,
    maxWidth: "none",
    opacity: 0.86,
})

/*
 * metallic: the lookbook as a cover's fashion spread. Plates run three
 * abreast in hairline gold frames with a glint on the inner edge; each
 * look is named in condensed chrome caps with its detail in tangerine.
 * The filterable grid wears the same frames, its chips gold-edged tabs.
 */
globalStyle(`${METALLIC_ROOT} ${specimens}, ${METALLIC_ROOT} ${grid}`, {
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: `${scaledSpace(40)} ${scaledSpace(26)}`,
    "@media": {
        "(max-width: 760px)": { gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "28px 14px" },
    },
})

globalStyle(`${METALLIC_ROOT} ${specimenPlate}`, {
    border: `1px solid color-mix(in srgb, ${spot1} 75%, transparent)`,
    boxShadow: marketing.shape.shadowCard,
})

globalStyle(`${METALLIC_ROOT} ${specimenName}, ${METALLIC_ROOT} ${itemTitle}`, {
    ...metalText(chromeFill, "0.02em"),
    fontStretch: "78%",
    fontStyle: "italic",
    fontWeight: 900,
    fontSize: "clamp(24px, 2.4vw, 34px)",
    lineHeight: 1,
    textTransform: "uppercase",
})

globalStyle(`${METALLIC_ROOT} ${specimenUse}, ${METALLIC_ROOT} ${meta}`, {
    fontFamily: marketing.font.display,
    fontStretch: "75%",
    fontSize: 15,
    fontWeight: 800,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: marketing.color.accent,
})

globalStyle(`${METALLIC_ROOT} ${specimenUse} > span:first-child`, { color: spot1 })

globalStyle(`${METALLIC_ROOT} ${card}`, {
    background: "transparent",
    border: "none",
    boxShadow: "none",
    padding: 0,
})

globalStyle(`${METALLIC_ROOT} ${card} ${titleRow}`, {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 6,
})

globalStyle(`${METALLIC_ROOT} ${tagRow}`, { display: "none" })

globalStyle(`${METALLIC_ROOT} ${chip}`, {
    fontFamily: marketing.font.display,
    fontStretch: "78%",
    fontWeight: 800,
    fontSize: 14,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: spot1,
    borderColor: `color-mix(in srgb, ${spot1} 55%, transparent)`,
    padding: "9px 18px 8px",
})

/*
 * lacquer: the portfolio as a beauty book — tall bare portraits three
 * abreast, no card chrome; the look named in the Didone, its credit in
 * tiny spaced blush caps, the filter a row of spaced caps underlined in
 * lipstick when pressed.
 */
globalStyle(`${LACQUER_ROOT} ${grid}`, {
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: `${scaledSpace(48)} ${scaledSpace(28)}`,
    "@media": {
        "(max-width: 760px)": { gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "30px 14px" },
    },
})

globalStyle(`${LACQUER_ROOT} ${card}`, {
    background: "transparent",
    border: "none",
    boxShadow: "none",
    padding: 0,
    gap: 8,
})

globalStyle(`${LACQUER_ROOT} ${card} ${mediaImg}`, {
    aspectRatio: "3 / 4",
    objectFit: "cover",
    marginBottom: 12,
})

globalStyle(`${LACQUER_ROOT} ${card} ${titleRow}`, {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 8,
})

globalStyle(`${LACQUER_ROOT} ${itemTitle}`, {
    fontWeight: 500,
    fontSize: "clamp(20px, 2vw, 28px)",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    lineHeight: 1.05,
})

globalStyle(`${LACQUER_ROOT} ${card} ${meta}`, {
    order: -1,
    fontFamily: marketing.font.body,
    fontSize: 10.5,
    fontWeight: 500,
    letterSpacing: "0.34em",
    textTransform: "uppercase",
    color: spot1,
})

globalStyle(`${LACQUER_ROOT} ${itemDescription}`, {
    fontSize: 13.5,
    lineHeight: 1.65,
    maxWidth: "36ch",
})

globalStyle(`${LACQUER_ROOT} ${tagRow}`, { display: "none" })

globalStyle(`${LACQUER_ROOT} ${chipRow}`, {
    gap: "4px 26px",
    margin: `0 0 ${scaledSpace(40)}`,
})

globalStyle(`${LACQUER_ROOT} ${chip}`, {
    fontFamily: marketing.font.body,
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.34em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
    border: "none",
    borderBottom: "1px solid transparent",
    borderRadius: 0,
    padding: "8px 0 6px",
})

globalStyle(`${LACQUER_ROOT} ${chip}[aria-pressed="true"]`, {
    color: marketing.color.text,
    background: "transparent",
    borderBottomColor: marketing.color.accent,
})

/*
 * `atomic` (midcentury): the catalog's pages. Card grids become a ruled
 * index — each entry hung from an ink rule and numbered in the condensed
 * caps, cycling the register's inks, the facts under the title as tracked
 * caps. Specimens become catalog plates: three to a row, each photograph
 * framed in a hairline, the item number set as a mustard tag, the name in
 * the condensed caps, materials and price in tracked geometric caps.
 */
const INDEX_INKS = [spot1, marketing.color.accent, spot2] as const

globalStyle(`${ATOMIC_ROOT} ${grid}`, {
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: `${scaledSpace(28)} ${scaledSpace(28)}`,
    counterReset: "atomic-index",
})

globalStyle(`${ATOMIC_ROOT} ${card}`, {
    gap: 8,
    background: "none",
    border: "none",
    borderTop: `2px solid ${marketing.color.text}`,
    borderRadius: 0,
    boxShadow: "none",
    padding: `${scaledSpace(16)} 0 0`,
    counterIncrement: "atomic-index",
})

globalStyle(`${ATOMIC_ROOT} ${card}::before`, {
    content: "counter(atomic-index, decimal-leading-zero)",
    fontFamily: marketing.font.display,
    fontWeight: marketing.display.weight,
    fontSize: 38,
    lineHeight: 1,
    color: INDEX_INKS[0],
    marginBottom: 4,
})

INDEX_INKS.forEach((ink, index) => {
    globalStyle(`${ATOMIC_ROOT} ${card}:nth-child(3n + ${index + 1})::before`, { color: ink })
})

globalStyle(`${ATOMIC_ROOT} ${eyebrow}`, {
    fontSize: 11.5,
    fontWeight: 600,
    letterSpacing: "0.2em",
    color: marketing.color.subtle,
})

globalStyle(`${ATOMIC_ROOT} ${titleRow}`, {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 4,
})

globalStyle(`${ATOMIC_ROOT} ${itemTitle}`, {
    fontSize: 23,
    fontWeight: marketing.display.weight,
    lineHeight: 1.08,
    textTransform: "uppercase",
})

globalStyle(`${ATOMIC_ROOT} ${meta}`, {
    flexShrink: 1,
    fontFamily: marketing.font.body,
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1.5,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: `color-mix(in srgb, ${spot2} 80%, ${marketing.color.text})`,
})

globalStyle(`${ATOMIC_ROOT} ${itemDescription}`, {
    fontSize: 14.5,
    lineHeight: 1.65,
})

globalStyle(`${ATOMIC_ROOT} ${specimens}`, {
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: `${scaledSpace(44)} ${scaledSpace(28)}`,
    "@media": {
        "(max-width: 860px)": { gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "32px 16px" },
    },
})

globalStyle(`${ATOMIC_ROOT} ${specimenPlate}`, {
    aspectRatio: "4 / 5",
    borderRadius: 0,
    border: `1px solid ${marketing.color.line}`,
    marginBottom: scaledSpace(16),
})

globalStyle(`${ATOMIC_ROOT} ${specimenIndex}`, {
    alignSelf: "flex-start",
    fontFamily: marketing.font.display,
    fontSize: 15,
    fontWeight: marketing.display.weight,
    letterSpacing: "0.06em",
    color: marketing.color.text,
    background: marketing.color.accent,
    padding: "3px 9px 2px",
    marginBottom: 10,
})

globalStyle(`${ATOMIC_ROOT} ${specimenName}`, {
    fontSize: "clamp(20px, 2.1vw, 26px)",
    lineHeight: 1.06,
})

globalStyle(`${ATOMIC_ROOT} ${specimenUse}`, {
    fontFamily: marketing.font.body,
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1.5,
    letterSpacing: "0.1em",
    color: spot1,
    margin: "8px 0 10px",
})

globalStyle(`${ATOMIC_ROOT} ${specimenDescription}`, {
    fontSize: 14.5,
    lineHeight: 1.6,
})

/*
 * `taped` collections: each album cover is a print taped to the door, the
 * album's eyebrow written above its title in marker. A five-album index
 * lays out two big prints over three smaller ones instead of orphaning
 * the last.
 */
globalStyle(`${TAPED_ROOT} ${collectionsGrid}`, {
    gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
    gap: `${scaledSpace(52)} ${scaledSpace(30)}`,
    paddingTop: 16,
    "@media": {
        "(max-width: 760px)": { gridTemplateColumns: "1fr" },
    },
})

globalStyle(`${TAPED_ROOT} ${collectionCard}`, {
    position: "relative",
    gridColumn: "span 3",
    gap: 6,
    padding: "12px 12px 18px",
    background: marketing.color.surface,
    borderRadius: 2,
    boxShadow: marketing.shape.shadowCard,
    transform: "rotate(-0.8deg)",
    "@media": {
        "(max-width: 760px)": { gridColumn: "auto" },
    },
})

globalStyle(`${TAPED_ROOT} ${collectionsGrid}:has(> :nth-child(5):last-child) > :nth-child(n+3)`, {
    gridColumn: "span 2",
    "@media": {
        "(max-width: 760px)": { gridColumn: "auto" },
    },
})

globalStyle(`${TAPED_ROOT} ${collectionCard}:nth-child(even)`, { transform: "rotate(0.9deg)" })
globalStyle(`${TAPED_ROOT} ${collectionCard}:nth-child(3n)`, { transform: "rotate(-0.4deg)" })

globalStyle(`${TAPED_ROOT} ${collectionCard}::before`, {
    content: '""',
    position: "absolute",
    zIndex: 1,
    top: -15,
    left: "50%",
    width: "min(34%, 150px)",
    height: 30,
    background: MASKING_TAPE,
    clipPath: TAPE_CLIP,
    transform: "translateX(-50%) rotate(-2deg)",
    pointerEvents: "none",
})

globalStyle(`${TAPED_ROOT} ${collectionCover}`, {
    borderRadius: 0,
    aspectRatio: "4 / 3",
    marginBottom: 10,
})

globalStyle(`${TAPED_ROOT} ${collectionCard} ${eyebrow}`, {
    fontFamily: scriptFont,
    fontSize: 21,
    fontWeight: 400,
    letterSpacing: 0,
    textTransform: "none",
    color: marketing.color.accent,
    padding: "0 4px",
})

globalStyle(`${TAPED_ROOT} ${collectionCard} ${titleRow}`, {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 4,
    padding: "0 4px",
})

globalStyle(`${TAPED_ROOT} ${collectionTitle}`, {
    fontSize: "clamp(22px, 2.2vw, 30px)",
    textTransform: "uppercase",
    lineHeight: 1,
})

globalStyle(`${TAPED_ROOT} ${collectionCard} ${itemDescription}`, { padding: "0 4px" })
