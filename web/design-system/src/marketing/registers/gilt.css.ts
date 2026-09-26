import { globalStyle } from "@vanilla-extract/css"
import { marketing } from "../theme/marketingTheme.css"
import { scaledSpace } from "../theme/feelBridge"
import * as hero from "../MarketingHero.styles.css"
import * as shell from "../MarketingShell.styles.css"
import * as features from "../MarketingFeatureGrid.styles.css"
import * as steps from "../MarketingSteps.styles.css"
import * as prices from "../MarketingPriceList.styles.css"
import * as logos from "../MarketingLogos.styles.css"
import * as split from "../MarketingContentSplit.styles.css"
import * as team from "../MarketingTeam.styles.css"
import * as quotes from "../MarketingTestimonials.styles.css"
import * as faq from "../MarketingFaq.styles.css"
import * as banner from "../MarketingCtaBanner.styles.css"
import * as cards from "../MarketingCardGrid.styles.css"
import { ctaPrimary, ctaSecondary, section, sectionKicker, sectionTitle, spot1 } from "../shared.css"

/*
 * `gilt` (parlor): the page as a Southern parlor in daylight. Kickers are
 * engraved in tracked caps between two gilt rules, each ending in a small
 * lozenge; the full-bleed hero is graded warm from the lower left, its
 * last line in the display italic, the asks a blush plate over the
 * photograph; the photographic timeline becomes a year hung on one gilt
 * line — the step's mark in small caps over its title, the photograph
 * framed with an inset mat; portraits stand in arched frames; the price
 * list is an engraved card with a gilt inner rule; the preset's ornament
 * (a magnolia sprig in line) is set above the footer's imprint.
 */
const G = '[data-marketing-treatment~="gilt"]'
const ink = marketing.color.text
const hair = `1px solid ${marketing.color.line}`
const gilt = `color-mix(in srgb, ${spot1} 70%, transparent)`

// One rule ending in a lozenge, drawn as a mask so it inks in the theme's gilt.
const RULE = `url("data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="72" height="10" viewBox="0 0 72 10"><path d="M0 5H60" stroke="#000" stroke-width="1"/><path d="M66 1.4 69.6 5 66 8.6 62.4 5Z"/></svg>', // theme-exempt: mask alpha only, the gilt comes from the background
)}")`
// The pair: rule, lozenge, rule — the statement heroes' ornament.
const RULE_PAIR = `url("data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="152" height="10" viewBox="0 0 152 10"><path d="M0 5H66M86 5H152" stroke="#000" stroke-width="1"/><path d="M76 1 80 5 76 9 72 5Z"/><circle cx="66" cy="5" r="1.2"/><circle cx="86" cy="5" r="1.2"/></svg>', // theme-exempt: mask alpha only, the gilt comes from the background
)}")`

const smallCaps = {
    fontFamily: marketing.font.body,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.26em",
    textTransform: "uppercase",
} as const

const ruleMask = (mirror: boolean) =>
    ({
        content: '""',
        flex: "0 0 72px",
        width: 72,
        height: 10,
        background: gilt,
        maskImage: RULE,
        WebkitMaskImage: RULE,
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "right center",
        WebkitMaskPosition: "right center",
        transform: mirror ? "scaleX(-1)" : "none",
        "@media": { "(max-width: 640px)": { flexBasis: 32, width: 32 } },
    }) as const

// -- Asks: engraved plates, never pills.
globalStyle(`${G} ${ctaPrimary}, ${G} ${ctaSecondary}`, {
    fontFamily: marketing.font.body,
    fontSize: 14.5,
    fontWeight: 600,
    letterSpacing: "0.04em",
    borderRadius: 2,
    padding: "14px 26px",
})

