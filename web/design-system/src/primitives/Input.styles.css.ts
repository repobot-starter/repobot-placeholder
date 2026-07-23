import { style } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

export const input = style({
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    height: "34px",
    padding: `0 ${vars.space.md}`,
    backgroundColor: vars.color.surface,
    color: vars.color.textPrimary,
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.md,
    fontFamily: vars.fontFamily.body,
    fontSize: vars.fontSize.sm,
    transition: "border-color 120ms ease, box-shadow 120ms ease",
    selectors: {
        "&::placeholder": { color: vars.color.textSecondary },
        "&:focus": {
            outline: "none",
            borderColor: vars.color.accent,
            boxShadow: `0 0 0 3px ${vars.color.surfaceHover}`,
        },
        "&:disabled": {
            opacity: 0.55,
            cursor: "not-allowed",
        },
    },
})

export const invalid = style({
    borderColor: vars.color.danger,
})
