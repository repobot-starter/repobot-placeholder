import { globalStyle, style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { scaledSpace } from "./theme/feelBridge"
import {
    ATOMIC_ROOT,
    COLORBLOCK_ROOT,
    LACQUER_ROOT,
    LARIAT_ROOT,
    MASKING_TAPE,
    MIRRORBALL_ROOT,
    TAPED_ROOT,
    TAPE_CLIP,
    TWO_INK_ROOT,
    ZINE_ROOT,
    atomicStar,
    ctaPrimary,
    scriptFont,
    sectionTitle,
    spot1,
    spot2,
} from "./shared.css"
import { bleed, overlaySoft } from "./MarketingBackdrop.styles.css"

export const card = style({
    textAlign: "center",
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
    padding: `${scaledSpace(56)} 24px`,
    marginTop: scaledSpace(72),
})

/** Over a backdrop the banner is an edge-to-edge band, not a boxed card. */
export const band = style({
    textAlign: "center",
    padding: `${scaledSpace(88)} 0`,
    marginTop: scaledSpace(72),
})

/**
 * `full-bleed`: an edge-to-edge tinted band, no card chrome — the closing
 * statement. The tint rides the theme's soft accent so every preset keeps
 * its own register.
 */
export const fullBleed = style({
    textAlign: "center",
    width: "100vw",
    marginLeft: "calc(50% - 50vw)",
    marginTop: scaledSpace(72),
    padding: `${scaledSpace(88)} 24px`,
    background: marketing.color.accentSoft,
    borderTop: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderBottom: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
})

/*
 * `colophon`: the photographer's sign-off — an edge-to-edge band of the
 * page surface that abuts whatever precedes it, one quiet sentence in the
 * display face at reading size, and the ask as an underlined text link.
 */
export const colophon = style({
    boxSizing: "border-box",
    width: "100vw",
    marginLeft: "calc(50% - 50vw)",
    padding: `${scaledSpace(72)} 24px ${scaledSpace(80)}`,
    background: marketing.color.surface,
    color: marketing.color.text,
    textAlign: "center",
})

export const colophonStart = style({
    textAlign: "left",
})

export const colophonInner = style({
    width: "min(100%, 720px)",
    margin: "0 auto",
    selectors: {
        [`${colophonStart} &`]: { width: `min(100%, calc(${marketing.layout.maxWidth} - 48px))` },
    },
})

export const colophonLine = style({
    margin: 0,
    fontFamily: marketing.font.display,
    fontSize: "clamp(19px, 1.7vw, 24px)",
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: "0.005em",
    textTransform: "none",
    color: marketing.color.text,
    textWrap: "balance",
    selectors: {
        [`${colophonStart} &`]: { textWrap: "pretty" },
    },
})

export const colophonLink = style({
    display: "inline-block",
    marginTop: scaledSpace(22),
    fontFamily: marketing.font.body,
    fontSize: 17,
    color: marketing.color.text,
    textDecoration: "underline",
    textDecorationThickness: 1,
    textUnderlineOffset: 6,
    ":hover": { color: marketing.color.subtle },
    ":focus-visible": { outline: `2px solid ${marketing.color.accent}`, outlineOffset: 4 },
})

/*
 * `ticket`: the card as an admission stub — a solid outer edge with a
 * perforated inner rule and punched side notches (pageBg circles riding
 * the border), for invitations rather than signups.
 */
export const ticket = style({
    position: "relative",
    textAlign: "center",
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
    outline: `1px dashed ${marketing.color.line}`,
    outlineOffset: -12,
    padding: `${scaledSpace(56)} 24px`,
    marginTop: scaledSpace(72),
})

const ticketNotch = style({
    position: "absolute",
    top: "50%",
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: marketing.color.pageBg,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
})

export const ticketNotchLeft = style([ticketNotch, { left: -12, transform: "translateY(-50%)" }])

export const ticketNotchRight = style([ticketNotch, { right: -12, transform: "translateY(-50%)" }])

export const title = style([
    sectionTitle,
    {
        marginBottom: 28,
    },
])

export const body = style({
    fontSize: 15,
    lineHeight: 1.6,
    color: marketing.color.subtle,
    maxWidth: 560,
    margin: "-16px auto 28px",
})

export const cta = ctaPrimary

/*
 * `pop` treatment (memphis): the card becomes the flyer's closing band — the
 * lemon spot ink under ink type, the title shadowed in the accent. The ink is
 * fixed so the band reads the same in both modes (the lemon never darkens).
 */
const POP_ROOT = '[data-marketing-treatment~="pop"]'
const POP_INK = "#141414" // theme-exempt: ink on the lemon spot in both modes.

globalStyle(`${POP_ROOT} ${card}`, {
    background: spot2,
    borderWidth: 3,
    borderColor: POP_INK,
    transform: "rotate(-0.6deg)",
})

globalStyle(`${POP_ROOT} ${card} ${title}`, {
    color: POP_INK,
    textShadow: `0.06em 0.06em 0 ${marketing.color.accent}`,
})

globalStyle(`${POP_ROOT} ${card} ${body}`, { color: POP_INK })

/*
 * `classified`: the boxed ad in the back of the paper. A double ink rule
 * boxes it (print, not UI: no radius, no shadow), the kicker sits ON the
 * top rule like a tab cut into it, the headline runs in display caps,
 * and the price line is ruled off both sides. The signoff box is the
 * advertiser's business card, ruled in the same ink.
 */
export const classified = style({
    position: "relative",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(200px, 280px)",
    gap: scaledSpace(28),
    alignItems: "center",
    textAlign: "center",
    border: `4px double ${marketing.color.text}`,
    background: marketing.color.surface,
    padding: `${scaledSpace(40)} ${scaledSpace(32)} ${scaledSpace(32)}`,
    marginTop: scaledSpace(72),
    "@media": {
        "(max-width: 760px)": {
            gridTemplateColumns: "1fr",
            padding: `${scaledSpace(36)} 18px 22px`,
        },
    },
})

export const classifiedSolo = style({ gridTemplateColumns: "1fr" })

export const classifiedKicker = style({
    position: "absolute",
    top: 0,
    left: "50%",
    transform: "translate(-50%, -55%)",
    whiteSpace: "nowrap",
    background: marketing.color.pageBg,
    padding: "0 12px",
    fontFamily: marketing.font.body,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: marketing.color.text,
})

export const classifiedMain = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: 0,
})

