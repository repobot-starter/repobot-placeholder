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
import * as report from "../MarketingReportCard.styles.css"
import * as team from "../MarketingTeam.styles.css"
import * as quotes from "../MarketingTestimonials.styles.css"
import * as faq from "../MarketingFaq.styles.css"
import * as banner from "../MarketingCtaBanner.styles.css"
import { ctaPrimary, ctaSecondary, scriptFont, section, sectionKicker, sectionTitle } from "../shared.css"

/*
 * `marginalia` (colophon): the press's annotated edition. Kickers in the
 * preset's drawn small capitals (its third voice) under the ornament, a
 * printer's star; the full-bleed hero graded from the foot; the `report`
 * content split set as a sample page — the section's title centered over
 * the spread, the case file on paper at the left with a second sheet
 * behind it and a stamp in oxblood, the bullets at the right as numbered
 * margin notes each led in by a hairline; numbered steps as three ruled
 * columns under roman numerals; rectangular small-caps asks; a double rule
 * and the star over the footer.
 */
const M = '[data-marketing-treatment~="marginalia"]'
const ink = marketing.color.text
const oxblood = marketing.color.accent
const hair = `1px solid ${marketing.color.line}`
const doubleRule = `3px double color-mix(in srgb, ${ink} 30%, ${marketing.color.line})`
const PAPER = "#fffdf8" // theme-exempt: the sample page's paper, lighter than any page ground
// The second sheet under the sample page, then the page's lift off the table.
const SHEETS = "7px 8px 0 -1px #f7f1e4, 7px 8px 0 0 #ddd2bf, 0 30px 50px -34px rgba(43, 31, 27, 0.55)" // theme-exempt: paper, the same in every theme

const smallCaps = {
    fontFamily: scriptFont,
    fontWeight: 500,
    letterSpacing: "0.1em",
    textTransform: "lowercase",
} as const

const star = (size: number) =>
    ({
        content: '""',
        display: "block",
        width: size,
        height: size,
        backgroundImage: "var(--marketing-ornament, none)",
        backgroundRepeat: "no-repeat",
        backgroundSize: "contain",
        backgroundPosition: "center",
    }) as const

// -- Asks: rectangular, small capitals, no shadow.
globalStyle(`${M} ${ctaPrimary}, ${M} ${ctaSecondary}`, {
    ...smallCaps,
    fontSize: 17,
    letterSpacing: "0.12em",
    padding: "13px 30px 15px",
    boxShadow: "none",
})
globalStyle(`${M} ${ctaSecondary}`, { borderWidth: 1 })

// -- Nav: the imprint in small capitals at the left, the contents at the right.
globalStyle(`${M} ${shell.logo}`, {
    ...smallCaps,
    fontSize: 19,
    letterSpacing: "0.14em",
    textTransform: "none",
})
globalStyle(`${M} ${shell.logoTagline}`, {
    fontFamily: marketing.font.body,
    fontStyle: "italic",
    fontSize: 13,
    fontWeight: 400,
    letterSpacing: 0,
    textTransform: "none",
    color: marketing.color.subtle,
})
globalStyle(`${M} ${shell.link}`, { fontFamily: marketing.font.body, fontSize: 16, fontWeight: 400 })

// -- Hero: the reading room graded from the foot, the title in the book serif.
globalStyle(`${M} ${hero.fullBleed}`, { minHeight: "clamp(560px, 84svh, 900px)" })
globalStyle(`${M} ${hero.fullBleedScrim}`, {
    background:
        // theme-exempt: a walnut grade over the photograph, the same in every theme
        "linear-gradient(0deg, rgba(30, 19, 14, 0.82) 0%, rgba(30, 19, 14, 0.5) 34%, rgba(30, 19, 14, 0) 62%), " +
        "linear-gradient(90deg, rgba(30, 19, 14, 0.5) 0%, rgba(30, 19, 14, 0) 52%)",
    "@media": {
        "(max-width: 720px)": {
            background:
                // theme-exempt: on a phone the copy covers the photograph, so the grade deepens toward the copy
                "linear-gradient(0deg, rgba(30, 19, 14, 0.9) 0%, rgba(30, 19, 14, 0.62) 50%, rgba(30, 19, 14, 0.12) 100%)",
        },
    },
})
globalStyle(`${M} ${hero.fullBleedImg}`, {
    "@media": { "(max-width: 720px)": { objectPosition: "40% 50%" } },
})
globalStyle(`${M} ${hero.fullBleedInner}`, { paddingBottom: scaledSpace(88) })
globalStyle(`${M} ${hero.fullBleedHeadline}`, {
    fontSize: `calc(clamp(46px, 6.4vw, 92px) * ${marketing.display.scale})`,
    fontWeight: 400,
    lineHeight: 1,
    letterSpacing: "-0.02em",
    whiteSpace: "pre-line",
    maxWidth: "9em",
})
globalStyle(`${M} ${hero.fullBleedSubheadline}`, { fontSize: 20, lineHeight: 1.5, maxWidth: "28em" })
globalStyle(`${M} ${hero.fullBleedBadge}, ${M} ${hero.fullBleedCredit}`, {
    ...smallCaps,
    fontSize: 15,
    letterSpacing: "0.12em",
})
globalStyle(`${M} ${hero.fullBleed} ${hero.primary}`, {
    background: oxblood,
    color: PAPER,
    borderColor: oxblood,
})

