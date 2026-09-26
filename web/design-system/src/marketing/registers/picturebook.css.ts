import { globalStyle } from "@vanilla-extract/css"
import { marketing } from "../theme/marketingTheme.css"
import { scaledSpace } from "../theme/feelBridge"
import * as hero from "../MarketingHero.styles.css"
import * as steps from "../MarketingSteps.styles.css"
import * as features from "../MarketingFeatureGrid.styles.css"
import * as banner from "../MarketingCtaBanner.styles.css"
import * as team from "../MarketingTeam.styles.css"
import * as split from "../MarketingContentSplit.styles.css"
import * as quotes from "../MarketingTestimonials.styles.css"
import * as priceList from "../MarketingPriceList.styles.css"
import { ctaPrimary, ctaSecondary, sectionKicker, sectionTitle } from "../shared.css"

/*
 * `picturebook` (picturebook): the storybook first visit. A rail of
 * illustrated steps becomes a row of book pages — paper plates with a
 * gutter shadow on their spine edge, a numbered leaf-green roundel over
 * each, the step's line set under the picture — and its heading is
 * flanked by two leaf sprigs. An icon list becomes one ruled strip of
 * facts. Portraits and photographs sit in soft paper plates; CTAs are
 * soft leaf-green pills lettered in the display serif, and the card
 * banner drops its box to one centered line over one pill.
 */
const T = '[data-marketing-treatment~="picturebook"]'
const leaf = marketing.color.accent
const ink = marketing.color.text
const paper = marketing.color.surface
const rule = marketing.color.line

// One leaf sprig, drawn as a mask so it takes the register's leaf ink.
const sprig =
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 72 28'><path d='M3 15c18-3 40-3 66-1' fill='none' stroke='black' stroke-width='1.6' stroke-linecap='round'/><path d='M16 14c-2-6 1-10 6-11 1 5-1 9-6 11z'/><path d='M16 15c1 6 6 9 11 8-1-5-5-8-11-8z'/><path d='M31 13c-1-6 3-10 8-10 0 5-3 9-8 10z'/><path d='M31 14c2 6 7 8 12 7-2-5-6-7-12-7z'/><path d='M46 13c0-6 4-9 9-9-1 5-4 8-9 9z'/><path d='M46 14c2 5 7 7 11 5-2-4-6-6-11-5z'/><path d='M61 14c2-4 5-5 8-4-1 3-4 5-8 4z'/></svg>\")"

// -- Kickers and titles: leaf-ink kickers, the soft serif at a book's ease.
globalStyle(`${T} ${sectionKicker}`, {
    color: leaf,
    fontWeight: 700,
    letterSpacing: "0.14em",
})
globalStyle(`${T} ${sectionTitle}`, {
    fontWeight: 500,
})

// -- Hero: the soft serif over the photograph, two lines.
globalStyle(`${T} ${hero.fullBleedHeadline}`, {
    fontWeight: 500,
    lineHeight: 1.04,
    maxWidth: "12ch",
})
globalStyle(`${T} ${hero.fullBleedSubheadline}`, {
    maxWidth: "36ch",
})
// Daylight heroes are bright through the windows: the scrim leans in from
// the copy's side as well as the foot, so the small caps stay readable.
globalStyle(`${T} ${hero.fullBleedScrim}`, {
    background:
        "linear-gradient(90deg, rgba(20, 28, 18, 0.5) 0%, rgba(20, 28, 18, 0.18) 42%, rgba(20, 28, 18, 0) 62%), " + // theme-exempt: a scrim under white copy on a photograph
        "linear-gradient(180deg, rgba(20, 28, 18, 0.18) 0%, rgba(20, 28, 18, 0) 34%, rgba(20, 28, 18, 0.5) 100%)", // theme-exempt: a scrim under white copy on a photograph
})
// Narrow frames crop a landscape hero to its middle; the chair and the
// dentist sit right of center.
globalStyle(`${T} ${hero.fullBleedImg}`, {
    "@media": {
        "(max-width: 860px)": { objectPosition: "70% center" },
    },
})

