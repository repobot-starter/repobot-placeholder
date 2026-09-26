import { globalStyle } from "@vanilla-extract/css"
import { marketing } from "../theme/marketingTheme.css"
import { scaledSpace } from "../theme/feelBridge"
import * as hero from "../MarketingHero.styles.css"
import * as shell from "../MarketingShell.styles.css"
import * as features from "../MarketingFeatureGrid.styles.css"
import * as showcase from "../MarketingShowcase.styles.css"
import * as steps from "../MarketingSteps.styles.css"
import * as prices from "../MarketingPriceList.styles.css"
import * as logos from "../MarketingLogos.styles.css"
import * as split from "../MarketingContentSplit.styles.css"
import * as team from "../MarketingTeam.styles.css"
import * as quotes from "../MarketingTestimonials.styles.css"
import * as faq from "../MarketingFaq.styles.css"
import * as banner from "../MarketingCtaBanner.styles.css"
import * as cards from "../MarketingCardGrid.styles.css"
import {
    ctaPrimary,
    ctaSecondary,
    section,
    sectionHeaderCentered,
    sectionKicker,
    sectionTitle,
    spot1,
    spot2,
} from "../shared.css"

/*
 * `fieldbook` (trailhead): the page as a trail journal kept in daylight.
 * Headers are set left, each kicker led by a pencil trail line that ends
 * in a marker; the full-bleed hero is graded pine from the left; the
 * promises are cards with inked icon discs (sage, aspen gold, granite);
 * the `stories` showcase turns into field notes — one row per note, the
 * photograph, a pencil trail map (the preset's ornament, a strip of four
 * maps, one cell per note), then the essay under its byline; portraits
 * sit in soft corners, quotes unslanted (the text face has no italic), and
 * a topographic contour runs over the footer.
 */
const G = '[data-marketing-treatment~="fieldbook"]'
const ink = marketing.color.text
const hair = `1px solid ${marketing.color.line}`
const graphite = `color-mix(in srgb, ${ink} 52%, ${marketing.color.pageBg})`

// A pencil trail — dotted, wandering — ending in a trail marker.
const TRAIL = `url("data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="46" height="14" viewBox="0 0 46 14"><path d="M1 10 C 7 3 13 3 19 8 S 30 13 36 7" fill="none" stroke="#000" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="0.1 4.2"/><circle cx="41" cy="6" r="3.2"/></svg>', // theme-exempt: mask alpha only, the ink comes from the background
)}")`
// Three contour lines, a strip of topographic map.
const CONTOURS = `url("data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="90" viewBox="0 0 1200 90" preserveAspectRatio="none"><g fill="none" stroke="#000" stroke-width="1"><path d="M0 62 C 120 40 220 70 340 52 S 560 18 700 40 S 940 76 1060 50 S 1170 36 1200 42"/><path d="M0 74 C 140 56 240 84 360 68 S 580 34 720 56 S 950 88 1070 66 S 1170 54 1200 58"/><path d="M0 86 C 150 72 260 96 380 84 S 600 52 740 72 S 960 98 1080 82 S 1170 72 1200 74"/></g></svg>', // theme-exempt: mask alpha only, the ink comes from the background
)}")`

const smallCaps = {
    fontFamily: marketing.font.body,
    fontSize: 12.5,
    fontWeight: 600,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
} as const

const trailMark = {
    content: '""',
    flex: "0 0 46px",
    width: 46,
    height: 14,
    background: "currentColor",
    maskImage: TRAIL,
    WebkitMaskImage: TRAIL,
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
} as const

// -- Asks: soft pills in pine.
globalStyle(`${G} ${ctaPrimary}, ${G} ${ctaSecondary}`, {
    fontFamily: marketing.font.body,
    fontSize: 15,
    fontWeight: 600,
    letterSpacing: "0.005em",
    borderRadius: 999,
    padding: "13px 24px",
})

// -- Nav: the name like a journal's title page.
globalStyle(`${G} ${shell.logo}`, {
    fontFamily: marketing.font.display,
    fontSize: 22,
    fontWeight: 400,
    letterSpacing: "-0.01em",
})
globalStyle(`${G} ${shell.logoTagline}`, {
    fontFamily: marketing.font.body,
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.14em",
})
globalStyle(`${G} ${shell.link}`, { fontFamily: marketing.font.body, fontSize: 15, fontWeight: 500 })

