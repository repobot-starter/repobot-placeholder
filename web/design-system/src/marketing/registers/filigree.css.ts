import { globalStyle } from "@vanilla-extract/css"
import * as banner from "../MarketingCtaBanner.styles.css"
import * as hero from "../MarketingHero.styles.css"
import * as builder from "../MarketingPackageBuilder.styles.css"
import * as showcase from "../MarketingShowcase.styles.css"
import * as testimonials from "../MarketingTestimonials.styles.css"
import { spot1 } from "../shared.css"
import { scaledSpace } from "../theme/feelBridge"
import { marketing } from "../theme/marketingTheme.css"

/*
 * `filigree` (jharokha): the jewel box. The lotus (the preset's ornament)
 * crowns the name and the closing ask; the hero's event panels are arched
 * like jharokha windows in a gold line, each named on a gold plate across
 * its foot; the package board and the ask sit in double gold rules; the
 * looks lay out as a mosaic, two wide over three.
 */
const ROOT = '[data-marketing-treatment~="filigree"]'
const within = (target: string): string => `${ROOT} ${target}`

const LOTUS = {
    content: '""',
    display: "block",
    width: 120,
    height: 36,
    margin: `0 auto ${scaledSpace(10)}`,
    background: "var(--marketing-ornament) center / contain no-repeat",
} as const

const ARCH = "50% 50% 6px 6px / 22% 22% 6px 6px"
const DOUBLE_RULE = `0 0 0 5px ${marketing.color.surface}, 0 0 0 6px ${marketing.color.accent}`

// The name under the lotus.
globalStyle(within(`${hero.centered} ${hero.headline}::before`), LOTUS)

// The event panels: arched windows in a gold line, a gold plate for the name.
globalStyle(within(hero.panelFrame), {
    borderRadius: ARCH,
    border: `2px solid ${marketing.color.accent}`,
    boxSizing: "border-box",
    padding: 5,
    background: marketing.color.surface,
})

globalStyle(within(hero.panelImg), { borderRadius: ARCH })

globalStyle(within(hero.panelLabel), {
    position: "absolute",
    bottom: 18,
    left: "50%",
    transform: "translateX(-50%)",
    minWidth: "58%",
    textAlign: "center",
    padding: "4px 16px",
    fontFamily: marketing.font.body,
    fontSize: 16,
    letterSpacing: "0.02em",
    whiteSpace: "nowrap",
    color: "#2a1d05", // theme-exempt: dark ink on the gold plate reads in both appearances
    background: `linear-gradient(180deg, ${spot1}, ${marketing.color.accent})`,
    border: "1px solid rgba(42, 29, 5, 0.35)", // theme-exempt: the plate's engraved edge
    borderRadius: 4,
    boxShadow: "0 6px 14px -8px rgba(0, 0, 0, 0.6)", // theme-exempt: the plate's lift off the photograph
})

// The package board: double gold rules, the total in gold.
globalStyle(within(builder.board), {
    borderColor: marketing.color.accent,
    boxShadow: DOUBLE_RULE,
    margin: "6px",
})

globalStyle(within(builder.title), { color: marketing.color.accent })

globalStyle(within(builder.totalValue), { color: marketing.color.accent })

// The looks: a mosaic — two wide covers over three.
globalStyle(within(showcase.collectionsGrid), {
    gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
    gap: `${scaledSpace(24)} ${scaledSpace(16)}`,
    "@media": { "(max-width: 760px)": { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" } },
})

globalStyle(within(`${showcase.collectionsGrid} > *`), {
    gridColumn: "span 2",
    "@media": { "(max-width: 760px)": { gridColumn: "span 1" } },
})

globalStyle(within(`${showcase.collectionsGrid} > :nth-child(-n + 2)`), {
    gridColumn: "span 3",
    "@media": { "(max-width: 760px)": { gridColumn: "1 / -1" } },
})

globalStyle(within(showcase.collectionCover), {
    border: `1px solid ${marketing.color.accent}`,
    aspectRatio: "4 / 3",
})

globalStyle(within(`${showcase.collectionsGrid} > :nth-child(-n + 2) ${showcase.collectionCover}`), {
    aspectRatio: "16 / 9",
})

// A bride's words: gold quotation, the lotus under the name.
globalStyle(within(`${testimonials.featured}::after`), { ...LOTUS, margin: `${scaledSpace(14)} auto 0` })

// The ask: double gold rules under the lotus.
globalStyle(within(banner.card), {
    borderColor: marketing.color.accent,
    boxShadow: DOUBLE_RULE,
})

globalStyle(within(`${banner.card}::before`), LOTUS)
