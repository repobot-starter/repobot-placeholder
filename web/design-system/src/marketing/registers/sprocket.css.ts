import { globalStyle } from "@vanilla-extract/css"
import { marketing } from "../theme/marketingTheme.css"
import { scaledSpace } from "../theme/feelBridge"
import * as banner from "../MarketingCtaBanner.styles.css"
import * as gallery from "../MarketingGallery.styles.css"
import * as hero from "../MarketingHero.styles.css"
import * as lead from "../MarketingLeadForm.styles.css"
import * as proof from "../MarketingSocialProof.styles.css"
import * as quotes from "../MarketingTestimonials.styles.css"
import * as shell from "../MarketingShell.styles.css"
import * as showcase from "../MarketingShowcase.styles.css"
import * as split from "../MarketingContentSplit.styles.css"
import {
    ctaPrimary,
    scriptFont,
    sectionHeaderCentered,
    sectionKicker,
    sectionTitle,
    sectionTitleDisplay,
    spot1,
} from "../shared.css"

/*
 * `sprocket`: a film-and-streetwear creator's page. Three voices: the
 * display face condensed and heavy in capitals (the variable width axis
 * pulled in at the page root, so every display line is the narrow cut),
 * the body face for reading, and the register's mono third voice for
 * kickers, labels, the credit and the asks.
 *
 * The masthead hero sets the creator's name on one line across the foot
 * of the photograph — sized to the frame's width by the kernel's headline
 * fit — with the kicker, credit, line and asks stacked above it. The
 * contact sheet's grease pencil is spot 1 (the film edge's amber). The
 * specimen plates are numbered in large accent numerals; the platforms
 * are a ruled mono list; cards and quotes hang from hard ink rules; the
 * metrics are condensed numerals; the full-bleed banner is solid accent.
 * Headers sit left, like a contact sheet's label.
 */
const S = '[data-marketing-treatment~="sprocket"]'
const WHITE = "#ffffff" // theme-exempt: copy over a photograph or the solid accent band is white in every theme
const INK_RULE = `2px solid ${marketing.color.text}`
const HERO_GUTTER = "clamp(16px, 2.4vw, 36px)"
const mono = {
    fontFamily: scriptFont,
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
} as const

globalStyle(S, {
    fontStretch: "75%",
})

// ------------------------------------------------------------------- the bar
globalStyle(`${S} ${shell.barSplit}`, {
    borderBottom: INK_RULE,
})

globalStyle(`${S} ${shell.logo}`, {
    fontFamily: marketing.font.display,
    fontWeight: 800,
    fontSize: 24,
    letterSpacing: "0",
    textTransform: "uppercase",
})

globalStyle(`${S} ${shell.link}`, {
    ...mono,
    color: marketing.color.text,
})

globalStyle(`${S} ${shell.cta}`, {
    ...mono,
    background: marketing.color.accent,
    color: marketing.color.onAccent,
    border: "none",
    boxShadow: "none",
    padding: "12px 18px",
})

// ------------------------------------------------------------------ the hero
globalStyle(`${S} ${hero.fullBleed}`, {
    minHeight: "min(86svh, 960px)",
    "@media": {
        // A phone stands the cover up: a tall crop around the subject.
        "(max-width: 640px)": { minHeight: "min(660px, 160vw)" },
    },
})

globalStyle(`${S} ${hero.fullBleedImg}`, {
    objectPosition: "50% 12%",
})

globalStyle(`${S} ${hero.fullBleedScrim}`, {
    background:
        "linear-gradient(to top, rgba(8, 8, 8, 0.62) 0%, rgba(8, 8, 8, 0.2) 42%, rgba(8, 8, 8, 0) 64%)", // theme-exempt: a neutral scrim over photography, the same in every theme
})

globalStyle(`${S} ${hero.fullBleedInner}`, {
    width: "100%",
    padding: `0 ${HERO_GUTTER} clamp(14px, 1.6vw, 24px)`,
})

globalStyle(`${S} ${hero.fullBleedCopy}`, {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
})

globalStyle(`${S} ${hero.mastheadKicker}`, {
    ...mono,
    color: WHITE,
    marginBottom: 10,
})

globalStyle(`${S} ${hero.fullBleedCredit}`, {
    ...mono,
    color: "rgba(255, 255, 255, 0.82)", // theme-exempt: secondary copy over the scrim
    margin: 0,
})

globalStyle(`${S} ${hero.fullBleed} ${hero.subheadline}`, {
    fontSize: 16,
    lineHeight: 1.5,
    maxWidth: "30em",
    margin: `${scaledSpace(14)} 0 0`,
    "@media": {
        "(max-width: 640px)": { display: "none" },
    },
})

globalStyle(`${S} ${hero.fullBleed} ${hero.ctaRow}`, {
    order: 4,
    marginTop: scaledSpace(20),
    gap: 10,
})

