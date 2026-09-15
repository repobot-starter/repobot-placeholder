import { style } from "@vanilla-extract/css"
import { marketing } from "./theme/marketingTheme.css"
import { scaledSpace } from "./theme/feelBridge"
import { section, sectionHeaderCentered, sectionKicker } from "./shared.css"

export const wrap = style([section, sectionHeaderCentered])

export const kicker = style([
    sectionKicker,
    {
        marginBottom: 24,
    },
])

export const strip = style({
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: `${scaledSpace(18)} ${scaledSpace(44)}`,
})

export const grid = style({
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
    gap: 12,
})

export const cell = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 76,
    padding: "16px 18px",
    background: marketing.color.surface,
    border: `${marketing.shape.borderWidth} solid ${marketing.color.line}`,
    borderRadius: marketing.shape.radiusCard,
    boxShadow: marketing.shape.shadowCard,
})

export const wordmark = style({
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontFamily: marketing.font.display,
    fontSize: 17,
    fontWeight: 700,
    letterSpacing: "0.02em",
    color: marketing.color.subtle,
})

export const emoji = style({
    fontSize: 20,
})

export const image = style({
    height: 28,
    width: "auto",
    display: "block",
})
