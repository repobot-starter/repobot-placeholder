import { globalStyle } from "@vanilla-extract/css"
import { marketing } from "../theme/marketingTheme.css"
import { scaledSpace } from "../theme/feelBridge"
import * as banner from "../MarketingCtaBanner.styles.css"
import * as hero from "../MarketingHero.styles.css"
import * as shell from "../MarketingShell.styles.css"
import * as showcase from "../MarketingShowcase.styles.css"
import * as split from "../MarketingContentSplit.styles.css"
import * as quotes from "../MarketingTestimonials.styles.css"
import { ctaPrimary, scriptFont, sectionKicker, sectionTitle } from "../shared.css"

/*
 * `darkroom` (darkroom): the portrait studio after the lights go down.
 * Charcoal ground, silver type, an old-style book serif for the voice and
 * engraved capitals (the script slot) for names, kickers and the ask. The
 * specimens board becomes the print room: each plate matted in warm white
 * with a deckled shadow, two to a row, its process, note and price
 * engraved on a ruled plaque beneath. The ask is a hairline-ruled button
 * in engraved capitals, never a filled slab.
 */
const T = '[data-marketing-treatment~="darkroom"]'
const ink = marketing.color.text
const quiet = marketing.color.subtle
const rule = marketing.color.line
const engraved = {
    fontFamily: scriptFont,
    fontWeight: 400,
    textTransform: "uppercase" as const,
    letterSpacing: "0.2em",
}
const mat = "#efebe2" // theme-exempt: a warm museum mat around a print, the same in every theme

// -- Kickers and titles: engraved capitals over the book serif.
globalStyle(`${T} ${sectionKicker}`, {
    ...engraved,
    fontSize: 12,
    color: quiet,
})
globalStyle(`${T} ${sectionTitle}`, {
    fontWeight: 400,
    letterSpacing: "0",
})

// -- Masthead: the studio's name engraved, links in small engraved capitals.
globalStyle(`${T} ${shell.logo}, ${T} ${shell.logo} *`, {
    ...engraved,
    letterSpacing: "0.3em",
})
globalStyle(`${T} ${shell.logo}`, {
    fontSize: "clamp(17px, 1.6vw, 21px)",
})
globalStyle(`${T} ${shell.link}, ${T} ${shell.linkUnderline}`, {
    ...engraved,
    fontSize: 11.5,
    letterSpacing: "0.18em",
})
globalStyle(`${T} ${shell.cta}`, {
    ...engraved,
    fontSize: 11.5,
    background: "transparent",
    color: ink,
    border: `1px solid ${quiet}`,
    boxShadow: "none",
})

// -- Hero: the line low and left over the black-and-white plate.
globalStyle(`${T} ${hero.fullBleedScrim}`, {
    background:
        "linear-gradient(180deg, rgba(10, 10, 11, 0.18) 0%, rgba(10, 10, 11, 0) 38%, rgba(10, 10, 11, 0.62) 100%)", // theme-exempt: a scrim over photography, the same in every theme
})
globalStyle(`${T} ${hero.fullBleedHeadline}`, {
    fontWeight: 400,
    fontSize: "clamp(38px, 4.6vw, 66px)",
    letterSpacing: "-0.005em",
    lineHeight: 1.08,
    maxWidth: "16ch",
})

// -- Buttons: engraved capitals in a hairline box.
globalStyle(`${T} ${ctaPrimary}`, {
    ...engraved,
    fontSize: 13,
    background: "transparent",
    color: ink,
    border: `1px solid ${quiet}`,
    borderRadius: 0,
    boxShadow: "none",
    padding: "16px 34px",
})
globalStyle(`${T} ${ctaPrimary}:hover`, {
    background: ink,
    color: marketing.color.pageBg,
})