// -- Nav: the engraved calling card.
globalStyle(`${G} ${shell.logo}`, {
    fontFamily: marketing.font.display,
    fontSize: 23,
    fontWeight: 400,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    "@media": { "(max-width: 640px)": { fontSize: 15, letterSpacing: "0.08em" } },
})
globalStyle(`${G} ${shell.logoTagline}`, {
    fontFamily: marketing.font.body,
    fontSize: 10.5,
    fontWeight: 600,
    letterSpacing: "0.3em",
    color: marketing.color.subtle,
})
globalStyle(`${G} ${shell.link}`, {
    fontFamily: marketing.font.body,
    fontSize: 14.5,
    fontWeight: 500,
    letterSpacing: "0.03em",
})

// -- Hero: the photograph, graded warm; copy low left.
globalStyle(`${G} ${hero.fullBleed}`, { minHeight: "clamp(560px, 88svh, 980px)" })
globalStyle(`${G} ${hero.fullBleedScrim}`, {
    background:
        // theme-exempt: a walnut grade over the photograph, the same in every theme
        "linear-gradient(90deg, rgba(36, 21, 12, 0.66) 0%, rgba(36, 21, 12, 0.32) 40%, rgba(36, 21, 12, 0) 66%), " +
        "linear-gradient(0deg, rgba(36, 21, 12, 0.5) 0%, rgba(36, 21, 12, 0) 46%)",
    "@media": {
        "(max-width: 720px)": {
            background:
                // theme-exempt: on a phone the copy covers the photograph, so the grade deepens top to bottom
                "linear-gradient(0deg, rgba(36, 21, 12, 0.82) 0%, rgba(36, 21, 12, 0.62) 58%, rgba(36, 21, 12, 0.34) 100%)",
        },
    },
})
globalStyle(`${G} ${hero.fullBleedInner}`, { paddingBottom: scaledSpace(92) })
globalStyle(`${G} ${hero.fullBleedHeadline}`, {
    fontSize: `calc(clamp(44px, 6.4vw, 92px) * ${marketing.display.scale})`,
    lineHeight: 1.02,
    letterSpacing: "-0.012em",
    maxWidth: "12em",
})
globalStyle(`${G} ${hero.fullBleed} ${hero.accentWord}`, {
    color: "#f4ddd4", // theme-exempt: the blush italic over a photographic scrim, the same in every theme
})
globalStyle(`${G} ${hero.fullBleedCredit}`, {
    ...smallCaps,
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.86)", // theme-exempt: copy over a photographic scrim is white in every theme
})
globalStyle(`${G} ${hero.fullBleedCredit}::before`, {
    content: '""',
    display: "block",
    width: 72,
    height: 10,
    marginBottom: 16,
    background: spot1,
    maskImage: RULE,
    WebkitMaskImage: RULE,
})
globalStyle(`${G} ${hero.fullBleedSubheadline}`, { fontSize: 18.5, lineHeight: 1.6, maxWidth: "32em" })
globalStyle(`${G} ${hero.fullBleedBadge}`, { ...smallCaps, fontSize: 11.5 })
globalStyle(`${G} ${hero.fullBleed} ${hero.primary}`, {
    background: marketing.color.pageBg,
    color: ink,
    boxShadow: "none",
})

// Inner pages: the title centered under a gilt ornament.
globalStyle(`${G} ${hero.statement}`, { textAlign: "center", paddingBottom: scaledSpace(40) })
globalStyle(`${G} ${hero.statement} ${hero.headline}`, {
    marginInline: "auto",
    fontSize: `calc(clamp(40px, 5.6vw, 72px) * ${marketing.display.scale})`,
    lineHeight: 1.06,
})
globalStyle(`${G} ${hero.statement} ${hero.headline}::before`, {
    content: '""',
    display: "block",
    width: 152,
    height: 10,
    margin: `0 auto ${scaledSpace(30)}`,
    background: gilt,
    maskImage: RULE_PAIR,
    WebkitMaskImage: RULE_PAIR,
})
globalStyle(`${G} ${hero.statement} ${hero.subheadline}`, { marginInline: "auto", fontSize: 18.5 })

