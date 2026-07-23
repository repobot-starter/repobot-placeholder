import { style, styleVariants } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

export const base = style({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: vars.space.xs,
    border: "1px solid transparent",
    borderRadius: vars.radius.md,
    fontFamily: vars.fontFamily.body,
    fontWeight: 600,
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "background-color 120ms ease, border-color 120ms ease, color 120ms ease",
    selectors: {
        "&:disabled": {
            opacity: 0.55,
            cursor: "not-allowed",
        },
        "&:focus-visible": {
            outline: `2px solid ${vars.color.accent}`,
            outlineOffset: "2px",
        },
    },
})

export const variant = styleVariants({
    primary: {
        backgroundColor: vars.color.accent,
        color: vars.color.accentText,
        selectors: {
            "&:hover:not(:disabled)": { backgroundColor: vars.color.accentHover },
        },
    },
    secondary: {
        backgroundColor: vars.color.surface,
        color: vars.color.textPrimary,
        borderColor: vars.color.border,
        selectors: {
            "&:hover:not(:disabled)": { backgroundColor: vars.color.surfaceHover },
        },
    },
    ghost: {
        backgroundColor: "transparent",
        color: vars.color.textSecondary,
        selectors: {
            "&:hover:not(:disabled)": {
                backgroundColor: vars.color.surfaceHover,
                color: vars.color.textPrimary,
            },
        },
    },
    danger: {
        backgroundColor: vars.color.danger,
        color: vars.color.surface,
        selectors: {
            "&:hover:not(:disabled)": { opacity: 0.9 },
        },
    },
})

export const size = styleVariants({
    sm: {
        height: "28px",
        padding: `0 ${vars.space.sm}`,
        fontSize: vars.fontSize.xs,
    },
    md: {
        height: "34px",
        padding: `0 ${vars.space.md}`,
        fontSize: vars.fontSize.sm,
    },
    lg: {
        height: "40px",
        padding: `0 ${vars.space.lg}`,
        fontSize: vars.fontSize.md,
    },
})
