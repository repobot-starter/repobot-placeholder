import { globalStyle } from "@vanilla-extract/css"
import { marketing } from "../theme/marketingTheme.css"
import { scaledSpace } from "../theme/feelBridge"
import * as hero from "../MarketingHero.styles.css"
import * as prose from "../MarketingRichProse.styles.css"
import * as shell from "../MarketingShell.styles.css"
import * as testimonials from "../MarketingTestimonials.styles.css"

/*
 * `framestack`: the full-bleed stack. A page of photographs with type
 * between them — every frame the same size, nothing boxed.
 *
 * One size: the stack's frames (gallery `sequence` + `captionStack`) take
 * the first photograph's shape capped at 92vh, so a 4:3 stack is a 4:3
 * frame on a phone and a viewport-tall one on a desktop. The full-bleed
 * hero is held to the same box — the 4:3 height of the viewport's width,
 * capped where the hero caps itself — so the opening photograph is one
 * more frame of the stack at every width, not a taller poster above it.
 *
 * On a page that opens on the photograph, the nav floats over it: the
 * sticky wrap takes no height, the bar is chromeless with white ink until
 * the page scrolls (then the flush variants' veil and page ink return),
 * and the hero's copy sits quiet at the frame's foot. Pages that open on
 * paper (the statement heroes of inner pages) keep the nav in flow.
 *
 * On that page the prose after the hero is a short band: a titled band
 * is a list led by its title in the body face; an untitled one is one
 * centered line in the display face. Testimonials there read as a
 * centered list of lines, the voice and the name on one line.
 */
const F = '[data-marketing-treatment~="framestack"]'
const OVER = `${F}:has(${hero.fullBleed})`
const CLEAR = `${OVER} ${shell.bar}:not(${shell.barScrolled}):not(${shell.barFlushScrolled}):not(${shell.barFullWidthScrolled})`
const WHITE = "#ffffff" // theme-exempt: nav and copy over a photographic scrim are white in every theme

globalStyle(`${F} ${hero.fullBleed}`, {
    minHeight: "min(clamp(480px, 92svh, 1100px), 75vw)",
})

globalStyle(`${F} ${hero.fullBleedInner}`, {
    paddingBottom: scaledSpace(52),
    "@media": {
        "(max-width: 640px)": { paddingBottom: 18, paddingLeft: 18, paddingRight: 18 },
    },
})

globalStyle(`${F} ${hero.fullBleed} ${hero.headline}`, {
    fontSize: `calc(clamp(40px, 6vw, 92px) * ${marketing.display.scale})`,
    lineHeight: 1.02,
    maxWidth: "12em",
    textWrap: "balance",
    "@media": {
        "(max-width: 640px)": { fontSize: `calc(40px * ${marketing.display.scale})` },
    },
})

globalStyle(`${F} ${hero.fullBleed} ${hero.subheadline}`, {
    fontSize: 16.5,
    lineHeight: 1.5,
    letterSpacing: "0.01em",
    maxWidth: "none",
    marginTop: scaledSpace(14),
    color: "rgba(255, 255, 255, 0.92)", // theme-exempt: copy over a photographic scrim is white in every theme
    "@media": {
        "(max-width: 640px)": { fontSize: 13, marginTop: 8 },
    },
})

// ---------------------------------------------------------------- the nav
globalStyle(`${OVER} ${shell.stickyWrap}`, {
    height: 0,
    paddingTop: 0,
    paddingBottom: 0,
})

globalStyle(CLEAR, {
    background: "transparent",
    borderColor: "transparent",
    boxShadow: "none",
    backdropFilter: "none",
    WebkitBackdropFilter: "none",
    color: WHITE,
    textShadow: "0 1px 14px rgba(8, 10, 14, 0.45)", // theme-exempt: keeps the white ink off busy photography
})

globalStyle(
    [shell.logo, shell.logoMarked, shell.logoTagline, shell.links, shell.link, shell.linkUnderline]
        .map((part) => `${CLEAR} ${part}`)
        .join(", "),
    { color: WHITE },
)

globalStyle(`${CLEAR} ${shell.burger}`, {
    color: WHITE,
    borderColor: "rgba(255, 255, 255, 0.55)", // theme-exempt: a hairline over the photograph
})

globalStyle(`${CLEAR} ${shell.cta}`, {
    background: "transparent",
    color: WHITE,
    border: "1px solid rgba(255, 255, 255, 0.7)", // theme-exempt: an outlined ask over the photograph
    boxShadow: "none",
})

// ------------------------------------------------------------- the bands
globalStyle(`${OVER} ${prose.wrap}`, {
    padding: `${scaledSpace(40)} 0 ${scaledSpace(44)}`,
})

globalStyle(`${OVER} ${prose.title}`, {
    fontFamily: marketing.font.body,
    fontSize: 18,
    fontWeight: 600,
    letterSpacing: 0,
    lineHeight: 1.55,
    textTransform: "none",
    margin: 0,
    "@media": {
        "(max-width: 640px)": { fontSize: 16 },
    },
})

globalStyle(`${OVER} ${prose.paragraph}`, {
    fontSize: 18,
    lineHeight: 1.55,
    margin: 0,
    "@media": {
        "(max-width: 640px)": { fontSize: 16 },
    },
})

globalStyle(`${OVER} ${prose.frame}:not(:has(${prose.title}))`, {
    maxWidth: 760,
    textAlign: "center",
})

globalStyle(`${OVER} ${prose.frame}:not(:has(${prose.title})) ${prose.paragraph}`, {
    fontFamily: marketing.font.display,
    fontSize: "clamp(18px, 1.8vw, 24px)",
    lineHeight: 1.45,
    textWrap: "balance",
})

// ------------------------------------------------------ the list of lines
globalStyle(`${OVER} ${testimonials.wrap}`, {
    padding: `${scaledSpace(52)} 0 ${scaledSpace(20)}`,
})

globalStyle(`${OVER} ${testimonials.kicker}`, {
    display: "inline-block",
    fontFamily: marketing.font.display,
    fontSize: 13,
    fontWeight: 400,
    letterSpacing: "0.26em",
    color: marketing.color.text,
    paddingBottom: 12,
    marginBottom: scaledSpace(26),
    borderBottom: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
})

globalStyle(`${OVER} ${testimonials.grid}, ${OVER} ${testimonials.gridPair}`, {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: scaledSpace(14),
    maxWidth: 820,
    margin: "0 auto",
    textAlign: "center",
})

globalStyle(`${OVER} ${testimonials.card}`, {
    display: "block",
    background: "none",
    border: "none",
    borderRadius: 0,
    boxShadow: "none",
    padding: 0,
    fontFamily: marketing.font.display,
    fontStyle: "italic",
    fontSize: "clamp(17px, 1.6vw, 20px)",
    lineHeight: 1.5,
    color: marketing.color.text,
    textWrap: "balance",
})

globalStyle(`${OVER} ${testimonials.quote}`, {
    display: "inline",
    font: "inherit",
})

globalStyle(`${OVER} ${testimonials.attribution}`, {
    display: "inline",
    border: "none",
    padding: 0,
})

globalStyle(`${OVER} ${testimonials.author}`, {
    font: "inherit",
})

globalStyle(`${OVER} ${testimonials.author}::before`, {
    content: '" — "',
})

globalStyle(`${OVER} ${testimonials.authorTitle}`, {
    display: "none",
})
