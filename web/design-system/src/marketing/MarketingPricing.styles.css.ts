import { globalStyle, style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { scaledSpace } from "./theme/feelBridge"
import {
    MASKING_TAPE,
    POP,
    TAPED_ROOT,
    TAPE_CLIP,
    pulpExtrude,
    scriptFont,
    section,
    sectionHeaderCentered,
    sectionKicker,
    sectionTitle,
    spot1,
    spot2,
} from "./shared.css"

export const wrap = style([section, sectionHeaderCentered])

export const kicker = sectionKicker

export const title = sectionTitle

export const billingToggle = style({
    display: "flex",
    justifyContent: "center",
    gap: 6,
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: 999,
    padding: 4,
    width: "fit-content",
    margin: "0 auto 34px",
})

export const billingOption = style({
    fontSize: 14,
    fontWeight: 650,
    fontFamily: "inherit",
    color: marketing.color.subtle,
    background: "transparent",
    border: "none",
    borderRadius: 999,
    padding: "8px 18px",
    cursor: "pointer",
    selectors: {
        '&[aria-pressed="true"]': {
            color: marketing.color.onAccent,
            background: marketing.color.accent,
        },
    },
})

export const grid = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: scaledSpace(18),
    alignItems: "stretch",
    textAlign: "left",
    selectors: {
        [POP]: { gap: scaledSpace(30), paddingTop: 10 },
    },
})

/** Trading-card frame: an inset band of the card's ink plus the hard ink offset. */
const cardFrame = (ink: string) => `inset 0 0 0 10px ${ink}, 6px 6px 0 ${marketing.color.line}`

export const tierCard = style({
    display: "flex",
    flexDirection: "column",
    gap: 14,
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
    padding: `${scaledSpace(26)} ${scaledSpace(24)}`,
    selectors: {
        '&[data-highlighted="true"]': {
            borderColor: marketing.color.accent,
            boxShadow: marketing.shape.shadowCta,
        },
        [POP]: {
            position: "relative",
            gap: 12,
            borderColor: marketing.color.line,
            padding: `${scaledSpace(34)} ${scaledSpace(30)} ${scaledSpace(30)}`,
        },
        [`${POP}:nth-child(3n+1)`]: { boxShadow: cardFrame(spot1) },
        [`${POP}:nth-child(3n+2)`]: { boxShadow: cardFrame(marketing.color.accent) },
        [`${POP}:nth-child(3n)`]: { boxShadow: cardFrame(spot2) },
        [`${POP}[data-highlighted="true"]`]: { borderColor: marketing.color.line },
    },
})

export const tierBadge = style({
    alignSelf: "flex-start",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: marketing.color.onAccent,
    background: marketing.color.accent,
    borderRadius: 999,
    padding: "4px 10px",
    selectors: {
        [POP]: {
            position: "absolute",
            top: -16,
            right: 18,
            fontFamily: marketing.font.display,
            fontStyle: "italic",
            fontWeight: 900,
            fontSize: 13,
            letterSpacing: "0.04em",
            color: "#141414", // theme-exempt: ink on the lemon sticker reads in both appearances
            background: spot2,
            border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
            borderRadius: 6,
            boxShadow: `3px 3px 0 ${marketing.color.line}`,
            padding: "6px 12px 5px",
            transform: "rotate(4deg)",
        },
    },
})

export const tierName = style({
    fontFamily: marketing.font.display,
    fontSize: 18,
    fontWeight: 700,
    color: marketing.color.text,
    margin: 0,
    selectors: {
        [POP]: {
            fontStyle: "italic",
            fontWeight: 900,
            fontSize: "clamp(30px, 3.2vw, 40px)",
            lineHeight: 1,
            textTransform: "uppercase",
            marginTop: 4,
        },
    },
})

export const tierPrice = style({
    fontFamily: marketing.font.display,
    fontSize: 38,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    color: marketing.color.text,
    selectors: {
        // The price on an ink banner, skewed like a sale tag.
        [POP]: {
            alignSelf: "flex-start",
            fontStyle: "italic",
            fontWeight: 900,
            fontSize: 52,
            lineHeight: 1,
            color: marketing.color.pageBg,
            background: marketing.color.text,
            padding: "8px 20px 6px 16px",
            transform: "skewX(-8deg)",
            boxShadow: `4px 4px 0 ${marketing.color.accent}`,
        },
    },
})

