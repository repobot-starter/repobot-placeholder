import { globalStyle } from "@vanilla-extract/css"
import { marketing } from "../theme/marketingTheme.css"
import { scaledSpace } from "../theme/feelBridge"
import * as banner from "../MarketingCtaBanner.styles.css"
import * as gallery from "../MarketingGallery.styles.css"
import * as hero from "../MarketingHero.styles.css"
import * as proof from "../MarketingSocialProof.styles.css"
import * as quotes from "../MarketingTestimonials.styles.css"
import * as shell from "../MarketingShell.styles.css"
import * as showcase from "../MarketingShowcase.styles.css"
import * as split from "../MarketingContentSplit.styles.css"
import { ctaPrimary, ctaSecondary, sectionKicker, sectionTitle } from "../shared.css"

/*
 * `miradouro` (worn with `framestack`): a fashion creator's diary. The
 * full-bleed hero and every diary frame are one photograph at one size;
 * the type between them is set like a printed diary rather than a feed.
 *
 * The hero headline is light and large at the frame's foot, its accent
 * (the last line) in the display italic, the credit in small tracked caps,
 * and both asks are underlined text links — never buttons over a face.
 * Each `captionStack` `overlay-*` caption is one italic display line —
 * the place and hour, a dash, the outfit — on a soft, tall scrim.
 *
 * Between the photographs: kickers in small tracked body caps led by a
 * short accent rule, titles light in the display face; the media rail's
 * covers and the collections as uncarded plates and hairline rows; the
 * metrics' numerals in the display italic; the featured quote as an
 * italic pull quote with its name and title in small caps. The wordmark
 * is the creator's name in the display italic.
 */
const M = '[data-marketing-treatment~="miradouro"]'
/**
 * framestack styles the kickers, titles and bylines of a page that opens
 * on a photograph through `:has()` on the page root; this register's
 * voice has to reach both kinds of page at that same weight.
 */
const both = (part: string): string => `${M} ${part}, ${M}:has(${hero.fullBleed}) ${part}`
const WHITE = "#ffffff" // theme-exempt: copy over a photographic scrim is white in every theme
const smallCaps = {
    fontFamily: marketing.font.body,
    fontSize: 11.5,
    fontWeight: 600,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
} as const

// ------------------------------------------------------------ the wordmark
globalStyle(`${M} ${shell.logo}`, {
    fontFamily: marketing.font.display,
    fontStyle: "italic",
    fontWeight: 400,
    fontSize: "clamp(21px, 1.9vw, 27px)",
    letterSpacing: "0",
    textTransform: "none",
})

globalStyle(`${M} ${shell.link}`, {
    ...smallCaps,
    fontSize: 11,
})

globalStyle(`${M} ${shell.cta}`, {
    ...smallCaps,
    fontSize: 11,
    background: "transparent",
    color: marketing.color.text,
    border: `${marketing.shape.borderWidth} solid currentColor`,
    boxShadow: "none",
    padding: "10px 16px",
})

// ------------------------------------------------------------------ the hero
globalStyle(`${M} ${hero.fullBleed}`, {
    "@media": {
        // A phone stands the cover up: a tall crop around the subject, not a letterbox.
        "(max-width: 640px)": { minHeight: "min(620px, 150vw)" },
    },
})

globalStyle(`${M} ${hero.fullBleedImg}`, {
    objectPosition: "50% 22%",
})

globalStyle(`${M} ${hero.fullBleedScrim}`, {
    background:
        "linear-gradient(to bottom, rgba(20, 12, 10, 0.34) 0, rgba(20, 12, 10, 0) 150px), linear-gradient(to top, rgba(20, 12, 10, 0.58) 0%, rgba(20, 12, 10, 0.18) 38%, rgba(20, 12, 10, 0) 62%)", // theme-exempt: the register's warm scrim over photography, the same in every theme
})

globalStyle(`${M} ${hero.fullBleed} ${hero.headline}`, {
    fontWeight: 300,
    fontSize: `calc(clamp(44px, 6.4vw, 104px) * ${marketing.display.scale})`,
    lineHeight: 0.98,
    letterSpacing: "-0.02em",
    maxWidth: "11em",
    "@media": {
        "(max-width: 640px)": { fontSize: `calc(42px * ${marketing.display.scale})`, lineHeight: 1 },
    },
})

