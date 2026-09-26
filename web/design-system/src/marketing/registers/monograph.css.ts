import { globalStyle } from "@vanilla-extract/css"
import { marketing } from "../theme/marketingTheme.css"
import { scaledSpace } from "../theme/feelBridge"
import * as feature from "../MarketingContentFeature.styles.css"
import * as gallery from "../MarketingGallery.styles.css"
import * as hero from "../MarketingHero.styles.css"
import * as shell from "../MarketingShell.styles.css"
import * as showcase from "../MarketingShowcase.styles.css"
import * as proof from "../MarketingSocialProof.styles.css"
import * as testimonials from "../MarketingTestimonials.styles.css"
import { scriptFont, sectionKicker, sectionTitle, spot1 } from "../shared.css"

/*
 * `monograph` (worn with `framestack`): the architect's monograph. The
 * full-bleed hero photograph is held to the stack's one plate size and
 * the practice's line is lifted off it onto the paper beneath, like a
 * plate and its caption: the badge and the photograph's `mediaCaption` as
 * mono labels, the headline light and large, the subheadline and the two
 * asks beside it. Each `captionStack` `band-*` caption is a numbered
 * plate label — the numeral (counted, never authored) in the first spot
 * ink, the project, its `detail` in mono at the right. The `feature`
 * spread drops its italics for the grotesque's upright light cut, the
 * kickers and labels are mono, and a showcase `card-grid` without
 * photographs is set as the index of works: one ruled row per item, a
 * numeral, the title, its `eyebrow`, its `description`, and its `meta`
 * flush right, under a rule in the spot ink.
 */
const M = '[data-marketing-treatment~="monograph"]'
const ON = `${M}:has(${hero.fullBleed})`
const PHONE = "(max-width: 640px)"
const TABLET = "(max-width: 900px)"
/** The stack's one plate size: 4:3 of the viewport's width, capped under the viewport. */
const PLATE = "min(92svh, 75vw)"
/** A showcase card grid with no photographs: the index of works. */
const INDEX = `${showcase.grid}:not(:has(img))`

// ------------------------------------------------------------ the labels
globalStyle(`${M} ${sectionKicker}, ${ON} ${testimonials.kicker}`, {
    display: "block",
    fontFamily: scriptFont,
    fontSize: 11.5,
    fontWeight: 400,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
    border: "none",
    paddingBottom: 0,
    marginBottom: scaledSpace(14),
})

// framestack sets every section title in the body face for its prose
// bands; the monograph has none, so its heads keep the light display cut.
globalStyle(`${ON} section ${sectionTitle}`, {
    fontFamily: marketing.font.display,
    fontSize: `calc(clamp(28px, 3vw, 44px) * ${marketing.display.scale})`,
    fontWeight: 300,
    letterSpacing: "-0.03em",
    lineHeight: 1.1,
    margin: `0 0 ${scaledSpace(34)}`,
})

// ---------------------------------------------------------------- the hero
globalStyle(`${ON} ${hero.fullBleed}`, {
    display: "block",
    minHeight: 0,
    background: marketing.color.pageBg,
})

globalStyle(`${ON} ${hero.fullBleedSlide}`, {
    bottom: "auto",
    height: PLATE,
})

globalStyle(`${ON} ${hero.fullBleedSlide}:first-child`, {
    position: "relative",
})

globalStyle(`${ON} ${hero.fullBleedScrim}`, {
    bottom: "auto",
    height: PLATE,
    background: "linear-gradient(180deg, rgba(8, 10, 14, 0.34) 0%, rgba(8, 10, 14, 0) 24%)", // theme-exempt: keeps the floating nav's white ink legible over the photograph
})

