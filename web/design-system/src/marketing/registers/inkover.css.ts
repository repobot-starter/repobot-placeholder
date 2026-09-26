import { globalStyle } from "@vanilla-extract/css"
import { marketing } from "../theme/marketingTheme.css"
import * as hero from "../MarketingHero.styles.css"
import * as shell from "../MarketingShell.styles.css"

/*
 * `inkover`: the full-bleed hero over a pale photograph — fog, snow,
 * limewash, a white room. White copy on a dark scrim would grey the
 * frame, so the copy takes the page ink and the scrim becomes a wash of
 * the page ground: strongest at the lower left where the copy sits, a
 * breath at the top under the nav, and clear over the subject. With
 * `framestack` the floating nav (chromeless until the page scrolls)
 * takes the page ink too. Pick a photograph that is pale where the copy
 * lands.
 */
const IO = '[data-marketing-treatment~="inkover"]'
const CLEAR = `${IO}:has(${hero.fullBleed}) ${shell.bar}:not(${shell.barScrolled}):not(${shell.barFlushScrolled}):not(${shell.barFullWidthScrolled})`

globalStyle(`${IO} ${hero.fullBleed}`, {
    background: marketing.color.pageBg,
})

globalStyle(`${IO} ${hero.fullBleedScrim}`, {
    background:
        `radial-gradient(115% 95% at 0% 100%, color-mix(in srgb, ${marketing.color.pageBg} 80%, transparent) 0%, ` +
        `color-mix(in srgb, ${marketing.color.pageBg} 42%, transparent) 42%, transparent 70%), ` +
        `linear-gradient(180deg, color-mix(in srgb, ${marketing.color.pageBg} 55%, transparent) 0%, transparent 22%)`,
})

globalStyle(`${IO} ${hero.fullBleedHeadline}`, {
    color: marketing.color.text,
})

// The copy stays in the pale corner, clear of the subject: a short measure,
// and on a phone a portrait crop held on the right of the frame, where a
// pale-left photograph keeps its subject.
globalStyle(`${IO} ${hero.fullBleed} ${hero.fullBleedHeadline}`, {
    maxWidth: "8.5em",
})

globalStyle(`${IO} ${hero.fullBleed}`, {
    "@media": {
        "(max-width: 640px)": { minHeight: "min(128vw, 80svh)" },
    },
})

globalStyle(`${IO} ${hero.fullBleedImg}`, {
    "@media": {
        "(max-width: 640px)": { objectPosition: "72% 50%" },
    },
})

globalStyle(`${IO} ${hero.fullBleed} ${hero.subheadline}`, {
    color: marketing.color.text,
})

globalStyle(`${IO} ${hero.fullBleedBadge}, ${IO} ${hero.fullBleedCredit}, ${IO} ${hero.fullBleedCaption}`, {
    color: marketing.color.subtle,
})

// ---------------------------------------------------------- the nav (framestack)
globalStyle(CLEAR, {
    color: marketing.color.text,
    textShadow: "none",
})

globalStyle(
    [shell.logo, shell.logoMarked, shell.logoTagline, shell.links, shell.link, shell.linkUnderline]
        .map((part) => `${CLEAR} ${part}`)
        .join(", "),
    { color: marketing.color.text },
)

globalStyle(`${CLEAR} ${shell.burger}`, {
    color: marketing.color.text,
    borderColor: marketing.color.line,
})

globalStyle(`${CLEAR} ${shell.cta}`, {
    color: marketing.color.text,
    border: `1px solid color-mix(in srgb, ${marketing.color.text} 55%, transparent)`,
})
