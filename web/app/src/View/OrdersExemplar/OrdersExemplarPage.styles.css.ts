import { style } from "@vanilla-extract/css"
import { vars } from "@base/design-system/tokens"

export const page = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.lg,
    padding: vars.space.xl,
    maxWidth: "72rem",
    margin: "0 auto",
    minHeight: "100vh",
    backgroundColor: vars.color.background,
    color: vars.color.textPrimary,
    fontFamily: vars.fontFamily.body,
})

export const intro = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.xs,
})

export const introTitle = style({
    margin: 0,
    fontSize: vars.fontSize.xl,
    fontWeight: 700,
})

export const introSubtitle = style({
    margin: 0,
    fontSize: vars.fontSize.sm,
    color: vars.color.textSecondary,
    maxWidth: "48rem",
})

export const detail = style({
    display: "flex",
    flexDirection: "column",
    gap: vars.space.sm,
})

export const detailTitle = style({
    margin: 0,
    fontSize: vars.fontSize.xs,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: vars.color.textSecondary,
})
