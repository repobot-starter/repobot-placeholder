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
import { ctaPrimary, ctaSecondary, section, sectionKicker, sectionTitle, spot1, spot2 } from "../shared.css"

/*
 * `weave` (hearth): the collective's lounge in late afternoon. A woven
 * textile edge — the preset's ornament, one diamond tile that repeats both
 * ways — runs down the left of the full-bleed hero, along its foot and
 * over the footer; kickers sit between small ochre diamonds; the hero's
 * last line is ochre over a plum grade; the `filterable-grid` showcase is
 * the therapist roster (tall portrait cards, pill filters, tags as soft
 * ochre chips); numbered steps sit on a forest band and clients' words on
 * a sienna band; the closing card and the footer are plum.
 */
const G = '[data-marketing-treatment~="weave"]'
const ink = marketing.color.text
const hair = `1px solid ${marketing.color.line}`
// The collective's cloth: the bands keep their dye in both appearances.
const PLUM = "#3b1f2e" // theme-exempt: the textile and footer plum, the same in every theme
const FOREST = "#2f4a34" // theme-exempt: the matching band's forest, the same in every theme
const CREAM = "#f7f1e6" // theme-exempt: cream type on the dyed bands, the same in every theme
const cream80 = `color-mix(in srgb, ${CREAM} 82%, transparent)`

/** A band that bleeds to the viewport edges without leaving the column. */
const bleed = (color: string) =>
    ({
        background: color,
        boxShadow: `0 0 0 100vmax ${color}`,
        clipPath: "inset(0 -100vmax)",
    }) as const

/** The textile: the ornament tile over plum, laid along one axis. */
const textile = (repeat: "repeat-x" | "repeat-y", size: number) =>
    ({
        content: '""',
        position: "absolute",
        pointerEvents: "none",
        backgroundColor: PLUM,
        backgroundImage: "var(--marketing-ornament, none)",
        backgroundRepeat: repeat,
        backgroundSize: `${size}px ${size}px`,
        backgroundPosition: "center",
    }) as const

const smallCaps = {
    fontFamily: marketing.font.body,
    fontSize: 12.5,
    fontWeight: 700,
    letterSpacing: "0.16em",
    textTransform: "uppercase",
} as const

const diamond = {
    content: '""',
    width: 7,
    height: 7,
    flex: "0 0 7px",
    background: spot2,
    transform: "rotate(45deg)",
} as const

// -- Asks: plum pills; over the photograph, ochre.
globalStyle(`${G} ${ctaPrimary}, ${G} ${ctaSecondary}`, {
    fontFamily: marketing.font.body,
    fontSize: 15.5,
    fontWeight: 650,
    letterSpacing: "0.005em",
    padding: "13px 26px",
})

// -- Nav: the collective's name in the display serif over pill links.
globalStyle(`${G} ${shell.logo}`, {
    fontFamily: marketing.font.display,
    fontSize: 23,
    fontWeight: 400,
    letterSpacing: "-0.005em",
})
globalStyle(`${G} ${shell.logoTagline}`, {
    fontFamily: marketing.font.body,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.16em",
    color: spot1,
})
globalStyle(`${G} ${shell.link}, ${G} ${shell.linkPill}`, {
    fontFamily: marketing.font.body,
    fontSize: 14.5,
    fontWeight: 600,
})
globalStyle(`${G} ${shell.pillBox}`, {
    borderColor: `color-mix(in srgb, ${spot2} 45%, ${marketing.color.line})`,
})