// -- The storybook: the rail of illustrated steps as a row of book pages.
const book = `${T} ${steps.wrapRail}:has(${steps.railMedia})`
globalStyle(book, {
    textAlign: "center",
})
globalStyle(`${book} ${steps.titleRail}`, {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    color: leaf,
    fontSize: `calc(clamp(28px, 3.4vw, 40px) * ${marketing.display.scale})`,
})
globalStyle(`${book} ${steps.titleRail}::before, ${book} ${steps.titleRail}::after`, {
    content: '""',
    flexShrink: 0,
    width: 64,
    height: 25,
    background: leaf,
    maskImage: sprig,
    WebkitMaskImage: sprig,
    maskSize: "100% 100%",
    WebkitMaskSize: "100% 100%",
    "@media": {
        "(max-width: 640px)": { width: 40, height: 16 },
    },
})
globalStyle(`${book} ${steps.titleRail}::before`, {
    transform: "scaleX(-1)",
})
globalStyle(`${book} ${steps.rail}`, {
    gap: 12,
    paddingTop: 16,
    textAlign: "center",
})
globalStyle(`${book} ${steps.railItem}`, {
    background: paper,
    border: `${marketing.shape.borderWidth} solid ${rule}`,
    borderRadius: "5px 12px 12px 5px",
    padding: "26px 14px 20px",
    boxShadow:
        `inset 14px 0 18px -16px color-mix(in srgb, ${ink} 34%, transparent), ` +
        `0 14px 26px -22px color-mix(in srgb, ${ink} 55%, transparent)`,
})
// Facing pages: every other page turns its spine to the right.
globalStyle(`${book} ${steps.railItem}:nth-child(even)`, {
    borderRadius: "12px 5px 5px 12px",
    boxShadow:
        `inset -14px 0 18px -16px color-mix(in srgb, ${ink} 34%, transparent), ` +
        `0 14px 26px -22px color-mix(in srgb, ${ink} 55%, transparent)`,
})
globalStyle(`${book} ${steps.railItem}::before`, {
    content: "none",
})
globalStyle(`${book} ${steps.railMark}`, {
    position: "absolute",
    top: -15,
    left: "50%",
    transform: "translateX(-50%)",
    margin: 0,
    alignItems: "center",
})
globalStyle(`${book} ${steps.railDot}`, {
    display: "none",
})
globalStyle(`${book} ${steps.railLabel}`, {
    display: "grid",
    placeItems: "center",
    width: 30,
    height: 30,
    borderRadius: "50%",
    background: leaf,
    color: marketing.color.onAccent,
    fontFamily: marketing.font.display,
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: 0,
    boxShadow: `0 0 0 4px ${paper}`,
})
globalStyle(`${book} ${steps.railMedia}`, {
    aspectRatio: "3 / 4",
    borderRadius: 4,
    background: "transparent",
    marginBottom: 14,
})
globalStyle(`${book} ${steps.railMedia} img`, {
    mixBlendMode: "multiply",
})
globalStyle(`${book} ${steps.railTitle}`, {
    fontFamily: marketing.font.body,
    fontSize: 15.5,
    fontWeight: 700,
    letterSpacing: 0,
    lineHeight: 1.3,
    margin: "0 0 6px",
})
globalStyle(`${book} ${steps.stepDescription}`, {
    fontSize: 13.5,
    lineHeight: 1.5,
})

// -- The fact strip: an icon list as one ruled band of short facts.
globalStyle(`${T} ${features.listGrid}`, {
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 0,
    background: paper,
    border: `${marketing.shape.borderWidth} solid ${rule}`,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
    padding: `${scaledSpace(10)} 0`,
})
globalStyle(`${T} ${features.listRow}`, {
    alignItems: "center",
    padding: `${scaledSpace(14)} ${scaledSpace(26)}`,
})
globalStyle(`${T} ${features.listRow} + ${features.listRow}`, {
    borderLeft: `${marketing.shape.borderWidth} solid ${rule}`,
    "@media": {
        "(max-width: 700px)": {
            borderLeft: "none",
            borderTop: `${marketing.shape.borderWidth} solid ${rule}`,
        },
    },
})
globalStyle(`${T} ${features.listIconTile}`, {
    background: "transparent",
    color: leaf,
    border: "none",
})
globalStyle(`${T} ${features.listRow} ${features.featureTitle}`, {
    fontFamily: marketing.font.display,
    fontWeight: 500,
    fontSize: 18,
    marginBottom: 2,
})
globalStyle(`${T} ${features.listRow} ${features.featureDescription}`, {
    fontSize: 13.5,
})

// -- The price list: a page of the book, not a chalkboard — the head and
// foot print on the paper under a leaf rule.
globalStyle(`${T} ${priceList.board}`, {
    border: `${marketing.shape.borderWidth} solid ${rule}`,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
})
globalStyle(`${T} ${priceList.head}`, {
    background: "transparent",
    color: ink,
    borderBottom: `2px solid color-mix(in srgb, ${leaf} 45%, transparent)`,
})
globalStyle(`${T} ${priceList.title}`, {
    color: leaf,
    fontWeight: 500,
})
globalStyle(`${T} ${priceList.intro}`, {
    color: marketing.color.subtle,
})
globalStyle(`${T} ${priceList.foot}`, {
    background: `color-mix(in srgb, ${leaf} 8%, ${paper})`,
    color: ink,
    borderTop: `${marketing.shape.borderWidth} solid ${rule}`,
})

// -- Plates: portraits and photographs mounted on soft paper.
globalStyle(`${T} ${team.portraitImg}`, {
    padding: 8,
    background: paper,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
})
globalStyle(`${T} ${split.mediaImg}`, {
    borderRadius: marketing.shape.radiusCard,
})
globalStyle(`${T} ${quotes.card}`, {
    borderRadius: marketing.shape.radiusCard,
})
// -- Asks: soft leaf pills lettered in the serif.
globalStyle(`${T} ${ctaPrimary}`, {
    fontFamily: marketing.font.display,
    fontWeight: 500,
    fontSize: 17,
    letterSpacing: 0,
    padding: "14px 32px",
})
globalStyle(`${T} ${ctaSecondary}`, {
    fontFamily: marketing.font.display,
    fontWeight: 500,
    letterSpacing: 0,
})

// -- The closing banner: one centered line of the serif over one pill.
globalStyle(`${T} ${banner.card}`, {
    background: "transparent",
    border: "none",
    boxShadow: "none",
    padding: `${scaledSpace(36)} 24px ${scaledSpace(64)}`,
})
globalStyle(`${T} ${banner.card} ${banner.title}`, {
    color: leaf,
    fontWeight: 500,
    marginBottom: scaledSpace(22),
})
