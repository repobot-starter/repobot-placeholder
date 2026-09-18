import { style } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

export const content = style({
    minWidth: "160px",
    backgroundColor: vars.color.surface,
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.md,
    boxShadow: vars.shadow.md,
    padding: vars.space.xs,
    zIndex: 60,
})

export const item = style({
    display: "flex",
    alignItems: "center",
    padding: `${vars.space.sm} ${vars.space.md}`,
    borderRadius: vars.radius.sm,
    color: vars.color.textPrimary,
    fontSize: vars.fontSize.sm,
    fontFamily: vars.fontFamily.body,
    cursor: "pointer",
    userSelect: "none",
    outline: "none",
    selectors: {
        "&[data-highlighted]": { backgroundColor: vars.color.surfaceHover },
        "&[data-disabled]": { opacity: 0.55, cursor: "not-allowed" },
    },
})

export const dangerItem = style({
    color: vars.color.danger,
    selectors: {
        "&[data-highlighted]": { backgroundColor: vars.color.dangerSurface },
    },
})