export const tierPrefix = style({
    fontSize: "0.42em",
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: marketing.color.subtle,
    selectors: {
        [POP]: { color: "inherit", fontWeight: 900 },
    },
})

export const tierPeriod = style({
    fontSize: 14,
    fontWeight: 500,
    color: marketing.color.subtle,
    selectors: {
        [POP]: { color: "inherit", opacity: 0.8 },
    },
})

export const tierDescription = style({
    fontSize: 14,
    color: marketing.color.subtle,
    margin: 0,
    selectors: {
        [POP]: {
            fontFamily: marketing.font.display,
            fontStyle: "italic",
            fontWeight: 800,
            fontSize: 15,
            lineHeight: 1.3,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            color: marketing.color.text,
        },
    },
})

export const tierFeatures = style({
    listStyle: "none",
    display: "flex",
    flexDirection: "column",
    gap: 9,
    padding: 0,
    margin: 0,
    fontSize: 14,
    color: marketing.color.text,
    selectors: {
        "&:empty": { display: "none" },
    },
})

export const tierFeatureItem = style({
    display: "flex",
    gap: 9,
    alignItems: "baseline",
    selectors: {
        "&::before": {
            content: '"✓"',
            color: marketing.color.accent,
            fontWeight: 700,
        },
    },
})

/*
 * `pulp` (creature): each tier a lobby card — the poster cream as a heavy
 * mount, the hard ink drop, the price in extruded poster caps, the badge a
 * spot-ink sticker. The top-billed tier takes the accent mount and leans.
 */
const PULP_ROOT = '[data-marketing-treatment~="pulp"]'

globalStyle(`${PULP_ROOT} ${grid}`, { gap: scaledSpace(30), paddingTop: 12 })

globalStyle(`${PULP_ROOT} ${tierCard}`, {
    position: "relative",
    gap: 12,
    border: `3px solid ${spot2}`,
    boxShadow: marketing.shape.shadowCard,
    padding: `${scaledSpace(32)} ${scaledSpace(28)} ${scaledSpace(28)}`,
})

globalStyle(`${PULP_ROOT} ${tierCard}[data-highlighted="true"]`, {
    borderColor: marketing.color.accent,
    boxShadow: `inset 0 0 0 3px ${marketing.color.surface}, inset 0 0 0 5px ${marketing.color.accent}, ${marketing.shape.shadowCard}`,
    transform: "rotate(-1.2deg)",
})

globalStyle(`${PULP_ROOT} ${tierBadge}`, {
    position: "absolute",
    top: -17,
    right: 18,
    fontFamily: marketing.font.display,
    fontWeight: 400,
    fontSize: 17,
    letterSpacing: "0.08em",
    color: marketing.color.pageBg,
    background: spot1,
    borderRadius: 2,
    boxShadow: marketing.shape.shadowCta,
    padding: "6px 12px 4px",
    transform: "rotate(4deg)",
})

globalStyle(`${PULP_ROOT} ${tierName}`, {
    fontWeight: 400,
    fontSize: "clamp(24px, 2.4vw, 30px)",
    letterSpacing: "0.05em",
    lineHeight: 1,
    textTransform: "uppercase",
    color: spot1,
})

globalStyle(`${PULP_ROOT} ${tierPrice}`, {
    fontWeight: 400,
    fontSize: "clamp(62px, 6.4vw, 84px)",
    letterSpacing: "0.01em",
    lineHeight: 0.92,
    textShadow: pulpExtrude(4),
})

globalStyle(`${PULP_ROOT} ${tierPrefix}`, {
    fontWeight: 400,
    fontSize: "0.3em",
    letterSpacing: "0.1em",
    color: marketing.color.text,
    textShadow: "none",
    verticalAlign: "1.4em",
})