// -- Hero: the trail at golden hour, graded pine from the left.
globalStyle(`${G} ${hero.fullBleed}`, { minHeight: "clamp(560px, 86svh, 940px)" })
globalStyle(`${G} ${hero.fullBleedScrim}`, {
    background:
        // theme-exempt: a pine grade over the photograph, the same in every theme
        "linear-gradient(90deg, rgba(16, 28, 21, 0.7) 0%, rgba(16, 28, 21, 0.36) 38%, rgba(16, 28, 21, 0) 62%), " +
        "linear-gradient(0deg, rgba(16, 28, 21, 0.45) 0%, rgba(16, 28, 21, 0) 40%)",
    "@media": {
        "(max-width: 720px)": {
            background:
                // theme-exempt: on a phone the copy covers the photograph, so the grade deepens top to bottom
                "linear-gradient(0deg, rgba(16, 28, 21, 0.78) 0%, rgba(16, 28, 21, 0.5) 58%, rgba(16, 28, 21, 0.28) 100%)",
        },
    },
})
globalStyle(`${G} ${hero.fullBleedImg}`, {
    "@media": { "(max-width: 720px)": { objectPosition: "70% 50%" } },
})
globalStyle(`${G} ${hero.fullBleedInner}`, { paddingBottom: scaledSpace(84) })
globalStyle(`${G} ${hero.fullBleedHeadline}`, {
    fontSize: `calc(clamp(42px, 5.6vw, 80px) * ${marketing.display.scale})`,
    lineHeight: 1.05,
    letterSpacing: "-0.018em",
    maxWidth: "11.5em",
    whiteSpace: "pre-line",
})
globalStyle(`${G} ${hero.fullBleedSubheadline}`, { fontSize: 19, lineHeight: 1.6, maxWidth: "30em" })
globalStyle(`${G} ${hero.fullBleedBadge}`, { ...smallCaps, fontSize: 11.5 })
globalStyle(`${G} ${hero.fullBleedCredit}`, {
    ...smallCaps,
    display: "inline-flex",
    alignItems: "center",
    gap: 12,
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.88)", // theme-exempt: copy over a photographic scrim is white in every theme
})
globalStyle(`${G} ${hero.fullBleedCredit}::before`, { ...trailMark, color: spot1 })
globalStyle(`${G} ${hero.fullBleed} ${hero.primary}`, {
    background: `color-mix(in srgb, ${spot2} 50%, ${marketing.color.accent})`,
    color: "#fbf8f1", // theme-exempt: oat type on the sage ask over a photograph, the same in every theme
    boxShadow: "none",
})

// Inner pages: the title set left with the trail mark over it.
globalStyle(`${G} ${hero.statement}`, { textAlign: "left", paddingBottom: scaledSpace(32) })
globalStyle(`${G} ${hero.statement} ${hero.headline}`, {
    marginInline: 0,
    fontSize: `calc(clamp(38px, 5vw, 66px) * ${marketing.display.scale})`,
    lineHeight: 1.08,
})
globalStyle(`${G} ${hero.statement} ${hero.headline}::before`, {
    ...trailMark,
    display: "block",
    marginBottom: scaledSpace(22),
    color: spot1,
})
globalStyle(`${G} ${hero.statement} ${hero.subheadline}`, { marginInline: 0, fontSize: 19 })

// -- Sections: left-set headers, a trail-led kicker, a book-face title.
globalStyle(`${G} ${section}`, { paddingTop: scaledSpace(92) })
globalStyle(`${G} ${sectionHeaderCentered}`, { textAlign: "left" })
globalStyle(`${G} ${sectionKicker}, ${G} ${showcase.storiesKicker}`, {
    ...smallCaps,
    display: "inline-flex",
    alignItems: "center",
    gap: 12,
    fontStyle: "normal",
    color: marketing.color.accent,
    marginBottom: scaledSpace(14),
})
globalStyle(`${G} ${sectionKicker}::before, ${G} ${showcase.storiesKicker}::before`, {
    ...trailMark,
    color: spot1,
})
globalStyle(`${G} ${sectionTitle}, ${G} ${showcase.storiesTitle}`, {
    fontFamily: marketing.font.display,
    fontSize: `calc(clamp(30px, 3.4vw, 46px) * ${marketing.display.scale})`,
    fontWeight: 400,
    lineHeight: 1.12,
    letterSpacing: "-0.014em",
    maxWidth: "18em",
    margin: `0 0 ${scaledSpace(44)}`,
})

