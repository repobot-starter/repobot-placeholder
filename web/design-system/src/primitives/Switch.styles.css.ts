import { style } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

export const row = style({
    display: "inline-flex",
    alignItems: "center",
    gap: vars.space.sm,
    cursor: "pointer",
    selectors: {
        "&[data-disabled]": { cursor: "not-allowed", opacity: 0.55 },
    },
})

export const track = style({
    position: "relative",
    boxSizing: "border-box",
    width: "34px",
    height: "20px",
    flexShrink: 0,
    padding: 0,
    border: `1px solid ${vars.color.input}`,
    borderRadius: vars.radius.pill,
    backgroundColor: vars.color.muted,
    cursor: "inherit",
    transition: `background-color ${vars.motion.durationFast} ${vars.motion.easing}, border-color ${vars.motion.durationFast} ${vars.motion.easing}, box-shadow ${vars.motion.durationFast} ${vars.motion.easing}`,
    selectors: {
        '&[aria-checked="true"]': {
            backgroundColor: vars.color.accent,
            borderColor: vars.color.accent,
        },
        "&:focus-visible": {
            outline: "none",
            boxShadow: vars.treatment.focusRing,
        },
        "&:disabled": {
            cursor: "not-allowed",
        },
    },
    "@media": {
        "(prefers-reduced-motion: reduce)": {
            transition: "none",
        },
    },
})

export const thumb = style({
    position: "absolute",
    top: "2px",
    left: "2px",
    width: "14px",
    height: "14px",
    borderRadius: vars.radius.pill,
    backgroundColor: vars.color.surface,
    boxShadow: "0 1px 2px rgba(15, 18, 24, 0.25)",
    transition: `transform ${vars.motion.durationFast} ${vars.motion.easing}`,
    selectors: {
        [`${track}[aria-checked="true"] &`]: {
            transform: "translateX(14px)",
            backgroundColor: vars.color.accentText,
        },
    },
    "@media": {
        "(prefers-reduced-motion: reduce)": {
            transition: "none",
        },
    },
})

export const labelText = style({
    fontFamily: vars.fontFamily.body,
    fontSize: vars.fontSize.sm,
    color: vars.color.textPrimary,
})
