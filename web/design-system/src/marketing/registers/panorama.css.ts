import { globalStyle } from "@vanilla-extract/css"
import * as banner from "../MarketingCtaBanner.styles.css"
import * as split from "../MarketingContentSplit.styles.css"
import * as hero from "../MarketingHero.styles.css"
import * as showcase from "../MarketingShowcase.styles.css"
import * as proof from "../MarketingSocialProof.styles.css"
import { sectionKicker } from "../shared.css"
import { scaledSpace } from "../theme/feelBridge"
import { marketing } from "../theme/marketingTheme.css"

/*
 * `panorama` (horizon): the coastal masthead. The masthead-overlay name is
 * lifted off the photograph and set wide in the page's ink above a ruled
 * line of places, the photograph running under it as a panorama; kickers
 * hang on long rules; the residences rail is a run of plain frames with
 * caps captions; metrics are light numerals between rules; the asks are
 * small caps links, and the closing ask is one ruled line with an arrow.
 */
const ROOT = '[data-marketing-treatment~="panorama"]'
const within = (target: string): string => `${ROOT} ${target}`

const CAPS = {
    fontFamily: marketing.font.display,
    fontSize: 12.5,
    fontWeight: 400,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
} as const

const RULE = `1px solid ${marketing.color.line}`

const capsLink = {
    ...CAPS,
    background: "none",
    border: 0,
    borderRadius: 0,
    boxShadow: "none",
    padding: 0,
    minHeight: 0,
    color: marketing.color.text,
    textDecoration: "none",
} as const

// Hero: the copy on the page ground over the photograph, not on it.
globalStyle(within(hero.fullBleed), {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
    gridTemplateRows: "auto auto",
    alignItems: "stretch",
    minHeight: 0,
    background: marketing.color.pageBg,
})

globalStyle(within(hero.fullBleedSlide), {
    position: "relative",
    inset: "auto",
    gridArea: "2 / 1",
    aspectRatio: "2.25 / 1",
    "@media": {
        "(max-width: 760px)": { aspectRatio: "4 / 3" },
    },
})

globalStyle(within(hero.fullBleedScrim), {
    display: "none",
})

globalStyle(within(hero.fullBleedInner), {
    gridArea: "1 / 1",
    padding: `${scaledSpace(28)} 24px ${scaledSpace(28)}`,
})

// Either full-bleed reading's copy now sits on the page ground, so it
// takes the page's ink instead of the white it wears over a photograph.
globalStyle(within(`${hero.fullBleed} ${hero.fullBleedHeadline}`), {
    color: marketing.color.text,
    textAlign: "center",
    marginInline: "auto",
})

globalStyle(within(`${hero.fullBleed} ${hero.fullBleedBadge}`), {
    ...CAPS,
    display: "block",
    textAlign: "center",
    color: marketing.color.subtle,
})

globalStyle(within(`${hero.fullBleed} ${hero.fullBleedCaption}`), {
    color: marketing.color.subtle,
})

globalStyle(within(hero.mastheadHeadline), {
    color: marketing.color.text,
    fontSize: `calc(clamp(40px, 10.5vw, 150px) * ${marketing.display.scale})`,
    fontWeight: 300,
    letterSpacing: "0.26em",
    // The tracking trails the last letter; pull it back so the name centers.
    marginRight: "-0.26em",
    textAlign: "center",
    lineHeight: 1,
})

globalStyle(within(hero.mastheadKicker), {
    ...CAPS,
    color: marketing.color.subtle,
})

globalStyle(within(hero.fullBleedCredit), {
    ...CAPS,
    color: marketing.color.text,
    borderTop: RULE,
    margin: `${scaledSpace(22)} 0 0`,
    paddingTop: scaledSpace(16),
    textAlign: "center",
})

globalStyle(within(`${hero.fullBleed} ${hero.subheadline}`), {
    color: marketing.color.subtle,
    textAlign: "center",
    marginInline: "auto",
})