// -- Promises: cards with an inked disc for each way to meet.
globalStyle(`${G} ${features.listGrid}`, {
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: scaledSpace(20),
})
globalStyle(`${G} ${features.listRow}`, {
    gap: 18,
    padding: `${scaledSpace(26)} ${scaledSpace(24)}`,
    background: marketing.color.surface,
    border: hair,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
    textAlign: "left",
})
globalStyle(`${G} ${features.listIconTile}`, {
    width: 52,
    height: 52,
    flex: "0 0 52px",
    borderRadius: "50%",
    background: spot2,
    color: "#fbf8f1", // theme-exempt: oat line icons on the inked discs, the same in every theme
})
globalStyle(`${G} ${features.listRow}:nth-child(3n + 2) ${features.listIconTile}`, { background: spot1 })
globalStyle(`${G} ${features.listRow}:nth-child(3n) ${features.listIconTile}`, {
    background: `color-mix(in srgb, ${marketing.color.subtle} 70%, ${marketing.color.pageBg})`,
})
globalStyle(`${G} ${features.featureTitle}, ${G} ${cards.cardTitle}`, {
    fontFamily: marketing.font.display,
    fontSize: 22,
    fontWeight: 400,
    margin: "2px 0 8px",
})
globalStyle(`${G} ${features.featureDescription}, ${G} ${cards.cardBody}`, { fontSize: 16, lineHeight: 1.62 })
globalStyle(`${G} ${cards.card}`, { borderRadius: marketing.shape.radiusCard })

// -- Field notes: the stories showcase as journal rows — photograph, a
// pencil map (the column rule's pseudo-element, repurposed), the essay.
globalStyle(`${G} ${showcase.storiesWrap}`, { textAlign: "left" })
globalStyle(`${G} ${showcase.storiesFlag}`, {
    display: "flex",
    flexDirection: "column-reverse",
    alignItems: "flex-start",
    gap: 0,
    border: "none",
    padding: 0,
    marginBottom: 0,
})
globalStyle(`${G} ${showcase.storiesGrid}`, {
    gridTemplateColumns: "minmax(0, 1fr)",
    rowGap: 0,
    borderTop: hair,
})
globalStyle(`${G} ${showcase.story}`, {
    display: "grid",
    gridColumn: "1 / -1",
    gridTemplateColumns: "minmax(0, 300px) 150px minmax(0, 1fr)",
    gridTemplateAreas: '"photo map head" "photo map text"',
    gridTemplateRows: "auto 1fr",
    columnGap: scaledSpace(40),
    alignItems: "start",
    padding: `${scaledSpace(30)} 0`,
    borderBottom: hair,
    "@media": {
        "(max-width: 900px)": {
            gridTemplateColumns: "84px minmax(0, 1fr)",
            gridTemplateAreas: '"photo photo" "map head" "map text"',
            gridTemplateRows: "auto auto 1fr",
            columnGap: scaledSpace(18),
            paddingBottom: scaledSpace(30),
        },
    },
})
globalStyle(`${G} ${showcase.story}::before, ${G} ${showcase.story}${showcase.storyRowStart}::before`, {
    display: "block",
    position: "static",
    gridArea: "map",
    alignSelf: "center",
    width: 150,
    height: 150,
    border: "none",
    backgroundImage: "var(--marketing-ornament, none)",
    backgroundRepeat: "no-repeat",
    backgroundSize: "400% 100%",
    backgroundPosition: "0% 50%",
    opacity: 0.9,
    "@media": {
        "(max-width: 900px)": { display: "block", width: 84, height: 84, alignSelf: "start", marginTop: 4 },
    },
})
globalStyle(`${G} ${showcase.story}:nth-child(4n + 2)::before`, { backgroundPosition: "33.333% 50%" })
globalStyle(`${G} ${showcase.story}:nth-child(4n + 3)::before`, { backgroundPosition: "66.667% 50%" })
globalStyle(`${G} ${showcase.story}:nth-child(4n)::before`, { backgroundPosition: "100% 50%" })
globalStyle(`${G} ${showcase.storyLeadGrid}, ${G} ${showcase.storyLeadText}`, { display: "contents" })
globalStyle(`${G} ${showcase.storyKicker}`, { display: "none" })
globalStyle(
    `${G} ${showcase.storyHeadline}, ${G} ${showcase.storyHeadlineHalf}, ${G} ${showcase.storyHeadlineLead}`,
    {
        gridArea: "head",
        fontFamily: marketing.font.display,
        fontSize: "clamp(23px, 2.2vw, 28px)",
        fontWeight: 400,
        lineHeight: 1.2,
        letterSpacing: "-0.01em",
        margin: `${scaledSpace(8)} 0 ${scaledSpace(10)}`,
    },
)
globalStyle(`${G} ${showcase.storyPhoto}, ${G} ${showcase.storyPhotoLead}`, {
    gridArea: "photo",
    aspectRatio: "4 / 3",
    margin: 0,
    borderRadius: 8,
    background: marketing.color.surface,
    "@media": { "(max-width: 900px)": { marginBottom: scaledSpace(18) } },
})
globalStyle(`${G} ${showcase.storyBody}, ${G} ${showcase.storyBodyLead}`, {
    gridArea: "text",
    fontSize: 16.5,
    lineHeight: 1.7,
    color: ink,
    maxWidth: "36em",
})
globalStyle(`${G} ${showcase.storyDateline}`, {
    fontWeight: 650,
    textTransform: "none",
    letterSpacing: 0,
    fontSize: "inherit",
    color: marketing.color.accent,
})
globalStyle(`${G} ${showcase.storyJump}`, {
    gridArea: "text",
    alignSelf: "end",
    border: "none",
    textAlign: "left",
    fontFamily: marketing.font.body,
    textTransform: "none",
    letterSpacing: 0,
})

