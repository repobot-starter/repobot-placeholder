import { globalStyle } from "@vanilla-extract/css"
import { marketing } from "../theme/marketingTheme.css"
import { scaledSpace } from "../theme/feelBridge"
import * as hero from "../MarketingHero.styles.css"
import * as showcase from "../MarketingShowcase.styles.css"
import * as banner from "../MarketingCtaBanner.styles.css"
import * as team from "../MarketingTeam.styles.css"
import * as split from "../MarketingContentSplit.styles.css"
import * as quotes from "../MarketingTestimonials.styles.css"
import * as priceList from "../MarketingPriceList.styles.css"
import { ctaPrimary, sectionKicker, sectionTitle, spot1, spot2 } from "../shared.css"

/*
 * `seaglass` (seaglass): the ocean-view practice. Kickers are small
 * terracotta caps between two short rules; titles are the narrow serif at
 * ease. The daylight hero keeps its copy in ink on the room's pale wall,
 * lifted by a sand wash instead of a dark scrim. A card grid becomes the
 * stage cards: sea-glass panels, each under an arched photograph, with
 * the emblem in terracotta, the title in the serif and the list under a
 * hairline. Portraits are round medallions, the price list prints on
 * sand, and the card banner is a sand band around one terracotta pill.
 */
const T = '[data-marketing-treatment~="seaglass"]'
const clay = marketing.color.accent
const ink = marketing.color.text
const paper = marketing.color.surface
const rule = marketing.color.line
const glass = spot1
const sand = spot2

// -- Kickers: terracotta tracked caps between two short rules.
globalStyle(`${T} ${sectionKicker}`, {
    display: "inline-flex",
    alignItems: "center",
    gap: 12,
    color: clay,
    fontWeight: 600,
    fontSize: 12,
    letterSpacing: "0.22em",
})
globalStyle(`${T} ${sectionKicker}::before, ${T} ${sectionKicker}::after`, {
    content: '""',
    width: 26,
    height: 1,
    background: "currentColor",
    opacity: 0.7,
})
globalStyle(`${T} ${sectionTitle}`, {
    fontWeight: 400,
    letterSpacing: "-0.01em",
})

// -- Hero: ink on the pale wall, a sand wash from the copy's side. Narrow
// screens can't fit copy and faces in one frame, so the photograph takes a
// band across the top and the copy follows on the sand ground.
const photoBand = "min(112vw, 560px)"
globalStyle(`${T} ${hero.fullBleed}`, {
    background: marketing.color.pageBg,
    "@media": {
        "(min-width: 861px)": { alignItems: "center" },
        "(max-width: 860px)": { minHeight: "auto", paddingTop: photoBand },
    },
})
globalStyle(`${T} ${hero.fullBleedSlide}`, {
    "@media": {
        "(max-width: 860px)": { bottom: "auto", height: photoBand },
    },
})
globalStyle(`${T} ${hero.fullBleedScrim}`, {
    background: `linear-gradient(90deg, color-mix(in srgb, ${paper} 78%, transparent) 0%, color-mix(in srgb, ${paper} 42%, transparent) 30%, transparent 52%)`,
    "@media": {
        "(max-width: 860px)": {
            bottom: "auto",
            height: photoBand,
            background: `linear-gradient(180deg, transparent 72%, ${marketing.color.pageBg} 100%)`,
        },
    },
})
globalStyle(`${T} ${hero.fullBleedInner}`, {
    "@media": {
        "(max-width: 860px)": { paddingTop: scaledSpace(28) },
    },
})
globalStyle(`${T} ${hero.fullBleedHeadline}`, {
    color: ink,
    fontSize: `calc(clamp(52px, 6.4vw, 96px) * ${marketing.display.scale})`,
    fontWeight: 400,
    lineHeight: 0.98,
    maxWidth: "9ch",
    textShadow: "none",
})
globalStyle(`${T} ${hero.fullBleedCredit}`, {
    color: marketing.color.subtle,
    letterSpacing: "0.18em",
    textShadow: "none",
})
globalStyle(`${T} ${hero.fullBleedSubheadline}`, {
    color: ink,
    fontSize: 18,
    maxWidth: "30ch",
    textShadow: "none",
})
globalStyle(`${T} ${hero.fullBleedBadge}`, {
    color: marketing.color.subtle,
    textShadow: "none",
})
globalStyle(`${T} ${hero.fullBleedSecondary}`, {
    color: ink,
    borderColor: `color-mix(in srgb, ${ink} 35%, transparent)`,
    textShadow: "none",
})
// The band crops the suite to the patient and her physician, right of the
// wall the desktop copy sits on.
globalStyle(`${T} ${hero.fullBleedImg}`, {
    "@media": {
        "(max-width: 860px)": { objectPosition: "76% center" },
    },
})