// The name goes last: one line across the foot of the frame. Sized from
// the frame's width for a first-and-last name in the condensed heavy caps
// (4.5 to 4.7 ems wide), so it lands full-width without waiting on the
// webfont; the kernel's headline fit still shrinks a longer name.
globalStyle(`${S} ${hero.mastheadHeadline}`, {
    order: 5,
    alignSelf: "stretch",
    whiteSpace: "nowrap",
    fontSize: `calc((100vw - 2 * ${HERO_GUTTER}) / 4.7)`,
    "@media": {
        // The optical-size axis draws the big cut narrower.
        "(min-width: 900px)": { fontSize: `calc((100vw - 2 * ${HERO_GUTTER}) / 4.5)` },
    },
    lineHeight: 0.8,
    letterSpacing: "-0.01em",
    margin: `${scaledSpace(22)} 0 0`,
})

globalStyle(`${S} ${hero.fullBleed} ${hero.primary}, ${S} ${hero.fullBleedSecondary}`, {
    ...mono,
    borderRadius: 0,
    padding: "13px 18px",
    boxShadow: "none",
})

globalStyle(`${S} ${hero.fullBleed} ${hero.primary}`, {
    background: marketing.color.accent,
    color: WHITE,
    border: "none",
})

globalStyle(`${S} ${hero.fullBleedSecondary}`, {
    background: "transparent",
    border: `1.5px solid ${WHITE}`,
})

globalStyle(`${S} ${hero.statement} ${hero.headline}`, {
    fontSize: "clamp(52px, 9vw, 136px)",
    lineHeight: 0.86,
})

// --------------------------------------------------------------- the headers
globalStyle(`${S} ${sectionHeaderCentered}`, {
    textAlign: "left",
})

globalStyle(`${S} ${sectionKicker}`, {
    ...mono,
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    color: marketing.color.text,
})

globalStyle(`${S} ${sectionKicker}::before`, {
    content: '""',
    width: 9,
    height: 9,
    background: marketing.color.accent,
})

globalStyle(`${S} ${sectionTitle}, ${S} ${sectionTitleDisplay}`, {
    fontFamily: marketing.font.display,
    fontWeight: 800,
    fontSize: "clamp(40px, 6vw, 88px)",
    lineHeight: 0.88,
    letterSpacing: "-0.005em",
    textTransform: "uppercase",
})

// ------------------------------------------------------------- the roll
globalStyle(`${S} ${gallery.sheetMark}`, {
    color: spot1,
})

globalStyle(`${S} ${gallery.sheetNote}`, {
    color: spot1,
})

// ---------------------------------------------------------- the fits board
globalStyle(`${S} ${showcase.specimenIndex}`, {
    fontFamily: marketing.font.display,
    fontWeight: 800,
    fontSize: 48,
    lineHeight: 0.9,
    letterSpacing: "0",
    color: marketing.color.accent,
    marginBottom: 8,
})

globalStyle(`${S} ${showcase.specimenName}`, {
    fontFamily: marketing.font.body,
    fontWeight: 600,
    fontSize: 17,
    letterSpacing: "0",
    textTransform: "none",
})

globalStyle(`${S} ${showcase.specimenUse}`, {
    fontFamily: scriptFont,
})

globalStyle(`${S} ${showcase.specimenPlate}`, {
    background: marketing.color.text,
})

// ------------------------------------------------- the platforms, as a list
globalStyle(`${S} ${showcase.collectionsGrid}`, {
    gridTemplateColumns: "1fr",
    gap: 0,
    borderTop: INK_RULE,
})

globalStyle(`${S} ${showcase.collectionsGrid} ${showcase.collectionCard}`, {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1fr) auto",
    alignItems: "baseline",
    gap: 16,
    padding: "16px 0",
    borderBottom: `1px solid ${marketing.color.line}`,
})

globalStyle(`${S} ${showcase.collectionsGrid} ${showcase.titleRow}`, {
    display: "contents",
})

globalStyle(`${S} ${showcase.collectionsGrid} ${showcase.collectionTitle}`, {
    order: 1,
    fontWeight: 800,
    fontSize: "clamp(26px, 3.2vw, 40px)",
    lineHeight: 0.95,
    textTransform: "uppercase",
})

globalStyle(`${S} ${showcase.collectionsGrid} ${showcase.itemDescription}`, {
    ...mono,
    order: 2,
    justifySelf: "start",
    textAlign: "left",
    textTransform: "none",
    color: marketing.color.subtle,
})

globalStyle(`${S} ${showcase.collectionsGrid} ${showcase.meta}`, {
    ...mono,
    order: 3,
    fontSize: 14,
    color: marketing.color.text,
})

globalStyle(`${S} ${showcase.collectionsGrid} ${showcase.collectionCard}:hover ${showcase.collectionTitle}`, {
    color: marketing.color.accent,
})