// -- Steps as numbered notes (the blueprint's process), when a page has them.
globalStyle(`${G} ${steps.card}`, {
    borderRadius: marketing.shape.radiusCard,
    boxShadow: "none",
    border: hair,
})
globalStyle(`${G} ${steps.number}`, {
    fontFamily: marketing.font.display,
    fontWeight: 400,
    background: "transparent",
    color: marketing.color.accent,
    border: `1.5px dashed ${graphite}`,
})

// -- Fees: a page from the journal — left-set, ruled lines, prices in the book face.
globalStyle(`${G} ${prices.board}`, {
    background: marketing.color.surface,
    border: hair,
    borderRadius: 14,
    boxShadow: marketing.shape.shadowCard,
})
globalStyle(`${G} ${prices.head}`, {
    background: "transparent",
    color: ink,
    textAlign: "left",
    paddingTop: scaledSpace(44),
})
globalStyle(`${G} ${prices.kicker}`, {
    ...smallCaps,
    display: "inline-flex",
    alignItems: "center",
    gap: 12,
    color: marketing.color.accent,
})
globalStyle(`${G} ${prices.kicker}::before`, { ...trailMark, color: spot1 })
globalStyle(`${G} ${prices.title}`, {
    fontFamily: marketing.font.display,
    color: ink,
    fontWeight: 400,
    fontSize: `clamp(28px, 3.2vw, 40px)`,
    lineHeight: 1.15,
})
globalStyle(`${G} ${prices.intro}`, { color: marketing.color.subtle, marginInline: 0, maxWidth: "40em" })
globalStyle(`${G} ${prices.groups}`, { columnGap: scaledSpace(56) })
globalStyle(`${G} ${prices.groupHeading}`, {
    ...smallCaps,
    fontSize: 12,
    color: marketing.color.subtle,
    borderBottom: `1.5px solid ${ink}`,
    paddingBottom: 10,
})
globalStyle(`${G} ${prices.groupHeading}::before`, { display: "none" })
globalStyle(`${G} ${prices.line}`, { borderBottom: `1px dashed ${marketing.color.line}` })
globalStyle(`${G} ${prices.name}`, { fontFamily: marketing.font.body, fontSize: 17, fontWeight: 600 })
globalStyle(`${G} ${prices.note}`, { fontWeight: 400, fontSize: 14.5 })
globalStyle(`${G} ${prices.leader}`, { opacity: 0 })
globalStyle(`${G} ${prices.price}`, {
    fontFamily: marketing.font.display,
    fontSize: 22,
    fontWeight: 400,
    color: marketing.color.accent,
})
globalStyle(`${G} ${prices.qualifier}`, { fontFamily: marketing.font.body, fontStyle: "normal" })
globalStyle(`${G} ${prices.foot}`, {
    background: "transparent",
    color: marketing.color.subtle,
    borderTop: hair,
    textAlign: "left",
})