export const classifiedTitle = style({
    fontFamily: marketing.font.display,
    fontWeight: marketing.display.weight,
    textTransform: marketing.display.transform as "none",
    letterSpacing: marketing.display.tracking,
    fontSize: `calc(clamp(34px, 5.4vw, 64px) * ${marketing.display.scale})`,
    lineHeight: 0.92,
    color: marketing.color.text,
    margin: 0,
})

export const classifiedPrice = style({
    display: "flex",
    alignItems: "center",
    gap: 14,
    width: "100%",
    maxWidth: 620,
    fontFamily: marketing.font.display,
    fontWeight: marketing.display.weight,
    textTransform: marketing.display.transform as "none",
    letterSpacing: "0.05em",
    fontSize: "clamp(20px, 2.4vw, 30px)",
    lineHeight: 1.1,
    color: marketing.color.accent,
    margin: `${scaledSpace(12)} 0 0`,
    selectors: {
        "&::before, &::after": {
            content: '""',
            flex: "1 1 24px",
            height: 3,
            background: marketing.color.text,
        },
    },
})

export const classifiedBody = style({
    fontFamily: marketing.font.body,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    lineHeight: 1.5,
    color: marketing.color.text,
    maxWidth: 620,
    margin: `${scaledSpace(12)} 0 0`,
})

export const classifiedCta = style([ctaPrimary, { marginTop: scaledSpace(20) }])

export const classifiedFinePrint = style({
    fontFamily: marketing.font.body,
    fontSize: 12,
    fontStyle: "italic",
    lineHeight: 1.5,
    color: marketing.color.subtle,
    maxWidth: 560,
    margin: `${scaledSpace(12)} 0 0`,
})