globalStyle(`${M} ${hero.statement} ${hero.headline}`, {
    fontSize: `calc(clamp(40px, 5.4vw, 72px) * ${marketing.display.scale})`,
    fontWeight: 400,
    lineHeight: 1.04,
})

// -- Sections: the printer's star over a small-caps kicker, the title in the book serif.
globalStyle(`${M} ${section}`, { paddingTop: scaledSpace(100) })
globalStyle(`${M} ${sectionKicker}`, {
    ...smallCaps,
    display: "inline-flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    fontSize: 17,
    letterSpacing: "0.14em",
    color: oxblood,
    marginBottom: scaledSpace(12),
})
globalStyle(`${M} ${sectionKicker}::before`, star(22))
globalStyle(`${M} ${sectionTitle}`, {
    fontFamily: marketing.font.display,
    fontSize: `calc(clamp(30px, 3.6vw, 48px) * ${marketing.display.scale})`,
    fontWeight: 400,
    lineHeight: 1.1,
    letterSpacing: "-0.014em",
    maxWidth: "20em",
    margin: `0 auto ${scaledSpace(44)}`,
})

// -- The sample report: the title over the spread, the page at the left,
// the margin notes at the right. The copy column dissolves into the grid
// so its kicker and headline can span both columns.
globalStyle(`${M} ${split.gridReport}`, {
    gridTemplateColumns: "minmax(0, 1.08fr) minmax(0, 0.92fr)",
    gridTemplateAreas: '"kicker kicker" "head head" "page notes" "page body"',
    gridTemplateRows: "auto auto auto 1fr",
    columnGap: scaledSpace(80),
    rowGap: 0,
    alignItems: "start",
    "@media": {
        "(max-width: 860px)": {
            gridTemplateColumns: "minmax(0, 1fr)",
            gridTemplateAreas: '"kicker" "head" "page" "notes" "body"',
            gridTemplateRows: "none",
        },
    },
})
globalStyle(`${M} ${split.gridReport} > div`, { display: "contents" })
globalStyle(`${M} ${split.gridReport} ${split.kicker}`, {
    gridArea: "kicker",
    justifySelf: "center",
    fontSize: `clamp(30px, 3.4vw, 42px)`,
    letterSpacing: "0.1em",
    textTransform: "none",
    marginBottom: 4,
})
globalStyle(`${M} ${split.gridReport} ${split.headline}`, {
    gridArea: "head",
    justifySelf: "center",
    textAlign: "center",
    fontStyle: "italic",
    fontSize: `clamp(19px, 1.9vw, 24px)`,
    lineHeight: 1.35,
    letterSpacing: 0,
    color: marketing.color.subtle,
    maxWidth: "30em",
    margin: `0 0 ${scaledSpace(56)}`,
})
globalStyle(`${M} ${split.gridReport} > ${report.card}`, { gridArea: "page" })
globalStyle(`${M} ${split.gridReport} ${split.bullets}`, {
    gridArea: "notes",
    counterReset: "note",
    gap: scaledSpace(30),
    margin: `${scaledSpace(20)} 0 0`,
    "@media": { "(max-width: 860px)": { margin: `${scaledSpace(44)} 0 0` } },
})
globalStyle(`${M} ${split.gridReport} ${split.bullet}`, {
    position: "relative",
    counterIncrement: "note",
    gap: 16,
    fontSize: 17,
    lineHeight: 1.55,
})
// The leader: a hairline from the page's edge to the note's number.
globalStyle(`${M} ${split.gridReport} ${split.bullet}::before`, {
    content: '""',
    position: "absolute",
    top: 15,
    right: "100%",
    width: `calc(${scaledSpace(80)} - 14px)`,
    marginRight: 10,
    borderTop: `1px solid color-mix(in srgb, ${oxblood} 55%, transparent)`,
    "@media": { "(max-width: 860px)": { display: "none" } },
})
globalStyle(`${M} ${split.gridReport} ${split.bulletMark}`, {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 30,
    height: 30,
    flex: "0 0 30px",
    borderRadius: "50%",
    background: oxblood,
    color: PAPER,
    fontSize: 0,
    marginTop: 1,
})
globalStyle(`${M} ${split.gridReport} ${split.bulletMark}::before`, {
    content: "counter(note)",
    fontFamily: marketing.font.body,
    fontSize: 15,
    fontWeight: 600,
    lineHeight: 1,
})
globalStyle(`${M} ${split.gridReport} ${split.body}`, {
    gridArea: "body",
    display: "flex",
    gap: 16,
    alignItems: "flex-start",
    alignSelf: "end",
    marginTop: scaledSpace(40),
    paddingTop: scaledSpace(24),
    borderTop: hair,
    fontStyle: "italic",
    fontSize: 16,
    lineHeight: 1.6,
})
globalStyle(`${M} ${split.gridReport} ${split.body}::before`, { ...star(30), flex: "0 0 30px" })