globalStyle(`${ON} ${hero.fullBleedInner}`, {
    display: "grid",
    gridTemplateColumns: "minmax(0, 7fr) minmax(0, 5fr)",
    columnGap: scaledSpace(64),
    rowGap: 0,
    alignItems: "start",
    padding: `${scaledSpace(22)} 24px ${scaledSpace(84)}`,
    "@media": {
        [TABLET]: { gridTemplateColumns: "minmax(0, 1fr)", padding: `18px 22px ${scaledSpace(56)}` },
    },
})

globalStyle(`${ON} ${hero.fullBleedCopy}`, {
    display: "contents",
})

globalStyle(`${ON} ${hero.fullBleedBadge}, ${ON} ${hero.fullBleedCaption}`, {
    gridRow: 1,
    fontFamily: scriptFont,
    fontSize: 11.5,
    fontWeight: 400,
    lineHeight: 1.6,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
    margin: `0 0 ${scaledSpace(40)}`,
    maxWidth: "none",
    justifySelf: "start",
    textAlign: "left",
})

globalStyle(`${ON} ${hero.fullBleedBadge}`, {
    gridColumn: 1,
})

// The rest of the copy that wears white over a photograph (the masthead
// reading's kicker, the credit, the cover lines) sits on the paper here
// too, so it takes the paper's inks.
globalStyle(`${ON} ${hero.mastheadKicker}, ${ON} ${hero.fullBleedCredit}, ${ON} ${hero.coverLineTail}`, {
    color: marketing.color.subtle,
})

globalStyle(`${ON} ${hero.coverLine}`, {
    color: marketing.color.text,
})

globalStyle(`${ON} ${hero.fullBleedCaption}`, {
    gridColumn: 2,
    "@media": {
        [TABLET]: { gridColumn: 1, gridRow: 5, margin: `${scaledSpace(30)} 0 0` },
    },
})

globalStyle(`${ON} ${hero.fullBleed} ${hero.headline}`, {
    gridColumn: 1,
    gridRow: "2 / span 2",
    color: marketing.color.text,
    fontSize: `calc(clamp(40px, 5.2vw, 80px) * ${marketing.display.scale})`,
    fontWeight: 300,
    letterSpacing: "-0.04em",
    lineHeight: 1,
    maxWidth: "12em",
    textWrap: "balance",
    margin: 0,
    "@media": {
        [TABLET]: { gridRow: 2, marginBottom: 20 },
        [PHONE]: { fontSize: `calc(36px * ${marketing.display.scale})`, lineHeight: 1.04 },
    },
})

globalStyle(`${ON} ${hero.fullBleed} ${hero.subheadline}`, {
    gridColumn: 2,
    gridRow: 2,
    alignSelf: "end",
    color: marketing.color.text,
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 1.6,
    letterSpacing: 0,
    maxWidth: "31em",
    margin: 0,
    "@media": {
        [TABLET]: { gridColumn: 1, gridRow: 3, fontSize: 15 },
    },
})

globalStyle(`${ON} ${hero.fullBleed} ${hero.ctaRow}`, {
    gridColumn: 2,
    gridRow: 3,
    alignItems: "center",
    justifyContent: "flex-start",
    gap: scaledSpace(28),
    marginTop: scaledSpace(26),
    "@media": {
        [TABLET]: { gridColumn: 1, gridRow: 4 },
    },
})

globalStyle(`${ON} ${hero.fullBleed} ${hero.primary}`, {
    background: marketing.color.accent,
    color: marketing.color.onAccent,
    border: "none",
    borderRadius: 0,
    boxShadow: "none",
    fontSize: 13.5,
    fontWeight: 500,
    letterSpacing: 0,
    padding: "14px 22px",
})

globalStyle(`${ON} ${hero.fullBleedSecondary}`, {
    color: marketing.color.text,
    border: "none",
    borderRadius: 0,
    padding: "4px 0",
    fontSize: 13.5,
    fontWeight: 500,
    textDecoration: "underline",
    textDecorationThickness: "1px",
    textUnderlineOffset: "6px",
})

// ------------------------------------------------------------ the plates
globalStyle(`${M} ${gallery.sequenceBleed}`, {
    counterReset: "plate",
})

