import { globalStyle } from "@vanilla-extract/css"
import * as banner from "../MarketingCtaBanner.styles.css"
import * as hero from "../MarketingHero.styles.css"
import * as proof from "../MarketingSocialProof.styles.css"
import * as steps from "../MarketingSteps.styles.css"
import * as testimonials from "../MarketingTestimonials.styles.css"
import { sectionKicker } from "../shared.css"
import { scaledSpace } from "../theme/feelBridge"
import { marketing } from "../theme/marketingTheme.css"

/*
 * `ritual` (cognac): the ritual room. The full-bleed headline keeps the
 * author's line breaks; section kickers hang between two long rules; the
 * steps rail becomes a numbered strip — the photograph, then the step
 * number, its name and its minutes, hairlines between the steps; the one
 * testimonial is centered in italic between rules over a tracked-caps
 * credit; the rates read as one still dotted line; the ask is a squared
 * plate with an arrow.
 */
const ROOT = '[data-marketing-treatment~="ritual"]'
const within = (target: string): string => `${ROOT} ${target}`

const RULE = `1px solid ${marketing.color.line}`

const TRACKED = {
    fontFamily: marketing.font.body,
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
} as const

// Hero: the display serif broken where the author broke it.
globalStyle(within(hero.fullBleedHeadline), {
    whiteSpace: "pre-line",
    lineHeight: 0.98,
})

// The sitter sits right of center; keep her in frame on narrow screens.
globalStyle(within(hero.fullBleedImg), {
    objectPosition: "66% 40%",
})

globalStyle(within(hero.fullBleedCredit), {
    fontFamily: marketing.font.body,
    fontSize: "clamp(15px, 1.3vw, 18px)",
    fontWeight: 400,
    letterSpacing: "0.01em",
    textTransform: "none",
})

// Kickers between two long rules.
globalStyle(within(sectionKicker), {
    ...TRACKED,
    display: "flex",
    alignItems: "center",
    gap: scaledSpace(20),
    width: "100%",
    color: marketing.color.text,
    background: "none",
    padding: 0,
})

globalStyle(within(`${sectionKicker}::before, ${ROOT} ${sectionKicker}::after`), {
    content: '""',
    flex: "1 1 auto",
    borderTop: RULE,
})

// The ritual: a numbered strip, hairlines between the steps.
globalStyle(within(steps.titleRail), {
    textAlign: "center",
    marginInline: "auto",
})

globalStyle(within(steps.rail), {
    gap: 0,
})

globalStyle(within(`${steps.railItem}::before`), {
    display: "none",
})

globalStyle(within(steps.railItem), {
    padding: `0 ${scaledSpace(14)}`,
    textAlign: "center",
    alignItems: "center",
})

globalStyle(within(`${steps.railItem} + ${steps.railItem}`), {
    borderLeft: RULE,
})

globalStyle(within(steps.railMedia), {
    order: -1,
    width: "100%",
    aspectRatio: "1 / 1",
    marginBottom: scaledSpace(14),
})

globalStyle(within(steps.railMark), {
    alignItems: "center",
    marginBottom: scaledSpace(6),
})

globalStyle(within(steps.railDot), {
    display: "none",
})

globalStyle(within(steps.railLabel), {
    fontFamily: marketing.font.display,
    fontSize: "clamp(22px, 2vw, 28px)",
    letterSpacing: 0,
    color: marketing.color.text,
})

globalStyle(within(steps.railTitle), {
    fontFamily: marketing.font.body,
    fontSize: 17,
    fontWeight: 400,
    lineHeight: 1.3,
})

globalStyle(within(steps.railDuration), {
    fontSize: 15,
    letterSpacing: 0,
    color: marketing.color.text,
})

globalStyle(within(`${steps.railItem} ${steps.stepDescription}`), {
    fontSize: 14,
    color: marketing.color.subtle,
})

// The one voice: italic, centered between rules, a tracked credit.
globalStyle(within(testimonials.featured), {
    borderTop: RULE,
    borderBottom: RULE,
    paddingBlock: scaledSpace(34),
    textAlign: "center",
})

globalStyle(within(testimonials.featuredQuote), {
    fontFamily: marketing.font.body,
    fontStyle: "italic",
    fontWeight: 400,
    fontSize: "clamp(19px, 2vw, 25px)",
    lineHeight: 1.45,
    textWrap: "balance",
})

globalStyle(within(testimonials.featuredAttribution), {
    justifyContent: "center",
})

globalStyle(within(`${testimonials.featuredAttribution} ${testimonials.author}`), {
    ...TRACKED,
    fontSize: 11.5,
    color: marketing.color.subtle,
})

globalStyle(within(`${testimonials.featuredAttribution} ${testimonials.author}::before`), {
    content: '"— "',
})

// The rates: one still line, the items joined by dots.
globalStyle(within(proof.tickerWrap), {
    display: "flex",
    justifyContent: "center",
    padding: `${scaledSpace(26)} 0 0`,
    border: "none",
    background: "none",
})

globalStyle(within(proof.tickerLabel), {
    position: "absolute",
    width: 1,
    height: 1,
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    whiteSpace: "nowrap",
    margin: 0,
})

globalStyle(within(`${proof.tickerWrap} ${proof.marqueeViewport}`), {
    maskImage: "none",
    WebkitMaskImage: "none",
    overflow: "visible",
    width: `min(${marketing.layout.maxWidth}, 100%)`,
    padding: "0 24px",
})

globalStyle(within(proof.tickerTrack), {
    animation: "none",
    width: "auto",
    justifyContent: "center",
})

globalStyle(within(`${proof.tickerTrack} ${proof.marqueeGroup}[aria-hidden]`), { display: "none" })

globalStyle(within(`${proof.tickerTrack} ${proof.marqueeGroup}`), {
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "baseline",
    gap: "4px 18px",
    padding: 0,
})

globalStyle(within(proof.tickerItem), {
    fontFamily: marketing.font.body,
    fontSize: "clamp(17px, 1.6vw, 20px)",
    fontWeight: 400,
    letterSpacing: "0.01em",
    textTransform: "none",
    lineHeight: 1.4,
    color: marketing.color.text,
    WebkitTextStroke: "0",
})

globalStyle(within(proof.tickerSeparator), {
    fontSize: 0,
    alignSelf: "baseline",
})

globalStyle(within(`${proof.tickerSeparator}::after`), {
    content: '"•"',
    fontSize: 13,
    color: marketing.color.subtle,
})

globalStyle(within(`${proof.marqueeGroup} > ${proof.tickerSeparator}:last-child`), { display: "none" })

globalStyle(within(`${proof.tickerTrack} ${proof.marqueeGroup}`), {
    "@media": { "(max-width: 640px)": { flexDirection: "column", alignItems: "center" } },
})

globalStyle(within(proof.tickerSeparator), {
    "@media": { "(max-width: 640px)": { display: "none" } },
})

// The ask: a squared plate with an arrow.
globalStyle(within(banner.card), {
    background: "none",
    border: 0,
    boxShadow: "none",
    paddingBlock: scaledSpace(34),
})

globalStyle(within(`${banner.card} ${banner.cta}`), {
    borderRadius: 2,
    boxShadow: "none",
    fontFamily: marketing.font.body,
    fontSize: 18,
    fontWeight: 400,
    letterSpacing: "0.02em",
    padding: "13px 28px",
})

globalStyle(within(`${banner.card} ${banner.cta}::after`), {
    content: '"→"',
    marginLeft: "0.8em",
})