// -- Sections: engraved kickers, a transitional title, room to breathe.
globalStyle(`${G} ${section}`, { paddingTop: scaledSpace(96) })
globalStyle(`${G} ${sectionKicker}`, {
    ...smallCaps,
    display: "inline-flex",
    alignItems: "center",
    gap: 16,
    color: marketing.color.accent,
    marginBottom: scaledSpace(18),
})
globalStyle(`${G} ${sectionKicker}::before`, ruleMask(false))
globalStyle(`${G} ${sectionKicker}::after`, ruleMask(true))
globalStyle(`${G} ${split.wrap} ${split.kicker}::before`, { display: "none" })
globalStyle(`${G} ${sectionTitle}`, {
    fontSize: `calc(clamp(32px, 3.8vw, 50px) * ${marketing.display.scale})`,
    fontWeight: 400,
    lineHeight: 1.12,
    letterSpacing: "-0.01em",
    margin: `0 0 ${scaledSpace(52)}`,
})

// -- Promises: three engraved cards, icons in a gilt ring.
globalStyle(`${G} ${features.listGrid}`, {
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: scaledSpace(20),
})
globalStyle(`${G} ${features.listRow}`, {
    gap: 18,
    padding: `${scaledSpace(28)} ${scaledSpace(26)}`,
    background: marketing.color.surface,
    border: hair,
    borderRadius: 2,
})
globalStyle(`${G} ${features.listIconTile}`, {
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "transparent",
    border: `1px solid ${gilt}`,
    color: marketing.color.accent,
})
globalStyle(`${G} ${features.featureTitle}`, { fontSize: 22, fontWeight: 400, margin: "4px 0 8px" })
globalStyle(`${G} ${features.featureDescription}, ${G} ${cards.cardBody}`, {
    fontSize: 15.5,
    lineHeight: 1.65,
})
globalStyle(`${G} ${cards.card}`, { borderRadius: 2, boxShadow: "none" })
globalStyle(`${G} ${cards.cardTitle}`, { fontSize: 22, fontWeight: 400 })

// -- The year: framed photographs hung on one gilt line. The mark column
// holds only the node; the mark's label sits over the title as small caps.
globalStyle(`${G} ${steps.timelinePhoto}`, { maxWidth: 1040 })
globalStyle(`${G} ${steps.timelinePhotoItem}`, {
    gridTemplateColumns: "40px minmax(0, 1.2fr) minmax(0, 1fr)",
    gridTemplateRows: "auto 1fr",
    gridTemplateAreas: '"node label media" "node copy media"',
    columnGap: scaledSpace(36),
    paddingBottom: scaledSpace(60),
})
globalStyle(`${G} ${steps.timelinePhotoItem}:not([data-pictured="true"])`, {
    gridTemplateAreas: '"node label label" "node copy copy"',
})
globalStyle(`${G} ${steps.timelinePhotoItem}:not(:last-child)::before`, {
    left: 19.5,
    top: 26,
    bottom: -4,
    width: 1,
    background: gilt,
})
globalStyle(`${G} ${steps.timelineMark}`, { display: "contents" })
globalStyle(`${G} ${steps.timelineNode}`, {
    gridArea: "node",
    justifySelf: "center",
    alignSelf: "start",
    width: 13,
    height: 13,
    marginTop: 6,
    marginRight: 0,
    border: `1px solid ${marketing.color.accent}`,
    background: `radial-gradient(circle, ${marketing.color.accent} 0 2.5px, ${marketing.color.pageBg} 3px)`,
    boxShadow: `0 0 0 6px ${marketing.color.pageBg}`,
})
globalStyle(`${G} ${steps.timelineLabel}`, {
    gridArea: "label",
    alignSelf: "end",
    ...smallCaps,
    fontSize: 12,
    lineHeight: 1.4,
    color: marketing.color.accent,
    margin: "4px 0 10px",
})
globalStyle(`${G} ${steps.timelineCopy}`, { paddingTop: 0 })
globalStyle(`${G} ${steps.timelineTitle}`, {
    fontSize: 28,
    fontWeight: 400,
    lineHeight: 1.18,
    margin: "0 0 12px",
})
globalStyle(`${G} ${steps.timelineDescription}`, { fontSize: 16, lineHeight: 1.7, maxWidth: "30em" })
globalStyle(`${G} ${steps.timelineMedia}`, { alignSelf: "start" })
globalStyle(`${G} ${steps.timelineLead}`, {
    position: "relative",
    aspectRatio: "4 / 3",
    borderRadius: 2,
    boxShadow: marketing.shape.shadowCard,
})
globalStyle(`${G} ${steps.timelineLead}::after`, {
    content: '""',
    position: "absolute",
    inset: 10,
    border: "1px solid rgba(255, 255, 255, 0.55)", // theme-exempt: a mat line printed over the photograph itself
    pointerEvents: "none",
})
globalStyle(`${G} ${steps.timelinePhotoItem}`, {
    "@media": {
        "(max-width: 860px)": {
            gridTemplateColumns: "28px minmax(0, 1fr)",
            gridTemplateAreas: '"node label" "node copy" "node media"',
            gridTemplateRows: "auto auto auto",
            columnGap: scaledSpace(16),
            paddingBottom: scaledSpace(44),
        },
    },
})
globalStyle(`${G} ${steps.timelinePhotoItem}:not([data-pictured="true"])`, {
    "@media": { "(max-width: 860px)": { gridTemplateAreas: '"node label" "node copy"' } },
})
globalStyle(`${G} ${steps.timelinePhotoItem}:not(:last-child)::before`, {
    "@media": { "(max-width: 860px)": { left: 13.5 } },
})
globalStyle(`${G} ${steps.card}`, { borderRadius: 2, boxShadow: "none" })
globalStyle(`${G} ${steps.number}`, {
    fontFamily: marketing.font.display,
    fontWeight: 400,
    fontStyle: "italic",
    background: "transparent",
    color: marketing.color.accent,
    border: `1px solid ${gilt}`,
})

