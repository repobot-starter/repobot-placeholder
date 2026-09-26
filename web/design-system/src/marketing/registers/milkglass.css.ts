import { globalStyle } from "@vanilla-extract/css"
import { marketing } from "../theme/marketingTheme.css"
import { scaledSpace } from "../theme/feelBridge"
import * as banner from "../MarketingCtaBanner.styles.css"
import * as builder from "../MarketingPackageBuilder.styles.css"
import * as hero from "../MarketingHero.styles.css"
import * as shell from "../MarketingShell.styles.css"
import * as split from "../MarketingContentSplit.styles.css"
import * as quotes from "../MarketingTestimonials.styles.css"
import { ctaPrimary, sectionKicker, sectionTitle } from "../shared.css"

/*
 * `milkglass` (milkglass): the daylight newborn studio. The studio's name
 * is set in thin spaced capitals, titles in a light book serif at ease,
 * kickers and links in small sage capitals. The hero's line sits low on
 * the window light in the serif; the session builder reads as quiet
 * photograph tiles on milk-white cards beside a summary card whose total
 * is set in the serif, and the ask is one soft sage button.
 */
const T = '[data-marketing-treatment~="milkglass"]'
const ink = marketing.color.text
const quiet = marketing.color.subtle
const sage = marketing.color.accent
const smallCaps = {
    fontFamily: marketing.font.body,
    fontWeight: 400,
    textTransform: "uppercase" as const,
    letterSpacing: "0.16em",
}

// -- Kickers and titles: small sage capitals over the light serif.
globalStyle(`${T} ${sectionKicker}`, {
    ...smallCaps,
    fontSize: 11.5,
    color: sage,
})
globalStyle(`${T} ${sectionTitle}`, {
    fontWeight: 300,
    letterSpacing: "0",
})

// -- Masthead: the name in thin spaced capitals, links in small capitals.
globalStyle(`${T} ${shell.logo}, ${T} ${shell.logo} *`, {
    fontFamily: marketing.font.display,
    fontWeight: 300,
    textTransform: "uppercase",
    letterSpacing: "0.24em",
})
globalStyle(`${T} ${shell.logo}`, {
    fontSize: "clamp(18px, 1.8vw, 24px)",
})
globalStyle(`${T} ${shell.link}, ${T} ${shell.linkUnderline}`, {
    ...smallCaps,
    fontSize: 11.5,
    fontWeight: 400,
})
globalStyle(`${T} ${shell.cta}`, {
    ...smallCaps,
    fontSize: 11.5,
    boxShadow: "none",
})

// -- Hero: the line low on the window light, in the serif.
globalStyle(`${T} ${hero.fullBleedScrim}`, {
    background:
        "linear-gradient(180deg, rgba(20, 24, 20, 0.12) 0%, rgba(20, 24, 20, 0) 40%, rgba(20, 24, 20, 0.42) 100%)", // theme-exempt: a scrim over photography, the same in every theme
})
globalStyle(`${T} ${hero.fullBleedScrim}`, {
    "@media": {
        "screen and (max-width: 640px)": {
            background:
                "linear-gradient(180deg, rgba(20, 24, 20, 0.1) 0%, rgba(20, 24, 20, 0) 30%, rgba(20, 24, 20, 0.62) 100%)", // theme-exempt: a scrim over photography, the same in every theme
        },
    },
})
globalStyle(`${T} ${hero.fullBleedHeadline}`, {
    fontWeight: 300,
    fontSize: "clamp(40px, 4.8vw, 70px)",
    letterSpacing: "-0.005em",
    lineHeight: 1.04,
    maxWidth: "13ch",
})
globalStyle(`${T} ${hero.fullBleedSubheadline}`, {
    fontSize: 15.5,
    fontWeight: 300,
    lineHeight: 1.55,
    maxWidth: 360,
})

// -- Buttons: one soft sage button in small capitals.
globalStyle(`${T} ${ctaPrimary}`, {
    ...smallCaps,
    fontSize: 12,
    letterSpacing: "0.12em",
    boxShadow: "none",
})

// -- The session builder: the heading in the serif, quiet tiles, a serif total.
globalStyle(`${T} ${builder.head}`, {
    marginBottom: scaledSpace(28),
})
globalStyle(`${T} ${builder.title}`, {
    fontSize: "clamp(28px, 3vw, 40px)",
    fontWeight: 300,
    letterSpacing: "0",
    textTransform: "none",
})
globalStyle(`${T} ${builder.intro}`, {
    fontSize: 15.5,
    fontWeight: 300,
    color: ink,
})
globalStyle(`${T} ${builder.tileGroupHeading}`, {
    fontSize: 19,
    fontWeight: 300,
})
globalStyle(`${T} ${builder.tileName}`, {
    fontSize: 14,
    fontWeight: 400,
})
globalStyle(`${T} ${builder.tilePrice}`, {
    fontSize: 13,
})
globalStyle(`${T} ${builder.summary}`, {
    padding: `${scaledSpace(28)} ${scaledSpace(24)}`,
})
globalStyle(`${T} ${builder.summaryTitle}`, {
    fontSize: "clamp(22px, 2.2vw, 28px)",
    fontWeight: 300,
    paddingBottom: scaledSpace(20),
})
globalStyle(`${T} ${builder.summaryLine}`, {
    fontSize: 14,
    fontWeight: 300,
})
globalStyle(`${T} ${builder.totalLabel}`, {
    fontFamily: marketing.font.display,
    fontSize: 24,
    fontWeight: 300,
    letterSpacing: "0",
    textTransform: "none",
    color: ink,
})
globalStyle(`${T} ${builder.totalValue}`, {
    fontSize: 30,
    fontWeight: 300,
    color: ink,
})
globalStyle(`${T} ${builder.summaryCta} ${ctaPrimary}`, {
    justifyContent: "center",
    padding: "15px 20px",
})
globalStyle(`${T} ${builder.summary} ${builder.footnote}`, {
    marginTop: scaledSpace(14),
    fontSize: 12.5,
    textAlign: "center",
    color: quiet,
})

// -- The photographer: a soft print beside the note.
globalStyle(`${T} ${split.headline}`, {
    fontWeight: 300,
})

// -- One voice in the serif's italic.
globalStyle(`${T} ${quotes.featuredQuote}`, {
    fontFamily: marketing.font.display,
    fontWeight: 300,
    fontStyle: "italic",
    fontSize: "clamp(24px, 2.6vw, 34px)",
    lineHeight: 1.35,
})
globalStyle(`${T} ${quotes.author}`, {
    ...smallCaps,
    fontSize: 11.5,
})

// -- The closing band: the serif at ease.
globalStyle(`${T} ${banner.title}`, {
    fontWeight: 300,
    letterSpacing: "0",
})

// -- Footer: small capitals.
globalStyle(`${T} ${shell.footerNote}, ${T} ${shell.footerBlurb}`, {
    ...smallCaps,
    fontSize: 10.5,
    letterSpacing: "0.18em",
})
