import { globalStyle } from "@vanilla-extract/css"
import { marketing } from "../theme/marketingTheme.css"
import { scaledSpace } from "../theme/feelBridge"
import * as hero from "../MarketingHero.styles.css"
import * as gallery from "../MarketingGallery.styles.css"
import * as steps from "../MarketingSteps.styles.css"
import * as banner from "../MarketingCtaBanner.styles.css"
import * as team from "../MarketingTeam.styles.css"
import * as split from "../MarketingContentSplit.styles.css"
import * as quotes from "../MarketingTestimonials.styles.css"
import { ctaPrimary, sectionKicker, sectionTitle, spot1 } from "../shared.css"

/*
 * `terrazzo` (terrazzo): the lakeside orthodontic studio. Kickers go to
 * the second ink (lake blue) as small tracked caps over a short rule;
 * section titles stay in the quiet medium sans. Before/after pairs are
 * soft-cornered stone plates with their month chips as white tabs and the
 * case line centered under the frame; a pictogram rail (steps with icons)
 * is set in one white panel, the steps read left to right with arrows
 * between them instead of a connecting line; portraits and photographs
 * take the stone's rounded edge; and the card banner drops its box to a
 * single centered line of type over the one button.
 */
const T = '[data-marketing-treatment~="terrazzo"]'
const lake = spot1
const ink = marketing.color.text
const paper = marketing.color.surface

// -- Kickers: lake-blue tracked caps over a short rule.
globalStyle(`${T} ${sectionKicker}`, {
    color: lake,
    fontWeight: 600,
    fontSize: 12.5,
    letterSpacing: "0.18em",
})
globalStyle(`${T} ${sectionTitle}`, {
    fontWeight: 500,
    letterSpacing: "-0.025em",
})

// -- Hero: the medium sans at scale over the photograph.
globalStyle(`${T} ${hero.fullBleedHeadline}`, {
    fontWeight: 500,
    letterSpacing: "-0.03em",
    lineHeight: 1.02,
    maxWidth: "13ch",
})
globalStyle(`${T} ${hero.fullBleedSubheadline}`, {
    fontSize: 19,
    maxWidth: "34ch",
})
// Narrow frames crop a landscape hero to its middle; the studio's people
// stand in the right third, the copy keeps the open floor on the left.
globalStyle(`${T} ${hero.fullBleedImg}`, {
    "@media": {
        "(max-width: 860px)": { objectPosition: "90% center" },
    },
})

// -- Before/after: stone plates three to a row, white month tabs, the case
// line centered.
globalStyle(`${T} ${gallery.compare}`, {
    gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))",
    gap: scaledSpace(20),
})
globalStyle(`${T} ${gallery.compareFrame}`, {
    borderRadius: marketing.shape.radiusCard,
})
globalStyle(`${T} ${gallery.compareChip}`, {
    top: "auto",
    bottom: 12,
    borderRadius: 999,
    padding: "4px 11px",
    fontSize: 12,
    letterSpacing: "0.02em",
    textTransform: "none",
    color: ink,
    background: `color-mix(in srgb, ${paper} 92%, transparent)`,
    boxShadow: "0 4px 14px -6px rgba(0, 0, 0, 0.35)", // theme-exempt: a lift under a tab floating over the photograph
})
globalStyle(`${T} ${gallery.compareFigure} ${gallery.caption}`, {
    textAlign: "center",
    fontSize: 14.5,
    color: ink,
    marginTop: 12,
})

// -- The pictogram rail: one white panel, arrows between the steps.
globalStyle(`${T} ${steps.rail}:has(${steps.railIcon})`, {
    background: paper,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
    padding: `${scaledSpace(26)} ${scaledSpace(30)}`,
    gap: scaledSpace(40),
    "@media": {
        // The panel holds the whole path on a phone: the steps stack as a
        // list instead of scrolling sideways out of their own frame.
        "(max-width: 860px)": {
            gridAutoFlow: "row",
            gridAutoColumns: "auto",
            overflowX: "visible",
            scrollSnapType: "none",
            marginRight: 0,
            padding: `${scaledSpace(22)} ${scaledSpace(20)}`,
            gap: scaledSpace(18),
        },
    },
})
globalStyle(`${T} ${steps.rail}:has(${steps.railIcon}) ${steps.railItem}`, {
    display: "grid",
    gridTemplateColumns: "auto minmax(0, 1fr)",
    alignItems: "center",
    columnGap: 12,
    rowGap: 2,
})
globalStyle(`${T} ${steps.rail}:has(${steps.railIcon}) ${steps.railItem}::before`, {
    content: '"→"',
    top: "50%",
    left: "auto",
    right: `calc(-1 * ${scaledSpace(28)})`,
    height: "auto",
    background: "none",
    transform: "translateY(-50%)",
    color: marketing.color.subtle,
    fontSize: 18,
    lineHeight: 1,
})
globalStyle(`${T} ${steps.rail}:has(${steps.railIcon}) ${steps.railItem}:last-child::before`, {
    content: "none",
})
globalStyle(`${T} ${steps.rail}:has(${steps.railIcon}) ${steps.railItem}::before`, {
    "@media": {
        "(max-width: 860px)": { content: "none" },
    },
})
globalStyle(`${T} ${steps.rail}:has(${steps.railIcon}) ${steps.railMark}`, {
    gridRow: "span 2",
    marginBottom: 0,
})
globalStyle(`${T} ${steps.railIcon}`, {
    marginTop: 0,
    width: 40,
    height: 40,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    background: marketing.color.pageBg,
    color: ink,
})
globalStyle(`${T} ${steps.railIcon} + ${steps.railLabel}`, {
    display: "none",
})
globalStyle(`${T} ${steps.rail}:has(${steps.railIcon}) ${steps.railTitle}`, {
    fontSize: 15.5,
    fontWeight: 600,
    letterSpacing: "-0.01em",
    margin: 0,
    alignSelf: "end",
})
globalStyle(`${T} ${steps.rail}:has(${steps.railIcon}) ${steps.stepDescription}`, {
    fontSize: 13,
    lineHeight: 1.45,
    alignSelf: "start",
})

// -- Photographs and portraits: the stone's rounded edge.
globalStyle(`${T} ${team.portraitImg}, ${T} ${split.mediaImg}, ${T} ${steps.railMedia}`, {
    borderRadius: marketing.shape.radiusCard,
})
globalStyle(`${T} ${quotes.card}`, {
    borderRadius: marketing.shape.radiusCard,
})

// -- The closing banner: one centered line of type over one button.
globalStyle(`${T} ${banner.card}`, {
    background: "transparent",
    border: "none",
    boxShadow: "none",
    padding: `${scaledSpace(40)} 24px ${scaledSpace(64)}`,
})
globalStyle(`${T} ${banner.card} ${banner.title}`, {
    fontFamily: marketing.font.body,
    fontWeight: 500,
    fontSize: "clamp(19px, 2vw, 23px)",
    letterSpacing: "-0.01em",
    marginBottom: scaledSpace(22),
})
globalStyle(`${T} ${ctaPrimary}`, {
    fontWeight: 600,
    padding: "14px 30px",
})