// -- Hero: the lounge graded plum from the left, a woven edge down the
// left and along the foot, the last line in ochre.
globalStyle(`${G} ${hero.fullBleed}`, { minHeight: "clamp(560px, 86svh, 920px)" })
globalStyle(`${G} ${hero.fullBleed}::before`, {
    ...textile("repeat-y", 22),
    zIndex: 2,
    top: 0,
    bottom: 0,
    left: 0,
    width: 34,
    borderRight: `3px solid ${spot2}`,
    "@media": { "(max-width: 1319px)": { display: "none" } },
})
globalStyle(`${G} ${hero.fullBleed}::after`, {
    ...textile("repeat-x", 18),
    zIndex: 2,
    left: 0,
    right: 0,
    bottom: 0,
    height: 18,
    borderTop: `2px solid ${spot2}`,
})
globalStyle(`${G} ${hero.fullBleedScrim}`, {
    background:
        // theme-exempt: a plum grade over the photograph, the same in every theme
        "linear-gradient(90deg, rgba(40, 18, 30, 0.8) 0%, rgba(40, 18, 30, 0.46) 38%, rgba(40, 18, 30, 0) 64%), " +
        "linear-gradient(0deg, rgba(40, 18, 30, 0.5) 0%, rgba(40, 18, 30, 0) 42%)",
    "@media": {
        "(max-width: 720px)": {
            background:
                // theme-exempt: on a phone the copy covers the photograph, so the grade deepens toward the copy
                "linear-gradient(0deg, rgba(40, 18, 30, 0.86) 0%, rgba(40, 18, 30, 0.58) 55%, rgba(40, 18, 30, 0.2) 100%)",
        },
    },
})
globalStyle(`${G} ${hero.fullBleedImg}`, {
    "@media": { "(max-width: 720px)": { objectPosition: "58% 50%" } },
})
globalStyle(`${G} ${hero.fullBleedInner}`, { paddingBottom: scaledSpace(96) })
globalStyle(`${G} ${hero.fullBleedHeadline}`, {
    fontSize: `calc(clamp(44px, 6vw, 86px) * ${marketing.display.scale})`,
    lineHeight: 1.02,
    letterSpacing: "-0.015em",
    maxWidth: "9.5em",
})
globalStyle(`${G} ${hero.fullBleed} ${hero.accentWord}`, { color: "#e9b949" }) // theme-exempt: ochre over the plum grade, the same in every theme
globalStyle(`${G} ${hero.fullBleedSubheadline}`, { fontSize: 19, lineHeight: 1.55, maxWidth: "27em" })
globalStyle(`${G} ${hero.fullBleedBadge}`, { ...smallCaps, fontSize: 11.5 })
globalStyle(`${G} ${hero.fullBleedCredit}`, {
    ...smallCaps,
    display: "inline-flex",
    alignItems: "center",
    gap: 12,
    fontSize: 11.5,
    color: cream80,
})
globalStyle(`${G} ${hero.fullBleedCredit}::before`, diamond)
globalStyle(`${G} ${hero.fullBleed} ${hero.primary}`, {
    background: spot2,
    color: PLUM,
    boxShadow: "none",
})

// Inner pages: the title centered between diamonds.
globalStyle(`${G} ${hero.statement} ${hero.headline}`, {
    fontSize: `calc(clamp(40px, 5.4vw, 72px) * ${marketing.display.scale})`,
    lineHeight: 1.05,
})

// -- Sections: centered headers, the kicker between two ochre diamonds.
globalStyle(`${G} ${section}`, { paddingTop: scaledSpace(96) })
globalStyle(`${G} ${sectionKicker}`, {
    ...smallCaps,
    display: "inline-flex",
    alignItems: "center",
    gap: 14,
    color: spot1,
    marginBottom: scaledSpace(14),
})
globalStyle(`${G} ${sectionKicker}::before, ${G} ${sectionKicker}::after`, diamond)
globalStyle(`${G} ${sectionTitle}`, {
    fontFamily: marketing.font.display,
    fontSize: `calc(clamp(32px, 3.8vw, 52px) * ${marketing.display.scale})`,
    fontWeight: 400,
    lineHeight: 1.08,
    letterSpacing: "-0.012em",
    margin: `0 auto ${scaledSpace(40)}`,
})

// -- Ways in: cream cards with a sienna, ochre, and plum medallion.
globalStyle(`${G} ${features.listGrid}`, {
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: scaledSpace(20),
})
globalStyle(`${G} ${features.listRow}`, {
    gap: 18,
    padding: `${scaledSpace(28)} ${scaledSpace(26)}`,
    background: marketing.color.surface,
    border: hair,
    borderTop: `3px solid ${spot1}`,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
    textAlign: "left",
})
globalStyle(`${G} ${features.listRow}:nth-child(3n + 2)`, { borderTopColor: spot2 })
globalStyle(`${G} ${features.listRow}:nth-child(3n)`, { borderTopColor: PLUM })
globalStyle(`${G} ${features.listIconTile}`, {
    width: 54,
    height: 54,
    flex: "0 0 54px",
    borderRadius: "50%",
    background: `color-mix(in srgb, ${spot1} 16%, ${marketing.color.surface})`,
    color: spot1,
    border: `1.5px solid ${spot1}`,
})
globalStyle(`${G} ${features.listRow}:nth-child(3n + 2) ${features.listIconTile}`, {
    background: `color-mix(in srgb, ${spot2} 18%, ${marketing.color.surface})`,
    color: `color-mix(in srgb, ${spot2} 70%, ${ink})`,
    borderColor: spot2,
})
globalStyle(`${G} ${features.listRow}:nth-child(3n) ${features.listIconTile}`, {
    background: `color-mix(in srgb, ${marketing.color.accent} 12%, ${marketing.color.surface})`,
    color: marketing.color.accent,
    borderColor: marketing.color.accent,
})
globalStyle(`${G} ${features.featureTitle}`, {
    fontFamily: marketing.font.display,
    fontSize: 23,
    fontWeight: 400,
    margin: "2px 0 8px",
})
globalStyle(`${G} ${features.featureDescription}`, { fontSize: 16, lineHeight: 1.6 })

