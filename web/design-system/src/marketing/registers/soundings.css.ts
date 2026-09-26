import { globalStyle } from "@vanilla-extract/css"
import { marketing } from "../theme/marketingTheme.css"
import { scaledSpace } from "../theme/feelBridge"
import * as gallery from "../MarketingGallery.styles.css"
import * as hero from "../MarketingHero.styles.css"
import * as shell from "../MarketingShell.styles.css"
import * as showcase from "../MarketingShowcase.styles.css"
import * as proof from "../MarketingSocialProof.styles.css"
import { sectionTitle } from "../shared.css"

/*
 * `soundings` (worn with `framestack`): the waterfront plates. The hero
 * line is set light and small at the foot of the frame over a badge led
 * by a hairline, and its two asks are a pale square button and an
 * underlined link rather than two pills. Each `captionStack` `overlay-*`
 * caption reads as a plate label: the address in the display face, its
 * `detail` (the place, the price, the status) in small tracked caps
 * beneath. The metrics row is set like the depth soundings on a chart —
 * light display numerals between hairlines, the labels in small caps; the
 * nav links go to the same small caps and the section heads stay in the
 * light display cut. On
 * a phone the hero's copy lifts off the photograph onto the paper under
 * it, so the 4:3 frame keeps its subject and the line never sits on the
 * house.
 */
const S = '[data-marketing-treatment~="soundings"]'
const WHITE = "#ffffff" // theme-exempt: copy over a photographic scrim is white in every theme
const PHONE = "(max-width: 640px)"

// ---------------------------------------------------------------- the hero
globalStyle(`${S} ${hero.fullBleed} ${hero.headline}`, {
    fontSize: `calc(clamp(34px, 3.7vw, 58px) * ${marketing.display.scale})`,
    fontWeight: 300,
    lineHeight: 1.08,
    letterSpacing: "-0.01em",
    maxWidth: "15em",
    "@media": {
        [PHONE]: { fontSize: `calc(31px * ${marketing.display.scale})`, lineHeight: 1.1 },
    },
})

globalStyle(`${S} ${hero.fullBleedBadge}`, {
    display: "inline-flex",
    alignItems: "center",
    gap: 14,
    fontSize: 11.5,
    fontWeight: 500,
    letterSpacing: "0.24em",
    marginBottom: scaledSpace(20),
})

globalStyle(`${S} ${hero.fullBleedBadge}::before`, {
    content: '""',
    display: "block",
    width: 40,
    height: 1,
    background: "currentColor",
    opacity: 0.8,
})

globalStyle(`${S} ${hero.fullBleed} ${hero.subheadline}`, {
    fontSize: 15.5,
    fontWeight: 300,
    lineHeight: 1.6,
    maxWidth: "36em",
})

globalStyle(`${S} ${hero.fullBleed} ${hero.ctaRow}`, {
    alignItems: "center",
    gap: scaledSpace(26),
    marginTop: scaledSpace(26),
})

globalStyle(`${S} ${hero.fullBleed} ${hero.primary}`, {
    background: marketing.color.pageBg,
    color: marketing.color.text,
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    padding: "15px 26px",
})

globalStyle(`${S} ${hero.fullBleedSecondary}`, {
    border: "none",
    borderRadius: 0,
    padding: "4px 0",
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    textDecoration: "underline",
    textDecorationThickness: "1px",
    textUnderlineOffset: "7px",
})

// On a phone: the photograph as one 4:3 plate, the copy on the paper under it.
globalStyle(`${S} ${hero.fullBleed}`, {
    "@media": {
        [PHONE]: { display: "block", minHeight: 0, background: marketing.color.pageBg },
    },
})

globalStyle(`${S} ${hero.fullBleed} ${hero.fullBleedSlide}:first-child`, {
    "@media": {
        [PHONE]: { position: "relative", aspectRatio: "4 / 3" },
    },
})

globalStyle(`${S} ${hero.fullBleedScrim}`, {
    "@media": {
        [PHONE]: {
            bottom: "auto",
            height: "75vw",
            background: "linear-gradient(180deg, rgba(8, 10, 14, 0.34) 0%, rgba(8, 10, 14, 0) 42%)", // theme-exempt: keeps the floating nav's white ink legible over the photograph
        },
    },
})

globalStyle(`${S} ${hero.fullBleedInner}`, {
    "@media": {
        [PHONE]: { padding: "26px 22px 38px" },
    },
})

globalStyle(
    [hero.fullBleedHeadline, hero.fullBleedSubheadline, hero.fullBleedSecondary]
        .map((part) => `${S} ${hero.fullBleed} ${part}`)
        .join(", "),
    {
        "@media": {
            [PHONE]: { color: marketing.color.text },
        },
    },
)