export const classifiedSignoff = style({
    display: "flex",
    flexDirection: "column",
    gap: 10,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.text}`,
    outline: `${marketing.shape.borderWidth} solid ${marketing.color.text}`,
    outlineOffset: 3,
    padding: "20px 16px",
    margin: 4,
})

export const classifiedSignoffName = style({
    fontFamily: marketing.font.display,
    fontWeight: marketing.display.weight,
    textTransform: marketing.display.transform as "none",
    letterSpacing: "0.04em",
    fontSize: 22,
    lineHeight: 1.05,
    color: marketing.color.text,
})

export const classifiedSignoffNote = style({
    fontFamily: marketing.font.body,
    fontSize: 16,
    fontStyle: "italic",
    lineHeight: 1.35,
    color: marketing.color.text,
})

/*
 * `sport` (gameday): the closing banner is the drop's accent plate — ink
 * type on the volt, a slant of darker stripes like a mown pass, the ask
 * inverted to an ink button so it still reads on the accent.
 */
const SPORT_ROOT = '[data-marketing-treatment~="sport"]'

globalStyle(`${SPORT_ROOT} ${card}`, {
    background:
        `repeating-linear-gradient(150deg, transparent 0 90px, color-mix(in srgb, ${marketing.color.onAccent} 7%, transparent) 90px 180px), ` +
        marketing.color.accent,
    border: "none",
    transform: "skewY(-1.2deg)",
    padding: `${scaledSpace(64)} 24px`,
})

globalStyle(`${SPORT_ROOT} ${card} > *`, { transform: "skewY(1.2deg)" })

globalStyle(`${SPORT_ROOT} ${card} ${title}`, { color: marketing.color.onAccent })

globalStyle(`${SPORT_ROOT} ${card} ${body}`, {
    color: `color-mix(in srgb, ${marketing.color.onAccent} 82%, transparent)`,
    fontWeight: 600,
})

globalStyle(`${SPORT_ROOT} ${card} ${cta}`, {
    color: marketing.color.accent,
    background: marketing.color.onAccent,
    boxShadow: "none",
})

/*
 * `pulp` (creature): the closing banner is the one-sheet's tag line — the
 * accent poster panel in a cream mount with the hard drop, the title in
 * cream extruded in ink, the ask a spot-ink button.
 */
const PULP_ROOT = '[data-marketing-treatment~="pulp"]'
const PULP_INK = "#070b1c" // theme-exempt: the poster's midnight ink on the accent and spot panels, in every appearance

globalStyle(`${PULP_ROOT} ${card}`, {
    background: marketing.color.accent,
    border: `4px solid ${spot2}`,
    transform: "rotate(-0.8deg)",
})

globalStyle(`${PULP_ROOT} ${card} ${title}`, {
    color: spot2,
    textShadow: `2px 2px 0 ${PULP_INK}, 4px 4px 0 ${PULP_INK}, 6px 6px 0 ${PULP_INK}`,
})

globalStyle(`${PULP_ROOT} ${card} ${body}`, { color: PULP_INK, fontWeight: 700 })

globalStyle(`${PULP_ROOT} ${card} ${cta}`, {
    color: PULP_INK,
    background: spot1,
    borderColor: PULP_INK,
    boxShadow: `4px 4px 0 ${PULP_INK}`,
})

/*
 * `two-ink` (riso) and `colorblock` (paintchip): over a backdrop the
 * closing band becomes a flat panel on the photograph — the print (or the
 * photo) shows whole, unveiled, and the copy sits on a card of the page
 * ground: a trimmed paper label ruled in ink for riso, an ink-offset chip
 * for paintchip.
 */
globalStyle(
    `${TWO_INK_ROOT} ${bleed}:has(${band}) > ${overlaySoft}, ${COLORBLOCK_ROOT} ${bleed}:has(${band}) > ${overlaySoft}`,
    {
        display: "none",
    },
)

globalStyle(`${TWO_INK_ROOT} ${band}, ${COLORBLOCK_ROOT} ${band}`, {
    maxWidth: 660,
    margin: `${scaledSpace(96)} auto`,
    padding: `${scaledSpace(48)} ${scaledSpace(40)}`,
    background: marketing.color.pageBg,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
})

globalStyle(`${TWO_INK_ROOT} ${band}`, {
    borderColor: marketing.color.text,
})

globalStyle(`${COLORBLOCK_ROOT} ${band}`, {
    boxShadow: `10px 10px 0 ${marketing.color.line}`,
})

globalStyle(`${TWO_INK_ROOT} ${band} ${body}, ${COLORBLOCK_ROOT} ${band} ${body}`, {
    color: marketing.color.text,
})

// Riso's brush stroke centers under a centered banner title.
globalStyle(
    `${TWO_INK_ROOT} ${card} ${title}::after, ${TWO_INK_ROOT} ${band} ${title}::after, ` +
        `${TWO_INK_ROOT} ${fullBleed} ${title}::after, ${TWO_INK_ROOT} ${ticket} ${title}::after`,
    { marginLeft: "auto", marginRight: "auto" },
)

/*
 * `sunburst`: the closing band is the motel sign at dusk — the register's
 * half-sun ornament rising off the band's lower left corner, a ridge of
 * desert mountains in the faded accent along the lower right, both behind
 * the copy and clear of the centered title and ask.
 */
const SUNBURST_ROOT = '[data-marketing-treatment~="sunburst"]'
const MOUNTAIN_RIDGE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 520 160' preserveAspectRatio='xMaxYMax meet'%3E%3Cpath d='M0 160 L60 118 L92 128 L150 70 L176 84 L214 40 L238 52 L262 28 L300 66 L330 58 L372 100 L410 86 L462 124 L520 108 L520 160 Z' fill='black'/%3E%3C/svg%3E")`

globalStyle(`${SUNBURST_ROOT} ${fullBleed}`, {
    position: "relative",
    isolation: "isolate",
    overflow: "hidden",
    paddingBottom: scaledSpace(120),
})

globalStyle(`${SUNBURST_ROOT} ${fullBleed}::before`, {
    content: '""',
    position: "absolute",
    zIndex: -1,
    left: "max(-40px, calc((100vw - 1320px) / 2))",
    bottom: 0,
    width: "clamp(260px, 30vw, 440px)",
    aspectRatio: "800 / 420",
    backgroundImage: "var(--marketing-ornament, none)",
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "left bottom",
    "@media": {
        "(max-width: 860px)": { opacity: 0.55 },
    },
})

globalStyle(`${SUNBURST_ROOT} ${fullBleed}::after`, {
    content: '""',
    position: "absolute",
    zIndex: -1,
    right: "max(-20px, calc((100vw - 1320px) / 2))",
    bottom: 0,
    width: "clamp(240px, 34vw, 520px)",
    aspectRatio: "520 / 160",
    background: `color-mix(in srgb, ${marketing.color.accent} 34%, ${marketing.color.pageBg})`,
    WebkitMaskImage: MOUNTAIN_RIDGE,
    maskImage: MOUNTAIN_RIDGE,
    WebkitMaskSize: "100% 100%",
    maskSize: "100% 100%",
    "@media": {
        "(max-width: 860px)": { opacity: 0.6 },
    },
})

// lacquer: the closing swatch keeps its strokes to the edges while a pool
// of black under the copy holds the small print legible.
globalStyle(`${LACQUER_ROOT} ${bleed}:has(${band}) > ${overlaySoft}`, {
    background: `radial-gradient(ellipse 44% 58% at 50% 50%,
        color-mix(in srgb, ${marketing.color.pageBg} 86%, transparent) 0%,
        color-mix(in srgb, ${marketing.color.pageBg} 60%, transparent) 55%,
        transparent 100%),
        linear-gradient(180deg,
        ${marketing.color.pageBg} 0%,
        color-mix(in srgb, ${marketing.color.pageBg} 30%, transparent) 30%,
        color-mix(in srgb, ${marketing.color.pageBg} 30%, transparent) 70%,
        ${marketing.color.pageBg} 100%)`,
})

globalStyle(`${LACQUER_ROOT} ${body}`, {
    color: marketing.color.text,
    letterSpacing: "0.02em",
})

/*
 * `atomic` (midcentury): the closing banner is the catalog's back page — an
 * open band between an ink rule and a hairline, one olive star over the
 * title, no card.
 */
globalStyle(`${ATOMIC_ROOT} ${card}`, {
    background: "none",
    border: "none",
    borderTop: `2px solid ${marketing.color.text}`,
    borderBottom: `1px solid ${marketing.color.line}`,
    borderRadius: 0,
    boxShadow: "none",
})

globalStyle(`${ATOMIC_ROOT} ${card}::before`, {
    ...atomicStar(30, spot2),
    marginBottom: scaledSpace(18),
})

// zine, mirrorball: the banner title is centered, so its swoosh or foil rule is too.
globalStyle(`${ZINE_ROOT} ${title}::after, ${MIRRORBALL_ROOT} ${title}::after`, {
    marginLeft: "auto",
    marginRight: "auto",
})

/*
 * `taped` card: the closing note is a sheet taped to the door at both top
 * corners, hung a little crooked, the body line written in marker.
 */
globalStyle(`${TAPED_ROOT} ${card}`, {
    position: "relative",
    border: "none",
    borderRadius: 1,
    padding: `${scaledSpace(64)} 28px ${scaledSpace(60)}`,
    transform: "rotate(-0.8deg)",
    boxShadow: `0 26px 50px -24px color-mix(in srgb, ${marketing.color.text} 45%, transparent)`,
})

globalStyle(`${TAPED_ROOT} ${card}::before, ${TAPED_ROOT} ${card}::after`, {
    content: '""',
    position: "absolute",
    top: -8,
    width: 150,
    height: 34,
    background: MASKING_TAPE,
    clipPath: TAPE_CLIP,
    pointerEvents: "none",
})

globalStyle(`${TAPED_ROOT} ${card}::before`, {
    left: -34,
    transform: "rotate(-32deg)",
    "@media": { "(max-width: 640px)": { left: -6, width: 96 } },
})
globalStyle(`${TAPED_ROOT} ${card}::after`, {
    right: -34,
    transform: "rotate(30deg)",
    "@media": { "(max-width: 640px)": { right: -6, width: 96 } },
})

globalStyle(`${TAPED_ROOT} ${card} ${title}`, { fontSize: "clamp(40px, 6.4vw, 84px)", marginBottom: 30 })

globalStyle(`${TAPED_ROOT} ${card} ${body}`, {
    fontFamily: scriptFont,
    fontSize: 24,
    lineHeight: 1.3,
    color: marketing.color.text,
    margin: "-14px auto 30px",
})

/*
 * `lariat` ticket: the admission stub to the roundup — a stitched accent
 * perforation, stars flanking the title, the nudge in the slab's italic.
 */
globalStyle(`${LARIAT_ROOT} ${ticket}`, {
    border: `2px solid ${marketing.color.text}`,
    outline: `2px dashed color-mix(in srgb, ${marketing.color.accent} 70%, transparent)`,
    outlineOffset: -14,
    padding: `${scaledSpace(64)} 32px`,
})

globalStyle(`${LARIAT_ROOT} ${ticket} ${title}`, { fontSize: "clamp(34px, 5vw, 64px)" })

globalStyle(`${LARIAT_ROOT} ${ticket} ${title}::before`, {
    content: '"★ ★ ★"',
    display: "block",
    marginBottom: 14,
    fontSize: 18,
    letterSpacing: "0.4em",
    color: spot1,
})

globalStyle(`${LARIAT_ROOT} ${ticket} ${body}`, {
    fontStyle: "italic",
    fontSize: 17,
    color: marketing.color.text,
})