// The page: paper with a second sheet under it, set a hair askew.
globalStyle(`${M} ${report.card}`, {
    position: "relative",
    background: PAPER,
    color: "#2b1f1b", // theme-exempt: printed ink on the paper, the same in every theme
    border: "1px solid #ddd2bf", // theme-exempt: the paper's edge, the same in every theme
    borderRadius: 1,
    padding: `${scaledSpace(34)} ${scaledSpace(38)} ${scaledSpace(28)}`,
    boxShadow: SHEETS,
    transform: "rotate(-0.7deg)",
    "@media": {
        "(max-width: 640px)": { padding: `${scaledSpace(24)} ${scaledSpace(20)}`, transform: "none" },
    },
})
globalStyle(`${M} ${report.masthead}`, {
    flexDirection: "row-reverse",
    paddingBottom: 12,
    marginBottom: scaledSpace(22),
    borderBottom: "3px double #cbbda6", // theme-exempt: the page's head rule, the same in every theme
    "@media": { "(max-width: 640px)": { flexDirection: "column", alignItems: "flex-start", gap: 4 } },
})
globalStyle(`${M} ${report.label}, ${M} ${report.issuer}`, {
    ...smallCaps,
    fontSize: 14,
    color: "#65574d", // theme-exempt: printed ink on the paper, the same in every theme
})
globalStyle(`${M} ${report.label}::before`, { display: "none" })
globalStyle(`${M} ${report.title}`, {
    fontSize: `clamp(22px, 2.2vw, 28px)`,
    fontWeight: 600,
    letterSpacing: "-0.01em",
    color: "#2b1f1b", // theme-exempt: printed ink on the paper, the same in every theme
})
globalStyle(`${M} ${report.location}`, {
    fontSize: 16,
    fontWeight: 400,
    lineHeight: 1.6,
    color: "#3d302a", // theme-exempt: printed ink on the paper, the same in every theme
    margin: "10px 0 0",
    maxWidth: "34em",
})
globalStyle(`${M} ${report.rowsWrap}`, { position: "static", marginTop: scaledSpace(22) })
globalStyle(`${M} ${report.rows}`, { borderTop: "1px solid #ddd2bf" }) // theme-exempt: the page's rules
globalStyle(`${M} ${report.row}`, {
    gridTemplateColumns: "minmax(0, 1fr) auto",
    padding: "11px 0",
    borderBottom: "1px dotted #cbbda6", // theme-exempt: the page's rules, the same in every theme
})
globalStyle(`${M} ${report.rowLabel}`, {
    fontFamily: marketing.font.body,
    fontSize: 16,
    fontWeight: 400,
    letterSpacing: 0,
    textTransform: "none",
    color: "#2b1f1b", // theme-exempt: printed ink on the paper, the same in every theme
})
globalStyle(`${M} ${report.rowValue}`, {
    fontStyle: "italic",
    fontSize: 16,
    fontWeight: 400,
    textAlign: "right",
    color: "#6e1f24", // theme-exempt: the oxblood of the page's annotations, the same in every theme
})
globalStyle(`${M} ${report.stamp}`, {
    ...smallCaps,
    top: scaledSpace(78),
    right: scaledSpace(30),
    bottom: "auto",
    fontSize: 19,
    letterSpacing: "0.2em",
    color: "#6e1f24", // theme-exempt: the stamp's oxblood ink, the same in every theme
    border: "3px double #6e1f24", // theme-exempt: the stamp's oxblood ink, the same in every theme
    borderRadius: 2,
    padding: "3px 14px 5px",
    background: "transparent",
    opacity: 0.82,
    transform: "rotate(-7deg)",
    "@media": {
        // Phones: the page is too narrow to stamp beside the title, so the
        // stamp prints under the rows.
        "(max-width: 640px)": {
            position: "static",
            display: "inline-block",
            marginTop: scaledSpace(18),
            fontSize: 16,
            transform: "rotate(-4deg)",
        },
    },
})
globalStyle(`${M} ${report.signature}`, {
    marginTop: scaledSpace(22),
    borderTop: "none",
})
globalStyle(`${M} ${report.signatureName}`, {
    fontStyle: "italic",
    fontSize: 16,
    color: "#3d302a", // theme-exempt: printed ink on the paper, the same in every theme
})
globalStyle(`${M} ${report.signatureName}::before`, { content: '""' })