// -- The price list: an engraved card with a gilt inner rule.
globalStyle(`${G} ${prices.board}`, {
    border: hair,
    borderRadius: 2,
    boxShadow: `inset 0 0 0 10px ${marketing.color.surface}, inset 0 0 0 11px ${gilt}, ${marketing.shape.shadowCard}`,
})
globalStyle(`${G} ${prices.head}`, {
    background: "transparent",
    color: ink,
    textAlign: "center",
    paddingTop: scaledSpace(48),
})
globalStyle(`${G} ${prices.kicker}`, { ...smallCaps, color: marketing.color.accent })
globalStyle(`${G} ${prices.title}`, {
    fontFamily: marketing.font.display,
    color: ink,
    fontWeight: 400,
    fontSize: `clamp(30px, 3.6vw, 46px)`,
})
globalStyle(`${G} ${prices.intro}`, { color: marketing.color.subtle, marginInline: "auto" })
globalStyle(`${G} ${prices.groups}`, { columnGap: scaledSpace(64) })
globalStyle(`${G} ${prices.groupHeading}`, {
    ...smallCaps,
    color: marketing.color.subtle,
    borderBottom: `1px solid ${gilt}`,
    paddingBottom: 10,
})
globalStyle(`${G} ${prices.groupHeading}::before`, { display: "none" })
globalStyle(`${G} ${prices.line}`, { borderBottom: hair })
globalStyle(`${G} ${prices.name}`, {
    fontFamily: marketing.font.display,
    fontSize: 20,
    fontWeight: 400,
    letterSpacing: 0,
})
globalStyle(`${G} ${prices.note}`, { fontWeight: 400, fontSize: 14 })
globalStyle(`${G} ${prices.leader}`, { opacity: 0.3, color: ink })
globalStyle(`${G} ${prices.price}`, {
    fontFamily: marketing.font.display,
    fontSize: 23,
    fontWeight: 400,
    color: marketing.color.accent,
})
globalStyle(`${G} ${prices.qualifier}`, { fontFamily: marketing.font.display, fontStyle: "italic" })
globalStyle(`${G} ${prices.foot}`, {
    background: "transparent",
    color: marketing.color.subtle,
    borderTop: hair,
    textAlign: "center",
    paddingBottom: scaledSpace(40),
})