// -- The roster: tall portrait cards, pill filters, tags as ochre chips.
globalStyle(`${G} ${showcase.chipRow}`, {
    gap: 10,
    marginBottom: scaledSpace(36),
    "@media": {
        // Phones: one row of filters that scrolls sideways, not five rows of pills.
        "(max-width: 560px)": {
            flexWrap: "nowrap",
            justifyContent: "flex-start",
            overflowX: "auto",
            marginInline: -16,
            paddingInline: 16,
            paddingBottom: 4,
            scrollbarWidth: "none",
        },
    },
})
globalStyle(`${G} ${showcase.chip}`, { "@media": { "(max-width: 560px)": { flex: "0 0 auto" } } })
globalStyle(`${G} ${showcase.chip}`, {
    fontSize: 14,
    fontWeight: 600,
    color: ink,
    background: marketing.color.surface,
    borderColor: `color-mix(in srgb, ${spot2} 55%, ${marketing.color.line})`,
    padding: "9px 18px",
})
globalStyle(`${G} ${showcase.chip}[aria-pressed="true"]`, {
    color: CREAM,
    background: PLUM,
    borderColor: PLUM,
})
globalStyle(`${G} ${showcase.grid}`, {
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: scaledSpace(24),
    "@media": {
        "(max-width: 960px)": { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" },
        "(max-width: 560px)": { gridTemplateColumns: "minmax(0, 1fr)" },
    },
})
globalStyle(`${G} ${showcase.card}`, {
    gap: 8,
    padding: 0,
    overflow: "hidden",
    border: hair,
    borderRadius: marketing.shape.radiusCard,
    "@media": {
        // Phones: the directory reads as a list — the portrait at the left,
        // the name, note, and tags beside it.
        "(max-width: 560px)": {
            display: "grid",
            gridTemplateColumns: "120px minmax(0, 1fr)",
            alignContent: "start",
            columnGap: 0,
            rowGap: 4,
        },
    },
})
globalStyle(`${G} ${showcase.card} ${showcase.mediaImg}`, {
    aspectRatio: "4 / 4.4",
    height: "auto",
    objectFit: "cover",
    objectPosition: "50% 22%",
    borderRadius: 0,
    margin: `0 0 ${scaledSpace(10)}`,
    borderBottom: `4px solid ${spot1}`,
    "@media": {
        "(max-width: 560px)": {
            gridRow: "1 / span 4",
            height: "100%",
            minHeight: 168,
            aspectRatio: "auto",
            margin: 0,
            borderBottom: "none",
            borderRight: `4px solid ${spot1}`,
        },
    },
})
globalStyle(`${G} ${showcase.card}:nth-child(3n + 2) ${showcase.mediaImg}`, {
    borderBottomColor: spot2,
    borderRightColor: spot2,
})
globalStyle(`${G} ${showcase.card}:nth-child(3n) ${showcase.mediaImg}`, {
    borderBottomColor: PLUM,
    borderRightColor: PLUM,
})
globalStyle(
    `${G} ${showcase.card} ${showcase.eyebrow}, ${G} ${showcase.card} ${showcase.titleRow}, ${G} ${showcase.card} ${showcase.itemDescription}, ${G} ${showcase.card} ${showcase.tagRow}`,
    { paddingInline: scaledSpace(22), "@media": { "(max-width: 560px)": { paddingInline: 16 } } },
)
globalStyle(`${G} ${showcase.card} ${showcase.eyebrow}`, {
    "@media": { "(max-width: 560px)": { paddingTop: 16 } },
})
globalStyle(`${G} ${showcase.eyebrow}`, { ...smallCaps, fontSize: 11.5, color: spot1 })
globalStyle(`${G} ${showcase.itemTitle}`, {
    fontFamily: marketing.font.display,
    fontSize: 25,
    fontWeight: 400,
    letterSpacing: "-0.005em",
})
globalStyle(`${G} ${showcase.itemDescription}`, {
    fontSize: 15,
    lineHeight: 1.58,
    "@media": { "(max-width: 560px)": { fontSize: 14, lineHeight: 1.5 } },
})
globalStyle(`${G} ${showcase.tagRow}`, {
    gap: 7,
    marginTop: 6,
    paddingBottom: scaledSpace(24),
    "@media": { "(max-width: 560px)": { paddingBottom: 16 } },
})
globalStyle(`${G} ${showcase.tag}`, {
    fontSize: 12,
    fontWeight: 650,
    letterSpacing: "0.01em",
    textTransform: "none",
    color: ink,
    background: `color-mix(in srgb, ${spot2} 22%, ${marketing.color.surface})`,
    padding: "4px 11px",
})

// -- How matching works: numbered cards on the forest band.
globalStyle(`${G} ${steps.wrap}`, {
    ...bleed(FOREST),
    color: CREAM,
    marginTop: scaledSpace(96),
    paddingBlock: scaledSpace(80),
})
globalStyle(`${G} ${steps.wrap} ${sectionKicker}`, { color: "#e9b949" }) // theme-exempt: ochre on the forest band
globalStyle(`${G} ${steps.wrap} ${sectionTitle}`, { color: CREAM })
globalStyle(`${G} ${steps.card}`, {
    background: "transparent",
    border: "none",
    borderLeft: `1px solid color-mix(in srgb, ${CREAM} 28%, transparent)`,
    borderRadius: 0,
    boxShadow: "none",
    padding: `${scaledSpace(8)} ${scaledSpace(30)}`,
})
globalStyle(`${G} ${steps.card}:first-child`, { borderLeftColor: "transparent" })
globalStyle(`${G} ${steps.number}`, {
    width: 48,
    height: 48,
    fontFamily: marketing.font.display,
    fontSize: 22,
    fontWeight: 400,
    background: spot2,
    color: PLUM,
    marginBottom: 18,
})
globalStyle(`${G} ${steps.stepTitle}`, {
    fontFamily: marketing.font.display,
    fontSize: 24,
    fontWeight: 400,
    color: CREAM,
})
globalStyle(`${G} ${steps.stepDescription}`, { fontSize: 16, lineHeight: 1.6, color: cream80 })

// -- Fees & insurance: one cream card, prices in the display serif.
globalStyle(`${G} ${prices.board}`, {
    background: marketing.color.surface,
    border: hair,
    borderRadius: 18,
    boxShadow: marketing.shape.shadowCard,
})
globalStyle(`${G} ${prices.head}`, { background: "transparent", color: ink, paddingTop: scaledSpace(48) })
globalStyle(`${G} ${prices.kicker}`, {
    ...smallCaps,
    display: "inline-flex",
    alignItems: "center",
    gap: 14,
    color: spot1,
})
globalStyle(`${G} ${prices.kicker}::before, ${G} ${prices.kicker}::after`, diamond)
globalStyle(`${G} ${prices.title}`, {
    fontFamily: marketing.font.display,
    color: ink,
    fontWeight: 400,
    fontSize: `clamp(30px, 3.4vw, 44px)`,
    lineHeight: 1.1,
})
globalStyle(`${G} ${prices.intro}`, { color: marketing.color.subtle, maxWidth: "38em" })
globalStyle(`${G} ${prices.groups}`, { columnGap: scaledSpace(56) })
globalStyle(`${G} ${prices.groupHeading}`, {
    ...smallCaps,
    fontSize: 12,
    color: marketing.color.accent,
    borderBottom: `2px solid ${spot2}`,
    paddingBottom: 10,
})
globalStyle(`${G} ${prices.groupHeading}::before`, { display: "none" })
globalStyle(`${G} ${prices.line}`, { borderBottom: hair })
globalStyle(`${G} ${prices.name}`, { fontFamily: marketing.font.body, fontSize: 17, fontWeight: 650 })
globalStyle(`${G} ${prices.note}`, { fontWeight: 400, fontSize: 14.5 })
globalStyle(`${G} ${prices.leader}`, { opacity: 0 })
globalStyle(`${G} ${prices.price}`, {
    fontFamily: marketing.font.display,
    fontSize: 24,
    fontWeight: 400,
    color: marketing.color.accent,
})
globalStyle(`${G} ${prices.qualifier}`, { fontFamily: marketing.font.body, fontStyle: "normal" })
globalStyle(`${G} ${prices.foot}`, {
    background: "transparent",
    color: marketing.color.subtle,
    borderTop: hair,
})

// -- How paying works: plain lines between diamonds — no insurer marks.
globalStyle(`${G} ${logos.strip}`, { columnGap: scaledSpace(30), rowGap: 12 })
globalStyle(`${G} ${logos.wordmark}`, {
    display: "inline-flex",
    alignItems: "center",
    gap: 12,
    fontFamily: marketing.font.body,
    fontSize: 15.5,
    fontWeight: 600,
    letterSpacing: 0,
    textTransform: "none",
    color: ink,
    opacity: 1,
})
globalStyle(`${G} ${logos.wordmark}::before`, { ...diamond, width: 6, height: 6, flex: "0 0 6px" })

// -- Portraits (the therapists page): tall frames, a sienna foot.
globalStyle(`${G} ${team.portraitImg}`, {
    borderRadius: marketing.shape.radiusCard,
    border: "none",
    borderBottom: `4px solid ${spot1}`,
    boxShadow: marketing.shape.shadowCard,
    marginBottom: 18,
})
globalStyle(`${G} ${team.portraitName}`, {
    fontFamily: marketing.font.display,
    fontSize: 24,
    fontWeight: 400,
})
globalStyle(`${G} ${team.portraitRole}`, { ...smallCaps, fontSize: 11.5, color: spot1 })

// -- In their words: the sienna band, cream type, the quote in the display serif.
globalStyle(`${G} ${quotes.wrap}`, {
    ...bleed(spot1),
    color: CREAM,
    marginTop: scaledSpace(96),
    paddingBlock: scaledSpace(72),
})
globalStyle(`${G} ${quotes.wrap} ${sectionKicker}`, { color: CREAM })
globalStyle(`${G} ${quotes.wrap} ${sectionKicker}::before, ${G} ${quotes.wrap} ${sectionKicker}::after`, {
    background: CREAM,
})
globalStyle(`${G} ${quotes.card}`, {
    background: "transparent",
    border: "none",
    borderTop: `1px solid color-mix(in srgb, ${CREAM} 40%, transparent)`,
    borderRadius: 0,
    boxShadow: "none",
    padding: `${scaledSpace(22)} 0 0`,
    textAlign: "left",
})
globalStyle(`${G} ${quotes.quote}`, {
    fontFamily: marketing.font.display,
    fontStyle: "normal",
    fontSize: 21,
    lineHeight: 1.42,
    color: CREAM,
})
globalStyle(`${G} ${quotes.attribution}`, { borderColor: "transparent" })
globalStyle(`${G} ${quotes.author}`, { ...smallCaps, fontSize: 12, color: CREAM })
globalStyle(`${G} ${quotes.authorTitle}`, { color: cream80 })

globalStyle(`${G} ${faq.item}`, {
    background: marketing.color.surface,
    border: hair,
    borderRadius: 12,
    boxShadow: "none",
})
globalStyle(`${G} ${faq.question}`, { fontFamily: marketing.font.body, fontSize: 17, fontWeight: 650 })

globalStyle(`${G} ${split.mediaImg}`, {
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
    borderBottom: `4px solid ${spot2}`,
})
globalStyle(`${G} ${split.headline}`, { fontWeight: 400, lineHeight: 1.1 })

// -- The closing card: plum, the ask in ochre.
globalStyle(`${G} ${banner.card}`, {
    background: PLUM,
    color: CREAM,
    borderRadius: 18,
    border: "none",
    textAlign: "center",
    paddingBlock: scaledSpace(64),
})
globalStyle(`${G} ${banner.title}`, {
    color: CREAM,
    fontWeight: 400,
    fontSize: `clamp(28px, 3.4vw, 44px)`,
    lineHeight: 1.12,
    maxWidth: "20em",
    marginInline: "auto",
})
globalStyle(`${G} ${banner.card} ${banner.cta}`, { background: spot2, color: PLUM, boxShadow: "none" })

// -- Footer: plum under the woven edge.
globalStyle(`${G} ${shell.footer}`, {
    ...bleed(PLUM),
    position: "relative",
    border: "none",
    marginTop: scaledSpace(110),
    paddingBlock: `${scaledSpace(64)} ${scaledSpace(40)}`,
    color: cream80,
})
globalStyle(`${G} ${shell.footer}::before`, {
    ...textile("repeat-x", 18),
    left: "calc(50% - 50vw)",
    width: "100vw",
    top: 0,
    height: 18,
    borderBottom: `2px solid ${spot2}`,
})
globalStyle(`${G} ${shell.footer} a, ${G} ${shell.footerLink}`, { color: CREAM })
globalStyle(`${G} ${shell.footerNote}`, { borderTopColor: `color-mix(in srgb, ${CREAM} 20%, transparent)` })
