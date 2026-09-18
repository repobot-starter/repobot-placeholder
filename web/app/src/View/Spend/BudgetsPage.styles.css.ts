import { style, styleVariants } from "@vanilla-extract/css"
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

export const grid = style({
    display: "grid",
    gap: vars.space.md,
    gridTemplateColumns: "repeat(auto-fill, minmax(15rem, 1fr))",
})

export const budgetCard = style({
    display: "grid",
    gap: vars.space.sm,
    padding: vars.space.lg,
    background: vars.color.surface,
    border: `1px solid ${vars.color.border}`,
    borderRadius: vars.radius.lg,
})

export const budgetHeader = style({
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: vars.space.sm,
})

export const budgetName = style({
    fontSize: vars.fontSize.sm,
    fontWeight: 600,
    color: vars.color.textPrimary,
})

export const budgetNumbers = style({
    display: "flex",
    alignItems: "baseline",
    gap: vars.space.xs,
})

export const budgetSpent = style({
    fontSize: vars.fontSize.xl,
    fontWeight: 700,
    color: vars.color.textPrimary,
    fontVariantNumeric: "tabular-nums",
})

export const budgetLimit = style({
    fontSize: vars.fontSize.xs,
    color: vars.color.textSecondary,
})

export const meter = style({
    height: "6px",
    borderRadius: vars.radius.pill,
    background: vars.color.muted,
    overflow: "hidden",
})

export const meterFill = style({
    height: "100%",
    borderRadius: vars.radius.pill,
    transition: "width 240ms ease",
})

export const meterTone = styleVariants({
    success: { background: vars.color.success },
    warning: { background: vars.color.warning },
    danger: { background: vars.color.danger },
})

export const budgetPct = style({
    fontSize: vars.fontSize.xs,
    color: vars.color.textSecondary,
    fontVariantNumeric: "tabular-nums",
})