globalStyle(`${G} ${logos.wordmark}`, {
    fontFamily: marketing.font.body,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
    opacity: 1,
})

// -- Portraits in arched frames.
globalStyle(`${G} ${team.portraitImg}`, {
    borderRadius: "999px 999px 2px 2px",
    border: "none",
    boxShadow: `0 0 0 1px ${marketing.color.line}, 0 0 0 7px ${marketing.color.pageBg}, 0 0 0 8px ${gilt}`,
    marginBottom: 22,
})
globalStyle(`${G} ${team.portraitName}`, {
    fontFamily: marketing.font.display,
    fontSize: 23,
    fontWeight: 400,
})
globalStyle(`${G} ${team.portraitRole}`, { ...smallCaps, fontSize: 11, color: marketing.color.accent })

// -- Members' words: italic, unboxed, a gilt mark.
globalStyle(`${G} ${quotes.card}`, {
    background: "transparent",
    border: "none",
    borderTop: `1px solid ${gilt}`,
    borderRadius: 0,
    boxShadow: "none",
    paddingInline: 0,
})
globalStyle(`${G} ${quotes.quote}`, {
    fontFamily: marketing.font.display,
    fontStyle: "italic",
    fontSize: 21,
    lineHeight: 1.55,
    color: ink,
})
globalStyle(`${G} ${quotes.author}`, { ...smallCaps, fontSize: 11.5, color: ink })

globalStyle(`${G} ${faq.item}`, {
    background: "transparent",
    border: "none",
    borderBottom: hair,
    borderRadius: 0,
    boxShadow: "none",
})
globalStyle(`${G} ${faq.question}`, { fontFamily: marketing.font.display, fontSize: 21, fontWeight: 400 })

globalStyle(`${G} ${split.mediaImg}`, { borderRadius: 2, boxShadow: marketing.shape.shadowCard })
globalStyle(`${G} ${split.headline}`, { fontWeight: 400, lineHeight: 1.12 })

// -- The closing card: a walnut field, the ornament over its title.
globalStyle(`${G} ${banner.card}`, {
    background: marketing.color.accent,
    color: marketing.color.onAccent,
    borderRadius: 2,
    border: "none",
    boxShadow: `inset 0 0 0 10px ${marketing.color.accent}, inset 0 0 0 11px color-mix(in srgb, ${marketing.color.onAccent} 35%, transparent)`,
    paddingBlock: scaledSpace(64),
})
globalStyle(`${G} ${banner.title}`, {
    color: marketing.color.onAccent,
    fontWeight: 400,
    fontSize: `clamp(30px, 3.8vw, 50px)`,
    lineHeight: 1.12,
})
globalStyle(`${G} ${banner.title}::before`, {
    content: '""',
    display: "block",
    width: 152,
    height: 10,
    margin: `0 auto ${scaledSpace(26)}`,
    background: `color-mix(in srgb, ${marketing.color.onAccent} 60%, transparent)`,
    maskImage: RULE_PAIR,
    WebkitMaskImage: RULE_PAIR,
})
globalStyle(`${G} ${banner.card} ${banner.cta}`, {
    background: marketing.color.onAccent,
    color: marketing.color.accent,
    boxShadow: "none",
})

// -- Footer: the magnolia sprig set above the imprint.
globalStyle(`${G} ${shell.footer}`, { textAlign: "center" })
globalStyle(`${G} ${shell.footer}::before`, {
    content: '""',
    display: "block",
    flexBasis: "100%",
    width: "100%",
    height: 64,
    backgroundImage: "var(--marketing-ornament, none)",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    backgroundSize: "contain",
    opacity: 0.7,
    pointerEvents: "none",
})
