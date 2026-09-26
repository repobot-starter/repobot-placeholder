import { globalStyle } from "@vanilla-extract/css"
import * as banner from "../MarketingCtaBanner.styles.css"
import * as hero from "../MarketingHero.styles.css"
import * as directory from "../MarketingShowcaseDirectory.styles.css"
import { scaledSpace } from "../theme/feelBridge"
import { marketing } from "../theme/marketingTheme.css"

/*
 * `alcove` (limestone): the private atelier. The full-bleed headline keeps
 * the author's line breaks; every directory portrait is arched like the
 * suite's mirror inside a thin stone border; the ranks stay ruled apart;
 * the filter is a quiet dotted line of words instead of chips; the
 * stylists' names are italic; the closing ask is one centered sentence
 * over a squared button.
 */
const ROOT = '[data-marketing-treatment~="alcove"]'
const within = (target: string): string => `${ROOT} ${target}`

const ARCH = "999px 999px 3px 3px"

// Hero: the Didone broken where the author broke it, over a softer scrim.
globalStyle(within(hero.fullBleedHeadline), {
    fontSize: `calc(clamp(40px, 7.4vw, 108px) * ${marketing.display.scale})`,
    whiteSpace: "pre-line",
    lineHeight: 0.98,
})

globalStyle(within(hero.fullBleedScrim), {
    background:
        "linear-gradient(180deg, rgba(30, 24, 18, 0.18) 0%, rgba(30, 24, 18, 0) 34%, rgba(30, 24, 18, 0.5) 100%)", // theme-exempt: the scrim under white copy is the same warm shade in every theme
})

// The filter: words on a dotted line, the chosen one underlined.
globalStyle(within(directory.chipRow), {
    justifyContent: "flex-start",
    gap: 0,
    marginBottom: scaledSpace(34),
})

globalStyle(within(directory.chip), {
    fontFamily: marketing.font.body,
    fontSize: 17,
    padding: "4px 2px",
    border: 0,
    borderRadius: 0,
    color: marketing.color.subtle,
    textDecorationThickness: "1px",
    textUnderlineOffset: "5px",
})

globalStyle(within(`${directory.chip}[aria-pressed="true"]`), {
    color: marketing.color.text,
    textDecorationLine: "underline",
})

globalStyle(within(`${directory.chip} + ${directory.chip}::before`), {
    content: '"·"',
    display: "inline-block",
    margin: `0 ${scaledSpace(14)}`,
    color: marketing.color.subtle,
    textDecoration: "none",
})

// The ranks: headings in the Didone, portraits arched in a stone border.
globalStyle(within(directory.columnHeading), {
    fontSize: `calc(clamp(26px, 2.8vw, 34px) * ${marketing.display.scale})`,
})

globalStyle(within(directory.portrait), {
    padding: 6,
    border: `1px solid ${marketing.color.line}`,
    borderRadius: ARCH,
    background: marketing.color.surface,
    overflow: "visible",
    aspectRatio: "4 / 5",
})

globalStyle(within(directory.portraitImg), {
    borderRadius: ARCH,
})

globalStyle(within(directory.name), {
    fontStyle: "italic",
    fontSize: 23,
})

globalStyle(within(directory.specialties), {
    fontSize: 11,
    letterSpacing: "0.18em",
    color: marketing.color.text,
})

globalStyle(within(directory.rate), {
    fontSize: 16,
})

// The ask: one centered sentence over a squared button.
globalStyle(within(banner.card), {
    background: "none",
    border: 0,
    boxShadow: "none",
    paddingBlock: scaledSpace(36),
})

globalStyle(within(banner.title), {
    fontFamily: marketing.font.body,
    fontSize: "clamp(19px, 1.8vw, 23px)",
    fontWeight: 400,
    letterSpacing: 0,
    textTransform: "none",
})

globalStyle(within(`${banner.card} ${banner.cta}`), {
    borderRadius: 2,
    boxShadow: "none",
    fontFamily: marketing.font.body,
    fontSize: 17,
    letterSpacing: "0.02em",
    padding: "13px 30px",
})