globalStyle(`${PULP_ROOT} ${tierPeriod}`, {
    fontSize: 24,
    fontWeight: 400,
    letterSpacing: "0.04em",
    color: marketing.color.accent,
    textShadow: "none",
})

globalStyle(`${PULP_ROOT} ${tierDescription}`, {
    fontSize: 16,
    fontWeight: 700,
    fontStyle: "italic",
    color: marketing.color.text,
})

globalStyle(`${PULP_ROOT} ${tierFeatureItem}::before`, { content: '"★"', color: spot1 })

/*
 * `taped` tiers: ruled index cards taped up side by side, the tier name
 * written in marker over the red header rule, the price in the shouted
 * caps, the badge a sticky note slapped on the corner.
 */
const INDEX_RULE_TOP = 96

globalStyle(`${TAPED_ROOT} ${grid}`, { gap: scaledSpace(30), paddingTop: 18 })

globalStyle(`${TAPED_ROOT} ${tierCard}`, {
    position: "relative",
    gap: 10,
    border: "none",
    borderRadius: 2,
    boxShadow: marketing.shape.shadowCard,
    padding: `${scaledSpace(26)} ${scaledSpace(26)} ${scaledSpace(30)}`,
    backgroundImage: `linear-gradient(transparent ${INDEX_RULE_TOP}px, color-mix(in srgb, ${marketing.color.accent} 55%, transparent) ${INDEX_RULE_TOP}px, color-mix(in srgb, ${marketing.color.accent} 55%, transparent) ${INDEX_RULE_TOP + 2}px, transparent ${INDEX_RULE_TOP + 2}px)`,
    backgroundRepeat: "no-repeat",
    transform: "rotate(-1.2deg)",
})

globalStyle(`${TAPED_ROOT} ${tierCard}:nth-child(even)`, { transform: "rotate(0.7deg)" })
globalStyle(`${TAPED_ROOT} ${tierCard}:nth-child(3n)`, { transform: "rotate(1.4deg)" })

globalStyle(`${TAPED_ROOT} ${tierCard}[data-highlighted="true"]`, {
    boxShadow: `0 22px 44px -18px color-mix(in srgb, ${marketing.color.text} 45%, transparent)`,
})

globalStyle(`${TAPED_ROOT} ${tierCard}::before`, {
    content: '""',
    position: "absolute",
    top: -14,
    left: "50%",
    width: 118,
    height: 28,
    background: MASKING_TAPE,
    clipPath: TAPE_CLIP,
    transform: "translateX(-50%) rotate(-3deg)",
    pointerEvents: "none",
})

globalStyle(`${TAPED_ROOT} ${tierBadge}`, {
    position: "absolute",
    top: -20,
    right: -12,
    fontFamily: scriptFont,
    fontSize: 20,
    fontWeight: 400,
    letterSpacing: 0,
    textTransform: "none",
    color: marketing.color.text,
    background: spot1,
    borderRadius: 1,
    padding: "10px 14px 8px",
    boxShadow: `0 8px 16px -8px color-mix(in srgb, ${marketing.color.text} 50%, transparent)`,
    transform: "rotate(7deg)",
})

globalStyle(`${TAPED_ROOT} ${tierName}`, {
    fontFamily: scriptFont,
    fontSize: 30,
    fontWeight: 400,
    lineHeight: 1,
    color: marketing.color.accent,
})

globalStyle(`${TAPED_ROOT} ${tierPrice}`, {
    fontSize: 60,
    fontWeight: 900,
    lineHeight: 1,
    letterSpacing: 0,
    marginBottom: 6,
})

globalStyle(`${TAPED_ROOT} ${tierDescription}`, {
    fontSize: 14.5,
    lineHeight: 1.5,
    color: marketing.color.text,
})

globalStyle(`${TAPED_ROOT} ${tierFeatures}`, { gap: 8, fontSize: 14.5 })

globalStyle(`${TAPED_ROOT} ${tierFeatureItem}`, { gap: 10 })

globalStyle(`${TAPED_ROOT} ${tierFeatureItem}::before`, {
    fontFamily: scriptFont,
    fontSize: 21,
    fontWeight: 400,
})