// -- Paying for therapy: plain notes in the text face, not badges, set left.
globalStyle(`${G} ${logos.strip}`, { justifyContent: "flex-start", columnGap: scaledSpace(36) })
globalStyle(`${G} ${logos.wordmark}`, {
    fontFamily: marketing.font.body,
    fontSize: 15,
    fontWeight: 500,
    letterSpacing: 0,
    textTransform: "none",
    color: marketing.color.subtle,
    opacity: 1,
})

// -- Portraits: soft corners, the name in the book face.
globalStyle(`${G} ${team.portraitImg}`, {
    borderRadius: 14,
    border: "none",
    boxShadow: marketing.shape.shadowCard,
    marginBottom: 18,
})
globalStyle(`${G} ${team.portraitName}`, {
    fontFamily: marketing.font.display,
    fontSize: 22,
    fontWeight: 400,
})
globalStyle(`${G} ${team.portraitRole}`, { ...smallCaps, fontSize: 11.5, color: marketing.color.accent })

// -- Clients' words: note cards, upright — Literata ships no italic here.
globalStyle(`${G} ${quotes.card}`, {
    background: marketing.color.surface,
    border: hair,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: "none",
    textAlign: "left",
})
globalStyle(`${G} ${quotes.quote}`, {
    fontFamily: marketing.font.display,
    fontStyle: "normal",
    fontSize: 19,
    lineHeight: 1.55,
    color: ink,
})
globalStyle(`${G} ${quotes.author}`, { ...smallCaps, fontSize: 11.5, color: marketing.color.accent })

globalStyle(`${G} ${faq.list}`, { marginInline: 0 })
globalStyle(`${G} ${faq.item}`, {
    background: "transparent",
    border: "none",
    borderBottom: hair,
    borderRadius: 0,
    boxShadow: "none",
})
globalStyle(`${G} ${faq.question}`, { fontFamily: marketing.font.display, fontSize: 20, fontWeight: 400 })

globalStyle(`${G} ${split.mediaImg}`, { borderRadius: 14, boxShadow: marketing.shape.shadowCard })
globalStyle(`${G} ${split.headline}`, { fontWeight: 400, lineHeight: 1.14 })

// -- The closing card: deep pine, a trail over the title, the ask in oat.
globalStyle(`${G} ${banner.card}`, {
    background: marketing.color.accent,
    color: marketing.color.onAccent,
    borderRadius: 18,
    border: "none",
    textAlign: "center",
    paddingBlock: scaledSpace(60),
})
globalStyle(`${G} ${banner.title}`, {
    color: marketing.color.onAccent,
    fontWeight: 400,
    fontSize: `clamp(28px, 3.4vw, 44px)`,
    lineHeight: 1.14,
    textAlign: "center",
    marginInline: "auto",
})
globalStyle(`${G} ${banner.title}::before`, {
    ...trailMark,
    display: "block",
    margin: `0 auto ${scaledSpace(22)}`,
    color: spot1,
})
globalStyle(`${G} ${banner.card} ${banner.cta}`, {
    background: marketing.color.onAccent,
    color: marketing.color.accent,
    boxShadow: "none",
})

// -- Footer: contour lines drawn over the imprint.
globalStyle(`${G} ${shell.footer}`, { position: "relative", borderTop: "none", paddingTop: 110 })
globalStyle(`${G} ${shell.footer}::before`, {
    content: '""',
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: 90,
    background: graphite,
    opacity: 0.45,
    maskImage: CONTOURS,
    WebkitMaskImage: CONTOURS,
    maskSize: "100% 100%",
    WebkitMaskSize: "100% 100%",
    pointerEvents: "none",
})
