import { globalStyle } from "@vanilla-extract/css"
import { marketing } from "../theme/marketingTheme.css"
import { scaledSpace } from "../theme/feelBridge"
import * as backdrop from "../MarketingBackdrop.styles.css"
import * as banner from "../MarketingCtaBanner.styles.css"
import * as comparison from "../MarketingComparison.styles.css"
import * as gallery from "../MarketingGallery.styles.css"
import * as hero from "../MarketingHero.styles.css"
import * as pricing from "../MarketingPricing.styles.css"
import * as shell from "../MarketingShell.styles.css"
import * as split from "../MarketingContentSplit.styles.css"
import * as quotes from "../MarketingTestimonials.styles.css"
import { ctaPrimary, ctaSecondary, scriptFont, sectionKicker, sectionTitle } from "../shared.css"

/*
 * `alpine` (alpine): the expedition field sheet. The studio's name is a
 * wide heavy grotesque in capitals; every label, kicker and caption is set
 * in the monospace like a map's legend — place, season, coordinates. The
 * hero's line sits low on the left of the photograph in the plain sans;
 * captioned stacks read as survey slates, the places compare as ruled
 * spec cards, packages are granite-ruled columns with the chosen one in
 * magenta, and the closing band is one mono line over a hairline link on
 * a darkened photograph. Corners are square throughout.
 */
const T = '[data-marketing-treatment~="alpine"]'
const ink = marketing.color.text
const quiet = marketing.color.subtle
const rule = marketing.color.line
const magenta = marketing.color.accent
const mono = {
    fontFamily: scriptFont,
    fontWeight: 400,
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
}

// -- Kickers and titles: mono legend labels over a plain, tight sans.
globalStyle(`${T} ${sectionKicker}`, {
    ...mono,
    fontSize: 12,
    color: magenta,
})
globalStyle(`${T} ${sectionTitle}`, {
    fontFamily: marketing.font.body,
    fontWeight: 500,
    letterSpacing: "-0.015em",
})

// -- Masthead: the name in wide heavy capitals, links and ask in mono.
globalStyle(`${T} ${shell.logo}, ${T} ${shell.logo} *`, {
    fontFamily: marketing.font.display,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.02em",
})
globalStyle(`${T} ${shell.logo}`, {
    fontSize: "clamp(20px, 2.2vw, 30px)",
})
globalStyle(`${T} ${shell.link}, ${T} ${shell.linkUnderline}`, {
    ...mono,
    fontSize: 12,
})
globalStyle(`${T} ${shell.cta}`, {
    ...mono,
    fontSize: 12,
    borderRadius: 0,
    boxShadow: "none",
})

// -- Hero: the line low and left in the plain sans, the badge in mono.
globalStyle(`${T} ${hero.fullBleedScrim}`, {
    background:
        "linear-gradient(180deg, rgba(10, 13, 16, 0.18) 0%, rgba(10, 13, 16, 0) 30%, rgba(10, 13, 16, 0) 52%, rgba(10, 13, 16, 0.6) 100%)", // theme-exempt: a scrim over photography, the same in every theme
})
globalStyle(`${T} ${hero.fullBleedBadge}`, {
    ...mono,
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.88)", // theme-exempt: copy over a photographic scrim is white in every theme
    background: "transparent",
    border: "none",
    padding: 0,
    marginBottom: scaledSpace(14),
})
globalStyle(`${T} ${hero.fullBleedHeadline}`, {
    fontFamily: marketing.font.body,
    fontWeight: 500,
    fontSize: "clamp(34px, 4.2vw, 64px)",
    letterSpacing: "-0.02em",
    lineHeight: 1.06,
    textTransform: "none",
    maxWidth: "17ch",
})
globalStyle(`${T} ${hero.fullBleedSubheadline}`, {
    fontSize: 16,
    maxWidth: 480,
})

// -- Buttons: square; the ask in magenta, the second in a granite hairline.
globalStyle(`${T} ${ctaPrimary}`, {
    ...mono,
    fontSize: 12.5,
    borderRadius: 0,
    boxShadow: "none",
})
globalStyle(`${T} ${ctaSecondary}`, {
    ...mono,
    fontSize: 12.5,
    borderRadius: 0,
})

// -- Captioned stack: survey slates in mono.
globalStyle(`${T} ${gallery.overlayCaption}`, {
    fontFamily: scriptFont,
    fontSize: 12.5,
    letterSpacing: "0.08em",
    "@media": {
        "(max-width: 640px)": { fontSize: 10.5, letterSpacing: "0.04em" },
    },
})
globalStyle(`${T} ${gallery.filmstripCaption}`, {
    ...mono,
    fontSize: 11,
})