// -- The process: three ruled columns under roman numerals.
globalStyle(`${M} ${steps.row}`, {
    counterReset: "step",
    gap: 0,
    borderTop: doubleRule,
    borderBottom: hair,
})
globalStyle(`${M} ${steps.card}`, {
    counterIncrement: "step",
    background: "transparent",
    border: "none",
    borderLeft: hair,
    borderRadius: 0,
    boxShadow: "none",
    padding: `${scaledSpace(30)} ${scaledSpace(32)} ${scaledSpace(34)}`,
    "@media": {
        "(max-width: 760px)": {
            borderLeft: "none",
            borderTop: hair,
            paddingInline: 0,
        },
    },
})
globalStyle(`${M} ${steps.card}:first-child`, {
    borderLeftColor: "transparent",
    borderTopColor: "transparent",
})
globalStyle(`${M} ${steps.number}`, {
    width: "auto",
    height: "auto",
    background: "none",
    borderRadius: 0,
    fontSize: 0,
    marginBottom: 12,
})
globalStyle(`${M} ${steps.number}::before`, {
    content: 'counter(step, upper-roman) "."',
    fontFamily: marketing.font.display,
    fontStyle: "italic",
    fontSize: 22,
    fontWeight: 400,
    lineHeight: 1,
    color: oxblood,
})
globalStyle(`${M} ${steps.stepTitle}`, {
    fontFamily: marketing.font.display,
    fontSize: 22,
    fontWeight: 400,
    lineHeight: 1.25,
})
globalStyle(`${M} ${steps.stepDescription}`, { fontSize: 16.5, lineHeight: 1.6 })

// -- Ways in (when a practice lists them): ruled entries, no tiles.
globalStyle(`${M} ${features.listRow}`, {
    background: "transparent",
    border: "none",
    borderTop: hair,
    borderRadius: 0,
    boxShadow: "none",
    textAlign: "left",
})
globalStyle(`${M} ${features.listIconTile}`, { background: "transparent", color: oxblood, border: "none" })
globalStyle(`${M} ${features.featureTitle}`, {
    fontFamily: marketing.font.display,
    fontSize: 22,
    fontWeight: 400,
})

// -- Fees: a printed price list between double rules.
globalStyle(`${M} ${prices.board}`, {
    background: marketing.color.surface,
    border: hair,
    borderRadius: 1,
    boxShadow: marketing.shape.shadowCard,
})
globalStyle(`${M} ${prices.head}`, {
    background: "transparent",
    color: ink,
    paddingTop: scaledSpace(52),
    borderBottom: doubleRule,
})
globalStyle(`${M} ${prices.kicker}`, { ...smallCaps, fontSize: 17, letterSpacing: "0.14em", color: oxblood })
globalStyle(`${M} ${prices.title}`, {
    fontFamily: marketing.font.display,
    color: ink,
    fontWeight: 400,
    fontSize: `clamp(28px, 3.2vw, 42px)`,
    lineHeight: 1.12,
})
globalStyle(`${M} ${prices.intro}`, { color: marketing.color.subtle, fontSize: 17, maxWidth: "38em" })
globalStyle(`${M} ${prices.groups}`, { columnGap: scaledSpace(64) })
globalStyle(`${M} ${prices.groupHeading}`, {
    ...smallCaps,
    fontSize: 16,
    color: oxblood,
    borderBottom: hair,
    paddingBottom: 10,
})
globalStyle(`${M} ${prices.groupHeading}::before`, { display: "none" })
globalStyle(`${M} ${prices.line}`, { borderBottom: "none" })
globalStyle(`${M} ${prices.name}`, { fontFamily: marketing.font.body, fontSize: 18, fontWeight: 400 })
globalStyle(`${M} ${prices.note}`, { fontStyle: "italic", fontWeight: 400, fontSize: 15 })
globalStyle(`${M} ${prices.leader}`, {
    color: ink,
    opacity: 0.35,
    backgroundImage: "radial-gradient(circle, currentColor 0.9px, transparent 1.2px)",
    backgroundSize: "7px 6px",
})
globalStyle(`${M} ${prices.price}`, {
    fontFamily: marketing.font.display,
    fontSize: 20,
    fontWeight: 400,
    color: oxblood,
    fontVariantNumeric: "oldstyle-nums",
})
globalStyle(`${M} ${prices.qualifier}`, { fontStyle: "italic" })
globalStyle(`${M} ${prices.foot}`, {
    background: "transparent",
    color: marketing.color.subtle,
    fontStyle: "italic",
    borderTop: hair,
})

