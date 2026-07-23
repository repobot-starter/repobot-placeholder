import { style } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

export const trigger = style({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: vars.space.sm,
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
    cursor: "pointer",
    selectors: {
        "&:focus": {
            outline: "none",
            borderColor: vars.color.accent,
            boxShadow: `0 0 0 3px ${vars.color.surfaceHover}`,
        },
        "&[data-placeholder]": { color: vars.color.textSecondary },
        "&[data-disabled]": { opacity: 0.55, cursor: "not-allowed" },
    },
})

export const invalid = style({
    borderColor: vars.color.danger,
})

export const icon = style({
    color: vars.color.textSecondary,
    display: "inline-flex",
})

export const content = style({
    overflow: "hidden",
    backgroundColor: vars.color.surface,
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.md,
    boxShadow: vars.shadow.md,
    zIndex: 60,
    minWidth: "var(--radix-select-trigger-width)",
})

export const viewport = style({
    padding: vars.space.xs,
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
        "&[data-state='checked']": { color: vars.color.accent, fontWeight: 600 },
        "&[data-disabled]": { opacity: 0.55, cursor: "not-allowed" },
    },
})
