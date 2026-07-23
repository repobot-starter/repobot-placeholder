import { style } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

export const textArea = style({
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    minHeight: "80px",
    padding: vars.space.sm,
    backgroundColor: vars.color.surface,
    color: vars.color.textPrimary,
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.md,
    fontFamily: vars.fontFamily.body,
    fontSize: vars.fontSize.sm,
    lineHeight: 1.45,
    resize: "vertical",
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
