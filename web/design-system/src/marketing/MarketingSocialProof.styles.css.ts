import { globalStyle, keyframes, style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { scaledSpace } from "./theme/feelBridge"
import {
    LACQUER_ROOT,
    METALLIC_ROOT,
    TWO_INK_ROOT,
    captionFontStack,
    coverStar,
    goldFill,
    metalText,
    spot1,
    spot2,
} from "./shared.css"

export const strip = style({
    display: "flex",
    flexWrap: "wrap",
    gap: `${scaledSpace(14)} ${scaledSpace(34)}`,
    justifyContent: "center",
    alignItems: "baseline",
    padding: `${scaledSpace(34)} 0 ${scaledSpace(10)}`,
})

export const label = style({
    width: "100%",
    textAlign: "center",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
    marginBottom: 4,
})

export const item = style({
    // Set as wordmarks — display face, tight caps — so the strip reads as a
    // deliberate row of logos rather than leftover body text.
    fontFamily: marketing.font.display,
    fontSize: 15,
    fontWeight: 800,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    // Quieter than body-subtle: logos whisper, they don't compete.
    color: `color-mix(in srgb, ${marketing.color.subtle} 72%, ${marketing.color.pageBg})`,
})

/*
 * `marquee`: the text-logo strip on a continuous scroll. Two copies of the
 * group sit back-to-back and the track slides exactly one copy's width
 * (-50%), so the loop point never shows. Edge masks fade the names in and
 * out; hover pauses; reduced-motion falls back to a static centered wrap.
 */
const marqueeSlide = keyframes({
    from: { transform: "translateX(0)" },
    to: { transform: "translateX(-50%)" },
})

export const marqueeWrap = style({
    padding: `${scaledSpace(34)} 0 ${scaledSpace(10)}`,
})

export const marqueeViewport = style({
    overflow: "hidden",
    maskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
    WebkitMaskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
})

export const marqueeTrack = style({
    display: "flex",
    width: "max-content",
    animation: `${marqueeSlide} 28s linear infinite`,
    selectors: {
        [`${marqueeViewport}:hover &`]: { animationPlayState: "paused" },
    },
    "@media": {
        "(prefers-reduced-motion: reduce)": {
            animation: "none",
            width: "auto",
            flexWrap: "wrap",
            justifyContent: "center",
        },
    },
})

export const marqueeGroup = style({
    display: "flex",
    alignItems: "baseline",
    gap: scaledSpace(34),
    paddingRight: scaledSpace(34),
    "@media": {
        "(prefers-reduced-motion: reduce)": {
            flexWrap: "wrap",
            justifyContent: "center",
            rowGap: scaledSpace(14),
            // The duplicate copy is redundant when nothing moves.
            selectors: { "&[aria-hidden]": { display: "none" } },
        },
    },
})

/*
 * `ticker`: the marquee mechanics at display scale — monumental stroke-only
 * words rolling the full width, the severe registers' moving set piece.
 * Outline is the variant's identity (not gated on the treatment flag):
 * filled type at this size would shout the section into a wall.
 *
 * Under the `mist` treatment the same mechanics become a quiet utility
 * strip — hairline rules above and below, the label held at the page
 * column's left edge, the items in small tracked mono — a site-board
 * line, not a set piece.
 */
const MIST = '[data-marketing-treatment~="mist"] &'

export const tickerWrap = style({
    padding: `${scaledSpace(28)} 0`,
    // The words own the full viewport width; the page column would crop
    // the roll into a window.
    width: "100vw",
    marginLeft: "calc(50% - 50vw)",
    selectors: {
        [MIST]: {
            display: "flex",
            alignItems: "center",
            padding: `${scaledSpace(15)} 0`,
            borderTop: `1px solid ${marketing.color.line}`,
            borderBottom: `1px solid ${marketing.color.line}`,
        },
    },
})

globalStyle(`[data-marketing-treatment~="mist"] ${tickerWrap} > ${marqueeViewport}`, {
    flex: 1,
    minWidth: 0,
    "@media": {
        // Static, the lines wrap inside the strip — nothing slides in, so
        // the edge fade would only clip the first and last words.
        "(prefers-reduced-motion: reduce)": { maskImage: "none", WebkitMaskImage: "none" },
    },
})

/**
 * The ticker's wrap is a plain block (the words need the full width), so
 * its lead-in must be one too — inline, the shared label's centering
 * never applied and it sat flush against the viewport edge.
 */
export const tickerLabel = style({
    display: "block",
    marginBottom: scaledSpace(10),
    selectors: {
        [MIST]: {
            flex: "none",
            width: "auto",
            margin: 0,
            // Aligned to the page column's content edge (MarketingPage's
            // centered max-width column with its 24px gutter).
            paddingLeft: `calc((100vw - min(${marketing.layout.maxWidth}, 100vw)) / 2 + 24px)`,
            paddingRight: scaledSpace(28),
            fontFamily: captionFontStack,
            fontSize: 11.5,
            fontWeight: 500,
            letterSpacing: "0.2em",
            color: marketing.color.accent,
            whiteSpace: "nowrap",
        },
    },
})

export const tickerTrack = style([
    marqueeTrack,
    {
        alignItems: "baseline",
        // Monumental words need a slower roll to stay legible in motion.
        animationDuration: "44s",
        selectors: {
            // A reading pace for small type: the line drifts, it doesn't scroll.
            [MIST]: { animationDuration: "70s" },
        },
    },
])

export const tickerItem = style({
    fontFamily: marketing.font.display,
    fontSize: `calc(clamp(44px, 7vw, 84px) * ${marketing.display.scale})`,
    fontWeight: marketing.display.weight,
    letterSpacing: marketing.display.tracking,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    lineHeight: 1.15,
    color: "transparent",
    WebkitTextStroke: `1.5px color-mix(in srgb, ${marketing.color.text} 60%, transparent)`,
    selectors: {
        [MIST]: {
            fontFamily: captionFontStack,
            fontSize: 12.5,
            fontWeight: 400,
            letterSpacing: "0.14em",
            lineHeight: 1.6,
            color: marketing.color.text,
            WebkitTextStroke: "0",
        },
    },
})

export const tickerSeparator = style({
    fontFamily: marketing.font.display,
    fontSize: `calc(clamp(28px, 4vw, 48px) * ${marketing.display.scale})`,
    color: marketing.color.subtle,
    alignSelf: "center",
    selectors: {
        // A small amber tick between items; the item text carries its own
        // dashes ("Arch Cape cabin — timber frame, week 9 of 30").
        [MIST]: {
            fontSize: 0,
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: marketing.color.accent,
            flex: "none",
        },
    },
})

globalStyle(`[data-marketing-treatment~="mist"] ${tickerWrap} ${tickerSeparator}:last-child`, {
    "@media": { "(prefers-reduced-motion: reduce)": { display: "none" } },
})

export const metricsRow = style({
    display: "flex",
    flexWrap: "wrap",
    gap: `${scaledSpace(22)} ${scaledSpace(48)}`,
    justifyContent: "center",
    padding: `${scaledSpace(40)} 0 ${scaledSpace(12)}`,
})

export const metric = style({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
})

export const metricValue = style({
    fontFamily: marketing.font.display,
    fontSize: "clamp(28px, 4vw, 40px)",
    fontWeight: marketing.display.weight,
    letterSpacing: marketing.display.tracking,
    color: marketing.color.accent,
    lineHeight: 1.1,
})

export const metricLabel = style({
    fontSize: 12.5,
    fontWeight: 600,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
})

/*
 * `sport` (gameday) on the name strip: the neighborhoods as a fixture
 * line — condensed italic caps in full text color, slashed apart in the
 * accent, under a label cut as accent tape.
 */
const SPORT_ROOT = '[data-marketing-treatment~="sport"]'

globalStyle(`${SPORT_ROOT} ${strip}`, { gap: `${scaledSpace(10)} ${scaledSpace(22)}` })

globalStyle(`${SPORT_ROOT} ${label}`, {
    width: "auto",
    flexBasis: "100%",
    fontFamily: marketing.font.display,
    fontStyle: "italic",
    fontWeight: 800,
    fontSize: 16,
    letterSpacing: "0.1em",
    color: marketing.color.accent,
    marginBottom: 6,
})

globalStyle(`${SPORT_ROOT} ${item}`, {
    fontStyle: "italic",
    fontSize: "clamp(19px, 1.9vw, 23px)",
    letterSpacing: "0.02em",
    color: marketing.color.text,
})

globalStyle(`${SPORT_ROOT} ${item} + ${item}::before`, {
    content: '"/"',
    marginRight: scaledSpace(20),
    color: marketing.color.accent,
    "@media": { "(max-width: 560px)": { content: "none" } },
})

// A phone wraps the line, and a slash would lead each new row — each name
// takes an accent underscore instead.
globalStyle(`${SPORT_ROOT} ${item}`, {
    "@media": {
        "(max-width: 560px)": { borderBottom: `2px solid ${marketing.color.accent}`, paddingBottom: 2 },
    },
})

/*
 * `pulp` (creature) on the name strip: the neighborhoods as the poster's
 * playing-at list — poster caps in cream, starred apart in spot ink.
 */
const PULP_ROOT = '[data-marketing-treatment~="pulp"]'

globalStyle(`${PULP_ROOT} ${label}`, {
    fontFamily: marketing.font.display,
    fontWeight: 400,
    fontSize: 18,
    letterSpacing: "0.16em",
    color: marketing.color.accent,
    marginBottom: 6,
})

globalStyle(`${PULP_ROOT} ${item}`, {
    fontWeight: 400,
    fontSize: "clamp(19px, 1.9vw, 25px)",
    letterSpacing: "0.06em",
    color: marketing.color.text,
})

globalStyle(`${PULP_ROOT} ${item} + ${item}::before`, {
    content: '"★"',
    marginRight: scaledSpace(20),
    color: spot1,
})

/*
 * `two-ink` (riso) ticker: the roll becomes a strip of tape pulled in the
 * dark drum — a solid band across the sheet, the label and the items
 * reversed out in paper caps, warm-drum dots between them.
 */
globalStyle(`${TWO_INK_ROOT} ${tickerWrap}`, {
    display: "flex",
    alignItems: "center",
    padding: `${scaledSpace(15)} 0`,
    marginTop: scaledSpace(56),
    background: spot1,
    color: spot2,
})

globalStyle(`${TWO_INK_ROOT} ${tickerWrap} > ${marqueeViewport}`, {
    flex: 1,
    minWidth: 0,
    "@media": {
        "(prefers-reduced-motion: reduce)": { maskImage: "none", WebkitMaskImage: "none" },
    },
})

globalStyle(`${TWO_INK_ROOT} ${tickerLabel}`, {
    flex: "none",
    width: "auto",
    margin: 0,
    paddingLeft: `calc((100vw - min(${marketing.layout.maxWidth}, 100vw)) / 2 + 24px)`,
    paddingRight: scaledSpace(28),
    fontFamily: marketing.font.display,
    fontSize: 15,
    fontWeight: 800,
    letterSpacing: "0.14em",
    color: spot2,
    whiteSpace: "nowrap",
    textAlign: "left",
    "@media": {
        "(max-width: 720px)": { display: "none" },
    },
})

globalStyle(`${TWO_INK_ROOT} ${tickerTrack}`, {
    alignItems: "center",
    animationDuration: "64s",
})

globalStyle(`${TWO_INK_ROOT} ${tickerItem}`, {
    fontSize: "clamp(17px, 1.7vw, 22px)",
    fontWeight: 700,
    letterSpacing: "0.05em",
    lineHeight: 1.5,
    color: spot2,
    WebkitTextStroke: "0",
    "@media": {
        // Static, the lines wrap inside the band instead of running off it.
        "(prefers-reduced-motion: reduce)": { whiteSpace: "normal", textAlign: "center", paddingInline: 16 },
    },
})

globalStyle(`${TWO_INK_ROOT} ${tickerSeparator}`, {
    fontSize: 0,
    width: 9,
    height: 9,
    margin: "0 20px",
    borderRadius: "50%",
    background: marketing.color.accent,
    flex: "none",
})

globalStyle(`${TWO_INK_ROOT} ${tickerWrap} ${tickerSeparator}:last-child`, {
    "@media": { "(prefers-reduced-motion: reduce)": { display: "none" } },
})

/*
 * Under the `linework` treatment the ticker is an instrument readout — a
 * mixer's channel strip: a framed band on the surface, the label lit in
 * the spark ink on the left, the items in tracked mono at reading size,
 * separated by small lamps that alternate between the current and the
 * spark.
 */
const LINEWORK_ROOT = '[data-marketing-treatment~="linework"]'

globalStyle(`${LINEWORK_ROOT} ${tickerWrap}`, {
    display: "flex",
    alignItems: "center",
    padding: `${scaledSpace(20)} 0`,
    borderTop: `1px solid ${marketing.color.line}`,
    borderBottom: `1px solid ${marketing.color.line}`,
    background: `color-mix(in srgb, ${marketing.color.surface} 88%, transparent)`,
})

globalStyle(`${LINEWORK_ROOT} ${tickerWrap} > ${marqueeViewport}`, {
    flex: 1,
    minWidth: 0,
    "@media": {
        "(prefers-reduced-motion: reduce)": { maskImage: "none", WebkitMaskImage: "none" },
    },
})

globalStyle(`${LINEWORK_ROOT} ${tickerLabel}`, {
    flex: "none",
    width: "auto",
    margin: 0,
    paddingLeft: `calc((100vw - min(${marketing.layout.maxWidth}, 100vw)) / 2 + 24px)`,
    paddingRight: scaledSpace(30),
    fontFamily: captionFontStack,
    fontSize: 11.5,
    fontWeight: 600,
    letterSpacing: "0.22em",
    color: `var(--marketing-spot-1, ${marketing.color.accent})`,
    whiteSpace: "nowrap",
})

globalStyle(`${LINEWORK_ROOT} ${tickerTrack}`, {
    animationDuration: "56s",
})

globalStyle(`${LINEWORK_ROOT} ${tickerItem}`, {
    fontFamily: captionFontStack,
    fontSize: 17,
    fontWeight: 500,
    letterSpacing: "0.14em",
    lineHeight: 1.6,
    color: marketing.color.text,
    WebkitTextStroke: "0",
})

globalStyle(`${LINEWORK_ROOT} ${tickerSeparator}`, {
    fontSize: 0,
    width: 8,
    height: 8,
    margin: "0 6px",
    borderRadius: "50%",
    background: marketing.color.accent,
    boxShadow: `0 0 10px ${marketing.color.accent}`,
    flex: "none",
})

// Still, the readout stacks: the label over one centered line of items,
// which would otherwise wrap one per line beside a long license label.
// On a phone the label takes its own line above the roll as well.
globalStyle(`${LINEWORK_ROOT} ${tickerWrap}`, {
    "@media": {
        "(prefers-reduced-motion: reduce)": { flexDirection: "column", gap: scaledSpace(10) },
        "(max-width: 860px)": { flexDirection: "column", alignItems: "stretch", gap: scaledSpace(10) },
    },
})

globalStyle(`${LINEWORK_ROOT} ${tickerLabel}`, {
    "@media": {
        "(prefers-reduced-motion: reduce)": {
            paddingLeft: 24,
            paddingRight: 24,
            textAlign: "center",
            whiteSpace: "normal",
        },
        "(max-width: 860px)": {
            paddingLeft: 24,
            paddingRight: 24,
            textAlign: "center",
            whiteSpace: "normal",
        },
    },
})

globalStyle(`${LINEWORK_ROOT} ${tickerWrap} ${marqueeGroup}`, {
    "@media": {
        "(prefers-reduced-motion: reduce)": { gap: `${scaledSpace(8)} ${scaledSpace(18)}`, paddingRight: 0 },
    },
})

globalStyle(`${LINEWORK_ROOT} ${tickerWrap} ${tickerSeparator}:last-child`, {
    "@media": { "(prefers-reduced-motion: reduce)": { display: "none" } },
})

globalStyle(`${LINEWORK_ROOT} ${tickerSeparator}:nth-child(4n)`, {
    background: `var(--marketing-spot-1, ${marketing.color.accent})`,
    boxShadow: `0 0 10px var(--marketing-spot-1, ${marketing.color.accent})`,
})

/*
 * Under `signpaint` the metrics strip is lettered: the figures in the
 * show-card caps with the painted drop shade.
 */
globalStyle(`[data-marketing-treatment~="signpaint"] ${metricValue}`, {
    color: marketing.color.text,
    fontSize: `calc(clamp(32px, 4.4vw, 48px) * ${marketing.display.scale})`,
    textShadow: `0.05em 0.06em 0 var(--marketing-spot-1, ${marketing.color.accent})`,
})

/*
 * metallic and lacquer: the ticker stops rolling and becomes a strip set
 * once, centered — the cover's price strip in gold and tangerine
 * condensed caps between gold rules (metallic), or the counter's tiny
 * spaced tagline between hairlines (lacquer). The label stays for
 * assistive tech only; the duplicate loop copy is dropped.
 */
const STATIC_TICKER = `${METALLIC_ROOT} ${tickerWrap}, ${LACQUER_ROOT} ${tickerWrap}`

globalStyle(STATIC_TICKER, {
    display: "flex",
    justifyContent: "center",
})

globalStyle(`${METALLIC_ROOT} ${tickerLabel}, ${LACQUER_ROOT} ${tickerLabel}`, {
    position: "absolute",
    width: 1,
    height: 1,
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    whiteSpace: "nowrap",
    margin: 0,
})

globalStyle(
    `${METALLIC_ROOT} ${tickerWrap} ${marqueeViewport}, ${LACQUER_ROOT} ${tickerWrap} ${marqueeViewport}`,
    {
        maskImage: "none",
        WebkitMaskImage: "none",
        overflow: "visible",
        width: `min(${marketing.layout.maxWidth}, 100%)`,
        padding: "0 24px",
    },
)

globalStyle(`${METALLIC_ROOT} ${tickerTrack}, ${LACQUER_ROOT} ${tickerTrack}`, {
    animation: "none",
    width: "auto",
    justifyContent: "center",
})

globalStyle(
    `${METALLIC_ROOT} ${tickerTrack} ${marqueeGroup}[aria-hidden], ${LACQUER_ROOT} ${tickerTrack} ${marqueeGroup}[aria-hidden]`,
    { display: "none" },
)

globalStyle(
    `${METALLIC_ROOT} ${tickerTrack} ${marqueeGroup}, ${LACQUER_ROOT} ${tickerTrack} ${marqueeGroup}`,
    {
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        padding: 0,
    },
)

globalStyle(`${METALLIC_ROOT} ${tickerWrap}`, {
    padding: `${scaledSpace(18)} 0`,
    borderTop: `1px solid ${spot1}`,
    borderBottom: `1px solid ${spot1}`,
    background: `linear-gradient(180deg, color-mix(in srgb, ${marketing.color.surface} 92%, ${spot1}), ${marketing.color.surface})`,
})

globalStyle(`${METALLIC_ROOT} ${tickerTrack} ${marqueeGroup}`, {
    gap: `8px ${scaledSpace(26)}`,
})

globalStyle(`${METALLIC_ROOT} ${tickerItem}`, {
    ...metalText(goldFill, "0.02em"),
    fontStretch: "72%",
    fontWeight: 900,
    fontSize: "clamp(22px, 2.5vw, 36px)",
    letterSpacing: "0.02em",
    lineHeight: 1,
    WebkitTextStroke: "0",
})

globalStyle(`${METALLIC_ROOT} ${tickerSeparator}`, {
    fontSize: 0,
    alignSelf: "center",
})

globalStyle(`${METALLIC_ROOT} ${tickerSeparator}::before`, {
    content: coverStar,
    fontSize: 22,
    color: marketing.color.accent,
})

globalStyle(`${METALLIC_ROOT} ${tickerTrack} ${marqueeGroup} > ${tickerSeparator}:last-child`, {
    display: "none",
})

// The strip opens and closes on a tangerine star, like the board's edges.
globalStyle(`${METALLIC_ROOT} ${tickerTrack} ${marqueeGroup}::before`, {
    content: coverStar,
    fontSize: 22,
    color: marketing.color.accent,
})

globalStyle(`${METALLIC_ROOT} ${tickerTrack} ${marqueeGroup}::after`, {
    content: coverStar,
    fontSize: 22,
    color: marketing.color.accent,
})

globalStyle(`${LACQUER_ROOT} ${tickerWrap}`, {
    padding: `${scaledSpace(26)} 0`,
    borderTop: `1px solid color-mix(in srgb, ${spot1} 32%, transparent)`,
    borderBottom: `1px solid color-mix(in srgb, ${spot1} 32%, transparent)`,
})

globalStyle(`${LACQUER_ROOT} ${tickerTrack} ${marqueeGroup}`, {
    gap: `6px ${scaledSpace(18)}`,
})

globalStyle(`${LACQUER_ROOT} ${tickerItem}`, {
    fontFamily: marketing.font.body,
    fontSize: 12.5,
    fontWeight: 400,
    letterSpacing: "0.44em",
    lineHeight: 1.6,
    color: spot1,
    WebkitTextStroke: "0",
})

globalStyle(`${LACQUER_ROOT} ${tickerSeparator}`, {
    fontSize: 0,
    width: 5,
    height: 5,
    background: marketing.color.accent,
    transform: "rotate(45deg)",
    flex: "none",
})

globalStyle(`${LACQUER_ROOT} ${tickerTrack} ${marqueeGroup} > ${tickerSeparator}:last-child`, {
    display: "none",
})

// metallic + lacquer: the service-area strip in the register's caps.
globalStyle(`${METALLIC_ROOT} ${item}`, {
    fontStretch: "75%",
    fontWeight: 800,
    fontSize: 18,
    letterSpacing: "0.12em",
    color: spot1,
})

globalStyle(`${LACQUER_ROOT} ${item}`, {
    fontWeight: 500,
    fontSize: 16,
    letterSpacing: "0.16em",
    color: spot1,
})

globalStyle(`${METALLIC_ROOT} ${label}, ${LACQUER_ROOT} ${label}`, {
    letterSpacing: "0.3em",
    color: marketing.color.subtle,
})
