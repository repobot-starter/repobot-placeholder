import { style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { scaledSpace } from "./theme/feelBridge"
import { section, sectionHeaderCentered, sectionKicker, sectionTitle } from "./shared.css"

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
})

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
})

export const tierName = style({
    fontFamily: marketing.font.display,
    fontSize: 18,
    fontWeight: 700,
    color: marketing.color.text,
    margin: 0,
})

export const tierPrice = style({
    fontFamily: marketing.font.display,
    fontSize: 38,
    fontWeight: 700,
    letterSpacing: "-0.02em",
    color: marketing.color.text,
})

export const tierPeriod = style({
    fontSize: 14,
    fontWeight: 500,
    color: marketing.color.subtle,
})

export const tierDescription = style({
    fontSize: 14,
    color: marketing.color.subtle,
    margin: 0,
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