globalStyle(within(`${hero.fullBleed} ${hero.ctaRow}`), {
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    gap: scaledSpace(28),
    marginTop: scaledSpace(18),
})

globalStyle(within(`${hero.fullBleed} ${hero.primary}, ${ROOT} ${hero.fullBleedSecondary}`), capsLink)

// Kickers hang on a long rule.
globalStyle(within(sectionKicker), {
    ...CAPS,
    display: "flex",
    alignItems: "center",
    gap: scaledSpace(18),
    width: "100%",
    color: marketing.color.text,
    background: "none",
    padding: 0,
})

globalStyle(within(`${sectionKicker}::after`), {
    content: '""',
    flex: "1 1 auto",
    borderTop: RULE,
})

// Residences: plain frames, caps captions, the meta under the name.
globalStyle(within(showcase.rail), {
    gap: scaledSpace(14),
})

globalStyle(within(showcase.railCell), {
    flex: "0 0 min(300px, 72%)",
})

globalStyle(within(`${showcase.rail} ${showcase.collectionCover}`), {
    aspectRatio: "1 / 0.92",
})

globalStyle(within(`${showcase.rail} ${showcase.titleRow}`), {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 4,
})

globalStyle(within(`${showcase.rail} ${showcase.collectionTitle}`), {
    ...CAPS,
    fontSize: 13,
})

globalStyle(within(`${showcase.rail} ${showcase.meta}`), {
    fontFamily: marketing.font.body,
    fontSize: 12.5,
    fontWeight: 400,
    letterSpacing: "0.04em",
    color: marketing.color.subtle,
})

globalStyle(within(`${showcase.rail} ${showcase.itemDescription}`), {
    fontSize: 13.5,
})

// Metrics: light numerals between rules.
globalStyle(within(proof.metricsRow), {
    borderTop: RULE,
    borderBottom: RULE,
    paddingBlock: scaledSpace(30),
})

globalStyle(within(proof.metricValue), {
    fontFamily: marketing.font.display,
    fontSize: "clamp(44px, 5vw, 68px)",
    fontWeight: 200,
    letterSpacing: "0.02em",
    color: marketing.color.text,
})

globalStyle(within(proof.metricLabel), {
    ...CAPS,
    fontSize: 11.5,
    color: marketing.color.text,
})

globalStyle(within(`${proof.metricsRow} ~ ${proof.label}, ${ROOT} ${proof.label}`), {
    ...CAPS,
    fontSize: 11,
    color: marketing.color.subtle,
})

// The design story: caps headline, the link as a caps line.
globalStyle(within(split.headline), {
    fontSize: "clamp(24px, 2.8vw, 36px)",
    fontWeight: 300,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    lineHeight: 1.25,
})

globalStyle(within(`${split.ctaRow} ${split.cta}`), capsLink)

// The closing ask: one ruled line, the title left, the link right.
globalStyle(within(banner.card), {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: `${scaledSpace(10)} ${scaledSpace(28)}`,
    textAlign: "left",
    background: "none",
    border: 0,
    borderTop: RULE,
    borderBottom: RULE,
    borderRadius: 0,
    boxShadow: "none",
    color: marketing.color.text,
    padding: `${scaledSpace(24)} 4px`,
})

globalStyle(within(banner.title), {
    ...CAPS,
    fontSize: "clamp(16px, 1.6vw, 20px)",
    color: marketing.color.text,
    margin: 0,
})

globalStyle(within(banner.body), {
    flex: "1 1 240px",
    fontSize: 14,
    color: marketing.color.subtle,
    margin: 0,
})

globalStyle(within(`${banner.card} ${banner.cta}`), capsLink)

globalStyle(within(`${banner.card} ${banner.cta}::after`), {
    content: '"→"',
    marginLeft: "0.8em",
    letterSpacing: 0,
})
