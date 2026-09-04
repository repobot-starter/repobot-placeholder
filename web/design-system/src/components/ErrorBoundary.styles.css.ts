import { style } from "@vanilla-extract/css"
import { vars } from "../theme/tokens.css"

export const panel = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.sm,
    padding: vars.space.lg,
    backgroundColor: vars.color.dangerSurface,
    border: `1px solid ${vars.color.danger}`,
    borderRadius: vars.radius.md,
    color: vars.color.textPrimary,
})

export const title = style({
    margin: 0,
    fontSize: vars.fontSize.md,
    fontWeight: 700,
    color: vars.color.danger,
})

export const message = style({
    margin: 0,
    fontSize: vars.fontSize.sm,
    fontFamily: vars.fontFamily.mono,
    color: vars.color.textSecondary,
    overflowWrap: "anywhere",
})

export const actions = style({
    display: "flex",
    gap: vars.space.sm,
})
