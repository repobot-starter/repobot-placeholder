import { style } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

export const toolbar = style({
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: vars.space.sm,
})

export const searchBox = style({
    flex: "1 1 14rem",
    maxWidth: "20rem",
    minWidth: "10rem",
})

export const chips = style({
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: vars.space.xs,
})

export const chip = style({
    display: "inline-flex",
    alignItems: "center",
    gap: vars.space.xs,
    padding: `${vars.space.xs} ${vars.space.sm}`,
    background: vars.color.surface,
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.pill,
    fontSize: vars.fontSize.sm,
    fontFamily: vars.fontFamily.body,
    color: vars.color.textSecondary,
    cursor: "pointer",
    selectors: {
        "&:hover": { backgroundColor: vars.color.surfaceHover },
    },
})

export const chipActive = style({
    borderColor: vars.color.accent,
    color: vars.color.textPrimary,
})

export const chipLabel = style({
    color: "inherit",
})

export const chipValue = style({
    fontWeight: 600,
    color: vars.color.accent,
})

export const spacer = style({
    flex: "1 0 0",
})

export const sort = style({
    minWidth: "10rem",
})
