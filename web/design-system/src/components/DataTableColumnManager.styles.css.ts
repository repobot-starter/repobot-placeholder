import { style } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

export const list = style({
    listStyle: "none",
    margin: 0,
    padding: 0,
    display: "grid",
    gap: vars.space.xxs,
})

export const item = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: vars.space.sm,
    padding: `${vars.space.xs} ${vars.space.sm}`,
    borderRadius: vars.radius.sm,
    selectors: {
        "&:hover": { backgroundColor: vars.color.surfaceHover },
    },
})

export const itemLabel = style({
    display: "flex",
    alignItems: "center",
    gap: vars.space.sm,
    fontSize: vars.fontSize.sm,
    color: vars.color.textPrimary,
    cursor: "pointer",
})

export const itemControls = style({
    display: "inline-flex",
    gap: vars.space.xxs,
})

export const moveButton = style({
    border: `1px solid ${vars.color.border}`,
    background: "transparent",
    color: vars.color.textSecondary,
    borderRadius: vars.radius.sm,
    width: "24px",
    height: "24px",
    lineHeight: 1,
    cursor: "pointer",
    selectors: {
        "&:hover:not(:disabled)": { backgroundColor: vars.color.surfaceHover, color: vars.color.textPrimary },
        "&:disabled": { opacity: 0.35, cursor: "default" },
    },
})