globalStyle(`${S} ${hero.fullBleedBadge}`, {
    "@media": {
        [PHONE]: { color: marketing.color.subtle, marginBottom: 14 },
    },
})

globalStyle(`${S} ${hero.fullBleed} ${hero.primary}`, {
    "@media": {
        [PHONE]: { background: marketing.color.accent, color: marketing.color.onAccent },
    },
})

// ------------------------------------------------------------ the plates
globalStyle(`${S} ${gallery.overlayCaption}`, {
    paddingTop: scaledSpace(96),
    paddingBottom: scaledSpace(34),
    background: "linear-gradient(to top, rgba(8, 10, 14, 0.58), rgba(8, 10, 14, 0))", // theme-exempt: a scrim over photography, the same in every theme
    color: WHITE,
    fontFamily: marketing.font.display,
    fontSize: "clamp(22px, 2.1vw, 32px)",
    fontWeight: 300,
    lineHeight: 1.2,
    letterSpacing: "0",
    textTransform: "none",
    "@media": {
        [PHONE]: { fontSize: 19, letterSpacing: "0", paddingTop: 64, paddingBottom: 18, paddingInline: 20 },
    },
})

globalStyle(`${S} ${gallery.overlayCaption} ${gallery.stackCaptionDetail}`, {
    marginTop: 10,
    fontFamily: marketing.font.body,
    fontSize: 11.5,
    fontWeight: 500,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    opacity: 0.88,
    "@media": {
        [PHONE]: { fontSize: 10, letterSpacing: "0.14em", marginTop: 6 },
    },
})

// ------------------------------------------------------------ the soundings
globalStyle(`${S} ${proof.metricsRow}`, {
    gap: 0,
    alignItems: "stretch",
    padding: `${scaledSpace(64)} 0 ${scaledSpace(30)}`,
    "@media": {
        [PHONE]: { display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: 26, padding: "44px 0 16px" },
    },
})

globalStyle(`${S} ${proof.metricsRow} ${proof.label}`, {
    order: 2,
    marginTop: scaledSpace(30),
    fontSize: 11,
    fontWeight: 400,
    letterSpacing: "0.16em",
    "@media": {
        [PHONE]: { gridColumn: "1 / -1", marginTop: 8, lineHeight: 1.6 },
    },
})

globalStyle(`${S} ${proof.metric}`, {
    flex: "1 1 0",
    minWidth: 150,
    gap: 10,
    padding: `0 ${scaledSpace(20)}`,
    borderLeft: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    "@media": {
        [PHONE]: { minWidth: 0, padding: "0 12px" },
    },
})

globalStyle(`${S} ${proof.metric}:first-of-type`, {
    borderLeft: "none",
})

globalStyle(`${S} ${proof.metric}:nth-of-type(odd)`, {
    "@media": {
        [PHONE]: { borderLeft: "none" },
    },
})

globalStyle(`${S} ${proof.metricValue}`, {
    fontSize: "clamp(40px, 4.6vw, 64px)",
    fontWeight: 300,
    fontStyle: "italic",
    letterSpacing: "-0.02em",
    lineHeight: 1,
    color: marketing.color.text,
    "@media": {
        [PHONE]: { fontSize: 38 },
    },
})

globalStyle(`${S} ${proof.metricLabel}`, {
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.18em",
    textAlign: "center",
    lineHeight: 1.5,
})

// ------------------------------------------------------- the section heads
// framestack sets every section title in the body face for its prose
// bands; the plates page has none, so its heads keep the light display cut.
globalStyle(`${S}:has(${hero.fullBleed}) section ${sectionTitle}`, {
    fontFamily: marketing.font.display,
    fontSize: `calc(clamp(26px, 2.6vw, 38px) * ${marketing.display.scale})`,
    fontWeight: 300,
    letterSpacing: "-0.01em",
    lineHeight: 1.15,
    margin: `0 0 ${scaledSpace(36)}`,
})

// The listing cards keep the display face at the weights it is cut in.
globalStyle(`${S} ${showcase.itemTitle}, ${S} ${showcase.meta}`, {
    fontWeight: 400,
})

globalStyle(`${S} ${showcase.itemTitle}`, {
    fontSize: 19,
    lineHeight: 1.25,
})

// -------------------------------------------------------------- the wordmark
globalStyle(`${S} ${shell.logo}`, {
    fontFamily: marketing.font.display,
    fontSize: "clamp(19px, 1.6vw, 24px)",
    fontWeight: 400,
    letterSpacing: "0.01em",
})

globalStyle(`${S} ${shell.links}`, {
    gap: 34,
    fontSize: 11.5,
    fontWeight: 500,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
})
