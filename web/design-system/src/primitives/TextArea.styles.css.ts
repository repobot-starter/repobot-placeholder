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
    border: `1px solid ${vars.color.input}`,
    borderRadius: vars.radius.md,
    fontFamily: vars.fontFamily.body,
    fontSize: vars.fontSize.sm,
    lineHeight: 1.45,
    resize: "vertical",
    transition: `border-color ${vars.motion.durationFast} ${vars.motion.easing}, box-shadow ${vars.motion.durationFast} ${vars.motion.easing}`,
    selectors: {
        "&::placeholder": { color: vars.color.textSecondary },
        "&:focus": {
            outline: "none",
            borderColor: vars.color.accent,
            boxShadow: vars.treatment.focusRing,
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
