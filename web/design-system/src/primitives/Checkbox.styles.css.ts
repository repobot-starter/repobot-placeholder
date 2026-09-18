import { style } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

export const row = style({
    display: "inline-flex",
    alignItems: "flex-start",
    gap: vars.space.sm,
    cursor: "pointer",
    selectors: {
        "&[data-disabled]": { cursor: "not-allowed", opacity: 0.55 },
    },
})

/**
 * A styled native input: `appearance: none` keeps keyboard and form
 * semantics while the box, check, and focus ring come from the tokens.
 */
export const box = style({
    appearance: "none",
    margin: 0,
    width: "16px",
    height: "16px",
    flexShrink: 0,
    // Optical alignment with the first text line.
    marginTop: "1px",
    boxSizing: "border-box",
    border: `1px solid ${vars.color.input}`,
    borderRadius: vars.radius.sm,
    backgroundColor: vars.color.surface,
    cursor: "inherit",
    display: "inline-grid",
    placeContent: "center",
    transition: `border-color ${vars.motion.durationFast} ${vars.motion.easing}, background-color ${vars.motion.durationFast} ${vars.motion.easing}, box-shadow ${vars.motion.durationFast} ${vars.motion.easing}`,
    selectors: {
        // The check: a rotated border-drawn tick, scaled in on :checked.
        "&::before": {
            content: "",
            width: "9px",
            height: "5px",
            marginTop: "-2px",
            borderLeft: `2px solid ${vars.color.accentText}`,
            borderBottom: `2px solid ${vars.color.accentText}`,
            transform: "rotate(-45deg) scale(0)",
            transition: `transform ${vars.motion.durationFast} ${vars.motion.easing}`,
        },
        "&:checked": {
            backgroundColor: vars.color.accent,
            borderColor: vars.color.accent,
        },
        "&:checked::before": {
            transform: "rotate(-45deg) scale(1)",
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
