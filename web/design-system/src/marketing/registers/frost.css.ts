import { globalStyle } from "@vanilla-extract/css"
import { marketing } from "../theme/marketingTheme.css"
import { scaledSpace } from "../theme/feelBridge"
import * as hero from "../MarketingHero.styles.css"
import * as shell from "../MarketingShell.styles.css"
import * as steps from "../MarketingSteps.styles.css"
import * as prices from "../MarketingPriceList.styles.css"
import * as logos from "../MarketingLogos.styles.css"
import * as split from "../MarketingContentSplit.styles.css"
import * as team from "../MarketingTeam.styles.css"
import * as quotes from "../MarketingTestimonials.styles.css"
import * as faq from "../MarketingFaq.styles.css"
import * as banner from "../MarketingCtaBanner.styles.css"
import { ctaPrimary, ctaSecondary, section, sectionKicker, sectionTitle, spot1 } from "../shared.css"

/*
 * `frost` (boreal): a Minnesota winter indoors. The full-bleed hero is
 * washed in frost from the left and the foot so the headline sets in slate
 * over the snow, not white over a dark grade; kickers are small tracked
 * caps; the `horizontal-rail` steps are a quiet track — slate hairline,
 * open nodes, the step labels ("Day 1", "Week 2") as the reading line,
 * and the last node in the preset's one warm color (peach, spot 1), the
 * track warming toward it — and on phones the track turns vertical. The
 * content split's bullets set inline as a run of plain words between
 * peach points; everything else is white cards on winter white.
 */
const F = '[data-marketing-treatment~="frost"]'
const ink = marketing.color.text
const slate = marketing.color.accent
const hair = `1px solid ${marketing.color.line}`
// Copy over the frosted photograph keeps its slate in every theme: the
// wash is a photographic surface, not the page.
const FROST_INK = "#1e2a33" // theme-exempt: slate copy over the frosted photograph, the same in every theme
const FROST_SUBTLE = "#3f4f5b" // theme-exempt: slate copy over the frosted photograph, the same in every theme

const trackedCaps = {
    fontFamily: marketing.font.body,
    fontSize: 12.5,
    fontWeight: 500,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
} as const

const point = {
    content: '""',
    width: 6,
    height: 6,
    flex: "0 0 6px",
    borderRadius: "50%",
    background: spot1,
} as const

// -- Asks: slate, tracked caps.
globalStyle(`${F} ${ctaPrimary}, ${F} ${ctaSecondary}`, {
    ...trackedCaps,
    fontSize: 13.5,
    letterSpacing: "0.14em",
    padding: "15px 28px",
    boxShadow: "none",
})

// -- Nav: the name in wide tracked caps over the menu button.
globalStyle(`${F} ${shell.logo}`, {
    fontFamily: marketing.font.body,
    fontSize: 17,
    fontWeight: 500,
    letterSpacing: "0.24em",
    textTransform: "uppercase",
})
globalStyle(`${F} ${shell.logoTagline}`, {
    fontSize: 12.5,
    fontWeight: 400,
    letterSpacing: "0.02em",
    color: marketing.color.subtle,
})

