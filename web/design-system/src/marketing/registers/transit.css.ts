import { globalStyle } from "@vanilla-extract/css"
import { marketing } from "../theme/marketingTheme.css"
import { scaledSpace } from "../theme/feelBridge"
import * as hero from "../MarketingHero.styles.css"
import * as shell from "../MarketingShell.styles.css"
import * as features from "../MarketingFeatureGrid.styles.css"
import * as prices from "../MarketingPriceList.styles.css"
import * as logos from "../MarketingLogos.styles.css"
import * as split from "../MarketingContentSplit.styles.css"
import * as team from "../MarketingTeam.styles.css"
import * as quotes from "../MarketingTestimonials.styles.css"
import * as faq from "../MarketingFaq.styles.css"
import * as banner from "../MarketingCtaBanner.styles.css"
import * as cards from "../MarketingCardGrid.styles.css"
import * as steps from "../MarketingSteps.styles.css"
import {
    ctaPrimary,
    ctaSecondary,
    mediaImage,
    section,
    sectionHeaderCentered,
    sectionKicker,
    sectionTitle,
    spot1,
} from "../shared.css"

/*
 * `transit` (wayfinding): the 1970s transit wayfinding system as a page.
 * The nav is the sign band over the platform; the split hero is a station
 * sign panel in the accent, bleeding edge to edge under a thin white
 * header line, the photograph set flush into it; kickers are route bars
 * led by a signal dot; icons are struck as circular pictograms; lists hang
 * on heavy rule lines; every ask points with an arrow. The signal color
 * is the register's first spot ink.
 */
const T = '[data-marketing-treatment~="transit"]'
const ink = marketing.color.text
const panel = marketing.color.accent
const onPanel = marketing.color.onAccent
const signalInk = marketing.color.inkOnSpot
const rule = (weight: number, color: string = ink) => `${weight}px solid ${color}`

// -- Controls: square sign plates that point.
globalStyle(`${T} ${ctaPrimary}, ${T} ${ctaSecondary}`, {
    fontWeight: 800,
    letterSpacing: "0.03em",
    textTransform: "uppercase",
    borderRadius: 0,
})
globalStyle(`${T} ${ctaPrimary}::after, ${T} ${ctaSecondary}::after`, {
    content: '"\\2192"',
    marginLeft: 12,
    fontWeight: 700,
})

// -- Nav: the sign band.
globalStyle(`${T} ${shell.barFullWidth}`, {
    background: panel,
    borderBottom: rule(6, spot1),
    backdropFilter: "none",
    WebkitBackdropFilter: "none",
})
globalStyle(`${T} ${shell.barFullWidthScrolled}`, { background: panel })
globalStyle(`${T} ${shell.barFullWidth} ${shell.fullWidthInner}`, { padding: "16px 24px" })
globalStyle(`${T} ${shell.barFullWidth} ${shell.logo}`, {
    color: onPanel,
    fontWeight: 800,
    fontSize: 19,
    letterSpacing: "-0.01em",
})
globalStyle(`${T} ${shell.barFullWidth} ${shell.logoTagline}`, {
    color: `color-mix(in srgb, ${onPanel} 72%, transparent)`,
})
globalStyle(`${T} ${shell.barFullWidth} ${shell.link}`, {
    color: onPanel,
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
})
globalStyle(`${T} ${shell.barFullWidth} ${shell.cta}`, {
    background: spot1,
    color: signalInk,
    boxShadow: "none",
})
globalStyle(`${T} ${shell.barFullWidth} ${shell.burger}`, { color: onPanel })

