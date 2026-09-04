import { style } from "@vanilla-extract/css"
import { vars } from "@base/design-system/tokens"

export const page = style({
    display: "grid",
    gap: vars.space.lg,
})

export const header = style({
    display: "grid",
    gap: vars.space.xs,
})

export const title = style({
    margin: 0,
    fontSize: vars.fontSize.xl,
    fontWeight: 700,
    color: vars.color.textPrimary,
})

export const subtitle = style({
    margin: 0,
    fontSize: vars.fontSize.sm,
    color: vars.color.textSecondary,
})

export const merchantCell = style({
    display: "inline-flex",
    alignItems: "center",
    gap: vars.space.sm,
    fontWeight: 500,
})

export const memberCell = style({
    display: "inline-flex",
    alignItems: "center",
    gap: vars.space.xs,
})

export const amountCell = style({
    fontWeight: 600,
    fontVariantNumeric: "tabular-nums",
})