// ------------------------------------------------------ cards and chips
globalStyle(`${S} ${showcase.card}`, {
    background: "none",
    border: "none",
    borderTop: INK_RULE,
    borderRadius: 0,
    boxShadow: "none",
    paddingInline: 0,
})

globalStyle(`${S} ${showcase.itemTitle}`, {
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 1.05,
})

globalStyle(`${S} ${showcase.eyebrow}`, {
    ...mono,
    color: marketing.color.accent,
})

globalStyle(`${S} ${showcase.meta}`, {
    ...mono,
    color: marketing.color.subtle,
})

globalStyle(`${S} ${showcase.badge}, ${S} ${showcase.tag}`, {
    ...mono,
    fontSize: 10.5,
    borderRadius: 0,
})

globalStyle(`${S} ${showcase.tag}`, {
    background: "none",
    border: `1px solid ${marketing.color.line}`,
    color: marketing.color.subtle,
})

globalStyle(`${S} ${showcase.chipRow}`, {
    justifyContent: "flex-start",
})

globalStyle(`${S} ${showcase.chip}`, {
    ...mono,
    borderRadius: 0,
    borderColor: marketing.color.text,
    color: marketing.color.text,
})

globalStyle(`${S} ${showcase.chip}[aria-pressed="true"]`, {
    background: marketing.color.text,
    borderColor: marketing.color.text,
    color: marketing.color.pageBg,
})

// ---------------------------------------------------------- the numbers
globalStyle(`${S} ${proof.metricsRow}`, {
    borderTop: INK_RULE,
    paddingTop: scaledSpace(28),
})

globalStyle(`${S} ${proof.metricValue}`, {
    fontFamily: marketing.font.display,
    fontWeight: 800,
    fontSize: "clamp(56px, 8vw, 116px)",
    lineHeight: 0.85,
    color: marketing.color.text,
})

globalStyle(`${S} ${proof.metricLabel}, ${S} ${proof.label}`, {
    ...mono,
    color: marketing.color.subtle,
})

// ----------------------------------------------------------- the voices
globalStyle(`${S} ${quotes.card}`, {
    background: "none",
    border: "none",
    borderTop: INK_RULE,
    borderRadius: 0,
    boxShadow: "none",
    paddingInline: 0,
})

globalStyle(`${S} ${quotes.quote}`, {
    fontSize: 17,
    lineHeight: 1.55,
})

globalStyle(`${S} ${quotes.author}`, {
    ...mono,
    color: marketing.color.text,
})

globalStyle(`${S} ${quotes.authorTitle}`, {
    ...mono,
    textTransform: "none",
    color: marketing.color.subtle,
})

globalStyle(`${S} ${split.headline}`, {
    fontSize: "clamp(40px, 5.4vw, 76px)",
    lineHeight: 0.88,
})

// ------------------------------------------------------------ the brief
globalStyle(`${S} ${lead.detailForm}`, {
    width: "min(780px, 100%)",
    margin: 0,
    padding: `${scaledSpace(22)} 0 0`,
    background: "none",
    border: "none",
    borderTop: INK_RULE,
    borderRadius: 0,
})

globalStyle(`${S} ${lead.detailLabel}`, {
    ...mono,
})

globalStyle(`${S} ${lead.body}`, {
    margin: `0 0 ${scaledSpace(30)}`,
})

globalStyle(`${S} ${lead.channels}`, {
    justifyContent: "flex-start",
})

globalStyle(`${S} ${lead.channel}`, {
    alignItems: "flex-start",
})

globalStyle(`${S} ${lead.channelLabel}, ${S} ${lead.button}`, {
    ...mono,
})

// ------------------------------------------------------------ the band
globalStyle(`${S} ${banner.fullBleed}`, {
    background: marketing.color.accent,
    border: "none",
    textAlign: "left",
    padding: `${scaledSpace(96)} ${HERO_GUTTER}`,
})

globalStyle(`${S} ${banner.fullBleed} ${banner.title}`, {
    color: WHITE,
    fontSize: "clamp(56px, 11vw, 180px)",
    lineHeight: 0.84,
    marginBottom: scaledSpace(22),
})

globalStyle(`${S} ${banner.fullBleed} ${banner.body}`, {
    color: "rgba(255, 255, 255, 0.86)", // theme-exempt: secondary copy on the solid accent band
    fontSize: 17,
    margin: `0 0 ${scaledSpace(28)}`,
    maxWidth: "34em",
})

globalStyle(`${S} ${banner.fullBleed} ${ctaPrimary}`, {
    ...mono,
    fontSize: 13,
    background: WHITE,
    color: marketing.color.text,
    border: "none",
    borderRadius: 0,
    boxShadow: "none",
    padding: "16px 22px",
})
