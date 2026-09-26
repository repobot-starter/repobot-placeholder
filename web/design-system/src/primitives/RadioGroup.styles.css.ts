import { style, styleVariants } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

export const group = style({
    display: "flex",
    border: "none",
    margin: 0,
    padding: 0,
    minWidth: 0,
})

export const orientation = styleVariants({
    vertical: { flexDirection: "column", gap: vars.space.sm },
    horizontal: { flexDirection: "row", flexWrap: "wrap", gap: vars.space.lg },
})

export const row = style({
    display: "inline-flex",
    alignItems: "flex-start",
    gap: vars.space.sm,
    cursor: "pointer",
    selectors: {
        "&[data-disabled]": { cursor: "not-allowed", opacity: 0.55 },
    },
})

/** Styled native radio: round box with an accent dot scaled in on :checked. */
export const dot = style({
    appearance: "none",
    margin: 0,
    width: "16px",
    height: "16px",
    flexShrink: 0,
    marginTop: "1px",
    boxSizing: "border-box",
    border: `1px solid ${vars.color.input}`,
    borderRadius: vars.radius.pill,
    backgroundColor: vars.color.surface,
    cursor: "inherit",
    display: "inline-grid",
    placeContent: "center",
    transition: `border-color ${vars.motion.durationFast} ${vars.motion.easing}, box-shadow ${vars.motion.durationFast} ${vars.motion.easing}`,
    selectors: {
        "&::before": {
            content: "",
            width: "8px",
            height: "8px",
            borderRadius: vars.radius.pill,
            backgroundColor: vars.color.accent,
            transform: "scale(0)",
            transition: `transform ${vars.motion.durationFast} ${vars.motion.easing}`,
        },
        "&:checked": {
            borderColor: vars.color.accent,
        },
        "&:checked::before": {
            transform: "scale(1)",
        },
        "&:focus-visible": {
            outline: "none",
            borderColor: vars.color.accent,
            boxShadow: vars.treatment.focusRing,
        },
    },
    "@media": {
        "(prefers-reduced-motion: reduce)": {
            transition: "none",
        },
    },
})

export const invalid = style({
    borderColor: vars.color.danger,
})

export const labelColumn = style({
    display: "grid",
    gap: "2px",
    fontFamily: vars.fontFamily.body,
})

export const labelText = style({
    fontSize: vars.fontSize.sm,
    color: vars.color.textPrimary,
    lineHeight: 1.35,
})

export const description = style({
    fontSize: vars.fontSize.xs,
    color: vars.color.textSecondary,
    lineHeight: 1.4,
})