// -- Hero: the station sign panel.
// The sign carries the copy on the left; the photograph fills the right
// half at full hero height, hard-edged, out to the viewport's edge.
const heroGap = scaledSpace(56)
const heroPadTop = scaledSpace(48)
const heroPadBottom = scaledSpace(56)
globalStyle(`${T} ${hero.split}`, {
    color: onPanel,
    background: panel,
    boxShadow: `0 0 0 100vmax ${panel}`,
    clipPath: "inset(0 -100vmax)",
    alignItems: "start",
    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
    // Call-first: the facts and the ask come straight under the headline.
    gridTemplateAreas: '"badge media" "head media" "dir media" "cta media" "sub media" "credit media"',
    gridTemplateRows: "auto auto auto auto auto 1fr",
    columnGap: heroGap,
    rowGap: 0,
    padding: `${heroPadTop} 0 ${heroPadBottom}`,
})
// Inner pages: the statement hero is the same sign panel, type only.
globalStyle(`${T} ${hero.statement}`, {
    position: "relative",
    color: onPanel,
    background: panel,
    boxShadow: `0 0 0 100vmax ${panel}`,
    clipPath: "inset(0 -100vmax)",
    padding: `${scaledSpace(64)} 0 ${scaledSpace(40)}`,
})
globalStyle(`${T} ${hero.statement}::before`, {
    content: '""',
    position: "absolute",
    top: 18,
    left: "calc(50% - 50vw)",
    right: "calc(50% - 50vw)",
    height: 2,
    background: `color-mix(in srgb, ${onPanel} 70%, transparent)`,
})
globalStyle(`${T} ${hero.statement} ${hero.headline}::after`, { marginBottom: scaledSpace(24) })
// Centered heroes (centered-stack, form-first, panel-collage) letter their
// copy in the panel ink too, so they stand on the same sign panel.
globalStyle(`${T} ${hero.centered}`, {
    color: onPanel,
    background: panel,
    boxShadow: `0 0 0 100vmax ${panel}`,
    clipPath: "inset(0 -100vmax)",
    padding: `${scaledSpace(56)} 0 ${scaledSpace(48)}`,
})
globalStyle(`${T} ${hero.centered} ${hero.headline}::after`, { marginLeft: "auto", marginRight: "auto" })
globalStyle(`${T} ${hero.centered} ${hero.subheadline}`, { marginLeft: "auto", marginRight: "auto" })
globalStyle(`${T} ${hero.centered} ${ctaPrimary}`, { background: spot1, color: signalInk })
globalStyle(`${T} ${hero.centered} ${ctaSecondary}`, { color: onPanel, borderColor: onPanel })
globalStyle(`${T} ${hero.centered} ${hero.panelLabel}`, { color: onPanel })
globalStyle(`${T} ${hero.statement} ${ctaPrimary}`, { background: spot1, color: signalInk })
globalStyle(`${T} ${hero.statement} ${ctaSecondary}`, { color: onPanel, borderColor: onPanel })
// The sign panel is the accent, so an accent-colored word would vanish into
// it: the accented word is lettered in the panel ink and underscored with
// the signal stripe instead.
globalStyle(`${T} ${hero.split} ${hero.accentWord}, ${T} ${hero.statement} ${hero.accentWord}`, {
    color: onPanel,
    textDecorationLine: "underline",
    textDecorationColor: spot1,
    textDecorationThickness: "0.12em",
    textUnderlineOffset: "0.12em",
})
globalStyle(`${T} ${hero.split} > ${hero.splitCopy}`, { display: "contents" })
globalStyle(`${T} ${hero.badgeLive}`, { gridArea: "badge", justifySelf: "start" })
globalStyle(`${T} ${hero.headline}`, { gridArea: "head" })
globalStyle(`${T} ${hero.subheadline}`, { gridArea: "sub" })
globalStyle(`${T} ${hero.directory}`, { gridArea: "dir" })
globalStyle(`${T} ${hero.ctaRow}`, { gridArea: "cta" })
globalStyle(`${T} ${hero.splitCredit}`, { gridArea: "credit" })
globalStyle(`${T} ${hero.split} > ${hero.media}`, { gridArea: "media" })
// The sign's thin header line, across the panel up to the photograph.
globalStyle(`${T} ${hero.split}::before`, {
    content: '""',
    position: "absolute",
    top: 18,
    left: "calc(50% - 50vw)",
    right: `calc(50% + ${heroGap} / 2)`,
    height: 2,
    background: `color-mix(in srgb, ${onPanel} 70%, transparent)`,
})
globalStyle(`${T} ${hero.badgeLive}`, {
    color: onPanel,
    background: "transparent",
    border: rule(2, onPanel),
    borderRadius: 0,
    fontWeight: 800,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    fontSize: 13,
})
globalStyle(`${T} ${hero.badgeLiveDot}`, { background: spot1 })
globalStyle(`${T} ${hero.headline}`, {
    color: onPanel,
    fontSize: `calc(clamp(46px, 7.4vw, 90px) * ${marketing.display.scale} / 1.28)`,
    lineHeight: 0.9,
    letterSpacing: "-0.03em",
    margin: `${scaledSpace(22)} 0 0`,
    maxWidth: "none",
})
globalStyle(`${T} ${hero.headline}::after`, {
    content: '""',
    display: "block",
    width: 180,
    height: 16,
    margin: `${scaledSpace(24)} 0 ${scaledSpace(26)}`,
    background: spot1,
})
globalStyle(`${T} ${hero.subheadline}`, {
    color: `color-mix(in srgb, ${onPanel} 88%, transparent)`,
    fontSize: 18,
    lineHeight: 1.5,
    maxWidth: "40ch",
    margin: 0,
})
globalStyle(`${T} ${hero.directory}`, { maxWidth: 560, margin: `0 0 ${scaledSpace(24)}` })
globalStyle(`${T} ${hero.directoryList}`, { borderTop: rule(3, onPanel) })
globalStyle(`${T} ${hero.directoryItem}`, {
    borderBottom: rule(2, `color-mix(in srgb, ${onPanel} 45%, transparent)`),
})
globalStyle(`${T} ${hero.directoryEntry}, ${T} ${hero.directoryLink}`, { padding: "14px 0", gap: 18 })
globalStyle(`${T} ${hero.directoryLink}:hover`, { color: spot1 })
globalStyle(`${T} ${hero.directoryIcon}`, {
    width: 46,
    height: 46,
    color: panel,
    background: onPanel,
})
globalStyle(`${T} ${hero.directoryLabel}`, {
    color: onPanel,
    fontSize: 21,
    fontWeight: 800,
    letterSpacing: "-0.005em",
    textTransform: "uppercase",
})
globalStyle(`${T} ${hero.directoryNote}`, {
    color: `color-mix(in srgb, ${onPanel} 78%, transparent)`,
    fontSize: 15,
})
globalStyle(`${T} ${hero.split} ${ctaPrimary}`, { background: spot1, color: signalInk })
globalStyle(`${T} ${hero.split} ${hero.ctaRow}`, { marginTop: 0, marginBottom: scaledSpace(28) })
globalStyle(`${T} ${hero.split} ${ctaSecondary}`, { color: onPanel, borderColor: onPanel })
globalStyle(`${T} ${hero.splitCredit}`, {
    color: `color-mix(in srgb, ${onPanel} 70%, transparent)`,
    letterSpacing: "0.18em",
    fontWeight: 700,
})
// The photograph: the whole right half, flush to the panel's top and foot
// and out to the viewport's right edge (the column starts half a gap past
// the centered header's midline).
globalStyle(`${T} ${hero.split} > ${hero.media}`, {
    alignSelf: "stretch",
    justifySelf: "start",
    width: `calc(50vw - ${heroGap} / 2)`,
    margin: `calc(${heroPadTop} * -1) 0 calc(${heroPadBottom} * -1)`,
    display: "flex",
})
globalStyle(`${T} ${hero.split} > ${hero.media} img`, {
    flex: 1,
    minHeight: 0,
    height: "100%",
    objectFit: "cover",
    objectPosition: "4% 50%",
    border: "none",
    borderRadius: 0,
})
globalStyle(`${T} ${hero.split}`, {
    "@media": {
        "(max-width: 860px)": {
            gridTemplateColumns: "1fr",
            gridTemplateAreas: '"badge" "head" "media" "sub" "dir" "cta" "credit"',
            gridTemplateRows: "auto",
            padding: `${scaledSpace(40)} 0 ${scaledSpace(40)}`,
        },
    },
})
globalStyle(`${T} ${hero.split} > ${hero.media}`, {
    "@media": {
        "(max-width: 860px)": {
            width: "auto",
            margin: `0 calc(50% - 50vw) ${scaledSpace(28)}`,
            borderTop: rule(8, spot1),
            borderBottom: rule(8, spot1),
        },
    },
})
globalStyle(`${T} ${hero.split}::before`, {
    "@media": { "(max-width: 860px)": { right: "calc(50% - 50vw)" } },
})
globalStyle(`${T} ${hero.split} > ${hero.media} img`, {
    "@media": {
        "(max-width: 860px)": { aspectRatio: "4 / 3", height: "auto", objectPosition: "50% 22%" },
    },
})

