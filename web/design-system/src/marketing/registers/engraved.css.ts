import { globalStyle } from "@vanilla-extract/css"
import * as banner from "../MarketingCtaBanner.styles.css"
import * as feature from "../MarketingContentFeature.styles.css"
import * as hero from "../MarketingHero.styles.css"
import * as proof from "../MarketingSocialProof.styles.css"
import { scaledSpace } from "../theme/feelBridge"
import { marketing } from "../theme/marketingTheme.css"

/*
 * `engraved` (shingle): the country-house quarterly. The preset's crest is
 * stamped over the hero's line and the full-bleed headline is centered
 * like an engraving's title; the feature's rule carries a fleuron, its
 * drop cap runs deeper, its figures are titled in small caps; the places
 * read as one spaced line of Caslon; the ask is an outlined plate with an
 * arrow.
 */
const ROOT = '[data-marketing-treatment~="engraved"]'
const within = (target: string): string => `${ROOT} ${target}`

const SMALL_CAPS = {
    fontFamily: marketing.font.body,
    fontSize: 12.5,
    fontWeight: 400,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
} as const

// Hero: the title card, centered under the crest.
globalStyle(within(hero.fullBleed), {
    minHeight: "clamp(440px, 74svh, 820px)",
    alignItems: "center",
})

globalStyle(within(hero.fullBleedScrim), {
    background:
        "radial-gradient(90% 70% at 50% 42%, rgba(12, 18, 32, 0.46) 0%, rgba(12, 18, 32, 0.18) 60%, rgba(12, 18, 32, 0.08) 100%)", // theme-exempt: the scrim under white copy is the same navy shade in every theme
})

globalStyle(within(hero.fullBleedInner), {
    textAlign: "center",
    paddingBlock: `${scaledSpace(56)}`,
})

globalStyle(within(hero.fullBleedBadge), {
    ...SMALL_CAPS,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: scaledSpace(12),
    color: "rgba(255, 255, 255, 0.92)", // theme-exempt: copy over a photographic scrim is white in every theme
})

globalStyle(within(`${hero.fullBleedBadge}::before`), {
    content: '""',
    width: 58,
    height: 64,
    background: "#ffffff", // theme-exempt: the crest is stamped in the white of the copy over the photograph
    WebkitMask: "var(--marketing-ornament) center / contain no-repeat",
    mask: "var(--marketing-ornament) center / contain no-repeat",
})

globalStyle(within(hero.fullBleedHeadline), {
    marginInline: "auto",
    maxWidth: "14ch",
    lineHeight: 1.04,
    textShadow: "0 1px 18px rgba(12, 18, 32, 0.35)", // theme-exempt: lifts white copy off the photograph in every theme
})

globalStyle(within(`${hero.fullBleed} ${hero.ctaRow}`), {
    justifyContent: "center",
})

// The feature: a fleuron on the rule, a deeper drop cap, small-caps figures.
globalStyle(within(feature.kicker), {
    ...SMALL_CAPS,
    color: marketing.color.text,
})

globalStyle(within(feature.rule), {
    position: "relative",
    width: "min(420px, 70%)",
    overflow: "visible",
})

globalStyle(within(`${feature.rule}::after`), {
    content: '"❦"',
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -54%)",
    padding: "0 10px",
    fontSize: 15,
    lineHeight: 1,
    color: marketing.color.text,
    background: marketing.color.pageBg,
})

globalStyle(within(`${feature.body} ${feature.paragraph}:first-child::first-letter`), {
    fontSize: "4.3em",
    lineHeight: 0.8,
    padding: "0.06em 0.12em 0 0",
})

globalStyle(within(feature.pullQuote), {
    borderBottom: 0,
    position: "relative",
    paddingBottom: scaledSpace(26),
})

globalStyle(within(`${feature.pullQuote}::after`), {
    content: '"❦"',
    position: "absolute",
    left: "50%",
    bottom: 0,
    transform: "translateX(-50%)",
    fontSize: 13,
    color: marketing.color.subtle,
})

globalStyle(within(feature.figureTitle), {
    ...SMALL_CAPS,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.14em",
})

// The drawing's own paper feathers into the page instead of sitting on it
// as a box.
globalStyle(within(feature.plateFrame), {
    WebkitMaskImage: "radial-gradient(ellipse 72% 66% at 50% 50%, #000 58%, transparent 100%)", // theme-exempt: a mask's alpha stop, never painted
    maskImage: "radial-gradient(ellipse 72% 66% at 50% 50%, #000 58%, transparent 100%)", // theme-exempt: a mask's alpha stop, never painted
})

globalStyle(within(feature.pullQuoteText), {
    textWrap: "balance",
})

globalStyle(within(feature.plateCaption), {
    ...SMALL_CAPS,
    fontSize: 11.5,
    color: marketing.color.subtle,
})

// The places: one spaced line of Caslon under a small-caps label.
globalStyle(within(proof.label), {
    ...SMALL_CAPS,
    fontSize: 11.5,
    color: marketing.color.subtle,
})

globalStyle(within(`${proof.strip} ${proof.item}`), {
    fontFamily: marketing.font.display,
    fontSize: "clamp(19px, 2vw, 24px)",
    fontWeight: 400,
    letterSpacing: "0.04em",
    textTransform: "none",
    color: marketing.color.text,
})

globalStyle(within(`${proof.strip} ${proof.item} + ${proof.item}::before`), {
    content: '"·"',
    marginRight: scaledSpace(34),
    marginLeft: `calc(-1 * ${scaledSpace(17)})`,
    color: marketing.color.subtle,
})

// The ask: an outlined plate with an arrow on the ivory page.
globalStyle(within(banner.card), {
    background: "none",
    border: 0,
    boxShadow: "none",
    paddingBlock: scaledSpace(40),
})

globalStyle(within(banner.body), {
    fontStyle: "italic",
    color: marketing.color.subtle,
})

globalStyle(within(`${banner.card} ${banner.cta}`), {
    ...SMALL_CAPS,
    fontSize: 14,
    background: "transparent",
    color: marketing.color.text,
    border: `1px solid ${marketing.color.text}`,
    borderRadius: 0,
    boxShadow: "none",
    padding: "13px 30px",
    whiteSpace: "nowrap",
    "@media": {
        "(max-width: 520px)": { fontSize: 12.5, letterSpacing: "0.14em", padding: "12px 20px" },
    },
})

globalStyle(within(`${banner.card} ${banner.cta}::after`), {
    content: '"→"',
    marginLeft: "0.9em",
    letterSpacing: 0,
})