// -- Hero: frost from the left and the foot, slate copy over the snow.
globalStyle(`${F} ${hero.fullBleed}`, { minHeight: "clamp(560px, 86svh, 920px)" })
globalStyle(`${F} ${hero.fullBleedScrim}`, {
    background:
        // theme-exempt: a frost wash over the photograph, the same in every theme
        "linear-gradient(90deg, rgba(246, 247, 247, 0.9) 0%, rgba(246, 247, 247, 0.66) 32%, rgba(246, 247, 247, 0) 58%), " +
        "linear-gradient(0deg, rgba(246, 247, 247, 0.72) 0%, rgba(246, 247, 247, 0) 38%)",
    "@media": {
        "(max-width: 720px)": {
            background:
                // theme-exempt: on a phone the copy covers the photograph, so the frost thickens toward the copy
                "linear-gradient(0deg, rgba(246, 247, 247, 0.96) 0%, rgba(246, 247, 247, 0.84) 50%, rgba(246, 247, 247, 0) 92%)",
        },
    },
})
globalStyle(`${F} ${hero.fullBleedImg}`, {
    "@media": { "(max-width: 720px)": { objectPosition: "70% 50%" } },
})
globalStyle(`${F} ${hero.fullBleedInner}`, { paddingBottom: scaledSpace(96) })
globalStyle(`${F} ${hero.fullBleedHeadline}`, {
    color: FROST_INK,
    fontSize: `calc(clamp(44px, 6vw, 86px) * ${marketing.display.scale})`,
    fontWeight: 300,
    lineHeight: 1.02,
    letterSpacing: "-0.03em",
    whiteSpace: "pre-line",
    maxWidth: "9em",
})
globalStyle(`${F} ${hero.fullBleedSubheadline}`, {
    color: FROST_SUBTLE,
    fontSize: 19,
    fontWeight: 400,
    lineHeight: 1.55,
    maxWidth: "26em",
})
globalStyle(`${F} ${hero.fullBleedBadge}, ${F} ${hero.fullBleedCredit}`, {
    ...trackedCaps,
    fontSize: 11.5,
    color: FROST_SUBTLE,
})
globalStyle(`${F} ${hero.fullBleedSecondary}`, {
    color: FROST_INK,
    borderColor: "rgba(30, 42, 51, 0.4)", // theme-exempt: slate over the frosted photograph
})
globalStyle(`${F} ${hero.fullBleedSecondary}:hover`, { borderColor: FROST_INK })
globalStyle(`${F} ${hero.fullBleed} ${hero.primary}`, {
    background: FROST_INK,
    color: "#ffffff", // theme-exempt: white on the slate ask over the frosted photograph
    borderColor: FROST_INK,
})

globalStyle(`${F} ${hero.statement} ${hero.headline}`, {
    fontSize: `calc(clamp(40px, 5.2vw, 70px) * ${marketing.display.scale})`,
    fontWeight: 300,
    letterSpacing: "-0.03em",
    lineHeight: 1.04,
})

// -- Sections: tracked caps over a light title.
globalStyle(`${F} ${section}`, { paddingTop: scaledSpace(104) })
globalStyle(`${F} ${sectionKicker}`, { ...trackedCaps, color: slate, marginBottom: scaledSpace(14) })
globalStyle(`${F} ${sectionTitle}`, {
    fontFamily: marketing.font.display,
    fontSize: `calc(clamp(30px, 3.4vw, 46px) * ${marketing.display.scale})`,
    fontWeight: 300,
    lineHeight: 1.12,
    letterSpacing: "-0.025em",
    maxWidth: "22em",
    marginInline: "auto",
})