// -- Section heads: route bars over heavy rules, left-set like signs.
globalStyle(`${T} ${section}`, {
    borderTop: rule(5),
    marginTop: scaledSpace(72),
    paddingTop: scaledSpace(28),
})
globalStyle(`${T} ${sectionHeaderCentered}`, { textAlign: "left" })
globalStyle(`${T} ${sectionKicker}, ${T} ${prices.kicker}`, {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    color: onPanel,
    background: panel,
    padding: "7px 14px 7px 10px",
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: "0.08em",
    marginBottom: 18,
})
globalStyle(`${T} ${sectionKicker}::before, ${T} ${prices.kicker}::before`, {
    content: '""',
    flex: "none",
    width: 12,
    height: 12,
    borderRadius: "50%",
    background: spot1,
})
globalStyle(`${T} ${sectionTitle}`, {
    fontSize: `clamp(32px, 4.6vw, 58px)`,
    lineHeight: 0.95,
    letterSpacing: "-0.02em",
    maxWidth: "18ch",
})

// -- Pictogram rows (feature-grid icon-list).
globalStyle(`${T} ${features.listGrid}`, { columnGap: scaledSpace(40), rowGap: 0 })
globalStyle(`${T} ${features.listRow}`, {
    borderTop: rule(3),
    padding: `${scaledSpace(22)} 0`,
    textAlign: "left",
    gap: 18,
})
globalStyle(`${T} ${features.listIconTile}`, {
    width: 58,
    height: 58,
    borderRadius: "50%",
    color: onPanel,
    background: panel,
})
globalStyle(`${T} ${features.listIconTile} svg`, { width: 28, height: 28 })
globalStyle(`${T} ${features.featureTitle}`, {
    fontSize: 21,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "-0.005em",
})