// -- Stage cards: sea-glass panels under arched photographs.
globalStyle(`${T} ${showcase.grid}`, {
    gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))",
    gap: scaledSpace(16),
    textAlign: "center",
})
globalStyle(`${T} ${showcase.card}`, {
    alignItems: "center",
    gap: 8,
    padding: `0 0 ${scaledSpace(26)}`,
    overflow: "hidden",
    border: "none",
    background: `color-mix(in srgb, ${glass} 55%, ${paper})`,
    boxShadow: "none",
})
globalStyle(`${T} ${showcase.card}:nth-child(even)`, {
    background: `color-mix(in srgb, ${sand} 60%, ${paper})`,
})
globalStyle(`${T} ${showcase.card} ${showcase.mediaImg}`, {
    aspectRatio: "3 / 4",
    width: "calc(100% - 16px)",
    margin: "8px 8px 10px",
    borderRadius: "999px 999px 6px 6px",
})
globalStyle(`${T} ${showcase.itemIcon}`, {
    color: clay,
    marginBottom: 2,
})
globalStyle(`${T} ${showcase.itemIcon} svg`, {
    width: 30,
    height: 30,
})
globalStyle(`${T} ${showcase.card} ${showcase.titleRow}`, {
    justifyContent: "center",
})
globalStyle(`${T} ${showcase.card} ${showcase.itemTitle}`, {
    fontSize: 25,
    fontWeight: 400,
    letterSpacing: "-0.01em",
})
globalStyle(`${T} ${showcase.card} ${showcase.itemDescription}`, {
    fontSize: 13.5,
    padding: "0 18px",
})
globalStyle(`${T} ${showcase.pointList}`, {
    width: "calc(100% - 36px)",
    marginTop: 6,
    paddingTop: 14,
    borderTop: `${marketing.shape.borderWidth} solid color-mix(in srgb, ${ink} 14%, transparent)`,
    textAlign: "left",
})
globalStyle(`${T} ${showcase.point}`, {
    fontSize: 13,
})

// -- Portraits: round medallions over a centered name and practice line.
globalStyle(`${T} ${team.portraits}`, {
    gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))",
    textAlign: "center",
})
globalStyle(`${T} ${team.portraitFigure}`, {
    alignItems: "center",
})
globalStyle(`${T} ${team.portraitImg}`, {
    width: "min(200px, 72%)",
    aspectRatio: "1 / 1",
    borderRadius: "50%",
    border: `6px solid ${paper}`,
    boxShadow: marketing.shape.shadowCard,
})
globalStyle(`${T} ${team.portraitName}`, {
    fontWeight: 400,
    fontSize: 22,
})
globalStyle(`${T} ${team.portraitRole}`, {
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: "0.01em",
    textTransform: "none",
})

// -- The price list: printed on sand under a terracotta rule.
globalStyle(`${T} ${priceList.board}`, {
    border: `${marketing.shape.borderWidth} solid ${rule}`,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
})
globalStyle(`${T} ${priceList.head}`, {
    background: "transparent",
    color: ink,
    borderBottom: `1px solid color-mix(in srgb, ${clay} 55%, transparent)`,
})
globalStyle(`${T} ${priceList.title}`, {
    fontWeight: 400,
})
globalStyle(`${T} ${priceList.intro}`, {
    color: marketing.color.subtle,
})
globalStyle(`${T} ${priceList.foot}`, {
    background: `color-mix(in srgb, ${sand} 45%, ${paper})`,
    color: ink,
    borderTop: `${marketing.shape.borderWidth} solid ${rule}`,
})

// -- Photographs and quotes take the soft card corner.
globalStyle(`${T} ${split.mediaImg}`, {
    borderRadius: marketing.shape.radiusCard,
})
globalStyle(`${T} ${quotes.card}`, {
    borderRadius: marketing.shape.radiusCard,
})

// -- Asks: terracotta pills in the reading sans.
globalStyle(`${T} ${ctaPrimary}`, {
    fontWeight: 500,
    letterSpacing: "0.01em",
    padding: "14px 30px",
})

// -- The closing banner: a sand band around one centered line and one pill.
globalStyle(`${T} ${banner.card}`, {
    background: `color-mix(in srgb, ${sand} 55%, ${paper})`,
    border: "none",
    boxShadow: "none",
    padding: `${scaledSpace(48)} 24px ${scaledSpace(56)}`,
})
globalStyle(`${T} ${banner.card} ${banner.title}`, {
    fontWeight: 400,
    marginBottom: scaledSpace(22),
})