// -- The first ninety days: one quiet track, the last node in peach.
globalStyle(`${F} ${steps.wrapRail}`, { textAlign: "center" })
globalStyle(`${F} ${steps.titleRail}`, {
    fontFamily: marketing.font.display,
    fontSize: `calc(clamp(30px, 3.4vw, 46px) * ${marketing.display.scale})`,
    fontWeight: 300,
    letterSpacing: "-0.025em",
    lineHeight: 1.12,
    textTransform: "none",
    marginBottom: scaledSpace(56),
})
globalStyle(`${F} ${steps.rail}`, {
    gap: scaledSpace(28),
    textAlign: "left",
    "@media": {
        // Phones: the track turns vertical — one step under the next,
        // the line down the left — instead of a sideways scroller.
        "(max-width: 860px)": {
            gridAutoFlow: "row",
            gridAutoColumns: "auto",
            overflowX: "visible",
            scrollSnapType: "none",
            marginRight: 0,
            paddingRight: 0,
            paddingBottom: 0,
            gap: scaledSpace(34),
        },
    },
})
globalStyle(`${F} ${steps.railItem}::before`, {
    top: 6,
    background: `color-mix(in srgb, ${slate} 55%, transparent)`,
    "@media": {
        "(max-width: 860px)": {
            top: 8,
            bottom: `calc(-1 * ${scaledSpace(34)})`,
            left: 6,
            right: "auto",
            width: 1,
            height: "auto",
        },
    },
})
// The last stretch warms toward the peach node.
globalStyle(`${F} ${steps.railItem}:nth-last-child(2)::before`, {
    background: `linear-gradient(90deg, color-mix(in srgb, ${slate} 55%, transparent), ${spot1})`,
    "@media": {
        "(max-width: 860px)": {
            background: `linear-gradient(180deg, color-mix(in srgb, ${slate} 55%, transparent), ${spot1})`,
        },
    },
})
globalStyle(`${F} ${steps.railItem}:last-child::before`, { display: "none" })
globalStyle(`${F} ${steps.railItem}`, {
    "@media": { "(max-width: 860px)": { paddingLeft: 34 } },
})
globalStyle(`${F} ${steps.railMark}`, {
    gap: 16,
    marginBottom: scaledSpace(14),
    "@media": {
        "(max-width: 860px)": {
            flexDirection: "row",
            alignItems: "center",
            marginLeft: -34,
            gap: 21,
            marginBottom: 8,
        },
    },
})
globalStyle(`${F} ${steps.railDot}`, {
    width: 13,
    height: 13,
    border: `1.5px solid ${slate}`,
    background: marketing.color.pageBg,
})
globalStyle(`${F} ${steps.railItem}:last-child ${steps.railDot}`, {
    borderColor: spot1,
    background: spot1,
    boxShadow: `0 0 0 6px color-mix(in srgb, ${spot1} 26%, transparent)`,
})
globalStyle(`${F} ${steps.railLabel}`, {
    fontFamily: marketing.font.body,
    fontSize: 14,
    fontWeight: 600,
    letterSpacing: "0.02em",
    textTransform: "none",
    color: ink,
})
globalStyle(`${F} ${steps.railTitle}`, {
    fontFamily: marketing.font.display,
    fontSize: 20,
    fontWeight: 400,
    letterSpacing: "-0.01em",
    lineHeight: 1.3,
})
globalStyle(`${F} ${steps.rail} ${steps.stepDescription}`, { fontSize: 15.5, lineHeight: 1.6 })

// -- Visits: one white card, prices light.
globalStyle(`${F} ${prices.board}`, {
    background: marketing.color.surface,
    border: hair,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
})
globalStyle(`${F} ${prices.head}`, { background: "transparent", color: ink, paddingTop: scaledSpace(48) })
globalStyle(`${F} ${prices.kicker}`, { ...trackedCaps, color: slate })
globalStyle(`${F} ${prices.title}`, {
    fontFamily: marketing.font.display,
    color: ink,
    fontWeight: 300,
    fontSize: `clamp(28px, 3.2vw, 40px)`,
    letterSpacing: "-0.025em",
    lineHeight: 1.12,
})
globalStyle(`${F} ${prices.intro}`, { color: marketing.color.subtle, fontWeight: 400, maxWidth: "36em" })
globalStyle(`${F} ${prices.groups}`, { columnGap: scaledSpace(60) })
globalStyle(`${F} ${prices.groupHeading}`, {
    ...trackedCaps,
    fontSize: 11.5,
    color: marketing.color.subtle,
    borderBottom: hair,
    paddingBottom: 10,
})
globalStyle(`${F} ${prices.groupHeading}::before`, { display: "none" })
globalStyle(`${F} ${prices.line}`, { borderBottom: hair })
globalStyle(`${F} ${prices.name}`, { fontSize: 16.5, fontWeight: 500 })
globalStyle(`${F} ${prices.note}`, { fontWeight: 400, fontSize: 14 })
globalStyle(`${F} ${prices.leader}`, { opacity: 0 })
globalStyle(`${F} ${prices.price}`, {
    fontFamily: marketing.font.display,
    fontSize: 21,
    fontWeight: 300,
    color: ink,
})
globalStyle(`${F} ${prices.qualifier}`, {
    fontStyle: "normal",
    fontSize: 13,
    fontWeight: 400,
    letterSpacing: 0,
    textTransform: "none",
    color: marketing.color.subtle,
})
globalStyle(`${F} ${prices.foot}`, {
    background: "transparent",
    color: marketing.color.subtle,
    borderTop: hair,
})
globalStyle(`${F} ${prices.footnote}`, { fontSize: 15, fontWeight: 400 })