// -- The guides: a square print beside the note.
globalStyle(`${T} ${split.mediaImg}`, {
    borderRadius: 0,
})

// -- The places: ruled spec cards, labels in mono.
globalStyle(`${T} ${comparison.card}`, {
    background: "transparent",
    border: "none",
    borderTop: `2px solid ${ink}`,
    borderRadius: 0,
    boxShadow: "none",
    padding: `${scaledSpace(18)} 2px 0`,
})
globalStyle(`${T} ${comparison.cardTitle}`, {
    fontFamily: marketing.font.display,
    fontWeight: 800,
    textTransform: "uppercase",
    fontSize: 17,
    letterSpacing: "0.02em",
})
globalStyle(`${T} ${comparison.cardRow}`, {
    borderColor: rule,
})
globalStyle(`${T} ${comparison.cardRowLabel}, ${T} ${comparison.cardRowLabelMuted}`, {
    ...mono,
    fontSize: 11,
    color: quiet,
})
globalStyle(`${T} ${comparison.cardRowValue}`, {
    fontSize: 14.5,
})

// -- Packages: granite-ruled columns, the chosen one ruled in magenta.
globalStyle(`${T} ${pricing.tierCard}`, {
    background: "transparent",
    border: "none",
    borderTop: `2px solid ${ink}`,
    borderRadius: 0,
    boxShadow: "none",
    padding: `${scaledSpace(22)} 2px 0`,
})
globalStyle(`${T} ${pricing.tierBadge}`, {
    ...mono,
    fontSize: 11,
    background: "transparent",
    color: magenta,
    border: "none",
    padding: 0,
    position: "static",
    transform: "none",
    marginBottom: 10,
})
globalStyle(`${T} ${pricing.tierName}`, {
    ...mono,
    fontSize: 12.5,
    color: ink,
})
globalStyle(`${T} ${pricing.tierPrice}`, {
    fontFamily: marketing.font.display,
    fontWeight: 700,
    fontSize: 40,
    letterSpacing: "0",
})
globalStyle(`${T} ${pricing.tierFeatureItem}`, {
    borderColor: rule,
})

// -- One voice in the plain sans, the name in mono.
globalStyle(`${T} ${quotes.featuredQuote}`, {
    fontFamily: marketing.font.body,
    fontWeight: 400,
    fontSize: "clamp(22px, 2.4vw, 32px)",
    letterSpacing: "-0.01em",
    lineHeight: 1.35,
})
globalStyle(`${T} ${quotes.author}`, {
    ...mono,
    fontSize: 12,
})

// -- The closing band: a tall darkened photograph, one mono line over a
// hairline link, set high in the weather above the subject.
globalStyle(`${T} ${backdrop.bleed}`, {
    display: "flex",
    alignItems: "flex-start",
    minHeight: "clamp(440px, 76vh, 820px)",
    marginTop: scaledSpace(64),
})
globalStyle(`${T} ${backdrop.bleed} ${banner.band}`, {
    marginTop: 0,
    paddingBlock: `clamp(56px, 16vh, 150px) ${scaledSpace(40)}`,
})
globalStyle(`${T} ${backdrop.overlayDark}`, {
    background:
        "linear-gradient(180deg, rgba(10, 13, 16, 0.5) 0%, rgba(10, 13, 16, 0.22) 55%, rgba(10, 13, 16, 0.4) 100%)", // theme-exempt: a scrim over photography, the same in every theme
})
globalStyle(`${T} ${backdrop.overlayDark} ~ ${backdrop.inner}`, {
    color: "#ffffff", // theme-exempt: type over a darkened photograph is white in every theme
})
globalStyle(`${T} ${backdrop.overlayDark} ~ ${backdrop.inner} ${banner.title}`, {
    color: "inherit",
})
globalStyle(`${T} ${backdrop.bleed} ${banner.title}`, {
    fontFamily: scriptFont,
    fontSize: "clamp(15px, 1.5vw, 19px)",
    fontWeight: 400,
    letterSpacing: "0.02em",
    marginBottom: 18,
})
globalStyle(`${T} ${backdrop.bleed} ${banner.cta}`, {
    fontFamily: scriptFont,
    fontSize: 14,
    background: "transparent",
    color: "inherit",
    borderRadius: 0,
    boxShadow: "none",
    padding: "0 0 5px",
    borderBottom: "1px solid currentColor",
})

// -- Footer: mono.
globalStyle(`${T} ${shell.footerNote}, ${T} ${shell.footerBlurb}`, {
    ...mono,
    fontSize: 11,
})
