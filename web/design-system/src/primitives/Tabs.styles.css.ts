import { style } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

export const root = style({
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
})

export const list = style({
    display: "flex",
    gap: vars.space.xs,
    borderBottom: `1px solid ${vars.color.border}`,
    overflowX: "auto",
})

export const trigger = style({
    appearance: "none",
    background: "transparent",
    border: "none",
    // Overlaps the list's border so the active underline sits on it.
    borderBottom: "2px solid transparent",
    marginBottom: "-1px",
    padding: `${vars.space.sm} ${vars.space.md}`,
    fontFamily: vars.fontFamily.body,
    fontSize: vars.fontSize.sm,
    fontWeight: 600,
    color: vars.color.textSecondary,
    whiteSpace: "nowrap",
    cursor: "pointer",
    transition: `color ${vars.motion.durationFast} ${vars.motion.easing}, border-color ${vars.motion.durationFast} ${vars.motion.easing}`,
    selectors: {
        "&:hover:not(:disabled)": { color: vars.color.textPrimary },
        '&[data-state="active"]': {
            color: vars.color.textPrimary,
            borderBottomColor: vars.color.accent,
        },
        "&:focus-visible": {
            outline: `2px solid ${vars.color.accent}`,
            outlineOffset: "-2px",
            borderRadius: vars.radius.sm,
        },
        "&:disabled": {
            opacity: 0.55,
            cursor: "not-allowed",
        },
    },
})

export const content = style({
    paddingTop: vars.space.lg,
    minWidth: 0,
    selectors: {
        "&:focus-visible": {
            outline: `2px solid ${vars.color.accent}`,
            outlineOffset: "2px",
            borderRadius: vars.radius.sm,
        },
    },
})