// -- How paying works: plain lines between small stars — no insurer marks.
globalStyle(`${M} ${logos.strip}`, { columnGap: scaledSpace(32), rowGap: 14 })
globalStyle(`${M} ${logos.wordmark}`, {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    fontFamily: marketing.font.body,
    fontSize: 17,
    fontWeight: 400,
    letterSpacing: 0,
    textTransform: "none",
    color: ink,
    opacity: 1,
})
globalStyle(`${M} ${logos.wordmark}::before`, { ...star(13), flex: "0 0 13px" })

// -- Clinicians: plain frames, names in the serif, roles in small capitals.
globalStyle(`${M} ${team.portraitImg}`, {
    borderRadius: 1,
    border: "none",
    boxShadow: marketing.shape.shadowCard,
    marginBottom: 18,
})
globalStyle(`${M} ${team.portraitName}`, {
    fontFamily: marketing.font.display,
    fontSize: 23,
    fontWeight: 400,
})
globalStyle(`${M} ${team.portraitRole}`, { ...smallCaps, fontSize: 15, color: oxblood })

// -- After the report: italic quotes under hairlines.
globalStyle(`${M} ${quotes.card}`, {
    background: "transparent",
    border: "none",
    borderTop: hair,
    borderRadius: 0,
    boxShadow: "none",
    padding: `${scaledSpace(24)} 0 0`,
    textAlign: "left",
})
globalStyle(`${M} ${quotes.quote}`, {
    fontFamily: marketing.font.display,
    fontStyle: "italic",
    fontSize: 21,
    lineHeight: 1.45,
})
globalStyle(`${M} ${quotes.attribution}`, { borderColor: "transparent" })
globalStyle(`${M} ${quotes.author}`, { ...smallCaps, fontSize: 16, color: oxblood })
globalStyle(`${M} ${quotes.authorTitle}`, { fontStyle: "italic" })

globalStyle(`${M} ${faq.item}`, {
    background: "transparent",
    border: "none",
    borderBottom: hair,
    borderRadius: 0,
    boxShadow: "none",
})
globalStyle(`${M} ${faq.question}`, { fontFamily: marketing.font.display, fontSize: 19, fontWeight: 400 })

globalStyle(`${M} ${split.mediaImg}`, { borderRadius: 1, boxShadow: marketing.shape.shadowCard })
globalStyle(`${M} ${split.headline}`, { fontWeight: 400, lineHeight: 1.12 })

// -- The closing line: between rules, the ask in oxblood.
globalStyle(`${M} ${banner.card}`, {
    background: "transparent",
    color: ink,
    border: "none",
    borderTop: hair,
    borderBottom: hair,
    borderRadius: 0,
    boxShadow: "none",
    textAlign: "center",
    paddingBlock: scaledSpace(52),
})
globalStyle(`${M} ${banner.title}`, {
    color: ink,
    fontWeight: 400,
    fontSize: `clamp(26px, 3vw, 38px)`,
    lineHeight: 1.15,
    maxWidth: "22em",
    marginInline: "auto",
})
globalStyle(`${M} ${banner.card} ${banner.cta}`, { background: oxblood, color: PAPER, boxShadow: "none" })

// -- Footer: a double rule with the star set into it.
globalStyle(`${M} ${shell.footer}`, {
    position: "relative",
    borderTop: doubleRule,
    marginTop: scaledSpace(110),
    paddingTop: scaledSpace(56),
})
globalStyle(`${M} ${shell.footer}::before`, {
    ...star(26),
    position: "absolute",
    top: -15,
    left: "calc(50% - 20px)",
    width: 40,
    backgroundColor: marketing.color.pageBg,
    backgroundSize: "26px 26px",
})
globalStyle(`${M} ${shell.footerNote}`, { fontStyle: "italic" })