globalStyle(`${M} ${gallery.bandFigure}`, {
    counterIncrement: "plate",
})

globalStyle(`${M} ${gallery.bandCaption}`, {
    display: "grid",
    gridTemplateColumns: "56px minmax(0, 1fr) auto",
    columnGap: 16,
    alignItems: "baseline",
    paddingTop: scaledSpace(18),
    paddingBottom: scaledSpace(52),
    fontFamily: marketing.font.body,
    fontSize: 17,
    lineHeight: 1.4,
    letterSpacing: "-0.01em",
    textAlign: "left",
    "@media": {
        [PHONE]: {
            gridTemplateColumns: "34px minmax(0, 1fr)",
            fontSize: 15,
            paddingTop: 12,
            paddingBottom: 30,
            paddingInline: 18,
        },
    },
})

globalStyle(`${M} ${gallery.bandCaption}::before`, {
    content: "counter(plate, decimal-leading-zero)",
    fontFamily: scriptFont,
    fontSize: 12,
    letterSpacing: "0.04em",
    color: spot1,
})

globalStyle(`${M} ${gallery.bandCaption} ${gallery.stackCaptionDetail}`, {
    margin: 0,
    fontFamily: scriptFont,
    fontSize: 11.5,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    textAlign: "right",
    color: marketing.color.subtle,
    opacity: 1,
    "@media": {
        [PHONE]: { gridColumn: 2, textAlign: "left", marginTop: 4, fontSize: 10.5 },
    },
})

// ------------------------------------------------------------ the feature
globalStyle(`${M} ${feature.kicker}`, {
    fontFamily: scriptFont,
    fontSize: 11.5,
    letterSpacing: "0.08em",
})

globalStyle(`${M} ${feature.headline}`, {
    fontWeight: 300,
    letterSpacing: "-0.035em",
    lineHeight: 1.04,
    maxWidth: "15em",
    margin: "0 auto",
})

globalStyle(`${M} ${feature.body}`, {
    fontSize: 16,
    lineHeight: 1.7,
})

globalStyle(`${M} ${feature.body} ${feature.paragraph}:first-child::first-letter`, {
    fontWeight: 300,
    fontSize: "4.4em",
    lineHeight: 0.8,
    padding: "0.06em 0.12em 0 0",
})

// Geist cuts no italic: the coda, the pull quote, and the figure notes stay upright.
globalStyle(`${M} ${feature.bodyColumns} ${feature.paragraph}:last-child:not(:first-child)`, {
    fontStyle: "normal",
})

globalStyle(`${M} ${feature.pullQuoteText}`, {
    fontStyle: "normal",
    fontWeight: 300,
    letterSpacing: "-0.025em",
    lineHeight: 1.22,
})

globalStyle(`${M} ${feature.pullQuote}`, {
    borderTop: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    paddingTop: scaledSpace(24),
})

globalStyle(`${M} ${feature.figureTitle}, ${M} ${feature.plateCaption}`, {
    fontFamily: scriptFont,
    fontSize: 11,
    letterSpacing: "0.06em",
})

globalStyle(`${M} ${feature.figureText}`, {
    fontStyle: "normal",
    fontSize: 14,
})

// ---------------------------------------------- photographed cards (portfolio)
// The title over its particulars: a long scope beside a title squeezes the
// name of the building into a column one word wide.
globalStyle(`${M} ${showcase.card} ${showcase.titleRow}`, {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 4,
})

globalStyle(`${M} ${showcase.card} ${showcase.itemTitle}`, {
    fontWeight: 500,
    letterSpacing: "-0.01em",
})

globalStyle(`${M} ${showcase.card} ${showcase.meta}`, {
    fontFamily: scriptFont,
    fontSize: 11.5,
    fontWeight: 400,
    letterSpacing: "0.04em",
    color: marketing.color.subtle,
})