// -- The print room: the specimens board as matted prints on plaques.
globalStyle(`${T} ${showcase.wrapSpecimens}`, {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
})
globalStyle(`${T} ${showcase.titleSpecimens}`, {
    order: 0,
    ...engraved,
    fontSize: "clamp(22px, 2.4vw, 30px)",
    letterSpacing: "0.22em",
    margin: `0 0 ${scaledSpace(10)}`,
    display: "flex",
    alignItems: "center",
    gap: scaledSpace(24),
    width: "100%",
    maxWidth: "none",
})
globalStyle(`${T} ${showcase.titleSpecimens}::before, ${T} ${showcase.titleSpecimens}::after`, {
    content: '""',
    flex: 1,
    height: 1,
    background: rule,
})
globalStyle(`${T} ${showcase.wrapSpecimens} > ${showcase.kicker}`, {
    order: 1,
    fontSize: 13.5,
    letterSpacing: "0.16em",
    color: ink,
    marginBottom: scaledSpace(44),
})
globalStyle(`${T} ${showcase.specimens}`, {
    order: 2,
    width: "100%",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: `${scaledSpace(56)} clamp(20px, 4vw, 56px)`,
    "@media": {
        "(max-width: 560px)": { gridTemplateColumns: "minmax(0, 1fr)", gap: "44px" },
    },
})
globalStyle(`${T} ${showcase.specimen}`, {
    alignItems: "center",
})
globalStyle(`${T} ${showcase.specimenPlate}`, {
    width: "100%",
    aspectRatio: "4 / 3",
    borderRadius: 0,
    background: mat,
    padding: "clamp(12px, 1.8vw, 22px)",
    boxShadow: "0 1px 0 rgba(255, 255, 255, 0.05), 0 18px 36px -18px rgba(0, 0, 0, 0.7)", // theme-exempt: a print's shadow on the charcoal wall
    marginBottom: scaledSpace(22),
})
globalStyle(`${T} ${showcase.specimenImg}`, {
    boxShadow: "inset 0 0 0 1px rgba(0, 0, 0, 0.12)", // theme-exempt: the mat's bevel edge
})
globalStyle(`${T} ${showcase.specimenName}`, {
    ...engraved,
    fontSize: 16,
    letterSpacing: "0.2em",
    color: ink,
    padding: "14px 32px 0",
    border: `1px solid ${rule}`,
    borderBottom: "none",
    minWidth: "min(100%, 340px)",
})
globalStyle(`${T} ${showcase.specimenDescription}`, {
    order: 1,
    fontStyle: "italic",
    fontSize: 17,
    color: quiet,
    padding: "4px 32px 0",
    borderLeft: `1px solid ${rule}`,
    borderRight: `1px solid ${rule}`,
    minWidth: "min(100%, 340px)",
})
globalStyle(`${T} ${showcase.specimenUse}`, {
    order: 2,
    fontFamily: marketing.font.body,
    fontSize: 17,
    letterSpacing: "0",
    textTransform: "none",
    color: ink,
    margin: 0,
    padding: "2px 32px 14px",
    border: `1px solid ${rule}`,
    borderTop: "none",
    minWidth: "min(100%, 340px)",
})
globalStyle(`${T} ${showcase.specimenUse} > [aria-hidden]`, {
    display: "none",
})

// -- Prose: the book serif runs small, so the reading copy steps up.
globalStyle(`${T} ${split.body}`, {
    fontSize: 18,
    lineHeight: 1.6,
})

// -- The sitting: one line between rules over the hairline ask.
globalStyle(`${T} ${banner.card}`, {
    background: "transparent",
    border: "none",
    borderTop: `1px solid ${rule}`,
    borderBottom: `1px solid ${rule}`,
    borderRadius: 0,
    boxShadow: "none",
    padding: `${scaledSpace(40)} 0`,
})
globalStyle(`${T} ${banner.card} ${banner.title}`, {
    fontSize: "clamp(19px, 1.9vw, 24px)",
    fontWeight: 400,
    color: ink,
})

// -- Kind words: the quote in the italic serif.
globalStyle(`${T} ${quotes.featuredQuote}`, {
    fontStyle: "italic",
    fontWeight: 400,
})
