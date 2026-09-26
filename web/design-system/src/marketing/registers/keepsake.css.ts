import { globalStyle } from "@vanilla-extract/css"
import * as banner from "../MarketingCtaBanner.styles.css"
import * as hero from "../MarketingHero.styles.css"
import * as proof from "../MarketingSocialProof.styles.css"
import * as steps from "../MarketingSteps.styles.css"
import { scriptFont } from "../shared.css"
import { scaledSpace } from "../theme/feelBridge"
import { marketing } from "../theme/marketingTheme.css"

/*
 * `keepsake` (daybook): the wedding morning as an album. The hero's credit
 * is written under the headline in script; the photographic timeline sets
 * each hour large and light over its title, the hour's photographs as one
 * run of equal prints, and the line written under them; the rate sits
 * still on one line; a heart on a hairline heads the places the team
 * travels to; the closing ask is a single pill.
 */
const ROOT = '[data-marketing-treatment~="keepsake"]'
const within = (target: string): string => `${ROOT} ${target}`

const NODE = 11
const NODE_GAP = 22
const INDENT = NODE + NODE_GAP

// Hero: a light headline broken where the author broke it, the credit in
// script.
globalStyle(within(`${hero.headline}${hero.fullBleedHeadline}`), {
    whiteSpace: "pre-line",
    lineHeight: 1.02,
})

globalStyle(within(hero.fullBleedCredit), {
    fontFamily: scriptFont,
    fontSize: "clamp(24px, 2.6vw, 34px)",
    fontWeight: 400,
    letterSpacing: 0,
    textTransform: "none",
    lineHeight: 1.3,
    color: "rgba(255, 255, 255, 0.92)", // theme-exempt: copy over a photographic scrim is white in every theme
    margin: `${scaledSpace(10)} 0 0`,
})

// Timeline: the hour and its title in the left column, the prints and the
// written line on the right; the line and its nodes run down the far left.
globalStyle(within(steps.timelinePhotoItem), {
    gridTemplateColumns: "minmax(0, 200px) minmax(0, 1fr)",
    gridTemplateAreas: '"mark media" "title media" ". media" ". caption"',
    gridTemplateRows: "auto auto 1fr auto",
    columnGap: scaledSpace(28),
    rowGap: 6,
    paddingBottom: scaledSpace(40),
    "@media": {
        "(max-width: 860px)": {
            gridTemplateColumns: "minmax(0, 1fr)",
            gridTemplateAreas: '"mark" "title" "media" "caption"',
            gridTemplateRows: "auto",
            rowGap: 8,
        },
    },
})

globalStyle(within(`${steps.timelinePhotoItem}:not([data-pictured="true"])`), {
    gridTemplateAreas: '"mark caption" "title caption"',
    "@media": {
        "(max-width: 860px)": { gridTemplateAreas: '"mark" "title" "caption"' },
    },
})

globalStyle(within(`${steps.timelinePhotoItem}:not(:last-child)::before`), {
    left: (NODE - 1) / 2,
    top: 28,
    "@media": { "(max-width: 860px)": { left: (NODE - 1) / 2 } },
})

globalStyle(within(steps.timelineMark), {
    flexDirection: "row",
    gap: NODE_GAP,
    minHeight: 44,
})

globalStyle(within(steps.timelineNode), {
    marginRight: 0,
    border: "none",
    background: marketing.color.accent,
    opacity: 0.7,
})

globalStyle(within(steps.timelineLabel), {
    fontSize: "clamp(34px, 3.4vw, 46px)",
    fontWeight: 300,
    letterSpacing: "-0.01em",
    color: marketing.color.subtle,
    marginRight: 0,
})

globalStyle(within(steps.timelineCopy), { display: "contents" })

globalStyle(within(steps.timelineTitle), {
    gridArea: "title",
    fontFamily: marketing.font.body,
    fontSize: 17,
    fontWeight: 400,
    letterSpacing: 0,
    margin: `0 0 0 ${INDENT}px`,
})

globalStyle(within(steps.timelineDescription), {
    gridArea: "caption",
    fontFamily: scriptFont,
    fontSize: "clamp(22px, 2vw, 27px)",
    lineHeight: 1.25,
    color: `color-mix(in srgb, ${marketing.color.accent} 78%, ${marketing.color.text})`,
    margin: `${scaledSpace(6)} 0 0`,
    "@media": { "(max-width: 860px)": { marginLeft: INDENT } },
})

globalStyle(within(steps.timelineMedia), {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 8,
    "@media": { "(max-width: 860px)": { marginLeft: INDENT } },
})

globalStyle(within(`${steps.timelineMedia}:has(> :nth-child(2):last-child)`), {
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
})

globalStyle(within(`${steps.timelineMedia}:has(> :nth-child(4):last-child)`), {
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    "@media": { "(max-width: 860px)": { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" } },
})

globalStyle(within(`${steps.timelineLead}, ${ROOT} ${steps.timelineFrame}`), {
    aspectRatio: "4 / 3",
    borderRadius: 2,
})

// A lone print takes the whole run, as a wide frame.
globalStyle(within(`${steps.timelineLead}:only-child`), {
    gridColumn: "1 / -1",
    aspectRatio: "12 / 5",
})

// The rate: one still line in the body face, the items joined by a plus.
globalStyle(within(proof.tickerWrap), {
    display: "flex",
    justifyContent: "center",
    padding: `${scaledSpace(28)} 0 0`,
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
    gap: "4px 14px",
    padding: 0,
})

globalStyle(within(proof.tickerItem), {
    fontFamily: marketing.font.body,
    fontSize: "clamp(18px, 1.7vw, 22px)",
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
    content: '"+"',
    fontFamily: marketing.font.body,
    fontSize: "clamp(18px, 1.7vw, 22px)",
    fontWeight: 300,
    color: marketing.color.subtle,
})

globalStyle(within(`${proof.marqueeGroup} > ${proof.tickerSeparator}:last-child`), { display: "none" })

// The places: a heart on a hairline, then the names set plainly with dots.
globalStyle(within(proof.strip), {
    gap: "6px 12px",
    padding: `${scaledSpace(18)} 0 ${scaledSpace(8)}`,
})

globalStyle(within(`${proof.strip}::before`), {
    content: '""',
    order: -1,
    flex: "0 0 100%",
    height: 22,
    marginBottom: scaledSpace(8),
    background: "var(--marketing-ornament) center / min(360px, 90%) auto no-repeat",
})

globalStyle(within(`${proof.strip} ${proof.label}`), {
    position: "absolute",
    width: 1,
    height: 1,
    overflow: "hidden",
    clip: "rect(0 0 0 0)",
    whiteSpace: "nowrap",
    margin: 0,
})

globalStyle(within(`${proof.strip} ${proof.item}`), {
    fontFamily: marketing.font.body,
    fontSize: "clamp(16px, 1.5vw, 19px)",
    fontWeight: 400,
    letterSpacing: "0.01em",
    textTransform: "none",
    color: marketing.color.text,
})

globalStyle(within(`${proof.strip} ${proof.item} + ${proof.item}::before`), {
    content: '"·"',
    marginRight: 12,
    color: marketing.color.subtle,
})

// The ask: no card, a light title, the pill with its arrow.
globalStyle(within(banner.card), {
    background: "none",
    border: "none",
    boxShadow: "none",
    padding: `${scaledSpace(28)} 24px`,
    marginTop: scaledSpace(24),
})

globalStyle(within(`${banner.card} ${banner.cta}::after`), {
    content: '"→"',
    marginLeft: 12,
})