// -- Paying for care: plain lines between slate points — no insurer marks.
globalStyle(`${F} ${logos.strip}`, { columnGap: scaledSpace(30), rowGap: 12 })
globalStyle(`${F} ${logos.wordmark}`, {
    display: "inline-flex",
    alignItems: "center",
    gap: 12,
    fontFamily: marketing.font.body,
    fontSize: 16,
    fontWeight: 400,
    letterSpacing: 0,
    textTransform: "none",
    color: ink,
    opacity: 1,
})
globalStyle(`${F} ${logos.wordmark}::before`, {
    ...point,
    width: 5,
    height: 5,
    flex: "0 0 5px",
    background: slate,
})

// -- What we treat: the conditions as one run of words between peach points
// (the photograph-right split only; the visit panel keeps its listed hours).
const run = `${F} ${split.wrap}:not(${split.wrapMediaLeft}) ${split.bullets}`
globalStyle(run, {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 20,
    rowGap: 10,
    marginTop: scaledSpace(26),
})
globalStyle(`${run} ${split.bullet}`, { alignItems: "center", gap: 20, fontSize: 17, fontWeight: 400 })
// The point trails each word, so a wrapped run never opens a line on one.
globalStyle(`${run} ${split.bullet}:not(:last-child)::after`, point)
globalStyle(`${run} ${split.bulletMark}`, { display: "none" })
globalStyle(`${F} ${split.headline}`, { fontWeight: 300, letterSpacing: "-0.025em", lineHeight: 1.14 })
globalStyle(`${F} ${split.mediaImg}`, {
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
})

// -- Clinicians: soft corners, names light.
globalStyle(`${F} ${team.portraitImg}`, {
    borderRadius: marketing.shape.radiusCard,
    border: "none",
    boxShadow: marketing.shape.shadowCard,
    marginBottom: 18,
})
globalStyle(`${F} ${team.portraitName}`, {
    fontFamily: marketing.font.display,
    fontSize: 22,
    fontWeight: 400,
    letterSpacing: "-0.01em",
})
globalStyle(`${F} ${team.portraitRole}`, { ...trackedCaps, fontSize: 11, color: marketing.color.subtle })

// -- From patients: white cards, the quote light.
globalStyle(`${F} ${quotes.card}`, {
    background: marketing.color.surface,
    border: hair,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: "none",
    textAlign: "left",
})
globalStyle(`${F} ${quotes.quote}`, {
    fontFamily: marketing.font.display,
    fontStyle: "normal",
    fontSize: 19,
    fontWeight: 300,
    lineHeight: 1.5,
})
globalStyle(`${F} ${quotes.author}`, { ...trackedCaps, fontSize: 11.5, color: slate })

globalStyle(`${F} ${faq.item}`, {
    background: "transparent",
    border: "none",
    borderBottom: hair,
    borderRadius: 0,
    boxShadow: "none",
})
globalStyle(`${F} ${faq.question}`, { fontSize: 17, fontWeight: 500 })

// -- The closing line: between hairlines, the slate ask.
globalStyle(`${F} ${banner.card}`, {
    background: "transparent",
    color: ink,
    border: "none",
    borderTop: hair,
    borderRadius: 0,
    boxShadow: "none",
    textAlign: "center",
    paddingBlock: scaledSpace(56),
})
globalStyle(`${F} ${banner.title}`, {
    color: ink,
    fontWeight: 300,
    fontSize: `clamp(26px, 3vw, 38px)`,
    letterSpacing: "-0.025em",
    lineHeight: 1.18,
    maxWidth: "20em",
    marginInline: "auto",
})
globalStyle(`${F} ${banner.card} ${banner.cta}`, { background: slate, boxShadow: "none" })

globalStyle(`${F} ${shell.footer}`, { borderTop: hair, marginTop: scaledSpace(96) })
