import { style, styleVariants } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

export const base = style({
    display: "inline-flex",
    alignItems: "center",
    height: "22px",
    padding: `0 ${vars.space.sm}`,
    borderRadius: vars.radius.pill,
    fontSize: vars.fontSize.xs,
    fontWeight: 600,
    fontFamily: vars.fontFamily.body,
    whiteSpace: "nowrap",
})

export const tone = styleVariants({
    neutral: {
        backgroundColor: vars.color.surfaceHover,
        color: vars.color.textSecondary,
    },
    success: {
        backgroundColor: vars.color.successSurface,
        color: vars.color.success,
    },
    danger: {
        backgroundColor: vars.color.dangerSurface,
        color: vars.color.danger,
    },
    accent: {
        backgroundColor: vars.color.surfaceHover,
        color: vars.color.accent,
    },
})