// -- The price list: a departures board, prices in the signal color.
globalStyle(`${T} ${prices.board}`, { border: rule(4), borderRadius: 0 })
globalStyle(`${T} ${prices.head}`, { background: panel, color: onPanel, borderBottom: rule(8, spot1) })
globalStyle(`${T} ${prices.head} ${prices.kicker}`, { background: ink })
globalStyle(`${T} ${prices.title}`, { color: onPanel })
globalStyle(`${T} ${prices.groupHeading}`, { color: ink, fontSize: 17, fontWeight: 800 })
globalStyle(`${T} ${prices.groupHeading}::before`, {
    background: spot1,
    borderRadius: "50%",
    width: 14,
    height: 14,
})
globalStyle(`${T} ${prices.line}`, { borderBottom: rule(2, marketing.color.line) })
globalStyle(`${T} ${prices.name}`, { fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.01em" })
globalStyle(`${T} ${prices.leader}`, { borderBottomStyle: "solid", opacity: 0.35 })
globalStyle(`${T} ${prices.price}`, { color: ink })
globalStyle(`${T} ${prices.foot}`, { background: marketing.color.accentSoft, color: ink, borderTop: rule(3) })

// -- The coverage strip: destination tiles.
globalStyle(`${T} ${logos.strip}`, { justifyContent: "flex-start", gap: 10 })
globalStyle(`${T} ${logos.wordmark}`, {
    border: rule(2),
    padding: "10px 16px",
    fontSize: 15,
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: "0.02em",
    opacity: 1,
    color: ink,
})

// -- Story splits: square photographs on a signal rule, bullets as route dots.
globalStyle(`${T} ${split.headline}`, { lineHeight: 0.95, letterSpacing: "-0.02em" })
globalStyle(`${T} ${split.bulletMark}`, {
    display: "inline-grid",
    placeItems: "center",
    width: 24,
    height: 24,
    borderRadius: "50%",
    background: panel,
    color: onPanel,
    fontSize: 13,
})
globalStyle(`${T} ${split.wrap} ${mediaImage}`, { border: "none", borderBottom: rule(10, spot1) })

// -- The team: portraits over name plates.
globalStyle(`${T} ${team.portraitImg}`, {
    aspectRatio: "4 / 5",
    objectFit: "cover",
    borderRadius: 0,
    border: "none",
})
globalStyle(`${T} ${team.portraitName}`, {
    background: panel,
    color: onPanel,
    padding: "12px 14px 4px",
    margin: 0,
    fontWeight: 800,
    textTransform: "uppercase",
})
globalStyle(`${T} ${team.portraitRole}`, {
    display: "block",
    background: panel,
    color: `color-mix(in srgb, ${onPanel} 78%, transparent)`,
    padding: "0 14px 12px",
    borderBottom: rule(6, spot1),
})

// -- Quotes, questions, and service cards on heavy rules.
globalStyle(`${T} ${quotes.card}`, {
    borderRadius: 0,
    border: "none",
    borderTop: rule(5),
    boxShadow: "none",
    background: "transparent",
    padding: `${scaledSpace(18)} 0 0`,
    textAlign: "left",
})
globalStyle(`${T} ${quotes.quote}`, { fontSize: 17, lineHeight: 1.5 })
globalStyle(`${T} ${quotes.author}`, { fontWeight: 800, textTransform: "uppercase" })
globalStyle(`${T} ${faq.list}`, { margin: 0, maxWidth: 900, gap: 0 })
globalStyle(`${T} ${faq.item}`, {
    borderRadius: 0,
    border: "none",
    borderTop: rule(3),
    boxShadow: "none",
    background: "transparent",
    padding: "4px 0",
})
globalStyle(`${T} ${faq.question}`, { fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.005em" })
globalStyle(`${T} ${cards.card}`, { borderRadius: 0, border: "none", borderTop: rule(5), boxShadow: "none" })
globalStyle(`${T} ${cards.cardTitle}`, { textTransform: "uppercase", fontWeight: 800 })
globalStyle(`${T} ${steps.timelineDot}`, { background: spot1, border: rule(3) })
globalStyle(`${T} ${steps.number}`, {
    display: "inline-grid",
    placeItems: "center",
    width: 44,
    height: 44,
    borderRadius: "50%",
    background: panel,
    color: onPanel,
})

// -- The closing ask: the platform sign.
globalStyle(`${T} ${banner.card}`, {
    background: panel,
    color: onPanel,
    border: "none",
    borderRadius: 0,
    borderTop: rule(10, spot1),
    boxShadow: "none",
    textAlign: "left",
})
globalStyle(`${T} ${banner.title}`, {
    color: onPanel,
    fontSize: `clamp(34px, 5vw, 64px)`,
    lineHeight: 0.95,
    letterSpacing: "-0.02em",
})
globalStyle(`${T} ${banner.card} ${ctaPrimary}`, { background: spot1, color: signalInk })

// -- The footer: the sign band again.
globalStyle(`${T} ${shell.footer}`, { borderTop: rule(6, panel) })