globalStyle(`${M} ${hero.fullBleed} ${hero.accentWord}`, {
    fontStyle: "italic",
    fontWeight: 300,
    color: WHITE,
})

globalStyle(`${M} ${hero.fullBleedBadge}`, {
    ...smallCaps,
    background: "none",
    border: "none",
    padding: 0,
    color: WHITE,
})

globalStyle(`${M} ${hero.fullBleedCredit}`, {
    ...smallCaps,
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.86)", // theme-exempt: copy over a photographic scrim is white in every theme
    marginTop: scaledSpace(14),
})

globalStyle(`${M} ${hero.fullBleed} ${hero.subheadline}`, {
    maxWidth: "34em",
    "@media": {
        // The phone's 4:3 frame holds the name, the line and the asks.
        "(max-width: 640px)": { display: "none" },
    },
})

globalStyle(`${M} ${hero.fullBleed} ${hero.ctaRow}`, {
    gap: scaledSpace(28),
    marginTop: scaledSpace(22),
})

globalStyle(`${M} ${hero.fullBleed} ${ctaPrimary}, ${M} ${hero.fullBleed} ${ctaSecondary}`, {
    ...smallCaps,
    fontSize: 12,
    background: "none",
    border: "none",
    borderRadius: 0,
    boxShadow: "none",
    padding: "0 0 5px",
    color: WHITE,
    borderBottom: "1px solid rgba(255, 255, 255, 0.7)", // theme-exempt: a hairline under the ask over the photograph
})

// ------------------------------------------------------------- the diary
globalStyle(`${M} ${gallery.overlayFigure} img`, {
    objectPosition: "50% 24%",
})

globalStyle(`${M} ${gallery.overlayCaption}`, {
    padding: `${scaledSpace(90)} max(20px, calc((100% - ${marketing.layout.maxWidth}) / 2 + 24px)) ${scaledSpace(30)}`,
    background: "linear-gradient(to top, rgba(20, 12, 10, 0.5), rgba(20, 12, 10, 0))", // theme-exempt: the register's warm scrim over photography, the same in every theme
    fontFamily: marketing.font.display,
    fontStyle: "italic",
    fontWeight: 300,
    fontSize: "clamp(20px, 2.1vw, 32px)",
    lineHeight: 1.25,
    letterSpacing: "0",
    textTransform: "none",
    "@media": {
        "(max-width: 640px)": { fontSize: 17, paddingBottom: 16, paddingInline: 20, paddingTop: 48 },
    },
})

// ---------------------------------------------------- kickers and titles
globalStyle(both(sectionKicker), {
    ...smallCaps,
    display: "inline-flex",
    alignItems: "center",
    gap: 12,
    color: marketing.color.subtle,
    padding: 0,
    border: "none",
    marginBottom: scaledSpace(16),
})

globalStyle(both(`${sectionKicker}::before`), {
    content: '""',
    width: 28,
    height: 1,
    background: marketing.color.accent,
})

globalStyle(both(sectionTitle), {
    fontFamily: marketing.font.display,
    fontWeight: 300,
    fontSize: "clamp(30px, 4.2vw, 54px)",
    lineHeight: 1.05,
    letterSpacing: "-0.015em",
    margin: `0 0 ${scaledSpace(36)}`,
    "@media": {
        "(max-width: 640px)": { fontSize: 30 },
    },
})

// ------------------------------------------- the rail and the collections
globalStyle(`${M} ${showcase.railCell}`, {
    flex: "0 0 min(360px, 74%)",
})

globalStyle(`${M} ${showcase.rail} ${showcase.collectionCover}`, {
    aspectRatio: "3 / 4",
})

globalStyle(`${M} ${showcase.rail} ${showcase.collectionImg}`, {
    objectPosition: "50% 20%",
})

globalStyle(`${M} ${showcase.card}`, {
    background: "none",
    border: "none",
    borderTop: `1px solid ${marketing.color.line}`,
    borderRadius: 0,
    boxShadow: "none",
    paddingInline: 0,
})

globalStyle(`${M} ${showcase.titleRow}`, {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 4,
})

globalStyle(`${M} ${showcase.chipRow}`, {
    gap: 22,
})