// -------------------------------------------------------- the index of works
globalStyle(`${M} ${showcase.wrap}:has(${INDEX})`, {
    textAlign: "left",
})

globalStyle(`${M} ${INDEX}`, {
    display: "block",
    counterReset: "work",
    borderTop: `${marketing.shape.borderWidth} solid ${spot1}`,
})

globalStyle(`${M} ${INDEX} ${showcase.card}`, {
    display: "grid",
    gridTemplateColumns: "56px minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 1.6fr) 64px",
    columnGap: 20,
    alignItems: "baseline",
    counterIncrement: "work",
    background: "none",
    border: "none",
    borderBottom: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: 0,
    boxShadow: "none",
    padding: `${scaledSpace(17)} 0`,
    "@media": {
        [TABLET]: { gridTemplateColumns: "34px minmax(0, 1fr) auto", rowGap: 4 },
    },
})

globalStyle(`${M} ${INDEX} ${showcase.card}::before`, {
    content: "counter(work, decimal-leading-zero)",
    gridColumn: 1,
    gridRow: 1,
    fontFamily: scriptFont,
    fontSize: 12,
    color: spot1,
})

globalStyle(`${M} ${INDEX} ${showcase.titleRow}`, {
    display: "contents",
})

globalStyle(`${M} ${INDEX} ${showcase.itemTitle}`, {
    gridColumn: 2,
    gridRow: 1,
    fontFamily: marketing.font.body,
    fontSize: 17,
    fontWeight: 400,
    letterSpacing: "-0.01em",
})

globalStyle(`${M} ${INDEX} ${showcase.eyebrow}`, {
    gridColumn: 3,
    gridRow: 1,
    fontFamily: marketing.font.body,
    fontSize: 14,
    fontWeight: 400,
    letterSpacing: 0,
    textTransform: "none",
    color: marketing.color.subtle,
    "@media": {
        [TABLET]: { gridColumn: 2, gridRow: 2 },
    },
})

globalStyle(`${M} ${INDEX} ${showcase.itemDescription}`, {
    gridColumn: 4,
    gridRow: 1,
    fontSize: 14,
    lineHeight: 1.5,
    color: marketing.color.subtle,
    "@media": {
        [TABLET]: { gridColumn: 2, gridRow: 3 },
    },
})

globalStyle(`${M} ${INDEX} ${showcase.meta}`, {
    gridColumn: 5,
    gridRow: 1,
    justifySelf: "end",
    fontFamily: scriptFont,
    fontSize: 12,
    fontWeight: 400,
    color: marketing.color.text,
    "@media": {
        [TABLET]: { gridColumn: 3 },
    },
})

// ------------------------------------------------------- the voice and the list
globalStyle(`${ON} ${testimonials.card}`, {
    fontFamily: marketing.font.display,
    fontStyle: "normal",
    fontWeight: 300,
    fontSize: "clamp(20px, 2.1vw, 28px)",
    letterSpacing: "-0.02em",
    lineHeight: 1.35,
})

globalStyle(`${M} ${proof.label}`, {
    fontFamily: scriptFont,
    fontSize: 11.5,
    fontWeight: 400,
    letterSpacing: "0.08em",
})

// The recognition strip reads as citations, not wordmarks — and wraps on a phone.
globalStyle(`${M} ${proof.item}`, {
    fontFamily: marketing.font.body,
    fontSize: 15,
    fontWeight: 400,
    letterSpacing: "-0.01em",
    textTransform: "none",
    whiteSpace: "normal",
    textAlign: "center",
    color: marketing.color.text,
})

// -------------------------------------------------------------- the wordmark
globalStyle(`${M} ${shell.logo}`, {
    fontFamily: marketing.font.body,
    fontSize: 17,
    fontWeight: 500,
    letterSpacing: "-0.02em",
})

globalStyle(`${M} ${shell.links}`, {
    fontFamily: scriptFont,
    fontSize: 11.5,
    fontWeight: 400,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
})
