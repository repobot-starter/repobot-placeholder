import { style, styleVariants } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

export const base = style({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    borderRadius: vars.radius.pill,
    fontFamily: vars.fontFamily.body,
    fontWeight: 600,
    letterSpacing: "0.02em",
    userSelect: "none",
    objectFit: "cover",
})

export const sizes = styleVariants({
    xs: { width: "20px", height: "20px", fontSize: "9px" },
    sm: { width: "24px", height: "24px", fontSize: "10px" },
    md: { width: "32px", height: "32px", fontSize: vars.fontSize.xs },
    lg: { width: "40px", height: "40px", fontSize: vars.fontSize.sm },
})

/**
 * Tinted monogram hues off the theme's chart ramp — on a monochrome ramp
 * they read as accent shades, on a multi-hue ramp they differentiate.
 */
export const hues = ([1, 2, 3, 4, 5, 6] as const).map((slot) =>
    style({
        color: vars.chart[slot],
        backgroundColor: `color-mix(in srgb, ${vars.chart[slot]} 16%, transparent)`,
    }),
)

export const HUE_COUNT = hues.length