globalStyle(`${M} ${showcase.chip}`, {
    ...smallCaps,
    color: marketing.color.subtle,
    border: "none",
    borderBottom: "1px solid transparent",
    borderRadius: 0,
    padding: "6px 0",
})

globalStyle(`${M} ${showcase.chip}[aria-pressed="true"]`, {
    color: marketing.color.accent,
    background: "none",
    borderBottomColor: marketing.color.accent,
})

globalStyle(`${M} ${showcase.badge}, ${M} ${showcase.tag}`, {
    ...smallCaps,
    fontSize: 10.5,
    background: "none",
    padding: 0,
    borderRadius: 0,
})

globalStyle(`${M} ${showcase.badge}`, {
    color: marketing.color.accent,
})

globalStyle(`${M} ${showcase.badgeOverlay}`, {
    padding: "5px 8px",
    background: marketing.color.pageBg,
})

globalStyle(`${M} ${showcase.eyebrow}`, {
    ...smallCaps,
    fontSize: 10.5,
    color: marketing.color.accent,
})

globalStyle(`${M} ${showcase.itemTitle}, ${M} ${showcase.collectionTitle}`, {
    fontFamily: marketing.font.display,
    fontWeight: 400,
    fontSize: "clamp(19px, 1.6vw, 23px)",
    letterSpacing: "-0.005em",
})

globalStyle(`${M} ${showcase.meta}`, {
    fontFamily: marketing.font.display,
    fontStyle: "italic",
    fontWeight: 400,
    fontSize: 17,
    color: marketing.color.subtle,
})

globalStyle(`${M} ${showcase.collectionCard}`, {
    background: "none",
    border: "none",
    borderTop: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: 0,
    boxShadow: "none",
    paddingInline: 0,
})

// ----------------------------------------------------------- the numbers
globalStyle(`${M} ${proof.metricValue}`, {
    fontFamily: marketing.font.display,
    fontStyle: "italic",
    fontWeight: 300,
    letterSpacing: "-0.02em",
})

globalStyle(`${M} ${proof.metricLabel}, ${M} ${proof.label}`, {
    ...smallCaps,
    fontSize: 10.5,
    color: marketing.color.subtle,
})

// A partner line is a campaign, not a logo: on a phone it wraps inside the
// column rather than running past the edge.
globalStyle(`${M} ${proof.strip} ${proof.item}`, {
    "@media": {
        "(max-width: 640px)": { whiteSpace: "normal", textAlign: "center" },
    },
})

// --------------------------------------------------------- the pull quote
globalStyle(`${M} ${quotes.card}`, {
    background: "none",
    border: "none",
    borderTop: `1px solid ${marketing.color.line}`,
    borderRadius: 0,
    boxShadow: "none",
    paddingInline: 0,
})

globalStyle(`${M} ${quotes.quote}`, {
    fontFamily: marketing.font.display,
    fontStyle: "italic",
    fontWeight: 300,
    fontSize: 19,
    lineHeight: 1.45,
})

globalStyle(`${M} ${quotes.featuredQuote}`, {
    fontFamily: marketing.font.display,
    fontStyle: "italic",
    fontWeight: 300,
    fontSize: "clamp(24px, 2.7vw, 38px)",
    lineHeight: 1.3,
    letterSpacing: "-0.01em",
})

globalStyle(`${M} ${quotes.author}`, {
    ...smallCaps,
    fontSize: 11,
})

globalStyle(both(quotes.authorTitle), {
    display: "block",
    fontFamily: marketing.font.body,
    fontSize: 13,
    color: marketing.color.subtle,
})

// ---------------------------------------------------------- the story page
globalStyle(`${M} ${split.headline}`, {
    fontWeight: 300,
    letterSpacing: "-0.015em",
})

// ---------------------------------------------------------- the sign-off
globalStyle(`${M} ${banner.colophonLine}`, {
    fontFamily: marketing.font.display,
    fontWeight: 300,
    fontSize: "clamp(24px, 2.6vw, 36px)",
    lineHeight: 1.25,
})

globalStyle(`${M} ${banner.colophonLine} + ${banner.colophonLine}`, {
    fontFamily: marketing.font.body,
    fontSize: 16,
    lineHeight: 1.55,
    color: marketing.color.subtle,
})

globalStyle(`${M} ${banner.colophonLink}`, {
    ...smallCaps,
    fontSize: 12,
    color: marketing.color.accent,
})
